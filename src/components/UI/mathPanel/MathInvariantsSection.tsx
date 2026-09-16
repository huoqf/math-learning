import React, { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { KatexFormula } from "../KatexFormula";
import { hasLatex, renderMixedLatex, toPlainMathText } from "./mathPanelUtils";

export interface MathQuantity {
  label: string;
  symbol?: string;
  value: number | string;
  unit?: string;
  color?: string;
  highlight?: "positive" | "negative" | "zero" | "extreme";
  /** 是否为定值不变量（如黄金比例、定长、定值、定点坐标） */
  isInvariant?: boolean;
  invariantNote?: string;
}

interface MathInvariantsSectionProps {
  quantities: MathQuantity[];
}

export const MathInvariantsSection: React.FC<MathInvariantsSectionProps> = ({
  quantities,
}) => {
  const [open, setOpen] = useState(true);

  if (!quantities || quantities.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-semibold text-neutral-600 mb-2 hover:text-neutral-900 transition-colors focus:outline-none cursor-pointer border-b border-neutral-100 pb-1.5"
      >
        <div className="flex items-center gap-1.5">
          <span>几何特征量与代数解</span>
          <span className="text-[10px] text-neutral-400 font-normal">
            ({quantities.length} 项)
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-fast ease-standard ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div className="grid grid-cols-2 gap-1.5">
          {quantities.map((q, index) => {
            const valStr =
              typeof q.value === "string" ? q.value : String(q.value);
            const isLongSymbol = Boolean(
              q.symbol &&
              (q.symbol.length > 8 ||
                /\\(frac|tan|sin|cos|sqrt|over|sum|int)|=/.test(q.symbol)),
            );
            const isLongValue =
              valStr.length > 12 ||
              /\\(frac|tan|sin|cos|sqrt|text|begin|aligned)|=|,/.test(valStr);
            const isWide = isLongSymbol || isLongValue || q.label.length > 8;

            return (
              <div
                key={index}
                className={`flex flex-col justify-between p-2 rounded-lg bg-white border shadow-2xs hover:border-neutral-200 transition-colors gap-1 ${
                  q.isInvariant
                    ? "border-emerald-300/80 bg-emerald-50/25 ring-1 ring-emerald-200/50"
                    : "border-neutral-100"
                } ${isWide ? "col-span-2" : "col-span-1"}`}
              >
                <div className="flex items-center justify-between gap-1 min-w-0">
                  <div className="flex items-center gap-1 min-w-0">
                    {q.symbol && (
                      <span
                        className="font-semibold shrink-0 text-[11px] px-1 py-0.5 rounded font-mono"
                        style={{
                          backgroundColor: q.color ? `${q.color}15` : "#f3f4f6",
                          color: q.color ?? "#374151",
                        }}
                      >
                        {hasLatex(q.symbol) ? (
                          /*
                           * 符号徽标必须关闭自适应缩放。
                           * 该 <span> 为 shrink-0 且按内容定宽，其可用宽度恒等于公式自然宽度，
                           * 于是 (containerWidth - 4) / contentWidth 的固定 4px 安全余量
                           * 在 4~14px 的徽标上占比极高，会把 11px 符号误判为"放不下"并压到硬底线（约 6px）。
                           * 徽标本就按内容排版、不做收缩，缩放对其是纯损害 —— 直接按自然尺寸渲染。
                           */
                          <KatexFormula
                            formula={q.symbol}
                            mode="inline"
                            responsive={false}
                            className="!text-[11px]"
                          />
                        ) : (
                          q.symbol
                        )}
                      </span>
                    )}
                    <span
                      className="text-[11px] text-neutral-600 font-medium truncate"
                      title={toPlainMathText(q.label)}
                    >
                      {/* 单行省略号标题：公式保持自然字号，由文本省略号负责截断 */}
                      {renderMixedLatex(q.label, { responsive: false })}
                    </span>
                  </div>
                  {q.isInvariant && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0 flex items-center gap-0.5 shadow-3xs">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                      定值不变量
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-end gap-1 overflow-hidden pt-0.5">
                  <span
                    className="font-bold text-xs min-w-0"
                    style={{ color: q.color ?? "#1f2937" }}
                  >
                    {typeof q.value === "number"
                      ? q.value
                      : hasLatex(valStr) && !valStr.includes("$")
                        ? /*
                           * 整串纯 LaTeX 走 KatexFormula 行内渲染。
                           * 外层 span 已加 min-w-0，flex 布局下可准确测量容器可用宽并触发自适应缩放。
                           * 含 $...$ 的串不可走此分支——定界符在数学模式中非法，
                           * 会让 KaTeX 退回「错误源码」显示，必须先用 renderMixedLatex 按定界符切分。
                           */
                          (() => {
                            // 极短单一符号/数值（例如 \hat{b}、\pi、x_0、k 等）本身宽度仅数像素，
                            // 绝无容器溢出风险，关闭自适应缩放以彻底杜绝微型容器下的误判缩放。
                            const isShortSymbol =
                              valStr.length <= 8 &&
                              !/[=+\-*/]/.test(valStr) &&
                              !valStr.includes("\\frac") &&
                              !valStr.includes("\\sqrt");
                            return (
                              <KatexFormula
                                formula={valStr}
                                mode="inline"
                                responsive={!isShortSymbol}
                                className="!text-xs max-w-full"
                              />
                            );
                          })()
                        : renderMixedLatex(valStr)}
                  </span>
                  {q.unit && (
                    <span className="text-[10px] text-neutral-400 font-normal">
                      {renderMixedLatex(q.unit, { responsive: false })}
                    </span>
                  )}
                </div>
                {q.invariantNote && (
                  <div className="text-[10px] text-emerald-700 bg-emerald-50/60 rounded px-1.5 py-0.5 mt-0.5 border border-emerald-100 leading-tight">
                    {renderMixedLatex(q.invariantNote)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
