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
  className?: string;
}

export const TabSwitcher = <T extends string = string>({
  tabs,
  value,
  onChange,
  layout = "vertical",
  className = "",
}: TabSwitcherProps<T>) => {
  const keys = tabs.map((t) => t.key);
  const { getItemProps, registerRef } = useRadioGroup({
    value,
    keys,
    onChange: onChange as (key: string) => void,
    direction: "linear",
  });

  const setRef = useCallback(
    (key: string) => (el: HTMLButtonElement | null) => {
      registerRef(key, el);
    },
    [registerRef],
  );

  const isHorizontal = layout === "horizontal";

  const containerClass = isHorizontal
    ? "grid grid-flow-col auto-cols-fr bg-neutral-100 p-1 rounded-xl gap-1"
    : "flex flex-col bg-neutral-100 p-1.5 rounded-xl gap-1";

  return (
    <div
      role="radiogroup"
      className={[containerClass, className].filter(Boolean).join(" ")}
    >
      {tabs.map((tab) => {
        const isSelected = value === tab.key;
        const itemProps = getItemProps(tab.key);
        return (
          <button
            key={tab.key}
            ref={setRef(tab.key)}
            {...itemProps}
            onClick={() => onChange(tab.key as T)}
            className={[
              "py-2 px-2 text-xs font-bold rounded-lg transition-all duration-200 whitespace-nowrap overflow-hidden text-center",
              isHorizontal ? "flex justify-center items-center" : "text-left",
              isSelected
                ? "bg-white text-primary-600 shadow-md ring-1 ring-primary-200"
                : "text-neutral-500 hover:text-neutral-700 hover:bg-white/50",
            ].join(" ")}
          >
            <div
              className={[
                "flex flex-row items-center gap-1.5 w-full",
                isHorizontal ? "justify-center text-center" : "",
              ].join(" ")}
            >
              <span className="text-[12px] font-bold leading-tight whitespace-nowrap truncate">
                {tab.label}
              </span>
              {tab.formula && (
                <span className="whitespace-nowrap opacity-80">
                  <KatexFormula
                    formula={tab.formula}
                    mode="inline"
                    className="!text-[11px] !my-0 !mx-0"
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
