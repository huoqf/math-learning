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

  // 教学导引与题设背景配置
  const tipConfig = useMemo(() => {
    switch (fnKey) {
      case "cubic":
        return {
          variant: "primary" as const,
          badge: "高考基础 · 多项式切线与平均变化率",
          condition:
            "已知函数 f(x) = x³ - 3x，考察切点 x₀ 与割线动点 x₀ + Δx。",
          question:
            "求割线斜率在步长 Δx → 0 时的极限，并确定切点 x₀ 处的切线方程与导数值 f'(x₀)。",
        };
      case "rational":
        return {
          variant: "info" as const,
          badge: "高考基础 · 反比例分式函数变化率",
          condition:
            "已知反比例函数 f(x) = 1/x (x ≠ 0)，考察切点 x₀ 处的割线逼近。",
          question:
            "求双曲线上任意切点的瞬时变化率与切线方程，探究斜率随切点位置的演化规律。",
        };
      case "sqrt":
        return {
          variant: "warning" as const,
          badge: "高考易错 · 根式函数与端点可导性",
          condition:
            "已知半幂函数 f(x) = √x (x ≥ 0)，考察正半轴切点及逼近原点 x=0 处。",
          question:
            "判断函数在端点 x=0 处的导数是否存在，探究切线趋近垂直的几何极限。",
        };
      case "xlnx":
        return {
          variant: "primary" as const,
          badge: "高考核心 · 经典超越模型 x·ln(x) 极值与切线",
          condition: "已知经典超越函数 f(x) = x ln x (定义域 x > 0)。",
          question: "求函数的极值点坐标与切线斜率，探究水平切线处的临界特征。",
        };
      case "lnx_x":
        return {
          variant: "primary" as const,
          badge: "高考压轴 · 经典母题 (ln x)/x 极大值与切线",
          condition: "已知经典超越母题 f(x) = (ln x)/x (定义域 x > 0)。",
          question: "求函数的单调区间与极大值点，并求切点处的切线方程。",
        };
      default:
        return {
          variant: "primary" as const,
          badge: "高考基础 · 导数几何意义与割线逼近",
          condition: "已知函数 f(x) 与切点 x₀，割线步长为 Δx。",
          question: "求割线斜率在 Δx → 0 时的瞬时极限导数值。",
        };
    }
  }, [fnKey]);

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
