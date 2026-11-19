import { useState, useEffect, useRef, useCallback } from "react";

export type PlayLoopMode = "loop" | "bounce";

export interface UseParamPlayOptions {
  /** 扫掠最小值 */
  min: number;
  /** 扫掠最大值 */
  max: number;
  /** 基础速率（单位/秒，默认 (max - min) / 6 即约 6 秒跑完单程） */
  ratePerSecond?: number;
  /** 步长对齐精度（不传则连续平滑变化） */
  step?: number;
  /** 循环模式："loop" 到达上界回起点，"bounce" 到达边界反向折返 */
  mode?: PlayLoopMode;
  /** 获取当前最新参数值 */
  getValue: () => number;
  /** 参数变更回调 */
  onChange: (nextVal: number) => void;
}

export interface UseParamPlayResult {
  isPlaying: boolean;
  speed: number;
  setSpeed: (speed: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
}

/**
 * 通用参数自驱播放 Hook（requestAnimationFrame 驱动，全项目 2D/3D 页面复用）。
 */
export function useParamPlay({
  min,
  max,
  ratePerSecond,
  step,
  mode = "loop",
  getValue,
  onChange,
}: UseParamPlayOptions): UseParamPlayResult {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const dirRef = useRef<1 | -1>(1);
  const valRef = useRef<number>(getValue());
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const getValueRef = useRef(getValue);
  const onChangeRef = useRef(onChange);

  getValueRef.current = getValue;
  onChangeRef.current = onChange;

  const play = useCallback(() => {
    valRef.current = getValueRef.current();
    lastTimeRef.current = null;
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    lastTimeRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const toggle = useCallback(() => {
    setIsPlaying((prev) => {
      if (!prev) {
        valRef.current = getValueRef.current();
        lastTimeRef.current = null;
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const span = Math.max(1e-6, max - min);
    const baseRate = ratePerSecond ?? span / 6;

    const tick = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }
      const dt = Math.min(0.08, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      let next = valRef.current + dirRef.current * baseRate * speed * dt;
      if (mode === "loop") {
        if (next > max) next = min + ((next - min) % span);
        else if (next < min) next = max - ((min - next) % span);
      } else {
        if (next >= max) {
          next = max;
          dirRef.current = -1;
        } else if (next <= min) {
          next = min;
          dirRef.current = 1;
        }
      }

      valRef.current = next;
      const out =
        step && step > 0
          ? Number((Math.round(next / step) * step).toFixed(4))
          : Number(next.toFixed(4));
      const clampedOut = Math.max(min, Math.min(max, out));
      onChangeRef.current(clampedOut);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimeRef.current = null;
    };
  }, [isPlaying, min, max, ratePerSecond, step, mode, speed]);

  return { isPlaying, speed, setSpeed, play, pause, toggle };
}
