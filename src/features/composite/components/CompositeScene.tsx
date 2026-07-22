import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
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

  // 标注避让：根据当前模式计算标签位置
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

    // 拖拽分界点改变 x0
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

        {/* 左段在 x0 处的实心端点 */}
        <circle
          cx={scale.originX + x0 * scale.scaleX}
          cy={scale.originY - res.leftValAtX0 * scale.scaleY}
          r={5}
          fill={MATH_COLORS.function}
        />

        {/* 右段在 x0 处的空心端点 (如果断开) */}
        {!res.isContinuous && (
          <circle
            cx={scale.originX + x0 * scale.scaleX}
            cy={scale.originY - res.rightValAtX0 * scale.scaleY}
            r={5}
            fill="#FFFFFF"
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
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

    // 内层二次函数 g(x) = x^2 + b*x + c
    const gFn = (x: number) => x * x + innerB * x + innerC;

    // 拖拽采样点 xSample
    const handleDragXSample = (mathPt: { x: number; y: number }) => {
      onParamChange("xSample", Math.round(mathPt.x * 10) / 10);
    };

    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 内层函数 g(x) 曲线 (深蓝色) */}
        <FunctionGraph
          fn={gFn}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />

        {/* 采样点 x = xSample 垂直导引线 */}
        {res.isValid && (
          <line
            x1={scale.originX + xSample * scale.scaleX}
            y1={scale.originY}
            x2={scale.originX + xSample * scale.scaleX}
            y2={scale.originY - res.u * scale.scaleY}
            stroke={withAlpha(MATH_COLORS.paramSecondary, 0.7)}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
        )}

        {/* 采样点在内层 g(x) 上的对应点 P(x, u) */}
        {res.isValid && (
          <circle
            cx={scale.originX + xSample * scale.scaleX}
            cy={scale.originY - res.u * scale.scaleY}
            r={5}
            fill={MATH_COLORS.paramSecondary}
          />
        )}

        {/* 采样控制点 P(x, 0) */}
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
