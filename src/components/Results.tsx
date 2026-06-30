import { useState } from 'react'
import { Answers, BudVerdict, Summary } from '../diagnostics/types'
import { confidenceLabel, summarize } from '../diagnostics/verdict'

const STATUS_TONE: Record<BudVerdict['status'], string> = {
  pass: 'good',
  weak: 'warn',
  rattle: 'warn',
  inconclusive: 'warn',
  silent: 'bad',
}

function VerdictCard({ v }: { v: BudVerdict }) {
  return (
    <article className={`verdict tone-${STATUS_TONE[v.status]}`}>
      <header>
        <span className="verdict-bud">{v.bud === 'left' ? 'Left bud' : 'Right bud'}</span>
        <span className="verdict-conf">{confidenceLabel(v.confidence)}</span>
      </header>
      <h3>{v.headline}</h3>
      <p className="verdict-detail">{v.detail}</p>
      <p className="verdict-next">
        <strong>Next:</strong> {v.nextStep}
      </p>
    </article>
  )
}

function buildShareText(s: Summary): string {
  const line = (v: BudVerdict) => `${v.bud === 'left' ? 'Left' : 'Right'}: ${v.headline} (${confidenceLabel(v.confidence).toLowerCase()})`
  return [
    'AirPod Survival Check',
    s.overall,
    '',
    line(s.left),
    line(s.right),
    '',
    'Tested with an open-source acoustic check (no telemetry, browser-only).',
  ].join('\n')
}

// Step 6. The reassuring payoff. Conservative by construction: the worst any
// card can say is "silent / weak / rattle", always with a dry-and-retest path.
export function Results(props: { answers: Answers; onRestart: () => void }) {
  const summary = summarize(props.answers)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText(summary))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const share = async () => {
    const text = buildShareText(summary)
    const nav = navigator as Navigator & { share?: (data: { title?: string; text?: string }) => Promise<void> }
    if (nav.share) {
      try {
        await nav.share({ title: 'AirPod Survival Check', text })
      } catch {
        // user dismissed share sheet
      }
    } else {
      await copy()
    }
  }

  const canShare = typeof (navigator as { share?: unknown }).share === 'function'

  return (
    <section className="shell results">
      <h2 className="title">Your results</h2>
      <p className="overall">{summary.overall}</p>

      <VerdictCard v={summary.left} />
      <VerdictCard v={summary.right} />

      <p className="disclaimer">
        This is a relative listening test, not a calibrated measurement. It compares your two buds and
        flags what to recheck. It never declares hardware dead, so when in doubt: dry it longer, clean
        the mesh, and run it again.
      </p>

      <div className="actions">
        <button className="btn btn-primary" onClick={share}>
          {canShare ? 'Share results' : copied ? 'Copied!' : 'Copy results'}
        </button>
        <button className="btn btn-ghost" onClick={props.onRestart}>
          Start over
        </button>
      </div>
    </section>
  )
}
