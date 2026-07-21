import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CoordinateGrid, InteractivePoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { VennOpType } from "@/math/set";
import { isPointInCircle } from "@/math/set";

interface SetSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  vennOp?: VennOpType;
  showLogic?: boolean;
}

export function SetScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  vennOp = "intersection",
  showLogic = false,
}: SetSceneProps) {
  const xA = params.xA ?? -1.2;
  const yA = params.yA ?? 0.0;
  const rA = Math.max(0, params.rA ?? 2.2);

  const xB = params.xB ?? 1.2;
  const yB = params.yB ?? 0.0;
  const rB = Math.max(0, params.rB ?? 2.2);

  const xP = params.xP ?? 0.0;
  const yP = params.yP ?? 0.0;

  // 数学坐标 -> 设计视图坐标映射
  const posA = mathToDesign(xA, yA, scale);
  const posB = mathToDesign(xB, yB, scale);

  // 设计空间半径计算（在真实坐标映射下的像素半径）
  const radiusAInPx = rA * scale.scaleX;
  const radiusBInPx = rB * scale.scaleX;

  // 点 P 的归属状态
  const inA = isPointInCircle({ x: xP, y: yP }, { x: xA, y: yA, r: rA });
  const inB = isPointInCircle({ x: xP, y: yP }, { x: xB, y: yB, r: rB });

  // 拖拽圆心 A
  const handleDragA = (mathPt: { x: number; y: number }) => {
    onParamChange("xA", Math.round(mathPt.x * 10) / 10);
    onParamChange("yA", Math.round(mathPt.y * 10) / 10);
  };

  // 拖拽圆心 B
  const handleDragB = (mathPt: { x: number; y: number }) => {
    onParamChange("xB", Math.round(mathPt.x * 10) / 10);
    onParamChange("yB", Math.round(mathPt.y * 10) / 10);
  };

  // 拖拽测试点 P
  const handleDragP = (mathPt: { x: number; y: number }) => {
    onParamChange("xP", Math.round(mathPt.x * 10) / 10);
    onParamChange("yP", Math.round(mathPt.y * 10) / 10);
  };

  // 标注避让：计算三个控制点标签的位置
  const placedLabels = React.useMemo(() => {
    const entries: LabelEntry[] = [
      {
        key: "O_A",
        text: "O_A",
        x: posA.x,
        y: posA.y,
        anchor: "middle",
        dy: -12,
      },
      {
        key: "O_B",
        text: "O_B",
        x: posB.x,
        y: posB.y,
        anchor: "middle",
        dy: -12,
      },
      {
        key: "P",
        text: `P(${xP.toFixed(1)}, ${yP.toFixed(1)})`,
        x: mathToDesign(xP, yP, scale).x,
        y: mathToDesign(xP, yP, scale).y,
        anchor: "middle",
        dy: -12,
      },
    ];
    return avoidLabels(entries, { fontScale });
  }, [xA, yA, xB, yB, xP, yP, scale, fontScale]);

  // SVG ClipPath ID 唯一标识
  const clipIdA = "clip-venn-circle-a";
  const clipIdB = "clip-venn-circle-b";

  return (
    <g>
      {/* 基础网格与坐标轴 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      <defs>
        <clipPath id={clipIdA}>
          <circle cx={posA.x} cy={posA.y} r={radiusAInPx} />
        </clipPath>
        <clipPath id={clipIdB}>
          <circle cx={posB.x} cy={posB.y} r={radiusBInPx} />
        </clipPath>
      </defs>

      {/* 全集 U 的全景指示虚线框 */}
      <rect
        x={scale.originX - 5.5 * scale.scaleX}
        y={scale.originY - 3.8 * scale.scaleY}
        width={11 * scale.scaleX}
        height={7.6 * scale.scaleY}
        fill="none"
        stroke={MATH_COLORS.labelText}
        strokeDasharray="6 4"
        strokeWidth={1.5}
        rx={12}
        opacity={0.35}
      />
      <text
        x={scale.originX - 5.3 * scale.scaleX}
        y={scale.originY - 3.3 * scale.scaleY}
        fill={MATH_COLORS.labelText}
        fontSize={fontScale(14)}
        fontWeight="bold"
      >
        全集 U
      </text>

      {/* --- Venn 运算阴影高亮层 --- */}

      {/* 1. 交集 A ∩ B */}
      {vennOp === "intersection" && (
        <g clipPath={`url(#${clipIdA})`}>
          <circle
            cx={posB.x}
            cy={posB.y}
            r={radiusBInPx}
            fill={withAlpha(MATH_COLORS.function, 0.4)}
            stroke="none"
          />
        </g>
      )}

      {/* 2. 并集 A ∪ B */}
      {vennOp === "union" && (
        <g>
          {rA > 0 && (
            <circle
              cx={posA.x}
              cy={posA.y}
              r={radiusAInPx}
              fill={withAlpha(MATH_COLORS.function, 0.3)}
            />
          )}
          {rB > 0 && (
            <circle
              cx={posB.x}
              cy={posB.y}
              r={radiusBInPx}
              fill={withAlpha(MATH_COLORS.function, 0.3)}
            />
          )}
        </g>
      )}

      {/* 3. A 的补集 ∁U A */}
      {vennOp === "complement_A" && (
        <g>
          {/* 全集底块 */}
          <rect
            x={scale.originX - 5.5 * scale.scaleX}
            y={scale.originY - 3.8 * scale.scaleY}
            width={11 * scale.scaleX}
            height={7.6 * scale.scaleY}
            fill={withAlpha(MATH_COLORS.function, 0.25)}
            rx={12}
          />
          {/* 用白色把 A 的区域盖住 */}
          {rA > 0 && (
            <circle cx={posA.x} cy={posA.y} r={radiusAInPx} fill="#FFFFFF" />
          )}
        </g>
      )}

      {/* 4. 差集 A \ B (在 A 内且不在 B 内) */}
      {vennOp === "difference_A_B" && (
        <g>
          {rA > 0 && (
            <circle
              cx={posA.x}
              cy={posA.y}
              r={radiusAInPx}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.35)}
            />
          )}
          {rB > 0 && (
            <circle cx={posB.x} cy={posB.y} r={radiusBInPx} fill="#FFFFFF" />
          )}
        </g>
      )}

      {/* --- 集合 A 圆圈主体 --- */}
      {rA > 0 && (
        <g>
          <circle
            cx={posA.x}
            cy={posA.y}
            r={radiusAInPx}
            fill={
              vennOp === "intersection" || vennOp === "union"
                ? "none"
                : withAlpha(MATH_COLORS.paramPrimary, 0.05)
            }
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
          />
          <text
            x={posA.x - radiusAInPx * 0.6}
            y={posA.y - radiusAInPx * 0.6}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(16)}
            fontWeight="extrabold"
          >
            A
          </text>
        </g>
      )}

      {/* --- 集合 B 圆圈主体 --- */}
      {rB > 0 && (
        <g>
          <circle
            cx={posB.x}
            cy={posB.y}
            r={radiusBInPx}
            fill={
              vennOp === "intersection" || vennOp === "union"
                ? "none"
                : withAlpha(MATH_COLORS.paramSecondary, 0.05)
            }
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
          />
          <text
            x={posB.x + radiusBInPx * 0.6}
            y={posB.y - radiusBInPx * 0.6}
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(16)}
            fontWeight="extrabold"
          >
            B
          </text>
        </g>
      )}

      {/* 两圆心连线（展示距离 d） */}
      {rA > 0 && rB > 0 && (
        <line
          x1={posA.x}
          y1={posA.y}
          x2={posB.x}
          y2={posB.y}
          stroke={MATH_COLORS.labelText}
          strokeDasharray="4 4"
          strokeWidth={1}
          opacity={0.6}
        />
      )}

      {/* 拖拽控制点 1: 圆心 O_A */}
      <InteractivePoint
        cx={xA}
        cy={yA}
        scale={scale}
        vp={vp}
        onDrag={handleDragA}
        color={MATH_COLORS.paramPrimary}
        label="O_A"
        labelKey="O_A"
        placedLabels={placedLabels}
        fontScale={fontScale}
      />

      {/* 拖拽控制点 2: 圆心 O_B */}
      <InteractivePoint
        cx={xB}
        cy={yB}
        scale={scale}
        vp={vp}
        onDrag={handleDragB}
        color={MATH_COLORS.paramSecondary}
        label="O_B"
        labelKey="O_B"
        placedLabels={placedLabels}
        fontScale={fontScale}
      />

      {/* 拖拽控制点 3: 样本元素 P */}
      <InteractivePoint
        cx={xP}
        cy={yP}
        scale={scale}
        vp={vp}
        onDrag={handleDragP}
        color={
          inA && inB
            ? MATH_COLORS.function
            : inA
              ? MATH_COLORS.paramPrimary
              : inB
                ? MATH_COLORS.paramSecondary
                : MATH_COLORS.labelText
        }
        label={`P(${xP.toFixed(1)}, ${yP.toFixed(1)})`}
        labelKey="P"
        placedLabels={placedLabels}
        fontScale={fontScale}
      />

      {/* 逻辑判定提示浮标（当开启逻辑分析视图时） */}
      {showLogic && (
        <g
          transform={`translate(${scale.originX}, ${scale.originY + 3.8 * scale.scaleY})`}
        >
          <rect
            x={-180}
            y={-20}
            width={360}
            height={32}
            fill="#FFFFFF"
            stroke={MATH_COLORS.function}
            strokeWidth={1.5}
            rx={16}
          />
          <text
            x={0}
            y={2}
            textAnchor="middle"
            fill={MATH_COLORS.function}
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            {`元素 P: ${inA ? "P∈A" : "P∉A"}  且  ${inB ? "P∈B" : "P∉B"}`}
          </text>
        </g>
      )}
    </g>
  );
}
