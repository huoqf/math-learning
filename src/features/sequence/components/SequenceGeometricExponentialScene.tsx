/**
 * src/features/sequence/components/SequenceGeometricExponentialScene.tsx
 * 等比模型 - 专题 A: 通项与指数模型 (母函数、散点、公比6态)
 */
import { CoordinateGrid, FunctionGraph } from "@/components/Math";
import { MATH_COLORS } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks";
import { toSub } from "./SequenceText";
import { useSequenceParams } from "./useSequenceData";

interface SequenceGeometricExponentialSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  fontScale: (size: number) => number;
  highlightN?: number;
  onSelectN?: (n: number) => void;
}

export function SequenceGeometricExponentialScene({
  params,
  scale,
  fontScale,
  highlightN = 1,
  onSelectN,
}: SequenceGeometricExponentialSceneProps) {
  const { a1, q, N, geoData } = useSequenceParams(params);
  const { terms, expFn, limitSum } = geoData;

  const envelopePos =
    q < 0 ? (x: number) => Math.abs(a1) * Math.pow(Math.abs(q), x - 1) : null;
  const envelopeNeg =
    q < 0 ? (x: number) => -Math.abs(a1) * Math.pow(Math.abs(q), x - 1) : null;

  // toSub using top-level helper

  return (
    <g className="sequence-scene-geometric-exponential">
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. 正公比连续指数曲线背景 */}
      {expFn && (
        <FunctionGraph
          fn={expFn}
          scale={scale}
          color={MATH_COLORS.sequence}
          strokeWidth={1.75}
          strokeDasharray="4,4"
        />
      )}

      {/* 2. 负公比震荡包络线 */}
      {envelopePos && (
        <FunctionGraph
          fn={envelopePos}
          scale={scale}
          color={MATH_COLORS.sequenceStem}
          strokeWidth={1}
          strokeDasharray="2,2"
        />
      )}
      {envelopeNeg && (
        <FunctionGraph
          fn={envelopeNeg}
          scale={scale}
          color={MATH_COLORS.sequenceStem}
          strokeWidth={1}
          strokeDasharray="2,2"
        />
      )}

      {/* 3. 无穷递缩极限渐近线 y = 0 / 极限和 S_∞ */}
      {limitSum !== null && (
        <g className="limit-sum-guide">
          <line
            x1={mathToDesign(-1, limitSum, scale).x}
            y1={mathToDesign(0, limitSum, scale).y}
            x2={mathToDesign(N + 1.5, limitSum, scale).x}
            y2={mathToDesign(0, limitSum, scale).y}
            stroke={MATH_COLORS.sequenceHighlight}
            strokeWidth={1.2}
            strokeDasharray="4,3"
          />
          <text
            x={mathToDesign(N + 0.5, limitSum, scale).x}
            y={mathToDesign(0, limitSum, scale).y - 6}
            textAnchor="end"
            fontSize={fontScale(10)}
            fill={MATH_COLORS.sequenceHighlight}
            fontWeight="bold"
          >
            递缩和 S∞（拓展） = {limitSum.toFixed(2)}
          </text>
        </g>
      )}

      {/* 3.5 选中相邻项的公比缩放跃迁弧线 (a_{k+1} = a_k · q) */}
      {(() => {
        const idx = Math.min(Math.max(1, highlightN), Math.max(1, N - 1)) - 1;
        const curT = terms[idx];
        const nextT = terms[idx + 1];
        if (!curT || !nextT) return null;
        const p1 = mathToDesign(curT.n, curT.an, scale);
        const p2 = mathToDesign(nextT.n, nextT.an, scale);
        const clampedY1 = Math.max(45, p1.y);
        const clampedY2 = Math.max(45, p2.y);
        const midX = (p1.x + p2.x) / 2;
        const ctrlY = Math.max(24, Math.min(clampedY1, clampedY2) - 24);
        return (
          <g className="geo-ratio-arc">
            <path
              d={`M ${p1.x} ${clampedY1} Q ${midX} ${ctrlY} ${p2.x} ${clampedY2}`}
              fill="none"
              stroke={MATH_COLORS.paramSecondary}
              strokeWidth={1.6}
              strokeDasharray="4,3"
            />
            <text
              x={midX}
              y={ctrlY - 4}
              textAnchor="middle"
              fontSize={fontScale(9.5)}
              fill={MATH_COLORS.paramSecondary}
              fontWeight="bold"
            >
              ×q ({q})
            </text>
          </g>
        );
      })()}

      {/* 4. 散点与各项标注 (带视口边界保护) */}
      {terms.map((t) => {
        const rawPosAn = mathToDesign(t.n, t.an, scale);
        const rawPosSn = mathToDesign(t.n, t.Sn, scale);
        const isHighlighted = t.n === highlightN;
        const isKeyPoint = isHighlighted || t.n === 1 || t.n === N;

        // 视口上下边界保护
        const isAnOverflow = rawPosAn.y < 45;
        const isSnOverflow = rawPosSn.y < 45;
        const posAn = { x: rawPosAn.x, y: Math.max(45, rawPosAn.y) };
        const posSn = { x: rawPosSn.x, y: Math.max(45, rawPosSn.y) };

        const anLabelY = t.an >= 0 ? posAn.y - 8 : posAn.y + 14;
        const snTooClose = Math.abs(posAn.y - posSn.y) < 18;
        const snLabelY = snTooClose ? posSn.y + 16 : posSn.y - 8;

        return (
          <g
            key={`geo-exp-${t.n}`}
            onClick={() => onSelectN?.(t.n)}
            className="cursor-pointer"
          >
            {/* a_n 垂直虚线 */}
            <line
              x1={posAn.x}
              y1={mathToDesign(t.n, 0, scale).y}
              x2={posAn.x}
              y2={posAn.y}
              stroke={MATH_COLORS.sequenceStem}
              strokeDasharray="2,2"
              strokeWidth={1}
            />

            {/* a_n 点 */}
            <circle
              cx={posAn.x}
              cy={posAn.y}
              r={isKeyPoint ? 5 : 3.5}
              fill={
                isHighlighted
                  ? MATH_COLORS.sequenceHighlight
                  : MATH_COLORS.sequence
              }
              stroke={MATH_COLORS.white}
              strokeWidth={1.5}
            />
            {isKeyPoint && (
              <text
                x={posAn.x}
                y={anLabelY}
                textAnchor="middle"
                fontSize={fontScale(9)}
                fill={MATH_COLORS.sequence}
                fontWeight="bold"
              >
                {isAnOverflow ? "↑ " : ""}a{toSub(t.n)} = {t.an.toFixed(2)}
              </text>
            )}

            {/* S_n 点 */}
            <circle
              cx={posSn.x}
              cy={posSn.y}
              r={isKeyPoint ? 4.5 : 3}
              fill={MATH_COLORS.sequenceSum}
              stroke={MATH_COLORS.white}
              strokeWidth={1.5}
            />
            {isKeyPoint && (
              <text
                x={posSn.x}
                y={snLabelY}
                textAnchor="middle"
                fontSize={fontScale(9)}
                fill={MATH_COLORS.sequenceSum}
              >
                {isSnOverflow ? "↑ " : ""}S{toSub(t.n)} = {t.Sn.toFixed(2)}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
