import { pick, seeded } from '../random'
import type { Layout, Part, Point, Rect, Target } from '../types'

const inside = (p: Point, r: Rect) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h

// 매판 차 색이 바뀜
const PAINTS = [
  { body: '#d6332a', dark: '#9e2019' },
  { body: '#2f6fd6', dark: '#1f4a94' },
  { body: '#f2c230', dark: '#b88c12' },
  { body: '#3aa66b', dark: '#25724a' },
  { body: '#e8e4dc', dark: '#a9a397' },
]

function shade(ctx: CanvasRenderingContext2D, damage: number, r: Rect) {
  // 망가질수록 칙칙하게
  if (damage <= 0.2) return
  ctx.fillStyle = `rgba(40, 30, 20, ${(damage - 0.2) * 0.35})`
  ctx.fillRect(r.x, r.y, r.w, r.h)
}

// 차는 화면 아래쪽 바닥에 놓이게 (컴퓨터는 책상 높이라 더 위)
const roadY = (l: Layout) => Math.min(l.floorY - 60, l.groundY + 90)

export const car: Target = {
  id: 'car',
  name: '자동차',

  createParts(layout: Layout): Part[] {
    const g = roadY(layout)
    const paint = pick(PAINTS)
    const make = (p: Omit<Part, 'hp' | 'destroyed' | 'marks'>): Part => ({ ...p, hp: p.maxHp, destroyed: false, marks: [] })
    const metal = [paint.body, paint.dark, '#8a8f99', '#c9ccd2']

    // 차체 아래쪽 (문, 범퍼까지)
    const bodyRect = { x: 24, y: g - 112, w: 352, h: 70 }
    // 지붕 + 창문
    const cabinRect = { x: 92, y: g - 172, w: 196, h: 62 }
    const windows: Rect[] = [
      { x: cabinRect.x + 22, y: cabinRect.y + 10, w: 72, h: 48 },
      { x: cabinRect.x + 102, y: cabinRect.y + 10, w: 72, h: 48 },
    ]

    const wheel = (id: string, name: string, cx: number): Part =>
      make({
        id,
        name,
        rect: { x: cx - 36, y: g - 72, w: 72, h: 72 },
        maxHp: 70,
        debrisColors: ['#1b1b1d', '#2a2a2d', '#b8bcc4'],
        materialAt: (p) => (Math.hypot(p.x - cx, p.y - (g - 36)) < 18 ? 'metal' : 'rubber'),
        draw: (ctx, part, damage) => {
          const cy = g - 36
          // 타이어: 망가지면 바람 빠져서 아래가 납작
          const flat = damage > 0.5 ? (damage - 0.5) * 16 : 0
          ctx.fillStyle = '#1b1b1d'
          ctx.beginPath()
          ctx.ellipse(cx, cy + flat / 2, 34 + flat / 2, 34 - flat / 2, 0, 0, Math.PI * 2)
          ctx.fill()
          // 휠
          ctx.fillStyle = '#b8bcc4'
          ctx.beginPath()
          ctx.arc(cx, cy, 18, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#7d828c'
          ctx.lineWidth = 3
          const missing = Math.floor(damage * 5)
          for (let i = missing; i < 5; i++) {
            const a = (Math.PI * 2 * i) / 5
            ctx.beginPath()
            ctx.moveTo(cx, cy)
            ctx.lineTo(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16)
            ctx.stroke()
          }
          ctx.fillStyle = '#5a5f69'
          ctx.beginPath()
          ctx.arc(cx, cy, 4, 0, Math.PI * 2)
          ctx.fill()
          void part
        },
      })

    return [
      make({
        id: 'cabin',
        name: '창문',
        rect: cabinRect,
        maxHp: 100,
        attachedTo: 'body',
        debrisColors: metal,
        materialAt: (p) => (windows.some((w) => inside(p, w)) ? 'glass' : 'metal'),
        draw: (ctx, part, damage) => {
          const r = part.rect
          // 지붕 모양 (앞뒤로 기울어진)
          ctx.fillStyle = paint.body
          ctx.beginPath()
          ctx.moveTo(r.x, r.y + r.h)
          ctx.lineTo(r.x + 18, r.y + 4)
          ctx.quadraticCurveTo(r.x + 22, r.y, r.x + 34, r.y)
          ctx.lineTo(r.x + r.w - 40, r.y)
          ctx.quadraticCurveTo(r.x + r.w - 28, r.y, r.x + r.w - 22, r.y + 6)
          ctx.lineTo(r.x + r.w, r.y + r.h)
          ctx.closePath()
          ctx.fill()
          // 유리: 멀쩡하면 하늘빛 반사, 망가지면 산산조각 → 구멍
          for (const w of windows) {
            if (damage < 0.7) {
              const glass = ctx.createLinearGradient(w.x, w.y, w.x + w.w, w.y + w.h)
              glass.addColorStop(0, '#bfe4ff')
              glass.addColorStop(0.5, '#7fb7e0')
              glass.addColorStop(1, '#4d7fa8')
              ctx.fillStyle = glass
            } else {
              ctx.fillStyle = '#1c1f26'
            }
            ctx.beginPath()
            ctx.roundRect(w.x, w.y, w.w, w.h, 6)
            ctx.fill()
            if (damage < 0.7) {
              ctx.fillStyle = 'rgba(255,255,255,0.35)'
              ctx.beginPath()
              ctx.moveTo(w.x + 10, w.y + w.h)
              ctx.lineTo(w.x + 28, w.y)
              ctx.lineTo(w.x + 38, w.y)
              ctx.lineTo(w.x + 20, w.y + w.h)
              ctx.fill()
            } else {
              // 창틀에 남은 유리 조각
              const rnd = seeded(w.x)
              ctx.fillStyle = 'rgba(160, 200, 230, 0.7)'
              for (let i = 0; i < 4; i++) {
                const ex = w.x + rnd() * w.w
                ctx.beginPath()
                ctx.moveTo(ex - 8, w.y)
                ctx.lineTo(ex + 8, w.y)
                ctx.lineTo(ex + rnd() * 6 - 3, w.y + 6 + rnd() * 14)
                ctx.fill()
              }
            }
          }
          shade(ctx, damage, r)
        },
      }),
      make({
        id: 'body',
        name: '차체',
        rect: bodyRect,
        maxHp: 230,
        debrisColors: metal,
        materialAt: () => 'metal',
        draw: (ctx, part, damage, time) => {
          const r = part.rect
          ctx.fillStyle = paint.body
          ctx.beginPath()
          ctx.roundRect(r.x, r.y, r.w, r.h, [22, 26, 10, 10])
          ctx.fill()
          // 아래쪽 어두운 띠 + 바퀴 자리(펜더)
          ctx.fillStyle = paint.dark
          ctx.fillRect(r.x + 4, r.y + r.h - 16, r.w - 8, 12)
          ctx.fillStyle = '#20232a'
          for (const cx of [100, 300]) {
            ctx.beginPath()
            ctx.arc(cx, g - 36, 40, Math.PI, 0)
            ctx.fill()
          }
          // 문 선, 손잡이
          ctx.strokeStyle = 'rgba(0,0,0,0.3)'
          ctx.lineWidth = 1.5
          for (const x of [140, 200, 262]) {
            ctx.beginPath()
            ctx.moveTo(x, r.y + 4)
            ctx.lineTo(x, r.y + r.h - 18)
            ctx.stroke()
          }
          ctx.fillStyle = 'rgba(0,0,0,0.35)'
          ctx.fillRect(176, r.y + 14, 14, 4)
          ctx.fillRect(238, r.y + 14, 14, 4)
          // 범퍼
          ctx.fillStyle = '#8a8f99'
          ctx.fillRect(r.x - 4, r.y + r.h - 22, 14, 10)
          ctx.fillRect(r.x + r.w - 10, r.y + r.h - 22, 14, 10)
          // 녹 (망가질수록)
          const rnd = seeded(3)
          ctx.fillStyle = 'rgba(120, 60, 20, 0.55)'
          for (let i = 0; i < Math.floor(damage * 10); i++) {
            ctx.beginPath()
            ctx.arc(r.x + 20 + rnd() * (r.w - 40), r.y + 8 + rnd() * (r.h - 28), 3 + rnd() * 6, 0, Math.PI * 2)
            ctx.fill()
          }
          shade(ctx, damage, r)
          // 보닛에서 김 (많이 망가지면)
          if (damage > 0.6 && Math.floor(time / 300) % 2 === 0) {
            ctx.fillStyle = 'rgba(220,220,220,0.25)'
            ctx.beginPath()
            ctx.arc(r.x + r.w - 50, r.y - 6, 10, 0, Math.PI * 2)
            ctx.fill()
          }
        },
      }),
      wheel('wheel-rear', '뒷바퀴', 100),
      wheel('wheel-front', '앞바퀴', 300),
      make({
        id: 'headlight',
        name: '전조등',
        rect: { x: bodyRect.x + bodyRect.w - 30, y: bodyRect.y + 12, w: 26, h: 18 },
        maxHp: 22,
        attachedTo: 'body',
        debrisColors: ['#fff6c8', '#ffe27a', '#ffffff'],
        materialAt: () => 'glass',
        draw: (ctx, part, damage) => {
          const r = part.rect
          if (damage < 0.5) {
            // 켜진 불빛
            const cx = r.x + r.w
            const cy = r.y + r.h / 2
            const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60)
            glow.addColorStop(0, 'rgba(255, 240, 170, 0.45)')
            glow.addColorStop(1, 'rgba(255, 240, 170, 0)')
            ctx.fillStyle = glow
            ctx.beginPath()
            ctx.arc(cx, cy, 60, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.fillStyle = damage < 0.5 ? '#fff6c8' : '#5c5a4e'
          ctx.beginPath()
          ctx.roundRect(r.x, r.y, r.w, r.h, [4, 9, 9, 4])
          ctx.fill()
        },
      }),
      make({
        id: 'taillight',
        name: '후미등',
        rect: { x: bodyRect.x + 2, y: bodyRect.y + 12, w: 18, h: 18 },
        maxHp: 22,
        attachedTo: 'body',
        debrisColors: ['#ff3b30', '#b3241c'],
        materialAt: () => 'glass',
        draw: (ctx, part, damage) => {
          const r = part.rect
          ctx.fillStyle = damage < 0.5 ? '#ff3b30' : '#5a1a16'
          ctx.beginPath()
          ctx.roundRect(r.x, r.y, r.w, r.h, [9, 4, 4, 9])
          ctx.fill()
        },
      }),
    ]
  },

  // 해 질 녘 폐차장
  drawBackground(ctx, layout) {
    const { W, H } = layout
    const g = roadY(layout)
    const sky = ctx.createLinearGradient(0, 0, 0, g)
    sky.addColorStop(0, '#2b2d55')
    sky.addColorStop(0.6, '#b2577a')
    sky.addColorStop(1, '#f2a65a')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, g)

    // 멀리 쌓인 폐차 더미 (실루엣)
    ctx.fillStyle = '#4a3550'
    ctx.beginPath()
    ctx.moveTo(0, g - 120)
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, g - 120 - ((x * 37) % 50))
    ctx.lineTo(W, g)
    ctx.lineTo(0, g)
    ctx.fill()

    // 철조망 울타리
    ctx.strokeStyle = 'rgba(30, 25, 40, 0.5)'
    ctx.lineWidth = 1
    for (let x = -60; x < W + 60; x += 14) {
      ctx.beginPath()
      ctx.moveTo(x, g - 90)
      ctx.lineTo(x + 60, g)
      ctx.moveTo(x + 60, g - 90)
      ctx.lineTo(x, g)
      ctx.stroke()
    }
    ctx.fillStyle = '#2a2233'
    ctx.fillRect(0, g - 92, W, 3)

    // 간판
    ctx.save()
    ctx.translate(70, g - 250)
    ctx.rotate(-0.04)
    ctx.fillStyle = '#f4efe2'
    ctx.fillRect(-48, -18, 96, 36)
    ctx.fillStyle = '#1b1d24'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('폐차장', 0, 7)
    ctx.restore()
    ctx.textAlign = 'start'

    // 바닥 (흙바닥)
    ctx.fillStyle = '#5b4b3c'
    ctx.fillRect(0, g, W, H - g)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.beginPath()
    ctx.ellipse(200, g + 4, 180, 8, 0, 0, Math.PI * 2)
    ctx.fill()
  },

  surfaces: (layout) => [{ x: 0, y: roadY(layout), w: layout.W, h: 400 }],
}
