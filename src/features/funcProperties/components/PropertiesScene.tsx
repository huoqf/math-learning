/**
 * PropertiesScene 分发器
 * 仅承担：参数解构、动态母函数 getFn 构建、周期模型求解（主曲线波形）、
 * 坐标系网格与主函数曲线渲染，按 mode 分发到三个独立子场景。
 */
import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CoordinateGrid, FunctionGraph } from "@/components/Math";
import { MATH_COLORS } from "@/theme";
import {
  createSymmetryFn,
  evalPeriodicityModel,
  type PeriodModelType,
} from "@/math/function";
import { PropertiesDomainScene } from "./PropertiesDomainScene";
import { PropertiesParityScene } from "./PropertiesParityScene";
import { PropertiesSymmetryScene } from "./PropertiesSymmetryScene";
import type { PropertiesFnType, PropertiesSubMode } from "./types";

interface PropertiesSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  fnType: PropertiesFnType;
  mode: "domain" | "parity" | "symmetry";
  subMode?:
    | "axis"
    | "center"
    | "period-dual-axis"
    | "period-dual-center"
    | "period-axis-center";
}

export function PropertiesScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  fnType,
  mode,
  subMode = "axis",
}: PropertiesSceneProps) {
  const x0 = params.x0 ?? 1.5;
  const x1 = params.x1 ?? -1.0;
  const x2 = params.x2 ?? 2.0;
  const axisA = params.axisA ?? 0.0;
  const axisB = params.axisB ?? 2.0;
  const centerX = params.centerX ?? 0.0;
  const centerY = params.centerY ?? 0.0;

  // 单轴 / 中心对称的母函数统一由 math 层构造器提供（SSOT：与右屏看板共用同一份实现）
  const symmetryFn = React.useMemo(
    () =>
      mode === "symmetry" && (subMode === "axis" || subMode === "center")
        ? createSymmetryFn(fnType, subMode, axisA, centerX, centerY)
        : null,
    [mode, subMode, fnType, axisA, centerX, centerY],
  );

  // 母函数：对称模式走共享对称模型，其余（定义域/奇偶性）走标准母函数
  const getFn: (x: number) => number = React.useCallback(
    (x: number) => {
      if (symmetryFn) return symmetryFn(x);

      switch (fnType) {
        case "cubic":
          return x * x * x;
        case "quadratic":
          return x * x;
        case "root":
          return x >= 0 ? Math.sqrt(x) : NaN;
        case "abs":
          return Math.abs(x);
        case "reciprocal":
          return Math.abs(x) > 1e-4 ? 1 / x : NaN;
        case "sin":
          return Math.sin(x);
        default:
          return x;
      }
    },
    [fnType, symmetryFn],
  );

  // 周期模型计算（父级需 waveFn 绘制主曲线）
  const periodModelType: PeriodModelType =
    subMode === "period-dual-center"
      ? "dual-center"
      : subMode === "period-axis-center"
        ? "axis-center"
        : "dual-axis";
  const periodRes = evalPeriodicityModel(periodModelType, axisA, axisB);

  const commonProps = {
    scale,
    vp,
    onParamChange,
    fontScale,
    getFn,
  };

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 主函数曲线（周期模式采用 waveFn，其余采用 getFn） */}
      {mode === "symmetry" &&
      (subMode as PropertiesSubMode).startsWith("period") ? (
        <FunctionGraph
          fn={periodRes.waveFn}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />
      ) : (
        <FunctionGraph
          fn={getFn}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />
      )}

      {mode === "domain" && (
        <PropertiesDomainScene
          {...commonProps}
          fnType={fnType as PropertiesFnType}
          x0={x0}
        />
      )}

      {mode === "parity" && (
        <PropertiesParityScene
          {...commonProps}
          fnType={fnType as PropertiesFnType}
          x0={x0}
          x1={x1}
          x2={x2}
        />
      )}

      {mode === "symmetry" && (
        <PropertiesSymmetryScene
          {...commonProps}
          subMode={subMode}
          x0={x0}
          axisA={axisA}
          axisB={axisB}
          centerX={centerX}
          centerY={centerY}
          periodModelType={periodModelType}
          periodRes={periodRes}
        />
      )}
    </g>
  );
}
