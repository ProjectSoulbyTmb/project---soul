const LOCAL_WORKSPACE_INTENTS = new Set([
  'identity', 'hello', 'memory', 'remember', 'focus', 'gaming', 'study', 'create',
  'mood', 'favorites', 'watch', 'gaming-ost', 'study-ost', 'surprise', 'talk',
  'reassure', 'growth', 'thanks', 'apps', 'settings', 'help', 'accessibility',
  'presence', 'identity-panel'
]);

export { LOCAL_WORKSPACE_INTENTS };

export const MEDIA_DISCOVERY_INTENTS = new Set(['mood', 'favorites', 'watch', 'gaming-ost', 'study-ost', 'surprise']);

export function isExplicitInternetRequest(input) {
  const text = String(input || '');
  if (!text.trim()) return false;
  return (
    /\b(?:search|look\s*up|research)\b[\s\S]{0,160}\b(?:the\s+)?(?:internet|web|online)\b/i.test(text)
    || /\b(?:internet|web|online)\s+(?:search|research)\b/i.test(text)
    || /\b(?:from|on)\s+(?:the\s+)?(?:internet|web|online)\b/i.test(text)
    || /\bsearch the (?:internet|web)\b/i.test(text)
  );
}

export function isMediaDiscoveryRequest(input) {
  const text = String(input || '');
  if (!text.trim()) return false;
  if (MEDIA_DISCOVERY_INTENTS.has(classifyWorkspaceIntent(text))) return true;
  return (
    /\b(?:youtube|spotify|internet\s+archive|archive\.org)\b/i.test(text)
    || /\b(?:play|find|search|look\s*up|show|queue|listen)\b[\s\S]{0,100}\b(?:music|songs?|track|tracks|video|videos?|soundtrack|audio|mix)\b/i.test(text)
  );
}

export function classifyWorkspaceIntent(input) {
  const t = String(input || '').toLowerCase();
  if (/\b(who are you|what are you|tell me who you are)\b/.test(t)) return 'identity';
  if (/^(hi|hello|hey)\b/.test(t)) return 'hello';
  if (/\b(review what you remember|what do you remember|what do you know about me|suggest useful updates)\b/.test(t)) return 'memory';
  if (/\b(focused session|current priority|focus session|plan a focused)\b/.test(t)) return 'focus';
  if (/\bgaming soundtrack\b/.test(t)) return 'gaming-ost';
  if (/\b(study soundtrack|calm study soundtrack)\b/.test(t)) return 'study-ost';
  if (/\b(gaming or streaming|streaming setup|gaming setup|prepare my gaming|stream helper|\bobs\b)\b/.test(t)) return 'gaming';
  if (/\b(study plan|quiz me|create a study)\b/.test(t)) return 'study';
  if (/\b(creative project|start a creative)\b/.test(t)) return 'create';
  if (isExplicitInternetRequest(t)) return 'research';
  if (/\b(fits my current mood|mood mix|mood and explain|current mood)\b/.test(t)) return 'mood';
  if (/\b(similar to|favorite music)\b/.test(t)) return 'favorites';
  if (/\b(video worth watching|watch something)\b/.test(t)) return 'watch';
  if (/\b(surprise me|public media)\b/.test(t)) return 'surprise';
  if (/\b(linked apps?|discover (installed )?apps|add (an? )?(trusted )?(app|application)|start menu|windows (?:app|shortcut|\.exe|\.lnk))\b/.test(t)) return 'apps';
  if (/\b(open|show|go\s+to|take\s+me\s+to)\b[\s\S]{0,40}\b(?:identity|consent|adult\s+mode)\b/.test(t)) return 'identity-panel';
  if (/\b(open|show|go\s+to|take\s+me\s+to)\b[\s\S]{0,40}\bsettings\b/.test(t)) return 'settings';
  if (/\b(change|switch)\b[\s\S]{0,24}\b(?:presence|look|avatar|companion)\b/.test(t)) return 'presence';
  if (/\b(what can you do|how do i use (?:this|eidovara)|workspace (?:helper|companion|kernel))\b/.test(t)) return 'help';
  if (/\b(accessibility|reduced motion|keyboard-first|screen reader)\b/.test(t)) return 'accessibility';
  if (/\b(talk something through|talk through|think (this|it) through)\b/.test(t)) return 'talk';
  if (/\b(reassurance|reassure|comfort|overwhelmed|anxious|pressure|struggling)\b/.test(t)) return 'reassure';
  if (/\b(growth|wisdom|clarity|patience|rest|reflection)\b/.test(t)) return 'growth';
  if (/^(thanks?|thank you)\b/.test(t)) return 'thanks';
  if (/^(remember:|remember that)\b/.test(t)) return 'remember';
  if (/\b(remember|memory)\b/.test(t)) return 'memory';
  return 'general';
}

export function isLocalWorkspaceIntent(input) {
  const intent = classifyWorkspaceIntent(input);
  return intent !== 'research' && LOCAL_WORKSPACE_INTENTS.has(intent);
}

export const detectOfflineIntent = classifyWorkspaceIntent;
