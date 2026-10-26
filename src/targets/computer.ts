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
  ctx.fillStyle = '#d8d2c4' // 본체와 같은 베이지
  roundRect(ctx, r, 9)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'
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

    // 부술수록 에러 창이 계속 쌓임
    const errors = Math.floor(damage * 9)
    for (let i = 0; i < errors; i++) {
      const e = { x: s.x + 8 + i * 13, y: s.y + 6 + i * 9, w: 92, h: 40 }
      ctx.fillStyle = '#f2f2f2'
      ctx.fillRect(e.x, e.y, e.w, e.h)
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'
      ctx.lineWidth = 1
      ctx.strokeRect(e.x, e.y, e.w, e.h)
      ctx.fillStyle = '#c0392b'
      ctx.fillRect(e.x, e.y, e.w, 10)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 7px sans-serif'
      ctx.fillText('오류', e.x + 3, e.y + 7.5)
      ctx.fillStyle = '#c0392b'
      ctx.beginPath()
      ctx.arc(e.x + 12, e.y + 25, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 9px sans-serif'
      ctx.fillText('!', e.x + 10.5, e.y + 28.5)
      ctx.fillStyle = '#222'
      ctx.font = '7px sans-serif'
      ctx.fillText(['알 수 없는 오류', '메모리 부족', '그냥 안 됨'][i % 3], e.x + 22, e.y + 28)
    }

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
  ctx.fillStyle = '#c9c2b2'
  ctx.fillRect(r.x + r.w / 2 - 14, r.y, 28, r.h - 10) // 목
  roundRect(ctx, { x: r.x, y: r.y + r.h - 12, w: r.w, h: 12 }, 5) // 받침
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
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
  ctx.fillStyle = '#d8d2c4'
  roundRect(ctx, r, 5)
  ctx.fill()

  // 키캡 — 때린 자리 근처 키는 바로 빠지고(구멍), 망가질수록 다른 키도 랜덤으로 빠짐
  const hits = part.marks.filter((m) => m.kind === 'dent')
  const rnd = seeded(7)
  const cols = 14
  const rows = 3
  const kw = (r.w - 12) / cols
  const kh = (r.h - 8) / rows
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = r.x + 6 + col * kw
      const y = r.y + 4 + row * kh
      const cx = x + kw / 2
      const cy = y + kh / 2
      const hitNear = hits.some((m) => Math.abs(m.x - cx) < kw * 0.9 + m.r * 0.3 && Math.abs(m.y - cy) < kh * 1.2)
      const missing = rnd() < damage * 0.9 || hitNear
      ctx.fillStyle = missing ? '#2a2620' : '#ece7dc'
      ctx.fillRect(x + 0.8, y + 0.8, kw - 1.6, kh - 1.6)
    }
  }
}

// 포스트잇: 색 네모 + 손글씨. 탈수록 누렇게 → 까맣게
function drawPostit(color: string, lines: string[], angle: number) {
  return (ctx: CanvasRenderingContext2D, part: Part, damage: number) => {
    const r = part.rect
    ctx.save()
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2)
    ctx.rotate(angle)
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.fillRect(-r.w / 2 + 2, -r.h / 2 + 2, r.w, r.h)
    ctx.fillStyle = color
    ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h)
    ctx.fillStyle = 'rgba(0,0,0,0.08)' // 위쪽 끈끈이 부분
    ctx.fillRect(-r.w / 2, -r.h / 2, r.w, 5)
    ctx.fillStyle = '#2b2b2b'
    ctx.font = 'bold 7px sans-serif'
    ctx.textAlign = 'center'
    lines.forEach((text, i) => ctx.fillText(text, 0, -2 + i * 9 - (lines.length - 1) * 3))
    if (damage > 0) {
      ctx.fillStyle = `rgba(60, 35, 10, ${damage * 0.6})`
      ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h)
    }
    ctx.restore()
    ctx.textAlign = 'start'
  }
}

// 커피잔: 흰 머그 + 빨간 띠 + 모락모락 김
function drawMug(ctx: CanvasRenderingContext2D, part: Part, _damage: number, time: number) {
  const r = part.rect
  const body = { x: r.x, y: r.y + 6, w: r.w - 8, h: r.h - 6 }
  // 김
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 1.6
  for (let i = 0; i < 2; i++) {
    const bx = body.x + 6 + i * 8
    ctx.beginPath()
    for (let k = 0; k <= 10; k++) {
      const y = body.y - 2 - k * 2.2
      const x = bx + Math.sin(time / 250 + k * 0.7 + i) * 2.2
      if (k === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  // 손잡이
  ctx.strokeStyle = '#efece6'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(body.x + body.w, body.y + body.h / 2, 5, -Math.PI / 2, Math.PI / 2)
  ctx.stroke()
  // 몸통
  ctx.fillStyle = '#efece6'
  ctx.beginPath()
  ctx.roundRect(body.x, body.y, body.w, body.h, [2, 2, 5, 5])
  ctx.fill()
  ctx.fillStyle = '#d6332a'
  ctx.fillRect(body.x, body.y + body.h * 0.45, body.w, 4)
  // 커피 윗면
  ctx.fillStyle = '#5a3418'
  ctx.beginPath()
  ctx.ellipse(body.x + body.w / 2, body.y + 1.5, body.w / 2 - 1, 2.5, 0, 0, Math.PI * 2)
  ctx.fill()
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
        debrisColors: ['#d8d2c4', '#c9c2b2'],
        materialAt: () => 'plastic',
        draw: drawStand,
      }),
      make({
        id: 'monitor',
        name: '모니터',
        rect: monitorRect,
        maxHp: 130,
        debrisColors: ['#d8d2c4', '#b9b1a0', '#9fd3ff', '#cfe9ff', '#5a7bd8'],
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
        maxHp: 45,
        debrisColors: ['#d8d2c4', '#ece7dc', '#b9b1a0'],
        materialAt: () => 'plastic',
        draw: drawKeyboard,
      }),

      // ─── 소품 (보너스): 파괴율에는 안 들어감 ───
      make({
        id: 'mug',
        name: '커피잔',
        rect: { x: 36, y: g - 22, w: 28, h: 34 },
        maxHp: 5, // 망치 한 방에 깨지게
        bonus: true,
        debrisColors: ['#efece6', '#d6332a', '#ffffff'],
        materialAt: () => 'ceramic',
        // 깨지면 커피가 쏟아져서 책상에 얼룩
        onDestroy: (fx) => {
          fx.splash({ x: 48, y: g - 8 }, '#5a3418', 26)
          fx.stain(54, g + 13, 30, 5, 'rgba(70, 38, 14, 0.75)')
          fx.stain(30, g + 9, 12, 3, 'rgba(70, 38, 14, 0.6)')
        },
        draw: drawMug,
      }),
      make({
        id: 'postit-meeting',
        name: '포스트잇',
        rect: { x: 226, y: g - 244, w: 30, h: 30 },
        maxHp: 6,
        bonus: true,
        attachedTo: 'monitor',
        debrisColors: ['#ffe066', '#f5d142'],
        materialAt: () => 'paper',
        draw: drawPostit('#ffe066', ['회의', '3시!!'], 0.12),
      }),
      make({
        id: 'postit-report',
        name: '포스트잇',
        rect: { x: 30, y: g - 112, w: 30, h: 30 },
        maxHp: 6,
        bonus: true,
        attachedTo: 'monitor',
        debrisColors: ['#ff9ec7', '#f07aa8'],
        materialAt: () => 'paper',
        draw: drawPostit('#ff9ec7', ['보고서', '수정 v7'], -0.1),
      }),
      make({
        id: 'postit-tower',
        name: '포스트잇',
        rect: { x: 300, y: g - 152, w: 30, h: 30 },
        maxHp: 6,
        bonus: true,
        attachedTo: 'tower',
        debrisColors: ['#9be59b', '#7cd17c'],
        materialAt: () => 'paper',
        draw: drawPostit('#9be59b', ['퇴근', '언제?'], 0.08),
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

  // 파편은 책상에 쌓이지 않고 바닥까지 떨어짐 (책상에 쌓이면 키보드가 가려짐)
  surfaces: ({ W, floorY }) => [{ x: 0, y: floorY, w: W, h: 400 }],
}
