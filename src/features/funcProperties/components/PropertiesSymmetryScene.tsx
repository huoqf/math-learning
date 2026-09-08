/**
 * 模式 3：对称性（Symmetry）
 * SubMode:
 *  - axis              ：单轴对称（关于 x = a）
 *  - center            ：一般中心对称（关于点 C(centerX, centerY)）
 *  - period-dual-axis / period-dual-center / period-axis-center：高考三大周期导出
 */
import {
  MathPoint,
  InteractivePoint,
  SceneLabelGroup,
} from "@/components/Math";
import type { LabelItem } from "@/utils/labelOverlap";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  evalAxisSymmetry,
  evalCenterSymmetry,
  type PeriodModelType,
} from "@/math/function";
import type {
  PropertiesCommonProps,
  PropertiesSubMode,
  PeriodModelRes,
} from "./types";

interface PropertiesSymmetrySceneProps extends PropertiesCommonProps {
  subMode: PropertiesSubMode;
  x0: number;
  axisA: number;
  axisB: number;
  centerX: number;
  centerY: number;
  periodModelType: PeriodModelType;
  periodRes: PeriodModelRes;
}

export function PropertiesSymmetryScene({
  scale,
  vp,
  onParamChange,
  fontScale,
  getFn,
  subMode,
  x0,
  axisA,
  axisB,
  centerX,
  centerY,
  periodModelType,
  periodRes,
}: PropertiesSymmetrySceneProps) {
  const axisSymRes = evalAxisSymmetry(getFn, axisA, x0);
  const centerSymRes = evalCenterSymmetry(getFn, centerX, centerY, x0);

  const handleDragX0 = (mathPt: { x: number; y: number }) => {
    onParamChange("x0", Math.round(mathPt.x * 10) / 10);
  };

  // 对称性模式点标
  const labelItems: LabelItem[] = [];

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
      const ptSym = mathToDesign(centerSymRes.symX, centerSymRes.symFx, scale);
      labelItems.push({
        key: "P_sym",
        x: ptSym.x,
        y: ptSym.y,
        text: "P'",
        color: MATH_COLORS.paramTertiary,
        preferredPlacement: "bottom-left",
      });
    }
  } else if (periodModelType === "dual-center") {
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

  // 坐标辅助计算
  const ptAxisA1 = mathToDesign(axisA, scale.yMin, scale);
  const ptAxisA2 = mathToDesign(axisA, scale.yMax, scale);
  const ptAxisB1 = mathToDesign(axisB, scale.yMin, scale);
  const ptAxisB2 = mathToDesign(axisB, scale.yMax, scale);

  return (
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

      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
}
