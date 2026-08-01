/**
 * src/features/trigLines/components/TrigLinesScene.tsx
 * 纯 SVG 渲染：零物理公式、零硬编码颜色字号，完全遵循铁律
 */

import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  InteractivePoint,
  VectorArrow,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculateTrigLines, pointToAngleDeg } from "../math/trigLines";

interface TrigLinesSceneProps {
  params: {
    alphaDeg: number;
    showSine?: number;
    showCosine?: number;
    showTangent?: number;
    showArc?: number;
    showAuxTriangle?: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode?: "lines" | "comparison" | "quadrant";
}

export const TrigLinesScene: React.FC<TrigLinesSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "lines",
}) => {
  const { alphaDeg } = params;
  const showSine = params.showSine ?? 1;
  const showCosine = params.showCosine ?? 1;
  const showTangent = params.showTangent ?? 1;
  const showArc = params.showArc ?? 1;
  const showAuxTriangle = params.showAuxTriangle ?? 1;

  // 数学计算
  const trig = useMemo(() => calculateTrigLines(alphaDeg), [alphaDeg]);
  const {
    pointP,
    pointM,
    pointA,
    pointT,
    isTanDefined,
    alphaRad,
    normalizeDeg,
    sinVal,
    cosVal,
    tanVal,
  } = trig;

  // 坐标转换
  const centerPt = mathToDesign(0, 0, scale);
  const unitRadiusPx = scale.scaleX; // 半径 r = 1 的像素数

  const pDesign = mathToDesign(pointP.x, pointP.y, scale);
  const mDesign = mathToDesign(pointM.x, pointM.y, scale);
  const aDesign = mathToDesign(pointA.x, pointA.y, scale);
  const tDesign = pointT ? mathToDesign(pointT.x, pointT.y, scale) : null;

  // 动点拖拽回调：解算出角度 alphaDeg
  const handlePDrag = (rawMath: { x: number; y: number }) => {
    const newDeg = pointToAngleDeg(rawMath.x, rawMath.y, alphaDeg);
    onParamChange("alphaDeg", newDeg);
  };

  // 生成动角弧阿基米德螺线 path、方向箭头与智能标注位置
  const arcData = useMemo(() => {
    const baseRadius = Math.min(scale.scaleX * 0.28, 36);
    const radiusStepPerCircle = 9; // 每 360 度螺线半径递增像素

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

      // 半径随旋转圈数递增 (阿基米德螺线)
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

    // 计算末端切线方向与箭头 (3顶点)
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

    // 智能文本位置定位
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

    return {
      path,
      arrowPoints,
      labelPos,
    };
  }, [centerPt, scale.scaleX, alphaRad, alphaDeg]);

  // 第一象限扇形/比较三角形面积路径
  const compSectorPath = useMemo(() => {
    if (studyMode !== "comparison") return null;
    const endX = centerPt.x + unitRadiusPx * Math.cos(alphaRad);
    const endY = centerPt.y - unitRadiusPx * Math.sin(alphaRad);
    const isLarge = normalizeDeg > 180 ? 1 : 0;
    return `M ${centerPt.x} ${centerPt.y} L ${aDesign.x} ${aDesign.y} A ${unitRadiusPx} ${unitRadiusPx} 0 ${isLarge} 0 ${endX} ${endY} Z`;
  }, [studyMode, centerPt, unitRadiusPx, alphaRad, normalizeDeg, aDesign]);

  return (
    <g>
      {/* 坐标轴与背景网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 单位圆 x^2 + y^2 = 1 */}
      <circle
        cx={centerPt.x}
        cy={centerPt.y}
        r={unitRadiusPx}
        fill="none"
        stroke={MATH_COLORS.function}
        strokeWidth={2}
        opacity={0.85}
      />

      {/* 比较模式下的逼近面积展示 */}
      {studyMode === "comparison" && compSectorPath && (
        <g>
          {/* 扇形 OAP 填充 */}
          <path
            d={compSectorPath}
            fill={withAlpha(MATH_COLORS.function, 0.12)}
            stroke="none"
          />
          {/* 大三角形 OAT 阴影 */}
          {tDesign && (
            <polygon
              points={`${centerPt.x},${centerPt.y} ${aDesign.x},${aDesign.y} ${tDesign.x},${tDesign.y}`}
              fill={withAlpha(MATH_COLORS.paramTertiary, 0.08)}
              stroke={withAlpha(MATH_COLORS.paramTertiary, 0.4)}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}
        </g>
      )}

      {/* 象限模式下的四象限符号说明浮层 */}
      {studyMode === "quadrant" && (
        <g opacity={0.65}>
          <text
            x={mathToDesign(0.7, 0.6, scale).x}
            y={mathToDesign(0.7, 0.6, scale).y}
            fill={MATH_COLORS.function}
            fontSize={fontScale(11)}
            fontWeight="bold"
            textAnchor="middle"
            className="select-none pointer-events-none"
          >
            Ⅰ 全正(+)
          </text>
          <text
            x={mathToDesign(-0.7, 0.6, scale).x}
            y={mathToDesign(-0.7, 0.6, scale).y}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(11)}
            fontWeight="bold"
            textAnchor="middle"
            className="select-none pointer-events-none"
          >
            Ⅱ sin+
          </text>
          <text
            x={mathToDesign(-0.7, -0.6, scale).x}
            y={mathToDesign(-0.7, -0.6, scale).y}
            fill={MATH_COLORS.paramTertiary}
            fontSize={fontScale(11)}
            fontWeight="bold"
            textAnchor="middle"
            className="select-none pointer-events-none"
          >
            Ⅲ tan+
          </text>
          <text
            x={mathToDesign(0.7, -0.6, scale).x}
            y={mathToDesign(0.7, -0.6, scale).y}
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(11)}
            fontWeight="bold"
            textAnchor="middle"
            className="select-none pointer-events-none"
          >
            Ⅳ cos+
          </text>
        </g>
      )}

      {/* 动角弧度弧线、方向箭头与带防遮挡背景框的标注 */}
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
          {/* 动角标注文本 (带防遮挡半透明背景框) */}
          <g
            transform={`translate(${arcData.labelPos.x.toFixed(2)}, ${arcData.labelPos.y.toFixed(2)})`}
          >
            <rect
              x={-28}
              y={-10}
              width={56}
              height={20}
              rx={4}
              fill={withAlpha(MATH_COLORS.white, 0.88)}
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

      {/* 辅助直角三角形 P-M 虚线投影 */}
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

      {/* 1. 余弦线 OM (有向线段，始点 O，终点 M) - 暖橙 #D97706 */}
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

      {/* 2. 正弦线 MP (有向线段，始点 M，终点 P) - 鲜红 #EF4444 */}
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

      {/* 3. 正切线 AT (有向线段，始点 A(1,0)，终点 T(1, tan α)) - 翠绿 #059669 */}
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

      {/* 当正切线不存在 (90°, 270°) 时的平行渐近提示 */}
      {showTangent === 1 && !isTanDefined && (
        <g>
          <line
            x1={aDesign.x}
            y1={mathToDesign(1, -1.4, scale).y}
            x2={aDesign.x}
            y2={mathToDesign(1, 1.4, scale).y}
            stroke={MATH_COLORS.vectorResult}
            strokeWidth={2.5}
            strokeDasharray="6 4"
          />
          <rect
            x={aDesign.x + 8}
            y={centerPt.y - 14}
            width={136}
            height={28}
            rx={4}
            fill={withAlpha(MATH_COLORS.vectorResult, 0.9)}
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

      {/* 原点 O 标注 */}
      <text
        x={centerPt.x - 12}
        y={centerPt.y + 16}
        fill={MATH_COLORS.labelText}
        fontSize={fontScale(11)}
        fontWeight="600"
        className="select-none pointer-events-none"
      >
        O
      </text>

      {/* 投影点 M 标注 */}
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

      {/* 切点 A(1,0) */}
      <circle
        cx={aDesign.x}
        cy={aDesign.y}
        r={3.5}
        fill={MATH_COLORS.paramTertiary}
      />
      <text
        x={aDesign.x + 8}
        y={aDesign.y + 14}
        fill={MATH_COLORS.paramTertiary}
        fontSize={fontScale(11)}
        fontWeight="bold"
        className="select-none pointer-events-none"
      >
        A(1,0)
      </text>

      {/* 正切交点 T */}
      {tDesign &&
        isTanDefined &&
        Math.abs(tanVal ?? 0) > 1e-4 &&
        Math.abs(tanVal ?? 0) < 3.5 && (
          <g>
            <circle
              cx={tDesign.x}
              cy={tDesign.y}
              r={4}
              fill={MATH_COLORS.paramTertiary}
            />
            <text
              x={tDesign.x + 10}
              y={tDesign.y + ((tanVal ?? 0) >= 0 ? -6 : 14)}
              fill={MATH_COLORS.paramTertiary}
              fontSize={fontScale(11)}
              fontWeight="bold"
              className="select-none pointer-events-none"
            >
              T(1, tanα)
            </text>
          </g>
        )}

      {/* 单位圆上的主控动点 P(cos α, sin α) - 支持拖拽反向解算角度 */}
      <InteractivePoint
        cx={pointP.x}
        cy={pointP.y}
        scale={scale}
        vp={vp}
        onDrag={handlePDrag}
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

      {/* 当 cos=0 退化时：M 与 O 重合，显示提示 */}
      {Math.abs(cosVal) < 1e-4 && (
        <text
          x={centerPt.x - 38}
          y={centerPt.y - 14}
          fill={MATH_COLORS.axis}
          fontSize={fontScale(9)}
          className="select-none pointer-events-none"
        >
          M=O (cosα=0)
        </text>
      )}
    </g>
  );
};
