/**
 * src/features/sequence/components/SequenceGeometricProductMaxScene.tsx
 * 等比模型 - 专题 D: 前 n 项积与极值 (以 1 为分界点，对数二次模型)
 */
import { CoordinateGrid } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks";
import { toSub } from "./SequenceText";
import { useSequenceParams } from "./useSequenceData";

interface SequenceGeometricProductMaxSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  fontScale: (size: number) => number;
  highlightN?: number;
  onSelectN?: (n: number) => void;
}

export function SequenceGeometricProductMaxScene({
  params,
  scale,
  fontScale,
  highlightN = 1,
  onSelectN,
}: SequenceGeometricProductMaxSceneProps) {
  const { N, geoData } = useSequenceParams(params);
  const { terms, maxPnInfo } = geoData;

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
                isAboveOne ? MATH_COLORS.inequality : MATH_COLORS.paramSecondary
              }
              strokeWidth={1}
            />

            {/* a_n 散点 */}
            <circle
              cx={posAn.x}
              cy={posAn.y}
              r={3.5}
              fill={
                isAboveOne ? MATH_COLORS.inequality : MATH_COLORS.paramSecondary
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
                isAboveOne ? MATH_COLORS.inequality : MATH_COLORS.paramSecondary
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
