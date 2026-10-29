# BeatCarve

Play **songs with a clear, steady hip-hop beat, or sparse/minimal percussion** in a local, four-lane keyboard rhythm game.

**Status: playable demo; analysis gate remains PARTIAL (2/5).** The validated examples are Griphop (hip-hop) and Deliberate Thought (sparse/minimal percussion). This is evidence from those examples, not a guarantee across either category. **Electronic and rock are NOT currently well-supported**: Killing Time, Cut and Run, and Bet You Can have known gate failures. See [GATE-REPORT.md](GATE-REPORT.md) for measurements and [gate/DIAGNOSIS.md](gate/DIAGNOSIS.md) for the corrected phase-artifact finding. Ambient, rubato, and drifting recordings are also outside the supported claim. Numerical beat confidence does not certify chart quality.

[Play BeatCarve](https://jevgenijostin.github.io/beatcarve/)

## Play

1. Choose or drop a browser-decodable local audio file, at most six minutes.
2. Wait for worker analysis. Choose Normal or the more conservative Easy.
3. If needed, adjust ×2/÷2 tempo, ±1/±10 ms beat offset, or shift one beat. These regenerate the chart without repeating spectral analysis.
4. Calibrate timing, then play with **D F J K**. Tap when notes cross the line.
5. Perfect is within ±45 ms (1,000 points); Great within ±90 ms (500); missed notes and stray presses reset combo. Results show score, best combo, and judgments.

Pause/resume is available during play; tab blur pauses automatically. Desktop keyboard only, four lanes, tap notes, no accounts. Empty or undecodable audio reports an error; analysis time depends on track length and device. No ten-second performance promise.

## Calibration and timing

Listen to two clicks, then tap Space with 14 clicks. The median offset is saved locally and can be reset. Calibration corrects a **consistent offset only**, not timing drift or an incorrect chart. Rendering and judgment use AudioContext time minus base/output latency and calibration. Audio starts on a scheduled clock; suspending the context pauses the song and game together.

## Privacy and export

Audio never leaves the browser. BeatCarve never uploads or hosts songs, and chart JSON contains no audio. The app has no runtime dependencies or backend. Use music you are entitled to use.

The full game, analysis, calibration, and Easy/Normal are free. **Creator demo unlocks JSON export only.** Open the demo-license panel and generate a free key or paste a signed key. HMAC-SHA-256 and an intentionally inspectable client secret demonstrate activation, persistence, expiration, and verification; this is not payment security. No payment flow exists.

Export fields: version, trackName, durationMs, bpm, offsetMs, difficulty, notes (millisecond t and lane 0–3), and generatorParams.

## Generator

A worker runs the frozen TypeScript analyzer: Hann-window STFT, positive log-spectral flux, local median/MAD peaks, autocorrelation tempo, phase refinement, and dynamic-programming beat tracking. A sample hash seeds deterministic lane selection. The chart generator limits density, lane spacing, repeated lanes, and two-note chords. Initial tempo folds into [80,160); manual tempo controls allow octave correction. Production analysis and chart generation are frozen at commit 8868fe7.

## Develop and verify

Node 24+ and npm:

- npm ci
- npm run dev
- npm run typecheck
- npm run lint
- npm test
- npx playwright install chromium
- npm run test:e2e
- npm run build

GitHub Actions checks Ubuntu and Windows and deploys Pages from main. See [BUILD-NOTES.md](BUILD-NOTES.md) for verification and limitations. Playwright generates WAV fixtures; the chart/clock test hook exists only with ?test=1.

Gate reproduction additionally needs FFmpeg/FFprobe: npm run gate:fetch, then npm run gate -- --final. Sources, SHA-256 checksums, licenses, and attributions are in scripts/fetch-gate-tracks.ts. Downloaded audio and listening artifacts stay ignored under gate/. The existing gate remains frozen; no new tuning was performed for the game.

## Roadmap — not built

Chart editor, Clone Hero .chart / osu! .osu export, and custom difficulty tuning. No Hard tier, holds, gamepad/touch controls, streaming integration, or leaderboards.

Synthetic tests verify timing and tempo ambiguity; they cannot certify that charts are fun. Human play feel and real-device latency still need the morning check.
