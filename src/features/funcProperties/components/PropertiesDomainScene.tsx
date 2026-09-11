/**
 * 模式 1：定义域与值域（Domain）
 * 函数下方区间阴影 + X 轴定义域投影光带 + Y 轴值域投影光带
 * + 动点投影虚线/垂足直角标记 + 拖拽控制点
 */
import {
  IntervalShadow,
  Asymptote,
  MathPoint,
  InteractivePoint,
  SceneLabelGroup,
} from "@/components/Math";
import type { LabelItem } from "@/utils/labelOverlap";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { PropertiesCommonProps, PropertiesFnType } from "./types";

interface PropertiesDomainSceneProps extends PropertiesCommonProps {
  fnType: PropertiesFnType;
  x0: number;
}

export function PropertiesDomainScene({
  scale,
  vp,
  onParamChange,
  fontScale,
  getFn,
  fnType,
  x0,
}: PropertiesDomainSceneProps) {
  const fx0 = getFn(x0);

  const handleDragX0 = (mathPt: { x: number; y: number }) => {
    onParamChange("x0", Math.round(mathPt.x * 10) / 10);
  };

  const isDefined = Number.isFinite(fx0);

  // 定义域模式学术点标
  const labelItems: LabelItem[] = [];
  if (isDefined) {
    const pt0 = mathToDesign(x0, fx0, scale);
    labelItems.push({
      key: "P0",
      x: pt0.x,
      y: pt0.y,
      text: "P₀",
      color: MATH_COLORS.paramPrimary,
      preferredPlacement: fx0 >= 0 ? "top-right" : "bottom-right",
    });

    const ptPx = mathToDesign(x0, 0, scale);
    labelItems.push({
      key: "Px",
      x: ptPx.x,
      y: ptPx.y,
      text: "x₀",
      color: MATH_COLORS.paramPrimary,
      preferredPlacement: fx0 >= 0 ? "bottom" : "top",
    });

    const ptPy = mathToDesign(0, fx0, scale);
    labelItems.push({
      key: "Py",
      x: ptPy.x,
      y: ptPy.y,
      text: "f(x₀)",
      color: MATH_COLORS.functionSecondary,
      preferredPlacement: x0 >= 0 ? "left" : "right",
    });

    // 垂直检验线顶端学术标签
    const ptVLine = mathToDesign(x0, scale.yMax - 0.35, scale);
    labelItems.push({
      key: "VLine",
      x: ptVLine.x,
      y: ptVLine.y,
      text: "x = x₀ (垂线检验)",
      color: MATH_COLORS.paramPrimary,
      preferredPlacement: "top",
    });
  } else {
    const ptPx = mathToDesign(x0, 0, scale);
    labelItems.push({
      key: "Px-undef",
      x: ptPx.x,
      y: ptPx.y,
      text: "x₀ (无定义)",
      color: MATH_COLORS.degeneracy,
      preferredPlacement: "bottom",
    });

    const ptVLine = mathToDesign(x0, scale.yMax - 0.35, scale);
    labelItems.push({
      key: "VLine-undef",
      x: ptVLine.x,
      y: ptVLine.y,
      text: "x = x₀ (超出定义域)",
      color: MATH_COLORS.degeneracy,
      preferredPlacement: "top",
    });
  }

  // 定义域 D 与值域 R 投影光带学术标识
  const ptDomainLabel = mathToDesign(scale.xMax - 0.8, 0, scale);
  labelItems.push({
    key: "DomainLabel",
    x: ptDomainLabel.x,
    y: ptDomainLabel.y,
    text: "定义域 D",
    color: MATH_COLORS.functionTransformed,
    preferredPlacement: "top",
  });

  const ptRangeLabel = mathToDesign(0, scale.yMax - 0.6, scale);
  labelItems.push({
    key: "RangeLabel",
    x: ptRangeLabel.x,
    y: ptRangeLabel.y,
    text: "值域 R",
    color: MATH_COLORS.functionSecondary,
    preferredPlacement: "right",
  });

  // 特征极值与边界端点标注
  if (fnType === "sin") {
    const ptMax = mathToDesign(0, 1, scale);
    labelItems.push({
      key: "SinMax",
      x: ptMax.x,
      y: ptMax.y,
      text: "1",
      color: MATH_COLORS.functionSecondary,
      preferredPlacement: "left",
    });
    const ptMin = mathToDesign(0, -1, scale);
    labelItems.push({
      key: "SinMin",
      x: ptMin.x,
      y: ptMin.y,
      text: "-1",
      color: MATH_COLORS.functionSecondary,
      preferredPlacement: "left",
    });
  } else if (fnType === "root" || fnType === "quadratic" || fnType === "abs") {
    const ptZero = mathToDesign(0, 0, scale);
    labelItems.push({
      key: "ZeroBound",
      x: ptZero.x,
      y: ptZero.y,
      text: "0",
      color: MATH_COLORS.functionSecondary,
      preferredPlacement: "bottom-left",
    });
  }

  return (
    <g>
      {/* 1. 函数下方区间阴影与渐近线 */}
      {fnType === "reciprocal" ? (
        <>
          <IntervalShadow
            fn={getFn}
            scale={scale}
            x1={scale.xMin}
            x2={-0.05}
            fillColor={withAlpha(MATH_COLORS.functionTransformed, 0.12)}
          />
          <IntervalShadow
            fn={getFn}
            scale={scale}
            x1={0.05}
            x2={scale.xMax}
            fillColor={withAlpha(MATH_COLORS.functionTransformed, 0.12)}
          />
          <Asymptote
            type="vertical"
            value={0}
            scale={scale}
            label="x = 0 (渐近线)"
            fontScale={fontScale}
            color={MATH_COLORS.degeneracy}
          />
          <Asymptote
            type="horizontal"
            value={0}
            scale={scale}
            label="y = 0 (渐近线)"
            fontScale={fontScale}
            color={MATH_COLORS.degeneracy}
          />
        </>
      ) : fnType === "root" ? (
        <IntervalShadow
          fn={getFn}
          scale={scale}
          x1={0}
          x2={scale.xMax}
          fillColor={withAlpha(MATH_COLORS.functionTransformed, 0.12)}
        />
      ) : (
        <IntervalShadow
          fn={getFn}
          scale={scale}
          x1={scale.xMin}
          x2={scale.xMax}
          fillColor={withAlpha(MATH_COLORS.functionTransformed, 0.1)}
        />
      )}

      {/* 2. X 轴定义域投影光带 (Domain on X-axis) */}
      {fnType === "reciprocal" ? (
        <>
          <line
            x1={scale.originX + scale.xMin * scale.scaleX}
            y1={scale.originY}
            x2={scale.originX - 0.08 * scale.scaleX}
            y2={scale.originY}
            stroke={MATH_COLORS.functionTransformed}
            strokeWidth={3.5}
            strokeLinecap="round"
            opacity={0.85}
          />
          <line
            x1={scale.originX + 0.08 * scale.scaleX}
            y1={scale.originY}
            x2={scale.originX + scale.xMax * scale.scaleX}
            y2={scale.originY}
            stroke={MATH_COLORS.functionTransformed}
            strokeWidth={3.5}
            strokeLinecap="round"
            opacity={0.85}
          />
          {/* x = 0 去心点 */}
          <MathPoint
            cx={0}
            cy={0}
            scale={scale}
            variant="hollow"
            color={MATH_COLORS.degeneracy}
            fontScale={fontScale}
          />
        </>
      ) : fnType === "root" ? (
        <>
          <line
            x1={scale.originX}
            y1={scale.originY}
            x2={scale.originX + scale.xMax * scale.scaleX}
            y2={scale.originY}
            stroke={MATH_COLORS.functionTransformed}
            strokeWidth={3.5}
            strokeLinecap="round"
            opacity={0.85}
          />
          {/* x = 0 闭区间起点 */}
          <MathPoint
            cx={0}
            cy={0}
            scale={scale}
            variant="solid"
            color={MATH_COLORS.functionTransformed}
            fontScale={fontScale}
          />
        </>
      ) : (
        <line
          x1={scale.originX + scale.xMin * scale.scaleX}
          y1={scale.originY}
          x2={scale.originX + scale.xMax * scale.scaleX}
          y2={scale.originY}
          stroke={MATH_COLORS.functionTransformed}
          strokeWidth={3.5}
          strokeLinecap="round"
          opacity={0.85}
        />
      )}

      {/* 3. Y 轴值域投影光带 (Range on Y-axis) */}
      {fnType === "quadratic" || fnType === "abs" || fnType === "root" ? (
        <>
          <line
            x1={scale.originX}
            y1={scale.originY}
            x2={scale.originX}
            y2={scale.originY - scale.yMax * scale.scaleY}
            stroke={MATH_COLORS.functionSecondary}
            strokeWidth={3.5}
            strokeLinecap="round"
            opacity={0.85}
          />
          {/* y = 0 闭区间端点 */}
          <MathPoint
            cx={0}
            cy={0}
            scale={scale}
            variant="solid"
            color={MATH_COLORS.functionSecondary}
            fontScale={fontScale}
          />
        </>
      ) : fnType === "sin" ? (
        <>
          <line
            x1={scale.originX}
            y1={scale.originY - -1 * scale.scaleY}
            x2={scale.originX}
            y2={scale.originY - 1 * scale.scaleY}
            stroke={MATH_COLORS.functionSecondary}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.9}
          />
          {/* y = -1 与 y = 1 端点 */}
          <MathPoint
            cx={0}
            cy={-1}
            scale={scale}
            variant="solid"
            color={MATH_COLORS.functionSecondary}
            fontScale={fontScale}
          />
          <MathPoint
            cx={0}
            cy={1}
            scale={scale}
            variant="solid"
            color={MATH_COLORS.functionSecondary}
            fontScale={fontScale}
          />
        </>
      ) : fnType === "reciprocal" ? (
        <>
          <line
            x1={scale.originX}
            y1={scale.originY - scale.yMin * scale.scaleY}
            x2={scale.originX}
            y2={scale.originY - -0.08 * scale.scaleY}
            stroke={MATH_COLORS.functionSecondary}
            strokeWidth={3.5}
            strokeLinecap="round"
            opacity={0.85}
          />
          <line
            x1={scale.originX}
            y1={scale.originY - 0.08 * scale.scaleY}
            x2={scale.originX}
            y2={scale.originY - scale.yMax * scale.scaleY}
            stroke={MATH_COLORS.functionSecondary}
            strokeWidth={3.5}
            strokeLinecap="round"
            opacity={0.85}
          />
        </>
      ) : (
        <line
          x1={scale.originX}
          y1={scale.originY - scale.yMin * scale.scaleY}
          x2={scale.originX}
          y2={scale.originY - scale.yMax * scale.scaleY}
          stroke={MATH_COLORS.functionSecondary}
          strokeWidth={3.5}
          strokeLinecap="round"
          opacity={0.85}
        />
      )}

      {/* 4. 贯穿画布的垂直检验线 (Vertical Line Test: x = x0) */}
      <line
        x1={scale.originX + x0 * scale.scaleX}
        y1={scale.originY - scale.yMin * scale.scaleY}
        x2={scale.originX + x0 * scale.scaleX}
        y2={scale.originY - scale.yMax * scale.scaleY}
        stroke={isDefined ? MATH_COLORS.paramPrimary : MATH_COLORS.degeneracy}
        strokeDasharray="5 4"
        strokeWidth={1.2}
        opacity={isDefined ? 0.45 : 0.65}
      />

      {/* 5. 动点 P₀ 向 X 轴与 Y 轴的投影虚线与垂足直角标记 */}
      {isDefined ? (
        <g>
          {/* 向 X 轴引垂线段 */}
          <line
            x1={scale.originX + x0 * scale.scaleX}
            y1={scale.originY - fx0 * scale.scaleY}
            x2={scale.originX + x0 * scale.scaleX}
            y2={scale.originY}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
            opacity={0.8}
          />
          {/* 向 Y 轴引水平垂线 */}
          <line
            x1={scale.originX + x0 * scale.scaleX}
            y1={scale.originY - fx0 * scale.scaleY}
            x2={scale.originX}
            y2={scale.originY - fx0 * scale.scaleY}
            stroke={MATH_COLORS.functionSecondary}
            strokeDasharray="4 4"
            strokeWidth={1.5}
            opacity={0.7}
          />

          {/* 垂足 Px (x0, 0) */}
          <MathPoint
            cx={x0}
            cy={0}
            scale={scale}
            variant="foot"
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
          />

          {/* 垂足 Py (0, fx0) */}
          <MathPoint
            cx={0}
            cy={fx0}
            scale={scale}
            variant="foot"
            color={MATH_COLORS.functionSecondary}
            fontScale={fontScale}
          />

          {/* X 轴垂足处的直角小标尺 */}
          {(() => {
            const pxPt = mathToDesign(x0, 0, scale);
            const size = 8;
            const dirY = fx0 >= 0 ? -1 : 1;
            const dirX = x0 >= 0 ? -1 : 1;
            return (
              <path
                d={`M ${pxPt.x} ${pxPt.y + dirY * size} L ${pxPt.x + dirX * size} ${pxPt.y + dirY * size} L ${pxPt.x + dirX * size} ${pxPt.y}`}
                fill="none"
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1.2}
                opacity={0.6}
              />
            );
          })()}

          {/* Y 轴垂足处的直角小标尺 */}
          {(() => {
            const pyPt = mathToDesign(0, fx0, scale);
            const size = 8;
            const dirX = x0 >= 0 ? 1 : -1;
            const dirY = fx0 >= 0 ? 1 : -1;
            return (
              <path
                d={`M ${pyPt.x + dirX * size} ${pyPt.y} L ${pyPt.x + dirX * size} ${pyPt.y + dirY * size} L ${pyPt.x} ${pyPt.y + dirY * size}`}
                fill="none"
                stroke={MATH_COLORS.functionSecondary}
                strokeWidth={1.2}
                opacity={0.6}
              />
            );
          })()}

          {/* 拖拽控制点位于曲线上 P0 */}
          <InteractivePoint
            cx={x0}
            cy={fx0}
            scale={scale}
            vp={vp}
            onDrag={handleDragX0}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
          />
        </g>
      ) : (
        <g>
          {/* 超出定义域时，在 X 轴上显示空心点与拖拽控制点，支持拖回定义域 */}
          <MathPoint
            cx={x0}
            cy={0}
            scale={scale}
            variant="hollow"
            color={MATH_COLORS.degeneracy}
            fontScale={fontScale}
          />
          <InteractivePoint
            cx={x0}
            cy={0}
            scale={scale}
            vp={vp}
            onDrag={handleDragX0}
            color={MATH_COLORS.degeneracy}
            fontScale={fontScale}
          />
        </g>
      )}

      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
}
