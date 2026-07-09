import { useState } from 'react'
import { Home, Tool } from './components/Home'
import { SurvivalFlow } from './components/SurvivalFlow'
import { BatteryFlow } from './components/BatteryFlow'

type View = 'home' | Tool

export default function App() {
  const [view, setView] = useState<View>('home')

  return (
    <main className="app">
      <header className="masthead">
        <svg className="mark" viewBox="0 0 44 44" fill="none" aria-hidden="true">
          <rect x="4" y="17" width="4" height="10" rx="2" fill="currentColor" opacity="0.45" />
          <rect x="12" y="12" width="4" height="20" rx="2" fill="currentColor" opacity="0.7" />
          <rect x="20" y="7" width="4" height="30" rx="2" fill="currentColor" />
          <rect x="28" y="12" width="4" height="20" rx="2" fill="currentColor" opacity="0.7" />
          <rect x="36" y="17" width="4" height="10" rx="2" fill="currentColor" opacity="0.45" />
        </svg>
        <h1>AirPod Survival Check</h1>
        <p className="tagline">Dropped it? Washed it? Buying it used? Find out what still works.</p>
      </header>

      {view !== 'home' && (
        <button className="btn-link back-home" onClick={() => setView('home')}>
          ← All checks
        </button>
      )}

      {view === 'home' && <Home onPick={(t) => setView(t)} />}
      {view === 'survival' && <SurvivalFlow />}
      {view === 'battery' && <BatteryFlow />}

      <footer className="footer">
        <span>Open source · runs in your browser · no account, no upload, no microphone</span>
        <span className="credit">
          Made with love in Brazil by{' '}
          <a href="https://www.linkedin.com/in/jkkorn" target="_blank" rel="noopener noreferrer">
            Jonathan Korn
          </a>
        </span>
      </footer>
    </main>
  )
}
