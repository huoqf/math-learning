import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  TangentLine,
  SecantLine,
  InteractivePoint,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import {
  solveDerivative,
  PRESET_FUNCTIONS,
  type PresetFunctionKey,
} from "@/math/derivative";
import { MATH_COLORS } from "@/theme";

interface DerivativeSceneProps {
  fnKey: PresetFunctionKey;
  x0: number;
  dx: number;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  /** 字号缩放函数，默认原样返回 */
  fontScale?: (v: number) => number;
}

export const DerivativeScene: React.FC<DerivativeSceneProps> = ({
  fnKey,
  x0,
  dx,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
}) => {
  const preset = PRESET_FUNCTIONS[fnKey] || PRESET_FUNCTIONS.cubic;
  const fn = preset.fn;
  const res = solveDerivative(fn, x0);

  // 割线第二点
  const x2 = x0 + dx;

  // 拖拽切点
  const handleDrag = React.useCallback(
    (mathPt: { x: number; y: number }) => {
      onParamChange("x0", Math.round(mathPt.x * 100) / 100);
    },
    [onParamChange],
  );

  // 切点标签（一上一下避让布局，水平居中）
  const tangentLabel = React.useMemo(() => {
    if (!res.isValid) return null;
    const pt = mathToDesign(x0, res.fx, scale);
    return (
      <text
        x={pt.x}
        y={pt.y - 14}
        textAnchor="middle"
        fill={MATH_COLORS.paramPrimary}
        fontSize={fontScale(10)}
        fontFamily="monospace"
        fontWeight="600"
        className="select-none pointer-events-none"
      >
        {`(${x0.toFixed(2)}, ${res.fx.toFixed(2)})`}
      </text>
    );
  }, [x0, res.fx, res.isValid, scale, fontScale]);

  // 斜率标注（放在切点下方以规避重叠）
  const slopeLabel = React.useMemo(() => {
    if (!res.isValid) return null;
    const pt = mathToDesign(x0, res.fx, scale);
    return (
      <text
        x={pt.x}
        y={pt.y + 22}
        textAnchor="middle"
        fill={MATH_COLORS.derivative}
        fontSize={fontScale(10)}
        fontFamily="monospace"
        fontWeight="600"
        className="select-none pointer-events-none"
      >
        {`k_切 = ${res.slope.toFixed(2)}`}
      </text>
    );
  }, [x0, res.fx, res.slope, res.isValid, scale, fontScale]);

  // 割线三角形的 Δx 和 Δy 动态标注 (当 dx 足够大时展示，防止极限时重叠混乱)
  const deltaLabels = React.useMemo(() => {
    if (!res.isValid || Math.abs(dx) < 0.3) return null;

    let y2 = NaN;
    try {
      y2 = fn(x2);
    } catch {
      return null;
    }
    if (!Number.isFinite(y2)) return null;

    const midX = x0 + dx / 2;
    const midY = res.fx;

    const midYVert = res.fx + (y2 - res.fx) / 2;
    const midXVert = x0 + dx;

    const pX = mathToDesign(midX, midY, scale);
    const pY = mathToDesign(midXVert, midYVert, scale);

    return (
      <g opacity={0.9}>
        {/* Δx 标注 */}
        <text
          x={pX.x}
          y={pX.y + (dx >= 0 ? 12 : -6)}
          textAnchor="middle"
          fill={MATH_COLORS.paramSecondary}
          fontSize={fontScale(9.5)}
          fontWeight="600"
          className="select-none pointer-events-none font-mono"
        >
          {`Δx = ${dx.toFixed(2)}`}
        </text>
        {/* Δy 标注 */}
        <text
          x={pY.x + (dx >= 0 ? 8 : -8)}
          y={pY.y + 4}
          textAnchor={dx >= 0 ? "start" : "end"}
          fill={MATH_COLORS.paramSecondary}
          fontSize={fontScale(9.5)}
          fontWeight="600"
          className="select-none pointer-events-none font-mono"
        >
          {`Δy = ${(y2 - res.fx).toFixed(2)}`}
        </text>
      </g>
    );
  }, [x0, dx, x2, res.fx, res.isValid, scale, fn, fontScale]);

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 原函数曲线 */}
      <FunctionGraph
        fn={fn}
        scale={scale}
        color={MATH_COLORS.function}
        strokeWidth={2.5}
      />

      {/* 割线（展示逼近过程，绑定橙色次参数色） */}
      <SecantLine
        fn={fn}
        x1={x0}
        x2={x2}
        scale={scale}
        color={MATH_COLORS.paramSecondary}
        strokeWidth={1.8}
        showTriangle={true}
      />

      {/* 切线 */}
      {res.isValid && (
        <TangentLine
          fn={fn}
          x0={x0}
          scale={scale}
          color={MATH_COLORS.tangentLine}
          strokeWidth={2}
        />
      )}

      {/* 切点（可拖拽，绑定红色主参数色） */}
      <InteractivePoint
        cx={x0}
        cy={res.isValid ? res.fx : 0}
        scale={scale}
        vp={vp}
        onDrag={handleDrag}
        color={MATH_COLORS.paramPrimary}
        r={6}
        disabled={!res.isValid}
        fontScale={fontScale}
      />

      {tangentLabel}
      {slopeLabel}
      {deltaLabels}
    </g>
  );
};
