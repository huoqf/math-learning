/**
 * src/features/sequence/components/SequenceModelsTelescopingScene.tsx
 * 数列实验室 - 高考求和模型 2：裂项相消法
 * (支持 4 种模式：标准差1型 / 跨项差2型 / 根式有理化型 / 指数裂项型，并实现 3 步联动动画)
 */
import { CoordinateGrid, MathPoint } from "@/components/Math";
import { CANVAS_PRESETS, MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { formatMathNumber } from "@/utils/mathFormat";
import type { SceneScale, ViewportInfo } from "@/hooks";
import {
  calcExponentialTelescoping,
  type TelescopingResult,
  type CrossTelescopingResult,
  type RadicalTelescopingResult,
  type ExponentialTelescopingResult,
} from "@/math/sequence";
import { toSub } from "./SequenceText";

const DESIGN_CENTER_X = CANVAS_PRESETS.full.width / 2;

interface SequenceModelsTelescopingSceneProps {
  teleGap: number;
  N: number;
  sumStep?: number;
  telescopingData: TelescopingResult;
  crossTelescopingData: CrossTelescopingResult;
  radicalTeleData: RadicalTelescopingResult;
  expTeleData?: ExponentialTelescopingResult;
  vp: ViewportInfo;
  scale: SceneScale;
  fontScale: (size: number) => number;
}

export function SequenceModelsTelescopingScene({
  teleGap,
  N,
  sumStep = 1,
  telescopingData,
  crossTelescopingData,
  radicalTeleData,
  expTeleData,
  vp,
  scale,
  fontScale,
}: SequenceModelsTelescopingSceneProps) {
  const isExponential = teleGap === 4;
  const isRadical = teleGap === 3;
  const isCross = teleGap === 2;
  const activeStep = Math.min(3, Math.max(1, sumStep));
  const topBannerY = Math.max(12, vp.designTop + 14);
  const resolvedExpData = expTeleData ?? calcExponentialTelescoping(N);

  const renderDominoBanner = (
    step1Text: string,
    step2Text: string,
    step3Text: string,
  ) => (
    <g className="telescoping-domino-card" data-answer-step-frame={activeStep}>
      <rect
        x={DESIGN_CENTER_X - 310}
        y={topBannerY}
        width={620}
        height={58}
        rx={8}
        fill={withAlpha(MATH_COLORS.white, 0.94)}
        stroke={MATH_COLORS.answerStepFrame}
        strokeWidth={1.8}
        strokeDasharray="7 4"
      />
      <text
        x={DESIGN_CENTER_X - 294}
        y={topBannerY + 17}
        fontSize={fontScale(9.5)}
        fill={MATH_COLORS.sequence}
        fontWeight="bold"
        opacity={activeStep === 1 ? 1 : 0.45}
      >
        {step1Text}
      </text>
      <text
        x={DESIGN_CENTER_X - 294}
        y={topBannerY + 35}
        fontSize={fontScale(9.5)}
        fill={MATH_COLORS.paramSecondary}
        fontWeight="bold"
        opacity={activeStep === 2 ? 1 : 0.45}
      >
        {step2Text}
      </text>
      <text
        x={DESIGN_CENTER_X - 294}
        y={topBannerY + 52}
        fontSize={fontScale(9.5)}
        fill={MATH_COLORS.paramPrimary}
        fontWeight="bold"
        opacity={activeStep === 3 ? 1 : 0.45}
      >
        {step3Text}
      </text>
    </g>
  );

  /** 根据当前步计算正/负项透明度与删除线状态，落实 3 步教学递进 */
  const stepOpacity = (isRetained: boolean) => {
    if (activeStep === 1) return 1;
    if (activeStep === 2) return isRetained ? 0.85 : 0.5;
    return isRetained ? 1 : 0.2;
  };

  /** 被抵消项的交叉删除标记（Step 2/3 显示） */
  const renderCancelSlash = (px: number, py: number, color: string) => {
    if (activeStep < 2) return null;
    return (
      <g opacity={activeStep === 2 ? 0.95 : 0.45}>
        <line
          x1={px - 6}
          y1={py - 6}
          x2={px + 6}
          y2={py + 6}
          stroke={color}
          strokeWidth={1.8}
        />
        <line
          x1={px - 6}
          y1={py + 6}
          x2={px + 6}
          y2={py - 6}
          stroke={color}
          strokeWidth={1.8}
        />
      </g>
    );
  };

  /** 首尾残留项聚焦框（Step 3 突出锁定） */
  const renderRetainedFocusBox = (px: number, py: number) => {
    if (activeStep !== 3) return null;
    return (
      <rect
        x={px - 10}
        y={py - 10}
        width={20}
        height={20}
        rx={10}
        fill="none"
        stroke={MATH_COLORS.answerStepFrame}
        strokeWidth={1.8}
        strokeDasharray="3,2"
      />
    );
  };

  // 1. 标准差 1 型: 1/(n(n+1)) = 1/n - 1/(n+1)
  if (!isRadical && !isCross && !isExponential) {
    const terms = telescopingData.terms;
    const limitY = mathToDesign(0, 1, scale).y;

    return (
      <g className="sequence-scene-telescoping-standard">
        <CoordinateGrid scale={scale} fontScale={fontScale} />
        {renderDominoBanner(
          "① 裂项拆差（跨度 Δ=1）：cₙ = 1/[n(n+1)] = (+1/n) + (-1/(n+1))",
          "② 多米诺相邻对消：(+1) + (-1/2 + 1/2) + (-1/3 + 1/3) + … 中间项成对清零",
          `③ 首尾对称留 1 项：T${toSub(N)} = 首正 (+1) + 尾负 (-1/${N + 1}) = ${N}/${N + 1} ≈ ${formatMathNumber(N / (N + 1), 3)}`,
        )}

        {/* 上界参考线 y = 1 */}
        <line
          x1={mathToDesign(-0.8, 1, scale).x}
          y1={limitY}
          x2={mathToDesign(N + 1, 1, scale).x}
          y2={limitY}
          stroke={MATH_COLORS.sequenceHighlight}
          strokeWidth={1.5}
          strokeDasharray="5,3"
        />
        <text
          x={mathToDesign(N + 0.8, 1, scale).x}
          y={limitY - 6}
          textAnchor="end"
          fontSize={fontScale(9)}
          fill={MATH_COLORS.sequenceHighlight}
          fontWeight="bold"
        >
          {`渐近上界参考线 T${toSub(N)} < 1`}
        </text>

        {/* 各项对消与残留项锁定 */}
        {terms.map((t) => {
          const posA = mathToDesign(t.n, t.partA, scale);
          const posB = mathToDesign(t.n + 0.35, -t.partB, scale);
          const zeroY = mathToDesign(t.n, 0, scale).y;
          const isRetainedA = t.n === 1;
          const isRetainedB = t.n === N;
          const opA = stepOpacity(isRetainedA);
          const opB = stepOpacity(isRetainedB);

          return (
            <g key={`tele-std-${t.n}`}>
              {/* 正项 +1/n */}
              <g opacity={opA}>
                <line
                  x1={posA.x}
                  y1={zeroY}
                  x2={posA.x}
                  y2={posA.y}
                  stroke={
                    isRetainedA
                      ? MATH_COLORS.combHeader
                      : withAlpha(MATH_COLORS.combHeader, 0.6)
                  }
                  strokeWidth={isRetainedA ? 2.4 : 1.3}
                />
                <MathPoint
                  x={posA.x}
                  y={posA.y}
                  r={isRetainedA ? 5.5 : 3.5}
                  variant={isRetainedA ? "focus" : "solid"}
                  color={
                    isRetainedA
                      ? MATH_COLORS.sequenceHighlight
                      : MATH_COLORS.combHeader
                  }
                />
                {isRetainedA && renderRetainedFocusBox(posA.x, posA.y)}
                {!isRetainedA &&
                  renderCancelSlash(posA.x, posA.y, MATH_COLORS.paramSecondary)}
                <text
                  x={posA.x}
                  y={posA.y - 8}
                  textAnchor="middle"
                  fontSize={fontScale(isRetainedA ? 10 : 8.5)}
                  fill={
                    isRetainedA
                      ? MATH_COLORS.sequenceHighlight
                      : MATH_COLORS.combHeader
                  }
                  fontWeight={isRetainedA ? "bold" : "normal"}
                >
                  +1/{t.n}
                  {isRetainedA ? " (首项保留)" : ""}
                </text>
              </g>

              {/* 负项 -1/(n+1) */}
              <g opacity={opB}>
                <line
                  x1={posB.x}
                  y1={zeroY}
                  x2={posB.x}
                  y2={posB.y}
                  stroke={
                    isRetainedB
                      ? MATH_COLORS.paramPrimary
                      : withAlpha(MATH_COLORS.paramPrimary, 0.6)
                  }
                  strokeWidth={isRetainedB ? 2.4 : 1.3}
                />
                <MathPoint
                  x={posB.x}
                  y={posB.y}
                  r={isRetainedB ? 5.5 : 3.5}
                  variant={isRetainedB ? "focus" : "solid"}
                  color={MATH_COLORS.paramPrimary}
                />
                {isRetainedB && renderRetainedFocusBox(posB.x, posB.y)}
                {!isRetainedB &&
                  renderCancelSlash(posB.x, posB.y, MATH_COLORS.paramSecondary)}
                <text
                  x={posB.x}
                  y={posB.y + 15}
                  textAnchor="middle"
                  fontSize={fontScale(isRetainedB ? 10 : 8.5)}
                  fill={MATH_COLORS.paramPrimary}
                  fontWeight={isRetainedB ? "bold" : "normal"}
                >
                  -1/{t.n + 1}
                  {isRetainedB ? " (尾项保留)" : ""}
                </text>
              </g>

              {/* 相邻项对消弧线 */}
              {t.n < N && (
                <g
                  opacity={
                    activeStep === 2 ? 0.95 : activeStep === 1 ? 0.2 : 0.35
                  }
                >
                  <path
                    d={`M ${posB.x} ${posB.y} Q ${(posB.x + mathToDesign(t.n + 1, 0, scale).x) / 2} ${
                      zeroY - 12
                    } ${mathToDesign(t.n + 1, terms[t.n].partA, scale).x} ${mathToDesign(t.n + 1, terms[t.n].partA, scale).y}`}
                    fill="none"
                    stroke={MATH_COLORS.paramSecondary}
                    strokeWidth={activeStep === 2 ? 1.8 : 1.1}
                    strokeDasharray="3,2"
                  />
                  {activeStep === 2 && (
                    <text
                      x={(posB.x + mathToDesign(t.n + 1, 0, scale).x) / 2}
                      y={zeroY - 14}
                      textAnchor="middle"
                      fontSize={fontScale(8)}
                      fill={MATH_COLORS.paramSecondary}
                      fontWeight="bold"
                    >
                      抵消
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  }

  // 2. 跨项差 2 型: 1/(n(n+2)) = 1/2 * (1/n - 1/(n+2))
  if (isCross) {
    const terms = crossTelescopingData.terms;
    const limitY = mathToDesign(0, 0.75, scale).y;

    return (
      <g className="sequence-scene-telescoping-cross">
        <CoordinateGrid scale={scale} fontScale={fontScale} />
        {renderDominoBanner(
          "① 跨项提系数（跨度 Δ=2）：cₙ = 1/[n(n+2)] = ½ · [(+1/n) + (-1/(n+2))]（必提 ½！）",
          "② 隔项跨步对消：-1/3 与 +1/3 对消、-1/4 与 +1/4 对消… 奇偶链条各自相消",
          `③ 首尾对称留 2 项：T${toSub(N)} = ½ · [首正(1 + 1/2) - 尾负(1/${N + 1} + 1/${N + 2})]`,
        )}

        <line
          x1={mathToDesign(-0.8, 0.75, scale).x}
          y1={limitY}
          x2={mathToDesign(N + 1, 0.75, scale).x}
          y2={limitY}
          stroke={MATH_COLORS.sequenceHighlight}
          strokeWidth={1.5}
          strokeDasharray="5,3"
        />
        <text
          x={mathToDesign(N + 0.8, 0.75, scale).x}
          y={limitY - 6}
          textAnchor="end"
          fontSize={fontScale(9)}
          fill={MATH_COLORS.sequenceHighlight}
          fontWeight="bold"
        >
          {`渐近上界参考线 T${toSub(N)} < 0.75`}
        </text>

        {terms.map((t) => {
          const posA = mathToDesign(t.n, t.partA, scale);
          const posB = mathToDesign(t.n + 0.35, -t.partB, scale);
          const zeroY = mathToDesign(t.n, 0, scale).y;
          const isRetainedA = t.n <= 2;
          const isRetainedB = t.n >= N - 1;

          return (
            <g key={`c-tele-${t.n}`}>
              <g opacity={stepOpacity(isRetainedA)}>
                <line
                  x1={posA.x}
                  y1={zeroY}
                  x2={posA.x}
                  y2={posA.y}
                  stroke={
                    isRetainedA
                      ? MATH_COLORS.sequenceHighlight
                      : withAlpha(MATH_COLORS.combHeader, 0.5)
                  }
                  strokeWidth={isRetainedA ? 2.2 : 1.2}
                />
                <MathPoint
                  x={posA.x}
                  y={posA.y}
                  r={isRetainedA ? 5.5 : 3.5}
                  variant={isRetainedA ? "focus" : "solid"}
                  color={
                    isRetainedA
                      ? MATH_COLORS.sequenceHighlight
                      : MATH_COLORS.combHeader
                  }
                />
                {isRetainedA && renderRetainedFocusBox(posA.x, posA.y)}
                {!isRetainedA &&
                  renderCancelSlash(posA.x, posA.y, MATH_COLORS.paramSecondary)}
                <text
                  x={posA.x}
                  y={posA.y - 7}
                  textAnchor="middle"
                  fontSize={fontScale(isRetainedA ? 10 : 8.5)}
                  fill={
                    isRetainedA
                      ? MATH_COLORS.sequenceHighlight
                      : MATH_COLORS.combHeader
                  }
                  fontWeight={isRetainedA ? "bold" : "normal"}
                >
                  +1/{2 * t.n}
                  {isRetainedA ? " (留)" : ""}
                </text>
              </g>

              <g opacity={stepOpacity(isRetainedB)}>
                <line
                  x1={posB.x}
                  y1={zeroY}
                  x2={posB.x}
                  y2={posB.y}
                  stroke={
                    isRetainedB
                      ? MATH_COLORS.paramPrimary
                      : withAlpha(MATH_COLORS.paramPrimary, 0.5)
                  }
                  strokeWidth={isRetainedB ? 2.2 : 1.2}
                />
                <MathPoint
                  x={posB.x}
                  y={posB.y}
                  r={isRetainedB ? 5.5 : 3.5}
                  variant={isRetainedB ? "focus" : "solid"}
                  color={MATH_COLORS.paramPrimary}
                />
                {isRetainedB && renderRetainedFocusBox(posB.x, posB.y)}
                {!isRetainedB &&
                  renderCancelSlash(posB.x, posB.y, MATH_COLORS.paramSecondary)}
                <text
                  x={posB.x}
                  y={posB.y + 15}
                  textAnchor="middle"
                  fontSize={fontScale(isRetainedB ? 10 : 8.5)}
                  fill={MATH_COLORS.paramPrimary}
                  fontWeight={isRetainedB ? "bold" : "normal"}
                >
                  -1/{2 * (t.n + 2)}
                  {isRetainedB ? " (留)" : ""}
                </text>
              </g>

              {t.n <= N - 2 && (
                <g
                  opacity={
                    activeStep === 2 ? 0.95 : activeStep === 1 ? 0.2 : 0.35
                  }
                >
                  <path
                    d={`M ${posB.x} ${posB.y} Q ${(posB.x + mathToDesign(t.n + 2, 0, scale).x) / 2} ${
                      zeroY - 18
                    } ${mathToDesign(t.n + 2, terms[t.n + 1].partA, scale).x} ${mathToDesign(t.n + 2, terms[t.n + 1].partA, scale).y}`}
                    fill="none"
                    stroke={MATH_COLORS.paramSecondary}
                    strokeWidth={activeStep === 2 ? 1.8 : 1.1}
                    strokeDasharray="4,4"
                  />
                  {activeStep === 2 && (
                    <text
                      x={(posB.x + mathToDesign(t.n + 2, 0, scale).x) / 2}
                      y={zeroY - 20}
                      textAnchor="middle"
                      fontSize={fontScale(8)}
                      fill={MATH_COLORS.paramSecondary}
                      fontWeight="bold"
                    >
                      跨项抵消
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  }

  // 3. 根式有理化型: 1/(sqrt(n)+sqrt(n+1)) = sqrt(n+1) - sqrt(n)
  if (isRadical) {
    const terms = radicalTeleData.terms;

    return (
      <g className="sequence-scene-telescoping-radical">
        <CoordinateGrid scale={scale} fontScale={fontScale} />
        {renderDominoBanner(
          "① 共轭根式有理化：cₙ = 1/(√n + √(n+1)) = (+√(n+1)) + (-√n)",
          "② 前后根式伸缩对消：(+√2 - √2) + (+√3 - √3) + … 中间根式逐项抵消",
          `③ 首尾根式残留：T${toSub(N)} = 尾正(+√${N + 1}) + 首负(-√1) ≈ ${formatMathNumber(radicalTeleData.finalTn, 3)}`,
        )}

        {terms.map((t) => {
          const posA = mathToDesign(t.n, t.partA, scale);
          const posB = mathToDesign(t.n, -t.partB, scale);
          const zeroY = mathToDesign(t.n, 0, scale).y;
          const isRetainedA = t.n === N;
          const isRetainedB = t.n === 1;

          return (
            <g key={`tele-rad-${t.n}`}>
              <g opacity={stepOpacity(isRetainedA)}>
                <line
                  x1={posA.x}
                  y1={zeroY}
                  x2={posA.x}
                  y2={posA.y}
                  stroke={MATH_COLORS.combHeader}
                  strokeWidth={isRetainedA ? 2.2 : 1.4}
                />
                <MathPoint
                  x={posA.x}
                  y={posA.y}
                  r={isRetainedA ? 5.5 : 3.5}
                  variant={isRetainedA ? "focus" : "solid"}
                  color={
                    isRetainedA
                      ? MATH_COLORS.sequenceHighlight
                      : MATH_COLORS.combHeader
                  }
                />
                {isRetainedA && renderRetainedFocusBox(posA.x, posA.y)}
                {!isRetainedA &&
                  renderCancelSlash(posA.x, posA.y, MATH_COLORS.paramSecondary)}
                <text
                  x={posA.x}
                  y={posA.y - 7}
                  textAnchor="middle"
                  fontSize={fontScale(isRetainedA ? 10 : 8.5)}
                  fill={
                    isRetainedA
                      ? MATH_COLORS.sequenceHighlight
                      : MATH_COLORS.combHeader
                  }
                  fontWeight={isRetainedA ? "bold" : "normal"}
                >
                  +√{t.n + 1}
                  {isRetainedA ? " (尾项保留)" : ""}
                </text>
              </g>

              <g opacity={stepOpacity(isRetainedB)}>
                <line
                  x1={posB.x}
                  y1={zeroY}
                  x2={posB.x}
                  y2={posB.y}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={isRetainedB ? 2.2 : 1.4}
                />
                <MathPoint
                  x={posB.x}
                  y={posB.y}
                  r={isRetainedB ? 5.5 : 3.5}
                  variant={isRetainedB ? "focus" : "solid"}
                  color={MATH_COLORS.paramPrimary}
                />
                {isRetainedB && renderRetainedFocusBox(posB.x, posB.y)}
                {!isRetainedB &&
                  renderCancelSlash(posB.x, posB.y, MATH_COLORS.paramSecondary)}
                <text
                  x={posB.x}
                  y={posB.y + 15}
                  textAnchor="middle"
                  fontSize={fontScale(isRetainedB ? 10 : 8.5)}
                  fill={MATH_COLORS.paramPrimary}
                  fontWeight={isRetainedB ? "bold" : "normal"}
                >
                  -√{t.n}
                  {isRetainedB ? " (首项保留: -1)" : ""}
                </text>
              </g>

              {t.n < N && (
                <g
                  opacity={
                    activeStep === 2 ? 0.95 : activeStep === 1 ? 0.2 : 0.35
                  }
                >
                  <path
                    d={`M ${posA.x} ${posA.y} Q ${(posA.x + mathToDesign(t.n + 1, 0, scale).x) / 2} ${zeroY} ${mathToDesign(t.n + 1, -t.partA, scale).x} ${mathToDesign(t.n + 1, -t.partA, scale).y}`}
                    fill="none"
                    stroke={MATH_COLORS.paramSecondary}
                    strokeWidth={activeStep === 2 ? 1.8 : 1.1}
                    strokeDasharray="3,2"
                  />
                  {activeStep === 2 && (
                    <text
                      x={(posA.x + mathToDesign(t.n + 1, 0, scale).x) / 2}
                      y={zeroY - 4}
                      textAnchor="middle"
                      fontSize={fontScale(8)}
                      fill={MATH_COLORS.paramSecondary}
                      fontWeight="bold"
                    >
                      伸缩抵消
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  }

  // 4. 指数分式裂项型: 2^n / ((2^n-1)(2^{n+1}-1)) = 1/(2^n-1) - 1/(2^{n+1}-1)
  if (isExponential) {
    const terms = resolvedExpData.terms;
    const limitY = mathToDesign(0, 1, scale).y;

    return (
      <g className="sequence-scene-telescoping-exp">
        <CoordinateGrid scale={scale} fontScale={fontScale} />
        {renderDominoBanner(
          "① 指数分子拆差：2ⁿ = (2ⁿ⁺¹-1) - (2ⁿ-1) ⇒ cₙ = 1/(2ⁿ-1) - 1/(2ⁿ⁺¹-1)",
          "② 邻项指数分式抵消：(-1/3 + 1/3) + (-1/7 + 1/7) + … 中间项清零",
          `③ 首尾保留封顶：T${toSub(N)} = 1 - 1/(2^${N + 1}-1) ≈ ${formatMathNumber(resolvedExpData.finalTn, 4)} < 1`,
        )}

        <line
          x1={mathToDesign(-0.8, 1, scale).x}
          y1={limitY}
          x2={mathToDesign(N + 1, 1, scale).x}
          y2={limitY}
          stroke={MATH_COLORS.sequenceHighlight}
          strokeWidth={1.5}
          strokeDasharray="5,3"
        />
        <text
          x={mathToDesign(N + 0.8, 1, scale).x}
          y={limitY - 6}
          textAnchor="end"
          fontSize={fontScale(9)}
          fill={MATH_COLORS.sequenceHighlight}
          fontWeight="bold"
        >
          {`常数上界线 T${toSub(N)} < 1`}
        </text>

        {terms.map((t) => {
          const posA = mathToDesign(t.n, t.partA, scale);
          const posB = mathToDesign(t.n + 0.35, -t.partB, scale);
          const zeroY = mathToDesign(t.n, 0, scale).y;
          const isRetainedA = t.n === 1;
          const isRetainedB = t.n === N;
          const denomA = Math.pow(2, t.n) - 1;
          const denomB = Math.pow(2, t.n + 1) - 1;

          return (
            <g key={`tele-exp-${t.n}`}>
              <g opacity={stepOpacity(isRetainedA)}>
                <line
                  x1={posA.x}
                  y1={zeroY}
                  x2={posA.x}
                  y2={posA.y}
                  stroke={MATH_COLORS.combHeader}
                  strokeWidth={isRetainedA ? 2.4 : 1.3}
                />
                <MathPoint
                  x={posA.x}
                  y={posA.y}
                  r={isRetainedA ? 5.5 : 3.5}
                  variant={isRetainedA ? "focus" : "solid"}
                  color={
                    isRetainedA
                      ? MATH_COLORS.sequenceHighlight
                      : MATH_COLORS.combHeader
                  }
                />
                {isRetainedA && renderRetainedFocusBox(posA.x, posA.y)}
                {!isRetainedA &&
                  renderCancelSlash(posA.x, posA.y, MATH_COLORS.paramSecondary)}
                <text
                  x={posA.x}
                  y={posA.y - 8}
                  textAnchor="middle"
                  fontSize={fontScale(isRetainedA ? 10 : 8.5)}
                  fill={
                    isRetainedA
                      ? MATH_COLORS.sequenceHighlight
                      : MATH_COLORS.combHeader
                  }
                  fontWeight={isRetainedA ? "bold" : "normal"}
                >
                  +1/{denomA}
                  {isRetainedA ? " (首项保留)" : ""}
                </text>
              </g>

              <g opacity={stepOpacity(isRetainedB)}>
                <line
                  x1={posB.x}
                  y1={zeroY}
                  x2={posB.x}
                  y2={posB.y}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={isRetainedB ? 2.4 : 1.3}
                />
                <MathPoint
                  x={posB.x}
                  y={posB.y}
                  r={isRetainedB ? 5.5 : 3.5}
                  variant={isRetainedB ? "focus" : "solid"}
                  color={MATH_COLORS.paramPrimary}
                />
                {isRetainedB && renderRetainedFocusBox(posB.x, posB.y)}
                {!isRetainedB &&
                  renderCancelSlash(posB.x, posB.y, MATH_COLORS.paramSecondary)}
                <text
                  x={posB.x}
                  y={posB.y + 15}
                  textAnchor="middle"
                  fontSize={fontScale(isRetainedB ? 10 : 8.5)}
                  fill={MATH_COLORS.paramPrimary}
                  fontWeight={isRetainedB ? "bold" : "normal"}
                >
                  -1/{denomB}
                  {isRetainedB ? " (尾项保留)" : ""}
                </text>
              </g>

              {t.n < N && (
                <g
                  opacity={
                    activeStep === 2 ? 0.95 : activeStep === 1 ? 0.2 : 0.35
                  }
                >
                  <path
                    d={`M ${posB.x} ${posB.y} Q ${(posB.x + mathToDesign(t.n + 1, 0, scale).x) / 2} ${zeroY - 12} ${mathToDesign(t.n + 1, terms[t.n].partA, scale).x} ${mathToDesign(t.n + 1, terms[t.n].partA, scale).y}`}
                    fill="none"
                    stroke={MATH_COLORS.paramSecondary}
                    strokeWidth={activeStep === 2 ? 1.8 : 1.1}
                    strokeDasharray="3,2"
                  />
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  }

  return null;
}
