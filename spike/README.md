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

### Observed run (first real device)

- **Device:** iPhone, **iOS 18.7 / Safari 26.5**
- **Test 1 (setSinkId):** `setSinkId` on `<audio>` = **true** (AudioContext = false). Output control IS available — contradicts the design's assumption.
- **Test 2 (reroute):** Log recorded "stayed on AirPods"; captured RMS was only **0.0131** (faint), which objectively corroborates the sound stayed in the sealed in-ear AirPods, not the phone speaker. A brief audible route-blip at mic-open is expected and settles.
- **Test 3 (capture):** **48 kHz full-band** capture while playing (track rate 24 kHz) — **no HFP collapse**. Peak RMS 0.0131, but the bud was IN-EAR, so the phone mic mostly heard ambient, not the bud. Needs a re-run with the bud held to the phone.

**Revised conclusion (pending confirmation):** the design's predictions (setSinkId unsupported, reroute to speaker, 16 kHz collapse) appear to be **outdated** — they matched older iOS. On iOS 18.7, full-band record-while-playing works and output stays on the AirPods, so **Approach B may be buildable as a web app**, not native. Re-run spike v2 with the bud held to the phone mic (Test 3) to confirm the driver is actually captured full-band before committing to the web path.

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
