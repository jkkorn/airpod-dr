// Hand-drawn icon set. Filled silhouettes in currentColor to match the soundwave
// mark, so every icon inherits the ink/terracotta palette and renders identically
// on every OS (unlike emoji). 24x24 grid.

export type ModelIconVariant = 'classic' | 'pro' | 'max'

interface IconProps {
  className?: string
}

// A single AirPod with sound arcs — the acoustic (speaker & mic) check.
export function AirwaveIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="7.5" cy="8" r="4.3" />
      <rect x="8.3" y="8.2" width="3" height="11" rx="1.5" />
      <path d="M14.6 8.4a4.6 4.6 0 0 1 0 7.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17.3 5.8a8.2 8.2 0 0 1 0 12.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// Battery, roughly half full — the battery-health estimate.
export function BatteryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="2.4" y="7.8" width="15.6" height="9" rx="2.6" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <rect x="19" y="10.4" width="2.3" height="3.8" rx="1" />
      <rect x="4.7" y="10.1" width="7" height="4.6" rx="1.1" />
    </svg>
  )
}

export function ModelIcon({ variant, className }: { variant: ModelIconVariant; className?: string }) {
  if (variant === 'max') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path
          d="M4.7 13.2V10.9C4.7 6.7 8 4.1 12 4.1s7.3 2.6 7.3 6.8v2.3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <rect x="3" y="12" width="4.4" height="8" rx="2.2" />
        <rect x="16.6" y="12" width="4.4" height="8" rx="2.2" />
      </svg>
    )
  }
  if (variant === 'pro') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <ellipse cx="9" cy="4.4" rx="3.1" ry="1.9" />
        <rect x="5.5" y="5" width="7" height="8" rx="3.3" />
        <rect x="9.3" y="12" width="3.2" height="7.6" rx="1.6" />
      </svg>
    )
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="7.4" r="4.7" />
      <rect x="10" y="7.8" width="3.3" height="12" rx="1.65" />
    </svg>
  )
}
