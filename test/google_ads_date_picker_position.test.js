const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    }
  };
}

function loadGoogleAdsAppConfig() {
  const code = fs.readFileSync(path.join(__dirname, '..', 'public', 'google_ads.js'), 'utf8');
  const sandbox = {
    console,
    Math,
    URLSearchParams,
    localStorage: createMemoryStorage(),
    sessionStorage: createMemoryStorage(),
    document: {
      querySelector() {
        return { scrollTop: 72 };
      }
    },
    window: {
      GOOGLE_ADS_PAGE: 'campaigns',
      innerWidth: 1400,
      requestAnimationFrame(callback) {
        callback();
      },
      setTimeout() {},
      location: {
        pathname: '/aw/campaigns',
        search: ''
      }
    },
    Vue: {
      createApp(config) {
        sandbox.appConfig = config;
        return {
          mount() {
            return config;
          }
        };
      }
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'public/google_ads.js' });
  return sandbox.appConfig;
}

test('open date picker repositions when the campaign page scrolls', () => {
  const config = loadGoogleAdsAppConfig();
  const dateButtonRect = { bottom: 220, left: 700 };
  const context = {
    ...config.data(),
    ...config.methods,
    showDatePicker: true,
    $refs: {
      dateSelectRef: {
        getBoundingClientRect() {
          return dateButtonRect;
        }
      }
    },
    $nextTick(callback) {
      callback();
    }
  };

  const style = config.computed.dropdownStyle.call(context);
  assert.equal(style.position, 'fixed');
  assert.equal(style.top, '228px');
  assert.equal(style.left, '700px');

  assert.equal(context.datePickerPositionTick, 0);
  config.methods.handleScroll.call(context);
  assert.equal(context.isContextBarHidden, true);
  assert.ok(context.datePickerPositionTick > 0);
});
