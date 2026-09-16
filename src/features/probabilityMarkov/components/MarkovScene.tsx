import { useMemo, useState } from "react";
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculateMarkovChain } from "@/math/probabilityMarkov";
import { MARKOV_PRESETS } from "@/data/registries/probabilityMarkov";

interface MarkovSceneProps {
  params: Record<string, number>;
  scenarioKey: string;
  fontScale: (v: number) => number;
}

export function MarkovScene({
  params,
  scenarioKey,
  fontScale,
}: MarkovSceneProps) {
  const [plotMode, setPlotMode] = useState<"timeseries" | "cobweb">(
    "timeseries",
  );

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

  const preset = MARKOV_PRESETS[scenarioKey] || MARKOV_PRESETS.pass_ball_2020;
  const labels = preset.labels;

  const currentStepItem =
    markovData.steps.find((s) => s.n === currStep) ?? markovData.steps[0];
  const nextStepItem =
    markovData.steps.find((s) => s.n === currStep + 1) ??
    (currStep < markovData.steps.length
      ? markovData.steps[currStep]
      : currentStepItem);

  // 840 x 650 空间规范排布
  // 1. 左上：状态转移拓扑网络 (x: 45 ~ 405, y: 55 ~ 320)
  const s1Center = { x: 135, y: 175 };
  const s2Center = { x: 315, y: 175 };
  const nodeRadius = 32;

  // 2. 右侧：演化折线与离散散点 (x: 440 ~ 795, y: 55 ~ 455)
  const plotLeft = 465;
  const plotRight = 785;
  const plotTop = 110;
  const plotBottom = 425;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const totalSteps = markovData.steps.length;

  return (
    <g>
      {/* ── 1. 左上：事件状态转移示意图 ── */}
      <text
        x={45}
        y={50}
        fontSize={fontScale(14)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
      >
        1. 事件状态转移示意图 (2-State)
      </text>

      <rect
        x={45}
        y={62}
        width={365}
        height={260}
        rx={12}
        fill={MATH_COLORS.white}
        stroke={MATH_COLORS.axis}
        strokeWidth={1.5}
      />

      {/* S1 状态节点 */}
      <circle
        cx={s1Center.x}
        cy={s1Center.y}
        r={nodeRadius}
        fill={MATH_COLORS.paramPrimary}
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

      {/* S2 状态节点 */}
      <circle
        cx={s2Center.x}
        cy={s2Center.y}
        r={nodeRadius}
        fill={MATH_COLORS.paramSecondary}
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

      {/* S1 自环 */}
      <path
        d={`M ${s1Center.x - 22} ${s1Center.y - 20} A 24 24 0 1 1 ${s1Center.x - 5} ${s1Center.y - 30}`}
        fill="none"
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={Math.max(1.5, markovData.p11 * 5)}
        strokeDasharray={markovData.p11 === 0 ? "4 3" : "none"}
      />
      <text
        x={s1Center.x - 26}
        y={s1Center.y - 42}
        fontSize={fontScale(11)}
        fontWeight="bold"
        fill={MATH_COLORS.paramPrimary}
        textAnchor="middle"
      >
        保持 p₁₁={markovData.p11.toFixed(2)}
      </text>

      {/* S2 自环 */}
      <path
        d={`M ${s2Center.x + 5} ${s2Center.y - 30} A 24 24 0 1 1 ${s2Center.x + 22} ${s2Center.y - 20}`}
        fill="none"
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={Math.max(1.5, markovData.p22 * 5)}
        strokeDasharray={markovData.p22 === 0 ? "4 3" : "none"}
      />
      <text
        x={s2Center.x + 26}
        y={s2Center.y - 42}
        fontSize={fontScale(11)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="middle"
      >
        保持 p₂₂={markovData.p22.toFixed(2)}
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
        y={s1Center.y + 32}
        fontSize={fontScale(11)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="middle"
      >
        ← p₂₁ = {markovData.p21.toFixed(2)}
      </text>

      {/* 状态转移说明 */}
      <text
        x={58}
        y={298}
        fontSize={fontScale(11)}
        fill={MATH_COLORS.labelTextLight}
      >
        递推公比 λ = p₁₁ - p₂₁ = {markovData.lambda.toFixed(2)}，不动点
        (稳态极限) t = {markovData.pStationary.toFixed(3)}
      </text>

      {/* ── 2. 左下：高考四步推演核心看板 ── */}
      <g transform="translate(45, 335)">
        <rect
          x={0}
          y={0}
          width={365}
          height={285}
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
          2. 高考标准推演：第 {currStep} 步 → 第 {currStep + 1} 步
        </text>

        {/* 树状分支展开 */}
        <g transform="translate(18, 38)">
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
          <circle cx={205} cy={82} r={24} fill={MATH_COLORS.function} />
          <text
            x={205}
            y={78}
            fontSize={fontScale(10.5)}
            fontWeight="bold"
            fill={MATH_COLORS.white}
            textAnchor="middle"
          >
            第 {currStep + 1} 步
          </text>
          <text
            x={205}
            y={95}
            fontSize={fontScale(11.5)}
            fontWeight="bold"
            fill={MATH_COLORS.white}
            textAnchor="middle"
          >
            p_{currStep + 1}
          </text>
          <text
            x={255}
            y={86}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fill={MATH_COLORS.function}
          >
            = {nextStepItem.p1.toFixed(3)}
          </text>
        </g>

        {/* 底部代数推导配凑卡 */}
        <g transform="translate(12, 218)">
          <rect
            x={0}
            y={0}
            width={341}
            height={56}
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
            一阶递推：{markovData.recurrenceText}
          </text>
          <text
            x={8}
            y={34}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={MATH_COLORS.derivative}
          >
            待定配凑：{markovData.geometricText}
          </text>
          <text
            x={8}
            y={48}
            fontSize={fontScale(10)}
            fill={MATH_COLORS.labelTextLight}
          >
            通项：{markovData.generalTermText}
          </text>
        </g>
      </g>

      {/* ── 3. 右区：状态概率演化与离散散点 / 蛛网图 ── */}
      <g>
        <text
          x={440}
          y={50}
          fontSize={fontScale(14)}
          fontWeight="bold"
          fill={MATH_COLORS.labelText}
        >
          3.{" "}
          {plotMode === "timeseries"
            ? "离散点列演化与等比衰减"
            : "一阶蛛网图 (选学高观点)"}
        </text>

        {/* 胶囊切换按钮 */}
        <g transform="translate(640, 32)">
          <rect
            x={0}
            y={0}
            width={155}
            height={26}
            rx={13}
            fill={withAlpha(MATH_COLORS.axis, 0.12)}
          />
          <g
            className="cursor-pointer"
            onClick={() => setPlotMode("timeseries")}
          >
            {plotMode === "timeseries" && (
              <rect
                x={2}
                y={2}
                width={74}
                height={22}
                rx={11}
                fill={MATH_COLORS.white}
              />
            )}
            <text
              x={39}
              y={17}
              fontSize={fontScale(11)}
              fontWeight={plotMode === "timeseries" ? "bold" : "normal"}
              fill={
                plotMode === "timeseries"
                  ? MATH_COLORS.function
                  : MATH_COLORS.labelTextLight
              }
              textAnchor="middle"
            >
              📈 离散点列
            </text>
          </g>
          <g className="cursor-pointer" onClick={() => setPlotMode("cobweb")}>
            {plotMode === "cobweb" && (
              <rect
                x={79}
                y={2}
                width={74}
                height={22}
                rx={11}
                fill={MATH_COLORS.white}
              />
            )}
            <text
              x={116}
              y={17}
              fontSize={fontScale(11)}
              fontWeight={plotMode === "cobweb" ? "bold" : "normal"}
              fill={
                plotMode === "cobweb"
                  ? MATH_COLORS.derivative
                  : MATH_COLORS.labelTextLight
              }
              textAnchor="middle"
            >
              🕸️ 蛛网图
            </text>
          </g>
        </g>

        {/* 外框 */}
        <rect
          x={440}
          y={62}
          width={355}
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

        {/* Y 轴刻度与网格 */}
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

        {/* 视图 1：离散点列时序图与等比衰减 */}
        {plotMode === "timeseries" && (
          <g>
            {/* 稳态极限参考线 */}
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
              稳态极限 t = {markovData.pStationary.toFixed(3)}
            </text>

            {/* 离散连线与点 */}
            {markovData.steps.map((step, idx) => {
              const x =
                plotLeft +
                ((step.n - 1) / Math.max(1, totalSteps - 1)) * plotWidth;
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
                    stroke={withAlpha(MATH_COLORS.function, 0.4)}
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
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
                        r={9}
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
                    r={isCurrent ? 6 : 4}
                    fill={
                      isCurrent
                        ? MATH_COLORS.paramPrimary
                        : MATH_COLORS.function
                    }
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
                    n={step.n}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* 视图 2：蛛网图 */}
        {plotMode === "cobweb" && (
          <g>
            {[0, 0.25, 0.5, 0.75, 1.0].map((v) => {
              const x = plotLeft + v * plotWidth;
              return (
                <text
                  key={`x-grid-${v}`}
                  x={x}
                  y={plotBottom + 16}
                  fontSize={fontScale(9.5)}
                  fill={MATH_COLORS.labelTextLight}
                  textAnchor="middle"
                >
                  {v.toFixed(2)}
                </text>
              );
            })}

            <line
              x1={plotLeft}
              y1={plotBottom}
              x2={plotRight}
              y2={plotTop}
              stroke={withAlpha(MATH_COLORS.axis, 0.6)}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text
              x={plotRight - 4}
              y={plotTop + 14}
              fontSize={fontScale(10)}
              fill={MATH_COLORS.labelTextLight}
              textAnchor="end"
            >
              y = x
            </text>

            {(() => {
              const y0 = markovData.p21;
              const y1 = markovData.lambda + markovData.p21;
              const pt0 = { x: plotLeft, y: plotBottom - y0 * plotHeight };
              const pt1 = { x: plotRight, y: plotBottom - y1 * plotHeight };
              return (
                <g>
                  <line
                    x1={pt0.x}
                    y1={pt0.y}
                    x2={pt1.x}
                    y2={pt1.y}
                    stroke={MATH_COLORS.function}
                    strokeWidth={2}
                  />
                  <text
                    x={(pt0.x + pt1.x) / 2 + 10}
                    y={(pt0.y + pt1.y) / 2 - 10}
                    fontSize={fontScale(11)}
                    fontWeight="bold"
                    fill={MATH_COLORS.function}
                    textAnchor="middle"
                  >
                    y = {markovData.recurrenceText}
                  </text>
                </g>
              );
            })()}

            {!markovData.isDegenerate && (
              <g>
                <circle
                  cx={plotLeft + markovData.pStationary * plotWidth}
                  cy={plotBottom - markovData.pStationary * plotHeight}
                  r={5}
                  fill={MATH_COLORS.derivative}
                  stroke={MATH_COLORS.white}
                  strokeWidth={1.5}
                />
                <text
                  x={plotLeft + markovData.pStationary * plotWidth + 8}
                  y={plotBottom - markovData.pStationary * plotHeight - 8}
                  fontSize={fontScale(10.5)}
                  fontWeight="bold"
                  fill={MATH_COLORS.derivative}
                >
                  不动点 ({markovData.pStationary.toFixed(2)},{" "}
                  {markovData.pStationary.toFixed(2)})
                </text>
              </g>
            )}

            {markovData.cobwebPoints.map((pt, idx) => {
              if (idx === 0) return null;
              const prev = markovData.cobwebPoints[idx - 1];
              const x1 = plotLeft + prev.x * plotWidth;
              const y1 = plotBottom - prev.y * plotHeight;
              const x2 = plotLeft + pt.x * plotWidth;
              const y2 = plotBottom - pt.y * plotHeight;
              const isHighlighted = pt.stepIndex <= currStep + 1;

              return (
                <line
                  key={`cobweb-${idx}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    pt.type === "vertical"
                      ? MATH_COLORS.paramPrimary
                      : MATH_COLORS.paramSecondary
                  }
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeOpacity={isHighlighted ? 1 : 0.3}
                />
              );
            })}

            <circle
              cx={plotLeft + p1 * plotWidth}
              cy={plotBottom - p1 * plotHeight}
              r={5}
              fill={MATH_COLORS.paramPrimary}
              stroke={MATH_COLORS.white}
              strokeWidth={1.5}
            />
            <text
              x={plotLeft + p1 * plotWidth - 8}
              y={plotBottom - p1 * plotHeight + 14}
              fontSize={fontScale(10)}
              fontWeight="bold"
              fill={MATH_COLORS.paramPrimary}
              textAnchor="end"
            >
              初值 p₁={p1.toFixed(2)}
            </text>
          </g>
        )}

        {/* ── 4. 右下：高考数列构造通法卡片 ── */}
        <g transform="translate(440, 455)">
          <rect
            x={0}
            y={0}
            width={355}
            height={165}
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
            4. 高考等比数列构造与收敛性分析
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
            ② 配凑形式：{markovData.geometricText}
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
            y={102}
            width={331}
            height={50}
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
              ? "【永久振荡型】λ = -1，奇偶步等幅振荡，通项存在但极限不存在"
              : markovData.isDegenerate
                ? "【自封闭吸收型】λ = 1，系统概率恒等于初值，无需构造"
                : markovData.isOscillating
                  ? "【震荡衰减收敛】公比 -1 < λ < 0，在稳态两侧交替摆动衰减"
                  : "【单调收敛型】公比 0 ≤ λ < 1，单调逼近稳态极限"}
          </text>
          <text
            x={20}
            y={140}
            fontSize={fontScale(10)}
            fill={MATH_COLORS.labelTextLight}
          >
            当前观察：第 {currStep} 步 p_{currStep} ={" "}
            {currentStepItem.p1.toFixed(4)}，偏差 |p_{currStep} - t| ={" "}
            {currentStepItem.absDelta.toFixed(4)}
          </text>
        </g>
      </g>
    </g>
  );
}
