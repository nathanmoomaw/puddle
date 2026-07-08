#!/usr/bin/env node
// Personal capture tool — records a smoothly looping square video of just
// the puddle animation (no logo/controls/text). Not part of the shipped app.
//
// Headless Chromium on macOS cannot hardware-accelerate WebGL — it always
// falls back to software (SwiftShader) rendering, which throttles the
// puddle's requestAnimationFrame-driven shader to single-digit fps at
// capture resolution (~1.5fps at 1280x1280, ~11fps at 640x640). Recording
// straight at the target resolution produces a duplicate-frame, choppy
// result. Fix: render small (fast enough to get real, distinct frames),
// interpolate up to a smooth 30fps, then scale up to the final size.
//
// Looping: a crossfade dissolve between tail and head looked like a muddy
// double-exposure flash on this content (soft, detailed, high-contrast
// color fields don't blend cleanly). Ping-pong instead: capture half the
// requested duration, then play it forward + reversed. The reversed half
// ends on the exact same frame the forward half started on, so the loop
// point is pixel-identical — mathematically seamless, no blending at all.
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
const prerollMs = Number(process.env.PREROLL_MS || 3000)
const captureDim = Number(process.env.CAPTURE_SIZE || 640) // render resolution — kept small so headless software WebGL can keep up
const outDim = Number(process.env.SIZE || 1080) // final output resolution
const captureSize = { width: captureDim, height: captureDim }
const outDir = path.resolve('captures')
fs.mkdirSync(outDir, { recursive: true })

const half = durationMs / 2000 // unique content duration (seconds) — doubles via ping-pong
const P = prerollMs / 1000

const { browser, context, page } = await openPuddlePage({ url, size: captureSize, recordVideoDir: outDir })

console.log(`Recording ${half}s of unique content (-> ${durationMs / 1000}s ping-ponged) at ${captureDim}x${captureDim}, upscaling to ${outDim}x${outDim} ...`)
await page.waitForTimeout(half * 1000 + prerollMs)

await context.close()
await browser.close()

const [recorded] = fs.readdirSync(outDir).filter(f => f.endsWith('.webm'))
if (!recorded) process.exit(1)
const raw = path.join(outDir, recorded)
const trimmed = path.join(outDir, `_trimmed-${Date.now()}.mp4`)
const interpolated = path.join(outDir, `_interp-${Date.now()}.mp4`)
const dest = path.join(outDir, `puddle-${Date.now()}.mp4`)

try {
  // The recording spans context-creation -> close, so it includes page-load
  // overhead (Vite dev compile, wallet SDK init) before the puddle settles.
  // Trim to the last (half + P) seconds — still discards load overhead, but
  // keeps P extra seconds of preroll ahead of the content we actually want.
  const totalSec = Number(execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', raw,
  ]).toString().trim())
  const startSec = Math.max(0, totalSec - (half + P))

  execFileSync('ffmpeg', [
    '-y', '-ss', String(startSec), '-i', raw, '-t', String(half + P),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
    '-pix_fmt', 'yuv420p', trimmed,
  ], { stdio: 'ignore' })

  // Real frames are ~5-12fps at this resolution — interpolate the rest so
  // playback reads as fluid 30fps. Plain blend (no motion-vector search):
  // this content is soft, low-frequency color gradients with nothing
  // trackable, so motion-compensated modes (mci) buy nothing here and
  // occasionally introduce their own warping artifacts. Blend is also
  // ~18x faster. The preroll window (dropped below) absorbs interpolation
  // warm-up and the chrome-hiding stylesheet's first paint.
  execFileSync('ffmpeg', [
    '-y', '-i', trimmed,
    '-vf', 'minterpolate=fps=30:mi_mode=blend',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
    '-pix_fmt', 'yuv420p', interpolated,
  ], { stdio: 'ignore' })

  // Drop the preroll, ping-pong (forward + reverse) for a seamless loop,
  // and upscale to the final output size, all in one pass.
  execFileSync('ffmpeg', [
    '-y', '-i', interpolated,
    '-filter_complex',
    `[0:v]trim=start=${P}:end=${P + half},setpts=PTS-STARTPTS[uniq];` +
    `[uniq]split[fwd][rev];` +
    `[rev]reverse[bwd];` +
    `[fwd][bwd]concat=n=2:v=1[looped];` +
    `[looped]scale=${outDim}:${outDim}:flags=lanczos[out]`,
    '-map', '[out]',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
    '-pix_fmt', 'yuv420p', dest,
  ], { stdio: 'ignore' })

  fs.unlinkSync(raw)
  fs.unlinkSync(trimmed)
  fs.unlinkSync(interpolated)
} catch (err) {
  console.error('ffmpeg processing failed, keeping untrimmed recording:', err.message)
  fs.rmSync(trimmed, { force: true })
  fs.rmSync(interpolated, { force: true })
  fs.renameSync(raw, dest.replace(/\.mp4$/, '.webm'))
}

const finalPath = fs.existsSync(dest) ? dest : dest.replace(/\.mp4$/, '.webm')
const { size: bytes } = fs.statSync(finalPath)
console.log('Saved:', finalPath, `(${(bytes / 1024 / 1024).toFixed(1)}MB)`)
