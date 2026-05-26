import { useRef, useCallback, memo } from 'react'
import './DualKnob.css'

const MIN_ANGLE = -135
const MAX_ANGLE = 135
const ANGLE_RANGE = 270

// "screen clock" convention: 0=top, CW positive
function clockToSVG(angleDeg, cx, cy, r) {
  const rad = angleDeg * Math.PI / 180
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)]
}

function buildArcPath(cx, cy, r, startDeg, endDeg) {
  const sweep = ((endDeg - startDeg) % 360 + 360) % 360
  if (sweep < 0.01) return 'M 0 0'
  const [x0, y0] = clockToSVG(startDeg, cx, cy, r)
  const [x1, y1] = clockToSVG(endDeg, cx, cy, r)
  const largeArc = sweep > 180 ? 1 : 0
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

export const DualKnob = memo(function DualKnob({
  mixValue,
  detuneValue,
  onMixChange,
  onDetuneChange,
  color = 'var(--cyan)',
  detuneColor = 'rgba(255,255,255,0.4)',
  size = 52,
  minDetune = -1200,
  maxDetune = 1200,
  roundDetune = true,
  mixLabel,
  detuneLabel,
  outerLabel = 'MIX',
  innerLabel = 'DET',
}) {
  const knobRef = useRef(null)
  const innerNotchRef = useRef(null)
  const arcFillRef = useRef(null)
  const mixLineRef = useRef(null)
  const mixDotRef = useRef(null)
  const ghostRef = useRef(null)
  const ghostThumbRef = useRef(null)

  const draggingZone = useRef(null)
  const startY = useRef(0)
  const startMix = useRef(0)
  const startDetune = useRef(0)

  const INNER_RATIO = 0.55 // inner circle = 55% of total radius

  // Track hover zone for visual feedback (no state — direct DOM)
  const applyHoverZone = useCallback((zone) => {
    const body = knobRef.current
    if (!body) return
    body.dataset.zone = zone ?? ''
  }, [])

  // Map detune to rotation angle
  const detuneRange = maxDetune - minDetune
  const detuneRatio = Math.max(0, Math.min(1, (detuneValue - minDetune) / detuneRange))
  const detuneAngle = MIN_ANGLE + detuneRatio * ANGLE_RANGE

  // SVG arc parameters
  const strokeWidth = size * 0.115
  const ringRadius = (size / 2) - strokeWidth / 2 - 1
  const cx = size / 2

  // Path-based arc — unambiguous CW from 7:30 to current mix
  const trackPath = buildArcPath(cx, cx, ringRadius, MIN_ANGLE, MAX_ANGLE)
  const fillEndDeg = MIN_ANGLE + mixValue * ANGLE_RANGE
  const fillPath = buildArcPath(cx, cx, ringRadius, MIN_ANGLE, fillEndDeg)

  // Direct DOM update — zero-lag response
  const applyMixVisuals = useCallback((newMix) => {
    const cx = size / 2
    if (arcFillRef.current) {
      const endDeg = MIN_ANGLE + newMix * ANGLE_RANGE
      arcFillRef.current.setAttribute('d', buildArcPath(cx, cx, ringRadius, MIN_ANGLE, endDeg))
    }
    // Update mix dial line + dot position
    const tipAngle = MIN_ANGLE + newMix * ANGLE_RANGE
    const [dotX, dotY] = clockToSVG(tipAngle, cx, cx, ringRadius)
    const zoneSepR = cx * INNER_RATIO
    const [lx1, ly1] = clockToSVG(tipAngle, cx, cx, zoneSepR + 2)
    const [lx2, ly2] = clockToSVG(tipAngle, cx, cx, cx - 2)
    if (mixLineRef.current) {
      mixLineRef.current.setAttribute('x1', lx1.toFixed(2))
      mixLineRef.current.setAttribute('y1', ly1.toFixed(2))
      mixLineRef.current.setAttribute('x2', lx2.toFixed(2))
      mixLineRef.current.setAttribute('y2', ly2.toFixed(2))
    }
    if (mixDotRef.current) {
      mixDotRef.current.setAttribute('cx', dotX.toFixed(2))
      mixDotRef.current.setAttribute('cy', dotY.toFixed(2))
    }
    if (ghostThumbRef.current && draggingZone.current === 'outer') {
      ghostThumbRef.current.style.top = `${(1 - newMix) * 100}%`
    }
  }, [size, ringRadius])

  const applyDetuneVisuals = useCallback((newDetune) => {
    const ratio = (newDetune - minDetune) / detuneRange
    const deg = MIN_ANGLE + ratio * ANGLE_RANGE
    if (innerNotchRef.current) {
      innerNotchRef.current.style.transform = `rotate(${deg}deg)`
    }
    if (ghostThumbRef.current && draggingZone.current === 'inner') {
      ghostThumbRef.current.style.top = `${(1 - ratio) * 100}%`
    }
  }, [minDetune, detuneRange])

  const getZone = useCallback((e) => {
    const knob = knobRef.current
    if (!knob) return 'outer'
    const rect = knob.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    return dist < (rect.width / 2) * INNER_RATIO ? 'inner' : 'outer'
  }, [])

  const onPointerEnter = useCallback((e) => {
    if (!draggingZone.current) applyHoverZone(getZone(e))
  }, [applyHoverZone, getZone])

  const onPointerLeave = useCallback(() => {
    if (!draggingZone.current) applyHoverZone(null)
  }, [applyHoverZone])

  const onPointerDown = useCallback((e) => {
    const zone = getZone(e)
    draggingZone.current = zone
    applyHoverZone(zone)
    startY.current = e.clientY
    startMix.current = mixValue
    startDetune.current = detuneValue
    e.currentTarget.setPointerCapture(e.pointerId)
    if (ghostRef.current) ghostRef.current.classList.add('dual-knob__ghost--visible')
  }, [mixValue, detuneValue, getZone, applyHoverZone])

  const onPointerMove = useCallback((e) => {
    if (!draggingZone.current) {
      applyHoverZone(getZone(e))
      return
    }
    const dy = startY.current - e.clientY
    const deltaRatio = dy / 200

    if (draggingZone.current === 'inner') {
      const newDetune = Math.max(minDetune, Math.min(maxDetune,
        startDetune.current + deltaRatio * detuneRange
      ))
      const stepped = roundDetune ? Math.round(newDetune) : newDetune
      applyDetuneVisuals(stepped)
      onDetuneChange(stepped)
    } else {
      const newMix = Math.max(0, Math.min(1, startMix.current + deltaRatio))
      const stepped = Math.round(newMix * 100) / 100
      applyMixVisuals(stepped)
      onMixChange(stepped)
    }
  }, [minDetune, maxDetune, detuneRange, onMixChange, onDetuneChange, applyMixVisuals, applyDetuneVisuals])

  const onPointerUp = useCallback(() => {
    draggingZone.current = null
    if (ghostRef.current) ghostRef.current.classList.remove('dual-knob__ghost--visible')
    applyHoverZone(null)
  }, [applyHoverZone])

  // Inner circle diameter = 2 × inner_radius = 2 × (size/2 × INNER_RATIO) = size × INNER_RATIO
  const innerSize = size * INNER_RATIO

  // Mix dial line + pointer dot
  const mixTipAngle = MIN_ANGLE + mixValue * ANGLE_RANGE
  const mixZoneSepR = cx * INNER_RATIO
  const [mixLineX1, mixLineY1] = clockToSVG(mixTipAngle, cx, cx, mixZoneSepR + 2)
  const [mixLineX2, mixLineY2] = clockToSVG(mixTipAngle, cx, cx, cx - 2)
  const [mixTipX, mixTipY] = clockToSVG(mixTipAngle, cx, cx, ringRadius)

  return (
    <div
      className="dual-knob"
      style={{ '--knob-size': `${size}px`, '--knob-color': color, '--detune-color': detuneColor, '--inner-size': `${innerSize}px` }}
    >
      {/* Labels */}
      <div className="dual-knob__labels">
        <span className="dual-knob__label dual-knob__label--mix">{mixLabel ?? `${Math.round(mixValue * 100)}%`}</span>
        <span className="dual-knob__label dual-knob__label--det">{detuneLabel ?? `${detuneValue}¢`}</span>
      </div>

      {/* Main hit area — outer ring + inner circle both handled here */}
      <div
        ref={knobRef}
        className="dual-knob__body"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        style={{ touchAction: 'none' }}
      >
        {/* Outer ring — SVG arc showing mix level */}
        <svg
          className="dual-knob__ring-svg"
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
        >
          {/* Track (full 270° background) */}
          <path
            className="dual-knob__ring-track"
            d={trackPath}
            fill="none"
            strokeWidth={strokeWidth}
          />
          {/* Fill (mix value arc) */}
          <path
            ref={arcFillRef}
            className="dual-knob__ring-fill"
            d={fillPath}
            fill="none"
            strokeWidth={strokeWidth}
          />
          {/* Outer boundary ring — frames the full knob */}
          <circle
            className="dual-knob__outer-ring"
            cx={size / 2}
            cy={size / 2}
            r={(size / 2) - 1.5}
            fill="none"
          />
          {/* Zone separator ring — prominent boundary, uses detune (inverse) color */}
          <circle
            className="dual-knob__zone-sep"
            cx={size / 2}
            cy={size / 2}
            r={(size / 2) * INNER_RATIO}
            fill="none"
            stroke={detuneColor}
          />
        </svg>

        {/* Inner circle — detune notch */}
        <div className="dual-knob__inner" style={{ borderColor: detuneColor, boxShadow: `0 0 6px ${detuneColor}44, 0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)` }}>
          <div
            className="dual-knob__notch-ring"
            ref={innerNotchRef}
            style={{ transform: `rotate(${detuneAngle}deg)` }}
          >
            <div className="dual-knob__notch" style={{ background: detuneColor, boxShadow: `0 0 4px ${detuneColor}, 0 0 8px ${detuneColor}66` }} />
          </div>
          {/* Zone label inside inner circle */}
          <span className="dual-knob__zone-label dual-knob__zone-label--det" style={{ color: detuneColor, opacity: 0.7 }}>{innerLabel}</span>
        </div>

        {/* Mix dial needle + dot — separate SVG layer above inner div so it's always visible */}
        <svg
          className="dual-knob__needle-svg"
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
        >
          <line
            ref={mixLineRef}
            x1={mixLineX1} y1={mixLineY1}
            x2={mixLineX2} y2={mixLineY2}
            stroke="rgba(255,255,255,0.92)"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.9))' }}
          />
          <circle
            ref={mixDotRef}
            cx={mixTipX}
            cy={mixTipY}
            r={strokeWidth * 0.8}
            fill={color}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>

        {/* Mix zone label — top of outer ring */}
        <span className="dual-knob__zone-label dual-knob__zone-label--mix">{outerLabel}</span>

        {/* Ghost slider overlay — shows during drag */}
        <div className="dual-knob__ghost" ref={ghostRef}>
          <div className="dual-knob__ghost-track" />
          <div
            className="dual-knob__ghost-thumb"
            ref={ghostThumbRef}
            style={{ top: `${(1 - (draggingZone.current === 'inner' ? detuneRatio : mixValue)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
})
