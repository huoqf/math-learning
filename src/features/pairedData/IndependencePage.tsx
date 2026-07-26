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
  INDEPENDENCE_PRESETS,
  calculateIndependenceTest,
} from "@/math/pairedData";

export function IndependencePage() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));
  const [indPresetIndex, setIndPresetIndex] = useState<number>(0);

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({ vp, xRange: [-6, 35], yRange: [-4, 30] });

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleIndPresetSelect = (index: number) => {
    setIndPresetIndex(index);
    const p = INDEPENDENCE_PRESETS[index];
    setParams((prev) => ({
      ...prev,
      presetIndex: index,
      freqA: p.a,
      freqB: p.b,
      freqC: p.c,
      freqD: p.d,
    }));
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
    setIndPresetIndex(0);
  };

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["freqA", "freqB", "freqC", "freqD"];
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
      studyMode: "independence",
      points: [],
    });
  }, [params]);

  const headerFormulaLatex = useMemo(() => {
    const a = params.freqA ?? 85;
    const b = params.freqB ?? 15;
    const c = params.freqC ?? 40;
    const d = params.freqD ?? 60;
    const res = calculateIndependenceTest(a, b, c, d);
    return `\\chi^2 = \\frac{${res.n} \\times (${a} \\times ${d} - ${b} \\times ${c})^2}{${a + b} \\times ${c + d} \\times ${a + c} \\times ${b + d}} = ${res.chiSquare.toFixed(3)}`;
  }, [params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="列联表测试情境预设"
            subtitle="选择高考分类变量应用"
          >
            <SelectGrid
              items={INDEPENDENCE_PRESETS.map((p, idx) => ({
                key: String(idx),
                label: p.name,
                fullWidth: true,
              }))}
              value={String(indPresetIndex)}
              onChange={(k) => handleIndPresetSelect(Number(k))}
              variant="filled"
              columns={1}
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="列联表频数调节 (a,b,c,d)"
            subtitle="拖动滑块改变频数"
          >
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
              studyMode="independence"
              points={[]}
              onPointsChange={() => {}}
              freqA={params.freqA ?? 85}
              freqB={params.freqB ?? 15}
              freqC={params.freqC ?? 40}
              freqD={params.freqD ?? 60}
              presetXName="x"
              presetYName="y"
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
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
          title="2×2 列联表独立性检验看板"
        />
      }
    />
  );
}
