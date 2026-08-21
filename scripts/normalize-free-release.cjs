// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
'use strict';

const fs = require('node:fs');

function patchFile(file, patches) {
  let text = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const { from, to, label } of patches) {
    if (text.includes(to)) continue;
    if (!text.includes(from)) throw new Error(`Free-release normalization could not find ${label || from} in ${file}`);
    text = text.replace(from, to);
    changed = true;
  }
  if (changed) fs.writeFileSync(file, text);
}

patchFile('src/electron/main.js', [
  {
    label: 'edition compatibility shim',
    from: "function entitlement() { return config.edition === 'premium' ? 'premium' : 'free'; }",
    to: "function entitlement() { return 'free'; }"
  },
  {
    label: 'compatible provider Premium gate',
    from: "if (config.provider === 'compatible' && entitlement() === 'premium') return { reply: ({ messages }) => callCompatibleProvider({ endpoint: config.endpoint, apiKey: getApiKey(), model: config.model, messages }) };",
    to: "if (config.provider === 'compatible') return { reply: ({ messages }) => callCompatibleProvider({ endpoint: config.endpoint, apiKey: getApiKey(), model: config.model, messages }) };"
  },
  {
    label: 'search key engine gate',
    from: "searchApiKey: entitlement() === 'premium' ? getSearchApiKey() : '',",
    to: "searchApiKey: getSearchApiKey(),"
  },
  {
    label: 'settings compatible-provider gate',
    from: "  if (entitlement() === 'free' && provider === 'compatible') throw new Error('Remote model endpoints are a Premium feature. Eidovara Free supports offline and local models.');\n",
    to: ''
  },
  {
    label: 'RGB Premium gate',
    from: "rgbEffects: entitlement() === 'premium' && Boolean(incoming.theme.rgbEffects)",
    to: "rgbEffects: Boolean(incoming.theme.rgbEffects)"
  },
  {
    label: 'search-key Premium gate',
    from: "    if (entitlement() === 'free') throw new Error('Broad keyed web search is a Premium feature. Built-in public sources remain available.');\n",
    to: ''
  },
  {
    label: 'manual app-count Premium gate',
    from: "ipcMain.handle('soul:addApplication', async () => { requireAgeGate(); if (entitlement() === 'free' && (config.apps || []).length >= 3) throw new Error('Eidovara Free supports up to three linked applications. Premium removes this limit.');",
    to: "ipcMain.handle('soul:addApplication', async () => { requireAgeGate();"
  },
  {
    label: 'discovered app-count Premium gate',
    from: "  if (entitlement() === 'free' && (config.apps || []).length >= 3) throw new Error('Eidovara Free supports up to three linked applications. Premium removes this limit.');\n",
    to: ''
  },
  {
    label: 'admin edition persistence',
    from: "  requireAgeGate(); requireAdmin(); config.edition = incoming?.edition === 'premium' ? 'premium' : 'free';\n  if (config.edition === 'free') { if (config.provider === 'compatible') config.provider = 'offline'; config.theme = { ...(config.theme || {}), rgbEffects: false }; }",
    to: "  requireAgeGate(); requireAdmin(); config.edition = 'free';"
  }
]);

// main.js contains the engine search-key expression twice. Normalize any second copy.
{
  const file = 'src/electron/main.js';
  let text = fs.readFileSync(file, 'utf8');
  const old = "searchApiKey: entitlement() === 'premium' ? getSearchApiKey() : ''";
  if (text.includes(old)) {
    text = text.split(old).join('searchApiKey: getSearchApiKey()');
    fs.writeFileSync(file, text);
  }
}

patchFile('src/renderer/renderer.js', [
  {
    label: 'renderer feature gates',
    from: "function applyEditionGates(){ const premium=settings?.edition==='premium'; const rgb=$('#themeRgb'); if(rgb){rgb.disabled=!premium; if(!premium) rgb.checked=false;} const search=$('#searchApiKeyInput'), clearSearch=$('#clearSearchKeyInput'); if(search) search.disabled=!premium; if(clearSearch) clearSearch.disabled=false; const compatible=$('#providerSelect option[value=\"compatible\"]'); if(compatible) compatible.disabled=!premium; if(!premium&&$('#providerSelect')?.value==='compatible') $('#providerSelect').value='offline'; const note=$('#premiumFieldsNote'); if(note) note.textContent=premium?t('premiumUnlocked','Premium test gates are on: remote endpoints, Brave search key, RGB, and unlimited apps.'):t('premiumLocked','Free: offline/local models, Wikipedia/Wikimedia research, up to 3 apps. RGB, Brave key, and remote endpoints stay Premium.'); }",
    to: "function applyEditionGates(){ const rgb=$('#themeRgb'); if(rgb) rgb.disabled=false; const search=$('#searchApiKeyInput'), clearSearch=$('#clearSearchKeyInput'); if(search) search.disabled=false; if(clearSearch) clearSearch.disabled=false; const compatible=$('#providerSelect option[value=\"compatible\"]'); if(compatible) compatible.disabled=false; const note=$('#premiumFieldsNote'); if(note) note.textContent='v0.22.2 Alpha: all currently implemented features are included in the free build. No checkout or paid entitlement is required.'; }"
  },
  {
    label: 'renderer status edition copy',
    from: "function renderStatus(){ const premium=settings?.edition==='premium'; $('#modePill').textContent=`${state.policy.mode==='adult'?'Adult Soul':'Standard Soul'} · ${premium?'Premium':'Free'}`;",
    to: "function renderStatus(){ $('#modePill').textContent=`${state.policy.mode==='adult'?'Adult Soul':'Standard Soul'} · Free`;"
  },
  {
    label: 'renderer edition title copy',
    from: "$('#editionTitle').textContent=premium?'Eidovara Premium':'Eidovara Free'; $('#editionDescription').textContent=premium?'The locally implemented Premium feature gates are enabled for testing on this installation.':'Core workspace features with offline/local models, memory, media, backups, updates, and up to three linked apps.'; $('#upgradeBtn').classList.toggle('hidden',premium||!settings?.storeUrl);",
    to: "$('#editionTitle').textContent='Eidovara Free'; $('#editionDescription').textContent='Full v0.22.2 Alpha feature set: local and compatible models, research, media, memory, backups, updates, RGB customization, and linked apps. No paid entitlement is required.'; $('#upgradeBtn').classList.add('hidden');"
  }
]);

patchFile('docs/IP_CERTIFICATION.md', [
  {
    label: 'final installer size',
    from: '106,691,429 bytes (about 101.75 MiB)',
    to: '106,691,524 bytes (about 101.75 MiB)'
  },
  {
    label: 'final installer checksum',
    from: 'A26B8232E6B81A77566610AFF110197022850AB4348F86D390663831584B5DEE',
    to: 'F29A52F0495AB111A277780706E75ED616B6C236E25C3BDDF36E144ED5326675'
  }
]);

patchFile('tests/ip-certification.test.js', [
  {
    label: 'IP markdown checksum assertion',
    from: "  assert.match(md, /A26B8232E6B81A77566610AFF110197022850AB4348F86D390663831584B5DEE/);",
    to: "  assert.match(md, new RegExp(INSTALLER_SHA256));"
  },
  {
    label: 'IP helper wording assertion',
    from: "  assert.match(reply.reply, /not a U\\.S\\. Copyright Office registration|not registered/i);\n  assert.match(reply.reply, /unregistered/i);",
    to: "  assert.match(reply.reply, /not a government registration|not a U\\.S\\. Copyright Office registration|not registered/i);"
  }
]);

patchFile('src/core/knowledge.js', [
  {
    label: 'generic third-party assistant brand routing',
    from: "{ id: 'brands', re: /\\b(jarvis|j\\.a\\.r\\.v\\.i\\.s|iron\\s*man|marvel|disney|stark(?:\\s+industries)?|siri|alexa|google\\s+assistant|copilot|cortana|claude|raycast|alfred|spotlight|clippy|replika|character\\.ai|xbox|game\\s*bar|hey\\s+siri|ok(?:ay)?\\s+google)\\b/i },",
    to: "{ id: 'brands', re: /\\b(another\\s+company(?:'s)?\\s+assistant(?:\\s+product)?|third[- ]party\\s+assistant|jarvis|j\\.a\\.r\\.v\\.i\\.s|iron\\s*man|marvel|disney|stark(?:\\s+industries)?|siri|alexa|google\\s+assistant|copilot|cortana|claude|raycast|alfred|spotlight|clippy|replika|character\\.ai|xbox|game\\s*bar|hey\\s+siri|ok(?:ay)?\\s+google)\\b/i },"
  }
]);

patchFile('docs/knowledge.js', [
  {
    label: 'website brand helper tags',
    from: "tags: ['brand', 'trademark', 'affiliated', 'third-party', 'assistant', 'platform'],",
    to: "tags: ['brand', 'trademark', 'affiliated', 'third-party', 'assistant', 'platform', 'jarvis', 'iron', 'man', 'marvel'],"
  }
]);

patchFile('tests/legal-surface.test.js', [
  {
    label: 'stale v0.19.1 test title',
    from: "test('network, security, and licensing docs match current fail-closed v0.19.1 surface', () => {",
    to: "test('network, security, and licensing docs match current fail-closed v0.22.2 surface', () => {"
  }
]);

console.log('Eidovara v0.22.2 full-free release policy normalized.');
