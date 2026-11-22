import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MATH_COLORS, withAlpha } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";

export interface SphereCrossSectionOverlay2DProps {
  title: string;
  R: number;
  r: number;
  d: number;
  modeLabel?: string;
  kind?: "circum" | "inscribed";
  inscribedShape?: "triangle" | "rect";
  position?: "bottom-left" | "bottom-right";
  defaultCollapsed?: boolean;
}

const fontScale = (size: number) => size;

/**
 * 切接球专题 3D 视口左下角可折叠「2D 轴截面降维剖视图」浮窗。
 * 外接球展示 R² = r² + d² 直角三角形；内切球展示轴截面相切轮廓（无裸 Hex/rgb，全令牌驱动）。
 */
export function SphereCrossSectionOverlay2D({
  title,
  R,
  r,
  d,
  modeLabel = "R² = r² + d²",
  kind = "circum",
  inscribedShape = "rect",
  position = "bottom-left",
  defaultCollapsed = false,
}: SphereCrossSectionOverlay2DProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const safeR = Math.max(0.01, R);
  const absD = Math.min(safeR, Math.max(0, Math.abs(d)));
  const sinTheta = Math.min(1, Math.max(0, r / safeR));
  const cosTheta = Math.min(1, Math.max(0, absD / safeR));

  const cx = 66;
  const cy = kind === "inscribed" && inscribedShape === "triangle" ? 68 : 58;
  const radPx = 42;
  const rx = radPx * sinTheta;
  const dy = radPx * cosTheta;
  const showTriangle = kind === "circum" && rx > 5 && dy > 5;
  const showRadiusOnly = kind === "circum" && !showTriangle && rx > 5;

  // 内切球轴截面几何（严格外框相切）
  const inRad = inscribedShape === "triangle" ? 26 : 32;
  const triHalfW = 46;
  const triU = inRad / triHalfW;
  const triH = triHalfW * ((2 * triU) / (1 - triU * triU));
  const triBaseY = cy + inRad;
  const triApexY = triBaseY - triH;
  const slantLen = Math.hypot(triHalfW, triH);
  const tanSideX = cx + (inRad * triH) / slantLen;
  const tanSideY = cy - (inRad * triHalfW) / slantLen;
  const rectHalfW = 38;

  const posClass =
    position === "bottom-right" ? "bottom-3 right-3" : "bottom-3 left-3";

  if (collapsed) {
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
        <span>
          {kind === "inscribed"
            ? `2D 内切剖面 (r=${formatMathNumber(safeR)})`
            : `2D 截面降维 (R=${formatMathNumber(safeR)})`}
        </span>
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div
      className={`absolute ${posClass} z-10 w-[224px] rounded-xl p-2.5 shadow-md backdrop-blur-md select-none`}
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
          aria-label="收起截面浮窗"
          className="rounded p-0.5 transition-colors hover:bg-neutral-100 cursor-pointer"
          style={{ color: MATH_COLORS.textMuted }}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <svg
        viewBox="0 0 204 114"
        className="w-full h-auto block"
        role="img"
        aria-label={title}
      >
        {kind === "inscribed" ? (
          <>
            {/* 外轮廓：锥面三角形或柱面矩形 */}
            {inscribedShape === "triangle" ? (
              <polygon
                points={`${cx},${triApexY} ${cx - triHalfW},${triBaseY} ${cx + triHalfW},${triBaseY}`}
                fill={withAlpha(MATH_COLORS.primary, 0.08)}
                stroke={MATH_COLORS.primary}
                strokeWidth={1.5}
              />
            ) : (
              <rect
                x={cx - rectHalfW}
                y={cy - inRad}
                width={rectHalfW * 2}
                height={inRad * 2}
                fill={withAlpha(MATH_COLORS.primary, 0.08)}
                stroke={MATH_COLORS.primary}
                strokeWidth={1.5}
              />
            )}

            {/* 内切大圆 */}
            <circle
              cx={cx}
              cy={cy}
              r={inRad}
              fill={withAlpha(MATH_COLORS.inSphereShell, 0.16)}
              stroke={MATH_COLORS.inSphereShell}
              strokeWidth={1.6}
            />

            {/* 底面切半径 r + 垂直标 */}
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy + inRad}
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={2.2}
            />
            <polyline
              points={`${cx},${cy + inRad - 6} ${cx + 6},${cy + inRad - 6} ${cx + 6},${cy + inRad}`}
              fill="none"
              stroke={MATH_COLORS.textMuted}
              strokeWidth={1.1}
            />
            <circle
              cx={cx}
              cy={cy + inRad}
              r={2.5}
              fill={MATH_COLORS.paramTertiary}
            />

            {/* 侧面/顶面相切半径辅助线 */}
            <line
              x1={cx}
              y1={cy}
              x2={inscribedShape === "triangle" ? tanSideX : cx + inRad}
              y2={inscribedShape === "triangle" ? tanSideY : cy}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={1.8}
              strokeDasharray="3 2"
            />
            <circle
              cx={inscribedShape === "triangle" ? tanSideX : cx + inRad}
              cy={inscribedShape === "triangle" ? tanSideY : cy}
              r={2.5}
              fill={MATH_COLORS.paramPrimary}
            />
            <text
              x={cx + 5}
              y={cy + inRad * 0.58}
              fontSize={fontScale(9.5)}
              fontWeight="bold"
              fill={MATH_COLORS.paramTertiary}
            >
              r
            </text>
            <text
              x={cx - 3}
              y={cy + inRad + 11}
              fontSize={fontScale(8.8)}
              fontWeight="600"
              fill={MATH_COLORS.textMuted}
            >
              T
            </text>
          </>
        ) : (
          <>
            {/* 球外接大圆 */}
            <circle
              cx={cx}
              cy={cy}
              r={radPx}
              fill={withAlpha(MATH_COLORS.sphereShell, 0.08)}
              stroke={MATH_COLORS.sphereShell}
              strokeWidth={1.6}
            />

            {/* 截面圆弦 */}
            {showTriangle && (
              <>
                <polygon
                  points={`${cx},${cy} ${cx},${cy + dy} ${cx + rx},${cy + dy}`}
                  fill={withAlpha(MATH_COLORS.paramTertiary, 0.16)}
                />
                <line
                  x1={cx - rx}
                  y1={cy + dy}
                  x2={cx + rx}
                  y2={cy + dy}
                  stroke={MATH_COLORS.paramTertiary}
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                />
                {/* 球心距 d */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx}
                  y2={cy + dy}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={2}
                />
                {/* 截面半径 r */}
                <line
                  x1={cx}
                  y1={cy + dy}
                  x2={cx + rx}
                  y2={cy + dy}
                  stroke={MATH_COLORS.paramTertiary}
                  strokeWidth={2.2}
                />
                {/* 球半径 R */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx + rx}
                  y2={cy + dy}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={2.2}
                />
                {/* 直角方标 */}
                <polyline
                  points={`${cx},${cy + dy - 6} ${cx + 6},${cy + dy - 6} ${cx + 6},${cy + dy}`}
                  fill="none"
                  stroke={MATH_COLORS.textMuted}
                  strokeWidth={1.1}
                />
                <circle
                  cx={cx}
                  cy={cy + dy}
                  r={2.5}
                  fill={MATH_COLORS.paramSecondary}
                />
                <circle
                  cx={cx + rx}
                  cy={cy + dy}
                  r={2.8}
                  fill={MATH_COLORS.paramPrimary}
                />
                <text
                  x={cx + rx * 0.55 + 4}
                  y={cy + dy * 0.45}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                  fill={MATH_COLORS.paramPrimary}
                >
                  R
                </text>
                <text
                  x={cx - 10}
                  y={cy + dy * 0.55 + 3}
                  fontSize={fontScale(9.5)}
                  fontWeight="bold"
                  fill={MATH_COLORS.paramSecondary}
                >
                  d
                </text>
                <text
                  x={cx + rx * 0.5 - 3}
                  y={cy + dy + 11}
                  fontSize={fontScale(9.5)}
                  fontWeight="bold"
                  fill={MATH_COLORS.paramTertiary}
                >
                  r
                </text>
              </>
            )}

            {showRadiusOnly && (
              <>
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx + radPx}
                  y2={cy}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={2.2}
                />
                <text
                  x={cx + radPx * 0.5 - 3}
                  y={cy - 5}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                  fill={MATH_COLORS.paramPrimary}
                >
                  R
                </text>
              </>
            )}
          </>
        )}

        {/* 球心 O / I */}
        <circle cx={cx} cy={cy} r={3} fill={MATH_COLORS.accent} />
        <text
          x={cx - 12}
          y={cy - 4}
          fontSize={fontScale(10)}
          fontWeight="bold"
          fill={MATH_COLORS.accent}
        >
          {kind === "inscribed" ? "I" : "O"}
        </text>

        {/* 右侧动态读数对照 */}
        {kind === "inscribed" ? (
          <>
            <text
              x={120}
              y={28}
              fontSize={fontScale(10.5)}
              fontWeight="600"
              fill={MATH_COLORS.paramTertiary}
            >
              {`r = ${formatMathNumber(safeR)}`}
            </text>
            <text
              x={120}
              y={50}
              fontSize={fontScale(10.5)}
              fontWeight="600"
              fill={MATH_COLORS.paramPrimary}
            >
              {`d切 = ${formatMathNumber(safeR)}`}
            </text>
            <text
              x={120}
              y={72}
              fontSize={fontScale(10.5)}
              fontWeight="600"
              fill={MATH_COLORS.paramSecondary}
            >
              {`2r = ${formatMathNumber(safeR * 2)}`}
            </text>
          </>
        ) : (
          <>
            <text
              x={120}
              y={28}
              fontSize={fontScale(10.5)}
              fontWeight="600"
              fill={MATH_COLORS.paramPrimary}
            >
              {`R = ${formatMathNumber(safeR)}`}
            </text>
            <text
              x={120}
              y={50}
              fontSize={fontScale(10.5)}
              fontWeight="600"
              fill={MATH_COLORS.paramTertiary}
            >
              {`r = ${formatMathNumber(r)}`}
            </text>
            <text
              x={120}
              y={72}
              fontSize={fontScale(10.5)}
              fontWeight="600"
              fill={MATH_COLORS.paramSecondary}
            >
              {`d = ${formatMathNumber(absD)}`}
            </text>
          </>
        )}
        <text
          x={118}
          y={96}
          fontSize={fontScale(8.8)}
          fill={MATH_COLORS.textMuted}
        >
          {modeLabel}
        </text>
      </svg>
    </div>
  );
}
