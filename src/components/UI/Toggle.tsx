import React from "react";

interface ToggleProps {
  /** 标签文字 */
  label: string;
  /** 当前状态 */
  checked: boolean;
  /** 状态变更回调 */
  onChange: (checked: boolean) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 尺寸紧凑度，默认 normal */
  size?: "normal" | "compact";
  /** 额外样式类 */
  className?: string;
}

/**
 * Toggle 开关组件 — 单行紧凑型开关
 *
 * 替代双按钮 SelectGrid，节省左屏空间。
 *
 * @example
 * ```tsx
 * <Toggle label="显示特征线" checked={show} onChange={setShow} />
 * ```
 */
export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  size = "normal",
  className = "",
}) => {
  const isCompact = size === "compact";
  const trackClass = isCompact ? "h-4 w-7" : "h-5 w-9";
  const thumbClass = isCompact
    ? `h-2.5 w-2.5 ${checked ? "translate-x-3" : "translate-x-0.5"}`
    : `h-3.5 w-3.5 ${checked ? "translate-x-4" : "translate-x-0.5"}`;

  return (
    <label
      className={[
        "flex items-center justify-between gap-1.5 cursor-pointer select-none py-0.5",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="text-[11px] font-medium text-neutral-600 truncate flex-1 min-w-0">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={[
          "relative inline-flex shrink-0 items-center rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-400",
          trackClass,
          checked ? "bg-primary-500" : "bg-neutral-300/90",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block rounded-full bg-white shadow-xs transition-transform duration-150",
            thumbClass,
          ].join(" ")}
        />
      </button>
    </label>
  );
};
