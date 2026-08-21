# Gaming and media capability standard

Eidovara is a companion workspace, launcher, diagnostics surface, and media player. It does not render third-party games or replace Windows, a GPU driver, display firmware, anti-cheat, a game engine, or a platform client.

## Implemented release gates

- Hardware-accelerated Chromium remains enabled unless the operating system disables it.
- Low-overhead mode removes Eidovara animation, transitions, decorative shadows, transparency effects, and spoken-output activity without modifying another process.
- Diagnostics report Chromium GPU status and runtime support for H.264, HEVC, VP9, AV1, AAC, MP3, Opus, FLAC, Web Audio, fullscreen, picture-in-picture, HDR media queries, wide color gamut, Gamepad API availability, and connected browser-visible gamepads.
- Audio/video playback uses the codecs available to the packaged Chromium runtime and operating system. Unsupported formats fail visibly; Eidovara does not bundle unlicensed codec packs or protected-media circumvention.
- Local media access uses a visible file picker for one user-selected file at a time. The assistant receives no general filesystem permission, and local paths are not added to entertainment taste records.
- Games are opened through user-selected Windows shortcuts or executables. No DLL injection, memory reading, anti-cheat interaction, driver installation, display override, frame capture, or input interception is performed.

## Owned by the game or platform

Frame generation, ray tracing, variable refresh rate, Auto HDR, DirectStorage, upscaling, controller haptics, spatial audio, exclusive fullscreen, graphics presets, cloud saves, achievements, multiplayer, anti-cheat, and platform overlays remain controlled by the game, Windows, hardware, drivers, and authorized platform software. Eidovara must not claim these capabilities merely because the computer supports them.

Native controller navigation or deeper game telemetry would require a separately reviewed Windows adapter, current official SDK terms, explicit permission, signed native binaries, failure isolation, and tests on representative hardware. It must not be bundled until those requirements are met.

## Compatibility testing

Release testing covers application startup, persistence, settings, low-overhead styling, media capability detection, safe launching, network failure, and updater integrity. Performance claims require repeatable measurements on disclosed hardware; no universal FPS, latency, codec, HDR, or game-compatibility guarantee is made.
