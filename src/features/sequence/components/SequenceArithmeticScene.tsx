/**
 * src/features/sequence/components/SequenceArithmeticScene.tsx
 * 等差数列 2D SVG 场景 - 纯分发器
 * 按 arithmeticSubMode 分发到 5 个专题子场景组件（数据统一来自 useSequenceParams）
 */
import type { SceneScale, ViewportInfo } from "@/hooks";
import { SequenceArithmeticLinearScene } from "./SequenceArithmeticLinearScene";
import { SequenceArithmeticGaussScene } from "./SequenceArithmeticGaussScene";
import { SequenceArithmeticQuadraticScene } from "./SequenceArithmeticQuadraticScene";
import { SequenceArithmeticSegmentScene } from "./SequenceArithmeticSegmentScene";
import { SequenceArithmeticAbsSumScene } from "./SequenceArithmeticAbsSumScene";

export interface SequenceArithmeticSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  arithmeticSubMode?: "linear" | "gauss" | "quadratic" | "segment" | "absSum";
  highlightN?: number;
  onSelectN?: (n: number) => void;
}

export function SequenceArithmeticScene({
  params,
  scale,
  vp,
  fontScale,
  arithmeticSubMode = "linear",
  highlightN = 1,
  onSelectN,
}: SequenceArithmeticSceneProps) {
  const subProps = {
    params,
    scale,
    vp,
    fontScale,
    highlightN,
    onSelectN,
  };

  switch (arithmeticSubMode) {
    case "gauss":
      return <SequenceArithmeticGaussScene {...subProps} />;
    case "quadratic":
      return <SequenceArithmeticQuadraticScene {...subProps} />;
    case "segment":
      return <SequenceArithmeticSegmentScene {...subProps} />;
    case "absSum":
      return <SequenceArithmeticAbsSumScene {...subProps} />;
    default:
      return <SequenceArithmeticLinearScene {...subProps} />;
  }
}
