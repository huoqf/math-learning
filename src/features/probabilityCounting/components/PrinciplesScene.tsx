import { useMemo } from "react";
import { MATH_COLORS } from "../../../theme";
import {
  buildMultiplicationTree,
  buildAdditionTree,
  getGridPathMatrix,
} from "../../../math/probabilityCounting";
import type { SceneCommonProps } from "./types";
import { formatComb } from "./types";

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

  const gridMatrix = useMemo(() => {
    return getGridPathMatrix(gridM, gridN);
  }, [gridM, gridN]);

  // 1. 乘法决策树或加法通道模式
  if (subMode === 0 || subMode === 1) {
    const isMultiplication = subMode === 0;
    const tree = isMultiplication ? multTree : addTree;

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

          <g transform="translate(15, 50)">
            {/* 渲染边 (Lines) */}
            {tree.edges.map((edge) => {
              const fromNode = tree.nodes.find((n) => n.id === edge.from);
              const toNode = tree.nodes.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const fx = 65 + fromNode.depth * 200;
              const fy = 65 + fromNode.y * 42;
              const tx = 65 + toNode.depth * 200;
              const ty = 65 + toNode.y * 42;

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
              const ny = 65 + node.y * 42;
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
      </g>
    );
  }

  // 2. 网格最短路径与标数法 (subMode === 2)
  const cellW = 95;
  const cellH = 72;
  const startX = 110;
  const startY = 405;

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
                  r={isStart || isEnd ? 18 : 14}
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
                  fontSize={fontScale(isEnd ? 12 : 11)}
                  fontWeight="bold"
                >
                  {pt.ways}
                </text>

                {/* 坐标标签 */}
                <text
                  x={0}
                  y={isStart ? 32 : -20}
                  textAnchor="middle"
                  fill={MATH_COLORS.textMuted}
                  fontSize={fontScale(9)}
                >
                  ({pt.x},{pt.y})
                </text>
              </g>
            );
          }),
        )}
      </g>

      {/* 底部定理说明卡片 */}
      <g transform="translate(45, 460)">
        <rect
          x={0}
          y={0}
          width={665}
          height={68}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.functionTransformed}
          strokeWidth={1.5}
          rx={8}
        />
        <text
          x={20}
          y={40}
          fill={MATH_COLORS.functionTransformed}
          fontSize={fontScale(13)}
          fontWeight="bold"
        >
          💡 路径计算：总步数 m+n = {gridM + gridN} 步，向右 {gridM} 步，向上{" "}
          {gridN} 步。总走法 N = {formatComb(gridM + gridN, gridM)} ={" "}
          {formatComb(gridM + gridN, gridN)} ={" "}
          {gridMatrix[gridN]?.[gridM]?.ways} 种。
        </text>
      </g>
    </g>
  );
}
