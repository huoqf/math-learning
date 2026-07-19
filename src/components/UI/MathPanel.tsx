import React, { useState } from "react";
import {
  ChevronDown,
  Award,
  AlertTriangle,
  AlertCircle,
  Info,
  BookOpen,
} from "lucide-react";
import { KatexFormula } from "./KatexFormula";
import { colors } from "@/theme/colors";

export interface MathQuantity {
  label: string;
  symbol?: string;
  value: number | string;
  unit?: string;
  color?: string;
  highlight?: "positive" | "negative" | "zero" | "extreme";
}

export interface Theorem {
  name: string;
  latex: string;
  condition?: string;
  /** 适用前提条件（如 a ≠ 0, Δ ≥ 0） */
  prerequisites?: string[];
  note?: string;
  level?: "core" | "important" | "derived" | "supplementary";
}

export interface GaokaoPoint {
  text: string;
  importance: "gaokao" | "hard" | "core" | "basic" | "extend";
}

export interface WarningItem {
  text: string;
  level: "info" | "warning" | "danger";
}

interface MathPanelProps {
  quantities: MathQuantity[];
  theorems?: Theorem[];
  gaokaoPoints?: GaokaoPoint[];
  warnings?: WarningItem[];
  mnemonic?: string;
  title?: string;
}

const THEOREM_LEVEL_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  core: { bg: colors.primary[100], text: colors.primary[700], label: "核心" },
  important: {
    bg: colors.accent[100],
    text: colors.accent[700],
    label: "重要",
  },
  derived: {
    bg: colors.neutral[100],
    text: colors.neutral[500],
    label: "推导",
  },
  supplementary: {
    bg: colors.neutral[50],
    text: colors.neutral[400],
    label: "补充",
  },
};

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
    label: "重难点",
    labelBg: colors.danger[500],
    labelText: "#fff",
  },
  core: {
    bg: colors.primary[50],
    border: colors.primary[400],
    text: colors.primary[700],
    label: "核心考点",
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

const WARNING_LEVEL_STYLES: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  danger: {
    bg: colors.danger[50],
    border: colors.danger[500],
    text: colors.danger[700],
  },
  warning: {
    bg: colors.accent[50],
    border: colors.accent[500],
    text: colors.accent[700],
  },
  info: {
    bg: colors.primary[50],
    border: colors.primary[500],
    text: colors.primary[700],
  },
};

export const MathPanel: React.FC<MathPanelProps> = ({
  quantities,
  theorems = [],
  gaokaoPoints = [],
  warnings = [],
  mnemonic,
  title = "数学量",
}) => {
  const [theoremsOpen, setTheoremsOpen] = useState(true);
  const [warningsOpen, setWarningsOpen] = useState(true);
  const [gaokaoOpen, setGaokaoOpen] = useState(true);
  const [mnemonicOpen, setMnemonicOpen] = useState(true);

  const getValueColor = (quantity: MathQuantity) => {
    if (quantity.highlight === "negative") return colors.danger[600];
    if (quantity.highlight === "zero") return colors.neutral[400];
    if (quantity.highlight === "extreme") return colors.accent[600];
    return colors.neutral[700];
  };

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-sm border border-neutral-200 p-4 overflow-y-auto space-y-5">
      {/* ── 数学量区 ── */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-600 mb-3 border-b border-neutral-100 pb-1.5">
          {title}
        </h3>

        <div className="space-y-2">
          {quantities.map((q, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-0 transition-all duration-fast ease-standard"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {q.color && (
                  <span
                    className="shrink-0 w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: q.color }}
                  />
                )}
                <span className="text-xs font-medium text-neutral-600 truncate">
                  {q.symbol ? `${q.label} ${q.symbol}` : q.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1 shrink-0">
                <span
                  className="text-sm font-mono font-semibold"
                  style={{ color: getValueColor(q) }}
                >
                  {typeof q.value === "number" ? q.value.toFixed(2) : q.value}
                </span>
                {q.unit && (
                  <span className="text-xs text-neutral-500 font-medium ml-1">
                    {q.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 定理公式区 ── */}
      {theorems.length > 0 && (
        <div>
          <button
            onClick={() => setTheoremsOpen(!theoremsOpen)}
            className="w-full flex items-center justify-between text-xs font-semibold text-neutral-600 mb-2.5 hover:text-neutral-900 transition-colors focus:outline-none cursor-pointer border-b border-neutral-100 pb-1.5"
          >
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary-500" />
              <span>定理公式</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-fast ease-standard ${theoremsOpen ? "rotate-0" : "-rotate-90"}`}
            />
          </button>
          {theoremsOpen && (
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
                    <div className="flex justify-center py-1.5 bg-white rounded border border-neutral-100/50 my-1 overflow-x-auto min-h-[36px] items-center">
                      <KatexFormula formula={t.latex} mode="inline" />
                    </div>
                    {t.condition && (
                      <div className="text-xs text-amber-700 mt-0.5 flex items-start gap-1 font-medium">
                        <span className="shrink-0 text-[10px] bg-amber-100 text-amber-700 px-1 py-0.2 rounded font-semibold leading-none mt-0.5">
                          条件
                        </span>
                        <span>{t.condition}</span>
                      </div>
                    )}
                    {t.prerequisites && t.prerequisites.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {t.prerequisites.map((pre, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium"
                          >
                            前提：{pre}
                          </span>
                        ))}
                      </div>
                    )}
                    {t.note && (
                      <div className="text-xs text-neutral-400 mt-0.5 pl-1">
                        💡 {t.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 易错警示区 ── */}
      {warnings.length > 0 && (
        <div>
          <button
            onClick={() => setWarningsOpen(!warningsOpen)}
            className="w-full flex items-center justify-between text-xs font-semibold text-neutral-600 mb-2.5 hover:text-neutral-900 transition-colors focus:outline-none cursor-pointer border-b border-neutral-100 pb-1.5"
          >
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-danger-500" />
              <span>易错警示</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-fast ease-standard ${warningsOpen ? "rotate-0" : "-rotate-90"}`}
            />
          </button>
          {warningsOpen && (
            <div className="space-y-2 transition-all duration-fast ease-standard">
              {warnings.map((w, index) => {
                const style =
                  WARNING_LEVEL_STYLES[w.level] ?? WARNING_LEVEL_STYLES.info;
                const IconComponent =
                  w.level === "danger"
                    ? AlertCircle
                    : w.level === "warning"
                      ? AlertTriangle
                      : Info;
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
                    <IconComponent className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{w.text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 高考要点区 ── */}
      {gaokaoPoints.length > 0 && (
        <div>
          <button
            onClick={() => setGaokaoOpen(!gaokaoOpen)}
            className="w-full flex items-center justify-between text-xs font-semibold text-neutral-600 mb-2.5 hover:text-neutral-900 transition-colors focus:outline-none cursor-pointer border-b border-neutral-100 pb-1.5"
          >
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-accent-600" />
              <span>高考要点</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-fast ease-standard ${gaokaoOpen ? "rotate-0" : "-rotate-90"}`}
            />
          </button>
          {gaokaoOpen && (
            <div className="space-y-2 transition-all duration-fast ease-standard">
              {gaokaoPoints.map((point, index) => {
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
                      <span className="text-neutral-700 font-medium">
                        {point.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 口诀区 ── */}
      {mnemonic && (
        <div>
          <button
            onClick={() => setMnemonicOpen(!mnemonicOpen)}
            className="w-full flex items-center justify-between text-xs font-semibold text-neutral-600 mb-2.5 hover:text-neutral-900 transition-colors focus:outline-none cursor-pointer border-b border-neutral-100 pb-1.5"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🗣️</span>
              <span>记忆口诀</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-fast ease-standard ${mnemonicOpen ? "rotate-0" : "-rotate-90"}`}
            />
          </button>
          {mnemonicOpen && (
            <div
              className="px-3 py-2.5 rounded-lg text-xs leading-relaxed border shadow-sm font-medium"
              style={{
                backgroundColor: colors.secondary[50],
                borderColor: colors.secondary[200],
                color: colors.secondary[700],
              }}
            >
              {mnemonic}
            </div>
          )}
        </div>
      )}

      {quantities.length === 0 &&
        theorems.length === 0 &&
        gaokaoPoints.length === 0 && (
          <div className="text-center text-neutral-400 py-8">
            <p className="text-sm">暂无数据</p>
          </div>
        )}
    </div>
  );
};
