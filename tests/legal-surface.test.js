import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');

test('legal docs state source-available 18+ unsigned Windows terms without fake registrations', () => {
  for (const file of ['TERMS.md', 'AGE.md', 'PRIVACY.md', 'LEGAL_NOTICES.md', 'LICENSE', 'README.md', 'installer/EULA.txt']) {
    assert.match(read(file), /18/);
  }
  assert.match(read('TERMS.md'), /source-available, not open source/i);
  assert.match(read('TERMS.md'), /unauthorized access/i);
  assert.match(read('TERMS.md'), /Wikipedia\/Wikimedia/);
  assert.match(read('TERMS.md'), /user-confirmed/i);
  assert.match(read('TERMS.md'), /Authenticode-unsigned/i);
  assert.match(read('TERMS.md'), /not legal advice/i);
  assert.match(read('TERMS.md'), /local-admin testing only/i);
  assert.doesNotMatch(read('TERMS.md'), /patent pending|PCI[- ]DSS certified|federally registered trademark/i);
  assert.match(read('AGE.md'), /18 years old/i);
  assert.match(read('PRIVACY.md'), /What can leave the machine/);
  assert.match(read('PRIVACY.md'), /Wikipedia \/ Wikimedia/);
  assert.match(read('LICENSE'), /TERMS\.md/);
  assert.match(read('installer/EULA.txt'), /NOT open source/);
  assert.match(read('package.json'), /installer\/EULA\.txt/);
});

test('website legal pages cover terms, privacy, age, and Apple disclaimer', () => {
  const site = read('docs/index.html');
  const terms = read('docs/terms.html');
  const privacy = read('docs/privacy.html');
  const age = read('docs/age.html');
  assert.match(site, /Download Windows Alpha \(18\+\)/);
  assert.match(site, /Source-available, not open source/);
  assert.match(site, /not an iOS or iPhone product/i);
  assert.match(terms, /Acceptable use/);
  assert.match(terms, /Wikipedia\/Wikimedia/);
  assert.match(privacy, /What can leave this device/);
  assert.match(age, /Eidovara is for adults 18+/);
  assert.match(age, /--i-am-18-or-older/);
  for (const page of [site, terms, privacy, age, read('docs/licensing.html')]) {
    assert.match(page, /script-src 'none'/);
    assert.doesNotMatch(page, /official iOS app|Apple Inc\. product|licensed SF Pro files are required/i);
  }
});

test('desktop age gate requires terms checkbox and main-process enforcement', () => {
  const main = read('src/electron/main.js');
  const html = read('src/renderer/index.html');
  const renderer = read('src/renderer/renderer.js');
  const preload = read('src/electron/preload.cjs');
  assert.match(main, /function requireAgeGate/);
  assert.match(main, /requireAgeGate\(\)/);
  assert.match(main, /confirmed !== true/);
  assert.match(preload, /acceptAgeGate: confirmed/);
  assert.match(html, /ageGateTermsCheck/);
  assert.match(html, /id="legalOverlay"/);
  assert.match(html, /I confirm I am 18 or older and I accept the Terms/);
  assert.match(html, /id="ageGateAcceptBtn" disabled/);
  assert.match(renderer, /acceptAgeGate\(true\)/);
  assert.match(renderer, /ageGateTermsCheck/);
  assert.match(renderer, /showLegal\('terms'\)/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
  assert.match(html, /media-src https: eidovara-media:/);
});

test('in-app legal overlay does not claim Apple, payments, or consciousness', () => {
  const html = read('src/renderer/index.html');
  assert.match(html, /not an iOS or iPhone product/);
  assert.match(html, /does not require licensed SF Pro/);
  assert.match(html, /local-admin testing only/);
  assert.doesNotMatch(html, /I am conscious|scientifically proven consciousness|®/);
});
