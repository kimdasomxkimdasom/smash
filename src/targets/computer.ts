import { seeded } from '../random'
import type { Layout, Part, Point, Rect, Target } from '../types'

const inside = (p: Point, r: Rect) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h

function roundRect(ctx: CanvasRenderingContext2D, r: Rect, radius: number) {
  ctx.beginPath()
  ctx.roundRect(r.x, r.y, r.w, r.h, radius)
}

// 모니터 안쪽 화면 영역
const screenOf = (r: Rect): Rect => ({ x: r.x + 10, y: r.y + 10, w: r.w - 20, h: r.h - 30 })

function drawMonitor(ctx: CanvasRenderingContext2D, part: Part, damage: number, time: number) {
  const r = part.rect
  const s = screenOf(r)

  // 테두리
  ctx.fillStyle = '#2a2c33'
  roundRect(ctx, r, 9)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 2
  ctx.stroke()

  // 화면: 멀쩡 → 지지직 → 꺼짐
  if (damage < 0.65) {
    const g = ctx.createLinearGradient(s.x, s.y, s.x + s.w, s.y + s.h)
    g.addColorStop(0, '#2b6cb0')
    g.addColorStop(1, '#7b4fd8')
    ctx.fillStyle = g
    ctx.fillRect(s.x, s.y, s.w, s.h)

    // 바탕화면 아이콘 + 작업 표시줄
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    for (let i = 0; i < 3; i++) ctx.fillRect(s.x + 10, s.y + 10 + i * 24, 14, 14)
    ctx.fillStyle = 'rgba(15, 20, 40, 0.75)'
    ctx.fillRect(s.x, s.y + s.h - 12, s.w, 12)

    // 응답 없음 창 (스트레스의 원인)
    const d = { x: s.x + s.w * 0.22, y: s.y + s.h * 0.22, w: s.w * 0.6, h: s.h * 0.48 }
    ctx.fillStyle = '#f2f2f2'
    ctx.fillRect(d.x, d.y, d.w, d.h)
    ctx.fillStyle = '#2d5bd1'
    ctx.fillRect(d.x, d.y, d.w, 13)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 8px sans-serif'
    ctx.fillText('업무용 프로그램.exe', d.x + 4, d.y + 9.5)
    ctx.fillStyle = '#222'
    ctx.font = 'bold 9px sans-serif'
    ctx.fillText('(응답 없음)', d.x + 8, d.y + 30)
    ctx.font = '7.5px sans-serif'
    ctx.fillText('저장하지 않은 작업이', d.x + 8, d.y + 44)
    ctx.fillText('모두 사라집니다 :)', d.x + 8, d.y + 54)
    // 돌아가는 로딩
    ctx.strokeStyle = '#2d5bd1'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    const cx = d.x + d.w - 18
    const cy = d.y + 38
    ctx.arc(cx, cy, 7, time / 150, time / 150 + Math.PI * 1.4)
    ctx.stroke()

    // 지지직: 색 띠가 무작위로 번쩍
    if (damage > 0.3) {
      const rnd = seeded(Math.floor(time / 90))
      const bars = Math.round(damage * 14)
      for (let i = 0; i < bars; i++) {
        ctx.fillStyle = ['#ff2d55', '#00e5ff', '#76ff03', '#fff', '#000'][Math.floor(rnd() * 5)]
        ctx.globalAlpha = 0.5 + rnd() * 0.5
        ctx.fillRect(s.x, s.y + rnd() * s.h, s.w, 1 + rnd() * 5)
      }
      ctx.globalAlpha = 1
    }
  } else {
    ctx.fillStyle = '#07080a'
    ctx.fillRect(s.x, s.y, s.w, s.h)
    // 가끔 세로줄 번쩍
    if (Math.floor(time / 400) % 3 === 0) {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.5)'
      ctx.fillRect(s.x + s.w * 0.63, s.y, 1.5, s.h)
    }
  }

  // 전원 LED: 초록 → 주황 → 꺼짐
  ctx.fillStyle = damage < 0.4 ? '#3ddc84' : damage < 0.8 ? '#ff9f1a' : '#3a3a3a'
  ctx.beginPath()
  ctx.arc(r.x + r.w / 2, r.y + r.h - 10, 2.5, 0, Math.PI * 2)
  ctx.fill()
}

function drawStand(ctx: CanvasRenderingContext2D, part: Part) {
  const r = part.rect
  ctx.fillStyle = '#3a3d45'
  ctx.fillRect(r.x + r.w / 2 - 14, r.y, 28, r.h - 10) // 목
  roundRect(ctx, { x: r.x, y: r.y + r.h - 12, w: r.w, h: 12 }, 5) // 받침
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  ctx.fillRect(r.x + r.w / 2 - 14, r.y, 5, r.h - 10)
}

function drawTower(ctx: CanvasRenderingContext2D, part: Part, damage: number, time: number) {
  const r = part.rect
  ctx.fillStyle = '#d8d2c4'
  roundRect(ctx, r, 6)
  ctx.fill()
  // 옆면 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  ctx.fillRect(r.x + r.w - 12, r.y + 4, 8, r.h - 8)

  // 드라이브 칸
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 2; i++) {
    ctx.strokeRect(r.x + 10, r.y + 16 + i * 22, r.w - 30, 16)
  }
  ctx.fillStyle = '#444'
  ctx.fillRect(r.x + 18, r.y + 30, r.w - 46, 2.5) // CD 투입구

  // 전원 버튼 + LED (멀쩡하면 깜빡이는 초록, 망가지면 빨강)
  ctx.fillStyle = '#b9b1a0'
  ctx.beginPath()
  ctx.arc(r.x + (r.w - 12) / 2, r.y + 90, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.stroke()
  const blink = Math.floor(time / (damage > 0.5 ? 120 : 600)) % 2 === 0
  ctx.fillStyle = damage > 0.5 ? (blink ? '#ff3b30' : '#5a1a16') : blink ? '#3ddc84' : '#1e5c3a'
  ctx.beginPath()
  ctx.arc(r.x + (r.w - 12) / 2, r.y + 108, 2.5, 0, Math.PI * 2)
  ctx.fill()

  // 통풍구
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  for (let i = 0; i < 6; i++) ctx.fillRect(r.x + 14, r.y + r.h - 60 + i * 8, r.w - 38, 3)
}

function drawKeyboard(ctx: CanvasRenderingContext2D, part: Part, damage: number) {
  const r = part.rect
  ctx.fillStyle = '#2f3239'
  roundRect(ctx, r, 5)
  ctx.fill()

  // 키캡 — 망가질수록 빠진 키(구멍)가 늘어남
  const rnd = seeded(7)
  const cols = 14
  const rows = 3
  const kw = (r.w - 12) / cols
  const kh = (r.h - 8) / rows
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = r.x + 6 + col * kw
      const y = r.y + 4 + row * kh
      const missing = rnd() < damage * 0.9
      ctx.fillStyle = missing ? '#15171b' : '#4a4e57'
      ctx.fillRect(x + 0.8, y + 0.8, kw - 1.6, kh - 1.6)
    }
  }
}

export const computer: Target = {
  id: 'computer',
  name: '컴퓨터',

  createParts({ groundY: g }: Layout): Part[] {
    const make = (p: Omit<Part, 'hp' | 'destroyed' | 'marks'>): Part => ({ ...p, hp: p.maxHp, destroyed: false, marks: [] })
    const monitorRect = { x: 26, y: g - 236, w: 240, h: 164 }
    return [
      make({
        id: 'stand',
        name: '모니터 받침',
        rect: { x: 96, y: g - 74, w: 100, h: 86 },
        maxHp: 45,
        debrisColors: ['#3a3d45', '#25272d'],
        materialAt: () => 'plastic',
        draw: drawStand,
      }),
      make({
        id: 'monitor',
        name: '모니터',
        rect: monitorRect,
        maxHp: 130,
        debrisColors: ['#2a2c33', '#1d1f24', '#9fd3ff', '#cfe9ff', '#5a7bd8'],
        materialAt: (p) => (inside(p, screenOf(monitorRect)) ? 'glass' : 'plastic'),
        draw: drawMonitor,
      }),
      make({
        id: 'tower',
        name: '본체',
        rect: { x: 286, y: g - 194, w: 90, h: 210 },
        maxHp: 150,
        debrisColors: ['#d8d2c4', '#b9b1a0', '#2e7d4f', '#c9a227', '#555'],
        materialAt: () => 'plastic',
        draw: drawTower,
      }),
      make({
        id: 'keyboard',
        name: '키보드',
        rect: { x: 44, y: g + 16, w: 214, h: 22 },
        maxHp: 60,
        debrisColors: ['#2f3239', '#4a4e57', '#e8e8e8'],
        materialAt: () => 'plastic',
        draw: drawKeyboard,
      }),
    ]
  },

  drawBackground(ctx, { W, H, groundY: g, floorY }) {
    // 벽
    const wall = ctx.createLinearGradient(0, 0, 0, floorY)
    wall.addColorStop(0, '#2c3140')
    wall.addColorStop(1, '#3b4152')
    ctx.fillStyle = wall
    ctx.fillRect(0, 0, W, floorY)
    // 바닥
    ctx.fillStyle = '#23262f'
    ctx.fillRect(0, floorY, W, H - floorY)
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.fillRect(0, floorY, W, 3)

    // 벽 포스터 (마감 D-1)
    ctx.save()
    ctx.translate(318, g - 300)
    ctx.rotate(0.05)
    ctx.fillStyle = '#f4efe2'
    ctx.fillRect(-34, -26, 68, 52)
    ctx.fillStyle = '#e0412b'
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('마감', 0, -4)
    ctx.font = 'bold 19px sans-serif'
    ctx.fillText('D-1', 0, 18)
    ctx.restore()
    ctx.textAlign = 'start'

    // 책상: 윗면(원근) + 앞면 + 다리
    ctx.fillStyle = '#8a6a4a'
    ctx.beginPath()
    ctx.moveTo(20, g)
    ctx.lineTo(380, g)
    ctx.lineTo(392, g + 44)
    ctx.lineTo(8, g + 44)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#6b5038'
    ctx.fillRect(8, g + 44, 384, 18)
    ctx.fillStyle = '#4e3a29'
    ctx.fillRect(22, g + 62, 14, floorY - g - 62)
    ctx.fillRect(364, g + 62, 14, floorY - g - 62)
  },

  surfaces: ({ W, groundY: g, floorY }) => [
    { x: 8, y: g + 40, w: 384, h: 22 }, // 책상 앞쪽 (파편이 쌓이는 곳)
    { x: 0, y: floorY, w: W, h: 400 },
  ],
}
