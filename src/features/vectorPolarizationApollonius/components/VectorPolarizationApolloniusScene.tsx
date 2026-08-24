/**
 * src/features/vectorPolarizationApollonius/components/VectorPolarizationApolloniusScene.tsx
 * 向量极化恒等式与阿波罗尼斯圆纯 SVG 画布场景渲染
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  InteractivePoint,
  VectorArrow,
  MathPoint,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { VectorPolarizationApolloniusParams } from "@/data/registries/vectorPolarizationApollonius";
import { useVectorPolarizationApolloniusScene } from "../hooks/useVectorPolarizationApolloniusScene";

interface VectorPolarizationApolloniusSceneProps {
  params: VectorPolarizationApolloniusParams;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode?: "polarization" | "apollonius" | "combined";
}

export const VectorPolarizationApolloniusScene: React.FC<
  VectorPolarizationApolloniusSceneProps
> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "polarization",
}) => {
  const {
    polarizationData,
    apolloniusData,
    combinedData,
    handlePointADrag,
    handlePointPDrag,
    designA,
    designB,
    designC,
    designM,
    designP,
    designCenterO,
    designD,
    designE,
    designMinP,
    designMaxP,
    designRadius,
  } = useVectorPolarizationApolloniusScene({
    params,
    scale,
    onParamChange,
    studyMode,
  });

  return (
    <g>
      {/* 1. 直角坐标系底图 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. 模式一：极化恒等式模式 (Polarization Identity) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {studyMode === "polarization" && (
        <g key="polarization-mode-graphics">
          {/* 中线 AM (鲜红高亮 - paramPrimary) */}
          <line
            x1={designA.x}
            y1={designA.y}
            x2={designM.x}
            y2={designM.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            strokeDasharray="4 3"
          />

          {/* 向量 AB */}
          <VectorArrow
            from={[polarizationData.pointA.x, polarizationData.pointA.y]}
            to={[polarizationData.pointB.x, polarizationData.pointB.y]}
            scale={scale}
            color={MATH_COLORS.vectorPrimary}
            strokeWidth={2.5}
            fontScale={fontScale}
          />
          {/* 向量 AC */}
          <VectorArrow
            from={[polarizationData.pointA.x, polarizationData.pointA.y]}
            to={[polarizationData.pointC.x, polarizationData.pointC.y]}
            scale={scale}
            color={MATH_COLORS.vectorSecondary}
            strokeWidth={2.5}
            fontScale={fontScale}
          />
          {/* 底边 BC */}
          <line
            x1={designB.x}
            y1={designB.y}
            x2={designC.x}
            y2={designC.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2}
          />

          {/* 定点 B */}
          <MathPoint
            x={designB.x}
            y={designB.y}
            variant="solid"
            color={MATH_COLORS.paramSecondary}
            r={3.8}
          />
          <text
            x={designB.x}
            y={designB.y + fontScale(16)}
            textAnchor="middle"
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(12)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
            className="select-none pointer-events-none"
          >
            B
          </text>

          {/* 定点 C */}
          <MathPoint
            x={designC.x}
            y={designC.y}
            variant="solid"
            color={MATH_COLORS.paramSecondary}
            r={3.8}
          />
          <text
            x={designC.x}
            y={designC.y + fontScale(16)}
            textAnchor="middle"
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(12)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
            className="select-none pointer-events-none"
          >
            C
          </text>

          {/* 中点 M */}
          <MathPoint
            x={designM.x}
            y={designM.y}
            variant="focus"
            color={MATH_COLORS.paramPrimary}
            r={3.8}
          />
          <text
            x={designM.x}
            y={designM.y + fontScale(16)}
            textAnchor="middle"
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(12)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
            className="select-none pointer-events-none"
          >
            M
          </text>

          {/* 动点 A (可拖拽) */}
          <InteractivePoint
            cx={polarizationData.pointA.x}
            cy={polarizationData.pointA.y}
            scale={scale}
            vp={vp}
            onDrag={(pt) => handlePointADrag(pt.x, pt.y)}
            color={MATH_COLORS.focusPoint}
            r={7}
            fontScale={fontScale}
          />
          <text
            x={designA.x}
            y={designA.y - fontScale(12)}
            textAnchor="middle"
            fill={MATH_COLORS.focusPoint}
            fontSize={fontScale(13)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
            className="select-none pointer-events-none"
          >
            A
          </text>

          {/* 极化恒等式几何注解: AM 长度 */}
          <text
            x={(designA.x + designM.x) / 2 + fontScale(8)}
            y={(designA.y + designM.y) / 2}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(11)}
            fontWeight="600"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
            className="select-none pointer-events-none"
          >
            |AM| = {polarizationData.lenAM.toFixed(2)}
          </text>
        </g>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. 模式二 & 三：阿波罗尼斯圆 & 极化恒等式综合 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {(studyMode === "apollonius" || studyMode === "combined") && (
        <g key="apollonius-mode-graphics">
          {/* 阿波罗尼斯圆轨迹 (或退化中垂线) */}
          {apolloniusData.isDegenerate ? (
            <line
              x1={designM.x}
              y1={mathToDesign(0, scale.yMax, scale).y}
              x2={designM.x}
              y2={mathToDesign(0, scale.yMin, scale).y}
              stroke={MATH_COLORS.degeneracy}
              strokeWidth={3}
              strokeDasharray="6 4"
            />
          ) : (
            <circle
              cx={designCenterO.x}
              cy={designCenterO.y}
              r={designRadius}
              fill={withAlpha(MATH_COLORS.function, 0.08)}
              stroke={MATH_COLORS.function}
              strokeWidth={2.5}
            />
          )}

          {/* 综合模式下: 高亮中线 PM 与向量 PA, PB */}
          {studyMode === "combined" && (
            <g>
              <line
                x1={designP.x}
                y1={designP.y}
                x2={designM.x}
                y2={designM.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={2.5}
                strokeDasharray="4 3"
              />
              <text
                x={(designP.x + designM.x) / 2 + fontScale(6)}
                y={(designP.y + designM.y) / 2}
                fill={MATH_COLORS.paramPrimary}
                fontSize={fontScale(11)}
                fontWeight="bold"
                paintOrder="stroke"
                stroke="white"
                strokeWidth={3}
                className="select-none pointer-events-none"
              >
                |PM| = {combinedData.lenPM.toFixed(2)}
              </text>

              {/* 最短距离点 P_min (内分点 D) 标注 */}
              <MathPoint
                x={designMinP.x}
                y={designMinP.y}
                variant="focus"
                color={MATH_COLORS.paramTertiary}
                r={4}
              />
              <text
                x={designMinP.x}
                y={designMinP.y + fontScale(16)}
                textAnchor="middle"
                fill={MATH_COLORS.paramTertiary}
                fontSize={fontScale(11)}
                fontWeight="bold"
                paintOrder="stroke"
                stroke="white"
                strokeWidth={3}
                className="select-none pointer-events-none"
              >
                P
                <tspan dy={fontScale(3)} fontSize={fontScale(8.5)}>
                  min
                </tspan>
                <tspan dy={-fontScale(3)}> </tspan>
              </text>

              {/* 最长距离点 P_max (外分点 E) 标注 */}
              {!apolloniusData.isDegenerate && (
                <g>
                  <MathPoint
                    x={designMaxP.x}
                    y={designMaxP.y}
                    variant="focus"
                    color={MATH_COLORS.degeneracy}
                    r={4}
                  />
                  <text
                    x={designMaxP.x}
                    y={designMaxP.y + fontScale(16)}
                    textAnchor="middle"
                    fill={MATH_COLORS.degeneracy}
                    fontSize={fontScale(11)}
                    fontWeight="bold"
                    paintOrder="stroke"
                    stroke="white"
                    strokeWidth={3}
                    className="select-none pointer-events-none"
                  >
                    P
                    <tspan dy={fontScale(3)} fontSize={fontScale(8.5)}>
                      max
                    </tspan>
                    <tspan dy={-fontScale(3)}> </tspan>
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 向量 PA 与 PB */}
          <VectorArrow
            from={[apolloniusData.pointP.x, apolloniusData.pointP.y]}
            to={[apolloniusData.pointA.x, apolloniusData.pointA.y]}
            scale={scale}
            color={MATH_COLORS.vectorPrimary}
            strokeWidth={2}
            fontScale={fontScale}
          />
          <VectorArrow
            from={[apolloniusData.pointP.x, apolloniusData.pointP.y]}
            to={[apolloniusData.pointB.x, apolloniusData.pointB.y]}
            scale={scale}
            color={MATH_COLORS.vectorSecondary}
            strokeWidth={2}
            fontScale={fontScale}
          />

          {/* 定点 A (-c, 0) */}
          <MathPoint
            x={designB.x}
            y={designB.y}
            variant="solid"
            color={MATH_COLORS.paramSecondary}
            r={3.8}
          />
          <text
            x={designB.x}
            y={designB.y + fontScale(16)}
            textAnchor="middle"
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(12)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
            className="select-none pointer-events-none"
          >
            A
          </text>

          {/* 定点 B (c, 0) */}
          <MathPoint
            x={designC.x}
            y={designC.y}
            variant="solid"
            color={MATH_COLORS.paramSecondary}
            r={3.8}
          />
          <text
            x={designC.x}
            y={designC.y + fontScale(16)}
            textAnchor="middle"
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(12)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
            className="select-none pointer-events-none"
          >
            B
          </text>

          {/* 中点 M (0,0) */}
          <MathPoint
            x={designM.x}
            y={designM.y}
            variant="focus"
            color={MATH_COLORS.paramPrimary}
            r={3.8}
          />
          <text
            x={designM.x}
            y={designM.y + fontScale(16)}
            textAnchor="middle"
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(12)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
            className="select-none pointer-events-none"
          >
            M
          </text>

          {/* 圆心 O_A */}
          {!apolloniusData.isDegenerate && (
            <g>
              <MathPoint
                x={designCenterO.x}
                y={designCenterO.y}
                variant="solid"
                color={MATH_COLORS.function}
                r={3.5}
              />
              <text
                x={designCenterO.x}
                y={designCenterO.y - fontScale(10)}
                textAnchor="middle"
                fill={MATH_COLORS.function}
                fontSize={fontScale(11)}
                fontWeight="bold"
                paintOrder="stroke"
                stroke="white"
                strokeWidth={3}
                className="select-none pointer-events-none"
              >
                O
                <tspan dy={fontScale(2.5)} fontSize={fontScale(8.5)}>
                  A
                </tspan>
                <tspan dy={-fontScale(2.5)}> </tspan>
              </text>
            </g>
          )}

          {/* 内分点 D & 外分点 E */}
          {!apolloniusData.isDegenerate && studyMode === "apollonius" && (
            <g>
              <MathPoint
                x={designD.x}
                y={designD.y}
                variant="solid"
                color={MATH_COLORS.paramPrimary}
                r={3.5}
              />
              <text
                x={designD.x}
                y={designD.y + fontScale(15)}
                textAnchor="middle"
                fill={MATH_COLORS.paramPrimary}
                fontSize={fontScale(11)}
                fontWeight="bold"
                paintOrder="stroke"
                stroke="white"
                strokeWidth={3}
                className="select-none pointer-events-none"
              >
                D
              </text>

              <MathPoint
                x={designE.x}
                y={designE.y}
                variant="solid"
                color={MATH_COLORS.paramPrimary}
                r={3.5}
              />
              <text
                x={designE.x}
                y={designE.y + fontScale(15)}
                textAnchor="middle"
                fill={MATH_COLORS.paramPrimary}
                fontSize={fontScale(11)}
                fontWeight="bold"
                paintOrder="stroke"
                stroke="white"
                strokeWidth={3}
                className="select-none pointer-events-none"
              >
                E
              </text>
            </g>
          )}

          {/* 动点 P (可沿阿圆轨道拖拽) */}
          <InteractivePoint
            cx={apolloniusData.pointP.x}
            cy={apolloniusData.pointP.y}
            scale={scale}
            vp={vp}
            onDrag={(pt) => handlePointPDrag(pt.x, pt.y)}
            color={MATH_COLORS.focusPoint}
            r={7}
            fontScale={fontScale}
          />
          <text
            x={designP.x}
            y={designP.y - fontScale(12)}
            textAnchor="middle"
            fill={MATH_COLORS.focusPoint}
            fontSize={fontScale(13)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
            className="select-none pointer-events-none"
          >
            P
          </text>
        </g>
      )}
    </g>
  );
};
