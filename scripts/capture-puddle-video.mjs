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
// Looping: ping-pong (play forward + reversed) rather than a crossfade — a
// dissolve between tail and head looked like a muddy double-exposure flash
// on this content (soft, detailed, high-contrast color fields don't blend
// cleanly). The reversed half ends on the exact frame the forward half
// started on, so the loop point is pixel-identical — mathematically
// seamless, no blending at all.
//
// Usage:
//   npm run dev                       # in one terminal
//   npm run capture:video             # in another (defaults to https://localhost:5173)
//   DURATION_MS=15000 PUDDLE_URL=https://puddle.obfusco.us npm run capture:video
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { openPuddlePage } from './lib/puddlePage.mjs'

const url = process.env.PUDDLE_URL || 'https://localhost:5173'
const durationMs = Number(process.env.DURATION_MS || 30000) // final total (ping-ponged) output duration
const prerollMs = Number(process.env.PREROLL_MS || 3000) // virtual warm-up time, advanced but not captured
const fps = Number(process.env.FPS || 30)
const captureDim = Number(process.env.CAPTURE_SIZE || 640) // render resolution — kept small so headless software WebGL can keep up
const outDim = Number(process.env.SIZE || 1080) // final output resolution
const captureSize = { width: captureDim, height: captureDim }
const outDir = path.resolve('captures')
fs.mkdirSync(outDir, { recursive: true })

const halfSec = durationMs / 2000 // unique content duration (seconds) — doubles via ping-pong
const frameDt = 1000 / fps
const prerollFrames = Math.round(prerollMs / frameDt)
const captureFrames = Math.round(halfSec * fps)

const { browser, context, page } = await openPuddlePage({ url, size: captureSize, virtualClock: true })

async function tick() {
  await page.evaluate((dt) => window.__tick(dt), frameDt)
}

console.log(`Warming up ${prerollFrames} virtual frames...`)
for (let i = 0; i < prerollFrames; i++) await tick()

const frameDir = fs.mkdtempSync(path.join(outDir, '_frames-'))
console.log(`Capturing ${captureFrames} frames (${halfSec}s unique content @ ${fps}fps) at ${captureDim}x${captureDim}...`)
for (let i = 0; i < captureFrames; i++) {
  await tick()
  await page.screenshot({ path: path.join(frameDir, `f${String(i).padStart(5, '0')}.png`) })
}

await context.close()
await browser.close()

const uniq = path.join(outDir, `_uniq-${Date.now()}.mp4`)
const dest = path.join(outDir, `puddle-${Date.now()}.mp4`)

try {
  execFileSync('ffmpeg', [
    '-y', '-framerate', String(fps), '-i', path.join(frameDir, 'f%05d.png'),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
    '-pix_fmt', 'yuv420p', uniq,
  ], { stdio: 'ignore' })

  // Ping-pong (forward + reverse), upscaled to the final output size, in one pass.
  execFileSync('ffmpeg', [
    '-y', '-i', uniq,
    '-filter_complex',
    `[0:v]split[fwd][rev];[rev]reverse[bwd];[fwd][bwd]concat=n=2:v=1[looped];` +
    `[looped]scale=${outDim}:${outDim}:flags=lanczos[out]`,
    '-map', '[out]',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
    '-pix_fmt', 'yuv420p', dest,
  ], { stdio: 'ignore' })

  fs.rmSync(frameDir, { recursive: true, force: true })
  fs.unlinkSync(uniq)
} catch (err) {
  console.error('ffmpeg processing failed, keeping frame sequence:', err.message, frameDir)
}

if (fs.existsSync(dest)) {
  const { size: bytes } = fs.statSync(dest)
  console.log('Saved:', dest, `(${(bytes / 1024 / 1024).toFixed(1)}MB)`)
} else {
  console.log('Frames kept at:', frameDir)
}
