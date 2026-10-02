/**
 * src/features/sequence/components/SequenceScene.tsx
 * 数列实验室 2D SVG 动态场景 - 纯分发器
 * 按 activeMode 分发到 4 个子场景组件（数据统一来自 useSequenceParams）
 */
import type { SceneScale, ViewportInfo } from "@/hooks";
import { SequenceArithmeticScene } from "./SequenceArithmeticScene";
import { SequenceGeometricScene } from "./SequenceGeometricScene";
import { SequenceModelsScene } from "./SequenceModelsScene";

export interface SequenceSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  activeMode: "arithmetic" | "geometric" | "models";
  arithmeticSubMode?: "linear" | "gauss" | "quadratic" | "segment" | "absSum";
  geometricViewType?: "points" | "tessellation";
  geometricSubMode?:
    "exponential" | "staggerSum" | "segment" | "productMax" | "tessellation";
  modelType?:
    | "arith-geo"
    | "telescoping"
    | "cross-telescoping"
    | "grouped"
    | "odd-even"
    | "abs-sum";
  highlightN?: number;
  onSelectN?: (n: number) => void;
}

export function SequenceScene({
  params,
  scale,
  vp,
  fontScale,
  activeMode,
  arithmeticSubMode = "linear",
  geometricViewType = "points",
  geometricSubMode = "exponential",
  modelType = "arith-geo",
  highlightN = 1,
  onSelectN,
}: SequenceSceneProps) {
  if (activeMode === "arithmetic") {
    return (
      <SequenceArithmeticScene
        params={params}
        scale={scale}
        vp={vp}
        fontScale={fontScale}
        arithmeticSubMode={arithmeticSubMode}
        highlightN={highlightN}
        onSelectN={onSelectN}
      />
    );
  }

  if (activeMode === "geometric") {
    return (
      <SequenceGeometricScene
        params={params}
        scale={scale}
        vp={vp}
        fontScale={fontScale}
        geometricSubMode={geometricSubMode}
        geometricViewType={geometricViewType}
        highlightN={highlightN}
        onSelectN={onSelectN}
      />
    );
  }

  if (activeMode === "models") {
    return (
      <SequenceModelsScene
        params={params}
        scale={scale}
        vp={vp}
        fontScale={fontScale}
        modelType={modelType}
        highlightN={highlightN}
        onSelectN={onSelectN}
      />
    );
  }

  return null;
}
