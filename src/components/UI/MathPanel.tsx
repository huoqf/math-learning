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
 * 若为包含 LaTeX 命令的表达式，自动作为 KaTeX 公式渲染。
 */
function renderMixedLatex(text: string): React.ReactNode {
  if (!text) return null;

  // 1. 若文本中显式包含 $...$ 数学定界符，严格按 $...$ 切分混合渲染
  if (text.includes("$")) {
    const parts = text.split(/(\$[^$]+\$)/g);
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith("$") && part.endsWith("$")) {
            const formula = part.slice(1, -1).trim();
            if (!formula) return null;
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

  // 2. 若无中文字符且包含 LaTeX 命令或数学运算符，作为整段公式渲染
  if (
    !/[\u4e00-\u9fa5]/.test(text) &&
    (/\\[a-zA-Z]|[_^]\{?[\w]|=|<|>|\+|-|\*|\//.test(text) ||
      text.includes("\\text{"))
  ) {
    return (
      <KatexFormula formula={text} mode="inline" className="!my-0 !mx-0.5" />
    );
  }

  // 3. 若无 $ 但包含反斜杠 LaTeX 控制序列（如 \triangle, \vec 等），智能拆分渲染
  if (/\\[a-zA-Z]+/.test(text)) {
    const parts = text.split(
      /(\\[a-zA-Z]+(?:\*|\{[^{}]*\})*(?:[\^_]\{?[^{}]*\}?)*(?:\s*[\w=<>+\-*/^_]+)?)/g,
    );
    return (
      <>
        {parts.map((part, i) => {
          if (/\\[a-zA-Z]+/.test(part)) {
            return (
              <KatexFormula
                key={i}
                formula={part.trim()}
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

  // 4. 纯文本原样输出
  return text;
}

/** 宽松检测：\cmd 命令或 _^ 上下标即视为 LaTeX（供 quantities.label/value 纯公式字段使用）*/
function hasLatex(text: string): boolean {
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return text.includes("$") || text.includes("\\text{");
  }
  return /\\[a-zA-Z]|[_^]\{?[\w]|=|<|>|\+|-|\*/.test(text);
}

/** 检测 LaTeX 是否包含需要 displayMode 的特殊矩阵/分段环境 */
function needsStrictBlockMode(latex: string): boolean {
  return /\\begin\{(cases|array|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|equation|equation\*|gather|gather\*|split|multline|multline\*)\}/.test(
    latex,
  );
}

export interface FormulaClause {
  formula: string;
  prefix?: string; // 如 \iff, \implies 等
}

/**
 * 智能数学表达式原子（Clause）分解算法：
 * 将并列公式或带有双向箭头推导的复合式，拆解为自包含、不可打碎的数学原子项，交由 Flex-Wrap 自然流式换行。
 */
function splitFormulaClauses(latex: string): FormulaClause[] | null {
  if (!latex || needsStrictBlockMode(latex)) return null;

  // 1. 如果包含显式换行符 \\，按行拆分
  if (latex.includes("\\\\")) {
    const lines = latex
      .split(/\\\\/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 1) {
      return lines.map((l) => ({ formula: l }));
    }
  }

  // 2. 检查顶层推导符 \iff / \implies
  if (/\\(iff|implies)/.test(latex) && latex.length > 35) {
    const parts = latex.split(/(\\(?:iff|implies))/g);
    if (parts.length >= 3) {
      const clauses: FormulaClause[] = [];
      let currentPrefix: string | undefined = undefined;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (!part) continue;
        if (part === "\\iff" || part === "\\implies") {
          currentPrefix = part;
        } else {
          clauses.push({ formula: part, prefix: currentPrefix });
          currentPrefix = undefined;
        }
      }
      if (clauses.length > 1) return clauses;
    }
  }

  // 3. 检查顶层逗号/分号/quad并列公式
  let braceDepth = 0;
  let parenDepth = 0;
  const commaClauses: string[] = [];
  let cur = "";

  for (let i = 0; i < latex.length; i++) {
    const ch = latex[i];
    if (ch === "{" || ch === "[") braceDepth++;
    else if (ch === "}" || ch === "]") braceDepth = Math.max(0, braceDepth - 1);
    else if (ch === "(") parenDepth++;
    else if (ch === ")") parenDepth = Math.max(0, parenDepth - 1);

    if (braceDepth === 0 && parenDepth === 0) {
      if (ch === "," || latex.slice(i, i + 6) === "\\quad ") {
        if (cur.trim()) {
          commaClauses.push(cur.trim());
          cur = "";
        }
        if (latex.slice(i, i + 6) === "\\quad ") {
          i += 5; // 跳过 \quad
        }
        continue;
      }
    }
    cur += ch;
  }
  if (cur.trim()) {
    commaClauses.push(cur.trim());
  }

  if (commaClauses.length > 1) {
    return commaClauses.map((c) => ({ formula: c }));
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
    bg: colors.secondary[100],
    text: colors.secondary[700],
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
    <div className="w-full h-full flex flex-col gap-4 p-4 text-neutral-800 text-sm overflow-y-auto bg-neutral-50/50">
      {/* ── 标题 ── */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary-600" />
          <h3 className="font-bold text-neutral-800 text-sm">{title}</h3>
        </div>
        <span className="text-xs text-neutral-500 font-medium">
          实时指标看板
        </span>
      </div>

      {/* ── 数学量列表 ── */}
      <div>
        <div className="text-xs font-semibold text-neutral-600 mb-2 flex items-center justify-between">
          <span>核心数值指标</span>
          <span className="text-[10px] text-neutral-400 font-normal">
            共 {quantities.length} 项
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {quantities.map((q, index) => {
            const valStr =
              typeof q.value === "string" ? q.value : String(q.value);
            const isLongSymbol = Boolean(
              q.symbol &&
              (q.symbol.length > 8 ||
                /\\(frac|tan|sin|cos|sqrt|over|sum|int)|=/.test(q.symbol)),
            );
            const isLongValue =
              valStr.length > 14 ||
              /\\(frac|tan|sin|cos|sqrt|text|begin|aligned)|=|,/.test(valStr);
            const isStacked =
              isLongSymbol ||
              isLongValue ||
              (Boolean(q.symbol) && q.label.length > 6);

            if (isStacked) {
              return (
                <div
                  key={index}
                  className="flex flex-col gap-1.5 p-2 rounded-lg bg-white border border-neutral-100 shadow-xs hover:border-neutral-200 transition-colors"
                >
                  {/* 顶部行：符号徽章 + 完整标签 */}
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {q.symbol && (
                        <span
                          className="font-semibold shrink-0 text-xs px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: q.color
                              ? `${q.color}15`
                              : "#f3f4f6",
                            color: q.color ?? "#4b5563",
                          }}
                        >
                          {hasLatex(q.symbol) ? (
                            <KatexFormula
                              formula={q.symbol}
                              mode="inline"
                              className="!text-xs"
                            />
                          ) : (
                            q.symbol
                          )}
                        </span>
                      )}
                      <span className="text-xs text-neutral-700 font-medium break-words">
                        {q.label}
                      </span>
                    </div>
                    {q.unit && (
                      <span className="text-[11px] text-neutral-400 font-medium shrink-0">
                        {renderMixedLatex(q.unit)}
                      </span>
                    )}
                  </div>

                  {/* 底部数值/公式展示行：全宽自适应展示，防止重叠挤压与溢出 */}
                  <div className="w-full flex items-center justify-end overflow-hidden pt-0.5">
                    <span
                      className="font-bold text-xs max-w-full text-right"
                      style={{ color: getValueColor(q) }}
                    >
                      {typeof q.value === "number" ? (
                        q.value.toFixed(2)
                      ) : typeof q.value === "string" && hasLatex(q.value) ? (
                        <KatexFormula
                          formula={q.value}
                          mode="inline"
                          responsive={true}
                          className="!text-xs max-w-full"
                        />
                      ) : typeof q.value === "string" ? (
                        <span className="break-words leading-relaxed text-xs">
                          {renderMixedLatex(q.value)}
                        </span>
                      ) : (
                        q.value
                      )}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-neutral-100 shadow-xs hover:border-neutral-200 transition-colors gap-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {q.symbol && (
                    <span
                      className="font-semibold shrink-0 text-xs px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: q.color ? `${q.color}15` : "#f3f4f6",
                        color: q.color ?? "#4b5563",
                      }}
                    >
                      {hasLatex(q.symbol) ? (
                        <KatexFormula
                          formula={q.symbol}
                          mode="inline"
                          className="!text-xs"
                        />
                      ) : (
                        q.symbol
                      )}
                    </span>
                  )}
                  <span className="text-xs text-neutral-600 font-medium whitespace-nowrap">
                    {q.label}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 shrink-0 text-right">
                  <span
                    className="font-bold text-xs"
                    style={{ color: getValueColor(q) }}
                  >
                    {typeof q.value === "number" ? (
                      q.value.toFixed(2)
                    ) : typeof q.value === "string" && hasLatex(q.value) ? (
                      <KatexFormula
                        formula={q.value}
                        mode="inline"
                        className="!text-xs"
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
            );
          })}
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
                    <div className="w-full py-2 px-2 bg-white rounded border border-neutral-100/50 my-1 min-h-[42px] flex items-center justify-center overflow-x-hidden max-w-full">
                      {(() => {
                        // 1. 若为纯中文叙述段落 (\text{...})
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

                        // 2. 原生环境 (cases / matrix / aligned 等) 或显式 block 模式
                        if (
                          t.mode === "block" ||
                          /\\begin\{(aligned|cases|array|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|equation|gather|split)\}/.test(
                            t.latex,
                          )
                        ) {
                          return (
                            <KatexFormula
                              formula={t.latex}
                              mode="block"
                              responsive={true}
                              className="!my-0 max-w-full"
                            />
                          );
                        }

                        // 3. 智能语义原子 Flex-Wrap 流式排版（并列公式或推导式自然折行）
                        const clauses = splitFormulaClauses(t.latex);
                        if (clauses && clauses.length > 1) {
                          return (
                            <div className="w-full flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-0.5 max-w-full">
                              {clauses.map((clause, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1 max-w-full"
                                >
                                  {clause.prefix && (
                                    <KatexFormula
                                      formula={clause.prefix}
                                      mode="inline"
                                      className="!my-0 text-primary-600"
                                    />
                                  )}
                                  <KatexFormula
                                    formula={clause.formula}
                                    mode="inline"
                                    responsive={true}
                                    className="!my-0 font-medium"
                                  />
                                </div>
                              ))}
                            </div>
                          );
                        }

                        // 4. 标准单行公式
                        return (
                          <KatexFormula
                            formula={t.latex}
                            mode="inline"
                            responsive={true}
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
