import { useState } from 'react'
import { LandingPage } from './components/LandingPage'
import { CurveComposerPage } from './components/CurveComposerPage'

export default function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing')

  if (view === 'landing') {
    return <LandingPage onGetStarted={() => setView('app')} />
  }

  return <CurveComposerPage onBackToLanding={() => setView('landing')} />
}
