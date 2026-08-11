import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CoordinateGrid, InteractivePoint } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabelOverlap } from "@/utils/labelOverlap";
import { calculateLineCircle } from "@/math/lineCircle";

interface LineCircleSceneProps {
  params: {
    a: number;
    b: number;
    r: number;
    k: number;
    m: number;
    px: number;
    py: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale: (v: number) => number;
  studyMode: "relation" | "chord" | "tangent" | "midpoint";
}

export const LineCircleScene: React.FC<LineCircleSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  studyMode,
}) => {
  // 1. 调用纯数学模型计算
  const calcRes = useMemo(() => calculateLineCircle(params), [params]);

  // 2. 坐标转换：圆心 C 与垂足 H
  const centerDesign = mathToDesign(params.a, params.b, scale);
  const radiusPixel = params.r * scale.scaleX;
  const footDesign = mathToDesign(calcRes.foot.x, calcRes.foot.y, scale);

  // 3. 计算直线在屏幕视口延伸的端点 P1, P2
  const lineP1 = mathToDesign(-10, params.k * -10 + params.m, scale);
  const lineP2 = mathToDesign(10, params.k * 10 + params.m, scale);

  // 4. 交点 A, B
  const intersectionsDesign = calcRes.intersections.map((pt) =>
    mathToDesign(pt.x, pt.y, scale),
  );

  // 5. 圆外点 P (切线模式)
  const pDesign = mathToDesign(params.px, params.py, scale);
  const tangentPointsDesign = (calcRes.tangentPoints || []).map((pt) =>
    mathToDesign(pt.x, pt.y, scale),
  );

  // 6. 标签避让计算
  const rawLabels = useMemo(() => {
    const list: Array<{
      key: string;
      x: number;
      y: number;
      text: string;
      color: string;
    }> = [];

    // 圆心 C
    list.push({
      key: "C",
      x: centerDesign.x,
      y: centerDesign.y,
      text: `C(${calcRes.center.x.toFixed(1)}, ${calcRes.center.y.toFixed(1)})`,
      color: MATH_COLORS.paramPrimary,
    });

    // 垂足 H (相交或相切时)
    if (calcRes.relation !== "disjoint") {
      list.push({
        key: "H",
        x: footDesign.x,
        y: footDesign.y,
        text: `H(${calcRes.foot.x.toFixed(1)}, ${calcRes.foot.y.toFixed(1)})`,
        color: MATH_COLORS.paramTertiary,
      });
    }

    // 交点 A, B
    if (intersectionsDesign.length >= 1) {
      list.push({
        key: "A",
        x: intersectionsDesign[0].x,
        y: intersectionsDesign[0].y,
        text: `A(${calcRes.intersections[0].x.toFixed(1)}, ${calcRes.intersections[0].y.toFixed(1)})`,
        color: MATH_COLORS.paramTertiary,
      });
    }
    if (intersectionsDesign.length >= 2) {
      list.push({
        key: "B",
        x: intersectionsDesign[1].x,
        y: intersectionsDesign[1].y,
        text: `B(${calcRes.intersections[1].x.toFixed(1)}, ${calcRes.intersections[1].y.toFixed(1)})`,
        color: MATH_COLORS.paramTertiary,
      });
    }

    // 切线模式点 P 与切点 T1, T2
    if (studyMode === "tangent") {
      list.push({
        key: "P",
        x: pDesign.x,
        y: pDesign.y,
        text: `P(${params.px.toFixed(1)}, ${params.py.toFixed(1)})`,
        color: "#8B5CF6",
      });
      tangentPointsDesign.forEach((tp, idx) => {
        const pt = calcRes.tangentPoints![idx];
        list.push({
          key: `T${idx + 1}`,
          x: tp.x,
          y: tp.y,
          text: `T${idx + 1}(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`,
          color: "#8B5CF6",
        });
      });
    }

    return list;
  }, [
    calcRes,
    params,
    studyMode,
    centerDesign,
    footDesign,
    intersectionsDesign,
    pDesign,
    tangentPointsDesign,
  ]);

  const adjustedLabels = useMemo(() => {
    return avoidLabelOverlap(rawLabels, 20);
  }, [rawLabels]);

  return (
    <g>
      {/* 坐标轴与网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. 圆 C (鲜红 paramPrimary) */}
      <circle
        cx={centerDesign.x}
        cy={centerDesign.y}
        r={radiusPixel}
        fill={withAlpha(MATH_COLORS.paramPrimary, 0.06)}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2.5}
      />

      {/* 2. 直线 L (暖橙 paramSecondary) */}
      <line
        x1={lineP1.x}
        y1={lineP1.y}
        x2={lineP2.x}
        y2={lineP2.y}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={2.5}
      />
      {/* 直线 L 标签 */}
      <text
        x={lineP2.x - fontScale(40)}
        y={lineP2.y - fontScale(10)}
        fill={MATH_COLORS.paramSecondary}
        fontSize={fontScale(14)}
        fontWeight="bold"
      >
        L: y = {params.k}x{" "}
        {params.m >= 0 ? `+ ${params.m}` : `- ${Math.abs(params.m)}`}
      </text>

      {/* 3. 相交模式与弦长模式：Rt△CHA 直角三角形阴影与垂线段 d */}
      {calcRes.relation !== "disjoint" &&
        (studyMode === "relation" ||
          studyMode === "chord" ||
          studyMode === "midpoint") && (
          <>
            {/* 直角三角形 Rt△CHA 阴影高亮 */}
            {intersectionsDesign.length > 0 && (
              <polygon
                points={`${centerDesign.x},${centerDesign.y} ${footDesign.x},${footDesign.y} ${intersectionsDesign[0].x},${intersectionsDesign[0].y}`}
                fill={withAlpha(MATH_COLORS.paramTertiary, 0.2)}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}

            {/* 垂线段 d (CH) */}
            <line
              x1={centerDesign.x}
              y1={centerDesign.y}
              x2={footDesign.x}
              y2={footDesign.y}
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={2}
              strokeDasharray="5 4"
            />

            {/* 垂足直角标记 ∟ */}
            {calcRes.distance > 0.1 && (
              <circle
                cx={footDesign.x}
                cy={footDesign.y}
                r={3}
                fill={MATH_COLORS.paramTertiary}
              />
            )}

            {/* 弦段 AB (高亮翠绿 paramTertiary) */}
            {intersectionsDesign.length >= 2 && (
              <line
                x1={intersectionsDesign[0].x}
                y1={intersectionsDesign[0].y}
                x2={intersectionsDesign[1].x}
                y2={intersectionsDesign[1].y}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={4.5}
                strokeLinecap="round"
              />
            )}

            {/* 半径线 CA (从圆心到交点 A) */}
            {intersectionsDesign.length >= 1 && (
              <line
                x1={centerDesign.x}
                y1={centerDesign.y}
                x2={intersectionsDesign[0].x}
                y2={intersectionsDesign[0].y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1.8}
                strokeDasharray="4 3"
              />
            )}
          </>
        )}

      {/* 4. 切线模式 (studyMode === 'tangent') */}
      {studyMode === "tangent" && (
        <>
          {/* 连线 PC */}
          <line
            x1={pDesign.x}
            y1={pDesign.y}
            x2={centerDesign.x}
            y2={centerDesign.y}
            stroke="#8B5CF6"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />

          {/* 两条切线 PT1, PT2 */}
          {tangentPointsDesign.map((tp, idx) => (
            <g key={idx}>
              <line
                x1={pDesign.x}
                y1={pDesign.y}
                x2={tp.x}
                y2={tp.y}
                stroke="#8B5CF6"
                strokeWidth={2.5}
              />
              {/* 切点半径 CT1, CT2 */}
              <line
                x1={centerDesign.x}
                y1={centerDesign.y}
                x2={tp.x}
                y2={tp.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
            </g>
          ))}

          {/* 切点弦 T1T2 */}
          {tangentPointsDesign.length >= 2 && (
            <line
              x1={tangentPointsDesign[0].x}
              y1={tangentPointsDesign[0].y}
              x2={tangentPointsDesign[1].x}
              y2={tangentPointsDesign[1].y}
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          )}
        </>
      )}

      {/* 5. 拖拽控制点 */}
      {/* 圆心 C(a, b) 拖拽点 */}
      <InteractivePoint
        cx={centerDesign.x}
        cy={centerDesign.y}
        scale={scale}
        vp={vp}
        color={MATH_COLORS.paramPrimary}
        label="C"
        fontScale={fontScale}
        onDrag={(pt) => {
          onParamChange("a", Math.round(pt.x * 10) / 10);
          onParamChange("b", Math.round(pt.y * 10) / 10);
        }}
      />

      {/* 半径控制点 (a+r, b) */}
      <InteractivePoint
        cx={mathToDesign(params.a + params.r, params.b, scale).x}
        cy={mathToDesign(params.a + params.r, params.b, scale).y}
        scale={scale}
        vp={vp}
        color={MATH_COLORS.paramPrimary}
        label="r"
        fontScale={fontScale}
        onDrag={(pt) => {
          const newR = Math.max(0.5, Math.min(5, Math.abs(pt.x - params.a)));
          onParamChange("r", Math.round(newR * 10) / 10);
        }}
      />

      {/* 直线 y 截距控制点 (0, m) */}
      <InteractivePoint
        cx={mathToDesign(0, params.m, scale).x}
        cy={mathToDesign(0, params.m, scale).y}
        scale={scale}
        vp={vp}
        color={MATH_COLORS.paramSecondary}
        label="m"
        fontScale={fontScale}
        onDrag={(pt) => {
          onParamChange("m", Math.round(pt.y * 10) / 10);
        }}
      />

      {/* 切线模式下点 P(px, py) 拖拽 */}
      {studyMode === "tangent" && (
        <InteractivePoint
          cx={pDesign.x}
          cy={pDesign.y}
          scale={scale}
          vp={vp}
          color="#8B5CF6"
          label="P"
          fontScale={fontScale}
          onDrag={(pt) => {
            onParamChange("px", Math.round(pt.x * 10) / 10);
            onParamChange("py", Math.round(pt.y * 10) / 10);
          }}
        />
      )}

      {/* 6. 避让后的文本标签 */}
      {adjustedLabels.map((lbl) => {
        const lx = lbl.x + 10;
        const ly = lbl.y - 10 + (lbl.finalDy || 0);

        return (
          <g key={lbl.key}>
            <rect
              x={lx - 4}
              y={ly - fontScale(12)}
              width={fontScale(lbl.text.length * 7 + 8)}
              height={fontScale(16)}
              fill="rgba(255, 255, 255, 0.85)"
              rx={3}
            />
            <text
              x={lx}
              y={ly}
              fill={lbl.color}
              fontSize={fontScale(12)}
              fontWeight="600"
            >
              {lbl.text}
            </text>
          </g>
        );
      })}
    </g>
  );
};
