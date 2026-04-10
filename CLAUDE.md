# Puddle

A web-based iridescent oil-spill synthesizer. 2D kaos pad (the "puddle") as the primary instrument surface — X=pitch, Y=velocity. Mobile and desktop.

## Stack
- Vite + React
- Web Audio API (oscillators, effects, routing; AudioWorklet for bitcrush)
- Three.js for the oil-spill kaos pad shader
- npm as package manager

## Versioning & Deployment
- `main` → `puddle.obfusco.us` (production, latest stable)
- `nmj/*` branches → `puddle-dev.obfusco.us` (dev preview, auto-deploy)
- Version tags (`v1`, `v2`, ...) → `puddle.obfusco.us/v1`, etc. (permanent snapshots)
- CI/CD: GitHub Actions → S3 + CloudFront
- Current dev branch: `nmj/v1` → working toward v2

## Core Concepts

### Puddle Surface
- 2D kaos pad: X=pitch, Y=velocity
- Three.js custom shaders: iridescent oil-spill surface with thin-film interference
- Multi-layer thickness variation for realistic rainbow swirls even when idle
- Ripple physics: vertex displacement from touch origins in a ring buffer with exponential decay
- Asteroids-style confetti: unfilled stroke-only geometry with firework bursts
- Moving grid background with drift animation
- Desktop layout: CSS grid with controls surrounding puddle (`display:contents` on Controls wrapper)

### Rotary Knobs
- All range sliders replaced with rotary knob components (except volume fader)
- Vertical drag interaction with pointer capture (not circular)
- Ghost slider overlay: fades in during drag to hint at interaction model
- 270° rotation range, direct DOM updates for zero-lag response

### VCF Control
- Voltage-controlled filter with cutoff + resonance knobs
- Per-oscillator routing via toggle buttons (any combo of 3 oscs)
- BiquadFilter nodes inserted per-voice at creation time

### Marbles
- 9 draggable marbles (Ruby→Moonstone) that persist sound on the puddle
- Physics-based positioning, shader depressions at marble locations
- Drop order determines arp cycling sequence
- Voice-per-marble audio; double-spacebar clears all marbles

### Capture/Looper
- Event-based looper: records timestamped user events (not audio)
- Replays via setTimeout chains against audio engine API
- 33.3s max loops, layering supported (record while playing)
- Return key was looper toggle; currently wired to shake instead

### Goop/Liquid Control
- Per-control goop levels (0–1) with SVG blob overlay
- Drag from puddle onto controls increases goop
- Gooped controls react to puddle ripples
- Shake removes goop (~13 shakes to fully clean)

### Crypto Integration
- RainbowKit + wagmi + viem for wallet connection on Base L2
- POAP milestone tracking via localStorage with toast notifications
- 6 milestones: first_sound, shared_preset, shake_master, loop_creator, goop_artist, vcf_explorer
- ERC-721 `RibbonPuddle.sol` on Base — mint/own QR presets, IPFS metadata via Pinata
- Smart contract in `contracts/`, deploy script in `scripts/deploy.js`, Hardhat config in `hardhat.config.js`

### Sound Engine
- Real oscillator-based synthesis (Web Audio API)
- Effects: delay, reverb, bitcrush/digitize (AudioWorklet)
- VCF: per-oscillator voltage-controlled filter
- MIDI controller support via Web MIDI API (`src/hooks/useMIDI.js`)

### Presets & Sharing
- QR code preset system: all synth settings encoded in URL hash (`#p=...`)
- Includes VCF settings, wallet address (`&wa=`), loop data (`&l=`), marble positions
- Multi-colored gradient QR codes generated client-side with `qrcode` library
- Serialization in `src/utils/presets.js`

### Audio / Mobile Quirks
- iOS silent mode: `unlockIOSAudio()` in `AudioEngine.js` plays a silent `<audio>` element on first gesture to force AVAudioSession to "playback" category (bypasses hardware silent switch)
- Android AudioContext: gesture listener keeps re-attempting resume until `ctx.state === 'running'`
- AudioWorklet (bitcrush) requires HTTPS (secure context) — silently disabled on HTTP

## Design Principles
- Iridescent oil-spill kaos pad, glitch/datamosh aesthetic
- Controls must have **fixed dimensions** — never shift or resize based on state changes
- Animations enhance the musical experience; they don't clutter the controls
- Controls stay clean and usable; visuals live around/behind them

## Logo
- "puddle" wordmark with möbius/lemniscate strip through the `dd` loops
- SVG in `src/components/RibbonLogo.jsx`
- Path geometry: starts at crossing point (76,44), outer points have pure-vertical tangents, crossing CPs are exact reflections; bridge ellipse covers the under-strand
- No SMIL animations or SVG filter effects (breaks Safari compositor)

## Git Workflow
- Push after every commit
- Keep CLAUDE.md, DEVLOG.md, ROADMAP.md, and MEMORY.md updated before committing
- DEVLOG: reverse-chronological (newest at top)
- ROADMAP: mark completed items with `[x]`, move to Completed section
- Git auth via `gh auth` with HTTPS
