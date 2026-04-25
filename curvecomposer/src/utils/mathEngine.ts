import { create, all, type MathJsStatic } from 'mathjs'

export type Point = { x: number; y: number }

export type CurveData = {
  expression: string
  domain: { xMin: number; xMax: number }
  points: Point[]
  yBounds: { yMin: number; yMax: number }
  normalizedY: number[]
  slopeAbs: number[]
}

const math = create(all, {}) as unknown as MathJsStatic

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function percentile(sorted: number[], p01: number) {
  const n = sorted.length
  if (n === 0) return 0
  const idx = (n - 1) * Math.max(0, Math.min(1, p01))
  const i0 = Math.floor(idx)
  const i1 = Math.min(n - 1, i0 + 1)
  const t = idx - i0
  return sorted[i0]! * (1 - t) + sorted[i1]! * t
}

export function generateCurveFromExpression(
  expression: string,
  opts?: { xMin?: number; xMax?: number; samples?: number },
): CurveData {
  const xMin = opts?.xMin ?? -Math.PI
  const xMax = opts?.xMax ?? Math.PI
  const samples = Math.max(16, opts?.samples ?? 256)

  const compiled = math.compile(expression)

  const points: Point[] = []
  const finiteYs: number[] = []
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1)
    const x = xMin + (xMax - xMin) * t
    let y = Number(compiled.evaluate({ x }))
    if (!Number.isFinite(y)) {
      y = points.length > 0 ? points[points.length - 1]!.y : 0
    }
    points.push({ x, y })
    if (Number.isFinite(y)) finiteYs.push(y)
  }

  if (finiteYs.length > 8) {
    finiteYs.sort((a, b) => a - b)
    const lo = percentile(finiteYs, 0.05)
    const hi = percentile(finiteYs, 0.95)
    const minClip = Math.min(lo, hi)
    const maxClip = Math.max(lo, hi)
    for (const p of points) {
      if (!Number.isFinite(p.y)) p.y = 0
      if (p.y < minClip) p.y = minClip
      if (p.y > maxClip) p.y = maxClip
    }
  }

  let yMin = Infinity
  let yMax = -Infinity
  for (const p of points) {
    yMin = Math.min(yMin, p.y)
    yMax = Math.max(yMax, p.y)
  }
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
    yMin = -1
    yMax = 1
  }

  const normalizedY = points.map((p) => clamp01((p.y - yMin) / (yMax - yMin)))

  const rawSlopeAbs: number[] = new Array(points.length).fill(0)
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)]
    const next = points[Math.min(points.length - 1, i + 1)]
    const dx = next.x - prev.x
    const dy = next.y - prev.y
    const slope = dx === 0 ? 0 : dy / dx
    rawSlopeAbs[i] = Math.abs(slope)
  }
  let sMin = Infinity
  let sMax = -Infinity
  for (const s of rawSlopeAbs) {
    sMin = Math.min(sMin, s)
    sMax = Math.max(sMax, s)
  }
  const slopeAbs =
    Number.isFinite(sMin) && Number.isFinite(sMax) && sMax !== sMin
      ? rawSlopeAbs.map((s) => clamp01((s - sMin) / (sMax - sMin)))
      : rawSlopeAbs.map(() => 0)

  return {
    expression,
    domain: { xMin, xMax },
    points,
    yBounds: { yMin, yMax },
    normalizedY,
    slopeAbs,
  }
}

