import type { SongMatch } from '../utils/similarityEngine'
import { GraphCanvas } from './GraphCanvas'

type Props = {
  matches: SongMatch[]
  thresholdPct?: number
}

function toPoints(graph: number[]) {
  const n = Math.max(2, graph.length)
  return graph.map((y, i) => ({ x: i / (n - 1), y }))
}

export function SimilarSongsPanel({ matches, thresholdPct = 70 }: Props) {
  const hasStrong = matches.some((m) => m.similarityPct >= thresholdPct)

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-700/60 bg-slate-950/16 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-md">
      <div className="border-b border-slate-700/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-200">Similar Songs</div>
            <div className="mt-1 text-xs text-slate-400">
              Songs ranked by graph similarity to your equation.
            </div>
          </div>
          <div className="rounded-md border border-slate-700/60 bg-slate-900/40 px-2 py-1 text-xs font-semibold text-slate-100">
            Top {matches.length}
          </div>
        </div>

        {!hasStrong && matches.length > 0 ? (
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            No song reached {thresholdPct}%, showing closest matches instead.
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {matches.length === 0 ? (
          <div className="text-sm text-slate-400">No songs loaded.</div>
        ) : (
          <div className="space-y-4">
            {matches.map((m) => {
              const strong = m.similarityPct >= thresholdPct
              return (
                <div
                  key={m.song.id}
                  className="rounded-xl border border-slate-700/60 bg-slate-950/16 p-3 backdrop-blur-md"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-100">
                        {m.song.title}
                      </div>
                      <div className="text-xs text-slate-400">{m.song.genre}</div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <div className="text-xs font-semibold text-slate-100">
                        {m.similarityPct.toFixed(1)}%
                      </div>
                      <div
                        className={[
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          strong
                            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                            : 'border border-slate-600/50 bg-slate-900/40 text-slate-200',
                        ].join(' ')}
                      >
                        {strong ? 'Strong match' : 'Closest match'}
                      </div>
                    </div>
                  </div>

                  <audio controls preload="none" src={m.song.file} className="w-full" />

                  <div className="mt-3">
                    <GraphCanvas
                      points={toPoints(m.song.graph)}
                      activeIndex={null}
                      className="h-[120px] w-full rounded-lg border border-slate-700/60 bg-transparent"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

