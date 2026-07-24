import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { ConditionalScene } from "./ConditionalScene";
import { TotalProbScene } from "./TotalProbScene";
import { BayesScreeningScene } from "./BayesScreeningScene";

interface ProbabilityBayesSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  activeMode: "conditional" | "total_prob" | "bayes";
  isZoomedToA?: boolean;
  bayesPreset?: "screening" | "factory" | "custom";
  fontScale?: (v: number) => number;
}

export function ProbabilityBayesScene({
  params,
  activeMode,
  isZoomedToA = false,
  bayesPreset = "screening",
  fontScale = (v) => v,
}: ProbabilityBayesSceneProps) {
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
        <TotalProbScene params={params} fontScale={fontScale} />
      )}
      {activeMode === "bayes" && (
        <BayesScreeningScene
          params={params}
          bayesPreset={bayesPreset}
          fontScale={fontScale}
        />
      )}
    </g>
  );
}
