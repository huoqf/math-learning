import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  IntervalShadow,
} from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  evalFunctionParity,
  calculateExpLog,
  solveBisection,
} from "@/math/function";

interface FunctionSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  mode?: "properties" | "explog" | "zero";
  fnType?: "cubic" | "quadratic" | "abs" | "reciprocal";
  subExpLog?: "explog" | "power";
}

export function FunctionScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  mode = "properties",
  fnType = "cubic",
  subExpLog = "explog",
}: FunctionSceneProps) {
  const x0 = params.x0 ?? 1.5;
  const a = params.baseA ?? 2.0;
  const powerAlpha = params.powerAlpha ?? 2.0;

  const m = params.intervalM ?? -1.0;
  const n = params.intervalN ?? 2.5;
  const steps = Math.max(1, Math.round(params.bisectionSteps ?? 3));

  // 拖拽回调：更新 x0
  const handleDragX0 = (mathPt: { x: number; y: number }) => {
    onParamChange("x0", Math.round(mathPt.x * 10) / 10);
  };

  // 拖拽回调：更新区间 m
  const handleDragM = (mathPt: { x: number; y: number }) => {
    onParamChange("intervalM", Math.round(mathPt.x * 10) / 10);
  };

  // 拖拽回调：更新区间 n
  const handleDragN = (mathPt: { x: number; y: number }) => {
    onParamChange("intervalN", Math.round(mathPt.x * 10) / 10);
  };

  // 1. 基本性质模式 (单调/奇偶/对称)
  const renderPropertiesMode = () => {
    const parityRes = evalFunctionParity(fnType, x0);

    const getFn = (x: number) => {
      switch (fnType) {
        case "cubic":
          return x * x * x;
        case "quadratic":
          return x * x;
        case "abs":
          return Math.abs(x);
        case "reciprocal":
          return Math.abs(x) > 1e-3 ? 1 / x : NaN;
        default:
          return x;
      }
    };

    return (
      <g>
        {/* 原函数曲线 y = f(x) */}
        <FunctionGraph
          fn={getFn}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />

        {/* 测试采样点 P(x0, f(x0)) */}
        {Number.isFinite(parityRes.fx) && (
          <InteractivePoint
            cx={x0}
            cy={parityRes.fx}
            scale={scale}
            vp={vp}
            onDrag={handleDragX0}
            color={MATH_COLORS.paramPrimary}
            label={`P(${x0.toFixed(1)}, ${parityRes.fx.toFixed(1)})`}
            fontScale={fontScale}
          />
        )}

        {/* 奇偶对称采样点 P'(-x0, f(-x0)) */}
        {Number.isFinite(parityRes.fNegX) && (
          <g>
            <circle
              cx={scale.originX + -x0 * scale.scaleX}
              cy={scale.originY - parityRes.fNegX * scale.scaleY}
              r={6}
              fill={MATH_COLORS.functionTransformed}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
            <text
              x={scale.originX + -x0 * scale.scaleX + 10}
              y={scale.originY - parityRes.fNegX * scale.scaleY - 10}
              fill={MATH_COLORS.functionTransformed}
              fontSize={fontScale(12)}
              fontWeight="bold"
            >
              {`P'(${(-x0).toFixed(1)}, ${parityRes.fNegX.toFixed(1)})`}
            </text>
            {/* 对称连线 */}
            <line
              x1={scale.originX + x0 * scale.scaleX}
              y1={scale.originY - parityRes.fx * scale.scaleY}
              x2={scale.originX + -x0 * scale.scaleX}
              y2={scale.originY - parityRes.fNegX * scale.scaleY}
              stroke={MATH_COLORS.labelText}
              strokeDasharray="4 4"
              strokeWidth={1}
              opacity={0.5}
            />
          </g>
        )}
      </g>
    );
  };

  // 2. 指数、对数与反函数模式
  const renderExpLogMode = () => {
    const isValidBase = a > 0 && Math.abs(a - 1) > 1e-4;
    const expLogRes = calculateExpLog(a, x0);

    if (subExpLog === "power") {
      // 幂函数模式 y = x^α
      return (
        <g>
          <FunctionGraph
            fn={(x) => {
              if (powerAlpha === 0.5 && x < 0) return NaN;
              if (powerAlpha === -1 && Math.abs(x) < 1e-3) return NaN;
              return Math.pow(x, powerAlpha);
            }}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.5}
          />
          {/* 定点 (1, 1) */}
          <circle
            cx={scale.originX + 1 * scale.scaleX}
            cy={scale.originY - 1 * scale.scaleY}
            r={5}
            fill={MATH_COLORS.paramPrimary}
          />
          <text
            x={scale.originX + 1.2 * scale.scaleX}
            y={scale.originY - 1.2 * scale.scaleY}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            (1, 1)
          </text>
        </g>
      );
    }

    return (
      <g>
        {/* 直线 y = x (反函数对称轴) */}
        <FunctionGraph
          fn={(x) => x}
          scale={scale}
          color={MATH_COLORS.labelText}
          strokeWidth={1.5}
          strokeDasharray="6 4"
        />

        {/* 指数函数 y = a^x */}
        {isValidBase && (
          <FunctionGraph
            fn={(x) => Math.pow(a, x)}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.5}
          />
        )}

        {/* 对数函数 y = log_a(x) */}
        {isValidBase && (
          <FunctionGraph
            fn={(x) => (x > 0 ? Math.log(x) / Math.log(a) : NaN)}
            scale={scale}
            color={MATH_COLORS.functionTransformed}
            strokeWidth={2.5}
          />
        )}

        {/* 指数函数定点 (0, 1) 与对数函数定点 (1, 0) */}
        {isValidBase && (
          <g>
            <circle
              cx={scale.originX + 0 * scale.scaleX}
              cy={scale.originY - 1 * scale.scaleY}
              r={4.5}
              fill={MATH_COLORS.function}
            />
            <text
              x={scale.originX + 8}
              y={scale.originY - 1 * scale.scaleY}
              fill={MATH_COLORS.function}
              fontSize={fontScale(11)}
              fontWeight="bold"
            >
              (0, 1)
            </text>

            <circle
              cx={scale.originX + 1 * scale.scaleX}
              cy={scale.originY - 0 * scale.scaleY}
              r={4.5}
              fill={MATH_COLORS.functionTransformed}
            />
            <text
              x={scale.originX + 1 * scale.scaleX}
              y={scale.originY - 12}
              fill={MATH_COLORS.functionTransformed}
              fontSize={fontScale(11)}
              fontWeight="bold"
            >
              (1, 0)
            </text>
          </g>
        )}

        {/* 拖拽点 P(x0, a^x0) 与对称反函数点 P'(a^x0, x0) */}
        {isValidBase && Number.isFinite(expLogRes.expVal) && (
          <g>
            <InteractivePoint
              cx={x0}
              cy={expLogRes.expVal}
              scale={scale}
              vp={vp}
              onDrag={handleDragX0}
              color={MATH_COLORS.function}
              label={`P(${x0.toFixed(1)}, ${expLogRes.expVal.toFixed(1)})`}
              fontScale={fontScale}
            />
            <circle
              cx={scale.originX + expLogRes.expVal * scale.scaleX}
              cy={scale.originY - x0 * scale.scaleY}
              r={6}
              fill={MATH_COLORS.functionTransformed}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
            <text
              x={scale.originX + expLogRes.expVal * scale.scaleX + 8}
              y={scale.originY - x0 * scale.scaleY - 8}
              fill={MATH_COLORS.functionTransformed}
              fontSize={fontScale(11)}
              fontWeight="bold"
            >
              {`P'(${expLogRes.expVal.toFixed(1)}, ${x0.toFixed(1)})`}
            </text>
            {/* 对称连线 */}
            <line
              x1={scale.originX + x0 * scale.scaleX}
              y1={scale.originY - expLogRes.expVal * scale.scaleY}
              x2={scale.originX + expLogRes.expVal * scale.scaleX}
              y2={scale.originY - x0 * scale.scaleY}
              stroke={MATH_COLORS.labelText}
              strokeDasharray="3 3"
              strokeWidth={1}
              opacity={0.5}
            />
          </g>
        )}
      </g>
    );
  };

  // 3. 函数零点与二分逼近法模式
  const renderZeroMode = () => {
    const targetFn = (x: number) => x * x * x - x - 2;
    const bisectionRes = solveBisection(targetFn, m, n, steps);

    return (
      <g>
        {/* 目标函数 y = x^3 - x - 2 曲线 */}
        <FunctionGraph
          fn={targetFn}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />

        {/* 区间 [m, n] 的背景半透明阴影遮罩 */}
        <IntervalShadow
          fn={targetFn}
          x1={m}
          x2={n}
          scale={scale}
          fillColor={withAlpha(MATH_COLORS.function, 0.15)}
        />

        {/* 区间左端点 m 控制点线 */}
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
          fontScale={fontScale}
        />

        {/* 区间右端点 n 控制点线 */}
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
          fontScale={fontScale}
        />

        {/* 二分逼近中点与缩进区间 */}
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
              stroke="#FFFFFF"
              strokeWidth={2}
            />
            <text
              x={
                scale.originX + bisectionRes.currentStep.mid * scale.scaleX + 8
              }
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
  };

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />
      {mode === "properties" && renderPropertiesMode()}
      {mode === "explog" && renderExpLogMode()}
      {mode === "zero" && renderZeroMode()}
    </g>
  );
}
