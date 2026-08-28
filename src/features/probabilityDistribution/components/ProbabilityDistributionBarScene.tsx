import type { DistributionResult } from "@/math/probabilityDistribution";
import { mathToDesign, type Point } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { InteractivePoint } from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";

interface ProbabilityDistributionBarSceneProps {
  studyMode: "binomial" | "hypergeometric" | "general";
  distResult: DistributionResult;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (baseSize: number) => number;
  yAxisZero: Point;
  yAxisMax: Point;
  sigmaMinDesign: Point;
  sigmaMaxDesign: Point;
  meanDesign: Point;
  halfBarWidthPx: number;
  onProbabilityChange?: (index: number, newP: number) => void;
}

/** 标准单轨道柱状分布场景（二项 / 超几何 / 一般分布，含物理力矩天平与拖拽调参） */
export function ProbabilityDistributionBarScene({
  studyMode,
  distResult,
  scale,
  vp,
  fontScale,
  yAxisZero,
  yAxisMax,
  sigmaMinDesign,
  sigmaMaxDesign,
  meanDesign,
  halfBarWidthPx,
  onProbabilityChange,
}: ProbabilityDistributionBarSceneProps) {
  const { outcomes, mean, stdDev, maxP } = distResult;

  return (
    <>
      {/* 1. 方差波动范围包络带 [E(X)-σ, E(X)+σ] */}
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

      {/* 2. 柱状分布列 */}
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
          <g key={`bar-${item.x}-${idx}`} className="group">
            {/* 柱体 */}
            <rect
              x={topPos.x - halfBarWidthPx}
              y={topPos.y}
              width={halfBarWidthPx * 2}
              height={Math.max(barHeight, 2)}
              fill={withAlpha(barColor, isMax ? 0.92 : 0.75)}
              stroke={isMax ? MATH_COLORS.paramPrimary : barColor}
              strokeWidth={isMax ? 2.5 : 1.5}
              rx={4}
              className="transition-all duration-300"
            />

            {/* 最值项金色皇冠标注 */}
            {isMax && studyMode === "binomial" && (
              <g transform={`translate(${topPos.x}, ${topPos.y - 24})`}>
                <path
                  d="M -7 4 L -4 -4 L 0 0 L 4 -4 L 7 4 Z"
                  fill={MATH_COLORS.paramSecondary}
                />
                <text
                  x={0}
                  y={-6}
                  fill={MATH_COLORS.paramSecondary}
                  fontSize={fontScale(9)}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  众数峰值
                </text>
              </g>
            )}

            {/* 柱顶概率数值 (非一般模式或不可拖拽时显示) */}
            {item.p > 0.0005 && studyMode !== "general" && (
              <g transform={`translate(${topPos.x}, ${topPos.y - 8})`}>
                <rect
                  x={-19}
                  y={-10}
                  width={38}
                  height={13}
                  fill={CANVAS_COLORS.white}
                  fillOpacity={0.94}
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

            {/* 一般分布模式下的柱顶拖拽控制点 */}
            {studyMode === "general" && idx < 3 && onProbabilityChange && (
              <InteractivePoint
                cx={item.x}
                cy={item.p}
                scale={scale}
                vp={vp}
                color={MATH_COLORS.paramPrimary}
                fontScale={fontScale}
                onDrag={(mathPt) => {
                  const clampedP = Math.max(
                    0,
                    Math.min(0.8, Number(mathPt.y.toFixed(2))),
                  );
                  onProbabilityChange(idx, clampedP);
                }}
                label={`p${idx}=${item.p.toFixed(2)}`}
              />
            )}

            {/* 一般分布模式下第4项自动归一化标注 */}
            {studyMode === "general" && idx === 3 && (
              <g transform={`translate(${topPos.x}, ${topPos.y - 8})`}>
                <rect
                  x={-28}
                  y={-10}
                  width={56}
                  height={14}
                  fill={CANVAS_COLORS.white}
                  stroke={MATH_COLORS.paramTertiary}
                  strokeWidth={1}
                  fillOpacity={0.94}
                  rx={3}
                />
                <text
                  x={0}
                  y={0}
                  fill={MATH_COLORS.paramTertiary}
                  fontSize={fontScale(9.5)}
                  textAnchor="middle"
                  fontWeight="bold"
                  className="font-mono"
                >
                  p3={item.p.toFixed(2)}
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

      {/* 3. 物理力矩天平与力臂指示（凸显期望力矩平衡本质） */}
      <g className="transition-all duration-300">
        {outcomes.map((item, idx) => {
          if (item.p < 0.01) return null;
          const xDesign = mathToDesign(item.x, 0, scale).x;
          const leverArm = item.x - mean; // 力臂
          const torque = leverArm * item.p; // 力矩
          const isLeft = leverArm < -0.01;
          const isRight = leverArm > 0.01;

          return (
            <g key={`torque-${idx}`}>
              {/* 从支点到各点的力臂连线 */}
              <line
                x1={meanDesign.x}
                y1={yAxisZero.y + 6}
                x2={xDesign}
                y2={yAxisZero.y + 6}
                stroke={
                  isLeft
                    ? MATH_COLORS.primary
                    : isRight
                      ? MATH_COLORS.paramSecondary
                      : CANVAS_COLORS.grid
                }
                strokeWidth={1.5}
                strokeDasharray="2 2"
                strokeOpacity={0.7}
              />
              {/* 力矩标注 */}
              <text
                x={xDesign}
                y={yAxisZero.y + fontScale(30)}
                fill={
                  isLeft
                    ? MATH_COLORS.primary
                    : isRight
                      ? MATH_COLORS.paramSecondary
                      : CANVAS_COLORS.labelText
                }
                fontSize={fontScale(8.5)}
                textAnchor="middle"
                className="font-mono"
              >
                {torque > 0 ? `+${torque.toFixed(2)}` : torque.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* 期望 E(X) 物理平衡杠杆支点 */}
        <line
          x1={meanDesign.x}
          y1={yAxisMax.y - 4}
          x2={meanDesign.x}
          y2={yAxisZero.y}
          stroke={MATH_COLORS.tangentLine}
          strokeWidth={2}
          strokeDasharray="5 4"
        />
        <polygon
          points={`${meanDesign.x},${yAxisZero.y + 2} ${
            meanDesign.x - 8
          },${yAxisZero.y + 14} ${meanDesign.x + 8},${yAxisZero.y + 14}`}
          fill={MATH_COLORS.tangentLine}
          stroke={CANVAS_COLORS.white}
          strokeWidth={1.5}
        />
        <g transform={`translate(${meanDesign.x}, ${yAxisZero.y + 44})`}>
          <rect
            x={-52}
            y={-11}
            width={104}
            height={20}
            fill={MATH_COLORS.tangentLine}
            rx={4}
          />
          <text
            x={0}
            y={3}
            fill={CANVAS_COLORS.white}
            fontSize={fontScale(10.5)}
            textAnchor="middle"
            fontWeight="bold"
          >
            E(X) 支点 = {mean.toFixed(2)}
          </text>
        </g>
      </g>
    </>
  );
}
