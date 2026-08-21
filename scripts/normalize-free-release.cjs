// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
'use strict';

const fs = require('node:fs');

function replaceIfPresent(text, from, to) {
  return text.includes(from) ? text.split(from).join(to) : text;
}

// v0.22.2 is a full free Alpha. This migration exists only so older source cuts
// or stored edition-era code cannot reintroduce a paid entitlement gate during
// start/test/package. Current committed source should already match this policy.
{
  const file = 'src/electron/main.js';
  let text = fs.readFileSync(file, 'utf8');
  text = replaceIfPresent(text, "function entitlement() { return config.edition === 'premium' ? 'premium' : 'free'; }", "function entitlement() { return 'free'; }");
  text = replaceIfPresent(text, "if (config.provider === 'compatible' && entitlement() === 'premium') return { reply: ({ messages }) => callCompatibleProvider({ endpoint: config.endpoint, apiKey: getApiKey(), model: config.model, messages }) };", "if (config.provider === 'compatible') return { reply: ({ messages }) => callCompatibleProvider({ endpoint: config.endpoint, apiKey: getApiKey(), model: config.model, messages }) };");
  text = replaceIfPresent(text, "searchApiKey: entitlement() === 'premium' ? getSearchApiKey() : ''", 'searchApiKey: getSearchApiKey()');
  text = replaceIfPresent(text, "rgbEffects: entitlement() === 'premium' && Boolean(incoming.theme.rgbEffects)", 'rgbEffects: Boolean(incoming.theme.rgbEffects)');
  text = replaceIfPresent(text, "config.edition = incoming?.edition === 'premium' ? 'premium' : 'free';", "config.edition = 'free';");
  text = text.replace(/\s*if \(entitlement\(\) === 'free' && provider === 'compatible'\) throw new Error\('Remote model endpoints are a Premium feature\. Eidovara Free supports offline and local models\.'\);\r?\n/g, '\n');
  text = text.replace(/\s*if \(entitlement\(\) === 'free'\) throw new Error\('Broad keyed web search is a Premium feature\. Built-in public sources remain available\.'\);\r?\n/g, '\n');
  text = text.replace(/if \(entitlement\(\) === 'free' && \(config\.apps \|\| \[\]\)\.length >= 3\) throw new Error\('Eidovara Free supports up to three linked applications\. Premium removes this limit\.'\);\s*/g, '');
  text = text.replace(/\s*if \(config\.edition === 'free'\) \{ if \(config\.provider === 'compatible'\) config\.provider = 'offline'; config\.theme = \{ \.\.\.\(config\.theme \|\| \{\}\), rgbEffects: false \}; \}\r?\n/g, '\n');
  fs.writeFileSync(file, text);
}

{
  const file = 'src/renderer/renderer.js';
  let text = fs.readFileSync(file, 'utf8');
  const oldGates = "function applyEditionGates(){ const premium=settings?.edition==='premium'; const rgb=$('#themeRgb'); if(rgb){rgb.disabled=!premium; if(!premium) rgb.checked=false;} const search=$('#searchApiKeyInput'), clearSearch=$('#clearSearchKeyInput'); if(search) search.disabled=!premium; if(clearSearch) clearSearch.disabled=false; const compatible=$('#providerSelect option[value=\"compatible\"]'); if(compatible) compatible.disabled=!premium; if(!premium&&$('#providerSelect')?.value==='compatible') $('#providerSelect').value='offline'; const note=$('#premiumFieldsNote'); if(note) note.textContent=premium?t('premiumUnlocked','Premium test gates are on: remote endpoints, Brave search key, RGB, and unlimited apps.'):t('premiumLocked','Free: offline/local models, Wikipedia/Wikimedia research, up to 3 apps. RGB, Brave key, and remote endpoints stay Premium.'); }";
  const freeGates = "function applyEditionGates(){ const rgb=$('#themeRgb'); if(rgb) rgb.disabled=false; const search=$('#searchApiKeyInput'), clearSearch=$('#clearSearchKeyInput'); if(search) search.disabled=false; if(clearSearch) clearSearch.disabled=false; const compatible=$('#providerSelect option[value=\"compatible\"]'); if(compatible) compatible.disabled=false; const note=$('#premiumFieldsNote'); if(note) note.textContent='v0.22.2 Alpha: all currently implemented features are included in the free build. No checkout or paid entitlement is required.'; }";
  text = replaceIfPresent(text, oldGates, freeGates);
  text = replaceIfPresent(text, "function renderStatus(){ const premium=settings?.edition==='premium'; $('#modePill').textContent=`${state.policy.mode==='adult'?'Adult Soul':'Standard Soul'} · ${premium?'Premium':'Free'}`;", "function renderStatus(){ $('#modePill').textContent=`${state.policy.mode==='adult'?'Adult Soul':'Standard Soul'} · Free`;");
  text = replaceIfPresent(text, "$('#editionTitle').textContent=premium?'Eidovara Premium':'Eidovara Free'; $('#editionDescription').textContent=premium?'The locally implemented Premium feature gates are enabled for testing on this installation.':'Core workspace features with offline/local models, memory, media, backups, updates, and up to three linked apps.'; $('#upgradeBtn').classList.toggle('hidden',premium||!settings?.storeUrl);", "$('#editionTitle').textContent='Eidovara Free'; $('#editionDescription').textContent='Full v0.22.2 Alpha feature set: local and compatible models, research, media, memory, backups, updates, RGB customization, and linked apps. No paid entitlement is required.'; $('#upgradeBtn').classList.add('hidden');");
  fs.writeFileSync(file, text);
}

console.log('Eidovara v0.22.2 full-free runtime compatibility normalized.');
