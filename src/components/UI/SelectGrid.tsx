import { useCallback, useMemo } from "react";
import { useRadioGroup } from "@/hooks/useRadioGroup";
import { KatexFormula } from "./KatexFormula";

/**
 * SelectGrid — 公式/选项选择网格组件（Pattern B + C）。
 *
 * Pattern B（outline）：`border-primary-500 bg-primary-50 text-primary-700` 选中
 * Pattern C（filled）：`bg-primary-500 text-white` 选中
 *
 * 弹性排版特性：
 * - 显式优先：支持显式指定 columns (1 | 2 | 3)；支持 columns="auto" 智能选列
 * - 零截断保证：移除强制 whitespace-nowrap/truncate，长文本紧凑优雅折行
 * - 等高自适应：min-h 弹性高度，同一行卡片自动等高垂直居中对齐
 */

export interface SelectGridItem {
  key: string;
  /** 用于无障碍朗读（aria-label）。为空时使用 formula 作为 aria-label */
  label?: string;
  /** 可选，KaTeX 公式渲染 */
  formula?: string;
  /** 可选，label/formula 下方的小字说明 */
  description?: string;
  /** 可选，该项独占一行（col-span-2），用于 2+1 等非标准布局 */
  fullWidth?: boolean;
}

type SelectColor = "primary" | "success";

interface SelectGridProps<T extends string = string> {
  items: SelectGridItem[];
  value: T;
  onChange: (key: T) => void;
  /** outline = Pattern B（浅底边框），filled = Pattern C（实心填充） */
  variant?: "outline" | "filled";
  /** 色板 key，默认 primary */
  color?: SelectColor;
  /** 列数，默认 2，支持 1/2/3 或 "auto" 智能自适应 */
  columns?: 1 | 2 | 3 | "auto";
  className?: string;
}

type SelectVariant = "outline" | "filled";

const COLOR_STYLES: Record<
  SelectColor,
  { selected: Record<SelectVariant, string>; unselected: string; hover: string }
> = {
  primary: {
    selected: {
      outline:
        "border-primary-500 bg-primary-50 text-primary-700 font-bold shadow-sm",
      filled: "bg-primary-500 text-white border-primary-500 shadow-sm",
    },
    unselected: "border-neutral-200 bg-white text-neutral-600",
    hover: "hover:border-primary-300 hover:bg-primary-50/30",
  },
  success: {
    selected: {
      outline:
        "border-success-500 bg-success-50 text-success-700 font-bold shadow-sm",
      filled: "bg-success-600 text-white border-success-600 shadow-sm",
    },
    unselected: "border-neutral-200 bg-white text-neutral-600",
    hover: "hover:border-success-300 hover:bg-success-50/30",
  },
};

export const SelectGrid = <T extends string = string>({
  items,
  value,
  onChange,
  variant = "outline",
  color = "primary",
  columns = 2,
  className = "",
}: SelectGridProps<T>) => {
  // 智能解析最终列数（显式数字优先；auto 模式智能嗅探）
  const resolvedColumns = useMemo(() => {
    if (typeof columns === "number") return columns;

    // auto 模式智能检测：若含有长标题/长描述/复杂分式公式则自适应为 1 列
    const hasLongContent = items.some(
      (item) =>
        (item.label && item.label.length > 6) ||
        (item.description && item.description.length > 7) ||
        (item.formula &&
          (item.formula.includes("\\frac") || item.formula.length > 14)),
    );

    return hasLongContent ? 1 : 2;
  }, [columns, items]);

  const keys = items.map((i) => i.key);
  const { getItemProps, registerRef } = useRadioGroup({
    value,
    keys,
    onChange: onChange as (key: string) => void,
    direction: resolvedColumns >= 2 ? "grid" : "linear",
    columns: resolvedColumns,
  });

  const setRef = useCallback(
    (key: string) => (el: HTMLButtonElement | null) => {
      registerRef(key, el);
    },
    [registerRef],
  );

  const colorStyle = COLOR_STYLES[color];

  const gridClass =
    resolvedColumns === 3
      ? "grid grid-cols-3 gap-1.5"
      : resolvedColumns === 1
        ? "grid grid-cols-1 gap-1.5"
        : "grid grid-cols-2 gap-1.5";

  return (
    <div
      role="radiogroup"
      className={[gridClass, "items-stretch", className]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item) => {
        const isSelected = value === item.key;
        const itemProps = getItemProps(item.key);
        const selectedClass = isSelected
          ? colorStyle.selected[variant]
          : colorStyle.unselected;
        const hoverClass = isSelected ? "" : colorStyle.hover;
        const spanClass =
          item.fullWidth && resolvedColumns >= 2 ? "col-span-2" : "";

        const ariaLabel = item.description
          ? `${item.label || item.formula || item.key}, ${item.description}`
          : item.label || item.formula || item.key;

        return (
          <button
            key={item.key}
            ref={setRef(item.key)}
            {...itemProps}
            aria-label={ariaLabel}
            onClick={() => onChange(item.key as T)}
            className={[
              "py-2 px-2 text-[11px] font-semibold border-2 rounded-lg transition-all duration-200 min-h-[44px] h-full flex flex-col items-center justify-center cursor-pointer select-none",
              selectedClass,
              hoverClass,
              spanClass,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="flex flex-col items-center justify-center gap-0.5 text-center w-full">
              {item.label && (
                <span className="text-[12px] font-bold leading-snug break-words whitespace-normal w-full text-center">
                  {item.label}
                </span>
              )}
              {item.formula && (
                <div className="w-full flex items-center justify-center overflow-x-auto overflow-y-hidden opacity-90 py-0.5">
                  <KatexFormula
                    formula={item.formula}
                    mode="inline"
                    className="!text-[10px] !my-0 !mx-0 max-w-full"
                  />
                </div>
              )}
              {item.description && (
                <span className="text-[10px] opacity-75 leading-tight break-words whitespace-normal w-full text-center mt-0.5">
                  {item.description}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
