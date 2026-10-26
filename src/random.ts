// 같은 seed면 항상 같은 순서의 난수 (부품마다 고정된 무늬 — 빠진 키, 화면 깨짐 줄무늬 등)
export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const rand = (min: number, max: number) => min + Math.random() * (max - min)

export const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)]
