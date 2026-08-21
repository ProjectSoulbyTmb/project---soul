import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');

test('public site tells users to download Windows or build from source, not use a hosted Soul', () => {
  const site = read('docs/index.html');
  assert.match(site, /id="download"/);
  assert.match(site, /Get Eidovara/);
  assert.match(site, /local-first Windows desktop app/);
  assert.match(site, /not a hosted chat account/);
  assert.match(site, /https:\/\/github\.com\/ProjectSoulbyTmb\/project---soul\/releases\/latest/);
  assert.match(site, /unsigned Stable Alpha/);
  assert.match(site, /Authenticode-unsigned/);
  assert.match(site, /Adults 18\+/);
  assert.match(site, /npm run dist:win:installer/);
  assert.match(site, /Free \/ Offline Soul/);
  assert.match(site, /\/health/);
  assert.match(site, /\/v1\/config/);
  assert.match(site, /\/v1\/status/);
  assert.match(site, /attach to the online Eidovara service/);
  assert.doesNotMatch(site, /dreambot333\.workers\.dev/);
  assert.doesNotMatch(site, /PCI[- ]DSS|Authenticode-signed installer|live checkout is active/i);
});

test('operator runbook covers Pages, Releases, wrangler, custom domain, and Test service', () => {
  const runbook = read('docs/PAYMENTS_AND_SITE.md');
  assert.match(runbook, /GitHub Pages/);
  assert.match(runbook, /docs\//);
  assert.match(runbook, /projectsoulbytmb\.github\.io\/project---soul/);
  assert.match(runbook, /npx wrangler deploy/);
  assert.match(runbook, /CLOUDFLARE_API_TOKEN/);
  assert.match(runbook, /never committed|Never commit/i);
  assert.match(runbook, /custom domain/i);
  assert.match(runbook, /Test service/);
  assert.match(runbook, /Soul HTTPS service/);
  assert.match(runbook, /local-first Windows desktop app/);
  assert.match(read('docs/GITHUB_RELEASES.md'), /Authenticode-unsigned/);
  assert.match(read('docs/GITHUB_RELEASES.md'), /workflow_dispatch/);
  assert.doesNotMatch(read('docs/GITHUB_RELEASES.md'), /produces a signed installer|Authenticode-signed Setup/i);
});

test('Windows release workflow is tag-published, dispatch-safe, and unsigned', () => {
  const workflow = read('.github/workflows/release-windows.yml');
  assert.match(workflow, /tags: \['v\*'\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /runs-on: windows-latest/);
  assert.match(workflow, /CSC_IDENTITY_AUTO_DISCOVERY: 'false'/);
  assert.match(workflow, /if: startsWith\(github\.ref, 'refs\/tags\/v'\)/);
  assert.match(workflow, /upload-artifact@v4/);
  assert.match(workflow, /eidovara-windows-unsigned/);
  assert.match(read('.github/workflows/pages.yml'), /path: docs/);
  assert.match(read('package.json'), /dist:win:installer/);
});

test('desktop app still has no workers.dev default endpoint', () => {
  assert.doesNotMatch(read('src/electron/main.js'), /dreambot333\.workers\.dev/);
  assert.doesNotMatch(read('src/electron/main.js'), /workers\.dev/);
  assert.doesNotMatch(read('src/renderer/renderer.js'), /dreambot333\.workers\.dev/);
  const html = read('src/renderer/index.html');
  assert.doesNotMatch(html, /dreambot333\.workers\.dev/);
  assert.match(html, /placeholder="https:\/\/eidovara-api\.example\.workers\.dev"/);
});
