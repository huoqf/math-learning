import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  Asymptote,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculatePiecewise, calculateComposite } from "@/math/composite";

interface CompositeSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  subMode: "piecewise" | "composite";
  outerType: "exp" | "log" | "quadratic";
}

export function CompositeScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  subMode,
  outerType,
}: CompositeSceneProps) {
  const x0 = params.x0 ?? 1.0;
  const xSample = params.xSample ?? 1.5;

  // 标注避让计算
  const placedLabels = useMemo(() => {
    const entries: LabelEntry[] = [];
    if (subMode === "piecewise") {
      const pt = mathToDesign(x0, 0, scale);
      entries.push({
        key: "x0",
        text: `x₀ = ${x0.toFixed(1)}`,
        x: pt.x,
        y: pt.y,
        anchor: "middle",
        dy: -12,
      });
    } else {
      const pt = mathToDesign(xSample, 0, scale);
      entries.push({
        key: "xSample",
        text: `x = ${xSample.toFixed(1)}`,
        x: pt.x,
        y: pt.y,
        anchor: "middle",
        dy: -12,
      });
    }
    return avoidLabels(entries, { fontScale });
  }, [subMode, x0, xSample, scale, fontScale]);

  if (subMode === "piecewise") {
    const leftSlope = params.leftSlope ?? 1.0;
    const leftConst = params.leftConst ?? 0.0;
    const rightSlope = params.rightSlope ?? -0.5;
    const rightConst = params.rightConst ?? 1.5;

    const res = calculatePiecewise({
      x0,
      leftSlope,
      leftConst,
      rightSlope,
      rightConst,
    });

    const handleDragX0 = (mathPt: { x: number; y: number }) => {
      onParamChange("x0", Math.round(mathPt.x * 2) / 2);
    };

    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 分界线 x = x0 */}
        <Asymptote
          type="vertical"
          value={x0}
          scale={scale}
          color={MATH_COLORS.asymptote}
          label={`x₀ = ${x0.toFixed(1)}`}
          fontScale={fontScale}
        />

        {/* 左段函数曲线 (x <= x0) */}
        <FunctionGraph
          fn={(x) => (x <= x0 ? leftSlope * x + leftConst : NaN)}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.8}
        />

        {/* 右段函数曲线 (x > x0) */}
        <FunctionGraph
          fn={(x) => (x > x0 ? rightSlope * x + rightConst : NaN)}
          scale={scale}
          color={MATH_COLORS.paramPrimary}
          strokeWidth={2.8}
        />

        {/* 左段在 x0 处的闭区间端点 (实心点) */}
        <MathPoint
          cx={x0}
          cy={res.leftValAtX0}
          scale={scale}
          variant="solid"
          color={MATH_COLORS.function}
          fontScale={fontScale}
        />

        {/* 右段在 x0 处的开区间端点 (若断开则为空心点) */}
        {!res.isContinuous && (
          <MathPoint
            cx={x0}
            cy={res.rightValAtX0}
            scale={scale}
            variant="hollow"
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
          />
        )}

        {/* 交互分界控制点 */}
        <InteractivePoint
          cx={x0}
          cy={0}
          scale={scale}
          vp={vp}
          onDrag={handleDragX0}
          label={`x₀ = ${x0.toFixed(1)}`}
          labelKey="x0"
          placedLabels={placedLabels}
          color={MATH_COLORS.paramPrimary}
          fontScale={fontScale}
        />
      </g>
    );
  } else {
    // 复合函数模式
    const innerB = params.innerB ?? -2.0;
    const innerC = params.innerC ?? 2.0;

    const res = calculateComposite({ xSample, innerB, innerC, outerType });

    const handleDragXSample = (mathPt: { x: number; y: number }) => {
      onParamChange("xSample", Math.round(mathPt.x * 10) / 10);
    };

    const ptDesignX = scale.originX + xSample * scale.scaleX;
    const ptDesignYInner = Number.isFinite(res.u)
      ? scale.originY - res.u * scale.scaleY
      : null;
    const ptDesignYComposite = Number.isFinite(res.y)
      ? scale.originY - res.y * scale.scaleY
      : null;

    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 1. 内层函数 u = g(x) 辅助虚线 */}
        <FunctionGraph
          fn={res.evaluateInner}
          scale={scale}
          color={MATH_COLORS.paramSecondary}
          strokeWidth={1.8}
          strokeDasharray="4 3"
        />

        {/* 2. 复合终态函数 y = f(g(x)) 实线曲线 */}
        <FunctionGraph
          fn={res.evaluateComposite}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.8}
        />

        {/* 3. 采样点 x = xSample 垂直传导导引线 */}
        {res.isValid &&
          ptDesignYInner !== null &&
          ptDesignYComposite !== null && (
            <line
              x1={ptDesignX}
              y1={scale.originY}
              x2={ptDesignX}
              y2={Math.min(ptDesignYInner, ptDesignYComposite)}
              stroke={withAlpha(MATH_COLORS.paramTertiary, 0.6)}
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
          )}

        {/* 4. 内层点 P₁(x, u) */}
        {Number.isFinite(res.u) && (
          <MathPoint
            cx={xSample}
            cy={res.u}
            scale={scale}
            variant="focus"
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
          />
        )}

        {/* 5. 复合终值点 P₂(x, y) */}
        {res.isValid && Number.isFinite(res.y) && (
          <MathPoint
            cx={xSample}
            cy={res.y}
            scale={scale}
            variant="solid"
            color={MATH_COLORS.function}
            fontScale={fontScale}
          />
        )}

        {/* 6. 交互采样控制点 P(x, 0) */}
        <InteractivePoint
          cx={xSample}
          cy={0}
          scale={scale}
          vp={vp}
          onDrag={handleDragXSample}
          label={`x = ${xSample.toFixed(1)}`}
          labelKey="xSample"
          placedLabels={placedLabels}
          color={MATH_COLORS.paramPrimary}
          fontScale={fontScale}
        />
      </g>
    );
  }
}
