import { useCallback } from "react";
import { useRadioGroup } from "@/hooks/useRadioGroup";
import { KatexFormula } from "./KatexFormula";

/**
 * TabSwitcher — 灰底容器内的轻量级 Tab 切换组件（Pattern A）。
 *
 * 设计层级：Pattern A（最轻量），用于顶层模式切换或 Section 内嵌模式选择。
 *
 * 关于 Transform 页面的用法：
 * Transform 的"翻折模式"（无翻折/整体/自变量）虽在 Section 内部，
 * 但因其改变整个可视化计算逻辑（全局影响），语义上是"模式"而非"选项"，
 * 故使用 Pattern A 而非 Pattern B/C。如果未来有类似"Section 内但全局影响"
 * 的选择场景，可复用此模式。
 *
 * a11y：radiogroup + roving tabindex，方向键 ← → 线性移动。
 */

interface TabSwitcherTab {
  key: string;
  label: string;
  formula?: string;
}

interface TabSwitcherProps<T extends string = string> {
  tabs: TabSwitcherTab[];
  value: T;
  onChange: (key: T) => void;
  /** 布局方向：vertical(默认单列纵向) | horizontal(单行横向并列) */
  layout?: "vertical" | "horizontal";
  /** 尺寸紧凑度，默认 normal */
  size?: "normal" | "compact";
  className?: string;
}

export const TabSwitcher = <T extends string = string>({
  tabs,
  value,
  onChange,
  layout = "vertical",
  size = "normal",
  className = "",
}: TabSwitcherProps<T>) => {
  const isHorizontal = layout === "horizontal";
  const isCompact = size === "compact";
  // 熔断保护：若横向模式下选项 >= 4 项，在左屏窄屏下强制分流为 2 列网格，防止 4 项挤爆
  const isHorizontalGrid = isHorizontal && tabs.length >= 4;
  const keys = tabs.map((t) => t.key);

  const { getItemProps, registerRef } = useRadioGroup({
    value,
    keys,
    onChange: onChange as (key: string) => void,
    direction: isHorizontalGrid ? "grid" : "linear",
    columns: isHorizontalGrid ? 2 : undefined,
  });

  const setRef = useCallback(
    (key: string) => (el: HTMLButtonElement | null) => {
      registerRef(key, el);
    },
    [registerRef],
  );

  const containerClass = isHorizontalGrid
    ? "grid grid-cols-2 bg-neutral-100/90 p-1 rounded-lg gap-1"
    : isHorizontal
      ? "grid grid-flow-col auto-cols-fr bg-neutral-100/90 p-1 rounded-lg gap-1"
      : "flex flex-col bg-neutral-100/90 p-1 rounded-lg gap-1";

  const btnPadding = isCompact
    ? "py-1 px-1.5"
    : isHorizontalGrid
      ? "py-1.5 px-2"
      : isHorizontal
        ? tabs.length >= 3
          ? "py-1 px-1"
          : "py-1.5 px-2"
        : "py-1.5 px-2";

  return (
    <div
      role="radiogroup"
      className={[containerClass, className].filter(Boolean).join(" ")}
    >
      {tabs.map((tab) => {
        const isSelected = value === tab.key;
        const itemProps = getItemProps(tab.key);
        const titleLength = tab.label.length;
        const labelSizeClass =
          isHorizontal && tabs.length >= 3
            ? titleLength > 5
              ? "text-[10.5px] leading-tight"
              : "text-[11px] leading-tight"
            : isCompact
              ? "text-[11px] leading-tight"
              : "text-xs leading-snug";

        return (
          <button
            key={tab.key}
            ref={setRef(tab.key)}
            {...itemProps}
            onClick={() => onChange(tab.key as T)}
            className={[
              btnPadding,
              "font-bold rounded-md transition-all duration-150 text-center min-w-0 cursor-pointer select-none active:scale-[0.98]",
              isHorizontal ? "flex justify-center items-center" : "text-left",
              isSelected
                ? "bg-white text-primary-700 shadow-xs ring-1 ring-black/5"
                : "text-neutral-500 hover:text-neutral-800 hover:bg-white/60",
            ].join(" ")}
          >
            <div
              className={[
                "flex flex-row items-center gap-1 min-w-0",
                isHorizontal
                  ? "justify-center text-center w-full flex-wrap"
                  : "w-full",
              ].join(" ")}
            >
              <span
                className={[
                  labelSizeClass,
                  "font-bold break-words",
                  isHorizontal ? "text-center" : "",
                ].join(" ")}
              >
                {tab.label}
              </span>
              {tab.formula && (
                <span className="opacity-80 shrink-0">
                  <KatexFormula
                    formula={tab.formula}
                    mode="inline"
                    className="!text-[10px] !my-0 !mx-0"
                  />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
