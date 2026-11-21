/**
 * src/features/sequence/components/SequenceModelsScalingScene.tsx
 * 数列实验室 - 高考求和模型 6：裂项与等比放缩证明不等式
 * 同屏对照：原通项柱 cₙ < 放缩通项柱 uₙ，以及原部分和 Tₙ < 放缩部分和 Uₙ < 常数上界 M
 */
import { CoordinateGrid, MathPoint } from "@/components/Math";
import { CANVAS_PRESETS, MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { formatMathNumber } from "@/utils/mathFormat";
import type { SceneScale, ViewportInfo } from "@/hooks";
import {
  calcTelescopingScaling,
  type TelescopingScalingType,
} from "@/math/sequence";
import { toSub } from "./SequenceText";

const DESIGN_CENTER_X = CANVAS_PRESETS.full.width / 2;

interface SequenceModelsScalingSceneProps {
  scalingType: TelescopingScalingType;
  N: number;
  sumStep?: number;
  vp: ViewportInfo;
  scale: SceneScale;
  fontScale: (size: number) => number;
}

export function SequenceModelsScalingScene({
  scalingType,
  N,
  sumStep = 1,
  vp,
  scale,
  fontScale,
}: SequenceModelsScalingSceneProps) {
  const activeStep = Math.min(3, Math.max(1, sumStep));
  const res = calcTelescopingScaling(scalingType, N);
  const isSq = scalingType === "square_telescoping";
  const topBannerY = Math.max(12, vp.designTop + 14);
  const barW = Math.min(22, Math.max(12, scale.scaleX * 0.28));

  const step1Text = isSq
    ? "① 逐项放缩（k ≥ 2）：1/k² < 1/[k(k-1)] = 1/(k-1) - 1/k，保留首项 1"
    : "① 逐项放缩（k ≥ 1）：1/(2ᵏ + 1) < 1/2ᵏ，舍去分母正常数放大成等比";
  const step2Text = isSq
    ? `② 放缩求和：U${toSub(N)} = 1 + (1 - 1/${N}) = ${formatMathNumber(res.scaledFinalSum, 4)}`
    : `② 放缩求和：U${toSub(N)} = 1 - 1/2^${N} = ${formatMathNumber(res.scaledFinalSum, 4)}`;
  const step3Text = `③ 上界封顶：T${toSub(N)} = ${formatMathNumber(res.origFinalSum, 4)} < U${toSub(N)} < 常数上界 ${res.upperBound}`;

  const upperY = mathToDesign(0, res.upperBound, scale).y;
  const zeroY = mathToDesign(0, 0, scale).y;

  const origSumPts = res.terms.map((t) => mathToDesign(t.n, t.origSum, scale));
  const scaledSumPts = res.terms.map((t) =>
    mathToDesign(t.n, t.scaledSum, scale),
  );

  return (
    <g className="sequence-scene-models-scaling">
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 顶部三步提示与当前步围栏 */}
      <g className="scaling-step-banner" data-answer-step-frame={activeStep}>
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
          fill={MATH_COLORS.paramTertiary}
          fontWeight="bold"
          opacity={activeStep === 3 ? 1 : 0.45}
        >
          {step3Text}
        </text>
      </g>

      {/* Step 3 聚焦：常数上界天花板线 y = M */}
      <g opacity={activeStep === 3 ? 1 : 0.45}>
        <line
          x1={mathToDesign(-0.5, res.upperBound, scale).x}
          y1={upperY}
          x2={mathToDesign(N + 0.8, res.upperBound, scale).x}
          y2={upperY}
          stroke={MATH_COLORS.paramTertiary}
          strokeWidth={activeStep === 3 ? 2.4 : 1.5}
          strokeDasharray="6,3"
        />
        <text
          x={mathToDesign(N + 0.7, res.upperBound, scale).x}
          y={upperY - 7}
          textAnchor="end"
          fontSize={fontScale(10)}
          fill={MATH_COLORS.paramTertiary}
          fontWeight="bold"
        >
          {`严格常数上界天花板 y = ${res.upperBound} (Tₙ 永不越过)`}
        </text>
      </g>

      {/* Step 1 聚焦：逐项对比柱（原项蓝柱 vs 放缩上界橙色虚线柱） */}
      <g opacity={activeStep === 1 ? 1 : 0.4}>
        {res.terms.map((t) => {
          const ptOrig = mathToDesign(t.n - 0.16, t.origTerm, scale);
          const ptScaled = mathToDesign(t.n + 0.16, t.scaledTerm, scale);
          return (
            <g key={`scale-bars-${t.n}`}>
              {/* 原项实心蓝柱 */}
              <rect
                x={ptOrig.x - barW / 2}
                y={Math.min(ptOrig.y, zeroY)}
                width={barW}
                height={Math.max(2, Math.abs(zeroY - ptOrig.y))}
                fill={withAlpha(MATH_COLORS.sequence, 0.35)}
                stroke={MATH_COLORS.sequence}
                strokeWidth={1.3}
                rx={2}
              />
              {/* 放缩上界橙色虚线柱 */}
              <rect
                x={ptScaled.x - barW / 2}
                y={Math.min(ptScaled.y, zeroY)}
                width={barW}
                height={Math.max(2, Math.abs(zeroY - ptScaled.y))}
                fill={withAlpha(MATH_COLORS.paramSecondary, 0.16)}
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={1.4}
                strokeDasharray="3,2"
                rx={2}
              />
              {(t.n === 2 || t.n === N) && (
                <text
                  x={(ptOrig.x + ptScaled.x) / 2}
                  y={Math.min(ptOrig.y, ptScaled.y) - 6}
                  textAnchor="middle"
                  fontSize={fontScale(8)}
                  fill={MATH_COLORS.paramSecondary}
                  fontWeight="bold"
                >
                  c{toSub(t.n)} ≤ u{toSub(t.n)}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Step 2 & 3 聚焦：原部分和 T_n 与放缩部分和 U_n 阶梯折线 */}
      <g opacity={activeStep >= 2 ? 1 : 0.35}>
        <polyline
          points={origSumPts.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke={MATH_COLORS.sequence}
          strokeWidth={2}
        />
        <polyline
          points={scaledSumPts.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={2}
          strokeDasharray="5,3"
        />
        {res.terms.map((t, idx) => {
          const pOrig = origSumPts[idx];
          const pScaled = scaledSumPts[idx];
          const isKey = t.n === 1 || t.n === N;
          return (
            <g key={`scale-sum-${t.n}`}>
              <MathPoint
                x={pOrig.x}
                y={pOrig.y}
                r={isKey ? 4.5 : 3}
                color={MATH_COLORS.sequence}
              />
              <MathPoint
                x={pScaled.x}
                y={pScaled.y}
                r={isKey ? 4.5 : 3}
                color={MATH_COLORS.paramSecondary}
              />
              {isKey && (
                <>
                  <text
                    x={pOrig.x}
                    y={pOrig.y + 14}
                    textAnchor="middle"
                    fontSize={fontScale(9)}
                    fill={MATH_COLORS.sequence}
                    fontWeight="bold"
                  >
                    T{toSub(t.n)}={formatMathNumber(t.origSum, 3)}
                  </text>
                  <text
                    x={pScaled.x}
                    y={pScaled.y - 8}
                    textAnchor="middle"
                    fontSize={fontScale(9)}
                    fill={MATH_COLORS.paramSecondary}
                    fontWeight="bold"
                  >
                    U{toSub(t.n)}={formatMathNumber(t.scaledSum, 3)}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </g>
    </g>
  );
}
