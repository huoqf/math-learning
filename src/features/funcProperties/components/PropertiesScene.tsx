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
import { evalPeriodicityModel, type PeriodModelType } from "@/math/function";
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

  // 单轴与中心对称的动态适应母函数
  const getFn: (x: number) => number = React.useCallback(
    (x: number) => {
      if (mode === "symmetry") {
        if (subMode === "axis") {
          // 关于 x = axisA 对称的二次/绝对值/余弦模型
          if (fnType === "quadratic") return 0.5 * Math.pow(x - axisA, 2) - 1.5;
          if (fnType === "abs") return Math.abs(x - axisA) - 1.0;
          if (fnType === "sin") return Math.cos(x - axisA);
          return Math.pow(x - axisA, 2) - 2;
        }
        if (subMode === "center") {
          // 关于 C(centerX, centerY) 对称的三次/正弦/反比例模型
          if (fnType === "cubic")
            return 0.3 * Math.pow(x - centerX, 3) + centerY;
          if (fnType === "sin") return Math.sin(x - centerX) + centerY;
          if (fnType === "reciprocal") {
            const dx = x - centerX;
            return Math.abs(dx) > 1e-3 ? 1 / dx + centerY : NaN;
          }
          return 0.3 * Math.pow(x - centerX, 3) + centerY;
        }
      }

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
    [fnType, mode, subMode, axisA, centerX, centerY],
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
