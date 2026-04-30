import { shuffle } from './utils.js'

/**
 * FFTI 答题控制器
 * @param {Array}   questions      { main: [...], hidden: [...] }
 * @param {Object}  config         评分配置
 * @param {Function} onComplete    (answers, hiddenAnswers) => void
 * @param {Function} checkTriggers (scores, levels, dimOrder) => string[] — 返回需触发的隐藏题ID
 * @param {Array}   dimOrder       维度顺序
 * @param {Object}  thresholds     等级阈值
 */
export function createQuiz(questions, config, onComplete, checkTriggers, dimOrder, thresholds, questionCounts = {}) {
  let queue = shuffle([...questions.main])
  let current = 0
  let answers = {}
  let hiddenAnswers = {}

  const els = {
    fill: document.getElementById('progress-fill'),
    text: document.getElementById('progress-text'),
    qText: document.getElementById('question-text'),
    qNum: document.getElementById('question-number'),
    options: document.getElementById('options'),
    nav: document.getElementById('quiz-nav'),
  }

  function updateProgress() {
    const pct = (current / queue.length) * 100
    els.fill.style.width = pct + '%'
    els.text.textContent = `${current} / ${queue.length}`
  }

  function renderQuestion() {
    const q = queue[current]
    const isHidden = q.id.startsWith('qh')
    if (els.qNum) els.qNum.textContent = isHidden ? '隐藏题' : `第 ${current + 1} 题`
    els.qText.textContent = q.text
    els.options.innerHTML = ''
    const savedVal = isHidden ? hiddenAnswers[q.id] : answers[q.id]
    q.options.forEach((opt) => {
      const btn = document.createElement('button'); btn.type = 'button'
      btn.className = 'btn btn-option'
      btn.textContent = opt.label
      if (savedVal != null && opt.value === savedVal) btn.classList.add('selected')
      btn.addEventListener('click', () => { btn.blur(); btn.classList.add('pressing'); setTimeout(() => selectOption(q, opt), 180) })
      els.options.appendChild(btn)
    })
    updateProgress()
    renderNav()
  }

  function renderNav() {
    if (!els.nav) return
    const mainCount = queue.filter(q => !q.id.startsWith('qh')).length
    let html = ''
    for (let i = 0; i < mainCount; i++) {
      const answered = answers[queue[i].id] != null
      const cls = i === current ? 'qdot active' : answered ? 'qdot answered' : 'qdot'
      html += `<button type="button" class="${cls}" data-idx="${i}">${i + 1}</button>`
    }
    const backHtml = current > 0 ? '<button type="button" class="btn btn-nav-back" id="btn-back">← 上一题</button>' : ''
    els.nav.innerHTML = `<div class="nav-dots">${html}</div>${backHtml}`
    els.nav.querySelectorAll('.qdot').forEach(dot => {
      dot.addEventListener('click', () => goTo(Number(dot.dataset.idx)))
    })
    const backBtn = els.nav.querySelector('#btn-back')
    if (backBtn) backBtn.addEventListener('click', goBack)
  }

  function goTo(idx) {
    if (idx < 0 || idx >= queue.length || idx === current) return
    current = idx
    renderQuestion()
  }

  function goBack() {
    if (current > 0) goTo(current - 1)
  }

  function selectOption(question, option) {
    if (question.id.startsWith('qh')) {
      hiddenAnswers[question.id] = option.value
    } else {
      answers[question.id] = option.value
    }

    current++

    if (current >= queue.length) {
      // 当前队列答完，检查是否需要插入隐藏题
      const allA = { ...answers, ...hiddenAnswers }
      const scores = calcScoresLocal(allA, questions.main)
      const levels = calcLevelsLocal(scores, thresholds, questionCounts)
      const hiddenIds = checkTriggers(scores, levels, dimOrder)

      const newHidden = hiddenIds
        .filter((id) => !queue.some((q) => q.id === id))
        .map((id) => questions.hidden.find((q) => q.id === id))
        .filter(Boolean)

      if (newHidden.length > 0) {
        queue = [...queue, ...newHidden]
        renderQuestion()
        return
      }

      onComplete(answers, hiddenAnswers)
    } else {
      renderQuestion()
    }
  }

  function start() {
    current = 0
    answers = {}
    hiddenAnswers = {}
    queue = shuffle([...questions.main])
    renderQuestion()
  }

  return { start }
}

// 本地分值计算（避免循环依赖 engine.js）
function calcScoresLocal(answers, questions) {
  const scores = {}
  for (const q of questions) {
    if (answers[q.id] == null) continue
    scores[q.dim] = (scores[q.dim] || 0) + answers[q.id]
  }
  return scores
}

function calcLevelsLocal(scores, thresholds, questionCounts) {
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
