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
  /** 排版模式：grid（网格对齐，默认）| flow（流式胶囊，按文字长度弹性并排） */
  layout?: "grid" | "flow";
  /** 列数（仅 grid 模式有效），默认 2，支持 1/2/3 或 "auto" 智能自适应 */
  columns?: 1 | 2 | 3 | "auto";
  /** 尺寸紧凑度，默认 normal */
  size?: "normal" | "compact";
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
        "border-primary-500 bg-primary-50/80 text-primary-700 font-bold shadow-xs ring-1 ring-primary-500/25",
      filled:
        "bg-primary-600 text-white border-primary-600 shadow-xs ring-1 ring-primary-600/25",
    },
    unselected: "border-neutral-200/90 bg-white text-neutral-600",
    hover:
      "hover:border-primary-300 hover:bg-primary-50/40 hover:text-neutral-800",
  },
  success: {
    selected: {
      outline:
        "border-success-500 bg-success-50/80 text-success-700 font-bold shadow-xs ring-1 ring-success-500/25",
      filled:
        "bg-success-600 text-white border-success-600 shadow-xs ring-1 ring-success-600/25",
    },
    unselected: "border-neutral-200/90 bg-white text-neutral-600",
    hover:
      "hover:border-success-300 hover:bg-success-50/40 hover:text-neutral-800",
  },
};

export const SelectGrid = <T extends string = string>({
  items,
  value,
  onChange,
  variant = "outline",
  color = "primary",
  layout = "grid",
  columns = 2,
  size = "normal",
  className = "",
}: SelectGridProps<T>) => {
  const isFlow = layout === "flow";

  // 智能解析最终列数（防止选项过多或文本较长时生硬挤成 3 列）
  const resolvedColumns = useMemo(() => {
    if (isFlow) return 1;
    if (typeof columns === "number") {
      // 熔断保护：在左屏窄宽下，若显式传 columns=3 但存在中长标题（>4字），自动降为 2 列防止挤爆
      if (columns === 3 && items.some((it) => (it.label?.length ?? 0) > 4)) {
        return 2;
      }
      return columns;
    }

    const hasExtremelyLongContent = items.some(
      (item) =>
        (item.label && item.label.length > 9) ||
        (item.description && item.description.length > 12) ||
        (item.formula &&
          (item.formula.includes("\\frac") || item.formula.length > 18)),
    );

    return hasExtremelyLongContent ? 1 : 2;
  }, [columns, isFlow, items]);

  const keys = items.map((i) => i.key);
  const { getItemProps, registerRef } = useRadioGroup({
    value,
    keys,
    onChange: onChange as (key: string) => void,
    direction: isFlow ? "linear" : resolvedColumns >= 2 ? "grid" : "linear",
    columns: isFlow ? 1 : resolvedColumns,
  });

  const setRef = useCallback(
    (key: string) => (el: HTMLButtonElement | null) => {
      registerRef(key, el);
    },
    [registerRef],
  );

  const colorStyle = COLOR_STYLES[color];
  const isCompact = size === "compact";

  // 容器样式：flow 模式采用自适应包裹；grid 模式按列排布
  const containerClass = isFlow
    ? "flex flex-wrap gap-1.5 items-stretch"
    : resolvedColumns === 3
      ? "grid grid-cols-3 gap-1.5 items-stretch"
      : resolvedColumns === 1
        ? "grid grid-cols-1 gap-1.5 items-stretch"
        : "grid grid-cols-2 gap-1.5 items-stretch";

  return (
    <div
      role="radiogroup"
      className={[containerClass, className].filter(Boolean).join(" ")}
    >
      {items.map((item) => {
        const isSelected = value === item.key;
        const itemProps = getItemProps(item.key);
        const selectedClass = isSelected
          ? colorStyle.selected[variant]
          : colorStyle.unselected;
        const hoverClass = isSelected ? "" : colorStyle.hover;
        const isFullWidth = item.fullWidth && resolvedColumns >= 2 && !isFlow;
        const spanClass = isFullWidth ? "col-span-2" : "";

        const ariaLabel = item.description
          ? `${item.label || item.formula || item.key}, ${item.description}`
          : item.label || item.formula || item.key;

        const labelLength = item.label ? item.label.length : 0;
        // 3 级字符自适应字阶
        const labelTextClass =
          labelLength <= 4
            ? "text-xs font-bold leading-tight"
            : labelLength <= 7
              ? "text-[11px] font-semibold leading-snug tracking-tight"
              : "text-[10px] font-medium leading-tight tracking-tighter";

        // 按钮高度与 padding：flow 模式弹性胶囊；通栏项更轻薄；常规双列自适应
        const buttonPadding = isFlow
          ? "py-1 px-2.5"
          : isFullWidth
            ? "py-1 px-2"
            : isCompact
              ? "py-1 px-1.5"
              : "py-1.5 px-2";

        const minHeightClass = isFlow
          ? "min-h-[28px]"
          : isFullWidth
            ? "min-h-[30px]"
            : isCompact
              ? "min-h-[32px]"
              : "min-h-[36px]";

        const flowFlexClass = isFlow ? "flex-1 min-w-[70px] max-w-full" : "";

        return (
          <button
            key={item.key}
            ref={setRef(item.key)}
            {...itemProps}
            aria-label={ariaLabel}
            onClick={() => onChange(item.key as T)}
            className={[
              buttonPadding,
              minHeightClass,
              flowFlexClass,
              "text-[11px] font-semibold border rounded-lg transition-all duration-150 flex flex-col items-center justify-center cursor-pointer select-none active:scale-[0.98]",
              selectedClass,
              hoverClass,
              spanClass,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div
              className={[
                "flex items-center justify-center gap-0.5 text-center w-full",
                isFullWidth ? "flex-row gap-2" : "flex-col",
              ].join(" ")}
            >
              {item.label && (
                <span
                  className={[
                    labelTextClass,
                    "break-words whitespace-normal text-center",
                    isFullWidth ? "leading-normal" : "w-full",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              )}
              {item.formula && (
                <div
                  className={[
                    "flex items-center justify-center opacity-90 py-0.5",
                    isFullWidth
                      ? "shrink-0"
                      : "w-full overflow-x-auto overflow-y-hidden",
                  ].join(" ")}
                >
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
