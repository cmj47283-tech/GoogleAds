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

function loadCampaignsAppConfig() {
  const code = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
  const sandbox = {
    console,
    Date,
    Math,
    Promise,
    setTimeout,
    fetch() {
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve([]);
        }
      });
    },
    localStorage: createMemoryStorage(),
    document: {
      addEventListener() {},
      removeEventListener() {}
    },
    window: {
      scrollTo() {}
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
  vm.runInContext(code, sandbox, { filename: 'public/app.js' });
  return sandbox.appConfig;
}

test('campaigns show rows defaults to 30', () => {
  const config = loadCampaignsAppConfig();
  const state = config.data();

  assert.equal(state.pageSize, 30);
  assert.deepEqual(Array.from(state.pageSizeOptions), [10, 30, 50, 100]);
});
