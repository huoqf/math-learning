import { useState, useMemo, useCallback } from "react";
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
import { SceneLegend } from "@/components/Math";
import type { SceneLegendItem } from "@/components/Math";
import { defaultParams, paramMeta } from "@/data/registries/derivative";

type ExploreMode = "secant_limit" | "tangent_eq";

// 精选高中高频核心教学函数（8个经典模型，杜绝冗余）
const CORE_FUNCTION_KEYS: PresetFunctionKey[] = [
  "cubic", // f(x) = x³ - 3x
  "quadratic", // f(x) = x²
  "exp", // f(x) = eˣ
  "ln", // f(x) = ln x
  "xlnx", // f(x) = x ln x
  "lnx_x", // f(x) = (ln x)/x
  "rational", // f(x) = 1/x
  "sqrt", // f(x) = √x
];

export function DerivativeAnimation() {
  const [mode, setMode] = useState<ExploreMode>("secant_limit");
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
    return buildMathQuantities("anim-derivative-tangent", params, {
      fnKey,
      mode,
    });
  }, [params, fnKey, mode]);

  const preset = PRESET_FUNCTIONS[fnKey];

  // 右下角图例配置
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const items: SceneLegendItem[] = [
      {
        color: MATH_COLORS.function,
        formula: `f(x) = ${preset.latex}`,
        style: "solid",
      },
      {
        color: MATH_COLORS.tangentLine,
        formula: "y - f(x_0) = f'(x_0)(x - x_0) \\;(\\text{切线})",
        style: "solid",
      },
      {
        color: MATH_COLORS.focusPoint,
        formula: "P(x_0, f(x_0)) \\;(\\text{切点})",
        style: "point",
      },
    ];

    if (mode === "secant_limit") {
      items.splice(2, 0, {
        color: MATH_COLORS.secantLine,
        formula: "PQ \\;(\\text{割线, 斜率 } \\frac{\\Delta y}{\\Delta x})",
        style: "dash",
      });
      items.push({
        color: MATH_COLORS.paramSecondary,
        formula: "Q(x_0 + \\Delta x, f(x_0 + \\Delta x)) \\;(\\text{割线动点})",
        style: "point",
      });
    }
    return items;
  }, [preset.latex, mode]);

  const handleParamChange = useCallback(
    (key: string, value: number) => {
      let clampedValue = value;
      const currentPreset = PRESET_FUNCTIONS[fnKey];
      if (key === "x0") {
        clampedValue = Math.max(
          currentPreset.x0Range[0],
          Math.min(currentPreset.x0Range[1], value),
        );
      } else if (key === "dx") {
        clampedValue = Math.max(-2.0, Math.min(2.0, value));
        if (Math.abs(clampedValue) < 0.01) clampedValue = 0.01;
      }
      setParams((prev) => ({ ...prev, [key]: clampedValue }));
    },
    [fnKey],
  );

  const handleDragStart = useCallback(() => {}, []);

  const handleModeChange = (newMode: ExploreMode) => {
    setMode(newMode);
  };

  const handleFnKeyChange = (key: PresetFunctionKey) => {
    setFnKey(key);
    const newPreset = PRESET_FUNCTIONS[key];
    setParams({
      x0: newPreset.defaultX0,
      dx: defaultParams.dx,
    });
  };

  const handleReset = () => {
    const currentPreset = PRESET_FUNCTIONS[fnKey];
    setParams({
      x0: currentPreset.defaultX0,
      dx: defaultParams.dx,
    });
  };

  // 模式与参数动态裁剪：在切线方程模式下隐藏 Δx
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = mode === "secant_limit" ? ["x0", "dx"] : ["x0"];

    return keys.map((key) => {
      const meta = paramMeta[key];
      let min = meta.min;
      let max = meta.max;
      let marks = meta.marks;

      if (key === "x0") {
        min = preset.x0Range[0];
        max = preset.x0Range[1];
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
      } else if (key === "dx") {
        marks = [
          { value: -1.0, label: "-1.0" },
          { value: -0.05, label: "左逼近", variant: "critical" },
          { value: 0.05, label: "右逼近", variant: "critical" },
          { value: 1.0, label: "1.0" },
        ];
      }

      return {
        key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        group: meta.group,
        value: params[key] ?? meta.defaultValue ?? 0,
        min,
        max,
        step: meta.step ?? 0.05,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks,
      };
    });
  }, [params, fnKey, preset, mode]);

  // 三位一体上色公式拼接：x0 为红色 paramPrimary，dx 为橙色 paramSecondary
  const x0ColorHex = MATH_COLORS.paramPrimary;
  const dxColorHex = MATH_COLORS.paramSecondary;

  const equationLatex = useMemo(() => {
    const fnName = preset.latex.replace("f(x) = ", "");
    return `f(x) = ${fnName}`;
  }, [preset]);

  const secantLatex = `k_{\\text{割}} = \\frac{f(\\color{${x0ColorHex}}{x_0} + \\color{${dxColorHex}}{\\Delta x}) - f(\\color{${x0ColorHex}}{x_0})}{\\color{${dxColorHex}}{\\Delta x}}`;
  const limitLatex = `f'(\\color{${x0ColorHex}}{x_0}) = \\lim_{\\color{${dxColorHex}}{\\Delta x} \\to 0} k_{\\text{割}}`;

  // 教学导引与题设背景配置
  const tipConfig = useMemo(() => {
    if (mode === "secant_limit") {
      return {
        badge: "探究一 · 割线逼近切线（以直代曲 · 极限思想）",
        condition: `考察函数 ${preset.latex} 在切点 P 处的平均变化率。`,
        question:
          "调节割线步长 Δx 趋近于 0，观察割线 PQ 如何平滑极限逼近切线 l。",
      };
    }
    return {
      badge: "探究二 · 切线方程与斜率（几何性质 · 点斜式）",
      condition: `考察函数 ${preset.latex} 随切点 P(x₀, y₀) 移动时切线的变化。`,
      question:
        "拖动切点 P 观察切线斜率 k = f'(x₀) 的符号与大小，验证水平切线与单调性/极值的联系。",
    };
  }, [mode, preset]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 核心探究模式 */}
          <LeftPanelSection title="探究模式" subtitle="选择认知视角">
            <SelectGrid
              items={[
                {
                  key: "secant_limit",
                  label: "割线极限逼近",
                  description: "Δx→0 以直代曲",
                },
                {
                  key: "tangent_eq",
                  label: "切线方程性质",
                  description: "点斜式与极值切线",
                },
              ]}
              value={mode}
              onChange={(m) => handleModeChange(m as ExploreMode)}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 函数模型选择（精选8个经典母题，纯KaTeX公式无重复文本） */}
          <LeftPanelSection title="函数模型" subtitle="选择教学与高考典型函数">
            <SelectGrid
              items={CORE_FUNCTION_KEYS.map((key) => {
                const p = PRESET_FUNCTIONS[key];
                return {
                  key,
                  formula: p.latex,
                };
              })}
              value={fnKey}
              onChange={(k) => handleFnKeyChange(k as PresetFunctionKey)}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 参数与坐标调节（按模式动态裁剪） */}
          <LeftPanelSection
            title="参数调节"
            subtitle={
              mode === "secant_limit" ? "改变切点与割线步长" : "移动切点横坐标"
            }
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 4. 教学引导与题设背景 (置于最底部) */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant="primary">
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
              {mode === "secant_limit" ? "割线逼近与导数定义" : "函数切线方程"}
            </div>
            <div className="space-y-1.5 py-1">
              <div>
                <KatexFormula formula={equationLatex} mode="inline" />
              </div>
              {mode === "secant_limit" && (
                <>
                  <div className="text-[11px]">
                    <KatexFormula formula={secantLatex} mode="inline" />
                  </div>
                  <div className="text-[11px]">
                    <KatexFormula formula={limitLatex} mode="inline" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 右下角图例说明 */}
          <SceneLegend items={legendItems} />

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <DerivativeScene
              mode={mode}
              fnKey={fnKey}
              x0={params.x0}
              dx={params.dx}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              onDragStart={handleDragStart}
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
