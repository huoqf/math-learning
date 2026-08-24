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

export function ShiftedPage() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const mathData = useMemo(
    () => buildMathQuantities("anim-nike", params, { activeMode: "shifted" }),
    [params],
  );

  const equationLatex = useMemo(() => {
    const aVal = params.a.toFixed(1);
    const bVal = params.b.toFixed(1);
    const hVal = params.h.toFixed(1);
    const cVal = params.c.toFixed(1);
    return `y = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}(x - \\color{${MATH_COLORS.paramTertiary}}{${hVal}}) + \\color{${MATH_COLORS.paramTertiary}}{${cVal}} + \\frac{\\color{${MATH_COLORS.paramSecondary}}{${bVal}}}{x - \\color{${MATH_COLORS.paramTertiary}}{${hVal}}}`;
  }, [params.a, params.b, params.h, params.c]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["a", "b", "h", "c", "x0"];
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
    const { a, b, h, c } = params;
    return {
      variant: "primary" as const,
      badge: "高考难点 · 平移双曲线与分式换元模型",
      condition: `中心平移至 (${h.toFixed(1)}, ${c.toFixed(1)})，渐近线为 x = ${h.toFixed(1)} 与 y = ${a.toFixed(1)}(x - ${h.toFixed(1)}) + ${c.toFixed(1)}，分子系数 b = ${b.toFixed(1)}。`,
      question: `通过换元法 u = x - ${h.toFixed(1)} 将复杂分式函数转化为标准${b >= 0 ? "对勾" : "飘带"}模型 y - ${c.toFixed(1)} = ${a.toFixed(1)}u + ${b.toFixed(1)}/u，求解值域与单调区间。`,
    };
  }, [params.a, params.b, params.h, params.c]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="平移双曲线" subtitle="对勾函数的平移变换">
            <div className="text-xs text-neutral-600 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200/60 leading-relaxed space-y-1">
              <p>
                <b>对称中心</b>：(h, c) = ({params.h.toFixed(1)},{" "}
                {params.c.toFixed(1)})
              </p>
              <p>
                <b>两条渐近线</b>：x = {params.h.toFixed(1)} 与 y = a(x-h)+c
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
              activeMode="shifted"
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
          title="平移双曲线看板"
        />
      }
    />
  );
}
