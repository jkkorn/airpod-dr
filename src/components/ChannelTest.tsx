import { playTone } from '../audio/engine'
import { TONE_DURATION_MS } from '../audio/constants'
import { Answers } from '../diagnostics/types'
import { ChoiceRow, PlayButton, StepShell } from './ui'

const YES_NO = [
  { value: 'yes' as const, label: 'Yes', tone: 'good' as const },
  { value: 'no' as const, label: 'No', tone: 'bad' as const },
]

function toBool(v: 'yes' | 'no'): boolean {
  return v === 'yes'
}

function fromBool(b: boolean | null): 'yes' | 'no' | null {
  if (b === null) return null
  return b ? 'yes' : 'no'
}

// Step 1. Is each bud alive at all, and is the pair balanced? This is the
// cheapest, highest-signal check and gates whether the swap test is needed.
export function ChannelTest(props: {
  step: number
  total: number
  answers: Answers
  setAnswers: (fn: (prev: Answers) => Answers) => void
  onBack: () => void
  onNext: () => void
}) {
  const a = props.answers
  const ready = a.leftAudible !== null && a.rightAudible !== null && a.centerBalanced !== null

  return (
    <StepShell
      step={props.step}
      total={props.total}
      title="Is each bud alive?"
      subtitle="Play each side and tell me what you heard. Hold each bud near your ear if you're not sure."
      onBack={props.onBack}
      onNext={props.onNext}
      nextDisabled={!ready}
    >
      <div className="qcard">
        <PlayButton
          label="Play in LEFT"
          busyMs={TONE_DURATION_MS}
          onPlay={() => playTone({ freqHz: 1000, pan: 'left', durationMs: TONE_DURATION_MS })}
        />
        <p className="q">Did the left bud play?</p>
        <ChoiceRow
          options={YES_NO}
          value={fromBool(a.leftAudible)}
          onChange={(v) => props.setAnswers((p) => ({ ...p, leftAudible: toBool(v) }))}
        />
      </div>

      <div className="qcard">
        <PlayButton
          label="Play in RIGHT"
          busyMs={TONE_DURATION_MS}
          onPlay={() => playTone({ freqHz: 1000, pan: 'right', durationMs: TONE_DURATION_MS })}
        />
        <p className="q">Did the right bud play?</p>
        <ChoiceRow
          options={YES_NO}
          value={fromBool(a.rightAudible)}
          onChange={(v) => props.setAnswers((p) => ({ ...p, rightAudible: toBool(v) }))}
        />
      </div>

      <div className="qcard">
        <PlayButton
          label="Play in BOTH"
          busyMs={TONE_DURATION_MS}
          onPlay={() => playTone({ freqHz: 1000, pan: 'center', durationMs: TONE_DURATION_MS })}
        />
        <p className="q">Did it sound centered and equal in both ears?</p>
        <ChoiceRow
          options={YES_NO}
          value={fromBool(a.centerBalanced)}
          onChange={(v) => props.setAnswers((p) => ({ ...p, centerBalanced: toBool(v) }))}
        />
      </div>
    </StepShell>
  )
}
