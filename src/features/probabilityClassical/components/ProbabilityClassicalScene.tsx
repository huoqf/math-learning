import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { MATH_COLORS, withAlpha } from "@/theme";
import type {
  ClassicalMathResult,
  ClassicalModelType,
} from "@/math/probabilityClassical";

export interface ProbabilityClassicalSceneProps {
  modelType: ClassicalModelType;
  mathRes: ClassicalMathResult;
  activeView: "matrix" | "tree";
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (v: number) => number;
  activeStep?: number;
}

export const ProbabilityClassicalScene: React.FC<
  ProbabilityClassicalSceneProps
> = ({ modelType, mathRes, activeView, fontScale, activeStep = 1 }) => {
  const { totalCount, eventCount, samplePoints, treeNodes, eventName } =
    mathRes;

  // 1. 网格矩阵视图布局参数 (Matrix View)
  const matrixLayout = useMemo(() => {
    if (samplePoints.length === 0) return null;

    if (modelType === "dice_two") {
      // 6 x 6 网格
      const rows = 6;
      const cols = 6;
      const cellSize = 64;
      const startX = 420 - (cols * cellSize) / 2;
      const startY = 325 - (rows * cellSize) / 2 + 10;
      return { rows, cols, cellSize, startX, startY, type: "grid6x6" as const };
    }

    if (modelType === "ball_draw") {
      // 摸球样本点矩阵 (通常 20 或 25 点)
      const cols = 5;
      const rows = Math.ceil(samplePoints.length / cols);
      const cellW = 88;
      const cellH = 56;
      const startX = 420 - (cols * cellW) / 2;
      const startY = 325 - (rows * cellH) / 2 + 15;
      return {
        rows,
        cols,
        cellW,
        cellH,
        startX,
        startY,
        type: "flow" as const,
      };
    }

    // 选人模型 (10 点)
    const cols = 5;
    const rows = 2;
    const cellW = 100;
    const cellH = 64;
    const startX = 420 - (cols * cellW) / 2;
    const startY = 325 - (rows * cellH) / 2 + 15;
    return {
      rows,
      cols,
      cellW,
      cellH,
      startX,
      startY,
      type: "flow" as const,
    };
  }, [modelType, samplePoints.length]);

  // 2. 树状图节点坐标布局 (Tree Diagram View)
  const treeLayout = useMemo(() => {
    if (!treeNodes || treeNodes.length === 0) return null;

    const maxDepth = Math.max(...treeNodes.map((n) => n.depth));
    const isThreeLevels = maxDepth === 3;

    // 树状图分层 X 坐标
    const depthX = isThreeLevels ? [120, 260, 420, 600] : [160, 360, 580];
    const leafNodes = treeNodes.filter((n) => n.depth === maxDepth);
    const startY = isThreeLevels ? 130 : 170;
    const rowGap = isThreeLevels ? 56 : 84;

    const nodeCoords = new Map<string, { x: number; y: number }>();

    // 先排列叶子节点
    leafNodes.forEach((leaf, idx) => {
      nodeCoords.set(leaf.id, {
        x: depthX[maxDepth],
        y: startY + idx * rowGap,
      });
    });

    // 向上递归计算父节点 Y 坐标（居中）
    for (let d = maxDepth - 1; d >= 0; d--) {
      const currentLevelNodes = treeNodes.filter((n) => n.depth === d);
      currentLevelNodes.forEach((node) => {
        if (node.childrenIds.length > 0) {
          const childYs = node.childrenIds
            .map((cid) => nodeCoords.get(cid)?.y ?? 0)
            .filter(Boolean);
          const avgY = childYs.reduce((acc, v) => acc + v, 0) / childYs.length;
          nodeCoords.set(node.id, { x: depthX[d], y: avgY });
        } else {
          nodeCoords.set(node.id, { x: depthX[d], y: startY });
        }
      });
    }

    return { nodeCoords, depthX, maxDepth, isThreeLevels };
  }, [treeNodes]);

  // 步数聚焦状态逻辑
  const isStep1 = activeStep === 1; // 审题定模：全空间亮，外围虚线围栏
  const isStep3 = activeStep === 3; // 确定事件：目标事件高亮，非目标点压暗
  const isStep4 = activeStep === 4; // 代入与验算：目标事件主色高亮，对立事件互补色高亮

  return (
    <g className="probability-classical-scene select-none">
      {/* 顶部标题指示与概率实时状态栏 */}
      <g transform="translate(420, 45)">
        <rect
          x={-280}
          y={-28}
          width={560}
          height={48}
          rx={12}
          fill={withAlpha(MATH_COLORS.poolBg, 0.85)}
          stroke={withAlpha(MATH_COLORS.primary, 0.4)}
          strokeWidth={1.5}
        />
        <text
          x={0}
          y={3}
          textAnchor="middle"
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(14)}
          fontWeight="600"
        >
          {`古典概型：${eventName}`}
        </text>
        <text
          x={0}
          y={20}
          textAnchor="middle"
          fill={MATH_COLORS.labelTextLight}
          fontSize={fontScale(12)}
        >
          {`基本事件数：n(A) = ${eventCount} / n(Ω) = ${totalCount}，概率比值：P(A) = ${mathRes.ratioText}`}
        </text>
      </g>

      {/* 模式一：二维网格矩阵视图 (Matrix View) */}
      {activeView === "matrix" && matrixLayout && (
        <g className="matrix-view">
          {matrixLayout.type === "grid6x6" ? (
            // 6x6 两枚骰子二维网格
            <g>
              {/* 表头标签：第一枚骰子 (行) 与 第二枚骰子 (列) */}
              <text
                x={matrixLayout.startX - 36}
                y={matrixLayout.startY + (6 * matrixLayout.cellSize) / 2}
                textAnchor="middle"
                fill={MATH_COLORS.paramPrimary}
                fontSize={fontScale(13)}
                fontWeight="bold"
                transform={`rotate(-90, ${matrixLayout.startX - 36}, ${matrixLayout.startY + (6 * matrixLayout.cellSize) / 2})`}
              >
                第 1 枚骰子点数 (i)
              </text>
              <text
                x={matrixLayout.startX + (6 * matrixLayout.cellSize) / 2}
                y={matrixLayout.startY - 20}
                textAnchor="middle"
                fill={MATH_COLORS.paramSecondary}
                fontSize={fontScale(13)}
                fontWeight="bold"
              >
                第 2 枚骰子点数 (j)
              </text>

              {/* 轴刻度标注 */}
              {[1, 2, 3, 4, 5, 6].map((num, idx) => (
                <g key={`axis-labels-${num}`}>
                  {/* 列标 (顶) */}
                  <text
                    x={
                      matrixLayout.startX +
                      idx * matrixLayout.cellSize +
                      matrixLayout.cellSize / 2
                    }
                    y={matrixLayout.startY - 6}
                    textAnchor="middle"
                    fill={MATH_COLORS.labelTextLight}
                    fontSize={fontScale(12)}
                  >
                    {num}
                  </text>
                  {/* 行标 (左) */}
                  <text
                    x={matrixLayout.startX - 10}
                    y={
                      matrixLayout.startY +
                      idx * matrixLayout.cellSize +
                      matrixLayout.cellSize / 2 +
                      4
                    }
                    textAnchor="end"
                    fill={MATH_COLORS.labelTextLight}
                    fontSize={fontScale(12)}
                  >
                    {num}
                  </text>
                </g>
              ))}

              {/* 36 个网格点阵 */}
              {samplePoints.map((pt) => {
                const cellX =
                  matrixLayout.startX + pt.colIdx * matrixLayout.cellSize;
                const cellY =
                  matrixLayout.startY + pt.rowIdx * matrixLayout.cellSize;
                const isMatch = pt.isEvent;

                // 分步聚焦视觉表现：
                // Step 3 突出目标事件（非目标点压暗）
                // Step 4 呈现原事件与对立事件对偶
                let cellFill = withAlpha(MATH_COLORS.poolBg, 0.6);
                let cellStroke = withAlpha(MATH_COLORS.textMuted, 0.25);
                let cellStrokeWidth = 1;
                let cellOpacity = 1.0;

                if (isMatch) {
                  cellFill = withAlpha(MATH_COLORS.paramPrimary, 0.25);
                  cellStroke = MATH_COLORS.paramPrimary;
                  cellStrokeWidth = 2;
                } else if (isStep4) {
                  cellFill = withAlpha(MATH_COLORS.paramSecondary, 0.18);
                  cellStroke = withAlpha(MATH_COLORS.paramSecondary, 0.6);
                  cellStrokeWidth = 1.5;
                } else if (isStep3) {
                  cellOpacity = 0.35;
                }

                return (
                  <g
                    key={pt.id}
                    transform={`translate(${cellX}, ${cellY})`}
                    opacity={cellOpacity}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <rect
                      x={2}
                      y={2}
                      width={matrixLayout.cellSize - 4}
                      height={matrixLayout.cellSize - 4}
                      rx={6}
                      fill={cellFill}
                      stroke={cellStroke}
                      strokeWidth={cellStrokeWidth}
                    />
                    <text
                      x={matrixLayout.cellSize / 2}
                      y={matrixLayout.cellSize / 2 - 3}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={
                        isMatch
                          ? MATH_COLORS.paramPrimary
                          : isStep4
                            ? MATH_COLORS.paramSecondary
                            : MATH_COLORS.labelText
                      }
                      fontSize={fontScale(12)}
                      fontWeight={isMatch ? "bold" : "normal"}
                    >
                      {pt.label}
                    </text>
                    <text
                      x={matrixLayout.cellSize / 2}
                      y={matrixLayout.cellSize / 2 + 13}
                      textAnchor="middle"
                      fill={
                        isMatch
                          ? MATH_COLORS.accent
                          : isStep4
                            ? MATH_COLORS.paramSecondary
                            : MATH_COLORS.textMuted
                      }
                      fontSize={fontScale(10)}
                    >
                      {`和=${(Number(pt.xVal) || 0) + (Number(pt.yVal) || 0)}`}
                    </text>
                  </g>
                );
              })}
            </g>
          ) : (
            // 摸球 / 选人组合流动卡片
            <g>
              {samplePoints.map((pt, idx) => {
                const cols = matrixLayout.cols;
                const cellW = matrixLayout.cellW ?? 90;
                const cellH = matrixLayout.cellH ?? 60;
                const r = Math.floor(idx / cols);
                const c = idx % cols;
                const cellX = matrixLayout.startX + c * cellW;
                const cellY = matrixLayout.startY + r * cellH;
                const isMatch = pt.isEvent;

                let cellFill = withAlpha(MATH_COLORS.poolBg, 0.6);
                let cellStroke = withAlpha(MATH_COLORS.textMuted, 0.25);
                let cellStrokeWidth = 1;
                let cellOpacity = 1.0;

                if (isMatch) {
                  cellFill = withAlpha(MATH_COLORS.paramPrimary, 0.22);
                  cellStroke = MATH_COLORS.paramPrimary;
                  cellStrokeWidth = 2;
                } else if (isStep4) {
                  cellFill = withAlpha(MATH_COLORS.paramSecondary, 0.16);
                  cellStroke = withAlpha(MATH_COLORS.paramSecondary, 0.6);
                  cellStrokeWidth = 1.5;
                } else if (isStep3) {
                  cellOpacity = 0.35;
                }

                return (
                  <g
                    key={pt.id}
                    transform={`translate(${cellX}, ${cellY})`}
                    opacity={cellOpacity}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <rect
                      x={3}
                      y={3}
                      width={cellW - 6}
                      height={cellH - 6}
                      rx={8}
                      fill={cellFill}
                      stroke={cellStroke}
                      strokeWidth={cellStrokeWidth}
                    />
                    <text
                      x={cellW / 2}
                      y={cellH / 2 + 4}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={
                        isMatch
                          ? MATH_COLORS.paramPrimary
                          : isStep4
                            ? MATH_COLORS.paramSecondary
                            : MATH_COLORS.labelText
                      }
                      fontSize={fontScale(12)}
                      fontWeight={isMatch ? "bold" : "normal"}
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* 外轮廓聚焦框 (Step 1 审题与等可能全集边界) */}
          {isStep1 && (
            <rect
              x={matrixLayout.startX - 8}
              y={matrixLayout.startY - 8}
              width={
                matrixLayout.type === "grid6x6"
                  ? matrixLayout.cols * matrixLayout.cellSize + 16
                  : matrixLayout.cols * (matrixLayout.cellW ?? 90) + 16
              }
              height={
                matrixLayout.type === "grid6x6"
                  ? matrixLayout.rows * matrixLayout.cellSize + 16
                  : matrixLayout.rows * (matrixLayout.cellH ?? 60) + 16
              }
              rx={12}
              fill="none"
              stroke={MATH_COLORS.primary}
              strokeWidth={2.5}
              strokeDasharray="6 4"
            />
          )}
        </g>
      )}

      {/* 模式二：树状图分步路径视图 (Tree Diagram View) */}
      {activeView === "tree" && treeLayout && (
        <g className="tree-diagram-view">
          {/* 分步阶段顶部提示文字 */}
          <text
            x={treeLayout.depthX[0]}
            y={95}
            textAnchor="middle"
            fill={MATH_COLORS.labelTextLight}
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            试验起点
          </text>
          <text
            x={treeLayout.depthX[1]}
            y={95}
            textAnchor="middle"
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            {treeLayout.isThreeLevels ? "第 1 次抛掷" : "第 1 次抽样"}
          </text>
          <text
            x={treeLayout.depthX[2]}
            y={95}
            textAnchor="middle"
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            {treeLayout.isThreeLevels
              ? "第 2 次抛掷"
              : "第 2 次抽样 (样本分类)"}
          </text>
          {treeLayout.isThreeLevels && (
            <text
              x={treeLayout.depthX[3]}
              y={95}
              textAnchor="middle"
              fill={MATH_COLORS.paramTertiary}
              fontSize={fontScale(12)}
              fontWeight="bold"
            >
              第 3 次 (样本点)
            </text>
          )}

          {/* 树枝连线 (平滑三次贝塞尔曲线) */}
          {treeNodes?.map((node) => {
            if (node.childrenIds.length === 0) return null;
            const parentPos = treeLayout.nodeCoords.get(node.id);
            if (!parentPos) return null;

            return (
              <g key={`branch-group-${node.id}`}>
                {node.childrenIds.map((cid) => {
                  const childPos = treeLayout.nodeCoords.get(cid);
                  const childNode = treeNodes.find((n) => n.id === cid);
                  if (!childPos || !childNode) return null;

                  const isMatchPath = childNode.isEvent;
                  const cpx = (parentPos.x + childPos.x) / 2;

                  let strokeColor = withAlpha(MATH_COLORS.textMuted, 0.3);
                  let strokeWidth = 1.2;
                  let pathOpacity = 1.0;

                  if (isMatchPath) {
                    strokeColor = MATH_COLORS.paramPrimary;
                    strokeWidth = 2.5;
                  } else if (isStep4) {
                    strokeColor = withAlpha(MATH_COLORS.paramSecondary, 0.55);
                    strokeWidth = 1.5;
                  } else if (isStep3) {
                    pathOpacity = 0.3;
                  }

                  return (
                    <path
                      key={`path-${node.id}-${cid}`}
                      d={`M ${parentPos.x} ${parentPos.y} C ${cpx} ${parentPos.y}, ${cpx} ${childPos.y}, ${childPos.x} ${childPos.y}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      opacity={pathOpacity}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* 树节点绘制 */}
          {treeNodes?.map((node) => {
            const pos = treeLayout.nodeCoords.get(node.id);
            if (!pos) return null;
            const isMatch = node.isEvent;
            const isLeaf = node.depth === treeLayout.maxDepth;
            const nodeOpacity = !isMatch && isStep3 ? 0.35 : 1.0;

            // 根节点
            if (node.depth === 0) {
              return (
                <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                  <circle
                    r={18}
                    fill={withAlpha(MATH_COLORS.primary, 0.3)}
                    stroke={MATH_COLORS.primary}
                    strokeWidth={2}
                  />
                  <text
                    y={4}
                    textAnchor="middle"
                    fill={MATH_COLORS.labelText}
                    fontSize={fontScale(11)}
                    fontWeight="bold"
                  >
                    开始
                  </text>
                </g>
              );
            }

            // 中间节点与叶子节点
            const leafDisplayName = node.id
              .replace("node-ball-", "")
              .replace("node-", "")
              .replace("RR", "(红, 红)")
              .replace("RW", "(红, 白)")
              .replace("WR", "(白, 红)")
              .replace("WW", "(白, 白)");

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                opacity={nodeOpacity}
              >
                <circle
                  r={isLeaf ? 16 : 14}
                  fill={
                    isMatch
                      ? withAlpha(MATH_COLORS.paramPrimary, 0.25)
                      : isStep4
                        ? withAlpha(MATH_COLORS.paramSecondary, 0.2)
                        : withAlpha(MATH_COLORS.poolBg, 0.7)
                  }
                  stroke={
                    isMatch
                      ? MATH_COLORS.paramPrimary
                      : isStep4
                        ? MATH_COLORS.paramSecondary
                        : withAlpha(MATH_COLORS.textMuted, 0.4)
                  }
                  strokeWidth={isMatch ? 2 : 1}
                />
                <text
                  y={4}
                  textAnchor="middle"
                  fill={
                    isMatch
                      ? MATH_COLORS.paramPrimary
                      : isStep4
                        ? MATH_COLORS.paramSecondary
                        : MATH_COLORS.labelText
                  }
                  fontSize={fontScale(11)}
                  fontWeight={isMatch ? "bold" : "normal"}
                >
                  {node.label}
                </text>

                {/* 叶子节点右侧样本点总览 */}
                {isLeaf && (
                  <g transform="translate(24, 4)">
                    <text
                      fill={
                        isMatch
                          ? MATH_COLORS.accent
                          : isStep4
                            ? MATH_COLORS.paramSecondary
                            : MATH_COLORS.textMuted
                      }
                      fontSize={fontScale(11)}
                      fontWeight={isMatch ? "bold" : "normal"}
                    >
                      {leafDisplayName}
                      {isMatch ? " ✓ (命中)" : ""}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* 模式二备用：当当前模型不适用树状图时的课标指引看板 */}
      {activeView === "tree" && !treeLayout && (
        <g className="tree-fallback-view" transform="translate(420, 320)">
          <rect
            x={-240}
            y={-100}
            width={480}
            height={200}
            rx={16}
            fill={withAlpha(MATH_COLORS.poolBg, 0.9)}
            stroke={withAlpha(MATH_COLORS.primary, 0.35)}
            strokeWidth={1.5}
          />
          <text
            x={0}
            y={-50}
            textAnchor="middle"
            fill={MATH_COLORS.primary}
            fontSize={fontScale(16)}
            fontWeight="bold"
          >
            课标列举方法指引
          </text>
          <text
            x={0}
            y={-15}
            textAnchor="middle"
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(13)}
          >
            当前试验基本事件数量较多（如 36 个点对）或属无序组合，
          </text>
          <text
            x={0}
            y={12}
            textAnchor="middle"
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(13)}
          >
            高中课标推荐采用【二维列表法（网格矩阵）】直观呈现全貌。
          </text>
          <text
            x={0}
            y={48}
            textAnchor="middle"
            fill={MATH_COLORS.accent}
            fontSize={fontScale(12)}
            fontWeight="600"
          >
            💡
            请在左屏切换回【二维矩阵视图】，或在【三抛硬币】/【摸球抽样】中体验分步树状图。
          </text>
        </g>
      )}
    </g>
  );
};
