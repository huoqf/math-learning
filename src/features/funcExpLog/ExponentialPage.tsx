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

export function ExponentialPage() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [showInverse, setShowInverse] = useState(false);

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-func-explog", params, {
        subExpLog: "exponential",
      }),
    [params],
  );

  const formulaLatex = useMemo(() => {
    const aVal = (params.baseA ?? 2.0).toFixed(1);
    return showInverse
      ? `y = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}^x \\iff x = \\log_{\\color{${MATH_COLORS.paramPrimary}}{${aVal}}} y`
      : `y = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}^x`;
  }, [showInverse, params.baseA]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["x0", "baseA"];
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
    const a = params.baseA ?? 2.0;
    if (showInverse) {
      return {
        variant: "info" as const,
        badge: "高考高频 · 指数与对数反函数对称",
        condition: `指数函数 y = ${a.toFixed(1)}ˣ 与对数函数 y = log_{${a.toFixed(1)}} x 互为反函数。`,
        question:
          "观察两曲线关于直线 y = x 严格轴对称，且定点 (0,1) 与 (1,0) 互为对称镜像。",
      };
    }
    if (a > 1) {
      return {
        variant: "primary" as const,
        badge: "核心基准 · 指数爆炸与递增模型 (a > 1)",
        condition: `底数 a = ${a.toFixed(1)} > 1，函数恒过定点 (0, 1)，水平渐近线为 x 轴 (y = 0)。`,
        question:
          "探究 x → +∞ 时的指数爆炸增长速度，以及 x → -∞ 时图象单侧无限贴近 x 轴的性质。",
      };
    } else {
      return {
        variant: "warning" as const,
        badge: "核心基准 · 衰减指数与递减模型 (0 < a < 1)",
        condition: `底数 0 < a = ${a.toFixed(1)} < 1，函数恒过定点 (0, 1)。`,
        question:
          "验证在 R 上的单调递减性，以及随自变量增大函数值快速趋向 0 的衰减趋势。",
      };
    }
  }, [params.baseA, showInverse]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="指数函数" subtitle="y = aˣ 的图像与性质">
            <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInverse}
                onChange={(e) => setShowInverse(e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              显示反函数对称 (y = x)
            </label>
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
              funcType="exponential"
              showInverse={showInverse}
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
          title="指数函数看板"
        />
      }
    />
  );
}
