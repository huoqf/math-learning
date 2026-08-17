import { useMemo } from "react";
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculateTotalProb } from "@/math/probabilityBayes";

interface TotalProbSceneProps {
  params: Record<string, number>;
  fontScale: (v: number) => number;
}

export function TotalProbScene({ params, fontScale }: TotalProbSceneProps) {
  const totalProbData = useMemo(() => {
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
    return calculateTotalProb(inputs);
  }, [params.pA1, params.pA2, params.pB_A1, params.pB_A2, params.pB_A3]);

  // 840 x 650 预设标准坐标系
  // 1. 左半区：完备矩形划分 (x: 45 ~ 410, y: 75 ~ 505)
  const leftWidth = 365;
  const startX = 45;
  const startY = 75;
  const treemapHeight = 430;

  const w1 = leftWidth * totalProbData.partitions[0].pAi;
  const w2 = leftWidth * totalProbData.partitions[1].pAi;
  const w3 = leftWidth * totalProbData.partitions[2].pAi;

  const h1B = treemapHeight * totalProbData.partitions[0].pB_given_Ai;
  const h2B = treemapHeight * totalProbData.partitions[1].pB_given_Ai;
  const h3B = treemapHeight * totalProbData.partitions[2].pB_given_Ai;

  // 2. 右半区：树状图分支与汇聚 (x: 435 ~ 800, y: 75 ~ 505)
  const treeStartX = 450;
  const rootPt = { x: treeStartX + 20, y: 290 };

  const nodesA = [
    {
      x: treeStartX + 140,
      y: 130,
      item: totalProbData.partitions[0],
      color: MATH_COLORS.paramPrimary,
    },
    {
      x: treeStartX + 140,
      y: 290,
      item: totalProbData.partitions[1],
      color: MATH_COLORS.paramSecondary,
    },
    {
      x: treeStartX + 140,
      y: 450,
      item: totalProbData.partitions[2],
      color: MATH_COLORS.paramTertiary,
    },
  ];

  const nodeB = { x: treeStartX + 280, y: 290 };

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
        1. 完备划分与加权面积图 (各色块面积 = 联合概率 P(A_i B))
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

      {/* 分区 1 (A1) */}
      <rect
        x={startX}
        y={startY}
        width={w1}
        height={treemapHeight}
        fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={1.5}
      />
      <rect
        x={startX}
        y={startY + (treemapHeight - h1B)}
        width={w1}
        height={h1B}
        fill={withAlpha(MATH_COLORS.paramPrimary, 0.6)}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={1.5}
      />

      {/* 分区 2 (A2) */}
      <rect
        x={startX + w1}
        y={startY}
        width={w2}
        height={treemapHeight}
        fill={withAlpha(MATH_COLORS.paramSecondary, 0.08)}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={1.5}
      />
      <rect
        x={startX + w1}
        y={startY + (treemapHeight - h2B)}
        width={w2}
        height={h2B}
        fill={withAlpha(MATH_COLORS.paramSecondary, 0.6)}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={1.5}
      />

      {/* 分区 3 (A3) */}
      <rect
        x={startX + w1 + w2}
        y={startY}
        width={w3}
        height={treemapHeight}
        fill={withAlpha(MATH_COLORS.paramTertiary, 0.08)}
        stroke={MATH_COLORS.paramTertiary}
        strokeWidth={1.5}
      />
      <rect
        x={startX + w1 + w2}
        y={startY + (treemapHeight - h3B)}
        width={w3}
        height={h3B}
        fill={withAlpha(MATH_COLORS.paramTertiary, 0.6)}
        stroke={MATH_COLORS.paramTertiary}
        strokeWidth={1.5}
      />

      {/* 分区顶端先验标签 */}
      <text
        x={startX + w1 / 2}
        y={startY + 24}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fill={MATH_COLORS.paramPrimary}
        textAnchor="middle"
      >
        A₁: {(totalProbData.partitions[0].pAi * 100).toFixed(0)}%
      </text>
      <text
        x={startX + w1 + w2 / 2}
        y={startY + 24}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="middle"
      >
        A₂: {(totalProbData.partitions[1].pAi * 100).toFixed(0)}%
      </text>
      <text
        x={startX + w1 + w2 + w3 / 2}
        y={startY + 24}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fill={MATH_COLORS.paramTertiary}
        textAnchor="middle"
      >
        A₃: {(totalProbData.partitions[2].pAi * 100).toFixed(0)}%
      </text>

      {/* 色块内联合概率标注 */}
      {h1B > 24 && w1 > 30 && (
        <text
          x={startX + w1 / 2}
          y={startY + (treemapHeight - h1B / 2) + 4}
          fontSize={fontScale(11)}
          fontWeight="bold"
          fill={MATH_COLORS.white}
          textAnchor="middle"
        >
          {totalProbData.partitions[0].pJoint.toFixed(3)}
        </text>
      )}
      {h2B > 24 && w2 > 30 && (
        <text
          x={startX + w1 + w2 / 2}
          y={startY + (treemapHeight - h2B / 2) + 4}
          fontSize={fontScale(11)}
          fontWeight="bold"
          fill={MATH_COLORS.white}
          textAnchor="middle"
        >
          {totalProbData.partitions[1].pJoint.toFixed(3)}
        </text>
      )}
      {h3B > 24 && w3 > 30 && (
        <text
          x={startX + w1 + w2 + w3 / 2}
          y={startY + (treemapHeight - h3B / 2) + 4}
          fontSize={fontScale(11)}
          fontWeight="bold"
          fill={MATH_COLORS.white}
          textAnchor="middle"
        >
          {totalProbData.partitions[2].pJoint.toFixed(3)}
        </text>
      )}

      {/* ─── 右半区：树状图路径与全概率汇聚 ─── */}
      <text
        x={treeStartX + 10}
        y={startY - 14}
        fontSize={fontScale(15)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
      >
        2. 全概率树状路径与动态汇流
      </text>

      {/* 树根：全集 Ω */}
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
        <g key={`branch1-${idx}`}>
          <line
            x1={rootPt.x + 22}
            y1={rootPt.y}
            x2={nA.x - 26}
            y2={nA.y}
            stroke={nA.color}
            strokeWidth={Math.max(2, nA.item.pAi * 10)}
            opacity={0.85}
          />
          {/* 分支概率标注 */}
          <text
            x={(rootPt.x + nA.x) / 2 - 10}
            y={(rootPt.y + nA.y) / 2 - 8}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={nA.color}
            textAnchor="middle"
          >
            P(A{idx + 1})={nA.item.pAi.toFixed(2)}
          </text>
        </g>
      ))}

      {/* 阶段 1 节点 (Ai) */}
      {nodesA.map((nA, idx) => (
        <g key={`nodeA-${idx}`}>
          <circle
            cx={nA.x}
            cy={nA.y}
            r={24}
            fill={MATH_COLORS.white}
            stroke={nA.color}
            strokeWidth={2.5}
          />
          <text
            x={nA.x}
            y={nA.y + 5}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fill={nA.color}
            textAnchor="middle"
          >
            A{idx + 1}
          </text>
        </g>
      ))}

      {/* 阶段 2 分支连线 (Ai -> B) */}
      {nodesA.map((nA, idx) => (
        <g key={`branch2-${idx}`}>
          <line
            x1={nA.x + 24}
            y1={nA.y}
            x2={nodeB.x - 30}
            y2={nodeB.y}
            stroke={nA.color}
            strokeWidth={Math.max(1.5, nA.item.pJoint * 12)}
            strokeDasharray={nA.item.pB_given_Ai === 0 ? "4 4" : undefined}
            opacity={0.9}
          />
          {/* 路径联合概率标注 */}
          <text
            x={(nA.x + nodeB.x) / 2 + 10}
            y={(nA.y + nodeB.y) / 2 + (idx === 0 ? -10 : idx === 1 ? -6 : 14)}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={nA.color}
            textAnchor="middle"
          >
            P(A{idx + 1}B)={nA.item.pJoint.toFixed(3)}
          </text>
        </g>
      ))}

      {/* 汇集总节点：事件 B */}
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
        fontSize={fontScale(14)}
        fontWeight="bold"
        fill={MATH_COLORS.white}
        textAnchor="middle"
      >
        事件 B
      </text>
      <text
        x={nodeB.x}
        y={nodeB.y + 16}
        fontSize={fontScale(12)}
        fontWeight="bold"
        fill={MATH_COLORS.white}
        textAnchor="middle"
      >
        {totalProbData.pB.toFixed(3)}
      </text>

      {/* ─── 底部长条卡片：全概率公式闭环数值展开 (x: 45 ~ 800, y: 525 ~ 615) ─── */}
      <g transform="translate(45, 525)">
        <rect
          x={0}
          y={0}
          width={755}
          height={85}
          rx={12}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.function}
          strokeWidth={1.5}
        />
        <text
          x={16}
          y={24}
          fontSize={fontScale(13)}
          fontWeight="bold"
          fill={MATH_COLORS.function}
        >
          全概率公式路径汇总展开：P(B) = P(A₁)P(B|A₁) + P(A₂)P(B|A₂) +
          P(A₃)P(B|A₃)
        </text>

        <g transform="translate(16, 44)">
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
          <text
            x={540}
            y={16}
            fontSize={fontScale(13)}
            fontWeight="bold"
            fill={MATH_COLORS.labelText}
          >
            =
          </text>
          <text
            x={560}
            y={16}
            fontSize={fontScale(14)}
            fontWeight="bold"
            fill={MATH_COLORS.function}
          >
            {(totalProbData.pB * 100).toFixed(2)}% (
            {totalProbData.pB.toFixed(4)})
          </text>
        </g>
      </g>
    </g>
  );
}
