import { useMemo } from "react";
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculateBayesDiagnostic } from "@/math/probabilityBayes";

interface BayesScreeningSceneProps {
  params: Record<string, number>;
  bayesPreset?: "screening" | "factory" | "custom";
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

  const sickCount = Math.round(1000 * bayesData.pPriorD);
  const healthyCount = 1000 - sickCount;
  const truePosCount = Math.round(sickCount * bayesData.pSensitivity);
  const falsePosCount = Math.round(healthyCount * bayesData.pFalsePositive);

  // 1. 左区：患病/次品点阵 (5 列)
  const leftCols = 5;
  const leftCellSize = 11;
  const leftGap = 4;
  const leftStartX = 65;
  const leftStartY = 110;

  const leftCells = Array.from({ length: sickCount }).map((_, idx) => {
    const isPositive = idx < truePosCount;
    const col = idx % leftCols;
    const row = Math.floor(idx / leftCols);
    return {
      x: leftStartX + col * (leftCellSize + leftGap),
      y: leftStartY + row * (leftCellSize + leftGap),
      fill: isPositive ? MATH_COLORS.paramPrimary : MATH_COLORS.degeneracy,
      isPositive,
    };
  });

  // 2. 右区：健康/合格点阵 (35 列)
  const rightCols = 35;
  const rightCellSize = 10;
  const rightGap = 3.5;
  const rightStartX = 240;
  const rightStartY = 110;

  const rightCells = Array.from({ length: healthyCount }).map((_, idx) => {
    const isPositive = idx < falsePosCount;
    const col = idx % rightCols;
    const row = Math.floor(idx / rightCols);
    return {
      x: rightStartX + col * (rightCellSize + rightGap),
      y: rightStartY + row * (rightCellSize + rightGap),
      fill: isPositive
        ? MATH_COLORS.paramSecondary
        : withAlpha(MATH_COLORS.axis, 0.4),
      isPositive,
    };
  });

  const totalPositives = truePosCount + falsePosCount;

  return (
    <g>
      {/* 画布大标题 */}
      <text
        x={60}
        y={50}
        fontSize={fontScale(18)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
      >
        1000 {isFactory ? "件产品次品检测" : "人群体样本诊断"}模拟 (先验
        {isFactory ? "次品率" : "患病率"} P({targetSymbol}) ={" "}
        {(bayesData.pPriorD * 100).toFixed(1)}%)
      </text>

      {/* ================= 左区：患病/次品组卡片 ================= */}
      <g>
        <rect
          x={50}
          y={75}
          width={160}
          height={330}
          rx={12}
          fill={withAlpha(MATH_COLORS.paramPrimary, 0.04)}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={1.5}
        />
        <text
          x={65}
          y={98}
          fontSize={fontScale(14)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
        >
          {group1Title}: {sickCount} 人
        </text>

        {leftCells.map((c, i) => (
          <rect
            key={`left-${i}`}
            x={c.x}
            y={c.y}
            width={leftCellSize}
            height={leftCellSize}
            rx={2.5}
            fill={c.fill}
          />
        ))}

        <g transform="translate(62, 335)">
          <rect
            x={0}
            y={0}
            width={10}
            height={10}
            rx={2}
            fill={MATH_COLORS.paramPrimary}
          />
          <text
            x={16}
            y={9}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fill={MATH_COLORS.paramPrimary}
          >
            {truePosLabel}: {truePosCount}
          </text>

          <rect
            x={0}
            y={20}
            width={10}
            height={10}
            rx={2}
            fill={MATH_COLORS.degeneracy}
          />
          <text
            x={16}
            y={29}
            fontSize={fontScale(12)}
            fill={MATH_COLORS.labelTextLight}
          >
            {isFactory ? "次品漏检" : "患病漏诊"}: {sickCount - truePosCount}
          </text>
        </g>
      </g>

      {/* ================= 右区：健康/合格组卡片 ================= */}
      <g>
        <rect
          x={225}
          y={75}
          width={545}
          height={330}
          rx={12}
          fill={withAlpha(MATH_COLORS.axis, 0.05)}
          stroke={MATH_COLORS.axis}
          strokeWidth={1.5}
        />
        <text
          x={240}
          y={98}
          fontSize={fontScale(14)}
          fontWeight="bold"
          fill={MATH_COLORS.labelText}
        >
          {group2Title}: {healthyCount} 人
        </text>

        {rightCells.map((c, i) => (
          <rect
            key={`right-${i}`}
            x={c.x}
            y={c.y}
            width={rightCellSize}
            height={rightCellSize}
            rx={2}
            fill={c.fill}
          />
        ))}

        <g transform="translate(240, 335)">
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
            fontSize={fontScale(12)}
            fontWeight="bold"
            fill={MATH_COLORS.paramSecondary}
          >
            {falsePosLabel}: {falsePosCount} 人 (误报)
          </text>

          <rect
            x={180}
            y={0}
            width={10}
            height={10}
            rx={2}
            fill={withAlpha(MATH_COLORS.axis, 0.5)}
          />
          <text
            x={196}
            y={9}
            fontSize={fontScale(12)}
            fill={MATH_COLORS.labelTextLight}
          >
            {isFactory ? "合格正常 (+)" : "健康阴性 (-)"}:{" "}
            {healthyCount - falsePosCount} 人
          </text>
        </g>
      </g>

      {/* ================= 逆向焦点：阳性汇聚卡片 ================= */}
      <g transform="translate(50, 420)">
        <rect
          x={0}
          y={0}
          width={720}
          height={180}
          rx={14}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.functionTransformed}
          strokeWidth={2}
          className="shadow-sm"
        />

        <text
          x={24}
          y={32}
          fontSize={fontScale(16)}
          fontWeight="bold"
          fill={MATH_COLORS.functionTransformed}
        >
          ★ 逆向后验分析：在所有检测为阳性 (+) 的人群中，实际
          {isFactory ? "为次品" : "患病"}的概率
        </text>

        {/* 阳性成员汇集解剖条 */}
        <g transform="translate(24, 48)">
          <rect
            x={0}
            y={0}
            width={672}
            height={36}
            rx={8}
            fill={withAlpha(MATH_COLORS.axis, 0.1)}
          />

          {/* 红色真阳性占比 */}
          {totalPositives > 0 && (
            <rect
              x={0}
              y={0}
              width={Math.max(12, (672 * truePosCount) / totalPositives)}
              height={36}
              rx={8}
              fill={MATH_COLORS.paramPrimary}
            />
          )}

          {/* 比例标注 */}
          <text
            x={16}
            y={23}
            fontSize={fontScale(13)}
            fontWeight="bold"
            fill={MATH_COLORS.white}
          >
            {truePosLabel}: {truePosCount} 人 (
            {(bayesData.pPosteriorD * 100).toFixed(1)}%)
          </text>

          <text
            x={Math.max(200, (672 * truePosCount) / totalPositives + 16)}
            y={23}
            fontSize={fontScale(13)}
            fontWeight="bold"
            fill={MATH_COLORS.paramSecondary}
          >
            {falsePosLabel}: {falsePosCount} 人 (
            {((1 - bayesData.pPosteriorD) * 100).toFixed(1)}%)
          </text>
        </g>

        {/* 计算公式说明 */}
        <g transform="translate(24, 110)">
          <text
            x={0}
            y={20}
            fontSize={fontScale(15)}
            fill={MATH_COLORS.labelText}
          >
            <tspan fontWeight="bold">后验概率计算 P({targetSymbol}|+) = </tspan>
            <tspan fill={MATH_COLORS.paramPrimary} fontWeight="bold">
              {" "}
              {truePosLabel} ({truePosCount}人){" "}
            </tspan>
            / [
            <tspan fill={MATH_COLORS.paramPrimary} fontWeight="bold">
              {" "}
              {truePosCount}人{" "}
            </tspan>
            +
            <tspan fill={MATH_COLORS.paramSecondary} fontWeight="bold">
              {" "}
              {falsePosLabel} ({falsePosCount}人){" "}
            </tspan>
            ]
          </text>

          <text
            x={0}
            y={48}
            fontSize={fontScale(18)}
            fontWeight="bold"
            fill={MATH_COLORS.derivative}
          >
            = {truePosCount} / {totalPositives} ={" "}
            {(bayesData.pPosteriorD * 100).toFixed(2)}%
          </text>
        </g>
      </g>
    </g>
  );
}
