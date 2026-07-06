export type Tool = 'survival' | 'battery'

// Landing chooser. The app is now a small toolkit: the acoustic survival check
// and the battery-health estimate. Kept deliberately spare so a stressed user
// picks the one thing they came for.
export function Home(props: { onPick: (tool: Tool) => void }) {
  return (
    <div className="home">
      <button className="tool" onClick={() => props.onPick('survival')}>
        <span className="tool-emoji" aria-hidden>🎧</span>
        <span className="tool-title">Speaker &amp; mic check</span>
        <span className="tool-desc">
          Play test sounds and find out if a bud is dead, muffled, or mismatched after a drop or a
          soak. About 2 minutes.
        </span>
      </button>

      <button className="tool" onClick={() => props.onPick('battery')}>
        <span className="tool-emoji" aria-hidden>🔋</span>
        <span className="tool-title">Battery health estimate</span>
        <span className="tool-desc">
          Estimate how much of the original battery life is left. Handy for a tired pair, or before
          you buy secondhand.
        </span>
      </button>
    </div>
  )
}
