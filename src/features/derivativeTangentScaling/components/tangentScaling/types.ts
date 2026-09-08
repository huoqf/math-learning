import type { useSceneScale } from "@/hooks";
import type { TangentScalingParams } from "@/data/registries/tangentScaling";
import type { ViewportInfo } from "@/utils/useViewport";

export type SceneScale = ReturnType<typeof useSceneScale>;

/** 各切线放缩子场景共享的 props（不含各自专属的 subModel 判别项） */
export interface TangentSceneBaseProps {
  params: TangentScalingParams;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (v: number) => number;
  onParamChange: (key: string, value: number) => void;
}
