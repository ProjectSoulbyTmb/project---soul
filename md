# Companion and voice integration policy

Eidovara 1.0.0 ships a dependency-free 2D/3D-styled companion and uses voices already installed in Windows. No third-party voice weights, character models, biometric samples, or cloud voice credentials are bundled. Kokoro, Piper, VRM, and MakeHuman runtimes are documented future adapters only.

## Shipped first-party / Chromium engines (vanilla Electron ESM)

Electron 43.4.1 embeds Chromium 150. These are wired in-app. They are not extra npm UI or game-engine frameworks.

| Engine | Role | Honest limit |
| --- | --- | --- |
| Soul kernel | Session, modules, local self-model | Software, not consciousness |
| Offline Soul | Local replies | Optional Ollama / OpenAI-compatible HTTP stay user-pasted |
| WebGL2 lathe + CPU life | Adult Soul figure | Not VRM, Three.js, Babylon, Mixamo |
| Web Audio Feel Sync | Loudness → pad / figure | One `MediaElementSource` per media element |
| Procedural ambient | Heartbeat / breath / drone oscillators | Not a neural TTS pack |
| Chromium HTML5 media + Media Session | `eidovara-media:` / https: playback, media keys | No ffmpeg, yt-dlp, Widevine rip, tube embeds |
| OS `speechSynthesis` | Coaching lines | Windows-installed voices only |
| Chromium `SpeechRecognition` | Optional hold-to-talk | Microphone stays audio-only |
| Electron `powerSaveBlocker` | Stay-awake during playback / Adult Soul sessions | Fail closed; not an overlay |
| Chromium Gamepad API | Optional Feel pad steer + dual-rumble | Not Lovense, not game-process haptics |
| WebGPU | Diagnostics probe only | Figure renderer stays WebGL |
| electron-updater | GitHub Releases | Authenticode-unsigned |

The in-app catalog is `src/core/runtime-engines.js` (also on kernel status and Diagnostics).

## Screened future adapters

| Candidate | Use | Upstream license | Decision |
| --- | --- | --- | --- |
| Kokoro-82M | Local neural text-to-speech | Apache-2.0 model card | Preferred research candidate; do not bundle until every voice asset and runtime dependency is independently reviewed. |
| sherpa-onnx | Offline speech/TTS runtime | Apache-2.0 | Suitable adapter candidate; model and phonemizer licenses must be reviewed separately. |
| three-vrm | VRM avatar rendering | MIT | Preferred optional 3D avatar adapter; user-imported models require their own rights. |
| Piper | Local TTS | GPL-3.0 engine; per-voice terms vary | Not bundled with the source-available desktop product. May be used as a separately installed user tool only after legal review. |

## Required safeguards

- Voice cloning must require the speaker's documented consent and a right to the training audio.
- The UI must disclose synthetic audio and must not impersonate a real person deceptively.
- Imported avatars must be user-owned or appropriately licensed; no celebrity likeness or protected character is supplied.
- Model downloads must use HTTPS, pinned hashes, a visible license, explicit user approval, and a per-model removal control.
- Microphone, camera, and network access remain opt-in and narrowly scoped. Raw recordings are not retained by default.
- External adapters run out of process with least privilege and cannot receive stored API keys unless the user explicitly configures that provider.

This is a technical screening record, not a legal clearance opinion. Re-check the exact pinned release and every model card before distribution.

## Blocked in v1.0.0 (document only — do not enable)

These items may be described as future adapters. They must not be bundled, wired, or turned on in this release:

- Neural TTS runtimes and voice packs (Kokoro, Piper, sherpa-onnx, cloud voice APIs)
- VRM / MakeHuman character engines or imported anatomical models
- Direct OBS websocket control (stream URLs may be stored locally as planning notes only)
- Live payments, card collection, webhook entitlement, or PCI processing

Windows-installed voices, the CSS companion, explicit Wikipedia/Wikimedia research, pasted HTTPS providers, Premium Brave, GitHub updates, optional Worker health/config/status/assist, and Spotify/YouTube HTTPS search links remain the implemented surface. See NETWORK-USAGE.md.

## Adult character asset decision for v1.0.0

No third-party anatomical model is bundled in v1.0.0. The lowest-conflict future path identified is a custom, clearly adult character exported from an official unmodified MakeHuman release using only its bundled core assets. MakeHuman states that its core graphical assets and official exports are CC0, while its application code is AGPL. Eidovara may evaluate an exported asset after preserving its exact source version, hashes, export record, license snapshot, and an adult/likeness review; MakeHuman program code must not be copied into Eidovara.

User-contributed MakeHuman assets are excluded unless each asset's license and provenance is reviewed. VRoid Hub models are excluded by default because each model may separately restrict sexual depictions, commercial use, alteration, redistribution, and attribution. Scans of real people, celebrity likenesses, age-ambiguous models, and datasets without documented consent and provenance are prohibited.

Official references reviewed August 21, 2026:

- https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.md
- https://static.makehumancommunity.org/about/license.html
- https://developer.vroid.com/en/guidelines/conditions_of_use.html
