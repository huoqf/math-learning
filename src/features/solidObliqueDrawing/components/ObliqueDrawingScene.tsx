import { useMemo } from "react";
import { MATH_COLORS } from "@/theme";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import {
  buildPresetPolygon,
  type PolygonPresetKey,
  type Point2D,
} from "@/math/obliqueDrawing";

export interface ObliqueDrawingSceneProps {
  mode: "polygon" | "solidPrism";
  polygonType: PolygonPresetKey;
  params: Record<string, number>;
  canvasSize: { width: number; height: number; font: (size: number) => number };
}

export function ObliqueDrawingScene({
  mode,
  polygonType,
  params,
  canvasSize,
}: ObliqueDrawingSceneProps) {
  const { width, height, font } = canvasSize;

  const a = params.a ?? 4;
  const b = params.b ?? 4;
  const h = params.h ?? 4;
  const alphaDeg = params.alphaDeg ?? 45;
  const ratioY = params.ratioY ?? 0.5;
  const prismH = params.prismH ?? 3.5;

  const poly = useMemo(
    () => buildPresetPolygon(polygonType, { a, b, h }, alphaDeg, ratioY),
    [polygonType, a, b, h, alphaDeg, ratioY],
  );

  // 坐标系基准设置 (满屏 840x650 空间)
  const legendItems: SceneLegendItem[] = useMemo(() => {
    return [
      {
        label: "原平面图形 (面积 S_原)",
        color: MATH_COLORS.primary,
        style: "area",
      },
      {
        label: "斜二测直观图 (面积 S_直观)",
        color: MATH_COLORS.secondary,
        style: "area",
      },
      {
        label: "45° 斜轴投影引导线",
        color: MATH_COLORS.paramTertiary,
        style: "line",
      },
    ];
  }, []);

  // 渲染分屏双坐标系：左侧为原图 xOy，右侧为直观图 x'O'y'
  if (mode === "polygon") {
    const leftOrigin = { x: width * 0.22, y: height * 0.72 };
    const rightOrigin = { x: width * 0.68, y: height * 0.72 };
    const unitScale = Math.min(width, height) * 0.055;

    // 左坐标系点转换 (x向右, y向上)
    const toLeftScreen = (p: Point2D) => ({
      x: leftOrigin.x + p.x * unitScale,
      y: leftOrigin.y - p.y * unitScale,
    });

    // 右坐标系点转换 (x'向右, y'沿 45° 倾斜方向)
    const toRightScreen = (p: Point2D) => ({
      x: rightOrigin.x + p.x * unitScale,
      y: rightOrigin.y - p.y * unitScale,
    });

    const origScreenPts = poly.originalPoints.map(toLeftScreen);
    const obliqScreenPts = poly.obliquePoints.map(toRightScreen);

    const origPath =
      origScreenPts
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ") + " Z";
    const obliqPath =
      obliqScreenPts
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ") + " Z";

    // 45° 轴线方向矢量
    const alphaRad = (alphaDeg * Math.PI) / 180;
    const axisLen = 6 * unitScale;
    const yAxisPrimeEnd = {
      x: rightOrigin.x + axisLen * Math.cos(alphaRad) * ratioY * 2,
      y: rightOrigin.y - axisLen * Math.sin(alphaRad) * ratioY * 2,
    };

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full select-none"
      >
        {/* 背景轻量微网格 */}
        <defs>
          <pattern
            id="oblique-grid"
            width={30}
            height={30}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 30 0 L 0 0 0 30"
              fill="none"
              stroke={MATH_COLORS.textMuted}
              strokeWidth={0.5}
              strokeOpacity={0.12}
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#oblique-grid)" />

        {/* ── 左侧：平面直角坐标系 xOy ── */}
        <g id="left-original-system">
          {/* X 轴 */}
          <line
            x1={leftOrigin.x - 20}
            y1={leftOrigin.y}
            x2={leftOrigin.x + 6.5 * unitScale}
            y2={leftOrigin.y}
            stroke={MATH_COLORS.axis}
            strokeWidth={1.5}
          />
          <text
            x={leftOrigin.x + 6.5 * unitScale + 6}
            y={leftOrigin.y + 4}
            fill={MATH_COLORS.axis}
            fontSize={font(12)}
            fontWeight={600}
          >
            x
          </text>

          {/* Y 轴 */}
          <line
            x1={leftOrigin.x}
            y1={leftOrigin.y + 20}
            x2={leftOrigin.x}
            y2={leftOrigin.y - 6.5 * unitScale}
            stroke={MATH_COLORS.axis}
            strokeWidth={1.5}
          />
          <text
            x={leftOrigin.x - 6}
            y={leftOrigin.y - 6.5 * unitScale - 6}
            fill={MATH_COLORS.axis}
            fontSize={font(12)}
            fontWeight={600}
          >
            y
          </text>
          <text
            x={leftOrigin.x - 14}
            y={leftOrigin.y + 14}
            fill={MATH_COLORS.textMuted}
            fontSize={font(11)}
          >
            O
          </text>

          {/* 直角符号 */}
          <path
            d={`M ${leftOrigin.x + 12} ${leftOrigin.y} L ${leftOrigin.x + 12} ${leftOrigin.y - 12} L ${leftOrigin.x} ${leftOrigin.y - 12}`}
            fill="none"
            stroke={MATH_COLORS.textMuted}
            strokeWidth={1}
          />

          {/* 原多边形填充与线框 */}
          <path
            d={origPath}
            fill={MATH_COLORS.primary}
            fillOpacity={0.18}
            stroke={MATH_COLORS.primary}
            strokeWidth={2}
          />

          {/* 原多边形顶点 */}
          {origScreenPts.map((p, idx) => (
            <circle
              key={`orig-pt-${idx}`}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={MATH_COLORS.primary}
            />
          ))}

          {/* 左侧标题 */}
          <text
            x={leftOrigin.x}
            y={height * 0.12}
            fill={MATH_COLORS.labelText}
            fontSize={font(15)}
            fontWeight={700}
            textAnchor="middle"
          >
            原平面图形 (直角坐标系 xOy)
          </text>
          <text
            x={leftOrigin.x}
            y={height * 0.16}
            fill={MATH_COLORS.primary}
            fontSize={font(13)}
            textAnchor="middle"
          >
            {`S_原 = ${poly.originalArea.toFixed(2)}`}
          </text>
        </g>

        {/* ── 中央分隔与转换映射指示 ── */}
        <g id="center-transform-indicator">
          <line
            x1={width * 0.46}
            y1={height * 0.15}
            x2={width * 0.46}
            y2={height * 0.85}
            stroke={MATH_COLORS.textMuted}
            strokeWidth={1}
            strokeDasharray="4 4"
            strokeOpacity={0.3}
          />
          <path
            d={`M ${width * 0.43} ${height * 0.45} L ${width * 0.49} ${height * 0.45}`}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={2}
          />
          <text
            x={width * 0.46}
            y={height * 0.42}
            fill={MATH_COLORS.paramTertiary}
            fontSize={font(12)}
            fontWeight={600}
            textAnchor="middle"
          >
            斜二测变换
          </text>
          <text
            x={width * 0.46}
            y={height * 0.49}
            fill={MATH_COLORS.paramSecondary}
            fontSize={font(11)}
            textAnchor="middle"
          >
            {`∠x'O'y' = ${alphaDeg}°`}
          </text>
          <text
            x={width * 0.46}
            y={height * 0.525}
            fill={MATH_COLORS.paramPrimary}
            fontSize={font(11)}
            textAnchor="middle"
          >
            {`y' 长度折半 (×${ratioY.toFixed(2)})`}
          </text>
        </g>

        {/* ── 右侧：斜二测直观图坐标系 x'O'y' ── */}
        <g id="right-oblique-system">
          {/* X' 轴 (平行且原长) */}
          <line
            x1={rightOrigin.x - 20}
            y1={rightOrigin.y}
            x2={rightOrigin.x + 6.5 * unitScale}
            y2={rightOrigin.y}
            stroke={MATH_COLORS.axis}
            strokeWidth={1.5}
          />
          <text
            x={rightOrigin.x + 6.5 * unitScale + 6}
            y={rightOrigin.y + 4}
            fill={MATH_COLORS.axis}
            fontSize={font(12)}
            fontWeight={600}
          >
            x'
          </text>

          {/* Y' 轴 (45° 倾斜且折半) */}
          <line
            x1={rightOrigin.x}
            y1={rightOrigin.y}
            x2={yAxisPrimeEnd.x}
            y2={yAxisPrimeEnd.y}
            stroke={MATH_COLORS.axis}
            strokeWidth={1.5}
          />
          <text
            x={yAxisPrimeEnd.x + 8}
            y={yAxisPrimeEnd.y - 4}
            fill={MATH_COLORS.axis}
            fontSize={font(12)}
            fontWeight={600}
          >
            y'
          </text>
          <text
            x={rightOrigin.x - 14}
            y={rightOrigin.y + 14}
            fill={MATH_COLORS.textMuted}
            fontSize={font(11)}
          >
            O'
          </text>

          {/* 45° 夹角弧线 */}
          <path
            d={`M ${rightOrigin.x + 24} ${rightOrigin.y} A 24 24 0 0 0 ${
              rightOrigin.x + 24 * Math.cos(alphaRad)
            } ${rightOrigin.y - 24 * Math.sin(alphaRad)}`}
            fill="none"
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.5}
          />
          <text
            x={rightOrigin.x + 32}
            y={rightOrigin.y - 10}
            fill={MATH_COLORS.paramSecondary}
            fontSize={font(11)}
            fontWeight={600}
          >
            {`${alphaDeg}°`}
          </text>

          {/* 直观图多边形填充与线框 */}
          <path
            d={obliqPath}
            fill={MATH_COLORS.secondary}
            fillOpacity={0.22}
            stroke={MATH_COLORS.secondary}
            strokeWidth={2}
          />

          {/* 直观图多边形顶点 */}
          {obliqScreenPts.map((p, idx) => (
            <circle
              key={`obliq-pt-${idx}`}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={MATH_COLORS.secondary}
            />
          ))}

          {/* 右侧标题 */}
          <text
            x={rightOrigin.x}
            y={height * 0.12}
            fill={MATH_COLORS.labelText}
            fontSize={font(15)}
            fontWeight={700}
            textAnchor="middle"
          >
            斜二测直观图 (坐标系 x'O'y')
          </text>
          <text
            x={rightOrigin.x}
            y={height * 0.16}
            fill={MATH_COLORS.secondary}
            fontSize={font(13)}
            textAnchor="middle"
          >
            {`S_直观 = ${poly.obliqueArea.toFixed(2)} (比值: ${poly.areaRatio.toFixed(4)})`}
          </text>
        </g>

        {/* 统一图例 */}
        <SceneLegend items={legendItems} position="bottom-right" />
      </svg>
    );
  }

  // 模式：空间几何体（四棱柱/直三棱柱）直观图构建演示
  // 可见性判断：以所有顶点 obliquePoints.y 的中位数为分界
  // y' 较大 → 靠后（被遮挡，画虚线）；y' 较小 → 靠前（可见，画实线）
  const prismN = poly.obliquePoints.length;
  const obliqueYArr = poly.obliquePoints.map((p) => p.y);
  const sortedObliqueY = [...obliqueYArr].sort((a, b) => a - b);
  const medianObliqueY = sortedObliqueY[Math.floor((prismN - 1) / 2)];
  const isPrismVertexHidden = (i: number) => obliqueYArr[i] > medianObliqueY;
  const isPrismEdgeHidden = (i: number) => {
    const avgY = (obliqueYArr[i] + obliqueYArr[(i + 1) % prismN]) / 2;
    return avgY > medianObliqueY;
  };
  const origin = { x: width * 0.42, y: height * 0.72 };
  const unitScale = Math.min(width, height) * 0.06;
  const toScreen = (p: Point2D) => ({
    x: origin.x + p.x * unitScale,
    y: origin.y - p.y * unitScale,
  });

  const bottomPts = poly.obliquePoints.map(toScreen);
  const topPts = bottomPts.map((p) => ({
    x: p.x,
    y: p.y - prismH * unitScale,
  }));

  const bottomPath =
    bottomPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") +
    " Z";
  const topPath =
    topPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") +
    " Z";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full select-none"
    >
      {/* 空间直观图坐标轴 x', y', z' */}
      <line
        x1={origin.x - 30}
        y1={origin.y}
        x2={origin.x + 8 * unitScale}
        y2={origin.y}
        stroke={MATH_COLORS.axis}
        strokeWidth={1.5}
      />
      <text
        x={origin.x + 8 * unitScale + 6}
        y={origin.y + 4}
        fill={MATH_COLORS.axis}
        fontSize={font(12)}
        fontWeight={600}
      >
        x'
      </text>

      {/* y' 轴 (45° 倾斜) */}
      <line
        x1={origin.x}
        y1={origin.y}
        x2={
          origin.x +
          6 * unitScale * Math.cos((alphaDeg * Math.PI) / 180) * ratioY * 2
        }
        y2={
          origin.y -
          6 * unitScale * Math.sin((alphaDeg * Math.PI) / 180) * ratioY * 2
        }
        stroke={MATH_COLORS.axis}
        strokeWidth={1.5}
      />
      <text
        x={
          origin.x +
          6 * unitScale * Math.cos((alphaDeg * Math.PI) / 180) * ratioY * 2 +
          8
        }
        y={
          origin.y -
          6 * unitScale * Math.sin((alphaDeg * Math.PI) / 180) * ratioY * 2 -
          4
        }
        fill={MATH_COLORS.axis}
        fontSize={font(12)}
        fontWeight={600}
      >
        y'
      </text>

      {/* z' 轴 (垂直向上，长度不变) */}
      <line
        x1={origin.x}
        y1={origin.y + 20}
        x2={origin.x}
        y2={origin.y - (prismH + 3) * unitScale}
        stroke={MATH_COLORS.axis}
        strokeWidth={1.5}
      />
      <text
        x={origin.x - 6}
        y={origin.y - (prismH + 3) * unitScale - 6}
        fill={MATH_COLORS.axis}
        fontSize={font(12)}
        fontWeight={600}
      >
        z'
      </text>

      {/* 下底面填充（无描边，描边由逐边线段负责） */}
      <path
        d={bottomPath}
        fill={MATH_COLORS.secondary}
        fillOpacity={0.15}
        stroke="none"
      />

      {/* 下底面逐边线段：靠后（y' 较大）的边画虚线，靠前的边画实线 */}
      {bottomPts.map((bp, i) => {
        const next = bottomPts[(i + 1) % prismN];
        return (
          <line
            key={`bottom-edge-${i}`}
            x1={bp.x}
            y1={bp.y}
            x2={next.x}
            y2={next.y}
            stroke={MATH_COLORS.secondary}
            strokeWidth={1.8}
            strokeDasharray={isPrismEdgeHidden(i) ? "4 4" : undefined}
          />
        );
      })}

      {/* 侧棱：按对应底面顶点的 y' 判断虚实 */}
      {bottomPts.map((bp, i) => {
        const tp = topPts[i];
        return (
          <line
            key={`pillar-${i}`}
            x1={bp.x}
            y1={bp.y}
            x2={tp.x}
            y2={tp.y}
            stroke={MATH_COLORS.primary}
            strokeWidth={1.8}
            strokeDasharray={isPrismVertexHidden(i) ? "4 4" : undefined}
          />
        );
      })}

      {/* 上底面 (实线) */}
      <path
        d={topPath}
        fill={MATH_COLORS.secondary}
        fillOpacity={0.3}
        stroke={MATH_COLORS.secondary}
        strokeWidth={2}
      />

      {/* 标题说明 */}
      <text
        x={width * 0.5}
        y={height * 0.1}
        fill={MATH_COLORS.labelText}
        fontSize={font(16)}
        fontWeight={700}
        textAnchor="middle"
      >
        空间几何体的斜二测直观图 (底面水平斜二测 · 侧棱平行竖直原长)
      </text>

      <SceneLegend
        items={[
          {
            label: "水平底面 (斜二测)",
            color: MATH_COLORS.secondary,
            style: "area",
          },
          {
            label: "竖直侧棱 (保持原长 h)",
            color: MATH_COLORS.primary,
            style: "line",
          },
        ]}
        position="bottom-right"
      />
    </svg>
  );
}
