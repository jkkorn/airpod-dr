import { playTone } from '../audio/engine'
import { FREQ_LABELS, TONE_DURATION_MS, TONE_FREQS } from '../audio/constants'
import { Answers, Bud, ToneVerdict } from '../diagnostics/types'
import { ChoiceRow, Choice, PlayButton, StepShell } from './ui'

const TONE_OPTIONS: Choice<ToneVerdict>[] = [
  { value: 'clear', label: 'Clear', tone: 'good' },
  { value: 'weak', label: 'Weak / muffled', tone: 'warn' },
  { value: 'rattle', label: 'Rattle / buzz', tone: 'warn' },
  { value: 'silent', label: 'Nothing', tone: 'bad' },
]

const SIDE: Record<Bud, string> = { left: 'left', right: 'right' }

// Steps 3 & 4. Sweep the four diagnostic tones through one bud. Weakness
// concentrated in the highs (4k/8k) is the clog/water signature.
export function ToneTest(props: {
  step: number
  total: number
  bud: Bud
  answers: Answers
  setAnswers: (fn: (prev: Answers) => Answers) => void
  onBack: () => void
  onNext: () => void
}) {
  const { bud } = props
  const recorded = props.answers.tones[bud]
  const allAnswered = TONE_FREQS.every((f) => Boolean(recorded[f]))

  const set = (freq: number, v: ToneVerdict) =>
    props.setAnswers((p) => ({
      ...p,
      tones: { ...p.tones, [bud]: { ...p.tones[bud], [freq]: v } },
    }))

  return (
    <StepShell
      step={props.step}
      total={props.total}
      title={`How does the ${SIDE[bud]} bud sound, tone by tone?`}
      subtitle={`Each tone plays only in the ${SIDE[bud]} bud. Compare it to how the other side sounded.`}
      onBack={props.onBack}
      onNext={props.onNext}
      nextDisabled={!allAnswered}
    >
      {TONE_FREQS.map((freq) => (
        <div className="qcard" key={freq}>
          <PlayButton
            label={`Play ${FREQ_LABELS[freq] ?? `${freq} Hz`}`}
            busyMs={TONE_DURATION_MS}
            onPlay={() => playTone({ freqHz: freq, pan: bud, durationMs: TONE_DURATION_MS })}
          />
          <ChoiceRow options={TONE_OPTIONS} value={recorded[freq] ?? null} onChange={(v) => set(freq, v)} />
        </div>
      ))}
    </StepShell>
  )
}
