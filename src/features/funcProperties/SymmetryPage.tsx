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
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { SceneLegend } from "@/components/Math";
import { PropertiesScene } from "./components/PropertiesScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/funcProperties";

type SubMode =
  | "axis"
  | "center"
  | "period-dual-axis"
  | "period-dual-center"
  | "period-axis-center";
type FnType = "quadratic" | "abs" | "cubic" | "sin" | "reciprocal";

export function SymmetryPage() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [subMode, setSubMode] = useState<SubMode>("axis");
  const [fnType, setFnType] = useState<FnType>("quadratic");

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-func-properties", params, {
        mode: "symmetry",
        subMode,
        fnType,
      }),
    [params, subMode, fnType],
  );

  const formulaLatex = useMemo(() => {
    if (subMode === "axis") {
      const a = (params.axisA ?? 0).toFixed(1).replace(/\.0$/, "");
      return `f(x) \\text{ 关于直线 } x = ${a} \\text{ 轴对称 } \\iff f(x) = f(${2 * Number(a)} - x)`;
    }
    if (subMode === "center") {
      const xc = (params.centerX ?? 0).toFixed(1).replace(/\.0$/, "");
      const yc = (params.centerY ?? 0).toFixed(1).replace(/\.0$/, "");
      return `f(x) \\text{ 关于点 } (${xc}, ${yc}) \\text{ 中心对称 } \\iff f(x) + f(${2 * Number(xc)} - x) = ${2 * Number(yc)}`;
    }
    if (subMode === "period-dual-axis") {
      const a = (params.axisA ?? 0).toFixed(1).replace(/\.0$/, "");
      const b = (params.axisB ?? 2).toFixed(1).replace(/\.0$/, "");
      const T = (2 * Math.abs(Number(b) - Number(a)))
        .toFixed(1)
        .replace(/\.0$/, "");
      return `x = ${a}, \\ x = ${b} \\text{ 轴对称 } \\Rightarrow T = 2|a - b| = ${T}`;
    }
    if (subMode === "period-dual-center") {
      const a = (params.axisA ?? 0).toFixed(1).replace(/\.0$/, "");
      const b = (params.axisB ?? 2).toFixed(1).replace(/\.0$/, "");
      const T = (2 * Math.abs(Number(b) - Number(a)))
        .toFixed(1)
        .replace(/\.0$/, "");
      return `(${a}, 0), \\ (${b}, 0) \\text{ 中心对称 } \\Rightarrow T = 2|a - b| = ${T}`;
    }
    // period-axis-center
    const a = (params.axisA ?? 0).toFixed(1).replace(/\.0$/, "");
    const b = (params.axisB ?? 2).toFixed(1).replace(/\.0$/, "");
    const T = (4 * Math.abs(Number(b) - Number(a)))
      .toFixed(1)
      .replace(/\.0$/, "");
    return `x = ${a} \\text{ 轴与 } (${b}, 0) \\text{ 中心 } \\Rightarrow T = 4|a - b| = ${T}`;
  }, [subMode, params]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let keys: string[] = [];
    if (subMode === "axis") {
      keys = ["axisA", "x0"];
    } else if (subMode === "center") {
      keys = ["centerX", "centerY", "x0"];
    } else {
      keys = ["axisA", "axisB"];
    }

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
  }, [params, subMode]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 动态教学提示配置
  const tipConfig = useMemo(() => {
    if (subMode === "axis") {
      return {
        variant: "primary" as const,
        badge: "模型探究 · 函数图象轴对称性质",
        condition: `函数图象关于垂直直线 x = ${(params.axisA ?? 0).toFixed(1).replace(/\.0$/, "")} 轴对称。`,
        question:
          "观察任意测试点 P 与其对称点 P'，验证两点中点必然落在对称轴上，且 f(x) = f(2a-x)。",
      };
    }
    if (subMode === "center") {
      return {
        variant: "primary" as const,
        badge: "模型探究 · 函数图象中心对称性质",
        condition: `函数图象关于点 C(${(params.centerX ?? 0).toFixed(1).replace(/\.0$/, "")}, ${(params.centerY ?? 0).toFixed(1).replace(/\.0$/, "")}) 中心对称。`,
        question:
          "观察测试点 P 与对称点 P' 的连线必过对称中心 C 并被其平分，验证 f(x) + f(2a-x) = 2b。",
      };
    }
    if (subMode === "period-dual-axis") {
      const dist = Math.abs((params.axisB ?? 2) - (params.axisA ?? 0));
      return {
        variant: "primary" as const,
        badge: "核心模型 · 双轴对称导出周期",
        condition: `图象同时具有两条对称轴 x = ${(params.axisA ?? 0).toFixed(1).replace(/\.0$/, "")} 与 x = ${(params.axisB ?? 2).toFixed(1).replace(/\.0$/, "")}。`,
        question: `两次连续轴反射复合产生水平平移，导出最小正周期 T = 2|a - b| = ${(2 * dist).toFixed(1).replace(/\.0$/, "")}。`,
      };
    }
    if (subMode === "period-dual-center") {
      const dist = Math.abs((params.axisB ?? 2) - (params.axisA ?? 0));
      return {
        variant: "primary" as const,
        badge: "核心模型 · 双中心对称导出周期",
        condition: `图象关于点 (${(params.axisA ?? 0).toFixed(1).replace(/\.0$/, "")}, 0) 与 (${(params.axisB ?? 2).toFixed(1).replace(/\.0$/, "")}, 0) 中心对称。`,
        question: `两次连续中心反射复合产生水平平移，导出最小正周期 T = 2|a - b| = ${(2 * dist).toFixed(1).replace(/\.0$/, "")}。`,
      };
    }
    // period-axis-center
    const dist = Math.abs((params.axisB ?? 2) - (params.axisA ?? 0));
    return {
      variant: "primary" as const,
      badge: "核心模型 · 一轴一中心导出周期",
      condition: `图象关于轴 x = ${(params.axisA ?? 0).toFixed(1).replace(/\.0$/, "")} 与中心 (${(params.axisB ?? 2).toFixed(1).replace(/\.0$/, "")}, 0) 对称。`,
      question: `一轴一中心连续反射四次完成完整循环，导出周期 T = 4|a - b| = ${(4 * dist).toFixed(1).replace(/\.0$/, "")}。`,
    };
  }, [subMode, params.axisA, params.axisB, params.centerX, params.centerY]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="探究模式切换">
            <SelectGrid
              items={[
                { key: "axis", label: "单轴对称", formula: "f(2a-x)=f(x)" },
                {
                  key: "center",
                  label: "中心对称",
                  formula: "f(2a-x)+f(x)=2b",
                },
                {
                  key: "period-dual-axis",
                  label: "双轴导出周期",
                  formula: "T=2|a-b|",
                },
                {
                  key: "period-dual-center",
                  label: "双中心导出周期",
                  formula: "T=2|a-b|",
                },
                {
                  key: "period-axis-center",
                  label: "一轴一中心导出周期",
                  formula: "T=4|a-b|",
                },
              ]}
              value={subMode}
              onChange={(k) => setSubMode(k as SubMode)}
              columns={1}
              className="mb-4"
            />
          </LeftPanelSection>

          {subMode === "axis" && (
            <LeftPanelSection title="基准函数模型">
              <SelectGrid
                items={[
                  {
                    key: "quadratic",
                    label: "二次抛物线",
                    formula: "y=(x-a)^2",
                  },
                  { key: "abs", label: "绝对值折线", formula: "y=|x-a|" },
                  { key: "sin", label: "余弦波形", formula: "y=\\cos(x-a)" },
                ]}
                value={fnType}
                onChange={(k) => setFnType(k as FnType)}
                variant="outline"
                className="mb-4"
              />
            </LeftPanelSection>
          )}

          {subMode === "center" && (
            <LeftPanelSection title="基准函数模型">
              <SelectGrid
                items={[
                  { key: "cubic", label: "三次曲线", formula: "y=(x-x_c)^3" },
                  { key: "sin", label: "正弦波形", formula: "y=\\sin(x-x_c)" },
                  {
                    key: "reciprocal",
                    label: "分式中心",
                    formula: "y=\\frac{1}{x-x_c}",
                  },
                ]}
                value={fnType}
                onChange={(k) => setFnType(k as FnType)}
                variant="outline"
                className="mb-4"
              />
            </LeftPanelSection>
          )}

          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
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
                    【模型条件】
                  </span>
                  <span className="text-neutral-600">
                    {tipConfig.condition}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【核心探究】
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
              mode="symmetry"
              subMode={subMode}
            />
          </AnimationSvgCanvas>
          <SceneLegend
            items={
              subMode === "axis"
                ? [
                    {
                      style: "solid",
                      color: MATH_COLORS.function,
                      formula: "y = f(x)",
                    },
                    {
                      style: "dash",
                      color: MATH_COLORS.paramPrimary,
                      formula: `x = ${(params.axisA ?? 0).toFixed(1).replace(/\.0$/, "")}`,
                    },
                    {
                      style: "point",
                      color: MATH_COLORS.paramSecondary,
                      formula: "P(x, y)",
                    },
                    {
                      style: "point",
                      color: MATH_COLORS.paramTertiary,
                      formula: "P'(2a-x, y)",
                    },
                  ]
                : subMode === "center"
                  ? [
                      {
                        style: "solid",
                        color: MATH_COLORS.function,
                        formula: "y = f(x)",
                      },
                      {
                        style: "point",
                        color: MATH_COLORS.paramPrimary,
                        formula: `C(${params.centerX ?? 0}, ${params.centerY ?? 0})`,
                      },
                      {
                        style: "point",
                        color: MATH_COLORS.paramSecondary,
                        formula: "P(x, y)",
                      },
                      {
                        style: "point",
                        color: MATH_COLORS.paramTertiary,
                        formula: "P'(2a-x, 2b-y)",
                      },
                    ]
                  : [
                      {
                        style: "solid",
                        color: MATH_COLORS.function,
                        formula: "y = f(x)",
                      },
                      {
                        style: "dash",
                        color: MATH_COLORS.paramPrimary,
                        formula: `x = ${(params.axisA ?? 0).toFixed(1).replace(/\.0$/, "")}`,
                      },
                      {
                        style: "dash",
                        color: MATH_COLORS.paramSecondary,
                        formula: `x = ${(params.axisB ?? 2).toFixed(1).replace(/\.0$/, "")}`,
                      },
                      {
                        style: "area",
                        color: MATH_COLORS.asymptote,
                        formula: "T",
                      },
                    ]
            }
            title="对称图例说明"
          />
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="对称与周期看板"
        />
      }
    />
  );
}
