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
  cubic: "f(x) = x^3 \\quad (f(-x) = -f(x))",
  quadratic: "f(x) = x^2 \\quad (f(-x) = f(x))",
  abs: "f(x) = |x| \\quad (f(-x) = f(x))",
  reciprocal: "f(x) = \\frac{1}{x} \\quad (f(-x) = -f(x))",
  sin: "f(x) = \\sin x \\quad (f(-x) = -f(x))",
};

export function ParityPage() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [fnType, setFnType] = useState<FnType>("cubic");

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-func-properties", params, {
        mode: "parity",
        fnType,
      }),
    [params, fnType],
  );

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return ["x0", "x1", "x2"]
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
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const tipConfig = useMemo(() => {
    switch (fnType) {
      case "cubic":
        return {
          variant: "primary" as const,
          badge: "高考基础 · 三次奇函数中心对称与单调递增",
          condition: "函数 f(x) = x³，定义域 R 关于坐标原点对称。",
          question:
            "验证 f(-x) = -f(x) 的原点中心对称性，以及割线斜率 k > 0 的单调递增性。",
        };
      case "quadratic":
        return {
          variant: "primary" as const,
          badge: "核心模型 · 二次偶函数轴对称与分段单调",
          condition: "函数 f(x) = x²，定义域 R 关于 y 轴对称。",
          question:
            "验证 f(-x) = f(x) 的 y 轴对称性，观察割线斜率由负转正的单调性转折。",
        };
      case "abs":
        return {
          variant: "warning" as const,
          badge: "高考高频 · 绝对值 V 型偶函数",
          condition: "函数 f(x) = |x|，关于 y 轴折叠对称。",
          question:
            "对比 x₀ 与 -x₀ 处函数值的相等性，并分析原点两侧固定斜率 ±1 的单调性跃迁。",
        };
      case "reciprocal":
        return {
          variant: "danger" as const,
          badge: "易错辨析 · 反比例奇函数与单调区间不能并",
          condition: "函数 f(x) = 1/x，定义域 (-∞, 0) ∪ (0, +∞) 关于原点对称。",
          question:
            "验证 f(-x) = -f(x) 原点对称；警惕‘在定义域内单调递减’的错误表述。",
        };
      case "sin":
        return {
          variant: "info" as const,
          badge: "三角核心 · 正弦奇函数与无穷周期单调区间",
          condition: "函数 f(x) = sin x，定义域 R，f(-x) = -sin x。",
          question: "观察原点中心对称特征，以及各单调增区间内部割线斜率正负。",
        };
    }
  }, [fnType]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="基准函数选择">
            <SelectGrid
              items={[
                { key: "cubic", label: "三次曲线", formula: "y=x^3" },
                { key: "quadratic", label: "二次抛物线", formula: "y=x^2" },
                { key: "abs", label: "绝对值折线", formula: "y=|x|" },
                {
                  key: "reciprocal",
                  label: "反比例双曲线",
                  formula: "y=\\frac{1}{x}",
                },
                { key: "sin", label: "正弦波形", formula: "y=\\sin x" },
              ]}
              value={fnType}
              onChange={(k) => setFnType(k as FnType)}
              variant="outline"
              className="mb-4"
            />
          </LeftPanelSection>
          <LeftPanelSection title="参数调节">
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
                    【模型条件】
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
              mode="parity"
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
          title="单调奇偶性看板"
        />
      }
    />
  );
}
