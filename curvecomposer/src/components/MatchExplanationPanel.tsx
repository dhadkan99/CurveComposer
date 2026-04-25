export default function MatchExplanationPanel() {
  return (
    <div className=" rounded-2xl border border-white/10 bg-[#120b25]/70 p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">
            How CurveComposer Finds Similar Songs
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/60">
            Your equation is converted into a curve, then compared with each
            song’s audio energy graph. The app checks how closely the shapes,
            slopes, peaks, and roughness match.
          </p>
        </div>

        <div className="rounded-xl bg-purple-500/15 px-4 py-2 text-sm font-semibold text-purple-200">
          Pattern Match
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">
            Step 01
          </p>
          <h4 className="mt-1 font-semibold text-white">Equation</h4>
          <p className="mt-1 text-xs text-white/55">
            User enters sin(x), x², tan(x), or a custom function.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Step 02
          </p>
          <h4 className="mt-1 font-semibold text-white">Graph</h4>
          <p className="mt-1 text-xs text-white/55">
            The function is sampled and normalized into graph points.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-300">
            Step 03
          </p>
          <h4 className="mt-1 font-semibold text-white">Audio Energy</h4>
          <p className="mt-1 text-xs text-white/55">
            Songs are converted into RMS energy curves using Python.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-yellow-300">
            Step 04
          </p>
          <h4 className="mt-1 font-semibold text-white">Similarity</h4>
          <p className="mt-1 text-xs text-white/55">
            The closest songs are ranked using curve fingerprint matching.
          </p>
        </div>
      </div>

      
    </div>
  );
}