#!/usr/bin/env node
// Personal capture tool — records a smoothly looping square video of just
// the puddle animation (no logo/controls/text). Not part of the shipped app.
//
// Headless Chromium on macOS cannot hardware-accelerate WebGL — it always
// falls back to software (SwiftShader) rendering, which throttles real-time
// rendering to single-digit fps at capture resolution. Recording wall-clock
// video and interpolating afterward doesn't fix this: interpolation only
// blends across the timing gaps, it can't invent motion that was never
// captured, so playback still stutters/freezes.
//
// Fix: decouple the shader's clock from wall time (installVirtualClockScript
// in lib/puddlePage.mjs patches performance.now/requestAnimationFrame) and
// step it forward frame-by-frame from here, taking one screenshot per
// virtual frame. Every frame is then a real, distinct, evenly-spaced render
// — no duplicates, no interpolation needed, regardless of how slow the
// actual draw call is.
//
// Looping: exact-period forward loop, not ping-pong. The shader's ~14
// independent sine/cosine terms (ambient undulation + oil-film thickness)
// are exposed as uniforms in usePuddleRenderer.js specifically so this
// script can retune each one to the nearest integer multiple of 2π/duration
// before capturing. That makes every term complete a whole number of cycles
// across the capture window, so frame 0 and the frame one tick past the end
// are mathematically identical — a real seamless loop with continued
// forward motion, no reversed playback and no blending. (Ping-pong looked
// like a muddy double-exposure on this soft, high-contrast content; forward-
// only avoids that AND the "jarring bounce" of watching motion run backward.)
// Trade-off: quantizing to whole cycles only stays close to the live app's
// original frequencies (rather than collapsing several terms onto the same
// rate) if the loop is long enough — durationMs defaults to 80000ms, chosen
// so every term lands within ~30% of its original speed with distinct bands.
//
// A second, independent periodic source lives outside the shader: the
// hue/saturation color filter in App.jsx has its own idle-drift sine with a
// hardcoded 5000ms period, smoothed through an EMA. durationMs must be a
// multiple of 5000 for that filter to close its own loop too, and PREROLL_MS
// must be long enough (several 5s periods) for its EMA to settle into the
// periodic steady state before capture starts — otherwise frame 0 catches it
// mid-transient and the seam shows a color jump. (A third source, the CSS
// `puddle-grid-drift` keyframe animation, runs on the real compositor clock
// and can't be synced to virtual time at all — puddlePage.mjs freezes all
// CSS animations at capture start instead, so it stays static throughout.)
//
// Usage:
//   npm run dev                       # in one terminal
//   npm run capture:video             # in another (defaults to https://localhost:5173)
//   DURATION_MS=80000 PUDDLE_URL=https://puddle.obfusco.us npm run capture:video
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { openPuddlePage } from './lib/puddlePage.mjs'

const url = process.env.PUDDLE_URL || 'https://localhost:5173'
const durationMs = Number(process.env.DURATION_MS || 80000) // exact loop period — must be a multiple of 5000 (see note above)
const prerollMs = Number(process.env.PREROLL_MS || 20000) // virtual warm-up — must be several 5s periods for the hue-drift EMA to settle
const fps = Number(process.env.FPS || 30)
const captureDim = Number(process.env.CAPTURE_SIZE || 640) // render resolution — kept small so headless software WebGL can keep up
const outDim = Number(process.env.SIZE || 1080) // final output resolution
const captureSize = { width: captureDim, height: captureDim }
const outDir = path.resolve('captures')
fs.mkdirSync(outDir, { recursive: true })

// Original hand-tuned frequencies (rad/s) from usePuddleRenderer.js, keyed by
// their uniform name. Quantized below to the nearest whole multiple of
// 2π/durationMs so every term completes an integer number of cycles across
// exactly one loop — the condition for a true zero-blend seam.
const ORIGINAL_FREQS = {
  uAmbF1: 0.8, uAmbF2: 0.6, uAmbF3: 0.3, uAmbF4: 0.2,
  uThickF1: 0.3, uThickF2: 0.4, uThickF3: 0.15, uThickF4: 0.2,
  uThickF5: 0.1, uThickF6: 0.12, uThickF7: 0.25, uThickF8: 0.1,
  uThick2F: 0.18, uPatchF: 0.08,
}

function quantizeFreqs(loopSeconds) {
  const twoPiOverT = (2 * Math.PI) / loopSeconds
  const out = {}
  for (const [name, freq] of Object.entries(ORIGINAL_FREQS)) {
    const n = Math.max(1, Math.round(freq / twoPiOverT)) // never fully freeze a term
    out[name] = n * twoPiOverT
  }
  return out
}

const halfSec = durationMs / 1000 // unique content duration (seconds) — no ping-pong, this *is* the full loop
const frameDt = 1000 / fps
const prerollFrames = Math.round(prerollMs / frameDt)
const captureFrames = Math.round(halfSec * fps)
const quantizedFreqs = quantizeFreqs(halfSec)

const { browser, context, page } = await openPuddlePage({ url, size: captureSize, virtualClock: true })

async function tick() {
  await page.evaluate((dt) => window.__tick(dt), frameDt)
}

console.log('Applying quantized loop frequencies:', quantizedFreqs)
await page.evaluate((freqs) => {
  const uniforms = window.__puddleMaterial.uniforms
  for (const [name, value] of Object.entries(freqs)) uniforms[name].value = value
}, quantizedFreqs)

console.log(`Warming up ${prerollFrames} virtual frames...`)
for (let i = 0; i < prerollFrames; i++) await tick()

const frameDir = fs.mkdtempSync(path.join(outDir, '_frames-'))
console.log(`Capturing ${captureFrames} frames (${halfSec}s exact-loop content @ ${fps}fps) at ${captureDim}x${captureDim}...`)
for (let i = 0; i < captureFrames; i++) {
  await tick()
  await page.screenshot({ path: path.join(frameDir, `f${String(i).padStart(5, '0')}.png`) })
}

await context.close()
await browser.close()

const dest = path.join(outDir, `puddle-${Date.now()}.mp4`)

try {
  // Straight encode + upscale, no reverse/concat — the frame sequence is
  // already an exact single period, so playback looping it is seamless.
  execFileSync('ffmpeg', [
    '-y', '-framerate', String(fps), '-i', path.join(frameDir, 'f%05d.png'),
    '-vf', `scale=${outDim}:${outDim}:flags=lanczos`,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
    '-pix_fmt', 'yuv420p', dest,
  ], { stdio: 'ignore' })

  fs.rmSync(frameDir, { recursive: true, force: true })
} catch (err) {
  console.error('ffmpeg processing failed, keeping frame sequence:', err.message, frameDir)
}

if (fs.existsSync(dest)) {
  const { size: bytes } = fs.statSync(dest)
  console.log('Saved:', dest, `(${(bytes / 1024 / 1024).toFixed(1)}MB)`)
} else {
  console.log('Frames kept at:', frameDir)
}
