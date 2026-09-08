import React, { useMemo, useCallback } from "react";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import {
  getChiSquare1Pdf,
  sampleChiSquareCurvePoints,
  mapChiValueToPixel,
} from "@/math/pairedData";

/**
 * 卡方分布子图（df=1）：连续概率密度曲线 + 多级拒绝域 + 高考临界标尺 + 当前观测值指针
 *
 * 该子图使用独立的子图坐标系（与主场景坐标系 `CoordinateGrid` 隔离），因此
 * 在此内部通过 `chiStartX/chiEndX/chiPlotBaseY` 等常量统一建立像素映射，
 * 所有坐标换算均收敛到 mapChiValueToPixel 与曲线采样函数，杜绝散落魔法数字。
 */
interface ChiSquarePlotProps {
  /** 当前观测 χ² 值 */
  chiSquare: number;
  /** 是否达到 95% 把握 (拒绝 H₀) */
  p95: boolean;
  /** 是否达到 99% 把握 */
  p99: boolean;
  /** 是否达到 99.9% 把握 */
  p999: boolean;
  fontScale: (size: number) => number;
}

// 子图几何常量（水平锚定于主卡片的 χ² 数轴）
const CHI_AXIS_Y = 535; // 数轴基线垂直位置
const CHI_PLOT_BASE_Y = 540; // 曲线底部基线（密度 0 位置）
const CHI_PLOT_HEIGHT = 160; // 曲线最大高度
const CHI_START_X = 75; // 数轴左端点
const CHI_END_X = 765; // 数轴右端点
const CHI_PLOT_WIDTH = CHI_END_X - CHI_START_X;
const MAX_CHI = 15; // 数轴最大刻度卡方值
const PDF_SCALE = 85; // pdf 值 → 像素高度缩放

export const ChiSquarePlot: React.FC<ChiSquarePlotProps> = ({
  chiSquare,
  p95,
  p99,
  p999,
  fontScale,
}) => {
  const getChiX = (val: number) =>
    mapChiValueToPixel(val, MAX_CHI, CHI_START_X, CHI_PLOT_WIDTH);

  // 生成 χ²(1) 平滑概率密度曲线路径 (pdf 放大至 PDF_SCALE 像素高度)
  const chiCurvePath = useMemo(() => {
    const segments: string[] = [];
    const points = sampleChiSquareCurvePoints(0.08, MAX_CHI, 90);
    points.forEach((p, i) => {
      const px = mapChiValueToPixel(
        p.chi,
        MAX_CHI,
        CHI_START_X,
        CHI_PLOT_WIDTH,
      );
      const py = CHI_PLOT_BASE_Y - Math.min(CHI_PLOT_HEIGHT, p.pdf * PDF_SCALE);
      if (i === 0) {
        segments.push(`M ${px.toFixed(1)} ${py.toFixed(1)}`);
      } else {
        segments.push(`L ${px.toFixed(1)} ${py.toFixed(1)}`);
      }
    });
    return segments.join(" ");
  }, []);

  // 生成任意区间 [startChi, endChi] 在卡方曲线下方的封闭阴影路径
  const generateChiShadePath = useCallback(
    (startChi: number, endChi: number, samplesCount = 30) => {
      const sX = mapChiValueToPixel(
        startChi,
        MAX_CHI,
        CHI_START_X,
        CHI_PLOT_WIDTH,
      );
      const eX = mapChiValueToPixel(
        endChi,
        MAX_CHI,
        CHI_START_X,
        CHI_PLOT_WIDTH,
      );
      const points = sampleChiSquareCurvePoints(startChi, endChi, samplesCount);
      const segs: string[] = [`M ${sX.toFixed(1)} ${CHI_PLOT_BASE_Y}`];
      for (const p of points) {
        const px = mapChiValueToPixel(
          p.chi,
          MAX_CHI,
          CHI_START_X,
          CHI_PLOT_WIDTH,
        );
        const py =
          CHI_PLOT_BASE_Y - Math.min(CHI_PLOT_HEIGHT, p.pdf * PDF_SCALE);
        segs.push(`L ${px.toFixed(1)} ${py.toFixed(1)}`);
      }
      segs.push(`L ${eX.toFixed(1)} ${CHI_PLOT_BASE_Y} Z`);
      return segs.join(" ");
    },
    [],
  );

  // 多级置信区间阴影路径 (接受域 / 95%拒绝域 / 99%拒绝域 / 99.9%极显著拒绝域)
  const acceptAreaPath = useMemo(
    () => generateChiShadePath(0.08, 3.841, 40),
    [generateChiShadePath],
  );
  const p95AreaPath = useMemo(
    () => generateChiShadePath(3.841, 6.635, 25),
    [generateChiShadePath],
  );
  const p99AreaPath = useMemo(
    () => generateChiShadePath(6.635, 10.828, 25),
    [generateChiShadePath],
  );
  const p999AreaPath = useMemo(
    () => generateChiShadePath(10.828, MAX_CHI, 25),
    [generateChiShadePath],
  );

  const isChiOverflow = chiSquare > MAX_CHI;
  const currChiX = getChiX(chiSquare);
  // 浮动标牌水平中心安全钳位 (卡片宽 210px，半宽 105px)
  const cardCenterX = isChiOverflow
    ? CHI_END_X - 110
    : Math.max(CHI_START_X + 105, Math.min(CHI_END_X - 105, currChiX));

  const verdictText = p999
    ? "✓ 达 99.9% 把握关联 (拒绝 H₀, α=0.001)"
    : p99
      ? "✓ 达 99% 把握关联 (拒绝 H₀, α=0.01)"
      : p95
        ? "✓ 达 95% 把握关联 (拒绝 H₀, α=0.05)"
        : "✗ 未达 95% 临界 (接受零假设 H₀, 无关联)";

  return (
    <g className="chi-square-plot" transform="translate(0, 5)">
      <text
        x={29}
        y={268}
        fontSize={fontScale(11.5)}
        fontWeight="bold"
        fill={MATH_COLORS.paramPrimary}
      >
        【χ² (自由度 df=1) 连续概率分布曲线 · 显著性拒绝域面积 ·
        高考临界决策标尺】
      </text>

      {/* 背景卡片 */}
      <rect
        x={25}
        y={276}
        width={785}
        height={340}
        rx={8}
        fill={CANVAS_COLORS.white}
        stroke={CANVAS_COLORS.grid}
        strokeWidth={1}
      />

      {/* 多级拒绝域分段着色阴影 */}
      <path
        d={acceptAreaPath}
        fill={withAlpha(CANVAS_COLORS.labelTextLight, 0.08)}
      />
      <path d={p95AreaPath} fill={withAlpha(MATH_COLORS.paramTertiary, 0.22)} />
      <path d={p99AreaPath} fill={withAlpha(MATH_COLORS.paramTertiary, 0.38)} />
      <path
        d={p999AreaPath}
        fill={withAlpha(MATH_COLORS.paramTertiary, 0.55)}
      />

      {/* χ²(1) 连续密度曲线主体 */}
      <path
        d={chiCurvePath}
        fill="none"
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2.4}
      />

      {/* 曲线左上侧公式与说明 */}
      <text
        x={CHI_START_X + 8}
        y={302}
        fontSize={fontScale(9.5)}
        fill={CANVAS_COLORS.labelTextLight}
        fontWeight="bold"
      >
        概率密度函数 f(x) = (2πx)⁻¹/² · e⁻ˣ/²
      </text>
      <text
        x={CHI_END_X - 8}
        y={302}
        textAnchor="end"
        fontSize={fontScale(9.5)}
        fill={MATH_COLORS.paramTertiary}
        fontWeight="bold"
      >
        阴影区为拒绝域: P(χ² ≥ 3.841) = 0.05 · P(χ² ≥ 6.635) = 0.01 · P(χ² ≥
        10.828) = 0.001
      </text>

      {/* 主数轴基线 */}
      <line
        x1={CHI_START_X}
        y1={CHI_AXIS_Y}
        x2={CHI_END_X}
        y2={CHI_AXIS_Y}
        stroke={CANVAS_COLORS.labelTextLight}
        strokeWidth={2}
      />
      <text
        x={CHI_END_X + 12}
        y={CHI_AXIS_Y + 4}
        fontSize={fontScale(11)}
        fill={CANVAS_COLORS.labelText}
        fontWeight="bold"
      >
        χ²
      </text>

      {/* 高考关键临界值刻度标尺与垂直投影虚线 */}
      {[
        { val: 0, label: "0", alpha: "接受 H₀ (无关联)", alphaOffsetY: 24 },
        { val: 2.706, label: "2.706", alpha: "α=0.10 (90%)", alphaOffsetY: 24 },
        {
          val: 3.841,
          label: "3.841",
          alpha: "α=0.05 (95%基准)",
          alphaOffsetY: 37,
          isKey: true,
        },
        {
          val: 6.635,
          label: "6.635",
          alpha: "α=0.01 (99%高频)",
          alphaOffsetY: 24,
          isKey: true,
        },
        {
          val: 10.828,
          label: "10.828",
          alpha: "α=0.001 (99.9%)",
          alphaOffsetY: 37,
          isKey: true,
        },
      ].map((tick) => {
        const tx = getChiX(tick.val);
        const pdfVal = getChiSquare1Pdf(tick.val);
        const curveTopY =
          CHI_PLOT_BASE_Y - Math.min(CHI_PLOT_HEIGHT, pdfVal * PDF_SCALE);
        return (
          <g key={`crit-tick-${tick.val}`}>
            {/* 投向曲线的垂直参考虚线 */}
            {tick.val > 0 && (
              <line
                x1={tx}
                y1={CHI_AXIS_Y}
                x2={tx}
                y2={curveTopY}
                stroke={
                  tick.isKey ? MATH_COLORS.paramTertiary : CANVAS_COLORS.grid
                }
                strokeWidth={tick.isKey ? 1.4 : 1}
                strokeDasharray="3 3"
              />
            )}
            {/* 刻度短线 */}
            <line
              x1={tx}
              y1={CHI_AXIS_Y - 5}
              x2={tx}
              y2={CHI_AXIS_Y + 5}
              stroke={CANVAS_COLORS.labelText}
              strokeWidth={1.5}
            />
            {/* 刻度数值 */}
            <text
              x={tx}
              y={CHI_AXIS_Y + 15}
              textAnchor="middle"
              fontSize={fontScale(9.5)}
              fontWeight={tick.isKey ? "bold" : "normal"}
              fill={
                tick.isKey ? MATH_COLORS.paramPrimary : CANVAS_COLORS.labelText
              }
            >
              {tick.label}
            </text>
            {/* 显著性水平 α */}
            <text
              x={tx}
              y={CHI_AXIS_Y + tick.alphaOffsetY}
              textAnchor="middle"
              fontSize={fontScale(8)}
              fontWeight={tick.isKey ? "bold" : "normal"}
              fill={
                tick.isKey
                  ? MATH_COLORS.paramTertiary
                  : CANVAS_COLORS.labelTextLight
              }
            >
              {tick.alpha}
            </text>
          </g>
        );
      })}

      {/* 动态计算出的当前 χ² 观测值指针与浮动标牌 */}
      <g>
        {/* 指针箭头 (若超限停靠在最右端并带折断指示) */}
        <polygon
          points={`${currChiX},${CHI_AXIS_Y - 6} ${currChiX - 6},${CHI_AXIS_Y - 16} ${currChiX + 6},${CHI_AXIS_Y - 16}`}
          fill={p95 ? MATH_COLORS.paramPrimary : MATH_COLORS.paramTertiary}
        />
        {/* 垂直连接虚线 */}
        <line
          x1={currChiX}
          y1={CHI_AXIS_Y - 16}
          x2={currChiX}
          y2={CHI_AXIS_Y - 100}
          stroke={p95 ? MATH_COLORS.paramPrimary : MATH_COLORS.paramTertiary}
          strokeWidth={1.5}
          strokeDasharray="2 2"
        />

        {/* 超限标尺折断标识 */}
        {isChiOverflow && (
          <g transform={`translate(${CHI_END_X - 15}, ${CHI_AXIS_Y - 8})`}>
            <line
              x1={0}
              y1={-6}
              x2={6}
              y2={6}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={2}
            />
            <line
              x1={4}
              y1={-6}
              x2={10}
              y2={6}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={2}
            />
            <text
              x={14}
              y={-6}
              fontSize={fontScale(8)}
              fill={MATH_COLORS.paramPrimary}
              fontWeight="bold"
            >
              ≫
            </text>
          </g>
        )}

        {/* 浮动结果胶囊卡片 */}
        <g transform={`translate(${cardCenterX}, ${CHI_AXIS_Y - 105})`}>
          <rect
            x={-105}
            y={-34}
            width={210}
            height={34}
            rx={6}
            fill={p95 ? MATH_COLORS.paramPrimary : MATH_COLORS.paramTertiary}
            filter="drop-shadow(0px 2px 5px rgba(0,0,0,0.18))"
          />
          <text
            x={0}
            y={-18}
            textAnchor="middle"
            fill={CANVAS_COLORS.white}
            fontSize={fontScale(10.5)}
            fontWeight="bold"
          >
            当前观测值 χ² = {chiSquare.toFixed(3)}{" "}
            {isChiOverflow ? "(≫ 15 极显著)" : ""}
          </text>
          <text
            x={0}
            y={-4}
            textAnchor="middle"
            fill={withAlpha(CANVAS_COLORS.white, 0.94)}
            fontSize={fontScale(8.5)}
          >
            {verdictText}
          </text>
        </g>
      </g>
    </g>
  );
};
