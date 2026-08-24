/**
 * src/features/conicDefinition/components/ConicDefinitionScene.tsx
 * 纯 SVG 渲染，严格遵循项目规范：
 * - 纯净坐标系 showGrid={false}
 * - 点位 100% 使用 MathPoint / InteractivePoint
 * - 垂足与中垂线直角标尺防畸变 (9~10px)
 * - 动圆法完整呈现定圆、动圆、中垂线、辅助折线与理论轨迹
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CoordinateGrid, InteractivePoint, MathPoint } from "@/components/Math";
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
    qDesign,
    nDesign,
    directrixLine,
    perpFootH,
    bisectorLineDesign,
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
      case "M":
        return cPrimary;
      case "F1":
      case "F2":
      case "Q":
        return cSecondary;
      case "H":
      case "N":
        return cTertiary;
      default:
        return MATH_COLORS.textMuted;
    }
  };

  return (
    <g>
      {/* 坐标轴与整数刻度 (纯白底色 + 清晰 xOy，关闭灰色方格网) */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* 0. 双曲线渐近线 (若有) */}
      {asymptotesDesign &&
        asymptotesDesign.map((line, idx) => (
          <line
            key={`asymptote-${idx}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={withAlpha(MATH_COLORS.asymptote, 0.45)}
            strokeWidth={1.2}
            strokeDasharray="4 4"
          />
        ))}

      {/* 1. 准线 (统一定义 / 抛物线) */}
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

      {/* 2. 主轨迹曲线 (椭圆/双曲线/抛物线/动圆法理论轨迹) */}
      {pathD && (
        <path
          d={pathD}
          fill="none"
          stroke={
            studyMode === "locusGen"
              ? withAlpha(cPrimary, 0.75)
              : conicType === "ellipse"
                ? cPrimary
                : conicType === "hyperbola"
                  ? cSecondary
                  : cTertiary
          }
          strokeWidth={2.5}
          strokeDasharray={studyMode === "locusGen" ? "4 3" : "none"}
        />
      )}

      {/* 3. 动圆生成法辅助圆 (定圆 C1 与 动圆 M) */}
      {sceneData.auxiliaryCircles &&
        sceneData.auxiliaryCircles.map((circle, idx) => {
          const cDesign = mathToDesign(circle.center.x, circle.center.y, scale);
          const rPixel = circle.r * scale.scaleX;
          if (rPixel <= 0 || !isFinite(rPixel)) return null;
          return (
            <g key={`aux-circle-${idx}`}>
              <circle
                cx={cDesign.x}
                cy={cDesign.y}
                r={Math.abs(rPixel)}
                fill={idx === 1 ? withAlpha(cSecondary, 0.05) : "none"}
                stroke={
                  idx === 0
                    ? withAlpha(cPrimary, 0.5)
                    : withAlpha(cSecondary, 0.6)
                }
                strokeWidth={1.8}
                strokeDasharray={idx === 0 ? "none" : "5 4"}
              />
            </g>
          );
        })}

      {/* 4. 动圆生成法中垂线与辅助折线 */}
      {bisectorLineDesign && (
        <g>
          <line
            x1={bisectorLineDesign.x1}
            y1={bisectorLineDesign.y1}
            x2={bisectorLineDesign.x2}
            y2={bisectorLineDesign.y2}
            stroke={cTertiary}
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
        </g>
      )}

      {sceneData.auxiliarySegments &&
        sceneData.auxiliarySegments.map((seg, idx) => {
          const pt1 = mathToDesign(seg.p1.x, seg.p1.y, scale);
          const pt2 = mathToDesign(seg.p2.x, seg.p2.y, scale);
          const strokeCol =
            seg.colorKey === "paramPrimary"
              ? cPrimary
              : seg.colorKey === "paramSecondary"
                ? cSecondary
                : cTertiary;
          return (
            <line
              key={`aux-seg-${idx}`}
              x1={pt1.x}
              y1={pt1.y}
              x2={pt2.x}
              y2={pt2.y}
              stroke={strokeCol}
              strokeWidth={1.6}
              strokeDasharray={seg.dashed ? "4 3" : "none"}
            />
          );
        })}

      {/* 5. 焦半径线段 PF1 */}
      {f1Design && studyMode !== "locusGen" && (
        <line
          x1={pDesign.x}
          y1={pDesign.y}
          x2={f1Design.x}
          y2={f1Design.y}
          stroke={cPrimary}
          strokeWidth={2}
        />
      )}

      {/* 6. 焦半径线段 PF2 (如果有 F2 且非动圆法) */}
      {f2Design && studyMode !== "locusGen" && (
        <line
          x1={pDesign.x}
          y1={pDesign.y}
          x2={f2Design.x}
          y2={f2Design.y}
          stroke={cSecondary}
          strokeWidth={2}
        />
      )}

      {/* 7. 到准线垂线段 PH 及直角标尺 (统一定义 / 抛物线) */}
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

      {/* 8. 焦点与特征点绘制 (使用 MathPoint 纯数学点) */}
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
      {qDesign && (
        <MathPoint
          x={qDesign.x}
          y={qDesign.y}
          fontScale={fontScale}
          color={cSecondary}
          r={3.2}
        />
      )}
      {nDesign && (
        <MathPoint
          x={nDesign.x}
          y={nDesign.y}
          fontScale={fontScale}
          color={cTertiary}
          r={3.0}
        />
      )}

      {/* 9. 避让文本标注 (微描边保护，无白底框断线) */}
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

      {/* 10. 可拖拽主控制点 P / 动圆心 M */}
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
