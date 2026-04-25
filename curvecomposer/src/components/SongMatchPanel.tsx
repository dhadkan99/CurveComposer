import { useEffect, useMemo, useRef } from 'react'
import type { SongGraph } from '../data/songGraphs'
import { GraphCanvas } from './GraphCanvas'

type Props = {
  bestMatch: { song: SongGraph; similarityPct: number } | null
  thresholdPct?: number
}

function toPoints(graph: number[]) {
  const n = Math.max(2, graph.length)
  return graph.map((y, i) => ({ x: i / (n - 1), y }))
}

export function SongMatchPanel({ bestMatch, thresholdPct = 70 }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const { status, similarityText } = useMemo(() => {
    if (!bestMatch) return { status: 'No data', similarityText: '--' }
    const s = bestMatch.similarityPct
    return {
      status: s >= thresholdPct ? 'Matched' : 'No strong match found',
      similarityText: `${s.toFixed(1)}%`,
    }
  }, [bestMatch, thresholdPct])

  useEffect(() => {
    if (!bestMatch) return
    if (bestMatch.similarityPct < thresholdPct) return
    const el = audioRef.current
    if (!el) return

    void el.play().catch(() => {})
  }, [bestMatch, thresholdPct])

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-950/40 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-200">Song Match</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Similarity</span>
          <span className="rounded-md border border-slate-700/60 bg-slate-900/50 px-2 py-1 text-xs font-semibold text-slate-100">
            {similarityText}
          </span>
        </div>
      </div>

      {bestMatch ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-slate-100">
                {bestMatch.song.title}
              </div>
              <div className="text-sm text-slate-400">{bestMatch.song.artist}</div>
            </div>

            <div
              className={[
                'rounded-full px-3 py-1 text-xs font-semibold',
                bestMatch.similarityPct >= thresholdPct
                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 animate-pulse'
                  : 'border border-amber-500/30 bg-amber-500/10 text-amber-200',
              ].join(' ')}
            >
              {status}
            </div>
          </div>

          <audio
            ref={audioRef}
            controls
            preload="none"
            src={bestMatch.song.file}
            className="w-full"
          />

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Matched song graph
            </div>
            <GraphCanvas
              points={toPoints(bestMatch.song.graph)}
              activeIndex={null}
              className="h-[200px] w-full rounded-xl border border-slate-700/60 bg-slate-950/70"
            />
          </div>

          {bestMatch.similarityPct >= thresholdPct ? null : (
            <div className="text-xs text-slate-400">
              Closest match is shown, but it won’t autoplay until it’s ≥ {thresholdPct}%.
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-slate-400">No songs loaded.</div>
      )}
    </section>
  )
}

