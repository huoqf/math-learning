import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  IntervalShadow,
  MathPoint,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
import { MATH_COLORS, withAlpha } from "@/theme";
import { solveBisection } from "@/math/function";
import { FUNC_ZERO_MODELS } from "@/data/registries/funcZero";

const MODEL_KEYS = ["cubic", "logMixed", "expMixed", "counterExample"];

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
  const modelIdx = Math.max(
    0,
    Math.min(MODEL_KEYS.length - 1, Math.round(params.modelKey ?? 0)),
  );
  const modelKey = MODEL_KEYS[modelIdx] ?? "cubic";
  const model = FUNC_ZERO_MODELS[modelKey] ?? FUNC_ZERO_MODELS.cubic;

  const m = params.intervalM ?? model.defaultM;
  const n = params.intervalN ?? model.defaultN;
  const steps = Math.max(1, Math.round(params.bisectionSteps ?? 3));

  const targetFn = model.fn;
  const bisectionRes = solveBisection(targetFn, m, n, steps);

  const handleDragM = (mathPt: { x: number; y: number }) => {
    let newM = Math.round(mathPt.x * 10) / 10;
    if (model.minM !== undefined) {
      newM = Math.max(model.minM, newM);
    }
    if (newM >= n - 0.2) {
      newM = n - 0.2;
    }
    onParamChange("intervalM", Math.round(newM * 10) / 10);
  };

  const handleDragN = (mathPt: { x: number; y: number }) => {
    let newN = Math.round(mathPt.x * 10) / 10;
    if (model.maxN !== undefined) {
      newN = Math.min(model.maxN, newN);
    }
    if (newN <= m + 0.2) {
      newN = m + 0.2;
    }
    onParamChange("intervalN", Math.round(newN * 10) / 10);
  };

  const currentMid = bisectionRes.currentStep
    ? bisectionRes.currentStep.mid
    : (m + n) / 2;
  const currentStepLeft = bisectionRes.currentStep
    ? bisectionRes.currentStep.left
    : m;
  const currentStepRight = bisectionRes.currentStep
    ? bisectionRes.currentStep.right
    : n;

  // 标签防重叠计算（纯代数符号，杜绝浮点坐标堆砌）
  const placedLabels = React.useMemo(() => {
    const entries: LabelEntry[] = [];
    const ptM = mathToDesign(m, 0, scale);
    const ptN = mathToDesign(n, 0, scale);
    entries.push(
      {
        key: "a",
        text: "a",
        x: ptM.x,
        y: ptM.y,
        anchor: "middle",
        dy: -14,
      },
      {
        key: "b",
        text: "b",
        x: ptN.x,
        y: ptN.y,
        anchor: "middle",
        dy: -14,
      },
    );
    if (bisectionRes.hasZero && bisectionRes.currentStep) {
      const ptMid = mathToDesign(currentMid, 0, scale);
      entries.push({
        key: "c",
        text: `c_{${steps}}`,
        x: ptMid.x,
        y: ptMid.y,
        anchor: "middle",
        dy: 18,
      });
    }
    return avoidLabels(entries, { fontScale });
  }, [
    m,
    n,
    currentMid,
    scale,
    fontScale,
    bisectionRes.hasZero,
    bisectionRes.currentStep,
    steps,
  ]);

  const fMid = Number.isFinite(currentMid) ? targetFn(currentMid) : 0;
  const ptMidCurve = mathToDesign(currentMid, fMid, scale);
  const ptMidAxis = mathToDesign(currentMid, 0, scale);

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. 函数主曲线 */}
      <FunctionGraph
        fn={targetFn}
        scale={scale}
        color={MATH_COLORS.function}
        strokeWidth={2.5}
      />

      {/* 2. 初始研究区间底层阴影 */}
      <IntervalShadow
        fn={targetFn}
        x1={m}
        x2={n}
        scale={scale}
        fillColor={withAlpha(MATH_COLORS.function, 0.08)}
      />

      {/* 3. 二分收敛当前步的精准收敛区间阴影 */}
      {bisectionRes.hasZero && (
        <IntervalShadow
          fn={targetFn}
          x1={currentStepLeft}
          x2={currentStepRight}
          scale={scale}
          fillColor={withAlpha(MATH_COLORS.paramTertiary, 0.2)}
        />
      )}

      {/* 4. 左边界 a 虚线辅助线与控制点 */}
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
        label="a"
        labelKey="a"
        placedLabels={placedLabels}
        fontScale={fontScale}
      />

      {/* 5. 右边界 b 虚线辅助线与控制点 */}
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
        label="b"
        labelKey="b"
        placedLabels={placedLabels}
        fontScale={fontScale}
      />

      {/* 6. 当前二分中点与逼近根 (c_k) */}
      {bisectionRes.hasZero && bisectionRes.currentStep && (
        <g>
          {/* 中点竖向垂线 */}
          <line
            x1={scale.originX + currentMid * scale.scaleX}
            y1={scale.originY - 4.5 * scale.scaleY}
            x2={scale.originX + currentMid * scale.scaleX}
            y2={scale.originY + 4.5 * scale.scaleY}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1.75}
            strokeDasharray="2 2"
          />

          {/* 轴上中点 (c_k, 0) */}
          <MathPoint
            cx={currentMid}
            cy={0}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            r={3.8}
            label={`c_{${steps}}`}
            labelKey="c"
            placedLabels={placedLabels}
            fontScale={fontScale}
          />

          {/* 曲线上中点函数值投影点 (c_k, f(c_k)) */}
          {Number.isFinite(fMid) && (
            <>
              <line
                x1={ptMidAxis.x}
                y1={ptMidAxis.y}
                x2={ptMidCurve.x}
                y2={ptMidCurve.y}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={1.5}
              />
              <MathPoint
                cx={currentMid}
                cy={fMid}
                scale={scale}
                color={MATH_COLORS.paramTertiary}
                r={3.2}
                fontScale={fontScale}
              />
            </>
          )}
        </g>
      )}
    </g>
  );
}
