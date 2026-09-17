import { useMemo, useState } from "react";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  calculateTotalProb,
  calculateWarnerModel,
} from "@/math/probabilityBayes";

interface TotalProbSceneProps {
  params: Record<string, number>;
  totalScenario?: "free" | "factory3" | "balanced" | "warner";
  fontScale: (v: number) => number;
}

export function TotalProbScene({
  params,
  totalScenario = "factory3",
  fontScale,
}: TotalProbSceneProps) {
  const [highlightedPartition, setHighlightedPartition] = useState<
    number | null
  >(null);

  const isWarner = totalScenario === "warner";

  const { totalProbData, warnerRes } = useMemo(() => {
    if (isWarner) {
      const pCard = params.pCard ?? 0.8;
      const pReportYes = params.pReportYes ?? 0.36;
      const wRes = calculateWarnerModel(pCard, pReportYes);
      const inputs = [
        {
          key: "C1",
          name: "卡片 C₁ (我是)",
          pAi: pCard,
          pB_given_Ai: wRes.pReal,
        },
        {
          key: "C2",
          name: "卡片 C₂ (我不是)",
          pAi: 1 - pCard,
          pB_given_Ai: 1 - wRes.pReal,
        },
      ];
      return { totalProbData: calculateTotalProb(inputs), warnerRes: wRes };
    }

    const pA1 = params.pA1 ?? 0.4;
    const pA2 = params.pA2 ?? 0.35;
    const pA3 = Math.max(0, 1 - pA1 - pA2);

    const inputs = [
      {
        key: "A1",
        name: "划分 A₁",
        pAi: pA1,
        pB_given_Ai: params.pB_A1 ?? 0.6,
      },
      {
        key: "A2",
        name: "划分 A₂",
        pAi: pA2,
        pB_given_Ai: params.pB_A2 ?? 0.3,
      },
      {
        key: "A3",
        name: "划分 A₃",
        pAi: pA3,
        pB_given_Ai: params.pB_A3 ?? 0.8,
      },
    ];
    return {
      totalProbData: calculateTotalProb(inputs),
      warnerRes: null,
    };
  }, [
    isWarner,
    params.pCard,
    params.pReportYes,
    params.pA1,
    params.pA2,
    params.pB_A1,
    params.pB_A2,
    params.pB_A3,
  ]);

  // 840 x 650 预设标准坐标系
  // 1. 左半区：完备矩形划分 (x: 45 ~ 405, y: 70 ~ 490)
  const leftWidth = 360;
  const startX = 45;
  const startY = 70;
  const treemapHeight = 420;

  const partitionColors = [
    MATH_COLORS.paramPrimary,
    MATH_COLORS.paramSecondary,
    MATH_COLORS.paramTertiary,
  ];

  // 计算各分区在 Treemap 中的宽度与起点
  const partitionLayouts = useMemo(() => {
    let currentX = startX;
    return totalProbData.partitions.map((part, idx) => {
      const w = leftWidth * part.pAi;
      const hB = treemapHeight * part.pB_given_Ai;
      const layout = {
        idx,
        x: currentX,
        w,
        hB,
        part,
        color: partitionColors[idx % partitionColors.length],
      };
      currentX += w;
      return layout;
    });
  }, [totalProbData.partitions]);

  // 2. 右半区：树状图分支与汇聚 (x: 435 ~ 795, y: 70 ~ 490)
  const treeStartX = 445;
  const rootPt = { x: treeStartX + 20, y: 280 };

  const nodesA = useMemo(() => {
    const count = totalProbData.partitions.length;
    return totalProbData.partitions.map((part, idx) => {
      const y =
        count === 2
          ? idx === 0
            ? 190
            : 370
          : idx === 0
            ? 120
            : idx === 1
              ? 280
              : 440;
      return {
        x: treeStartX + 140,
        y,
        item: part,
        color: partitionColors[idx % partitionColors.length],
        idx,
        label: isWarner ? (idx === 0 ? "C₁" : "C₂") : `A${idx + 1}`,
      };
    });
  }, [totalProbData.partitions, isWarner]);

  const nodeB = { x: treeStartX + 290, y: 280 };
  const targetEventTitle = isWarner ? "回答 Yes" : "事件 B";

  return (
    <g>
      {/* ─── 左半区：完备事件组加权面积图 (Treemap) ─── */}
      <text
        x={startX}
        y={startY - 14}
        fontSize={fontScale(15)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
      >
        1. 完备划分加权面积图（底宽×高 = 联合概率 P(A_i B)）
      </text>

      {/* 外边框（全集 Ω） */}
      <rect
        x={startX}
        y={startY}
        width={leftWidth}
        height={treemapHeight}
        rx={10}
        fill={MATH_COLORS.white}
        stroke={MATH_COLORS.axis}
        strokeWidth={2}
      />

      {/* 动态分区渲染 */}
      {partitionLayouts.map((pLayout) => {
        const { idx, x, w, hB, part, color } = pLayout;
        const isHovered =
          highlightedPartition === null || highlightedPartition === idx;
        return (
          <g
            key={`treemap-${idx}`}
            onMouseEnter={() => setHighlightedPartition(idx)}
            onMouseLeave={() => setHighlightedPartition(null)}
            className="cursor-pointer transition-opacity"
            opacity={isHovered ? 1 : 0.35}
          >
            {/* 分区全高背景 */}
            <rect
              x={x}
              y={startY}
              width={w}
              height={treemapHeight}
              fill={withAlpha(color, 0.08)}
              stroke={color}
              strokeWidth={1.5}
            />
            {/* 目标事件发生填充区域 (高度 = hB) */}
            <rect
              x={x}
              y={startY + (treemapHeight - hB)}
              width={w}
              height={hB}
              fill={withAlpha(color, 0.65)}
              stroke={color}
              strokeWidth={2}
            />

            {/* 顶端先验标签 */}
            <text
              x={x + w / 2}
              y={startY + 24}
              fontSize={fontScale(12)}
              fontWeight="bold"
              fill={color}
              textAnchor="middle"
            >
              {isWarner
                ? `${idx === 0 ? "C₁" : "C₂"}: ${(part.pAi * 100).toFixed(0)}%`
                : `A${idx + 1}: ${(part.pAi * 100).toFixed(0)}%`}
            </text>

            {/* 色块内联合概率标注 */}
            {hB > 24 && w > 36 && (
              <text
                x={x + w / 2}
                y={startY + (treemapHeight - hB / 2) + 4}
                fontSize={fontScale(11)}
                fontWeight="bold"
                fill={MATH_COLORS.white}
                textAnchor="middle"
              >
                {part.pJoint.toFixed(3)}
              </text>
            )}
          </g>
        );
      })}

      {/* 底部全集与累加指示 */}
      <text
        x={startX + leftWidth / 2}
        y={startY + treemapHeight + 16}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
        textAnchor="middle"
      >
        总底宽 = 完备划分概率和 100% ｜ 高亮总面积 = {targetEventTitle} 的全概率{" "}
        {(totalProbData.pB * 100).toFixed(1)}%
      </text>

      {/* ─── 右半区：树状图路径与全概率汇聚 ─── */}
      <text
        x={treeStartX + 10}
        y={startY - 14}
        fontSize={fontScale(15)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
      >
        2. 全概率树状路径与动态汇流（分支相乘，汇流相加）
      </text>

      {/* 根节点：全样本空间 Ω */}
      <circle
        cx={rootPt.x}
        cy={rootPt.y}
        r={22}
        fill={MATH_COLORS.white}
        stroke={MATH_COLORS.axis}
        strokeWidth={2}
      />
      <text
        x={rootPt.x}
        y={rootPt.y + 5}
        fontSize={fontScale(13)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
        textAnchor="middle"
      >
        Ω
      </text>

      {/* 阶段 1 分支连线 (Ω -> Ai) */}
      {nodesA.map((nA, idx) => (
        <g
          key={`branch1-${idx}`}
          opacity={
            highlightedPartition === null || highlightedPartition === idx
              ? 1
              : 0.35
          }
          className="transition-opacity"
        >
          <line
            x1={rootPt.x + 22}
            y1={rootPt.y}
            x2={nA.x - 26}
            y2={nA.y}
            stroke={nA.color}
            strokeWidth={Math.max(2, nA.item.pAi * 10)}
            strokeLinecap="round"
          />
          {/* 分支概率标注 */}
          <text
            x={(rootPt.x + nA.x) / 2 - 8}
            y={(rootPt.y + nA.y) / 2 - 8}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={nA.color}
            textAnchor="middle"
          >
            P({nA.label})={nA.item.pAi.toFixed(2)}
          </text>
        </g>
      ))}

      {/* 阶段 1 节点 (Ai) */}
      {nodesA.map((nA, idx) => (
        <g
          key={`nodeA-${idx}`}
          opacity={
            highlightedPartition === null || highlightedPartition === idx
              ? 1
              : 0.35
          }
          className="cursor-pointer transition-opacity"
          onMouseEnter={() => setHighlightedPartition(idx)}
          onMouseLeave={() => setHighlightedPartition(null)}
        >
          <circle
            cx={nA.x}
            cy={nA.y}
            r={24}
            fill={MATH_COLORS.white}
            stroke={nA.color}
            strokeWidth={highlightedPartition === idx ? 4 : 2.5}
          />
          <text
            x={nA.x}
            y={nA.y + 5}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fill={nA.color}
            textAnchor="middle"
          >
            {nA.label}
          </text>
        </g>
      ))}

      {/* 阶段 2 分支连线 (Ai -> B) */}
      {nodesA.map((nA, idx) => (
        <g
          key={`branch2-${idx}`}
          opacity={
            highlightedPartition === null || highlightedPartition === idx
              ? 1
              : 0.35
          }
          className="transition-opacity"
        >
          <line
            x1={nA.x + 24}
            y1={nA.y}
            x2={nodeB.x - 30}
            y2={nodeB.y}
            stroke={nA.color}
            strokeWidth={Math.max(1.5, nA.item.pJoint * 12)}
            strokeDasharray={nA.item.pB_given_Ai === 0 ? "4 4" : undefined}
            strokeLinecap="round"
          />
          {/* 路径联合概率标注 */}
          <text
            x={(nA.x + nodeB.x) / 2 + 10}
            y={
              (nA.y + nodeB.y) / 2 +
              (nodesA.length === 2
                ? idx === 0
                  ? -10
                  : 12
                : idx === 0
                  ? -10
                  : idx === 1
                    ? -6
                    : 14)
            }
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={nA.color}
            textAnchor="middle"
          >
            P({nA.label}B)={nA.item.pJoint.toFixed(3)}
          </text>
        </g>
      ))}

      {/* 汇集总节点：目标事件 */}
      <circle
        cx={nodeB.x}
        cy={nodeB.y}
        r={32}
        fill={MATH_COLORS.function}
        className="shadow-md"
      />
      <text
        x={nodeB.x}
        y={nodeB.y - 4}
        fontSize={fontScale(isWarner ? 11.5 : 13.5)}
        fontWeight="bold"
        fill={MATH_COLORS.white}
        textAnchor="middle"
      >
        {targetEventTitle}
      </text>
      <text
        x={nodeB.x}
        y={nodeB.y + 16}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fill={MATH_COLORS.white}
        textAnchor="middle"
      >
        {(totalProbData.pB * 100).toFixed(1)}%
      </text>

      {/* ─── 底部长条卡片：全概率公式闭环数值展开 (x: 45 ~ 800, y: 515 ~ 620) ─── */}
      <g transform="translate(45, 515)">
        <rect
          x={0}
          y={0}
          width={750}
          height={95}
          rx={12}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.function}
          strokeWidth={1.5}
        />
        <text
          x={16}
          y={26}
          fontSize={fontScale(13)}
          fontWeight="bold"
          fill={MATH_COLORS.function}
        >
          {isWarner
            ? "Warner 随机化回答模型全概展开：P(Yes) = P(C₁)P(Yes|C₁) + P(C₂)P(Yes|C₂)"
            : "全概率公式路径汇总展开：P(B) = P(A₁)P(B|A₁) + P(A₂)P(B|A₂) + P(A₃)P(B|A₃)"}
        </text>

        <g transform="translate(16, 52)">
          {isWarner && warnerRes ? (
            <text
              x={0}
              y={16}
              fontSize={fontScale(12.5)}
              fontWeight="bold"
              fill={MATH_COLORS.labelText}
            >
              P(Yes) ={" "}
              <tspan fill={MATH_COLORS.paramPrimary}>
                {warnerRes.pCard.toFixed(2)} × p_real
              </tspan>{" "}
              +{" "}
              <tspan fill={MATH_COLORS.paramSecondary}>
                {(1 - warnerRes.pCard).toFixed(2)} × (1 - p_real)
              </tspan>{" "}
              ={" "}
              <tspan fill={MATH_COLORS.function}>
                {(warnerRes.pReportYes * 100).toFixed(1)}%
              </tspan>{" "}
              ⟹ 反解真实比例：
              <tspan fill={MATH_COLORS.derivative} fontSize={fontScale(14)}>
                p_real = {(warnerRes.pReal * 100).toFixed(2)}%
              </tspan>
            </text>
          ) : (
            <>
              <text
                x={0}
                y={16}
                fontSize={fontScale(13)}
                fontWeight="bold"
                fill={MATH_COLORS.labelText}
              >
                P(B) =
              </text>
              <text
                x={45}
                y={16}
                fontSize={fontScale(12)}
                fontWeight="bold"
                fill={MATH_COLORS.paramPrimary}
              >
                {totalProbData.partitions[0].pAi.toFixed(2)}×
                {totalProbData.partitions[0].pB_given_Ai.toFixed(2)} (
                {totalProbData.partitions[0].pJoint.toFixed(3)})
              </text>
              <text
                x={200}
                y={16}
                fontSize={fontScale(13)}
                fontWeight="bold"
                fill={MATH_COLORS.labelText}
              >
                +
              </text>
              <text
                x={216}
                y={16}
                fontSize={fontScale(12)}
                fontWeight="bold"
                fill={MATH_COLORS.paramSecondary}
              >
                {totalProbData.partitions[1].pAi.toFixed(2)}×
                {totalProbData.partitions[1].pB_given_Ai.toFixed(2)} (
                {totalProbData.partitions[1].pJoint.toFixed(3)})
              </text>
              {totalProbData.partitions[2] && (
                <>
                  <text
                    x={370}
                    y={16}
                    fontSize={fontScale(13)}
                    fontWeight="bold"
                    fill={MATH_COLORS.labelText}
                  >
                    +
                  </text>
                  <text
                    x={386}
                    y={16}
                    fontSize={fontScale(12)}
                    fontWeight="bold"
                    fill={MATH_COLORS.paramTertiary}
                  >
                    {totalProbData.partitions[2].pAi.toFixed(2)}×
                    {totalProbData.partitions[2].pB_given_Ai.toFixed(2)} (
                    {totalProbData.partitions[2].pJoint.toFixed(3)})
                  </text>
                </>
              )}
              <text
                x={totalProbData.partitions[2] ? 540 : 380}
                y={16}
                fontSize={fontScale(13)}
                fontWeight="bold"
                fill={MATH_COLORS.labelText}
              >
                =
              </text>
              <text
                x={totalProbData.partitions[2] ? 560 : 400}
                y={16}
                fontSize={fontScale(14)}
                fontWeight="bold"
                fill={MATH_COLORS.function}
              >
                {(totalProbData.pB * 100).toFixed(2)}% (
                {totalProbData.pB.toFixed(4)})
              </text>
            </>
          )}
        </g>
      </g>
    </g>
  );
}
