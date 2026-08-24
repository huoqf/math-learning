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

// 计算垂直于向量方向的屏幕法向偏移量 (彻底避免共线向量标签相撞)
function getNormalOffset(
  dx: number,
  dy: number,
  distance: number,
): [number, number] {
  const len = Math.hypot(dx, dy);
  if (len < 1e-4) return [0, -distance];
  // 屏幕坐标系下数学向量 (dx, dy) 映射到屏幕矢量为 (dx, -dy)
  // 其垂直法向量为 (dy, dx)，乘以距离即可得到严格垂直于箭身的偏移
  const nx = dy / len;
  const ny = dx / len;
  return [nx * distance, ny * distance];
}

interface VectorLinearSceneProps {
  params: VectorLinearParams;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  onBatchParamsChange?: (updates: Record<string, number>) => void;
  fontScale: (size: number) => number;
  studyMode: "linearCombo" | "collinear" | "basis";
  lockCollinear?: boolean;
}

export const VectorLinearScene: React.FC<VectorLinearSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  onBatchParamsChange,
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
    pointC,
    targetVecV,
    isBasisValid,
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
    const roundX = Math.max(-5, Math.min(5, Math.round(pt.x * 2) / 2));
    const roundY = Math.max(-5, Math.min(5, Math.round(pt.y * 2) / 2));
    if (onBatchParamsChange) {
      onBatchParamsChange({ xa: roundX, ya: roundY });
    } else {
      onParamChange("xa", roundX);
      onParamChange("ya", roundY);
    }
  };

  // 拖拽 B 点 (数学坐标)
  const handleDragPointB = (pt: { x: number; y: number }) => {
    const roundX = Math.max(-5, Math.min(5, Math.round(pt.x * 2) / 2));
    const roundY = Math.max(-5, Math.min(5, Math.round(pt.y * 2) / 2));
    if (onBatchParamsChange) {
      onBatchParamsChange({ xb: roundX, yb: roundY });
    } else {
      onParamChange("xb", roundX);
      onParamChange("yb", roundY);
    }
  };

  // 拖拽 C 点 (数学坐标，原子更新反求系数 x, y 并强联动左屏)
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
        if (onBatchParamsChange) {
          onBatchParamsChange({ xCoeff: roundX, yCoeff: roundY });
        } else {
          onParamChange("xCoeff", roundX);
          onParamChange("yCoeff", roundY);
        }
      }
    } else {
      // 自由模式: C = x*A + y*B (解二元一次方程组)
      const det = a.x * b.y - a.y * b.x;
      if (Math.abs(det) > 1e-4) {
        const rawX = (pt.x * b.y - pt.y * b.x) / det;
        const rawY = (a.x * pt.y - a.y * pt.x) / det;
        const clampX = Math.max(-1, Math.min(2, Math.round(rawX * 20) / 20));
        const clampY = Math.max(-1, Math.min(2, Math.round(rawY * 20) / 20));
        if (onBatchParamsChange) {
          onBatchParamsChange({ xCoeff: clampX, yCoeff: clampY });
        } else {
          onParamChange("xCoeff", clampX);
          onParamChange("yCoeff", clampY);
        }
      }
    }
  };

  // 模式三拖拽目标向量 V (数学坐标)
  const handleDragPointV = (pt: { x: number; y: number }) => {
    const roundX = Math.max(-5, Math.min(5, Math.round(pt.x * 2) / 2));
    const roundY = Math.max(-5, Math.min(5, Math.round(pt.y * 2) / 2));
    if (onBatchParamsChange) {
      onBatchParamsChange({ xv: roundX, yv: roundY });
    } else {
      onParamChange("xv", roundX);
      onParamChange("yv", roundY);
    }
  };

  return (
    <g>
      {/* 1. 坐标轴网格 (内置标准原点 O，无需重复渲染) */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

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

          {/* 数乘向量 λa (沿法向正向偏移，与 a 严格错开两侧) */}
          {Math.abs((params.lambda ?? 1) - 1) > 1e-4 && (
            <VectorArrow
              from={[0, 0]}
              to={[lambdaA.x, lambdaA.y]}
              scale={scale}
              color={withAlpha(MATH_COLORS.paramPrimary, 0.75)}
              strokeWidth={2}
              strokeDasharray="5,3"
              fontScale={fontScale}
              label="λa"
              labelOffset={getNormalOffset(a.x, a.y, 15)}
            />
          )}

          {/* 数乘向量 μb (沿法向正向偏移，与 b 严格错开两侧) */}
          {Math.abs((params.mu ?? 1) - 1) > 1e-4 && (
            <VectorArrow
              from={[0, 0]}
              to={[muB.x, muB.y]}
              scale={scale}
              color={withAlpha(MATH_COLORS.paramSecondary, 0.75)}
              strokeWidth={2}
              strokeDasharray="5,3"
              fontScale={fontScale}
              label="μb"
              labelOffset={getNormalOffset(b.x, b.y, 15)}
            />
          )}

          {/* 差向量 d = a - b (三角形减法法则：从减向量终点 B 指向被减向量终点 A) */}
          <VectorArrow
            from={[b.x, b.y]}
            to={[a.x, a.y]}
            scale={scale}
            color={MATH_COLORS.accent}
            strokeWidth={2.5}
            fontScale={fontScale}
            label="a - b"
            labelPositionRatio={0.75}
            labelOffset={getNormalOffset(a.x - b.x, a.y - b.y, 14)}
          />

          {/* 合成向量 s (平行四边形对角线/三角形法则主和向量，标签置于 0.8 处避开差向量交点) */}
          <VectorArrow
            from={[0, 0]}
            to={[sumVec.x, sumVec.y]}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={3.5}
            fontScale={fontScale}
            label={
              Math.abs((params.lambda ?? 1) - 1) < 1e-4 &&
              Math.abs((params.mu ?? 1) - 1) < 1e-4
                ? "a + b"
                : "s"
            }
            labelPositionRatio={0.8}
            labelOffset={getNormalOffset(sumVec.x, sumVec.y, 16)}
          />

          {/* 基础向量 a (沿法向反向偏移) */}
          <VectorArrow
            from={[0, 0]}
            to={[a.x, a.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={3}
            fontScale={fontScale}
            label="a"
            labelPositionRatio={0.55}
            labelOffset={getNormalOffset(a.x, a.y, -15)}
          />

          {/* 基础向量 b (沿法向反向偏移) */}
          <VectorArrow
            from={[0, 0]}
            to={[b.x, b.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={3}
            fontScale={fontScale}
            label="b"
            labelPositionRatio={0.55}
            labelOffset={getNormalOffset(b.x, b.y, -15)}
          />

          {/* 几何顶点交互控制点 A 和 B */}
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
          {/* 直线 AB 全长延长基准线 */}
          {Math.hypot(a.x - b.x, a.y - b.y) > 1e-4 && (
            <line
              x1={posADesign.x - (posBDesign.x - posADesign.x) * 4}
              y1={posADesign.y - (posBDesign.y - posADesign.y) * 4}
              x2={posBDesign.x + (posBDesign.x - posADesign.x) * 4}
              y2={posBDesign.y + (posBDesign.y - posADesign.y) * 4}
              stroke={
                Math.abs(coeffSum - 1) < 1e-4
                  ? withAlpha(MATH_COLORS.paramTertiary, 0.6)
                  : withAlpha(MATH_COLORS.line, 0.35)
              }
              strokeWidth={Math.abs(coeffSum - 1) < 1e-4 ? 2.5 : 1.5}
              strokeDasharray={
                Math.abs(coeffSum - 1) < 1e-4 ? undefined : "6,4"
              }
            />
          )}

          {/* 线段 AB (双向连接虚线) */}
          <line
            x1={posADesign.x}
            y1={posADesign.y}
            x2={posBDesign.x}
            y2={posBDesign.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
            strokeDasharray="4,3"
          />

          {/* 当偏离直线 AB 时，绘制从点 C 到直线 AB 的偏离垂线 */}
          {Math.abs(coeffSum - 1) >= 1e-4 &&
            (() => {
              const abX = b.x - a.x;
              const abY = b.y - a.y;
              const lenSq = abX * abX + abY * abY;
              if (lenSq > 1e-6) {
                const acX = pointC.x - a.x;
                const acY = pointC.y - a.y;
                const t = (acX * abX + acY * abY) / lenSq;
                const projX = a.x + t * abX;
                const projY = a.y + t * abY;
                const projDesign = mathToDesign(projX, projY, scale);
                const cDesign = mathToDesign(pointC.x, pointC.y, scale);
                return (
                  <g>
                    {/* 偏离垂线 */}
                    <line
                      x1={cDesign.x}
                      y1={cDesign.y}
                      x2={projDesign.x}
                      y2={projDesign.y}
                      stroke={MATH_COLORS.highlight}
                      strokeWidth={1.5}
                      strokeDasharray="3,3"
                    />
                    {/* 垂足点 H */}
                    <circle
                      cx={projDesign.x}
                      cy={projDesign.y}
                      r={3}
                      fill={MATH_COLORS.highlight}
                    />
                  </g>
                );
              }
              return null;
            })()}

          {/* 向量 OA */}
          <VectorArrow
            from={[0, 0]}
            to={[a.x, a.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            fontScale={fontScale}
            label="OA"
            labelOffset={getNormalOffset(a.x, a.y, -14)}
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
            labelOffset={getNormalOffset(b.x, b.y, 14)}
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
            strokeWidth={3.5}
            fontScale={fontScale}
            label={
              Math.abs(coeffSum - 1) < 1e-4
                ? "OC (x+y=1)"
                : `OC (x+y=${coeffSum.toFixed(2)}≠1)`
            }
            labelOffset={getNormalOffset(pointC.x, pointC.y, 16)}
          />

          {/* 几何顶点与动点控制点 A, B, C */}
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
            label={
              Math.abs(coeffSum - 1) < 1e-4
                ? Math.abs((params.xCoeff ?? 0.4) - 0.5) < 0.03
                  ? "C (中点)"
                  : "C (共线)"
                : "C (偏离)"
            }
          />
        </>
      )}

      {/* ===================== 模式三：平面向量基本定理 decomposition ===================== */}
      {studyMode === "basis" && (
        <>
          {/* 基底 e1 与 e2 方向斜坐标轴延长线 (贯穿画布) */}
          {isBasisValid && (
            <>
              {/* e1 轴 */}
              <line
                x1={originDesign.x - (posADesign.x - originDesign.x) * 5}
                y1={originDesign.y - (posADesign.y - originDesign.y) * 5}
                x2={originDesign.x + (posADesign.x - originDesign.x) * 5}
                y2={originDesign.y + (posADesign.y - originDesign.y) * 5}
                stroke={withAlpha(MATH_COLORS.paramPrimary, 0.2)}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              {/* e2 轴 */}
              <line
                x1={originDesign.x - (posBDesign.x - originDesign.x) * 5}
                y1={originDesign.y - (posBDesign.y - originDesign.y) * 5}
                x2={originDesign.x + (posBDesign.x - originDesign.x) * 5}
                y2={originDesign.y + (posBDesign.y - originDesign.y) * 5}
                stroke={withAlpha(MATH_COLORS.paramSecondary, 0.2)}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            </>
          )}

          {isBasisValid ? (
            <>
              {/* 分解平行四边形投影辅助虚线 1: λ1*e1 (M点) 到 V */}
              <line
                x1={basisComp1Design.x}
                y1={basisComp1Design.y}
                x2={targetVDesign.x}
                y2={targetVDesign.y}
                stroke={withAlpha(MATH_COLORS.paramSecondary, 0.7)}
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />

              {/* 分解平行四边形投影辅助虚线 2: λ2*e2 (N点) 到 V */}
              <line
                x1={basisComp2Design.x}
                y1={basisComp2Design.y}
                x2={targetVDesign.x}
                y2={targetVDesign.y}
                stroke={withAlpha(MATH_COLORS.paramPrimary, 0.7)}
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />

              {/* 分解基底分量 1: λ1*e1 (严格沿法向正侧偏移，绝不与 e1 相撞) */}
              <VectorArrow
                from={[0, 0]}
                to={[basisComponent1.x, basisComponent1.y]}
                scale={scale}
                color={withAlpha(MATH_COLORS.paramPrimary, 0.85)}
                strokeWidth={2.5}
                strokeDasharray="5,3"
                fontScale={fontScale}
                label="λ₁e₁"
                labelOffset={getNormalOffset(a.x, a.y, 16)}
              />

              {/* 分解基底分量 2: λ2*e2 (严格沿法向正侧偏移，绝不与 e2 相撞) */}
              <VectorArrow
                from={[0, 0]}
                to={[basisComponent2.x, basisComponent2.y]}
                scale={scale}
                color={withAlpha(MATH_COLORS.paramSecondary, 0.85)}
                strokeWidth={2.5}
                strokeDasharray="5,3"
                fontScale={fontScale}
                label="λ₂e₂"
                labelOffset={getNormalOffset(b.x, b.y, 16)}
              />
            </>
          ) : (
            /* 基底退化共线警示线 */
            <text
              x={originDesign.x}
              y={originDesign.y - fontScale(24)}
              fill={MATH_COLORS.highlight}
              fontSize={fontScale(14)}
              fontWeight="bold"
              textAnchor="middle"
            >
              ⚠️ 基底 e₁ 与 e₂ 共线，无法构成有效基底！
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
            label="v"
            labelOffset={getNormalOffset(targetVecV.x, targetVecV.y, 16)}
          />

          {/* 基底向量 e1 (严格沿法向反侧偏移，与 λ1*e1 分居直线两侧) */}
          <VectorArrow
            from={[0, 0]}
            to={[a.x, a.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={3}
            fontScale={fontScale}
            label="e₁"
            labelOffset={getNormalOffset(a.x, a.y, -16)}
          />

          {/* 基底向量 e2 (严格沿法向反侧偏移，与 λ2*e2 分居直线两侧) */}
          <VectorArrow
            from={[0, 0]}
            to={[b.x, b.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={3}
            fontScale={fontScale}
            label="e₂"
            labelOffset={getNormalOffset(b.x, b.y, -16)}
          />

          {/* 交互控制点 E1, E2 及 目标 V */}
          <InteractivePoint
            cx={a.x}
            cy={a.y}
            scale={scale}
            vp={vp}
            onDrag={handleDragPointA}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
            label="E₁"
          />
          <InteractivePoint
            cx={b.x}
            cy={b.y}
            scale={scale}
            vp={vp}
            onDrag={handleDragPointB}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
            label="E₂"
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
