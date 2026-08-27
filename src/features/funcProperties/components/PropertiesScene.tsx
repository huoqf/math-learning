import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  Asymptote,
  IntervalShadow,
  SecantLine,
  SceneLabelGroup,
} from "@/components/Math";
import type { LabelItem } from "@/utils/labelOverlap";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  evalFunctionParity,
  evalAxisSymmetry,
  evalCenterSymmetry,
  evalPeriodicityModel,
  type PeriodModelType,
} from "@/math/function";

interface PropertiesSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  fnType: "cubic" | "quadratic" | "abs" | "reciprocal" | "sin";
  mode: "domain" | "parity" | "symmetry";
  subMode?:
    | "axis"
    | "center"
    | "period-dual-axis"
    | "period-dual-center"
    | "period-axis-center";
}

export function PropertiesScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  fnType,
  mode,
  subMode = "axis",
}: PropertiesSceneProps) {
  const x0 = params.x0 ?? 1.5;
  const x1 = params.x1 ?? -1.0;
  const x2 = params.x2 ?? 2.0;
  const axisA = params.axisA ?? 0.0;
  const axisB = params.axisB ?? 2.0;
  const centerX = params.centerX ?? 0.0;
  const centerY = params.centerY ?? 0.0;

  // 单轴与中心对称的动态适应母函数
  const getFn = React.useCallback(
    (x: number) => {
      if (mode === "symmetry") {
        if (subMode === "axis") {
          // 关于 x = axisA 对称的二次/绝对值/余弦模型
          if (fnType === "quadratic") return 0.5 * Math.pow(x - axisA, 2) - 1.5;
          if (fnType === "abs") return Math.abs(x - axisA) - 1.0;
          if (fnType === "sin") return Math.cos(x - axisA);
          return Math.pow(x - axisA, 2) - 2;
        }
        if (subMode === "center") {
          // 关于 C(centerX, centerY) 对称的三次/正弦/反比例模型
          if (fnType === "cubic")
            return 0.3 * Math.pow(x - centerX, 3) + centerY;
          if (fnType === "sin") return Math.sin(x - centerX) + centerY;
          if (fnType === "reciprocal") {
            const dx = x - centerX;
            return Math.abs(dx) > 1e-3 ? 1 / dx + centerY : NaN;
          }
          return 0.3 * Math.pow(x - centerX, 3) + centerY;
        }
      }

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
    [fnType, mode, subMode, axisA, centerX, centerY],
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

  // 周期模型计算
  const periodModelType: PeriodModelType =
    subMode === "period-dual-center"
      ? "dual-center"
      : subMode === "period-axis-center"
        ? "axis-center"
        : "dual-axis";
  const periodRes = evalPeriodicityModel(periodModelType, axisA, axisB);

  // 轴对称与中心对称计算
  const axisSymRes = evalAxisSymmetry(getFn, axisA, x0);
  const centerSymRes = evalCenterSymmetry(getFn, centerX, centerY, x0);
  const parityRes = evalFunctionParity(fnType === "sin" ? "cubic" : fnType, x0);

  // 点标数据构建 (设计坐标转化)
  const labelItems: LabelItem[] = [];

  if (mode === "domain" && Number.isFinite(fx0)) {
    const pt = mathToDesign(x0, fx0, scale);
    labelItems.push({
      key: "P0",
      x: pt.x,
      y: pt.y,
      text: "P₀",
      color: MATH_COLORS.paramPrimary,
      preferredPlacement: "top-right",
    });
  }

  if (mode === "parity") {
    if (Number.isFinite(fx0)) {
      const pt0 = mathToDesign(x0, fx0, scale);
      labelItems.push({
        key: "P0",
        x: pt0.x,
        y: pt0.y,
        text: "P₀",
        color: MATH_COLORS.paramPrimary,
        preferredPlacement: "top-right",
      });
      if (Number.isFinite(parityRes.fNegX)) {
        const ptSym = mathToDesign(-x0, parityRes.fNegX, scale);
        labelItems.push({
          key: "P_sym",
          x: ptSym.x,
          y: ptSym.y,
          text: "P'",
          color: MATH_COLORS.functionTransformed,
          preferredPlacement: "top-left",
        });
      }
    }
    if (Number.isFinite(fx1)) {
      const pt1 = mathToDesign(x1, fx1, scale);
      labelItems.push({
        key: "P1",
        x: pt1.x,
        y: pt1.y,
        text: "P₁",
        color: MATH_COLORS.paramSecondary,
        preferredPlacement: "bottom-left",
      });
    }
    if (Number.isFinite(fx2)) {
      const pt2 = mathToDesign(x2, fx2, scale);
      labelItems.push({
        key: "P2",
        x: pt2.x,
        y: pt2.y,
        text: "P₂",
        color: MATH_COLORS.paramTertiary,
        preferredPlacement: "top-right",
      });
    }
  }

  if (mode === "symmetry") {
    if (subMode === "axis") {
      if (Number.isFinite(axisSymRes.fx)) {
        const pt = mathToDesign(x0, axisSymRes.fx, scale);
        labelItems.push({
          key: "P0",
          x: pt.x,
          y: pt.y,
          text: "P",
          color: MATH_COLORS.paramSecondary,
          preferredPlacement: "top-right",
        });
      }
      if (Number.isFinite(axisSymRes.symFx)) {
        const ptSym = mathToDesign(axisSymRes.symX, axisSymRes.symFx, scale);
        labelItems.push({
          key: "P_sym",
          x: ptSym.x,
          y: ptSym.y,
          text: "P'",
          color: MATH_COLORS.paramTertiary,
          preferredPlacement: "top-left",
        });
      }
      const ptH = mathToDesign(axisA, axisSymRes.fx, scale);
      labelItems.push({
        key: "H",
        x: ptH.x,
        y: ptH.y,
        text: "H",
        color: MATH_COLORS.labelText,
        preferredPlacement: "bottom-right",
      });
    } else if (subMode === "center") {
      const ptC = mathToDesign(centerX, centerY, scale);
      labelItems.push({
        key: "Center",
        x: ptC.x,
        y: ptC.y,
        text: "C",
        color: MATH_COLORS.paramPrimary,
        preferredPlacement: "bottom-left",
      });
      if (Number.isFinite(centerSymRes.fx)) {
        const pt = mathToDesign(x0, centerSymRes.fx, scale);
        labelItems.push({
          key: "P0",
          x: pt.x,
          y: pt.y,
          text: "P",
          color: MATH_COLORS.paramSecondary,
          preferredPlacement: "top-right",
        });
      }
      if (Number.isFinite(centerSymRes.symFx)) {
        const ptSym = mathToDesign(
          centerSymRes.symX,
          centerSymRes.symFx,
          scale,
        );
        labelItems.push({
          key: "P_sym",
          x: ptSym.x,
          y: ptSym.y,
          text: "P'",
          color: MATH_COLORS.paramTertiary,
          preferredPlacement: "bottom-left",
        });
      }
    } else {
      // 周期模式特征点标
      if (periodModelType === "dual-center") {
        const ptC1 = mathToDesign(axisA, 0, scale);
        const ptC2 = mathToDesign(axisB, 0, scale);
        labelItems.push({
          key: "C1",
          x: ptC1.x,
          y: ptC1.y,
          text: "C₁",
          color: MATH_COLORS.paramPrimary,
          preferredPlacement: "bottom",
        });
        labelItems.push({
          key: "C2",
          x: ptC2.x,
          y: ptC2.y,
          text: "C₂",
          color: MATH_COLORS.paramSecondary,
          preferredPlacement: "bottom",
        });
      } else if (periodModelType === "axis-center") {
        const ptC = mathToDesign(axisB, 0, scale);
        labelItems.push({
          key: "C",
          x: ptC.x,
          y: ptC.y,
          text: "C",
          color: MATH_COLORS.paramSecondary,
          preferredPlacement: "bottom",
        });
      }
    }
  }

  // 坐标辅助计算
  const ptAxisA1 = mathToDesign(axisA, scale.yMin, scale);
  const ptAxisA2 = mathToDesign(axisA, scale.yMax, scale);
  const ptAxisB1 = mathToDesign(axisB, scale.yMin, scale);
  const ptAxisB2 = mathToDesign(axisB, scale.yMax, scale);

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* Mode 1: Domain 模式阴影与渐近线 */}
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

      {/* 主函数曲线（周期模式采用 waveFn，其余采用 getFn） */}
      {mode === "symmetry" && subMode.startsWith("period") ? (
        <FunctionGraph
          fn={periodRes.waveFn}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />
      ) : (
        <FunctionGraph
          fn={getFn}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />
      )}

      {/* Mode 1 拖拽控制点 */}
      {mode === "domain" && Number.isFinite(fx0) && (
        <InteractivePoint
          cx={x0}
          cy={fx0}
          scale={scale}
          vp={vp}
          onDrag={handleDragX0}
          color={MATH_COLORS.paramPrimary}
          fontScale={fontScale}
        />
      )}

      {/* Mode 2: Parity 奇偶与单调性 */}
      {mode === "parity" && (
        <g>
          {/* 对称连线与对称点 */}
          {Number.isFinite(fx0) && Number.isFinite(parityRes.fNegX) && (
            <g>
              <line
                x1={scale.originX + x0 * scale.scaleX}
                y1={scale.originY - fx0 * scale.scaleY}
                x2={scale.originX - x0 * scale.scaleX}
                y2={scale.originY - parityRes.fNegX * scale.scaleY}
                stroke={MATH_COLORS.labelText}
                strokeDasharray="4 4"
                strokeWidth={1.5}
                opacity={0.6}
              />
              <MathPoint
                cx={-x0}
                cy={parityRes.fNegX}
                scale={scale}
                variant="solid"
                color={MATH_COLORS.functionTransformed}
                fontScale={fontScale}
              />
            </g>
          )}

          {/* 割线与单调控制点 */}
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

          {Number.isFinite(fx0) && (
            <InteractivePoint
              cx={x0}
              cy={fx0}
              scale={scale}
              vp={vp}
              onDrag={handleDragX0}
              color={MATH_COLORS.paramPrimary}
              fontScale={fontScale}
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
              fontScale={fontScale}
            />
          )}
        </g>
      )}

      {/* Mode 3: Symmetry (单轴对称 / 一般中心对称 / 高考三大周期) */}
      {mode === "symmetry" && (
        <g>
          {/* SubMode: 单轴对称 */}
          {subMode === "axis" && (
            <g>
              <line
                x1={ptAxisA1.x}
                y1={ptAxisA1.y}
                x2={ptAxisA2.x}
                y2={ptAxisA2.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeDasharray="6 4"
                strokeWidth={2}
              />
              {/* 动点 P 与对称点 P' 连线与垂足直角标记 */}
              {Number.isFinite(axisSymRes.fx) && (
                <g>
                  {/* 中垂连接线 */}
                  <line
                    x1={scale.originX + x0 * scale.scaleX}
                    y1={scale.originY - axisSymRes.fx * scale.scaleY}
                    x2={scale.originX + axisSymRes.symX * scale.scaleX}
                    y2={scale.originY - axisSymRes.fx * scale.scaleY}
                    stroke={MATH_COLORS.labelText}
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  {/* 垂足 H 直角标尺 */}
                  {(() => {
                    const hPt = mathToDesign(axisA, axisSymRes.fx, scale);
                    const size = 9;
                    const dir = x0 > axisA ? 1 : -1;
                    return (
                      <path
                        d={`M ${hPt.x} ${hPt.y - size} L ${hPt.x + dir * size} ${hPt.y - size} L ${hPt.x + dir * size} ${hPt.y}`}
                        fill="none"
                        stroke={MATH_COLORS.labelText}
                        strokeWidth={1.2}
                      />
                    );
                  })()}
                  {/* 垂足点 H */}
                  <MathPoint
                    cx={axisA}
                    cy={axisSymRes.fx}
                    scale={scale}
                    variant="foot"
                    color={MATH_COLORS.labelText}
                    fontScale={fontScale}
                  />
                  {/* 对称点 P' */}
                  <MathPoint
                    cx={axisSymRes.symX}
                    cy={axisSymRes.symFx}
                    scale={scale}
                    variant="solid"
                    color={MATH_COLORS.paramTertiary}
                    fontScale={fontScale}
                  />
                  {/* 动点 P */}
                  <InteractivePoint
                    cx={x0}
                    cy={axisSymRes.fx}
                    scale={scale}
                    vp={vp}
                    onDrag={handleDragX0}
                    color={MATH_COLORS.paramSecondary}
                    fontScale={fontScale}
                  />
                </g>
              )}
            </g>
          )}

          {/* SubMode: 一般中心对称 */}
          {subMode === "center" && (
            <g>
              {/* 对称中心 C */}
              <MathPoint
                cx={centerX}
                cy={centerY}
                scale={scale}
                variant="focus"
                color={MATH_COLORS.paramPrimary}
                fontScale={fontScale}
              />
              {/* 连线与对称点 */}
              {Number.isFinite(centerSymRes.fx) && (
                <g>
                  <line
                    x1={scale.originX + x0 * scale.scaleX}
                    y1={scale.originY - centerSymRes.fx * scale.scaleY}
                    x2={scale.originX + centerSymRes.symX * scale.scaleX}
                    y2={scale.originY - centerSymRes.symFx * scale.scaleY}
                    stroke={MATH_COLORS.labelText}
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <MathPoint
                    cx={centerSymRes.symX}
                    cy={centerSymRes.symFx}
                    scale={scale}
                    variant="solid"
                    color={MATH_COLORS.paramTertiary}
                    fontScale={fontScale}
                  />
                  <InteractivePoint
                    cx={x0}
                    cy={centerSymRes.fx}
                    scale={scale}
                    vp={vp}
                    onDrag={handleDragX0}
                    color={MATH_COLORS.paramSecondary}
                    fontScale={fontScale}
                  />
                </g>
              )}
            </g>
          )}

          {/* SubMode: 高考三大周期导出模型 */}
          {subMode.startsWith("period") && (
            <g>
              {/* 特征一：对称轴 x = a 或 中心 C1(a, 0) */}
              {periodModelType === "dual-center" ? (
                <MathPoint
                  cx={axisA}
                  cy={0}
                  scale={scale}
                  variant="focus"
                  color={MATH_COLORS.paramPrimary}
                  fontScale={fontScale}
                />
              ) : (
                <line
                  x1={ptAxisA1.x}
                  y1={ptAxisA1.y}
                  x2={ptAxisA2.x}
                  y2={ptAxisA2.y}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeDasharray="6 4"
                  strokeWidth={2}
                />
              )}

              {/* 特征二：对称轴 x = b 或 中心 C2(b, 0) */}
              {periodModelType === "dual-axis" ? (
                <line
                  x1={ptAxisB1.x}
                  y1={ptAxisB1.y}
                  x2={ptAxisB2.x}
                  y2={ptAxisB2.y}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeDasharray="6 4"
                  strokeWidth={2}
                />
              ) : (
                <MathPoint
                  cx={axisB}
                  cy={0}
                  scale={scale}
                  variant="focus"
                  color={MATH_COLORS.paramSecondary}
                  fontScale={fontScale}
                />
              )}

              {/* 导出周期跨度指示线 */}
              {periodRes.valid && (
                <g>
                  {/* 特征间距指示线 */}
                  <line
                    x1={scale.originX + axisA * scale.scaleX}
                    y1={scale.originY - 2.8 * scale.scaleY}
                    x2={scale.originX + axisB * scale.scaleX}
                    y2={scale.originY - 2.8 * scale.scaleY}
                    stroke={MATH_COLORS.asymptote}
                    strokeWidth={1.5}
                  />
                  {/* 周期跨度阴影区间 [min(a,b), min(a,b) + T] */}
                  <rect
                    x={scale.originX + Math.min(axisA, axisB) * scale.scaleX}
                    y={scale.originY - scale.yMax * scale.scaleY}
                    width={periodRes.period * scale.scaleX}
                    height={(scale.yMax - scale.yMin) * scale.scaleY}
                    fill={withAlpha(MATH_COLORS.asymptote, 0.06)}
                  />
                </g>
              )}
            </g>
          )}
        </g>
      )}

      {/* 2D 统一学术点标图层（自动避让与防重叠） */}
      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
}
