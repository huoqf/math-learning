/**
 * src/features/sequence/components/SequenceArithmeticGaussScene.tsx
 * 等差数列 - 专题 B: 高斯倒序相加几何拼图 (无字证明长方形)
 */
import { CoordinateGrid } from "@/components/Math";
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

export function SequenceArithmeticGaussScene({
  params,
  scale,
  fontScale,
}: ArithmeticSubSceneProps) {
  const { a1, N, gaussRatio, arithData } = useSequenceParams(params);

  const { terms } = arithData;
  const colWidth = 24;
  const aN = terms[N - 1]?.an ?? 0;
  const sumHeightVal = a1 + aN;

  return (
    <g className="sequence-scene-arithmetic-gauss">
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 正序柱与倒序柱渲染：正项执行无字证明几何扣合，负项执行代数对称并排配对 */}
      {(() => {
        const hasNegative = terms.some((t) => t.an < -1e-6);
        const isGeometricValid = !hasNegative && sumHeightVal > 1e-6;

        if (isGeometricValid) {
          // ─── 构型 A: 正项几何无字证明 (阶梯柱旋转扣合成大长方形) ───
          return terms.map((t, idx) => {
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
          });
        }

        // ─── 构型 B: 含负项代数对称配对视图 (真实符号双列并排与对称连线) ───
        const halfCol = colWidth / 2 - 2;
        return terms.map((t, idx) => {
          const revIdx = N - 1 - idx;
          const revTerm = terms[revIdx];
          const ptBase = mathToDesign(t.n, 0, scale);
          const ptAn = mathToDesign(t.n, t.an, scale);
          const ptRevAn = mathToDesign(t.n, revTerm.an, scale);

          // 正序柱实际有向高度与顶底
          const leftTopY = Math.min(ptBase.y, ptAn.y);
          const leftH = Math.max(2, Math.abs(ptBase.y - ptAn.y));

          // 倒序柱实际有向高度与顶底
          const rightTopY = Math.min(ptBase.y, ptRevAn.y);
          const rightH = Math.max(2, Math.abs(ptBase.y - ptRevAn.y));

          return (
            <g key={`gauss-paired-${t.n}`}>
              {/* 左柱：正序项 a_n */}
              <rect
                x={ptBase.x - colWidth / 2}
                y={leftTopY}
                width={halfCol}
                height={leftH}
                fill={withAlpha(MATH_COLORS.sequence, 0.45)}
                stroke={MATH_COLORS.sequence}
                strokeWidth={1.2}
                rx={2}
              />
              {leftH >= 12 && (
                <text
                  x={ptBase.x - colWidth / 2 + halfCol / 2}
                  y={leftTopY + leftH / 2 + 3}
                  textAnchor="middle"
                  fontSize={fontScale(7.5)}
                  fill={MATH_COLORS.sequence}
                  fontWeight="bold"
                >
                  {t.an.toFixed(1)}
                </text>
              )}

              {/* 右柱：倒序项 a_{N-n+1} */}
              <rect
                x={ptBase.x + 2}
                y={rightTopY}
                width={halfCol}
                height={rightH}
                fill={withAlpha(MATH_COLORS.paramSecondary, 0.45)}
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={1.2}
                rx={2}
              />
              {rightH >= 12 && (
                <text
                  x={ptBase.x + 2 + halfCol / 2}
                  y={rightTopY + rightH / 2 + 3}
                  textAnchor="middle"
                  fontSize={fontScale(7.5)}
                  fill={MATH_COLORS.paramSecondary}
                  fontWeight="bold"
                >
                  {revTerm.an.toFixed(1)}
                </text>
              )}

              {/* 两柱配对标注 (显示 a_n + a_{N-n+1} 恒定值) */}
              <text
                x={ptBase.x}
                y={
                  mathToDesign(t.n, 0, scale).y +
                  (t.an >= 0 && revTerm.an >= 0 ? 15 : -8)
                }
                textAnchor="middle"
                fontSize={fontScale(7.5)}
                fill={MATH_COLORS.paramSecondary}
                fontWeight="bold"
              >
                和={(t.an + revTerm.an).toFixed(1)}
              </text>
            </g>
          );
        });
      })()}

      {/* 扣合完成时的大外接矩形金色边框与总和公式（带正项几何与负项代数分流守卫） */}
      {gaussRatio >= 0.75 && (
        <g opacity={(gaussRatio - 0.75) / 0.25}>
          {(() => {
            const hasNegative = terms.some((t) => t.an < -1e-6);
            const isGeometricValid = !hasNegative && sumHeightVal > 1e-6;
            const ptLeft = mathToDesign(1, 0, scale);
            const ptRight = mathToDesign(N, 0, scale);
            const ptTop = mathToDesign(1, sumHeightVal, scale);
            const rectX = ptLeft.x - colWidth / 2;
            const rectW = ptRight.x - ptLeft.x + colWidth;
            const rectY = Math.min(ptLeft.y, ptTop.y);
            const rectH = Math.max(4, Math.abs(ptLeft.y - ptTop.y));
            const bannerWidth = isGeometricValid ? 320 : 420;

            return (
              <g>
                {/* 仅在正项具有几何面积意义时绘制大长方形外框，负项时渲染配对轮廓框 */}
                <rect
                  x={rectX}
                  y={rectY}
                  width={rectW}
                  height={rectH}
                  fill="none"
                  stroke={
                    isGeometricValid
                      ? MATH_COLORS.sequenceHighlight
                      : withAlpha(MATH_COLORS.paramSecondary, 0.7)
                  }
                  strokeWidth={1.8}
                  strokeDasharray={isGeometricValid ? "5,3" : "3,3"}
                  rx={4}
                />
                {/* 顶部中央公式横幅 */}
                <g transform={`translate(${rectX + rectW / 2}, 24)`}>
                  <rect
                    x={-bannerWidth / 2}
                    y={-14}
                    width={bannerWidth}
                    height={isGeometricValid ? 28 : 42}
                    fill={withAlpha(MATH_COLORS.white, 0.96)}
                    stroke={
                      isGeometricValid
                        ? MATH_COLORS.sequenceHighlight
                        : MATH_COLORS.paramSecondary
                    }
                    strokeWidth={1.2}
                    rx={5}
                  />
                  <text
                    x={0}
                    y={isGeometricValid ? 4 : 0}
                    textAnchor="middle"
                    fontSize={fontScale(10.5)}
                    fill={
                      isGeometricValid
                        ? MATH_COLORS.sequenceHighlight
                        : MATH_COLORS.paramSecondary
                    }
                    fontWeight="bold"
                  >
                    {isGeometricValid
                      ? `大长方形面积 = 2S${toSub(N)} = ${N} × (a₁ + a${toSub(N)}) = ${(N * sumHeightVal).toFixed(1)}`
                      : `代数配对和 = 2S${toSub(N)} = ${N} × (a₁ + a${toSub(N)}) = ${(N * sumHeightVal).toFixed(1)}`}
                  </text>
                  {!isGeometricValid && (
                    <text
                      x={0}
                      y={16}
                      textAnchor="middle"
                      fontSize={fontScale(8.5)}
                      fill={MATH_COLORS.textMuted}
                    >
                      (几何面积拼图需各项非负且和为正：本例不适用，代数对称相加恒等式依然成立)
                    </text>
                  )}
                </g>
              </g>
            );
          })()}
        </g>
      )}
    </g>
  );
}
