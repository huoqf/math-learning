/**
 * src/features/sequence/components/RecurrenceSnMixedScene.tsx
 * Sn 与 an 混合递推消元（高频解答题第一问母题，支持 3 步联动）
 */
import React from "react";
import { CoordinateGrid, MathPoint } from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { formatMathNumber } from "@/utils/mathFormat";
import { calcSnMixedRecurrence, type SnMixedMode } from "@/math/sequence";
import {
  MathSubText,
  resolveN,
  legendXOf,
  type RecurrenceSceneBaseProps,
} from "./RecurrenceShared";

export interface RecurrenceSnMixedSceneProps extends RecurrenceSceneBaseProps {
  snMixedMode?: SnMixedMode;
}

export const RecurrenceSnMixedScene: React.FC<RecurrenceSnMixedSceneProps> = ({
  params,
  scale,
  vp,
  fontScale,
  highlightN,
  onSelectN,
  xStep = 1,
  yStep = 1,
  activeStep = 1,
  snMixedMode = "sn_linear_an",
}) => {
  const a1 = params.a1 ?? 1;
  const mixedP = params.mixedP ?? 2;
  const mixedC = params.mixedC ?? -1;
  const N = resolveN(params);
  const legendX = legendXOf(vp);
  const step = Math.min(3, Math.max(1, activeStep));

  const res = calcSnMixedRecurrence(snMixedMode, mixedP, mixedC, a1, N);

  const stepSummaryMap: Record<number, string> = {
    1: `Step 1 令 n=1 求初始项：真实首项 a₁ = ${formatMathNumber(res.a1, 2)}`,
    2: `Step 2 令 n≥2 作差消去 Sₙ：后段公比 q = ${formatMathNumber(res.qRatio ?? 0, 2)}`,
    3: res.isFirstTermConsistent
      ? "Step 3 首项吻合校验：a₁ 与后段通项一致 ✓ 可合并"
      : "Step 3 首项脱节告警：n=1 不满足后段公式 ⚠️ 必须分段",
  };

  if (!res.isValid) {
    return (
      <g className="recurrence-scene-sn-mixed-invalid">
        <CoordinateGrid
          scale={scale}
          fontScale={fontScale}
          xStep={xStep}
          yStep={yStep}
        />
        <g transform={`translate(${vp.centerX}, ${vp.designTop + 70})`}>
          <rect
            x={-210}
            y={-22}
            width={420}
            height={44}
            rx={8}
            fill={withAlpha(MATH_COLORS.white, 0.96)}
            stroke={MATH_COLORS.degeneracy}
            strokeWidth={1.5}
          />
          <text
            x={0}
            y={5}
            textAnchor="middle"
            fontSize={fontScale(10.5)}
            fill={MATH_COLORS.degeneracy}
            fontWeight="bold"
          >
            {res.errorMsg ?? "参数退化，无法构成等比数列"}
          </text>
        </g>
      </g>
    );
  }

  const zeroY = mathToDesign(0, 0, scale).y;
  const predictedA1 =
    !res.isFirstTermConsistent && res.qRatio && Math.abs(res.qRatio) > 1e-9
      ? (res.terms[1]?.an ?? 0) / res.qRatio
      : null;

  return (
    <g className="recurrence-scene-sn-mixed">
      <CoordinateGrid
        scale={scale}
        fontScale={fontScale}
        xStep={xStep}
        yStep={yStep}
      />

      {/* 左上角分步围栏 */}
      <g className="sn-mixed-step-frame" data-answer-step-frame={step}>
        <rect
          x={Math.max(16, vp.designLeft + 16)}
          y={Math.max(14, vp.designTop + 16)}
          width={420}
          height={28}
          rx={7}
          fill={withAlpha(MATH_COLORS.white, 0.94)}
          stroke={MATH_COLORS.answerStepFrame}
          strokeWidth={1.8}
          strokeDasharray="7 4"
        />
        <text
          x={Math.max(16, vp.designLeft + 16) + 12}
          y={Math.max(14, vp.designTop + 16) + 18}
          fontSize={fontScale(9.5)}
          fill={MATH_COLORS.answerStepFrame}
          fontWeight="bold"
        >
          {stepSummaryMap[step]}
        </text>
      </g>

      {/* Step 2 聚焦：n ≥ 2 段公比倍连接线 */}
      <g opacity={step >= 2 ? 1 : 0.3}>
        {res.terms.slice(1, -1).map((t, idx) => {
          const next = res.terms[idx + 2];
          if (!next) return null;
          const p1 = mathToDesign(t.n, Math.min(t.an, scale.yMax - 0.2), scale);
          const p2 = mathToDesign(
            next.n,
            Math.min(next.an, scale.yMax - 0.2),
            scale,
          );
          return (
            <g key={`sn-mixed-link-${t.n}`}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={step === 2 ? 2 : 1.3}
                strokeDasharray="4,3"
              />
              {t.n === 2 && res.qRatio !== null && (
                <text
                  x={(p1.x + p2.x) / 2}
                  y={(p1.y + p2.y) / 2 - 8}
                  textAnchor="middle"
                  fontSize={fontScale(9.5)}
                  fill={MATH_COLORS.paramSecondary}
                  fontWeight="bold"
                >
                  {`×q (${formatMathNumber(res.qRatio, 2)})`}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Step 3 首项脱节时：在 n=1 处并排画出后段公比回推预测柱 */}
      {step === 3 && predictedA1 !== null && (
        <g className="sn-mixed-predicted-a1">
          {(() => {
            const ptPred = mathToDesign(1, predictedA1, scale);
            return (
              <>
                <rect
                  x={ptPred.x + 8}
                  y={Math.min(zeroY, ptPred.y)}
                  width={10}
                  height={Math.max(2, Math.abs(zeroY - ptPred.y))}
                  fill={withAlpha(MATH_COLORS.paramTertiary, 0.22)}
                  stroke={MATH_COLORS.paramTertiary}
                  strokeWidth={1.4}
                  strokeDasharray="3,2"
                  rx={2}
                />
                <text
                  x={ptPred.x + 13}
                  y={
                    predictedA1 >= 0
                      ? Math.min(zeroY, ptPred.y) - 8
                      : Math.max(zeroY, ptPred.y) + 14
                  }
                  fontSize={fontScale(9)}
                  fill={MATH_COLORS.paramTertiary}
                  fontWeight="bold"
                >
                  {`后段公式回推值 ${formatMathNumber(predictedA1, 2)} ≠ a₁`}
                </text>
              </>
            );
          })()}
        </g>
      )}

      {/* 原数列 a_n 散点与柱体 */}
      {res.terms.map((t) => {
        const isFirst = t.n === 1;
        const isClamped = t.an > scale.yMax;
        const displayAn = Math.min(t.an, scale.yMax - 0.2);
        const posAn = mathToDesign(t.n, displayAn, scale);
        const isHighlighted = t.n === highlightN;
        const showLabel = isFirst || t.n === 2 || t.n === N || isHighlighted;
        const isMismatchFirst = isFirst && !res.isFirstTermConsistent;
        const barColor = isMismatchFirst
          ? MATH_COLORS.degeneracy
          : isFirst
            ? MATH_COLORS.paramPrimary
            : MATH_COLORS.sequence;

        const opacity =
          step === 1
            ? isFirst
              ? 1
              : 0.35
            : step === 2
              ? isFirst
                ? 0.45
                : 1
              : 1;

        return (
          <g
            key={`sn-mixed-term-${t.n}`}
            style={{ cursor: "pointer" }}
            opacity={opacity}
            onClick={() => onSelectN?.(t.n)}
          >
            <rect
              x={posAn.x - 12}
              y={posAn.y - 12}
              width={24}
              height={24}
              fill="transparent"
            />
            <line
              x1={posAn.x}
              y1={zeroY}
              x2={posAn.x}
              y2={posAn.y}
              stroke={barColor}
              strokeWidth={isFirst ? 2.2 : 1.4}
              strokeDasharray={isFirst ? undefined : "3,2"}
            />
            {isHighlighted && (
              <rect
                x={posAn.x - 11}
                y={posAn.y - 11}
                width={22}
                height={22}
                rx={11}
                fill={withAlpha(barColor, 0.25)}
              />
            )}
            <MathPoint
              x={posAn.x}
              y={posAn.y}
              r={isHighlighted || isFirst ? 6.5 : 4.5}
              variant="focus"
              color={barColor}
            />
            {showLabel && (
              <MathSubText
                x={posAn.x}
                y={posAn.y - 12}
                base="a"
                sub={t.n}
                val={formatMathNumber(t.an, 2)}
                fill={barColor}
                fontScale={fontScale}
                suffix={isClamped ? " ↑" : ""}
              />
            )}
          </g>
        );
      })}

      {/* 右上角图例 */}
      <g transform={`translate(${legendX}, 20)`}>
        <rect
          x={0}
          y={0}
          width={215}
          height={56}
          rx={8}
          fill={withAlpha(MATH_COLORS.white, 0.92)}
          stroke={CANVAS_COLORS.axis}
          strokeWidth={1}
        />
        <MathPoint x={14} y={18} r={4.5} color={MATH_COLORS.paramPrimary} />
        <text
          x={26}
          y={22}
          fontSize={fontScale(10)}
          fill={MATH_COLORS.labelText}
          fontWeight="bold"
        >
          首项 a₁（n=1 独立检验）
        </text>
        <MathPoint x={14} y={38} r={4.5} color={MATH_COLORS.sequence} />
        <text
          x={26}
          y={42}
          fontSize={fontScale(10)}
          fill={MATH_COLORS.labelText}
        >
          n ≥ 2 作差等比段 (×q)
        </text>
      </g>
    </g>
  );
};
