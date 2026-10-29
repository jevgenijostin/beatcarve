# Killing Time diagnosis — before implementation changes

Only Killing Time was decoded or inspected for this diagnosis. Reproduce with
`node --experimental-strip-types gate/diagnose-killing-time.ts`.
The committed JSON trace records every detected onset and each rendered note's
strongest surviving source candidate. No Cut and Run per-note data was inspected.

## Reference validation and limits

There are **no independent ground-truth onset annotations** for Killing Time in
this gate. GATE-PROTOCOL.md explicitly defines internal detector proxies.
Consequently, independent musical onset accuracy cannot honestly be confirmed.
The reference is sound as the frozen computational definition, not as annotated
musical truth: unrounded detector timestamps in excerpt-relative seconds,
strictly above the median detector strength, compared with millisecond chart
timestamps converted back to seconds, within 40 ms. The reproduced counts below
match the published precision exactly. Centered excerpt starts at 72.034289 s;
both reference and chart use local time, so no absolute/local offset mismatch
exists. No human listening or independent annotation validation is claimed.

This limitation prevents attributing detector events to instrument attacks or
declaring a genre limitation. It does not prevent proving an onset-to-note
association bug directly from the recorded input/output timestamps. The fix
below requires no assumption that any detector event is musically correct.

## Stage breakdown

| Measurement | First 90 s | Middle 60 s |
|---|---:|---:|
| Detected onsets | 530 | 362 |
| Median detector strength | 74.913690 | 86.793502 |
| Rendered notes | 232 | 186 |
| Notes within 40 ms of above-median onset | 178 | 111 |
| Precision | 76.7241% | 59.6774% |
| Precision misses sourced from above-median onset | 37 | 32 |
| Precision misses sourced from weaker onset | 17 | 43 |
| Notes displaced over 60 ms from their own source | 50 | 52 |

1. **Onset detection quality:** independent false-positive/false-negative rates
   are unknown because no annotated truth exists. The detector emits 5.89 and
   6.03 events/s. These counts alone do not establish false positives, dense
   real instruments, or a genre limitation. Detection code remains untouched.
2. **Salience selection:** Normal admits candidates at 0.7 times median,
   whereas the gate's precision reference requires strictly above median.
   Weak-source notes account for 17/54 and 43/75 misses. This is an existing
   selection/acceptance mismatch, not evidence that the reference is erroneous.
   No selection threshold will be changed.
3. **Mapping/snapping:** 37/54 and 32/75 misses originate in salient sources
   but end away from any salient event after snapping. The final predicate
   checks proximity to **any** detected onset, rather than the candidate's
   originating onset. Thus unrelated weak events can authorize moving a strong
   source far away and inheriting its strength/bands at the wrong time.
   This is a concrete identity-association bug, independent of genre or truth
   labels. Preserve the existing 60 ms tolerance but apply it to the source.
   Removing invalid associations is not guaranteed to meet density or precision.

## Phase hypothesis: corrected

| Thirds' maximizing phase relative to offset (ms) | First 90 s | Middle 60 s |
|---|---|---|
| Full beat, frozen metric | 13.970, 10.970, 6.970 | 0.120, 7.120, -283.880 |
| Eighth-note modulus, diagnostic only | 12.985, 10.985, 6.985 | 0.060, 8.060, 16.060 |
| Sixteenth-note modulus, diagnostic only | 12.992, 10.992, 6.992 | 0.030, 7.030, 16.030 |

Tempo is 99.99 / 100.04 BPM. The middle spike is a switch in the winning
full-beat phase to the opposite half beat; the actual eighth-note lattice has
16 ms spread, not 291 ms. Half-beat shifts leave the generator's eighth and
sixteenth grids unchanged. The gate measures onset emphasis, not the DP beat
path or chart-grid tracking; changing chart mapping cannot change that row.
The suggested co-movement therefore does not establish phase tracking as the
root cause. No phase/tempo algorithm or frozen metric will be changed.

## Decision before fix

Proceed only with the proven source-association bug. This is **not** a finding
of genre limitation, and it is not a promise of a full gate pass. Independent
annotation quality remains unverified and must not be represented otherwise.
Start the 60-minute implementation cap after this document is written.
Keep all thresholds, tempo estimation, autocorrelation, and phase logic intact.
Use Cut and Run once in the final rerun, labeled previously seen, not a clean
hold-out. A new track is omitted to keep this a targeted reproducible cycle.
