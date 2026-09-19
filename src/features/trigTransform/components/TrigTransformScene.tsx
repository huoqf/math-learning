import { useMemo } from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  VectorArrow,
} from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { paramDomainRange, snapDragValue } from "@/utils/paramClamp";
import { paramMeta } from "@/data/registries/trigTransform";
import type { SceneScale } from "@/hooks";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  calcTrigProperties,
  getTransformPathSteps,
  calculateIntervalZeros,
  solveParamsFromDrag,
  partitionFivePointsByView,
  DEFAULT_TRIG_XRANGE,
} from "../math/trigTransform";

/**
 * 拖拽五点反解出来的是 A / φ / k 三个**函数参数**（与屏幕坐标不同轴），
 * 故只守左屏声明域，不与可见视口求交（SSOT 见 utils/paramClamp）。
 * 置于模块级：区间恒定，无需每帧重建。
 */
const RANGE_A = paramDomainRange(paramMeta.A);
const RANGE_PHI = paramDomainRange(paramMeta.phi);
const RANGE_K = paramDomainRange(paramMeta.k);
const STEP_PHI = Math.PI / 12;

interface TrigTransformSceneProps {
  params: {
    A: number;
    omega: number;
    phi: number;
    k: number;
    x1?: number;
    x2?: number;
  };
  scale: SceneScale;
  vp?: ViewportInfo;
  onParamChange?: (key: string, value: number) => void;
  fontScale: (v: number) => number;
  studyMode: "properties" | "fivePoints" | "transformPath" | "omegaZeros";
  pathType?: "shift-first" | "stretch-first";
  stepIndex?: number;
  showSymmetry?: boolean;
}

export function TrigTransformScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  studyMode,
  pathType = "shift-first",
  stepIndex = 0,
  showSymmetry = true,
}: TrigTransformSceneProps) {
  const { A, omega, phi, k } = params;
  const x1 = params.x1 ?? 0;
  const x2 = params.x2 ?? Math.PI;

  const trigData = useMemo(
    () => calcTrigProperties(A, omega, phi, k, DEFAULT_TRIG_XRANGE),
    [A, omega, phi, k],
  );

  const pathSteps = useMemo(
    () => getTransformPathSteps(A, omega, phi, k, pathType),
    [A, omega, phi, k, pathType],
  );

  const intervalInfo = useMemo(
    () => calculateIntervalZeros(A, omega, phi, k, x1, x2),
    [A, omega, phi, k, x1, x2],
  );

  const targetFn = useMemo(() => {
    return (x: number) => A * Math.sin(omega * x + phi) + k;
  }, [A, omega, phi, k]);

  const baseFn = useMemo(() => {
    return (x: number) => Math.sin(x);
  }, []);

  const currentStep = pathSteps[stepIndex] ?? pathSteps[0];
  const currentStepFn = currentStep ? currentStep.fn : targetFn;

  // 五点作图反向拖拽处理
  const handlePointDrag = (
    pointIdx: number,
    newMathPos: { x: number; y: number },
  ) => {
    if (!onParamChange) return;
    const updated = solveParamsFromDrag(pointIdx, newMathPos.x, newMathPos.y, {
      A,
      omega,
      phi,
      k,
    });
    // 反解结果必须回到声明域内：旧实现对 A 只设了下限 0.2、对 k 完全没有限制，
    // 把波峰拖到画布顶端即可写出 A = 10（滑块上限 4）、k = 5.5（上限 3），
    // 于是"图形与左屏滑块彻底对不上号"。
    onParamChange("A", snapDragValue(updated.A, 0.1, RANGE_A));
    onParamChange("phi", snapDragValue(updated.phi, STEP_PHI, RANGE_PHI));
    onParamChange("k", snapDragValue(updated.k, 0.5, RANGE_K));
  };

  // 计算区间阴影像素区域
  const pMinX = mathToDesign(Math.min(x1, x2), 0, scale);
  const pMaxX = mathToDesign(Math.max(x1, x2), 0, scale);
  const bandWidth = Math.max(2, Math.abs(pMaxX.x - pMinX.x));

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 模式一：基本性质研究 */}
      {studyMode === "properties" && (
        <>
          {/* 最值参考虚线与右侧避让标注 */}
          <line
            x1={0}
            y1={mathToDesign(0, trigData.yMax, scale).y}
            x2={840}
            y2={mathToDesign(0, trigData.yMax, scale).y}
            stroke={withAlpha(MATH_COLORS.paramPrimary, 0.4)}
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <text
            x={820}
            y={mathToDesign(0, trigData.yMax, scale).y - fontScale(6)}
            textAnchor="end"
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(11)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke={CANVAS_COLORS.white}
            strokeWidth={3}
          >
            y_max = {trigData.yMax.toFixed(2)}
          </text>

          <line
            x1={0}
            y1={mathToDesign(0, trigData.yMin, scale).y}
            x2={840}
            y2={mathToDesign(0, trigData.yMin, scale).y}
            stroke={withAlpha(MATH_COLORS.paramPrimary, 0.4)}
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <text
            x={820}
            y={mathToDesign(0, trigData.yMin, scale).y + fontScale(14)}
            textAnchor="end"
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(11)}
            fontWeight="bold"
            paintOrder="stroke"
            stroke={CANVAS_COLORS.white}
            strokeWidth={3}
          >
            y_min = {trigData.yMin.toFixed(2)}
          </text>

          {/* 平衡轴 y = k */}
          {Math.abs(k) > 1e-4 && (
            <>
              <line
                x1={0}
                y1={mathToDesign(0, k, scale).y}
                x2={840}
                y2={mathToDesign(0, k, scale).y}
                stroke={withAlpha(MATH_COLORS.paramTertiary, 0.6)}
                strokeDasharray="6 3"
                strokeWidth={1.5}
              />
              <text
                x={820}
                y={mathToDesign(0, k, scale).y - fontScale(6)}
                fill={MATH_COLORS.paramTertiary}
                fontSize={fontScale(10)}
                textAnchor="end"
                paintOrder="stroke"
                stroke={CANVAS_COLORS.white}
                strokeWidth={3}
              >
                平衡轴 y = {k.toFixed(1)}
              </text>
            </>
          )}

          {/* 对称轴虚线群 */}
          {showSymmetry &&
            trigData.mainSymmetryAxes.map((xAxis, idx) => {
              const pAxis = mathToDesign(xAxis, 0, scale);
              return (
                <line
                  key={`sym-axis-${idx}`}
                  x1={pAxis.x}
                  y1={0}
                  x2={pAxis.x}
                  y2={650}
                  stroke={withAlpha(MATH_COLORS.paramSecondary, 0.35)}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              );
            })}

          {/* 对称中心标记 (空心 MathPoint) */}
          {showSymmetry &&
            trigData.mainSymmetryCenters.map((center, idx) => {
              return (
                <MathPoint
                  key={`sym-center-${idx}`}
                  cx={center[0]}
                  cy={center[1]}
                  scale={scale}
                  color={MATH_COLORS.paramSecondary}
                  variant="hollow"
                  fontScale={fontScale}
                />
              );
            })}

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
          {/* 主函数曲线 */}
          <FunctionGraph
            fn={targetFn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.5}
          />

          {/* 超出视口友好提示与手柄同源过滤 */}
          {(() => {
            const { visiblePoints, outCount } = partitionFivePointsByView(
              trigData.fivePoints,
              scale.xMin,
              scale.xMax,
            );
            const pillW = Math.max(260, Math.round(fontScale(11) * 20));

            return (
              <>
                {outCount > 0 && (
                  <g transform="translate(24, 28)">
                    <rect
                      x={0}
                      y={0}
                      width={pillW}
                      height={24}
                      rx={4}
                      fill={withAlpha(MATH_COLORS.paramSecondary, 0.9)}
                    />
                    <text
                      x={pillW / 2}
                      y={16}
                      fill={MATH_COLORS.white}
                      fontSize={fontScale(11)}
                      fontWeight="bold"
                      textAnchor="middle"
                      className="select-none pointer-events-none"
                    >
                      {outCount} 个特征点超出视口 · 建议增大 ω 观察
                    </text>
                  </g>
                )}

                {/* 五点作图的关键控制点（支持反向拖拽联动，超界点不渲染避免不可见手柄） */}
                {visiblePoints.map((pt) => {
                  const isPeak = pt.type === "max";
                  const isTrough = pt.type === "min";

                  return (
                    <InteractivePoint
                      key={pt.index}
                      cx={pt.x}
                      cy={pt.y}
                      scale={scale}
                      vp={vp ?? ({} as ViewportInfo)}
                      onDrag={(newPos) => handlePointDrag(pt.index, newPos)}
                      color={
                        isPeak
                          ? MATH_COLORS.paramPrimary
                          : isTrough
                            ? MATH_COLORS.paramSecondary
                            : MATH_COLORS.paramTertiary
                      }
                      r={6}
                      fontScale={fontScale}
                      label={`P${pt.index + 1}`}
                    />
                  );
                })}
              </>
            );
          })()}
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

          {/* 平移位移向量指示 */}
          {currentStep.vectorFrom && currentStep.vectorTo && (
            <>
              <VectorArrow
                from={currentStep.vectorFrom}
                to={currentStep.vectorTo}
                scale={scale}
                color={MATH_COLORS.paramSecondary}
                strokeWidth={2}
                fontScale={fontScale}
                label={currentStep.vectorLabel}
              />
              <MathPoint
                cx={currentStep.vectorFrom[0]}
                cy={currentStep.vectorFrom[1]}
                scale={scale}
                color={MATH_COLORS.paramSecondary}
                variant="solid"
                fontScale={fontScale}
              />
              <MathPoint
                cx={currentStep.vectorTo[0]}
                cy={currentStep.vectorTo[1]}
                scale={scale}
                color={MATH_COLORS.paramPrimary}
                variant="solid"
                fontScale={fontScale}
              />
            </>
          )}
        </>
      )}

      {/* 模式四：ω 范围与区间零点探究 */}
      {studyMode === "omegaZeros" && (
        <>
          {/* 区间 [x1, x2] 阴影高亮带 */}
          <rect
            x={pMinX.x}
            y={0}
            width={bandWidth}
            height={650}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
          />

          {/* 区间左右端点垂线 */}
          <line
            x1={pMinX.x}
            y1={0}
            x2={pMinX.x}
            y2={650}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
            strokeDasharray="5 3"
          />
          <line
            x1={pMaxX.x}
            y1={0}
            x2={pMaxX.x}
            y2={650}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
            strokeDasharray="5 3"
          />

          {/* 区间端点标签（置于顶部，避开中央曲线与坐标轴） */}
          <g transform="translate(0, 48)">
            <text
              x={pMinX.x + 6}
              y={0}
              fill={MATH_COLORS.paramPrimary}
              fontSize={fontScale(11)}
              fontWeight="bold"
              paintOrder="stroke"
              stroke={CANVAS_COLORS.white}
              strokeWidth={3}
            >
              x₁ = {x1.toFixed(2)}
            </text>
            <text
              x={pMaxX.x - 6}
              y={0}
              textAnchor="end"
              fill={MATH_COLORS.paramPrimary}
              fontSize={fontScale(11)}
              fontWeight="bold"
              paintOrder="stroke"
              stroke={CANVAS_COLORS.white}
              strokeWidth={3}
            >
              x₂ = {x2.toFixed(2)}
            </text>
          </g>

          {/* 主函数曲线 */}
          <FunctionGraph
            fn={targetFn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.5}
          />

          {/* 区间内所有零点标记 */}
          {intervalInfo.zeros.map((zero, idx) => {
            const pZ = mathToDesign(zero.x, zero.y, scale);
            const dotColor = zero.isEndpoint
              ? "#DC2626"
              : MATH_COLORS.paramPrimary;
            return (
              <g key={`zero-${idx}`}>
                <MathPoint
                  cx={zero.x}
                  cy={zero.y}
                  scale={scale}
                  color={dotColor}
                  variant="solid"
                  fontScale={fontScale}
                />
                <text
                  x={pZ.x}
                  y={pZ.y + fontScale(15)}
                  textAnchor="middle"
                  fill={dotColor}
                  fontSize={fontScale(9.5)}
                  fontWeight="bold"
                  paintOrder="stroke"
                  stroke={CANVAS_COLORS.white}
                  strokeWidth={3}
                >
                  Z{idx + 1}({zero.x.toFixed(2)})
                  {zero.isEndpoint ? "[端点]" : ""}
                </text>
              </g>
            );
          })}

          {/* 区间内极值点标记 */}
          {intervalInfo.maxima.map((maxPt, idx) => {
            const pM = mathToDesign(maxPt.x, maxPt.y, scale);
            return (
              <g key={`max-${idx}`}>
                <MathPoint
                  cx={maxPt.x}
                  cy={maxPt.y}
                  scale={scale}
                  color={MATH_COLORS.paramSecondary}
                  variant="solid"
                  fontScale={fontScale}
                />
                <text
                  x={pM.x}
                  y={pM.y - fontScale(8)}
                  textAnchor="middle"
                  fill={MATH_COLORS.paramSecondary}
                  fontSize={fontScale(9)}
                  fontWeight="bold"
                  paintOrder="stroke"
                  stroke={CANVAS_COLORS.white}
                  strokeWidth={3}
                >
                  极大({maxPt.x.toFixed(2)})
                </text>
              </g>
            );
          })}

          {intervalInfo.minima.map((minPt, idx) => {
            const pM = mathToDesign(minPt.x, minPt.y, scale);
            return (
              <g key={`min-${idx}`}>
                <MathPoint
                  cx={minPt.x}
                  cy={minPt.y}
                  scale={scale}
                  color={MATH_COLORS.paramTertiary}
                  variant="solid"
                  fontScale={fontScale}
                />
                <text
                  x={pM.x}
                  y={pM.y + fontScale(14)}
                  textAnchor="middle"
                  fill={MATH_COLORS.paramTertiary}
                  fontSize={fontScale(9)}
                  fontWeight="bold"
                  paintOrder="stroke"
                  stroke={CANVAS_COLORS.white}
                  strokeWidth={3}
                >
                  极小({minPt.x.toFixed(2)})
                </text>
              </g>
            );
          })}
        </>
      )}
    </g>
  );
}
