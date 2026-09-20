/**
 * src/features/sequence/components/RecurrenceLinearPanScene.tsx
 * 一阶线性递推：待定系数平移构造等比双轴图（默认高考模式）与不动点蛛网图（高观点拓展）
 */
import React from "react";
import { CoordinateGrid, FunctionGraph } from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { calcLinearRecurrence } from "@/math/sequence";
import {
  MathSubText,
  resolveN,
  legendXOf,
  type RecurrenceSceneBaseProps,
} from "./RecurrenceShared";

export const RecurrenceLinearPanScene: React.FC<RecurrenceSceneBaseProps> = ({
  params,
  scale,
  vp,
  fontScale,
  highlightN,
  onSelectN,
  xStep = 1,
  yStep = 1,
  activeStep = 1,
  linearViewMode = "shift",
  onToggleLinearViewMode,
}) => {
  const a1 = params.a1 ?? 3;
  const p_rec = params.p_rec ?? 2;
  const q_rec = params.q_rec ?? 1;
  const N = resolveN(params);
  const legendX = legendXOf(vp);

  const linearData = calcLinearRecurrence(a1, p_rec, q_rec, N);
  const { terms, fixedPoint, cobwebPoints } = linearData;

  // -------------------------------------------------------------
  // 模式 1：高考核心 —— 垂直平移构造双轴对照图 (shift)
  // -------------------------------------------------------------
  if (linearViewMode === "shift") {
    const isStep1 = activeStep === 1;
    const isStep2 = activeStep === 2;
    const isStep3 = activeStep === 3;
    const isStep4 = activeStep === 4;

    const fixedYPos =
      fixedPoint !== null ? mathToDesign(0, fixedPoint, scale).y : null;

    return (
      <g className="recurrence-scene-linear-pan-shift">
        <defs>
          <marker
            id="pan-shift-arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 1.5 L 8 5 L 0 8.5 z"
              fill={MATH_COLORS.paramTertiary}
            />
          </marker>
        </defs>

        <CoordinateGrid
          scale={scale}
          fontScale={fontScale}
          xStep={xStep}
          yStep={yStep}
        />

        {/* 不动点平移基准线 y = c (当 Step 1 时重点高亮) */}
        {fixedPoint !== null && fixedYPos !== null && (
          <g className="fixed-point-baseline">
            {isStep1 && (
              <line
                x1={mathToDesign(-0.5, fixedPoint, scale).x}
                y1={fixedYPos}
                x2={mathToDesign(N + 0.8, fixedPoint, scale).x}
                y2={fixedYPos}
                stroke={withAlpha(MATH_COLORS.paramTertiary, 0.35)}
                strokeWidth={10}
              />
            )}
            <line
              x1={mathToDesign(-0.5, fixedPoint, scale).x}
              y1={fixedYPos}
              x2={mathToDesign(N + 0.8, fixedPoint, scale).x}
              y2={fixedYPos}
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={isStep1 ? 2.5 : 1.5}
              strokeDasharray={isStep1 ? "6,4" : "4,3"}
            />
            <text
              x={mathToDesign(N + 0.8, fixedPoint, scale).x}
              y={fixedYPos - 6}
              textAnchor="end"
              fontSize={fontScale(10)}
              fill={MATH_COLORS.paramTertiary}
              fontWeight="bold"
            >
              {`基准不动点线 y = c (${fixedPoint.toFixed(2)})`}
            </text>
          </g>
        )}

        {/* 辅助等比数列 b_n 相邻项比值连线 (Step 3 高亮) */}
        {terms.map((t, idx) => {
          if (idx === terms.length - 1) return null;
          const next = terms[idx + 1];
          const pCur = mathToDesign(t.n, t.bn, scale);
          const pNext = mathToDesign(next.n, next.bn, scale);

          return (
            <g key={`ratio-link-${t.n}`}>
              <line
                x1={pCur.x}
                y1={pCur.y}
                x2={pNext.x}
                y2={pNext.y}
                stroke={
                  isStep3
                    ? MATH_COLORS.paramSecondary
                    : withAlpha(MATH_COLORS.paramSecondary, 0.4)
                }
                strokeWidth={isStep3 ? 2 : 1}
                strokeDasharray="3,3"
              />
              {(t.n === 1 || t.n === highlightN) && (
                <text
                  x={(pCur.x + pNext.x) / 2}
                  y={(pCur.y + pNext.y) / 2 - 8}
                  textAnchor="middle"
                  fontSize={fontScale(9.5)}
                  fill={MATH_COLORS.paramSecondary}
                  fontWeight="bold"
                >
                  {`×${p_rec}`}
                </text>
              )}
            </g>
          );
        })}

        {/* 原数列 a_n 与构造平移数列 b_n 散点及位移矢量 */}
        {terms.map((t) => {
          const isClamped = t.an > scale.yMax;
          const displayAn = Math.min(t.an, scale.yMax - 0.2);
          const posAn = mathToDesign(t.n, displayAn, scale);
          const posBn = mathToDesign(t.n, t.bn, scale);
          const posZero = mathToDesign(t.n, 0, scale);
          const isHighlighted = t.n === highlightN;
          const showLabel = t.n === 1 || t.n === N || isHighlighted;

          return (
            <g
              key={`shift-term-${t.n}`}
              style={{ cursor: "pointer" }}
              onClick={() => onSelectN?.(t.n)}
            >
              {/* x 轴引线 */}
              <line
                x1={posAn.x}
                y1={posZero.y}
                x2={posAn.x}
                y2={posAn.y}
                stroke={MATH_COLORS.sequenceStem}
                strokeDasharray="2,2"
                opacity={0.6}
              />

              {/* 核心构造：从 a_n 向下平移至 b_n 的垂直位移向量 (Step 2 重点高亮) */}
              {fixedPoint !== null && (
                <g>
                  {isStep2 && (
                    <line
                      x1={posAn.x}
                      y1={posAn.y}
                      x2={posBn.x}
                      y2={posBn.y}
                      stroke={withAlpha(MATH_COLORS.paramTertiary, 0.3)}
                      strokeWidth={8}
                    />
                  )}
                  <line
                    x1={posAn.x}
                    y1={posAn.y}
                    x2={posBn.x}
                    y2={posBn.y}
                    stroke={MATH_COLORS.paramTertiary}
                    strokeWidth={isStep2 ? 2.5 : 1.5}
                    strokeDasharray={isStep2 ? undefined : "3,3"}
                    markerEnd="url(#pan-shift-arrow)"
                  />
                  {showLabel && (
                    <text
                      x={posAn.x + 8}
                      y={(posAn.y + posBn.y) / 2 + 4}
                      fontSize={fontScale(9)}
                      fill={MATH_COLORS.paramTertiary}
                      fontWeight="bold"
                    >
                      {`-c`}
                    </text>
                  )}
                </g>
              )}

              {/* 辅助等比数列散点 b_n */}
              <circle
                cx={posBn.x}
                cy={posBn.y}
                r={isStep2 || isStep3 ? 6 : 4}
                fill={MATH_COLORS.paramSecondary}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
              {showLabel && (
                <MathSubText
                  x={posBn.x}
                  y={posBn.y + 16}
                  base="b"
                  sub={t.n}
                  val={t.bn.toFixed(1)}
                  fill={MATH_COLORS.paramSecondary}
                  fontScale={fontScale}
                  fontSize={10}
                  fontWeight="normal"
                />
              )}

              {/* 原数列散点 a_n */}
              {isHighlighted && (
                <circle
                  cx={posAn.x}
                  cy={posAn.y}
                  r={12}
                  fill={withAlpha(MATH_COLORS.sequence, 0.25)}
                />
              )}
              {isStep4 && t.n === 1 && (
                <circle
                  cx={posAn.x}
                  cy={posAn.y}
                  r={14}
                  fill="none"
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={2}
                />
              )}
              <circle
                cx={posAn.x}
                cy={posAn.y}
                r={isHighlighted ? 7 : 5}
                fill={MATH_COLORS.sequence}
                stroke={MATH_COLORS.white}
                strokeWidth={2}
              />
              {showLabel && (
                <MathSubText
                  x={posAn.x}
                  y={posAn.y - 12}
                  base="a"
                  sub={t.n}
                  val={t.an.toFixed(1)}
                  fill={MATH_COLORS.sequence}
                  fontScale={fontScale}
                  fontSize={10.5}
                  suffix={isClamped ? " ↑" : ""}
                />
              )}
            </g>
          );
        })}

        {/* 右上角图例与直观/高观点切换 */}
        <g transform={`translate(${legendX}, 20)`}>
          <rect
            x={0}
            y={0}
            width={220}
            height={84}
            rx={8}
            fill={withAlpha(MATH_COLORS.white, 0.95)}
            stroke={CANVAS_COLORS.axis}
            strokeWidth={1}
          />
          <circle cx={16} cy={18} r={4.5} fill={MATH_COLORS.sequence} />
          <text
            x={28}
            y={22}
            fontSize={fontScale(10)}
            fill={MATH_COLORS.labelText}
            fontWeight="bold"
          >
            原数列 aₙ（纵轴坐标）
          </text>

          <circle cx={16} cy={38} r={4} fill={MATH_COLORS.paramSecondary} />
          <text
            x={28}
            y={42}
            fontSize={fontScale(10)}
            fill={MATH_COLORS.labelText}
          >
            平移等比数列 bₙ = aₙ - c
          </text>

          <line
            x1={10}
            y1={58}
            x2={22}
            y2={58}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={2}
            markerEnd="url(#pan-shift-arrow)"
          />
          <text
            x={28}
            y={62}
            fontSize={fontScale(9.5)}
            fill={MATH_COLORS.paramTertiary}
            fontWeight="bold"
          >
            平移向量：下移 c 消除常数项
          </text>

          {/* 切换到蛛网图按钮 */}
          {onToggleLinearViewMode && (
            <g
              transform="translate(130, 8)"
              style={{ cursor: "pointer" }}
              onClick={onToggleLinearViewMode}
            >
              <rect
                x={0}
                y={0}
                width={82}
                height={22}
                rx={4}
                fill={withAlpha(MATH_COLORS.primary, 0.1)}
                stroke={MATH_COLORS.primary}
                strokeWidth={1}
              />
              <text
                x={41}
                y={15}
                textAnchor="middle"
                fontSize={fontScale(9)}
                fill={MATH_COLORS.primary}
                fontWeight="bold"
              >
                蛛网迭代图 ↗
              </text>
            </g>
          )}
        </g>
      </g>
    );
  }

  // -------------------------------------------------------------
  // 模式 2：高观点拓展 —— 不动点蛛网图 (cobweb)
  // -------------------------------------------------------------
  const fnLine = (x: number) => p_rec * x + q_rec;
  const diagLine = (x: number) => x;

  let cobwebPathStr = "";
  cobwebPoints.forEach((pt, idx) => {
    const dPt = mathToDesign(pt.x, pt.y, scale);
    if (idx === 0) {
      cobwebPathStr += `M ${dPt.x} ${dPt.y}`;
    } else {
      cobwebPathStr += ` L ${dPt.x} ${dPt.y}`;
    }
  });

  return (
    <g className="recurrence-scene-linear-pan-cobweb">
      <CoordinateGrid
        scale={scale}
        fontScale={fontScale}
        xStep={xStep}
        yStep={yStep}
      />

      <FunctionGraph
        fn={fnLine}
        scale={scale}
        color={MATH_COLORS.paramPrimary}
        strokeWidth={1.75}
        strokeDasharray="5,4"
      />

      <FunctionGraph
        fn={diagLine}
        scale={scale}
        color={MATH_COLORS.labelText}
        strokeWidth={1.2}
        strokeDasharray="4,4"
      />

      <path
        d={cobwebPathStr}
        fill="none"
        stroke={MATH_COLORS.sequenceCobweb}
        strokeWidth={2}
        strokeDasharray="3,2"
      />

      {fixedPoint !== null && (
        <g>
          <circle
            cx={mathToDesign(fixedPoint, fixedPoint, scale).x}
            cy={mathToDesign(fixedPoint, fixedPoint, scale).y}
            r={6}
            fill={MATH_COLORS.paramTertiary}
            stroke={MATH_COLORS.white}
            strokeWidth={2}
          />
          <text
            x={mathToDesign(fixedPoint, fixedPoint, scale).x + 10}
            y={mathToDesign(fixedPoint, fixedPoint, scale).y - 10}
            fontSize={fontScale(11)}
            fill={MATH_COLORS.paramTertiary}
            fontWeight="bold"
          >
            <tspan>不动点 </tspan>
            <tspan fontStyle="italic">c</tspan>
            <tspan>{` = ${fixedPoint.toFixed(2)}`}</tspan>
          </text>
        </g>
      )}

      {terms.map((t) => {
        const posAn = mathToDesign(t.an, t.an, scale);
        const isHighlighted = t.n === highlightN;
        const showLabel = t.n === 1 || t.n === N || isHighlighted;

        return (
          <g
            key={`lin-term-${t.n}`}
            style={{ cursor: "pointer" }}
            onClick={() => onSelectN?.(t.n)}
          >
            {isHighlighted && (
              <circle
                cx={posAn.x}
                cy={posAn.y}
                r={12}
                fill={withAlpha(MATH_COLORS.sequence, 0.25)}
              />
            )}
            <circle
              cx={posAn.x}
              cy={posAn.y}
              r={isHighlighted ? 7 : 4.5}
              fill={MATH_COLORS.sequence}
              stroke={MATH_COLORS.white}
              strokeWidth={2}
            />
            {showLabel && (
              <MathSubText
                x={posAn.x}
                y={posAn.y - 12}
                base="a"
                sub={t.n}
                val={t.an.toFixed(1)}
                fill={MATH_COLORS.sequence}
                fontScale={fontScale}
              />
            )}
          </g>
        );
      })}

      <g transform={`translate(${legendX}, 20)`}>
        <rect
          x={0}
          y={0}
          width={220}
          height={76}
          rx={8}
          fill={withAlpha(MATH_COLORS.white, 0.92)}
          stroke={CANVAS_COLORS.axis}
          strokeWidth={1}
        />
        <line
          x1={14}
          y1={18}
          x2={32}
          y2={18}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={2}
          strokeDasharray="4,3"
        />
        <text
          x={40}
          y={22}
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.labelText}
          fontWeight="bold"
        >
          <tspan>函数线 </tspan>
          <tspan fontStyle="italic">y = px + q</tspan>
        </text>
        <line
          x1={14}
          y1={38}
          x2={32}
          y2={38}
          stroke={MATH_COLORS.sequenceCobweb}
          strokeWidth={2}
        />
        <text
          x={40}
          y={42}
          fontSize={fontScale(10.5)}
          fill={MATH_COLORS.labelText}
        >
          蛛网迭代（高观点拓展）
        </text>

        {/* 切换回平移构造图按钮 */}
        {onToggleLinearViewMode && (
          <g
            transform="translate(14, 48)"
            style={{ cursor: "pointer" }}
            onClick={onToggleLinearViewMode}
          >
            <rect
              x={0}
              y={0}
              width={192}
              height={22}
              rx={4}
              fill={withAlpha(MATH_COLORS.primary, 0.1)}
              stroke={MATH_COLORS.primary}
              strokeWidth={1}
            />
            <text
              x={96}
              y={15}
              textAnchor="middle"
              fontSize={fontScale(9)}
              fill={MATH_COLORS.primary}
              fontWeight="bold"
            >
              ← 返回高考平移构造直观图
            </text>
          </g>
        )}
      </g>
    </g>
  );
};
