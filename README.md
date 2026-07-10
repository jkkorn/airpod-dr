# AirPod Survival Check

A free, open-source toolkit for checking damaged or secondhand AirPods. Dropped
them, ran them through the wash, or buying a used pair? Two tools:

1. **Acoustic survival check** — plays a short sequence of test sounds and asks
   what you heard, then gives an honest per-bud verdict and a next step.
2. **Battery health estimate** — a guided full-discharge test that compares your
   real runtime against the model's as-new baseline, with an "is my wear normal
   for its age?" comparison.

It runs entirely in your browser. **No install, no account, no upload, no microphone.**

## Why this exists

Apple exposes no AirPods health data to anyone over the air. Battery health, cycle
count, and any mic/speaker diagnostic live only inside Apple's own service tools.
So you can't *read* whether an AirPod survived. You can only *test* it, the same way
Apple's in-store fixture does: play a known sound, judge the result. This is the
honest, software-only version of that.

See `.context/airpods-diagnostics-research.md` for the full API research and the
design doc in `~/.gstack/projects/jkkorn-airpod-dr/` for the rationale.

## What the survival check tests

- **Each bud is alive** (channel test) and the pair is balanced.
- **Is it the bud or your ears?** A physical swap test, only when the sides disagree.
- **Tone by tone** (250 Hz / 1 kHz / 4 kHz / 8 kHz) per bud. Weakness concentrated in
  the highs is the classic clogged-mesh / water signature.
- **A continuous sweep** per bud to catch a narrow dead spot or rattle.

It is a **relative listening test**, not a calibrated measurement: it compares your two
buds and flags what to recheck. By design it never declares hardware dead, the worst it
says is "silent / weak / rattle", always with a dry-and-retest path first. The verdict
rules live in `src/diagnostics/verdict.ts`.

## What the battery estimate does

There is no shortcut: AirPods expose no battery telemetry, so the only honest signal
is a timed full discharge. Pick your model, charge to 100%, start the timer (it
survives the tab closing), and tap "they died" when they do. The app compares your
runtime against the model's as-new baseline and against a modeled typical-wear curve
for the pair's age. Baselines and thresholds live in `src/battery/models.ts`.

## What it deliberately does not do

- **Measured frequency-response fingerprint** (Approach B) — **retired, confirmed
  impossible on-device.** The capture stack works (48 kHz record-while-playing is fine
  on modern iOS Safari), but the physics doesn't: iOS ear detection routes audio to the
  worn bud, and no phone mic can hear a sealed in-ear bud. The only working geometry —
  the bud's own inward-facing mic, which Apple's Ear Tip Fit Test uses — is locked
  behind a narrowband Bluetooth profile with no public API. A native app doesn't fix
  routing physics. Full post-mortem in `spike/README.md`.
- **Read health data directly.** Nobody can: Apple exposes no AirPods health telemetry
  over the air, and iOS hides even the live battery % from web pages. Everything here
  is a test or an estimate, never a sensor read.
- **A crowdsourced degradation dataset** (Approach C) — still the north star. The
  age-comparison curve is modeled today precisely so live aggregate data can drop in
  later without changing the UI.

## Run it locally

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests for the verdict + battery logic
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
```

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to
`main`. The Vite `base` is relative, so it also works on Vercel or any static host with
no changes.

## License

MIT.
