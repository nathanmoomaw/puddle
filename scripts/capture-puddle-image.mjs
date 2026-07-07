#!/usr/bin/env node
// Personal capture tool — HQ square still frame of just the puddle
// animation (no logo/controls). Not part of the shipped app.
// Usage:
//   npm run dev                       # in one terminal
//   npm run capture:image             # in another (defaults to https://localhost:5173)
//   SIZE=1600 SCALE=2 PUDDLE_URL=https://puddle.obfusco.us npm run capture:image
import fs from 'fs'
import path from 'path'
import { openPuddlePage, CANVAS_SELECTOR } from './lib/puddlePage.mjs'

const url = process.env.PUDDLE_URL || 'https://localhost:5173'
const dim = Number(process.env.SIZE || 1600)
const deviceScaleFactor = Number(process.env.SCALE || 2)
const size = { width: dim, height: dim }
const outDir = path.resolve('captures')
fs.mkdirSync(outDir, { recursive: true })

const { browser, context, page } = await openPuddlePage({ url, size, deviceScaleFactor })

const dest = path.join(outDir, `puddle-${Date.now()}.png`)
await page.locator(CANVAS_SELECTOR).screenshot({ path: dest })

await context.close()
await browser.close()

const { size: bytes } = fs.statSync(dest)
console.log('Saved:', dest, `(${(bytes / 1024 / 1024).toFixed(1)}MB, ${dim * deviceScaleFactor}x${dim * deviceScaleFactor})`)
