/**
 * src/features/derivative-monotonicity/components/DerivativeMonotonicityScene.tsx
 * 导数与单调性极值中屏 SVG 场景渲染组件
 */

import React, { useMemo, useCallback } from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  TangentLine,
  IntervalShadow,
  SceneLabelGroup,
} from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  solveMonotonicityModel,
  type MonotonicityModelKey,
} from "@/math/derivativeMonotonicity";
import type { ViewportInfo, SceneScale } from "@/hooks";
import { mathToDesign } from "@/utils/coordinate";
import type { LabelItem } from "@/utils/labelOverlap";

interface DerivativeMonotonicitySceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (v: number) => number;
  modelKey: MonotonicityModelKey;
  mode: "monotonicity_point" | "extrema_analysis" | "parametric_discuss";
  onParamChange?: (key: string, value: number) => void;
}

export const DerivativeMonotonicityScene: React.FC<
  DerivativeMonotonicitySceneProps
> = ({ params, scale, vp, fontScale, modelKey, mode, onParamChange }) => {
  const a = params.a ?? 1.0;
  const x0 = params.x0 ?? 1.5;

  const modelResult = useMemo(() => {
    return solveMonotonicityModel(modelKey, a);
  }, [modelKey, a]);

  const { fn, derivativeFn, extrema, monotonicIntervals } = modelResult;

  // 动点拖拽回调
  const handleDragPoint = useCallback(
    (newMathPos: { x: number; y: number }) => {
      if (!onParamChange) return;
      let clampedX = newMathPos.x;
      // 对数模型定义域保护 x > 0.05
      if (modelKey === "ln_x_ratio" || modelKey === "x_ln_x_param") {
        clampedX = Math.max(0.1, clampedX);
      }
      onParamChange("x0", Number(clampedX.toFixed(2)));
    },
    [onParamChange, modelKey],
  );

  const fx0 = fn(x0);
  const fpx0 = derivativeFn(x0);
  const isPointValid = Number.isFinite(fx0) && Number.isFinite(fpx0);

  // 智能避让点标标签（使用设计像素坐标）
  const labelItems = useMemo<LabelItem[]>(() => {
    const items: LabelItem[] = [];

    // 极值点标签
    const subDigits = ["₁", "₂", "₃", "₄"];
    extrema.forEach((ext, idx) => {
      const typeLabel =
        ext.type === "maximum"
          ? "极大值"
          : ext.type === "minimum"
            ? "极小值"
            : "驻点";
      const sub = subDigits[idx] || `${idx + 1}`;
      const nameStr =
        ext.type === "maximum"
          ? `M${sub}`
          : ext.type === "minimum"
            ? `m${sub}`
            : `S${sub}`;

      const pos = mathToDesign(ext.x, ext.y, scale);
      items.push({
        key: `ext-${idx}`,
        x: pos.x,
        y: pos.y,
        text: `${nameStr} (${typeLabel})`,
        color: MATH_COLORS.focusPoint,
        preferredPlacement: ext.type === "maximum" ? "top" : "bottom",
      });
    });

    // 当前切点动点标签（保持极简学术点标，精确坐标归位右下角图例与右屏看板）
    if (isPointValid) {
      const pos = mathToDesign(x0, fx0, scale);
      items.push({
        key: "drag-p",
        x: pos.x,
        y: pos.y,
        text: "P₀",
        color: MATH_COLORS.tangentLine,
        preferredPlacement: fpx0 >= 0 ? "top" : "bottom",
      });
    }

    return items;
  }, [extrema, isPointValid, x0, fx0, fpx0, scale]);

  // 计算区间阴影（增区间与减区间）
  const intervalShadows = useMemo(() => {
    return monotonicIntervals.map((it, idx) => {
      // 避免 Infinity 导致渲染崩溃
      const rawStart = it.range[0];
      const rawEnd = it.range[1];
      const x1 = Math.max(scale.xMin, Math.min(scale.xMax, rawStart));
      const x2 = Math.max(scale.xMin, Math.min(scale.xMax, rawEnd));

      if (x2 - x1 < 1e-4) return null;

      const isInc = it.type === "increasing";
      const fillColor = isInc
        ? withAlpha(MATH_COLORS.vectorSecondary, 0.12)
        : withAlpha(MATH_COLORS.paramPrimary, 0.12);

      return (
        <IntervalShadow
          key={`shadow-${idx}-${x1}-${x2}`}
          fn={fn}
          x1={x1}
          x2={x2}
          scale={scale}
          fillColor={fillColor}
        />
      );
    });
  }, [monotonicIntervals, scale, fn]);

  return (
    <g>
      {/* 坐标轴网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 单调增减区间阴影填充（模式1与模式3展示） */}
      {(mode === "monotonicity_point" || mode === "parametric_discuss") &&
        intervalShadows}

      {/* 原函数 f(x) 曲线 */}
      <FunctionGraph
        fn={fn}
        scale={scale}
        color={MATH_COLORS.function}
        strokeWidth={2.4}
      />

      {/* 导函数 f'(x) 曲线（模式2：极值变号分析，或模式3：含参讨论中同步显示） */}
      {(mode === "extrema_analysis" || mode === "parametric_discuss") && (
        <FunctionGraph
          fn={derivativeFn}
          scale={scale}
          color={MATH_COLORS.derivative}
          strokeWidth={1.8}
          strokeDasharray="5 4"
        />
      )}

      {/* 切线（模式1：动点切线探索） */}
      {isPointValid &&
        (mode === "monotonicity_point" || mode === "extrema_analysis") && (
          <TangentLine
            fn={fn}
            x0={x0}
            scale={scale}
            color={MATH_COLORS.tangentLine}
            strokeWidth={1.8}
          />
        )}

      {/* 极值点与驻点（纯数学特征点） */}
      {extrema.map((ext, idx) => (
        <MathPoint
          key={`ext-${idx}-${ext.x}`}
          cx={ext.x}
          cy={ext.y}
          scale={scale}
          color={MATH_COLORS.focusPoint}
          fontScale={fontScale}
        />
      ))}

      {/* 可拖拽切点动点 */}
      {isPointValid && (
        <InteractivePoint
          cx={x0}
          cy={fx0}
          scale={scale}
          vp={vp}
          onDrag={handleDragPoint}
          color={MATH_COLORS.tangentLine}
          fontScale={fontScale}
        />
      )}

      {/* 极简学术点标智能避让图层 */}
      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
};
