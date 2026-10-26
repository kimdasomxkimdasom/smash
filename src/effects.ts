import Matter from 'matter-js'
import { pick, rand } from './random'
import type { Point, Rect } from './types'

// ─── 파편: matter.js 물리로 튀고 떨어지고 쌓임 ───

const MAX_DEBRIS = 220 // 너무 많아지면 오래된 것부터 지움 (폰 성능)

type Debris = { body: Matter.Body; color: string; born: number }

export class DebrisWorld {
  engine = Matter.Engine.create({ enableSleeping: true })
  debris: Debris[] = []
  private statics: Matter.Body[] = []

  constructor() {
    this.engine.gravity.y = 1.1
  }

  // 파편이 올라앉을 면 (책상, 바닥, 양옆 벽)
  setSurfaces(surfaces: Rect[], W: number, H: number) {
    Matter.Composite.remove(this.engine.world, this.statics)
    this.statics = [
      ...surfaces.map((r) => Matter.Bodies.rectangle(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h, { isStatic: true, friction: 0.8 })),
      Matter.Bodies.rectangle(-25, H / 2, 50, H * 3, { isStatic: true }),
      Matter.Bodies.rectangle(W + 25, H / 2, 50, H * 3, { isStatic: true }),
    ]
    Matter.Composite.add(this.engine.world, this.statics)
  }

  spawn(at: Point, colors: string[], count: number, size: [number, number], power: number) {
    for (let i = 0; i < count; i++) {
      const r = rand(size[0], size[1])
      const body = Matter.Bodies.polygon(at.x + rand(-6, 6), at.y + rand(-6, 6), Math.round(rand(3, 5)), r, {
        friction: 0.6,
        restitution: 0.25,
        density: 0.002,
        angle: rand(0, Math.PI),
      })
      // 위쪽·바깥쪽으로 튀게
      const angle = rand(-Math.PI * 0.95, -Math.PI * 0.05)
      const speed = rand(0.4, 1) * power
      Matter.Body.setVelocity(body, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed })
      Matter.Body.setAngularVelocity(body, rand(-0.3, 0.3))
      Matter.Composite.add(this.engine.world, body)
      this.debris.push({ body, color: pick(colors), born: performance.now() })
    }
    while (this.debris.length > MAX_DEBRIS) {
      const old = this.debris.shift()!
      Matter.Composite.remove(this.engine.world, old.body)
    }
  }

  update(dt: number) {
    Matter.Engine.update(this.engine, Math.min(dt, 1000 / 30))
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)'
    ctx.lineWidth = 0.8
    for (const d of this.debris) {
      const v = d.body.vertices
      ctx.fillStyle = d.color
      ctx.beginPath()
      ctx.moveTo(v[0].x, v[0].y)
      for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }

  clear() {
    Matter.Composite.remove(this.engine.world, this.debris.map((d) => d.body))
    this.debris = []
  }
}

// ─── 불꽃·불·연기: 물리 없이 가볍게 ───

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  kind: 'spark' | 'fire' | 'smoke' | 'drop'
  color?: string
}

export class Particles {
  list: Particle[] = []

  sparks(at: Point, count: number) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2)
      const s = rand(2, 6)
      this.list.push({ x: at.x, y: at.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, life: 0, maxLife: rand(12, 22), size: rand(1, 2.2), kind: 'spark' })
    }
  }

  fire(at: Point) {
    for (let i = 0; i < 3; i++) {
      this.list.push({ x: at.x + rand(-8, 8), y: at.y + rand(-4, 4), vx: rand(-0.6, 0.6), vy: rand(-2.2, -1), life: 0, maxLife: rand(18, 32), size: rand(6, 13), kind: 'fire' })
    }
    if (Math.random() < 0.5) {
      this.list.push({ x: at.x + rand(-6, 6), y: at.y - 10, vx: rand(-0.4, 0.4), vy: rand(-1.4, -0.7), life: 0, maxLife: rand(40, 70), size: rand(8, 14), kind: 'smoke' })
    }
  }

  // 액체 방울 (커피 등): 튀었다가 떨어짐
  drops(at: Point, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const a = rand(-Math.PI * 0.95, -Math.PI * 0.05)
      const s = rand(1.5, 5)
      this.list.push({ x: at.x, y: at.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, maxLife: rand(25, 45), size: rand(1.5, 3.5), kind: 'drop', color })
    }
  }

  // 부품이 박살 난 뒤 잠시 피어오르는 연기
  smoke(at: Point, count: number) {
    for (let i = 0; i < count; i++) {
      this.list.push({ x: at.x + rand(-20, 20), y: at.y + rand(-10, 10), vx: rand(-0.5, 0.5), vy: rand(-1.2, -0.5), life: 0, maxLife: rand(50, 90), size: rand(10, 20), kind: 'smoke' })
    }
  }

  update() {
    for (const p of this.list) {
      p.life++
      p.x += p.vx
      p.y += p.vy
      if (p.kind === 'spark' || p.kind === 'drop') p.vy += 0.35
      if (p.kind === 'smoke') p.size += 0.25
    }
    this.list = this.list.filter((p) => p.life < p.maxLife)
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.list) {
      const t = p.life / p.maxLife
      if (p.kind === 'spark') {
        ctx.strokeStyle = `rgba(255, ${200 - t * 120}, 60, ${1 - t})`
        ctx.lineWidth = p.size
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5)
        ctx.stroke()
      } else if (p.kind === 'fire') {
        const r = p.size * (1 - t * 0.6)
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
        g.addColorStop(0, `rgba(255, 245, 180, ${0.9 - t * 0.6})`)
        g.addColorStop(0.4, `rgba(255, ${150 - t * 100}, 30, ${0.7 - t * 0.5})`)
        g.addColorStop(1, 'rgba(200, 40, 10, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.kind === 'drop') {
        ctx.globalAlpha = 1 - t * t
        ctx.fillStyle = p.color!
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      } else {
        ctx.fillStyle = `rgba(70, 70, 75, ${0.35 * (1 - t)})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  clear() {
    this.list = []
  }
}
