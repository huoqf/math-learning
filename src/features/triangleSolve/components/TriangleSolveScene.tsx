import { CoordinateGrid, InteractivePoint, MathPoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  solveTriangleFromSAS,
  solveBisectorAndMedian,
} from "@/math/triangleSolve";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { TriangleSolveSsaScene } from "./TriangleSolveSsaScene";
import { TriangleSineZone } from "./TriangleSineZone";
import { TriangleCosineZone } from "./TriangleCosineZone";
import { TriangleAreaZone } from "./TriangleAreaZone";
import { TriangleBisectorZone } from "./TriangleBisectorZone";

interface TriangleSolveSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange?: (key: string, value: number) => void;
  fontScale: (v: number) => number;
  studyMode: "sine" | "ssa" | "cosine" | "area" | "bisector";
}

/** 计算从形心向顶点的向外单位放射向量 */
function getRadialOutwardOffset(
  point: { x: number; y: number },
  centroid: { x: number; y: number },
  dist: number,
): { x: number; y: number; anchor: "start" | "end" | "middle" } {
  const dx = point.x - centroid.x;
  const dy = point.y - centroid.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const anchor = ux > 0.35 ? "start" : ux < -0.35 ? "end" : "middle";
  return {
    x: point.x + ux * dist,
    y: point.y + uy * dist + (uy > 0.5 ? 4 : uy < -0.5 ? -2 : 0),
    anchor,
  };
}

/** 计算线段的外向法向量偏置位置 (远离形心) */
function getEdgeOutwardOffset(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  centroid: { x: number; y: number },
  dist: number,
): { x: number; y: number; anchor: "start" | "end" | "middle" } {
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // 两个法向之一 (-dy, dx)
  let nx = -dy;
  let ny = dx;
  const nLen = Math.hypot(nx, ny) || 1;
  nx /= nLen;
  ny /= nLen;

  // 判断是否远离形心
  const dWithNormal = Math.hypot(
    mx + nx * 10 - centroid.x,
    my + ny * 10 - centroid.y,
  );
  const dWithoutNormal = Math.hypot(
    mx - nx * 10 - centroid.x,
    my - ny * 10 - centroid.y,
  );
  if (dWithNormal < dWithoutNormal) {
    nx = -nx;
    ny = -ny;
  }

  const anchor = nx > 0.35 ? "start" : nx < -0.35 ? "end" : "middle";
  return {
    x: mx + nx * dist,
    y: my + ny * dist + (ny > 0.5 ? 4 : ny < -0.5 ? -2 : 0),
    anchor,
  };
}

export function TriangleSolveScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  studyMode,
}: TriangleSolveSceneProps) {
  const angleA = params.angleA ?? 60;
  const b = params.b ?? 5;
  const c = params.c ?? 6;

  const sasResult = solveTriangleFromSAS(b, c, angleA);
  const bisectorResult = solveBisectorAndMedian(b, c, angleA);

  // ── 模式 1: SSA 探究模式 (完全独立的构图,委托给子场景) ──
  if (studyMode === "ssa") {
    return (
      <TriangleSolveSsaScene
        params={params}
        scale={scale}
        fontScale={fontScale}
      />
    );
  }

  // ── 模式 2~5: sine | cosine | area | bisector (共享同一坐标系与主三角形) ──
  const {
    points: { A, B, C },
    sides,
    anglesDeg,
  } = sasResult;

  const pA = mathToDesign(A.x, A.y, scale);
  const pB = mathToDesign(B.x, B.y, scale);
  const pC = mathToDesign(C.x, C.y, scale);

  // 计算屏幕像素形心
  const pCentroid = {
    x: (pA.x + pB.x + pC.x) / 3,
    y: (pA.y + pB.y + pC.y) / 3,
  };

  // 顶点外向放射位置
  const labelPosA = getRadialOutwardOffset(pA, pCentroid, fontScale(16));
  const labelPosB = getRadialOutwardOffset(pB, pCentroid, fontScale(16));
  const labelPosC = getRadialOutwardOffset(pC, pCentroid, fontScale(16));

  // 边长外向法向位置
  const edgePosA = getEdgeOutwardOffset(pB, pC, pCentroid, fontScale(16)); // BC边 (a)
  const edgePosB = getEdgeOutwardOffset(pA, pC, pCentroid, fontScale(16)); // AC边 (b)
  const edgePosC = getEdgeOutwardOffset(pA, pB, pCentroid, fontScale(16)); // AB边 (c)

  return (
    <g className="triangle-solve-scene">
      {/* 坐标轴与网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* ── 各专题专属几何图层 (均为叠加于共享主三角形之上的独立图层) ── */}
      {studyMode === "sine" && (
        <TriangleSineZone
          scale={scale}
          fontScale={fontScale}
          sasResult={sasResult}
        />
      )}
      {studyMode === "cosine" && (
        <TriangleCosineZone
          scale={scale}
          fontScale={fontScale}
          sasResult={sasResult}
        />
      )}
      {studyMode === "area" && (
        <TriangleAreaZone
          scale={scale}
          fontScale={fontScale}
          sasResult={sasResult}
        />
      )}
      {studyMode === "bisector" && (
        <TriangleBisectorZone
          scale={scale}
          fontScale={fontScale}
          sasResult={sasResult}
          bisectorResult={bisectorResult}
        />
      )}

      {/* ── 主三角形主体结构渲染 (三位一体色彩) ── */}
      <polygon
        points={`${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}`}
        fill={withAlpha(MATH_COLORS.function, 0.06)}
      />

      {/* 边 a (BC): 鲜红 */}
      <line
        x1={pB.x}
        y1={pB.y}
        x2={pC.x}
        y2={pC.y}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={3}
      />
      {/* 边 b (AC): 暖橙 */}
      <line
        x1={pA.x}
        y1={pA.y}
        x2={pC.x}
        y2={pC.y}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={3}
      />
      {/* 边 c (AB): 翠绿 */}
      <line
        x1={pA.x}
        y1={pA.y}
        x2={pB.x}
        y2={pB.y}
        stroke={MATH_COLORS.paramTertiary}
        strokeWidth={3}
      />

      {/* ── 边长标签 (精准外法向量偏移，永不压线，永不倒扣) ── */}
      {studyMode !== "bisector" && studyMode !== "cosine" && (
        <text
          x={edgePosA.x}
          y={edgePosA.y}
          textAnchor={edgePosA.anchor}
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(11)}
          fontWeight="bold"
          paintOrder="stroke"
          stroke="white"
          strokeWidth={fontScale(3.5)}
          strokeLinejoin="round"
        >
          a = {sides.a.toFixed(2)}
        </text>
      )}

      <text
        x={edgePosB.x}
        y={edgePosB.y}
        textAnchor={edgePosB.anchor}
        fill={MATH_COLORS.paramSecondary}
        fontSize={fontScale(11)}
        fontWeight="bold"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(3.5)}
        strokeLinejoin="round"
      >
        b = {sides.b.toFixed(2)}
      </text>

      <text
        x={edgePosC.x}
        y={edgePosC.y}
        textAnchor={edgePosC.anchor}
        fill={MATH_COLORS.paramTertiary}
        fontSize={fontScale(11)}
        fontWeight="bold"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(3.5)}
        strokeLinejoin="round"
      >
        c = {sides.c.toFixed(2)}
      </text>

      {/* ── 顶点交互点与圆点 ── */}
      <InteractivePoint
        cx={A.x}
        cy={A.y}
        scale={scale}
        vp={vp}
        color={MATH_COLORS.paramPrimary}
        fontScale={fontScale}
        onDrag={(mathPos) => {
          if (onParamChange) {
            const newAngle = Math.round(
              Math.max(15, Math.min(150, Math.abs(mathPos.y) * 15 + 30)),
            );
            onParamChange("angleA", newAngle);
          }
        }}
      />
      <MathPoint x={pB.x} y={pB.y} color={MATH_COLORS.paramSecondary} />
      <MathPoint x={pC.x} y={pC.y} color={MATH_COLORS.paramTertiary} />

      {/* ── 顶点与角度标签 (沿着形心向外放射，绝对不被遮挡) ── */}
      <text
        x={labelPosA.x}
        y={labelPosA.y}
        textAnchor={labelPosA.anchor}
        fill={MATH_COLORS.paramPrimary}
        fontSize={fontScale(12)}
        fontWeight="bold"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(4)}
        strokeLinejoin="round"
      >
        A ({anglesDeg.A.toFixed(1)}°)
      </text>
      <text
        x={labelPosB.x}
        y={labelPosB.y}
        textAnchor={labelPosB.anchor}
        fill={MATH_COLORS.paramSecondary}
        fontSize={fontScale(12)}
        fontWeight="bold"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(4)}
        strokeLinejoin="round"
      >
        B ({anglesDeg.B.toFixed(1)}°)
      </text>
      <text
        x={labelPosC.x}
        y={labelPosC.y}
        textAnchor={labelPosC.anchor}
        fill={MATH_COLORS.paramTertiary}
        fontSize={fontScale(12)}
        fontWeight="bold"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(4)}
        strokeLinejoin="round"
      >
        C ({anglesDeg.C.toFixed(1)}°)
      </text>
    </g>
  );
}
