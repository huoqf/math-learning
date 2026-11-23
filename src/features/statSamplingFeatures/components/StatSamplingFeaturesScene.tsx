import React from "react";
import { CANVAS_COLORS, MATH_COLORS, withAlpha } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  calcLinearTransformStats,
  calcOutlierSensitivity,
  calcSamplingComparison,
  type SampleStats,
  type StatSamplingMode,
} from "@/math/statSamplingFeatures";
import { BASE_SAMPLE_DATA } from "@/data/registries/statSamplingFeatures";

interface StatSamplingFeaturesSceneProps {
  mode: StatSamplingMode;
  params: Record<string, number>;
  insertMean: boolean;
  fontScale: (base: number) => number;
}

/** 绘制单个水平箱线图（五数概括 + 均值标记） */
const BoxPlotRow: React.FC<{
  title: string;
  stats: SampleStats;
  y: number;
  xMin: number;
  xMax: number;
  color: string;
  fontScale: (base: number) => number;
}> = ({ title, stats, y, xMin, xMax, color, fontScale }) => {
  const left = 130;
  const right = 770;
  const span = Math.max(1e-6, xMax - xMin);
  const toX = (v: number) => left + ((v - xMin) / span) * (right - left);

  const xMinPt = toX(stats.min);
  const xQ1 = toX(stats.q1);
  const xMed = toX(stats.median);
  const xQ3 = toX(stats.q3);
  const xMaxPt = toX(stats.max);
  const xMean = toX(stats.mean);
  const boxH = 38;

  return (
    <g>
      <text
        x={35}
        y={y + 5}
        fontSize={fontScale(13)}
        fontWeight="700"
        fill={color}
      >
        {title}
      </text>

      {/* 须线 */}
      <line x1={xMinPt} y1={y} x2={xQ1} y2={y} stroke={color} strokeWidth={2} />
      <line x1={xQ3} y1={y} x2={xMaxPt} y2={y} stroke={color} strokeWidth={2} />
      {/* 两端端线 */}
      <line
        x1={xMinPt}
        y1={y - 12}
        x2={xMinPt}
        y2={y + 12}
        stroke={color}
        strokeWidth={2}
      />
      <line
        x1={xMaxPt}
        y1={y - 12}
        x2={xMaxPt}
        y2={y + 12}
        stroke={color}
        strokeWidth={2}
      />

      {/* IQR 箱体 */}
      <rect
        x={xQ1}
        y={y - boxH / 2}
        width={Math.max(2, xQ3 - xQ1)}
        height={boxH}
        rx={4}
        fill={withAlpha(color, 0.14)}
        stroke={color}
        strokeWidth={2}
      />

      {/* 中位数竖线 */}
      <line
        x1={xMed}
        y1={y - boxH / 2 - 4}
        x2={xMed}
        y2={y + boxH / 2 + 4}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={3}
      />

      {/* 均值菱形点 */}
      <polygon
        points={`${xMean},${y - 8} ${xMean + 8},${y} ${xMean},${y + 8} ${xMean - 8},${y}`}
        fill={MATH_COLORS.paramSecondary}
        stroke={CANVAS_COLORS.white}
        strokeWidth={1.5}
      />

      {/* 样本点分布（圆角小方点替代 circle） */}
      {stats.sorted.map((val, idx) => {
        const px = toX(val);
        return (
          <rect
            key={`pt-${idx}`}
            x={px - 3.5}
            y={y + boxH / 2 + 10}
            width={7}
            height={7}
            rx={3.5}
            fill={withAlpha(color, 0.75)}
          />
        );
      })}

      {/* 关键数值读数 */}
      <text
        x={xMed}
        y={y - boxH / 2 - 10}
        textAnchor="middle"
        fontSize={fontScale(11)}
        fontWeight="700"
        fill={MATH_COLORS.paramPrimary}
      >
        Me={formatMathNumber(stats.median, 1)}
      </text>
      <text
        x={xMean}
        y={y + boxH / 2 + 34}
        textAnchor="middle"
        fontSize={fontScale(11)}
        fontWeight="700"
        fill={MATH_COLORS.paramSecondary}
      >
        均值={formatMathNumber(stats.mean, 2)} · s²=
        {formatMathNumber(stats.variance, 2)}
      </text>
    </g>
  );
};

export const StatSamplingFeaturesScene: React.FC<
  StatSamplingFeaturesSceneProps
> = ({ mode, params, insertMean, fontScale }) => {
  if (mode === "sampling") {
    const res = calcSamplingComparison(
      params.N1 ?? 120,
      params.N2 ?? 180,
      params.N3 ?? 300,
      params.sampleN ?? 30,
    );
    const colors = [
      MATH_COLORS.paramPrimary,
      MATH_COLORS.paramSecondary,
      MATH_COLORS.paramTertiary,
    ];
    const barMaxW = 360;
    const maxSize = Math.max(...res.strata.map((s) => s.size), 1);

    return (
      <g>
        <text
          x={420}
          y={95}
          textAnchor="middle"
          fontSize={fontScale(17)}
          fontWeight="700"
          fill={CANVAS_COLORS.labelText}
        >
          分层按比例抽样：总体 N={res.totalN}，抽取 n={res.sampleN}（抽样比{" "}
          {formatMathNumber(res.samplingFraction * 100, 1)}%）
        </text>
        <text
          x={420}
          y={125}
          textAnchor="middle"
          fontSize={fontScale(13)}
          fill={CANVAS_COLORS.textMuted}
        >
          左侧为各层总体规模柱，右侧方块表示每层按同一比例抽取的代表样本
        </text>

        {res.strata.map((s, idx) => {
          const rowY = 175 + idx * 115;
          const barW = (s.size / maxSize) * barMaxW;
          const c = colors[idx];
          const cols = 10;
          return (
            <g key={s.name}>
              <text
                x={65}
                y={rowY + 26}
                fontSize={fontScale(15)}
                fontWeight="700"
                fill={c}
              >
                {s.name} ({s.size}人)
              </text>
              <rect
                x={175}
                y={rowY + 4}
                width={barW}
                height={34}
                rx={6}
                fill={withAlpha(c, 0.16)}
                stroke={c}
                strokeWidth={2}
              />
              <text
                x={185}
                y={rowY + 26}
                fontSize={fontScale(12.5)}
                fontWeight="600"
                fill={CANVAS_COLORS.labelText}
              >
                占比 {formatMathNumber(s.proportion * 100, 1)}%
              </text>

              {/* 右侧抽取样本矩阵 */}
              <text
                x={570}
                y={rowY - 2}
                fontSize={fontScale(12.5)}
                fontWeight="700"
                fill={c}
              >
                应抽 {s.allocated} 人
              </text>
              <g>
                {Array.from({ length: s.allocated }).map((_, sqIdx) => {
                  const cx = 570 + (sqIdx % cols) * 20;
                  const cy = rowY + 8 + Math.floor(sqIdx / cols) * 18;
                  return (
                    <rect
                      key={`sq-${idx}-${sqIdx}`}
                      x={cx}
                      y={cy}
                      width={14}
                      height={13}
                      rx={3}
                      fill={c}
                    />
                  );
                })}
              </g>
            </g>
          );
        })}

        <rect
          x={130}
          y={520}
          width={580}
          height={62}
          rx={12}
          fill={withAlpha(MATH_COLORS.function, 0.08)}
          stroke={MATH_COLORS.function}
          strokeWidth={1.6}
        />
        <text
          x={420}
          y={556}
          textAnchor="middle"
          fontSize={fontScale(14.5)}
          fontWeight="700"
          fill={MATH_COLORS.function}
        >
          抽样公平性校验：每层个体入样概率均为 {res.sampleN}/{res.totalN} ≈{" "}
          {formatMathNumber(res.samplingFraction, 3)}
        </text>
      </g>
    );
  }

  if (mode === "linearTransform") {
    const a = params.scaleA ?? 2;
    const b = params.shiftB ?? 5;
    const res = calcLinearTransformStats(BASE_SAMPLE_DATA, a, b);
    const allVals = [...res.orig.sorted, ...res.transformed.sorted];
    const xMin = Math.floor(Math.min(...allVals) - 3);
    const xMax = Math.ceil(Math.max(...allVals) + 3);
    const tickCount = 6;

    return (
      <g>
        <text
          x={420}
          y={90}
          textAnchor="middle"
          fontSize={fontScale(17)}
          fontWeight="700"
          fill={CANVAS_COLORS.labelText}
        >
          箱线图对照：原样本 x 与线性变换 y = {formatMathNumber(a, 1)}x{" "}
          {b >= 0 ? "+" : ""} {formatMathNumber(b, 1)}
        </text>

        <BoxPlotRow
          title="原样本 x"
          stats={res.orig}
          y={200}
          xMin={xMin}
          xMax={xMax}
          color={MATH_COLORS.function}
          fontScale={fontScale}
        />

        <BoxPlotRow
          title="新样本 y"
          stats={res.transformed}
          y={360}
          xMin={xMin}
          xMax={xMax}
          color={MATH_COLORS.paramTertiary}
          fontScale={fontScale}
        />

        {/* 共用底部标尺轴 */}
        <line
          x1={130}
          y1={465}
          x2={770}
          y2={465}
          stroke={CANVAS_COLORS.axis}
          strokeWidth={1.8}
        />
        {Array.from({ length: tickCount + 1 }).map((_, idx) => {
          const val = xMin + ((xMax - xMin) * idx) / tickCount;
          const xPos = 130 + ((770 - 130) * idx) / tickCount;
          return (
            <g key={`tick-${idx}`}>
              <line
                x1={xPos}
                y1={465}
                x2={xPos}
                y2={473}
                stroke={CANVAS_COLORS.labelTextLight}
                strokeWidth={1.5}
              />
              <text
                x={xPos}
                y={492}
                textAnchor="middle"
                fontSize={fontScale(11.5)}
                fill={CANVAS_COLORS.textMuted}
              >
                {formatMathNumber(val, 1)}
              </text>
            </g>
          );
        })}

        <rect
          x={130}
          y={520}
          width={640}
          height={58}
          rx={12}
          fill={withAlpha(MATH_COLORS.inequality, 0.08)}
          stroke={MATH_COLORS.inequality}
          strokeWidth={1.5}
        />
        <text
          x={450}
          y={554}
          textAnchor="middle"
          fontSize={fontScale(14)}
          fontWeight="700"
          fill={MATH_COLORS.inequality}
        >
          均值比：{formatMathNumber(res.orig.mean, 2)} →{" "}
          {formatMathNumber(res.transformed.mean, 2)} ｜ 方差缩放倍数：a² ={" "}
          {formatMathNumber(a * a, 2)}
        </text>
      </g>
    );
  }

  // outlierImpact 模式
  const outlierVal = params.outlierVal ?? 16;
  const res = calcOutlierSensitivity(BASE_SAMPLE_DATA, outlierVal, insertMean);
  const allVals = [...res.base.sorted, ...res.perturbed.sorted];
  const xMin = Math.floor(Math.min(...allVals) - 2);
  const xMax = Math.ceil(Math.max(...allVals) + 2);
  const tickCount = 6;

  return (
    <g>
      <text
        x={420}
        y={90}
        textAnchor="middle"
        fontSize={fontScale(17)}
        fontWeight="700"
        fill={CANVAS_COLORS.labelText}
      >
        {insertMean
          ? "追加均值新样本 (n: 8 → 9)：均值保持不变，方差严格缩小"
          : `极端值拉扯效应 (末位样本调为 ${outlierVal})：中位数稳健 vs 均值方差敏感`}
      </text>

      <BoxPlotRow
        title="基准样本"
        stats={res.base}
        y={200}
        xMin={xMin}
        xMax={xMax}
        color={MATH_COLORS.function}
        fontScale={fontScale}
      />

      <BoxPlotRow
        title="扰动样本"
        stats={res.perturbed}
        y={360}
        xMin={xMin}
        xMax={xMax}
        color={MATH_COLORS.paramPrimary}
        fontScale={fontScale}
      />

      <line
        x1={130}
        y1={465}
        x2={770}
        y2={465}
        stroke={CANVAS_COLORS.axis}
        strokeWidth={1.8}
      />
      {Array.from({ length: tickCount + 1 }).map((_, idx) => {
        const val = xMin + ((xMax - xMin) * idx) / tickCount;
        const xPos = 130 + ((770 - 130) * idx) / tickCount;
        return (
          <g key={`otick-${idx}`}>
            <line
              x1={xPos}
              y1={465}
              x2={xPos}
              y2={473}
              stroke={CANVAS_COLORS.labelTextLight}
              strokeWidth={1.5}
            />
            <text
              x={xPos}
              y={492}
              textAnchor="middle"
              fontSize={fontScale(11.5)}
              fill={CANVAS_COLORS.textMuted}
            >
              {formatMathNumber(val, 1)}
            </text>
          </g>
        );
      })}

      <rect
        x={130}
        y={520}
        width={640}
        height={58}
        rx={12}
        fill={withAlpha(MATH_COLORS.paramSecondary, 0.08)}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={1.5}
      />
      <text
        x={450}
        y={554}
        textAnchor="middle"
        fontSize={fontScale(14)}
        fontWeight="700"
        fill={MATH_COLORS.paramSecondary}
      >
        均值变化：{formatMathNumber(res.deltaMean, 2)} ｜ 中位数变化：
        {formatMathNumber(res.deltaMedian, 2)} ｜ 方差变化：
        {formatMathNumber(res.deltaVariance, 2)}
      </text>
    </g>
  );
};
