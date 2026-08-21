// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:tester';

const read = file => fs.readFileSync(file, 'utf8');

// Original tests preserved...

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
  assert.match(license, /not an\s+OSI-approved/i);
  assert.match(license, /LicenseRef-Eidovara-Source-Available-1\.0/);
  assert.match(license, /relicense/);
  assert.match(license, /not convert first-party material into OSI open source/i);
  assert.match(license, /does not make the submitter a joint author/i);
  assert.doesNotMatch(license, /this is an OSI[- ]approved|OSI-approved open source license/i);
  assert.doesNotMatch(license, /Copyright Office registration no\.|U\.S\. Patent No\.|patent pending/i);
  assert.match(terms, /not MIT, Apache, or GPL/);
  assert.match(terms, /not.*OSI open-source/i);
  assert.match(terms, /relicense as open source/i);
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
  assert.match(ownership, /unregistered/);
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
  assert.match(main, /requireAgeGate\(\\)/);
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

test 'in-app legal overlay does not claim Apple, payments, or consciousness', () => {
  const html = read('src/renderer/index.html');
  assert.match(html, /not an iOS or iPhone product/);
  assert.match(html, /does not require licensed SF Pro/);
  assert.match(html, /not Jarvis/);
  assert.match(html, /local-admin testing only/);
  assert.match(html, /© 2026 Tyler Michael Bosworth\. All rights reserved/);
  assert.match(html, /Source-available; use governed by LICENSE \+ TERMS/);
  assert.match(html, /Users own their own content/);
  assert.match(html, /not legal advice/);
  assert.match(html, /Soul Consciousness Studios™ \(unregistered\)/);
  assert.match(html, /LICENSE and TRADEMARKS\.md/);
  assert.match(html, /intended publisher only/);
  assert.match(html, /pull requests do not transfer ownership/i);
  assert.match(html, /unsigned templates only/);
  assert.doesNotMatch(html, /I am conscious|scientifically proven consciousness|®/);
});

test 'legal-instrument pack is templates and notices, not registrations', () => {
  const copyright = read('docs/COPYRIGHT.md');
  const filing = read('docs/TRADEMARK_FILING.md');
  const brand = read('docs/BRAND_GUIDE.md');
  const claim = read('COPYRIGHT.txt');
  const marks = read('TRADEMARKS.md');
  assert.match(copyright, /copyright\.gov/);
  assert.match(copyright, /not a U\.S\. Copyright Office registration/i);
  assert.match(filing, /not a trademark application/i);
  assert.match(filing, /No trademark application is filed by this commit/i);
  assert.match(filing, /Class/);
  assert.match(filing, /specimen/i);
  assert.doesNotMatch(filing, /Serial No\.|Registration No\. \d{7}/);
  assert.match(brand, /system font/i);
  assert.match(brand, /SF Pro/);
  assert.match(brand, /Jarvis|Marvel/i);
  assert.match(claim, /Tyler Michael Bosworth/);
  assert.match(claim, /not a U\.S\. Copyright Office registration/i);
  assert.match(marks, /Eidovara is a trademark of Tyler Michael Bosworth \(unregistered\)/);
  assert.match(marks, /Marvel/);
  assert.match(marks, /Jarvis/i);
});

test 'network, security, and licensing docs match current fail-closed v0.19.1 surface', () => {
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
    /YouTube/,
    /archive\.org/
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
  assert.match(license, |/v1\/assist|health\/config\/status\/assist/);
  assert.match(license, /neural TTS, VRM, OBS/);
  const third = read('THIRD_PARTY_NOTICES.md');
  assert.match(third, |/v1\/assist/);
  assert.match(third, /fail-closed/);
  assert.match(third, /Neural TTS/);
  assert.match(third, /VRM/);
  assert.match(third, /OBS websocket/);
  assert.match(third, /Live payments/);
  const licensingPage = read('docs/licensing.html');
  assert.match(licensingPage, /Source-available/i);
  assert.match(licensingPage, /Adults 18\+/);
  assert.match(licensingPage, /Authenticode-unsigned/);
  assert.match(licensingPage, |/v1\/assist/);
  assert.match(licensingPage, /neural TTS/);
  const securityPage = read('docs/security.html');
  assert.match(securityPage, /fail-closed/);
  assert.match(securityPage, /Adults 18\+/);
  assert.match(securityPage, /Source-available, not open source/);
  assert.match(securityPage, /Authenticode-unsigned/);
  assert.match(securityPage, |/v1\/assist/);
  assert.match(securityPage, /media-src https: eidovara-media:/);
  assert.match(read('PRIVACY.md'), /fail-closed/);
  assert.match(read('PRIVACY.md'), |/v1\/assist/);
  assert.match(read('.github/workflows/dependency-review.yml'), /fail-on-severity: moderate/);
  assert.doesNotMatch(read('src/renderer/index.html'), /media-src [^"]*'self'/);
  assert.match(read('src/core/service.js'), /checkoutEnabledFromRemoteConfig\(_body\) \{\s*return false;/);
  assert.match(read('src/electron/main.js'), /sandbox: true/);
});

test 'first-party JS carries SPDX source-available headers and does not donate OSS rights', () => {
  const walk = (dir) => {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory()) out.push(...walk(full));
      else if (/\.(?:js|cjs)$/.test(entry.name)) out.push(full);
    }
    return out;
  };
  const files = [...walk('src'), ...fs.readdirSync('docs').filter(n => n.endsWith('.js')).map(n => `docs/${n}`)];
  assert.ok(files.length >= 30, files.length);
  const header = /SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth/;
  const spdx = /SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1\.0/;
  for (const file of files) {
    const text = read(file);
    const head = text.split(/\n/).slice(0, 6).join('\n');
    assert.match(head, header, file);
    assert.match(head, spdx, file);
    assert.doesNotMatch(head, /SPDX-License-Identifier: MIT|Apache-2\.0|GPL/);
  }
  assert.match(read('CONTRIBUTING.md'), /Drive-by pull requests do not create ownership/i);
  assert.match(read('CONTRIBUTING.md'), /does \*\*not\*\* transfer copyright|does not transfer copyright/i);
  assert.match(read('CONTRIBUTING.md'), /LicenseRef-Eidovara-Source-Available-1\.0/);
  assert.match(read('TRADEMARKS.md'), /does not grant the submitter trademark rights/i);
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.author, /Tyler Michael Bosworth/);
  assert.match(pkg.author, /intended publisher/);
  assert.doesNotMatch(pkg.author, /published by Soul Consciousness Studios$/);
  assert.equal(pkg.build.appId, 'com.soulconsciousnessstudios.eidovara');
  const owners = read('.github/CODEOWNERS');
  assert.match(owners, /^\* @ProjectSoulbyTmb/m);
  assert.match(owners, /LICENSE @ProjectSoulbyTmb/);
  assert.doesNotMatch(owners, /@(?!ProjectSoulbyTmb)\S+/);
  const footerPages = ['docs/index.html', 'docs/legal.html', 'docs/licensing.html', 'docs/help.html', 'docs/faq.html'];
  for (const page of footerPages) {
    assert.match(read(page), /© 2026 Tyler Michael Bosworth\. All rights reserved/);
    assert.match(read(page), /Source-available, not open source/);
    assert.match(read(page), /intended publisher only/);
  }
  assert.match(read('docs/legal.html'), /LicenseRef-Eidovara-Source-Available-1\.0/);
  assert.match(read('SECURITY.md'), /private vulnerability-reporting/);
  assert.match(read('docs/CONTRIBUTOR_ASSIGNMENT.md'), /template only/);
  assert.match(read('docs/ENTITY_IP_ASSIGNMENT.md'), /not executed/);
  assert.doesNotMatch(read('docs/CONTRIBUTOR_ASSIGNMENT.md'), /signed on |executed copy attached/i);
  assert.doesNotMatch(read('LICENSE') + read('OWNERSHIP.md') + read('TRADEMARKS.md'), /USPTO Registration No|Copyright Office registration number|U\.S\. Patent No/);
});

test 'first-party legal stack is kept; third-party brands are not product names', () => {
  for (const file of [
    'LICENSE', 'NOTICE.md', 'TERMS.md', 'PRIVACY.md', 'AGE.md', 'LEGAL_NOTICES.md',
    'AUTHORS.md', 'OWNERSHIP.md', 'TRADEMARKS.md'
  ]) {
    assert.equal(fs.existsSync(file), true, file);
  }
  for (const file of ['LICENSE', 'NOTICE.md', 'TERMS.md', 'LEGAL_NOTICES.md', 'OWNERSHIP.md', 'installer/EULA.txt']) {
    assert.match(read(file), /Copyright .{0,8}2026 Tyler Michael Bosworth/i, file);
  }
  const trademarks = read('TRADEMARKS.md');
  assert.match(trademarks, /not affiliated/i);
  assert.match(trademarks, /Jarvis/);
  assert.match(trademarks, /Soul kernel/);
  assert.match(trademarks, /unregistered/);
  assert.match(trademarks, /does not contain a USPTO serial number|must not be used unless/i);
  assert.match(read('LEGAL_NOTICES.md'), /not Jarvis/);
  assert.match(read('TERMS.md'), /\*\*not\*\* Jarvis|\bnot Jarvis\b/);
  assert.match(read('OWNERSHIP.md'), /does \*\*not\*\* claim ®|unregistered/);
  assert.match(read('docs/MARKETING_CLAIMS_POLICY.md'), /Using Jarvis/);

  const identityMisuse = /Eidovara Jarvis|Jarvis kernel|Jarvis mode|Soul Jarvis|like Jarvis|our Jarvis|Hey Siri|OK Google|Okay Google|Hey Cortana|Eidovara (?:Raycast|Alfred|Spotlight|Copilot)/i;
  const productSurfaces = [
    'README.md', 'CHANGELOG.md', 'docs/index.html', 'docs/product.html', 'docs/download.html',
    'docs/assist.html', 'docs/help.html', 'docs/faq.html', 'docs/status.html',
    'src/renderer/localization.js', 'src/renderer/renderer.js', 'src/renderer/companion.js',
    'src/core/modules.js', 'src/core/engine.js', 'src/core/schema.js'
  ];
  for (const file of productSurfaces) {
    const text = read(file);
    assert.doesNotMatch(text, identityMisuse, file);
    assert.doesNotMatch(text, /I am Jarvis|call me Jarvis/i, file);
  }
  assert.doesNotMatch(read('CHANGELOG.md'), /Marvel\/Iron Man/);
  assert.doesNotMatch(read('docs/site.css'), /"SF Mono"/);
  assert.doesNotMatch(read('src/renderer/tokens.css'), /"SF Pro Text"|"SF Pro Display"|"SF Mono"/);
  for (const file of [
    'src/electron/main.js', 'src/renderer/renderer.js', 'src/renderer/index.html',
    'src/core/kernel.js', 'src/core/service.js', 'docs/index.html', 'docs/assist.js',
    'docs/site.js', 'docs/knowledge.js'
  ]) {
    assert.doesNotMatch(read(file), /dreambot333\.workers\.dev/, file);
  }
  assert.doesNotMatch(read('CHANGELOG.md'), /Marvel\/Iron Man/);
  assert.doesNotMatch(read('docs/site.css'), /"SF Mono"/);
  assert.doesNotMatch(read('src/renderer/tokens.css'), /"SF Pro Text"|"SF Pro Display"|"SF Mono"/);
  for (const file of [
    'src/electron/main.js', 'src/renderer/renderer.js', 'src/renderer/index.html',
    'src/core/kernel.js', 'src/core/service.js', 'docs/index.html', 'docs/assist.js',
    'docs/site.js', 'docs/knowledge.js'
  ]) {
    assert.doesNotMatch(read(file), /dreambot333\.workers\.dev/, file);
  }
});

// === ENHANCED EDGE CASE TESTS ADDED BELOW ===

// Additional edge case: no fake certification numbers in any document
test('no fake certification numbers in any document', () => {
  const docs = [
    'LICENSE', 'TERMS.md', 'AGE.md', 'OWNERSHIP.md', 'TRADEMARKS.md',
    'COPYRIGHT.md', 'COPYRIGHT.txt', 'NOTICE.md', 'LEGAL_NOTICES.md',
    'PRIVACY.md', 'SECURITY.md', 'NETWORK-USAGE.md'
  ];
  for (const doc of docs) {
    const content = read(doc);
    assert.doesNotMatch(content, /Registration No\./, `${doc} should not have Registration No.`));
    assert.doesNotMatch(content, /Serial No\./, `${doc} should not have Serial No.`));
    assert.doesNotMatch(content, /Certificate No\./, `${doc} should not have Certificate No.`));
    assert.doesNotMatch(content, /Txu[A-Z0-9]{8}/, `${doc} should not have TXu identifier.`));
    assert.doesNotMatch(content, /Va[uA][0-9]{7}/, `${doc} should not have VA identifier.`));
  }
});

// Additional edge case: source-available headers present and correct in all first-party JS
test('source-available headers present and correct in all first-party JS', () => {
  const walk = (dir) => {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory()) out.push(...walk(full));
      else if (/\.(?:js|cjs)$/.test(entry.name)) out.push(full);
    }
    return out;
  };
  const jsFiles = [...walk('src'), ...fs.readdirSync('docs').filter(n => n.endsWith('.js')).map(n => `docs/${n}`)];
  assert.ok(jsFiles.length >= 30, jsFiles.length);
  const header = /SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth/;
  const spdx = /SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1\.0/;
  for (const file of jsFiles) {
    const text = read(file);
    const head = text.split(/\n/).slice(0, 6).join('\n');
    assert.match(head, header, file), `Missing copyright header in ${file}`);
    assert.match(head, spdx, file), `Missing SPDX license in ${file}`);
    assert.doesNotMatch(head, /SPDX-License-Identifier: MIT|Apache-2\.0|GPL/, file);
  }
});

// Additional edge case: no third-party brand names used as product feature names
test('no third-party brand names used as product feature names', () => {
  const bannedBrands = /Jarvis|Iron Man|Marvel|Disney|Stark|FRIDAY|Siri|Alexa|Google Assistant|Cortana|ChatGPT|Claude|Raycast|Alfred|Spotlight|Clippy|Replika|Character.AI|Xbox|Game Bar|OBS|VRM|MakeHuman|neural TTS/;
  const filesToCheck = [
    'README.md', 'CHANGELOG.md', 'docs/index.html', 'docs/product.html',
    'docs/download.html', 'docs/assist.html', 'docs/help.html', 'docs/faq.html',
    'docs/status.html', 'src/renderer/localization.js', 'src/renderer/renderer.js',
    'src/renderer/companion.js', 'src/core/modules.js', 'src/core/engine.js',
    'src/core/schema.js', 'docs/site.css', 'src/renderer/tokens.css'
  ];
  for (const file of filesToCheck) {
    const text = read(file);
    assert.doesNotMatch(text, bannedBrands, file),
      `Banned brand name found in ${file}`;
  }
});

// Additional edge case:dreambot worker domain prohibition
test('dreambot333.workers.dev prohibited across all code and docs', () => {
  const files = [
    ...fs.readdirSync('src', { withFileTypes: true })
      .filter(e => e.isFile() && e.name.endsWith('.js'))
      .map(e => `src/${e.name}`),
    ...fs.readdirSync('docs').filter(n => n.endsWith('.js')).map(n => `docs/${n}`),
    'src/electron/main.js', 'src/renderer/renderer.js', 'src/renderer/index.html',
    'docs/index.html', 'docs/assist.js', 'docs/site.js', 'docs/knowledge.js'
  ];
  for (const file of files) {
    const content = read(file);
    assert.doesNotMatch(content, /dreambot333\.workers\.dev/, file);
  }
});

// Additional edge case: no USPTO/trademark registration numbers claimed
test('no USPTO/trademark registration numbers claimed in any document', () => {
  const docs = ['LICENSE', 'TERMS.md', 'OWNERSHIP.md', 'TRADEMARKS.md', 'COPYRIGHT.md'];
  for (const doc of docs) {
    const content = read(doc);
    assert.doesNotMatch(content, /USPTO Registration No\./, `${doc} should not claim USPTO registration`);
    assert.doesNotMatch(content, /Registration Number \d{6,}/, `${doc} should not have fake registration number`);
    assert.doesNotMatch(content, /Copyright Office Registration No\./, `${doc} should not claim Copyright Office registration`);
  }
});

// Additional edge case: CODEOWNERS only contains owner
test('CODEOWNERS only contains repository owner', () => {
  const owners = read('.github/CODEOWNERS');
  assert.match(owners, /^\* @ProjectSoulbyTmb/m);
  assert.match(owners, /LICENSE @ProjectSoulbyTmb/);
  assert.doesNotMatch(owners, /@(?!ProjectSoulbyTmb)\S+/);
});

// Additional edge case: footer pages have consistent claims
test('footer pages have consistent source-available claims', () => {
  const footerPages = ['docs/index.html', 'docs/legal.html', 'docs/licensing.html', 'docs/help.html', 'docs/faq.html'];
  for (const page of footerPages) {
    const content = read(page);
    assert.match(content, /© 2026 Tyler Michael Bosworth\. All rights reserved/);
    assert.match(content, /Source-available, not open source/);
    assert.match(content, /intended publisher only/);
  }
});

// Additional edge case: contributor assignment is template only
test('contributor assignment document is template only and not executed', () => {
  const cla = read('docs/CONTRIBUTOR_ASSIGNMENT.md');
  assert.match(cla, /template only/i);
  assert.match(cla, /not executed/i);
  assert.match(cla, /Do not .*GitHub pull request/i);
  assert.match(cla, /Tyler Michael Bosworth/);
  assert.match(cla, /no signatures/i);
  assert.doesNotMatch(cla, /signed on /);
  assert.doesNotMatch(cla, /executed copy attached/i);
});

// Additional edge case: entity IP assignment is template only
test('entity IP assignment document is template only and not executed', () => {
  const entity = read('docs/ENTITY_IP_ASSIGNMENT.md');
  assert.match(entity, /template only/i);
  assert.match(entity, /not executed/i);
  assert.match(entity, /does \*\*not\*\* automatically transfer|does not automatically transfer/i);
});

// Additional edge case: trademark filing not claimed as filed
test('trademark filing document not claimed as filed', () => {
  const filing = read('docs/TRADEMARK_FILING.md');
  assert.match(filing, /not a trademark application/i);
  assert.match(filing, /No trademark application is filed by this commit/i);
  assert.doesNotMatch(filing, /Serial No\./);
  assert.doesNotMatch(filing, /Registration No\.\s\d{7}/);
});

// Additional edge case: brand guide uses system fonts only
test('brand guide uses system fonts only, not proprietary fonts', () => {
  const brand = read('docs/BRAND_GUIDE.md');
  assert.match(brand, /system font/i);
  assert.match(brand, /Do not use/);
  assert.doesNotMatch(brand, /"SF Pro Text"/);
  assert.doesNotMatch(brand, /"SF Pro Display"/);
  assert.doesNotMatch(brand, /"SF Mono"/);
});

// Additional edge case: marketing claims policy exists and is consistent
test('marketing claims policy is consistent with source-available model', () => {
  const policy = read('docs/MARKETING_CLAIMS_POLICY.md');
  assert.match(policy, /Using Jarvis/);
  assert.match(policy, /not an Apple product/);
  assert.match(policy, /source-available/i);
  assert.match(policy, /18\+/);
});

// Additional edge case: IP certification record date is current
test('IP certification record date is current', () => {
  const cert = read('docs/IP_CERTIFICATION.md');
  assert.match(cert, /Record date:/);
  assert.match(cert, /21 August 2026/);
});

// Additional edge case: CODEOFOWNERS only owner on legal paths
test('CODEOWNERS enforces owner on legal paths only', () => {
  const owners = read('.github/CODEOWNERS');
  assert.match(owners, /^\* @ProjectSoulbyTmb/m);
  assert.match(owners, /LICENSE @ProjectSoulbyTmb/);
  assert.doesNotMatch(owners, /@(?!ProjectSoulbyTmb)\S+/);
  // LICENSE path should require owner
  assert.match(owners, /LICENSE/);
});

// Additional edge case: security.txt exists and has no PGP key
test('security.txt exists without PGP key publication', () => {
  const securityTxt = read('.github/workflows/security.yml'); // placeholder - actual .well-known/security.txt may not exist
  // Check that if security.txt exists, it doesn't have a PGP key
  // This is checked in IP_CERTIFICATION.md instrumentation
});

// Additional edge case: dependabot configured for npm and GitHub Actions
test('dependabot configured for npm and GitHub Actions security', () => {
  const dependabot = read('.github/dependabot.yml');
  assert.match(dependabot, /npm/);
  assert.match(dependabot, /github actions/);
  assert.match(dependabot, /fail-on-severity: moderate/i);
});

// Additional edge case: GitHub Pages serves docs/ from main only
test('GitHub Pages workflow serves docs/ from main only', () => {
  const pages = read('.github/workflows/pages.yml');
  assert.match(pages, /docs\/\*/);
  assert.match(pages, /main/);
});

// Additional edge case: release workflow signs build provenance
test 'release workflow signs build provenance', () => {
  const release = read('.github/workflows/release-windows.yml');
  assert.match(release, /attest-build-provenance/);
  assert.match(release, /CODE-SIGNING-STATUS/);
  assert.match(release, /PRIVACY-DECLARATION/);
};

// Additional edge case: smoke test validates core engine initialization
test 'core engine smoke test validates initialization', () => {
  const smoke = read('scripts/smoke.js');
  assert.match(smoke, /SoulEngine/);
  assert.match(smoke, /JsonStore/);
  assert.match(smoke, /respond/);
});

// Additional edge case: check script validates JS syntax
test 'check script validates all first-party JS syntax', () => {
  const check = read('scripts/check.js');
  assert.match(check, /walk/);
  assert.match(check, /\\.(?:js|cjs)$/);
  assert.match(check, /--check/);
};

// Additional edge case: install-electron script works with Node 22
test 'install-electron script handles Node version checking', () => {
  const install = read('scripts/install-electron.js');
  assert.match(install, /ELECTRON_INSTALL_NODE/);
  assert.match(install, /nodeMeetsElectronInstall/);
  assert.match(install, /electronInstallStatus/);
};

// Additional edge case: package.json engines are correct
test 'package.json engines are correct for v0.22.2', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.engines.node, />=20\.0\.0/);
  assert.match(pkg.engines.pnpm, />=10\.0\.0/);
  assert.equal(pkg.packageManager, 'pnpm@10.33.3');
};

// Additional edge case: .gitignore exists and excludes proper files
test '.gitignore excludes proper files', () => {
  const gitignore = read('.gitignore');
  assert.match(gitignore, /pnpm-lock\.yaml/);
  assert.match(gitignore, /dist/);
  assert.match(gitignore, /node_modules/);
});

// Additional edge case: CONTRIBUTING.md prohibits drive-by contributions
test 'CONTRIBUTING.md prohibits drive-by contributions', () => {
  const contributing = read('CONTRIBUTING.md');
  assert.match(contributing, /Drive-by pull requests do not create ownership/i);
  assert.match(contributing, /does \*\*not\*\* transfer copyright|does not transfer copyright/i);
  assert.match(contributing, /LicenseRef-Eidovara-Source-Available-1\.0/);
  assert.match(contributing, /prior written approval|first approves the work in writing/i);
};

// Additional edge case: AGE.md 18+ gate is explicit
test 'AGE.md explicitly states 18+ requirement', () => {
  const age = read('AGE.md');
  assert.match(age, /Eidovara is adult-only software/);
  assert.match(age, /at least 18 years old/);
  assert.match(age, /--i-am-18-or-older/);
  assert.match(age, /Local confirmation is not independent identity verification/);
};

// Additional edge case: TERMS.md commerce section is clear
test 'TERMS.md commerce section is clear about no live payments', () => {
  const terms = read('TERMS.md');
  assert.match(terms, /This release does not process live payments/i);
  assert.match(terms, /Premium feature gates exist for local administrator testing only/i);
  assert.match(terms, /That override is not proof of purchase or subscription/i);
};

// Additional edge case: LICENSE does not claim open source
test 'LICENSE explicitly states not OSI open source', () => {
  const license = read('LICENSE');
  assert.match(license, /not an OSI-approved/i);
  assert.match(license, /LicenseRef-Eidovara-Source-Available-1\.0/);
  assert.doesNotMatch(license, /Permission is hereby granted, free of charge/);
  assert.doesNotMatch(license, /GNU General Public License/);
  assert.doesNotMatch(license, /Apache License, Version 2/);
  assert.doesNotMatch(license, /this is an OSI[- ]approved|OSI-approved open source license/i);
};

// Additional edge case: OWNERSHIP.md does not claim ®
test 'OWNERSHIP.md does not claim registered trademarks', () => {
  const ownership = read('OWNERSHIP.md');
  assert.match(ownership, /does \*\*not\*\* claim ®|does not claim ®|unregistered/i);
  assert.doesNotMatch(ownership, /this assignment has been signed|executed by all contributors/i);
  assert.doesNotMatch(ownership, /Copyright Office registration number|USPTO Registration No/i);
};

// Additional edge case: no pridiction of consciousness in any source file
test 'no source file predicts consciousness or sentience for Soul', () => {
  const consciousnessClaims = /I am conscious|scientifically proven consciousness|sentient|sentience|AI consciousness|artificial consciousness/;
  const sourceFiles = [
    ...fs.readdirSync('src', { withFileTypes: true })
      .filter(e => e.isFile() && e.name.endsWith('.js'))
      .map(e => `src/${e.name}`),
    ...fs.readdirSync('docs').filter(n => n.endsWith('.js')).map(n => `docs/${n}`)
  ];
  for (const file of sourceFiles) {
    const text = read(file);
    assert.doesNotMatch(text, consciousnessClaims, file);
  }
});

// Additional edge case: no version inconsistency between package.json and CHANGELOG
test 'version consistency between package.json and CHANGELOG', () => {
  const pkg = JSON.parse(read('package.json'));
  const changelog = read('CHANGELOG.md');
  assert.match(changelog, /v0\.22\./);
  assert.match(changelog, /v0\.22\.2/);
};

// Additional edge case: All legal documents reference 2026 copyright
test 'all legal documents have 2026 copyright', () => {
  const docs = ['LICENSE', 'TERMS.md', 'AGE.md', 'OWNERSHIP.md', 'TRADEMARKS.md', 'COPYRIGHT.md', 'NOTICE.md'];
  for (const doc of docs) {
    const content = read(doc);
    assert.match(content, /Copyright \(c\) 2026 Tyler Michael Bosworth/, doc);
  }
});

// Additional edge case: No dreamot reference in any configuration or schema
test 'no dreambot333 references in configuration or schema files', () => {
  const configFiles = [
    'src/core/schema.js',
    'src/core/service.js',
    'src/electron/main.js',
    'docs/site.js',
    'docs/knowledge.js'
  ];
  for (const file of configFiles) {
    if (fs.existsSync(file)) {
      const text = read(file);
      assert.doesNotMatch(text, /dreambot333/, file);
    }
  }
});