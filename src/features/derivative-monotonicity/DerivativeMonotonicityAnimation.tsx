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
      return `${modelResult.latex} \\quad \\Big| \\quad f'(x_0) = ${fpx0Str} \\; ${
        Number.isFinite(fpx0)
          ? fpx0 > 0
            ? "(\\text{斜率 } > 0 \\implies \\text{单调递增})"
            : fpx0 < 0
              ? "(\\text{斜率 } < 0 \\implies \\text{单调递减})"
              : "(\\text{切线水平, 驻点})"
          : ""
      }`;
    }

    if (mode === "extrema_analysis") {
      return `${modelResult.latex} \\quad \\text{与} \\quad ${modelResult.derivativeLatex}`;
    }

    return `${modelResult.latex} \\quad \\Big[ ${modelResult.criticalCondition} \\Big]`;
  }, [modelResult, params, mode]);

  // 中屏右下角图例配置
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const items: SceneLegendItem[] = [
      {
        color: MATH_COLORS.function,
        formula: `f(x) = ${modelResult.name}`,
        style: "solid",
      },
    ];

    if (mode === "extrema_analysis" || mode === "parametric_discuss") {
      items.push({
        color: MATH_COLORS.derivative,
        formula: `f'(x) \\; (\\text{导函数图象})`,
        style: "dash",
      });
    }

    if (mode === "monotonicity_point" || mode === "extrema_analysis") {
      items.push({
        color: MATH_COLORS.tangentLine,
        formula: `y - f(x_0) = f'(x_0)(x - x_0) \\;(\\text{切线})`,
        style: "solid",
      });
      items.push({
        color: MATH_COLORS.tangentLine,
        formula: `P(x_0, f(x_0)) \\;(\\text{切点动点})`,
        style: "point",
      });
    }

    if (modelResult.extrema.length > 0) {
      items.push({
        color: MATH_COLORS.focusPoint,
        formula: `\\text{极值点 / 驻点}`,
        style: "point",
      });
    }

    if (mode === "monotonicity_point" || mode === "parametric_discuss") {
      items.push({
        color: MATH_COLORS.vectorSecondary,
        formula: `f'(x) > 0 \\;(\\text{单调增区间})`,
        style: "area",
      });
      items.push({
        color: MATH_COLORS.paramPrimary,
        formula: `f'(x) < 0 \\;(\\text{单调减区间})`,
        style: "area",
      });
    }

    return items;
  }, [modelResult, mode]);

  // 教学导引卡片动态提示
  const tipConfig = useMemo(() => {
    if (mode === "monotonicity_point") {
      const fpx0 = modelResult.derivativeFn(params.x0 ?? 1.0);
      const isInc = fpx0 > 0;
      return {
        variant: isInc ? ("info" as const) : ("warning" as const),
        title: "数形结合直观探索",
        detail:
          "拖动中屏切点 P 或调节横坐标 x₀，观察切线斜率 k = f'(x₀) 的正负与函数曲线升降的一致性。",
      };
    }
    if (mode === "extrema_analysis") {
      return {
        variant: "info" as const,
        title: "第一充分条件判定极值",
        detail:
          "观察紫色虚线导函数 f'(x) 与 x 轴交点：穿零变号即为极值点（左正右负极大值，左负右正极小值），不变号为非极值驻点。",
      };
    }
    return {
      variant: "warning" as const,
      title: "高考含参分类讨论核心",
      detail:
        "滑动参数 a，观察零点个数（判别式 Δ 或临界参数）如何改变单调区间的分布与极值点的存在性。",
    };
  }, [mode, modelResult, params.x0]);

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
                fullWidth: true,
              }))}
              value={modelKey}
              onChange={handleModelChange}
              columns={1}
            />
          </LeftPanelSection>

          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          <LeftPanelSection title="教学导引" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-neutral-800">
                  {tipConfig.title}
                </div>
                <div className="text-neutral-600 leading-relaxed">
                  {tipConfig.detail}
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
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
          mnemonic={mathData.mnemonic}
          title="导数与单调性及极值看板"
        />
      }
    />
  );
}
export default DerivativeMonotonicityAnimation;
