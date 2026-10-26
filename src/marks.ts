import { rand } from './random'
import type { Mark, Part, Point } from './types'

// 때린 지점에서 사방으로 뻗는 금 (거미줄처럼 꺾이는 선 여러 개)
export function makeCrack(at: Point, size: number, color: string, width: number): Mark {
  const count = Math.round(rand(4, 7))
  const lines: Point[][] = []
  for (let i = 0; i < count; i++) {
    let angle = (Math.PI * 2 * i) / count + rand(-0.4, 0.4)
    let { x, y } = at
    const line = [{ x, y }]
    const segments = Math.round(rand(2, 4))
    for (let s = 0; s < segments; s++) {
      const len = (size / segments) * rand(0.6, 1.3)
      angle += rand(-0.5, 0.5)
      x += Math.cos(angle) * len
      y += Math.sin(angle) * len
      line.push({ x, y })
    }
    lines.push(line)
  }
  // 바깥쪽 고리 금 (유리처럼)
  if (size > 24) {
    const ring: Point[] = []
    const r = size * rand(0.35, 0.5)
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 5) {
      ring.push({ x: at.x + Math.cos(a) * r * rand(0.8, 1.2), y: at.y + Math.sin(a) * r * rand(0.8, 1.2) })
    }
    lines.push(ring)
  }
  return { kind: 'crack', lines, color, width }
}

// 부품 영역 안에만 자국 그리기
export function drawMarks(ctx: CanvasRenderingContext2D, part: Part) {
  const { x, y, w, h } = part.rect
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()

  for (const m of part.marks) {
    if (m.kind === 'burn') {
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r)
      g.addColorStop(0, 'rgba(10, 8, 6, 0.85)')
      g.addColorStop(0.6, 'rgba(40, 25, 10, 0.45)')
      g.addColorStop(1, 'rgba(60, 35, 10, 0)')
      ctx.fillStyle = g
      ctx.fillRect(m.x - m.r, m.y - m.r, m.r * 2, m.r * 2)
    } else if (m.kind === 'dent') {
      const g = ctx.createRadialGradient(m.x - m.r * 0.2, m.y - m.r * 0.2, 0, m.x, m.y, m.r)
      g.addColorStop(0, 'rgba(0, 0, 0, 0.55)')
      g.addColorStop(0.7, 'rgba(0, 0, 0, 0.2)')
      g.addColorStop(1, 'rgba(255, 255, 255, 0.08)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.ellipse(m.x, m.y, m.r, m.r * 0.8, 0.4, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.strokeStyle = m.color
      ctx.lineWidth = m.width
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      for (const line of m.lines) {
        ctx.beginPath()
        line.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
        ctx.stroke()
      }
    }
  }
  ctx.restore()
}
