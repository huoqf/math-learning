import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { ConditionalScene } from "./ConditionalScene";
import { TotalProbScene } from "./TotalProbScene";
import { BayesScreeningScene } from "./BayesScreeningScene";
import { MarkovScene } from "./MarkovScene";

interface ProbabilityBayesSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  activeMode: "conditional" | "total_prob" | "bayes" | "markov";
  isZoomedToA?: boolean;
  bayesPreset?: "screening" | "factory" | "survey" | "custom";
  markovPreset?: "pass_ball" | "urn_ball" | "weather" | "custom";
  fontScale?: (v: number) => number;
}

export function ProbabilityBayesScene({
  params,
  activeMode,
  isZoomedToA = false,
  bayesPreset = "screening",
  markovPreset = "pass_ball",
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
      {activeMode === "markov" && (
        <MarkovScene
          params={params}
          markovPreset={markovPreset}
          fontScale={fontScale}
        />
      )}
    </g>
  );
}
