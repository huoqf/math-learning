import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, ALGEBRA_COLORS, CALCULUS_COLORS } from "@/theme";
import { buildPolyLatex } from "@/utils/polyBuilder";
import { QuadraticScene } from "./components/QuadraticScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/quadratic";

export function QuadraticAnimation() {
  // 研究模式：'function' | 'equation' | 'inequality'
  const [studyMode, setStudyMode] = useState<
    "function" | "equation" | "inequality"
  >("function");
  // 不等式方向：'>' | '<'
  const [ineqType, setIneqType] = useState<">" | "<">(">");

  // 1. 本地状态保存 a, b, c 参数
  const [params, setParams] = useState<Record<string, number>>(() => ({
    a: defaultParams.a,
    b: defaultParams.b,
    c: defaultParams.c,
  }));

  // 2. 视口尺寸测量与防抖
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 3. 构建直角坐标系比例尺：数学范围 X [-6, 6]，Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 4. 数学量看板数据计算与组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-quadratic", params, {
      studyMode,
      ineqType,
    });
  }, [params, studyMode, ineqType]);

  // 参数更新处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({
      a: defaultParams.a,
      b: defaultParams.b,
      c: defaultParams.c,
    });
  };

  // 构建声明式控制面板配置参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return Object.entries(paramMeta).map(([key, meta]) => ({
      key,
      label: meta.label,
      labelFormula: meta.labelFormula,
      value: params[key] ?? meta.defaultValue ?? 0,
      min: meta.min,
      max: meta.max,
      step: meta.step ?? 0.1,
      description: meta.description,
      descriptionFormula: meta.descriptionFormula,
      importance: meta.importance as any,
      marks: meta.marks,
    }));
  }, [params]);

  // 计算当前抛物线多项式的 LaTeX 表达式（带参数着色）
  const polyLatex = useMemo(() => {
    const terms = [];
    if (Math.abs(params.a) > 1e-9) {
      terms.push({ coeff: params.a, power: 2, color: ALGEBRA_COLORS.sequence });
    }
    if (Math.abs(params.b) > 1e-9) {
      terms.push({
        coeff: params.b,
        power: 1,
        color: ALGEBRA_COLORS.inequality,
      });
    }
    if (
      Math.abs(params.c) > 1e-9 ||
      (Math.abs(params.a) < 1e-9 && Math.abs(params.b) < 1e-9)
    ) {
      terms.push({
        coeff: params.c,
        power: 0,
        color: CALCULUS_COLORS.derivative,
      });
    }
    return buildPolyLatex(terms);
  }, [params]);

  // 组装最终的公式
  const equationLatex = useMemo(() => {
    if (studyMode === "function") {
      return `f(x) = ${polyLatex}`;
    } else if (studyMode === "equation") {
      return `${polyLatex} = 0`;
    } else {
      return `${polyLatex} ${ineqType} 0`;
    }
  }, [polyLatex, studyMode, ineqType]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "function") return "二次函数指标看板";
    if (studyMode === "equation") return "一元二次方程指标看板";
    return "一元二次不等式指标看板";
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
          <LeftPanelSection title="研究模式" subtitle="选择三位一体探讨对象">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setStudyMode("function")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    studyMode === "function"
                      ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300"
                  }`}
                >
                  二次函数性质
                </button>
                <button
                  onClick={() => setStudyMode("equation")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    studyMode === "equation"
                      ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300"
                  }`}
                >
                  一元二次方程
                </button>
              </div>
              <button
                onClick={() => setStudyMode("inequality")}
                className={`w-full py-2 text-xs font-semibold rounded-lg border transition-all ${
                  studyMode === "inequality"
                    ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300"
                }`}
              >
                一元二次不等式
              </button>
            </div>
          </LeftPanelSection>

          {/* 不等号方向 Section */}
          {studyMode === "inequality" && (
            <LeftPanelSection
              title="不等号方向"
              subtitle="选择解集的大于/小于关系"
            >
              <div className="flex gap-2">
                <button
                  onClick={() => setIneqType(">")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    ineqType === ">"
                      ? "bg-success-600 text-white border-success-600 shadow-sm"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-success-300"
                  }`}
                >
                  <KatexFormula
                    formula="f(x) > 0"
                    mode="inline"
                    className="!text-xs !my-0"
                  />
                </button>
                <button
                  onClick={() => setIneqType("<")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    ineqType === "<"
                      ? "bg-success-600 text-white border-success-600 shadow-sm"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-success-300"
                  }`}
                >
                  <KatexFormula
                    formula="f(x) < 0"
                    mode="inline"
                    className="!text-xs !my-0"
                  />
                </button>
              </div>
            </LeftPanelSection>
          )}

          {/* 参数调节 Section */}
          <LeftPanelSection title="参数调节" subtitle="拖动滑块改变抛物线系数">
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
          {/* 方程公式 KaTeX 悬浮展示 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <QuadraticScene
              params={params as any}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              ineqType={ineqType}
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
          title={panelTitle}
        />
      }
    />
  );
}
