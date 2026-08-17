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
  /** 渲染模式：inline（行内，默认）| block（展示，用于 cases 等环境） */
  mode?: "inline" | "block";
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

/**
 * 混合内容渲染：中文句子中用 $...$ 标记数学片段，其余纯文本正常换行。
 * 若为纯 LaTeX（无中文且含数学命令/运算符），自动作为 KaTeX 公式渲染。
 */
function renderMixedLatex(text: string): React.ReactNode {
  if (!text) return null;

  // 1. 若无中文字符且包含 LaTeX 命令或数学上下标/运算符，直接按纯公式渲染
  if (
    !/[\u4e00-\u9fa5]/.test(text) &&
    (/\\[a-zA-Z]|[_^]\{?[\w]|=|<|>|\+|-|\*|\//.test(text) ||
      text.startsWith("$"))
  ) {
    const cleanFormula =
      text.startsWith("$") && text.endsWith("$") ? text.slice(1, -1) : text;
    return (
      <KatexFormula
        formula={cleanFormula}
        mode="inline"
        className="!my-0 !mx-0.5"
      />
    );
  }

  // 2. 混合文本按 $...$ 切分渲染
  const parts = text.split(/(\$[^$]+\$)/g);
  if (parts.length === 1) return text; // 无数学标记，直接纯文本
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$")) {
          const formula = part.slice(1, -1);
          return (
            <KatexFormula
              key={i}
              formula={formula}
              mode="inline"
              className="!my-0 !mx-0.5"
            />
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

/** 宽松检测：\cmd 命令或 _^ 上下标即视为 LaTeX（供 quantities.label/value 纯公式字段使用）*/
function hasLatex(text: string): boolean {
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return text.includes("$") || text.includes("\\text{");
  }
  return /\\[a-zA-Z]|[_^]\{?[\w]|=|<|>|\+|-|\*/.test(text);
}

/** 检测 LaTeX 是否包含需要 displayMode 的特殊矩阵/分段环境（如 cases、matrix 等） */
function needsBlockMode(latex: string): boolean {
  return /\\begin\{(cases|array|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|equation|equation\*|gather|gather\*|split|multline|multline\*)\}/.test(
    latex,
  );
}

/**
 * 将多行或过长 LaTeX 定理公式拆分为多段独立行进行上下堆叠排版，防止右屏宽度溢出截断。
 */
function splitTheoremLines(latex: string): string[] | null {
  // 1. 优先提取 \begin{aligned}...\end{aligned}
  const match = latex.match(/\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}/);
  if (match) {
    const lines = match[1]
      .split(/\\\\/)
      .map((line) =>
        line
          .replace(/^\[[^\]]+\]/, "")
          .replace(/&/g, "")
          .trim(),
      )
      .filter((line) => line.length > 0);
    return lines.length > 0 ? lines : null;
  }

  // 2. 若公式显式包含 \\\\ 换行符
  if (latex.includes("\\\\")) {
    const lines = latex
      .split(/\\\\/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length > 1) return lines;
  }

  // 3. 若公式较长且含有 \quad / ,\quad，自动拆分为多行显示
  if (
    latex.length > 35 &&
    (latex.includes(",\\quad") || latex.includes("\\quad"))
  ) {
    const lines = latex
      .split(/,\s*\\quad|\\quad/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length > 1) return lines;
  }

  return null;
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
    <div className="w-full h-full bg-white rounded-lg shadow-sm border border-neutral-200 p-4 overflow-y-auto overflow-x-hidden space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* ── 数学量区 ── */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-600 mb-3 border-b border-neutral-100 pb-1.5">
          {title}
        </h3>

        <div className="space-y-2">
          {quantities.map((q, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center justify-between py-1.5 border-b border-neutral-100 last:border-0 transition-all duration-fast ease-standard gap-x-2"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                {q.color && (
                  <span
                    className="shrink-0 w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: q.color }}
                  />
                )}
                <span className="text-xs font-medium text-neutral-600 min-w-0 break-words">
                  {renderMixedLatex(q.label)}
                </span>
              </div>
              <div className="flex items-baseline gap-1 min-w-0 flex-1 justify-end">
                <span
                  className="text-sm font-mono font-semibold min-w-0 break-all"
                  style={{ color: getValueColor(q) }}
                >
                  {typeof q.value === "number" ? (
                    q.value.toFixed(2)
                  ) : typeof q.value === "string" && hasLatex(q.value) ? (
                    <KatexFormula
                      formula={q.value}
                      mode="inline"
                      className="!text-[13px]"
                    />
                  ) : typeof q.value === "string" ? (
                    renderMixedLatex(q.value)
                  ) : (
                    q.value
                  )}
                </span>
                {q.unit && (
                  <span className="text-xs text-neutral-500 font-medium ml-1">
                    {renderMixedLatex(q.unit)}
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
                    <div className="w-full py-2 px-2.5 bg-white rounded border border-neutral-100/50 my-1 min-h-[42px] flex items-center justify-center overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {(() => {
                        // 1. 若为纯中文叙述段落 (\text{...})，提取内部文本按中文段落优雅自动换行
                        const textMatch = t.latex.match(
                          /^\s*\\text\{([\s\S]*)\}\s*$/,
                        );
                        if (textMatch) {
                          return (
                            <div className="w-full text-center py-1 text-xs text-neutral-700 font-medium break-words leading-relaxed">
                              {renderMixedLatex(textMatch[1])}
                            </div>
                          );
                        }

                        // 2. 多行拆分排版 (优先处理 aligned / \\\\ / 智能长公式 \\quad 拆行)
                        const theoremLines = splitTheoremLines(t.latex);
                        if (theoremLines) {
                          return (
                            <div className="flex flex-col items-center gap-1.5 w-full py-0.5 max-w-full">
                              {theoremLines.map((line, i) => (
                                <KatexFormula
                                  key={i}
                                  formula={line}
                                  mode="inline"
                                  className="!my-0 font-medium max-w-full"
                                />
                              ))}
                            </div>
                          );
                        }

                        // 3. 仅当需要 cases、matrix 等特殊环境或显式指定 block 时才走 displayMode
                        if (t.mode === "block" || needsBlockMode(t.latex)) {
                          return (
                            <KatexFormula
                              formula={t.latex}
                              mode="block"
                              className="!my-0 max-w-full"
                            />
                          );
                        }

                        // 4. 标准单行公式
                        return (
                          <KatexFormula
                            formula={t.latex}
                            mode="inline"
                            className="!my-0 font-medium max-w-full"
                          />
                        );
                      })()}
                    </div>
                    {t.condition && (
                      <div className="text-xs text-amber-700 mt-0.5 flex items-start gap-1 font-medium">
                        <span className="shrink-0 text-[10px] bg-amber-100 text-amber-700 px-1 py-0.2 rounded font-semibold leading-none mt-0.5">
                          条件
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
                      <div className="text-xs text-neutral-400 mt-0.5 pl-1 break-words leading-relaxed">
                        💡 {renderMixedLatex(t.note)}
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
                    <span className="min-w-0 break-words">
                      {renderMixedLatex(w.text)}
                    </span>
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
