import { useState, useCallback } from 'react'
import './MobileSplash.css'

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768
}

function requestFullscreen() {
  const el = document.documentElement
  const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen
  if (rfs) {
    rfs.call(el).catch(() => {})
  }
}

export function MobileSplash({ onEnter }) {
  // Initialize synchronously to avoid FOUC — app flashes for one frame if we use useEffect
  const [visible, setVisible] = useState(() =>
    isMobile() && !sessionStorage.getItem('puddle_splashed')
  )

  const handleEnter = useCallback(() => {
    sessionStorage.setItem('puddle_splashed', '1')
    requestFullscreen()
    setVisible(false)
    onEnter?.()
  }, [onEnter])

  if (!visible) return null

  return (
    <div className="mobile-splash" onClick={handleEnter}>
      <div className="mobile-splash__content">
        <div className="mobile-splash__logo">puddle</div>
        <div className="mobile-splash__hint">tap to enter</div>
      </div>
    </div>
  )
}
