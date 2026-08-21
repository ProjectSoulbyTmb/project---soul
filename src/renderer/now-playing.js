// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
(() => {
  const $ = s => document.querySelector(s);
  const t = (key, fallback) => window.eidovaraI18n?.t(key, fallback) || fallback || key;
  const VOLUME_KEY = 'eidovara.player.volume';
  const LOCAL_MEDIA_SCHEME = 'eidovara-media';
  const BLOCKED_EMBED = /youtube\.com\/embed|youtube-nocookie|\/\/youtu\.be\/|spotify\.com\/embed|open\.spotify\.com\/embed|sdk\.scdn\.co|spotify-web-playback|iframe_api|www\.youtube\.com\/iframe_api/i;
  const BLOCKED_HOST_SUFFIXES = ['.youtube.com', '.youtu.be', '.youtube-nocookie.com', '.googlevideo.com', '.spotify.com', '.spotifycdn.com', '.scdn.co'];

  let queue = [];
  let index = -1;
  let expanded = false;
  let chromeTimer = 0;
  let lastFocus = null;

  function reducedMotion() {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  }

  function hostnameOf(value) {
    try { return new URL(String(value || '')).hostname.toLowerCase(); } catch { return ''; }
  }

  function isBlockedEmbedUrl(value) {
    const raw = String(value || '');
    if (!raw) return false;
    if (BLOCKED_EMBED.test(raw)) return true;
    const host = hostnameOf(raw);
    if (!host) return false;
    return BLOCKED_HOST_SUFFIXES.some(suffix => host === suffix.slice(1) || host.endsWith(suffix));
  }

  function isAllowedPlaybackUrl(value) {
    let parsed;
    try { parsed = new URL(String(value || '')); } catch { return false; }
    if (parsed.protocol === `${LOCAL_MEDIA_SCHEME}:`) return true;
    if (parsed.protocol !== 'https:') return false;
    if (isBlockedEmbedUrl(parsed.href)) return false;
    return true;
  }

  function officialSearchUrl(platform, query) {
    const q = encodeURIComponent(String(query || '').trim().slice(0, 200));
    if (!q) return '';
    if (platform === 'spotify') return `https://open.spotify.com/search/${q}`;
    if (platform === 'youtube') return `https://www.youtube.com/results?search_query=${q}`;
    return '';
  }

  function overlayOpen(id) {
    const n = $(id);
    return n && !n.classList.contains('hidden');
  }

  function inField(target) {
    return Boolean(target?.closest?.('input, textarea, select, button, a, [role="button"], [contenteditable="true"]'));
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
    if (item.local) return item.type === 'video' ? t('playerLocalVideo', 'Local video') : t('playerLocalFile', 'Local file');
    try {
      const host = new URL(item.sourceUrl || item.url).hostname;
      if (host) return host;
    } catch {}
    return item.type === 'video' ? t('playerVideo', 'Video') : t('playerAudio', 'Audio');
  }

  function snapshot() {
    const player = currentPlayer();
    return {
      active: queue.length > 0 && index >= 0,
      expanded,
      playing: Boolean(player && !player.paused && !player.ended),
      reducedMotion: reducedMotion(),
      queue: queue.slice(),
      index,
      item: currentItem(),
      volume: Number($('#mediaVolume')?.value || 1)
    };
  }

  function emit() {
    window.dispatchEvent(new CustomEvent('eidovara:now-playing', { detail: snapshot() }));
  }

  function applyShell() {
    const root = $('#mediaDock');
    if (!root) return;
    const active = queue.length > 0 && index >= 0;
    root.classList.toggle('is-idle', !active);
    root.classList.toggle('is-active', active);
    root.classList.toggle('is-expanded', expanded && active);
    root.dataset.expanded = String(expanded && active);
    root.setAttribute('aria-hidden', active ? 'false' : 'true');
    document.body.classList.toggle('has-now-playing', active);
    const stage = $('#nowPlayingStage');
    if (stage) {
      stage.setAttribute('aria-hidden', expanded && active ? 'false' : 'true');
      if (expanded && active) stage.removeAttribute('inert');
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
    const recents = $('#mediaRecents');
    if (recents) {
      const recent = (window.eidovaraState?.entertainment?.history || []).slice(-8).reverse();
      recents.textContent = '';
      if (!recent.length) {
        recents.textContent = t('emptyRecent', 'Play, skip, and complete events will appear here. Local file paths are not stored in taste records.');
      } else {
        recents.textContent = recent.map(item => item.title).filter(Boolean).join(' · ');
      }
    }
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

  function mediaSignal(event, item = currentItem()) {
    if (!item || !['audio', 'video'].includes(item.type)) return;
    window.soul?.recordMedia?.({ event, type: item.type, title: item.title, sourceUrl: item.sourceUrl }).catch(() => {});
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
    const wrapped = ((nextIndex % queue.length) + queue.length) % queue.length;
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
      alert(t('playerBlockedSrc', 'That source cannot play in Eidovara. Use a local file or a public HTTPS source. Spotify and YouTube stay browser searches.'));
      return;
    }
    applyVolume(readVolume());
    if ($('#mediaFavoriteBtn')) $('#mediaFavoriteBtn').textContent = '♡';
    expanded = expanded || item.type === 'video';
    applyShell();
    updateTransport();
    mediaSignal('play', item);
    if (autoplay) player.play().catch(() => {});
    emit();
  }

  function play(items, startIndex = 0, opts = {}) {
    const mode = window.eidovaraState?.assistant?.capabilities?.mediaPlayback || 'confirm';
    if (mode === 'disabled') {
      alert(t('mediaDisabled', 'Media playback is disabled in Soul behavior settings.'));
      return;
    }
    const list = (Array.isArray(items) ? items : []).filter(m => m && (m.type === 'audio' || m.type === 'video') && isAllowedPlaybackUrl(m.url));
    const selected = items?.[startIndex];
    if (!list.length) {
      alert(t('playerBlockedSrc', 'That source cannot play in Eidovara. Use a local file or a public HTTPS source. Spotify and YouTube stay browser searches.'));
      return;
    }
    if (mode === 'confirm' && !opts.alreadyConfirmed) {
      if (!window.confirm(`${t('mediaConfirm', 'Play this media in Eidovara:')} ${selected?.title || ''}`.trim())) return;
    }
    if (opts.append && queue.length) {
      const offset = queue.length;
      const addedAt = Math.max(0, list.indexOf(selected));
      queue = [...queue, ...list];
      load(offset + addedAt, true);
      return;
    }
    queue = list;
    const idx = Math.max(0, list.indexOf(selected));
    load(Number.isFinite(idx) && idx >= 0 ? idx : 0, true);
  }

  function togglePlay() {
    const player = currentPlayer();
    if (!player) return;
    if (player.paused) player.play().catch(() => {});
    else player.pause();
  }

  function focusables() {
    const stage = $('#nowPlayingStage');
    if (!stage) return [];
    return [...stage.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])')]
      .filter(el => !el.disabled && el.getAttribute('aria-hidden') !== 'true');
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
    applyShell();
    updateTransport();
    emit();
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
    const next = index + 1;
    if (next >= queue.length) {
      index = queue.length - 1;
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
    if (!window.confirm(t('playerHandoffConfirm', 'Opens in the browser. Eidovara does not play Spotify or YouTube in-app.'))) return;
    window.soul?.openExternal?.(url);
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
    if (e.key === 'Tab' && expanded) {
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
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

  window.addEventListener('eidovara:locale', () => {
    updateTransport();
    if ($('#mediaCollapseBtn')) $('#mediaCollapseBtn').textContent = t('playerCollapse', 'Collapse player');
    if ($('#mediaExpandBtn')) $('#mediaExpandBtn').setAttribute('aria-label', t('playerExpand', 'Expand player'));
    if ($('#mediaLyrics')) $('#mediaLyrics').textContent = t('playerLyrics', 'No licensed lyrics in-app');
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
    currentPlayer,
    snapshot,
    isAllowedPlaybackUrl,
    officialSearchUrl
  };
})();
