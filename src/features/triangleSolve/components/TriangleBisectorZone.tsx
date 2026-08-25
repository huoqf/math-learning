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
  const isClose = distMD < 30;

  // 计算中线与角平分线上不同 t 比例的插值点，形成纵向高度落差避让 (ma 偏上 t=0.35, ta 偏下 t=0.68)
  const posMa = {
    x: pA.x + (pM.x - pA.x) * 0.35 - fontScale(12),
    y: pA.y + (pM.y - pA.y) * 0.35,
  };
  const posTa = {
    x: pA.x + (pD.x - pA.x) * 0.68 + fontScale(12),
    y: pA.y + (pD.y - pA.y) * 0.68,
  };

  return (
    <g className="bisector-mode-scene">
      {/* 分三角形 ABD 与 ACD 柔和阴影 */}
      <polygon
        points={`${pA.x},${pA.y} ${pB.x},${pB.y} ${pD.x},${pD.y}`}
        fill={withAlpha(MATH_COLORS.paramTertiary, 0.07)}
      />
      <polygon
        points={`${pA.x},${pA.y} ${pC.x},${pC.y} ${pD.x},${pD.y}`}
        fill={withAlpha(MATH_COLORS.paramSecondary, 0.07)}
      />

      {/* ── 顶点 A 分角等角弧 (∠BAD 与 ∠CAD 各自独立且带等角记号) ── */}
      {(() => {
        const arcR = fontScale(26);
        const dirAB = { x: pB.x - pA.x, y: pB.y - pA.y };
        const dirAD = { x: pD.x - pA.x, y: pD.y - pA.y };
        const dirAC = { x: pC.x - pA.x, y: pC.y - pA.y };

        const angAB = Math.atan2(dirAB.y, dirAB.x);
        const angAD = Math.atan2(dirAD.y, dirAD.x);
        const angAC = Math.atan2(dirAC.y, dirAC.x);

        // 弧 1: AB 到 AD
        const s1X = pA.x + arcR * Math.cos(angAB);
        const s1Y = pA.y + arcR * Math.sin(angAB);
        const e1X = pA.x + arcR * Math.cos(angAD);
        const e1Y = pA.y + arcR * Math.sin(angAD);

        // 弧 2: AD 到 AC
        const s2X = pA.x + (arcR - 3) * Math.cos(angAD);
        const s2Y = pA.y + (arcR - 3) * Math.sin(angAD);
        const e2X = pA.x + (arcR - 3) * Math.cos(angAC);
        const e2Y = pA.y + (arcR - 3) * Math.sin(angAC);

        return (
          <g className="bisector-angle-arcs">
            <path
              d={`M ${s1X} ${s1Y} A ${arcR} ${arcR} 0 0 ${angAD > angAB ? 1 : 0} ${e1X} ${e1Y}`}
              fill="none"
              stroke={MATH_COLORS.tangentLine}
              strokeWidth={1.5}
            />
            <path
              d={`M ${s2X} ${s2Y} A ${arcR - 3} ${arcR - 3} 0 0 ${angAC > angAD ? 1 : 0} ${e2X} ${e2Y}`}
              fill="none"
              stroke={MATH_COLORS.tangentLine}
              strokeWidth={1.5}
            />
          </g>
        );
      })()}

      {/* ── 中线 AM (紫色虚线，偏上方 t=0.35 标注学术符号 ma) ── */}
      <line
        x1={pA.x}
        y1={pA.y}
        x2={pM.x}
        y2={pM.y}
        stroke={MATH_COLORS.complexNum}
        strokeWidth={1.8}
        strokeDasharray="4,3"
      />
      <text
        x={posMa.x}
        y={posMa.y}
        textAnchor="end"
        fill={MATH_COLORS.complexNum}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(4)}
        strokeLinejoin="round"
      >
        mₐ
      </text>

      {/* ── 角平分线 AD (实线，偏下方 t=0.68 标注学术符号 ta) ── */}
      <line
        x1={pA.x}
        y1={pA.y}
        x2={pD.x}
        y2={pD.y}
        stroke={MATH_COLORS.tangentLine}
        strokeWidth={2.2}
      />
      <text
        x={posTa.x}
        y={posTa.y}
        textAnchor="start"
        fill={MATH_COLORS.tangentLine}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(4)}
        strokeLinejoin="round"
      >
        tₐ
      </text>

      {/* ── 底边中点 M 与分角交点 D (圆点与纯字母点标) ── */}
      <circle
        cx={pM.x}
        cy={pM.y}
        r={fontScale(3.5)}
        fill={MATH_COLORS.complexNum}
      />
      <text
        x={isClose ? pM.x - fontScale(10) : pM.x}
        y={pM.y - fontScale(7)}
        textAnchor={isClose ? "end" : "middle"}
        fill={MATH_COLORS.complexNum}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(4)}
        strokeLinejoin="round"
      >
        M
      </text>

      <circle
        cx={pD.x}
        cy={pD.y}
        r={fontScale(3.5)}
        fill={MATH_COLORS.tangentLine}
      />
      <text
        x={isClose ? pD.x + fontScale(10) : pD.x}
        y={pD.y - fontScale(7)}
        textAnchor={isClose ? "start" : "middle"}
        fill={MATH_COLORS.tangentLine}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(4)}
        strokeLinejoin="round"
      >
        D
      </text>
    </g>
  );
}
