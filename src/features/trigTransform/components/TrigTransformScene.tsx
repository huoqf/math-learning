import { useMemo } from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  VectorArrow,
} from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabelOverlap } from "@/utils/labelOverlap";
import type { ViewportTransform, SceneScale } from "@/hooks";
import {
  calcTrigProperties,
  getTransformPathSteps,
  formatPiValue,
} from "../math/trigTransform";

interface TrigTransformSceneProps {
  params: {
    A: number;
    omega: number;
    phi: number;
    k: number;
  };
  scale: SceneScale;
  vp: ViewportTransform;
  onParamChange?: (key: string, value: number) => void;
  fontScale: (v: number) => number;
  studyMode: "properties" | "fivePoints" | "transformPath";
  pathType: "shift-first" | "stretch-first";
  stepIndex: number;
}

export function TrigTransformScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  studyMode,
  pathType,
  stepIndex,
}: TrigTransformSceneProps) {
  const { A, omega, phi, k } = params;

  // 计算综合性质
  const properties = useMemo(
    () => calcTrigProperties(A, omega, phi, k),
    [A, omega, phi, k],
  );

  // 变换路径步骤数据
  const pathSteps = useMemo(
    () => getTransformPathSteps(A, omega, phi, k, pathType),
    [A, omega, phi, k, pathType],
  );

  const currentStepInfo = pathSteps[stepIndex] ?? pathSteps[0];

  // 1. 基准曲线 y = sin(x)
  const baseSinFn = (x: number) => Math.sin(x);

  // 2. 目标曲线 y = A sin(omega x + phi) + k
  const targetFn = (x: number) => A * Math.sin(omega * x + phi) + k;

  // 标签自动避让
  const rawLabels = useMemo(() => {
    if (studyMode === "fivePoints") {
      return properties.fivePoints.map((pt) => {
        const dPt = mathToDesign(pt.x, pt.y, scale);
        return {
          id: `five-pt-${pt.index}`,
          x: dPt.x + 8,
          y: dPt.y - 12,
          width: 80,
          height: 18,
          text: `(${formatPiValue(pt.x)}, ${pt.y.toFixed(1)})`,
        };
      });
    }
    return [];
  }, [studyMode, properties.fivePoints, scale]);

  const positionedLabels = useMemo(
    () => avoidLabelOverlap(rawLabels),
    [rawLabels],
  );

  return (
    <g className="trig-transform-scene">
      {/* 坐标轴与网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 平衡位置线 y = k */}
      {Math.abs(k) > 1e-5 && (
        <line
          x1={mathToDesign(-12, k, scale).x}
          y1={mathToDesign(-12, k, scale).y}
          x2={mathToDesign(12, k, scale).x}
          y2={mathToDesign(12, k, scale).y}
          stroke={CANVAS_COLORS.grid}
          strokeDasharray="4 4"
          strokeWidth={1.5}
        />
      )}

      {/* 1. 【图像性质研究模式】 */}
      {studyMode === "properties" && (
        <>
          {/* 最值上下界虚线 */}
          <line
            x1={mathToDesign(-12, properties.yMax, scale).x}
            y1={mathToDesign(-12, properties.yMax, scale).y}
            x2={mathToDesign(12, properties.yMax, scale).x}
            y2={mathToDesign(12, properties.yMax, scale).y}
            stroke={withAlpha(MATH_COLORS.paramPrimary, 0.4)}
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <line
            x1={mathToDesign(-12, properties.yMin, scale).x}
            y1={mathToDesign(-12, properties.yMin, scale).y}
            x2={mathToDesign(12, properties.yMin, scale).x}
            y2={mathToDesign(12, properties.yMin, scale).y}
            stroke={withAlpha(MATH_COLORS.paramPrimary, 0.4)}
            strokeDasharray="3 3"
            strokeWidth={1}
          />

          {/* 基准曲线 y = sin(x) (对比虚线) */}
          <FunctionGraph
            fn={baseSinFn}
            scale={scale}
            color={withAlpha(CANVAS_COLORS.axis, 0.4)}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            xRange={[-10, 10]}
          />

          {/* 目标曲线 y = A sin(omega x + phi) + k */}
          <FunctionGraph
            fn={targetFn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.5}
            xRange={[-10, 10]}
          />

          {/* 对称轴 (主对称轴点划线) */}
          {properties.mainSymmetryAxes.map((axisX, i) => {
            const topPt = mathToDesign(axisX, properties.yMax + 0.5, scale);
            const botPt = mathToDesign(axisX, properties.yMin - 0.5, scale);
            return (
              <g key={`sym-axis-${i}`}>
                <line
                  x1={topPt.x}
                  y1={topPt.y}
                  x2={botPt.x}
                  y2={botPt.y}
                  stroke={withAlpha(MATH_COLORS.paramSecondary, 0.6)}
                  strokeDasharray="6 3 2 3"
                  strokeWidth={1.5}
                />
              </g>
            );
          })}

          {/* 对称中心 */}
          {properties.mainSymmetryCenters.map(([cx, cy], i) => {
            const centerPt = mathToDesign(cx, cy, scale);
            return (
              <g key={`sym-center-${i}`}>
                <circle
                  cx={centerPt.x}
                  cy={centerPt.y}
                  r={4}
                  fill={MATH_COLORS.paramTertiary}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              </g>
            );
          })}

          {/* 周期 T 标注向量双头箭头 */}
          {properties.fivePoints.length >= 5 && (
            <g>
              <VectorArrow
                from={[properties.fivePoints[0].x, properties.yMin - 0.6]}
                to={[properties.fivePoints[4].x, properties.yMin - 0.6]}
                scale={scale}
                color={MATH_COLORS.paramSecondary}
                strokeWidth={1.5}
                headSize={6}
                fontScale={fontScale}
              />
              <text
                x={
                  mathToDesign(
                    (properties.fivePoints[0].x + properties.fivePoints[4].x) /
                      2,
                    properties.yMin - 0.9,
                    scale,
                  ).x
                }
                y={
                  mathToDesign(
                    (properties.fivePoints[0].x + properties.fivePoints[4].x) /
                      2,
                    properties.yMin - 0.9,
                    scale,
                  ).y
                }
                fill={MATH_COLORS.paramSecondary}
                fontSize={fontScale(12)}
                fontWeight="600"
                textAnchor="middle"
              >
                周期 T = {formatPiValue(properties.period)}
              </text>
            </g>
          )}

          {/* 5 个关键交互控制点 */}
          {properties.fivePoints.map((pt) => (
            <InteractivePoint
              key={`prop-pt-${pt.index}`}
              cx={pt.x}
              cy={pt.y}
              scale={scale}
              vp={vp}
              color={
                pt.index % 2 === 0
                  ? MATH_COLORS.paramPrimary
                  : MATH_COLORS.paramTertiary
              }
              r={6}
              fontScale={fontScale}
              label={`${pt.index % 2 === 0 ? "峰/谷" : "零点"} P${pt.index}`}
              onDrag={(newX, newY) => {
                if (!onParamChange) return;
                if (pt.index === 2) {
                  // 波峰点拖拽 -> 更新 A 和 k
                  const newA = Math.max(0.1, Math.min(3, newY - k));
                  onParamChange("A", Number(newA.toFixed(1)));
                } else if (pt.index === 1) {
                  // 第一个零点拖拽 -> 更新 phi
                  const newPhi = -omega * newX;
                  const normalizedPhi = Math.max(
                    -Math.PI,
                    Math.min(Math.PI, newPhi),
                  );
                  onParamChange("phi", Number(normalizedPhi.toFixed(2)));
                }
              }}
            />
          ))}
        </>
      )}

      {/* 2. 【五点作图法模式】 */}
      {studyMode === "fivePoints" && (
        <>
          {/* 目标函数曲线 */}
          <FunctionGraph
            fn={targetFn}
            scale={scale}
            color={withAlpha(MATH_COLORS.function, 0.4)}
            strokeWidth={2}
            xRange={[-10, 10]}
          />

          {/* 单周期高亮主弧段 */}
          {properties.fivePoints.length >= 5 && (
            <FunctionGraph
              fn={targetFn}
              scale={scale}
              color={MATH_COLORS.function}
              strokeWidth={3.5}
              xRange={[properties.fivePoints[0].x, properties.fivePoints[4].x]}
            />
          )}

          {/* 标准 sin(x) 的五点对照映射 */}
          {properties.fivePoints.map((pt) => {
            const stdX = (pt.index - 1) * (Math.PI / 2);
            const stdY = Math.sin(stdX);
            const dStdPt = mathToDesign(stdX, stdY, scale);
            const dTargetPt = mathToDesign(pt.x, pt.y, scale);

            return (
              <g key={`five-map-${pt.index}`}>
                {/* 从标准点到目标点的关联虚线 */}
                <line
                  x1={dStdPt.x}
                  y1={dStdPt.y}
                  x2={dTargetPt.x}
                  y2={dTargetPt.y}
                  stroke={withAlpha(MATH_COLORS.paramSecondary, 0.5)}
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                />

                {/* 标准点 */}
                <circle
                  cx={dStdPt.x}
                  cy={dStdPt.y}
                  r={4}
                  fill={CANVAS_COLORS.axis}
                />

                {/* 目标五点高亮节点 */}
                <circle
                  cx={dTargetPt.x}
                  cy={dTargetPt.y}
                  r={7}
                  fill={MATH_COLORS.paramPrimary}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              </g>
            );
          })}

          {/* 避让后的五点坐标文本标签 */}
          {positionedLabels.map((lbl) => (
            <text
              key={lbl.id}
              x={lbl.x}
              y={lbl.y}
              fill={MATH_COLORS.paramPrimary}
              fontSize={fontScale(11)}
              fontWeight="600"
            >
              {lbl.text}
            </text>
          ))}
        </>
      )}

      {/* 3. 【高考变换路径模式】 */}
      {studyMode === "transformPath" && (
        <>
          {/* 基准曲线 y = sin(x) */}
          <FunctionGraph
            fn={baseSinFn}
            scale={scale}
            color={withAlpha(CANVAS_COLORS.axis, 0.35)}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            xRange={[-10, 10]}
          />

          {/* 最终目标曲线 y = A sin(omega x + phi) + k (背景参考) */}
          {stepIndex < 4 && (
            <FunctionGraph
              fn={targetFn}
              scale={scale}
              color={withAlpha(MATH_COLORS.function, 0.25)}
              strokeWidth={1.5}
              strokeDasharray="2 2"
              xRange={[-10, 10]}
            />
          )}

          {/* 当前步骤中间过程曲线 */}
          <FunctionGraph
            fn={currentStepInfo.fn}
            scale={scale}
            color={
              stepIndex === 4
                ? MATH_COLORS.function
                : MATH_COLORS.paramSecondary
            }
            strokeWidth={3}
            xRange={[-10, 10]}
          />

          {/* 变换指示箭头/线段 */}
          {currentStepInfo.shiftValue !== undefined &&
            Math.abs(currentStepInfo.shiftValue) > 1e-4 && (
              <g>
                <VectorArrow
                  from={[0, 0]}
                  to={
                    stepIndex === 4
                      ? [0, currentStepInfo.shiftValue]
                      : [-currentStepInfo.shiftValue, 0]
                  }
                  scale={scale}
                  color={MATH_COLORS.paramTertiary}
                  strokeWidth={2}
                  headSize={8}
                  fontScale={fontScale}
                />
              </g>
            )}
        </>
      )}
    </g>
  );
}
