import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import type {
  TriangleSolveResult,
  BisectorMedianResult,
} from "@/math/triangleSolve";
import type { SceneScale } from "@/hooks/useSceneScale";

interface TriangleBisectorZoneProps {
  scale: SceneScale;
  fontScale: (v: number) => number;
  sasResult: TriangleSolveResult;
  bisectorResult: BisectorMedianResult;
}

/** 角平分线与中线专属图层:叠加于共享主三角形之上 */
export function TriangleBisectorZone({
  scale,
  fontScale,
  sasResult,
  bisectorResult,
}: TriangleBisectorZoneProps) {
  const { A, B, C } = sasResult.points;

  const pA = mathToDesign(A.x, A.y, scale);
  const pB = mathToDesign(B.x, B.y, scale);
  const pC = mathToDesign(C.x, C.y, scale);

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
    <g className="bisector-mode-scene">
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
    </g>
  );
}
