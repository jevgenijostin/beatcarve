# Night 1 — 2026-10-29/30

## Scope shipped

Phase 3–5 game: browser file decode and drop, analysis worker, four-lane canvas, D F J K taps, audio-clock judgments, combo/score/results, tab-blur pause/resume, median calibration with local persistence/reset, tempo and beat-offset controls, Normal/Easy, JSON download, and HMAC demo licensing gating export only. No runtime dependencies, backend, uploads, or hosted audio.

## Interpretation decisions

- Ada explicitly authorized proceeding with a narrowed claim after the PARTIAL gate: “songs with a clear, steady hip-hop beat, or sparse/minimal percussion.” README/UI identify Griphop and Deliberate Thought as the validated examples and electronic/rock as known failures.
- A permanent warning beside upload covers unsupported categories even at high confidence. This is the authorized static-note minimum; no unvalidated genre classifier or density threshold was introduced.
- src/dsp.ts and src/chart.ts remain byte-for-byte unchanged from 8868fe7. No precision/density fixes or gate reruns. The 291 ms Killing Time metric artifact finding is preserved in gate/DIAGNOSIS.md.
- User authorization overrides the general branch convention: push directly to main, no branch/PR, no attribution trailers.
- Audio-clock time subtracts baseLatency, outputLatency, and calibration from scheduled playback time. Pause suspends the same AudioContext; rendering never accumulates frame deltas.
- Tempo and offset edits reuse the worker's cached analysis. Manual tempo controls are bounded to avoid unusable extreme values.
- Calibration uses 14 taps after two lead-in clicks. Offset and demo license storage are local; demo signing is intentionally inspectable and is not payment security.
- No chart-performance promise (“about 10 seconds” removed); a six-minute song can take substantially longer than an excerpt. No acceptance threshold changed.
- All requested gameplay and export features retained. Static category warning chosen instead of heuristic genre detection. Out-of-scope roadmap remains unbuilt.

## Local verification

Vitest covers frozen DSP/chart invariants plus Perfect/Great boundaries, clock-based judgments independent of frames, median calibration with outliers, export schema, HMAC signatures/tampering/expiry/tier checks, activation/reload/deactivation.
Playwright uses generated WAV audio through real browser decoding and the real worker; checks controls, confidence, injected-clock keyboard scoring, wrong-time misses, blur pause, results, licensed JSON download, calibration persistence/reset, malformed audio, six-minute cap, and absence of test hooks without ?test=1.
Final local and hosted results are recorded below after completion.

## Gate result and limits

PARTIAL, 2/5: Griphop and Deliberate Thought pass both excerpts. Killing Time precision is 87.25% / 67.27%; first-window density validity is 78.00%. Cut and Run precision is 43.68% / 59.51%. Bet You Can estimates 120.69 / 120.57 BPM against 92 BPM metadata with confidence 0.03 / 0.04. All frozen measurements remain in GATE-REPORT.md. No independent onset annotations, clean unseen generalization, or verified live/drift corpus provenance.

Synthetic tests verify timing and tempo ambiguity. They cannot certify that the charts are fun. That is what the gate and morning human check are for.

## Manual-play observations

No human playtest or listening claim. Automated browser operation verifies mechanics, not musical feel.

## What is not verified

Fun, musical accuracy against independent annotation, human playability, real-device latency, Safari/Firefox, and comprehensive accessibility. The narrowed claim remains bounded by two evaluated examples. Calibration cannot repair drift.

## Deployment

Target: https://jevgenijostin.github.io/beatcarve/
Direct main push and ubuntu-latest/windows-latest CI + Pages verification pending completion of this build.

Local final checks: 40 Vitest tests passed; typecheck, lint, production build, and four Chromium Playwright tests passed. Setup screenshot inspected. The first scoring assertion assumed ten Easy notes; inspection showed nine generated notes and nine Perfect hits, zero misses. The harness now asserts scoring against the generated count (minimum eight), without altering the generator.
