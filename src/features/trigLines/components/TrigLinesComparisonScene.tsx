/**
 * src/features/trigLines/components/TrigLinesComparisonScene.tsx
 * 模式「comparison」：面积放缩与不等式。零物理公式、零硬编码颜色字号，完全遵循铁律。
 * 仅由 TrigLinesScene 在 studyMode === "comparison" 时渲染。
 */

import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { InteractivePoint, MathPoint, VectorArrow } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculateComparisonAreas } from "../math/trigLines";

interface TrigLinesComparisonSceneProps {
  params: {
    compAlphaDeg: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale: (v: number) => number;
  centerPt: { x: number; y: number };
  aDesign: { x: number; y: number };
  unitRadiusPx: number;
}

export const TrigLinesComparisonScene: React.FC<
  TrigLinesComparisonSceneProps
> = ({
  params,
  scale,
  fontScale,
  centerPt,
  aDesign,
  unitRadiusPx,
  vp,
  onParamChange,
}) => {
  const { compAlphaDeg } = params;

  // 面积放缩模式下的计算与路径
  const compData = useMemo(() => {
    const areas = calculateComparisonAreas(compAlphaDeg);
    const xRad = areas.xRad;
    const pMath = { x: Math.cos(xRad), y: Math.sin(xRad) };
    const mMath = { x: Math.cos(xRad), y: 0 };
    const tMath = { x: 1, y: Math.tan(xRad) };

    const pDes = mathToDesign(pMath.x, pMath.y, scale);
    const mDes = mathToDesign(mMath.x, mMath.y, scale);
    const tDes = mathToDesign(tMath.x, tMath.y, scale);

    // 扇形 OAP 路径
    const sectorPath = `M ${centerPt.x} ${centerPt.y} L ${aDesign.x} ${aDesign.y} A ${unitRadiusPx} ${unitRadiusPx} 0 0 0 ${pDes.x} ${pDes.y} Z`;

    // 锐角弧路径与标注位置
    const arcR = Math.min(scale.scaleX * 0.32, 42);
    const arcEndX = centerPt.x + arcR * Math.cos(xRad);
    const arcEndY = centerPt.y - arcR * Math.sin(xRad);
    const angleArcPath = `M ${centerPt.x + arcR} ${centerPt.y} A ${arcR} ${arcR} 0 0 0 ${arcEndX} ${arcEndY}`;
    const angleLabelPos = {
      x: centerPt.x + (arcR + 12) * Math.cos(xRad / 2),
      y: centerPt.y - (arcR + 12) * Math.sin(xRad / 2),
    };

    return {
      areas,
      pMath,
      pDes,
      mDes,
      tDes,
      sectorPath,
      angleArcPath,
      angleLabelPos,
    };
  }, [compAlphaDeg, scale, centerPt, aDesign, unitRadiusPx]);

  const handleCompPDrag = (rawMath: { x: number; y: number }) => {
    const rad = Math.atan2(
      Math.max(0.01, rawMath.y),
      Math.max(0.01, rawMath.x),
    );
    const deg = Math.max(5, Math.min(85, Math.round((rad * 180) / Math.PI)));
    onParamChange("compAlphaDeg", deg);
  };

  return (
    <g>
      {/* 1. 大直角三角形 OAT 填充与边界 */}
      <polygon
        points={`${centerPt.x},${centerPt.y} ${aDesign.x},${aDesign.y} ${compData.tDes.x},${compData.tDes.y}`}
        fill={withAlpha(MATH_COLORS.paramTertiary, 0.12)}
        stroke={MATH_COLORS.paramTertiary}
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />

      {/* 2. 扇形 OAP 填充 */}
      <path
        d={compData.sectorPath}
        fill={withAlpha(MATH_COLORS.function, 0.18)}
        stroke={MATH_COLORS.function}
        strokeWidth={2}
      />

      {/* 3. 小直角三角形 OMP 填充 */}
      <polygon
        points={`${centerPt.x},${centerPt.y} ${compData.mDes.x},${compData.mDes.y} ${compData.pDes.x},${compData.pDes.y}`}
        fill={withAlpha(MATH_COLORS.paramPrimary, 0.22)}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={1.5}
      />

      {/* 锐角 x 弧线与文本 */}
      <path
        d={compData.angleArcPath}
        fill="none"
        stroke={MATH_COLORS.function}
        strokeWidth={1.5}
      />
      <text
        x={compData.angleLabelPos.x}
        y={compData.angleLabelPos.y}
        fill={MATH_COLORS.function}
        fontSize={fontScale(11)}
        fontWeight="bold"
        textAnchor="middle"
        className="select-none pointer-events-none"
      >
        x
      </text>

      {/* 切线 x = 1 */}
      <line
        x1={aDesign.x}
        y1={mathToDesign(1, 0, scale).y}
        x2={aDesign.x}
        y2={compData.tDes.y}
        stroke={MATH_COLORS.paramTertiary}
        strokeWidth={3}
      />

      {/* 终边射线 OT */}
      <line
        x1={centerPt.x}
        y1={centerPt.y}
        x2={compData.tDes.x}
        y2={compData.tDes.y}
        stroke={MATH_COLORS.function}
        strokeWidth={2}
      />

      {/* 辅助投影虚线 PM */}
      <line
        x1={compData.pDes.x}
        y1={compData.pDes.y}
        x2={compData.mDes.x}
        y2={compData.mDes.y}
        stroke={MATH_COLORS.axis}
        strokeWidth={1}
        strokeDasharray="3 3"
      />

      {/* 正弦线 MP */}
      <VectorArrow
        from={[compData.pMath.x, 0]}
        to={[compData.pMath.x, compData.pMath.y]}
        scale={scale}
        color={MATH_COLORS.paramPrimary}
        strokeWidth={3}
        fontScale={fontScale}
        label="MP(sin x)"
        labelOffset={[-24, 0]}
        labelSize={10}
      />

      {/* 正切线 AT */}
      <VectorArrow
        from={[1, 0]}
        to={[1, compData.areas.tanX]}
        scale={scale}
        color={MATH_COLORS.paramTertiary}
        strokeWidth={3}
        fontScale={fontScale}
        label="AT(tan x)"
        labelOffset={[24, 0]}
        labelSize={10}
      />

      {/* 原点与切点标注 */}
      <text
        x={centerPt.x - 14}
        y={centerPt.y + 16}
        fill={MATH_COLORS.labelText}
        fontSize={fontScale(11)}
        fontWeight="600"
        className="select-none pointer-events-none"
      >
        O
      </text>
      <text
        x={compData.mDes.x}
        y={centerPt.y + 16}
        fill={MATH_COLORS.paramSecondary}
        fontSize={fontScale(11)}
        fontWeight="bold"
        textAnchor="middle"
        className="select-none pointer-events-none"
      >
        M
      </text>
      <MathPoint
        x={aDesign.x}
        y={aDesign.y}
        color={MATH_COLORS.paramTertiary}
        label="A(1,0)"
        labelPosition="bottom-right"
        fontScale={fontScale}
      />

      {/* 交点 T(1, tan x) */}
      <MathPoint
        x={compData.tDes.x}
        y={compData.tDes.y}
        color={MATH_COLORS.paramTertiary}
      />
      <g
        transform={`translate(${compData.tDes.x + 10}, ${compData.tDes.y - 12})`}
      >
        <rect
          x={0}
          y={0}
          width={76}
          height={20}
          rx={4}
          fill={withAlpha(MATH_COLORS.white, 0.9)}
          stroke={withAlpha(MATH_COLORS.paramTertiary, 0.4)}
          strokeWidth={1}
        />
        <text
          x={38}
          y={14}
          fill={MATH_COLORS.paramTertiary}
          fontSize={fontScale(10)}
          fontWeight="bold"
          textAnchor="middle"
          className="select-none pointer-events-none"
        >
          T(1, tan x)
        </text>
      </g>

      {/* 动点 P 拖拽 */}
      <InteractivePoint
        cx={compData.pMath.x}
        cy={compData.pMath.y}
        scale={scale}
        vp={vp}
        onDrag={handleCompPDrag}
        color={MATH_COLORS.function}
        r={6.5}
        fontScale={fontScale}
      />
      <g
        transform={`translate(${compData.pDes.x - 78}, ${compData.pDes.y - 24})`}
      >
        <rect
          x={0}
          y={0}
          width={72}
          height={20}
          rx={4}
          fill={withAlpha(MATH_COLORS.white, 0.92)}
          stroke={withAlpha(MATH_COLORS.function, 0.4)}
          strokeWidth={1}
        />
        <text
          x={36}
          y={14}
          fill={MATH_COLORS.function}
          fontSize={fontScale(10)}
          fontWeight="bold"
          textAnchor="middle"
          className="select-none pointer-events-none"
        >
          P(x={compAlphaDeg}°)
        </text>
      </g>

      {/* 面积比较三阶柱状图挂件（放置于第二象限开阔安全区，彻底避开坐标轴与单位圆） */}
      <g
        transform={`translate(${centerPt.x - unitRadiusPx - 100}, ${centerPt.y - unitRadiusPx + 15})`}
      >
        <rect
          x={0}
          y={0}
          width={188}
          height={108}
          rx={6}
          fill={withAlpha(MATH_COLORS.white, 0.96)}
          stroke={withAlpha(MATH_COLORS.axis, 0.3)}
          strokeWidth={1}
        />
        <text
          x={10}
          y={18}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(10)}
          fontWeight="bold"
        >
          面积三阶包含关系 S₁ &lt; S₂ &lt; S₃
        </text>

        {/* S1: △OMP */}
        <text
          x={10}
          y={38}
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(9)}
        >
          S₁ (△OMP) = {compData.areas.triangleOMP.toFixed(3)}
        </text>
        <rect
          x={116}
          y={29}
          width={Math.max(4, Math.min(60, compData.areas.triangleOMP * 80))}
          height={9}
          rx={2}
          fill={MATH_COLORS.paramPrimary}
        />

        {/* S2: 扇形 OAP */}
        <text x={10} y={58} fill={MATH_COLORS.function} fontSize={fontScale(9)}>
          S₂ (扇形) = {compData.areas.sectorOAP.toFixed(3)}
        </text>
        <rect
          x={116}
          y={49}
          width={Math.max(4, Math.min(60, compData.areas.sectorOAP * 80))}
          height={9}
          rx={2}
          fill={MATH_COLORS.function}
        />

        {/* S3: △OAT */}
        <text
          x={10}
          y={78}
          fill={MATH_COLORS.paramTertiary}
          fontSize={fontScale(9)}
        >
          S₃ (△OAT) = {compData.areas.triangleOAT.toFixed(3)}
        </text>
        <rect
          x={116}
          y={69}
          width={Math.max(4, Math.min(60, compData.areas.triangleOAT * 80))}
          height={9}
          rx={2}
          fill={MATH_COLORS.paramTertiary}
        />

        <text
          x={10}
          y={98}
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(9.5)}
          fontWeight="bold"
        >
          ⇒ sin x &lt; x &lt; tan x
        </text>
      </g>
    </g>
  );
};
