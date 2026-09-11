/**
 * src/features/inequalityAbsolute/components/InequalityAbsoluteScene.tsx
 * 纯 SVG 渲染与交互，零 DOM / React 副作用
 */

import React, { useCallback, useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  IntervalShadow,
  SceneLabelGroup,
  VectorArrow,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  solveAbsoluteInequality,
  evalAbsoluteFunc,
  type InequalityMode,
  type InequalityType,
} from "@/math/inequalityAbsolute";
import type { LabelItem } from "@/utils/labelOverlap";

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

  // 拖拽 A 点 (原生数学坐标，严禁二次调用 designToMath)
  const handleDragPointA = useCallback(
    (mathPos: { x: number; y: number }) => {
      const roundedA = Math.round(mathPos.x * 2) / 2;
      onParamChange("a", roundedA);
    },
    [onParamChange],
  );

  // 拖拽 B 点
  const handleDragPointB = useCallback(
    (mathPos: { x: number; y: number }) => {
      const roundedB = Math.round(mathPos.x * 2) / 2;
      onParamChange("b", roundedB);
    },
    [onParamChange],
  );

  // 拖拽动点 P (x)
  const handleDragPointP = useCallback(
    (mathPos: { x: number; y: number }) => {
      const roundedX = Math.round(mathPos.x * 10) / 10;
      onParamChange("x", roundedX);
    },
    [onParamChange],
  );

  // 拖拽阈值水平线 m/c (沿 y 轴)
  const handleDragThreshold = useCallback(
    (mathPos: { x: number; y: number }) => {
      const key = studyMode === "single" ? "c" : "m";
      const minVal = key === "c" ? 0 : -2;
      const roundedVal = Math.max(minVal, Math.round(mathPos.y * 2) / 2);
      onParamChange(key, roundedVal);
    },
    [studyMode, onParamChange],
  );

  // 映射设计坐标
  const ptA = mathToDesign(a, 0, scale);
  const ptB = mathToDesign(b, 0, scale);
  const ptP = mathToDesign(x, 0, scale);
  const ptPOnGraph = mathToDesign(x, result.yVal, scale);
  const ptThreshold = mathToDesign(0, threshold, scale);

  // 学术标签组 (纯学术代数记号，杜绝浮点数跳动)
  const sceneLabels = useMemo<LabelItem[]>(() => {
    if (studyMode === "triangle") {
      return [
        {
          key: "pt-A-origin",
          x: mathToDesign(0, 0, scale).x,
          y: mathToDesign(0, 0, scale).y,
          text: "O",
          color: MATH_COLORS.axis,
          preferredPlacement: "bottom",
        },
        {
          key: "pt-A",
          x: ptA.x,
          y: ptA.y,
          text: "A(a)",
          color: MATH_COLORS.paramPrimary,
          preferredPlacement: "bottom",
        },
        {
          key: "pt-sum-B",
          x: mathToDesign(a + b, 0, scale).x,
          y: mathToDesign(a + b, 0, scale).y,
          text: "B(a+b)",
          color: MATH_COLORS.paramTertiary,
          preferredPlacement: "bottom",
        },
      ];
    }

    const items: LabelItem[] = [
      {
        key: "pt-A",
        x: ptA.x,
        y: ptA.y,
        text: "A(a)",
        color: MATH_COLORS.paramPrimary,
        preferredPlacement: "bottom",
      },
      {
        key: "pt-P",
        x: ptP.x,
        y: ptP.y,
        text: "P(x)",
        color: MATH_COLORS.focusPoint,
        preferredPlacement: "bottom",
      },
    ];

    if (studyMode !== "single") {
      items.push({
        key: "pt-B",
        x: ptB.x,
        y: ptB.y,
        text: "B(b)",
        color: MATH_COLORS.paramSecondary,
        preferredPlacement: "bottom",
      });
    }

    items.push({
      key: "pt-P-graph",
      x: ptPOnGraph.x,
      y: ptPOnGraph.y,
      text: "P(x, y)",
      color: MATH_COLORS.focusPoint,
      preferredPlacement: "top-right",
    });

    // 关键转折点（拐点 / 零点）
    result.turningPoints.forEach((tp, idx) => {
      const des = mathToDesign(tp.x, tp.y, scale);
      items.push({
        key: `tp-label-${idx}`,
        x: des.x,
        y: des.y,
        text: studyMode === "single" ? "A" : `T_${idx + 1}`,
        color: MATH_COLORS.labelText,
        preferredPlacement: "top",
      });
    });

    return items;
  }, [studyMode, a, b, ptA, ptB, ptP, ptPOnGraph, result.turningPoints, scale]);

  return (
    <g>
      {/* 1. 直角坐标系与网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 2. 三角不等式模式：绘制向量/有向线段几何图解 */}
      {studyMode === "triangle" ? (
        <g>
          {/* 有向向量 1: OA 对应实数 a */}
          {Math.abs(a) > 0.05 && (
            <VectorArrow
              from={[0, 1.2]}
              to={[a, 1.2]}
              scale={scale}
              color={MATH_COLORS.paramPrimary}
              strokeWidth={3}
              headLength={10}
              headWidth={6}
              label={`a⃗ (OA→), |a| = ${Math.abs(a).toFixed(1)}`}
              fontScale={fontScale}
              labelOffset={[0, -10]}
            />
          )}

          {/* 有向向量 2: AB 对应实数 b (首尾顺接) */}
          {Math.abs(b) > 0.05 && (
            <VectorArrow
              from={[a, 2.5]}
              to={[a + b, 2.5]}
              scale={scale}
              color={MATH_COLORS.paramSecondary}
              strokeWidth={3}
              headLength={10}
              headWidth={6}
              label={`b⃗ (AB→), |b| = ${Math.abs(b).toFixed(1)}`}
              fontScale={fontScale}
              labelOffset={[0, -10]}
            />
          )}

          {/* 合成和向量 3: OB 对应实数 a + b */}
          {Math.abs(a + b) > 0.05 && (
            <VectorArrow
              from={[0, 3.8]}
              to={[a + b, 3.8]}
              scale={scale}
              color={MATH_COLORS.paramTertiary}
              strokeWidth={3.5}
              headLength={12}
              headWidth={7}
              label={`a⃗ + b⃗ (OB→), |a+b| = ${Math.abs(a + b).toFixed(1)}`}
              fontScale={fontScale}
              labelOffset={[0, -10]}
            />
          )}

          {/* 状态文字指示：同号顺接还是异号相消 */}
          <g>
            <rect
              x={mathToDesign(-5.5, 7.5, scale).x}
              y={mathToDesign(-5.5, 7.5, scale).y}
              width={265}
              height={46}
              rx={6}
              fill={withAlpha(MATH_COLORS.white, 0.95)}
              stroke={
                a * b >= 0 ? MATH_COLORS.inequality : MATH_COLORS.degeneracy
              }
              strokeWidth={1.5}
            />
            <text
              x={mathToDesign(-5.5, 7.5, scale).x + 12}
              y={mathToDesign(-5.5, 7.5, scale).y + 20}
              fill={
                a * b >= 0 ? MATH_COLORS.inequality : MATH_COLORS.degeneracy
              }
              fontSize={fontScale(11)}
              fontWeight="bold"
            >
              {a * b >= 0
                ? "✓ 向量同向顺接 (ab ≥ 0)：模和最大"
                : "⚠ 向量反向相消 (ab < 0)：模差最小"}
            </text>
            <text
              x={mathToDesign(-5.5, 7.5, scale).x + 12}
              y={mathToDesign(-5.5, 7.5, scale).y + 36}
              fill={MATH_COLORS.labelText}
              fontSize={fontScale(10)}
            >
              {a * b >= 0
                ? `取等：|a + b| = |a| + |b| = ${(Math.abs(a) + Math.abs(b)).toFixed(1)}`
                : `取等：|a + b| = ||a| - |b|| = ${Math.abs(Math.abs(a) - Math.abs(b)).toFixed(1)}`}
            </text>
          </g>
        </g>
      ) : (
        /* 非 triangle 模式：常规折线图与不等式区间 */
        <g>
          {/* 解集区间阴影 */}
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

          {/* 目标比较水平常数线 y = m 或 y = c */}
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
              x={mathToDesign(scale.xMax, 0, scale).x - 85}
              y={ptThreshold.y - 6}
              fill={MATH_COLORS.paramTertiary}
              fontSize={fontScale(11)}
              fontWeight="bold"
              className="select-none pointer-events-none"
            >
              {studyMode === "single"
                ? `y = c = ${c.toFixed(1)}`
                : `y = m = ${m.toFixed(1)}`}
            </text>
          </g>

          {/* 折线函数图像 y = f(x) */}
          <FunctionGraph
            fn={fn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.8}
          />

          {/* 关键转折点垂线与高亮 */}
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
              </g>
            );
          })}

          {/* 解集在 x 轴上的投影高亮线段 */}
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

          {/* 数轴几何距离指示标尺 */}
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
              |PA| = |x - a| = {result.distA.toFixed(1)}
            </text>
          </g>

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
                |PB| = |x - b| = {result.distB.toFixed(1)}
              </text>
            </g>
          )}

          {/* 试探点 P 在图像上的连线与点 */}
          <line
            x1={ptP.x}
            y1={ptP.y}
            x2={ptPOnGraph.x}
            y2={ptPOnGraph.y}
            stroke={MATH_COLORS.focusPoint}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          <circle
            cx={ptPOnGraph.x}
            cy={ptPOnGraph.y}
            r={5}
            fill={MATH_COLORS.focusPoint}
            stroke={MATH_COLORS.white}
            strokeWidth={1.5}
          />
        </g>
      )}

      {/* 3. 智能学术标签组 (SceneLabelGroup 渲染纯代数符号，防重叠) */}
      <SceneLabelGroup items={sceneLabels} fontScale={fontScale} />

      {/* 4. 可拖拽控制点 (带单轴约束与防脱轨) */}
      {/* 拖拽点 A(a, 0) */}
      <InteractivePoint
        cx={a}
        cy={0}
        axis="x"
        xRange={[-5, 5]}
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
          axis="x"
          xRange={[-5, 5]}
          scale={scale}
          vp={vp}
          onDrag={handleDragPointB}
          color={MATH_COLORS.paramSecondary}
          r={6}
          fontScale={fontScale}
        />
      )}

      {/* 拖拽动点 P(x, 0) (仅非 triangle 模式展示动点 P) */}
      {studyMode !== "triangle" && (
        <InteractivePoint
          cx={x}
          cy={0}
          axis="x"
          xRange={[-6, 6]}
          scale={scale}
          vp={vp}
          onDrag={handleDragPointP}
          color={MATH_COLORS.focusPoint}
          r={6}
          fontScale={fontScale}
        />
      )}

      {/* 拖拽阈值点 (0, m) 或 (0, c) */}
      {studyMode !== "triangle" && (
        <InteractivePoint
          cx={0}
          cy={threshold}
          axis="y"
          yRange={[studyMode === "single" ? 0 : -2, 8]}
          scale={scale}
          vp={vp}
          onDrag={handleDragThreshold}
          color={MATH_COLORS.paramTertiary}
          r={5}
          fontScale={fontScale}
        />
      )}
    </g>
  );
};
