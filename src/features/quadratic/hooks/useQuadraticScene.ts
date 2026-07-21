/**
 * src/features/quadratic/hooks/useQuadraticScene.ts
 * 不等式区间 + 标注避让 + 拖拽约束（零 JSX）
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
import { solveQuadratic } from "@/math/quadratic";
import { getSolutionIntervals } from "../model/inequalityIntervals";
import type { SolutionInterval } from "../model/inequalityIntervals";

interface UseQuadraticSceneParams {
  params: { a: number; b: number; c: number };
  scale: SceneScale;
  onParamChange: (key: string, value: number) => void;
  studyMode: "function" | "equation" | "inequality";
  ineqType: ">" | "<";
}

export interface AxisLineData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function useQuadraticScene({
  params,
  scale,
  onParamChange,
  studyMode,
  ineqType,
}: UseQuadraticSceneParams) {
  const { a, b, c } = params;
  const res = solveQuadratic(a, b, c);

  // ── 拖拽约束：顶点拖拽保持 a 不变，反算 b 和 c ──
  const handleVertexDrag = React.useCallback(
    (mathPt: { x: number; y: number }) => {
      if (Math.abs(a) < 1e-9) return;
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

  // 1. 对称轴（返回坐标数据，由组件渲染 SVG）
  const axisLine = React.useMemo(() => {
    if (res.axisX === null) return null;
    const topPt = mathToDesign(res.axisX, scale.yMax, scale);
    const bottomPt = mathToDesign(res.axisX, scale.yMin, scale);
    return { x1: topPt.x, y1: topPt.y, x2: bottomPt.x, y2: bottomPt.y };
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
    const entries: LabelEntry[] = [];
    const isDeg = Math.abs(a) < 1e-9;

    // 1. 顶点标签
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

    // 3. 根交点标签
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
      // 不等式模式下标注端点值
      solutionIntervals.forEach((interval: SolutionInterval, index: number) => {
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

    // 使用共享避让工具
    return avoidLabels(entries);
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

  return {
    axisLine,
    labels,
    solutionIntervals,
    handleVertexDrag,
    handleYInterceptDrag,
    isDegenerate,
    vertexX: res.vertexX,
    vertexY: res.vertexY,
    roots: res.roots,
    delta: res.delta,
  };
}
