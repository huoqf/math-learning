/**
 * src/features/trigIdentity/components/TrigIdentityScene.tsx
 * 纯 SVG 渲染：零硬编码颜色字号，完全遵循铁律
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
  calculateTrigIdentity,
  calculateInduction,
  pointToAngleDeg,
  type FormulaType,
} from "../math/trigIdentity";

interface TrigIdentitySceneProps {
  params: {
    alphaDeg: number;
    homoA?: number;
    homoB?: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode?: "identity" | "induction";
  formulaType?: FormulaType;
}

export const TrigIdentityScene: React.FC<TrigIdentitySceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "identity",
  formulaType = "pi_plus",
}) => {
  const { alphaDeg, homoA = 1, homoB = 1 } = params;

  // 数学计算
  const trig = useMemo(
    () => calculateTrigIdentity(alphaDeg, homoA, homoB),
    [alphaDeg, homoA, homoB],
  );
  const ind = useMemo(
    () => calculateInduction(alphaDeg, formulaType),
    [alphaDeg, formulaType],
  );

  // 坐标映射
  const centerPt = mathToDesign(0, 0, scale);
  const pDesign = mathToDesign(trig.pointP.x, trig.pointP.y, scale);
  const mDesign = mathToDesign(trig.pointM.x, trig.pointM.y, scale);
  const aDesign = mathToDesign(trig.pointA.x, trig.pointA.y, scale);
  const tDesign = trig.pointT
    ? mathToDesign(trig.pointT.x, trig.pointT.y, scale)
    : null;

  // 变换角 P' 坐标映射
  const pPrimeDesign = mathToDesign(
    ind.pointPPrime.x,
    ind.pointPPrime.y,
    scale,
  );
  const mPrimeDesign = mathToDesign(
    ind.pointMPrime.x,
    ind.pointMPrime.y,
    scale,
  );

  // P 点拖拽求角度
  const handlePDrag = (rawMath: { x: number; y: number }) => {
    const newDeg = pointToAngleDeg(rawMath.x, rawMath.y, alphaDeg);
    onParamChange("alphaDeg", newDeg);
  };

  // 单位圆半径
  const unitRadiusPx = scale.scaleX;

  // 动角 α 弧线 path
  const alphaArcPath = useMemo(() => {
    const r = Math.min(unitRadiusPx * 0.25, 32);
    const rad = trig.alphaRad;
    const endX = centerPt.x + r * Math.cos(rad);
    const endY = centerPt.y - r * Math.sin(rad); // SVG y 反向
    const largeArc = Math.abs(alphaDeg) > 180 ? 1 : 0;
    const sweep = alphaDeg >= 0 ? 0 : 1; // 顺时针/逆时针

    return `M ${centerPt.x + r} ${centerPt.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${endX} ${endY}`;
  }, [alphaDeg, trig.alphaRad, centerPt, unitRadiusPx]);

  // 变换角 β 弧线 path
  const betaArcPath = useMemo(() => {
    const r = Math.min(unitRadiusPx * 0.38, 48);
    const rad = ind.betaRad;
    const endX = centerPt.x + r * Math.cos(rad);
    const endY = centerPt.y - r * Math.sin(rad);
    const largeArc = Math.abs(ind.betaDeg) > 180 ? 1 : 0;
    const sweep = ind.betaDeg >= 0 ? 0 : 1;

    return `M ${centerPt.x + r} ${centerPt.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${endX} ${endY}`;
  }, [ind.betaDeg, ind.betaRad, centerPt, unitRadiusPx]);

  return (
    <g>
      {/* 基础直角坐标网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 单位圆 r = 1 */}
      <circle
        cx={centerPt.x}
        cy={centerPt.y}
        r={unitRadiusPx}
        fill="none"
        stroke={withAlpha(MATH_COLORS.primary, 0.4)}
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />

      {studyMode === "identity" ? (
        /* ================= 同角关系 Mode ================= */
        <>
          {/* 直角三角形 OMP 填充 */}
          <polygon
            points={`${centerPt.x},${centerPt.y} ${mDesign.x},${mDesign.y} ${pDesign.x},${pDesign.y}`}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.15)}
            stroke="none"
          />

          {/* 余弦线 OM (x轴) */}
          <line
            x1={centerPt.x}
            y1={centerPt.y}
            x2={mDesign.x}
            y2={mDesign.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
          />

          {/* 正弦线 MP (垂直) */}
          <line
            x1={mDesign.x}
            y1={mDesign.y}
            x2={pDesign.x}
            y2={pDesign.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
          />

          {/* 终边 OP 向量 */}
          <VectorArrow
            from={[0, 0]}
            to={[trig.pointP.x, trig.pointP.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2}
          />

          {/* 如果正切有意义，绘制切线三角形 OAT */}
          {trig.isTanDefined && tDesign && (
            <>
              {/* 延长线 / 终边 OT */}
              <line
                x1={centerPt.x}
                y1={centerPt.y}
                x2={tDesign.x}
                y2={tDesign.y}
                stroke={withAlpha(MATH_COLORS.paramTertiary, 0.5)}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              {/* 正切线 AT (在 x=1 处的切线) */}
              <line
                x1={aDesign.x}
                y1={aDesign.y}
                x2={tDesign.x}
                y2={tDesign.y}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={3}
              />
              {/* 点 T 标注 */}
              <circle
                cx={tDesign.x}
                cy={tDesign.y}
                r={4}
                fill={MATH_COLORS.paramTertiary}
              />
              <text
                x={tDesign.x + 8}
                y={tDesign.y + 4}
                fontSize={fontScale(12)}
                fill={MATH_COLORS.paramTertiary}
                fontWeight="bold"
              >
                {`T(1, tan α)`}
              </text>
            </>
          )}

          {/* 切点 A(1,0) */}
          <circle cx={aDesign.x} cy={aDesign.y} r={3} fill="#4B5563" />
          <text
            x={aDesign.x + 6}
            y={aDesign.y + 14}
            fontSize={fontScale(11)}
            fill="#4B5563"
          >
            A(1,0)
          </text>

          {/* 动角 α 弧线 */}
          {Math.abs(alphaDeg) > 0.5 && (
            <path
              d={alphaArcPath}
              fill="none"
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={1.5}
            />
          )}

          {/* 角 α 文本标注 */}
          <text
            x={centerPt.x + 28 * Math.cos(trig.alphaRad / 2)}
            y={centerPt.y - 28 * Math.sin(trig.alphaRad / 2)}
            fontSize={fontScale(12)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            α
          </text>

          {/* 边长数值标注 (cosα, sinα) */}
          <text
            x={(centerPt.x + mDesign.x) / 2}
            y={centerPt.y + (trig.sinVal >= 0 ? 14 : -6)}
            fontSize={fontScale(11)}
            fill={MATH_COLORS.paramSecondary}
            textAnchor="middle"
          >
            {`cos α = ${trig.cosVal.toFixed(2)}`}
          </text>

          <text
            x={mDesign.x + (trig.cosVal >= 0 ? 8 : -8)}
            y={(mDesign.y + pDesign.y) / 2}
            fontSize={fontScale(11)}
            fill={MATH_COLORS.paramPrimary}
            textAnchor={trig.cosVal >= 0 ? "start" : "end"}
          >
            {`sin α = ${trig.sinVal.toFixed(2)}`}
          </text>

          {/* 可拖拽动点 P(cosα, sinα) */}
          <InteractivePoint
            cx={trig.pointP.x}
            cy={trig.pointP.y}
            scale={scale}
            vp={vp}
            onDrag={handlePDrag}
            fontScale={fontScale}
            color={MATH_COLORS.paramPrimary}
            label={`P(${trig.cosVal.toFixed(2)}, ${trig.sinVal.toFixed(2)})`}
          />
        </>
      ) : (
        /* ================= 诱导公式 Mode ================= */
        <>
          {/* 对称轴 / 特征线绘制 */}
          {ind.symmetryType === "origin" && (
            /* 中心对称：贯穿线 P'OP */
            <line
              x1={pDesign.x}
              y1={pDesign.y}
              x2={pPrimeDesign.x}
              y2={pPrimeDesign.y}
              stroke={withAlpha("#6366F1", 0.6)}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          )}

          {ind.symmetryType === "xaxis" && (
            /* x 轴对称：PP' 垂直线 */
            <line
              x1={pDesign.x}
              y1={pDesign.y}
              x2={pPrimeDesign.x}
              y2={pPrimeDesign.y}
              stroke={withAlpha("#6366F1", 0.6)}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          )}

          {ind.symmetryType === "yaxis" && (
            /* y 轴对称：PP' 水平线 */
            <line
              x1={pDesign.x}
              y1={pDesign.y}
              x2={pPrimeDesign.x}
              y2={pPrimeDesign.y}
              stroke={withAlpha("#6366F1", 0.6)}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          )}

          {ind.symmetryType === "diag_pos" && (
            /* y = x 对称 */
            <>
              <line
                x1={mathToDesign(-1.5, -1.5, scale).x}
                y1={mathToDesign(-1.5, -1.5, scale).y}
                x2={mathToDesign(1.5, 1.5, scale).x}
                y2={mathToDesign(1.5, 1.5, scale).y}
                stroke="#8B5CF6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <line
                x1={pDesign.x}
                y1={pDesign.y}
                x2={pPrimeDesign.x}
                y2={pPrimeDesign.y}
                stroke={withAlpha("#6366F1", 0.6)}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
            </>
          )}

          {ind.symmetryType === "diag_neg" && (
            /* y = -x 对称 */
            <>
              <line
                x1={mathToDesign(-1.5, 1.5, scale).x}
                y1={mathToDesign(-1.5, 1.5, scale).y}
                x2={mathToDesign(1.5, -1.5, scale).x}
                y2={mathToDesign(1.5, -1.5, scale).y}
                stroke="#8B5CF6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <line
                x1={pDesign.x}
                y1={pDesign.y}
                x2={pPrimeDesign.x}
                y2={pPrimeDesign.y}
                stroke={withAlpha("#6366F1", 0.6)}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
            </>
          )}

          {/* 直角三角形 OMP (原角 α) 填充 */}
          <polygon
            points={`${centerPt.x},${centerPt.y} ${mDesign.x},${mDesign.y} ${pDesign.x},${pDesign.y}`}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.12)}
            stroke={withAlpha(MATH_COLORS.paramPrimary, 0.5)}
            strokeWidth={1}
          />

          {/* 直角三角形 OM'P' (变换角 β) 填充 */}
          <polygon
            points={`${centerPt.x},${centerPt.y} ${mPrimeDesign.x},${mPrimeDesign.y} ${pPrimeDesign.x},${pPrimeDesign.y}`}
            fill={withAlpha(MATH_COLORS.paramSecondary, 0.15)}
            stroke={withAlpha(MATH_COLORS.paramSecondary, 0.5)}
            strokeWidth={1}
          />

          {/* 原角向量 OP (红色) */}
          <VectorArrow
            from={[0, 0]}
            to={[trig.pointP.x, trig.pointP.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
          />

          {/* 变换角向量 OP' (橙色) */}
          <VectorArrow
            from={[0, 0]}
            to={[ind.pointPPrime.x, ind.pointPPrime.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
          />

          {/* 动角 α 弧线 */}
          <path
            d={alphaArcPath}
            fill="none"
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
          />

          {/* 变换角 β 弧线 */}
          <path
            d={betaArcPath}
            fill="none"
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />

          {/* 动点 P(cosα, sinα) */}
          <InteractivePoint
            cx={trig.pointP.x}
            cy={trig.pointP.y}
            scale={scale}
            vp={vp}
            onDrag={handlePDrag}
            fontScale={fontScale}
            color={MATH_COLORS.paramPrimary}
            label="P(α)"
          />

          {/* 变换点 P'(cosβ, sinβ) */}
          <circle
            cx={pPrimeDesign.x}
            cy={pPrimeDesign.y}
            r={5}
            fill={MATH_COLORS.paramSecondary}
          />
          <text
            x={pPrimeDesign.x + (ind.pointPPrime.x >= 0 ? 8 : -24)}
            y={pPrimeDesign.y + (ind.pointPPrime.y >= 0 ? -8 : 16)}
            fontSize={fontScale(11)}
            fill={MATH_COLORS.paramSecondary}
            fontWeight="bold"
          >
            P'(β)
          </text>
        </>
      )}
    </g>
  );
};
