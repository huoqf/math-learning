import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  IntervalShadow,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { solveBisection } from "@/math/function";

interface ZeroSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
}

export function ZeroScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
}: ZeroSceneProps) {
  const m = params.intervalM ?? -1.0;
  const n = params.intervalN ?? 2.5;
  const steps = Math.max(1, Math.round(params.bisectionSteps ?? 3));

  const handleDragM = (mathPt: { x: number; y: number }) => {
    onParamChange("intervalM", Math.round(mathPt.x * 10) / 10);
  };

  const handleDragN = (mathPt: { x: number; y: number }) => {
    onParamChange("intervalN", Math.round(mathPt.x * 10) / 10);
  };

  const placedLabels = React.useMemo(() => {
    const entries: LabelEntry[] = [];
    const ptM = mathToDesign(m, 0, scale);
    const ptN = mathToDesign(n, 0, scale);
    entries.push(
      {
        key: "m",
        text: `m=${m.toFixed(1)}`,
        x: ptM.x,
        y: ptM.y,
        anchor: "middle",
        dy: -12,
      },
      {
        key: "n",
        text: `n=${n.toFixed(1)}`,
        x: ptN.x,
        y: ptN.y,
        anchor: "middle",
        dy: -12,
      },
    );
    return avoidLabels(entries, { fontScale });
  }, [m, n, scale, fontScale]);

  const targetFn = (x: number) => x * x * x - x - 2;
  const bisectionRes = solveBisection(targetFn, m, n, steps);

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />
      <FunctionGraph
        fn={targetFn}
        scale={scale}
        color={MATH_COLORS.function}
        strokeWidth={2.5}
      />
      <IntervalShadow
        fn={targetFn}
        x1={m}
        x2={n}
        scale={scale}
        fillColor={withAlpha(MATH_COLORS.function, 0.15)}
      />
      <line
        x1={scale.originX + m * scale.scaleX}
        y1={scale.originY - 4.5 * scale.scaleY}
        x2={scale.originX + m * scale.scaleX}
        y2={scale.originY + 4.5 * scale.scaleY}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      <InteractivePoint
        cx={m}
        cy={0}
        scale={scale}
        vp={vp}
        onDrag={handleDragM}
        color={MATH_COLORS.paramPrimary}
        label={`m=${m.toFixed(1)}`}
        labelKey="m"
        placedLabels={placedLabels}
        fontScale={fontScale}
      />
      <line
        x1={scale.originX + n * scale.scaleX}
        y1={scale.originY - 4.5 * scale.scaleY}
        x2={scale.originX + n * scale.scaleX}
        y2={scale.originY + 4.5 * scale.scaleY}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      <InteractivePoint
        cx={n}
        cy={0}
        scale={scale}
        vp={vp}
        onDrag={handleDragN}
        color={MATH_COLORS.paramSecondary}
        label={`n=${n.toFixed(1)}`}
        labelKey="n"
        placedLabels={placedLabels}
        fontScale={fontScale}
      />
      {bisectionRes.currentStep && (
        <g>
          <line
            x1={scale.originX + bisectionRes.currentStep.mid * scale.scaleX}
            y1={scale.originY - 4.5 * scale.scaleY}
            x2={scale.originX + bisectionRes.currentStep.mid * scale.scaleX}
            y2={scale.originY + 4.5 * scale.scaleY}
            stroke={MATH_COLORS.tangentLine}
            strokeWidth={2}
          />
          <circle
            cx={scale.originX + bisectionRes.currentStep.mid * scale.scaleX}
            cy={
              scale.originY -
              targetFn(bisectionRes.currentStep.mid) * scale.scaleY
            }
            r={6}
            fill={MATH_COLORS.tangentLine}
            stroke={CANVAS_COLORS.white}
            strokeWidth={2}
          />
          <text
            x={scale.originX + bisectionRes.currentStep.mid * scale.scaleX + 8}
            y={
              scale.originY -
              targetFn(bisectionRes.currentStep.mid) * scale.scaleY -
              8
            }
            fill={MATH_COLORS.tangentLine}
            fontSize={fontScale(12)}
            fontWeight="extrabold"
          >
            {`mid Step${steps}: ${bisectionRes.currentStep.mid.toFixed(3)}`}
          </text>
        </g>
      )}
    </g>
  );
}
