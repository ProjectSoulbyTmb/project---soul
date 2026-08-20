# Companion and voice integration policy

Eidovara 0.17 ships a dependency-free 2D/3D-styled companion and uses voices already installed in Windows. No third-party voice weights, character models, biometric samples, or cloud voice credentials are bundled.

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
