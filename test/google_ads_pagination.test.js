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
    },
    removeItem(key) {
      store.delete(key);
    }
  };
}

function loadGoogleAdsAppConfig(pageMode = 'campaigns') {
  const code = fs.readFileSync(path.join(__dirname, '..', 'public', 'google_ads.js'), 'utf8');
  const sandbox = {
    console,
    Date,
    Math,
    URLSearchParams,
    localStorage: createMemoryStorage(),
    sessionStorage: createMemoryStorage(),
    document: {
      querySelector() {
        return null;
      }
    },
    window: {
      GOOGLE_ADS_PAGE: pageMode,
      innerWidth: 1400,
      location: {
        pathname: `/aw/${pageMode}`,
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

test('google ads pages default show rows to 30 and allow changing page size', () => {
  for (const pageMode of ['campaigns', 'adgroups', 'adassets']) {
    const config = loadGoogleAdsAppConfig(pageMode);
    const state = config.data();

    assert.equal(state.pageSize, 30);
    assert.deepEqual(Array.from(state.pageSizeOptions), [10, 30, 50, 100]);
    assert.equal(state.showPageSizeDropdown, false);
    assert.equal(typeof config.methods.setPageSize, 'function');

    const context = {
      ...state,
      currentPage: 3,
      showPageSizeDropdown: true
    };
    config.methods.setPageSize.call(context, 50);

    assert.equal(context.pageSize, 50);
    assert.equal(context.currentPage, 1);
    assert.equal(context.showPageSizeDropdown, false);
  }
});

test('google ads tables render paginated rows and selectable show rows options', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'views', 'google_ads.ejs'), 'utf8');

  assert.match(template, /v-for="\(\s*campaign,\s*index\s*\) in paginatedCampaignRows"/);
  assert.match(template, /v-for="\(\s*adGroup,\s*index\s*\) in paginatedAdGroupRows"/);
  assert.match(template, /v-for="asset in paginatedAssetRows"/);
  assert.match(template, /v-for="option in pageSizeOptions"/);
  assert.match(template, /@click\.stop="setPageSize\(option\)"/);
  assert.doesNotMatch(template, /\{\{\s*pageMode === 'campaigns' \? 100 : 50\s*\}\}/);
});

test('show rows menu options stack vertically', () => {
  const styles = fs.readFileSync(path.join(__dirname, '..', 'public', 'google_ads.css'), 'utf8');

  assert.match(styles, /\.ga-page-size-menu\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s);
  assert.match(styles, /\.ga-page-size-menu button\s*\{[^}]*display:\s*flex;/s);
});
