import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { CompositeScene } from "./components/CompositeScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/composite";

export function CompositeAnimation() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [subMode, setSubMode] = useState<"piecewise" | "composite">(
    "piecewise",
  );
  const [outerType, setOuterType] = useState<"exp" | "log" | "quadratic">(
    "exp",
  );

  // Step 1: 自适应视口
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // Step 2: 比例尺
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // Step 3: 右屏数学数据组装
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-func-composite", params, {
        subMode,
        outerType,
      }),
    [params, subMode, outerType],
  );

  // 动态拼装 LateX 公式
  const formulaLatex = useMemo(() => {
    if (subMode === "piecewise") {
      const x0Val = (params.x0 ?? 1.0).toFixed(1);
      const k1 = (params.leftSlope ?? 1.0).toFixed(1);
      const b1 = (params.leftConst ?? 0.0).toFixed(1);
      const k2 = (params.rightSlope ?? -0.5).toFixed(1);
      const b2 = (params.rightConst ?? 1.5).toFixed(1);
      return `f(x) = \\begin{cases} ${k1}x + ${b1}, & x \\le \\color{#EF4444}{${x0Val}} \\\\ ${k2}x + ${b2}, & x > \\color{#EF4444}{${x0Val}} \\end{cases}`;
    } else {
      const bVal = (params.innerB ?? -2.0).toFixed(1);
      const cVal = (params.innerC ?? 2.0).toFixed(1);
      const innerStr = `g(x) = x^2 + (\\color{#EF4444}{${bVal}})x + \\color{#D97706}{${cVal}}`;
      if (outerType === "exp") {
        return `y = f(g(x)) = 2^{${innerStr}}`;
      } else if (outerType === "log") {
        return `y = f(g(x)) = \\log_2(${innerStr})`;
      } else {
        return `y = f(g(x)) = -(${innerStr} - 2)^2 + 4`;
      }
    }
  }, [
    subMode,
    outerType,
    params.x0,
    params.leftSlope,
    params.leftConst,
    params.rightSlope,
    params.rightConst,
    params.innerB,
    params.innerC,
  ]);

  // Step 4: 按模式过滤的声明式参数配置 (按 subMode 过滤)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      piecewise: ["x0", "leftSlope", "leftConst", "rightSlope", "rightConst"],
      composite: ["xSample", "innerB", "innerC"],
    };

    const keys = keysByMode[subMode] ?? [];
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
          importance: meta.importance as any,
          marks: meta.marks,
        };
      });
  }, [params, subMode]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="研究模式"
            subtitle="选择分段函数或复合函数单调性"
          >
            {/* 模式选择 */}
            <div className="flex bg-neutral-100 p-1 rounded-lg gap-1 mb-3">
              <button
                onClick={() => setSubMode("piecewise")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  subMode === "piecewise"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                分段函数连续性
              </button>
              <button
                onClick={() => setSubMode("composite")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  subMode === "composite"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                复合函数同增异减
              </button>
            </div>

            {/* 复合函数模式下选择外层函数 f(u) */}
            {subMode === "composite" && (
              <div className="flex gap-1.5 mb-4">
                {[
                  { key: "exp", label: "y = 2^u" },
                  { key: "log", label: "y = log₂ u" },
                  { key: "quadratic", label: "y = -(u-2)²+4" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setOuterType(item.key as any)}
                    className={`flex-1 py-1 px-1 text-[11px] font-bold border rounded-md transition-all ${
                      outerType === item.key
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-neutral-200 bg-white text-neutral-600"
                    }`}
                  >
                    <KatexFormula
                      formula={item.label}
                      mode="inline"
                      className="!text-[11px] !my-0"
                    />
                  </button>
                ))}
              </div>
            )}
          </LeftPanelSection>

          <LeftPanelSection title="参数调节" subtitle="调节临界点与各段参数">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* LateX 公式浮标 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <CompositeScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              subMode={subMode}
              outerType={outerType}
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
          title={subMode === "piecewise" ? "分段函数看板" : "复合函数看板"}
        />
      }
    />
  );
}
