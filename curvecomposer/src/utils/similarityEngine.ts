import type { SongGraph } from '../data/songGraphs'

export type SongMatch = {
  song: SongGraph
  similarityPct: number
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

export function resampleLinear(series: number[], targetLength: number): number[] {
  const n = Math.max(2, Math.floor(targetLength))
  if (series.length === 0) return new Array(n).fill(0)
  if (series.length === 1) return new Array(n).fill(series[0] ?? 0)
  if (series.length === n) return series.slice()

  const out: number[] = new Array(n)
  const last = series.length - 1
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const idx = t * last
    const i0 = Math.floor(idx)
    const i1 = Math.min(last, i0 + 1)
    const a = idx - i0
    const v0 = series[i0] ?? 0
    const v1 = series[i1] ?? v0
    out[i] = v0 + (v1 - v0) * a
  }
  return out
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

function sanitize(series: number[]) {
  const out: number[] = new Array(series.length)
  let last = 0
  for (let i = 0; i < series.length; i++) {
    const v = series[i]
    if (Number.isFinite(v)) {
      out[i] = v
      last = v
    } else {
      out[i] = last
    }
  }
  return out
}

function normalize01Robust(series: number[]) {
  const clean = sanitize(series)
  const finite = clean.filter(Number.isFinite)
  if (finite.length === 0) return clean.map(() => 0.5)
  finite.sort((a, b) => a - b)
  const lo = percentile(finite, 0.05)
  const hi = percentile(finite, 0.95)
  const minClip = Math.min(lo, hi)
  const maxClip = Math.max(lo, hi)
  const clipped = clean.map((v) => Math.max(minClip, Math.min(maxClip, v)))
  let min = Infinity
  let max = -Infinity
  for (const v of clipped) {
    min = Math.min(min, v)
    max = Math.max(max, v)
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return clipped.map(() => 0.5)
  return clipped.map((v) => clamp01((v - min) / (max - min)))
}

function slopeSeries(shape01: number[]) {
  if (shape01.length < 2) return shape01.map(() => 0)
  const s: number[] = new Array(shape01.length).fill(0)
  for (let i = 1; i < shape01.length; i++) s[i] = Math.abs(shape01[i]! - shape01[i - 1]!)
  const max = Math.max(...s)
  if (!Number.isFinite(max) || max <= 0) return s.map(() => 0)
  return s.map((v) => clamp01(v / max))
}

function roughnessFromSlope(slope01: number[]) {
  if (slope01.length < 3) return 0
  let sum = 0
  for (let i = 2; i < slope01.length; i++) {
    sum += Math.abs(slope01[i]! - slope01[i - 1]!)
  }
  return sum / (slope01.length - 2)
}

function peakCount(shape01: number[]) {
  let peaks = 0
  for (let i = 1; i < shape01.length - 1; i++) {
    const a = shape01[i - 1]!
    const b = shape01[i]!
    const c = shape01[i + 1]!
    if ((b > a && b > c) || (b < a && b < c)) peaks++
  }
  return peaks
}

function seriesSimilarity(a01: number[], b01: number[]) {
  const n = Math.min(a01.length, b01.length)
  if (n === 0) return 0
  let sum = 0
  for (let i = 0; i < n; i++) sum += Math.abs((a01[i] ?? 0) - (b01[i] ?? 0))
  return clamp01(1 - sum / n)
}

function scalarSimilarity(a: number, b: number) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  const denom = Math.max(1e-6, Math.max(Math.abs(a), Math.abs(b)))
  return clamp01(1 - Math.abs(a - b) / denom)
}

export function similarityPct(aSeries: number[], bSeries: number[]): number {
  const targetLength = 160
  const aShape = normalize01Robust(resampleLinear(aSeries, targetLength))
  const bShape = normalize01Robust(resampleLinear(bSeries, targetLength))

  const aSlope = slopeSeries(aShape)
  const bSlope = slopeSeries(bShape)

  const shapeSim = seriesSimilarity(aShape, bShape)
  const slopeSim = seriesSimilarity(aSlope, bSlope)
  const roughSim = scalarSimilarity(roughnessFromSlope(aSlope), roughnessFromSlope(bSlope))
  const peakSim = scalarSimilarity(peakCount(aShape), peakCount(bShape))

  const score01 = clamp01(
    shapeSim * 0.6 + slopeSim * 0.25 + roughSim * 0.1 + peakSim * 0.05,
  )

  return score01 * 100
}

export function findTopSongMatches(
  equationGraph: number[],
  songs: SongGraph[],
  topN: number = 5,
  thresholdPct: number = 70,
): SongMatch[] {
  if (songs.length === 0) return []

  const scored: SongMatch[] = songs.map((song) => ({
    song,
    similarityPct: similarityPct(equationGraph, song.graph),
  }))

  scored.sort((a, b) => b.similarityPct - a.similarityPct)

  const strong = scored.filter((m) => m.similarityPct >= thresholdPct)
  return (strong.length > 0 ? strong : scored).slice(0, topN)
}

