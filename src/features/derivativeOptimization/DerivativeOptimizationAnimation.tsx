/**
 * 导数实际生活优化建模实验室总控页面
 * 组装三大经典高考应用题模型：折叠长方体最大容积、圆柱最省材料易拉罐、企业生产最大利润
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
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { getOptimizationLegendItems } from "./scenePalette";
import {
  OPTIMIZATION_CONSTANTS,
  type OptimizationModelType,
} from "@/math/derivativeOptimization";
import {
  defaultOptimizationParams,
  optimizationParamMeta,
} from "@/data/registries/derivativeOptimization";
import { buildDerivativeOptimizationPanel } from "@/data/builders/derivativeOptimization";
import { DerivativeOptimizationScene } from "./components/DerivativeOptimizationScene";

const MODEL_TABS = [
  { key: "box", label: "折叠盒最大容积" },
  { key: "can", label: "易拉罐最省材料" },
  { key: "profit", label: "企业生产最大利润" },
];

export const DerivativeOptimizationAnimation: React.FC = () => {
  const [modelType, setModelType] = useState<OptimizationModelType>("box");
  const [params, setParams] = useState<Record<string, number>>(
    defaultOptimizationParams,
  );

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const [xRange, yRange] = useMemo((): [[number, number], [number, number]] => {
    switch (modelType) {
      case "box":
        return [
          [-2, 32],
          [-2000, 19000],
        ];
      case "can":
        return [
          [-0.5, 11],
          [-50, 500],
        ];
      case "profit":
        return [
          [-5, 75],
          [-100, 750],
        ];
    }
  }, [modelType]);

  const scale = useSceneScale({
    vp,
    xRange,
    yRange,
  });

  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setModelType(key as OptimizationModelType);
  }, []);

  const currentXKey =
    modelType === "box" ? "box_x" : modelType === "can" ? "can_r" : "profit_x";
  const currentMeta = optimizationParamMeta[currentXKey];

  const paramConfigs = useMemo(
    () => [
      {
        key: currentXKey,
        label: currentMeta.label,
        value: params[currentXKey] ?? currentMeta.default,
        min: currentMeta.min,
        max: currentMeta.max,
        step: currentMeta.step,
        color: currentMeta.color,
      },
    ],
    [currentXKey, currentMeta, params],
  );

  const panelData = useMemo(() => {
    return buildDerivativeOptimizationPanel(params, { modelType });
  }, [params, modelType]);

  const tipCardContent = useMemo(() => {
    switch (modelType) {
      case "box":
        return {
          background: `课标必修与选修压轴几何优化原型：边长 ${OPTIMIZATION_CONSTANTS.box.L}cm 的正方形铁皮，四角切除等大正方形后折成无盖长方体。`,
          condition: `当前切角小正方形边长 $x = ${(params.box_x ?? 10).toFixed(1)}\\text{cm}$。实际物理定义域要求 $x \\in (0, ${OPTIMIZATION_CONSTANTS.box.L / 2})$。`,
          question:
            "求容积函数 $V(x)$ 的解析式与导数极值，证明在何时长方体盒子的容积取得全局最大值？",
        };
      case "can":
        return {
          background: `工业制造与包装设计材料最省模型：制造规定容积为 ${OPTIMIZATION_CONSTANTS.can.V}cm³ 的圆柱形易拉罐。`,
          condition: `设底面半径为 $r$，高为 $h$。当前底面半径 $r = ${(params.can_r ?? 4.5).toFixed(1)}\\text{cm}$。`,
          question:
            "求全表面积 $S(r)$ 最小时的底面半径与圆柱高，反思为什么高与底面直径相等时最省材料？",
        };
      case "profit":
        return {
          background:
            "现代经济管理与微观经济学优化模型：企业通过调整产品批次生产量以达成利润最大化。",
          condition: `当前批次产量 $x = ${(params.profit_x ?? 30).toFixed(0)}\\text{件}$，总收益受需求弹性影响呈二次分布。`,
          question:
            "求边际利润等于零时对应的最优生产规模与企业能够获取的最大净利润数值。",
        };
    }
  }, [modelType, params]);

  // 图例由 scenePalette 生成：颜色与线型同画布唯一同源
  const legendItems = useMemo(() => getOptimizationLegendItems(), []);

  const leftPanelContent = (
    <LeftPanel>
      <TabSwitcher
        tabs={MODEL_TABS}
        value={modelType}
        onChange={handleTabChange}
      />

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
      <SceneLegend items={legendItems} position="top-right" />

      <AnimationSvgCanvas containerRef={containerRef} transform={vp.transform}>
        <DerivativeOptimizationScene
          modelType={modelType}
          xVal={params[currentXKey] ?? currentMeta.default}
          scale={scale}
          fontScale={canvasSize.font}
          onChangeX={(newX) => handleParamChange(currentXKey, newX)}
        />
      </AnimationSvgCanvas>
    </div>
  );

  const rightPanelContent = (
    <MathPanel {...panelData} title="导数实际优化建模看板" />
  );

  return (
    <ThreePanel
      left={leftPanelContent}
      center={centerSceneContent}
      right={rightPanelContent}
    />
  );
};

export default DerivativeOptimizationAnimation;
