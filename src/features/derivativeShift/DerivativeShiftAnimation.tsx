/**
 * src/features/derivativeShift/DerivativeShiftAnimation.tsx
 * 隐零点定理与极值点偏移 页面薄编排层
 */

import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { DerivativeShiftScene } from "./components/DerivativeShiftScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/derivativeShift";

export function DerivativeShiftAnimation() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [activeMode, setActiveMode] = useState<
    "implicit_zero" | "shift_symmetric" | "log_mean"
  >("implicit_zero");
  const [subModel, setSubModel] = useState<string>("x_ln_x");

  // 1. Viewport + 自适应画布 (固定 Preset: full)
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 2. 坐标转换比例尺
  const scale = useSceneScale({
    vp,
    xRange: [-1.5, 6.5],
    yRange: [-2.5, 3.5],
  });

  // 3. 右屏数学量数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-derivative-shift", params, {
        activeMode,
        subModel,
      }),
    [params, activeMode, subModel],
  );

  // 4. 左屏声明式参数过滤
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      implicit_zero: ["a"],
      shift_symmetric: ["k"],
      log_mean: ["x1", "x2"],
    };
    const keys = keysByMode[activeMode] ?? Object.keys(paramMeta);
    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key as keyof typeof params] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, activeMode]);

  // 参数更新处理
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 顶部悬浮公式字符串
  const topFormulaLatex = useMemo(() => {
    if (activeMode === "implicit_zero") {
      if (subModel === "x_ln_x") {
        return `f(x) = x \\ln x - \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2)}} x + 1`;
      }
      return `f(x) = e^x - \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2)}} x`;
    } else if (activeMode === "shift_symmetric") {
      if (subModel === "xe_neg_x") {
        return `f(x) = x e^{-x} = \\color{${MATH_COLORS.secantLine}}{${params.k.toFixed(2)}}`;
      }
      return `f(x) = \\frac{\\ln x}{x} = \\color{${MATH_COLORS.secantLine}}{${params.k.toFixed(2)}}`;
    }
    return `\\sqrt{x_1 x_2} < L(x_1, x_2) < \\frac{x_1 + x_2}{2}`;
  }, [activeMode, subModel, params.a, params.k]);

  // 教学导引与题设背景配置
  const tipConfig = useMemo(() => {
    switch (activeMode) {
      case "implicit_zero":
        return {
          variant: "primary" as const,
          badge: "高考压轴 · 隐零点定理与消元",
          condition: `已知函数 ${subModel === "x_ln_x" ? "f(x) = x ln x - ax + 1" : "f(x) = eˣ - ax"}，导数零点 x₀ 无法显式解析求解。`,
          question:
            "设导数零点为 x₀，求函数 f(x) 极值的取值范围或证明相关代数不等式。",
        };
      case "shift_symmetric":
        return {
          variant: "warning" as const,
          badge: "高考压轴 · 极值点偏移",
          condition: `割线 y = k 与曲线 ${subModel === "xe_neg_x" ? "f(x) = x e⁻ˣ" : "f(x) = (ln x)/x"} 交于两不等正实根 x₁ < x₂，极值点为 x₀。`,
          question:
            "已知两根函数值相等 f(x₁)=f(x₂)=k，求证极值点偏移不等式 x₁ + x₂ > 2x₀（或 < 2x₀）。",
        };
      case "log_mean":
        return {
          variant: "info" as const,
          badge: "高考压轴 · 对数均值不等式 (L-Mean)",
          condition:
            "对任意相异正实数 x₁ < x₂，定义对数平均数 L(x₁, x₂) = (x₁-x₂)/(ln x₁ - ln x₂)。",
          question:
            "探究对数均值 L(x₁, x₂) 与几何平均数 √(x₁x₂)、算术平均数 (x₁+x₂)/2 的双边大小关系。",
        };
      default:
        return {
          variant: "primary" as const,
          badge: "高考压轴 · 隐零点与极值点偏移",
          condition: "考察导数零点非显式表达或非对称函数多零点问题。",
          question: "证明极值点与零点相关的范围与不等式。",
        };
    }
  }, [activeMode, subModel]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择区 */}
          <LeftPanelSection
            title="模式选择"
            subtitle="切换高考导数压轴三大核心模型"
          >
            <TabSwitcher
              tabs={[
                { key: "implicit_zero", label: "隐零点与消元" },
                { key: "shift_symmetric", label: "极值点偏移" },
                { key: "log_mean", label: "对数均值" },
              ]}
              value={activeMode}
              onChange={(k) => {
                setActiveMode(k);
                if (k === "implicit_zero") setSubModel("x_ln_x");
                else if (k === "shift_symmetric") setSubModel("xe_neg_x");
              }}
            />
          </LeftPanelSection>

          {/* 子模型选择 */}
          {activeMode !== "log_mean" && (
            <LeftPanelSection title="函数模型" subtitle="选择经典高考函数">
              {activeMode === "implicit_zero" ? (
                <SelectGrid
                  items={[
                    {
                      key: "x_ln_x",
                      label: "x ln x - ax + 1",
                      formula: "x \\ln x - ax + 1",
                    },
                    {
                      key: "exp_minus_ax",
                      label: "e^x - ax",
                      formula: "e^x - ax",
                    },
                  ]}
                  value={subModel}
                  onChange={(key) => setSubModel(key)}
                  columns={1}
                />
              ) : (
                <SelectGrid
                  items={[
                    { key: "xe_neg_x", label: "x e^{-x}", formula: "x e^{-x}" },
                    {
                      key: "lnx_div_x",
                      label: "\\ln x / x",
                      formula: "\\frac{\\ln x}{x}",
                    },
                  ]}
                  value={subModel}
                  onChange={(key) => setSubModel(key)}
                  columns={1}
                />
              )}
            </LeftPanelSection>
          )}

          {/* 参数调节区 */}
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块动态观察图形联动"
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
          {/* 顶部悬浮公式卡片 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={topFormulaLatex} mode="inline" />
          </div>

          {/* SVG 动画画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <DerivativeShiftScene
              params={params}
              scale={scale}
              vp={vp}
              activeMode={activeMode}
              subModel={subModel}
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
          title="隐零点与极值点偏移看板"
        />
      }
    />
  );
}
