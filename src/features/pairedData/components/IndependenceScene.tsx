import React, { useMemo } from "react";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { calculateIndependenceTest } from "@/math/pairedData";
import { ChiSquarePlot } from "./ChiSquarePlot";

interface IndependenceSceneProps {
  freqA: number;
  freqB: number;
  freqC: number;
  freqD: number;
  labelA?: string;
  labelNotA?: string;
  labelB?: string;
  labelNotB?: string;
  scaleMultiplier?: number;
  fontScale: (size: number) => number;
}

export const IndependenceScene: React.FC<IndependenceSceneProps> = ({
  freqA,
  freqB,
  freqC,
  freqD,
  labelA = "类 A",
  labelNotA = "类 非A",
  labelB = "属性 B",
  labelNotB = "属性 非B",
  scaleMultiplier = 1,
  fontScale,
}) => {
  // 考虑倍增因子的有效观测频数
  const mult = Math.max(1, Math.round(scaleMultiplier));
  const effectiveA = freqA * mult;
  const effectiveB = freqB * mult;
  const effectiveC = freqC * mult;
  const effectiveD = freqD * mult;

  // 独立性检验计算
  const indResult = useMemo(() => {
    return calculateIndependenceTest(
      effectiveA,
      effectiveB,
      effectiveC,
      effectiveD,
    );
  }, [effectiveA, effectiveB, effectiveC, effectiveD]);

  const row1Total = indResult.row1;
  const row2Total = indResult.row2;
  const col1Total = indResult.col1;
  const col2Total = indResult.col2;
  const totalN = indResult.n;

  const ratioA_B = row1Total > 0 ? effectiveA / row1Total : 0;
  const ratioA_NotB = row1Total > 0 ? effectiveB / row1Total : 0;
  const ratioNotA_B = row2Total > 0 ? effectiveC / row2Total : 0;
  const ratioNotA_NotB = row2Total > 0 ? effectiveD / row2Total : 0;
  const deltaP = Math.abs(ratioA_B - ratioNotA_B);

  const minExpected = Math.min(
    indResult.expected.eA,
    indResult.expected.eB,
    indResult.expected.eC,
    indResult.expected.eD,
  );
  const isLargeSampleValid = totalN >= 40 && minExpected >= 5;

  return (
    <g className="paired-data-scene-independence" transform="translate(0, 0)">
      {/* 背景主卡片 */}
      <rect
        x={12}
        y={8}
        width={816}
        height={634}
        rx={12}
        fill={CANVAS_COLORS.gridSubtle}
        stroke={CANVAS_COLORS.grid}
        strokeWidth={1}
      />

      {/* 顶部主标题与核心代入计算公式胶囊栏 */}
      <g transform="translate(0, 24)">
        <text
          x={25}
          y={14}
          fontSize={fontScale(14)}
          fontWeight="bold"
          fill={CANVAS_COLORS.labelText}
        >
          2 × 2 列联表独立性检验实验室
        </text>
        <text
          x={240}
          y={14}
          fontSize={fontScale(9.5)}
          fill={CANVAS_COLORS.labelTextLight}
        >
          (人教A版选择性必修三 · 统计推断)
        </text>

        {/* 顶部右侧代入公式胶囊 */}
        <g transform="translate(420, -6)">
          <rect
            x={0}
            y={0}
            width={395}
            height={28}
            rx={6}
            fill={CANVAS_COLORS.white}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
            filter="drop-shadow(0 1px 3px rgba(0,0,0,0.04))"
          />
          <text
            x={197}
            y={18}
            textAnchor="middle"
            fontSize={fontScale(10)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            χ² = n(ad - bc)² / [(a+b)(c+d)(a+c)(b+d)] ={" "}
            {indResult.chiSquare.toFixed(3)}
          </text>
        </g>
      </g>

      {/* ========================================================================= */}
      {/* 模块 1：左上区 —— 2×2 列联表四格矩阵 (四格表 + 边际合计 + 期望频数 E) */}
      {/* ========================================================================= */}
      <g transform="translate(25, 50)">
        <text
          x={4}
          y={11}
          fontSize={fontScale(11.5)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
        >
          【2 × 2 列联表 (观测频数 O 与 理论期望频数 E)】
        </text>

        {/* 表格外框卡片 */}
        <g transform="translate(0, 18)">
          <rect
            x={0}
            y={0}
            width={385}
            height={148}
            rx={8}
            fill={CANVAS_COLORS.white}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />

          {/* 表头横纵分割线 */}
          <line
            x1={0}
            y1={28}
            x2={385}
            y2={28}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={68}
            x2={385}
            y2={68}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={108}
            x2={385}
            y2={108}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />

          <line
            x1={96}
            y1={0}
            x2={96}
            y2={148}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />
          <line
            x1={192}
            y1={0}
            x2={192}
            y2={148}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />
          <line
            x1={288}
            y1={0}
            x2={288}
            y2={148}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />

          {/* 列表头 */}
          <text
            x={48}
            y={18}
            textAnchor="middle"
            fontSize={fontScale(9.5)}
            fill={CANVAS_COLORS.labelTextLight}
            fontWeight="bold"
          >
            分类变量 X \ Y
          </text>
          <text
            x={144}
            y={18}
            textAnchor="middle"
            fontSize={labelB.length > 4 ? fontScale(9.5) : fontScale(10.5)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            {labelB}
          </text>
          <text
            x={240}
            y={18}
            textAnchor="middle"
            fontSize={labelNotB.length > 4 ? fontScale(9.5) : fontScale(10.5)}
            fill={CANVAS_COLORS.labelTextLight}
            fontWeight="bold"
          >
            {labelNotB}
          </text>
          <text
            x={336}
            y={18}
            textAnchor="middle"
            fontSize={fontScale(10)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            行合计
          </text>

          {/* 行 1: labelA */}
          <text
            x={48}
            y={52}
            textAnchor="middle"
            fontSize={labelA.length > 4 ? fontScale(9) : fontScale(10.5)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            {labelA}
          </text>

          {/* 格 1 (a) */}
          <rect
            x={97}
            y={29}
            width={94}
            height={38}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
          />
          <text
            x={144}
            y={46}
            textAnchor="middle"
            fontSize={fontScale(13.5)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            a = {effectiveA}
          </text>
          <text
            x={144}
            y={61}
            textAnchor="middle"
            fontSize={fontScale(8.5)}
            fill={CANVAS_COLORS.labelTextLight}
          >
            ({(ratioA_B * 100).toFixed(1)}%) · 期望E=
            {indResult.expected.eA.toFixed(1)}
          </text>

          {/* 格 2 (b) */}
          <rect
            x={193}
            y={29}
            width={94}
            height={38}
            fill={withAlpha(MATH_COLORS.paramSecondary, 0.05)}
          />
          <text
            x={240}
            y={46}
            textAnchor="middle"
            fontSize={fontScale(13.5)}
            fill={MATH_COLORS.paramSecondary}
            fontWeight="bold"
          >
            b = {effectiveB}
          </text>
          <text
            x={240}
            y={61}
            textAnchor="middle"
            fontSize={fontScale(8.5)}
            fill={CANVAS_COLORS.labelTextLight}
          >
            ({(ratioA_NotB * 100).toFixed(1)}%) · 期望E=
            {indResult.expected.eB.toFixed(1)}
          </text>

          {/* 行 1 合计 */}
          <text
            x={336}
            y={53}
            textAnchor="middle"
            fontSize={fontScale(12)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            {row1Total}
          </text>

          {/* 行 2: labelNotA */}
          <text
            x={48}
            y={92}
            textAnchor="middle"
            fontSize={labelNotA.length > 4 ? fontScale(9) : fontScale(10.5)}
            fill={MATH_COLORS.paramSecondary}
            fontWeight="bold"
          >
            {labelNotA}
          </text>

          {/* 格 3 (c) */}
          <rect
            x={97}
            y={69}
            width={94}
            height={38}
            fill={withAlpha(MATH_COLORS.paramTertiary, 0.06)}
          />
          <text
            x={144}
            y={86}
            textAnchor="middle"
            fontSize={fontScale(13.5)}
            fill={MATH_COLORS.paramTertiary}
            fontWeight="bold"
          >
            c = {effectiveC}
          </text>
          <text
            x={144}
            y={101}
            textAnchor="middle"
            fontSize={fontScale(8.5)}
            fill={CANVAS_COLORS.labelTextLight}
          >
            ({(ratioNotA_B * 100).toFixed(1)}%) · 期望E=
            {indResult.expected.eC.toFixed(1)}
          </text>

          {/* 格 4 (d) */}
          <rect
            x={193}
            y={69}
            width={94}
            height={38}
            fill={withAlpha(CANVAS_COLORS.labelTextLight, 0.06)}
          />
          <text
            x={240}
            y={86}
            textAnchor="middle"
            fontSize={fontScale(13.5)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            d = {effectiveD}
          </text>
          <text
            x={240}
            y={101}
            textAnchor="middle"
            fontSize={fontScale(8.5)}
            fill={CANVAS_COLORS.labelTextLight}
          >
            ({(ratioNotA_NotB * 100).toFixed(1)}%) · 期望E=
            {indResult.expected.eD.toFixed(1)}
          </text>

          {/* 行 2 合计 */}
          <text
            x={336}
            y={93}
            textAnchor="middle"
            fontSize={fontScale(12)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            {row2Total}
          </text>

          {/* 列合计行 */}
          <text
            x={48}
            y={131}
            textAnchor="middle"
            fontSize={fontScale(10)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            列合计
          </text>
          <text
            x={144}
            y={131}
            textAnchor="middle"
            fontSize={fontScale(12)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            {col1Total}
          </text>
          <text
            x={240}
            y={131}
            textAnchor="middle"
            fontSize={fontScale(12)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            {col2Total}
          </text>

          {/* 总样本数 n */}
          <rect
            x={289}
            y={109}
            width={95}
            height={38}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.12)}
            rx={4}
          />
          <text
            x={336}
            y={124}
            textAnchor="middle"
            fontSize={fontScale(8.5)}
            fill={MATH_COLORS.paramPrimary}
          >
            总样本量
          </text>
          <text
            x={336}
            y={139}
            textAnchor="middle"
            fontSize={fontScale(12.5)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            n = {totalN}
          </text>
        </g>

        {/* 底部对角乘积对比与大样本判定条 */}
        <g transform="translate(0, 172)">
          <rect
            x={0}
            y={0}
            width={385}
            height={24}
            rx={5}
            fill={CANVAS_COLORS.white}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />
          <text
            x={10}
            y={16}
            fontSize={fontScale(9)}
            fill={CANVAS_COLORS.labelText}
            fontWeight="bold"
          >
            交叉积: ad = {effectiveA * effectiveD}, bc ={" "}
            {effectiveB * effectiveC} ⇒ |ad-bc| ={" "}
            {Math.abs(effectiveA * effectiveD - effectiveB * effectiveC)}
          </text>
          <text
            x={375}
            y={16}
            textAnchor="end"
            fontSize={fontScale(8.5)}
            fill={
              isLargeSampleValid
                ? MATH_COLORS.paramTertiary
                : MATH_COLORS.paramSecondary
            }
            fontWeight="bold"
          >
            {isLargeSampleValid
              ? "✓ 大样本条件满足 (n≥40, E≥5)"
              : "⚠ 样本偏小或E<5 (宜参考Yates)"}
          </text>
        </g>
      </g>

      {/* ========================================================================= */}
      {/* 模块 2：右上区 —— 条件频率等高条形图 (含水平基准落差线 Δp 与直观评价) */}
      {/* ========================================================================= */}
      <g transform="translate(430, 50)">
        <text
          x={4}
          y={11}
          fontSize={fontScale(11.5)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
        >
          【等高条形图 · 条件频率差异分析】
        </text>

        {/* 等高图外框卡片 */}
        <g transform="translate(0, 18)">
          <rect
            x={0}
            y={0}
            width={380}
            height={178}
            rx={8}
            fill={CANVAS_COLORS.white}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={1}
          />

          {/* 柱 1: 类 A */}
          <g transform={`translate(${45}, 24)`}>
            <text
              x={40}
              y={-7}
              textAnchor="middle"
              fontSize={fontScale(9.5)}
              fontWeight="bold"
              fill={MATH_COLORS.paramPrimary}
            >
              {labelA.length > 5 ? `${labelA.slice(0, 4)}..` : labelA} (n₁=
              {row1Total})
            </text>
            {/* 上部 B */}
            <rect
              x={0}
              y={0}
              width={80}
              height={108 * ratioA_B}
              fill={MATH_COLORS.paramPrimary}
              rx={3}
              opacity={0.9}
            />
            {ratioA_B > 0.12 && (
              <text
                x={40}
                y={54 * ratioA_B + 4}
                textAnchor="middle"
                fill={CANVAS_COLORS.white}
                fontSize={fontScale(9)}
                fontWeight="bold"
              >
                p₁={(ratioA_B * 100).toFixed(1)}%
              </text>
            )}
            {/* 下部 非B */}
            <rect
              x={0}
              y={108 * ratioA_B}
              width={80}
              height={108 * ratioA_NotB}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.22)}
              rx={3}
            />
            {ratioA_NotB > 0.12 && (
              <text
                x={40}
                y={108 * ratioA_B + 54 * ratioA_NotB + 4}
                textAnchor="middle"
                fill={CANVAS_COLORS.labelText}
                fontSize={fontScale(9)}
                fontWeight="bold"
              >
                {(ratioA_NotB * 100).toFixed(1)}%
              </text>
            )}
          </g>

          {/* 柱 2: 类 非A */}
          <g transform={`translate(${255}, 24)`}>
            <text
              x={40}
              y={-7}
              textAnchor="middle"
              fontSize={fontScale(9.5)}
              fontWeight="bold"
              fill={CANVAS_COLORS.labelText}
            >
              {labelNotA.length > 5 ? `${labelNotA.slice(0, 4)}..` : labelNotA}{" "}
              (n₂={row2Total})
            </text>
            {/* 上部 B (使用与柱1相同的事件主色，确保视觉对比严格对应事件B的发生比例) */}
            <rect
              x={0}
              y={0}
              width={80}
              height={108 * ratioNotA_B}
              fill={MATH_COLORS.paramPrimary}
              rx={3}
              opacity={0.9}
            />
            {ratioNotA_B > 0.12 && (
              <text
                x={40}
                y={54 * ratioNotA_B + 4}
                textAnchor="middle"
                fill={CANVAS_COLORS.white}
                fontSize={fontScale(9)}
                fontWeight="bold"
              >
                p₂={(ratioNotA_B * 100).toFixed(1)}%
              </text>
            )}
            {/* 下部 非B */}
            <rect
              x={0}
              y={108 * ratioNotA_B}
              width={80}
              height={108 * ratioNotA_NotB}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.22)}
              rx={3}
            />
            {ratioNotA_NotB > 0.12 && (
              <text
                x={40}
                y={108 * ratioNotA_B + 54 * ratioNotA_NotB + 4}
                textAnchor="middle"
                fill={CANVAS_COLORS.labelText}
                fontSize={fontScale(9)}
                fontWeight="bold"
              >
                {(ratioNotA_NotB * 100).toFixed(1)}%
              </text>
            )}
          </g>

          {/* 水平对比基准虚线与落差指示 */}
          {row1Total > 0 && row2Total > 0 && (
            <g>
              <line
                x1={125}
                y1={24 + 108 * ratioA_B}
                x2={255}
                y2={24 + 108 * ratioA_B}
                stroke={MATH_COLORS.paramPrimary}
                strokeDasharray="3 3"
                strokeWidth={1.2}
              />
              <line
                x1={125}
                y1={24 + 108 * ratioNotA_B}
                x2={255}
                y2={24 + 108 * ratioNotA_B}
                stroke={CANVAS_COLORS.labelTextLight}
                strokeDasharray="3 3"
                strokeWidth={1.2}
              />

              {/* 落差指示标牌 */}
              {deltaP > 0.01 && (
                <g>
                  <line
                    x1={190}
                    y1={24 + 108 * ratioA_B}
                    x2={190}
                    y2={24 + 108 * ratioNotA_B}
                    stroke={MATH_COLORS.paramTertiary}
                    strokeWidth={2}
                  />
                  <rect
                    x={145}
                    y={
                      24 +
                      108 * Math.min(ratioA_B, ratioNotA_B) +
                      (108 * deltaP) / 2 -
                      12
                    }
                    width={90}
                    height={24}
                    rx={5}
                    fill={MATH_COLORS.paramTertiary}
                    filter="drop-shadow(0 1px 3px rgba(0,0,0,0.12))"
                  />
                  <text
                    x={190}
                    y={
                      24 +
                      108 * Math.min(ratioA_B, ratioNotA_B) +
                      (108 * deltaP) / 2 +
                      3
                    }
                    textAnchor="middle"
                    fill={CANVAS_COLORS.white}
                    fontSize={fontScale(8.5)}
                    fontWeight="bold"
                  >
                    落差|p₁-p₂|: {(deltaP * 100).toFixed(1)}%
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 底部图例 */}
          <g transform="translate(100, 155)">
            <rect
              x={0}
              y={0}
              width={14}
              height={9}
              fill={MATH_COLORS.paramPrimary}
              rx={2}
            />
            <text
              x={18}
              y={8}
              fontSize={fontScale(9)}
              fill={CANVAS_COLORS.labelText}
              fontWeight="bold"
            >
              具有属性: {labelB}
            </text>

            <rect
              x={110}
              y={0}
              width={14}
              height={9}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.22)}
              rx={2}
            />
            <text
              x={128}
              y={8}
              fontSize={fontScale(9)}
              fill={CANVAS_COLORS.labelTextLight}
            >
              无属性: {labelNotB}
            </text>
          </g>
        </g>
      </g>

      {/* ========================================================================= */}
      {/* 模块 3：下半区 —— χ²(1) 分布曲线 · 多级拒绝域 · 高考决策临界标尺 */}
      {/* ========================================================================= */}
      <ChiSquarePlot
        chiSquare={indResult.chiSquare}
        p95={indResult.p95}
        p99={indResult.p99}
        p999={indResult.p999}
        fontScale={fontScale}
      />
    </g>
  );
};
