import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MATH_COLORS, withAlpha } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";
import type { CurveSamplePoint } from "@/math3d/overlaySamplers";

export interface ParamCurveOverlay2DProps {
  title: string;
  xLabel: string;
  yLabel: string;
  samples: CurveSamplePoint[];
  currentX: number;
  currentY: number;
  optimalX?: number;
  optimalY?: number;
  optimalLabel?: string;
  position?: "bottom-left" | "bottom-right";
  defaultCollapsed?: boolean;
}

const fontScale = (size: number) => size;

/**
 * 立体几何动点与极值专题「一维目标函数变化曲线」可折叠 2D 浮窗。
 * 实时标示当前参数位置 (currentX, currentY) 与理论最值坐标，强化代数与 3D 空间双向绑定。
 */
export function ParamCurveOverlay2D({
  title,
  xLabel,
  yLabel,
  samples,
  currentX,
  currentY,
  optimalX,
  optimalY,
  optimalLabel,
  position = "bottom-left",
  defaultCollapsed = false,
}: ParamCurveOverlay2DProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const posClass =
    position === "bottom-right" ? "bottom-3 right-3" : "bottom-3 left-3";

  if (collapsed) {
    const cleanYLabel = yLabel.replace(/\(.*?\)/g, "").trim() || yLabel;
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className={`absolute ${posClass} z-10 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md transition-colors cursor-pointer`}
        style={{
          backgroundColor: withAlpha(MATH_COLORS.white, 0.92),
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: MATH_COLORS.axis,
          color: MATH_COLORS.primary,
        }}
      >
        <span>{`${cleanYLabel}(${xLabel}) = ${formatMathNumber(currentY)}`}</span>
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
    );
  }

  const width = 216;
  const height = 114;
  const padL = 32;
  const padR = 14;
  const padT = 14;
  const padB = 22;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const xs = samples.map((p) => p.x);
  const ys = samples.map((p) => p.y);
  const minX = xs.length > 0 ? Math.min(...xs) : 0;
  const maxX = xs.length > 0 ? Math.max(...xs) : 1;
  const rawMinY = ys.length > 0 ? Math.min(...ys) : 0;
  const rawMaxY = ys.length > 0 ? Math.max(...ys) : 1;
  const ySpanRaw = rawMaxY - rawMinY;
  const minY = ySpanRaw < 1e-5 ? rawMinY - 0.5 : rawMinY - ySpanRaw * 0.1;
  const maxY = ySpanRaw < 1e-5 ? rawMaxY + 0.5 : rawMaxY + ySpanRaw * 0.12;
  const xSpan = Math.max(1e-6, maxX - minX);
  const ySpan = Math.max(1e-6, maxY - minY);

  const toPx = (x: number) => padL + ((x - minX) / xSpan) * plotW;
  const toPy = (y: number) => padT + plotH - ((y - minY) / ySpan) * plotH;

  const pathD = samples
    .map(
      (pt, i) =>
        `${i === 0 ? "M" : "L"} ${toPx(pt.x).toFixed(1)} ${toPy(pt.y).toFixed(1)}`,
    )
    .join(" ");

  const curPx = toPx(Math.min(maxX, Math.max(minX, currentX)));
  const curPy = toPy(Math.min(maxY, Math.max(minY, currentY)));

  const hasOptimal =
    optimalX !== undefined &&
    optimalY !== undefined &&
    Number.isFinite(optimalX) &&
    Number.isFinite(optimalY);
  const optPx = hasOptimal ? toPx(optimalX) : 0;
  const optPy = hasOptimal ? toPy(optimalY) : 0;

  return (
    <div
      className={`absolute ${posClass} z-10 w-[236px] rounded-xl p-2.5 shadow-md backdrop-blur-md select-none`}
      style={{
        backgroundColor: withAlpha(MATH_COLORS.white, 0.93),
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: MATH_COLORS.axis,
      }}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span
          className="truncate text-[11px] font-semibold"
          style={{ color: MATH_COLORS.labelText }}
        >
          {title}
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-label="收起函数曲线浮窗"
          className="rounded p-0.5 transition-colors hover:bg-neutral-100 cursor-pointer"
          style={{ color: MATH_COLORS.textMuted }}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block"
        role="img"
        aria-label={title}
      >
        {/* 坐标轴 */}
        <line
          x1={padL}
          y1={padT}
          x2={padL}
          y2={padT + plotH}
          stroke={MATH_COLORS.line}
          strokeWidth={1}
        />
        <line
          x1={padL}
          y1={padT + plotH}
          x2={padL + plotW}
          y2={padT + plotH}
          stroke={MATH_COLORS.line}
          strokeWidth={1}
        />

        {/* 极值参考虚线 */}
        {hasOptimal && (
          <>
            <line
              x1={padL}
              y1={optPy}
              x2={padL + plotW}
              y2={optPy}
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={1}
              strokeDasharray="3 2"
            />
            <line
              x1={optPx}
              y1={optPy}
              x2={optPx}
              y2={padT + plotH}
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          </>
        )}

        {/* 目标函数连续曲线 */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={MATH_COLORS.primary}
            strokeWidth={2}
          />
        )}

        {/* 最值标记点 */}
        {hasOptimal && (
          <>
            <circle
              cx={optPx}
              cy={optPy}
              r={3.2}
              fill={MATH_COLORS.paramTertiary}
              stroke={MATH_COLORS.white}
              strokeWidth={1}
            />
            {optimalLabel && (
              <text
                x={Math.min(padL + plotW - 42, Math.max(padL + 2, optPx + 4))}
                y={Math.max(padT + 9, optPy - 5)}
                fontSize={fontScale(8.5)}
                fontWeight="600"
                fill={MATH_COLORS.paramTertiary}
              >
                {`${optimalLabel} ${formatMathNumber(optimalY!)}`}
              </text>
            )}
          </>
        )}

        {/* 当前动点十字定位与高亮圆点 */}
        <line
          x1={curPx}
          y1={curPy}
          x2={curPx}
          y2={padT + plotH}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={1}
          strokeDasharray="2 2"
        />
        <circle
          cx={curPx}
          cy={curPy}
          r={4}
          fill={MATH_COLORS.paramPrimary}
          stroke={MATH_COLORS.white}
          strokeWidth={1.3}
        />

        {/* 轴标签与实时读数 */}
        <text
          x={padL - 28}
          y={padT + 8}
          fontSize={fontScale(8.5)}
          fill={MATH_COLORS.textMuted}
        >
          {formatMathNumber(rawMaxY, 1)}
        </text>
        <text
          x={padL - 28}
          y={padT + plotH}
          fontSize={fontScale(8.5)}
          fill={MATH_COLORS.textMuted}
        >
          {formatMathNumber(rawMinY, 1)}
        </text>
        <text
          x={padL + plotW - 8}
          y={padT + plotH + 14}
          fontSize={fontScale(9)}
          fontWeight="600"
          fill={MATH_COLORS.textMuted}
        >
          {xLabel}
        </text>
        <text
          x={padL + 2}
          y={padT + plotH + 14}
          fontSize={fontScale(9)}
          fontWeight="600"
          fill={MATH_COLORS.paramPrimary}
        >
          {`${xLabel}=${formatMathNumber(currentX)}  ${yLabel}=${formatMathNumber(currentY)}`}
        </text>
      </svg>
    </div>
  );
}
