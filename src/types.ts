export type ToolId = 'hammer' | 'bat' | 'flame'

export type Material = 'glass' | 'plastic' | 'metal' | 'rubber'

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
  /** 부품 그리기. damage = 0(멀쩡) ~ 1(박살 직전) */
  draw: (ctx: CanvasRenderingContext2D, part: Part, damage: number, time: number) => void
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
