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
import { SceneLegend } from "@/components/Math";
import type { SceneLegendItem } from "@/components/Math";
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
          group: meta.group,
          value: params[key as keyof typeof params] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.05,
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
        return `f(x) = x \\ln x - \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2).replace(/\.?0+$/, "")}} x + 1 \\quad (f'(x_0) = 0)`;
      }
      return `f(x) = e^x - \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2).replace(/\.?0+$/, "")}} x \\quad (f'(x_0) = 0)`;
    } else if (activeMode === "shift_symmetric") {
      if (subModel === "xe_neg_x") {
        return `f(x) = x e^{-x} = \\color{${MATH_COLORS.secantLine}}{${params.k.toFixed(2).replace(/\.?0+$/, "")}} \\implies f(x_1) = f(x_2) = k`;
      }
      return `f(x) = \\frac{\\ln x}{x} = \\color{${MATH_COLORS.secantLine}}{${params.k.toFixed(2).replace(/\.?0+$/, "")}} \\implies f(x_1) = f(x_2) = k`;
    }
    return `L(x_1, x_2) = \\frac{x_1 - x_2}{\\ln x_1 - \\ln x_2} \\quad (x_1 = ${params.x1.toFixed(2).replace(/\.?0+$/, "")},\\, x_2 = ${params.x2.toFixed(2).replace(/\.?0+$/, "")})`;
  }, [activeMode, subModel, params.a, params.k, params.x1, params.x2]);

  // 右下角图例配置 (模式专属：图线 + 特征点标对应)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (activeMode === "implicit_zero") {
      return [
        {
          color: MATH_COLORS.function,
          formula:
            subModel === "x_ln_x"
              ? "f(x) = x\\ln x - ax + 1"
              : "f(x) = e^x - ax",
          style: "solid",
        },
        {
          color: MATH_COLORS.derivative,
          formula:
            subModel === "x_ln_x"
              ? "f'(x) = \\ln x + 1 - a"
              : "f'(x) = e^x - a",
          style: "dash",
        },
        {
          color: MATH_COLORS.trace,
          formula: subModel === "x_ln_x" ? "h(x) = 1 - x" : "h(x) = e^x(1 - x)",
          style: "dot",
        },
        {
          color: MATH_COLORS.paramPrimary,
          formula: "P(x_0, f(x_0)) \\;(\\text{极值/消元点})",
          style: "point",
        },
        {
          color: MATH_COLORS.derivative,
          formula: "x_0 \\;(\\text{导数零点})",
          style: "hollow-point",
        },
      ];
    } else if (activeMode === "shift_symmetric") {
      return [
        {
          color: MATH_COLORS.function,
          formula:
            subModel === "xe_neg_x"
              ? "f(x) = xe^{-x}"
              : "f(x) = \\frac{\\ln x}{x}",
          style: "solid",
        },
        {
          color: MATH_COLORS.functionTransformed,
          formula: "y = f(2x_0 - x) \\;(\\text{对称曲线})",
          style: "dash",
        },
        {
          color: MATH_COLORS.secantLine,
          formula: "y = k \\;(\\text{水平割线})",
          style: "dot",
        },
        {
          color: MATH_COLORS.function,
          formula: "P_1, P_2 \\;(\\text{割线双交点})",
          style: "point",
        },
        {
          color: MATH_COLORS.functionTransformed,
          formula: "P'_1(2x_0 - x_1, k) \\;(\\text{对称点})",
          style: "hollow-point",
        },
        {
          color: MATH_COLORS.paramSecondary,
          formula: "M\\left(\\frac{x_1+x_2}{2}, k\\right) \\;(\\text{弦中点})",
          style: "point",
        },
        {
          color: MATH_COLORS.paramTertiary,
          label: "偏移区间 [x₀, M]",
          style: "area",
        },
      ];
    } else {
      return [
        {
          color: MATH_COLORS.function,
          formula: "f(x) = \\ln x",
          style: "solid",
        },
        {
          color: MATH_COLORS.secantLine,
          formula: "P_1P_2 \\;(\\text{割线, 斜率 } 1/L)",
          style: "dash",
        },
        {
          color: MATH_COLORS.tangentLine,
          formula: "T(L, \\ln L) \\;(\\text{平行切线点})",
          style: "solid",
        },
        {
          color: MATH_COLORS.function,
          formula: "G = \\sqrt{x_1 x_2} \\;(\\text{几何均值})",
          style: "point",
        },
        {
          color: MATH_COLORS.paramPrimary,
          formula: "L = L(x_1, x_2) \\;(\\text{对数均值})",
          style: "point",
        },
        {
          color: MATH_COLORS.paramSecondary,
          formula: "A = \\frac{x_1 + x_2}{2} \\;(\\text{算术均值})",
          style: "point",
        },
      ];
    }
  }, [activeMode, subModel]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 核心专题模式选择 */}
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

          {/* 2. 函数模型选择 (2列并排紧凑) */}
          {activeMode !== "log_mean" && (
            <LeftPanelSection title="函数模型" subtitle="选择经典高考函数">
              {activeMode === "implicit_zero" ? (
                <SelectGrid
                  items={[
                    {
                      key: "x_ln_x",
                      label: "对数多项",
                      formula: "x \\ln x - ax + 1",
                    },
                    {
                      key: "exp_minus_ax",
                      label: "指数一次",
                      formula: "e^x - ax",
                    },
                  ]}
                  value={subModel}
                  onChange={(key) => setSubModel(key)}
                  columns={2}
                />
              ) : (
                <SelectGrid
                  items={[
                    {
                      key: "xe_neg_x",
                      label: "指数乘积",
                      formula: "x e^{-x}",
                    },
                    {
                      key: "lnx_div_x",
                      label: "对数商型",
                      formula: "\\frac{\\ln x}{x}",
                    },
                  ]}
                  value={subModel}
                  onChange={(key) => setSubModel(key)}
                  columns={2}
                />
              )}
            </LeftPanelSection>
          )}

          {/* 3. 参数调节区 */}
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

          {/* 5. 教学导引与高考设问 */}
          <LeftPanelSection title="教学导引与高考设问" compact>
            {activeMode === "implicit_zero" && (
              <TipCard variant="primary">
                <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                  <span>高考压轴 · 隐零点定理与消元</span>
                </div>
                <div className="space-y-1.5 text-[11px] leading-relaxed">
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【初始条件】
                    </span>
                    <span className="text-neutral-600 ml-1">
                      已知函数{" "}
                      <KatexFormula
                        formula={
                          subModel === "x_ln_x"
                            ? "f(x) = x\\ln x - ax + 1"
                            : "f(x) = e^x - ax"
                        }
                        mode="inline"
                      />
                      ，导数零点 <KatexFormula formula="x_0" mode="inline" />{" "}
                      无法显式解析求解。
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【核心设问】
                    </span>
                    <span className="text-neutral-600 ml-1">
                      设导数零点为 <KatexFormula formula="x_0" mode="inline" />
                      ，求函数 <KatexFormula
                        formula="f(x_0)"
                        mode="inline"
                      />{" "}
                      极值范围或证明相关不等式。
                    </span>
                  </div>
                </div>
              </TipCard>
            )}

            {activeMode === "shift_symmetric" && (
              <TipCard variant="warning">
                <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                  <span>高考压轴 · 极值点偏移与对称构造</span>
                </div>
                <div className="space-y-1.5 text-[11px] leading-relaxed">
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【初始条件】
                    </span>
                    <span className="text-neutral-600 ml-1">
                      割线 <KatexFormula formula="y = k" mode="inline" /> 与曲线{" "}
                      <KatexFormula
                        formula={
                          subModel === "xe_neg_x"
                            ? "f(x) = xe^{-x}"
                            : "f(x) = \\frac{\\ln x}{x}"
                        }
                        mode="inline"
                      />{" "}
                      交于两不等实根{" "}
                      <KatexFormula formula="x_1 < x_2" mode="inline" />。
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【核心设问】
                    </span>
                    <span className="text-neutral-600 ml-1">
                      已知{" "}
                      <KatexFormula
                        formula="f(x_1) = f(x_2) = k"
                        mode="inline"
                      />
                      ，求证极值点偏移结论{" "}
                      <KatexFormula formula="x_1 + x_2 > 2x_0" mode="inline" />
                      。
                    </span>
                  </div>
                </div>
              </TipCard>
            )}

            {activeMode === "log_mean" && (
              <TipCard variant="info">
                <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                  <span>高考压轴 · 对数均值不等式 (L-Mean)</span>
                </div>
                <div className="space-y-1.5 text-[11px] leading-relaxed">
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【初始条件】
                    </span>
                    <span className="text-neutral-600 ml-1">
                      对任意相异正实数{" "}
                      <KatexFormula formula="x_1 < x_2" mode="inline" />
                      ，定义对数平均数{" "}
                      <KatexFormula
                        formula="L(x_1, x_2) = \frac{x_1 - x_2}{\ln x_1 - \ln x_2}"
                        mode="inline"
                      />
                      。
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">
                      【核心设问】
                    </span>
                    <span className="text-neutral-600 ml-1">
                      探究对数均值与几何均值{" "}
                      <KatexFormula formula="\sqrt{x_1 x_2}" mode="inline" />
                      、算术均值{" "}
                      <KatexFormula
                        formula="\frac{x_1+x_2}{2}"
                        mode="inline"
                      />{" "}
                      的双边大小关系。
                    </span>
                  </div>
                </div>
              </TipCard>
            )}
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 顶部悬浮公式卡片 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={topFormulaLatex} mode="inline" />
          </div>

          {/* 右下角图例说明卡片 */}
          <SceneLegend items={legendItems} />

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
