// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Pomodoro Timer Plugin — Main Entry Point
 * Pomodoro timer with ambient sounds, session tracking, and break reminders
 */

const PLUGIN_ID = 'com.soul.pomodoro';
const STORAGE_KEY = 'plugin_pomodoro_state';

const DEFAULTS = {
  focusDurationMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  soundEnabled: true,
  ambientVolumePct: 30,
};

let settings = { ...DEFAULTS };
let state = {
  phase: 'idle',
  sessionCount: 0,
  startedAt: null,
  endsAt: null,
  pausedRemainingMs: null,
  timer: null,
  todayStats: { focusSessions: 0, totalMinutes: 0, date: new Date().toDateString() },
};

let initialized = false;

// ---------------------------------------------------------------------------
// Public API (also referenced by internal helpers via `api` below)
// ---------------------------------------------------------------------------
const api = {
  name: 'Pomodoro Timer',
  version: '1.0.0',

  async init() {
    if (initialized) return;
    console.log(`[${PLUGIN_ID}] Initializing…`);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        settings = { ...settings, ...parsed.settings };
        if (parsed.todayStats?.date === new Date().toDateString()) {
          state.todayStats = parsed.todayStats;
          state.sessionCount = parsed.sessionCount || state.todayStats.focusSessions;
        }
      }
    } catch {
      /* private mode */
    }
    rollDay();
    initialized = true;
    console.log(`[${PLUGIN_ID}] Initialized`);
  },

  async cleanup() {
    stopTimer();
    persistState();
    initialized = false;
    console.log(`[${PLUGIN_ID}] Cleaned up`);
  },

  async start(duration, type = 'focus', ambient = 'none') {
    if (state.phase !== 'idle') {
      throw new Error(`A pomodoro is already running (${state.phase}). Stop it first.`);
    }
    const minutes = duration || resolveDuration(type);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 60) {
      throw new Error('Duration must be between 1 and 60 minutes.');
    }
    state.phase = type === 'custom' ? 'focus' : type;
    state.startedAt = Date.now();
    state.endsAt = Date.now() + minutes * 60_000;
    startTimer();
    emitHook('pomodoro.session.started', { phase: state.phase, minutes });
    return {
      started: true,
      phase: state.phase,
      minutes,
      endsAt: new Date(state.endsAt).toISOString(),
    };
  },

  async pause() {
    requireRunning();
    const remaining = Math.max(0, state.endsAt - Date.now());
    stopTimer();
    state.pausedRemainingMs = remaining;
    emitHook('pomodoro.session.paused', { remainingMs: remaining });
    return { paused: true, remainingMs: remaining };
  },

  async resume() {
    if (state.pausedRemainingMs == null) throw new Error('No paused pomodoro to resume.');
    state.endsAt = Date.now() + state.pausedRemainingMs;
    state.pausedRemainingMs = null;
    startTimer();
    emitHook('pomodoro.session.resumed', {});
    return { resumed: true, endsAt: new Date(state.endsAt).toISOString() };
  },

  async stop() {
    requireRunning();
    const wasPhase = state.phase;
    resetSession();
    emitHook('pomodoro.session.stopped', { phase: wasPhase });
    return { stopped: true };
  },

  async status() {
    return {
      phase: state.phase,
      running: state.phase !== 'idle',
      paused: state.pausedRemainingMs != null,
      remainingMs:
        state.pausedRemainingMs != null
          ? state.pausedRemainingMs
          : state.endsAt
            ? Math.max(0, state.endsAt - Date.now())
            : 0,
      sessionCount: state.sessionCount,
      today: getTodayStats(),
    };
  },

  async updateSettings(newSettings = {}) {
    Object.assign(settings, newSettings);
    persistState();
    return { ...settings };
  },

  async stats() {
    return getTodayStats();
  },

  async resetStats(confirm = false) {
    if (!confirm) throw new Error('Pass confirm=true to reset statistics.');
    state.sessionCount = 0;
    state.todayStats = { focusSessions: 0, totalMinutes: 0, date: new Date().toDateString() };
    persistState();
    return { ...state.todayStats };
  },
};

export default api;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveDuration(type) {
  switch (type) {
    case 'short-break':
      return settings.shortBreakMin;
    case 'long-break':
      return settings.longBreakMin;
    default:
      return settings.focusDurationMin;
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
  if (!state.endsAt) return;
  if (Date.now() >= state.endsAt) await completePhase();
}

async function completePhase() {
  const completedPhase = state.phase;
  stopTimer();

  if (completedPhase === 'focus') {
    state.sessionCount++;
    state.todayStats.focusSessions++;
    state.todayStats.totalMinutes += settings.focusDurationMin;
    emitHook('pomodoro.session.completed', { sessionsToday: state.todayStats.focusSessions });

    const isLongBreakDue = state.sessionCount % settings.sessionsUntilLongBreak === 0;
    notify(
      isLongBreakDue ? 'Long break time!' : 'Short break time!',
      `You completed ${state.sessionCount} focus session(s) today.`
    );
    if (isLongBreakDue) emitHook('pomodoro.long-break.due', {});

    if (settings.autoStartBreaks) {
      await api.start(null, isLongBreakDue ? 'long-break' : 'short-break');
    } else {
      resetSession();
    }
  } else {
    notify('Break over', 'Time for another focus session.');
    emitHook('pomodoro.break.completed', {});
    if (settings.autoStartFocus) {
      await api.start(null, 'focus');
    } else {
      resetSession();
    }
  }
  persistState();
}

function resetSession() {
  state.phase = 'idle';
  state.startedAt = null;
  state.endsAt = null;
  state.pausedRemainingMs = null;
  stopTimer();
}

function requireRunning() {
  if (state.phase === 'idle') throw new Error('No pomodoro is currently running.');
}

function rollDay() {
  const today = new Date().toDateString();
  if (state.todayStats.date !== today) {
    state.todayStats = { focusSessions: 0, totalMinutes: 0, date: today };
    persistState();
  }
}

function getTodayStats() {
  rollDay();
  return {
    ...state.todayStats,
    currentStreak: state.sessionCount,
    nextLongBreakIn:
      settings.sessionsUntilLongBreak - (state.sessionCount % settings.sessionsUntilLongBreak),
  };
}

function persistState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings,
        todayStats: state.todayStats,
        sessionCount: state.sessionCount,
      })
    );
  } catch {
    /* private mode */
  }
}

function notify(title, body) {
  if (!settings.soundEnabled) return;
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`Pomodoro · ${title}`, { body });
    }
  } catch {
    /* notifications unavailable */
  }
}

function emitHook(event, data) {
  try {
    globalThis.dispatchEvent?.(new CustomEvent(event, { detail: data }));
  } catch {
    /* no DOM available */
  }
}
