import { useEffect, useMemo, useRef, useState } from 'react'
import type { Point } from '../utils/mathEngine'

type Props = {
  points: Point[]
  activeIndex: number | null
  className?: string
}

type Bounds = { xMin: number; xMax: number; yMin: number; yMax: number }

function getBounds(points: Point[]): Bounds {
  let xMin = Infinity
  let xMax = -Infinity
  let yMin = Infinity
  let yMax = -Infinity
  for (const p of points) {
    xMin = Math.min(xMin, p.x)
    xMax = Math.max(xMax, p.x)
    yMin = Math.min(yMin, p.y)
    yMax = Math.max(yMax, p.y)
  }
  if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin === xMax) {
    xMin = -1
    xMax = 1
  }
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
    yMin = -1
    yMax = 1
  }
  const yPad = (yMax - yMin) * 0.08
  return { xMin, xMax, yMin: yMin - yPad, yMax: yMax + yPad }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function lerpBounds(a: Bounds, b: Bounds, t: number): Bounds {
  return {
    xMin: lerp(a.xMin, b.xMin, t),
    xMax: lerp(a.xMax, b.xMax, t),
    yMin: lerp(a.yMin, b.yMin, t),
    yMax: lerp(a.yMax, b.yMax, t),
  }
}

export function GraphCanvas({ points, activeIndex, className }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const bounds = useMemo(() => getBounds(points), [points])
  const [sizeTick, setSizeTick] = useState(0)
  const prevPointsRef = useRef<Point[]>([])
  const [enterFlip, setEnterFlip] = useState(false)
  const animRef = useRef<{
    from: Point[]
    to: Point[]
    startMs: number
    durationMs: number
    fromBounds: Bounds
    toBounds: Bounds
  } | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const ro = new ResizeObserver(() => setSizeTick((v) => v + 1))
    ro.observe(parent)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const prev = prevPointsRef.current
    const next = points
    if (prev === next && prev.length > 0) return

    const from = prev.length > 0 ? prev : next
    const to = next
    animRef.current = {
      from,
      to,
      startMs: performance.now(),
      durationMs: 1200,
      fromBounds: getBounds(from),
      toBounds: getBounds(to),
    }
    prevPointsRef.current = next
    setEnterFlip((v) => !v)
  }, [points])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let lastStablePoints = points

    const draw = (nowMs: number) => {
      const dpr = window.devicePixelRatio || 1
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (canvas.width !== w) canvas.width = w
      if (canvas.height !== h) canvas.height = h

      const pad = Math.max(16 * dpr, Math.min(34 * dpr, w * 0.06))
      const plotW = w - pad * 2
      const plotH = h - pad * 2

      const anim = animRef.current
      let renderPoints = points
      let renderBounds = bounds
      let revealT = 1

      if (anim) {
        const tRaw = Math.min(1, Math.max(0, (nowMs - anim.startMs) / anim.durationMs))
        const t = easeInOutCubic(tRaw)
        // Reveal at a steadier pace than the morphing ease.
        revealT = tRaw

        const n = Math.max(2, anim.to.length)
        const from = anim.from.length === n ? anim.from : anim.from.slice(0, n)
        const to = anim.to.length === n ? anim.to : anim.to.slice(0, n)

        const blended: Point[] = []
        for (let i = 0; i < n; i++) {
          const fp = from[i] ?? from[from.length - 1] ?? { x: i, y: 0 }
          const tp = to[i] ?? to[to.length - 1] ?? { x: i, y: 0 }
          blended.push({ x: lerp(fp.x, tp.x, t), y: lerp(fp.y, tp.y, t) })
        }

        renderPoints = blended
        renderBounds = lerpBounds(anim.fromBounds, anim.toBounds, t)

        if (tRaw >= 1) {
          animRef.current = null
          lastStablePoints = points
        }
      } else {
        lastStablePoints = points
      }

      const xToPx = (x: number) =>
        pad + ((x - renderBounds.xMin) / (renderBounds.xMax - renderBounds.xMin)) * plotW
      const yToPx = (y: number) =>
        pad +
        (1 - (y - renderBounds.yMin) / (renderBounds.yMax - renderBounds.yMin)) * plotH

      ctx.clearRect(0, 0, w, h)
      // Keep the plot readable while letting the page video show through.
      ctx.fillStyle = 'rgba(2, 6, 23, 0.14)'
      ctx.fillRect(0, 0, w, h)

      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const gx = pad + (plotW * i) / 4
        const gy = pad + (plotH * i) / 4
        ctx.beginPath()
        ctx.moveTo(gx, pad)
        ctx.lineTo(gx, pad + plotH)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(pad, gy)
        ctx.lineTo(pad + plotW, gy)
        ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)'
      ctx.lineWidth = 1
      ctx.strokeRect(pad, pad, plotW, plotH)

      ctx.save()
      if (revealT < 1) {
        const revealW = Math.max(0, Math.min(plotW, plotW * revealT))
        ctx.beginPath()
        ctx.rect(pad, pad, revealW, plotH)
        ctx.clip()
      }

      if (renderPoints.length >= 2) {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.95)'
        ctx.lineWidth = 2.25 * dpr
        ctx.beginPath()
        ctx.moveTo(xToPx(renderPoints[0].x), yToPx(renderPoints[0].y))
        for (let i = 1; i < renderPoints.length; i++) {
          ctx.lineTo(xToPx(renderPoints[i].x), yToPx(renderPoints[i].y))
        }
        ctx.stroke()
      }

      if (activeIndex !== null && lastStablePoints.length > 0) {
        const i = Math.max(0, Math.min(lastStablePoints.length - 1, activeIndex))
        const p = lastStablePoints[i]
        const cx = xToPx(p.x)
        const cy = yToPx(p.y)

        ctx.fillStyle = 'rgba(236, 254, 255, 0.95)'
        ctx.beginPath()
        ctx.arc(cx, cy, 4.5 * dpr, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)'
        ctx.lineWidth = 2 * dpr
        ctx.beginPath()
        ctx.arc(cx, cy, 8.5 * dpr, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()

      if (animRef.current) {
        raf = requestAnimationFrame(draw)
      }
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [points, activeIndex, bounds, sizeTick])

  return (
    <canvas
      ref={ref}
      className={
        [
          className ??
            'h-[320px] w-full rounded-xl border border-slate-700/60 bg-slate-950/70',
          'block',
          enterFlip ? 'cc-graph-in-a' : 'cc-graph-in-b',
        ].join(' ')
      }
    />
  )
}

