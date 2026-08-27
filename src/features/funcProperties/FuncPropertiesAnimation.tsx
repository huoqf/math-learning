import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { PropertiesScene } from "./components/PropertiesScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/funcProperties";

export function FuncPropertiesAnimation() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [mode, setMode] = useState<"domain" | "parity" | "symmetry">("domain");
  const [fnType, setFnType] = useState<
    "cubic" | "quadratic" | "abs" | "reciprocal" | "sin"
  >("cubic");

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  const mathData = useMemo(
    () => buildMathQuantities("anim-func-properties", params, { mode, fnType }),
    [params, mode, fnType],
  );

  const formulaLatex = useMemo(() => {
    if (mode === "domain") {
      switch (fnType) {
        case "cubic":
          return "f(x) = x^3 \\quad (D = \\mathbb{R}, \\ R = \\mathbb{R})";
        case "quadratic":
          return "f(x) = x^2 \\quad (D = \\mathbb{R}, \\ R = [0, +\\infty))";
        case "abs":
          return "f(x) = |x| \\quad (D = \\mathbb{R}, \\ R = [0, +\\infty))";
        case "reciprocal":
          return "f(x) = \\frac{1}{x} \\quad (D = (-\\infty, 0) \\cup (0, +\\infty))";
        case "sin":
          return "f(x) = \\sin x \\quad (D = \\mathbb{R}, \\ R = [-1, 1])";
        default:
          return "y = f(x)";
      }
    }

    if (mode === "parity") {
      switch (fnType) {
        case "cubic":
          return "f(x) = x^3 \\quad (f(-x) = -f(x))";
        case "quadratic":
          return "f(x) = x^2 \\quad (f(-x) = f(x))";
        case "abs":
          return "f(x) = |x| \\quad (f(-x) = f(x))";
        case "reciprocal":
          return "f(x) = \\frac{1}{x} \\quad (f(-x) = -f(x))";
        case "sin":
          return "f(x) = \\sin x \\quad (f(-x) = -f(x))";
        default:
          return "y = f(x)";
      }
    }

    // mode === "symmetry"
    const axisA = (params.axisA ?? 0).toFixed(1);
    const axisB = (params.axisB ?? 2).toFixed(1);
    const dist = Math.abs((params.axisB ?? 2) - (params.axisA ?? 0));
    const period = (2 * dist).toFixed(1);
    return `x = ${axisA}, \\ x = ${axisB} \\text{ 对称 } \\Rightarrow T = 2|a - b| = ${period}`;
  }, [mode, fnType, params]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      domain: ["x0"],
      parity: ["x0", "x1", "x2"],
      symmetry: ["axisA", "axisB"],
    };
    const keys = keysByMode[mode] ?? Object.keys(paramMeta);
    return keys
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
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, mode]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const tipConfig = useMemo(() => {
    if (mode === "domain") {
      return {
        variant: "info" as const,
        badge: "课标基础 · 定义域与值域判定",
        condition: "研究函数性质前，必须首先确定定义域 D 与值域 R。",
        question: "拖动测试点验证取值范围，反比例函数特别注意 x = 0 断点。",
      };
    }
    if (mode === "parity") {
      return {
        variant: "primary" as const,
        badge: "核心性质 · 单调性与奇偶性联动",
        condition: "定义域关于原点对称是讨论函数奇偶性的必要前置条件。",
        question:
          "对比测试点 P₀ 与奇偶对称点 P'，观察割线斜率 k 判断区间单调性。",
      };
    }
    const dist = Math.abs((params.axisB ?? 2) - (params.axisA ?? 0));
    return {
      variant: "primary" as const,
      badge: "高考秒杀 · 双轴对称导出周期",
      condition: `图象同时具有两条纵向对称轴 x = ${(params.axisA ?? 0).toFixed(1)} 与 x = ${(params.axisB ?? 2).toFixed(1)}。`,
      question: `连续两次轴反射产生水平平移周期，导出 T = 2|a - b| = ${(2 * dist).toFixed(1)}。`,
    };
  }, [mode, params.axisA, params.axisB]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="探究模式切换">
            <SelectGrid
              items={[
                {
                  key: "domain",
                  label: "概念定义域",
                  formula: "x \\in D",
                },
                {
                  key: "parity",
                  label: "单调奇偶性",
                  formula: "f(-x)=\\pm f(x)",
                },
                {
                  key: "symmetry",
                  label: "对称周期性",
                  formula: "T=2|a-b|",
                },
              ]}
              value={mode}
              onChange={(k) => setMode(k as "domain" | "parity" | "symmetry")}
              columns={1}
              className="mb-4"
            />
          </LeftPanelSection>

          <LeftPanelSection title="基准函数选择">
            <SelectGrid
              items={[
                { key: "cubic", label: "三次曲线", formula: "y=x^3" },
                { key: "quadratic", label: "二次抛物线", formula: "y=x^2" },
                { key: "abs", label: "绝对值折线", formula: "y=|x|" },
                {
                  key: "reciprocal",
                  label: "反比例双曲线",
                  formula: "y=\\frac{1}{x}",
                },
                {
                  key: "sin",
                  label: "正弦波形",
                  formula: "y=\\sin x",
                },
              ]}
              value={fnType}
              onChange={(k) =>
                setFnType(
                  k as "cubic" | "quadratic" | "abs" | "reciprocal" | "sin",
                )
              }
              variant="outline"
              className="mb-4"
            />
          </LeftPanelSection>

          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>

          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【模型条件】
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
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <PropertiesScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              fnType={fnType}
              mode={mode}
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
          title={
            mode === "domain"
              ? "定义域与值域看板"
              : mode === "parity"
                ? "单调奇偶性看板"
                : "对称与周期看板"
          }
        />
      }
    />
  );
}
