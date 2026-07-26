import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { PairedDataScene } from "./components/PairedDataScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/pairedData";
import {
  REGRESSION_PRESETS,
  calculateLinearRegression,
  Point2D,
} from "@/math/pairedData";

export function RegressionPage() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));
  const [regPresetIndex, setRegPresetIndex] = useState<number>(0);
  const [points, setPoints] = useState<Point2D[]>(
    () => REGRESSION_PRESETS[0].points,
  );

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const currentPreset = REGRESSION_PRESETS[regPresetIndex];
  const xRange: [number, number] = currentPreset.xRange;
  const yRange: [number, number] = currentPreset.yRange;

  const calcStep = (range: number) => {
    if (range <= 8) return 1;
    if (range <= 16) return 2;
    if (range <= 30) return 5;
    return 10;
  };
  const xStep = calcStep(xRange[1] - xRange[0]);
  const yStep = calcStep(yRange[1] - yRange[0]);

  const scale = useSceneScale({ vp, xRange, yRange });

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegPresetSelect = (index: number) => {
    setRegPresetIndex(index);
    setPoints(REGRESSION_PRESETS[index].points);
    handleParamChange("presetIndex", index);
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
    setRegPresetIndex(0);
    setPoints(REGRESSION_PRESETS[0].points);
  };

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["noise"];
    return keys
      .filter((k) => k in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params]);

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-paired-data", params, {
      studyMode: "regression",
      points,
    });
  }, [params, points]);

  const headerFormulaLatex = useMemo(() => {
    const res = calculateLinearRegression(points);
    if (!res.isValid) return "\\text{数据无法求解线性回归方程}";
    const bStr = res.b.toFixed(3);
    const aSign = res.a >= 0 ? "+" : "-";
    const aStr = Math.abs(res.a).toFixed(3);
    return `\\hat{y} = ${bStr}x ${aSign} ${aStr} \\quad (r = ${res.r.toFixed(3)}, R^2 = ${res.rSquare.toFixed(3)})`;
  }, [points]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="高考典型例题预设"
            subtitle="选择真实考题背景数据"
          >
            <SelectGrid
              items={REGRESSION_PRESETS.map((p, idx) => ({
                key: String(idx),
                label: p.name,
                fullWidth: true,
              }))}
              value={String(regPresetIndex)}
              onChange={(k) => handleRegPresetSelect(Number(k))}
              variant="filled"
              columns={1}
            />
          </LeftPanelSection>

          <LeftPanelSection title="散点控制" subtitle="拖动散点或微调">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm max-w-[90%] overflow-hidden">
            <KatexFormula formula={headerFormulaLatex} mode="inline" />
          </div>

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <PairedDataScene
              studyMode="regression"
              points={points}
              onPointsChange={setPoints}
              freqA={85}
              freqB={15}
              freqC={40}
              freqD={60}
              presetXName={currentPreset.xName}
              presetYName={currentPreset.yName}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              xStep={xStep}
              yStep={yStep}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="一元线性回归分析看板"
        />
      }
    />
  );
}
