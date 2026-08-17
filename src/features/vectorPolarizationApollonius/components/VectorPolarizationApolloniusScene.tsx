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
          <circle
            cx={designB.x}
            cy={designB.y}
            r={5}
            fill={MATH_COLORS.paramSecondary}
            stroke={MATH_COLORS.white}
            strokeWidth={1.5}
          />
          <text
            x={designB.x}
            y={designB.y + fontScale(18)}
            textAnchor="middle"
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(12)}
            fontWeight="bold"
            className="select-none pointer-events-none"
          >
            B({polarizationData.pointB.x.toFixed(1)}, 0)
          </text>

          {/* 定点 C */}
          <circle
            cx={designC.x}
            cy={designC.y}
            r={5}
            fill={MATH_COLORS.paramSecondary}
            stroke={MATH_COLORS.white}
            strokeWidth={1.5}
          />
          <text
            x={designC.x}
            y={designC.y + fontScale(18)}
            textAnchor="middle"
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(12)}
            fontWeight="bold"
            className="select-none pointer-events-none"
          >
            C({polarizationData.pointC.x.toFixed(1)}, 0)
          </text>

          {/* 中点 M */}
          <circle
            cx={designM.x}
            cy={designM.y}
            r={4.5}
            fill={MATH_COLORS.paramPrimary}
            stroke={MATH_COLORS.white}
            strokeWidth={1.5}
          />
          <text
            x={designM.x}
            y={designM.y + fontScale(16)}
            textAnchor="middle"
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(11)}
            fontWeight="bold"
            className="select-none pointer-events-none"
          >
            M(0,0) [中点]
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
            fontSize={fontScale(12)}
            fontWeight="bold"
            className="select-none pointer-events-none"
          >
            A({polarizationData.pointA.x.toFixed(1)},{" "}
            {polarizationData.pointA.y.toFixed(1)})
          </text>

          {/* 极化恒等式几何注解: AM 长度 */}
          <text
            x={(designA.x + designM.x) / 2 + fontScale(8)}
            y={(designA.y + designM.y) / 2}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(11)}
            fontWeight="600"
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
                className="select-none pointer-events-none"
              >
                |PM| = {combinedData.lenPM.toFixed(2)}
              </text>

              {/* 最短距离点 P_min (内分点 D) 标注 */}
              <circle
                cx={designMinP.x}
                cy={designMinP.y}
                r={5.5}
                fill={MATH_COLORS.paramTertiary}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
              <text
                x={designMinP.x}
                y={designMinP.y + fontScale(16)}
                textAnchor="middle"
                fill={MATH_COLORS.paramTertiary}
                fontSize={fontScale(10)}
                fontWeight="bold"
                className="select-none pointer-events-none"
              >
                Pₘᵢₙ
              </text>

              {/* 最长距离点 P_max (外分点 E) 标注 */}
              {!apolloniusData.isDegenerate && (
                <g>
                  <circle
                    cx={designMaxP.x}
                    cy={designMaxP.y}
                    r={5.5}
                    fill={MATH_COLORS.degeneracy}
                    stroke={MATH_COLORS.white}
                    strokeWidth={1.5}
                  />
                  <text
                    x={designMaxP.x}
                    y={designMaxP.y + fontScale(16)}
                    textAnchor="middle"
                    fill={MATH_COLORS.degeneracy}
                    fontSize={fontScale(10)}
                    fontWeight="bold"
                    className="select-none pointer-events-none"
                  >
                    Pₘₐₓ
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
          <circle
            cx={designB.x}
            cy={designB.y}
            r={5}
            fill={MATH_COLORS.paramSecondary}
            stroke={MATH_COLORS.white}
            strokeWidth={1.5}
          />
          <text
            x={designB.x}
            y={designB.y + fontScale(18)}
            textAnchor="middle"
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(11)}
            fontWeight="bold"
            className="select-none pointer-events-none"
          >
            A({apolloniusData.pointA.x.toFixed(1)}, 0)
          </text>

          {/* 定点 B (c, 0) */}
          <circle
            cx={designC.x}
            cy={designC.y}
            r={5}
            fill={MATH_COLORS.paramSecondary}
            stroke={MATH_COLORS.white}
            strokeWidth={1.5}
          />
          <text
            x={designC.x}
            y={designC.y + fontScale(18)}
            textAnchor="middle"
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(11)}
            fontWeight="bold"
            className="select-none pointer-events-none"
          >
            B({apolloniusData.pointB.x.toFixed(1)}, 0)
          </text>

          {/* 中点 M (0,0) */}
          <circle
            cx={designM.x}
            cy={designM.y}
            r={4}
            fill={MATH_COLORS.paramPrimary}
            stroke={MATH_COLORS.white}
            strokeWidth={1.5}
          />

          {/* 圆心 O_A */}
          {!apolloniusData.isDegenerate && (
            <g>
              <circle
                cx={designCenterO.x}
                cy={designCenterO.y}
                r={4}
                fill={MATH_COLORS.function}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
              <text
                x={designCenterO.x}
                y={designCenterO.y - fontScale(10)}
                textAnchor="middle"
                fill={MATH_COLORS.function}
                fontSize={fontScale(10)}
                fontWeight="bold"
                className="select-none pointer-events-none"
              >
                O_A({apolloniusData.centerO.x.toFixed(1)}, 0)
              </text>
            </g>
          )}

          {/* 内分点 D & 外分点 E */}
          {!apolloniusData.isDegenerate && studyMode === "apollonius" && (
            <g>
              <circle
                cx={designD.x}
                cy={designD.y}
                r={4}
                fill={MATH_COLORS.paramPrimary}
              />
              <text
                x={designD.x}
                y={designD.y + fontScale(14)}
                textAnchor="middle"
                fill={MATH_COLORS.paramPrimary}
                fontSize={fontScale(10)}
                className="select-none pointer-events-none"
              >
                D({apolloniusData.pointD.x.toFixed(1)},0)
              </text>

              <circle
                cx={designE.x}
                cy={designE.y}
                r={4}
                fill={MATH_COLORS.paramPrimary}
              />
              <text
                x={designE.x}
                y={designE.y + fontScale(14)}
                textAnchor="middle"
                fill={MATH_COLORS.paramPrimary}
                fontSize={fontScale(10)}
                className="select-none pointer-events-none"
              >
                E({apolloniusData.pointE.x.toFixed(1)},0)
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
            fontSize={fontScale(12)}
            fontWeight="bold"
            className="select-none pointer-events-none"
          >
            P({apolloniusData.pointP.x.toFixed(1)},{" "}
            {apolloniusData.pointP.y.toFixed(1)})
          </text>
        </g>
      )}
    </g>
  );
};
