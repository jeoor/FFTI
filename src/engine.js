/**
 * FFTI 评分引擎 — 纯函数，无 DOM 依赖
 */

/**
 * 按维度求和：每维度 2 题，分值相加 (范围 2-6)
 */
export function calcDimensionScores(answers, questions) {
  const scores = {}
  for (const q of questions) {
    if (answers[q.id] == null) continue
    scores[q.dim] = (scores[q.dim] || 0) + answers[q.id]
  }
  return scores
}

export function countQuestionsByDimension(questions) {
  const counts = {}
  for (const q of questions) {
    counts[q.dim] = (counts[q.dim] || 0) + 1
  }
  return counts
}

/**
 * 原始分 → L/M/H 等级
 */
export function scoresToLevels(scores, thresholds, questionCounts = {}) {
  const levels = {}
  for (const [dim, score] of Object.entries(scores)) {
    const questionCount = questionCounts[dim] || 2
    const averageScore = score / questionCount
    const lowMax = thresholds.L[1] / 2
    const highMin = thresholds.H[0] / 2

    if (averageScore <= lowMax) levels[dim] = 'L'
    else if (averageScore >= highMin) levels[dim] = 'H'
    else levels[dim] = 'M'
  }
  return levels
}

const LEVEL_NUM = { L: 1, M: 2, H: 3 }

/**
 * 解析人格类型的 pattern 字符串
 * "HHH-HMH-MHH-HHH-MHM" → ['H','H','H','H','M','H','M','H','H','H','H','H','M','H','M']
 */
export function parsePattern(pattern) {
  return pattern.replace(/-/g, '').split('')
}

/**
 * 计算用户向量与类型 pattern 的曼哈顿距离
 */
export function matchType(userLevels, dimOrder, pattern) {
  const typeLevels = parsePattern(pattern)
  let distance = 0
  let exact = 0
  for (let i = 0; i < dimOrder.length; i++) {
    const userVal = LEVEL_NUM[userLevels[dimOrder[i]]] || 2
    const typeVal = LEVEL_NUM[typeLevels[i]] || 2
    const diff = Math.abs(userVal - typeVal)
    distance += diff
    if (diff === 0) exact++
  }
  const similarity = Math.max(0, Math.round((1 - distance / 30) * 100))
  return { distance, exact, similarity }
}

/**
 * 检测隐藏题触发条件
 * @returns {string[]} 需要展示的隐藏题 ID 列表
 */
export function checkHiddenTriggers(scores, levels, dimOrder) {
  const triggers = []

  // QH1: R1+R2+R3 均为 H
  const rAllH = levels.R1 === 'H' && levels.R2 === 'H' && levels.R3 === 'H'
  if (rAllH) triggers.push('qh1')

  // QH2: S1+S2+S3 均为 H 且 E1 为 H
  const sAllH = levels.S1 === 'H' && levels.S2 === 'H' && levels.S3 === 'H'
  const e1H = levels.E1 === 'H'
  if (sAllH && e1H) triggers.push('qh2')

  // QH3: 15维无明显高点（无维度分数>=5）
  const hasHigh = Object.values(levels).some((level) => level === 'H')
  if (!hasHigh) triggers.push('qh3')

  return triggers
}

/**
 * 匹配所有类型，应用特殊覆盖
 * @param {Object} options.hiddenAnswers — 隐藏题答案 { qh1: 3, ... }
 * @param {Object} options.levels — 维度等级
 */
export function determineResult(userLevels, dimOrder, standardTypes, specialTypes, options = {}) {
  const rankings = standardTypes.map((type) => ({
    ...type,
    ...matchType(userLevels, dimOrder, type.pattern),
  }))

  rankings.sort((a, b) => a.distance - b.distance || b.exact - a.exact || b.similarity - a.similarity)

  const best = rankings[0]
  const hiddenAnswers = options.hiddenAnswers || {}
  const levels = options.levels || {}
  const fallbackThreshold = options.fallbackThreshold ?? 61

  // LOOP404: QH1选C(3) 且 R1/R2/R3中至少2个为H
  const loop404 = specialTypes.find((t) => t.code === 'LOOP404')
  if (hiddenAnswers.qh1 === 3 && loop404) {
    const rHCount = [levels.R1, levels.R2, levels.R3].filter((l) => l === 'H').length
    if (rHCount >= 2) {
      return { primary: { ...loop404, similarity: 99, exact: 15 }, secondary: best, rankings, mode: 'loop404' }
    }
  }

  // GONE: QH2选C(3) 且 S1/S2至少一个为H
  const gone = specialTypes.find((t) => t.code === 'GONE')
  if (hiddenAnswers.qh2 === 3 && gone) {
    const sHCount = [levels.S1, levels.S2].filter((l) => l === 'H').length
    if (sHCount >= 1) {
      return { primary: { ...gone, similarity: 99, exact: 15 }, secondary: best, rankings, mode: 'gone' }
    }
  }

  // NULL: QH3选C(3) 且 最佳匹配相似度<55%
  const nullType = specialTypes.find((t) => t.code === 'NULL')
  if (hiddenAnswers.qh3 === 3 && nullType && best.similarity < fallbackThreshold) {
    return { primary: { ...nullType, similarity: best.similarity, exact: best.exact }, secondary: best, rankings, mode: 'null' }
  }

  return { primary: best, secondary: rankings[1] || null, rankings, mode: 'normal' }
}
