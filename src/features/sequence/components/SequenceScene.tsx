/**
 * src/features/sequence/components/SequenceScene.tsx
 * 数列实验室 2D SVG 动态场景组件 (支持 5 大高考求和模型)
 */
import { useMemo } from "react";
import { CoordinateGrid, FunctionGraph } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import {
  calcArithmeticSequence,
  calcGeometricSequence,
  calcArithGeoSplit,
  calcTelescoping,
  calcGroupedSequence,
  calcCrossTelescoping,
  calcOddEvenSequence,
  calcLinearRecurrence,
  calcAccumulationRecurrence,
  calcMultiplicationRecurrence,
  calcReciprocalRecurrence,
  calcSecondOrderRecurrence,
} from "@/math/sequence";
import type { SceneScale, ViewportInfo } from "@/hooks";

interface SequenceSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  activeMode: "arithmetic" | "geometric" | "models" | "recurrence";
  arithmeticSubMode?: "linear" | "gauss" | "quadratic" | "segment" | "absSum";
  geometricViewType?: "points" | "tessellation";
  geometricSubMode?:
    "exponential" | "staggerSum" | "segment" | "productMax" | "tessellation";
  modelType?:
    "arith-geo" | "telescoping" | "cross-telescoping" | "grouped" | "odd-even";
  recurrenceModelType?:
    | "linear-pan"
    | "accumulation"
    | "multiplication"
    | "reciprocal"
    | "second-order";
  highlightN?: number;
  onSelectN?: (n: number) => void;
}

export function SequenceScene({
  params,
  scale,
  vp,
  fontScale,
  activeMode,
  arithmeticSubMode = "linear",
  geometricViewType = "points",
  geometricSubMode = "exponential",
  modelType = "arith-geo",
  recurrenceModelType = "linear-pan",
  highlightN = 1,
  onSelectN,
}: SequenceSceneProps) {
  const a1 = params.a1 ?? 3;
  const d = params.d ?? -1;
  const q = params.q ?? 0.5;
  const N = Math.max(3, Math.min(15, Math.round(params.N ?? 8)));
  const kSegment = params.kSegment ?? 3;
  const gaussRatio = params.gaussRatio ?? 1;
  const p_rec = params.p_rec ?? 2;
  const q_rec = params.q_rec ?? 1;
  const a2 = params.a2 ?? 2;
  const coefA = params.coefA ?? 2;
  const coefB = params.coefB ?? 1;
  const coefC = params.coefC ?? 1;

  // 计算数列数据
  const arithData = useMemo(
    () => calcArithmeticSequence(a1, d, N, kSegment),
    [a1, d, N, kSegment],
  );
  const geoData = useMemo(
    () => calcGeometricSequence(a1, q, N, kSegment),
    [a1, q, N, kSegment],
  );
  const linearRecData = useMemo(
    () => calcLinearRecurrence(a1, p_rec, q_rec, N),
    [a1, p_rec, q_rec, N],
  );
  const accumRecData = useMemo(
    () => calcAccumulationRecurrence(a1, "linear", d, N),
    [a1, d, N],
  );
  const multRecData = useMemo(
    () => calcMultiplicationRecurrence(a1, "n_over_n1", N),
    [a1, N],
  );
  const recipRecData = useMemo(
    () => calcReciprocalRecurrence(a1, coefA, coefB, coefC, N),
    [a1, coefA, coefB, coefC, N],
  );
  const secondRecData = useMemo(
    () => calcSecondOrderRecurrence(a1, a2, p_rec, q_rec, N),
    [a1, a2, p_rec, q_rec, N],
  );

  const arithGeoData = useMemo(
    () => calcArithGeoSplit(a1, d, q, N),
    [a1, d, q, N],
  );
  const telescopingData = useMemo(() => calcTelescoping(N), [N]);
  const crossTelescopingData = useMemo(() => calcCrossTelescoping(N), [N]);
  const groupedData = useMemo(
    () => calcGroupedSequence(a1, d, q, N),
    [a1, d, q, N],
  );
  const oddEvenData = useMemo(() => calcOddEvenSequence(N), [N]);

  // 1. 等差数列模式渲染 (分 5 大教学专题)
  if (activeMode === "arithmetic") {
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
                  a_{t.n}={t.an.toFixed(1)}
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
                    a_{t.n}
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
                    a_{revTerm.n}
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
                        大长方形面积 = 2S_{N} = {N} × (a₁ + a_{N}) ={" "}
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
                双最值：S_{maxSnInfo.nMax} = S_{maxSnInfo.dualN} ={" "}
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
                    S_{t.n}={t.Sn.toFixed(1)}
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
                        最值项 S_{t.n}={t.Sn.toFixed(1)}
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
                        S_{t.n}
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
                  A_{seg.segmentIndex} = {seg.sumValue.toFixed(1)}
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
                    T_{t.n}={t.Tn.toFixed(1)}
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
  }

  // 2. 等比数列模式渲染 (5 大新高考教学专题)
  if (activeMode === "geometric") {
    const { terms, expFn, limitSum, maxPnInfo, segmentedSums, staggerData } =
      geoData;

    // 专题 A: 通项与指数模型 (母函数、散点、公比6态)
    if (geometricSubMode === "exponential") {
      const envelopePos =
        q < 0
          ? (x: number) => Math.abs(a1) * Math.pow(Math.abs(q), x - 1)
          : null;
      const envelopeNeg =
        q < 0
          ? (x: number) => -Math.abs(a1) * Math.pow(Math.abs(q), x - 1)
          : null;

      const toSub = (n: number) => {
        const map = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
        return String(n)
          .split("")
          .map((c) => map[Number(c)] ?? c)
          .join("");
      };

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

      const toSub = (n: number) => {
        const map = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
        return String(n)
          .split("")
          .map((c) => map[Number(c)] ?? c)
          .join("");
      };
      const toSup = (n: number) => {
        const map = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
        return String(n)
          .split("")
          .map((c) => map[Number(c)] ?? c)
          .join("");
      };

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
                  fill={
                    isHead ? MATH_COLORS.paramPrimary : MATH_COLORS.labelText
                  }
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
      const toSup = (n: number) => {
        const map = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
        return String(n)
          .split("")
          .map((c) => map[Number(c)] ?? c)
          .join("");
      };

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
              const color =
                segColors[(seg.segmentIndex - 1) % segColors.length];
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
      const toSub = (n: number) => {
        const map = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
        return String(n)
          .split("")
          .map((c) => map[Number(c)] ?? c)
          .join("");
      };

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
      const toSub = (n: number) => {
        const map = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
        return String(n)
          .split("")
          .map((c) => map[Number(c)] ?? c)
          .join("");
      };

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
  }

  // 3. 高考模型模式（含 5 大求和模型）
  if (activeMode === "models") {
    if (modelType === "arith-geo") {
      const terms = arithGeoData.terms;

      return (
        <g className="sequence-scene-arith-geo">
          <CoordinateGrid scale={scale} fontScale={fontScale} />

          {terms.map((t) => {
            const ptTn = mathToDesign(t.n - 0.2, t.cn, scale);
            const ptZero = mathToDesign(t.n - 0.2, 0, scale);
            const w = 18;

            return (
              <g key={`ag-${t.n}`}>
                <rect
                  x={ptTn.x - w / 2}
                  y={Math.min(ptTn.y, ptZero.y)}
                  width={w}
                  height={Math.abs(ptTn.y - ptZero.y)}
                  fill={withAlpha(MATH_COLORS.sequence, 0.3)}
                  stroke={MATH_COLORS.sequence}
                  strokeWidth={1.5}
                />
                <text
                  x={ptTn.x}
                  y={ptTn.y - 6}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.sequence}
                >
                  c_{t.n}
                </text>

                {t.n <= N - 1 && (
                  <g>
                    <line
                      x1={ptTn.x}
                      y1={ptTn.y}
                      x2={ptTn.x + 35}
                      y2={ptTn.y}
                      stroke={MATH_COLORS.sequenceHighlight}
                      strokeDasharray="3,3"
                      strokeWidth={1.5}
                    />
                    <circle
                      cx={ptTn.x + 35}
                      cy={ptTn.y}
                      r={3}
                      fill={MATH_COLORS.sequenceHighlight}
                    />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      );
    }

    if (modelType === "telescoping") {
      const terms = telescopingData.terms;

      return (
        <g className="sequence-scene-telescoping">
          <CoordinateGrid scale={scale} fontScale={fontScale} />

          {terms.map((t) => {
            const posA = mathToDesign(t.n, t.partA, scale);
            const posB = mathToDesign(t.n + 0.35, -t.partB, scale);

            return (
              <g key={`tele-${t.n}`}>
                <circle
                  cx={posA.x}
                  cy={posA.y}
                  r={4}
                  fill={MATH_COLORS.combHeader}
                />
                <text
                  x={posA.x}
                  y={posA.y - 6}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.combHeader}
                  fontWeight="bold"
                >
                  +{t.partA.toFixed(2)}
                </text>

                <circle
                  cx={posB.x}
                  cy={posB.y}
                  r={4}
                  fill={MATH_COLORS.sequenceHighlight}
                />
                <text
                  x={posB.x}
                  y={posB.y + 14}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.sequenceHighlight}
                  fontWeight="bold"
                >
                  -{t.partB.toFixed(2)}
                </text>

                {t.n < N && (
                  <path
                    d={`M ${posB.x} ${posB.y} Q ${(posB.x + posA.x + 40) / 2} ${
                      (posB.y + posA.y) / 2 - 20
                    } ${posA.x + 40} ${posA.y}`}
                    fill="none"
                    stroke={MATH_COLORS.sequenceHighlight}
                    strokeWidth={1.5}
                    strokeDasharray="3,3"
                  />
                )}
              </g>
            );
          })}
        </g>
      );
    }

    if (modelType === "cross-telescoping") {
      const terms = crossTelescopingData.terms;

      return (
        <g className="sequence-scene-cross-telescoping">
          <CoordinateGrid scale={scale} fontScale={fontScale} />

          {terms.map((t) => {
            const posA = mathToDesign(t.n, t.partA, scale);
            const posB = mathToDesign(t.n + 0.35, -t.partB, scale);
            const isRetainedA = t.n <= 2;
            const isRetainedB = t.n >= N - 1;

            return (
              <g key={`c-tele-${t.n}`}>
                <circle
                  cx={posA.x}
                  cy={posA.y}
                  r={isRetainedA ? 6 : 4}
                  fill={
                    isRetainedA
                      ? MATH_COLORS.sequenceHighlight
                      : MATH_COLORS.combHeader
                  }
                />
                <text
                  x={posA.x}
                  y={posA.y - 6}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={
                    isRetainedA
                      ? MATH_COLORS.sequenceHighlight
                      : MATH_COLORS.combHeader
                  }
                  fontWeight={isRetainedA ? "bold" : "normal"}
                >
                  +{t.partA.toFixed(2)}
                </text>

                <circle
                  cx={posB.x}
                  cy={posB.y}
                  r={isRetainedB ? 6 : 4}
                  fill={
                    isRetainedB
                      ? MATH_COLORS.sequenceHighlight
                      : MATH_COLORS.sequenceHighlight
                  }
                />
                <text
                  x={posB.x}
                  y={posB.y + 14}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.sequenceHighlight}
                  fontWeight={isRetainedB ? "bold" : "normal"}
                >
                  -{t.partB.toFixed(2)}
                </text>

                {/* 跨越 2 项的对消弧线 */}
                {t.n <= N - 2 && (
                  <path
                    d={`M ${posB.x} ${posB.y} Q ${(posB.x + posA.x + 80) / 2} ${
                      (posB.y + posA.y) / 2 - 25
                    } ${posA.x + 80} ${posA.y}`}
                    fill="none"
                    stroke={MATH_COLORS.sequenceHighlight}
                    strokeWidth={1.5}
                    strokeDasharray="4,4"
                  />
                )}
              </g>
            );
          })}
        </g>
      );
    }

    if (modelType === "grouped") {
      const terms = groupedData.terms;

      return (
        <g className="sequence-scene-grouped">
          <CoordinateGrid scale={scale} fontScale={fontScale} />

          {terms.map((t) => {
            const ptAn = mathToDesign(t.n - 0.25, t.an, scale);
            const ptCn = mathToDesign(t.n - 0.25, t.cn, scale);
            const ptZero = mathToDesign(t.n - 0.25, 0, scale);
            const w = 22;

            const hAn = Math.abs(ptAn.y - ptZero.y);
            const hBn = Math.abs(ptCn.y - ptAn.y);

            return (
              <g key={`grp-${t.n}`}>
                {/* 蓝色底柱 (等差部分 a_n) */}
                <rect
                  x={ptAn.x - w / 2}
                  y={Math.min(ptAn.y, ptZero.y)}
                  width={w}
                  height={hAn}
                  fill={withAlpha(MATH_COLORS.sequence, 0.35)}
                  stroke={MATH_COLORS.sequence}
                  strokeWidth={1.5}
                />

                {/* 紫色上柱 (等比部分 b_n) */}
                <rect
                  x={ptCn.x - w / 2}
                  y={Math.min(ptCn.y, ptAn.y)}
                  width={w}
                  height={hBn}
                  fill={withAlpha(MATH_COLORS.sequenceSecondary, 0.45)}
                  stroke={MATH_COLORS.sequenceSecondary}
                  strokeWidth={1.5}
                />

                <text
                  x={ptCn.x}
                  y={ptCn.y - 6}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.sequenceSum}
                  fontWeight="bold"
                >
                  c_{t.n}={t.cn.toFixed(1)}
                </text>
              </g>
            );
          })}
        </g>
      );
    }

    if (modelType === "odd-even") {
      const terms = oddEvenData.terms;

      return (
        <g className="sequence-scene-odd-even">
          <CoordinateGrid scale={scale} fontScale={fontScale} />

          {terms.map((t) => {
            const ptCn = mathToDesign(t.n, t.cn, scale);
            const ptZero = mathToDesign(t.n, 0, scale);
            const isEven = t.n % 2 === 0;

            return (
              <g key={`oe-${t.n}`}>
                {/* 垂线与离散柱 */}
                <line
                  x1={ptCn.x}
                  y1={ptZero.y}
                  x2={ptCn.x}
                  y2={ptCn.y}
                  stroke={
                    isEven
                      ? MATH_COLORS.combHeader
                      : MATH_COLORS.sequenceHighlight
                  }
                  strokeWidth={2}
                />
                <circle
                  cx={ptCn.x}
                  cy={ptCn.y}
                  r={5}
                  fill={
                    isEven
                      ? MATH_COLORS.combHeader
                      : MATH_COLORS.sequenceHighlight
                  }
                />
                <text
                  x={ptCn.x}
                  y={ptCn.y + (isEven ? -8 : 14)}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={
                    isEven
                      ? MATH_COLORS.combHeader
                      : MATH_COLORS.sequenceHighlight
                  }
                  fontWeight="bold"
                >
                  c_{t.n}={t.cn}
                </text>

                {/* 奇偶项两两配对合并框 */}
                {isEven && (
                  <g>
                    <rect
                      x={mathToDesign(t.n - 1, 0, scale).x - 14}
                      y={mathToDesign(0, t.n + 1, scale).y}
                      width={
                        mathToDesign(t.n, 0, scale).x -
                        mathToDesign(t.n - 1, 0, scale).x +
                        28
                      }
                      height={Math.abs(
                        mathToDesign(0, -(t.n + 1), scale).y -
                          mathToDesign(0, t.n + 1, scale).y,
                      )}
                      fill={withAlpha(MATH_COLORS.sequenceSum, 0.1)}
                      stroke={MATH_COLORS.sequenceSum}
                      strokeDasharray="3,3"
                      rx={6}
                    />
                    <text
                      x={
                        (mathToDesign(t.n - 1, 0, scale).x +
                          mathToDesign(t.n, 0, scale).x) /
                        2
                      }
                      y={mathToDesign(0, -(t.n + 1), scale).y + 16}
                      textAnchor="middle"
                      fontSize={fontScale(10)}
                      fill={MATH_COLORS.sequenceSum}
                      fontWeight="bold"
                    >
                      和 = 1
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      );
    }
  }

  // 4. 递推与构造法求通项模式
  if (activeMode === "recurrence") {
    if (recurrenceModelType === "linear-pan") {
      const { terms, fixedPoint, cobwebPoints } = linearRecData;
      const fnLine = (x: number) => p_rec * x + q_rec;
      const diagLine = (x: number) => x;

      // 蛛网折线 path 字符串
      let cobwebPathStr = "";
      cobwebPoints.forEach((pt, idx) => {
        const dPt = mathToDesign(pt.x, pt.y, scale);
        if (idx === 0) {
          cobwebPathStr += `M ${dPt.x} ${dPt.y}`;
        } else {
          cobwebPathStr += ` L ${dPt.x} ${dPt.y}`;
        }
      });

      return (
        <g className="sequence-scene-linear-pan">
          <CoordinateGrid scale={scale} fontScale={fontScale} />

          {/* 直线 y = p*x + q */}
          <FunctionGraph
            fn={fnLine}
            scale={scale}
            color={MATH_COLORS.sequence}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />

          {/* 对角线 y = x */}
          <FunctionGraph
            fn={diagLine}
            scale={scale}
            color={MATH_COLORS.labelText}
            strokeWidth={1}
            strokeDasharray="3,3"
          />

          {/* 不动点 (c, c) */}
          {fixedPoint !== null && (
            <g>
              <circle
                cx={mathToDesign(fixedPoint, fixedPoint, scale).x}
                cy={mathToDesign(fixedPoint, fixedPoint, scale).y}
                r={6}
                fill={MATH_COLORS.sequenceHighlight}
                stroke={MATH_COLORS.white}
                strokeWidth={2}
              />
              <text
                x={mathToDesign(fixedPoint, fixedPoint, scale).x + 10}
                y={mathToDesign(fixedPoint, fixedPoint, scale).y - 10}
                fontSize={fontScale(11)}
                fill={MATH_COLORS.sequenceHighlight}
                fontWeight="bold"
              >
                不动点 c={fixedPoint.toFixed(2)}
              </text>
            </g>
          )}

          {/* 蛛网图阶梯迭代折线 */}
          <path
            d={cobwebPathStr}
            fill="none"
            stroke={MATH_COLORS.sequenceHighlight}
            strokeWidth={1.5}
            strokeDasharray="2,2"
          />

          {/* 各项散点：原数列 a_n 与 平移数列 b_n */}
          {terms.map((t) => {
            const posAn = mathToDesign(t.n, t.an, scale);
            const posBn = mathToDesign(t.n, t.bn, scale);
            const isHighlighted = t.n === highlightN;

            return (
              <g key={`lin-rec-${t.n}`}>
                {/* 原数列 a_n 散点 */}
                <line
                  x1={posAn.x}
                  y1={mathToDesign(t.n, 0, scale).y}
                  x2={posAn.x}
                  y2={posAn.y}
                  stroke={MATH_COLORS.sequenceStem}
                  strokeDasharray="2,2"
                />
                <circle
                  cx={posAn.x}
                  cy={posAn.y}
                  r={isHighlighted ? 6 : 4}
                  fill={MATH_COLORS.sequence}
                  stroke={MATH_COLORS.white}
                  strokeWidth={1.5}
                />
                {(t.n === 1 || t.n === N || isHighlighted) && (
                  <text
                    x={posAn.x}
                    y={posAn.y - 8}
                    textAnchor="middle"
                    fontSize={fontScale(10)}
                    fill={MATH_COLORS.sequence}
                    fontWeight="bold"
                  >
                    a_{t.n}={t.an.toFixed(1)}
                  </text>
                )}

                {/* 平移数列 b_n 散点 (当存在不动点 c 时) */}
                {fixedPoint !== null && (
                  <g>
                    <circle
                      cx={posBn.x}
                      cy={posBn.y}
                      r={4}
                      fill={MATH_COLORS.paramSecondary}
                      stroke={MATH_COLORS.white}
                      strokeWidth={1}
                    />
                    {(t.n === 1 || t.n === N || isHighlighted) && (
                      <text
                        x={posBn.x}
                        y={posBn.y + 14}
                        textAnchor="middle"
                        fontSize={fontScale(10)}
                        fill={MATH_COLORS.paramSecondary}
                      >
                        b_{t.n}={t.bn.toFixed(1)}
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

    if (recurrenceModelType === "accumulation") {
      const terms = accumRecData.terms;

      return (
        <g className="sequence-scene-accumulation">
          <CoordinateGrid scale={scale} fontScale={fontScale} />

          {terms.map((t) => {
            const posAn = mathToDesign(t.n, t.an, scale);
            const isHighlighted = t.n === highlightN;

            return (
              <g key={`accum-${t.n}`}>
                <line
                  x1={posAn.x}
                  y1={mathToDesign(t.n, 0, scale).y}
                  x2={posAn.x}
                  y2={posAn.y}
                  stroke={MATH_COLORS.sequenceStem}
                  strokeDasharray="2,2"
                />
                <circle
                  cx={posAn.x}
                  cy={posAn.y}
                  r={isHighlighted ? 6 : 4.5}
                  fill={MATH_COLORS.sequence}
                  stroke={MATH_COLORS.white}
                  strokeWidth={1.5}
                />
                <text
                  x={posAn.x}
                  y={posAn.y - 8}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.sequence}
                  fontWeight="bold"
                >
                  a_{t.n}={t.an.toFixed(1)}
                </text>
              </g>
            );
          })}
        </g>
      );
    }

    if (recurrenceModelType === "multiplication") {
      const terms = multRecData.terms;

      return (
        <g className="sequence-scene-multiplication">
          <CoordinateGrid scale={scale} fontScale={fontScale} />

          {terms.map((t) => {
            const posAn = mathToDesign(t.n, t.an, scale);
            const isHighlighted = t.n === highlightN;

            return (
              <g key={`mult-${t.n}`}>
                <line
                  x1={posAn.x}
                  y1={mathToDesign(t.n, 0, scale).y}
                  x2={posAn.x}
                  y2={posAn.y}
                  stroke={MATH_COLORS.sequenceStem}
                  strokeDasharray="2,2"
                />
                <circle
                  cx={posAn.x}
                  cy={posAn.y}
                  r={isHighlighted ? 6 : 4.5}
                  fill={MATH_COLORS.sequence}
                  stroke={MATH_COLORS.white}
                  strokeWidth={1.5}
                />
                <text
                  x={posAn.x}
                  y={posAn.y - 8}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.sequence}
                  fontWeight="bold"
                >
                  a_{t.n}={t.an.toFixed(3)}
                </text>
              </g>
            );
          })}
        </g>
      );
    }

    if (recurrenceModelType === "reciprocal") {
      const terms = recipRecData.terms;

      return (
        <g className="sequence-scene-reciprocal">
          <CoordinateGrid scale={scale} fontScale={fontScale} />

          {terms.map((t) => {
            const posAn = mathToDesign(t.n, t.an, scale);
            const posBn = Number.isNaN(t.bn)
              ? null
              : mathToDesign(t.n, t.bn, scale);
            const isHighlighted = t.n === highlightN;

            return (
              <g key={`recip-${t.n}`}>
                {/* 原数列 a_n */}
                {!Number.isNaN(t.an) && (
                  <g>
                    <circle
                      cx={posAn.x}
                      cy={posAn.y}
                      r={isHighlighted ? 6 : 4.5}
                      fill={MATH_COLORS.sequence}
                      stroke={MATH_COLORS.white}
                      strokeWidth={1.5}
                    />
                    <text
                      x={posAn.x}
                      y={posAn.y - 8}
                      textAnchor="middle"
                      fontSize={fontScale(10)}
                      fill={MATH_COLORS.sequence}
                      fontWeight="bold"
                    >
                      a_{t.n}={t.an.toFixed(2)}
                    </text>
                  </g>
                )}

                {/* 倒数数列 b_n = 1/a_n */}
                {posBn && (
                  <g>
                    <circle
                      cx={posBn.x}
                      cy={posBn.y}
                      r={4.5}
                      fill={MATH_COLORS.paramSecondary}
                      stroke={MATH_COLORS.white}
                      strokeWidth={1.5}
                    />
                    <text
                      x={posBn.x}
                      y={posBn.y + 14}
                      textAnchor="middle"
                      fontSize={fontScale(10)}
                      fill={MATH_COLORS.paramSecondary}
                    >
                      b_{t.n}={t.bn.toFixed(2)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      );
    }

    if (recurrenceModelType === "second-order") {
      const terms = secondRecData.terms;

      return (
        <g className="sequence-scene-second-order">
          <CoordinateGrid scale={scale} fontScale={fontScale} />

          {terms.map((t) => {
            const posAn = mathToDesign(t.n, t.an, scale);
            const isHighlighted = t.n === highlightN;

            return (
              <g key={`sec-order-${t.n}`}>
                <line
                  x1={posAn.x}
                  y1={mathToDesign(t.n, 0, scale).y}
                  x2={posAn.x}
                  y2={posAn.y}
                  stroke={MATH_COLORS.sequenceStem}
                  strokeDasharray="2,2"
                />
                <circle
                  cx={posAn.x}
                  cy={posAn.y}
                  r={isHighlighted ? 6 : 4.5}
                  fill={MATH_COLORS.sequence}
                  stroke={MATH_COLORS.white}
                  strokeWidth={1.5}
                />
                <text
                  x={posAn.x}
                  y={posAn.y - 8}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.sequence}
                  fontWeight="bold"
                >
                  a_{t.n}={t.an.toFixed(1)}
                </text>
              </g>
            );
          })}
        </g>
      );
    }
  }

  return null;
}
