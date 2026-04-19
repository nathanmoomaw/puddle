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
    return <App onToggleMode={toggle} />
  }

  // Lo mode: pass toggle into TextRibbonApp so it can render inline in the header row
  return <TextRibbonApp onToggleMode={toggle} />
}
