import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * 一条「高考标准解答步」。
 * 与右屏数据同源：`title` 必须与右屏对应条目（Theorem 或 ReasoningStep）同名，
 * 否则左屏导航与右屏聚焦描边会错位。
 */
export interface AnswerStepItem {
  step: number;
  title: string;
  /** 该步在中屏对应的图元区域说明，用于"左屏点步 → 学生知道该看中屏哪里" */
  sceneHint?: string;
}

interface StepNavigatorProps {
  steps: AnswerStepItem[];
  /** 当前步（1 起） */
  active: number;
  onChange: (step: number) => void;
  /** 底部补充说明（如"右屏已同步聚焦该采分步卡片"） */
  hint?: string;
}

/**
 * 高考标准解答分步走导航器（教具级交互 → 提分级闭环）。
 *
 * 设计动机（来源：概率统计模块审计 第六节 + 决策项 3.1）：
 *   此前左屏只有"参数调节"，学生看到的是一堆可拖的参数，看不到"这道大题该怎么一步步写"。
 *   本组件把右屏本就存在的解答链（4 步 / 3 步）提到左屏成为**可操作的主线**：
 *   前进 / 后退 / 点击跳转，同时驱动
 *     ① 右屏对应采分步卡片聚焦描边（MathPanel focusStep）
 *     ② 中屏高亮该步涉及图元（Scene activeStep）
 *   形成"看一步 → 想一步 → 写一步"的闭环，而非一次性把整块看板铺给学生。
 */
export const StepNavigator: React.FC<StepNavigatorProps> = ({
  steps,
  active,
  onChange,
  hint,
}) => {
  if (!steps || steps.length === 0) return null;

  const total = steps.length;
  const currentIndex = Math.max(0, Math.min(total - 1, active - 1));
  const current = steps[currentIndex];
  const go = (n: number) => onChange(Math.max(1, Math.min(total, n)));

  const navBtnClass =
    "flex h-6 w-6 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="space-y-2">
      {/* 进度徽标与前进 / 后退 */}
      <div className="flex items-center justify-between gap-2">
        <span className="rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-700">
          第 {currentIndex + 1} / {total} 步
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="上一步"
            disabled={currentIndex === 0}
            onClick={() => go(currentIndex)}
            className={`${navBtnClass} border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="下一步"
            disabled={currentIndex === total - 1}
            onClick={() => go(currentIndex + 2)}
            className={`${navBtnClass} border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50`}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 当前步：标题 + 中屏联动提示 */}
      <div className="rounded-lg border border-primary-200 bg-primary-50/60 p-2">
        <div className="text-[11px] font-bold leading-snug text-neutral-800">
          {current.title}
        </div>
        {current.sceneHint && (
          <div className="mt-1 text-[10.5px] leading-relaxed text-neutral-600">
            中屏联动：{current.sceneHint}
          </div>
        )}
      </div>

      {/* 步骤清单（可点击跳转，已完成步显示为绿色） */}
      <div className="space-y-1">
        {steps.map((s, idx) => {
          const isActive = idx === currentIndex;
          const isDone = idx < currentIndex;
          return (
            <button
              key={s.step}
              type="button"
              onClick={() => go(idx + 1)}
              className={`flex w-full items-start gap-1.5 rounded-md border px-1.5 py-1 text-left transition-colors ${
                isActive
                  ? "border-primary-300 bg-primary-50"
                  : "border-neutral-200 bg-white hover:bg-neutral-50"
              }`}
            >
              <span
                className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : isDone
                      ? "bg-success-100 text-success-700"
                      : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {s.step}
              </span>
              <span
                className={`min-w-0 flex-1 text-[10.5px] leading-snug ${
                  isActive ? "font-bold text-neutral-800" : "text-neutral-600"
                }`}
              >
                {s.title}
              </span>
            </button>
          );
        })}
      </div>

      {hint && (
        <div className="px-0.5 text-[10px] text-neutral-400">{hint}</div>
      )}
    </div>
  );
};
