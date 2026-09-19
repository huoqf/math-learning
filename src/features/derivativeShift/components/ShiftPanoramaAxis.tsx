/**
 * src/features/derivativeShift/components/ShiftPanoramaAxis.tsx
 * 极值点偏移 · 底部横坐标对照条
 *
 * 存在理由：本页画布保持等比缩放（1 单位 x 与 1 单位 y 等长），因此可见域一旦放大，
 * 曲线峰高即按 0.368 × 画布宽 / 跨度 迅速压平（跨度 24 时峰高仅约 13 px）。
 * 可见域又必须固定不变（拖参数时坐标轴不能跟着缩放，否则学生分不清"图像变了"
 * 还是"坐标变了"），于是 ln x/x 模型在低 k 处右根必然越出画布
 * （k = 0.288 → x₂ ≈ 6.4，k = 0.12 → x₂ ≈ 27.7，k = 0.05 → x₂ ≈ 90）。
 *
 * 本组件把 x₁、x₀、P₁′、M、x₂ 五个关键横坐标压到一根**与画布同刻度**的轴上，
 * 使"中点 M 落在极值点 x₀ 右侧"这一极值点偏移结论在所有 k 下都读得出来；
 * 越出画布右界的点收在轴端并标注「超出画布」，不在图上伪造横坐标。
 */

import { MATH_COLORS, withAlpha } from "@/theme";
import type { ViewportInfo } from "@/utils/useViewport";
import type { SceneScale } from "@/hooks/useSceneScale";
import { estimateLabelTextWidth } from "@/utils/labelOverlap";

interface ShiftPanoramaAxisProps {
  /** 割线左根 */
  x1: number;
  /** 极值点 / 对称轴 */
  x0: number;
  /** 两根中点 M */
  midX: number;
  /** 割线右根 */
  x2: number;
  /** x₁ 关于 x₀ 的对称点 2x₀ − x₁ */
  mirrorX: number;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale?: (v: number) => number;
}

interface AxisMarker {
  key: string;
  value: number;
  label: string;
  text: string;
  color: string;
  pinned: boolean;
}

const BAND_HEIGHT = 86;
const LABEL_ROWS = 3;

export function ShiftPanoramaAxis({
  x1,
  x0,
  midX,
  x2,
  mirrorX,
  scale,
  vp,
  fontScale = (v) => v,
}: ShiftPanoramaAxisProps) {
  const bandLeft = vp.designLeft + 20;
  const bandRight = vp.designLeft + vp.designVisibleW * 0.6;

  // 与画布共用同一比例尺与右界（左端从 0 起，关键横坐标恒为正）
  const domainMin = Math.max(0, scale.xMin);
  const domainMax = scale.xMax;

  const values = [x1, x0, midX, x2, mirrorX];
  // 退化参数（NaN / 无穷 / 根未解出）或视口尚未测量时整体不渲染，绝不画半截坐标
  if (!values.every((v) => Number.isFinite(v))) return null;
  if (!(domainMax > domainMin)) return null;
  if (bandRight - bandLeft < 160 || vp.designVisibleH <= 0) return null;

  const bandTop = vp.designTop + vp.designVisibleH - BAND_HEIGHT - 6;
  const axisY = bandTop + 42;
  const axisLeft = bandLeft + 16;
  const axisRight = bandRight - 16;
  const toAxisX = (v: number) =>
    axisLeft +
    ((Math.min(v, domainMax) - domainMin) / (domainMax - domainMin)) *
      (axisRight - axisLeft);

  const markers: AxisMarker[] = [
    { key: "x1", value: x1, label: "x₁", color: MATH_COLORS.function },
    { key: "x0", value: x0, label: "x₀", color: MATH_COLORS.paramPrimary },
    {
      key: "mirror",
      value: mirrorX,
      label: "P₁′",
      color: MATH_COLORS.functionTransformed,
    },
    { key: "mid", value: midX, label: "M", color: MATH_COLORS.paramSecondary },
    {
      key: "x2",
      value: x2,
      label: "x₂",
      color: MATH_COLORS.functionSecondary,
    },
  ]
    .filter((m) => m.value >= domainMin)
    .map((m) => {
      const pinned = m.value > domainMax;
      return {
        ...m,
        pinned,
        text: pinned ? m.label + "（超出画布）" : m.label,
      };
    })
    .sort((a, b) => a.value - b.value);

  // 贪心分排：按 x 升序为每个标注挑选第一条还能放下的标签行
  // （ln x/x 模型低 k 时 x₁、x₀、P₁′ 会挤在数轴最左端，单排必然重叠）
  const rowRightEdge = new Array<number>(LABEL_ROWS).fill(bandLeft + 6);
  const placed = markers.map((m) => {
    const tickX = toAxisX(m.value);
    const width = estimateLabelTextWidth(m.text, fontScale(11));

    let row = -1;
    for (let r = 0; r < LABEL_ROWS; r++) {
      if (tickX - width / 2 > rowRightEdge[r] + 4) {
        row = r;
        break;
      }
    }
    if (row === -1) {
      row = rowRightEdge.indexOf(Math.min(...rowRightEdge));
    }

    const labelX = Math.min(
      Math.max(tickX, rowRightEdge[row] + width / 2 + 4),
      bandRight - 6 - width / 2,
    );
    rowRightEdge[row] = labelX + width / 2;
    return { ...m, tickX, labelX, labelY: axisY + 20 + row * 17 };
  });

  return (
    <g className="pointer-events-none select-none">
      {/* 底板：遮住网格线与刻度数字（不透明，避免留下虚线重影），与图例卡片同一视觉层级 */}
      <rect
        x={bandLeft}
        y={bandTop}
        width={bandRight - bandLeft}
        height={BAND_HEIGHT}
        rx={8}
        fill={MATH_COLORS.white}
        stroke={withAlpha(MATH_COLORS.labelText, 0.12)}
        strokeWidth={1}
      />

      <text
        x={bandLeft + 14}
        y={bandTop + 20}
        fontSize={fontScale(10)}
        fill={withAlpha(MATH_COLORS.labelText, 0.55)}
        fontWeight="600"
      >
        关键横坐标相对位置（与画布同刻度；标「超出画布」者已越出右界）
      </text>

      {/* 轴主线与右端延伸箭头 */}
      <line
        x1={axisLeft}
        y1={axisY}
        x2={axisRight}
        y2={axisY}
        stroke={withAlpha(MATH_COLORS.labelText, 0.55)}
        strokeWidth={1.4}
      />
      <polygon
        points={`${axisRight},${axisY - 4.5} ${axisRight + 8},${axisY} ${axisRight},${axisY + 4.5}`}
        fill={withAlpha(MATH_COLORS.labelText, 0.55)}
      />

      {placed.map((m) => (
        <g key={m.key}>
          <line
            x1={m.tickX}
            y1={axisY - 5}
            x2={m.tickX}
            y2={axisY + 5}
            stroke={m.color}
            strokeWidth={2}
          />
          {/* 超出画布的根收在轴端，以空心刻度表示"已到尽头但真实值更远" */}
          <circle
            cx={m.tickX}
            cy={axisY}
            r={2.6}
            fill={m.pinned ? MATH_COLORS.white : m.color}
            stroke={m.pinned ? m.color : undefined}
            strokeWidth={m.pinned ? 1.6 : undefined}
          />
          {/* 引线：把刻度与标签明确定位关联，聚簇处亦可读出对应关系 */}
          <line
            x1={m.tickX}
            y1={axisY + 6}
            x2={m.labelX}
            y2={m.labelY - 10}
            stroke={withAlpha(m.color, 0.5)}
            strokeWidth={1}
          />
          <text
            x={m.labelX}
            y={m.labelY}
            textAnchor="middle"
            fontSize={fontScale(11)}
            fill={m.color}
            fontWeight="bold"
          >
            {m.text}
          </text>
        </g>
      ))}
    </g>
  );
}
