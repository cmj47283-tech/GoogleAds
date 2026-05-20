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
    },
    clear() {
      store.clear();
    }
  };
}

function loadGoogleAdsAppConfig() {
  const code = fs.readFileSync(path.join(__dirname, '..', 'public', 'google_ads.js'), 'utf8');
  const sandboxMath = Object.create(Math);
  sandboxMath.random = () => 0.5;
  const sandbox = {
    console,
    Math: sandboxMath,
    URLSearchParams,
    localStorage: createMemoryStorage(),
    sessionStorage: createMemoryStorage(),
    window: {
      GOOGLE_ADS_PAGE: 'adassets',
      location: {
        pathname: '/aw/adassets',
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

function createAssetContext(config) {
  return {
    ...config.data(),
    ...config.methods,
    adGroupTotal: {
      clicks: 120,
      impressions: 1200,
      cost: 60,
      installs: 12,
      inAppActions: 6
    },
    adAssetData: [
      { id: 'image-1', asset: '1080 x 1080', assetType: 'Image', status: 'Eligible', performance: 'Pending' },
      { id: 'headline-1', asset: 'Buy now', assetType: 'Headline', status: 'Eligible', performance: 'Pending' },
      { id: 'description-1', asset: 'Free shipping', assetType: 'Description', status: 'Eligible', performance: 'Pending' }
    ]
  };
}

function assetTypes(rows) {
  return JSON.parse(JSON.stringify(rows.map(asset => asset.assetType)));
}

test('asset rows sort by asset type and toggle direction', () => {
  const config = loadGoogleAdsAppConfig();
  const context = createAssetContext(config);

  assert.equal(typeof config.methods.toggleAssetSort, 'function');

  config.methods.toggleAssetSort.call(context, 'assetType');
  assert.equal(context.assetSortKey, 'assetType');
  assert.equal(context.assetSortDirection, 'asc');
  assert.deepEqual(assetTypes(config.computed.assetRows.call(context)), ['Description', 'Headline', 'Image']);

  config.methods.toggleAssetSort.call(context, 'assetType');
  assert.equal(context.assetSortDirection, 'desc');
  assert.deepEqual(assetTypes(config.computed.assetRows.call(context)), ['Image', 'Headline', 'Description']);
});
