let recording = false

// Records just the puddle canvas (no controls/logo overlay) as a video clip.
export function captureVideo(durationMs = 30000) {
  if (recording) return
  const puddleCanvas = document.querySelector('.puddle__three canvas')
  if (!puddleCanvas || typeof puddleCanvas.captureStream !== 'function') return

  const mimeType = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ].find(type => window.MediaRecorder?.isTypeSupported?.(type))
  if (!mimeType) return

  const stream = puddleCanvas.captureStream(30)
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
  const chunks = []

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  recorder.onstop = () => {
    stream.getTracks().forEach(track => track.stop())
    recording = false

    const blob = new Blob(chunks, { type: mimeType })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `puddle-${Date.now()}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  }

  recording = true
  recorder.start()
  setTimeout(() => recorder.stop(), durationMs)
}
