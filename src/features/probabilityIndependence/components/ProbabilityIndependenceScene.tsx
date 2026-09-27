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

  // 圆半径正比于 sqrt(P)
  const rA = Math.max(60, Math.sqrt(vennRes.pA) * 170);
  const rB = Math.max(60, Math.sqrt(vennRes.pB) * 170);

  // 严格依据交集测度 P(AB) 解算几何两圆心距离（三段契约）：
  //  ① P(AB) = 0（互斥）      ⇒ 两圆相离，currentD = rA + rB + 40；
  //  ② P(AB) → 0⁺             ⇒ 两圆恰好外切，currentD = rA + rB（保证「有交集必有交叠」的数形一致）；
  //  ③ P(AB) 达最大重叠 min(pA, pB) ⇒ 两圆最大内聚，currentD = |rA − rB| + 15。
  // 旧实现只在 ① 与 ③ 之间线性插值，导致 P(AB) 低于满量程约 27.6% 时两圆已几何分离，
  // 出现「数值有正交集、图形却无交叠」的数形分裂。
  const outerD = rA + rB + 40;
  const tangentD = rA + rB;
  const innerD = Math.max(15, Math.abs(rA - rB) + 15);
  const maxPossiblePAB = Math.min(vennRes.pA, vennRes.pB);
  const currentD = vennRes.isMutuallyExclusive
    ? outerD
    : maxPossiblePAB > 1e-4
      ? tangentD - (vennRes.pAB / maxPossiblePAB) * (tangentD - innerD)
      : tangentD;

  const centerX = rectOmega.x + rectOmega.width / 2;
  const centerY = rectOmega.y + rectOmega.height / 2 + 10;

  const centerAX = centerX - currentD / 2;
  const centerAY = centerY;
  const centerBX = centerX + currentD / 2;
  const centerBY = centerY;

  // 交集标注几何：透镜（两圆交叠区）横向宽度与质心横向锚点。
  // 交叠细窄时标签必须落在圆外，用引线回指质心，避免学生误读标注位置。
  const overlapColor = vennRes.isIndependent
    ? MATH_COLORS.primary
    : MATH_COLORS.paramTertiary;
  const lensWidth = Math.max(0, rA + rB - currentD);
  const lensAnchorX = centerX + (rA - rB) / 2;
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
            x={rectOmega.x + 24}
            y={rectOmega.y + 36}
            fontSize={fontScale(18)}
            fontWeight="bold"
            fill={MATH_COLORS.axis}
          >
            样本空间全集 Ω (测度 P(Ω) = 1.00)
          </text>

          {/* 状态徽标与测度指示 */}
          <g transform={`translate(${centerX}, ${rectOmega.y + 36})`}>
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

          {/* 集合 A 文字标签 */}
          <text
            x={centerAX - rA * 0.45}
            y={centerAY}
            textAnchor="middle"
            fontSize={fontScale(18)}
            fontWeight="bold"
            fill={MATH_COLORS.paramPrimary}
          >
            A
          </text>
          <text
            x={centerAX - rA * 0.45}
            y={centerAY + 26}
            textAnchor="middle"
            fontSize={fontScale(14)}
            fill={MATH_COLORS.paramPrimary}
          >
            P(A) = {formatMathProb(vennRes.pA)}
          </text>

          {/* 集合 B 文字标签 */}
          <text
            x={centerBX + rB * 0.45}
            y={centerBY}
            textAnchor="middle"
            fontSize={fontScale(18)}
            fontWeight="bold"
            fill={MATH_COLORS.paramSecondary}
          >
            B
          </text>
          <text
            x={centerBX + rB * 0.45}
            y={centerBY + 26}
            textAnchor="middle"
            fontSize={fontScale(14)}
            fill={MATH_COLORS.paramSecondary}
          >
            P(B) = {formatMathProb(vennRes.pB)}
          </text>

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
                  x2={centerX}
                  y2={overlapLabelTopY + 8}
                  stroke={overlapColor}
                  strokeWidth={1.2}
                  strokeDasharray="3 2"
                />
              )}
              <text
                x={centerX}
                y={overlapLabelTopY}
                textAnchor="middle"
                fontSize={fontScale(16)}
                fontWeight="bold"
                fill={overlapColor}
              >
                AB
              </text>
              <text
                x={centerX}
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
              x={centerX}
              y={centerY}
              textAnchor="middle"
              fontSize={fontScale(14)}
              fontWeight="bold"
              fill={MATH_COLORS.paramPrimary}
            >
              无交集 (A ∩ B = ∅)
            </text>
          )}
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
