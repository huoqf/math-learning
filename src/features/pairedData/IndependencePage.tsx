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
  const [indPresetKey, setIndPresetKey] = useState<string>("0");
  const [activeTab, setActiveTab] = useState<string>("standard");

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({ vp, xRange: [-6, 35], yRange: [-4, 30] });

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    if (key.startsWith("freq")) {
      setIndPresetKey("free");
    }
  };

  const handleIndPresetSelect = (key: string) => {
    setIndPresetKey(key);
    if (key === "free") return;
    const index = Number(key);
    const p = INDEPENDENCE_PRESETS[index];
    if (p) {
      setParams((prev) => ({
        ...prev,
        presetIndex: index,
        freqA: p.a,
        freqB: p.b,
        freqC: p.c,
        freqD: p.d,
      }));
    }
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
    setIndPresetKey("0");
    setActiveTab("standard");
  };

  const currentPreset = useMemo(() => {
    if (indPresetKey === "free") {
      return {
        id: "free",
        name: "自由探索与自定义调参",
        shortName: "自由探索",
        a: params.freqA ?? 85,
        b: params.freqB ?? 15,
        c: params.freqC ?? 40,
        d: params.freqD ?? 60,
        labelA: "分类指标 A",
        labelNotA: "分类指标 非A",
        labelB: "指标 B",
        labelNotB: "指标 非B",
        contextDesc:
          "自由调节四格频数与样本量，探究卡方统计量与独立性临界判断。",
      };
    }
    const idx = Number(indPresetKey);
    return INDEPENDENCE_PRESETS[idx] ?? INDEPENDENCE_PRESETS[0];
  }, [indPresetKey, params]);

  const isFreeMode = indPresetKey === "free";

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let keys: string[] = [];

    if (activeTab === "scale") {
      keys = isFreeMode
        ? ["scaleMultiplier", "freqA", "freqB", "freqC", "freqD"]
        : ["scaleMultiplier"];
    } else {
      keys = isFreeMode ? ["freqA", "freqB", "freqC", "freqD"] : [];
    }

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
          importance: meta.importance,
        };
      });
  }, [params, activeTab, isFreeMode]);

  const effectiveScaleMultiplier =
    activeTab === "scale" ? (params.scaleMultiplier ?? 1) : 1;

  const mathData = useMemo(() => {
    return buildMathQuantities(
      "anim-paired-data",
      {
        ...params,
        scaleMultiplier: effectiveScaleMultiplier,
      },
      {
        studyMode: "independence",
        indPresetKey,
        activeTab,
        points: [],
      },
    );
  }, [params, effectiveScaleMultiplier, indPresetKey, activeTab]);

  const tipConfig = useMemo(() => {
    const mult = effectiveScaleMultiplier;
    if (indPresetKey === "free") {
      const a = (params.freqA ?? 85) * mult;
      const b = (params.freqB ?? 15) * mult;
      const c = (params.freqC ?? 40) * mult;
      const d = (params.freqD ?? 60) * mult;
      const totalN = a + b + c + d;
      return {
        badge: "自由探索 · 2×2 列联表",
        condition: `自定义四格观测频数 ($a=${a}, b=${b}, c=${c}, d=${d}$)，总样本量 $n=${totalN}$${mult > 1 ? ` (${mult}\\times \\text{倍增})` : ""}。`,
        question:
          "计算卡方统计量 $\\chi^2 = \\frac{n(ad-bc)^2}{(a+b)(c+d)(a+c)(b+d)}$，对比临界值推断两分类变量是否独立。",
      };
    }

    const p =
      INDEPENDENCE_PRESETS[Number(indPresetKey)] ?? INDEPENDENCE_PRESETS[0];
    const totalN = (p.a + p.b + p.c + p.d) * mult;

    return {
      badge: `高考真题 · ${p.shortName}`,
      condition:
        mult > 1
          ? `${p.conditionDesc} (在样本量放大探究下，总容量扩展为 $n=${totalN}$)`
          : p.conditionDesc,
      question: p.questionDesc,
    };
  }, [params, indPresetKey, effectiveScaleMultiplier]);

  const presetGridItems = useMemo(() => {
    return [
      {
        key: "free",
        label: "自由探索",
      },
      ...INDEPENDENCE_PRESETS.map((p, idx) => ({
        key: String(idx),
        label: p.shortName,
      })),
    ];
  }, []);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="探究实验维度">
            <TabSwitcher
              tabs={[
                { key: "standard", label: "列联表频数检验" },
                { key: "scale", label: "样本容量倍增效应" },
              ]}
              value={activeTab}
              onChange={setActiveTab}
            />
          </LeftPanelSection>

          <LeftPanelSection title="高考典型情境预设">
            <SelectGrid
              items={presetGridItems}
              value={indPresetKey}
              onChange={handleIndPresetSelect}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          <LeftPanelSection
            title={
              activeTab === "scale"
                ? isFreeMode
                  ? "倍增倍率与基准频数调节"
                  : "样本倍增倍率调节"
                : isFreeMode
                  ? "四格频数自主调节"
                  : "高考题设参数状态"
            }
          >
            {paramConfigs.length > 0 ? (
              <ParamControl
                params={paramConfigs}
                onParamChange={handleParamChange}
                onReset={handleReset}
              />
            ) : (
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80 text-[11px] text-neutral-600 leading-relaxed space-y-1">
                <div className="font-semibold text-neutral-800 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  题设基准数据已锁定
                </div>
                <div>
                  当前展示高考真题标准化观测样本。如需自由调节频数，请在上方选择【
                  <strong>自由探索</strong>】。
                </div>
              </div>
            )}
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
              scaleMultiplier={effectiveScaleMultiplier}
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
