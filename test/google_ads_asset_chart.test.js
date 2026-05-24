const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('ad assets page renders a middle performance chart with chart controls', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'views', 'google_ads.ejs'), 'utf8');
  const script = fs.readFileSync(path.join(__dirname, '..', 'public', 'google_ads.js'), 'utf8');

  assert.match(template, /<section\s+class="ga-context-bar"\s+:class="\{\s*hidden:\s*isContextBarHidden\s*\}"/);
  assert.doesNotMatch(template, /<section\s+v-if="pageMode !== 'adassets'"\s+class="ga-context-bar"/);
  assert.match(template, /<div\s+v-if="pageMode === 'campaigns' \|\| pageMode === 'adassets'"\s+class="ga-tabs"/);
  assert.match(template, /<div\s+v-if="pageMode === 'campaigns' \|\| pageMode === 'adassets' \|\| pageMode === 'overview'"\s+class="ga-date-row"/);
  assert.match(
    template,
    /<section\s+v-if="pageMode === 'adassets'"\s+class="ga-asset-chart-area"/
  );
  assert.match(template, /aria-label="Ad asset performance chart"/);
  assert.match(template, />Conversions</);
  assert.doesNotMatch(
    template,
    /<button class="ga-chart-select" type="button" aria-label="Chart metric">[\s\S]*?<span>Clicks<\/span>/
  );
  assert.match(template, />None</);
  assert.match(template, />Chart type</);
  assert.match(template, />Expand</);
  assert.match(template, />Adjust</);
  assert.match(template, /\{\{\s*assetChartLabels\.max\s*\}\}/);
  assert.match(template, /class="ga-asset-chart-y-label"/);
  assert.doesNotMatch(template, /class="ga-asset-chart-line"/);
  assert.match(template, /<line\s+v-if="assetChartTooltip\.visible"\s+:x1="assetChartPoint\.x"/);
  assert.match(template, /:x2="assetChartPoint\.x"\s+y1="30"\s+y2="154"\s+class="ga-chart-hover-line"/);
  assert.match(template, /class="ga-asset-chart-point-hitarea"/);
  assert.match(template, /v-if="assetChartTooltip\.visible"\s+class="ga-chart-tooltip ga-asset-chart-tooltip"/);
  assert.match(template, /<div class="ga-chart-tooltip-label">Conversions<\/div>/);
  assert.match(template, /<span class="ga-chart-start">\{\{\s*formattedStartDate\s*\}\}<\/span>/);
  assert.match(template, /<span class="ga-chart-end">\{\{\s*formattedEndDate\s*\}\}<\/span>/);
  assert.match(template, /@mouseenter="showAssetChartTooltip"/);
  assert.match(template, /@mouseleave="hideAssetChartTooltip"/);
  assert.match(template, /@blur="hideAssetChartTooltip"/);
  assert.match(
    script,
    /return Math\.max\(2,\s*Math\.ceil\(\(value \* 1\.45\) \/ 20\) \* 20\);/
  );
});

test('ad assets table filter toolbar stays pinned while scrolling', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'views', 'google_ads.ejs'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'google_ads.css'), 'utf8');
  const assetsTableIndex = template.indexOf('class="ga-data-table assets"');
  const assetsHeaderIndex = template.indexOf('<span>Asset</span>', assetsTableIndex);
  const assetsToolbarIndex = template.indexOf('class="ga-assets-toolbar-row"', assetsTableIndex);
  const assetsBodyIndex = template.indexOf('<tbody>', assetsTableIndex);

  assert.ok(assetsTableIndex >= 0);
  assert.ok(assetsToolbarIndex > assetsTableIndex);
  assert.ok(assetsHeaderIndex > assetsToolbarIndex);
  assert.ok(assetsBodyIndex > assetsHeaderIndex);
  assert.match(template, /v-if="pageMode !== 'adassets'"\s+class="ga-table-toolbar"/);
  assert.match(css, /\.ga-table-toolbar\s*\{[^}]*position:\s*sticky;/s);
  assert.match(css, /\.ga-table-panel--adassets\s+\.ga-table-toolbar\s*\{[^}]*top:\s*158px;/s);
  assert.match(css, /\.ga-table-panel--adassets\s+\.ga-table-toolbar\s*\{[^}]*z-index:\s*15;/s);
  assert.match(css, /\.ga-data-table\.assets\s+\.ga-assets-toolbar-row\s+\.ga-table-toolbar\s*\{[^}]*position:\s*static;/s);
  assert.match(css, /\.ga-asset-chart-controls\s*\{[^}]*pointer-events:\s*none;/s);
  assert.match(css, /\.ga-chart-select,\s*\.ga-chart-tool\s*\{[^}]*pointer-events:\s*auto;/s);
});

test('ad group pages render conversions as a dot chart with a left axis', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'views', 'google_ads.ejs'), 'utf8');
  const styles = fs.readFileSync(path.join(__dirname, '..', 'public', 'google_ads.css'), 'utf8');

  assert.match(
    template,
    /<section\s+v-if="pageMode === 'adgroups'"\s+class="ga-chart-area ga-conversions-dot-chart"/
  );
  assert.match(template, /aria-label="Conversions dot chart"/);
  assert.match(template, /\{\{\s*conversionsChartLabels\.max\s*\}\}/);
  assert.match(template, /\{\{\s*conversionsChartLabels\.mid\s*\}\}/);
  assert.match(template, /\{\{\s*conversionsChartLabels\.min\s*\}\}/);
  assert.match(template, /class="ga-chart-y-label"/);
  assert.match(template, /class="ga-chart-point-marker"\s+:style="conversionsChartPointMarkerStyle"/);
  assert.match(template, /class="ga-chart-point-hitarea"/);
  assert.match(template, /v-if="conversionsChartTooltip\.visible"\s+class="ga-chart-tooltip"/);
  assert.match(template, /@mouseenter="showConversionsChartTooltip"/);
  assert.match(template, /@mouseleave="hideConversionsChartTooltip"/);
  assert.match(template, /@blur="hideConversionsChartTooltip"/);
  assert.match(styles, /\.ga-conversions-dot-chart\s+\.ga-chart-label\s*\{[^}]*text-anchor:\s*end;/s);
  assert.match(styles, /\.ga-chart-point-marker\s*\{[^}]*width:\s*8px;[^}]*height:\s*8px;[^}]*border-radius:\s*50%;/s);
  assert.match(styles, /\.ga-chart-point-hitarea\s*\{[^}]*fill:\s*transparent;/s);
  assert.match(styles, /\.ga-chart-tooltip\s*\{[^}]*position:\s*absolute;/s);
  assert.match(styles, /\.ga-chart-hover-line\s*\{[^}]*stroke-dasharray:\s*2 2;/s);
  assert.doesNotMatch(template, /<polyline\s+points="20,154 980,154"\s+class="ga-chart-line"><\/polyline>/);
});
