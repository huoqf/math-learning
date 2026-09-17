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
  /**
   * 该条目在「高考标准解答分步走」链条中的步号（1 起）。
   * 仅当本页的解答链落在**定理区**时需要显式声明（如概率递推的 4 个采分步）；
   * 缺省时回退为数组下标 + 1。左屏分步导航据此在本卡片上打聚焦描边。
   */
  step?: number;
  /**
   * 课标边界标记（与 `level` 正交，二者回答不同问题）：
   *  - `level`   —— 该条目在知识体系中的层级（核心 / 重要 / 推导法则 / 补充结论）；
   *  - `isExtension` —— 该条目是否超出 2019 人教A版新课标正文范围。
   *
   * 为什么需要它（来源：概率统计模块审计 P1/P2）：
   *   此前"这属于拓展内容"只能写进定理**名称**（如「大样本二项逼近（拓展 · 超出课标）」），
   *   或依赖文件级 `importance: "extend"`，属于**隐式**标注——条目一旦被复用或改名，
   *   超纲属性即丢失。改为条目级显式字段后，右屏会自动渲染「拓展 · 选学」徽标，
   *   同时被 `discipline/no-beyond-syllabus-terms` 门禁识别为"已声明拓展"。
   */
  isExtension?: boolean;
  /** 自定义拓展徽标文案；缺省为「拓展 · 选学」。超出课标可用「拓展 · 超出课标」 */
  extensionBadge?: string;
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

/**
 * 条目级「拓展」徽标配色。
 * 复用首页知识树对拓展内容的既有紫色语义（`KnowledgeTreeHome.tsx` 中
 * `importance: "extend"` 与 `syllabus.status !== "正文"` 均为 purple-50/purple-700/purple-200），
 * 使"紫色 = 超出课标正文"这一视觉约定在全站唯一，不再新造配色。
 */
const EXTENSION_BADGE_CLASS =
  "text-[10px] px-1 py-0.5 rounded font-bold bg-purple-50 text-purple-700 border border-purple-200";
const DEFAULT_EXTENSION_BADGE = "拓展 · 选学";

interface MathTheoremSectionProps {
  theorems: Theorem[];
  /**
   * 「高考标准解答分步走」当前步（1 起）。传入后本区按步聚焦：
   * 命中步的卡片描边高亮，其余卡片降透明度，形成单向焦点。
   * 缺省时不描边、不降透明度，保持整区原样。
   */
  focusStep?: number;
}

export const MathTheoremSection: React.FC<MathTheoremSectionProps> = ({
  theorems,
  focusStep,
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
            const stepNo = t.step ?? index + 1;
            const isFocused = focusStep !== undefined && stepNo === focusStep;
            const isDimmed = focusStep !== undefined && !isFocused;
            return (
              <div
                key={index}
                data-focus-step={isFocused ? "true" : undefined}
                className={`p-2.5 rounded-lg border bg-primary-50/20 text-xs flex flex-col gap-1 transition-all duration-fast ease-standard ${
                  isFocused
                    ? "border-primary-400 ring-2 ring-primary-300/60 shadow-sm"
                    : isDimmed
                      ? "border-primary-100/70 opacity-60"
                      : "border-primary-100 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <span className="font-semibold text-neutral-800">
                    {t.name}
                  </span>
                  <span className="flex items-center gap-1 flex-wrap">
                    {t.isExtension && (
                      <span className={EXTENSION_BADGE_CLASS}>
                        {t.extensionBadge ?? DEFAULT_EXTENSION_BADGE}
                      </span>
                    )}
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
                  </span>
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
