#!/usr/bin/env node
// Personal capture tool — records a smoothly looping square video of just
// the puddle animation (no logo/controls). Not part of the shipped app.
// Usage:
//   npm run dev                       # in one terminal
//   npm run capture:video             # in another (defaults to https://localhost:5173)
//   DURATION_MS=15000 CROSSFADE_MS=1500 PUDDLE_URL=https://puddle.obfusco.us npm run capture:video
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { openPuddlePage } from './lib/puddlePage.mjs'

const url = process.env.PUDDLE_URL || 'https://localhost:5173'
const durationMs = Number(process.env.DURATION_MS || 30000)
const crossfadeMs = Number(process.env.CROSSFADE_MS || 2000)
const dim = Number(process.env.SIZE || 1280)
const size = { width: dim, height: dim }
const outDir = path.resolve('captures')
fs.mkdirSync(outDir, { recursive: true })

const { browser, context, page } = await openPuddlePage({ url, size, recordVideoDir: outDir })

console.log(`Recording ${durationMs / 1000}s of ${url} ...`)
await page.waitForTimeout(durationMs)

await context.close()
await browser.close()

const [recorded] = fs.readdirSync(outDir).filter(f => f.endsWith('.webm'))
if (!recorded) process.exit(1)
const raw = path.join(outDir, recorded)
const trimmed = path.join(outDir, `_trimmed-${Date.now()}.mp4`)
const dest = path.join(outDir, `puddle-${Date.now()}.mp4`)

const T = durationMs / 1000
const X = Math.min(crossfadeMs / 1000, T / 2 - 0.1)

try {
  // The recording spans context-creation -> close, so it includes page-load
  // overhead (Vite dev compile, wallet SDK init) before the puddle settles.
  // Trim to just the last T seconds — clean animation, no load stutter.
  const totalSec = Number(execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', raw,
  ]).toString().trim())
  const startSec = Math.max(0, totalSec - T)

  execFileSync('ffmpeg', [
    '-y', '-ss', String(startSec), '-i', raw, '-t', String(T),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
    '-pix_fmt', 'yuv420p', trimmed,
  ], { stdio: 'ignore' })

  // Seamless loop: dissolve the tail into the head so playback wraps
  // cleanly on repeat instead of hard-cutting. xfade requires an explicit
  // constant frame rate on its inputs, which split/trim alone don't carry.
  execFileSync('ffmpeg', [
    '-y', '-i', trimmed,
    '-filter_complex',
    `[0:v]split=3[body][tail][headsrc];` +
    `[body]trim=start=0:end=${T - X},setpts=PTS-STARTPTS[main];` +
    `[tail]trim=start=${T - X}:end=${T},setpts=PTS-STARTPTS,fps=25[tailclip];` +
    `[headsrc]trim=start=0:end=${X},setpts=PTS-STARTPTS,fps=25[headclip];` +
    `[tailclip][headclip]xfade=transition=fade:duration=${X}:offset=0[crossfaded];` +
    `[main][crossfaded]concat=n=2:v=1:a=0[out]`,
    '-map', '[out]',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
    '-pix_fmt', 'yuv420p', dest,
  ], { stdio: 'ignore' })

  fs.unlinkSync(raw)
  fs.unlinkSync(trimmed)
} catch (err) {
  console.error('ffmpeg processing failed, keeping untrimmed recording:', err.message)
  fs.rmSync(trimmed, { force: true })
  fs.renameSync(raw, dest.replace(/\.mp4$/, '.webm'))
}

const finalPath = fs.existsSync(dest) ? dest : dest.replace(/\.mp4$/, '.webm')
const { size: bytes } = fs.statSync(finalPath)
console.log('Saved:', finalPath, `(${(bytes / 1024 / 1024).toFixed(1)}MB)`)
