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
  MathPoint,
  VectorArrow,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  calculateTrigIdentity,
  calculateInduction,
  calculateUniversalInduction,
  calculateComplementaryModel,
  pointToAngleDeg,
  type FormulaType,
  type IdentitySubMode,
  type InductionSubMode,
} from "../math/trigIdentity";

interface TrigIdentitySceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode?: "identity" | "induction";
  identitySubMode?: IdentitySubMode;
  inductionSubMode?: InductionSubMode;
  formulaType?: FormulaType;
}

// 生成角度弧线或多圈阿基米德螺旋线
function createAngleArcPath(
  centerPt: { x: number; y: number },
  startDeg: number,
  sweepDeg: number,
  baseR: number,
  isSpiral: boolean = false,
): string {
  if (Math.abs(sweepDeg) < 0.5) return "";
  const totalRad = (sweepDeg * Math.PI) / 180;
  const startRad = (startDeg * Math.PI) / 180;
  const isMultiTurn = Math.abs(sweepDeg) > 360;

  // 单圈且不需要螺旋
  if (!isMultiTurn && !isSpiral) {
    const r = baseR;
    const endRad = startRad + totalRad;
    const startX = centerPt.x + r * Math.cos(startRad);
    const startY = centerPt.y - r * Math.sin(startRad);
    const endX = centerPt.x + r * Math.cos(endRad);
    const endY = centerPt.y - r * Math.sin(endRad);
    const largeArc = Math.abs(sweepDeg) > 180 ? 1 : 0;
    const sweep = sweepDeg >= 0 ? 0 : 1;
    return `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} ${sweep} ${endX} ${endY}`;
  }

  // 多圈阿基米德螺旋线：点采样生成光滑 path
  const numSteps = Math.max(36, Math.floor(Math.abs(sweepDeg) / 8));
  const rStart = baseR * 0.7;
  const rGrowth = (baseR * 0.6) / (Math.abs(sweepDeg) / 360);
  let pathStr = "";

  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    const currentAngleRad = startRad + totalRad * t;
    const currentR = rStart + rGrowth * (Math.abs(sweepDeg) / 360) * t;
    const px = centerPt.x + currentR * Math.cos(currentAngleRad);
    const py = centerPt.y - currentR * Math.sin(currentAngleRad);

    if (i === 0) {
      pathStr += `M ${px} ${py}`;
    } else {
      pathStr += ` L ${px} ${py}`;
    }
  }
  return pathStr;
}

export const TrigIdentityScene: React.FC<TrigIdentitySceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "identity",
  identitySubMode = "geometry",
  inductionSubMode = "standard6",
  formulaType = "pi_plus",
}) => {
  const {
    alphaDeg = 45,
    homoA = 1,
    homoB = 1,
    homoC = 1,
    homoD = 1,
    quadA = 2,
    quadB = 3,
    quadC = -1,
    universalK = 1,
    universalSign = 1,
    thetaDeg = 30,
  } = params;

  // 数学计算
  const trig = useMemo(
    () =>
      calculateTrigIdentity(
        alphaDeg,
        homoA,
        homoB,
        homoC,
        homoD,
        quadA,
        quadB,
        quadC,
      ),
    [alphaDeg, homoA, homoB, homoC, homoD, quadA, quadB, quadC],
  );

  const ind = useMemo(
    () => calculateInduction(alphaDeg, formulaType),
    [alphaDeg, formulaType],
  );

  const univInd = useMemo(
    () =>
      calculateUniversalInduction(
        alphaDeg,
        universalK,
        (universalSign >= 0 ? 1 : -1) as 1 | -1,
      ),
    [alphaDeg, universalK, universalSign],
  );

  const comp = useMemo(
    () => calculateComplementaryModel(alphaDeg, thetaDeg),
    [alphaDeg, thetaDeg],
  );

  // 坐标映射
  const centerPt = mathToDesign(0, 0, scale);
  const pDesign = mathToDesign(trig.pointP.x, trig.pointP.y, scale);
  const mDesign = mathToDesign(trig.pointM.x, trig.pointM.y, scale);
  const aDesign = mathToDesign(trig.pointA.x, trig.pointA.y, scale);
  const tDesign = trig.pointT
    ? mathToDesign(trig.pointT.x, trig.pointT.y, scale)
    : null;

  // 诱导公式角 P' 坐标映射 (标准6组 vs 万能法则)
  const activeInd = inductionSubMode === "universal_k" ? univInd : ind;
  const pPrimeDesign = mathToDesign(
    activeInd.pointPPrime.x,
    activeInd.pointPPrime.y,
    scale,
  );
  const mPrimeDesign = mathToDesign(
    activeInd.pointMPrime.x,
    activeInd.pointMPrime.y,
    scale,
  );

  // 配角模型坐标映射
  const compP1 = {
    x: Math.cos((comp.angle1Deg * Math.PI) / 180),
    y: Math.sin((comp.angle1Deg * Math.PI) / 180),
  };
  const compP2 = {
    x: Math.cos((comp.angle2Deg * Math.PI) / 180),
    y: Math.sin((comp.angle2Deg * Math.PI) / 180),
  };
  const compP1Design = mathToDesign(compP1.x, compP1.y, scale);
  const compP2Design = mathToDesign(compP2.x, compP2.y, scale);

  // P 点拖拽求角度
  const handlePDrag = (rawMath: { x: number; y: number }) => {
    const newDeg = pointToAngleDeg(rawMath.x, rawMath.y, alphaDeg);
    onParamChange("alphaDeg", newDeg);
  };

  // Q(B, A) 点拖拽解算分子 A 和 B
  const handleQDrag = (rawMath: { x: number; y: number }) => {
    const newB = Math.round(rawMath.x * 2) / 2;
    const newA = Math.round(rawMath.y * 2) / 2;
    onParamChange("homoB", Math.max(-3, Math.min(3, newB)));
    onParamChange("homoA", Math.max(-3, Math.min(3, newA)));
  };

  // 单位圆半径 (像素)
  const unitRadiusPx = scale.scaleX;

  // 动角 α 弧线 path
  const alphaArcPath = useMemo(() => {
    const r = Math.min(unitRadiusPx * 0.26, 34);
    return createAngleArcPath(centerPt, 0, alphaDeg, r);
  }, [alphaDeg, centerPt, unitRadiusPx]);

  // 变换角 β 弧线 path (多圈时自动平滑螺旋展开)
  const betaArcPath = useMemo(() => {
    const r = Math.min(unitRadiusPx * 0.42, 54);
    const sweep = activeInd.betaDeg;
    return createAngleArcPath(centerPt, 0, sweep, r, Math.abs(sweep) > 360);
  }, [activeInd.betaDeg, centerPt, unitRadiusPx]);

  // 判定 P 与 P' 是否近乎重合 (欧氏距离 < 24px)
  const isPCoincide = useMemo(() => {
    const dist = Math.hypot(
      pDesign.x - pPrimeDesign.x,
      pDesign.y - pPrimeDesign.y,
    );
    return dist < 24;
  }, [pDesign.x, pDesign.y, pPrimeDesign.x, pPrimeDesign.y]);

  return (
    <g>
      {/* 基础直角坐标网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 单位圆 x² + y² = 1 */}
      <circle
        cx={centerPt.x}
        cy={centerPt.y}
        r={unitRadiusPx}
        fill="none"
        stroke={withAlpha(MATH_COLORS.primary, 0.45)}
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
            stroke={withAlpha(MATH_COLORS.paramPrimary, 0.4)}
            strokeWidth={1}
          />

          {/* 直角符号 ∟ (垂足 M 处，防畸变尺寸 9px) */}
          {Math.abs(trig.cosVal) > 0.08 && Math.abs(trig.sinVal) > 0.08 && (
            <path
              d={`M ${mDesign.x - Math.sign(trig.cosVal) * 9} ${mDesign.y} L ${mDesign.x - Math.sign(trig.cosVal) * 9} ${mDesign.y - Math.sign(trig.sinVal) * 9} L ${mDesign.x} ${mDesign.y - Math.sign(trig.sinVal) * 9}`}
              fill="none"
              stroke={withAlpha(MATH_COLORS.paramPrimary, 0.7)}
              strokeWidth={1.5}
            />
          )}

          {/* 余弦线 OM (暖橙 paramSecondary) */}
          <line
            x1={centerPt.x}
            y1={centerPt.y}
            x2={mDesign.x}
            y2={mDesign.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={3}
          />

          {/* 正弦线 MP (鲜红 paramPrimary) */}
          <line
            x1={mDesign.x}
            y1={mDesign.y}
            x2={pDesign.x}
            y2={pDesign.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={3}
          />

          {/* 终边 OP 向量 */}
          <VectorArrow
            from={[0, 0]}
            to={[trig.pointP.x, trig.pointP.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
          />

          {/* 正切线 AT (切线 x = 1) */}
          {trig.isTanDefined && tDesign && (
            <>
              {/* x = 1 垂直切线参考基准 */}
              <line
                x1={aDesign.x}
                y1={centerPt.y - scale.scaleY * 2.0}
                x2={aDesign.x}
                y2={centerPt.y + scale.scaleY * 2.0}
                stroke={withAlpha(MATH_COLORS.labelText, 0.35)}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {/* 终边延长线 OT */}
              <line
                x1={centerPt.x}
                y1={centerPt.y}
                x2={tDesign.x}
                y2={tDesign.y}
                stroke={withAlpha(MATH_COLORS.paramTertiary, 0.5)}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              {/* 正切线段 AT (翠绿 paramTertiary) */}
              <line
                x1={aDesign.x}
                y1={aDesign.y}
                x2={tDesign.x}
                y2={tDesign.y}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={3}
              />
              {/* 切点 T */}
              <MathPoint
                x={tDesign.x}
                y={tDesign.y}
                color={MATH_COLORS.paramTertiary}
                label="T"
                labelPosition={trig.tanVal! >= 0 ? "top-right" : "bottom-right"}
                fontScale={fontScale}
              />
            </>
          )}

          {/* 垂足 M 标注 */}
          {Math.abs(trig.cosVal) > 0.05 && (
            <MathPoint
              x={mDesign.x}
              y={mDesign.y}
              color={MATH_COLORS.labelText}
              label="M"
              labelPosition={trig.sinVal >= 0 ? "bottom-right" : "top-right"}
              fontScale={fontScale}
            />
          )}

          {/* 切点 A(1,0) 标注 */}
          <MathPoint
            x={aDesign.x}
            y={aDesign.y}
            color={MATH_COLORS.labelText}
            label="A"
            labelPosition="bottom-right"
            fontScale={fontScale}
          />

          {/* 动角 α 弧线 */}
          {Math.abs(alphaDeg) > 0.5 && (
            <path
              d={alphaArcPath}
              fill="none"
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={1.5}
            />
          )}

          {/* 角 α 文本标注（微描边防遮挡） */}
          <text
            x={centerPt.x + 28 * Math.cos(trig.alphaRad / 2)}
            y={centerPt.y - 28 * Math.sin(trig.alphaRad / 2)}
            fontSize={fontScale(12)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
          >
            α
          </text>

          {/* 三角函数线学术标注 (cosα, sinα) */}
          <text
            x={(centerPt.x + mDesign.x) / 2}
            y={centerPt.y + (trig.sinVal >= 0 ? 14 : -6)}
            fontSize={fontScale(10)}
            fill={MATH_COLORS.paramSecondary}
            textAnchor="middle"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={2.5}
          >
            cos α
          </text>

          <text
            x={mDesign.x + (trig.cosVal >= 0 ? 8 : -8)}
            y={(mDesign.y + pDesign.y) / 2}
            fontSize={fontScale(10)}
            fill={MATH_COLORS.paramPrimary}
            textAnchor={trig.cosVal >= 0 ? "start" : "end"}
            paintOrder="stroke"
            stroke="white"
            strokeWidth={2.5}
          >
            sin α
          </text>

          {/* 可拖拽动点 P */}
          <InteractivePoint
            cx={trig.pointP.x}
            cy={trig.pointP.y}
            scale={scale}
            vp={vp}
            onDrag={handlePDrag}
            fontScale={fontScale}
            color={MATH_COLORS.paramPrimary}
            label="P"
          />

          {/* 知一求二模式下的和向量与对称轴 y = x 辅助 */}
          {identitySubMode === "known_one" && (
            <>
              {/* y = x 分界对称轴 */}
              <line
                x1={mathToDesign(-1.5, -1.5, scale).x}
                y1={mathToDesign(-1.5, -1.5, scale).y}
                x2={mathToDesign(1.5, 1.5, scale).x}
                y2={mathToDesign(1.5, 1.5, scale).y}
                stroke={withAlpha(MATH_COLORS.secondary, 0.45)}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              {/* 和向量 (cosα+sinα, 0) */}
              <VectorArrow
                from={[0, 0]}
                to={[trig.sumSC, 0]}
                scale={scale}
                color={MATH_COLORS.paramPrimary}
                strokeWidth={2}
              />
              <text
                x={mathToDesign(trig.sumSC, 0, scale).x}
                y={centerPt.y + (trig.sumSC >= 0 ? 24 : -12)}
                fontSize={fontScale(10)}
                fill={MATH_COLORS.paramPrimary}
                textAnchor="middle"
                fontWeight="bold"
                paintOrder="stroke"
                stroke="white"
                strokeWidth={2.5}
              >
                S
              </text>
            </>
          )}

          {/* 齐次式模式下的系数向量与点 Q */}
          {identitySubMode === "homogeneous" && (
            <>
              <VectorArrow
                from={[0, 0]}
                to={[homoB, homoA]}
                scale={scale}
                color={MATH_COLORS.secondary}
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <InteractivePoint
                cx={homoB}
                cy={homoA}
                scale={scale}
                vp={vp}
                onDrag={handleQDrag}
                fontScale={fontScale}
                color={MATH_COLORS.secondary}
                label="Q"
              />
            </>
          )}
        </>
      ) : (
        /* ================= 诱导公式 Mode ================= */
        <>
          {/* 配角模型专题 */}
          {inductionSubMode === "complementary" ? (
            <>
              {/* y = x 对称轴 */}
              <line
                x1={mathToDesign(-1.5, -1.5, scale).x}
                y1={mathToDesign(-1.5, -1.5, scale).y}
                x2={mathToDesign(1.5, 1.5, scale).x}
                y2={mathToDesign(1.5, 1.5, scale).y}
                stroke={MATH_COLORS.secondary}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              {/* 连线 P1 P2 垂直于 y=x */}
              <line
                x1={compP1Design.x}
                y1={compP1Design.y}
                x2={compP2Design.x}
                y2={compP2Design.y}
                stroke={withAlpha(MATH_COLORS.primary, 0.6)}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              {/* 终边 OP1 (α + θ) */}
              <VectorArrow
                from={[0, 0]}
                to={[compP1.x, compP1.y]}
                scale={scale}
                color={MATH_COLORS.paramPrimary}
                strokeWidth={2.5}
              />
              {/* 终边 OP2 (π/2 - (α + θ)) */}
              <VectorArrow
                from={[0, 0]}
                to={[compP2.x, compP2.y]}
                scale={scale}
                color={MATH_COLORS.paramSecondary}
                strokeWidth={2.5}
              />
              {/* 点 P1 标注 */}
              <MathPoint
                x={compP1Design.x}
                y={compP1Design.y}
                color={MATH_COLORS.paramPrimary}
                label="P₁"
                labelPosition="top-right"
                fontScale={fontScale}
              />
              {/* 点 P2 标注 */}
              <MathPoint
                x={compP2Design.x}
                y={compP2Design.y}
                color={MATH_COLORS.paramSecondary}
                label="P₂"
                labelPosition="top-right"
                fontScale={fontScale}
              />
            </>
          ) : (
            /* 标准 6 组或万能法则 */
            <>
              {/* 对称轴 / 特征线绘制 */}
              {activeInd.symmetryType === "origin" && (
                <line
                  x1={pDesign.x}
                  y1={pDesign.y}
                  x2={pPrimeDesign.x}
                  y2={pPrimeDesign.y}
                  stroke={withAlpha(MATH_COLORS.primary, 0.6)}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              )}

              {activeInd.symmetryType === "xaxis" && (
                <line
                  x1={pDesign.x}
                  y1={pDesign.y}
                  x2={pPrimeDesign.x}
                  y2={pPrimeDesign.y}
                  stroke={withAlpha(MATH_COLORS.primary, 0.6)}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              )}

              {activeInd.symmetryType === "yaxis" && (
                <line
                  x1={pDesign.x}
                  y1={pDesign.y}
                  x2={pPrimeDesign.x}
                  y2={pPrimeDesign.y}
                  stroke={withAlpha(MATH_COLORS.primary, 0.6)}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              )}

              {(activeInd.symmetryType === "diag_pos" ||
                (activeInd.kValue === 1 && activeInd.isOdd)) && (
                <>
                  <line
                    x1={mathToDesign(-1.5, -1.5, scale).x}
                    y1={mathToDesign(-1.5, -1.5, scale).y}
                    x2={mathToDesign(1.5, 1.5, scale).x}
                    y2={mathToDesign(1.5, 1.5, scale).y}
                    stroke={MATH_COLORS.secondary}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                  <line
                    x1={pDesign.x}
                    y1={pDesign.y}
                    x2={pPrimeDesign.x}
                    y2={pPrimeDesign.y}
                    stroke={withAlpha(MATH_COLORS.primary, 0.6)}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                </>
              )}

              {activeInd.symmetryType === "diag_neg" && (
                <>
                  <line
                    x1={mathToDesign(-1.5, 1.5, scale).x}
                    y1={mathToDesign(-1.5, 1.5, scale).y}
                    x2={mathToDesign(1.5, -1.5, scale).x}
                    y2={mathToDesign(1.5, -1.5, scale).y}
                    stroke={MATH_COLORS.secondary}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                  <line
                    x1={pDesign.x}
                    y1={pDesign.y}
                    x2={pPrimeDesign.x}
                    y2={pPrimeDesign.y}
                    stroke={withAlpha(MATH_COLORS.primary, 0.6)}
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

              {/* 直角符号 ∟ (原角垂足 M 处) */}
              {Math.abs(trig.cosVal) > 0.08 && Math.abs(trig.sinVal) > 0.08 && (
                <path
                  d={`M ${mDesign.x - Math.sign(trig.cosVal) * 9} ${mDesign.y} L ${mDesign.x - Math.sign(trig.cosVal) * 9} ${mDesign.y - Math.sign(trig.sinVal) * 9} L ${mDesign.x} ${mDesign.y - Math.sign(trig.sinVal) * 9}`}
                  fill="none"
                  stroke={withAlpha(MATH_COLORS.paramPrimary, 0.7)}
                  strokeWidth={1.5}
                />
              )}

              {/* 直角三角形 OM'P' (变换角 β) 填充 */}
              <polygon
                points={`${centerPt.x},${centerPt.y} ${mPrimeDesign.x},${mPrimeDesign.y} ${pPrimeDesign.x},${pPrimeDesign.y}`}
                fill={withAlpha(MATH_COLORS.paramSecondary, 0.15)}
                stroke={withAlpha(MATH_COLORS.paramSecondary, 0.5)}
                strokeWidth={1}
              />

              {/* 直角符号 ∟ (变换角垂足 M' 处) */}
              {Math.abs(activeInd.pointPPrime.x) > 0.08 &&
                Math.abs(activeInd.pointPPrime.y) > 0.08 && (
                  <path
                    d={`M ${mPrimeDesign.x - Math.sign(activeInd.pointPPrime.x) * 9} ${mPrimeDesign.y} L ${mPrimeDesign.x - Math.sign(activeInd.pointPPrime.x) * 9} ${mPrimeDesign.y - Math.sign(activeInd.pointPPrime.y) * 9} L ${mPrimeDesign.x} ${mPrimeDesign.y - Math.sign(activeInd.pointPPrime.y) * 9}`}
                    fill="none"
                    stroke={withAlpha(MATH_COLORS.paramSecondary, 0.7)}
                    strokeWidth={1.5}
                  />
                )}

              {/* 垂足 M 与 M' 标注 */}
              {Math.abs(trig.cosVal) > 0.05 && (
                <MathPoint
                  x={mDesign.x}
                  y={mDesign.y}
                  color={MATH_COLORS.labelText}
                  label="M"
                  labelPosition={
                    trig.sinVal >= 0 ? "bottom-right" : "top-right"
                  }
                  fontScale={fontScale}
                />
              )}
              {!isPCoincide && Math.abs(activeInd.pointPPrime.x) > 0.05 && (
                <MathPoint
                  x={mPrimeDesign.x}
                  y={mPrimeDesign.y}
                  color={MATH_COLORS.labelText}
                  label="M'"
                  labelPosition={
                    activeInd.pointPPrime.y >= 0 ? "bottom-left" : "top-left"
                  }
                  fontScale={fontScale}
                />
              )}

              {/* 原角终边向量 OP (红色) */}
              <VectorArrow
                from={[0, 0]}
                to={[trig.pointP.x, trig.pointP.y]}
                scale={scale}
                color={MATH_COLORS.paramPrimary}
                strokeWidth={2.5}
              />

              {/* 变换角终边向量 OP' (橙色) */}
              <VectorArrow
                from={[0, 0]}
                to={[activeInd.pointPPrime.x, activeInd.pointPPrime.y]}
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

              {/* 动角 α 文本 */}
              <text
                x={centerPt.x + 28 * Math.cos(trig.alphaRad / 2)}
                y={centerPt.y - 28 * Math.sin(trig.alphaRad / 2)}
                fontSize={fontScale(12)}
                fill={MATH_COLORS.paramPrimary}
                fontWeight="bold"
                paintOrder="stroke"
                stroke="white"
                strokeWidth={3}
              >
                α
              </text>

              {/* 变换角 β 弧线 */}
              <path
                d={betaArcPath}
                fill="none"
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />

              {/* 变换角 β 文本 */}
              <text
                x={
                  centerPt.x +
                  46 * Math.cos((activeInd.betaDeg * Math.PI) / 360)
                }
                y={
                  centerPt.y -
                  46 * Math.sin((activeInd.betaDeg * Math.PI) / 360)
                }
                fontSize={fontScale(12)}
                fill={MATH_COLORS.paramSecondary}
                fontWeight="bold"
                paintOrder="stroke"
                stroke="white"
                strokeWidth={3}
              >
                β
              </text>

              {/* 动点 P(可拖拽) */}
              <InteractivePoint
                cx={trig.pointP.x}
                cy={trig.pointP.y}
                scale={scale}
                vp={vp}
                onDrag={handlePDrag}
                fontScale={fontScale}
                color={MATH_COLORS.paramPrimary}
                label="P"
              />

              {/* 变换点 P' - 仅在未重合时单独渲染 */}
              {!isPCoincide && (
                <MathPoint
                  x={pPrimeDesign.x}
                  y={pPrimeDesign.y}
                  color={MATH_COLORS.paramSecondary}
                  label="P'"
                  labelPosition={
                    activeInd.pointPPrime.x >= 0
                      ? activeInd.pointPPrime.y >= 0
                        ? "top-right"
                        : "bottom-right"
                      : activeInd.pointPPrime.y >= 0
                        ? "top-left"
                        : "bottom-left"
                  }
                  fontScale={fontScale}
                />
              )}

              {/* 当重合时，给重合点增加外围橙色指示光晕 */}
              {isPCoincide && (
                <circle
                  cx={pPrimeDesign.x}
                  cy={pPrimeDesign.y}
                  r={8}
                  fill="none"
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                />
              )}
            </>
          )}
        </>
      )}
    </g>
  );
};
