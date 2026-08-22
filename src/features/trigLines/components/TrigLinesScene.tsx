/**
 * src/features/trigLines/components/TrigLinesScene.tsx
 * 纯 SVG 渲染编排层：零物理公式、零硬编码颜色字号，完全遵循铁律。
 * 保持导出名与 props 接口不变；按 studyMode 分派到独立的模式场景组件。
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CoordinateGrid } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS } from "@/theme";
import { pointToAngleDeg } from "../math/trigLines";
import type { TrigInequalityKind } from "../math/trigLines";
import { TrigLinesDefScene } from "./TrigLinesDefScene";
import { TrigLinesComparisonScene } from "./TrigLinesComparisonScene";
import { TrigLinesInequalityScene } from "./TrigLinesInequalityScene";

interface TrigLinesSceneProps {
  params: {
    alphaDeg: number;
    compAlphaDeg?: number;
    ineqThreshold?: number;
    showSine?: number;
    showCosine?: number;
    showTangent?: number;
    showArc?: number;
    showAuxTriangle?: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode?: "lines" | "comparison" | "inequality";
  ineqKind?: TrigInequalityKind;
}

export const TrigLinesScene: React.FC<TrigLinesSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "lines",
  ineqKind = "sin_gt",
}) => {
  // 参数归一化
  const alphaDeg = params.alphaDeg;
  const compAlphaDeg = params.compAlphaDeg ?? 40;
  const ineqThreshold = params.ineqThreshold ?? 0.5;
  const showSine = params.showSine ?? 1;
  const showCosine = params.showCosine ?? 1;
  const showTangent = params.showTangent ?? 1;
  const showArc = params.showArc ?? 1;
  const showAuxTriangle = params.showAuxTriangle ?? 1;

  // 坐标系基准点与尺寸 (所有模式共享)
  const centerPt = mathToDesign(0, 0, scale);
  const unitRadiusPx = scale.scaleX; // 半径 r = 1 的像素数
  const aDesign = mathToDesign(1, 0, scale);

  // 动点拖拽回调 (定义模式 / 三角不等式模式共享)
  const handlePDrag = (rawMath: { x: number; y: number }) => {
    const newDeg = pointToAngleDeg(rawMath.x, rawMath.y, alphaDeg);
    onParamChange("alphaDeg", newDeg);
  };

  return (
    <g>
      {/* 坐标轴与背景网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 单位圆 x^2 + y^2 = 1 */}
      <circle
        cx={centerPt.x}
        cy={centerPt.y}
        r={unitRadiusPx}
        fill="none"
        stroke={MATH_COLORS.function}
        strokeWidth={2}
        opacity={0.85}
      />

      {/* 模式 1：定义模式 (lines) */}
      {studyMode === "lines" && (
        <TrigLinesDefScene
          params={{
            alphaDeg,
            showSine,
            showCosine,
            showTangent,
            showArc,
            showAuxTriangle,
          }}
          scale={scale}
          vp={vp}
          onPDrag={handlePDrag}
          fontScale={fontScale}
          centerPt={centerPt}
          aDesign={aDesign}
        />
      )}

      {/* 模式 2：面积放缩与不等式 (comparison) */}
      {studyMode === "comparison" && (
        <TrigLinesComparisonScene
          params={{ compAlphaDeg }}
          scale={scale}
          vp={vp}
          onParamChange={onParamChange}
          fontScale={fontScale}
          centerPt={centerPt}
          unitRadiusPx={unitRadiusPx}
          aDesign={aDesign}
        />
      )}

      {/* 模式 3：三角不等式 (inequality) */}
      {studyMode === "inequality" && (
        <TrigLinesInequalityScene
          params={{ alphaDeg, ineqThreshold }}
          scale={scale}
          vp={vp}
          onPDrag={handlePDrag}
          fontScale={fontScale}
          centerPt={centerPt}
          unitRadiusPx={unitRadiusPx}
          aDesign={aDesign}
          ineqKind={ineqKind}
        />
      )}
    </g>
  );
};
