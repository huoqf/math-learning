import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  Asymptote,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
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

  // 1. 拖拽回调
  const handleDragX0 = (mathPt: { x: number; y: number }) => {
    let newX0 = Math.round(mathPt.x * 10) / 10;
    if (mode === "log" && newX0 <= 0.05) {
      newX0 = 0.05; // 对数定义域防界限外拖拽
    }
    onParamChange("x0", newX0);
  };

  // 2. 指数切线与放缩计算
  const expY0 = Math.exp(x0);
  const expSlope = expY0;
  const expIntercept = expY0 * (1 - x0);

  // 3. 对数切线与放缩计算
  const validLogX0 = Math.max(0.05, x0);
  const logY0 = Math.log(validLogX0);
  const logSlope = 1 / validLogX0;
  const logIntercept = logY0 - 1;

  // 4. 标签位置计算与防重叠
  const labelsPoints = useMemo<LabelEntry[]>(() => {
    if (mode === "exp") {
      const p1 = mathToDesign(x0, expY0, scale);
      const pBase = mathToDesign(0, 1, scale);
      return [
        {
          key: "p1",
          x: p1.x,
          y: p1.y,
          text: `P(${x0.toFixed(1)}, ${expY0.toFixed(2)})`,
          anchor: "middle",
          dy: -14,
        },
        {
          key: "pBase",
          x: pBase.x,
          y: pBase.y,
          text: "基准切点(0, 1)",
          anchor: "middle",
          dy: -14,
        },
      ];
    } else if (mode === "log") {
      const p1 = mathToDesign(validLogX0, logY0, scale);
      const pBase = mathToDesign(1, 0, scale);
      return [
        {
          key: "p1",
          x: p1.x,
          y: p1.y,
          text: `P(${validLogX0.toFixed(1)}, ${logY0.toFixed(2)})`,
          anchor: "middle",
          dy: -14,
        },
        {
          key: "pBase",
          x: pBase.x,
          y: pBase.y,
          text: "基准切点(1, 0)",
          anchor: "middle",
          dy: 16,
        },
      ];
    }
    return [];
  }, [mode, x0, expY0, validLogX0, logY0, scale]);

  const labelOffsets = useMemo(() => {
    return avoidLabels(labelsPoints);
  }, [labelsPoints]);

  // 5. 绘制差值填充区域路径 (以 e^x 与 y = x + 1 为例)
  const expDiffAreaD = useMemo(() => {
    if (mode !== "exp") return "";
    const points: { x: number; y: number }[] = [];
    const xMin = -2.5;
    const xMax = 2.5;
    const steps = 40;
    const dx = (xMax - xMin) / steps;

    // 采样 e^x 点
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = Math.exp(x);
      points.push(mathToDesign(x, y, scale));
    }
    // 逆序采样 y = x + 1 点
    for (let i = steps; i >= 0; i--) {
      const x = xMin + i * dx;
      const y = x + 1;
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

  // 对数差值填充区域路径 (y = x - 1 与 y = ln x)
  const logDiffAreaD = useMemo(() => {
    if (mode !== "log") return "";
    const points: { x: number; y: number }[] = [];
    const xMin = 0.15;
    const xMax = 3.5;
    const steps = 40;
    const dx = (xMax - xMin) / steps;

    // 采样 y = x - 1 点
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = x - 1;
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
  }, [mode, scale]);

  return (
    <g>
      {/* 坐标轴网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* ================= 模式 1: 指数切线放缩 e^x >= x + 1 ================= */}
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

          {/* 基准切线 y = x + 1 */}
          <FunctionGraph
            fn={(x) => x + 1}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2}
            strokeDasharray="4 4"
          />

          {/* 当前拖拽切线 y = e^{x0}(x - x0) + e^{x0} */}
          <FunctionGraph
            fn={(x) => expSlope * x + expIntercept}
            scale={scale}
            color={MATH_COLORS.tangentLine}
            strokeWidth={2.5}
          />

          {/* 原指数函数曲线 y = e^x */}
          <FunctionGraph
            fn={(x) => Math.exp(x)}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={3}
          />

          {/* 基准切点参考 (0, 1) */}
          {(() => {
            const pBase = mathToDesign(0, 1, scale);
            const dy = labelOffsets[1]?.finalDy ?? -14;
            return (
              <g>
                <circle
                  cx={pBase.x}
                  cy={pBase.y}
                  r={4}
                  fill={MATH_COLORS.paramSecondary}
                />
                <text
                  x={pBase.x}
                  y={pBase.y + dy}
                  fill={MATH_COLORS.paramSecondary}
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  (0, 1)
                </text>
              </g>
            );
          })()}

          {/* 可拖拽当前切点 P(x0, e^x0) */}
          <InteractivePoint
            cx={x0}
            cy={expY0}
            scale={scale}
            vp={vp}
            onDrag={handleDragX0}
            color={MATH_COLORS.paramPrimary}
            label={`P(${x0.toFixed(1)}, ${expY0.toFixed(2)})`}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ================= 模式 2: 对数切线放缩 ln x <= x - 1 ================= */}
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
          {subMode === "quadratic_bound" && (
            <FunctionGraph
              fn={(x) => 0.5 * (x * x - 1)}
              scale={scale}
              color={MATH_COLORS.functionTransformed}
              strokeWidth={2}
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

          {/* 基准切点 (1, 0) */}
          {(() => {
            const pBase = mathToDesign(1, 0, scale);
            const dy = labelOffsets[1]?.finalDy ?? 16;
            return (
              <g>
                <circle
                  cx={pBase.x}
                  cy={pBase.y}
                  r={4}
                  fill={MATH_COLORS.paramSecondary}
                />
                <text
                  x={pBase.x}
                  y={pBase.y + dy}
                  fill={MATH_COLORS.paramSecondary}
                  fontSize={fontScale(11)}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  (1, 0)
                </text>
              </g>
            );
          })()}

          {/* 可拖拽切点 P(x0, ln x0) */}
          <InteractivePoint
            cx={validLogX0}
            cy={logY0}
            scale={scale}
            vp={vp}
            onDrag={handleDragX0}
            color={MATH_COLORS.paramPrimary}
            label={`P(${validLogX0.toFixed(1)}, ${logY0.toFixed(2)})`}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ================= 模式 3: 双基准对偶链式放缩 ln x + 1 <= x <= e^{x-1} ================= */}
      {mode === "chain" && (
        <g>
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

          {/* 基准公共切点 (1, 1) */}
          {(() => {
            const p1 = mathToDesign(1, 1, scale);
            return (
              <g>
                <circle
                  cx={p1.x}
                  cy={p1.y}
                  r={5}
                  fill={MATH_COLORS.paramPrimary}
                />
                <text
                  x={p1.x}
                  y={p1.y - 12}
                  fill={MATH_COLORS.paramPrimary}
                  fontSize={fontScale(12)}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  公共切点 (1, 1)
                </text>
              </g>
            );
          })()}
        </g>
      )}

      {/* ================= 模式 4: 高考实战切线临界求参 e^x >= ax + 1 / e^x >= ax ================= */}
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

          {/* 临界相切提示标记 */}
          {subMode === "exp_ax_1" && (
            <g>
              <circle
                cx={mathToDesign(0, 1, scale).x}
                cy={mathToDesign(0, 1, scale).y}
                r={6}
                fill={
                  a === 1.0
                    ? MATH_COLORS.tangentLine
                    : MATH_COLORS.paramSecondary
                }
              />
              <text
                x={mathToDesign(0, 1, scale).x + 12}
                y={mathToDesign(0, 1, scale).y + 4}
                fill={
                  a === 1.0 ? MATH_COLORS.tangentLine : MATH_COLORS.labelText
                }
                fontSize={fontScale(11)}
                fontWeight="bold"
              >
                {a === 1.0 ? "相切临界点 (0, 1) [a = 1]" : "定点 (0, 1)"}
              </text>
            </g>
          )}

          {subMode === "exp_ax" && (
            <g>
              <circle
                cx={mathToDesign(1, Math.E, scale).x}
                cy={mathToDesign(1, Math.E, scale).y}
                r={6}
                fill={
                  Math.abs(a - Math.E) < 0.1
                    ? MATH_COLORS.tangentLine
                    : MATH_COLORS.paramSecondary
                }
              />
              <text
                x={mathToDesign(1, Math.E, scale).x + 12}
                y={mathToDesign(1, Math.E, scale).y + 4}
                fill={
                  Math.abs(a - Math.E) < 0.1
                    ? MATH_COLORS.tangentLine
                    : MATH_COLORS.labelText
                }
                fontSize={fontScale(11)}
                fontWeight="bold"
              >
                {Math.abs(a - Math.E) < 0.1
                  ? "相切临界点 (1, e) [a = e]"
                  : "切点参照 (1, e)"}
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
}
