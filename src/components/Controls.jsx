import { useCallback, useRef as useRefHook, useEffect, forwardRef, memo, useRef } from 'react'
import { SCALES, SCALE_LABELS } from '../utils/scales'
import { ActivationMode } from './ActivationMode'
import { RotaryKnob } from './RotaryKnob'
import { DualKnob } from './DualKnob'
import { VCFControl } from './VCFControl'
import './Controls.css'

// ── BipolarKnob — circular SVG knob: 0=left(7-o-clock), 0.5=top(12), 1=right(5-o-clock) ──
// Imported from ribbon v3 lo mode design; used for Space and Tone macro controls.
function BipolarKnob({ label, subLabel, value, onChange, color = '#00e5cc' }) {
  const dragging = useRef(false)
  const startY = useRef(0)
  const startVal = useRef(0)

  const MIN_DEG = -135
  const MAX_DEG = 135
  const angleDeg = MIN_DEG + value * (MAX_DEG - MIN_DEG)
  const angleRad = (angleDeg * Math.PI) / 180

  const cx = 14, cy = 14, r = 9
  const tipX = cx + r * Math.sin(angleRad)
  const tipY = cy - r * Math.cos(angleRad)

  const toXY = (deg) => {
    const rad = (deg * Math.PI) / 180
    return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)]
  }
  const [x0, y0] = toXY(MIN_DEG)
  const [x1, y1] = toXY(MAX_DEG)
  const trackPath = `M ${x0} ${y0} A ${r} ${r} 0 1 1 ${x1} ${y1}`

  const sweepSpan = angleDeg - MIN_DEG
  const largeArc = sweepSpan > 180 ? 1 : 0
  const activePath = `M ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${tipX.toFixed(2)} ${tipY.toFixed(2)}`

  const onDown = useCallback((e) => {
    dragging.current = true
    startY.current = e.clientY
    startVal.current = value
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [value])

  const onMove = useCallback((e) => {
    if (!dragging.current) return
    const delta = (startY.current - e.clientY) / 100
    onChange(Math.max(0, Math.min(1, startVal.current + delta)))
  }, [onChange])

  const onUp = useCallback(() => { dragging.current = false }, [])

  const sideLabel = value < 0.45 ? (subLabel?.left ?? 'L') : value > 0.55 ? (subLabel?.right ?? 'R') : '·'

  return (
    <div
      className="bipolar-knob"
      style={{ '--bipolar-color': color }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      title={`${label}: drag up/down. Center=neutral, left=${subLabel?.left}, right=${subLabel?.right}`}
    >
      <div className="bipolar-knob__label">{label}</div>
      <svg className="bipolar-knob__svg" viewBox="0 0 28 28" width="52" height="52">
        <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" strokeLinecap="round" />
        <path d={activePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
        <circle cx={tipX} cy={tipY} r="2.5" fill={color}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        <line x1={cx} y1={cy} x2={tipX} y2={tipY} stroke={color} strokeWidth="1" opacity="0.3" />
      </svg>
      <div className="bipolar-knob__side">{sideLabel}</div>
    </div>
  )
}

function DJFader({ value, onChange, ghostValue }) {
  const trackRef = useRefHook(null)
  const thumbRef = useRefHook(null)
  const valueRef = useRefHook(null)
  const dragging = useRefHook(false)
  const cachedRect = useRefHook(null)
  const isHorizontal = useRefHook(false)
  const rafRef = useRefHook(null)

  // Direct DOM update — bypasses React re-render for zero-lag thumb movement
  const applyThumbPosition = useCallback((ratio) => {
    const thumb = thumbRef.current
    const valEl = valueRef.current
    if (thumb) {
      const topPct = (1 - ratio) * 100
      const leftPct = ratio * 100
      thumb.style.setProperty('--thumb-top', `calc(${topPct}% - 5px)`)
      thumb.style.setProperty('--thumb-left', `calc(${leftPct}% - 5px)`)
    }
    if (valEl) valEl.textContent = Math.round(ratio * 100)
  }, [])

  const onPointerDown = useCallback((e) => {
    dragging.current = true
    const track = trackRef.current
    if (!track) return
    e.currentTarget.setPointerCapture(e.pointerId)
    // Cache rect once on pointer down — avoids layout thrash on every move
    cachedRect.current = track.getBoundingClientRect()
    isHorizontal.current = cachedRect.current.width > cachedRect.current.height
    const rect = cachedRect.current
    const ratio = isHorizontal.current
      ? Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      : 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    applyThumbPosition(ratio)
    onChange(ratio)
  }, [onChange, applyThumbPosition])

  const onPointerMove = useCallback((e) => {
    if (!dragging.current || !cachedRect.current) return
    const rect = cachedRect.current
    const ratio = isHorizontal.current
      ? Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      : 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    applyThumbPosition(ratio)
    onChange(ratio)
  }, [onChange, applyThumbPosition])

  const onPointerUp = useCallback(() => {
    dragging.current = false
    cachedRect.current = null
  }, [])

  const pct = Math.round(value * 100)
  const thumbTop = (1 - value) * 100
  const thumbLeft = value * 100

  return (
    <div className="controls__fader">
      <label className="controls__fader-label">Vol</label>
      <div
        className="controls__fader-track"
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="controls__fader-groove" />
        {ghostValue != null && (
          <div
            className="controls__fader-ghost"
            style={{
              '--ghost-top': `calc(${(1 - ghostValue) * 100}% - 5px)`,
              '--ghost-left': `calc(${ghostValue * 100}% - 5px)`,
            }}
          />
        )}
        <div
          ref={thumbRef}
          className="controls__fader-thumb"
          style={{
            '--thumb-top': `calc(${thumbTop}% - 5px)`,
            '--thumb-left': `calc(${thumbLeft}% - 5px)`,
          }}
        />
      </div>
      <span ref={valueRef} className="controls__fader-value">{pct}</span>
    </div>
  )
}

/**
 * GoopableSection — wraps a control section, registers it for goop hit-testing,
 * and renders a goop visual overlay when gooped.
 */
function GoopableSection({ id, registerControl, goopLevel, puddleActivity, children, className }) {
  const elRef = useRefHook(null)

  useEffect(() => {
    if (registerControl && id) {
      registerControl(id, elRef.current)
      return () => registerControl(id, null)
    }
  }, [id, registerControl])

  const hasGoop = goopLevel > 0.01
  const isActive = puddleActivity > 0 && hasGoop

  return (
    <div
      ref={elRef}
      className={`${className || ''} ${hasGoop ? 'gooped' : ''} ${isActive ? 'gooped--active' : ''}`}
      style={hasGoop ? {
        position: 'relative',
        '--goop-level': goopLevel,
        '--goop-opacity': Math.min(0.7, goopLevel * 0.8),
      } : undefined}
    >
      {children}
      {hasGoop && (
        <div className="goop-effect" style={{ '--goop-level': goopLevel }}>
          <svg viewBox="0 0 100 60" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <radialGradient id={`goop-grad-${id}`} cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="rgba(180, 100, 255, 0.4)" />
                <stop offset="50%" stopColor="rgba(100, 200, 255, 0.2)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <ellipse
              cx="50" cy="30"
              rx={25 + goopLevel * 20}
              ry={12 + goopLevel * 12}
              fill={`url(#goop-grad-${id})`}
              stroke={`rgba(120, 80, 200, ${goopLevel * 0.5})`}
              strokeWidth="1.5"
            />
            {goopLevel > 0.3 && (
              <ellipse
                cx={35 + goopLevel * 15}
                cy={18 + goopLevel * 8}
                rx={10 + goopLevel * 8}
                ry={6 + goopLevel * 6}
                fill={`rgba(180, 100, 255, ${goopLevel * 0.15})`}
                stroke={`rgba(180, 100, 255, ${goopLevel * 0.4})`}
                strokeWidth="1"
              />
            )}
            {goopLevel > 0.6 && (
              <circle
                cx="65" cy="40"
                r={5 + goopLevel * 6}
                fill={`rgba(100, 200, 255, ${goopLevel * 0.1})`}
                stroke={`rgba(100, 200, 255, ${goopLevel * 0.3})`}
                strokeWidth="1"
              />
            )}
          </svg>
        </div>
      )}
    </div>
  )
}

const WAVEFORMS = ['sine', 'square', 'sawtooth', 'triangle']
const WAVEFORM_SYMBOLS = { sine: '∿', square: '⊓', sawtooth: '⊿', triangle: '△' }
const OCTAVE_OPTIONS = [1, 2, 3, 4, 5, 6]
const SCALE_NAMES = Object.keys(SCALES)
const OSC_COLORS = ['var(--osc-red)', 'var(--osc-gold)', 'var(--osc-green)']
// Inverse/contrasting color for the detune zone ring (opposite hue from osc glow)
const OSC_DETUNE_COLORS = ['#ff3300', '#00cc55', '#aa00ff']

function MiniShakeBolt({ onClick, title }) {
  const btnRef = useRefHook(null)
  const handleClick = useCallback(() => {
    // Shake the parent panel
    const panel = btnRef.current?.closest('.controls__osc, .controls__shared, .controls__toggles')
    if (panel) {
      panel.classList.remove('controls__section-shake')
      void panel.offsetWidth // force reflow to restart animation
      panel.classList.add('controls__section-shake')
    }
    onClick()
  }, [onClick])

  return (
    <button
      ref={btnRef}
      className="controls__mini-shake"
      onClick={handleClick}
      title={title || 'Randomize'}
    >
      ⚡
    </button>
  )
}

const OscSection = memo(function OscSection({ index, params, getEngine, onUpdate }) {
  const handleWaveformCycle = useCallback(() => {
    const idx = WAVEFORMS.indexOf(params.waveform)
    const next = WAVEFORMS[(idx + 1) % WAVEFORMS.length]
    onUpdate(index, { ...params, waveform: next })
    getEngine().setWaveform(next, index)
  }, [index, params, getEngine, onUpdate])

  const handleDetune = useCallback((val) => {
    const detune = Math.round(val)
    onUpdate(index, { ...params, detune })
    getEngine().setOscDetune(index, detune)
  }, [index, params, getEngine, onUpdate])

  const handleMix = useCallback((val) => {
    onUpdate(index, { ...params, mix: val })
    getEngine().setOscMix(index, val)
  }, [index, params, getEngine, onUpdate])

  const handleOscShake = useCallback(() => {
    const engine = getEngine()
    const waveform = WAVEFORMS[Math.floor(Math.random() * WAVEFORMS.length)]
    const mix = Math.random()
    const detune = Math.round((Math.random() - 0.5) * 2400)
    onUpdate(index, { waveform, mix, detune })
    engine.setWaveform(waveform, index)
    engine.setOscMix(index, mix)
    engine.setOscDetune(index, detune)
  }, [index, getEngine, onUpdate])

  const symbol = WAVEFORM_SYMBOLS[params.waveform] ?? '∿'

  return (
    <div className="controls__osc" style={{ '--osc-color': OSC_COLORS[index] }}>
      <div className="controls__osc-inline">
        <button
          className="controls__osc-waveform-btn"
          onClick={handleWaveformCycle}
          title={`${params.waveform} — click to cycle waveform`}
        >
          <span className="controls__osc-waveform-symbol">{symbol}</span>
          <span className="controls__osc-waveform-label">OSC {index + 1}</span>
        </button>
        <DualKnob
          mixValue={params.mix}
          detuneValue={params.detune}
          onMixChange={handleMix}
          onDetuneChange={handleDetune}
          color={OSC_COLORS[index]}
          detuneColor={OSC_DETUNE_COLORS[index]}
          size={52}
          mixLabel={`${Math.round(params.mix * 100)}%`}
          detuneLabel={`${params.detune}¢`}
        />
      </div>
    </div>
  )
})

export const Controls = forwardRef(function Controls({
  getEngine,
  oscParams,
  setOscParams,
  volume,
  setVolume,
  octaves,
  setOctaves,
  stepped,
  setStepped,
  scale,
  setScale,
  delayParams,
  setDelayParams,
  reverbMix,
  setReverbMix,
  crunch,
  setCrunch,
  filterParams,
  setFilterParams,
  glideSpeed,
  setGlideSpeed,
  // Space/Tone macro knobs (v2+)
  space,
  onSpaceChange,
  tone,
  onToneChange,
  shaking,
  mode,
  setMode,
  poly,
  setPoly,
  arpBpm,
  setArpBpm,
  hold,
  setHold,
  onStop,
  onKillAll,
  onQRCreate,
  goopLevels,
  puddleActivity,
  registerControl,
  trayMarble,
  draggingMarble,
  onMarblePickUp,
  nextSlotId,
  vcfCutoff,
  vcfResonance,
  vcfRouting,
  onVcfCutoffChange,
  onVcfResonanceChange,
  onVcfRoutingToggle,
  midiDevice,
  onConnectMIDI,
  utilitySlot,
}, ref) {
  const handleOscUpdate = useCallback((index, newParams) => {
    setOscParams((prev) => {
      const next = [...prev]
      next[index] = newParams
      return next
    })
  }, [setOscParams])

  const volRafRef = useRefHook(null)
  const handleVolume = useCallback((val) => {
    // Update engine immediately; skip React state to avoid re-rendering entire Controls tree
    getEngine().setVolume(val)
    // Debounced state sync so React value stays roughly current
    if (volRafRef.current) cancelAnimationFrame(volRafRef.current)
    volRafRef.current = requestAnimationFrame(() => setVolume(val))
  }, [getEngine, setVolume])

  const handleDelayTime = useCallback((val) => {
    setDelayParams((prev) => ({ ...prev, time: val }))
    getEngine().setDelay({ time: val })
  }, [getEngine, setDelayParams])

  const handleDelayFeedback = useCallback((val) => {
    setDelayParams((prev) => ({ ...prev, feedback: val }))
    getEngine().setDelay({ feedback: val })
  }, [getEngine, setDelayParams])

  const handleDelayMix = useCallback((val) => {
    setDelayParams((prev) => ({ ...prev, mix: val }))
    getEngine().setDelay({ mix: val })
  }, [getEngine, setDelayParams])

  const handleReverbMix = useCallback((val) => {
    setReverbMix(val)
    getEngine().setReverb({ mix: val })
  }, [getEngine, setReverbMix])

  const handleCutoff = useCallback((val) => {
    setFilterParams((prev) => ({ ...prev, cutoff: val }))
    getEngine().setFilter({ cutoff: val })
  }, [getEngine, setFilterParams])

  const handleResonance = useCallback((val) => {
    setFilterParams((prev) => ({ ...prev, resonance: val }))
    getEngine().setFilter({ resonance: val })
  }, [getEngine, setFilterParams])

  const handleCrunch = useCallback((val) => {
    setCrunch(val)
    getEngine().setCrunch(val)
  }, [getEngine, setCrunch])

  const handleGlideSpeed = useCallback((val) => {
    setGlideSpeed(val)
    getEngine().setGlideSpeed(val)
  }, [getEngine, setGlideSpeed])

  return (
    <div ref={ref} className={`controls ${shaking ? 'controls--shaking' : ''}`}>
      <div className="controls__bar">

        {/* Left group: activation + volume + octave + scale */}
        <div className="controls__group controls__group--left">
          <MiniShakeBolt onClick={() => {
            const newOctaves = OCTAVE_OPTIONS[Math.floor(Math.random() * OCTAVE_OPTIONS.length)]
            setOctaves(newOctaves)
            const randomScale = SCALE_NAMES[Math.floor(Math.random() * SCALE_NAMES.length)]
            setScale([randomScale])
            if (randomScale !== 'chromatic') setStepped(true)
            else setStepped(false)
            const newSpeed = 0.001 + Math.random() * 0.299
            setGlideSpeed(newSpeed)
            getEngine().setGlideSpeed(newSpeed)
            if (Math.random() < 0.3) setMode(m => m === 'play' ? 'arp' : 'play')
            if (Math.random() < 0.3) setPoly(p => !p)
          }} title="Randomize left controls" />
          <ActivationMode
            mode={mode}
            setMode={setMode}
            poly={poly}
            setPoly={setPoly}
            arpBpm={arpBpm}
            setArpBpm={setArpBpm}
            hold={hold}
            setHold={setHold}
            onStop={onStop}
            onKillAll={onKillAll}
            trayMarble={trayMarble}
            draggingMarble={draggingMarble}
            onMarblePickUp={onMarblePickUp}
            nextSlotId={nextSlotId}
          />
          <DJFader value={volume} onChange={handleVolume} />

          <div className="controls__section">
            <RotaryKnob
              value={octaves}
              min={1}
              max={octaves === 7 ? 7 : 6}
              step={1}
              onChange={setOctaves}
              color="var(--cyan)"
              label={octaves === 7 ? '7★' : 'Oct'}
              size={40}
            />
          </div>

          <div className="controls__section controls__section--full">
            <label className="controls__label">Scale</label>
            <div className="controls__waveforms">
              {SCALE_NAMES.map((s) => {
                const isDoubleHarmonicActive = scale.includes('double harmonic')
                const isActive = !isDoubleHarmonicActive && scale.includes(s)
                return (
                  <button
                    key={s}
                    className={isActive ? 'active' : ''}
                    onClick={() => {
                      setScale(prev => {
                        if (s === 'chromatic') {
                          setStepped(false)
                          return ['chromatic']
                        }
                        setStepped(true)
                        const without = prev.filter(x => x !== 'chromatic' && x !== s && x !== 'double harmonic')
                        if (prev.includes(s)) {
                          const remaining = without.length === 0 ? ['chromatic'] : without
                          if (remaining.length === 1 && remaining[0] === 'chromatic') setStepped(false)
                          return remaining
                        }
                        return [...without, s]
                      })
                    }}
                  >
                    {SCALE_LABELS[s] ?? s.slice(0, 4).toUpperCase()}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right group: VCF + Filter + Space/Tone + console corner */}
        <div className="controls__group controls__group--fx">
        <GoopableSection
            id="filter"
            registerControl={registerControl}
            goopLevel={(goopLevels && goopLevels['filter']) || 0}
            puddleActivity={puddleActivity || 0}
            className="controls__shared"
          >
            <VCFControl
              vcfCutoff={vcfCutoff}
              vcfResonance={vcfResonance}
              getEngine={getEngine}
              onCutoffChange={onVcfCutoffChange}
              onResonanceChange={onVcfResonanceChange}
            />
            <div className="controls__section controls__section--filter">
              <label className="controls__label">Filter</label>
              <div className="controls__rotary-row">
                <RotaryKnob value={filterParams.cutoff} min={20} max={20000} step={1} onChange={handleCutoff} color="#ff8c42" label="Cutoff" size={40} />
                <RotaryKnob value={filterParams.resonance} min={0} max={25} step={0.1} onChange={handleResonance} color="#ffd700" label="Res" size={40} />
              </div>
            </div>

            {/* Space macro: 0=cathedral(reverb+delay), 0.5=dry, 1=orbit(rhythmic delay) */}
            {onSpaceChange ? (
              <div className="controls__section controls__section--space">
                <BipolarKnob
                  label="SPACE"
                  subLabel={{ left: 'CATHEDRAL', right: 'ORBIT' }}
                  value={space ?? 0.5}
                  onChange={onSpaceChange}
                  color="#00e5cc"
                />
              </div>
            ) : (
              <>
                <div className="controls__section controls__section--reverb">
                  <label className="controls__label">Reverb <span className="controls__value">{Math.round(reverbMix * 100)}%</span></label>
                  <RotaryKnob value={reverbMix} min={0} max={1} step={0.01} onChange={handleReverbMix} color="#00e5cc" size={40} />
                </div>
                <div className="controls__section controls__section--crunch">
                  <label className="controls__label">Crunch <span className="controls__value">{Math.round(crunch * 100)}%</span></label>
                  <RotaryKnob value={crunch} min={0} max={1} step={0.01} onChange={handleCrunch} color="#ff3366" size={40} />
                </div>
                <div className="controls__section controls__section--full controls__section--delay">
                  <label className="controls__label">Delay</label>
                  <div className="controls__rotary-row">
                    <RotaryKnob value={delayParams.time} min={0.05} max={1} step={0.01} onChange={handleDelayTime} color="#4d8bff" label="Time" size={40} />
                    <RotaryKnob value={delayParams.feedback} min={0} max={0.9} step={0.01} onChange={handleDelayFeedback} color="#9b8bff" label="Fdbk" size={40} />
                    <RotaryKnob value={delayParams.mix} min={0} max={1} step={0.01} onChange={handleDelayMix} color="#c8d0e0" label="Mix" size={40} />
                  </div>
                </div>
              </>
            )}

            {/* Tone macro: 0=grit(crunch+low filter), 0.5=clean, 1=glitter(sparkle resonance) */}
            {onToneChange ? (
              <div className="controls__section controls__section--tone">
                <BipolarKnob
                  label="TONE"
                  subLabel={{ left: 'GRIT', right: 'GLITTER' }}
                  value={tone ?? 0.5}
                  onChange={onToneChange}
                  color="#ff8c42"
                />
              </div>
            ) : null}
            {/* MIDI + wallet + QR — absolute lower-right of console */}
            {(onQRCreate || onConnectMIDI || utilitySlot) && (
              <div className="controls__console-corner">
                {onConnectMIDI && (
                  <button
                    className={`keys-toggle__btn keys-toggle__midi ${midiDevice && midiDevice !== 'no-device' && midiDevice !== 'unsupported' && midiDevice !== 'denied' ? 'active' : ''} ${midiDevice === 'unsupported' || midiDevice === 'denied' ? 'keys-toggle__midi--err' : ''} ${midiDevice === 'no-device' ? 'keys-toggle__midi--waiting' : ''}`}
                    onClick={onConnectMIDI}
                    title={
                      midiDevice === 'unsupported' ? 'MIDI not supported in this browser'
                      : midiDevice === 'denied' ? 'MIDI access denied'
                      : midiDevice === 'no-device' ? 'MIDI enabled — plug in a controller'
                      : midiDevice ? `MIDI: ${midiDevice}`
                      : 'Connect MIDI controller'
                    }
                  >
                    {midiDevice === 'unsupported' ? 'MIDI ✗'
                     : midiDevice === 'denied' ? 'MIDI ✗'
                     : midiDevice === 'no-device' ? 'MIDI …'
                     : midiDevice ? 'MIDI ✓'
                     : 'MIDI'}
                  </button>
                )}
                {utilitySlot}
                {onQRCreate && (
                  <button className="preset-qr-trigger" onClick={onQRCreate} title="Create preset QR code" aria-label="Create preset QR code">
                    &#x25A3;
                  </button>
                )}
              </div>
            )}
          </GoopableSection>
        </div>

        {/* Right column: 3 OSCs stacked vertically + BPM/SPD knob at bottom */}
        <div className="controls__group controls__group--oscs">
          <div className="controls__oscillators">
            {oscParams.map((params, i) => (
              <GoopableSection
                key={i}
                id={`osc-${i}`}
                registerControl={registerControl}
                goopLevel={(goopLevels && goopLevels[`osc-${i}`]) || 0}
                puddleActivity={puddleActivity || 0}
                className="controls__osc-goopable"
              >
                <OscSection
                  index={i}
                  params={params}
                  getEngine={getEngine}
                  onUpdate={handleOscUpdate}
                />
              </GoopableSection>
            ))}
          </div>

          <div className="controls__section controls__section--speed">
            <DualKnob
              mixValue={(arpBpm - 40) / (900 - 40)}
              detuneValue={glideSpeed}
              onMixChange={(v) => setArpBpm(Math.round(40 + v * (900 - 40)))}
              onDetuneChange={handleGlideSpeed}
              color="#ffcc00"
              detuneColor="#39ff14"
              size={52}
              minDetune={0.001}
              maxDetune={0.3}
              roundDetune={false}
              mixLabel={`${arpBpm}`}
              detuneLabel={glideSpeed < 0.01 ? 'fast' : glideSpeed > 0.15 ? 'slow' : 'med'}
              outerLabel="BPM"
              innerLabel="SPD"
            />
          </div>
        </div>
      </div>
    </div>
  )
})
