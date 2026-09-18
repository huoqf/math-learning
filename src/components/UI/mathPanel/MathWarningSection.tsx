import React, { useState } from "react";
import { AlertTriangle, AlertCircle, Info, ChevronDown } from "lucide-react";
import { colors } from "@/theme/colors";
import { renderMixedLatex } from "./mathPanelUtils";

export interface WarningItem {
  text: string;
  level: "info" | "warning" | "danger";
  /**
   * 课标边界标记，与 `Theorem.isExtension` 同义，用于**条目级**声明本警示涉及拓展内容。
   *
   * 为什么警示也要有（来源：超纲术语门禁条目级升级）：
   *   `discipline/no-beyond-syllabus-terms` 的豁免已从"文件级"收紧为"条目级"——
   *   只有声明所属条目显式标注拓展才降级为 warning。若 `WarningItem` 缺少该字段，
   *   涉及拓展内容的警示就**没有任何条目级标注通道**，只能是 error（门禁红灯）或被
   *   迫删改文案。补齐后，右屏三类条目（定理 / 高考要点 / 警示）共用同一套标注契约。
   */
  isExtension?: boolean;
}

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

interface MathWarningSectionProps {
  warnings: WarningItem[];
}

export const MathWarningSection: React.FC<MathWarningSectionProps> = ({
  warnings,
}) => {
  const [open, setOpen] = useState(true);

  if (!warnings || warnings.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-semibold text-danger-700 mb-2.5 hover:text-danger-900 transition-colors focus:outline-none cursor-pointer border-b border-danger-100 pb-1.5"
      >
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-danger-500" />
          <span>数学临界与易错警示</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-fast ease-standard ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      {open && (
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
                {w.isExtension && (
                  <span className="shrink-0 text-[10px] px-1 py-0.5 rounded font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    拓展 · 选学
                  </span>
                )}
                <span className="min-w-0 break-words">
                  {renderMixedLatex(w.text)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
