import { useState, useMemo, useCallback } from "react";
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
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/constant";
import type { TransModelKey } from "@/math/constant";
import { SingleVarScene } from "./components/SingleVarScene";

export function SingleVarPage() {
  const [funModel, setFunModel] = useState<"transcendent" | "quadratic">(
    "transcendent",
  );
  const [transModel, setTransModel] = useState<TransModelKey>("ln_x_over_x");
  const [presetKey, setPresetKey] = useState<string>("free");
  const [showDerivative, setShowDerivative] = useState<boolean>(false);
  const [showTangent, setShowTangent] = useState<boolean>(false);
  const [subMode, setSubMode] = useState<"sep" | "direct">("sep");
  const [logic, setLogic] = useState<"always" | "exist">("always");

  const [params, setParams] = useState<Record<string, number>>(() => ({
    a: defaultParams.a,
    a_axis: defaultParams.a_axis,
    m: defaultParams.m,
    n: defaultParams.n,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({ vp, xRange: [-2, 6], yRange: [-1, 5.5] });

  const handleParamChange = useCallback(
    (key: string, value: number) => {
      // 拖拽或手动调参时，自动切回自由探究
      setPresetKey("free");
      setParams((prev) => {
        if (funModel === "transcendent") {
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
    },
    [funModel],
  );

  // 典型预设切换响应
  const handlePresetChange = (key: string) => {
    setPresetKey(key);
    if (key === "free") return;

    if (funModel === "transcendent") {
      if (key === "trans_critical") {
        // 极值相切临界
        if (transModel === "ln_x_over_x") {
          setSubMode("sep");
          setParams((prev) => ({ ...prev, a: 0.37, m: 0.5, n: 3.5 }));
        } else if (transModel === "exp_minus_ax") {
          setSubMode("direct");
          setParams((prev) => ({ ...prev, a_axis: 1.0, m: 0.1, n: 2.0 }));
        } else if (transModel === "a_ln_x_minus_x") {
          setSubMode("direct");
          setShowTangent(true);
          setParams((prev) => ({ ...prev, a_axis: 1.0, m: 0.2, n: 3.0 }));
        } else if (transModel === "exp_minus_a_x_plus_1") {
          setSubMode("direct");
          setShowTangent(true);
          setParams((prev) => ({ ...prev, a_axis: 1.0, m: 0.1, n: 2.5 }));
        }
      } else if (key === "trans_left") {
        setParams((prev) => ({ ...prev, m: 0.2, n: 1.5 }));
      } else if (key === "trans_right") {
        setParams((prev) => ({ ...prev, m: 2.5, n: 5.0 }));
      }
    } else {
      if (key === "axis_left") {
        // 轴在区间左 (a < m)
        setSubMode("direct");
        setParams((prev) => ({ ...prev, a_axis: 0.0, m: 1.0, n: 3.0 }));
      } else if (key === "axis_inside") {
        // 轴在区间内 (m <= a <= n)
        setSubMode("direct");
        setParams((prev) => ({ ...prev, a_axis: 2.0, m: 1.0, n: 3.0 }));
      } else if (key === "axis_right") {
        // 轴在区间右 (a > n)
        setSubMode("direct");
        setParams((prev) => ({ ...prev, a_axis: 4.0, m: 1.0, n: 3.0 }));
      }
    }
  };

  const handleReset = () => {
    setPresetKey("free");
    setParams({
      a: defaultParams.a,
      a_axis: defaultParams.a_axis,
      m: funModel === "transcendent" ? 0.5 : defaultParams.m,
      n: funModel === "transcendent" ? 2.5 : defaultParams.n,
    });
  };

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-constant-single", params, {
      subMode,
      logic,
      funModel,
      transModel,
    });
  }, [params, subMode, logic, funModel, transModel]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = subMode === "sep" ? ["a", "m", "n"] : ["a_axis", "m", "n"];
    return keys.map((key) => {
      const meta = paramMeta[key];
      let min = meta.min;
      let max = meta.max;
      let step = meta.step ?? 0.05;
      let description = meta.description;
      let descriptionFormula = meta.descriptionFormula;
      let marks = meta.marks;
      const group =
        key === "a" || key === "a_axis" ? "目标特征参数 a" : "研究区间 [m, n]";

      if (funModel === "transcendent") {
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
      } else {
        if (key === "a") {
          description = "【主参数-红】代表水平直线 y = a";
        } else if (key === "a_axis") {
          description = "【主参数-红】抛物线对称轴 x = a";
          // 动态 marks：指示当前区间的端点值 m 与 n 作为分类讨论分界
          marks = [
            {
              value: params.m,
              variant: "critical",
              label: `m=${params.m.toFixed(1)}`,
            },
            {
              value: params.n,
              variant: "critical",
              label: `n=${params.n.toFixed(1)}`,
            },
          ];
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
        group,
        description,
        descriptionFormula,
        importance: meta.importance,
        marks,
      };
    });
  }, [params, subMode, funModel]);

  const formulasLatex = useMemo(() => {
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
  }, [subMode, funModel, transModel, params]);

  // 教学导引与题设背景配置
  const tipConfig = useMemo(() => {
    const isAlways = logic === "always";
    const rangeText = `区间 [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;

    if (funModel === "transcendent") {
      let modelName = "(ln x)/x";
      if (transModel === "exp_minus_ax") modelName = "eˣ - ax";
      else if (transModel === "a_ln_x_minus_x") modelName = "a ln x - x + 1";
      else if (transModel === "exp_minus_a_x_plus_1") modelName = "eˣ - a(x+1)";

      return {
        variant: (isAlways ? "primary" : "warning") as "primary" | "warning",
        badge: isAlways
          ? `高考压轴 · 超越函数 ${modelName} 恒成立`
          : `高考压轴 · 超越函数 ${modelName} 存在性`,
        condition: `给定超越函数与参数 a，自变量限定在研究${rangeText}内。`,
        question: isAlways
          ? "求实数参数 a 的取值范围，使得不等式在给定区间内对任意 x 均恒成立。"
          : "求实数参数 a 的取值范围，使得不等式在给定区间内存在实数解（能成立）。",
      };
    } else {
      return {
        variant: (isAlways ? "primary" : "warning") as "primary" | "warning",
        badge: isAlways
          ? "高考经典 · 二次函数含参恒成立 (轴动区间定)"
          : "高考经典 · 二次函数含参存在性 (能成立)",
        condition: `二次函数含参对称轴 x = a，自变量限定在研究${rangeText}内。`,
        question: isAlways
          ? "求实数参数 a 的取值范围，使得二次不等式在给定区间上恒成立。"
          : "求实数参数 a 的取值范围，使得二次不等式在给定区间上存在解。",
      };
    }
  }, [funModel, transModel, logic, params.m, params.n]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 顶层函数模型切换 */}
          <LeftPanelSection title="核心函数专题">
            <TabSwitcher
              tabs={[
                { key: "transcendent", label: "超越函数压轴" },
                { key: "quadratic", label: "二次函数模型" },
              ]}
              value={funModel}
              onChange={(k) => {
                setFunModel(k as "transcendent" | "quadratic");
                setPresetKey("free");
              }}
            />

            {funModel === "transcendent" && (
              <div className="pt-2">
                <div className="text-[10px] font-semibold text-neutral-400 mb-1">
                  高考 4 大超越母题
                </div>
                <SelectGrid
                  items={[
                    {
                      key: "ln_x_over_x",
                      formula: "\\frac{\\ln x}{x}",
                      description: "极值点 x=e",
                    },
                    {
                      key: "exp_minus_ax",
                      formula: "e^x - ax",
                      description: "驻点 x=ln a",
                    },
                    {
                      key: "a_ln_x_minus_x",
                      formula: "a\\ln x - x + 1",
                      description: "x=1 切线放缩",
                    },
                    {
                      key: "exp_minus_a_x_plus_1",
                      formula: "e^x - a(x+1)",
                      description: "x=0 切线下界",
                    },
                  ]}
                  value={transModel}
                  onChange={(k) => {
                    setTransModel(k as TransModelKey);
                    setPresetKey("free");
                  }}
                  variant="filled"
                  columns={2}
                />
              </div>
            )}
          </LeftPanelSection>

          {/* 2. 黄金 2x2 典型高考预设 */}
          <LeftPanelSection
            title="典型构型预设"
            subtitle="一键直达经典高考题型参数"
          >
            {funModel === "transcendent" ? (
              <SelectGrid
                items={[
                  {
                    key: "free",
                    label: "自由探究",
                    description: "全参数开放",
                  },
                  {
                    key: "trans_critical",
                    label: "极值相切",
                    description: "临界点等号",
                  },
                  {
                    key: "trans_left",
                    label: "左偏区间",
                    description: "单调递增区",
                  },
                  {
                    key: "trans_right",
                    label: "右偏区间",
                    description: "单调递减区",
                  },
                ]}
                value={presetKey}
                onChange={handlePresetChange}
                variant="filled"
                columns={2}
              />
            ) : (
              <SelectGrid
                items={[
                  {
                    key: "free",
                    label: "自由探究",
                    description: "全参数开放",
                  },
                  {
                    key: "axis_left",
                    label: "轴在区间左",
                    description: "a < m 单调递增",
                  },
                  {
                    key: "axis_inside",
                    label: "轴在区间内",
                    description: "m ≤ a ≤ n 顶点极值",
                  },
                  {
                    key: "axis_right",
                    label: "轴在区间右",
                    description: "a > n 单调递减",
                  },
                ]}
                value={presetKey}
                onChange={handlePresetChange}
                variant="filled"
                columns={2}
              />
            )}
          </LeftPanelSection>

          {/* 3. 探究目标与解法 */}
          <LeftPanelSection
            title="研究目标与方法"
            subtitle="选择量词目标与求解转化方法"
          >
            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                  探索目标 (量词)
                </label>
                <SelectGrid
                  items={[
                    {
                      key: "always",
                      label: "恒成立 (∀x)",
                      description: "抓最小值守底线",
                    },
                    {
                      key: "exist",
                      label: "存在性 (∃x)",
                      description: "抓最大值求突破",
                    },
                  ]}
                  value={logic}
                  onChange={(k) => setLogic(k as "always" | "exist")}
                  variant="filled"
                  columns={2}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                  核心解题方法
                </label>
                <SelectGrid
                  items={[
                    {
                      key: "sep",
                      label: "参变分离法",
                      description: "孤立参数看极值",
                    },
                    {
                      key: "direct",
                      label: "直接最值讨论",
                      description: "分类讨论单调性",
                    },
                  ]}
                  value={subMode}
                  onChange={(k) => setSubMode(k as "sep" | "direct")}
                  variant="filled"
                  columns={2}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                  辅助分析图层
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowDerivative((prev) => !prev)}
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all duration-200 text-center select-none ${
                      showDerivative
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    {showDerivative ? "✓ 导数 f'(x)" : "+ 导数 f'(x)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTangent((prev) => !prev)}
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all duration-200 text-center select-none ${
                      showTangent
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    {showTangent ? "✓ 切线放缩" : "+ 切线放缩"}
                  </button>
                </div>
              </div>
            </div>
          </LeftPanelSection>

          {/* 4. 参数与区间调节 (按 group 分组) */}
          <LeftPanelSection title="参数调节" subtitle="改变研究区间与目标参数">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 5. 教学导引与题设背景 */}
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
        <div className="w-full h-full relative flex flex-col bg-white select-none">
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
          title="单自变量看板"
        />
      }
    />
  );
}
