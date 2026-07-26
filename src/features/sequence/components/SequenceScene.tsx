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
} from "@/math/sequence";
import type { SceneScale, ViewportInfo } from "@/hooks";

interface SequenceSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  activeMode: "arithmetic" | "geometric" | "models";
  geometricViewType?: "points" | "tessellation";
  modelType?:
    "arith-geo" | "telescoping" | "cross-telescoping" | "grouped" | "odd-even";
  highlightN?: number;
  onSelectN?: (n: number) => void;
}

export function SequenceScene({
  params,
  scale,
  fontScale,
  activeMode,
  geometricViewType = "points",
  modelType = "arith-geo",
  highlightN = 1,
  onSelectN,
}: SequenceSceneProps) {
  const a1 = params.a1 ?? 3;
  const d = params.d ?? -1;
  const q = params.q ?? 0.5;
  const N = Math.max(3, Math.min(15, Math.round(params.N ?? 8)));

  // 计算数列数据
  const arithData = useMemo(() => calcArithmeticSequence(a1, d, N), [a1, d, N]);
  const geoData = useMemo(() => calcGeometricSequence(a1, q, N), [a1, q, N]);
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

  // 1. 等差数列模式渲染
  if (activeMode === "arithmetic") {
    const { terms, lineFn, parabolaFn, maxSnInfo } = arithData;

    return (
      <g className="sequence-scene-arithmetic">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        <FunctionGraph
          fn={lineFn}
          scale={scale}
          color={MATH_COLORS.sequence}
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />

        {Math.abs(d) > 1e-9 && (
          <FunctionGraph
            fn={parabolaFn}
            scale={scale}
            color={MATH_COLORS.sequenceSum}
            strokeWidth={1.5}
            strokeDasharray="3,3"
          />
        )}

        {terms.map((t) => {
          const pt0 = mathToDesign(t.n - 0.25, 0, scale);
          const pt1 = mathToDesign(t.n + 0.25, t.an, scale);
          const x = Math.min(pt0.x, pt1.x);
          const y = Math.min(pt0.y, pt1.y);
          const width = Math.abs(pt1.x - pt0.x);
          const height = Math.abs(pt1.y - pt0.y);
          const isHighlighted = t.n === highlightN;

          return (
            <g
              key={`bar-${t.n}`}
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
                    : MATH_COLORS.sequence,
                  0.2,
                )}
                stroke={
                  isHighlighted
                    ? MATH_COLORS.sequenceHighlight
                    : MATH_COLORS.sequence
                }
                strokeWidth={isHighlighted ? 2 : 1}
                rx={2}
              />
            </g>
          );
        })}

        {terms.map((t) => {
          const posAn = mathToDesign(t.n, t.an, scale);
          const posSn = mathToDesign(t.n, t.Sn, scale);
          const isMaxSn = maxSnInfo && t.n === maxSnInfo.nMax;
          const isHighlighted = t.n === highlightN;
          // 标注密集时仅显示首尾和高亮项
          const showFullLabel =
            isHighlighted || t.n === 1 || t.n === N || isMaxSn;

          // a_n 标注：始终在点上方
          const anLabelY = posAn.y - 8;

          // S_n 标注：当 a_n 与 S_n 的屏幕距离 < 16px 时下移避免碰撞
          const snTooClose = Math.abs(posAn.y - posSn.y) < 16;
          const snLabelY = snTooClose ? posSn.y + 16 : posSn.y - 8;

          return (
            <g key={`pts-${t.n}`}>
              <line
                x1={posAn.x}
                y1={mathToDesign(t.n, 0, scale).y}
                x2={posAn.x}
                y2={posAn.y}
                stroke={MATH_COLORS.sequenceStem}
                strokeDasharray="2,2"
                strokeWidth={1}
              />

              <circle
                cx={posAn.x}
                cy={posAn.y}
                r={4}
                fill={MATH_COLORS.sequence}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
              {showFullLabel && (
                <text
                  x={posAn.x}
                  y={anLabelY}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.sequence}
                  fontWeight="500"
                >
                  a_{t.n}={t.an.toFixed(1)}
                </text>
              )}

              <circle
                cx={posSn.x}
                cy={posSn.y}
                r={isMaxSn ? 6 : 4}
                fill={
                  isMaxSn
                    ? MATH_COLORS.sequenceHighlight
                    : MATH_COLORS.sequenceSum
                }
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
              {showFullLabel && (
                <text
                  x={posSn.x}
                  y={snLabelY}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={
                    isMaxSn
                      ? MATH_COLORS.sequenceHighlight
                      : MATH_COLORS.sequenceSum
                  }
                  fontWeight={isMaxSn ? "bold" : "normal"}
                >
                  S_{t.n}={t.Sn.toFixed(1)}
                </text>
              )}

              {isMaxSn && (
                <g>
                  <circle
                    cx={posSn.x}
                    cy={posSn.y}
                    r={10}
                    fill="none"
                    stroke={MATH_COLORS.sequenceHighlight}
                    strokeWidth={1.5}
                    strokeDasharray="2,2"
                  />
                  <line
                    x1={posSn.x}
                    y1={posSn.y - 10}
                    x2={posSn.x}
                    y2={posSn.y - 25}
                    stroke={MATH_COLORS.sequenceHighlight}
                    strokeWidth={1}
                  />
                  <text
                    x={posSn.x}
                    y={posSn.y - 28}
                    textAnchor="middle"
                    fontSize={fontScale(11)}
                    fill={MATH_COLORS.sequenceHighlight}
                    fontWeight="bold"
                  >
                    S_n极值项(n={t.n})
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  }

  // 2. 等比数列模式渲染
  if (activeMode === "geometric") {
    const { terms, expFn, limitSum } = geoData;

    if (geometricViewType === "tessellation" && q > 0 && q < 1) {
      const centerPt = mathToDesign(0, 0, scale);
      const size = 280;
      const x0 = centerPt.x - size / 2;
      const y0 = centerPt.y - size / 2;

      const tessBlocks: Array<{
        x: number;
        y: number;
        w: number;
        h: number;
        label: string;
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
      ];

      let runningTerm = a1;
      for (let k = 1; k <= Math.min(N, 6); k++) {
        const color = palette[(k - 1) % palette.length];
        const valStr = runningTerm.toFixed(3);

        if (k % 2 === 1) {
          const w = curW * (1 - q);
          tessBlocks.push({
            x: curX,
            y: curY,
            w: Math.max(w, curW * 0.5),
            h: curH,
            label: `a_${k}=${valStr}`,
            val: runningTerm,
            color,
          });
          curX += w;
          curW -= w;
        } else {
          const h = curH * (1 - q);
          tessBlocks.push({
            x: curX,
            y: curY,
            w: curW,
            h: Math.max(h, curH * 0.5),
            label: `a_${k}=${valStr}`,
            val: runningTerm,
            color,
          });
          curY += h;
          curH -= h;
        }
        runningTerm *= q;
      }

      const limitText = limitSum !== null ? limitSum.toFixed(3) : "";

      return (
        <g className="sequence-scene-tessellation">
          <CoordinateGrid scale={scale} fontScale={fontScale} />

          <rect
            x={x0}
            y={y0}
            width={size}
            height={size}
            fill={MATH_COLORS.white}
            stroke={MATH_COLORS.labelText}
            strokeWidth={2}
          />

          {tessBlocks.map((b, idx) => (
            <g key={`tess-${idx}`}>
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                fill={withAlpha(b.color, 0.25)}
                stroke={b.color}
                strokeWidth={1.5}
              />
              {b.w > 30 && b.h > 20 && (
                <text
                  x={b.x + b.w / 2}
                  y={b.y + b.h / 2 + 4}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={b.color}
                  fontWeight="bold"
                >
                  {b.label}
                </text>
              )}
            </g>
          ))}

          <text
            x={x0 + size / 2}
            y={y0 - 12}
            textAnchor="middle"
            fontSize={fontScale(13)}
            fill={MATH_COLORS.sequenceHighlight}
            fontWeight="bold"
          >
            正方形总面积 = S_∞ = a₁ / (1 - q) = {limitText}
          </text>
        </g>
      );
    }

    return (
      <g className="sequence-scene-geometric">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {expFn && (
          <FunctionGraph
            fn={expFn}
            scale={scale}
            color={MATH_COLORS.sequence}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
        )}

        {limitSum !== null && (
          <g>
            <line
              x1={mathToDesign(-1, limitSum, scale).x}
              y1={mathToDesign(0, limitSum, scale).y}
              x2={mathToDesign(N + 1, limitSum, scale).x}
              y2={mathToDesign(0, limitSum, scale).y}
              stroke={MATH_COLORS.sequenceHighlight}
              strokeWidth={1.5}
              strokeDasharray="5,3"
            />
            <text
              x={mathToDesign(N + 0.5, limitSum, scale).x}
              y={mathToDesign(0, limitSum, scale).y - 6}
              textAnchor="end"
              fontSize={fontScale(11)}
              fill={MATH_COLORS.sequenceHighlight}
              fontWeight="bold"
            >
              极限 S_∞ = {limitSum.toFixed(2)}
            </text>
          </g>
        )}

        {terms.map((t) => {
          const posAn = mathToDesign(t.n, t.an, scale);
          const posSn = mathToDesign(t.n, t.Sn, scale);
          const isHighlighted = t.n === highlightN;
          const showFullLabel = isHighlighted || t.n === 1 || t.n === N;

          // a_n 标注：正值在上方，负值在下方
          const anLabelY = t.an >= 0 ? posAn.y - 8 : posAn.y + 14;

          // S_n 标注：当 a_n 与 S_n 屏幕距离 < 16px 时下移避免碰撞
          const snTooClose = Math.abs(posAn.y - posSn.y) < 16;
          const snLabelY = snTooClose ? posSn.y + 16 : posSn.y - 8;

          return (
            <g key={`geopts-${t.n}`}>
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
                r={4.5}
                fill={MATH_COLORS.sequence}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
              {showFullLabel && (
                <text
                  x={posAn.x}
                  y={anLabelY}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.sequence}
                >
                  a_{t.n}={t.an.toFixed(2)}
                </text>
              )}

              <circle
                cx={posSn.x}
                cy={posSn.y}
                r={4.5}
                fill={MATH_COLORS.sequenceSum}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
              {showFullLabel && (
                <text
                  x={posSn.x}
                  y={snLabelY}
                  textAnchor="middle"
                  fontSize={fontScale(10)}
                  fill={MATH_COLORS.sequenceSum}
                >
                  S_{t.n}={t.Sn.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}
      </g>
    );
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

  return null;
}
