import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  Asymptote,
  IntervalShadow,
  SecantLine,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import {
  evalFunctionParity,
  evalSecantSlope,
  evalSymmetryPeriod,
} from "@/math/function";

interface PropertiesSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  fnType: "cubic" | "quadratic" | "abs" | "reciprocal" | "sin";
  mode: "domain" | "parity" | "symmetry";
}

export function PropertiesScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  fnType,
  mode,
}: PropertiesSceneProps) {
  const x0 = params.x0 ?? 1.5;
  const x1 = params.x1 ?? -1.0;
  const x2 = params.x2 ?? 2.0;
  const axisA = params.axisA ?? 0.0;
  const axisB = params.axisB ?? 2.0;

  const getFn = React.useCallback(
    (x: number) => {
      switch (fnType) {
        case "cubic":
          return x * x * x;
        case "quadratic":
          return x * x;
        case "abs":
          return Math.abs(x);
        case "reciprocal":
          return Math.abs(x) > 1e-4 ? 1 / x : NaN;
        case "sin":
          return Math.sin(x);
        default:
          return x;
      }
    },
    [fnType],
  );

  const fx0 = getFn(x0);
  const fx1 = getFn(x1);
  const fx2 = getFn(x2);

  const handleDragX0 = (mathPt: { x: number; y: number }) => {
    onParamChange("x0", Math.round(mathPt.x * 10) / 10);
  };

  const handleDragX1 = (mathPt: { x: number; y: number }) => {
    onParamChange("x1", Math.round(mathPt.x * 10) / 10);
  };

  const handleDragX2 = (mathPt: { x: number; y: number }) => {
    onParamChange("x2", Math.round(mathPt.x * 10) / 10);
  };

  const placedLabels = React.useMemo(() => {
    const entries: LabelEntry[] = [];
    if (Number.isFinite(fx0)) {
      const pt = mathToDesign(x0, fx0, scale);
      entries.push({
        key: "P0",
        text: `P₀(${x0.toFixed(1)}, ${fx0.toFixed(1)})`,
        x: pt.x,
        y: pt.y,
        anchor: "middle",
        dy: -12,
      });
    }
    if (mode === "parity") {
      if (Number.isFinite(fx1)) {
        const pt1 = mathToDesign(x1, fx1, scale);
        entries.push({
          key: "P1",
          text: `P₁(${x1.toFixed(1)}, ${fx1.toFixed(1)})`,
          x: pt1.x,
          y: pt1.y,
          anchor: "middle",
          dy: -12,
        });
      }
      if (Number.isFinite(fx2)) {
        const pt2 = mathToDesign(x2, fx2, scale);
        entries.push({
          key: "P2",
          text: `P₂(${x2.toFixed(1)}, ${fx2.toFixed(1)})`,
          x: pt2.x,
          y: pt2.y,
          anchor: "middle",
          dy: -12,
        });
      }
    }
    return avoidLabels(entries, { fontScale });
  }, [x0, fx0, x1, fx1, x2, fx2, mode, scale, fontScale]);

  const parityRes = evalFunctionParity(fnType === "sin" ? "cubic" : fnType, x0);
  const secantRes = evalSecantSlope(getFn, x1, x2);
  const symRes = evalSymmetryPeriod(axisA, axisB);

  // 坐标变换辅助点
  const ptAxisA1 = mathToDesign(axisA, scale.yMin, scale);
  const ptAxisA2 = mathToDesign(axisA, scale.yMax, scale);
  const ptAxisB1 = mathToDesign(axisB, scale.yMin, scale);
  const ptAxisB2 = mathToDesign(axisB, scale.yMax, scale);

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 定义域区间阴影 (domain 模式) */}
      {mode === "domain" && (
        <g>
          {fnType === "reciprocal" ? (
            <>
              <IntervalShadow
                fn={getFn}
                scale={scale}
                x1={scale.xMin}
                x2={-0.05}
                fillColor={withAlpha(MATH_COLORS.functionTransformed, 0.15)}
              />
              <IntervalShadow
                fn={getFn}
                scale={scale}
                x1={0.05}
                x2={scale.xMax}
                fillColor={withAlpha(MATH_COLORS.functionTransformed, 0.15)}
              />
              <Asymptote
                type="vertical"
                value={0}
                scale={scale}
                label="x = 0 (无定义断点)"
                fontScale={fontScale}
                color={MATH_COLORS.degeneracy}
              />
            </>
          ) : (
            <IntervalShadow
              fn={getFn}
              scale={scale}
              x1={scale.xMin}
              x2={scale.xMax}
              fillColor={withAlpha(MATH_COLORS.functionTransformed, 0.12)}
            />
          )}
        </g>
      )}

      {/* 主函数曲线 */}
      <FunctionGraph
        fn={getFn}
        scale={scale}
        color={MATH_COLORS.function}
        strokeWidth={2.5}
      />

      {/* Mode 1: Domain & Range 模式组件 */}
      {mode === "domain" && Number.isFinite(fx0) && (
        <InteractivePoint
          cx={x0}
          cy={fx0}
          scale={scale}
          vp={vp}
          onDrag={handleDragX0}
          color={MATH_COLORS.paramPrimary}
          label={`P₀(${x0.toFixed(1)}, ${fx0.toFixed(1)})`}
          labelKey="P0"
          placedLabels={placedLabels}
          fontScale={fontScale}
        />
      )}

      {/* Mode 2: Parity & Monotonicity 模式组件 */}
      {mode === "parity" && (
        <g>
          {/* 奇偶对称对比点 P'(-x0, f(-x0)) */}
          {Number.isFinite(parityRes.fNegX) && (
            <g>
              <circle
                cx={scale.originX + -x0 * scale.scaleX}
                cy={scale.originY - parityRes.fNegX * scale.scaleY}
                r={6}
                fill={MATH_COLORS.functionTransformed}
                stroke={CANVAS_COLORS.white}
                strokeWidth={2}
              />
              <text
                x={scale.originX + -x0 * scale.scaleX + 10}
                y={scale.originY - parityRes.fNegX * scale.scaleY - 10}
                fill={MATH_COLORS.functionTransformed}
                fontSize={fontScale(12)}
                fontWeight="bold"
              >
                {`P'(${(-x0).toFixed(1)}, ${parityRes.fNegX.toFixed(1)})`}
              </text>
              <line
                x1={scale.originX + x0 * scale.scaleX}
                y1={scale.originY - parityRes.fx * scale.scaleY}
                x2={scale.originX + -x0 * scale.scaleX}
                y2={scale.originY - parityRes.fNegX * scale.scaleY}
                stroke={MATH_COLORS.labelText}
                strokeDasharray="4 4"
                strokeWidth={1}
                opacity={0.5}
              />
            </g>
          )}

          {/* 奇偶主采样点 P0 */}
          {Number.isFinite(fx0) && (
            <InteractivePoint
              cx={x0}
              cy={fx0}
              scale={scale}
              vp={vp}
              onDrag={handleDragX0}
              color={MATH_COLORS.paramPrimary}
              label={`P₀(${x0.toFixed(1)}, ${fx0.toFixed(1)})`}
              labelKey="P0"
              placedLabels={placedLabels}
              fontScale={fontScale}
            />
          )}

          {/* 单调性割线及控制点 P1, P2 */}
          {Number.isFinite(fx1) &&
            Number.isFinite(fx2) &&
            Math.abs(x1 - x2) > 1e-4 && (
              <SecantLine
                fn={getFn}
                scale={scale}
                x1={x1}
                x2={x2}
                color={MATH_COLORS.secantLine}
                strokeWidth={2}
              />
            )}

          {Number.isFinite(fx1) && (
            <InteractivePoint
              cx={x1}
              cy={fx1}
              scale={scale}
              vp={vp}
              onDrag={handleDragX1}
              color={MATH_COLORS.paramSecondary}
              label={`P₁(${x1.toFixed(1)}, ${fx1.toFixed(1)})`}
              labelKey="P1"
              placedLabels={placedLabels}
              fontScale={fontScale}
            />
          )}

          {Number.isFinite(fx2) && (
            <InteractivePoint
              cx={x2}
              cy={fx2}
              scale={scale}
              vp={vp}
              onDrag={handleDragX2}
              color={MATH_COLORS.paramTertiary}
              label={`P₂(${x2.toFixed(1)}, ${fx2.toFixed(1)})`}
              labelKey="P2"
              placedLabels={placedLabels}
              fontScale={fontScale}
            />
          )}

          {/* 割线斜率标注文本 */}
          {Number.isFinite(secantRes.slope) && (
            <text
              x={scale.originX + ((x1 + x2) / 2) * scale.scaleX}
              y={scale.originY - ((fx1 + fx2) / 2) * scale.scaleY - 16}
              fill={MATH_COLORS.secantLine}
              fontSize={fontScale(13)}
              fontWeight="bold"
              textAnchor="middle"
              className="bg-white"
            >
              {`割线斜率 k = ${secantRes.slope.toFixed(2)} (${secantRes.slope > 0 ? "增" : "减"})`}
            </text>
          )}
        </g>
      )}

      {/* Mode 3: Symmetry & Periodicity 模式组件 */}
      {mode === "symmetry" && (
        <g>
          {/* 第一对称轴 x = a */}
          <line
            x1={ptAxisA1.x}
            y1={ptAxisA1.y}
            x2={ptAxisA2.x}
            y2={ptAxisA2.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeDasharray="6 4"
            strokeWidth={2}
          />
          <text
            x={ptAxisA1.x + 8}
            y={scale.originY - 3.8 * scale.scaleY}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            {`x = a (${axisA.toFixed(1)})`}
          </text>

          {/* 第二对称轴 x = b */}
          <line
            x1={ptAxisB1.x}
            y1={ptAxisB1.y}
            x2={ptAxisB2.x}
            y2={ptAxisB2.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeDasharray="6 4"
            strokeWidth={2}
          />
          <text
            x={ptAxisB1.x + 8}
            y={scale.originY - 3.2 * scale.scaleY}
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            {`x = b (${axisB.toFixed(1)})`}
          </text>

          {/* 两轴间距与导出周期标注 */}
          {symRes.dist > 1e-4 && (
            <g>
              <line
                x1={ptAxisA1.x}
                y1={scale.originY - 2.8 * scale.scaleY}
                x2={ptAxisB1.x}
                y2={scale.originY - 2.8 * scale.scaleY}
                stroke={MATH_COLORS.labelText}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <text
                x={(ptAxisA1.x + ptAxisB1.x) / 2}
                y={scale.originY - 3.0 * scale.scaleY}
                fill={MATH_COLORS.labelText}
                fontSize={fontScale(12)}
                fontWeight="bold"
                textAnchor="middle"
              >
                {`轴距 |a - b| = ${symRes.dist.toFixed(1)} ⇒ 最小正周期 T = 2|a - b| = ${symRes.period.toFixed(1)}`}
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
}
