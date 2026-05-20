const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('report editor refresh state covers campaign id cells and uses an anchored progress bar', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'views', 'index.ejs'), 'utf8');
  const styles = fs.readFileSync(path.join(__dirname, '..', 'public', 'style.css'), 'utf8');
  const filterStatusIndex = template.indexOf('class="filter-bar-hd"');
  const refreshOverlayIndex = template.indexOf('class="page-refresh-overlay"');
  const toolbarIndex = template.indexOf('class="toolbar"');

  assert.match(template, /<th\s+v-show="hasCampaignId"\s+class="col-campaign-id"/);
  assert.match(template, /<td\s+v-show="hasCampaignId"\s+class="col-campaign-id"/);
  assert.match(template, /class="toolbar"\s+:class="\{\s*'refresh-below-reveal':\s*isRefreshing\s*\}"/);
  assert.match(template, /class="content-wrapper"\s+:class="\{\s*'refresh-below-reveal':\s*isRefreshing\s*\}"/);
  assert.ok(refreshOverlayIndex > filterStatusIndex);
  assert.ok(refreshOverlayIndex < toolbarIndex);
  assert.match(styles, /\.data-table\.is-reloading tbody td\.col-campaign-id/);
  assert.match(styles, /\.data-table\.is-reloading tbody td\.col-campaign-id::after/);
  assert.match(styles, /\.filter-bar-hd\s*\{[^}]*position:\s*relative/s);
  assert.match(styles, /\.page-refresh-overlay\s*\{[^}]*bottom:\s*0/s);
  assert.match(styles, /\.toolbar\.refresh-below-reveal,\s*\n\.content-wrapper\.refresh-below-reveal\s*\{[^}]*animation:\s*refresh-below-reveal/s);
  assert.match(styles, /@keyframes\s+refresh-below-reveal/);
  assert.match(styles, /@keyframes\s+refresh-below-reveal[\s\S]*opacity:\s*0/);
  assert.match(styles, /@keyframes\s+refresh-below-reveal[\s\S]*opacity:\s*1/);
  assert.doesNotMatch(styles, /\.page-refresh-overlay\s*\{[^}]*position:\s*fixed/s);
  assert.doesNotMatch(styles, /\.page-refresh-overlay\s*\{[^}]*inset:\s*0/s);
  assert.doesNotMatch(styles, /\.page-refresh-overlay\s*\{[^}]*top:\s*80px/s);
});
