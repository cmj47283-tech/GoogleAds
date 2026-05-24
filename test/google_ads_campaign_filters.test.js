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
      GOOGLE_ADS_PAGE: 'campaigns',
      location: {
        origin: 'https://localhost',
        pathname: '/aw/campaigns',
        search: ''
      },
      history: {
        pushState() {}
      },
      setTimeout,
      clearTimeout
    },
    document: {
      querySelector() {
        return null;
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

test('campaigns page can render the page-level status filters', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'views', 'google_ads.ejs'), 'utf8');
  const contextBarIndex = template.indexOf('class="ga-context-bar"');
  const filterRowIndex = template.indexOf('class="ga-page-filter-row"');
  const pageHeadIndex = template.indexOf('class="ga-page-head"');

  assert.ok(contextBarIndex >= 0);
  assert.ok(filterRowIndex > contextBarIndex);
  assert.ok(filterRowIndex < pageHeadIndex);
  assert.match(
    template,
    /<section\s+v-if="pageMode === 'campaigns' \|\| pageMode === 'reporteditor' \|\| pageMode === 'overview'"\s+class="ga-page-filter-row"/
  );
  assert.doesNotMatch(template, /ga-page-filter-row[^>]*pageMode === 'adassets'/);
  assert.match(template, /Campaign status: All/);
  assert.match(template, /Ad group status: Enabled, Paused/);
  assert.match(template, /Add filter/);
});

test('campaigns table renders migrated campaign filter controls and sortable headers', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'views', 'google_ads.ejs'), 'utf8');
  const script = fs.readFileSync(path.join(__dirname, '..', 'public', 'google_ads.js'), 'utf8');

  assert.match(template, /class="ga-toolbar-filter filter-dropdown-wrapper"/);
  assert.match(template, /v-if="activeCampaignFilterTag"/);
  assert.match(template, /v-for="filter in displayCampaignFilters"/);
  assert.match(script, /Ad device preference type/);
  assert.doesNotMatch(template, /filter\.description/);
  assert.match(template, /v-model="campaignFilterOperator"/);
  assert.match(template, /v-model="campaignFilterValueInput"/);
  assert.match(template, /@click="applyCampaignFilterValue"/);
  assert.match(template, /@click="toggleCampaignSort\('campaign'\)"/);
  assert.match(template, /@click="toggleCampaignSort\('installs'\)"/);
});

test('campaign rows can be filtered by campaign name and sorted by campaign or installs', () => {
  const config = loadGoogleAdsAppConfig();
  const context = {
    ...config.data(),
    ...config.methods,
    data: {
      campaigns: [
        { id: 'a', campaign: 'Beta App', installs: 12, isRemoved: false },
        { id: 'b', campaign: 'Alpha App', installs: 3, isRemoved: false },
        { id: 'c', campaign: 'Gamma App', installs: 30, isRemoved: true }
      ]
    },
    $nextTick(callback) {
      if (callback) callback();
    }
  };

  assert.ok(context.campaignFilterOptions.length > 20);
  assert.equal(context.campaignFilterOptions[0].name, 'Ad device preference type');

  assert.deepEqual(
    config.computed.campaignRows.call(context).map(row => row.campaign),
    ['Alpha App', 'Beta App']
  );

  context.campaignFilterOperator = 'contains';
  context.campaignFilterValueInput = 'Beta';
  config.methods.applyCampaignFilterValue.call(context);

  assert.equal(config.computed.activeCampaignFilterTag.call(context), 'Campaign contains Beta');
  assert.deepEqual(
    config.computed.campaignRows.call(context).map(row => row.campaign),
    ['Beta App']
  );

  config.methods.clearActiveCampaignFilter.call(context);
  config.methods.toggleCampaignSort.call(context, 'installs');
  assert.equal(context.campaignSortKey, 'installs');
  assert.equal(context.campaignSortDirection, 'asc');
  assert.deepEqual(
    config.computed.campaignRows.call(context).map(row => row.campaign),
    ['Alpha App', 'Beta App']
  );

  config.methods.toggleCampaignSort.call(context, 'installs');
  assert.equal(context.campaignSortDirection, 'desc');
  assert.deepEqual(
    config.computed.campaignRows.call(context).map(row => row.campaign),
    ['Beta App', 'Alpha App']
  );
});
