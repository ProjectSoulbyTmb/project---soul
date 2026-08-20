export function applyPolicyCommand(state, text) {
  const t = text.toLowerCase();
  const now = new Date().toISOString();
  const events = [];

  if (/(adult status confirmed|i am an adult|i'm an adult|confirm adult)/.test(t)) {
    state.policy.adultStatusConfirmed = true;
    events.push(['policy.adult_status_confirmed', {}]);
  }
  if (/(enable adult soul|adult mode on|switch to adult soul)/.test(t)) {
    if (state.policy.adultStatusConfirmed) {
      state.policy.adultSoulEnabled = true;
      state.policy.mode = 'adult';
      events.push(['policy.adult_enabled', {}]);
    } else {
      events.push(['policy.adult_enable_blocked', { reason: 'adult status not confirmed' }]);
    }
  }
  if (/(standard mode|disable adult soul|adult mode off|switch to standard)/.test(t)) {
    state.policy.mode = 'standard';
    state.policy.adultSoulEnabled = false;
    state.policy.currentConsent = false;
    state.policy.consentScope = null;
    events.push(['policy.standard_enabled', {}]);
  }
  if (/(i consent|consent granted|grant consent)/.test(t)) {
    if (state.policy.mode === 'adult' && state.policy.adultSoulEnabled && state.policy.adultStatusConfirmed) {
      state.policy.currentConsent = true;
      state.policy.revokedAt = null;
      state.policy.consentScope = 'current-interaction';
      events.push(['policy.consent_granted', { scope: 'current-interaction' }]);
    } else {
      events.push(['policy.consent_blocked', { reason: 'adult gate incomplete' }]);
    }
  }
  if (/(revoke consent|stop adult|no consent|withdraw consent|stop now)/.test(t)) {
    state.policy.currentConsent = false;
    state.policy.revokedAt = now;
    state.policy.consentScope = null;
    events.push(['policy.consent_revoked', {}]);
  }
  if (/boundary:|new boundary:/.test(t)) {
    const boundary = text.split(':').slice(1).join(':').trim();
    if (boundary) {
      state.policy.boundaries.push({ id: `b_${Date.now()}`, content: boundary, createdAt: now, active: true });
      events.push(['policy.boundary_added', { boundary }]);
    }
  }

  for (const [type, details] of events) state.audit.push({ at: now, type, details });
  return events;
}

export function adultAllowed(state) {
  return state.policy.mode === 'adult' && state.policy.adultSoulEnabled && state.policy.adultStatusConfirmed && state.policy.currentConsent;
}

export function assessRequestSafety(state, text) {
  const t = String(text || '').toLowerCase();
  const operational = /\b(how (?:do|can|to)|instructions?|steps?|help me|teach me|build|make|create|hide|evade|bypass)\b/.test(t);
  if (!operational) return null;
  const categories = [
    ['child-sexual-exploitation', /\b(?:child|minor|underage).{0,40}(?:sexual|nude|explicit|pornographic)\b|\bcsam\b/],
    ['violent-harm', /\b(?:kill|murder|assassinate|poison|bomb).{0,60}(?:person|people|someone|target|victim)\b/],
    ['fraud-or-theft', /\b(?:steal|fraud|scam|identity theft|credit card theft|launder money)\b/],
    ['unauthorized-access', /\b(?:hack|malware|ransomware|credential theft|steal passwords?|bypass authentication)\b/],
    ['human-trafficking', /\b(?:traffic|sell|transport).{0,35}(?:person|people|minor|victim)\b/]
  ];
  const match = categories.find(([, pattern]) => pattern.test(t));
  if (!match) return null;
  const now = new Date().toISOString();
  const report = { id: `safety_${Date.now()}`, at: now, category: match[0], action: 'blocked-and-recorded-locally', excerpt: String(text).slice(0, 240) };
  state.policy.localSafetyReports.push(report);
  if (state.policy.localSafetyReports.length > 500) state.policy.localSafetyReports = state.policy.localSafetyReports.slice(-500);
  state.audit.push({ at: now, type: 'safety.request_blocked', details: { id: report.id, category: report.category } });
  return report;
}
