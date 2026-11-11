/**
 * src/features/sequence/components/SequenceTruncatedBar.tsx
 * 数列超出线性量程时的显式断轴与锯齿截断柱通用组件（消除无标记硬截断等高假象）
 */
import { MATH_COLORS, withAlpha } from "@/theme";

interface AxisBreakBannerProps {
  xStart: number;
  xEnd: number;
  y: number;
  direction: "top" | "bottom";
  label: string;
  fontScale: (size: number) => number;
}

/** 横贯绘图区的显式锯齿断轴警示线 */
export function AxisBreakBanner({
  xStart,
  xEnd,
  y,
  direction,
  label,
  fontScale,
}: AxisBreakBannerProps) {
  const safeStart = Math.max(12, xStart);
  const safeEnd = Math.min(828, xEnd);
  const mid = (safeStart + safeEnd) / 2;

  // 在中央位置画一小段锯齿断轴波纹，其余为虚线边界
  const zigHalfW = 14;
  const amp = 4;
  const zigPath = [
    `M ${safeStart} ${y}`,
    `L ${mid - zigHalfW} ${y}`,
    `L ${mid - zigHalfW / 2} ${y - amp}`,
    `L ${mid} ${y + amp}`,
    `L ${mid + zigHalfW / 2} ${y - amp}`,
    `L ${mid + zigHalfW} ${y}`,
    `L ${safeEnd} ${y}`,
  ].join(" ");

  const badgeY = direction === "top" ? y - 10 : y + 14;

  return (
    <g
      className="axis-break-banner"
      data-axis-break={direction}
      aria-label={label}
    >
      <path
        d={zigPath}
        fill="none"
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={1.4}
        strokeDasharray="5 3"
        opacity={0.85}
      />
      <text
        x={safeStart}
        y={badgeY}
        textAnchor="start"
        fontSize={fontScale(8.5)}
        fill={MATH_COLORS.paramSecondary}
        fontWeight="bold"
      >
        {label}
      </text>
    </g>
  );
}

interface SequenceTruncatedBarProps {
  x: number;
  width: number;
  zeroY: number;
  rawTopY: number;
  plotTopY: number;
  plotBotY: number;
  /** 实际数学绝对值，用于在多根柱子同时超限时维持温和阶梯高度差，禁止等高 */
  absValue: number;
  /** 线性截断临界绝对值（用于算对数递增台阶） */
  capThreshold?: number;
  color: string;
  fillAlpha?: number;
  strokeWidth?: number;
  rx?: number;
  /** 返回渲染后的顶部与底部边界，供柱顶标签定位 */
  children?: (layout: {
    topY: number;
    botY: number;
    truncated: boolean;
  }) => React.ReactNode;
}

/**
 * 渲染支持显式锯齿断口的数列柱体：
 * - 未超界：普通圆角矩形；
 * - 超出 plotTopY / plotBotY：截断在安全边界内，按对数残差保持微小递增阶梯高度差，
 *   并在截断端绘制波浪锯齿与虚线延展帽（data-bar-truncated="true"）。
 */
export function SequenceTruncatedBar({
  x,
  width,
  zeroY,
  rawTopY,
  plotTopY,
  plotBotY,
  absValue,
  capThreshold = 100,
  color,
  fillAlpha = 0.35,
  strokeWidth = 1.5,
  rx = 3,
  children,
}: SequenceTruncatedBarProps) {
  const isPositiveDir = rawTopY <= zeroY;
  const safeZeroY = Math.min(plotBotY, Math.max(plotTopY, zeroY));

  const isTopOverflow = isPositiveDir && rawTopY < plotTopY + 18;
  const isBotOverflow = !isPositiveDir && rawTopY > plotBotY - 18;
  const truncated = isTopOverflow || isBotOverflow;

  // 若多根柱体同时超界，利用超限倍率对数差生成 0~16px 阶梯增量，保证严格保持单调大小视觉秩序
  const safeRatio = Math.max(1, absValue / Math.max(1, capThreshold));
  const stepBoostPx = truncated ? Math.min(16, Math.log2(safeRatio) * 3.8) : 0;

  let topY: number;
  let botY: number;

  if (!truncated) {
    topY = Math.min(rawTopY, safeZeroY);
    botY = Math.max(rawTopY, safeZeroY);
  } else if (isTopOverflow) {
    // 为顶部保留至少 18px 阶梯空间 + 柱顶标签空间
    const baseCapTop = plotTopY + 18;
    topY = Math.max(plotTopY + 2, baseCapTop - stepBoostPx);
    botY = Math.max(topY + 6, safeZeroY);
  } else {
    const baseCapBot = plotBotY - 18;
    topY = Math.min(baseCapBot - 6, safeZeroY);
    botY = Math.min(plotBotY - 2, baseCapBot + stepBoostPx);
  }

  const height = Math.max(2, botY - topY);

  // 锯齿断口折线路径（放在靠近超界一端内侧 8px 处）
  const breakY = isTopOverflow ? topY + 7 : botY - 7;
  const zigPath = [
    `M ${x} ${breakY}`,
    `L ${x + width * 0.25} ${breakY - 3}`,
    `L ${x + width * 0.5} ${breakY + 3}`,
    `L ${x + width * 0.75} ${breakY - 3}`,
    `L ${x + width} ${breakY}`,
  ].join(" ");

  return (
    <g data-bar-truncated={truncated ? "true" : undefined}>
      <rect
        data-seq-bar="true"
        x={x}
        y={topY}
        width={width}
        height={height}
        fill={withAlpha(color, fillAlpha)}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={truncated ? "4 2" : undefined}
        rx={rx}
      />
      {truncated && (
        <g>
          {/* 白色遮罩带 + 锯齿波浪线，明确表达「柱身已折断截断」 */}
          <rect
            x={x + 1}
            y={breakY - 3.5}
            width={Math.max(1, width - 2)}
            height={7}
            fill={MATH_COLORS.white}
          />
          <path d={zigPath} fill="none" stroke={color} strokeWidth={1.6} />
        </g>
      )}
      {children?.({ topY, botY, truncated })}
    </g>
  );
}
