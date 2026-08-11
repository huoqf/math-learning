import { useMemo } from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
} from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  calcTrigProperties,
  getTransformPathSteps,
} from "../math/trigTransform";

interface TrigTransformSceneProps {
  params: {
    A: number;
    omega: number;
    phi: number;
    k: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange?: (key: string, value: number) => void;
  fontScale: (v: number) => number;
  studyMode: "properties" | "fivePoints" | "transformPath";
  pathType?: "shift-first" | "stretch-first";
  stepIndex?: number;
}

export function TrigTransformScene({
  params,
  scale,
  fontScale,
  studyMode,
  pathType = "shift-first",
  stepIndex = 0,
}: TrigTransformSceneProps) {
  const { A, omega, phi, k } = params;

  const props = useMemo(
    () => calcTrigProperties(A, omega, phi, k),
    [A, omega, phi, k],
  );

  const pathSteps = useMemo(
    () => getTransformPathSteps(A, omega, phi, k, pathType),
    [A, omega, phi, k, pathType],
  );

  const targetFn = useMemo(() => {
    return (x: number) => A * Math.sin(omega * x + phi) + k;
  }, [A, omega, phi, k]);

  const baseFn = useMemo(() => {
    return (x: number) => Math.sin(x);
  }, []);

  const currentStepFn = useMemo(() => {
    if (studyMode !== "transformPath") return targetFn;
    const step = pathSteps[stepIndex] ?? pathSteps[pathSteps.length - 1];
    return step ? step.fn : targetFn;
  }, [studyMode, stepIndex, pathSteps, targetFn]);

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 模式一：基本性质研究 */}
      {studyMode === "properties" && (
        <>
          {/* 最值参考虚线 */}
          <line
            x1={0}
            y1={mathToDesign(0, props.yMax, scale).y}
            x2={840}
            y2={mathToDesign(0, props.yMax, scale).y}
            stroke={CANVAS_COLORS.grid}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={mathToDesign(0, props.yMin, scale).y}
            x2={840}
            y2={mathToDesign(0, props.yMin, scale).y}
            stroke={CANVAS_COLORS.grid}
            strokeDasharray="4 4"
            strokeWidth={1}
          />

          {/* 平衡轴 y = k */}
          {Math.abs(k) > 1e-4 && (
            <line
              x1={0}
              y1={mathToDesign(0, k, scale).y}
              x2={840}
              y2={mathToDesign(0, k, scale).y}
              stroke={withAlpha(MATH_COLORS.paramTertiary, 0.5)}
              strokeDasharray="6 3"
              strokeWidth={1.5}
            />
          )}

          {/* 主函数曲线 */}
          <FunctionGraph
            fn={targetFn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.5}
          />
        </>
      )}

      {/* 模式二：五点作图法 */}
      {studyMode === "fivePoints" && (
        <>
          <FunctionGraph
            fn={targetFn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.5}
          />

          {/* 五点作图的关键控制点 */}
          {props.fivePoints.map((pt, idx) => (
            <InteractivePoint
              key={idx}
              cx={pt.x}
              cy={pt.y}
              scale={scale}
              vp={{} as any}
              onDrag={() => {}}
              color={MATH_COLORS.paramTertiary}
              r={6}
              fontScale={fontScale}
              label={`P${idx + 1}(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`}
            />
          ))}
        </>
      )}

      {/* 模式三：函数图象变换路径 */}
      {studyMode === "transformPath" && (
        <>
          {/* 基准函数 y = sin x */}
          <FunctionGraph
            fn={baseFn}
            scale={scale}
            color={withAlpha(MATH_COLORS.function, 0.3)}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />

          {/* 当前变换步骤曲线 */}
          <FunctionGraph
            fn={currentStepFn}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
          />
        </>
      )}
    </g>
  );
}
