import FloatingLines from './FloatingLines'
import TextType from './TextType'

type Props = {
  onGetStarted: () => void
}

export function LandingPage({ onGetStarted }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06040c] text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-90">
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

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_30%_20%,rgba(168,85,247,0.22),transparent_55%),radial-gradient(900px_circle_at_70%_40%,rgba(34,211,238,0.14),transparent_55%),radial-gradient(1000px_circle_at_50%_80%,rgba(236,72,153,0.14),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-black/35" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1320px] flex-col px-6 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/90">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5">
              <span className="text-base font-black tracking-tight">CC</span>
            </div>
            <div className="text-sm font-semibold tracking-tight">CurveComposer</div>
          </div>

          <div className="hidden items-center gap-6 text-sm text-white/60 sm:flex">
            <button type="button" className="hover:text-white/90">
              Features
            </button>
            <button type="button" className="hover:text-white/90">
              About
            </button>
          </div>

          <button
            type="button"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-white/90"
          >
            Get Started
          </button>
        </header>

        <main className="flex flex-1 items-center justify-center px-2 py-10 sm:px-6">
          <div>
            <div className="mx-auto flex max-w-full flex-col items-center text-center">
              

              <TextType
                as="h1"
                text={['Math is Cool! Even Cooler with Sounds.']}
                className="text-balance text-4xl font-black tracking-tight text-white sm:text-6xl"
                typingSpeed={34}
                deletingSpeed={18}
                pauseDuration={1400}
                initialDelay={250}
                loop={true}
                showCursor={true}
                cursorClassName="text-white/70"
              />

              <div className="mt-10 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="rounded-xl bg-white px-7 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-white/90"
                >
                  Get started
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-7 py-3 text-sm font-semibold text-white/70 hover:bg-white/10"
                >
                  Learn more
                </button>
              </div>
            </div>
          </div>
        </main>

        
      </div>
    </div>
  )
}

