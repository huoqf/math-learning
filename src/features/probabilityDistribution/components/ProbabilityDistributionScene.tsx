import type { DistributionResult } from "@/math/probabilityDistribution";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";

interface ProbabilityDistributionSceneProps {
  distResult: DistributionResult;
  transformedDist?: DistributionResult;
  studyMode: "binomial" | "hypergeometric" | "general" | "linear";
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (baseSize: number) => number;
  linearA?: number;
  linearB?: number;
}

export function ProbabilityDistributionScene({
  distResult,
  transformedDist,
  studyMode,
  scale,
  fontScale,
}: ProbabilityDistributionSceneProps) {
  const { outcomes, mean, stdDev, maxP } = distResult;

  // 确定 X 轴的范围与步长
  const xValues = outcomes.map((o) => o.x);
  const minX = Math.min(...xValues, 0) - 0.5;
  const maxX = Math.max(...xValues, 5) + 0.5;

  // 画布底线与 Y 轴参考线
  const yAxisZero = mathToDesign(0, 0, scale);
  const yAxisMax = mathToDesign(0, Math.max(0.35, maxP * 1.15), scale);
  const xAxisMin = mathToDesign(minX, 0, scale);
  const xAxisMax = mathToDesign(maxX, 0, scale);

  // 期望 E(X) 坐标
  const meanDesign = mathToDesign(mean, 0, scale);

  // 方差波动带 [E(X) - σ, E(X) + σ]
  const sigmaMin = Math.max(minX, mean - stdDev);
  const sigmaMax = Math.min(maxX, mean + stdDev);
  const sigmaMinDesign = mathToDesign(sigmaMin, 0, scale);
  const sigmaMaxDesign = mathToDesign(sigmaMax, 0, scale);

  // 柱子宽度计算 (根据元素数量自适应宽度)
  const barWidthMath =
    outcomes.length > 12 ? 0.35 : outcomes.length > 8 ? 0.45 : 0.55;
  const halfBarWidthPx = Math.max(8, (barWidthMath * scale.scaleX) / 2);

  // 动态 Y 轴标尺刻度
  const yTicks = [0.2, 0.4, 0.6, 0.8, 1.0].filter(
    (val) => val <= (maxP * 1.25 || 0.4),
  );
  if (yTicks.length < 3) {
    const step = maxP / 3;
    yTicks.length = 0;
    yTicks.push(
      Number(step.toFixed(2)),
      Number((step * 2).toFixed(2)),
      Number(maxP.toFixed(2)),
    );
  }

  return (
    <g className="select-none">
      {/* 1. 背景网格与纵轴标尺 */}
      {yTicks.map((pVal) => {
        const linePos = mathToDesign(0, pVal, scale);
        return (
          <g key={`grid-y-${pVal}`}>
            <line
              x1={xAxisMin.x - 10}
              y1={linePos.y}
              x2={xAxisMax.x + 20}
              y2={linePos.y}
              stroke={CANVAS_COLORS.grid}
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            {/* 纵轴概率刻度文字 */}
            <text
              x={xAxisMin.x - 16}
              y={linePos.y + fontScale(4)}
              fill={CANVAS_COLORS.labelText}
              fontSize={fontScale(11)}
              textAnchor="end"
              fontWeight="600"
            >
              {pVal.toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* 2. 方差波动范围阴影带 [E(X) - σ, E(X) + σ] */}
      {stdDev > 0.001 && (
        <g className="transition-all duration-300">
          <rect
            x={sigmaMinDesign.x}
            y={yAxisMax.y}
            width={Math.max(4, sigmaMaxDesign.x - sigmaMinDesign.x)}
            height={Math.abs(yAxisZero.y - yAxisMax.y)}
            fill={withAlpha(MATH_COLORS.asymptote, 0.08)}
            stroke={withAlpha(MATH_COLORS.asymptote, 0.35)}
            strokeDasharray="4 3"
            rx={4}
          />
          {/* 标准差区间标注 */}
          <text
            x={(sigmaMinDesign.x + sigmaMaxDesign.x) / 2}
            y={yAxisMax.y - 8}
            fill={MATH_COLORS.asymptote}
            fontSize={fontScale(10)}
            textAnchor="middle"
            fontWeight="bold"
          >
            σ 波动区间 [E(X)-σ, E(X)+σ]
          </text>
        </g>
      )}

      {/* 3. 横轴 X 坐标底线与箭头 */}
      <line
        x1={xAxisMin.x - 20}
        y1={yAxisZero.y}
        x2={xAxisMax.x + 35}
        y2={yAxisZero.y}
        stroke={CANVAS_COLORS.axis}
        strokeWidth={2}
      />
      <polygon
        points={`${xAxisMax.x + 42},${yAxisZero.y} ${xAxisMax.x + 32},${
          yAxisZero.y - 4
        } ${xAxisMax.x + 32},${yAxisZero.y + 4}`}
        fill={CANVAS_COLORS.axis}
      />
      <text
        x={xAxisMax.x + 48}
        y={yAxisZero.y + fontScale(4)}
        fill={CANVAS_COLORS.labelText}
        fontSize={fontScale(12)}
        fontWeight="bold"
      >
        x
      </text>

      {/* 4. 主概率分布柱状图 (Bar Plot) */}
      {outcomes.map((item, idx) => {
        const topPos = mathToDesign(item.x, item.p, scale);
        const bottomPos = mathToDesign(item.x, 0, scale);
        const barHeight = Math.abs(bottomPos.y - topPos.y);
        const isMax = Math.abs(item.p - maxP) < 1e-6 && item.p > 0;

        let barColor: string = MATH_COLORS.barFill;
        if (studyMode === "hypergeometric")
          barColor = MATH_COLORS.paramSecondary;
        if (isMax) barColor = MATH_COLORS.paramPrimary;

        return (
          <g key={`bar-${item.x}-${idx}`} className="group cursor-pointer">
            {/* 柱形体 */}
            <rect
              x={topPos.x - halfBarWidthPx}
              y={topPos.y}
              width={halfBarWidthPx * 2}
              height={Math.max(barHeight, 3)}
              fill={withAlpha(barColor, isMax ? 0.88 : 0.7)}
              stroke={barColor}
              strokeWidth={isMax ? 2 : 1.5}
              rx={4}
              className="transition-all duration-300 group-hover:opacity-100"
            />

            {/* 柱顶概率数值标注 (带白框垫底防止与虚线遮挡) */}
            {item.p > 0.0005 && (
              <g
                transform={`translate(${topPos.x}, ${topPos.y - (isMax ? 12 : 8)})`}
              >
                <rect
                  x={-18}
                  y={-10}
                  width={36}
                  height={14}
                  fill="#FFFFFF"
                  fillOpacity={0.92}
                  rx={3}
                />
                <text
                  x={0}
                  y={1}
                  fill={
                    isMax ? MATH_COLORS.paramPrimary : CANVAS_COLORS.labelText
                  }
                  fontSize={fontScale(10)}
                  textAnchor="middle"
                  fontWeight={isMax ? "bold" : "600"}
                >
                  {item.p.toFixed(3)}
                </text>
              </g>
            )}

            {/* 横轴刻度取值 x_k 标注 */}
            <text
              x={bottomPos.x}
              y={bottomPos.y + fontScale(16)}
              fill={CANVAS_COLORS.labelText}
              fontSize={fontScale(11)}
              textAnchor="middle"
              fontWeight="600"
            >
              {item.x}
            </text>
          </g>
        );
      })}

      {/* 5. 线性变换对比模式：渲染 Y = aX + b 的镜像或重叠分布柱 */}
      {studyMode === "linear" && transformedDist && (
        <g className="opacity-85">
          {transformedDist.outcomes.map((tItem, idx) => {
            const topPos = mathToDesign(tItem.x, tItem.p, scale);
            const bottomPos = mathToDesign(tItem.x, 0, scale);
            const barHeight = Math.abs(bottomPos.y - topPos.y);

            return (
              <g key={`trans-bar-${tItem.x}-${idx}`}>
                <rect
                  x={topPos.x - halfBarWidthPx * 0.7}
                  y={topPos.y}
                  width={halfBarWidthPx * 1.4}
                  height={Math.max(barHeight, 3)}
                  fill={withAlpha(MATH_COLORS.paramSecondary, 0.4)}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeDasharray="2 2"
                  strokeWidth={1.5}
                  rx={3}
                />
                <text
                  x={topPos.x}
                  y={topPos.y - 20}
                  fill={MATH_COLORS.paramSecondary}
                  fontSize={fontScale(9)}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  Y={tItem.x}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* 6. 均值 E(X) 物理杠杆平衡支点 (Center of Mass Pivot / Fulcrum) */}
      <g className="transition-all duration-300">
        {/* 垂直指示中轴虚线 */}
        <line
          x1={meanDesign.x}
          y1={yAxisMax.y - 2}
          x2={meanDesign.x}
          y2={yAxisZero.y}
          stroke={MATH_COLORS.tangentLine}
          strokeWidth={2}
          strokeDasharray="5 4"
        />

        {/* 下方杠杆支点（三角形 Pivot） */}
        <polygon
          points={`${meanDesign.x},${yAxisZero.y + 2} ${meanDesign.x - 8},${
            yAxisZero.y + 14
          } ${meanDesign.x + 8},${yAxisZero.y + 14}`}
          fill={MATH_COLORS.tangentLine}
          stroke="#FFFFFF"
          strokeWidth={1.5}
        />

        {/* 均值 E(X) 标签 */}
        <g transform={`translate(${meanDesign.x}, ${yAxisZero.y + 30})`}>
          <rect
            x={-38}
            y={-12}
            width={76}
            height={22}
            fill={MATH_COLORS.tangentLine}
            rx={4}
          />
          <text
            x={0}
            y={3}
            fill="#FFFFFF"
            fontSize={fontScale(11)}
            textAnchor="middle"
            fontWeight="bold"
          >
            E(X) = {mean.toFixed(2)}
          </text>
        </g>

        {/* 线性变换模式下，渲染 E(Y) 支点 */}
        {studyMode === "linear" && transformedDist && (
          <g>
            {(() => {
              const meanYPos = mathToDesign(transformedDist.mean, 0, scale);
              return (
                <g className="transition-all duration-300">
                  <line
                    x1={meanYPos.x}
                    y1={yAxisMax.y + 15}
                    x2={meanYPos.x}
                    y2={yAxisZero.y}
                    stroke={MATH_COLORS.paramSecondary}
                    strokeWidth={2}
                    strokeDasharray="4 3"
                  />
                  <polygon
                    points={`${meanYPos.x},${yAxisZero.y + 2} ${
                      meanYPos.x - 7
                    },${yAxisZero.y + 12} ${meanYPos.x + 7},${
                      yAxisZero.y + 12
                    }`}
                    fill={MATH_COLORS.paramSecondary}
                  />
                  <g
                    transform={`translate(${meanYPos.x}, ${yAxisZero.y + 56})`}
                  >
                    <rect
                      x={-42}
                      y={-10}
                      width={84}
                      height={20}
                      fill={MATH_COLORS.paramSecondary}
                      rx={3}
                    />
                    <text
                      x={0}
                      y={3}
                      fill="#FFFFFF"
                      fontSize={fontScale(10)}
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      E(Y) = {transformedDist.mean.toFixed(2)}
                    </text>
                  </g>
                </g>
              );
            })()}
          </g>
        )}
      </g>
    </g>
  );
}
