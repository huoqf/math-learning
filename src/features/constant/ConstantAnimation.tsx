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
import { CANVAS_PRESETS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/constant";
import { SingleVarScene } from "./components/SingleVarScene";
import { DoubleVarScene } from "./components/DoubleVarScene";

export function ConstantAnimation() {
  // 二级 Tab 状态：'single' (单变量实验室) | 'double' (双变量对垒)
  const [activeTab, setActiveTab] = useState<"single" | "double">("single");

  // 单变量函数模型：'quadratic' (二次函数) | 'transcendent' (超越函数)
  const [funModel, setFunModel] = useState<"quadratic" | "transcendent">(
    "quadratic",
  );

  // 单变量探索模式：'sep' (参变分离) | 'direct' (直接求导最值)
  const [subMode, setSubMode] = useState<"sep" | "direct">("sep");
  // 单变量逻辑关系：'always' (恒成立) | 'exist' (存在性)
  const [logic, setLogic] = useState<"always" | "exist">("always");

  // 双变量所选逻辑：
  // 'all_all' : ∀x1, ∀x2, f(x1) >= g(x2)
  // 'all_exist' : ∀x1, ∃x2, f(x1) >= g(x2)
  // 'exist_all' : ∃x1, ∀x2, f(x1) >= g(x2)
  // 'exist_exist' : ∃x1, ∃x2, f(x1) >= g(x2)
  // 'same_var' : ∀x in I1∩I2, f(x) >= g(x)
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

  // 根据不同 Tab 动态计算数学坐标范围
  const scale = useSceneScale({
    vp,
    xRange: activeTab === "single" ? [-2, 6] : [-1, 5],
    yRange: activeTab === "single" ? [-1, 5.5] : [-2, 5.5],
  });

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      // 在超越函数模型下，确保区间左端点 m 至少为 0.10
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

      // 限制区间左边界不能大于等于右边界（如果是在单变量状态下修改端点）
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
    });
  }, [params, activeTab, subMode, logic, selectedLogic, funModel]);

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
          description = "超越函数定义域 x > 0，故左边界需大等于 0.1";
          descriptionFormula = "超越函数定义域 x > 0，故左边界需大等于 0.1";
        } else if (key === "n") {
          min = 0.5;
          max = 5.0;
          description = "超越函数研究区间的右端点";
        } else if (key === "a") {
          min = -0.5;
          max = 1.0;
          step = 0.02;
          description =
            "【主参数-红】代表水平直线 y = a，其临界值为 1/e ≈ 0.37";
          descriptionFormula =
            "【主参数-红】代表水平直线 $y = a$，其临界值为 $\\frac{1}{e} \\approx 0.37$";
        } else if (key === "a_axis") {
          min = 0.1;
          max = 5.0;
          description =
            "【主参数-红】函数 f(x) = e^x - ax 的参数 a，极小值点为 ln a";
          descriptionFormula =
            "【主参数-红】函数 $f(x) = e^x - ax$ 的参数 $a$，极小值点为 $\\ln a$";
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
        importance: meta.importance as any,
        marks,
      };
    });
  }, [params, activeTab, subMode, funModel]);

  // 中屏公式 LateX
  const formulasLatex = useMemo(() => {
    if (activeTab === "single") {
      if (subMode === "sep") {
        if (funModel === "transcendent") {
          const polyStr = `f(x) = \\frac{\\ln x}{x} \\quad x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
          const lineStr = `y = \\color{#EF4444}{${params.a.toFixed(2)}}`;
          return { line1: polyStr, line2: lineStr };
        } else {
          const polyStr = `f(x) = x^2 - 2x + 2 \\quad x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
          const lineStr = `y = \\color{#EF4444}{${params.a.toFixed(2)}}`;
          return { line1: polyStr, line2: lineStr };
        }
      } else {
        if (funModel === "transcendent") {
          const line1 = `f(x) = e^x - \\color{#EF4444}{${params.a_axis.toFixed(2)}}x`;
          const line2 = `x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
          return { line1, line2 };
        } else {
          const line1 = `f(x) = x^2 - 2\\color{#EF4444}{(${params.a_axis.toFixed(2)})}x + 2`;
          const line2 = `x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
          return { line1, line2 };
        }
      }
    } else {
      if (selectedLogic === "same_var") {
        const fStr = `f(x) = (x - ${params.xf.toFixed(2)})^2 + \\color{#EF4444}{${params.yf.toFixed(2)}}, \\; g(x) = -(x - ${params.xg.toFixed(2)})^2 + \\color{#D97706}{${params.yg.toFixed(2)}}`;
        const goalStr = `\\text{目标：对 } \\forall x \\in I_1 \\cap I_2 = [1.50, 2.00], \\; f(x) \\ge g(x)`;
        return { line1: fStr, line2: goalStr };
      } else {
        const fStr = `f(x) = (x - ${params.xf.toFixed(2)})^2 + \\color{#EF4444}{${params.yf.toFixed(2)}} \\quad x \\in [0.5, 2.0]`;
        const gStr = `g(x) = -(x - ${params.xg.toFixed(2)})^2 + \\color{#D97706}{${params.yg.toFixed(2)}} \\quad x \\in [1.5, 3.0]`;
        return { line1: fStr, line2: gStr };
      }
    }
  }, [activeTab, subMode, funModel, selectedLogic, params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Section 1: 场景切换 */}
          <LeftPanelSection
            title="选择场景"
            subtitle="探索不同的高考恒成立问题类型"
          >
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("single")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                  activeTab === "single"
                    ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300"
                }`}
              >
                单变量实验室
              </button>
              <button
                onClick={() => setActiveTab("double")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                  activeTab === "double"
                    ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300"
                }`}
              >
                双变量对决
              </button>
            </div>
          </LeftPanelSection>

          {/* Section 1.5: 选择函数模型 */}
          {activeTab === "single" && (
            <LeftPanelSection
              title="选择函数模型"
              subtitle="对比经典二次函数与高考超越函数模型"
            >
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFunModel("quadratic");
                    setParams((prev) => ({ ...prev, m: 0.5, n: 2.5 }));
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    funModel === "quadratic"
                      ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                      : "bg-white text-neutral-650 border-neutral-200 hover:border-primary-300"
                  }`}
                >
                  二次函数
                </button>
                <button
                  onClick={() => {
                    setFunModel("transcendent");
                    setParams((prev) => ({
                      ...prev,
                      m: Math.max(0.2, prev.m),
                      n: Math.max(1.5, prev.n),
                      a: prev.a > 0.4 ? 0.2 : prev.a,
                    }));
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    funModel === "transcendent"
                      ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                      : "bg-white text-neutral-650 border-neutral-200 hover:border-primary-300"
                  }`}
                >
                  超越函数
                </button>
              </div>
            </LeftPanelSection>
          )}

          {/* Section 2: 探索逻辑与方法 */}
          {activeTab === "single" ? (
            <LeftPanelSection
              title="研究方法与目标"
              subtitle="选择恒成立探索模式"
            >
              <div className="space-y-3">
                {/* 模式选择 */}
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    探索目标
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLogic("always")}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        logic === "always"
                          ? "bg-neutral-850 text-white border-neutral-800"
                          : "bg-white text-neutral-650 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      恒成立 (∀x)
                    </button>
                    <button
                      onClick={() => setLogic("exist")}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        logic === "exist"
                          ? "bg-neutral-850 text-white border-neutral-800"
                          : "bg-white text-neutral-650 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      存在性 (∃x)
                    </button>
                  </div>
                </div>

                {/* 方法选择 */}
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                    核心方法
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSubMode("sep")}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        subMode === "sep"
                          ? "bg-neutral-850 text-white border-neutral-800"
                          : "bg-white text-neutral-650 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      参变分离法
                    </button>
                    <button
                      onClick={() => setSubMode("direct")}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        subMode === "direct"
                          ? "bg-neutral-850 text-white border-neutral-800"
                          : "bg-white text-neutral-650 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      直接最值讨论
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
              <div className="space-y-1.5">
                {[
                  {
                    key: "all_all",
                    formula: "\\forall x_1, \\forall x_2",
                    desc: "任意对任意-极值分离",
                  },
                  {
                    key: "all_exist",
                    formula: "\\forall x_1, \\exists x_2",
                    desc: "任意对存在",
                  },
                  {
                    key: "exist_all",
                    formula: "\\exists x_1, \\forall x_2",
                    desc: "存在对任意",
                  },
                  {
                    key: "exist_exist",
                    formula: "\\exists x_1, \\exists x_2",
                    desc: "存在对存在",
                  },
                  {
                    key: "same_var",
                    formula: "\\forall x \\in I_1 \\cap I_2",
                    desc: "同变量对垒-差函数",
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setSelectedLogic(item.key as any)}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md border transition-all ${
                      selectedLogic === item.key
                        ? "bg-primary-500 text-white border-primary-500 font-semibold shadow-sm"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300"
                    }`}
                  >
                    <KatexFormula
                      formula={item.formula}
                      mode="inline"
                      className="!text-[11px] !my-0"
                    />
                    <span className="ml-1.5 text-[10px] opacity-70">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
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
              数学方程
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
