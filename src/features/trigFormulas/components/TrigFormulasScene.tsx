import React from "react";
import { CoordinateGrid, InteractivePoint, VectorArrow, FunctionGraph } from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import type {
  StudyMode,
  SumDiffFormulaKey,
  DoubleAngleFormulaKey,
} from "../math/trigFormulas";
import { calculateSumDiff, calculateDoubleAngle, calculateAuxiliary } from "../math/trigFormulas";

interface TrigFormulasSceneProps {
  params: {
    alphaDeg: number;
    betaDeg: number;
    coeffA: number;
    coeffB: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, val: number) => void;
  fontScale: (size: number) => number;
  studyMode: StudyMode;
  sumDiffKey: SumDiffFormulaKey;
  doubleAngleKey: DoubleAngleFormulaKey;
}

export const TrigFormulasScene: React.FC<TrigFormulasSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  studyMode,
  sumDiffKey,
  doubleAngleKey,
}) => {
  const { alphaDeg, betaDeg, coeffA, coeffB } = params;

  // 原点 Design 坐标
  const origin = mathToDesign(0, 0, scale);

  // 1. 两角和差模式
  if (studyMode === "sum_diff") {
    const sumDiffData = calculateSumDiff(alphaDeg, betaDeg, sumDiffKey);
    const { alphaRad, cosAlpha, sinAlpha, cosBeta, sinBeta } = sumDiffData;

    // A 点 (cos alpha, sin alpha), B 点 (cos beta, sin beta)
    const pointA = mathToDesign(cosAlpha, sinAlpha, scale);
    const pointB = mathToDesign(cosBeta, sinBeta, scale);

    // 拖拽 A 点更新 alpha
    const handleDragA = (pt: { x: number; y: number }) => {
      const angleRad = Math.atan2(pt.y, pt.x);
      let angleDeg = Math.round((angleRad * 180) / Math.PI);
      if (angleDeg < -180) angleDeg += 360;
      onParamChange("alphaDeg", angleDeg);
    };

    // 拖拽 B 点更新 beta
    const handleDragB = (pt: { x: number; y: number }) => {
      const angleRad = Math.atan2(pt.y, pt.x);
      let angleDeg = Math.round((angleRad * 180) / Math.PI);
      if (angleDeg < -180) angleDeg += 360;
      onParamChange("betaDeg", angleDeg);
    };

    // 投影点
    const projAx = mathToDesign(cosAlpha, 0, scale);
    const projAy = mathToDesign(0, sinAlpha, scale);
    const projBx = mathToDesign(cosBeta, 0, scale);
    const projBy = mathToDesign(0, sinBeta, scale);

    // 单位圆 Design 半径
    const pt1 = mathToDesign(1, 0, scale);
    const circleRadius = Math.abs(pt1.x - origin.x);

    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 单位圆 */}
        <circle
          cx={origin.x}
          cy={origin.y}
          r={circleRadius}
          fill="none"
          stroke={CANVAS_COLORS.axis}
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />

        {/* 角 alpha 扇形射线 */}
        <line
          x1={origin.x}
          y1={origin.y}
          x2={origin.x + circleRadius * 0.35 * Math.cos(alphaRad)}
          y2={origin.y - circleRadius * 0.35 * Math.sin(alphaRad)}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={1.5}
        />

        {/* A 点投影辅助线 */}
        <line
          x1={pointA.x}
          y1={pointA.y}
          x2={projAx.x}
          y2={projAx.y}
          stroke={withAlpha(MATH_COLORS.paramPrimary, 0.4)}
          strokeDasharray="3 3"
        />
        <line
          x1={pointA.x}
          y1={pointA.y}
          x2={projAy.x}
          y2={projAy.y}
          stroke={withAlpha(MATH_COLORS.paramPrimary, 0.4)}
          strokeDasharray="3 3"
        />

        {/* B 点投影辅助线 */}
        <line
          x1={pointB.x}
          y1={pointB.y}
          x2={projBx.x}
          y2={projBx.y}
          stroke={withAlpha(MATH_COLORS.paramSecondary, 0.4)}
          strokeDasharray="3 3"
        />
        <line
          x1={pointB.x}
          y1={pointB.y}
          x2={projBy.x}
          y2={projBy.y}
          stroke={withAlpha(MATH_COLORS.paramSecondary, 0.4)}
          strokeDasharray="3 3"
        />

        {/* AB 连线（弦长对应两角差） */}
        <line
          x1={pointA.x}
          y1={pointA.y}
          x2={pointB.x}
          y2={pointB.y}
          stroke={MATH_COLORS.primary}
          strokeWidth={2}
          strokeDasharray="5 5"
        />

        {/* 向量 OA */}
        <VectorArrow
          from={[0, 0]}
          to={[cosAlpha, sinAlpha]}
          scale={scale}
          color={MATH_COLORS.paramPrimary}
          strokeWidth={2.5}
          fontScale={fontScale}
        />

        {/* 向量 OB */}
        <VectorArrow
          from={[0, 0]}
          to={[cosBeta, sinBeta]}
          scale={scale}
          color={MATH_COLORS.paramSecondary}
          strokeWidth={2.5}
          fontScale={fontScale}
        />

        {/* 动点 A */}
        <InteractivePoint
          cx={cosAlpha}
          cy={sinAlpha}
          scale={scale}
          vp={vp}
          onDrag={handleDragA}
          color={MATH_COLORS.paramPrimary}
          label="A(cos α, sin α)"
          fontScale={fontScale}
        />

        {/* 动点 B */}
        <InteractivePoint
          cx={cosBeta}
          cy={sinBeta}
          scale={scale}
          vp={vp}
          onDrag={handleDragB}
          color={MATH_COLORS.paramSecondary}
          label="B(cos β, sin β)"
          fontScale={fontScale}
        />
      </g>
    );
  }

  // 2. 倍角公式模式
  if (studyMode === "double_angle") {
    const doubleData = calculateDoubleAngle(alphaDeg, doubleAngleKey);
    const { sinAlpha, cosAlpha, sin2Alpha, cos2Alpha } = doubleData;

    const pointA = mathToDesign(cosAlpha, sinAlpha, scale);
    const pointDouble = mathToDesign(cos2Alpha, sin2Alpha, scale);

    const handleDragA = (pt: { x: number; y: number }) => {
      const angleRad = Math.atan2(pt.y, pt.x);
      let angleDeg = Math.round((angleRad * 180) / Math.PI);
      if (angleDeg < -180) angleDeg += 360;
      onParamChange("alphaDeg", angleDeg);
    };

    const pt1 = mathToDesign(1, 0, scale);
    const circleRadius = Math.abs(pt1.x - origin.x);

    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 单位圆 */}
        <circle
          cx={origin.x}
          cy={origin.y}
          r={circleRadius}
          fill="none"
          stroke={CANVAS_COLORS.axis}
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />

        {/* 单角 alpha 向量 */}
        <VectorArrow
          from={[0, 0]}
          to={[cosAlpha, sinAlpha]}
          scale={scale}
          color={MATH_COLORS.paramPrimary}
          strokeWidth={2.5}
          fontScale={fontScale}
        />

        {/* 倍角 2alpha 向量 */}
        <VectorArrow
          from={[0, 0]}
          to={[cos2Alpha, sin2Alpha]}
          scale={scale}
          color={MATH_COLORS.primary}
          strokeWidth={2.5}
          fontScale={fontScale}
        />

        {/* sin(alpha) * cos(alpha) 面积或投影示意矩形 (在 sin_2a 模式下) */}
        {doubleAngleKey === "sin_2a" && (
          <rect
            x={Math.min(origin.x, pointA.x)}
            y={Math.min(origin.y, pointA.y)}
            width={Math.abs(pointA.x - origin.x)}
            height={Math.abs(pointA.y - origin.y)}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.15)}
            stroke={MATH_COLORS.paramPrimary}
            strokeDasharray="3 3"
          />
        )}

        {/* 动点 A(单角) */}
        <InteractivePoint
          cx={cosAlpha}
          cy={sinAlpha}
          scale={scale}
          vp={vp}
          onDrag={handleDragA}
          color={MATH_COLORS.paramPrimary}
          label="P(α)"
          fontScale={fontScale}
        />

        {/* 倍角点 P(2α) */}
        <circle
          cx={pointDouble.x}
          cy={pointDouble.y}
          r={6}
          fill={MATH_COLORS.primary}
        />
        <text
          x={pointDouble.x + 10}
          y={pointDouble.y - 10}
          fill={MATH_COLORS.primary}
          fontSize={fontScale(12)}
          fontWeight="bold"
        >
          P(2α)
        </text>
      </g>
    );
  }

  // 3. 辅助角模式 Asin(x+phi)
  const auxData = calculateAuxiliary(coeffA, coeffB);
  const { amplitude, isDegenerate } = auxData;

  // 点 (a, b) 拖拽回调
  const handleDragPointP = (pt: { x: number; y: number }) => {
    const clampedA = Math.max(-5, Math.min(5, Math.round(pt.x * 10) / 10));
    const clampedB = Math.max(-5, Math.min(5, Math.round(pt.y * 10) / 10));
    onParamChange("coeffA", clampedA);
    onParamChange("coeffB", clampedB);
  };

  const pointP = mathToDesign(coeffA, coeffB, scale);

  // 合成函数 y = a sin(x) + b cos(x) = A sin(x + phi)
  const fnSum = (x: number) => coeffA * Math.sin(x) + coeffB * Math.cos(x);
  const fnSinPart = (x: number) => coeffA * Math.sin(x);
  const fnCosPart = (x: number) => coeffB * Math.cos(x);

  const ampLineLeft = mathToDesign(-6, amplitude, scale);
  const ampLineRight = mathToDesign(6, amplitude, scale);

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. a sin x 分波形 */}
      <FunctionGraph
        fn={fnSinPart}
        scale={scale}
        color={withAlpha(MATH_COLORS.paramPrimary, 0.4)}
        strokeWidth={1.5}
      />

      {/* 2. b cos x 分波形 */}
      <FunctionGraph
        fn={fnCosPart}
        scale={scale}
        color={withAlpha(MATH_COLORS.paramSecondary, 0.4)}
        strokeWidth={1.5}
      />

      {/* 3. 合成波形 a sin x + b cos x */}
      <FunctionGraph
        fn={fnSum}
        scale={scale}
        color={MATH_COLORS.primary}
        strokeWidth={3}
      />

      {/* 平面点 (a, b) 向量指示与直角三角形 */}
      {!isDegenerate && (
        <>
          <line
            x1={origin.x}
            y1={origin.y}
            x2={pointP.x}
            y2={pointP.y}
            stroke={MATH_COLORS.primary}
            strokeWidth={2}
          />
          {/* 直角腿 a (x方向) */}
          <line
            x1={origin.x}
            y1={origin.y}
            x2={pointP.x}
            y2={origin.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          {/* 直角腿 b (y方向) */}
          <line
            x1={pointP.x}
            y1={origin.y}
            x2={pointP.x}
            y2={pointP.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        </>
      )}

      {/* 拖拽控制点 P(a, b) */}
      <InteractivePoint
        cx={coeffA}
        cy={coeffB}
        scale={scale}
        vp={vp}
        onDrag={handleDragPointP}
        color={MATH_COLORS.primary}
        label={`P(a=${coeffA}, b=${coeffB})`}
        fontScale={fontScale}
      />

      {/* 振幅 A 标注线 */}
      {!isDegenerate && (
        <line
          x1={ampLineLeft.x}
          y1={ampLineLeft.y}
          x2={ampLineRight.x}
          y2={ampLineRight.y}
          stroke={withAlpha(MATH_COLORS.primary, 0.5)}
          strokeDasharray="3 3"
        />
      )}
    </g>
  );
};
