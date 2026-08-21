// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
const $ = s => document.querySelector(s);
const START_PATH_KEY = 'eidovara.startPathDismissed';
const $$ = s => [...document.querySelectorAll(s)];
let state = null, settings = null, sending = false, backupCount = 0;
const views = { chat: $('#chatView'), dashboard: $('#dashboardView'), research: $('#researchView'), apps: $('#appsView'), entertainment: $('#entertainmentView'), memory: $('#memoryView'), identity: $('#identityView'), settings: $('#settingsView') };
const t = (key, fallback) => window.eidovaraI18n?.t(key, fallback) || fallback || key;
const assistantPayload = (extra = {}) => {
  const p = state?.assistant?.preferences || {}, c = state?.assistant?.capabilities || {};
  return { autonomy: state?.assistant?.autonomy, initiativeEnabled: state?.assistant?.initiativeEnabled, reflectionEnabled: state?.assistant?.reflectionEnabled, responseLength: p.responseLength, tone: p.tone, focusMode: p.focusMode, accessibility: p.accessibility, language: $('#languageSelect')?.value || p.language || 'en', webResearch: c.webResearch, mediaPlayback: c.mediaPlayback, memoryLearning: c.memoryLearning, ...extra };
};

function activeConversation(){ return state?.conversations?.find(c=>c.id===state.activeConversationId) || state?.conversations?.[0]; }
function fmt(ts){ try{return new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(new Date(ts));}catch{return '';} }
function currentView(){ return Object.keys(views).find(name=>views[name]?.classList.contains('active')) || 'dashboard'; }
function reducedMotion(){ return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches); }
function setView(name){
  if(!views[name])return;
  Object.values(views).forEach(v=>v.classList.remove('active'));
  views[name].classList.add('active');
  $('#viewTitle').textContent = name==='chat' ? (activeConversation()?.title || 'Conversation') : ({dashboard:'Dashboard',research:t('researchTitle','Research'),apps:'Apps & Gaming',entertainment:'Entertainment',memory:'Memory',identity:'Identity & continuity',settings:'Settings'}[name]);
  $$('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.view===name));
  if(innerWidth<861) $('#sidebar').classList.remove('open');
  window.eidovaraCompanion?.renderFollowups?.(name);
  if(name==='research') renderResearchView();
}
function el(tag, cls, text){ const n=document.createElement(tag); if(cls)n.className=cls; if(text!==undefined)n.textContent=text; return n; }
function latestResearch(){
  const convs=state?.conversations||[];
  for(const c of convs){
    const messages=c?.messages||[];
    for(let i=messages.length-1;i>=0;i--) {
      if(messages[i]?.webResearch) return messages[i].webResearch;
      if(messages[i]?.mediaDiscovery) return messages[i].mediaDiscovery;
    }
  }
  return null;
}
function hostnameOf(href){
  try { return new URL(String(href||'')).hostname; } catch { return ''; }
}
function openResearchLink(url, title){
  const href=String(url||'');
  if(!href) return;
  const host=hostnameOf(href);
  const line=[title, host].filter(Boolean).join(' · ');
  const ok=window.confirm(`${t('confirmOpenLink','Open this HTTPS page in your browser?')}${line?`\n${line}`:''}\n${href}`);
  if(!ok) return;
  window.soul.openExternal(href).catch(err=>alert(String(err?.message||err)));
}
window.eidovaraOpenResearch=openResearchLink;
function kernelActionButton(action){
  const b=el('button','kernel-chip',action.label||action.type);
  b.type='button';
  b.addEventListener('click',()=>runKernelAction(action));
  return b;
}
function appendKernelActions(target, actions){
  if(!target || !actions?.length) return;
  const chips=el('div','kernel-chips');
  for(const action of actions) chips.append(kernelActionButton(action));
  target.append(chips);
}
function runKernelAction(action){
  if(!action||!action.type)return;
  const smooth=reducedMotion()?'auto':'smooth';
  if(action.type==='open-view'&&action.view){
    setView(action.view);
    if(action.panel){
      const node=document.getElementById(action.panel);
      node?.scrollIntoView({behavior:smooth,block:'center'});
      node?.querySelector?.('input, select, textarea, button')?.focus?.();
    }
    if(action.view==='dashboard') $('#companionInput')?.focus();
    if(action.view==='chat') $('#messageInput')?.focus();
  }
  else if(action.type==='open-legal') showLegal(action.legal||'about');
  else if(action.type==='open-setup') openSetup(true);
  else if(action.type==='open-diagnostics'){ setView('settings'); $('#diagnosticsBtn')?.click(); }
  else if(action.type==='open-service'){ setView('settings'); $('#serviceForm')?.scrollIntoView({behavior:smooth,block:'center'}); $('#serviceUrlInput')?.focus(); }
  else if(action.type==='open-updates'){ setView('settings'); $('#checkUpdateBtn')?.scrollIntoView({behavior:smooth,block:'center'}); $('#checkUpdateBtn')?.focus(); }
  else if(action.type==='pick-local-media'){ setView('entertainment'); $('#openLocalMediaBtn')?.click(); }
  else if(action.type==='discover-apps'){ setView('apps'); $('#discoverAppsBtn')?.click(); }
  else if(action.type==='start-focus'){ window.eidovaraLayers?.startFocus?.(action.minutes || 25, action.label); }
  else if(action.type==='stop-focus'){ window.eidovaraLayers?.stopFocus?.(); }
  else if(action.type==='capture-scratch'){ window.eidovaraLayers?.captureScratch?.(); }
  else if(action.type==='open-palette'){ openPalette(); }
  else if(action.type==='open-cheatsheet'){ openShortcutSheet(); }
  else if(action.type==='open-external'&&action.url) openResearchLink(action.url);
}
window.eidovaraRunAction=runKernelAction;
function setupCategories(){return $$('input[name="setupCategory"]:checked').map(x=>x.value);}
function toggleStreamSetup(){$('#setupStreamFields').classList.toggle('hidden',!setupCategories().includes('stream-helper'));}
function openSetup(reconfigure=false){const setup=state.setup||{};$$('input[name="setupCategory"]').forEach(x=>{x.checked=(setup.categories||[]).includes(x.value);});$('#setupCustomNeeds').value=setup.customNeeds||'';if($('#setupAccessibility'))$('#setupAccessibility').value=state.assistant?.preferences?.accessibility||'';$('#setupObsUrl').value=setup.stream?.obsWebSocketUrl||'ws://127.0.0.1:4455';$('#setupStreamGoals').value=setup.stream?.goals||'';$('#cancelSetupBtn').classList.toggle('hidden',!reconfigure&&!setup.completed);$('#setupStatus').textContent='';toggleStreamSetup();$('#setupOverlay').classList.remove('hidden');}
async function openAdmin(){const status=await window.soul.adminStatus();$('#adminOverlay').classList.remove('hidden');$('#adminLoginStatus').textContent='';$('#adminPassword').value='';$('#adminLoginForm').classList.toggle('hidden',status.authorized);$('#adminPanelForm').classList.toggle('hidden',!status.authorized);$('#adminTitle').textContent=status.configured?'Private administration':'Create administrator password';$('#adminLoginHelp').textContent=status.configured?'Local access only. This session automatically locks after 15 minutes.':'Create a unique password of at least 12 characters for this installation. Eidovara cannot recover it.';$('#adminLoginButton').textContent=status.configured?'Unlock':'Create and unlock';$('#adminLoginForm').dataset.configured=String(Boolean(status.configured));if(status.authorized){$('#adminEdition').value=status.edition;$('#adminStoreUrl').value=status.storeUrl||'';$('#adminServiceUrl').value=status.serviceUrl||'';$('#adminPanelStatus').textContent=`Unlocked until ${new Date(status.expiresAt).toLocaleTimeString()}.`;}else $('#adminPassword').focus();}

function renderConversations(){ const list=$('#conversationList'); list.textContent=''; const onlyOne=(state.conversations||[]).length<=1; for(const c of state.conversations){ const row=el('button','conversation'+(c.id===state.activeConversationId?' active':'')); row.type='button'; const label=el('span','label',c.title||'Conversation'); const del=el('button','delete','×'); del.type='button'; del.title='Delete conversation'; del.hidden=onlyOne; del.disabled=onlyOne; del.addEventListener('click',async e=>{e.stopPropagation(); if(state.conversations.length<=1)return; state=await window.soul.deleteConversation(c.id); renderAll();}); row.append(label,del); row.addEventListener('click',async()=>{state=await window.soul.selectConversation(c.id); renderAll();setView('chat');}); list.append(row); } }
function externalLink(url,label){const a=el('button','web-link',label);a.type='button';a.addEventListener('click',()=>openResearchLink(url));return a;}
function currentPlayer(){return window.eidovaraNowPlaying?.currentPlayer?.();}
function loadMedia(index,autoplay=true){window.eidovaraNowPlaying?.load?.(index,autoplay);}
function playMedia(items,index,opts={}){const mode=state?.assistant?.capabilities?.mediaPlayback||'confirm';if(mode==='disabled'){alert(t('mediaDisabled','Media playback is disabled in Soul behavior settings.'));return;}const selected=items[index];if(mode==='confirm'&&!opts.alreadyConfirmed){if(!window.confirm(`${t('mediaConfirm','Play this media in Eidovara:')} ${selected?.title||''}`.trim()))return;}window.eidovaraNowPlaying?.play?.(items,index,{...opts,alreadyConfirmed:true});}
function renderResearch(target,research){
  if(!research)return;
  const remote=Boolean(research.fetchedAt);
  const panel=el('div','research-panel');
  panel.append(el('div','research-title',`${remote?t('researchResults','Internet results'):t('discoveryTitle','Local library & official searches')} · ${fmt(research.fetchedAt)||t('localNow','this device')}`));
  panel.append(el('p','research-copy',research.disclaimer||t('researchCopy','Public web lookup after you ask. Not a full-internet index. Wikipedia/Wikimedia plus optional keyed search and pages you open.')));
  for(const s of research.sources||[]){
    const row=el('article','research-source research-card');
    row.append(el('strong','',s.title||''));
    if(s.hostname||s.provider) row.append(el('small','research-host',s.provider?`${s.provider}${s.hostname?` · ${s.hostname}`:''}`:s.hostname));
    row.append(el('p','research-snippet',s.description||s.extract||''));
    if(s.extract && s.extract!==s.description) row.append(el('p','research-extract',s.extract));
    if(s.url) row.append(externalLink(s.url, t('openInBrowser','Open in browser')));
    panel.append(row);
  }
  for(const h of research.handoffs||[]){
    const row=el('article','research-source research-card');
    row.append(el('strong','',h.title||h.provider||'Search'));
    if(h.provider) row.append(el('small','research-host',h.provider));
    row.append(el('p','research-snippet',t('handoffNote','Official HTTPS search in your browser. Eidovara does not fetch that site’s HTML or capture logins.')));
    if(h.url) row.append(externalLink(h.url, t('openInBrowser','Open in browser')));
    panel.append(row);
  }
  if(research.local?.length){
    const localBox=el('div','local-library');
    localBox.append(el('div','research-title',t('sessionLibrary','This session’s local library')));
    for(const item of research.local){
      const row=el('div','kv');
      row.append(el('span','',item.playable?t('playInEidovara','Play in Eidovara'):item.type||'audio'), el('span','',item.title));
      if(item.playable){
        const play=el('button','handoff-chip',t('playLocal','Play'));
        play.type='button';
        const playable=research.local.filter(x=>x.playable);
        play.addEventListener('click',()=>playMedia(playable, playable.indexOf(item), {alreadyConfirmed:true}));
        row.append(play);
      }
      localBox.append(row);
    }
    panel.append(localBox);
  }
  if(research.media?.length){
    const grid=el('div','media-grid');
    research.media.forEach((m,index)=>{
      const card=el('div','media-card');
      if(m.type==='image'){const img=document.createElement('img');img.src=m.url;img.alt=m.title;img.loading='lazy';card.append(img);}
      else{const play=el('button','media-launch',m.local||m.playable?(m.type==='audio'?'▶ Play local audio':'▶ Play local video'):(m.type==='audio'?'▶ Play audio':'▶ Play video'));play.type='button';play.addEventListener('click',()=>playMedia(research.media,index,{alreadyConfirmed:Boolean(m.local||m.playable)}));card.append(play);}
      if(m.hostname) card.append(el('small','research-host',m.hostname));
      if(m.sourceUrl) card.append(externalLink(m.sourceUrl,m.title));
      else card.append(el('small','',m.title||''));
      grid.append(card);
    });
    panel.append(grid);
  }
  target.append(panel);
}
window.eidovaraRenderDiscovery=renderResearch;
window.eidovaraPlayMedia=playMedia;
function renderResearchView(){
  const box=$('#researchResults');
  if(!box) return;
  box.textContent='';
  const research=latestResearch();
  const copy=$('#researchLead');
  if(copy) copy.textContent=t('researchLead','Public web lookup after you ask. Not a full-internet index. Wikipedia/Wikimedia plus optional keyed search and pages you open.');
  if(!research){
    box.append(el('div','empty-state'));
    box.lastChild.append(el('strong','',t('researchEmptyTitle','No lookup yet')), el('p','',t('researchEmpty','Ask me to search the internet for a topic, or include an HTTPS URL after an explicit internet/web/online request. This is not a crawl of the whole internet.')));
    return;
  }
  renderResearch(box, research);
}
function renderMessages(){ const box=$('#messages'); box.textContent=''; const c=activeConversation(); const messages=c?.messages||[]; $('#welcome').classList.toggle('hidden',messages.length>0); for(const m of messages){ const wrap=el('div',`message ${m.role==='assistant'?'assistant':'user'}`); if(m.role==='assistant'){ const av=el('div','soul-mark avatar'); av.append(el('span')); wrap.append(av); } const content=el('div'); const bubble=el('div','bubble',m.content); const meta=el('div','message-meta',fmt(m.at)); content.append(bubble);renderResearch(content,m.webResearch||m.mediaDiscovery);appendKernelActions(content,m.actions);content.append(meta);wrap.append(content); box.append(wrap); } requestAnimationFrame(()=>{$('#chatScroll').scrollTop=$('#chatScroll').scrollHeight;}); }function renderMemory(){ const box=$('#memoryCards'); box.textContent=''; const mem=[...(state.memories||[])].reverse(); if(!mem.length){box.append(el('div','empty',t('emptyMemory','No durable memories yet.')));return;} for(const m of mem){ const card=el('div','card memory-card'); const body=el('div'); const p=el('div','',m.content); const sm=el('small','',`${m.active?'active':'inactive'} · ${m.kind} · confidence ${Math.round((m.confidence||0)*100)}%`); body.append(p,sm); const b=el('button','forget',m.active?'Forget':'Inactive'); b.type='button'; b.disabled=!m.active; b.addEventListener('click',async()=>{await window.soul.forget(m.id);state=await window.soul.snapshot();renderAll();}); card.append(body,b); box.append(card); } }
function renderIdentity(){ const sm=state.continuity.selfModel; const self=$('#selfModel'); self.textContent=''; for(const [k,v] of [['Name',sm.name],['Architecture',sm.architecture],['Protected identity',String(sm.protectedIdentity)],['Core values',sm.coreValues.join(', ')]]){const r=el('div','kv');r.append(el('span','',k),el('span','',v));self.append(r);} const traits=$('#traits');traits.textContent='';for(const [k,v] of Object.entries(state.personality).filter(([,v])=>typeof v==='number')){const r=el('div','trait');r.append(el('span','',k),(()=>{const b=el('div','bar');const f=el('div','fill');f.style.width=`${Math.round(v*100)}%`;b.append(f);return b;})(),el('span','',`${Math.round(v*100)}%`));traits.append(r);} const rel=$('#relationship');rel.textContent='';for(const [k,v] of [['Style',state.relationship.style],['Temporary initiative',String(state.relationship.temporaryInitiative)],['Trust',`${Math.round(state.relationship.trust*100)}%`],['Comfort',`${Math.round(state.relationship.comfort*100)}%`]]){const r=el('div','kv');r.append(el('span','',k),el('span','',v));rel.append(r);} const p=$('#policy');p.textContent='';for(const [k,v] of [['Mode',state.policy.mode],['Adult status confirmed',String(state.policy.adultStatusConfirmed)],['Adult Soul enabled',String(state.policy.adultSoulEnabled)],['Current consent',String(state.policy.currentConsent)],['Consent scope',state.policy.consentScope||'none'],['Active boundaries',String((state.policy.boundaries||[]).filter(b=>b.active).length)]]){const r=el('div','kv');r.append(el('span','',k),el('span','',v));p.append(r);} }
function applyEditionGates(){ const premium=settings?.edition==='premium'; const rgb=$('#themeRgb'); if(rgb){rgb.disabled=!premium; if(!premium) rgb.checked=false;} const search=$('#searchApiKeyInput'), clearSearch=$('#clearSearchKeyInput'); if(search) search.disabled=!premium; if(clearSearch) clearSearch.disabled=false; const compatible=$('#providerSelect option[value="compatible"]'); if(compatible) compatible.disabled=!premium; if(!premium&&$('#providerSelect')?.value==='compatible') $('#providerSelect').value='offline'; const note=$('#premiumFieldsNote'); if(note) note.textContent=premium?t('premiumUnlocked','Premium test gates are on: remote endpoints, Brave search key, RGB, and unlimited apps.'):t('premiumLocked','Free: offline/local models, Wikipedia/Wikimedia research, up to 3 apps. RGB, Brave key, and remote endpoints stay Premium.'); }
function applyServiceIndicator(status){
  const snapshot=status||settings?.serviceStatus||{};
  const configured=Boolean(settings?.serviceUrl)||snapshot.configured===true;
  const online=configured&&snapshot.online===true;
  const label=$('#serviceLabel'); const dot=$('#serviceDot');
  if(label) label.textContent=online?'Service online':configured?'Service offline':'Service idle';
  if(dot){dot.classList.toggle('online',online);dot.classList.toggle('offline',configured&&!online);dot.classList.toggle('idle',!configured);}
  const urlField=$('#serviceUrlInput'); if(urlField&&settings?.serviceUrl!==undefined) urlField.value=settings.serviceUrl||'';
  const onlineValue=$('#serviceOnlineValue'); if(onlineValue) onlineValue.textContent=online?'Online':configured?'Offline':'Not configured';
  const last=$('#serviceLastSeenValue'); if(last) last.textContent=snapshot.lastCheckedAt?new Date(snapshot.lastCheckedAt).toLocaleString():'Never';
  const site=$('#serviceWebsiteValue'); if(site) site.textContent=snapshot.website||'None from config';
  const pay=$('#servicePaymentsValue'); if(pay) pay.textContent='off';
  const siteBtn=$('#serviceSiteBtn'); if(siteBtn) siteBtn.classList.toggle('hidden',!snapshot.website);
  const note=$('#serviceStatusText');
  if(note){
    if(!configured) note.textContent='Using the official service default (https://api.eidovara.org). Offline Soul stays fully usable if that host is down.';
    else if(online) note.textContent=`${snapshot.service||'Eidovara'} ${snapshot.version||''} connected. Checkout stays off. Conversations stay local. Assist stays opt-in.`.replace(/\s+/g,' ').trim();
    else note.textContent=snapshot.error||'Eidovara service is unreachable. Offline Soul continues locally.';
  }
  window.eidovaraCompanion?.refresh?.();
}
function renderStatus(){ const premium=settings?.edition==='premium'; $('#modePill').textContent=`${state.policy.mode==='adult'?'Adult Soul':'Standard Soul'} · ${premium?'Premium':'Free'}`; const labels={offline:'Soul Offline',local:'Local model',compatible:'Connected model'}; $('#providerLabel').textContent=labels[settings?.provider]||'Offline'; const kernelLive=Boolean(settings?.ageGateAccepted); const kLabel=$('#kernelLabel'), kDot=$('#kernelDot'); if(kLabel) kLabel.textContent=kernelLive?'Soul ready':'Soul waiting'; if(kDot){kDot.classList.toggle('live',kernelLive);kDot.classList.toggle('idle',!kernelLive);} $('#editionTitle').textContent=premium?'Eidovara Premium':'Eidovara Free'; $('#editionDescription').textContent=premium?'The locally implemented Premium feature gates are enabled for testing on this installation.':'Core workspace features with offline/local models, memory, media, backups, updates, and up to three linked apps.'; $('#upgradeBtn').classList.toggle('hidden',premium||!settings?.storeUrl); applyEditionGates(); applyServiceIndicator(); }
const SYSTEM_THEME_VALUES=new Set(['#080c16','#101828','#8f7cff','#000000','#1c1c1e','#0a84ff','#f2f2f7','#ffffff','#007aff']);
function applyTheme(){const t=settings?.theme||{};const root=document.documentElement;const assign=(names,value)=>{const v=String(value||'').toLowerCase();if(v&&!SYSTEM_THEME_VALUES.has(v))names.forEach(name=>root.style.setProperty(name,value));else names.forEach(name=>root.style.removeProperty(name));};assign(['--bg','--grouped','--side'],t.background);assign(['--panel','--elevated'],t.panel);assign(['--accent','--tint'],t.accent);root.style.setProperty('--surface-opacity',`${Math.max(65,Math.min(100,Number(t.transparency)||96))}%`);document.body.classList.toggle('rgb-effects',Boolean(t.rgbEffects)&&!t.gamingMode);document.body.classList.toggle('gaming-mode',Boolean(t.gamingMode));}
function populateVoices(){if(!('speechSynthesis' in window))return;const current=$('#voiceSelect').value||(settings?.companion?.voiceURI||settings?.companion?.voiceName||'');const voices=speechSynthesis.getVoices();$('#voiceSelect').textContent='';const fallback=el('option','','OS default');fallback.value='';$('#voiceSelect').append(fallback);for(const voice of voices){const option=el('option','',`${voice.name} (${voice.lang})`);option.value=voice.voiceURI||voice.name;$('#voiceSelect').append(option);}$('#voiceSelect').value=[...$('#voiceSelect').options].some(x=>x.value===current)?current:'';}
function applyCompanion(){const c=settings?.companion||{};const gates=state?.policy?.adultStatusConfirmed===true&&state?.policy?.adultSoulEnabled===true&&state?.policy?.currentConsent===true&&state?.policy?.mode==='adult';const avatar=$('#companionAvatar'),mode=c.avatarMode||'3d';avatar.className=`companion-avatar mode-${mode} motion-${c.motion||'gentle'}${gates&&c.adultPresentation?' adult-presentation':''}`;const height=Math.max(0,Math.min(100,Number(c.bodyHeight)||50)),build=Math.max(0,Math.min(100,Number(c.bodyBuild)||50)),curves=Math.max(0,Math.min(100,Number(c.bodyCurves)||50));avatar.style.transform=mode==='2d'?`scaleX(${.82+build*.0036}) scaleY(${.82+height*.0036})`:'';avatar.style.borderRadius=mode==='2d'?`${38+curves*.12}% ${38+curves*.12}% 46% 46%`:'';$('#avatarMode').value=mode;$('#avatarMotion').value=c.motion||'gentle';const muted=c.mute===undefined?!Boolean(c.voiceEnabled):Boolean(c.mute);$('#voiceEnabled').checked=!muted;if($('#voiceMute'))$('#voiceMute').checked=muted;$('#voiceRate').value=c.rate||1;$('#voicePitch').value=c.pitch||1;$('#adultAvatarSettings').classList.toggle('hidden',!gates);$('#adultPresentation').checked=gates&&Boolean(c.adultPresentation);$('#bodyHeight').value=c.bodyHeight??50;$('#bodyBuild').value=c.bodyBuild??50;$('#bodyCurves').value=c.bodyCurves??50;populateVoices();}
function speakSoul(text,force=false){if(!('speechSynthesis' in window))return;const c=settings?.companion||{};const muted=c.mute===undefined?!Boolean(c.voiceEnabled):Boolean(c.mute);if(!force&&muted)return;speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(String(text||'').slice(0,8000));utterance.rate=Number(c.rate)||1;utterance.pitch=Number(c.pitch)||1;utterance.voice=speechSynthesis.getVoices().find(v=>v.voiceURI===(c.voiceURI||c.voiceName)||v.name===(c.voiceURI||c.voiceName))||null;utterance.onstart=()=>$('#companionAvatar').classList.add('speaking');utterance.onend=utterance.onerror=()=>$('#companionAvatar').classList.remove('speaking');speechSynthesis.speak(utterance);}
function rendererCapabilities(){
  const video=document.createElement('video'),audio=document.createElement('audio');
  const supported=(element,type)=>Boolean(element.canPlayType(type));
  return {
    display:{highDynamicRange:Boolean(window.matchMedia?.('(dynamic-range: high)').matches),colorGamutP3:Boolean(window.matchMedia?.('(color-gamut: p3)').matches)},
    video:{h264:supported(video,'video/mp4; codecs="avc1.42E01E"'),hevc:supported(video,'video/mp4; codecs="hvc1"'),vp9:supported(video,'video/webm; codecs="vp9"'),av1:supported(video,'video/mp4; codecs="av01.0.05M.08"'),pictureInPicture:'pictureInPictureEnabled' in document,fullscreen:document.fullscreenEnabled},
    audio:{aac:supported(audio,'audio/mp4; codecs="mp4a.40.2"'),mp3:supported(audio,'audio/mpeg'),opus:supported(audio,'audio/webm; codecs="opus"'),flac:supported(audio,'audio/flac'),webAudio:Boolean(window.AudioContext||window.webkitAudioContext)},
    input:{gamepadApi:'getGamepads' in navigator,connectedGamepads:'getGamepads' in navigator?[...navigator.getGamepads()].filter(Boolean).length:0},
    browser:{mediaSession:'mediaSession' in navigator,logicalProcessors:navigator.hardwareConcurrency||null,deviceMemoryGiB:navigator.deviceMemory||null}
  };
}
function renderApps(){
  const grid=$('#appsGrid');grid.textContent='';const apps=settings?.apps||[];
  if(!apps.length){
    const empty=el('div','empty-state');
    empty.append(el('strong','',t('emptyAppsTitle','No applications linked yet')), el('p','',t('emptyAppsBody','Build a Windows shelf of titles you already trust and are permitted to use.')));
    const list=el('ol');
    for (const key of ['emptyAppsStep1','emptyAppsStep2','emptyAppsStep3']) list.append(el('li','',t(key)));
    const actions=el('div','empty-actions');
    const discover=el('button','',t('discoverApps','Discover installed apps')); discover.type='button'; discover.addEventListener('click',()=>$('#discoverAppsBtn').click());
    const choose=el('button','secondary',t('chooseFile','＋ Choose file')); choose.type='button'; choose.addEventListener('click',()=>$('#addAppBtn').click());
    actions.append(discover,choose); empty.append(list,actions); grid.append(empty); return;
  }
  for(const app of apps){const card=el('div','app-card');const info=el('div','app-info');info.append(el('strong','',app.name),el('small','',app.path));const actions=el('div','app-actions');const launch=el('button','', t('launchApp','Launch'));launch.type='button';launch.addEventListener('click',async()=>{try{$('#appsStatus').textContent=`Asking Windows to open ${app.name}…`;const result=await window.soul.launchApplication(app.id);if(result?.cancelled){$('#appsStatus').textContent=t('launchCancelled','Launch cancelled.');return;}$('#appsStatus').textContent=`Launched ${app.name}. Windows opened the selected shortcut or executable; Eidovara did not inject into that process.`;}catch(err){$('#appsStatus').textContent=String(err?.message||err);}});const remove=el('button','secondary','Remove');remove.type='button';remove.addEventListener('click',async()=>{settings=await window.soul.removeApplication(app.id);applyTheme();renderApps();renderDashboard();});actions.append(launch,remove);card.append(info,actions);grid.append(card);}
}
async function refreshBackups(){const select=$('#backupSelect');select.textContent='';const backups=await window.soul.listBackups();backupCount=backups.length;for(const b of backups){const o=el('option','',`${new Date(b.createdAt).toLocaleString()} · ${Math.ceil(b.bytes/1024)} KB`);o.value=b.name;select.append(o);}if(!backups.length)select.append(el('option','',t('noBackups','No backups yet. Create one before changing providers or resetting.')));$('#restoreBackupBtn').disabled=!backups.length;if(!backups.length && !$('#backupStatus').textContent) $('#backupStatus').textContent=t('noBackups','No backups yet. Create one before changing providers or resetting.');}
function renderDashboard(){
  window.eidovaraState=state;
  window.eidovaraSettings=settings;
  if(window.eidovaraLayers?.renderDashboard){
    window.eidovaraLayers.renderDashboard({state,settings,backupCount,setView,send,openSetup});
    return;
  }
  const box=$('#dashboardGrid'); if(!box) return;
  box.textContent='';
  const roles=(state.setup?.categories||[]);
  const memories=(state.memories||[]).filter(x=>x.active).length;
  const apps=(settings?.apps||[]).length;
  const taste=Object.keys(state.entertainment?.taste||{}).length;
  const items=[
    {label:t('dashFocus','Focus'), value:state.assistant?.preferences?.focusMode||'general', next:t('focusSession','Focus session'), run:()=>{setView('dashboard');send('Plan a focused session for my current priority.',{surface:'companion'});}},
    {label:t('dashRoles','Roles'), value:roles.length?roles.join(', '):t('notConfigured','not configured'), next:t('nextConfigure','Configure roles'), run:()=>openSetup(true)},
    {label:t('dashMemory','Memory'), value:`${memories} active`, next:t('nextMemory','Review memory'), run:()=>setView('memory')},
    {label:t('dashApps','Apps'), value:`${apps} linked`, next:t('nextAddApps','Add a trusted app'), run:()=>setView('apps')},
    {label:t('dashMedia','Entertainment'), value:taste?`${taste} taste signals`:'none yet', next:t('nextEntertainment','Open Entertainment'), run:()=>setView('entertainment')},
    {label:t('dashResearch','Research'), value:latestResearch()?.query || t('researchIdle','no lookup yet'), next:t('nextResearch','Open Research'), run:()=>setView('research')},
    {label:t('dashPrivacy','Workspace'), value:settings?.provider==='offline'?t('offlineFirst','offline-first'):t('connectedProvider','connected provider'), next:t('nextSettings','Open settings'), run:()=>setView('settings')},
    {label:'Eidovara service', value:settings?.serviceStatus?.online?'Online':settings?.serviceUrl?'Offline':'Not attached', next:'Open service settings', run:()=>{setView('settings');$('#serviceForm')?.scrollIntoView({behavior:'smooth',block:'center'});}},
    {label:t('dashBackups','Backups'), value:String(backupCount), next:t('nextBackup','Create a backup'), run:()=>{setView('settings');$('#backupSection')?.scrollIntoView({behavior:'smooth',block:'center'});}},
    {label:t('dashHealth','Diagnostics'), value:settings?.encryptionAvailable?'OS-protected':'local files', next:t('nextDiagnostics','Show diagnostics'), run:()=>{setView('settings');$('#diagnosticsBtn').click();}}
  ];
  for(const item of items){const c=el('button','dashboard-card');c.type='button';c.append(el('small','',item.label),el('strong','',item.value),el('span','next',item.next));c.addEventListener('click',item.run);box.append(c);}
  renderCompanionPanel();
}
let lastCompanion = null;
function soulSetupOn(){ return state?.setup?.completed === true; }
function setCompanionError(text){
  const note=$('#companionError');
  if(!note)return;
  const value=String(text||'').trim();
  note.textContent=value;
  note.classList.toggle('hidden',!value);
}
function setCompanionBusy(on){
  const btn=$('#companionSendBtn');
  if(btn)btn.disabled=Boolean(on);
  const log=$('#companionLog');
  if(!log)return;
  $('#companionTyping')?.remove();
  if(on){
    const typing=el('div','companion-msg companion-msg-assistant companion-typing');
    typing.id='companionTyping';
    typing.append(el('p','',t('companionThinking','Working locally…')));
    log.append(typing);
    log.scrollTop=log.scrollHeight;
  }
}
function companionActionButton(action){
  const b=el('button','',action.label||action.type);
  b.type='button';
  b.addEventListener('click',()=>applyCompanionAction(action));
  return b;
}
function applyCompanionAction(action){
  runKernelAction(action);
}
function applyCompanionResult(res,{applyAuto=false}={}){
  lastCompanion=res?.companion||lastCompanion;
  if(applyAuto){
    const first=(lastCompanion?.actions||[]).find(a=>a.auto);
    if(first) applyCompanionAction(first);
  }
  renderCompanionPanel();
}
function renderCompanionPanel(){
  const status=$('#companionSoulStatus');
  const sub=$('#companionSub');
  const log=$('#companionLog');
  if(!status||!log)return;
  const soul=lastCompanion?.soul;
  const enabled=soul?Boolean(soul.enabled):soulSetupOn();
  status.classList.toggle('is-off',!enabled);
  status.textContent=soul?.label || (enabled
    ? t('companionSoulOn','Soul is a software self-model on this device — not a claim of consciousness.')
    : t('companionSoulOff','Optional Soul setup is off. This companion is not Soul and is not conscious.'));
  const attached=Boolean(settings?.serviceUrl);
  const online=Boolean(settings?.serviceStatus?.online);
  if(sub){
    if(!attached) sub.textContent=t('companionOffline','Local-only. Conversations stay on this PC. Service not attached.');
    else if(!online) sub.textContent=t('companionServiceDown','Local-only. Attached service is unreachable; the workspace still works.');
    else sub.textContent=t('companionServiceIdle','Local conversations. Service is health/status only — chat is not sent.');
  }
  log.textContent='';
  const messages=(activeConversation()?.messages||[]).slice(-8);
  if(!messages.length){
    const empty=el('div','companion-empty');
    empty.append(el('strong','',t('companionEmptyTitle','Ask this workspace.')), el('p','',t('companionEmpty','Local answers from product facts and your on-device profile. Nothing is sent to the website helper.')));
    log.append(empty);
    return;
  }
  for(const m of messages){
    const row=el('div',`companion-msg companion-msg-${m.role==='assistant'?'assistant':'user'}`);
    row.append(el('p','',m.content));
    log.append(row);
  }
  const actions=lastCompanion?.actions||[];
  if(actions.length && messages.at(-1)?.role==='assistant'){
    const chips=el('div','companion-chips');
    for(const action of actions) chips.append(companionActionButton(action));
    log.append(chips);
  }
  log.scrollTop=log.scrollHeight;
}
function renderEntertainment(){
  const favorites=$('#entertainmentFavorites'),recent=$('#entertainmentRecent'),mix=$('#entertainmentMix');
  favorites.textContent='';recent.textContent='';if(mix)mix.textContent='';
  const e=state.entertainment||{};
  for(const item of [...(e.favorites||[])].slice(-8).reverse()){const row=el('div','kv');row.append(el('span','',item.type),el('span','',item.title));favorites.append(row);}
  for(const item of [...(e.history||[])].slice(-10).reverse()){const row=el('div','kv');row.append(el('span','',item.event),el('span','',item.title));recent.append(row);}
  if(!favorites.children.length)favorites.append(el('div','empty',t('emptyFavorites','Favorite media will appear here after you heart something in the player.')));
  if(!recent.children.length)recent.append(el('div','empty',t('emptyRecent','Play, skip, and complete events will appear here. Local file paths are not stored in taste records.')));
  const seeds=Object.entries(e.taste||{}).sort((a,b)=>b[1]-a[1]).filter(([,score])=>score>0).slice(0,4).map(([title])=>title);
  if(mix) mix.textContent=seeds.length?`${seeds.join(', ')}. Spotify, YouTube, and Internet Archive remain official HTTPS searches in your browser.` : t('mixEmpty','Play or favorite something to grow a local mix. Suggestions stay on this device.');
  const library=$('#entertainmentLibrary');
  if(library){
    library.textContent='';
    const discovery=latestResearch();
    const items=discovery?.local||[];
    if(!items.length) library.append(el('div','empty',t('emptyLibrary','Open a local audio or video file to play it in Eidovara. Paths stay out of taste records.')));
    else for(const item of items){
      const row=el('div','kv');
      row.append(el('span','',item.playable?t('playInEidovara','Play in Eidovara'):item.type||'title'), el('span','',item.title));
      if(item.playable){
        const play=el('button','handoff-chip',t('playLocal','Play'));
        play.type='button';
        const playable=items.filter(x=>x.playable);
        play.addEventListener('click',()=>playMedia(playable, playable.indexOf(item), {alreadyConfirmed:true,append:true}));
        row.append(play);
      }
      library.append(row);
    }
  }
  const discoveryBox=$('#entertainmentDiscovery');
  if(discoveryBox){
    discoveryBox.textContent='';
    const discovery=latestResearch();
    if(discovery) renderResearch(discoveryBox, discovery);
    else discoveryBox.append(el('div','empty',t('emptyDiscovery','Ask for music, a watch, or a mood mix to show local matches and official YouTube/Spotify/Archive search chips.')));
  }
}
function renderAll(){ window.eidovaraState=state;window.eidovaraSettings=settings;renderConversations();renderMessages();renderDashboard();renderResearchView();renderApps();renderEntertainment();renderMemory();renderIdentity();renderStatus();applyTheme();applyCompanion();window.eidovaraCompanion?.refresh?.();window.eidovaraLayers?.renderFocusBar?.();if($('#assistantAutonomy')){const p=state.assistant?.preferences||{},c=state.assistant?.capabilities||{};$('#assistantAutonomy').value=state.assistant?.autonomy||'balanced';$('#responseLength').value=p.responseLength||'balanced';$('#responseTone').value=p.tone||'natural';$('#focusMode').value=p.focusMode||'general';$('#assistantAccessibility').value=p.accessibility||'';$('#webResearchPolicy').value=c.webResearch||'ask';$('#mediaPlaybackPolicy').value=c.mediaPlayback||'confirm';$('#memoryLearning').checked=c.memoryLearning!=='disabled';$('#assistantInitiative').checked=state.assistant?.initiativeEnabled!==false;$('#assistantReflection').checked=state.assistant?.reflectionEnabled!==false;} const activeView=Object.keys(views).find(name=>views[name]?.classList.contains('active')); if(activeView==='chat') $('#viewTitle').textContent=activeConversation()?.title||'Conversation'; }
function addTyping(){ const wrap=el('div','message assistant');const av=el('div','soul-mark avatar');av.append(el('span'));const b=el('div','bubble typing','Soul is thinking…');wrap.append(av,b);wrap.id='typing';$('#messages').append(wrap);$('#chatScroll').scrollTop=$('#chatScroll').scrollHeight; }
function autoSize(){ const ta=$('#messageInput');if(!ta)return;ta.style.height='auto';ta.style.height=Math.min(180,ta.scrollHeight)+'px'; }
async function send(text, opts={}){
  text=String(text||'').trim();
  if(!text||sending)return;
  const surface=opts.surface||'chat';
  sending=true;
  setCompanionError('');
  if($('#sendBtn')) $('#sendBtn').disabled=true;
  if($('#companionSendBtn')) $('#companionSendBtn').disabled=true;
  if(surface!=='companion') setView('chat');
  if($('#messageInput') && surface!=='companion'){ $('#messageInput').value=''; autoSize(); }
  if($('#companionInput') && surface==='companion') $('#companionInput').value='';
  if(!activeConversation()?.messages?.length) $('#welcome')?.classList.add('hidden');
  if(surface==='companion') setCompanionBusy(true);
  else {
    const user=el('div','message user');const c=el('div');c.append(el('div','bubble',text));user.append(c);$('#messages').append(user);addTyping();
  }
  const askAssist=$('#assistThisMessage')?.checked===true || (surface==='companion' && $('#companionAssistThis')?.checked===true);
  try{
    const res=await window.soul.send(text, { view: currentView() });
    state=res.state;
    lastCompanion=res.companion||lastCompanion;
    renderAll();
    window.eidovaraCompanion?.applyKernelActions?.(res.kernel?.actions);
    window.eidovaraCompanion?.syncHistory?.();
    const replies=(activeConversation()?.messages||[]).filter(x=>x.role==='assistant');
    if(surface!=='companion') speakSoul(replies.at(-1)?.content);
    if(res.providerError){
      const note=`${t('modelIssue','Model connection issue:')} ${res.providerError}`;
      if(surface==='companion') setCompanionError(note);
      else $('#messages').append(el('div','error-note',note));
    }
    if(res.internetError){
      const note=`${t('researchIssue','Internet search issue:')} ${res.internetError}`;
      if(surface==='companion') setCompanionError(note);
      else $('#messages').append(el('div','error-note',note));
      if($('#researchError')) $('#researchError').textContent=res.internetError;
    } else if($('#researchError')) $('#researchError').textContent='';
    if(askAssist){
      if($('#assistThisMessage')) $('#assistThisMessage').checked=false;
      if($('#companionAssistThis')) $('#companionAssistThis').checked=false;
      try{
        const assist=await window.soul.assistQuery(text);
        const note=el('div',assist.ok?'research-panel':'error-note');
        note.append(el('div','research-title','Assist from your pasted service (not Soul)'));
        note.append(el('p','',assist.ok?(assist.reply||assist.warning):(assist.reason||'Assist unavailable. Local Soul continues.')));
        if(assist.warning) note.append(el('small','',assist.warning));
        if(surface==='companion') setCompanionError(assist.ok?(assist.reply||assist.warning||''):(assist.reason||'Assist unavailable. Local Soul continues.'));
        else $('#messages').append(note);
      }catch(err){
        const fail=`Worker helper: ${err?.message||err}`;
        if(surface==='companion') setCompanionError(fail);
        else $('#messages').append(el('div','error-note',fail));
      }
    }
    applyCompanionResult(res,{applyAuto:surface==='companion'});
    const replyText=replies.at(-1)?.content;
    const assistNote='';
    window.eidovaraCompanion?.noteExchange?.(text, replyText, assistNote, { research: res.webResearch || res.mediaDiscovery, actions: res.kernel?.actions });
    if(res.kernel?.intent==='research' || res.kernel?.view==='research') setView('research');
    else if(surface==='companion') setView('dashboard');
  }catch(err){
    $('#typing')?.remove();
    const note=String(err?.message||err);
    if(surface==='companion') setCompanionError(note);
    else $('#messages').append(el('div','error-note',note));
  }finally{
    sending=false;
    setCompanionBusy(false);
    if($('#sendBtn')) $('#sendBtn').disabled=false;
    if($('#companionSendBtn')) $('#companionSendBtn').disabled=false;
    if(surface==='companion') $('#companionInput')?.focus();
    else $('#messageInput')?.focus();
  }
}

$('#chatForm').addEventListener('submit',e=>{e.preventDefault();send($('#messageInput').value);});
$('#researchForm')?.addEventListener('submit',e=>{
  e.preventDefault();
  const topic=$('#researchQuery')?.value.trim();
  if(!topic) return;
  const prompt=/\b(?:internet|web|online)\b/i.test(topic)?topic:`Search the internet for ${topic}`;
  send(prompt);
});
$('#companionForm')?.addEventListener('submit',e=>{e.preventDefault();send($('#companionInput')?.value,{surface:'companion'});});
$('#companionInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(e.currentTarget.value,{surface:'companion'});}});
$$('[data-companion-nav]').forEach(b=>b.addEventListener('click',()=>{
  const nav=b.dataset.companionNav;
  if(nav==='apps') setView('apps');
  else if(nav==='entertainment') setView('entertainment');
  else if(nav==='memory') setView('memory');
  else if(nav==='legal') showLegal('about');
  else if(nav==='status'){ setView('settings'); $('#diagnosticsBtn')?.click(); }
}));
$$('[data-companion-ask]').forEach(b=>b.addEventListener('click',()=>{setView('dashboard');send(b.dataset.companionAsk,{surface:'companion'});}));$('#messageInput').addEventListener('input',autoSize);$('#messageInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(e.currentTarget.value);}});
$$('[data-starter]').forEach(b=>b.addEventListener('click',()=>send(b.dataset.starter)));
$$('.nav-btn').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#newChatBtn').addEventListener('click',async()=>{state=await window.soul.newConversation();renderAll();setView('chat');$('#messageInput').focus();});
$('#memoryForm').addEventListener('submit',async e=>{e.preventDefault();const v=$('#memoryInput').value.trim();if(!v)return;await window.soul.remember(v,{kind:'preference'});$('#memoryInput').value='';state=await window.soul.snapshot();renderAll();});
$$('[data-command]').forEach(b=>b.addEventListener('click',async()=>{const command=b.dataset.command;if((command==='adult status confirmed'||command==='enable adult soul')&&!state.policy?.adultStatusConfirmed){const accepted=window.confirm(window.eidovaraI18n.t('adultWarning'));if(!accepted)return;if(command==='enable adult soul')await send('adult status confirmed');}setView('chat');await send(command);}));
$('#settingsForm').addEventListener('submit',async e=>{e.preventDefault();$('#settingsStatus').textContent='Saving…';try{const provider=$('#providerSelect').value, endpoint=$('#endpointInput').value.trim(), model=$('#modelInput').value.trim();settings=await window.soul.saveSettings({provider,endpoint,model,language:$('#languageSelect').value,apiKey:$('#apiKeyInput').value,clearApiKey:$('#clearKeyInput').checked,searchApiKey:$('#searchApiKeyInput').value,clearSearchApiKey:$('#clearSearchKeyInput').checked,assistOptIn:$('#assistOptIn')?$('#assistOptIn').checked:false,theme:{background:$('#themeBackground').value,panel:$('#themePanel').value,accent:$('#themeAccent').value,transparency:Number($('#themeTransparency').value),rgbEffects:$('#themeRgb').checked,gamingMode:$('#gamingModeInput').checked},companion:{avatarMode:$('#avatarMode').value,motion:$('#avatarMotion').value,voiceEnabled:$('#voiceMute')? !$('#voiceMute').checked : $('#voiceEnabled').checked,mute:$('#voiceMute')?$('#voiceMute').checked:!$('#voiceEnabled').checked,voiceName:$('#voiceSelect').value,voiceURI:$('#voiceSelect').value,lookId:$('#presenceLook')?.value||'orb',rate:Number($('#voiceRate').value),pitch:Number($('#voicePitch').value),adultPresentation:$('#adultPresentation').checked,bodyHeight:Number($('#bodyHeight').value),bodyBuild:Number($('#bodyBuild').value),bodyCurves:Number($('#bodyCurves').value)}});$('#apiKeyInput').value='';$('#searchApiKeyInput').value='';$('#clearKeyInput').checked=false;$('#clearSearchKeyInput').checked=false;const labels={offline:'Soul Offline',local:'Local model',compatible:'Connected model'};let note=`Settings saved. Provider: ${labels[settings.provider]||settings.provider}. Language: ${settings.language||'en'}.`;if(settings.provider!=='offline'&&(!endpoint||!model)) note+=' Add an endpoint and model before leaving offline fallback.';$('#settingsStatus').textContent=note;applyTheme();applyCompanion();renderStatus();renderDashboard();}catch(err){$('#settingsStatus').textContent=String(err?.message||err);}});
$('#addAppBtn').addEventListener('click',async()=>{try{settings=await window.soul.addApplication();applyTheme();renderApps();$('#appsStatus').textContent='Application list updated.';}catch(err){$('#appsStatus').textContent=String(err?.message||err);}});
const localMediaButton=el('button','secondary',t('openLocalMedia','Open local media'));localMediaButton.type='button';localMediaButton.id='openLocalMediaBtn';localMediaButton.addEventListener('click',async()=>{try{const item=await window.soul.selectLocalMedia();if(item)playMedia([item],0,{alreadyConfirmed:true,append:true});}catch(err){alert(String(err?.message||err));}});$('#entertainmentView .panel-head').append(localMediaButton);
$('#discoverAppsBtn').addEventListener('click',async()=>{
  const grid=$('#discoveredAppsGrid');
  try {
    $('#appsStatus').textContent='Scanning Windows Start Menu shortcuts…';
    const apps=await window.soul.discoverApplications();
    grid.textContent='';
    for(const app of apps){
      const card=el('div','app-card'); card.append(el('strong','',app.name));
      const add=el('button','secondary','Add'); add.type='button';
      add.addEventListener('click',async()=>{try{settings=await window.soul.addDiscoveredApplication(app.id);renderApps();add.disabled=true;add.textContent='Added';}catch(err){$('#appsStatus').textContent=String(err?.message||err);}});
      card.append(add); grid.append(card);
    }
    if(!apps.length) grid.append(el('div','empty','No Start Menu shortcuts were found. You can still choose a trusted .exe or .lnk file. Discovery reads shortcut names locally and does not open them.'));
    $('#discoveredAppsCard').classList.remove('hidden');
    $('#appsStatus').textContent=`Found ${apps.length} local application shortcuts.`;
  } catch(err) { $('#appsStatus').textContent=String(err?.message||err); }
});
$('#gamingModeInput').addEventListener('change',async()=>{try{settings=await window.soul.saveSettings({provider:settings.provider,endpoint:settings.endpoint,model:settings.model,theme:{...(settings.theme||{}),gamingMode:$('#gamingModeInput').checked}});if($('#gamingModeInput').checked&&'speechSynthesis' in window)speechSynthesis.cancel();applyTheme();$('#appsStatus').textContent=$('#gamingModeInput').checked?'Low-overhead mode enabled for Eidovara.':'Low-overhead mode disabled.';}catch(err){$('#appsStatus').textContent=String(err?.message||err);}});
$('#themeTransparency').addEventListener('input',()=>{$('#themeTransparencyValue').textContent=`${$('#themeTransparency').value}%`;});
$('#companionAvatar').addEventListener('click',()=>{setView('dashboard');$('#soulDock')?.scrollIntoView({block:'nearest'});$('#companionInput')?.focus();});
$('#voicePreviewBtn').addEventListener('click',()=>{settings.companion={...(settings.companion||{}),voiceURI:$('#voiceSelect').value,voiceName:$('#voiceSelect').value,rate:Number($('#voiceRate').value),pitch:Number($('#voicePitch').value),mute:false};speakSoul('This is an Eidovara system-voice preview. Soul is software on this device, not a person.',true);});
$('#voiceMute')?.addEventListener('change',()=>{if($('#voiceEnabled'))$('#voiceEnabled').checked=!$('#voiceMute').checked;});
$('#voiceEnabled')?.addEventListener('change',()=>{if($('#voiceMute'))$('#voiceMute').checked=!$('#voiceEnabled').checked;});
const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
function bindHoldToTalk(button, fill){
  if(!button) return;
  if(!Recognition){ button.classList.add('hidden'); return; }
  button.classList.remove('hidden');
  let rec=null;
  const stop=()=>{try{rec?.stop();}catch{} button.classList.remove('listening');};
  const start=()=>{
    rec=new Recognition(); rec.continuous=false; rec.interimResults=false;
    rec.onstart=()=>{button.classList.add('listening'); if($('#voiceSupportStatus')) $('#voiceSupportStatus').textContent='Listening… microphone audio is used only for this dictation session.'; if($('#companionError')) $('#companionError').classList.add('hidden');};
    rec.onresult=e=>{fill([...e.results].map(r=>r[0].transcript).join(' '));};
    rec.onerror=e=>{
      const reason=e.error==='not-allowed'?'Microphone permission was denied.':e.error==='no-speech'?'No speech was heard.':e.error;
      const copy=`Voice input unavailable: ${reason}. You can continue typing. Eidovara does not ship a neural TTS engine.`;
      if($('#voiceSupportStatus')) $('#voiceSupportStatus').textContent=copy;
      if($('#companionError')){ $('#companionError').textContent=copy; $('#companionError').classList.remove('hidden'); }
    };
    rec.onend=()=>{button.classList.remove('listening'); if($('#voiceSupportStatus') && !$('#voiceSupportStatus').textContent.startsWith('Voice input unavailable')) $('#voiceSupportStatus').textContent='Dictation complete. Review the text before sending.';};
    try{rec.start();}catch(err){if($('#voiceSupportStatus')) $('#voiceSupportStatus').textContent=`Voice input unavailable: ${err?.message||err}. You can continue typing.`;}
  };
  button.addEventListener('pointerdown', e=>{e.preventDefault(); start();});
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointercancel', stop);
  button.addEventListener('pointerleave', stop);
  button.addEventListener('keydown', e=>{ if(e.key===' '||e.key==='Enter'){ e.preventDefault(); start(); }});
  button.addEventListener('keyup', e=>{ if(e.key===' '||e.key==='Enter'){ e.preventDefault(); stop(); }});
}
if(Recognition){
  bindHoldToTalk($('#voiceInputBtn'), text=>{ $('#messageInput').value=text; autoSize(); });
  bindHoldToTalk($('#companionTalkBtn'), text=>{ if($('#companionInput')) $('#companionInput').value=text; });
}else if($('#voiceSupportStatus')){
  $('#voiceSupportStatus').textContent='Installed OS voices are available for playback. Voice input is not supported by this system build. Eidovara does not ship a neural TTS engine.';
}
if('speechSynthesis' in window)speechSynthesis.onvoiceschanged=populateVoices;
$('#openDataBtn').addEventListener('click',()=>window.soul.openDataFolder());
$('#privacyNoticeBtn').addEventListener('click',()=>window.soul.openExternal('https://eidovara.org/privacy.html'));
$('#termsNoticeBtn').addEventListener('click',()=>window.soul.openExternal('https://eidovara.org/terms.html'));
$('#ageNoticeBtn').addEventListener('click',()=>window.soul.openExternal('https://eidovara.org/age.html'));
$('#securityCenterBtn').addEventListener('click',()=>window.soul.openExternal('https://eidovara.org/security.html'));
$('#licensingBtn').addEventListener('click',()=>window.soul.openExternal('https://eidovara.org/licensing.html'));
$('#upgradeBtn').addEventListener('click',()=>{if(settings?.storeUrl)window.soul.openExternal(settings.storeUrl).catch(err=>{$('#settingsStatus').textContent=String(err?.message||err);});});
$('#assistantBehaviorForm').addEventListener('submit',async e=>{e.preventDefault();try{state=await window.soul.configureAssistant({autonomy:$('#assistantAutonomy').value,initiativeEnabled:$('#assistantInitiative').checked,reflectionEnabled:$('#assistantReflection').checked,responseLength:$('#responseLength').value,tone:$('#responseTone').value,focusMode:$('#focusMode').value,accessibility:$('#assistantAccessibility').value,language:$('#languageSelect').value,webResearch:$('#webResearchPolicy').value,mediaPlayback:$('#mediaPlaybackPolicy').value,memoryLearning:$('#memoryLearning').checked?'enabled':'disabled'});$('#assistantBehaviorStatus').textContent=t('behaviorSaved','Behavior settings saved. Language, tone, and accessibility remain as set.');renderAll();}catch(err){$('#assistantBehaviorStatus').textContent=String(err?.message||err);}});
$$('#dashboardQuick [data-quick]').forEach(b=>b.addEventListener('click',()=>{setView('dashboard');send(b.dataset.quick,{surface:'companion'});}));
$$('#entertainmentView [data-quick]').forEach(b=>b.addEventListener('click',()=>{setView('chat');send(b.dataset.quick);}));
$('#diagnosticsBtn').addEventListener('click',async()=>{
  const d=await window.soul.diagnostics();
  d.rendererCapabilities=rendererCapabilities();
  const codecs=d.rendererCapabilities||{};
  const summary=$('#diagnosticsSummary');
  if(summary){
    summary.textContent='';
    const rows=[
      ['Eidovara', `${d.version} · ${d.platform}/${d.arch}`],
      ['Chromium', `${d.chromium || 'n/a'} · GPU accel ${d.hardwareAcceleration?'on':'off'}`],
      ['Codecs', `H.264 ${codecs.video?.h264?'yes':'no'} · VP9 ${codecs.video?.vp9?'yes':'no'} · AV1 ${codecs.video?.av1?'yes':'no'} · AAC ${codecs.audio?.aac?'yes':'no'}`],
      ['Protection', d.settings?.encryptionAvailable ? 'OS credential protection available' : 'OS credential protection unavailable'],
      ['Safety log', `${d.localSafetyReportCount||0} local reports (not sent automatically)`]
    ];
    for(const [k,v] of rows){const line=el('div','kv');line.append(el('span','',k),el('span','',v));summary.append(line);}
  }
  $('#diagnosticsText').textContent=JSON.stringify(d,null,2);
  $('#diagnosticsCard').classList.remove('hidden');
});
async function checkUpdates(silent=false){try{const u=await window.soul.checkForUpdates();if(!u.configured){if(!silent)$('#updateStatus').textContent='This development build has no published release channel.';return;}if(u.available){$('#updateStatus').textContent=`Version ${u.version} is available.${u.notes?' '+u.notes:''}`;$('#installUpdateBtn').classList.remove('hidden');}else if(!silent){ $('#updateStatus').textContent=`Eidovara ${u.currentVersion} is current.`;}}catch(err){if(!silent)$('#updateStatus').textContent=String(err?.message||err);}}
$('#checkUpdateBtn').addEventListener('click',()=>checkUpdates(false));$('#installUpdateBtn').addEventListener('click',async()=>{try{$('#updateStatus').textContent='Downloading and verifying update…';const result=await window.soul.installUpdate();$('#updateStatus').textContent=result.cancelled?'Update cancelled.':'Verified installer launched.';}catch(err){$('#updateStatus').textContent=String(err?.message||err);}});
$$('input[name="setupCategory"]').forEach(x=>x.addEventListener('change',toggleStreamSetup));$('#openSetupBtn').addEventListener('click',()=>openSetup(true));$('#cancelSetupBtn').addEventListener('click',()=>$('#setupOverlay').classList.add('hidden'));$('#setupForm').addEventListener('submit',async e=>{e.preventDefault();const categories=setupCategories();const access=$('#setupAccessibility')?.value.trim()||'';if(!categories.length&&!$('#setupCustomNeeds').value.trim()&&!access){$('#setupStatus').textContent='Choose at least one role or describe what you need.';return;}try{$('#setupStatus').textContent='Saving…';state=await window.soul.configureSetup({categories,customNeeds:$('#setupCustomNeeds').value,obsWebSocketUrl:$('#setupObsUrl').value,streamGoals:$('#setupStreamGoals').value});if(access||categories.includes('accessibility')) state=await window.soul.configureAssistant(assistantPayload({accessibility:access || state.assistant?.preferences?.accessibility || ''}));$('#setupOverlay').classList.add('hidden');renderAll();}catch(err){$('#setupStatus').textContent=String(err?.message||err);}});
$('#backupBtn').addEventListener('click',async()=>{try{$('#backupStatus').textContent='Creating local snapshot…';const b=await window.soul.createBackup();$('#backupStatus').textContent=`Created ${b.name} (${Math.ceil(b.bytes/1024)} KB). Restore is available from the list below.`;await refreshBackups();renderDashboard();}catch(err){$('#backupStatus').textContent=String(err?.message||err);}});
$('#refreshBackupsBtn').addEventListener('click',()=>refreshBackups().then(()=>{$('#backupStatus').textContent=backupCount?`${backupCount} local snapshot${backupCount===1?'':'s'} available.` : t('noBackups');renderDashboard();}).catch(err=>{$('#backupStatus').textContent=String(err?.message||err);}));
$('#restoreBackupBtn').addEventListener('click',async()=>{const name=$('#backupSelect').value;if(!name||name.startsWith('No backups')||!confirm('Restore this backup and replace the current profile state?'))return;try{state=await window.soul.restoreBackup(name);renderAll();$('#backupStatus').textContent=`Restored ${name}. Conversations, memories, and Soul continuity now match that snapshot.`;await refreshBackups();renderDashboard();}catch(err){$('#backupStatus').textContent=String(err?.message||err);}});
$('#resetBtn').addEventListener('click',async()=>{if(!confirm('Reset the current Soul profile and local conversation history?'))return;state=await window.soul.reset();renderAll();setView('chat');});

function startPathDismissed(){ try { return localStorage.getItem(START_PATH_KEY) === '1'; } catch { return false; } }
function setStartPathDismissed(on){ try { if(on) localStorage.setItem(START_PATH_KEY,'1'); else localStorage.removeItem(START_PATH_KEY); } catch {} $('#startPath')?.classList.toggle('hidden', on); }
function jumpSettings(id){ setView('settings'); const node=$(id); if(node) node.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'}); }
function focusCompanion(){ setView('dashboard'); $('#soulDock')?.scrollIntoView({block:'nearest'}); $('#companionInput')?.focus(); }
const PALETTE_COMMANDS = [
  { id:'dashboard', title:'Dashboard', hint:'Home after 18+', run:()=>setView('dashboard') },
  { id:'talk', title:'Talk with Soul', hint:'Right dock — local assistant, not Assist', run:()=>focusCompanion() },
  { id:'apps', title:'Apps & Gaming', hint:'Launch still asks you to confirm', run:()=>setView('apps') },
  { id:'entertainment', title:'Entertainment', hint:'Local media and official searches', run:()=>setView('entertainment') },
  { id:'memory', title:'Memory', hint:'Facts Soul can keep', run:()=>setView('memory') },
  { id:'identity', title:'Identity & consent', hint:'Adult Mode stays a triple gate', run:()=>setView('identity') },
  { id:'service', title:'Service URL', hint:'Default https://api.eidovara.org', run:()=>jumpSettings('#serviceForm') },
  { id:'voices', title:'Voices & presence', hint:'OS voices only — no neural TTS', run:()=>jumpSettings('#settings-voices') },
  { id:'modules', title:'Modules', hint:'Local feature toggles', run:()=>jumpSettings('#kernelCustomizeForm') },
  { id:'behavior', title:'Soul behavior', hint:'Tone, research, media confirm', run:()=>jumpSettings('#assistantBehaviorForm') },
  { id:'backups', title:'Backups', hint:'Local snapshots', run:()=>jumpSettings('#backupSection') },
  { id:'legal', title:'About & legal', hint:'18+, unsigned, no payments', run:()=>showLegal('about') },
  { id:'shortcuts', title:'Keyboard shortcuts', hint:'Ctrl+/', run:()=>openShortcutSheet() }
];
let paletteIndex = 0;
function filteredPalette(query){
  const q=String(query||'').trim().toLowerCase();
  if(!q) return PALETTE_COMMANDS.slice();
  return PALETTE_COMMANDS.filter(item => `${item.title} ${item.hint} ${item.id}`.toLowerCase().includes(q));
}
function renderPaletteList(){
  const box=$('#paletteList'); if(!box) return;
  const items=filteredPalette($('#paletteInput')?.value);
  box.textContent='';
  if(!items.length){ box.append(el('p','soul-dock-empty', t('paletteEmpty','No matching places. Try dashboard or settings.'))); return; }
  paletteIndex=Math.max(0, Math.min(paletteIndex, items.length-1));
  items.forEach((item, i)=>{
    const b=el('button','');
    b.type='button';
    b.setAttribute('role','option');
    b.setAttribute('aria-selected', String(i===paletteIndex));
    b.append(el('strong','',item.title), el('small','',item.hint));
    b.addEventListener('click',()=>{ closePalette(); item.run(); });
    box.append(b);
  });
}
function openPalette(){
  if(document.body.classList.contains('age-gated')) return;
  if(typeof window.eidovaraLayers?.openPalette === 'function'){
    window.eidovaraLayers.openPalette();
    return;
  }
  $('#shortcutSheet')?.classList.add('hidden');
  $('#cheatsheetOverlay')?.classList.add('hidden');
  $('#commandPalette')?.classList.remove('hidden');
  paletteIndex=0;
  if($('#paletteInput')) $('#paletteInput').value='';
  renderPaletteList();
  $('#paletteInput')?.focus();
}
function closePalette(){ $('#commandPalette')?.classList.add('hidden'); }
function openShortcutSheet(){
  if(document.body.classList.contains('age-gated')) return;
  if(typeof window.eidovaraLayers?.openCheatsheet === 'function'){
    window.eidovaraLayers.openCheatsheet();
    return;
  }
  closePalette();
  $('#shortcutSheet')?.classList.remove('hidden');
  $('#shortcutCloseBtn')?.focus();
}
function closeShortcutSheet(){
  $('#shortcutSheet')?.classList.add('hidden');
  $('#cheatsheetOverlay')?.classList.add('hidden');
}
function overlayOpen(id){ const n=$(id); return n && !n.classList.contains('hidden'); }

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(overlayOpen('#ageGateOverlay')) return;
    if(overlayOpen('#commandPalette')){ closePalette(); e.preventDefault(); return; }
    if(overlayOpen('#shortcutSheet')){ closeShortcutSheet(); e.preventDefault(); return; }
    if(overlayOpen('#cheatsheetOverlay')){$('#cheatsheetOverlay').classList.add('hidden');e.preventDefault();return;}
    if(overlayOpen('#legalOverlay')){$('#legalOverlay').classList.add('hidden');e.preventDefault();return;}
    if(overlayOpen('#adminOverlay')){$('#adminOverlay').classList.add('hidden');e.preventDefault();return;}
    if(overlayOpen('#setupOverlay')&&!$('#cancelSetupBtn').classList.contains('hidden')){$('#setupOverlay').classList.add('hidden');e.preventDefault();}
    return;
  }
  if(e.ctrlKey&&!e.shiftKey&&!e.altKey&&(e.key.toLowerCase()==='k'||e.key.toLowerCase()==='p')){
    if(e.defaultPrevented) return;
    if(document.body.classList.contains('age-gated')) return;
    e.preventDefault();
    if(overlayOpen('#commandPalette')) closePalette(); else openPalette();
    return;
  }
  if(e.ctrlKey&&!e.shiftKey&&!e.altKey&&(e.key==='/'||e.key==='?')){
    if(e.defaultPrevented) return;
    if(document.body.classList.contains('age-gated')) return;
    e.preventDefault();
    if(overlayOpen('#shortcutSheet')||overlayOpen('#cheatsheetOverlay')){
      closeShortcutSheet();
      $('#cheatsheetOverlay')?.classList.add('hidden');
    } else openShortcutSheet();
    return;
  }
  if(overlayOpen('#commandPalette')){
    const items=filteredPalette($('#paletteInput')?.value);
    if(e.key==='ArrowDown'){ e.preventDefault(); paletteIndex=Math.min(items.length-1, paletteIndex+1); renderPaletteList(); return; }
    if(e.key==='ArrowUp'){ e.preventDefault(); paletteIndex=Math.max(0, paletteIndex-1); renderPaletteList(); return; }
    if(e.key==='Enter'){ e.preventDefault(); const pick=items[paletteIndex]; closePalette(); pick?.run(); return; }
  }
  if(e.ctrlKey&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()==='a'){
    if(e.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if(document.body.classList.contains('age-gated')) return;
    e.preventDefault();
    openAdmin().catch(err=>alert(String(err?.message||err)));
  }
});
$('#paletteBtn')?.addEventListener('click',()=>openPalette());
$('#shortcutBtn')?.addEventListener('click',()=>openShortcutSheet());
$('#paletteCloseBtn')?.addEventListener('click',()=>closePalette());
$('#shortcutCloseBtn')?.addEventListener('click',()=>closeShortcutSheet());
$('#paletteInput')?.addEventListener('input',()=>{paletteIndex=0;renderPaletteList();});
$$('[data-settings-jump]').forEach(b=>b.addEventListener('click',()=>jumpSettings('#'+b.dataset.settingsJump)));
$('#welcomeDashboardBtn')?.addEventListener('click',()=>setView('dashboard'));
$$('[data-start]').forEach(b=>b.addEventListener('click',()=>{
  const action=b.dataset.start;
  if(action==='talk') focusCompanion();
  else if(action==='apps') setView('apps');
  else if(action==='settings') jumpSettings('#serviceForm');
}));
$('#dismissStartPath')?.addEventListener('click',()=>setStartPathDismissed(true));
$('#adminCancelBtn').addEventListener('click',()=>$('#adminOverlay').classList.add('hidden'));
$('#adminLoginForm').addEventListener('submit',async e=>{e.preventDefault();try{const password=$('#adminPassword').value;const status=$('#adminLoginForm').dataset.configured==='true'?await window.soul.adminLogin(password):await window.soul.adminConfigure(password);$('#adminPassword').value='';$('#adminLoginForm').classList.add('hidden');$('#adminPanelForm').classList.remove('hidden');$('#adminEdition').value=status.edition;$('#adminStoreUrl').value=status.storeUrl||'';$('#adminServiceUrl').value=status.serviceUrl||'';$('#adminPanelStatus').textContent=`Unlocked until ${new Date(status.expiresAt).toLocaleTimeString()}.`;}catch(err){$('#adminLoginStatus').textContent=String(err?.message||err);}});
$('#adminPanelForm').addEventListener('submit',async e=>{e.preventDefault();try{const status=await window.soul.adminSave({edition:$('#adminEdition').value,storeUrl:$('#adminStoreUrl').value.trim(),serviceUrl:$('#adminServiceUrl').value.trim()});settings=await window.soul.getSettings();renderAll();$('#adminPanelStatus').textContent=`Saved ${status.edition} edition, store, and HTTPS service configuration.`;}catch(err){$('#adminPanelStatus').textContent=String(err?.message||err);}});
$('#adminLockBtn').addEventListener('click',async()=>{await window.soul.adminLogout();$('#adminOverlay').classList.add('hidden');});
$('#adminStoreBtn').addEventListener('click',()=>{const url=$('#adminStoreUrl').value.trim();if(!url){$('#adminPanelStatus').textContent='Configure an HTTPS store link first.';return;}window.soul.openExternal(url).catch(err=>{$('#adminPanelStatus').textContent=String(err?.message||err);});});
$('#adminServiceBtn').addEventListener('click',async()=>{try{await window.soul.adminSave({edition:$('#adminEdition').value,storeUrl:$('#adminStoreUrl').value.trim(),serviceUrl:$('#adminServiceUrl').value.trim()});const result=await window.soul.checkService();settings=await window.soul.getSettings();applyServiceIndicator(result);$('#adminPanelStatus').textContent=!result.configured?'Configure a service URL first.':result.online?`${result.service||'Eidovara'} ${result.version||''} is online. Checkout stays off.`.replace(/\s+/g,' ').trim():(result.error||'Service is offline. Offline Soul continues locally.');}catch(err){$('#adminPanelStatus').textContent=String(err?.message||err);}});
let serviceRetryTimer=0;
async function refreshServiceStatus(silent=false){
  if(!settings?.ageGateAccepted) return;
  try{
    const result=await window.soul.checkService();
    settings=await window.soul.getSettings();
    settings.serviceStatus=result.serviceStatus||result;
    applyServiceIndicator(result);
    renderDashboard();
    clearTimeout(serviceRetryTimer);
    if(result.configured&&!result.online) serviceRetryTimer=setTimeout(()=>refreshServiceStatus(true),8000);
  }catch(err){
    if(!silent&&$('#serviceStatusText')) $('#serviceStatusText').textContent=String(err?.message||err);
    applyServiceIndicator({configured:Boolean(settings?.serviceUrl),online:false,paymentsEnabled:false,error:String(err?.message||err)});
  }
}
async function connectEidovaraService(){
  $('#serviceStatusText').textContent='Connecting…';
  try{
    const result=await window.soul.connectService({serviceUrl:$('#serviceUrlInput').value.trim()});
    settings=await window.soul.getSettings();
    settings.serviceStatus=result.serviceStatus||result;
    applyServiceIndicator(result);
    renderDashboard();
    clearTimeout(serviceRetryTimer);
    if(result.configured&&!result.online) serviceRetryTimer=setTimeout(()=>refreshServiceStatus(true),8000);
  }catch(err){$('#serviceStatusText').textContent=String(err?.message||err);}
}
$('#serviceForm').addEventListener('submit',async e=>{e.preventDefault();await connectEidovaraService();});
$('#serviceConnectBtn').addEventListener('click',()=>connectEidovaraService());
$('#serviceSiteBtn').addEventListener('click',()=>{const url=settings?.serviceStatus?.website;if(url)window.soul.openExternal(url).catch(err=>{$('#serviceStatusText').textContent=String(err?.message||err);});});
$('#ageGateTermsCheck').addEventListener('change',()=>{$('#ageGateAcceptBtn').disabled=!$('#ageGateTermsCheck').checked;});
function showLegal(section){
  const panels={about:$('#legalAboutPanel'),terms:$('#legalTermsPanel'),privacy:$('#legalPrivacyPanel'),age:$('#legalAgePanel')};
  Object.entries(panels).forEach(([key,el])=>el.classList.toggle('hidden',key!==section));
  $$('#legalOverlay [data-legal]').forEach(b=>b.classList.toggle('secondary',b.dataset.legal!==section));
  $('#legalOverlay').classList.remove('hidden');
}
window.eidovaraSetView=setView;
window.eidovaraSend=send;
window.eidovaraOpenSetup=openSetup;
window.eidovaraShowLegal=showLegal;
window.eidovaraOpenPalette=openPalette;
window.eidovaraOpenShortcutSheet=openShortcutSheet;window.eidovaraRenderDashboard=renderDashboard;
window.eidovaraRenderAll=renderAll;
window.eidovaraActiveConversation=()=>activeConversation()?.messages||[];
window.eidovaraReloadState=async()=>{state=await window.soul.snapshot();renderAll();};
$('#legalAboutBtn').addEventListener('click',()=>showLegal('about'));
$$('#legalOverlay [data-legal]').forEach(b=>b.addEventListener('click',()=>showLegal(b.dataset.legal)));
$('#legalCloseBtn').addEventListener('click',()=>$('#legalOverlay').classList.add('hidden'));
$('#ageGateLegalBtn').addEventListener('click',()=>showLegal('terms'));
function setAgeGated(on){
  document.body.classList.toggle('age-gated',on);
  document.querySelector('.app')?.toggleAttribute('inert',on);
  $('#ageGateOverlay').classList.toggle('hidden',!on);
  if(on) $('#ageGateTermsCheck')?.focus();
}
$('#ageGateAcceptBtn').addEventListener('click',async()=>{if(!$('#ageGateTermsCheck').checked)return;settings=await window.soul.acceptAgeGate(true);state=await window.soul.snapshot();setAgeGated(false);await refreshBackups().catch(()=>{});window.eidovaraSettings=settings;renderDashboard();window.eidovaraCompanion?.startPolling?.();void refreshServiceStatus(true);setView('dashboard');if(!state.setup?.completed)openSetup(false);else {$('#companionInput')?.focus();if(settings.updateChannelConfigured)checkUpdates(true);}});
$('#ageGateDeclineBtn').addEventListener('click',()=>window.soul.declineAgeGate());

(async function init(){ try{[state,settings]=await Promise.all([window.soul.snapshot(),window.soul.getSettings()]);window.eidovaraSettings=settings;$('#providerSelect').value=settings.provider;$('#endpointInput').value=settings.endpoint||'';$('#modelInput').value=settings.model||'';$('#apiKeyInput').placeholder=settings.hasApiKey?'Stored securely — leave blank to keep':'API key';$('#searchApiKeyInput').placeholder=settings.hasSearchApiKey?'Stored securely — leave blank to keep':'Brave Search API key';const theme=settings.theme||{};$('#themeBackground').value=theme.background||'#000000';$('#themePanel').value=theme.panel||'#1c1c1e';$('#themeAccent').value=theme.accent||'#0a84ff';$('#themeTransparency').value=theme.transparency||96;$('#themeTransparencyValue').textContent=`${theme.transparency||96}%`;$('#themeRgb').checked=Boolean(theme.rgbEffects);$('#gamingModeInput').checked=Boolean(theme.gamingMode);if($('#serviceUrlInput'))$('#serviceUrlInput').value=settings.serviceUrl||'https://api.eidovara.org';if($('#assistOptIn'))$('#assistOptIn').checked=settings.assistOptIn===true;setStartPathDismissed(startPathDismissed());renderAll();setView(settings.ageGateAccepted?'dashboard':'chat');window.addEventListener('eidovara:locale',()=>{const mediaBtn=$('#openLocalMediaBtn');if(mediaBtn)mediaBtn.textContent=t('openLocalMedia','Open local media');renderAll();});if(!settings.ageGateAccepted){setAgeGated(true);}else{void refreshServiceStatus(true);await refreshBackups().catch(()=>{});renderDashboard();window.eidovaraCompanion?.startPolling?.();if($('#companionInput')) $('#companionInput').focus(); else $('#messageInput').focus();if(!state.setup?.completed)openSetup(false);if(settings.updateChannelConfigured)checkUpdates(true);}}catch(err){document.body.textContent=`Eidovara could not initialize: ${err?.message||err}`;} })();
