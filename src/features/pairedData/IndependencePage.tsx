import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TabSwitcher,
  TipCard,
  KatexFormula,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { PairedDataScene } from "./components/PairedDataScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/pairedData";
import { INDEPENDENCE_PRESETS } from "@/math/pairedData";

// 辅助渲染混合文本（支持 $...$ 内嵌公式与普通文本自然换行）
function renderMixedText(text: string) {
  if (!text) return null;
  const parts = text.split(/\$(.*?)\$/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <KatexFormula
          key={i}
          formula={part}
          mode="inline"
          className="!text-[11px] !my-0 !mx-0.5"
        />
      );
    }
    return <span key={i}>{part}</span>;
  });
}

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

  const tipConfig = useMemo(() => {
    const a = params.freqA ?? currentPreset.a;
    const b = params.freqB ?? currentPreset.b;
    const c = params.freqC ?? currentPreset.c;
    const d = params.freqD ?? currentPreset.d;
    const totalN = a + b + c + d;

    return {
      badge: `高考经典 · ${currentPreset.name}`,
      condition: `观测 $2 \\times 2$ 列联表各格频数 ($a=${a}, b=${b}, c=${c}, d=${d}$)，总样本容量 $n=${totalN}$。`,
      question:
        "计算卡方统计量 $\\chi^2 = \\frac{n(ad-bc)^2}{(a+b)(c+d)(a+c)(b+d)}$，检验两分类变量是否独立关联。",
    };
  }, [params, currentPreset]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="探究实验模式">
            <TabSwitcher
              tabs={[
                { key: "custom", label: "自由调参" },
                { key: "scale", label: "样本倍增探究" },
              ]}
              value={activeTab}
              onChange={setActiveTab}
            />
          </LeftPanelSection>

          <LeftPanelSection title="新高考真题情境预设">
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

          <LeftPanelSection title="列联表频数与参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant="danger">
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【初始条件】
                  </span>
                  <span className="text-neutral-600">
                    {renderMixedText(tipConfig.condition)}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【核心设问】
                  </span>
                  <span className="text-neutral-600">
                    {renderMixedText(tipConfig.question)}
                  </span>
                </div>
              </div>
            </TipCard>
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
