import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  IntervalShadow,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { solveQuadratic } from "@/math/quadratic";
import { MATH_COLORS, withAlpha } from "@/theme";

/** 标注矩形（用于碰撞检测） */
interface LabelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 检测两个矩形是否重叠 */
function overlaps(a: LabelRect, b: LabelRect): boolean {
  return !(
    a.x + a.w < b.x ||
    b.x + b.w < a.x ||
    a.y + a.h < b.y ||
    b.y + b.h < a.y
  );
}

/** 默认标注尺寸估计（10px 字号，中文约 6px/字） */
const LABEL_H = 14;
function estimateW(text: string): number {
  return text.length * 6.5 + 8;
}

interface SolutionInterval {
  x1: number;
  x2: number;
  isLeftInfinity?: boolean;
  isRightInfinity?: boolean;
}

/** 计算一元二次不等式的数学满足区间列表 */
function getSolutionIntervals(
  a: number,
  b: number,
  c: number,
  ineqType: ">" | "<",
  xMin: number,
  xMax: number,
  roots: number[],
): SolutionInterval[] {
  const intervals: SolutionInterval[] = [];

  if (Math.abs(a) > 1e-9) {
    if (roots.length === 2) {
      const r1 = roots[0];
      const r2 = roots[1];
      if (ineqType === ">") {
        if (a > 0) {
          intervals.push({ x1: xMin - 1, x2: r1, isLeftInfinity: true });
          intervals.push({ x1: r2, x2: xMax + 1, isRightInfinity: true });
        } else {
          intervals.push({ x1: r1, x2: r2 });
        }
      } else {
        // ineqType === '<'
        if (a > 0) {
          intervals.push({ x1: r1, x2: r2 });
        } else {
          intervals.push({ x1: xMin - 1, x2: r1, isLeftInfinity: true });
          intervals.push({ x1: r2, x2: xMax + 1, isRightInfinity: true });
        }
      }
    } else if (roots.length === 1) {
      const r0 = roots[0];
      if (ineqType === ">") {
        if (a > 0) {
          intervals.push({ x1: xMin - 1, x2: r0, isLeftInfinity: true });
          intervals.push({ x1: r0, x2: xMax + 1, isRightInfinity: true });
        }
      } else {
        // ineqType === '<'
        if (a < 0) {
          intervals.push({ x1: xMin - 1, x2: r0, isLeftInfinity: true });
          intervals.push({ x1: r0, x2: xMax + 1, isRightInfinity: true });
        }
      }
    } else {
      // roots.length === 0
      if (ineqType === ">") {
        if (a > 0) {
          intervals.push({
            x1: xMin - 1,
            x2: xMax + 1,
            isLeftInfinity: true,
            isRightInfinity: true,
          });
        }
      } else {
        // ineqType === '<'
        if (a < 0) {
          intervals.push({
            x1: xMin - 1,
            x2: xMax + 1,
            isLeftInfinity: true,
            isRightInfinity: true,
          });
        }
      }
    }
  } else {
    // a === 0 退化为 bx + c
    if (Math.abs(b) > 1e-9) {
      const r0 = -c / b;
      if (ineqType === ">") {
        if (b > 0) {
          intervals.push({ x1: r0, x2: xMax + 1, isRightInfinity: true });
        } else {
          intervals.push({ x1: xMin - 1, x2: r0, isLeftInfinity: true });
        }
      } else {
        // ineqType === '<'
        if (b > 0) {
          intervals.push({ x1: xMin - 1, x2: r0, isLeftInfinity: true });
        } else {
          intervals.push({ x1: r0, x2: xMax + 1, isRightInfinity: true });
        }
      }
    } else {
      // b === 0 => c
      if (ineqType === ">") {
        if (c > 0) {
          intervals.push({
            x1: xMin - 1,
            x2: xMax + 1,
            isLeftInfinity: true,
            isRightInfinity: true,
          });
        }
      } else {
        // ineqType === '<'
        if (c < 0) {
          intervals.push({
            x1: xMin - 1,
            x2: xMax + 1,
            isLeftInfinity: true,
            isRightInfinity: true,
          });
        }
      }
    }
  }
  return intervals;
}

interface QuadraticSceneProps {
  params: {
    a: number;
    b: number;
    c: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  /** 字号缩放函数，默认原样返回 */
  fontScale?: (v: number) => number;
  studyMode?: "function" | "equation" | "inequality";
  ineqType?: ">" | "<";
}

export const QuadraticScene: React.FC<QuadraticSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "function",
  ineqType = ">",
}) => {
  const { a, b, c } = params;
  const res = solveQuadratic(a, b, c);

  // ── 拖拽约束：顶点拖拽保持 a 不变，反算 b 和 c ──
  const handleVertexDrag = React.useCallback(
    (mathPt: { x: number; y: number }) => {
      if (Math.abs(a) < 1e-9) return; // a=0 时无顶点
      const newB = -2 * a * mathPt.x;
      const newC = mathPt.y + a * mathPt.x * mathPt.x;
      onParamChange("b", Math.round(newB * 100) / 100);
      onParamChange("c", Math.round(newC * 100) / 100);
    },
    [a, onParamChange],
  );

  // ── 拖拽约束：Y 轴交点拖拽只改变 c ──
  const handleYInterceptDrag = React.useCallback(
    (mathPt: { x: number; y: number }) => {
      onParamChange("c", Math.round(mathPt.y * 100) / 100);
    },
    [onParamChange],
  );

  // 1. 对称轴 (退化或非函数/方程模式下可以隐藏，但为了辅助拖拽定位，不等式模式若 a≠0 也可以画)
  const axisLine = React.useMemo(() => {
    if (res.axisX === null) return null;
    const topPt = mathToDesign(res.axisX, scale.yMax, scale);
    const bottomPt = mathToDesign(res.axisX, scale.yMin, scale);
    return (
      <line
        x1={topPt.x}
        y1={topPt.y}
        x2={bottomPt.x}
        y2={bottomPt.y}
        stroke={MATH_COLORS.asymptote}
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
    );
  }, [res.axisX, scale]);

  // ── 计算不等式解区间 ──
  const solutionIntervals = React.useMemo(() => {
    return getSolutionIntervals(
      a,
      b,
      c,
      ineqType,
      scale.xMin,
      scale.xMax,
      res.roots,
    );
  }, [a, b, c, ineqType, scale.xMin, scale.xMax, res.roots]);

  // ── 标注避让：统一计算所有标注位置，检测碰撞并偏移 ──
  const labels = React.useMemo(() => {
    type LabelEntry = {
      key: string;
      text: string;
      x: number;
      y: number;
      anchor: "middle" | "start" | "end";
      dy: number;
    };

    const entries: LabelEntry[] = [];
    const isDeg = Math.abs(a) < 1e-9;

    // 1. 顶点标签 (只有函数和方程模式，或非退化的不等式模式下展示)
    if (res.vertexX !== null && res.vertexY !== null && !isDeg) {
      const pt = mathToDesign(res.vertexX, res.vertexY, scale);
      entries.push({
        key: "vertex",
        text: `P(${res.vertexX.toFixed(1)}, ${res.vertexY.toFixed(1)})`,
        x: pt.x,
        y: pt.y,
        anchor: "middle",
        dy: a > 0 ? 18 : -12,
      });
    }

    // 2. Y 轴交点标签
    {
      const pt = mathToDesign(0, c, scale);
      entries.push({
        key: "yInt",
        text: `(0, ${c.toFixed(1)})`,
        x: pt.x,
        y: pt.y,
        anchor: "start",
        dy: 3,
      });
    }

    // 3. 根交点标签 (仅在非不等式模式下展示实根，不等式在数轴上标识)
    if (studyMode !== "inequality") {
      res.roots
        .filter((r) => Number.isFinite(r))
        .forEach((rootVal, i) => {
          const pt = mathToDesign(rootVal, 0, scale);
          entries.push({
            key: `root${i}`,
            text: `x${i + 1}=${rootVal.toFixed(1)}`,
            x: pt.x,
            y: pt.y,
            anchor: "middle",
            dy: -10,
          });
        });
    } else {
      // 在不等式模式下，只标注可视区域内的端点值
      solutionIntervals.forEach((interval, index) => {
        if (
          !interval.isLeftInfinity &&
          interval.x1 >= scale.xMin &&
          interval.x1 <= scale.xMax
        ) {
          const pt = mathToDesign(interval.x1, 0, scale);
          entries.push({
            key: `ineq-left-${index}`,
            text: interval.x1.toFixed(1),
            x: pt.x,
            y: pt.y,
            anchor: "middle",
            dy: -10,
          });
        }
        if (
          !interval.isRightInfinity &&
          interval.x2 >= scale.xMin &&
          interval.x2 <= scale.xMax
        ) {
          const pt = mathToDesign(interval.x2, 0, scale);
          entries.push({
            key: `ineq-right-${index}`,
            text: interval.x2.toFixed(1),
            x: pt.x,
            y: pt.y,
            anchor: "middle",
            dy: -10,
          });
        }
      });
    }

    // 碰撞检测与避让
    const placed: (LabelEntry & { rect: LabelRect; finalDy: number })[] = [];
    for (const e of entries) {
      const w = estimateW(e.text);
      const xOff = e.anchor === "start" ? 0 : e.anchor === "end" ? -w : -w / 2;
      let dy = e.dy;

      for (let attempt = 0; attempt < 5; attempt++) {
        const rect: LabelRect = {
          x: e.x + xOff,
          y: e.y + dy - LABEL_H,
          w,
          h: LABEL_H,
        };
        const hit = placed.some((p) => overlaps(p.rect, rect));
        if (!hit) {
          placed.push({ ...e, rect, finalDy: dy });
          break;
        }
        dy -= LABEL_H + 2;
      }
    }

    return placed;
  }, [
    res.vertexX,
    res.vertexY,
    res.roots,
    a,
    c,
    scale,
    studyMode,
    solutionIntervals,
  ]);

  const isDegenerate = Math.abs(a) < 1e-9;

  return (
    <g>
      {/* 坐标轴背景 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 不等式区间阴影填充（在抛物线和 X 轴之间，采用绿色半透明填充） */}
      {studyMode === "inequality" &&
        solutionIntervals.map((interval, index) => (
          <IntervalShadow
            key={`shadow-${index}`}
            fn={(x) => a * x * x + b * x + c}
            x1={interval.x1}
            x2={interval.x2}
            scale={scale}
            fillColor={withAlpha(MATH_COLORS.inequality, 0.15)}
            strokeColor="transparent"
          />
        ))}

      {/* 对称轴线 */}
      {axisLine}

      {/* 抛物线主线 */}
      <FunctionGraph
        fn={(x) => a * x * x + b * x + c}
        scale={scale}
        color={MATH_COLORS.function}
        strokeWidth={2.5}
      />

      {/* 不等式解集在 X 轴上的数轴投影高亮线段 */}
      {studyMode === "inequality" &&
        solutionIntervals.map((interval, index) => {
          const startPt = mathToDesign(
            Math.max(interval.x1, scale.xMin),
            0,
            scale,
          );
          const endPt = mathToDesign(
            Math.min(interval.x2, scale.xMax),
            0,
            scale,
          );
          return (
            <g key={`projection-group-${index}`}>
              <line
                x1={startPt.x}
                y1={startPt.y}
                x2={endPt.x}
                y2={endPt.y}
                stroke={MATH_COLORS.inequality}
                strokeWidth={5}
                strokeOpacity={0.5}
                strokeLinecap="round"
              />
              {/* 开区间端点（左端点） */}
              {!interval.isLeftInfinity &&
                interval.x1 >= scale.xMin &&
                interval.x1 <= scale.xMax && (
                  <circle
                    cx={mathToDesign(interval.x1, 0, scale).x}
                    cy={mathToDesign(interval.x1, 0, scale).y}
                    r={4.5}
                    fill={MATH_COLORS.white}
                    stroke={MATH_COLORS.inequality}
                    strokeWidth={2}
                  />
                )}
              {/* 开区间端点（右端点） */}
              {!interval.isRightInfinity &&
                interval.x2 >= scale.xMin &&
                interval.x2 <= scale.xMax && (
                  <circle
                    cx={mathToDesign(interval.x2, 0, scale).x}
                    cy={mathToDesign(interval.x2, 0, scale).y}
                    r={4.5}
                    fill={MATH_COLORS.white}
                    stroke={MATH_COLORS.inequality}
                    strokeWidth={2}
                  />
                )}
            </g>
          );
        })}

      {/* Y 轴交点（可拖拽） */}
      <InteractivePoint
        cx={0}
        cy={c}
        scale={scale}
        vp={vp}
        onDrag={handleYInterceptDrag}
        color={MATH_COLORS.vectorSecondary}
        r={5}
        disabled={false}
        fontScale={fontScale}
      />

      {/* 抛物线顶点（可拖拽，a=0 时禁用） */}
      {res.vertexX !== null && res.vertexY !== null && (
        <InteractivePoint
          cx={res.vertexX}
          cy={res.vertexY}
          scale={scale}
          vp={vp}
          onDrag={handleVertexDrag}
          color={MATH_COLORS.focusPoint}
          r={6}
          disabled={isDegenerate}
          fontScale={fontScale}
        />
      )}

      {/* 零点/实数根标记（方程和函数模式下展示为实心红点） */}
      {studyMode !== "inequality" &&
        res.roots
          .filter((r) => Number.isFinite(r))
          .map((rootVal, i) => {
            const pt = mathToDesign(rootVal, 0, scale);
            return (
              <circle
                key={`root-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={4.5}
                fill={MATH_COLORS.vectorResult}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
            );
          })}

      {/* 方程模式下 Δ < 0 时的“无实数根”图上标注 */}
      {studyMode === "equation" && a !== 0 && res.delta < 0 && (
        <g>
          <rect
            x={mathToDesign(0, 1.8, scale).x - 90}
            y={mathToDesign(0, 1.8, scale).y - 18}
            width={180}
            height={32}
            rx={6}
            fill={withAlpha(MATH_COLORS.vectorResult, 0.08)}
            stroke={withAlpha(MATH_COLORS.vectorResult, 0.3)}
            strokeWidth={1}
          />
          <text
            x={mathToDesign(0, 1.8, scale).x}
            y={mathToDesign(0, 1.8, scale).y + 2}
            textAnchor="middle"
            fill={MATH_COLORS.vectorResult}
            fontSize={fontScale(11)}
            fontWeight="bold"
            className="select-none pointer-events-none"
          >
            Δ = {res.delta.toFixed(2)} &lt; 0 (无实数根)
          </text>
        </g>
      )}

      {/* 所有标注（带碰撞避让） */}
      {labels.map((l) => (
        <text
          key={l.key}
          x={l.x}
          y={l.y + l.finalDy}
          textAnchor={l.anchor}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(10)}
          fontFamily="monospace"
          fontWeight="600"
          className="select-none pointer-events-none"
        >
          {l.text}
        </text>
      ))}
    </g>
  );
};
