import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/constant";
import { DoubleVarScene } from "./components/DoubleVarScene";

export function DoubleVarPage() {
  const [selectedLogic, setSelectedLogic] = useState<
    "all_all" | "all_exist" | "exist_all" | "exist_exist" | "same_var"
  >("all_all");

  const [params, setParams] = useState<Record<string, number>>(() => ({
    yf: defaultParams.yf,
    xf: defaultParams.xf,
    yg: defaultParams.yg,
    xg: defaultParams.xg,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({ vp, xRange: [-1, 5], yRange: [-2, 5.5] });

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({
      yf: defaultParams.yf,
      xf: defaultParams.xf,
      yg: defaultParams.yg,
      xg: defaultParams.xg,
    });
  };

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-constant-double", params, {
      selectedLogic,
    });
  }, [params, selectedLogic]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["yf", "xf", "yg", "xg"];
    return keys.map((key) => {
      const meta = paramMeta[key];
      let description = meta.description;
      let descriptionFormula = meta.descriptionFormula;

      if (key === "yf") {
        description = "【主参数-红】控制抛物线 f(x) 顶点的 y_f 坐标";
        descriptionFormula = "【主参数-红】控制抛物线 $f(x)$ 顶点的 $y_f$ 坐标";
      } else if (key === "yg") {
        description = "【次参数-橙】控制抛物线 g(x) 顶点的 y_g 坐标";
        descriptionFormula = "【次参数-橙】控制抛物线 $g(x)$ 顶点的 $y_g$ 坐标";
      }

      return {
        key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.05,
        description,
        descriptionFormula,
        importance: meta.importance,
        marks: meta.marks,
      };
    });
  }, [params]);

  const formulasLatex = useMemo(() => {
    if (selectedLogic === "same_var") {
      const fStr = `f(x) = (x - ${params.xf.toFixed(2)})^2 + \\color{#EF4444}{${params.yf.toFixed(2)}}, \\; g(x) = -(x - ${params.xg.toFixed(2)})^2 + \\color{#D97706}{${params.yg.toFixed(2)}}`;
      const goalStr = `\\text{目标：对 } \\forall x \\in I_1 \\cap I_2 = [1.50, 2.00], \\; f(x) \\ge g(x)`;
      return { line1: fStr, line2: goalStr };
    } else {
      const fStr = `f(x) = (x - ${params.xf.toFixed(2)})^2 + \\color{#EF4444}{${params.yf.toFixed(2)}} \\quad x \\in [0.5, 2.0]`;
      const gStr = `g(x) = -(x - ${params.xg.toFixed(2)})^2 + \\color{#D97706}{${params.yg.toFixed(2)}} \\quad x \\in [1.5, 3.0]`;
      return { line1: fStr, line2: gStr };
    }
  }, [selectedLogic, params]);

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
                  formula: "\\forall x_1, \\forall x_2",
                  description: "任意对任意-极值隔离",
                  fullWidth: true,
                },
                {
                  key: "all_exist",
                  label: "∀x₁, ∃x₂",
                  formula: "\\forall x_1, \\exists x_2",
                  description: "任意对存在",
                  fullWidth: true,
                },
                {
                  key: "exist_all",
                  label: "∃x₁, ∀x₂",
                  formula: "\\exists x_1, \\forall x_2",
                  description: "存在对任意",
                  fullWidth: true,
                },
                {
                  key: "exist_exist",
                  label: "∃x₁, ∃x₂",
                  formula: "\\exists x_1, \\exists x_2",
                  description: "存在对存在",
                  fullWidth: true,
                },
                {
                  key: "same_var",
                  label: "∀x ∈ I₁ ∩ I₂",
                  formula: "\\forall x \\in I_1 \\cap I_2",
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

          <ParamControl
            params={paramConfigs}
            onParamChange={handleParamChange}
            onReset={handleReset}
          />
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
