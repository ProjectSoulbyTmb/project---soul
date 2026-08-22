// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Lightweight Adult Soul / Adult Media intent classifiers.
 * Kept free of schema/kernel/workspace imports so workspace routing cannot
 * cycle through adult-soul → schema → kernel → workspace.
 */
import { classifyAdultFeelIntent } from './adult-feel.js';

const FORBIDDEN =
  /\b(?:child|children|minor|minors|underage|under[\s-]?age|loli|lolita|shota|shotacon|jailbait|preteen|pre-teen|toddler|infant|baby|pedophil|hebephil|schoolgirl|schoolboy|young[\s-]?teen)\b/i;

export function classifyAdultSoulIntent(input) {
  const t = String(input || '').toLowerCase();
  if (
    /\b(jerk[\s-]?off|masturbat|stroke(?:\s+my)?(?:\s+cock)?|edge me|edging|make me come|countdown finish|filthy talk|dirty talk|worship my|hands[\s-]?free audio|aftercare session|striptease|pose play|toy pace|tease and deny)\b/.test(
      t
    )
  )
    return 'adult-session';
  if (/\b(adult soul(?:\s+studio)?|adult avatar|sexy avatar|adult entertainment studio)\b/.test(t))
    return 'adult-soul';
  if (/\b(?:open|show|go\s+to|take\s+me\s+to)\b[\s\S]{0,40}\badult soul\b/.test(t))
    return 'adult-soul';
  const feel = classifyAdultFeelIntent(t);
  if (feel) return feel;
  return '';
}

export function classifyAdultMediaIntent(input) {
  const t = String(input || '').toLowerCase();
  if (!t.trim()) return '';
  if (FORBIDDEN.test(t)) return 'adult-media-blocked';
  if (/\b(?:open|show|go\s+to|take\s+me\s+to)\b[\s\S]{0,40}\badult media\b/.test(t))
    return 'adult-media';
  if (/\badult (?:media|tube|desk|library|browse)\b/.test(t)) return 'adult-media';
  if (
    /\b(?:pornhub|xvideos|xhamster|spankbang|redgifs|onlyfans|fansly|chaturbate|manyvids|xnxx|youporn)\b/.test(
      t
    )
  )
    return 'adult-media';
  if (
    /\b(?:nsfw|xxx|porn(?:o|ography)?|adult videos?|tube sites?|cam (?:site|girl|show))\b/.test(t)
  )
    return 'adult-media';
  if (/\bwatch (?:porn|nsfw|xxx|adult)\b/.test(t)) return 'adult-media';
  if (/\b(?:vibemate|adult browser|private adult browse|ai sync)\b/.test(t)) return 'adult-media';
  return '';
}
