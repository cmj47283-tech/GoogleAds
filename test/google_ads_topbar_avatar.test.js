const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('google ads topbar does not render the user avatar chip', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'views', 'google_ads.ejs'), 'utf8');

  assert.doesNotMatch(template, /class="ga-avatar"/);
  assert.doesNotMatch(template, />伟全</);
});
