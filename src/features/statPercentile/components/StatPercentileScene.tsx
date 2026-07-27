/**
 * src/features/statPercentile/components/StatPercentileScene.tsx
 * 纯 SVG 渲染，零物理公式，无 useState
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { InteractivePoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  generateHistogramBins,
  calculateHistogramStats,
  calculateStratifiedSampling,
  DEFAULT_BIN_INTERVALS,
} from "@/math/statPercentile";

interface StatPercentileSceneProps {
  params: {
    percentileP: number;
    shift: number;
    sampleN: number;
    N1: number;
    N2: number;
    N3: number;
    mean1: number;
    mean2: number;
    mean3: number;
    var1: number;
    var2: number;
    var3: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode?: "histogram" | "cumulative" | "stratified";
}

export const StatPercentileScene: React.FC<StatPercentileSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "histogram",
}) => {
  const {
    percentileP,
    shift,
    sampleN,
    N1,
    N2,
    N3,
    mean1,
    mean2,
    mean3,
    var1,
    var2,
    var3,
  } = params;

  const bins = React.useMemo(() => generateHistogramBins(shift), [shift]);
  const stats = React.useMemo(
    () => calculateHistogramStats(bins, percentileP),
    [bins, percentileP],
  );

  const strat = React.useMemo(
    () =>
      calculateStratifiedSampling(
        sampleN,
        N1,
        N2,
        N3,
        mean1,
        mean2,
        mean3,
        var1,
        var2,
        var3,
      ),
    [sampleN, N1, N2, N3, mean1, mean2, mean3, var1, var2, var3],
  );

  // 拖拽百分位数点处理：解算横轴 x 位置转换为百分位 p%
  const handlePercentileDrag = React.useCallback(
    (newMathPos: { x: number; y: number }) => {
      const targetX = Math.min(100, Math.max(50, newMathPos.x));
      // 遍历直方图找到对应的累积频率
      let cum = 0;
      for (let i = 0; i < bins.length; i++) {
        const bin = bins[i];
        if (targetX <= bin.xMax || i === bins.length - 1) {
          const ratioInBin = Math.max(
            0,
            Math.min(1, (targetX - bin.xMin) / bin.width),
          );
          const pEst = Math.round((cum + ratioInBin * bin.frequency) * 100);
          onParamChange("percentileP", Math.max(5, Math.min(95, pEst)));
          break;
        }
        cum += bin.frequency;
      }
    },
    [bins, onParamChange],
  );

  // 坐标系绘制基准
  const origin = mathToDesign(scale.xMin, scale.yMin, scale);
  const xAxisEnd = mathToDesign(scale.xMax, scale.yMin, scale);
  const yAxisEnd = mathToDesign(scale.xMin, scale.yMax, scale);

  return (
    <g>
      {/* 1. 基础坐标轴 */}
      <line
        x1={origin.x}
        y1={origin.y}
        x2={xAxisEnd.x}
        y2={xAxisEnd.y}
        stroke={MATH_COLORS.axis}
        strokeWidth={2}
      />
      <line
        x1={origin.x}
        y1={origin.y}
        x2={yAxisEnd.x}
        y2={yAxisEnd.y}
        stroke={MATH_COLORS.axis}
        strokeWidth={2}
      />

      {/* 坐标轴箭头 */}
      <polygon
        points={`${xAxisEnd.x},${xAxisEnd.y} ${xAxisEnd.x - 8},${xAxisEnd.y - 4} ${xAxisEnd.x - 8},${xAxisEnd.y + 4}`}
        fill={MATH_COLORS.axis}
      />
      <polygon
        points={`${yAxisEnd.x},${yAxisEnd.y} ${yAxisEnd.x - 4},${yAxisEnd.y + 8} ${yAxisEnd.x + 4},${yAxisEnd.y + 8}`}
        fill={MATH_COLORS.axis}
      />

      {/* 轴刻度与标签 */}
      {studyMode !== "stratified" && (
        <g>
          <text
            x={xAxisEnd.x - 10}
            y={xAxisEnd.y + 20}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            样本数值 x
          </text>
          <text
            x={yAxisEnd.x - 20}
            y={yAxisEnd.y - 12}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            {studyMode === "cumulative" ? "累积频率 F(x)" : "频率 / 组距 (h)"}
          </text>

          {/* 横轴数字刻度 */}
          {DEFAULT_BIN_INTERVALS.map((int, i) => {
            const ptLeft = mathToDesign(int.min, 0, scale);
            return (
              <g key={`x-tick-${i}`}>
                <line
                  x1={ptLeft.x}
                  y1={ptLeft.y}
                  x2={ptLeft.x}
                  y2={ptLeft.y + 4}
                  stroke={MATH_COLORS.axis}
                  strokeWidth={1.5}
                />
                <text
                  x={ptLeft.x}
                  y={ptLeft.y + 16}
                  textAnchor="middle"
                  fill={MATH_COLORS.labelText}
                  fontSize={fontScale(10)}
                >
                  {int.min}
                </text>
              </g>
            );
          })}
          {/* 最右刻度 100 */}
          {(() => {
            const ptRight = mathToDesign(100, 0, scale);
            return (
              <g>
                <line
                  x1={ptRight.x}
                  y1={ptRight.y}
                  x2={ptRight.x}
                  y2={ptRight.y + 4}
                  stroke={MATH_COLORS.axis}
                  strokeWidth={1.5}
                />
                <text
                  x={ptRight.x}
                  y={ptRight.y + 16}
                  textAnchor="middle"
                  fill={MATH_COLORS.labelText}
                  fontSize={fontScale(10)}
                >
                  100
                </text>
              </g>
            );
          })()}
        </g>
      )}

      {/* ────────────────── 模式 1: 直方图与数字特征 ────────────────── */}
      {studyMode === "histogram" && (
        <g>
          {/* 渲染直方图矩形 */}
          {bins.map((bin, i) => {
            const pTL = mathToDesign(bin.xMin, bin.height, scale);
            const pBR = mathToDesign(bin.xMax, 0, scale);
            const widthPx = Math.abs(pBR.x - pTL.x);
            const heightPx = Math.abs(pBR.y - pTL.y);
            const isTargetBin = i === stats.percentileBinIndex;

            return (
              <g key={`histogram-bin-${i}`}>
                <rect
                  x={pTL.x}
                  y={pTL.y}
                  width={widthPx}
                  height={heightPx}
                  fill={
                    isTargetBin
                      ? withAlpha(MATH_COLORS.paramPrimary, 0.25)
                      : withAlpha(MATH_COLORS.function, 0.18)
                  }
                  stroke={
                    isTargetBin
                      ? MATH_COLORS.paramPrimary
                      : MATH_COLORS.function
                  }
                  strokeWidth={1.5}
                  rx={2}
                />
                {/* 矩形顶部标明频率/高度 */}
                <text
                  x={pTL.x + widthPx / 2}
                  y={pTL.y - 6}
                  textAnchor="middle"
                  fill={
                    isTargetBin
                      ? MATH_COLORS.paramPrimary
                      : MATH_COLORS.labelText
                  }
                  fontSize={fontScale(10)}
                  fontWeight="600"
                >
                  {(bin.frequency * 100).toFixed(0)}% ({bin.height.toFixed(3)})
                </text>
              </g>
            );
          })}

          {/* 百分位 p% 阴影充填 (从 50 到 percentileVal) */}
          {(() => {
            const pVal = stats.percentileVal;
            const ptP = mathToDesign(pVal, 0, scale);
            return (
              <g>
                {/* 百分位分割切线 P_p */}
                <line
                  x1={ptP.x}
                  y1={mathToDesign(pVal, scale.yMax * 0.9, scale).y}
                  x2={ptP.x}
                  y2={ptP.y}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={2.5}
                  strokeDasharray="4 2"
                />
                <rect
                  x={ptP.x - 36}
                  y={mathToDesign(pVal, scale.yMax * 0.92, scale).y - 14}
                  width={72}
                  height={22}
                  rx={4}
                  fill={MATH_COLORS.paramPrimary}
                />
                <text
                  x={ptP.x}
                  y={mathToDesign(pVal, scale.yMax * 0.92, scale).y}
                  textAnchor="middle"
                  fill={MATH_COLORS.white}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  P_{percentileP} = {pVal.toFixed(1)}
                </text>
              </g>
            );
          })()}

          {/* 特征线：平均数 x̄ (虚线) */}
          {(() => {
            const ptMean = mathToDesign(stats.mean, 0, scale);
            return (
              <g>
                <line
                  x1={ptMean.x}
                  y1={mathToDesign(stats.mean, scale.yMax * 0.75, scale).y}
                  x2={ptMean.x}
                  y2={ptMean.y}
                  stroke={MATH_COLORS.function}
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                />
                <text
                  x={ptMean.x}
                  y={mathToDesign(stats.mean, scale.yMax * 0.75, scale).y - 6}
                  textAnchor="middle"
                  fill={MATH_COLORS.function}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  均值 x̄={stats.mean.toFixed(1)}
                </text>
              </g>
            );
          })()}

          {/* 特征线：估算中位数 Me (虚线) */}
          {(() => {
            const ptMed = mathToDesign(stats.median, 0, scale);
            return (
              <g>
                <line
                  x1={ptMed.x}
                  y1={mathToDesign(stats.median, scale.yMax * 0.6, scale).y}
                  x2={ptMed.x}
                  y2={ptMed.y}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
                <text
                  x={ptMed.x}
                  y={mathToDesign(stats.median, scale.yMax * 0.6, scale).y - 6}
                  textAnchor="middle"
                  fill={MATH_COLORS.paramSecondary}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  Me={stats.median.toFixed(1)}
                </text>
              </g>
            );
          })()}

          {/* 可拖拽控制点：在横轴上拖动以动态解算百分位数 */}
          <InteractivePoint
            cx={stats.percentileVal}
            cy={0}
            scale={scale}
            vp={vp}
            onDrag={handlePercentileDrag}
            color={MATH_COLORS.paramPrimary}
            r={7}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ────────────────── 模式 2: 百分位数与累积频率 ────────────────── */}
      {studyMode === "cumulative" && (
        <g>
          {/* 背景直方图参考线 */}
          {bins.map((bin, i) => {
            const pTL = mathToDesign(bin.xMin, bin.cumFrequency, scale);
            const pBR = mathToDesign(bin.xMax, 0, scale);
            return (
              <rect
                key={`cum-bg-${i}`}
                x={pTL.x}
                y={pTL.y}
                width={Math.abs(pBR.x - pTL.x)}
                height={Math.abs(pBR.y - pTL.y)}
                fill={withAlpha(MATH_COLORS.function, 0.06)}
                stroke={withAlpha(MATH_COLORS.function, 0.2)}
                strokeDasharray="2 2"
              />
            );
          })}

          {/* 累积频率 S 型折线 */}
          {(() => {
            const points = [{ x: 50, y: 0 }];
            bins.forEach((b) => points.push({ x: b.xMax, y: b.cumFrequency }));
            const pathStr = points
              .map((p, idx) => {
                const pt = mathToDesign(p.x, p.y, scale);
                return `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`;
              })
              .join(" ");

            return (
              <path
                d={pathStr}
                fill="none"
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={3}
              />
            );
          })()}

          {/* 目标百分位 p% 水平虚线与垂直向下插值线 */}
          {(() => {
            const ratio = percentileP / 100;
            const pVal = stats.percentileVal;
            const ptIntersect = mathToDesign(pVal, ratio, scale);
            const ptY = mathToDesign(scale.xMin, ratio, scale);
            const ptX = mathToDesign(pVal, 0, scale);

            return (
              <g>
                {/* 水平投影虚线 */}
                <line
                  x1={ptY.x}
                  y1={ptY.y}
                  x2={ptIntersect.x}
                  y2={ptIntersect.y}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
                {/* 垂直投影虚线 */}
                <line
                  x1={ptIntersect.x}
                  y1={ptIntersect.y}
                  x2={ptX.x}
                  y2={ptX.y}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />

                {/* 纵轴百分比标签 */}
                <rect
                  x={ptY.x - 44}
                  y={ptY.y - 10}
                  width={40}
                  height={20}
                  rx={3}
                  fill={MATH_COLORS.paramPrimary}
                />
                <text
                  x={ptY.x - 24}
                  y={ptY.y + 4}
                  textAnchor="middle"
                  fill={MATH_COLORS.white}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  {percentileP}%
                </text>

                {/* 横轴插值数值标签 */}
                <rect
                  x={ptX.x - 30}
                  y={ptX.y + 6}
                  width={60}
                  height={20}
                  rx={3}
                  fill={MATH_COLORS.paramPrimary}
                />
                <text
                  x={ptX.x}
                  y={ptX.y + 20}
                  textAnchor="middle"
                  fill={MATH_COLORS.white}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  {pVal.toFixed(2)}
                </text>
              </g>
            );
          })()}

          {/* 交互拖拽交点 */}
          <InteractivePoint
            cx={stats.percentileVal}
            cy={percentileP / 100}
            scale={scale}
            vp={vp}
            onDrag={handlePercentileDrag}
            color={MATH_COLORS.paramPrimary}
            r={7}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ────────────────── 模式 3: 分层抽样与总方差 ────────────────── */}
      {studyMode === "stratified" && (
        <g>
          {/* 上方：总体三层卡片组 (A/B/C) */}
          {(() => {
            const cardWidth = 220;
            const cardHeight = 135;
            const startX = 60;
            const topY = 65;

            const strata = [
              {
                title: "层 A (高一)",
                N: strat.strataN[0],
                n: strat.strataSampleN[0],
                mean: strat.strataMeans[0],
                var: strat.strataVars[0],
                color: MATH_COLORS.paramPrimary,
              },
              {
                title: "层 B (高二)",
                N: strat.strataN[1],
                n: strat.strataSampleN[1],
                mean: strat.strataMeans[1],
                var: strat.strataVars[1],
                color: MATH_COLORS.paramSecondary,
              },
              {
                title: "层 C (高三)",
                N: strat.strataN[2],
                n: strat.strataSampleN[2],
                mean: strat.strataMeans[2],
                var: strat.strataVars[2],
                color: MATH_COLORS.paramTertiary,
              },
            ];

            return (
              <g>
                {/* 标题 */}
                <text
                  x={420}
                  y={35}
                  textAnchor="middle"
                  fill={MATH_COLORS.labelText}
                  fontSize={fontScale(15)}
                  fontWeight="bold"
                >
                  总体 N = {strat.totalN} 人 分层比例映射 → 抽样总量 n ={" "}
                  {strat.sampleN} 人 (抽样比 f ={" "}
                  {(strat.samplingRatio * 100).toFixed(1)}%)
                </text>

                {strata.map((st, i) => {
                  const cx = startX + i * 270;
                  const ratio = ((st.N / strat.totalN) * 100).toFixed(1);

                  return (
                    <g key={`strata-card-${i}`}>
                      {/* 总体卡片 */}
                      <rect
                        x={cx}
                        y={topY}
                        width={cardWidth}
                        height={cardHeight}
                        rx={10}
                        fill={withAlpha(st.color, 0.08)}
                        stroke={st.color}
                        strokeWidth={2}
                      />
                      <text
                        x={cx + cardWidth / 2}
                        y={topY + 26}
                        textAnchor="middle"
                        fill={st.color}
                        fontSize={fontScale(13)}
                        fontWeight="bold"
                      >
                        {st.title}
                      </text>
                      <text
                        x={cx + 16}
                        y={topY + 54}
                        fill={MATH_COLORS.labelText}
                        fontSize={fontScale(11)}
                      >
                        总体人数 N_{i + 1} = {st.N} ({ratio}%)
                      </text>
                      <text
                        x={cx + 16}
                        y={topY + 78}
                        fill={MATH_COLORS.labelText}
                        fontSize={fontScale(11)}
                      >
                        样本均值 x̄_{i + 1} = {st.mean}
                      </text>
                      <text
                        x={cx + 16}
                        y={topY + 102}
                        fill={MATH_COLORS.labelText}
                        fontSize={fontScale(11)}
                      >
                        样本方差 s_{i + 1}² = {st.var}
                      </text>

                      {/* 抽样映射连线箭头 */}
                      <line
                        x1={cx + cardWidth / 2}
                        y1={topY + cardHeight}
                        x2={cx + cardWidth / 2}
                        y2={topY + cardHeight + 55}
                        stroke={st.color}
                        strokeWidth={2.5}
                        strokeDasharray="5 3"
                      />
                      <polygon
                        points={`${cx + cardWidth / 2},${topY + cardHeight + 60} ${cx + cardWidth / 2 - 5},${topY + cardHeight + 50} ${cx + cardWidth / 2 + 5},${topY + cardHeight + 50}`}
                        fill={st.color}
                      />

                      {/* 样本抽取结果标签 */}
                      <rect
                        x={cx + 15}
                        y={topY + cardHeight + 65}
                        width={cardWidth - 30}
                        height={36}
                        rx={8}
                        fill={st.color}
                      />
                      <text
                        x={cx + cardWidth / 2}
                        y={topY + cardHeight + 88}
                        textAnchor="middle"
                        fill={MATH_COLORS.white}
                        fontSize={fontScale(12)}
                        fontWeight="bold"
                      >
                        抽取样本 n_{i + 1} = {st.n} 人
                      </text>
                    </g>
                  );
                })}

                {/* 底部汇总计算展示 */}
                <rect
                  x={60}
                  y={345}
                  width={720}
                  height={100}
                  rx={10}
                  fill={withAlpha(MATH_COLORS.function, 0.06)}
                  stroke={withAlpha(MATH_COLORS.function, 0.3)}
                  strokeWidth={1.5}
                />
                <text
                  x={85}
                  y={375}
                  fill={MATH_COLORS.labelText}
                  fontSize={fontScale(12)}
                  fontWeight="bold"
                >
                  总体加权均值 x̄ = ∑ w_i x̄_i = {strat.totalMean.toFixed(2)}
                </text>
                <text
                  x={85}
                  y={402}
                  fill={MATH_COLORS.paramPrimary}
                  fontSize={fontScale(13)}
                  fontWeight="bold"
                >
                  高考必考总体方差 s² = ∑ w_i [s_i² + (x̄_i - x̄)²] ={" "}
                  {strat.totalVar.toFixed(2)}
                </text>
                <text
                  x={85}
                  y={426}
                  fill={MATH_COLORS.labelText}
                  fontSize={fontScale(11)}
                  className="opacity-80"
                >
                  (组内方差贡献:{" "}
                  {(
                    strat.strataWeights[0] * strat.strataVars[0] +
                    strat.strataWeights[1] * strat.strataVars[1] +
                    strat.strataWeights[2] * strat.strataVars[2]
                  ).toFixed(2)}{" "}
                  + 组间均值离差平方贡献:{" "}
                  {(
                    strat.totalVar -
                    (strat.strataWeights[0] * strat.strataVars[0] +
                      strat.strataWeights[1] * strat.strataVars[1] +
                      strat.strataWeights[2] * strat.strataVars[2])
                  ).toFixed(2)}
                  )
                </text>
              </g>
            );
          })()}
        </g>
      )}
    </g>
  );
};
