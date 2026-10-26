import './style.css'
import { unlockAudio } from './audio'
import { Game } from './game'
import { computer } from './targets/computer'
import type { ToolId } from './types'

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
      resultText.innerHTML = `<b>${stats.seconds.toFixed(1)}초</b> 만에 컴퓨터를 박살냈어요<br />총 <b>${stats.hits}번</b> 때렸어요. 속이 좀 시원해졌나요?`
      resultScreen.classList.remove('hidden')
    }, 1400)
  }
})

function play() {
  unlockAudio() // 아이폰: 버튼 터치 안에서 소리 켜기
  resultShown = false
  startScreen.classList.add('hidden')
  resultScreen.classList.add('hidden')
  game.start()
}

$('#start-btn').addEventListener('click', play)
$('#again-btn').addEventListener('click', play)

// 도구 선택
const toolButtons = document.querySelectorAll<HTMLButtonElement>('#tools button')
toolButtons.forEach((button) =>
  button.addEventListener('click', () => {
    toolButtons.forEach((b) => b.classList.toggle('active', b === button))
    game.setTool(button.dataset.tool as ToolId)
  }),
)
