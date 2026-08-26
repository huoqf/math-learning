/**
 * src/features/derivativeShift/components/DerivativeShiftScene.tsx
 * 隐零点定理与极值点偏移 SVG 交互场景
 * 零 React/DOM/window 副作用，接收 fontScale 与 viewport 信息
 * 全量接入 resolveLabelPlacements 智能多方向标签避让算法
 */

import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  Asymptote,
  IntervalShadow,
  SceneLabelGroup,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { LabelItem } from "@/utils/labelOverlap";
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

  // 模式三：割线与切线端点解算
  const p1Design = useMemo(
    () => mathToDesign(logMeanResult.x1, Math.log(logMeanResult.x1), scale),
    [logMeanResult.x1, scale],
  );
  const p2Design = useMemo(
    () => mathToDesign(logMeanResult.x2, Math.log(logMeanResult.x2), scale),
    [logMeanResult.x2, scale],
  );
  const tangentPtDesign = useMemo(
    () =>
      mathToDesign(
        logMeanResult.logMean,
        Math.log(logMeanResult.logMean),
        scale,
      ),
    [logMeanResult.logMean, scale],
  );
  const tanL = logMeanResult.logMean;
  const tanSlope = 1 / tanL;
  const tanY0 = Math.log(tanL);
  const tanLeftDesign = useMemo(
    () =>
      mathToDesign(
        Math.max(0.05, tanL - 1.2),
        tanY0 - tanSlope * Math.min(1.2, tanL - 0.05),
        scale,
      ),
    [tanL, tanSlope, tanY0, scale],
  );
  const tanRightDesign = useMemo(
    () => mathToDesign(tanL + 1.2, tanY0 + tanSlope * 1.2, scale),
    [tanL, tanSlope, tanY0, scale],
  );
  const midPt = useMemo(
    () => mathToDesign(shiftResult.midX, shiftResult.k, scale),
    [shiftResult, scale],
  );

  // 6. 纯极简学术点标解算 (集中定义学术符号)
  const modeLabels = useMemo<LabelItem[]>(() => {
    if (activeMode === "implicit_zero") {
      const items: LabelItem[] = [
        {
          key: "zero_p",
          x: zeroPt.x,
          y: zeroPt.y,
          text: "P",
          color: MATH_COLORS.paramPrimary,
          fontSize: fontScale(13),
          preferredPlacement: "top-right",
        },
        {
          key: "df_x0",
          x: zeroFootPt.x,
          y: zeroFootPt.y,
          text: "x₀",
          color: MATH_COLORS.derivative,
          fontSize: fontScale(12),
          preferredPlacement: "bottom-left",
        },
      ];
      return items;
    } else if (activeMode === "shift_symmetric") {
      const p1 = mathToDesign(shiftResult.x1, shiftResult.k, scale);
      const p2 = mathToDesign(shiftResult.x2, shiftResult.k, scale);
      const p1m = mathToDesign(
        2 * shiftResult.x0 - shiftResult.x1,
        shiftResult.k,
        scale,
      );
      const mid = mathToDesign(shiftResult.midX, shiftResult.k, scale);

      const items: LabelItem[] = [
        {
          key: "p1",
          x: p1.x,
          y: p1.y,
          text: "P₁",
          color: MATH_COLORS.function,
          fontSize: fontScale(12),
          preferredPlacement: "top-left",
        },
        {
          key: "p2",
          x: p2.x,
          y: p2.y,
          text: "P₂",
          color: MATH_COLORS.functionSecondary,
          fontSize: fontScale(12),
          preferredPlacement: "top-right",
        },
        {
          key: "p1_mirror",
          x: p1m.x,
          y: p1m.y,
          text: "P'₁",
          color: MATH_COLORS.functionTransformed,
          fontSize: fontScale(11),
          preferredPlacement: "bottom-left",
        },
        {
          key: "mid",
          x: mid.x,
          y: mid.y,
          text: "M",
          color: MATH_COLORS.paramSecondary,
          fontSize: fontScale(12),
          preferredPlacement: "bottom",
        },
      ];
      return items;
    } else {
      const geo = mathToDesign(logMeanResult.geoMean, 0, scale);
      const logM = mathToDesign(logMeanResult.logMean, 0, scale);
      const ari = mathToDesign(logMeanResult.ariMean, 0, scale);

      const items: LabelItem[] = [
        {
          key: "p1",
          x: p1Design.x,
          y: p1Design.y,
          text: "P₁",
          color: MATH_COLORS.function,
          fontSize: fontScale(12),
          preferredPlacement: "top-left",
        },
        {
          key: "p2",
          x: p2Design.x,
          y: p2Design.y,
          text: "P₂",
          color: MATH_COLORS.functionSecondary,
          fontSize: fontScale(12),
          preferredPlacement: "top-right",
        },
        {
          key: "tangent_t",
          x: tangentPtDesign.x,
          y: tangentPtDesign.y,
          text: "T",
          color: MATH_COLORS.tangentLine,
          fontSize: fontScale(12),
          preferredPlacement: "top",
        },
        {
          key: "geo",
          x: geo.x,
          y: geo.y,
          text: "G",
          color: MATH_COLORS.function,
          fontSize: fontScale(11),
          preferredPlacement: "bottom-left",
        },
        {
          key: "logM",
          x: logM.x,
          y: logM.y,
          text: "L",
          color: MATH_COLORS.paramPrimary,
          fontSize: fontScale(11),
          preferredPlacement: "bottom",
        },
        {
          key: "ari",
          x: ari.x,
          y: ari.y,
          text: "A",
          color: MATH_COLORS.paramSecondary,
          fontSize: fontScale(11),
          preferredPlacement: "bottom-right",
        },
      ];
      return items;
    }
  }, [
    activeMode,
    zeroPt,
    zeroFootPt,
    shiftResult,
    logMeanResult,
    scale,
    fontScale,
    p1Design,
    p2Design,
    tangentPtDesign,
  ]);

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
            label="x = x₀"
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
            fontScale={fontScale}
          />

          {/* 代换消元下的轨迹点 (x0, h(x0)) */}
          <MathPoint
            cx={izResult.x0}
            cy={izResult.traceY}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
          />

          {/* 导数零点 (x0, 0) */}
          <MathPoint
            cx={izResult.x0}
            cy={0}
            scale={scale}
            color={MATH_COLORS.derivative}
            variant="hollow"
            fontScale={fontScale}
          />
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
            color={withAlpha(MATH_COLORS.functionTransformed, 0.85)}
            strokeWidth={2}
            strokeDasharray="5 4"
          />

          {/* 极值点 x0 对称中轴 */}
          <Asymptote
            type="vertical"
            value={shiftResult.x0}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            label="对称轴 x = x₀"
            fontScale={fontScale}
          />

          {/* 水平割线 y = k */}
          <Asymptote
            type="horizontal"
            value={shiftResult.k}
            scale={scale}
            color={MATH_COLORS.secantLine}
            label="割线 y = k"
            fontScale={fontScale}
          />

          {/* 偏移区间高亮阴影: [x0, midX] */}
          <IntervalShadow
            fn={shiftResult.fn}
            x1={shiftResult.x0}
            x2={shiftResult.midX}
            scale={scale}
            fillColor={withAlpha(MATH_COLORS.paramTertiary, 0.25)}
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
            fontScale={fontScale}
          />

          {/* 双根交点 P1(x1, k) 与 P2(x2, k) */}
          <MathPoint
            cx={shiftResult.x1}
            cy={shiftResult.k}
            scale={scale}
            color={MATH_COLORS.function}
            fontScale={fontScale}
          />

          <MathPoint
            cx={shiftResult.x2}
            cy={shiftResult.k}
            scale={scale}
            color={MATH_COLORS.functionSecondary}
            fontScale={fontScale}
          />

          {/* 对称点 P'1(2x0 - x1, k) */}
          <MathPoint
            cx={2 * shiftResult.x0 - shiftResult.x1}
            cy={shiftResult.k}
            scale={scale}
            color={MATH_COLORS.functionTransformed}
            variant="hollow"
            fontScale={fontScale}
          />

          {/* 两根中点 M((x1+x2)/2, k) */}
          <MathPoint
            cx={shiftResult.midX}
            cy={shiftResult.k}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
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

          {/* x1 处的差值垂线段展示 F(x1) = f(x1) - f(2x0-x1) */}
          {(() => {
            const topPt = mathToDesign(
              shiftResult.x1,
              shiftResult.mirrorFn(shiftResult.x1),
              scale,
            );
            const botPt = mathToDesign(
              shiftResult.x1,
              shiftResult.fn(shiftResult.x1),
              scale,
            );
            if (!isNaN(topPt.y) && !isNaN(botPt.y)) {
              return (
                <g>
                  <line
                    x1={topPt.x}
                    y1={topPt.y}
                    x2={botPt.x}
                    y2={botPt.y}
                    stroke={MATH_COLORS.paramTertiary}
                    strokeWidth={1.8}
                    strokeDasharray="3 2"
                  />
                  <text
                    x={topPt.x - 45}
                    y={(topPt.y + botPt.y) / 2}
                    fill={MATH_COLORS.paramTertiary}
                    fontSize={fontScale(10)}
                    fontWeight="bold"
                  >
                    高度差 F(x₁)
                  </text>
                </g>
              );
            }
            return null;
          })()}
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

          {/* 割线 P1P2 */}
          <line
            x1={p1Design.x}
            y1={p1Design.y}
            x2={p2Design.x}
            y2={p2Design.y}
            stroke={MATH_COLORS.secantLine}
            strokeWidth={1.8}
            strokeDasharray="4 3"
          />

          {/* 切点处的平行切线 */}
          <line
            x1={tanLeftDesign.x}
            y1={tanLeftDesign.y}
            x2={tanRightDesign.x}
            y2={tanRightDesign.y}
            stroke={MATH_COLORS.tangentLine}
            strokeWidth={2}
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
            fontScale={fontScale}
          />

          {/* 切点 T(L, ln L) */}
          <MathPoint
            cx={logMeanResult.logMean}
            cy={Math.log(logMeanResult.logMean)}
            scale={scale}
            color={MATH_COLORS.tangentLine}
            fontScale={fontScale}
          />

          {/* 切点到 x 轴的垂线 */}
          <line
            x1={tangentPtDesign.x}
            y1={tangentPtDesign.y}
            x2={tangentPtDesign.x}
            y2={scale.originY}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />

          {/* 三大均值位置标注 */}
          <MathPoint
            cx={logMeanResult.geoMean}
            cy={0}
            scale={scale}
            color={MATH_COLORS.function}
            fontScale={fontScale}
          />

          <MathPoint
            cx={logMeanResult.logMean}
            cy={0}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
          />

          <MathPoint
            cx={logMeanResult.ariMean}
            cy={0}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ─── 统一智能避让学术点标 ─── */}
      <SceneLabelGroup items={modeLabels} fontScale={fontScale} />
    </g>
  );
}
