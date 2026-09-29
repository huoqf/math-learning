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
  SceneLabelGroup,
  Asymptote,
} from "@/components/Math";
import { MATH_COLORS, GEOMETRY_COLORS } from "@/theme";
import {
  solveMonotonicityModel,
  isTrueExtremum,
  type MonotonicityModelKey,
} from "@/math/derivativeMonotonicity";
import type { ViewportInfo, SceneScale } from "@/hooks";
import { mathToDesign } from "@/utils/coordinate";
import type { LabelItem } from "@/utils/labelOverlap";
import { paramDragRange, snapDragValue } from "@/utils/paramClamp";
import { getDynamicParamMeta } from "@/data/registries/derivativeMonotonicity";

/**
 * 极值点处水平切线（即切线 y = y*）的设计像素半长。
 * 取「短段」而非贯穿画布的长线：贯穿线会被误读为渐近线或参考线，
 * 而短线段就读作「该点附近的一条切线」，与「极值点处切线水平」这一结论直接对应。
 */
const EXTREMUM_TANGENT_HALF_PX = 46;

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

  // 真极值点（极大 / 极小）：排除类型为 inflection_stationary 的「导数为零的点非极值」——
  // 该点处 f'(x) = 0 但两侧导数同号，切线虽然水平却并非极值，画极值特征线会造成误读。
  // 判定口径由 math 层 isTrueExtremum 唯一提供，三屏共用，杜绝分化。
  const trueExtrema = useMemo(() => extrema.filter(isTrueExtremum), [extrema]);

  // 极值特征线的呈现门控：极值判定 / 含参讨论两个维度。
  // （与右屏「单调性与极值符号表」同一门控，保证三屏信息同源）
  const showExtremumGuides =
    mode === "extrema_analysis" || mode === "parametric_discuss";

  // 参数域 SSOT：x0 的可用区间随模型变化（对数模型的 xRange 天然排除 x ≤ 0），
  // 因此必须读取动态元数据，而不能退化成静态 paramMeta.x0。
  const x0Meta = useMemo(() => getDynamicParamMeta(modelKey).x0, [modelKey]);

  // 动点拖拽回调（严格定义域保护）
  const handleDragPoint = useCallback(
    (newMathPos: { x: number; y: number }) => {
      if (!onParamChange) return;

      // ① 视口 ∩ 参数域 求交后按步长吸附（SSOT：paramClamp）。
      //    绝不粗暴钳死横坐标：视口收窄时交集自然收紧，视口宽裕时完全放开。
      let nextX = snapDragValue(
        newMathPos.x,
        x0Meta.step,
        paramDragRange(x0Meta, scale, "x"),
      );

      // ② 奇点保护：对勾模型 f(x) = x + a/x 在 x = 0 处无定义，
      //    这属于「点排除」而非「区间收缩」，无法并入 ① 的区间求交，必须单独兜底。
      //    （对数模型的 x > 0 已由 x0Meta.min 统一表达，此处不再重复手写。）
      if (modelKey === "nike_rational" && Math.abs(nextX) < 0.2) {
        nextX = nextX >= 0 ? 0.2 : -0.2;
      }

      onParamChange("x0", nextX);
    },
    [onParamChange, modelKey, scale, x0Meta],
  );

  const fx0 = fn(x0);
  const fpx0 = derivativeFn(x0);
  const isPointValid = Number.isFinite(fx0) && Number.isFinite(fpx0);

  // 智能避让点标标签（使用纯学术标准命名，杜绝 Unicode 下标豆腐块）
  const labelItems = useMemo<LabelItem[]>(() => {
    const items: LabelItem[] = [];

    // 极值点标签
    extrema.forEach((ext, idx) => {
      const typeLabel =
        ext.type === "maximum"
          ? "极大值"
          : ext.type === "minimum"
            ? "极小值"
            : "导数为零的点";

      const nameStr =
        ext.type === "maximum"
          ? extrema.filter((e) => e.type === "maximum").length > 1
            ? `M${idx + 1}`
            : "M"
          : ext.type === "minimum"
            ? extrema.filter((e) => e.type === "minimum").length > 1
              ? `m${idx + 1}`
              : "m"
            : "S";

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

    // 当前切点动点标签（与切线同门控：仅探索类模式呈现，含参讨论模式不渲染孤立切点）
    if (
      isPointValid &&
      (mode === "monotonicity_point" || mode === "extrema_analysis")
    ) {
      const pos = mathToDesign(x0, fx0, scale);
      items.push({
        key: "drag-p",
        x: pos.x,
        y: pos.y,
        text: "P (切点)",
        color: MATH_COLORS.tangentLine,
        preferredPlacement: fpx0 >= 0 ? "top" : "bottom",
      });
    }

    return items;
  }, [extrema, isPointValid, x0, fx0, fpx0, scale, mode]);

  // 计算单调区间：投影为 x 轴色带（区间是 x 的属性，不是曲线下的面积，
  // 填充曲线与 x 轴之间会被误读成 f(x) > 0 的解集）
  const intervalShadows = useMemo(() => {
    return monotonicIntervals.map((it, idx) => {
      // 避免 Infinity 导致渲染崩溃
      const rawStart = it.range[0];
      const rawEnd = it.range[1];
      const x1 = Math.max(scale.xMin, Math.min(scale.xMax, rawStart));
      const x2 = Math.max(scale.xMin, Math.min(scale.xMax, rawEnd));

      if (x2 - x1 < 1e-4) return null;

      const isInc = it.type === "increasing";
      const bandColor = isInc
        ? MATH_COLORS.vectorSecondary
        : MATH_COLORS.paramPrimary;

      return (
        <line
          key={`shadow-${idx}-${x1}-${x2}`}
          x1={mathToDesign(x1, 0, scale).x}
          y1={scale.originY}
          x2={mathToDesign(x2, 0, scale).x}
          y2={scale.originY}
          stroke={bandColor}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.55}
        />
      );
    });
  }, [monotonicIntervals, scale]);

  return (
    <g>
      {/* 坐标轴网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 渐近线辅助线（严格符合学科规范） */}
      {modelKey === "nike_rational" && (
        <>
          <Asymptote
            type="vertical"
            value={0}
            scale={scale}
            color={GEOMETRY_COLORS.asymptote}
            label="x = 0 (垂直渐近线)"
            fontScale={fontScale}
          />
          <Asymptote
            type="oblique"
            value={1}
            intercept={0}
            scale={scale}
            color={GEOMETRY_COLORS.asymptote}
            label="y = x (斜渐近线)"
            fontScale={fontScale}
          />
        </>
      )}

      {modelKey === "ln_x_ratio" && (
        <Asymptote
          type="vertical"
          value={0}
          scale={scale}
          color={GEOMETRY_COLORS.asymptote}
          label="x = 0 (渐近线)"
          fontScale={fontScale}
        />
      )}

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

      {/* 极值点与导数为零的点（纯数学特征点） */}
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

      {/* 极值特征线：竖虚线把极值点的横坐标 x* 落到 x 轴上；短水平线就是该点处的切线
          y = y*（极值点处 f'(x*) = 0，切线必然水平）。
          两条线 + 极值点 + 极值点标签同取 focusPoint 色，保证「同一数学对象同一颜色」。
          越界部分由画布容器 overflow-hidden 裁掉，故无需再对 ext.y 做钳制——
          钳回视口反而会让水平线偏离 y = y*，不再是该点的切线（数学上是错的）。 */}
      {showExtremumGuides &&
        trueExtrema.map((ext, idx) => {
          const px = mathToDesign(ext.x, 0, scale).x;
          const py = mathToDesign(ext.x, ext.y, scale).y;
          return (
            <React.Fragment key={`extremum-guide-${idx}-${ext.x}`}>
              <line
                x1={px}
                y1={scale.originY}
                x2={px}
                y2={py}
                stroke={MATH_COLORS.focusPoint}
                strokeWidth={1.2}
                strokeDasharray="4 4"
                opacity={0.7}
              />
              <line
                x1={px - EXTREMUM_TANGENT_HALF_PX}
                y1={py}
                x2={px + EXTREMUM_TANGENT_HALF_PX}
                y2={py}
                stroke={MATH_COLORS.focusPoint}
                strokeWidth={1.8}
                strokeDasharray="6 3"
                opacity={0.9}
              />
            </React.Fragment>
          );
        })}

      {/* 可拖拽切点动点 */}
      {/* 可拖拽切点动点（与切线同门控，避免含参讨论模式出现无切线的孤立切点） */}
      {isPointValid &&
        (mode === "monotonicity_point" || mode === "extrema_analysis") && (
          <InteractivePoint
            cx={x0}
            cy={fx0}
            scale={scale}
            vp={vp}
            onDrag={handleDragPoint}
            color={MATH_COLORS.tangentLine}
            fontScale={fontScale}
            edgeClampProjection
          />
        )}

      {/* 极简学术点标智能避让图层 */}
      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
};
