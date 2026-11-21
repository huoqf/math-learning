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
import {
  MATH_COLORS,
  GEOMETRY_COLORS,
  CANVAS_COLORS,
  withAlpha,
} from "@/theme";
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
  activeStep?: number;
  showSplitView?: boolean;
  onParamChange?: (key: string, value: number) => void;
}

export const DerivativeMonotonicityScene: React.FC<
  DerivativeMonotonicitySceneProps
> = ({
  params,
  scale,
  vp,
  fontScale,
  modelKey,
  mode,
  activeStep = 0,
  showSplitView = false,
  onParamChange,
}) => {
  const regionOpacity = (r: number) =>
    !activeStep ? 1 : activeStep === r ? 1 : 0.3;
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

  const clampFrame = (x: number, y: number, w: number, h: number) => {
    const pad = 10;
    const minX = vp.designLeft + pad;
    const maxX = vp.designLeft + vp.designVisibleW - w - pad;
    const minY = vp.designTop + pad;
    const maxY = vp.designTop + vp.designVisibleH - h - pad;
    const cx = Math.max(minX, Math.min(x, Math.max(minX, maxX)));
    const cy = Math.max(minY, Math.min(y, Math.max(minY, maxY)));
    return { x: cx, y: cy, width: w, height: h };
  };

  // 上下同轴双视窗（f(x) 上视窗 vs f'(x) 下视窗，严格共享 xScale 与 originX）
  const splitLayout = useMemo(() => {
    if (!showSplitView) return null;
    const padTop = vp.designTop + 14;
    const gap = 26;
    const padBottom = 14;
    const usableH = Math.max(220, vp.designVisibleH - 28 - gap);
    const topH = Math.round(usableH * 0.54);
    const botH = usableH - topH;
    const topY0 = padTop;
    const botY0 = padTop + topH + gap;
    void padBottom;

    const topSpanY = Math.max(1e-3, scale.yMax - scale.yMin);
    const topScaleY = topH / topSpanY;
    const topScale: SceneScale = {
      ...scale,
      scaleY: topScaleY,
      originY: topY0 + scale.yMax * topScaleY,
    };

    // 为导函数 f'(x) 计算合理纵向范围（始终包含 0 以便观察穿零变号）
    let dMin = -1;
    let dMax = 1;
    for (let i = 0; i <= 80; i++) {
      const xv = scale.xMin + ((scale.xMax - scale.xMin) * i) / 80;
      const dv = derivativeFn(xv);
      if (Number.isFinite(dv) && Math.abs(dv) <= 25) {
        if (dv < dMin) dMin = dv;
        if (dv > dMax) dMax = dv;
      }
    }
    const padD = Math.max(0.6, (dMax - dMin) * 0.14);
    const dyMin = Math.max(-18, dMin - padD);
    const dyMax = Math.min(18, dMax + padD);
    const botSpanY = Math.max(1e-3, dyMax - dyMin);
    const botScaleY = botH / botSpanY;
    const botScale: SceneScale = {
      ...scale,
      scaleY: botScaleY,
      originY: botY0 + dyMax * botScaleY,
      yMin: dyMin,
      yMax: dyMax,
    };

    return { topScale, botScale, topY0, topH, botY0, botH };
  }, [showSplitView, scale, vp.designTop, vp.designVisibleH, derivativeFn]);

  const stepFrame = (() => {
    if (!activeStep) return null;
    if (showSplitView && splitLayout) {
      if (activeStep === 1) {
        return clampFrame(
          vp.designLeft + 16,
          splitLayout.botY0 - 4,
          vp.designVisibleW - 32,
          splitLayout.botH + 8,
        );
      }
      if (activeStep === 2) {
        const refX =
          mode !== "parametric_discuss" && isPointValid
            ? mathToDesign(x0, 0, scale).x
            : trueExtrema.length > 0
              ? mathToDesign(trueExtrema[0].x, 0, scale).x
              : vp.designLeft + vp.designVisibleW / 2;
        return clampFrame(
          refX - 110,
          splitLayout.topY0,
          220,
          splitLayout.topH + splitLayout.botH + 26,
        );
      }
      return clampFrame(
        vp.designLeft + 16,
        splitLayout.topY0 - 4,
        vp.designVisibleW - 32,
        splitLayout.topH + 8,
      );
    }

    if (mode === "monotonicity_point") {
      if (activeStep === 1) {
        return clampFrame(
          vp.designLeft + 24,
          vp.designTop + 20,
          vp.designVisibleW - 48,
          vp.designVisibleH - 40,
        );
      }
      if (activeStep === 2 && isPointValid) {
        const pt = mathToDesign(x0, fx0, scale);
        return clampFrame(pt.x - 130, pt.y - 95, 260, 190);
      }
      return clampFrame(
        vp.designLeft + 30,
        scale.originY - 56,
        vp.designVisibleW - 60,
        112,
      );
    }

    if (activeStep === 1) {
      if (trueExtrema.length > 0) {
        const xs = trueExtrema.map((e) => mathToDesign(e.x, 0, scale).x);
        const minX = Math.min(...xs) - 90;
        const maxX = Math.max(...xs) + 90;
        return clampFrame(
          minX,
          scale.originY - 90,
          Math.max(200, maxX - minX),
          180,
        );
      }
      return clampFrame(
        vp.designLeft + 40,
        scale.originY - 90,
        vp.designVisibleW - 80,
        180,
      );
    }
    if (activeStep === 2) {
      if (trueExtrema.length > 0) {
        const pts = trueExtrema.map((e) => mathToDesign(e.x, e.y, scale));
        const minX = Math.min(...pts.map((p) => p.x)) - 80;
        const maxX = Math.max(...pts.map((p) => p.x)) + 80;
        const minY = Math.min(...pts.map((p) => p.y), scale.originY) - 45;
        const maxY = Math.max(...pts.map((p) => p.y), scale.originY) + 45;
        return clampFrame(
          minX,
          minY,
          Math.max(190, maxX - minX),
          Math.max(140, maxY - minY),
        );
      }
      return clampFrame(
        vp.designLeft + 60,
        vp.designTop + 60,
        vp.designVisibleW - 120,
        vp.designVisibleH - 120,
      );
    }
    return clampFrame(
      vp.designLeft + 30,
      scale.originY - 64,
      vp.designVisibleW - 60,
      128,
    );
  })();

  if (showSplitView && splitLayout) {
    const { topScale, botScale, topY0, topH, botY0, botH } = splitLayout;
    const x0ScanPx = mathToDesign(x0, 0, scale).x;
    const topClipId = "mono-split-top-clip";
    const botClipId = "mono-split-bot-clip";
    const clipX = vp.designLeft;
    const clipW = vp.designVisibleW;

    return (
      <g>
        <defs>
          <clipPath id={topClipId}>
            <rect x={clipX} y={topY0} width={clipW} height={topH} />
          </clipPath>
          <clipPath id={botClipId}>
            <rect x={clipX} y={botY0} width={clipW} height={botH} />
          </clipPath>
        </defs>

        {/* 上视窗：原函数 f(x) */}
        <g clipPath={`url(#${topClipId})`}>
          <CoordinateGrid scale={topScale} fontScale={fontScale} />
          <g data-step-region={3} opacity={regionOpacity(3)}>
            <FunctionGraph
              fn={fn}
              scale={topScale}
              color={MATH_COLORS.function}
              strokeWidth={2.4}
            />
            {extrema.map((ext, idx) => (
              <MathPoint
                key={`split-ext-${idx}-${ext.x}`}
                cx={ext.x}
                cy={ext.y}
                scale={topScale}
                color={MATH_COLORS.focusPoint}
                fontScale={fontScale}
              />
            ))}
          </g>
          <g data-step-region={2} opacity={regionOpacity(2)}>
            {isPointValid && mode !== "parametric_discuss" && (
              <>
                <TangentLine
                  fn={fn}
                  x0={x0}
                  scale={topScale}
                  color={MATH_COLORS.tangentLine}
                  strokeWidth={1.8}
                />
                <InteractivePoint
                  cx={x0}
                  cy={fx0}
                  scale={topScale}
                  vp={vp}
                  onDrag={handleDragPoint}
                  color={MATH_COLORS.tangentLine}
                  fontScale={fontScale}
                  edgeClampProjection
                />
              </>
            )}
          </g>
        </g>

        {/* 上下视窗分界标签 */}
        <line
          x1={vp.designLeft + 16}
          y1={topY0 + topH + 13}
          x2={vp.designLeft + vp.designVisibleW - 16}
          y2={topY0 + topH + 13}
          stroke={CANVAS_COLORS.grid}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <text
          x={vp.designLeft + vp.designVisibleW - 24}
          y={topY0 + 18}
          textAnchor="end"
          fill={MATH_COLORS.function}
          fontSize={fontScale(12)}
          fontWeight={600}
        >
          原函数 y = f(x)
        </text>
        <text
          x={vp.designLeft + vp.designVisibleW - 24}
          y={botY0 + 18}
          textAnchor="end"
          fill={MATH_COLORS.derivative}
          fontSize={fontScale(12)}
          fontWeight={600}
        >
          导函数 y = f&apos;(x)
        </text>

        {/* 下视窗：导函数 f'(x) 与穿零变号正负条 */}
        <g clipPath={`url(#${botClipId})`}>
          <CoordinateGrid scale={botScale} fontScale={fontScale} />
          <g data-step-region={1} opacity={regionOpacity(1)}>
            <FunctionGraph
              fn={derivativeFn}
              scale={botScale}
              color={MATH_COLORS.derivative}
              strokeWidth={2.2}
            />
            {extrema.map((ext, idx) => (
              <MathPoint
                key={`split-dzero-${idx}-${ext.x}`}
                cx={ext.x}
                cy={0}
                scale={botScale}
                color={MATH_COLORS.focusPoint}
                variant="hollow"
                fontScale={fontScale}
              />
            ))}
          </g>
        </g>

        {/* 贯通上下视窗的极值对齐线与动点垂直扫描线 */}
        <g data-step-region={2} opacity={regionOpacity(2)}>
          {trueExtrema.map((ext, idx) => {
            const px = mathToDesign(ext.x, 0, scale).x;
            const pyTop = mathToDesign(ext.x, ext.y, topScale).y;
            const pyBot = botScale.originY;
            return (
              <line
                key={`split-align-${idx}-${ext.x}`}
                x1={px}
                y1={Math.max(topY0, pyTop)}
                x2={px}
                y2={pyBot}
                stroke={withAlpha(MATH_COLORS.focusPoint, 0.7)}
                strokeWidth={1.4}
                strokeDasharray="4 4"
              />
            );
          })}
          {mode !== "parametric_discuss" && isPointValid && (
            <>
              <line
                x1={x0ScanPx}
                y1={topY0}
                x2={x0ScanPx}
                y2={botY0 + botH}
                stroke={withAlpha(MATH_COLORS.tangentLine, 0.55)}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <MathPoint
                cx={x0}
                cy={fpx0}
                scale={botScale}
                color={MATH_COLORS.tangentLine}
                fontScale={fontScale}
              />
            </>
          )}
        </g>

        {stepFrame && (
          <rect
            x={stepFrame.x}
            y={stepFrame.y}
            width={stepFrame.width}
            height={stepFrame.height}
            rx={8}
            fill="none"
            stroke={MATH_COLORS.answerStepFrame}
            strokeWidth={2}
            strokeDasharray="7 4"
            className="pointer-events-none"
          />
        )}
      </g>
    );
  }

  return (
    <g>
      {/* 坐标轴网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 第 1 步图层：定义域渐近线与导函数零点结构 */}
      <g data-step-region={1} opacity={regionOpacity(1)}>
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

        {(mode === "extrema_analysis" || mode === "parametric_discuss") && (
          <FunctionGraph
            fn={derivativeFn}
            scale={scale}
            color={MATH_COLORS.derivative}
            strokeWidth={1.8}
            strokeDasharray="5 4"
          />
        )}

        {mode === "monotonicity_point" && (
          <FunctionGraph
            fn={fn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.4}
          />
        )}
      </g>

      {/* 第 2 步图层：切点切线、极值检验特征线 */}
      <g data-step-region={2} opacity={regionOpacity(2)}>
        {isPointValid &&
          (mode === "monotonicity_point" || mode === "extrema_analysis") && (
            <>
              <TangentLine
                fn={fn}
                x0={x0}
                scale={scale}
                color={MATH_COLORS.tangentLine}
                strokeWidth={1.8}
              />
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
            </>
          )}

        {showExtremumGuides &&
          trueExtrema.map((ext, idx) => {
            const px = mathToDesign(ext.x, 0, scale).x;
            const py = mathToDesign(ext.x, ext.y, scale).y;
            return (
              <g key={`extremum-guide-${idx}-${ext.x}`}>
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
              </g>
            );
          })}
      </g>

      {/* 第 3 步图层：区间单调性色带、原函数结论与极值点 */}
      <g data-step-region={3} opacity={regionOpacity(3)}>
        {(mode === "extrema_analysis" || mode === "parametric_discuss") && (
          <FunctionGraph
            fn={fn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.4}
          />
        )}

        {(mode === "monotonicity_point" || mode === "parametric_discuss") &&
          intervalShadows}

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
      </g>

      {stepFrame && (
        <rect
          x={stepFrame.x}
          y={stepFrame.y}
          width={stepFrame.width}
          height={stepFrame.height}
          rx={8}
          fill="none"
          stroke={MATH_COLORS.answerStepFrame}
          strokeWidth={2}
          strokeDasharray="7 4"
          className="pointer-events-none"
        />
      )}

      {/* 极简学术点标智能避让图层 */}
      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
};
