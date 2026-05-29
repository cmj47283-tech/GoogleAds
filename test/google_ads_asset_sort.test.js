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

test('asset rows use cost-gated minimum metrics without install or action fallback', () => {
  const config = loadGoogleAdsAppConfig();
  const context = createAssetContext(config);
  context.adGroupTotal = {
    clicks: 0,
    impressions: 0,
    cost: 1,
    installs: 0,
    inAppActions: 0
  };

  const rows = config.computed.assetRows.call(context);

  assert.equal(rows.length, 3);
  for (const row of rows) {
    assert.ok(row.clicks >= 1 && row.clicks <= 10);
    assert.ok(row.impressions >= 11 && row.impressions <= 50);
    assert.ok(row.cost >= 0.1 && row.cost <= 2);
    assert.equal(row.installs, 0);
    assert.equal(row.inAppActions, 0);
  }
});

test('manual campaign status applies across all date rows', () => {
  const config = loadGoogleAdsAppConfig();
  const context = {
    ...config.data(),
    ...config.methods,
    startDate: new Date(2026, 4, 23),
    endDate: new Date(2026, 4, 23),
    rawData: [
      { campaign: 'Campaign A', Status: 'Eligible', date: '2026-05-23', AdGroup: 'Ad group 1' },
      { campaign: 'Campaign A', Status: 'Paused', date: '2026-05-24', AdGroup: 'Ad group 1' }
    ],
    filteredRawData: [
      { campaign: 'Campaign A', Status: 'Eligible', date: '2026-05-23', AdGroup: 'Ad group 1' }
    ],
    data: {
      ...config.data().data,
      campaigns: []
    }
  };

  context.refreshCampaignData();
  context.setCampaignStatus({ campaign: 'Campaign A' }, 'Paused');

  assert.deepEqual(context.rawData.map(row => row.Status), ['Paused', 'Paused']);
  assert.equal(context.campaignStatusOverrides['Campaign A'], 'Paused');
  assert.equal(context.data.campaigns[0].Status, 'Paused');
});

test('campaign status maps to ad group and ad asset statuses', () => {
  const config = loadGoogleAdsAppConfig();
  const context = createAssetContext(config);
  context.rawData = [
    {
      campaign: 'Campaign A',
      Status: 'Paused',
      date: '2026-05-23',
      AdGroup: 'Ad group 1',
      TargetCPA: 20
    }
  ];
  context.selectedCampaignId = 'Campaign A';
  context.selectedCampaign = { campaign: 'Campaign A', Status: 'Paused' };

  const adGroupRows = config.methods.mergeAdGroupsBy.call(context, context.rawData, 'Campaign A');
  const assetRows = config.computed.assetRows.call(context);

  assert.equal(adGroupRows[0].Status, 'Not eligible Campaign is paused');
  assert.ok(assetRows.every(row => row.status === 'Not eligible Campaign is paused'));

  assert.equal(
    context.campaignLinkedStatuses({ campaign: 'Campaign A', Status: 'Paused All ad groups disapproved' }).adGroupStatus,
    'Not eligible Ad group is disapproved, Campaign is paused'
  );
});
