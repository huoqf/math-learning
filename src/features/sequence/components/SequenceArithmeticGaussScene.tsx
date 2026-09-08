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
          posTopY - Math.abs(ptBase.y - mathToDesign(t.n, revTerm.an, scale).y);
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
