import type { DistributionResult } from "@/math/probabilityDistribution";
import { mathToDesign, type Point } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";

interface ProbabilityDistributionLinearSceneProps {
  distResult: DistributionResult;
  transformedDist: DistributionResult;
  scale: SceneScale;
  fontScale: (baseSize: number) => number;
  linearA: number;
  linearB: number;
  leftSafeMargin: number;
  rightSafeMargin: number;
  halfBarWidthPx: number;
  sigmaMinDesign: Point;
  sigmaMaxDesign: Point;
}

/** 模式 4：线性变换 Y=aX+b 专属上下分层双轨道场景 */
export function ProbabilityDistributionLinearScene({
  distResult,
  transformedDist,
  scale,
  fontScale,
  linearA,
  linearB,
  leftSafeMargin,
  rightSafeMargin,
  halfBarWidthPx,
  sigmaMinDesign,
  sigmaMaxDesign,
}: ProbabilityDistributionLinearSceneProps) {
  const { outcomes, mean, stdDev, maxP } = distResult;

  // 上层轨道 Y 坐标 (X 变量，基线位于 y=220px)
  const yTopBase = 220;
  // 下层轨道 Y 坐标 (Y 变量，基线位于 y=445px)
  const yBottomBase = 445;
  // 上下层柱高最大缩放像素
  const maxBarPx = 100;

  const meanXPos = mathToDesign(mean, 0, scale).x;
  const meanYVal = transformedDist.mean;
  const meanYPos = mathToDesign(meanYVal, 0, scale).x;

  return (
    <g className="transition-all duration-300">
      {/* --- 1. 上层轨道：原变量 X 轴系统 --- */}
      <line
        x1={leftSafeMargin - 15}
        y1={yTopBase}
        x2={rightSafeMargin + 25}
        y2={yTopBase}
        stroke={CANVAS_COLORS.axis}
        strokeWidth={2}
      />
      <polygon
        points={`${rightSafeMargin + 32},${yTopBase} ${rightSafeMargin + 22},${
          yTopBase - 4
        } ${rightSafeMargin + 22},${yTopBase + 4}`}
        fill={CANVAS_COLORS.axis}
      />
      <text
        x={rightSafeMargin + 38}
        y={yTopBase + fontScale(4)}
        fill={CANVAS_COLORS.labelText}
        fontSize={fontScale(12)}
        fontWeight="bold"
      >
        X (原变量)
      </text>

      {/* 上层方差波动带 */}
      {stdDev > 0.001 && (
        <rect
          x={sigmaMinDesign.x}
          y={yTopBase - maxBarPx - 10}
          width={Math.max(4, sigmaMaxDesign.x - sigmaMinDesign.x)}
          height={maxBarPx + 10}
          fill={withAlpha(MATH_COLORS.asymptote, 0.08)}
          stroke={withAlpha(MATH_COLORS.asymptote, 0.35)}
          strokeDasharray="4 3"
          rx={4}
        />
      )}

      {/* 上层 X 分布柱体 */}
      {outcomes.map((item, idx) => {
        const xPos = mathToDesign(item.x, 0, scale).x;
        const barH = Math.max(2, item.p * maxBarPx * 2.2);
        const isMax = Math.abs(item.p - maxP) < 1e-6 && item.p > 0;

        return (
          <g key={`top-x-${idx}`}>
            <rect
              x={xPos - halfBarWidthPx}
              y={yTopBase - barH}
              width={halfBarWidthPx * 2}
              height={barH}
              fill={withAlpha(MATH_COLORS.barFill, isMax ? 0.95 : 0.75)}
              stroke={isMax ? MATH_COLORS.paramPrimary : MATH_COLORS.barFill}
              strokeWidth={isMax ? 2.2 : 1.4}
              rx={3}
            />
            {item.p > 0.005 && (
              <text
                x={xPos}
                y={yTopBase - barH - fontScale(5)}
                fill={CANVAS_COLORS.labelText}
                fontSize={fontScale(9.5)}
                textAnchor="middle"
                fontWeight="bold"
                className="font-mono"
              >
                {item.p.toFixed(3)}
              </text>
            )}
            {/* 上轨 X 刻度 */}
            <text
              x={xPos}
              y={yTopBase + fontScale(15)}
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

      {/* 上层 E(X) 支点 */}
      <g>
        <polygon
          points={`${meanXPos},${yTopBase + 2} ${meanXPos - 6},${
            yTopBase + 12
          } ${meanXPos + 6},${yTopBase + 12}`}
          fill={MATH_COLORS.tangentLine}
        />
        <g transform={`translate(${meanXPos}, ${yTopBase + 24})`}>
          <rect
            x={-40}
            y={-9}
            width={80}
            height={18}
            fill={MATH_COLORS.tangentLine}
            rx={3}
          />
          <text
            x={0}
            y={3}
            fill={CANVAS_COLORS.white}
            fontSize={fontScale(9.5)}
            textAnchor="middle"
            fontWeight="bold"
          >
            E(X) = {mean.toFixed(2)}
          </text>
        </g>
      </g>

      {/* --- 2. 中间层：映射对应指引虚线 (从上轨 x_i 到底层 y_i) --- */}
      {outcomes.map((o, idx) => {
        const xPos = mathToDesign(o.x, 0, scale).x;
        const yMathVal = linearA * o.x + linearB;
        const yPos = mathToDesign(yMathVal, 0, scale).x;

        return (
          <g key={`map-arrow-${idx}`}>
            <line
              x1={xPos}
              y1={yTopBase + 36}
              x2={yPos}
              y2={yBottomBase - 120}
              stroke={MATH_COLORS.paramSecondary}
              strokeWidth={1.4}
              strokeDasharray="3 3"
              strokeOpacity={0.7}
            />
          </g>
        );
      })}

      {/* --- 3. 下层轨道：变换后新变量 Y=aX+b 轴系统 --- */}
      <line
        x1={leftSafeMargin - 15}
        y1={yBottomBase}
        x2={rightSafeMargin + 25}
        y2={yBottomBase}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={2}
      />
      <polygon
        points={`${rightSafeMargin + 32},${yBottomBase} ${
          rightSafeMargin + 22
        },${yBottomBase - 4} ${rightSafeMargin + 22},${yBottomBase + 4}`}
        fill={MATH_COLORS.paramSecondary}
      />
      <text
        x={rightSafeMargin + 38}
        y={yBottomBase + fontScale(4)}
        fill={MATH_COLORS.paramSecondary}
        fontSize={fontScale(12)}
        fontWeight="bold"
      >
        Y = aX+b
      </text>

      {/* 下层 Y 分布柱体 (与上轨完全一一对应) */}
      {outcomes.map((item, idx) => {
        const yMathVal = linearA * item.x + linearB;
        const yPos = mathToDesign(yMathVal, 0, scale).x;
        const barH = Math.max(2, item.p * maxBarPx * 2.2);

        return (
          <g key={`bot-y-${idx}`}>
            <rect
              x={yPos - halfBarWidthPx}
              y={yBottomBase - barH}
              width={halfBarWidthPx * 2}
              height={barH}
              fill={withAlpha(MATH_COLORS.paramSecondary, 0.85)}
              stroke={MATH_COLORS.paramSecondary}
              strokeWidth={1.5}
              rx={3}
            />
            {item.p > 0.005 && (
              <text
                x={yPos}
                y={yBottomBase - barH - fontScale(5)}
                fill={MATH_COLORS.paramSecondary}
                fontSize={fontScale(9.5)}
                textAnchor="middle"
                fontWeight="bold"
                className="font-mono"
              >
                {item.p.toFixed(3)}
              </text>
            )}
            {/* 下轨 y 刻度卡片 */}
            <g transform={`translate(${yPos}, ${yBottomBase + 12})`}>
              <rect
                x={-20}
                y={-7}
                width={40}
                height={14}
                fill={MATH_COLORS.paramSecondary}
                rx={2.5}
              />
              <text
                x={0}
                y={3}
                fill={CANVAS_COLORS.white}
                fontSize={fontScale(8.5)}
                textAnchor="middle"
                fontWeight="bold"
                className="font-mono"
              >
                {yMathVal.toFixed(1)}
              </text>
            </g>
          </g>
        );
      })}

      {/* 下层 E(Y) 支点 */}
      <g>
        <polygon
          points={`${meanYPos},${yBottomBase + 24} ${meanYPos - 6},${
            yBottomBase + 34
          } ${meanYPos + 6},${yBottomBase + 34}`}
          fill={MATH_COLORS.paramPrimary}
        />
        <g transform={`translate(${meanYPos}, ${yBottomBase + 46})`}>
          <rect
            x={-46}
            y={-9}
            width={92}
            height={18}
            fill={MATH_COLORS.paramPrimary}
            rx={3}
          />
          <text
            x={0}
            y={3}
            fill={CANVAS_COLORS.white}
            fontSize={fontScale(9.5)}
            textAnchor="middle"
            fontWeight="bold"
          >
            E(Y) = {meanYVal.toFixed(2)}
          </text>
        </g>
      </g>
    </g>
  );
}
