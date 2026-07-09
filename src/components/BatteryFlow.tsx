import { useEffect, useState } from 'react'
import {
  AgeBucket,
  AGE_BUCKETS,
  AirPodsModel,
  MODELS,
  compareToTypical,
  estimateHealth,
  formatHours,
} from '../battery/models'

// A timed full-discharge is the only real signal available (AirPods expose no
// health to any app, and iOS hides even the live % from web pages). So this is a
// guided estimate: the app knows the as-new runtime, the user runs the discharge
// and times it. The timer start is stored in localStorage so it survives the tab
// being closed during the hours-long test.
const TIMER_KEY = 'apd-battery-start'

type Stage = 'model' | 'measure' | 'result'

function readStart(): number | null {
  try {
    const v = localStorage.getItem(TIMER_KEY)
    if (!v) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function elapsedLabel(ms: number): string {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export function BatteryFlow() {
  const [stage, setStage] = useState<Stage>('model')
  const [model, setModel] = useState<AirPodsModel | null>(null)
  const [measuredHours, setMeasuredHours] = useState<number | null>(null)
  const [ageBucket, setAgeBucket] = useState<AgeBucket | null>(null)

  const [start, setStart] = useState<number | null>(() => readStart())
  const [now, setNow] = useState<number>(() => Date.now())
  const [hoursStr, setHoursStr] = useState('')
  const [minStr, setMinStr] = useState('')

  // Tick the live clock only while a test is running.
  useEffect(() => {
    if (start === null) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [start])

  const startTimer = () => {
    const t = Date.now()
    try {
      localStorage.setItem(TIMER_KEY, String(t))
    } catch {
      // storage blocked (private mode) — timer still works this session
    }
    setStart(t)
    setNow(t)
  }
  const finish = (h: number) => {
    setMeasuredHours(h)
    setStage('result')
  }
  const stopTimer = () => {
    if (start === null) return
    const hrs = (Date.now() - start) / 3600000
    try {
      localStorage.removeItem(TIMER_KEY)
    } catch {
      // ignore
    }
    setStart(null)
    finish(hrs)
  }
  const cancelTimer = () => {
    try {
      localStorage.removeItem(TIMER_KEY)
    } catch {
      // ignore
    }
    setStart(null)
  }
  const submitManual = () => {
    const total = Number(hoursStr || '0') + Number(minStr || '0') / 60
    if (total > 0) finish(total)
  }
  const restart = () => {
    setModel(null)
    setMeasuredHours(null)
    setAgeBucket(null)
    setHoursStr('')
    setMinStr('')
    setStage('model')
  }

  if (stage === 'model') {
    return (
      <section className="shell">
        <h2 className="title">Which AirPods are these?</h2>
        <p className="subtitle">
          We compare your battery life against how long this model lasted when it was new.
        </p>
        <div className="model-grid">
          {MODELS.map((m) => (
            <button
              key={m.id}
              className="btn model-btn"
              onClick={() => {
                setModel(m)
                setStage('measure')
              }}
            >
              <span className="model-name">{m.label}</span>
              <span className="model-base">~{formatHours(m.baselineHours)} new</span>
            </button>
          ))}
        </div>
      </section>
    )
  }

  if (stage === 'measure' && model) {
    const running = start !== null
    return (
      <section className="shell">
        <h2 className="title">Run a discharge test</h2>
        <p className="subtitle">
          There's no shortcut here: the only honest signal is how long they actually last. It takes a
          few hours, but you can leave and come back.
        </p>

        <ol className="setup-list">
          <li>Charge both AirPods to 100%.</li>
          <li>Play music or a podcast at {model.condition}.</li>
          <li>Start the timer, then go about your day.</li>
          <li>When they die, come back and tap “They died”.</li>
        </ol>

        <div className="qcard">
          {running ? (
            <>
              <div className="timer-clock">{elapsedLabel(now - (start ?? now))}</div>
              <p className="hint">Running since you tapped start. You can close this tab; it remembers.</p>
              <div className="row">
                <button className="btn btn-primary" onClick={stopTimer}>They died</button>
                <button className="btn btn-ghost" onClick={cancelTimer}>Cancel</button>
              </div>
            </>
          ) : (
            <button className="btn btn-primary" onClick={startTimer}>Start timer at 100%</button>
          )}
        </div>

        <details className="manual">
          <summary>Already know how long they lasted?</summary>
          <div className="field-row">
            <label className="field">
              <span>Hours</span>
              <input inputMode="numeric" value={hoursStr} onChange={(e) => setHoursStr(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
            </label>
            <label className="field">
              <span>Minutes</span>
              <input inputMode="numeric" value={minStr} onChange={(e) => setMinStr(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
            </label>
          </div>
          <button className="btn btn-primary" onClick={submitManual}>See estimate</button>
        </details>
      </section>
    )
  }

  if (stage === 'result' && model && measuredHours !== null) {
    const h = estimateHealth(measuredHours, model)
    const cmp = ageBucket ? compareToTypical(h.pct, ageBucket) : null
    return (
      <section className="shell">
        <h2 className="title">Battery estimate</h2>
        <div className={`health tone-${h.tone}`}>
          <div className="health-pct"><CountUp value={h.pct} /></div>
          <div className="health-headline">{h.headline}</div>
          <p className="health-detail">{h.detail}</p>
        </div>

        <div className="qcard">
          <p className="q">How old are these?</p>
          <div className="choices">
            {AGE_BUCKETS.map((b) => (
              <button
                key={b.id}
                className={'btn btn-choice' + (ageBucket?.id === b.id ? ' selected' : '')}
                onClick={() => setAgeBucket(b)}
              >
                {b.label}
              </button>
            ))}
          </div>
          {cmp && <p className={`compare-line tone-${cmp.tone}`}>{cmp.text}</p>}
          {cmp && (
            <p className="hint">Typical figures are modeled from how AirPods batteries age, not live user data.</p>
          )}
        </div>
        <p className="disclaimer">
          A rough estimate, not a lab reading. Real runtime swings with volume, ANC, temperature, and
          which bud you tested. Run it a couple of times, and test each bud separately if one feels
          weaker. AirPods dropping toward ~80% within a couple of years is normal wear, not a fault.
        </p>
        <div className="actions">
          <button className="btn btn-primary" onClick={restart}>Test again</button>
        </div>
      </section>
    )
  }

  return null
}

// Counts the battery percentage up from 0 on reveal (easeOutCubic).
function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const dur = 750
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(eased * value))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{n}%</>
}
