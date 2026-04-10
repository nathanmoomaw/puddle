import { useState, useEffect, useCallback, useRef } from 'react'
import { getAchievedMilestones, MILESTONES } from '../crypto/milestones'
import './MilestoneBadge.css'

/**
 * Small badge showing earned milestone count.
 * Click to expand a panel listing all milestones (earned + locked).
 */
export function MilestoneBadge() {
  const [achieved, setAchieved] = useState([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  // Refresh achieved list on mount, when panel opens, and when any milestone is earned
  const refresh = useCallback(() => setAchieved(getAchievedMilestones()), [])
  useEffect(() => { refresh() }, [open, refresh])
  useEffect(() => {
    window.addEventListener('puddle:milestone-earned', refresh)
    return () => window.removeEventListener('puddle:milestone-earned', refresh)
  }, [refresh])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const toggle = useCallback(() => setOpen(p => !p), [])

  const achievedIds = new Set(achieved.map(a => a.id))
  const allMilestones = Object.values(MILESTONES)
  const count = achieved.length
  const total = allMilestones.length

  // Don't render until at least one milestone is earned
  if (count === 0) return null

  return (
    <div className="milestone-badge" ref={panelRef}>
      <button
        className="milestone-badge__trigger"
        onClick={toggle}
        title={`${count}/${total} milestones`}
      >
        <span className="milestone-badge__count">{count}</span>
        <span className="milestone-badge__star">✦</span>
      </button>

      {open && (
        <div className="milestone-badge__panel">
          <div className="milestone-badge__header">
            Milestones
            <span className="milestone-badge__tally">{count}/{total}</span>
          </div>
          <ul className="milestone-badge__list">
            {allMilestones.map(ms => {
              const earned = achievedIds.has(ms.id)
              return (
                <li
                  key={ms.id}
                  className={`milestone-badge__item ${earned ? 'milestone-badge__item--earned' : 'milestone-badge__item--locked'}`}
                >
                  <span className="milestone-badge__icon">{earned ? ms.icon : '?'}</span>
                  <div className="milestone-badge__info">
                    <span className="milestone-badge__name">{earned ? ms.name : '???'}</span>
                    <span className="milestone-badge__desc">{earned ? ms.description : 'Keep exploring...'}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
