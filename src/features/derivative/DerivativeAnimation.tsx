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
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { PRESET_FUNCTIONS, type PresetFunctionKey } from "@/math/derivative";
import { DerivativeScene } from "./components/DerivativeScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/derivative";

export function DerivativeAnimation() {
  const [fnKey, setFnKey] = useState<PresetFunctionKey>("cubic");
  const [params, setParams] = useState<Record<string, number>>(() => ({
    x0: PRESET_FUNCTIONS.cubic.defaultX0,
    dx: defaultParams.dx,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-5, 5],
    yRange: [-4, 4],
  });

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-derivative-tangent", params, { fnKey });
  }, [params, fnKey]);

  const handleParamChange = (key: string, value: number) => {
    let clampedValue = value;
    const preset = PRESET_FUNCTIONS[fnKey];
    if (key === "x0") {
      clampedValue = Math.max(
        preset.x0Range[0],
        Math.min(preset.x0Range[1], value),
      );
    } else if (key === "dx") {
      clampedValue = Math.max(0.01, Math.min(2.0, value));
    }
    setParams((prev) => ({ ...prev, [key]: clampedValue }));
  };

  const handleFnKeyChange = (key: PresetFunctionKey) => {
    setFnKey(key);
    const preset = PRESET_FUNCTIONS[key];
    setParams({
      x0: preset.defaultX0,
      dx: defaultParams.dx,
    });
  };

  const handleReset = () => {
    const preset = PRESET_FUNCTIONS[fnKey];
    setParams({
      x0: preset.defaultX0,
      dx: defaultParams.dx,
    });
  };

  const preset = PRESET_FUNCTIONS[fnKey];

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return Object.entries(paramMeta).map(([key, meta]) => {
      let min = meta.min;
      let max = meta.max;
      let marks = meta.marks;

      if (key === "x0") {
        min = preset.x0Range[0];
        max = preset.x0Range[1];
        // 针对特定函数在 0 处的不可导/退化高亮
        if (fnKey === "rational" || fnKey === "sqrt") {
          marks = [
            { value: preset.x0Range[0], label: preset.x0Range[0].toString() },
            { value: 0, label: "0 (不可导)", variant: "critical" },
            { value: preset.x0Range[1], label: preset.x0Range[1].toString() },
          ];
        } else if (fnKey === "xlnx" || fnKey === "lnx_x") {
          marks = [
            { value: 0.1, label: "0.1 (边界)", variant: "critical" },
            { value: preset.x0Range[1], label: preset.x0Range[1].toString() },
          ];
        } else {
          marks = [
            { value: preset.x0Range[0], label: preset.x0Range[0].toString() },
            { value: 0, label: "0", variant: "zero" },
            { value: preset.x0Range[1], label: preset.x0Range[1].toString() },
          ];
        }
      }

      return {
        key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key] ?? meta.defaultValue ?? 0,
        min,
        max,
        step: meta.step ?? 0.1,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks,
      };
    });
  }, [params, fnKey, preset]);

  // 三位一体上色公式拼接：x0 为红色 paramPrimary (#EF4444)，dx (Δx) 为橙色 paramSecondary (#D97706)
  const equationLatex = useMemo(() => {
    const fnName = preset.latex.replace("f(x) = ", "");
    return `f(x) = ${fnName}`;
  }, [preset]);

  const x0ColorHex = MATH_COLORS.paramPrimary;
  const dxColorHex = MATH_COLORS.paramSecondary;

  // 拼接带有变量颜色的割线斜率公式和切线斜率公式
  const secantLatex = `k_{\\text{割}} = \\frac{f(\\color{${x0ColorHex}}{x_0} + \\color{${dxColorHex}}{\\Delta x}) - f(\\color{${x0ColorHex}}{x_0})}{\\color{${dxColorHex}}{\\Delta x}}`;
  const limitLatex = `f'(\\color{${x0ColorHex}}{x_0}) = \\lim_{\\color{${dxColorHex}}{\\Delta x} \\to 0} k_{\\text{割}}`;

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 函数选择 */}
          <LeftPanelSection title="函数模型" subtitle="选择教学函数">
            <SelectGrid
              items={(
                Object.entries(PRESET_FUNCTIONS) as [
                  PresetFunctionKey,
                  typeof preset,
                ][]
              ).map(([key, p]) => ({
                key,
                label: p.label,
                formula: p.latex,
              }))}
              value={fnKey}
              onChange={(k) => handleFnKeyChange(k as PresetFunctionKey)}
              variant="filled"
            />
          </LeftPanelSection>

          <LeftPanelSection title="参数调节" subtitle="改变切点与割线步长">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学提示 */}
          <LeftPanelSection title="教学提示" subtitle="数形结合理解导数">
            <div className="space-y-3 text-xs text-neutral-600 leading-relaxed">
              <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100">
                <p className="font-semibold text-neutral-700 mb-1">
                  虚线几何含义：
                </p>
                <ul className="list-disc list-inside space-y-1 text-neutral-600">
                  <li>
                    <span className="font-medium text-[#DC2626]">
                      红色虚线 (切线)
                    </span>
                    ： 曲线在切点{" "}
                    <span className="font-mono text-[#EF4444]">x₀</span>{" "}
                    处的切线，斜率等同于该点的导数值{" "}
                    <span className="font-mono text-[#EF4444]">f'(x₀)</span>。
                  </li>
                  <li>
                    <span className="font-medium text-[#D97706]">
                      橙色虚线 (割线)
                    </span>
                    ： 连接切点与邻近动点{" "}
                    <span className="font-mono text-[#EF4444]">x₀</span> +{" "}
                    <span className="font-mono text-[#D97706]">Δx</span>{" "}
                    的割线，斜率代表区间平均变化率。
                  </li>
                </ul>
              </div>

              <div className="p-2.5 bg-primary-50/40 rounded-lg border border-primary-100/40">
                <p className="font-semibold text-primary-900 mb-1">
                  极限逼近互动：
                </p>
                <p className="mb-2">
                  尝试将{" "}
                  <span className="font-medium text-[#D97706]">步长 Δx</span>{" "}
                  调小，观察橙色割线如何旋转并最终重合至红色切线：
                </p>
                <div className="my-1.5 p-1 bg-white rounded border border-neutral-100 text-center shadow-sm">
                  <KatexFormula
                    formula={
                      "\\lim_{\\color{#D97706}{\\Delta x} \\to 0} k_{\\text{割}} = k_{\\text{切}}"
                    }
                    mode="inline"
                  />
                </div>
                <p>这就是极限定义，即割线斜率的极限就是切线斜率。</p>
              </div>
            </div>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 公式悬浮窗口 */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 bg-white/95 backdrop-blur border border-neutral-200 rounded-lg p-3 shadow-md select-none max-w-[280px]">
            <div className="text-xs font-semibold text-neutral-500 border-b border-neutral-100 pb-1">
              函数公式与几何定义
            </div>
            <div className="space-y-1.5 py-1">
              <div>
                <KatexFormula formula={equationLatex} mode="inline" />
              </div>
              <div className="text-[11px]">
                <KatexFormula formula={secantLatex} mode="inline" />
              </div>
              <div className="text-[11px]">
                <KatexFormula formula={limitLatex} mode="inline" />
              </div>
            </div>
          </div>

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <DerivativeScene
              fnKey={fnKey}
              x0={params.x0}
              dx={params.dx}
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
          title="导数几何意义看板"
        />
      }
    />
  );
}
