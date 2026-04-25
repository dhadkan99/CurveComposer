import type { SongMatch } from '../utils/similarityEngine'
import { useState } from 'react'

type Props = {
  y: number[]
  matches: SongMatch[]
  thresholdPct?: number
  onHoverIndex?: (index: number | null) => void
}

function fmt(n: number) {
  const abs = Math.abs(n)
  if (abs >= 100) return n.toFixed(1)
  if (abs >= 10) return n.toFixed(2)
  return n.toFixed(3)
}

function computeStats(y: number[]) {
  if (y.length === 0) {
    return {
      yMin: 0,
      yMax: 0,
      mean: 0,
      rms: 0,
      std: 0,
      zeroCrossings: 0,
      peaks: 0,
    }
  }

  let yMin = Infinity
  let yMax = -Infinity
  let sum = 0
  for (const v of y) {
    yMin = Math.min(yMin, v)
    yMax = Math.max(yMax, v)
    sum += v
  }
  const mean = sum / y.length

  let sq = 0
  let varSum = 0
  for (const v of y) {
    sq += v * v
    const d = v - mean
    varSum += d * d
  }
  const rms = Math.sqrt(sq / y.length)
  const std = Math.sqrt(varSum / y.length)

  let zeroCrossings = 0
  for (let i = 1; i < y.length; i++) {
    const a = y[i - 1]
    const b = y[i]
    if ((a <= 0 && b > 0) || (a >= 0 && b < 0)) zeroCrossings++
  }

  let peaks = 0
  for (let i = 1; i < y.length - 1; i++) {
    const a = y[i - 1]
    const b = y[i]
    const c = y[i + 1]
    if ((b > a && b > c) || (b < a && b < c)) peaks++
  }

  return { yMin, yMax, mean, rms, std, zeroCrossings, peaks }
}

function Sparkline({
  y,
  activeIndex,
  onHoverIndex,
}: {
  y: number[]
  activeIndex: number | null
  onHoverIndex?: (index: number | null) => void
}) {
  const w = 520
  const h = 84
  const pad = 6
  const n = Math.max(2, y.length)
  let yMin = Infinity
  let yMax = -Infinity
  for (const v of y) {
    yMin = Math.min(yMin, v)
    yMax = Math.max(yMax, v)
  }
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
    yMin = -1
    yMax = 1
  }
  const toX = (i: number) => pad + (i / (n - 1)) * (w - pad * 2)
  const toY = (v: number) =>
    pad + (1 - (v - yMin) / (yMax - yMin)) * (h - pad * 2)

  const pts = y.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  const idx =
    activeIndex === null || y.length === 0
      ? null
      : Math.max(0, Math.min(y.length - 1, activeIndex))
  const ax = idx === null ? null : toX(idx)
  const ay = idx === null ? null : toY(y[idx])

  const handleMove: React.MouseEventHandler<SVGSVGElement> = (e) => {
    if (!onHoverIndex || y.length === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const t = (x / Math.max(1, rect.width)) * w
    const clamped = Math.max(pad, Math.min(w - pad, t))
    const next = Math.round(((clamped - pad) / (w - pad * 2)) * (n - 1))
    onHoverIndex(Math.max(0, Math.min(y.length - 1, next)))
  }

  const handleLeave: React.MouseEventHandler<SVGSVGElement> = () => {
    onHoverIndex?.(null)
  }

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-[84px] w-full rounded-lg border border-slate-700/60 bg-slate-950/20"
      preserveAspectRatio="none"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <defs>
        <linearGradient id="ccSpark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(34,211,238,0.95)" />
          <stop offset="45%" stopColor="rgba(168,85,247,0.95)" />
          <stop offset="100%" stopColor="rgba(236,72,153,0.9)" />
        </linearGradient>
        <filter id="ccGlow">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <polyline
        points={pts}
        fill="none"
        stroke="rgba(148,163,184,0.18)"
        strokeWidth="1"
      />
      <polyline
        points={pts}
        fill="none"
        stroke="url(#ccSpark)"
        strokeWidth="2.5"
        filter="url(#ccGlow)"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {ax !== null && ay !== null ? (
        <>
          <line
            x1={ax}
            x2={ax}
            y1={pad}
            y2={h - pad}
            stroke="rgba(148,163,184,0.22)"
            strokeWidth="1"
          />
          <circle cx={ax} cy={ay} r="4.5" fill="rgba(236, 254, 255, 0.95)" />
          <circle
            cx={ax}
            cy={ay}
            r="8.5"
            fill="none"
            stroke="rgba(34, 211, 238, 0.9)"
            strokeWidth="2"
          />
        </>
      ) : null}
    </svg>
  )
}

export function CurveInsights({
  y,
  matches,
  thresholdPct = 70,
  onHoverIndex,
}: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const stats = computeStats(y)
  const strongCount = matches.filter((m) => m.similarityPct >= thresholdPct).length
  const best = matches[0]

  return (
    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/20 p-3 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-200">Curve Insights</div>
            <div className="text-[11px] text-slate-400">
              {y.length} samples · {strongCount} strong matches
            </div>
          </div>
          <Sparkline
            y={y}
            activeIndex={hoverIndex}
            onHoverIndex={(i) => {
              setHoverIndex(i)
              onHoverIndex?.(i)
            }}
          />
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/20 p-3 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-200">Numbers</div>
            {best ? (
              <div className="text-[11px] text-slate-400">
                Best: <span className="text-slate-200">{best.song.genre}</span>{' '}
                <span className="text-slate-300">{best.similarityPct.toFixed(1)}%</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">No matches yet</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-slate-700/60 bg-slate-950/20 px-2 py-1.5">
              <div className="text-[11px] text-slate-400">min / max</div>
              <div className="mt-0.5 font-mono text-slate-100">
                {fmt(stats.yMin)} / {fmt(stats.yMax)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700/60 bg-slate-950/20 px-2 py-1.5">
              <div className="text-[11px] text-slate-400">mean / std</div>
              <div className="mt-0.5 font-mono text-slate-100">
                {fmt(stats.mean)} / {fmt(stats.std)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700/60 bg-slate-950/20 px-2 py-1.5">
              <div className="text-[11px] text-slate-400">RMS energy</div>
              <div className="mt-0.5 font-mono text-slate-100">{fmt(stats.rms)}</div>
            </div>
            <div className="rounded-lg border border-slate-700/60 bg-slate-950/20 px-2 py-1.5">
              <div className="text-[11px] text-slate-400">complexity</div>
              <div className="mt-0.5 font-mono text-slate-100">
                {stats.peaks + stats.zeroCrossings}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700/60 bg-slate-950/20 px-2 py-1.5">
              <div className="text-[11px] text-slate-400">peaks</div>
              <div className="mt-0.5 font-mono text-slate-100">{stats.peaks}</div>
            </div>
            <div className="rounded-lg border border-slate-700/60 bg-slate-950/20 px-2 py-1.5">
              <div className="text-[11px] text-slate-400">zero crossings</div>
              <div className="mt-0.5 font-mono text-slate-100">{stats.zeroCrossings}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

