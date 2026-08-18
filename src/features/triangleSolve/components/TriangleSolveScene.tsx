import { CoordinateGrid, InteractivePoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import {
  solveTriangleFromSAS,
  solveSSA,
  solveBisectorAndMedian,
} from "@/math/triangleSolve";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";

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
  const a = params.a ?? 4.5;

  const sasResult = solveTriangleFromSAS(b, c, angleA);
  const ssaResult = solveSSA(a, b, angleA);
  const bisectorResult = solveBisectorAndMedian(b, c, angleA);

  // ── 模式 1: SSA 探究模式 ──
  if (studyMode === "ssa") {
    const { A: pointA, C: pointC, solutions } = ssaResult;

    const pA = mathToDesign(pointA.x, pointA.y, scale);
    const pC = mathToDesign(pointC.x, pointC.y, scale);

    // 计算射线 AB 方向
    const radA = (angleA * Math.PI) / 180;
    const rayLen = Math.max(12, b * 1.5);
    const rayEndMath = {
      x: pointA.x + rayLen * Math.cos(radA),
      y: pointA.y + rayLen * Math.sin(radA),
    };
    const pRayEnd = mathToDesign(rayEndMath.x, rayEndMath.y, scale);

    // 垂线段高 h
    const footDMath = {
      x: pointA.x + b * Math.cos(radA) * Math.cos(radA),
      y: pointA.y + b * Math.cos(radA) * Math.sin(radA),
    };
    const pFootD = mathToDesign(footDMath.x, footDMath.y, scale);
    const h = b * Math.sin(radA);

    const radiusInPixel = a * scale.scaleX;
    const hInPixel = h * scale.scaleX;

    return (
      <g className="triangle-solve-scene">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 射线 AB 方向基准虚线 */}
        <line
          x1={pA.x}
          y1={pA.y}
          x2={pRayEnd.x}
          y2={pRayEnd.y}
          stroke={CANVAS_COLORS.labelTextLight}
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />

        {/* 基准边 AC (长为 b) */}
        <line
          x1={pA.x}
          y1={pA.y}
          x2={pC.x}
          y2={pC.y}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={3}
        />
        <text
          x={(pA.x + pC.x) / 2}
          y={pA.y + fontScale(18)}
          textAnchor="middle"
          fill={MATH_COLORS.paramSecondary}
          fontSize={fontScale(12)}
          fontWeight="bold"
          paintOrder="stroke"
          stroke="white"
          strokeWidth={fontScale(4)}
          strokeLinejoin="round"
        >
          b = {b.toFixed(1)}
        </text>

        {/* 垂线 h (b sinA) */}
        <line
          x1={pC.x}
          y1={pC.y}
          x2={pFootD.x}
          y2={pFootD.y}
          stroke={MATH_COLORS.tangentLine}
          strokeWidth={2}
          strokeDasharray="3,3"
        />
        <text
          x={(pC.x + pFootD.x) / 2 + fontScale(10)}
          y={(pC.y + pFootD.y) / 2}
          fill={MATH_COLORS.tangentLine}
          fontSize={fontScale(11)}
          fontWeight="bold"
          paintOrder="stroke"
          stroke="white"
          strokeWidth={fontScale(3.5)}
          strokeLinejoin="round"
        >
          h = {h.toFixed(2)}
        </text>

        {/* 以 C 为圆心，半径为 a 的探究圆弧 */}
        <circle
          cx={pC.x}
          cy={pC.y}
          r={radiusInPixel}
          fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={1.5}
          strokeDasharray="5,5"
        />

        {/* 临界切线圆 (半径 h) 辅助虚线 */}
        <circle
          cx={pC.x}
          cy={pC.y}
          r={hInPixel}
          fill="none"
          stroke={MATH_COLORS.tangentLine}
          strokeWidth={1}
          strokeDasharray="2,2"
          opacity={0.5}
        />

        {/* 交点与解三角形渲染 */}
        {solutions.map((solB, idx) => {
          const pB = mathToDesign(solB.x, solB.y, scale);
          const isPrimary = idx === 0;
          return (
            <g key={idx}>
              <line
                x1={pC.x}
                y1={pC.y}
                x2={pB.x}
                y2={pB.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={isPrimary ? 3 : 2}
              />
              <line
                x1={pA.x}
                y1={pA.y}
                x2={pB.x}
                y2={pB.y}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={isPrimary ? 3 : 2}
              />

              <circle
                cx={pB.x}
                cy={pB.y}
                r={fontScale(5)}
                fill={
                  isPrimary
                    ? MATH_COLORS.paramPrimary
                    : MATH_COLORS.sequenceHighlight
                }
              />
              <text
                x={pB.x}
                y={pB.y - fontScale(12)}
                textAnchor="middle"
                fill={MATH_COLORS.function}
                fontSize={fontScale(12)}
                fontWeight="bold"
                paintOrder="stroke"
                stroke="white"
                strokeWidth={fontScale(4)}
                strokeLinejoin="round"
              >
                {solutions.length === 2 ? `B${idx + 1}` : "B"}
              </text>
            </g>
          );
        })}

        {/* 固定顶点 A, C 标注 */}
        <text
          x={pA.x - fontScale(10)}
          y={pA.y + fontScale(18)}
          textAnchor="end"
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(12)}
          fontWeight="bold"
          paintOrder="stroke"
          stroke="white"
          strokeWidth={fontScale(4)}
          strokeLinejoin="round"
        >
          A ({angleA}°)
        </text>
        <text
          x={pC.x + fontScale(10)}
          y={pC.y + fontScale(18)}
          textAnchor="start"
          fill={MATH_COLORS.paramSecondary}
          fontSize={fontScale(12)}
          fontWeight="bold"
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

  // ── 模式 2~5: sine | cosine | area | bisector ──
  const {
    points: { A, B, C },
    sides,
    anglesDeg,
    circumcircle,
    incircle,
    altitudeA,
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

  // 外接圆中心与半径 px
  const pCircumCenter = mathToDesign(
    circumcircle.center.x,
    circumcircle.center.y,
    scale,
  );
  const circumRadiusPx = circumcircle.radius * scale.scaleX;

  // 内切圆中心与半径 px
  const pIncenter = mathToDesign(incircle.center.x, incircle.center.y, scale);
  const inradiusPx = incircle.radius * scale.scaleX;

  // 垂足 FootD 像素坐标
  const pFootD = mathToDesign(altitudeA.foot.x, altitudeA.foot.y, scale);

  return (
    <g className="triangle-solve-scene">
      {/* 坐标轴与网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* ── 专题一：正弦定理专属几何场景 (Sine) ── */}
      {studyMode === "sine" && circumRadiusPx < 800 && (
        <g className="sine-mode-scene">
          {/* 外接圆 */}
          <circle
            cx={pCircumCenter.x}
            cy={pCircumCenter.y}
            r={circumRadiusPx}
            fill={withAlpha(MATH_COLORS.circle, 0.04)}
            stroke={MATH_COLORS.circle}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
          {/* 外心 O */}
          <circle
            cx={pCircumCenter.x}
            cy={pCircumCenter.y}
            r={fontScale(3.5)}
            fill={MATH_COLORS.circle}
          />
          <text
            x={pCircumCenter.x + fontScale(6)}
            y={pCircumCenter.y - fontScale(6)}
            fill={MATH_COLORS.circle}
            fontSize={fontScale(11)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={fontScale(3.5)}
            strokeLinejoin="round"
          >
            O (R={circumcircle.radius.toFixed(2)})
          </text>
          {/* 外接圆半径 OA 虚线 */}
          <line
            x1={pCircumCenter.x}
            y1={pCircumCenter.y}
            x2={pA.x}
            y2={pA.y}
            stroke={MATH_COLORS.circle}
            strokeWidth={1}
            strokeDasharray="2,2"
          />

          {/* 直径推导 Rt△C'BC 辅助线 */}
          {(() => {
            const pDiamCPrime = mathToDesign(
              sasResult.diameterPointA.x,
              sasResult.diameterPointA.y,
              scale,
            );
            const dirX = pDiamCPrime.x - pCircumCenter.x;
            const dirY = pDiamCPrime.y - pCircumCenter.y;
            const len = Math.hypot(dirX, dirY) || 1;
            const offX = (dirX / len) * fontScale(16);
            const offY = (dirY / len) * fontScale(16);

            return (
              <g className="sine-diameter-proof">
                {/* 直径 C-C' */}
                <line
                  x1={pC.x}
                  y1={pC.y}
                  x2={pDiamCPrime.x}
                  y2={pDiamCPrime.y}
                  stroke={MATH_COLORS.tangentLine}
                  strokeWidth={2}
                  strokeDasharray="4,4"
                />
                {/* 直角三角形另一边 C'-B */}
                <line
                  x1={pDiamCPrime.x}
                  y1={pDiamCPrime.y}
                  x2={pB.x}
                  y2={pB.y}
                  stroke={MATH_COLORS.tangentLine}
                  strokeWidth={1.5}
                  strokeDasharray="3,3"
                />
                {/* 对径点 C' */}
                <circle
                  cx={pDiamCPrime.x}
                  cy={pDiamCPrime.y}
                  r={fontScale(4)}
                  fill={MATH_COLORS.tangentLine}
                />
                <text
                  x={pDiamCPrime.x + offX}
                  y={pDiamCPrime.y + offY}
                  textAnchor={offX >= 0 ? "start" : "end"}
                  fill={MATH_COLORS.tangentLine}
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                  paintOrder="stroke"
                  stroke="white"
                  strokeWidth={fontScale(4)}
                  strokeLinejoin="round"
                >
                  C'(直径对径点, 2R)
                </text>
                <text
                  x={pDiamCPrime.x + offX}
                  y={pDiamCPrime.y + offY + fontScale(14)}
                  textAnchor={offX >= 0 ? "start" : "end"}
                  fill={MATH_COLORS.paramPrimary}
                  fontSize={fontScale(10)}
                  paintOrder="stroke"
                  stroke="white"
                  strokeWidth={fontScale(4)}
                  strokeLinejoin="round"
                >
                  ∠C' = ∠A = {anglesDeg.A.toFixed(1)}°
                </text>
              </g>
            );
          })()}
        </g>
      )}

      {/* ── 专题二：余弦定理与射影定理专属场景 (Cosine) ── */}
      {studyMode === "cosine" && (
        <g className="cosine-mode-scene">
          {/* 钝角三角形时的底边延长虚线 */}
          {pFootD.x < pB.x && (
            <line
              x1={pFootD.x}
              y1={pFootD.y}
              x2={pB.x}
              y2={pB.y}
              stroke={CANVAS_COLORS.grid}
              strokeWidth={1.5}
              strokeDasharray="3,3"
            />
          )}
          {pFootD.x > pC.x && (
            <line
              x1={pC.x}
              y1={pC.y}
              x2={pFootD.x}
              y2={pFootD.y}
              stroke={CANVAS_COLORS.grid}
              strokeWidth={1.5}
              strokeDasharray="3,3"
            />
          )}

          {/* 顶点 A 向水平底边 BC 所作垂线 AD (纯垂直竖直向下) */}
          <line
            x1={pA.x}
            y1={pA.y}
            x2={pFootD.x}
            y2={pFootD.y}
            stroke={MATH_COLORS.tangentLine}
            strokeWidth={2}
            strokeDasharray="4,3"
          />
          {/* 垂足直角标记 (底线上方) */}
          <path
            d={`M ${pFootD.x - fontScale(8)} ${pFootD.y} L ${pFootD.x - fontScale(8)} ${pFootD.y - fontScale(8)} L ${pFootD.x} ${pFootD.y - fontScale(8)}`}
            fill="none"
            stroke={MATH_COLORS.tangentLine}
            strokeWidth={1.5}
          />
          {/* 垂足点 D */}
          <circle
            cx={pFootD.x}
            cy={pFootD.y}
            r={fontScale(3.5)}
            fill={MATH_COLORS.tangentLine}
          />
          {/* 垂足字母 D: 置于底线上方右侧 */}
          <text
            x={pFootD.x + fontScale(8)}
            y={pFootD.y - fontScale(6)}
            textAnchor="start"
            fill={MATH_COLORS.tangentLine}
            fontSize={fontScale(10)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={fontScale(3.5)}
            strokeLinejoin="round"
          >
            D
          </text>
          {/* 高线长度标注于竖直垂线中段左侧 */}
          <text
            x={pFootD.x - fontScale(8)}
            y={(pA.y + pFootD.y) / 2}
            textAnchor="end"
            fill={MATH_COLORS.tangentLine}
            fontSize={fontScale(10)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={fontScale(3.5)}
            strokeLinejoin="round"
          >
            hₐ = {altitudeA.length.toFixed(2)}
          </text>

          {/* 射影定理底边彩色分段高亮 (左右各自独立居中，绝不与垂足冲突) */}
          <g className="projection-theorem-segments">
            {/* BD 段: c * cosB (翠绿) */}
            <line
              x1={pB.x}
              y1={pB.y + fontScale(10)}
              x2={pFootD.x}
              y2={pFootD.y + fontScale(10)}
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={3}
            />
            <text
              x={(pB.x + pFootD.x) / 2}
              y={pB.y + fontScale(24)}
              textAnchor="middle"
              fill={MATH_COLORS.paramTertiary}
              fontSize={fontScale(10)}
              fontWeight="bold"
              paintOrder="stroke"
              stroke="white"
              strokeWidth={fontScale(3.5)}
              strokeLinejoin="round"
            >
              c·cosB = {sasResult.projections.cCosB.toFixed(2)}
            </text>

            {/* DC 段: b * cosC (暖橙) */}
            <line
              x1={pFootD.x}
              y1={pFootD.y + fontScale(10)}
              x2={pC.x}
              y2={pC.y + fontScale(10)}
              stroke={MATH_COLORS.paramSecondary}
              strokeWidth={3}
            />
            <text
              x={(pFootD.x + pC.x) / 2}
              y={pC.y + fontScale(24)}
              textAnchor="middle"
              fill={MATH_COLORS.paramSecondary}
              fontSize={fontScale(10)}
              fontWeight="bold"
              paintOrder="stroke"
              stroke="white"
              strokeWidth={fontScale(3.5)}
              strokeLinejoin="round"
            >
              b·cosC = {sasResult.projections.bCosC.toFixed(2)}
            </text>
          </g>
        </g>
      )}

      {/* ── 专题三：面积推导专属几何场景 (Area) ── */}
      {studyMode === "area" && (
        <g className="area-mode-scene">
          {/* 内切圆 (S = r * p) */}
          {inradiusPx > 2 && (
            <g>
              <circle
                cx={pIncenter.x}
                cy={pIncenter.y}
                r={inradiusPx}
                fill={withAlpha(MATH_COLORS.complexNum, 0.08)}
                stroke={MATH_COLORS.complexNum}
                strokeWidth={1.5}
              />
              {/* 内心 I 标注：置于内切圆中心偏上 */}
              <circle
                cx={pIncenter.x}
                cy={pIncenter.y}
                r={fontScale(3.5)}
                fill={MATH_COLORS.complexNum}
              />
              <text
                x={pIncenter.x}
                y={pIncenter.y - fontScale(6)}
                textAnchor="middle"
                fill={MATH_COLORS.complexNum}
                fontSize={fontScale(11)}
                fontWeight="bold"
                paintOrder="stroke"
                stroke="white"
                strokeWidth={fontScale(3.5)}
                strokeLinejoin="round"
              >
                I (r={incircle.radius.toFixed(2)})
              </text>
            </g>
          )}

          {/* 钝角时底边延长线 */}
          {pFootD.x < pB.x && (
            <line
              x1={pFootD.x}
              y1={pFootD.y}
              x2={pB.x}
              y2={pB.y}
              stroke={CANVAS_COLORS.grid}
              strokeWidth={1.5}
              strokeDasharray="3,3"
            />
          )}
          {pFootD.x > pC.x && (
            <line
              x1={pC.x}
              y1={pC.y}
              x2={pFootD.x}
              y2={pFootD.y}
              stroke={CANVAS_COLORS.grid}
              strokeWidth={1.5}
              strokeDasharray="3,3"
            />
          )}

          {/* 高线 AD (S = 0.5 * a * ha) */}
          <line
            x1={pA.x}
            y1={pA.y}
            x2={pFootD.x}
            y2={pFootD.y}
            stroke={MATH_COLORS.tangentLine}
            strokeWidth={2}
            strokeDasharray="4,3"
          />
          {/* 垂足直角标记 (底线上方) */}
          <path
            d={`M ${pFootD.x - fontScale(8)} ${pFootD.y} L ${pFootD.x - fontScale(8)} ${pFootD.y - fontScale(8)} L ${pFootD.x} ${pFootD.y - fontScale(8)}`}
            fill="none"
            stroke={MATH_COLORS.tangentLine}
            strokeWidth={1.5}
          />
          <circle
            cx={pFootD.x}
            cy={pFootD.y}
            r={fontScale(3.5)}
            fill={MATH_COLORS.tangentLine}
          />
          {/* 垂足字母 D */}
          <text
            x={pFootD.x + fontScale(8)}
            y={pFootD.y - fontScale(6)}
            textAnchor="start"
            fill={MATH_COLORS.tangentLine}
            fontSize={fontScale(10)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={fontScale(3.5)}
            strokeLinejoin="round"
          >
            D
          </text>
          {/* 高线长度标注于竖直垂线中段左侧 */}
          <text
            x={pFootD.x - fontScale(8)}
            y={(pA.y + pFootD.y) / 2}
            textAnchor="end"
            fill={MATH_COLORS.tangentLine}
            fontSize={fontScale(10)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={fontScale(3.5)}
            strokeLinejoin="round"
          >
            hₐ = {altitudeA.length.toFixed(2)}
          </text>
        </g>
      )}

      {/* ── 专题四：角平分线与中线专属几何场景 (Bisector) ── */}
      {studyMode === "bisector" && (
        <g className="bisector-mode-scene">
          {(() => {
            const pD = mathToDesign(
              bisectorResult.pointD.x,
              bisectorResult.pointD.y,
              scale,
            );
            const pM = mathToDesign(
              bisectorResult.pointM.x,
              bisectorResult.pointM.y,
              scale,
            );

            const distMD = Math.abs(pD.x - pM.x);
            const isClose = distMD < 36;

            return (
              <>
                {/* 分三角形 ABD 与 ACD 阴影 */}
                <polygon
                  points={`${pA.x},${pA.y} ${pB.x},${pB.y} ${pD.x},${pD.y}`}
                  fill={withAlpha(MATH_COLORS.paramTertiary, 0.08)}
                />
                <polygon
                  points={`${pA.x},${pA.y} ${pC.x},${pC.y} ${pD.x},${pD.y}`}
                  fill={withAlpha(MATH_COLORS.paramSecondary, 0.08)}
                />

                {/* 中线 AM (虚线) */}
                <line
                  x1={pA.x}
                  y1={pA.y}
                  x2={pM.x}
                  y2={pM.y}
                  stroke={MATH_COLORS.complexNum}
                  strokeWidth={2}
                  strokeDasharray="4,3"
                />
                <circle
                  cx={pM.x}
                  cy={pM.y}
                  r={fontScale(3.5)}
                  fill={MATH_COLORS.complexNum}
                />
                <text
                  x={pM.x}
                  y={isClose ? pM.y - fontScale(8) : pM.y + fontScale(16)}
                  textAnchor="middle"
                  fill={MATH_COLORS.complexNum}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                  paintOrder="stroke"
                  stroke="white"
                  strokeWidth={fontScale(3.5)}
                  strokeLinejoin="round"
                >
                  M(中点, mₐ={bisectorResult.medianLength.toFixed(2)})
                </text>

                {/* 角平分线 AD (实线) */}
                <line
                  x1={pA.x}
                  y1={pA.y}
                  x2={pD.x}
                  y2={pD.y}
                  stroke={MATH_COLORS.tangentLine}
                  strokeWidth={2.5}
                />
                <circle
                  cx={pD.x}
                  cy={pD.y}
                  r={fontScale(4)}
                  fill={MATH_COLORS.tangentLine}
                />
                <text
                  x={pD.x}
                  y={isClose ? pD.y + fontScale(26) : pD.y + fontScale(20)}
                  textAnchor="middle"
                  fill={MATH_COLORS.tangentLine}
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                  paintOrder="stroke"
                  stroke="white"
                  strokeWidth={fontScale(3.5)}
                  strokeLinejoin="round"
                >
                  D(分角线, tₐ={bisectorResult.bisectorLength.toFixed(2)})
                </text>

                {/* 比例标注 BD : DC */}
                <text
                  x={(pB.x + pD.x) / 2}
                  y={(pB.y + pD.y) / 2 - fontScale(6)}
                  textAnchor="middle"
                  fill={MATH_COLORS.paramTertiary}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                  paintOrder="stroke"
                  stroke="white"
                  strokeWidth={fontScale(3.5)}
                  strokeLinejoin="round"
                >
                  BD={bisectorResult.sideBD.toFixed(2)}
                </text>
                <text
                  x={(pC.x + pD.x) / 2}
                  y={(pC.y + pD.y) / 2 - fontScale(6)}
                  textAnchor="middle"
                  fill={MATH_COLORS.paramSecondary}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                  paintOrder="stroke"
                  stroke="white"
                  strokeWidth={fontScale(3.5)}
                  strokeLinejoin="round"
                >
                  DC={bisectorResult.sideDC.toFixed(2)}
                </text>
              </>
            );
          })()}
        </g>
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
      <circle
        cx={pB.x}
        cy={pB.y}
        r={fontScale(5)}
        fill={MATH_COLORS.paramSecondary}
      />
      <circle
        cx={pC.x}
        cy={pC.y}
        r={fontScale(5)}
        fill={MATH_COLORS.paramTertiary}
      />

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
