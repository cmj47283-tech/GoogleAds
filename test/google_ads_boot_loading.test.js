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
    Math,
    URLSearchParams,
    loader,
    localStorage: createMemoryStorage(),
    sessionStorage: createMemoryStorage(),
    performance: {
      now() {
        return 1400;
      }
    },
    timeouts: [],
    document: {
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
  assert.match(styles, /\.report-boot-logo-yellow\s*\{[^}]*animation:\s*report-boot-yellow-expand\s+420ms[^;]*forwards;/s);
  assert.match(styles, /\.report-boot-logo-green\s*\{[^}]*animation:\s*report-boot-green-slide\s+520ms[^;]*300ms\s+forwards;/s);
  assert.match(styles, /\.report-boot-logo-blue\s*\{[^}]*animation:\s*report-boot-blue-expand\s+420ms[^;]*forwards;/s);
  assert.match(styles, /@keyframes report-boot-yellow-expand\s*\{[\s\S]*?from\s*\{[\s\S]*?translate\(34px,\s*-12px\)[\s\S]*?rotate\(-24deg\)[\s\S]*?scaleY\(0\.88\)/);
  assert.match(styles, /@keyframes report-boot-green-slide\s*\{[\s\S]*?from\s*\{[\s\S]*?opacity:\s*0;[\s\S]*?translate\(49px,\s*-84px\)[\s\S]*?scale\(0\.58\)[\s\S]*?38%\s*\{[\s\S]*?opacity:\s*1;[\s\S]*?translate\(49px,\s*-84px\)[\s\S]*?70%\s*\{[\s\S]*?translate\(16px,\s*-28px\)[\s\S]*?to\s*\{[\s\S]*?translate\(0,\s*0\)\s+scale\(1\)/);
  assert.match(styles, /@keyframes report-boot-blue-expand\s*\{[\s\S]*?from\s*\{[\s\S]*?translate\(-22px,\s*12px\)[\s\S]*?rotate\(26deg\)[\s\S]*?scaleY\(0\.9\)/);
  assert.match(styles, /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*\.report-boot-logo-shape\s*\{[^}]*animation:\s*none;/s);
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
