import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { NikeScene } from "./components/NikeScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/nike";

export function AmgmPage() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const mathData = useMemo(
    () => buildMathQuantities("anim-nike", params, { activeMode: "amgm" }),
    [params],
  );

  const equationLatex = useMemo(() => {
    const aVal = params.a.toFixed(1);
    const bVal = params.b.toFixed(1);
    return `f(x) = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}x + \\frac{\\color{${MATH_COLORS.paramSecondary}}{${bVal}}}{x} \\ge 2\\sqrt{\\color{${MATH_COLORS.paramPrimary}}{${aVal}} \\cdot \\color{${MATH_COLORS.paramSecondary}}{${bVal}}}`;
  }, [params.a, params.b]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["a", "b", "x0"];
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
  }, [params]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 动态教学提示配置
  const tipConfig = useMemo(() => {
    const { a, b } = params;
    const xMin = Math.sqrt(Math.max(1e-4, b / Math.max(1e-4, a))).toFixed(2);
    const minVal = (2 * Math.sqrt(Math.max(0, a * b))).toFixed(2);
    return {
      variant: "success" as const,
      badge: "高考核心 · 均值不等式与对勾最值联动",
      condition: `已知正数 a = ${a.toFixed(1)}, b = ${b.toFixed(1)}，当 x > 0 时满足“一正、二定、三相等”。`,
      question: `求函数最小值 min = 2√(ab) = ${minVal}，验证等号成立充要条件 ax = b/x 即 x = √(b/a) = ${xMin}。`,
    };
  }, [params.a, params.b]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="均值不等式"
            subtitle="AM-GM 不等式的几何直观"
          >
            <div className="text-xs text-neutral-600 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200/60 leading-relaxed space-y-1">
              <p className="font-semibold text-neutral-800">AM-GM 定理条件：</p>
              <p>
                1. <b>正</b>：x &gt; 0, a &gt; 0, b &gt; 0
              </p>
              <p>
                2. <b>定</b>：乘积项 (ax)·(b/x) = ab 为定值
              </p>
              <p>
                3. <b>等</b>：ax = b/x 时取等号最小值
              </p>
            </div>
          </LeftPanelSection>
          <LeftPanelSection
            title="动态参数调节"
            subtitle="拖动滑块或中屏控制点探索"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>
          {/* 教学导引与题设背景 */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【初始条件】
                  </span>
                  <span className="text-neutral-600">
                    {tipConfig.condition}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【核心设问】
                  </span>
                  <span className="text-neutral-600">{tipConfig.question}</span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white overflow-hidden">
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <NikeScene
              params={params}
              scale={scale}
              vp={vp}
              activeMode="amgm"
              onParamChange={handleParamChange}
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
          title="均值不等式看板"
        />
      }
    />
  );
}
