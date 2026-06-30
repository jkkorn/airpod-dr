# AirPod Survival Check

A free, open-source way to check whether damaged or secondhand AirPods still work.
Dropped them, ran them through the wash, or buying a used pair? This plays a short
sequence of test sounds and asks you what you heard, then gives an honest per-bud
verdict and a next step.

It runs entirely in your browser. **No install, no account, no upload, no microphone.**

## Why this exists

Apple exposes no AirPods health data to anyone over the air. Battery health, cycle
count, and any mic/speaker diagnostic live only inside Apple's own service tools.
So you can't *read* whether an AirPod survived. You can only *test* it, the same way
Apple's in-store fixture does: play a known sound, judge the result. This is the
honest, software-only version of that.

See `.context/airpods-diagnostics-research.md` for the full API research and the
design doc in `~/.gstack/projects/jkkorn-airpod-dr/` for the rationale.

## What it checks (v1)

- **Each bud is alive** (channel test) and the pair is balanced.
- **Is it the bud or your ears?** A physical swap test, only when the sides disagree.
- **Tone by tone** (250 Hz / 1 kHz / 4 kHz / 8 kHz) per bud. Weakness concentrated in
  the highs is the classic clogged-mesh / water signature.
- **A continuous sweep** per bud to catch a narrow dead spot or rattle.

It is a **relative listening test**, not a calibrated measurement: it compares your two
buds and flags what to recheck. By design it never declares hardware dead, the worst it
says is "silent / weak / rattle", always with a dry-and-retest path first.

## What it does not do (yet)

- **Measured frequency-response fingerprint** (Approach B). Recording the sound back for an
  objective per-bud curve has to be a native iOS app: on iOS Safari, opening the microphone
  reroutes audio off the AirPods entirely (`getUserMedia` forces the built-in speaker,
  `setSinkId` is unsupported). That is the next milestone.
- **Battery health.** Not measurable in software (no AirPods telemetry exists). A guided
  discharge-time proxy is a possible later add.
- **A crowdsourced degradation dataset** (Approach C, the north star).

## Run it locally

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
```

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to
`main`. The Vite `base` is relative, so it also works on Vercel or any static host with
no changes.

## License

MIT.
