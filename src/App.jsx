import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useKeyboard } from './hooks/useKeyboard'
import { useKeyboardPlay } from './hooks/useKeyboardPlay'
import { useArpeggiator } from './hooks/useArpeggiator'
import { useShake, requestMotionPermission } from './hooks/useShake'
import { useMIDI } from './hooks/useMIDI'
import { useLooper } from './hooks/useLooper'
import { useGoop } from './hooks/useGoop'
import { MilestoneToast, useMilestoneToast } from './components/MilestoneToast'
import { checkMilestone, incrementMilestone } from './crypto/milestones'
import { SCALES } from './utils/scales'
import { Puddle } from './components/Puddle'
import { Controls } from './components/Controls'
import { RibbonLogo } from './components/RibbonLogo'
import { PresetQR } from './components/PresetQR'
// HelpWizard shelved — partially implemented, targeting future version
// import { HelpWizard, WizardTrigger } from './components/HelpWizard'
import { positionToFrequency } from './utils/pitchMap'
import { HIDDEN_SCALES } from './utils/scales'
import { readPresetFromUrl } from './utils/presets'
import { captureScreenshot } from './utils/screenshot'
import { WalletButton } from './components/WalletButton'
import { MilestoneBadge } from './components/MilestoneBadge'
import { InfoModal } from './components/InfoModal'
import { VersionSelector } from './components/VersionSelector'
import { MobileSplash } from './components/MobileSplash'
import { PresetSplash } from './components/PresetSplash'
import { useMarbles } from './hooks/useMarbles'
import { useAccount, useDisconnect } from 'wagmi'
import './App.css'

const WALLET_FLAG_KEY = 'puddle_wallet_ever_connected'

const WAVEFORMS = ['sine', 'square', 'sawtooth', 'triangle']

// Nudge a numeric value randomly within its range, scaled by intensity
function nudge(current, min, max, intensity) {
  const range = max - min
  const delta = (Math.random() - 0.5) * range * 0.3 * intensity
  return Math.max(min, Math.min(max, current + delta))
}

// Read preset from URL hash on initial load (before first render)
const _urlPresetData = readPresetFromUrl()
const _urlPreset = _urlPresetData?.settings ?? null
const _urlPresetName = _urlPresetData?.name ?? ''
const _urlLoopData = _urlPresetData?.loopData ?? null
// Capture the full preset URL before the hash is cleared on mount
const _urlPresetHref = _urlPreset ? window.location.href : null

function App({ onToggleMode, initialSynthState, onSynthStateChange }) {
  const getEngine = useAudioEngine()
  const { address: walletAddress, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  // Don't auto-reconnect on load — that triggers a modal prompt.
  // Instead show subtle reconnect/forget options in the header (see WalletButton).

  // Track connection state — set flag on connect
  useEffect(() => {
    if (isConnected) {
      localStorage.setItem(WALLET_FLAG_KEY, '1')
      setWalletFlagSet(true)
    }
  }, [isConnected])

  const [walletFlagSet, setWalletFlagSet] = useState(!!localStorage.getItem(WALLET_FLAG_KEY))

  const handleForgetWallet = useCallback(() => {
    // Disconnect via wagmi so connectors (Coinbase Smart Wallet etc.) clean up their own sessions
    disconnect()
    // Clear our flag and all wagmi/RainbowKit persisted state
    localStorage.removeItem(WALLET_FLAG_KEY)
    Object.keys(localStorage)
      .filter(k => k.startsWith('wagmi') || k.startsWith('rk-') || k.startsWith('-walletlink'))
      .forEach(k => localStorage.removeItem(k))
    setWalletFlagSet(false)
  }, [disconnect])

  const [mode, setMode] = useState(_urlPreset?.mode ?? initialSynthState?.mode ?? 'play')
  const [inputMode, setInputMode] = useState('touch')
  const [oscParams, setOscParams] = useState(_urlPreset?.oscParams ?? initialSynthState?.oscParams ?? [
    { waveform: 'sawtooth', detune: 0, mix: 1.0 },
    { waveform: 'sawtooth', detune: 0, mix: 0.0 },
    { waveform: 'sawtooth', detune: 0, mix: 0.0 },
  ])
  const [volume, setVolume] = useState(_urlPreset?.volume ?? initialSynthState?.volume ?? 0.5)
  const [octaves, setOctaves] = useState(_urlPreset?.octaves ?? initialSynthState?.octaves ?? 2)
  const [delayParams, setDelayParams] = useState(_urlPreset?.delayParams ?? initialSynthState?.delayParams ?? { time: 0.3, feedback: 0.4, mix: 0 })
  const [reverbMix, setReverbMix] = useState(_urlPreset?.reverbMix ?? initialSynthState?.reverbMix ?? 0)
  const [crunch, setCrunch] = useState(_urlPreset?.crunch ?? initialSynthState?.crunch ?? 0)
  const [filterParams, setFilterParams] = useState(_urlPreset?.filterParams ?? initialSynthState?.filterParams ?? { cutoff: 20000, resonance: 0 })
  const [vcfCutoff, setVcfCutoff] = useState(_urlPreset?.vcfCutoff ?? initialSynthState?.vcfCutoff ?? 2000)
  const [vcfResonance, setVcfResonance] = useState(_urlPreset?.vcfResonance ?? initialSynthState?.vcfResonance ?? 8)
  const [vcfRouting, setVcfRouting] = useState(_urlPreset?.vcfRouting ?? initialSynthState?.vcfRouting ?? [true, true, true])
  const [glideSpeed, setGlideSpeed] = useState(_urlPreset?.glideSpeed ?? initialSynthState?.glideSpeed ?? 0.005)
  const [stepped, setStepped] = useState(_urlPreset?.stepped ?? initialSynthState?.stepped ?? false)
  const [scale, setScale] = useState(_urlPreset?.scale ?? initialSynthState?.scale ?? ['chromatic'])
  const [keyboardPositions, setKeyboardPositions] = useState(new Map())
  const [visualMode, setVisualMode] = useState(_urlPreset?.visualMode ?? 'party')
  const [arpBpm, setArpBpm] = useState(_urlPreset?.arpBpm ?? initialSynthState?.arpBpm ?? 120)
  const [hold, setHold] = useState(_urlPreset?.hold ?? initialSynthState?.hold ?? false)
  const [poly, setPoly] = useState(_urlPreset?.poly ?? initialSynthState?.poly ?? false)
  const [arpNotes, setArpNotes] = useState(_urlPreset?.arpNotes ?? initialSynthState?.arpNotes ?? [])
  const [shaking, setShaking] = useState(false)
  const [undulating, setUndulating] = useState(false)
  const [easterEgg, setEasterEgg] = useState(false)
  const [qrSettings, setQrSettings] = useState(null)
  const [wizardActive, setWizardActive] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  // v2 macro knobs: Space (reverb+delay) and Tone (crunch+vcf)
  const [space, setSpace] = useState(0.5)
  const [tone, setTone] = useState(0.5)
  const [shakeOrigin, setShakeOrigin] = useState(null)

  // iOS silent mode hint — show once on iOS if not yet dismissed
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
  const [presetSplashDone, setPresetSplashDone] = useState(!_urlPreset)
  const ribbonInteraction = useRef({ position: null, velocity: 0, active: false })
  const controlsRef = useRef(null)
  const ribbonRef = useRef(null)
  const appRef = useRef(null)
  // Color state for puddle shader — opdShift drives the iridescent spectrum hue
  const colorStateRef = useRef({ opdShift: 0 })
  // Mouse position relative to puddle (normalized 0–1), updated on mousemove
  const mousePosRef = useRef({ x: 0.5, y: 0.5 })
  // Normal play zone — center column between side panels (fraction of viewport width)
  const normalZoneRef = useRef({ xMin: 0, xMax: 1 })
  const gridBgRef = useRef(null)
  const gridFloorRef = useRef(null)
  const gridOffsetRef = useRef({ x: 0, y: 0 }) // current lerped offset

  // Marble hold system
  const {
    marbles: _marbles,
    nextSlotId: marbleNextSlotId,
    trayMarble,
    draggingMarble,
    puddleMarbles,
    spawnMarble,
    handlePickUp: handleMarblePickUp,
    dropAtPosition: dropMarbleAtPosition,
    removeFromPuddle: removeMarbleFromPuddle,
    applyImpulse: applyMarbleImpulse,
    clearAllMarbles,
    restoreMarbles,
  } = useMarbles(ribbonRef)

  // Always-current ref so hold effect reads live marble positions
  const puddleMarblesRef = useRef(puddleMarbles)
  puddleMarblesRef.current = puddleMarbles

  // Marble depressions ref for shader (updated whenever puddleMarbles changes)
  const marbleDepressionsRef = useRef([])
  marbleDepressionsRef.current = puddleMarbles.map(m => ({
    x: m.x,
    y: m.y,
    radius: m.size / 400,
  }))

  // Auto-spawn: ensure a marble is always ready in the tray
  // Fires whenever trayMarble becomes null (picked up or none yet spawned)
  useEffect(() => {
    if (!trayMarble && marbleNextSlotId !== -1) {
      spawnMarble()
    }
  }, [trayMarble, marbleNextSlotId, spawnMarble])
  const shakeTimerRef = useRef(null)
  const undulateTimerRef = useRef(null)
  const easterEggTimerRef = useRef(null)
  const shakeCountRef = useRef(0)
  const shakeWindowTimerRef = useRef(null)
  const arpStopRef = useRef(null)
  const handleShakeRef = useRef(null)
  const lastSpaceRef = useRef(0)

  // Refs for handleShake — avoids recreating callback on every state change
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
  const holdRef2 = useRef(hold)
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
  holdRef2.current = hold
  const vcfCutoffRef = useRef(vcfCutoff)
  const vcfResonanceRef = useRef(vcfResonance)
  vcfCutoffRef.current = vcfCutoff
  vcfResonanceRef.current = vcfResonance
  const spaceRef = useRef(space)
  const toneRef = useRef(tone)
  const volumeRef = useRef(volume)
  spaceRef.current = space
  toneRef.current = tone
  volumeRef.current = volume
  // Live CSS filter state — mutated by rAF loop, never triggers re-renders
  const liveFilterRef = useRef({ hue: 90, sat: 1.5, bright: 1.08, cont: 1.0, lastActive: 0 })

  // Update shader color tint whenever oscillator params change
  const WAVEFORM_OPD = { sine: 0.22, triangle: 0.0, sawtooth: -0.18, square: -0.3 }
  useEffect(() => {
    const dominant = oscParams.reduce((best, osc) => osc.mix > best.mix ? osc : best, oscParams[0])
    colorStateRef.current.opdShift = WAVEFORM_OPD[dominant.waveform] ?? 0
  }, [oscParams])

  // Apply default VCF routing on first mount (all 3 on by default in v2)
  useEffect(() => {
    const engine = getEngine()
    vcfRouting.forEach((enabled, i) => engine.setVcfRouting(i, enabled))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Live CSS filter — hue tracks last played frequency; sat/bright/contrast track x/y/velocity + knobs
  useEffect(() => {
    const el = appRef.current
    if (!el) return
    const fs = liveFilterRef.current
    let rafId
    let frame = 0

    const tick = () => {
      frame++
      // Mobile: skip every other frame for perf
      if (window.innerWidth < 768 && frame % 2 !== 0) {
        rafId = requestAnimationFrame(tick)
        return
      }

      const interact = ribbonInteraction.current
      const isActive = interact.active
      const now = performance.now()
      if (isActive) fs.lastActive = now
      const msSince = now - fs.lastActive
      const recentlyActive = msSince < 3000

      const sp  = spaceRef.current   // 0-1 (space macro)
      const tn  = toneRef.current    // 0-1 (tone macro)
      const vol = volumeRef.current  // 0-1

      // Cutoff → brightness influence (log-scale 20Hz-20kHz → 0-1)
      const rawCutoff = filterParamsRef.current?.cutoff ?? 20000
      const cutoffNorm = Math.min(1, Math.log(Math.max(20, rawCutoff) / 20) / Math.log(1000))

      let targetHue, targetSat, targetBright, targetCont

      if (isActive) {
        const pos = interact.position ?? 0.5
        const vel = interact.velocity ?? 0.5
        // X position (pitch) drives hue across ±50deg around base
        targetHue   = 90 + (pos - 0.5) * 100
        // Velocity / y drives saturation (hit harder → more vivid)
        targetSat   = 1.4 + vel * 0.8
        targetBright = 1.05 + vel * 0.12 + cutoffNorm * 0.06
        targetCont  = 1.0 + tn * 0.2
      } else if (recentlyActive) {
        const pos = interact.position ?? 0.5
        targetHue   = 90 + (pos - 0.5) * 60 + sp * 20 - 10
        targetSat   = 1.35 + tn * 0.35 + sp * 0.15
        targetBright = 0.97 + vol * 0.2 + cutoffNorm * 0.08
        targetCont  = 1.0 + tn * 0.12
      } else {
        // Idle drift — slow sine gives life when nothing is playing
        const phase = (now / 5000) * Math.PI * 2
        targetHue   = 90 + sp * 25 - 12 + Math.sin(phase) * 12
        targetSat   = 1.3 + tn * 0.3 + sp * 0.12
        targetBright = 0.95 + vol * 0.2 + cutoffNorm * 0.08
        targetCont  = 1.0 + tn * 0.07
      }

      const speed = isActive ? 0.07 : recentlyActive ? 0.03 : 0.015
      fs.hue    += (targetHue   - fs.hue)   * speed
      fs.sat    += (targetSat   - fs.sat)   * speed
      fs.bright += (targetBright - fs.bright) * speed
      fs.cont   += (targetCont  - fs.cont)  * speed

      el.style.filter = `hue-rotate(${fs.hue.toFixed(1)}deg) saturate(${fs.sat.toFixed(3)}) brightness(${fs.bright.toFixed(3)}) contrast(${fs.cont.toFixed(3)})`

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply URL preset to audio engine on first mount
  useEffect(() => {
    if (!_urlPreset) return
    const engine = getEngine()
    _urlPreset.oscParams.forEach((p, i) => {
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
    // Restore VCF settings if present
    if (_urlPreset.vcfCutoff != null) {
      engine.setVcfCutoff(_urlPreset.vcfCutoff)
      engine.setVcfResonance(_urlPreset.vcfResonance)
      if (_urlPreset.vcfRouting) {
        _urlPreset.vcfRouting.forEach((enabled, i) => engine.setVcfRouting(i, enabled))
      }
    }
    // Clear hash after loading so it doesn't persist on refresh with different settings
    if (window.location.hash) history.replaceState(null, '', window.location.pathname)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Looper ---
  const replayCallbacksRef = useRef({})
  const {
    recording, playing, hasLoop,
    recordEvent, toggleRecording, togglePlayback,
    getLoopData, loadLoopData,
  } = useLooper(replayCallbacksRef)

  const keyHandlers = useMemo(() => ({
    Space: () => {
      const now = Date.now()
      const elapsed = now - lastSpaceRef.current
      lastSpaceRef.current = now

      if (elapsed < 400) {
        // Double-tap: kill ALL sound including delay/reverb tails, remove all marbles
        getEngine().killAllSound()
        clearAllMarbles()
      } else {
        // Single tap: normal stop
        getEngine().allNotesOff()
      }
      setHold(false)
      setKeyboardPositions(new Map())
      setArpNotes([])
      arpStopRef.current?.()
    },
    Digit1: () => setMode('play'),
    Digit2: () => setMode('arp'),
    Digit3: () => setPoly(p => !p),
    Digit4: () => setHold((h) => !h),
    KeyV: () => setVisualMode((m) => m === 'party' ? 'lo' : 'party'),
    Enter: () => handleShakeRef.current?.(0.5),
    KeyM: () => {
      const { x, y } = mousePosRef.current
      dropMarbleAtPosition(x, y)
    },
    KeyP: () => {
      captureScreenshot({
        mode, oscParams, volume, octaves, delayParams, reverbMix, crunch,
        filterParams, vcfCutoff, vcfResonance, vcfRouting, glideSpeed,
        stepped, scale, poly, hold, arpBpm, visualMode, arpNotes,
      })
    },
  }), [mode, hold, oscParams, volume, octaves, delayParams, reverbMix, crunch,
       filterParams, vcfCutoff, vcfResonance, vcfRouting, glideSpeed, stepped,
       scale, poly, arpBpm, visualMode, arpNotes, getEngine, clearAllMarbles, dropMarbleAtPosition])

  useKeyboard(keyHandlers)

  const handleKeyboardPositions = useCallback((posMap) => {
    setKeyboardPositions(posMap)
  }, [])

  const { arpStart, arpStop } = useArpeggiator(getEngine, mode, arpBpm, arpNotes, hold)
  arpStopRef.current = arpStop

  // Called when user clicks Play on the preset splash screen
  const handlePresetEnter = useCallback(() => {
    getEngine() // resume AudioContext via user gesture
    if (_urlLoopData) loadLoopData(_urlLoopData)
    // Restore marble positions from preset
    if (_urlPreset?.marbles?.length > 0) {
      restoreMarbles(_urlPreset.marbles)
    }
    if (_urlPreset?.mode === 'arp' && _urlPreset?.hold && _urlPreset?.arpNotes?.length > 0) {
      setTimeout(() => arpStart(), 100)
    }
    setPresetSplashDone(true)
  }, [getEngine, arpStart, loadLoopData]) // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle a note in/out of the arp sequence (arp+hold+poly mode)
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

  // Add/remove notes for live arp+poly (keys held down)
  const handleArpNoteAdd = useCallback((hz) => {
    setArpNotes(prev => {
      if (prev.some(n => Math.abs(n - hz) < 1)) return prev
      return [...prev, hz]
    })
  }, [])

  const handleArpNoteRemove = useCallback((hz) => {
    setArpNotes(prev => prev.filter(n => Math.abs(n - hz) >= 1))
  }, [])

  // Auto-start/stop arp when notes are added/removed in arp+poly mode
  const prevArpNotesLenRef = useRef(0)
  useEffect(() => {
    if (mode === 'arp' && poly) {
      const prevLen = prevArpNotesLenRef.current
      if (prevLen === 0 && arpNotes.length > 0) {
        arpStart()
      } else if (prevLen > 0 && arpNotes.length === 0) {
        arpStop()
      }
    }
    prevArpNotesLenRef.current = arpNotes.length
  }, [arpNotes, mode, poly, arpStart, arpStop])

  // Clear arp notes when leaving arp+poly mode
  useEffect(() => {
    if (!(mode === 'arp' && poly)) {
      setArpNotes([])
    }
  }, [mode, poly])

  useKeyboardPlay(getEngine, inputMode, mode, octaves, stepped, scale, handleKeyboardPositions, arpStart, arpStop, hold, poly, handleArpNoteToggle, handleArpNoteAdd, handleArpNoteRemove)


  // Wire replay callbacks (called during loop playback)
  useEffect(() => {
    replayCallbacksRef.current = {
      voice_on: ({ hz, velocity }) => {
        const id = `loop_${Date.now()}`
        getEngine().voiceOn(id, hz, velocity)
        setTimeout(() => getEngine().voiceOff(id), 200)
      },
      knob: ({ param, value }) => {
        const engine = getEngine()
        const setters = {
          cutoff: (v) => { setFilterParams(p => ({ ...p, cutoff: v })); engine.setFilter({ cutoff: v }) },
          resonance: (v) => { setFilterParams(p => ({ ...p, resonance: v })); engine.setFilter({ resonance: v }) },
          reverb: (v) => { setReverbMix(v); engine.setReverb({ mix: v }) },
          crunch: (v) => { setCrunch(v); engine.setCrunch(v) },
          glide: (v) => { setGlideSpeed(v); engine.setGlideSpeed(v) },
        }
        if (setters[param]) setters[param](value)
      },
      // shake events are intentionally excluded from replay — they randomize controls
      // non-deterministically and would corrupt the preset state on loop playback
    }
  })

  // --- Goop/Liquid ---
  const {
    goopLevels, puddleActivity, shakeClean, getGoopData, loadGoopData,
    startDragging, stopDragging, registerControl, updatePuddleActivity,
  } = useGoop()

  // When a drag escapes the puddle, signal the goop system
  const handleDragEscape = useCallback((pointerId) => {
    startDragging(pointerId)
  }, [startDragging])

  // Puddle activity broadcast (for gooped control reactions)
  const handlePuddleActivity = useCallback((intensity) => {
    updatePuddleActivity(intensity)
  }, [updatePuddleActivity])

  // --- Milestone tracking ---
  const { current: currentMilestone, show: showMilestone, dismiss: dismissMilestone } = useMilestoneToast()

  // First sound milestone — triggers on first puddle touch
  const handleNoteOn = useCallback(() => {
    const m = checkMilestone('first_sound')
    if (m) showMilestone(m)
  }, [showMilestone])

  // Loop creator milestone — triggers when first loop is recorded
  const prevHasLoopRef = useRef(hasLoop)
  useEffect(() => {
    if (hasLoop && !prevHasLoopRef.current) {
      const m = checkMilestone('loop_creator')
      if (m) showMilestone(m)
    }
    prevHasLoopRef.current = hasLoop
  }, [hasLoop, showMilestone])

  // Goop artist milestone — 5+ controls gooped
  const prevGoopCountRef = useRef(0)
  useEffect(() => {
    const count = Object.keys(goopLevels).length
    if (count >= 5 && prevGoopCountRef.current < 5) {
      const m = checkMilestone('goop_artist')
      if (m) showMilestone(m)
    }
    prevGoopCountRef.current = count
  }, [goopLevels, showMilestone])

  // SPACE: 0=cathedral (reverb+delay wash), 0.5=dry, 1=orbit (rhythmic delay)
  const handleSpace = useCallback((v) => {
    setSpace(v)
    const engine = getEngine()
    if (v <= 0.5) {
      const t = (0.5 - v) * 2
      setReverbMix(t * 0.78)
      engine.setReverb({ mix: t * 0.78 })
      const newDelay = { time: 0.25 + t * 0.15, feedback: 0.2 + t * 0.3, mix: t * 0.35 }
      setDelayParams(newDelay)
      engine.setDelay(newDelay)
    } else {
      const t = (v - 0.5) * 2
      setReverbMix(t * 0.15)
      engine.setReverb({ mix: t * 0.15 })
      const newDelay = { time: 0.28 + t * 0.22, feedback: 0.3 + t * 0.42, mix: t * 0.7 }
      setDelayParams(newDelay)
      engine.setDelay(newDelay)
    }
  }, [getEngine, setReverbMix, setDelayParams])

  // TONE: 0=grit (warm crunch + low filter), 0.5=clean, 1=glitter (sparkle resonance)
  const handleTone = useCallback((v) => {
    setTone(v)
    const engine = getEngine()
    if (v <= 0.5) {
      const t = (0.5 - v) * 2
      setCrunch(t * 0.82)
      engine.setCrunch(t * 0.82)
      const cutoff = 20000 - t * 19500
      setVcfCutoff(cutoff)
      engine.setVcfCutoff(cutoff)
      const res = t * 12
      setVcfResonance(res)
      engine.setVcfResonance(res)
    } else {
      const t = (v - 0.5) * 2
      setCrunch(t * 0.08)
      engine.setCrunch(t * 0.08)
      const cutoff = 20000 - t * 13000
      setVcfCutoff(cutoff)
      engine.setVcfCutoff(cutoff)
      const res = t * 16
      setVcfResonance(res)
      engine.setVcfResonance(res)
    }
  }, [getEngine, setCrunch, setVcfCutoff, setVcfResonance])

  // --- Shake/Quake handler (reads state from refs to avoid dependency churn) ---
  const handleShake = useCallback((intensity) => {
    const engine = getEngine()

    // 1. Visual shake on controls + ribbon — restart timers on rapid triggers
    setShaking(true)
    setUndulating(true)
    clearTimeout(shakeTimerRef.current)
    clearTimeout(undulateTimerRef.current)
    shakeTimerRef.current = setTimeout(() => setShaking(false), 400)
    undulateTimerRef.current = setTimeout(() => setUndulating(false), 500)

    // Easter egg — ~5% chance on shake, unlocks hidden double harmonic scale
    if (Math.random() < 0.05) {
      setEasterEgg(true)
      // Register hidden scale into SCALES so pitchMap can find it
      Object.assign(SCALES, HIDDEN_SCALES)
      setScale(['double harmonic'])
      setStepped(true)
      clearTimeout(easterEggTimerRef.current)
      easterEggTimerRef.current = setTimeout(() => setEasterEgg(false), 1800)
    }

    // Easter egg — 7 shakes within 5s unlocks octave 7
    shakeCountRef.current += 1
    clearTimeout(shakeWindowTimerRef.current)
    shakeWindowTimerRef.current = setTimeout(() => { shakeCountRef.current = 0 }, 5000)
    if (shakeCountRef.current === 7) {
      shakeCountRef.current = 0
      setOctaves(7)
    }

    // 2. Randomize parameters — chance scales with intensity (20%-50%)
    const nudgeChance = 0.15 + intensity * 0.35
    const shouldNudge = () => Math.random() < nudgeChance

    // Oscillator params
    setOscParams(prev => prev.map((osc, i) => {
      const next = { ...osc }
      if (shouldNudge()) next.waveform = WAVEFORMS[Math.floor(Math.random() * WAVEFORMS.length)]
      if (shouldNudge()) next.mix = nudge(osc.mix, 0, 1, intensity)
      if (shouldNudge()) next.detune = Math.round(nudge(osc.detune, -1200, 1200, intensity))
      if (next.waveform !== osc.waveform) engine.setWaveform(next.waveform, i)
      if (next.mix !== osc.mix) engine.setOscMix(i, next.mix)
      if (next.detune !== osc.detune) engine.setOscDetune(i, next.detune)
      return next
    }))

    if (shouldNudge()) {
      const newCutoff = nudge(filterParamsRef.current.cutoff, 20, 20000, intensity)
      setFilterParams(prev => ({ ...prev, cutoff: newCutoff }))
      engine.setFilter({ cutoff: newCutoff })
    }

    if (shouldNudge()) {
      const newRes = nudge(filterParamsRef.current.resonance, 0, 25, intensity)
      setFilterParams(prev => ({ ...prev, resonance: newRes }))
      engine.setFilter({ resonance: newRes })
    }

    if (shouldNudge()) {
      const newSpeed = nudge(glideSpeedRef.current, 0.001, 0.3, intensity)
      setGlideSpeed(newSpeed)
      engine.setGlideSpeed(newSpeed)
    }

    // Space + Tone macro randomization (drives reverb/delay/crunch/vcf)
    if (shouldNudge()) {
      handleSpace(Math.random())
    }
    if (shouldNudge()) {
      handleTone(Math.random())
    }

    // VCF — slightly higher frequency per design intent
    const vcfChance = nudgeChance * 1.5
    if (Math.random() < vcfChance) {
      const newVcfCutoff = nudge(vcfCutoffRef.current, 100, 20000, intensity)
      setVcfCutoff(newVcfCutoff)
      engine.setVcfCutoff(newVcfCutoff)
    }
    if (Math.random() < vcfChance) {
      const newVcfRes = nudge(vcfResonanceRef.current, 0, 20, intensity)
      setVcfResonance(newVcfRes)
      engine.setVcfResonance(newVcfRes)
    }

    if (shouldNudge()) {
      const newBpm = Math.round(nudge(arpBpmRef.current, 40, 300, intensity))
      setArpBpm(newBpm)
    }

    if (shouldNudge()) {
      const newOctaves = Math.floor(Math.random() * 5) + 1
      setOctaves(newOctaves)
    }

    if (shouldNudge()) {
      const scaleNames = Object.keys(SCALES)
      const randomScale = scaleNames[Math.floor(Math.random() * scaleNames.length)]
      setScale([randomScale])
    }

    // Switches — lower chance, bigger impact
    const switchChance = 0.08 + intensity * 0.15
    if (Math.random() < switchChance) {
      setMode(m => m === 'play' ? 'arp' : 'play')
    }
    if (Math.random() < switchChance) {
      setPoly(p => !p)
    }
    if (Math.random() < switchChance * 0.6) {
      setHold(h => !h)
    }

    // 3. Clean goop from controls
    shakeClean()

    // 3b. Milestone: shake counter
    const shakeMilestone = incrementMilestone('shake_master', 100)
    if (shakeMilestone) showMilestone(shakeMilestone)

    // 4. Trigger a ribbon press — visual + note origin follows what's currently playing
    // Priority: active touch > marble positions > last known position > random
    let shakePosition
    const interact = ribbonInteraction.current
    if (interact?.active && interact.position != null) {
      shakePosition = interact.position
    } else if (puddleMarblesRef.current.length > 0) {
      const marbs = puddleMarblesRef.current
      shakePosition = marbs.reduce((sum, m) => sum + m.x, 0) / marbs.length
    } else if (interact?.position != null) {
      shakePosition = interact.position
    } else {
      shakePosition = Math.random()
    }

    const shakeVelocity = Math.random() * 0.3 + intensity * 0.5
    const shakeHz = positionToFrequency(shakePosition, { octaves: octavesRef.current, stepped: steppedRef.current, scale: scaleRef.current })

    // Trigger visual splash at the playing position
    setShakeOrigin({ x: shakePosition, y: shakeVelocity, ts: Date.now() })

    // Update ribbon interaction ref for visualizer
    if (ribbonInteraction.current) {
      ribbonInteraction.current.position = shakePosition
      ribbonInteraction.current.velocity = shakeVelocity
      ribbonInteraction.current.active = true
    }

    // In arp+poly+hold mode, add note to arp sequence instead of one-shot
    if (modeRef.current === 'arp' && polyRef.current && holdRef2.current) {
      handleArpNoteToggle(shakeHz)
      setTimeout(() => {
        if (ribbonInteraction.current) ribbonInteraction.current.active = false
      }, 200)
    } else {
      const shakeVoiceId = `shake_${Date.now()}`
      engine.voiceOn(shakeVoiceId, shakeHz, shakeVelocity)

      const noteDuration = 150 + (1 - intensity) * 250
      setTimeout(() => {
        engine.voiceOff(shakeVoiceId)
        if (ribbonInteraction.current) {
          ribbonInteraction.current.active = false
        }
      }, noteDuration)
    }
  }, [getEngine, handleArpNoteToggle, shakeClean, showMilestone, handleSpace, handleTone, setShakeOrigin])

  handleShakeRef.current = handleShake
  useShake(handleShake, controlsRef, ribbonRef)

  // Track mouse position relative to puddle for marble drop key command
  useEffect(() => {
    function onMouseMove(e) {
      if (!ribbonRef.current) return
      const rect = ribbonRef.current.getBoundingClientRect()
      mousePosRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1 - (e.clientY - rect.top) / rect.height,
      }
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  // Measure normal play zone — center column between side control panels
  useEffect(() => {
    const measure = () => {
      if (window.innerWidth < 768) {
        normalZoneRef.current = { xMin: 0, xMax: 1 }
        return
      }
      const bar = document.querySelector('.controls__bar')
      if (bar) {
        const vw = window.innerWidth
        const rect = bar.getBoundingClientRect()
        normalZoneRef.current = {
          xMin: 0,
          xMax: 1,
        }
      }
    }
    // Measure after layout settles
    const t = setTimeout(measure, 200)
    window.addEventListener('resize', measure)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
  }, [])

  // Wild touch handler — fires when user touches outside normal play zone.
  // Triggers extreme parameter shifts + note burst for an "out of this world" effect.
  const handleWildTouch = useCallback((x, y) => {
    const engine = getEngine()

    // Visual feedback — brief undulate pulse
    setUndulating(true)
    clearTimeout(undulateTimerRef.current)
    undulateTimerRef.current = setTimeout(() => setUndulating(false), 700)

    // Extreme Space + Tone macro shift
    handleSpace(Math.random())
    handleTone(Math.random())

    // Rip ALL 3 oscs — extreme detune (4800 ct range) + random waveforms
    setOscParams(prev => {
      const next = prev.map((osc, i) => {
        const wf = WAVEFORMS[Math.floor(Math.random() * WAVEFORMS.length)]
        const det = Math.round((Math.random() - 0.5) * 4800)
        engine.setWaveform(wf, i)
        engine.setOscDetune(i, det)
        return { ...osc, waveform: wf, detune: det }
      })
      return next
    })

    // Extreme VCF — high resonance, swept cutoff
    const wildCutoff = 200 + Math.random() * 18000
    const wildRes = 10 + Math.random() * 10
    setVcfCutoff(wildCutoff)
    engine.setVcfCutoff(wildCutoff)
    setVcfResonance(wildRes)
    engine.setVcfResonance(wildRes)
    setVcfRouting([Math.random() > 0.3, Math.random() > 0.3, Math.random() > 0.3])

    // Glide extremes
    const wildGlide = 0.05 + Math.random() * 0.25
    setGlideSpeed(wildGlide)
    engine.setGlideSpeed(wildGlide)

    // Burst of 3–5 staggered wild notes
    const burstCount = 3 + Math.floor(Math.random() * 3)
    for (let i = 0; i < burstCount; i++) {
      const delay = i * (40 + Math.random() * 70)
      setTimeout(() => {
        const hz = positionToFrequency(Math.random(), { octaves, stepped, scale })
        const id = `wild_${Date.now()}_${i}`
        const vel = 0.5 + Math.random() * 0.5
        engine.voiceOn(id, hz, vel)
        setTimeout(() => engine.voiceOff(id), 120 + Math.random() * 500)
      }, delay)
    }
  }, [getEngine, handleSpace, handleTone, octaves, stepped, scale, setGlideSpeed])

  // Grid floor parallax — shifts background-position with puddle touch (perspective floor)
  useEffect(() => {
    let rafId
    const MAX_SHIFT_X = 60 // px — horizontal pan
    const MAX_SHIFT_Y = 40 // px — depth scroll
    const LERP = 0.06      // easing factor per frame

    function tick() {
      rafId = requestAnimationFrame(tick)
      if (document.hidden) return
      const floor = gridFloorRef.current
      if (!floor) return
      const interact = ribbonInteraction.current
      const tx = interact.active && interact.position !== null
        ? (interact.position - 0.5) * MAX_SHIFT_X
        : 0
      const ty = interact.active && interact.velocity !== undefined
        ? (0.5 - interact.velocity) * MAX_SHIFT_Y
        : 0
      const o = gridOffsetRef.current
      o.x += (tx - o.x) * LERP
      o.y += (ty - o.y) * LERP
      // Move background-position so the perspective grid scrolls with touch
      floor.style.backgroundPosition = `${o.x.toFixed(2)}px ${o.y.toFixed(2)}px, ${o.x.toFixed(2)}px ${o.y.toFixed(2)}px`
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const { midiDevice, connectMIDI } = useMIDI(getEngine, {
    setVolume, setFilterParams, setGlideSpeed, setDelayParams,
    setReverbMix, setCrunch, setOscParams, setArpBpm, setHold,
    mode, poly, hold, octaves, stepped, scale,
    handleArpNoteToggle, handleArpNoteAdd, handleArpNoteRemove,
    arpStart, arpStop,
  })

  // Hold in play mode: note sustains at its original pitch until space or hold toggled off
  // No global mouse tracking — "wild mode" (global pitch follow) removed for now

  // When hold toggles: stop notes/arp as needed, but DO NOT clear marbles
  // (marbles stay on puddle; Stop button clears them)
  // When hold turns ON: restart any existing puddle marble voices
  const holdRef = useRef(hold)
  useEffect(() => {
    const wasHold = holdRef.current
    holdRef.current = hold
    const engine = getEngine()

    if (wasHold && !hold) {
      // Hold turned OFF — stop regular notes + arp
      if (mode === 'play') {
        if (engine.getIsPlaying()) engine.allNotesOff()
      } else if (mode === 'arp') {
        setArpNotes([])
        arpStopRef.current?.()
        engine.allNotesOff()
      }
      // Stop marble voices (marbles stay on puddle)
      for (const marble of puddleMarbles) {
        engine.voiceOff(`marble_${marble.id}`)
      }
    } else if (!wasHold && hold) {
      // Hold turned ON — restart voices for any marbles already on the puddle
      const currentMarbles = puddleMarblesRef.current
      if (mode !== 'arp') {
        for (const marble of currentMarbles) {
          const hz = positionToFrequency(marble.x, { octaves, stepped, scale })
          engine.voiceOn(`marble_${marble.id}`, hz, marble.velocity)
        }
      } else {
        // arp mode (poly or mono): re-inject marble freqs so arpNotes effect restarts the arp
        const marbleHzList = currentMarbles.map(m =>
          positionToFrequency(m.x, { octaves, stepped, scale })
        )
        if (marbleHzList.length > 0) {
          if (poly) {
            setArpNotes(prev => {
              const fingerNotes = prev.filter(hz => !marbleHzList.some(mhz => Math.abs(mhz - hz) < 1))
              return [...fingerNotes, ...marbleHzList]
            })
          } else {
            setArpNotes(marbleHzList)
          }
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hold, mode, poly]) // puddleMarbles intentionally omitted — accessed via closure snapshot

  // Marble audio: start/stop voices when marbles land on or leave the puddle
  // In arp+hold+poly mode: inject into arpNotes. In play mode: continuous voice.
  // If hold is off: play a one-shot tap instead of sustained voice.
  const prevPuddleMarbleIdsRef = useRef(new Set())
  useEffect(() => {
    const engine = getEngine()
    const currentIds = new Set(puddleMarbles.map(m => m.id))
    const prevIds = prevPuddleMarbleIdsRef.current

    // Marbles removed from puddle — stop voices / remove from arp
    for (const id of prevIds) {
      if (!currentIds.has(id)) {
        if (mode !== 'arp') {
          engine.voiceOff(`marble_${id}`)
        }
        // In arp mode, arp notes are rebuilt from scratch below
      }
    }

    // Marbles added to puddle — start voices
    for (const marble of puddleMarbles) {
      if (!prevIds.has(marble.id)) {
        if (mode !== 'arp') {
          const hz = positionToFrequency(marble.x, { octaves, stepped, scale })
          if (hold) {
            // Hold active: sustain voice continuously
            engine.voiceOn(`marble_${marble.id}`, hz, marble.velocity)
          } else {
            // Hold off: one-shot tap, then stop
            engine.voiceOn(`marble_${marble.id}`, hz, marble.velocity)
            setTimeout(() => engine.voiceOff(`marble_${marble.id}`), 400)
          }
        }
      }
    }

    // In arp mode: sync marble freqs into arpNotes (by droppedAt order)
    if (mode === 'arp' && hold) {
      const marbleHzList = puddleMarbles.map(m =>
        positionToFrequency(m.x, { octaves, stepped, scale })
      )
      if (poly) {
        setArpNotes(prev => {
          // Keep finger-added notes (not from marbles), append marble notes
          const fingerNotes = prev.filter(hz => !marbleHzList.some(mhz => Math.abs(mhz - hz) < 1))
          return [...fingerNotes, ...marbleHzList]
        })
      } else {
        setArpNotes(marbleHzList)
      }
    }

    prevPuddleMarbleIdsRef.current = currentIds
  }, [puddleMarbles, mode, hold, poly, getEngine, octaves, stepped, scale])

  // Update live marble voice frequencies when marbles roll (physics)
  useEffect(() => {
    if (mode === 'arp') return // arp handles its own freq cycling
    const engine = getEngine()
    for (const marble of puddleMarbles) {
      const hz = positionToFrequency(marble.x, { octaves, stepped, scale })
      engine.voiceSetFrequency(`marble_${marble.id}`, hz)
      engine.voiceSetVelocity(`marble_${marble.id}`, marble.velocity)
    }
  }, [puddleMarbles, mode, getEngine, octaves, stepped, scale])

  // Handle marble pick-up from the tray slot in ActivationMode
  // Auto-activates hold if not already on (item 388)
  const handleMarblePickUpOrSpawn = useCallback((id, clientX, clientY, sizeMultiplier = 1) => {
    if (id === -1) return // spawn is now automatic; ignore stale calls
    // Auto-activate hold on first marble grab
    setHold(h => { if (!h) return true; return h })
    handleMarblePickUp(id, clientX, clientY, sizeMultiplier)
  }, [handleMarblePickUp])

  // Handle marble pick-up from the puddle (drag to reposition)
  const handleMarblePuddlePickUp = useCallback((id, clientX, clientY) => {
    handleMarblePickUp(id, clientX, clientY)
  }, [handleMarblePickUp])

  const handleStop = useCallback(() => {
    getEngine().allNotesOff()
    setHold(false)
    setKeyboardPositions(new Map())
    setArpNotes([])
    arpStopRef.current?.()
    clearAllMarbles()
  }, [getEngine, clearAllMarbles])

  const handleVcfRoutingToggle = useCallback((oscIndex, enabled) => {
    setVcfRouting(prev => {
      const next = [...prev]
      next[oscIndex] = enabled
      // VCF explorer milestone — all 3 oscillators routed through VCF
      if (next.every(Boolean)) {
        const m = checkMilestone('vcf_explorer')
        if (m) showMilestone(m)
      }
      return next
    })
  }, [showMilestone])

  const handleQRCreate = useCallback(() => {
    setQrSettings({
      mode, oscParams, volume, octaves, delayParams, reverbMix, crunch,
      filterParams, vcfCutoff, vcfResonance, vcfRouting, glideSpeed, stepped, scale, poly, hold, arpBpm, visualMode,
      arpNotes,
      loopData: getLoopData(),
      walletAddress,
      marbles: puddleMarbles.map(m => ({ id: m.id, x: m.x, y: m.y })),
      puddleActivity,
    })
    // Milestone: shared preset
    const m = checkMilestone('shared_preset')
    if (m) showMilestone(m)
  }, [mode, oscParams, volume, octaves, delayParams, reverbMix, crunch, filterParams, vcfCutoff, vcfResonance, vcfRouting, glideSpeed, stepped, scale, poly, hold, arpBpm, visualMode, showMilestone, getLoopData, walletAddress, puddleMarbles, puddleActivity])

  const handleKillAll = useCallback(() => {
    getEngine().killAllSound()
    setHold(false)
    setKeyboardPositions(new Map())
    setArpNotes([])
    arpStopRef.current?.()
    clearAllMarbles()
  }, [getEngine, clearAllMarbles])

  // Keep AppShell's synth snapshot current so mode switches preserve settings
  useEffect(() => {
    onSynthStateChange?.({
      mode, poly, hold, oscParams, volume, octaves, delayParams, reverbMix, crunch,
      filterParams, vcfCutoff, vcfResonance, vcfRouting, glideSpeed, stepped, scale, arpBpm, arpNotes,
    })
  }, [mode, poly, hold, oscParams, volume, octaves, delayParams, reverbMix, crunch,
      filterParams, vcfCutoff, vcfResonance, vcfRouting, glideSpeed, stepped, scale, arpBpm, arpNotes,
      onSynthStateChange]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={appRef} className={`app app--puddle ${visualMode === 'lo' ? 'lo-mode' : ''}`}>
      {!presetSplashDone
        ? <PresetSplash presetUrl={_urlPresetHref} onEnter={handlePresetEnter} />
        : <MobileSplash onEnter={() => getEngine()} />
      }
      {/* Dark space backdrop */}
      <div className="app__grid-bg" ref={gridBgRef} />
      {/* Perspective floor grid — parallax driven by puddle touch position */}
      <div className="app__grid-floor" ref={gridFloorRef} />

      <header className="app-header">
        {/* Left: QR + info — always visible, upper-left */}
        <div className="app-header__left">
          <div className="app-header__left-top">
            <button
              className="app-header__qr-btn"
              onClick={handleQRCreate}
              title="Create preset QR code"
              aria-label="Create preset QR code"
            >
              &#x25A3;
            </button>
            {onToggleMode && (
              <button
                className="mode-toggle mode-toggle--inline"
                onClick={onToggleMode}
                title="Switch to lo mode"
                aria-label="Toggle visual mode"
              >
                <span className="mode-toggle__option mode-toggle__option--active">party</span>
                <span className="mode-toggle__sep">·</span>
                <span className="mode-toggle__option">lo</span>
              </button>
            )}
          </div>
          <button
            className={`app-header__info-btn ${showInfo ? 'app-header__info-btn--active' : ''}`}
            onClick={() => setShowInfo(v => !v)}
            onPointerDown={e => e.stopPropagation()}
            title="About Puddle"
            aria-label="About Puddle"
          >
            ⓘ
          </button>
          {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
          <VersionSelector />
        </div>
        {/* Center: logo — always dead center via CSS grid */}
        <div className="app-header__logo" onClick={() => { requestMotionPermission(); handleShake(0.5) }} role="button" tabIndex={0} aria-label="Shake / Randomize">
          <RibbonLogo />
        </div>
        {/* Right: MIDI → POAP badge → wallet, stacked top-to-bottom */}
        <div className="app-header__right">
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
      </header>

      <div className="app__stage" style={{ position: 'relative' }}>
        {/* Goop visuals now rendered directly on control elements via GoopableSection */}
        <Puddle
          ref={ribbonRef}
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
          undulating={undulating}
          onArpNoteToggle={handleArpNoteToggle}
          arpNotes={arpNotes}
          recordEvent={recordEvent}
          onDragEscape={handleDragEscape}
          onPuddleActivity={handlePuddleActivity}
          onNoteOn={handleNoteOn}
          puddleMarbles={puddleMarbles}
          onMarbleRemove={removeMarbleFromPuddle}
          onMarblePuddlePickUp={handleMarblePuddlePickUp}
          onMarbleImpulse={applyMarbleImpulse}
          marbleDepressions={marbleDepressionsRef}
          keyboardPositions={keyboardPositions}
          normalZone={normalZoneRef}
          onWildTouch={handleWildTouch}
          colorStateRef={colorStateRef}
          shakeOrigin={shakeOrigin}
        />

        <Controls
          ref={controlsRef}
          getEngine={getEngine}
          oscParams={oscParams}
          setOscParams={setOscParams}
          volume={volume}
          setVolume={setVolume}
          octaves={octaves}
          setOctaves={setOctaves}
          stepped={stepped}
          setStepped={setStepped}
          scale={scale}
          setScale={setScale}
          delayParams={delayParams}
          setDelayParams={setDelayParams}
          reverbMix={reverbMix}
          setReverbMix={setReverbMix}
          crunch={crunch}
          setCrunch={setCrunch}
          filterParams={filterParams}
          setFilterParams={setFilterParams}
          glideSpeed={glideSpeed}
          setGlideSpeed={setGlideSpeed}
          space={space}
          onSpaceChange={handleSpace}
          tone={tone}
          onToneChange={handleTone}
          onShake={() => { requestMotionPermission(); handleShake(0.5) }}
          shaking={shaking}
          mode={mode}
          setMode={setMode}
          poly={poly}
          setPoly={setPoly}
          arpBpm={arpBpm}
          setArpBpm={setArpBpm}
          hold={hold}
          setHold={setHold}
          onStop={handleStop}
          onKillAll={handleKillAll}

          goopLevels={goopLevels}
          puddleActivity={puddleActivity}
          registerControl={registerControl}
          trayMarble={trayMarble}
          draggingMarble={draggingMarble}
          onMarblePickUp={handleMarblePickUpOrSpawn}
          nextSlotId={marbleNextSlotId}
          vcfCutoff={vcfCutoff}
          vcfResonance={vcfResonance}
          vcfRouting={vcfRouting}
          onVcfCutoffChange={setVcfCutoff}
          onVcfResonanceChange={setVcfResonance}
          onVcfRoutingToggle={handleVcfRoutingToggle}
          midiDevice={midiDevice}
        />
      </div>

      {easterEgg && (
        <div className="easter-egg" aria-hidden="true">
          <div className="easter-egg__glitch">DOUBLE HARMONIC UNLOCKED</div>
        </div>
      )}

      {qrSettings && (
        <PresetQR settings={qrSettings} initialName={_urlPresetName} onClose={() => setQrSettings(null)} onMilestone={showMilestone} />
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

export default App
