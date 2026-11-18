import { MATH_COLORS, withAlpha } from "@/theme";
import type { SceneScale } from "@/hooks";
import { mathToDesign } from "@/utils/coordinate";

interface StandardZAxisRulerProps {
  mu: number;
  safeSigma: number;
  scale: SceneScale;
  fontScale: (size: number) => number;
}

/**
 * 标准化变量变换同步标尺：Z = (X - μ) / σ
 * 平行置于横轴 X 下方，随 μ 平移、随 σ 伸缩，建立向标准正态 N(0,1) 转化的直观映射
 */
export function StandardZAxisRuler({
  mu,
  safeSigma,
  scale,
  fontScale,
}: StandardZAxisRulerProps) {
  const rulerY = -0.056;
  const xMinVis = scale.xMin ?? -8;
  const xMaxVis = scale.xMax ?? 8;
  const startX = Math.max(xMinVis + 0.4, mu - 3 * safeSigma);
  const endX = Math.min(xMaxVis - 0.4, mu + 3 * safeSigma);
  const pStart = mathToDesign(startX, rulerY, scale);
  const pEnd = mathToDesign(endX, rulerY, scale);

  const zTicks = [-3, -2, -1, 0, 1, 2, 3];

  const isLeftTight = pStart.x < 108;

  return (
    <g key="standard-z-axis-ruler">
      <line
        x1={pStart.x}
        y1={pStart.y}
        x2={pEnd.x}
        y2={pEnd.y}
        stroke={withAlpha(MATH_COLORS.function, 0.7)}
        strokeWidth={1.3}
      />
      <text
        x={isLeftTight ? Math.max(24, pStart.x) : pStart.x - 8}
        y={isLeftTight ? pStart.y - 8 : pStart.y + 3}
        fontSize={fontScale(9.5)}
        fontWeight="bold"
        fill={MATH_COLORS.function}
        textAnchor={isLeftTight ? "start" : "end"}
      >
        Z = (X-μ)/σ
      </text>
      {zTicks.map((z) => {
        const xVal = mu + z * safeSigma;
        if (xVal < xMinVis + 0.2 || xVal > xMaxVis - 0.2) return null;
        const pt = mathToDesign(xVal, rulerY, scale);
        return (
          <g key={`z-tick-${z}`}>
            <line
              x1={pt.x}
              y1={pt.y - 3}
              x2={pt.x}
              y2={pt.y + 3}
              stroke={MATH_COLORS.function}
              strokeWidth={1.3}
            />
            <text
              x={pt.x}
              y={pt.y + 12}
              fontSize={fontScale(9)}
              fontWeight={z === 0 ? "bold" : "normal"}
              fill={z === 0 ? MATH_COLORS.paramPrimary : MATH_COLORS.function}
              textAnchor="middle"
            >
              {z === 0 ? "0" : z > 0 ? `+${z}` : `${z}`}
            </text>
          </g>
        );
      })}
    </g>
  );
}
