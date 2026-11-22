import { memo } from "react";
import type { AnswerStepItem } from "@/components/UI/StepNavigator";
import { MATH_COLORS, withAlpha } from "@/theme";

export interface AnswerStepOverlay3DProps {
  /** 与左屏 StepNavigator、右屏 MathPanel.reasoningSteps 同源的步序列表 */
  steps: AnswerStepItem[];
  /** 当前激活步号（1 起） */
  activeStep?: number;
}

/**
 * 3D 中屏分步作答同步引导浮层：
 * 左屏点击 StepNavigator 时，同步更新中屏左上角高亮卡片与右屏 MathPanel 聚焦步号，
 * 围栏描边统一取 MATH_COLORS.answerStepFrame，确保三屏同频聚焦。
 */
export const AnswerStepOverlay3D = memo(function AnswerStepOverlay3D({
  steps,
  activeStep,
}: AnswerStepOverlay3DProps) {
  if (!steps || steps.length === 0 || !activeStep) return null;

  const idx = Math.max(0, Math.min(steps.length - 1, activeStep - 1));
  const current = steps[idx];
  if (!current) return null;

  return (
    <div
      data-focus-step={current.step}
      className="absolute top-3 left-3 z-10 max-w-[54%] rounded-xl px-3 py-2 shadow-sm backdrop-blur-md pointer-events-none select-none transition-all duration-200"
      style={{
        borderWidth: "1.5px",
        borderStyle: "solid",
        borderColor: MATH_COLORS.answerStepFrame,
        backgroundColor: withAlpha(MATH_COLORS.white, 0.9),
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: withAlpha(MATH_COLORS.answerStepFrame, 0.14),
            color: MATH_COLORS.answerStepFrame,
          }}
        >
          第 {idx + 1} / {steps.length} 步
        </span>
        <span
          className="truncate text-xs font-semibold"
          style={{ color: MATH_COLORS.labelText }}
        >
          {current.title}
        </span>
      </div>
      {current.sceneHint && (
        <div
          className="mt-1 truncate text-[10.5px]"
          style={{ color: MATH_COLORS.textMuted }}
        >
          {current.sceneHint}
        </div>
      )}
    </div>
  );
});
