/**
 * src/features/sequence/components/SequenceGeometricTessellationScene.tsx
 * 等比模型 - 专题 E: 正方形自相似无限剖分 (无字证明)
 */
import { MATH_COLORS, withAlpha } from "@/theme";
import type { ViewportInfo } from "@/hooks";
import { toSub } from "./SequenceText";
import { useSequenceParams } from "./useSequenceData";

interface SequenceGeometricTessellationSceneProps {
  params: Record<string, number>;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
}

export function SequenceGeometricTessellationScene({
  params,
  vp,
  fontScale,
}: SequenceGeometricTessellationSceneProps) {
  const { a1, q, N, geoData } = useSequenceParams(params);
  const { terms } = geoData;

  const isValidTess = a1 > 0 && q > 0 && q < 1;
  // toSub using top-level helper

  if (!isValidTess) {
    return (
      <g className="sequence-scene-tessellation-invalid">
        <rect
          x={vp.centerX - 240}
          y={vp.centerY - 90}
          width={480}
          height={180}
          rx={12}
          fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={1.5}
          strokeDasharray="5,4"
        />
        <text
          x={vp.centerX}
          y={vp.centerY - 35}
          textAnchor="middle"
          fontSize={fontScale(14)}
          fill={MATH_COLORS.paramPrimary}
          fontWeight="bold"
        >
          ⚠️ 自相似几何面积剖分前提条件
        </text>
        <text
          x={vp.centerX}
          y={vp.centerY + 5}
          textAnchor="middle"
          fontSize={fontScale(11)}
          fill={MATH_COLORS.labelText}
        >
          无字证明面积细分要求：首项 a₁ &gt; 0 且公比 0 &lt; q &lt; 1
        </text>
        <text
          x={vp.centerX}
          y={vp.centerY + 40}
          textAnchor="middle"
          fontSize={fontScale(11)}
          fill={MATH_COLORS.sequenceHighlight}
          fontWeight="bold"
        >
          当前参数：a₁ = {a1}, q = {q} （请在左屏调节公比至 0~1 区间）
        </text>
      </g>
    );
  }

  const size = 350;
  const x0 = vp.centerX - size / 2;
  const y0 = vp.centerY - size / 2 - 5;

  const getFracStr = (val: number): string => {
    if (Math.abs(val - 1 / 2) < 0.008) return "1/2";
    if (Math.abs(val - 1 / 3) < 0.008) return "1/3";
    if (Math.abs(val - 1 / 4) < 0.008) return "1/4";
    if (Math.abs(val - 2 / 3) < 0.008) return "2/3";
    if (Math.abs(val - 3 / 4) < 0.008) return "3/4";
    return val.toFixed(2);
  };

  const qFrac = getFracStr(q);
  const limitSumVal = a1 / (1 - q);
  const limitSumFormatted = Number.isInteger(
    Math.round(limitSumVal * 100) / 100,
  )
    ? String(Math.round(limitSumVal))
    : limitSumVal.toFixed(2);

  const tessBlocks: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    formulaLabel: string;
    percentText: string;
    val: number;
    color: string;
  }> = [];

  let curX = x0;
  let curY = y0;
  let curW = size;
  let curH = size;
  const palette = [
    MATH_COLORS.sequence,
    MATH_COLORS.sequenceSecondary,
    MATH_COLORS.sequenceSum,
    MATH_COLORS.sequenceHighlight,
    MATH_COLORS.inequality,
    MATH_COLORS.sequenceSecondary,
  ];

  let runningTerm = a1;
  const maxSteps = Math.min(N, 7);

  for (let k = 1; k <= maxSteps; k++) {
    const color = palette[(k - 1) % palette.length];
    const valStr = Number.isInteger(runningTerm)
      ? String(runningTerm)
      : runningTerm.toFixed(2);
    const percentStr = `${((1 - q) * Math.pow(q, k - 1) * 100).toFixed(1)}%`;

    let formulaLabel = `a${toSub(k)}`;
    if (k === 1) {
      formulaLabel = `a₁ = ${a1}`;
    } else if (k === 2) {
      formulaLabel = `a₂ = a₁·q = ${a1}·(${qFrac})`;
    } else if (k === 3) {
      formulaLabel = `a₃ = a₁·q² = ${a1}·(${qFrac})²`;
    } else if (k === 4) {
      formulaLabel = `a₄ = a₁·q³`;
    }

    if (k % 2 === 1) {
      // 垂直切（切出左侧矩形）
      const w = curW * (1 - q);
      tessBlocks.push({
        x: curX,
        y: curY,
        w,
        h: curH,
        label: `a${toSub(k)} = ${valStr}`,
        formulaLabel,
        percentText: percentStr,
        val: runningTerm,
        color,
      });
      curX += w;
      curW -= w;
    } else {
      // 水平切（切出上方矩形）
      const h = curH * (1 - q);
      tessBlocks.push({
        x: curX,
        y: curY,
        w: curW,
        h,
        label: `a${toSub(k)} = ${valStr}`,
        formulaLabel,
        percentText: percentStr,
        val: runningTerm,
        color,
      });
      curY += h;
      curH -= h;
    }
    runningTerm *= q;
  }

  const remainSum = limitSumVal - (terms[maxSteps - 1]?.Sn ?? 0);

  return (
    <g className="sequence-scene-tessellation">
      {/* 顶部标题：准确的代数推导等式，绝非单调数字 */}
      <text
        x={vp.centerX}
        y={y0 - 24}
        textAnchor="middle"
        fontSize={fontScale(12.5)}
        fill={MATH_COLORS.sequenceHighlight}
        fontWeight="bold"
      >
        正方形总面积 S∞ = a₁ / (1 - q) = {a1} / (1 - {qFrac}) ={" "}
        {limitSumFormatted}
      </text>

      {/* 正方形外框 */}
      <rect
        x={x0}
        y={y0}
        width={size}
        height={size}
        fill={MATH_COLORS.white}
        stroke={MATH_COLORS.labelText}
        strokeWidth={2}
        rx={4}
      />

      {/* 各级自相似剖分矩形 */}
      {tessBlocks.map((b, idx) => (
        <g key={`tess-${idx}`}>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            fill={withAlpha(b.color, 0.26)}
            stroke={b.color}
            strokeWidth={1.5}
          />

          {/* 块内结构公式与数值标注 */}
          {b.w > 40 && b.h > 24 && (
            <text
              x={b.x + b.w / 2}
              y={b.y + b.h / 2 - (b.h > 45 ? 5 : 0)}
              textAnchor="middle"
              fontSize={fontScale(Math.min(10.5, b.w / 7.5))}
              fill={b.color}
              fontWeight="bold"
            >
              {b.w > 80 ? b.formulaLabel : b.label}
            </text>
          )}

          {/* 几何面积占比百分比 */}
          {b.w > 55 && b.h > 45 && (
            <text
              x={b.x + b.w / 2}
              y={b.y + b.h / 2 + 13}
              textAnchor="middle"
              fontSize={fontScale(8.5)}
              fill={b.color}
              opacity={0.85}
            >
              (占总面积 {b.percentText})
            </text>
          )}
        </g>
      ))}

      {/* 剩余未切分小方块 (无穷级数尾项收敛区) */}
      {curW > 4 && curH > 4 && (
        <g className="remain-tail-block">
          <rect
            x={curX}
            y={curY}
            width={curW}
            height={curH}
            fill={withAlpha(MATH_COLORS.labelText, 0.08)}
            stroke={MATH_COLORS.labelText}
            strokeWidth={1}
            strokeDasharray="2,2"
          />
          {curW > 35 && curH > 20 && (
            <text
              x={curX + curW / 2}
              y={curY + curH / 2 + 3}
              textAnchor="middle"
              fontSize={fontScale(8)}
              fill={MATH_COLORS.labelText}
            >
              余尾={remainSum.toFixed(2)}
            </text>
          )}
        </g>
      )}
    </g>
  );
}
