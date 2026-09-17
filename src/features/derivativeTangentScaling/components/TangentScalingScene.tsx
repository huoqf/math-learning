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
  switch (props.mode) {
    case "base":
      return <TangentBaseScene {...props} />;
    case "sandwich":
      return <TangentSandwichScene {...props} />;
    case "param_k":
      return <TangentParamKScene {...props} />;
    case "secant":
      return <TangentSecantScene {...props} />;
    default: {
      // 显式失败：静默回落会把未知模式的参数塞进割切场景，渲染出误导性画面
      throw new Error(
        `TangentScalingScene: unknown mode "${String(props.mode)}"`,
      );
    }
  }
}
