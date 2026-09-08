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

  // 定义域模式点标
  const labelItems: LabelItem[] = [];
  if (Number.isFinite(fx0)) {
    const pt0 = mathToDesign(x0, fx0, scale);
    labelItems.push({
      key: "P0",
      x: pt0.x,
      y: pt0.y,
      text: "P₀",
      color: MATH_COLORS.paramPrimary,
      preferredPlacement: "top-right",
    });

    const ptPx = mathToDesign(x0, 0, scale);
    labelItems.push({
      key: "Px",
      x: ptPx.x,
      y: ptPx.y,
      text: "P_x",
      color: MATH_COLORS.paramPrimary,
      preferredPlacement: fx0 >= 0 ? "bottom" : "top",
    });

    const ptPy = mathToDesign(0, fx0, scale);
    labelItems.push({
      key: "Py",
      x: ptPy.x,
      y: ptPy.y,
      text: "P_y",
      color: MATH_COLORS.functionSecondary,
      preferredPlacement: x0 >= 0 ? "left" : "right",
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
            label="x = 0 (无定义断点)"
            fontScale={fontScale}
            color={MATH_COLORS.degeneracy}
          />
        </>
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
      {fnType === "quadratic" || fnType === "abs" ? (
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

      {/* 4. 动点 P₀ 向 X 轴与 Y 轴的投影虚线与垂足直角标记 */}
      {Number.isFinite(fx0) && (
        <g>
          {/* 向 X 轴引垂线 */}
          <line
            x1={scale.originX + x0 * scale.scaleX}
            y1={scale.originY - fx0 * scale.scaleY}
            x2={scale.originX + x0 * scale.scaleX}
            y2={scale.originY}
            stroke={MATH_COLORS.paramPrimary}
            strokeDasharray="4 4"
            strokeWidth={1.5}
            opacity={0.7}
          />
          {/* 向 Y 轴引垂线 */}
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
        </g>
      )}

      {/* 拖拽控制点 */}
      {Number.isFinite(fx0) && (
        <InteractivePoint
          cx={x0}
          cy={fx0}
          scale={scale}
          vp={vp}
          onDrag={handleDragX0}
          color={MATH_COLORS.paramPrimary}
          fontScale={fontScale}
        />
      )}

      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
}
