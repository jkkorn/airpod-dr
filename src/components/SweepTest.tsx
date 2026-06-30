import { playSweep } from '../audio/engine'
import { SWEEP } from '../audio/constants'
import { Answers, Bud, BUDS, SweepIssue } from '../diagnostics/types'
import { ChoiceRow, Choice, PlayButton, StepShell } from './ui'

const SWEEP_OPTIONS: Choice<SweepIssue>[] = [
  { value: 'none', label: 'Smooth all the way', tone: 'good' },
  { value: 'drop', label: 'Dropped out / faded', tone: 'warn' },
  { value: 'rattle', label: 'Rattled / buzzed', tone: 'warn' },
]

const SIDE: Record<Bud, string> = { left: 'left', right: 'right' }

// Step 5. A continuous sweep catches a narrow dead spot or rattle that the four
// discrete tones can step over. Marked optional and flagged as ear-dependent in
// the UI: age-related high-frequency loss can mimic a real drop-out.
export function SweepTest(props: {
  step: number
  total: number
  answers: Answers
  setAnswers: (fn: (prev: Answers) => Answers) => void
  onBack: () => void
  onNext: () => void
}) {
  const a = props.answers
  const allAnswered = BUDS.every((b) => a.sweep[b] !== null)

  const set = (bud: Bud, v: SweepIssue) =>
    props.setAnswers((p) => ({ ...p, sweep: { ...p.sweep, [bud]: v } }))

  return (
    <StepShell
      step={props.step}
      total={props.total}
      title="One smooth sweep per bud"
      subtitle="A rising tone from low to high. Listen for any spot where it vanishes or buzzes. (If you're older, the very top may be quiet to you even on a perfect bud — that's your ears, not the AirPod.)"
      onBack={props.onBack}
      onNext={props.onNext}
      nextLabel="See results"
      nextDisabled={!allAnswered}
    >
      {BUDS.map((bud) => (
        <div className="qcard" key={bud}>
          <PlayButton
            label={`Sweep the ${SIDE[bud]} bud`}
            busyMs={SWEEP.durationMs + 200}
            onPlay={() => playSweep({ pan: bud })}
          />
          <ChoiceRow options={SWEEP_OPTIONS} value={a.sweep[bud]} onChange={(v) => set(bud, v)} />
        </div>
      ))}
    </StepShell>
  )
}
