import QRCode from 'qrcode'
import { buildPresetUrl } from './presets'

export async function captureScreenshot(settings) {
  // 1. Find the Three.js puddle canvas
  const puddleCanvas = document.querySelector('.puddle__three canvas')
  if (!puddleCanvas) return

  const w = puddleCanvas.width || puddleCanvas.offsetWidth
  const h = puddleCanvas.height || puddleCanvas.offsetHeight

  // 2. Build output canvas at screen resolution
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')

  // Dark background (puddle is transparent over a dark body bg)
  ctx.fillStyle = '#07070f'
  ctx.fillRect(0, 0, w, h)

  // Draw puddle frame
  ctx.drawImage(puddleCanvas, 0, 0)

  // 3. Generate QR code for the current preset
  const url = buildPresetUrl(settings)
  const qrSize = Math.round(Math.min(w, h) * 0.22)
  const qrCanvas = document.createElement('canvas')
  await QRCode.toCanvas(qrCanvas, url, {
    width: qrSize,
    margin: 1,
    color: { dark: '#e0ffe0', light: '#00000000' },
    errorCorrectionLevel: 'M',
  })

  // 4. Overlay QR in top-left with slight padding and frosted bg
  const pad = 10
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(pad - 4, pad - 4, qrSize + 8, qrSize + 8, 6)
  ctx.fill()
  ctx.globalAlpha = 0.9
  ctx.drawImage(qrCanvas, pad, pad, qrSize, qrSize)
  ctx.restore()

  // 5. Watermark
  ctx.save()
  ctx.font = `${Math.round(w * 0.015)}px "Courier New", monospace`
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.textAlign = 'right'
  ctx.fillText('puddle.obfusco.us', w - 10, h - 8)
  ctx.restore()

  // 6. Download
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
