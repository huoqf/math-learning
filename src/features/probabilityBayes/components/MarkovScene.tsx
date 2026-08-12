import { useMemo } from "react";
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculateMarkovChain } from "@/math/probabilityBayes";

interface MarkovSceneProps {
  params: Record<string, number>;
  markovPreset?: string;
  fontScale: (v: number) => number;
}

export function MarkovScene({
  params,
  markovPreset = "pass_ball",
  fontScale,
}: MarkovSceneProps) {
  const markovData = useMemo(() => {
    const p1 = params.p1 ?? 1.0;
    const p11 = params.p11 ?? 0.0;
    const p21 = params.p21 ?? 0.5;
    const maxN = params.maxN ?? 10;
    return calculateMarkovChain(p1, p11, p21, maxN);
  }, [params.p1, params.p11, params.p21, params.maxN]);

  // 名称定制
  const labels = useMemo(() => {
    if (markovPreset === "pass_ball") {
      return {
        s1: "状态 1 (球在甲)",
        s2: "状态 2 (球在乙/丙)",
        s1Short: "甲",
        s2Short: "乙/丙",
      };
    }
    if (markovPreset === "urn_ball") {
      return {
        s1: "状态 1 (白球)",
        s2: "状态 2 (黑球)",
        s1Short: "白球",
        s2Short: "黑球",
      };
    }
    if (markovPreset === "weather") {
      return {
        s1: "状态 1 (晴天)",
        s2: "状态 2 (雨天)",
        s1Short: "晴天",
        s2Short: "雨天",
      };
    }
    return {
      s1: "状态 1 (S₁)",
      s2: "状态 2 (S₂)",
      s1Short: "S₁",
      s2Short: "S₂",
    };
  }, [markovPreset]);

  // 1. 左侧拓扑网络节点坐标
  const s1Center = { x: 130, y: 160 };
  const s2Center = { x: 130, y: 390 };
  const nodeRadius = 36;

  // 2. 右侧折线图坐标界限
  const plotLeft = 440;
  const plotRight = 790;
  const plotTop = 380;
  const plotBottom = 545;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  const totalSteps = markovData.steps.length;

  return (
    <g>
      {/* ─── 左区：2-State 状态转移拓扑图 ─── */}
      <text
        x={35}
        y={50}
        fontSize={fontScale(15)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
      >
        1. 状态转移矩阵与拓扑网络
      </text>

      {/* 状态 1 节点 (S1) */}
      <circle
        cx={s1Center.x}
        cy={s1Center.y}
        r={nodeRadius}
        fill={MATH_COLORS.paramPrimary}
        className="shadow-sm"
      />
      <text
        x={s1Center.x}
        y={s1Center.y + 5}
        fontSize={fontScale(15)}
        fontWeight="bold"
        fill={MATH_COLORS.white}
        textAnchor="middle"
      >
        {labels.s1Short}
      </text>

      {/* 状态 2 节点 (S2) */}
      <circle
        cx={s2Center.x}
        cy={s2Center.y}
        r={nodeRadius}
        fill={MATH_COLORS.paramSecondary}
        className="shadow-sm"
      />
      <text
        x={s2Center.x}
        y={s2Center.y + 5}
        fontSize={fontScale(15)}
        fontWeight="bold"
        fill={MATH_COLORS.white}
        textAnchor="middle"
      >
        {labels.s2Short}
      </text>

      {/* S1 节点自环弧 (p11) */}
      <path
        d={`M ${s1Center.x - 20} ${s1Center.y - 28} A 30 30 0 1 1 ${s1Center.x + 20} ${s1Center.y - 28}`}
        fill="none"
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={Math.max(1.5, markovData.p11 * 5)}
        strokeDasharray={markovData.p11 === 0 ? "4 3" : "none"}
      />
      <text
        x={s1Center.x}
        y={s1Center.y - 68}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fill={MATH_COLORS.paramPrimary}
        textAnchor="middle"
      >
        自保持 p₁₁ = {markovData.p11.toFixed(2)}
      </text>

      {/* S2 节点自环弧 (p22) */}
      <path
        d={`M ${s2Center.x - 20} ${s2Center.y + 28} A 30 30 0 1 0 ${s2Center.x + 20} ${s2Center.y + 28}`}
        fill="none"
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={Math.max(1.5, markovData.p22 * 5)}
        strokeDasharray={markovData.p22 === 0 ? "4 3" : "none"}
      />
      <text
        x={s2Center.x}
        y={s2Center.y + 80}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="middle"
      >
        自保持 p₂₂ = {markovData.p22.toFixed(2)}
      </text>

      {/* S1 -> S2 跨节点弧线 (p12) */}
      <path
        d={`M ${s1Center.x + 24} ${s1Center.y + 24} Q ${s1Center.x + 80} ${(s1Center.y + s2Center.y) / 2} ${s2Center.x + 24} ${s2Center.y - 24}`}
        fill="none"
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={Math.max(1.5, markovData.p12 * 5)}
      />
      <text
        x={s1Center.x + 88}
        y={(s1Center.y + s2Center.y) / 2 - 10}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fill={MATH_COLORS.paramPrimary}
      >
        p₁₂ = {markovData.p12.toFixed(2)}
      </text>

      {/* S2 -> S1 跨节点弧线 (p21) */}
      <path
        d={`M ${s2Center.x - 24} ${s2Center.y - 24} Q ${s2Center.x - 80} ${(s1Center.y + s2Center.y) / 2} ${s1Center.x - 24} ${s1Center.y + 24}`}
        fill="none"
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={Math.max(1.5, markovData.p21 * 5)}
      />
      <text
        x={s2Center.x - 145}
        y={(s1Center.y + s2Center.y) / 2 + 15}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
      >
        p₂₁ = {markovData.p21.toFixed(2)}
      </text>

      {/* 转移矩阵显示卡片 */}
      <g transform="translate(40, 485)">
        <rect
          x={0}
          y={0}
          width={310}
          height={85}
          rx={8}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.grid}
          strokeWidth={1.5}
          className="shadow-sm"
        />
        <text
          x={15}
          y={25}
          fontSize={fontScale(13)}
          fontWeight="bold"
          fill={MATH_COLORS.labelText}
        >
          状态转移概率矩阵 P：
        </text>
        <text
          x={15}
          y={52}
          fontSize={fontScale(13)}
          fontFamily="monospace"
          fill={MATH_COLORS.labelTextLight}
        >
          P = [ [ p₁₁={markovData.p11.toFixed(2)}, p₁₂=
          {markovData.p12.toFixed(2)} ]
        </text>
        <text
          x={39}
          y={72}
          fontSize={fontScale(13)}
          fontFamily="monospace"
          fill={MATH_COLORS.labelTextLight}
        >
          [ p₂₁={markovData.p21.toFixed(2)}, p₂₂={markovData.p22.toFixed(2)} ] ]
        </text>
      </g>

      {/* ─── 右上区：全概率单步推导树 (向下偏移避让 top-3 right-3 KaTeX 卡片) ─── */}
      <text
        x={plotLeft - 50}
        y={82}
        fontSize={fontScale(15)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
      >
        2. 全概率单步递推路径 (Step n → Step n+1)
      </text>

      <g transform="translate(390, 100)">
        {/* 背景卡片 */}
        <rect
          x={0}
          y={0}
          width={410}
          height={225}
          rx={8}
          fill={withAlpha(MATH_COLORS.function, 0.03)}
          stroke={MATH_COLORS.grid}
          strokeWidth={1}
        />

        {/* 节点 Sn = 1 */}
        <rect
          x={20}
          y={35}
          width={90}
          height={36}
          rx={6}
          fill={MATH_COLORS.paramPrimary}
        />
        <text
          x={65}
          y={58}
          fontSize={fontScale(12)}
          fill={MATH_COLORS.white}
          textAnchor="middle"
          fontWeight="bold"
        >
          Sₙ = 1 (pₙ)
        </text>

        {/* 节点 Sn = 2 */}
        <rect
          x={20}
          y={155}
          width={90}
          height={36}
          rx={6}
          fill={MATH_COLORS.paramSecondary}
        />
        <text
          x={65}
          y={178}
          fontSize={fontScale(12)}
          fill={MATH_COLORS.white}
          textAnchor="middle"
          fontWeight="bold"
        >
          Sₙ = 2 (1-pₙ)
        </text>

        {/* 目标节点 Sn+1 = 1 */}
        <rect
          x={280}
          y={95}
          width={110}
          height={42}
          rx={8}
          fill={MATH_COLORS.function}
        />
        <text
          x={335}
          y={121}
          fontSize={fontScale(14)}
          fill={MATH_COLORS.white}
          textAnchor="middle"
          fontWeight="bold"
        >
          Sₙ₊₁ = 1 (pₙ₊₁)
        </text>

        {/* 连线 1: Sn=1 -> Sn+1=1 */}
        <line
          x1={110}
          y1={53}
          x2={280}
          y2={106}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={2}
        />
        <rect
          x={155}
          y={63}
          width={80}
          height={20}
          rx={4}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.paramPrimary}
        />
        <text
          x={195}
          y={77}
          fontSize={fontScale(11)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
          textAnchor="middle"
        >
          × p₁₁ ({markovData.p11.toFixed(2)})
        </text>

        {/* 连线 2: Sn=2 -> Sn+1=1 */}
        <line
          x1={110}
          y1={173}
          x2={280}
          y2={126}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={2}
        />
        <rect
          x={155}
          y={145}
          width={80}
          height={20}
          rx={4}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.paramSecondary}
        />
        <text
          x={195}
          y={159}
          fontSize={fontScale(11)}
          fontWeight="bold"
          fill={MATH_COLORS.paramSecondary}
          textAnchor="middle"
        >
          × p₂₁ ({markovData.p21.toFixed(2)})
        </text>

        {/* 底部汇总全概率公式 */}
        <text
          x={205}
          y={215}
          fontSize={fontScale(13)}
          fontWeight="bold"
          fill={MATH_COLORS.function}
          textAnchor="middle"
        >
          全概率式：pₙ₊₁ = pₙ·p₁₁ + (1-pₙ)·p₂₁ = ({markovData.lambda.toFixed(2)}
          )pₙ + {markovData.p21.toFixed(2)}
        </text>
      </g>

      {/* ─── 右下区：概率演化折线与平稳逼近图 ─── */}
      <text
        x={plotLeft - 50}
        y={358}
        fontSize={fontScale(15)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
      >
        3. 概率演化折线与平稳逼近 (N = 1 .. {totalSteps})
      </text>

      {/* 坐标轴框 */}
      <line
        x1={plotLeft}
        y1={plotBottom}
        x2={plotRight}
        y2={plotBottom}
        stroke={MATH_COLORS.axis}
        strokeWidth={2}
      />
      <line
        x1={plotLeft}
        y1={plotTop}
        x2={plotLeft}
        y2={plotBottom}
        stroke={MATH_COLORS.axis}
        strokeWidth={2}
      />

      {/* y = 1.0, 0.5, 0 刻度 */}
      {[0, 0.5, 1.0].map((val) => {
        const yPos = plotBottom - val * plotHeight;
        return (
          <g key={val}>
            <line
              x1={plotLeft - 5}
              y1={yPos}
              x2={plotLeft}
              y2={yPos}
              stroke={MATH_COLORS.axis}
              strokeWidth={1.5}
            />
            <text
              x={plotLeft - 10}
              y={yPos + 4}
              fontSize={fontScale(11)}
              fill={MATH_COLORS.axis}
              textAnchor="end"
            >
              {val.toFixed(1)}
            </text>
            <line
              x1={plotLeft}
              y1={yPos}
              x2={plotRight}
              y2={yPos}
              stroke={MATH_COLORS.grid}
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          </g>
        );
      })}

      {/* 平稳概率 p_infty 虚线参考线 */}
      {!markovData.isDegenerate &&
        markovData.pStationary >= 0 &&
        markovData.pStationary <= 1 && (
          <g>
            <line
              x1={plotLeft}
              y1={plotBottom - markovData.pStationary * plotHeight}
              x2={plotRight}
              y2={plotBottom - markovData.pStationary * plotHeight}
              stroke={MATH_COLORS.focusPoint}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            <text
              x={plotRight - 10}
              y={plotBottom - markovData.pStationary * plotHeight - 6}
              fontSize={fontScale(12)}
              fontWeight="bold"
              fill={MATH_COLORS.focusPoint}
              textAnchor="end"
            >
              平稳极限 p_∞ = {markovData.pStationary.toFixed(3)}
            </text>
          </g>
        )}

      {/* 折线点坐标计算 */}
      {(() => {
        const points = markovData.steps.map((step, idx) => {
          const x = plotLeft + (idx / Math.max(1, totalSteps - 1)) * plotWidth;
          const y = plotBottom - Math.max(0, Math.min(1, step.p1)) * plotHeight;
          return { x, y, step };
        });

        const pathD = points.reduce(
          (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`,
          "",
        );

        return (
          <g>
            {/* 折线 */}
            <path
              d={pathD}
              fill="none"
              stroke={MATH_COLORS.function}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 节点连线圆点与数据标记 */}
            {points.map((pt, i) => (
              <g key={i}>
                <line
                  x1={pt.x}
                  y1={plotBottom}
                  x2={pt.x}
                  y2={plotBottom + 5}
                  stroke={MATH_COLORS.axis}
                  strokeWidth={1.5}
                />
                <text
                  x={pt.x}
                  y={plotBottom + 18}
                  fontSize={fontScale(11)}
                  fill={MATH_COLORS.labelTextLight}
                  textAnchor="middle"
                >
                  n={pt.step.n}
                </text>

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={5}
                  fill={MATH_COLORS.function}
                  stroke={MATH_COLORS.white}
                  strokeWidth={2}
                />

                <text
                  x={pt.x}
                  y={pt.y + (i % 2 === 0 ? -10 : 18)}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                  fill={MATH_COLORS.function}
                  textAnchor="middle"
                >
                  {pt.step.p1.toFixed(3)}
                </text>
              </g>
            ))}
          </g>
        );
      })()}
    </g>
  );
}
