import { chromium } from 'playwright'

export const CANVAS_SELECTOR = '.puddle__three canvas'

// Opens the puddle app in headless Chromium with all chrome/text hidden,
// ready for a clean capture. No click-to-dismiss: PresetSplash only shows
// with a URL preset hash (we don't pass one), and MobileSplash — which
// does render below 768px width — is hidden via CSS instead of clicked,
// since clicking the canvas fires a real note + the "First Sound"
// milestone toast, which then shows up in the recording.
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
    content: '.app-header, .controls, .puddle__label, .mobile-splash, ds-overlay { display: none !important; }',
  })
  return { browser, context, page }
}
