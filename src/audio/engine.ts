// Web Audio output engine. Pure playback, no microphone. This is the only part
// of the app that touches the hardware path, and it is deliberately output-only:
// opening a mic on iOS Safari would reroute audio off the AirPods entirely
// (getUserMedia forces output to the built-in speaker, and setSinkId is
// unsupported), which is why Approach A never records. See the design doc.

import { SWEEP, TONE_VOLUME } from './constants'

let ctx: AudioContext | null = null

function getContext(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctor()
  }
  return ctx
}

// Must be called from a user gesture (tap) before the first sound, or iOS keeps
// the context suspended and nothing plays.
export async function unlock(): Promise<void> {
  const c = getContext()
  if (c.state === 'suspended') {
    await c.resume()
  }
}

export type Pan = 'left' | 'right' | 'center'

function panValue(pan: Pan): number {
  if (pan === 'left') return -1
  if (pan === 'right') return 1
  return 0
}

type Stop = () => void

interface ToneOptions {
  freqHz: number
  pan: Pan
  durationMs?: number
  volume?: number
}

// Plays a sine tone panned hard to one bud (or centered). Short attack/release
// envelopes avoid the click that a raw oscillator start/stop produces, since a
// click would read as a "rattle" to the user and pollute the test.
export function playTone(opts: ToneOptions): Stop {
  const c = getContext()
  const osc = c.createOscillator()
  const gain = c.createGain()
  const panner = c.createStereoPanner()

  osc.type = 'sine'
  osc.frequency.value = opts.freqHz
  panner.pan.value = panValue(opts.pan)

  const now = c.currentTime
  const vol = opts.volume ?? TONE_VOLUME
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(vol, now + 0.02)

  osc.connect(gain).connect(panner).connect(c.destination)
  osc.start(now)

  let stopped = false
  const stop: Stop = () => {
    if (stopped) return
    stopped = true
    const t = c.currentTime
    gain.gain.cancelScheduledValues(t)
    gain.gain.setValueAtTime(gain.gain.value, t)
    gain.gain.linearRampToValueAtTime(0, t + 0.03)
    osc.stop(t + 0.05)
  }

  if (opts.durationMs) {
    window.setTimeout(stop, opts.durationMs)
  }
  return stop
}

interface SweepOptions {
  pan: Pan
  fromHz?: number
  toHz?: number
  durationMs?: number
  volume?: number
}

// Exponential frequency sweep (musically linear), panned to one bud. Lets the
// user hear a continuous drop-out or rattle that discrete tones can miss.
export function playSweep(opts: SweepOptions): Stop {
  const c = getContext()
  const osc = c.createOscillator()
  const gain = c.createGain()
  const panner = c.createStereoPanner()

  const from = opts.fromHz ?? SWEEP.fromHz
  const to = opts.toHz ?? SWEEP.toHz
  const durMs = opts.durationMs ?? SWEEP.durationMs
  const dur = durMs / 1000
  const vol = opts.volume ?? TONE_VOLUME

  osc.type = 'sine'
  panner.pan.value = panValue(opts.pan)

  const now = c.currentTime
  osc.frequency.setValueAtTime(from, now)
  osc.frequency.exponentialRampToValueAtTime(to, now + dur)

  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(vol, now + 0.04)
  gain.gain.setValueAtTime(vol, now + dur - 0.06)
  gain.gain.linearRampToValueAtTime(0, now + dur)

  osc.connect(gain).connect(panner).connect(c.destination)
  osc.start(now)
  osc.stop(now + dur + 0.05)

  let stopped = false
  return () => {
    if (stopped) return
    stopped = true
    try {
      osc.stop()
    } catch {
      // already stopped
    }
  }
}
