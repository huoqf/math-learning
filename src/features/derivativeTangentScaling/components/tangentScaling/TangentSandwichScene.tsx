import { useMemo } from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  MathPoint,
  InteractivePoint,
  SceneLabelGroup,
} from "@/components/Math";
import type { LabelItem } from "@/utils/labelOverlap";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS } from "@/theme";
import { SANDWICH_CURVE_MODELS } from "@/math/tangentScaling";
import type { SandwichSubModel } from "@/data/registries/tangentScaling";
import { clipFn } from "./clipFn";
import type { TangentSceneBaseProps } from "./types";

interface TangentSandwichSceneProps extends TangentSceneBaseProps {
  sandwichSubModel: SandwichSubModel;
}

/** 模式 2：双切线公切与平行卡位（含数据解算 + 避让点标 + 渲染） */
export function TangentSandwichScene({
  params,
  sandwichSubModel,
  scale,
  vp,
  fontScale,
  activeStep = 0,
  onParamChange,
}: TangentSandwichSceneProps) {
  const regionOpacity = (r: number) =>
    !activeStep ? 1 : activeStep === r ? 1 : 0.3;
  const model = SANDWICH_CURVE_MODELS[sandwichSubModel];
  const evalX = params.evalX;

  // 智能避让点标收集
  const labelItems = useMemo<LabelItem[]>(() => {
    const items: LabelItem[] = [];
    const isBand = model.featurePoints.length > 1;
    for (const [index, point] of model.featurePoints.entries()) {
      /* 公切点落在原点时不再自绘 O 点标：CoordinateGrid 已在原点给出标准原点标识，
         再标一个 O 会让画布上出现两个 O；该情形只保留网格的 O，不另加点标。
         公切点在 (1,1) 与非原点的平行切点情形照旧标注。 */
      if (point.x === 0 && point.y === 0) continue;
      const p = mathToDesign(point.x, point.y, scale);
      items.push({
        key: `pt-feature-${index}`,
        x: p.x,
        y: p.y,
        text: isBand ? (index === 0 ? "T₁" : "T₂") : "T",
        color: isBand
          ? index === 0
            ? MATH_COLORS.primary
            : MATH_COLORS.secondary
          : MATH_COLORS.paramTertiary,
        preferredPlacement: isBand && index === 0 ? "top-left" : "bottom-right",
      });
    }

    // 观察点垂直连线上下交点 P₁, P₂
    const pUp = mathToDesign(evalX, model.upperFn(evalX), scale);
    const pLow = mathToDesign(evalX, model.lowerFn(evalX), scale);
    items.push(
      {
        key: "pt-eval-up",
        x: pUp.x,
        y: pUp.y,
        text: "P₁",
        color: MATH_COLORS.primary,
        preferredPlacement: "top",
      },
      {
        key: "pt-eval-low",
        x: pLow.x,
        y: pLow.y,
        text: "P₂",
        color: MATH_COLORS.secondary,
        preferredPlacement: "bottom",
      },
    );

    return items;
  }, [model, evalX, scale]);

  const yUp = model.upperFn(evalX);
  const yLow = model.lowerFn(evalX);
  const pUp = mathToDesign(evalX, yUp, scale);
  const pLow = mathToDesign(evalX, yLow, scale);

  const clampFrame = (x: number, y: number, w: number, h: number) => {
    const pad = 10;
    const minX = vp.designLeft + pad;
    const maxX = vp.designLeft + vp.designVisibleW - w - pad;
    const minY = vp.designTop + pad;
    const maxY = vp.designTop + vp.designVisibleH - h - pad;
    const cx = Math.max(minX, Math.min(x, Math.max(minX, maxX)));
    const cy = Math.max(minY, Math.min(y, Math.max(minY, maxY)));
    return { x: cx, y: cy, width: w, height: h };
  };

  const stepFrame = (() => {
    if (!activeStep) return null;
    if (activeStep === 1) {
      return clampFrame(
        vp.designLeft + 24,
        vp.designTop + 20,
        vp.designVisibleW - 48,
        vp.designVisibleH - 40,
      );
    }
    if (activeStep === 2) {
      return clampFrame(
        pUp.x - 130,
        Math.min(pUp.y, pLow.y) - 30,
        260,
        Math.max(150, Math.abs(pLow.y - pUp.y) + 60 || 160),
      );
    }
    const pts = model.featurePoints.map((pt) =>
      mathToDesign(pt.x, pt.y, scale),
    );
    const minX = Math.min(...pts.map((p) => p.x)) - 85;
    const maxX = Math.max(...pts.map((p) => p.x)) + 85;
    const minY = Math.min(...pts.map((p) => p.y)) - 75;
    const maxY = Math.max(...pts.map((p) => p.y)) + 75;
    return clampFrame(
      minX,
      minY,
      Math.max(180, maxX - minX),
      Math.max(150, maxY - minY),
    );
  })();

  return (
    <>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 第 1 步：两曲线与切线放缩基准轮廓 */}
      <g data-step-region={1} opacity={regionOpacity(1)}>
        <FunctionGraph
          fn={clipFn(model.upperFn, model.upperXRange)}
          scale={scale}
          color={MATH_COLORS.primary}
          strokeWidth={2.5}
        />
        <FunctionGraph
          fn={clipFn(model.lowerFn, model.lowerXRange)}
          scale={scale}
          color={MATH_COLORS.secondary}
          strokeWidth={2.5}
        />
        {model.upperLineFn ? (
          <>
            <FunctionGraph
              fn={clipFn(model.upperLineFn!, [-4, 5.0])}
              scale={scale}
              color={MATH_COLORS.primary}
              strokeWidth={1.8}
              strokeDasharray="4 3"
            />
            <FunctionGraph
              fn={clipFn(model.lowerLineFn!, [-4, 5.0])}
              scale={scale}
              color={MATH_COLORS.secondary}
              strokeWidth={1.8}
              strokeDasharray="4 3"
            />
          </>
        ) : (
          <FunctionGraph
            fn={clipFn(model.middleLineFn!, [-4, 5.0])}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={2}
          />
        )}
      </g>

      {/* 第 2 步：观察点纵向差值与双向卡位验证 */}
      <g data-step-region={2} opacity={regionOpacity(2)}>
        <line
          x1={pUp.x}
          y1={pUp.y}
          x2={pLow.x}
          y2={pLow.y}
          stroke={MATH_COLORS.accent}
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        <MathPoint
          cx={evalX}
          cy={yUp}
          scale={scale}
          color={MATH_COLORS.primary}
          fontScale={fontScale}
        />
        <MathPoint
          cx={evalX}
          cy={yLow}
          scale={scale}
          color={MATH_COLORS.secondary}
          fontScale={fontScale}
        />
        <InteractivePoint
          axis="x"
          xRange={model.probeXRange}
          cx={evalX}
          cy={(yUp + yLow) / 2}
          scale={scale}
          vp={vp}
          color={MATH_COLORS.paramPrimary}
          fontScale={fontScale}
          onChangeX={(x) => onParamChange("evalX", x)}
        />
      </g>

      {/* 第 3 步：切点取等是否同步临界检验 */}
      <g data-step-region={3} opacity={regionOpacity(3)}>
        {model.upperLineFn ? (
          <>
            <MathPoint
              cx={model.featurePoints[0].x}
              cy={model.featurePoints[0].y}
              scale={scale}
              color={MATH_COLORS.primary}
              fontScale={fontScale}
            />
            <MathPoint
              cx={model.featurePoints[1].x}
              cy={model.featurePoints[1].y}
              scale={scale}
              color={MATH_COLORS.secondary}
              fontScale={fontScale}
            />
          </>
        ) : (
          <MathPoint
            cx={model.featurePoints[0].x}
            cy={model.featurePoints[0].y}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            fontScale={fontScale}
          />
        )}
      </g>

      {stepFrame && (
        <rect
          x={stepFrame.x}
          y={stepFrame.y}
          width={stepFrame.width}
          height={stepFrame.height}
          rx={8}
          fill="none"
          stroke={MATH_COLORS.answerStepFrame}
          strokeWidth={2}
          strokeDasharray="7 4"
          className="pointer-events-none"
        />
      )}

      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </>
  );
}
