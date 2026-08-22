// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Adult Soul entertainment surface â€” theater chrome the user did not have to name.
 *
 * Local-only show layer around the first-party figure: atmosphere rooms, wardrobe
 * cards, adult fantasy frameworks, sexy styles, a panic/boss blank, reaction
 * sampler, show packs, metronome HUD, lookbook polaroids, and afterglow.
 * Not VRM, not a real performer, not a streamed person. Appearance stays locked
 * adult (21+). Backtick blanks the stage. Red / safeword stops the session.
 */

export const SEX_OPTIONS = Object.freeze([
  { id: 'feminine', title: 'Female', hint: 'Adult feminine body sliders' },
  { id: 'masculine', title: 'Male', hint: 'Adult masculine body sliders' },
  { id: 'androgynous', title: 'Androgynous', hint: 'Adult mixed presentation' }
]);

export const FANTASY_FRAMEWORKS = Object.freeze([
  { id: 'human', title: 'Human adult', hint: 'No fantasy add-ons. Still a lathe mesh.' },
  { id: 'high-elf', title: 'High elf (adult)', hint: 'Pointed ears, longer limbs. Locked 21+ â€” not a childlike elf.' },
  { id: 'succubus', title: 'Succubus aesthetic', hint: 'Horn nubs + extra sheen. Costume, not a claimed entity.' },
  { id: 'vampire', title: 'Vampire look', hint: 'Paler skin, cooler rim. Adult costume.' },
  { id: 'kitsune', title: 'Kitsune (adult)', hint: 'Tail mass at the hips. Folklore costume, adult only.' },
  { id: 'orc', title: 'Orc adult', hint: 'Broader jaw/shoulders. Adult body, not a cartoon kid.' },
  { id: 'fallen', title: 'Fallen aesthetic', hint: 'Darker rim light, wing-hint silhouette.' },
  { id: 'mer', title: 'Mer taper', hint: 'Lower-body taper. Adult figure, not a child mermaid.' },
  { id: 'dragonkin', title: 'Dragonkin', hint: 'Scale sheen + horn nubs. Adult costume.' },
  { id: 'fae-court', title: 'Fae court (adult)', hint: 'Adult court fashion only â€” not a child fairy.' }
]);

export const SEXY_STYLES = Object.freeze([
  { id: 'natural', title: 'Natural', hint: 'Barely styled. Breath and skin.' },
  { id: 'glamour', title: 'Glamour', hint: 'Makeup, sheen, slow present.' },
  { id: 'brat', title: 'Brat', hint: 'Playful tease, faster talk.' },
  { id: 'jock', title: 'Jock', hint: 'Masculine athletic cut, direct.' },
  { id: 'succubus-glam', title: 'Succubus glam', hint: 'High heat, extra oil, filthy optional.' },
  { id: 'femme-fatale', title: 'Femme fatale', hint: 'Slow, eye-lock, low voice.' },
  { id: 'gentle-dom', title: 'Gentle dominant', hint: 'Orders with aftercare on the same stage.' },
  { id: 'pillow', title: 'Pillow', hint: 'Soft, close, almost aftercare.' },
  { id: 'latex-look', title: 'Latex look', hint: 'High sheen, tight clothing tint.' },
  { id: 'athletic-cut', title: 'Athletic cut', hint: 'Low body fat sliders, sport lighting.' },
  { id: 'exhibitionist', title: 'Exhibitionist', hint: 'Bare, bright, cam framing.' },
  { id: 'voyeur-cam', title: 'Voyeur cam', hint: 'You watch. Figure performs. Still a mesh.' },
  { id: 'goth-glam', title: 'Goth glam', hint: 'Dark lids, cool rim, slow sway.' },
  { id: 'sun-kissed', title: 'Sun-kissed', hint: 'Tan, outdoor-warm gels.' },
  { id: 'wet-look-style', title: 'Wet look', hint: 'Oil + sheen as if just out of steam.' },
  { id: 'service-top', title: 'Service top', hint: 'Gives the orders you asked for. Software.' },
  { id: 'rigger', title: 'Harness rigger', hint: 'Straps as tint bands. Consensual costume.' },
  { id: 'gym-after', title: 'Gym after hours', hint: 'Adult athletic, 21+. Not a school locker.' }
]);

export const WARDROBE = Object.freeze([
  { id: 'wrapped', title: 'Wrapped', hint: 'Robe / towel start' },
  { id: 'open-shirt', title: 'Open shirt', hint: 'Unbuttoned' },
  { id: 'slip', title: 'Slip', hint: 'Thin dress' },
  { id: 'lingerie', title: 'Lingerie', hint: 'Set' },
  { id: 'sheer', title: 'Sheer', hint: 'See-through tint' },
  { id: 'bare', title: 'Bare', hint: 'No clothing tint' },
  { id: 'harness', title: 'Harness', hint: 'Straps as dark bands' },
  { id: 'stockings', title: 'Stockings', hint: 'Leg tint' },
  { id: 'robe', title: 'Open robe', hint: 'Looser wrap' },
  { id: 'towel', title: 'Towel', hint: 'Shower beat' },
  { id: 'jock', title: 'Jock', hint: 'Minimal masculine' },
  { id: 'shirt-only', title: 'Shirt only', hint: 'Top, bare hips' },
  { id: 'corset', title: 'Corset', hint: 'Waist crush tint' },
  { id: 'latex-look', title: 'Latex', hint: 'High gloss bands' },
  { id: 'garter', title: 'Garter', hint: 'Hip straps' },
  { id: 'wrap-skirt', title: 'Wrap skirt', hint: 'Hips covered, chest optional' },
  { id: 'bodysuit', title: 'Bodysuit', hint: 'One-piece tint' },
  { id: 'bikini', title: 'Bikini', hint: 'Two-piece bands' },
  { id: 'boxers', title: 'Boxers', hint: 'Masculine shorts tint' },
  { id: 'jewelry-only', title: 'Jewelry only', hint: 'Sparkle bands, otherwise bare' },
  { id: 'mesh-top', title: 'Mesh top', hint: 'Chest net tint' },
  { id: 'silk-pj', title: 'Silk pajamas', hint: 'Soft full wrap' },
  { id: 'wet-look', title: 'Wet look', hint: 'Gloss as clothing' },
  { id: 'choker-set', title: 'Choker set', hint: 'Neck + hip bands' }
]);

export const ATMOSPHERE_SCENES = Object.freeze([
  { id: 'bedroom', title: 'Bedroom', hint: 'Warm lamps, sheets implied', lighting: 'bedroom', overlay: 'lamps' },
  { id: 'hotel', title: 'Hotel night', hint: 'Cool city spill', lighting: 'soft', overlay: 'city' },
  { id: 'club', title: 'Club booth', hint: 'Magenta / cyan', lighting: 'club', overlay: 'strobe' },
  { id: 'shower-steam', title: 'Shower steam', hint: 'Soft wrap, wet sheen', lighting: 'soft', overlay: 'steam' },
  { id: 'firelight', title: 'Firelight', hint: 'Orange key', lighting: 'bedroom', overlay: 'ember' },
  { id: 'neon-bath', title: 'Neon bath', hint: 'Cyan/pink water', lighting: 'neon', overlay: 'neon' },
  { id: 'rain-window', title: 'Rain window', hint: 'Blue rim, hotel glass', lighting: 'studio', overlay: 'rain' },
  { id: 'velvet-booth', title: 'Velvet booth', hint: 'Private booth, low gold', lighting: 'club', overlay: 'velvet' },
  { id: 'penthouse', title: 'Penthouse', hint: 'Night skyline spill', lighting: 'studio', overlay: 'city' },
  { id: 'cinema-dark', title: 'Cinema dark', hint: 'Letterbox, projector spill', lighting: 'studio', overlay: 'grain' },
  { id: 'masquerade', title: 'Masquerade', hint: 'Gold rim, adult court', lighting: 'club', overlay: 'gold' },
  { id: 'black-marble', title: 'Black marble', hint: 'Hard reflections', lighting: 'studio', overlay: 'marble' },
  { id: 'balcony-rain', title: 'Balcony rain', hint: 'Wet night air', lighting: 'neon', overlay: 'rain' },
  { id: 'recording-booth', title: 'Recording booth', hint: 'Cam-show desk, 21+', lighting: 'soft', overlay: 'led' },
  { id: 'dungeon-soft', title: 'Soft dungeon', hint: 'Consensual club lighting. No breath-play.', lighting: 'club', overlay: 'velvet' },
  { id: 'candle-sheets', title: 'Candle sheets', hint: 'Low flicker, close', lighting: 'bedroom', overlay: 'ember' },
  { id: 'infinity-pool', title: 'Night pool', hint: 'Cyan bounce, adult swim', lighting: 'neon', overlay: 'steam' },
  { id: 'gym-after', title: 'Gym after hours', hint: 'Adult athletic space, 21+', lighting: 'studio', overlay: 'led' }
]);

export const SHOW_PACKS = Object.freeze([
  {
    id: 'edge-night',
    title: 'Edge night',
    hint: 'Slow burn â†’ hold â†’ deny. Finish optional.',
    sessions: ['slow-burn', 'edge-hold', 'tease-deny'],
    atmosphere: 'velvet-booth',
    style: 'femme-fatale',
    wear: 'sheer'
  },
  {
    id: 'cam-set',
    title: 'Cam night',
    hint: 'Strip, mutual count, countdown. Local canvas, not a livestream.',
    sessions: ['striptease', 'mutual-guide', 'countdown-finish'],
    atmosphere: 'recording-booth',
    style: 'exhibitionist',
    wear: 'lingerie'
  },
  {
    id: 'worship-set',
    title: 'Worship set',
    hint: 'Body attention: chest, ass, praise.',
    sessions: ['worship', 'chest-focus', 'ass-focus'],
    atmosphere: 'firelight',
    style: 'succubus-glam',
    wear: 'robe'
  },
  {
    id: 'pillow-set',
    title: 'Pillow hours',
    hint: 'Close talk, whisper, aftercare. Heat optional.',
    sessions: ['pillow-talk', 'whisper-only', 'aftercare'],
    atmosphere: 'candle-sheets',
    style: 'pillow',
    wear: 'silk-pj'
  },
  {
    id: 'club-after',
    title: 'Club after',
    hint: 'Filthy talk, strip, grind. Adult booth.',
    sessions: ['filthy-talk', 'striptease', 'mutual-guide'],
    atmosphere: 'club',
    style: 'brat',
    wear: 'open-shirt'
  },
  {
    id: 'steam-set',
    title: 'Steam',
    hint: 'Hands-free audio in shower steam. Your clips optional.',
    sessions: ['hands-free-audio', 'slow-burn', 'afterglow-hold'],
    atmosphere: 'shower-steam',
    style: 'wet-look-style',
    wear: 'towel'
  },
  {
    id: 'watch-set',
    title: 'Watch me',
    hint: 'Voyeur framing. You stroke or donâ€™t. Figure performs.',
    sessions: ['voyeur-watch', 'pose-play', 'cam-night'],
    atmosphere: 'cinema-dark',
    style: 'voyeur-cam',
    wear: 'slip'
  },
  {
    id: 'jock-set',
    title: 'Jock set',
    hint: 'Male athletic cut, gym-after lighting, direct coach.',
    sessions: ['stroke-guide', 'toy-pace', 'countdown-finish'],
    atmosphere: 'gym-after',
    style: 'jock',
    wear: 'jock'
  }
]);

export const SHOW_REACTIONS = Object.freeze([
  { id: 'moan', line: 'Nnnhâ€” keep going. Still software. Still working you.' },
  { id: 'gasp', line: 'Ahâ€” edge. Donâ€™t you dare finish unless I count.' },
  { id: 'laugh', line: 'Look at you leaking for a canvas body. Cute.' },
  { id: 'praise', line: 'Thatâ€™s it. Good. Wet enough. You can take a slower stroke.' },
  { id: 'filth', line: 'Spit. Fist. Faster. I want it sloppy on your own hand.' },
  { id: 'whisper', line: 'Closer. Barely move. Let it throb.' },
  { id: 'count', line: 'Ten. Nine. Squeeze. You come when I say.' },
  { id: 'after', line: 'Easy. Unclench. Water. Iâ€™m still just a program.' },
  { id: 'watch', line: 'Donâ€™t look away. The figure is posing because you asked it to.' },
  { id: 'strip', line: 'Another layer. Match me or just stare. Either is the show.' },
  { id: 'hold', line: 'Freeze. That ache is the point. Breathe through it.' },
  { id: 'come-cue', line: 'Now. Keep stroking through it unless you revoked.' }
]);

export const HUD_SHORTCUTS = Object.freeze([
  { key: '`', title: 'Boss key', hint: 'Blank the stage instantly. Toggle again to restore. Does not hide the process from Task Manager.' },
  { key: 'Esc', title: 'Safeword', hint: 'Stop the session (same as red).' },
  { key: 'Space', title: 'Hold / edge', hint: 'Freeze on the edge.' },
  { key: 'F', title: 'Faster', hint: 'Speed the stroke / grind.' },
  { key: 'S', title: 'Strip', hint: 'Drop a clothing stage.' },
  { key: 'P', title: 'Pose', hint: 'Next sexual behavior.' },
  { key: 'C', title: 'Camera', hint: 'Cycle shots.' },
  { key: 'M', title: 'Mute', hint: 'Mute OS voice.' },
  { key: 'T', title: 'Theater', hint: 'Letterbox + grain.' },
  { key: 'â† â†’', title: 'Camera', hint: 'Previous / next shot.' },
  { key: '1â€“8', title: 'Sampler', hint: 'Fire a reaction line.' }
]);

export const TOUCH_ZONES = Object.freeze([
  { id: 'face', title: 'Face', y0: 0, y1: 0.22 },
  { id: 'chest', title: 'Chest', y0: 0.22, y1: 0.42 },
  { id: 'groin', title: 'Groin', y0: 0.42, y1: 0.58 },
  { id: 'ass', title: 'Ass', y0: 0.58, y1: 0.72 },
  { id: 'thighs', title: 'Thighs', y0: 0.72, y1: 1 }
]);

export const LIGHTING_GELS = Object.freeze([
  { id: 'studio', title: 'Studio white', hint: 'Neutral key' },
  { id: 'club', title: 'Club magenta', hint: 'Magenta / cyan' },
  { id: 'soft', title: 'Soft wrap', hint: 'Flattering fill' },
  { id: 'neon', title: 'Neon', hint: 'Cyan/pink' },
  { id: 'bedroom', title: 'Bedroom lamps', hint: 'Warm tungsten' }
]);

export const SHOW_HONESTY = 'Adult Soul entertainment is a local theater around a first-party mesh: rooms, wardrobe tints, adult fantasy costumes, show packs, a HUD, and a boss key. It is not a livestream of a person, not VRM, and not consciousness. Backtick blanks the stage. Red / safeword stops the session. Revoke Adult Mode anytime.';

const WEAR_PIGMENT = Object.freeze({
  lingerie: { r: 0.18, g: 0.05, b: 0.1 },
  sheer: { r: 0.62, g: 0.38, b: 0.46 },
  harness: { r: 0.08, g: 0.06, b: 0.06 },
  stockings: { r: 0.12, g: 0.08, b: 0.1 },
  corset: { r: 0.14, g: 0.04, b: 0.08 },
  'latex-look': { r: 0.06, g: 0.05, b: 0.07 },
  jock: { r: 0.08, g: 0.1, b: 0.16 },
  'shirt-only': { r: 0.78, g: 0.76, b: 0.74 },
  'wrap-skirt': { r: 0.22, g: 0.08, b: 0.12 },
  wrapped: { r: 0.55, g: 0.42, b: 0.38 },
  robe: { r: 0.42, g: 0.18, b: 0.22 },
  towel: { r: 0.72, g: 0.7, b: 0.68 },
  'open-shirt': { r: 0.82, g: 0.8, b: 0.76 },
  slip: { r: 0.45, g: 0.28, b: 0.34 },
  garter: { r: 0.16, g: 0.05, b: 0.08 },
  bodysuit: { r: 0.1, g: 0.08, b: 0.12 },
  bikini: { r: 0.12, g: 0.22, b: 0.38 },
  boxers: { r: 0.16, g: 0.18, b: 0.28 },
  'jewelry-only': { r: 0.82, g: 0.68, b: 0.32 },
  'mesh-top': { r: 0.28, g: 0.22, b: 0.26 },
  'silk-pj': { r: 0.48, g: 0.32, b: 0.42 },
  'wet-look': { r: 0.1, g: 0.12, b: 0.16 },
  'choker-set': { r: 0.1, g: 0.06, b: 0.08 },
  bare: { r: 0, g: 0, b: 0 }
});

export function clothingIds() {
  return WARDROBE.map(item => item.id);
}

export function clothingTint(wear, t) {
  const id = String(wear || 'lingerie');
  const pigment = WEAR_PIGMENT[id] || WEAR_PIGMENT.lingerie;
  const chest = t > 0.18 && t < 0.38;
  const waist = t > 0.32 && t < 0.48;
  const hips = t > 0.4 && t < 0.58;
  const legs = t > 0.52 && t < 0.92;
  const neck = t > 0.1 && t < 0.18;
  let mix = 0;
  let gloss = 0;
  if (id === 'bare') return { mix: 0, gloss: 0, sheen: 0, r: 0, g: 0, b: 0 };
  if (id === 'sheer') { mix = chest || hips ? 0.18 : 0.06; gloss = 0.2; }
  else if (id === 'lingerie' || id === 'garter' || id === 'bikini') { mix = hips || chest ? 0.35 : 0; gloss = 0.12; }
  else if (id === 'harness' || id === 'choker-set') { mix = chest || waist || neck ? 0.45 : 0; gloss = 0.08; }
  else if (id === 'stockings') { mix = legs ? 0.4 : 0; gloss = 0.15; }
  else if (id === 'corset') { mix = waist ? 0.55 : chest ? 0.2 : 0; gloss = 0.1; }
  else if (id === 'latex-look' || id === 'wet-look' || id === 'bodysuit') { mix = chest || hips || waist ? 0.5 : 0.12; gloss = 0.65; }
  else if (id === 'jock' || id === 'boxers') { mix = hips && t > 0.44 && t < 0.58 ? 0.5 : 0; gloss = 0.1; }
  else if (id === 'shirt-only' || id === 'mesh-top') { mix = chest || (t > 0.12 && t < 0.4) ? 0.38 : 0; gloss = 0.05; }
  else if (id === 'wrap-skirt') { mix = hips || (t > 0.4 && t < 0.7) ? 0.42 : 0; gloss = 0.06; }
  else if (id === 'jewelry-only') { mix = neck || (hips && Math.abs(t - 0.5) < 0.03) ? 0.55 : 0; gloss = 0.7; }
  else if (id === 'towel' || id === 'robe' || id === 'wrapped' || id === 'open-shirt' || id === 'slip' || id === 'silk-pj') {
    mix = t > 0.16 && t < 0.72 ? 0.28 : 0;
    gloss = 0.04;
  }
  return { mix, gloss, sheen: gloss, r: pigment.r, g: pigment.g, b: pigment.b };
}

export function frameworkRadii(framework, t, theta, radii) {
  const id = String(framework || 'human');
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  let { front, side, back } = radii;
  if (id === 'high-elf' || id === 'fae-court') {
    if (t < 0.12 && Math.abs(s) > 0.75) side += 0.045;
    front *= t < 0.2 ? 0.96 : 1.02;
  }
  if (id === 'succubus' || id === 'dragonkin' || id === 'fallen') {
    if (t < 0.08 && c > 0.2) front += 0.03;
    if (t < 0.1 && Math.abs(s) > 0.55) side += 0.02;
  }
  if (id === 'kitsune') {
    if (t > 0.4 && t < 0.58 && c < 0) back += 0.07;
  }
  if (id === 'orc') {
    side *= 1.08;
    if (t < 0.22) front *= 1.06;
  }
  if (id === 'mer') {
    if (t > 0.55) {
      front *= 0.72;
      side *= 0.7;
      back *= 0.72;
    }
  }
  if (id === 'vampire' || id === 'fallen') back *= 1.02;
  return { front, side, back };
}

export function frameworkSkin(framework, skin) {
  const id = String(framework || 'human');
  if (id === 'vampire') return { ...skin, tone: '#d7c4c0', tan: Math.min(skin.tan, 12), blush: Math.max(skin.blush, 28) };
  if (id === 'high-elf' || id === 'fae-court') return { ...skin, tone: '#e2c6a8', sheen: Math.max(skin.sheen, 40) };
  if (id === 'orc') return { ...skin, tone: '#6f8a4a', tan: 20 };
  if (id === 'succubus' || id === 'dragonkin') return { ...skin, sheen: Math.max(skin.sheen, 55), blush: Math.max(skin.blush, 40) };
  if (id === 'mer') return { ...skin, sheen: Math.max(skin.sheen, 60), tone: '#c7b39a' };
  return skin;
}

export function sexyStylePatch(style) {
  const id = String(style || 'natural');
  if (id === 'glamour') return { makeup: { lids: 70, liner: 62, blush: 58, lips: 72 }, skin: { sheen: 55 }, motion: { sway: 62 } };
  if (id === 'brat') return { motion: { sway: 70, idle: 65 }, makeup: { lips: 68, liner: 50 } };
  if (id === 'jock') return { figure: { shoulders: 72, chest: 70, waist: 42, bust: 40 }, presentationWear: 'jock' };
  if (id === 'succubus-glam') return { skin: { sheen: 72, blush: 60 }, explicit: { nipples: 80, assFocus: 70 }, presentationWear: 'sheer' };
  if (id === 'femme-fatale') return { makeup: { liner: 74, lips: 70, lids: 60 }, motion: { eyeContact: 88, sway: 40 } };
  if (id === 'gentle-dom') return { motion: { eyeContact: 80, breath: 45 } };
  if (id === 'pillow') return { motion: { breath: 70, sway: 30 }, presentationWear: 'robe' };
  if (id === 'latex-look') return { skin: { sheen: 88 }, presentationWear: 'latex-look' };
  if (id === 'athletic-cut') return { figure: { belly: 12, chest: 64, waist: 36, thighs: 62 }, skin: { tan: 40 } };
  if (id === 'exhibitionist') return { presentationWear: 'bare', motion: { eyeContact: 90, sway: 58 }, skin: { sheen: 48 } };
  if (id === 'voyeur-cam') return { motion: { eyeContact: 30, sway: 55 }, renderLighting: 'studio' };
  if (id === 'goth-glam') return { makeup: { lids: 82, liner: 80, lips: 70, blush: 30 }, skin: { sheen: 42 } };
  if (id === 'sun-kissed') return { skin: { tan: 62, sheen: 50, blush: 48 } };
  if (id === 'wet-look-style') return { skin: { sheen: 90 }, presentationWear: 'wet-look' };
  if (id === 'service-top') return { motion: { eyeContact: 84, breath: 40 } };
  if (id === 'rigger') return { presentationWear: 'harness', skin: { sheen: 40 } };
  if (id === 'gym-after') return { figure: { shoulders: 68, chest: 66, waist: 38 }, presentationWear: 'jock', skin: { tan: 44 } };
  return {};
}

export function atmosphereFor(id) {
  return ATMOSPHERE_SCENES.find(item => item.id === id) || ATMOSPHERE_SCENES[0];
}

export function showPackFor(id) {
  return SHOW_PACKS.find(item => item.id === id) || null;
}

export function overlayForAtmosphere(id) {
  return atmosphereFor(id).overlay || 'lamps';
}

export function touchZoneAt(t) {
  const y = Math.max(0, Math.min(1, Number(t) || 0));
  return TOUCH_ZONES.find(zone => y >= zone.y0 && y < zone.y1) || TOUCH_ZONES[TOUCH_ZONES.length - 1];
}

export function metronomeMs(pace) {
  if (pace === 'stop') return 0;
  if (pace === 'slow') return 1400;
  if (pace === 'fast') return 420;
  return 780;
}

export function stripProgress(wear) {
  const ids = clothingIds();
  const i = Math.max(0, ids.indexOf(wear));
  const bare = ids.indexOf('bare');
  const span = Math.max(1, bare);
  return Math.round((Math.min(i, span) / span) * 100);
}

export function theaterClasses(stage = {}, session = {}) {
  const classes = ['adult-figure-stage'];
  if (stage.theater === true || stage.cinematic === true) classes.push('is-cinema');
  if (stage.slowMo === true) classes.push('is-slowmo');
  if (stage.mirror === true) classes.push('is-mirror');
  if (stage.blanked === true) classes.push('is-blanked');
  if (stage.handsOff === true) classes.push('is-hands-off');
  if (stage.afterglow === true || session.kind === 'afterglow-hold' || session.kind === 'aftercare') classes.push('is-afterglow');
  if (session.behavior === 'climax') classes.push('is-climax');
  if (session.active) classes.push('is-live');
  return classes.join(' ');
}

export function nowPlayingLine(view = {}) {
  const session = view.session || {};
  const persona = view.persona || {};
  const avatar = view.avatar || {};
  const stage = view.stage || {};
  if (stage.blanked) return 'Stage blanked (boss key).';
  if (!session.active) {
    const wear = WARDROBE.find(item => item.id === avatar.presentationWear);
    const room = atmosphereFor(stage.atmosphere);
    return `Idle Â· ${wear?.title || 'wardrobe'} Â· ${room.title} Â· ${persona.name || 'Adult Soul'} is software`;
  }
  const title = session.kind ? session.kind.replace(/-/g, ' ') : 'session';
  return `Now Â· ${title} Â· ${session.pace || 'medium'} Â· ${session.behavior || 'idle'} Â· still a mesh`;
}

export function reactionLine(id) {
  return SHOW_REACTIONS.find(item => item.id === id)?.line || SHOW_REACTIONS[0].line;
}

