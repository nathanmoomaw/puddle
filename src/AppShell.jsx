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

  return (
    <>
      {visualMode === 'party' ? <App /> : <TextRibbonApp />}
      <button
        className="mode-toggle"
        onClick={toggle}
        title={`Switch to ${visualMode === 'party' ? 'lo' : 'party'} mode`}
        aria-label="Toggle visual mode"
      >
        <span className={`mode-toggle__option${visualMode === 'party' ? ' mode-toggle__option--active' : ''}`}>party</span>
        <span className="mode-toggle__sep">·</span>
        <span className={`mode-toggle__option${visualMode === 'lo' ? ' mode-toggle__option--active' : ''}`}>lo</span>
      </button>
    </>
  )
}
