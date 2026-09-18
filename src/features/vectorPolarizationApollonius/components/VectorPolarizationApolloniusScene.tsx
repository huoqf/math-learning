/**
 * src/features/vectorPolarizationApollonius/components/VectorPolarizationApolloniusScene.tsx
 * 向量极化恒等式与阿波罗尼斯圆纯 SVG 画布场景渲染
 */

import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  InteractivePoint,
  VectorArrow,
  MathPoint,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { rightAnglePath } from "@/utils/geometryMarks";
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
    designApoA,
    designApoB,
    designRadius,
    rangePointX,
    rangePointY,
  } = useVectorPolarizationApolloniusScene({
    params,
    scale,
    onParamChange,
    studyMode,
  });

  /**
   * ∠DPE = 90° 的直角符号。
   *
   * 几何依据：D 是 AB 的内分点、E 是外分点，故 PD、PE 分别是 ∠APB 的内角平分线与外角平分线，
   * 二者必然垂直（这也正是 DE 为阿氏圆直径的原因）。
   * 左屏提问、右屏定理都在讲这条结论，中屏必须把直角符号画出来，否则"文字讲垂直、画面没符号"。
   */
  const rightAngleDPE = useMemo(() => {
    if (apolloniusData.isDegenerate) return null;
    return rightAnglePath(
      designP,
      { x: designD.x - designP.x, y: designD.y - designP.y },
      { x: designE.x - designP.x, y: designE.y - designP.y },
    );
  }, [apolloniusData.isDegenerate, designP, designD, designE]);

  /**
   * 外分点 E 是否已越出可见视口。
   *
   * 阿氏圆上 x 方向的极端点就是 E（λ < 1 时最左、λ > 1 时最右），
   * 而 |x_E| = c(1 + λ)/|λ − 1| 在 λ → 1 时发散，
   * 因此 λ 存在一段"圆与 E 一起胀出画布"的行程。此处显式提示，
   * 取代原先"E 悄悄消失、圆被静默切掉一角"的观感错误。
   * 注意判据用 scale.xMin/xMax（实际可见范围）而非标称常量，视口变化时自动跟随。
   */
  const isEOutOfView =
    !apolloniusData.isDegenerate &&
    (apolloniusData.pointE.x < scale.xMin ||
      apolloniusData.pointE.x > scale.xMax);

  /** 越界提示文字的锚点：可见区域左下角内侧（数学坐标 → 设计坐标） */
  const clipNoticeAt = useMemo(
    () => mathToDesign(scale.xMin + 0.3, scale.yMin + 0.5, scale),
    [scale],
  );

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
          {/* 半底边 BM 与 MC 分色绘制：
              |BM| 是与 |AM| 配对参与极化恒等式的语义量，必须与整条底边区分颜色
              （规范要求：中线 AM 与半弦 MB 必须语义色差分）。 */}
          <line
            x1={designB.x}
            y1={designB.y}
            x2={designM.x}
            y2={designM.y}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={3}
          />
          <line
            x1={designM.x}
            y1={designM.y}
            x2={designC.x}
            y2={designC.y}
            stroke={withAlpha(MATH_COLORS.paramSecondary, 0.55)}
            strokeWidth={2}
          />

          {/* 数量积正负号分界圆：以 M 为圆心、|BM| 为半径 (Thales 圆)。
              圆内 |AM| < |BM| ⇒ AB·AC < 0 (∠A 钝角)；圆外 |AM| > |BM| ⇒ AB·AC > 0 (∠A 锐角)；
              圆周上 |AM| = |BM| ⇒ AB·AC = 0 (∠A 直角)。
              右屏「数量积正负号几何判据」讲的就是这条圆，中屏必须画出来。 */}
          <circle
            cx={designM.x}
            cy={designM.y}
            r={Math.hypot(designC.x - designM.x, designC.y - designM.y)}
            fill="none"
            stroke={withAlpha(MATH_COLORS.circle, 0.6)}
            strokeWidth={1.5}
            strokeDasharray="6 4"
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
            stroke={MATH_COLORS.white}
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
            stroke={MATH_COLORS.white}
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
            stroke={MATH_COLORS.white}
            strokeWidth={3}
            className="select-none pointer-events-none"
          >
            M
          </text>

          {/* 动点 A (可拖拽)，受「声明域 ∩ 可见视口」钳制 */}
          <InteractivePoint
            cx={polarizationData.pointA.x}
            cy={polarizationData.pointA.y}
            scale={scale}
            vp={vp}
            xRange={rangePointX}
            yRange={rangePointY}
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
            stroke={MATH_COLORS.white}
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
            stroke={MATH_COLORS.white}
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
                stroke={MATH_COLORS.white}
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
                stroke={MATH_COLORS.white}
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
                    stroke={MATH_COLORS.white}
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
            x={designApoA.x}
            y={designApoA.y}
            variant="solid"
            color={MATH_COLORS.paramSecondary}
            r={3.8}
          />
          <text
            x={designApoA.x}
            y={designApoA.y + fontScale(16)}
            textAnchor="middle"
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(12)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke={MATH_COLORS.white}
            strokeWidth={3}
            className="select-none pointer-events-none"
          >
            A
          </text>

          {/* 定点 B (c, 0) */}
          <MathPoint
            x={designApoB.x}
            y={designApoB.y}
            variant="solid"
            color={MATH_COLORS.paramSecondary}
            r={3.8}
          />
          <text
            x={designApoB.x}
            y={designApoB.y + fontScale(16)}
            textAnchor="middle"
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(12)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke={MATH_COLORS.white}
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
            stroke={MATH_COLORS.white}
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
                stroke={MATH_COLORS.white}
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

          {/* 内分点 D & 外分点 E 及直径端点辅助连线 (PD ⊥ PE 直角特征) */}
          {!apolloniusData.isDegenerate && studyMode === "apollonius" && (
            <g>
              <line
                x1={designP.x}
                y1={designP.y}
                x2={designD.x}
                y2={designD.y}
                stroke={withAlpha(MATH_COLORS.paramPrimary, 0.65)}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <line
                x1={designP.x}
                y1={designP.y}
                x2={designE.x}
                y2={designE.y}
                stroke={withAlpha(MATH_COLORS.paramPrimary, 0.65)}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              {/* ∠DPE = 90°：PD、PE 为内/外角平分线，必互相垂直 */}
              {rightAngleDPE && (
                <path
                  d={rightAngleDPE}
                  fill="none"
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={1.6}
                  strokeLinejoin="miter"
                />
              )}
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
                stroke={MATH_COLORS.white}
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
                stroke={MATH_COLORS.white}
                strokeWidth={3}
                className="select-none pointer-events-none"
              >
                E
              </text>
            </g>
          )}

          {/* 动点 P (沿阿圆轨道拖拽；平面位置由极角唯一决定，故无需平面钳制) */}
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
            stroke={MATH_COLORS.white}
            strokeWidth={3}
            className="select-none pointer-events-none"
          >
            P
          </text>

          {/* 外分点 E / 阿氏圆越界显式提示（替代静默裁切） */}
          {studyMode === "apollonius" && isEOutOfView && (
            <text
              x={clipNoticeAt.x}
              y={clipNoticeAt.y}
              textAnchor="start"
              fill={MATH_COLORS.degeneracy}
              fontSize={fontScale(11)}
              fontWeight="600"
              paintOrder="stroke"
              stroke={MATH_COLORS.white}
              strokeWidth={3}
              className="select-none pointer-events-none"
            >
              外分点 E(x = {apolloniusData.pointE.x.toFixed(1)}) 已超出画布：λ →
              1 时阿氏圆半径 2cλ/|λ²−1| 发散
            </text>
          )}
        </g>
      )}
    </g>
  );
};
