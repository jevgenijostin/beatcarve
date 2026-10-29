# BeatCarve

**Status: headless research checkpoint, not a playable game.** See [GATE-REPORT.md](GATE-REPORT.md) for the acceptance result when evaluation completes. Phase 3 is blocked pending the requested checkpoint review.

The intended product is a local, client-side rhythm game for **songs with a clear, steady beat**. The intended "about 10 seconds" claim is not yet verified. Ambient, classical, rubato, sparse percussion, and drifting live recordings may produce poor charts.

The current implementation is pure TypeScript DSP and chart generation, with no runtime dependencies. It uses a Hann-window STFT, positive log-spectral flux, local median/MAD peak picking, autocorrelation with a log-normal tempo prior, phase refinement, dynamic-programming beat tracking, and deterministic four-lane tap charts. Tempo folds into [80,160): 70 becomes 140; 170 becomes 85.

Audio is never committed or hosted. The planned browser app will keep local audio in the browser and never upload it. The development gate downloads licensed recordings locally and creates ignored listening artifacts.

## Run the checkpoint

Requires Node 24+, npm, FFmpeg and FFprobe on PATH.

- npm ci
- npm run typecheck
- npm run lint
- npm test
- npx playwright install chromium
- npm run test:e2e
- npm run build
- npm run gate:fetch
- npm run gate — tuning tracks only
- npm run gate -- --final — includes both hold-outs; do not use during tuning

Sources, checksums and attribution are in scripts/fetch-gate-tracks.ts. The gate protocol is frozen in GATE-PROTOCOL.md. Audio, overlays, chart JSON and plots remain local under gate/.

## Not built

The worker, file picker, keyboard game, canvas highway, judgment, calibration, setup controls, browser export and demo licensing are intentionally deferred until the acceptance checkpoint. Calibration would correct a consistent offset only; it cannot repair timing drift. There are no play instructions because no game is available yet.

Later roadmap, not built: chart editor, Clone Hero .chart and osu! .osu export, and custom difficulty tuning.
