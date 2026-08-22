/**
 * src/features/sequence/components/SequenceModelsArithGeoScene.tsx
 * 数列实验室 - 高考求和模型 1：错位相减法
 * (支持 4 步推导演化视图与矩阵错位对齐)
 */
import { CoordinateGrid } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale, ViewportInfo } from "@/hooks";
import type { ArithGeoSplitTerm } from "@/math/sequence";
import { toSub, toSup } from "./SequenceText";

interface SequenceModelsArithGeoSceneProps {
  terms: ArithGeoSplitTerm[];
  q: number;
  N: number;
  sumStep: number;
  vp: ViewportInfo;
  scale: SceneScale;
  fontScale: (size: number) => number;
}

export function SequenceModelsArithGeoScene({
  terms,
  q,
  N,
  sumStep,
  vp,
  scale,
  fontScale,
}: SequenceModelsArithGeoSceneProps) {
  const isCriticalQ1 = Math.abs(q - 1) < 1e-4;

  const barW = Math.min(30, Math.max(16, scale.scaleX * 0.42));

  // 顶部推导阶段说明横幅
  const stepTitles: Record<number, { text: string; sub: string }> = {
    1: {
      text: "Step 1: 原求和式列出",
      sub: "Tₙ = a₁·b₁ + a₂·b₂ + ... + aₙ·bₙ",
    },
    2: {
      text: "Step 2: 乘以公比整体错位",
      sub: "q·Tₙ = a₁·b₂ + a₂·b₃ + ... + aₙ·bₙ₊₁ (向右平移 1 格)",
    },
    3: {
      text: "Step 3: 两式对应项相减",
      sub: "(1-q)Tₙ = a₁·b₁ + d·(b₂ + ... + bₙ) - aₙ·bₙ₊₁",
    },
    4: {
      text: "Step 4: 等比部分求和化简",
      sub: "转化中间 (n-1) 项为纯等比数列求和，注意尾项符号与指数",
    },
  };

  const curStepInfo = stepTitles[sumStep] ?? stepTitles[1];
  const bannerY = vp.designTop + 24;

  return (
    <g className="sequence-scene-arith-geo">
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 顶部步骤标题胶囊 */}
      <g className="step-banner">
        <rect
          x={vp.centerX - 240}
          y={bannerY}
          width={480}
          height={30}
          rx={15}
          fill={withAlpha(MATH_COLORS.white, 0.95)}
          stroke={MATH_COLORS.sequenceHighlight}
          strokeWidth={1.5}
        />
        <text
          x={vp.centerX}
          y={bannerY + 19}
          textAnchor="middle"
          fontSize={fontScale(11)}
          fill={MATH_COLORS.sequenceHighlight}
          fontWeight="bold"
        >
          {curStepInfo.text}：{curStepInfo.sub}
        </text>
      </g>

      {/* q = 1 退化告警横幅 */}
      {isCriticalQ1 && (
        <g className="q1-warning-banner">
          <rect
            x={vp.centerX - 200}
            y={bannerY + 36}
            width={400}
            height={26}
            rx={6}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.15)}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.2}
            strokeDasharray="4,3"
          />
          <text
            x={vp.centerX}
            y={bannerY + 53}
            textAnchor="middle"
            fontSize={fontScale(10)}
            fill={MATH_COLORS.paramPrimary}
            fontWeight="bold"
          >
            ⚠️ 当 q = 1 时，公比为 1 导致 (1-q)=0，错位相减法失效！
          </text>
        </g>
      )}

      {/* Step 1: 原式单行序列柱体 */}
      {sumStep === 1 &&
        terms.map((t) => {
          const pt = mathToDesign(t.n, t.cn, scale);
          const ptZero = mathToDesign(t.n, 0, scale);

          return (
            <g key={`ag-s1-${t.n}`}>
              <rect
                x={pt.x - barW / 2}
                y={Math.min(pt.y, ptZero.y)}
                width={barW}
                height={Math.max(2, Math.abs(pt.y - ptZero.y))}
                fill={withAlpha(MATH_COLORS.sequence, 0.35)}
                stroke={MATH_COLORS.sequence}
                strokeWidth={1.5}
                rx={3}
              />
              <text
                x={pt.x}
                y={Math.min(pt.y, ptZero.y) - 7}
                textAnchor="middle"
                fontSize={fontScale(9.5)}
                fill={MATH_COLORS.sequence}
                fontWeight="bold"
              >
                c{toSub(t.n)} = {t.cn.toFixed(2)}
              </text>
              <text
                x={pt.x}
                y={ptZero.y + 18}
                textAnchor="middle"
                fontSize={fontScale(8.5)}
                fill={MATH_COLORS.labelText}
              >
                a{toSub(t.n)} · b{toSub(t.n)}
              </text>
            </g>
          );
        })}

      {/* Step 2: 双行矩阵错位对齐对比 */}
      {sumStep === 2 && (
        <g className="step-2-shift-grid">
          {/* 第一行: 原数列 T_n 各项 */}
          {terms.map((t) => {
            const pt = mathToDesign(t.n, t.cn, scale);
            const ptZero = mathToDesign(t.n, 0, scale);
            return (
              <g key={`ag-s2-tn-${t.n}`}>
                <rect
                  x={pt.x - barW / 2}
                  y={Math.min(pt.y, ptZero.y)}
                  width={barW}
                  height={Math.max(2, Math.abs(pt.y - ptZero.y))}
                  fill={withAlpha(MATH_COLORS.sequence, 0.3)}
                  stroke={MATH_COLORS.sequence}
                  strokeWidth={1.2}
                  rx={3}
                />
                <text
                  x={pt.x}
                  y={Math.min(pt.y, ptZero.y) - 6}
                  textAnchor="middle"
                  fontSize={fontScale(9)}
                  fill={MATH_COLORS.sequence}
                >
                  a{toSub(t.n)}b{toSub(t.n)}
                </text>
              </g>
            );
          })}

          {/* 第二行: 乘以 q 后的各项 (整体向右平移 1 个单位) */}
          {terms.map((t) => {
            const shiftedN = t.n + 1;
            const shiftedCn = t.cn * q;
            const pt = mathToDesign(shiftedN, shiftedCn, scale);
            const ptZero = mathToDesign(shiftedN, 0, scale);
            const origPt = mathToDesign(t.n, t.cn, scale);

            return (
              <g key={`ag-s2-qtn-${t.n}`}>
                {/* 错位平移连接弧线 */}
                <path
                  d={`M ${origPt.x} ${origPt.y} Q ${(origPt.x + pt.x) / 2} ${origPt.y - 14} ${pt.x} ${pt.y}`}
                  fill="none"
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1.2}
                  strokeDasharray="3,2"
                />
                <rect
                  x={pt.x - barW / 2}
                  y={Math.min(pt.y, ptZero.y)}
                  width={barW}
                  height={Math.max(2, Math.abs(pt.y - ptZero.y))}
                  fill={withAlpha(MATH_COLORS.paramSecondary, 0.35)}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1.5}
                  rx={3}
                />
                <text
                  x={pt.x}
                  y={Math.min(pt.y, ptZero.y) - 6}
                  textAnchor="middle"
                  fontSize={fontScale(8.5)}
                  fill={MATH_COLORS.paramSecondary}
                  fontWeight="bold"
                >
                  a{toSub(t.n)}b{toSub(t.n + 1)}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Step 3 & Step 4: 相减结果化简 (首项直落、中间等比段、尾项红框警示) */}
      {(sumStep === 3 || sumStep === 4) && (
        <g className="step-3-subtract-view">
          {/* 首项: a1*b1 直落 (无相减对象) */}
          {terms[0] && (
            <g className="lead-term">
              <rect
                x={mathToDesign(1, terms[0].cn, scale).x - barW / 2 - 4}
                y={
                  Math.min(
                    mathToDesign(1, terms[0].cn, scale).y,
                    mathToDesign(1, 0, scale).y,
                  ) - 4
                }
                width={barW + 8}
                height={
                  Math.abs(
                    mathToDesign(1, terms[0].cn, scale).y -
                      mathToDesign(1, 0, scale).y,
                  ) + 8
                }
                fill={withAlpha(MATH_COLORS.paramPrimary, 0.15)}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1.5}
                rx={4}
              />
              <text
                x={mathToDesign(1, 0, scale).x}
                y={mathToDesign(1, terms[0].cn, scale).y - 10}
                textAnchor="middle"
                fontSize={fontScale(9.5)}
                fill={MATH_COLORS.paramPrimary}
                fontWeight="bold"
              >
                首项 a₁b₁
              </text>
            </g>
          )}

          {/* 中间 (n-1) 项: 等比数列求和区间框选 */}
          {N >= 3 && (
            <g className="middle-geo-box">
              {(() => {
                const xStart = mathToDesign(2, 0, scale).x - barW / 2 - 6;
                const xEnd = mathToDesign(N, 0, scale).x + barW / 2 + 6;
                const topY =
                  Math.min(
                    ...terms
                      .slice(1)
                      .map((t) => mathToDesign(t.n, t.cn, scale).y),
                  ) - 16;
                const bottomY = mathToDesign(0, 0, scale).y + 6;

                return (
                  <>
                    <rect
                      x={xStart}
                      y={topY}
                      width={xEnd - xStart}
                      height={Math.max(30, bottomY - topY)}
                      fill={withAlpha(MATH_COLORS.paramSecondary, 0.08)}
                      stroke={MATH_COLORS.paramSecondary}
                      strokeWidth={1.5}
                      strokeDasharray="4,3"
                      rx={8}
                    />
                    <text
                      x={(xStart + xEnd) / 2}
                      y={topY - 6}
                      textAnchor="middle"
                      fontSize={fontScale(10)}
                      fill={MATH_COLORS.paramSecondary}
                      fontWeight="bold"
                    >
                      中间 ({N - 1}) 项：纯等比数列求和 d · (q + q² + ... + q
                      {toSup(N - 1)})
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* 尾项: - a_n * b_{n+1} 孤立红框警示 */}
          {terms[N - 1] && (
            <g className="tail-warning-term">
              {(() => {
                const tailX = mathToDesign(N + 1, 0, scale).x;
                const tailH = Math.max(
                  30,
                  Math.abs(
                    mathToDesign(N + 1, terms[N - 1].cn * q, scale).y -
                      mathToDesign(N + 1, 0, scale).y,
                  ),
                );
                const topY = mathToDesign(N + 1, 0, scale).y - tailH;

                return (
                  <>
                    <rect
                      x={tailX - barW / 2 - 4}
                      y={topY}
                      width={barW + 8}
                      height={tailH}
                      fill={withAlpha(MATH_COLORS.paramPrimary, 0.22)}
                      stroke={MATH_COLORS.paramPrimary}
                      strokeWidth={2}
                      rx={6}
                    />
                    <text
                      x={tailX}
                      y={topY - 8}
                      textAnchor="middle"
                      fontSize={fontScale(9.5)}
                      fill={MATH_COLORS.paramPrimary}
                      fontWeight="bold"
                    >
                      ⚠️ - aₙ·q{toSup(N)}
                    </text>
                    <text
                      x={tailX}
                      y={mathToDesign(0, 0, scale).y + 18}
                      textAnchor="middle"
                      fontSize={fontScale(8.5)}
                      fill={MATH_COLORS.paramPrimary}
                    >
                      (必带负号)
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* 绘制各柱顶部圆点 */}
          {terms.map((t) => {
            const pt = mathToDesign(t.n, t.cn, scale);
            return (
              <circle
                key={`ag-dot-${t.n}`}
                cx={pt.x}
                cy={pt.y}
                r={4}
                fill={MATH_COLORS.sequenceHighlight}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
            );
          })}
        </g>
      )}
    </g>
  );
}
