import React from "react";
import { CoordinateGrid, InteractivePoint, MathPoint } from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import type { HomogenizationResult } from "@/math/conicHomogenization";

interface ConicHomogenizationSceneProps {
  result: HomogenizationResult;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  onPointPDrag?: (x: number, y: number) => void;
}

export const ConicHomogenizationScene: React.FC<
  ConicHomogenizationSceneProps
> = ({ result, scale, vp, fontScale, onPointPDrag }) => {
  const { curveType, studyMode, a, b, P, A, B, isValidIntersections } = result;

  // 1. 绘制椭圆/双曲线 Path
  const curvePathD = React.useMemo(() => {
    if (curveType === "ellipse") {
      const points: string[] = [];
      const steps = 120;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        const x = a * Math.cos(t);
        const y = b * Math.sin(t);
        const pt = mathToDesign(x, y, scale);
        points.push(
          `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`,
        );
      }
      points.push("Z");
      return points.join(" ");
    } else {
      const rightBranch: string[] = [];
      const leftBranch: string[] = [];
      const steps = 60;
      const tMax = 1.2;
      for (let i = 0; i <= steps; i++) {
        const t = -tMax + (i / steps) * 2 * tMax;
        const secT = 1 / Math.cos(t);
        const tanT = Math.tan(t);

        const xr = a * secT;
        const yr = b * tanT;
        const ptr = mathToDesign(xr, yr, scale);
        rightBranch.push(
          `${i === 0 ? "M" : "L"} ${ptr.x.toFixed(2)} ${ptr.y.toFixed(2)}`,
        );

        const xl = -a * secT;
        const yl = b * tanT;
        const ptl = mathToDesign(xl, yl, scale);
        leftBranch.push(
          `${i === 0 ? "M" : "L"} ${ptl.x.toFixed(2)} ${ptl.y.toFixed(2)}`,
        );
      }
      return `${rightBranch.join(" ")} ${leftBranch.join(" ")}`;
    }
  }, [curveType, a, b, scale]);

  // 2. 割线 l Path 与端点
  const { linePathD, lineLabelPos } = React.useMemo(() => {
    const xMin = -6;
    const xMax = 6;
    let pt1 = { x: 0, y: 0 };
    let pt2 = { x: 0, y: 0 };

    if (A && B) {
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      pt1 = mathToDesign(A.x - ux * 8, A.y - uy * 8, scale);
      pt2 = mathToDesign(B.x + ux * 8, B.y + uy * 8, scale);
    } else {
      pt1 = mathToDesign(xMin, -2, scale);
      pt2 = mathToDesign(xMax, 2, scale);
    }

    const pathD = `M ${pt1.x.toFixed(2)} ${pt1.y.toFixed(2)} L ${pt2.x.toFixed(2)} ${pt2.y.toFixed(2)}`;
    // 直线 l 标签位置选在 pt2 稍微内侧
    const labelPos = { x: pt2.x - 15, y: pt2.y - 10 };

    return { linePathD: pathD, lineLabelPos: labelPos };
  }, [A, B, scale]);

  // 3. 屏幕投影坐标
  const posP = mathToDesign(P.x, P.y, scale);
  const posA = A ? mathToDesign(A.x, A.y, scale) : null;
  const posB = B ? mathToDesign(B.x, B.y, scale) : null;

  return (
    <g>
      {/* 纯净坐标系规范：showGrid={false}，纯白底色 + 清晰坐标轴 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* 平移辅助坐标系 (x' P y' 轴) */}
      {studyMode !== "origin" &&
        (Math.abs(P.x) > 1e-4 || Math.abs(P.y) > 1e-4) && (
          <g stroke={CANVAS_COLORS.axis} strokeDasharray="4 4" strokeWidth={1}>
            {/* 平移 x' 轴 */}
            <line
              x1={mathToDesign(-6, P.y, scale).x}
              y1={posP.y}
              x2={mathToDesign(6, P.y, scale).x}
              y2={posP.y}
            />
            {/* 平移 y' 轴 */}
            <line
              x1={posP.x}
              y1={mathToDesign(P.x, -4.5, scale).y}
              x2={posP.x}
              y2={mathToDesign(P.x, 4.5, scale).y}
            />
            {/* 辅助轴标签符合高中数学规范: x', y' */}
            <text
              x={mathToDesign(5.6, P.y, scale).x}
              y={posP.y - 6}
              fill={MATH_COLORS.paramTertiary}
              fontSize={fontScale(11)}
              fontWeight="bold"
              fontStyle="italic"
            >
              x'
            </text>
            <text
              x={posP.x + 8}
              y={mathToDesign(P.x, 4.2, scale).y}
              fill={MATH_COLORS.paramTertiary}
              fontSize={fontScale(11)}
              fontWeight="bold"
              fontStyle="italic"
            >
              y'
            </text>
          </g>
        )}

      {/* 圆锥曲线 (椭圆/双曲线) */}
      <path
        d={curvePathD}
        fill={
          curveType === "ellipse"
            ? withAlpha(MATH_COLORS.function, 0.04)
            : "none"
        }
        stroke={MATH_COLORS.function}
        strokeWidth={2.5}
      />

      {/* 割线 l */}
      <path
        d={linePathD}
        stroke={MATH_COLORS.tangentLine}
        strokeWidth={2}
        strokeDasharray={isValidIntersections ? "none" : "6 4"}
      />

      {/* 直线代号标注: l */}
      <text
        x={lineLabelPos.x}
        y={lineLabelPos.y}
        fill={MATH_COLORS.tangentLine}
        fontSize={fontScale(13)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={3}
      >
        l
      </text>

      {/* 割线段 PA 与 PB 射线 */}
      {isValidIntersections && posA && posB && (
        <>
          {/* PA 连线 */}
          <line
            x1={posP.x}
            y1={posP.y}
            x2={posA.x}
            y2={posA.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2.2}
          />
          {/* PB 连线 */}
          <line
            x1={posP.x}
            y1={posP.y}
            x2={posB.x}
            y2={posB.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2.2}
          />

          {/* 交点 A 纯单字母标注 */}
          <MathPoint
            cx={A!.x}
            cy={A!.y}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
            label="A"
          />

          {/* 交点 B 纯单字母标注 */}
          <MathPoint
            cx={B!.x}
            cy={B!.y}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
            label="B"
          />

          {/* 直角符号 (当 PA ⊥ PB 时呈现纯几何角标) */}
          {result.measuredProduct !== null &&
            Math.abs(result.measuredProduct - -1) < 0.05 &&
            (() => {
              const d1x = posA.x - posP.x;
              const d1y = posA.y - posP.y;
              const len1 = Math.hypot(d1x, d1y) || 1;
              const u1x = (d1x / len1) * fontScale(12);
              const u1y = (d1y / len1) * fontScale(12);

              const d2x = posB.x - posP.x;
              const d2y = posB.y - posP.y;
              const len2 = Math.hypot(d2x, d2y) || 1;
              const u2x = (d2x / len2) * fontScale(12);
              const u2y = (d2y / len2) * fontScale(12);

              const p1 = { x: posP.x + u1x, y: posP.y + u1y };
              const p2 = { x: posP.x + u2x, y: posP.y + u2y };
              const pCorner = { x: posP.x + u1x + u2x, y: posP.y + u1y + u2y };

              return (
                <path
                  d={`M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${pCorner.x.toFixed(1)} ${pCorner.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`}
                  fill="none"
                  stroke={MATH_COLORS.paramTertiary}
                  strokeWidth={1.8}
                />
              );
            })()}
        </>
      )}

      {/* 割线恒过理论定点 Q 纯点标与虚线定位光环 */}
      {result.fixedPointQ &&
        result.theoreticalProduct !== null &&
        Math.abs(result.theoreticalProduct - -1) < 0.05 &&
        (() => {
          const ptQ = mathToDesign(
            result.fixedPointQ.x,
            result.fixedPointQ.y,
            scale,
          );

          return (
            <g>
              <circle
                cx={ptQ.x}
                cy={ptQ.y}
                r={fontScale(7)}
                fill="none"
                stroke={MATH_COLORS.tangentLine}
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
              <MathPoint
                cx={result.fixedPointQ.x}
                cy={result.fixedPointQ.y}
                scale={scale}
                color={MATH_COLORS.tangentLine}
                fontScale={fontScale}
                label="Q"
              />
            </g>
          );
        })()}

      {/* 定点 P/O 控制手柄：原点模式固定，非原点模式支持拖拽 */}
      {studyMode === "origin" ? (
        <MathPoint
          cx={0}
          cy={0}
          scale={scale}
          color={MATH_COLORS.paramTertiary}
          fontScale={fontScale}
          label="O"
        />
      ) : (
        <InteractivePoint
          cx={P.x}
          cy={P.y}
          scale={scale}
          vp={vp}
          color={MATH_COLORS.paramTertiary}
          fontScale={fontScale}
          label="P"
          onDrag={(mathPt) => {
            if (onPointPDrag) onPointPDrag(mathPt.x, mathPt.y);
          }}
        />
      )}
    </g>
  );
};
