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

function loadReportEditorAppConfig() {
  const code = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
  const sandbox = {
    console,
    Date,
    Math,
    Promise,
    JSON,
    setTimeout(callback) {
      sandbox.pendingTimeout = callback;
      return 1;
    },
    fetch() {
      sandbox.fetchCount += 1;
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve([
            {
              campaign: 'Campaign refreshed',
              date: '2026-05-19',
              cost: 1,
              impressions: 10,
              clicks: 1,
              installs: 1,
              inAppActions: 1,
              costPerInstall: 1,
              costPerInAppActions: 1,
              ctr: 10
            },
            {
              campaign: 'Campaign outside range',
              date: '2026-05-20',
              cost: 2,
              impressions: 20,
              clicks: 2,
              installs: 2,
              inAppActions: 2,
              costPerInstall: 2,
              costPerInAppActions: 2,
              ctr: 10
            }
          ]);
        }
      });
    },
    fetchCount: 0,
    localStorage: createMemoryStorage(),
    document: {
      addEventListener() {},
      removeEventListener() {},
      body: {
        classList: {
          add() {},
          remove() {}
        }
      }
    },
    window: {
      scrollTo() {
        sandbox.scrolled = true;
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
  vm.runInContext(code, sandbox, { filename: 'public/app.js' });
  return { config: sandbox.appConfig, sandbox };
}

test('report editor refresh state is scoped to the table only', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'views', 'index.ejs'), 'utf8');
  const styles = fs.readFileSync(path.join(__dirname, '..', 'public', 'style.css'), 'utf8');

  assert.match(template, /id="report-boot-loader"\s+class="report-boot-loader"/);
  assert.match(template, /class="report-boot-progress"/);
  assert.match(template, /class="report-boot-logo"/);
  assert.match(styles, /\.report-boot-loader\s*\{[^}]*position:\s*fixed/s);
  assert.match(styles, /\.report-boot-progress span\s*\{[^}]*animation:\s*report-boot-progress/s);
  assert.match(styles, /\.report-boot-logo-blue\s*\{[^}]*background:\s*#4285f4/s);
  assert.match(template, /<th\s+v-show="hasCampaignId"\s+class="col-campaign-id"/);
  assert.match(template, /<td\s+v-show="hasCampaignId"\s+class="col-campaign-id"/);
  assert.match(template, /class="table-wrapper"\s+:class="\{\s*'is-reloading':\s*isRefreshing\s*\}"/);
  assert.match(template, /class="table-refresh-overlay"/);
  assert.match(styles, /\.data-table\.is-reloading tbody td\.col-campaign-id/);
  assert.match(styles, /\.data-table\.is-reloading tbody td\.col-campaign-id::after/);
  assert.match(styles, /\.table-wrapper\.is-reloading\s*\{[^}]*cursor:\s*progress/s);
  assert.match(styles, /\.table-refresh-overlay\s*\{[^}]*position:\s*absolute/s);
  assert.match(styles, /\.table-refresh-progress::before/);
  assert.doesNotMatch(template, /page-refresh-overlay/);
  assert.doesNotMatch(template, /refresh-below-reveal/);
  assert.doesNotMatch(styles, /page-refresh-overlay/);
  assert.doesNotMatch(styles, /refresh-below-reveal/);
});

test('refreshing report editor opens the generate report side panel', async () => {
  const { config, sandbox } = loadReportEditorAppConfig();
  const context = {
    ...config.data(),
    ...config.methods,
    $nextTick() {
      return Promise.resolve();
    },
    showRightPanel: false,
    showDatePicker: true
  };

  const refreshPromise = config.methods.refreshPage.call(context);
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(context.showRightPanel, true);
  assert.equal(context.showDatePicker, false);

  sandbox.pendingTimeout();
  await refreshPromise;
});

test('opening and changing the report editor date picker jumps to selected date without smooth scrolling', () => {
  const { config, sandbox } = loadReportEditorAppConfig();
  const scrollIntoViewCalls = [];
  sandbox.document.querySelector = selector => {
    if (selector === '.calendar-months-scroll') return { scrollTop: 0 };
    if (selector === '.calendar-day.selected') {
      return {
        scrollIntoView(options) {
          scrollIntoViewCalls.push(options);
        }
      };
    }
    return null;
  };
  const context = {
    ...config.data(),
    ...config.methods,
    startDate: new Date(2026, 4, 20),
    endDate: new Date(2026, 4, 20),
    appliedDateOption: 'custom',
    $nextTick(callback) {
      callback();
    },
    $refs: {
      dateSelectRef: {}
    }
  };

  config.methods.toggleDatePicker.call(context, { stopPropagation() {} });
  config.methods.selectDateOption.call(context, 'custom', { skipApply: true });

  assert.equal(scrollIntoViewCalls.length, 2);
  assert.ok(scrollIntoViewCalls.every(call => call.behavior === 'auto'));
  assert.ok(scrollIntoViewCalls.every(call => call.block === 'center'));
});

test('applying a report editor date range shows the table loading state while data reloads', async () => {
  const { config, sandbox } = loadReportEditorAppConfig();
  const context = {
    ...config.data(),
    ...config.methods,
    $nextTick() {
      return Promise.resolve();
    },
    draftStartDate: new Date(2026, 4, 1),
    draftEndDate: new Date(2026, 4, 19),
    selectedDateOption: 'custom',
    showDatePicker: true,
    showPageSizeDropdown: true,
    currentPage: 3
  };

  const applyPromise = config.methods.applyDateRange.call(context);
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(context.isRefreshing, true);
  assert.equal(context.showDatePicker, false);
  assert.equal(context.showPageSizeDropdown, false);
  assert.equal(context.currentPage, 1);
  assert.equal(sandbox.fetchCount, 1);
  assert.equal(sandbox.scrolled, undefined);

  sandbox.pendingTimeout();
  await applyPromise;

  assert.equal(context.isRefreshing, false);
  assert.equal(context.campaigns[0].campaign, 'Campaign refreshed');
  assert.deepEqual(
    config.computed.filteredCampaigns.call(context).map(campaign => campaign.campaign),
    ['Campaign refreshed']
  );
});

test('selecting a complete custom date range waits for Apply before reloading data', async () => {
  const { config, sandbox } = loadReportEditorAppConfig();
  const context = {
    ...config.data(),
    ...config.methods,
    $nextTick() {
      return Promise.resolve();
    },
    draftStartDate: new Date(2026, 4, 13),
    draftEndDate: null,
    selectedDateOption: 'custom',
    appliedDateOption: 'last7Days',
    showDatePicker: true,
    showPageSizeDropdown: true,
    currentPage: 2,
    selectingStartDate: false
  };

  config.methods.selectCalendarDate.call(context, new Date(2026, 4, 19));
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(context.selectedDateOption, 'custom');
  assert.equal(context.appliedDateOption, 'last7Days');
  assert.equal(context.showDatePicker, true);
  assert.equal(context.isRefreshing, false);
  assert.equal(context.currentPage, 2);
  assert.equal(sandbox.fetchCount, 0);
  assert.equal(context.startDate, null);
  assert.equal(context.endDate, null);
  assert.equal(context.formatDate(context.draftStartDate), 'May 13, 2026');
  assert.equal(context.formatDate(context.draftEndDate), 'May 19, 2026');
});

test('selecting a preset date range applies and reloads data without pressing Apply', async () => {
  const { config, sandbox } = loadReportEditorAppConfig();
  const context = {
    ...config.data(),
    ...config.methods,
    $nextTick() {
      return Promise.resolve();
    },
    selectedDateOption: 'custom',
    appliedDateOption: 'custom',
    showDatePicker: true,
    showPageSizeDropdown: true,
    currentPage: 2
  };

  const selectPromise = config.methods.selectDateOption.call(context, 'yesterday');
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(context.selectedDateOption, 'yesterday');
  assert.equal(context.appliedDateOption, 'yesterday');
  assert.equal(context.showDatePicker, false);
  assert.equal(context.isRefreshing, true);
  assert.equal(context.currentPage, 1);
  assert.equal(sandbox.fetchCount, 1);
  assert.equal(context.formatDate(context.startDate), context.formatDate(context.draftStartDate));
  assert.equal(context.formatDate(context.endDate), context.formatDate(context.draftEndDate));

  sandbox.pendingTimeout();
  await selectPromise;

  assert.equal(context.isRefreshing, false);
  assert.equal(context.campaigns[0].campaign, 'Campaign refreshed');
});
