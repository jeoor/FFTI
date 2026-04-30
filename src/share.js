import { getAvatarUrl } from './avatar.js'
import { setLabelAnchor } from './utils.js'

/**
 * FFTI share image generator
 */

const C = {
  bg: '#f4f6fa',
  card: '#ffffff',
  ink: '#121926',
  ink2: '#4a5568',
  ink3: '#7b8794',
  blue: '#2962c2',
  blueL: '#e8f0fe',
  blueD: '#1a4390',
  amber: '#e6a020',
  amberL: '#fef9ee',
}

const Lv = { L: 1, M: 2, H: 3 }
const Lb = { L: '低', M: '中', H: '高' }
const KICKER = {
  loop404: '隐藏人格已激活',
  gone: '彩蛋人格已解锁',
  null: '系统兜底匹配',
  normal: '你的发疯类型',
}

const W = 720
const G = 24
const CW = W - G * 2

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function shadow(ctx, x, y, w, h, r) {
  rr(ctx, x + 4, y + 4, w, h, r)
  ctx.fillStyle = 'rgba(0,0,0,0.07)'
  ctx.fill()
}

function fillR(ctx, x, y, w, h, r, c) {
  rr(ctx, x, y, w, h, r)
  ctx.fillStyle = c
  ctx.fill()
}

function strokeR(ctx, x, y, w, h, r, c, lw) {
  rr(ctx, x, y, w, h, r)
  ctx.strokeStyle = c
  ctx.lineWidth = lw
  ctx.stroke()
}

function txt(ctx, text, x, y, font, color, align = 'left') {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.fillText(text, x, y)
}

function clipCircle(ctx, x, y, r) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.closePath()
}

function wrap(ctx, text, maxW) {
  if (!text) return []
  const out = []
  let cur = ''
  for (const ch of text) {
    const next = cur + ch
    if (ctx.measureText(next).width > maxW && cur.length > 0) {
      out.push(cur)
      cur = ch
    } else {
      cur = next
    }
  }
  if (cur) out.push(cur)
  return out
}

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function buildTagRows(ctx, tags, maxWidth, maxRows = 2) {
  const rows = []
  let row = []
  let rowWidth = 0

  for (const tag of tags) {
    const width = ctx.measureText(tag).width + 26
    const nextWidth = row.length ? rowWidth + 8 + width : width

    if (row.length && nextWidth > maxWidth) {
      rows.push(row)
      if (rows.length >= maxRows) return rows
      row = [tag]
      rowWidth = width
      continue
    }

    row.push(tag)
    rowWidth = nextWidth
  }

  if (row.length && rows.length < maxRows) rows.push(row)
  return rows
}

export async function generateShareImage(primary, userLevels, dimOrder, dimDefs, mode, config) {
  const dpr = 2
  const tc = document.createElement('canvas').getContext('2d')
  tc.textBaseline = 'alphabetic'

  const innerPad = 28
  const contentW = CW - innerPad * 2
  const sectionGap = 30
  const blockGap = 20
  const rowGap = 12
  const topMetaGap = 16
  const tagRowGap = 10
  const shareLink = config?.display?.shareLink || 'https://pingfanfan.github.io/SBTI/'
  const quoteFont = '700 16px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  const quoteLineH = 26
  const quoteInsetX = 18
  const quoteInsetY = 18

  tc.font = quoteFont
  const quoteLines = wrap(tc, primary.intro || '', contentW - 44).slice(0, 2)

  tc.font = '500 15px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  const descLines = wrap(tc, primary.desc || '', contentW).slice(0, 3)

  tc.font = '700 12px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  const tagRows = buildTagRows(tc, primary.tags || [], contentW, 2)
  const summaryDims = dimOrder
    .map((dim, index) => {
      const level = userLevels[dim] || 'M'
      return { dim, index, level, weight: Math.abs((Lv[level] || 2) - 2) }
    })
    .sort((a, b) => b.weight - a.weight || a.index - b.index)
    .slice(0, 6)
    .sort((a, b) => a.index - b.index)

  const badgeText = primary.exact != null
    ? `匹配度 ${primary.similarity}% · 完全命中 ${primary.exact}/15`
    : `匹配度 ${primary.similarity}%`
  const levelText = primary.level != null && primary.level >= 0
    ? `发疯等级 ${'★'.repeat(Math.min(primary.level, 5))}${primary.level === 0 ? ' 未启动' : ''}`
    : ''

  const bannerH = 194
  const badgeH = 30
  const tagH = 26
  const quoteH = quoteLines.length ? quoteLines.length * quoteLineH + quoteInsetY * 2 : 0
  const descH = descLines.length ? descLines.length * 22 : 0
  const radarTitleH = 20
  const radarTitleGap = 20
  const radarR = 92
  const radarLabelPadTop = 28
  const radarLabelPadBottom = 28
  const radarBlockH = radarTitleH + radarTitleGap + radarLabelPadTop + radarR * 2 + radarLabelPadBottom
  const dimRowH = 30
  const qrCardH = 228
  const footerH = 20
  const footerTopGap = 34
  const footerBottomPad = 30

  let H = G + 36
  H += bannerH + sectionGap
  H += badgeH
  if (levelText) H += topMetaGap + 18
  if (tagRows.length) H += topMetaGap + tagRows.length * tagH + (tagRows.length - 1) * tagRowGap
  if (quoteH) H += sectionGap + quoteH
  if (descH) H += blockGap + descH
  H += sectionGap + radarBlockH
  H += sectionGap + 28 + summaryDims.length * dimRowH + Math.max(0, summaryDims.length - 1) * rowGap
  H += sectionGap + qrCardH
  H += footerTopGap + footerH + footerBottomPad
  H = Math.max(H, 1320)

  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)
  const cardH = H - G * 2
  shadow(ctx, G, G, CW, cardH, 4)
  fillR(ctx, G, G, CW, cardH, 4, C.card)
  strokeR(ctx, G, G, CW, cardH, 4, C.blue, 3)

  let y = G + 36

  const bannerX = G + 20
  const bannerW = CW - 40
  shadow(ctx, bannerX, y, bannerW, bannerH, 4)
  fillR(ctx, bannerX, y, bannerW, bannerH, 4, C.blueL)
  strokeR(ctx, bannerX, y, bannerW, bannerH, 4, C.blue, 3)
  const avatarUrl = getAvatarUrl(primary.code)
  const avatarSize = 72
  const avatarCx = W / 2
  const avatarCy = y + 52
  // avatar frame — use circle, not rounded rect with insane radius
  ctx.beginPath()
  ctx.arc(avatarCx, avatarCy, avatarSize / 2 + 3, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = C.blue
  ctx.lineWidth = 2
  ctx.stroke()
  if (avatarUrl) {
    try {
      const avatarImg = await loadImg(avatarUrl)
      ctx.save()
      clipCircle(ctx, avatarCx, avatarCy, avatarSize / 2)
      ctx.clip()
      ctx.drawImage(avatarImg, avatarCx - avatarSize / 2, avatarCy - avatarSize / 2, avatarSize, avatarSize)
      ctx.restore()
    } catch (e) {
      // Keep the avatar frame even if the image fails to load.
    }
  }
  txt(ctx, KICKER[mode] || KICKER.normal, W / 2, y + 108, '800 13px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', C.ink3, 'center')
  txt(ctx, primary.code, W / 2, y + 154, '1000 48px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', C.blue, 'center')
  txt(ctx, primary.cn, W / 2, y + 180, '800 18px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', C.ink, 'center')
  y += bannerH + sectionGap

  tc.font = '700 14px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  const badgeW = tc.measureText(badgeText).width + 30
  fillR(ctx, (W - badgeW) / 2, y, badgeW, badgeH, 4, C.blueL)
  strokeR(ctx, (W - badgeW) / 2, y, badgeW, badgeH, 4, C.blue, 2)
  txt(ctx, badgeText, W / 2, y + 20, '700 14px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', C.blue, 'center')
  y += badgeH

  if (levelText) {
    y += topMetaGap
    txt(ctx, levelText, W / 2, y + 14, '700 14px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', C.amber, 'center')
    y += 18
  }

  if (tagRows.length) {
    y += topMetaGap
    tc.font = '700 12px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
    for (const row of tagRows) {
      const rowWidth = row.reduce((sum, tag, index) => sum + tc.measureText(tag).width + 26 + (index ? 8 : 0), 0)
      let x = (W - rowWidth) / 2
      for (const tag of row) {
        const width = tc.measureText(tag).width + 26
        fillR(ctx, x, y, width, tagH, 4, C.amberL)
        strokeR(ctx, x, y, width, tagH, 4, C.amber, 2)
        txt(ctx, tag, x + 13, y + 17, '700 12px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', '#8b6914')
        x += width + 8
      }
      y += tagH + tagRowGap
    }
    y -= tagRowGap
  }

  if (quoteH) {
    y += sectionGap
    ctx.fillStyle = C.blue
    ctx.fillRect(G + innerPad, y, 5, quoteH)
    ctx.fillStyle = '#fafbfd'
    ctx.fillRect(G + innerPad + 5, y, contentW - 5, quoteH)
    const quoteTextTop = y + quoteInsetY
    quoteLines.forEach((line, index) => {
      txt(
        ctx,
        line,
        G + innerPad + quoteInsetX,
        quoteTextTop + 16 + index * quoteLineH,
        quoteFont,
        C.ink
      )
    })
    y += quoteH
  }

  if (descH) {
    y += blockGap
    descLines.forEach((line, index) => {
      txt(ctx, line, G + innerPad, y + index * 22, '500 15px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', C.ink2)
    })
    y += descH
  }

  y += sectionGap
  txt(ctx, '维度分布画像', W / 2, y + 14, '900 15px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', C.ink, 'center')
  y += radarTitleH + radarTitleGap
  drawRadar(ctx, W / 2, y + radarLabelPadTop + radarR, radarR, userLevels, dimOrder, dimDefs)
  y += radarLabelPadTop + radarR * 2 + radarLabelPadBottom

  y += sectionGap
  txt(ctx, '关键维度摘要', W / 2, y + 14, '900 15px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', C.ink, 'center')
  y += 28
  const dimX = G + innerPad
  const dimLabelW = 118
  const dimValueX = G + CW - innerPad - 34
  const barX = dimX + dimLabelW
  const barW = dimValueX - barX - 14
  for (const item of summaryDims) {
    const dim = item.dim
    const lv = item.level
    const value = Lv[lv]
    const def = dimDefs[dim]
    if (!def) continue

    const name = def.name.replace(/^[A-Za-z0-9]+\s*/, '')
    txt(ctx, name, dimX, y + 16, '800 13px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', C.ink)

    fillR(ctx, barX, y + 5, barW, 10, 2, '#e8ecf2')
    fillR(ctx, barX, y + 5, (value / 3) * barW, 10, 2, value === 3 ? C.blueD : value === 2 ? C.blue : C.amber)

    rr(ctx, dimValueX, y, 34, 20, 2)
    if (value === 3) {
      ctx.fillStyle = '#e0ecf8'
      ctx.strokeStyle = C.blueD
    } else if (value === 2) {
      ctx.fillStyle = C.blueL
      ctx.strokeStyle = C.blue
    } else {
      ctx.fillStyle = '#fef5e8'
      ctx.strokeStyle = C.amber
    }
    ctx.fill()
    ctx.lineWidth = 2
    ctx.stroke()
    txt(ctx, Lb[lv], dimValueX + 17, y + 14, '800 11px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', value === 3 ? C.blueD : value === 2 ? C.blue : '#b8860b', 'center')
    y += dimRowH + rowGap
  }
  y -= rowGap

  y += sectionGap + 4
  const qrCardX = G + 20
  const qrCardW = CW - 40
  fillR(ctx, qrCardX, y, qrCardW, qrCardH, 4, C.blueL)
  strokeR(ctx, qrCardX, y, qrCardW, qrCardH, 4, C.blue, 2)
  txt(ctx, '扫码测测你的 FFTI', W / 2, y + 34, '900 16px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', C.ink, 'center')
  txt(ctx, '打开原测试页，生成你的结果图', W / 2, y + 60, '600 13px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', C.ink3, 'center')

  const qs = 88
  const qp = 14
  const qrBox = qs + qp * 2
  const qx = W / 2 - qrBox / 2
  const qy = y + 82
  fillR(ctx, qx, qy, qrBox, qrBox, 4, '#ffffff')
  strokeR(ctx, qx, qy, qrBox, qrBox, 4, C.blue, 2)
  fillR(ctx, qx + qp, qy + qp, qs, qs, 4, '#ffffff')

  try {
    const im = await loadImg(
      `https://api.qrserver.com/v1/create-qr-code/?size=${qs * 2}x${qs * 2}&data=${encodeURIComponent(shareLink)}&color=2962c2&bgcolor=ffffff&margin=8`
    )
    ctx.save()
    rr(ctx, qx + qp, qy + qp, qs, qs, 4)
    ctx.clip()
    ctx.drawImage(im, qx + qp, qy + qp, qs, qs)
    ctx.restore()
  } catch (e) {
    // Keep qr frame visible even if the request fails.
  }

  y += qrCardH + footerTopGap
  txt(ctx, 'FFTI 发疯人格测试 · 结果分享图', W / 2, y + 14, '700 14px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', C.ink3, 'center')

  const a = document.createElement('a')
  a.download = `FFTI-${primary.code}.png`
  a.href = canvas.toDataURL('image/png')
  a.click()
}

function drawRadar(ctx, cx, cy, r, levels, dims, defs) {
  const n = dims.length
  const step = (Math.PI * 2) / n
  const start = -Math.PI / 2
  const bottomBand = Math.PI * 0.22

  for (let lv = 3; lv >= 1; lv--) {
    const rr2 = (lv / 3) * r
    ctx.beginPath()
    ctx.arc(cx, cy, rr2, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(41,98,194,${[0, 0, 0.02, 0.03, 0.05][lv]})`
    ctx.fill()
    ctx.strokeStyle = 'rgba(41,98,194,0.08)'
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  ctx.font = '700 10px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
  for (let i = 0; i < n; i++) {
    const a = start + i * step
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x, y)
    ctx.strokeStyle = 'rgba(41,98,194,0.06)'
    ctx.lineWidth = 0.5
    ctx.stroke()
    setLabelAnchor(ctx, a)
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    const directionWeight = Math.max(Math.abs(cos), Math.abs(sin))
    const labelOffset = directionWeight > 0.9 ? 10 : directionWeight > 0.55 ? 16 : 22
    const labelR = r + labelOffset
    let lx = cx + cos * labelR
    let ly = cy + sin * labelR

    // Separate the two labels nearest the bottom so they do not overlap.
    if (Math.abs(a - Math.PI / 2) < bottomBand) {
      const spread = (bottomBand - Math.abs(a - Math.PI / 2)) / bottomBand
      lx += (cos >= 0 ? 1 : -1) * (16 + spread * 10)
      ly += 8 + spread * 6
    }

    ctx.fillStyle = C.ink3
    ctx.fillText((defs[dims[i]]?.name || dims[i]).replace(/^[A-Za-z0-9]+\s*/, ''), lx, ly)
  }

  ctx.textBaseline = 'alphabetic'
  const vals = dims.map((d) => Lv[levels[d]] || 2)
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const a = start + i * step
    const rr2 = (vals[i] / 3) * r
    const x = cx + Math.cos(a) * rr2
    const y = cy + Math.sin(a) * rr2
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = 'rgba(41,98,194,0.15)'
  ctx.fill()
  ctx.strokeStyle = C.blue
  ctx.lineWidth = 2
  ctx.stroke()

  for (let i = 0; i < n; i++) {
    const a = start + i * step
    const rr2 = (vals[i] / 3) * r
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2, 3, 0, Math.PI * 2)
    ctx.fillStyle = C.blue
    ctx.fill()
  }
}
