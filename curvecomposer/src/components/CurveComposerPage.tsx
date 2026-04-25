import { useMemo, useState } from 'react'
import { FunctionInput } from './FunctionInput'
import { GraphCanvas } from './GraphCanvas'
import { CurveInsights } from './CurveInsights'
import { SimilarSongsPanel } from './SimilarSongsPanel'
import FloatingLines from './FloatingLines'
import MatchExplanationPanel from './MatchExplanationPanel'
import { songGraphs } from '../data/songGraphs'
import { findTopSongMatches } from '../utils/similarityEngine'
import { generateCurveFromExpression } from '../utils/mathEngine'

import DecryptedText from './DecryptedText'

const PRESETS = [
  { id: 'sin', label: 'Sine', expr: 'sin(x^2)' },
  { id: 'cos', label: 'Cosine', expr: 'cos(x)' },
  { id: 'x2', label: 'Wave x2', expr: 'sin(2*x)' },
  { id: 'x5', label: 'Wave x5', expr: 'sin(5*x)' },
  { id: 'par', label: 'Parabola', expr: 'x^2' },
  { id: 'line', label: 'Line', expr: 'x' },
  { id: 'tan', label: 'Tan', expr: 'tan(6x)' },
  { id: 'mix', label: 'Mix', expr: 'sin(x)+cos(8*x)' },
] as const

type Props = {
  onBackToLanding?: () => void
}

export function CurveComposerPage({ onBackToLanding }: Props) {
  const [expression, setExpression] = useState<string>(PRESETS[0].expr)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const { curve, error } = useMemo(() => {
    try {
      const curve = generateCurveFromExpression(expression, {
        xMin: -Math.PI,
        xMax: Math.PI,
        samples: 240,
      })

      return { curve, error: null as string | null }
    } catch (e) {
      return { curve: null, error: e instanceof Error ? e.message : String(e) }
    }
  }, [expression])

  const matches = useMemo(() => {
    if (!curve) return []

    const ySeries = curve.points.map((p) => p.y)
    return findTopSongMatches(ySeries, songGraphs, 5, 70)
  }, [curve])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#06040c] text-slate-100">
      <div className="pointer-events-none fixed inset-0 opacity-90">
        <FloatingLines
          enabledWaves={['top', 'middle', 'bottom']}
          lineCount={[10, 15, 20]}
          lineDistance={[8, 6, 4]}
          bendRadius={5.0}
          bendStrength={-0.5}
          interactive={true}
          parallax={true}
          animationSpeed={1}
          mixBlendMode="screen"
          linesGradient={['#22d3ee', '#a855f7', '#ec4899']}
        />
      </div>

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(168,85,247,0.16),transparent_55%),radial-gradient(800px_circle_at_80%_20%,rgba(34,211,238,0.10),transparent_60%),radial-gradient(900px_circle_at_60%_90%,rgba(16,185,129,0.08),transparent_55%)]" />
      <div className="pointer-events-none fixed inset-0 bg-black/40" />

      <div className="relative mx-auto min-h-screen w-full max-w-[1600px] px-4 py-4 sm:px-6 lg:px-10">
        <div className="mb-2 flex items-center justify-between">
          {onBackToLanding ? (
            <button
              type="button"
              onClick={onBackToLanding}
              className="rounded-lg border border-slate-700/60 bg-slate-950/20 px-2 py-1 text-xs text-slate-200 hover:bg-slate-950/30"
            >
              Back
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-start">
          {/* LEFT + MAIN + BOTTOM PANEL GROUP */}
          <div className="grid grid-cols-1 gap-3 lg:col-span-9 lg:grid-cols-9">
            <aside className="cc-fade-up space-y-4 lg:col-span-3">
              <div className="px-1 pt-1">
            <DecryptedText
  text="CurveComposer"
  revealDirection="start"
  sequential
  useOriginalCharsOnly={false}
  animateOn="view"
/>
                <div className="mt-1 text-xs text-slate-300">
                  Find Music using Math
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/16 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-md">
                <div className="mb-3 text-sm font-semibold text-slate-200">
                  Function
                </div>

                <FunctionInput
                  expression={expression}
                  onChangeExpression={(next) => setExpression(next)}
                  presets={[...PRESETS]}
                />
              </div>

              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/16 p-4 text-sm text-slate-300 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-md">
                <div className="mb-2 text-sm font-semibold text-slate-200">
                  Try these
                </div>

                <ul className="space-y-2">
                  {PRESETS.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-400">{p.label}</span>

                      <button
                        type="button"
                        onClick={() => setExpression(p.expr)}
                        className="rounded-md border border-slate-700/60 bg-slate-950/40 px-2 py-1 font-mono text-xs text-slate-100 hover:bg-slate-900/60"
                      >
                        {p.expr}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <main className="cc-fade-up lg:col-span-6">
              <section className="flex flex-col rounded-2xl border border-slate-700/60 bg-slate-950/14 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold text-slate-200">
                    Equation graph
                  </div>
                  <div className="text-xs text-slate-400">
                    domain: \(-\pi\) to \(\pi\)
                  </div>
                </div>

                <GraphCanvas
                  points={curve?.points ?? []}
                  activeIndex={activeIndex}
                  className="h-[42vh] max-h-[520px] min-h-[260px] w-full rounded-xl border border-slate-700/60 bg-transparent"
                />

                <CurveInsights
                  y={curve?.points.map((p) => p.y) ?? []}
                  matches={matches}
                  thresholdPct={70}
                  onHoverIndex={setActiveIndex}
                />

                {error ? (
                  <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {error}
                  </div>
                ) : null}
              </section>
            </main>

            <div className="cc-fade-up lg:col-span-9">
              <MatchExplanationPanel />
            </div>
          </div>

          {/* RIGHT SONG PANEL */}
          <aside className="cc-fade-up lg:col-span-3 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
            <SimilarSongsPanel matches={matches} thresholdPct={70} />
          </aside>
        </div>
      </div>
    </div>
  )
}