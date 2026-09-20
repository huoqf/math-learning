import React, { useState } from "react";
import { Compass, ChevronDown } from "lucide-react";
import { KatexFormula } from "../KatexFormula";
import { renderMixedLatex } from "./mathPanelUtils";

export interface ReasoningStep {
  step: number;
  title: string;
  detail?: string;
  latex?: string;
  latexBlocks?: string[];
  rubric?: string;
}

interface MathReasoningSectionProps {
  steps: ReasoningStep[];
  /**
   * 聚焦步（1 起）。由左屏「高考标准解答分步走」驱动：
   * 命中步加主色描边并轻微放大，其余步降透明度，
   * 使学生一眼看到"现在写到第几步、这一步的采分点在哪"。
   */
  focusStep?: number;
}

export const MathReasoningSection: React.FC<MathReasoningSectionProps> = ({
  steps,
  focusStep,
}) => {
  const [open, setOpen] = useState(true);

  if (!steps || steps.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-semibold text-neutral-800 mb-2.5 hover:text-primary-700 transition-colors focus:outline-none cursor-pointer border-b border-primary-200 pb-1.5"
      >
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-primary-600" />
          <span>高考破题三步推演链</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary-100 text-primary-700 font-bold">
            解答通法
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-fast ease-standard ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      {/* 分值口径说明：解除「 drilldown 里各步分值累加 ≠ 页面标注的整题分值」造成的误解。
          各 builder 的 rubric 是**单问内部**的采分点拆分（如 4+5+4=13），
          而客观题页面走的是小题分制（如球类页 2 分制），两套口径互不等价。 */}
      {steps.some((s) => s.rubric) && (
        <p className="text-[10px] text-neutral-500 leading-relaxed mb-2">
          分步所列分值为
          <span className="text-neutral-600 font-semibold">
            单问内的采分点拆分
          </span>
          ， 累加不等于整题分值
        </p>
      )}
      {open && (
        <div className="space-y-2.5 transition-all duration-fast ease-standard">
          {steps.map((s, idx) => {
            const formulaList =
              s.latexBlocks && s.latexBlocks.length > 0
                ? s.latexBlocks.filter((f) => Boolean(f?.trim()))
                : s.latex
                  ? [s.latex]
                  : [];

            const isFocused = focusStep !== undefined && s.step === focusStep;
            const isDimmed = focusStep !== undefined && !isFocused;

            return (
              <div
                key={idx}
                data-focus-step={isFocused ? "true" : undefined}
                className={`p-3 rounded-lg border bg-white text-xs flex flex-col gap-1.5 transition-all duration-fast ease-standard ${
                  isFocused
                    ? "border-primary-400 ring-2 ring-primary-300/60 shadow-sm"
                    : isDimmed
                      ? "border-neutral-200/70 opacity-60"
                      : "border-neutral-200/80 shadow-2xs"
                }`}
              >
                {/* 1. 步骤序号与主标题（独占横向空间，自然流动） */}
                <div className="flex items-start gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-primary-600 text-white text-[10px] flex items-center justify-center font-mono shrink-0 mt-0.5">
                    {s.step}
                  </span>
                  <span className="font-bold text-neutral-800 text-xs leading-snug flex-1 break-words">
                    {s.title}
                  </span>
                </div>

                {/* 2. 高考采分点（另起一行缩进对齐，醒目展示得分考点，绝不与标题抢夺横向宽度） */}
                {s.rubric && (
                  <div className="pl-5.5">
                    <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/80 font-medium leading-relaxed break-words">
                      {renderMixedLatex(s.rubric)}
                    </span>
                  </div>
                )}
                {s.detail && (
                  <div className="text-xs text-neutral-600 leading-relaxed pl-5">
                    {renderMixedLatex(s.detail)}
                  </div>
                )}
                {formulaList.length > 0 && (
                  <div className="w-full flex flex-col gap-2">
                    {formulaList.map((formulaItem, fIdx) => (
                      <div
                        key={fIdx}
                        className="w-full py-2 px-3 bg-neutral-50/90 rounded-lg border border-neutral-200/70 max-w-full overflow-hidden"
                      >
                        <KatexFormula
                          formula={formulaItem}
                          mode="block"
                          responsive={true}
                          className="text-xs sm:text-sm font-medium text-neutral-800"
                        />
                      </div>
                    ))}
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
