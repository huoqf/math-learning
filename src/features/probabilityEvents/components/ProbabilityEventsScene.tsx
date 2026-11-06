import React, { useId, useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { InteractivePoint, MathPoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import type {
  DiceEventPreset,
  DiceSamplePoint,
} from "@/math/probabilityEvents";
import {
  calculateVennProbabilities,
  filterDiceEvents,
} from "@/math/probabilityEvents";

export interface ProbabilityEventsSceneProps {
  activeMode: "venn" | "discrete";
  pA: number;
  pB: number;
  overlapRatio: number;
  dicePresetA: DiceEventPreset;
  dicePresetB: DiceEventPreset;
  highlightOp: "none" | "union" | "intersection" | "onlyA" | "onlyB" | "notA";
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (v: number) => number;
  onParamChange: (key: string, value: number) => void;
}

export const ProbabilityEventsScene: React.FC<ProbabilityEventsSceneProps> = ({
  activeMode,
  pA,
  pB,
  overlapRatio,
  dicePresetA,
  dicePresetB,
  highlightOp,
  scale,
  vp,
  fontScale,
  onParamChange,
}) => {
  const rawClipIdA = useId();
  const rawClipIdB = useId();
  const rawMaskOnlyAId = useId();
  const rawMaskOnlyBId = useId();
  const rawMaskNotAId = useId();

  const clipIdA = rawClipIdA.replace(/:/g, "");
  const clipIdB = rawClipIdB.replace(/:/g, "");
  const maskOnlyAId = rawMaskOnlyAId.replace(/:/g, "");
  const maskOnlyBId = rawMaskOnlyBId.replace(/:/g, "");
  const maskNotAId = rawMaskNotAId.replace(/:/g, "");

  // 1. 连续 Venn 模式计算
  const vennRes = useMemo(
    () => calculateVennProbabilities(pA, pB, overlapRatio),
    [pA, pB, overlapRatio],
  );

  // 几何图形半径与圆心推导
  // rA 与 sqrt(pA) 成比例，基准最大半径 2.35，确保在全集框 9.6×6.4 内留有安全边距
  const rA = Math.max(0.55, Math.sqrt(vennRes.pA) * 2.35);
  const rB = Math.max(0.55, Math.sqrt(vennRes.pB) * 2.35);
  const radiusDiff = Math.abs(rA - rB);
  const radiusSum = rA + rB;

  // 严格对齐数学事件关系与几何相切/内含边界，彻底消除“假互斥”与“假包含”：
  // - 互斥态 (P(A∩B) = 0)：圆心距 d = rA + rB + 0.45 > rA + rB，呈现清晰分离间隙
  // - 真相交态 (0 < P(A∩B) < min(P(A), P(B)))：圆心距严格落在 (|rA - rB| + 0.16, rA + rB - 0.14) 开区间内
  // - 包含/相等态 (overlapRatio = 1)：圆心距 d <= max(0, |rA - rB| - 0.18)，小圆严格内含于大圆内（相等时同心 d = 0）
  const minRequiredOverlap = Math.max(0, vennRes.pA + vennRes.pB - 1);
  const dDisjoint = radiusSum + 0.45;
  const dMaxIntersect =
    minRequiredOverlap > 0
      ? radiusSum -
        0.16 -
        (minRequiredOverlap / Math.max(vennRes.pA, vennRes.pB)) *
          Math.min(rA, rB) *
          0.7
      : radiusSum - 0.14;
  const dMinIntersect = radiusDiff + 0.16;
  const dContained =
    vennRes.relation === "equal" ? 0 : Math.max(0.08, radiusDiff - 0.2);

  let currentDist: number;
  if (vennRes.isMutuallyExclusive) {
    currentDist = dDisjoint;
  } else if (
    vennRes.relation === "subset_A_in_B" ||
    vennRes.relation === "subset_B_in_A" ||
    vennRes.relation === "equal"
  ) {
    currentDist = dContained;
  } else {
    const safeMaxI = Math.max(dMinIntersect + 0.1, dMaxIntersect);
    currentDist = safeMaxI - overlapRatio * (safeMaxI - dMinIntersect);
  }

  // 拖拽范围上下界
  const dragMaxDist =
    minRequiredOverlap > 0
      ? Math.max(dMinIntersect + 0.1, dMaxIntersect)
      : dDisjoint;
  const dragMinDist = dContained;

  // 两圆关于原点 X=0 对称居中；若为对立事件 (B = Ā)，圆 A 居中偏左以展示全集互补分割
  const isOppositeVenn = vennRes.isOpposite;
  const xA = isOppositeVenn ? -0.55 : -currentDist / 2;
  const yA = -0.15;
  const xB = isOppositeVenn ? 2.15 : currentDist / 2;
  const yB = -0.15;

  const posA = mathToDesign(xA, yA, scale);
  const posB = mathToDesign(xB, yB, scale);

  const radiusAInPx = rA * scale.scaleX;
  const radiusBInPx = rB * scale.scaleX;

  // 交集透镜真实水平中心计算：取 [max(xA-rA, xB-rB), min(xA+rA, xB+rB)] 的中点
  const lensLeft = Math.max(xA - rA, xB - rB);
  const lensRight = Math.min(xA + rA, xB + rB);
  const lensWidth = Math.max(0, lensRight - lensLeft);
  const lensCenterX = (lensLeft + lensRight) / 2;
  const posLens = mathToDesign(lensCenterX, yA, scale);

  // 圆 A 与圆 B 标签水平锚点（自适应相交、包含与相等关系，避免文字与圆心重叠）
  const labelPosA = useMemo(() => {
    if (vennRes.relation === "equal") {
      return { x: posA.x, y: posA.y - radiusAInPx * 0.45 };
    }
    if (vennRes.relation === "subset_A_in_B") {
      return { x: posA.x, y: posA.y };
    }
    if (vennRes.relation === "subset_B_in_A") {
      const leftOuter = posA.x - radiusAInPx;
      const leftInner = posB.x - radiusBInPx;
      return { x: (leftOuter + leftInner) / 2, y: posA.y };
    }
    if (isOppositeVenn) {
      return { x: posA.x, y: posA.y };
    }
    return { x: posA.x - radiusAInPx * 0.52, y: posA.y };
  }, [
    vennRes.relation,
    isOppositeVenn,
    posA.x,
    posA.y,
    posB.x,
    radiusAInPx,
    radiusBInPx,
  ]);

  const labelPosB = useMemo(() => {
    if (vennRes.relation === "subset_A_in_B") {
      const rightInner = posA.x + radiusAInPx;
      const rightOuter = posB.x + radiusBInPx;
      return { x: (rightInner + rightOuter) / 2, y: posB.y };
    }
    if (vennRes.relation === "subset_B_in_A") {
      return { x: posB.x, y: posB.y };
    }
    if (isOppositeVenn) {
      return { x: mathToDesign(2.55, yB, scale).x, y: posB.y };
    }
    return { x: posB.x + radiusBInPx * 0.52, y: posB.y };
  }, [
    vennRes.relation,
    isOppositeVenn,
    posA.x,
    posB.x,
    posB.y,
    radiusAInPx,
    radiusBInPx,
    scale,
    yB,
  ]);

  // 拖拽 B 的圆心调整重叠度（基于对称中心单调平稳反解，零抖动）
  const handleDragB = (mathPt: { x: number; y: number }) => {
    const span = Math.max(0.1, dragMaxDist - dragMinDist);
    const clampedDist = Math.max(
      dragMinDist,
      Math.min(dragMaxDist, 2 * mathPt.x),
    );
    const newRatio = (dragMaxDist - clampedDist) / span;
    onParamChange(
      "overlapRatio",
      Math.max(0, Math.min(1, Math.round(newRatio * 100) / 100)),
    );
  };

  // 2. 离散点阵模式计算
  const diceRes = useMemo(
    () => filterDiceEvents(dicePresetA, dicePresetB),
    [dicePresetA, dicePresetB],
  );

  // 全集边框在屏幕坐标下的范围 (两模式统一为 9.6 × 6.4)
  const omegaLeft = scale.originX - 4.8 * scale.scaleX;
  const omegaTop = scale.originY - 3.2 * scale.scaleY;
  const omegaWidth = 9.6 * scale.scaleX;
  const omegaHeight = 6.4 * scale.scaleY;

  return (
    <g className="select-none">
      <defs>
        {/* 圆 A 剪裁路径 */}
        <clipPath id={clipIdA}>
          <circle cx={posA.x} cy={posA.y} r={radiusAInPx} />
        </clipPath>
        {/* 圆 B 剪裁路径 */}
        <clipPath id={clipIdB}>
          <circle cx={posB.x} cy={posB.y} r={radiusBInPx} />
        </clipPath>

        {/* 差集 A - B 镂空蒙版：白圆 A 抠去 黑圆 B */}
        <mask id={maskOnlyAId}>
          <circle
            cx={posA.x}
            cy={posA.y}
            r={radiusAInPx}
            fill={MATH_COLORS.white}
          />
          <circle cx={posB.x} cy={posB.y} r={radiusBInPx} fill="black" />
        </mask>

        {/* 差集 B - A 镂空蒙版：白圆 B 抠去 黑圆 A */}
        <mask id={maskOnlyBId}>
          <circle
            cx={posB.x}
            cy={posB.y}
            r={radiusBInPx}
            fill={MATH_COLORS.white}
          />
          <circle cx={posA.x} cy={posA.y} r={radiusAInPx} fill="black" />
        </mask>

        {/* 补集 not A 镂空蒙版：白全集矩形 抠去 黑圆 A */}
        <mask id={maskNotAId}>
          <rect
            x={omegaLeft}
            y={omegaTop}
            width={omegaWidth}
            height={omegaHeight}
            fill={MATH_COLORS.white}
            rx={12}
          />
          <circle cx={posA.x} cy={posA.y} r={radiusAInPx} fill="black" />
        </mask>
      </defs>

      {/* ── 模式 1：连续 Venn 测度图 ── */}
      {activeMode === "venn" && (
        <g>
          {/* 样本空间 Ω 全景外框 */}
          <rect
            x={omegaLeft}
            y={omegaTop}
            width={omegaWidth}
            height={omegaHeight}
            fill={withAlpha(MATH_COLORS.grid, 0.05)}
            stroke={
              isOppositeVenn ? MATH_COLORS.paramSecondary : MATH_COLORS.axis
            }
            strokeDasharray={isOppositeVenn ? undefined : "6 4"}
            strokeWidth={isOppositeVenn ? 2 : 1.5}
            rx={12}
            opacity={0.75}
          />

          {/* 对立事件专属教材图式 (人教A版必修二图10.1-7)：当 A 与 B 对立 (A∩B=∅ 且 A∪B=Ω) 时，B = Ā 即为 Ω \ A 全域 */}
          {isOppositeVenn && (
            <rect
              x={omegaLeft}
              y={omegaTop}
              width={omegaWidth}
              height={omegaHeight}
              fill={withAlpha(
                MATH_COLORS.paramSecondary,
                highlightOp === "onlyB" || highlightOp === "union"
                  ? 0.26
                  : 0.14,
              )}
              rx={12}
              mask={`url(#${maskNotAId})`}
            />
          )}

          {/* 运算阴影高亮层 */}
          {highlightOp === "union" && !isOppositeVenn && (
            <g>
              <circle
                cx={posA.x}
                cy={posA.y}
                r={radiusAInPx}
                fill={withAlpha(MATH_COLORS.primary, 0.25)}
              />
              <circle
                cx={posB.x}
                cy={posB.y}
                r={radiusBInPx}
                fill={withAlpha(MATH_COLORS.primary, 0.25)}
              />
            </g>
          )}
          {highlightOp === "union" && isOppositeVenn && (
            <rect
              x={omegaLeft}
              y={omegaTop}
              width={omegaWidth}
              height={omegaHeight}
              fill={withAlpha(MATH_COLORS.primary, 0.2)}
              rx={12}
            />
          )}

          {highlightOp === "intersection" && !vennRes.isMutuallyExclusive && (
            <g clipPath={`url(#${clipIdA})`}>
              <circle
                cx={posB.x}
                cy={posB.y}
                r={radiusBInPx}
                fill={withAlpha(MATH_COLORS.paramTertiary, 0.55)}
              />
            </g>
          )}

          {highlightOp === "onlyA" && (
            <circle
              cx={posA.x}
              cy={posA.y}
              r={radiusAInPx}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.4)}
              mask={isOppositeVenn ? undefined : `url(#${maskOnlyAId})`}
            />
          )}

          {highlightOp === "onlyB" && !isOppositeVenn && (
            <circle
              cx={posB.x}
              cy={posB.y}
              r={radiusBInPx}
              fill={withAlpha(MATH_COLORS.paramSecondary, 0.4)}
              mask={`url(#${maskOnlyBId})`}
            />
          )}

          {highlightOp === "notA" && (
            <rect
              x={omegaLeft}
              y={omegaTop}
              width={omegaWidth}
              height={omegaHeight}
              fill={withAlpha(MATH_COLORS.setComplement, 0.22)}
              rx={12}
              mask={`url(#${maskNotAId})`}
            />
          )}

          {/* 顶栏状态说明（置于遮罩层上方以保证文字清晰可读） */}
          <text
            x={omegaLeft + 16}
            y={omegaTop + 24}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(14)}
            fontWeight="bold"
          >
            样本空间 Ω (P(Ω) = 1.00)
          </text>
          <text
            x={omegaLeft + 16}
            y={omegaTop + 44}
            fill={MATH_COLORS.axis}
            fontSize={fontScale(11)}
            opacity={0.9}
          >
            {highlightOp === "none"
              ? `两事件关系：${vennRes.relationText}`
              : highlightOp === "union"
                ? `运算高亮：并事件 A ∪ B (P = ${vennRes.pUnion.toFixed(2)})`
                : highlightOp === "intersection"
                  ? `运算高亮：交事件 A ∩ B (P = ${vennRes.pIntersection.toFixed(2)})`
                  : highlightOp === "onlyA"
                    ? `运算高亮：差事件 A - B (P = ${vennRes.pOnlyA.toFixed(2)})`
                    : highlightOp === "onlyB"
                      ? `运算高亮：差事件 B - A (P = ${vennRes.pDiffBminusA.toFixed(2)})`
                      : `运算高亮：对立事件 Aᶜ (P(Ā) = ${vennRes.pNotA.toFixed(2)})`}
          </text>

          {/* 两圆心连线辅助指示 */}
          {!isOppositeVenn && vennRes.relation !== "equal" && (
            <line
              x1={posA.x}
              y1={posA.y}
              x2={posB.x}
              y2={posB.y}
              stroke={withAlpha(MATH_COLORS.axis, 0.35)}
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          )}

          {/* 圆 A 实体轮廓 */}
          <circle
            cx={posA.x}
            cy={posA.y}
            r={radiusAInPx}
            fill={
              isOppositeVenn
                ? withAlpha(MATH_COLORS.white, 0.88)
                : withAlpha(MATH_COLORS.paramPrimary, 0.12)
            }
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2.2}
          />
          {isOppositeVenn && (
            <circle
              cx={posA.x}
              cy={posA.y}
              r={radiusAInPx}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.15)}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={2.2}
            />
          )}

          {/* 圆 B 实体轮廓（非对立分割态时绘制独立圆 B；相等事件时用虚线双色环示意重合） */}
          {!isOppositeVenn && (
            <circle
              cx={posB.x}
              cy={posB.y}
              r={radiusBInPx}
              fill={withAlpha(MATH_COLORS.paramSecondary, 0.12)}
              stroke={MATH_COLORS.paramSecondary}
              strokeDasharray={vennRes.relation === "equal" ? "6 4" : undefined}
              strokeWidth={2.2}
            />
          )}

          {/* 圆心控制点：A 为基准参考点，B 为可拖拽调节重叠度点（水平锁定 axis='x'） */}
          <MathPoint
            cx={xA}
            cy={yA}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
          />
          <InteractivePoint
            cx={xB}
            cy={yB}
            scale={scale}
            vp={vp}
            axis="x"
            xRange={[dragMinDist / 2, dragMaxDist / 2]}
            color={MATH_COLORS.paramSecondary}
            onDrag={handleDragB}
          />
          <text
            x={posB.x}
            y={posB.y + fontScale(22)}
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(10)}
            fontWeight="bold"
            textAnchor="middle"
            opacity={0.85}
          >
            {isOppositeVenn ? "← 拖拽解除对立" : "↔ 拖拽圆心"}
          </text>

          {/* 集合文字标注与实时测度 */}
          <text
            x={labelPosA.x}
            y={labelPosA.y - fontScale(10)}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(16)}
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {vennRes.relation === "equal" ? "A = B" : "A"}
          </text>
          <text
            x={labelPosA.x}
            y={labelPosA.y + fontScale(10)}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(11)}
            fontWeight="medium"
            textAnchor="middle"
            dominantBaseline="central"
            opacity={0.9}
          >
            P(A) = {vennRes.pA.toFixed(2)}
          </text>

          {vennRes.relation !== "equal" && (
            <>
              <text
                x={labelPosB.x}
                y={labelPosB.y - fontScale(22)}
                fill={MATH_COLORS.paramSecondary}
                fontSize={fontScale(15)}
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {isOppositeVenn ? "B = Ā (补集填满 Ω \\ A)" : "B"}
              </text>
              <text
                x={labelPosB.x}
                y={labelPosB.y - fontScale(4)}
                fill={MATH_COLORS.paramSecondary}
                fontSize={fontScale(11)}
                fontWeight="medium"
                textAnchor="middle"
                dominantBaseline="central"
                opacity={0.9}
              >
                P(B) = {vennRes.pB.toFixed(2)}
              </text>
            </>
          )}

          {/* 若存在一般相交透镜区域，在透镜真实几何中心标注交集代号 A ∩ B */}
          {vennRes.relation === "intersecting" && lensWidth > 0.35 && (
            <text
              x={posLens.x}
              y={posLens.y - fontScale(12)}
              fill={MATH_COLORS.paramTertiary}
              fontSize={fontScale(12)}
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
            >
              A ∩ B
            </text>
          )}

          {/* 底部几何关系直观注记 */}
          <text
            x={scale.originX}
            y={omegaTop + omegaHeight - 14}
            fill={MATH_COLORS.axis}
            fontSize={fontScale(11)}
            textAnchor="middle"
            opacity={0.85}
          >
            {isOppositeVenn
              ? "对立事件图式：A ∩ B = ∅ 且 A ∪ B = Ω（事件 B 即为圆 A 外部的全部样本空间 Ā，无剩余空白）"
              : vennRes.isMutuallyExclusive
                ? `互斥但不对立：A ∩ B = ∅，但全集仍余留空白区域 P(Ω \\ (A∪B)) = ${vennRes.pNeither.toFixed(2)} > 0`
                : vennRes.relation === "subset_A_in_B"
                  ? "包含关系图式：小圆 A 完全内含于大圆 B 内 (A ⊆ B)，必有 A ∩ B = A 且 P(A) ≤ P(B)"
                  : vennRes.relation === "subset_B_in_A"
                    ? "包含关系图式：小圆 B 完全内含于大圆 A 内 (B ⊆ A)，必有 A ∩ B = B 且 P(B) ≤ P(A)"
                    : vennRes.relation === "equal"
                      ? "相等事件图式：两圆同心等径完全重合 (A = B)，A ∪ B = A ∩ B = A"
                      : `广义加法容斥：P(A ∪ B) = P(A) + P(B) - P(A ∩ B) = ${vennRes.pA.toFixed(2)} + ${vennRes.pB.toFixed(2)} - ${vennRes.pIntersection.toFixed(2)} = ${vennRes.pUnion.toFixed(2)}`}
          </text>
        </g>
      )}

      {/* ── 模式 2：掷两骰子 6×6 离散点阵 ── */}
      {activeMode === "discrete" && (
        <g>
          {/* 全集区域外框 (与文氏图全景矩形 9.6 × 6.4 统一) */}
          <rect
            x={omegaLeft}
            y={omegaTop}
            width={omegaWidth}
            height={omegaHeight}
            fill={withAlpha(MATH_COLORS.grid, 0.04)}
            stroke={MATH_COLORS.axis}
            strokeWidth={1.5}
            rx={12}
          />
          {/* 统一顶栏标题与运算动态状态 */}
          <text
            x={omegaLeft + 16}
            y={omegaTop + 24}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(14)}
            fontWeight="bold"
          >
            离散样本空间 Ω (36 种等可能基本事件)
          </text>
          <text
            x={omegaLeft + 16}
            y={omegaTop + 44}
            fill={MATH_COLORS.axis}
            fontSize={fontScale(11)}
            opacity={0.9}
          >
            {highlightOp === "none"
              ? `事件 A: ${diceRes.countA} 点 | 事件 B: ${diceRes.countB} 点 | 交事件: ${diceRes.countIntersection} 点 | 并事件: ${diceRes.countUnion} 点`
              : highlightOp === "union"
                ? `运算高亮：并事件 A ∪ B (包含 ${diceRes.countUnion} 点，P = ${diceRes.countUnion}/36 = ${(diceRes.countUnion / 36).toFixed(2)})`
                : highlightOp === "intersection"
                  ? `运算高亮：交事件 A ∩ B (包含 ${diceRes.countIntersection} 点，P = ${diceRes.countIntersection}/36 = ${(diceRes.countIntersection / 36).toFixed(2)})`
                  : highlightOp === "onlyA"
                    ? `运算高亮：差事件 A - B (包含 ${diceRes.countA - diceRes.countIntersection} 点，P = ${diceRes.countA - diceRes.countIntersection}/36)`
                    : highlightOp === "onlyB"
                      ? `运算高亮：差事件 B - A (包含 ${diceRes.countB - diceRes.countIntersection} 点，P = ${diceRes.countB - diceRes.countIntersection}/36)`
                      : `运算高亮：对立事件 Aᶜ (P(Ā) = ${36 - diceRes.countA}/36 = ${((36 - diceRes.countA) / 36).toFixed(2)})`}
          </text>

          {/* 6×6 坐标网格背景与辅助线 (整体下移且偏左排布，避让顶栏副标题与右上图例) */}
          {[1, 2, 3, 4, 5, 6].map((idx) => {
            const mathX = -2.85 + (idx - 1) * 0.96;
            const mathY = -1.7 + (idx - 1) * 0.66;
            const ptX = mathToDesign(mathX, 0, scale);
            const ptY = mathToDesign(0, mathY, scale);

            const gridAxisX = mathToDesign(-3.4, 0, scale).x;
            const gridRightX = mathToDesign(2.35, 0, scale).x;
            const gridAxisY = mathToDesign(0, -2.08, scale).y;
            const gridTopY = mathToDesign(0, 1.92, scale).y;

            return (
              <g key={`grid-line-${idx}`}>
                {/* 内部横向辅助虚线 */}
                <line
                  x1={gridAxisX}
                  y1={ptY.y}
                  x2={gridRightX}
                  y2={ptY.y}
                  stroke={withAlpha(MATH_COLORS.grid, 0.4)}
                  strokeDasharray="2 3"
                  strokeWidth={1}
                />
                {/* 内部纵向辅助虚线 */}
                <line
                  x1={ptX.x}
                  y1={gridTopY}
                  x2={ptX.x}
                  y2={gridAxisY}
                  stroke={withAlpha(MATH_COLORS.grid, 0.4)}
                  strokeDasharray="2 3"
                  strokeWidth={1}
                />

                {/* 横坐标刻度数字 (第 1 枚骰子点数 x) */}
                <text
                  x={ptX.x}
                  y={mathToDesign(0, -2.32, scale).y}
                  fill={MATH_COLORS.axis}
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {idx}
                </text>

                {/* 纵坐标刻度数字 (第 2 枚骰子点数 y) */}
                <text
                  x={mathToDesign(-3.65, 0, scale).x}
                  y={ptY.y}
                  fill={MATH_COLORS.axis}
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {idx}
                </text>
              </g>
            );
          })}

          {/* 标准横轴 (X 轴实线 + 箭头) */}
          <line
            x1={mathToDesign(-3.4, -2.08, scale).x}
            y1={mathToDesign(-3.4, -2.08, scale).y}
            x2={mathToDesign(2.5, -2.08, scale).x}
            y2={mathToDesign(2.5, -2.08, scale).y}
            stroke={MATH_COLORS.axis}
            strokeWidth={1.5}
          />
          <polygon
            points={`
              ${mathToDesign(2.6, -2.08, scale).x},${mathToDesign(2.6, -2.08, scale).y}
              ${mathToDesign(2.47, -2.03, scale).x},${mathToDesign(2.47, -2.03, scale).y}
              ${mathToDesign(2.47, -2.13, scale).x},${mathToDesign(2.47, -2.13, scale).y}
            `}
            fill={MATH_COLORS.axis}
          />

          {/* 标准纵轴 (Y 轴实线 + 箭头) */}
          <line
            x1={mathToDesign(-3.4, -2.08, scale).x}
            y1={mathToDesign(-3.4, -2.08, scale).y}
            x2={mathToDesign(-3.4, 2.02, scale).x}
            y2={mathToDesign(-3.4, 2.02, scale).y}
            stroke={MATH_COLORS.axis}
            strokeWidth={1.5}
          />
          <polygon
            points={`
              ${mathToDesign(-3.4, 2.12, scale).x},${mathToDesign(-3.4, 2.12, scale).y}
              ${mathToDesign(-3.35, 1.99, scale).x},${mathToDesign(-3.35, 1.99, scale).y}
              ${mathToDesign(-3.45, 1.99, scale).x},${mathToDesign(-3.45, 1.99, scale).y}
            `}
            fill={MATH_COLORS.axis}
          />

          {/* 轴向说明标签 */}
          <text
            x={mathToDesign(-0.45, 0, scale).x}
            y={mathToDesign(0, -2.66, scale).y}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(12)}
            fontWeight="bold"
            textAnchor="middle"
          >
            骰子 1 点数 x →
          </text>
          <text
            x={mathToDesign(-4.15, 0, scale).x}
            y={mathToDesign(0, -0.05, scale).y}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(12)}
            fontWeight="bold"
            textAnchor="middle"
            transform={`rotate(-90, ${mathToDesign(-4.15, 0, scale).x}, ${mathToDesign(0, -0.05, scale).y})`}
          >
            骰子 2 点数 y →
          </text>

          {/* 36 个基本事件样本点卡片格（直观展示点对坐标 (x,y)、点数和与 A/B/AB 集合标签） */}
          {diceRes.points.map((pt: DiceSamplePoint) => {
            const mathX = -2.85 + (pt.x - 1) * 0.96;
            const mathY = -1.7 + (pt.y - 1) * 0.66;
            const designPt = mathToDesign(mathX, mathY, scale);

            const cellW = 54;
            const cellH = 36;
            const cellLeft = designPt.x - cellW / 2;
            const cellTop = designPt.y - cellH / 2;

            // 基础集合归属配色：A 红框、B 橙框、A∩B 绿底+外红框+内橙框（使 A 与 B 包含/重叠一目了然）
            let ptColor = withAlpha(MATH_COLORS.axis, 0.35);
            let pointVariant: "solid" | "hollow" = "hollow";
            let cellFill = withAlpha(MATH_COLORS.white, 0.78);
            let cellStroke: string = withAlpha(MATH_COLORS.axis, 0.28);
            let cellStrokeWidth = 1;
            let badgeText = "";
            let badgeColor: string = MATH_COLORS.axis;

            if (pt.inIntersection) {
              ptColor = MATH_COLORS.paramTertiary;
              pointVariant = "solid";
              cellFill = withAlpha(MATH_COLORS.paramTertiary, 0.18);
              cellStroke = MATH_COLORS.paramPrimary;
              cellStrokeWidth = 2;
              badgeText = "AB";
              badgeColor = MATH_COLORS.paramTertiary;
            } else if (pt.inA) {
              ptColor = MATH_COLORS.paramPrimary;
              pointVariant = "solid";
              cellFill = withAlpha(MATH_COLORS.paramPrimary, 0.13);
              cellStroke = MATH_COLORS.paramPrimary;
              cellStrokeWidth = 1.8;
              badgeText = "A";
              badgeColor = MATH_COLORS.paramPrimary;
            } else if (pt.inB) {
              ptColor = MATH_COLORS.paramSecondary;
              pointVariant = "solid";
              cellFill = withAlpha(MATH_COLORS.paramSecondary, 0.14);
              cellStroke = MATH_COLORS.paramSecondary;
              cellStrokeWidth = 1.8;
              badgeText = "B";
              badgeColor = MATH_COLORS.paramSecondary;
            }

            // 当前运算高亮命中判定
            const isOpActive = highlightOp !== "none";
            let inCurrentOp = false;
            let opColor: string = MATH_COLORS.primary;

            if (highlightOp === "union") {
              inCurrentOp = pt.inUnion;
              opColor = MATH_COLORS.primary;
            } else if (highlightOp === "intersection") {
              inCurrentOp = pt.inIntersection;
              opColor = MATH_COLORS.paramTertiary;
            } else if (highlightOp === "onlyA") {
              inCurrentOp = pt.inA && !pt.inB;
              opColor = MATH_COLORS.paramPrimary;
            } else if (highlightOp === "onlyB") {
              inCurrentOp = pt.inB && !pt.inA;
              opColor = MATH_COLORS.paramSecondary;
            } else if (highlightOp === "notA") {
              inCurrentOp = !pt.inA;
              opColor = MATH_COLORS.setComplement;
            }

            // 当开启运算高亮时，未命中的格子压暗至 0.18，命中的格子高亮聚焦
            const groupOpacity = isOpActive ? (inCurrentOp ? 1.0 : 0.18) : 1.0;
            const coordPairText = `(${pt.x},${pt.y})`;
            const showDiffInfo =
              dicePresetA === "diff_le_1" || dicePresetB === "diff_le_1";
            const subInfoText = showDiffInfo ? `差=${pt.diff}` : `和=${pt.sum}`;

            return (
              <g key={`dice-pt-${pt.x}-${pt.y}`} opacity={groupOpacity}>
                <title>{`骰子点对 (${pt.x}, ${pt.y}) | 点数之和 = ${pt.sum} | 点数之差 = ${pt.diff}`}</title>

                {/* 运算高亮外发光环（不覆盖单元格原有的 A 红 / B 橙 / AB 双框语义色） */}
                {isOpActive && inCurrentOp && (
                  <rect
                    x={cellLeft - 2}
                    y={cellTop - 2}
                    width={cellW + 4}
                    height={cellH + 4}
                    rx={8}
                    fill={
                      highlightOp === "notA" && !pt.inB
                        ? withAlpha(MATH_COLORS.setComplement, 0.16)
                        : "none"
                    }
                    stroke={opColor}
                    strokeWidth={1.8}
                    opacity={0.85}
                  />
                )}

                {/* 样本点方格底座（始终保持 A 红框、B 橙框、AB 绿底特征） */}
                <rect
                  x={cellLeft}
                  y={cellTop}
                  width={cellW}
                  height={cellH}
                  rx={6}
                  fill={cellFill}
                  stroke={cellStroke}
                  strokeWidth={cellStrokeWidth}
                  strokeDasharray={
                    !pt.inUnion && !isOpActive ? "3 2" : undefined
                  }
                />

                {/* 交集格专属双层内框（外红 A + 内橙 B，直观体现同时属于 A 和 B） */}
                {pt.inIntersection && (
                  <rect
                    x={cellLeft + 2.5}
                    y={cellTop + 2.5}
                    width={cellW - 5}
                    height={cellH - 5}
                    rx={4}
                    fill="none"
                    stroke={MATH_COLORS.paramSecondary}
                    strokeWidth={1.5}
                    strokeDasharray="3 2"
                  />
                )}

                {/* 右上角事件归属角标 [A] / [B] / [AB] */}
                {badgeText !== "" && (
                  <text
                    x={cellLeft + cellW - 5}
                    y={cellTop + 10}
                    fill={badgeColor}
                    fontSize={fontScale(8.5)}
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    {badgeText}
                  </text>
                )}

                {/* 左上角原子样本点标识 */}
                <MathPoint
                  cx={mathX - 0.25}
                  cy={mathY + 0.1}
                  scale={scale}
                  color={ptColor}
                  variant={pointVariant}
                  r={2.8}
                />

                {/* 格内主标注：点对坐标 (x,y) */}
                <text
                  x={designPt.x + 2}
                  y={designPt.y - 2}
                  fill={pt.inUnion ? MATH_COLORS.labelText : MATH_COLORS.axis}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {coordPairText}
                </text>

                {/* 格内副标注：点数和 (或差) */}
                <text
                  x={designPt.x}
                  y={designPt.y + 12}
                  fill={
                    pt.inIntersection
                      ? MATH_COLORS.paramTertiary
                      : MATH_COLORS.axis
                  }
                  fontSize={fontScale(8.5)}
                  textAnchor="middle"
                  opacity={0.9}
                >
                  {subInfoText}
                </text>
              </g>
            );
          })}

          {/* 底部读图图解导引栏（明确解释红框 A、橙框 B 与双框绿底 AB 的含义） */}
          <text
            x={scale.originX}
            y={omegaTop + omegaHeight - 12}
            fill={MATH_COLORS.axis}
            fontSize={fontScale(10.5)}
            textAnchor="middle"
            opacity={0.9}
          >
            {highlightOp === "none"
              ? `读图指南：红框[A]属事件 A (${diceRes.countA}格)，橙框[B]属事件 B (${diceRes.countB}格)，红橙双框绿底[AB]为公共交集 (${diceRes.countIntersection}格，同时属于 A 和 B)`
              : highlightOp === "union"
                ? `并事件 A ∪ B：点亮所有含 [A] 或 [B] 的样本格，由容斥原理得 ${diceRes.countA} + ${diceRes.countB} - ${diceRes.countIntersection} = ${diceRes.countUnion} 格`
                : highlightOp === "intersection"
                  ? `交事件 A ∩ B：仅点亮同时满足两事件规则的双框绿底格 [AB]，共 ${diceRes.countIntersection} 格`
                  : highlightOp === "onlyA"
                    ? `差事件 A - B：仅点亮属于 [A] 但不属于 [B] 的純红框格，共 ${diceRes.countA} - ${diceRes.countIntersection} = ${diceRes.countA - diceRes.countIntersection} 格`
                    : highlightOp === "onlyB"
                      ? `差事件 B - A：仅点亮属于 [B] 但不属于 [A] 的纯橙框格，共 ${diceRes.countB} - ${diceRes.countIntersection} = ${diceRes.countB - diceRes.countIntersection} 格`
                      : `对立事件 Ā：点亮全集 36 格中所有不含 [A] 的样本格，共 36 - ${diceRes.countA} = ${36 - diceRes.countA} 格`}
          </text>
        </g>
      )}
    </g>
  );
};
