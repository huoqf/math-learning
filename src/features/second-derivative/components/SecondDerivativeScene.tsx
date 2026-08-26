/**
 * src/features/second-derivative/components/SecondDerivativeScene.tsx
 * 二阶导数、拐点与凹凸性纯 SVG 渲染组件
 * 全量接入 resolveLabelPlacements 智能多方向标签避让算法
 */

import React, { useCallback, useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  SceneLabelGroup,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { LabelItem } from "@/utils/labelOverlap";
import {
  evalFunction,
  findInflectionPoints,
  findExtremaPoints,
  evalJensen,
  type FnKey,
  type SecondDerivativeParams,
} from "@/math/secondDerivative";

interface SecondDerivativeSceneProps {
  params: SecondDerivativeParams;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode?: "concavity" | "inflection" | "jensen";
  fnKey?: FnKey;
}

export const SecondDerivativeScene: React.FC<SecondDerivativeSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "concavity",
  fnKey = "cubic",
}) => {
  const { x0, x1, x2 } = params;

  // 1. 原函数求值回调
  const fn = useCallback(
    (x: number) => evalFunction(fnKey, params, x).y,
    [fnKey, params],
  );

  // 2. 探针点 (x0, f(x0)) 计算
  const eval0 = useMemo(
    () => evalFunction(fnKey, params, x0),
    [fnKey, params, x0],
  );
  const pt0 = mathToDesign(x0, eval0.y, scale);

  // 3. 拐点与极值点求解
  const inflections = useMemo(
    () => findInflectionPoints(fnKey, params),
    [fnKey, params],
  );
  const extrema = useMemo(
    () => findExtremaPoints(fnKey, params),
    [fnKey, params],
  );

  // 4. 琴生不等式中点与割线计算
  const jensen = useMemo(
    () => evalJensen(fnKey, params, x1, x2),
    [fnKey, params, x1, x2],
  );

  // 5. 拖拽处理器
  const handleX0Drag = useCallback(
    (mathPos: { x: number; y: number }) => {
      const clampedX = Math.max(scale.xMin, Math.min(scale.xMax, mathPos.x));
      onParamChange("x0", Number(clampedX.toFixed(2)));
    },
    [scale, onParamChange],
  );

  const handleX1Drag = useCallback(
    (mathPos: { x: number; y: number }) => {
      const clampedX = Math.max(scale.xMin, Math.min(x2 - 0.2, mathPos.x));
      onParamChange("x1", Number(clampedX.toFixed(2)));
    },
    [scale, x2, onParamChange],
  );

  const handleX2Drag = useCallback(
    (mathPos: { x: number; y: number }) => {
      const clampedX = Math.min(scale.xMax, Math.max(x1 + 0.2, mathPos.x));
      onParamChange("x2", Number(clampedX.toFixed(2)));
    },
    [scale, x1, onParamChange],
  );

  // 6. 切线两端点计算
  const tangentSegment = useMemo(() => {
    const k = eval0.dy;
    const xLeft = scale.xMin;
    const yLeft = eval0.y + k * (xLeft - x0);
    const xRight = scale.xMax;
    const yRight = eval0.y + k * (xRight - x0);

    const pLeft = mathToDesign(xLeft, yLeft, scale);
    const pRight = mathToDesign(xRight, yRight, scale);
    return { pLeft, pRight };
  }, [eval0.dy, eval0.y, x0, scale]);

  // 7. 凹凸区域背景高亮
  const concavityRegions = useMemo(() => {
    const steps = 60;
    const dx = (scale.xMax - scale.xMin) / steps;
    const regions: Array<{
      xStart: number;
      xEnd: number;
      type: "concaveUp" | "concaveDown";
    }> = [];

    let curType: "concaveUp" | "concaveDown" | "flat" = "flat";
    let curStart = scale.xMin;

    for (let i = 0; i <= steps; i++) {
      const x = scale.xMin + i * dx;
      const res = evalFunction(fnKey, params, x);
      if (i === 0) {
        curType = res.concavity;
        curStart = x;
      } else if (res.concavity !== curType) {
        if (curType !== "flat") {
          regions.push({ xStart: curStart, xEnd: x, type: curType });
        }
        curType = res.concavity;
        curStart = x;
      }
    }
    if (curType !== "flat" && curStart < scale.xMax) {
      regions.push({ xStart: curStart, xEnd: scale.xMax, type: curType });
    }
    return regions;
  }, [fnKey, params, scale]);

  // 割线端点与中点的屏幕像素点
  const ptJ1 = mathToDesign(jensen.x1, jensen.y1, scale);
  const ptJ2 = mathToDesign(jensen.x2, jensen.y2, scale);
  const ptJChordMid = mathToDesign(jensen.xMid, jensen.yChordMid, scale);
  const ptJCurveMid = mathToDesign(jensen.xMid, jensen.yCurveMid, scale);

  // 8. 智能多方向学术标签避让解算
  const modeLabels = useMemo(() => {
    if (studyMode === "concavity") {
      const items: LabelItem[] = [
        {
          key: "p0",
          x: pt0.x,
          y: pt0.y,
          text: "P₀",
          color: MATH_COLORS.paramPrimary,
          fontSize: fontScale(13),
          preferredPlacement: "top-right",
        },
      ];
      return items;
    } else if (studyMode === "inflection") {
      const items: LabelItem[] = [
        {
          key: "p0",
          x: pt0.x,
          y: pt0.y,
          text: "P₀",
          color: MATH_COLORS.paramPrimary,
          fontSize: fontScale(12),
          preferredPlacement: "top-right",
        },
      ];
      inflections.forEach((ip, idx) => {
        const pt = mathToDesign(ip.x, ip.y, scale);
        items.push({
          key: `inflection-${idx}`,
          x: pt.x,
          y: pt.y,
          text: inflections.length > 1 ? `I${idx + 1}` : "I",
          color: MATH_COLORS.vectorResult,
          fontSize: fontScale(12),
          preferredPlacement: "top-left",
        });
      });
      extrema.forEach((ext, idx) => {
        const pt = mathToDesign(ext.x, ext.y, scale);
        items.push({
          key: `extrema-${idx}`,
          x: pt.x,
          y: pt.y,
          text: extrema.length > 1 ? `E${idx + 1}` : "E",
          color: MATH_COLORS.paramSecondary,
          fontSize: fontScale(12),
          preferredPlacement: "bottom-right",
        });
      });
      return items;
    } else {
      const items: LabelItem[] = [
        {
          key: "s1",
          x: ptJ1.x,
          y: ptJ1.y,
          text: "S₁",
          color: MATH_COLORS.paramSecondary,
          fontSize: fontScale(12),
          preferredPlacement: "top-left",
        },
        {
          key: "s2",
          x: ptJ2.x,
          y: ptJ2.y,
          text: "S₂",
          color: MATH_COLORS.paramTertiary,
          fontSize: fontScale(12),
          preferredPlacement: "top-right",
        },
        {
          key: "m",
          x: ptJChordMid.x,
          y: ptJChordMid.y,
          text: "M",
          color: MATH_COLORS.paramSecondary,
          fontSize: fontScale(12),
          preferredPlacement: "top",
        },
        {
          key: "p",
          x: ptJCurveMid.x,
          y: ptJCurveMid.y,
          text: "P",
          color: MATH_COLORS.paramTertiary,
          fontSize: fontScale(12),
          preferredPlacement: "bottom",
        },
      ];
      return items;
    }
  }, [
    studyMode,
    pt0,
    ptJ1,
    ptJ2,
    ptJChordMid,
    ptJCurveMid,
    inflections,
    extrema,
    scale,
    fontScale,
  ]);

  return (
    <g>
      {/* 坐标轴与背景网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 凹凸性模式下的背景区域高亮（下凸:蓝色, 上凸:浅红） */}
      {studyMode === "concavity" &&
        concavityRegions.map((reg, idx) => {
          const p1 = mathToDesign(reg.xStart, scale.yMax, scale);
          const p2 = mathToDesign(reg.xEnd, scale.yMin, scale);
          const width = Math.max(1, Math.abs(p2.x - p1.x));
          const height = Math.abs(p2.y - p1.y);
          const color =
            reg.type === "concaveUp"
              ? withAlpha(MATH_COLORS.function, 0.06)
              : withAlpha(MATH_COLORS.paramPrimary, 0.06);

          return (
            <rect
              key={`region-${idx}`}
              x={Math.min(p1.x, p2.x)}
              y={Math.min(p1.y, p2.y)}
              width={width}
              height={height}
              fill={color}
              className="pointer-events-none"
            />
          );
        })}

      {/* 原函数曲线 */}
      <FunctionGraph
        fn={fn}
        scale={scale}
        color={MATH_COLORS.function}
        strokeWidth={2.8}
      />

      {/* 拐点与其切线渲染 */}
      {inflections.map((ip, idx) => {
        const resIp = evalFunction(fnKey, params, ip.x);
        const kIp = resIp.dy;
        const pIpLeft = mathToDesign(
          scale.xMin,
          ip.y + kIp * (scale.xMin - ip.x),
          scale,
        );
        const pIpRight = mathToDesign(
          scale.xMax,
          ip.y + kIp * (scale.xMax - ip.x),
          scale,
        );

        return (
          <g key={`inflection-${idx}`}>
            {/* 拐点切线 */}
            <line
              x1={pIpLeft.x}
              y1={pIpLeft.y}
              x2={pIpRight.x}
              y2={pIpRight.y}
              stroke={MATH_COLORS.vectorResult}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              strokeOpacity={0.8}
            />
            {/* 拐点标准学术点标 */}
            <MathPoint
              cx={ip.x}
              cy={ip.y}
              scale={scale}
              color={MATH_COLORS.vectorResult}
              fontScale={fontScale}
            />
          </g>
        );
      })}

      {/* 极值点渲染 */}
      {studyMode === "inflection" &&
        extrema.map((ext, idx) => (
          <MathPoint
            key={`extrema-${idx}`}
            cx={ext.x}
            cy={ext.y}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
          />
        ))}

      {/* 凹凸性探针切线 */}
      {studyMode === "concavity" && (
        <line
          x1={tangentSegment.pLeft.x}
          y1={tangentSegment.pLeft.y}
          x2={tangentSegment.pRight.x}
          y2={tangentSegment.pRight.y}
          stroke={MATH_COLORS.tangentLine}
          strokeWidth={2}
          strokeOpacity={0.9}
        />
      )}

      {/* 探针可拖拽控制点 */}
      {studyMode === "concavity" && (
        <InteractivePoint
          cx={x0}
          cy={eval0.y}
          scale={scale}
          vp={vp}
          onDrag={handleX0Drag}
          color={MATH_COLORS.paramPrimary}
          r={6}
          fontScale={fontScale}
        />
      )}

      {/* 琴生不等式模式渲染 */}
      {studyMode === "jensen" && (
        <g>
          {/* 割线段 S1 -> S2 */}
          <line
            x1={ptJ1.x}
            y1={ptJ1.y}
            x2={ptJ2.x}
            y2={ptJ2.y}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
          />
          {/* 垂直连接线 (弦中点 -> 弧中点) */}
          <line
            x1={ptJChordMid.x}
            y1={ptJChordMid.y}
            x2={ptJCurveMid.x}
            y2={ptJCurveMid.y}
            stroke={MATH_COLORS.vectorResult}
            strokeWidth={2}
            strokeDasharray="3 3"
          />

          {/* 割线中点 M */}
          <MathPoint
            cx={jensen.xMid}
            cy={jensen.yChordMid}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
          />

          {/* 曲线上中点 P */}
          <MathPoint
            cx={jensen.xMid}
            cy={jensen.yCurveMid}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            fontScale={fontScale}
          />

          {/* 琴生端点 S1 与 S2 探针 */}
          <InteractivePoint
            cx={x1}
            cy={jensen.y1}
            scale={scale}
            vp={vp}
            onDrag={handleX1Drag}
            color={MATH_COLORS.paramSecondary}
            r={6}
            fontScale={fontScale}
          />

          <InteractivePoint
            cx={x2}
            cy={jensen.y2}
            scale={scale}
            vp={vp}
            onDrag={handleX2Drag}
            color={MATH_COLORS.paramTertiary}
            r={6}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ─── 统一智能避让图层：纯净学术点标渲染 ─── */}
      <SceneLabelGroup items={modeLabels} fontScale={fontScale} />
    </g>
  );
};
