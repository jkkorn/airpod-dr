import { playTone } from '../audio/engine'
import { TONE_DURATION_MS } from '../audio/constants'
import { Answers, SwapOutcome } from '../diagnostics/types'
import { ChoiceRow, PlayButton, StepShell } from './ui'

// Step 2 (conditional). Only shown when the buds disagreed. This is the step
// that lets the verdict say "likely your ears" instead of falsely blaming the
// hardware: if the weak side moves to the other ear when you swap buds, it's the
// bud; if it stays in the same ear, it's your hearing or fit.
export function SwapTest(props: {
  step: number
  total: number
  answers: Answers
  setAnswers: (fn: (prev: Answers) => Answers) => void
  onBack: () => void
  onNext: () => void
}) {
  const a = props.answers
  const options: { value: SwapOutcome; label: string; tone?: 'good' | 'warn' | 'bad' }[] = [
    { value: 'follows-bud', label: 'It moved to my other ear', tone: 'bad' },
    { value: 'stays-ear', label: 'It stayed in the same ear', tone: 'good' },
    { value: 'skipped', label: 'Not sure / skip' },
  ]

  return (
    <StepShell
      step={props.step}
      total={props.total}
      title="Quick check: is it the bud, or your ears?"
      subtitle="One side seemed off. Physically swap the buds between your ears (left bud into right ear and vice versa), then replay both and notice where the weak/quiet side ends up."
      onBack={props.onBack}
      onNext={props.onNext}
      nextDisabled={a.swapOutcome === null}
    >
      <div className="row">
        <PlayButton
          label="Play LEFT channel"
          busyMs={TONE_DURATION_MS}
          onPlay={() => playTone({ freqHz: 1000, pan: 'left', durationMs: TONE_DURATION_MS })}
        />
        <PlayButton
          label="Play RIGHT channel"
          busyMs={TONE_DURATION_MS}
          onPlay={() => playTone({ freqHz: 1000, pan: 'right', durationMs: TONE_DURATION_MS })}
        />
      </div>

      <p className="q">With the buds swapped, the weak/quiet side…</p>
      <ChoiceRow
        options={options}
        value={a.swapOutcome}
        onChange={(v) => props.setAnswers((p) => ({ ...p, swapOutcome: v }))}
      />
    </StepShell>
  )
}
