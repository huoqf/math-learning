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
import { ExpLogScene } from "./components/ExpLogScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/funcExpLog";

export function PowerPage() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-func-explog", params, { subExpLog: "power" }),
    [params],
  );

  const formulaLatex = useMemo(() => {
    const alphaVal = (params.powerAlpha ?? 2.0).toFixed(1);
    return `y = x^{\\color{${MATH_COLORS.paramPrimary}}{${alphaVal}}}`;
  }, [params.powerAlpha]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["x0", "powerAlpha"];
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
    const alpha = params.powerAlpha ?? 2.0;
    if (alpha > 1) {
      return {
        variant: "primary" as const,
        badge: "高考基础 · 幂函数超线性增长 (α > 1)",
        condition: `幂指数 α = ${alpha.toFixed(1)} > 1，第一象限图象恒过定点 (0, 0) 与 (1, 1)。`,
        question:
          "观察在 (0, 1) 区间内增长慢于 y = x，而在 (1, +∞) 区间内增长快于 y = x 且凹弧凸起的形态特征。",
      };
    } else if (alpha > 0) {
      return {
        variant: "warning" as const,
        badge: "高考高频 · 幂函数根号型下垂 (0 < α < 1)",
        condition: `幂指数 0 < α = ${alpha.toFixed(1)} < 1，恒过定点 (0, 0) 与 (1, 1)。`,
        question:
          "观察原点切线竖直趋向无穷大、在 (1, +∞) 上增长逐渐平缓且凸弧下垂的趋势。",
      };
    } else if (Math.abs(alpha) < 1e-6) {
      return {
        variant: "info" as const,
        badge: "特殊退化 · 零次常数水平线 (α = 0)",
        condition: "幂指数 α = 0，定义域去心 x ≠ 0，y = 1。",
        question: "观察第一象限与第二象限退化为 y = 1 水平线，x = 0 处无定义。",
      };
    } else {
      return {
        variant: "danger" as const,
        badge: "核心考点 · 负指数双曲线分支 (α < 0)",
        condition: `幂指数 α = ${alpha.toFixed(1)} < 0，定义域不含原点，图象恒过定点 (1, 1)。`,
        question:
          "验证在 (0, +∞) 上单调递减，且双坐标轴 x = 0 与 y = 0 均为渐近线。",
      };
    }
  }, [params.powerAlpha]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="幂函数" subtitle="y = xᵅ 的图像与性质">
            <div className="text-xs text-neutral-600 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200/60 leading-relaxed">
              第一象限恒过公共定点 <b>(1, 1)</b>，形态随指数 α
              符号及大小剧烈分化。
            </div>
          </LeftPanelSection>
          <LeftPanelSection
            title="参数调节"
            subtitle="调节参数观察曲线与几何演变"
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
            <ExpLogScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              funcType="power"
              showInverse={false}
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
          title="幂函数看板"
        />
      }
    />
  );
}
