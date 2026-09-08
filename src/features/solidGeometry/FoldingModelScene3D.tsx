import type { FoldingModelKind } from "@/math3d/folding";
import { FoldingTrapezoidScene } from "./foldingModels/FoldingTrapezoidScene";
import { FoldingRectangleDiagonalScene } from "./foldingModels/FoldingRectangleDiagonalScene";
import { FoldingTriangleAltitudeScene } from "./foldingModels/FoldingTriangleAltitudeScene";
import { FoldingRhombusScene } from "./foldingModels/FoldingRhombusScene";
import type { FoldingSceneCommonProps } from "./foldingModels/types";

export type { FoldingSceneCommonProps } from "./foldingModels/types";

export interface FoldingModelScene3DProps extends FoldingSceneCommonProps {
  model: FoldingModelKind;
}

/**
 * 翻折模型 3D 场景分发器。
 * 各几何模型（直角梯形 / 矩形对角线 / 等腰三角形沿高 / 菱形）的渲染
 * 已下沉到 foldingModels/ 下的独立子场景组件。
 */
export function FoldingModelScene3D({
  model,
  ...common
}: FoldingModelScene3DProps) {
  switch (model) {
    case "trapezoid":
      return <FoldingTrapezoidScene {...common} />;
    case "rectangleDiagonal":
      return <FoldingRectangleDiagonalScene {...common} />;
    case "triangleAltitude":
      return <FoldingTriangleAltitudeScene {...common} />;
    case "rhombus":
      return <FoldingRhombusScene {...common} />;
  }
}
