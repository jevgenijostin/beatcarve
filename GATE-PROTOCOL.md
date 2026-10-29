# Gate protocol — frozen before real-music analysis

Normal charts, first 90 seconds and centered 60 seconds; both excerpts must pass each row. No trimming silence or introductions. Rolling windows start every 100 ms and use [start, start + 1 s). No threshold changes after evaluation.

| Check | Threshold |
|---|---|
| Folded BPM vs source metadata | absolute error ≤2 BPM; octave ambiguity flagged |
| Autocorrelation vs DP median interval | relative difference ≤2% |
| Grid drift | all pairwise circular differences between first/middle/last third beat phases ≤30 ms |
| Top-decile detected onset coverage | ≥70% within 60 ms |
| Notes near above-median detected onsets | ≥80% within 40 ms |
| Rolling density | ≥90% windows between 0.8 and 5 notes/s |
| Same-lane run | ≤3 |
| Same-lane spacing | ≥150 ms |
| Notes belonging to chords / largest chord | ≤10% / ≤2 |
| Lane share | each ≥12% and ≤40% |
| Confidence | ≥0.50 steady; <0.50 sparse/drifting |

Detected-onset metrics are internal proxies, not independently annotated onset truth. Grid drift uses onset phases against the global grid, not rendered grid timestamps (which would be circular). Confidence combines autocorrelation prominence, DP agreement, and DP interval variability.

Tuning: Killing Time (electronic), Griphop (hip-hop), Bet You Can (rock candidate).
Hold-outs: Deliberate Thought (sparse), Cut and Run (unseen electronic).
Hold-out audio will not be decoded, analyzed, or listened to until final evaluation; metadata and byte checksums may be read for acquisition.
The rock candidate's source credits a drummer, but live performance and mild drift remain unverified. This must block a full corpus-compliant PASS unless independently established.

PASS requires ≥4/5 complete track passes including unseen Cut and Run; one explained exception.
PARTIAL means some but insufficient complete track passes. FAIL means zero complete track passes.
Acquisition/decode failures mean NOT RUN: BLOCKED. No continuation to Phase 3 without reporting and receiving the checkpoint decision.
