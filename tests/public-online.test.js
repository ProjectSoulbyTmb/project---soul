import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  INSTALLER_NAME,
  INSTALLER_MEASURED,
  INSTALLER_SHA256,
  INSTALLER_SIZE_BYTES,
  INSTALLER_LATEST_URL,
  INSTALLER_PINNED_URL,
  LIVE_INSTALLER_VERSION,
  SOURCE_VERSION
} from '../src/core/release.js';

const read = file => fs.readFileSync(file, 'utf8');
const escapeRe = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('public site presents the published local-first Windows release', () => {
  const site = read('docs/index.html');
  assert.equal(SOURCE_VERSION, LIVE_INSTALLER_VERSION);
  assert.equal(SOURCE_VERSION, JSON.parse(read('package.json')).version);
  assert.match(site, /id="download"/);
  assert.match(site, /local-first Windows desktop app/);
  assert.match(site, /href="download.html"/);
  assert.match(site, new RegExp(escapeRe(INSTALLER_NAME)));
  if (INSTALLER_SHA256) assert.match(site, new RegExp(INSTALLER_SHA256));
  else assert.match(site, /SHA256SUMS\.txt/);
  assert.match(site, /Authenticode-unsigned/);
  assert.match(site, /18\+/);
  assert.doesNotMatch(site, /dreambot333\.workers\.dev/);
  assert.doesNotMatch(site, /Authenticode-signed installer|live checkout is active/i);
});

test('primary download CTA points at the published installer and keeps the age gate', () => {
  assert.equal(JSON.parse(read('package.json')).version, SOURCE_VERSION);
  assert.equal(INSTALLER_NAME, `Eidovara-v${LIVE_INSTALLER_VERSION}-Windows-x64-Setup.exe`);
  // Pending tagged build: digest stays null; once measured it must be well-formed.
  if (!INSTALLER_MEASURED) assert.equal(INSTALLER_SHA256, null);
  else assert.match(INSTALLER_SHA256, /^[0-9A-F]{64}$/);
  assert.equal(INSTALLER_LATEST_URL, `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/${INSTALLER_NAME}`);
  assert.equal(INSTALLER_PINNED_URL, `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v${LIVE_INSTALLER_VERSION}/${INSTALLER_NAME}`);

  const downloadPage = read('docs/download.html');
  const primary = downloadPage.match(/<a class="primary[^"]*" href="([^"]+)"/);
  assert.ok(primary, 'download page has a primary button');
  assert.equal(primary[1], INSTALLER_LATEST_URL);
  if (INSTALLER_SIZE_BYTES !== null) {
    assert.match(downloadPage, new RegExp(escapeRe(INSTALLER_SIZE_BYTES.toLocaleString('en-US')) + ' bytes'));
  }
  assert.match(downloadPage, /SHA256SUMS\.txt/);
  assert.match(downloadPage, /id="ageConfirm"/);
  assert.match(downloadPage, /aria-disabled="true"/);
  assert.match(downloadPage, /Authenticode-unsigned/);
  assert.match(downloadPage, /GitHub\/Sigstore provenance/);
  assert.doesNotMatch(downloadPage, /Eidovara-0\.19\.1-Windows-x64-Setup\.exe/);

  const home = read('docs/index.html');
  assert.match(home, new RegExp('v' + escapeRe(SOURCE_VERSION) + ' is published'));
  assert.match(home, new RegExp(escapeRe(INSTALLER_NAME)));
  if (INSTALLER_SHA256) assert.match(home, new RegExp(INSTALLER_SHA256));
  else assert.match(home, /SHA256SUMS\.txt/);
  

  const product = read('docs/product.html');
  assert.match(product, new RegExp(escapeRe(INSTALLER_NAME)));
  if (INSTALLER_SHA256) assert.match(product, new RegExp(INSTALLER_SHA256));
  else assert.match(product, /SHA256SUMS\.txt/);
  

  const status = read('docs/status.html');
  assert.match(status, new RegExp(escapeRe(INSTALLER_NAME)));
  assert.doesNotMatch(status, /href="[^"]+\.exe"/);
});

test('Windows release workflow remains tag-published, dispatch-safe, and unsigned', () => {
  const workflow = read('.github/workflows/release-windows.yml');
  assert.match(workflow, /tags: \['v\*'\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /runs-on: windows-latest/);
  assert.match(workflow, /CSC_IDENTITY_AUTO_DISCOVERY: 'false'/);
  assert.match(workflow, /softprops\/action-gh-release@[0-9a-f]{40}/);
  assert.match(workflow, /upload-artifact@[0-9a-f]{40}/);
  assert.match(workflow, /eidovara-windows-unsigned/);
  assert.match(read('.github/workflows/pages.yml'), /path: docs\b/);
  assert.match(read('.github/workflows/pages.yml'), /branches: \[main\]/);
  assert.match(read('.github/workflows/pages.yml'), /actions\/deploy-pages@[0-9a-f]{40}/);
});

test('desktop service remains fail-closed and uses the official HTTPS host', () => {
  assert.doesNotMatch(read('src/electron/main.js'), /[a-z0-9.-]+\.workers\.dev/i);
  assert.doesNotMatch(read('src/renderer/renderer.js'), /[a-z0-9.-]+\.workers\.dev/i);
  const html = read('src/renderer/index.html');
  assert.match(html, /placeholder="https:\/\/api\.eidovara\.org"/);
  assert.match(read('src/core/service.js'), /DEFAULT_EIDOVARA_SERVICE_BASE = 'https:\/\/api\.eidovara\.org'/);
});

test('eidovara.org remains the official site and download routing preserves the age gate', () => {
  assert.equal(fs.existsSync('docs/CNAME'), false, 'GitHub Pages CNAME would fight the live Cloudflare zone');
  const redirects = read('docs/_redirects');
  assert.match(redirects, /\/download\/windows\s+\/download\.html\s+302/);
  assert.doesNotMatch(redirects, /\/download\/windows\s+\S+\.exe/);
  const home = read('docs/index.html');
  assert.match(home, /rel="canonical" href="https:\/\/eidovara\.org\/"/);
  assert.match(read('docs/robots.txt'), /https:\/\/eidovara\.org\/sitemap\.xml/);
  assert.match(read('docs/sitemap.xml'), /https:\/\/eidovara\.org\/download\.html/);
  assert.match(read('docs/_headers'), /script-src 'self'/);
  assert.match(read('server/wrangler.toml'), /WEBSITE_URL = "https:\/\/eidovara\.org\/"/);
  assert.match(read('server/wrangler.toml'), /pattern = "api\.eidovara\.org"/);
  assert.match(read('server/wrangler.toml'), /custom_domain = true/);
  assert.doesNotMatch(read('server/wrangler.toml'), /workers\.dev/);
});
