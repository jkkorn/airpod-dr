# Spike: can we build the measured fingerprint (Approach B)?

Approach B plots a real per-bud frequency-response curve by playing a sweep to the AirPods
and recording it back. The load-bearing question from the design doc: **can a browser do the
record-while-playing loopback on iOS, or does opening the microphone kick audio off the
AirPods?** This folder answers it empirically before anyone writes the real thing.

## Part 1 — Web spike (run this first, no Xcode needed)

Runnable page: **`public/spike/safari-routing.html`**, deployed at
`https://jkkorn.github.io/airpod-dr/spike/safari-routing.html`.

Open it in **Safari on an iPhone with AirPods connected** and run the three tests. It logs
everything on-screen so you can read results on the phone.

| Test | What it measures | Design's predicted result |
|------|------------------|---------------------------|
| 1. `setSinkId` support | Can a page pin output to the AirPods? | **Unsupported** on iOS Safari |
| 2. Reroute on mic open | Does the tone jump to the phone speaker when `getUserMedia` fires? | **Yes, it moves to the speaker** |
| 3. Loopback capture sample rate | 16 kHz = telephony/HFP path; 44.1/48 kHz = full-band | Expected **16 kHz** or output-on-speaker |

### Decision rule

- **If tests confirm the prediction** (setSinkId unsupported, output reroutes, 16 kHz capture):
  the web loopback is dead. Approach B must be a **native iOS app** — proceed to Part 2.
- **If the prediction is wrong** (output stays on AirPods, full-band capture): stop and
  reconsider, because a web-only Approach B just became possible and that is a much cheaper path.

Record the actual outcome here when you run it:

```
Date run:
Device / iOS version:
Test 1 (setSinkId):
Test 2 (reroute observed?):
Test 3 (capture sample rate / peak RMS):
Conclusion:
```

## Part 2 — Native iOS scaffold (only if Part 1 confirms native is required)

`spike/ios/AudioLoopback.swift` is a starting skeleton, not a finished app. Drop it into a
SwiftUI iOS project in Xcode. It encodes the one hypothesis the native path rests on:

> With `AVAudioSession` category `.playAndRecord`, **mode `.measurement`**, and option
> `.allowBluetoothA2DP` (NOT `.allowBluetooth`), plus the preferred input forced to the
> **built-in mic**, iOS keeps high-quality A2DP output to the AirPods while you record a flat,
> unprocessed signal from the phone's own mic.

`.measurement` mode is the key: it disables most of the input-side processing (AGC, EQ,
noise suppression) that would otherwise wreck a frequency-response measurement. `.allowBluetooth`
(without `A2DP`) is the trap: it forces the HFP/SCO path and collapses everything to 8-16 kHz.

What the scaffold does and what you still need to build:

- [x] Configure the session (the crux, above)
- [x] Play an exponential sine sweep via `AVAudioEngine`
- [x] Tap the input node and accumulate RMS as a smoke test that capture works
- [ ] Deconvolve the recording against the known sweep into an impulse response / frequency curve
- [ ] Compare left vs right (same session) and flag relative anomalies
- [ ] Confirm on-device that output actually stays on the AirPods (log the current route)

The math for the deconvolution (exponential sine sweep, Farina method) is well documented; the
scaffold deliberately stops before it so the first real task is verifying the routing hypothesis,
not writing DSP.
