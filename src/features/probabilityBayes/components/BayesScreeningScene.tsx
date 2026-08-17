import { useMemo } from "react";
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculateBayesDiagnostic } from "@/math/probabilityBayes";

interface BayesScreeningSceneProps {
  params: Record<string, number>;
  bayesPreset?: "screening" | "factory" | "survey" | "custom";
  fontScale: (v: number) => number;
}

export function BayesScreeningScene({
  params,
  bayesPreset = "screening",
  fontScale,
}: BayesScreeningSceneProps) {
  const bayesData = useMemo(() => {
    const pPriorD = params.pPriorD ?? 0.02;
    const pSensitivity = params.pSensitivity ?? 0.95;
    const pFalsePositive = params.pFalsePositive ?? 0.05;
    return calculateBayesDiagnostic(pPriorD, pSensitivity, pFalsePositive);
  }, [params.pPriorD, params.pSensitivity, params.pFalsePositive]);

  const isFactory = bayesPreset === "factory";
  const group1Title = isFactory ? "次品组 (Def)" : "患病组 (D)";
  const group2Title = isFactory ? "合格组 (~Def)" : "健康组 (~D)";
  const truePosLabel = isFactory ? "次品检出 (+)" : "真阳性 (+)";
  const falsePosLabel = isFactory ? "合格误判 (+)" : "假阳性/误报 (+)";
  const targetSymbol = isFactory ? "Def" : "D";

  const sickCount = Math.max(
    1,
    Math.min(200, Math.round(1000 * bayesData.pPriorD)),
  );
  const healthyCount = 1000 - sickCount;
  const truePosCount = Math.round(sickCount * bayesData.pSensitivity);
  const falsePosCount = Math.round(healthyCount * bayesData.pFalsePositive);

  // ---------------- 1. 左区：患病/次品点阵 (严格约束在卡片上半部) ----------------
  const leftCard = { x: 45, y: 65, width: 195, height: 290 };
  const isSmallSick = sickCount <= 40;
  const leftCols = isSmallSick ? 5 : 8;
  const leftCellSize = isSmallSick ? 12 : 8.5;
  const leftGap = isSmallSick ? 4.5 : 3;
  const leftGridWidth = leftCols * (leftCellSize + leftGap) - leftGap;
  const leftStartX = leftCard.x + (leftCard.width - leftGridWidth) / 2;
  const leftStartY = leftCard.y + 36;

  const leftCells = Array.from({ length: sickCount }).map((_, idx) => {
    const isPositive = idx < truePosCount;
    const col = idx % leftCols;
    const row = Math.floor(idx / leftCols);
    return {
      x: leftStartX + col * (leftCellSize + leftGap),
      y: leftStartY + row * (leftCellSize + leftGap),
      fill: isPositive
        ? MATH_COLORS.paramPrimary
        : withAlpha(MATH_COLORS.axis, 0.35),
      isPositive,
    };
  });

  // ---------------- 2. 右区：健康/合格点阵 (严格约束在卡片内部，绝对不溢出) ----------------
  const rightCard = { x: 250, y: 65, width: 545, height: 290 };
  const rightCols = 38; // 38 列
  const rightCellSize = 7.5; // 点尺寸 7.5px
  const rightGapX = 4.5; // X 间距
  const rightGapY = 2.6; // Y 间距 (26 行 * 10.1px = 262px 范围，点阵高 180px)
  const rightGridWidth = rightCols * (rightCellSize + rightGapX) - rightGapX; // 38 * 12 - 4.5 = 451.5px
  const rightStartX = rightCard.x + (rightCard.width - rightGridWidth) / 2; // 居中
  const rightStartY = rightCard.y + 36;

  const rightCells = Array.from({ length: healthyCount }).map((_, idx) => {
    const isPositive = idx < falsePosCount;
    const col = idx % rightCols;
    const row = Math.floor(idx / rightCols);
    return {
      x: rightStartX + col * (rightCellSize + rightGapX),
      y: rightStartY + row * (rightCellSize + rightGapY),
      fill: isPositive
        ? MATH_COLORS.paramSecondary
        : withAlpha(MATH_COLORS.axis, 0.22),
      isPositive,
    };
  });

  const totalPositives = truePosCount + falsePosCount;
  const posteriorPercent =
    totalPositives > 0 ? (truePosCount / totalPositives) * 100 : 0;

  return (
    <g>
      {/* ─── 画布大标题 ─── */}
      <text
        x={45}
        y={46}
        fontSize={fontScale(15.5)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
      >
        1000 {isFactory ? "件零件质检模拟" : "人群体样本诊断模拟"} (先验
        {isFactory ? "次品率" : "患病基率"} P({targetSymbol}) ={" "}
        {(bayesData.pPriorD * 100).toFixed(1)}%)
      </text>

      {/* ================= 左区：患病/次品组卡片 ================= */}
      <g>
        <rect
          x={leftCard.x}
          y={leftCard.y}
          width={leftCard.width}
          height={leftCard.height}
          rx={12}
          fill={withAlpha(MATH_COLORS.paramPrimary, 0.04)}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={1.5}
        />
        <text
          x={leftCard.x + 14}
          y={leftCard.y + 24}
          fontSize={fontScale(13)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
        >
          {group1Title}: {sickCount} 人 ({(bayesData.pPriorD * 100).toFixed(1)}
          %)
        </text>

        {/* 患病点阵 */}
        {leftCells.map((c, i) => (
          <rect
            key={`left-${i}`}
            x={c.x}
            y={c.y}
            width={leftCellSize}
            height={leftCellSize}
            rx={2}
            fill={c.fill}
          />
        ))}

        {/* 底部独立图例与统计区（固定在卡片底部，绝对不与点阵重叠） */}
        <g
          transform={`translate(${leftCard.x + 12}, ${leftCard.y + leftCard.height - 68})`}
        >
          <rect
            x={0}
            y={0}
            width={leftCard.width - 24}
            height={56}
            rx={6}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
          />
          <rect
            x={10}
            y={10}
            width={9}
            height={9}
            rx={2}
            fill={MATH_COLORS.paramPrimary}
          />
          <text
            x={24}
            y={18}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={MATH_COLORS.paramPrimary}
          >
            {truePosLabel}: {truePosCount} 人
          </text>

          <rect
            x={10}
            y={30}
            width={9}
            height={9}
            rx={2}
            fill={withAlpha(MATH_COLORS.axis, 0.4)}
          />
          <text
            x={24}
            y={38}
            fontSize={fontScale(11)}
            fill={MATH_COLORS.labelTextLight}
          >
            {isFactory ? "次品漏检" : "患病漏诊"}: {sickCount - truePosCount} 人
          </text>
        </g>
      </g>

      {/* ================= 右区：健康/合格组卡片 ================= */}
      <g>
        <rect
          x={rightCard.x}
          y={rightCard.y}
          width={rightCard.width}
          height={rightCard.height}
          rx={12}
          fill={withAlpha(MATH_COLORS.axis, 0.04)}
          stroke={MATH_COLORS.axis}
          strokeWidth={1.5}
        />
        <text
          x={rightCard.x + 16}
          y={rightCard.y + 24}
          fontSize={fontScale(13)}
          fontWeight="bold"
          fill={MATH_COLORS.labelText}
        >
          {group2Title}: {healthyCount} 人 (
          {((1 - bayesData.pPriorD) * 100).toFixed(1)}%)
        </text>

        {/* 健康点阵 */}
        {rightCells.map((c, i) => (
          <rect
            key={`right-${i}`}
            x={c.x}
            y={c.y}
            width={rightCellSize}
            height={rightCellSize}
            rx={1.5}
            fill={c.fill}
          />
        ))}

        {/* 底部独立图例区（固定在卡片底部，绝对不与点阵重叠） */}
        <g
          transform={`translate(${rightCard.x + 16}, ${rightCard.y + rightCard.height - 34})`}
        >
          <rect
            x={0}
            y={0}
            width={10}
            height={10}
            rx={2}
            fill={MATH_COLORS.paramSecondary}
          />
          <text
            x={16}
            y={9}
            fontSize={fontScale(11.5)}
            fontWeight="bold"
            fill={MATH_COLORS.paramSecondary}
          >
            {falsePosLabel}: {falsePosCount} 人 (误报率{" "}
            {(bayesData.pFalsePositive * 100).toFixed(1)}%)
          </text>

          <rect
            x={230}
            y={0}
            width={10}
            height={10}
            rx={2}
            fill={withAlpha(MATH_COLORS.axis, 0.3)}
          />
          <text
            x={246}
            y={9}
            fontSize={fontScale(11.5)}
            fill={MATH_COLORS.labelTextLight}
          >
            {isFactory ? "合格正常 (-)" : "健康阴性 (-)"}:{" "}
            {healthyCount - falsePosCount} 人
          </text>
        </g>
      </g>

      {/* ================= 逆向焦点：阳性汇聚卡片 (x: 45 ~ 475, y: 370 ~ 610) ================= */}
      <g transform="translate(45, 370)">
        <rect
          x={0}
          y={0}
          width={430}
          height={235}
          rx={12}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.derivative}
          strokeWidth={1.5}
        />

        <text
          x={16}
          y={26}
          fontSize={fontScale(13.5)}
          fontWeight="bold"
          fill={MATH_COLORS.derivative}
        >
          逆向溯源：检测为阳性 (+) 的总人群 ({totalPositives} 人)
        </text>

        {/* 比例条形图 */}
        <g transform="translate(16, 42)">
          <rect
            x={0}
            y={0}
            width={398}
            height={28}
            rx={6}
            fill={withAlpha(MATH_COLORS.axis, 0.15)}
          />
          {/* 真阳性条 */}
          <rect
            x={0}
            y={0}
            width={
              totalPositives > 0 ? (398 * truePosCount) / totalPositives : 0
            }
            height={28}
            rx={6}
            fill={MATH_COLORS.paramPrimary}
          />
          {/* 假阳性条 */}
          <rect
            x={totalPositives > 0 ? (398 * truePosCount) / totalPositives : 0}
            y={0}
            width={
              totalPositives > 0 ? (398 * falsePosCount) / totalPositives : 0
            }
            height={28}
            rx={6}
            fill={MATH_COLORS.paramSecondary}
          />
        </g>

        {/* 图例数据 */}
        <g transform="translate(16, 90)">
          <circle cx={6} cy={6} r={5} fill={MATH_COLORS.paramPrimary} />
          <text
            x={16}
            y={10}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fill={MATH_COLORS.paramPrimary}
          >
            真阳性 ({truePosCount}人, 占 {posteriorPercent.toFixed(1)}%)
          </text>

          <circle cx={205} cy={6} r={5} fill={MATH_COLORS.paramSecondary} />
          <text
            x={215}
            y={10}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fill={MATH_COLORS.paramSecondary}
          >
            假阳性 ({falsePosCount}人, 占 {(100 - posteriorPercent).toFixed(1)}
            %)
          </text>
        </g>

        {/* 贝叶斯后验核心算式 */}
        <g transform="translate(16, 120)">
          <rect
            x={0}
            y={0}
            width={398}
            height={100}
            rx={8}
            fill={withAlpha(MATH_COLORS.derivative, 0.06)}
          />
          <text
            x={12}
            y={22}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fill={MATH_COLORS.derivative}
          >
            后验患病概率 P({targetSymbol}|+) = 真阳性人数 / 总阳性人数
          </text>
          <text
            x={12}
            y={52}
            fontSize={fontScale(14.5)}
            fontWeight="bold"
            fill={MATH_COLORS.labelText}
          >
            = {truePosCount} / ({truePosCount} + {falsePosCount}) ={" "}
            <tspan fill={MATH_COLORS.derivative} fontSize={fontScale(17)}>
              {posteriorPercent.toFixed(2)}%
            </tspan>
          </text>
          <text
            x={12}
            y={80}
            fontSize={fontScale(11)}
            fill={MATH_COLORS.textMuted}
          >
            全概率分母：P(+) = P(D)P(+|D) + P(~D)P(+|~D) ={" "}
            {(bayesData.pTotalPositive * 100).toFixed(2)}%
          </text>
        </g>
      </g>

      {/* ================= 右侧：基率谬误认知突破卡片 (x: 490 ~ 795, y: 370 ~ 610) ================= */}
      <g transform="translate(490, 370)">
        <rect
          x={0}
          y={0}
          width={305}
          height={235}
          rx={12}
          fill={withAlpha(MATH_COLORS.function, 0.04)}
          stroke={withAlpha(MATH_COLORS.function, 0.25)}
          strokeWidth={1.5}
        />
        <text
          x={14}
          y={26}
          fontSize={fontScale(13.5)}
          fontWeight="bold"
          fill={MATH_COLORS.function}
        >
          高考核心：破除“基率谬误”
        </text>

        <text
          x={14}
          y={54}
          fontSize={fontScale(11)}
          fill={MATH_COLORS.labelText}
          fontWeight="bold"
        >
          【为什么检测阳性真实患病率仍可能很低？】
        </text>
        <text
          x={14}
          y={76}
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.labelTextLight}
        >
          • 基准患病率 P(D) 极低（如 2%），患病人数仅 {sickCount} 人；
        </text>
        <text
          x={14}
          y={96}
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.labelTextLight}
        >
          • 健康人群基数高达 {healthyCount} 人，哪怕仅 5% 误报率，
        </text>
        <text
          x={14}
          y={116}
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.paramSecondary}
          fontWeight="bold"
        >
          也会产生高达 {falsePosCount} 个假阳性，反超真阳性！
        </text>

        <line
          x1={14}
          y1={134}
          x2={291}
          y2={134}
          stroke={MATH_COLORS.axis}
          strokeWidth={1}
          strokeDasharray="3 3"
        />

        <text
          x={14}
          y={156}
          fontSize={fontScale(11)}
          fill={MATH_COLORS.labelText}
          fontWeight="bold"
        >
          【高考通解二步法】：
        </text>
        <text
          x={14}
          y={178}
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.labelTextLight}
        >
          ① 第一步：全概算分母 P(+) = Σ P(A_i)P(+|A_i)
        </text>
        <text
          x={14}
          y={200}
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.labelTextLight}
        >
          ② 第二步：目标分支 P(D+) 作分子求商
        </text>
      </g>
    </g>
  );
}
