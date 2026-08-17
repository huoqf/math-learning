import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TabSwitcher,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { PairedDataScene } from "./components/PairedDataScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/pairedData";
import { INDEPENDENCE_PRESETS } from "@/math/pairedData";

export function IndependencePage() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));
  const [indPresetIndex, setIndPresetIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("custom");

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
    setActiveTab("custom");
  };

  const currentPreset = useMemo(() => {
    return INDEPENDENCE_PRESETS[indPresetIndex] ?? INDEPENDENCE_PRESETS[0];
  }, [indPresetIndex]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys =
      activeTab === "scale"
        ? ["scaleMultiplier", "freqA", "freqB", "freqC", "freqD"]
        : ["freqA", "freqB", "freqC", "freqD"];

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
  }, [params, activeTab]);

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-paired-data", params, {
      studyMode: "independence",
      points: [],
    });
  }, [params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="探究实验模式"
            subtitle="选择自由调参或样本量倍增探究"
          >
            <TabSwitcher
              tabs={[
                { key: "custom", label: "自由调参" },
                { key: "scale", label: "样本倍增探究" },
              ]}
              value={activeTab}
              onChange={setActiveTab}
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="新高考真题情境预设"
            subtitle={currentPreset.contextDesc ?? "选择高考分类变量应用"}
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
            title="列联表频数与参数调节"
            subtitle={
              activeTab === "scale"
                ? "拖动倍增因子 k，观察频数比例不变时 χ² 线性增长规律"
                : "拖动滑块改变各格频数 (a, b, c, d)"
            }
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
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <PairedDataScene
              studyMode="independence"
              points={[]}
              onPointsChange={() => {}}
              freqA={params.freqA ?? currentPreset.a}
              freqB={params.freqB ?? currentPreset.b}
              freqC={params.freqC ?? currentPreset.c}
              freqD={params.freqD ?? currentPreset.d}
              labelA={currentPreset.labelA}
              labelNotA={currentPreset.labelNotA}
              labelB={currentPreset.labelB}
              labelNotB={currentPreset.labelNotB}
              scaleMultiplier={params.scaleMultiplier ?? 1}
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
