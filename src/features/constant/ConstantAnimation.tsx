import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/constant";
import type { TransModelKey } from "@/math/constant";
import { SingleVarScene } from "./components/SingleVarScene";
import { DoubleVarScene } from "./components/DoubleVarScene";

export function ConstantAnimation() {
  // 二级 Tab 状态：'single' (单变量实验室) | 'double' (双变量对垒)
  const [activeTab, setActiveTab] = useState<"single" | "double">("single");

  // 单变量函数模型：'quadratic' (二次函数) | 'transcendent' (超越函数)
  const [funModel, setFunModel] = useState<"quadratic" | "transcendent">(
    "transcendent",
  );

  // 超越函数子模型 (高考 4 大母题)
  const [transModel, setTransModel] = useState<TransModelKey>("ln_x_over_x");

  // 可视化辅助开关：显示导函数 f'(x) / 显示切线放缩线
  const [showDerivative, setShowDerivative] = useState<boolean>(false);
  const [showTangent, setShowTangent] = useState<boolean>(false);

  // 单变量探索模式：'sep' (参变分离) | 'direct' (直接求导最值)
  const [subMode, setSubMode] = useState<"sep" | "direct">("sep");
  // 单变量逻辑关系：'always' (恒成立) | 'exist' (存在性)
  const [logic, setLogic] = useState<"always" | "exist">("always");

  // 双变量所选逻辑
  const [selectedLogic, setSelectedLogic] = useState<
    "all_all" | "all_exist" | "exist_all" | "exist_exist" | "same_var"
  >("all_all");

  // 统一参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    a: defaultParams.a,
    a_axis: defaultParams.a_axis,
    m: defaultParams.m,
    n: defaultParams.n,
    yf: defaultParams.yf,
    xf: defaultParams.xf,
    yg: defaultParams.yg,
    xg: defaultParams.xg,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: activeTab === "single" ? [-2, 6] : [-1, 5],
    yRange: activeTab === "single" ? [-1, 5.5] : [-2, 5.5],
  });

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      if (funModel === "transcendent" && activeTab === "single") {
        if (key === "m") {
          const clampedVal = Math.max(0.1, value);
          return {
            ...prev,
            m: clampedVal >= prev.n ? prev.n - 0.1 : clampedVal,
          };
        }
        if (key === "n") {
          const clampedVal = Math.max(0.2, value);
          return {
            ...prev,
            n: clampedVal <= prev.m ? prev.m + 0.1 : clampedVal,
          };
        }
      }

      if (key === "m" && value >= prev.n) {
        return { ...prev, m: prev.n - 0.1 };
      }
      if (key === "n" && value <= prev.m) {
        return { ...prev, n: prev.m + 0.1 };
      }
      return { ...prev, [key]: value };
    });
  };

  const handleReset = () => {
    setParams({
      a: defaultParams.a,
      a_axis: defaultParams.a_axis,
      m: funModel === "transcendent" ? 0.5 : defaultParams.m,
      n: funModel === "transcendent" ? 2.5 : defaultParams.n,
      yf: defaultParams.yf,
      xf: defaultParams.xf,
      yg: defaultParams.yg,
      xg: defaultParams.xg,
    });
  };

  // 组装看板数据
  const mathData = useMemo(() => {
    const animId =
      activeTab === "single" ? "anim-constant-single" : "anim-constant-double";
    return buildMathQuantities(animId, params, {
      subMode,
      logic,
      selectedLogic,
      funModel,
      transModel,
    });
  }, [params, activeTab, subMode, logic, selectedLogic, funModel, transModel]);

  // 组装 ParamControl 参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let keys: string[] = [];
    if (activeTab === "single") {
      keys = subMode === "sep" ? ["a", "m", "n"] : ["a_axis", "m", "n"];
    } else {
      keys = ["yf", "xf", "yg", "xg"];
    }

    return keys.map((key) => {
      const meta = paramMeta[key];
      let min = meta.min;
      let max = meta.max;
      let step = meta.step ?? 0.05;
      let description = meta.description;
      let descriptionFormula = meta.descriptionFormula;
      let marks = meta.marks;

      if (activeTab === "single" && funModel === "transcendent") {
        if (key === "m") {
          min = 0.1;
          max = 3.0;
          description = "超越函数定义域 x > 0，左边界需大等于 0.1";
          descriptionFormula = "超越函数定义域 $x > 0$，左边界需大等于 0.1";
        } else if (key === "n") {
          min = 0.5;
          max = 5.0;
          description = "超越函数研究区间的右端点";
        } else if (key === "a") {
          min = -0.5;
          max = 2.0;
          step = 0.02;
          description = "【主参数-红】目标水平直线 y = a 的位置";
          descriptionFormula = "【主参数-红】目标水平直线 $y = a$ 的位置";
        } else if (key === "a_axis") {
          min = 0.1;
          max = 5.0;
          description = "【主参数-红】超越函数讨论参数 a";
          descriptionFormula = "【主参数-红】超越函数讨论参数 $a$";
        }
      } else if (activeTab === "single" && funModel === "quadratic") {
        if (key === "a") {
          description = "【主参数-红】代表水平直线 y = a";
        } else if (key === "a_axis") {
          description = "【主参数-红】抛物线对称轴 x = a";
        }
      } else if (activeTab === "double") {
        if (key === "yf") {
          description = "【主参数-红】控制抛物线 f(x) 顶点的 y_f 坐标";
          descriptionFormula =
            "【主参数-红】控制抛物线 $f(x)$ 顶点的 $y_f$ 坐标";
        } else if (key === "yg") {
          description = "【次参数-橙】控制抛物线 g(x) 顶点的 y_g 坐标";
          descriptionFormula =
            "【次参数-橙】控制抛物线 $g(x)$ 顶点的 $y_g$ 坐标";
        }
      }

      return {
        key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key] ?? meta.defaultValue ?? 0,
        min,
        max,
        step,
        description,
        descriptionFormula,
        importance: meta.importance,
        marks,
      };
    });
  }, [params, activeTab, subMode, funModel]);

  // 中屏公式 LateX
  const formulasLatex = useMemo(() => {
    if (activeTab === "single") {
      if (subMode === "sep") {
        if (funModel === "transcendent") {
          let polyStr = "";
          if (transModel === "ln_x_over_x") {
            polyStr = `f(x) = \\frac{\\ln x}{x}`;
          } else if (transModel === "exp_minus_ax") {
            polyStr = `f(x) = \\frac{e^x}{x}`;
          } else if (transModel === "a_ln_x_minus_x") {
            polyStr = `f(x) = \\ln x - x + 1`;
          } else if (transModel === "exp_minus_a_x_plus_1") {
            polyStr = `f(x) = \\frac{e^x}{x+1}`;
          }
          const rangeStr = `x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
          const lineStr = `y = \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2)}}`;
          return { line1: `${polyStr} \\quad ${rangeStr}`, line2: lineStr };
        } else {
          const polyStr = `f(x) = x^2 - 2x + 2 \\quad x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
          const lineStr = `y = \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2)}}`;
          return { line1: polyStr, line2: lineStr };
        }
      } else {
        if (funModel === "transcendent") {
          let line1 = "";
          if (transModel === "ln_x_over_x" || transModel === "exp_minus_ax") {
            line1 = `f(x) = e^x - \\color{${MATH_COLORS.paramPrimary}}{${params.a_axis.toFixed(2)}}x`;
          } else if (transModel === "a_ln_x_minus_x") {
            line1 = `f(x) = \\color{${MATH_COLORS.paramPrimary}}{${params.a_axis.toFixed(2)}}\\ln x - x + 1`;
          } else if (transModel === "exp_minus_a_x_plus_1") {
            line1 = `f(x) = e^x - \\color{${MATH_COLORS.paramPrimary}}{${params.a_axis.toFixed(2)}}(x+1)`;
          }
          const line2 = `x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
          return { line1, line2 };
        } else {
          const line1 = `f(x) = x^2 - 2\\color{${MATH_COLORS.paramPrimary}}{(${params.a_axis.toFixed(2)})}x + 2`;
          const line2 = `x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
          return { line1, line2 };
        }
      }
    } else {
      if (selectedLogic === "same_var") {
        const fStr = `f(x) = (x - ${params.xf.toFixed(2)})^2 + \\color{${MATH_COLORS.paramPrimary}}{${params.yf.toFixed(2)}}, \\; g(x) = -(x - ${params.xg.toFixed(2)})^2 + \\color{${MATH_COLORS.paramSecondary}}{${params.yg.toFixed(2)}}`;
        const goalStr = `\\text{目标：对 } \\forall x \\in I_1 \\cap I_2 = [1.50, 2.00], \\; f(x) \\ge g(x)`;
        return { line1: fStr, line2: goalStr };
      } else {
        const fStr = `f(x) = (x - ${params.xf.toFixed(2)})^2 + \\color{${MATH_COLORS.paramPrimary}}{${params.yf.toFixed(2)}} \\quad x \\in [0.5, 2.0]`;
        const gStr = `g(x) = -(x - ${params.xg.toFixed(2)})^2 + \\color{${MATH_COLORS.paramSecondary}}{${params.yg.toFixed(2)}} \\quad x \\in [1.5, 3.0]`;
        return { line1: fStr, line2: gStr };
      }
    }
  }, [activeTab, subMode, funModel, transModel, selectedLogic, params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Section 1: 场景切换 */}
          <LeftPanelSection
            title="选择场景"
            subtitle="探索高考恒成立与存在性问题类型"
          >
            <SelectGrid
              items={[
                { key: "single", label: "单变量实验室" },
                { key: "double", label: "双变量对决" },
              ]}
              value={activeTab}
              onChange={(k) => setActiveTab(k as "single" | "double")}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* Section 1.5: 函数模型细分 */}
          {activeTab === "single" && (
            <LeftPanelSection
              title="选择函数模型"
              subtitle="高考超越函数四大母题与二次函数"
            >
              <div className="space-y-2">
                <SelectGrid
                  items={[
                    { key: "transcendent", label: "超越函数" },
                    { key: "quadratic", label: "二次函数" },
                  ]}
                  value={funModel}
                  onChange={(k) =>
                    setFunModel(k as "transcendent" | "quadratic")
                  }
                  variant="filled"
                  columns={2}
                />

                {/* 超越模型 4 大母题细分 */}
                {funModel === "transcendent" && (
                  <SelectGrid
                    items={[
                      {
                        key: "ln_x_over_x",
                        label: "ln x / x 型",
                        formula: "\\frac{\\ln x}{x} 型",
                      },
                      {
                        key: "exp_minus_ax",
                        label: "e^x - ax 型",
                        formula: "e^x - ax 型",
                      },
                      {
                        key: "a_ln_x_minus_x",
                        label: "a ln x - x + 1 型",
                        formula: "a\\ln x - x + 1 型",
                      },
                      {
                        key: "exp_minus_a_x_plus_1",
                        label: "e^x - a(x+1) 型",
                        formula: "e^x - a(x+1) 型",
                      },
                    ]}
                    value={transModel}
                    onChange={(k) => setTransModel(k)}
                    variant="filled"
                    className="pt-1"
                  />
                )}
              </div>
            </LeftPanelSection>
          )}

          {/* Section 2: 探索逻辑与辅助开关 */}
          {activeTab === "single" ? (
            <LeftPanelSection
              title="研究方法与辅助工具"
              subtitle="探究方法及导数/切线放缩辅助"
            >
              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    探索目标
                  </label>
                  <SelectGrid
                    items={[
                      { key: "always", label: "恒成立 (∀x)" },
                      { key: "exist", label: "存在性 (∃x)" },
                    ]}
                    value={logic}
                    onChange={(k) => setLogic(k as "always" | "exist")}
                    variant="filled"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    核心解题方法
                  </label>
                  <SelectGrid
                    items={[
                      { key: "sep", label: "参变分离法" },
                      { key: "direct", label: "直接最值讨论" },
                    ]}
                    value={subMode}
                    onChange={(k) => setSubMode(k as "sep" | "direct")}
                    variant="filled"
                  />
                </div>

                {/* 数形结合辅助线开关 */}
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    数形结合辅助图示
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDerivative(!showDerivative)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        showDerivative
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-neutral-650 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      {showDerivative ? "隐藏导数 f'(x)" : "显示导数 f'(x)"}
                    </button>
                    <button
                      onClick={() => setShowTangent(!showTangent)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        showTangent
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-white text-neutral-650 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      {showTangent ? "隐藏切线放缩" : "显示切线放缩"}
                    </button>
                  </div>
                </div>
              </div>
            </LeftPanelSection>
          ) : (
            <LeftPanelSection
              title="高考双变量博弈"
              subtitle="双动点对决与同变量差函数博弈"
            >
              <SelectGrid
                items={[
                  {
                    key: "all_all",
                    label: "∀x₁, ∀x₂",
                    formula: "\\forall x_1, \\forall x_2",
                    description: "任意对任意-极值隔离",
                    fullWidth: true,
                  },
                  {
                    key: "all_exist",
                    label: "∀x₁, ∃x₂",
                    formula: "\\forall x_1, \\exists x_2",
                    description: "任意对存在",
                    fullWidth: true,
                  },
                  {
                    key: "exist_all",
                    label: "∃x₁, ∀x₂",
                    formula: "\\exists x_1, \\forall x_2",
                    description: "存在对任意",
                    fullWidth: true,
                  },
                  {
                    key: "exist_exist",
                    label: "∃x₁, ∃x₂",
                    formula: "\\exists x_1, \\exists x_2",
                    description: "存在对存在",
                    fullWidth: true,
                  },
                  {
                    key: "same_var",
                    label: "∀x ∈ I₁ ∩ I₂",
                    formula: "\\forall x \\in I_1 \\cap I_2",
                    description: "同变量对垒-差函数",
                    fullWidth: true,
                  },
                ]}
                value={selectedLogic}
                onChange={(k) => setSelectedLogic(k)}
                variant="filled"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* Section 3: 参数设置 (ParamControl 渲染) */}
          <ParamControl
            params={paramConfigs}
            onParamChange={handleParamChange}
            onReset={handleReset}
          />
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white select-none">
          {/* 中屏公式显示卡片 */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-250 rounded-xl px-4 py-2.5 shadow-md flex flex-col gap-1 font-mono">
            <div className="text-xs text-neutral-400 font-bold mb-0.5">
              高考数学方程
            </div>
            <div className="text-sm">
              <KatexFormula formula={formulasLatex.line1} mode="inline" />
            </div>
            {formulasLatex.line2 && (
              <div className="text-sm border-t border-neutral-100 pt-1 mt-0.5">
                <KatexFormula formula={formulasLatex.line2} mode="inline" />
              </div>
            )}
          </div>

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            {activeTab === "single" ? (
              <SingleVarScene
                subMode={subMode}
                logic={logic}
                funModel={funModel}
                transModel={transModel}
                showDerivative={showDerivative}
                showTangent={showTangent}
                params={params}
                scale={scale}
                vp={vp}
                fontScale={canvasSize.font}
                onParamChange={handleParamChange}
              />
            ) : (
              <DoubleVarScene
                selectedLogic={selectedLogic}
                params={params}
                scale={scale}
                vp={vp}
                fontScale={canvasSize.font}
                onParamChange={handleParamChange}
              />
            )}
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
          title={activeTab === "single" ? "单自变量看板" : "双动点博弈看板"}
        />
      }
    />
  );
}
