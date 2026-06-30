// Test signals. Kept small and named so the verdict layer and the UI agree on
// exactly which frequencies were probed.

export const TONE_FREQS = [250, 1000, 4000, 8000] as const
export type ToneFreq = (typeof TONE_FREQS)[number]

// Frequencies most affected by a clogged mesh or water in the driver: the highs
// roll off first. The verdict layer treats weakness here as the clog/water signal.
export const HIGH_FREQS: readonly number[] = [4000, 8000]

export const SWEEP = { fromHz: 80, toHz: 12000, durationMs: 6000 } as const

export const TONE_DURATION_MS = 2500
export const TONE_VOLUME = 0.18 // conservative; the Setup step asks the user to set device volume ~50%

export const FREQ_LABELS: Record<number, string> = {
  250: '250 Hz (low / bass)',
  1000: '1 kHz (mid / voice)',
  4000: '4 kHz (high / detail)',
  8000: '8 kHz (treble / air)',
}
