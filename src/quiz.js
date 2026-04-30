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

  function countAnswered() {
    const mainIds = questions.main.map(q => q.id)
    return mainIds.filter(id => answers[id] != null).length
  }

  function updateProgress() {
    const total = questions.main.length
    const answered = countAnswered()
    els.fill.style.width = (answered / total) * 100 + '%'
    els.text.textContent = `已答 ${answered} / ${total}`
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
      btn.addEventListener('click', () => selectOption(q, opt))
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
      const isCurrent = i === current
      const clickable = isCurrent || answered
      const cls = isCurrent ? 'qdot active' : answered ? 'qdot answered' : 'qdot disabled'
      html += `<button type="button" class="${cls}" data-idx="${i}"${clickable ? '' : ' disabled'}>${i + 1}</button>`
    }
    const allDone = countAnswered() >= questions.main.length
    const doneHtml = allDone ? '<button type="button" class="btn btn-primary btn-nav-done" id="btn-done">完成测试 →</button>' : ''
    const backHtml = current > 0 ? '<button type="button" class="btn btn-nav-back" id="btn-back">← 上一题</button>' : ''
    els.nav.innerHTML = `<div class="nav-dots">${html}</div>${doneHtml}${backHtml}`
    els.nav.querySelectorAll('.qdot:not([disabled])').forEach(dot => {
      dot.addEventListener('click', () => goTo(Number(dot.dataset.idx)))
    })
    const backBtn = els.nav.querySelector('#btn-back')
    if (backBtn) backBtn.addEventListener('click', goBack)
    const doneBtn = els.nav.querySelector('#btn-done')
    if (doneBtn) doneBtn.addEventListener('click', () => checkAndShowComplete())
  }

  function goTo(idx) {
    if (idx < 0 || idx >= queue.length || idx === current) return
    current = idx
    renderQuestion()
  }

  function goBack() {
    if (current >= queue.length) {
      current = queue.length - 1
      renderQuestion()
    } else if (current > 0) {
      goTo(current - 1)
    }
  }

  function showComplete() {
    els.qNum.textContent = '全部完成'
    els.qText.textContent = '你已经答完了所有题目，准备好获取你的发疯人格了吗？'
    els.options.innerHTML = ''
    els.nav.innerHTML = ''
    const total = questions.main.length
    els.fill.style.width = '100%'
    els.text.textContent = `已答 ${total} / ${total}`
    const btnGet = document.createElement('button')
    btnGet.type = 'button'
    btnGet.className = 'btn btn-primary'
    btnGet.innerHTML = '<span>获取人格</span><span class="btn-arrow">→</span>'
    btnGet.addEventListener('click', () => {
      btnGet.blur(); btnGet.classList.add('pressing')
      setTimeout(() => onComplete(answers, hiddenAnswers), 180)
    })
    const btnBack = document.createElement('button')
    btnBack.type = 'button'
    btnBack.className = 'btn btn-outline'
    btnBack.textContent = '我再想想'
    btnBack.addEventListener('click', () => {
      btnBack.blur(); btnBack.classList.add('pressing')
      setTimeout(() => {
        const mainCount = queue.filter(q => !q.id.startsWith('qh')).length
        for (let i = mainCount - 1; i >= 0; i--) {
          if (answers[queue[i].id] != null) { current = i; break }
        }
        renderQuestion()
      }, 180)
    })
    const wrap = document.createElement('div')
    wrap.className = 'result-actions'
    wrap.appendChild(btnGet)
    wrap.appendChild(btnBack)
    els.options.appendChild(wrap)
  }

  function checkAndShowComplete() {
    if (countAnswered() < questions.main.length) return false
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
      current = queue.length - newHidden.length
      renderQuestion()
      return true
    }
    showComplete()
    return true
  }

  function selectOption(question, option) {
    if (question.id.startsWith('qh')) {
      hiddenAnswers[question.id] = option.value
    } else {
      answers[question.id] = option.value
    }

    current++

    if (current >= queue.length) {
      checkAndShowComplete()
    } else if (countAnswered() >= questions.main.length && !queue[current].id.startsWith('qh')) {
      showComplete()
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
