import { chromium } from 'playwright'

export const CANVAS_SELECTOR = '.puddle__three canvas'

// Patches performance.now() and requestAnimationFrame so every rAF-driven
// loop on the page (the puddle shader's uTime, the idle hue-rotate CSS
// filter) advances only when explicitly told to via window.__tick(dtMs),
// instead of on real wall-clock/vsync timing. Headless macOS Chromium can't
// hardware-accelerate WebGL — real-time capture is stuck at single-digit fps
// no matter what, and blending/interpolating after the fact just fakes
// motion across those gaps. Decoupling the clock from wall time means each
// captured frame is a real, distinct, evenly-spaced render regardless of how
// long the actual draw call took.
function installVirtualClockScript() {
  let virtualNow = 0
  let queue = []
  window.performance.now = () => virtualNow
  window.requestAnimationFrame = (cb) => {
    queue.push(cb)
    return queue.length
  }
  window.cancelAnimationFrame = (id) => {
    queue[id - 1] = null
  }
  window.__tick = (dtMs) => {
    virtualNow += dtMs
    const cbs = queue
    queue = []
    for (const cb of cbs) if (cb) cb(virtualNow)
  }
}

// Opens the puddle app in headless Chromium with all chrome/text hidden,
// ready for a clean capture. No click-to-dismiss: PresetSplash only shows
// with a URL preset hash (we don't pass one), and MobileSplash — which
// does render below 768px width — is hidden via CSS instead of clicked,
// since clicking the canvas fires a real note + the "First Sound"
// milestone toast, which then shows up in the recording.
export async function openPuddlePage({ url, size, deviceScaleFactor, virtualClock }) {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: size,
    ...(deviceScaleFactor ? { deviceScaleFactor } : {}),
  })
  if (virtualClock) await context.addInitScript(installVirtualClockScript)
  const page = await context.newPage()
  await page.goto(url)
  await page.waitForSelector(CANVAS_SELECTOR, { timeout: 20000 })
  await page.waitForTimeout(500) // let the shader settle
  await page.addStyleTag({
    content: '.app-header, .controls, .puddle__label, .mobile-splash, ds-overlay { display: none !important; }',
  })
  return { browser, context, page }
}
