import React, { useCallback } from "react";
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

interface TabSwitcherProps {
  tabs: TabSwitcherTab[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  tabs,
  value,
  onChange,
  className = "",
}) => {
  const keys = tabs.map((t) => t.key);
  const { getItemProps, registerRef } = useRadioGroup({
    value,
    keys,
    onChange,
    direction: "linear",
  });

  const setRef = useCallback(
    (key: string) => (el: HTMLButtonElement | null) => {
      registerRef(key, el);
    },
    [registerRef],
  );

  return (
    <div
      role="radiogroup"
      className={[
        "flex flex-col bg-neutral-100 p-1.5 rounded-xl gap-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {tabs.map((tab) => {
        const isSelected = value === tab.key;
        const itemProps = getItemProps(tab.key);
        return (
          <button
            key={tab.key}
            ref={setRef(tab.key)}
            {...itemProps}
            onClick={() => onChange(tab.key)}
            className={[
              "py-2 px-3 text-xs font-bold rounded-lg transition-all duration-200 whitespace-nowrap overflow-hidden text-left",
              isSelected
                ? "bg-white text-primary-600 shadow-md ring-1 ring-primary-200"
                : "text-neutral-500 hover:text-neutral-700 hover:bg-white/50",
            ].join(" ")}
          >
            <div className="flex flex-row items-center gap-2 w-full">
              <span className="text-[12px] font-bold leading-tight whitespace-nowrap">
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
