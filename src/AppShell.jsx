import { useState } from 'react'
import App from './App'
import TextRibbonApp from './TextRibbonApp'
import './AppShell.css'

const STORAGE_KEY = 'puddle_visual_mode'

function getInitialMode() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'lo' || saved === 'party') return saved
  return 'party'
}

export default function AppShell() {
  const [visualMode, setVisualMode] = useState(getInitialMode)

  function toggle() {
    const next = visualMode === 'party' ? 'lo' : 'party'
    setVisualMode(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  if (visualMode === 'party') {
    return (
      <>
        <App />
        {/* Party mode: fixed pill toggle top-left */}
        <button
          className="mode-toggle"
          onClick={toggle}
          title="Switch to lo mode"
          aria-label="Toggle visual mode"
        >
          <span className="mode-toggle__option mode-toggle__option--active">party</span>
          <span className="mode-toggle__sep">·</span>
          <span className="mode-toggle__option">lo</span>
        </button>
      </>
    )
  }

  // Lo mode: pass toggle into TextRibbonApp so it can render inline in the header row
  return <TextRibbonApp onToggleMode={toggle} />
}
