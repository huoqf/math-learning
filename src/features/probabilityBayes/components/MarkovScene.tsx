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
  const p1 = params.p1 ?? 1.0;
  const p11 = params.p11 ?? 0.0;
  const p21 = params.p21 ?? 0.5;
  const maxN = params.maxN ?? 10;
  const currStep = Math.min(
    maxN,
    Math.max(1, Math.round(params.currStep ?? 1)),
  );

  const markovData = useMemo(() => {
    return calculateMarkovChain(p1, p11, p21, maxN);
  }, [p1, p11, p21, maxN]);

  // 当前选中的步数数据
  const currentStepItem =
    markovData.steps.find((s) => s.n === currStep) ?? markovData.steps[0];
  const nextStepItem =
    markovData.steps.find((s) => s.n === currStep + 1) ??
    (currStep < markovData.steps.length
      ? markovData.steps[currStep]
      : currentStepItem);

  // 场景名称定制
  const labels = useMemo(() => {
    if (markovPreset === "pass_ball") {
      return {
        s1: "状态 1 (球在甲)",
        s2: "状态 2 (球在乙/丙)",
        s1Short: "甲 (S₁)",
        s2Short: "乙/丙 (S₂)",
      };
    }
    if (markovPreset === "urn_ball") {
      return {
        s1: "状态 1 (摸出白球)",
        s2: "状态 2 (摸出黑球)",
        s1Short: "白球 (S₁)",
        s2Short: "黑球 (S₂)",
      };
    }
    if (markovPreset === "weather") {
      return {
        s1: "状态 1 (晴天)",
        s2: "状态 2 (雨天)",
        s1Short: "晴天 (S₁)",
        s2Short: "雨天 (S₂)",
      };
    }
    return {
      s1: "状态 1 (S₁)",
      s2: "状态 2 (S₂)",
      s1Short: "状态 S₁",
      s2Short: "状态 S₂",
    };
  }, [markovPreset]);

  // 840 x 650 标准坐标系
  // 1. 左侧拓扑网络节点坐标 (x: 45 ~ 405, y: 70 ~ 325)
  const s1Center = { x: 135, y: 185 };
  const s2Center = { x: 315, y: 185 };
  const nodeRadius = 32;

  // 2. 右侧折线图坐标界限 (x: 435 ~ 795, y: 70 ~ 450)
  const plotLeft = 460;
  const plotRight = 785;
  const plotTop = 115;
  const plotBottom = 425;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  const totalSteps = markovData.steps.length;

  return (
    <g>
      {/* ─── 左上区：2-State 状态转移拓扑网络 (x: 45 ~ 405, y: 55 ~ 325) ─── */}
      <text
        x={45}
        y={54}
        fontSize={fontScale(15)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
      >
        1. 状态转移矩阵与拓扑网络
      </text>

      {/* 外框底板 */}
      <rect
        x={45}
        y={68}
        width={360}
        height={255}
        rx={12}
        fill={MATH_COLORS.white}
        stroke={MATH_COLORS.axis}
        strokeWidth={1.5}
      />

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
        fontSize={fontScale(13)}
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
        fontSize={fontScale(13)}
        fontWeight="bold"
        fill={MATH_COLORS.white}
        textAnchor="middle"
      >
        {labels.s2Short}
      </text>

      {/* S1 节点自环弧 (p11) */}
      <path
        d={`M ${s1Center.x - 22} ${s1Center.y - 20} A 24 24 0 1 1 ${s1Center.x - 5} ${s1Center.y - 30}`}
        fill="none"
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={Math.max(1.5, markovData.p11 * 5)}
        strokeDasharray={markovData.p11 === 0 ? "4 3" : "none"}
      />
      <text
        x={s1Center.x - 28}
        y={s1Center.y - 42}
        fontSize={fontScale(11)}
        fontWeight="bold"
        fill={MATH_COLORS.paramPrimary}
        textAnchor="middle"
      >
        自保 p₁₁={markovData.p11.toFixed(2)}
      </text>

      {/* S2 节点自环弧 (p22) */}
      <path
        d={`M ${s2Center.x + 5} ${s2Center.y - 30} A 24 24 0 1 1 ${s2Center.x + 22} ${s2Center.y - 20}`}
        fill="none"
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={Math.max(1.5, markovData.p22 * 5)}
        strokeDasharray={markovData.p22 === 0 ? "4 3" : "none"}
      />
      <text
        x={s2Center.x + 28}
        y={s2Center.y - 42}
        fontSize={fontScale(11)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="middle"
      >
        自保 p₂₂={markovData.p22.toFixed(2)}
      </text>

      {/* S1 -> S2 转移弧线 */}
      <path
        d={`M ${s1Center.x + 24} ${s1Center.y - 12} Q ${(s1Center.x + s2Center.x) / 2} ${s1Center.y - 36} ${s2Center.x - 24} ${s1Center.y - 12}`}
        fill="none"
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={Math.max(1.5, markovData.p12 * 5)}
      />
      <text
        x={(s1Center.x + s2Center.x) / 2}
        y={s1Center.y - 26}
        fontSize={fontScale(11)}
        fontWeight="bold"
        fill={MATH_COLORS.paramPrimary}
        textAnchor="middle"
      >
        p₁₂ = {markovData.p12.toFixed(2)} →
      </text>

      {/* S2 -> S1 转移弧线 */}
      <path
        d={`M ${s2Center.x - 24} ${s1Center.y + 12} Q ${(s1Center.x + s2Center.x) / 2} ${s1Center.y + 36} ${s1Center.x + 24} ${s1Center.y + 12}`}
        fill="none"
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={Math.max(1.5, markovData.p21 * 5)}
      />
      <text
        x={(s1Center.x + s2Center.x) / 2}
        y={s1Center.y + 34}
        fontSize={fontScale(11)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="middle"
      >
        ← p₂₁ = {markovData.p21.toFixed(2)}
      </text>

      {/* 底部转移矩阵说明 */}
      <text
        x={58}
        y={305}
        fontSize={fontScale(11)}
        fill={MATH_COLORS.labelTextLight}
      >
        转移矩阵 P = [[{markovData.p11.toFixed(2)}, {markovData.p12.toFixed(2)}
        ], [{markovData.p21.toFixed(2)}, {markovData.p22.toFixed(2)}]]
      </text>

      {/* ─── 左下区：全概率单步推导树 (x: 45 ~ 405, y: 340 ~ 615) ─── */}
      <g transform="translate(45, 340)">
        <rect
          x={0}
          y={0}
          width={360}
          height={275}
          rx={12}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.function}
          strokeWidth={1.5}
        />
        <text
          x={14}
          y={24}
          fontSize={fontScale(13)}
          fontWeight="bold"
          fill={MATH_COLORS.function}
        >
          2. 全概率单步递推（第 {currStep} 步 → 第 {currStep + 1} 步）
        </text>

        {/* 树状单步节点与分支 */}
        <g transform="translate(18, 40)">
          {/* Step n 状态 */}
          <circle cx={24} cy={35} r={18} fill={MATH_COLORS.paramPrimary} />
          <text
            x={24}
            y={39}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={MATH_COLORS.white}
            textAnchor="middle"
          >
            S₁
          </text>
          <text
            x={24}
            y={66}
            fontSize={fontScale(10.5)}
            fontWeight="bold"
            fill={MATH_COLORS.paramPrimary}
            textAnchor="middle"
          >
            p_{currStep}={currentStepItem.p1.toFixed(3)}
          </text>

          <circle cx={24} cy={130} r={18} fill={MATH_COLORS.paramSecondary} />
          <text
            x={24}
            y={134}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={MATH_COLORS.white}
            textAnchor="middle"
          >
            S₂
          </text>
          <text
            x={24}
            y={161}
            fontSize={fontScale(10.5)}
            fontWeight="bold"
            fill={MATH_COLORS.paramSecondary}
            textAnchor="middle"
          >
            {(1 - currentStepItem.p1).toFixed(3)}
          </text>

          {/* 分支连线 */}
          <line
            x1={44}
            y1={35}
            x2={175}
            y2={82}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
          />
          <text
            x={100}
            y={48}
            fontSize={fontScale(10.5)}
            fontWeight="bold"
            fill={MATH_COLORS.paramPrimary}
          >
            × p₁₁ ({markovData.p11.toFixed(2)})
          </text>

          <line
            x1={44}
            y1={130}
            x2={175}
            y2={82}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2}
          />
          <text
            x={100}
            y={122}
            fontSize={fontScale(10.5)}
            fontWeight="bold"
            fill={MATH_COLORS.paramSecondary}
          >
            × p₂₁ ({markovData.p21.toFixed(2)})
          </text>

          {/* Step n+1 汇总 */}
          <circle cx={205} cy={82} r={26} fill={MATH_COLORS.function} />
          <text
            x={205}
            y={78}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={MATH_COLORS.white}
            textAnchor="middle"
          >
            第 {currStep + 1} 步
          </text>
          <text
            x={205}
            y={95}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fill={MATH_COLORS.white}
            textAnchor="middle"
          >
            p_{currStep + 1}
          </text>
          <text
            x={265}
            y={86}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fill={MATH_COLORS.function}
          >
            = {nextStepItem.p1.toFixed(3)}
          </text>
        </g>

        {/* 底部汇总全概率展开式 */}
        <g transform="translate(12, 222)">
          <rect
            x={0}
            y={0}
            width={336}
            height={42}
            rx={6}
            fill={withAlpha(MATH_COLORS.function, 0.08)}
          />
          <text
            x={8}
            y={18}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={MATH_COLORS.function}
          >
            p_{currStep + 1} = {currentStepItem.p1.toFixed(3)}×
            {markovData.p11.toFixed(2)} + {(1 - currentStepItem.p1).toFixed(3)}×
            {markovData.p21.toFixed(2)}
          </text>
          <text
            x={8}
            y={34}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={MATH_COLORS.labelText}
          >
            化简：pₙ₊₁ = {markovData.recurrenceText}
          </text>
        </g>
      </g>

      {/* ─── 右区：状态概率演化折线图 (x: 435 ~ 795, y: 55 ~ 455) ─── */}
      <text
        x={435}
        y={54}
        fontSize={fontScale(15)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
      >
        3. 状态概率演化折线与稳态逼近
      </text>

      {/* 外框底板 */}
      <rect
        x={435}
        y={68}
        width={360}
        height={380}
        rx={12}
        fill={MATH_COLORS.white}
        stroke={MATH_COLORS.axis}
        strokeWidth={1.5}
      />

      {/* 坐标轴 */}
      <line
        x1={plotLeft}
        y1={plotBottom}
        x2={plotRight}
        y2={plotBottom}
        stroke={MATH_COLORS.axis}
        strokeWidth={1.5}
      />
      <line
        x1={plotLeft}
        y1={plotTop}
        x2={plotLeft}
        y2={plotBottom}
        stroke={MATH_COLORS.axis}
        strokeWidth={1.5}
      />

      {/* 刻度线与网格 */}
      {[0, 0.25, 0.5, 0.75, 1.0].map((v) => {
        const y = plotBottom - v * plotHeight;
        return (
          <g key={`y-grid-${v}`}>
            <line
              x1={plotLeft}
              y1={y}
              x2={plotRight}
              y2={y}
              stroke={withAlpha(MATH_COLORS.axis, 0.2)}
              strokeDasharray="3 3"
            />
            <text
              x={plotLeft - 8}
              y={y + 4}
              fontSize={fontScale(10)}
              fill={MATH_COLORS.labelTextLight}
              textAnchor="end"
            >
              {v.toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* 平稳分布渐近线 */}
      <line
        x1={plotLeft}
        y1={plotBottom - markovData.pStationary * plotHeight}
        x2={plotRight}
        y2={plotBottom - markovData.pStationary * plotHeight}
        stroke={MATH_COLORS.derivative}
        strokeWidth={2}
        strokeDasharray="5 3"
      />
      <text
        x={plotRight}
        y={plotBottom - markovData.pStationary * plotHeight - 6}
        fontSize={fontScale(11)}
        fontWeight="bold"
        fill={MATH_COLORS.derivative}
        textAnchor="end"
      >
        稳态极限 p_∞ = {markovData.pStationary.toFixed(3)}
      </text>

      {/* 演化折线与点 */}
      {markovData.steps.map((step, idx) => {
        const x =
          plotLeft + ((step.n - 1) / Math.max(1, totalSteps - 1)) * plotWidth;
        const y = plotBottom - step.p1 * plotHeight;
        const isCurrent = step.n === currStep;

        let nextLine = null;
        if (idx < totalSteps - 1) {
          const nextStep = markovData.steps[idx + 1];
          const nextX =
            plotLeft + ((nextStep.n - 1) / (totalSteps - 1)) * plotWidth;
          const nextY = plotBottom - nextStep.p1 * plotHeight;
          nextLine = (
            <line
              key={`line-${idx}`}
              x1={x}
              y1={y}
              x2={nextX}
              y2={nextY}
              stroke={MATH_COLORS.function}
              strokeWidth={2}
            />
          );
        }

        return (
          <g key={`point-${step.n}`}>
            {nextLine}
            {isCurrent && (
              <g>
                <circle
                  cx={x}
                  cy={y}
                  r={10}
                  fill={withAlpha(MATH_COLORS.paramPrimary, 0.25)}
                />
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={plotBottom}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeDasharray="2 2"
                  strokeWidth={1}
                />
              </g>
            )}
            <circle
              cx={x}
              cy={y}
              r={isCurrent ? 6 : 4.5}
              fill={isCurrent ? MATH_COLORS.paramPrimary : MATH_COLORS.function}
              stroke={MATH_COLORS.white}
              strokeWidth={1.5}
            />
            <text
              x={x}
              y={plotBottom + 16}
              fontSize={fontScale(9.5)}
              fontWeight={isCurrent ? "bold" : "normal"}
              fill={
                isCurrent
                  ? MATH_COLORS.paramPrimary
                  : MATH_COLORS.labelTextLight
              }
              textAnchor="middle"
            >
              {step.n}
            </text>
          </g>
        );
      })}

      {/* ─── 右下区：通项公式与高考数列构造卡片 (x: 435 ~ 795, y: 460 ~ 615) ─── */}
      <g transform="translate(435, 460)">
        <rect
          x={0}
          y={0}
          width={360}
          height={155}
          rx={12}
          fill={withAlpha(MATH_COLORS.derivative, 0.04)}
          stroke={withAlpha(MATH_COLORS.derivative, 0.3)}
          strokeWidth={1.5}
        />
        <text
          x={14}
          y={22}
          fontSize={fontScale(12.5)}
          fontWeight="bold"
          fill={MATH_COLORS.derivative}
        >
          4. 新高考核心：等比数列构造通法
        </text>

        <text
          x={14}
          y={44}
          fontSize={fontScale(11)}
          fill={MATH_COLORS.labelText}
        >
          ① 递推公比：λ = p₁₁ - p₂₁ = {markovData.lambda.toFixed(2)}
        </text>
        <text
          x={14}
          y={66}
          fontSize={fontScale(11)}
          fill={MATH_COLORS.labelText}
        >
          ② 等比形式：{markovData.geometricText}
        </text>
        <text
          x={14}
          y={88}
          fontSize={fontScale(11)}
          fontWeight="bold"
          fill={MATH_COLORS.derivative}
        >
          ③ 通项公式：{markovData.generalTermText}
        </text>

        <rect
          x={12}
          y={104}
          width={336}
          height={40}
          rx={6}
          fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
        />
        <text
          x={20}
          y={122}
          fontSize={fontScale(10.5)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
        >
          {markovData.isPureOscillating
            ? "【永久振荡型】公比 λ = -1，在两点间等幅振荡，无稳态极限"
            : markovData.isDegenerate
              ? "【吸收退化型】公比 λ = 1，系统处于自封闭态，概率恒定"
              : markovData.isOscillating
                ? "【震荡收敛型】公比 -1 < λ < 0，在稳态两侧交替摆动逼近"
                : "【单调收敛型】公比 0 ≤ λ < 1，单调逼近稳态极限"}
        </text>
        <text
          x={20}
          y={136}
          fontSize={fontScale(9.5)}
          fill={MATH_COLORS.labelTextLight}
        >
          当前观察：第 {currStep} 步 p_{currStep} ={" "}
          {currentStepItem.p1.toFixed(4)}
        </text>
      </g>
    </g>
  );
}
