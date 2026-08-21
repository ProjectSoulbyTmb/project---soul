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
  assert.match(site, /href="download.html"/);
  assert.match(site, /Eidovara-0\.18\.2-Windows-x64-Setup\.exe/);
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

test('operator runbook covers Pages merge, Dependency graph, wrangler, custom domain, and Test service', () => {
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
  assert.match(runbook, /Settings → Code security/);
  assert.match(runbook, /enable \*\*Dependency graph\*\*/);
  assert.match(runbook, /fail-on-severity: moderate/);
  assert.match(runbook, /PR #10/);
  assert.match(runbook, /cursor\/engine-product-surface-c180/);
  assert.match(runbook, /is merged/);
  assert.match(runbook, /Do not retarget Pages at a feature branch/);
  assert.match(runbook, /Live after PR #10/);
  assert.match(runbook, /serves the product-surface site/);
  assert.match(runbook, /Do not invent another production site/);
  assert.match(read('LIVE.md'), /PR #10/);
  assert.match(read('LIVE.md'), /Do not retarget Pages at a feature branch/);
  assert.match(read('LIVE.md'), /fail-on-severity: moderate/);
  assert.match(read('LIVE.md'), /v0\.18\.2/);
  assert.match(read('LIVE.md'), /v0\.18\.1/);
  assert.doesNotMatch(read('LIVE.md'), /Authenticode-signed|live checkout is active|scientifically proven consciousness|®/);
  assert.match(read('server/README.md'), /Compatibility matrix/);
  assert.match(read('server/README.md'), /GET `\/health`, GET `\/v1\/config`, GET `\/v1\/status`/);
  assert.match(read('server/README.md'), /Optional POST `\/v1\/assist`/);
  assert.match(read('server/README.md'), /Fail-closed with no URL/);
  assert.match(read('server/README.md'), /neither client sends conversations|Conversations are not sent/i);
  assert.match(read('server/README.md'), /HTTPS except loopback/);
  assert.match(runbook, /Honest cannot-ship/);
  assert.match(runbook, /Live payments/);
  assert.match(runbook, /Authenticode/);
  assert.match(runbook, /consciousness/i);
  assert.match(runbook, /Do not hard-code `dreambot333\.workers\.dev`/);
  assert.match(read('SECURITY.md'), /Settings → Code security/);
  assert.match(read('SECURITY.md'), /Dependency graph/);
  assert.match(read('docs/GITHUB_RELEASES.md'), /Authenticode-unsigned/);
  assert.match(read('docs/GITHUB_RELEASES.md'), /workflow_dispatch/);
  assert.doesNotMatch(read('docs/GITHUB_RELEASES.md'), /produces a signed installer|Authenticode-signed Setup/i);
});

test('primary download CTAs point at the official Windows installer .exe, not only the repo root', () => {
  const version = JSON.parse(read('package.json')).version;
  const installerName = `Eidovara-${version}-Windows-x64-Setup.exe`;
  const installerUrl = `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/${installerName}`;
  const pinnedUrl = `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v${version}/${installerName}`;
  const sha = 'EF228574DCDF34B8A9039654F2B762FAB6D289CCA9A94B2ECCF048AE971FE711';
  const latest = 'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest';
  const repoRoot = /^https:\/\/github\.com\/ProjectSoulbyTmb\/project---soul\/?$/i;
  const isInstallerHref = href => href === installerUrl
    || (href.endsWith('.exe') && href.includes('/releases/download/'))
    || href === latest
    || href.startsWith(`${latest}/download/`);

  const downloadPage = read('docs/download.html');
  const primary = downloadPage.match(/<a class="primary[^"]*"[^>]*href="([^"]+)"/);
  assert.ok(primary, 'download page has a primary button');
  assert.equal(primary[1], installerUrl);
  assert.match(downloadPage, new RegExp(installerName.replace(/\./g, '\\.')));
  assert.match(downloadPage, new RegExp(sha));
  assert.match(downloadPage, new RegExp(pinnedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(downloadPage, /101\.3 MiB/);
  assert.match(downloadPage, /SHA256SUMS\.txt/);
  assert.match(downloadPage, /id="ageConfirm"/);
  assert.match(downloadPage, /aria-disabled="true"/);
  assert.match(downloadPage, /Authenticode-unsigned/);
  assert.doesNotMatch(downloadPage, /certified by Microsoft|Authenticode-signed|EV-signed installer|SmartScreen-preapproved by Microsoft/i);
  assert.doesNotMatch(downloadPage, /A7221E77/);

  const home = read('docs/index.html');
  const homeDownloadPrimary = [...home.matchAll(/<a class="primary[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
    .filter(([, , text]) => /download|installer|windows alpha|setup\.exe/i.test(text));
  assert.ok(homeDownloadPrimary.length >= 1);
  assert.ok(homeDownloadPrimary.some(([, href]) => href === 'download.html'), 'home primary download CTA must use the 18+ Download page');
  for (const [, href, text] of homeDownloadPrimary) {
    assert.equal(repoRoot.test(href), false, `home primary "${text.trim()}" must not be the repo root`);
    assert.equal(/\.exe$/i.test(href), false, `home primary "${text.trim()}" must not skip the 18+ gate`);
  }
  assert.match(home, new RegExp(sha));
  assert.match(home, /unsigned Stable Alpha/);

  const status = read('docs/status.html');
  assert.match(status, /href="download\.html"/);
  assert.doesNotMatch(status, /href="[^"]+\.exe"/);

  const faq = read('docs/faq.html');
  assert.doesNotMatch(faq, /href="https:\/\/github\.com\/ProjectSoulbyTmb\/project---soul\/releases\/[^"]+\.exe"/);
  assert.match(faq, new RegExp(installerName.replace(/\./g, '\\.')));
  assert.match(faq, new RegExp(sha));

  const readme = read('README.md');
  assert.match(readme, new RegExp(installerUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const readmeLeadLink = readme.match(/\[Download[^\]]*\]\(([^)]+)\)/);
  assert.ok(readmeLeadLink);
  assert.equal(isInstallerHref(readmeLeadLink[1]), true);

  const knowledge = read('docs/knowledge.js');
  assert.match(knowledge, new RegExp(installerUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(knowledge, new RegExp(pinnedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(knowledge, new RegExp(sha));
  assert.match(read('docs/help.html'), new RegExp(installerName.replace(/\./g, '\\.')));
  assert.match(read('docs/help.html'), new RegExp(sha));
  assert.match(read('docs/security.html'), new RegExp(sha));
  assert.match(read('docs/product.html'), new RegExp(sha));
  assert.match(read('LIVE.md'), new RegExp(installerUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(read('LIVE.md'), new RegExp(sha));
  assert.match(read('src/renderer/index.html'), new RegExp(installerName.replace(/\./g, '\\.')));
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
  assert.match(read('.github/workflows/pages.yml'), /branches: \[main\]/);
  assert.match(read('.github/workflows/pages.yml'), /deploy-pages@v4/);
  assert.match(read('.github/workflows/pages.yml'), /HTTPS/);
  assert.match(read('.github/workflows/pages.yml'), /Do not retarget this workflow at a feature branch/);
  assert.match(read('package.json'), /dist:win:installer/);
});

test('CI pnpm setup uses packageManager and does not pin a conflicting version', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.packageManager, 'pnpm@10.33.3');
  for (const file of ['.github/workflows/security.yml', '.github/workflows/release-windows.yml']) {
    const yml = read(file);
    assert.match(yml, /uses: pnpm\/action-setup@v4/);
    assert.doesNotMatch(yml, /pnpm\/action-setup@v4\n\s+with:\n\s+version:\s/);
  }
});

test('desktop app still has no workers.dev default endpoint', () => {
  assert.doesNotMatch(read('src/electron/main.js'), /dreambot333\.workers\.dev/);
  assert.doesNotMatch(read('src/electron/main.js'), /workers\.dev/);
  assert.doesNotMatch(read('src/renderer/renderer.js'), /dreambot333\.workers\.dev/);
  const html = read('src/renderer/index.html');
  assert.doesNotMatch(html, /dreambot333\.workers\.dev/);
  assert.match(html, /placeholder="https:\/\/eidovara-api\.example\.workers\.dev"/);
});
