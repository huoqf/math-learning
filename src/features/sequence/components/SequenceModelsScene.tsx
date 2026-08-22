/**
 * src/features/sequence/components/SequenceModelsScene.tsx
 * 数列实验室 - 高考求和模型 2D SVG 场景 (5 大求和模型与 step 演化推导)
 */
import { CoordinateGrid, FunctionGraph } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale, ViewportInfo } from "@/hooks";
import { toSub, toSup } from "./SequenceText";
import { useSequenceParams } from "./useSequenceData";

interface SequenceModelsSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  modelType?:
    | "arith-geo"
    | "telescoping"
    | "cross-telescoping"
    | "grouped"
    | "odd-even"
    | "abs-sum";
  highlightN?: number;
  onSelectN?: (n: number) => void;
}

export function SequenceModelsScene({
  params,
  scale,
  vp,
  fontScale,
  modelType = "arith-geo",
}: SequenceModelsSceneProps) {
  const {
    a1,
    d,
    q,
    N,
    sumStep,
    teleGap,
    arithGeoData,
    telescopingData,
    crossTelescopingData,
    groupedData,
    oddEvenData,
    absSumData,
    radicalTeleData,
  } = useSequenceParams(params);

  const barW = Math.min(30, Math.max(16, scale.scaleX * 0.42));

  // 模型 1：错位相减法 (支持 4 步推导演化视图与矩阵错位对齐)
  if (modelType === "arith-geo") {
    const { terms } = arithGeoData;
    const isCriticalQ1 = Math.abs(q - 1) < 1e-4;

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

  // 模型 2：裂项相消法 (支持 3 种模式：标准差1型、跨项差2型、根式有理化型)
  if (modelType === "telescoping") {
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
  }

  // 模型 3：绝对值变号求和 (零点分段与对称翻折)
  if (modelType === "abs-sum") {
    const { terms, zeroPoint } = absSumData;
    const lineFn = (x: number) => a1 + (x - 1) * d;

    return (
      <g className="sequence-scene-abs-sum">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 1. 一次连续辅助直线 */}
        <FunctionGraph
          fn={lineFn}
          scale={scale}
          color={withAlpha(MATH_COLORS.sequence, 0.4)}
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />

        {/* 2. 变号零点指示虚线与居中标注 */}
        {zeroPoint !== null && (
          <g className="zero-point-guide">
            <line
              x1={mathToDesign(zeroPoint, 0, scale).x}
              y1={mathToDesign(0, scale.yMin, scale).y}
              x2={mathToDesign(zeroPoint, 0, scale).x}
              y2={mathToDesign(0, scale.yMax, scale).y}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
            <circle
              cx={mathToDesign(zeroPoint, 0, scale).x}
              cy={mathToDesign(zeroPoint, 0, scale).y}
              r={5}
              fill={MATH_COLORS.paramPrimary}
            />
            {/* 零点浮动胶囊 */}
            <g className="zero-point-badge">
              <rect
                x={mathToDesign(zeroPoint, 0, scale).x - 60}
                y={mathToDesign(zeroPoint, 0, scale).y - 28}
                width={120}
                height={22}
                rx={11}
                fill={withAlpha(MATH_COLORS.white, 0.95)}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1.2}
              />
              <text
                x={mathToDesign(zeroPoint, 0, scale).x}
                y={mathToDesign(zeroPoint, 0, scale).y - 13}
                textAnchor="middle"
                fontSize={fontScale(9.5)}
                fill={MATH_COLORS.paramPrimary}
                fontWeight="bold"
              >
                变号零点 n₀ = {zeroPoint.toFixed(2)}
              </text>
            </g>
          </g>
        )}

        {/* 3. 各项柱体 (正项实心绿，负项向上翻折橙虚线) */}
        {terms.map((t) => {
          const ptOrig = mathToDesign(t.n, t.an, scale);
          const ptAbs = mathToDesign(t.n, t.absAn, scale);
          const ptZero = mathToDesign(t.n, 0, scale);

          return (
            <g key={`abs-term-${t.n}`}>
              {/* 负项在 x 轴下方的原虚线柱 */}
              {t.isNegative && (
                <g>
                  <rect
                    x={ptOrig.x - barW / 2}
                    y={ptZero.y}
                    width={barW}
                    height={Math.max(2, Math.abs(ptOrig.y - ptZero.y))}
                    fill={withAlpha(MATH_COLORS.paramSecondary, 0.12)}
                    stroke={MATH_COLORS.paramSecondary}
                    strokeWidth={1}
                    strokeDasharray="3,2"
                    rx={2}
                  />
                  {/* 向上翻折箭头 */}
                  <path
                    d={`M ${ptOrig.x} ${ptOrig.y} Q ${ptOrig.x + 14} ${(ptOrig.y + ptAbs.y) / 2} ${ptAbs.x} ${ptAbs.y}`}
                    fill="none"
                    stroke={MATH_COLORS.paramSecondary}
                    strokeWidth={1.2}
                    strokeDasharray="2,2"
                  />
                </g>
              )}

              {/* 翻折后的绝对值实心柱 */}
              <rect
                x={ptAbs.x - barW / 2}
                y={Math.min(ptAbs.y, ptZero.y)}
                width={barW}
                height={Math.max(2, Math.abs(ptAbs.y - ptZero.y))}
                fill={withAlpha(
                  t.isNegative
                    ? MATH_COLORS.paramSecondary
                    : MATH_COLORS.inequality,
                  0.35,
                )}
                stroke={
                  t.isNegative
                    ? MATH_COLORS.paramSecondary
                    : MATH_COLORS.inequality
                }
                strokeWidth={1.5}
                rx={3}
              />
              <circle
                cx={ptAbs.x}
                cy={ptAbs.y}
                r={4}
                fill={
                  t.isNegative
                    ? MATH_COLORS.paramSecondary
                    : MATH_COLORS.inequality
                }
                stroke={MATH_COLORS.white}
                strokeWidth={1.2}
              />
              <text
                x={ptAbs.x}
                y={Math.min(ptAbs.y, ptZero.y) - 7}
                textAnchor="middle"
                fontSize={fontScale(9.5)}
                fill={
                  t.isNegative
                    ? MATH_COLORS.paramSecondary
                    : MATH_COLORS.inequality
                }
                fontWeight="bold"
              >
                |a{toSub(t.n)}| = {t.absAn.toFixed(1)}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  // 模型 4：分组转化求和法 (等差 + 等比层叠)
  if (modelType === "grouped") {
    const terms = groupedData.terms;
    const bannerY = vp.designTop + 24;

    return (
      <g className="sequence-scene-grouped">
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 图例提示栏 */}
        <g className="grouped-legend">
          <rect
            x={vp.centerX - 160}
            y={bannerY}
            width={320}
            height={26}
            rx={13}
            fill={withAlpha(MATH_COLORS.white, 0.95)}
            stroke={withAlpha(MATH_COLORS.sequenceHighlight, 0.5)}
            strokeWidth={1.2}
          />
          <rect
            x={vp.centerX - 140}
            y={bannerY + 7}
            width={12}
            height={12}
            rx={2}
            fill={withAlpha(MATH_COLORS.sequence, 0.5)}
            stroke={MATH_COLORS.sequence}
          />
          <text
            x={vp.centerX - 122}
            y={bannerY + 17}
            fontSize={fontScale(9.5)}
            fill={MATH_COLORS.sequence}
            fontWeight="bold"
          >
            等差分量 aₙ
          </text>
          <rect
            x={vp.centerX + 15}
            y={bannerY + 7}
            width={12}
            height={12}
            rx={2}
            fill={withAlpha(MATH_COLORS.sequenceSecondary, 0.6)}
            stroke={MATH_COLORS.sequenceSecondary}
          />
          <text
            x={vp.centerX + 33}
            y={bannerY + 17}
            fontSize={fontScale(9.5)}
            fill={MATH_COLORS.sequenceSecondary}
            fontWeight="bold"
          >
            等比分量 bₙ
          </text>
        </g>

        {terms.map((t) => {
          const ptAn = mathToDesign(t.n, t.an, scale);
          const ptCn = mathToDesign(t.n, t.cn, scale);
          const ptZero = mathToDesign(t.n, 0, scale);

          const hAn = Math.abs(ptAn.y - ptZero.y);
          const hBn = Math.abs(ptCn.y - ptAn.y);

          return (
            <g key={`grp-${t.n}`}>
              {/* 蓝色底柱 (等差部分 a_n) */}
              <rect
                x={ptAn.x - barW / 2}
                y={Math.min(ptAn.y, ptZero.y)}
                width={barW}
                height={Math.max(2, hAn)}
                fill={withAlpha(MATH_COLORS.sequence, 0.35)}
                stroke={MATH_COLORS.sequence}
                strokeWidth={1.5}
                rx={2}
              />

              {/* 紫色上柱 (等比部分 b_n) */}
              <rect
                x={ptCn.x - barW / 2}
                y={Math.min(ptCn.y, ptAn.y)}
                width={barW}
                height={Math.max(2, hBn)}
                fill={withAlpha(MATH_COLORS.sequenceSecondary, 0.45)}
                stroke={MATH_COLORS.sequenceSecondary}
                strokeWidth={1.5}
                rx={2}
              />

              <text
                x={ptCn.x}
                y={Math.min(ptCn.y, ptAn.y, ptZero.y) - 6}
                textAnchor="middle"
                fontSize={fontScale(9.5)}
                fill={MATH_COLORS.sequenceSum}
                fontWeight="bold"
              >
                c{toSub(t.n)} = a{toSub(t.n)} + b{toSub(t.n)} ({t.cn.toFixed(1)}
                )
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  // 模型 5：奇偶并项求和法 (摆动配对与双轨分段)
  if (modelType === "odd-even") {
    const terms = oddEvenData.terms;

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
                fill={
                  isEven ? MATH_COLORS.combHeader : MATH_COLORS.paramPrimary
                }
              />
              <text
                x={ptCn.x}
                y={ptCn.y + (isEven ? -8 : 14)}
                textAnchor="middle"
                fontSize={fontScale(10)}
                fill={
                  isEven ? MATH_COLORS.combHeader : MATH_COLORS.paramPrimary
                }
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

  return null;
}
