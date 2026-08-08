/**
 * src/features/inequalityAbsolute/components/InequalityAbsoluteScene.tsx
 * 纯 SVG 渲染与交互，无 DOM / React 副作用
 */

import React, { useCallback } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  IntervalShadow,
} from "@/components/Math";
import { mathToDesign, designToMath } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  solveAbsoluteInequality,
  evalAbsoluteFunc,
  type InequalityMode,
  type InequalityType,
} from "@/math/inequalityAbsolute";

interface InequalityAbsoluteSceneProps {
  params: {
    a: number;
    b: number;
    c: number;
    m: number;
    x: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode: InequalityMode;
  ineqType: InequalityType;
}

export const InequalityAbsoluteScene: React.FC<
  InequalityAbsoluteSceneProps
> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode,
  ineqType,
}) => {
  const { a, b, c, m, x } = params;

  // 解算不等式与特征点
  const result = solveAbsoluteInequality(a, b, c, m, x, studyMode, ineqType);

  // 目标函数 fn(x)
  const fn = useCallback(
    (val: number) => evalAbsoluteFunc(val, a, b, studyMode),
    [a, b, studyMode],
  );

  const threshold = studyMode === "single" ? c : m;

  // 拖拽 A 点
  const handleDragPointA = useCallback(
    (newDesignPos: { x: number; y: number }) => {
      const mathPos = designToMath(newDesignPos.x, newDesignPos.y, scale);
      const roundedA = Math.round(mathPos.x * 2) / 2;
      onParamChange("a", roundedA);
    },
    [scale, onParamChange],
  );

  // 拖拽 B 点
  const handleDragPointB = useCallback(
    (newDesignPos: { x: number; y: number }) => {
      const mathPos = designToMath(newDesignPos.x, newDesignPos.y, scale);
      const roundedB = Math.round(mathPos.x * 2) / 2;
      onParamChange("b", roundedB);
    },
    [scale, onParamChange],
  );

  // 拖拽动点 P (x)
  const handleDragPointP = useCallback(
    (newDesignPos: { x: number; y: number }) => {
      const mathPos = designToMath(newDesignPos.x, newDesignPos.y, scale);
      const roundedX = Math.round(mathPos.x * 10) / 10;
      onParamChange("x", roundedX);
    },
    [scale, onParamChange],
  );

  // 拖拽阈值水平线 m/c (沿 y 轴)
  const handleDragThreshold = useCallback(
    (newDesignPos: { x: number; y: number }) => {
      const mathPos = designToMath(newDesignPos.x, newDesignPos.y, scale);
      const key = studyMode === "single" ? "c" : "m";
      const minVal = key === "c" ? 0 : -2;
      const roundedVal = Math.max(minVal, Math.round(mathPos.y * 2) / 2);
      onParamChange(key, roundedVal);
    },
    [scale, studyMode, onParamChange],
  );

  // 映射设计坐标
  const ptA = mathToDesign(a, 0, scale);
  const ptB = mathToDesign(b, 0, scale);
  const ptP = mathToDesign(x, 0, scale);
  const ptPOnGraph = mathToDesign(x, result.yVal, scale);
  const ptThreshold = mathToDesign(0, threshold, scale);

  return (
    <g>
      {/* 1. 直角坐标系与网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 2. 解集区间阴影 (在图像 y = f(x) 与 x 轴之间) */}
      {result.intervals.map((interval, index) => (
        <IntervalShadow
          key={`interval-shadow-${index}`}
          fn={fn}
          x1={interval.x1}
          x2={interval.x2}
          scale={scale}
          fillColor={withAlpha(MATH_COLORS.inequality, 0.15)}
          strokeColor="transparent"
        />
      ))}

      {/* 3. 目标比较水平常数线 y = m 或 y = c */}
      <g>
        <line
          x1={mathToDesign(scale.xMin, 0, scale).x}
          y1={ptThreshold.y}
          x2={mathToDesign(scale.xMax, 0, scale).x}
          y2={ptThreshold.y}
          stroke={MATH_COLORS.paramTertiary}
          strokeWidth={2}
          strokeDasharray="5 4"
        />
        <text
          x={mathToDesign(scale.xMax, 0, scale).x - 70}
          y={ptThreshold.y - 6}
          fill={MATH_COLORS.paramTertiary}
          fontSize={fontScale(11)}
          fontWeight="bold"
          className="select-none pointer-events-none"
        >
          {studyMode === "single"
            ? `y = c (${c.toFixed(1)})`
            : `y = m (${m.toFixed(1)})`}
        </text>
      </g>

      {/* 4. 折线函数图像 y = f(x) */}
      <FunctionGraph
        fn={fn}
        scale={scale}
        color={MATH_COLORS.function}
        strokeWidth={2.8}
      />

      {/* 5. 关键转折点（转折零点）垂线与高亮 */}
      {result.turningPoints.map((tp, idx) => {
        const des = mathToDesign(tp.x, tp.y, scale);
        const desOnAxis = mathToDesign(tp.x, 0, scale);
        return (
          <g key={`tp-${idx}`}>
            <line
              x1={des.x}
              y1={des.y}
              x2={desOnAxis.x}
              y2={desOnAxis.y}
              stroke={MATH_COLORS.asymptote}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={des.x}
              cy={des.y}
              r={4}
              fill={MATH_COLORS.focusPoint}
              stroke={MATH_COLORS.white}
              strokeWidth={1.5}
            />
            <text
              x={des.x}
              y={des.y - 8}
              textAnchor="middle"
              fill={MATH_COLORS.labelText}
              fontSize={fontScale(10)}
              fontWeight="600"
              className="select-none pointer-events-none"
            >
              {tp.label}
            </text>
          </g>
        );
      })}

      {/* 6. 解集在 x 轴上的投影高亮线段与端点圈 */}
      {result.intervals.map((interval, index) => {
        const leftX = Math.max(interval.x1, scale.xMin);
        const rightX = Math.min(interval.x2, scale.xMax);
        const p1 = mathToDesign(leftX, 0, scale);
        const p2 = mathToDesign(rightX, 0, scale);

        return (
          <g key={`axis-projection-${index}`}>
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={MATH_COLORS.inequality}
              strokeWidth={6}
              strokeOpacity={0.6}
              strokeLinecap="round"
            />
            {!interval.isLeftInfinity && interval.x1 >= scale.xMin && (
              <circle
                cx={mathToDesign(interval.x1, 0, scale).x}
                cy={mathToDesign(interval.x1, 0, scale).y}
                r={4.5}
                fill={MATH_COLORS.white}
                stroke={MATH_COLORS.inequality}
                strokeWidth={2}
              />
            )}
            {!interval.isRightInfinity && interval.x2 <= scale.xMax && (
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

      {/* 7. 数轴 (y=0) 几何距离指示线段 */}
      {/* 点 A 与 P 之间的距离指示弧线/线段 */}
      <g>
        <line
          x1={ptA.x}
          y1={ptA.y + 12}
          x2={ptP.x}
          y2={ptP.y + 12}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={2}
        />
        <line
          x1={ptA.x}
          y1={ptA.y + 8}
          x2={ptA.x}
          y2={ptA.y + 16}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={2}
        />
        <line
          x1={ptP.x}
          y1={ptP.y + 8}
          x2={ptP.x}
          y2={ptP.y + 16}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={2}
        />
        <text
          x={(ptA.x + ptP.x) / 2}
          y={ptA.y + 26}
          textAnchor="middle"
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(10)}
          fontWeight="bold"
          className="select-none pointer-events-none"
        >
          |x-a| = {result.distA.toFixed(1)}
        </text>
      </g>

      {/* 如果是非 single 模式，画点 B 与 P 之间的距离指示线 */}
      {studyMode !== "single" && (
        <g>
          <line
            x1={ptB.x}
            y1={ptB.y + 32}
            x2={ptP.x}
            y2={ptP.y + 32}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2}
          />
          <line
            x1={ptB.x}
            y1={ptB.y + 28}
            x2={ptB.x}
            y2={ptB.y + 36}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2}
          />
          <line
            x1={ptP.x}
            y1={ptP.y + 28}
            x2={ptP.x}
            y2={ptP.y + 36}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2}
          />
          <text
            x={(ptB.x + ptP.x) / 2}
            y={ptB.y + 46}
            textAnchor="middle"
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(10)}
            fontWeight="bold"
            className="select-none pointer-events-none"
          >
            |x-b| = {result.distB.toFixed(1)}
          </text>
        </g>
      )}

      {/* 8. 试探点 P 在图像上的连线与点 */}
      <line
        x1={ptP.x}
        y1={ptP.y}
        x2={ptPOnGraph.x}
        y2={ptPOnGraph.y}
        stroke={MATH_COLORS.paramTertiary}
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
      <circle
        cx={ptPOnGraph.x}
        cy={ptPOnGraph.y}
        r={5}
        fill={MATH_COLORS.paramTertiary}
        stroke={MATH_COLORS.white}
        strokeWidth={1.5}
      />
      <text
        x={ptPOnGraph.x + 8}
        y={ptPOnGraph.y - 6}
        fill={MATH_COLORS.paramTertiary}
        fontSize={fontScale(10)}
        fontWeight="bold"
        className="select-none pointer-events-none"
      >
        P({x.toFixed(1)}, {result.yVal.toFixed(1)})
      </text>

      {/* 9. 可拖拽控制点 */}
      {/* 拖拽点 A(a, 0) */}
      <InteractivePoint
        cx={a}
        cy={0}
        scale={scale}
        vp={vp}
        onDrag={handleDragPointA}
        color={MATH_COLORS.paramPrimary}
        r={6}
        fontScale={fontScale}
      />

      {/* 拖拽点 B(b, 0) */}
      {studyMode !== "single" && (
        <InteractivePoint
          cx={b}
          cy={0}
          scale={scale}
          vp={vp}
          onDrag={handleDragPointB}
          color={MATH_COLORS.paramSecondary}
          r={6}
          fontScale={fontScale}
        />
      )}

      {/* 拖拽动点 P(x, 0) */}
      <InteractivePoint
        cx={x}
        cy={0}
        scale={scale}
        vp={vp}
        onDrag={handleDragPointP}
        color={MATH_COLORS.paramTertiary}
        r={6}
        fontScale={fontScale}
      />

      {/* 拖拽阈值点 (0, m) 或 (0, c) */}
      <InteractivePoint
        cx={0}
        cy={threshold}
        scale={scale}
        vp={vp}
        onDrag={handleDragThreshold}
        color={MATH_COLORS.paramTertiary}
        r={5}
        fontScale={fontScale}
      />
    </g>
  );
};
