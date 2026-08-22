/**
 * src/features/sequence/components/SequenceModelsTelescopingScene.tsx
 * 数列实验室 - 高考求和模型 2：裂项相消法
 * (支持 3 种模式：标准差1型 / 跨项差2型 / 根式有理化型)
 */
import { CoordinateGrid } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale, ViewportInfo } from "@/hooks";
import type {
  TelescopingResult,
  CrossTelescopingResult,
  RadicalTelescopingResult,
} from "@/math/sequence";
import { toSub } from "./SequenceText";

interface SequenceModelsTelescopingSceneProps {
  teleGap: number;
  N: number;
  telescopingData: TelescopingResult;
  crossTelescopingData: CrossTelescopingResult;
  radicalTeleData: RadicalTelescopingResult;
  vp: ViewportInfo;
  scale: SceneScale;
  fontScale: (size: number) => number;
}

export function SequenceModelsTelescopingScene({
  teleGap,
  N,
  telescopingData,
  crossTelescopingData,
  radicalTeleData,
  vp,
  scale,
  fontScale,
}: SequenceModelsTelescopingSceneProps) {
  const isRadical = teleGap === 3;
  const isCross = teleGap === 2;

  // 1. 标准差 1 型: 1/(n(n+1)) = 1/n - 1/(n+1)
  if (!isRadical && !isCross) {
    const terms = telescopingData.terms;
    const limitY = mathToDesign(0, 1, scale).y;

    return (
      <g className="sequence-scene-telescoping-standard">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 极限水平线 y = 1 */}
        <line
          x1={mathToDesign(-0.8, 1, scale).x}
          y1={limitY}
          x2={mathToDesign(N + 1, 1, scale).x}
          y2={limitY}
          stroke={MATH_COLORS.sequenceHighlight}
          strokeWidth={1.5}
          strokeDasharray="5,3"
        />
        <text
          x={mathToDesign(N + 0.8, 1, scale).x}
          y={limitY - 6}
          textAnchor="end"
          fontSize={fontScale(9)}
          fill={MATH_COLORS.sequenceHighlight}
          fontWeight="bold"
        >
          极限收敛线 lim T_n = 1
        </text>

        {/* 各项对消与残留项锁定 */}
        {terms.map((t) => {
          const posA = mathToDesign(t.n, t.partA, scale);
          const posB = mathToDesign(t.n + 0.35, -t.partB, scale);
          const isRetainedA = t.n === 1;
          const isRetainedB = t.n === N;

          return (
            <g key={`tele-std-${t.n}`}>
              {/* 正项 +1/n */}
              <line
                x1={posA.x}
                y1={mathToDesign(t.n, 0, scale).y}
                x2={posA.x}
                y2={posA.y}
                stroke={
                  isRetainedA
                    ? MATH_COLORS.combHeader
                    : withAlpha(MATH_COLORS.combHeader, 0.5)
                }
                strokeWidth={isRetainedA ? 2 : 1.2}
              />
              <circle
                cx={posA.x}
                cy={posA.y}
                r={isRetainedA ? 6 : 3.5}
                fill={
                  isRetainedA
                    ? MATH_COLORS.sequenceHighlight
                    : withAlpha(MATH_COLORS.combHeader, 0.4)
                }
                stroke={MATH_COLORS.white}
                strokeWidth={1.2}
              />
              <text
                x={posA.x}
                y={posA.y - 7}
                textAnchor="middle"
                fontSize={fontScale(isRetainedA ? 10 : 8.5)}
                fill={
                  isRetainedA
                    ? MATH_COLORS.sequenceHighlight
                    : withAlpha(MATH_COLORS.combHeader, 0.8)
                }
                fontWeight={isRetainedA ? "bold" : "normal"}
              >
                +1/{t.n}
                {isRetainedA ? " (首项保留)" : ""}
              </text>

              {/* 负项 -1/(n+1) */}
              <line
                x1={posB.x}
                y1={mathToDesign(t.n, 0, scale).y}
                x2={posB.x}
                y2={posB.y}
                stroke={
                  isRetainedB
                    ? MATH_COLORS.paramPrimary
                    : withAlpha(MATH_COLORS.paramPrimary, 0.5)
                }
                strokeWidth={isRetainedB ? 2 : 1.2}
              />
              <circle
                cx={posB.x}
                cy={posB.y}
                r={isRetainedB ? 6 : 3.5}
                fill={
                  isRetainedB
                    ? MATH_COLORS.paramPrimary
                    : withAlpha(MATH_COLORS.paramPrimary, 0.4)
                }
                stroke={MATH_COLORS.white}
                strokeWidth={1.2}
              />
              <text
                x={posB.x}
                y={posB.y + 14}
                textAnchor="middle"
                fontSize={fontScale(isRetainedB ? 10 : 8.5)}
                fill={
                  isRetainedB
                    ? MATH_COLORS.paramPrimary
                    : withAlpha(MATH_COLORS.paramPrimary, 0.8)
                }
                fontWeight={isRetainedB ? "bold" : "normal"}
              >
                -1/{t.n + 1}
                {isRetainedB ? " (尾项保留)" : ""}
              </text>

              {/* 相邻项对消弧线与对消标记 */}
              {t.n < N && (
                <g>
                  <path
                    d={`M ${posB.x} ${posB.y} Q ${(posB.x + mathToDesign(t.n + 1, 0, scale).x) / 2} ${
                      mathToDesign(0, 0, scale).y - 12
                    } ${mathToDesign(t.n + 1, terms[t.n].partA, scale).x} ${mathToDesign(t.n + 1, terms[t.n].partA, scale).y}`}
                    fill="none"
                    stroke={withAlpha(MATH_COLORS.paramSecondary, 0.45)}
                    strokeWidth={1.2}
                    strokeDasharray="3,2"
                  />
                  <text
                    x={(posB.x + mathToDesign(t.n + 1, 0, scale).x) / 2}
                    y={mathToDesign(0, 0, scale).y - 14}
                    textAnchor="middle"
                    fontSize={fontScale(7.5)}
                    fill={MATH_COLORS.paramSecondary}
                  >
                    抵消
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  }

  // 2. 跨项差 2 型: 1/(n(n+2)) = 1/2 * (1/n - 1/(n+2))
  if (isCross) {
    const terms = crossTelescopingData.terms;
    const limitY = mathToDesign(0, 0.75, scale).y;

    return (
      <g className="sequence-scene-telescoping-cross">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 极限水平线 y = 0.75 */}
        <line
          x1={mathToDesign(-0.8, 0.75, scale).x}
          y1={limitY}
          x2={mathToDesign(N + 1, 0.75, scale).x}
          y2={limitY}
          stroke={MATH_COLORS.sequenceHighlight}
          strokeWidth={1.5}
          strokeDasharray="5,3"
        />
        <text
          x={mathToDesign(N + 0.8, 0.75, scale).x}
          y={limitY - 6}
          textAnchor="end"
          fontSize={fontScale(9)}
          fill={MATH_COLORS.sequenceHighlight}
          fontWeight="bold"
        >
          极限收敛线 lim T_n = 0.75 (½·(1 + ½))
        </text>

        {terms.map((t) => {
          const posA = mathToDesign(t.n, t.partA, scale);
          const posB = mathToDesign(t.n + 0.35, -t.partB, scale);
          const isRetainedA = t.n <= 2;
          const isRetainedB = t.n >= N - 1;

          return (
            <g key={`c-tele-${t.n}`}>
              {/* 正项 +1/(2n) */}
              <circle
                cx={posA.x}
                cy={posA.y}
                r={isRetainedA ? 6 : 3.5}
                fill={
                  isRetainedA
                    ? MATH_COLORS.sequenceHighlight
                    : withAlpha(MATH_COLORS.combHeader, 0.4)
                }
                stroke={MATH_COLORS.white}
                strokeWidth={1.2}
              />
              <text
                x={posA.x}
                y={posA.y - 6}
                textAnchor="middle"
                fontSize={fontScale(isRetainedA ? 10 : 8.5)}
                fill={
                  isRetainedA
                    ? MATH_COLORS.sequenceHighlight
                    : withAlpha(MATH_COLORS.combHeader, 0.8)
                }
                fontWeight={isRetainedA ? "bold" : "normal"}
              >
                +1/{2 * t.n}
                {isRetainedA ? " (留)" : ""}
              </text>

              {/* 负项 -1/(2(n+2)) */}
              <circle
                cx={posB.x}
                cy={posB.y}
                r={isRetainedB ? 6 : 3.5}
                fill={
                  isRetainedB
                    ? MATH_COLORS.paramPrimary
                    : withAlpha(MATH_COLORS.paramPrimary, 0.4)
                }
                stroke={MATH_COLORS.white}
                strokeWidth={1.2}
              />
              <text
                x={posB.x}
                y={posB.y + 14}
                textAnchor="middle"
                fontSize={fontScale(isRetainedB ? 10 : 8.5)}
                fill={
                  isRetainedB
                    ? MATH_COLORS.paramPrimary
                    : withAlpha(MATH_COLORS.paramPrimary, 0.8)
                }
                fontWeight={isRetainedB ? "bold" : "normal"}
              >
                -1/{2 * (t.n + 2)}
                {isRetainedB ? " (留)" : ""}
              </text>

              {/* 跨越 2 项的对消弧线 */}
              {t.n <= N - 2 && (
                <g>
                  <path
                    d={`M ${posB.x} ${posB.y} Q ${(posB.x + mathToDesign(t.n + 2, 0, scale).x) / 2} ${
                      mathToDesign(0, 0, scale).y - 18
                    } ${mathToDesign(t.n + 2, terms[t.n + 1].partA, scale).x} ${mathToDesign(t.n + 2, terms[t.n + 1].partA, scale).y}`}
                    fill="none"
                    stroke={withAlpha(MATH_COLORS.paramSecondary, 0.4)}
                    strokeWidth={1.2}
                    strokeDasharray="4,4"
                  />
                  <text
                    x={(posB.x + mathToDesign(t.n + 2, 0, scale).x) / 2}
                    y={mathToDesign(0, 0, scale).y - 20}
                    textAnchor="middle"
                    fontSize={fontScale(7.5)}
                    fill={MATH_COLORS.paramSecondary}
                  >
                    跨项抵消
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  }

  // 3. 根式有理化型: 1/(sqrt(n)+sqrt(n+1)) = sqrt(n+1) - sqrt(n)
  if (isRadical) {
    const terms = radicalTeleData.terms;
    const bannerY = vp.designTop + 24;

    return (
      <g className="sequence-scene-telescoping-radical">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 顶部总和横幅 */}
        <g className="radical-banner">
          <rect
            x={vp.centerX - 220}
            y={bannerY}
            width={440}
            height={28}
            rx={14}
            fill={withAlpha(MATH_COLORS.white, 0.95)}
            stroke={MATH_COLORS.sequenceHighlight}
            strokeWidth={1.2}
          />
          <text
            x={vp.centerX}
            y={bannerY + 18}
            textAnchor="middle"
            fontSize={fontScale(10.5)}
            fill={MATH_COLORS.sequenceHighlight}
            fontWeight="bold"
          >
            根式伸缩和：T{toSub(N)} = √(N+1) - √1 = √{N + 1} - 1 ≈{" "}
            {radicalTeleData.finalTn.toFixed(3)}
          </text>
        </g>

        {terms.map((t) => {
          const posA = mathToDesign(t.n, t.partA, scale);
          const posB = mathToDesign(t.n, -t.partB, scale);
          const isRetainedA = t.n === N;
          const isRetainedB = t.n === 1;

          return (
            <g key={`tele-rad-${t.n}`}>
              {/* 正项 +√(n+1) */}
              <line
                x1={posA.x}
                y1={mathToDesign(t.n, 0, scale).y}
                x2={posA.x}
                y2={posA.y}
                stroke={MATH_COLORS.combHeader}
                strokeWidth={1.5}
              />
              <circle
                cx={posA.x}
                cy={posA.y}
                r={isRetainedA ? 6 : 3.5}
                fill={
                  isRetainedA
                    ? MATH_COLORS.sequenceHighlight
                    : withAlpha(MATH_COLORS.combHeader, 0.5)
                }
                stroke={MATH_COLORS.white}
                strokeWidth={1.2}
              />
              <text
                x={posA.x}
                y={posA.y - 6}
                textAnchor="middle"
                fontSize={fontScale(isRetainedA ? 10 : 8.5)}
                fill={
                  isRetainedA
                    ? MATH_COLORS.sequenceHighlight
                    : withAlpha(MATH_COLORS.combHeader, 0.8)
                }
                fontWeight={isRetainedA ? "bold" : "normal"}
              >
                +√{t.n + 1}
                {isRetainedA ? " (尾项保留)" : ""}
              </text>

              {/* 负项 -√n */}
              <line
                x1={posB.x}
                y1={mathToDesign(t.n, 0, scale).y}
                x2={posB.x}
                y2={posB.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1.5}
              />
              <circle
                cx={posB.x}
                cy={posB.y}
                r={isRetainedB ? 6 : 3.5}
                fill={
                  isRetainedB
                    ? MATH_COLORS.paramPrimary
                    : withAlpha(MATH_COLORS.paramPrimary, 0.5)
                }
                stroke={MATH_COLORS.white}
                strokeWidth={1.2}
              />
              <text
                x={posB.x}
                y={posB.y + 14}
                textAnchor="middle"
                fontSize={fontScale(isRetainedB ? 10 : 8.5)}
                fill={
                  isRetainedB
                    ? MATH_COLORS.paramPrimary
                    : withAlpha(MATH_COLORS.paramPrimary, 0.8)
                }
                fontWeight={isRetainedB ? "bold" : "normal"}
              >
                -√{t.n}
                {isRetainedB ? " (首项保留: -1)" : ""}
              </text>

              {/* 前项 +√(k+1) 与 后项 -√(k+1) 对消连接弧线 */}
              {t.n < N && (
                <g>
                  <path
                    d={`M ${posA.x} ${posA.y} Q ${(posA.x + mathToDesign(t.n + 1, 0, scale).x) / 2} ${mathToDesign(0, 0, scale).y} ${mathToDesign(t.n + 1, -t.partA, scale).x} ${mathToDesign(t.n + 1, -t.partA, scale).y}`}
                    fill="none"
                    stroke={withAlpha(MATH_COLORS.paramSecondary, 0.4)}
                    strokeWidth={1.2}
                    strokeDasharray="3,2"
                  />
                  <text
                    x={(posA.x + mathToDesign(t.n + 1, 0, scale).x) / 2}
                    y={mathToDesign(0, 0, scale).y - 4}
                    textAnchor="middle"
                    fontSize={fontScale(7.5)}
                    fill={MATH_COLORS.paramSecondary}
                  >
                    伸缩抵消
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  }

  return null;
}
