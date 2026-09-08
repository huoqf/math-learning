import type { InteractionMode3D } from "@/components/Math3D";
import type { FoldingResult } from "@/math3d/folding";

/**
 * 各翻折子场景（FoldingXxxScene）共享的 props。
 * 所有字段对所有模型通用，子场景仅消费自身需要的子集。
 */
export interface FoldingSceneCommonProps {
  foldingData: FoldingResult;
  foldState: "both" | "folded" | "unfolded";
  interactionMode: InteractionMode3D;
  showVectorBasis: boolean;
  showDihedralArc: boolean;
  alphaDeg: number;
  a: number;
  /** 仅直角梯形翻折模型使用（矩形宽），其余模型传入 0 即可 */
  b: number;
  onPointDrag: (newZ: number, maxRadius: number) => void;
}
