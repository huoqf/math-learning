/**
 * 模式 2：奇偶性（Parity）
 * 对称连线与对称点 P' + 割线与单调控制点 + 三个拖拽控制点
 */
import {
  MathPoint,
  SecantLine,
  InteractivePoint,
  SceneLabelGroup,
} from "@/components/Math";
import type { LabelItem } from "@/utils/labelOverlap";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS } from "@/theme";
import { evalFunctionParity } from "@/math/function";
import type { PropertiesCommonProps, PropertiesFnType } from "./types";

interface PropertiesParitySceneProps extends PropertiesCommonProps {
  fnType: PropertiesFnType;
  x0: number;
  x1: number;
  x2: number;
}

export function PropertiesParityScene({
  scale,
  vp,
  onParamChange,
  fontScale,
  getFn,
  fnType,
  x0,
  x1,
  x2,
}: PropertiesParitySceneProps) {
  const fx0 = getFn(x0);
  const fx1 = getFn(x1);
  const fx2 = getFn(x2);

  const parityRes = evalFunctionParity(fnType === "sin" ? "cubic" : fnType, x0);

  const handleDragX0 = (mathPt: { x: number; y: number }) => {
    onParamChange("x0", Math.round(mathPt.x * 10) / 10);
  };
  const handleDragX1 = (mathPt: { x: number; y: number }) => {
    onParamChange("x1", Math.round(mathPt.x * 10) / 10);
  };
  const handleDragX2 = (mathPt: { x: number; y: number }) => {
    onParamChange("x2", Math.round(mathPt.x * 10) / 10);
  };

  // 奇偶性模式点标
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
    if (Number.isFinite(parityRes.fNegX)) {
      const ptSym = mathToDesign(-x0, parityRes.fNegX, scale);
      labelItems.push({
        key: "P_sym",
        x: ptSym.x,
        y: ptSym.y,
        text: "P'",
        color: MATH_COLORS.functionTransformed,
        preferredPlacement: "top-left",
      });
    }
  }
  if (Number.isFinite(fx1)) {
    const pt1 = mathToDesign(x1, fx1, scale);
    labelItems.push({
      key: "P1",
      x: pt1.x,
      y: pt1.y,
      text: "P₁",
      color: MATH_COLORS.paramSecondary,
      preferredPlacement: "bottom-left",
    });
  }
  if (Number.isFinite(fx2)) {
    const pt2 = mathToDesign(x2, fx2, scale);
    labelItems.push({
      key: "P2",
      x: pt2.x,
      y: pt2.y,
      text: "P₂",
      color: MATH_COLORS.paramTertiary,
      preferredPlacement: "top-right",
    });
  }

  return (
    <g>
      {/* 对称连线与对称点 */}
      {Number.isFinite(fx0) && Number.isFinite(parityRes.fNegX) && (
        <g>
          <line
            x1={scale.originX + x0 * scale.scaleX}
            y1={scale.originY - fx0 * scale.scaleY}
            x2={scale.originX - x0 * scale.scaleX}
            y2={scale.originY - parityRes.fNegX * scale.scaleY}
            stroke={MATH_COLORS.labelText}
            strokeDasharray="4 4"
            strokeWidth={1.5}
            opacity={0.6}
          />
          <MathPoint
            cx={-x0}
            cy={parityRes.fNegX}
            scale={scale}
            variant="solid"
            color={MATH_COLORS.functionTransformed}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* 割线与单调控制点 */}
      {Number.isFinite(fx1) &&
        Number.isFinite(fx2) &&
        Math.abs(x1 - x2) > 1e-4 && (
          <SecantLine
            fn={getFn}
            scale={scale}
            x1={x1}
            x2={x2}
            color={MATH_COLORS.secantLine}
            strokeWidth={2}
          />
        )}

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

      {Number.isFinite(fx1) && (
        <InteractivePoint
          cx={x1}
          cy={fx1}
          scale={scale}
          vp={vp}
          onDrag={handleDragX1}
          color={MATH_COLORS.paramSecondary}
          fontScale={fontScale}
        />
      )}

      {Number.isFinite(fx2) && (
        <InteractivePoint
          cx={x2}
          cy={fx2}
          scale={scale}
          vp={vp}
          onDrag={handleDragX2}
          color={MATH_COLORS.paramTertiary}
          fontScale={fontScale}
        />
      )}

      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
}
