import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CANVAS_COLORS, MATH_COLORS } from "@/theme";
import { BAYES_ANSWER_STEPS } from "@/data/registries/probabilityBayes";
import { ConditionalScene } from "./ConditionalScene";
import { TotalProbScene } from "./TotalProbScene";
import { BayesScreeningScene } from "./BayesScreeningScene";

interface ProbabilityBayesSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  activeMode: "conditional" | "total_prob" | "bayes";
  isZoomedToA?: boolean;
  totalScenario?: "free" | "factory3" | "balanced" | "warner";
  bayesPreset?: "screening" | "factory" | "survey" | "custom";
  fontScale?: (v: number) => number;
  activeStep?: number;
}

export function ProbabilityBayesScene({
  params,
  activeMode,
  isZoomedToA = false,
  totalScenario = "factory3",
  bayesPreset = "screening",
  fontScale = (v) => v,
  activeStep,
}: ProbabilityBayesSceneProps) {
  const stepBox =
    activeStep === undefined
      ? null
      : activeMode === "conditional"
        ? activeStep === 1
          ? { x: 40, y: 40, width: 430, height: 536 }
          : activeStep === 2
            ? { x: 482, y: 74, width: 326, height: 248 }
            : { x: 482, y: 324, width: 326, height: 252 }
        : activeMode === "total_prob"
          ? activeStep === 1
            ? { x: 40, y: 36, width: 372, height: 460 }
            : activeStep === 2
              ? { x: 430, y: 36, width: 372, height: 460 }
              : { x: 40, y: 502, width: 762, height: 122 }
          : activeStep === 1
            ? { x: 40, y: 24, width: 760, height: 338 }
            : activeStep === 2
              ? { x: 40, y: 366, width: 382, height: 244 }
              : { x: 424, y: 366, width: 376, height: 244 };

  return (
    <g>
      {activeMode === "conditional" && (
        <ConditionalScene
          params={params}
          isZoomedToA={isZoomedToA}
          fontScale={fontScale}
          activeStep={activeStep}
        />
      )}
      {activeMode === "total_prob" && (
        <TotalProbScene
          params={params}
          totalScenario={totalScenario}
          fontScale={fontScale}
          activeStep={activeStep}
        />
      )}
      {activeMode === "bayes" && (
        <BayesScreeningScene
          params={params}
          bayesPreset={bayesPreset}
          fontScale={fontScale}
          activeStep={activeStep}
        />
      )}
      {stepBox &&
        (() => {
          const stepInfo =
            BAYES_ANSWER_STEPS[
              Math.min(
                BAYES_ANSWER_STEPS.length - 1,
                Math.max(0, (activeStep ?? 1) - 1),
              )
            ];
          const chipLabel = `第 ${stepInfo.step} / ${BAYES_ANSWER_STEPS.length} 步 · ${stepInfo.title}`;
          const chipW = Math.min(310, Math.max(190, chipLabel.length * 10.5));
          // Step 1 时徽章贴右上边框放置，完全避开左半区顶部主标题
          const chipX =
            activeStep === 1
              ? stepBox.x + stepBox.width - chipW - 8
              : Math.max(40, Math.min(800 - chipW, stepBox.x + 10));
          const chipY = Math.max(10, stepBox.y - 11);

          return (
            <g pointerEvents="none">
              <rect
                x={stepBox.x}
                y={stepBox.y}
                width={stepBox.width}
                height={stepBox.height}
                rx={12}
                fill="none"
                stroke={MATH_COLORS.answerStepFrame}
                strokeWidth={2.2}
                strokeDasharray="7 4"
              />
              <rect
                x={chipX}
                y={chipY}
                width={chipW}
                height={22}
                rx={6}
                fill={MATH_COLORS.answerStepFrame}
              />
              <text
                x={chipX + chipW / 2}
                y={chipY + 15}
                textAnchor="middle"
                fontSize={fontScale(10)}
                fontWeight="bold"
                fill={CANVAS_COLORS.white}
              >
                {chipLabel}
              </text>
            </g>
          );
        })()}
    </g>
  );
}
