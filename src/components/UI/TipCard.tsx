import React from "react";
import { renderMixedLatex } from "./mathPanel/mathPanelUtils";

export type TipCardVariant =
  "info" | "primary" | "warning" | "danger" | "success" | "accent";

interface TipCardProps {
  /** 题型或考点徽章，例如 "高考母题 · 直角梯形翻折" */
  badge?: string;
  /** 初始条件 / 题设已知背景 */
  condition?: React.ReactNode;
  /** 核心设问 / 探究目标 */
  question?: React.ReactNode;
  /** 自定义子内容（向后兼容） */
  children?: React.ReactNode;
  /** 色彩变体 */
  variant?: TipCardVariant;
  /** 是否紧凑模式 */
  compact?: boolean;
  className?: string;
}

const variantStyles: Record<
  TipCardVariant,
  { card: string; dot: string; badge: string }
> = {
  primary: {
    card: "bg-primary-50/70 border-primary-200/80 text-neutral-700",
    dot: "bg-primary-500",
    badge: "text-primary-800 border-primary-200/70 bg-white/70",
  },
  info: {
    card: "bg-neutral-50 border-neutral-200 text-neutral-600",
    dot: "bg-neutral-400",
    badge: "text-neutral-700 border-neutral-200 bg-white/70",
  },
  warning: {
    card: "bg-accent-50/70 border-accent-200/80 text-neutral-700",
    dot: "bg-accent-500",
    badge: "text-accent-800 border-accent-200/70 bg-white/70",
  },
  danger: {
    card: "bg-danger-50/70 border-danger-200/80 text-neutral-700",
    dot: "bg-danger-500",
    badge: "text-danger-800 border-danger-200/70 bg-white/70",
  },
  success: {
    card: "bg-success-50/70 border-success-200/80 text-neutral-700",
    dot: "bg-success-500",
    badge: "text-success-800 border-success-200/70 bg-white/70",
  },
  accent: {
    card: "bg-accent-50/70 border-accent-200/80 text-neutral-700",
    dot: "bg-accent-500",
    badge: "text-accent-800 border-accent-200/70 bg-white/70",
  },
};

export const TipCard: React.FC<TipCardProps> = ({
  badge,
  condition,
  question,
  children,
  variant = "primary",
  compact = false,
  className = "",
}) => {
  const style = variantStyles[variant];
  const hasStructuredContent = Boolean(badge || condition || question);

  return (
    <div
      className={[
        "rounded-lg border text-[11px] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all",
        compact ? "px-2 py-1.5" : "px-2.5 py-2",
        style.card,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {hasStructuredContent && (
        <div className="space-y-1.5">
          {badge && (
            <div className="flex items-center gap-1.5 pb-1 border-b border-black/5">
              <span
                className={[
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  style.dot,
                ].join(" ")}
              />
              <span className="font-bold text-[11px] leading-none tracking-tight">
                {badge}
              </span>
            </div>
          )}

          {condition && (
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-neutral-800">
                【初始条件】
              </span>
              <span className="text-neutral-600">
                {typeof condition === "string"
                  ? renderMixedLatex(condition)
                  : condition}
              </span>
            </div>
          )}

          {question && (
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-neutral-800">
                【核心设问】
              </span>
              <span className="text-neutral-600">
                {typeof question === "string"
                  ? renderMixedLatex(question)
                  : question}
              </span>
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
};
