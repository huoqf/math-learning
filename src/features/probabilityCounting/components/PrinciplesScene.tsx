import { useMemo } from "react";
import { MATH_COLORS } from "../../../theme";
import {
  buildMultiplicationTree,
  buildAdditionTree,
} from "../../../math/probabilityCounting";
import type { SceneCommonProps } from "./types";

export function PrinciplesScene({
  params,
  subMode = 0,
  fontScale = (v) => v,
}: SceneCommonProps) {
  const m1 = Math.floor(params.m1 ?? 3);
  const m2 = Math.floor(params.m2 ?? 2);
  const m3 = Math.floor(params.m3 ?? 2);

  const isMultiplication = subMode === 0;

  const multTree = useMemo(() => {
    return buildMultiplicationTree(m1, m2, m3);
  }, [m1, m2, m3]);

  const addTree = useMemo(() => {
    return buildAdditionTree(m1, m2);
  }, [m1, m2]);

  const tree = isMultiplication ? multTree : addTree;

  return (
    <g transform="translate(40, 25)">
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
}
