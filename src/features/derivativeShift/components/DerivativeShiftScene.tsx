/**
 * src/features/derivativeShift/components/DerivativeShiftScene.tsx
 * 隐零点定理与极值点偏移 SVG 交互场景
 * 零 React/DOM/window 副作用，接收 fontScale 与 viewport 信息
 */

import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  Asymptote,
  IntervalShadow,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import {
  solveImplicitZero,
  solveExtremumShift,
  solveLogMean,
  type ImplicitZeroModel,
  type ExtremumShiftModel,
} from "@/math/derivativeShift";

interface DerivativeShiftSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  activeMode: string;
  subModel: string;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
}

export function DerivativeShiftScene({
  params,
  scale,
  vp,
  activeMode,
  subModel,
  onParamChange,
  fontScale = (v) => v,
}: DerivativeShiftSceneProps) {
  const a = params.a ?? 1.5;
  const k = params.k ?? 0.25;
  const x1Param = params.x1 ?? 0.3;
  const x2Param = params.x2 ?? 3.5;

  // 1. 隐零点计算
  const izResult = useMemo(
    () => solveImplicitZero(a, subModel as ImplicitZeroModel),
    [a, subModel],
  );

  // 2. 极值点偏移计算
  const shiftResult = useMemo(
    () => solveExtremumShift(k, subModel as ExtremumShiftModel),
    [k, subModel],
  );

  // 3. 对数均值不等式计算
  const logMeanResult = useMemo(
    () => solveLogMean(x1Param, x2Param),
    [x1Param, x2Param],
  );

  // 设计坐标解算
  const zeroPt = useMemo(
    () => mathToDesign(izResult.x0, izResult.y0, scale),
    [izResult, scale],
  );
  const zeroFootPt = useMemo(
    () => mathToDesign(izResult.x0, 0, scale),
    [izResult, scale],
  );
  const tracePt = useMemo(
    () => mathToDesign(izResult.x0, izResult.traceY, scale),
    [izResult, scale],
  );

  const x1Pt = useMemo(
    () => mathToDesign(shiftResult.x1, shiftResult.k, scale),
    [shiftResult, scale],
  );
  const x2Pt = useMemo(
    () => mathToDesign(shiftResult.x2, shiftResult.k, scale),
    [shiftResult, scale],
  );
  const midPt = useMemo(
    () => mathToDesign(shiftResult.midX, shiftResult.k, scale),
    [shiftResult, scale],
  );

  const mirrorPtAtX1 = useMemo(
    () =>
      mathToDesign(
        2 * shiftResult.x0 - shiftResult.x1,
        shiftResult.fn(2 * shiftResult.x0 - shiftResult.x1),
        scale,
      ),
    [shiftResult, scale],
  );

  // 拖拽回调
  const handleDragX0 = (mathPt: { x: number; y: number }) => {
    const newX0 = Math.max(0.1, mathPt.x);
    if (subModel === "x_ln_x") {
      const newA = Math.log(newX0) + 1;
      onParamChange("a", Math.round(newA * 20) / 20);
    } else {
      const newA = Math.exp(newX0);
      onParamChange("a", Math.round(newA * 20) / 20);
    }
  };

  const handleDragSecant = (mathPt: { x: number; y: number }) => {
    const newK = Math.min(Math.max(0.02, mathPt.y), shiftResult.y0 - 0.005);
    onParamChange("k", Math.round(newK * 100) / 100);
  };

  const handleDragLogMeanX1 = (mathPt: { x: number; y: number }) => {
    const newX1 = Math.min(Math.max(0.1, mathPt.x), x2Param - 0.2);
    onParamChange("x1", Math.round(newX1 * 20) / 20);
  };

  const handleDragLogMeanX2 = (mathPt: { x: number; y: number }) => {
    const newX2 = Math.max(x1Param + 0.2, mathPt.x);
    onParamChange("x2", Math.round(newX2 * 10) / 10);
  };

  return (
    <g>
      {/* 统一坐标轴网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* ─── 模式一：隐零点设而不求与极值消元 ─── */}
      {activeMode === "implicit_zero" && (
        <g>
          {/* 原函数 f(x) 曲线 */}
          <FunctionGraph
            fn={izResult.fn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.5}
          />

          {/* 导函数 f'(x) 曲线 */}
          <FunctionGraph
            fn={izResult.dfn}
            scale={scale}
            color={MATH_COLORS.derivative}
            strokeWidth={1.8}
            strokeDasharray="4 3"
          />

          {/* 极值消元轨迹 h(x) 曲线 */}
          <FunctionGraph
            fn={izResult.traceFn}
            scale={scale}
            color={MATH_COLORS.trace}
            strokeWidth={2}
            strokeDasharray="6 4"
          />

          {/* 隐零点 x0 处的垂直虚线 */}
          <Asymptote
            type="vertical"
            value={izResult.x0}
            scale={scale}
            color={withAlpha(MATH_COLORS.paramPrimary, 0.6)}
            label={`x₀ = ${izResult.x0.toFixed(2)}`}
            fontScale={fontScale}
          />

          {/* x0 的 x 轴足点连线 */}
          <line
            x1={zeroFootPt.x}
            y1={zeroFootPt.y}
            x2={zeroPt.x}
            y2={zeroPt.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />

          {/* 极值点 (x0, f(x0)) 可拖拽点 */}
          <InteractivePoint
            cx={izResult.x0}
            cy={izResult.y0}
            scale={scale}
            vp={vp}
            onDrag={handleDragX0}
            color={MATH_COLORS.paramPrimary}
            r={6}
            label={`极值 P(${izResult.x0.toFixed(2)}, ${izResult.y0.toFixed(2)})`}
            fontScale={fontScale}
          />

          {/* 代换消元下的轨迹点 (x0, h(x0)) */}
          <circle
            cx={tracePt.x}
            cy={tracePt.y}
            r={5}
            fill={MATH_COLORS.paramSecondary}
            stroke={CANVAS_COLORS.white}
            strokeWidth={1.5}
          />
          <text
            x={tracePt.x + 10}
            y={tracePt.y + 4}
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            轨迹 h(x₀) = {izResult.traceY.toFixed(2)}
          </text>

          {/* 图例说明卡片 (图上标注) */}
          <g
            transform={`translate(${scale.originX - 180}, ${scale.originY - 140})`}
          >
            <rect
              x={0}
              y={0}
              width={160}
              height={64}
              rx={6}
              fill={CANVAS_COLORS.white}
              fillOpacity={0.85}
              stroke={CANVAS_COLORS.grid}
              strokeWidth={1}
            />
            <line
              x1={10}
              y1={16}
              x2={30}
              y2={16}
              stroke={MATH_COLORS.function}
              strokeWidth={2.5}
            />
            <text
              x={36}
              y={19}
              fontSize={fontScale(10)}
              fill={CANVAS_COLORS.labelTextLight}
            >
              原函数 f(x)
            </text>
            <line
              x1={10}
              y1={34}
              x2={30}
              y2={34}
              stroke={MATH_COLORS.derivative}
              strokeWidth={1.8}
              strokeDasharray="4 3"
            />
            <text
              x={36}
              y={37}
              fontSize={fontScale(10)}
              fill={CANVAS_COLORS.labelTextLight}
            >
              导函数 f'(x)
            </text>
            <line
              x1={10}
              y1={50}
              x2={30}
              y2={50}
              stroke={MATH_COLORS.trace}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            <text
              x={36}
              y={53}
              fontSize={fontScale(10)}
              fill={CANVAS_COLORS.labelTextLight}
            >
              消元轨迹 h(x₀)
            </text>
          </g>
        </g>
      )}

      {/* ─── 模式二：极值点偏移与对称构造法 ─── */}
      {activeMode === "shift_symmetric" && (
        <g>
          {/* 原函数 f(x) 曲线 */}
          <FunctionGraph
            fn={shiftResult.fn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.5}
          />

          {/* 镜像对称曲线 y = f(2x0 - x) */}
          <FunctionGraph
            fn={shiftResult.mirrorFn}
            scale={scale}
            color={withAlpha(MATH_COLORS.functionTransformed, 0.75)}
            strokeWidth={2}
            strokeDasharray="5 4"
          />

          {/* 极值点 x0 对称中轴 */}
          <Asymptote
            type="vertical"
            value={shiftResult.x0}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            label={`对称轴 x₀ = ${shiftResult.x0.toFixed(2)}`}
            fontScale={fontScale}
          />

          {/* 水平割线 y = k */}
          <Asymptote
            type="horizontal"
            value={shiftResult.k}
            scale={scale}
            color={MATH_COLORS.secantLine}
            label={`y = k = ${shiftResult.k.toFixed(2)}`}
            fontScale={fontScale}
          />

          {/* 偏移区间高亮阴影: [x1, x2] 的相对区域 */}
          <IntervalShadow
            fn={shiftResult.fn}
            x1={shiftResult.x0}
            x2={shiftResult.midX}
            scale={scale}
            fillColor={withAlpha(MATH_COLORS.paramTertiary, 0.2)}
          />

          {/* 水平割线上的控制点：拖动改变 k */}
          <InteractivePoint
            cx={shiftResult.x0}
            cy={shiftResult.k}
            scale={scale}
            vp={vp}
            onDrag={handleDragSecant}
            color={MATH_COLORS.secantLine}
            r={6}
            label={`拖动割线 y = ${shiftResult.k.toFixed(2)}`}
            fontScale={fontScale}
          />

          {/* 双根交点 P1(x1, k) 与 P2(x2, k) */}
          <circle
            cx={x1Pt.x}
            cy={x1Pt.y}
            r={5}
            fill={MATH_COLORS.function}
            stroke={CANVAS_COLORS.white}
            strokeWidth={1.5}
          />
          <text
            x={x1Pt.x - 12}
            y={x1Pt.y - 10}
            fill={MATH_COLORS.function}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            x₁({shiftResult.x1.toFixed(2)})
          </text>

          <circle
            cx={x2Pt.x}
            cy={x2Pt.y}
            r={5}
            fill={MATH_COLORS.functionSecondary}
            stroke={CANVAS_COLORS.white}
            strokeWidth={1.5}
          />
          <text
            x={x2Pt.x + 10}
            y={x2Pt.y - 10}
            fill={MATH_COLORS.functionSecondary}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            x₂({shiftResult.x2.toFixed(2)})
          </text>

          {/* 中点 (x1+x2)/2 */}
          <circle
            cx={midPt.x}
            cy={midPt.y}
            r={5}
            fill={MATH_COLORS.paramSecondary}
            stroke={CANVAS_COLORS.white}
            strokeWidth={1.5}
          />
          <line
            x1={midPt.x}
            y1={midPt.y}
            x2={midPt.x}
            y2={scale.originY}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          <text
            x={midPt.x - 20}
            y={scale.originY - 10}
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(10)}
            fontWeight="bold"
          >
            中点 {shiftResult.midX.toFixed(2)}
          </text>

          {/* 镜像点 (2x0 - x1, f(2x0 - x1)) */}
          <circle
            cx={mirrorPtAtX1.x}
            cy={mirrorPtAtX1.y}
            r={4}
            fill={MATH_COLORS.functionTransformed}
            stroke={CANVAS_COLORS.white}
            strokeWidth={1}
          />
          <line
            x1={x2Pt.x}
            y1={x2Pt.y}
            x2={mirrorPtAtX1.x}
            y2={mirrorPtAtX1.y}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
          <text
            x={mirrorPtAtX1.x + 8}
            y={mirrorPtAtX1.y + 12}
            fill={MATH_COLORS.functionTransformed}
            fontSize={fontScale(10)}
          >
            镜像点 f(2x₀ - x₁)
          </text>

          {/* 偏向文字提示卡片 */}
          <g
            transform={`translate(${scale.originX + 120}, ${scale.originY - 140})`}
          >
            <rect
              x={0}
              y={0}
              width={170}
              height={50}
              rx={6}
              fill={CANVAS_COLORS.white}
              fillOpacity={0.9}
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={1.5}
            />
            <text
              x={12}
              y={22}
              fill={MATH_COLORS.paramTertiary}
              fontSize={fontScale(11)}
              fontWeight="bold"
            >
              偏移结论:{" "}
              {shiftResult.shiftType === "right"
                ? "右偏 (x₁ + x₂ > 2x₀)"
                : "左偏"}
            </text>
            <text
              x={12}
              y={38}
              fill={CANVAS_COLORS.labelTextLight}
              fontSize={fontScale(10)}
            >
              中点偏离量 Δ = {shiftResult.delta.toFixed(3)}
            </text>
          </g>
        </g>
      )}

      {/* ─── 模式三：对数均值不等式与齐次化 ─── */}
      {activeMode === "log_mean" && (
        <g>
          {/* 对数曲线 ln x */}
          <FunctionGraph
            fn={(x) => (x > 0 ? Math.log(x) : NaN)}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.5}
          />

          {/* 可拖动端点 x1 与 x2 */}
          <InteractivePoint
            cx={logMeanResult.x1}
            cy={Math.log(logMeanResult.x1)}
            scale={scale}
            vp={vp}
            onDrag={handleDragLogMeanX1}
            color={MATH_COLORS.function}
            r={6}
            label={`x₁ = ${logMeanResult.x1.toFixed(2)}`}
            fontScale={fontScale}
          />

          <InteractivePoint
            cx={logMeanResult.x2}
            cy={Math.log(logMeanResult.x2)}
            scale={scale}
            vp={vp}
            onDrag={handleDragLogMeanX2}
            color={MATH_COLORS.functionSecondary}
            r={6}
            label={`x₂ = ${logMeanResult.x2.toFixed(2)}`}
            fontScale={fontScale}
          />

          {/* 三大均值位置标注 */}
          {(() => {
            const geoPt = mathToDesign(logMeanResult.geoMean, 0, scale);
            const logPt = mathToDesign(logMeanResult.logMean, 0, scale);
            const ariPt = mathToDesign(logMeanResult.ariMean, 0, scale);
            return (
              <g>
                {/* 几何均值 sqrt(x1 x2) */}
                <circle
                  cx={geoPt.x}
                  cy={geoPt.y}
                  r={4}
                  fill={MATH_COLORS.function}
                />
                <line
                  x1={geoPt.x}
                  y1={geoPt.y}
                  x2={geoPt.x}
                  y2={geoPt.y + 35}
                  stroke={MATH_COLORS.function}
                  strokeWidth={1.5}
                />
                <text
                  x={geoPt.x - 20}
                  y={geoPt.y + 48}
                  fill={MATH_COLORS.function}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  √(x₁x₂)={logMeanResult.geoMean.toFixed(2)}
                </text>

                {/* 对数均值 L(x1, x2) */}
                <circle
                  cx={logPt.x}
                  cy={logPt.y}
                  r={5}
                  fill={MATH_COLORS.paramPrimary}
                />
                <line
                  x1={logPt.x}
                  y1={logPt.y}
                  x2={logPt.x}
                  y2={logPt.y + 15}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={2}
                />
                <text
                  x={logPt.x - 18}
                  y={logPt.y + 26}
                  fill={MATH_COLORS.paramPrimary}
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                >
                  L(x₁,x₂)={logMeanResult.logMean.toFixed(2)}
                </text>

                {/* 算术均值 (x1+x2)/2 */}
                <circle
                  cx={ariPt.x}
                  cy={ariPt.y}
                  r={4}
                  fill={MATH_COLORS.paramSecondary}
                />
                <line
                  x1={ariPt.x}
                  y1={ariPt.y}
                  x2={ariPt.x}
                  y2={ariPt.y + 35}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1.5}
                />
                <text
                  x={ariPt.x - 20}
                  y={ariPt.y + 48}
                  fill={MATH_COLORS.paramSecondary}
                  fontSize={fontScale(10)}
                  fontWeight="bold"
                >
                  (x₁+x₂)/2={logMeanResult.ariMean.toFixed(2)}
                </text>
              </g>
            );
          })()}

          {/* 关系链大展示 */}
          <g
            transform={`translate(${scale.originX - 180}, ${scale.originY - 140})`}
          >
            <rect
              x={0}
              y={0}
              width={340}
              height={44}
              rx={6}
              fill={CANVAS_COLORS.white}
              fillOpacity={0.9}
              stroke={MATH_COLORS.paramPrimary}
              strokeWidth={1.5}
            />
            <text
              x={14}
              y={27}
              fill={CANVAS_COLORS.labelText}
              fontSize={fontScale(11)}
              fontWeight="bold"
            >
              对数均值不等式链： √(x₁x₂) &lt; L(x₁, x₂) &lt; (x₁ + x₂)/2
            </text>
          </g>
        </g>
      )}
    </g>
  );
}
