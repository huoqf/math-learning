/**
 * src/features/trigLines/components/TrigLinesDefScene.tsx
 * 模式「lines」：三角函数线定义演化。零物理公式、零硬编码颜色字号，完全遵循铁律。
 * 仅由 TrigLinesScene 在 studyMode === "lines" 时渲染。
 */

import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { InteractivePoint, MathPoint, VectorArrow } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculateTrigLines } from "../math/trigLines";

interface TrigLinesDefSceneProps {
  params: {
    alphaDeg: number;
    showSine: number;
    showCosine: number;
    showTangent: number;
    showArc: number;
    showAuxTriangle: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onPDrag: (rawMath: { x: number; y: number }) => void;
  fontScale: (v: number) => number;
  centerPt: { x: number; y: number };
  aDesign: { x: number; y: number };
}

export const TrigLinesDefScene: React.FC<TrigLinesDefSceneProps> = ({
  params,
  scale,
  fontScale,
  centerPt,
  aDesign,
  vp,
  onPDrag,
}) => {
  const {
    alphaDeg,
    showSine,
    showCosine,
    showTangent,
    showArc,
    showAuxTriangle,
  } = params;

  // 1. 基础三角计算 (动角 alpha)
  const trig = useMemo(() => calculateTrigLines(alphaDeg), [alphaDeg]);
  const {
    pointP,
    pointM,
    pointT,
    isTanDefined,
    alphaRad,
    sinVal,
    cosVal,
    tanVal,
  } = trig;

  const pDesign = mathToDesign(pointP.x, pointP.y, scale);
  const mDesign = mathToDesign(pointM.x, pointM.y, scale);
  const tDesign = pointT ? mathToDesign(pointT.x, pointT.y, scale) : null;

  // 生成动角弧阿基米德螺线 path、方向箭头与智能标注位置
  const arcData = useMemo(() => {
    const baseRadius = Math.min(scale.scaleX * 0.28, 36);
    const radiusStepPerCircle = 9;

    if (Math.abs(alphaDeg) < 0.1) {
      return {
        path: "",
        arrowPoints: null,
        labelPos: {
          x: centerPt.x + baseRadius + 14,
          y: centerPt.y - 12,
        },
      };
    }

    const isPositive = alphaDeg > 0;
    const totalAngleAbs = Math.abs(alphaDeg);
    const steps = Math.max(16, Math.ceil(totalAngleAbs / 4));

    const pathPoints: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const currentRad = alphaRad * progress;
      const currentDegAbs = totalAngleAbs * progress;
      const r = baseRadius + (currentDegAbs / 360) * radiusStepPerCircle;
      const x = centerPt.x + r * Math.cos(currentRad);
      const y = centerPt.y - r * Math.sin(currentRad);
      pathPoints.push({ x, y });
    }

    const path = pathPoints.reduce((acc, pt, idx) => {
      return idx === 0
        ? `M ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`
        : `${acc} L ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
    }, "");

    const lastPt = pathPoints[pathPoints.length - 1];
    const prevPt = pathPoints[pathPoints.length - 2];
    const dx = lastPt.x - prevPt.x;
    const dy = lastPt.y - prevPt.y;
    const tangentRad = Math.atan2(dy, dx);

    const arrowLength = 7;
    const arrowWidth = 5;
    const backX = lastPt.x - arrowLength * Math.cos(tangentRad);
    const backY = lastPt.y - arrowLength * Math.sin(tangentRad);
    const perpX = -Math.sin(tangentRad) * (arrowWidth / 2);
    const perpY = Math.cos(tangentRad) * (arrowWidth / 2);

    const arrowPoints = [
      `${lastPt.x.toFixed(2)},${lastPt.y.toFixed(2)}`,
      `${(backX + perpX).toFixed(2)},${(backY + perpY).toFixed(2)}`,
      `${(backX - perpX).toFixed(2)},${(backY - perpY).toFixed(2)}`,
    ].join(" ");

    let labelRad: number;
    if (totalAngleAbs <= 360) {
      labelRad = alphaRad / 2;
    } else {
      labelRad = alphaRad - (isPositive ? Math.PI : -Math.PI);
    }

    const labelDegAbs = (Math.abs(labelRad) * 180) / Math.PI;
    const labelR = baseRadius + (labelDegAbs / 360) * radiusStepPerCircle + 14;

    const labelPos = {
      x: centerPt.x + labelR * Math.cos(labelRad),
      y: centerPt.y - labelR * Math.sin(labelRad),
    };

    return { path, arrowPoints, labelPos };
  }, [centerPt, scale.scaleX, alphaRad, alphaDeg]);

  return (
    <g>
      {/* 动角弧度弧线与标注 */}
      {showArc === 1 && (
        <g>
          {arcData.path && (
            <path
              d={arcData.path}
              fill="none"
              stroke={MATH_COLORS.function}
              strokeWidth={2}
            />
          )}
          {arcData.arrowPoints && (
            <polygon points={arcData.arrowPoints} fill={MATH_COLORS.function} />
          )}
          <g
            transform={`translate(${arcData.labelPos.x.toFixed(2)}, ${arcData.labelPos.y.toFixed(2)})`}
          >
            <rect
              x={-28}
              y={-10}
              width={56}
              height={20}
              rx={4}
              fill={withAlpha(MATH_COLORS.white, 0.9)}
              stroke={withAlpha(MATH_COLORS.function, 0.4)}
              strokeWidth={1}
            />
            <text
              x={0}
              y={4}
              fill={MATH_COLORS.function}
              fontSize={fontScale(11)}
              fontWeight="bold"
              textAnchor="middle"
              className="select-none pointer-events-none"
            >
              α={alphaDeg}°
            </text>
          </g>
        </g>
      )}

      {/* 正切切线 x = 1 (参考虚线) */}
      <line
        x1={aDesign.x}
        y1={mathToDesign(1, -1.5, scale).y}
        x2={aDesign.x}
        y2={mathToDesign(1, 1.5, scale).y}
        stroke={MATH_COLORS.grid}
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />

      {/* 终边延长线 (连接到 T 点) */}
      {tDesign && showTangent === 1 && (
        <line
          x1={centerPt.x}
          y1={centerPt.y}
          x2={tDesign.x}
          y2={tDesign.y}
          stroke={withAlpha(MATH_COLORS.paramTertiary, 0.6)}
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
      )}

      {/* 终边 OP 线 */}
      <line
        x1={centerPt.x}
        y1={centerPt.y}
        x2={pDesign.x}
        y2={pDesign.y}
        stroke={MATH_COLORS.function}
        strokeWidth={2.5}
      />

      {/* 辅助投影虚线 PM */}
      {showAuxTriangle === 1 && (
        <line
          x1={pDesign.x}
          y1={pDesign.y}
          x2={mDesign.x}
          y2={mDesign.y}
          stroke={MATH_COLORS.axis}
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.5}
        />
      )}

      {/* 1. 余弦线 OM (暖橙) */}
      {showCosine === 1 && Math.abs(cosVal) > 1e-4 && (
        <VectorArrow
          from={[0, 0]}
          to={[pointM.x, 0]}
          scale={scale}
          color={MATH_COLORS.paramSecondary}
          strokeWidth={3.5}
          headLength={9}
          headWidth={6}
          fontScale={fontScale}
          label="OM"
          labelOffset={[0, sinVal >= 0 ? 14 : -14]}
          labelSize={10}
        />
      )}

      {/* 2. 正弦线 MP (鲜红) */}
      {showSine === 1 && Math.abs(sinVal) > 1e-4 && (
        <VectorArrow
          from={[pointM.x, 0]}
          to={[pointM.x, pointP.y]}
          scale={scale}
          color={MATH_COLORS.paramPrimary}
          strokeWidth={3.5}
          headLength={9}
          headWidth={6}
          fontScale={fontScale}
          label="MP"
          labelOffset={[cosVal >= 0 ? 16 : -16, 0]}
          labelSize={10}
        />
      )}

      {/* 3. 正切线 AT (翠绿) */}
      {showTangent === 1 &&
        isTanDefined &&
        pointT &&
        Math.abs(tanVal ?? 0) > 1e-4 &&
        Math.abs(tanVal ?? 0) < 3.5 && (
          <VectorArrow
            from={[1, 0]}
            to={[1, pointT.y]}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={3.5}
            headLength={9}
            headWidth={6}
            fontScale={fontScale}
            label="AT"
            labelOffset={[18, 0]}
            labelSize={10}
          />
        )}

      {/* 当正切线不存在 (90°, 270°) 时的平行提示 */}
      {showTangent === 1 && !isTanDefined && (
        <g>
          <line
            x1={aDesign.x}
            y1={mathToDesign(1, -1.4, scale).y}
            x2={aDesign.x}
            y2={mathToDesign(1, 1.4, scale).y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            strokeDasharray="6 4"
          />
          <rect
            x={aDesign.x + 8}
            y={centerPt.y - 14}
            width={136}
            height={28}
            rx={4}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.9)}
          />
          <text
            x={aDesign.x + 15}
            y={centerPt.y + 4}
            fill={MATH_COLORS.white}
            fontSize={fontScale(10)}
            fontWeight="bold"
            className="select-none pointer-events-none"
          >
            正切线不存在 (平行)
          </text>
        </g>
      )}

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
      {Math.abs(cosVal) > 1e-4 && (
        <text
          x={mDesign.x}
          y={mDesign.y + (sinVal >= 0 ? 16 : -8)}
          fill={MATH_COLORS.paramSecondary}
          fontSize={fontScale(11)}
          fontWeight="bold"
          textAnchor="middle"
          className="select-none pointer-events-none"
        >
          M
        </text>
      )}
      {/* 垂足点 M 与基准点 A(1,0) */}
      <MathPoint
        x={aDesign.x}
        y={aDesign.y}
        color={MATH_COLORS.paramTertiary}
        label="A(1,0)"
        labelPosition="bottom-right"
        fontScale={fontScale}
      />

      {tDesign &&
        isTanDefined &&
        Math.abs(tanVal ?? 0) > 1e-4 &&
        Math.abs(tanVal ?? 0) < 3.5 && (
          <MathPoint
            x={tDesign.x}
            y={tDesign.y}
            color={MATH_COLORS.paramTertiary}
            label="T(1, tanα)"
            labelPosition={(tanVal ?? 0) >= 0 ? "top-right" : "bottom-right"}
            fontScale={fontScale}
          />
        )}

      {/* 主控动点 P */}
      <InteractivePoint
        cx={pointP.x}
        cy={pointP.y}
        scale={scale}
        vp={vp}
        onDrag={onPDrag}
        color={MATH_COLORS.paramPrimary}
        r={6.5}
        disabled={false}
        fontScale={fontScale}
      />
      <text
        x={pDesign.x + (cosVal >= 0 ? 10 : -10)}
        y={pDesign.y + (sinVal >= 0 ? -10 : 16)}
        fill={MATH_COLORS.paramPrimary}
        fontSize={fontScale(11)}
        fontWeight="bold"
        textAnchor={cosVal >= 0 ? "start" : "end"}
        className="select-none pointer-events-none"
      >
        P({cosVal.toFixed(2)}, {sinVal.toFixed(2)})
      </text>
    </g>
  );
};
