import React, { useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import { KatexFormula } from "../KatexFormula";
import { colors } from "@/theme/colors";
import { renderMixedLatex } from "./mathPanelUtils";

export interface Theorem {
  name: string;
  latex: string;
  condition?: string;
  prerequisites?: string[];
  note?: string;
  level?: "core" | "important" | "derived" | "supplementary";
  mode?: "inline" | "block";
}

const THEOREM_LEVEL_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  core: {
    bg: colors.primary[100],
    text: colors.primary[700],
    label: "核心定理",
  },
  important: {
    bg: colors.accent[100],
    text: colors.accent[700],
    label: "重要性质",
  },
  derived: {
    bg: colors.neutral[100],
    text: colors.neutral[500],
    label: "推导法则",
  },
  supplementary: {
    bg: colors.secondary[100],
    text: colors.secondary[700],
    label: "补充结论",
  },
};

interface MathTheoremSectionProps {
  theorems: Theorem[];
}

export const MathTheoremSection: React.FC<MathTheoremSectionProps> = ({
  theorems,
}) => {
  const [open, setOpen] = useState(true);

  if (!theorems || theorems.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-semibold text-neutral-800 mb-2.5 hover:text-primary-700 transition-colors focus:outline-none cursor-pointer border-b border-neutral-200 pb-1.5"
      >
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-primary-600" />
          <span>核心定理与公式模型</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-fast ease-standard ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div className="space-y-2.5 transition-all duration-fast ease-standard">
          {theorems.map((t, index) => {
            const levelStyle = t.level
              ? THEOREM_LEVEL_STYLES[t.level]
              : undefined;
            return (
              <div
                key={index}
                className="p-2.5 rounded-lg border border-primary-100 bg-primary-50/20 text-xs shadow-sm flex flex-col gap-1"
              >
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <span className="font-semibold text-neutral-800">
                    {t.name}
                  </span>
                  {levelStyle && (
                    <span
                      className="text-[10px] px-1 py-0.5 rounded font-semibold"
                      style={{
                        backgroundColor: levelStyle.bg,
                        color: levelStyle.text,
                      }}
                    >
                      {levelStyle.label}
                    </span>
                  )}
                </div>
                <div className="w-full py-2.5 px-2.5 bg-white rounded-lg border border-neutral-100/70 my-1 min-h-[48px] flex items-center justify-center max-w-full">
                  {(() => {
                    const textMatch = t.latex.match(
                      /^\s*\\text\{([\s\S]*?)\}\s*$/,
                    );
                    if (
                      textMatch &&
                      !/\\[a-zA-Z]|[_^=<>+\-*/]|\$/.test(textMatch[1])
                    ) {
                      return (
                        <div className="w-full text-center py-1 text-xs text-neutral-700 font-medium break-words leading-relaxed">
                          {renderMixedLatex(textMatch[1])}
                        </div>
                      );
                    }
                    return (
                      <KatexFormula
                        formula={t.latex}
                        mode={t.mode ?? "block"}
                        responsive={true}
                        className="!my-0 font-medium text-[13px] sm:text-[14px] max-w-full"
                      />
                    );
                  })()}
                </div>
                {t.condition && (
                  <div className="text-xs text-amber-700 mt-0.5 flex items-start gap-1 font-medium">
                    <span className="shrink-0 text-[10px] bg-amber-100 text-amber-700 px-1 py-0.2 rounded font-semibold leading-none mt-0.5">
                      适用前提
                    </span>
                    <span className="min-w-0 break-words leading-relaxed">
                      {renderMixedLatex(t.condition)}
                    </span>
                  </div>
                )}
                {t.prerequisites && t.prerequisites.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {t.prerequisites.map((pre, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium break-words"
                      >
                        前提：{renderMixedLatex(pre)}
                      </span>
                    ))}
                  </div>
                )}
                {t.note && (
                  <div className="text-xs text-neutral-500 mt-0.5 pl-1 break-words leading-relaxed">
                    💡 {renderMixedLatex(t.note)}
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
