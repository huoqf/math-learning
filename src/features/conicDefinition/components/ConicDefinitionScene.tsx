/**
 * src/features/conicDefinition/components/ConicDefinitionScene.tsx
 * 纯 SVG 渲染，零物理公式、零硬编码颜色、零 DOM/State 关联
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CoordinateGrid, InteractivePoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import { useConicDefinitionScene } from "../hooks/useConicDefinitionScene";
import type { PlacedLabel } from "@/utils/labelAvoider";

interface ConicDefinitionSceneProps {
  params: {
    a: number;
    c: number;
    e: number;
    p: number;
    theta: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale?: (v: number) => number;
  studyMode: "firstDef" | "unifiedDef" | "locusGen";
  conicType: "ellipse" | "hyperbola" | "parabola";
  onParamChange: (key: string, value: number) => void;
}

export const ConicDefinitionScene: React.FC<ConicDefinitionSceneProps> = ({
  params,
  scale,
  vp,
  fontScale = (v) => v,
  studyMode,
  conicType,
  onParamChange,
}) => {
  const {
    sceneData,
    pathD,
    f1Design,
    f2Design,
    pDesign,
    directrixLine,
    perpLineToDirectrix,
    labelPositions,
    handlePDrag,
  } = useConicDefinitionScene({
    params,
    scale,
    studyMode,
    conicType,
    onParamChange,
  });

  const cPrimary = MATH_COLORS.paramPrimary; // #EF4444
  const cSecondary = MATH_COLORS.paramSecondary; // #D97706
  const cTertiary = MATH_COLORS.paramTertiary; // #059669

  return (
    <g>
      {/* 坐标轴与网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. 准线 (若有) */}
      {directrixLine && (
        <g>
          <line
            x1={directrixLine.x1}
            y1={directrixLine.y1}
            x2={directrixLine.x2}
            y2={directrixLine.y2}
            stroke={MATH_COLORS.asymptote}
            strokeWidth={2}
            strokeDasharray="6 4"
          />
          <text
            x={directrixLine.x1 + 6}
            y={directrixLine.y1 + 20}
            fill={MATH_COLORS.asymptote}
            fontSize={fontScale(12)}
            fontWeight="bold"
          >
            准线 L
          </text>
        </g>
      )}

      {/* 2. 主轨迹曲线 */}
      {pathD && (
        <path
          d={pathD}
          fill="none"
          stroke={
            conicType === "ellipse"
              ? cPrimary
              : conicType === "hyperbola"
                ? cSecondary
                : cTertiary
          }
          strokeWidth={2.5}
        />
      )}

      {/* 3. 动圆辅助线 (动圆生成法) */}
      {sceneData.auxiliaryCircles &&
        sceneData.auxiliaryCircles.map((circle, idx) => {
          const cDesign = mathToDesign(circle.center.x, circle.center.y, scale);
          const rPixel = circle.r * scale.scaleX;
          return (
            <circle
              key={`aux-circle-${idx}`}
              cx={cDesign.x}
              cy={cDesign.y}
              r={Math.abs(rPixel)}
              fill="none"
              stroke={
                idx === 0
                  ? withAlpha(cPrimary, 0.4)
                  : withAlpha(cSecondary, 0.4)
              }
              strokeWidth={1.5}
              strokeDasharray={idx === 0 ? "none" : "4 4"}
            />
          );
        })}

      {/* 4. 焦半径线段 PF1 */}
      {f1Design && (
        <line
          x1={pDesign.x}
          y1={pDesign.y}
          x2={f1Design.x}
          y2={f1Design.y}
          stroke={cPrimary}
          strokeWidth={2}
        />
      )}

      {/* 5. 焦半径线段 PF2 (如果有 F2) */}
      {f2Design && (
        <line
          x1={pDesign.x}
          y1={pDesign.y}
          x2={f2Design.x}
          y2={f2Design.y}
          stroke={cSecondary}
          strokeWidth={2}
        />
      )}

      {/* 6. 到准线垂线段 PH (若有) */}
      {perpLineToDirectrix && (
        <g>
          <line
            x1={perpLineToDirectrix.x1}
            y1={perpLineToDirectrix.y1}
            x2={perpLineToDirectrix.x2}
            y2={perpLineToDirectrix.y2}
            stroke={cTertiary}
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          {/* 垂足 H 标记 */}
          <circle
            cx={perpLineToDirectrix.x2}
            cy={perpLineToDirectrix.y2}
            r={3}
            fill={cTertiary}
          />
          <text
            x={perpLineToDirectrix.x2 - 16}
            y={perpLineToDirectrix.y2 + 4}
            fill={cTertiary}
            fontSize={fontScale(11)}
          >
            H
          </text>
        </g>
      )}

      {/* 7. 焦点 F1, F2 点绘制 */}
      {f1Design && (
        <circle cx={f1Design.x} cy={f1Design.y} r={4} fill={cSecondary} />
      )}
      {f2Design && (
        <circle cx={f2Design.x} cy={f2Design.y} r={4} fill={cSecondary} />
      )}

      {/* 8. 避让文本标注 P, F1, F2 */}
      {labelPositions.map((lbl: PlacedLabel) => (
        <text
          key={lbl.key}
          x={lbl.x}
          y={lbl.y + lbl.dy}
          fill={lbl.key === "P" ? cPrimary : cSecondary}
          fontSize={fontScale(13)}
          fontWeight="bold"
          textAnchor="middle"
        >
          {lbl.text}
        </text>
      ))}

      {/* 9. 可拖拽控制点 P */}
      <InteractivePoint
        cx={pDesign.x}
        cy={pDesign.y}
        scale={scale}
        vp={vp}
        color={cPrimary}
        fontScale={fontScale}
        onDrag={handlePDrag}
      />
    </g>
  );
};
