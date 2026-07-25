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
  className = "",
}) => {
  return (
    <label
      className={[
        "flex items-center justify-between gap-2 cursor-pointer select-none",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="text-[11px] font-medium text-neutral-600 truncate">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={[
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1",
          checked ? "bg-primary-500" : "bg-neutral-300",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </label>
  );
};
