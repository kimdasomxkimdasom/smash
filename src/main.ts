import './style.css'
import { unlockAudio } from './audio'
import { Game } from './game'
import { car } from './targets/car'
import { computer } from './targets/computer'
import type { Target, ToolId } from './types'

const TARGETS: Record<string, Target> = { computer, car }

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!

const meter = $('#meter-fill')
const percent = $('#percent')
const timer = $('#timer')
const startScreen = $('#start')
const resultScreen = $('#result')
const resultText = $('#result-text')

let resultShown = false

const game = new Game($<HTMLCanvasElement>('#stage'), computer, (stats) => {
  meter.style.width = `${stats.percent}%`
  percent.textContent = `${stats.percent}%`
  timer.textContent = `${stats.seconds.toFixed(1)}s`

  // 다 부수면 파편이 좀 떨어진 뒤 결과 화면
  if (stats.finished && !resultShown) {
    resultShown = true
    setTimeout(() => {
      resultText.innerHTML = `<b>${stats.seconds.toFixed(1)}초</b> 만에 ${game.target.name}를 박살냈어요<br />총 <b>${stats.hits}번</b> 때렸어요. 속이 좀 시원해졌나요?`
      // 연타하던 손가락에 버튼이 바로 눌리지 않게 잠깐 잠금
      resultScreen.classList.add('locked')
      resultScreen.classList.remove('hidden')
      setTimeout(() => resultScreen.classList.remove('locked'), 900)
    }, 1400)
  }
})

function play(target: Target) {
  unlockAudio() // 아이폰: 버튼 터치 안에서 소리 켜기
  resultShown = false
  startScreen.classList.add('hidden')
  resultScreen.classList.add('hidden')
  game.start(target)
}

// 시작 화면: 부술 대상 고르기
document.querySelectorAll<HTMLButtonElement>('[data-target]').forEach((button) =>
  button.addEventListener('click', () => play(TARGETS[button.dataset.target!])),
)
$('#again-btn').addEventListener('click', () => play(game.target))
$('#home-btn').addEventListener('click', () => {
  resultScreen.classList.add('hidden')
  startScreen.classList.remove('hidden')
})

// 도구 선택
const toolButtons = document.querySelectorAll<HTMLButtonElement>('#tools button')
toolButtons.forEach((button) =>
  button.addEventListener('click', () => {
    toolButtons.forEach((b) => b.classList.toggle('active', b === button))
    game.setTool(button.dataset.tool as ToolId)
  }),
)
