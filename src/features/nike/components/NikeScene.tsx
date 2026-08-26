import { useMemo, useCallback } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  Asymptote,
  TangentLine,
  SceneLabelGroup,
} from "@/components/Math";
import type { LabelItem } from "@/utils/labelOverlap";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import { solveNike, evalNikeAt } from "@/math/nike";

interface NikeSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  activeMode: "standard" | "amgm" | "shifted";
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
}

export function NikeScene({
  params,
  scale,
  vp,
  activeMode,
  onParamChange,
  fontScale = (v) => v,
}: NikeSceneProps) {
  const a = params.a ?? 1.0;
  const b = params.b ?? 4.0;
  const x0 = params.x0 ?? 3.0;
  const h = activeMode === "shifted" ? (params.h ?? 0.0) : 0.0;
  const c = activeMode === "shifted" ? (params.c ?? 0.0) : 0.0;

  const res = solveNike(a, b, h, c);
  const evalPt = evalNikeAt(a, b, h, c, x0);

  // 1. 动点 P 拖拽解算
  const handleDragProbe = useCallback(
    (mathPt: { x: number; y: number }) => {
      let newX = Math.round(mathPt.x * 10) / 10;
      if (Math.abs(newX - h) < 0.2) {
        newX = newX >= h ? h + 0.2 : h - 0.2;
      }
      onParamChange("x0", newX);
    },
    [h, onParamChange],
  );

  // 2. 中心点拖拽解算 (仅平移模式)
  const handleDragCenter = useCallback(
    (mathPt: { x: number; y: number }) => {
      onParamChange("h", Math.round(mathPt.x * 2) / 2);
      onParamChange("c", Math.round(mathPt.y * 2) / 2);
    },
    [onParamChange],
  );

  // 3. 计算对勾/双曲线函数：y = a(x-h) + c + b/(x-h)
  const nikeFn = useCallback(
    (x: number) => {
      const dx = x - h;
      if (Math.abs(dx) < 1e-4) return NaN;
      return a * dx + c + b / dx;
    },
    [a, b, h, c],
  );

  // 4. 渐近线 / 单项拆分函数
  const fnLine = useCallback((x: number) => a * (x - h) + c, [a, h, c]);

  // 5. 设计坐标计算
  const centerDesign = mathToDesign(h, c, scale);
  const probeDesign = evalPt.isValid ? mathToDesign(x0, evalPt.y, scale) : null;

  // 均值不等式拆分线坐标
  const amgmY1 = a * (x0 - h);
  const amgmY2 = b / (x0 - h);
  const amgmBaseDesign = mathToDesign(x0, 0, scale);
  const amgmPt1Design = mathToDesign(x0, amgmY1, scale);
  const amgmPt2Design = mathToDesign(x0, amgmY2, scale);

  // 6. 学术点标智能解算组装 (SceneLabelGroup 8向防重叠)
  const labelItems = useMemo<LabelItem[]>(() => {
    const items: LabelItem[] = [];

    // 极值特征点标签
    res.criticalPoints.forEach((cp, idx) => {
      const pt = mathToDesign(cp.x, cp.y, scale);
      items.push({
        key: `cp-${idx}`,
        text: cp.type === "min" ? "极小值" : "极大值",
        x: pt.x,
        y: pt.y,
        color: MATH_COLORS.vertexPoint,
        fontSize: fontScale(11),
        preferredPlacement: cp.type === "min" ? "bottom" : "top",
      });
    });

    // 探针动点标签
    if (probeDesign && evalPt.isValid) {
      items.push({
        key: "probe-P",
        text: "P",
        x: probeDesign.x,
        y: probeDesign.y,
        color: MATH_COLORS.interactiveActive,
        fontSize: fontScale(13),
        preferredPlacement: "top-right",
      });
    }

    // 平移对称中心标签
    if (activeMode === "shifted") {
      items.push({
        key: "center-C",
        text: "C",
        x: centerDesign.x,
        y: centerDesign.y,
        color: MATH_COLORS.focusPoint,
        fontSize: fontScale(13),
        preferredPlacement: "bottom-left",
      });
    }

    // 均值拆分点标签
    if (activeMode === "amgm" && probeDesign) {
      items.push({
        key: "amgm-p1",
        text: "P₁",
        x: amgmPt1Design.x,
        y: amgmPt1Design.y,
        color: MATH_COLORS.paramPrimary,
        fontSize: fontScale(11),
        preferredPlacement: "top-left",
      });
      items.push({
        key: "amgm-p2",
        text: "P₂",
        x: amgmPt2Design.x,
        y: amgmPt2Design.y,
        color: MATH_COLORS.paramSecondary,
        fontSize: fontScale(11),
        preferredPlacement: "bottom-left",
      });
    }

    return items;
  }, [
    res.criticalPoints,
    probeDesign,
    evalPt.isValid,
    activeMode,
    centerDesign,
    amgmPt1Design,
    amgmPt2Design,
    scale,
    fontScale,
  ]);

  return (
    <g>
      {/* 1. 基础坐标轴与网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 2. 渐近线 */}
      {/* 垂直渐近线 x = h */}
      <Asymptote
        type="vertical"
        value={h}
        scale={scale}
        label={h === 0 ? "x = 0" : `x = ${h.toFixed(1)}`}
        fontScale={fontScale}
        color={MATH_COLORS.asymptote}
      />

      {/* 斜渐近线 y = a(x-h) + c 或 水平渐近线 y = c (当 a=0 时) */}
      {Math.abs(a) >= 1e-4 ? (
        <FunctionGraph
          fn={fnLine}
          scale={scale}
          color={withAlpha(MATH_COLORS.asymptote, 0.7)}
          strokeWidth={1.5}
          strokeDasharray="5,5"
        />
      ) : (
        <Asymptote
          type="horizontal"
          value={c}
          scale={scale}
          label={c === 0 ? "y = 0" : `y = ${c.toFixed(1)}`}
          fontScale={fontScale}
          color={MATH_COLORS.asymptote}
        />
      )}

      {/* 3. 均值不等式模式：拆分线 y1=ax 与 y2=b/x */}
      {activeMode === "amgm" && (
        <>
          {/* 项一：y1 = ax */}
          <FunctionGraph
            fn={(x) => a * x}
            scale={scale}
            color={withAlpha(MATH_COLORS.paramPrimary, 0.45)}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
          {/* 项二：y2 = b/x */}
          <FunctionGraph
            fn={(x) => (Math.abs(x) < 1e-4 ? NaN : b / x)}
            scale={scale}
            color={withAlpha(MATH_COLORS.paramSecondary, 0.45)}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
          {/* 动点处垂直叠加加和线 */}
          {probeDesign && (
            <g className="amgm-decomposition">
              <line
                x1={amgmBaseDesign.x}
                y1={amgmBaseDesign.y}
                x2={probeDesign.x}
                y2={probeDesign.y}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={1.5}
                strokeDasharray="3,3"
              />
              {/* 项一高亮点 P1(x0, ax0) */}
              <MathPoint
                x={x0}
                y={amgmY1}
                scale={scale}
                color={MATH_COLORS.paramPrimary}
                fontScale={fontScale}
              />
              {/* 项二高亮点 P2(x0, b/x0) */}
              <MathPoint
                x={x0}
                y={amgmY2}
                scale={scale}
                color={MATH_COLORS.paramSecondary}
                fontScale={fontScale}
              />
              {/* 矢量加和指示线 */}
              <line
                x1={probeDesign.x}
                y1={amgmPt1Design.y}
                x2={probeDesign.x}
                y2={probeDesign.y}
                stroke={MATH_COLORS.paramSecondary}
                strokeWidth={2}
              />
            </g>
          )}
        </>
      )}

      {/* 4. 主曲线：对勾/双曲函数 y = a(x-h) + c + b/(x-h) */}
      <FunctionGraph
        fn={nikeFn}
        scale={scale}
        color={
          res.curveType === "nike"
            ? MATH_COLORS.function
            : res.curveType === "streamer"
              ? MATH_COLORS.functionTransformed
              : MATH_COLORS.degeneracy
        }
        strokeWidth={2.5}
      />

      {/* 5. 极值点切线标尺 (当存在极值点时) */}
      {res.criticalPoints.map((cp, idx) => {
        const pt = mathToDesign(cp.x, cp.y, scale);
        return (
          <g key={`crit-${idx}`}>
            {/* 水平切线线段 */}
            <line
              x1={pt.x - 24}
              y1={pt.y}
              x2={pt.x + 24}
              y2={pt.y}
              stroke={MATH_COLORS.tangentLine}
              strokeWidth={1.5}
              strokeDasharray="4,2"
            />
            {/* 极值特征点 */}
            <MathPoint
              x={cp.x}
              y={cp.y}
              scale={scale}
              color={MATH_COLORS.vertexPoint}
              fontScale={fontScale}
            />
          </g>
        );
      })}

      {/* 6. 平移模式：对称中心 C(h, c) 可拖拽手柄 */}
      {activeMode === "shifted" && (
        <g className="symmetry-center">
          <InteractivePoint
            cx={h}
            cy={c}
            scale={scale}
            vp={vp}
            onDrag={handleDragCenter}
            color={MATH_COLORS.focusPoint}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* 7. 探针动点 P(x0, f(x0)) 及其切线 (双向联动) */}
      {evalPt.isValid && probeDesign && (
        <g className="probe-point">
          {/* 切线 */}
          <TangentLine
            fn={nikeFn}
            x0={x0}
            scale={scale}
            color={MATH_COLORS.tangentLine}
            strokeWidth={1.5}
          />

          {/* 可拖拽切点手柄 */}
          <InteractivePoint
            cx={x0}
            cy={evalPt.y}
            scale={scale}
            vp={vp}
            onDrag={handleDragProbe}
            color={MATH_COLORS.interactiveActive}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* 8. 智能防重叠学术点标图层 (铁律 1/4) */}
      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
}
