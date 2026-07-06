// AirPods models and their as-new listening runtime (single charge). These are
// the published/approximate baselines the health estimate compares against.
// Where a model has ANC, the baseline is the ANC-on figure and the test
// condition asks the user to match it, so the comparison is apples-to-apples.

export interface AirPodsModel {
  id: string
  label: string
  baselineHours: number
  condition: string
}

export const MODELS: AirPodsModel[] = [
  { id: 'airpods-2', label: 'AirPods (1st / 2nd gen)', baselineHours: 5, condition: '~50% volume' },
  { id: 'airpods-3', label: 'AirPods (3rd gen)', baselineHours: 6, condition: '~50% volume' },
  { id: 'airpods-4', label: 'AirPods 4', baselineHours: 5, condition: '~50% volume, ANC off' },
  { id: 'airpods-pro-1', label: 'AirPods Pro (1st gen)', baselineHours: 4.5, condition: '~50% volume, ANC on' },
  { id: 'airpods-pro-2', label: 'AirPods Pro (2nd gen)', baselineHours: 6, condition: '~50% volume, ANC on' },
  { id: 'airpods-pro-3', label: 'AirPods Pro (3rd gen)', baselineHours: 8, condition: '~50% volume, ANC on' },
  { id: 'airpods-max', label: 'AirPods Max', baselineHours: 20, condition: '~50% volume, ANC on' },
]

export type HealthTier = 'healthy' | 'mild' | 'worn' | 'poor'

export interface BatteryHealth {
  pct: number
  tier: HealthTier
  tone: 'good' | 'warn' | 'bad'
  headline: string
  detail: string
}

// CONTRIBUTION POINT: the health thresholds and wording are a product-judgment
// call, not a physical constant. AirPods realistically fall to ~80% within a few
// hundred cycles (2-3 years), so "80% at two years" should read as normal, not
// alarming. Tune the bands and copy here as you learn what reassures vs. informs.
export function estimateHealth(measuredHours: number, model: AirPodsModel): BatteryHealth {
  const pct = Math.max(0, Math.min(120, Math.round((measuredHours / model.baselineHours) * 100)))
  const base = `You measured about ${formatHours(measuredHours)} versus roughly ${formatHours(
    model.baselineHours
  )} when new (~${pct}%).`

  if (pct >= 85) {
    return {
      pct,
      tier: 'healthy',
      tone: 'good',
      headline: 'Healthy battery',
      detail: `${base} That's normal, even for a pair that's a year or two old.`,
    }
  }
  if (pct >= 70) {
    return {
      pct,
      tier: 'mild',
      tone: 'good',
      headline: 'Mild wear',
      detail: `${base} Typical after regular use. Nothing wrong here.`,
    }
  }
  if (pct >= 50) {
    return {
      pct,
      tier: 'worn',
      tone: 'warn',
      headline: 'Noticeably worn',
      detail: `${base} Common in older or heavily-used pairs. You'll feel the shorter runtime day to day.`,
    }
  }
  return {
    pct,
    tier: 'poor',
    tone: 'bad',
    headline: 'Heavily degraded',
    detail: `${base} The battery is near the end of its useful life. If you're buying these secondhand, factor that in.`,
  }
}

export function formatHours(h: number): string {
  const totalMin = Math.round(h * 60)
  const hrs = Math.floor(totalMin / 60)
  const min = totalMin % 60
  if (hrs === 0) return `${min} min`
  if (min === 0) return `${hrs} h`
  return `${hrs} h ${min} min`
}

// "Is my degradation normal for its age?" — compared against a MODELED typical
// curve, not live crowd data (yet). Grounded in how AirPods cells age: ~80%
// capacity by roughly 300-500 real cycles, i.e. about 2-3 years of normal use,
// accelerating after. When the app has traffic, swap typicalPct for a live
// aggregate; the comparison UI and copy stay the same.
export interface AgeBucket {
  id: string
  label: string
  typicalPct: number
}

export const AGE_BUCKETS: AgeBucket[] = [
  { id: 'lt1', label: 'Under a year', typicalPct: 95 },
  { id: '1to2', label: '1 to 2 years', typicalPct: 86 },
  { id: '2to3', label: '2 to 3 years', typicalPct: 78 },
  { id: 'gt3', label: '3+ years', typicalPct: 68 },
]

export interface AgeCompare {
  tone: 'good' | 'warn' | 'bad'
  text: string
}

export function compareToTypical(userPct: number, bucket: AgeBucket): AgeCompare {
  const diff = userPct - bucket.typicalPct
  const typical = `around ${bucket.typicalPct}%`
  if (diff >= 8) {
    return { tone: 'good', text: `Ahead of the curve. Most pairs this age sit ${typical}, and yours is above that.` }
  }
  if (diff >= -8) {
    return { tone: 'good', text: `Right on track. ${bucket.typicalPct}% is about typical for a pair this age.` }
  }
  if (diff >= -18) {
    return { tone: 'warn', text: `A little below average. Most pairs this age are ${typical}.` }
  }
  return { tone: 'bad', text: `Worn faster than typical. Most pairs this age are still ${typical}.` }
}
