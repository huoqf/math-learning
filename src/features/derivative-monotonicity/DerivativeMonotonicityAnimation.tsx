/**
 * src/features/derivative-monotonicity/DerivativeMonotonicityAnimation.tsx
 * 导数与单调性及极值页面编排主控组件
 */

import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
  ParamControl,
  TipCard,
  KatexFormula,
  MathPanel,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import {
  MONOTONICITY_MODELS,
  solveMonotonicityModel,
  formatFloat,
  type MonotonicityModelKey,
} from "@/math/derivativeMonotonicity";
import { DerivativeMonotonicityScene } from "./components/DerivativeMonotonicityScene";
import {
  defaultParams,
  getDynamicParamMeta,
} from "@/data/registries/derivativeMonotonicity";
import { buildMathQuantities } from "@/data/mathQuantities";

type ExploreMode =
  "monotonicity_point" | "extrema_analysis" | "parametric_discuss";

const MODE_TABS: Array<{ key: ExploreMode; label: string }> = [
  { key: "monotonicity_point", label: "动点切线与单调区间" },
  { key: "extrema_analysis", label: "导数穿零与极值判定" },
  { key: "parametric_discuss", label: "含参单调性分类讨论" },
];

const MODEL_KEYS: MonotonicityModelKey[] = [
  "cubic_param",
  "exp_poly",
  "ln_x_ratio",
  "x_ln_x_param",
  "nike_rational",
];

export function DerivativeMonotonicityAnimation() {
  const [mode, setMode] = useState<ExploreMode>("monotonicity_point");
  const [modelKey, setModelKey] = useState<MonotonicityModelKey>("cubic_param");

  const [params, setParams] = useState<Record<string, number>>(() => ({
    a: defaultParams.a,
    x0: defaultParams.x0,
  }));

  const dynamicMeta = useMemo(() => getDynamicParamMeta(modelKey), [modelKey]);
  const currentModel = MONOTONICITY_MODELS[modelKey];

  // 视口与缩放比例
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: currentModel.xRange,
    yRange: currentModel.yRange,
  });

  // 数学计算结果
  const modelResult = useMemo(() => {
    return solveMonotonicityModel(modelKey, params.a ?? 1.0);
  }, [modelKey, params.a]);

  // 右屏看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-derivative-monotonicity", params, {
      modelKey,
      mode,
    });
  }, [params, modelKey, mode]);

  // 切换函数模型
  const handleModelChange = useCallback((key: string) => {
    const nextKey = key as MonotonicityModelKey;
    setModelKey(nextKey);
    const newModel = MONOTONICITY_MODELS[nextKey];
    setParams({
      a: newModel.defaultA,
      x0: newModel.defaultX0,
    });
  }, []);

  // 调节参数
  const handleParamChange = useCallback(
    (key: string, value: number) => {
      const meta = dynamicMeta[key];
      let clamped = value;
      if (meta) {
        clamped = Math.max(meta.min, Math.min(meta.max, value));
      }
      setParams((prev) => ({ ...prev, [key]: Number(clamped.toFixed(2)) }));
    },
    [dynamicMeta],
  );

  const handleReset = useCallback(() => {
    setParams({
      a: currentModel.defaultA,
      x0: currentModel.defaultX0,
    });
  }, [currentModel]);

  // 参数配置传递给 ParamControl
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const list: ParamConfig[] = [];

    // 在模式3(含参讨论) 或 其它模式下显示 a
    list.push({
      ...dynamicMeta.a,
      value: params.a ?? currentModel.defaultA,
    });

    // 在模式1(动点探索)与模式2下展示 x0
    if (mode === "monotonicity_point" || mode === "extrema_analysis") {
      list.push({
        ...dynamicMeta.x0,
        value: params.x0 ?? currentModel.defaultX0,
      });
    }

    return list;
  }, [dynamicMeta, params, currentModel, mode]);

  // 左上角悬浮公式卡片 LaTeX
  const floatingFormulaLatex = useMemo(() => {
    const x0Val = params.x0 ?? 1.0;
    const fpx0 = modelResult.derivativeFn(x0Val);
    const fpx0Str = Number.isFinite(fpx0) ? formatFloat(fpx0) : "--";

    if (mode === "monotonicity_point") {
      const signStr = Number.isFinite(fpx0)
        ? fpx0 > 0
          ? "> 0"
          : fpx0 < 0
            ? "< 0"
            : "= 0"
        : "";
      return `${modelResult.latex} \\quad \\Big| \\quad f'(x_0) = ${fpx0Str} ${signStr}`;
    }

    if (mode === "extrema_analysis") {
      return `${modelResult.latex} \\quad \\text{与} \\quad ${modelResult.derivativeLatex}`;
    }

    return `${modelResult.latex} \\quad \\Big[ ${modelResult.criticalCondition} \\Big]`;
  }, [modelResult, params, mode]);

  // 中屏右下角图例配置（KaTeX与中文分离，杜绝乱码）
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const items: SceneLegendItem[] = [
      {
        color: MATH_COLORS.function,
        label: "原函数",
        formula: modelResult.latex,
        style: "solid",
      },
    ];

    if (mode === "extrema_analysis" || mode === "parametric_discuss") {
      items.push({
        color: MATH_COLORS.derivative,
        label: "导函数",
        formula: modelResult.derivativeLatex,
        style: "dash",
      });
    }

    if (mode === "monotonicity_point" || mode === "extrema_analysis") {
      items.push({
        color: MATH_COLORS.tangentLine,
        label: "切线",
        formula: "y - f(x_0) = f'(x_0)(x - x_0)",
        style: "solid",
      });
      items.push({
        color: MATH_COLORS.tangentLine,
        label: "切点动点",
        formula: "P(x_0, f(x_0))",
        style: "point",
      });
    }

    if (modelResult.extrema.length > 0) {
      items.push({
        color: MATH_COLORS.focusPoint,
        label: "极值点 / 驻点",
        style: "point",
      });
    }

    if (mode === "monotonicity_point" || mode === "parametric_discuss") {
      items.push({
        color: MATH_COLORS.vectorSecondary,
        label: "单调增区间",
        formula: "f'(x) > 0",
        style: "area",
      });
      items.push({
        color: MATH_COLORS.paramPrimary,
        label: "单调减区间",
        formula: "f'(x) < 0",
        style: "area",
      });
    }

    return items;
  }, [modelResult, mode]);

  // 教学导引卡片动态提示（严格落实【初始条件】+【核心设问】闭环）
  const tipConfig = useMemo(() => {
    const aVal = params.a ?? currentModel.defaultA;
    const aStr = formatFloat(aVal);
    const x0Val = params.x0 ?? currentModel.defaultX0;
    const x0Str = formatFloat(x0Val);

    const domainStr =
      modelKey === "ln_x_ratio" || modelKey === "x_ln_x_param"
        ? "(0, +\\infty)"
        : modelKey === "nike_rational"
          ? "(-\\infty, 0) \\cup (0, +\\infty)"
          : "\\mathbb{R}";

    const funcFormula = `$${modelResult.latex}$`;
    const derivFormula = `$${modelResult.derivativeLatex}$`;
    const domainFormula = `$x \\in ${domainStr}$`;
    const x0Formula = `$x_0 = ${x0Str}$`;
    const aRangeFormula = `$a \\in [${currentModel.aRange[0]}, ${currentModel.aRange[1]}]$`;
    const aCurrentFormula = `$a = ${aStr}$`;

    if (mode === "monotonicity_point") {
      const fpx0 = modelResult.derivativeFn(x0Val);
      const isInc = Number.isFinite(fpx0) && fpx0 > 0;
      return {
        variant: isInc ? ("info" as const) : ("warning" as const),
        badge: "数形结合 · 导数几何意义与单调性",
        condition: `【初始条件】考察${currentModel.name} ${funcFormula}，定义域 ${domainFormula}，当前切点横坐标取 ${x0Formula}。`,
        question:
          "【核心设问】\n(1) 求切点处的导数值 $f'(x_0)$，写出点斜式切线方程；\n(2) 分析切线斜率 $k = f'(x_0)$ 的符号如何充要判定函数在切点附近的局部增减方向。",
      };
    }

    if (mode === "extrema_analysis") {
      return {
        variant: "info" as const,
        badge: "第一充分条件 · 穿零变号与极值判定",
        condition: `【初始条件】已知${currentModel.name} ${funcFormula}（${domainFormula}），导函数为 ${derivFormula}。`,
        question:
          "【核心设问】\n(1) 解方程 $f'(x) = 0$ 确定驻点，分析导数图象在各驻点处的穿零变号方向；\n(2) 结合极值第一充分条件，判定驻点是否为极值点，并求出极值。",
      };
    }

    return {
      variant: "warning" as const,
      badge: "高考真题母题 · 含参单调性分类讨论",
      condition: `【初始条件】含参函数 ${funcFormula}（${domainFormula}），实数参数 ${aRangeFormula}，当前 ${aCurrentFormula}。`,
      question:
        "【核心设问】\n(1) 探究导函数 $f'(x)$ 的零点存在性及判别式/临界分水岭，确定分类讨论的分段边界；\n(2) 按照高考大题规范五步法，分类讨论写出函数在定义域内的单调递增区间与递减区间。",
    };
  }, [mode, modelResult, params, currentModel, modelKey]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="探究维度">
            <TabSwitcher
              tabs={MODE_TABS}
              value={mode}
              onChange={(tab) => setMode(tab as ExploreMode)}
            />
          </LeftPanelSection>

          <LeftPanelSection title="高考函数模型">
            <SelectGrid
              items={MODEL_KEYS.map((k) => ({
                key: k,
                label: MONOTONICITY_MODELS[k].name,
                formula: MONOTONICITY_MODELS[k].formula,
              }))}
              value={modelKey}
              onChange={handleModelChange}
              columns={2}
            />
          </LeftPanelSection>

          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          <TipCard
            variant={tipConfig.variant}
            badge={tipConfig.badge}
            condition={tipConfig.condition}
            question={tipConfig.question}
          />
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white select-none">
          {/* 左上角悬浮公式看板 */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm pointer-events-none">
            <KatexFormula formula={floatingFormulaLatex} mode="inline" />
          </div>

          {/* 右下角毛玻璃图例 */}
          <SceneLegend items={legendItems} />

          {/* SVG 动画画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <DerivativeMonotonicityScene
              params={params}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              modelKey={modelKey}
              mode={mode}
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
          reasoningSteps={mathData.reasoningSteps}
          examAnchor={mathData.examAnchor}
          mnemonic={mathData.mnemonic}
          title="数学解析看板"
        />
      }
    />
  );
}
export default DerivativeMonotonicityAnimation;
