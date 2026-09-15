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
  TipCard,
} from "@/components/UI";
import { useAnimationViewport } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import {
  defaultParams,
  MARKOV_PRESETS,
} from "@/data/registries/probabilityMarkov";
import { buildMathQuantities } from "@/data/mathQuantities";
import { MarkovScene } from "./components/MarkovScene";
import {
  getMarkovFormulaLatex,
  getMarkovTipConfig,
  buildMarkovParamConfigs,
  type MarkovModelType,
} from "./components/modeConfig";

export function ProbabilityMarkovAnimation() {
  const [modelType, setModelType] = useState<MarkovModelType>("pass_ball");
  const [scenarioKey, setScenarioKey] = useState<string>("pass_ball_2020");

  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 1. 视口设置 (840 x 650 full preset)
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 2. 右屏 MathPanel 数据组装 (与情景严格同步)
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-probability-markov", params, {
      scenarioKey,
    });
  }, [params, scenarioKey]);

  // 3. 悬浮 KaTeX 公式
  const currentFormulaLatex = useMemo(
    () => getMarkovFormulaLatex(params),
    [params],
  );

  // 4. 左屏教学提示
  const tipConfig = useMemo(
    () => getMarkovTipConfig(modelType, scenarioKey),
    [modelType, scenarioKey],
  );

  // 5. 参数更改与联动 (带步数上限联动保护与自由探索自动切换)
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "maxN" && (next.currStep ?? 1) > value) {
        next.currStep = value;
      }
      return next;
    });
    if (key === "p1" || key === "p11" || key === "p21") {
      setScenarioKey("free");
    }
  };

  const handleReset = () => {
    const preset = MARKOV_PRESETS[scenarioKey];
    if (preset) {
      setParams({ ...preset.params });
    } else {
      setParams({ ...defaultParams });
    }
  };

  const paramConfigs = useMemo(() => buildMarkovParamConfigs(params), [params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 第 1 层：典型高考大题模型切换 */}
          <LeftPanelSection title="典型大题模型">
            <TabSwitcher
              tabs={[
                { key: "pass_ball", label: "传球 (振荡)" },
                { key: "urn_replace", label: "摸球 (单调)" },
                { key: "game_match", label: "比赛 (晋级)" },
                { key: "pure_oscillation", label: "发球 (等幅)" },
              ]}
              value={modelType}
              onChange={(k) => {
                const nextType = k as MarkovModelType;
                setModelType(nextType);
                if (nextType === "pass_ball") {
                  setScenarioKey("pass_ball_2020");
                  setParams({ ...MARKOV_PRESETS.pass_ball_2020.params });
                } else if (nextType === "urn_replace") {
                  setScenarioKey("urn_replace");
                  setParams({ ...MARKOV_PRESETS.urn_replace.params });
                } else if (nextType === "game_match") {
                  setScenarioKey("game_pingpong");
                  setParams({ ...MARKOV_PRESETS.game_pingpong.params });
                } else if (nextType === "pure_oscillation") {
                  setScenarioKey("pure_oscillation");
                  setParams({ ...MARKOV_PRESETS.pure_oscillation.params });
                }
              }}
            />
          </LeftPanelSection>

          {/* 第 2 层：典型高考真题情景 (首项规范为自由探索) */}
          <LeftPanelSection title="典型真题情景">
            {modelType === "pass_ball" && (
              <SelectGrid
                columns={1}
                items={[
                  { key: "free", label: "自由探索 (自定义参数)" },
                  {
                    key: "pass_ball_2020",
                    label: "2020全国卷·甲乙传球 (振荡衰减)",
                  },
                  {
                    key: "pass_ball_3",
                    label: "三人环传·对称降维模型",
                  },
                ]}
                value={scenarioKey}
                onChange={(k) => {
                  setScenarioKey(k);
                  if (MARKOV_PRESETS[k]) {
                    setParams({ ...MARKOV_PRESETS[k].params });
                  }
                }}
              />
            )}

            {modelType === "urn_replace" && (
              <SelectGrid
                columns={1}
                items={[
                  { key: "free", label: "自由探索 (自定义参数)" },
                  {
                    key: "urn_replace",
                    label: "摸球置换·单调递减收敛",
                  },
                ]}
                value={scenarioKey}
                onChange={(k) => {
                  setScenarioKey(k);
                  if (MARKOV_PRESETS[k]) {
                    setParams({ ...MARKOV_PRESETS[k].params });
                  }
                }}
              />
            )}

            {modelType === "game_match" && (
              <SelectGrid
                columns={1}
                items={[
                  { key: "free", label: "自由探索 (自定义参数)" },
                  {
                    key: "game_pingpong",
                    label: "2021新高考I卷·比赛平局加赛",
                  },
                ]}
                value={scenarioKey}
                onChange={(k) => {
                  setScenarioKey(k);
                  if (MARKOV_PRESETS[k]) {
                    setParams({ ...MARKOV_PRESETS[k].params });
                  }
                }}
              />
            )}

            {modelType === "pure_oscillation" && (
              <SelectGrid
                columns={1}
                items={[
                  { key: "free", label: "自由探索 (自定义参数)" },
                  {
                    key: "pure_oscillation",
                    label: "发球权轮换·永久等幅振荡",
                  },
                ]}
                value={scenarioKey}
                onChange={(k) => {
                  setScenarioKey(k);
                  if (MARKOV_PRESETS[k]) {
                    setParams({ ...MARKOV_PRESETS[k].params });
                  }
                }}
              />
            )}
          </LeftPanelSection>

          {/* 第 3 层：参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 第 4 层：教学导引 */}
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
          {/* 顶部悬浮数学公式 Bar */}
          <div className="h-[48px] shrink-0 border-b border-neutral-200/80 bg-neutral-50/90 backdrop-blur-sm px-4 flex items-center justify-between z-10 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-600"></span>
              <span className="text-xs font-bold text-neutral-700">
                新高考压轴 · 全概递推数列与等比构造实验室
              </span>
            </div>
            <div className="flex items-center bg-white px-3 py-1 rounded-lg border border-neutral-200 shadow-2xs">
              <KatexFormula formula={currentFormulaLatex} />
            </div>
          </div>

          {/* 中屏 SVG 画布 */}
          <div className="flex-1 relative w-full h-full flex items-center justify-center">
            <AnimationSvgCanvas
              containerRef={containerRef}
              transform={vp.transform}
            >
              <MarkovScene
                params={params}
                scenarioKey={scenarioKey}
                fontScale={canvasSize.font}
              />
            </AnimationSvgCanvas>
          </div>
        </div>
      }
      right={<MathPanel {...mathData} title="全概递推数列高考采分看板" />}
    />
  );
}
