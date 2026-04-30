import { setLabelAnchor } from './utils.js'

const LEVEL_NUM = { L: 1, M: 2, H: 3 }

/**
 * Draw radar chart for the result page.
 * The canvas keeps explicit label padding so top/side labels do not get clipped.
 */
export function drawRadar(canvas, userLevels, dimOrder, dimDefs) {
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const containerWidth = canvas.parentElement?.clientWidth || 360
  const size = Math.max(300, Math.min(360, containerWidth - 8))
  const pad = size < 340 ? 82 : 88
  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - pad
  const n = dimOrder.length
  const angleStep = (Math.PI * 2) / n
  const startAngle = -Math.PI / 2

  canvas.width = size * dpr
  canvas.height = size * dpr
  canvas.style.width = `${size}px`
  canvas.style.height = `${size}px`

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, size, size)

  for (let level = 3; level >= 1; level--) {
    const r = (level / 3) * maxR
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = level === 3
      ? 'rgba(41, 98, 194, 0.08)'
      : level === 2
        ? 'rgba(41, 98, 194, 0.05)'
        : 'rgba(41, 98, 194, 0.03)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(41, 98, 194, 0.15)'
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  ctx.font = size < 340 ? '8.5px system-ui, sans-serif' : '9px system-ui, sans-serif'
  ctx.fillStyle = '#7b8794'
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep
    const x = cx + Math.cos(angle) * maxR
    const y = cy + Math.sin(angle) * maxR

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x, y)
    ctx.strokeStyle = 'rgba(41, 98, 194, 0.12)'
    ctx.lineWidth = 0.5
    ctx.stroke()

    setLabelAnchor(ctx, angle)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const directionWeight = Math.max(Math.abs(cos), Math.abs(sin))
    const labelOffset = directionWeight > 0.9 ? 10 : directionWeight > 0.55 ? 16 : 22
    const labelR = maxR + labelOffset
    const lx = cx + cos * labelR
    const ly = cy + sin * labelR
    const dim = dimOrder[i]
    const label = dimDefs[dim]?.name?.replace(/^[A-Za-z0-9]+\s*/, '') || dim
    ctx.fillText(label, lx, ly)
  }

  const values = dimOrder.map((dim) => LEVEL_NUM[userLevels[dim]] || 2)
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = 'rgba(41, 98, 194, 0.25)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(41, 98, 194, 0.7)'
  ctx.lineWidth = 2
  ctx.stroke()

  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#2962c2'
    ctx.fill()
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
}
