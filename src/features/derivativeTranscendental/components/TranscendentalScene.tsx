import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  Asymptote,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
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

  // 1. 拖拽回调 (反向求参解耦)
  const handleDragX0 = (mathPt: { x: number; y: number }) => {
    let newX0 = Math.round(mathPt.x * 10) / 10;
    if (mode === "log" && newX0 <= 0.05) {
      newX0 = 0.05; // 对数定义域防界限外拖拽
    }
    if (mode === "chain" && newX0 <= 0.05) {
      newX0 = 0.05;
    }
    onParamChange("x0", newX0);
  };

  // 2. 指数切线与放缩计算 (包含平移变体 e^{x-1} >= x 处理)
  const expFn = useMemo(() => {
    return isShiftMode
      ? (x: number) => Math.exp(x - 1)
      : (x: number) => Math.exp(x);
  }, [isShiftMode]);

  const expY0 = expFn(x0);
  const expSlope = expY0; // 无论是 e^x 还是 e^{x-1}，导数都等于自身
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

  // 5. 绘制差值填充区域路径
  // 5.1 指数差值阴影区 (根据平移变体自适应)
  const expDiffAreaD = useMemo(() => {
    if (mode !== "exp") return "";
    const points: { x: number; y: number }[] = [];
    const xMin = isShiftMode ? -1.5 : -2.5;
    const xMax = isShiftMode ? 3.0 : 2.5;
    const steps = 40;
    const dx = (xMax - xMin) / steps;

    // 采样原曲线
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = expFn(x);
      points.push(mathToDesign(x, y, scale));
    }
    // 逆序采样切线 (平移变体为 y = x，基准为 y = x + 1)
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

  // 5.2 对数差值阴影区 (包含二次放缩自适应)
  const logDiffAreaD = useMemo(() => {
    if (mode !== "log") return "";
    const points: { x: number; y: number }[] = [];
    const xMin = isQuadraticBound ? 0.2 : 0.15;
    const xMax = 3.5;
    const steps = 40;
    const dx = (xMax - xMin) / steps;

    // 采样上界 (二次抛物线或线性切线)
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = isQuadraticBound ? 0.5 * (x * x - 1) : x - 1;
      points.push(mathToDesign(x, y, scale));
    }
    // 逆序采样 y = ln x 点
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

  // 5.3 双基准夹逼包络差值填充区域 (e^{x-1} 与 ln x + 1)
  const chainDiffAreaD = useMemo(() => {
    if (mode !== "chain") return "";
    const points: { x: number; y: number }[] = [];
    const xMin = 0.2;
    const xMax = 2.4;
    const steps = 40;
    const dx = (xMax - xMin) / steps;

    // 采样上界 e^{x-1}
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = Math.exp(x - 1);
      points.push(mathToDesign(x, y, scale));
    }
    // 逆序采样下界 ln x + 1
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

  return (
    <g>
      {/* 坐标轴网格：纯净坐标系，避免虚线方格网干扰 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* ================= 模式 1: 指数切线放缩 ================= */}
      {mode === "exp" && (
        <g>
          {/* 放缩差值阴影区 */}
          {expDiffAreaD && (
            <path
              d={expDiffAreaD}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.12)}
              stroke="none"
            />
          )}

          {/* 基准切线 (平移变体为 y = x，基准为 y = x + 1) */}
          <FunctionGraph
            fn={(x) => (isShiftMode ? x : x + 1)}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2}
            strokeDasharray="4 4"
          />

          {/* 当前拖拽切线 */}
          <FunctionGraph
            fn={(x) => expSlope * x + expIntercept}
            scale={scale}
            color={MATH_COLORS.tangentLine}
            strokeWidth={2.5}
          />

          {/* 原指数函数曲线 (e^x 或 e^{x-1}) */}
          <FunctionGraph
            fn={expFn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={3}
          />

          {/* 曲线名称标注 (高中数学标准作图范式) */}
          {(() => {
            const pFuncLabel = mathToDesign(1.5, expFn(1.5), scale);
            const pTanLabel = mathToDesign(
              -1.8,
              isShiftMode ? -1.8 : -0.8,
              scale,
            );
            return (
              <g>
                <text
                  x={pFuncLabel.x + 10}
                  y={pFuncLabel.y}
                  fill={MATH_COLORS.function}
                  fontSize={fontScale(12)}
                  fontWeight="bold"
                >
                  {isShiftMode ? "y = e^{x-1}" : "y = e^x"}
                </text>
                <text
                  x={pTanLabel.x}
                  y={pTanLabel.y - 8}
                  fill={MATH_COLORS.paramSecondary}
                  fontSize={fontScale(11)}
                  fontWeight="medium"
                >
                  {isShiftMode ? "基准切线 y = x" : "基准切线 y = x + 1"}
                </text>
              </g>
            );
          })()}

          {/* 基准切点参考 (0, 1) 或 (1, 1) */}
          <MathPoint
            x={isShiftMode ? 1 : 0}
            y={1}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            label={isShiftMode ? "(1, 1)" : "(0, 1)"}
            fontScale={fontScale}
          />

          {/* 可拖拽当前切点 P */}
          <InteractivePoint
            cx={x0}
            cy={expY0}
            scale={scale}
            vp={vp}
            onDrag={handleDragX0}
            color={MATH_COLORS.paramPrimary}
            label="P(x₀, y₀)"
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ================= 模式 2: 对数切线放缩 ================= */}
      {mode === "log" && (
        <g>
          {/* 放缩差值阴影区 */}
          {logDiffAreaD && (
            <path
              d={logDiffAreaD}
              fill={withAlpha(MATH_COLORS.paramPrimary, 0.12)}
              stroke="none"
            />
          )}

          {/* 渐近线 x = 0 */}
          <Asymptote
            type="vertical"
            value={0}
            scale={scale}
            color={MATH_COLORS.asymptote}
            label="x=0"
            fontScale={fontScale}
          />

          {/* 二次放缩变体 y = 0.5(x^2 - 1) */}
          {isQuadraticBound && (
            <FunctionGraph
              fn={(x) => 0.5 * (x * x - 1)}
              scale={scale}
              color={MATH_COLORS.functionTransformed}
              strokeWidth={2.5}
              strokeDasharray="5 3"
            />
          )}

          {/* 基准切线 y = x - 1 */}
          <FunctionGraph
            fn={(x) => x - 1}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2}
            strokeDasharray="4 4"
          />

          {/* 当前拖拽切线 y = (1/x0)x + ln(x0) - 1 */}
          <FunctionGraph
            fn={(x) => logSlope * x + logIntercept}
            scale={scale}
            color={MATH_COLORS.tangentLine}
            strokeWidth={2.5}
          />

          {/* 对数函数曲线 y = ln x (x > 0) */}
          <FunctionGraph
            fn={(x) => (x > 0 ? Math.log(x) : NaN)}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={3}
          />

          {/* 曲线名称标注 */}
          {(() => {
            const pFuncLabel = mathToDesign(2.8, Math.log(2.8), scale);
            const pTanLabel = mathToDesign(2.8, 1.8, scale);
            return (
              <g>
                <text
                  x={pFuncLabel.x + 8}
                  y={pFuncLabel.y + 4}
                  fill={MATH_COLORS.function}
                  fontSize={fontScale(12)}
                  fontWeight="bold"
                >
                  y = ln x
                </text>
                <text
                  x={pTanLabel.x + 8}
                  y={pTanLabel.y}
                  fill={MATH_COLORS.paramSecondary}
                  fontSize={fontScale(11)}
                  fontWeight="medium"
                >
                  切线 y = x - 1
                </text>
                {isQuadraticBound && (
                  <text
                    x={mathToDesign(2.2, 0.5 * (2.2 * 2.2 - 1), scale).x + 8}
                    y={mathToDesign(2.2, 0.5 * (2.2 * 2.2 - 1), scale).y}
                    fill={MATH_COLORS.functionTransformed}
                    fontSize={fontScale(11)}
                    fontWeight="medium"
                  >
                    y = ½(x² - 1)
                  </text>
                )}
              </g>
            );
          })()}

          {/* 基准切点 (1, 0) */}
          <MathPoint
            x={1}
            y={0}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            label="(1, 0)"
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
            label="P(x₀, y₀)"
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ================= 模式 3: 双基准对偶链式放缩 ln x + 1 <= x <= e^{x-1} ================= */}
      {mode === "chain" && (
        <g>
          {/* 夹逼包络差值阴影区 */}
          {chainDiffAreaD && (
            <path
              d={chainDiffAreaD}
              fill={withAlpha(MATH_COLORS.paramSecondary, 0.1)}
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

          {/* 下界对数曲线 y = ln x + 1 (x > 0) */}
          <FunctionGraph
            fn={(x) => (x > 0 ? Math.log(x) + 1 : NaN)}
            scale={scale}
            color={MATH_COLORS.functionTransformed}
            strokeWidth={3}
          />

          {/* 曲线名称标注 */}
          {(() => {
            const pUpper = mathToDesign(2.1, Math.exp(1.1), scale);
            const pAxis = mathToDesign(2.6, 2.6, scale);
            const pLower = mathToDesign(2.5, Math.log(2.5) + 1, scale);
            return (
              <g>
                <text
                  x={pUpper.x - 55}
                  y={pUpper.y}
                  fill={MATH_COLORS.function}
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                >
                  {"上界 y = e^{x-1}"}
                </text>
                <text
                  x={pAxis.x + 8}
                  y={pAxis.y + 4}
                  fill={MATH_COLORS.paramSecondary}
                  fontSize={fontScale(11)}
                  fontWeight="medium"
                >
                  中轴 y = x
                </text>
                <text
                  x={pLower.x + 8}
                  y={pLower.y + 4}
                  fill={MATH_COLORS.functionTransformed}
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                >
                  下界 y = ln x + 1
                </text>
              </g>
            );
          })()}

          {/* 动点位置垂直指示线 (贯穿上中下三线) */}
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

          {/* 上界交点 */}
          <MathPoint
            x={validChainX0}
            y={chainExpY}
            scale={scale}
            color={MATH_COLORS.function}
            label="P₁"
            fontScale={fontScale}
          />

          {/* 下界交点 */}
          <MathPoint
            x={validChainX0}
            y={chainLogY}
            scale={scale}
            color={MATH_COLORS.functionTransformed}
            label="P₂"
            fontScale={fontScale}
          />

          {/* 基准公共切点 (1, 1) */}
          <MathPoint
            x={1}
            y={1}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            label="(1, 1)"
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
            label="P(x, x)"
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ================= 模式 4: 高考实战切线临界求参 ================= */}
      {mode === "param" && (
        <g>
          {/* 超越函数 y = e^x */}
          <FunctionGraph
            fn={(x) => Math.exp(x)}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={3}
          />

          {/* 参变直线 y = ax + 1 或 y = ax */}
          {subMode === "exp_ax" ? (
            <FunctionGraph
              fn={(x) => a * x}
              scale={scale}
              color={MATH_COLORS.paramPrimary}
              strokeWidth={2.5}
            />
          ) : (
            <FunctionGraph
              fn={(x) => a * x + 1}
              scale={scale}
              color={MATH_COLORS.paramPrimary}
              strokeWidth={2.5}
            />
          )}

          {/* 曲线与直线名称标注 */}
          {(() => {
            const pFuncLabel = mathToDesign(1.5, Math.exp(1.5), scale);
            const pLineLabel = mathToDesign(
              -2.0,
              subMode === "exp_ax" ? -2.0 * a : -2.0 * a + 1,
              scale,
            );
            return (
              <g>
                <text
                  x={pFuncLabel.x + 8}
                  y={pFuncLabel.y}
                  fill={MATH_COLORS.function}
                  fontSize={fontScale(12)}
                  fontWeight="bold"
                >
                  y = e^x
                </text>
                <text
                  x={pLineLabel.x}
                  y={pLineLabel.y - 8}
                  fill={MATH_COLORS.paramPrimary}
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                >
                  {subMode === "exp_ax"
                    ? `y = ${a.toFixed(1)}x`
                    : `y = ${a.toFixed(1)}x + 1`}
                </text>
              </g>
            );
          })()}

          {/* 临界相切提示标记 */}
          {subMode === "exp_ax_1" && (
            <MathPoint
              x={0}
              y={1}
              scale={scale}
              color={
                a === 1.0 ? MATH_COLORS.tangentLine : MATH_COLORS.paramSecondary
              }
              label="(0, 1)"
              fontScale={fontScale}
            />
          )}

          {subMode === "exp_ax" && (
            <MathPoint
              x={1}
              y={Math.E}
              scale={scale}
              color={
                Math.abs(a - Math.E) < 0.1
                  ? MATH_COLORS.tangentLine
                  : MATH_COLORS.paramSecondary
              }
              label="(1, e)"
              fontScale={fontScale}
            />
          )}
        </g>
      )}
    </g>
  );
}
