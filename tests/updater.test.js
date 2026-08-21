import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  autoCheckEnabled,
  checkForUpdate,
  compareVersions,
  evaluateElectronUpdate,
  honestUpdateError,
  isPrerelease,
  parseLatestYml,
  requireUpdateIntegrity,
  shouldOfferUpdate
} from '../src/core/updater.js';

const read = file => fs.readFileSync(file, 'utf8');

test('updater compares semantic release versions including prerelease order', () => {
  assert.equal(compareVersions('0.16.0', '0.15.9'), 1);
  assert.equal(compareVersions('0.15.0', '0.15.0'), 0);
  assert.equal(compareVersions('0.14.9', '0.15.0'), -1);
  assert.equal(compareVersions('0.19.0', '0.19.0-beta.1'), 1);
  assert.equal(compareVersions('0.19.0-beta.2', '0.19.0-beta.1'), 1);
  assert.equal(compareVersions('0.18.3', '0.18.3'), 0);
  assert.ok(isPrerelease('0.19.0-beta.1'));
  assert.equal(isPrerelease('0.18.3'), false);
});

test('updater ignores drafts, ignores prereleases unless current is prerelease, and never downgrades', () => {
  assert.deepEqual(shouldOfferUpdate({ currentVersion: '0.18.3', candidateVersion: '0.19.0' }).offer, true);
  assert.equal(shouldOfferUpdate({ currentVersion: '0.18.3', candidateVersion: '0.18.3' }).reason, 'not-newer');
  assert.equal(shouldOfferUpdate({ currentVersion: '0.18.3', candidateVersion: '0.18.2' }).reason, 'not-newer');
  assert.equal(shouldOfferUpdate({ currentVersion: '0.18.3', candidateVersion: '0.19.0', draft: true }).reason, 'draft');
  assert.equal(shouldOfferUpdate({ currentVersion: '0.18.3', candidateVersion: '0.19.0-beta.1' }).reason, 'prerelease');
  assert.equal(shouldOfferUpdate({ currentVersion: '0.18.3', candidateVersion: '0.19.0', prerelease: true }).reason, 'prerelease');
  assert.equal(shouldOfferUpdate({ currentVersion: '0.19.0-beta.1', candidateVersion: '0.19.0-beta.2' }).offer, true);
  assert.equal(shouldOfferUpdate({ currentVersion: '0.19.0-beta.1', candidateVersion: '0.19.0' }).offer, true);
});

test('auto-check toggle defaults on and can be disabled', () => {
  assert.equal(autoCheckEnabled(undefined), true);
  assert.equal(autoCheckEnabled({}), true);
  assert.equal(autoCheckEnabled({ autoCheckUpdates: true }), true);
  assert.equal(autoCheckEnabled({ autoCheckUpdates: false }), false);
});

test('updater refuses to install without checksum metadata', () => {
  assert.throws(() => requireUpdateIntegrity(null), /metadata is missing/i);
  assert.throws(() => requireUpdateIntegrity({ version: '0.19.0' }), /checksum/i);
  assert.throws(() => requireUpdateIntegrity({ version: '0.19.0', sha256: 'deadbeef' }), /checksum/i);
  assert.throws(() => parseLatestYml('version: 0.19.0\npath: Eidovara.exe\n'), /checksum|metadata/i);
  const sha512 = `${'A'.repeat(86)}==`;
  const ok = requireUpdateIntegrity({ version: '0.19.0', sha512, path: 'Eidovara-0.19.0-Windows-x64-Setup.exe' });
  assert.equal(ok.sha512, sha512);
});

test('latest.yml parser requires sha512 and evaluateElectronUpdate gates versions', () => {
  const sha512 = `${'B'.repeat(86)}==`;
  const yml = `version: 0.19.0\nfiles:\n  - url: Eidovara-0.19.0-Windows-x64-Setup.exe\n    sha512: ${sha512}\n    size: 12\npath: Eidovara-0.19.0-Windows-x64-Setup.exe\nsha512: ${sha512}\n`;
  const parsed = parseLatestYml(yml);
  assert.equal(parsed.version, '0.19.0');
  assert.equal(parsed.sha512, sha512);
  const offered = evaluateElectronUpdate({ version: '0.19.0', sha512, path: parsed.path }, '0.18.3');
  assert.equal(offered.available, true);
  const skipped = evaluateElectronUpdate({ version: '0.19.0-beta.1', sha512, path: parsed.path }, '0.18.3');
  assert.equal(skipped.available, false);
  assert.equal(skipped.reason, 'prerelease');
  assert.throws(() => evaluateElectronUpdate({ version: '0.19.0' }, '0.18.3'), /checksum/i);
});

test('legacy update.json still rejects untrusted URLs and missing hashes', async () => {
  const original = globalThis.fetch;
  const bad = Buffer.from(JSON.stringify({ version: '9.9.9', url: 'https://evil.example/Eidovara.exe', sha256: 'A'.repeat(64) }));
  globalThis.fetch = async () => ({ ok: true, url: 'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/update.json', headers: { get: () => String(bad.length) }, arrayBuffer: async () => bad });
  try {
    await assert.rejects(() => checkForUpdate({
      manifestUrl: 'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/update.json',
      currentVersion: '0.18.3'
    }), /official GitHub release channel/i);
  } finally { globalThis.fetch = original; }
});

test('legacy update.json does not offer a prerelease to a stable install', async () => {
  const original = globalThis.fetch;
  const body = Buffer.from(JSON.stringify({
    version: '0.19.0-beta.1',
    url: 'https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v0.19.0-beta.1/Eidovara-0.19.0-beta.1-Windows-x64-Setup.exe',
    sha256: 'A'.repeat(64)
  }));
  globalThis.fetch = async () => ({ ok: true, url: 'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/update.json', headers: { get: () => String(body.length) }, arrayBuffer: async () => body });
  try {
    const result = await checkForUpdate({
      manifestUrl: 'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/update.json',
      currentVersion: '0.18.3'
    });
    assert.equal(result.available, false);
    assert.equal(result.reason, 'prerelease');
  } finally { globalThis.fetch = original; }
});

test('honest updater errors stay unsigned and fail closed offline', () => {
  assert.match(honestUpdateError({ message: 'getaddrinfo ENOTFOUND github.com' }), /could not reach GitHub/i);
  assert.match(honestUpdateError({ message: 'sha512 checksum mismatch' }), /refused to install/i);
  assert.match(honestUpdateError({ message: 'Authenticode publisher mismatch' }), /Authenticode-unsigned/i);
  assert.doesNotMatch(honestUpdateError({ message: 'network down' }), /signed update is ready/i);
});

test('packaging publishes GitHub latest.yml and ships electron-updater', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.build.appId, 'com.soulconsciousnessstudios.eidovara');
  assert.equal(pkg.dependencies['electron-updater'], '6.8.9');
  assert.equal(pkg.build.publish.provider, 'github');
  assert.equal(pkg.build.publish.owner, 'ProjectSoulbyTmb');
  assert.equal(pkg.build.publish.repo, 'project---soul');
  assert.match(read('.github/workflows/release-windows.yml'), /latest\.yml/);
  assert.match(read('.github/workflows/release-windows.yml'), /dist:win:installer/);
  assert.match(read('package.json'), /--publish never/);
  assert.match(read('src/electron/main.js'), /attachDesktopUpdater/);
  assert.match(read('src/electron/preload.cjs'), /onUpdateStatus/);
  assert.doesNotMatch(read('src/renderer/index.html'), /media-src [^"]*'self'/);
  assert.match(read('src/renderer/index.html'), /Eidovara can check GitHub for a newer Windows installer, verify its checksum, and apply it\. Builds are Authenticode-unsigned\./);
  assert.match(read('src/renderer/index.html'), /id="autoCheckUpdates"/);
  assert.match(read('src/renderer/index.html'), /id="companionCheckUpdatesBtn"/);
  assert.match(read('src/renderer/index.html'), /data-companion-nav="updates"/);
  assert.match(read('src/renderer/renderer.js'), /action\.type==='open-updates'\|\|action\.type==='check-updates'/);
  assert.match(read('src/electron/auto-update.js'), /verifyUpdateCodeSignature/);
  assert.match(read('src/electron/auto-update.js'), /Authenticode-unsigned/);
  assert.match(read('src/electron/auto-update.js'), /Download the Authenticode-unsigned/);
  assert.match(read('src/electron/auto-update.js'), /quitAndInstall/);
  assert.match(read('src/electron/auto-update.js'), /autoDownload = false/);
  assert.doesNotMatch(read('src/electron/auto-update.js'), /shell\.openPath\(/);
  assert.match(read('src/renderer/index.html'), /latest\.yml/);
  const sha512Official = `${'C'.repeat(86)}==`;
  assert.throws(() => parseLatestYml(`version: 0.19.1\npath: evil.exe\nsha512: ${sha512Official}\n`), /official Windows installer/i);
});

test('knowledge and workspace search expose Check for updates without auto-install', () => {
  const knowledge = read('src/core/knowledge.js');
  assert.match(knowledge, /type: 'check-updates'/);
  assert.match(knowledge, /verify its checksum, and apply it\. Builds are Authenticode-unsigned/);
  assert.match(read('src/core/layers.js'), /id: 'set-updates'/);
  assert.match(read('src/renderer/companion.js'), /companionCheckUpdatesBtn/);
  assert.match(read('src/core/entertainment.js'), /does not download or rip/i);
});
