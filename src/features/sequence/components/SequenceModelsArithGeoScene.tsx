/**
 * src/features/sequence/components/SequenceModelsArithGeoScene.tsx
 * 数列实验室 - 高考求和模型 1：错位相减法
 * (支持 4 步推演：原和式列柱 / 同乘 q 错位对齐 / 相减成纯等比+负向尾项 / (An+B)q^n+C 化简与双项回验)
 */
import { CoordinateGrid } from "@/components/Math";
import { CANVAS_PRESETS, MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { formatMathNumber } from "@/utils/mathFormat";
import type { SceneScale, ViewportInfo } from "@/hooks";
import {
  calcArithGeoSplit,
  type ArithGeoSplitResult,
  type ArithGeoSplitTerm,
} from "@/math/sequence";
import { toSub, toSup } from "./SequenceText";
import { AxisBreakBanner, SequenceTruncatedBar } from "./SequenceTruncatedBar";

const DESIGN_CENTER_X = CANVAS_PRESETS.full.width / 2;
const FULL_WIDTH = CANVAS_PRESETS.full.width;
const FULL_HEIGHT = CANVAS_PRESETS.full.height;

/** 夹紧 SVG 文本中心 X 坐标，防止第 1/N+1 项长标签越出画布 */
function clampLabelX(x: number, pad = 26) {
  return Math.max(pad, Math.min(FULL_WIDTH - pad, x));
}

/** 构造纯文本 SVG 友好的 (An + B)·qⁿ + C 闭式字符串 */
function formatClosedFormSvg(
  A: number,
  B: number,
  C: number,
  q: number,
): string {
  const fmt = (v: number) => formatMathNumber(v, 2);
  const qStr = q < 0 ? `(${fmt(q)})` : fmt(q);
  let main = "";
  if (Math.abs(A) < 1e-6 && Math.abs(B) < 1e-6) {
    return "0";
  } else if (Math.abs(A) < 1e-6) {
    const absB = fmt(Math.abs(B));
    const unitB = Math.abs(Math.abs(B) - 1) < 1e-6;
    const prefix = unitB ? (B < 0 ? "-" : "") : `${B < 0 ? "-" : ""}${absB}·`;
    main = `${prefix}${qStr}ⁿ`;
  } else {
    const absA = Math.abs(Math.abs(A) - 1) < 1e-6 ? "" : fmt(Math.abs(A));
    const aTerm = `${A < 0 ? "-" : ""}${absA}n`;
    if (Math.abs(B) < 1e-6) {
      main = `${aTerm}·${qStr}ⁿ`;
    } else {
      const bSign = B < 0 ? "-" : "+";
      main = `(${aTerm} ${bSign} ${fmt(Math.abs(B))})·${qStr}ⁿ`;
    }
  }
  const cTail =
    Math.abs(C) < 1e-6 ? "" : ` ${C < 0 ? "-" : "+"} ${fmt(Math.abs(C))}`;
  return `${main}${cTail}`;
}

interface SequenceModelsArithGeoSceneProps {
  terms: ArithGeoSplitTerm[];
  q: number;
  N: number;
  sumStep: number;
  vp: ViewportInfo;
  scale: SceneScale;
  fontScale: (size: number) => number;
  a1?: number;
  d?: number;
  splitResult?: ArithGeoSplitResult;
}

export function SequenceModelsArithGeoScene({
  terms,
  q,
  N,
  sumStep,
  vp,
  scale,
  fontScale,
  a1: a1Prop,
  d: dProp,
  splitResult,
}: SequenceModelsArithGeoSceneProps) {
  const derivedA1 = a1Prop ?? terms[0]?.an ?? 1;
  const derivedD = dProp ?? (terms.length >= 2 ? terms[1].an - terms[0].an : 1);
  const split = splitResult ?? calcArithGeoSplit(derivedA1, derivedD, q, N);

  const isCriticalQ1 = split.isDegenerateQ1;
  const barW = Math.min(30, Math.max(16, scale.scaleX * 0.42));

  const stepTitles: Record<number, { text: string; sub: string }> = {
    1: {
      text: "Step 1: 原求和式列出",
      sub: "Tₙ = a₁·b₁ + a₂·b₂ + ... + aₙ·bₙ",
    },
    2: {
      text: "Step 2: 乘以公比整体错位",
      sub: "q·Tₙ = a₁·b₂ + a₂·b₃ + ... + aₙ·bₙ₊₁ (右移 1 格同幂对齐)",
    },
    3: {
      text: "Step 3: 两式相减得中间等比与负尾项",
      sub: "(1-q)Tₙ = a₁b₁ + d·(q¹ + ... + qⁿ⁻¹) - aₙ·qⁿ",
    },
    4: {
      text: "Step 4: 分类讨论整理标准型并双项回验",
      sub: "Tₙ = (An + B)·qⁿ + C，代入 n=1, 2 交叉核对无误",
    },
  };

  const curStepInfo = stepTitles[sumStep] ?? stepTitles[1];
  const bannerY = Math.max(12, vp.designTop + 14);
  const matrixTopY = bannerY + 32;
  const badgeTopY = matrixTopY + 68;
  // 绘图区上界放在 Step 4 绿框/断轴声明带之下，留足 26px 呼吸间距避免与橙色框标题碰撞
  const plotTopY = badgeTopY + 58;
  const plotBotY = FULL_HEIGHT - 16;

  const finalTn = terms[N - 1]?.Tn ?? 0;
  const tailVal = split.tailTermVal ?? -(terms[N - 1]?.cn ?? 0) * q;
  const safeAnchorZeroY = Math.min(
    plotBotY - 12,
    Math.max(plotTopY + 12, mathToDesign(1, 0, scale).y),
  );

  // 检查当前步是否存在顶部超限柱体（决定是否渲染顶部锯齿断轴声明带）
  const hasTopTruncated = (() => {
    if (sumStep === 1) {
      return terms.some(
        (t) => mathToDesign(t.n, t.cn, scale).y < plotTopY + 18,
      );
    }
    if (sumStep === 2) {
      return terms.some(
        (t) =>
          mathToDesign(t.n, t.cn, scale).y < plotTopY + 18 ||
          mathToDesign(t.n + 1, t.cn * q, scale).y < plotTopY + 18,
      );
    }
    return (
      mathToDesign(1, terms[0]?.cn ?? 0, scale).y < plotTopY + 18 ||
      terms
        .slice(1)
        .some(
          (t) =>
            mathToDesign(t.n, t.diffTerm ?? derivedD * t.bn, scale).y <
            plotTopY + 18,
        ) ||
      mathToDesign(N + 1, tailVal, scale).y < plotTopY + 18
    );
  })();

  const closedFormSvg = split.closedForm
    ? formatClosedFormSvg(
        split.closedForm.A,
        split.closedForm.B,
        split.closedForm.C,
        q,
      )
    : null;

  return (
    <g className="sequence-scene-arith-geo">
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 顶部步骤标题胶囊 + 当前步围栏 */}
      <g className="step-banner" data-answer-step-frame={sumStep}>
        <rect
          x={DESIGN_CENTER_X - 275}
          y={bannerY}
          width={550}
          height={26}
          rx={13}
          fill={withAlpha(MATH_COLORS.white, 0.96)}
          stroke={MATH_COLORS.answerStepFrame}
          strokeWidth={1.8}
          strokeDasharray="7 4"
        />
        <text
          x={DESIGN_CENTER_X}
          y={bannerY + 17}
          textAnchor="middle"
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.answerStepFrame}
          fontWeight="bold"
        >
          {curStepInfo.text}：{curStepInfo.sub}
        </text>
      </g>

      {/* 错位相减三行同幂对齐矩阵条 (Tₙ / qTₙ / (1-q)Tₙ) */}
      <g className="stagger-matrix-card">
        <rect
          x={DESIGN_CENTER_X - 330}
          y={matrixTopY}
          width={660}
          height={64}
          rx={8}
          fill={withAlpha(MATH_COLORS.white, 0.94)}
          stroke={MATH_COLORS.sequenceStem}
          strokeWidth={1}
        />
        <text
          x={DESIGN_CENTER_X - 314}
          y={matrixTopY + 18}
          fontSize={fontScale(9.5)}
          fill={MATH_COLORS.sequence}
          fontWeight="bold"
          opacity={sumStep === 1 || sumStep === 2 ? 1 : 0.65}
        >
          ① 原和式 Tₙ = [首项 a₁·q⁰] + [a₂·q¹ + a₃·q² + … + aₙ·qⁿ⁻¹]
        </text>
        <text
          x={DESIGN_CENTER_X - 314}
          y={matrixTopY + 37}
          fontSize={fontScale(9.5)}
          fill={MATH_COLORS.paramSecondary}
          fontWeight="bold"
          opacity={sumStep >= 2 ? 1 : 0.35}
        >
          ② 乘公比 qTₙ = {"          "}[同次幂对齐：a₁·q¹ + a₂·q² + … +
          aₙ₋₁·qⁿ⁻¹] + [尾项 aₙ·qⁿ]
        </text>
        <text
          x={DESIGN_CENTER_X - 314}
          y={matrixTopY + 55}
          fontSize={fontScale(9.5)}
          fill={sumStep >= 3 ? MATH_COLORS.paramPrimary : MATH_COLORS.labelText}
          fontWeight="bold"
          opacity={sumStep >= 3 ? 1 : 0.35}
        >
          ③ 相减 (1-q)Tₙ = [首项 a₁b₁] + [中间 ({N - 1}) 项等比：d·(q¹ + … +
          qⁿ⁻¹)] − [尾项负号 aₙ·qⁿ]
        </text>
      </g>

      {/* Step 4 专属：标准型 (An+B)qⁿ+C 化简与 n=1, n=2 双项核验徽标 */}
      {sumStep === 4 && !isCriticalQ1 && (
        <g className="step4-verify-badge">
          <rect
            x={DESIGN_CENTER_X - 300}
            y={badgeTopY}
            width={600}
            height={26}
            rx={6}
            fill={withAlpha(MATH_COLORS.paramTertiary, 0.14)}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1.4}
          />
          <text
            x={DESIGN_CENTER_X}
            y={badgeTopY + 17}
            textAnchor="middle"
            fontSize={fontScale(9.5)}
            fill={MATH_COLORS.paramTertiary}
            fontWeight="bold"
          >
            ④ {closedFormSvg ? `Tₙ = ${closedFormSvg}，` : ""}T{toSub(N)} ={" "}
            {formatMathNumber(finalTn, 4)} ｜ 验算 n=1：T₁=
            {formatMathNumber(split.verifyN1.actual, 4)}✓
            {split.verifyN2
              ? `，n=2：T₂=${formatMathNumber(split.verifyN2.actual, 4)}✓`
              : ""}
          </text>
        </g>
      )}

      {/* q = 1 退化告警横幅 */}
      {isCriticalQ1 && (
        <g className="q1-warning-banner">
          <rect
            x={DESIGN_CENTER_X - 220}
            y={badgeTopY}
            width={440}
            height={26}
            rx={6}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.15)}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.2}
            strokeDasharray="4,3"
          />
          <text
            x={DESIGN_CENTER_X}
            y={badgeTopY + 17}
            textAnchor="middle"
            fontSize={fontScale(9.5)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            ⚠️ 当 q = 1 时 (1-q)=0，错位相减法失效！直接回归纯等差数列求和
          </text>
        </g>
      )}

      {/* 超限截断全局声明带 */}
      {hasTopTruncated && (
        <AxisBreakBanner
          xStart={mathToDesign(0.4, 0, scale).x}
          xEnd={mathToDesign(N + (sumStep >= 2 ? 1.4 : 0.6), 0, scale).x}
          y={plotTopY - 4}
          direction="top"
          label="超高柱体带波浪锯齿截断，阶梯高度保留相对单调性"
          fontScale={fontScale}
        />
      )}

      {/* Step 1: 原式单行序列柱体（清空 X 轴底部空间，结构标 aₙ·bₙ 内嵌于高柱底部，零叠字） */}
      {sumStep === 1 &&
        terms.map((t) => {
          const pt = mathToDesign(t.n, t.cn, scale);
          const ptZero = mathToDesign(t.n, 0, scale);

          return (
            <g key={`ag-s1-${t.n}`}>
              <SequenceTruncatedBar
                x={pt.x - barW / 2}
                width={barW}
                zeroY={ptZero.y}
                rawTopY={pt.y}
                plotTopY={plotTopY + 20}
                plotBotY={plotBotY}
                absValue={Math.abs(t.cn)}
                capThreshold={120}
                color={MATH_COLORS.sequence}
                fillAlpha={0.32}
                strokeWidth={1.5}
                rx={3}
              >
                {({ topY, botY, truncated }) => {
                  const barHeight = botY - topY;
                  const isPos = t.cn >= 0;
                  // 柱端值标签：正项置柱顶（且严格低于 AxisBreakBanner）；矮负项避让 X 轴刻度
                  const valLabelY = isPos
                    ? Math.max(plotTopY + 14, topY - 7)
                    : barHeight < 28
                      ? Math.max(plotTopY + 8, safeAnchorZeroY - 8)
                      : Math.min(FULL_HEIGHT - 12, botY + 12);
                  const canEmbedFormula = barHeight >= 30 && barW >= 18;
                  const innerY = isPos
                    ? Math.min(botY - 6, safeAnchorZeroY - 7)
                    : Math.max(topY + 14, safeAnchorZeroY + 14);
                  return (
                    <>
                      <text
                        x={clampLabelX(pt.x)}
                        y={valLabelY}
                        textAnchor="middle"
                        fontSize={fontScale(9.5)}
                        fill={MATH_COLORS.sequence}
                        fontWeight="bold"
                      >
                        {truncated ? (isPos ? "↑ " : "↓ ") : ""}c{toSub(t.n)} ={" "}
                        {formatMathNumber(t.cn, 4)}
                      </text>
                      {canEmbedFormula && (
                        <text
                          x={pt.x}
                          y={innerY}
                          textAnchor="middle"
                          fontSize={fontScale(8)}
                          fill={MATH_COLORS.sequence}
                          fontWeight="bold"
                          opacity={0.85}
                        >
                          a{toSub(t.n)}b{toSub(t.n)}
                        </text>
                      )}
                    </>
                  );
                }}
              </SequenceTruncatedBar>
            </g>
          );
        })}

      {/* Step 2: 淡色原式背景柱 + 右移错位橙柱 + 代表列同幂对齐示意（消除 N×2 重叠乱标） */}
      {sumStep === 2 && (
        <g className="step-2-shift-grid">
          {/* 第一行: 原数列 T_n 淡色半透明锚定轮廓 */}
          {terms.map((t) => {
            const pt = mathToDesign(t.n, t.cn, scale);
            const ptZero = mathToDesign(t.n, 0, scale);
            return (
              <g key={`ag-s2-tn-${t.n}`}>
                <SequenceTruncatedBar
                  x={pt.x - barW / 2}
                  width={barW * 0.68}
                  zeroY={ptZero.y}
                  rawTopY={pt.y}
                  plotTopY={plotTopY + 20}
                  plotBotY={plotBotY}
                  absValue={Math.abs(t.cn)}
                  capThreshold={120}
                  color={MATH_COLORS.sequence}
                  fillAlpha={0.18}
                  strokeWidth={1.2}
                  rx={2}
                >
                  {({ topY }) =>
                    t.n === 1 ? (
                      <text
                        x={clampLabelX(pt.x)}
                        y={Math.max(plotTopY + 14, topY - 8)}
                        textAnchor="middle"
                        fontSize={fontScale(9)}
                        fill={MATH_COLORS.sequence}
                        fontWeight="bold"
                      >
                        首项 a₁b₁
                      </text>
                    ) : null
                  }
                </SequenceTruncatedBar>
              </g>
            );
          })}

          {/* 第二行: 乘以 q 右移一格后的对齐对比柱 + 右移弧线 */}
          {terms.map((t) => {
            const shiftedN = t.n + 1;
            const shiftedCn = t.cn * q;
            const pt = mathToDesign(shiftedN, shiftedCn, scale);
            const ptZero = mathToDesign(shiftedN, 0, scale);
            const origPt = mathToDesign(t.n, t.cn, scale);
            const safeOrigY = Math.min(
              plotBotY - 6,
              Math.max(plotTopY + 18, origPt.y),
            );
            const safeDestY = Math.min(
              plotBotY - 6,
              Math.max(plotTopY + 18, pt.y),
            );
            const isRepCol = t.n === 1; // 右移到 n=2 的示范对消列
            const isLastShift = t.n === N;

            return (
              <g key={`ag-s2-qtn-${t.n}`}>
                <path
                  d={`M ${origPt.x} ${safeOrigY} Q ${(origPt.x + pt.x) / 2} ${Math.max(plotTopY + 6, safeOrigY - 14)} ${pt.x} ${safeDestY}`}
                  fill="none"
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={isRepCol || isLastShift ? 1.5 : 1}
                  strokeDasharray="3,2"
                  opacity={isRepCol || isLastShift ? 0.9 : 0.45}
                />
                <SequenceTruncatedBar
                  x={pt.x - barW * 0.12}
                  width={barW * 0.68}
                  zeroY={ptZero.y}
                  rawTopY={pt.y}
                  plotTopY={plotTopY + 20}
                  plotBotY={plotBotY}
                  absValue={Math.abs(shiftedCn)}
                  capThreshold={120}
                  color={MATH_COLORS.paramSecondary}
                  fillAlpha={0.32}
                  strokeWidth={1.3}
                  rx={2}
                >
                  {({ topY, botY, truncated }) => {
                    if (isRepCol) {
                      const anchorY = Math.max(
                        plotTopY + 16,
                        Math.min(topY, safeOrigY) - 14,
                      );
                      return (
                        <text
                          x={clampLabelX(pt.x)}
                          y={anchorY}
                          textAnchor="middle"
                          fontSize={fontScale(9)}
                          fill={MATH_COLORS.paramSecondary}
                          fontWeight="bold"
                        >
                          ×q 对齐消成 d·q¹
                        </text>
                      );
                    }
                    if (isLastShift) {
                      const isPos = shiftedCn >= 0;
                      const labelY = isPos
                        ? Math.max(plotTopY + 14, topY - 8)
                        : Math.max(
                            plotTopY + 14,
                            Math.min(botY - 6, safeAnchorZeroY - 10),
                          );
                      return (
                        <text
                          x={
                            N >= 10
                              ? Math.min(FULL_WIDTH - 14, pt.x + 8)
                              : clampLabelX(pt.x)
                          }
                          y={labelY}
                          textAnchor={N >= 10 ? "end" : "middle"}
                          fontSize={fontScale(9)}
                          fill={MATH_COLORS.paramSecondary}
                          fontWeight="bold"
                        >
                          {truncated ? "↑ " : ""}尾项 a{toSub(N)}b{toSub(N + 1)}
                        </text>
                      );
                    }
                    return null;
                  }}
                </SequenceTruncatedBar>
              </g>
            );
          })}
        </g>
      )}

      {/* Step 3 & Step 4: 相减结果全具象化（保留首项 + 中间纯等比增量柱 + 有符号真实方向尾项） */}
      {(sumStep === 3 || sumStep === 4) && (
        <g className="step-3-subtract-view">
          {/* 首项: a1*b1 直落保留柱 */}
          {terms[0] && (
            <g className="lead-term">
              <SequenceTruncatedBar
                x={mathToDesign(1, 0, scale).x - barW / 2}
                width={barW}
                zeroY={mathToDesign(1, 0, scale).y}
                rawTopY={mathToDesign(1, terms[0].cn, scale).y}
                plotTopY={plotTopY + 16}
                plotBotY={plotBotY}
                absValue={Math.abs(terms[0].cn)}
                capThreshold={120}
                color={MATH_COLORS.paramTertiary}
                fillAlpha={0.35}
                strokeWidth={1.6}
                rx={3}
              >
                {({ topY }) => {
                  const ptX = mathToDesign(1, 0, scale).x;
                  const isPos = terms[0].cn >= 0;
                  const labelY = isPos
                    ? Math.max(plotTopY + 10, topY - 8)
                    : Math.max(plotTopY + 10, safeAnchorZeroY - 10);
                  return (
                    <text
                      x={clampLabelX(ptX, 34)}
                      y={labelY}
                      textAnchor="middle"
                      fontSize={fontScale(9)}
                      fill={MATH_COLORS.paramTertiary}
                      fontWeight="bold"
                    >
                      首项 {formatMathNumber(terms[0].cn, 4)}
                    </text>
                  );
                }}
              </SequenceTruncatedBar>
            </g>
          )}

          {/* 中间 (n-1) 项: 相减合并后真实的纯等比差值列 d·q^(k-1) 及其区间包裹框 */}
          {N >= 3 && (
            <g className="middle-geo-box">
              {terms.slice(1).map((t) => {
                const diffVal = t.diffTerm ?? derivedD * t.bn;
                const pt = mathToDesign(t.n, diffVal, scale);
                const ptZero = mathToDesign(t.n, 0, scale);
                return (
                  <SequenceTruncatedBar
                    key={`ag-s3-diff-${t.n}`}
                    x={pt.x - barW / 2}
                    width={barW}
                    zeroY={ptZero.y}
                    rawTopY={pt.y}
                    plotTopY={plotTopY + 28}
                    plotBotY={plotBotY}
                    absValue={Math.abs(diffVal)}
                    capThreshold={120}
                    color={MATH_COLORS.paramSecondary}
                    fillAlpha={0.34}
                    strokeWidth={1.4}
                    rx={3}
                  />
                );
              })}

              {(() => {
                const xStart = mathToDesign(2, 0, scale).x - barW / 2 - 8;
                const xEnd = mathToDesign(N, 0, scale).x + barW / 2 + 8;
                const minRawY = Math.min(
                  ...terms
                    .slice(1)
                    .map(
                      (t) =>
                        mathToDesign(t.n, t.diffTerm ?? derivedD * t.bn, scale)
                          .y,
                    ),
                );
                const maxRawY = Math.max(
                  ...terms
                    .slice(1)
                    .map(
                      (t) =>
                        mathToDesign(t.n, t.diffTerm ?? derivedD * t.bn, scale)
                          .y,
                    ),
                );
                // 框顶确保至少比断轴线 plotTopY 下移 22px，彻底隔绝框顶文字碰撞
                const boxTopY = Math.max(
                  plotTopY + 22,
                  Math.min(minRawY, safeAnchorZeroY) - 14,
                );
                const boxBotY = Math.min(
                  plotBotY,
                  Math.max(
                    boxTopY + 34,
                    Math.max(maxRawY, safeAnchorZeroY) + 8,
                  ),
                );

                return (
                  <>
                    <rect
                      x={xStart}
                      y={boxTopY}
                      width={Math.max(24, xEnd - xStart)}
                      height={Math.max(30, boxBotY - boxTopY)}
                      fill={withAlpha(MATH_COLORS.paramSecondary, 0.06)}
                      stroke={MATH_COLORS.paramSecondary}
                      strokeWidth={1.4}
                      strokeDasharray="4,3"
                      rx={8}
                    />
                    <text
                      x={(xStart + xEnd) / 2}
                      y={boxTopY - 6}
                      textAnchor="middle"
                      fontSize={fontScale(9.5)}
                      fill={MATH_COLORS.paramSecondary}
                      fontWeight="bold"
                    >
                      中间 ({N - 1}) 项：相减得纯等比列 d·(q¹ + … + q
                      {toSup(N - 1)})
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* 尾项: -a_N·q^N —— 严格按真实正负号绘入对应象限（正常正数列相减为负，向下绘制） */}
          {terms[N - 1] && (
            <g className="tail-warning-term">
              {(() => {
                const tailX = mathToDesign(N + 1, 0, scale).x;
                const ptTail = mathToDesign(N + 1, tailVal, scale);
                const ptZero = mathToDesign(N + 1, 0, scale);
                const isNegTail = tailVal < 0;

                return (
                  <SequenceTruncatedBar
                    x={tailX - barW / 2 - 2}
                    width={barW + 4}
                    zeroY={ptZero.y}
                    rawTopY={ptTail.y}
                    plotTopY={plotTopY + 22}
                    plotBotY={plotBotY}
                    absValue={Math.abs(tailVal)}
                    capThreshold={34}
                    color={MATH_COLORS.paramPrimary}
                    fillAlpha={0.28}
                    strokeWidth={1.8}
                    rx={4}
                  >
                    {({ topY, truncated }) => {
                      const labelX =
                        N >= 10
                          ? Math.min(FULL_WIDTH - 14, tailX + barW / 2)
                          : clampLabelX(tailX, 46);
                      const anchor = N >= 10 ? "end" : "middle";
                      // 若为负半轴向下柱，标签放 X 轴上方空闲区，远离下方数字刻度
                      const labelY = isNegTail
                        ? Math.max(plotTopY + 12, safeAnchorZeroY - 10)
                        : Math.max(plotTopY + 12, topY - 8);
                      return (
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor={anchor}
                          fontSize={fontScale(9.5)}
                          fill={MATH_COLORS.paramPrimary}
                          fontWeight="bold"
                        >
                          ⚠️ {truncated ? (isNegTail ? "↓ " : "↑ ") : ""}-a
                          {toSub(N)}·q{toSup(N)} ={" "}
                          {formatMathNumber(tailVal, 4)}
                        </text>
                      );
                    }}
                  </SequenceTruncatedBar>
                );
              })()}
            </g>
          )}
        </g>
      )}
    </g>
  );
}
