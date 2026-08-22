/**
 * src/features/trigLines/components/TrigLinesInequalityScene.tsx
 * 模式「inequality」：单位圆解三角不等式。零物理公式、零硬编码颜色字号，完全遵循铁律。
 * 仅由 TrigLinesScene 在 studyMode === "inequality" 时渲染。
 */

import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { InteractivePoint, MathPoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculateTrigLines, solveTrigInequality } from "../math/trigLines";
import type { TrigInequalityKind } from "../math/trigLines";

interface TrigLinesInequalitySceneProps {
  params: {
    alphaDeg: number;
    ineqThreshold: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onPDrag: (rawMath: { x: number; y: number }) => void;
  fontScale: (v: number) => number;
  centerPt: { x: number; y: number };
  aDesign: { x: number; y: number };
  unitRadiusPx: number;
  ineqKind: TrigInequalityKind;
}

export const TrigLinesInequalityScene: React.FC<
  TrigLinesInequalitySceneProps
> = ({
  params,
  scale,
  fontScale,
  centerPt,
  aDesign,
  unitRadiusPx,
  vp,
  onPDrag,
  ineqKind,
}) => {
  const { alphaDeg, ineqThreshold } = params;

  // 基础三角计算 (动角 alpha)
  const trig = useMemo(() => calculateTrigLines(alphaDeg), [alphaDeg]);
  const { pointP, sinVal, cosVal } = trig;
  const pDesign = mathToDesign(pointP.x, pointP.y, scale);

  // 三角不等式求解与圆弧高亮
  const ineqData = useMemo(() => {
    return solveTrigInequality(ineqKind, ineqThreshold, alphaDeg);
  }, [ineqKind, ineqThreshold, alphaDeg]);

  return (
    <g>
      {/* 解集弧区扇形阴影填充 */}
      {ineqData.intervals.map((interval, idx) => {
        const isLarge = interval.endRad - interval.startRad > Math.PI ? 1 : 0;
        const startX = centerPt.x + unitRadiusPx * Math.cos(interval.startRad);
        const startY = centerPt.y - unitRadiusPx * Math.sin(interval.startRad);
        const endX = centerPt.x + unitRadiusPx * Math.cos(interval.endRad);
        const endY = centerPt.y - unitRadiusPx * Math.sin(interval.endRad);

        const arcPath = `M ${centerPt.x} ${centerPt.y} L ${startX} ${startY} A ${unitRadiusPx} ${unitRadiusPx} 0 ${isLarge} 0 ${endX} ${endY} Z`;
        return (
          <g key={idx}>
            <path
              d={arcPath}
              fill={withAlpha(MATH_COLORS.paramTertiary, 0.2)}
              stroke="none"
            />
            {/* 弧线边框高亮 */}
            <path
              d={`M ${startX} ${startY} A ${unitRadiusPx} ${unitRadiusPx} 0 ${isLarge} 0 ${endX} ${endY}`}
              fill="none"
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={4.5}
            />
          </g>
        );
      })}

      {/* 辅助基准扫描线 (根据不等式类型绘制) */}
      {ineqKind.startsWith("sin") && (
        <line
          x1={mathToDesign(-1.4, ineqThreshold, scale).x}
          y1={mathToDesign(-1.4, ineqThreshold, scale).y}
          x2={mathToDesign(1.4, ineqThreshold, scale).x}
          y2={mathToDesign(1.4, ineqThreshold, scale).y}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={2}
          strokeDasharray="5 4"
        />
      )}
      {ineqKind.startsWith("cos") && (
        <line
          x1={mathToDesign(ineqThreshold, -1.4, scale).x}
          y1={mathToDesign(ineqThreshold, -1.4, scale).y}
          x2={mathToDesign(ineqThreshold, 1.4, scale).x}
          y2={mathToDesign(ineqThreshold, 1.4, scale).y}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={2}
          strokeDasharray="5 4"
        />
      )}
      {ineqKind.startsWith("tan") && (
        <g>
          <line
            x1={aDesign.x}
            y1={mathToDesign(1, -1.5, scale).y}
            x2={aDesign.x}
            y2={mathToDesign(1, 1.5, scale).y}
            stroke={MATH_COLORS.grid}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <line
            x1={centerPt.x}
            y1={centerPt.y}
            x2={mathToDesign(1, ineqThreshold, scale).x}
            y2={mathToDesign(1, ineqThreshold, scale).y}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={2}
            strokeDasharray="4 3"
          />
        </g>
      )}

      {/* 边界临界交点 (空心圈，严格数学去心/开区间表示) */}
      {ineqData.boundaryPoints.map((pt, idx) => {
        const des = mathToDesign(pt.x, pt.y, scale);
        return (
          <MathPoint
            key={idx}
            x={des.x}
            y={des.y}
            variant="hollow"
            color={MATH_COLORS.paramTertiary}
          />
        );
      })}

      {/* 终边 OP */}
      <line
        x1={centerPt.x}
        y1={centerPt.y}
        x2={pDesign.x}
        y2={pDesign.y}
        stroke={
          ineqData.isSatisfied ? MATH_COLORS.paramTertiary : MATH_COLORS.axis
        }
        strokeWidth={2.5}
      />

      {/* 动点 P */}
      <InteractivePoint
        cx={pointP.x}
        cy={pointP.y}
        scale={scale}
        vp={vp}
        onDrag={onPDrag}
        color={
          ineqData.isSatisfied ? MATH_COLORS.paramTertiary : MATH_COLORS.axis
        }
        r={7}
        fontScale={fontScale}
      />
      <g
        transform={`translate(${pDesign.x + (cosVal >= 0 ? 10 : -140)}, ${pDesign.y + (sinVal >= 0 ? -24 : 14)})`}
      >
        <rect
          x={0}
          y={0}
          width={130}
          height={20}
          rx={4}
          fill={withAlpha(MATH_COLORS.white, 0.92)}
          stroke={withAlpha(
            ineqData.isSatisfied ? MATH_COLORS.paramTertiary : MATH_COLORS.axis,
            0.4,
          )}
          strokeWidth={1}
        />
        <text
          x={65}
          y={14}
          fill={
            ineqData.isSatisfied ? MATH_COLORS.paramTertiary : MATH_COLORS.axis
          }
          fontSize={fontScale(10)}
          fontWeight="bold"
          textAnchor="middle"
          className="select-none pointer-events-none"
        >
          α={alphaDeg}° {ineqData.isSatisfied ? "(在解集内 ✓)" : "(不在解集 ✗)"}
        </text>
      </g>
    </g>
  );
};
