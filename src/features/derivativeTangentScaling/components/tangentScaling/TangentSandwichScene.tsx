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
  const sandwichData = useMemo(() => {
    if (sandwichSubModel === "parallel_bands") {
      return {
        upperFn: (x: number) => Math.exp(x),
        lowerFn: (x: number) => (x > 0.01 ? Math.log(x) : -10),
        upperLineFn: (x: number) => x + 1,
        lowerLineFn: (x: number) => x - 1,
        upperXRange: [-4, 3.0] as [number, number],
        lowerXRange: [0.02, 5.0] as [number, number],
      };
    }

    if (sandwichSubModel === "origin_sandwich") {
      return {
        upperFn: (x: number) => Math.exp(x) - 1,
        lowerFn: (x: number) => (x > -0.99 ? Math.log(x + 1) : -10),
        middleLineFn: (x: number) => x,
        upperXRange: [-4, 3.0] as [number, number],
        lowerXRange: [-0.98, 5.0] as [number, number],
      };
    }

    // 默认 common_tangent: e^(x-1) >= x >= ln x + 1
    return {
      upperFn: (x: number) => Math.exp(x - 1),
      lowerFn: (x: number) => (x > 0.01 ? Math.log(x) + 1 : -10),
      middleLineFn: (x: number) => x,
      upperXRange: [-4, 3.5] as [number, number],
      lowerXRange: [0.02, 5.0] as [number, number],
    };
  }, [sandwichSubModel]);

  const evalX = params.evalX;

  // 智能避让点标收集
  const labelItems = useMemo<LabelItem[]>(() => {
    const items: LabelItem[] = [];
    if (sandwichSubModel === "parallel_bands") {
      const p1 = mathToDesign(0, 1, scale);
      const p2 = mathToDesign(1, 0, scale);
      items.push(
        {
          key: "pt-band-1",
          x: p1.x,
          y: p1.y,
          text: "T_1",
          color: MATH_COLORS.primary,
          preferredPlacement: "top-left",
        },
        {
          key: "pt-band-2",
          x: p2.x,
          y: p2.y,
          text: "T_2",
          color: MATH_COLORS.secondary,
          preferredPlacement: "bottom-right",
        },
      );
    } else {
      const isOrigin = sandwichSubModel === "origin_sandwich";
      const ptCommon = mathToDesign(isOrigin ? 0 : 1, isOrigin ? 0 : 1, scale);
      items.push({
        key: "pt-common-tangent",
        x: ptCommon.x,
        y: ptCommon.y,
        text: isOrigin ? "O" : "T",
        color: MATH_COLORS.paramTertiary,
        preferredPlacement: "bottom-right",
      });
    }

    // 观察点垂直连线上下交点 P_1, P_2
    const pUp = mathToDesign(evalX, sandwichData.upperFn(evalX), scale);
    const pLow = mathToDesign(evalX, sandwichData.lowerFn(evalX), scale);
    items.push(
      {
        key: "pt-eval-up",
        x: pUp.x,
        y: pUp.y,
        text: "P_1",
        color: MATH_COLORS.primary,
        preferredPlacement: "top",
      },
      {
        key: "pt-eval-low",
        x: pLow.x,
        y: pLow.y,
        text: "P_2",
        color: MATH_COLORS.secondary,
        preferredPlacement: "bottom",
      },
    );

    return items;
  }, [sandwichSubModel, sandwichData, evalX, scale]);

  const yUp = sandwichData.upperFn(evalX);
  const yLow = sandwichData.lowerFn(evalX);
  const pUp = mathToDesign(evalX, yUp, scale);
  const pLow = mathToDesign(evalX, yLow, scale);

  return (
    <>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 上函数曲线 */}
      <FunctionGraph
        fn={clipFn(sandwichData.upperFn, sandwichData.upperXRange)}
        scale={scale}
        color={MATH_COLORS.primary}
        strokeWidth={2.5}
      />
      {/* 下函数曲线 */}
      <FunctionGraph
        fn={clipFn(sandwichData.lowerFn, sandwichData.lowerXRange)}
        scale={scale}
        color={MATH_COLORS.secondary}
        strokeWidth={2.5}
      />

      {sandwichSubModel === "parallel_bands" ? (
        <>
          {/* 平行切线 y = x + 1 */}
          <FunctionGraph
            fn={clipFn(sandwichData.upperLineFn!, [-4, 5.0])}
            scale={scale}
            color={MATH_COLORS.primary}
            strokeWidth={1.8}
            strokeDasharray="4 3"
          />
          {/* 平行切线 y = x - 1 */}
          <FunctionGraph
            fn={clipFn(sandwichData.lowerLineFn!, [-4, 5.0])}
            scale={scale}
            color={MATH_COLORS.secondary}
            strokeWidth={1.8}
            strokeDasharray="4 3"
          />
          {/* 两个特征切点 (0,1) 与 (1,0) */}
          <MathPoint
            cx={0}
            cy={1}
            scale={scale}
            color={MATH_COLORS.primary}
            fontScale={fontScale}
          />
          <MathPoint
            cx={1}
            cy={0}
            scale={scale}
            color={MATH_COLORS.secondary}
            fontScale={fontScale}
          />
        </>
      ) : (
        <>
          {/* 中间公切线 y = x */}
          <FunctionGraph
            fn={clipFn(sandwichData.middleLineFn!, [-4, 5.0])}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={2}
          />
          {/* 公切点 */}
          <MathPoint
            cx={sandwichSubModel === "origin_sandwich" ? 0 : 1}
            cy={sandwichSubModel === "origin_sandwich" ? 0 : 1}
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
          xRange={[sandwichSubModel === "origin_sandwich" ? -0.7 : 0.2, 3.5]}
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
