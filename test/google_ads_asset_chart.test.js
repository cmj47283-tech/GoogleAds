const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('ad assets page renders a middle performance chart with chart controls', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'views', 'google_ads.ejs'), 'utf8');

  assert.match(template, /<section\s+v-if="pageMode !== 'reporteditor'"\s+class="ga-context-bar"/);
  assert.doesNotMatch(template, /<section\s+v-if="pageMode !== 'adassets'"\s+class="ga-context-bar"/);
  assert.match(template, /<div\s+v-if="pageMode === 'campaigns' \|\| pageMode === 'adassets'"\s+class="ga-tabs"/);
  assert.match(template, /<div\s+v-if="pageMode !== 'adassets'"\s+class="ga-date-row"/);
  assert.match(
    template,
    /<section\s+v-if="pageMode === 'adassets'"\s+class="ga-asset-chart-area"/
  );
  assert.match(template, /aria-label="Ad asset performance chart"/);
  assert.match(template, />Clicks</);
  assert.match(template, />None</);
  assert.match(template, />Chart type</);
  assert.match(template, />Expand</);
  assert.match(template, />Adjust</);
});

test('ad assets table filter toolbar stays pinned while scrolling', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'google_ads.css'), 'utf8');

  assert.match(css, /\.ga-table-toolbar\s*\{[^}]*position:\s*sticky;/s);
  assert.match(css, /\.ga-table-panel--adassets\s+\.ga-table-toolbar\s*\{[^}]*top:\s*56px;/s);
  assert.match(css, /\.ga-table-panel--adassets\s+\.ga-table-toolbar\s*\{[^}]*z-index:\s*45;/s);
});
