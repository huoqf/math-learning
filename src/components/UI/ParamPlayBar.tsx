import React from "react";
import { Play, Pause } from "lucide-react";

export interface ParamPlayBarProps {
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 切换播放/暂停 */
  onToggle: () => void;
  /** 动画操作提示标题 */
  label: string;
  /** 当前倍速 (0.5 / 1 / 2) */
  speed?: number;
  /** 倍速切换回调 */
  onSpeedChange?: (speed: number) => void;
  /** 可选第二个快捷动画动作 */
  secondaryAction?: {
    label: string;
    active: boolean;
    onToggle: () => void;
  };
}

/**
 * 通用左屏动画播放控制微条（搭配 useParamPlay 使用）。
 */
export const ParamPlayBar: React.FC<ParamPlayBarProps> = ({
  isPlaying,
  onToggle,
  label,
  speed = 1,
  onSpeedChange,
  secondaryAction,
}) => {
  const speeds = [0.5, 1, 2];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggle}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors ${
            isPlaying
              ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
              : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          }`}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          <span>{isPlaying ? `暂停 · ${label}` : label}</span>
        </button>

        {onSpeedChange && (
          <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
            {speeds.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeedChange(s)}
                className={`px-1.5 py-0.5 text-[11px] rounded font-medium transition-colors ${
                  speed === s
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        )}
      </div>

      {secondaryAction && (
        <button
          type="button"
          onClick={secondaryAction.onToggle}
          className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors ${
            secondaryAction.active
              ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
              : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
          }`}
        >
          {secondaryAction.active ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          <span>
            {secondaryAction.active
              ? `暂停 · ${secondaryAction.label}`
              : secondaryAction.label}
          </span>
        </button>
      )}
    </div>
  );
};
