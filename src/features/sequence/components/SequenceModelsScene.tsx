/**
 * src/features/sequence/components/SequenceModelsScene.tsx
 * 数列实验室 - 高考求和模型 2D SVG 场景（纯分发器）
 * 按 modelType 分发到 5 个子场景组件（数据统一来自 useSequenceParams）。
 * 各子场景实现见 SequenceModelsArithGeoScene / Telescoping / AbsSum / Grouped / OddEven。
 */
import type { SceneScale, ViewportInfo } from "@/hooks";
import { useSequenceParams } from "./useSequenceData";
import { SequenceModelsArithGeoScene } from "./SequenceModelsArithGeoScene";
import { SequenceModelsTelescopingScene } from "./SequenceModelsTelescopingScene";
import { SequenceModelsAbsSumScene } from "./SequenceModelsAbsSumScene";
import { SequenceModelsGroupedScene } from "./SequenceModelsGroupedScene";
import { SequenceModelsOddEvenScene } from "./SequenceModelsOddEvenScene";

interface SequenceModelsSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
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

export function SequenceModelsScene({
  params,
  scale,
  vp,
  fontScale,
  modelType = "arith-geo",
}: SequenceModelsSceneProps) {
  const {
    a1,
    d,
    q,
    N,
    sumStep,
    teleGap,
    arithGeoData,
    telescopingData,
    crossTelescopingData,
    groupedData,
    oddEvenData,
    absSumData,
    radicalTeleData,
  } = useSequenceParams(params);

  if (modelType === "arith-geo") {
    return (
      <SequenceModelsArithGeoScene
        terms={arithGeoData.terms}
        q={q}
        N={N}
        sumStep={sumStep}
        vp={vp}
        scale={scale}
        fontScale={fontScale}
      />
    );
  }

  if (modelType === "telescoping") {
    return (
      <SequenceModelsTelescopingScene
        teleGap={teleGap}
        N={N}
        telescopingData={telescopingData}
        crossTelescopingData={crossTelescopingData}
        radicalTeleData={radicalTeleData}
        vp={vp}
        scale={scale}
        fontScale={fontScale}
      />
    );
  }

  if (modelType === "abs-sum") {
    return (
      <SequenceModelsAbsSumScene
        absSumData={absSumData}
        a1={a1}
        d={d}
        scale={scale}
        fontScale={fontScale}
      />
    );
  }

  if (modelType === "grouped") {
    return (
      <SequenceModelsGroupedScene
        groupedData={groupedData}
        vp={vp}
        scale={scale}
        fontScale={fontScale}
      />
    );
  }

  if (modelType === "odd-even") {
    return (
      <SequenceModelsOddEvenScene
        oddEvenData={oddEvenData}
        scale={scale}
        fontScale={fontScale}
      />
    );
  }

  return null;
}
