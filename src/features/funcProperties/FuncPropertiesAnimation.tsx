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
          return "f(x) = x^3 \\quad (\\text{奇函数: } f(-x) = -f(x))";
        case "quadratic":
          return "f(x) = x^2 \\quad (\\text{偶函数: } f(-x) = f(x))";
        case "abs":
          return "f(x) = |x| \\quad (\\text{偶函数: } f(-x) = f(x))";
        case "reciprocal":
          return "f(x) = \\frac{1}{x} \\quad (\\text{奇函数: } f(-x) = -f(x))";
        case "sin":
          return "f(x) = \\sin x \\quad (\\text{奇函数: } f(-x) = -f(x))";
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
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance as any,
          marks: meta.marks,
        };
      });
  }, [params, mode]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="核心考点模式切换"
            subtitle="选择对应考点探索高考核心性质"
          >
            <SelectGrid
              items={[
                {
                  key: "domain",
                  label: "概念定义域",
                  formula: "x \\in D",
                  description: "定义域与值域",
                },
                {
                  key: "parity",
                  label: "单调奇偶性",
                  formula: "f(-x)=\\pm f(x)",
                  description: "奇偶与单调性",
                },
                {
                  key: "symmetry",
                  label: "对称周期性",
                  formula: "T=2|a-b|",
                  description: "对称与周期",
                },
              ]}
              value={mode}
              onChange={(k) => setMode(k as any)}
              columns={1}
              className="mb-4"
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="基准函数选择"
            subtitle="切换观察不同函数的动态图象与性质"
          >
            <SelectGrid
              items={[
                { key: "cubic", label: "y = x³", formula: "y=x^3" },
                { key: "quadratic", label: "y = x²", formula: "y=x^2" },
                { key: "abs", label: "y = |x|", formula: "y=|x|" },
                {
                  key: "reciprocal",
                  label: "y = 1/x",
                  formula: "y=\\frac{1}{x}",
                },
                {
                  key: "sin",
                  label: "y = sin x",
                  formula: "y=\\sin x",
                },
              ]}
              value={fnType}
              onChange={(k) => setFnType(k as any)}
              variant="outline"
              className="mb-4"
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="参数调节"
            subtitle="调节参数观察曲线与几何演变"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="💡 观察与操作指引"
            subtitle="根据当前模式指导数形结合探索"
          >
            {mode === "domain" && (
              <TipCard variant="info">
                <p className="font-bold mb-1">📌 概念与定义域观察要点：</p>
                <p>
                  1. <b>定义域 D</b>：允许取值的自变量集合（X 轴淡阴影区）。
                </p>
                <p>
                  2. <b>值域 R</b>：所有函数值 f(x) 的集合（Y 轴淡阴影区）。
                </p>
                <p>
                  3. <b>拖动验证</b>：拖动滑块 x₀。切换到 y = 1/x 试着拖动到 x₀
                  = 0，观察无定义点警示。
                </p>
              </TipCard>
            )}
            {mode === "parity" && (
              <TipCard variant="warning">
                <p className="font-bold mb-1">📌 奇偶与单调性观察要点：</p>
                <p>
                  1. <b>奇偶测试</b>：拖动 x₀ 观察点 P₀ 与对称点 P'。偶函数
                  f(-x)=f(x) 关于 y 轴对称；奇函数 f(-x)=-f(x) 关于原点对称。
                </p>
                <p>
                  2. <b>单调割线斜率</b>：拖动 x₁, x₂ 形成割线，斜率 k = Δy/Δx
                  &gt; 0 表示增函数，k &lt; 0 表示减函数。
                </p>
              </TipCard>
            )}
            {mode === "symmetry" && (
              <TipCard variant="primary">
                <p className="font-bold mb-1">📌 对称与周期性观察要点：</p>
                <p>
                  1. <b>双对称轴</b>：拖动 a, b 控制红/橙两条虚线对称轴 x = a 与
                  x = b。
                </p>
                <p>
                  2. <b>导出周期</b>
                  ：当图象关于两条直线均对称时，两次折叠形成周期循环，周期长度正好等于{" "}
                  <b>两倍轴距 T = 2|a - b|</b>。
                </p>
              </TipCard>
            )}
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
