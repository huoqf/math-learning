/**
 * 导数四则运算法则实验室页面总控
 * 组装 ThreePanel, LeftPanel, TabSwitcher, ParamControl, TipCard, MathPanel
 */
import React, { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  TabSwitcher,
  ParamControl,
  TipCard,
  LeftPanel,
  MathPanel,
} from "@/components/UI";
import { SceneLegend } from "@/components/Math";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { getOperationsLegendItems } from "./scenePalette";
import { DerivativeOperationsScene } from "./components/DerivativeOperationsScene";
import {
  defaultDerivativeOperationsParams,
  derivativeOperationsParamMeta,
} from "@/data/registries/derivativeOperations";
import { buildMathQuantities } from "@/data/mathQuantities";
import type { OperationType } from "@/math/derivativeOperations";

const OP_TABS = [
  { key: "multiply", label: "积法则 [fg]'" },
  { key: "divide", label: "商法则 [f/g]'" },
  { key: "add", label: "和法则 [f+g]'" },
  { key: "subtract", label: "差法则 [f-g]'" },
];

export const DerivativeOperationsAnimation: React.FC = () => {
  const [opType, setOpType] = useState<OperationType>("multiply");
  const [params, setParams] = useState<Record<string, number>>(
    defaultDerivativeOperationsParams,
  );

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const [xRange, yRange] = useMemo((): [[number, number], [number, number]] => {
    switch (opType) {
      case "multiply":
        return [
          [-1.0, 3.5],
          [-2.0, 4.0],
        ];
      case "divide":
        return [
          [-0.5, 3.5],
          [-2.5, 4.0],
        ];
      default:
        return [
          [-1.5, 3.5],
          [-2.0, 4.5],
        ];
    }
  }, [opType]);

  const scale = useSceneScale({
    vp,
    xRange,
    yRange,
  });

  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setOpType(key as OperationType);
  }, []);

  const mathPanelData = useMemo(() => {
    return buildMathQuantities("anim-derivative-operations", params, {
      opType,
    });
  }, [params, opType]);

  const tipCardContent = useMemo(() => {
    switch (opType) {
      case "multiply":
        return {
          background:
            "微积分基础理论：乘积函数的瞬时变化率对应于二维矩形两边同时产生微小增量时的面积膨胀率。",
          condition: `设基函数 $f(x) = x$ 与 $g(x) = \\sin x$，复合乘积函数 $H(x) = x\\sin x$。当前探究点 $x_0 = ${(params.x0 ?? 1.2).toFixed(1)}$，自变量增量 $\\Delta x = ${(params.deltaX ?? 0.3).toFixed(2)}$。`,
          question:
            "为什么积法则不是直觉上的 $f'(x)g'(x)$，而是包含两项交叉相加 $f'(x)g(x) + f(x)g'(x)$？高阶增量小项为何在极限下消失？",
        };
      case "divide":
        return {
          background:
            "分式函数变化率模型：商函数导数广泛应用于平均成本、相对增长率与正切函数求导推导。",
          condition: `设基函数 $f(x) = x$ 与 $g(x) = \\sin x$（要求 $g(x) \\neq 0$），商函数 $H(x) = \\frac{x}{\\sin x}$。当前探究点 $x_0 = ${(params.x0 ?? 1.2).toFixed(1)}$。`,
          question:
            "把 $x_0$ 拖到 $0$ 观察分母 $g(0) = 0$ 时会发生什么；再回到 $x_0 > 0$，说明为什么分子必须是 $f'g - fg'$ 而不能颠倒？",
        };
      case "add":
        return {
          background:
            "线性叠加原理：物理合速度与多力做功对应于函数和的导数，各分量变化率直接相加。",
          condition: `设基函数 $f(x) = x$ 与 $g(x) = \\sin x$，和函数 $H(x) = x + \\sin x$。当前探究点 $x_0 = ${(params.x0 ?? 1.2).toFixed(1)}$。`,
          question:
            "根据导数极限定义，求证和函数的瞬时切线斜率恰好等于两基函数在同一点切线斜率的代数和。",
        };
      case "subtract":
        return {
          background:
            "差函数与误差分析模型：高考导数压轴题常通过构造差函数 $H(x) = f(x) - g(x)$ 来研究两曲线的相对位置关系。",
          condition: `设基函数 $f(x) = x$ 与 $g(x) = \\sin x$，差函数 $H(x) = x - \\sin x$。当前探究点 $x_0 = ${(params.x0 ?? 1.2).toFixed(1)}$。`,
          question:
            "求证当 $x > 0$ 时 $H'(x) = 1 - \\cos x \\ge 0$，由此证明不等式 $x > \\sin x$ 在第一象限恒成立。",
        };
    }
  }, [opType, params]);

  const paramConfigs = useMemo((): ParamConfig[] => {
    return [
      {
        key: "x0",
        label: derivativeOperationsParamMeta.x0.label,
        value: params.x0 ?? 1.2,
        min: derivativeOperationsParamMeta.x0.min,
        max: derivativeOperationsParamMeta.x0.max,
        step: derivativeOperationsParamMeta.x0.step,
      },
      {
        key: "deltaX",
        label: derivativeOperationsParamMeta.deltaX.label,
        value: params.deltaX ?? 0.3,
        min: derivativeOperationsParamMeta.deltaX.min,
        max: derivativeOperationsParamMeta.deltaX.max,
        step: derivativeOperationsParamMeta.deltaX.step,
      },
    ];
  }, [params]);

  const leftPanelContent = (
    <LeftPanel>
      <TabSwitcher tabs={OP_TABS} value={opType} onChange={handleTabChange} />

      <div className="space-y-4 pt-2">
        <ParamControl params={paramConfigs} onParamChange={handleParamChange} />

        <TipCard
          background={tipCardContent.background}
          condition={tipCardContent.condition}
          question={tipCardContent.question}
        />
      </div>
    </LeftPanel>
  );

  const centerSceneContent = (
    <div className="relative h-full w-full">
      <SceneLegend items={getOperationsLegendItems()} position="top-right" />

      <AnimationSvgCanvas containerRef={containerRef} transform={vp.transform}>
        <DerivativeOperationsScene
          opType={opType}
          x0={params.x0 ?? 1.2}
          deltaX={params.deltaX ?? 0.3}
          scale={scale}
          fontScale={canvasSize.font}
          onChangeX0={(newX0) => handleParamChange("x0", newX0)}
        />
      </AnimationSvgCanvas>
    </div>
  );

  const rightPanelContent = (
    <MathPanel {...mathPanelData} title="导数四则运算法则看板" />
  );

  return (
    <ThreePanel
      left={leftPanelContent}
      center={centerSceneContent}
      right={rightPanelContent}
    />
  );
};
export default DerivativeOperationsAnimation;
