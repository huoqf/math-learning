import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CoordinateGrid, InteractivePoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { analyzeSubsetHierarchy } from "@/math/set";

interface SubsetHierarchySceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
}

/**
 * 子集与真子集层级视图。
 *
 * 教学内核只有一个：⊆ 与 ⊊ 的差别就是「B 中有没有 A 拿不到的元素」。
 * 因此画面不渲染阴影运算，而是把这一差别的**见证点**画出来：
 *   A ⊊ B 时，在 B 内、A 外固定放一个见证点 W，
 *   它就是在卷面上「存在 x ∈ B, x ∉ A」那句话的物证。
 * 外切时把唯一的切点 M 单独标出，提醒交集是单点而非空集。
 */
export function SubsetHierarchyScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
}: SubsetHierarchySceneProps) {
  const xA = params.xA ?? -1.2;
  const yA = params.yA ?? 0.0;
  const rA = Math.max(0, params.rA ?? 2.2);
  const xB = params.xB ?? 1.2;
  const yB = params.yB ?? 0.0;
  const rB = Math.max(0, params.rB ?? 2.2);

  const hierarchy = React.useMemo(
    () =>
      analyzeSubsetHierarchy({ x: xA, y: yA, r: rA }, { x: xB, y: yB, r: rB }),
    [xA, yA, rA, xB, yB, rB],
  );

  const posA = mathToDesign(xA, yA, scale);
  const posB = mathToDesign(xB, yB, scale);
  const radiusAInPx = rA * scale.scaleX;
  const radiusBInPx = rB * scale.scaleX;

  const d = hierarchy.distance;
  // 从 O_A 指向 O_B 的单位向量；两点重合时取水平方向，避免除零
  const ux = d > 1e-9 ? (xB - xA) / d : 1;
  const uy = d > 1e-9 ? (yB - yA) / d : 0;

  // 见证点：在 O_A 沿 u 方向走 t = (r_A + d + r_B)/2
  //   t > r_A  ⇒ 落在 A 之外
  //   t ≤ d + r_B ⇒ 落在 B 的最远方向上，即 B 之内
  const tWitness = (rA + d + rB) / 2;
  const witnessA = {
    x: xA + tWitness * ux,
    y: yA + tWitness * uy,
  };
  // B ⊊ A 时的对称见证点：从 O_B 沿 −u 走同样构造的距离
  const witnessB = {
    x: xB - tWitness * ux,
    y: yB - tWitness * uy,
  };

  // 外切切点：在 O_A 上取半径方向
  const tangentPoint = { x: xA + rA * ux, y: yA + rA * uy };

  const showWitnessFor =
    hierarchy.aProperSubsetB && !hierarchy.bProperSubsetA
      ? "B"
      : hierarchy.bProperSubsetA && !hierarchy.aProperSubsetB
        ? "A"
        : null;
  const witness = showWitnessFor === "B" ? witnessA : witnessB;
  const witnessPos = mathToDesign(witness.x, witness.y, scale);

  const relationBadge =
    hierarchy.relationKind === "equal"
      ? "A = B"
      : hierarchy.relationKind === "a_proper_subset_b"
        ? "A ⊊ B"
        : hierarchy.relationKind === "b_proper_subset_a"
          ? "B ⊊ A"
          : hierarchy.relationKind === "tangent_external"
            ? "A ∩ B = {M}"
            : hierarchy.relationKind === "overlap"
              ? "互不包含 · 交集非空"
              : "A ∩ B = ∅";

  const handleDragA = (mathPt: { x: number; y: number }) => {
    onParamChange("xA", Math.round(mathPt.x * 10) / 10);
    onParamChange("yA", Math.round(mathPt.y * 10) / 10);
  };
  const handleDragB = (mathPt: { x: number; y: number }) => {
    onParamChange("xB", Math.round(mathPt.x * 10) / 10);
    onParamChange("yB", Math.round(mathPt.y * 10) / 10);
  };

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 全集 U 的虚线框：层级链的顶端 */}
      <rect
        x={scale.originX - 5.5 * scale.scaleX}
        y={scale.originY - 3.8 * scale.scaleY}
        width={11 * scale.scaleX}
        height={7.6 * scale.scaleY}
        fill="none"
        stroke={MATH_COLORS.labelText}
        strokeDasharray="6 4"
        strokeWidth={1.5}
        rx={12}
        opacity={0.35}
      />
      <text
        x={scale.originX - 5.3 * scale.scaleX}
        y={scale.originY - 3.3 * scale.scaleY}
        fill={MATH_COLORS.labelText}
        fontSize={fontScale(14)}
        fontWeight="bold"
      >
        全集 U
      </text>

      {/* 被包含的一方用实心淡填充，包含的一方只用描边：内外层次一眼可辨 */}
      {rA > 0 && (
        <circle
          cx={posA.x}
          cy={posA.y}
          r={radiusAInPx}
          fill={withAlpha(MATH_COLORS.setA, 0.12)}
          stroke={MATH_COLORS.setA}
          strokeWidth={2.5}
        />
      )}
      {rB > 0 && (
        <circle
          cx={posB.x}
          cy={posB.y}
          r={radiusBInPx}
          fill={withAlpha(MATH_COLORS.setB, 0.12)}
          stroke={MATH_COLORS.setB}
          strokeWidth={2.5}
        />
      )}

      {/* 集合名 */}
      {rA > 0 && (
        <text
          x={posA.x - radiusAInPx * 0.72}
          y={posA.y - radiusAInPx * 0.72}
          fill={MATH_COLORS.setA}
          fontSize={fontScale(16)}
          fontWeight="extrabold"
        >
          A
        </text>
      )}
      {rB > 0 && (
        <text
          x={posB.x + radiusBInPx * 0.72}
          y={posB.y - radiusBInPx * 0.72}
          fill={MATH_COLORS.setB}
          fontSize={fontScale(16)}
          fontWeight="extrabold"
        >
          B
        </text>
      )}

      {/* 圆心距 d 的连线，仅在两圆分离时显示，避免遮住内部结构 */}
      {rA > 0 && rB > 0 && d > 1e-9 && (
        <line
          x1={posA.x}
          y1={posA.y}
          x2={posB.x}
          y2={posB.y}
          stroke={MATH_COLORS.labelText}
          strokeDasharray="4 4"
          strokeWidth={1}
          opacity={0.55}
        />
      )}

      {/* 真子集的见证点：把「B 中存在 A 拿不到的元素」画成看得见的点 */}
      {showWitnessFor && rA > 0 && rB > 0 && (
        <g>
          <line
            x1={posA.x}
            y1={posA.y}
            x2={witnessPos.x}
            y2={witnessPos.y}
            stroke={MATH_COLORS.paramTertiary}
            strokeDasharray="3 3"
            strokeWidth={1.5}
            opacity={0.85}
          />
          <circle
            cx={witnessPos.x}
            cy={witnessPos.y}
            r={fontScale(5)}
            fill={MATH_COLORS.paramTertiary}
            stroke={CANVAS_COLORS.white}
            strokeWidth={1.5}
          />
          <text
            x={witnessPos.x + fontScale(10)}
            y={witnessPos.y - fontScale(8)}
            fill={MATH_COLORS.paramTertiary}
            fontSize={fontScale(13)}
            fontWeight="bold"
          >
            {showWitnessFor === "B" ? "W ∈ B, W ∉ A" : "W ∈ A, W ∉ B"}
          </text>
        </g>
      )}

      {/* 外切：唯一交点必须单独标出来，否则学生容易误判成「相交为空」 */}
      {hierarchy.relationKind === "tangent_external" && rA > 0 && rB > 0 && (
        <g>
          <circle
            cx={mathToDesign(tangentPoint.x, tangentPoint.y, scale).x}
            cy={mathToDesign(tangentPoint.x, tangentPoint.y, scale).y}
            r={fontScale(6)}
            fill={MATH_COLORS.accent}
            stroke={CANVAS_COLORS.white}
            strokeWidth={1.5}
          />
          <text
            x={mathToDesign(tangentPoint.x, tangentPoint.y, scale).x}
            y={
              mathToDesign(tangentPoint.x, tangentPoint.y, scale).y -
              fontScale(12)
            }
            textAnchor="middle"
            fill={MATH_COLORS.accent}
            fontSize={fontScale(13)}
            fontWeight="bold"
          >
            M
          </text>
        </g>
      )}

      {/* 关系浮标 */}
      <g
        transform={`translate(${scale.originX}, ${scale.originY + 3.7 * scale.scaleY})`}
      >
        <rect
          x={-150}
          y={-17}
          width={300}
          height={34}
          fill={CANVAS_COLORS.white}
          stroke={MATH_COLORS.function}
          strokeWidth={1.5}
          rx={17}
        />
        <text
          x={0}
          y={5}
          textAnchor="middle"
          fill={MATH_COLORS.function}
          fontSize={fontScale(13)}
          fontWeight="bold"
        >
          {`${relationBadge}｜d = ${d.toFixed(2)}，rA + rB = ${(rA + rB).toFixed(2)}`}
        </text>
      </g>

      <InteractivePoint
        cx={xA}
        cy={yA}
        scale={scale}
        vp={vp}
        onDrag={handleDragA}
        color={MATH_COLORS.paramPrimary}
        label="O_A"
        fontScale={fontScale}
      />
      <InteractivePoint
        cx={xB}
        cy={yB}
        scale={scale}
        vp={vp}
        onDrag={handleDragB}
        color={MATH_COLORS.paramSecondary}
        label="O_B"
        fontScale={fontScale}
      />
    </g>
  );
}
