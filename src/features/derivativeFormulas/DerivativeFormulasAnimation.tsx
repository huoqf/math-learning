/**
 * 基本初等函数求导公式实验室页面总控
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
import { getFormulasLegendItems } from "./scenePalette";
import { DerivativeFormulasScene } from "./components/DerivativeFormulasScene";
import {
  defaultDerivativeFormulasParams,
  derivativeFormulasParamMeta,
  resolveParamAMeta,
} from "@/data/registries/derivativeFormulas";
import { buildMathQuantities } from "@/data/mathQuantities";
import type { BasicFuncType } from "@/math/derivativeFormulas";

const FUNC_TABS = [
  { key: "power", label: "幂函数" },
  { key: "sin", label: "正弦函数" },
  { key: "cos", label: "余弦函数" },
  { key: "exp", label: "指数函数" },
  { key: "log", label: "对数函数" },
  { key: "constant", label: "常数函数" },
];

export const DerivativeFormulasAnimation: React.FC = () => {
  const [funcType, setFuncType] = useState<BasicFuncType>("power");
  const [params, setParams] = useState<Record<string, number>>(
    defaultDerivativeFormulasParams,
  );
  const [showDerivativeGraph, setShowDerivativeGraph] = useState(true);

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const [xRange, yRange] = useMemo((): [[number, number], [number, number]] => {
    switch (funcType) {
      case "sin":
      case "cos":
        return [
          [-3.5, 4.5],
          [-2.5, 2.5],
        ];
      case "log":
        return [
          [-0.5, 5.5],
          [-3.0, 3.0],
        ];
      case "exp":
        return [
          [-2.5, 3.5],
          [-1.0, 6.0],
        ];
      default:
        return [
          [-1.5, 4.5],
          [-1.5, 5.5],
        ];
    }
  }, [funcType]);

  const scale = useSceneScale({
    vp,
    xRange,
    yRange,
  });

  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleTabChange = useCallback((key: string) => {
    const nextType = key as BasicFuncType;
    setFuncType(nextType);
    // 切换函数类型时重置为适合该函数的安全参数
    if (nextType === "sin" || nextType === "cos") {
      setParams((prev) => ({ ...prev, x0: 1.0, deltaX: 0.6 }));
    } else if (nextType === "log") {
      setParams((prev) => ({ ...prev, x0: 1.5, deltaX: 0.5, paramA: Math.E }));
    } else if (nextType === "exp") {
      setParams((prev) => ({ ...prev, x0: 1.0, deltaX: 0.5, paramA: Math.E }));
    } else if (nextType === "constant") {
      setParams((prev) => ({ ...prev, x0: 1.5, deltaX: 0.8, paramA: 3.0 }));
    } else {
      setParams((prev) => ({ ...prev, x0: 1.5, deltaX: 0.8, paramA: 2.0 }));
    }
  }, []);

  // 右屏面板数据统一组装
  const mathPanelData = useMemo(() => {
    return buildMathQuantities("anim-derivative-formulas", params, {
      funcType,
    });
  }, [params, funcType]);

  // 左屏 TipCard 题设三要素闭环
  const tipCardContent = useMemo(() => {
    switch (funcType) {
      case "power":
        return {
          background:
            "课标核心导数公式探究：考察幂函数在切点附近的瞬时变化率与割线极限。",
          condition: `设函数 $f(x) = x^{${params.paramA ?? 2}}$，当前切点横坐标 $x_0 = ${(params.x0 ?? 1.5).toFixed(1)}$，自变量增量 $\\Delta x = ${(params.deltaX ?? 0.8).toFixed(2)}$。`,
          question:
            "当增量 $\\Delta x \\to 0$ 时，平均变化率 $\\frac{\\Delta y}{\\Delta x}$ 如何收敛到导函数值 $f'(x_0) = \\alpha x_0^{\\alpha - 1}$？",
        };
      case "sin":
        return {
          background:
            "物理振动与周期运动模型：正弦函数导数揭示了位移、速度与加速度之间的正余弦相差转换。",
          condition: `设函数 $f(x) = \\sin x$（弧度制），切点横坐标 $x_0 = ${(params.x0 ?? 1.0).toFixed(2)}$，自变量增量 $\\Delta x = ${(params.deltaX ?? 0.6).toFixed(2)}$。`,
          question:
            "观察割线逼近切线的几何过程，验证为什么 $(\\sin x)' = \\cos x$ 且导函数曲线与原函数存在 $\\frac{\\pi}{2}$ 相位差？",
        };
      case "cos":
        return {
          background:
            "简谐振动与恢复力模型：余弦函数导数的负号反映了恢复力方向与位移方向始终相反的物理本质。",
          condition: `设函数 $f(x) = \\cos x$（弧度制），切点横坐标 $x_0 = ${(params.x0 ?? 1.0).toFixed(2)}$，自变量增量 $\\Delta x = ${(params.deltaX ?? 0.6).toFixed(2)}$。`,
          question:
            "观察切线斜率随切点移动的正负切换，求证为什么 $(\\cos x)' = -\\sin x$ 中必须携带负号？",
        };
      case "exp":
        return {
          background:
            "自然增长与放射性衰变模型：自然底数 $e$ 使得函数与其导函数完全相等，是微积分中最完美的自守函数。",
          condition: `设函数 $f(x) = a^x$（当前底数 $a = ${(params.paramA ?? Math.E).toFixed(2)}$），切点横坐标 $x_0 = ${(params.x0 ?? 1.0).toFixed(1)}$。`,
          question:
            "对比底数 $a = e$ 与普通底数 $a \\neq e$ 时切线斜率的差异，探究导数式中系数 $\\ln a$ 的几何放大效应。",
        };
      case "log":
        return {
          background:
            "信息熵与对数感知模型：对数增长随自变量增大而日益平缓，导数反映了增长速度按反比例 $\\frac{1}{x}$ 衰减的本质规律。",
          condition: `设函数 $f(x) = \\log_a x$（当前底数 $a = ${(params.paramA ?? Math.E).toFixed(2)}$），切点横坐标 $x_0 = ${(params.x0 ?? 1.5).toFixed(1)}$。`,
          question:
            "求证当底数取自然底数 $e$ 时，为什么在点 $(1, 0)$ 处的切线斜率恰好为 1？",
        };
      case "constant":
        return {
          background:
            "静态基准与水平线模型：常数函数在全域内数值恒定，没有任何变化量。",
          condition: `设常数函数 $f(x) = C = ${(params.paramA ?? 3.0).toFixed(1)}$，切点横坐标 $x_0 = ${(params.x0 ?? 1.5).toFixed(1)}$。`,
          question:
            "因为纵坐标增量 $\\Delta y \\equiv 0$，求证为什么任意常数函数的导数恒为 0 且切线处处水平？",
        };
    }
  }, [funcType, params]);

  const paramConfigs = useMemo((): ParamConfig[] => {
    const list: ParamConfig[] = [
      {
        key: "x0",
        label: derivativeFormulasParamMeta.x0.label,
        value: params.x0 ?? 1.5,
        min: derivativeFormulasParamMeta.x0.min,
        max: derivativeFormulasParamMeta.x0.max,
        step: derivativeFormulasParamMeta.x0.step,
      },
      {
        key: "deltaX",
        label: derivativeFormulasParamMeta.deltaX.label,
        value: params.deltaX ?? 0.8,
        min: derivativeFormulasParamMeta.deltaX.min,
        max: derivativeFormulasParamMeta.deltaX.max,
        step: derivativeFormulasParamMeta.deltaX.step,
      },
    ];

    if (
      funcType === "power" ||
      funcType === "exp" ||
      funcType === "log" ||
      funcType === "constant"
    ) {
      // paramA 的含义随模式变化（幂指数 α / 底数 a / 常数值 C），声明域必须取自
      // registries/derivativeFormulas 的按模式 SSOT —— 中屏拖拽钳制读的是同一份，避免口径分裂。
      const aMeta = resolveParamAMeta(funcType);
      list.push({
        key: "paramA",
        label: aMeta.label,
        value: params.paramA ?? 2.0,
        min: aMeta.min,
        max: aMeta.max,
        step: aMeta.step,
        description: aMeta.description,
        marks: aMeta.marks,
      });
    }

    return list;
  }, [funcType, params]);

  const leftPanelContent = (
    <LeftPanel>
      <TabSwitcher
        tabs={FUNC_TABS}
        value={funcType}
        onChange={handleTabChange}
      />

      <div className="space-y-4 pt-2">
        <ParamControl params={paramConfigs} onParamChange={handleParamChange} />

        <div className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-xs text-slate-300">
          <span>显示导函数虚线曲线 f'(x)</span>
          <input
            type="checkbox"
            checked={showDerivativeGraph}
            onChange={(e) => setShowDerivativeGraph(e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-0"
          />
        </div>

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
      <SceneLegend
        items={getFormulasLegendItems({ showDerivativeGraph })}
        position="top-right"
      />

      <AnimationSvgCanvas containerRef={containerRef} transform={vp.transform}>
        <DerivativeFormulasScene
          funcType={funcType}
          x0={params.x0 ?? 1.5}
          deltaX={params.deltaX ?? 0.8}
          paramA={params.paramA ?? 2.0}
          scale={scale}
          fontScale={canvasSize.font}
          onChangeX0={(newX0) => handleParamChange("x0", newX0)}
          showDerivativeGraph={showDerivativeGraph}
        />
      </AnimationSvgCanvas>
    </div>
  );

  const rightPanelContent = (
    <MathPanel {...mathPanelData} title="基本初等函数求导公式看板" />
  );

  return (
    <ThreePanel
      left={leftPanelContent}
      center={centerSceneContent}
      right={rightPanelContent}
    />
  );
};
export default DerivativeFormulasAnimation;
