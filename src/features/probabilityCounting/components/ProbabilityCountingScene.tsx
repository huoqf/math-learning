import { useMemo } from "react";
import type { SceneScale } from "../../../hooks/useSceneScale";
import type { ViewportInfo } from "../../../utils/useViewport";
import { MATH_COLORS, withAlpha } from "../../../theme";
import {
  comb,
  perm,
  getPascalTriangle,
  getAllBinomialTerms,
  buildMultiplicationTree,
  buildAdditionTree,
} from "../../../math/probabilityCounting";

interface SceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  activeMode: string; // 'binomial' | 'perm_comb' | 'principles'
  subMode?: number;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
}

export function ProbabilityCountingScene({
  params,
  activeMode,
  subMode = 0,
  onParamChange,
  fontScale = (v) => v,
}: SceneProps) {
  const n = Math.floor(params.n ?? 5);
  const k = Math.min(Math.floor(params.k ?? 2), n);
  const a = params.a ?? 1;
  const b = params.b ?? 1;
  const m1 = Math.floor(params.m1 ?? 3);
  const m2 = Math.floor(params.m2 ?? 2);
  const m3 = Math.floor(params.m3 ?? 2);

  // 1. 杨辉三角矩阵计算
  const pascalTriangle = useMemo(() => {
    return getPascalTriangle(Math.min(n, 8)); // 视图内最高显示到 8 层
  }, [n]);

  // 2. 二项式所有展开项计算
  const binomialTerms = useMemo(() => {
    return getAllBinomialTerms(n, a, b);
  }, [n, a, b]);

  // 3. 决策树数据
  const multTree = useMemo(() => {
    return buildMultiplicationTree(m1, m2, m3);
  }, [m1, m2, m3]);

  const addTree = useMemo(() => {
    return buildAdditionTree(m1, m2);
  }, [m1, m2]);

  // 设计画布尺寸基准 (840 x 650)
  const W = 840;

  // 规范元素球语义色阵列（扩展更丰富的优雅梯度）
  const ballColors = [
    "#EF4444", // 珊瑚红
    "#F59E0B", // 琥珀金
    "#10B981", // 翡翠绿
    "#3B82F6", // 湛蓝
    "#8B5CF6", // 葡萄紫
    "#EC4899", // 玫瑰粉
    "#6366F1", // 靛蓝
    "#14B8A6", // 青绿
    "#F97316", // 暖橙
    "#84CC16", // 嫩绿
  ];

  // -------------------------------------------------------------
  // 模式一：杨辉三角与二项展开渲染
  // -------------------------------------------------------------
  const renderBinomialScene = () => {
    const startY = 45;
    const rowGap = 42;
    const nodeRadius = 18;

    return (
      <g transform="translate(0, 10)">
        {/* 区域标签已移至 HTML 覆盖层 */}

        {/* 背景分隔线 */}
        <line
          x1={40}
          y1={422}
          x2={W - 40}
          y2={422}
          stroke={MATH_COLORS.grid}
          strokeDasharray="4 4"
          strokeWidth={1}
        />

        {/* 杨辉三角节点与连线 */}
        {pascalTriangle.map((row, r) => {
          const count = row.length;
          const y = startY + r * rowGap;

          return (
            <g key={`row-${r}`}>
              {/* 行标 */}
              <text
                x={65}
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
                const totalWidth = (count - 1) * 54;
                const x = W / 2 - totalWidth / 2 + c * 54;

                const isCurrentRow = r === n;
                const isSelectedNode = isCurrentRow && c === k;

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
                            x2={W / 2 - ((r - 1) * 54) / 2 + (c - 1) * 54}
                            y2={y - rowGap}
                            stroke={
                              isSelectedNode
                                ? MATH_COLORS.paramPrimary
                                : MATH_COLORS.pascalLinkLine
                            }
                            strokeWidth={isSelectedNode ? 2.5 : 1}
                            strokeOpacity={isSelectedNode ? 1 : 0.4}
                          />
                        )}
                        {c < r && (
                          <line
                            x1={x}
                            y1={y}
                            x2={W / 2 - ((r - 1) * 54) / 2 + c * 54}
                            y2={y - rowGap}
                            stroke={
                              isSelectedNode
                                ? MATH_COLORS.paramPrimary
                                : MATH_COLORS.pascalLinkLine
                            }
                            strokeWidth={isSelectedNode ? 2.5 : 1}
                            strokeOpacity={isSelectedNode ? 1 : 0.4}
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

                    {/* 节点底色圆 */}
                    <circle
                      cx={x}
                      cy={y}
                      r={nodeRadius}
                      fill={
                        isSelectedNode
                          ? MATH_COLORS.paramPrimary
                          : isCurrentRow
                            ? withAlpha(MATH_COLORS.paramSecondary, 0.15)
                            : MATH_COLORS.pascalNodeBg
                      }
                      stroke={
                        isSelectedNode
                          ? MATH_COLORS.paramPrimary
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
                      fontWeight={isSelectedNode ? "bold" : "normal"}
                    >
                      {val}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* 下方柱状图：对比 C_n^k 与 实际项系数 A_k */}
        <g transform="translate(60, 455)">
          {binomialTerms.map((term, index) => {
            const numTerms = binomialTerms.length;
            const barGroupWidth = Math.min(680 / numTerms, 70);
            const x = index * barGroupWidth + 20;

            const isSelected = index === k;

            // 寻找最大绝对值系数以便归一化高度
            const maxCoeff = Math.max(
              ...binomialTerms.map((t) => Math.abs(t.termCoeff)),
              ...binomialTerms.map((t) => t.binomialCoeff),
              1,
            );

            // 柱体最大高度 105px
            const binomHeight = (term.binomialCoeff / maxCoeff) * 105;
            const termAbsHeight = (Math.abs(term.termCoeff) / maxCoeff) * 105;

            const isNegative = term.termCoeff < 0;

            return (
              <g
                key={`bar-${index}`}
                onClick={() => onParamChange("k", index)}
                className="cursor-pointer"
              >
                {/* 选中标识框 */}
                {isSelected && (
                  <rect
                    x={x - 4}
                    y={-10}
                    width={barGroupWidth - 8}
                    height={150}
                    fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
                    stroke={MATH_COLORS.paramPrimary}
                    strokeDasharray="3 3"
                    rx={6}
                  />
                )}

                {/* 柱体 1：二项式系数 C_n^k (湖蓝) */}
                <rect
                  x={x}
                  y={115 - binomHeight}
                  width={barGroupWidth / 2 - 4}
                  height={Math.max(binomHeight, 3)}
                  fill={
                    isSelected
                      ? MATH_COLORS.barFill
                      : withAlpha(MATH_COLORS.barFill, 0.45)
                  }
                  rx={3}
                />

                {/* 柱体 2：实际项系数 A_k (粉红/警示红) */}
                <rect
                  x={x + barGroupWidth / 2 - 2}
                  y={115 - termAbsHeight}
                  width={barGroupWidth / 2 - 4}
                  height={Math.max(termAbsHeight, 3)}
                  fill={
                    isNegative
                      ? MATH_COLORS.tangentLine
                      : isSelected
                        ? MATH_COLORS.functionTransformed
                        : withAlpha(MATH_COLORS.functionTransformed, 0.5)
                  }
                  rx={3}
                />

                {/* 项名称标签 (T1, T2...) */}
                <text
                  x={x + barGroupWidth / 2 - 3}
                  y={132}
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

                {/* 实际系数数值 */}
                <text
                  x={x + barGroupWidth / 2 - 3}
                  y={115 - Math.max(binomHeight, termAbsHeight) - 5}
                  textAnchor="middle"
                  fill={
                    isNegative ? MATH_COLORS.tangentLine : MATH_COLORS.labelText
                  }
                  fontSize={fontScale(9)}
                  fontWeight="bold"
                >
                  {term.termCoeff}
                </text>
              </g>
            );
          })}
        </g>
      </g>
    );
  };

  // -------------------------------------------------------------
  // 模式二：排列与组合数形对比
  // -------------------------------------------------------------
  const renderPermCombScene = () => {
    const P = perm(n, k);
    const C = comb(n, k);

    // 生成 n 个小球
    const balls = Array.from({ length: n }, (_, i) => ({
      id: i,
      label: String.fromCharCode(65 + i), // A, B, C, D...
    }));

    return (
      <g transform="translate(40, 20)">
        {/* 顶部：原始元素池 (n 个球) */}
        <g transform="translate(20, 15)">
          <rect
            x={0}
            y={0}
            width={720}
            height={95}
            fill={MATH_COLORS.poolBg}
            stroke={MATH_COLORS.poolBorder}
            strokeWidth={1}
            rx={12}
          />
          <text
            x={18}
            y={28}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(13)}
            fontWeight="bold"
          >
            原始元素池 (共 n = {n} 个不同元素):
          </text>

          {balls.map((ball, idx) => {
            const bx = 160 + idx * 54;
            const by = 54;
            return (
              <g key={`ball-${idx}`}>
                <circle
                  cx={bx}
                  cy={by}
                  r={18}
                  fill={ballColors[idx % ballColors.length]}
                  stroke={MATH_COLORS.white}
                  strokeWidth={2.5}
                />
                <text
                  x={bx}
                  y={by + 5}
                  textAnchor="middle"
                  fill={MATH_COLORS.white}
                  fontSize={fontScale(13)}
                  fontWeight="bold"
                >
                  {ball.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* 中部左侧：组合 C_n^k 选出结果 (无序集合) */}
        <g transform="translate(20, 130)">
          <rect
            x={0}
            y={0}
            width={345}
            height={285}
            fill={MATH_COLORS.combCardBg}
            stroke={MATH_COLORS.combCardBorder}
            strokeWidth={1.5}
            rx={14}
          />
          {/* 标题已移至 HTML 覆盖层 */}
          <text
            x={20}
            y={55}
            fill={MATH_COLORS.labelTextLight}
            fontSize={fontScale(11)}
          >
            从 {n} 个中选出 {k} 个合成一组，无关顺序：
          </text>

          {/* 选中的集合 */}
          <g transform="translate(20, 75)">
            <rect
              x={0}
              y={0}
              width={305}
              height={80}
              fill={MATH_COLORS.white}
              stroke={MATH_COLORS.combCardBorder}
              strokeDasharray="4 4"
              rx={8}
            />
            <text
              x={12}
              y={22}
              fill={MATH_COLORS.combHeader}
              fontSize={fontScale(11)}
            >
              示例选出子集 &#123;{" "}
              {balls
                .slice(0, k)
                .map((b) => b.label)
                .join(", ")}{" "}
              &#125;
            </text>
            {balls.slice(0, k).map((_, idx) => (
              <circle
                key={`c-sel-${idx}`}
                cx={32 + idx * 45}
                cy={48}
                r={15}
                fill={ballColors[idx]}
              />
            ))}
          </g>

          {/* 剩下的补集 (对称性说明) */}
          <g transform="translate(20, 175)">
            <rect
              x={0}
              y={0}
              width={305}
              height={80}
              fill={MATH_COLORS.white}
              stroke={MATH_COLORS.axis}
              rx={8}
            />
            <text
              x={12}
              y={22}
              fill={MATH_COLORS.textMuted}
              fontSize={fontScale(11)}
            >
              余下补集 (共 n-k = {n - k} 个) 自动成组：
            </text>
            {balls.slice(k).map((_, idx) => (
              <circle
                key={`c-rem-${idx}`}
                cx={32 + idx * 45}
                cy={48}
                r={15}
                fill={ballColors[k + idx]}
                opacity={0.65}
              />
            ))}
          </g>
        </g>

        {/* 中部右侧：排列 A_n^k 槽位选择 (有序队列) */}
        <g transform="translate(395, 130)">
          <rect
            x={0}
            y={0}
            width={345}
            height={285}
            fill={MATH_COLORS.permCardBg}
            stroke={MATH_COLORS.permCardBorder}
            strokeWidth={1.5}
            rx={14}
          />
          {/* 标题已移至 HTML 覆盖层 */}
          <text
            x={20}
            y={55}
            fill={MATH_COLORS.labelTextLight}
            fontSize={fontScale(11)}
          >
            分 {k} 个步骤依次填入槽位，关注位置顺序：
          </text>

          {/* 槽位选择图示 */}
          <g transform="translate(18, 75)">
            {Array.from({ length: Math.min(k, 5) }, (_, sIdx) => {
              const choicesLeft = n - sIdx;
              return (
                <g
                  key={`slot-${sIdx}`}
                  transform={`translate(${sIdx * 62}, 0)`}
                >
                  <rect
                    x={0}
                    y={0}
                    width={56}
                    height={88}
                    fill={MATH_COLORS.white}
                    stroke={MATH_COLORS.permHeader}
                    strokeWidth={1.5}
                    rx={8}
                  />
                  <text
                    x={28}
                    y={18}
                    textAnchor="middle"
                    fill={MATH_COLORS.labelTextLight}
                    fontSize={fontScale(10)}
                  >
                    槽位 {sIdx + 1}
                  </text>
                  <circle
                    cx={28}
                    cy={42}
                    r={13}
                    fill={ballColors[sIdx % ballColors.length]}
                  />
                  <text
                    x={28}
                    y={76}
                    textAnchor="middle"
                    fill={MATH_COLORS.permHeader}
                    fontSize={fontScale(10)}
                    fontWeight="bold"
                  >
                    {choicesLeft} 种可能
                  </text>
                </g>
              );
            })}
          </g>

          <g transform="translate(20, 202)">
            <text
              x={0}
              y={12}
              fill={MATH_COLORS.permHeader}
              fontSize={fontScale(12)}
              fontWeight="bold"
            >
              乘法分步连乘：
              {Array.from({ length: k }, (_, i) => n - i).join(" × ")} = {P}
            </text>
          </g>
          {/* 与组合关系标签已移至 HTML 覆盖层 */}
        </g>

        {/* 下方直觉卡片 */}
        <g transform="translate(20, 432)">
          <rect
            x={0}
            y={0}
            width={720}
            height={58}
            fill={MATH_COLORS.tipBg}
            stroke={MATH_COLORS.tipBorder}
            strokeWidth={1}
            rx={10}
          />
          <text
            x={20}
            y={34}
            fill={MATH_COLORS.tipText}
            fontSize={fontScale(13)}
            fontWeight="bold"
          >
            💡 核心区别直觉：排列 = 组合 × 内部全排列 (k!)。消去 {k}!
            种内部顺序即得组合数 {C}。
          </text>
        </g>
      </g>
    );
  };

  // -------------------------------------------------------------
  // 模式三：分类加法与分步乘法决策树
  // -------------------------------------------------------------
  const renderPrinciplesScene = () => {
    const isMultiplication = subMode === 0;
    const tree = isMultiplication ? multTree : addTree;

    return (
      <g transform="translate(40, 25)">
        {/* 决策树卡片 */}
        <g transform="translate(20, 20)">
          <rect
            x={0}
            y={0}
            width={720}
            height={470}
            fill={MATH_COLORS.poolBg}
            stroke={MATH_COLORS.poolBorder}
            strokeWidth={1}
            rx={14}
          />

          {/* 渲染边 (Lines) */}
          {tree.edges.map((edge) => {
            const fromNode = tree.nodes.find((n) => n.id === edge.from);
            const toNode = tree.nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            const fx = 65 + fromNode.depth * 200;
            const fy = 60 + fromNode.y * 36;
            const tx = 65 + toNode.depth * 200;
            const ty = 60 + toNode.y * 36;

            return (
              <g key={edge.id}>
                <line
                  x1={fx}
                  y1={fy}
                  x2={tx}
                  y2={ty}
                  stroke={
                    isMultiplication
                      ? MATH_COLORS.paramPrimary
                      : MATH_COLORS.paramSecondary
                  }
                  strokeWidth={2}
                  strokeOpacity={0.7}
                />
                {edge.label && (
                  <text
                    x={(fx + tx) / 2}
                    y={(fy + ty) / 2 - 4}
                    textAnchor="middle"
                    fill={MATH_COLORS.textMuted}
                    fontSize={fontScale(9)}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* 渲染节点 (Nodes) */}
          {tree.nodes.map((node) => {
            const nx = 65 + node.depth * 200;
            const ny = 60 + node.y * 36;
            const isRoot = node.depth === 0;

            return (
              <g key={node.id} transform={`translate(${nx}, ${ny})`}>
                <circle
                  cx={0}
                  cy={0}
                  r={isRoot ? 16 : 12}
                  fill={
                    isRoot
                      ? MATH_COLORS.paramPrimary
                      : node.depth === 1
                        ? MATH_COLORS.paramSecondary
                        : MATH_COLORS.paramTertiary
                  }
                  stroke={MATH_COLORS.white}
                  strokeWidth={2.5}
                />
                <text
                  x={18}
                  y={4}
                  fill={MATH_COLORS.labelText}
                  fontSize={fontScale(isRoot ? 12 : 10)}
                  fontWeight={isRoot ? "bold" : "normal"}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </g>
    );
  };

  return (
    <g>
      {/* 极简网格背景模式：不再穿透繁杂的笛卡尔坐标轴刻度文字，营造纯粹高端的数形卡片意境 */}
      <defs>
        <pattern
          id="subtle-dot-grid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1" fill={MATH_COLORS.axis} opacity="0.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#subtle-dot-grid)" />

      {/* 根据当前模式分发渲染 */}
      {activeMode === "binomial" && renderBinomialScene()}
      {activeMode === "perm_comb" && renderPermCombScene()}
      {activeMode === "principles" && renderPrinciplesScene()}
    </g>
  );
}
