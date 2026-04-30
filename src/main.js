import { calcDimensionScores, countQuestionsByDimension, scoresToLevels, checkHiddenTriggers, determineResult } from './engine.js'
import { createQuiz } from './quiz.js'
import { renderResult } from './result.js'
import './style.css'

async function loadJSON(path) {
  const res = await fetch(path)
  return res.json()
}

async function init() {
  const [questions, dimensions, types, config] = await Promise.all([
    loadJSON(new URL('../data/questions.json', import.meta.url).href),
    loadJSON(new URL('../data/dimensions.json', import.meta.url).href),
    loadJSON(new URL('../data/types.json', import.meta.url).href),
    loadJSON(new URL('../data/config.json', import.meta.url).href),
  ])

  const { order: dimOrder, definitions: dimDefs } = dimensions
  const { standard: standardTypes, special: specialTypes } = types
  const thresholds = config.scoring.levelThresholds
  const questionCounts = countQuestionsByDimension(questions.main)
  const introModelCopy = {
    E: '情绪怎么炸',
    R: '内耗怎么转',
    D: '发言怎么拐',
    S: '日常怎么活',
    X: '人格怎么切',
  }

  const pages = {
    intro: document.getElementById('page-intro'),
    quiz: document.getElementById('page-quiz'),
    result: document.getElementById('page-result'),
  }

  function showPage(name) {
    Object.values(pages).forEach((p) => p.classList.remove('active'))
    pages[name].classList.add('active')
    window.scrollTo(0, 0)
  }

  function renderIntroOverview() {
    const summaryEl = document.getElementById('intro-summary')
    const modelsEl = document.getElementById('intro-models')
    if (summaryEl) {
      summaryEl.textContent = `${dimOrder.length} 维画像 · ${questions.main.length} 道主问题 · ${questions.hidden.length} 个隐藏结果`
    }
    if (modelsEl) {
      modelsEl.innerHTML = Object.entries(dimensions.models).map(([key, model]) => `
        <span class="intro-model-chip">
          <span class="intro-chip-code">${key}</span>
          <span class="intro-chip-text">${model.cn.replace('模型', '')} · ${introModelCopy[key] || model.desc}</span>
        </span>
      `).join('')
    }
  }

  function onQuizComplete(answers, hiddenAnswers) {
    const allAnswers = { ...answers, ...hiddenAnswers }
    const scores = calcDimensionScores(allAnswers, questions.main)
    const levels = scoresToLevels(scores, thresholds, questionCounts)
    const result = determineResult(levels, dimOrder, standardTypes, specialTypes, {
      hiddenAnswers,
      levels,
      fallbackThreshold: config.scoring.fallbackThreshold,
    })
    renderResult(result, levels, dimOrder, dimDefs, config)
    showPage('result')
  }

  const quiz = createQuiz(questions, config, onQuizComplete, checkHiddenTriggers, dimOrder, thresholds, questionCounts)
  renderIntroOverview()

  // unified touch feedback — all buttons
  document.addEventListener('touchstart', (e) => {
    const btn = e.target.closest('.btn')
    if (btn) btn.classList.add('pressing')
  }, { passive: true })
  document.addEventListener('touchend', () => {
    document.querySelectorAll('.btn.pressing').forEach(b => b.classList.remove('pressing'))
  })

  // start/restart need extra hold before page transition kills the button
  const btnStart = document.getElementById('btn-start')
  btnStart.addEventListener('click', () => {
    btnStart.classList.add('pressing')
    quiz.start()
    setTimeout(() => { btnStart.classList.remove('pressing'); showPage('quiz') }, 150)
  })

  const btnRestart = document.getElementById('btn-restart')
  btnRestart.addEventListener('click', () => {
    btnRestart.classList.add('pressing')
    quiz.start()
    setTimeout(() => { btnRestart.classList.remove('pressing'); showPage('quiz') }, 150)
  })

  const btnHome = document.getElementById('btn-home')
  btnHome.addEventListener('click', () => {
    btnHome.classList.add('pressing')
    setTimeout(() => { btnHome.classList.remove('pressing'); showPage('intro') }, 150)
  })
}

init()
