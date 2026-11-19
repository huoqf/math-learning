import React, { useMemo } from "react";
import {
  CoordinateGrid,
  InteractivePoint,
  MathPoint,
  SceneLabelGroup,
} from "@/components/Math";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { paramDragBounds } from "@/utils/paramClamp";
import type { LabelItem } from "@/utils/labelOverlap";
import {
  calcLocusTransfer,
  calcThirdDefinition,
  calcFixedPointModel,
  type LocusStudyMode,
  type ThirdDefCurveType,
} from "@/math/conicLocusInvariants";

interface ConicLocusInvariantsSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (v: number) => number;
  studyMode: LocusStudyMode;
  curveType: ThirdDefCurveType;
  activeStep?: number;
  onParamChange: (key: string, value: number) => void;
}

export const ConicLocusInvariantsScene: React.FC<
  ConicLocusInvariantsSceneProps
> = ({
  params,
  scale,
  vp,
  fontScale,
  studyMode,
  curveType,
  activeStep,
  onParamChange,
}) => {
  const a = params.a ?? 3.5;
  const b = params.b ?? 2.0;
  const thetaDeg = params.thetaDeg ?? 50;
  const slopeInvM = params.slopeInvM ?? 0.45;

  const regionOpacity = (region: 1 | 2 | 3) =>
    activeStep === undefined || activeStep === region ? 1 : 0.3;

  const locusRes = useMemo(
    () => calcLocusTransfer(a, b, thetaDeg),
    [a, b, thetaDeg],
  );
  const thirdRes = useMemo(
    () => calcThirdDefinition(curveType, a, b, thetaDeg),
    [curveType, a, b, thetaDeg],
  );
  const fixedRes = useMemo(
    () => calcFixedPointModel(a, b, slopeInvM),
    [a, b, slopeInvM],
  );

  const effA =
    studyMode === "locusTransfer"
      ? locusRes.a
      : studyMode === "thirdDefinition"
        ? thirdRes.a
        : fixedRes.a;
  const effB =
    studyMode === "locusTransfer"
      ? locusRes.b
      : studyMode === "thirdDefinition"
        ? thirdRes.b
        : fixedRes.b;

  const originD = mathToDesign(0, 0, scale);

  // 双曲线路径采样 (第三定义双曲线模式)
  const hyperbolaPaths = useMemo(() => {
    if (studyMode !== "thirdDefinition" || curveType !== "hyperbola") return [];
    const steps = 60;
    const tMax = 1.2;
    const rightPts: string[] = [];
    const leftPts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const tVal = -tMax + (i / steps) * 2 * tMax;
      const rx = effA / Math.cos(tVal);
      const ry = effB * Math.tan(tVal);
      const rD = mathToDesign(rx, ry, scale);
      const lD = mathToDesign(-rx, ry, scale);
      rightPts.push(
        `${i === 0 ? "M" : "L"} ${rD.x.toFixed(1)},${rD.y.toFixed(1)}`,
      );
      leftPts.push(
        `${i === 0 ? "M" : "L"} ${lD.x.toFixed(1)},${lD.y.toFixed(1)}`,
      );
    }
    return [rightPts.join(" "), leftPts.join(" ")];
  }, [studyMode, curveType, effA, effB, scale]);

  // 点拖拽边界（遵守 paramClamp SSOT）
  const pointDragBounds = useMemo(
    () => paramDragBounds({ min: -6, max: 6 }, { min: -4.5, max: 4.5 }, scale),
    [scale],
  );

  // 点标签集合（全部经 SceneLabelGroup 8向避让排布）
  const labelItems = useMemo<LabelItem[]>(() => {
    const items: LabelItem[] = [];
    if (studyMode === "locusTransfer") {
      const p0D = mathToDesign(locusRes.P0.x, locusRes.P0.y, scale);
      const pD = mathToDesign(locusRes.P.x, locusRes.P.y, scale);
      const hD = mathToDesign(locusRes.footX.x, locusRes.footX.y, scale);
      items.push(
        {
          key: "P0",
          text: "P₀",
          x: p0D.x,
          y: p0D.y,
          color: MATH_COLORS.paramTertiary,
        },
        {
          key: "P",
          text: "P",
          x: pD.x,
          y: pD.y,
          color: MATH_COLORS.paramPrimary,
        },
        {
          key: "H",
          text: "H",
          x: hD.x,
          y: hD.y,
          color: MATH_COLORS.line,
        },
      );
    } else if (studyMode === "thirdDefinition") {
      const aD = mathToDesign(thirdRes.A.x, thirdRes.A.y, scale);
      const bD = mathToDesign(thirdRes.B.x, thirdRes.B.y, scale);
      const pD = mathToDesign(thirdRes.P.x, thirdRes.P.y, scale);
      items.push(
        {
          key: "A",
          text: "A",
          x: aD.x,
          y: aD.y,
          color: MATH_COLORS.paramPrimary,
        },
        {
          key: "B",
          text: "B",
          x: bD.x,
          y: bD.y,
          color: MATH_COLORS.paramSecondary,
        },
        {
          key: "P",
          text: "P",
          x: pD.x,
          y: pD.y,
          color: MATH_COLORS.paramTertiary,
        },
      );
    } else {
      const a0D = mathToDesign(fixedRes.A0.x, fixedRes.A0.y, scale);
      const qD = mathToDesign(fixedRes.Q.x, fixedRes.Q.y, scale);
      items.push(
        {
          key: "A0",
          text: "A₀",
          x: a0D.x,
          y: a0D.y,
          color: MATH_COLORS.paramPrimary,
        },
        {
          key: "Q",
          text: "Q",
          x: qD.x,
          y: qD.y,
          color: MATH_COLORS.paramSecondary,
        },
      );
      if (fixedRes.A && fixedRes.B) {
        const aD = mathToDesign(fixedRes.A.x, fixedRes.A.y, scale);
        const bD = mathToDesign(fixedRes.B.x, fixedRes.B.y, scale);
        items.push(
          {
            key: "A",
            text: "A",
            x: aD.x,
            y: aD.y,
            color: MATH_COLORS.paramTertiary,
          },
          {
            key: "B",
            text: "B",
            x: bD.x,
            y: bD.y,
            color: MATH_COLORS.paramTertiary,
          },
        );
      }
    }
    return items;
  }, [studyMode, locusRes, thirdRes, fixedRes, scale]);

  const handleThetaDrag = (pt: { x: number; y: number }) => {
    if (studyMode === "locusTransfer" || curveType === "ellipse") {
      let deg = (Math.atan2(pt.y / effB, pt.x / effA) * 180) / Math.PI;
      if (deg < 0) deg += 360;
      const clamped = Math.max(15, Math.min(345, Math.round(deg)));
      onParamChange("thetaDeg", clamped);
    } else {
      const tVal = Math.atan2(pt.y, effB);
      const deg = 180 + (tVal / 1.12) * 180;
      const clamped = Math.max(15, Math.min(345, Math.round(deg)));
      onParamChange("thetaDeg", clamped);
    }
  };

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* 模式 1：相关点转移法 */}
      {studyMode === "locusTransfer" && (
        <>
          <g opacity={regionOpacity(1)}>
            {/* 辅助基准圆 x^2 + y^2 = a^2 */}
            <circle
              cx={originD.x}
              cy={originD.y}
              r={locusRes.a * scale.scaleX}
              fill="none"
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={1.8}
              strokeDasharray="5 4"
            />
            <MathPoint
              cx={locusRes.footX.x}
              cy={locusRes.footX.y}
              scale={scale}
              color={MATH_COLORS.line}
              fontScale={fontScale}
            />
          </g>

          <g opacity={regionOpacity(2)}>
            {/* 垂直压缩映射连线 P0 -> P -> H */}
            {(() => {
              const p0D = mathToDesign(locusRes.P0.x, locusRes.P0.y, scale);
              const hD = mathToDesign(
                locusRes.footX.x,
                locusRes.footX.y,
                scale,
              );
              return (
                <line
                  x1={p0D.x}
                  y1={p0D.y}
                  x2={hD.x}
                  y2={hD.y}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              );
            })()}
            <MathPoint
              cx={locusRes.P0.x}
              cy={locusRes.P0.y}
              scale={scale}
              color={MATH_COLORS.paramTertiary}
              fontScale={fontScale}
            />
          </g>

          <g opacity={regionOpacity(3)}>
            {/* 转移生成的目标椭圆 */}
            <ellipse
              cx={originD.x}
              cy={originD.y}
              rx={locusRes.a * scale.scaleX}
              ry={locusRes.b * scale.scaleY}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.05)}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={2.5}
            />
            <InteractivePoint
              cx={locusRes.P.x}
              cy={locusRes.P.y}
              scale={scale}
              vp={vp}
              {...pointDragBounds}
              edgeClampProjection
              color={MATH_COLORS.paramPrimary}
              fontScale={fontScale}
              onDrag={handleThetaDrag}
            />
          </g>
        </>
      )}

      {/* 模式 2：椭圆/双曲线第三定义 */}
      {studyMode === "thirdDefinition" && (
        <>
          <g opacity={regionOpacity(1)}>
            {curveType === "ellipse" ? (
              <ellipse
                cx={originD.x}
                cy={originD.y}
                rx={thirdRes.a * scale.scaleX}
                ry={thirdRes.b * scale.scaleY}
                fill="none"
                stroke={MATH_COLORS.primary}
                strokeWidth={2.5}
              />
            ) : (
              hyperbolaPaths.map((dStr, idx) => (
                <path
                  key={idx}
                  d={dStr}
                  fill="none"
                  stroke={MATH_COLORS.primary}
                  strokeWidth={2.5}
                />
              ))
            )}
            <MathPoint
              cx={thirdRes.A.x}
              cy={thirdRes.A.y}
              scale={scale}
              color={MATH_COLORS.paramPrimary}
              fontScale={fontScale}
            />
            <MathPoint
              cx={thirdRes.B.x}
              cy={thirdRes.B.y}
              scale={scale}
              color={MATH_COLORS.paramSecondary}
              fontScale={fontScale}
            />
          </g>

          <g opacity={regionOpacity(2)}>
            {(() => {
              const aD = mathToDesign(thirdRes.A.x, thirdRes.A.y, scale);
              const bD = mathToDesign(thirdRes.B.x, thirdRes.B.y, scale);
              const pD = mathToDesign(thirdRes.P.x, thirdRes.P.y, scale);
              return (
                <>
                  <line
                    x1={aD.x}
                    y1={aD.y}
                    x2={pD.x}
                    y2={pD.y}
                    stroke={MATH_COLORS.paramPrimary}
                    strokeWidth={2.2}
                  />
                  <line
                    x1={bD.x}
                    y1={bD.y}
                    x2={pD.x}
                    y2={pD.y}
                    stroke={MATH_COLORS.paramSecondary}
                    strokeWidth={2.2}
                  />
                </>
              );
            })()}
          </g>

          <g opacity={regionOpacity(3)}>
            {(() => {
              const aD = mathToDesign(thirdRes.A.x, thirdRes.A.y, scale);
              const bD = mathToDesign(thirdRes.B.x, thirdRes.B.y, scale);
              const pD = mathToDesign(thirdRes.P.x, thirdRes.P.y, scale);
              return (
                <polygon
                  points={`${aD.x},${aD.y} ${bD.x},${bD.y} ${pD.x},${pD.y}`}
                  fill={withAlpha(MATH_COLORS.paramTertiary, 0.12)}
                />
              );
            })()}
            <InteractivePoint
              cx={thirdRes.P.x}
              cy={thirdRes.P.y}
              scale={scale}
              vp={vp}
              {...pointDragBounds}
              edgeClampProjection
              color={MATH_COLORS.paramTertiary}
              fontScale={fontScale}
              onDrag={handleThetaDrag}
            />
          </g>
        </>
      )}

      {/* 模式 3：标内普通联立先猜后证过定点 */}
      {studyMode === "fixedPoint" && (
        <>
          <g opacity={regionOpacity(1)}>
            <ellipse
              cx={originD.x}
              cy={originD.y}
              rx={fixedRes.a * scale.scaleX}
              ry={fixedRes.b * scale.scaleY}
              fill="none"
              stroke={MATH_COLORS.primary}
              strokeWidth={2.5}
            />
            <MathPoint
              cx={fixedRes.A0.x}
              cy={fixedRes.A0.y}
              scale={scale}
              color={MATH_COLORS.paramPrimary}
              fontScale={fontScale}
            />
            <MathPoint
              cx={fixedRes.Q.x}
              cy={fixedRes.Q.y}
              scale={scale}
              color={MATH_COLORS.paramSecondary}
              fontScale={fontScale}
            />
          </g>

          {fixedRes.A && fixedRes.B && (
            <>
              <g opacity={regionOpacity(2)}>
                {(() => {
                  const p1 = mathToDesign(
                    fixedRes.slopeN * 4.5 + fixedRes.Q.x,
                    4.5,
                    scale,
                  );
                  const p2 = mathToDesign(
                    fixedRes.slopeN * -4.5 + fixedRes.Q.x,
                    -4.5,
                    scale,
                  );
                  return (
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={MATH_COLORS.paramSecondary}
                      strokeWidth={2}
                      strokeDasharray="5 3"
                    />
                  );
                })()}
                <MathPoint
                  cx={fixedRes.A.x}
                  cy={fixedRes.A.y}
                  scale={scale}
                  color={MATH_COLORS.paramTertiary}
                  fontScale={fontScale}
                />
                <MathPoint
                  cx={fixedRes.B.x}
                  cy={fixedRes.B.y}
                  scale={scale}
                  color={MATH_COLORS.paramTertiary}
                  fontScale={fontScale}
                />
              </g>

              <g opacity={regionOpacity(3)}>
                {(() => {
                  const a0D = mathToDesign(fixedRes.A0.x, fixedRes.A0.y, scale);
                  const aD = mathToDesign(fixedRes.A.x, fixedRes.A.y, scale);
                  const bD = mathToDesign(fixedRes.B.x, fixedRes.B.y, scale);
                  return (
                    <>
                      <polygon
                        points={`${a0D.x},${a0D.y} ${aD.x},${aD.y} ${bD.x},${bD.y}`}
                        fill={withAlpha(MATH_COLORS.paramPrimary, 0.1)}
                      />
                      <line
                        x1={a0D.x}
                        y1={a0D.y}
                        x2={aD.x}
                        y2={aD.y}
                        stroke={MATH_COLORS.paramPrimary}
                        strokeWidth={2.2}
                      />
                      <line
                        x1={a0D.x}
                        y1={a0D.y}
                        x2={bD.x}
                        y2={bD.y}
                        stroke={MATH_COLORS.paramPrimary}
                        strokeWidth={2.2}
                      />
                    </>
                  );
                })()}
              </g>
            </>
          )}
        </>
      )}

      {/* 分步作答三处同源聚光围栏 */}
      {activeStep !== undefined && (
        <rect
          x={originD.x - (effA + 1.2) * scale.scaleX}
          y={originD.y - (effA + 0.8) * scale.scaleY}
          width={2 * (effA + 1.2) * scale.scaleX}
          height={2 * (effA + 0.8) * scale.scaleY}
          rx={10}
          fill="none"
          stroke={MATH_COLORS.answerStepFrame}
          strokeWidth={2}
          strokeDasharray="7 4"
          className="pointer-events-none"
        />
      )}

      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
};
