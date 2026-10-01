import { useMemo } from "react";
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculateMarkovChain } from "@/math/probabilityMarkov";
import { estimateLabelTextWidth } from "@/utils/labelOverlap";
import { ScenarioPassBall3 } from "./scenarios/ScenarioPassBall3";
import { ScenarioPassBall4 } from "./scenarios/ScenarioPassBall4";
import { ScenarioUrnReplace } from "./scenarios/ScenarioUrnReplace";
import { ScenarioGamePingpong } from "./scenarios/ScenarioGamePingpong";
import { ScenarioFreeExplore } from "./scenarios/ScenarioFreeExplore";

interface MarkovSceneProps {
  params: Record<string, number>;
  scenarioKey: string;
  fontScale: (v: number) => number;
  /**
   * 左屏「高考标准解答分步走」当前步（1 起）。0 / 未传 = 不分步，整屏正常亮度。
   *   第 1 步 → 左屏上半区（状态划分拓扑）
   *   第 2 步 → 左屏下半区（全概汇流管道池）
   *   第 3、4 步 → 右视窗（平衡不动点线与数列点列轨迹）
   */
  activeStep?: number;
  /** 当前步名称，用于中屏围栏标注（由左屏导航同源数据传入） */
  activeStepLabel?: string;
}

export function MarkovScene({
  params,
  scenarioKey,
  fontScale,
  activeStep = 0,
  activeStepLabel,
}: MarkovSceneProps) {
  const p1 = params.p1 ?? 1.0;
  const p11 = params.p11 ?? 0.0;
  const p21 = params.p21 ?? 0.5;
  const maxN = Math.min(15, Math.max(5, Math.round(params.maxN ?? 10)));
  const currStep = Math.min(
    maxN,
    Math.max(1, Math.round(params.currStep ?? 1)),
  );

  const markovData = useMemo(() => {
    return calculateMarkovChain(p1, p11, p21, maxN);
  }, [p1, p11, p21, maxN]);

  const lambda = markovData.lambda;
  const lambdaStr = lambda >= 0 ? lambda.toFixed(2) : `(${lambda.toFixed(2)})`;
  const tVal = markovData.pStationary;
  const diffInit = p1 - tVal;

  // 单步递推 hand-calculated p2
  const p2Recurrence = p11 * p1 + p21 * (1 - p1);
  // 通项公式代入 n=2
  const p2General = tVal + diffInit * lambda;

  // 步步流动数值
  const currentStepData =
    markovData.steps.find((s) => s.n === currStep) ?? markovData.steps[0];
  const pn = currentStepData.p1;
  const pNotN = 1 - pn;
  const flow1 = pn * p11;
  const flow2 = pNotN * p21;
  const pnNext = flow1 + flow2;

  // 840 x 650 黄金画幅两极排布：
  // 左视窗：情境几何与全概流动汇流池 (x: 18 ~ 382, 宽 364, 高 620)
  // 右视窗：高分辨率离散数列演变大图 (x: 398 ~ 822, 宽 424, 高 620)
  const leftX = 18;
  const leftW = 364;
  const rightX = 398;
  const rightW = 424;
  const sceneY = 15;
  const sceneH = 620;

  // ── 分步高亮（左屏点第 N 步 → 中屏只亮该步该看的那一块）────────────────────
  // 未启用分步（activeStep = 0）时全部为 1，保持原有整屏观感不变。
  const regionOpacity = (region: 1 | 2 | 3): number => {
    if (activeStep <= 0) return 1;
    const isActive = region === 3 ? activeStep >= 3 : activeStep === region;
    return isActive ? 1 : 0.3;
  };

  /** 当前步对应的中屏围栏（与 regionOpacity 的分区一一对应） */
  const activeFrame =
    activeStep <= 0
      ? null
      : activeStep === 1
        ? { x: leftX + 4, y: sceneY + 44, w: leftW - 8, h: 240 }
        : activeStep === 2
          ? { x: leftX + 4, y: sceneY + 292, w: leftW - 8, h: sceneH - 296 }
          : { x: rightX + 4, y: sceneY + 44, w: rightW - 8, h: sceneH - 52 };

  /** 围栏顶沿的步骤标牌：文案由左屏 StepNavigator 同源传入，此处只负责排版 */
  const stepChipW =
    activeFrame && activeStepLabel
      ? estimateLabelTextWidth(activeStepLabel, fontScale(11)) + 20
      : 0;

  const scenarioProps = {
    pn,
    pNotN,
    currStep,
    p11,
    p21,
    lambda,
    tVal,
    leftW,
    opacity: regionOpacity(1),
    fontScale,
  };

  return (
    <g>
      <defs>
        {/* 精准实体 SVG 箭头 */}
        <marker
          id="m-arrow-primary"
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 7 3.5, 0 7" fill={MATH_COLORS.paramPrimary} />
        </marker>
        <marker
          id="m-arrow-secondary"
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 7 3.5, 0 7" fill={MATH_COLORS.paramSecondary} />
        </marker>
        <marker
          id="m-arrow-focus"
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 7 3.5, 0 7" fill={MATH_COLORS.focusPoint} />
        </marker>
        <marker
          id="m-arrow-function"
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 7 3.5, 0 7" fill={MATH_COLORS.function} />
        </marker>
      </defs>

      {/* ═════════════════════════════════════════════════════════════════
          左视窗：情境物理状态图与全概率汇流池 (x: 18 ~ 382)
      ═════════════════════════════════════════════════════════════════ */}
      <g transform={`translate(${leftX}, ${sceneY})`}>
        {/* 左视窗大底卡 */}
        <rect
          x={0}
          y={0}
          width={leftW}
          height={sceneH}
          rx={12}
          fill={withAlpha(MATH_COLORS.axis, 0.025)}
          stroke={withAlpha(MATH_COLORS.axis, 0.18)}
          strokeWidth={1.2}
        />

        {/* 视窗标头 */}
        <rect
          x={0}
          y={0}
          width={leftW}
          height={38}
          rx={12}
          fill={withAlpha(MATH_COLORS.paramPrimary, 0.06)}
        />
        <text
          x={14}
          y={24}
          fontSize={fontScale(12.5)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
        >
          【模型建模】状态对称划分与单步全概汇流
        </text>
        <text
          x={leftW - 14}
          y={24}
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.labelTextLight}
          textAnchor="end"
        >
          第 n={currStep} 步
        </text>

        {/* ─────────────────────────────────────────────────────────────
            上半段：5 种模型特化的高中情景拓扑图 (y: 45 ~ 300)
        ───────────────────────────────────────────────────────────── */}
        {scenarioKey === "pass_ball_3" || scenarioKey === "pass_ball_2020" ? (
          <ScenarioPassBall3 {...scenarioProps} />
        ) : scenarioKey === "pass_ball_4" ? (
          <ScenarioPassBall4 {...scenarioProps} />
        ) : scenarioKey === "urn_replace" ? (
          <ScenarioUrnReplace {...scenarioProps} />
        ) : scenarioKey === "game_pingpong" ? (
          <ScenarioGamePingpong {...scenarioProps} />
        ) : (
          <ScenarioFreeExplore {...scenarioProps} />
        )}

        <g transform="translate(0, 295)" opacity={regionOpacity(2)}>
          {/* 汇流池外层框 */}
          <rect
            x={14}
            y={0}
            width={leftW - 28}
            height={310}
            rx={10}
            fill={MATH_COLORS.white}
            stroke={withAlpha(MATH_COLORS.axis, 0.18)}
            strokeWidth={1}
          />
          <text
            x={26}
            y={22}
            fontSize={fontScale(11.5)}
            fontWeight="bold"
            fill={MATH_COLORS.function}
          >
            【全概汇流管道池】第 n 步两路加权汇聚至第 n+1 步
          </text>

          {/* 管道 1：自留流向 (按流量动态加粗管道) */}
          <g transform="translate(26, 36)">
            <rect
              x={0}
              y={0}
              width={145}
              height={55}
              rx={6}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={1.2}
            />
            <text
              x={8}
              y={18}
              fontSize={fontScale(10)}
              fontWeight="bold"
              fill={MATH_COLORS.paramPrimary}
            >
              路径 1：自留贡献流
            </text>
            <text
              x={8}
              y={34}
              fontSize={fontScale(10)}
              fill={MATH_COLORS.labelText}
            >
              P(Aₙ) · P(Aₙ₊₁|Aₙ)
            </text>
            <text
              x={8}
              y={48}
              fontSize={fontScale(10.5)}
              fontWeight="bold"
              fill={MATH_COLORS.paramPrimary}
            >
              = {pn.toFixed(2)} × {p11.toFixed(2)} = {flow1.toFixed(3)}
            </text>
          </g>

          {/* 管道 2：注入流向 */}
          <g transform={`translate(${leftW - 171}, 36)`}>
            <rect
              x={0}
              y={0}
              width={145}
              height={55}
              rx={6}
              fill={withAlpha(MATH_COLORS.paramSecondary, 0.08)}
              stroke={MATH_COLORS.paramSecondary}
              strokeWidth={1.2}
            />
            <text
              x={8}
              y={18}
              fontSize={fontScale(10)}
              fontWeight="bold"
              fill={MATH_COLORS.paramSecondary}
            >
              路径 2：对立注入流
            </text>
            <text
              x={8}
              y={34}
              fontSize={fontScale(10)}
              fill={MATH_COLORS.labelText}
            >
              P(Āₙ) · P(Aₙ₊₁|Āₙ)
            </text>
            <text
              x={8}
              y={48}
              fontSize={fontScale(10.5)}
              fontWeight="bold"
              fill={MATH_COLORS.paramSecondary}
            >
              = {pNotN.toFixed(2)} × {p21.toFixed(2)} = {flow2.toFixed(3)}
            </text>
          </g>

          {/* 汇聚导向管道弧线 */}
          <path
            d={`M 98 93 Q 98 125 ${leftW / 2 - 25} 145`}
            fill="none"
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={Math.max(2, flow1 * 6)}
            markerEnd="url(#m-arrow-primary)"
          />
          <path
            d={`M ${leftW - 98} 93 Q ${leftW - 98} 125 ${leftW / 2 + 25} 145`}
            fill="none"
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={Math.max(2, flow2 * 6)}
            markerEnd="url(#m-arrow-secondary)"
          />

          {/* 汇聚池：第 n+1 步状态 A_{n+1} */}
          <g transform={`translate(${leftW / 2 - 80}, 150)`}>
            <rect
              x={0}
              y={0}
              width={160}
              height={65}
              rx={10}
              fill={withAlpha(MATH_COLORS.focusPoint, 0.08)}
              stroke={MATH_COLORS.focusPoint}
              strokeWidth={2}
            />
            <text
              x={80}
              y={24}
              fontSize={fontScale(12.5)}
              fontWeight="bold"
              fill={MATH_COLORS.focusPoint}
              textAnchor="middle"
            >
              第 n+1 步状态池 Aₙ₊₁
            </text>
            <text
              x={80}
              y={44}
              fontSize={fontScale(11)}
              fontWeight="bold"
              fill={MATH_COLORS.labelText}
              textAnchor="middle"
            >
              {flow1.toFixed(3)} + {flow2.toFixed(3)}
            </text>
            <text
              x={80}
              y={58}
              fontSize={fontScale(12)}
              fontWeight="bold"
              fill={MATH_COLORS.focusPoint}
              textAnchor="middle"
            >
              p_{currStep + 1} = {pnNext.toFixed(3)}
            </text>
          </g>

          {/* 全概公理一阶线性递推核心等式看板 */}
          <g transform="translate(26, 230)">
            <rect
              x={0}
              y={0}
              width={leftW - 52}
              height={66}
              rx={8}
              fill={withAlpha(MATH_COLORS.function, 0.05)}
              stroke={MATH_COLORS.function}
              strokeWidth={1.2}
            />
            <text
              x={12}
              y={20}
              fontSize={fontScale(10.5)}
              fontWeight="bold"
              fill={MATH_COLORS.function}
            >
              一阶全概线性递推式 (第 (1) 问结论)：
            </text>
            <text
              x={(leftW - 52) / 2}
              y={42}
              fontSize={fontScale(13)}
              fontWeight="bold"
              fill={MATH_COLORS.function}
              textAnchor="middle"
            >
              pₙ₊₁ = {lambdaStr} pₙ + {p21.toFixed(2)}
            </text>
            <text
              x={(leftW - 52) / 2}
              y={58}
              fontSize={fontScale(10)}
              fill={MATH_COLORS.labelTextLight}
              textAnchor="middle"
            >
              公比 λ = p₁₁ - p₂₁ = {lambda.toFixed(2)}
            </text>
          </g>
        </g>
      </g>

      {/* ═════════════════════════════════════════════════════════════════
          右视窗：大画幅离散概率数列 {pₙ} 动力学大图 (x: 398 ~ 822)
      ═════════════════════════════════════════════════════════════════ */}
      <g
        transform={`translate(${rightX}, ${sceneY})`}
        opacity={regionOpacity(3)}
      >
        {/* 右视窗大底卡 */}
        <rect
          x={0}
          y={0}
          width={rightW}
          height={sceneH}
          rx={12}
          fill={withAlpha(MATH_COLORS.axis, 0.02)}
          stroke={withAlpha(MATH_COLORS.axis, 0.18)}
          strokeWidth={1.2}
        />

        {/* 视窗标头与收敛形态动态徽章 */}
        <rect
          x={0}
          y={0}
          width={rightW}
          height={42}
          rx={12}
          fill={withAlpha(
            lambda < 0 ? MATH_COLORS.paramPrimary : MATH_COLORS.function,
            0.08,
          )}
        />
        <text
          x={14}
          y={26}
          fontSize={fontScale(12.5)}
          fontWeight="bold"
          fill={MATH_COLORS.labelText}
        >
          【数形结合】离散概率数列 {"{pₙ}"} 演变动力学
        </text>

        {/* 动态动力学收敛徽标 */}
        <rect
          x={rightW - 200}
          y={8}
          width={190}
          height={26}
          rx={6}
          fill={withAlpha(
            markovData.isPureOscillating || markovData.isOscillating
              ? MATH_COLORS.paramPrimary
              : markovData.isDegenerate
                ? MATH_COLORS.labelTextLight
                : MATH_COLORS.function,
            0.12,
          )}
        />
        <text
          x={rightW - 105}
          y={25}
          fontSize={fontScale(10)}
          fontWeight="bold"
          fill={
            markovData.isPureOscillating || markovData.isOscillating
              ? MATH_COLORS.paramPrimary
              : markovData.isDegenerate
                ? MATH_COLORS.labelTextLight
                : MATH_COLORS.function
          }
          textAnchor="middle"
        >
          {markovData.isDegenerate
            ? "λ = 1.00：退化为恒等常数列"
            : markovData.isPureOscillating
              ? "λ = -1.00：两点间等幅振荡 (无衰减)"
              : markovData.isOscillating
                ? `λ = ${lambda.toFixed(2)} < 0：交替阻尼振荡`
                : `λ = ${lambda.toFixed(2)} ≥ 0：单调递进趋近`}
        </text>

        {/* ─────────────────────────────────────────────────────────────
            高大开阔的坐标系绘图视窗 (高 450px！)
        ───────────────────────────────────────────────────────────── */}
        {(() => {
          const plotOriginX = 46;
          const plotOriginY = 62;
          const plotW = 345;
          const plotH = 430;
          const steps = markovData.steps;
          const totalSteps = steps.length;

          // 坐标映射
          const getCoords = (s: { n: number; p1: number }) => {
            const nx =
              totalSteps > 1
                ? plotOriginX + ((s.n - 1) / (totalSteps - 1)) * plotW
                : plotOriginX;
            const ny =
              plotOriginY + (1 - Math.max(0, Math.min(1, s.p1))) * plotH;
            return { x: nx, y: ny };
          };

          const stationaryY =
            plotOriginY + (1 - Math.max(0, Math.min(1, tVal))) * plotH;

          return (
            <g>
              {/* 绘图区背景 */}
              <rect
                x={plotOriginX}
                y={plotOriginY}
                width={plotW}
                height={plotH}
                rx={8}
                fill={MATH_COLORS.white}
                stroke={withAlpha(MATH_COLORS.axis, 0.15)}
                strokeWidth={1}
              />

              {/* 纵轴网格线与刻度 */}
              {[1.0, 0.75, 0.5, 0.25, 0.0].map((v) => {
                const gy = plotOriginY + (1 - v) * plotH;
                return (
                  <g key={v}>
                    <line
                      x1={plotOriginX}
                      y1={gy}
                      x2={plotOriginX + plotW}
                      y2={gy}
                      stroke={withAlpha(MATH_COLORS.axis, 0.1)}
                      strokeDasharray="2 2"
                    />
                    <text
                      x={plotOriginX - 8}
                      y={gy + 4}
                      fontSize={fontScale(9.5)}
                      fill={MATH_COLORS.labelTextLight}
                      textAnchor="end"
                    >
                      {v.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* 不动点平衡线 y = tVal (发光强调线) */}
              <line
                x1={plotOriginX}
                y1={stationaryY}
                x2={plotOriginX + plotW}
                y2={stationaryY}
                stroke={MATH_COLORS.focusPoint}
                strokeWidth={2}
                strokeDasharray="5 3"
              />
              <rect
                x={plotOriginX + plotW - (markovData.isDegenerate ? 140 : 105)}
                y={stationaryY - 22}
                width={markovData.isDegenerate ? 135 : 100}
                height={18}
                rx={4}
                fill={MATH_COLORS.white}
                stroke={MATH_COLORS.focusPoint}
                strokeWidth={1}
              />
              <text
                x={plotOriginX + plotW - (markovData.isDegenerate ? 72 : 55)}
                y={stationaryY - 9}
                fontSize={fontScale(markovData.isDegenerate ? 8.5 : 9.5)}
                fontWeight="bold"
                fill={MATH_COLORS.focusPoint}
                textAnchor="middle"
              >
                {markovData.isDegenerate
                  ? `恒等基准线 p₁ = ${tVal.toFixed(3)}`
                  : `平衡不动点 t = ${tVal.toFixed(3)}`}
              </text>

              {/* 连线轨迹折线 (显示跳跃形态) */}
              <path
                d={steps
                  .map((s, idx) => {
                    const pt = getCoords(s);
                    return `${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
                  })
                  .join(" ")}
                fill="none"
                stroke={withAlpha(
                  lambda < 0 ? MATH_COLORS.paramPrimary : MATH_COLORS.function,
                  0.55,
                )}
                strokeWidth={1.8}
                strokeDasharray={lambda < 0 ? "4 2" : "none"}
              />

              {/* 每个离散点及其垂直垂足针状线 */}
              {steps.map((s) => {
                const pt = getCoords(s);
                const isCurrent = s.n === currStep;

                return (
                  <g key={s.n}>
                    {/* 到平衡线的垂直偏差段 (展现 |p_n - t|) */}
                    <line
                      x1={pt.x}
                      y1={pt.y}
                      x2={pt.x}
                      y2={stationaryY}
                      stroke={withAlpha(MATH_COLORS.focusPoint, 0.3)}
                      strokeWidth={1.5}
                      strokeDasharray="2 2"
                    />

                    {/* 投影到横轴的刻度垂线 */}
                    <line
                      x1={pt.x}
                      y1={pt.y}
                      x2={pt.x}
                      y2={plotOriginY + plotH}
                      stroke={withAlpha(MATH_COLORS.axis, 0.12)}
                      strokeWidth={1}
                    />
                    {/* 横轴项数 n 标签 */}
                    <text
                      x={pt.x}
                      y={plotOriginY + plotH + 16}
                      fontSize={fontScale(9.5)}
                      fontWeight={isCurrent ? "bold" : "normal"}
                      fill={
                        isCurrent
                          ? MATH_COLORS.focusPoint
                          : MATH_COLORS.labelText
                      }
                      textAnchor="middle"
                    >
                      {s.n}
                    </text>

                    {/* 离散点圆圈 */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isCurrent ? 6 : 4}
                      fill={
                        isCurrent
                          ? MATH_COLORS.focusPoint
                          : lambda < 0
                            ? MATH_COLORS.paramPrimary
                            : MATH_COLORS.function
                      }
                      stroke={MATH_COLORS.white}
                      strokeWidth={isCurrent ? 2.5 : 1.5}
                    />

                    {/* 点上方/下方数值标注 */}
                    <text
                      x={pt.x}
                      y={pt.y < stationaryY ? pt.y - 8 : pt.y + 14}
                      fontSize={fontScale(8.5)}
                      fontWeight={isCurrent ? "bold" : "normal"}
                      fill={
                        isCurrent
                          ? MATH_COLORS.focusPoint
                          : MATH_COLORS.labelTextLight
                      }
                      textAnchor="middle"
                    >
                      {s.p1.toFixed(3)}
                    </text>
                  </g>
                );
              })}

              {/* 当前项瞄准十字光标与浮动指示窗 */}
              {(() => {
                const curPt = getCoords(currentStepData);
                return (
                  <g>
                    {/* 发光外圈 */}
                    <circle
                      cx={curPt.x}
                      cy={curPt.y}
                      r={11}
                      fill="none"
                      stroke={MATH_COLORS.focusPoint}
                      strokeWidth={2}
                      strokeDasharray="3 2"
                    />

                    {/* 浮动详细指标面板 */}
                    <g
                      transform={`translate(${Math.max(plotOriginX + 10, Math.min(plotOriginX + plotW - 160, curPt.x - 75))}, ${curPt.y > plotOriginY + 70 ? curPt.y - 48 : curPt.y + 14})`}
                    >
                      <rect
                        x={0}
                        y={0}
                        width={150}
                        height={34}
                        rx={6}
                        fill={MATH_COLORS.white}
                        stroke={MATH_COLORS.focusPoint}
                        strokeWidth={1.5}
                      />
                      <text
                        x={75}
                        y={15}
                        fontSize={fontScale(10)}
                        fontWeight="bold"
                        fill={MATH_COLORS.focusPoint}
                        textAnchor="middle"
                      >
                        第 {currStep} 步：p_{currStep} ={" "}
                        {currentStepData.p1.toFixed(4)}
                      </text>
                      <text
                        x={75}
                        y={28}
                        fontSize={fontScale(9)}
                        fill={MATH_COLORS.labelText}
                        textAnchor="middle"
                      >
                        距不动点偏差：{(currentStepData.p1 - tVal).toFixed(4)}
                      </text>
                    </g>
                  </g>
                );
              })()}

              {/* 横轴标识 */}
              <text
                x={plotOriginX + plotW / 2}
                y={plotOriginY + plotH + 34}
                fontSize={fontScale(10.5)}
                fontWeight="bold"
                fill={MATH_COLORS.labelText}
                textAnchor="middle"
              >
                试验 / 传球轮次 (项数 n)
              </text>
            </g>
          );
        })()}

        {/* ─────────────────────────────────────────────────────────────
            底栏：压轴首项与通项双向极简核验条 (y: 535 ~ 605)
        ───────────────────────────────────────────────────────────── */}
        <g transform="translate(18, 545)">
          <rect
            x={0}
            y={0}
            width={rightW - 36}
            height={60}
            rx={8}
            fill={MATH_COLORS.white}
            stroke={withAlpha(MATH_COLORS.axis, 0.2)}
            strokeWidth={1}
          />
          <text
            x={12}
            y={18}
            fontSize={fontScale(10.5)}
            fontWeight="bold"
            fill={MATH_COLORS.labelText}
          >
            【高考防错核验】单步手算递推 vs 通项公式代入 n=2 双向验算
          </text>
          <text
            x={12}
            y={36}
            fontSize={fontScale(10)}
            fill={MATH_COLORS.function}
          >
            ① 递推手算：p₂ = {p11.toFixed(2)}×{p1.toFixed(2)} + {p21.toFixed(2)}
            ×{(1 - p1).toFixed(2)} ={" "}
            <tspan fontWeight="bold">{p2Recurrence.toFixed(3)}</tspan>
          </text>
          <text
            x={12}
            y={50}
            fontSize={fontScale(10)}
            fill={MATH_COLORS.focusPoint}
          >
            ② 通项代入：p₂ = {tVal.toFixed(3)} + ({diffInit.toFixed(3)})×
            {lambdaStr}¹ ={" "}
            <tspan fontWeight="bold">{p2General.toFixed(3)}</tspan>
            <tspan fill={MATH_COLORS.derivative} fontWeight="bold">
              {"  "}✓ 双路径计算值完全一致
            </tspan>
          </text>
        </g>
      </g>

      {/* ═════════════════════════════════════════════════════════════════
          当前步围栏：把「正在讲的那一步」框出来（非当前区已被 regionOpacity 压暗）
          描边色取 MATH_COLORS.answerStepFrame（分步作答三处同源令牌），与右屏采分步卡片聚焦描边同色
      ═════════════════════════════════════════════════════════════════ */}
      {activeFrame && (
        <g pointerEvents="none">
          <rect
            x={activeFrame.x}
            y={activeFrame.y}
            width={activeFrame.w}
            height={activeFrame.h}
            rx={12}
            fill="none"
            stroke={MATH_COLORS.answerStepFrame}
            strokeWidth={2}
            strokeDasharray="7 4"
          />
          {activeStepLabel && (
            <g
              transform={`translate(${
                activeFrame.x + activeFrame.w / 2 - stepChipW / 2
              }, ${activeFrame.y - 12})`}
            >
              <rect
                x={0}
                y={0}
                width={stepChipW}
                height={24}
                rx={12}
                fill={MATH_COLORS.white}
                stroke={MATH_COLORS.answerStepFrame}
                strokeWidth={1.2}
              />
              <text
                x={stepChipW / 2}
                y={16}
                fontSize={fontScale(11)}
                fontWeight="bold"
                fill={MATH_COLORS.answerStepFrame}
                textAnchor="middle"
              >
                {activeStepLabel}
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
}
