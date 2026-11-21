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
  SceneLabelGroup,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import type { LabelItem } from "@/utils/labelOverlap";
import {
  solveDerivative,
  solveExternalTangents,
  PRESET_FUNCTIONS,
  type PresetFunctionKey,
} from "@/math/derivative";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { paramDragRange, snapDragValue } from "@/utils/paramClamp";
import { paramMeta } from "@/data/registries/derivative";

interface DerivativeSceneProps {
  mode: "secant_limit" | "tangent_eq" | "external_tangent";
  fnKey: PresetFunctionKey;
  x0: number;
  dx: number;
  xA?: number;
  yA?: number;
  showZoomLoupe?: boolean;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  onDragStart?: () => void;
  fontScale?: (v: number) => number;
}

export const DerivativeScene: React.FC<DerivativeSceneProps> = ({
  mode,
  fnKey,
  x0,
  dx,
  xA = 1,
  yA = -3,
  showZoomLoupe = false,
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
  const isExternal = mode === "external_tangent";

  const externalTangents = React.useMemo(
    () =>
      isExternal
        ? solveExternalTangents(
            fn,
            xA,
            yA,
            preset.x0Range[0],
            preset.x0Range[1],
          )
        : [],
    [isExternal, fn, xA, yA, preset.x0Range],
  );

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
      // 落值统一走 paramClamp SSOT：先取「参数域 ∩ 当前可见视口」求交，再按 paramMeta.step
      // 逐步长吸附。严禁手写 Math.round(x * 100) / 100 —— 它与左屏滑块的 0.05 步长不同源，
      // 拖出的值滑块无法表示，用户一动滑块就会跳变；且没有任何视口约束，手柄可被拖出画布。
      //
      // ⚠ 参数域必须取**当前母函数的** `preset.x0Range`，而不是注册表里的 `paramMeta.x0`：
      //   左屏滑块与 `handleParamChange` 都用 `preset.x0Range`（如 cubic 为 [-3,3]、
      //   sine/cosine 为 [-6.28,6.28]），注册表那份是 [-4,4] 的兜底值。两者混用会让
      //   「拖得到、滑块表示不了」或「滑块到得了、拖不到」两种脱节同时发生。
      onParamChange(
        "x0",
        snapDragValue(
          mathPt.x,
          paramMeta.x0.step,
          paramDragRange(
            { ...paramMeta.x0, min: preset.x0Range[0], max: preset.x0Range[1] },
            scale,
            "x",
          ),
        ),
      );
    },
    [onParamChange, onDragStart, scale, preset],
  );

  // 拖拽外部定点 A(xA, yA)
  const handleDragA = React.useCallback(
    (mathPt: { x: number; y: number }) => {
      onDragStart?.();
      onParamChange(
        "xA",
        snapDragValue(
          mathPt.x,
          paramMeta.xA.step,
          paramDragRange(paramMeta.xA, scale, "x"),
        ),
      );
      onParamChange(
        "yA",
        snapDragValue(
          mathPt.y,
          paramMeta.yA.step,
          paramDragRange(paramMeta.yA, scale, "y"),
        ),
      );
    },
    [onParamChange, onDragStart, scale],
  );

  // 纯极简学术点标：切点 P、割线动点 Q（过点模式为 A 与各切点 T1..）
  const labelItems = React.useMemo<LabelItem[]>(() => {
    if (isExternal) {
      const ptA = mathToDesign(xA, yA, scale);
      const items: LabelItem[] = [
        {
          key: "ptA",
          text: "A",
          x: ptA.x,
          y: ptA.y,
          color: MATH_COLORS.paramPrimary,
          fontSize: fontScale(13),
          preferredPlacement: "top-right",
        },
      ];
      externalTangents.forEach((tan, idx) => {
        const ptT = mathToDesign(tan.t, tan.ft, scale);
        items.push({
          key: `ptT-${idx}`,
          text: externalTangents.length > 1 ? `T${idx + 1}` : "T",
          x: ptT.x,
          y: ptT.y,
          color: MATH_COLORS.tangentLine,
          fontSize: fontScale(12),
          preferredPlacement: idx % 2 === 0 ? "top-left" : "bottom-right",
        });
      });
      return items;
    }

    if (!res.isValid) return [];
    const ptP = mathToDesign(x0, res.fx, scale);
    const items: LabelItem[] = [
      {
        key: "ptP",
        text: "P",
        x: ptP.x,
        y: ptP.y,
        color: MATH_COLORS.paramPrimary,
        fontSize: fontScale(13),
        preferredPlacement: "top-right",
      },
    ];

    if (showSecant && isQValid && Math.abs(dx) >= 0.15) {
      const ptQ = mathToDesign(x2, y2, scale);
      items.push({
        key: "ptQ",
        text: "Q",
        x: ptQ.x,
        y: ptQ.y,
        color: MATH_COLORS.paramSecondary,
        fontSize: fontScale(12),
        preferredPlacement: dx > 0 ? "top-right" : "top-left",
      });
    }

    return items;
  }, [
    isExternal,
    xA,
    yA,
    externalTangents,
    x0,
    res.fx,
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
    if (
      isExternal ||
      !showSecant ||
      !res.isValid ||
      !isQValid ||
      Math.abs(dx) < 0.4
    )
      return null;
    const pC = mathToDesign(x2, res.fx, scale);
    const sqSize = 9;
    const xDir = dx > 0 ? -1 : 1;
    const yDir = y2 > res.fx ? -1 : 1;
    return `M ${pC.x + xDir * sqSize} ${pC.y} L ${pC.x + xDir * sqSize} ${pC.y + yDir * sqSize} L ${pC.x} ${pC.y + yDir * sqSize}`;
  }, [
    isExternal,
    showSecant,
    res.isValid,
    isQValid,
    dx,
    x2,
    y2,
    res.fx,
    scale,
  ]);

  // 割线增量 Δx 和 Δy 极简学术标注
  const deltaLabels = React.useMemo(() => {
    if (
      isExternal ||
      !showSecant ||
      !res.isValid ||
      !isQValid ||
      Math.abs(dx) < 0.35
    )
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
          className="select-none pointer-events-none"
          paintOrder="stroke"
          stroke={MATH_COLORS.white}
          strokeWidth={3}
        >
          Δx
        </text>
        {/* Δy 标注 */}
        <text
          x={pY.x + (dx >= 0 ? 8 : -8)}
          y={pY.y + 4}
          textAnchor={dx >= 0 ? "start" : "end"}
          fill={MATH_COLORS.paramSecondary}
          fontSize={fontScale(10)}
          fontWeight="600"
          className="select-none pointer-events-none"
          paintOrder="stroke"
          stroke={MATH_COLORS.white}
          strokeWidth={3}
        >
          Δy
        </text>
      </g>
    );
  }, [
    isExternal,
    showSecant,
    x0,
    dx,
    y2,
    res.fx,
    res.isValid,
    isQValid,
    scale,
    fontScale,
  ]);

  // 8× 局部放大镜（展现“以直代曲”）
  const loupeRender = React.useMemo(() => {
    if (!showZoomLoupe || isExternal || !res.isValid) return null;
    const loupeR = 64;
    const loupeCx = vp.designLeft + vp.designVisibleW - loupeR - 22;
    const loupeCy = vp.designTop + loupeR + 20;
    const zoom = 8;
    const dxWindow = loupeR / (Math.max(1e-3, scale.scaleX) * zoom);
    const clipId = "derivative-loupe-clip";

    let curvePath = "";
    let penDown = false;
    const segs = 36;
    for (let i = 0; i <= segs; i++) {
      const tx = x0 - dxWindow + (2 * dxWindow * i) / segs;
      let fy = NaN;
      try {
        fy = fn(tx);
      } catch {
        fy = NaN;
      }
      if (!Number.isFinite(fy)) {
        penDown = false;
        continue;
      }
      const px = loupeCx + (tx - x0) * scale.scaleX * zoom;
      const py = loupeCy - (fy - res.fx) * scale.scaleY * zoom;
      if (Math.abs(py - loupeCy) > loupeR * 2) {
        penDown = false;
        continue;
      }
      curvePath += `${penDown ? "L" : "M"} ${px.toFixed(2)} ${py.toFixed(2)} `;
      penDown = true;
    }

    const tanX1 = loupeCx - dxWindow * scale.scaleX * zoom;
    const tanY1 = loupeCy + res.slope * dxWindow * scale.scaleY * zoom;
    const tanX2 = loupeCx + dxWindow * scale.scaleX * zoom;
    const tanY2 = loupeCy - res.slope * dxWindow * scale.scaleY * zoom;

    return (
      <g className="pointer-events-none">
        <defs>
          <clipPath id={clipId}>
            <circle cx={loupeCx} cy={loupeCy} r={loupeR} />
          </clipPath>
        </defs>
        <circle
          cx={loupeCx}
          cy={loupeCy}
          r={loupeR}
          fill={MATH_COLORS.white}
          stroke={CANVAS_COLORS.axis}
          strokeWidth={1.8}
        />
        <g clipPath={`url(#${clipId})`}>
          <line
            x1={loupeCx - loupeR}
            y1={loupeCy}
            x2={loupeCx + loupeR}
            y2={loupeCy}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={0.8}
            strokeDasharray="3 3"
          />
          <line
            x1={loupeCx}
            y1={loupeCy - loupeR}
            x2={loupeCx}
            y2={loupeCy + loupeR}
            stroke={CANVAS_COLORS.grid}
            strokeWidth={0.8}
            strokeDasharray="3 3"
          />
          {curvePath && (
            <path
              d={curvePath}
              fill="none"
              stroke={MATH_COLORS.function}
              strokeWidth={2.4}
            />
          )}
          <line
            x1={tanX1}
            y1={tanY1}
            x2={tanX2}
            y2={tanY2}
            stroke={MATH_COLORS.tangentLine}
            strokeWidth={1.6}
            strokeDasharray="5 3"
          />
          <MathPoint
            x={loupeCx}
            y={loupeCy}
            r={3.5}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
          />
        </g>
        <circle
          cx={loupeCx}
          cy={loupeCy}
          r={loupeR}
          fill="none"
          stroke={MATH_COLORS.axis}
          strokeWidth={1.8}
        />
        <text
          x={loupeCx}
          y={loupeCy + loupeR + 15}
          textAnchor="middle"
          fill={CANVAS_COLORS.labelTextLight}
          fontSize={fontScale(10)}
          fontWeight={600}
        >
          8× 局部放大 (以直代曲)
        </text>
      </g>
    );
  }, [showZoomLoupe, isExternal, res, vp, scale, x0, fn, fontScale]);

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

      {isExternal ? (
        <>
          {/* 过点 A 所作的全部切线及切点 */}
          {externalTangents.map((tan, idx) => {
            const xMinLine = scale.xMin - 1;
            const xMaxLine = scale.xMax + 1;
            const p1 = mathToDesign(
              xMinLine,
              tan.slope * xMinLine + tan.intercept,
              scale,
            );
            const p2 = mathToDesign(
              xMaxLine,
              tan.slope * xMaxLine + tan.intercept,
              scale,
            );
            return (
              <g key={`ext-tan-${idx}-${tan.t}`}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={withAlpha(MATH_COLORS.tangentLine, 0.85)}
                  strokeWidth={1.9}
                />
                <MathPoint
                  cx={tan.t}
                  cy={tan.ft}
                  r={4.8}
                  scale={scale}
                  color={MATH_COLORS.tangentLine}
                  fontScale={fontScale}
                />
              </g>
            );
          })}

          {/* 可拖拽定点 A(xA, yA) */}
          <InteractivePoint
            cx={xA}
            cy={yA}
            scale={scale}
            vp={vp}
            onDrag={handleDragA}
            color={MATH_COLORS.paramPrimary}
            r={6.5}
            fontScale={fontScale}
            edgeClampProjection
          />
        </>
      ) : (
        <>
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
              cx={x2}
              cy={y2}
              r={4}
              scale={scale}
              color={MATH_COLORS.paramSecondary}
              fontScale={fontScale}
            />
          )}

          {/* 切点 P（可拖拽） */}
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
            edgeClampProjection
          />
        </>
      )}

      {/* 极简学术点标 */}
      <SceneLabelGroup items={labelItems} fontScale={fontScale} />

      {deltaLabels}

      {/* 8× 局部放大镜 */}
      {loupeRender}
    </g>
  );
};
