/**
 * src/features/probabilityClassical/components/ClassicalFrequencyScene.tsx
 * 大样本频率试验（选学拓展）：把「频率 converges 到概率」画成一条会收拢的曲线。
 *
 * 中屏只回答一个问题：试验做得越多，频率是否稳定在算出来的概率附近？
 *   - 横轴为试验次数（对数刻度，早期密后期疏，才看得见收拢过程）；
 *   - 纵轴为频率 f_n(A)，落在 [0,1]；
 *   - 橙色实线是算出来的概率 P(A)，浅色带是 ±0.02 容差带。
 */
import React from "react";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import {
  computeClassicalProbability,
  simulateClassicalFrequency,
  type ClassicalModelType,
} from "@/math/probabilityClassical";

export interface ClassicalFrequencySceneProps {
  params: Record<string, unknown>;
  scale: SceneScale;
  fontScale?: (v: number) => number;
}

export const ClassicalFrequencyScene: React.FC<
  ClassicalFrequencySceneProps
> = ({ params, scale, fontScale = (v) => v }) => {
  const modelType = (params.modelType ?? "dice_two") as ClassicalModelType;
  const targetEvent = String(params.targetEvent ?? "sum_k");
  const targetSum = Number(params.targetSum ?? 7);
  const drawMode = (params.drawMode ?? "without_replacement") as
    "without_replacement" | "with_replacement";
  const redBalls = Number(params.redBalls ?? 2);
  const whiteBalls = Number(params.whiteBalls ?? 3);
  const trials = Number(params.trials ?? 600);
  const simSeed = Number(params.simSeed ?? 20260101);

  const mathRes = React.useMemo(
    () =>
      computeClassicalProbability({
        modelType,
        targetEvent,
        targetSum,
        drawMode,
        redBalls,
        whiteBalls,
      }),
    [modelType, targetEvent, targetSum, drawMode, redBalls, whiteBalls],
  );

  const sim = React.useMemo(
    () => simulateClassicalFrequency(mathRes, trials, simSeed),
    [mathRes, trials, simSeed],
  );

  // 绘图区（数学坐标）
  const x0 = -5.3;
  const x1 = 5.3;
  const y0 = -3.2;
  const y1 = 3.4;
  const logMax = Math.log10(1 + Math.max(1, sim.trials));

  /** 试验次数 → 横坐标（对数刻度） */
  const toX = (n: number) => x0 + (Math.log10(1 + n) / logMax) * (x1 - x0);
  /** 频率 → 纵坐标 */
  const toY = (f: number) => y0 + Math.max(0, Math.min(1, f)) * (y1 - y0);

  const p = sim.probability;
  const band = 0.02;

  const pathPoints = sim.track
    .map((pt) => {
      const d = mathToDesign(toX(pt.trials), toY(pt.frequency), scale);
      return `${d.x},${d.y}`;
    })
    .join(" ");

  const probLineY = mathToDesign(0, toY(p), scale).y;
  const bandTopY = mathToDesign(0, toY(Math.min(1, p + band)), scale).y;
  const bandBottomY = mathToDesign(0, toY(Math.max(0, p - band)), scale).y;
  const last = sim.track[sim.track.length - 1];
  const lastPos = last
    ? mathToDesign(toX(last.trials), toY(last.frequency), scale)
    : null;

  const leftX = mathToDesign(x0, 0, scale).x;
  const rightX = mathToDesign(x1, 0, scale).x;
  const bottomY = mathToDesign(0, y0, scale).y;
  const topY = mathToDesign(0, y1, scale).y;

  return (
    <g className="classical-frequency-scene">
      {/* 绘图区底板 */}
      <rect
        x={leftX}
        y={topY}
        width={rightX - leftX}
        height={bottomY - topY}
        fill={CANVAS_COLORS.white}
        stroke={MATH_COLORS.labelText}
        strokeOpacity={0.25}
        rx={6}
      />

      {/* ±0.02 容差带 */}
      <rect
        x={leftX}
        y={bandTopY}
        width={rightX - leftX}
        height={Math.max(1, bandBottomY - bandTopY)}
        fill={withAlpha(MATH_COLORS.accent, 0.12)}
      />

      {/* 概率参考线 */}
      <line
        x1={leftX}
        y1={probLineY}
        x2={rightX}
        y2={probLineY}
        stroke={MATH_COLORS.accent}
        strokeWidth={2}
        strokeDasharray="7 4"
      />
      <text
        x={rightX - fontScale(6)}
        y={probLineY - fontScale(7)}
        textAnchor="end"
        fill={MATH_COLORS.accent}
        fontSize={fontScale(12)}
        fontWeight="bold"
      >
        {`P(A) = ${p.toFixed(4)}`}
      </text>

      {/* 频率轨迹 */}
      {sim.track.length > 1 && (
        <polyline
          points={pathPoints}
          fill="none"
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}

      {/* 终点读数 */}
      {lastPos && (
        <g>
          <circle
            cx={lastPos.x}
            cy={lastPos.y}
            r={fontScale(5)}
            fill={MATH_COLORS.paramPrimary}
            stroke={CANVAS_COLORS.white}
            strokeWidth={1.5}
          />
          <text
            x={lastPos.x - fontScale(6)}
            y={lastPos.y + fontScale(16)}
            textAnchor="end"
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            {`f = ${sim.frequency.toFixed(4)}`}
          </text>
        </g>
      )}

      {/* 坐标轴标签 */}
      <text
        x={(leftX + rightX) / 2}
        y={bottomY + fontScale(20)}
        textAnchor="middle"
        fill={MATH_COLORS.labelText}
        fontSize={fontScale(12)}
      >
        试验次数 n（对数刻度）
      </text>
      <text
        x={leftX - fontScale(8)}
        y={bottomY}
        textAnchor="end"
        fill={MATH_COLORS.labelText}
        fontSize={fontScale(11)}
      >
        0
      </text>
      <text
        x={leftX - fontScale(8)}
        y={topY + fontScale(12)}
        textAnchor="end"
        fill={MATH_COLORS.labelText}
        fontSize={fontScale(11)}
      >
        1
      </text>

      {/* 结论条：这句话是整页的教学落点 */}
      <text
        x={(leftX + rightX) / 2}
        y={topY - fontScale(14)}
        textAnchor="middle"
        fill={
          sim.withinTolerance
            ? MATH_COLORS.paramPrimary
            : MATH_COLORS.degeneracy
        }
        fontSize={fontScale(13)}
        fontWeight="bold"
      >
        {`${sim.trials} 次试验：事件发生 ${sim.hits} 次，频率 ${sim.frequency.toFixed(4)}，与概率偏差 ${sim.absError.toFixed(4)}`}
      </text>
    </g>
  );
};
