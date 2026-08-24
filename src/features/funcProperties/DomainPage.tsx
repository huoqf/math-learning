import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { PropertiesScene } from "./components/PropertiesScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/funcProperties";

type FnType = "cubic" | "quadratic" | "abs" | "reciprocal" | "sin";

const FORMULA_MAP: Record<FnType, string> = {
  cubic: "f(x) = x^3 \\quad (D = \\mathbb{R}, \\ R = \\mathbb{R})",
  quadratic: "f(x) = x^2 \\quad (D = \\mathbb{R}, \\ R = [0, +\\infty))",
  abs: "f(x) = |x| \\quad (D = \\mathbb{R}, \\ R = [0, +\\infty))",
  reciprocal:
    "f(x) = \\frac{1}{x} \\quad (D = (-\\infty, 0) \\cup (0, +\\infty))",
  sin: "f(x) = \\sin x \\quad (D = \\mathbb{R}, \\ R = [-1, 1])",
};

export function DomainPage() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [fnType, setFnType] = useState<FnType>("cubic");

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-func-properties", params, {
        mode: "domain",
        fnType,
      }),
    [params, fnType],
  );

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return ["x0"]
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
    switch (fnType) {
      case "cubic":
        return {
          variant: "primary" as const,
          badge: "基础认知 · 三次多项式定义域与值域",
          condition: "函数 f(x) = x³，无分母、根号或对数等限制结构。",
          question:
            "观察 X/Y 轴投影区间，确认自变量与函数值均可遍历全体实数 R。",
        };
      case "quadratic":
        return {
          variant: "primary" as const,
          badge: "核心考点 · 二次函数单侧有界值域",
          condition: "函数 f(x) = x²，x ∈ R，抛物线开口向上且顶点位于原点。",
          question: "拖动探针 x₀，观察 Y 轴非负投影区间 [0, +∞) 的下界临界点。",
        };
      case "abs":
        return {
          variant: "warning" as const,
          badge: "高考高频 · 绝对值非负值域模型",
          condition: "函数 f(x) = |x|，分段线性并在 x = 0 处折叠。",
          question: "验证定义域 R 与非负值域 [0, +∞) 在折点处的投影变化。",
        };
      case "reciprocal":
        return {
          variant: "danger" as const,
          badge: "易错陷阱 · 反比例分母去心无定义点",
          condition: "函数 f(x) = 1/x，分母限制条件 x ≠ 0。",
          question:
            "拖动 x₀ 逼近 0，观察双侧趋向无穷大与 X/Y 轴去心零点的间断特征。",
        };
      case "sin":
        return {
          variant: "info" as const,
          badge: "周期有界 · 正弦波动紧致值域",
          condition: "函数 f(x) = sin x，具有 2π 周期性与全局有界性。",
          question:
            "观察定义域 R 与闭区间值域 [-1, 1] 之间的周期映射波峰与波谷。",
        };
    }
  }, [fnType]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="基准函数选择"
            subtitle="切换观察不同函数的定义域与值域"
          >
            <SelectGrid
              items={[
                { key: "cubic", label: "y = x³", formula: "y=x^3" },
                { key: "quadratic", label: "y = x²", formula: "y=x^2" },
                { key: "abs", label: "y = |x|", formula: "y=|x|" },
                {
                  key: "reciprocal",
                  label: "y = 1/x",
                  formula: "y=\\frac{1}{x}",
                },
                { key: "sin", label: "y = sin x", formula: "y=\\sin x" },
              ]}
              value={fnType}
              onChange={(k) => setFnType(k)}
              variant="outline"
              className="mb-4"
            />
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
            <KatexFormula formula={FORMULA_MAP[fnType]} mode="inline" />
          </div>
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <PropertiesScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              fnType={fnType}
              mode="domain"
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
          title="定义域与值域看板"
        />
      }
    />
  );
}
