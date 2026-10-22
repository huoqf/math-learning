/**
 * src/features/sequence/components/RecurrenceInductionScene.tsx
 * 数学归纳法（选学拓展）——多米诺骨牌链
 *
 * 中屏只讲一件事：归纳法就是「推倒第一块」+「块块相连」。
 *   - 第 n 块骨牌立着 = P(n) 成立，倒下 = P(n) 不成立；
 *   - 第一块旁边的箭头是奠基 P(1)；
 *   - 相邻两块之间的虚线箭头是递推 P(k) ⇒ P(k+1)，缺一个环节整条链就断。
 */
import React from "react";
import { CoordinateGrid } from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import {
  calcInductionVerification,
  type InductionClaimId,
} from "@/math/sequence";
import {
  resolveN,
  legendXOf,
  type RecurrenceSceneBaseProps,
} from "./RecurrenceShared";

export interface RecurrenceInductionSceneProps extends RecurrenceSceneBaseProps {
  inductionClaim?: InductionClaimId;
}

export const RecurrenceInductionScene: React.FC<
  RecurrenceInductionSceneProps
> = ({
  params,
  scale,
  vp,
  fontScale,
  highlightN,
  onSelectN,
  xStep = 1,
  yStep = 1,
  inductionClaim = "sum_odd",
}) => {
  const a1 = params.a1 ?? 1;
  const stepParam = params.stepParam ?? 2;
  const N = resolveN(params);

  const res = calcInductionVerification(inductionClaim, {
    a1,
    d: stepParam,
    N,
  });

  const legendX = legendXOf(vp);
  const baseY = mathToDesign(0, 0, scale).y;
  const halfW = 0.26;
  const height = 0.95;

  return (
    <g className="recurrence-scene-induction">
      <CoordinateGrid
        scale={scale}
        fontScale={fontScale}
        xStep={xStep}
        yStep={yStep}
      />

      {/* 基线：骨牌站的地面 */}
      <line
        x1={mathToDesign(0.2, 0, scale).x}
        y1={baseY}
        x2={mathToDesign(N + 0.6, 0, scale).x}
        y2={baseY}
        stroke={MATH_COLORS.sequenceStem}
        strokeWidth={1.5}
        opacity={0.6}
      />

      {res.rows.map((row) => {
        const holdColor = MATH_COLORS.paramPrimary;
        const failColor = MATH_COLORS.degeneracy;
        const color = row.holds ? holdColor : failColor;
        const left = mathToDesign(row.n - halfW, 0, scale);
        const right = mathToDesign(row.n + halfW, 0, scale);
        const top = mathToDesign(row.n, height, scale);
        const isHighlighted = row.n === highlightN;

        // 立着：普通矩形；倒下：贴地的薄矩形（视觉上直接读到「这一条不成立」）
        const body = row.holds ? (
          <rect
            x={left.x}
            y={top.y}
            width={Math.max(6, right.x - left.x)}
            height={Math.max(6, baseY - top.y)}
            fill={withAlpha(color, isHighlighted ? 0.38 : 0.2)}
            stroke={color}
            strokeWidth={isHighlighted ? 2.5 : 1.6}
            rx={3}
          />
        ) : (
          <rect
            x={left.x}
            y={baseY - Math.max(5, fontScale(10))}
            width={Math.max(6, right.x - left.x) * 1.6}
            height={Math.max(4, fontScale(8))}
            fill={withAlpha(failColor, 0.3)}
            stroke={failColor}
            strokeWidth={1.6}
            rx={2}
            transform={`rotate(-6 ${left.x} ${baseY})`}
          />
        );

        return (
          <g
            key={`induction-domino-${row.n}`}
            style={{ cursor: "pointer" }}
            onClick={() => onSelectN?.(row.n)}
          >
            {body}
            <text
              x={(left.x + right.x) / 2}
              y={baseY + fontScale(16)}
              textAnchor="middle"
              fill={MATH_COLORS.labelText}
              fontSize={fontScale(12)}
              fontWeight="bold"
            >
              {`n=${row.n}`}
            </text>
          </g>
        );
      })}

      {/* 奠基：把第一块推倒的那一下 */}
      <g>
        <line
          x1={mathToDesign(0.35, 0, scale).x}
          y1={mathToDesign(0, 0.45, scale).y}
          x2={mathToDesign(0.68, 0, scale).x}
          y2={mathToDesign(0, 0.45, scale).y}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={2.5}
          markerEnd="url(#induction-arrow-base)"
        />
        <text
          x={mathToDesign(0.5, 0, scale).x}
          y={mathToDesign(0, 0.72, scale).y}
          textAnchor="middle"
          fill={MATH_COLORS.paramSecondary}
          fontSize={fontScale(12)}
          fontWeight="bold"
        >
          ① 奠基 P(1)
        </text>
      </g>

      {/* 递推：相邻两块之间的连接，一条虚线箭头代表一步 k ⇒ k+1 */}
      {res.rows.slice(0, -1).map((row) => {
        const from = mathToDesign(row.n + halfW, height, scale);
        const to = mathToDesign(row.n + 1 - halfW, height, scale);
        return (
          <line
            key={`induction-link-${row.n}`}
            x1={from.x}
            y1={from.y + fontScale(6)}
            x2={to.x}
            y2={to.y + fontScale(6)}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1.6}
            strokeDasharray="4 3"
            markerEnd="url(#induction-arrow-step)"
          />
        );
      })}
      <text
        x={mathToDesign((1 + N) / 2, 0, scale).x}
        y={mathToDesign(0, height + 0.42, scale).y}
        textAnchor="middle"
        fill={MATH_COLORS.paramTertiary}
        fontSize={fontScale(12)}
        fontWeight="bold"
      >
        {`② 递推 P(k) ⇒ P(k+1)，共 ${N - 1} 步`}
      </text>

      <defs>
        <marker
          id="induction-arrow-base"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill={MATH_COLORS.paramSecondary} />
        </marker>
        <marker
          id="induction-arrow-step"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill={MATH_COLORS.paramTertiary} />
        </marker>
      </defs>

      {/* 图例：一句话点明两种颜色的含义 */}
      <g transform={`translate(${legendX}, 20)`}>
        <rect
          x={-10}
          y={-4}
          width={220}
          height={54}
          fill={CANVAS_COLORS.white}
          stroke={MATH_COLORS.labelText}
          strokeOpacity={0.18}
          rx={8}
        />
        <rect
          x={4}
          y={8}
          width={12}
          height={14}
          fill={withAlpha(MATH_COLORS.paramPrimary, 0.2)}
          stroke={MATH_COLORS.paramPrimary}
        />
        <text
          x={24}
          y={19}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(11)}
        >
          P(n) 成立
        </text>
        <rect
          x={4}
          y={30}
          width={12}
          height={8}
          fill={withAlpha(MATH_COLORS.degeneracy, 0.3)}
          stroke={MATH_COLORS.degeneracy}
        />
        <text
          x={24}
          y={38}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(11)}
        >
          P(n) 不成立（链条断点）
        </text>
      </g>
    </g>
  );
};
