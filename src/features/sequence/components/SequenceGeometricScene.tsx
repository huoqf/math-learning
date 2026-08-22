/**
 * src/features/sequence/components/SequenceGeometricScene.tsx
 * 数列实验室 - 等比模型 2D SVG 场景 (5 大新高考教学专题)
 */
import { CoordinateGrid, FunctionGraph } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale, ViewportInfo } from "@/hooks";
import { toSub, toSup } from "./SequenceText";
import { useSequenceParams } from "./useSequenceData";

interface SequenceGeometricSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  geometricViewType?: "points" | "tessellation";
  geometricSubMode?:
    "exponential" | "staggerSum" | "segment" | "productMax" | "tessellation";
  highlightN?: number;
  onSelectN?: (n: number) => void;
}

export function SequenceGeometricScene({
  params,
  scale,
  vp,
  fontScale,
  geometricSubMode = "exponential",
  geometricViewType = "points",
  highlightN = 1,
  onSelectN,
}: SequenceGeometricSceneProps) {
  const { a1, q, N, geoData } = useSequenceParams(params);

  const { terms, expFn, limitSum, maxPnInfo, segmentedSums, staggerData } =
    geoData;

  // 专题 A: 通项与指数模型 (母函数、散点、公比6态)
  if (geometricSubMode === "exponential") {
    const envelopePos =
      q < 0 ? (x: number) => Math.abs(a1) * Math.pow(Math.abs(q), x - 1) : null;
    const envelopeNeg =
      q < 0
        ? (x: number) => -Math.abs(a1) * Math.pow(Math.abs(q), x - 1)
        : null;

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
              极限和 S∞ = {limitSum.toFixed(2)}
            </text>
          </g>
        )}

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

  // 专题 B: 错位相减法推导 (两行对齐、中间相消、保留首尾)
  if (geometricSubMode === "staggerSum") {
    const cardWidth = Math.min(
      68,
      Math.max(44, (vp.centerX * 2 - 160) / (N + 2)),
    );
    const cardHeight = 36;
    const startX = 70;
    const row1Y = 160;
    const row2Y = 260;

    // toSub using top-level helper
    // toSup using top-level helper

    return (
      <g className="sequence-scene-stagger-sum">
        {/* 标题说明 */}
        <text
          x={vp.centerX}
          y={50}
          textAnchor="middle"
          fontSize={fontScale(12)}
          fill={MATH_COLORS.labelText}
          fontWeight="bold"
        >
          错位相减推导：Sₙ 与 q·Sₙ 逐项对齐相消
        </text>

        {/* 行 1: S_n 展开式 */}
        <text
          x={startX - 15}
          y={row1Y + cardHeight / 2 + 5}
          textAnchor="end"
          fontSize={fontScale(11)}
          fill={MATH_COLORS.sequenceSum}
          fontWeight="bold"
        >
          Sₙ =
        </text>
        {staggerData.snTerms.map((t, idx) => {
          const cx = startX + idx * (cardWidth + 8);
          const isHead = idx === 0;

          return (
            <g key={`sn-card-${t.n}`}>
              <rect
                x={cx}
                y={row1Y}
                width={cardWidth}
                height={cardHeight}
                rx={4}
                fill={withAlpha(
                  isHead ? MATH_COLORS.paramPrimary : MATH_COLORS.sequenceSum,
                  isHead ? 0.25 : 0.12,
                )}
                stroke={
                  isHead ? MATH_COLORS.paramPrimary : MATH_COLORS.sequenceSum
                }
                strokeWidth={isHead ? 2 : 1}
              />
              <text
                x={cx + cardWidth / 2}
                y={row1Y + cardHeight / 2 + 4}
                textAnchor="middle"
                fontSize={fontScale(9.5)}
                fill={isHead ? MATH_COLORS.paramPrimary : MATH_COLORS.labelText}
                fontWeight={isHead ? "bold" : "normal"}
              >
                {isHead ? `a₁ (${t.val.toFixed(1)})` : `a${toSub(t.n)}`}
              </text>
              {idx < N - 1 && (
                <text
                  x={cx + cardWidth + 4}
                  y={row1Y + cardHeight / 2 + 5}
                  textAnchor="middle"
                  fontSize={fontScale(12)}
                  fill={MATH_COLORS.labelText}
                >
                  +
                </text>
              )}
            </g>
          );
        })}

        {/* 行 2: q S_n 错位展开式 (向右缩进一个卡片宽度) */}
        <text
          x={startX - 15}
          y={row2Y + cardHeight / 2 + 5}
          textAnchor="end"
          fontSize={fontScale(11)}
          fill={MATH_COLORS.sequenceSecondary}
          fontWeight="bold"
        >
          q·Sₙ =
        </text>
        {staggerData.qSnTerms.map((t, idx) => {
          const cx = startX + (idx + 1) * (cardWidth + 8); // 错开 1 格
          const isTail = idx === N - 1;

          return (
            <g key={`qsn-card-${t.n}`}>
              <rect
                x={cx}
                y={row2Y}
                width={cardWidth}
                height={cardHeight}
                rx={4}
                fill={withAlpha(
                  isTail
                    ? MATH_COLORS.paramSecondary
                    : MATH_COLORS.sequenceSecondary,
                  isTail ? 0.25 : 0.12,
                )}
                stroke={
                  isTail
                    ? MATH_COLORS.paramSecondary
                    : MATH_COLORS.sequenceSecondary
                }
                strokeWidth={isTail ? 2 : 1}
              />
              <text
                x={cx + cardWidth / 2}
                y={row2Y + cardHeight / 2 + 4}
                textAnchor="middle"
                fontSize={fontScale(9.5)}
                fill={
                  isTail ? MATH_COLORS.paramSecondary : MATH_COLORS.labelText
                }
                fontWeight={isTail ? "bold" : "normal"}
              >
                {isTail ? `a₁q${toSup(N)}` : `a${toSub(t.n)}·q`}
              </text>
              {idx < N - 1 && (
                <text
                  x={cx + cardWidth + 4}
                  y={row2Y + cardHeight / 2 + 5}
                  textAnchor="middle"
                  fontSize={fontScale(12)}
                  fill={MATH_COLORS.labelText}
                >
                  +
                </text>
              )}

              {/* 中间项对消指示垂直虚线 */}
              {!isTail && (
                <g opacity={0.65}>
                  <line
                    x1={cx + cardWidth / 2}
                    y1={row1Y + cardHeight}
                    x2={cx + cardWidth / 2}
                    y2={row2Y}
                    stroke={MATH_COLORS.sequenceStem}
                    strokeDasharray="3,3"
                    strokeWidth={1}
                  />
                  <text
                    x={cx + cardWidth / 2}
                    y={(row1Y + cardHeight + row2Y) / 2 + 4}
                    textAnchor="middle"
                    fontSize={fontScale(8.5)}
                    fill={MATH_COLORS.sequenceStem}
                  >
                    相消
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* 相减相消总结条 */}
        <g className="stagger-result-summary">
          <line
            x1={startX - 20}
            y1={row2Y + cardHeight + 25}
            x2={startX + (N + 1) * (cardWidth + 8)}
            y2={row2Y + cardHeight + 25}
            stroke={MATH_COLORS.labelText}
            strokeWidth={1.5}
          />
          <rect
            x={startX}
            y={row2Y + cardHeight + 40}
            width={cardWidth * 2 + 10}
            height={cardHeight + 6}
            rx={6}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.15)}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
          />
          <text
            x={startX + cardWidth + 5}
            y={row2Y + cardHeight + 65}
            textAnchor="middle"
            fontSize={fontScale(11)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            保留首项：+ a₁
          </text>

          <rect
            x={startX + N * (cardWidth + 8)}
            y={row2Y + cardHeight + 40}
            width={cardWidth * 2 + 10}
            height={cardHeight + 6}
            rx={6}
            fill={withAlpha(MATH_COLORS.paramSecondary, 0.15)}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.5}
          />
          <text
            x={startX + N * (cardWidth + 8) + cardWidth + 5}
            y={row2Y + cardHeight + 65}
            textAnchor="middle"
            fontSize={fontScale(11)}
            fill={MATH_COLORS.paramSecondary}
            fontWeight="bold"
          >
            保留末项：- a₁q{toSup(N)}
          </text>

          {/* 结论公式 */}
          <text
            x={vp.centerX}
            y={row2Y + cardHeight + 120}
            textAnchor="middle"
            fontSize={fontScale(13)}
            fill={MATH_COLORS.sequenceHighlight}
            fontWeight="bold"
          >
            (1 - q) · S{toSub(N)} = a₁ - a₁·q{toSup(N)} = a₁(1 - q{toSup(N)})
          </text>
        </g>
      </g>
    );
  }

  // 专题 C: 等长片段性质 (Sk, S2k-Sk, S3k-S2k 等比条带)
  if (geometricSubMode === "segment") {
    const segColors = [
      MATH_COLORS.sequence,
      MATH_COLORS.sequenceSecondary,
      MATH_COLORS.sequenceHighlight,
      MATH_COLORS.inequality,
    ];
    const validK = segmentedSums?.k ?? 3;
    // toSup using top-level helper

    return (
      <g className="sequence-scene-geometric-segment">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 1. 分组柱体与连线 */}
        {terms.map((t) => {
          const segIdx = Math.floor((t.n - 1) / validK);
          const color = segColors[segIdx % segColors.length];
          const ptBase = mathToDesign(t.n, 0, scale);
          const ptTop = mathToDesign(t.n, t.an, scale);
          const isHighlighted = t.n === highlightN;

          return (
            <g
              key={`geo-seg-term-${t.n}`}
              onClick={() => onSelectN?.(t.n)}
              className="cursor-pointer"
            >
              <rect
                x={ptBase.x - 7}
                y={Math.min(ptBase.y, ptTop.y)}
                width={14}
                height={Math.abs(ptBase.y - ptTop.y)}
                fill={withAlpha(color, isHighlighted ? 0.45 : 0.22)}
                stroke={color}
                strokeWidth={isHighlighted ? 2 : 1}
                rx={2}
              />
              <circle
                cx={ptTop.x}
                cy={ptTop.y}
                r={isHighlighted ? 4.5 : 3}
                fill={color}
                stroke={MATH_COLORS.white}
                strokeWidth={1.2}
              />
            </g>
          );
        })}

        {/* 2. 各片段和顶部条带与公比倍数弧线 */}
        {segmentedSums &&
          segmentedSums.segments.map((seg, idx) => {
            const color = segColors[(seg.segmentIndex - 1) % segColors.length];
            const ptStart = mathToDesign(seg.startN - 0.35, 0, scale);
            const ptEnd = mathToDesign(seg.endN + 0.35, 0, scale);
            const maxAnInSeg = Math.max(
              ...terms
                .slice(seg.startN - 1, seg.endN)
                .map((t) => Math.max(0, t.an)),
            );
            const topY = mathToDesign(0, maxAnInSeg + 1, scale).y;

            return (
              <g key={`geo-seg-box-${seg.segmentIndex}`}>
                {/* 片段顶部水平条 */}
                <line
                  x1={ptStart.x}
                  y1={topY}
                  x2={ptEnd.x}
                  y2={topY}
                  stroke={color}
                  strokeWidth={2}
                />
                <line
                  x1={ptStart.x}
                  y1={topY - 3}
                  x2={ptStart.x}
                  y2={topY + 3}
                  stroke={color}
                  strokeWidth={2}
                />
                <line
                  x1={ptEnd.x}
                  y1={topY - 3}
                  x2={ptEnd.x}
                  y2={topY + 3}
                  stroke={color}
                  strokeWidth={2}
                />

                {/* 片段和数值 */}
                <text
                  x={(ptStart.x + ptEnd.x) / 2}
                  y={topY - 8}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={color}
                  fontWeight="bold"
                >
                  第 {seg.segmentIndex} 片段和 = {seg.sumValue.toFixed(2)}
                </text>

                {/* 跨段比例标注弧线 */}
                {idx > 0 && (
                  <g className="ratio-arrow">
                    <path
                      d={`M ${ptStart.x - 30},${topY - 18} Q ${ptStart.x},${topY - 35} ${ptStart.x + 30},${topY - 18}`}
                      fill="none"
                      stroke={MATH_COLORS.sequenceHighlight}
                      strokeWidth={1.5}
                      strokeDasharray="3,2"
                    />
                    <text
                      x={ptStart.x}
                      y={topY - 38}
                      textAnchor="middle"
                      fontSize={fontScale(9.5)}
                      fill={MATH_COLORS.sequenceHighlight}
                      fontWeight="bold"
                    >
                      × q{toSup(validK)} ({segmentedSums.ratio.toFixed(2)})
                    </text>
                  </g>
                )}
              </g>
            );
          })}
      </g>
    );
  }

  // 专题 D: 前 n 项积与极值 (以 1 为分界点，对数二次模型)
  if (geometricSubMode === "productMax") {
    const ptOneLineY = mathToDesign(0, 1, scale).y;
    // toSub using top-level helper

    const isDual = Boolean(maxPnInfo?.isDual);
    const dualMidX =
      isDual && maxPnInfo && maxPnInfo.dualN
        ? (mathToDesign(maxPnInfo.nMax, 0, scale).x +
            mathToDesign(maxPnInfo.dualN, 0, scale).x) /
          2
        : null;
    const maxPnVal = maxPnInfo ? maxPnInfo.maxPn : 0;
    const dualTopY = mathToDesign(0, maxPnVal, scale).y;

    return (
      <g className="sequence-scene-geometric-product">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 1. y = 1 临界基准水平线 (文字放在右侧边界外，绝不挡住数据点) */}
        <line
          x1={mathToDesign(-0.5, 1, scale).x}
          y1={ptOneLineY}
          x2={mathToDesign(N + 0.8, 1, scale).x}
          y2={ptOneLineY}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={1.5}
          strokeDasharray="5,3"
        />
        <text
          x={mathToDesign(N + 0.6, 1, scale).x}
          y={ptOneLineY - 6}
          textAnchor="end"
          fontSize={fontScale(9)}
          fill={MATH_COLORS.paramSecondary}
          fontWeight="bold"
        >
          临界基准线 y=1 (乘积增减分界)
        </text>

        {/* 2. 双最值统一悬浮标题 (杜绝两个点标签互相撞车) */}
        {isDual && maxPnInfo && dualMidX !== null && (
          <g className="dual-max-banner">
            <text
              x={dualMidX}
              y={dualTopY - 18}
              textAnchor="middle"
              fontSize={fontScale(10)}
              fill={MATH_COLORS.sequenceHighlight}
              fontWeight="bold"
            >
              双最值：P{toSub(maxPnInfo.nMax)} = P{toSub(maxPnInfo.dualN!)} ={" "}
              {maxPnInfo.maxPn.toFixed(2)}
            </text>
          </g>
        )}

        {/* 3. 前 n 项积 P_n 趋势折线 */}
        {terms.map((t, idx) => {
          if (idx === 0) return null;
          const prev = terms[idx - 1];
          const ptP1 = mathToDesign(prev.n, prev.Pn, scale);
          const ptP2 = mathToDesign(t.n, t.Pn, scale);

          return (
            <line
              key={`line-pn-${t.n}`}
              x1={ptP1.x}
              y1={ptP1.y}
              x2={ptP2.x}
              y2={ptP2.y}
              stroke={MATH_COLORS.sequenceHighlight}
              strokeWidth={1.8}
            />
          );
        })}

        {/* 4. 各项 a_n 柱与 P_n 散点 */}
        {terms.map((t) => {
          const posAn = mathToDesign(t.n, t.an, scale);
          const posPn = mathToDesign(t.n, t.Pn, scale);
          const isAboveOne = t.an >= 1;
          const isHighlighted = t.n === highlightN;
          const isMaxPn =
            maxPnInfo &&
            (t.n === maxPnInfo.nMax || (isDual && t.n === maxPnInfo.dualN));

          // 当 a_n 与 P_n 高度重合时（如 n=1 时 a1=P1），错开标签位置
          const isSameVal = Math.abs(posAn.y - posPn.y) < 14;
          const anTextY = isSameVal ? posAn.y - 12 : posAn.y - 6;
          const pnTextY = isSameVal ? posPn.y + 16 : posPn.y + 14;

          return (
            <g
              key={`geo-prod-${t.n}`}
              onClick={() => onSelectN?.(t.n)}
              className="cursor-pointer"
            >
              {/* a_n 柱体：>= 1 翡翠绿，< 1 珊瑚橙 */}
              <rect
                x={posAn.x - 6}
                y={Math.min(posAn.y, mathToDesign(t.n, 0, scale).y)}
                width={12}
                height={Math.abs(posAn.y - mathToDesign(t.n, 0, scale).y)}
                fill={withAlpha(
                  isAboveOne
                    ? MATH_COLORS.inequality
                    : MATH_COLORS.paramSecondary,
                  0.25,
                )}
                stroke={
                  isAboveOne
                    ? MATH_COLORS.inequality
                    : MATH_COLORS.paramSecondary
                }
                strokeWidth={1}
              />

              {/* a_n 散点 */}
              <circle
                cx={posAn.x}
                cy={posAn.y}
                r={3.5}
                fill={
                  isAboveOne
                    ? MATH_COLORS.inequality
                    : MATH_COLORS.paramSecondary
                }
                stroke={MATH_COLORS.white}
                strokeWidth={1}
              />
              <text
                x={posAn.x}
                y={anTextY}
                textAnchor="middle"
                fontSize={fontScale(8.5)}
                fill={
                  isAboveOne
                    ? MATH_COLORS.inequality
                    : MATH_COLORS.paramSecondary
                }
              >
                a{toSub(t.n)}={t.an.toFixed(2)}
              </text>

              {/* P_n 散点与极值光环 */}
              <circle
                cx={posPn.x}
                cy={posPn.y}
                r={isMaxPn ? 5.5 : 3.5}
                fill={
                  isMaxPn
                    ? MATH_COLORS.sequenceHighlight
                    : MATH_COLORS.sequenceSum
                }
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />

              {/* 极值光环与文字 */}
              {isMaxPn && (
                <g>
                  <circle
                    cx={posPn.x}
                    cy={posPn.y}
                    r={9}
                    fill="none"
                    stroke={MATH_COLORS.sequenceHighlight}
                    strokeWidth={1.5}
                    strokeDasharray="2,2"
                  />

                  {/* 单最值时才在上方直接标文字；双最值时在顶部统一显示横幅 */}
                  {!isDual && (
                    <text
                      x={posPn.x}
                      y={posPn.y - 12}
                      textAnchor="middle"
                      fontSize={fontScale(9.5)}
                      fill={MATH_COLORS.sequenceHighlight}
                      fontWeight="bold"
                    >
                      P{toSub(t.n)}最值 = {t.Pn.toFixed(2)}
                    </text>
                  )}

                  {/* 双最值时左右两点仅显示下标，绝不互撞 */}
                  {isDual && (
                    <text
                      x={t.n === maxPnInfo.nMax ? posPn.x - 8 : posPn.x + 8}
                      y={posPn.y - 7}
                      textAnchor={t.n === maxPnInfo.nMax ? "end" : "start"}
                      fontSize={fontScale(9)}
                      fill={MATH_COLORS.sequenceHighlight}
                      fontWeight="bold"
                    >
                      P{toSub(t.n)}
                    </text>
                  )}
                </g>
              )}

              {/* 普通 P_n 标注 */}
              {!isMaxPn && (t.n === 1 || t.n === N || isHighlighted) && (
                <text
                  x={posPn.x}
                  y={pnTextY}
                  textAnchor="middle"
                  fontSize={fontScale(8.5)}
                  fill={MATH_COLORS.sequenceSum}
                >
                  P{toSub(t.n)}={t.Pn.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}
      </g>
    );
  }

  // 专题 E: 正方形自相似无限剖分 (无字证明)
  if (
    geometricSubMode === "tessellation" ||
    geometricViewType === "tessellation"
  ) {
    const isValidTess = a1 > 0 && q > 0 && q < 1;
    // toSub using top-level helper

    if (!isValidTess) {
      return (
        <g className="sequence-scene-tessellation-invalid">
          <rect
            x={vp.centerX - 240}
            y={vp.centerY - 90}
            width={480}
            height={180}
            rx={12}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
            strokeDasharray="5,4"
          />
          <text
            x={vp.centerX}
            y={vp.centerY - 35}
            textAnchor="middle"
            fontSize={fontScale(14)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            ⚠️ 自相似几何面积剖分前提条件
          </text>
          <text
            x={vp.centerX}
            y={vp.centerY + 5}
            textAnchor="middle"
            fontSize={fontScale(11)}
            fill={MATH_COLORS.labelText}
          >
            无字证明面积细分要求：首项 a₁ &gt; 0 且公比 0 &lt; q &lt; 1
          </text>
          <text
            x={vp.centerX}
            y={vp.centerY + 40}
            textAnchor="middle"
            fontSize={fontScale(11)}
            fill={MATH_COLORS.sequenceHighlight}
            fontWeight="bold"
          >
            当前参数：a₁ = {a1}, q = {q} （请在左屏调节公比至 0~1 区间）
          </text>
        </g>
      );
    }

    const size = 350;
    const x0 = vp.centerX - size / 2;
    const y0 = vp.centerY - size / 2 - 5;

    const getFracStr = (val: number): string => {
      if (Math.abs(val - 1 / 2) < 0.008) return "1/2";
      if (Math.abs(val - 1 / 3) < 0.008) return "1/3";
      if (Math.abs(val - 1 / 4) < 0.008) return "1/4";
      if (Math.abs(val - 2 / 3) < 0.008) return "2/3";
      if (Math.abs(val - 3 / 4) < 0.008) return "3/4";
      return val.toFixed(2);
    };

    const qFrac = getFracStr(q);
    const limitSumVal = a1 / (1 - q);
    const limitSumFormatted = Number.isInteger(
      Math.round(limitSumVal * 100) / 100,
    )
      ? String(Math.round(limitSumVal))
      : limitSumVal.toFixed(2);

    const tessBlocks: Array<{
      x: number;
      y: number;
      w: number;
      h: number;
      label: string;
      formulaLabel: string;
      percentText: string;
      val: number;
      color: string;
    }> = [];

    let curX = x0;
    let curY = y0;
    let curW = size;
    let curH = size;
    const palette = [
      MATH_COLORS.sequence,
      MATH_COLORS.sequenceSecondary,
      MATH_COLORS.sequenceSum,
      MATH_COLORS.sequenceHighlight,
      MATH_COLORS.inequality,
      "#8B5CF6",
    ];

    let runningTerm = a1;
    const maxSteps = Math.min(N, 7);

    for (let k = 1; k <= maxSteps; k++) {
      const color = palette[(k - 1) % palette.length];
      const valStr = Number.isInteger(runningTerm)
        ? String(runningTerm)
        : runningTerm.toFixed(2);
      const percentStr = `${((1 - q) * Math.pow(q, k - 1) * 100).toFixed(1)}%`;

      let formulaLabel = `a${toSub(k)}`;
      if (k === 1) {
        formulaLabel = `a₁ = ${a1}`;
      } else if (k === 2) {
        formulaLabel = `a₂ = a₁·q = ${a1}·(${qFrac})`;
      } else if (k === 3) {
        formulaLabel = `a₃ = a₁·q² = ${a1}·(${qFrac})²`;
      } else if (k === 4) {
        formulaLabel = `a₄ = a₁·q³`;
      }

      if (k % 2 === 1) {
        // 垂直切（切出左侧矩形）
        const w = curW * (1 - q);
        tessBlocks.push({
          x: curX,
          y: curY,
          w,
          h: curH,
          label: `a${toSub(k)} = ${valStr}`,
          formulaLabel,
          percentText: percentStr,
          val: runningTerm,
          color,
        });
        curX += w;
        curW -= w;
      } else {
        // 水平切（切出上方矩形）
        const h = curH * (1 - q);
        tessBlocks.push({
          x: curX,
          y: curY,
          w: curW,
          h,
          label: `a${toSub(k)} = ${valStr}`,
          formulaLabel,
          percentText: percentStr,
          val: runningTerm,
          color,
        });
        curY += h;
        curH -= h;
      }
      runningTerm *= q;
    }

    const remainSum = limitSumVal - (terms[maxSteps - 1]?.Sn ?? 0);

    return (
      <g className="sequence-scene-tessellation">
        {/* 顶部标题：准确的代数推导等式，绝非单调数字 */}
        <text
          x={vp.centerX}
          y={y0 - 24}
          textAnchor="middle"
          fontSize={fontScale(12.5)}
          fill={MATH_COLORS.sequenceHighlight}
          fontWeight="bold"
        >
          正方形总面积 S∞ = a₁ / (1 - q) = {a1} / (1 - {qFrac}) ={" "}
          {limitSumFormatted}
        </text>

        {/* 正方形外框 */}
        <rect
          x={x0}
          y={y0}
          width={size}
          height={size}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.labelText}
          strokeWidth={2}
          rx={4}
        />

        {/* 各级自相似剖分矩形 */}
        {tessBlocks.map((b, idx) => (
          <g key={`tess-${idx}`}>
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              fill={withAlpha(b.color, 0.26)}
              stroke={b.color}
              strokeWidth={1.5}
            />

            {/* 块内结构公式与数值标注 */}
            {b.w > 40 && b.h > 24 && (
              <text
                x={b.x + b.w / 2}
                y={b.y + b.h / 2 - (b.h > 45 ? 5 : 0)}
                textAnchor="middle"
                fontSize={fontScale(Math.min(10.5, b.w / 7.5))}
                fill={b.color}
                fontWeight="bold"
              >
                {b.w > 80 ? b.formulaLabel : b.label}
              </text>
            )}

            {/* 几何面积占比百分比 */}
            {b.w > 55 && b.h > 45 && (
              <text
                x={b.x + b.w / 2}
                y={b.y + b.h / 2 + 13}
                textAnchor="middle"
                fontSize={fontScale(8.5)}
                fill={b.color}
                opacity={0.85}
              >
                (占总面积 {b.percentText})
              </text>
            )}
          </g>
        ))}

        {/* 剩余未切分小方块 (无穷级数尾项收敛区) */}
        {curW > 4 && curH > 4 && (
          <g className="remain-tail-block">
            <rect
              x={curX}
              y={curY}
              width={curW}
              height={curH}
              fill={withAlpha(MATH_COLORS.labelText, 0.08)}
              stroke={MATH_COLORS.labelText}
              strokeWidth={1}
              strokeDasharray="2,2"
            />
            {curW > 35 && curH > 20 && (
              <text
                x={curX + curW / 2}
                y={curY + curH / 2 + 3}
                textAnchor="middle"
                fontSize={fontScale(8)}
                fill={MATH_COLORS.labelText}
              >
                余尾={remainSum.toFixed(2)}
              </text>
            )}
          </g>
        )}
      </g>
    );
  }

  return null;
}
