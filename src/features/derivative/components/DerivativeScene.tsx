import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  TangentLine,
  SecantLine,
  InteractivePoint,
  MathPoint,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
import {
  solveDerivative,
  PRESET_FUNCTIONS,
  type PresetFunctionKey,
} from "@/math/derivative";
import { MATH_COLORS } from "@/theme";

interface DerivativeSceneProps {
  mode: "secant_limit" | "tangent_eq";
  fnKey: PresetFunctionKey;
  x0: number;
  dx: number;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  onDragStart?: () => void;
  /** 字号缩放函数，默认原样返回 */
  fontScale?: (v: number) => number;
}

export const DerivativeScene: React.FC<DerivativeSceneProps> = ({
  mode,
  fnKey,
  x0,
  dx,
  scale,
  vp,
  onParamChange,
  onDragStart,
  fontScale = (v) => v,
}) => {
  const preset = PRESET_FUNCTIONS[fnKey] || PRESET_FUNCTIONS.cubic;
  const fn = preset.fn;
  const res = solveDerivative(fn, x0);

  const showSecant = mode === "secant_limit";

  // 割线第二点 (Q 点)
  const x2 = x0 + dx;
  let y2 = NaN;
  try {
    y2 = fn(x2);
  } catch {
    y2 = NaN;
  }
  const isQValid = Number.isFinite(y2);

  // 拖拽切点
  const handleDrag = React.useCallback(
    (mathPt: { x: number; y: number }) => {
      onDragStart?.();
      onParamChange("x0", Math.round(mathPt.x * 100) / 100);
    },
    [onParamChange, onDragStart],
  );

  // 标注调度与避让：切点 P、割线动点 Q、切线斜率 k_切
  const placedLabels = React.useMemo(() => {
    if (!res.isValid) return [];
    const ptP = mathToDesign(x0, res.fx, scale);
    const entries: LabelEntry[] = [
      {
        key: "ptP",
        text: `P(${x0.toFixed(2)}, ${res.fx.toFixed(2)})`,
        x: ptP.x,
        y: ptP.y,
        anchor: "middle",
        dy: -14,
        priority: 2,
      },
      {
        key: "slope",
        text: `k_切 = ${res.slope.toFixed(2)}`,
        x: ptP.x,
        y: ptP.y,
        anchor: "middle",
        dy: 22,
        priority: 1,
      },
    ];

    if (showSecant && isQValid && Math.abs(dx) >= 0.25) {
      const ptQ = mathToDesign(x2, y2, scale);
      entries.push({
        key: "ptQ",
        text: `Q(${x2.toFixed(2)}, ${y2.toFixed(2)})`,
        x: ptQ.x,
        y: ptQ.y,
        anchor: "middle",
        dy: -14,
        priority: 1,
      });
    }

    return avoidLabels(entries, { fontScale });
  }, [
    x0,
    res.fx,
    res.slope,
    res.isValid,
    showSecant,
    isQValid,
    x2,
    y2,
    dx,
    scale,
    fontScale,
  ]);

  // 直角三角形直角符号
  const rightAnglePath = React.useMemo(() => {
    if (!showSecant || !res.isValid || !isQValid || Math.abs(dx) < 0.4)
      return null;
    const pC = mathToDesign(x2, res.fx, scale);
    const sqSize = 9;
    const xDir = dx > 0 ? -1 : 1;
    const yDir = y2 > res.fx ? -1 : 1; // 屏幕坐标 y 轴向下
    return `M ${pC.x + xDir * sqSize} ${pC.y} L ${pC.x + xDir * sqSize} ${pC.y + yDir * sqSize} L ${pC.x} ${pC.y + yDir * sqSize}`;
  }, [showSecant, res.isValid, isQValid, dx, x2, y2, res.fx, scale]);

  // 割线增量 Δx 和 Δy 动态标注
  const deltaLabels = React.useMemo(() => {
    if (!showSecant || !res.isValid || !isQValid || Math.abs(dx) < 0.35)
      return null;

    const midX = x0 + dx / 2;
    const midY = res.fx;

    const midYVert = res.fx + (y2 - res.fx) / 2;
    const midXVert = x0 + dx;

    const pX = mathToDesign(midX, midY, scale);
    const pY = mathToDesign(midXVert, midYVert, scale);

    return (
      <g opacity={0.95}>
        {/* Δx 标注 */}
        <text
          x={pX.x}
          y={pX.y + (dx >= 0 ? 14 : -8)}
          textAnchor="middle"
          fill={MATH_COLORS.paramSecondary}
          fontSize={fontScale(10)}
          fontWeight="600"
          className="select-none pointer-events-none font-mono"
          paintOrder="stroke"
          stroke="white"
          strokeWidth={3}
        >
          {`Δx = ${dx.toFixed(2)}`}
        </text>
        {/* Δy 标注 */}
        <text
          x={pY.x + (dx >= 0 ? 9 : -9)}
          y={pY.y + 4}
          textAnchor={dx >= 0 ? "start" : "end"}
          fill={MATH_COLORS.paramSecondary}
          fontSize={fontScale(10)}
          fontWeight="600"
          className="select-none pointer-events-none font-mono"
          paintOrder="stroke"
          stroke="white"
          strokeWidth={3}
        >
          {`Δy = ${(y2 - res.fx).toFixed(2)}`}
        </text>
      </g>
    );
  }, [showSecant, x0, dx, y2, res.fx, res.isValid, isQValid, scale, fontScale]);

  const pLabel = placedLabels.find((l) => l.key === "ptP");
  const qLabel = placedLabels.find((l) => l.key === "ptQ");
  const slopeLabel = placedLabels.find((l) => l.key === "slope");

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

      {/* 割线（仅在割线极限逼近模式展示） */}
      {showSecant && (
        <SecantLine
          fn={fn}
          x1={x0}
          x2={x2}
          scale={scale}
          color={MATH_COLORS.paramSecondary}
          strokeWidth={1.8}
          showTriangle={true}
        />
      )}

      {/* 直角标尺 */}
      {rightAnglePath && (
        <path
          d={rightAnglePath}
          fill="none"
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={1.2}
          opacity={0.7}
        />
      )}

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

      {/* 割线动点 Q (仅割线模式) */}
      {showSecant && isQValid && (
        <MathPoint
          x={mathToDesign(x2, y2, scale).x}
          y={mathToDesign(x2, y2, scale).y}
          r={3.8}
          color={MATH_COLORS.paramSecondary}
        />
      )}

      {/* 切点 P（可拖拽，绑定红色主参数色） */}
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

      {/* 避让标签统一渲染 */}
      {pLabel && (
        <text
          x={pLabel.x}
          y={pLabel.y + pLabel.finalDy}
          textAnchor={pLabel.anchor}
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(10.5)}
          fontFamily="monospace"
          fontWeight="700"
          className="select-none pointer-events-none"
          paintOrder="stroke"
          stroke="white"
          strokeWidth={3}
        >
          {pLabel.text}
        </text>
      )}

      {showSecant && qLabel && (
        <text
          x={qLabel.x}
          y={qLabel.y + qLabel.finalDy}
          textAnchor={qLabel.anchor}
          fill={MATH_COLORS.paramSecondary}
          fontSize={fontScale(10.5)}
          fontFamily="monospace"
          fontWeight="600"
          className="select-none pointer-events-none"
          paintOrder="stroke"
          stroke="white"
          strokeWidth={3}
        >
          {qLabel.text}
        </text>
      )}

      {slopeLabel && (
        <text
          x={slopeLabel.x}
          y={slopeLabel.y + slopeLabel.finalDy}
          textAnchor={slopeLabel.anchor}
          fill={MATH_COLORS.tangentLine}
          fontSize={fontScale(10)}
          fontFamily="monospace"
          fontWeight="600"
          className="select-none pointer-events-none"
          paintOrder="stroke"
          stroke="white"
          strokeWidth={3}
        >
          {slopeLabel.text}
        </text>
      )}

      {deltaLabels}
    </g>
  );
};
