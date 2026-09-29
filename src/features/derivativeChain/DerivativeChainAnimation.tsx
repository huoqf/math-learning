/**
 * 简单复合函数求导动画总控页面
 * 遵循系统公理 1-4 与两手抓要求
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
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { getChainLegendItems } from "./scenePalette";
import type { OuterFunctionType } from "@/math/derivativeChain";
import { formatLinearExpr } from "@/utils/mathFormat";
import {
  DERIVATIVE_CHAIN_DEFAULT_PARAMS,
  DERIVATIVE_CHAIN_PARAM_META,
} from "@/data/registries/derivativeChain";
import { buildDerivativeChainPanel } from "@/data/builders/derivativeChain";
import { DerivativeChainScene } from "./components/DerivativeChainScene";

const TAB_OPTIONS = [
  { key: "exp", label: "指数复合型" },
  { key: "sin", label: "三角复合型" },
  { key: "ln", label: "对数复合型" },
  { key: "power", label: "立方复合型" },
];

export const DerivativeChainAnimation: React.FC = () => {
  const [outerType, setOuterType] = useState<OuterFunctionType>("exp");
  const [params, setParams] = useState<Record<string, number>>(
    DERIVATIVE_CHAIN_DEFAULT_PARAMS,
  );

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-4.5, 4.5],
    yRange: [-3.5, 3.5],
  });

  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setOuterType(key as OuterFunctionType);
    if (key === "ln") {
      setParams((prev) => ({ ...prev, a: 1, b: 2, x0: 0 }));
    }
  }, []);

  const paramConfigs = useMemo(
    () => [
      {
        key: "a",
        label: "内层系数 a",
        value: params.a ?? 2,
        min: DERIVATIVE_CHAIN_PARAM_META.a.min,
        max: DERIVATIVE_CHAIN_PARAM_META.a.max,
        step: DERIVATIVE_CHAIN_PARAM_META.a.step,
        color: MATH_COLORS.paramPrimary,
      },
      {
        key: "b",
        label: "内层常数 b",
        value: params.b ?? 1,
        min: DERIVATIVE_CHAIN_PARAM_META.b.min,
        max: DERIVATIVE_CHAIN_PARAM_META.b.max,
        step: DERIVATIVE_CHAIN_PARAM_META.b.step,
        color: MATH_COLORS.paramSecondary,
      },
      {
        key: "x0",
        label: "切点横坐标 x₀",
        value: params.x0 ?? 0.5,
        min: DERIVATIVE_CHAIN_PARAM_META.x0.min,
        max: DERIVATIVE_CHAIN_PARAM_META.x0.max,
        step: DERIVATIVE_CHAIN_PARAM_META.x0.step,
        color: MATH_COLORS.paramTertiary,
      },
    ],
    [params],
  );

  const panelData = useMemo(() => {
    return buildDerivativeChainPanel(params, { outerType });
  }, [params, outerType]);

  const tipCardContent = useMemo(() => {
    const aVal = params.a ?? 2;
    const bVal = params.b ?? 1;
    const x0Val = params.x0 ?? 0.5;
    // 内层线性式统一走 formatLinearExpr：避免 `2x + -3` / `1x + 2` / `0x + 1` 这类不规范书写
    const innerLinear = formatLinearExpr(aVal, bVal);

    switch (outerType) {
      case "exp":
        return {
          background:
            "课标核心模型：指数复合函数常见于放射性衰变、电容器充放电与高考切线大题。",
          condition: `设外层函数 $f(u) = e^u$，内层线性函数 $u = ${innerLinear}$，复合函数 $y = e^{${innerLinear}}$。当前切点 $x_0 = ${x0Val}$。`,
          question:
            "求复合函数在探究点处的瞬时切线斜率与切线方程，反思为什么导数中必须乘以内层系数 $a$？",
        };
      case "sin":
        return {
          background:
            "简谐振动模型：周期震荡过程中的角频率 $\\omega = a$ 引起振动速度按比例缩放。",
          condition: `设外层函数 $f(u) = \\sin u$，内层线性函数 $u = ${innerLinear}$，复合函数 $y = \\sin(${innerLinear})$。当前切点 $x_0 = ${x0Val}$。`,
          question:
            "求三角复合函数的瞬时切线斜率，探究系数 $a$ 对函数单调区间与斜率极值的影响。",
        };
      case "ln":
        return {
          background:
            "对数衰减与增长模型：广泛应用于信息熵计算、化学酸碱度与声学分贝度量。",
          condition: `设外层函数 $f(u) = \\ln u$，内层线性函数 $u = ${innerLinear}$（定义域 $u > 0$），复合函数 $y = \\ln(${innerLinear})$。当前切点 $x_0 = ${x0Val}$。`,
          question:
            "求对数复合函数的定义域与在探究点处的导数，验证其单调性与切线几何特征。",
        };
      case "power":
        return {
          background:
            "多项式展开替代模型：通过复合求导避免展开三次多项式的繁琐代数运算。",
          condition: `设外层函数 $f(u) = u^3$，内层线性函数 $u = ${innerLinear}$，复合函数 $y = (${innerLinear})^3$。当前切点 $x_0 = ${x0Val}$。`,
          question:
            "求三次复合函数的导数解析式与在 $x_0$ 处的切线方程，对比直接展开后逐项求导的结果是否一致。",
        };
    }
  }, [outerType, params]);

  // 图例由 scenePalette 生成：颜色与线型同画布唯一同源（原先此处手写一份、Scene 里再写一份）
  const legendItems = useMemo(() => getChainLegendItems(), []);

  const leftPanelContent = (
    <LeftPanel>
      <TabSwitcher
        tabs={TAB_OPTIONS}
        value={outerType}
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
        <DerivativeChainScene
          outerType={outerType}
          a={params.a ?? 2}
          b={params.b ?? 1}
          x0={params.x0 ?? 0.5}
          scale={scale}
          fontScale={canvasSize.font}
          onChangeX0={(newX0) => handleParamChange("x0", newX0)}
        />
      </AnimationSvgCanvas>
    </div>
  );

  const rightPanelContent = (
    <MathPanel {...panelData} title="简单复合函数求导看板" />
  );

  return (
    <ThreePanel
      left={leftPanelContent}
      center={centerSceneContent}
      right={rightPanelContent}
    />
  );
};

export default DerivativeChainAnimation;
