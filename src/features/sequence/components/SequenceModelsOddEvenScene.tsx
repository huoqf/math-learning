/**
 * src/features/sequence/components/SequenceModelsOddEvenScene.tsx
 * 数列实验室 - 高考求和模型 5：奇偶并项求和法 (摆动配对与双轨分段)
 */
import { CoordinateGrid } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks";
import type { OddEvenResult } from "@/math/sequence";
import { toSub } from "./SequenceText";

interface SequenceModelsOddEvenSceneProps {
  oddEvenData: OddEvenResult;
  scale: SceneScale;
  fontScale: (size: number) => number;
}

export function SequenceModelsOddEvenScene({
  oddEvenData,
  scale,
  fontScale,
}: SequenceModelsOddEvenSceneProps) {
  const terms = oddEvenData.terms;

  const barW = Math.min(30, Math.max(16, scale.scaleX * 0.42));

  // 计算双轨前 n 项和
  const evenTrackPoints: Array<{ x: number; y: number }> = [];
  const oddTrackPoints: Array<{ x: number; y: number }> = [];

  terms.forEach((t) => {
    if (t.n % 2 === 0) {
      evenTrackPoints.push(mathToDesign(t.n, t.Tn, scale));
    } else {
      oddTrackPoints.push(mathToDesign(t.n, t.Tn, scale));
    }
  });

  return (
    <g className="sequence-scene-odd-even">
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 偶数项和轨迹线 S_{2k} = k */}
      {evenTrackPoints.map((pt, idx) => {
        if (idx === 0) return null;
        const prev = evenTrackPoints[idx - 1];
        return (
          <line
            key={`even-track-${idx}`}
            x1={prev.x}
            y1={prev.y}
            x2={pt.x}
            y2={pt.y}
            stroke={MATH_COLORS.combHeader}
            strokeWidth={1.8}
            strokeDasharray="4,2"
          />
        );
      })}

      {/* 奇数项和轨迹线 S_{2k-1} = -k */}
      {oddTrackPoints.map((pt, idx) => {
        if (idx === 0) return null;
        const prev = oddTrackPoints[idx - 1];
        return (
          <line
            key={`odd-track-${idx}`}
            x1={prev.x}
            y1={prev.y}
            x2={pt.x}
            y2={pt.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.8}
            strokeDasharray="4,2"
          />
        );
      })}

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
                isEven ? MATH_COLORS.combHeader : MATH_COLORS.paramPrimary
              }
              strokeWidth={2}
            />
            <circle
              cx={ptCn.x}
              cy={ptCn.y}
              r={5}
              fill={isEven ? MATH_COLORS.combHeader : MATH_COLORS.paramPrimary}
            />
            <text
              x={ptCn.x}
              y={ptCn.y + (isEven ? -8 : 14)}
              textAnchor="middle"
              fontSize={fontScale(10)}
              fill={isEven ? MATH_COLORS.combHeader : MATH_COLORS.paramPrimary}
              fontWeight="bold"
            >
              c{toSub(t.n)} = {t.cn > 0 ? `+${t.cn}` : t.cn}
            </text>

            {/* 奇偶项两两配对合并框 */}
            {isEven && (
              <g>
                <rect
                  x={mathToDesign(t.n - 1, 0, scale).x - barW / 2 - 4}
                  y={mathToDesign(0, t.n + 0.8, scale).y}
                  width={
                    mathToDesign(t.n, 0, scale).x -
                    mathToDesign(t.n - 1, 0, scale).x +
                    barW +
                    8
                  }
                  height={Math.abs(
                    mathToDesign(0, -(t.n + 0.8), scale).y -
                      mathToDesign(0, t.n + 0.8, scale).y,
                  )}
                  fill={withAlpha(MATH_COLORS.sequenceSum, 0.08)}
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
                  y={mathToDesign(0, -(t.n + 0.8), scale).y + 16}
                  textAnchor="middle"
                  fontSize={fontScale(8.5)}
                  fill={MATH_COLORS.sequenceSum}
                  fontWeight="bold"
                >
                  (-{t.n - 1}) + (+{t.n}) = +1
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
