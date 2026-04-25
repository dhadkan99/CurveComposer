type Preset = { id: string; label: string; expr: string }

type Props = {
  expression: string
  onChangeExpression: (next: string) => void
  presets: Preset[]
}

export function FunctionInput({ expression, onChangeExpression, presets }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChangeExpression(p.expr)}
            className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-800/50"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">
          Function \(y = f(x)\)
        </label>
        <input
          value={expression}
          onChange={(e) => onChangeExpression(e.target.value)}
          placeholder="sin(x) + cos(2*x)"
          className="w-full rounded-lg border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-slate-100 placeholder:text-slate-400 outline-none focus:border-purple-400/70 focus:ring-2 focus:ring-purple-500/20"
        />
        <p className="mt-1 text-xs text-slate-400">
          Examples: <span className="font-mono">sin(x)</span>,{' '}
          <span className="font-mono">x^2</span>,{' '}
          <span className="font-mono">sin(x)+cos(2*x)</span>
        </p>
      </div>
    </div>
  )
}

