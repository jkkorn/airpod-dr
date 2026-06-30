// Domain model for the survival check. Answers are collected by the step UI and
// turned into per-bud verdicts by verdict.ts. State is updated immutably
// (always return a new Answers object) so steps never mutate shared state.

export type Bud = 'left' | 'right'
export const BUDS: readonly Bud[] = ['left', 'right']

export type ToneVerdict = 'clear' | 'weak' | 'rattle' | 'silent'
export type SweepIssue = 'none' | 'drop' | 'rattle'
export type Confidence = 'high' | 'medium' | 'low'

// The physical swap test only matters when the two buds disagree. It separates a
// hardware fault (the problem follows the bud you move) from the user's own
// hearing (the problem stays in the same ear).
export type SwapOutcome = 'follows-bud' | 'stays-ear' | 'skipped'

export interface Answers {
  leftAudible: boolean | null
  rightAudible: boolean | null
  centerBalanced: boolean | null
  swapOutcome: SwapOutcome | null
  tones: Record<Bud, Partial<Record<number, ToneVerdict>>>
  sweep: Record<Bud, SweepIssue | null>
}

export type BudStatus = 'pass' | 'weak' | 'rattle' | 'silent' | 'inconclusive'

export interface BudVerdict {
  bud: Bud
  status: BudStatus
  headline: string
  detail: string
  confidence: Confidence
  nextStep: string
}

export interface Summary {
  left: BudVerdict
  right: BudVerdict
  overall: string
}

export function emptyAnswers(): Answers {
  return {
    leftAudible: null,
    rightAudible: null,
    centerBalanced: null,
    swapOutcome: null,
    tones: { left: {}, right: {} },
    sweep: { left: null, right: null },
  }
}

// True when the two buds disagree enough to be worth a physical swap test.
export function needsSwapTest(a: Answers): boolean {
  return a.leftAudible === false || a.rightAudible === false || a.centerBalanced === false
}
