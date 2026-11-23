import React from "react";
import {
  CoordinateGrid,
  InteractivePoint,
  MathPoint,
  SceneLabelGroup,
} from "@/components/Math";
import type { SceneScale } from "@/hooks";
import type { ViewportInfo } from "@/utils/useViewport";
import { CANVAS_COLORS, MATH_COLORS } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { formatMathNumber } from "@/utils/mathFormat";
import type { LabelItem } from "@/utils/labelOverlap";
import {
  calcAsymVieta,
  calcHiddenCircle,
  calcSymmetryShortest,
  type ConicAsymStudyMode,
  type HiddenCircleType,
} from "@/math/conicAsymmetricVieta";

interface ConicAsymmetricVietaSceneProps {
  mode: ConicAsymStudyMode;
  circleType: HiddenCircleType;
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  activeStep: number;
  isStepFocusOn: boolean;
  fontScale: (base: number) => number;
  onParamChange: (key: string, value: number) => void;
}

export const ConicAsymmetricVietaScene: React.FC<
  ConicAsymmetricVietaSceneProps
> = ({
  mode,
  circleType,
  params,
  scale,
  vp,
  activeStep,
  isStepFocusOn,
  fontScale,
  onParamChange,
}) => {
  const regionOpacity = (targetStep: number) =>
    !isStepFocusOn || activeStep === targetStep ? 1 : 0.28;

  if (mode === "asymVieta") {
    const res = calcAsymVieta(
      params.a ?? 3.0,
      params.b ?? 2.0,
      params.x0 ?? 2.0,
      params.m ?? 0.6,
    );
    const ptM = { x: res.x0, y: 0 };
    const oDesign = mathToDesign(0, 0, scale);
    const rxD = res.a * scale.scaleX;
    const ryD = res.b * scale.scaleY;

    const pA = mathToDesign(res.ptA.x, res.ptA.y, scale);
    const pB = mathToDesign(res.ptB.x, res.ptB.y, scale);
    const pP = mathToDesign(res.ptP.x, res.ptP.y, scale);
    const pQ = mathToDesign(res.ptQ.x, res.ptQ.y, scale);
    const pT = mathToDesign(res.ptT.x, res.ptT.y, scale);
    const pM = mathToDesign(ptM.x, ptM.y, scale);

    const fixedLineTop = mathToDesign(res.fixedLineX, scale.yMax, scale);
    const fixedLineBot = mathToDesign(res.fixedLineX, scale.yMin, scale);

    // 动直线延长线裁剪在视口上下
    const chordTop = mathToDesign(
      res.m * scale.yMax + res.x0,
      scale.yMax,
      scale,
    );
    const chordBot = mathToDesign(
      res.m * scale.yMin + res.x0,
      scale.yMin,
      scale,
    );

    const labelItems: LabelItem[] = [
      {
        key: "A",
        text: "A",
        x: pA.x,
        y: pA.y,
        color: MATH_COLORS.paramPrimary,
      },
      {
        key: "B",
        text: "B",
        x: pB.x,
        y: pB.y,
        color: MATH_COLORS.paramPrimary,
      },
      { key: "P", text: "P", x: pP.x, y: pP.y, color: MATH_COLORS.function },
      { key: "Q", text: "Q", x: pQ.x, y: pQ.y, color: MATH_COLORS.function },
      {
        key: "M",
        text: "M",
        x: pM.x,
        y: pM.y,
        color: MATH_COLORS.paramTertiary,
      },
      {
        key: "T",
        text: `T(${formatMathNumber(res.ptT.x, 2)}, ${formatMathNumber(res.ptT.y, 2)})`,
        x: pT.x,
        y: pT.y,
        color: MATH_COLORS.inequality,
      },
    ];

    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

        {/* 椭圆主体 */}
        <ellipse
          cx={oDesign.x}
          cy={oDesign.y}
          rx={rxD}
          ry={ryD}
          fill="none"
          stroke={MATH_COLORS.ellipse}
          strokeWidth={2.3}
        />

        {/* 步 1：动直线与交点 A, B */}
        <g data-step-region="1" opacity={regionOpacity(1)}>
          <line
            x1={chordBot.x}
            y1={chordBot.y}
            x2={chordTop.x}
            y2={chordTop.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.8}
          />
          <MathPoint
            cx={ptM.x}
            cy={ptM.y}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            r={5}
          />
          <MathPoint
            cx={res.ptA.x}
            cy={res.ptA.y}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            r={5.5}
          />
          <MathPoint
            cx={res.ptB.x}
            cy={res.ptB.y}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            r={5.5}
          />
          {isStepFocusOn && activeStep === 1 && (
            <rect
              x={Math.min(pA.x, pB.x) - 24}
              y={Math.min(pA.y, pB.y) - 24}
              width={Math.abs(pB.x - pA.x) + 48}
              height={Math.abs(pB.y - pA.y) + 48}
              rx={12}
              fill="none"
              stroke={MATH_COLORS.answerStepFrame}
              strokeWidth={2.4}
              strokeDasharray="7 4"
            />
          )}
        </g>

        {/* 步 2：直线 PA 与 QB 交汇 */}
        <g data-step-region="2" opacity={regionOpacity(2)}>
          <line
            x1={pP.x}
            y1={pP.y}
            x2={pT.x}
            y2={pT.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.8}
          />
          <line
            x1={pQ.x}
            y1={pQ.y}
            x2={pT.x}
            y2={pT.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.8}
          />
          <MathPoint
            cx={res.ptP.x}
            cy={res.ptP.y}
            scale={scale}
            color={MATH_COLORS.function}
            r={4.5}
          />
          <MathPoint
            cx={res.ptQ.x}
            cy={res.ptQ.y}
            scale={scale}
            color={MATH_COLORS.function}
            r={4.5}
          />
          {isStepFocusOn && activeStep === 2 && (
            <rect
              x={Math.min(pP.x, pT.x) - 18}
              y={Math.min(pA.y, pB.y, pT.y) - 18}
              width={Math.abs(pT.x - pP.x) + 36}
              height={Math.max(Math.abs(pT.y - pB.y), 90) + 36}
              rx={12}
              fill="none"
              stroke={MATH_COLORS.answerStepFrame}
              strokeWidth={2.4}
              strokeDasharray="7 4"
            />
          )}
        </g>

        {/* 步 3：定直线 x = a^2 / x0 与 T 点 */}
        <g data-step-region="3" opacity={regionOpacity(3)}>
          <line
            x1={fixedLineBot.x}
            y1={fixedLineBot.y}
            x2={fixedLineTop.x}
            y2={fixedLineTop.y}
            stroke={MATH_COLORS.inequality}
            strokeWidth={2}
            strokeDasharray="6 4"
          />
          <text
            x={fixedLineTop.x - 8}
            y={fixedLineTop.y + 22}
            textAnchor="end"
            fontSize={fontScale(12)}
            fontWeight="700"
            fill={MATH_COLORS.inequality}
          >
            定直线 x = {formatMathNumber(res.fixedLineX, 2)}
          </text>
          <MathPoint
            cx={res.ptT.x}
            cy={res.ptT.y}
            scale={scale}
            color={MATH_COLORS.inequality}
            r={6}
          />
          {isStepFocusOn && activeStep === 3 && (
            <rect
              x={pT.x - 32}
              y={pT.y - 32}
              width={64}
              height={64}
              rx={12}
              fill="none"
              stroke={MATH_COLORS.answerStepFrame}
              strokeWidth={2.4}
              strokeDasharray="7 4"
            />
          )}
        </g>

        <SceneLabelGroup items={labelItems} fontScale={fontScale} />
      </g>
    );
  }

  if (mode === "hiddenCircle") {
    const res = calcHiddenCircle(
      circleType,
      params.halfSpan ?? 2.0,
      circleType === "fixedAngle"
        ? (params.thetaDeg ?? 60)
        : (params.sqSumK ?? 16),
      params.angleDeg ?? 55,
    );

    const cD = mathToDesign(res.center.x, res.center.y, scale);
    const rD = res.radius * scale.scaleX;
    // 使用 SVG path 绘制隐圆以严守零手写 <circle> 规范
    const circlePath = `M ${cD.x + rD} ${cD.y} A ${rD} ${rD} 0 1 0 ${cD.x - rD} ${cD.y} A ${rD} ${rD} 0 1 0 ${cD.x + rD} ${cD.y}`;

    // 定弦定角时单独高亮上方同侧合法圆弧，区分互补劣/优弧
    let validArcPath = "";
    if (res.validArcRange) {
      const [phiStart, phiEnd] = res.validArcRange;
      const segs = 48;
      const pts: string[] = [];
      for (let i = 0; i <= segs; i++) {
        const phi = phiStart + ((phiEnd - phiStart) * i) / segs;
        const d = mathToDesign(
          res.center.x + res.radius * Math.cos(phi),
          res.center.y + res.radius * Math.sin(phi),
          scale,
        );
        pts.push(`${i === 0 ? "M" : "L"} ${d.x} ${d.y}`);
      }
      validArcPath = pts.join(" ");
    }

    const pA = mathToDesign(res.ptA.x, res.ptA.y, scale);
    const pB = mathToDesign(res.ptB.x, res.ptB.y, scale);
    const pP = mathToDesign(res.ptP.x, res.ptP.y, scale);

    const labelItems: LabelItem[] = [
      {
        key: "A",
        text: "A",
        x: pA.x,
        y: pA.y,
        color: MATH_COLORS.paramPrimary,
      },
      {
        key: "B",
        text: "B",
        x: pB.x,
        y: pB.y,
        color: MATH_COLORS.paramPrimary,
      },
      { key: "O", text: "O圆心", x: cD.x, y: cD.y, color: MATH_COLORS.circle },
      {
        key: "P",
        text: "P(拖拽)",
        x: pP.x,
        y: pP.y,
        color: MATH_COLORS.inequality,
      },
    ];

    const handleDragP = (mathPt: { x: number; y: number }) => {
      const angRad = Math.atan2(
        mathPt.y - res.center.y,
        mathPt.x - res.center.x,
      );
      let deg = (angRad * 180) / Math.PI;
      if (deg < 0) deg += 360;
      let minDeg = 20;
      let maxDeg = 160;
      if (res.validArcRange) {
        minDeg = Math.max(
          20,
          Math.ceil((res.validArcRange[0] * 180) / Math.PI + 6),
        );
        maxDeg = Math.min(
          160,
          Math.floor((res.validArcRange[1] * 180) / Math.PI - 6),
        );
      }
      const normalized = deg > 270 ? minDeg : deg;
      const clamped = Math.max(minDeg, Math.min(maxDeg, normalized));
      onParamChange("angleDeg", Math.round(clamped));
    };

    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

        {/* 隐圆轨迹（定弦定角模式下完整圆淡化作虚圆参考，上方同侧合法弧实线高亮） */}
        <path
          d={circlePath}
          fill="none"
          stroke={MATH_COLORS.circle}
          strokeWidth={res.validArcRange ? 1.5 : 2.2}
          strokeDasharray="6 4"
          opacity={res.validArcRange ? 0.35 : 1}
        />
        {validArcPath && (
          <path
            d={validArcPath}
            fill="none"
            stroke={MATH_COLORS.circle}
            strokeWidth={2.6}
          />
        )}

        {/* 连线 AP, BP 与直径/弦 AB */}
        <line
          x1={pA.x}
          y1={pA.y}
          x2={pB.x}
          y2={pB.y}
          stroke={CANVAS_COLORS.labelTextLight}
          strokeWidth={1.8}
        />
        <line
          x1={pA.x}
          y1={pA.y}
          x2={pP.x}
          y2={pP.y}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={2.1}
        />
        <line
          x1={pB.x}
          y1={pB.y}
          x2={pP.x}
          y2={pP.y}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={2.1}
        />

        <MathPoint
          cx={res.ptA.x}
          cy={res.ptA.y}
          scale={scale}
          color={MATH_COLORS.paramPrimary}
          r={5}
        />
        <MathPoint
          cx={res.ptB.x}
          cy={res.ptB.y}
          scale={scale}
          color={MATH_COLORS.paramPrimary}
          r={5}
        />
        <MathPoint
          cx={res.center.x}
          cy={res.center.y}
          scale={scale}
          color={MATH_COLORS.circle}
          r={4}
        />

        <InteractivePoint
          cx={res.ptP.x}
          cy={res.ptP.y}
          scale={scale}
          vp={vp}
          color={MATH_COLORS.inequality}
          onDrag={handleDragP}
        />

        <SceneLabelGroup items={labelItems} fontScale={fontScale} />
      </g>
    );
  }

  // symmetryShortest 模式
  const res = calcSymmetryShortest(
    params.lineK ?? 0.2,
    params.lineB ?? -0.6,
    params.probePx ?? 0.5,
  );
  const pA = mathToDesign(res.ptA.x, res.ptA.y, scale);
  const pB = mathToDesign(res.ptB.x, res.ptB.y, scale);
  const pAP = mathToDesign(res.ptAPrime.x, res.ptAPrime.y, scale);
  const pP = mathToDesign(res.ptP.x, res.ptP.y, scale);
  const pOpt = mathToDesign(res.ptOptP.x, res.ptOptP.y, scale);

  const axisL = mathToDesign(
    scale.xMin,
    res.lineK * scale.xMin + res.lineB,
    scale,
  );
  const axisR = mathToDesign(
    scale.xMax,
    res.lineK * scale.xMax + res.lineB,
    scale,
  );

  const labelItems: LabelItem[] = res.isSameSide
    ? [
        {
          key: "A",
          text: "A",
          x: pA.x,
          y: pA.y,
          color: MATH_COLORS.paramPrimary,
        },
        {
          key: "B",
          text: "B",
          x: pB.x,
          y: pB.y,
          color: MATH_COLORS.paramPrimary,
        },
        {
          key: "Ap",
          text: "A'",
          x: pAP.x,
          y: pAP.y,
          color: MATH_COLORS.paramSecondary,
        },
        {
          key: "Opt",
          text: "P*",
          x: pOpt.x,
          y: pOpt.y,
          color: MATH_COLORS.inequality,
        },
        {
          key: "P",
          text: "P(拖拽)",
          x: pP.x,
          y: pP.y,
          color: MATH_COLORS.paramTertiary,
        },
      ]
    : [
        {
          key: "A",
          text: "A",
          x: pA.x,
          y: pA.y,
          color: MATH_COLORS.paramPrimary,
        },
        {
          key: "B",
          text: "B",
          x: pB.x,
          y: pB.y,
          color: MATH_COLORS.paramPrimary,
        },
        {
          key: "Opt",
          text: "P*",
          x: pOpt.x,
          y: pOpt.y,
          color: MATH_COLORS.inequality,
        },
        {
          key: "P",
          text: "P(拖拽)",
          x: pP.x,
          y: pP.y,
          color: MATH_COLORS.paramTertiary,
        },
      ];

  const handleDragLineP = (mathPt: { x: number; y: number }) => {
    onParamChange("probePx", Number(mathPt.x.toFixed(1)));
  };

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* 对称轴直线 */}
      <line
        x1={axisL.x}
        y1={axisL.y}
        x2={axisR.x}
        y2={axisR.y}
        stroke={MATH_COLORS.function}
        strokeWidth={2.2}
      />

      {res.isSameSide ? (
        <>
          {/* 同侧：A-A' 垂直对称虚线与最短直线段 A'B */}
          <line
            x1={pA.x}
            y1={pA.y}
            x2={pAP.x}
            y2={pAP.y}
            stroke={CANVAS_COLORS.labelTextLight}
            strokeWidth={1.4}
            strokeDasharray="4 3"
          />
          <line
            x1={pAP.x}
            y1={pAP.y}
            x2={pB.x}
            y2={pB.y}
            stroke={MATH_COLORS.inequality}
            strokeWidth={2}
            strokeDasharray="6 3"
          />
          <line
            x1={pAP.x}
            y1={pAP.y}
            x2={pP.x}
            y2={pP.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        </>
      ) : (
        /* 异侧：两点直连线段 AB 交对称轴于最优 P* */
        <line
          x1={pA.x}
          y1={pA.y}
          x2={pB.x}
          y2={pB.y}
          stroke={MATH_COLORS.inequality}
          strokeWidth={2}
          strokeDasharray="6 3"
        />
      )}

      {/* 当前折线 AP + BP */}
      <line
        x1={pA.x}
        y1={pA.y}
        x2={pP.x}
        y2={pP.y}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2.2}
      />
      <line
        x1={pP.x}
        y1={pP.y}
        x2={pB.x}
        y2={pB.y}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2.2}
      />

      <MathPoint
        cx={res.ptA.x}
        cy={res.ptA.y}
        scale={scale}
        color={MATH_COLORS.paramPrimary}
        r={5.5}
      />
      <MathPoint
        cx={res.ptB.x}
        cy={res.ptB.y}
        scale={scale}
        color={MATH_COLORS.paramPrimary}
        r={5.5}
      />
      {res.isSameSide && (
        <MathPoint
          cx={res.ptAPrime.x}
          cy={res.ptAPrime.y}
          scale={scale}
          color={MATH_COLORS.paramSecondary}
          r={5.5}
        />
      )}
      <MathPoint
        cx={res.ptOptP.x}
        cy={res.ptOptP.y}
        scale={scale}
        color={MATH_COLORS.inequality}
        r={5}
      />

      <InteractivePoint
        cx={res.ptP.x}
        cy={res.ptP.y}
        scale={scale}
        vp={vp}
        snapTo={(x) => res.lineK * x + res.lineB}
        xRange={[-3.5, 3.5]}
        color={MATH_COLORS.paramTertiary}
        onDrag={handleDragLineP}
      />

      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
};
