/**
 * src/features/sequence/components/SequenceArithmeticQuadraticScene.tsx
 * 等差数列 - 专题 C: 前 n 项和与二次函数极值 (连续顶点 vs 离散极值项)
 */
import { CoordinateGrid, FunctionGraph } from "@/components/Math";
import { MATH_COLORS } from "@/theme";
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

export function SequenceArithmeticQuadraticScene({
  params,
  scale,
  fontScale,
  highlightN = 1,
  onSelectN,
}: ArithmeticSubSceneProps) {
  const { d, N, arithData } = useSequenceParams(params);

  const { terms, parabolaFn, maxSnInfo, continuousAxis } = arithData;

  const axisPt =
    continuousAxis !== null ? mathToDesign(continuousAxis, 0, scale) : null;

  // 连续抛物线顶点坐标
  const vertexY = continuousAxis !== null ? parabolaFn(continuousAxis) : 0;
  const vertexPt =
    continuousAxis !== null
      ? mathToDesign(continuousAxis, vertexY, scale)
      : null;

  const isExactIntegerAxis =
    continuousAxis !== null &&
    maxSnInfo !== null &&
    Math.abs(continuousAxis - maxSnInfo.nMax) < 0.05;

  return (
    <g className="sequence-scene-arithmetic-quadratic">
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. 二次函数连续抛物线 */}
      {Math.abs(d) > 1e-9 && (
        <FunctionGraph
          fn={parabolaFn}
          scale={scale}
          color={MATH_COLORS.sequenceSum}
          strokeWidth={1.8}
          strokeDasharray="3,3"
        />
      )}

      {/* 2. 连续对称轴垂直虚线 */}
      {axisPt && continuousAxis !== null && (
        <g className="continuous-axis">
          <line
            x1={axisPt.x}
            y1={mathToDesign(0, -20, scale).y}
            x2={axisPt.x}
            y2={mathToDesign(0, vertexY + 1.5, scale).y}
            stroke={MATH_COLORS.sequenceHighlight}
            strokeWidth={1.2}
            strokeDasharray="4,3"
          />
          <text
            x={axisPt.x}
            y={mathToDesign(0, vertexY + 1.5, scale).y - 8}
            textAnchor="middle"
            fontSize={fontScale(9)}
            fill={MATH_COLORS.sequenceHighlight}
            fontWeight="bold"
          >
            对称轴 x={continuousAxis.toFixed(2)}
          </text>
        </g>
      )}

      {/* 3. 连续抛物线顶点 (非整数时单独标注) */}
      {vertexPt && !isExactIntegerAxis && (
        <g className="continuous-vertex">
          <circle
            cx={vertexPt.x}
            cy={vertexPt.y}
            r={4}
            fill={MATH_COLORS.white}
            stroke={MATH_COLORS.sequenceHighlight}
            strokeWidth={1.5}
          />
        </g>
      )}

      {/* 4. 双最值统一悬浮标题 (在对称轴上方居中显示，彻底杜绝两个散点标签互撞) */}
      {maxSnInfo?.isDual && axisPt && (
        <g className="dual-max-banner">
          <text
            x={axisPt.x}
            y={mathToDesign(0, vertexY, scale).y - 18}
            textAnchor="middle"
            fontSize={fontScale(10)}
            fill={MATH_COLORS.sequenceHighlight}
            fontWeight="bold"
          >
            双最值：S{toSub(maxSnInfo.nMax)} = S{toSub(maxSnInfo.dualN)} ={" "}
            {terms[maxSnInfo.nMax - 1]?.Sn.toFixed(1)}
          </text>
        </g>
      )}

      {/* 5. S_n 散点与极值标注 */}
      {terms.map((t) => {
        const posSn = mathToDesign(t.n, t.Sn, scale);
        const isDual = Boolean(maxSnInfo?.isDual);
        const isMaxSn =
          maxSnInfo &&
          (t.n === maxSnInfo.nMax || (isDual && t.n === maxSnInfo.dualN));
        const isHighlighted = t.n === highlightN;
        const shouldShowLabel =
          isMaxSn || isHighlighted || t.n === 1 || t.n === N;

        return (
          <g
            key={`quad-sn-${t.n}`}
            onClick={() => onSelectN?.(t.n)}
            className="cursor-pointer"
          >
            <line
              x1={posSn.x}
              y1={mathToDesign(t.n, 0, scale).y}
              x2={posSn.x}
              y2={posSn.y}
              stroke={MATH_COLORS.sequenceStem}
              strokeDasharray="2,2"
              strokeWidth={1}
            />
            <circle
              cx={posSn.x}
              cy={posSn.y}
              r={isMaxSn ? 5 : 3}
              fill={
                isMaxSn
                  ? MATH_COLORS.sequenceHighlight
                  : MATH_COLORS.sequenceSum
              }
              stroke={MATH_COLORS.white}
              strokeWidth={1.5}
            />

            {/* 普通项 / 选中项数值标注 */}
            {shouldShowLabel && !isMaxSn && (
              <text
                x={posSn.x}
                y={t.Sn >= 0 ? posSn.y - 7 : posSn.y + 13}
                textAnchor="middle"
                fontSize={fontScale(9)}
                fill={MATH_COLORS.sequenceSum}
              >
                S{toSub(t.n)} = {t.Sn.toFixed(1)}
              </text>
            )}

            {/* 极值项光环与标注 */}
            {isMaxSn && (
              <g>
                <circle
                  cx={posSn.x}
                  cy={posSn.y}
                  r={8}
                  fill="none"
                  stroke={MATH_COLORS.sequenceHighlight}
                  strokeWidth={1.5}
                  strokeDasharray="2,2"
                />

                {/* 单最值时：在正上方居中展示 */}
                {!isDual && (
                  <text
                    x={posSn.x}
                    y={posSn.y - 12}
                    textAnchor="middle"
                    fontSize={fontScale(9.5)}
                    fill={MATH_COLORS.sequenceHighlight}
                    fontWeight="bold"
                  >
                    最值项 S{toSub(t.n)} = {t.Sn.toFixed(1)}
                  </text>
                )}

                {/* 双最值时：左点向左偏、右点向右偏，仅显示紧凑下标，绝不与中间互撞 */}
                {isDual && (
                  <text
                    x={t.n === maxSnInfo.nMax ? posSn.x - 10 : posSn.x + 10}
                    y={posSn.y - 8}
                    textAnchor={t.n === maxSnInfo.nMax ? "end" : "start"}
                    fontSize={fontScale(9)}
                    fill={MATH_COLORS.sequenceHighlight}
                    fontWeight="bold"
                  >
                    S{toSub(t.n)}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
