import { drawColoredQR } from '../components/PresetQR'
import { buildPresetUrl } from './presets'

// Gradient stops matching the oil-spill palette
const GRADIENT_STOPS = [
  { offset: 0, color: [180, 40, 255] },
  { offset: 0.15, color: [0, 200, 255] },
  { offset: 0.3, color: [20, 255, 160] },
  { offset: 0.45, color: [255, 200, 0] },
  { offset: 0.6, color: [255, 60, 180] },
  { offset: 0.75, color: [100, 0, 255] },
  { offset: 0.9, color: [0, 220, 255] },
  { offset: 1, color: [180, 40, 255] },
]

function lerpColor(stops, t) {
  t = Math.max(0, Math.min(1, t))
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].offset && t <= stops[i + 1].offset) {
      const local = (t - stops[i].offset) / (stops[i + 1].offset - stops[i].offset)
      return stops[i].color.map((c, j) => Math.round(c + (stops[i + 1].color[j] - c) * local))
    }
  }
  return stops[stops.length - 1].color
}

// Draw the puddle wordmark with iridescent glow
function drawLogo(ctx, cx, y, size) {
  const text = 'puddle'
  const fontSize = Math.round(size * 0.06)
  ctx.font = `bold ${fontSize}px "Courier New", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Soft dark backdrop for contrast
  const metrics = ctx.measureText(text)
  const tw = metrics.width
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.roundRect(cx - tw / 2 - 12, y - fontSize / 2 - 6, tw + 24, fontSize + 12, 8)
  ctx.fill()
  ctx.restore()

  // Iridescent glow pass
  ctx.save()
  ctx.shadowBlur = 12
  for (let i = 0; i < text.length; i++) {
    const t = i / (text.length - 1)
    const [r, g, b] = lerpColor(GRADIENT_STOPS, t)
    ctx.shadowColor = `rgb(${r},${g},${b})`
    ctx.fillStyle = `rgb(${r},${g},${b})`
    const charOffset = (i - (text.length - 1) / 2) * (tw / text.length)
    ctx.fillText(text[i], cx + charOffset, y)
  }
  ctx.restore()
}

// Draw key parameter summary at bottom
function drawParams(ctx, w, h, settings) {
  const { oscParams = [], space = 0.5, tone = 0.5, arpBpm = 120, mode = 'play' } = settings
  const fontSize = Math.round(w * 0.012)
  ctx.font = `${fontSize}px "Courier New", monospace`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  const params = []
  oscParams.forEach((osc, i) => {
    if (osc.mix > 0.05) params.push(`OSC${i + 1}:${osc.waveform.slice(0, 3).toUpperCase()}`)
  })
  if (mode === 'arp') params.push(`ARP@${arpBpm}`)
  params.push(`SPC:${Math.round(space * 100)}%`)
  params.push(`TNE:${Math.round(tone * 100)}%`)

  const lineText = params.join('  ')
  const pad = Math.round(w * 0.012)
  const y = h - pad - fontSize / 2

  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.fillStyle = '#fff'
  ctx.fillText(lineText, pad, y)
  ctx.restore()
}

// Draw gradient QR in top-left corner, return promise
function drawGradientQR(ctx, url, settings, targetSize) {
  return new Promise((resolve) => {
    const qrCanvas = document.createElement('canvas')
    const puddleState = {
      marbles: settings.marbles || [],
      activity: 0,
    }
    drawColoredQR(qrCanvas, url, '', 0.3, puddleState)
    // drawColoredQR is synchronous after async QRCode.toCanvas callback; poll
    const check = () => {
      if (qrCanvas.width > 0 && qrCanvas.height > 0) {
        const pad = Math.round(targetSize * 0.016)
        ctx.save()
        ctx.globalAlpha = 0.9
        ctx.drawImage(qrCanvas, pad, pad, targetSize, targetSize)
        ctx.restore()
        resolve()
      } else {
        requestAnimationFrame(check)
      }
    }
    requestAnimationFrame(check)
  })
}

export async function captureScreenshot(settings) {
  const puddleCanvas = document.querySelector('.puddle__three canvas')
  if (!puddleCanvas) return

  const w = puddleCanvas.width || puddleCanvas.offsetWidth
  const h = puddleCanvas.height || puddleCanvas.offsetHeight

  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')

  // Dark background
  ctx.fillStyle = '#07070f'
  ctx.fillRect(0, 0, w, h)

  // Draw puddle
  ctx.drawImage(puddleCanvas, 0, 0)

  // Draw logo centered near top
  drawLogo(ctx, w / 2, Math.round(h * 0.08), w)

  // Draw gradient QR — top-left
  const url = buildPresetUrl(settings)
  const qrSize = Math.round(Math.min(w, h) * 0.20)
  await drawGradientQR(ctx, url, settings, qrSize)

  // Draw param summary at bottom
  drawParams(ctx, w, h, settings)

  // Draw watermark
  ctx.save()
  ctx.font = `${Math.round(w * 0.012)}px "Courier New", monospace`
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.textAlign = 'right'
  ctx.fillText('puddle.obfusco.us', w - Math.round(w * 0.012), h - Math.round(w * 0.012))
  ctx.restore()

  // Download
  out.toBlob(blob => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `puddle-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  }, 'image/png')
}
