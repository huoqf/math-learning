import { CoordinateGrid, MathPoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { solveSSA } from "@/math/triangleSolve";
import type { SceneScale } from "@/hooks/useSceneScale";

interface TriangleSolveSsaSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  fontScale: (v: number) => number;
}

/**
 * SSA 边角双解探究:在单一坐标系中,以 AC 为基准边,以 C 为圆心的"交点到数"构图
 * 完全独立于共享主三角形骨架,故独立成场景
 */
export function TriangleSolveSsaScene({
  params,
  scale,
  fontScale,
}: TriangleSolveSsaSceneProps) {
  const angleA = params.angleA ?? 60;
  const b = params.b ?? 5;
  const a = params.a ?? 4.5;

  const { A: pointA, C: pointC, solutions } = solveSSA(a, b, angleA);

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

            <MathPoint
              x={pB.x}
              y={pB.y}
              color={
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
