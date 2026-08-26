import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  Asymptote,
  SceneLabelGroup,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { LabelItem } from "@/utils/labelOverlap";
import type { TranscendentalMode } from "@/math/transcendental";

interface SceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  mode: TranscendentalMode;
  subMode: string;
  fontScale?: (v: number) => number;
}

export function TranscendentalScene({
  params,
  scale,
  vp,
  onParamChange,
  mode,
  subMode,
  fontScale = (v) => v,
}: SceneProps) {
  const x0 = params.x0 ?? 0;
  const a = params.a ?? 1.0;
  const isShiftMode = mode === "exp" && subMode === "shift_1";
  const isQuadraticBound = mode === "log" && subMode === "quadratic_bound";

  // 1. 拖拽回调
  const handleDragX0 = (mathPt: { x: number; y: number }) => {
    let newX0 = Math.round(mathPt.x * 10) / 10;
    if (mode === "log" && newX0 <= 0.05) {
      newX0 = 0.05;
    }
    if (mode === "chain" && newX0 <= 0.05) {
      newX0 = 0.05;
    }
    onParamChange("x0", newX0);
  };

  // 2. 指数切线与放缩计算
  const expFn = useMemo(() => {
    return isShiftMode
      ? (x: number) => Math.exp(x - 1)
      : (x: number) => Math.exp(x);
  }, [isShiftMode]);

  const expY0 = expFn(x0);
  const expSlope = expY0;
  const expIntercept = expY0 * (1 - x0);

  // 3. 对数切线与放缩计算
  const validLogX0 = Math.max(0.05, x0);
  const logY0 = Math.log(validLogX0);
  const logSlope = 1 / validLogX0;
  const logIntercept = logY0 - 1;

  // 4. 双基准对偶计算
  const validChainX0 = Math.max(0.05, x0);
  const chainExpY = Math.exp(validChainX0 - 1);
  const chainLogY = Math.log(validChainX0) + 1;

  // 5. 差值阴影区
  const expDiffAreaD = useMemo(() => {
    if (mode !== "exp") return "";
    const points: { x: number; y: number }[] = [];
    const xMin = isShiftMode ? -1.5 : -2.5;
    const xMax = isShiftMode ? 3.0 : 2.5;
    const steps = 40;
    const dx = (xMax - xMin) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = expFn(x);
      points.push(mathToDesign(x, y, scale));
    }
    for (let i = steps; i >= 0; i--) {
      const x = xMin + i * dx;
      const y = isShiftMode ? x : x + 1;
      points.push(mathToDesign(x, y, scale));
    }

    if (points.length === 0) return "";
    return (
      `M ${points[0].x} ${points[0].y} ` +
      points
        .slice(1)
        .map((p) => `L ${p.x} ${p.y}`)
        .join(" ") +
      " Z"
    );
  }, [mode, isShiftMode, expFn, scale]);

  const logDiffAreaD = useMemo(() => {
    if (mode !== "log") return "";
    const points: { x: number; y: number }[] = [];
    const xMin = isQuadraticBound ? 0.2 : 0.15;
    const xMax = 3.5;
    const steps = 40;
    const dx = (xMax - xMin) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = isQuadraticBound ? 0.5 * (x * x - 1) : x - 1;
      points.push(mathToDesign(x, y, scale));
    }
    for (let i = steps; i >= 0; i--) {
      const x = xMin + i * dx;
      const y = Math.log(x);
      points.push(mathToDesign(x, y, scale));
    }

    if (points.length === 0) return "";
    return (
      `M ${points[0].x} ${points[0].y} ` +
      points
        .slice(1)
        .map((p) => `L ${p.x} ${p.y}`)
        .join(" ") +
      " Z"
    );
  }, [mode, isQuadraticBound, scale]);

  const chainDiffAreaD = useMemo(() => {
    if (mode !== "chain") return "";
    const points: { x: number; y: number }[] = [];
    const xMin = 0.2;
    const xMax = 2.4;
    const steps = 40;
    const dx = (xMax - xMin) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = Math.exp(x - 1);
      points.push(mathToDesign(x, y, scale));
    }
    for (let i = steps; i >= 0; i--) {
      const x = xMin + i * dx;
      const y = Math.log(x) + 1;
      points.push(mathToDesign(x, y, scale));
    }

    if (points.length === 0) return "";
    return (
      `M ${points[0].x} ${points[0].y} ` +
      points
        .slice(1)
        .map((p) => `L ${p.x} ${p.y}`)
        .join(" ") +
      " Z"
    );
  }, [mode, scale]);

  // 6. 纯极简学术点标解算 (利用 SceneLabelGroup 算法)
  const modeLabels = useMemo<LabelItem[]>(() => {
    if (mode === "exp") {
      const p0 = mathToDesign(isShiftMode ? 1 : 0, 1, scale);
      const pDyn = mathToDesign(x0, expY0, scale);
      const items: LabelItem[] = [
        {
          key: "p0",
          x: p0.x,
          y: p0.y,
          text: "P₀",
          color: MATH_COLORS.focusPoint,
          fontSize: fontScale(12),
          preferredPlacement: "top-left",
        },
        {
          key: "pDyn",
          x: pDyn.x,
          y: pDyn.y,
          text: "P",
          color: MATH_COLORS.paramPrimary,
          fontSize: fontScale(13),
          preferredPlacement: "top-right",
        },
      ];
      return items;
    } else if (mode === "log") {
      const p0 = mathToDesign(1, 0, scale);
      const pDyn = mathToDesign(validLogX0, logY0, scale);
      const items: LabelItem[] = [
        {
          key: "p0",
          x: p0.x,
          y: p0.y,
          text: "P₀",
          color: MATH_COLORS.focusPoint,
          fontSize: fontScale(12),
          preferredPlacement: "bottom-left",
        },
        {
          key: "pDyn",
          x: pDyn.x,
          y: pDyn.y,
          text: "P",
          color: MATH_COLORS.paramPrimary,
          fontSize: fontScale(13),
          preferredPlacement: "top-right",
        },
      ];
      return items;
    } else if (mode === "chain") {
      const p0 = mathToDesign(1, 1, scale);
      const pUpper = mathToDesign(validChainX0, chainExpY, scale);
      const pLower = mathToDesign(validChainX0, chainLogY, scale);
      const pMid = mathToDesign(validChainX0, validChainX0, scale);

      const items: LabelItem[] = [
        {
          key: "p0",
          x: p0.x,
          y: p0.y,
          text: "P₀",
          color: MATH_COLORS.paramSecondary,
          fontSize: fontScale(12),
          preferredPlacement: "bottom-left",
        },
        {
          key: "p1",
          x: pUpper.x,
          y: pUpper.y,
          text: "P₁",
          color: MATH_COLORS.function,
          fontSize: fontScale(12),
          preferredPlacement: "top-left",
        },
        {
          key: "p2",
          x: pLower.x,
          y: pLower.y,
          text: "P₂",
          color: MATH_COLORS.functionTransformed,
          fontSize: fontScale(12),
          preferredPlacement: "bottom-right",
        },
        {
          key: "pMid",
          x: pMid.x,
          y: pMid.y,
          text: "P",
          color: MATH_COLORS.paramPrimary,
          fontSize: fontScale(13),
          preferredPlacement: "top-right",
        },
      ];
      return items;
    } else {
      const p0 = mathToDesign(0, 1, scale);
      const items: LabelItem[] = [
        {
          key: "p0",
          x: p0.x,
          y: p0.y,
          text: "P₀",
          color: MATH_COLORS.tangentLine,
          fontSize: fontScale(12),
          preferredPlacement: "top-left",
        },
      ];
      return items;
    }
  }, [
    mode,
    isShiftMode,
    x0,
    expY0,
    validLogX0,
    logY0,
    validChainX0,
    chainExpY,
    chainLogY,
    scale,
    fontScale,
  ]);

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* ================= 模式 1: 指数切线放缩 ================= */}
      {mode === "exp" && (
        <g>
          {expDiffAreaD && (
            <path
              d={expDiffAreaD}
              fill={withAlpha(MATH_COLORS.paramTertiary, 0.18)}
              stroke="none"
            />
          )}

          {/* 基准切线 */}
          <FunctionGraph
            fn={isShiftMode ? (x) => x : (x) => x + 1}
            scale={scale}
            color={MATH_COLORS.tangentLine}
            strokeWidth={2.5}
            strokeDasharray="6 4"
          />

          {/* 指数曲线 */}
          <FunctionGraph
            fn={expFn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={3}
          />

          {/* 动切线 */}
          <FunctionGraph
            fn={(x) => expSlope * x + expIntercept}
            scale={scale}
            color={withAlpha(MATH_COLORS.paramPrimary, 0.7)}
            strokeWidth={1.8}
            strokeDasharray="3 3"
          />

          {/* 基准切点 P0 */}
          <MathPoint
            cx={isShiftMode ? 1 : 0}
            cy={1}
            scale={scale}
            color={MATH_COLORS.focusPoint}
            fontScale={fontScale}
          />

          {/* 可拖拽切点 P */}
          <InteractivePoint
            cx={x0}
            cy={expY0}
            scale={scale}
            vp={vp}
            onDrag={handleDragX0}
            color={MATH_COLORS.paramPrimary}
            r={6}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ================= 模式 2: 对数切线放缩 ================= */}
      {mode === "log" && (
        <g>
          {logDiffAreaD && (
            <path
              d={logDiffAreaD}
              fill={withAlpha(MATH_COLORS.paramTertiary, 0.18)}
              stroke="none"
            />
          )}

          {/* 基准放缩线 */}
          {isQuadraticBound ? (
            <FunctionGraph
              fn={(x) => 0.5 * (x * x - 1)}
              scale={scale}
              color={MATH_COLORS.paramSecondary}
              strokeWidth={2.5}
              strokeDasharray="5 4"
            />
          ) : (
            <FunctionGraph
              fn={(x) => x - 1}
              scale={scale}
              color={MATH_COLORS.tangentLine}
              strokeWidth={2.5}
              strokeDasharray="6 4"
            />
          )}

          {/* 对数曲线 */}
          <FunctionGraph
            fn={(x) => (x > 0 ? Math.log(x) : NaN)}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={3}
          />

          {/* 动切线 */}
          <FunctionGraph
            fn={(x) => logSlope * x + logIntercept}
            scale={scale}
            color={withAlpha(MATH_COLORS.paramPrimary, 0.7)}
            strokeWidth={1.8}
            strokeDasharray="3 3"
          />

          {/* 渐近线 x = 0 */}
          <Asymptote
            type="vertical"
            value={0}
            scale={scale}
            color={withAlpha(MATH_COLORS.function, 0.4)}
            fontScale={fontScale}
          />

          {/* 基准切点 P0 */}
          <MathPoint
            cx={1}
            cy={0}
            scale={scale}
            color={MATH_COLORS.focusPoint}
            fontScale={fontScale}
          />

          {/* 可拖拽切点 P */}
          <InteractivePoint
            cx={validLogX0}
            cy={logY0}
            scale={scale}
            vp={vp}
            onDrag={handleDragX0}
            color={MATH_COLORS.paramPrimary}
            r={6}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ================= 模式 3: 双基准对偶与对称夹逼 ================= */}
      {mode === "chain" && (
        <g>
          {chainDiffAreaD && (
            <path
              d={chainDiffAreaD}
              fill={withAlpha(MATH_COLORS.paramTertiary, 0.22)}
              stroke="none"
            />
          )}

          {/* 中轴基准切线 y = x */}
          <FunctionGraph
            fn={(x) => x}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
            strokeDasharray="6 4"
          />

          {/* 上界指数曲线 y = e^{x-1} */}
          <FunctionGraph
            fn={(x) => Math.exp(x - 1)}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={3}
          />

          {/* 下界对数曲线 y = ln x + 1 */}
          <FunctionGraph
            fn={(x) => (x > 0 ? Math.log(x) + 1 : NaN)}
            scale={scale}
            color={MATH_COLORS.functionTransformed}
            strokeWidth={3}
          />

          {/* 动点位置垂直指示线 */}
          {(() => {
            const pUpper = mathToDesign(validChainX0, chainExpY, scale);
            const pLower = mathToDesign(validChainX0, chainLogY, scale);
            return (
              <line
                x1={pUpper.x}
                y1={pUpper.y}
                x2={pLower.x}
                y2={pLower.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
            );
          })()}

          {/* 上界交点 P1 */}
          <MathPoint
            cx={validChainX0}
            cy={chainExpY}
            scale={scale}
            color={MATH_COLORS.function}
            fontScale={fontScale}
          />

          {/* 下界交点 P2 */}
          <MathPoint
            cx={validChainX0}
            cy={chainLogY}
            scale={scale}
            color={MATH_COLORS.functionTransformed}
            fontScale={fontScale}
          />

          {/* 基准公共切点 P0 */}
          <MathPoint
            cx={1}
            cy={1}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
          />

          {/* 可拖拽中轴动点 P */}
          <InteractivePoint
            cx={validChainX0}
            cy={validChainX0}
            scale={scale}
            vp={vp}
            onDrag={handleDragX0}
            color={MATH_COLORS.paramPrimary}
            r={6}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ================= 模式 4: 切线临界求参 ================= */}
      {mode === "param" && (
        <g>
          {/* 超越函数 y = e^x */}
          <FunctionGraph
            fn={(x) => Math.exp(x)}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={3}
          />

          {/* 参变直线 */}
          <FunctionGraph
            fn={subMode === "exp_ax" ? (x) => a * x : (x) => a * x + 1}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
          />

          {/* 临界切点 P0 */}
          <MathPoint
            cx={0}
            cy={1}
            scale={scale}
            color={
              a === 1.0 ? MATH_COLORS.tangentLine : MATH_COLORS.paramSecondary
            }
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ─── 统一智能避让图层：纯净学术点标渲染 ─── */}
      <SceneLabelGroup items={modeLabels} fontScale={fontScale} />
    </g>
  );
}
