/**
 * src/features/conicDefinition/components/ConicDefinitionScene.tsx
 * 纯 SVG 渲染，严格遵循项目规范：
 * - 纯净坐标系 showGrid={false}，无多余网格干扰
 * - 纯粹展示核心几何元素：曲线、焦点、动点、焦半径线段、准线与垂足
 * - 垂足直角标尺防畸变 (9px)
 * - 动点 100% 使用 InteractivePoint，支持全轨迹流畅拖拽
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CoordinateGrid, InteractivePoint, MathPoint } from "@/components/Math";
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
  studyMode: "firstDef" | "unifiedDef";
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
    pathD,
    f1Design,
    f2Design,
    pDesign,
    directrixLine,
    perpFootH,
    asymptotesDesign,
    labelPositions,
    handlePDrag,
  } = useConicDefinitionScene({
    params,
    scale,
    studyMode,
    conicType,
    onParamChange,
  });

  const cPrimary = MATH_COLORS.paramPrimary; // #EF4444 鲜红
  const cSecondary = MATH_COLORS.paramSecondary; // #D97706 暖橙
  const cTertiary = MATH_COLORS.paramTertiary; // #059669 翠绿

  // 映射 label 到对应颜色
  const getLabelColor = (key: string) => {
    switch (key) {
      case "P":
        return cPrimary;
      case "F1":
      case "F2":
        return cSecondary;
      case "H":
        return cTertiary;
      default:
        return MATH_COLORS.textMuted;
    }
  };

  return (
    <g>
      {/* 坐标轴与整数刻度 (纯白底色 + 清晰 xOy，无背景灰色方格网) */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* 1. 双曲线渐近线 (若有) */}
      {asymptotesDesign &&
        asymptotesDesign.map((line, idx) => (
          <line
            key={`asymptote-${idx}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={withAlpha("#94A3B8", 0.55)}
            strokeWidth={1.2}
            strokeDasharray="4 4"
          />
        ))}

      {/* 2. 准线 (统一定义 / 抛物线) */}
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
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
          >
            准线 L (x = {directrixLine.x.toFixed(1)})
          </text>
        </g>
      )}

      {/* 3. 圆锥曲线主轨迹 (椭圆/双曲线/抛物线) */}
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
          strokeWidth={2.6}
        />
      )}

      {/* 4. 焦半径线段 PF1 / PF */}
      {f1Design && (
        <line
          x1={pDesign.x}
          y1={pDesign.y}
          x2={f1Design.x}
          y2={f1Design.y}
          stroke={cPrimary}
          strokeWidth={2.2}
        />
      )}

      {/* 5. 焦半径线段 PF2 (双焦点模式) */}
      {f2Design && studyMode === "firstDef" && conicType !== "parabola" && (
        <line
          x1={pDesign.x}
          y1={pDesign.y}
          x2={f2Design.x}
          y2={f2Design.y}
          stroke={cSecondary}
          strokeWidth={2.2}
        />
      )}

      {/* 6. 到准线垂线段 PH 及直角标尺 (统一定义 / 抛物线) */}
      {perpFootH && (
        <g>
          <line
            x1={perpFootH.line.x1}
            y1={perpFootH.line.y1}
            x2={perpFootH.line.x2}
            y2={perpFootH.line.y2}
            stroke={cTertiary}
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          {/* 垂足直角标尺 ∟ (固定 9px) */}
          <path
            d={`M ${perpFootH.design.x + (perpFootH.line.x1 > perpFootH.design.x ? 9 : -9)} ${perpFootH.design.y} L ${perpFootH.design.x + (perpFootH.line.x1 > perpFootH.design.x ? 9 : -9)} ${perpFootH.design.y - 9} L ${perpFootH.design.x} ${perpFootH.design.y - 9}`}
            fill="none"
            stroke={cTertiary}
            strokeWidth={1.5}
          />
          <MathPoint
            x={perpFootH.design.x}
            y={perpFootH.design.y}
            fontScale={fontScale}
            color={cTertiary}
            r={3.2}
          />
        </g>
      )}

      {/* 7. 焦点特征点绘制 (使用 MathPoint 纯数学点) */}
      {f1Design && (
        <MathPoint
          x={f1Design.x}
          y={f1Design.y}
          fontScale={fontScale}
          color={cSecondary}
          r={3.8}
        />
      )}
      {f2Design && (
        <MathPoint
          x={f2Design.x}
          y={f2Design.y}
          fontScale={fontScale}
          color={cSecondary}
          r={3.8}
        />
      )}

      {/* 8. 避让文本标注 (微描边保护，无白底框断线) */}
      {labelPositions.map((lbl: PlacedLabel) => (
        <text
          key={lbl.key}
          x={lbl.x}
          y={lbl.y + lbl.dy}
          fill={getLabelColor(lbl.key)}
          fontSize={fontScale(13)}
          fontWeight="bold"
          textAnchor="middle"
          paintOrder="stroke"
          stroke="white"
          strokeWidth={3}
          strokeLinejoin="round"
        >
          {lbl.text}
        </text>
      ))}

      {/* 9. 可拖拽动点 P (外光晕手柄，全轨迹拖拽) */}
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
