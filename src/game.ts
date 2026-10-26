import { playCrash, playGlass, playThud, startFlame, stopFlame, vibrate } from './audio'
import { DebrisWorld, Particles } from './effects'
import { drawMarks, makeCrack } from './marks'
import { rand } from './random'
import type { Layout, Part, Point, Target, ToolId } from './types'

const WORLD_W = 400

// 도구별 손맛
const TOOLS = {
  hammer: { damage: 8, repeatMs: 150, debris: [2, 4], debrisSize: [2, 4.5], power: 7, shake: 5, vibrate: 12 },
  bat: { damage: 20, repeatMs: 280, debris: [7, 12], debrisSize: [3, 7], power: 11, shake: 11, vibrate: 35 },
  flame: { damagePerSec: 26 },
} as const

export type GameStats = { percent: number; seconds: number; hits: number; finished: boolean }

export class Game {
  private ctx: CanvasRenderingContext2D
  private layout!: Layout
  private scale = 1
  private parts: Part[] = []
  private debris = new DebrisWorld()
  private particles = new Particles()

  tool: ToolId = 'hammer'
  private pointer: Point | null = null // 누르고 있는 위치 (월드 좌표)
  private lastStrike: Point | null = null // 마지막으로 때린 위치 (손을 떼도 휘두르는 동안 도구 보이게)
  private lastHitAt = 0
  private lastBurnAt = 0
  private swing = 0 // 도구 휘두르는 애니메이션 (1 → 0)
  private shake = 0
  private startedAt = 0
  private finishedAt = 0
  private hits = 0
  private running = false
  private lastFrame = 0

  constructor(
    private canvas: HTMLCanvasElement,
    private target: Target,
    private onStats: (stats: GameStats) => void,
  ) {
    this.ctx = canvas.getContext('2d')!
    this.resize()
    window.addEventListener('resize', () => this.resize())
    this.bindInput()
    requestAnimationFrame((t) => this.frame(t))
  }

  // 화면 폭을 월드 폭 400에 맞추고, 높이는 화면 비율대로
  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const { width, height } = this.canvas.getBoundingClientRect()
    this.canvas.width = Math.round(width * dpr)
    this.canvas.height = Math.round(height * dpr)
    this.scale = (width / WORLD_W) * dpr
    const H = height / (width / WORLD_W)
    const floorY = H - 92 // 아래 도구 버튼 자리
    const groundY = Math.max(320, Math.min(H * 0.6, floorY - 130)) // 위 HUD와 안 겹치게
    this.layout = { W: WORLD_W, H, groundY, floorY }
    this.debris.setSurfaces(this.target.surfaces(this.layout), WORLD_W, H)
    if (!this.running) this.parts = this.target.createParts(this.layout)
  }

  start() {
    this.parts = this.target.createParts(this.layout)
    this.debris.clear()
    this.particles.clear()
    this.hits = 0
    this.startedAt = performance.now()
    this.finishedAt = 0
    this.running = true
    this.emitStats()
  }

  private toWorld(e: PointerEvent): Point {
    const rect = this.canvas.getBoundingClientRect()
    const k = WORLD_W / rect.width
    return { x: (e.clientX - rect.left) * k, y: (e.clientY - rect.top) * k }
  }

  private bindInput() {
    this.canvas.addEventListener('pointerdown', (e) => {
      if (!this.running || this.finishedAt) return
      this.canvas.setPointerCapture(e.pointerId)
      this.pointer = this.toWorld(e)
      if (this.tool === 'flame') startFlame()
      else this.strike(this.pointer)
    })
    this.canvas.addEventListener('pointermove', (e) => {
      if (this.pointer) this.pointer = this.toWorld(e)
    })
    const release = () => {
      this.pointer = null
      stopFlame()
    }
    this.canvas.addEventListener('pointerup', release)
    this.canvas.addEventListener('pointercancel', release)
  }

  setTool(tool: ToolId) {
    this.tool = tool
    this.pointer = null
    stopFlame()
  }

  // 맨 위에 그려진 부품부터 확인
  private partAt(p: Point) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const part = this.parts[i]
      const r = part.rect
      if (!part.destroyed && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return part
    }
    return null
  }

  // 망치·방망이 한 번 때리기
  private strike(at: Point) {
    if (this.tool === 'flame') return
    const tool = TOOLS[this.tool]
    this.lastHitAt = performance.now()
    this.swing = 1
    this.lastStrike = at
    const part = this.partAt(at)

    if (!part) {
      // 허공이나 책상: 소리만
      playThud(0.5)
      this.shake = Math.max(this.shake, 2)
      return
    }

    this.hits++
    const glass = part.isGlass(at)
    const big = this.tool === 'bat'
    part.marks.push(
      makeCrack(at, big ? rand(34, 52) : rand(16, 28), glass ? 'rgba(235, 245, 255, 0.9)' : 'rgba(0, 0, 0, 0.55)', big ? 1.6 : 1.1),
    )
    if (big || !glass) part.marks.push({ kind: 'dent', x: at.x, y: at.y, r: big ? rand(12, 18) : rand(5, 8) })

    this.debris.spawn(at, glass ? ['#cfe9ff', '#9fd3ff', '#ffffff'] : part.debrisColors, Math.round(rand(tool.debris[0], tool.debris[1])), [tool.debrisSize[0], tool.debrisSize[1]], tool.power)
    this.particles.sparks(at, big ? 10 : 5)
    if (glass) playGlass(big ? 1 : 0.5)
    else if (big) playCrash(0.7)
    else playThud(0.8)
    this.shake = Math.max(this.shake, tool.shake)
    vibrate(tool.vibrate)

    this.damage(part, tool.damage * rand(0.85, 1.15), at)
  }

  private damage(part: Part, amount: number, at: Point) {
    part.hp -= amount
    if (part.hp <= 0 && !part.destroyed) this.destroy(part, at)
    this.emitStats()
  }

  // 부품 박살: 큰 조각 와르르 + 연기
  private destroy(part: Part, at: Point) {
    part.hp = 0
    part.destroyed = true
    const r = part.rect
    const center = { x: r.x + r.w / 2, y: r.y + r.h / 2 }
    const size = Math.sqrt(r.w * r.h)
    this.debris.spawn(center, part.debrisColors, Math.round(size / 6), [size / 22, size / 11], 9)
    this.debris.spawn(at, part.debrisColors, 10, [2, 5], 12)
    this.particles.smoke(center, 8)
    this.particles.sparks(center, 18)
    playCrash(1.2)
    if (part.id === 'monitor') playGlass(1.4)
    this.shake = 18
    vibrate([40, 30, 80])

    if (this.parts.every((p) => p.destroyed)) {
      this.finishedAt = performance.now()
      stopFlame()
      this.pointer = null
    }
  }

  // 화염: 누르고 있는 동안 계속 태우기
  private burn(at: Point, dt: number) {
    this.particles.fire(at)
    const part = this.partAt(at)
    if (!part) return
    const now = performance.now()
    if (now - this.lastBurnAt > 70) {
      this.lastBurnAt = now
      part.marks.push({ kind: 'burn', x: at.x + rand(-4, 4), y: at.y + rand(-4, 4), r: rand(12, 20) })
      // 그을음 자국이 너무 많으면 오래된 것 정리 (성능)
      const burns = part.marks.filter((m) => m.kind === 'burn')
      if (burns.length > 80) part.marks.splice(part.marks.indexOf(burns[0]), 1)
      if (Math.random() < 0.15) this.debris.spawn(at, ['#1a1a1a', '#3a2a1a'], 1, [1.5, 3], 3)
    }
    this.damage(part, (TOOLS.flame.damagePerSec * dt) / 1000, at)
  }

  get stats(): GameStats {
    const total = this.parts.reduce((sum, p) => sum + p.maxHp, 0)
    const dealt = this.parts.reduce((sum, p) => sum + (p.maxHp - Math.max(p.hp, 0)), 0)
    const end = this.finishedAt || (this.running ? performance.now() : this.startedAt)
    return {
      percent: Math.min(100, Math.floor((dealt / total) * 100)),
      seconds: this.running ? (end - this.startedAt) / 1000 : 0,
      hits: this.hits,
      finished: this.finishedAt > 0,
    }
  }

  private emitStats() {
    this.onStats(this.stats)
  }

  private frame(time: number) {
    const dt = this.lastFrame ? time - this.lastFrame : 16
    this.lastFrame = time

    // 꾹 누르고 있으면 연타 / 화염 계속
    if (this.pointer && this.running && !this.finishedAt) {
      if (this.tool === 'flame') this.burn(this.pointer, dt)
      else if (time - this.lastHitAt > TOOLS[this.tool].repeatMs) this.strike(this.pointer)
    }

    this.debris.update(dt)
    this.particles.update()
    this.swing = Math.max(0, this.swing - dt / 220)
    this.shake *= 0.85
    if (this.running && !this.finishedAt && Math.floor(time / 100) !== Math.floor((time - dt) / 100)) this.emitStats()

    this.draw(time)
    requestAnimationFrame((t) => this.frame(t))
  }

  private draw(time: number) {
    const { ctx } = this
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0)
    ctx.clearRect(0, 0, WORLD_W, this.layout.H)
    ctx.save()
    if (this.shake > 0.3) ctx.translate(rand(-this.shake, this.shake), rand(-this.shake, this.shake))

    this.target.drawBackground(ctx, this.layout)
    for (const part of this.parts) {
      if (part.destroyed) continue
      part.draw(ctx, part, 1 - part.hp / part.maxHp, time)
      drawMarks(ctx, part)
    }
    this.debris.draw(ctx)
    this.particles.draw(ctx)
    ctx.restore()

    this.drawTool()
  }

  // 손가락 위치에 도구 그리기 (때릴 때 휘두르는 각도)
  private drawTool() {
    const at = this.pointer ?? (this.swing > 0 ? this.lastStrike : null)
    if (!at || this.tool === 'flame') return
    const { ctx } = this
    const { x, y } = at
    ctx.save()
    ctx.translate(x + 18, y - 18)
    ctx.rotate(-0.9 + this.swing * 1.1)
    ctx.font = this.tool === 'bat' ? '50px sans-serif' : '42px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.tool === 'bat' ? '🏏' : '🔨', 0, 0)
    ctx.restore()
  }
}
