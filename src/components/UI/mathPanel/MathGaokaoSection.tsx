import React, { useState } from "react";
import { Award, ChevronDown } from "lucide-react";
import { colors } from "@/theme/colors";
import { renderMixedLatex } from "./mathPanelUtils";

export interface GaokaoPoint {
  text: string;
  importance: "gaokao" | "hard" | "core" | "basic" | "extend";
}

const GAOKAO_LEVEL_STYLES: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    label: string;
    labelBg: string;
    labelText: string;
  }
> = {
  gaokao: {
    bg: colors.accent[50],
    border: colors.accent[500],
    text: colors.accent[700],
    label: "高考要点",
    labelBg: colors.accent[600],
    labelText: "#fff",
  },
  hard: {
    bg: colors.danger[50],
    border: colors.danger[400],
    text: colors.danger[700],
    label: "压轴重难点",
    labelBg: colors.danger[500],
    labelText: "#fff",
  },
  core: {
    bg: colors.primary[50],
    border: colors.primary[400],
    text: colors.primary[700],
    label: "核心考法",
    labelBg: colors.primary[600],
    labelText: "#fff",
  },
  basic: {
    bg: colors.neutral[50],
    border: colors.neutral[300],
    text: colors.neutral[600],
    label: "基础概念",
    labelBg: colors.neutral[500],
    labelText: "#fff",
  },
  extend: {
    bg: colors.secondary[50],
    border: colors.secondary[400],
    text: colors.secondary[700],
    label: "拓展延伸",
    labelBg: colors.secondary[600],
    labelText: "#fff",
  },
};

interface MathGaokaoSectionProps {
  points: GaokaoPoint[];
}

export const MathGaokaoSection: React.FC<MathGaokaoSectionProps> = ({
  points,
}) => {
  const [open, setOpen] = useState(true);

  if (!points || points.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-semibold text-neutral-600 mb-2.5 hover:text-neutral-900 transition-colors focus:outline-none cursor-pointer border-b border-neutral-100 pb-1.5"
      >
        <div className="flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-accent-600" />
          <span>高考要点与通法总结</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-fast ease-standard ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div className="space-y-2 transition-all duration-fast ease-standard">
          {points.map((point, index) => {
            const style =
              GAOKAO_LEVEL_STYLES[point.importance] ??
              GAOKAO_LEVEL_STYLES.basic;
            return (
              <div
                key={index}
                className="p-3 rounded-lg border-l-4 text-xs leading-relaxed flex items-start gap-2 shadow-sm border border-neutral-100"
                style={{
                  backgroundColor: style.bg,
                  borderLeftColor: style.border,
                  color: style.text,
                }}
              >
                <Award className="w-4 h-4 shrink-0 mt-0.5 text-accent-600" />
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="flex items-center">
                    <span
                      className="text-[10px] px-1 py-0.5 rounded font-semibold leading-none"
                      style={{
                        backgroundColor: style.labelBg,
                        color: style.labelText,
                      }}
                    >
                      {style.label}
                    </span>
                  </div>
                  <span className="text-neutral-700 font-medium break-words">
                    {renderMixedLatex(point.text)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
