import { drawRadar } from './chart.js'
import { generateShareImage } from './share.js'
import { getAvatarUrl } from './avatar.js'

const LEVEL_LABEL = { L: '低', M: '中', H: '高' }
const LEVEL_CLASS = { L: 'level-low', M: 'level-mid', H: 'level-high' }

const MODE_KICKER = {
  loop404: '隐藏人格已激活',
  gone: '彩蛋人格已解锁',
  'null': '系统兜底匹配',
  normal: '你的发疯类型',
}

/**
 * 渲染 FFTI 测试结果
 */
export function renderResult(result, userLevels, dimOrder, dimDefs, config) {
  const { primary, secondary, rankings, mode } = result

  // Kicker
  document.getElementById('result-kicker').textContent = MODE_KICKER[mode] || '你的发疯类型'

  // 类型代码 + 中文名
  document.getElementById('result-code').textContent = primary.code
  const avatarEl = document.getElementById('result-avatar')
  if (avatarEl) {
    const avatarUrl = getAvatarUrl(primary.code)
    avatarEl.src = avatarUrl
    avatarEl.alt = `${primary.code} avatar`
    avatarEl.style.display = avatarUrl ? 'block' : 'none'
  }
  document.getElementById('result-name').textContent = primary.cn

  // 匹配度
  document.getElementById('result-badge').textContent =
    `匹配度 ${primary.similarity}%` + (primary.exact != null ? ` · 精准命中 ${primary.exact}/15 维` : '')

  // Intro & 描述
  document.getElementById('result-intro').textContent = primary.intro || ''
  document.getElementById('result-desc').textContent = primary.desc || ''

  // 发疯指数
  const levelEl = document.getElementById('result-level')
  if (levelEl) {
    const lv = primary.level
    if (lv != null && lv >= 0) {
      const stars = '⭐'.repeat(Math.min(lv, 5))
      levelEl.textContent = `发疯指数 ${stars}` + (lv === 0 ? ' ❓（未知）' : '')
    } else {
      levelEl.textContent = ''
    }
  }

  // 标签
  const tagsEl = document.getElementById('result-tags')
  if (tagsEl && primary.tags) {
    tagsEl.innerHTML = primary.tags.map((t) => `<span class="tag">${t}</span>`).join('')
  }

  // 次要匹配
  const secEl = document.getElementById('result-secondary')
  if (secondary && (mode === 'loop404' || mode === 'gone' || mode === 'null')) {
    secEl.style.display = ''
    document.getElementById('secondary-info').textContent =
      `最佳常规匹配：${secondary.code}（${secondary.cn}）· 匹配度 ${secondary.similarity}%`
  } else if (secondary && mode === 'normal') {
    secEl.style.display = ''
    document.getElementById('secondary-info').textContent =
      `次选匹配：${secondary.code}（${secondary.cn}）· 匹配度 ${secondary.similarity}%`
  } else {
    secEl.style.display = 'none'
  }

  // 雷达图
  const canvas = document.getElementById('radar-chart')
  drawRadar(canvas, userLevels, dimOrder, dimDefs)

  // 维度详情
  const detailEl = document.getElementById('dimensions-detail')
  detailEl.innerHTML = ''
  for (const dim of dimOrder) {
    const level = userLevels[dim] || 'M'
    const def = dimDefs[dim]
    if (!def) continue

    const row = document.createElement('div')
    row.className = 'dim-row'
    row.style.animationDelay = `${0.04 * detailEl.children.length}s`
    row.innerHTML = `
      <div class="dim-header">
        <span class="dim-name">${def.name}</span>
        <span class="dim-level ${LEVEL_CLASS[level]}">${LEVEL_LABEL[level]}</span>
      </div>
      <div class="dim-desc">${def.levels[level]}</div>
    `
    detailEl.appendChild(row)
  }

  // TOP 5
  const topEl = document.getElementById('top-list')
  topEl.innerHTML = ''
  const top5 = rankings.slice(0, 5)
  top5.forEach((t, i) => {
    const item = document.createElement('div')
    item.className = 'top-item'
    item.style.animationDelay = `${0.05 * i}s`
    item.innerHTML = `
      <span class="top-rank">#${i + 1}</span>
      <span class="top-code">${t.code}</span>
      <span class="top-name">${t.cn}</span>
      <span class="top-sim">${t.similarity}%</span>
    `
    topEl.appendChild(item)
  })

  // 免责声明
  document.getElementById('disclaimer').textContent =
    mode === 'normal' ? config.display.funNote : config.display.funNoteSpecial

  // 下载分享图
  document.getElementById('btn-download').onclick = () => {
    generateShareImage(primary, userLevels, dimOrder, dimDefs, mode, config)
  }

}
