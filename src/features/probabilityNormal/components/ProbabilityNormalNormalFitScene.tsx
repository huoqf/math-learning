import { InteractivePoint } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { SceneScale, ViewportInfo } from "@/hooks";
import { mathToDesign } from "@/utils/coordinate";
import { normalPdf } from "@/math/probabilityNormal";
import type { HistogramBin } from "@/math/probabilityNormal";

interface ProbabilityNormalNormalFitSceneProps {
  bins: HistogramBin[];
  shadowPathD: string;
  curvePathD: string;
  mu: number;
  safeSigma: number;
  blend: number;
  x1: number;
  x2: number;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  onDragX1: (mathPt: { x: number; y: number }) => void;
  onDragX2: (mathPt: { x: number; y: number }) => void;
}

export function ProbabilityNormalNormalFitScene({
  bins,
  shadowPathD,
  curvePathD,
  mu,
  safeSigma,
  blend,
  x1,
  x2,
  scale,
  vp,
  fontScale,
  onDragX1,
  onDragX2,
}: ProbabilityNormalNormalFitSceneProps) {
  return (
    <g>
      {/* 区间面积阴影 [x1, x2] */}
      <path
        d={shadowPathD}
        fill={withAlpha(MATH_COLORS.paramTertiary, 0.35)}
        stroke={MATH_COLORS.paramTertiary}
        strokeWidth={1.5}
        strokeDasharray="4 2"
      />

      {/* 直方图柱带透明过渡 */}
      {bins.map((bin) => {
        const leftTop = mathToDesign(bin.xStart, bin.density, scale);
        const rightBottom = mathToDesign(bin.xEnd, 0, scale);
        const rectWidth = Math.max(1, rightBottom.x - leftTop.x);
        const rectHeight = Math.max(1, rightBottom.y - leftTop.y);

        return (
          <rect
            key={bin.index}
            x={leftTop.x}
            y={leftTop.y}
            width={rectWidth}
            height={rectHeight}
            fill={withAlpha(MATH_COLORS.barFill, 0.45 * (1 - blend * 0.5))}
            stroke={withAlpha(MATH_COLORS.barBorder, 0.8 * (1 - blend * 0.3))}
            strokeWidth={1.2}
          />
        );
      })}

      {/* 正态拟合曲线 */}
      <path
        d={curvePathD}
        fill="none"
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />

      {/* 顶点高度与参数标注 */}
      {(() => {
        const peakY = normalPdf(mu, mu, safeSigma);
        const muPt = mathToDesign(mu, peakY, scale);
        // 防止贴画布顶
        const isNearTop = muPt.y < 40;
        const textY = isNearTop ? muPt.y + fontScale(16) : muPt.y - 8;

        return (
          <g>
            <circle
              cx={muPt.x}
              cy={muPt.y}
              r={4}
              fill={MATH_COLORS.paramPrimary}
            />
            <text
              x={muPt.x}
              y={textY}
              fontSize={fontScale(11)}
              fill={MATH_COLORS.paramPrimary}
              textAnchor="middle"
              className="font-bold select-none drop-shadow-sm"
            >
              f(μ) = {peakY.toFixed(3)}
            </text>
          </g>
        );
      })()}

      {/* x1, x2 拖拽控制点 */}
      <InteractivePoint
        cx={x1}
        cy={0}
        scale={scale}
        vp={vp}
        onDrag={onDragX1}
        color={MATH_COLORS.paramTertiary}
        label={`x₁ = ${x1.toFixed(1)}`}
        fontScale={fontScale}
      />
      <InteractivePoint
        cx={x2}
        cy={0}
        scale={scale}
        vp={vp}
        onDrag={onDragX2}
        color={MATH_COLORS.paramTertiary}
        label={`x₂ = ${x2.toFixed(1)}`}
        fontScale={fontScale}
      />
    </g>
  );
}
