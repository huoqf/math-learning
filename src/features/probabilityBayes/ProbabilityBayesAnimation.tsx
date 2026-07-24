import { useState, useMemo } from "react";
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
import { buildProbabilityBayesPanel } from "@/data/builders/probabilityBayes";
import { ProbabilityBayesScene } from "./components/ProbabilityBayesScene";

export function ProbabilityBayesAnimation() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const [activeMode, setActiveMode] = useState<
    "conditional" | "total_prob" | "bayes"
  >("conditional");
  const [isZoomedToA, setIsZoomedToA] = useState(false);
  const [bayesPreset, setBayesPreset] = useState<
    "screening" | "factory" | "custom"
  >("screening");

  // 1. 视口与缩放设置
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 2. 右屏 MathPanel 数据组装
  const mathData = useMemo(() => {
    return buildProbabilityBayesPanel(params, { activeMode, bayesPreset });
  }, [params, activeMode, bayesPreset]);

  // 3. 悬浮 KaTeX 公式渲染 (支持完整的闭环代入)
  const currentFormulaLatex = useMemo(() => {
    if (activeMode === "conditional") {
      const pABVal = Math.min(
        params.pAB,
        Math.min(params.pA, params.pB),
      ).toFixed(2);
      const pAVal = params.pA.toFixed(2);
      const pBGivenA =
        params.pA > 0 ? (params.pAB / params.pA).toFixed(3) : "\\text{无意义}";
      return `\\color{${MATH_COLORS.function}}{P(B|A)} = \\frac{\\color{${MATH_COLORS.paramTertiary}}{P(AB)}}{\\color{${MATH_COLORS.paramPrimary}}{P(A)}} = \\frac{${pABVal}}{${pAVal}} = ${pBGivenA}`;
    }
    if (activeMode === "total_prob") {
      const pA1 = (params.pA1 ?? 0.4).toFixed(2);
      const pA2 = (params.pA2 ?? 0.35).toFixed(2);
      const pA3 = Math.max(0, 1 - params.pA1 - params.pA2).toFixed(2);
      return `\\color{${MATH_COLORS.function}}{P(B)} = \\sum_{i=1}^3 P(A_i)P(B|A_i) = ${pA1}\\cdot P(B|A_1) + ${pA2}\\cdot P(B|A_2) + ${pA3}\\cdot P(B|A_3)`;
    }
    // bayes 模式
    const pD = params.pPriorD ?? 0.02;
    const pNotD = 1 - pD;
    const pSens = params.pSensitivity ?? 0.95;
    const pFalse = params.pFalsePositive ?? 0.05;

    const pTrueJoint = pD * pSens;
    const pFalseJoint = pNotD * pFalse;
    const pTotalPos = pTrueJoint + pFalseJoint;
    const pPosterior = pTotalPos > 0 ? (pTrueJoint / pTotalPos) * 100 : 0;

    const isFactory = bayesPreset === "factory";
    const targetSymbol = isFactory ? "\\text{Def}" : "D";

    return `\\color{${MATH_COLORS.derivative}}{P(${targetSymbol}|+)} = \\frac{${pD.toFixed(3)} \\times ${pSens.toFixed(2)}}{${pD.toFixed(3)} \\times ${pSens.toFixed(2)} + ${pNotD.toFixed(3)} \\times ${pFalse.toFixed(2)}} = ${pPosterior.toFixed(2)}\\%`;
  }, [activeMode, params, bayesPreset]);

  // 4. 左屏声明式参数配置按 activeMode 精准过滤与名称动态适配
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      conditional: ["pA", "pB", "pAB"],
      total_prob: ["pA1", "pA2", "pB_A1", "pB_A2", "pB_A3"],
      bayes: ["pPriorD", "pSensitivity", "pFalsePositive"],
    };

    const isFactory = bayesPreset === "factory";
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
          importance: meta.importance as any,
          marks: meta.marks,
        };
      });
  }, [params, activeMode, bayesPreset]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    if (activeMode === "bayes") {
      setBayesPreset("custom");
    }
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
    setBayesPreset("screening");
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择区 */}
          <LeftPanelSection title="模式选择" subtitle="从样本空间到逆向诊断">
            <TabSwitcher
              tabs={[
                { key: "conditional", label: "条件概率", formula: "P(B|A)" },
                {
                  key: "total_prob",
                  label: "全概率公式",
                  formula: "P(B)=\\sum P_i P(B|A_i)",
                },
                { key: "bayes", label: "贝叶斯公式", formula: "P(A_k|B)" },
              ]}
              value={activeMode}
              onChange={(k) => setActiveMode(k as any)}
            />
          </LeftPanelSection>

          {/* 条件概率专属：视觉压缩视角开关 */}
          {activeMode === "conditional" && (
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
                    description: "Area = 1.0",
                  },
                  {
                    key: "compressed",
                    label: "压缩样本空间 A",
                    description: "已知 A 发生",
                  },
                ]}
                value={isZoomedToA ? "compressed" : "full"}
                onChange={(k) => setIsZoomedToA(k === "compressed")}
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
                    label: "罕见病筛查",
                    description: "患病率 P(D) = 2%, 灵敏度 95%",
                  },
                  {
                    key: "factory",
                    label: "工厂次品检验",
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
                  } else {
                    setParams((prev) => ({
                      ...prev,
                      pPriorD: 0.08,
                      pSensitivity: 0.98,
                      pFalsePositive: 0.02,
                    }));
                    setBayesPreset("factory");
                  }
                }}
              />
            </LeftPanelSection>
          )}

          {/* 参数调节区 */}
          <LeftPanelSection
            title="动态参数调节"
            subtitle="拖动滑块观察图象与公式联动"
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
          {/* 顶栏 KatexFormula 悬浮卡片 — 置于右上角 */}
          <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm max-w-[65%] overflow-hidden">
            <KatexFormula
              formula={currentFormulaLatex}
              mode="inline"
              className="!text-[13px]"
            />
          </div>

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
              bayesPreset={bayesPreset || ""}
              fontScale={canvasSize.font}
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
          title="条件概率与贝叶斯看板"
        />
      }
    />
  );
}
