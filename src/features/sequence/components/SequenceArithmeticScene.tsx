/**
 * src/features/sequence/components/SequenceArithmeticScene.tsx
 * 数列实验室 - 等差模型 2D SVG 场景 (5 大教学专题)
 */
import { CoordinateGrid, FunctionGraph } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale, ViewportInfo } from "@/hooks";
import { toSub } from "./SequenceText";
import { useSequenceParams } from "./useSequenceData";

interface SequenceArithmeticSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  arithmeticSubMode?: "linear" | "gauss" | "quadratic" | "segment" | "absSum";
  highlightN?: number;
  onSelectN?: (n: number) => void;
}

export function SequenceArithmeticScene({
  params,
  scale,
  fontScale,
  arithmeticSubMode = "linear",
  highlightN = 1,
  onSelectN,
}: SequenceArithmeticSceneProps) {
  const { a1, d, N, kSegment, gaussRatio, arithData } =
    useSequenceParams(params);

  const {
    terms,
    lineFn,
    parabolaFn,
    maxSnInfo,
    zeroPointExact,
    continuousAxis,
    segmentedSums,
  } = arithData;

  // 专题 A: 通项与一次函数 (斜率三角形、变号零点、单调性)
  if (arithmeticSubMode === "linear") {
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
                fill={
                  t.an >= 0 ? MATH_COLORS.sequence : MATH_COLORS.paramPrimary
                }
                stroke={MATH_COLORS.white}
                strokeWidth={1.2}
              />
              <text
                x={posAn.x}
                y={t.an >= 0 ? posAn.y - 7 : posAn.y + 14}
                textAnchor="middle"
                fontSize={fontScale(9)}
                fill={
                  t.an >= 0 ? MATH_COLORS.sequence : MATH_COLORS.paramPrimary
                }
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

  // 专题 B: 高斯倒序相加几何拼图 (无字证明长方形)
  if (arithmeticSubMode === "gauss") {
    const colWidth = 24;
    const aN = terms[N - 1]?.an ?? 0;
    const sumHeightVal = a1 + aN;

    return (
      <g className="sequence-scene-arithmetic-gauss">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 正序柱 (蓝) 与倒序柱 (橙) 拼合 */}
        {terms.map((t, idx) => {
          const revIdx = N - 1 - idx;
          const revTerm = terms[revIdx];
          const ptBase = mathToDesign(t.n, 0, scale);
          const ptAn = mathToDesign(t.n, t.an, scale);

          // 正序柱 Y 坐标
          const posTopY = Math.min(ptBase.y, ptAn.y);
          const posH = Math.max(2, Math.abs(ptBase.y - ptAn.y));

          // 倒序柱扣合插值
          const targetRevTopY =
            posTopY -
            Math.abs(ptBase.y - mathToDesign(t.n, revTerm.an, scale).y);
          const openOffsetY = -28 * (1 - gaussRatio);
          const currentRevTopY =
            posTopY + (targetRevTopY - posTopY) * gaussRatio + openOffsetY;
          const currentRevH = Math.max(
            2,
            Math.abs(ptBase.y - mathToDesign(t.n, revTerm.an, scale).y),
          );

          return (
            <g key={`gauss-col-${t.n}`}>
              {/* 1. 蓝色正序柱 a_n */}
              <rect
                x={ptBase.x - colWidth / 2}
                y={posTopY}
                width={colWidth}
                height={posH}
                fill={withAlpha(MATH_COLORS.sequence, 0.4)}
                stroke={MATH_COLORS.sequence}
                strokeWidth={1.2}
                rx={2}
              />
              {posH >= 14 && (
                <text
                  x={ptBase.x}
                  y={posTopY + posH / 2 + 3.5}
                  textAnchor="middle"
                  fontSize={fontScale(8.5)}
                  fill={MATH_COLORS.sequence}
                  fontWeight="bold"
                >
                  a{toSub(t.n)}
                </text>
              )}

              {/* 2. 暖橙色倒序柱 a_{N-n+1} (翻转扣合) */}
              <rect
                x={ptBase.x - colWidth / 2}
                y={currentRevTopY}
                width={colWidth}
                height={currentRevH}
                fill={withAlpha(MATH_COLORS.paramSecondary, 0.4)}
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={1.2}
                strokeDasharray={gaussRatio < 0.95 ? "3,2" : undefined}
                rx={2}
              />
              {currentRevH >= 14 && (
                <text
                  x={ptBase.x}
                  y={currentRevTopY + currentRevH / 2 + 3.5}
                  textAnchor="middle"
                  fontSize={fontScale(8.5)}
                  fill={MATH_COLORS.paramSecondary}
                  fontWeight="bold"
                >
                  a{toSub(revTerm.n)}
                </text>
              )}
            </g>
          );
        })}

        {/* 扣合完成时的大外接矩形金色边框与总面积公式 */}
        {gaussRatio >= 0.75 && (
          <g opacity={(gaussRatio - 0.75) / 0.25}>
            {(() => {
              const ptLeft = mathToDesign(1, 0, scale);
              const ptRight = mathToDesign(N, 0, scale);
              const ptTop = mathToDesign(1, sumHeightVal, scale);
              const rectX = ptLeft.x - colWidth / 2;
              const rectW = ptRight.x - ptLeft.x + colWidth;
              const rectY = Math.min(ptLeft.y, ptTop.y);
              const rectH = Math.abs(ptLeft.y - ptTop.y);

              return (
                <g>
                  <rect
                    x={rectX}
                    y={rectY}
                    width={rectW}
                    height={rectH}
                    fill="none"
                    stroke={MATH_COLORS.sequenceHighlight}
                    strokeWidth={1.8}
                    strokeDasharray="5,3"
                    rx={4}
                  />
                  {/* 顶部中央公式横幅 (固定在顶部避开柱子) */}
                  <g transform={`translate(${rectX + rectW / 2}, 24)`}>
                    <rect
                      x={-150}
                      y={-12}
                      width={300}
                      height={24}
                      fill={withAlpha(MATH_COLORS.white, 0.95)}
                      stroke={MATH_COLORS.sequenceHighlight}
                      strokeWidth={1.2}
                      rx={4}
                    />
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      fontSize={fontScale(10.5)}
                      fill={MATH_COLORS.sequenceHighlight}
                      fontWeight="bold"
                    >
                      大长方形面积 = 2S{toSub(N)} = {N} × (a₁ + a{toSub(N)}) ={" "}
                      {(N * sumHeightVal).toFixed(1)}
                    </text>
                  </g>
                </g>
              );
            })()}
          </g>
        )}
      </g>
    );
  }

  // 专题 C: 前 n 项和与二次函数极值 (连续顶点 vs 离散极值项)
  if (arithmeticSubMode === "quadratic") {
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

  // 专题 D: 等长片段和性质 (Sk, S2k-Sk, S3k-S2k 等差条带)
  if (arithmeticSubMode === "segment") {
    const segColors = [
      MATH_COLORS.sequence,
      MATH_COLORS.paramTertiary,
      MATH_COLORS.sequenceSum,
      MATH_COLORS.paramSecondary,
    ];

    // 获取当前项柱的最大最高点，卡片顶就落在最高点上方
    const maxTermAn = Math.max(...terms.map((t) => t.an), 1);
    const minTermAn = Math.min(...terms.map((t) => t.an), -1);

    return (
      <g className="sequence-scene-arithmetic-segment">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 1. 各片段背景卡片包裹框 */}
        {segmentedSums?.segments.map((seg, sIdx) => {
          const ptStart = mathToDesign(seg.startN - 0.4, 0, scale);
          const ptEnd = mathToDesign(seg.endN + 0.4, 0, scale);
          const color = segColors[sIdx % segColors.length];
          const cardX = ptStart.x;
          const cardW = ptEnd.x - ptStart.x;
          const cardTopY = mathToDesign(0, maxTermAn + 2.2, scale).y;
          const cardBottomY = mathToDesign(0, minTermAn - 0.8, scale).y;
          const cardH = Math.abs(cardBottomY - cardTopY);

          return (
            <g key={`seg-card-${seg.segmentIndex}`}>
              <rect
                x={cardX}
                y={cardTopY}
                width={cardW}
                height={cardH}
                fill={withAlpha(color, 0.06)}
                stroke={withAlpha(color, 0.3)}
                strokeWidth={1.2}
                strokeDasharray="4,3"
                rx={4}
              />
              {/* 紧凑单行标题 */}
              <text
                x={cardX + cardW / 2}
                y={cardTopY + 13}
                textAnchor="middle"
                fontSize={fontScale(9.5)}
                fill={color}
                fontWeight="bold"
              >
                A{toSub(seg.segmentIndex)} = {seg.sumValue.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* 2. 各项柱体与散点 */}
        {terms.map((t) => {
          const segIdx = Math.floor((t.n - 1) / kSegment);
          const color = segColors[segIdx % segColors.length];
          const pt0 = mathToDesign(t.n - 0.2, 0, scale);
          const pt1 = mathToDesign(t.n + 0.2, t.an, scale);
          const x = Math.min(pt0.x, pt1.x);
          const y = Math.min(pt0.y, pt1.y);
          const w = Math.abs(pt1.x - pt0.x);
          const h = Math.abs(pt1.y - pt0.y);
          const posAn = mathToDesign(t.n, t.an, scale);

          return (
            <g key={`seg-term-${t.n}`}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={withAlpha(color, 0.3)}
                stroke={color}
                strokeWidth={1.2}
                rx={2}
              />
              <circle
                cx={posAn.x}
                cy={posAn.y}
                r={3}
                fill={color}
                stroke={MATH_COLORS.white}
                strokeWidth={1.2}
              />
              <text
                x={posAn.x}
                y={t.an >= 0 ? posAn.y - 6 : posAn.y + 13}
                textAnchor="middle"
                fontSize={fontScale(8.5)}
                fill={color}
              >
                {t.an.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* 3. 相邻片段之间的差值指示 (就近贴在卡片顶上方) */}
        {segmentedSums && segmentedSums.segments.length >= 2 && (
          <g className="segment-diff-arrows">
            {segmentedSums.segments.slice(0, -1).map((seg, idx) => {
              const nextSeg = segmentedSums.segments[idx + 1];
              const pt1 = mathToDesign(
                (seg.startN + seg.endN) / 2,
                maxTermAn + 2.2,
                scale,
              );
              const pt2 = mathToDesign(
                (nextSeg.startN + nextSeg.endN) / 2,
                maxTermAn + 2.2,
                scale,
              );

              return (
                <g key={`seg-diff-${idx}`}>
                  <path
                    d={`M ${pt1.x} ${pt1.y} Q ${(pt1.x + pt2.x) / 2} ${pt1.y - 10} ${pt2.x} ${pt2.y}`}
                    fill="none"
                    stroke={MATH_COLORS.sequenceHighlight}
                    strokeWidth={1.2}
                  />
                  <text
                    x={(pt1.x + pt2.x) / 2}
                    y={pt1.y - 12}
                    textAnchor="middle"
                    fontSize={fontScale(9)}
                    fill={MATH_COLORS.sequenceHighlight}
                    fontWeight="bold"
                  >
                    + k²·d ={" "}
                    {segmentedSums.diff > 0
                      ? `+${segmentedSums.diff}`
                      : `${segmentedSums.diff}`}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </g>
    );
  }

  // 专题 E: 绝对值数列求和 Tn = sum |an|
  if (arithmeticSubMode === "absSum") {
    const splitN = zeroPointExact !== null ? Math.floor(zeroPointExact) : 0;
    const splitPt =
      zeroPointExact !== null ? mathToDesign(zeroPointExact, 0, scale) : null;

    const maxTnVal = Math.max(...terms.map((t) => t.Tn), 5);

    return (
      <g className="sequence-scene-arithmetic-abs">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 1. 变号分界垂直警示线 */}
        {splitPt &&
          zeroPointExact !== null &&
          zeroPointExact >= 1 &&
          zeroPointExact <= N && (
            <g className="split-boundary">
              <line
                x1={splitPt.x}
                y1={mathToDesign(0, -4, scale).y}
                x2={splitPt.x}
                y2={mathToDesign(0, maxTnVal + 1, scale).y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1.2}
                strokeDasharray="4,3"
              />
              <text
                x={splitPt.x}
                y={mathToDesign(0, maxTnVal + 1, scale).y - 6}
                textAnchor="middle"
                fontSize={fontScale(9)}
                fill={MATH_COLORS.paramPrimary}
                fontWeight="bold"
              >
                分界点 m={splitN}
              </text>
            </g>
          )}

        {/* 2. Tn 折线 (金色) 与 Sn 折线 (紫色虚线) */}
        <g className="sum-curves">
          {terms.map((t, idx) => {
            if (idx === 0) return null;
            const prev = terms[idx - 1];
            const ptTn1 = mathToDesign(prev.n, prev.Tn, scale);
            const ptTn2 = mathToDesign(t.n, t.Tn, scale);
            const ptSn1 = mathToDesign(prev.n, prev.Sn, scale);
            const ptSn2 = mathToDesign(t.n, t.Sn, scale);

            return (
              <g key={`curve-seg-${t.n}`}>
                <line
                  x1={ptTn1.x}
                  y1={ptTn1.y}
                  x2={ptTn2.x}
                  y2={ptTn2.y}
                  stroke={MATH_COLORS.sequenceHighlight}
                  strokeWidth={1.8}
                />
                <line
                  x1={ptSn1.x}
                  y1={ptSn1.y}
                  x2={ptSn2.x}
                  y2={ptSn2.y}
                  stroke={MATH_COLORS.sequenceSum}
                  strokeWidth={1.2}
                  strokeDasharray="3,3"
                />
              </g>
            );
          })}
        </g>

        {/* 3. 各项柱体与散点 (Tn 只在首、转折点、末项显示标注) */}
        {terms.map((t) => {
          const isNeg = t.an < 0;
          const ptBase = mathToDesign(t.n, 0, scale);
          const ptOrig = mathToDesign(t.n, t.an, scale);
          const ptAbs = mathToDesign(t.n, t.absAn, scale);
          const ptTn = mathToDesign(t.n, t.Tn, scale);
          const ptSn = mathToDesign(t.n, t.Sn, scale);
          const isHighlighted = t.n === highlightN;
          const isKeyPoint =
            t.n === 1 || t.n === splitN || t.n === N || isHighlighted;

          return (
            <g
              key={`abs-term-${t.n}`}
              onClick={() => onSelectN?.(t.n)}
              className="cursor-pointer"
            >
              {/* 负项在第四象限的虚线原项 */}
              {isNeg && (
                <g opacity={0.35}>
                  <rect
                    x={ptBase.x - 8}
                    y={Math.min(ptBase.y, ptOrig.y)}
                    width={16}
                    height={Math.abs(ptBase.y - ptOrig.y)}
                    fill="none"
                    stroke={MATH_COLORS.paramPrimary}
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                  <circle
                    cx={ptOrig.x}
                    cy={ptOrig.y}
                    r={2.5}
                    fill="none"
                    stroke={MATH_COLORS.paramPrimary}
                  />
                </g>
              )}

              {/* 第一象限绝对值实体柱 */}
              <rect
                x={ptBase.x - 8}
                y={Math.min(ptBase.y, ptAbs.y)}
                width={16}
                height={Math.abs(ptBase.y - ptAbs.y)}
                fill={withAlpha(
                  isHighlighted
                    ? MATH_COLORS.sequenceHighlight
                    : isNeg
                      ? MATH_COLORS.sequenceHighlight
                      : MATH_COLORS.sequence,
                  0.25,
                )}
                stroke={
                  isHighlighted
                    ? MATH_COLORS.sequenceHighlight
                    : isNeg
                      ? MATH_COLORS.sequenceHighlight
                      : MATH_COLORS.sequence
                }
                strokeWidth={isHighlighted ? 1.8 : 1}
                rx={2}
              />

              {/* Tn 绝对值累计和散点 */}
              <circle
                cx={ptTn.x}
                cy={ptTn.y}
                r={isKeyPoint ? 4 : 2.5}
                fill={MATH_COLORS.sequenceHighlight}
                stroke={MATH_COLORS.white}
                strokeWidth={1.2}
              />
              {isKeyPoint && (
                <text
                  x={ptTn.x}
                  y={ptTn.y - 7}
                  textAnchor="middle"
                  fontSize={fontScale(8.5)}
                  fill={MATH_COLORS.sequenceHighlight}
                  fontWeight="bold"
                >
                  T{toSub(t.n)} = {t.Tn.toFixed(1)}
                </text>
              )}

              {/* Sn 散点 */}
              <circle
                cx={ptSn.x}
                cy={ptSn.y}
                r={2.5}
                fill={MATH_COLORS.sequenceSum}
              />
            </g>
          );
        })}
      </g>
    );
  }

  return null;
}
