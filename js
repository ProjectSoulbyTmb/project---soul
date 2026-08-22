/* SPDX-FileCopyrightText: 2026 Soul Consciousness Studios */
/* SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0 */

.adult-soul-studio {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(320px, 0.95fr);
  gap: 18px;
  align-items: start;
}
.adult-figure-stage {
  position: relative;
  min-height: 560px;
  border-radius: var(--radius-xl, 20px);
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 18%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 52%),
    linear-gradient(180deg, #161018 0%, #07050a 100%);
  border: var(--hairline, 0.5px) solid color-mix(in srgb, var(--accent) 22%, transparent);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
}
#adultFigureCanvas {
  width: 100%;
  height: 560px;
  display: block;
  touch-action: none;
  cursor: grab;
}
.adult-figure-meta {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: rgba(255,255,255,0.72);
  font-size: 11px;
  pointer-events: none;
}
.adult-soul-locked {
  padding: 24px;
  border-radius: var(--radius-lg, 18px);
  background: var(--fill-tertiary, #1c1c1e);
}
.adult-soul-cols {
  display: grid;
  gap: 12px;
}
.adult-soul-cols details {
  background: var(--fill-tertiary, #1c1c1e);
  border-radius: 14px;
  padding: 10px 12px;
}
.adult-soul-cols summary {
  cursor: pointer;
  font-weight: 600;
}
.adult-slider-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  margin-top: 10px;
}
.adult-slider-grid label {
  display: grid;
  gap: 4px;
  font-size: 12px;
  color: var(--muted, #a1a1a6);
}
.adult-session-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}
.adult-session-grid button {
  text-align: left;
}
.adult-cue {
  min-height: 4.5em;
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 16%, #000);
  color: var(--text, #f5f5f7);
  font-size: 14px;
  line-height: 1.45;
}
.adult-voice-list {
  max-height: 180px;
  overflow: auto;
  display: grid;
  gap: 4px;
  margin: 8px 0;
}
.adult-voice-list button {
  text-align: left;
  font-size: 12px;
}
.adult-soul-nav {
  opacity: 0.95;
}
body:not(.adult-mode) .adult-soul-nav {
  opacity: 0.7;
}
.adult-soul-controls {
  display: grid;
  gap: 12px;
}
.adult-xy {
  height: 140px;
  border-radius: 16px;
  margin: 8px 0 12px;
  background:
    radial-gradient(circle at var(--feel-x, 50%) var(--feel-y, 50%), color-mix(in srgb, var(--accent) 55%, #fff), transparent 32%),
    linear-gradient(180deg, #2a1520, #10080c);
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  cursor: crosshair;
  position: relative;
}
.adult-xy::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  left: var(--feel-x, 50%);
  top: var(--feel-y, 50%);
  transform: translate(-50%, -50%);
  box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 80%, #fff);
}
body.adult-blanked #adultSoulStudio,
body.adult-blanked #adultMediaDesk {
  filter: blur(18px);
  pointer-events: none;
  user-select: none;
}
body.adult-blanked #adultStealthLock {
  display: block !important;
  position: relative;
  z-index: 3;
  filter: none;
  pointer-events: auto;
}
@media (max-width: 980px) {
  .adult-soul-studio { grid-template-columns: 1fr; }
  #adultFigureCanvas { height: 420px; }
}

