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
  const loader = {
    hidden: false,
    removed: false,
    classList: {
      add(className) {
        if (className === 'is-hidden') loader.hidden = true;
      }
    },
    remove() {
      loader.removed = true;
    }
  };
  const sandbox = {
    console,
    Date,
    JSON,
    Math,
    Promise,
    URL,
    URLSearchParams,
    loader,
    fetchCount: 0,
    localStorage: createMemoryStorage(),
    sessionStorage: createMemoryStorage(),
    performance: {
      now() {
        return 1400;
      }
    },
    setTimeout(callback, delay) {
      sandbox.timeouts.push({ callback, delay });
      return sandbox.timeouts.length;
    },
    fetch() {
      sandbox.fetchCount += 1;
      return Promise.resolve({
        json() {
          return Promise.resolve([]);
        }
      });
    },
    timeouts: [],
    document: {
      addEventListener() {},
      removeEventListener() {},
      getElementById(id) {
        return id === 'google-ads-boot-loader' ? loader : null;
      },
      querySelector() {
        return null;
      }
    },
    window: {
      __googleAdsBootStartedAt: 100,
      GOOGLE_ADS_PAGE: 'campaigns',
      innerWidth: 1400,
      requestAnimationFrame(callback) {
        callback();
      },
      location: {
        pathname: '/aw/campaigns',
        search: ''
      },
      setTimeout(callback, delay) {
        sandbox.timeouts.push({ callback, delay });
        return sandbox.timeouts.length;
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
  return { config: sandbox.appConfig, sandbox };
}

test('browser boot loaders expand the Google Ads logo once and hold the expanded state', () => {
  const reportTemplate = fs.readFileSync(path.join(__dirname, '..', 'views', 'index.ejs'), 'utf8');
  const googleAdsTemplate = fs.readFileSync(path.join(__dirname, '..', 'views', 'google_ads.ejs'), 'utf8');
  const styles = fs.readFileSync(path.join(__dirname, '..', 'public', 'style.css'), 'utf8');

  assert.match(reportTemplate, /id="report-boot-loader"\s+class="report-boot-loader"/);
  assert.match(googleAdsTemplate, /window\.__googleAdsBootStartedAt = performance\.now\(\)/);
  assert.match(googleAdsTemplate, /id="google-ads-boot-loader"\s+class="report-boot-loader"/);
  assert.match(googleAdsTemplate, /<svg class="report-boot-logo"[^>]*viewBox="0 0 192 192"/);
  assert.match(googleAdsTemplate, /<path class="report-boot-logo-yellow report-boot-logo-shape"[\s\S]*M56\.40,177\.25L121\.40,64\.67[\s\S]*L5\.60,147\.91[\s\S]*fill="#FBBC04"/);
  assert.doesNotMatch(googleAdsTemplate, /<g class="report-boot-logo-yellow report-boot-logo-shape">/);
  assert.match(googleAdsTemplate, /<circle class="report-boot-logo-green report-boot-logo-shape"[^>]*cx="47\.25"[^>]*cy="134\.44"[^>]*fill="#34A853"[^>]*r="29\.33"/s);
  assert.match(googleAdsTemplate, /<path class="report-boot-logo-blue report-boot-logo-shape"[\s\S]*M186\.40,147\.91L121\.40,35\.33[\s\S]*L135\.60,177\.25[\s\S]*fill="#4285F4"/);
  assert.match(styles, /\.report-boot-logo\s*\{[^}]*width:\s*192px;[^}]*height:\s*192px;[^}]*overflow:\s*visible;/s);
  assert.match(styles, /\.report-boot-logo-shape\s*\{[^}]*transform-box:\s*fill-box;[^}]*transform-origin:\s*center;/s);
  assert.match(styles, /\.report-boot-logo-yellow\s*\{[^}]*opacity:\s*0;[^}]*animation:\s*report-boot-yellow-expand\s+620ms[^;]*forwards;/s);
  assert.match(styles, /\.report-boot-logo-green\s*\{[^}]*opacity:\s*0;[^}]*animation:\s*report-boot-green-slide\s+520ms[^;]*420ms\s+forwards;/s);
  assert.match(styles, /\.report-boot-logo-blue\s*\{[^}]*animation:\s*report-boot-blue-expand\s+620ms[^;]*forwards;/s);
  assert.match(styles, /@keyframes report-boot-yellow-expand\s*\{[\s\S]*?0%\s*\{[\s\S]*?opacity:\s*0;[\s\S]*?translate\(50px,\s*-20px\)[\s\S]*?rotate\(-31deg\)[\s\S]*?scaleY\(0\.82\)[\s\S]*?14%\s*\{[\s\S]*?opacity:\s*1;[\s\S]*?34%\s*\{[\s\S]*?rotate\(-22deg\)[\s\S]*?72%\s*\{[\s\S]*?translate\(5px,\s*-2px\)[\s\S]*?to\s*\{[\s\S]*?opacity:\s*1;[\s\S]*?translate\(0,\s*0\)\s+rotate\(0deg\)\s+scaleY\(1\)/);
  assert.match(styles, /@keyframes report-boot-green-slide\s*\{[\s\S]*?0%\s*\{[\s\S]*?opacity:\s*0;[\s\S]*?translate\(54px,\s*-88px\)[\s\S]*?scale\(0\.54\)[\s\S]*?24%\s*\{[\s\S]*?opacity:\s*1;[\s\S]*?translate\(54px,\s*-88px\)[\s\S]*?58%\s*\{[\s\S]*?translate\(21px,\s*-37px\)[\s\S]*?82%\s*\{[\s\S]*?translate\(4px,\s*-8px\)[\s\S]*?to\s*\{[\s\S]*?translate\(0,\s*0\)\s+scale\(1\)/);
  assert.match(styles, /@keyframes report-boot-blue-expand\s*\{[\s\S]*?0%\s*\{[\s\S]*?translate\(-28px,\s*10px\)[\s\S]*?rotate\(30deg\)[\s\S]*?scaleY\(0\.9\)[\s\S]*?24%\s*\{[\s\S]*?rotate\(30deg\)[\s\S]*?68%\s*\{[\s\S]*?translate\(-4px,\s*1px\)[\s\S]*?to\s*\{[\s\S]*?translate\(0,\s*0\)\s+rotate\(0deg\)\s+scaleY\(1\)/);
  assert.match(styles, /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*\.report-boot-logo-shape\s*\{[^}]*animation:\s*none;[^}]*opacity:\s*1;/s);
});

test('boot loader yellow and blue capsules form a symmetric fork', () => {
  const googleAdsTemplate = fs.readFileSync(path.join(__dirname, '..', 'views', 'google_ads.ejs'), 'utf8');
  const yellowPath = googleAdsTemplate.match(/<path class="report-boot-logo-yellow report-boot-logo-shape"\s+d="([^"]+)"/)[1];
  const bluePath = googleAdsTemplate.match(/<path class="report-boot-logo-blue report-boot-logo-shape"\s+d="([^"]+)"/)[1];

  function capsuleCenterline(pathData) {
    const points = [...pathData.matchAll(/-?\d+\.\d+|-?\d+/g)].map((match) => Number(match[0]));
    return {
      bottom: {
        x: (points[0] + points[11]) / 2,
        y: (points[1] + points[12]) / 2
      },
      top: {
        x: (points[2] + points[9]) / 2,
        y: (points[3] + points[10]) / 2
      }
    };
  }

  const yellow = capsuleCenterline(yellowPath);
  const blue = capsuleCenterline(bluePath);
  const yellowLength = Math.hypot(yellow.top.x - yellow.bottom.x, yellow.top.y - yellow.bottom.y);
  const blueLength = Math.hypot(blue.top.x - blue.bottom.x, blue.top.y - blue.bottom.y);

  assert.equal(Number(yellowLength.toFixed(2)), Number(blueLength.toFixed(2)));
  assert.deepEqual(
    {
      yellowTop: [Number(yellow.top.x.toFixed(2)), Number(yellow.top.y.toFixed(2))],
      blueTop: [Number(blue.top.x.toFixed(2)), Number(blue.top.y.toFixed(2))]
    },
    { yellowTop: [96, 50], blueTop: [96, 50] }
  );
  assert.equal(Number(yellow.bottom.y.toFixed(2)), Number(blue.bottom.y.toFixed(2)));
  assert.equal(Number((yellow.bottom.x + blue.bottom.x).toFixed(2)), 192);
});

test('google ads shell hides its boot loader after the minimum visible interval', () => {
  const { config, sandbox } = loadGoogleAdsAppConfig();
  const { loader } = sandbox;

  config.methods.hideGoogleAdsBootLoader.call({});

  assert.equal(sandbox.timeouts[0].delay, 0);
  sandbox.timeouts[0].callback();
  assert.equal(loader.hidden, true);
  assert.equal(sandbox.timeouts[1].delay, 220);
  sandbox.timeouts[1].callback();
  assert.equal(loader.removed, true);
});

test('campaign page data reload keeps the loading state visible like the report page', async () => {
  const { config, sandbox } = loadGoogleAdsAppConfig();
  const context = {
    ...config.data(),
    ...config.methods,
    pageMode: 'campaigns',
    currentPage: 4,
    showDatePicker: true,
    dropdown: 'tools',
    isNotificationsOpen: true,
    loadData() {
      sandbox.loadDataCount = (sandbox.loadDataCount || 0) + 1;
      return Promise.resolve();
    },
    $nextTick() {
      return Promise.resolve();
    }
  };

  const reloadPromise = config.methods.reloadData.call(context);
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(context.isRefreshing, true);
  assert.equal(context.showDatePicker, false);
  assert.equal(context.dropdown, '');
  assert.equal(context.isNotificationsOpen, false);
  assert.equal(sandbox.loadDataCount, 1);
  assert.equal(sandbox.timeouts[0].delay, 1400);

  sandbox.timeouts[0].callback();
  await reloadPromise;

  assert.equal(context.currentPage, 1);
  assert.equal(context.isRefreshing, false);
});

test('campaign date range changes use the soft refresh transition state', async () => {
  const { config, sandbox } = loadGoogleAdsAppConfig();
  const context = {
    ...config.data(),
    ...config.methods,
    pageMode: 'campaigns',
    currentPage: 3,
    selectedDateOption: 'custom',
    filteredRawData: [],
    draftStartDate: new Date(2026, 4, 20),
    draftEndDate: new Date(2026, 4, 21),
    showDatePicker: true,
    loadData() {
      sandbox.loadDataCount = (sandbox.loadDataCount || 0) + 1;
      return Promise.resolve();
    },
    $nextTick() {
      return Promise.resolve();
    }
  };

  const applyPromise = config.methods.applyDateRange.call(context);
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(context.isRefreshing, true);
  assert.equal(context.isSoftRefreshing, true);
  assert.equal(context.refreshMode, 'soft');
  assert.equal(context.showDatePicker, false);
  assert.equal(context.appliedDateOption, 'custom');
  assert.equal(sandbox.loadDataCount, 1);
  assert.equal(sandbox.timeouts[0].delay, 320);

  sandbox.timeouts[0].callback();
  await applyPromise;

  assert.equal(context.currentPage, 1);
  assert.equal(context.isRefreshing, false);
  assert.equal(context.isSoftRefreshing, false);
  assert.equal(context.refreshMode, 'full');
});

test('google ads in-app route changes avoid full page navigation and use a soft transition', () => {
  const { config, sandbox } = loadGoogleAdsAppConfig();
  const history = [];
  const context = {
    ...config.data(),
    ...config.methods,
    campaignRows: [{ campaign: 'BA608', id: 'BA608' }],
    $nextTick(callback) {
      if (callback) callback();
      return Promise.resolve();
    }
  };
  sandbox.window.history = {
    pushState(_state, _title, url) {
      history.push(url);
    }
  };

  config.methods.navigateToGoogleAdsRoute.call(context, '/aw/adgroups?campaignId=BA608');

  assert.equal(context.isSoftRefreshing, true);
  assert.equal(context.isRouteLoading, true);
  assert.equal(context.pageMode, 'campaigns');
  assert.equal(context.selectedCampaignId, '');
  assert.deepEqual(history, []);
  assert.equal(sandbox.timeouts[0].delay, 900);
  assert.equal(sandbox.timeouts[1].delay, 420);

  sandbox.timeouts[1].callback();
  assert.equal(context.pageMode, 'adgroups');
  assert.equal(context.selectedCampaignId, 'BA608');
  assert.deepEqual(history, ['/aw/adgroups?campaignId=BA608']);
  assert.equal(context.isSoftRefreshing, true);
  assert.equal(context.isRouteLoading, true);

  sandbox.timeouts[0].callback();
  assert.equal(context.isSoftRefreshing, false);
  assert.equal(context.isRouteLoading, false);
});

test('campaign conversion chart uses an arithmetic nice-number axis', () => {
  const { config } = loadGoogleAdsAppConfig();

  assert.equal(config.computed.conversionsChartMax.call({ conversionsChartValue: 45 }), 60);
  const labels = config.computed.conversionsChartLabels.call({
    conversionsChartMax: 60,
    fixed: config.methods.fixed
  });
  assert.equal(labels.max, '60.00');
  assert.equal(labels.mid, '30.00');
  assert.equal(labels.min, '0.00');

  const point = config.computed.conversionsChartPoint.call({
    conversionsChartMax: 60,
    conversionsChartValue: 45
  });

  assert.equal(point.x, 555);
  assert.equal(Number(point.y.toFixed(2)), 61);
});
