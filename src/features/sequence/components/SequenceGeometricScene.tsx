/**
 * src/features/sequence/components/SequenceGeometricScene.tsx
 * 数列实验室 - 等比模型 2D SVG 场景纯分发器
 * 按 geometricSubMode 分发到 5 个子场景组件（数据统一来自 useSequenceParams）
 */
import type { SceneScale, ViewportInfo } from "@/hooks";
import { SequenceGeometricExponentialScene } from "./SequenceGeometricExponentialScene";
import { SequenceGeometricSegmentScene } from "./SequenceGeometricSegmentScene";
import { SequenceGeometricStaggerSumScene } from "./SequenceGeometricStaggerSumScene";
import { SequenceGeometricProductMaxScene } from "./SequenceGeometricProductMaxScene";
import { SequenceGeometricTessellationScene } from "./SequenceGeometricTessellationScene";

interface SequenceGeometricSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  geometricViewType?: "points" | "tessellation";
  geometricSubMode?:
    "exponential" | "staggerSum" | "segment" | "productMax" | "tessellation";
  highlightN?: number;
  onSelectN?: (n: number) => void;
}

export function SequenceGeometricScene({
  params,
  scale,
  vp,
  fontScale,
  geometricSubMode = "exponential",
  geometricViewType = "points",
  highlightN = 1,
  onSelectN,
}: SequenceGeometricSceneProps) {
  // 专题 A: 通项与指数模型 (母函数、散点、公比6态)
  if (geometricSubMode === "exponential") {
    return (
      <SequenceGeometricExponentialScene
        params={params}
        scale={scale}
        fontScale={fontScale}
        highlightN={highlightN}
        onSelectN={onSelectN}
      />
    );
  }

  // 专题 B: 错位相减法推导 (两行对齐、中间相消、保留首尾)
  if (geometricSubMode === "staggerSum") {
    return (
      <SequenceGeometricStaggerSumScene
        params={params}
        vp={vp}
        fontScale={fontScale}
      />
    );
  }

  // 专题 C: 等长片段性质 (Sk, S2k-Sk, S3k-S2k 等比条带)
  if (geometricSubMode === "segment") {
    return (
      <SequenceGeometricSegmentScene
        params={params}
        scale={scale}
        fontScale={fontScale}
        highlightN={highlightN}
        onSelectN={onSelectN}
      />
    );
  }

  // 专题 D: 前 n 项积与极值 (以 1 为分界点，对数二次模型)
  if (geometricSubMode === "productMax") {
    return (
      <SequenceGeometricProductMaxScene
        params={params}
        scale={scale}
        fontScale={fontScale}
        highlightN={highlightN}
        onSelectN={onSelectN}
      />
    );
  }

  // 专题 E: 正方形自相似无限剖分 (无字证明)
  if (
    geometricSubMode === "tessellation" ||
    geometricViewType === "tessellation"
  ) {
    return (
      <SequenceGeometricTessellationScene
        params={params}
        vp={vp}
        fontScale={fontScale}
      />
    );
  }

  return null;
}
