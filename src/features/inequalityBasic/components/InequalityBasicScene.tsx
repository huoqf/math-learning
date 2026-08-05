/**
 * src/features/inequalityBasic/components/InequalityBasicScene.tsx
 * 纯 SVG 渲染：基本不等式几何证明与最值动效
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import { useInequalityBasicScene } from "../hooks/useInequalityBasicScene";

interface InequalityBasicSceneProps {
  params: {
    a: number;
    b: number;
    k: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode?: "semicircle" | "square" | "nike";
}

export const InequalityBasicScene: React.FC<InequalityBasicSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "semicircle",
}) => {
  const { k } = params;

  const { means, semicircleGeo, squareGeo, nikeGeo, handlePointPDrag, labels } =
    useInequalityBasicScene({ params, scale, onParamChange, studyMode });

  // 对勾函数 f(x) = x + k/x
  const nikeFn = React.useCallback(
    (x: number) => {
      if (x <= 0.05) return NaN;
      return x + k / x;
    },
    [k],
  );

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* ── 模式一：半圆四均值几何证明 ── */}
      {studyMode === "semicircle" && (
        <g key="mode-semicircle">
          {/* 半圆弧路径 */}
          {(() => {
            const ptA = mathToDesign(
              semicircleGeo.pointA.x,
              semicircleGeo.pointA.y,
              scale,
            );
            const ptB = mathToDesign(
              semicircleGeo.pointB.x,
              semicircleGeo.pointB.y,
              scale,
            );
            const rPx = Math.abs(ptB.x - ptA.x) / 2;
            const pathD = `M ${ptA.x} ${ptA.y} A ${rPx} ${rPx} 0 0 1 ${ptB.x} ${ptB.y}`;
            return (
              <path
                d={pathD}
                fill={withAlpha(MATH_COLORS.function, 0.06)}
                stroke={MATH_COLORS.function}
                strokeWidth={2.5}
              />
            );
          })()}

          {/* 直径 Segment AB */}
          {(() => {
            const ptA = mathToDesign(semicircleGeo.pointA.x, 0, scale);
            const ptB = mathToDesign(semicircleGeo.pointB.x, 0, scale);
            return (
              <line
                x1={ptA.x}
                y1={ptA.y}
                x2={ptB.x}
                y2={ptB.y}
                stroke={MATH_COLORS.axis}
                strokeWidth={2}
              />
            );
          })()}

          {/* 段 AP (长度 a) 高亮 & 段 PB (长度 b) 高亮 */}
          {(() => {
            const ptA = mathToDesign(semicircleGeo.pointA.x, 0, scale);
            const ptP = mathToDesign(semicircleGeo.pointP.x, 0, scale);
            const ptB = mathToDesign(semicircleGeo.pointB.x, 0, scale);
            return (
              <>
                {/* AP: a */}
                <line
                  x1={ptA.x}
                  y1={ptA.y - 2}
                  x2={ptP.x}
                  y2={ptP.y - 2}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={4}
                  strokeLinecap="round"
                />
                {/* PB: b */}
                <line
                  x1={ptP.x}
                  y1={ptP.y - 2}
                  x2={ptB.x}
                  y2={ptB.y - 2}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={4}
                  strokeLinecap="round"
                />
              </>
            );
          })()}

          {/* 半径 OC: AM = (a+b)/2 */}
          {(() => {
            const ptO = mathToDesign(0, 0, scale);
            const ptC = mathToDesign(
              semicircleGeo.pointC.x,
              semicircleGeo.pointC.y,
              scale,
            );
            return (
              <line
                x1={ptO.x}
                y1={ptO.y}
                x2={ptC.x}
                y2={ptC.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={2.5}
              />
            );
          })()}

          {/* 垂线段 PC: GM = sqrt(ab) */}
          {(() => {
            const ptP = mathToDesign(semicircleGeo.pointP.x, 0, scale);
            const ptC = mathToDesign(
              semicircleGeo.pointC.x,
              semicircleGeo.pointC.y,
              scale,
            );
            return (
              <line
                x1={ptP.x}
                y1={ptP.y}
                x2={ptC.x}
                y2={ptC.y}
                stroke={MATH_COLORS.focusPoint}
                strokeWidth={3}
              />
            );
          })()}

          {/* 垂线段 PD 到 OC: 导出 CD = HM */}
          {(() => {
            const ptP = mathToDesign(semicircleGeo.pointP.x, 0, scale);
            const ptD = mathToDesign(
              semicircleGeo.pointD.x,
              semicircleGeo.pointD.y,
              scale,
            );
            const ptC = mathToDesign(
              semicircleGeo.pointC.x,
              semicircleGeo.pointC.y,
              scale,
            );
            return (
              <>
                {/* PD 垂线 */}
                <line
                  x1={ptP.x}
                  y1={ptP.y}
                  x2={ptD.x}
                  y2={ptD.y}
                  stroke={MATH_COLORS.paramTertiary}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
                {/* CD: HM */}
                <line
                  x1={ptC.x}
                  y1={ptC.y}
                  x2={ptD.x}
                  y2={ptD.y}
                  stroke={MATH_COLORS.paramTertiary}
                  strokeWidth={3}
                />
              </>
            );
          })()}

          {/* 切分点 P 可拖拽控制点 */}
          <InteractivePoint
            cx={semicircleGeo.pointP.x}
            cy={0}
            scale={scale}
            vp={vp}
            onDrag={(mPt) => handlePointPDrag(mPt.x)}
            color={MATH_COLORS.focusPoint}
            r={6}
            fontScale={fontScale}
          />

          {/* 取等条件 a=b 时的视效标语 */}
          {means.isEqual && (
            <g>
              <rect
                x={mathToDesign(0, semicircleGeo.radius + 0.6, scale).x - 110}
                y={mathToDesign(0, semicircleGeo.radius + 0.6, scale).y - 14}
                width={220}
                height={28}
                rx={6}
                fill={withAlpha(MATH_COLORS.paramTertiary, 0.15)}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={1.5}
              />
              <text
                x={mathToDesign(0, semicircleGeo.radius + 0.6, scale).x}
                y={mathToDesign(0, semicircleGeo.radius + 0.6, scale).y + 4}
                textAnchor="middle"
                fill={MATH_COLORS.paramTertiary}
                fontSize={fontScale(12)}
                fontWeight="bold"
                className="select-none pointer-events-none"
              >
                a = b 取等瞬间：AM = GM = HM
              </text>
            </g>
          )}

          {/* 渲染防避让标签 */}
          {labels.map(
            (l: {
              key: string;
              x: number;
              y: number;
              text: string;
              anchor?: "start" | "middle" | "end";
              finalDy?: number;
            }) => (
              <text
                key={l.key}
                x={l.x}
                y={l.y + (l.finalDy ?? 0)}
                textAnchor={l.anchor ?? "middle"}
                fill={MATH_COLORS.labelText}
                fontSize={fontScale(11)}
                fontFamily="sans-serif"
                fontWeight="600"
                className="select-none pointer-events-none"
              >
                {l.text}
              </text>
            ),
          )}
        </g>
      )}

      {/* ── 模式二：赵爽弦图与面积对比 ── */}
      {studyMode === "square" && (
        <g key="mode-square">
          {(() => {
            const side = squareGeo.totalSide;
            // 居中放置正方形
            const originX = -side / 2;
            const originY = -side / 2;

            const p0 = mathToDesign(originX, originY, scale);
            const pTotal = mathToDesign(originX + side, originY + side, scale);
            const widthPx = Math.abs(pTotal.x - p0.x);
            const heightPx = Math.abs(p0.y - pTotal.y);

            const aPx = (squareGeo.rectWidth / side) * widthPx;
            const bPx = (squareGeo.rectHeight / side) * heightPx;

            return (
              <g>
                {/* 外层大正方形 (a+b)^2 */}
                <rect
                  x={p0.x}
                  y={pTotal.y}
                  width={widthPx}
                  height={heightPx}
                  fill={withAlpha(MATH_COLORS.function, 0.04)}
                  stroke={MATH_COLORS.function}
                  strokeWidth={2}
                />

                {/* 4 个 a x b 矩形 */}
                <rect
                  x={p0.x}
                  y={p0.y - bPx}
                  width={aPx}
                  height={bPx}
                  fill={withAlpha(MATH_COLORS.paramPrimary, 0.25)}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={1.5}
                />
                <rect
                  x={p0.x + aPx}
                  y={p0.y - aPx}
                  width={bPx}
                  height={aPx}
                  fill={withAlpha(MATH_COLORS.paramSecondary, 0.25)}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1.5}
                />
                <rect
                  x={pTotal.x - aPx}
                  y={pTotal.y}
                  width={aPx}
                  height={bPx}
                  fill={withAlpha(MATH_COLORS.paramPrimary, 0.25)}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={1.5}
                />
                <rect
                  x={p0.x}
                  y={pTotal.y}
                  width={bPx}
                  height={aPx}
                  fill={withAlpha(MATH_COLORS.paramSecondary, 0.25)}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1.5}
                />

                {/* 中心差值小正方形 (a-b)^2 */}
                {squareGeo.innerSide > 0.01 && (
                  <rect
                    x={p0.x + Math.min(aPx, bPx)}
                    y={pTotal.y + Math.min(aPx, bPx)}
                    width={Math.abs(aPx - bPx)}
                    height={Math.abs(aPx - bPx)}
                    fill={withAlpha(MATH_COLORS.focusPoint, 0.35)}
                    stroke={MATH_COLORS.focusPoint}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                  />
                )}

                {/* 文本说明 */}
                <text
                  x={p0.x + widthPx / 2}
                  y={pTotal.y - 12}
                  textAnchor="middle"
                  fill={MATH_COLORS.labelText}
                  fontSize={fontScale(12)}
                  fontWeight="bold"
                >
                  大正方形面积 (a+b)² = {squareGeo.totalArea.toFixed(2)}
                </text>
                <text
                  x={p0.x + widthPx / 2}
                  y={p0.y + 24}
                  textAnchor="middle"
                  fill={MATH_COLORS.focusPoint}
                  fontSize={fontScale(11)}
                  fontWeight="600"
                >
                  4个矩形面积 4ab = {squareGeo.fourRectsArea.toFixed(2)} +
                  中心差值 (a-b)² = {squareGeo.innerSquareArea.toFixed(2)}
                </text>
              </g>
            );
          })()}
        </g>
      )}

      {/* ── 模式三：对勾函数与最值应用 ── */}
      {studyMode === "nike" && (
        <g key="mode-nike">
          {/* 对勾函数曲线 f(x) = x + k/x */}
          <FunctionGraph
            fn={nikeFn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.5}
          />

          {/* 最小值水平切线 y = 2*sqrt(k) */}
          {(() => {
            const pStart = mathToDesign(scale.xMin, nikeGeo.minY, scale);
            const pEnd = mathToDesign(scale.xMax, nikeGeo.minY, scale);
            return (
              <line
                x1={pStart.x}
                y1={pStart.y}
                x2={pEnd.x}
                y2={pEnd.y}
                stroke={MATH_COLORS.asymptote}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            );
          })()}

          {/* 最小值点 (sqrt(k), 2*sqrt(k)) 标记 */}
          {(() => {
            const ptMin = mathToDesign(nikeGeo.minX, nikeGeo.minY, scale);
            return (
              <g>
                <circle
                  cx={ptMin.x}
                  cy={ptMin.y}
                  r={6}
                  fill={MATH_COLORS.focusPoint}
                  stroke={MATH_COLORS.white}
                  strokeWidth={2}
                />
                <text
                  x={ptMin.x}
                  y={ptMin.y - 12}
                  textAnchor="middle"
                  fill={MATH_COLORS.focusPoint}
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                >
                  最小值点 (√k, 2√k) = ({nikeGeo.minX.toFixed(2)},{" "}
                  {nikeGeo.minY.toFixed(2)})
                </text>
              </g>
            );
          })()}

          {/* 当前滑动点 (x, f(x)) */}
          <InteractivePoint
            cx={nikeGeo.currentX}
            cy={nikeGeo.currentY}
            scale={scale}
            vp={vp}
            onDrag={(mPt) => {
              const newX = Math.max(0.2, Math.min(8.0, mPt.x));
              onParamChange("a", Number(newX.toFixed(1)));
            }}
            color={MATH_COLORS.paramPrimary}
            r={6}
            fontScale={fontScale}
          />
        </g>
      )}
    </g>
  );
};
