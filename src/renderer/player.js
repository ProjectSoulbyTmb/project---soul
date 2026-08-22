// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
(function () {
  const $ = sel => document.querySelector(sel);
  const LOCAL = 'eidovara-media:';
  const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const SLEEP = [0, 15, 30, 45, 60, 90];
  let queue = [];
  let index = -1;
  let loop = 'off';
  let shuffle = false;
  let rate = 1;
  let sleepUntil = 0;
  let sleepTimer = 0;
  let poppedOut = false;
  let favorite = false;

  function t(key, fallback) {
    return window.t ? window.t(key, fallback) : fallback;
  }
  function adultMode() {
    const policy = window.eidovaraState?.policy || {};
    return policy.mode === 'adult' && policy.adultSoulEnabled === true && policy.adultStatusConfirmed === true && policy.currentConsent === true;
  }
  function ageGated() {
    return document.body.classList.contains('age-gated');
  }
  function hideFloat() {
    return ageGated() || adultMode();
  }
  function currentItem() {
    return queue[index] || null;
  }
  function currentPlayer() {
    return currentItem()?.type === 'video' ? $('#videoPlayer') : $('#audioPlayer');
  }
  function allowedUrl(value) {
    return Boolean(mediaHref(value));
  }
  function mediaHref(value) {
    const raw = String(value || '');
    if (!raw) return '';
    if (/youtube\.com\/embed|youtube-nocookie|spotify\.com\/embed|sdk\.scdn\.co|pornhub\.com\/embed|xvideos\.com\/embedframe|xhamster\.com\/xembed|redgifs\.com\/ifr|spankbang\.com\/embed|chaturbate\.com\/embed/i.test(raw)) return '';
    try {
      const url = new URL(raw);
      if (url.protocol === LOCAL) return url.href;
      if (url.protocol !== 'https:') return '';
      const host = url.hostname.toLowerCase();
      if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)spotify\.com$|(^|\.)pornhub\.com$|(^|\.)xvideos\.com$|(^|\.)xhamster\.com$|(^|\.)spankbang\.com$|(^|\.)redgifs\.com$|(^|\.)chaturbate\.com$|(^|\.)onlyfans\.com$|(^|\.)fansly\.com$/.test(host)) return '';
      return url.href;
    } catch {
      return '';
    }
  }
  function setPlayerSrc(player, value) {
    const href = mediaHref(value);
    if (!player || !href) return false;
    player.src = href;
    return true;
  }
  function qualityHref(item, id) {
    const choice = qualityChoices(item).find(entry => entry.id === String(id || ''));
    return choice ? mediaHref(choice.url) : '';
  }
  function qualityChoices(item) {
    const native = item?.url;
    const extra = (item?.renditions || []).filter(r => r?.url && r.url !== native && allowedUrl(r.url));
    if (!native || extra.length === 0) return [];
    return [{ id: 'native', label: 'Native', url: native }, ...extra.map((r, i) => ({ id: r.id || `r${i}`, label: r.label || 'Rendition', url: r.url }))];
  }
  function clock(seconds) {
    const n = Math.max(0, Number(seconds) || 0);
    return `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
  }
  function mediaSignal(event, item = currentItem()) {
    if (!item || !['audio', 'video'].includes(item.type)) return;
    window.soul.recordMedia({ event, type: item.type, title: item.title, sourceUrl: item.sourceUrl }).catch(() => {});
  }
  function setActive(on) {
    const root = $('#eidovaraPlayer') || $('#mediaDock');
    root?.classList.toggle('hidden', !on);
    root?.classList.toggle('is-active', on);
    document.body.classList.toggle('has-now-playing', on);
    if (!on) window.soul?.stayAwake?.({ on: false, reason: 'media' }).catch(() => {});
  }
  function mediaStayAwake() {
    const audio = $('#audioPlayer');
    const video = $('#videoPlayer');
    const playing = el => Boolean(el && el.src && !el.paused && !el.ended);
    window.soul?.stayAwake?.({ on: playing(audio) || playing(video), reason: 'media' }).catch(() => {});
  }
  function fillQuality(item) {
    const sel = $('#mediaQuality');
    const wrap = $('#mediaQualityWrap');
    if (!sel) return;
    const choices = qualityChoices(item);
    sel.textContent = '';
    if (!choices.length) {
      wrap?.classList.add('is-empty');
      return;
    }
    wrap?.classList.remove('is-empty');
    for (const choice of choices) {
      const opt = document.createElement('option');
      opt.value = choice.id;
      opt.textContent = choice.label;
      sel.append(opt);
    }
    const current = choices.find(entry => entry.url === item.url);
    sel.value = current?.id || choices[0].id;
  }
  function fillCaptions(item, player) {
    if (!player) return;
    [...player.querySelectorAll('track')].forEach(node => node.remove());
    for (const track of item?.captions || []) {
      const href = mediaHref(track.url);
      if (!href) continue;
      const node = document.createElement('track');
      node.kind = track.kind || 'subtitles';
      node.label = track.label || 'Captions';
      node.srclang = track.srclang || 'und';
      node.src = href;
      player.append(node);
    }
  }
  function bindMediaSession(item) {
    if (!('mediaSession' in navigator) || !item) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: item.title || 'Eidovara',
      artist: item.artist || 'Eidovara',
      album: item.local ? 'Local library' : 'Eidovara'
    });
    const action = (name, fn) => {
      try { navigator.mediaSession.setActionHandler(name, fn); } catch {}
    };
    action('play', () => currentPlayer()?.play().catch(() => {}));
    action('pause', () => currentPlayer()?.pause());
    action('previoustrack', () => loadMedia(index - 1));
    action('nexttrack', () => loadMedia(index + 1));
    action('stop', () => { currentPlayer()?.pause(); setActive(false); });
    action('seekto', details => {
      const player = currentPlayer();
      if (player && Number.isFinite(details?.seekTime)) player.currentTime = details.seekTime;
    });
  }
  function paint() {
    const item = currentItem();
    const player = currentPlayer();
    const root = $('#eidovaraPlayer');
    if (item) {
      if ($('#mediaTitle')) $('#mediaTitle').textContent = item.title || 'Untitled media';
      if ($('#mediaKind')) $('#mediaKind').textContent = `${item.local ? 'local ' : ''}${item.type} · ${index + 1} of ${queue.length}`;
      if ($('#npStageTitle')) $('#npStageTitle').textContent = item.title || 'Untitled media';
      if ($('#npStageKind')) $('#npStageKind').textContent = item.local ? 'Local file through eidovara-media' : (item.type || '');
      if ($('#mediaPlayBtn')) $('#mediaPlayBtn').textContent = player && !player.paused ? '❚❚' : '▶';
      if ($('#mediaLoopBtn')) $('#mediaLoopBtn').textContent = loop === 'one' ? '🔂' : loop === 'all' ? '🔁' : '🔁︎';
      if ($('#mediaShuffleBtn')) $('#mediaShuffleBtn').classList.toggle('is-on', shuffle);
      if ($('#mediaRate')) $('#mediaRate').value = String(rate);
      if ($('#mediaPopOutBtn')) $('#mediaPopOutBtn').classList.toggle('hidden', hideFloat());
      if ($('#mediaPipBtn')) $('#mediaPipBtn').classList.toggle('hidden', hideFloat() || item.type !== 'video');
      if ($('#mediaLyrics')) $('#mediaLyrics').textContent = 'No licensed lyrics in-app';
      document.body.classList.toggle('adult-mode', adultMode());
      root?.classList.toggle('is-expanded', root?.classList.contains('is-expanded'));
    }
    const seek = $('#mediaSeek');
    if (seek && player && Number.isFinite(player.duration)) {
      seek.max = String(player.duration || 0);
      seek.value = String(player.currentTime || 0);
      if ($('#mediaTime')) $('#mediaTime').textContent = `${clock(player.currentTime)} / ${clock(player.duration)}`;
    }
  }
  let feelCtx = null;
  let feelAnalyser = null;
  let feelRaf = 0;
  function attachFeel(player) {
    if (!adultMode() || !player) return;
    try {
      feelCtx = feelCtx || new AudioContext();
      if (feelCtx.state === 'suspended') feelCtx.resume?.();
      feelAnalyser = feelAnalyser || feelCtx.createAnalyser();
      feelAnalyser.fftSize = 256;
      if (!player._eidovaraFeel) {
        const source = feelCtx.createMediaElementSource(player);
        source.connect(feelAnalyser);
        feelAnalyser.connect(feelCtx.destination);
        player._eidovaraFeel = true;
      }
      cancelAnimationFrame(feelRaf);
      const tick = () => {
        if (!feelAnalyser || !adultMode()) return;
        const data = new Uint8Array(feelAnalyser.frequencyBinCount);
        feelAnalyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) sum += Math.abs(data[i] - 128);
        const level = Math.min(1, (sum / data.length) / 36);
        window.dispatchEvent(new CustomEvent('eidovara-feel-level', { detail: { level } }));
        feelRaf = requestAnimationFrame(tick);
      };
      feelRaf = requestAnimationFrame(tick);
    } catch {}
  }
  function loadMedia(nextIndex, autoplay = true) {
    if (!queue.length) return;
    const previous = currentItem();
    if (loop === 'one' && nextIndex === index && previous) {
      const player = currentPlayer();
      if (player) { player.currentTime = 0; player.play().catch(() => {}); }
      return;
    }
    if (previous && nextIndex !== index) mediaSignal('skip', previous);
    if (shuffle && queue.length > 1 && nextIndex !== index) {
      let pick = index;
      while (pick === index) pick = Math.floor(Math.random() * queue.length);
      index = pick;
    } else {
      index = ((nextIndex % queue.length) + queue.length) % queue.length;
    }
    const item = currentItem();
    if (!item || !allowedUrl(item.url)) return;
    const audio = $('#audioPlayer');
    const video = $('#videoPlayer');
    audio.pause();
    video.pause();
    audio.classList.toggle('hidden', item.type === 'video');
    video.classList.toggle('hidden', item.type !== 'video');
    const player = item.type === 'video' ? video : audio;
    const surface = $('#npSurface');
    surface?.setAttribute('data-kind', item.type);
    player.preload = 'auto';
    player.preservesPitch = true;
    if (!setPlayerSrc(player, item.url)) return;
    player.playbackRate = rate;
    fillCaptions(item, player);
    fillQuality(item);
    if ($('#mediaFavoriteBtn')) $('#mediaFavoriteBtn').textContent = '♡';
    if ($('#mediaSourceBtn')) $('#mediaSourceBtn').disabled = !item.sourceUrl;
    setActive(true);
    mediaSignal('play', item);
    window.eidovaraChrome?.recordMedia?.(item);
    bindMediaSession(item);
    paint();
    if (autoplay) player.play().catch(() => {});
    attachFeel(player);
    if (poppedOut && !hideFloat()) {
      window.soul.popOutPlayer?.({ kind: item.type, item, rate, adultMode: adultMode(), ageGated: ageGated() });
    } else if (hideFloat()) {
      window.soul.dockPlayer?.();
      poppedOut = false;
    }
  }
  function playMedia(items, at, opts = {}) {
    const mode = window.eidovaraState?.assistant?.capabilities?.mediaPlayback || 'confirm';
    if (mode === 'disabled') {
      alert(t('mediaDisabled', 'Media playback is disabled in Soul behavior settings.'));
      return;
    }
    const selected = items[at];
    if (mode === 'confirm' && !opts.alreadyConfirmed) {
      if (!window.confirm(`${t('mediaConfirm', 'Play this media in Eidovara:')} ${selected?.title || ''}`.trim())) return;
    }
    queue = (items || []).filter(m => (m.type === 'audio' || m.type === 'video') && allowedUrl(m.url));
    const start = Math.max(0, queue.indexOf(selected) === -1 ? 0 : queue.indexOf(selected));
    loadMedia(start);
  }
  function ended() {
    mediaSignal('complete');
    if (loop === 'one') {
      loadMedia(index);
      return;
    }
    const next = index + 1;
    if (next < queue.length || loop === 'all') loadMedia(next);
    else setActive(false);
  }
  function toggleExpand() {
    $('#eidovaraPlayer')?.classList.toggle('is-expanded');
    paint();
  }
  async function popOut() {
    if (hideFloat()) return;
    const item = currentItem();
    if (!item) return;
    poppedOut = true;
    await window.soul.popOutPlayer?.({ kind: item.type, item, rate, adultMode: adultMode(), ageGated: ageGated() });
    paint();
  }
  async function dock() {
    poppedOut = false;
    await window.soul.dockPlayer?.();
    paint();
  }
  async function pip() {
    if (hideFloat()) return;
    const video = $('#videoPlayer');
    if (!video || video.classList.contains('hidden') || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {}
  }
  function fullscreen() {
    const video = $('#videoPlayer');
    if (!video || video.classList.contains('hidden')) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else video.requestFullscreen?.();
  }
  async function pickOutput() {
    const player = currentPlayer();
    if (navigator.mediaDevices?.selectAudioOutput) {
      try {
        const device = await navigator.mediaDevices.selectAudioOutput();
        if (device?.deviceId && player?.setSinkId) await player.setSinkId(device.deviceId);
      } catch {}
      return;
    }
    if (player?.setSinkId && navigator.mediaDevices?.enumerateDevices) {
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'audiooutput');
      const sel = $('#mediaOutput');
      if (!sel || !devices.length) return;
      sel.textContent = '';
      for (const device of devices) {
        const opt = document.createElement('option');
        opt.value = device.deviceId;
        opt.textContent = device.label || 'Output';
        sel.append(opt);
      }
      sel.classList.remove('hidden');
    }
  }
  function armSleep(minutes) {
    clearTimeout(sleepTimer);
    const mins = Number(minutes) || 0;
    sleepUntil = mins ? Date.now() + mins * 60_000 : 0;
    if (!sleepUntil) return;
    sleepTimer = setTimeout(() => {
      currentPlayer()?.pause();
      sleepUntil = 0;
      paint();
    }, mins * 60_000);
  }

  window.eidovaraPlayer = {
    playMedia,
    loadMedia,
    currentPlayer,
    currentItem,
    queue: () => queue.slice()
  };
  window.eidovaraPlayMedia = playMedia;

  $('#mediaPrevBtn')?.addEventListener('click', () => loadMedia(index - 1));
  $('#mediaNextBtn')?.addEventListener('click', () => loadMedia(index + 1));
  $('#mediaPlayBtn')?.addEventListener('click', () => {
    const player = currentPlayer();
    if (!player) return;
    player.paused ? player.play().catch(() => {}) : player.pause();
    paint();
  });
  $('#mediaFavoriteBtn')?.addEventListener('click', async () => {
    const item = currentItem();
    if (!item) return;
    await window.soul.recordMedia({ event: 'favorite', type: item.type, title: item.title, sourceUrl: item.sourceUrl });
    $('#mediaFavoriteBtn').textContent = '♥';
  });
  $('#mediaSimilarBtn')?.addEventListener('click', async () => {
    const item = currentItem();
    if (!item || !window.eidovaraSend) return;
    const taste = await window.soul.entertainment();
    const favorites = taste.topTitles.slice(0, 3).map(x => x.title).join(', ');
    window.eidovaraSend(`Find something similar to my favorite music: ${item.title}${favorites ? `, considering ${favorites}` : ''}`);
  });
  $('#mediaSpotifyBtn')?.addEventListener('click', () => {
    const item = currentItem();
    if (item) window.soul.openExternal(`https://open.spotify.com/search/${encodeURIComponent(item.title)}`);
  });
  $('#mediaYouTubeBtn')?.addEventListener('click', () => {
    const item = currentItem();
    if (item) window.soul.openExternal(`https://www.youtube.com/results?search_query=${encodeURIComponent(item.title)}`);
  });
  $('#mediaArchiveBtn')?.addEventListener('click', () => {
    const item = currentItem();
    if (item) window.soul.openExternal(`https://archive.org/search?query=${encodeURIComponent(item.title)}`);
  });
  $('#mediaSourceBtn')?.addEventListener('click', () => {
    const item = currentItem();
    if (item?.sourceUrl) window.soul.openExternal(item.sourceUrl);
  });
  $('#mediaCloseBtn')?.addEventListener('click', () => {
    currentPlayer()?.pause();
    setActive(false);
    $('#eidovaraPlayer')?.classList.remove('is-expanded');
    dock();
  });
  $('#mediaExpandBtn')?.addEventListener('click', toggleExpand);
  $('#npArt')?.addEventListener('click', toggleExpand);
  $('#mediaNow')?.addEventListener('click', toggleExpand);
  $('#npCollapseBtn')?.addEventListener('click', () => $('#eidovaraPlayer')?.classList.remove('is-expanded'));
  $('#mediaPopOutBtn')?.addEventListener('click', popOut);
  $('#mediaDockBtn')?.addEventListener('click', dock);
  $('#mediaPipBtn')?.addEventListener('click', pip);
  $('#mediaFullBtn')?.addEventListener('click', fullscreen);
  $('#mediaLoopBtn')?.addEventListener('click', () => {
    loop = loop === 'off' ? 'one' : loop === 'one' ? 'all' : 'off';
    paint();
  });
  $('#mediaShuffleBtn')?.addEventListener('click', () => { shuffle = !shuffle; paint(); });
  $('#mediaRate')?.addEventListener('change', e => {
    rate = RATES.includes(Number(e.target.value)) ? Number(e.target.value) : 1;
    const player = currentPlayer();
    if (player) player.playbackRate = rate;
  });
  $('#mediaQuality')?.addEventListener('change', e => {
    const item = currentItem();
    const player = currentPlayer();
    const href = qualityHref(item, e.target.value);
    if (!item || !player || !href) return;
    const time = player.currentTime || 0;
    player.src = href;
    player.currentTime = time;
    player.play().catch(() => {});
  });
  $('#mediaOutputBtn')?.addEventListener('click', pickOutput);
  $('#mediaOutput')?.addEventListener('change', async e => {
    const player = currentPlayer();
    if (player?.setSinkId) await player.setSinkId(e.target.value).catch(() => {});
  });
  $('#mediaSeek')?.addEventListener('input', e => {
    const player = currentPlayer();
    if (player) player.currentTime = Number(e.target.value) || 0;
  });
  $('#mediaVolume')?.addEventListener('input', e => {
    const value = Math.max(0, Math.min(1, Number(e.target.value) || 0));
    const audio = $('#audioPlayer');
    const video = $('#videoPlayer');
    if (audio) audio.volume = value;
    if (video) video.volume = value;
  });
  $('#audioPlayer')?.addEventListener('ended', ended);
  $('#videoPlayer')?.addEventListener('ended', ended);
  $('#audioPlayer')?.addEventListener('timeupdate', paint);
  $('#videoPlayer')?.addEventListener('timeupdate', paint);
  $('#audioPlayer')?.addEventListener('play', () => { paint(); mediaStayAwake(); });
  $('#videoPlayer')?.addEventListener('play', () => { paint(); mediaStayAwake(); });
  $('#audioPlayer')?.addEventListener('pause', () => { paint(); mediaStayAwake(); });
  $('#videoPlayer')?.addEventListener('pause', () => { paint(); mediaStayAwake(); });
  window.soul?.onPlayerDocked?.(() => { poppedOut = false; paint(); });
  window.soul?.onPlayerCommand?.(command => {
    if (command === 'previous') loadMedia(index - 1);
    if (command === 'next') loadMedia(index + 1);
  });
  window.addEventListener('keydown', e => {
    if (ageGated()) return;
    if (e.key === 'Escape' && $('#eidovaraPlayer')?.classList.contains('is-expanded')) {
      $('#eidovaraPlayer').classList.remove('is-expanded');
      return;
    }
    if (e.code !== 'Space' && e.key !== ' ') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = String(e.target?.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;
    if (!currentItem()) return;
    e.preventDefault();
    const player = currentPlayer();
    if (!player) return;
    player.paused ? player.play().catch(() => {}) : player.pause();
    paint();
  });
})();

