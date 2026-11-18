import { useMemo } from "react";
import { MATH_COLORS, withAlpha } from "../../../theme";
import {
  buildMultiplicationTree,
  buildAdditionTree,
  getGridPathMatrix,
  type TreeNodeData,
} from "../../../math/probabilityCounting";
import type { SceneCommonProps } from "./types";
import { formatComb } from "./types";

interface TreeLayoutResult {
  positions: Record<string, { x: number; y: number }>;
  leafIds: Set<string>;
  leafCount: number;
  maxDepth: number;
}

/** 计算水平层次决策树的安全布局，保证叶子在画布可视高度 [45, 455] 内不溢出 */
function computeCountingTreeLayout(
  nodes: TreeNodeData[],
  yMin = 45,
  yMax = 455,
): TreeLayoutResult {
  const childrenMap = new Map<string, string[]>();
  let maxDepth = 0;

  for (const node of nodes) {
    maxDepth = Math.max(maxDepth, node.depth);
    if (node.parentId) {
      const list = childrenMap.get(node.parentId) ?? [];
      list.push(node.id);
      childrenMap.set(node.parentId, list);
    }
  }

  const leaves = nodes.filter(
    (node) => (childrenMap.get(node.id)?.length ?? 0) === 0,
  );
  const leafIds = new Set(leaves.map((l) => l.id));
  const leafCount = Math.max(1, leaves.length);
  const positions: Record<string, { x: number; y: number }> = {};

  const xStart = 55;
  const xSpan = maxDepth >= 3 ? 495 : maxDepth === 2 ? 430 : 320;
  const xStep = maxDepth === 0 ? 0 : xSpan / maxDepth;

  leaves.forEach((leaf, idx) => {
    const y =
      leafCount === 1
        ? (yMin + yMax) / 2
        : yMin + (idx * (yMax - yMin)) / (leafCount - 1);
    positions[leaf.id] = { x: xStart + leaf.depth * xStep, y };
  });

  // 自底向上汇总父节点垂直坐标为其子节点的中心
  for (let d = maxDepth - 1; d >= 0; d--) {
    for (const node of nodes) {
      if (node.depth !== d || positions[node.id]) continue;
      const children = childrenMap.get(node.id) ?? [];
      const childYs = children
        .map((cid) => positions[cid]?.y)
        .filter((v): v is number => v !== undefined);
      const avgY =
        childYs.length > 0
          ? childYs.reduce((acc, v) => acc + v, 0) / childYs.length
          : (yMin + yMax) / 2;
      positions[node.id] = { x: xStart + node.depth * xStep, y: avgY };
    }
  }

  return { positions, leafIds, leafCount, maxDepth };
}

export function PrinciplesScene({
  params,
  subMode = 0,
  fontScale = (v) => v,
}: SceneCommonProps) {
  const m1 = Math.floor(params.m1 ?? 3);
  const m2 = Math.floor(params.m2 ?? 2);
  const m3 = Math.floor(params.m3 ?? 2);
  const gridM = Math.floor(params.gridM ?? 4);
  const gridN = Math.floor(params.gridN ?? 3);

  const multTree = useMemo(() => {
    return buildMultiplicationTree(m1, m2, m3);
  }, [m1, m2, m3]);

  const addTree = useMemo(() => {
    return buildAdditionTree(m1, m2);
  }, [m1, m2]);

  const tree = subMode === 0 ? multTree : addTree;
  const treeLayout = useMemo(
    () => computeCountingTreeLayout(tree.nodes, 50, 445),
    [tree],
  );

  const gridMatrix = useMemo(() => {
    return getGridPathMatrix(gridM, gridN);
  }, [gridM, gridN]);

  // 1. 乘法决策树或加法通道模式
  if (subMode === 0 || subMode === 1) {
    const isMultiplication = subMode === 0;
    const isDenseTree = treeLayout.leafCount > 20;
    const leafStepStride = isDenseTree
      ? Math.max(2, Math.ceil(treeLayout.leafCount / 12))
      : 1;
    let leafLabelOrder = 0;
    const labeledLeafIds = new Set<string>();
    tree.nodes.forEach((n) => {
      if (!treeLayout.leafIds.has(n.id)) return;
      if (
        !isDenseTree ||
        leafLabelOrder === 0 ||
        leafLabelOrder === treeLayout.leafCount - 1 ||
        leafLabelOrder % leafStepStride === 0
      ) {
        labeledLeafIds.add(n.id);
      }
      leafLabelOrder += 1;
    });

    return (
      <g transform="translate(40, 45)">
        <g transform="translate(20, 10)">
          <rect
            x={0}
            y={0}
            width={720}
            height={540}
            fill={MATH_COLORS.poolBg}
            stroke={MATH_COLORS.poolBorder}
            strokeWidth={1}
            rx={14}
          />

          {/* 顶部标题说明 */}
          <text
            x={25}
            y={38}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(15)}
            fontWeight="bold"
          >
            {isMultiplication
              ? `分步乘法决策树模型：N = ${m1} × ${m2} ${m3 > 0 ? `× ${m3}` : ""} = ${m1 * m2 * (m3 > 0 ? m3 : 1)}`
              : `分类加法独立通道模型：N = ${m1} + ${m2} = ${m1 + m2}`}
          </text>
          <text
            x={25}
            y={62}
            fill={MATH_COLORS.textMuted}
            fontSize={fontScale(12)}
          >
            {isMultiplication
              ? "各个步骤依次发生，路径呈树状指数扩张（步步相依）"
              : "各个类别独立互斥，多种方案并行汇入总结果（类类互斥）"}
          </text>

          <g transform="translate(15, 70)">
            {/* 渲染边 (Lines) */}
            {tree.edges.map((edge) => {
              const fromPos = treeLayout.positions[edge.from];
              const toPos = treeLayout.positions[edge.to];
              if (!fromPos || !toPos) return null;

              const fx = fromPos.x;
              const fy = fromPos.y;
              const tx = toPos.x;
              const ty = toPos.y;

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
                    strokeWidth={isDenseTree ? 1.15 : 2}
                    strokeOpacity={isDenseTree ? 0.45 : 0.7}
                  />
                  {edge.label && tree.edges.length <= 24 && (
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
              const pos = treeLayout.positions[node.id];
              if (!pos) return null;
              const isRoot = node.depth === 0;
              const isLeaf = treeLayout.leafIds.has(node.id);
              const showLabel = !isLeaf || labeledLeafIds.has(node.id);
              const radius = isRoot
                ? 15
                : isLeaf && isDenseTree
                  ? 4.5
                  : treeLayout.leafCount > 12
                    ? 8
                    : 11;
              const labelSize = isRoot
                ? 12
                : isLeaf && isDenseTree
                  ? 8.5
                  : treeLayout.leafCount > 12
                    ? 9
                    : 10;

              return (
                <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                  <circle
                    cx={0}
                    cy={0}
                    r={radius}
                    fill={
                      isRoot
                        ? MATH_COLORS.paramPrimary
                        : node.depth === 1
                          ? MATH_COLORS.paramSecondary
                          : MATH_COLORS.paramTertiary
                    }
                    stroke={MATH_COLORS.white}
                    strokeWidth={isDenseTree && isLeaf ? 1 : 2}
                  />
                  {showLabel && (
                    <text
                      x={radius + 5}
                      y={3.5}
                      fill={MATH_COLORS.labelText}
                      fontSize={fontScale(labelSize)}
                      fontWeight={isRoot ? "bold" : "normal"}
                    >
                      {node.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {isDenseTree && (
            <g transform="translate(465, 22)">
              <rect
                x={0}
                y={0}
                width={235}
                height={26}
                rx={6}
                fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1}
              />
              <text
                x={117.5}
                y={17}
                textAnchor="middle"
                fill={MATH_COLORS.paramPrimary}
                fontSize={fontScale(10.5)}
                fontWeight="bold"
              >
                共 {treeLayout.leafCount} 条路径（末层标签已抽稀）
              </text>
            </g>
          )}
        </g>
      </g>
    );
  }

  // 2. 网格最短路径与标数法 (subMode === 2)
  const cellW = Math.min(95, Math.floor(520 / Math.max(1, gridM)));
  const cellH = Math.min(72, Math.floor(285 / Math.max(1, gridN)));
  const startX = Math.round((720 - gridM * cellW) / 2);
  const startY = Math.round(115 + gridN * cellH);
  const minCell = Math.min(cellW, cellH);
  const startEndR = Math.min(18, Math.max(12, Math.floor(minCell * 0.28)));
  const innerR = Math.min(14, Math.max(10, Math.floor(minCell * 0.23)));

  // 生成一条锯齿状示例最短路径（交替向右 R 与向上 U，直观展示组合双射）
  const sampleCoords: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }];
  const sampleSteps: string[] = [];
  let cx = 0;
  let cy = 0;
  while (cx < gridM || cy < gridN) {
    if (cx < gridM) {
      cx += 1;
      sampleCoords.push({ x: cx, y: cy });
      sampleSteps.push("R");
    }
    if (cy < gridN) {
      cy += 1;
      sampleCoords.push({ x: cx, y: cy });
      sampleSteps.push("U");
    }
  }
  const samplePolylinePoints = sampleCoords
    .map((pt) => `${startX + pt.x * cellW},${startY - pt.y * cellH}`)
    .join(" ");

  return (
    <g transform="translate(40, 45)">
      <rect
        x={20}
        y={10}
        width={720}
        height={540}
        fill={MATH_COLORS.poolBg}
        stroke={MATH_COLORS.poolBorder}
        strokeWidth={1}
        rx={14}
      />

      <text
        x={45}
        y={42}
        fill={MATH_COLORS.labelText}
        fontSize={fontScale(15)}
        fontWeight="bold"
      >
        网格最短路径与加法标数法：从 (0,0) 到 ({gridM},{gridN})
      </text>
      <text x={45} y={66} fill={MATH_COLORS.textMuted} fontSize={fontScale(12)}>
        各点走法 N(x,y) = N(x-1,y) + N(x,y-1)，实质就是逆时针旋转 45° 的杨辉三角
      </text>

      {/* 网格线 */}
      <g transform="translate(20, 10)">
        {/* 横线 */}
        {Array.from({ length: gridN + 1 }, (_, y) => (
          <line
            key={`grid-h-${y}`}
            x1={startX}
            y1={startY - y * cellH}
            x2={startX + gridM * cellW}
            y2={startY - y * cellH}
            stroke={MATH_COLORS.axis}
            strokeWidth={1.5}
          />
        ))}

        {/* 竖线 */}
        {Array.from({ length: gridM + 1 }, (_, x) => (
          <line
            key={`grid-v-${x}`}
            x1={startX + x * cellW}
            y1={startY}
            x2={startX + x * cellW}
            y2={startY - gridN * cellH}
            stroke={MATH_COLORS.axis}
            strokeWidth={1.5}
          />
        ))}

        {/* 示例最短路径高亮折线 */}
        <polyline
          points={samplePolylinePoints}
          fill="none"
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={3.5}
          strokeDasharray="6 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 交叉点与标数法 */}
        {gridMatrix.map((row) =>
          row.map((pt) => {
            const px = startX + pt.x * cellW;
            const py = startY - pt.y * cellH;
            const isStart = pt.x === 0 && pt.y === 0;
            const isEnd = pt.x === gridM && pt.y === gridN;

            return (
              <g
                key={`pt-${pt.x}-${pt.y}`}
                transform={`translate(${px}, ${py})`}
              >
                <circle
                  cx={0}
                  cy={0}
                  r={isStart || isEnd ? startEndR : innerR}
                  fill={
                    isEnd
                      ? MATH_COLORS.functionTransformed
                      : isStart
                        ? MATH_COLORS.paramPrimary
                        : MATH_COLORS.white
                  }
                  stroke={
                    isEnd
                      ? MATH_COLORS.functionTransformed
                      : isStart
                        ? MATH_COLORS.paramPrimary
                        : MATH_COLORS.paramTertiary
                  }
                  strokeWidth={2}
                />
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  fill={
                    isStart || isEnd ? MATH_COLORS.white : MATH_COLORS.labelText
                  }
                  fontSize={fontScale(isEnd ? 11.5 : minCell < 62 ? 9.5 : 10.5)}
                  fontWeight="bold"
                >
                  {pt.ways}
                </text>

                {/* 坐标标签 */}
                <text
                  x={0}
                  y={isStart ? startEndR + 13 : -(innerR + 6)}
                  textAnchor="middle"
                  fill={MATH_COLORS.textMuted}
                  fontSize={fontScale(minCell < 62 ? 8.5 : 9)}
                >
                  ({pt.x},{pt.y})
                </text>
              </g>
            );
          }),
        )}
      </g>

      {/* 底部定理说明与示例步序卡片 */}
      <g transform="translate(45, 452)">
        <rect
          x={0}
          y={0}
          width={665}
          height={78}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.functionTransformed}
          strokeWidth={1.5}
          rx={8}
        />
        <text
          x={20}
          y={28}
          fill={MATH_COLORS.functionTransformed}
          fontSize={fontScale(12.5)}
          fontWeight="bold"
        >
          💡 路径计算：总步数 m+n = {gridM + gridN} 步（右 {gridM} 步，上{" "}
          {gridN} 步），总走法 N = {formatComb(gridM + gridN, gridM)} ={" "}
          {formatComb(gridM + gridN, gridN)} ={" "}
          {gridMatrix[gridN]?.[gridM]?.ways} 种。
        </text>
        <text
          x={20}
          y={56}
          fill={MATH_COLORS.paramSecondary}
          fontSize={fontScale(11.5)}
          fontWeight="bold"
        >
          示例橙色虚线步序：{sampleSteps.join(" → ")}（共 {gridM} 个 R 与{" "}
          {gridN} 个 U 排列）
        </text>
      </g>
    </g>
  );
}
