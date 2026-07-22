import React, { useCallback } from "react";
import { useRadioGroup } from "@/hooks/useRadioGroup";
import { KatexFormula } from "./KatexFormula";

/**
 * SelectGrid — 公式/选项选择网格组件（Pattern B + C）。
 *
 * Pattern B（outline）：`border-primary-500 bg-primary-50 text-primary-700` 选中
 * Pattern C（filled）：`bg-primary-500 text-white` 选中
 *
 * a11y：radiogroup + roving tabindex，
 *   direction="linear"（columns=1）：← → 线性移动
 *   direction="grid"（columns≥2）：← → ↑ ↓ 网格移动
 *
 * 使用约定：同一实例内的 item 应保持 description 有无一致，
 * 避免部分有 description 部分没有导致行高参差不齐。
 */

interface SelectGridItem {
  key: string;
  /** 必填，用于无障碍朗读（aria-label） */
  label: string;
  /** 可选，KaTeX 公式渲染 */
  formula?: string;
  /** 可选，label/formula 下方的小字说明 */
  description?: string;
  /** 可选，该项独占一行（col-span-2），用于 2+1 等非标准布局 */
  fullWidth?: boolean;
}

type SelectColor = "primary" | "success";

interface SelectGridProps {
  items: SelectGridItem[];
  value: string;
  onChange: (key: string) => void;
  /** outline = Pattern B（浅底边框），filled = Pattern C（实心填充） */
  variant?: "outline" | "filled";
  /** 色板 key，默认 primary */
  color?: SelectColor;
  /** 列数，默认 2 */
  columns?: 2 | 3;
  className?: string;
}

type SelectVariant = "outline" | "filled";

const COLOR_STYLES: Record<
  SelectColor,
  { selected: Record<SelectVariant, string>; unselected: string; hover: string }
> = {
  primary: {
    selected: {
      outline: "border-primary-500 bg-primary-50 text-primary-700 font-bold",
      filled: "bg-primary-500 text-white border-primary-500 shadow-sm",
    },
    unselected: "border-neutral-200 bg-white text-neutral-600",
    hover: "hover:border-neutral-300",
  },
  success: {
    selected: {
      outline: "border-success-500 bg-success-50 text-success-700 font-bold",
      filled: "bg-success-600 text-white border-success-600 shadow-sm",
    },
    unselected: "border-neutral-200 bg-white text-neutral-600",
    hover: "hover:border-success-300",
  },
};

export const SelectGrid: React.FC<SelectGridProps> = ({
  items,
  value,
  onChange,
  variant = "outline",
  color = "primary",
  columns = 2,
  className = "",
}) => {
  const keys = items.map((i) => i.key);
  const { getItemProps, registerRef } = useRadioGroup({
    value,
    keys,
    onChange,
    direction: columns >= 2 ? "grid" : "linear",
    columns,
  });

  const setRef = useCallback(
    (key: string) => (el: HTMLButtonElement | null) => {
      registerRef(key, el);
    },
    [registerRef],
  );

  const colorStyle = COLOR_STYLES[color];

  const gridClass =
    columns === 3 ? "grid grid-cols-3 gap-1.5" : "grid grid-cols-2 gap-1.5";

  return (
    <div
      role="radiogroup"
      className={[gridClass, className].filter(Boolean).join(" ")}
    >
      {items.map((item) => {
        const isSelected = value === item.key;
        const itemProps = getItemProps(item.key);
        const selectedClass = isSelected
          ? colorStyle.selected[variant]
          : colorStyle.unselected;
        const hoverClass = isSelected ? "" : colorStyle.hover;
        const spanClass = item.fullWidth ? "col-span-2" : "";

        const ariaLabel = item.description
          ? `${item.label}, ${item.description}`
          : item.label;

        return (
          <button
            key={item.key}
            ref={setRef(item.key)}
            {...itemProps}
            aria-label={ariaLabel}
            onClick={() => onChange(item.key)}
            className={[
              "py-1 px-2 text-[11px] font-semibold border rounded-md transition-all",
              selectedClass,
              hoverClass,
              spanClass,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className={item.description ? "flex flex-col gap-0.5" : ""}>
              {item.formula ? (
                <KatexFormula
                  formula={item.formula}
                  mode="inline"
                  className="!text-[11px] !my-0"
                />
              ) : (
                item.label
              )}
              {item.description && (
                <span className="text-[10px] opacity-70">
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
