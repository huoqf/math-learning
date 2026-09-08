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
import { calculateTangentLine } from "@/math/tangentScaling";
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
    let funcType: "exp" | "log" | "exp_shift" | "log_shift" = "exp";
    let fn = (x: number) => Math.exp(x);
    let xRange: [number, number] = [-4, 3.0];

    if (baseSubModel === "exp_shift_x") {
      funcType = "exp_shift";
      fn = (x: number) => Math.exp(x - 1);
      xRange = [-4, 3.5];
    } else if (baseSubModel === "exp_ex") {
      funcType = "exp";
      fn = (x: number) => Math.exp(x);
      xRange = [-4, 3.0];
    } else if (
      baseSubModel === "log_x_minus_1" ||
      baseSubModel === "log_x_div_e"
    ) {
      funcType = "log";
      fn = (x: number) => (x > 0.01 ? Math.log(x) : -10);
      xRange = [0.02, 5.0];
    } else if (baseSubModel === "log_shift_0") {
      funcType = "log_shift";
      fn = (x: number) => (x > -0.99 ? Math.log(x + 1) : -10);
      xRange = [-0.98, 5.0];
    }

    const tangent = calculateTangentLine(funcType, params.x0);
    const tangentFn = (x: number) => tangent.slope * x + tangent.intercept;

    // 高考题设基准切线与基准切点
    let baseX0 = 0;
    let baseY0 = 1;
    let baseSlope = 1;
    let baseIntercept = 1;
    if (baseSubModel === "exp_shift_x") {
      baseX0 = 1;
      baseY0 = 1;
      baseSlope = 1;
      baseIntercept = 0; // y = x
    } else if (baseSubModel === "exp_ex") {
      baseX0 = 1;
      baseY0 = Math.E;
      baseSlope = Math.E;
      baseIntercept = 0; // y = ex
    } else if (baseSubModel === "log_x_minus_1") {
      baseX0 = 1;
      baseY0 = 0;
      baseSlope = 1;
      baseIntercept = -1; // y = x - 1
    } else if (baseSubModel === "log_shift_0") {
      baseX0 = 0;
      baseY0 = 0;
      baseSlope = 1;
      baseIntercept = 0; // y = x
    } else if (baseSubModel === "log_x_div_e") {
      baseX0 = Math.E;
      baseY0 = 1;
      baseSlope = 1 / Math.E;
      baseIntercept = 0; // y = (1/e)x
    }
    const baseTangentFn = (x: number) => baseSlope * x + baseIntercept;

    return { fn, tangentFn, tangent, baseTangentFn, baseX0, baseY0, xRange };
  }, [baseSubModel, params.x0]);

  // 智能避让点标收集
  const labelItems = useMemo<LabelItem[]>(() => {
    const items: LabelItem[] = [];
    const p = mathToDesign(baseData.tangent.x0, baseData.tangent.y0, scale);
    items.push({
      key: "pt-base-tangent",
      x: p.x,
      y: p.y,
      text: "P_0",
      color: MATH_COLORS.paramPrimary,
      preferredPlacement: "top",
    });

    // 当切点偏离基准切点时，呈现基准切点 T_0
    if (Math.abs(baseData.tangent.x0 - baseData.baseX0) > 0.08) {
      const ptBase = mathToDesign(baseData.baseX0, baseData.baseY0, scale);
      items.push({
        key: "pt-base-target",
        x: ptBase.x,
        y: ptBase.y,
        text: "T_0",
        color: MATH_COLORS.line,
        preferredPlacement: "bottom-left",
      });
    }
    return items;
  }, [baseData, scale]);

  // 可拖拽切点安全范围（严格对齐左屏滑块）
  let minX = -2.0;
  let maxX = 2.0;
  if (baseSubModel === "log_x_minus_1") {
    minX = 0.2;
    maxX = 4.0;
  } else if (baseSubModel === "log_x_div_e") {
    minX = 0.5;
    maxX = 4.5;
  } else if (baseSubModel === "log_shift_0") {
    minX = -0.8;
    maxX = 3.5;
  } else if (baseSubModel === "exp_shift_x" || baseSubModel === "exp_ex") {
    minX = -1.5;
    maxX = 2.8;
  }

  return (
    <>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 原函数曲线 */}
      <FunctionGraph
        fn={clipFn(baseData.fn, baseData.xRange)}
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
        cx={baseData.baseX0}
        cy={baseData.baseY0}
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
        xRange={[minX, maxX]}
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
