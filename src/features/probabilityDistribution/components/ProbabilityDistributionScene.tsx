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
  linearA = 2,
  linearB = 1,
}: ProbabilityDistributionSceneProps) {
  const { outcomes, mean, stdDev, maxP } = distResult;

  // 1. 固定稳定的纵轴 Y 标尺 0 ~ 1.0 (绝对无跳变抖动)
  const yTicks = [0.2, 0.4, 0.6, 0.8, 1.0];

  // 确定基准线坐标
  const yAxisZero = mathToDesign(0, 0, scale);
  const yAxisMax = mathToDesign(0, 1.0, scale);

  // X 轴画线起止点绝对固定 (在 xRange [-1.2, 16.8] 内部 100% 静态不动)
  const xAxisMin = mathToDesign(-0.6, 0, scale);
  const xAxisMax = mathToDesign(15.6, 0, scale);

  // 期望 E(X) 物理杠杆坐标
  const meanDesign = mathToDesign(mean, 0, scale);

  // 方差波动带 [E(X) - σ, E(X) + σ] (限制在 X 轴有效展示区间)
  const sigmaMin = Math.max(-0.6, mean - stdDev);
  const sigmaMax = Math.min(15.6, mean + stdDev);
  const sigmaMinDesign = mathToDesign(sigmaMin, 0, scale);
  const sigmaMaxDesign = mathToDesign(sigmaMax, 0, scale);

  // 柱体像素宽度固定 (由固定比例 scale.scaleX 确定，绝对不随 n 的增减发生压缩变形)
  const halfBarWidthPx = (0.4 * scale.scaleX) / 2;

  return (
    <g className="select-none">
      {/* ================= 1. 背景静止网格与 Y 轴刻度 (固定 0~1.0) ================= */}
      {yTicks.map((pVal) => {
        const linePos = mathToDesign(0, pVal, scale);
        return (
          <g key={`grid-y-${pVal}`}>
            <line
              x1={xAxisMin.x - 12}
              y1={linePos.y}
              x2={xAxisMax.x + 24}
              y2={linePos.y}
              stroke={CANVAS_COLORS.grid}
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            {/* 纵轴概率刻度 */}
            <text
              x={xAxisMin.x - 18}
              y={linePos.y + fontScale(4)}
              fill={CANVAS_COLORS.labelText}
              fontSize={fontScale(11)}
              textAnchor="end"
              fontWeight="600"
              className="font-mono"
            >
              {pVal.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* ================= 2. 方差波动范围包络带 [E(X)-σ, E(X)+σ] ================= */}
      {stdDev > 0.001 && (
        <g className="transition-all duration-300">
          <rect
            x={sigmaMinDesign.x}
            y={yAxisMax.y - 12}
            width={Math.max(4, sigmaMaxDesign.x - sigmaMinDesign.x)}
            height={Math.abs(yAxisZero.y - (yAxisMax.y - 12))}
            fill={withAlpha(MATH_COLORS.asymptote, 0.07)}
            stroke={withAlpha(MATH_COLORS.asymptote, 0.35)}
            strokeDasharray="4 3"
            rx={6}
          />
          {/* 标准差区间顶端标注 */}
          <text
            x={(sigmaMinDesign.x + sigmaMaxDesign.x) / 2}
            y={yAxisMax.y - 18}
            fill={MATH_COLORS.asymptote}
            fontSize={fontScale(10)}
            textAnchor="middle"
            fontWeight="bold"
          >
            σ 波动区间 [{(mean - stdDev).toFixed(2)},{" "}
            {(mean + stdDev).toFixed(2)}]
          </text>
        </g>
      )}

      {/* ================= 3. 主 X 坐标轴与箭头 ================= */}
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

      {/* ================= 4. 主概率分布柱状图 ================= */}
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
              height={Math.max(barHeight, 2)}
              fill={withAlpha(barColor, isMax ? 0.9 : 0.72)}
              stroke={barColor}
              strokeWidth={isMax ? 2.2 : 1.5}
              rx={4}
              className="transition-all duration-300 group-hover:opacity-100"
            />

            {/* 柱顶概率数值 (带半透明背景与高亮防重叠) */}
            {item.p > 0.0005 && (
              <g transform={`translate(${topPos.x}, ${topPos.y - 8})`}>
                <rect
                  x={-19}
                  y={-10}
                  width={38}
                  height={13}
                  fill="#FFFFFF"
                  fillOpacity={0.92}
                  rx={3}
                />
                <text
                  x={0}
                  y={0}
                  fill={
                    isMax ? MATH_COLORS.paramPrimary : CANVAS_COLORS.labelText
                  }
                  fontSize={fontScale(10)}
                  textAnchor="middle"
                  fontWeight={isMax ? "bold" : "600"}
                  className="font-mono"
                >
                  {item.p.toFixed(3)}
                </text>
              </g>
            )}

            {/* 横轴刻度取值 x_i 标注 */}
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

      {/* ================= 5. 期望 E(X) 物理平衡杠杆支点 ================= */}
      <g className="transition-all duration-300">
        {/* 垂直重心虚线 */}
        <line
          x1={meanDesign.x}
          y1={yAxisMax.y - 4}
          x2={meanDesign.x}
          y2={yAxisZero.y}
          stroke={MATH_COLORS.tangentLine}
          strokeWidth={2}
          strokeDasharray="5 4"
        />

        {/* 杠杆支点 (Pivot) */}
        <polygon
          points={`${meanDesign.x},${yAxisZero.y + 2} ${meanDesign.x - 8},${
            yAxisZero.y + 14
          } ${meanDesign.x + 8},${yAxisZero.y + 14}`}
          fill={MATH_COLORS.tangentLine}
          stroke="#FFFFFF"
          strokeWidth={1.5}
        />

        {/* E(X) 期望重心卡片 */}
        <g transform={`translate(${meanDesign.x}, ${yAxisZero.y + 30})`}>
          <rect
            x={-42}
            y={-12}
            width={84}
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
      </g>

      {/* ================= 6. 线性变换 Y = aX + b 的真实双轨道数形联动视角 ================= */}
      {studyMode === "linear" && transformedDist && (
        <g className="transition-all duration-300">
          {distResult.outcomes.map((o, idx) => {
            // 原变量 X 的设计像素坐标
            const xPos = mathToDesign(o.x, 0, scale);
            // 新变量 Y = aX + b 的实际数学位置与像素坐标
            const yMathVal = linearA * o.x + linearB;
            const yPos = mathToDesign(yMathVal, 0, scale);
            const topYPos = mathToDesign(yMathVal, o.p, scale);

            return (
              <g key={`linear-map-${idx}`}>
                {/* 1. 从上轨 X_k 到下轨 Y_k 的动态变换映射指引线 (绝对平行/发散，零交叉) */}
                <line
                  x1={xPos.x}
                  y1={yAxisZero.y + 12}
                  x2={yPos.x}
                  y2={yAxisZero.y + 38}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  className="opacity-70 transition-all duration-300"
                />

                {/* 2. 下轨道 Y_k 处的离散度对比虚线柱 */}
                <rect
                  x={yPos.x - halfBarWidthPx * 0.75}
                  y={topYPos.y + 40}
                  width={halfBarWidthPx * 1.5}
                  height={Math.max(Math.abs(yAxisZero.y - topYPos.y), 2)}
                  fill={withAlpha(MATH_COLORS.paramSecondary, 0.2)}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeDasharray="3 3"
                  strokeWidth={1.2}
                  rx={3}
                  className="transition-all duration-300"
                />

                {/* 3. 下轨道 Y_k 节点数值卡片 */}
                <g transform={`translate(${yPos.x}, ${yAxisZero.y + 42})`}>
                  <rect
                    x={-22}
                    y={-8}
                    width={44}
                    height={15}
                    fill={MATH_COLORS.paramSecondary}
                    rx={3}
                  />
                  <text
                    x={0}
                    y={3}
                    fill="#FFFFFF"
                    fontSize={fontScale(9)}
                    textAnchor="middle"
                    fontWeight="bold"
                    className="font-mono"
                  >
                    y={yMathVal.toFixed(1)}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 4. 新期望 E(Y) = aE(X)+b 重心杠杆支点 (精准落于 y≈475px，不与 515px 处的底部表格发生任何打架) */}
          {(() => {
            const meanYVal = transformedDist.mean;
            const meanYPos = mathToDesign(meanYVal, 0, scale);

            return (
              <g className="transition-all duration-300">
                {/* 垂直期望指示虚线 */}
                <line
                  x1={meanYPos.x}
                  y1={yAxisZero.y + 40}
                  x2={meanYPos.x}
                  y2={yAxisZero.y + 62}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={1.8}
                  strokeDasharray="4 3"
                />

                {/* 下轨 E(Y) 重心支点 (三角形) */}
                <polygon
                  points={`${meanYPos.x},${yAxisZero.y + 62} ${
                    meanYPos.x - 6
                  },${yAxisZero.y + 70} ${meanYPos.x + 6},${yAxisZero.y + 70}`}
                  fill={MATH_COLORS.paramPrimary}
                />

                <g transform={`translate(${meanYPos.x}, ${yAxisZero.y + 80})`}>
                  <rect
                    x={-52}
                    y={-9}
                    width={104}
                    height={18}
                    fill={MATH_COLORS.paramPrimary}
                    rx={3}
                  />
                  <text
                    x={0}
                    y={3}
                    fill="#FFFFFF"
                    fontSize={fontScale(9.5)}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    E(Y) = {meanYVal.toFixed(2)}
                  </text>
                </g>
              </g>
            );
          })()}
        </g>
      )}
    </g>
  );
}
