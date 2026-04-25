import * as Tone from 'tone'

export type NotePoint = {
  freqHz: number
  velocity01: number
}

export type AudioStartOptions = {
  intervalSeconds: number
  onStep?: (index: number) => void
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function velocityToGain(v01: number) {
  const v = clamp01(v01)
  return 0.02 + v * 0.35
}

export class AudioEngine {
  private osc: Tone.Oscillator
  private gain: Tone.Gain
  private master = 0.75
  private running = false
  private seq: NotePoint[] = []
  private index = 0
  private repeatId: number | null = null
  private onStep: ((index: number) => void) | null = null
  private intervalSeconds = 0.22

  constructor() {
    this.gain = new Tone.Gain(0).toDestination()
    this.osc = new Tone.Oscillator({
      type: 'sine',
      frequency: 220,
    }).connect(this.gain)
    this.osc.start()
  }

  isRunning() {
    return this.running
  }

  setVolume01(v01: number) {
    this.master = clamp01(v01)
  }

  async start(sequence: NotePoint[], opts: AudioStartOptions) {
    if (this.running) this.stop()

    this.seq = sequence
    this.index = 0
    this.onStep = opts.onStep ?? null
    this.intervalSeconds = Math.max(0.02, opts.intervalSeconds)

    await Tone.start()

    Tone.Transport.stop()
    Tone.Transport.cancel(0)

    this.gain.gain.setValueAtTime(0, 0)
    this.repeatId = Tone.Transport.scheduleRepeat((time) => {
      this.stepAtTime(time)
    }, this.intervalSeconds)

    this.running = true
    Tone.Transport.start()
  }

  setIntervalSeconds(nextIntervalSeconds: number) {
    this.intervalSeconds = Math.max(0.02, nextIntervalSeconds)
    if (!this.running) return
    if (this.repeatId !== null) {
      Tone.Transport.clear(this.repeatId)
      this.repeatId = null
    }
    this.repeatId = Tone.Transport.scheduleRepeat((time) => {
      this.stepAtTime(time)
    }, this.intervalSeconds)
  }

  private stepAtTime(time: number) {
    if (this.seq.length === 0) return

    const i = this.index % this.seq.length
    const note = this.seq[i]
    const next = this.seq[(i + 1) % this.seq.length]

    const g = velocityToGain(note.velocity01) * this.master
    this.gain.gain.setValueAtTime(this.gain.gain.value, time)
    this.gain.gain.linearRampToValueAtTime(g, time + Math.min(0.03, this.intervalSeconds * 0.35))

    this.osc.frequency.setValueAtTime(note.freqHz, time)
    this.osc.frequency.linearRampToValueAtTime(next.freqHz, time + this.intervalSeconds)

    if (this.onStep) {
      Tone.Draw.schedule(() => this.onStep?.(i), time)
    }

    this.index++
  }

  stop() {
    if (!this.running && this.repeatId === null) return

    const now = Tone.now()
    this.gain.gain.cancelAndHoldAtTime(now)
    this.gain.gain.linearRampToValueAtTime(0, now + 0.03)

    Tone.Transport.stop()
    Tone.Transport.cancel(0)

    if (this.repeatId !== null) {
      Tone.Transport.clear(this.repeatId)
      this.repeatId = null
    }

    this.running = false
  }

  dispose() {
    this.stop()
    this.osc.dispose()
    this.gain.dispose()
  }
}

