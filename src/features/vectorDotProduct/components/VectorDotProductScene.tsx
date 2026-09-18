import React, { useMemo } from "react";
import {
  CoordinateGrid,
  InteractivePoint,
  MathPoint,
  VectorArrow,
} from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { rightAnglePath } from "@/utils/geometryMarks";
import { paramDragRange, snapDragValue } from "@/utils/paramClamp";
import type { SceneScale } from "@/hooks";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  computeVectorDotProduct,
  type VectorDotProductParams,
} from "@/math/vectorDotProduct";
import { isPolarGeomMode, paramMeta } from "@/data/registries/vectorDotProduct";

interface VectorDotProductSceneProps {
  params: VectorDotProductParams;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  onBatchParamsChange?: (updates: Record<string, number>) => void;
  fontScale: (size: number) => number;
  studyMode: "defProj" | "properties" | "polarization";
}

export const VectorDotProductScene: React.FC<VectorDotProductSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  onBatchParamsChange,
  fontScale,
  studyMode,
}) => {
  const mathRes = computeVectorDotProduct(params);

  const {
    a,
    b,
    normA,
    normB,
    angleDeg,
    projVecBtoA,
    footH,
    sumVec,
    isPerpendicular,
    midpointM,
  } = mathRes;

  const originDesign = mathToDesign(0, 0, scale);
  const posADesign = mathToDesign(a.x, a.y, scale);
  const posBDesign = mathToDesign(b.x, b.y, scale);
  const posHDesign = mathToDesign(footH.x, footH.y, scale);
  const posSDesign = mathToDesign(sumVec.x, sumVec.y, scale);
  const posMDesign = mathToDesign(midpointM.x, midpointM.y, scale);

  // 拖拽是否走极坐标：defProj 模式恒用极坐标几何定义（a 沿 x 轴，|a|/|b|/θ 驱动），
  // 判定规则与数据层同源（registries 的 isPolarGeomMode），严禁在此另立一套。
  const isPolarGeom = isPolarGeomMode(studyMode);

  // 合法拖拽区间 =「参数声明域 ∩ 中屏可见视口」：
  // 既不许把参数拖出滑块声明域（否则滑块与图形脱节），也不许拖出可视区域（否则点抓不回来）。
  const rangeXa = useMemo(
    () => paramDragRange(paramMeta.xa, scale, "x"),
    [scale],
  );
  const rangeYa = useMemo(
    () => paramDragRange(paramMeta.ya, scale, "y"),
    [scale],
  );
  const rangeXb = useMemo(
    () => paramDragRange(paramMeta.xb, scale, "x"),
    [scale],
  );
  const rangeYb = useMemo(
    () => paramDragRange(paramMeta.yb, scale, "y"),
    [scale],
  );
  const rangeNormA = useMemo(
    () => paramDragRange(paramMeta.normA, scale, "x"),
    [scale],
  );
  const rangeNormB = useMemo(
    () => paramDragRange(paramMeta.normB, scale, "x"),
    [scale],
  );
  const rangeTheta = useMemo(
    () => paramDragRange(paramMeta.thetaDeg, scale, "x"),
    [scale],
  );

  // 批量派发（优先走批量回调，避免两次 setState 造成中间态闪动）
  const applyParams = (updates: Record<string, number>) => {
    if (onBatchParamsChange) {
      onBatchParamsChange(updates);
    } else {
      Object.entries(updates).forEach(([k, v]) => onParamChange(k, v));
    }
  };

  // 拖拽 A 点 (数学坐标)
  const handleDragPointA = (pt: { x: number; y: number }) => {
    applyParams({
      xa: snapDragValue(pt.x, 0.5, rangeXa),
      ya: snapDragValue(pt.y, 0.5, rangeYa),
    });
  };

  // 拖拽 B 点 (数学坐标)
  const handleDragPointB = (pt: { x: number; y: number }) => {
    applyParams({
      xb: snapDragValue(pt.x, 0.5, rangeXb),
      yb: snapDragValue(pt.y, 0.5, rangeYb),
    });
  };

  // defProj 模式：a 恒沿 x 轴，拖 A 只能改 |a|（取指针的 x 投影）。
  // 旧实现把拖拽结果写回 (xa, ya)，随即被 usePolarGeom 覆盖 ⇒ A 是"假手柄"，拖动毫无反应。
  const handleDragPolarA = (pt: { x: number; y: number }) => {
    applyParams({ normA: snapDragValue(Math.abs(pt.x), 0.5, rangeNormA) });
  };

  // defProj 模式：拖 B 反解 |b| 与 θ（θ ∈ [0°, 180°]，下半平面按角的大小镜像回上半平面，
  // 保证"拖动"始终连续可见，而不是把角钳到 180° 让点飞到负半轴）。
  const handleDragPolarB = (pt: { x: number; y: number }) => {
    const normB = snapDragValue(Math.hypot(pt.x, pt.y), 0.5, rangeNormB);
    const rawDeg = Math.abs((Math.atan2(pt.y, pt.x) * 180) / Math.PI);
    applyParams({
      normB,
      thetaDeg: snapDragValue(rawDeg, 5, rangeTheta),
    });
  };

  // 计算夹角圆弧 (从 a 到 b)
  const renderAngleArc = () => {
    if (normA < 0.3 || normB < 0.3) return null;

    const angleA = Math.atan2(a.y, a.x);
    const angleB = Math.atan2(b.y, b.x);

    let delta = angleB - angleA;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;

    const radius = Math.min(36, Math.min(normA, normB) * scale.scaleX * 0.4);

    const startX = originDesign.x + radius * Math.cos(angleA);
    const startY = originDesign.y - radius * Math.sin(angleA); // SVG Y 翻转
    const endX = originDesign.x + radius * Math.cos(angleB);
    const endY = originDesign.y - radius * Math.sin(angleB);

    const largeArcFlag = Math.abs(delta) > Math.PI ? 1 : 0;
    const sweepFlag = delta > 0 ? 0 : 1;

    const midAngle = angleA + delta / 2;
    const labelRadius = radius + fontScale(15);
    const labelX = originDesign.x + labelRadius * Math.cos(midAngle);
    const labelY = originDesign.y - labelRadius * Math.sin(midAngle);

    return (
      <g>
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`}
          fill="none"
          stroke={MATH_COLORS.paramTertiary}
          strokeWidth={1.5}
          strokeDasharray="3,3"
        />
        <text
          x={labelX}
          y={labelY}
          fill={MATH_COLORS.paramTertiary}
          fontSize={fontScale(12)}
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="central"
          paintOrder="stroke"
          stroke={MATH_COLORS.white}
          strokeWidth={3}
        >
          {`θ = ${angleDeg.toFixed(0)}°`}
        </text>
      </g>
    );
  };

  // 渲染垂足处的直角标记 (Right Angle Indicator) - 固定 9~10px 防畸变
  // 路径构造统一走共享纯函数 rightAnglePath，避免各页面各写一套
  const renderRightAngleSymbol = (
    corner: { x: number; y: number },
    dir1: { x: number; y: number },
    dir2: { x: number; y: number },
  ) => {
    const d = rightAnglePath(corner, dir1, dir2);
    if (!d) return null;

    return (
      <path
        d={d}
        fill="none"
        stroke={MATH_COLORS.textMuted}
        strokeWidth={1.2}
      />
    );
  };

  return (
    <g>
      {/* 1. 坐标轴网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 2. 原点 O 标注 */}
      <text
        x={originDesign.x - fontScale(14)}
        y={originDesign.y + fontScale(16)}
        fill={MATH_COLORS.textMuted}
        fontSize={fontScale(13)}
        fontWeight="600"
        paintOrder="stroke"
        stroke={MATH_COLORS.white}
        strokeWidth={3}
      >
        O
      </text>

      {/* 3. 夹角扇形弧 */}
      {renderAngleArc()}

      {/* ===================== 模式一：几何定义与几何投影 ===================== */}
      {studyMode === "defProj" && (
        <>
          {/* OA 直线的全长延长线 (便于观看钝角投影) */}
          {normA > 1e-4 && (
            <line
              x1={originDesign.x - (posADesign.x - originDesign.x) * 3}
              y1={originDesign.y - (posADesign.y - originDesign.y) * 3}
              x2={originDesign.x + (posADesign.x - originDesign.x) * 3}
              y2={originDesign.y + (posADesign.y - originDesign.y) * 3}
              stroke={withAlpha(MATH_COLORS.paramPrimary, 0.25)}
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
          )}

          {/* B 点到 OA 直线的垂直投影虚线 (BH) */}
          {normA > 1e-4 && normB > 1e-4 && (
            <line
              x1={posBDesign.x}
              y1={posBDesign.y}
              x2={posHDesign.x}
              y2={posHDesign.y}
              stroke={withAlpha(MATH_COLORS.paramSecondary, 0.8)}
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
          )}

          {/* 垂足 H 处的直角标记 */}
          {normA > 1e-4 &&
            normB > 1e-4 &&
            renderRightAngleSymbol(
              posHDesign,
              {
                x: posBDesign.x - posHDesign.x,
                y: posBDesign.y - posHDesign.y,
              },
              {
                x: originDesign.x - posHDesign.x,
                y: originDesign.y - posHDesign.y,
              },
            )}

          {/* 投影向量 p = proj_a(b) */}
          {normA > 1e-4 && Math.hypot(projVecBtoA.x, projVecBtoA.y) > 1e-4 && (
            <VectorArrow
              from={[0, 0]}
              to={[projVecBtoA.x, projVecBtoA.y]}
              scale={scale}
              color={MATH_COLORS.paramTertiary}
              strokeWidth={4}
              fontScale={fontScale}
              label="p"
              labelOffset={[0, -10]}
            />
          )}

          {/* 垂足 H 点标注 */}
          {normA > 1e-4 && (
            <MathPoint
              x={posHDesign.x}
              y={posHDesign.y}
              variant="foot"
              color={MATH_COLORS.paramTertiary}
              label="H"
              labelPosition="bottom-right"
              fontScale={fontScale}
            />
          )}

          {/* 基础向量 a (OA) */}
          <VectorArrow
            from={[0, 0]}
            to={[a.x, a.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={3}
            fontScale={fontScale}
            label="a"
            labelOffset={[0, -10]}
          />

          {/* 基础向量 b (OB) */}
          <VectorArrow
            from={[0, 0]}
            to={[b.x, b.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={3}
            fontScale={fontScale}
            label="b"
            labelOffset={[0, -10]}
          />

          {/* 交互控制点 A 和 B */}
          <InteractivePoint
            cx={a.x}
            cy={a.y}
            scale={scale}
            vp={vp}
            // defProj 模式下 a 恒沿 x 轴 ⇒ A 只允许水平拖动（改 |a|），且横向界限即 |a| 的声明域；
            // 其余模式自由拖动，受「声明域 ∩ 可见视口」双向钳制。
            axis={isPolarGeom ? "x" : "both"}
            xRange={isPolarGeom ? rangeNormA : rangeXa}
            yRange={isPolarGeom ? undefined : rangeYa}
            onDrag={isPolarGeom ? handleDragPolarA : handleDragPointA}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
            label="A"
          />
          <InteractivePoint
            cx={b.x}
            cy={b.y}
            scale={scale}
            vp={vp}
            // defProj 模式下 B 由 (|b|, θ) 反解，界限在回调内按极坐标钳制，故此处不再限制平面坐标。
            xRange={isPolarGeom ? undefined : rangeXb}
            yRange={isPolarGeom ? undefined : rangeYb}
            onDrag={isPolarGeom ? handleDragPolarB : handleDragPointB}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
            label="B"
          />
        </>
      )}

      {/* ===================== 模式二：坐标表示、模长与垂直条件 ===================== */}
      {studyMode === "properties" && (
        <>
          {/* 平行四边形虚线边 A -> S */}
          <line
            x1={posADesign.x}
            y1={posADesign.y}
            x2={posSDesign.x}
            y2={posSDesign.y}
            stroke={withAlpha(MATH_COLORS.paramSecondary, 0.5)}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />

          {/* 平行四边形虚线边 B -> S */}
          <line
            x1={posBDesign.x}
            y1={posBDesign.y}
            x2={posSDesign.x}
            y2={posSDesign.y}
            stroke={withAlpha(MATH_COLORS.paramPrimary, 0.5)}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />

          {/* 和向量顶点 S */}
          <MathPoint
            x={posSDesign.x}
            y={posSDesign.y}
            color={MATH_COLORS.paramTertiary}
            label="S"
            labelPosition="top-right"
            fontScale={fontScale}
          />

          {/* 和向量 s = a + b (O -> S) */}
          <VectorArrow
            from={[0, 0]}
            to={[sumVec.x, sumVec.y]}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={3.5}
            fontScale={fontScale}
            label="a+b"
            labelOffset={[0, -10]}
          />

          {/* 差向量 d = a - b (从 B 点指向 A 点: BA = OA - OB) */}
          <VectorArrow
            from={[b.x, b.y]}
            to={[a.x, a.y]}
            scale={scale}
            color={MATH_COLORS.accent}
            strokeWidth={2.5}
            fontScale={fontScale}
            label="a-b"
            labelOffset={[0, -10]}
          />

          {/* 垂直高亮标识 */}
          {isPerpendicular && (
            <g>
              {renderRightAngleSymbol(
                originDesign,
                {
                  x: posADesign.x - originDesign.x,
                  y: posADesign.y - originDesign.y,
                },
                {
                  x: posBDesign.x - originDesign.x,
                  y: posBDesign.y - originDesign.y,
                },
              )}
              <text
                x={originDesign.x + fontScale(16)}
                y={originDesign.y - fontScale(16)}
                fill={MATH_COLORS.paramTertiary}
                fontSize={fontScale(14)}
                fontWeight="bold"
                paintOrder="stroke"
                stroke={MATH_COLORS.white}
                strokeWidth={3}
              >
                a ⊥ b (a · b = 0)
              </text>
            </g>
          )}

          {/* 基础向量 a */}
          <VectorArrow
            from={[0, 0]}
            to={[a.x, a.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={3}
            fontScale={fontScale}
            label="a"
            labelOffset={[0, -10]}
          />

          {/* 基础向量 b */}
          <VectorArrow
            from={[0, 0]}
            to={[b.x, b.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={3}
            fontScale={fontScale}
            label="b"
            labelOffset={[0, -10]}
          />

          {/* 交互控制点 A 和 B */}
          <InteractivePoint
            cx={a.x}
            cy={a.y}
            scale={scale}
            vp={vp}
            // defProj 模式下 a 恒沿 x 轴 ⇒ A 只允许水平拖动（改 |a|），且横向界限即 |a| 的声明域；
            // 其余模式自由拖动，受「声明域 ∩ 可见视口」双向钳制。
            axis={isPolarGeom ? "x" : "both"}
            xRange={isPolarGeom ? rangeNormA : rangeXa}
            yRange={isPolarGeom ? undefined : rangeYa}
            onDrag={isPolarGeom ? handleDragPolarA : handleDragPointA}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
            label="A"
          />
          <InteractivePoint
            cx={b.x}
            cy={b.y}
            scale={scale}
            vp={vp}
            // defProj 模式下 B 由 (|b|, θ) 反解，界限在回调内按极坐标钳制，故此处不再限制平面坐标。
            xRange={isPolarGeom ? undefined : rangeXb}
            yRange={isPolarGeom ? undefined : rangeYb}
            onDrag={isPolarGeom ? handleDragPolarB : handleDragPointB}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
            label="B"
          />
        </>
      )}

      {/* ===================== 模式三：极化恒等式与高考中点公式 ===================== */}
      {studyMode === "polarization" && (
        <>
          {/* 线段 AB */}
          <line
            x1={posADesign.x}
            y1={posADesign.y}
            x2={posBDesign.x}
            y2={posBDesign.y}
            stroke={withAlpha(MATH_COLORS.accent, 0.6)}
            strokeWidth={2}
          />

          {/* 平行四边形两条对角线: 和向量 (O -> S) 辅助线 */}
          <line
            x1={originDesign.x}
            y1={originDesign.y}
            x2={posSDesign.x}
            y2={posSDesign.y}
            stroke={withAlpha(MATH_COLORS.paramTertiary, 0.4)}
            strokeWidth={2}
            strokeDasharray="5,4"
          />

          {/* 中点向量 OM */}
          <VectorArrow
            from={[0, 0]}
            to={[midpointM.x, midpointM.y]}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={3.5}
            fontScale={fontScale}
            label="OM"
            labelOffset={[0, -10]}
          />

          {/* 中点 M 标记 */}
          <MathPoint
            x={posMDesign.x}
            y={posMDesign.y}
            color={MATH_COLORS.paramTertiary}
            label="M (中点)"
            labelPosition="top-right"
            fontScale={fontScale}
          />

          {/* 基础向量 OA */}
          <VectorArrow
            from={[0, 0]}
            to={[a.x, a.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={3}
            fontScale={fontScale}
            label="OA"
            labelOffset={[0, -10]}
          />

          {/* 基础向量 OB */}
          <VectorArrow
            from={[0, 0]}
            to={[b.x, b.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={3}
            fontScale={fontScale}
            label="OB"
            labelOffset={[0, -10]}
          />

          {/* 交互控制点 A 和 B */}
          <InteractivePoint
            cx={a.x}
            cy={a.y}
            scale={scale}
            vp={vp}
            // defProj 模式下 a 恒沿 x 轴 ⇒ A 只允许水平拖动（改 |a|），且横向界限即 |a| 的声明域；
            // 其余模式自由拖动，受「声明域 ∩ 可见视口」双向钳制。
            axis={isPolarGeom ? "x" : "both"}
            xRange={isPolarGeom ? rangeNormA : rangeXa}
            yRange={isPolarGeom ? undefined : rangeYa}
            onDrag={isPolarGeom ? handleDragPolarA : handleDragPointA}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
            label="A"
          />
          <InteractivePoint
            cx={b.x}
            cy={b.y}
            scale={scale}
            vp={vp}
            // defProj 模式下 B 由 (|b|, θ) 反解，界限在回调内按极坐标钳制，故此处不再限制平面坐标。
            xRange={isPolarGeom ? undefined : rangeXb}
            yRange={isPolarGeom ? undefined : rangeYb}
            onDrag={isPolarGeom ? handleDragPolarB : handleDragPointB}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
            label="B"
          />
        </>
      )}
    </g>
  );
};
