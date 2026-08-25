import { InteractivePoint, MathPoint } from "@/components/Math";
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
      {/* 纯几何范式：彻底移除笛卡尔坐标系与刻度穿刺 */}

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
        fill={withAlpha(MATH_COLORS.function, 0.05)}
      />

      {/* 顶点 A 内角角弧（在非角平分线模式下绘制纯正几何角弧） */}
      {studyMode !== "bisector" &&
        (() => {
          const arcR = fontScale(24);
          const dirAB = { x: pB.x - pA.x, y: pB.y - pA.y };
          const dirAC = { x: pC.x - pA.x, y: pC.y - pA.y };

          const angAB = Math.atan2(dirAB.y, dirAB.x);
          const angAC = Math.atan2(dirAC.y, dirAC.x);

          const startX = pA.x + arcR * Math.cos(angAB);
          const startY = pA.y + arcR * Math.sin(angAB);
          const endX = pA.x + arcR * Math.cos(angAC);
          const endY = pA.y + arcR * Math.sin(angAC);

          return (
            <g className="angle-A-arc">
              <path
                d={`M ${startX} ${startY} A ${arcR} ${arcR} 0 0 ${angAC > angAB ? 1 : 0} ${endX} ${endY}`}
                fill="none"
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1.8}
              />
            </g>
          );
        })()}

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

      {/* ── 边长标签 (纯正高中教材学术符号: a, b, c，数值 100% 归位右屏看板) ── */}
      {studyMode !== "bisector" && studyMode !== "cosine" && (
        <text
          x={edgePosA.x}
          y={edgePosA.y}
          textAnchor={edgePosA.anchor}
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(14)}
          fontWeight="bold"
          fontStyle="italic"
          paintOrder="stroke"
          stroke="white"
          strokeWidth={fontScale(4)}
          strokeLinejoin="round"
        >
          a
        </text>
      )}

      <text
        x={edgePosB.x}
        y={edgePosB.y}
        textAnchor={edgePosB.anchor}
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
        x={edgePosC.x}
        y={edgePosC.y}
        textAnchor={edgePosC.anchor}
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

      {/* ── 纯字母顶点标签 (严谨高中数学习惯: 单字母，无多余括号数值) ── */}
      <text
        x={labelPosA.x}
        y={labelPosA.y}
        textAnchor={labelPosA.anchor}
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
      <text
        x={labelPosB.x}
        y={labelPosB.y}
        textAnchor={labelPosB.anchor}
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
      <text
        x={labelPosC.x}
        y={labelPosC.y}
        textAnchor={labelPosC.anchor}
        fill={MATH_COLORS.paramTertiary}
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
    </g>
  );
}
