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
import {
  calculateTrigLines,
  calculateComparisonAreas,
  solveTrigInequality,
  pointToAngleDeg,
  type TrigInequalityKind,
} from "../math/trigLines";

interface TrigLinesSceneProps {
  params: {
    alphaDeg: number;
    compAlphaDeg?: number;
    ineqThreshold?: number;
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
  studyMode?: "lines" | "comparison" | "inequality";
  ineqKind?: TrigInequalityKind;
}

export const TrigLinesScene: React.FC<TrigLinesSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "lines",
  ineqKind = "sin_gt",
}) => {
  const { alphaDeg } = params;
  const compAlphaDeg = params.compAlphaDeg ?? 40;
  const ineqThreshold = params.ineqThreshold ?? 0.5;
  const showSine = params.showSine ?? 1;
  const showCosine = params.showCosine ?? 1;
  const showTangent = params.showTangent ?? 1;
  const showArc = params.showArc ?? 1;
  const showAuxTriangle = params.showAuxTriangle ?? 1;

  // 坐标系基准点与尺寸
  const centerPt = mathToDesign(0, 0, scale);
  const unitRadiusPx = scale.scaleX; // 半径 r = 1 的像素数

  // 1. 基础三角计算 (动角 alpha)
  const trig = useMemo(() => calculateTrigLines(alphaDeg), [alphaDeg]);
  const {
    pointP,
    pointM,
    pointA,
    pointT,
    isTanDefined,
    alphaRad,
    sinVal,
    cosVal,
    tanVal,
  } = trig;

  const pDesign = mathToDesign(pointP.x, pointP.y, scale);
  const mDesign = mathToDesign(pointM.x, pointM.y, scale);
  const aDesign = mathToDesign(pointA.x, pointA.y, scale);
  const tDesign = pointT ? mathToDesign(pointT.x, pointT.y, scale) : null;

  // 动点拖拽回调
  const handlePDrag = (rawMath: { x: number; y: number }) => {
    const newDeg = pointToAngleDeg(rawMath.x, rawMath.y, alphaDeg);
    onParamChange("alphaDeg", newDeg);
  };

  const handleCompPDrag = (rawMath: { x: number; y: number }) => {
    const rad = Math.atan2(
      Math.max(0.01, rawMath.y),
      Math.max(0.01, rawMath.x),
    );
    const deg = Math.max(5, Math.min(85, Math.round((rad * 180) / Math.PI)));
    onParamChange("compAlphaDeg", deg);
  };

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

  // 2. 面积放缩模式下的计算与路径
  const compData = useMemo(() => {
    if (studyMode !== "comparison") return null;
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
  }, [studyMode, compAlphaDeg, scale, centerPt, aDesign, unitRadiusPx]);

  // 3. 三角不等式求解与圆弧高亮
  const ineqData = useMemo(() => {
    if (studyMode !== "inequality") return null;
    return solveTrigInequality(ineqKind, ineqThreshold, alphaDeg);
  }, [studyMode, ineqKind, ineqThreshold, alphaDeg]);

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

      {/* 模式 1：定义模式 (lines) 渲染 */}
      {studyMode === "lines" && (
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
                <polygon
                  points={arcData.arrowPoints}
                  fill={MATH_COLORS.function}
                />
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

          {/* 主控动点 P */}
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
        </g>
      )}

      {/* 模式 2：面积放缩与不等式 (comparison) 渲染 */}
      {studyMode === "comparison" && compData && (
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
          <circle
            cx={aDesign.x}
            cy={aDesign.y}
            r={3.5}
            fill={MATH_COLORS.paramTertiary}
          />
          <text
            x={aDesign.x + 6}
            y={aDesign.y + 16}
            fill={MATH_COLORS.paramTertiary}
            fontSize={fontScale(11)}
            fontWeight="bold"
            className="select-none pointer-events-none"
          >
            A(1,0)
          </text>

          {/* 交点 T(1, tan x) */}
          <circle
            cx={compData.tDes.x}
            cy={compData.tDes.y}
            r={4}
            fill={MATH_COLORS.paramTertiary}
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
            <text
              x={10}
              y={58}
              fill={MATH_COLORS.function}
              fontSize={fontScale(9)}
            >
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
      )}

      {/* 模式 3：三角不等式 (inequality) 渲染 */}
      {studyMode === "inequality" && ineqData && (
        <g>
          {/* 解集弧区扇形阴影填充 */}
          {ineqData.intervals.map((interval, idx) => {
            const isLarge =
              interval.endRad - interval.startRad > Math.PI ? 1 : 0;
            const startX =
              centerPt.x + unitRadiusPx * Math.cos(interval.startRad);
            const startY =
              centerPt.y - unitRadiusPx * Math.sin(interval.startRad);
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

          {/* 边界临界交点 (空心圈) */}
          {ineqData.boundaryPoints.map((pt, idx) => {
            const des = mathToDesign(pt.x, pt.y, scale);
            return (
              <g key={idx}>
                <circle
                  cx={des.x}
                  cy={des.y}
                  r={5}
                  fill={MATH_COLORS.white}
                  stroke={MATH_COLORS.paramTertiary}
                  strokeWidth={2.5}
                />
              </g>
            );
          })}

          {/* 终边 OP */}
          <line
            x1={centerPt.x}
            y1={centerPt.y}
            x2={pDesign.x}
            y2={pDesign.y}
            stroke={
              ineqData.isSatisfied
                ? MATH_COLORS.paramTertiary
                : MATH_COLORS.axis
            }
            strokeWidth={2.5}
          />

          {/* 动点 P */}
          <InteractivePoint
            cx={pointP.x}
            cy={pointP.y}
            scale={scale}
            vp={vp}
            onDrag={handlePDrag}
            color={
              ineqData.isSatisfied
                ? MATH_COLORS.paramTertiary
                : MATH_COLORS.axis
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
                ineqData.isSatisfied
                  ? MATH_COLORS.paramTertiary
                  : MATH_COLORS.axis,
                0.4,
              )}
              strokeWidth={1}
            />
            <text
              x={65}
              y={14}
              fill={
                ineqData.isSatisfied
                  ? MATH_COLORS.paramTertiary
                  : MATH_COLORS.axis
              }
              fontSize={fontScale(10)}
              fontWeight="bold"
              textAnchor="middle"
              className="select-none pointer-events-none"
            >
              α={alphaDeg}°{" "}
              {ineqData.isSatisfied ? "(在解集内 ✓)" : "(不在解集 ✗)"}
            </text>
          </g>
        </g>
      )}
    </g>
  );
};
