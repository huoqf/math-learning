import React, { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  type ParamConfig,
  TabSwitcher,
  SelectGrid,
  type SelectGridItem,
  TipCard,
  MathPanel,
  StepNavigator,
} from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { useScenario } from "@/hooks/useScenario";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import {
  DEFAULT_CLASSICAL_PARAMS,
  PROBABILITY_CLASSICAL_SCENARIOS,
  CLASSICAL_ANSWER_STEPS,
  type ClassicalParams,
  type ClassicalScenarioKey,
} from "@/data/registries/probabilityClassical";
import { buildClassicalProbabilityPanel } from "@/data/builders/probabilityClassical";
import { computeClassicalProbability } from "@/math/probabilityClassical";
import { ProbabilityClassicalScene } from "./components/ProbabilityClassicalScene";

export const ProbabilityClassicalAnimation: React.FC = () => {
  const [activePreset, setActivePreset] =
    useState<ClassicalScenarioKey>("dice_sum_seven");
  const [params, setParams] = useState<ClassicalParams>(
    DEFAULT_CLASSICAL_PARAMS,
  );
  const [currentStep, setCurrentStep] = useState<number>(1);

  // useScenario 驱动情景切换与参数锁定
  const { tipProps, selectScenario, isParamLocked } = useScenario<
    ClassicalScenarioKey,
    ClassicalParams
  >({
    scenarios: PROBABILITY_CLASSICAL_SCENARIOS,
    activeKey: activePreset,
    params,
    onParamsChange: setParams,
  });

  // 自由探究模式下根据当前试验模型动态特化题设三要素闭环
  const activeTipProps = useMemo(() => {
    if (!tipProps) return undefined;
    if (activePreset !== "free_explore") return tipProps;

    switch (params.modelType) {
      case "ball_draw":
        return {
          ...tipProps,
          background:
            "摸球抽样试验：袋中有红球与白球若干，可自由调节两色球数与抽样方式（不放回或有放回）。",
          condition: `当前设定：$${params.redBalls}$ 个红球与 $${params.whiteBalls}$ 个白球，${params.drawMode === "without_replacement" ? "不放回" : "有放回"}抽取 $2$ 球。样本空间总数为 $n(\\Omega) = ${params.drawMode === "without_replacement" ? (params.redBalls + params.whiteBalls) * (params.redBalls + params.whiteBalls - 1) : (params.redBalls + params.whiteBalls) ** 2}$。`,
          question:
            "(1) 计算两种抽样方式下的样本空间总数；(2) 证明目标事件概率与对立事件概率满足 $P(A) + P(\\overline{A}) = 1$。",
        };
      case "coin_toss":
        return {
          ...tipProps,
          background:
            "连续抛掷 $3$ 次均匀硬币试验：分步试验可自然展开为树状图分支路径。",
          condition:
            "由分步乘法计数原理，连续 $3$ 次抛掷构成的基本事件总数为 $n(\\Omega) = 2^3 = 8$。",
          question:
            "(1) 依据树状图列举目标事件包含的分步样本点；(2) 计算正面出现次数对应事件的概率 $P(A)$。",
        };
      case "gaokao_volunteer":
        return {
          ...tipProps,
          background:
            "志愿选人组合试验：从 $3$ 男 $2$ 女中随机选出 $2$ 名志愿者，属于无序组合抽样模型。",
          condition:
            "从 $5$ 名志愿者中无序抽取 $2$ 人，基本事件总数为 $n(\\Omega) = C_5^2 = 10$。",
          question:
            "(1) 规范写出无序抽取的全部等可能样本点；(2) 求解至少包含 $1$ 名女生的概率 $P(A)$。",
        };
      default:
        return tipProps;
    }
  }, [
    tipProps,
    activePreset,
    params.modelType,
    params.redBalls,
    params.whiteBalls,
    params.drawMode,
  ]);

  // 画布视口配置 (full preset: 840x650)
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 纯数学解算结果
  const mathRes = useMemo(() => {
    return computeClassicalProbability({
      modelType: params.modelType,
      targetEvent: params.targetEvent,
      targetSum: params.targetSum,
      drawMode: params.drawMode,
      redBalls: params.redBalls,
      whiteBalls: params.whiteBalls,
    });
  }, [
    params.modelType,
    params.targetEvent,
    params.targetSum,
    params.drawMode,
    params.redBalls,
    params.whiteBalls,
  ]);

  // 右屏数据看板
  const panelData = useMemo(() => {
    return buildClassicalProbabilityPanel(params, {
      activeView: params.activeView,
      scenarioKey: activePreset,
      focusStep: currentStep,
    });
  }, [params, activePreset, currentStep]);

  // 中屏图例配置
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    return [
      {
        label: `目标事件 A (${mathRes.eventCount} 个基本事件)`,
        color: MATH_COLORS.paramPrimary,
        shape: "circle",
      },
      {
        label: `样本空间 Ω 全体 (${mathRes.totalCount} 个等可能点)`,
        color: MATH_COLORS.primary,
        shape: "square",
      },
      {
        label: `对立事件 Ā (${mathRes.complementCount} 个)`,
        color: MATH_COLORS.paramSecondary,
        shape: "rect",
      },
    ];
  }, [mathRes.eventCount, mathRes.totalCount, mathRes.complementCount]);

  // 场景选择器选项 (SelectGridItem: { key, label })
  const scenarioItems = useMemo<SelectGridItem[]>(
    () => [
      { key: "dice_sum_seven", label: "掷骰求和" },
      { key: "dice_parity_sum", label: "点数相同" },
      { key: "ball_without_replace", label: "摸球正难则反" },
      { key: "coin_three_times", label: "三抛硬币" },
      { key: "gaokao_volunteer", label: "志愿选人" },
      { key: "free_explore", label: "自由探究" },
    ],
    [],
  );

  // 视图切换选项
  const viewTabs = useMemo(
    () => [
      { key: "matrix", label: "二维矩阵视图" },
      { key: "tree", label: "分步树状图视图" },
    ],
    [],
  );

  // 目标事件选项
  const diceEventItems = useMemo<SelectGridItem[]>(
    () => [
      { key: "sum_k", label: "点数之和等于指定值" },
      { key: "sum_ge_k", label: "点数之和不小于指定值" },
      { key: "same", label: "两枚点数相同" },
      { key: "sum_even", label: "点数之和为偶数" },
      { key: "diff_k", label: "两点数相差 1" },
      { key: "at_least_one_six", label: "至少出现一个 6 点" },
    ],
    [],
  );

  const ballEventItems = useMemo<SelectGridItem[]>(
    () => [
      { key: "at_least_one_red", label: "至少摸到 1 个红球" },
      { key: "both_red", label: "摸到 2 个均为红球" },
      { key: "one_red_one_white", label: "恰好摸到 1 红 1 白" },
      { key: "both_white", label: "摸到 2 个均为白球" },
    ],
    [],
  );

  const coinEventItems = useMemo<SelectGridItem[]>(
    () => [
      { key: "two_heads", label: "恰好出现 2 次正面" },
      { key: "at_least_two_heads", label: "至少出现 2 次正面" },
      { key: "three_heads", label: "三次均为正面" },
      { key: "at_most_one_head", label: "至多出现 1 次正面" },
      { key: "first_head", label: "第一次抛掷为正面" },
    ],
    [],
  );

  const volunteerEventItems = useMemo<SelectGridItem[]>(
    () => [
      { key: "at_least_one_girl", label: "至少有 1 名女生" },
      { key: "exactly_one_girl", label: "恰好有 1 名女生" },
      { key: "all_boys", label: "全是男生" },
      { key: "all_girls", label: "全是女生" },
    ],
    [],
  );

  const modelTypeItems = useMemo<SelectGridItem[]>(
    () => [
      { key: "dice_two", label: "两枚骰子" },
      { key: "ball_draw", label: "摸球抽样" },
      { key: "coin_toss", label: "三抛硬币" },
      { key: "gaokao_volunteer", label: "志愿选人" },
    ],
    [],
  );

  const drawModeTabs = useMemo(
    () => [
      { key: "without_replacement", label: "不放回抽样 (n=20)" },
      { key: "with_replacement", label: "有放回抽样 (n=25)" },
    ],
    [],
  );

  const handleScenarioChange = useCallback(
    (key: string) => {
      const scenarioKey = key as ClassicalScenarioKey;
      setActivePreset(scenarioKey);
      selectScenario(scenarioKey);
      setCurrentStep(1);
    },
    [selectScenario],
  );

  const handleViewChange = useCallback(
    (view: string) => {
      setParams((p: ClassicalParams) => ({
        ...p,
        activeView: view as "matrix" | "tree",
      }));
    },
    [setParams],
  );

  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((p: ClassicalParams) => ({
      ...p,
      [key]: value,
    }));
  }, []);

  const diceParams = useMemo<ParamConfig[]>(() => {
    if (params.targetEvent === "sum_k" || params.targetEvent === "sum_ge_k") {
      return [
        {
          key: "targetSum",
          label: "目标点数和 k",
          value: params.targetSum,
          min: 2,
          max: 12,
          step: 1,
        },
      ];
    }
    return [];
  }, [params.targetEvent, params.targetSum]);

  const ballParams = useMemo<ParamConfig[]>(() => {
    return [
      {
        key: "redBalls",
        label: "红球个数",
        value: params.redBalls,
        min: 1,
        max: 4,
        step: 1,
      },
      {
        key: "whiteBalls",
        label: "白球个数",
        value: params.whiteBalls,
        min: 1,
        max: 4,
        step: 1,
      },
    ];
  }, [params.redBalls, params.whiteBalls]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择：双视图切换 */}
          <LeftPanelSection title="展现形态">
            <TabSwitcher
              tabs={viewTabs}
              value={params.activeView}
              onChange={handleViewChange}
            />
          </LeftPanelSection>

          {/* 二级情景选择：纯中文双列网格 */}
          <LeftPanelSection title="典型问题情景">
            <SelectGrid
              items={scenarioItems}
              value={activePreset}
              onChange={handleScenarioChange}
              columns={2}
            />
          </LeftPanelSection>

          {/* 高考标准解答分步走导航器 */}
          <LeftPanelSection title="高考标准解答分步走">
            <StepNavigator
              steps={CLASSICAL_ANSWER_STEPS}
              active={currentStep}
              onChange={setCurrentStep}
              hint="中屏高亮图元，右屏同步聚焦该采分步推导"
            />
          </LeftPanelSection>

          {/* 参数降维控制 */}
          <LeftPanelSection title="试验与事件参数调节">
            {/* 自由探究模式下提供模型切换开关 */}
            {!isParamLocked("modelType") && (
              <div className="mb-3 pb-2 border-b border-white/10">
                <div className="text-xs text-text-muted mb-1.5 font-medium">
                  试验模型切换
                </div>
                <SelectGrid
                  items={modelTypeItems}
                  value={params.modelType}
                  onChange={(m) => {
                    const nextModel =
                      m as import("@/math/probabilityClassical").ClassicalModelType;
                    let defaultEvent = "sum_k";
                    let nextView: "matrix" | "tree" = params.activeView;
                    if (nextModel === "ball_draw")
                      defaultEvent = "at_least_one_red";
                    if (nextModel === "coin_toss") {
                      defaultEvent = "two_heads";
                      nextView = "tree";
                    }
                    if (nextModel === "gaokao_volunteer") {
                      defaultEvent = "at_least_one_girl";
                      nextView = "matrix";
                    }
                    if (nextModel === "dice_two") {
                      defaultEvent = "sum_k";
                      nextView = "matrix";
                    }
                    setParams((p: ClassicalParams) => ({
                      ...p,
                      modelType: nextModel,
                      targetEvent: defaultEvent,
                      activeView: nextView,
                    }));
                  }}
                  columns={2}
                />
              </div>
            )}

            {/* 1. 两枚骰子模型 */}
            {params.modelType === "dice_two" && (
              <>
                <SelectGrid
                  items={diceEventItems}
                  value={params.targetEvent}
                  onChange={(v) =>
                    setParams((p: ClassicalParams) => ({
                      ...p,
                      targetEvent: String(v),
                    }))
                  }
                  columns={1}
                />
                {!isParamLocked("targetSum") && diceParams.length > 0 && (
                  <div className="pt-2">
                    <ParamControl
                      params={diceParams}
                      onParamChange={handleParamChange}
                    />
                  </div>
                )}
              </>
            )}

            {/* 2. 摸球抽样模型 */}
            {params.modelType === "ball_draw" && (
              <>
                <div className="mb-2.5">
                  <TabSwitcher
                    tabs={drawModeTabs}
                    value={params.drawMode}
                    onChange={(mode) =>
                      setParams((p: ClassicalParams) => ({
                        ...p,
                        drawMode: mode as
                          "without_replacement" | "with_replacement",
                      }))
                    }
                  />
                </div>
                <SelectGrid
                  items={ballEventItems}
                  value={params.targetEvent}
                  onChange={(v) =>
                    setParams((p: ClassicalParams) => ({
                      ...p,
                      targetEvent: String(v),
                    }))
                  }
                  columns={1}
                />
                <div className="pt-2">
                  <ParamControl
                    params={ballParams}
                    onParamChange={handleParamChange}
                  />
                </div>
              </>
            )}

            {/* 3. 三抛硬币模型 */}
            {params.modelType === "coin_toss" && (
              <SelectGrid
                items={coinEventItems}
                value={params.targetEvent}
                onChange={(v) =>
                  setParams((p: ClassicalParams) => ({
                    ...p,
                    targetEvent: String(v),
                  }))
                }
                columns={1}
              />
            )}

            {/* 4. 志愿选人模型 */}
            {params.modelType === "gaokao_volunteer" && (
              <SelectGrid
                items={volunteerEventItems}
                value={params.targetEvent}
                onChange={(v) =>
                  setParams((p: ClassicalParams) => ({
                    ...p,
                    targetEvent: String(v),
                  }))
                }
                columns={1}
              />
            )}
          </LeftPanelSection>

          {/* 题设三要素闭环导引卡片 */}
          {activeTipProps && <TipCard {...activeTipProps} />}
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative">
          <SceneLegend
            items={legendItems}
            title="样本空间图例指示"
            position="top-right"
          />
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ProbabilityClassicalScene
              modelType={params.modelType}
              mathRes={mathRes}
              activeView={params.activeView}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              activeStep={currentStep}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={
        <MathPanel
          {...panelData}
          focusStep={currentStep}
          focusTarget="reasoning"
        />
      }
    />
  );
};

export default ProbabilityClassicalAnimation;
