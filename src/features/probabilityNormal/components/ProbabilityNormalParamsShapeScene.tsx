import { MATH_COLORS, withAlpha } from "@/theme";
import type { SceneScale } from "@/hooks";
import { mathToDesign } from "@/utils/coordinate";
import { normalPdf } from "@/math/probabilityNormal";

interface ProbabilityNormalParamsShapeSceneProps {
  curvePathD: string;
  benchmarkCurvePathD: string;
  mu: number;
  safeSigma: number;
  showBenchmarkNormal: boolean;
  scale: SceneScale;
  fontScale: (size: number) => number;
}

export function ProbabilityNormalParamsShapeScene({
  curvePathD,
  benchmarkCurvePathD,
  mu,
  safeSigma,
  showBenchmarkNormal,
  scale,
  fontScale,
}: ProbabilityNormalParamsShapeSceneProps) {
  return (
    <g>
      {/* 基准 N(0,1) 曲线对比 */}
      {showBenchmarkNormal && (
        <g>
          <path
            d={benchmarkCurvePathD}
            fill="none"
            stroke={MATH_COLORS.textMuted}
            strokeWidth={1.5}
            strokeDasharray="5 3"
          />
          {(() => {
            const benchPt = mathToDesign(0, 0.4, scale);
            return (
              <text
                x={benchPt.x + 12}
                y={benchPt.y - 4}
                fontSize={fontScale(10)}
                fill={MATH_COLORS.textMuted}
                className="select-none font-medium"
              >
                N(0, 1) 基准
              </text>
            );
          })()}
        </g>
      )}

      {/* 当前 N(μ, σ²) 曲线 */}
      <path
        d={curvePathD}
        fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 对称轴 x = μ 垂线与优化标注 */}
      {(() => {
        const peakY = normalPdf(mu, mu, safeSigma);
        const muPt = mathToDesign(mu, peakY, scale);
        const axisPt = mathToDesign(mu, 0, scale);
        const isNearTop = muPt.y < 45;
        const labelY = isNearTop ? muPt.y + fontScale(16) : muPt.y - 10;

        return (
          <g>
            <line
              x1={muPt.x}
              y1={axisPt.y}
              x2={muPt.x}
              y2={muPt.y}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={1.5}
              strokeDasharray="6 3"
            />
            <circle
              cx={muPt.x}
              cy={muPt.y}
              r={4}
              fill={MATH_COLORS.paramPrimary}
            />
            <text
              x={muPt.x}
              y={labelY}
              fontSize={fontScale(11)}
              fill={MATH_COLORS.paramPrimary}
              textAnchor="middle"
              className="font-bold select-none drop-shadow-sm"
            >
              对称轴 x = {mu.toFixed(1)} (f_max={peakY.toFixed(3)})
            </text>
          </g>
        );
      })()}

      {/* 左右拐点标注 (μ - σ, μ + σ) - 优化避让与清晰度 */}
      {(() => {
        const inflectY = normalPdf(mu - safeSigma, mu, safeSigma);
        const pL = mathToDesign(mu - safeSigma, inflectY, scale);
        const pR = mathToDesign(mu + safeSigma, inflectY, scale);
        // 根据 σ 调整文字偏移距离
        const offsetDist = Math.max(8, 12 * Math.min(1, safeSigma));

        return (
          <g>
            <circle
              cx={pL.x}
              cy={pL.y}
              r={4}
              fill={MATH_COLORS.paramSecondary}
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
            <circle
              cx={pR.x}
              cy={pR.y}
              r={4}
              fill={MATH_COLORS.paramSecondary}
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
            <text
              x={pL.x - offsetDist}
              y={pL.y - 6}
              fontSize={fontScale(10)}
              fill={MATH_COLORS.paramSecondary}
              textAnchor="end"
              className="font-bold select-none drop-shadow-sm"
            >
              拐点 μ-σ = {(mu - safeSigma).toFixed(2)}
            </text>
            <text
              x={pR.x + offsetDist}
              y={pR.y - 6}
              fontSize={fontScale(10)}
              fill={MATH_COLORS.paramSecondary}
              textAnchor="start"
              className="font-bold select-none drop-shadow-sm"
            >
              拐点 μ+σ = {(mu + safeSigma).toFixed(2)}
            </text>
          </g>
        );
      })()}
    </g>
  );
}
