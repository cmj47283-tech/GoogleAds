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

test('campaigns page renders the interactive add filter control', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'views', 'google_ads.ejs'), 'utf8');
  const styles = fs.readFileSync(path.join(__dirname, '..', 'public', 'google_ads.css'), 'utf8');

  assert.match(template, /<div\s+v-if="pageMode === 'campaigns'"\s+class="ga-toolbar-filter filter-dropdown-wrapper"/);
  assert.match(template, /ref="filterDropdownRef"/);
  assert.match(template, /class="thead"\s+@click\.stop="openFilterDropdown">Add filter<\/div>/);
  assert.match(template, /v-model="filterText"\s+@input="openFilterDropdown"\s+@focus="openFilterDropdown"/);
  assert.match(template, /class="filter-selector-dropdown"/);
  assert.match(template, /class="filter-value-modal"/);
  assert.match(template, /contains/);
  assert.match(template, /does not contain/);
  assert.doesNotMatch(template, /<section\s+v-if="pageMode === 'campaigns'"\s+class="filter-bar"/);
  assert.match(styles, /\.ga-toolbar-filter\s+\.filter-value-btn\.apply-btn\s*\{[^}]*color:\s*#1a73e8;/s);
});

test('campaign filters narrow the campaigns table on the campaigns page only', () => {
  const config = loadGoogleAdsAppConfig('campaigns');
  const context = {
    ...config.data(),
    ...config.methods,
    pageMode: 'campaigns',
    selectedFilterName: 'Campaign name',
    filterOperator: 'contains',
    campaignNameFilter: 'alpha',
    data: {
      ...config.data().data,
      campaigns: [
        { campaign: 'Alpha Launch', cost: 10, impressions: 100, clicks: 10, installs: 2, inAppActions: 1, Conversions: 1, ViewThroughConv: 0 },
        { campaign: 'Beta Test', cost: 20, impressions: 200, clicks: 20, installs: 4, inAppActions: 2, Conversions: 2, ViewThroughConv: 0 },
        { campaign: 'Alpha Retargeting', cost: 30, impressions: 300, clicks: 30, installs: 6, inAppActions: 3, Conversions: 3, ViewThroughConv: 0 }
      ]
    }
  };

  context.campaignRows = config.computed.campaignRows.call(context);
  context.filteredCampaignRows = config.computed.filteredCampaignRows.call(context);

  assert.deepEqual(
    Array.from(context.filteredCampaignRows.map(row => row.campaign)),
    ['Alpha Launch', 'Alpha Retargeting']
  );
  assert.equal(config.computed.campaignSelectorLabel.call(context), 'Campaigns (2)');
  assert.equal(config.computed.activeRows.call(context).length, 2);
  assert.equal(config.computed.totals.call(context).cost, 40);
  assert.equal(config.computed.selectedCampaign.call(context).campaign, 'Alpha Launch');
  assert.equal(config.computed.paginationText.call({
    ...context,
    pageSize: 30,
    currentPage: 1,
    activeRows: context.filteredCampaignRows,
    pageStartIndex: 0
  }), '1 - 2 of 2');
});

test('campaign filters do not affect other page modes', () => {
  const config = loadGoogleAdsAppConfig('adgroups');
  const context = {
    ...config.data(),
    ...config.methods,
    pageMode: 'adgroups',
    selectedFilterName: 'Campaign name',
    filterOperator: 'contains',
    campaignNameFilter: 'alpha',
    data: {
      ...config.data().data,
      campaigns: [
        { campaign: 'Alpha Launch', cost: 10, impressions: 100, clicks: 10, installs: 2, inAppActions: 1, Conversions: 1, ViewThroughConv: 0 },
        { campaign: 'Beta Test', cost: 20, impressions: 200, clicks: 20, installs: 4, inAppActions: 2, Conversions: 2, ViewThroughConv: 0 }
      ]
    }
  };

  context.campaignRows = config.computed.campaignRows.call(context);
  assert.equal(config.computed.filteredCampaignRows.call(context).length, 2);
  assert.equal(config.computed.campaignSelectorLabel.call(context), 'Campaign');
});

test('campaign add filter uses the report editor filter list', () => {
  const config = loadGoogleAdsAppConfig('campaigns');
  const context = {
    ...config.data(),
    ...config.methods,
    filterText: ''
  };

  assert.deepEqual(
    Array.from(config.computed.displayFilters.call(context).slice(0, 8).map(filter => filter.name)),
    [
      'Ad device preference type',
      'Ad group',
      'Ad group bid strategy type',
      'Ad group name',
      'Ad group performance',
      'Ad group state',
      'Ad group status',
      'Ad group type'
    ]
  );

  context.filterText = 'campaign';
  assert.ok(config.computed.displayFilters.call(context).some(filter => filter.name === 'Campaign name'));
});

test('campaign add filter opens the selector and applies a campaign name filter', () => {
  const config = loadGoogleAdsAppConfig('campaigns');
  const context = {
    ...config.data(),
    ...config.methods,
    $refs: {
      filterDropdownRef: {
        contains() {
          return true;
        }
      }
    }
  };

  config.methods.openFilterDropdown.call(context);
  assert.equal(context.showFilterDropdown, true);

  config.methods.selectFilter.call(context, { id: 'campaign-name', name: 'Campaign name' });
  assert.equal(context.selectedFilterName, 'Campaign name');
  assert.equal(context.showFilterDropdown, false);
  assert.equal(context.showFilterValueModal, true);

  context.filterValueInput = 'GG11-7U7-58';
  config.methods.applyFilterValue.call(context);
  assert.equal(context.campaignNameFilter, 'GG11-7U7-58');
  assert.equal(context.showFilterValueModal, false);
  assert.equal(context.currentPage, 1);
  assert.equal(context.showFilterTagClose, true);
  assert.equal(config.computed.activeFilterTag.call(context), 'Campaign name contains GG11-7U7-58');

  config.methods.clearActiveFilter.call(context);
  assert.equal(context.campaignNameFilter, '');
  assert.equal(context.selectedFilterName, '');
  assert.equal(config.computed.activeFilterTag.call(context), null);
});

test('campaign table sorts campaigns by campaign name, cost, cost per install, and installs', () => {
  const config = loadGoogleAdsAppConfig('campaigns');
  const context = {
    ...config.data(),
    ...config.methods,
    pageMode: 'campaigns',
    data: {
      ...config.data().data,
      campaigns: [
        { campaign: 'Campaign 2', cost: 50, costPerInstall: 3, installs: 20 },
        { campaign: 'Campaign 10', cost: 10, costPerInstall: 8, installs: 5 },
        { campaign: 'Campaign 1', cost: 30, costPerInstall: 5, installs: 12 }
      ]
    }
  };
  context.campaignRows = config.computed.campaignRows.call(context);

  assert.deepEqual(
    config.computed.filteredCampaignRows.call(context).map(row => row.campaign),
    ['Campaign 1', 'Campaign 2', 'Campaign 10']
  );

  context.toggleCampaignSort('cost');
  assert.equal(context.campaignSortKey, 'cost');
  assert.equal(context.campaignSortDirection, 'desc');
  assert.deepEqual(
    config.computed.filteredCampaignRows.call(context).map(row => row.campaign),
    ['Campaign 2', 'Campaign 1', 'Campaign 10']
  );

  context.toggleCampaignSort('cost');
  assert.equal(context.campaignSortDirection, 'asc');
  assert.deepEqual(
    config.computed.filteredCampaignRows.call(context).map(row => row.campaign),
    ['Campaign 10', 'Campaign 1', 'Campaign 2']
  );

  context.toggleCampaignSort('costPerInstall');
  assert.equal(context.campaignSortKey, 'costPerInstall');
  assert.equal(context.campaignSortDirection, 'desc');
  assert.deepEqual(
    config.computed.filteredCampaignRows.call(context).map(row => row.campaign),
    ['Campaign 10', 'Campaign 1', 'Campaign 2']
  );

  context.toggleCampaignSort('costPerInstall');
  assert.equal(context.campaignSortDirection, 'asc');
  assert.deepEqual(
    config.computed.filteredCampaignRows.call(context).map(row => row.campaign),
    ['Campaign 2', 'Campaign 1', 'Campaign 10']
  );

  context.toggleCampaignSort('installs');
  assert.equal(context.campaignSortKey, 'installs');
  assert.equal(context.campaignSortDirection, 'desc');
  assert.deepEqual(
    config.computed.filteredCampaignRows.call(context).map(row => row.campaign),
    ['Campaign 2', 'Campaign 1', 'Campaign 10']
  );

  context.toggleCampaignSort('installs');
  assert.equal(context.campaignSortDirection, 'asc');
  assert.deepEqual(
    config.computed.filteredCampaignRows.call(context).map(row => row.campaign),
    ['Campaign 10', 'Campaign 1', 'Campaign 2']
  );
});

test('campaigns table freezes the toolbar header rows and left campaign columns', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'views', 'google_ads.ejs'), 'utf8');
  const styles = fs.readFileSync(path.join(__dirname, '..', 'public', 'google_ads.css'), 'utf8');
  const script = fs.readFileSync(path.join(__dirname, '..', 'public', 'google_ads.js'), 'utf8');

  const scrollIndex = template.indexOf('class="ga-table-scroll"');
  const toolbarIndex = template.indexOf('class="ga-table-toolbar"');
  const campaignsTableIndex = template.indexOf('class="ga-data-table campaigns"');

  assert.ok(scrollIndex >= 0);
  assert.ok(toolbarIndex > scrollIndex);
  assert.ok(campaignsTableIndex > scrollIndex);
  assert.match(template, /'ga-table-panel--campaigns':\s*pageMode === 'campaigns'/);
  assert.match(template, /v-if="pageMode === 'campaigns'"\s+class="ga-campaigns-ref-strip"/);
  assert.match(template, /Campaign status:\s*Enabled,\s*Paused/);
  assert.match(template, /Ad group status:\s*Enabled,\s*Paused/);
  assert.match(styles, /\.ga-table-toolbar\s*\{[^}]*position:\s*sticky;[^}]*top:\s*72px;/s);
  assert.match(styles, /\.ga-campaigns-ref-strip\s*\{[^}]*border-bottom:\s*1px solid #dadce0;[^}]*background:\s*#eef0f1;/s);
  assert.match(template, /@click="toggleCampaignSort\('campaign'\)"/);
  assert.match(template, /@click="toggleCampaignSort\('cost'\)"/);
  assert.match(template, /@click="toggleCampaignSort\('costPerInstall'\)"/);
  assert.match(template, /@click="toggleCampaignSort\('installs'\)"/);
  assert.match(styles, /\.ga-table-panel--campaigns\s+\.ga-table-toolbar\s*\{[^}]*top:\s*0;[^}]*z-index:\s*45;[^}]*background:\s*#eef0f1;/s);
  assert.match(styles, /\.ga-table-scroll\s*\{[^}]*overflow:\s*auto;[^}]*max-height:\s*calc\(100vh - 240px\);/s);
  assert.match(styles, /\.ga-table-scroll-inner\s*\{[^}]*overflow:\s*visible;[^}]*max-height:\s*none;/s);
  assert.match(styles, /\.ga-table-panel--campaigns\s+\.ga-table-scroll\s*\{[^}]*overflow:\s*auto;[^}]*max-height:\s*calc\(100vh - 342px\);/s);
  assert.match(styles, /\.ga-data-table\.campaigns thead th\s*\{[^}]*position:\s*sticky;[^}]*top:\s*56px;/s);
  assert.match(styles, /\.ga-data-table\.campaigns th\.select-col,[\s\S]*?left:\s*0;/);
  assert.match(styles, /\.ga-data-table\.campaigns th\.state-col,[\s\S]*?left:\s*var\(--ga-campaign-select-col-width\);/);
  assert.match(styles, /\.ga-data-table\.campaigns th\.name-col,[\s\S]*?left:\s*calc\(var\(--ga-campaign-select-col-width\) \+ var\(--ga-campaign-state-col-width\)\);/);
  assert.doesNotMatch(styles, /\.ga-data-table\.campaigns\s+\.draft-row td\s*\{[^}]*top:\s*74px;/s);
  assert.match(script, /mainElement\.style\.setProperty\('--ga-main-scroll-left',\s*`\$\{mainElement\.scrollLeft\}px`\);/);
});
