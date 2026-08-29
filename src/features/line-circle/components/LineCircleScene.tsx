import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CoordinateGrid, InteractivePoint, MathPoint } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabelOverlap } from "@/utils/labelOverlap";
import { calculateLineCircle } from "@/math/lineCircle";
import type { LineCircleStudyMode } from "../LineCircleAnimation";

interface LineCircleSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale: (v: number) => number;
  studyMode: LineCircleStudyMode;
}

export const LineCircleScene: React.FC<LineCircleSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  studyMode,
}) => {
  // 0. 规范化参数默认值
  const p = useMemo(
    () => ({
      a: params.a ?? 0,
      b: params.b ?? 0,
      r: params.r ?? 3,
      k: params.k ?? 0.75,
      m: params.m ?? -1,
      px: params.px ?? 5,
      py: params.py ?? 4,
      mx: params.mx ?? 1,
      my: params.my ?? 1,
    }),
    [params],
  );

  // 1. 调用纯数学模型计算
  const calcRes = useMemo(() => calculateLineCircle(p), [p]);

  // 2. 坐标转换：圆心 C 与垂足 H
  const centerDesign = mathToDesign(p.a, p.b, scale);
  const radiusPixel = p.r * scale.scaleX;
  const footDesign = mathToDesign(calcRes.foot.x, calcRes.foot.y, scale);

  // 3. 计算直线在屏幕视口延伸的端点 P1, P2
  const lineP1 = mathToDesign(-12, p.k * -12 + p.m, scale);
  const lineP2 = mathToDesign(12, p.k * 12 + p.m, scale);

  // 4. 交点 A, B
  const intersectionsDesign = calcRes.intersections.map((pt) =>
    mathToDesign(pt.x, pt.y, scale),
  );

  // 5. 圆外点 P (切线模式)
  const pDesign = mathToDesign(p.px, p.py, scale);
  const tangentPointsDesign = (calcRes.tangentPoints || []).map((pt) =>
    mathToDesign(pt.x, pt.y, scale),
  );

  // 6. 定点 M (弦长最值模式)
  const mDesign = mathToDesign(p.mx, p.my, scale);

  // 7. 垂足处的直角折线标记计算（严格符合高中几何规范：边长固定为10px精致小直角，朝向Rt△内部）
  const rightAnglePath = useMemo(() => {
    if (calcRes.distance < 0.2) return null;

    // 向量 HC: 从 H 指向 C
    const vHCx = centerDesign.x - footDesign.x;
    const vHCy = centerDesign.y - footDesign.y;
    const lenHC = Math.hypot(vHCx, vHCy);
    if (lenHC < 1e-4) return null;

    // HC 方向单位向量
    const uX = vHCx / lenHC;
    const uY = vHCy / lenHC;

    // 沿直线的方向向量 (优先指向交点 A，使直角方框位于 Rt△CHA 内部)
    let vX = -uY;
    let vY = uX;
    if (intersectionsDesign.length >= 1) {
      const vHAx = intersectionsDesign[0].x - footDesign.x;
      const vHAy = intersectionsDesign[0].y - footDesign.y;
      const dot = vHAx * vX + vHAy * vY;
      if (dot < 0) {
        vX = -vX;
        vY = -vY;
      }
    }

    // 严格限制直角方框边长为 9~10 像素
    const sz = Math.min(10, lenHC * 0.35);
    const p1x = footDesign.x + uX * sz;
    const p1y = footDesign.y + uY * sz;
    const p2x = p1x + vX * sz;
    const p2y = p1y + vY * sz;
    const p3x = footDesign.x + vX * sz;
    const p3y = footDesign.y + vY * sz;

    return `M ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y}`;
  }, [calcRes.distance, centerDesign, footDesign, intersectionsDesign]);

  // 8. 标签避让计算 (符合高中数学黑板/教材规范：只标单字母名称 C, H, A, B, T, M, P，去除冗余坐标数值与遮挡白框)
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
      text: "C",
      color: MATH_COLORS.paramPrimary,
    });

    if (calcRes.relation === "tangent") {
      // 相切状态：唯一公共点 切点 T
      list.push({
        key: "T",
        x: footDesign.x,
        y: footDesign.y,
        text: "T",
        color: MATH_COLORS.paramTertiary,
      });
    } else if (calcRes.relation === "intersect") {
      // 相交状态：弦中点 H 与两交点 A, B
      list.push({
        key: "H",
        x: footDesign.x,
        y: footDesign.y,
        text: "H",
        color: MATH_COLORS.paramTertiary,
      });

      if (intersectionsDesign.length >= 1) {
        list.push({
          key: "A",
          x: intersectionsDesign[0].x,
          y: intersectionsDesign[0].y,
          text: "A",
          color: MATH_COLORS.paramTertiary,
        });
      }
      if (intersectionsDesign.length >= 2) {
        list.push({
          key: "B",
          x: intersectionsDesign[1].x,
          y: intersectionsDesign[1].y,
          text: "B",
          color: MATH_COLORS.paramTertiary,
        });
      }
    } else {
      // 相离状态：圆心 C 与垂足 H
      list.push({
        key: "H",
        x: footDesign.x,
        y: footDesign.y,
        text: "H",
        color: MATH_COLORS.paramTertiary,
      });
    }

    // 弦长模式下的定点 M
    if (studyMode === "chord") {
      list.push({
        key: "M",
        x: mDesign.x,
        y: mDesign.y,
        text: "M",
        color: MATH_COLORS.paramSecondary,
      });
    }

    // 切线模式点 P 与切点 T1, T2
    if (studyMode === "tangent") {
      list.push({
        key: "P",
        x: pDesign.x,
        y: pDesign.y,
        text: "P",
        color: "#8B5CF6",
      });
      tangentPointsDesign.forEach((tp, idx) => {
        list.push({
          key: `T${idx + 1}`,
          x: tp.x,
          y: tp.y,
          text: `T${idx + 1}`,
          color: "#8B5CF6",
        });
      });
    }

    return list;
  }, [
    calcRes.relation,
    centerDesign,
    footDesign,
    intersectionsDesign,
    mDesign,
    pDesign,
    studyMode,
    tangentPointsDesign,
  ]);

  const adjustedLabels = useMemo(() => {
    return avoidLabelOverlap(rawLabels, 16);
  }, [rawLabels]);

  // 几何量中点辅助标注位置
  const midCH = {
    x: (centerDesign.x + footDesign.x) / 2,
    y: (centerDesign.y + footDesign.y) / 2,
  };
  const midCA =
    intersectionsDesign.length > 0
      ? {
          x: (centerDesign.x + intersectionsDesign[0].x) / 2,
          y: (centerDesign.y + intersectionsDesign[0].y) / 2,
        }
      : null;

  return (
    <g>
      {/* 高中标准纯净直角坐标系 (纯白底色 + 清晰 xOy 轴与整数刻度，去除杂乱虚线背景网格) */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* 1. 圆 C (鲜红 paramPrimary) */}
      <circle
        cx={centerDesign.x}
        cy={centerDesign.y}
        r={radiusPixel}
        fill={withAlpha(MATH_COLORS.paramPrimary, 0.05)}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2.5}
      />

      {/* 2. 直线 L (暖橙 paramSecondary，连续实线) */}
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
        x={lineP2.x - fontScale(30)}
        y={lineP2.y - fontScale(8)}
        fill={MATH_COLORS.paramSecondary}
        fontSize={fontScale(14)}
        fontWeight="bold"
        fontStyle="italic"
        paintOrder="stroke"
        stroke="white"
        strokeWidth={3}
      >
        l
      </text>

      {/* 3. 几何关系辅助线与直角三角形 (相交 / 相切 / 相离) */}
      {/* 相切状态专属呈现：切点半径 CT 与切点 T 处的直角标 */}
      {calcRes.relation === "tangent" && (
        <>
          {/* 切点半径 CT (鲜红实线) */}
          <line
            x1={centerDesign.x}
            y1={centerDesign.y}
            x2={footDesign.x}
            y2={footDesign.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
          />
          {/* 切点 T 实心点 */}
          <MathPoint
            cx={footDesign.x}
            cy={footDesign.y}
            color={MATH_COLORS.paramTertiary}
            fontScale={fontScale}
          />
          {/* 半径 r 标注 */}
          <text
            x={midCH.x + fontScale(6)}
            y={midCH.y - fontScale(4)}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(12)}
            fontWeight="bold"
            fontStyle="italic"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
          >
            r = d
          </text>
        </>
      )}

      {/* 相离与相交状态下的垂线段 CH (细实线) */}
      {calcRes.relation !== "tangent" && (
        <>
          <line
            x1={centerDesign.x}
            y1={centerDesign.y}
            x2={footDesign.x}
            y2={footDesign.y}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1.8}
          />
          {/* 垂足 H 实心点 */}
          <MathPoint
            cx={footDesign.x}
            cy={footDesign.y}
            color={MATH_COLORS.paramTertiary}
            fontScale={fontScale}
          />
          {/* 垂线段旁几何量 d 标注 */}
          {calcRes.distance > 0.6 && (
            <text
              x={midCH.x - fontScale(10)}
              y={midCH.y}
              fill={MATH_COLORS.paramTertiary}
              fontSize={fontScale(12)}
              fontWeight="bold"
              fontStyle="italic"
              paintOrder="stroke"
              stroke="white"
              strokeWidth={3}
            >
              d
            </text>
          )}
        </>
      )}

      {/* 垂足/切点直角折线标记 ∟ (精致10px小方框) */}
      {rightAnglePath && (
        <path
          d={rightAnglePath}
          fill="none"
          stroke={MATH_COLORS.paramTertiary}
          strokeWidth={1.6}
        />
      )}

      {/* 相交状态专属几何元素 */}
      {calcRes.relation === "intersect" &&
        (studyMode === "relation" ||
          studyMode === "chord" ||
          studyMode === "midpoint") && (
          <>
            {/* 直角三角形 Rt△CHA 阴影高亮 */}
            {intersectionsDesign.length > 0 && (
              <polygon
                points={`${centerDesign.x},${centerDesign.y} ${footDesign.x},${footDesign.y} ${intersectionsDesign[0].x},${intersectionsDesign[0].y}`}
                fill={withAlpha(MATH_COLORS.paramTertiary, 0.16)}
              />
            )}

            {/* 弦段 AB (高亮翠绿 paramTertiary 实心粗线) */}
            {intersectionsDesign.length >= 2 && (
              <line
                x1={intersectionsDesign[0].x}
                y1={intersectionsDesign[0].y}
                x2={intersectionsDesign[1].x}
                y2={intersectionsDesign[1].y}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={4}
                strokeLinecap="round"
              />
            )}

            {/* 交点 A, B 实心点 */}
            {intersectionsDesign.map((ipt, idx) => (
              <MathPoint
                key={idx}
                cx={ipt.x}
                cy={ipt.y}
                color={MATH_COLORS.paramTertiary}
                fontScale={fontScale}
              />
            ))}

            {/* 半径线 CA (从圆心到交点 A，细实线) */}
            {intersectionsDesign.length >= 1 && (
              <>
                <line
                  x1={centerDesign.x}
                  y1={centerDesign.y}
                  x2={intersectionsDesign[0].x}
                  y2={intersectionsDesign[0].y}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={1.8}
                />
                {midCA && (
                  <text
                    x={midCA.x + fontScale(6)}
                    y={midCA.y - fontScale(4)}
                    fill={MATH_COLORS.paramPrimary}
                    fontSize={fontScale(12)}
                    fontWeight="bold"
                    fontStyle="italic"
                    paintOrder="stroke"
                    stroke="white"
                    strokeWidth={3}
                  >
                    r
                  </text>
                )}
              </>
            )}
          </>
        )}

      {/* 4. 弦长模式下的定点 M 及其连线 CM */}
      {studyMode === "chord" && (
        <>
          <line
            x1={centerDesign.x}
            y1={centerDesign.y}
            x2={mDesign.x}
            y2={mDesign.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <MathPoint
            cx={mDesign.x}
            cy={mDesign.y}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
          />
        </>
      )}

      {/* 5. 切线模式 (studyMode === 'tangent') */}
      {studyMode === "tangent" && (
        <>
          {/* 连线 PC */}
          <line
            x1={pDesign.x}
            y1={pDesign.y}
            x2={centerDesign.x}
            y2={centerDesign.y}
            stroke={MATH_COLORS.tangentLine}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />

          {/* 两条切线 PT1, PT2 */}
          {tangentPointsDesign.map((tp, idx) => {
            // 计算切点 T_i 处的直角标记 (CT_i ⊥ PT_i)
            const vTCx = centerDesign.x - tp.x;
            const vTCy = centerDesign.y - tp.y;
            const lenTC = Math.hypot(vTCx, vTCy);

            const vTPx = pDesign.x - tp.x;
            const vTPy = pDesign.y - tp.y;
            const lenTP = Math.hypot(vTPx, vTPy);

            let anglePath: string | null = null;
            if (lenTC > 1e-3 && lenTP > 1e-3) {
              const uX = vTCx / lenTC;
              const uY = vTCy / lenTC;
              const vX = vTPx / lenTP;
              const vY = vTPy / lenTP;
              const sz = 9;
              const p1x = tp.x + uX * sz;
              const p1y = tp.y + uY * sz;
              const p2x = p1x + vX * sz;
              const p2y = p1y + vY * sz;
              const p3x = tp.x + vX * sz;
              const p3y = tp.y + vY * sz;
              anglePath = `M ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y}`;
            }

            return (
              <g key={idx}>
                {/* 切线段 PT_i */}
                <line
                  x1={pDesign.x}
                  y1={pDesign.y}
                  x2={tp.x}
                  y2={tp.y}
                  stroke={MATH_COLORS.tangentLine}
                  strokeWidth={2.2}
                />
                {/* 切点半径 CT_i */}
                <line
                  x1={centerDesign.x}
                  y1={centerDesign.y}
                  x2={tp.x}
                  y2={tp.y}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={1.5}
                />
                {/* 切点 T_i 直角标 */}
                {anglePath && (
                  <path
                    d={anglePath}
                    fill="none"
                    stroke={MATH_COLORS.paramPrimary}
                    strokeWidth={1.5}
                  />
                )}
                {/* 切点 T_i 实心点 */}
                <MathPoint
                  cx={tp.x}
                  cy={tp.y}
                  color="#8B5CF6"
                  fontScale={fontScale}
                />
              </g>
            );
          })}

          {/* 点 P 实心点 */}
          <MathPoint
            cx={pDesign.x}
            cy={pDesign.y}
            color="#8B5CF6"
            fontScale={fontScale}
          />

          {/* 切点弦 T1T2 */}
          {tangentPointsDesign.length >= 2 && (
            <line
              x1={tangentPointsDesign[0].x}
              y1={tangentPointsDesign[0].y}
              x2={tangentPointsDesign[1].x}
              y2={tangentPointsDesign[1].y}
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={2}
            />
          )}
        </>
      )}

      {/* 6. 可拖拽控制点 (严格遵守单源渲染：不传 label 属性以防重叠重影) */}
      {/* 圆心 C(a, b) 拖拽点 */}
      <InteractivePoint
        cx={centerDesign.x}
        cy={centerDesign.y}
        scale={scale}
        vp={vp}
        color={MATH_COLORS.paramPrimary}
        fontScale={fontScale}
        onDrag={(pt) => {
          onParamChange("a", Math.round(pt.x * 10) / 10);
          onParamChange("b", Math.round(pt.y * 10) / 10);
        }}
      />

      {/* 半径控制点 (a+r, b) */}
      <InteractivePoint
        cx={mathToDesign(p.a + p.r, p.b, scale).x}
        cy={mathToDesign(p.a + p.r, p.b, scale).y}
        scale={scale}
        vp={vp}
        color={MATH_COLORS.paramPrimary}
        fontScale={fontScale}
        onDrag={(pt) => {
          const newR = Math.max(0.5, Math.min(5, Math.abs(pt.x - p.a)));
          onParamChange("r", Math.round(newR * 10) / 10);
        }}
      />

      {/* 直线 y 截距控制点 (0, m) */}
      <InteractivePoint
        cx={mathToDesign(0, p.m, scale).x}
        cy={mathToDesign(0, p.m, scale).y}
        scale={scale}
        vp={vp}
        color={MATH_COLORS.paramSecondary}
        fontScale={fontScale}
        onDrag={(pt) => {
          onParamChange("m", Math.round(pt.y * 10) / 10);
        }}
      />

      {/* 弦长模式下定点 M(mx, my) 拖拽点 */}
      {studyMode === "chord" && (
        <InteractivePoint
          cx={mDesign.x}
          cy={mDesign.y}
          scale={scale}
          vp={vp}
          color={MATH_COLORS.paramSecondary}
          fontScale={fontScale}
          onDrag={(pt) => {
            onParamChange("mx", Math.round(pt.x * 10) / 10);
            onParamChange("my", Math.round(pt.y * 10) / 10);
          }}
        />
      )}

      {/* 切线模式下点 P(px, py) 拖拽 */}
      {studyMode === "tangent" && (
        <InteractivePoint
          cx={pDesign.x}
          cy={pDesign.y}
          scale={scale}
          vp={vp}
          color="#8B5CF6"
          fontScale={fontScale}
          onDrag={(pt) => {
            onParamChange("px", Math.round(pt.x * 10) / 10);
            onParamChange("py", Math.round(pt.y * 10) / 10);
          }}
        />
      )}

      {/* 7. 纯净字母点标注（无白底遮挡方块，带微描边，绝不截断线条） */}
      {adjustedLabels.map((lbl) => {
        const lx = lbl.x + 8;
        const ly = lbl.y - 8 + (lbl.finalDy || 0);

        return (
          <text
            key={lbl.key}
            x={lx}
            y={ly}
            fill={lbl.color}
            fontSize={fontScale(14)}
            fontWeight="bold"
            fontStyle="italic"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
            strokeLinejoin="round"
          >
            {lbl.text}
          </text>
        );
      })}
    </g>
  );
};
