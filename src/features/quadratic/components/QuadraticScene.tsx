/**
 * src/features/quadratic/components/QuadraticScene.tsx
 * 纯 SVG 渲染，零物理公式
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  IntervalShadow,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import { useQuadraticScene } from "../hooks/useQuadraticScene";

interface QuadraticSceneProps {
  params: {
    a: number;
    b: number;
    c: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode?: "function" | "equation" | "inequality";
  ineqType?: ">" | "<";
}

export const QuadraticScene: React.FC<QuadraticSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "function",
  ineqType = ">",
}) => {
  const { a, b, c } = params;

  const {
    axisLine,
    labels,
    solutionIntervals,
    handleVertexDrag,
    handleYInterceptDrag,
    isDegenerate,
    vertexX,
    vertexY,
    roots,
    delta,
  } = useQuadraticScene({ params, scale, onParamChange, studyMode, ineqType });

  const fn = React.useCallback((x: number) => a * x * x + b * x + c, [a, b, c]);

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {studyMode === "inequality" &&
        solutionIntervals.map((interval, index) => (
          <IntervalShadow
            key={`shadow-${index}`}
            fn={fn}
            x1={interval.x1}
            x2={interval.x2}
            scale={scale}
            fillColor={withAlpha(MATH_COLORS.inequality, 0.15)}
            strokeColor="transparent"
          />
        ))}

      {axisLine && (
        <line
          x1={axisLine.x1}
          y1={axisLine.y1}
          x2={axisLine.x2}
          y2={axisLine.y2}
          stroke={MATH_COLORS.asymptote}
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      )}

      <FunctionGraph
        fn={fn}
        scale={scale}
        color={MATH_COLORS.function}
        strokeWidth={2.5}
      />

      {studyMode === "inequality" &&
        solutionIntervals.map((interval, index) => {
          const startPt = mathToDesign(
            Math.max(interval.x1, scale.xMin),
            0,
            scale,
          );
          const endPt = mathToDesign(
            Math.min(interval.x2, scale.xMax),
            0,
            scale,
          );
          return (
            <g key={`projection-group-${index}`}>
              <line
                x1={startPt.x}
                y1={startPt.y}
                x2={endPt.x}
                y2={endPt.y}
                stroke={MATH_COLORS.inequality}
                strokeWidth={5}
                strokeOpacity={0.5}
                strokeLinecap="round"
              />
              {!interval.isLeftInfinity &&
                interval.x1 >= scale.xMin &&
                interval.x1 <= scale.xMax && (
                  <circle
                    cx={mathToDesign(interval.x1, 0, scale).x}
                    cy={mathToDesign(interval.x1, 0, scale).y}
                    r={4.5}
                    fill={MATH_COLORS.white}
                    stroke={MATH_COLORS.inequality}
                    strokeWidth={2}
                  />
                )}
              {!interval.isRightInfinity &&
                interval.x2 >= scale.xMin &&
                interval.x2 <= scale.xMax && (
                  <circle
                    cx={mathToDesign(interval.x2, 0, scale).x}
                    cy={mathToDesign(interval.x2, 0, scale).y}
                    r={4.5}
                    fill={MATH_COLORS.white}
                    stroke={MATH_COLORS.inequality}
                    strokeWidth={2}
                  />
                )}
            </g>
          );
        })}

      <InteractivePoint
        cx={0}
        cy={c}
        scale={scale}
        vp={vp}
        onDrag={handleYInterceptDrag}
        color={MATH_COLORS.vectorSecondary}
        r={5}
        disabled={false}
        fontScale={fontScale}
      />

      {vertexX !== null && vertexY !== null && (
        <InteractivePoint
          cx={vertexX}
          cy={vertexY}
          scale={scale}
          vp={vp}
          onDrag={handleVertexDrag}
          color={MATH_COLORS.focusPoint}
          r={6}
          disabled={isDegenerate}
          fontScale={fontScale}
        />
      )}

      {studyMode !== "inequality" &&
        roots
          .filter((r) => Number.isFinite(r))
          .map((rootVal, i) => {
            const pt = mathToDesign(rootVal, 0, scale);
            return (
              <circle
                key={`root-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={4.5}
                fill={MATH_COLORS.vectorResult}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
            );
          })}

      {studyMode === "equation" && a !== 0 && delta < 0 && (
        <g>
          <rect
            x={mathToDesign(0, 1.8, scale).x - 90}
            y={mathToDesign(0, 1.8, scale).y - 18}
            width={180}
            height={32}
            rx={6}
            fill={withAlpha(MATH_COLORS.vectorResult, 0.08)}
            stroke={withAlpha(MATH_COLORS.vectorResult, 0.3)}
            strokeWidth={1}
          />
          <text
            x={mathToDesign(0, 1.8, scale).x}
            y={mathToDesign(0, 1.8, scale).y + 2}
            textAnchor="middle"
            fill={MATH_COLORS.vectorResult}
            fontSize={fontScale(11)}
            fontWeight="bold"
            className="select-none pointer-events-none"
          >
            Δ = {delta.toFixed(2)} &lt; 0 (无实数根)
          </text>
        </g>
      )}

      {labels.map((l) => (
        <text
          key={l.key}
          x={l.x}
          y={l.y + l.finalDy}
          textAnchor={l.anchor}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(10)}
          fontFamily="monospace"
          fontWeight="600"
          className="select-none pointer-events-none"
        >
          {l.text}
        </text>
      ))}
    </g>
  );
};
