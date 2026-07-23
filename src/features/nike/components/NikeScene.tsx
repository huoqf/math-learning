import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  Asymptote,
  TangentLine,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import { solveNike, evalNikeAt } from "@/math/nike";
import { avoidLabelOffsets } from "@/utils/labelAvoider";

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
  const handleDragProbe = (mathPt: { x: number; y: number }) => {
    let newX = Math.round(mathPt.x * 10) / 10;
    if (Math.abs(newX - h) < 0.2) {
      newX = newX >= h ? h + 0.2 : h - 0.2;
    }
    onParamChange("x0", newX);
  };

  // 2. 中心点拖拽解算 (仅平移模式)
  const handleDragCenter = (mathPt: { x: number; y: number }) => {
    onParamChange("h", Math.round(mathPt.x * 2) / 2);
    onParamChange("c", Math.round(mathPt.y * 2) / 2);
  };

  // 3. 计算对勾/双曲线函数：y = a(x-h) + c + b/(x-h)
  const nikeFn = (x: number) => {
    const dx = x - h;
    if (Math.abs(dx) < 1e-4) return NaN;
    return a * dx + c + b / dx;
  };

  // 4. 均值不等式模式下的单项拆分函数
  const fnLine = (x: number) => a * (x - h) + c;

  // 5. 设计坐标转换与标注避让
  const centerDesign = mathToDesign(h, c, scale);
  const probeDesign = evalPt.isValid ? mathToDesign(x0, evalPt.y, scale) : null;

  // 均值不等式拆分线坐标
  const amgmY1 = a * (x0 - h);
  const amgmY2 = b / (x0 - h);
  const amgmPt1Design = mathToDesign(x0, amgmY1, scale);
  const amgmPt2Design = mathToDesign(x0, amgmY2, scale);
  const amgmBaseDesign = mathToDesign(x0, 0, scale);

  const labelEntries = useMemo(() => {
    const rawList: any[] = [];

    res.criticalPoints.forEach((cp, idx) => {
      const pt = mathToDesign(cp.x, cp.y, scale);
      rawList.push({
        key: `cp-${idx}`,
        text: cp.label,
        x: pt.x,
        y: pt.y,
        anchor: "middle" as const,
        dy: -14,
      });
    });

    if (probeDesign) {
      rawList.push({
        key: "probe",
        text: `P(${x0.toFixed(1)}, ${evalPt.y.toFixed(1)})`,
        x: probeDesign.x,
        y: probeDesign.y,
        anchor: "middle" as const,
        dy: -14,
      });
    }

    if (activeMode === "shifted") {
      rawList.push({
        key: "center",
        text: `中心 C(${h.toFixed(1)}, ${c.toFixed(1)})`,
        x: centerDesign.x,
        y: centerDesign.y,
        anchor: "middle" as const,
        dy: 14,
      });
    }

    return rawList;
  }, [
    res.criticalPoints,
    probeDesign,
    centerDesign,
    scale,
    activeMode,
    x0,
    evalPt.y,
    h,
    c,
  ]);

  const labelOffsets = useMemo(() => {
    return avoidLabelOffsets(labelEntries);
  }, [labelEntries]);

  const labelOffsetMap = useMemo(() => {
    const map = new Map<string, { dx: number; dy: number }>();
    labelEntries.forEach((entry, idx) => {
      const offset = labelOffsets[idx] || { dx: 0, dy: 0 };
      map.set(entry.key, offset);
    });
    return map;
  }, [labelEntries, labelOffsets]);

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
        label={h === 0 ? "x = 0 (y轴渐近线)" : `x = ${h.toFixed(1)}`}
        fontScale={fontScale}
        color={MATH_COLORS.asymptote}
      />

      {/* 斜渐近线 y = a(x-h) + c */}
      {Math.abs(a) >= 1e-4 && (
        <FunctionGraph
          fn={fnLine}
          scale={scale}
          color={withAlpha(MATH_COLORS.asymptote, 0.6)}
          strokeWidth={1.5}
          strokeDasharray="5,5"
        />
      )}

      {/* 3. 均值不等式模式：拆分线 y1=ax 与 y2=b/x */}
      {activeMode === "amgm" && (
        <>
          {/* 项一：y1 = ax */}
          <FunctionGraph
            fn={(x) => a * x}
            scale={scale}
            color={withAlpha(MATH_COLORS.paramPrimary, 0.4)}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
          {/* 项二：y2 = b/x */}
          <FunctionGraph
            fn={(x) => (Math.abs(x) < 1e-4 ? NaN : b / x)}
            scale={scale}
            color={withAlpha(MATH_COLORS.paramSecondary, 0.4)}
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
              <circle
                cx={amgmPt1Design.x}
                cy={amgmPt1Design.y}
                r={4}
                fill={MATH_COLORS.paramPrimary}
              />
              {/* 项二高亮点 P2(x0, b/x0) */}
              <circle
                cx={amgmPt2Design.x}
                cy={amgmPt2Design.y}
                r={4}
                fill={MATH_COLORS.paramSecondary}
              />
              {/* 矢量加和指示线 */}
              <line
                x1={amgmPt1Design.x}
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

      {/* 5. 极值点高亮与切线 (当存在极值点时) */}
      {res.criticalPoints.map((cp, idx) => {
        const pt = mathToDesign(cp.x, cp.y, scale);
        const offset = labelOffsetMap.get(`cp-${idx}`) || { dx: 0, dy: -12 };

        return (
          <g key={`crit-${idx}`}>
            {/* 水平切线线段 */}
            <line
              x1={pt.x - 25}
              y1={pt.y}
              x2={pt.x + 25}
              y2={pt.y}
              stroke={MATH_COLORS.tangentLine}
              strokeWidth={1.5}
              strokeDasharray="4,2"
            />
            {/* 极值点圆圈 */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={5}
              fill={MATH_COLORS.vertexPoint}
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
            {/* 极值点文本标注 */}
            <text
              x={pt.x + offset.dx}
              y={pt.y - 12 + offset.dy}
              fill={MATH_COLORS.vertexPoint}
              fontSize={fontScale(11)}
              fontWeight="bold"
              textAnchor="middle"
            >
              {cp.type === "min" ? "极小值" : "极大值"} ({cp.x.toFixed(1)},{" "}
              {cp.y.toFixed(1)})
            </text>
          </g>
        );
      })}

      {/* 6. 平移模式：渐近线交点 / 对称中心 C(h, c) */}
      {activeMode === "shifted" && (
        <g className="symmetry-center">
          <InteractivePoint
            cx={h}
            cy={c}
            scale={scale}
            vp={vp}
            onDrag={handleDragCenter}
            label={`中心 C(${h.toFixed(1)}, ${c.toFixed(1)})`}
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

          {/* 可拖拽动点 */}
          <InteractivePoint
            cx={x0}
            cy={evalPt.y}
            scale={scale}
            vp={vp}
            onDrag={handleDragProbe}
            label={`P(${x0.toFixed(1)}, ${evalPt.y.toFixed(1)})`}
            color={MATH_COLORS.interactiveActive}
            fontScale={fontScale}
          />
        </g>
      )}
    </g>
  );
}
