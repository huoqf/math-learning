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
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { defaultParams } from "@/data/registries/probabilityBayes";
import { buildMathQuantities } from "@/data/mathQuantities";
import { ProbabilityBayesScene } from "./components/ProbabilityBayesScene";
import {
  getModeFormulaLatex,
  getModeTipConfig,
  getModePanelTitle,
  buildParamConfigs,
  applyModeParamLinkage,
  type BayesMode,
  type CondScenario,
  type TotalScenario,
  type BayesScenario,
} from "./components/modeConfig";

export function ProbabilityBayesAnimation() {
  const location = useLocation();
  const initialMode = location.pathname.includes("bayes")
    ? "bayes"
    : "conditional";

  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const [activeMode, setActiveMode] = useState<BayesMode>(initialMode);
  const [isZoomedToA, setIsZoomedToA] = useState(false);

  // 各模式情境选择（自由探索 + 典型课标情景）
  const [condScenario, setCondScenario] = useState<CondScenario>("independent");
  const [totalScenario, setTotalScenario] = useState<TotalScenario>("factory3");
  const [bayesScenario, setBayesScenario] =
    useState<BayesScenario>("screening");

  // 1. 视口与缩放设置 (840 x 650 full preset)
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
    return buildMathQuantities("anim-probability-bayes", params, {
      activeMode,
      condScenario,
      totalScenario,
      bayesPreset: bayesScenario === "factory" ? "factory" : "screening",
    });
  }, [params, activeMode, condScenario, totalScenario, bayesScenario]);

  // 3. 悬浮 KaTeX 公式渲染
  const currentFormulaLatex = useMemo(
    () => getModeFormulaLatex(activeMode, params, totalScenario, bayesScenario),
    [activeMode, params, totalScenario, bayesScenario],
  );

  // 3.5. 左屏教学提示与题设导引
  const tipConfig = useMemo(
    () =>
      getModeTipConfig({
        activeMode,
        condScenario,
        totalScenario,
        bayesScenario,
      }),
    [activeMode, condScenario, totalScenario, bayesScenario],
  );

  // 4. 参数双向联动
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      applyModeParamLinkage(
        {
          activeMode,
          condScenario,
          totalScenario,
          bayesScenario,
        },
        key,
        value,
        next,
      );
      return next;
    });
  };

  // 5. 左屏参数配置
  const paramConfigs = useMemo<ParamConfig[]>(
    () =>
      buildParamConfigs(
        {
          activeMode,
          condScenario,
          totalScenario,
          bayesScenario,
        },
        params,
      ),
    [params, activeMode, condScenario, totalScenario, bayesScenario],
  );

  const handleReset = () => {
    setParams({ ...defaultParams });
    setCondScenario("independent");
    setTotalScenario("factory3");
    setBayesScenario("screening");
  };

  const panelTitle = useMemo(() => getModePanelTitle(activeMode), [activeMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 第 1 层：模式选择区 (精简为 3 个课标核心模式) */}
          <LeftPanelSection title="模式选择">
            <TabSwitcher
              tabs={[
                { key: "conditional", label: "条件概率" },
                { key: "total_prob", label: "全概率公式" },
                { key: "bayes", label: "贝叶斯由果溯因" },
              ]}
              value={activeMode}
              onChange={(k) => setActiveMode(k as typeof activeMode)}
            />
          </LeftPanelSection>

          {/* 第 2 层：典型情境选择 */}
          {activeMode === "conditional" && (
            <LeftPanelSection title="典型情境">
              <SelectGrid
                columns={2}
                items={[
                  { key: "free", label: "自由探索" },
                  { key: "independent", label: "相互独立模型" },
                  { key: "correlated", label: "包含/强相关" },
                  { key: "exclusive", label: "互斥事件模型" },
                ]}
                value={condScenario}
                onChange={(k) => {
                  const s = k as typeof condScenario;
                  setCondScenario(s);
                  if (s === "independent") {
                    setParams((prev) => ({
                      ...prev,
                      pA: 0.5,
                      pB: 0.4,
                      pAB: 0.2,
                    }));
                  } else if (s === "correlated") {
                    setParams((prev) => ({
                      ...prev,
                      pA: 0.5,
                      pB: 0.6,
                      pAB: 0.5,
                    }));
                  } else if (s === "exclusive") {
                    setParams((prev) => ({
                      ...prev,
                      pA: 0.5,
                      pB: 0.4,
                      pAB: 0.0,
                    }));
                  }
                }}
              />
            </LeftPanelSection>
          )}

          {activeMode === "total_prob" && (
            <LeftPanelSection title="典型情境">
              <SelectGrid
                columns={2}
                items={[
                  { key: "free", label: "自由探索" },
                  { key: "factory3", label: "三车间次品" },
                  { key: "balanced", label: "三等分均衡" },
                  { key: "warner", label: "Warner调查" },
                ]}
                value={totalScenario}
                onChange={(k) => {
                  const s = k as typeof totalScenario;
                  setTotalScenario(s);
                  if (s === "factory3") {
                    setParams((prev) => ({
                      ...prev,
                      pA1: 0.4,
                      pA2: 0.35,
                      pB_A1: 0.6,
                      pB_A2: 0.3,
                      pB_A3: 0.8,
                    }));
                  } else if (s === "balanced") {
                    setParams((prev) => ({
                      ...prev,
                      pA1: 0.33,
                      pA2: 0.33,
                      pB_A1: 0.5,
                      pB_A2: 0.5,
                      pB_A3: 0.5,
                    }));
                  } else if (s === "warner") {
                    setParams((prev) => ({
                      ...prev,
                      pCard: 0.8,
                      pReportYes: 0.36,
                    }));
                  }
                }}
              />
            </LeftPanelSection>
          )}

          {activeMode === "bayes" && (
            <LeftPanelSection title="典型情境">
              <SelectGrid
                columns={2}
                items={[
                  { key: "free", label: "自由探索" },
                  { key: "screening", label: "罕见病筛查" },
                  { key: "factory", label: "次品溯源" },
                ]}
                value={bayesScenario}
                onChange={(k) => {
                  const s = k as typeof bayesScenario;
                  setBayesScenario(s);
                  if (s === "screening") {
                    setParams((prev) => ({
                      ...prev,
                      pPriorD: 0.02,
                      pSensitivity: 0.95,
                      pFalsePositive: 0.05,
                    }));
                  } else if (s === "factory") {
                    setParams((prev) => ({
                      ...prev,
                      pPriorD: 0.08,
                      pSensitivity: 0.98,
                      pFalsePositive: 0.02,
                    }));
                  }
                }}
              />
            </LeftPanelSection>
          )}

          {/* 第 3 层：参数调节区 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 第 4 层：观察视角（条件概率模式专属） */}
          {activeMode === "conditional" && (
            <LeftPanelSection title="观察视角">
              <SelectGrid
                columns={2}
                items={[
                  {
                    key: "full",
                    label: "全集视角",
                    description: "样本空间 Ω",
                  },
                  {
                    key: "compressed",
                    label: "条件视角",
                    description: "缩减样本空间 A",
                  },
                ]}
                value={isZoomedToA ? "compressed" : "full"}
                onChange={(k) => setIsZoomedToA(k === "compressed")}
              />
            </LeftPanelSection>
          )}

          {/* 第 5 层：教学导引 */}
          <div className="mt-auto">
            <TipCard
              variant={tipConfig.variant}
              badge={tipConfig.badge}
              condition={tipConfig.condition}
              question={tipConfig.question}
            />
          </div>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative bg-white flex flex-col overflow-hidden">
          {/* 顶部数学公式 Bar */}
          <div className="h-[48px] shrink-0 border-b border-neutral-200/80 bg-neutral-50/90 backdrop-blur-sm px-4 flex items-center justify-between z-10 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-xs font-bold text-neutral-700">
                {activeMode === "conditional"
                  ? "条件概率与样本空间压缩模型"
                  : activeMode === "total_prob"
                    ? "完备事件组与全概率加权模型"
                    : "贝叶斯由果溯因与诊断模型"}
              </span>
            </div>
            <div className="flex items-center bg-white px-3 py-1 rounded-lg border border-neutral-200 shadow-2xs">
              <KatexFormula formula={currentFormulaLatex} />
            </div>
          </div>

          {/* SVG 画布 */}
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
                bayesPreset={
                  bayesScenario === "factory" ? "factory" : "screening"
                }
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
