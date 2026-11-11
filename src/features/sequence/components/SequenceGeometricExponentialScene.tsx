/**
 * src/features/sequence/components/SequenceGeometricExponentialScene.tsx
 * 等比模型 - 专题 A: 通项与指数模型 (母函数、散点、公比6态)
 */
import { CoordinateGrid, FunctionGraph } from "@/components/Math";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { formatMathNumber } from "@/utils/mathFormat";
import type { SceneScale } from "@/hooks";
import { toSub } from "./SequenceText";
import { useSequenceParams } from "./useSequenceData";
import { AxisBreakBanner } from "./SequenceTruncatedBar";

const PLOT_TOP_Y = 62;
const PLOT_BOT_Y = CANVAS_PRESETS.full.height - 34;

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
            递缩和 S∞（拓展） = {formatMathNumber(limitSum)}
          </text>
        </g>
      )}

      {/* 3.5 选中相邻项的公比缩放跃迁弧线 (a_{k+1} = a_k · q)，仅当两端均在绘图区内时绘制 */}
      {(() => {
        const idx = Math.min(Math.max(1, highlightN), Math.max(1, N - 1)) - 1;
        const curT = terms[idx];
        const nextT = terms[idx + 1];
        if (!curT || !nextT) return null;
        const p1 = mathToDesign(curT.n, curT.an, scale);
        const p2 = mathToDesign(nextT.n, nextT.an, scale);
        if (
          p1.y < PLOT_TOP_Y ||
          p1.y > PLOT_BOT_Y ||
          p2.y < PLOT_TOP_Y ||
          p2.y > PLOT_BOT_Y
        ) {
          return null;
        }
        const midX = (p1.x + p2.x) / 2;
        const ctrlY = Math.max(PLOT_TOP_Y + 6, Math.min(p1.y, p2.y) - 24);
        return (
          <g className="geo-ratio-arc">
            <path
              d={`M ${p1.x} ${p1.y} Q ${midX} ${ctrlY} ${p2.x} ${p2.y}`}
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
              ×q ({formatMathNumber(q)})
            </text>
          </g>
        );
      })()}

      {/* 3.8 断轴截断显式声明带（凡有项超出线性量程上下界时必显） */}
      {(() => {
        const hasTopOverflow = terms.some((t) => {
          const pyAn = mathToDesign(t.n, t.an, scale).y;
          const pySn = mathToDesign(t.n, t.Sn, scale).y;
          return pyAn < PLOT_TOP_Y || pySn < PLOT_TOP_Y;
        });
        const hasBotOverflow = terms.some((t) => {
          const pyAn = mathToDesign(t.n, t.an, scale).y;
          const pySn = mathToDesign(t.n, t.Sn, scale).y;
          return pyAn > PLOT_BOT_Y || pySn > PLOT_BOT_Y;
        });
        const xStart = mathToDesign(0.4, 0, scale).x;
        const xEnd = mathToDesign(N + 0.6, 0, scale).x;
        return (
          <>
            {hasTopOverflow && (
              <AxisBreakBanner
                xStart={xStart}
                xEnd={xEnd}
                y={PLOT_TOP_Y}
                direction="top"
                label="超出线性量程上限 · 已截断（箭头 ↑ 处标注真实值）"
                fontScale={fontScale}
              />
            )}
            {hasBotOverflow && (
              <AxisBreakBanner
                xStart={xStart}
                xEnd={xEnd}
                y={PLOT_BOT_Y}
                direction="bottom"
                label="超出线性量程下限 · 已截断（箭头 ↓ 处标注真实值）"
                fontScale={fontScale}
              />
            )}
          </>
        );
      })()}

      {/* 4. 散点与各项标注：未超界绘制真实点；超界绝不画等高假点，改绘穿透虚线+空心截断箭头 */}
      {terms.map((t) => {
        const rawPosAn = mathToDesign(t.n, t.an, scale);
        const rawPosSn = mathToDesign(t.n, t.Sn, scale);
        const zeroY = Math.min(
          PLOT_BOT_Y,
          Math.max(PLOT_TOP_Y, mathToDesign(t.n, 0, scale).y),
        );
        const isHighlighted = t.n === highlightN;
        const isKeyPoint = isHighlighted || t.n === 1 || t.n === N;

        const isAnTopOver = rawPosAn.y < PLOT_TOP_Y;
        const isAnBotOver = rawPosAn.y > PLOT_BOT_Y;
        const isAnOverflow = isAnTopOver || isAnBotOver;

        const isSnTopOver = rawPosSn.y < PLOT_TOP_Y;
        const isSnBotOver = rawPosSn.y > PLOT_BOT_Y;
        const isSnOverflow = isSnTopOver || isSnBotOver;

        const posAnY = isAnTopOver
          ? PLOT_TOP_Y
          : isAnBotOver
            ? PLOT_BOT_Y
            : rawPosAn.y;
        const posSnY = isSnTopOver
          ? PLOT_TOP_Y
          : isSnBotOver
            ? PLOT_BOT_Y
            : rawPosSn.y;

        const isSameSideOverflow =
          (isAnTopOver && isSnTopOver) || (isAnBotOver && isSnBotOver);
        const snMarkerX = isSameSideOverflow ? rawPosSn.x + 8 : rawPosSn.x;
        const anLabelY = isAnTopOver
          ? PLOT_TOP_Y - 38
          : isAnBotOver
            ? PLOT_BOT_Y + 20
            : t.an >= 0
              ? posAnY - 8
              : posAnY + 14;
        const snTooClose =
          !isAnOverflow && !isSnOverflow && Math.abs(posAnY - posSnY) < 18;
        const snLabelY = isSnTopOver
          ? PLOT_TOP_Y - 22
          : isSnBotOver
            ? PLOT_BOT_Y + 32
            : snTooClose
              ? posSnY + 16
              : posSnY - 8;

        const anColor = isHighlighted
          ? MATH_COLORS.sequenceHighlight
          : MATH_COLORS.sequence;

        return (
          <g
            key={`geo-exp-${t.n}`}
            onClick={() => onSelectN?.(t.n)}
            className="cursor-pointer"
          >
            {/* a_n 垂直虚线 */}
            <line
              x1={rawPosAn.x}
              y1={zeroY}
              x2={rawPosAn.x}
              y2={posAnY}
              stroke={MATH_COLORS.sequenceStem}
              strokeDasharray="2,2"
              strokeWidth={1}
            />

            {/* a_n 真实点 或 截断溢出箭头 */}
            {!isAnOverflow ? (
              <circle
                data-seq-term-an="true"
                data-x={rawPosAn.x}
                data-y={posAnY}
                cx={rawPosAn.x}
                cy={posAnY}
                r={isKeyPoint ? 5 : 3.5}
                fill={anColor}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
            ) : (
              <path
                data-seq-term-an="true"
                data-truncated="true"
                data-x={rawPosAn.x}
                data-y={posAnY}
                d={
                  isAnTopOver
                    ? `M ${rawPosAn.x} ${PLOT_TOP_Y - 7} L ${rawPosAn.x - 4.5} ${PLOT_TOP_Y + 2} L ${rawPosAn.x + 4.5} ${PLOT_TOP_Y + 2} Z`
                    : `M ${rawPosAn.x} ${PLOT_BOT_Y + 7} L ${rawPosAn.x - 4.5} ${PLOT_BOT_Y - 2} L ${rawPosAn.x + 4.5} ${PLOT_BOT_Y - 2} Z`
                }
                fill={MATH_COLORS.white}
                stroke={anColor}
                strokeWidth={1.6}
              />
            )}
            {isKeyPoint && (
              <text
                x={rawPosAn.x}
                y={anLabelY}
                textAnchor="middle"
                fontSize={fontScale(9)}
                fill={anColor}
                fontWeight="bold"
              >
                {isAnTopOver ? "↑ " : isAnBotOver ? "↓ " : ""}a{toSub(t.n)} ={" "}
                {formatMathNumber(t.an)}
              </text>
            )}

            {/* S_n 真实点 或 截断溢出菱形箭头（与 a_n 同向超界时水平错开 +8px 防重合） */}
            {!isSnOverflow ? (
              <circle
                cx={rawPosSn.x}
                cy={posSnY}
                r={isKeyPoint ? 4.5 : 3}
                fill={MATH_COLORS.sequenceSum}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
            ) : (
              <path
                data-truncated="true"
                d={
                  isSnTopOver
                    ? `M ${snMarkerX} ${PLOT_TOP_Y - 13} L ${snMarkerX + 4} ${PLOT_TOP_Y - 8} L ${snMarkerX} ${PLOT_TOP_Y - 3} L ${snMarkerX - 4} ${PLOT_TOP_Y - 8} Z`
                    : `M ${snMarkerX} ${PLOT_BOT_Y + 3} L ${snMarkerX + 4} ${PLOT_BOT_Y + 8} L ${snMarkerX} ${PLOT_BOT_Y + 13} L ${snMarkerX - 4} ${PLOT_BOT_Y + 8} Z`
                }
                fill={MATH_COLORS.white}
                stroke={MATH_COLORS.sequenceSum}
                strokeWidth={1.4}
              />
            )}
            {isKeyPoint && (
              <text
                x={snMarkerX}
                y={snLabelY}
                textAnchor="middle"
                fontSize={fontScale(9)}
                fill={MATH_COLORS.sequenceSum}
              >
                {isSnTopOver ? "↑ " : isSnBotOver ? "↓ " : ""}S{toSub(t.n)} ={" "}
                {formatMathNumber(t.Sn)}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
