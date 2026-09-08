/**
 * src/features/sequence/components/SequenceArithmeticLinearScene.tsx
 * 等差数列 - 专题 A：通项与一次函数（斜率三角形、变号零点、单调性）
 */
import { CoordinateGrid, FunctionGraph } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale, ViewportInfo } from "@/hooks";
import { toSub } from "./SequenceText";
import { useSequenceParams } from "./useSequenceData";

interface ArithmeticSubSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  highlightN?: number;
  onSelectN?: (n: number) => void;
}

export function SequenceArithmeticLinearScene({
  params,
  scale,
  fontScale,
  highlightN = 1,
  onSelectN,
}: ArithmeticSubSceneProps) {
  const { d, N, arithData } = useSequenceParams(params);

  const { terms, lineFn, zeroPointExact } = arithData;

  const zPt =
    zeroPointExact !== null ? mathToDesign(zeroPointExact, 0, scale) : null;

  // 选择在项数居中的相邻两项之间绘制斜率三角形 (避免首尾遮挡)
  const slopeN = Math.min(2, Math.max(1, N - 1));
  const termA = terms[slopeN - 1];
  const termB = terms[slopeN];
  const ptSlope1 = termA ? mathToDesign(slopeN, termA.an, scale) : null;
  const ptSlope2 = termB ? mathToDesign(slopeN + 1, termB.an, scale) : null;
  const ptSlopeCorner = termA
    ? mathToDesign(slopeN + 1, termA.an, scale)
    : null;

  return (
    <g className="sequence-scene-arithmetic-linear">
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. 一次函数连续直线背景 */}
      <FunctionGraph
        fn={lineFn}
        scale={scale}
        color={MATH_COLORS.sequence}
        strokeWidth={1.75}
        strokeDasharray="4,4"
      />

      {/* 2. 斜率直角三角形 (半透明背景，文字放在斜边侧上方避开柱子) */}
      {ptSlope1 && ptSlope2 && ptSlopeCorner && Math.abs(d) > 1e-9 && (
        <g className="slope-triangle">
          <polygon
            points={`${ptSlope1.x},${ptSlope1.y} ${ptSlopeCorner.x},${ptSlopeCorner.y} ${ptSlope2.x},${ptSlope2.y}`}
            fill={withAlpha(MATH_COLORS.paramSecondary, 0.18)}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.2}
            strokeDasharray="3,2"
          />
          {/* 仅在斜边上方放一个整合清晰的斜率标签，避免 Δn/Δa 四处撞车 */}
          <text
            x={(ptSlope1.x + ptSlope2.x) / 2}
            y={Math.min(ptSlope1.y, ptSlope2.y) - 10}
            textAnchor="middle"
            fontSize={fontScale(9.5)}
            fill={MATH_COLORS.paramSecondary}
            fontWeight="bold"
          >
            斜率 k = Δa/Δn = {d > 0 ? `+${d}` : `${d}`}
          </text>
        </g>
      )}

      {/* 3. 变号零点指示 (标在零点正上方，不遮挡 x 轴刻度) */}
      {zPt &&
        zeroPointExact !== null &&
        zeroPointExact >= 0.5 &&
        zeroPointExact <= N + 1.5 && (
          <g className="zero-point-indicator">
            <circle
              cx={zPt.x}
              cy={zPt.y}
              r={4}
              fill={MATH_COLORS.white}
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={2}
            />
            <text
              x={zPt.x}
              y={zPt.y - 12}
              textAnchor="middle"
              fontSize={fontScale(9)}
              fill={MATH_COLORS.paramTertiary}
              fontWeight="bold"
            >
              零点 x₀={zeroPointExact.toFixed(2)}
            </text>
          </g>
        )}

      {/* 4. 各项散点与柱状图 */}
      {terms.map((t) => {
        const pt0 = mathToDesign(t.n - 0.2, 0, scale);
        const pt1 = mathToDesign(t.n + 0.2, t.an, scale);
        const x = Math.min(pt0.x, pt1.x);
        const y = Math.min(pt0.y, pt1.y);
        const width = Math.abs(pt1.x - pt0.x);
        const height = Math.abs(pt1.y - pt0.y);
        const isHighlighted = t.n === highlightN;
        const posAn = mathToDesign(t.n, t.an, scale);

        return (
          <g
            key={`lin-term-${t.n}`}
            onClick={() => onSelectN?.(t.n)}
            className="cursor-pointer"
          >
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill={withAlpha(
                isHighlighted
                  ? MATH_COLORS.sequenceHighlight
                  : t.an >= 0
                    ? MATH_COLORS.sequence
                    : MATH_COLORS.paramPrimary,
                0.25,
              )}
              stroke={
                isHighlighted
                  ? MATH_COLORS.sequenceHighlight
                  : t.an >= 0
                    ? MATH_COLORS.sequence
                    : MATH_COLORS.paramPrimary
              }
              strokeWidth={isHighlighted ? 2 : 1.2}
              rx={2}
            />
            <circle
              cx={posAn.x}
              cy={posAn.y}
              r={isHighlighted ? 4.5 : 3}
              fill={t.an >= 0 ? MATH_COLORS.sequence : MATH_COLORS.paramPrimary}
              stroke={MATH_COLORS.white}
              strokeWidth={1.2}
            />
            <text
              x={posAn.x}
              y={t.an >= 0 ? posAn.y - 7 : posAn.y + 14}
              textAnchor="middle"
              fontSize={fontScale(9)}
              fill={t.an >= 0 ? MATH_COLORS.sequence : MATH_COLORS.paramPrimary}
              fontWeight={isHighlighted ? "bold" : "normal"}
            >
              a{toSub(t.n)} = {t.an.toFixed(1)}
            </text>
          </g>
        );
      })}
    </g>
  );
}
