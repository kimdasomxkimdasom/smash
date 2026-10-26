export type ToolId = 'hammer' | 'bat' | 'flame'

export type Material = 'glass' | 'plastic' | 'metal' | 'rubber' | 'ceramic' | 'paper'

export type Rect = { x: number; y: number; w: number; h: number }

export type Point = { x: number; y: number }

// 때린 자국 (금, 움푹 들어감, 그을음) — 좌표는 화면(월드) 기준
export type Mark =
  | { kind: 'crack'; lines: Point[][]; color: string; width: number }
  | { kind: 'dent'; x: number; y: number; r: number }
  | { kind: 'burn'; x: number; y: number; r: number }

// 부술 수 있는 부품 하나 (모니터, 본체, 키보드 …)
export type Part = {
  id: string
  name: string
  rect: Rect
  maxHp: number
  hp: number
  destroyed: boolean
  marks: Mark[]
  /** 파편 색 */
  debrisColors: string[]
  /** 때린 곳의 재질 → 소리, 금 색깔, 파편 (모니터 화면 = 유리 등) */
  materialAt: (p: Point) => Material
  /** 이 부품이 붙어 있는 부품 id. 그 부품이 박살 나면 같이 떨어져 나감 (예: 차 유리 → 차체) */
  attachedTo?: string
  /** 소품(포스트잇, 커피잔 …): 파괴율·완료 조건에서 빠지고, 결과 화면에 보너스로 */
  bonus?: boolean
  /** 맞을 때마다 추가 반응 (예: 차 경보음) */
  onHit?: (fx: Fx, at: Point) => void
  /** 박살 났을 때 추가 반응 (예: 커피 쏟아짐). byFlame = 토치로 태워서 */
  onDestroy?: (fx: Fx, byFlame: boolean) => void
  /** 부품 그리기. damage = 0(멀쩡) ~ 1(박살 직전), scene = 지금 장면 상태 (경보 중 등) */
  draw: (ctx: CanvasRenderingContext2D, part: Part, damage: number, time: number, scene: Scene) => void
}

export type Scene = { alarming: boolean }

// 부품이 게임에 일으킬 수 있는 효과
export type Fx = {
  now: number
  /** 바닥·책상에 남는 얼룩 (커피 등) */
  stain: (x: number, y: number, rx: number, ry: number, color: string) => void
  /** 액체 방울 튀기기 */
  splash: (at: Point, color: string, count: number) => void
  /** 경보음 (초) */
  alarm: (seconds: number) => void
}

// 부술 대상 (컴퓨터, 자동차 …) — 대상만 갈아 끼우면 새 스테이지
export type Target = {
  id: string
  name: string
  /** 화면 크기에 맞춰 부품 배치. deskY = 책상 윗면 높이 */
  createParts: (layout: Layout) => Part[]
  /** 부품 뒤 배경 (벽, 책상 등) */
  drawBackground: (ctx: CanvasRenderingContext2D, layout: Layout) => void
  /** 파편이 떨어져 쌓이는 바닥면들 */
  surfaces: (layout: Layout) => Rect[]
}

export type Layout = {
  W: number // 월드 폭 (항상 400)
  H: number // 월드 높이 (화면 비율에 따라)
  groundY: number // 대상이 놓이는 면 (책상 윗면)
  floorY: number // 바닥
}
