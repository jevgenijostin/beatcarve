# BeatCarve — mandatory Phase 2 gate

To Ada and claude2. **Result: PARTIAL. HALTED before Phase 3.**

2/5 candidate tracks pass every machine row in both excerpts. Full corpus compliance is also unverified: the rock source credits a drummer, but does not establish live recording or mild tempo drift. This is not an overnight acceptance PASS and not a playable game. No continuation decision has been taken.

## Frozen evaluation

- Evaluated 2026-10-29T20:30:59.996Z using implementation commit 76f3620a27c2b5ccbc1522f1b6ac88b8d3db7f8f.
- Thresholds and split committed in GATE-PROTOCOL.md before final evaluation; no thresholds changed after looking at real-music results.
- One tuning-only run was performed; those tracks were rerun unchanged in the final evaluation. No real-music-driven parameter changes or targeted fix cycle were used. Both hold-outs were first decoded/analyzed in the final run. Only their source metadata, downloaded bytes and checksums were inspected beforehand.
- Synthetic-only fixes before the gate: stronger MAD noise rejection, phase-coherence tempo refinement, and deterministic half-tempo phase anchoring.
- First 90 seconds plus centered 60 seconds, separately analyzed; no excluded intros or silence. Both excerpts must pass. Normal only; Easy invariants are tested synthetically.
- Rolling density windows are 1 second wide, sampled every 100 ms. Generator density additionally has an exact event-window cap.
- Onset checks use the detector itself as a proxy, not independent ground-truth annotations. Drift is the circular distance of salient onset phase estimates in the first/middle/last thirds, not a measurement of a perfectly regular generated grid. It can confuse changing musical emphasis with true tempo drift.
- PASS requires at least 4 complete track passes including unseen Cut and Run and an explained exception. PARTIAL records insufficient complete passes; FAIL is zero complete passes. Acquisition succeeded: this is not a NOT RUN result.

## Tracks, license, and split

All tracks are by Kevin MacLeod, downloaded from the author’s catalog under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Local overlays modify them with clicks and excerpting. No audio is committed or hosted.

| Track/source | Role | Category | Source BPM | Complete machine pass |
|---|---|---|---:|---|
| [Killing Time](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100570) | tuning | electronic | 100 | NO |
| [Griphop](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100413) | tuning | hip-hop | 90 | YES |
| [Bet You Can](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1200018) | tuning | rock; live/drift unverified | 92 | NO |
| [Deliberate Thought](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100261) | hold-out | sparse | 69 | YES |
| [Cut and Run](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100851) | hold-out | unseen electronic | 109 | NO |

The chosen rock candidate is **Bet You Can**. Its author writes “Major props to the drummer”; that is not sufficient independent evidence of the required live-drummed, mildly drifting recording. No claim that this requirement was fulfilled. Its timing failures are reported, not explained away as permitted drift. The sparse label for Deliberate Thought is a pre-evaluation catalog-based selection, not a human listening judgment.

## Measured values

Each cell contains the value and PASS/FAIL. Percentages are in percent; confidence is 0–1. Source 69 BPM folds to 138 BPM, explicitly flagged as octave folded.

### Killing Time

- first: 0.00–90.00 s; estimated 99.99 BPM, DP 100.23 BPM; offset 1.82 ms; 232 notes; analysis/artifact preparation 2.68 s. Thirds phase shifts: 13.97, 10.97, 6.97 ms.
- middle: 72.03–132.03 s; estimated 100.04 BPM, DP 100.23 BPM; offset 586.11 ms; 186 notes; analysis/artifact preparation 7.62 s. Thirds phase shifts: 0.12, 7.12, -283.88 ms.

| Check | Frozen threshold | First 90 s | Middle 60 s |
|---|---|---:|---:|
| Tempo error (BPM) | ≤2 | 0.01 PASS | 0.04 PASS |
| Estimator disagreement (%) | ≤2 | 0.24 PASS | 0.19 PASS |
| Thirds phase drift (ms) | ≤30 | 7.00 PASS | 291.00 FAIL |
| Top-decile coverage (%) | ≥70 | 100.00 PASS | 100.00 PASS |
| Salient-note precision (%) | ≥80 | 76.72 FAIL | 59.68 FAIL |
| Density-valid windows (%) | ≥90; max ≤5 | 78.00 FAIL | 97.12 PASS |
| Max same-lane run | ≤3 | 1.00 PASS | 2.00 PASS |
| Min same-lane gap (ms) | ≥150 | 600.00 PASS | 299.00 PASS |
| Chord share (%) | ≤10 | 0.00 PASS | 0.00 PASS |
| Max chord | ≤2 | 1.00 PASS | 1.00 PASS |
| Min lane share (%) | ≥12 | 25.00 PASS | 24.73 PASS |
| Max lane share (%) | ≤40 | 25.00 PASS | 25.27 PASS |
| Confidence | ≥0.50 steady; <0.50 sparse | 0.66 PASS | 0.69 PASS |

### Griphop

- first: 0.00–90.00 s; estimated 90.00 BPM, DP 89.76 BPM; offset 16.06 ms; 249 notes; analysis/artifact preparation 11.56 s. Thirds phase shifts: -333.33, 332.67, -333.33 ms.
- middle: 73.37–133.37 s; estimated 90.00 BPM, DP 89.76 BPM; offset 316.08 ms; 141 notes; analysis/artifact preparation 6.07 s. Thirds phase shifts: -0.33, -0.33, -0.33 ms.

| Check | Frozen threshold | First 90 s | Middle 60 s |
|---|---|---:|---:|
| Tempo error (BPM) | ≤2 | 0.00 PASS | 0.00 PASS |
| Estimator disagreement (%) | ≤2 | 0.27 PASS | 0.27 PASS |
| Thirds phase drift (ms) | ≤30 | 0.67 PASS | 0.00 PASS |
| Top-decile coverage (%) | ≥70 | 100.00 PASS | 100.00 PASS |
| Salient-note precision (%) | ≥80 | 89.56 PASS | 96.45 PASS |
| Density-valid windows (%) | ≥90; max ≤5 | 99.21 PASS | 91.53 PASS |
| Max same-lane run | ≤3 | 2.00 PASS | 1.00 PASS |
| Min same-lane gap (ms) | ≥150 | 333.00 PASS | 666.00 PASS |
| Chord share (%) | ≤10 | 0.80 PASS | 0.00 PASS |
| Max chord | ≤2 | 2.00 PASS | 1.00 PASS |
| Min lane share (%) | ≥12 | 24.90 PASS | 24.82 PASS |
| Max lane share (%) | ≤40 | 25.30 PASS | 25.53 PASS |
| Confidence | ≥0.50 steady; <0.50 sparse | 0.56 PASS | 0.63 PASS |

### Bet You Can

- first: 0.00–90.00 s; estimated 120.69 BPM, DP 121.49 BPM; offset 244.49 ms; 192 notes; analysis/artifact preparation 11.14 s. Thirds phase shifts: 46.43, 112.43, 56.43 ms.
- middle: 69.13–129.13 s; estimated 120.57 BPM, DP 121.49 BPM; offset 297.15 ms; 122 notes; analysis/artifact preparation 7.52 s. Thirds phase shifts: -52.82, 163.18, -80.82 ms.

| Check | Frozen threshold | First 90 s | Middle 60 s |
|---|---|---:|---:|
| Tempo error (BPM) | ≤2 | 28.69 FAIL | 28.57 FAIL |
| Estimator disagreement (%) | ≤2 | 0.66 PASS | 0.76 PASS |
| Thirds phase drift (ms) | ≤30 | 66.00 FAIL | 244.00 FAIL |
| Top-decile coverage (%) | ≥70 | 75.00 PASS | 66.67 FAIL |
| Salient-note precision (%) | ≥80 | 36.98 FAIL | 40.98 FAIL |
| Density-valid windows (%) | ≥90; max ≤5 | 98.88 PASS | 95.42 PASS |
| Max same-lane run | ≤3 | 1.00 PASS | 1.00 PASS |
| Min same-lane gap (ms) | ≥150 | 870.00 PASS | 995.00 PASS |
| Chord share (%) | ≤10 | 0.00 PASS | 0.00 PASS |
| Max chord | ≤2 | 1.00 PASS | 1.00 PASS |
| Min lane share (%) | ≥12 | 25.00 PASS | 24.59 PASS |
| Max lane share (%) | ≤40 | 25.00 PASS | 25.41 PASS |
| Confidence | ≥0.50 steady; <0.50 sparse | 0.03 FAIL | 0.04 FAIL |

### Deliberate Thought

- first: 0.00–90.00 s; estimated 138.00 BPM, DP 138.24 BPM; offset 19.63 ms; 323 notes; analysis/artifact preparation 11.40 s. Thirds phase shifts: -1.39, -0.39, -1.39 ms.
- middle: 58.73–118.73 s; estimated 138.00 BPM, DP 138.24 BPM; offset 422.10 ms; 200 notes; analysis/artifact preparation 7.11 s. Thirds phase shifts: -1.39, -0.39, -0.39 ms.

| Check | Frozen threshold | First 90 s | Middle 60 s |
|---|---|---:|---:|
| Tempo error (BPM) | ≤2 | 0.00 PASS | 0.00 PASS |
| Estimator disagreement (%) | ≤2 | 0.18 PASS | 0.18 PASS |
| Thirds phase drift (ms) | ≤30 | 1.00 PASS | 1.00 PASS |
| Top-decile coverage (%) | ≥70 | 100.00 PASS | 100.00 PASS |
| Salient-note precision (%) | ≥80 | 81.73 PASS | 83.00 PASS |
| Density-valid windows (%) | ≥90; max ≤5 | 97.87 PASS | 98.81 PASS |
| Max same-lane run | ≤3 | 1.00 PASS | 2.00 PASS |
| Min same-lane gap (ms) | ≥150 | 652.00 PASS | 435.00 PASS |
| Chord share (%) | ≤10 | 0.62 PASS | 2.00 PASS |
| Max chord | ≤2 | 2.00 PASS | 2.00 PASS |
| Min lane share (%) | ≥12 | 24.77 PASS | 25.00 PASS |
| Max lane share (%) | ≤40 | 25.08 PASS | 25.00 PASS |
| Confidence | ≥0.50 steady; <0.50 sparse | 0.40 PASS | 0.40 PASS |

### Cut and Run

- first: 0.00–90.00 s; estimated 107.15 BPM, DP 107.39 BPM; offset 0.45 ms; 198 notes; analysis/artifact preparation 11.44 s. Thirds phase shifts: 32.02, 75.02, -6.98 ms.
- middle: 77.42–137.42 s; estimated 106.92 BPM, DP 107.39 BPM; offset 132.61 ms; 185 notes; analysis/artifact preparation 7.31 s. Thirds phase shifts: 276.42, -173.58, 246.42 ms.

| Check | Frozen threshold | First 90 s | Middle 60 s |
|---|---|---:|---:|
| Tempo error (BPM) | ≤2 | 1.85 PASS | 2.08 FAIL |
| Estimator disagreement (%) | ≤2 | 0.22 PASS | 0.44 PASS |
| Thirds phase drift (ms) | ≤30 | 82.00 FAIL | 141.17 FAIL |
| Top-decile coverage (%) | ≥70 | 97.73 PASS | 87.50 PASS |
| Salient-note precision (%) | ≥80 | 41.92 FAIL | 52.43 FAIL |
| Density-valid windows (%) | ≥90; max ≤5 | 87.65 FAIL | 98.47 PASS |
| Max same-lane run | ≤3 | 2.00 PASS | 2.00 PASS |
| Min same-lane gap (ms) | ≥150 | 560.00 PASS | 280.00 PASS |
| Chord share (%) | ≤10 | 1.01 PASS | 1.08 PASS |
| Max chord | ≤2 | 2.00 PASS | 2.00 PASS |
| Min lane share (%) | ≥12 | 24.75 PASS | 24.86 PASS |
| Max lane share (%) | ≤40 | 25.25 PASS | 25.41 PASS |
| Confidence | ≥0.50 steady; <0.50 sparse | 0.37 FAIL | 0.35 FAIL |

## Diagnosis and decision required

The current global-tempo and snapping pipeline is not reliable enough for the intended claim. The tuning rock candidate resolves to an incorrect tempo near 121 BPM instead of 92 BPM. On other recordings, notes can miss above-median salient events and the opening/arrangement can violate the minimum density target even though lane safety constraints hold. Fixed-grid timing and onset strength selection therefore need evaluation beyond synthetic clicks. Sparse-track confidence is explicitly checked rather than treating every file as suitable. No thresholds were relaxed, no hold-out was used for tuning, and calibration was not used to excuse drift. Ada and claude2 must decide the next step; the suggested fallback is to review the artifacts before authorizing any narrower claim or analyzer-only release.

## Listening artifacts and attribution

Local root: C:/Dev/personal/beatcarve/gate/artifacts/. Each stem below has .wav (original excerpt + 1600 Hz detected-beat clicks + 600–900 Hz lane-note clicks), .json (chart, no audio), and .txt (lane/density plot). FFmpeg downmixes to mono 22050 Hz; original level is reduced to leave click headroom. These are listening artifacts, not evidence anyone listened.

- "Killing Time" Kevin MacLeod (incompetech.com), CC BY 4.0. Gate overlays add analysis clicks and use excerpts.
  - gate/artifacts/Killing-Time-first.{wav,json,txt}
  - gate/artifacts/Killing-Time-middle.{wav,json,txt}
  - SHA-256: d69c69faa1ec5f65fc6efed4278e28c3d1b34d8193a2bf06b0fe5a73084f1916
- "Griphop" Kevin MacLeod (incompetech.com), CC BY 4.0. Gate overlays add analysis clicks and use excerpts.
  - gate/artifacts/Griphop-first.{wav,json,txt}
  - gate/artifacts/Griphop-middle.{wav,json,txt}
  - SHA-256: eb4d53bbf9a87461a5df7a5bc68ea56b45ccfa85bd37c55e3a97b737170e034e
- "Bet You Can" Kevin MacLeod (incompetech.com), CC BY 4.0. Gate overlays add analysis clicks and use excerpts.
  - gate/artifacts/Bet-You-Can-first.{wav,json,txt}
  - gate/artifacts/Bet-You-Can-middle.{wav,json,txt}
  - SHA-256: 0e06dc0e7a2f8b9824df4fd278c12d3beb19622ee69953c94a122aaccfad94be
- "Deliberate Thought" Kevin MacLeod (incompetech.com), CC BY 4.0. Gate overlays add analysis clicks and use excerpts.
  - gate/artifacts/Deliberate-Thought-first.{wav,json,txt}
  - gate/artifacts/Deliberate-Thought-middle.{wav,json,txt}
  - SHA-256: 243d5543c930bf54e95868bab9da860e67ce8835e3698881fda287bc58cc343f
- "Cut and Run" Kevin MacLeod (incompetech.com), CC BY 4.0. Gate overlays add analysis clicks and use excerpts.
  - gate/artifacts/Cut-and-Run-first.{wav,json,txt}
  - gate/artifacts/Cut-and-Run-middle.{wav,json,txt}
  - SHA-256: ddfa5637036e97a313a2e7a01d37d00f85226469cf4df896c83da07f7f2c353e

Raw measurements: gate/tuning-results.json and gate/final-results.json (gitignored). Reproduce with npm run gate:fetch and npm run gate -- --final. A future run cannot be called unseen after these results have been inspected.

## Not verified / scope held

No human feel or fun assessment, morning playtest, real-device latency, browser audio-clock synchronization, browser analysis speed, or calibration effectiveness. The 26 synthetic tests verify timing and tempo ambiguity, not musical quality. One Playwright test verifies only the empty scaffold. Worker, file drop, gameplay, calibration UI, tempo/offset controls, demo license and export UI remain unbuilt, as required by the checkpoint. The game is not ready for JJ to play; JJ can listen to these artifacts.

## Git and CI

Pushed directly to main under the explicit nightly exception. No feature branch or PR; no AI-attribution trailers. CI outcome is recorded in BUILD-NOTES.md after the hosted jobs finish. The inherited deployment workflow publishes only an empty scaffold at this checkpoint.
