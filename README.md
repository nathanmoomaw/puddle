# Puddle

A web-based iridescent oil-spill synthesizer. The 2D kaos pad — the "puddle" — is the primary instrument surface: X=pitch, Y=velocity.

**Live:** [puddle.obfusco.us](https://puddle.obfusco.us)

## Features

### Sound Engine
- Triple oscillator synthesis (sine, square, sawtooth, triangle) with per-oscillator detune and mix
- 2D kaos pad controller — X=pitch, Y=velocity across multiple octaves
- Multi-select scale modes (chromatic, major, minor, blues, pentatonic — combine scales for hybrid note sets)
- Effects chain: delay (time, feedback, mix), reverb, and bitcrush/crunch
- VCF (voltage-controlled filter) with cutoff, resonance, and per-oscillator routing
- Glide/portamento speed control

### Play Modes
- **Play / Arp** — toggle between single-note play and arpeggiator with adjustable BPM
- **Mono / Poly** — single voice or polyphonic (up to 8 voices)
- **Hold** — sustains notes after release; in arp+poly+hold, tap notes to build arp sequences
- **Marbles** — 9 draggable marbles (Ruby→Moonstone) that persist sound on the puddle
- **Shake** — randomizes synth parameters for happy accidents (click logo, lightning bolt, or shake device)

### Input
- **Touch/Mouse** — play the puddle surface for continuous pitch+velocity control
- **Keyboard** — A through L keys mapped across the range
- **Accelerometer** — shake your mobile device to trigger parameter randomization
- **MIDI** — hardware controller support via Web MIDI API

### Visuals
- Iridescent oil-spill Three.js shader surface (thin-film interference, multi-layer rainbow swirls)
- Ripple physics: vertex displacement from touch in a ring buffer with exponential decay
- Confetti: asteroids-style unfilled stroke geometry with firework bursts
- Perspective floor grid with parallax driven by touch

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `1` | Play mode |
| `2` | Arp mode |
| `3` | Mono/Poly toggle |
| `4` | Hold toggle |
| `V` | Toggle Party/Lo visuals |
| `Space` | Stop / kill sound (double-tap kills tails + clears marbles) |
| `A`-`L` | Play notes |

## Getting Started

```bash
npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173) to play.

## Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Three.js](https://threejs.org/) for the oil-spill kaos pad shader
- [RainbowKit](https://www.rainbowkit.com/) + [wagmi](https://wagmi.sh/) + [viem](https://viem.sh/) for Base L2 wallet connection
- Zero external audio/UI libraries

## Forked From

Puddle is forked from [Ribbon](https://ribbon.obfusco.us) v3.
