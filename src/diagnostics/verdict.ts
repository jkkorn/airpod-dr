// The interpretation layer: observations -> honest per-bud verdict.
//
// CONTRIBUTION POINT (the core IP). The exact thresholds and wording below are a
// deliberate, conservative default. They encode premise 2 from the design doc:
// this layer has NO "broken" / "replace it" branch by construction. The most
// negative verdict it can produce is "silent / weak / rattle", and every
// negative verdict routes through dry-and-retest first. Tune the messages and
// the confidence rules here as you learn what reassures the damage victim
// without ever falsely condemning working hardware.

import { HIGH_FREQS, TONE_FREQS, FREQ_LABELS } from '../audio/constants'
import {
  Answers,
  Bud,
  BudStatus,
  BudVerdict,
  Confidence,
  Summary,
  ToneVerdict,
} from './types'

const SIDE_LABEL: Record<Bud, string> = { left: 'Left', right: 'Right' }
const OTHER: Record<Bud, Bud> = { left: 'right', right: 'left' }

function channelAudible(a: Answers, bud: Bud): boolean | null {
  return bud === 'left' ? a.leftAudible : a.rightAudible
}

function toneVerdicts(a: Answers, bud: Bud): ToneVerdict[] {
  return TONE_FREQS.map((f) => a.tones[bud][f]).filter((v): v is ToneVerdict => Boolean(v))
}

function freqsWith(a: Answers, bud: Bud, v: ToneVerdict): number[] {
  return TONE_FREQS.filter((f) => a.tones[bud][f] === v)
}

// Raw status before the swap test reinterprets it. Priority order: a silent bud
// is the most important finding, then a rattle, then weakness.
function rawStatus(a: Answers, bud: Bud): BudStatus {
  const tones = toneVerdicts(a, bud)
  if (channelAudible(a, bud) === false || tones.includes('silent')) return 'silent'
  if (tones.includes('rattle') || a.sweep[bud] === 'rattle') return 'rattle'
  if (tones.includes('weak') || a.sweep[bud] === 'drop') return 'weak'
  return 'pass'
}

function describeWeakBands(a: Answers, bud: Bud): string {
  const weak = freqsWith(a, bud, 'weak')
  if (weak.length === 0) return 'across the sweep'
  const allHigh = weak.every((f) => HIGH_FREQS.includes(f))
  if (allHigh) return 'in the highs'
  return 'at ' + weak.map((f) => FREQ_LABELS[f] ?? `${f} Hz`).join(', ')
}

function passVerdict(bud: Bud): BudVerdict {
  return {
    bud,
    status: 'pass',
    headline: `${SIDE_LABEL[bud]} bud passes the sound checks`,
    detail: 'It played cleanly across every tested frequency and stayed balanced with the other side.',
    confidence: 'high',
    nextStep: 'Nothing to do here. This bud sounds healthy.',
  }
}

function silentVerdict(bud: Bud, swap: Answers['swapOutcome']): BudVerdict {
  if (swap === 'stays-ear') {
    return {
      bud,
      status: 'inconclusive',
      headline: `Couldn't confirm the ${SIDE_LABEL[bud].toLowerCase()} bud`,
      detail:
        'The quiet side stayed in the same ear when you swapped the buds, which points at fit or your own hearing rather than the bud.',
      confidence: 'medium',
      nextStep: 'Recheck the fit/seal, or have someone else run this test on the same bud.',
    }
  }
  return {
    bud,
    status: 'silent',
    headline: `${SIDE_LABEL[bud]} bud isn't producing sound`,
    detail: 'It made no sound on its own channel.',
    confidence: swap === 'follows-bud' ? 'high' : 'medium',
    nextStep:
      'Dry it for 24h and gently clean the mesh, then retest. If it stays silent it is likely a hardware fault.',
  }
}

function weakVerdict(a: Answers, bud: Bud): BudVerdict {
  if (a.swapOutcome === 'stays-ear') {
    return {
      bud,
      status: 'inconclusive',
      headline: 'Likely your ears, not the bud',
      detail: 'The weaker side stayed in the same ear when you swapped the buds, so the hardware is probably fine.',
      confidence: 'medium',
      nextStep: 'No action needed on the AirPods.',
    }
  }
  const bands = describeWeakBands(a, bud)
  const clogLike = bands === 'in the highs'
  return {
    bud,
    status: 'weak',
    headline: `${SIDE_LABEL[bud]} bud sounds weaker than the ${OTHER[bud]}`,
    detail: clogLike
      ? `It is down ${bands} versus the other side. That pattern is consistent with debris or water in the mesh.`
      : `It is down ${bands} versus the other side.`,
    confidence: a.swapOutcome === 'follows-bud' ? 'medium' : 'low',
    nextStep:
      'Clean the mesh, dry it, and retest. If it does not recover after drying, it may be hardware.',
  }
}

function rattleVerdict(bud: Bud): BudVerdict {
  return {
    bud,
    status: 'rattle',
    headline: `Possible diaphragm issue on the ${SIDE_LABEL[bud].toLowerCase()} bud`,
    detail: 'You heard a rattle or buzz on at least one tone.',
    confidence: 'low',
    nextStep:
      'Dry it, then retest. A rattle that clears after drying was probably moisture; one that persists may be hardware.',
  }
}

export function verdictForBud(a: Answers, bud: Bud): BudVerdict {
  switch (rawStatus(a, bud)) {
    case 'silent':
      return silentVerdict(bud, a.swapOutcome)
    case 'rattle':
      return rattleVerdict(bud)
    case 'weak':
      return weakVerdict(a, bud)
    default:
      return passVerdict(bud)
  }
}

function overallLine(left: BudVerdict, right: BudVerdict): string {
  const both = [left, right]
  if (both.every((v) => v.status === 'pass')) {
    return 'Both buds passed the sound checks. Whatever happened, the speakers came through it.'
  }
  if (both.every((v) => v.status === 'silent')) {
    return 'Neither bud produced sound. Before assuming the worst, confirm they were the active output and fully charged, then dry and retest.'
  }
  const worst = both.find((v) => v.status !== 'pass')
  return worst
    ? `One bud is clean; the ${worst.bud} side needs a second look. Nothing here says "dead" yet, so try the next step before giving up on it.`
    : 'Mixed results, see each bud below.'
}

export function summarize(a: Answers): Summary {
  const left = verdictForBud(a, 'left')
  const right = verdictForBud(a, 'right')
  return { left, right, overall: overallLine(left, right) }
}

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
}

export function confidenceLabel(c: Confidence): string {
  return CONFIDENCE_LABEL[c]
}
