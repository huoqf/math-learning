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
import {
  getDerivativeShiftLegendItems,
  type ShiftMode,
  type ShiftSubModel,
} from "./constants";

export function DerivativeShiftAnimation() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [activeMode, setActiveMode] = useState<ShiftMode>("implicit_zero");
  const [subModel, setSubModel] = useState<ShiftSubModel>("x_ln_x");

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

  // 3. 右屏看板聚合数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-derivative-shift", params, {
      activeMode,
      subModel,
    });
  }, [params, activeMode, subModel]);

  // 4. 左屏动态过滤参数配置列表
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let allowedKeys: string[] = [];
    if (activeMode === "implicit_zero") {
      allowedKeys = ["a"];
    } else if (activeMode === "shift_symmetric") {
      allowedKeys = ["k"];
    } else {
      allowedKeys = ["x1", "x2"];
    }

    return allowedKeys
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

  // 顶部悬浮公式字符串（符号自适应与色彩安全绑定）
  const topFormulaLatex = useMemo(() => {
    const formatCoeffTerm = (
      coeff: number,
      varName: string,
      colorHex: string,
    ) => {
      const absVal = Math.abs(coeff);
      const numStr = absVal.toFixed(2).replace(/\.?0+$/, "");
      const signStr = coeff >= 0 ? " - " : " + ";
      return `${signStr}\\color{${colorHex}}{${numStr}}${varName}`;
    };

    if (activeMode === "implicit_zero") {
      const aTerm = formatCoeffTerm(params.a, "x", MATH_COLORS.paramPrimary);
      if (subModel === "x_ln_x") {
        return `f(x) = x \\ln x + \\frac{1}{2}x^2${aTerm} \\quad (f'(x_0) = 0)`;
      }
      return `f(x) = e^x - \\frac{1}{2}x^2${aTerm} \\quad (f'(x_0) = 0)`;
    } else if (activeMode === "shift_symmetric") {
      const kStr = params.k.toFixed(2).replace(/\.?0+$/, "");
      if (subModel === "xe_neg_x") {
        return `f(x) = x e^{-x} = \\color{${MATH_COLORS.secantLine}}{${kStr}} \\implies f(x_1) = f(x_2) = k`;
      }
      return `f(x) = \\frac{\\ln x}{x} = \\color{${MATH_COLORS.secantLine}}{${kStr}} \\implies f(x_1) = f(x_2) = k`;
    }
    const x1Str = params.x1.toFixed(2).replace(/\.?0+$/, "");
    const x2Str = params.x2.toFixed(2).replace(/\.?0+$/, "");
    return `L(x_1, x_2) = \\frac{x_1 - x_2}{\\ln x_1 - \\ln x_2} \\quad (x_1 = ${x1Str},\\, x_2 = ${x2Str})`;
  }, [activeMode, subModel, params.a, params.k, params.x1, params.x2]);

  // 右下角图例配置 (模式专属：规范解耦)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    return getDerivativeShiftLegendItems(activeMode, subModel);
  }, [activeMode, subModel]);

  // 教学导引结构化题设配置
  const tipConfig = useMemo(() => {
    if (activeMode === "implicit_zero") {
      const funcTex =
        subModel === "x_ln_x"
          ? "f(x) = x\\ln x + \\frac{1}{2}x^2 - ax"
          : "f(x) = e^x - \\frac{1}{2}x^2 - ax";
      return {
        variant: "primary" as const,
        badge: "高考压轴 · 隐零点定理与消元",
        condition: `已知超越函数 $${funcTex}$，导函数零点 $x_0$ 满足超越方程无法显式求解。`,
        question:
          "设导数零点为 $x_0$，如何利用 $f'(x_0) = 0$ 构造消元轨迹方程求极值范围？",
      };
    }
    if (activeMode === "shift_symmetric") {
      const funcTex =
        subModel === "xe_neg_x" ? "f(x) = xe^{-x}" : "f(x) = \\frac{\\ln x}{x}";
      return {
        variant: "warning" as const,
        badge: "高考压轴 · 极值点偏移与对称构造",
        condition: `水平割线 $y = k$ 与曲线 $${funcTex}$ 交于两不等实根 $x_1 < x_2$。`,
        question:
          "已知 $f(x_1) = f(x_2) = k$，如何通过对称构造函数证明极值点偏移结论 $x_1 + x_2 > 2x_0$？",
      };
    }
    return {
      variant: "info" as const,
      badge: "高考真题 · 对数均值不等式链",
      condition:
        "对于对数曲线 $f(x) = \\ln x$，在两正实数 $x_1 < x_2$ 间连结割线。",
      question:
        "验证几何均值 $G$、对数均值 $L$ 与算术均值 $A$ 构成的核心不等式链 $\\sqrt{x_1x_2} < L(x_1, x_2) < \\frac{x_1+x_2}{2}$。",
    };
  }, [activeMode, subModel]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 核心专题模式选择 */}
          <LeftPanelSection title="模式选择">
            <TabSwitcher
              tabs={[
                { key: "implicit_zero", label: "隐零点与消元" },
                { key: "shift_symmetric", label: "极值点偏移" },
                { key: "log_mean", label: "对数均值链" },
              ]}
              value={activeMode}
              onChange={(k) => {
                const mode = k as ShiftMode;
                setActiveMode(mode);
                if (mode === "implicit_zero") setSubModel("x_ln_x");
                else if (mode === "shift_symmetric") setSubModel("xe_neg_x");
              }}
            />
          </LeftPanelSection>

          {/* 2. 函数模型选择 (2列并排紧凑) */}
          {activeMode !== "log_mean" && (
            <LeftPanelSection title="函数模型">
              {activeMode === "implicit_zero" ? (
                <SelectGrid
                  items={[
                    {
                      key: "x_ln_x",
                      label: "对数二次混合型",
                    },
                    {
                      key: "exp_linear",
                      label: "指数二次混合型",
                    },
                  ]}
                  value={subModel}
                  onChange={(key) => setSubModel(key as ShiftSubModel)}
                  columns={2}
                />
              ) : (
                <SelectGrid
                  items={[
                    {
                      key: "xe_neg_x",
                      label: "指数乘积衰减型",
                    },
                    {
                      key: "ln_x_div_x",
                      label: "对数分式商型",
                    },
                  ]}
                  value={subModel}
                  onChange={(key) => setSubModel(key as ShiftSubModel)}
                  columns={2}
                />
              )}
            </LeftPanelSection>
          )}

          {/* 3. 参数调节区 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>

          {/* 4. 教学导引与高考设问 */}
          <TipCard
            variant={tipConfig.variant}
            badge={tipConfig.badge}
            condition={tipConfig.condition}
            question={tipConfig.question}
          />
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
