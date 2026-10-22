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
  onParamChange,
}: TangentSandwichSceneProps) {
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

  return (
    <>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 上函数曲线 */}
      <FunctionGraph
        fn={clipFn(model.upperFn, model.upperXRange)}
        scale={scale}
        color={MATH_COLORS.primary}
        strokeWidth={2.5}
      />
      {/* 下函数曲线 */}
      <FunctionGraph
        fn={clipFn(model.lowerFn, model.lowerXRange)}
        scale={scale}
        color={MATH_COLORS.secondary}
        strokeWidth={2.5}
      />

      {model.upperLineFn ? (
        <>
          {/* 平行切线 y = x + 1 */}
          <FunctionGraph
            fn={clipFn(model.upperLineFn!, [-4, 5.0])}
            scale={scale}
            color={MATH_COLORS.primary}
            strokeWidth={1.8}
            strokeDasharray="4 3"
          />
          {/* 平行切线 y = x - 1 */}
          <FunctionGraph
            fn={clipFn(model.lowerLineFn!, [-4, 5.0])}
            scale={scale}
            color={MATH_COLORS.secondary}
            strokeWidth={1.8}
            strokeDasharray="4 3"
          />
          {/* 两个特征切点 (0,1) 与 (1,0) */}
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
        <>
          {/* 中间公切线 y = x */}
          <FunctionGraph
            fn={clipFn(model.middleLineFn!, [-4, 5.0])}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={2}
          />
          {/* 公切点 */}
          <MathPoint
            cx={model.featurePoints[0].x}
            cy={model.featurePoints[0].y}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            fontScale={fontScale}
          />
        </>
      )}

      {/* 观察点垂直连线指示与端点 */}
      <g>
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

      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </>
  );
}
