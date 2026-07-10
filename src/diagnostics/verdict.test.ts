// Locks in the conservative verdict behavior: priority order (silent > rattle >
// weak), the swap-test reinterpretation, the clog/water signature wording, and
// the "never condemn hardware" guarantee the design doc promises.

import { describe, expect, it } from 'vitest'
import { Answers, BudVerdict, emptyAnswers, needsSwapTest } from './types'
import { summarize, verdictForBud } from './verdict'

// All-clear answers; tests override the one observation they care about.
function cleanAnswers(overrides: Partial<Answers> = {}): Answers {
  return {
    ...emptyAnswers(),
    leftAudible: true,
    rightAudible: true,
    centerBalanced: true,
    swapOutcome: 'skipped',
    tones: {
      left: { 250: 'clear', 1000: 'clear', 4000: 'clear', 8000: 'clear' },
      right: { 250: 'clear', 1000: 'clear', 4000: 'clear', 8000: 'clear' },
    },
    sweep: { left: 'none', right: 'none' },
    ...overrides,
  }
}

describe('verdictForBud', () => {
  it('passes a bud that is clean on every observation', () => {
    const v = verdictForBud(cleanAnswers(), 'left')
    expect(v.status).toBe('pass')
    expect(v.confidence).toBe('high')
  })

  it('reports silent when the channel test failed', () => {
    const a = cleanAnswers({ leftAudible: false })
    expect(verdictForBud(a, 'left').status).toBe('silent')
    expect(verdictForBud(a, 'right').status).toBe('pass')
  })

  it('reports silent when any tone was silent, even if others rattled', () => {
    const a = cleanAnswers()
    a.tones.left[4000] = 'silent'
    a.tones.left[250] = 'rattle'
    expect(verdictForBud(a, 'left').status).toBe('silent')
  })

  it('is high confidence silent only when the swap test confirmed the fault follows the bud', () => {
    const followsBud = cleanAnswers({ leftAudible: false, swapOutcome: 'follows-bud' })
    expect(verdictForBud(followsBud, 'left').confidence).toBe('high')

    const skipped = cleanAnswers({ leftAudible: false, swapOutcome: 'skipped' })
    expect(verdictForBud(skipped, 'left').confidence).toBe('medium')
  })

  it('downgrades a silent bud to inconclusive when the problem stayed in the same ear', () => {
    const a = cleanAnswers({ leftAudible: false, swapOutcome: 'stays-ear' })
    const v = verdictForBud(a, 'left')
    expect(v.status).toBe('inconclusive')
    expect(v.detail).toMatch(/fit or your own hearing/i)
  })

  it('ranks rattle above weak when both are present', () => {
    const a = cleanAnswers()
    a.tones.left[250] = 'rattle'
    a.tones.left[8000] = 'weak'
    expect(verdictForBud(a, 'left').status).toBe('rattle')
  })

  it('treats a sweep rattle the same as a tone rattle', () => {
    const a = cleanAnswers()
    a.sweep.left = 'rattle'
    expect(verdictForBud(a, 'left').status).toBe('rattle')
  })

  it('calls out the clog/water signature when weakness is confined to the highs', () => {
    const a = cleanAnswers()
    a.tones.left[4000] = 'weak'
    a.tones.left[8000] = 'weak'
    const v = verdictForBud(a, 'left')
    expect(v.status).toBe('weak')
    expect(v.detail).toMatch(/debris or water/i)
  })

  it('names the affected bands when weakness includes the lows', () => {
    const a = cleanAnswers()
    a.tones.left[250] = 'weak'
    const v = verdictForBud(a, 'left')
    expect(v.detail).toContain('250 Hz')
    expect(v.detail).not.toMatch(/debris or water/i)
  })

  it('marks a sweep drop as weak "across the sweep" when no single tone was weak', () => {
    const a = cleanAnswers()
    a.sweep.left = 'drop'
    const v = verdictForBud(a, 'left')
    expect(v.status).toBe('weak')
    expect(v.detail).toContain('across the sweep')
  })

  it('downgrades a weak bud to inconclusive when the weakness stayed in the same ear', () => {
    const a = cleanAnswers({ swapOutcome: 'stays-ear' })
    a.tones.left[8000] = 'weak'
    const v = verdictForBud(a, 'left')
    expect(v.status).toBe('inconclusive')
    expect(v.headline).toMatch(/your ears/i)
  })
})

describe('the never-condemn guarantee', () => {
  // Per-bud verdicts must never declare hardware dead or tell the user to
  // replace it — the design's core premise. Exercise every status branch.
  const scenarios: Array<[string, Answers]> = [
    ['silent, swap follows bud', cleanAnswers({ leftAudible: false, swapOutcome: 'follows-bud' })],
    ['silent, swap skipped', cleanAnswers({ leftAudible: false })],
    ['rattle', (() => { const a = cleanAnswers(); a.tones.left[1000] = 'rattle'; return a })()],
    ['weak highs', (() => { const a = cleanAnswers(); a.tones.left[8000] = 'weak'; return a })()],
    ['sweep drop', (() => { const a = cleanAnswers(); a.sweep.left = 'drop'; return a })()],
  ]

  it.each(scenarios)('%s: verdict never says dead / broken / replace', (_name, answers) => {
    const v: BudVerdict = verdictForBud(answers, 'left')
    const text = `${v.headline} ${v.detail} ${v.nextStep}`.toLowerCase()
    expect(text).not.toMatch(/\b(dead|broken|replace)\b/)
  })

  it.each(scenarios)('%s: every negative verdict routes through dry-and-retest', (_name, answers) => {
    const v = verdictForBud(answers, 'left')
    expect(v.nextStep.toLowerCase()).toMatch(/dry|retest|recheck/)
  })
})

describe('summarize', () => {
  it('celebrates when both buds pass', () => {
    expect(summarize(cleanAnswers()).overall).toMatch(/both buds passed/i)
  })

  it('suspects setup, not hardware, when neither bud produced sound', () => {
    const a = cleanAnswers({ leftAudible: false, rightAudible: false })
    expect(summarize(a).overall).toMatch(/active output and fully charged/i)
  })

  it('points at the failing side when only one bud has an issue', () => {
    const a = cleanAnswers({ rightAudible: false })
    const s = summarize(a)
    expect(s.overall).toContain('right side needs a second look')
    expect(s.left.status).toBe('pass')
  })
})

describe('needsSwapTest', () => {
  it('is false when everything is audible and balanced', () => {
    expect(needsSwapTest(cleanAnswers())).toBe(false)
  })

  it('is true when a channel is silent or the pair is unbalanced', () => {
    expect(needsSwapTest(cleanAnswers({ leftAudible: false }))).toBe(true)
    expect(needsSwapTest(cleanAnswers({ centerBalanced: false }))).toBe(true)
  })
})
