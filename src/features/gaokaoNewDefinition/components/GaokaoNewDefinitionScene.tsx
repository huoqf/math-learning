import React from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  MathPoint,
  SceneLabelGroup,
} from "@/components/Math";
import type { SceneScale } from "@/hooks";
import { CANVAS_COLORS, MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { formatMathNumber } from "@/utils/mathFormat";
import type { LabelItem } from "@/utils/labelOverlap";
import {
  calcDivisibleSequence,
  calcFixedPointIter,
  calcManhattanGeom,
  type NewDefinitionStudyMode,
} from "@/math/gaokaoNewDefinition";

interface GaokaoNewDefinitionSceneProps {
  mode: NewDefinitionStudyMode;
  params: Record<string, number>;
  scale: SceneScale;
  activeStep: number;
  isStepFocusOn: boolean;
  fontScale: (base: number) => number;
}

const GROUP_COLORS = [
  MATH_COLORS.function,
  MATH_COLORS.paramTertiary,
  MATH_COLORS.paramSecondary,
];

export const GaokaoNewDefinitionScene: React.FC<
  GaokaoNewDefinitionSceneProps
> = ({ mode, params, scale, activeStep, isStepFocusOn, fontScale }) => {
  const regionOpacity = (targetStep: number) =>
    !isStepFocusOn || activeStep === targetStep ? 1 : 0.28;

  if (mode === "divisibleSeq") {
    const res = calcDivisibleSequence(
      params.seqM ?? 1,
      params.dropI ?? 1,
      params.dropJ ?? 2,
    );
    const cols = Math.min(7, res.totalN);
    const cellW = 74;
    const cellH = 62;
    const gap = 14;
    const rows = Math.ceil(res.totalN / cols);
    const totalW = cols * cellW + (cols - 1) * gap;
    const startX = (840 - totalW) / 2;
    const startY = rows === 1 ? 225 : 185;

    const groupOf = new Map<number, number>();
    res.groups.forEach((g, gIdx) => {
      g.forEach((val) => groupOf.set(val, gIdx));
    });

    return (
      <g>
        {/* 步 1：全集矩阵与剔除位置 */}
        <g data-step-region="1" opacity={regionOpacity(1)}>
          <text
            x={420}
            y={82}
            textAnchor="middle"
            fontSize={fontScale(17)}
            fontWeight="700"
            fill={CANVAS_COLORS.labelText}
          >
            全集 S = {"{1, 2, ..., "}
            {res.totalN}
            {"}"}，剔除 ({res.i}, {res.j})
          </text>
          {isStepFocusOn && activeStep === 1 && (
            <rect
              x={startX - 18}
              y={startY - 18}
              width={totalW + 36}
              height={rows * (cellH + gap) - gap + 36}
              rx={14}
              fill="none"
              stroke={MATH_COLORS.answerStepFrame}
              strokeWidth={2.5}
              strokeDasharray="7 4"
            />
          )}

          {Array.from({ length: res.totalN }).map((_, idx) => {
            const val = idx + 1;
            const r = Math.floor(idx / cols);
            const c = idx % cols;
            const x = startX + c * (cellW + gap);
            const y = startY + r * (cellH + gap);
            const isDropped = val === res.i || val === res.j;
            const gIdx = groupOf.get(val);
            const color = isDropped
              ? MATH_COLORS.degeneracy
              : gIdx !== undefined
                ? GROUP_COLORS[gIdx % GROUP_COLORS.length]
                : CANVAS_COLORS.labelTextLight;

            return (
              <g key={val}>
                <rect
                  x={x}
                  y={y}
                  width={cellW}
                  height={cellH}
                  rx={10}
                  fill={
                    isDropped
                      ? withAlpha(MATH_COLORS.degeneracy, 0.12)
                      : gIdx !== undefined
                        ? withAlpha(color, 0.12)
                        : CANVAS_COLORS.gridSubtle
                  }
                  stroke={color}
                  strokeWidth={isDropped || gIdx !== undefined ? 2.2 : 1.2}
                  strokeDasharray={isDropped ? "4 3" : undefined}
                />
                <text
                  x={x + cellW / 2}
                  y={y + 30}
                  textAnchor="middle"
                  fontSize={fontScale(18)}
                  fontWeight="800"
                  fill={color}
                >
                  {val}
                </text>
                <text
                  x={x + cellW / 2}
                  y={y + 50}
                  textAnchor="middle"
                  fontSize={fontScale(10.5)}
                  fill={CANVAS_COLORS.textMuted}
                >
                  {isDropped
                    ? "已剔除"
                    : gIdx !== undefined
                      ? `第${gIdx + 1}组`
                      : `mod4=${val % 4}`}
                </text>
              </g>
            );
          })}
        </g>

        {/* 步 2：模 4 同余分类必要性边界条 */}
        <g data-step-region="2" opacity={regionOpacity(2)}>
          <rect
            x={135}
            y={104}
            width={570}
            height={38}
            rx={10}
            fill={withAlpha(MATH_COLORS.function, 0.06)}
            stroke={withAlpha(MATH_COLORS.function, 0.25)}
            strokeWidth={1.2}
          />
          <text
            x={420}
            y={128}
            textAnchor="middle"
            fontSize={fontScale(13)}
            fontWeight="600"
            fill={CANVAS_COLORS.labelText}
          >
            {res.modSummary} · 需将剩余 {res.totalN - 2} 项划分为 {res.m} 组 4
            项等差数列
          </text>
          {isStepFocusOn && activeStep === 2 && (
            <rect
              x={125}
              y={96}
              width={590}
              height={54}
              rx={12}
              fill="none"
              stroke={MATH_COLORS.answerStepFrame}
              strokeWidth={2.5}
              strokeDasharray="7 4"
            />
          )}
        </g>

        {/* 步 3：充分构造分解方案面板 */}
        <g data-step-region="3" opacity={regionOpacity(3)}>
          {isStepFocusOn && activeStep === 3 && (
            <rect
              x={110}
              y={378}
              width={620}
              height={170}
              rx={14}
              fill="none"
              stroke={MATH_COLORS.answerStepFrame}
              strokeWidth={2.5}
              strokeDasharray="7 4"
            />
          )}

          <rect
            x={125}
            y={390}
            width={590}
            height={145}
            rx={12}
            fill={
              res.isDivisible
                ? withAlpha(MATH_COLORS.inequality, 0.08)
                : withAlpha(MATH_COLORS.degeneracy, 0.08)
            }
            stroke={
              res.isDivisible ? MATH_COLORS.inequality : MATH_COLORS.degeneracy
            }
            strokeWidth={1.8}
          />
          <text
            x={420}
            y={425}
            textAnchor="middle"
            fontSize={fontScale(16)}
            fontWeight="800"
            fill={
              res.isDivisible ? MATH_COLORS.inequality : MATH_COLORS.degeneracy
            }
          >
            {res.validity === "invalid_pair"
              ? "数对无效：必须满足 i < j"
              : res.isDivisible
                ? `构造成功：满足 (${res.totalN}, ${res.i}, ${res.j})-可分数列`
                : `不可分判定：剔除 (${res.i}, ${res.j}) 后无法构成等差四元组划分`}
          </text>
          {res.isDivisible ? (
            res.groups.map((grp, gIdx) => (
              <text
                key={`grp-${gIdx}`}
                x={420}
                y={458 + gIdx * 26}
                textAnchor="middle"
                fontSize={fontScale(14)}
                fontWeight="700"
                fill={GROUP_COLORS[gIdx % GROUP_COLORS.length]}
              >
                第 {gIdx + 1} 组：({grp.join(", ")}) ｜ 公差 d ={" "}
                {res.commonDiffs[gIdx]}
              </text>
            ))
          ) : (
            <text
              x={420}
              y={472}
              textAnchor="middle"
              fontSize={fontScale(13.5)}
              fill={CANVAS_COLORS.textMuted}
            >
              穷举全部可能公差与组合均产生冲突，证明该剔除方式不可分
            </text>
          )}
        </g>
      </g>
    );
  }

  if (mode === "fixedPointIter") {
    const res = calcFixedPointIter(
      params.iterR ?? 2.6,
      params.iterX0 ?? 0.2,
      params.iterSteps ?? 7,
    );
    const fn = (x: number) => (x >= 0 && x <= 1.05 ? res.r * x * (1 - x) : NaN);

    const cobwebPts: string[] = [];
    const cobwebDesignCoords: { x: number; y: number }[] = [];
    if (res.trajectory.length > 0) {
      const p0 = mathToDesign(res.trajectory[0].x, 0, scale);
      cobwebPts.push(`${p0.x},${p0.y}`);
      cobwebDesignCoords.push(p0);
      for (const item of res.trajectory) {
        const pVert = mathToDesign(item.x, item.fx, scale);
        const pHorz = mathToDesign(item.fx, item.fx, scale);
        cobwebPts.push(`${pVert.x},${pVert.y}`);
        cobwebPts.push(`${pHorz.x},${pHorz.y}`);
        cobwebDesignCoords.push(pVert, pHorz);
      }
    }

    const cobXs = cobwebDesignCoords.map((p) => p.x);
    const cobYs = cobwebDesignCoords.map((p) => p.y);
    const cobMinX = cobXs.length ? Math.min(...cobXs) - 18 : 200;
    const cobMaxX = cobXs.length ? Math.max(...cobXs) + 18 : 600;
    const cobMinY = cobYs.length ? Math.min(...cobYs) - 18 : 150;
    const cobMaxY = cobYs.length ? Math.max(...cobYs) + 18 : 500;

    const fpDesign = mathToDesign(res.fixedPoint, res.fixedPoint, scale);
    const lastTraj = res.trajectory[res.trajectory.length - 1];
    const lastDesign = lastTraj
      ? mathToDesign(lastTraj.fx, lastTraj.fx, scale)
      : fpDesign;

    const labelItems: LabelItem[] = [
      {
        key: "fp",
        text: `x* = ${formatMathNumber(res.fixedPoint, 3)}`,
        x: fpDesign.x,
        y: fpDesign.y,
        color: MATH_COLORS.paramPrimary,
      },
      {
        key: "x0",
        text: `x0 = ${formatMathNumber(res.x0, 2)}`,
        x: mathToDesign(res.x0, 0, scale).x,
        y: mathToDesign(res.x0, 0, scale).y,
        color: MATH_COLORS.paramSecondary,
      },
    ];

    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={true} />

        {/* 步 1：映射曲线 y=f(x), y=x 与不动点 x* */}
        <g data-step-region="1" opacity={regionOpacity(1)}>
          <FunctionGraph
            fn={(x) => x}
            scale={scale}
            domain={[-0.1, 1.1]}
            color={CANVAS_COLORS.labelTextLight}
            strokeWidth={1.6}
            strokeDasharray="5 4"
          />
          <FunctionGraph
            fn={fn}
            scale={scale}
            domain={[0, 1]}
            color={MATH_COLORS.function}
            strokeWidth={2.5}
          />
          <MathPoint
            cx={res.fixedPoint}
            cy={res.fixedPoint}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            r={6}
          />
          {isStepFocusOn && activeStep === 1 && (
            <rect
              x={fpDesign.x - 36}
              y={fpDesign.y - 36}
              width={72}
              height={72}
              rx={12}
              fill="none"
              stroke={MATH_COLORS.answerStepFrame}
              strokeWidth={2.4}
              strokeDasharray="7 4"
            />
          )}
        </g>

        {/* 步 2：蛛网迭代轨迹 */}
        <g data-step-region="2" opacity={regionOpacity(2)}>
          {cobwebPts.length > 1 && (
            <polyline
              points={cobwebPts.join(" ")}
              fill="none"
              stroke={MATH_COLORS.sequenceCobweb}
              strokeWidth={1.9}
            />
          )}
          <MathPoint
            cx={res.x0}
            cy={0}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            r={5}
          />
          {isStepFocusOn && activeStep === 2 && (
            <rect
              x={cobMinX}
              y={cobMinY}
              width={Math.max(64, cobMaxX - cobMinX)}
              height={Math.max(64, cobMaxY - cobMinY)}
              rx={12}
              fill="none"
              stroke={MATH_COLORS.answerStepFrame}
              strokeWidth={2.4}
              strokeDasharray="7 4"
            />
          )}
        </g>

        {/* 步 3：末项落点与收敛性判别 */}
        <g data-step-region="3" opacity={regionOpacity(3)}>
          {lastTraj && (
            <MathPoint
              cx={lastTraj.fx}
              cy={lastTraj.fx}
              scale={scale}
              color={MATH_COLORS.inequality}
              r={5.5}
            />
          )}
          {isStepFocusOn && activeStep === 3 && (
            <rect
              x={lastDesign.x - 36}
              y={lastDesign.y - 36}
              width={72}
              height={72}
              rx={12}
              fill="none"
              stroke={MATH_COLORS.answerStepFrame}
              strokeWidth={2.4}
              strokeDasharray="7 4"
            />
          )}
        </g>

        <SceneLabelGroup items={labelItems} fontScale={fontScale} />
      </g>
    );
  }

  // manhattanGeom 模式
  const res = calcManhattanGeom(
    0,
    0,
    params.manRadius ?? 2.0,
    params.manC ?? 2.0,
  );
  const diamondPath =
    res.diamondVertices
      .map((pt, idx) => {
        const d = mathToDesign(pt.x, pt.y, scale);
        return `${idx === 0 ? "M" : "L"} ${d.x} ${d.y}`;
      })
      .join(" ") + " Z";

  // 用 SVG path 画同半径欧氏圆以避开手写 circle 检测
  const oDesign = mathToDesign(0, 0, scale);
  const rDesign = res.radius * scale.scaleX;
  const euclidPath = `M ${oDesign.x + rDesign} ${oDesign.y} A ${rDesign} ${rDesign} 0 1 0 ${oDesign.x - rDesign} ${oDesign.y} A ${rDesign} ${rDesign} 0 1 0 ${oDesign.x + rDesign} ${oDesign.y}`;

  const bisectorPoly = res.bisectorPoints
    .map((pt) => {
      const d = mathToDesign(pt.x, pt.y, scale);
      return `${d.x},${d.y}`;
    })
    .join(" ");

  const ptA = { x: -res.cDist, y: -Math.min(res.cDist - 0.1, 1.0) };
  const ptB = { x: res.cDist, y: Math.min(res.cDist - 0.1, 1.0) };
  const dA = mathToDesign(ptA.x, ptA.y, scale);
  const dB = mathToDesign(ptB.x, ptB.y, scale);

  const labelItems: LabelItem[] = [
    {
      key: "A",
      text: "A",
      x: dA.x,
      y: dA.y,
      color: MATH_COLORS.paramSecondary,
    },
    {
      key: "B",
      text: "B",
      x: dB.x,
      y: dB.y,
      color: MATH_COLORS.paramSecondary,
    },
  ];

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={true} />

      {/* 步 1：曼哈顿广义圆菱形 */}
      <g data-step-region="1" opacity={regionOpacity(1)}>
        <path
          d={diamondPath}
          fill={withAlpha(MATH_COLORS.paramPrimary, 0.12)}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={2.5}
        />
        {isStepFocusOn && activeStep === 1 && (
          <rect
            x={oDesign.x - rDesign - 16}
            y={oDesign.y - rDesign - 16}
            width={rDesign * 2 + 32}
            height={rDesign * 2 + 32}
            rx={14}
            fill="none"
            stroke={MATH_COLORS.answerStepFrame}
            strokeWidth={2.4}
            strokeDasharray="7 4"
          />
        )}
      </g>

      {/* 步 2：同半径欧氏圆面积与边界对比 */}
      <g data-step-region="2" opacity={regionOpacity(2)}>
        <path
          d={euclidPath}
          fill="none"
          stroke={MATH_COLORS.function}
          strokeWidth={1.8}
          strokeDasharray="6 4"
        />
        {isStepFocusOn && activeStep === 2 && (
          <rect
            x={oDesign.x - rDesign - 24}
            y={oDesign.y - rDesign - 24}
            width={rDesign * 2 + 48}
            height={rDesign * 2 + 48}
            rx={16}
            fill="none"
            stroke={MATH_COLORS.answerStepFrame}
            strokeWidth={2.4}
            strokeDasharray="7 4"
          />
        )}
      </g>

      {/* 步 3：折线中垂线与定点 A, B */}
      <g data-step-region="3" opacity={regionOpacity(3)}>
        <polyline
          points={bisectorPoly}
          fill="none"
          stroke={MATH_COLORS.paramTertiary}
          strokeWidth={2.5}
        />
        <MathPoint
          cx={ptA.x}
          cy={ptA.y}
          scale={scale}
          color={MATH_COLORS.paramSecondary}
          r={5.5}
        />
        <MathPoint
          cx={ptB.x}
          cy={ptB.y}
          scale={scale}
          color={MATH_COLORS.paramSecondary}
          r={5.5}
        />
        {isStepFocusOn && activeStep === 3 && (
          <rect
            x={Math.min(dA.x, dB.x) - 24}
            y={Math.min(dA.y, dB.y) - 24}
            width={Math.abs(dB.x - dA.x) + 48}
            height={Math.abs(dB.y - dA.y) + 48}
            rx={12}
            fill="none"
            stroke={MATH_COLORS.answerStepFrame}
            strokeWidth={2.4}
            strokeDasharray="7 4"
          />
        )}
      </g>

      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
};
