import { useMemo } from "react";
import { MATH_COLORS, withAlpha } from "../../../theme";
import {
  getPascalTriangle,
  getAllBinomialTerms,
  getPascalProperties,
  evaluateAssignments,
} from "../../../math/probabilityCounting";
import type { SceneCommonProps } from "./types";
import { formatComb, formatTermText, toSub, toSup } from "./types";

export function BinomialScene({
  params,
  subMode = 0,
  onParamChange,
  fontScale = (v) => v,
}: SceneCommonProps) {
  const n = Math.floor(params.n ?? 5);
  const k = Math.min(Math.floor(params.k ?? 2), n);
  const a = params.a ?? 1;
  const b = params.b ?? 1;
  const assignmentType = Math.floor(params.assignmentType ?? 0);

  const W = 840;

  const pascalTriangle = useMemo(() => {
    return getPascalTriangle(Math.min(n, 7));
  }, [n]);

  const pascalProps = useMemo(() => {
    return getPascalProperties(n, k);
  }, [n, k]);

  const binomialTerms = useMemo(() => {
    return getAllBinomialTerms(n, a, b);
  }, [n, a, b]);

  const assignments = useMemo(() => {
    return evaluateAssignments(n, a, b);
  }, [n, a, b]);

  const assignKeys = [
    "sum_all",
    "sum_alt",
    "sum_even",
    "sum_odd",
    "derivative",
    "constant",
  ];
  const curAssignKey = assignKeys[assignmentType] || "sum_all";
  const curAssign = assignments[curAssignKey] || assignments.sum_all;

  return (
    <g>
      {/* 1. 子模式 0：杨辉三角与高级恒等式分析 */}
      {subMode === 0 && (
        <g transform="translate(0, 15)">
          {/* 背景分隔线 */}
          <line
            x1={40}
            y1={420}
            x2={W - 40}
            y2={420}
            stroke={MATH_COLORS.grid}
            strokeDasharray="4 4"
            strokeWidth={1}
          />

          {/* 杨辉三角节点与连线 */}
          {pascalTriangle.map((row, r) => {
            const count = row.length;
            const startY = 40;
            const rowGap = 48;
            const nodeRadius = 18;
            const y = startY + r * rowGap;

            return (
              <g key={`row-${r}`}>
                {/* 行标 */}
                <text
                  x={55}
                  y={y + 5}
                  fill={
                    r === n ? MATH_COLORS.paramPrimary : MATH_COLORS.textMuted
                  }
                  fontSize={fontScale(12)}
                  fontWeight={r === n ? "bold" : "normal"}
                >
                  n = {r}
                </text>

                {row.map((val, c) => {
                  const totalWidth = (count - 1) * 58;
                  const x = W / 2 - totalWidth / 2 + c * 58;

                  const isCurrentRow = r === n;
                  const isSelectedNode = isCurrentRow && c === k;
                  const isMaxNode =
                    isCurrentRow && pascalProps.maxIndices.includes(c);
                  const isHockeyPoint = pascalProps.hockeyStick.points.some(
                    (p) => p.r === r && p.c === c,
                  );
                  const isHockeyTarget =
                    pascalProps.hockeyStick.target.r === r &&
                    pascalProps.hockeyStick.target.c === c;

                  return (
                    <g
                      key={`node-${r}-${c}`}
                      onClick={() => {
                        onParamChange("n", r);
                        onParamChange("k", c);
                      }}
                      className="cursor-pointer transition-all duration-300"
                    >
                      {/* 递推连线 */}
                      {r > 0 && (
                        <g>
                          {c > 0 && (
                            <line
                              x1={x}
                              y1={y}
                              x2={W / 2 - ((r - 1) * 58) / 2 + (c - 1) * 58}
                              y2={y - rowGap}
                              stroke={
                                isSelectedNode
                                  ? MATH_COLORS.paramPrimary
                                  : MATH_COLORS.pascalLinkLine
                              }
                              strokeWidth={isSelectedNode ? 2.5 : 1}
                              strokeOpacity={isSelectedNode ? 1 : 0.35}
                            />
                          )}
                          {c < r && (
                            <line
                              x1={x}
                              y1={y}
                              x2={W / 2 - ((r - 1) * 58) / 2 + c * 58}
                              y2={y - rowGap}
                              stroke={
                                isSelectedNode
                                  ? MATH_COLORS.paramPrimary
                                  : MATH_COLORS.pascalLinkLine
                              }
                              strokeWidth={isSelectedNode ? 2.5 : 1}
                              strokeOpacity={isSelectedNode ? 1 : 0.35}
                            />
                          )}
                        </g>
                      )}

                      {/* 选中发光环 */}
                      {isSelectedNode && (
                        <circle
                          cx={x}
                          cy={y}
                          r={nodeRadius + 6}
                          fill={MATH_COLORS.pascalSelectedGlow}
                          stroke={MATH_COLORS.paramPrimary}
                          strokeWidth={2}
                          className="animate-pulse"
                        />
                      )}

                      {/* 最大值特殊冠冕光晕 */}
                      {isMaxNode && !isSelectedNode && (
                        <circle
                          cx={x}
                          cy={y}
                          r={nodeRadius + 3}
                          fill="none"
                          stroke={MATH_COLORS.paramSecondary}
                          strokeWidth={1.5}
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* 节点底色圆 */}
                      <circle
                        cx={x}
                        cy={y}
                        r={nodeRadius}
                        fill={
                          isSelectedNode
                            ? MATH_COLORS.paramPrimary
                            : isHockeyPoint
                              ? withAlpha(MATH_COLORS.paramTertiary, 0.25)
                              : isHockeyTarget
                                ? withAlpha(
                                    MATH_COLORS.functionTransformed,
                                    0.25,
                                  )
                                : isCurrentRow
                                  ? withAlpha(MATH_COLORS.paramSecondary, 0.15)
                                  : MATH_COLORS.pascalNodeBg
                        }
                        stroke={
                          isSelectedNode
                            ? MATH_COLORS.paramPrimary
                            : isHockeyPoint
                              ? MATH_COLORS.paramTertiary
                              : isHockeyTarget
                                ? MATH_COLORS.functionTransformed
                                : isCurrentRow
                                  ? MATH_COLORS.paramSecondary
                                  : MATH_COLORS.pascalNodeBorder
                        }
                        strokeWidth={isSelectedNode || isCurrentRow ? 2 : 1}
                      />

                      {/* 数值 */}
                      <text
                        x={x}
                        y={y + 4}
                        textAnchor="middle"
                        fill={
                          isSelectedNode
                            ? MATH_COLORS.white
                            : MATH_COLORS.labelText
                        }
                        fontSize={fontScale(val > 99 ? 10 : 12)}
                        fontWeight={
                          isSelectedNode || isMaxNode ? "bold" : "normal"
                        }
                      >
                        {val}
                      </text>

                      {/* 最大值小标志 */}
                      {isMaxNode && (
                        <text
                          x={x}
                          y={y - nodeRadius - 2}
                          textAnchor="middle"
                          fill={MATH_COLORS.paramSecondary}
                          fontSize={fontScale(8)}
                          fontWeight="bold"
                        >
                          MAX
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* 底部展开通项动态横向卡片 */}
          <g transform="translate(45, 438)">
            <rect
              x={0}
              y={0}
              width={750}
              height={140}
              fill={MATH_COLORS.poolBg}
              stroke={MATH_COLORS.poolBorder}
              strokeWidth={1}
              rx={12}
            />
            <text
              x={25}
              y={26}
              fill={MATH_COLORS.labelText}
              fontSize={fontScale(13)}
              fontWeight="bold"
            >
              当前展开式全部通项序列 (点击切换聚焦项)：
            </text>

            <g transform="translate(20, 42)">
              {binomialTerms.map((t, idx) => {
                const isCur = idx === k;
                const itemWidth = Math.min(710 / binomialTerms.length, 95);
                const ix = idx * itemWidth;

                return (
                  <g
                    key={`term-card-${idx}`}
                    onClick={() => onParamChange("k", idx)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={ix + 2}
                      y={0}
                      width={itemWidth - 4}
                      height={76}
                      fill={
                        isCur
                          ? withAlpha(MATH_COLORS.paramPrimary, 0.12)
                          : MATH_COLORS.white
                      }
                      stroke={
                        isCur
                          ? MATH_COLORS.paramPrimary
                          : MATH_COLORS.poolBorder
                      }
                      strokeWidth={isCur ? 2 : 1}
                      rx={8}
                    />
                    <text
                      x={ix + itemWidth / 2}
                      y={24}
                      textAnchor="middle"
                      fill={
                        isCur
                          ? MATH_COLORS.paramPrimary
                          : MATH_COLORS.labelTextLight
                      }
                      fontSize={fontScale(12)}
                      fontWeight={isCur ? "bold" : "normal"}
                    >
                      T{toSub(idx + 1)}
                    </text>
                    <text
                      x={ix + itemWidth / 2}
                      y={48}
                      textAnchor="middle"
                      fill={
                        t.termCoeff < 0
                          ? MATH_COLORS.tangentLine
                          : isCur
                            ? MATH_COLORS.paramPrimary
                            : MATH_COLORS.labelText
                      }
                      fontSize={fontScale(11)}
                      fontWeight="bold"
                    >
                      {formatTermText(t.termCoeff, t.powerA)}
                    </text>
                    <text
                      x={ix + itemWidth / 2}
                      y={65}
                      textAnchor="middle"
                      fill={MATH_COLORS.textMuted}
                      fontSize={fontScale(9)}
                    >
                      {formatComb(n, idx)} = {t.binomialCoeff}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        </g>
      )}

      {/* 2. 子模式 1：赋值法动态沙盘 (Assignment Sandbox) */}
      {subMode === 1 && (
        <g transform="translate(40, 45)">
          <rect
            x={0}
            y={0}
            width={760}
            height={560}
            fill={MATH_COLORS.poolBg}
            stroke={MATH_COLORS.poolBorder}
            strokeWidth={1}
            rx={14}
          />

          {/* 顶部标题与方案 */}
          <text
            x={28}
            y={38}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(15)}
            fontWeight="bold"
          >
            赋值法沙盘探索：{curAssign.name}
          </text>
          <text
            x={28}
            y={64}
            fill={MATH_COLORS.textMuted}
            fontSize={fontScale(12)}
          >
            {curAssign.description}
          </text>

          {/* 快捷切换按钮条 */}
          <g transform="translate(28, 82)">
            {assignKeys.map((key, idx) => {
              const item = assignments[key];
              const isSelected = idx === assignmentType;
              const btnW = 110;
              const bx = idx * (btnW + 9);

              return (
                <g
                  key={`assign-tab-${key}`}
                  onClick={() => onParamChange("assignmentType", idx)}
                  className="cursor-pointer"
                >
                  <rect
                    x={bx}
                    y={0}
                    width={btnW}
                    height={34}
                    fill={
                      isSelected ? MATH_COLORS.paramPrimary : MATH_COLORS.white
                    }
                    stroke={
                      isSelected
                        ? MATH_COLORS.paramPrimary
                        : MATH_COLORS.combCardBorder
                    }
                    strokeWidth={1.5}
                    rx={6}
                  />
                  <text
                    x={bx + btnW / 2}
                    y={21}
                    textAnchor="middle"
                    fill={
                      isSelected ? MATH_COLORS.white : MATH_COLORS.labelText
                    }
                    fontSize={fontScale(11)}
                    fontWeight={isSelected ? "bold" : "normal"}
                  >
                    {item.name.split(" ")[0]}
                  </text>
                </g>
              );
            })}
          </g>

          {/* 各分项赋值结果柱状与正负抵消图 */}
          <g transform="translate(38, 155)">
            <text
              x={0}
              y={0}
              fill={MATH_COLORS.labelTextLight}
              fontSize={fontScale(12)}
              fontWeight="bold"
            >
              各分项赋值贡献柱状图 (零基准线)：
            </text>

            {/* 零基准线 */}
            <line
              x1={0}
              y1={180}
              x2={685}
              y2={180}
              stroke={MATH_COLORS.axis}
              strokeWidth={1.5}
            />

            {curAssign.itemValues.map((item, idx) => {
              const numItems = curAssign.itemValues.length;
              const barW = Math.min(650 / numItems, 80);
              const bx = idx * barW + 18;

              const maxAbs = Math.max(
                ...curAssign.itemValues.map((iv) => Math.abs(iv.val)),
                1,
              );
              const barH = (Math.abs(item.val) / maxAbs) * 140;
              const isPositive = item.val >= 0;

              return (
                <g key={`assign-bar-${idx}`}>
                  <rect
                    x={bx + 6}
                    y={isPositive ? 180 - barH : 180}
                    width={barW - 12}
                    height={Math.max(barH, 3)}
                    fill={
                      item.val === 0
                        ? MATH_COLORS.textMuted
                        : isPositive
                          ? MATH_COLORS.functionTransformed
                          : MATH_COLORS.tangentLine
                    }
                    opacity={0.85}
                    rx={4}
                  />
                  {/* 项标 */}
                  <text
                    x={bx + barW / 2}
                    y={isPositive ? 180 - barH - 8 : 180 + barH + 16}
                    textAnchor="middle"
                    fill={
                      item.val < 0
                        ? MATH_COLORS.tangentLine
                        : MATH_COLORS.labelText
                    }
                    fontSize={fontScale(10)}
                    fontWeight="bold"
                  >
                    {item.val}
                  </text>

                  <text
                    x={bx + barW / 2}
                    y={202}
                    textAnchor="middle"
                    fill={MATH_COLORS.textMuted}
                    fontSize={fontScale(10)}
                  >
                    T{toSub(item.k + 1)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* 底部结果汇总卡片 */}
          <g transform="translate(38, 435)">
            <rect
              x={0}
              y={0}
              width={685}
              height={95}
              fill={MATH_COLORS.white}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={1.5}
              rx={10}
            />
            <text
              x={22}
              y={34}
              fill={MATH_COLORS.paramPrimary}
              fontSize={fontScale(13)}
              fontWeight="bold"
            >
              赋值最终求和结果：
            </text>
            <text
              x={22}
              y={68}
              fill={MATH_COLORS.labelText}
              fontSize={fontScale(16)}
              fontWeight="bold"
            >
              {curAssignKey === "sum_all"
                ? `f(1) = (a + b)ⁿ = (${a} + ${b})${toSup(n)} = ${assignments.sum_all.evaluatedValue}`
                : curAssignKey === "sum_alt"
                  ? `f(-1) = (-a + b)ⁿ = (${-a} + ${b})${toSup(n)} = ${assignments.sum_alt.evaluatedValue}`
                  : curAssignKey === "sum_even"
                    ? `偶数项和 = [f(1) + f(-1)] ÷ 2 = ${assignments.sum_even.evaluatedValue}`
                    : curAssignKey === "sum_odd"
                      ? `奇数项和 = [f(1) - f(-1)] ÷ 2 = ${assignments.sum_odd.evaluatedValue}`
                      : curAssignKey === "derivative"
                        ? `带权求和 f'(1) = n·a·(a+b)ⁿ⁻¹ = ${assignments.derivative.evaluatedValue}`
                        : `常数项 a₀ = f(0) = bⁿ = (${b})${toSup(n)} = ${assignments.constant.evaluatedValue}`}
            </text>
          </g>
        </g>
      )}

      {/* 3. 子模式 2：双轨对比柱状图 (二项式系数 vs 项的系数) */}
      {subMode === 2 && (
        <g transform="translate(40, 45)">
          <rect
            x={0}
            y={0}
            width={760}
            height={560}
            fill={MATH_COLORS.poolBg}
            stroke={MATH_COLORS.poolBorder}
            strokeWidth={1}
            rx={14}
          />

          <text
            x={28}
            y={38}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(15)}
            fontWeight="bold"
          >
            二项式系数 {formatComb("n", "k")} 与 实际展开项系数 Aₖ 双轨对比
          </text>
          <text
            x={28}
            y={64}
            fill={MATH_COLORS.textMuted}
            fontSize={fontScale(12)}
          >
            蓝色代表二项式系数（恒正对称）；橙红色代表实际项系数（受 a, b
            符号与大小调制）
          </text>

          {/* 柱状图主体 */}
          <g transform="translate(40, 110)">
            {/* 零基准线 */}
            <line
              x1={0}
              y1={270}
              x2={680}
              y2={270}
              stroke={MATH_COLORS.axis}
              strokeWidth={1.5}
            />

            {binomialTerms.map((term, index) => {
              const numTerms = binomialTerms.length;
              const barGroupWidth = Math.min(660 / numTerms, 88);
              const x = index * barGroupWidth + 10;
              const isSelected = index === k;

              const maxCoeff = Math.max(
                ...binomialTerms.map((t) => Math.abs(t.termCoeff)),
                ...binomialTerms.map((t) => t.binomialCoeff),
                1,
              );

              const binomHeight = (term.binomialCoeff / maxCoeff) * 210;
              const termAbsHeight = (Math.abs(term.termCoeff) / maxCoeff) * 210;
              const isNegative = term.termCoeff < 0;

              return (
                <g
                  key={`dual-bar-${index}`}
                  onClick={() => onParamChange("k", index)}
                  className="cursor-pointer"
                >
                  {isSelected && (
                    <rect
                      x={x - 4}
                      y={10}
                      width={barGroupWidth - 8}
                      height={400}
                      fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
                      stroke={MATH_COLORS.paramPrimary}
                      strokeDasharray="3 3"
                      rx={6}
                    />
                  )}

                  {/* 蓝柱：二项式系数 (恒正) */}
                  <rect
                    x={x}
                    y={270 - binomHeight}
                    width={barGroupWidth / 2 - 4}
                    height={Math.max(binomHeight, 3)}
                    fill={
                      isSelected
                        ? MATH_COLORS.paramPrimary
                        : withAlpha(MATH_COLORS.paramPrimary, 0.6)
                    }
                    rx={3}
                  />

                  {/* 橙/红柱：项的系数 */}
                  <rect
                    x={x + barGroupWidth / 2 - 2}
                    y={isNegative ? 270 : 270 - termAbsHeight}
                    width={barGroupWidth / 2 - 4}
                    height={Math.max(termAbsHeight, 3)}
                    fill={
                      isNegative
                        ? MATH_COLORS.tangentLine
                        : isSelected
                          ? MATH_COLORS.functionTransformed
                          : withAlpha(MATH_COLORS.functionTransformed, 0.65)
                    }
                    rx={3}
                  />

                  {/* 顶部标注 */}
                  <text
                    x={x + barGroupWidth / 4}
                    y={270 - binomHeight - 6}
                    textAnchor="middle"
                    fill={MATH_COLORS.paramPrimary}
                    fontSize={fontScale(9)}
                    fontWeight="bold"
                  >
                    {term.binomialCoeff}
                  </text>

                  <text
                    x={x + (barGroupWidth * 3) / 4 - 2}
                    y={
                      isNegative
                        ? 270 + termAbsHeight + 14
                        : 270 - termAbsHeight - 6
                    }
                    textAnchor="middle"
                    fill={
                      isNegative
                        ? MATH_COLORS.tangentLine
                        : MATH_COLORS.functionTransformed
                    }
                    fontSize={fontScale(9)}
                    fontWeight="bold"
                  >
                    {term.termCoeff}
                  </text>

                  {/* X 轴标签 */}
                  <text
                    x={x + barGroupWidth / 2 - 3}
                    y={295}
                    textAnchor="middle"
                    fill={
                      isSelected
                        ? MATH_COLORS.paramPrimary
                        : MATH_COLORS.labelTextLight
                    }
                    fontSize={fontScale(11)}
                    fontWeight={isSelected ? "bold" : "normal"}
                  >
                    T{index + 1}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      )}
    </g>
  );
}
