import { useState, useRef, useCallback } from 'react'
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
  const synthStateRef = useRef(null)

  const handleSynthStateChange = useCallback((settings) => {
    synthStateRef.current = settings
  }, [])

  function toggle() {
    const next = visualMode === 'party' ? 'lo' : 'party'
    setVisualMode(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  const sharedProps = {
    onToggleMode: toggle,
    initialSynthState: synthStateRef.current,
    onSynthStateChange: handleSynthStateChange,
  }

  if (visualMode === 'party') {
    return <App {...sharedProps} />
  }

  return <TextRibbonApp {...sharedProps} />
}
