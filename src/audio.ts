// 효과음은 파일 없이 Web Audio로 직접 합성 (저작권 걱정 X, 용량 0)
// 아이폰은 사용자가 화면을 한 번 터치한 뒤에만 소리가 나서, 시작 버튼에서 unlock() 호출
let ctx: AudioContext | null = null
let noiseBuffer: AudioBuffer | null = null
let master: GainNode | null = null

export function unlockAudio() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.7
    master.connect(ctx.destination)
    // 1초짜리 화이트 노이즈 (부서지는 소리 재료)
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

function noise(filterType: BiquadFilterType, freq: number, q: number, volume: number, duration: number) {
  if (!ctx || !noiseBuffer || !master) return
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.playbackRate.value = 0.8 + Math.random() * 0.4
  const filter = ctx.createBiquadFilter()
  filter.type = filterType
  filter.frequency.value = freq
  filter.Q.value = q
  const gain = ctx.createGain()
  const t = ctx.currentTime
  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  src.connect(filter).connect(gain).connect(master)
  src.start(t, Math.random() * 0.5)
  src.stop(t + duration)
}

function tone(type: OscillatorType, from: number, to: number, volume: number, duration: number, delay = 0) {
  if (!ctx || !master) return
  const osc = ctx.createOscillator()
  osc.type = type
  const gain = ctx.createGain()
  const t = ctx.currentTime + delay
  osc.frequency.setValueAtTime(from, t)
  osc.frequency.exponentialRampToValueAtTime(to, t + duration)
  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  osc.connect(gain).connect(master)
  osc.start(t)
  osc.stop(t + duration)
}

// 둔탁하게 퍽 (플라스틱·책상)
export function playThud(strength = 1) {
  tone('sine', 160, 45, 0.6 * strength, 0.18)
  noise('lowpass', 900, 0.7, 0.5 * strength, 0.12)
}

// 유리 쨍그랑 (모니터 화면)
export function playGlass(strength = 1) {
  noise('highpass', 2500, 0.8, 0.35 * strength, 0.25 + strength * 0.2)
  const pings = 3 + Math.round(strength * 4)
  for (let i = 0; i < pings; i++) {
    tone('triangle', 2500 + Math.random() * 4000, 1800 + Math.random() * 2000, 0.06, 0.15 + Math.random() * 0.25, Math.random() * 0.15)
  }
}

// 크게 와장창 (방망이, 부품 박살)
export function playCrash(strength = 1) {
  playThud(strength)
  noise('bandpass', 1400, 0.6, 0.6 * strength, 0.35 + strength * 0.25)
  tone('square', 90, 30, 0.12 * strength, 0.25)
}

// 화염: 누르고 있는 동안 계속 나는 쉬익 소리
let flame: { src: AudioBufferSourceNode; gain: GainNode } | null = null

export function startFlame() {
  if (!ctx || !noiseBuffer || !master || flame) return
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 500
  filter.Q.value = 0.4
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.08)
  src.connect(filter).connect(gain).connect(master)
  src.start()
  flame = { src, gain }
}

export function stopFlame() {
  if (!ctx || !flame) return
  const { src, gain } = flame
  gain.gain.cancelScheduledValues(ctx.currentTime)
  gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
  src.stop(ctx.currentTime + 0.13)
  flame = null
}

// 안드로이드에서 진동 (아이폰 사파리는 지원 안 함 → 조용히 무시)
export function vibrate(pattern: number | number[]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern)
}
