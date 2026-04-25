type Props = {
  isPlaying: boolean
  speedMs: number
  volume01: number
  onChangeSpeedMs: (ms: number) => void
  onChangeVolume01: (v01: number) => void
  onCycleVolume: () => void
  onPlay: () => void
  onStop: () => void
}

export function Controls({
  isPlaying,
  speedMs,
  volume01,
  onChangeSpeedMs,
  onChangeVolume01,
  onCycleVolume,
  onPlay,
  onStop,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPlay}
          disabled={isPlaying}
          className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Play
        </button>
        <button
          type="button"
          onClick={onStop}
          disabled={!isPlaying}
          className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-4 py-2 text-sm font-semibold text-slate-100 transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Stop
        </button>

        <button
          type="button"
          onClick={onCycleVolume}
          className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-800/50"
        >
          Vol {Math.round(volume01 * 100)}%
        </button>

        <div className="ml-auto text-xs text-slate-400">{Math.round(speedMs)} speed</div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-200">Speed</span>
          <span className="text-xs text-slate-400">Slow → Fast</span>
        </div>
        <input
          type="range"
          min={60}
          max={520}
          step={10}
          value={speedMs}
          onChange={(e) => onChangeSpeedMs(Number(e.target.value))}
          className="w-full accent-purple-400"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-200">Volume</span>
          <span className="text-xs text-slate-400">
            {Math.round(volume01 * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(volume01 * 100)}
          onChange={(e) => onChangeVolume01(Number(e.target.value) / 100)}
          className="w-full accent-purple-400"
        />
      </div>
    </div>
  )
}

