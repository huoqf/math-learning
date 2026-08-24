/**
 * src/features/parabola/components/ParabolaScene.tsx
 * 抛物线焦点性质与准线几何 SVG 场景渲染
 * 严格按照 2D 场景铁律开发，纯数学点使用 MathPoint，直角标尺防畸变矢量化，字号受控于 fontScale
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  InteractivePoint,
  MathPoint,
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
  onInteractionStart?: () => void;
  fontScale?: (v: number) => number;
  direction?: ParabolaDirection;
  studyMode?: "definition" | "focalChord" | "tangentOptical";
}

/**
 * 辅助函数：根据直角顶点和两个方向单位向量生成像素级直角折线路径（防畸变固定 9px）
 */
function getRightAnglePath(
  vertex: { x: number; y: number },
  dirA: { x: number; y: number },
  dirB: { x: number; y: number },
  size = 9,
): string {
  const lenA = Math.hypot(dirA.x, dirA.y) || 1;
  const lenB = Math.hypot(dirB.x, dirB.y) || 1;
  const uA = { x: (dirA.x / lenA) * size, y: (dirA.y / lenA) * size };
  const uB = { x: (dirB.x / lenB) * size, y: (dirB.y / lenB) * size };

  const p1 = { x: vertex.x + uA.x, y: vertex.y + uA.y };
  const p2 = { x: vertex.x + uA.x + uB.x, y: vertex.y + uA.y + uB.y };
  const p3 = { x: vertex.x + uB.x, y: vertex.y + uB.y };

  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`;
}

export const ParabolaScene: React.FC<ParabolaSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  onInteractionStart,
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
    onInteractionStart,
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
            y2={mathToDesign(radiusInfo.H.x, radiusInfo.H.y, scale).y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2}
            strokeDasharray="4 2"
          />
          {/* 垂足 H 纯数学点 */}
          <MathPoint
            cx={radiusInfo.H.x}
            cy={radiusInfo.H.y}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            r={3.8}
            fontScale={fontScale}
          />
          {/* H 点处直角折线标尺 */}
          {(() => {
            const hPt = mathToDesign(radiusInfo.H.x, radiusInfo.H.y, scale);
            const pPt = mathToDesign(P.x, P.y, scale);
            const dirHToP = { x: pPt.x - hPt.x, y: pPt.y - hPt.y };
            // 准线切向
            const dirTangent = base.directrixIsVertical
              ? { x: 0, y: -1 }
              : { x: 1, y: 0 };
            return (
              <path
                d={getRightAnglePath(hPt, dirHToP, dirTangent, 9)}
                fill="none"
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={1.2}
              />
            );
          })()}
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
            fill={withAlpha(MATH_COLORS.vectorPrimary, 0.05)}
            stroke={withAlpha(MATH_COLORS.vectorPrimary, 0.45)}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />

          {/* 中点 M 到准线切点 K 的公垂线段 MK */}
          <line
            x1={
              mathToDesign(
                chordInfo.midCircle.center.x,
                chordInfo.midCircle.center.y,
                scale,
              ).x
            }
            y1={
              mathToDesign(
                chordInfo.midCircle.center.x,
                chordInfo.midCircle.center.y,
                scale,
              ).y
            }
            x2={
              mathToDesign(
                chordInfo.midCircle.directrixTangentPoint.x,
                chordInfo.midCircle.directrixTangentPoint.y,
                scale,
              ).x
            }
            y2={
              mathToDesign(
                chordInfo.midCircle.directrixTangentPoint.x,
                chordInfo.midCircle.directrixTangentPoint.y,
                scale,
              ).y
            }
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.8}
            strokeDasharray="3 3"
          />

          {/* 准线切点 K 处的直角标尺 */}
          {(() => {
            const kPt = mathToDesign(
              chordInfo.midCircle.directrixTangentPoint.x,
              chordInfo.midCircle.directrixTangentPoint.y,
              scale,
            );
            const mPt = mathToDesign(
              chordInfo.midCircle.center.x,
              chordInfo.midCircle.center.y,
              scale,
            );
            const dirKToM = { x: mPt.x - kPt.x, y: mPt.y - kPt.y };
            const dirTangent = base.directrixIsVertical
              ? { x: 0, y: -1 }
              : { x: 1, y: 0 };
            return (
              <path
                d={getRightAnglePath(kPt, dirKToM, dirTangent, 9)}
                fill="none"
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={1.2}
              />
            );
          })()}

          {/* 端点 A, B 与中点 M、切点 K 纯数学点 */}
          <MathPoint
            cx={chordInfo.A.x}
            cy={chordInfo.A.y}
            scale={scale}
            color={MATH_COLORS.vectorPrimary}
            r={3.8}
            fontScale={fontScale}
          />
          <MathPoint
            cx={chordInfo.B.x}
            cy={chordInfo.B.y}
            scale={scale}
            color={MATH_COLORS.vectorPrimary}
            r={3.8}
            fontScale={fontScale}
          />
          <MathPoint
            cx={chordInfo.midCircle.center.x}
            cy={chordInfo.midCircle.center.y}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            r={3.5}
            fontScale={fontScale}
          />
          <MathPoint
            cx={chordInfo.midCircle.directrixTangentPoint.x}
            cy={chordInfo.midCircle.directrixTangentPoint.y}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            r={3.5}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* 6. 模式 3：切线、反射光线与准线阿基米德切线 (tangentOptical) */}
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

          {/* P 点处的单点切线 */}
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
            strokeWidth={1.8}
          />

          {/* 6B: 阿基米德三角形与准线上点 Q 的双切线 QA, QB */}
          {/* 阿基米德三角形 QAB 半透明浅底 */}
          <polygon
            points={`${mathToDesign(mongeInfo.Q.x, mongeInfo.Q.y, scale).x},${
              mathToDesign(mongeInfo.Q.x, mongeInfo.Q.y, scale).y
            } ${mathToDesign(mongeInfo.A.x, mongeInfo.A.y, scale).x},${
              mathToDesign(mongeInfo.A.x, mongeInfo.A.y, scale).y
            } ${mathToDesign(mongeInfo.B.x, mongeInfo.B.y, scale).x},${
              mathToDesign(mongeInfo.B.x, mongeInfo.B.y, scale).y
            }`}
            fill={withAlpha(MATH_COLORS.paramTertiary, 0.07)}
          />

          {/* 切线 QA */}
          <line
            x1={mathToDesign(mongeInfo.Q.x, mongeInfo.Q.y, scale).x}
            y1={mathToDesign(mongeInfo.Q.x, mongeInfo.Q.y, scale).y}
            x2={mathToDesign(mongeInfo.A.x, mongeInfo.A.y, scale).x}
            y2={mathToDesign(mongeInfo.A.x, mongeInfo.A.y, scale).y}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={2}
          />
          {/* 切线 QB */}
          <line
            x1={mathToDesign(mongeInfo.Q.x, mongeInfo.Q.y, scale).x}
            y1={mathToDesign(mongeInfo.Q.x, mongeInfo.Q.y, scale).y}
            x2={mathToDesign(mongeInfo.B.x, mongeInfo.B.y, scale).x}
            y2={mathToDesign(mongeInfo.B.x, mongeInfo.B.y, scale).y}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={2}
          />

          {/* 切点弦 AB 必过焦点 F 虚线 */}
          <line
            x1={mathToDesign(mongeInfo.A.x, mongeInfo.A.y, scale).x}
            y1={mathToDesign(mongeInfo.A.x, mongeInfo.A.y, scale).y}
            x2={mathToDesign(mongeInfo.B.x, mongeInfo.B.y, scale).x}
            y2={mathToDesign(mongeInfo.B.x, mongeInfo.B.y, scale).y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.8}
            strokeDasharray="4 2"
          />

          {/* 辅助线 QF 连线 */}
          <line
            x1={mathToDesign(mongeInfo.Q.x, mongeInfo.Q.y, scale).x}
            y1={mathToDesign(mongeInfo.Q.x, mongeInfo.Q.y, scale).y}
            x2={focusPt.x}
            y2={focusPt.y}
            stroke={MATH_COLORS.focusPoint}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />

          {/* Q 点处的直角折线标尺 (QA ⊥ QB) */}
          {(() => {
            const qPt = mathToDesign(mongeInfo.Q.x, mongeInfo.Q.y, scale);
            const aPt = mathToDesign(mongeInfo.A.x, mongeInfo.A.y, scale);
            const bPt = mathToDesign(mongeInfo.B.x, mongeInfo.B.y, scale);
            const dirQA = { x: aPt.x - qPt.x, y: aPt.y - qPt.y };
            const dirQB = { x: bPt.x - qPt.x, y: bPt.y - qPt.y };
            return (
              <path
                d={getRightAnglePath(qPt, dirQA, dirQB, 10)}
                fill="none"
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={1.3}
              />
            );
          })()}

          {/* F 点处的直角折线标尺 (QF ⊥ AB) */}
          {(() => {
            const qPt = mathToDesign(mongeInfo.Q.x, mongeInfo.Q.y, scale);
            const aPt = mathToDesign(mongeInfo.A.x, mongeInfo.A.y, scale);
            const dirFQ = { x: qPt.x - focusPt.x, y: qPt.y - focusPt.y };
            const dirFA = { x: aPt.x - focusPt.x, y: aPt.y - focusPt.y };
            return (
              <path
                d={getRightAnglePath(focusPt, dirFQ, dirFA, 9)}
                fill="none"
                stroke={MATH_COLORS.focusPoint}
                strokeWidth={1.2}
              />
            );
          })()}

          {/* 切点 A, B 纯数学点 */}
          <MathPoint
            cx={mongeInfo.A.x}
            cy={mongeInfo.A.y}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            r={3.8}
            fontScale={fontScale}
          />
          <MathPoint
            cx={mongeInfo.B.x}
            cy={mongeInfo.B.y}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            r={3.8}
            fontScale={fontScale}
          />

          {/* 准线上点 Q 的交互拖拽点 */}
          <InteractivePoint
            cx={mongeInfo.Q.x}
            cy={mongeInfo.Q.y}
            scale={scale}
            vp={vp}
            onDrag={handleQDrag}
            color={MATH_COLORS.paramTertiary}
            r={5.5}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* 7. 焦点 F 核心数学点 */}
      <MathPoint
        cx={base.focus.x}
        cy={base.focus.y}
        scale={scale}
        color={MATH_COLORS.focusPoint}
        r={4.2}
        fontScale={fontScale}
      />

      {/* 8. 抛物线上自由动点 P (模式 1 与模式 3 均可拖拽) */}
      {!isDegenerate && studyMode !== "focalChord" && (
        <InteractivePoint
          cx={P.x}
          cy={P.y}
          scale={scale}
          vp={vp}
          onDrag={handlePDrag}
          color={MATH_COLORS.vectorSecondary}
          r={5.5}
          fontScale={fontScale}
        />
      )}

      {/* 9. 避让后的单字母文本标签（带纯白微描边，防断线重影） */}
      {labels.map((l: PlacedLabel) => (
        <text
          key={l.key}
          x={l.x}
          y={l.y + (l.finalDy ?? 0)}
          textAnchor={l.anchor}
          fill={MATH_COLORS.labelText}
          stroke="#FFFFFF"
          strokeWidth={3}
          paintOrder="stroke fill"
          fontSize={fontScale(12)}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          className="select-none pointer-events-none"
        >
          {l.text}
        </text>
      ))}
    </g>
  );
};
