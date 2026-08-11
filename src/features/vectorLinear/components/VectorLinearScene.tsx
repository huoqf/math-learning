import React from "react";
import {
  CoordinateGrid,
  VectorArrow,
  InteractivePoint,
} from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  computeVectorLinear,
  type VectorLinearParams,
} from "@/math/vectorLinear";

interface VectorLinearSceneProps {
  params: VectorLinearParams;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale: (size: number) => number;
  studyMode: "linearCombo" | "collinear" | "basis";
  lockCollinear?: boolean;
}

export const VectorLinearScene: React.FC<VectorLinearSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  studyMode,
  lockCollinear = false,
}) => {
  const mathRes = computeVectorLinear({
    ...params,
    lockCollinear,
  });

  const {
    a,
    b,
    lambdaA,
    muB,
    sumVec,
    diffVec,
    pointC,
    targetVecV,
    isBasisValid,
    lambda1,
    lambda2,
    basisComponent1,
    basisComponent2,
    coeffSum,
  } = mathRes;

  const originDesign = mathToDesign(0, 0, scale);
  const posADesign = mathToDesign(a.x, a.y, scale);
  const posBDesign = mathToDesign(b.x, b.y, scale);

  const lambdaADesign = mathToDesign(lambdaA.x, lambdaA.y, scale);
  const muBDesign = mathToDesign(muB.x, muB.y, scale);
  const sumDesign = mathToDesign(sumVec.x, sumVec.y, scale);

  const basisComp1Design = mathToDesign(
    basisComponent1.x,
    basisComponent1.y,
    scale,
  );
  const basisComp2Design = mathToDesign(
    basisComponent2.x,
    basisComponent2.y,
    scale,
  );
  const targetVDesign = mathToDesign(targetVecV.x, targetVecV.y, scale);

  // 拖拽 A 点 (数学坐标)
  const handleDragPointA = (pt: { x: number; y: number }) => {
    const roundX = Math.round(pt.x * 2) / 2;
    const roundY = Math.round(pt.y * 2) / 2;
    onParamChange("xa", roundX);
    onParamChange("ya", roundY);
  };

  // 拖拽 B 点 (数学坐标)
  const handleDragPointB = (pt: { x: number; y: number }) => {
    const roundX = Math.round(pt.x * 2) / 2;
    const roundY = Math.round(pt.y * 2) / 2;
    onParamChange("xb", roundX);
    onParamChange("yb", roundY);
  };

  // 拖拽 C 点 (数学坐标，反向求出系数 x, y 并强联动左屏)
  const handleDragPointC = (pt: { x: number; y: number }) => {
    if (lockCollinear) {
      // 锁定 x + y = 1: 解算 C 在向量 AB 方向的投影比例 t
      const abX = b.x - a.x;
      const abY = b.y - a.y;
      const lenSq = abX * abX + abY * abY;
      if (lenSq > 1e-6) {
        const acX = pt.x - a.x;
        const acY = pt.y - a.y;
        const t = Math.max(-1, Math.min(2, (acX * abX + acY * abY) / lenSq));
        const roundY = Math.round(t * 20) / 20; // 0.05 步长
        const roundX = Math.round((1 - roundY) * 100) / 100;
        onParamChange("xCoeff", roundX);
        onParamChange("yCoeff", roundY);
      }
    } else {
      // 自由模式: C = x*A + y*B (解二元一次方程组)
      const det = a.x * b.y - a.y * b.x;
      if (Math.abs(det) > 1e-4) {
        const x = (pt.x * b.y - pt.y * b.x) / det;
        const y = (a.x * pt.y - a.y * pt.x) / det;
        const roundX = Math.round(x * 20) / 20;
        const roundY = Math.round(y * 20) / 20;
        onParamChange("xCoeff", roundX);
        onParamChange("yCoeff", roundY);
      }
    }
  };

  // 模式三拖拽目标向量 V (数学坐标)
  const handleDragPointV = (pt: { x: number; y: number }) => {
    const roundX = Math.round(pt.x * 2) / 2;
    const roundY = Math.round(pt.y * 2) / 2;
    onParamChange("xv", roundX);
    onParamChange("yv", roundY);
  };

  return (
    <g>
      {/* 1. 坐标轴网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 2. 原点标注 O */}
      <text
        x={originDesign.x - fontScale(14)}
        y={originDesign.y + fontScale(16)}
        fill={MATH_COLORS.textMuted}
        fontSize={fontScale(13)}
        fontWeight="600"
      >
        O
      </text>

      {/* ===================== 模式一：加减与数乘 ===================== */}
      {studyMode === "linearCombo" && (
        <>
          {/* 平行四边形虚线边 1: lambdaA 到 sumVec */}
          <line
            x1={lambdaADesign.x}
            y1={lambdaADesign.y}
            x2={sumDesign.x}
            y2={sumDesign.y}
            stroke={withAlpha(MATH_COLORS.paramSecondary, 0.6)}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />

          {/* 平行四边形虚线边 2: muB 到 sumVec */}
          <line
            x1={muBDesign.x}
            y1={muBDesign.y}
            x2={sumDesign.x}
            y2={sumDesign.y}
            stroke={withAlpha(MATH_COLORS.paramPrimary, 0.6)}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />

          {/* 数乘向量 λa */}
          {Math.abs((params.lambda ?? 1) - 1) > 1e-4 && (
            <VectorArrow
              from={[0, 0]}
              to={[lambdaA.x, lambdaA.y]}
              scale={scale}
              color={withAlpha(MATH_COLORS.paramPrimary, 0.7)}
              strokeWidth={2}
              strokeDasharray="6,3"
            />
          )}

          {/* 数乘向量 μb */}
          {Math.abs((params.mu ?? 1) - 1) > 1e-4 && (
            <VectorArrow
              from={[0, 0]}
              to={[muB.x, muB.y]}
              scale={scale}
              color={withAlpha(MATH_COLORS.paramSecondary, 0.7)}
              strokeWidth={2}
              strokeDasharray="6,3"
            />
          )}

          {/* 差向量 d = a - b (从 B 点指向 A 点) */}
          <VectorArrow
            from={[b.x, b.y]}
            to={[a.x, a.y]}
            scale={scale}
            color={MATH_COLORS.accent}
            strokeWidth={2.5}
            fontScale={fontScale}
            label={`d = a - b (${diffVec.x.toFixed(1)}, ${diffVec.y.toFixed(1)})`}
          />

          {/* 合成向量 s = λa + μb */}
          <VectorArrow
            from={[0, 0]}
            to={[sumVec.x, sumVec.y]}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={3.5}
            fontScale={fontScale}
            label={`s = λa + μb (${sumVec.x.toFixed(1)}, ${sumVec.y.toFixed(1)})`}
          />

          {/* 基础向量 a */}
          <VectorArrow
            from={[0, 0]}
            to={[a.x, a.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={3}
            fontScale={fontScale}
            label={`a (${a.x}, ${a.y})`}
          />

          {/* 基础向量 b */}
          <VectorArrow
            from={[0, 0]}
            to={[b.x, b.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={3}
            fontScale={fontScale}
            label={`b (${b.x}, ${b.y})`}
          />

          {/* 交互控制点 A 和 B */}
          <InteractivePoint
            cx={a.x}
            cy={a.y}
            scale={scale}
            vp={vp}
            onDrag={handleDragPointA}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
            label="A"
          />
          <InteractivePoint
            cx={b.x}
            cy={b.y}
            scale={scale}
            vp={vp}
            onDrag={handleDragPointB}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
            label="B"
          />
        </>
      )}

      {/* ===================== 模式二：共线与三点共线 ===================== */}
      {studyMode === "collinear" && (
        <>
          {/* 直线 AB 全长延长虚线 */}
          {Math.hypot(a.x - b.x, a.y - b.y) > 1e-4 && (
            <line
              x1={posADesign.x - (posBDesign.x - posADesign.x) * 4}
              y1={posADesign.y - (posBDesign.y - posADesign.y) * 4}
              x2={posBDesign.x + (posBDesign.x - posADesign.x) * 4}
              y2={posBDesign.y + (posBDesign.y - posADesign.y) * 4}
              stroke={withAlpha(MATH_COLORS.paramPrimary, 0.35)}
              strokeWidth={2}
              strokeDasharray="6,4"
            />
          )}

          {/* 线段 AB */}
          <VectorArrow
            from={[a.x, a.y]}
            to={[b.x, b.y]}
            scale={scale}
            color={withAlpha(MATH_COLORS.paramPrimary, 0.6)}
            strokeWidth={2}
          />

          {/* 向量 OA */}
          <VectorArrow
            from={[0, 0]}
            to={[a.x, a.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            fontScale={fontScale}
            label="OA"
          />

          {/* 向量 OB */}
          <VectorArrow
            from={[0, 0]}
            to={[b.x, b.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
            fontScale={fontScale}
            label="OB"
          />

          {/* 向量 OC = x*OA + y*OB */}
          <VectorArrow
            from={[0, 0]}
            to={[pointC.x, pointC.y]}
            scale={scale}
            color={
              Math.abs(coeffSum - 1) < 1e-4
                ? MATH_COLORS.paramTertiary
                : MATH_COLORS.accent
            }
            strokeWidth={3}
            fontScale={fontScale}
            label={`OC (x+y=${coeffSum.toFixed(2)})`}
          />

          {/* 可拖拽控制点 C (双向联动 x, y 参数) */}
          <InteractivePoint
            cx={pointC.x}
            cy={pointC.y}
            scale={scale}
            vp={vp}
            onDrag={handleDragPointC}
            color={
              Math.abs(coeffSum - 1) < 1e-4
                ? MATH_COLORS.paramTertiary
                : MATH_COLORS.accent
            }
            fontScale={fontScale}
            label={`C(${pointC.x.toFixed(1)}, ${pointC.y.toFixed(1)})`}
          />

          {/* 交互控制点 A 和 B */}
          <InteractivePoint
            cx={a.x}
            cy={a.y}
            scale={scale}
            vp={vp}
            onDrag={handleDragPointA}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
            label="A"
          />
          <InteractivePoint
            cx={b.x}
            cy={b.y}
            scale={scale}
            vp={vp}
            onDrag={handleDragPointB}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
            label="B"
          />
        </>
      )}

      {/* ===================== 模式三：平面向量基本定理 decomposition ===================== */}
      {studyMode === "basis" && (
        <>
          {isBasisValid ? (
            <>
              {/* 分解平行四边形虚线 1: λ1*e1 到 V */}
              <line
                x1={basisComp1Design.x}
                y1={basisComp1Design.y}
                x2={targetVDesign.x}
                y2={targetVDesign.y}
                stroke={withAlpha(MATH_COLORS.paramSecondary, 0.7)}
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />

              {/* 分解平行四边形虚线 2: λ2*e2 到 V */}
              <line
                x1={basisComp2Design.x}
                y1={basisComp2Design.y}
                x2={targetVDesign.x}
                y2={targetVDesign.y}
                stroke={withAlpha(MATH_COLORS.paramPrimary, 0.7)}
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />

              {/* 分解分量 1: λ1*e1 */}
              <VectorArrow
                from={[0, 0]}
                to={[basisComponent1.x, basisComponent1.y]}
                scale={scale}
                color={withAlpha(MATH_COLORS.paramPrimary, 0.8)}
                strokeWidth={2.5}
                strokeDasharray="5,3"
                fontScale={fontScale}
                label={`λ1*e1 (${lambda1.toFixed(2)})`}
              />

              {/* 分解分量 2: λ2*e2 */}
              <VectorArrow
                from={[0, 0]}
                to={[basisComponent2.x, basisComponent2.y]}
                scale={scale}
                color={withAlpha(MATH_COLORS.paramSecondary, 0.8)}
                strokeWidth={2.5}
                strokeDasharray="5,3"
                fontScale={fontScale}
                label={`λ2*e2 (${lambda2.toFixed(2)})`}
              />
            </>
          ) : (
            /* 基底退化共线警示线 */
            <text
              x={originDesign.x}
              y={originDesign.y - fontScale(20)}
              fill={MATH_COLORS.highlight}
              fontSize={fontScale(14)}
              fontWeight="bold"
              textAnchor="middle"
            >
              ⚠️ 基底 e1 与 e2 共线，无法构成有效基底！
            </text>
          )}

          {/* 目标向量 v */}
          <VectorArrow
            from={[0, 0]}
            to={[targetVecV.x, targetVecV.y]}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={3.5}
            fontScale={fontScale}
            label={`v (${targetVecV.x}, ${targetVecV.y})`}
          />

          {/* 基底向量 e1 */}
          <VectorArrow
            from={[0, 0]}
            to={[a.x, a.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={3}
            fontScale={fontScale}
            label="e1"
          />

          {/* 基底向量 e2 */}
          <VectorArrow
            from={[0, 0]}
            to={[b.x, b.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={3}
            fontScale={fontScale}
            label="e2"
          />

          {/* 控制点 e1, e2 及 目标 V */}
          <InteractivePoint
            cx={a.x}
            cy={a.y}
            scale={scale}
            vp={vp}
            onDrag={handleDragPointA}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
            label="e1"
          />
          <InteractivePoint
            cx={b.x}
            cy={b.y}
            scale={scale}
            vp={vp}
            onDrag={handleDragPointB}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
            label="e2"
          />
          <InteractivePoint
            cx={targetVecV.x}
            cy={targetVecV.y}
            scale={scale}
            vp={vp}
            onDrag={handleDragPointV}
            color={MATH_COLORS.paramTertiary}
            fontScale={fontScale}
            label="V"
          />
        </>
      )}
    </g>
  );
};
