import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { INSTALLER_NAME, INSTALLER_SHA256 } from '../src/core/knowledge.js';
import { ENTRIES, answerAssist } from '../docs/knowledge.js';

const read = file => fs.readFileSync(file, 'utf8');

const FAKE = /USPTO Registration No|Copyright Office registration number|U\.S\. Patent No|patent pending|PCI[- ]DSS certified|federally registered trademark|Certificate of Registration issued|Serial No\.\s*\d{7}/i;

function walk(dir, pred, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, pred, acc);
    else if (pred(entry.name, full)) acc.push(full.replaceAll('\\', '/'));
  }
  return acc;
}

test('ip-certification inventory exists, is honest, and every listed path is present', () => {
  const cert = JSON.parse(read('docs/ip-certification.json'));
  const md = read('docs/IP_CERTIFICATION.md');
  assert.equal(cert.kind, 'repository-self-attestation');
  assert.equal(cert.claimant, 'Soul Consciousness Studios');
  assert.equal(cert.licenseSpdx, 'LicenseRef-Eidovara-Source-Available-1.0');
  assert.equal(cert.notLegalAdvice, true);
  assert.equal(cert.product.version, '1.0.0');
  assert.equal(cert.product.sourceVersion, '1.0.0');
  assert.equal(cert.product.liveInstallerVersion, '1.0.0');
  assert.equal(cert.product.installer, INSTALLER_NAME);
  assert.equal(cert.product.sha256, INSTALLER_SHA256);
  assert.equal(cert.product.authenticode, 'unsigned');
  assert.equal(cert.product.appId, 'com.soulconsciousnessstudios.eidovara');
  for (const item of [
    'copyright-office-registration', 'uspto-registration', 'patent', 'patent-pending',
    'authenticode-certificate', 'pci-dss-certification', 'executed-cla', 'formed-company'
  ]) {
    assert.ok(cert.thisFileIsNot.includes(item), item);
  }
  const allowed = new Set(cert.allowedStatuses);
  assert.ok(cert.instruments.length >= 25);
  const ids = new Set();
  for (const row of cert.instruments) {
    assert.ok(row.id && row.path && row.status, JSON.stringify(row));
    assert.ok(allowed.has(row.status), row.id);
    assert.equal(fs.existsSync(row.path), true, row.path);
    assert.equal(ids.has(row.id), false, row.id);
    ids.add(row.id);
  }
  assert.equal(cert.instruments.find(row => row.id === 'cla').status, 'unsigned-template');
  assert.equal(cert.instruments.find(row => row.id === 'entity-assignment').status, 'unsigned-template');
  assert.equal(cert.instruments.find(row => row.id === 'trademark-filing').status, 'not-filed');
  assert.match(md, /not a U\.S\. Copyright Office registration/i);
  assert.match(md, /repository self-attestation/i);
  assert.match(md, new RegExp(INSTALLER_SHA256));
  assert.match(md, /unsigned-template/);
  assert.match(md, /owner-action-required/);
  assert.match(md, /LicenseRef-Eidovara-Source-Available-1\.0/);
  assert.doesNotMatch(md, FAKE);
  assert.doesNotMatch(JSON.stringify(cert), FAKE);
  assert.doesNotMatch(md, /Â®/);
  assert.match(read('docs/INFRINGEMENT.md'), /DMCA/);
  assert.match(read('docs/INFRINGEMENT.md'), /not legal advice/i);
  assert.match(read('docs/COPYRIGHT_DEPOSIT.md'), /copyright\.gov/);
  assert.match(read('docs/COPYRIGHT_DEPOSIT.md'), /npm run ip:deposit/);
  assert.doesNotMatch(read('docs/COPYRIGHT_DEPOSIT.md'), /Registration Number TX/i);
  assert.match(read('.github/ISSUE_TEMPLATE/ip-notice.md'), /DMCA/);
  assert.match(read('.gitignore'), /copyright-deposit\//);
  assert.match(read('.gitignore'), /executed-assignments\//);
  assert.match(read('package.json'), /"ip:deposit"/);
});

test('first-party HTML, CSS, scripts, and server files carry source-available SPDX', () => {
  const header = /SPDX-FileCopyrightText: 2026 Soul Consciousness Studios/;
  const spdx = /SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1\.0/;
  const files = [
    ...walk('src', name => /\.(?:js|cjs|css|html)$/.test(name)),
    ...walk('docs', name => /\.(?:js|css|html)$/.test(name)),
    ...walk('scripts', name => /\.(?:js|cjs)$/.test(name)),
    ...walk('server', name => /\.(?:js|cjs)$/.test(name))
  ];
  assert.ok(files.length >= 50, files.length);
  for (const file of files) {
    const head = read(file).split(/\n/).slice(0, 8).join('\n');
    assert.match(head, header, file);
    assert.match(head, spdx, file);
    assert.doesNotMatch(head, /SPDX-License-Identifier: (?:MIT|Apache-2\.0|GPL)/);
  }
});

test('legal hub, README, and ownership point at the self-attestation without fake filings', () => {
  assert.match(read('docs/legal.html'), /IP_CERTIFICATION\.md/);
  assert.match(read('docs/legal.html'), /INFRINGEMENT\.md/);
  assert.match(read('docs/licensing.html'), /IP_CERTIFICATION\.md/);
  assert.match(read('README.md'), /IP_CERTIFICATION\.md/);
  assert.match(read('OWNERSHIP.md'), /IP_CERTIFICATION\.md/);
  assert.match(read('COPYRIGHT.txt'), /IP_CERTIFICATION\.md/);
  assert.match(read('docs/COPYRIGHT.md'), /IP_CERTIFICATION\.md/);
  assert.match(read('docs/IP_PROTECTION.md'), /IP_CERTIFICATION\.md/);
  assert.match(read('docs/CHAIN_OF_TITLE.md'), /IP_CERTIFICATION\.md/);
  assert.match(read('.github/CODEOWNERS'), /IP_CERTIFICATION\.md/);
  assert.match(read('docs/faq.html'), /IP_CERTIFICATION\.md/);
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.build.files.includes('docs/IP_CERTIFICATION.md'));
  assert.match(read('scripts/create-release-evidence.js'), /IP_CERTIFICATION\.md/);
});

test('website helper answers IP certification questions without claiming government filings', () => {
  assert.ok(ENTRIES.some(entry => entry.id === 'ip-certify'));
  const reply = answerAssist('Show the IP certification self attestation');
  assert.equal(reply.ok, true);
  assert.match(reply.reply, /self-attestation|repository/i);
  assert.match(reply.reply, /not a U\.S\. Copyright Office registration|not registered/i);
  assert.match(reply.reply, /unregistered/i);
  assert.doesNotMatch(reply.reply, FAKE);
  assert.ok((reply.links || []).some(link => String(link.href || '').includes('IP_CERTIFICATION.md')));
});

test('copyright deposit helper writes a gitignored listing and refuses secrets', () => {
  const script = read('scripts/prepare-copyright-deposit.js');
  assert.match(script, /copyright-deposit/);
  assert.match(script, /SKIP_DIR/);
  assert.doesNotMatch(script, /copyright\.gov\/login|pay the fee/i);
  const out = path.join('copyright-deposit', 'test-run');
  const result = spawnSync(process.execPath, ['scripts/prepare-copyright-deposit.js', '--out', out], {
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const manifest = read(path.join(out, 'MANIFEST.txt'));
  assert.match(manifest, /not a U\.S\. Copyright Office registration/i);
  assert.match(manifest, /LICENSE/);
  assert.match(manifest, /src\/electron\/main\.js/);
  assert.doesNotMatch(manifest, /node_modules/);
  fs.rmSync('copyright-deposit', { recursive: true, force: true });
});

