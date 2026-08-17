import { useMemo } from "react";
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculateConditionalProb } from "@/math/probabilityBayes";

interface ConditionalSceneProps {
  params: Record<string, number>;
  isZoomedToA: boolean;
  fontScale: (v: number) => number;
}

export function ConditionalScene({
  params,
  isZoomedToA,
  fontScale,
}: ConditionalSceneProps) {
  const conditionalData = useMemo(() => {
    const pA = params.pA ?? 0.5;
    const pB = params.pB ?? 0.4;
    const pAB = Math.min(params.pAB ?? 0.2, Math.min(pA, pB));
    return calculateConditionalProb(pA, pB, pAB);
  }, [params.pA, params.pB, params.pAB]);

  // 840 x 650 预设坐标系
  // 左半区：Venn 图区域 (x: 40 ~ 470, y: 75 ~ 600)
  const rectOmega = { x: 45, y: 80, width: 420, height: 490 };
  const totalArea = rectOmega.width * rectOmega.height;

  const rawRA =
    Math.sqrt((totalArea * Math.max(0.01, conditionalData.pA)) / Math.PI) *
    0.95;
  const rawRB =
    Math.sqrt((totalArea * Math.max(0.01, conditionalData.pB)) / Math.PI) *
    0.95;

  const centerAX = isZoomedToA ? 255 : 210;
  const centerAY = 325;

  const maxOverlapDist = Math.abs(rawRA - rawRB);
  const minOverlapDist = rawRA + rawRB;
  const tOverlap =
    1 -
    (conditionalData.pA > 0 && conditionalData.pB > 0
      ? conditionalData.pAB / Math.min(conditionalData.pA, conditionalData.pB)
      : 0);
  const distAB =
    maxOverlapDist +
    (minOverlapDist - maxOverlapDist) * Math.max(0, Math.min(1, tOverlap));

  const rawCenterBX = centerAX + distAB;
  const centerBY = centerAY;

  const omegaRight = rectOmega.x + rectOmega.width;
  const omegaBottom = rectOmega.y + rectOmega.height;

  const maxRA = Math.min(
    centerAX - rectOmega.x - 10,
    omegaRight - centerAX - 10,
    centerAY - rectOmega.y - 10,
    omegaBottom - centerAY - 10,
  );
  const rA = Math.max(15, Math.min(rawRA, maxRA));

  const maxCenterBX = omegaRight - rawRB - 10;
  const minCenterBX = centerAX + Math.abs(rawRA - rawRB) + 6;
  const centerBX = Math.max(minCenterBX, Math.min(maxCenterBX, rawCenterBX));

  const maxRB = Math.min(
    centerBX - rectOmega.x - 10,
    omegaRight - centerBX - 10,
    centerBY - rectOmega.y - 10,
    omegaBottom - centerBY - 10,
  );
  const rB = Math.max(15, Math.min(rawRB, maxRB));

  // 独立性/互斥性判断
  const isIndependent =
    Math.abs(conditionalData.pAB - conditionalData.pA * conditionalData.pB) <
      0.015 &&
    conditionalData.pA > 0 &&
    conditionalData.pB > 0;
  const isMutuallyExclusive = conditionalData.pAB <= 1e-4;

  return (
    <g>
      {/* ─── 左半区：Venn 图样本空间 ─── */}
      <text
        x={rectOmega.x}
        y={rectOmega.y - 14}
        fontSize={fontScale(16)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
      >
        1. 几何 Venn 面积与样本空间压缩
      </text>

      {/* 全集矩形底板 */}
      <rect
        x={rectOmega.x}
        y={rectOmega.y}
        width={rectOmega.width}
        height={rectOmega.height}
        rx={14}
        fill={
          isZoomedToA ? withAlpha(MATH_COLORS.axis, 0.08) : MATH_COLORS.white
        }
        stroke={isZoomedToA ? MATH_COLORS.axis : MATH_COLORS.textMuted}
        strokeWidth={2}
        strokeDasharray={isZoomedToA ? "6 6" : undefined}
      />

      <text
        x={rectOmega.x + 16}
        y={rectOmega.y + 28}
        fontSize={fontScale(14)}
        fontWeight="bold"
        fill={isZoomedToA ? MATH_COLORS.textMuted : MATH_COLORS.labelTextLight}
      >
        全样本空间 Ω {isZoomedToA ? "(已被降权虚化)" : "(总体 Area = 1.0)"}
      </text>

      {/* 状态徽章：独立 / 互斥 */}
      {isIndependent && (
        <g
          transform={`translate(${rectOmega.x + rectOmega.width - 120}, ${rectOmega.y + 12})`}
        >
          <rect
            x={0}
            y={0}
            width={105}
            height={24}
            rx={12}
            fill={withAlpha(MATH_COLORS.setIntersection, 0.15)}
            stroke={MATH_COLORS.setIntersection}
            strokeWidth={1.5}
          />
          <text
            x={52}
            y={16}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={MATH_COLORS.setIntersection}
            textAnchor="middle"
          >
            ★ A 与 B 相互独立
          </text>
        </g>
      )}
      {isMutuallyExclusive && (
        <g
          transform={`translate(${rectOmega.x + rectOmega.width - 120}, ${rectOmega.y + 12})`}
        >
          <rect
            x={0}
            y={0}
            width={105}
            height={24}
            rx={12}
            fill={withAlpha(MATH_COLORS.degeneracy, 0.15)}
            stroke={MATH_COLORS.degeneracy}
            strokeWidth={1.5}
          />
          <text
            x={52}
            y={16}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={MATH_COLORS.degeneracy}
            textAnchor="middle"
          >
            ▲ A 与 B 互斥 (AB=∅)
          </text>
        </g>
      )}

      {/* 聚焦放大外框 */}
      {isZoomedToA && (
        <g>
          <rect
            x={centerAX - rA - 20}
            y={centerAY - rA - 20}
            width={(rA + 20) * 2}
            height={(rA + 20) * 2}
            rx={16}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.06)}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            strokeDasharray="6 4"
          />
          <text
            x={centerAX}
            y={centerAY - rA - 26}
            fontSize={fontScale(13)}
            fontWeight="bold"
            fill={MATH_COLORS.paramPrimary}
            textAnchor="middle"
          >
            【新样本空间 Ω&apos; = A】
          </text>
        </g>
      )}

      <defs>
        <clipPath id="cond-clip-circle-a">
          <circle cx={centerAX} cy={centerAY} r={rA} />
        </clipPath>
      </defs>

      {/* 事件 A 圆 */}
      <circle
        cx={centerAX}
        cy={centerAY}
        r={rA}
        fill={withAlpha(MATH_COLORS.paramPrimary, 0.2)}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2.5}
      />

      {/* 事件 B 圆 */}
      <circle
        cx={centerBX}
        cy={centerBY}
        r={rB}
        fill={withAlpha(MATH_COLORS.paramSecondary, isZoomedToA ? 0.08 : 0.18)}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={2}
        strokeDasharray={isZoomedToA ? "4 4" : undefined}
      />

      {/* 交集 AB (裁剪后) */}
      <g clipPath="url(#cond-clip-circle-a)">
        <circle
          cx={centerBX}
          cy={centerBY}
          r={rB}
          fill={withAlpha(MATH_COLORS.paramTertiary, 0.7)}
          stroke={MATH_COLORS.paramTertiary}
          strokeWidth={2.5}
        />
      </g>

      {/* A 标签 */}
      <text
        x={centerAX - (distAB > 20 ? rA * 0.35 : 0)}
        y={centerAY - rA - 8}
        fontSize={fontScale(14)}
        fontWeight="bold"
        fill={MATH_COLORS.paramPrimary}
        textAnchor="middle"
      >
        事件 A [P(A) = {conditionalData.pA.toFixed(2)}]
      </text>

      {/* B 标签 */}
      <text
        x={centerBX + (distAB > 20 ? rB * 0.35 : 0)}
        y={centerBY + rB + 20}
        fontSize={fontScale(13)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="middle"
      >
        事件 B [P(B) = {conditionalData.pB.toFixed(2)}]
      </text>

      {/* 交集 AB 标注 */}
      <text
        x={centerAX + distAB / 2}
        y={centerAY + 5}
        fontSize={fontScale(13)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
        textAnchor="middle"
      >
        AB [{conditionalData.pAB.toFixed(2)}]
      </text>

      {/* ─── 右半区：重归一化与数学本质面板 (x: 490 ~ 800, y: 75 ~ 600) ─── */}
      <g transform="translate(490, 80)">
        {/* 卡片 1：空间压缩前后量化对比 */}
        <rect
          x={0}
          y={0}
          width={310}
          height={235}
          rx={12}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.axis}
          strokeWidth={1.5}
        />
        <text
          x={16}
          y={26}
          fontSize={fontScale(14)}
          fontWeight="bold"
          fill={MATH_COLORS.labelText}
        >
          2. 参照系视角转换与归一化
        </text>

        {/* 全局视角 */}
        <text
          x={16}
          y={56}
          fontSize={fontScale(12)}
          fill={MATH_COLORS.labelTextLight}
        >
          ① 全局视窗（分母为全集 Ω = 1.0）：
        </text>
        <g transform="translate(16, 68)">
          <rect
            x={0}
            y={0}
            width={278}
            height={18}
            rx={4}
            fill={withAlpha(MATH_COLORS.axis, 0.15)}
          />
          <rect
            x={0}
            y={0}
            width={278 * conditionalData.pA}
            height={18}
            rx={4}
            fill={MATH_COLORS.paramPrimary}
            opacity={0.8}
          />
          <rect
            x={0}
            y={0}
            width={278 * conditionalData.pAB}
            height={18}
            rx={4}
            fill={MATH_COLORS.paramTertiary}
          />
          <text
            x={282}
            y={14}
            fontSize={fontScale(11)}
            fill={MATH_COLORS.labelText}
          >
            {conditionalData.pAB.toFixed(2)}
          </text>
        </g>
        <text
          x={16}
          y={102}
          fontSize={fontScale(11)}
          fill={MATH_COLORS.paramTertiary}
        >
          交集 P(AB) 占全集面积比例 = {(conditionalData.pAB * 100).toFixed(1)}%
        </text>

        {/* 条件压缩视角 */}
        <text
          x={16}
          y={130}
          fontSize={fontScale(12)}
          fill={MATH_COLORS.labelTextLight}
        >
          ② 条件视窗（分母压缩为事件 A = {conditionalData.pA.toFixed(2)}）：
        </text>
        <g transform="translate(16, 142)">
          <rect
            x={0}
            y={0}
            width={278}
            height={22}
            rx={4}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.15)}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1}
          />
          <rect
            x={0}
            y={0}
            width={
              conditionalData.pA > 0
                ? Math.min(
                    278,
                    278 * (conditionalData.pAB / conditionalData.pA),
                  )
                : 0
            }
            height={22}
            rx={4}
            fill={MATH_COLORS.function}
          />
          <text
            x={282}
            y={16}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fill={MATH_COLORS.function}
          >
            {conditionalData.isDegenerate
              ? "无意义"
              : conditionalData.pB_given_A.toFixed(3)}
          </text>
        </g>
        <text
          x={16}
          y={180}
          fontSize={fontScale(12)}
          fontWeight="bold"
          fill={MATH_COLORS.function}
        >
          条件概率 P(B|A) ={" "}
          {conditionalData.isDegenerate
            ? "无意义"
            : `${(conditionalData.pB_given_A * 100).toFixed(1)}%`}
        </text>
        <text
          x={16}
          y={204}
          fontSize={fontScale(11)}
          fill={MATH_COLORS.textMuted}
        >
          本质：将分子 P(AB) 放大 1/P(A) 倍，重新归一化至 A
        </text>

        {/* 卡片 2：新高考核心解题通法 */}
        <g transform="translate(0, 250)">
          <rect
            x={0}
            y={0}
            width={310}
            height={240}
            rx={12}
            fill={withAlpha(MATH_COLORS.function, 0.04)}
            stroke={withAlpha(MATH_COLORS.function, 0.3)}
            strokeWidth={1.5}
          />
          <text
            x={16}
            y={26}
            fontSize={fontScale(13)}
            fontWeight="bold"
            fill={MATH_COLORS.function}
          >
            3. 高考易错点与核心通法
          </text>

          <text
            x={16}
            y={54}
            fontSize={fontScale(11.5)}
            fill={MATH_COLORS.labelText}
            fontWeight="bold"
          >
            【易错辨析】P(AB) 与 P(B|A) 的区别：
          </text>
          <text
            x={16}
            y={76}
            fontSize={fontScale(11)}
            fill={MATH_COLORS.labelTextLight}
          >
            • P(AB)：总体视角的两事件同时发生（分母为 Ω）
          </text>
          <text
            x={16}
            y={96}
            fontSize={fontScale(11)}
            fill={MATH_COLORS.labelTextLight}
          >
            • P(B|A)：已知 A 发生下的 B 发生率（分母为 A）
          </text>

          <line
            x1={16}
            y1={112}
            x2={294}
            y2={112}
            stroke={MATH_COLORS.axis}
            strokeWidth={1}
            strokeDasharray="3 3"
          />

          <text
            x={16}
            y={134}
            fontSize={fontScale(11.5)}
            fill={MATH_COLORS.labelText}
            fontWeight="bold"
          >
            【乘法公式双向互通】：
          </text>
          <text
            x={16}
            y={156}
            fontSize={fontScale(11)}
            fill={MATH_COLORS.labelTextLight}
          >
            P(AB) = P(A) · P(B|A) = P(B) · P(A|B)
          </text>
          <text
            x={16}
            y={178}
            fontSize={fontScale(11)}
            fill={MATH_COLORS.labelTextLight}
          >
            若 P(B|A) = P(B)，则 A 与 B 独立，P(AB) = P(A)P(B)
          </text>

          <rect
            x={14}
            y={194}
            width={282}
            height={34}
            rx={6}
            fill={withAlpha(MATH_COLORS.paramTertiary, 0.1)}
          />
          <text
            x={22}
            y={215}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={MATH_COLORS.paramTertiary}
          >
            口诀：已知求件缩样本，分子交集分母件！
          </text>
        </g>
      </g>
    </g>
  );
}
