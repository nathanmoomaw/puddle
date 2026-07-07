import { chromium } from 'playwright'

export const CANVAS_SELECTOR = '.puddle__three canvas'

// Opens the puddle app in headless Chromium with header/controls hidden,
// ready for a clean capture. No click-to-dismiss: at desktop-sized
// viewports (>=768px wide, no URL preset) neither splash screen renders,
// so clicking the canvas does nothing but fire a real note + the
// "First Sound" milestone toast — which then shows up in the recording.
export async function openPuddlePage({ url, size, recordVideoDir, deviceScaleFactor }) {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: size,
    ...(deviceScaleFactor ? { deviceScaleFactor } : {}),
    ...(recordVideoDir ? { recordVideo: { dir: recordVideoDir, size } } : {}),
  })
  const page = await context.newPage()
  await page.goto(url)
  await page.waitForSelector(CANVAS_SELECTOR, { timeout: 20000 })
  await page.waitForTimeout(500) // let the shader settle
  await page.addStyleTag({
    content: '.app-header, .controls, .puddle__label, ds-overlay { display: none !important; }',
  })
  return { browser, context, page }
}
