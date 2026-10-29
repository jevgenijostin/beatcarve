# Night 1 — 2026-10-29/30

## Scope shipped

Headless checkpoint only: Vite/TypeScript scaffold, CI matrix, FFT, log-spectral onset flux, median/MAD peak picking, autocorrelation tempo, phase refinement, dynamic-programming beats, confidence, deterministic Normal/Easy tap charts, licensed acquisition and gate artifacts. No game UI has been started.

## Interpretation decisions

- The user's explicit nightly exception overrides the general branch convention: push directly to main, no branch or PR. No attribution trailers.
- The repository already existed empty with origin configured and main selected; it was not recreated.
- Gate thresholds and the 3/2 split were recorded in GATE-PROTOCOL.md before real-music analysis.
- Density is evaluated over half-open 1-second windows. The generator drops weaker candidate events first, then assigns lanes; optional two-note chords must also fit density and spacing.
- Beat phase has an unavoidable half-time ambiguity on equal pulses. The first detected event anchors the alternating-pulse ambiguity.
- Synthetic failures led to phase-coherence refinement near the autocorrelation tempo and stronger MAD noise rejection. No acceptance threshold was relaxed.
- Vitest timeout increased from 5 to 20 seconds for CPU-heavy 44.1 kHz property cases; this is a harness timeout, not an audio performance acceptance threshold.
- The source catalog's rock track credits a drummer but does not independently establish live playing or mild drift. Report this corpus deficiency.
- Phase-zero and phase-one work are pushed together after validation; the scaffold remains an empty page.

## Local verification

Pending final test and gate results. Synthetic tests verify timing and tempo ambiguity. They cannot certify that the charts are fun. That is what the real-music gate and morning human check are for.
Judgment, fake-clock, calibration, browser file loading and export-schema tests are deferred with their implementations; no claim that these exist.

## Manual-play observations

None. No game UI or human playtest exists at this checkpoint.

## What is not verified

Feel, fun, human playability, real-device latency, browser decoding or performance, audio-clock sync, mobile/accessibility, and the complete required corpus's live-drumming provenance.

## Deployment

Direct main push and CI status will be recorded after validation. The copied Pages workflow can publish only the empty scaffold at this stage; this is not a game release.
