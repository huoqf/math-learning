import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import type { TriangleSolveResult } from "@/math/triangleSolve";
import type { SceneScale } from "@/hooks/useSceneScale";

interface TriangleAreaZoneProps {
  scale: SceneScale;
  fontScale: (v: number) => number;
  sasResult: TriangleSolveResult;
}

/** 三角形面积与切接圆专属图层:叠加于共享主三角形之上 */
export function TriangleAreaZone({
  scale,
  fontScale,
  sasResult,
}: TriangleAreaZoneProps) {
  const { A, B, C } = sasResult.points;

  const pA = mathToDesign(A.x, A.y, scale);
  const pB = mathToDesign(B.x, B.y, scale);
  const pC = mathToDesign(C.x, C.y, scale);

  // 内切圆中心与半径 px
  const pIncenter = mathToDesign(
    sasResult.incircle.center.x,
    sasResult.incircle.center.y,
    scale,
  );
  const inradiusPx = sasResult.incircle.radius * scale.scaleX;

  // 垂足 FootD 像素坐标
  const pFootD = mathToDesign(
    sasResult.altitudeA.foot.x,
    sasResult.altitudeA.foot.y,
    scale,
  );

  return (
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
          {/* 内心 I 标注：纯正斜体字母 */}
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
            fontSize={fontScale(12)}
            fontWeight="bold"
            fontStyle="italic"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={fontScale(3.5)}
            strokeLinejoin="round"
          >
            I
          </text>
          {/* 内切圆半径虚线 (向底边 BC 垂下) 与 r 标注 */}
          <line
            x1={pIncenter.x}
            y1={pIncenter.y}
            x2={pIncenter.x}
            y2={pB.y}
            stroke={MATH_COLORS.complexNum}
            strokeWidth={1}
            strokeDasharray="2,2"
          />
          <text
            x={pIncenter.x + fontScale(6)}
            y={(pIncenter.y + pB.y) / 2}
            fill={MATH_COLORS.complexNum}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fontStyle="italic"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={fontScale(3.5)}
            strokeLinejoin="round"
          >
            r
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

      {/* 自适应垂足直角标记 (边长为固定 8px) */}
      {(() => {
        const markSize = fontScale(8);
        const isLeftOfB = pFootD.x < pB.x;
        const dir = isLeftOfB ? 1 : -1;
        const xOffset = pFootD.x + dir * markSize;
        const yOffset = pFootD.y - markSize;

        return (
          <path
            d={`M ${xOffset} ${pFootD.y} L ${xOffset} ${yOffset} L ${pFootD.x} ${yOffset}`}
            fill="none"
            stroke={MATH_COLORS.tangentLine}
            strokeWidth={1.5}
          />
        );
      })()}

      <circle
        cx={pFootD.x}
        cy={pFootD.y}
        r={fontScale(3.5)}
        fill={MATH_COLORS.tangentLine}
      />
      {/* 垂足字母 D */}
      <text
        x={pFootD.x < pB.x ? pFootD.x - fontScale(8) : pFootD.x + fontScale(8)}
        y={pFootD.y - fontScale(6)}
        textAnchor={pFootD.x < pB.x ? "end" : "start"}
        fill={MATH_COLORS.tangentLine}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fontStyle="italic"
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
        fontSize={fontScale(12)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={fontScale(4)}
        strokeLinejoin="round"
      >
        hₐ
      </text>
    </g>
  );
}
