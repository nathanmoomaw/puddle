#!/usr/bin/env node
// Personal capture tool — records just the puddle animation to a video file.
// Not part of the shipped app. Usage:
//   npm run dev                       # in one terminal
//   npm run capture:video             # in another (defaults to https://localhost:5173)
//   PUDDLE_URL=https://puddle.obfusco.us DURATION_MS=15000 npm run capture:video
import { chromium } from 'playwright'
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const url = process.env.PUDDLE_URL || 'https://localhost:5173'
const durationMs = Number(process.env.DURATION_MS || 30000)
const size = { width: 1280, height: 1280 }
const outDir = path.resolve('captures')
fs.mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: size,
  recordVideo: { dir: outDir, size },
})
const page = await context.newPage()

await page.goto(url)
await page.waitForSelector('.puddle__three canvas', { timeout: 20000 })

// Dismiss any splash overlay blocking the canvas
try { await page.mouse.click(size.width / 2, size.height / 2) } catch {}
await page.waitForTimeout(500)

// Hide header/controls chrome — just the puddle itself
await page.addStyleTag({
  content: `.app-header, .controls { display: none !important; }`,
})

console.log(`Recording ${durationMs / 1000}s of ${url} ...`)
await page.waitForTimeout(durationMs)

await context.close()
await browser.close()

// Playwright names the file after an internal id — rename to something useful
const [recorded] = fs.readdirSync(outDir).filter(f => f.endsWith('.webm'))
if (!recorded) process.exit(1)

const raw = path.join(outDir, recorded)
const dest = path.join(outDir, `puddle-${Date.now()}.mp4`)

// The recorded file spans context-creation → close, so it includes page-load
// overhead (Vite dev compile, wallet SDK init) before the puddle settles.
// Trim to just the last durationMs — clean animation, no load stutter.
// h264/mp4 (not vp9/webm) — encodes in seconds instead of minutes.
try {
  const totalSec = Number(execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', raw,
  ]).toString().trim())
  const startSec = Math.max(0, totalSec - durationMs / 1000)
  execFileSync('ffmpeg', [
    '-y', '-ss', String(startSec), '-i', raw,
    '-t', String(durationMs / 1000),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
    '-pix_fmt', 'yuv420p',
    dest,
  ], { stdio: 'ignore' })
  fs.unlinkSync(raw)
} catch {
  // ffmpeg/ffprobe unavailable — fall back to the untrimmed raw recording
  fs.renameSync(raw, dest.replace(/\.mp4$/, '.webm'))
}

console.log('Saved:', dest)
