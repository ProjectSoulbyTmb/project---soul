// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
(() => {
  const $ = s => document.querySelector(s);
  const t = (key, fallback) => window.eidovaraI18n?.t(key, fallback) || fallback || key;
  const VOLUME_KEY = 'eidovara.player.volume';
  const LOCAL_MEDIA_SCHEME = 'eidovara-media';
  const ONLINE_MEDIA_SCHEME = 'eidovara-online';
  const CATALOG_COPY = 'This service can’t play inside Eidovara; it opens in your browser.';
  const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

  let queue = [];
  let index = -1;
  let expanded = false;
  let poppedOut = false;
  let loop = false;
  let shuffle = false;
  let rate = 1;
  let sleepTimer = 0;
  let chromeTimer = 0;
  let lastFocus = null;
  const floatMode = document.body?.classList.contains('float-player');

  function reducedMotion() {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  }

  function isAllowedPlaybackUrl(value) {
    let parsed;
    try { parsed = new URL(String(value || '')); } catch { return false; }
    return parsed.protocol === `${LOCAL_MEDIA_SCHEME}:` || parsed.protocol === `${ONLINE_MEDIA_SCHEME}:`;
  }

  function officialSearchUrl(platform, query) {
    const q = encodeURIComponent(String(query || '').trim().slice(0, 200));
    if (!q) return '';
    if (platform === 'spotify') return `https://open.spotify.com/search/${q}`;
    if (platform === 'youtube') return `https://www.youtube.com/results?search_query=${q}`;
    if (platform === 'netflix') return `https://www.netflix.com/search?q=${q}`;
    return '';
  }

  function overlayOpen(id) {
    const n = $(id);
    return n && !n.classList.contains('hidden');
  }

  function inField(target) {
    return Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"]'));
  }

  function currentItem() {
    return queue[index] || null;
  }

  function currentPlayer() {
    return currentItem()?.type === 'video' ? $('#videoPlayer') : $('#audioPlayer');
  }

  function clampVolume(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 1;
    return Math.max(0, Math.min(1, n));
  }

  function readVolume() {
    try { return clampVolume(localStorage.getItem(VOLUME_KEY)); } catch { return 1; }
  }

  function writeVolume(value) {
    const v = clampVolume(value);
    try { localStorage.setItem(VOLUME_KEY, String(v)); } catch {}
    return v;
  }

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const s = Math.floor(sec % 60);
    const m = Math.floor(sec / 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function secondaryLabel(item) {
    if (!item) return '';
    if (item.artist) return item.artist;
    if (item.local) return `${item.type === 'video' ? t('playerLocalVideo', 'Local video') : t('playerLocalFile', 'Local file')} · ${t('playerNative', 'Native')}`;
    try {
      const host = new URL(item.sourceUrl || item.url).hostname;
      if (host) return `${host} · ${t('playerStream', 'Stream')}`;
    } catch {}
    return item.type === 'video' ? t('playerVideo', 'Video') : t('playerAudio', 'Audio');
  }

  function snapshot() {
    const player = currentPlayer();
    return {
      active: queue.length > 0 && index >= 0,
      expanded,
      poppedOut,
      playing: Boolean(player && !player.paused && !player.ended),
      loop,
      shuffle,
      rate,
      reducedMotion: reducedMotion(),
      queue: queue.slice(),
      index,
      item: currentItem(),
      currentTime: Number(player?.currentTime) || 0,
      volume: Number($('#mediaVolume')?.value || 1)
    };
  }

  function emit() {
    window.dispatchEvent(new CustomEvent('eidovara:now-playing', { detail: snapshot() }));
    window.eidovaraCompanion?.refresh?.();
  }

  function applyShell() {
    const root = $('#mediaDock');
    if (!root) return;
    const active = queue.length > 0 && index >= 0;
    root.classList.toggle('is-idle', !active);
    root.classList.toggle('is-active', active);
    root.classList.toggle('is-expanded', expanded && active && !poppedOut);
    root.classList.toggle('hidden', !active && !root.classList.contains('eidovara-player'));
    root.setAttribute('aria-hidden', active ? 'false' : 'true');
    document.body.classList.toggle('has-now-playing', active);
    const stage = $('#nowPlayingStage');
    if (stage) {
      stage.setAttribute('aria-hidden', expanded && active && !poppedOut ? 'false' : 'true');
      if (expanded && active && !poppedOut) stage.removeAttribute('inert');
      else stage.setAttribute('inert', '');
    }
  }

  function paintArt(item) {
    const fallback = $('#mediaArtFallback');
    const canvas = $('#mediaArtCanvas');
    const stageArt = $('#mediaStageArt');
    const title = item?.title || '';
    const letter = (title.trim()[0] || 'E').toUpperCase();
    if (fallback) fallback.textContent = letter;
    if (stageArt) {
      let hash = 0;
      for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
      const h = hash % 360;
      stageArt.style.background = `linear-gradient(160deg, hsl(${h} 42% 28%), hsl(${(h + 48) % 360} 28% 10%), #05070c)`;
      const label = stageArt.querySelector('strong');
      if (label) label.textContent = title;
    }
    const video = $('#videoPlayer');
    if (canvas && item?.type === 'video' && video && video.readyState >= 2) {
      try {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.hidden = false;
        if (fallback) fallback.hidden = true;
        return;
      } catch {}
    }
    if (canvas) canvas.hidden = true;
    if (fallback) fallback.hidden = false;
  }

  function applyTracks(player, item) {
    if (!player) return;
    player.querySelectorAll('track').forEach(node => node.remove());
    if (!item?.local || !item.tracks?.length) return;
    for (const track of item.tracks) {
      if (!isAllowedPlaybackUrl(track.src)) continue;
      const node = document.createElement('track');
      node.kind = track.kind || 'subtitles';
      node.label = track.label || 'Sidecar';
      node.src = track.src;
      player.append(node);
    }
  }

  function renderQueue() {
    const list = $('#mediaQueueList');
    if (!list) return;
    list.textContent = '';
    queue.forEach((item, i) => {
      const row = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = i === index ? 'is-current' : '';
      btn.textContent = item.title;
      btn.addEventListener('click', () => load(i, true));
      row.append(btn);
      list.append(row);
    });
  }

  function updateTransport() {
    const item = currentItem();
    const player = currentPlayer();
    const playing = Boolean(player && !player.paused && !player.ended);
    const playBtn = $('#mediaPlayBtn');
    const stagePlay = $('#mediaStagePlayBtn');
    const label = playing ? t('playerPause', 'Pause') : t('playerPlay', 'Play');
    const glyph = playing ? '❚❚' : '▶';
    if (playBtn) {
      playBtn.textContent = glyph;
      playBtn.setAttribute('aria-label', label);
    }
    if (stagePlay) {
      stagePlay.textContent = glyph;
      stagePlay.setAttribute('aria-label', label);
    }
    if ($('#mediaTitle')) $('#mediaTitle').textContent = item?.title || t('playerNothing', 'Nothing playing');
    if ($('#mediaKind')) {
      const pos = item ? `${index + 1} of ${queue.length}` : '';
      $('#mediaKind').textContent = item ? `${secondaryLabel(item)} · ${pos}` : '';
    }
    if ($('#mediaStageTitle')) $('#mediaStageTitle').textContent = item?.title || t('playerNothing', 'Nothing playing');
    if ($('#mediaStageMeta')) $('#mediaStageMeta').textContent = item ? secondaryLabel(item) : '';
    if ($('#mediaLyrics')) $('#mediaLyrics').textContent = t('playerLyrics', 'No licensed lyrics in-app');
    if ($('#mediaSourceBtn')) $('#mediaSourceBtn').disabled = !item?.sourceUrl;
    if ($('#mediaQuality')) $('#mediaQuality').textContent = item?.local ? t('playerNative', 'Native') : t('playerStream', 'Stream');
    if ($('#mediaLoopBtn')) $('#mediaLoopBtn').classList.toggle('is-on', loop);
    if ($('#mediaShuffleBtn')) $('#mediaShuffleBtn').classList.toggle('is-on', shuffle);
    if ($('#mediaRate')) $('#mediaRate').value = String(rate);
    const surface = $('#mediaSurface');
    if (surface) surface.dataset.kind = item?.type === 'video' ? 'video' : 'audio';
    paintArt(item);
    renderQueue();
  }

  function syncTime() {
    const player = currentPlayer();
    const duration = Number(player?.duration);
    const current = Number(player?.currentTime);
    const seek = $('#mediaSeek');
    const stageSeek = $('#mediaStageSeek');
    const max = Number.isFinite(duration) ? duration : 0;
    const val = Number.isFinite(current) ? current : 0;
    for (const node of [seek, stageSeek]) {
      if (!node || node.dataset.scrubbing === '1') continue;
      node.max = String(max || 0);
      node.value = String(val);
    }
    if ($('#mediaTime')) $('#mediaTime').textContent = formatTime(val);
    if ($('#mediaDuration')) $('#mediaDuration').textContent = formatTime(max);
    if ($('#mediaStageTime')) $('#mediaStageTime').textContent = formatTime(val);
    if ($('#mediaStageDuration')) $('#mediaStageDuration').textContent = formatTime(max);
  }

  function applyVolume(value) {
    const v = writeVolume(value);
    const audio = $('#audioPlayer');
    const video = $('#videoPlayer');
    if (audio) audio.volume = v;
    if (video) video.volume = v;
    if ($('#mediaVolume')) $('#mediaVolume').value = String(v);
    if ($('#mediaStageVolume')) $('#mediaStageVolume').value = String(v);
  }

  function applyRate(value) {
    const n = Number(value);
    rate = RATES.reduce((best, item) => Math.abs(item - n) < Math.abs(best - n) ? item : best, 1);
    const audio = $('#audioPlayer');
    const video = $('#videoPlayer');
    if (audio) audio.playbackRate = rate;
    if (video) video.playbackRate = rate;
    if ($('#mediaRate')) $('#mediaRate').value = String(rate);
  }

  function mediaSignal(event, item = currentItem()) {
    if (!item || !['audio', 'video'].includes(item.type)) return;
    window.soul?.recordMedia?.({ event, type: item.type, title: item.title, sourceUrl: item.sourceUrl }).catch(() => {});
    window.eidovaraChrome?.recordMedia?.(item);
  }

  function applySrc(el, url) {
    if (!el) return false;
    if (!isAllowedPlaybackUrl(url)) {
      el.removeAttribute('src');
      return false;
    }
    el.src = url;
    return true;
  }

  function load(nextIndex, autoplay = true) {
    if (!queue.length) return;
    const previous = currentItem();
    let wrapped = ((nextIndex % queue.length) + queue.length) % queue.length;
    if (shuffle && queue.length > 1 && nextIndex !== index) {
      let pick = wrapped;
      let guard = 0;
      while (pick === index && guard < 8) {
        pick = Math.floor(Math.random() * queue.length);
        guard += 1;
      }
      wrapped = pick;
    }
    if (previous && wrapped !== index) mediaSignal('skip', previous);
    index = wrapped;
    const item = currentItem();
    const audio = $('#audioPlayer');
    const video = $('#videoPlayer');
    audio?.pause();
    video?.pause();
    if (audio) audio.removeAttribute('src');
    if (video) video.removeAttribute('src');
    const player = item.type === 'video' ? video : audio;
    if (!applySrc(player, item.url)) {
      alert(t('playerBlockedSrc', 'That source cannot play in Eidovara. Use a local file or a public HTTPS file. Spotify, YouTube, and Netflix stay in the browser.'));
      return;
    }
    applyTracks(player, item);
    applyVolume(readVolume());
    applyRate(rate);
    if ($('#mediaFavoriteBtn')) $('#mediaFavoriteBtn').textContent = '♡';
    expanded = expanded || item.type === 'video';
    applyShell();
    updateTransport();
    mediaSignal('play', item);
    if (autoplay && !poppedOut) player.play().catch(() => {});
    emit();
  }

  async function resolveItem(item) {
    if (!item) return null;
    if (isAllowedPlaybackUrl(item.url)) return item;
    const source = item.url || item.sourceUrl;
    if (!source) return null;
    if (!window.soul?.resolveOnlineMedia) {
      throw new Error(t('onlineMediaOff', 'Online media is off. Enable it in Settings to play a public HTTPS file.'));
    }
    const resolved = await window.soul.resolveOnlineMedia({ url: source, title: item.title, type: item.type });
    if (resolved?.kind === 'catalog-handoff') return resolved;
    return resolved;
  }

  async function play(items, startIndex = 0, opts = {}) {
    const mode = window.eidovaraState?.assistant?.capabilities?.mediaPlayback || 'confirm';
    if (mode === 'disabled') {
      alert(t('mediaDisabled', 'Media playback is disabled in Soul behavior settings.'));
      return;
    }
    const selected = items?.[startIndex];
    if (mode === 'confirm' && !opts.alreadyConfirmed) {
      if (!window.confirm(`${t('mediaConfirm', 'Play this media in Eidovara:')} ${selected?.title || ''}`.trim())) return;
    }
    const resolved = [];
    let handedOff = false;
    for (const item of Array.isArray(items) ? items : []) {
      if (!item || (item.type !== 'audio' && item.type !== 'video' && item.type)) continue;
      try {
        const next = await resolveItem({ type: item.type === 'video' ? 'video' : 'audio', ...item });
        if (next?.kind === 'catalog-handoff') {
          handedOff = true;
          if (window.confirm(`${t('catalogHandoff', CATALOG_COPY)}\n${next.url || ''}`)) {
            window.soul?.openExternal?.(next.url);
          }
          continue;
        }
        if (next && isAllowedPlaybackUrl(next.url)) resolved.push(next);
      } catch (err) {
        alert(String(err?.message || err));
      }
    }
    if (!resolved.length) {
      if (!opts.quietEmpty && !handedOff) alert(t('playerBlockedSrc', 'That source cannot play in Eidovara. Use a local file or a public HTTPS file. Spotify, YouTube, and Netflix stay in the browser.'));
      return;
    }
    if (opts.append && queue.length) {
      const offset = queue.length;
      queue = [...queue, ...resolved];
      load(offset, true);
      return;
    }
    queue = resolved;
    load(0, true);
  }

  function togglePlay() {
    if (poppedOut && !floatMode) return;
    const player = currentPlayer();
    if (!player) return;
    if (player.paused) player.play().catch(() => {});
    else player.pause();
  }

  function expand() {
    if (!queue.length) return;
    lastFocus = document.activeElement;
    expanded = true;
    applyShell();
    updateTransport();
    const collapse = $('#mediaCollapseBtn');
    requestAnimationFrame(() => collapse?.focus());
    emit();
  }

  function collapse() {
    expanded = false;
    applyShell();
    const art = $('#mediaArtBtn') || $('#mediaExpandBtn');
    (lastFocus && document.contains(lastFocus) ? lastFocus : art)?.focus?.();
    emit();
  }

  function dismiss() {
    const player = currentPlayer();
    player?.pause();
    $('#audioPlayer')?.removeAttribute('src');
    $('#videoPlayer')?.removeAttribute('src');
    queue = [];
    index = -1;
    expanded = false;
    poppedOut = false;
    applyShell();
    updateTransport();
    emit();
  }

  function applyAdultLock() {
    const kept = queue.filter(item => item.local);
    const current = currentItem();
    if (current && !current.local) {
      currentPlayer()?.pause();
      $('#audioPlayer')?.removeAttribute('src');
      $('#videoPlayer')?.removeAttribute('src');
    }
    queue = kept;
    if (!queue.length) {
      dismiss();
      window.soul?.stopOnlineMedia?.().catch(() => {});
      return;
    }
    if (current && !current.local) load(0, false);
    poppedOut = false;
    applyShell();
    updateTransport();
    emit();
  }

  async function handleEnginePlayback(onlinePlayback) {
    if (!onlinePlayback) return;
    if (onlinePlayback.kind === 'catalog-handoff') {
      if (window.confirm(`${t('catalogHandoff', CATALOG_COPY)}\n${onlinePlayback.url || ''}`)) {
        window.soul?.openExternal?.(onlinePlayback.url);
      }
      return;
    }
    if (onlinePlayback.kind !== 'playable') return;
    await play([{ type: onlinePlayback.type || 'audio', title: onlinePlayback.hostname || 'Online media', url: onlinePlayback.sourceUrl, sourceUrl: onlinePlayback.sourceUrl }], 0, { alreadyConfirmed: true });
  }

  function showChrome() {
    $('#mediaSurface')?.classList.add('is-chrome-visible');
    clearTimeout(chromeTimer);
    chromeTimer = setTimeout(() => {
      if (!reducedMotion()) $('#mediaSurface')?.classList.remove('is-chrome-visible');
    }, 2400);
  }

  function completeMedia() {
    mediaSignal('complete');
    if (loop && queue.length === 1) {
      const player = currentPlayer();
      if (player) { player.currentTime = 0; player.play().catch(() => {}); }
      return;
    }
    const next = shuffle ? index + 1 : index + 1;
    if (!loop && next >= queue.length && !shuffle) {
      updateTransport();
      emit();
      return;
    }
    load(next, true);
  }

  async function handoff(platform) {
    const item = currentItem();
    if (!item) return;
    const url = officialSearchUrl(platform, item.title);
    if (!url) return;
    if (!window.confirm(t('catalogHandoff', CATALOG_COPY))) return;
    window.soul?.openExternal?.(url);
  }

  async function popOut() {
    const item = currentItem();
    if (!item || floatMode) return;
    const player = currentPlayer();
    const payload = { ...snapshot(), playing: Boolean(player && !player.paused) };
    player?.pause();
    poppedOut = true;
    applyShell();
    await window.soul?.popOutPlayer?.(payload);
    emit();
  }

  function dockFromMain(payload) {
    poppedOut = false;
    applyShell();
    const player = currentPlayer();
    if (player && Number.isFinite(payload?.currentTime)) player.currentTime = payload.currentTime;
    if (payload?.playing) player?.play?.().catch(() => {});
    emit();
  }

  function bindPlayer(el) {
    if (!el) return;
    el.addEventListener('play', () => { updateTransport(); emit(); });
    el.addEventListener('pause', () => { updateTransport(); emit(); });
    el.addEventListener('ended', completeMedia);
    el.addEventListener('timeupdate', () => {
      syncTime();
      if (currentItem()?.type === 'video' && !reducedMotion()) paintArt(currentItem());
    });
    el.addEventListener('loadedmetadata', syncTime);
    el.addEventListener('loadeddata', () => paintArt(currentItem()));
  }

  function onSeekInput(node, live) {
    const player = currentPlayer();
    if (!player || !node) return;
    node.dataset.scrubbing = live ? '1' : '0';
    const value = Number(node.value);
    if (Number.isFinite(value)) player.currentTime = value;
    if (!live) syncTime();
  }

  function setSleep(minutes) {
    clearTimeout(sleepTimer);
    if (!minutes) return;
    sleepTimer = setTimeout(() => currentPlayer()?.pause(), Number(minutes) * 60 * 1000);
  }

  $('#mediaPrevBtn')?.addEventListener('click', () => load(index - 1));
  $('#mediaNextBtn')?.addEventListener('click', () => load(index + 1));
  $('#mediaStagePrevBtn')?.addEventListener('click', () => load(index - 1));
  $('#mediaStageNextBtn')?.addEventListener('click', () => load(index + 1));
  $('#mediaPlayBtn')?.addEventListener('click', togglePlay);
  $('#mediaStagePlayBtn')?.addEventListener('click', togglePlay);
  $('#mediaFavoriteBtn')?.addEventListener('click', async () => {
    const item = currentItem();
    if (!item) return;
    await window.soul?.recordMedia?.({ event: 'favorite', type: item.type, title: item.title, sourceUrl: item.sourceUrl });
    if ($('#mediaFavoriteBtn')) $('#mediaFavoriteBtn').textContent = '♥';
  });
  $('#mediaSimilarBtn')?.addEventListener('click', async () => {
    const item = currentItem();
    if (!item) return;
    const taste = await window.soul?.entertainment?.();
    const favorites = (taste?.topTitles || []).slice(0, 3).map(x => x.title).join(', ');
    window.eidovaraSend?.(`Find something similar to my favorite music: ${item.title}${favorites ? `, considering ${favorites}` : ''}`);
  });
  $('#mediaSpotifyBtn')?.addEventListener('click', () => handoff('spotify'));
  $('#mediaYouTubeBtn')?.addEventListener('click', () => handoff('youtube'));
  $('#mediaNetflixBtn')?.addEventListener('click', () => handoff('netflix'));
  $('#mediaStageSpotifyBtn')?.addEventListener('click', () => handoff('spotify'));
  $('#mediaStageYouTubeBtn')?.addEventListener('click', () => handoff('youtube'));
  $('#mediaSourceBtn')?.addEventListener('click', () => {
    const item = currentItem();
    if (item?.sourceUrl) window.soul?.openExternal?.(item.sourceUrl);
  });
  $('#mediaCloseBtn')?.addEventListener('click', dismiss);
  $('#mediaExpandBtn')?.addEventListener('click', expand);
  $('#mediaArtBtn')?.addEventListener('click', expand);
  $('#mediaTitle')?.addEventListener('click', expand);
  $('#mediaCollapseBtn')?.addEventListener('click', collapse);
  $('#mediaPopOutBtn')?.addEventListener('click', popOut);
  $('#mediaDockBtn')?.addEventListener('click', async () => {
    const payload = snapshot();
    currentPlayer()?.pause();
    await window.soul?.dockPlayer?.(payload);
  });
  $('#mediaLoopBtn')?.addEventListener('click', () => { loop = !loop; updateTransport(); });
  $('#mediaShuffleBtn')?.addEventListener('click', () => { shuffle = !shuffle; updateTransport(); });
  $('#mediaRate')?.addEventListener('change', e => applyRate(e.currentTarget.value));
  $('#mediaFullscreenBtn')?.addEventListener('click', () => {
    const video = $('#videoPlayer');
    if (currentItem()?.type !== 'video' || !video) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else video.requestFullscreen?.();
  });
  $('#mediaSeek')?.addEventListener('input', e => onSeekInput(e.currentTarget, true));
  $('#mediaSeek')?.addEventListener('change', e => onSeekInput(e.currentTarget, false));
  $('#mediaStageSeek')?.addEventListener('input', e => onSeekInput(e.currentTarget, true));
  $('#mediaStageSeek')?.addEventListener('change', e => onSeekInput(e.currentTarget, false));
  $('#mediaVolume')?.addEventListener('input', e => applyVolume(e.currentTarget.value));
  $('#mediaStageVolume')?.addEventListener('input', e => applyVolume(e.currentTarget.value));
  $('#mediaSurface')?.addEventListener('mousemove', showChrome);
  $('#mediaSurface')?.addEventListener('click', showChrome);
  bindPlayer($('#audioPlayer'));
  bindPlayer($('#videoPlayer'));
  applyVolume(readVolume());
  applyShell();
  updateTransport();
  if (reducedMotion()) $('#mediaSurface')?.classList.add('is-chrome-visible');

  document.addEventListener('keydown', e => {
    const ageGated = document.body.classList.contains('age-gated') || overlayOpen('#ageGateOverlay');
    const paletteOpen = overlayOpen('#commandPalette');
    const otherOverlay = overlayOpen('#shortcutSheet') || overlayOpen('#cheatsheetOverlay') || overlayOpen('#legalOverlay') || overlayOpen('#adminOverlay') || overlayOpen('#setupOverlay');
    if (e.key === 'Escape') {
      if (ageGated || paletteOpen || otherOverlay) return;
      if (expanded) {
        e.preventDefault();
        e.stopPropagation();
        collapse();
      }
      return;
    }
    if (ageGated || paletteOpen || otherOverlay) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key !== ' ' && e.code !== 'Space') return;
    if (inField(e.target)) return;
    if (!queue.length) return;
    e.preventDefault();
    togglePlay();
  }, true);

  window.soul?.onOnlineStopped?.(() => applyAdultLock());
  window.soul?.onFloatDocked?.(payload => dockFromMain(payload || {}));
  window.soul?.onFloatLoad?.(payload => {
    if (!floatMode || !payload?.item) return;
    queue = [payload.item];
    index = 0;
    loop = Boolean(payload.loop);
    shuffle = Boolean(payload.shuffle);
    applyRate(payload.rate || 1);
    load(0, payload.playing !== false);
    const player = currentPlayer();
    if (player && Number.isFinite(payload.currentTime)) player.currentTime = payload.currentTime;
  });

  window.eidovaraNowPlaying = {
    play,
    load,
    togglePlay,
    pause: () => currentPlayer()?.pause(),
    resume: () => currentPlayer()?.play()?.catch(() => {}),
    expand,
    collapse,
    dismiss,
    popOut,
    applyAdultLock,
    handleEnginePlayback,
    currentPlayer,
    currentItem,
    snapshot,
    isAllowedPlaybackUrl,
    officialSearchUrl
  };
})();
