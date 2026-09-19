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
  const clipIdA = useId();
  const clipIdB = useId();
  const maskOnlyAId = useId();
  const maskOnlyBId = useId();
  const maskNotAId = useId();

  // 1. 连续 Venn 模式计算
  const vennRes = useMemo(
    () => calculateVennProbabilities(pA, pB, overlapRatio),
    [pA, pB, overlapRatio],
  );

  // 几何图形半径与圆心推导
  // rA 与 sqrt(pA) 成比例，基准最大半径 2.4
  const rA = Math.max(0.6, Math.sqrt(vennRes.pA) * 2.5);
  const rB = Math.max(0.6, Math.sqrt(vennRes.pB) * 2.5);

  // 距离 d 根据 overlapRatio 插值：
  // 1. 若 P(A)+P(B) <= 1，允许两圆完全分离互斥 (maxDist = rA + rB + 0.5)
  // 2. 若 P(A)+P(B) > 1，两集合在全集中必然相交，最大分离距离受限于相交几何
  const minRequiredOverlap = Math.max(0, vennRes.pA + vennRes.pB - 1);
  const maxSeparation =
    minRequiredOverlap > 0
      ? rA +
        rB -
        (minRequiredOverlap / Math.max(vennRes.pA, vennRes.pB)) *
          Math.min(rA, rB) *
          0.85
      : rA + rB + 0.5;

  const maxDist = Math.max(Math.abs(rA - rB) + 0.2, maxSeparation);
  const minDist = Math.max(0.1, Math.abs(rA - rB) * 0.5);
  const currentDist = maxDist - overlapRatio * (maxDist - minDist);

  // 两圆关于原点 X=0 对称居中，杜绝包含或重合时整体偏左
  const xA = -currentDist / 2;
  const yA = 0;
  const xB = currentDist / 2;
  const yB = 0;

  const posA = mathToDesign(xA, yA, scale);
  const posB = mathToDesign(xB, yB, scale);

  const radiusAInPx = rA * scale.scaleX;
  const radiusBInPx = rB * scale.scaleX;

  // 拖拽 B 的圆心调整重叠度（基于对称中心单调平稳反解，零抖动）
  const handleDragB = (mathPt: { x: number; y: number }) => {
    const clampedDist = Math.max(minDist, Math.min(maxDist, 2 * mathPt.x));
    const newRatio = (maxDist - clampedDist) / (maxDist - minDist);
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
            stroke={MATH_COLORS.axis}
            strokeDasharray="6 4"
            strokeWidth={1.5}
            rx={12}
            opacity={0.6}
          />
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
            opacity={0.85}
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
                      : `运算高亮：对立事件 Aᶜ (P = ${vennRes.pNotA.toFixed(2)})`}
          </text>

          {/* 运算阴影高亮层 */}
          {highlightOp === "union" && (
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

          {highlightOp === "intersection" && (
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
              mask={`url(#${maskOnlyAId})`}
            />
          )}

          {highlightOp === "onlyB" && (
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

          {/* 两圆心连线辅助指示 */}
          <line
            x1={posA.x}
            y1={posA.y}
            x2={posB.x}
            y2={posB.y}
            stroke={withAlpha(MATH_COLORS.axis, 0.35)}
            strokeDasharray="3 3"
            strokeWidth={1}
          />

          {/* 圆 A 实体轮廓 */}
          <circle
            cx={posA.x}
            cy={posA.y}
            r={radiusAInPx}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.12)}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2.2}
          />
          {/* 圆 B 实体轮廓 */}
          <circle
            cx={posB.x}
            cy={posB.y}
            r={radiusBInPx}
            fill={withAlpha(MATH_COLORS.paramSecondary, 0.12)}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2.2}
          />

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
            xRange={[minDist / 2, maxDist / 2]}
            color={MATH_COLORS.paramSecondary}
            onDrag={handleDragB}
          />
          <text
            x={posB.x}
            y={posB.y - fontScale(16)}
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(10)}
            fontWeight="bold"
            textAnchor="middle"
            opacity={0.85}
          >
            ↔ 拖拽圆心
          </text>

          {/* 集合文字标注与实时测度 */}
          <text
            x={posA.x - radiusAInPx * 0.55}
            y={posA.y - fontScale(9)}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(16)}
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
          >
            A
          </text>
          <text
            x={posA.x - radiusAInPx * 0.55}
            y={posA.y + fontScale(11)}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(11)}
            fontWeight="medium"
            textAnchor="middle"
            dominantBaseline="central"
            opacity={0.85}
          >
            P(A) = {vennRes.pA.toFixed(2)}
          </text>

          <text
            x={posB.x + radiusBInPx * 0.55}
            y={posB.y - fontScale(9)}
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(16)}
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
          >
            B
          </text>
          <text
            x={posB.x + radiusBInPx * 0.55}
            y={posB.y + fontScale(11)}
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(11)}
            fontWeight="medium"
            textAnchor="middle"
            dominantBaseline="central"
            opacity={0.85}
          >
            P(B) = {vennRes.pB.toFixed(2)}
          </text>

          {/* 若存在交集且非完全内含，标注交集代号 */}
          {vennRes.pIntersection > 0.05 &&
            currentDist > Math.abs(rA - rB) + 0.3 && (
              <text
                x={(posA.x + posB.x) / 2}
                y={posA.y - fontScale(6)}
                fill={MATH_COLORS.paramTertiary}
                fontSize={fontScale(12)}
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
              >
                A ∩ B
              </text>
            )}
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
            opacity={0.85}
          >
            {highlightOp === "none"
              ? `事件 A: ${diceRes.countA} 点 | 事件 B: ${diceRes.countB} 点 | 交事件: ${diceRes.countIntersection} 点`
              : highlightOp === "union"
                ? `运算高亮：并事件 A ∪ B (包含 ${diceRes.countUnion} 点，P = ${diceRes.countUnion}/36 = ${(diceRes.countUnion / 36).toFixed(2)})`
                : highlightOp === "intersection"
                  ? `运算高亮：交事件 A ∩ B (包含 ${diceRes.countIntersection} 点，P = ${diceRes.countIntersection}/36 = ${(diceRes.countIntersection / 36).toFixed(2)})`
                  : highlightOp === "onlyA"
                    ? `运算高亮：差事件 A - B (包含 ${diceRes.countA - diceRes.countIntersection} 点，P = ${diceRes.countA - diceRes.countIntersection}/36)`
                    : highlightOp === "onlyB"
                      ? `运算高亮：差事件 B - A (包含 ${diceRes.countB - diceRes.countIntersection} 点，P = ${diceRes.countB - diceRes.countIntersection}/36)`
                      : `运算高亮：对立事件 Aᶜ (包含 ${36 - diceRes.countA} 点，P = ${36 - diceRes.countA}/36 = ${((36 - diceRes.countA) / 36).toFixed(2)})`}
          </text>

          {/* 6×6 坐标网格背景与辅助线 */}
          {[1, 2, 3, 4, 5, 6].map((idx) => {
            const mathX = -2.5 + (idx - 1) * 1.0;
            const mathY = -1.5 + (idx - 1) * 0.75;
            const ptX = mathToDesign(mathX, 0, scale);
            const ptY = mathToDesign(0, mathY, scale);

            const gridAxisX = mathToDesign(-2.95, 0, scale).x;
            const gridRightX = mathToDesign(2.75, 0, scale).x;
            const gridAxisY = mathToDesign(0, -1.95, scale).y;
            const gridTopY = mathToDesign(0, 2.45, scale).y;

            return (
              <g key={`grid-line-${idx}`}>
                {/* 内部横向辅助虚线 */}
                <line
                  x1={gridAxisX}
                  y1={ptY.y}
                  x2={gridRightX}
                  y2={ptY.y}
                  stroke={withAlpha(MATH_COLORS.grid, 0.55)}
                  strokeDasharray="2 3"
                  strokeWidth={1}
                />
                {/* 内部纵向辅助虚线 */}
                <line
                  x1={ptX.x}
                  y1={gridTopY}
                  x2={ptX.x}
                  y2={gridAxisY}
                  stroke={withAlpha(MATH_COLORS.grid, 0.55)}
                  strokeDasharray="2 3"
                  strokeWidth={1}
                />

                {/* 横坐标刻度数字 (位于横轴下方安全间距处，穿模率 0) */}
                <text
                  x={ptX.x}
                  y={mathToDesign(0, -2.35, scale).y}
                  fill={MATH_COLORS.axis}
                  fontSize={fontScale(12)}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {idx}
                </text>

                {/* 纵坐标刻度数字 (位于纵轴左侧安全间距处) */}
                <text
                  x={mathToDesign(-3.25, 0, scale).x}
                  y={ptY.y}
                  fill={MATH_COLORS.axis}
                  fontSize={fontScale(12)}
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
            x1={mathToDesign(-2.95, -1.95, scale).x}
            y1={mathToDesign(-2.95, -1.95, scale).y}
            x2={mathToDesign(3.05, -1.95, scale).x}
            y2={mathToDesign(3.05, -1.95, scale).y}
            stroke={MATH_COLORS.axis}
            strokeWidth={1.5}
          />
          <polygon
            points={`
              ${mathToDesign(3.15, -1.95, scale).x},${mathToDesign(3.15, -1.95, scale).y}
              ${mathToDesign(3.02, -1.9, scale).x},${mathToDesign(3.02, -1.9, scale).y}
              ${mathToDesign(3.02, -2.0, scale).x},${mathToDesign(3.02, -2.0, scale).y}
            `}
            fill={MATH_COLORS.axis}
          />

          {/* 标准纵轴 (Y 轴实线 + 箭头) */}
          <line
            x1={mathToDesign(-2.95, -1.95, scale).x}
            y1={mathToDesign(-2.95, -1.95, scale).y}
            x2={mathToDesign(-2.95, 2.65, scale).x}
            y2={mathToDesign(-2.95, 2.65, scale).y}
            stroke={MATH_COLORS.axis}
            strokeWidth={1.5}
          />
          <polygon
            points={`
              ${mathToDesign(-2.95, 2.75, scale).x},${mathToDesign(-2.95, 2.75, scale).y}
              ${mathToDesign(-2.9, 2.62, scale).x},${mathToDesign(-2.9, 2.62, scale).y}
              ${mathToDesign(-3.0, 2.62, scale).x},${mathToDesign(-3.0, 2.62, scale).y}
            `}
            fill={MATH_COLORS.axis}
          />

          {/* 轴向说明标签 (与点位及刻度保持宽裕留白) */}
          <text
            x={mathToDesign(0, 0, scale).x}
            y={mathToDesign(0, -2.85, scale).y}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(13)}
            fontWeight="bold"
            textAnchor="middle"
          >
            骰子 1 点数 x →
          </text>
          <text
            x={mathToDesign(-3.95, 0, scale).x}
            y={mathToDesign(0, 0.35, scale).y}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(13)}
            fontWeight="bold"
            textAnchor="middle"
            transform={`rotate(-90, ${mathToDesign(-3.95, 0, scale).x}, ${mathToDesign(0, 0.35, scale).y})`}
          >
            骰子 2 点数 y →
          </text>

          {/* 36 个基本事件样本点（支持运算高亮聚焦） */}
          {diceRes.points.map((pt: DiceSamplePoint) => {
            const mathX = -2.5 + (pt.x - 1) * 1.0;
            const mathY = -1.5 + (pt.y - 1) * 0.75;
            const designPt = mathToDesign(mathX, mathY, scale);

            // 基础集合归属着色
            let ptColor = withAlpha(MATH_COLORS.axis, 0.35);
            let pointVariant: "solid" | "hollow" = "hollow";

            if (pt.inIntersection) {
              ptColor = MATH_COLORS.paramTertiary;
              pointVariant = "solid";
            } else if (pt.inA) {
              ptColor = MATH_COLORS.paramPrimary;
              pointVariant = "solid";
            } else if (pt.inB) {
              ptColor = MATH_COLORS.paramSecondary;
              pointVariant = "solid";
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

            // 当开启运算高亮时，未命中的点压暗至 0.2，命中的点增加发光环聚焦
            const groupOpacity = isOpActive ? (inCurrentOp ? 1.0 : 0.2) : 1.0;

            return (
              <g key={`dice-pt-${pt.x}-${pt.y}`} opacity={groupOpacity}>
                <title>{`骰子点对 (${pt.x}, ${pt.y}) | 点数之和 = ${pt.sum} | 点数之差 = ${pt.diff}`}</title>
                {/* 基础交集指示环 */}
                {!isOpActive && pt.inIntersection && (
                  <circle
                    cx={designPt.x}
                    cy={designPt.y}
                    r={fontScale(8)}
                    fill="none"
                    stroke={MATH_COLORS.paramTertiary}
                    strokeWidth={1.5}
                    opacity={0.7}
                  />
                )}
                {/* 运算高亮聚焦环 */}
                {isOpActive && inCurrentOp && (
                  <circle
                    cx={designPt.x}
                    cy={designPt.y}
                    r={fontScale(10)}
                    fill={withAlpha(opColor, 0.2)}
                    stroke={opColor}
                    strokeWidth={1.8}
                  />
                )}
                <MathPoint
                  cx={mathX}
                  cy={mathY}
                  scale={scale}
                  color={ptColor}
                  variant={pointVariant}
                />
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};
