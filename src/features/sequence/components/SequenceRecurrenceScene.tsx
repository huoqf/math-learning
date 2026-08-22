/**
 * src/features/sequence/components/SequenceRecurrenceScene.tsx
 * 数列实验室 - 递推与构造法求通项 2D SVG 场景
 */
import { CoordinateGrid, FunctionGraph } from "@/components/Math";
import { MATH_COLORS } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale, ViewportInfo } from "@/hooks";
import { toSub } from "./SequenceText";
import { useSequenceParams } from "./useSequenceData";

interface SequenceRecurrenceSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  recurrenceModelType?:
    | "linear-pan"
    | "accumulation"
    | "multiplication"
    | "reciprocal"
    | "second-order";
  highlightN?: number;
  onSelectN?: (n: number) => void;
}

export function SequenceRecurrenceScene({
  params,
  scale,
  fontScale,
  recurrenceModelType = "linear-pan",
  highlightN = 1,
}: SequenceRecurrenceSceneProps) {
  const {
    N,
    p_rec,
    q_rec,
    linearRecData,
    accumRecData,
    multRecData,
    recipRecData,
    secondRecData,
  } = useSequenceParams(params);

  if (recurrenceModelType === "linear-pan") {
    const { terms, fixedPoint, cobwebPoints } = linearRecData;
    const fnLine = (x: number) => p_rec * x + q_rec;
    const diagLine = (x: number) => x;

    // 蛛网折线 path 字符串
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
      <g className="sequence-scene-linear-pan">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 直线 y = p*x + q */}
        <FunctionGraph
          fn={fnLine}
          scale={scale}
          color={MATH_COLORS.sequence}
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />

        {/* 对角线 y = x */}
        <FunctionGraph
          fn={diagLine}
          scale={scale}
          color={MATH_COLORS.labelText}
          strokeWidth={1}
          strokeDasharray="3,3"
        />

        {/* 不动点 (c, c) */}
        {fixedPoint !== null && (
          <g>
            <circle
              cx={mathToDesign(fixedPoint, fixedPoint, scale).x}
              cy={mathToDesign(fixedPoint, fixedPoint, scale).y}
              r={6}
              fill={MATH_COLORS.sequenceHighlight}
              stroke={MATH_COLORS.white}
              strokeWidth={2}
            />
            <text
              x={mathToDesign(fixedPoint, fixedPoint, scale).x + 10}
              y={mathToDesign(fixedPoint, fixedPoint, scale).y - 10}
              fontSize={fontScale(11)}
              fill={MATH_COLORS.sequenceHighlight}
              fontWeight="bold"
            >
              不动点 c={fixedPoint.toFixed(2)}
            </text>
          </g>
        )}

        {/* 蛛网图阶梯迭代折线 */}
        <path
          d={cobwebPathStr}
          fill="none"
          stroke={MATH_COLORS.sequenceHighlight}
          strokeWidth={1.5}
          strokeDasharray="2,2"
        />

        {/* 各项散点：原数列 a_n 与 平移数列 b_n */}
        {terms.map((t) => {
          const posAn = mathToDesign(t.n, t.an, scale);
          const posBn = mathToDesign(t.n, t.bn, scale);
          const isHighlighted = t.n === highlightN;

          return (
            <g key={`lin-rec-${t.n}`}>
              {/* 原数列 a_n 散点 */}
              <line
                x1={posAn.x}
                y1={mathToDesign(t.n, 0, scale).y}
                x2={posAn.x}
                y2={posAn.y}
                stroke={MATH_COLORS.sequenceStem}
                strokeDasharray="2,2"
              />
              <circle
                cx={posAn.x}
                cy={posAn.y}
                r={isHighlighted ? 6 : 4}
                fill={MATH_COLORS.sequence}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
              {(t.n === 1 || t.n === N || isHighlighted) && (
                <text
                  x={posAn.x}
                  y={posAn.y - 8}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.sequence}
                  fontWeight="bold"
                >
                  a{toSub(t.n)} = {t.an.toFixed(1)}
                </text>
              )}

              {/* 平移数列 b_n 散点 (当存在不动点 c 时) */}
              {fixedPoint !== null && (
                <g>
                  <circle
                    cx={posBn.x}
                    cy={posBn.y}
                    r={4}
                    fill={MATH_COLORS.paramSecondary}
                    stroke={MATH_COLORS.white}
                    strokeWidth={1}
                  />
                  {(t.n === 1 || t.n === N || isHighlighted) && (
                    <text
                      x={posBn.x}
                      y={posBn.y + 14}
                      textAnchor="middle"
                      fontSize={fontScale(10)}
                      fill={MATH_COLORS.paramSecondary}
                    >
                      b{toSub(t.n)} = {t.bn.toFixed(1)}
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

  if (recurrenceModelType === "accumulation") {
    const terms = accumRecData.terms;

    return (
      <g className="sequence-scene-accumulation">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {terms.map((t) => {
          const posAn = mathToDesign(t.n, t.an, scale);
          const isHighlighted = t.n === highlightN;

          return (
            <g key={`accum-${t.n}`}>
              <line
                x1={posAn.x}
                y1={mathToDesign(t.n, 0, scale).y}
                x2={posAn.x}
                y2={posAn.y}
                stroke={MATH_COLORS.sequenceStem}
                strokeDasharray="2,2"
              />
              <circle
                cx={posAn.x}
                cy={posAn.y}
                r={isHighlighted ? 6 : 4.5}
                fill={MATH_COLORS.sequence}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
              <text
                x={posAn.x}
                y={posAn.y - 8}
                textAnchor="middle"
                fontSize={fontScale(10)}
                fill={MATH_COLORS.sequence}
                fontWeight="bold"
              >
                a{toSub(t.n)} = {t.an.toFixed(1)}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  if (recurrenceModelType === "multiplication") {
    const terms = multRecData.terms;

    return (
      <g className="sequence-scene-multiplication">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {terms.map((t) => {
          const posAn = mathToDesign(t.n, t.an, scale);
          const isHighlighted = t.n === highlightN;

          return (
            <g key={`mult-${t.n}`}>
              <line
                x1={posAn.x}
                y1={mathToDesign(t.n, 0, scale).y}
                x2={posAn.x}
                y2={posAn.y}
                stroke={MATH_COLORS.sequenceStem}
                strokeDasharray="2,2"
              />
              <circle
                cx={posAn.x}
                cy={posAn.y}
                r={isHighlighted ? 6 : 4.5}
                fill={MATH_COLORS.sequence}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
              <text
                x={posAn.x}
                y={posAn.y - 8}
                textAnchor="middle"
                fontSize={fontScale(10)}
                fill={MATH_COLORS.sequence}
                fontWeight="bold"
              >
                a{toSub(t.n)} = {t.an.toFixed(3)}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  if (recurrenceModelType === "reciprocal") {
    const terms = recipRecData.terms;

    return (
      <g className="sequence-scene-reciprocal">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {terms.map((t) => {
          const posAn = mathToDesign(t.n, t.an, scale);
          const posBn = Number.isNaN(t.bn)
            ? null
            : mathToDesign(t.n, t.bn, scale);
          const isHighlighted = t.n === highlightN;

          return (
            <g key={`recip-${t.n}`}>
              {/* 原数列 a_n */}
              {!Number.isNaN(t.an) && (
                <g>
                  <circle
                    cx={posAn.x}
                    cy={posAn.y}
                    r={isHighlighted ? 6 : 4.5}
                    fill={MATH_COLORS.sequence}
                    stroke={MATH_COLORS.white}
                    strokeWidth={1.5}
                  />
                  <text
                    x={posAn.x}
                    y={posAn.y - 8}
                    textAnchor="middle"
                    fontSize={fontScale(10)}
                    fill={MATH_COLORS.sequence}
                    fontWeight="bold"
                  >
                    a{toSub(t.n)} = {t.an.toFixed(2)}
                  </text>
                </g>
              )}

              {/* 倒数数列 b_n = 1/a_n */}
              {posBn && (
                <g>
                  <circle
                    cx={posBn.x}
                    cy={posBn.y}
                    r={4.5}
                    fill={MATH_COLORS.paramSecondary}
                    stroke={MATH_COLORS.white}
                    strokeWidth={1.5}
                  />
                  <text
                    x={posBn.x}
                    y={posBn.y + 14}
                    textAnchor="middle"
                    fontSize={fontScale(10)}
                    fill={MATH_COLORS.paramSecondary}
                  >
                    b{toSub(t.n)} = {t.bn.toFixed(2)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  }

  if (recurrenceModelType === "second-order") {
    const terms = secondRecData.terms;

    return (
      <g className="sequence-scene-second-order">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {terms.map((t) => {
          const posAn = mathToDesign(t.n, t.an, scale);
          const isHighlighted = t.n === highlightN;

          return (
            <g key={`sec-order-${t.n}`}>
              <line
                x1={posAn.x}
                y1={mathToDesign(t.n, 0, scale).y}
                x2={posAn.x}
                y2={posAn.y}
                stroke={MATH_COLORS.sequenceStem}
                strokeDasharray="2,2"
              />
              <circle
                cx={posAn.x}
                cy={posAn.y}
                r={isHighlighted ? 6 : 4.5}
                fill={MATH_COLORS.sequence}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
              <text
                x={posAn.x}
                y={posAn.y - 8}
                textAnchor="middle"
                fontSize={fontScale(10)}
                fill={MATH_COLORS.sequence}
                fontWeight="bold"
              >
                a{toSub(t.n)} = {t.an.toFixed(1)}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  return null;
}
