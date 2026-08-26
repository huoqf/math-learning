/**
 * src/features/second-derivative/SecondDerivativeAnimation.tsx
 * 二阶导数、拐点与函数凹凸性交互实验室主编排组件
 */

import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TabSwitcher,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { SceneLegend } from "@/components/Math";
import type { SceneLegendItem } from "@/components/Math";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/secondDerivative";
import { SecondDerivativeScene } from "./components/SecondDerivativeScene";
import { evalFunction, type FnKey } from "@/math/secondDerivative";

export function SecondDerivativeAnimation() {
  // 1. 探究模式：'concavity' | 'inflection' | 'jensen'
  const [studyMode, setStudyMode] = useState<
    "concavity" | "inflection" | "jensen"
  >("concavity");

  // 2. 函数模型选择：'cubic' | 'mixed' | 'quartic'
  const [fnKey, setFnKey] = useState<FnKey>("cubic");

  // 3. 参数状态
  const [params, setParams] = useState(() => ({
    a: defaultParams.a,
    b: defaultParams.b,
    c: defaultParams.c,
    d: defaultParams.d,
    x0: defaultParams.x0,
    x1: defaultParams.x1,
    x2: defaultParams.x2,
  }));

  // 4. 视口测量 hook
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 5. 场景比例尺
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 6. 数学量看板数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-derivative-inflection", params, {
      studyMode,
      fnKey,
    });
  }, [params, studyMode, fnKey]);

  // 7. 参数改变处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({
      ...defaultParams,
    });
  };

  // 8. 声明式参数配置按当前研究模式与函数模型过滤
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    // 根据 fnKey 过滤有效系数参数
    let allowedKeys = ["a", "b", "c", "d"];
    if (fnKey === "cubic") {
      allowedKeys = ["a", "b", "c", "d"];
    } else if (fnKey === "mixed") {
      allowedKeys = ["a", "b", "c"];
    } else {
      allowedKeys = ["a", "b", "c", "d"];
    }

    // 根据 studyMode 决定包含的探针参数
    if (studyMode === "concavity") {
      allowedKeys.push("x0");
    } else if (studyMode === "jensen") {
      allowedKeys.push("x1", "x2");
    }

    return allowedKeys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key as keyof typeof params] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode, fnKey]);

  // 9. 拼装顶端悬浮 LaTeX 动态公式
  const topFormulaLatex = useMemo(() => {
    const { a, b, c, d, x0 } = params;

    const buildTerm = (val: number, varStr: string, isFirst: boolean) => {
      if (Math.abs(val) < 1e-6) return "";
      const sign = val > 0 ? (isFirst ? "" : " + ") : " - ";
      const absVal = Math.abs(val);
      const numStr =
        Math.abs(absVal - 1) < 1e-6 && varStr !== "" ? "" : absVal.toFixed(1);
      return `${sign}${numStr}${varStr}`;
    };

    if (fnKey === "cubic") {
      const termA = buildTerm(a, "x^3", true);
      const termB = buildTerm(b, "x^2", termA === "");
      const termC = buildTerm(c, "x", termA === "" && termB === "");
      const termD = buildTerm(
        d,
        "",
        termA === "" && termB === "" && termC === "",
      );
      const poly = termA + termB + termC + termD || "0";
      const fStr = `f(x) = ${poly}`;

      const eval0 = evalFunction(fnKey, params, x0);
      const dfStr = `f'(${x0.toFixed(1)}) = ${eval0.dy.toFixed(2)}`;
      const ddfStr = `f''(${x0.toFixed(1)}) = ${eval0.ddy.toFixed(2)}`;

      if (studyMode === "concavity") {
        return `${fStr} \\quad | \\quad ${dfStr}, \\, ${ddfStr}`;
      } else if (studyMode === "inflection") {
        const xInf = Math.abs(a) > 1e-6 ? (-b / (3 * a)).toFixed(2) : "无";
        return `${fStr} \\quad | \\quad \\text{拐点 } x_{\\text{inf}} = -\\frac{b}{3a} = ${xInf}`;
      } else {
        return `${fStr} \\quad | \\quad f\\left(\\frac{x_1+x_2}{2}\\right) \\le \\frac{f(x_1)+f(x_2)}{2}`;
      }
    } else if (fnKey === "mixed") {
      const fStr = `f(x) = ${a.toFixed(1)}x e^x${c >= 0 ? " + " + c.toFixed(1) : " - " + Math.abs(c).toFixed(1)}`;
      const ddfStr = `f''(x) = ${a.toFixed(1)}(x+2)e^x`;
      return `${fStr} \\quad | \\quad ${ddfStr} \\text{ (拐点在 } x = -2 \\text{)}`;
    } else {
      const fStr = `f(x) = ${a.toFixed(1)}x^4${b >= 0 ? " + " + b.toFixed(1) : " - " + Math.abs(b).toFixed(1)}x^2 + ${c.toFixed(1)}`;
      const ddfStr = `f''(x) = ${(12 * a).toFixed(1)}x^2${2 * b >= 0 ? " + " + (2 * b).toFixed(1) : " - " + Math.abs(2 * b).toFixed(1)}`;
      return `${fStr} \\quad | \\quad ${ddfStr}`;
    }
  }, [params, fnKey, studyMode]);

  // 教学导引与题设背景配置
  const tipConfig = useMemo(() => {
    switch (studyMode) {
      case "concavity":
        return {
          variant: "primary" as const,
          badge: "高考难点 · 曲线凹凸性与切线位置",
          condition: "函数 f(x) 具有连续二阶导数，切点探针位于 x₀ 处。",
          question:
            "判断函数在不同区间上的凹凸性，并探究曲线与对应切线的上下相对位置关系。",
        };
      case "inflection":
        return {
          variant: "warning" as const,
          badge: "高考核心 · 拐点与极值点对比",
          condition: "给定函数 f(x)，考察一阶导数驻点与二阶导数变号点。",
          question:
            "求函数拐点坐标，并辨析拐点（凹凸性分界点）与极值点（单调性分界点）的本质区别。",
        };
      case "jensen":
        return {
          variant: "info" as const,
          badge: "高考压轴 · 琴生不等式弦弧关系",
          condition: "在函数凹凸区间内选取两相异自变量点 x₁ 与 x₂。",
          question:
            "判断中点函数值 f((x₁+x₂)/2) 与割线中点 (f(x₁)+f(x₂))/2 的大小关系。",
        };
      default:
        return {
          variant: "primary" as const,
          badge: "高考难点 · 二阶导数与拐点",
          condition: "考察函数的二阶导数符号与图象弯曲特征。",
          question: "确定函数的拐点坐标与凹凸区间。",
        };
    }
  }, [studyMode]);

  // 右下角图例配置 (模式专属)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (studyMode === "concavity") {
      return [
        {
          color: MATH_COLORS.function,
          formula: "f(x) \\;(\\text{原函数})",
          style: "solid",
        },
        {
          color: MATH_COLORS.tangentLine,
          formula: "y - f(x_0) = f'(x_0)(x - x_0) \\;(\\text{切线})",
          style: "solid",
        },
        {
          color: MATH_COLORS.focusPoint,
          formula: "P_0(x_0, f(x_0)) \\;(\\text{探针切点})",
          style: "point",
        },
        {
          color: "#10B981",
          label: "下凸凹区间 f''(x) > 0",
          style: "area",
        },
        {
          color: "#F59E0B",
          label: "上凸凸区间 f''(x) < 0",
          style: "area",
        },
      ];
    } else if (studyMode === "inflection") {
      return [
        {
          color: MATH_COLORS.function,
          formula: "f(x) \\;(\\text{原函数})",
          style: "solid",
        },
        {
          color: MATH_COLORS.vectorResult,
          formula: "I(x, f(x)) \\;(\\text{拐点, } f''(x)=0)",
          style: "point",
        },
        {
          color: MATH_COLORS.paramSecondary,
          formula: "E(x, f(x)) \\;(\\text{极值点, } f'(x)=0)",
          style: "point",
        },
      ];
    } else {
      return [
        {
          color: MATH_COLORS.function,
          formula: "f(x) \\;(\\text{原函数})",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramSecondary,
          formula: "S_1S_2 \\;(\\text{割线段})",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramSecondary,
          formula:
            "M\\left(\\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2}\\right) \\;(\\text{弦中点})",
          style: "point",
        },
        {
          color: MATH_COLORS.paramTertiary,
          formula:
            "P\\left(\\frac{x_1+x_2}{2}, f\\left(\\frac{x_1+x_2}{2}\\right)\\right) \\;(\\text{弧中点})",
          style: "point",
        },
      ];
    }
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 研究模式切换 Section */}
          <LeftPanelSection title="研究模式" subtitle="选择二阶导数探讨视角">
            <TabSwitcher
              tabs={[
                { key: "concavity", label: "凹凸性与切线" },
                { key: "inflection", label: "拐点与极值点" },
                { key: "jensen", label: "琴生不等式" },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k as typeof studyMode)}
            />
          </LeftPanelSection>

          {/* 函数模型选择 Section */}
          <LeftPanelSection title="函数模型" subtitle="选择探究的函数类型">
            <SelectGrid
              columns={1}
              items={[
                {
                  key: "cubic",
                  label: "三次函数 (单拐点与对称中心)",
                  formula: "f(x) = a x^3 + b x^2 + c x + d",
                },
                {
                  key: "mixed",
                  label: "指数混合 (极值点与拐点分离)",
                  formula: "f(x) = a x e^x + b x + c",
                },
                {
                  key: "quartic",
                  label: "四次特例 (二阶导为0非拐点)",
                  formula: "f(x) = a x^4 + b x^2 + c x + d",
                },
              ]}
              value={fnKey}
              onChange={(k) => setFnKey(k as FnKey)}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 参数调节 Section */}
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块改变函数系数与探针"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学导引与题设背景 */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【初始条件】
                  </span>
                  <span className="text-neutral-600">
                    {tipConfig.condition}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【核心设问】
                  </span>
                  <span className="text-neutral-600">{tipConfig.question}</span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 顶端悬浮 KaTeX 动态公式 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={topFormulaLatex} mode="inline" />
          </div>

          {/* 右下角图例 */}
          <SceneLegend items={legendItems} />

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <SecondDerivativeScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              fnKey={fnKey}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="二阶导数与拐点看板"
        />
      }
    />
  );
}
