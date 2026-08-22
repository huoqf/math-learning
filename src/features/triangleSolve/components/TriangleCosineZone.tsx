import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CANVAS_COLORS } from "@/theme";
import type { TriangleSolveResult } from "@/math/triangleSolve";
import type { SceneScale } from "@/hooks/useSceneScale";

interface TriangleCosineZoneProps {
  scale: SceneScale;
  fontScale: (v: number) => number;
  sasResult: TriangleSolveResult;
}

/** 余弦定理与射影定理专属图层:叠加于共享主三角形之上 */
export function TriangleCosineZone({
  scale,
  fontScale,
  sasResult,
}: TriangleCosineZoneProps) {
  const { A, B, C } = sasResult.points;

  const pA = mathToDesign(A.x, A.y, scale);
  const pB = mathToDesign(B.x, B.y, scale);
  const pC = mathToDesign(C.x, C.y, scale);

  // 垂足 FootD 像素坐标
  const pFootD = mathToDesign(
    sasResult.altitudeA.foot.x,
    sasResult.altitudeA.foot.y,
    scale,
  );

  return (
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
        hₐ = {sasResult.altitudeA.length.toFixed(2)}
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
  );
}
