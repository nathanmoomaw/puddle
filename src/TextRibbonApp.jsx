/**
 * Text Ribbon — v2 "lo" mode
 * Same audio engine as puddle party mode. Visual layer: ASCII ribbon canvas.
 */
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useKeyboard } from './hooks/useKeyboard'
import { useArpeggiator } from './hooks/useArpeggiator'
import { useShake } from './hooks/useShake'
import { useMIDI } from './hooks/useMIDI'
import { SCALES, HIDDEN_SCALES } from './utils/scales'
import { AsciiRibbon } from './components/AsciiRibbon'
import { AsciiControls } from './components/AsciiControls'
import { AsciiLogo } from './components/AsciiLogo'
import { WalletButton } from './components/WalletButton'
import { MilestoneBadge } from './components/MilestoneBadge'
import { InfoModal } from './components/InfoModal'
import { PresetQR } from './components/PresetQR'
import { MobileSplash } from './components/MobileSplash'
import { MilestoneToast, useMilestoneToast } from './components/MilestoneToast'
import { checkMilestone } from './crypto/milestones'
import { readPresetFromUrl } from './utils/presets'
import { positionToFrequency } from './utils/pitchMap'
import './TextRibbonApp.css'

const WALLET_FLAG_KEY = 'puddle_wallet_ever_connected'
const WAVEFORMS = ['sine', 'square', 'sawtooth', 'triangle']

function nudge(current, min, max, intensity) {
  const range = max - min
  const delta = (Math.random() - 0.5) * range * 0.3 * intensity
  return Math.max(min, Math.min(max, current + delta))
}

const _urlPresetData = readPresetFromUrl()
const _urlPreset = _urlPresetData?.settings ?? null

export default function TextRibbonApp() {
  const getEngine = useAudioEngine()
  const { address: walletAddress, isConnected } = useAccount()

  const [walletFlagSet, setWalletFlagSet] = useState(!!localStorage.getItem(WALLET_FLAG_KEY))
  useEffect(() => {
    if (isConnected) {
      localStorage.setItem(WALLET_FLAG_KEY, '1')
      setWalletFlagSet(true)
    }
  }, [isConnected])

  const handleForgetWallet = useCallback(() => {
    localStorage.removeItem(WALLET_FLAG_KEY)
    Object.keys(localStorage)
      .filter(k => k.startsWith('wagmi'))
      .forEach(k => localStorage.removeItem(k))
    setWalletFlagSet(false)
  }, [])

  // Core synth state
  const [mode, setMode] = useState(_urlPreset?.mode ?? 'play')
  const [poly, setPoly] = useState(_urlPreset?.poly ?? false)
  const [hold, setHold] = useState(_urlPreset?.hold ?? false)
  const [oscParams, setOscParams] = useState(_urlPreset?.oscParams ?? [
    { waveform: 'sawtooth', detune: 0, mix: 1.0 },
    { waveform: 'sawtooth', detune: 0, mix: 0.0 },
    { waveform: 'sawtooth', detune: 0, mix: 0.0 },
  ])
  const [volume, setVolume] = useState(_urlPreset?.volume ?? 0.5)
  const [octaves, setOctaves] = useState(_urlPreset?.octaves ?? 2)
  const [delayParams, setDelayParams] = useState(_urlPreset?.delayParams ?? { time: 0.3, feedback: 0.4, mix: 0 })
  const [reverbMix, setReverbMix] = useState(_urlPreset?.reverbMix ?? 0)
  const [crunch, setCrunch] = useState(_urlPreset?.crunch ?? 0)
  const [filterParams, setFilterParams] = useState(_urlPreset?.filterParams ?? { cutoff: 20000, resonance: 0 })
  const [vcfCutoff, setVcfCutoff] = useState(_urlPreset?.vcfCutoff ?? 2000)
  const [vcfResonance, setVcfResonance] = useState(_urlPreset?.vcfResonance ?? 8)
  const [vcfRouting, setVcfRouting] = useState(_urlPreset?.vcfRouting ?? [false, false, false])
  const [glideSpeed, setGlideSpeed] = useState(_urlPreset?.glideSpeed ?? 0.005)
  const [stepped, setStepped] = useState(_urlPreset?.stepped ?? false)
  const [scale, setScale] = useState(_urlPreset?.scale ?? ['chromatic'])
  const [arpBpm, setArpBpm] = useState(_urlPreset?.arpBpm ?? 120)
  const [arpNotes, setArpNotes] = useState(_urlPreset?.arpNotes ?? [])
  const [shaking, setShaking] = useState(false)
  const [doubleHarmonicUnlocked, setDoubleHarmonicUnlocked] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [qrSettings, setQrSettings] = useState(null)

  const [showIosHint, setShowIosHint] = useState(() => {
    const isIOS = /iP(ad|hone|od)/i.test(navigator.userAgent)
    return isIOS && !localStorage.getItem('puddle_ios_hint_dismissed')
  })
  const dismissIosHint = useCallback(() => {
    localStorage.setItem('puddle_ios_hint_dismissed', '1')
    setShowIosHint(false)
  }, [])
  useEffect(() => {
    if (!showIosHint) return
    const t = setTimeout(dismissIosHint, 9000)
    return () => clearTimeout(t)
  }, [showIosHint, dismissIosHint])

  const ribbonInteraction = useRef({ position: null, velocity: 0, active: false })
  const sidebarRef = useRef(null)
  const canvasAreaRef = useRef(null)
  const arpStopRef = useRef(null)
  const lastSpaceRef = useRef(0)

  // Ref mirrors for stable callbacks
  const filterParamsRef = useRef(filterParams)
  const glideSpeedRef = useRef(glideSpeed)
  const delayParamsRef = useRef(delayParams)
  const reverbMixRef = useRef(reverbMix)
  const crunchRef = useRef(crunch)
  const arpBpmRef = useRef(arpBpm)
  const octavesRef = useRef(octaves)
  const steppedRef = useRef(stepped)
  const scaleRef = useRef(scale)
  const modeRef = useRef(mode)
  const polyRef = useRef(poly)
  const holdRef = useRef(hold)

  filterParamsRef.current = filterParams
  glideSpeedRef.current = glideSpeed
  delayParamsRef.current = delayParams
  reverbMixRef.current = reverbMix
  crunchRef.current = crunch
  arpBpmRef.current = arpBpm
  octavesRef.current = octaves
  steppedRef.current = stepped
  scaleRef.current = scale
  modeRef.current = mode
  polyRef.current = poly
  holdRef.current = hold

  // Apply URL preset on mount
  useEffect(() => {
    if (!_urlPreset) return
    const engine = getEngine()
    _urlPreset.oscParams?.forEach((p, i) => {
      engine.setWaveform(p.waveform, i)
      engine.setOscMix(i, p.mix)
      engine.setOscDetune(i, p.detune)
    })
    engine.setVolume(_urlPreset.volume)
    engine.setDelay(_urlPreset.delayParams)
    engine.setReverb({ mix: _urlPreset.reverbMix })
    engine.setCrunch(_urlPreset.crunch)
    engine.setFilter(_urlPreset.filterParams)
    engine.setGlideSpeed(_urlPreset.glideSpeed)
    if (_urlPreset.vcfCutoff != null) {
      engine.setVcfCutoff(_urlPreset.vcfCutoff)
      engine.setVcfResonance(_urlPreset.vcfResonance)
      _urlPreset.vcfRouting?.forEach((on, i) => engine.setVcfRouting(i, on))
    }
    if (window.location.hash) history.replaceState(null, '', window.location.pathname)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync audio engine when parameters change
  useEffect(() => { getEngine().setVolume(volume) }, [volume, getEngine])
  useEffect(() => { getEngine().setDelay(delayParams) }, [delayParams, getEngine])
  useEffect(() => { getEngine().setReverb({ mix: reverbMix }) }, [reverbMix, getEngine])
  useEffect(() => { getEngine().setCrunch(crunch) }, [crunch, getEngine])
  useEffect(() => { getEngine().setFilter(filterParams) }, [filterParams, getEngine])
  useEffect(() => { getEngine().setGlideSpeed(glideSpeed) }, [glideSpeed, getEngine])
  useEffect(() => { getEngine().setVcfCutoff(vcfCutoff) }, [vcfCutoff, getEngine])
  useEffect(() => { getEngine().setVcfResonance(vcfResonance) }, [vcfResonance, getEngine])
  useEffect(() => {
    vcfRouting.forEach((on, i) => getEngine().setVcfRouting(i, on))
  }, [vcfRouting, getEngine])
  useEffect(() => {
    oscParams.forEach((p, i) => {
      getEngine().setWaveform(p.waveform, i)
      getEngine().setOscMix(i, p.mix)
      getEngine().setOscDetune(i, p.detune)
    })
  }, [oscParams, getEngine])

  // Shake noise burst
  const shakeNoiseBurst = useCallback((intensity) => {
    const engine = getEngine()
    const count = 3 + Math.floor(intensity * 2)
    const duration = 80 + intensity * 120
    const ids = []
    for (let i = 0; i < count; i++) {
      const nx = Math.random()
      const hz = positionToFrequency(nx, { octaves: 2, scale: ['chromatic'] })
      const id = `shake_${i}_${Date.now()}`
      ids.push(id)
      engine.voiceOn(id, hz, 0.3 + Math.random() * 0.5 * intensity)
    }
    setTimeout(() => {
      ids.forEach(id => engine.voiceOff(id))
    }, duration)
  }, [getEngine])

  const handleShake = useCallback((intensity = 1) => {
    setShaking(true)
    setTimeout(() => setShaking(false), 300)
    shakeNoiseBurst(intensity)

    setOscParams(prev => prev.map(p => ({
      ...p,
      waveform: Math.random() < 0.2 ? WAVEFORMS[Math.floor(Math.random() * WAVEFORMS.length)] : p.waveform,
      detune: nudge(p.detune, -50, 50, intensity),
      mix: nudge(p.mix, 0, 1, intensity),
    })))
    setDelayParams(prev => ({
      time: nudge(prev.time, 0, 1, intensity),
      feedback: nudge(prev.feedback, 0, 0.9, intensity),
      mix: nudge(prev.mix, 0, 1, intensity),
    }))
    setReverbMix(v => nudge(v, 0, 1, intensity))
    setCrunch(v => nudge(v, 0, 1, intensity))
    setArpBpm(v => nudge(v, 40, 280, intensity))
    setOctaves(() => [2, 3, 4][Math.floor(Math.random() * 3)])

    if (Math.random() < 0.03) setDoubleHarmonicUnlocked(true)
  }, [shakeNoiseBurst])

  useShake(handleShake, sidebarRef, canvasAreaRef)

  const handleArpNoteToggle = useCallback((hz) => {
    setArpNotes(prev => {
      const existing = prev.findIndex(n => Math.abs(n - hz) < 1)
      if (existing !== -1) {
        const next = [...prev]
        next.splice(existing, 1)
        return next
      }
      return [...prev, hz]
    })
  }, [])

  const handleArpNoteAdd = useCallback((hz) => {
    setArpNotes(prev => {
      if (prev.some(n => Math.abs(n - hz) < 1)) return prev
      return [...prev, hz]
    })
  }, [])

  const handleArpNoteRemove = useCallback((hz) => {
    setArpNotes(prev => prev.filter(n => Math.abs(n - hz) >= 1))
  }, [])

  const { arpStart, arpStop } = useArpeggiator(getEngine, mode, arpBpm, arpNotes, hold)
  arpStopRef.current = arpStop

  const { midiDevice, connectMIDI } = useMIDI(getEngine, {
    setVolume, setFilterParams, setGlideSpeed, setDelayParams,
    setReverbMix, setCrunch, setOscParams, setArpBpm, setHold,
    mode, poly, hold, octaves, stepped, scale,
    handleArpNoteToggle, handleArpNoteAdd, handleArpNoteRemove,
    arpStart, arpStop,
  })

  const handleStop = useCallback(() => {
    getEngine().allNotesOff()
    setHold(false)
    setArpNotes([])
    arpStop()
  }, [getEngine, arpStop])

  const { current: currentMilestone, show: showMilestone, dismiss: dismissMilestone } = useMilestoneToast()

  const handleQRCreate = useCallback(() => {
    setQrSettings({
      mode, oscParams, volume, octaves, delayParams, reverbMix, crunch,
      filterParams, vcfCutoff, vcfResonance, vcfRouting, glideSpeed, stepped, scale,
      poly, hold, arpBpm, visualMode: 'lo', arpNotes,
      loopData: null,
      walletAddress,
      marbles: [],
      puddleActivity: 0,
    })
    const m = checkMilestone('shared_preset')
    if (m) showMilestone(m)
  }, [mode, oscParams, volume, octaves, delayParams, reverbMix, crunch,
      filterParams, vcfCutoff, vcfResonance, vcfRouting, glideSpeed, stepped, scale,
      poly, hold, arpBpm, arpNotes, walletAddress, showMilestone])

  const keyHandlers = useMemo(() => ({
    Space: () => {
      const now = Date.now()
      const elapsed = now - lastSpaceRef.current
      lastSpaceRef.current = now
      if (elapsed < 400) {
        getEngine().killAllSound?.() ?? getEngine().allNotesOff()
      } else {
        getEngine().allNotesOff()
      }
      setHold(false)
      setArpNotes([])
      arpStopRef.current?.()
    },
    Digit1: () => setMode('play'),
    Digit2: () => setMode('arp'),
    Digit3: () => setPoly(p => !p),
    Digit4: () => setHold(h => !h),
  }), [getEngine])

  useKeyboard(keyHandlers)

  return (
    <div className="text-ribbon-app">
      <MobileSplash onEnter={() => getEngine()} />

      <div className="text-ribbon-bg" />
      <div className="text-ribbon-grid-floor" />

      {/* Fixed top-left: QR + info (below party/lo toggle in AppShell) */}
      <button
        className="app-header__qr-btn"
        onClick={handleQRCreate}
        title="Create preset QR code"
        aria-label="Create preset QR code"
        style={{ position: 'fixed' }}
      >
        &#x25A3;
      </button>
      <button
        className={`app-header__info-btn${showInfo ? ' app-header__info-btn--active' : ''}`}
        onClick={() => setShowInfo(v => !v)}
        onPointerDown={e => e.stopPropagation()}
        title="About Puddle"
        aria-label="About Puddle"
        style={{ position: 'fixed' }}
      >
        ⓘ
      </button>
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}

      {/* Fixed top-right: MIDI → POAP badge → wallet */}
      <div className="app-header__right" style={{ position: 'fixed' }}>
        <button
          className={`keys-toggle__btn keys-toggle__midi ${midiDevice && midiDevice !== 'no-device' && midiDevice !== 'unsupported' && midiDevice !== 'denied' ? 'active' : ''} ${midiDevice === 'unsupported' || midiDevice === 'denied' ? 'keys-toggle__midi--err' : ''} ${midiDevice === 'no-device' ? 'keys-toggle__midi--waiting' : ''}`}
          onClick={connectMIDI}
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
        <MilestoneBadge />
        <WalletButton flagSet={walletFlagSet && !isConnected} onForget={handleForgetWallet} />
      </div>

      <header className="text-ribbon-header">
        <div className="text-ribbon-header__left">
          <div className="text-ribbon-header__status">
            <span className={`status-dot${shaking ? ' status-dot--shake' : ''}`}>◈</span>
            <span className="status-mode">[{mode.toUpperCase()}]</span>
            {hold && <span className="status-hold">HOLD</span>}
            {poly && <span className="status-poly">POLY</span>}
          </div>
        </div>
        <AsciiLogo onClick={() => handleShake(1.5)} />
        <div className="text-ribbon-header__right">
          <button
            className="header-shake-btn"
            onClick={() => handleShake(1)}
            title="Shake (randomize)"
            aria-label="Shake"
          >⚡</button>
        </div>
      </header>

      <main className="text-ribbon-main">
        <aside className="text-ribbon-sidebar" ref={sidebarRef}>
          <AsciiControls
            mode={mode} setMode={setMode}
            poly={poly} setPoly={setPoly}
            hold={hold} setHold={setHold}
            arpBpm={arpBpm} setArpBpm={setArpBpm}
            volume={volume} setVolume={setVolume}
            octaves={octaves} setOctaves={setOctaves}
            scale={scale} setScale={setScale}
            glideSpeed={glideSpeed} setGlideSpeed={setGlideSpeed}
            stepped={stepped} setStepped={setStepped}
            oscParams={oscParams} setOscParams={setOscParams}
            delayParams={delayParams} setDelayParams={setDelayParams}
            reverbMix={reverbMix} setReverbMix={setReverbMix}
            crunch={crunch} setCrunch={setCrunch}
            vcfCutoff={vcfCutoff} setVcfCutoff={setVcfCutoff}
            vcfResonance={vcfResonance} setVcfResonance={setVcfResonance}
            vcfRouting={vcfRouting} setVcfRouting={setVcfRouting}
            onStop={handleStop}
            onShake={() => handleShake(1)}
            doubleHarmonicUnlocked={doubleHarmonicUnlocked}
          />
        </aside>

        <section className="text-ribbon-canvas" ref={canvasAreaRef}>
          <AsciiRibbon
            getEngine={getEngine}
            mode={mode}
            octaves={octaves}
            stepped={stepped}
            scale={scale}
            ribbonInteraction={ribbonInteraction}
            arpStart={arpStart}
            arpStop={arpStop}
            hold={hold}
            poly={poly}
            shaking={shaking}
            onArpNoteToggle={handleArpNoteToggle}
            arpNotes={arpNotes}
            oscParams={oscParams}
          />
        </section>
      </main>

      {qrSettings && (
        <PresetQR settings={qrSettings} initialName="" onClose={() => setQrSettings(null)} onMilestone={showMilestone} />
      )}

      <MilestoneToast milestone={currentMilestone} onDismiss={dismissMilestone} />

      {showIosHint && (
        <div className="ios-silent-hint" onClick={dismissIosHint} role="alert">
          <span className="ios-silent-hint__icon">🔔</span>
          <span className="ios-silent-hint__text">No sound? Check the Ring/Silent switch on the side of your iPhone.</span>
          <button className="ios-silent-hint__close" aria-label="Dismiss">×</button>
        </div>
      )}
    </div>
  )
}
