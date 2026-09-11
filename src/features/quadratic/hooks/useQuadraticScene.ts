/**
 * src/features/quadratic/hooks/useQuadraticScene.ts
 * 不等式区间 + 动点拖拽反算约束（纯函数/Hook，零 JSX）
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import { solveQuadratic } from "@/math/quadratic";
import { getSolutionIntervals } from "../model/inequalityIntervals";

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
  studyMode: _studyMode,
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

  // 1. 对称轴数据（x = -b / 2a）
  const axisLine = React.useMemo(() => {
    if (res.axisX === null) return null;
    const topPt = mathToDesign(res.axisX, scale.yMax, scale);
    const bottomPt = mathToDesign(res.axisX, scale.yMin, scale);
    return { x1: topPt.x, y1: topPt.y, x2: bottomPt.x, y2: bottomPt.y };
  }, [res.axisX, scale]);

  // 2. 计算不等式解区间
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

  const isDegenerate = Math.abs(a) < 1e-9;

  return {
    axisLine,
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
