// Locks in the battery product judgment: the health-tier thresholds (85/70/50),
// the pct clamp, hours formatting, and the age-comparison bands (±8 / -18).

import { describe, expect, it } from 'vitest'
import {
  AGE_BUCKETS,
  AirPodsModel,
  MODELS,
  compareToTypical,
  estimateHealth,
  formatHours,
} from './models'

const proTwo: AirPodsModel = MODELS.find((m) => m.id === 'airpods-pro-2')!

describe('estimateHealth tiers', () => {
  // baselineHours is 6 for AirPods Pro 2, so hours map cleanly to percentages.
  it('rates 85%+ as healthy with reassuring copy', () => {
    const h = estimateHealth(5.1, proTwo) // exactly 85%
    expect(h.pct).toBe(85)
    expect(h.tier).toBe('healthy')
    expect(h.tone).toBe('good')
    expect(h.detail).toMatch(/normal/i)
  })

  it('rates 70-84% as mild wear, still toned good', () => {
    const h = estimateHealth(4.2, proTwo) // exactly 70%
    expect(h.tier).toBe('mild')
    expect(h.tone).toBe('good')
  })

  it('rates 50-69% as noticeably worn', () => {
    const h = estimateHealth(3, proTwo) // exactly 50%
    expect(h.tier).toBe('worn')
    expect(h.tone).toBe('warn')
  })

  it('rates below 50% as heavily degraded with the secondhand warning', () => {
    const h = estimateHealth(2.9, proTwo) // ~48%
    expect(h.tier).toBe('poor')
    expect(h.tone).toBe('bad')
    expect(h.detail).toMatch(/secondhand/i)
  })

  it('clamps the percentage to 0-120 so outliers read sane', () => {
    expect(estimateHealth(60, proTwo).pct).toBe(120)
    expect(estimateHealth(0, proTwo).pct).toBe(0)
  })

  it('quotes both the measured and the as-new runtime in the detail', () => {
    const h = estimateHealth(4.5, proTwo)
    expect(h.detail).toContain('4 h 30 min')
    expect(h.detail).toContain('6 h')
  })
})

describe('formatHours', () => {
  it('formats sub-hour values as minutes only', () => {
    expect(formatHours(0.5)).toBe('30 min')
  })

  it('formats whole hours without a minutes part', () => {
    expect(formatHours(6)).toBe('6 h')
  })

  it('formats mixed values as hours and minutes', () => {
    expect(formatHours(4.5)).toBe('4 h 30 min')
  })

  it('rounds to the nearest minute', () => {
    expect(formatHours(1.999)).toBe('2 h')
  })
})

describe('compareToTypical', () => {
  const oneToTwo = AGE_BUCKETS.find((b) => b.id === '1to2')! // typicalPct 86

  it('celebrates a pair 8+ points ahead of the curve', () => {
    const c = compareToTypical(94, oneToTwo)
    expect(c.tone).toBe('good')
    expect(c.text).toMatch(/ahead of the curve/i)
  })

  it('calls ±8 points of typical "on track"', () => {
    expect(compareToTypical(86, oneToTwo).text).toMatch(/right on track/i)
    expect(compareToTypical(78, oneToTwo).text).toMatch(/right on track/i) // exactly -8
  })

  it('warns between 8 and 18 points below typical', () => {
    const c = compareToTypical(70, oneToTwo)
    expect(c.tone).toBe('warn')
    expect(c.text).toMatch(/little below average/i)
  })

  it('flags more than 18 points below typical as worn faster than normal', () => {
    const c = compareToTypical(67, oneToTwo)
    expect(c.tone).toBe('bad')
    expect(c.text).toMatch(/worn faster/i)
  })
})

describe('model baselines', () => {
  it('every model has a positive baseline and a stated test condition', () => {
    for (const m of MODELS) {
      expect(m.baselineHours).toBeGreaterThan(0)
      expect(m.condition).toMatch(/volume/i)
    }
  })

  it('ANC models pin the baseline to the ANC-on condition so comparisons stay honest', () => {
    const ancModels = MODELS.filter((m) => m.icon !== 'classic')
    for (const m of ancModels) {
      expect(m.condition).toMatch(/ANC on/i)
    }
  })

  it('age buckets decline monotonically — older pairs never model healthier', () => {
    for (let i = 1; i < AGE_BUCKETS.length; i++) {
      expect(AGE_BUCKETS[i].typicalPct).toBeLessThan(AGE_BUCKETS[i - 1].typicalPct)
    }
  })
})
