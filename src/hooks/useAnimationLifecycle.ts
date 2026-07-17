import { useRef, useState, useCallback, useEffect } from 'react'

export interface UseAnimationLifecycleOptions {
  /** 动画总时长（毫秒），默认 5000 */
  duration?: number
  /** 是否自动开始播放，默认 false */
  autoPlay?: boolean
  /** 循环播放，默认 true */
  loop?: boolean
}

export interface AnimationLifecycleResult {
  /** 当前时间（毫秒），范围 [0, duration] */
  time: number
  /** 动画总时长（毫秒） */
  duration: number
  /** 归一化进度 [0, 1] */
  progress: number
  /** 是否正在播放 */
  isPlaying: boolean
  /** 开始/恢复播放 */
  play: () => void
  /** 暂停播放 */
  pause: () => void
  /** 切换播放/暂停 */
  toggle: () => void
  /** 重置到起始位置 */
  reset: () => void
  /** 跳转到指定时间（毫秒） */
  seek: (time: number) => void
  /** 跳转到指定进度 [0, 1] */
  seekProgress: (progress: number) => void
}

export function useAnimationLifecycle(
  options: UseAnimationLifecycleOptions = {}
): AnimationLifecycleResult {
  const { duration = 5000, autoPlay = false, loop = true } = options

  const [time, setTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)

  const rafRef = useRef<number>(0)
  const lastTickRef = useRef<number>(0)
  const timeRef = useRef(0)

  // 保持 timeRef 同步
  useEffect(() => {
    timeRef.current = time
  }, [time])

  const tick = useCallback(() => {
    const now = performance.now()
    const delta = lastTickRef.current ? now - lastTickRef.current : 0
    lastTickRef.current = now

    let next = timeRef.current + delta

    if (next >= duration) {
      if (loop) {
        next = next % duration
      } else {
        next = duration
        setIsPlaying(false)
        setTime(duration)
        return
      }
    }

    setTime(next)
    rafRef.current = requestAnimationFrame(tick)
  }, [duration, loop])

  // 播放状态变化时管理 RAF
  useEffect(() => {
    if (isPlaying) {
      lastTickRef.current = 0
      rafRef.current = requestAnimationFrame(tick)
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isPlaying, tick])

  const play = useCallback(() => setIsPlaying(true), [])
  const pause = useCallback(() => setIsPlaying(false), [])
  const toggle = useCallback(() => setIsPlaying((p) => !p), [])

  const reset = useCallback(() => {
    setIsPlaying(false)
    setTime(0)
    timeRef.current = 0
  }, [])

  const seek = useCallback(
    (t: number) => {
      const clamped = Math.max(0, Math.min(duration, t))
      timeRef.current = clamped
      setTime(clamped)
    },
    [duration]
  )

  const seekProgress = useCallback(
    (p: number) => {
      seek(Math.max(0, Math.min(1, p)) * duration)
    },
    [seek, duration]
  )

  return {
    time,
    duration,
    progress: duration > 0 ? time / duration : 0,
    isPlaying,
    play,
    pause,
    toggle,
    reset,
    seek,
    seekProgress,
  }
}
