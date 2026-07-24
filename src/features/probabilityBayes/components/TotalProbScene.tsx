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

  const leftWidth = 380;
  const startX = 60;
  const startY = 70;
  const treemapHeight = 440;

  const w1 = leftWidth * totalProbData.partitions[0].pAi;
  const w2 = leftWidth * totalProbData.partitions[1].pAi;
  const w3 = leftWidth * totalProbData.partitions[2].pAi;

  const h1B = treemapHeight * totalProbData.partitions[0].pB_given_Ai;
  const h2B = treemapHeight * totalProbData.partitions[1].pB_given_Ai;
  const h3B = treemapHeight * totalProbData.partitions[2].pB_given_Ai;

  const treeStartX = 510;
  const rootPt = { x: treeStartX, y: 290 };

  const nodesA = [
    {
      x: treeStartX + 120,
      y: 130,
      item: totalProbData.partitions[0],
      color: MATH_COLORS.paramPrimary,
    },
    {
      x: treeStartX + 120,
      y: 290,
      item: totalProbData.partitions[1],
      color: MATH_COLORS.paramSecondary,
    },
    {
      x: treeStartX + 120,
      y: 450,
      item: totalProbData.partitions[2],
      color: MATH_COLORS.paramTertiary,
    },
  ];

  const nodeB = { x: treeStartX + 260, y: 290 };

  return (
    <g>
      <text
        x={startX}
        y={startY - 16}
        fontSize={fontScale(17)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
      >
        1. 完备划分与加权面积图 (Treemap)
      </text>

      <rect
        x={startX}
        y={startY}
        width={leftWidth}
        height={treemapHeight}
        rx={8}
        fill={MATH_COLORS.white}
        stroke={MATH_COLORS.axis}
        strokeWidth={2}
      />

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
        fill={withAlpha(MATH_COLORS.paramPrimary, 0.45)}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2}
      />

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
        fill={withAlpha(MATH_COLORS.paramSecondary, 0.45)}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={2}
      />

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
        fill={withAlpha(MATH_COLORS.paramTertiary, 0.45)}
        stroke={MATH_COLORS.paramTertiary}
        strokeWidth={2}
      />

      <text
        x={startX + w1 / 2}
        y={startY + 24}
        fontSize={fontScale(14)}
        fontWeight="bold"
        fill={MATH_COLORS.paramPrimary}
        textAnchor="middle"
      >
        A₁ ({totalProbData.partitions[0].pAi.toFixed(2)})
      </text>
      <text
        x={startX + w1 + w2 / 2}
        y={startY + 24}
        fontSize={fontScale(14)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="middle"
      >
        A₂ ({totalProbData.partitions[1].pAi.toFixed(2)})
      </text>

      {w3 > 15 && (
        <text
          x={startX + w1 + w2 + w3 / 2}
          y={startY + 24}
          fontSize={fontScale(14)}
          fontWeight="bold"
          fill={MATH_COLORS.paramTertiary}
          textAnchor="middle"
        >
          A₃ ({totalProbData.partitions[2].pAi.toFixed(2)})
        </text>
      )}

      <text
        x={startX + leftWidth / 2}
        y={startY + treemapHeight - 20}
        fontSize={fontScale(16)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
        textAnchor="middle"
      >
        ★ 结果 B 区域 (总阴影面积 P(B) = {totalProbData.pB.toFixed(3)})
      </text>

      <text
        x={treeStartX - 10}
        y={startY - 16}
        fontSize={fontScale(17)}
        fontWeight="bold"
        fill={MATH_COLORS.labelText}
      >
        2. 分枝树状图与管道汇流
      </text>

      <circle
        cx={rootPt.x}
        cy={rootPt.y}
        r={16}
        fill={MATH_COLORS.labelTextLight}
      />
      <text
        x={rootPt.x}
        y={rootPt.y + 5}
        fontSize={fontScale(13)}
        fill={MATH_COLORS.white}
        textAnchor="middle"
        fontWeight="bold"
      >
        Ω
      </text>

      {nodesA.map((nA, i) => (
        <g key={i}>
          <line
            x1={rootPt.x}
            y1={rootPt.y}
            x2={nA.x}
            y2={nA.y}
            stroke={nA.color}
            strokeWidth={Math.max(1.5, nA.item.pAi * 8)}
          />
          <rect
            x={(rootPt.x + nA.x) / 2 - 24}
            y={(rootPt.y + nA.y) / 2 - 12}
            width={48}
            height={20}
            rx={4}
            fill={MATH_COLORS.white}
            stroke={nA.color}
          />
          <text
            x={(rootPt.x + nA.x) / 2}
            y={(rootPt.y + nA.y) / 2 + 3}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={nA.color}
            textAnchor="middle"
          >
            {nA.item.pAi.toFixed(2)}
          </text>

          <circle cx={nA.x} cy={nA.y} r={22} fill={nA.color} />
          <text
            x={nA.x}
            y={nA.y + 5}
            fontSize={fontScale(13)}
            fill={MATH_COLORS.white}
            textAnchor="middle"
            fontWeight="bold"
          >
            {nA.item.name.replace("划分 ", "")}
          </text>

          <line
            x1={nA.x}
            y1={nA.y}
            x2={nodeB.x}
            y2={nodeB.y}
            stroke={nA.color}
            strokeWidth={Math.max(1, nA.item.pJoint * 12)}
            strokeDasharray="6 3"
          />
          <text
            x={(nA.x + nodeB.x) / 2 + 6}
            y={(nA.y + nodeB.y) / 2 + (i === 0 ? -6 : i === 2 ? 14 : 0)}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fill={nA.color}
          >
            P(B|{nA.item.name.replace("划分 ", "")})=
            {nA.item.pB_given_Ai.toFixed(2)}
          </text>
        </g>
      ))}

      <circle cx={nodeB.x} cy={nodeB.y} r={26} fill={MATH_COLORS.function} />
      <text
        x={nodeB.x}
        y={nodeB.y + 6}
        fontSize={fontScale(16)}
        fill={MATH_COLORS.white}
        textAnchor="middle"
        fontWeight="bold"
      >
        B
      </text>

      <g transform="translate(60, 535)">
        <rect
          x={0}
          y={0}
          width={720}
          height={55}
          rx={10}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.grid}
          strokeWidth={1.5}
          className="shadow-sm"
        />
        <text
          x={20}
          y={33}
          fontSize={fontScale(14)}
          fill={MATH_COLORS.labelTextLight}
        >
          <tspan fontWeight="bold">全概率路径汇加：</tspan>
          <tspan fill={MATH_COLORS.function} fontWeight="bold">
            {" "}
            P(B){" "}
          </tspan>
          = {totalProbData.partitions[0].pAi.toFixed(2)}×
          {totalProbData.partitions[0].pB_given_Ai.toFixed(2)} +{" "}
          {totalProbData.partitions[1].pAi.toFixed(2)}×
          {totalProbData.partitions[1].pB_given_Ai.toFixed(2)} +{" "}
          {totalProbData.partitions[2].pAi.toFixed(2)}×
          {totalProbData.partitions[2].pB_given_Ai.toFixed(2)} ={" "}
          <tspan
            fill={MATH_COLORS.function}
            fontWeight="bold"
            fontSize={fontScale(16)}
          >
            {totalProbData.pB.toFixed(4)}
          </tspan>
        </text>
      </g>
    </g>
  );
}
