# Changelog

## v1.1 — "Lo Mode" (2026-05-21)

Builds on v1 with a second visual mode, shared audio engine lineage prep, and several UX fixes.

### New Features

- **Lo mode** — ASCII kaos pad as an alternative to the iridescent Three.js party mode; toggle via `party·lo` button in the header
- **Settings persistence across modes** — all 18 synth parameters (osc, filter, VCF, delay, reverb, crunch, arp, scale, etc.) persist when switching between party and lo
- **ASCII QR code** in lo mode — Unicode half-block char QR (green terminal aesthetic) via `QRCode.create()` matrix rendering
- **Oil-spill favicon** — iridescent oval with thin-film color bands matching the puddle aesthetic
- **iOS mute switch bypass** — `navigator.audioSession.type = 'playback'` for iOS 17+; silent `<audio>` element fallback for iOS 16 and earlier

### UX Fixes

- Party/lo header button cluster now at identical pixel coordinates in both modes
- Stale version labels removed from lo mode (`RIBBON v3 · ASCII` → `puddle · lo`)
- Typing in the QR modal name field no longer triggers synth keypresses (AsciiRibbon missing INPUT guard)
- `party·lo` toggle, QR, and ⓘ buttons aligned consistently in both modes

### Deployment

- `puddle.obfusco.us` — production (this release)
- `puddle.obfusco.us/v1` — updated to include lo mode (v1 branch)
- `puddle.obfusco.us/v1.1` — permanent snapshot of this release (if deployed)

---

## v1 — "Puddle" (2026-04-09)

First stable release. Forked from Ribbon v3 and evolved into a standalone instrument.

### Instrument

- Triple oscillator synthesis with per-oscillator detune and mix
- 2D kaos pad surface — X=pitch, Y=velocity
- Rotary knob controls replacing all range sliders (except volume fader)
- VCF per-oscillator voltage-controlled filter with cutoff, resonance, and routing buttons
- Effects: delay, reverb, bitcrush/crunch (AudioWorklet)
- Glide/portamento speed control
- Multi-select scale modes (combine chromatic, major, minor, blues, pentatonic)
- Play / Arp / Mono / Poly / Hold modes with rocker switch UI
- 9 draggable marbles (Ruby→Moonstone) that persist sound on the puddle with physics
- Shake randomization: logo click, lightning bolt button, or device accelerometer

### Visuals

- Iridescent oil-spill Three.js shader surface (thin-film interference, multi-layer rainbow swirls)
- Ripple physics: vertex displacement from touch in a ring buffer with exponential decay
- Asteroids-style confetti with firework bursts
- Perspective floor grid with parallax driven by touch

### Input

- Touch/mouse on puddle surface
- Keyboard (A–L keys, always-on)
- MIDI controller via Web MIDI API
- Accelerometer shake (DeviceMotionEvent permission flow for iOS/Android)

### Sharing & Crypto

- QR preset system: all settings encoded in URL hash (`#p=...`), multi-colored gradient QR codes
- VCF, marble positions, wallet address, and loop data included in presets
- RainbowKit + wagmi + viem wallet connection on Base L2
- POAP milestone tracking via localStorage with toast notifications (6 milestones)
- ERC-721 `RibbonPuddle.sol` on Base with IPFS metadata for minting/owning QR presets

### Layout & UX

- Controls surround puddle in CSS grid (display:contents), puddle fills all available vertical space
- Side panels shaped with clip-path to hug the puddle oval, flex outward on wider screens
- Bottom controls always visible, never overlap puddle
- Mobile-optimized layout; puddle fills vertical screen height
- MIDI, POAP badge, and wallet buttons in upper-right header at all screen sizes
- QR trigger in upper-left header at all screen sizes
- Splash screen on mobile (tap to enter, once per session)
- Preset splash screen for QR link arrivals

### Bugs Fixed

- iOS silent mode audio: HTML `<audio>` element unlock forces AVAudioSession to "playback" category (bypasses silent switch)
- Safari performance: removed SMIL animations, SVG blur filters; throttled rAF loops to 30fps; capped 3D pixelRatio
- Marble drag on mobile (touch-action: none)
- Keyboard note input not showing on puddle surface
- VCF knob interactions no longer trigger shake detection
- Arp→play hold mode cut sound on switch
- Marble UV mapping fix (ripple depressions correctly mapped to screen position)

### Deployment

- `puddle.obfusco.us` — production (main branch)
- `puddle-dev.obfusco.us` — dev preview (nmj/* branches)
- `puddle.obfusco.us/v1` — this release (v1 tag, permanent snapshot)
- CI/CD: GitHub Actions → S3 + CloudFront
