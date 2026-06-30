import { playTone } from '../audio/engine'
import { TONE_DURATION_MS } from '../audio/constants'
import { PlayButton, StepShell } from './ui'

// Step 0. The web page cannot force audio to the AirPods (setSinkId is
// unsupported on iOS Safari), so we cannot verify the route ourselves. We make
// the user confirm it with a real tone before any test runs.
export function Setup(props: { step: number; total: number; onNext: () => void }) {
  return (
    <StepShell
      step={props.step}
      total={props.total}
      title="First, let's make sure we're testing the right thing"
      subtitle="This runs entirely on your device. No sign-in, no upload, no microphone. It plays sounds and you tell it what you heard."
      onNext={props.onNext}
      nextLabel="I heard the tone — start"
    >
      <ol className="setup-list">
        <li>Put both AirPods in and connect them to this device.</li>
        <li>Set your volume to about half.</li>
        <li>Tap below. You should hear a steady tone in both ears.</li>
      </ol>

      <PlayButton
        label="Play test tone"
        busyMs={TONE_DURATION_MS}
        onPlay={() => playTone({ freqHz: 1000, pan: 'center', durationMs: TONE_DURATION_MS })}
      />

      <p className="hint">
        Hear nothing? Make sure the AirPods (not the phone speaker) are the selected output, then try
        again. If the tone only comes from the phone, switch output to your AirPods first.
      </p>
    </StepShell>
  )
}
