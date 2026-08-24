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
import { CANVAS_PRESETS } from "@/theme";
import { ZeroScene } from "./components/ZeroScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/funcZero";

export function FuncZeroAnimation() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  const mathData = useMemo(
    () => buildMathQuantities("anim-func-zero", params),
    [params],
  );

  const formulaLatex = "f(x) = x^3 - x - 2 = 0 \\quad (f(a) \\cdot f(b) < 0)";

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["intervalM", "intervalN", "bisectionSteps"];
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
    const m = params.intervalM ?? 1.0;
    const n = params.intervalN ?? 2.0;
    const steps = params.bisectionSteps ?? 1;
    const len = Math.abs(n - m) / Math.pow(2, steps);
    return {
      variant: "primary" as const,
      badge: "高考核心 · 零点存在性定理与二分逼近",
      condition: `在初始区间 [${m.toFixed(1)}, ${n.toFixed(1)}] 上连续，端点异号 f(${m.toFixed(1)})·f(${n.toFixed(1)}) < 0。`,
      question: `执行 ${steps} 次二分逼近，区间长度缩减为 (b-a)/2ⁿ = ${len.toFixed(4)}，逼近零点 x* ≈ 1.521。`,
    };
  }, [params.intervalM, params.intervalN, params.bisectionSteps]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="零点逼近参数"
            subtitle="调节区间与步数观察二分逼近"
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
        <div className="w-full h-full relative flex flex-col bg-white">
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ZeroScene
              params={params}
              scale={scale}
              vp={vp}
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
          title="零点逼近看板"
        />
      }
    />
  );
}
