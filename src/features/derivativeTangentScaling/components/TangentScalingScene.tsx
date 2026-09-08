import type {
  TangentScalingParams,
  TangentScalingMode,
  BaseSubModel,
  SandwichSubModel,
  ParamKSubModel,
  SecantSubModel,
} from "@/data/registries/tangentScaling";
import type { ViewportInfo } from "@/utils/useViewport";
import { TangentBaseScene } from "./tangentScaling/TangentBaseScene";
import { TangentSandwichScene } from "./tangentScaling/TangentSandwichScene";
import { TangentParamKScene } from "./tangentScaling/TangentParamKScene";
import { TangentSecantScene } from "./tangentScaling/TangentSecantScene";

interface TangentScalingSceneProps {
  params: TangentScalingParams;
  mode: TangentScalingMode;
  baseSubModel: BaseSubModel;
  sandwichSubModel: SandwichSubModel;
  paramKSubModel: ParamKSubModel;
  secantSubModel: SecantSubModel;
  scale: ReturnType<typeof import("@/hooks").useSceneScale>;
  vp: ViewportInfo;
  fontScale: (v: number) => number;
  onParamChange: (key: string, value: number) => void;
}

/**
 * 切线放缩场景分发器。
 * 四个子模型（基准 / 公切夹逼 / 过定点动直线 / 割切双向）各自的
 * 数据解算、避让点标与渲染已下沉到 tangentScaling/ 下的独立子场景。
 */
export function TangentScalingScene(props: TangentScalingSceneProps) {
  if (props.mode === "base") return <TangentBaseScene {...props} />;
  if (props.mode === "sandwich") return <TangentSandwichScene {...props} />;
  if (props.mode === "param_k") return <TangentParamKScene {...props} />;
  return <TangentSecantScene {...props} />;
}
