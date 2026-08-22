import { InteractivePoint } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { SceneScale, ViewportInfo } from "@/hooks";
import { mathToDesign } from "@/utils/coordinate";
import { normalPdf } from "@/math/probabilityNormal";

interface SymIntervalData {
  xSym: number;
  leftX: number;
  rightX: number;
  centerProb: number;
  tailProb: number;
}

interface ProbabilityNormalSigmaRuleSceneProps {
  curvePathD: string;
  leftTailShadowPathD: string;
  rightTailShadowPathD: string;
  symData: SymIntervalData;
  mu: number;
  safeSigma: number;
  x0: number;
  showSigmaIntervals: boolean;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  onDragX0: (mathPt: { x: number; y: number }) => void;
}

export function ProbabilityNormalSigmaRuleScene({
  curvePathD,
  leftTailShadowPathD,
  rightTailShadowPathD,
  symData,
  mu,
  safeSigma,
  x0,
  showSigmaIntervals,
  scale,
  vp,
  fontScale,
  onDragX0,
}: ProbabilityNormalSigmaRuleSceneProps) {
  return (
    <g>
      {/* 1. 3-σ 区间高亮 (3σ -> 2σ -> 1σ 梯级嵌套) */}
      {showSigmaIntervals && (
        <g>
          {/* 3σ 区间 (99.73%) */}
          {(() => {
            const s3L = mu - 3 * safeSigma;
            const s3R = mu + 3 * safeSigma;
            const points: string[] = [];
            const start = mathToDesign(s3L, 0, scale);
            points.push(`M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`);
            for (let x = s3L; x <= s3R; x += 0.04) {
              const pt = mathToDesign(x, normalPdf(x, mu, safeSigma), scale);
              points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
            }
            const end = mathToDesign(s3R, 0, scale);
            points.push(`L ${end.x.toFixed(1)} ${end.y.toFixed(1)} Z`);
            return (
              <path
                d={points.join(" ")}
                fill={MATH_COLORS.sigma3Fill}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            );
          })()}

          {/* 2σ 区间 (95.45%) */}
          {(() => {
            const s2L = mu - 2 * safeSigma;
            const s2R = mu + 2 * safeSigma;
            const points: string[] = [];
            const start = mathToDesign(s2L, 0, scale);
            points.push(`M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`);
            for (let x = s2L; x <= s2R; x += 0.04) {
              const pt = mathToDesign(x, normalPdf(x, mu, safeSigma), scale);
              points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
            }
            const end = mathToDesign(s2R, 0, scale);
            points.push(`L ${end.x.toFixed(1)} ${end.y.toFixed(1)} Z`);
            return (
              <path
                d={points.join(" ")}
                fill={MATH_COLORS.sigma2Fill}
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={1}
                strokeDasharray="4 2"
              />
            );
          })()}

          {/* 1σ 区间 (68.27%) */}
          {(() => {
            const s1L = mu - safeSigma;
            const s1R = mu + safeSigma;
            const points: string[] = [];
            const start = mathToDesign(s1L, 0, scale);
            points.push(`M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`);
            for (let x = s1L; x <= s1R; x += 0.04) {
              const pt = mathToDesign(x, normalPdf(x, mu, safeSigma), scale);
              points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
            }
            const end = mathToDesign(s1R, 0, scale);
            points.push(`L ${end.x.toFixed(1)} ${end.y.toFixed(1)} Z`);
            return (
              <path
                d={points.join(" ")}
                fill={MATH_COLORS.sigma1Fill}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />
            );
          })()}
        </g>
      )}

      {/* 2. 对称镜像双色阴影可视化 (P(X ≤ min) = P(X ≥ max)) */}
      {!showSigmaIntervals && (
        <g>
          {/* 左侧尾部阴影 */}
          {leftTailShadowPathD && (
            <path
              d={leftTailShadowPathD}
              fill={withAlpha(MATH_COLORS.paramTertiary, 0.35)}
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={1.5}
            />
          )}
          {/* 右侧对称镜像尾部阴影 */}
          {rightTailShadowPathD && (
            <path
              d={rightTailShadowPathD}
              fill={withAlpha(MATH_COLORS.setB, 0.35)}
              stroke={MATH_COLORS.setB}
              strokeWidth={1.5}
            />
          )}

          {/* 对称中间区间高度连线与标注 (置于曲线水平高位，避免遮挡横轴) */}
          {(() => {
            const heightY = normalPdf(symData.leftX, mu, safeSigma);
            const leftPt = mathToDesign(symData.leftX, heightY, scale);
            const rightPt = mathToDesign(symData.rightX, heightY, scale);
            const midX = (leftPt.x + rightPt.x) / 2;

            return (
              <g>
                <line
                  x1={leftPt.x}
                  y1={leftPt.y}
                  x2={rightPt.x}
                  y2={rightPt.y}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                <circle
                  cx={leftPt.x}
                  cy={leftPt.y}
                  r={3}
                  fill={MATH_COLORS.paramSecondary}
                />
                <circle
                  cx={rightPt.x}
                  cy={rightPt.y}
                  r={3}
                  fill={MATH_COLORS.paramSecondary}
                />
                <text
                  x={midX}
                  y={leftPt.y - 8}
                  fontSize={fontScale(11)}
                  fill={MATH_COLORS.paramSecondary}
                  textAnchor="middle"
                  className="font-bold select-none drop-shadow-sm"
                >
                  对称区间 P = {(symData.centerProb * 100).toFixed(1)}%
                </text>
              </g>
            );
          })()}
        </g>
      )}

      {/* 正态曲线主体 */}
      <path
        d={curvePathD}
        fill="none"
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 对称轴 */}
      {(() => {
        const peakY = normalPdf(mu, mu, safeSigma);
        const muPt = mathToDesign(mu, peakY, scale);
        const axisPt = mathToDesign(mu, 0, scale);
        const isNearTop = muPt.y < 40;
        const textY = isNearTop ? muPt.y + fontScale(16) : muPt.y - 8;

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
            <text
              x={muPt.x}
              y={textY}
              fontSize={fontScale(11)}
              fill={MATH_COLORS.paramPrimary}
              textAnchor="middle"
              className="font-bold select-none drop-shadow-sm"
            >
              μ = {mu.toFixed(1)}
            </text>
          </g>
        );
      })()}

      {/* 基准点拖拽控制点 x0 */}
      <InteractivePoint
        cx={x0}
        cy={0}
        scale={scale}
        vp={vp}
        onDrag={onDragX0}
        color={MATH_COLORS.paramTertiary}
        label={`x₀ = ${x0.toFixed(1)}`}
        fontScale={fontScale}
      />

      {/* 对称镜像点 (只读显示，标注置于点上方，避免遮挡 X 轴刻度) */}
      {(() => {
        const symPt = mathToDesign(symData.xSym, 0, scale);
        return (
          <g>
            <circle
              cx={symPt.x}
              cy={symPt.y}
              r={5}
              fill={MATH_COLORS.setB}
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
            <text
              x={symPt.x}
              y={symPt.y - fontScale(10)}
              fontSize={fontScale(10)}
              fill={MATH_COLORS.setB}
              textAnchor="middle"
              className="font-bold select-none drop-shadow-sm"
            >
              2μ-x₀ = {symData.xSym.toFixed(1)}
            </text>
          </g>
        );
      })()}
    </g>
  );
}
