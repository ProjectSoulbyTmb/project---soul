import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');

test('legal docs state source-available 18+ unsigned Windows terms without fake registrations', () => {
  for (const file of ['TERMS.md', 'AGE.md', 'PRIVACY.md', 'LEGAL_NOTICES.md', 'LICENSE', 'README.md', 'installer/EULA.txt', 'OWNERSHIP.md']) {
    assert.match(read(file), /18/);
  }
  assert.match(read('TERMS.md'), /source-available, not open source/i);
  assert.match(read('TERMS.md'), /unauthorized access/i);
  assert.match(read('TERMS.md'), /Wikipedia\/Wikimedia/);
  assert.match(read('TERMS.md'), /user-confirmed/i);
  assert.match(read('TERMS.md'), /Authenticode-unsigned/i);
  assert.match(read('TERMS.md'), /not legal advice/i);
  assert.match(read('TERMS.md'), /local administrator testing only/i);
  assert.doesNotMatch(read('TERMS.md'), /patent pending|PCI[- ]DSS certified|federally registered trademark/i);
  assert.match(read('AGE.md'), /18 years old/i);
  assert.match(read('PRIVACY.md'), /What can leave the machine/);
  assert.match(read('PRIVACY.md'), /Wikipedia \/ Wikimedia/);
  assert.match(read('LICENSE'), /TERMS\.md/);
  assert.match(read('installer/EULA.txt'), /NOT open source/);
  assert.match(read('package.json'), /installer\/EULA\.txt/);
});

test('LICENSE, TERMS, and NOTICE reserve first-party rights and are not OSI open source', () => {
  const license = read('LICENSE');
  const terms = read('TERMS.md');
  const notice = read('NOTICE.md');
  const eula = read('installer/EULA.txt');
  for (const text of [license, terms, notice, eula, read('OWNERSHIP.md'), read('LEGAL_NOTICES.md')]) {
    assert.match(text, /Copyright .{0,6}2026 Tyler Michael Bosworth\. All rights reserved/i);
    assert.match(text, /Source-available/i);
    assert.match(text, /LICENSE/);
    assert.match(text, /TERMS/);
    assert.match(text, /[Tt]hird-party/);
  }
  assert.match(license, /Eidovara Source-Available Evaluation License/);
  assert.match(license, /18 years of age or older/);
  assert.match(license, /does not claim ownership of Electron, Chromium, Node\.js/);
  assert.match(license, /Microsoft Windows/);
  assert.match(license, /Wikipedia\/Wikimedia/);
  assert.match(license, /user-created content/);
  assert.match(license, /intended publisher/);
  assert.match(license, /not a U\.S\. Copyright Office\s+registration/i);
  assert.doesNotMatch(license, /Permission is hereby granted, free of charge/);
  assert.doesNotMatch(license, /GNU General Public License/);
  assert.doesNotMatch(license, /Apache License, Version 2/);
  assert.doesNotMatch(license, /OSI[- ]approved|open source license/i);
  assert.doesNotMatch(license, /Copyright Office registration no\.|U\.S\. Patent No\.|patent pending/i);
  assert.match(terms, /not MIT, Apache, or GPL/);
  assert.match(terms, /not.*OSI open-source/i);
  assert.ok(eula.includes('Eidovara Source-Available Evaluation License 1.0'));
  assert.ok(eula.includes(license.trim()));
  assert.match(read('package.json'), /SEE LICENSE IN LICENSE/);
  assert.doesNotMatch(read('package.json'), /"license":\s*"(MIT|Apache-2\.0|ISC|GPL)/);
});

test('ownership record is honest: GitHub ToS, user content, unsigned templates, no counsel opinion', () => {
  const ownership = read('OWNERSHIP.md');
  assert.match(ownership, /not legal advice/i);
  assert.match(ownership, /not a court judgment/i);
  assert.match(ownership, /GitHub/);
  assert.match(ownership, /Users retain/);
  assert.match(ownership, /Soul Consciousness Studios/);
  assert.match(ownership, /intended publisher/i);
  assert.match(ownership, /unregistered/i);
  assert.match(ownership, /does \*\*not\*\* claim ®|does not claim ®|unregistered/i);
  assert.doesNotMatch(ownership, /this assignment has been signed|executed by all contributors/i);
  assert.doesNotMatch(ownership, /Copyright Office registration number|USPTO Registration No/i);
  const cla = read('docs/CONTRIBUTOR_ASSIGNMENT.md');
  assert.match(cla, /template only/i);
  assert.match(cla, /not executed/i);
  assert.match(cla, /Do not .*GitHub pull request/i);
  assert.match(cla, /Tyler Michael Bosworth/);
  assert.match(cla, /no signatures/i);
  assert.doesNotMatch(cla, /signed on August 21, 2026|Contributor: Jane Doe/);
  const entity = read('docs/ENTITY_IP_ASSIGNMENT.md');
  assert.match(entity, /template only/i);
  assert.match(entity, /not executed/i);
  assert.match(entity, /does \*\*not\*\* automatically transfer|does not automatically transfer/i);
  assert.match(read('CONTRIBUTING.md'), /prior written approval|first approves the work in writing/i);
  assert.match(read('CONTRIBUTING.md'), /docs\/CONTRIBUTOR_ASSIGNMENT\.md/);
  assert.match(read('.github/pull_request_template.md'), /Tyler Michael Bosworth/);
  assert.match(read('.github/pull_request_template.md'), /does not transfer ownership/);
  assert.match(read('docs/CHAIN_OF_TITLE.md'), /Electron/);
  assert.match(read('docs/CHAIN_OF_TITLE.md'), /Chromium/);
  assert.match(read('docs/CHAIN_OF_TITLE.md'), /First-party schedule/);
  assert.match(read('docs/CHAIN_OF_TITLE.md'), /template only/);
  assert.match(read('docs/CHAIN_OF_TITLE.md'), /not executed/);
  assert.doesNotMatch(read('docs/CHAIN_OF_TITLE.md'), /this assignment has been signed|Copyright Office registration number/i);
  assert.match(cla, /Exhibit A/);
  assert.match(entity, /Exhibit A/);
  assert.match(read('TRADEMARKS.md'), /knockout screen|preliminary exact-word/i);
  assert.match(read('TRADEMARKS.md'), /trademark attorney/);
  assert.match(read('TRADEMARKS.md'), /USPTO/);
  assert.match(read('LICENSE'), /No patent license is granted/);
  assert.match(read('LICENSE'), /No trademark license is granted/);
  assert.match(read('LICENSE'), /docs\/CONTRIBUTOR_ASSIGNMENT\.md/);
  assert.match(read('LICENSE'), /Posting a pull request is not assignment/);
});

test('legal-instrument pack is templates and notices, not registrations or OSI giveaway', () => {
  const copyright = read('docs/COPYRIGHT.md');
  const filing = read('docs/TRADEMARK_FILING.md');
  const brand = read('docs/BRAND_GUIDE.md');
  const claim = read('COPYRIGHT.txt');
  const marks = read('TRADEMARKS.md');
  assert.match(copyright, /copyright\.gov/);
  assert.match(copyright, /not a U\.S\. Copyright Office registration/i);
  assert.match(copyright, /standard file header|single block/i);
  assert.doesNotMatch(copyright, /Registration Number TX|Certificate of Registration issued/i);
  assert.match(filing, /not a trademark application/i);
  assert.match(filing, /No trademark application is filed by this commit/i);
  assert.match(filing, /Class/);
  assert.match(filing, /specimen/i);
  assert.doesNotMatch(filing, /Serial No\.|Registration No\. \d{7}/);
  assert.match(brand, /system font/i);
  assert.match(brand, /SF Pro/);
  assert.match(brand, /Do not/);
  assert.match(brand, /Jarvis|Marvel/i);
  assert.match(claim, /Tyler Michael Bosworth/);
  assert.match(claim, /not a U\.S\. Copyright Office registration/i);
  assert.match(claim, /Eidovara Source-Available Evaluation License/);
  assert.match(marks, /Eidovara is a trademark of Tyler Michael Bosworth \(unregistered\)/);
  assert.match(marks, /Windows/);
  assert.match(marks, /GitHub/);
  assert.match(marks, /Electron/);
  assert.match(marks, /Cloudflare/);
  assert.match(marks, /Wikipedia/);
  assert.match(marks, /Spotify/);
  assert.match(marks, /YouTube/);
  assert.match(marks, /not affiliated/i);
  assert.match(marks, /Marvel/);
  assert.match(marks, /Jarvis/i);
  assert.match(read('docs/CONTRIBUTOR_ASSIGNMENT.md'), /Sign privately; posting a PR is not assignment/i);
  assert.match(read('docs/legal.html'), /COPYRIGHT\.md/);
  assert.match(read('docs/legal.html'), /TRADEMARK_FILING\.md/);
  assert.match(read('docs/licensing.html'), /Eidovara is a trademark of Tyler Michael Bosworth \(unregistered\)/);
  assert.match(read('src/renderer/index.html'), /LICENSE and TRADEMARKS\.md/);
  assert.match(read('NOTICE.md'), /Electron/);
  assert.match(read('NOTICE.md'), /43\.4\.1/);
  assert.match(read('NOTICE.md'), /rcedit/);
  assert.doesNotMatch(read('NOTICE.md'), /\blodash\b|\bexpress\b|\breact\b/);
});

test('website legal pages cover terms, privacy, age, and Apple disclaimer', () => {
  const site = read('docs/index.html');
  const terms = read('docs/terms.html');
  const privacy = read('docs/privacy.html');
  const age = read('docs/age.html');
  const licensing = read('docs/licensing.html');
  assert.match(site, /Download Windows Alpha \(18\+\)/);
  assert.match(site, /Source-available, not open source/);
  assert.match(site, /not an iOS or iPhone product/i);
  assert.match(site, /id="download"/);
  assert.match(site, /Get Eidovara/);
  assert.match(site, /Tyler Michael Bosworth/);
  assert.match(terms, /Acceptable use/);
  assert.match(terms, /Wikipedia\/Wikimedia/);
  assert.match(privacy, /What can leave this device/);
  assert.match(age, /Eidovara is for adults 18+/);
  assert.match(age, /--i-am-18-or-older/);
  assert.match(licensing, /Tyler Michael Bosworth/);
  assert.match(licensing, /Source-available; use governed by LICENSE \+ TERMS/);
  assert.match(licensing, /not an OSI open-source license/);
  assert.match(licensing, /not community OSI open source|not a formed entity/);
  for (const page of [site, terms, privacy, age, licensing]) {
    assert.match(page, /Content-Security-Policy/i);
    assert.match(page, /script-src '(?:self|none)'/);
    assert.doesNotMatch(page, /unsafe-inline|unsafe-eval/);
    assert.match(page, /Tyler Michael Bosworth/);
    assert.doesNotMatch(page, /official iOS app|Apple Inc\. product|licensed SF Pro files are required/i);
    assert.doesNotMatch(page, /owned by Apple|community OSS|OSI-approved/i);
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
  assert.match(html, /© 2026 Tyler Michael Bosworth\. All rights reserved/);
  assert.match(html, /Source-available; use governed by LICENSE \+ TERMS/);
  assert.match(html, /Users own their own content/);
  assert.match(html, /not legal advice/);
  assert.match(html, /Soul Consciousness Studios™ \(unregistered\)/);
  assert.doesNotMatch(html, /I am conscious|scientifically proven consciousness|®/);
});

test('network, security, and licensing docs match current fail-closed v0.18.2 surface', () => {
  const destinations = [
    /en\.wikipedia\.org/,
    /commons\.wikimedia\.org/,
    /api\.search\.brave\.com/,
    /chat\/completions/,
    /\/health/,
    /\/v1\/config/,
    /\/v1\/status/,
    /\/v1\/assist/,
    /github\.com\/ProjectSoulbyTmb\/project---soul/,
    /Spotify/,
    /YouTube/
  ];
  for (const file of ['NETWORK-USAGE.md', 'docs/NETWORK_USAGE.md']) {
    const text = read(file);
    for (const pattern of destinations) assert.match(text, pattern, `${file} ${pattern}`);
    assert.match(text, /fail-closed/i);
    assert.match(text, /paymentsEnabled/);
    assert.match(text, /Enhancement-allowed vs blocked/);
    assert.match(text, /neural TTS/);
    assert.match(text, /VRM/);
    assert.match(text, /OBS/);
    assert.match(text, /media-src 'self'/);
    assert.match(text, /18\+/);
    assert.match(text, /source-available/i);
    assert.match(text, /Authenticode-unsigned/);
    assert.doesNotMatch(text, /dreambot333\.workers\.dev/);
    assert.doesNotMatch(text, /patent pending|PCI[- ]DSS certified|federally registered trademark/i);
  }
  const security = read('SECURITY.md');
  assert.match(security, /sandboxed/i);
  assert.match(security, /fail-closed/);
  assert.match(security, /paymentsEnabled/);
  assert.match(security, /media-src https: eidovara-media:/);
  assert.match(security, /\/v1\/assist/);
  assert.match(security, /fail-on-severity: moderate/);
  assert.match(security, /Settings → Code security/);
  assert.match(security, /Dependency graph/);
  assert.match(security, /Authenticode-unsigned/);
  const legal = read('LEGAL_NOTICES.md');
  assert.match(legal, /age 18 or older/);
  assert.match(legal, /Authenticode-unsigned/);
  assert.match(legal, /fail-closed/);
  assert.match(legal, /source-available/i);
  assert.doesNotMatch(legal, /PCI[- ]DSS certified/i);
  const license = read('LICENSE');
  assert.match(license, /18 years of age or older/);
  assert.match(license, /Source-Available/);
  assert.match(license, /\/v1\/assist|health\/config\/status\/assist/);
  assert.match(license, /neural TTS, VRM, OBS/);
  const third = read('THIRD_PARTY_NOTICES.md');
  assert.match(third, /\/v1\/assist/);
  assert.match(third, /fail-closed/);
  assert.match(third, /Neural TTS/);
  const companions = read('docs/COMPANION_MODELS.md');
  assert.match(companions, /Blocked in v0\.18\.2/);
  assert.match(companions, /Neural TTS/);
  assert.match(companions, /VRM/);
  assert.match(companions, /OBS websocket/);
  assert.match(companions, /Live payments/);
  const licensingPage = read('docs/licensing.html');
  assert.match(licensingPage, /Source-available/i);
  assert.match(licensingPage, /Adults 18\+/);
  assert.match(licensingPage, /Authenticode-unsigned/);
  assert.match(licensingPage, /fail-closed/);
  assert.match(licensingPage, /\/v1\/assist/);
  assert.match(licensingPage, /neural TTS/);
  const securityPage = read('docs/security.html');
  assert.match(securityPage, /fail-closed/);
  assert.match(securityPage, /Adults 18\+/);
  assert.match(securityPage, /Source-available, not open source/);
  assert.match(securityPage, /Authenticode-unsigned/);
  assert.match(securityPage, /\/v1\/assist/);
  assert.match(securityPage, /media-src https: eidovara-media:/);
  assert.match(read('PRIVACY.md'), /fail-closed/);
  assert.match(read('PRIVACY.md'), /\/v1\/assist/);
  assert.match(read('docs/privacy.html'), /fail-closed/);
  assert.match(read('.github/workflows/dependency-review.yml'), /fail-on-severity: moderate/);
  assert.doesNotMatch(read('src/renderer/index.html'), /media-src [^"]*'self'/);
  assert.match(read('src/core/service.js'), /checkoutEnabledFromRemoteConfig\(_body\) \{\s*return false;/);
  assert.match(read('src/electron/main.js'), /sandbox: true/);
});
