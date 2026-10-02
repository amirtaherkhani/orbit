import type { DataPoint } from "@/types/dashboard"

const MAX_POINTS = 60

type StreamState = {
  points: DataPoint[]
  listeners: Set<() => void>
  timer: ReturnType<typeof setInterval> | null
  tick: number
}

class LiveStreamStore {
  private readonly streams = new Map<string, StreamState>()

  private ensure(streamKey: string, seed: DataPoint[]) {
    const current = this.streams.get(streamKey)
    if (current) return current

    const created: StreamState = {
      points: seed.slice(-MAX_POINTS),
      listeners: new Set(),
      timer: null,
      tick: 0,
    }
    this.streams.set(streamKey, created)
    return created
  }

  private advance(stream: StreamState) {
    const previous = stream.points.at(-1)?.value ?? 1000
    const wave = Math.sin(stream.tick / 2.8) * 42
    const noise = (Math.random() - 0.5) * 70
    const value = Math.max(0, previous * 0.78 + 270 + wave + noise)
    const nextPoint: DataPoint = {
      label: new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date()),
      timestamp: new Date().toISOString(),
      value: Math.round(value),
    }

    stream.tick += 1
    stream.points = [...stream.points, nextPoint].slice(-MAX_POINTS)
    stream.listeners.forEach((notify) => notify())
  }

  getSnapshot(streamKey: string, seed: DataPoint[]) {
    return this.ensure(streamKey, seed).points
  }

  subscribe(streamKey: string, seed: DataPoint[], listener: () => void) {
    const stream = this.ensure(streamKey, seed)
    stream.listeners.add(listener)

    if (!stream.timer) {
      stream.timer = setInterval(() => {
        this.advance(stream)
      }, 1_000)
    }

    return () => {
      stream.listeners.delete(listener)
      if (stream.listeners.size === 0 && stream.timer) {
        clearInterval(stream.timer)
        stream.timer = null
      }
    }
  }

  refresh(streamKey: string, seed: DataPoint[]) {
    this.advance(this.ensure(streamKey, seed))
  }
}

export const liveStreamStore = new LiveStreamStore()
