import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { MATH_COLORS } from "@/theme";
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
          ? { x: 40, y: 54, width: 430, height: 522 }
          : activeStep === 2
            ? { x: 482, y: 74, width: 326, height: 204 }
            : { x: 482, y: 288, width: 326, height: 288 }
        : activeMode === "total_prob"
          ? activeStep === 1
            ? { x: 40, y: 46, width: 372, height: 450 }
            : activeStep === 2
              ? { x: 430, y: 46, width: 372, height: 450 }
              : { x: 40, y: 504, width: 762, height: 120 }
          : activeStep === 1
            ? { x: 40, y: 58, width: 760, height: 304 }
            : activeStep === 2
              ? { x: 40, y: 368, width: 382, height: 250 }
              : { x: 424, y: 368, width: 376, height: 250 };

  return (
    <g>
      {activeMode === "conditional" && (
        <ConditionalScene
          params={params}
          isZoomedToA={isZoomedToA}
          fontScale={fontScale}
        />
      )}
      {activeMode === "total_prob" && (
        <TotalProbScene
          params={params}
          totalScenario={totalScenario}
          fontScale={fontScale}
        />
      )}
      {activeMode === "bayes" && (
        <BayesScreeningScene
          params={params}
          bayesPreset={bayesPreset}
          fontScale={fontScale}
        />
      )}
      {stepBox && (
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
          pointerEvents="none"
        />
      )}
    </g>
  );
}
