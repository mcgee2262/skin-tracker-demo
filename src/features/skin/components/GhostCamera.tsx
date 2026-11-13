import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface Props {
  ghostUrl?: string
  onCapture: (blob: Blob) => void
}

const ASPECT = 3 / 4

/** Center-crops to 3:4, scales to max 1080 wide and encodes JPEG. */
function toJpeg(source: CanvasImageSource, sw: number, sh: number): Promise<Blob> {
  let cw = sw, ch = sw / ASPECT
  if (ch > sh) { ch = sh; cw = sh * ASPECT }
  const sx = (sw - cw) / 2, sy = (sh - ch) / 2
  const outW = Math.min(1080, Math.round(cw))
  const outH = Math.round(outW / ASPECT)
  const canvas = document.createElement('canvas')
  canvas.width = outW; canvas.height = outH
  canvas.getContext('2d')!.drawImage(source, sx, sy, cw, ch, 0, 0, outW, outH)
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Encode failed'))), 'image/jpeg', 0.85))
}

export default function GhostCamera({ ghostUrl, onCapture }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    let dead = false
    setDenied(false)
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 } }, audio: false })
      .then((s) => {
        if (dead) { s.getTracks().forEach((t) => t.stop()); return }
        stream.current = s
        if (video.current) { video.current.srcObject = s; void video.current.play() }
      })
      .catch(() => setDenied(true))
    if (!navigator.mediaDevices) setDenied(true)
    return () => { dead = true; stream.current?.getTracks().forEach((t) => t.stop()) }
  }, [facing])

  async function snap() {
    const v = video.current
    if (!v || !v.videoWidth) return
    onCapture(await toJpeg(v, v.videoWidth, v.videoHeight))
  }

  async function fromFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const bmp = await createImageBitmap(f)
    onCapture(await toJpeg(bmp, bmp.width, bmp.height))
  }

  const mirror = facing === 'user'

  if (denied) {
    return (
      <div className="cam-denied">
        <p>Camera access is off. Take or choose a photo instead.</p>
        <label className="btn-primary file-btn">
          Take photo
          <input type="file" accept="image/*" capture="user" onChange={fromFile} hidden />
        </label>
      </div>
    )
  }

  return (
    <div className="cam">
      <div className="cam-view">
        <video ref={video} playsInline muted style={{ transform: mirror ? 'scaleX(-1)' : undefined }} />
        {ghostUrl && <img className="ghost" src={ghostUrl} alt="" style={{ transform: mirror ? 'scaleX(-1)' : undefined }} />}
        <div className="oval" />
      </div>
      <div className="cam-controls">
        {ghostUrl ? <img className="cam-thumb" src={ghostUrl} alt="Yesterday" /> : <span className="cam-thumb empty" />}
        <button className="shutter" onClick={snap} aria-label="Take photo"><span /></button>
        <button className="cam-flip" onClick={() => setFacing(facing === 'user' ? 'environment' : 'user')} aria-label="Flip camera">
          <RefreshCw size={22} />
        </button>
      </div>
    </div>
  )
}
