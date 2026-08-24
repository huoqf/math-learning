import React, { useMemo } from "react";
import {
  CoordinateGrid,
  Asymptote,
  InteractivePoint,
  MathPoint,
} from "@/components/Math";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import {
  calculateConicProperties,
  type ConicType,
} from "../math/conicProperties";

interface ConicPropertiesSceneProps {
  params: {
    a: number;
    b: number;
    e: number;
    t: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  studyMode: "basicProperties" | "eccentricity" | "focusTriangle";
  conicType: ConicType;
  onParamChange: (key: string, value: number) => void;
}

export const ConicPropertiesScene: React.FC<ConicPropertiesSceneProps> = ({
  params,
  scale,
  vp,
  fontScale,
  studyMode,
  conicType,
  onParamChange,
}) => {
  // 数学计算结果
  const calcResult = useMemo(
    () => calculateConicProperties(conicType, params.a, params.b, params.t),
    [conicType, params.a, params.b, params.t],
  );

  const {
    a,
    b,
    c,
    foci,
    vertices,
    directrices,
    latusRectum,
    pointP,
    focusTriangle,
  } = calcResult;

  // 映射设计坐标
  const originPt = mathToDesign(0, 0, scale);
  const f1Pt = mathToDesign(foci.F1.x, foci.F1.y, scale);
  const f2Pt = mathToDesign(foci.F2.x, foci.F2.y, scale);
  const b2Pt = mathToDesign(vertices.B2.x, vertices.B2.y, scale);
  const pPt = mathToDesign(pointP.x, pointP.y, scale);

  // 1. 生成曲线 SVG 路径
  const curvePaths = useMemo(() => {
    if (conicType === "ellipse") {
      const steps = 120;
      const pts: string[] = [];
      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * Math.PI * 2;
        const x = a * Math.cos(theta);
        const y = b * Math.sin(theta);
        const dPt = mathToDesign(x, y, scale);
        pts.push(
          `${i === 0 ? "M" : "L"} ${dPt.x.toFixed(1)},${dPt.y.toFixed(1)}`,
        );
      }
      return [pts.join(" ")];
    } else {
      // 双曲线：右支与左支
      const steps = 60;
      const tMax = 1.35;
      const rightPts: string[] = [];
      const leftPts: string[] = [];

      for (let i = 0; i <= steps; i++) {
        const tVal = -tMax + (i / steps) * 2 * tMax;
        const secT = 1 / Math.cos(tVal);
        const tanT = Math.tan(tVal);

        // 右支
        const rx = a * secT;
        const ry = b * tanT;
        const rPt = mathToDesign(rx, ry, scale);
        rightPts.push(
          `${i === 0 ? "M" : "L"} ${rPt.x.toFixed(1)},${rPt.y.toFixed(1)}`,
        );

        // 左支
        const lx = -a * secT;
        const ly = b * tanT;
        const lPt = mathToDesign(lx, ly, scale);
        leftPts.push(
          `${i === 0 ? "M" : "L"} ${lPt.x.toFixed(1)},${lPt.y.toFixed(1)}`,
        );
      }
      return [rightPts.join(" "), leftPts.join(" ")];
    }
  }, [conicType, a, b, scale]);

  // 2. 双曲线特征矩形与辅助外接圆
  const rectPts = useMemo(() => {
    if (conicType !== "hyperbola") return null;
    const p1 = mathToDesign(a, b, scale);
    const p2 = mathToDesign(-a, b, scale);
    const p3 = mathToDesign(-a, -b, scale);
    const p4 = mathToDesign(a, -b, scale);
    return { p1, p2, p3, p4 };
  }, [conicType, a, b, scale]);

  const auxCircleRadiusPx = useMemo(() => {
    if (conicType !== "hyperbola") return 0;
    return c * scale.scaleX;
  }, [conicType, c, scale.scaleX]);

  // 通径线段点
  const lrTopPt = mathToDesign(
    latusRectum.points.top.x,
    latusRectum.points.top.y,
    scale,
  );
  const lrBotPt = mathToDesign(
    latusRectum.points.bottom.x,
    latusRectum.points.bottom.y,
    scale,
  );

  return (
    <g className="conic-properties-scene">
      {/* 坐标轴与网格 (解析几何默认纯净背景) */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* 渐近线 (仅双曲线) */}
      {conicType === "hyperbola" && (
        <>
          <Asymptote
            type="oblique"
            value={b / a}
            intercept={0}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            label="y = (b/a)x"
            fontScale={fontScale}
          />
          <Asymptote
            type="oblique"
            value={-b / a}
            intercept={0}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            label="y = -(b/a)x"
            fontScale={fontScale}
          />
        </>
      )}

      {/* 准线 (在 eccentricity 模式中高亮展示) */}
      {studyMode === "eccentricity" && (
        <>
          <Asymptote
            type="vertical"
            value={directrices.leftX}
            scale={scale}
            color={MATH_COLORS.primary}
            label="x = -a²/c"
            fontScale={fontScale}
          />
          <Asymptote
            type="vertical"
            value={directrices.rightX}
            scale={scale}
            color={MATH_COLORS.primary}
            label="x = a²/c"
            fontScale={fontScale}
          />
        </>
      )}

      {/* 特征图形 (模式 1: basicProperties) */}
      {studyMode === "basicProperties" && (
        <>
          {conicType === "ellipse" ? (
            // 椭圆特征直角三角形: (0,0) - (c,0) - (0,b) - (0,0)
            <g className="ellipse-feature-triangle">
              <polygon
                points={`${originPt.x},${originPt.y} ${f2Pt.x},${f2Pt.y} ${b2Pt.x},${b2Pt.y}`}
                fill={withAlpha(MATH_COLORS.paramPrimary, 0.12)}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              {/* 斜边 a (0,b) -> (c,0) */}
              <line
                x1={b2Pt.x}
                y1={b2Pt.y}
                x2={f2Pt.x}
                y2={f2Pt.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={2.5}
              />
              <text
                x={(b2Pt.x + f2Pt.x) / 2 + 8}
                y={(b2Pt.y + f2Pt.y) / 2 - 6}
                fill={MATH_COLORS.paramPrimary}
                fontSize={fontScale(13)}
                fontWeight="bold"
                paintOrder="stroke"
                stroke="white"
                strokeWidth={3}
              >
                a (斜边)
              </text>
              {/* 直角边 b */}
              <text
                x={originPt.x - 14}
                y={(originPt.y + b2Pt.y) / 2}
                fill={MATH_COLORS.paramSecondary}
                fontSize={fontScale(12)}
                fontWeight="bold"
                paintOrder="stroke"
                stroke="white"
                strokeWidth={3}
              >
                b
              </text>
              {/* 直角边 c */}
              <text
                x={(originPt.x + f2Pt.x) / 2}
                y={originPt.y + 16}
                fill={MATH_COLORS.paramTertiary}
                fontSize={fontScale(12)}
                fontWeight="bold"
                paintOrder="stroke"
                stroke="white"
                strokeWidth={3}
              >
                c
              </text>
            </g>
          ) : (
            // 双曲线特征矩形与辅助圆
            rectPts && (
              <g className="hyperbola-feature-box">
                <circle
                  cx={originPt.x}
                  cy={originPt.y}
                  r={auxCircleRadiusPx}
                  fill="none"
                  stroke={withAlpha(MATH_COLORS.paramTertiary, 0.4)}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
                <polygon
                  points={`${rectPts.p1.x},${rectPts.p1.y} ${rectPts.p2.x},${rectPts.p2.y} ${rectPts.p3.x},${rectPts.p3.y} ${rectPts.p4.x},${rectPts.p4.y}`}
                  fill={withAlpha(MATH_COLORS.paramSecondary, 0.08)}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
                <text
                  x={rectPts.p1.x + 4}
                  y={rectPts.p1.y - 4}
                  fill={MATH_COLORS.paramSecondary}
                  fontSize={fontScale(11)}
                  paintOrder="stroke"
                  stroke="white"
                  strokeWidth={3}
                >
                  (a, b)
                </text>
              </g>
            )
          )}
        </>
      )}

      {/* 离心率与通径 (模式 2: eccentricity) */}
      {studyMode === "eccentricity" && (
        <g className="latus-rectum-group">
          <line
            x1={lrTopPt.x}
            y1={lrTopPt.y}
            x2={lrBotPt.x}
            y2={lrBotPt.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={3}
          />
          <MathPoint
            cx={latusRectum.points.top.x}
            cy={latusRectum.points.top.y}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            r={3.5}
          />
          <MathPoint
            cx={latusRectum.points.bottom.x}
            cy={latusRectum.points.bottom.y}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            r={3.5}
          />
          <text
            x={lrTopPt.x + 8}
            y={(lrTopPt.y + lrBotPt.y) / 2}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(12)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
          >
            通径 L = {((2 * b * b) / a).toFixed(2)}
          </text>
        </g>
      )}

      {/* 核心曲线 Path */}
      {curvePaths.map((dStr, idx) => (
        <path
          key={idx}
          d={dStr}
          fill="none"
          stroke={MATH_COLORS.primary}
          strokeWidth={2.5}
        />
      ))}

      {/* 焦点三角形 \triangle PF_1F_2 */}
      {(studyMode === "focusTriangle" || studyMode === "basicProperties") && (
        <g className="focus-triangle-group">
          <polygon
            points={`${f1Pt.x},${f1Pt.y} ${f2Pt.x},${f2Pt.y} ${pPt.x},${pPt.y}`}
            fill={withAlpha(MATH_COLORS.primary, 0.15)}
            stroke={MATH_COLORS.primary}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <line
            x1={pPt.x}
            y1={pPt.y}
            x2={f1Pt.x}
            y2={f1Pt.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
          />
          <line
            x1={pPt.x}
            y1={pPt.y}
            x2={f2Pt.x}
            y2={f2Pt.y}
            stroke={MATH_COLORS.primary}
            strokeWidth={2}
          />
          <text
            x={(pPt.x + f1Pt.x) / 2 - 10}
            y={(pPt.y + f1Pt.y) / 2 - 6}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(11)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
          >
            r₁={focusTriangle.r1.toFixed(2)}
          </text>
          <text
            x={(pPt.x + f2Pt.x) / 2 + 10}
            y={(pPt.y + f2Pt.y) / 2 - 6}
            fill={MATH_COLORS.primary}
            fontSize={fontScale(11)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
          >
            r₂={focusTriangle.r2.toFixed(2)}
          </text>
          <text
            x={pPt.x}
            y={pPt.y - 12}
            textAnchor="middle"
            fill={MATH_COLORS.primary}
            fontSize={fontScale(12)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
          >
            θ = {focusTriangle.angleDeg.toFixed(1)}°
          </text>

          {/* 焦点三角形内切圆与内心 */}
          {focusTriangle.incircle && focusTriangle.incircle.inradius > 0.05 && (
            <g className="incircle-layer">
              {(() => {
                const inc = focusTriangle.incircle;
                const incenterD = mathToDesign(
                  inc.incenter.x,
                  inc.incenter.y,
                  scale,
                );
                const inradiusPx = inc.inradius * scale.scaleX;

                return (
                  <>
                    {/* 内切圆 */}
                    <circle
                      cx={incenterD.x}
                      cy={incenterD.y}
                      r={inradiusPx}
                      fill={withAlpha(MATH_COLORS.paramTertiary, 0.18)}
                      stroke={MATH_COLORS.paramTertiary}
                      strokeWidth={1.8}
                      strokeDasharray="4 3"
                    />
                    {/* 内心 I */}
                    <MathPoint
                      cx={inc.incenter.x}
                      cy={inc.incenter.y}
                      scale={scale}
                      color={MATH_COLORS.paramTertiary}
                      label="I"
                      labelPosition="top-right"
                      fontScale={fontScale}
                    />

                    {/* 底边切点 T */}
                    <MathPoint
                      cx={inc.tangentBase.x}
                      cy={inc.tangentBase.y}
                      scale={scale}
                      color={MATH_COLORS.paramPrimary}
                      label="T"
                      labelPosition="bottom"
                      fontScale={fontScale}
                    />
                  </>
                );
              })()}
            </g>
          )}
        </g>
      )}

      {/* 顶点标注 (使用标准 MathPoint 与学术单字母) */}
      <MathPoint
        cx={vertices.A1.x}
        cy={vertices.A1.y}
        scale={scale}
        color={MATH_COLORS.primary}
        label="A₁"
        labelPosition="left"
        fontScale={fontScale}
      />
      <MathPoint
        cx={vertices.A2.x}
        cy={vertices.A2.y}
        scale={scale}
        color={MATH_COLORS.primary}
        label="A₂"
        labelPosition="right"
        fontScale={fontScale}
      />

      <MathPoint
        cx={vertices.B1.x}
        cy={vertices.B1.y}
        scale={scale}
        color={MATH_COLORS.paramSecondary}
        label="B₁"
        labelPosition="bottom"
        fontScale={fontScale}
      />
      <MathPoint
        cx={vertices.B2.x}
        cy={vertices.B2.y}
        scale={scale}
        color={MATH_COLORS.paramSecondary}
        label="B₂"
        labelPosition="top"
        fontScale={fontScale}
      />

      {/* 焦点标注 */}
      <MathPoint
        cx={foci.F1.x}
        cy={foci.F1.y}
        scale={scale}
        color={MATH_COLORS.paramTertiary}
        label="F₁"
        labelPosition="top-left"
        fontScale={fontScale}
      />
      <MathPoint
        cx={foci.F2.x}
        cy={foci.F2.y}
        scale={scale}
        color={MATH_COLORS.paramTertiary}
        label="F₂"
        labelPosition="top-right"
        fontScale={fontScale}
      />

      {/* 可拖拽动点 P (InteractivePoint) */}
      <InteractivePoint
        cx={pointP.x}
        cy={pointP.y}
        scale={scale}
        vp={vp}
        color={MATH_COLORS.primary}
        label="P"
        fontScale={fontScale}
        onDrag={(newMathPt) => {
          let newT: number;
          if (conicType === "ellipse") {
            newT = Math.atan2(newMathPt.y / b, newMathPt.x / a);
          } else {
            newT = Math.atan2(newMathPt.y, b);
          }
          onParamChange("t", newT);
        }}
      />
    </g>
  );
};
