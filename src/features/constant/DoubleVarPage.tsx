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
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/constant";
import { DoubleVarScene } from "./components/DoubleVarScene";

export function DoubleVarPage() {
  const [selectedLogic, setSelectedLogic] = useState<
    "all_all" | "all_exist" | "exist_all" | "exist_exist" | "same_var"
  >("all_all");

  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-0.5, 4],
    yRange: [-3, 7],
  });

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-constant-double", params, {
      selectedLogic,
    });
  }, [params, selectedLogic]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["xf", "yf", "xg", "yg"];
    return keys.map((key) => {
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

  const formulasLatex = useMemo(() => {
    if (selectedLogic === "same_var") {
      const fStr = `f(x) = (x - ${params.xf.toFixed(2)})^2 + \\color{${MATH_COLORS.paramPrimary}}{${params.yf.toFixed(2)}}, \\; g(x) = -(x - ${params.xg.toFixed(2)})^2 + \\color{${MATH_COLORS.paramSecondary}}{${params.yg.toFixed(2)}}`;
      const goalStr = `\\text{目标：对 } \\forall x \\in I_1 \\cap I_2 = [1.50, 2.00], \\; f(x) \\ge g(x)`;
      return { line1: fStr, line2: goalStr };
    } else {
      const fStr = `f(x) = (x - ${params.xf.toFixed(2)})^2 + \\color{${MATH_COLORS.paramPrimary}}{${params.yf.toFixed(2)}} \\quad x \\in [0.5, 2.0]`;
      const gStr = `g(x) = -(x - ${params.xg.toFixed(2)})^2 + \\color{${MATH_COLORS.paramSecondary}}{${params.yg.toFixed(2)}} \\quad x \\in [1.5, 3.0]`;
      return { line1: fStr, line2: gStr };
    }
  }, [selectedLogic, params]);

  // 教学导引与题设背景配置
  const tipConfig = useMemo(() => {
    switch (selectedLogic) {
      case "all_all":
        return {
          variant: "primary" as const,
          badge: "高考压轴 · 双变量任意对任意 (极值隔离)",
          condition:
            "给定函数 f(x) 与 g(x)，自变量区间分别为 [0.5, 2.0] 与 [1.5, 3.0]。",
          question:
            "求参数范围，使得对任意 x₁ 与任意 x₂，恒有 f(x₁) ≥ g(x₂) 成立。",
        };
      case "all_exist":
        return {
          variant: "info" as const,
          badge: "高考压轴 · 任意对存在 (值域包含)",
          condition:
            "给定函数 f(x) 与 g(x)，自变量区间分别为 [0.5, 2.0] 与 [1.5, 3.0]。",
          question:
            "求参数范围，使得对任意 x₁，总存在 x₂ 满足 f(x₁) = g(x₂)（或 f(x₁) ≤ g(x₂)）。",
        };
      case "exist_all":
        return {
          variant: "warning" as const,
          badge: "高考压轴 · 存在对任意 (最值压制)",
          condition:
            "给定函数 f(x) 与 g(x)，自变量区间分别为 [0.5, 2.0] 与 [1.5, 3.0]。",
          question:
            "求参数范围，使得存在 x₁，对任意 x₂ 均有 f(x₁) ≥ g(x₂) 成立。",
        };
      case "exist_exist":
        return {
          variant: "warning" as const,
          badge: "高考压轴 · 存在对存在 (值域相交)",
          condition:
            "给定函数 f(x) 与 g(x)，自变量区间分别为 [0.5, 2.0] 与 [1.5, 3.0]。",
          question:
            "求参数范围，使得存在 x₁ 与 x₂ 满足 f(x₁) = g(x₂)（两函数图象有重合值域）。",
        };
      case "same_var":
        return {
          variant: "primary" as const,
          badge: "高考压轴 · 同自变量对垒 (差函数)",
          condition: "在公共区间 x ∈ [1.5, 2.0] 上考察双函数 f(x) 与 g(x)。",
          question:
            "求参数范围，使得在公共区间内对任意相同自变量 x 均有 f(x) ≥ g(x)。",
        };
      default:
        return {
          variant: "primary" as const,
          badge: "高考压轴 · 双变量博弈问题",
          condition: "考察两函数 f(x) 与 g(x) 在不同量词约束下的数值关系。",
          question: "求满足特定全称与存在量词不等式关系的参数取值范围。",
        };
    }
  }, [selectedLogic]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="高考双变量博弈"
            subtitle="双动点对决与同变量差函数博弈"
          >
            <SelectGrid
              items={[
                {
                  key: "all_all",
                  label: "∀x₁, ∀x₂",
                  description: "任意对任意-极值隔离",
                  fullWidth: true,
                },
                {
                  key: "all_exist",
                  label: "∀x₁, ∃x₂",
                  description: "任意对存在",
                  fullWidth: true,
                },
                {
                  key: "exist_all",
                  label: "∃x₁, ∀x₂",
                  description: "存在对任意",
                  fullWidth: true,
                },
                {
                  key: "exist_exist",
                  label: "∃x₁, ∃x₂",
                  description: "存在对存在",
                  fullWidth: true,
                },
                {
                  key: "same_var",
                  label: "∀x ∈ I₁ ∩ I₂",
                  description: "同变量对垒-差函数",
                  fullWidth: true,
                },
              ]}
              value={selectedLogic}
              onChange={(k) => setSelectedLogic(k)}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="参数调节"
            subtitle="拖动顶点参数调节两抛物线位置"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
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
        <div className="w-full h-full relative flex flex-col bg-white select-none">
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-250 rounded-xl px-4 py-2.5 shadow-md flex flex-col gap-1 font-mono">
            <div className="text-xs text-neutral-400 font-bold mb-0.5">
              高考数学方程
            </div>
            <div className="text-sm">
              <KatexFormula formula={formulasLatex.line1} mode="inline" />
            </div>
            {formulasLatex.line2 && (
              <div className="text-sm border-t border-neutral-100 pt-1 mt-0.5">
                <KatexFormula formula={formulasLatex.line2} mode="inline" />
              </div>
            )}
          </div>

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <DoubleVarScene
              selectedLogic={selectedLogic}
              params={params}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              onParamChange={handleParamChange}
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
          title="双动点博弈看板"
        />
      }
    />
  );
}
