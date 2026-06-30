import { useMemo, useState } from 'react'
import { Answers, emptyAnswers, needsSwapTest } from './diagnostics/types'
import { Setup } from './components/Setup'
import { ChannelTest } from './components/ChannelTest'
import { SwapTest } from './components/SwapTest'
import { ToneTest } from './components/ToneTest'
import { SweepTest } from './components/SweepTest'
import { Results } from './components/Results'

type Phase = 'setup' | 'channel' | 'swap' | 'toneLeft' | 'toneRight' | 'sweep' | 'results'

const ORDER: Phase[] = ['setup', 'channel', 'swap', 'toneLeft', 'toneRight', 'sweep', 'results']

// The swap step only exists when the buds disagreed, so it is skipped over in
// both directions when it doesn't apply.
function step(phase: Phase, a: Answers, dir: 1 | -1): Phase {
  let i = ORDER.indexOf(phase) + dir
  while (ORDER[i] === 'swap' && !needsSwapTest(a)) i += dir
  return ORDER[i] ?? phase
}

export default function App() {
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
    <main className="app">
      <header className="masthead">
        <h1>AirPod Survival Check</h1>
        <p className="tagline">Dropped it? Washed it? Buying it used? Find out what still works.</p>
      </header>

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

      <footer className="footer">
        <span>Open source · runs in your browser · no account, no upload, no microphone</span>
      </footer>
    </main>
  )
}
