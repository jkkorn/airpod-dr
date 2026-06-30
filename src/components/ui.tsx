import { ReactNode, useState } from 'react'
import { unlock } from '../audio/engine'

export function StepShell(props: {
  step: number
  total: number
  title: string
  subtitle?: ReactNode
  children: ReactNode
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
}) {
  return (
    <section className="shell">
      <div className="progress" aria-hidden>
        {Array.from({ length: props.total }).map((_, i) => (
          <span key={i} className={'pip' + (i <= props.step ? ' pip-on' : '')} />
        ))}
      </div>
      <h2 className="title">{props.title}</h2>
      {props.subtitle && <p className="subtitle">{props.subtitle}</p>}
      <div className="step-body">{props.children}</div>
      <div className="nav">
        {props.onBack ? (
          <button className="btn btn-ghost" onClick={props.onBack}>
            Back
          </button>
        ) : (
          <span />
        )}
        {props.onNext && (
          <button className="btn btn-primary" onClick={props.onNext} disabled={props.nextDisabled}>
            {props.nextLabel ?? 'Next'}
          </button>
        )}
      </div>
    </section>
  )
}

// A play button that unlocks the AudioContext on first tap (required by iOS) and
// shows a brief "Playing" state so the user knows the tap registered.
export function PlayButton(props: { label: string; busyMs?: number; onPlay: () => void }) {
  const [busy, setBusy] = useState(false)
  const handle = async () => {
    await unlock()
    props.onPlay()
    if (props.busyMs) {
      setBusy(true)
      window.setTimeout(() => setBusy(false), props.busyMs)
    }
  }
  return (
    <button className="btn btn-play" onClick={handle} disabled={busy}>
      {busy ? '♪ Playing…' : `▶ ${props.label}`}
    </button>
  )
}

export interface Choice<T extends string> {
  value: T
  label: string
  tone?: 'good' | 'warn' | 'bad'
}

export function ChoiceRow<T extends string>(props: {
  options: Choice<T>[]
  value: T | null | undefined
  onChange: (v: T) => void
}) {
  return (
    <div className="choices" role="group">
      {props.options.map((o) => (
        <button
          key={o.value}
          className={
            'btn btn-choice' +
            (props.value === o.value ? ' selected' : '') +
            (o.tone ? ` tone-${o.tone}` : '')
          }
          aria-pressed={props.value === o.value}
          onClick={() => props.onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
