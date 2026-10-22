import React from "react";
import {
  CoordinateGrid,
  VectorArrow,
  InteractivePoint,
} from "@/components/Math";
import { MATH_COLORS } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { paramDragRange, snapDragValue } from "@/utils/paramClamp";
import type { SceneScale } from "@/hooks";
import type { ViewportInfo } from "@/utils/useViewport";
import { paramMeta } from "@/data/registries/vectorLinear";
import {
  computeVectorLinear,
  type VectorLinearParams,
} from "@/math/vectorLinear";
import { formatMathNumber } from "@/utils/mathFormat";

/**
 * 直角坐标运算的四个考察动作（必修二 6.3 平面向量基本定理及坐标表示）。
 *
 * add      —— a + b = (x₁+x₂, y₁+y₂)：平行四边形对角线，分量各自相加
 * sub      —— a − b = (x₁−x₂, y₁−y₂)：由 b 的终点指向 a 的终点
 * scalar   —— λa = (λx₁, λy₁)：数乘只改分量，不改方向（λ<0 反向）
 * collinear—— x₁y₂ − x₂y₁ = 0 ⟺ a ∥ b：共线判据的坐标形态
 */
export type VectorCoordinateOp = "add" | "sub" | "scalar" | "collinear";

interface VectorCoordinateSceneProps {
  params: VectorLinearParams;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  op: VectorCoordinateOp;
  onParamChange: (key: string, value: number) => void;
  onBatchParamsChange?: (updates: Record<string, number>) => void;
}

/** 端点坐标读数：SVG 纯文本，不带 KaTeX 定界符（画布层约定同 VectorLinearScene） */
function coordText(x: number, y: number): string {
  return `(${formatMathNumber(x)}, ${formatMathNumber(y)})`;
}

export const VectorCoordinateScene: React.FC<VectorCoordinateSceneProps> = ({
  params,
  scale,
  vp,
  fontScale,
  op,
  onParamChange,
  onBatchParamsChange,
}) => {
  const res = computeVectorLinear({ ...params });
  const { a, b, sumAB, diffVec, detAB, isCollinearAB } = res;

  const lambda = params.lambda ?? 1;
  const scaledA = { x: lambda * a.x, y: lambda * a.y };

  // 拖拽钳制区间 = paramMeta 声明域 ∩ 可见视口（SSOT 见 utils/paramClamp），
  // 避免把端点拖到画布外的死区里。
  const xRange = paramDragRange(paramMeta.xa, scale, "x");
  const yRange = paramDragRange(paramMeta.ya, scale, "y");

  const applyDrag = (updates: Record<string, number>) => {
    if (onBatchParamsChange) {
      onBatchParamsChange(updates);
      return;
    }
    Object.entries(updates).forEach(([k, v]) => onParamChange(k, v));
  };

  /**
   * 拖拽 a / b 的终点：两坐标必须**原子**更新。
   * 逐键 onParamChange 会让两个 setParams 各自基于同一份旧 state，
   * 后一次覆盖前一次 —— 拖对角线时向量只在一个轴上动。
   */
  const handleDragTip = (keys: {
    x: string;
    y: string;
  }): ((pt: { x: number; y: number }) => void) => {
    return (pt) => {
      applyDrag({
        [keys.x]: snapDragValue(pt.x, paramMeta[keys.x].step ?? 0.5, xRange),
        [keys.y]: snapDragValue(pt.y, paramMeta[keys.y].step ?? 0.5, yRange),
      });
    };
  };

  const ptA = mathToDesign(a.x, a.y, scale);
  const ptB = mathToDesign(b.x, b.y, scale);
  const ptSum = mathToDesign(sumAB.x, sumAB.y, scale);
  const ptDiffEnd = mathToDesign(diffVec.x, diffVec.y, scale);
  const ptScaledA = mathToDesign(scaledA.x, scaledA.y, scale);

  /** 结果向量的箭头：按 op 决定画哪一条，颜色一律取 vectorResult（与 a / b 区分） */
  const resultArrow = (() => {
    if (op === "add") {
      return (
        <VectorArrow
          from={[0, 0]}
          to={[sumAB.x, sumAB.y]}
          scale={scale}
          color={MATH_COLORS.vectorResult}
          strokeWidth={2.4}
          label="a+b"
          labelSize={12}
          fontScale={fontScale}
        />
      );
    }
    if (op === "sub") {
      return (
        <VectorArrow
          from={[b.x, b.y]}
          to={[a.x, a.y]}
          scale={scale}
          color={MATH_COLORS.vectorResult}
          strokeWidth={2.4}
          label="a−b"
          labelSize={12}
          fontScale={fontScale}
        />
      );
    }
    if (op === "scalar") {
      return (
        <VectorArrow
          from={[0, 0]}
          to={[scaledA.x, scaledA.y]}
          scale={scale}
          color={MATH_COLORS.vectorResult}
          strokeWidth={2.4}
          label={`${formatMathNumber(lambda)}a`}
          labelSize={12}
          fontScale={fontScale}
        />
      );
    }
    return null;
  })();

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 平行四边形辅助虚线：把「分量各自相加」画成两条平移边 */}
      {op === "add" && (
        <>
          <line
            x1={ptA.x}
            y1={ptA.y}
            x2={ptSum.x}
            y2={ptSum.y}
            stroke={MATH_COLORS.vectorResult}
            strokeWidth={1.2}
            strokeDasharray="5 4"
            opacity={0.55}
          />
          <line
            x1={ptB.x}
            y1={ptB.y}
            x2={ptSum.x}
            y2={ptSum.y}
            stroke={MATH_COLORS.vectorResult}
            strokeWidth={1.2}
            strokeDasharray="5 4"
            opacity={0.55}
          />
        </>
      )}

      {/* 共线情景：把 a 所在的直线整条画出来，让「a 的倍数」一眼可辨 */}
      {op === "collinear" && (
        <line
          x1={mathToDesign(-2 * a.x, -2 * a.y, scale).x}
          y1={mathToDesign(-2 * a.x, -2 * a.y, scale).y}
          x2={mathToDesign(2 * a.x, 2 * a.y, scale).x}
          y2={mathToDesign(2 * a.x, 2 * a.y, scale).y}
          stroke={MATH_COLORS.asymptote}
          strokeWidth={1.2}
          strokeDasharray="6 4"
        />
      )}

      <VectorArrow
        from={[0, 0]}
        to={[a.x, a.y]}
        scale={scale}
        color={MATH_COLORS.vectorPrimary}
        strokeWidth={2.4}
        label="a"
        labelSize={12}
        fontScale={fontScale}
      />
      <VectorArrow
        from={[0, 0]}
        to={[b.x, b.y]}
        scale={scale}
        color={MATH_COLORS.vectorSecondary}
        strokeWidth={2.4}
        label="b"
        labelSize={12}
        fontScale={fontScale}
      />

      {resultArrow}

      {/* 端点坐标读数：把「点的坐标」与「向量的坐标」显式并置 */}
      {(
        [
          {
            key: "A",
            pt: ptA,
            x: a.x,
            y: a.y,
            color: MATH_COLORS.vectorPrimary,
          },
          {
            key: "B",
            pt: ptB,
            x: b.x,
            y: b.y,
            color: MATH_COLORS.vectorSecondary,
          },
        ] as const
      ).map((item) => (
        <text
          key={item.key}
          x={item.pt.x + 10}
          y={item.pt.y - 8}
          fontSize={fontScale(11)}
          fill={item.color}
        >
          {coordText(item.x, item.y)}
        </text>
      ))}

      {op === "add" && (
        <text
          x={ptSum.x + 10}
          y={ptSum.y - 8}
          fontSize={fontScale(11)}
          fill={MATH_COLORS.vectorResult}
        >
          {coordText(sumAB.x, sumAB.y)}
        </text>
      )}

      {op === "sub" && (
        <text
          x={ptDiffEnd.x + 10}
          y={ptDiffEnd.y - 8}
          fontSize={fontScale(11)}
          fill={MATH_COLORS.vectorResult}
        >
          {coordText(diffVec.x, diffVec.y)}
        </text>
      )}

      {op === "scalar" && (
        <text
          x={ptScaledA.x + 10}
          y={ptScaledA.y - 8}
          fontSize={fontScale(11)}
          fill={MATH_COLORS.vectorResult}
        >
          {coordText(scaledA.x, scaledA.y)}
        </text>
      )}

      {/* 共线判据读数：det 的数值与符号并列，学生看得到「等于 0」的那一刻 */}
      {op === "collinear" && (
        <text
          x={mathToDesign(0, 0, scale).x + 12}
          y={mathToDesign(0, 0, scale).y + fontScale(46)}
          fontSize={fontScale(12)}
          fill={isCollinearAB ? MATH_COLORS.degeneracy : MATH_COLORS.labelText}
        >
          {`x1y2 − x2y1 = ${formatMathNumber(detAB)} ${
            isCollinearAB ? "（共线）" : "（不共线）"
          }`}
        </text>
      )}

      <InteractivePoint
        cx={a.x}
        cy={a.y}
        scale={scale}
        vp={vp}
        axis="both"
        xRange={xRange}
        yRange={yRange}
        onDrag={handleDragTip({ x: "xa", y: "ya" })}
      />
      <InteractivePoint
        cx={b.x}
        cy={b.y}
        scale={scale}
        vp={vp}
        axis="both"
        xRange={xRange}
        yRange={yRange}
        onDrag={handleDragTip({ x: "xb", y: "yb" })}
      />
    </g>
  );
};
