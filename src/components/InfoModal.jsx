import { useEffect, useRef } from 'react'
import packageJson from '../../package.json'
import './InfoModal.css'

const GIT_SHA = import.meta.env.VITE_GIT_SHA?.slice(0, 7) || null

export function InfoModal({ onClose }) {
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="info-modal" ref={ref}>
      <button className="info-modal__close" onClick={onClose} aria-label="Close">×</button>
      <p className="info-modal__synopsis">
        PUDDLE - iridescent oil-spill synthesizer — touch the puddle, set a condition, step back, let it breathe.
      </p>
      <div className="info-modal__version">v{packageJson.version}{GIT_SHA ? ` · ${GIT_SHA}` : ''}</div>
    </div>
  )
}
