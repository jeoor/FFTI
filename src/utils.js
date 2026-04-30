/**
 * Fisher-Yates 洗牌算法
 */
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Canvas 雷达图标签锚点：根据角度自动设置 textAlign/textBaseline
 */
export function setLabelAnchor(ctx, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  if (cos > 0.35) ctx.textAlign = 'left'
  else if (cos < -0.35) ctx.textAlign = 'right'
  else ctx.textAlign = 'center'

  if (sin > 0.45) ctx.textBaseline = 'top'
  else if (sin < -0.45) ctx.textBaseline = 'bottom'
  else ctx.textBaseline = 'middle'
}
