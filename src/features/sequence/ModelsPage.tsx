import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { SequenceScene } from "./components/SequenceScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/sequence";

type ModelType =
  "arith-geo" | "telescoping" | "cross-telescoping" | "grouped" | "odd-even";

const Y_RANGES: Record<ModelType, [number, number]> = {
  "arith-geo": [-5, 15],
  telescoping: [-0.5, 1.5],
  "cross-telescoping": [-0.2, 1],
  grouped: [-8, 25],
  "odd-even": [-17, 17],
};

export function ModelsPage() {
  const [modelType, setModelType] = useState<ModelType>("arith-geo");
  const [highlightN, setHighlightN] = useState<number>(1);
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({
    vp,
    xRange: [-1, 16.5],
    yRange: Y_RANGES[modelType],
  });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-sequence", params, {
        activeMode: "models",
        geometricViewType: "points",
        modelType,
        subModel: modelType,
      }),
    [params, modelType],
  );

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys =
      modelType === "arith-geo" || modelType === "grouped"
        ? ["a1", "d", "q", "N"]
        : ["N"];
    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, modelType]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="高考 5 大核心求和模型"
            subtitle="完整覆盖高考解答题与压轴考种"
          >
            <SelectGrid
              items={[
                { key: "arith-geo", label: "错位相减法" },
                { key: "telescoping", label: "标准裂项相消" },
                { key: "cross-telescoping", label: "跨项裂项相消" },
                { key: "grouped", label: "分组求和法" },
                { key: "odd-even", label: "奇偶并项求和" },
              ]}
              value={modelType}
              onChange={(val) => setModelType(val as ModelType)}
            />
          </LeftPanelSection>
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块实时观察几何变化"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <AnimationSvgCanvas
          containerRef={containerRef}
          transform={vp.transform}
        >
          <SequenceScene
            params={params}
            scale={scale}
            vp={vp}
            fontScale={canvasSize.font}
            activeMode="models"
            modelType={modelType}
            highlightN={highlightN}
            onSelectN={setHighlightN}
          />
        </AnimationSvgCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="高考求和模型看板"
        />
      }
    />
  );
}
