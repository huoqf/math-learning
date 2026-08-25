import { MathPoint } from "@/components/Math";
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
      {/* 纯几何范式：移除笛卡尔坐标系 */}

      {/* 射线 Ax 方向基准虚线 */}
      <line
        x1={pA.x}
        y1={pA.y}
        x2={pRayEnd.x}
        y2={pRayEnd.y}
        stroke={CANVAS_COLORS.labelTextLight}
        strokeWidth={1.5}
        strokeDasharray="4,4"
      />
      <text
        x={pRayEnd.x + fontScale(8)}
        y={pRayEnd.y - fontScale(4)}
        fill={CANVAS_COLORS.labelTextLight}
        fontSize={fontScale(11)}
        fontStyle="italic"
      >
        x
      </text>

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

      {/* 角 A 角弧 */}
      {(() => {
        const arcR = fontScale(22);
        const startX = pA.x + arcR;
        const startY = pA.y;
        const endX = pA.x + arcR * Math.cos(radA);
        const endY = pA.y + arcR * Math.sin(radA);
        const midAng = radA / 2;
        const textR = arcR + fontScale(12);

        return (
          <g className="angle-A-arc-ssa">
            <path
              d={`M ${startX} ${startY} A ${arcR} ${arcR} 0 0 1 ${endX} ${endY}`}
              fill="none"
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={1.8}
            />
            <text
              x={pA.x + textR * Math.cos(midAng)}
              y={pA.y + textR * Math.sin(midAng) + fontScale(3)}
              textAnchor="middle"
              fill={MATH_COLORS.paramPrimary}
              fontSize={fontScale(10)}
              fontWeight="bold"
              paintOrder="stroke"
              stroke="white"
              strokeWidth={fontScale(3.5)}
              strokeLinejoin="round"
            >
              {angleA}°
            </text>
          </g>
        );
      })()}

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
      {/* 垂足直角标记 (在 Rt△ACD 内部) */}
      {(() => {
        const markSize = fontScale(8);
        const xOffset = pFootD.x - markSize * Math.cos(radA);
        const yOffset = pFootD.y - markSize * Math.sin(radA);
        const perpX = xOffset + markSize * Math.sin(radA);
        const perpY = yOffset - markSize * Math.cos(radA);
        return (
          <path
            d={`M ${xOffset} ${yOffset} L ${perpX} ${perpY} L ${pFootD.x + markSize * Math.sin(radA)} ${pFootD.y - markSize * Math.cos(radA)}`}
            fill="none"
            stroke={MATH_COLORS.tangentLine}
            strokeWidth={1.5}
          />
        );
      })()}
      <text
        x={(pC.x + pFootD.x) / 2 + fontScale(10)}
        y={(pC.y + pFootD.y) / 2}
        fill={MATH_COLORS.tangentLine}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(3.5)}
        strokeLinejoin="round"
      >
        h
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
            {/* 解顶点 B1 / B2 (带下标) */}
            <text
              x={pB.x}
              y={pB.y - fontScale(12)}
              textAnchor="middle"
              fill={MATH_COLORS.function}
              fontSize={fontScale(14)}
              fontWeight="bold"
              fontStyle="italic"
              paintOrder="stroke"
              stroke="white"
              strokeWidth={fontScale(4)}
              strokeLinejoin="round"
            >
              {solutions.length === 2 ? (
                <>
                  B
                  <tspan fontSize={fontScale(10)} dy={fontScale(4)}>
                    {idx + 1}
                  </tspan>
                </>
              ) : (
                "B"
              )}
            </text>
          </g>
        );
      })}

      {/* 固定顶点 A, C 标注 (纯正斜体字母) */}
      <text
        x={pA.x - fontScale(10)}
        y={pA.y + fontScale(18)}
        textAnchor="end"
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
        x={pC.x + fontScale(10)}
        y={pC.y + fontScale(18)}
        textAnchor="start"
        fill={MATH_COLORS.paramSecondary}
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
