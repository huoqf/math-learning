import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { defaultParams, paramMeta } from "@/data/registries/probabilityBayes";
import { buildMathQuantities } from "@/data/mathQuantities";
import { ProbabilityBayesScene } from "./components/ProbabilityBayesScene";

export function ProbabilityBayesAnimation() {
  const location = useLocation();
  const initialMode = location.pathname.includes("markov")
    ? "markov"
    : location.pathname.includes("bayes")
      ? "bayes"
      : "conditional";

  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const [activeMode, setActiveMode] = useState<
    "conditional" | "total_prob" | "bayes" | "markov"
  >(initialMode);
  const [isZoomedToA, setIsZoomedToA] = useState(false);
  const [condPreset, setCondPreset] = useState<
    "independent" | "correlated" | "exclusive" | "custom"
  >("independent");
  const [totalPreset, setTotalPreset] = useState<
    "factory3" | "balanced" | "custom"
  >("factory3");
  const [bayesScenario, setBayesScenario] = useState<"screening" | "factory">(
    "screening",
  );
  const [bayesPreset, setBayesPreset] = useState<
    "screening" | "factory" | "survey" | "custom"
  >("screening");
  const [markovScenario, setMarkovScenario] = useState<
    "pass_ball" | "urn_ball" | "weather"
  >("pass_ball");
  const [markovPreset, setMarkovPreset] = useState<
    "pass_ball" | "urn_ball" | "weather" | "custom"
  >("pass_ball");

  // 1. 视口与缩放设置 (840 x 650 full preset)
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 2. 右屏 MathPanel 数据组装 (严格根据 bayesScenario / markovScenario 语义同步)
  const mathData = useMemo(() => {
    const animId =
      activeMode === "markov"
        ? "anim-probability-markov"
        : "anim-probability-bayes";
    return buildMathQuantities(animId, params, {
      activeMode,
      bayesPreset: bayesScenario,
      markovPreset: markovScenario,
    });
  }, [params, activeMode, bayesScenario, markovScenario]);

  // 3. 悬浮 KaTeX 公式渲染 (三位一体色彩深度绑定与全数值闭环)
  const currentFormulaLatex = useMemo(() => {
    if (activeMode === "conditional") {
      const pABVal = Math.min(
        params.pAB ?? 0.2,
        Math.min(params.pA ?? 0.5, params.pB ?? 0.4),
      ).toFixed(2);
      const pAVal = (params.pA ?? 0.5).toFixed(2);
      const pBGivenA =
        (params.pA ?? 0.5) > 0
          ? ((params.pAB ?? 0.2) / (params.pA ?? 0.5)).toFixed(3)
          : "\\text{无意义}";
      return `\\color{${MATH_COLORS.function}}{P(B|A)} = \\frac{\\color{${MATH_COLORS.paramTertiary}}{P(AB)}}{\\color{${MATH_COLORS.paramPrimary}}{P(A)}} = \\frac{${pABVal}}{${pAVal}} = ${pBGivenA}`;
    }
    if (activeMode === "total_prob") {
      const pA1 = params.pA1 ?? 0.4;
      const pA2 = params.pA2 ?? 0.35;
      const pA3 = Math.max(0, 1 - pA1 - pA2);
      const pB_A1 = params.pB_A1 ?? 0.6;
      const pB_A2 = params.pB_A2 ?? 0.3;
      const pB_A3 = params.pB_A3 ?? 0.8;
      const pB = pA1 * pB_A1 + pA2 * pB_A2 + pA3 * pB_A3;

      return `\\color{${MATH_COLORS.function}}{P(B)} = \\sum_{i=1}^3 P(A_i)P(B|A_i) = \\color{${MATH_COLORS.paramPrimary}}{${pA1.toFixed(2)}}\\times ${pB_A1.toFixed(2)} + \\color{${MATH_COLORS.paramSecondary}}{${pA2.toFixed(2)}}\\times ${pB_A2.toFixed(2)} + \\color{${MATH_COLORS.paramTertiary}}{${pA3.toFixed(2)}}\\times ${pB_A3.toFixed(2)} = ${(pB * 100).toFixed(2)}\\%`;
    }
    if (activeMode === "bayes") {
      const pD = params.pPriorD ?? 0.02;
      const pNotD = 1 - pD;
      const pSens = params.pSensitivity ?? 0.95;
      const pFalse = params.pFalsePositive ?? 0.05;

      const pTrueJoint = pD * pSens;
      const pFalseJoint = pNotD * pFalse;
      const pTotalPos = pTrueJoint + pFalseJoint;
      const pPosterior = pTotalPos > 0 ? (pTrueJoint / pTotalPos) * 100 : 0;

      const isFactory = bayesScenario === "factory";
      const targetSymbol = isFactory ? "\\text{Def}" : "D";

      return `\\color{${MATH_COLORS.derivative}}{P(${targetSymbol}|+)} = \\frac{${pD.toFixed(3)} \\times ${pSens.toFixed(2)}}{${pD.toFixed(3)} \\times ${pSens.toFixed(2)} + ${pNotD.toFixed(3)} \\times ${pFalse.toFixed(2)}} = ${pPosterior.toFixed(2)}\\%`;
    }
    // markov 模式
    const p11 = params.p11 ?? 0.0;
    const p21 = params.p21 ?? 0.5;
    const lambda = p11 - p21;
    const lambdaStr =
      lambda >= 0 ? lambda.toFixed(2) : `(${lambda.toFixed(2)})`;
    const betaStr = p21.toFixed(2);
    return `\\color{${MATH_COLORS.function}}{p_{n+1}} = p_{11} p_n + p_{21}(1-p_n) = ${lambdaStr} p_n + ${betaStr}`;
  }, [activeMode, params, bayesScenario]);

  // 4. 左屏声明式参数配置按 activeMode 精准过滤
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      conditional: ["pA", "pB", "pAB"],
      total_prob: ["pA1", "pA2", "pB_A1", "pB_A2", "pB_A3"],
      bayes: ["pPriorD", "pSensitivity", "pFalsePositive"],
      markov: ["p1", "p11", "p21", "maxN"],
    };

    const isFactory = bayesScenario === "factory";
    const keys = keysByMode[activeMode] ?? Object.keys(paramMeta);

    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        let label = meta.label;
        let labelFormula = meta.labelFormula;
        let description = meta.description;

        if (activeMode === "bayes" && isFactory) {
          if (key === "pPriorD") {
            label = "次品先验概率 P(Def)";
            labelFormula = "P(\\text{Def})";
            description = "流水线生产零配件的自然次品率";
          } else if (key === "pSensitivity") {
            label = "次品检出率 P(+|Def)";
            labelFormula = "P(+|\\text{Def})";
            description = "质检仪器在次品中准确检测出阳性的概率";
          } else if (key === "pFalsePositive") {
            label = "合格误判率 P(+|~Def)";
            labelFormula = "P(+|\\bar{\\text{Def}})";
            description = "质检仪器将合格品误判为次品的概率";
          }
        }

        return {
          key,
          label,
          labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.01,
          description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, activeMode, bayesScenario]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    if (activeMode === "conditional") setCondPreset("custom");
    else if (activeMode === "total_prob") setTotalPreset("custom");
    else if (activeMode === "bayes") setBayesPreset("custom");
    else if (activeMode === "markov") setMarkovPreset("custom");
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
    setCondPreset("independent");
    setTotalPreset("factory3");
    setBayesScenario("screening");
    setBayesPreset("screening");
    setMarkovScenario("pass_ball");
    setMarkovPreset("pass_ball");
  };

  const panelTitle = useMemo(() => {
    if (activeMode === "conditional") return "条件概率指标看板";
    if (activeMode === "total_prob") return "全概率公式指标看板";
    if (activeMode === "bayes") return "贝叶斯诊断指标看板";
    return "马尔可夫链状态转移递推看板";
  }, [activeMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择区 */}
          <LeftPanelSection
            title="模式选择"
            subtitle="从样本空间到状态转移递推"
          >
            <TabSwitcher
              tabs={[
                { key: "conditional", label: "条件概率", formula: "P(B|A)" },
                {
                  key: "total_prob",
                  label: "全概率公式",
                  formula: "P(B)=\\sum P_i P(B|A_i)",
                },
                { key: "bayes", label: "贝叶斯公式", formula: "P(A_k|B)" },
                {
                  key: "markov",
                  label: "马尔可夫链",
                  formula: "p_{n+1}=a p_n + b",
                },
              ]}
              value={activeMode}
              onChange={(k) => setActiveMode(k as typeof activeMode)}
            />
          </LeftPanelSection>

          {/* 条件概率专属：视角切换与高考经典预设 */}
          {activeMode === "conditional" && (
            <>
              <LeftPanelSection
                title="高考经典情境预设"
                subtitle="一键加载常考相关性模型"
              >
                <SelectGrid
                  columns={1}
                  items={[
                    {
                      key: "independent",
                      label: "相互独立模型",
                      description: "P(A)=0.5, P(B)=0.4, P(AB)=0.2",
                    },
                    {
                      key: "correlated",
                      label: "强正相关模型",
                      description: "P(A)=0.6, P(B)=0.5, P(AB)=0.45",
                    },
                    {
                      key: "exclusive",
                      label: "互斥事件模型",
                      description: "P(AB)=0, P(B|A)=0 (分母有效)",
                    },
                  ]}
                  value={condPreset === "custom" ? "" : condPreset}
                  onChange={(k) => {
                    if (k === "independent") {
                      setParams((prev) => ({
                        ...prev,
                        pA: 0.5,
                        pB: 0.4,
                        pAB: 0.2,
                      }));
                      setCondPreset("independent");
                    } else if (k === "correlated") {
                      setParams((prev) => ({
                        ...prev,
                        pA: 0.6,
                        pB: 0.5,
                        pAB: 0.45,
                      }));
                      setCondPreset("correlated");
                    } else if (k === "exclusive") {
                      setParams((prev) => ({
                        ...prev,
                        pA: 0.5,
                        pB: 0.4,
                        pAB: 0.0,
                      }));
                      setCondPreset("exclusive");
                    }
                  }}
                />
              </LeftPanelSection>

              <LeftPanelSection
                title="视角与样本空间"
                subtitle="观察已知 A 发生下的样本空间压缩"
              >
                <SelectGrid
                  columns={1}
                  items={[
                    {
                      key: "full",
                      label: "全样本空间 Ω",
                      description: "总体 Area = 1.0",
                    },
                    {
                      key: "compressed",
                      label: "压缩样本空间 A",
                      description: "已知 A 发生（新全集）",
                    },
                  ]}
                  value={isZoomedToA ? "compressed" : "full"}
                  onChange={(k) => setIsZoomedToA(k === "compressed")}
                />
              </LeftPanelSection>
            </>
          )}

          {/* 全概率公式专属：高考模型预设 */}
          {activeMode === "total_prob" && (
            <LeftPanelSection
              title="高考经典情境预设"
              subtitle="一键加载典型完备划分"
            >
              <SelectGrid
                columns={1}
                items={[
                  {
                    key: "factory3",
                    label: "三车间加工次品模型",
                    description: "P(A1)=0.4, P(A2)=0.35, P(A3)=0.25",
                  },
                  {
                    key: "balanced",
                    label: "三等分均衡模型",
                    description: "P(A1)=0.33, P(A2)=0.33, P(A3)=0.34",
                  },
                ]}
                value={totalPreset === "custom" ? "" : totalPreset}
                onChange={(k) => {
                  if (k === "factory3") {
                    setParams((prev) => ({
                      ...prev,
                      pA1: 0.4,
                      pA2: 0.35,
                      pB_A1: 0.6,
                      pB_A2: 0.3,
                      pB_A3: 0.8,
                    }));
                    setTotalPreset("factory3");
                  } else {
                    setParams((prev) => ({
                      ...prev,
                      pA1: 0.33,
                      pA2: 0.33,
                      pB_A1: 0.5,
                      pB_A2: 0.5,
                      pB_A3: 0.5,
                    }));
                    setTotalPreset("balanced");
                  }
                }}
              />
            </LeftPanelSection>
          )}

          {/* 贝叶斯专属：经典高考场景预设 */}
          {activeMode === "bayes" && (
            <LeftPanelSection
              title="高考经典场景预设"
              subtitle="一键加载常考应用模型"
            >
              <SelectGrid
                columns={1}
                items={[
                  {
                    key: "screening",
                    label: "罕见病筛查 (基率谬误)",
                    description: "患病率 P(D) = 2%, 灵敏度 95%",
                  },
                  {
                    key: "factory",
                    label: "工厂质检次品溯源",
                    description: "次品率 P(Def) = 8%, 检出率 98%",
                  },
                ]}
                value={bayesPreset === "custom" ? "" : bayesPreset}
                onChange={(k) => {
                  if (k === "screening") {
                    setParams((prev) => ({
                      ...prev,
                      pPriorD: 0.02,
                      pSensitivity: 0.95,
                      pFalsePositive: 0.05,
                    }));
                    setBayesPreset("screening");
                    setBayesScenario("screening");
                  } else {
                    setParams((prev) => ({
                      ...prev,
                      pPriorD: 0.08,
                      pSensitivity: 0.98,
                      pFalsePositive: 0.02,
                    }));
                    setBayesPreset("factory");
                    setBayesScenario("factory");
                  }
                }}
              />
            </LeftPanelSection>
          )}

          {/* 马尔可夫链专属：高考经典模型预设 */}
          {activeMode === "markov" && (
            <LeftPanelSection
              title="高考经典模型预设"
              subtitle="一键加载递推数列模型"
            >
              <SelectGrid
                columns={1}
                items={[
                  {
                    key: "pass_ball",
                    label: "甲乙传球问题",
                    description: "p11=0.0, p21=0.5 (震荡收敛于 1/3)",
                  },
                  {
                    key: "urn_ball",
                    label: "摸球替换模型",
                    description: "p11=0.6, p21=0.2 (单调收敛于 1/3)",
                  },
                  {
                    key: "weather",
                    label: "晴雨天气转移模型",
                    description: "p11=0.7, p21=0.4 (收敛于 4/7)",
                  },
                ]}
                value={markovPreset === "custom" ? "" : markovPreset}
                onChange={(k) => {
                  if (k === "pass_ball") {
                    setParams((prev) => ({
                      ...prev,
                      p1: 1.0,
                      p11: 0.0,
                      p21: 0.5,
                      maxN: 10,
                    }));
                    setMarkovPreset("pass_ball");
                    setMarkovScenario("pass_ball");
                  } else if (k === "urn_ball") {
                    setParams((prev) => ({
                      ...prev,
                      p1: 1.0,
                      p11: 0.6,
                      p21: 0.2,
                      maxN: 10,
                    }));
                    setMarkovPreset("urn_ball");
                    setMarkovScenario("urn_ball");
                  } else {
                    setParams((prev) => ({
                      ...prev,
                      p1: 1.0,
                      p11: 0.7,
                      p21: 0.4,
                      maxN: 10,
                    }));
                    setMarkovPreset("weather");
                    setMarkovScenario("weather");
                  }
                }}
              />
            </LeftPanelSection>
          )}

          {/* 参数调节区 */}
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块探索动态概率演化"
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
        <div className="w-full h-full relative bg-white flex flex-col overflow-hidden">
          {/* 顶部优雅数学公式 Bar (与画布空间完全隔离，杜绝遮挡) */}
          <div className="h-[48px] shrink-0 border-b border-neutral-200/80 bg-neutral-50/90 backdrop-blur-sm px-4 flex items-center justify-between z-10 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-xs font-bold text-neutral-700">
                {activeMode === "conditional"
                  ? "条件概率与样本空间压缩模型"
                  : activeMode === "total_prob"
                    ? "完备事件组与全概率加权模型"
                    : activeMode === "bayes"
                      ? "贝叶斯由果溯因与诊断模型"
                      : "马尔可夫链状态转移与全概递推模型"}
              </span>
            </div>
            <div className="flex items-center bg-white px-3 py-1 rounded-lg border border-neutral-200 shadow-2xs">
              <KatexFormula formula={currentFormulaLatex} />
            </div>
          </div>

          {/* SVG 动画画布区 */}
          <div className="flex-1 relative w-full h-full flex items-center justify-center">
            <AnimationSvgCanvas
              containerRef={containerRef}
              transform={vp.transform}
            >
              <ProbabilityBayesScene
                params={params}
                scale={scale}
                vp={vp}
                activeMode={activeMode}
                isZoomedToA={isZoomedToA}
                bayesPreset={bayesScenario}
                markovPreset={markovScenario}
                fontScale={canvasSize.font}
              />
            </AnimationSvgCanvas>
          </div>
        </div>
      }
      right={<MathPanel {...mathData} title={panelTitle} />}
    />
  );
}
