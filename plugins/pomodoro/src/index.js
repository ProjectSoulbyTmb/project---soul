// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Pomodoro Timer Plugin — Main Entry Point
 */

const STORAGE_KEY = 'plugin_pomodoro_state';

const DEFAULTS = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: true,
  soundEnabled: true,
};

let settings = { ...DEFAULTS };
let state = {
  phase: 'idle',
  sessionCount: 0,
  endsAt: null,
  pausedRemainingMs: null,
  timer: null,
  todayStats: { focusSessions: 0, totalMinutes: 0, date: new Date().toDateString() },
};

const api = {
  name: 'Pomodoro Timer',
  version: '1.0.0',

  async init() {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const d = JSON.parse(s);
        settings = { ...settings, ...d.settings };
        if (d.todayStats?.date === new Date().toDateString()) state.todayStats = d.todayStats;
      }
    } catch {}
    console.log('[Pomodoro] Initialized');
  },

  async cleanup() {
    stopTimer();
    persist();
  },

  async start(duration, type = 'focus') {
    if (state.phase !== 'idle') throw new Error(`Already running (${state.phase}).`);
    const min = duration || resolveDuration(type);
    if (min < 1 || min > 60) throw new Error('Duration must be 1–60 minutes.');
    state.phase = type;
    state.endsAt = Date.now() + min * 60_000;
    startTimer();
    return { started: true, phase: type, minutes: min };
  },

  async pause() {
    requireRunning();
    state.pausedRemainingMs = Math.max(0, state.endsAt - Date.now());
    stopTimer();
    return { paused: true };
  },

  async resume() {
    if (state.pausedRemainingMs == null) throw new Error('Nothing to resume.');
    state.endsAt = Date.now() + state.pausedRemainingMs;
    state.pausedRemainingMs = null;
    startTimer();
    return { resumed: true };
  },

  async stop() {
    requireRunning();
    resetSession();
    return { stopped: true };
  },

  async status() {
    return {
      phase: state.phase,
      remainingMs:
        state.pausedRemainingMs ?? (state.endsAt ? Math.max(0, state.endsAt - Date.now()) : 0),
      sessionCount: state.sessionCount,
      today: getTodayStats(),
    };
  },

  async updateSettings(s = {}) {
    Object.assign(settings, s);
    persist();
    return settings;
  },
  async stats() {
    return getTodayStats();
  },
  async resetStats(confirm) {
    if (!confirm) throw new Error('Pass confirm=true.');
    state.sessionCount = 0;
    state.todayStats = { focusSessions: 0, totalMinutes: 0, date: new Date().toDateString() };
    persist();
    return state.todayStats;
  },
  async onSessionCompleted(_data) {}
};

export default api;

function resolveDuration(type) {
  switch (type) {
    case 'short-break':
      return settings.shortBreakMin;
    case 'long-break':
      return settings.longBreakMin;
    default:
      return settings.focusMin;
  }
}

function startTimer() {
  stopTimer();
  state.timer = setInterval(() => void tick(), 1000);
}

function stopTimer() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
}

async function tick() {
  if (!state.endsAt || Date.now() < state.endsAt) return;
  await completePhase();
}

async function completePhase() {
  const wasPhase = state.phase;
  stopTimer();

  if (wasPhase === 'focus') {
    state.sessionCount++;
    state.todayStats.focusSessions++;
    state.todayStats.totalMinutes += settings.focusMin;

    const longDue = state.sessionCount % settings.sessionsUntilLongBreak === 0;
    notify(longDue ? 'Long break!' : 'Short break!', `${state.sessionCount} session(s) done.`);
    try {
      dispatchEvent(
        new CustomEvent('pomodoro.session.completed', {
          detail: { sessionsToday: state.todayStats.focusSessions },
        })
      );
    } catch {}

    if (settings.autoStartBreaks) await api.start(null, longDue ? 'long-break' : 'short-break');
    else resetSession();
  } else {
    notify('Break over', 'Back to focus.');
    if (settings.autoStartBreaks) await api.start(null, 'focus');
    else resetSession();
  }
  persist();
}

function resetSession() {
  state.phase = 'idle';
  state.endsAt = null;
  state.pausedRemainingMs = null;
  stopTimer();
}
function requireRunning() {
  if (state.phase === 'idle') throw new Error('No pomodoro running.');
}

function getTodayStats() {
  const today = new Date().toDateString();
  if (state.todayStats.date !== today)
    state.todayStats = { focusSessions: 0, totalMinutes: 0, date: today };
  return { ...state.todayStats, streak: state.sessionCount };
}

function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ settings, todayStats: state.todayStats, sessionCount: state.sessionCount })
    );
  } catch {}
}

function notify(title, body) {
  if (!settings.soundEnabled) return;
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted')
      new Notification(`Pomodoro · ${title}`, { body });
  } catch {}
}
