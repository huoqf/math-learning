/**
 * src/features/sequence/components/RecurrenceNewDefinitionScene.tsx
 * 新高考 19 题新定义探索：原数列 + 派生数列（一阶差分/隔项差/3-周期闭环）双轨判定
 */
import React from "react";
import { CoordinateGrid, MathPoint } from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  calcNewDefinitionSequence,
  type NewDefinitionType,
} from "@/math/sequence";
import {
  MathSubText,
  resolveN,
  legendXOf,
  type RecurrenceSceneBaseProps,
} from "./RecurrenceShared";

export interface RecurrenceNewDefinitionSceneProps extends RecurrenceSceneBaseProps {
  newDefType?: NewDefinitionType;
}

export const RecurrenceNewDefinitionScene: React.FC<
  RecurrenceNewDefinitionSceneProps
> = ({
  params,
  scale,
  vp,
  fontScale,
  highlightN,
  onSelectN,
  xStep = 1,
  yStep = 1,
  activeStep = 1,
  newDefType = "diff_ratio",
}) => {
  const a1 = params.a1 ?? 2;
  const p_rec = params.p_rec ?? 3;
  const q_rec = params.q_rec ?? -2;
  const N = resolveN(params);
  const legendX = legendXOf(vp);
  const step = Math.min(3, Math.max(1, activeStep));

  const res = calcNewDefinitionSequence(newDefType, a1, p_rec, q_rec, N);

  const stepSummaryMap: Record<number, string> = {
    1: !res.isValid
      ? `Step 1 域外失效：a₁=${formatMathNumber(a1, 2)} 触发分母 1 - aₙ = 0，定义域要求 a₁ ∉ {0, 1}`
      : `Step 1 摸底前 3 项：a₁=${formatMathNumber(res.terms[0]?.an ?? 0, 2)}, a₂=${formatMathNumber(res.terms[1]?.an ?? 0, 2)}, a₃=${formatMathNumber(res.terms[2]?.an ?? 0, 2)}`,
    2: !res.isValid
      ? `Step 2 定义失效：递推链在分母为零处中断，无法构造派生序列`
      : `Step 2 构造派生量 ${res.derivedName}：验证新定义内在不变律`,
    3: !res.isValid
      ? `Step 3 结论：首项不在允许定义域内，须先剔除奇异值再分析周期性`
      : `Step 3 性质定论：${res.periodDetected ? `最小正周期 T=${res.periodDetected}` : res.isBounded ? "严格有界" : "呈无界演化"}`,
  };

  const zeroY = mathToDesign(0, 0, scale).y;

  return (
    <g className="recurrence-scene-new-definition">
      <CoordinateGrid
        scale={scale}
        fontScale={fontScale}
        xStep={xStep}
        yStep={yStep}
      />

      {/* 左上角分步围栏 */}
      <g className="new-def-step-frame" data-answer-step-frame={step}>
        <rect
          x={Math.max(16, vp.designLeft + 16)}
          y={Math.max(14, vp.designTop + 16)}
          width={450}
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

      {/* 定义域失效警示卡片（如 3-周期分式出现 1 - aₙ = 0） */}
      {!res.isValid && (
        <g
          className="new-def-invalid-card"
          transform={`translate(${Math.max(24, vp.designLeft + 16)}, 60)`}
        >
          <rect
            x={0}
            y={0}
            width={450}
            height={54}
            rx={8}
            fill={withAlpha(MATH_COLORS.degeneracy, 0.12)}
            stroke={MATH_COLORS.degeneracy}
            strokeWidth={1.6}
          />
          <text
            x={14}
            y={22}
            fontSize={fontScale(11)}
            fill={MATH_COLORS.degeneracy}
            fontWeight="bold"
          >
            ⚠️ 递推定义域中断（分母 1 - aₙ = 0）
          </text>
          <text
            x={14}
            y={40}
            fontSize={fontScale(10)}
            fill={MATH_COLORS.labelText}
          >
            {res.conclusionText}
          </text>
        </g>
      )}

      {/* Step 3 有界包络带（若数列有效且有界） */}
      {res.isValid &&
        step === 3 &&
        res.isBounded &&
        Number.isFinite(res.minVal) &&
        Number.isFinite(res.maxVal) && (
          <g className="bounded-envelope">
            {(() => {
              const yTop = mathToDesign(
                0,
                Math.min(res.maxVal, scale.yMax - 0.1),
                scale,
              ).y;
              const yBot = mathToDesign(
                0,
                Math.max(res.minVal, scale.yMin + 0.1),
                scale,
              ).y;
              const xL = mathToDesign(0.5, 0, scale).x;
              const xR = mathToDesign(N + 0.5, 0, scale).x;
              const labelY = Math.max(58, Math.min(yTop, yBot) - 6);
              return (
                <>
                  <rect
                    x={xL}
                    y={Math.min(yTop, yBot)}
                    width={Math.max(10, xR - xL)}
                    height={Math.max(4, Math.abs(yBot - yTop))}
                    fill={withAlpha(MATH_COLORS.paramTertiary, 0.08)}
                    stroke={MATH_COLORS.paramTertiary}
                    strokeWidth={1.2}
                    strokeDasharray="5,3"
                    rx={4}
                  />
                  <text
                    x={xL}
                    y={labelY}
                    textAnchor="start"
                    fontSize={fontScale(9)}
                    fill={MATH_COLORS.paramTertiary}
                    fontWeight="bold"
                  >
                    {`有界闭区间 [${formatMathNumber(res.minVal, 2)}, ${formatMathNumber(res.maxVal, 2)}]`}
                  </text>
                </>
              );
            })()}
          </g>
        )}

      {/* Step 2 派生数列连线 */}
      <g opacity={step >= 2 ? 1 : 0.25}>
        {res.terms.map((t, idx) => {
          if (t.derived === null || idx === res.terms.length - 1) return null;
          const next = res.terms[idx + 1];
          if (!next || next.derived === null) return null;
          const p1 = mathToDesign(
            t.n,
            Math.max(scale.yMin + 0.2, Math.min(scale.yMax - 0.2, t.derived)),
            scale,
          );
          const p2 = mathToDesign(
            next.n,
            Math.max(
              scale.yMin + 0.2,
              Math.min(scale.yMax - 0.2, next.derived),
            ),
            scale,
          );
          return (
            <line
              key={`nd-d-link-${t.n}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={MATH_COLORS.paramSecondary}
              strokeWidth={step === 2 ? 2 : 1.2}
              strokeDasharray="4,3"
            />
          );
        })}
      </g>

      {/* 原数列 a_n 与派生检验量 b_n */}
      {res.terms.map((t) => {
        const isClamped = t.an > scale.yMax || t.an < scale.yMin;
        const displayAn = Math.max(
          scale.yMin + 0.2,
          Math.min(scale.yMax - 0.2, t.an),
        );
        const posAn = mathToDesign(t.n, displayAn, scale);
        const isHighlighted = t.n === highlightN;
        const showLabel = t.n <= 3 || t.n === N || isHighlighted;
        const opAn = step === 1 && t.n > 3 ? 0.35 : 1;

        return (
          <g
            key={`nd-term-${t.n}`}
            style={{ cursor: "pointer" }}
            onClick={() => onSelectN?.(t.n)}
          >
            <g opacity={opAn}>
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
                stroke={MATH_COLORS.sequenceStem}
                strokeDasharray="3,3"
              />
              {isHighlighted && (
                <rect
                  x={posAn.x - 11}
                  y={posAn.y - 11}
                  width={22}
                  height={22}
                  rx={11}
                  fill={withAlpha(MATH_COLORS.sequence, 0.25)}
                />
              )}
              <MathPoint
                x={posAn.x}
                y={posAn.y}
                r={isHighlighted ? 7 : 4.5}
                variant="focus"
                color={MATH_COLORS.sequence}
              />
              {showLabel && (
                <MathSubText
                  x={posAn.x}
                  y={posAn.y - 12}
                  base="a"
                  sub={t.n}
                  val={formatMathNumber(t.an, 2)}
                  fill={MATH_COLORS.sequence}
                  fontScale={fontScale}
                  suffix={isClamped ? " ↕" : ""}
                />
              )}
            </g>

            {t.derived !== null && (
              <g opacity={step >= 2 ? 1 : 0.25}>
                {(() => {
                  const clampedD = Math.max(
                    scale.yMin + 0.2,
                    Math.min(scale.yMax - 0.2, t.derived),
                  );
                  const posD = mathToDesign(t.n, clampedD, scale);
                  return (
                    <>
                      <MathPoint
                        x={posD.x}
                        y={posD.y}
                        r={4.2}
                        variant="focus"
                        color={
                          t.propertyOk
                            ? MATH_COLORS.paramSecondary
                            : MATH_COLORS.degeneracy
                        }
                      />
                      {showLabel && (
                        <MathSubText
                          x={posD.x}
                          y={posD.y + 16}
                          base="b"
                          sub={t.n}
                          val={formatMathNumber(t.derived, 2)}
                          fill={MATH_COLORS.paramSecondary}
                          fontScale={fontScale}
                          fontSize={10}
                          fontWeight="normal"
                        />
                      )}
                    </>
                  );
                })()}
              </g>
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
        <MathPoint x={14} y={18} r={4.5} color={MATH_COLORS.sequence} />
        <text
          x={26}
          y={22}
          fontSize={fontScale(10)}
          fill={MATH_COLORS.labelText}
          fontWeight="bold"
        >
          原新定义数列 aₙ
        </text>
        <MathPoint x={14} y={38} r={4.5} color={MATH_COLORS.paramSecondary} />
        <text
          x={26}
          y={42}
          fontSize={fontScale(10)}
          fill={MATH_COLORS.labelText}
        >
          {`派生检验量：${res.derivedName}`}
        </text>
      </g>
    </g>
  );
};
