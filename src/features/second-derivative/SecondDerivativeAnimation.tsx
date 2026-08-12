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
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
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
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
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
          value: params[key] ?? meta.defaultValue ?? 0,
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

      const eval0 = evalFunction(fnKey, params as any, x0);
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
              onChange={(k) => setStudyMode(k as any)}
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
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 顶端悬浮 KaTeX 动态公式 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={topFormulaLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <SecondDerivativeScene
              params={params as any}
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
