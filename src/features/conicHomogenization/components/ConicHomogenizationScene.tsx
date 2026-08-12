import React from "react";
import { CoordinateGrid, InteractivePoint } from "@/components/Math";
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
  onLineParamDrag?: (lineA: number, lineB: number) => void;
}

export const ConicHomogenizationScene: React.FC<
  ConicHomogenizationSceneProps
> = ({ result, scale, vp, fontScale, onPointPDrag }) => {
  const {
    curveType,
    studyMode,
    a,
    b,
    P,
    A,
    B,
    isValidIntersections,
    fixedPointQ,
  } = result;

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

  // 2. 直线 l Path
  const linePathD = React.useMemo(() => {
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
    return `M ${pt1.x.toFixed(2)} ${pt1.y.toFixed(2)} L ${pt2.x.toFixed(2)} ${pt2.y.toFixed(2)}`;
  }, [A, B, scale]);

  // 3. 屏幕投影坐标
  const posP = mathToDesign(P.x, P.y, scale);
  const posA = A ? mathToDesign(A.x, A.y, scale) : null;
  const posB = B ? mathToDesign(B.x, B.y, scale) : null;
  const posQ = fixedPointQ
    ? mathToDesign(fixedPointQ.x, fixedPointQ.y, scale)
    : null;

  return (
    <g>
      {/* 坐标轴与背景网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 平移局部坐标轴 */}
      {studyMode !== "origin" &&
        (Math.abs(P.x) > 1e-4 || Math.abs(P.y) > 1e-4) && (
          <g stroke={CANVAS_COLORS.axis} strokeDasharray="4 4" strokeWidth={1}>
            <line
              x1={mathToDesign(-6, P.y, scale).x}
              y1={posP.y}
              x2={mathToDesign(6, P.y, scale).x}
              y2={posP.y}
            />
            <line
              x1={posP.x}
              y1={mathToDesign(P.x, -4.5, scale).y}
              x2={posP.x}
              y2={mathToDesign(P.x, 4.5, scale).y}
            />
            <text
              x={posP.x + 8}
              y={posP.y - 8}
              fill={MATH_COLORS.paramTertiary}
              fontSize={fontScale(10)}
              fontWeight="bold"
            >
              P(x₀,y₀) 平移原点
            </text>
          </g>
        )}

      {/* 圆锥曲线 (椭圆/双曲线) */}
      <path
        d={curvePathD}
        fill={
          curveType === "ellipse"
            ? withAlpha(MATH_COLORS.function, 0.05)
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

      {/* 割线段 PA 与 PB */}
      {isValidIntersections && posA && posB && (
        <>
          {/* PA 向量线 */}
          <line
            x1={posP.x}
            y1={posP.y}
            x2={posA.x}
            y2={posA.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
          />
          {/* PB 向量线 */}
          <line
            x1={posP.x}
            y1={posP.y}
            x2={posB.x}
            y2={posB.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2}
          />

          {/* 交点 A 标注 */}
          <circle
            cx={posA.x}
            cy={posA.y}
            r={5}
            fill={MATH_COLORS.paramPrimary}
          />
          <text
            x={posA.x + 10}
            y={posA.y - 6}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            A({A!.x.toFixed(2)}, {A!.y.toFixed(2)})
          </text>

          {/* 交点 B 标注 */}
          <circle
            cx={posB.x}
            cy={posB.y}
            r={5}
            fill={MATH_COLORS.paramSecondary}
          />
          <text
            x={posB.x + 10}
            y={posB.y + 16}
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            B({B!.x.toFixed(2)}, {B!.y.toFixed(2)})
          </text>

          {/* 斜率标注 k₁与 k₂ */}
          {result.measuredK1 !== null && (
            <text
              x={(posP.x + posA.x) / 2 - 25}
              y={(posP.y + posA.y) / 2 - 10}
              fill={MATH_COLORS.paramPrimary}
              fontSize={fontScale(10)}
              fontWeight="bold"
            >
              k₁={result.measuredK1.toFixed(2)}
            </text>
          )}
          {result.measuredK2 !== null && (
            <text
              x={(posP.x + posB.x) / 2 + 10}
              y={(posP.y + posB.y) / 2 + 15}
              fill={MATH_COLORS.paramSecondary}
              fontSize={fontScale(10)}
              fontWeight="bold"
            >
              k₂={result.measuredK2.toFixed(2)}
            </text>
          )}
        </>
      )}

      {/* 定点 Q (在模式3定点探索下显示) */}
      {studyMode === "asymmetric" && posQ && (
        <g>
          <circle
            cx={posQ.x}
            cy={posQ.y}
            r={6}
            fill={MATH_COLORS.paramPrimary}
          />
          <circle
            cx={posQ.x}
            cy={posQ.y}
            r={10}
            fill="none"
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
          />
          <text
            x={posQ.x + 12}
            y={posQ.y - 12}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            定点 Q({fixedPointQ!.x.toFixed(2)}, {fixedPointQ!.y.toFixed(2)})
          </text>
        </g>
      )}

      {/* 可拖拽定点 P */}
      <InteractivePoint
        cx={P.x}
        cy={P.y}
        scale={scale}
        vp={vp}
        color={MATH_COLORS.paramPrimary}
        fontScale={fontScale}
        label={
          studyMode === "origin"
            ? "O(0,0)"
            : `P(${P.x.toFixed(1)}, ${P.y.toFixed(1)})`
        }
        onDrag={(pt) => {
          if (onPointPDrag) onPointPDrag(pt.x, pt.y);
        }}
      />
    </g>
  );
};
