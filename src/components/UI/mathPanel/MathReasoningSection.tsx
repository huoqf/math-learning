import React, { useState } from "react";
import { Compass, ChevronDown } from "lucide-react";
import { KatexFormula } from "../KatexFormula";
import { renderMixedLatex } from "./mathPanelUtils";

export interface ReasoningStep {
  step: number;
  title: string;
  detail?: string;
  latex?: string;
  rubric?: string;
}

interface MathReasoningSectionProps {
  steps: ReasoningStep[];
}

export const MathReasoningSection: React.FC<MathReasoningSectionProps> = ({
  steps,
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
      {open && (
        <div className="space-y-2.5 transition-all duration-fast ease-standard">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-neutral-200/80 bg-white shadow-2xs text-xs flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-neutral-800">
                  <span className="w-4 h-4 rounded-full bg-primary-600 text-white text-[10px] flex items-center justify-center font-mono">
                    {s.step}
                  </span>
                  <span>{s.title}</span>
                </div>
                {s.rubric && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                    {s.rubric}
                  </span>
                )}
              </div>
              {s.detail && (
                <div className="text-xs text-neutral-600 leading-relaxed pl-5">
                  {renderMixedLatex(s.detail)}
                </div>
              )}
              {s.latex && (
                <div className="w-full py-2 px-3 bg-neutral-50/90 rounded-lg border border-neutral-200/70">
                  <KatexFormula
                    formula={s.latex}
                    mode="block"
                    responsive={true}
                    className="text-sm font-medium text-neutral-800"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
