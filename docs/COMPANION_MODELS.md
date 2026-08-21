# Companion and voice integration policy

Eidovara 0.17 ships a dependency-free 2D/3D-styled companion and uses voices already installed on the device through the Web Speech API. The Windows release is the supported product; Linux/macOS development hosts can use the same APIs when Chromium exposes them. No third-party voice weights, character models, biometric samples, or cloud voice credentials are bundled.

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

## Adult character asset decision for v0.18.0

No third-party anatomical model is bundled in v0.18.0. The lowest-conflict future path identified is a custom, clearly adult character exported from an official unmodified MakeHuman release using only its bundled core assets. MakeHuman states that its core graphical assets and official exports are CC0, while its application code is AGPL. Eidovara may evaluate an exported asset after preserving its exact source version, hashes, export record, license snapshot, and an adult/likeness review; MakeHuman program code must not be copied into Eidovara.

User-contributed MakeHuman assets are excluded unless each asset's license and provenance is reviewed. VRoid Hub models are excluded by default because each model may separately restrict sexual depictions, commercial use, alteration, redistribution, and attribution. Scans of real people, celebrity likenesses, age-ambiguous models, and datasets without documented consent and provenance are prohibited.

Official references reviewed August 21, 2026:

- https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.md
- https://static.makehumancommunity.org/about/license.html
- https://developer.vroid.com/en/guidelines/conditions_of_use.html
