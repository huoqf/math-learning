import React from "react";
import { CoordinateGrid, InteractivePoint, MathPoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import type { TriangleExtremaState, Point2D } from "@/math/triangleExtrema";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";

interface TriangleExtremaSceneProps {
  state: TriangleExtremaState;
  studyMode: "angle-transform" | "side-ineq" | "apollonius" | "polarization";
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  isAcuteOnly?: boolean;
  onDragVertexA?: (pt: Point2D) => void;
  onDragVertexB?: (pt: Point2D) => void;
}

export const TriangleExtremaScene: React.FC<TriangleExtremaSceneProps> = ({
  state,
  studyMode,
  scale,
  vp,
  fontScale,
  isAcuteOnly = false,
  onDragVertexA,
  onDragVertexB,
}) => {
  const {
    vertices,
    circumcircle,
    inscribed,
    apolloniusCircle,
    polarization,
    acuteRange,
    isValid,
    warning,
  } = state;

  if (!isValid) {
    const defaultCenter = mathToDesign(0, 0, scale);
    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />
        <text
          x={defaultCenter.x}
          y={defaultCenter.y - 20}
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(16)}
          fontWeight="bold"
          textAnchor="middle"
        >
          ⚠️ {warning ?? "图形退化，无法构成有效三角形"}
        </text>
      </g>
    );
  }

  // 坐标投射
  const posA = mathToDesign(vertices.A.x, vertices.A.y, scale);
  const posB = mathToDesign(vertices.B.x, vertices.B.y, scale);
  const posC = mathToDesign(vertices.C.x, vertices.C.y, scale);
  const posM = mathToDesign(0, 0, scale); // 底边中点

  // 外接圆投射
  const posCircumCenter = mathToDesign(
    circumcircle.center.x,
    circumcircle.center.y,
    scale,
  );
  const radiusPx = circumcircle.radius * scale.scaleX;

  // 阿波罗尼斯圆投射（如有）
  const apCenter = apolloniusCircle
    ? mathToDesign(apolloniusCircle.center.x, apolloniusCircle.center.y, scale)
    : null;
  const apRadiusPx = apolloniusCircle
    ? apolloniusCircle.radius * scale.scaleX
    : 0;

  // 顶点 A 在底边上的垂足 H
  const posH = mathToDesign(vertices.A.x, 0, scale);

  // 外接圆最高点（等腰三角形顶点）
  const maxVertexA = {
    x: 0,
    y: circumcircle.center.y + circumcircle.radius,
  };
  const posMaxA = mathToDesign(maxVertexA.x, maxVertexA.y, scale);

  return (
    <g className="triangle-extrema-scene">
      {/* 1. 纯净坐标系网格与轴 (showGrid: false 杜绝地砖网格) */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* 2. 轨迹背景图层 */}
      {/* A. 外接圆 (angle-transform 与 side-ineq 模式) */}
      {(studyMode === "angle-transform" || studyMode === "side-ineq") && (
        <g id="circumcircle-layer">
          {/* 外接圆底圆 */}
          <circle
            cx={posCircumCenter.x}
            cy={posCircumCenter.y}
            r={radiusPx}
            fill={withAlpha(MATH_COLORS.circle, 0.04)}
            stroke={MATH_COLORS.circle}
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          {/* 圆心标记 */}
          <MathPoint
            x={posCircumCenter.x}
            y={posCircumCenter.y}
            color={MATH_COLORS.circle}
          />
          <text
            x={posCircumCenter.x + fontScale(8)}
            y={posCircumCenter.y - fontScale(6)}
            fill={MATH_COLORS.circle}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fontStyle="italic"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={fontScale(3.5)}
            strokeLinejoin="round"
          >
            O
          </text>

          {/* 最高点极值包络线 (水平切线) */}
          <line
            x1={posCircumCenter.x - radiusPx - 20}
            y1={posMaxA.y}
            x2={posCircumCenter.x + radiusPx + 20}
            y2={posMaxA.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeDasharray="4 4"
            strokeWidth={1.2}
            opacity={0.7}
          />
          {/* 等腰对称轴虚线 */}
          <line
            x1={posMaxA.x}
            y1={posMaxA.y}
            x2={posM.x}
            y2={posM.y}
            stroke={CANVAS_COLORS.axis}
            strokeDasharray="3 3"
            strokeWidth={1.2}
          />
          <text
            x={posMaxA.x + fontScale(8)}
            y={posMaxA.y - fontScale(6)}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fontStyle="italic"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={fontScale(3.5)}
            strokeLinejoin="round"
          >
            hₘₐₓ
          </text>
        </g>
      )}

      {/* B. 阿波罗尼斯圆 (apollonius 模式) */}
      {studyMode === "apollonius" && apCenter && apolloniusCircle && (
        <g id="apollonius-circle-layer">
          <circle
            cx={apCenter.x}
            cy={apCenter.y}
            r={apRadiusPx}
            fill={withAlpha(MATH_COLORS.circle, 0.05)}
            stroke={MATH_COLORS.circle}
            strokeDasharray="5 4"
            strokeWidth={1.8}
          />
          <MathPoint x={apCenter.x} y={apCenter.y} color={MATH_COLORS.circle} />
          <text
            x={apCenter.x + fontScale(8)}
            y={apCenter.y - fontScale(6)}
            fill={MATH_COLORS.circle}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fontStyle="italic"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={fontScale(3.5)}
            strokeLinejoin="round"
          >
            O_A
          </text>
          {/* 最高点指示虚线 */}
          <line
            x1={apCenter.x}
            y1={apCenter.y}
            x2={apCenter.x}
            y2={apCenter.y - apRadiusPx}
            stroke={MATH_COLORS.tangentLine}
            strokeDasharray="3 3"
          />
          <text
            x={apCenter.x + fontScale(8)}
            y={apCenter.y - apRadiusPx - fontScale(6)}
            fill={MATH_COLORS.tangentLine}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fontStyle="italic"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={fontScale(3.5)}
            strokeLinejoin="round"
          >
            hₘₐₓ = R_A
          </text>
        </g>
      )}

      {/* C. 极化恒等式中线圆轨迹 (polarization 模式) */}
      {studyMode === "polarization" && polarization && (
        <g id="polarization-circle-layer">
          <circle
            cx={posM.x}
            cy={posM.y}
            r={polarization.medianLength * scale.scaleX}
            fill={withAlpha(MATH_COLORS.complexNum, 0.05)}
            stroke={MATH_COLORS.complexNum}
            strokeDasharray="4 4"
            strokeWidth={1.8}
          />
        </g>
      )}

      {/* 3. 几何辅助线 */}
      {/* 垂线 AH */}
      <line
        x1={posA.x}
        y1={posA.y}
        x2={posH.x}
        y2={posH.y}
        stroke={MATH_COLORS.tangentLine}
        strokeDasharray="3 3"
        strokeWidth={1.5}
      />
      {/* 垂足直角标尺 ∟ (固定 8px) */}
      {(() => {
        const markSize = fontScale(8);
        return (
          <path
            d={`M ${posH.x - markSize} ${posH.y} L ${posH.x - markSize} ${posH.y - markSize} L ${posH.x} ${posH.y - markSize}`}
            fill="none"
            stroke={MATH_COLORS.tangentLine}
            strokeWidth={1.5}
          />
        );
      })()}
      <MathPoint x={posH.x} y={posH.y} color={MATH_COLORS.tangentLine} />
      <text
        x={posH.x + fontScale(6)}
        y={posH.y - fontScale(6)}
        fill={MATH_COLORS.tangentLine}
        fontSize={fontScale(11)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(3.5)}
        strokeLinejoin="round"
      >
        H
      </text>
      <text
        x={posH.x - fontScale(8)}
        y={(posA.y + posH.y) / 2}
        textAnchor="end"
        fill={MATH_COLORS.tangentLine}
        fontSize={fontScale(11)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(3.5)}
        strokeLinejoin="round"
      >
        hₐ
      </text>

      {/* 中线 AM */}
      {(studyMode === "polarization" || studyMode === "apollonius") && (
        <g>
          <line
            x1={posA.x}
            y1={posA.y}
            x2={posM.x}
            y2={posM.y}
            stroke={MATH_COLORS.complexNum}
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          <MathPoint x={posM.x} y={posM.y} color={MATH_COLORS.complexNum} />
          <text
            x={posM.x}
            y={posM.y + fontScale(16)}
            fill={MATH_COLORS.complexNum}
            fontSize={fontScale(12)}
            textAnchor="middle"
            fontWeight="bold"
            fontStyle="italic"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={fontScale(3.5)}
            strokeLinejoin="round"
          >
            M
          </text>
          <text
            x={(posA.x + posM.x) / 2 - fontScale(10)}
            y={(posA.y + posM.y) / 2}
            textAnchor="end"
            fill={MATH_COLORS.complexNum}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fontStyle="italic"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={fontScale(3.5)}
            strokeLinejoin="round"
          >
            mₐ
          </text>
        </g>
      )}

      {/* 内切圆 (当角化边/均值模式有效时) */}
      {inscribed &&
        (studyMode === "angle-transform" || studyMode === "side-ineq") && (
          <g id="inscribed-circle-layer">
            {/* 锐角三角形约束提示 */}
            {isAcuteOnly && acuteRange && !state.isAcute && (
              <text
                x={posMaxA.x}
                y={posMaxA.y - fontScale(18)}
                fill={MATH_COLORS.paramPrimary}
                fontSize={fontScale(12)}
                fontWeight="bold"
                textAnchor="middle"
                paintOrder="stroke"
                stroke="white"
                strokeWidth={fontScale(4)}
              >
                ⚠️ 非锐角状态 (角 B ∈ ({acuteRange.minAngleB.toFixed(0)}°,{" "}
                {acuteRange.maxAngleB.toFixed(0)}°))
              </text>
            )}

            {(() => {
              const posIncenter = mathToDesign(
                inscribed.incenter.x,
                inscribed.incenter.y,
                scale,
              );
              const inradiusPx = inscribed.inradius * scale.scaleX;
              return (
                <>
                  <circle
                    cx={posIncenter.x}
                    cy={posIncenter.y}
                    r={inradiusPx}
                    fill={withAlpha(MATH_COLORS.complexNum, 0.08)}
                    stroke={MATH_COLORS.complexNum}
                    strokeWidth={1.5}
                  />
                  <MathPoint
                    x={posIncenter.x}
                    y={posIncenter.y}
                    color={MATH_COLORS.complexNum}
                  />
                  <text
                    x={posIncenter.x + fontScale(6)}
                    y={posIncenter.y - fontScale(4)}
                    fill={MATH_COLORS.complexNum}
                    fontSize={fontScale(11)}
                    fontWeight="bold"
                    fontStyle="italic"
                    paintOrder="stroke"
                    stroke="white"
                    strokeWidth={fontScale(3.5)}
                    strokeLinejoin="round"
                  >
                    I
                  </text>
                </>
              );
            })()}
          </g>
        )}

      {/* 4. 三角形主体边与阴影填充 */}
      <polygon
        points={`${posA.x},${posA.y} ${posB.x},${posB.y} ${posC.x},${posC.y}`}
        fill={withAlpha(MATH_COLORS.function, 0.08)}
        stroke="none"
      />

      {/* 顶点 A 角弧 */}
      {(() => {
        const arcR = fontScale(22);
        const dirAB = { x: posB.x - posA.x, y: posB.y - posA.y };
        const dirAC = { x: posC.x - posA.x, y: posC.y - posA.y };
        const angAB = Math.atan2(dirAB.y, dirAB.x);
        const angAC = Math.atan2(dirAC.y, dirAC.x);

        const startX = posA.x + arcR * Math.cos(angAB);
        const startY = posA.y + arcR * Math.sin(angAB);
        const endX = posA.x + arcR * Math.cos(angAC);
        const endY = posA.y + arcR * Math.sin(angAC);

        return (
          <path
            d={`M ${startX} ${startY} A ${arcR} ${arcR} 0 0 ${angAC > angAB ? 1 : 0} ${endX} ${endY}`}
            fill="none"
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.8}
          />
        );
      })()}

      {/* 边 a (BC) - 底边: paramPrimary (红) */}
      <line
        x1={posB.x}
        y1={posB.y}
        x2={posC.x}
        y2={posC.y}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={3}
      />

      {/* 边 b (AC) - paramSecondary (橙) */}
      <line
        x1={posA.x}
        y1={posA.y}
        x2={posC.x}
        y2={posC.y}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={3}
      />

      {/* 边 c (AB) - paramTertiary (绿) */}
      <line
        x1={posA.x}
        y1={posA.y}
        x2={posB.x}
        y2={posB.y}
        stroke={MATH_COLORS.paramTertiary}
        strokeWidth={3}
      />

      {/* 5. 边长标签 (纯学术符号 a, b, c，数值归位右屏看板) */}
      <text
        x={
          (posB.x + posC.x) / 2 +
          (studyMode === "polarization" || studyMode === "apollonius" ? 22 : 0)
        }
        y={posB.y + fontScale(16)}
        fill={MATH_COLORS.paramPrimary}
        fontSize={fontScale(14)}
        fontWeight="bold"
        fontStyle="italic"
        textAnchor="middle"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(4)}
        strokeLinejoin="round"
      >
        a
      </text>
      <text
        x={(posA.x + posC.x) / 2 + fontScale(12)}
        y={(posA.y + posC.y) / 2}
        fill={MATH_COLORS.paramSecondary}
        fontSize={fontScale(14)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(4)}
        strokeLinejoin="round"
      >
        b
      </text>
      <text
        x={(posA.x + posB.x) / 2 - fontScale(14)}
        y={(posA.y + posB.y) / 2}
        textAnchor="end"
        fill={MATH_COLORS.paramTertiary}
        fontSize={fontScale(14)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(4)}
        strokeLinejoin="round"
      >
        c
      </text>

      {/* 6. 顶点交互与标注 (纯字母微描边无重影) */}
      {/* 顶点 C: 固定点 */}
      <MathPoint x={posC.x} y={posC.y} color={MATH_COLORS.paramPrimary} />
      <text
        x={posC.x + fontScale(8)}
        y={posC.y + fontScale(6)}
        fill={MATH_COLORS.paramPrimary}
        fontSize={fontScale(14)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(4)}
        strokeLinejoin="round"
      >
        C
      </text>

      {/* 顶点 B: 静态或支持拖拽 */}
      {studyMode === "angle-transform" ? (
        <InteractivePoint
          cx={vertices.B.x}
          cy={vertices.B.y}
          scale={scale}
          vp={vp}
          fontScale={fontScale}
          color={MATH_COLORS.paramSecondary}
          onDrag={(mathPos) => {
            if (onDragVertexB) {
              onDragVertexB(mathPos);
            }
          }}
        />
      ) : (
        <MathPoint x={posB.x} y={posB.y} color={MATH_COLORS.paramSecondary} />
      )}
      <text
        x={posB.x - fontScale(10)}
        y={posB.y + fontScale(6)}
        textAnchor="end"
        fill={MATH_COLORS.paramSecondary}
        fontSize={fontScale(14)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(4)}
        strokeLinejoin="round"
      >
        B
      </text>

      {/* 顶点 A: 交互控制点 */}
      <InteractivePoint
        cx={vertices.A.x}
        cy={vertices.A.y}
        scale={scale}
        vp={vp}
        fontScale={fontScale}
        color={MATH_COLORS.paramPrimary}
        onDrag={(mathPos) => {
          if (onDragVertexA) {
            onDragVertexA(mathPos);
          }
        }}
      />
      <text
        x={posA.x}
        y={posA.y - fontScale(12)}
        textAnchor="middle"
        fill={MATH_COLORS.paramPrimary}
        fontSize={fontScale(14)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(4)}
        strokeLinejoin="round"
      >
        A
      </text>
    </g>
  );
};
