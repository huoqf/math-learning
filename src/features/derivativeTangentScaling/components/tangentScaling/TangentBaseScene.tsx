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
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculateTangentLine, BASE_CURVE_MODELS } from "@/math/tangentScaling";
import type { BaseSubModel } from "@/data/registries/tangentScaling";
import { clipFn } from "./clipFn";
import type { TangentSceneBaseProps } from "./types";

interface TangentBaseSceneProps extends TangentSceneBaseProps {
  baseSubModel: BaseSubModel;
}

/** 模式 1：基准切线放缩（含数据解算 + 避让点标 + 渲染） */
export function TangentBaseScene({
  params,
  baseSubModel,
  scale,
  vp,
  fontScale,
  onParamChange,
}: TangentBaseSceneProps) {
  const baseData = useMemo(() => {
    const model = BASE_CURVE_MODELS[baseSubModel];
    const tangent = calculateTangentLine(model.funcType, params.x0);
    const tangentFn = (x: number) => tangent.slope * x + tangent.intercept;
    // 高考题设的基准放缩切线（与动切线同屏对照）
    const baseTangentFn = (x: number) =>
      model.baseTangent.slope * x + model.baseTangent.intercept;

    return {
      fn: model.fn,
      mainXRange: model.mainXRange,
      dragXRange: model.dragXRange,
      basePoint: model.basePoint,
      tangentFn,
      tangent,
      baseTangentFn,
    };
  }, [baseSubModel, params.x0]);

  // 智能避让点标收集
  const labelItems = useMemo<LabelItem[]>(() => {
    const items: LabelItem[] = [];
    const isAtBase =
      Math.abs(baseData.tangent.x0 - baseData.basePoint.x) <= 0.08;
    const p = mathToDesign(baseData.tangent.x0, baseData.tangent.y0, scale);
    items.push({
      key: "pt-base-tangent",
      x: p.x,
      y: p.y,
      // 切点回到基准位置（偏离 ≤ 0.08）时两点评级重合，
      // 合并标签表达"已回到基准切点"这一临界态，而不是静默隐藏 T₀
      text: isAtBase ? "P₀ = T₀" : "P₀",
      color: MATH_COLORS.paramPrimary,
      preferredPlacement: "top",
    });

    // 切点偏离基准切点时，单独呈现基准切点 T₀ 标签
    if (!isAtBase) {
      const ptBase = mathToDesign(
        baseData.basePoint.x,
        baseData.basePoint.y,
        scale,
      );
      items.push({
        key: "pt-base-target",
        x: ptBase.x,
        y: ptBase.y,
        text: "T₀",
        color: MATH_COLORS.line,
        preferredPlacement: "bottom-left",
      });
    }
    return items;
  }, [baseData, scale]);

  return (
    <>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 原函数曲线 */}
      <FunctionGraph
        fn={clipFn(baseData.fn, baseData.mainXRange)}
        scale={scale}
        color={MATH_COLORS.primary}
        strokeWidth={2.5}
      />
      {/* 高考基准放缩目标参考切线 (浅虚线) */}
      <FunctionGraph
        fn={clipFn(baseData.baseTangentFn, [-4, 5.0])}
        scale={scale}
        color={withAlpha(MATH_COLORS.line, 0.4)}
        strokeWidth={1.5}
        strokeDasharray="5 3"
      />
      {/* 基准切点 T_0 */}
      <MathPoint
        cx={baseData.basePoint.x}
        cy={baseData.basePoint.y}
        scale={scale}
        color={MATH_COLORS.line}
        fontScale={fontScale}
      />
      {/* 动切线 */}
      <FunctionGraph
        fn={clipFn(baseData.tangentFn, [-4, 5.0])}
        scale={scale}
        color={MATH_COLORS.paramPrimary}
        strokeWidth={1.8}
        strokeDasharray="4 3"
      />
      {/* 可拖拽切点 (严格对齐左屏滑块安全范围) */}
      <InteractivePoint
        snapTo={baseData.fn}
        xRange={baseData.dragXRange}
        cx={baseData.tangent.x0}
        cy={baseData.tangent.y0}
        scale={scale}
        vp={vp}
        color={MATH_COLORS.paramPrimary}
        fontScale={fontScale}
        onChangeX={(x) => onParamChange("x0", x)}
      />

      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </>
  );
}
