/**
 * src/features/parabola/components/ParabolaScene.tsx
 * 抛物线焦点性质与准线几何 SVG 场景渲染
 * 严格按照 2D 场景铁律开发，零 DOM / 零物理公式，字号完全受控于 fontScale
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  InteractivePoint,
  Asymptote,
  VectorArrow,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { ParabolaDirection } from "@/math/parabola";
import { useParabolaScene } from "../hooks/useParabolaScene";
import type { PlacedLabel } from "@/utils/labelAvoider";

interface ParabolaSceneProps {
  params: {
    p: number;
    tP: number;
    thetaDeg: number;
    yQ: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  direction?: ParabolaDirection;
  studyMode?: "definition" | "focalChord" | "tangentOptical";
}

export const ParabolaScene: React.FC<ParabolaSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  direction = "right",
  studyMode = "definition",
}) => {
  const {
    base,
    isDegenerate,
    curvePoints,
    P,
    radiusInfo,
    chordInfo,
    opticalInfo,
    mongeInfo,
    handlePDrag,
    handleQDrag,
    labels,
  } = useParabolaScene({
    params,
    scale,
    direction,
    studyMode,
    onParamChange,
  });

  const focusPt = mathToDesign(base.focus.x, base.focus.y, scale);

  return (
    <g>
      {/* 1. 坐标轴与网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 2. 准线 (使用 Asymptote 组件) */}
      {base.directrixIsVertical ? (
        <Asymptote
          type="vertical"
          value={base.directrixConstant}
          scale={scale}
          color={MATH_COLORS.asymptote}
          label="准线 l"
          fontScale={fontScale}
        />
      ) : (
        <Asymptote
          type="horizontal"
          value={base.directrixConstant}
          scale={scale}
          color={MATH_COLORS.asymptote}
          label="准线 l"
          fontScale={fontScale}
        />
      )}

      {/* 3. 抛物线主曲线 */}
      {!isDegenerate && curvePoints && (
        <path
          d={curvePoints}
          fill="none"
          stroke={MATH_COLORS.function}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}

      {/* 4. 模式 1：定义与焦半径 (definition) */}
      {studyMode === "definition" && !isDegenerate && (
        <g>
          {/* 焦半径 PF 连线 */}
          <line
            x1={mathToDesign(P.x, P.y, scale).x}
            y1={mathToDesign(P.x, P.y, scale).y}
            x2={focusPt.x}
            y2={focusPt.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
            strokeDasharray="4 2"
          />
          {/* 准线垂线 PH 连线 */}
          <line
            x1={mathToDesign(P.x, P.y, scale).x}
            y1={mathToDesign(P.x, P.y, scale).y}
            x2={mathToDesign(radiusInfo.H.x, radiusInfo.H.y, scale).x}
            y2={mathToDesign(radiusInfo.H.y, radiusInfo.H.y, scale).y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2}
            strokeDasharray="4 2"
          />
          {/* 垂足 H 点标记 */}
          <circle
            cx={mathToDesign(radiusInfo.H.x, radiusInfo.H.y, scale).x}
            cy={mathToDesign(radiusInfo.H.y, radiusInfo.H.y, scale).y}
            r={4}
            fill={MATH_COLORS.paramSecondary}
          />
          {/* 直角符号在 H 点 */}
          <rect
            x={mathToDesign(radiusInfo.H.x, radiusInfo.H.y, scale).x}
            y={mathToDesign(radiusInfo.H.y, radiusInfo.H.y, scale).y - 8}
            width={8}
            height={8}
            fill="none"
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1}
          />
        </g>
      )}

      {/* 5. 模式 2：焦点弦与相切圆 (focalChord) */}
      {studyMode === "focalChord" && !isDegenerate && (
        <g>
          {/* 焦点弦 AB 割线段 */}
          <line
            x1={mathToDesign(chordInfo.A.x, chordInfo.A.y, scale).x}
            y1={mathToDesign(chordInfo.A.x, chordInfo.A.y, scale).y}
            x2={mathToDesign(chordInfo.B.x, chordInfo.B.y, scale).x}
            y2={mathToDesign(chordInfo.B.x, chordInfo.B.y, scale).y}
            stroke={MATH_COLORS.vectorPrimary}
            strokeWidth={2.5}
          />

          {/* 以 AB 为直径的圆 */}
          <circle
            cx={
              mathToDesign(
                chordInfo.midCircle.center.x,
                chordInfo.midCircle.center.y,
                scale,
              ).x
            }
            cy={
              mathToDesign(
                chordInfo.midCircle.center.x,
                chordInfo.midCircle.center.y,
                scale,
              ).y
            }
            r={chordInfo.midCircle.radius * scale.scale}
            fill={withAlpha(MATH_COLORS.vectorPrimary, 0.06)}
            stroke={withAlpha(MATH_COLORS.vectorPrimary, 0.4)}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />

          {/* 端点 A, B 节点 */}
          <circle
            cx={mathToDesign(chordInfo.A.x, chordInfo.A.y, scale).x}
            cy={mathToDesign(chordInfo.A.x, chordInfo.A.y, scale).y}
            r={5}
            fill={MATH_COLORS.vectorPrimary}
          />
          <circle
            cx={mathToDesign(chordInfo.B.x, chordInfo.B.y, scale).x}
            cy={mathToDesign(chordInfo.B.x, chordInfo.B.y, scale).y}
            r={5}
            fill={MATH_COLORS.vectorPrimary}
          />
        </g>
      )}

      {/* 6. 模式 3：切线、反射光线与准线蒙日切线 (tangentOptical) */}
      {studyMode === "tangentOptical" && !isDegenerate && (
        <g>
          {/* 6A: 切线与反射光线 */}
          {/* 从 F 到 P 的入射光线 */}
          <VectorArrow
            from={[base.focus.x, base.focus.y]}
            to={[P.x, P.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2}
            fontScale={fontScale}
          />
          {/* 从 P 沿对称轴发出的反射光线 */}
          <VectorArrow
            from={[P.x, P.y]}
            to={[
              P.x + opticalInfo.reflectedDir.x * 4,
              P.y + opticalInfo.reflectedDir.y * 4,
            ]}
            scale={scale}
            color={MATH_COLORS.vectorResult}
            strokeWidth={2}
            fontScale={fontScale}
          />

          {/* P 点处的切线 */}
          <line
            x1={
              mathToDesign(
                opticalInfo.axisIntercept.x,
                opticalInfo.axisIntercept.y,
                scale,
              ).x
            }
            y1={
              mathToDesign(
                opticalInfo.axisIntercept.x,
                opticalInfo.axisIntercept.y,
                scale,
              ).y
            }
            x2={
              mathToDesign(
                P.x + (P.x - opticalInfo.axisIntercept.x),
                P.y + (P.y - opticalInfo.axisIntercept.y),
                scale,
              ).x
            }
            y2={
              mathToDesign(
                P.x + (P.x - opticalInfo.axisIntercept.x),
                P.y + (P.y - opticalInfo.axisIntercept.y),
                scale,
              ).y
            }
            stroke={MATH_COLORS.vectorResult}
            strokeWidth={2}
          />

          {/* 6B: 准线上点 Q 的双切线 QA, QB */}
          <line
            x1={mathToDesign(mongeInfo.Q.x, mongeInfo.Q.y, scale).x}
            y1={mathToDesign(mongeInfo.Q.x, mongeInfo.Q.y, scale).y}
            x2={mathToDesign(mongeInfo.A.x, mongeInfo.A.y, scale).x}
            y2={mathToDesign(mongeInfo.A.x, mongeInfo.A.y, scale).y}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1.8}
          />
          <line
            x1={mathToDesign(mongeInfo.Q.x, mongeInfo.Q.y, scale).x}
            y1={mathToDesign(mongeInfo.Q.x, mongeInfo.Q.y, scale).y}
            x2={mathToDesign(mongeInfo.B.x, mongeInfo.B.y, scale).x}
            y2={mathToDesign(mongeInfo.B.x, mongeInfo.B.y, scale).y}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1.8}
          />

          {/* 切点弦 AB 必过焦点 F 虚线 */}
          <line
            x1={mathToDesign(mongeInfo.A.x, mongeInfo.A.y, scale).x}
            y1={mathToDesign(mongeInfo.A.x, mongeInfo.A.y, scale).y}
            x2={mathToDesign(mongeInfo.B.x, mongeInfo.B.y, scale).x}
            y2={mathToDesign(mongeInfo.B.x, mongeInfo.B.y, scale).y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />

          {/* 准线上点 Q 的交互拖拽点 */}
          <InteractivePoint
            cx={mongeInfo.Q.x}
            cy={mongeInfo.Q.y}
            scale={scale}
            vp={vp}
            onDrag={handleQDrag}
            color={MATH_COLORS.paramTertiary}
            r={6}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* 7. 焦点 F 核心标注点 */}
      <circle
        cx={focusPt.x}
        cy={focusPt.y}
        r={6}
        fill={MATH_COLORS.focusPoint}
        stroke={MATH_COLORS.white}
        strokeWidth={2}
      />

      {/* 8. 抛物线上自由动点 P */}
      {!isDegenerate && (
        <InteractivePoint
          cx={P.x}
          cy={P.y}
          scale={scale}
          vp={vp}
          onDrag={handlePDrag}
          color={MATH_COLORS.vectorSecondary}
          r={6}
          fontScale={fontScale}
        />
      )}

      {/* 9. 避让后的文本标签 */}
      {labels.map((l: PlacedLabel) => (
        <text
          key={l.key}
          x={l.x}
          y={l.y + (l.finalDy ?? 0)}
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
