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
      return `f(x) \\text{ 关于直线 } x = \\color{${MATH_COLORS.paramPrimary}}{${a}} \\text{ 轴对称 } \\iff f(x) = f(\\color{${MATH_COLORS.paramPrimary}}{${2 * Number(a)}} - x)`;
    }
    if (subMode === "center") {
      const xc = (params.centerX ?? 0).toFixed(1).replace(/\.0$/, "");
      const yc = (params.centerY ?? 0).toFixed(1).replace(/\.0$/, "");
      return `f(x) \\text{ 关于点 } (\\color{${MATH_COLORS.paramPrimary}}{${xc}}, \\color{${MATH_COLORS.paramPrimary}}{${yc}}) \\text{ 中心对称 } \\iff f(x) + f(${2 * Number(xc)} - x) = ${2 * Number(yc)}`;
    }
    if (subMode === "period-dual-axis") {
      const a = (params.axisA ?? 0).toFixed(1).replace(/\.0$/, "");
      const b = (params.axisB ?? 2).toFixed(1).replace(/\.0$/, "");
      const T = (2 * Math.abs(Number(b) - Number(a)))
        .toFixed(1)
        .replace(/\.0$/, "");
      return `x = \\color{${MATH_COLORS.paramPrimary}}{${a}}, \\ x = \\color{${MATH_COLORS.paramSecondary}}{${b}} \\text{ 轴对称 } \\Rightarrow T = 2|a - b| = ${T}`;
    }
    if (subMode === "period-dual-center") {
      const a = (params.axisA ?? 0).toFixed(1).replace(/\.0$/, "");
      const b = (params.axisB ?? 2).toFixed(1).replace(/\.0$/, "");
      const T = (2 * Math.abs(Number(b) - Number(a)))
        .toFixed(1)
        .replace(/\.0$/, "");
      return `(\\color{${MATH_COLORS.paramPrimary}}{${a}}, 0), \\ (\\color{${MATH_COLORS.paramSecondary}}{${b}}, 0) \\text{ 中心对称 } \\Rightarrow T = 2|a - b| = ${T}`;
    }
    // period-axis-center
    const a = (params.axisA ?? 0).toFixed(1).replace(/\.0$/, "");
    const b = (params.axisB ?? 2).toFixed(1).replace(/\.0$/, "");
    const T = (4 * Math.abs(Number(b) - Number(a)))
      .toFixed(1)
      .replace(/\.0$/, "");
    return `x = \\color{${MATH_COLORS.paramPrimary}}{${a}} \\text{ 轴与 } (\\color{${MATH_COLORS.paramSecondary}}{${b}}, 0) \\text{ 中心 } \\Rightarrow T = 4|a - b| = ${T}`;
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
    const axisAStr = (params.axisA ?? 0).toFixed(1).replace(/\.0$/, "");
    const axisBStr = (params.axisB ?? 2).toFixed(1).replace(/\.0$/, "");
    const centerXStr = (params.centerX ?? 0).toFixed(1).replace(/\.0$/, "");
    const centerYStr = (params.centerY ?? 0).toFixed(1).replace(/\.0$/, "");

    if (subMode === "axis") {
      const fnDesc =
        fnType === "quadratic"
          ? "二次函数 $f(x) = \\frac{1}{2}(x - a)^2 - \\frac{3}{2}$"
          : fnType === "abs"
            ? "绝对值函数 $f(x) = |x - a| - 1$"
            : "余弦型函数 $f(x) = \\cos(x - a)$";
      return {
        variant: "primary" as const,
        badge: "模型探究 · 函数图象轴对称性质",
        condition: `当前探究${fnDesc}，其图象关于垂直直线 $x = ${axisAStr}$ 轴对称。`,
        question:
          "设点 $P(x_0, y_0)$ 在函数图象上，求证其对称点 $P'$ 中点必然落在对称轴上，且恒有 $f(x) = f(2a - x)$。",
      };
    }
    if (subMode === "center") {
      const fnDesc =
        fnType === "cubic"
          ? "三次函数 $f(x) = \\frac{3}{10}(x - x_c)^3 + y_c$"
          : fnType === "sin"
            ? "正弦型函数 $f(x) = \\sin(x - x_c) + y_c$"
            : "分式函数 $f(x) = \\frac{1}{x - x_c} + y_c$";
      return {
        variant: "primary" as const,
        badge: "模型探究 · 函数图象中心对称性质",
        condition: `当前探究${fnDesc}，其图象关于点 $C(${centerXStr}, ${centerYStr})$ 中心对称。`,
        question:
          "设点 $P(x_0, y_0)$ 在函数图象上，求证线段 $PP'$ 必被对称中心 $C$ 平分，且恒有 $f(x) + f(2x_c - x) = 2y_c$。",
      };
    }
    if (subMode === "period-dual-axis") {
      return {
        variant: "primary" as const,
        badge: "核心模型 · 双轴对称导出周期",
        condition: `函数 $f(x)$ 图象同时具有两条对称轴 $x = ${axisAStr}$ 与 $x = ${axisBStr}$。`,
        question:
          "（1）求证函数满足 $f(x + 2|a - b|) = f(x)$；（2）求该函数图象的最小正周期 $T$，并探究两轴间距对周期的决定规律。",
      };
    }
    if (subMode === "period-dual-center") {
      return {
        variant: "primary" as const,
        badge: "核心模型 · 双中心对称导出周期",
        condition: `函数 $f(x)$ 图象关于点 $C_1(${axisAStr}, 0)$ 与 $C_2(${axisBStr}, 0)$ 均中心对称。`,
        question:
          "（1）求证两次连续中心反射复合后满足 $f(x + 2|a - b|) = f(x)$；（2）求解该函数的最小正周期 $T$。",
      };
    }
    // period-axis-center
    return {
      variant: "primary" as const,
      badge: "核心模型 · 一轴一中心导出周期",
      condition: `函数 $f(x)$ 图象关于轴 $x = ${axisAStr}$ 轴对称，且关于中心 $C(${axisBStr}, 0)$ 中心对称。`,
      question:
        "（1）求证自变量平移 $2|a - b|$ 时满足反号关系 $f(x + 2|a - b|) = -f(x)$；（2）由此推导求解最小正周期 $T$。",
    };
  }, [
    subMode,
    fnType,
    params.axisA,
    params.axisB,
    params.centerX,
    params.centerY,
  ]);

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
            <TipCard
              variant={tipConfig.variant}
              badge={tipConfig.badge}
              condition={tipConfig.condition}
              question={tipConfig.question}
            />
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
                  : subMode === "period-dual-axis"
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
                    : subMode === "period-dual-center"
                      ? [
                          {
                            style: "solid",
                            color: MATH_COLORS.function,
                            formula: "y = f(x)",
                          },
                          {
                            style: "point",
                            color: MATH_COLORS.paramPrimary,
                            formula: `C_1(${(params.axisA ?? 0).toFixed(1).replace(/\.0$/, "")}, 0)`,
                          },
                          {
                            style: "point",
                            color: MATH_COLORS.paramSecondary,
                            formula: `C_2(${(params.axisB ?? 2).toFixed(1).replace(/\.0$/, "")}, 0)`,
                          },
                          {
                            style: "area",
                            color: MATH_COLORS.asymptote,
                            formula: "T",
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
                            style: "point",
                            color: MATH_COLORS.paramSecondary,
                            formula: `C(${(params.axisB ?? 2).toFixed(1).replace(/\.0$/, "")}, 0)`,
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
