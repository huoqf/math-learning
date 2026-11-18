import React, { useId, useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { MATH_COLORS, withAlpha } from "@/theme";
import { formatMathProb } from "@/utils/mathFormat";
import type { DiscreteDiceEventKey } from "@/math/probabilityIndependence";
import {
  calculateIndependenceMeasure,
  calculateDiscreteDiceEvents,
  DICE_OUTCOMES,
} from "@/math/probabilityIndependence";

export interface ProbabilityIndependenceSceneProps {
  activeMode: "venn" | "discrete";
  pA: number;
  pB: number;
  overlapRatio: number;
  dicePresetA: DiscreteDiceEventKey;
  dicePresetB: DiscreteDiceEventKey;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (v: number) => number;
}

export const ProbabilityIndependenceScene: React.FC<
  ProbabilityIndependenceSceneProps
> = ({
  activeMode,
  pA,
  pB,
  overlapRatio,
  dicePresetA,
  dicePresetB,
  scale: _scale,
  vp,
  fontScale,
}) => {
  const clipIdA = useId();
  const clipIdB = useId();

  // 1. 连续 Venn 模式计算
  const vennRes = useMemo(
    () => calculateIndependenceMeasure(pA, pB, overlapRatio),
    [pA, pB, overlapRatio],
  );

  // 2. 离散骰子模式计算
  const diceRes = useMemo(
    () => calculateDiscreteDiceEvents(dicePresetA, dicePresetB),
    [dicePresetA, dicePresetB],
  );

  // Venn 几何尺寸换算（设计坐标系居中排布）
  // AnimationSvgCanvas 外层已套 translate(tx ty) scale(s)（见 useViewport），因此本组件内
  // 输出的一律是「设计坐标」；visibleW/H 是容器 CSS 像素，必须经 scale 折算，
  // 否则容器尺寸一变（如 1680×1300 时 s=2）整张图会随之偏移并被裁切。
  const rectOmega = useMemo(() => {
    const w = 740;
    const h = 500;
    const x = vp.designLeft + (vp.designVisibleW - w) / 2;
    const y = vp.designTop + (vp.designVisibleH - h) / 2;
    return { x, y, width: w, height: h };
  }, [vp.designLeft, vp.designTop, vp.designVisibleW, vp.designVisibleH]);

  // 圆半径正比于 sqrt(P)，压缩比例适配左半区 Venn + 右侧 1×1 Eikosogram 并排展示
  const rA = Math.max(46, Math.sqrt(vennRes.pA) * 112);
  const rB = Math.max(46, Math.sqrt(vennRes.pB) * 112);

  // 严格依据交集测度 P(AB) 解算几何两圆心距离（三段契约）：
  const outerD = rA + rB + 28;
  const tangentD = rA + rB;
  const innerD = Math.max(12, Math.abs(rA - rB) + 12);
  const maxPossiblePAB = Math.min(vennRes.pA, vennRes.pB);
  const currentD = vennRes.isMutuallyExclusive
    ? outerD
    : maxPossiblePAB > 1e-4
      ? tangentD - (vennRes.pAB / maxPossiblePAB) * (tangentD - innerD)
      : tangentD;

  const omegaCenterX = rectOmega.x + rectOmega.width / 2;
  const vennCenterX = rectOmega.x + 245;
  const centerY = rectOmega.y + rectOmega.height / 2 + 6;

  const centerAX = vennCenterX - currentD / 2;
  const centerAY = centerY;
  const centerBX = vennCenterX + currentD / 2;
  const centerBY = centerY;

  // 交集标注颜色与左屏图例、右屏 P(AB) 统一绑定 paramTertiary，独立性状态改由顶部胶囊与正交图体现。
  const overlapColor = MATH_COLORS.paramTertiary;
  const lensWidth = Math.max(0, rA + rB - currentD);
  const lensAnchorX = vennCenterX + (rA - rB) / 2;
  const needLeader = !vennRes.isMutuallyExclusive && lensWidth < 26;
  const overlapLabelTopY = needLeader ? centerY - 44 : centerY - 10;

  return (
    <g>
      {/* ── 连续测度模式 ── */}
      {activeMode === "venn" && (
        <g>
          {/* 定义剪裁路径用于高亮相交区域 */}
          <defs>
            <clipPath id={clipIdA}>
              <circle cx={centerAX} cy={centerAY} r={rA} />
            </clipPath>
            <clipPath id={clipIdB}>
              <circle cx={centerBX} cy={centerBY} r={rB} />
            </clipPath>
          </defs>

          {/* 全集矩形底板 */}
          <rect
            x={rectOmega.x}
            y={rectOmega.y}
            width={rectOmega.width}
            height={rectOmega.height}
            rx={16}
            fill={withAlpha(MATH_COLORS.axis, 0.04)}
            stroke={MATH_COLORS.axis}
            strokeWidth={1.5}
            strokeDasharray="6 6"
          />

          {/* 全集标签 */}
          <text
            x={rectOmega.x + 20}
            y={rectOmega.y + 36}
            fontSize={fontScale(14.5)}
            fontWeight="bold"
            fill={MATH_COLORS.axis}
          >
            全集 Ω (P(Ω) = 1)
          </text>

          {/* 状态徽标与测度指示 */}
          <g transform={`translate(${omegaCenterX}, ${rectOmega.y + 36})`}>
            <rect
              x={-150}
              y={-18}
              width={300}
              height={36}
              rx={18}
              fill={
                vennRes.isIndependent
                  ? withAlpha(MATH_COLORS.primary, 0.15)
                  : vennRes.isMutuallyExclusive
                    ? withAlpha(MATH_COLORS.paramPrimary, 0.15)
                    : withAlpha(MATH_COLORS.axis, 0.1)
              }
              stroke={
                vennRes.isIndependent
                  ? MATH_COLORS.primary
                  : vennRes.isMutuallyExclusive
                    ? MATH_COLORS.paramPrimary
                    : MATH_COLORS.axis
              }
              strokeWidth={1.5}
            />
            <text
              x={0}
              y={5}
              textAnchor="middle"
              fontSize={fontScale(14)}
              fontWeight="bold"
              fill={
                vennRes.isMutuallyExclusive
                  ? MATH_COLORS.paramPrimary
                  : vennRes.isIndependent
                    ? MATH_COLORS.primary
                    : MATH_COLORS.labelText
              }
            >
              {vennRes.isMutuallyExclusive
                ? "✕ 互斥事件 (P(AB) = 0，正概率下必不独立)"
                : vennRes.isIndependent
                  ? "★ 相互独立 (P(AB) = P(A)P(B))"
                  : "相关事件 (P(AB) ≠ P(A)P(B))"}
            </text>
          </g>

          {/* 事件 A 填充圆 */}
          <circle
            cx={centerAX}
            cy={centerAY}
            r={rA}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.18)}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
          />

          {/* 事件 B 填充圆 */}
          <circle
            cx={centerBX}
            cy={centerBY}
            r={rB}
            fill={withAlpha(MATH_COLORS.paramSecondary, 0.18)}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
          />

          {/* 相交区域高亮 (用 clipPath 做精确交集) */}
          <g clipPath={`url(#${clipIdA})`}>
            <circle
              cx={centerBX}
              cy={centerBY}
              r={rB}
              fill={withAlpha(overlapColor, 0.45)}
              stroke={overlapColor}
              strokeWidth={2}
            />
          </g>

          {/* 集合 A 文字标签（高重叠或大圆时自适应外移且微调高度防撞 AB） */}
          {(() => {
            const isHighOverlap = lensWidth > Math.min(rA, rB) * 1.1;
            const offsetFactor = isHighOverlap ? 0.62 : 0.45;
            const labelYOffset = isHighOverlap ? -22 : 0;
            return (
              <>
                <text
                  x={centerAX - rA * offsetFactor}
                  y={centerAY + labelYOffset}
                  textAnchor="middle"
                  fontSize={fontScale(18)}
                  fontWeight="bold"
                  fill={MATH_COLORS.paramPrimary}
                >
                  A
                </text>
                <text
                  x={centerAX - rA * offsetFactor}
                  y={centerAY + labelYOffset + 24}
                  textAnchor="middle"
                  fontSize={fontScale(13)}
                  fill={MATH_COLORS.paramPrimary}
                >
                  P(A) = {formatMathProb(vennRes.pA)}
                </text>

                {/* 集合 B 文字标签 */}
                <text
                  x={centerBX + rB * offsetFactor}
                  y={centerBY + labelYOffset}
                  textAnchor="middle"
                  fontSize={fontScale(18)}
                  fontWeight="bold"
                  fill={MATH_COLORS.paramSecondary}
                >
                  B
                </text>
                <text
                  x={centerBX + rB * offsetFactor}
                  y={centerBY + labelYOffset + 24}
                  textAnchor="middle"
                  fontSize={fontScale(13)}
                  fill={MATH_COLORS.paramSecondary}
                >
                  P(B) = {formatMathProb(vennRes.pB)}
                </text>
              </>
            );
          })()}

          {/* 交集文字标注：判据取数学层的 isMutuallyExclusive（P(AB) ≈ 0），
              仅在真正互斥时提示 A ∩ B = ∅；只要 P(AB) > 0 就必须标注交集，
              细窄交集用「质心锚点 + 引线」对位，避免标签浮于两圆之间的空隙。 */}
          {!vennRes.isMutuallyExclusive ? (
            <g>
              <circle cx={lensAnchorX} cy={centerY} r={4} fill={overlapColor} />
              {needLeader && (
                <line
                  x1={lensAnchorX}
                  y1={centerY - 5}
                  x2={vennCenterX}
                  y2={overlapLabelTopY + 8}
                  stroke={overlapColor}
                  strokeWidth={1.2}
                  strokeDasharray="3 2"
                />
              )}
              <text
                x={vennCenterX}
                y={overlapLabelTopY}
                textAnchor="middle"
                fontSize={fontScale(16)}
                fontWeight="bold"
                fill={overlapColor}
              >
                AB
              </text>
              <text
                x={vennCenterX}
                y={overlapLabelTopY + 26}
                textAnchor="middle"
                fontSize={fontScale(13)}
                fill={overlapColor}
              >
                P(AB) = {formatMathProb(vennRes.pAB)}
              </text>
            </g>
          ) : (
            <text
              x={vennCenterX}
              y={centerY}
              textAnchor="middle"
              fontSize={fontScale(14)}
              fontWeight="bold"
              fill={MATH_COLORS.paramPrimary}
            >
              无交集 (A ∩ B = ∅)
            </text>
          )}

          {/* 右侧：1×1 单位正方形正交面积图 (Eikosogram) —— 直观判定高度是否齐平 */}
          {(() => {
            const sqSize = 166;
            const sqX = rectOmega.x + 522;
            const sqY = rectOmega.y + 170;
            const wA = Math.max(0, Math.min(1, vennRes.pA)) * sqSize;
            const wNotA = sqSize - wA;
            const pBGivenA =
              vennRes.pA > 1e-6
                ? Math.max(0, Math.min(1, vennRes.pAB / vennRes.pA))
                : 0;
            const pBGivenNotA =
              1 - vennRes.pA > 1e-6
                ? Math.max(
                    0,
                    Math.min(
                      1,
                      Math.max(0, vennRes.pB - vennRes.pAB) / (1 - vennRes.pA),
                    ),
                  )
                : 0;
            const hA = pBGivenA * sqSize;
            const hNotA = pBGivenNotA * sqSize;
            const hRefB = Math.max(0, Math.min(1, vennRes.pB)) * sqSize;
            const refY = sqY + sqSize - hRefB;
            return (
              <g>
                <text
                  x={sqX + sqSize / 2}
                  y={sqY - 14}
                  textAnchor="middle"
                  fontSize={fontScale(12)}
                  fontWeight="bold"
                  fill={MATH_COLORS.labelText}
                >
                  1×1 单位正方形正交面积图
                </text>
                {/* 单位正方形背景底框 (Ω) */}
                <rect
                  x={sqX}
                  y={sqY}
                  width={sqSize}
                  height={sqSize}
                  fill={MATH_COLORS.white}
                  stroke={MATH_COLORS.axis}
                  strokeWidth={1.5}
                />
                {/* 左侧 A 列中 B|A 条件面积 (等于 P(AB)) */}
                <rect
                  x={sqX}
                  y={sqY + sqSize - hA}
                  width={wA}
                  height={hA}
                  fill={withAlpha(overlapColor, 0.42)}
                  stroke={overlapColor}
                  strokeWidth={1.2}
                />
                {/* 右侧 Ā 列中 B|Ā 条件面积 (等于 P(ĀB)) */}
                <rect
                  x={sqX + wA}
                  y={sqY + sqSize - hNotA}
                  width={wNotA}
                  height={hNotA}
                  fill={withAlpha(MATH_COLORS.paramSecondary, 0.25)}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1}
                />
                {/* A 与 Ā 纵分界线 */}
                <line
                  x1={sqX + wA}
                  y1={sqY}
                  x2={sqX + wA}
                  y2={sqY + sqSize}
                  stroke={MATH_COLORS.labelTextLight}
                  strokeWidth={1.2}
                  strokeDasharray="3 2"
                />
                {/* P(B) 无条件高度参考虚线 */}
                <line
                  x1={sqX - 6}
                  y1={refY}
                  x2={sqX + sqSize + 6}
                  y2={refY}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1.6}
                  strokeDasharray="5 3"
                />
                <text
                  x={sqX - 9}
                  y={refY + 4}
                  textAnchor="end"
                  fontSize={fontScale(9.5)}
                  fontWeight="bold"
                  fill={MATH_COLORS.paramSecondary}
                >
                  P(B)
                </text>
                {/* 柱高读数与底部列标 */}
                <text
                  x={sqX + wA / 2}
                  y={sqY + sqSize + 15}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                  fill={MATH_COLORS.paramPrimary}
                >
                  A
                </text>
                <text
                  x={sqX + wA + wNotA / 2}
                  y={sqY + sqSize + 15}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.textMuted}
                >
                  Ā
                </text>
                <text
                  x={sqX + sqSize / 2}
                  y={sqY + sqSize + 34}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                  fill={
                    vennRes.isIndependent
                      ? MATH_COLORS.primary
                      : MATH_COLORS.labelTextLight
                  }
                >
                  {vennRes.isIndependent
                    ? "两柱齐平 ⇔ 独立"
                    : "高度不等 ⇔ 相关"}
                </text>
              </g>
            );
          })()}

          {/* 条件概率同高标尺对比卡：P(B|A) vs P(B) 直观破除“互斥=独立”迷思 */}
          {(() => {
            const pBGivenA = vennRes.pA > 1e-6 ? vennRes.pAB / vennRes.pA : 0;
            const barMaxW = 100;
            const wBGivenA = Math.max(2, Math.min(1, pBGivenA) * barMaxW);
            const wB = Math.max(2, Math.min(1, vennRes.pB) * barMaxW);
            const cardY = rectOmega.y + rectOmega.height - 46;
            return (
              <g transform={`translate(${omegaCenterX}, ${cardY})`}>
                <rect
                  x={-345}
                  y={-18}
                  width={690}
                  height={42}
                  rx={10}
                  fill={withAlpha(MATH_COLORS.axis, 0.06)}
                  stroke={withAlpha(MATH_COLORS.axis, 0.28)}
                  strokeWidth={1}
                />
                <text
                  x={-330}
                  y={-2}
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                  fill={overlapColor}
                >
                  条件概率 P(B|A) = {formatMathProb(pBGivenA)}
                </text>
                <rect
                  x={-180}
                  y={-11}
                  width={wBGivenA}
                  height={8}
                  rx={4}
                  fill={overlapColor}
                />
                <text
                  x={-330}
                  y={15}
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                  fill={MATH_COLORS.paramSecondary}
                >
                  无条件概率 P(B) = {formatMathProb(vennRes.pB)}
                </text>
                <rect
                  x={-180}
                  y={6}
                  width={wB}
                  height={8}
                  rx={4}
                  fill={MATH_COLORS.paramSecondary}
                />
                <line
                  x1={-180 + wB}
                  y1={-14}
                  x2={-180 + wB}
                  y2={18}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1.2}
                  strokeDasharray="2 2"
                />
                <text
                  x={-60}
                  y={6}
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                  fill={
                    vennRes.isIndependent
                      ? MATH_COLORS.primary
                      : vennRes.isMutuallyExclusive
                        ? MATH_COLORS.paramPrimary
                        : MATH_COLORS.labelText
                  }
                >
                  {vennRes.isIndependent
                    ? "★ 标尺齐平: P(B|A) = P(B) ⇔ A 发生不影响 B（相互独立）"
                    : vennRes.isMutuallyExclusive
                      ? "✕ 互斥时 P(B|A) = 0 ≠ P(B) ⇒ A 发生彻底排斥 B（必不独立）"
                      : "P(B|A) ≠ P(B) ⇒ A 发生改变了 B 的条件概率（相关）"}
                </text>
              </g>
            );
          })()}
        </g>
      )}

      {/* ── 离散掷骰子样本空间模式 ── */}
      {activeMode === "discrete" && (
        <g>
          {/* 底板 */}
          <rect
            x={rectOmega.x}
            y={rectOmega.y}
            width={rectOmega.width}
            height={rectOmega.height}
            rx={16}
            fill={withAlpha(MATH_COLORS.axis, 0.04)}
            stroke={MATH_COLORS.axis}
            strokeWidth={1.5}
          />

          {/* 标题 */}
          <text
            x={rectOmega.x + 24}
            y={rectOmega.y + 36}
            fontSize={fontScale(18)}
            fontWeight="bold"
            fill={MATH_COLORS.axis}
          >
            掷一颗均匀骰子样本空间 Ω = &#123;1, 2, 3, 4, 5, 6&#125;
          </text>

          {/* 状态指示条 */}
          <g
            transform={`translate(${rectOmega.x + rectOmega.width - 180}, ${rectOmega.y + 36})`}
          >
            <rect
              x={-10}
              y={-18}
              width={170}
              height={32}
              rx={16}
              fill={
                diceRes.isIndependent
                  ? withAlpha(MATH_COLORS.primary, 0.15)
                  : diceRes.isMutuallyExclusive
                    ? withAlpha(MATH_COLORS.paramPrimary, 0.15)
                    : withAlpha(MATH_COLORS.axis, 0.1)
              }
              stroke={
                diceRes.isIndependent
                  ? MATH_COLORS.primary
                  : diceRes.isMutuallyExclusive
                    ? MATH_COLORS.paramPrimary
                    : MATH_COLORS.axis
              }
              strokeWidth={1.5}
            />
            <text
              x={75}
              y={3}
              textAnchor="middle"
              fontSize={fontScale(13)}
              fontWeight="bold"
              fill={
                diceRes.isIndependent
                  ? MATH_COLORS.primary
                  : diceRes.isMutuallyExclusive
                    ? MATH_COLORS.paramPrimary
                    : MATH_COLORS.labelText
              }
            >
              {diceRes.isIndependent
                ? "★ 相互独立"
                : diceRes.isMutuallyExclusive
                  ? "✕ 互斥事件"
                  : "相关事件"}
            </text>
          </g>

          {/* 6 个骰子卡片网格（垂直居中展现） */}
          {DICE_OUTCOMES.map((val, idx) => {
            const cardW = 95;
            const cardH = 180;
            const gap = 18;
            const totalW = 6 * cardW + 5 * gap;
            const startX = rectOmega.x + (rectOmega.width - totalW) / 2;
            const posX = startX + idx * (cardW + gap);
            const posY = rectOmega.y + 120;

            const inA = diceRes.outcomesA.includes(val);
            const inB = diceRes.outcomesB.includes(val);
            const inAB = inA && inB;

            let cardStroke: string = MATH_COLORS.axis;
            let cardFill: string = withAlpha(MATH_COLORS.axis, 0.05);

            if (inAB) {
              cardStroke = MATH_COLORS.paramTertiary;
              cardFill = withAlpha(MATH_COLORS.paramTertiary, 0.25);
            } else if (inA) {
              cardStroke = MATH_COLORS.paramPrimary;
              cardFill = withAlpha(MATH_COLORS.paramPrimary, 0.15);
            } else if (inB) {
              cardStroke = MATH_COLORS.paramSecondary;
              cardFill = withAlpha(MATH_COLORS.paramSecondary, 0.15);
            }

            return (
              <g key={val}>
                <rect
                  x={posX}
                  y={posY}
                  width={cardW}
                  height={cardH}
                  rx={14}
                  fill={cardFill}
                  stroke={cardStroke}
                  strokeWidth={inAB ? 3 : inA || inB ? 2 : 1}
                />
                {/* 骰子点数数字 */}
                <text
                  x={posX + cardW / 2}
                  y={posY + 70}
                  textAnchor="middle"
                  fontSize={fontScale(40)}
                  fontWeight="bold"
                  fill={
                    inAB
                      ? MATH_COLORS.paramTertiary
                      : inA
                        ? MATH_COLORS.paramPrimary
                        : inB
                          ? MATH_COLORS.paramSecondary
                          : MATH_COLORS.axis
                  }
                >
                  {val}
                </text>

                {/* 归属徽标 */}
                <g transform={`translate(${posX + cardW / 2}, ${posY + 130})`}>
                  {inAB ? (
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      fontSize={fontScale(14)}
                      fontWeight="bold"
                      fill={MATH_COLORS.paramTertiary}
                    >
                      A ∩ B (交集)
                    </text>
                  ) : inA ? (
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      fontSize={fontScale(14)}
                      fontWeight="bold"
                      fill={MATH_COLORS.paramPrimary}
                    >
                      属于 A
                    </text>
                  ) : inB ? (
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      fontSize={fontScale(14)}
                      fontWeight="bold"
                      fill={MATH_COLORS.paramSecondary}
                    >
                      属于 B
                    </text>
                  ) : (
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      fontSize={fontScale(13)}
                      fill={MATH_COLORS.axis}
                    >
                      余项
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};
