const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

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
    /<section\s+v-if="pageMode === 'campaigns' \|\| pageMode === 'reporteditor'"\s+class="ga-page-filter-row"/
  );
  assert.doesNotMatch(template, /ga-page-filter-row[^>]*pageMode === 'adassets'/);
  assert.match(template, /Campaign status: All/);
  assert.match(template, /Ad group status: Enabled, Paused/);
  assert.match(template, /Add filter/);
});
