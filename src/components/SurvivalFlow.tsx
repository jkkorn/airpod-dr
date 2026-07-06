import { useMemo, useState } from 'react'
import { Answers, emptyAnswers, needsSwapTest } from '../diagnostics/types'
import { Setup } from './Setup'
import { ChannelTest } from './ChannelTest'
import { SwapTest } from './SwapTest'
import { ToneTest } from './ToneTest'
import { SweepTest } from './SweepTest'
import { Results } from './Results'

type Phase = 'setup' | 'channel' | 'swap' | 'toneLeft' | 'toneRight' | 'sweep' | 'results'

const ORDER: Phase[] = ['setup', 'channel', 'swap', 'toneLeft', 'toneRight', 'sweep', 'results']

// The swap step only exists when the buds disagreed, so it is skipped over in
// both directions when it doesn't apply.
function step(phase: Phase, a: Answers, dir: 1 | -1): Phase {
  let i = ORDER.indexOf(phase) + dir
  while (ORDER[i] === 'swap' && !needsSwapTest(a)) i += dir
  return ORDER[i] ?? phase
}

// The acoustic survival check: setup, channel, conditional swap, per-bud tones,
// sweep, results. Owns its own step state so leaving and re-entering resets it.
export function SurvivalFlow() {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers)
  const [phase, setPhase] = useState<Phase>('setup')

  const visible = useMemo(
    () => ORDER.filter((p) => p !== 'swap' || needsSwapTest(answers)),
    [answers]
  )
  const total = visible.length
  const idx = Math.max(0, visible.indexOf(phase))

  const next = () => setPhase((p) => step(p, answers, 1))
  const back = () => setPhase((p) => step(p, answers, -1))
  const restart = () => {
    setAnswers(emptyAnswers())
    setPhase('setup')
  }

  return (
    <>
      {phase === 'setup' && <Setup step={idx} total={total} onNext={next} />}
      {phase === 'channel' && (
        <ChannelTest step={idx} total={total} answers={answers} setAnswers={setAnswers} onBack={back} onNext={next} />
      )}
      {phase === 'swap' && (
        <SwapTest step={idx} total={total} answers={answers} setAnswers={setAnswers} onBack={back} onNext={next} />
      )}
      {phase === 'toneLeft' && (
        <ToneTest step={idx} total={total} bud="left" answers={answers} setAnswers={setAnswers} onBack={back} onNext={next} />
      )}
      {phase === 'toneRight' && (
        <ToneTest step={idx} total={total} bud="right" answers={answers} setAnswers={setAnswers} onBack={back} onNext={next} />
      )}
      {phase === 'sweep' && (
        <SweepTest step={idx} total={total} answers={answers} setAnswers={setAnswers} onBack={back} onNext={next} />
      )}
      {phase === 'results' && <Results answers={answers} onRestart={restart} />}
    </>
  )
}
