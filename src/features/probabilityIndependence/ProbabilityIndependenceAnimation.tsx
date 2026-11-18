import React, { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  TabSwitcher,
  SelectGrid,
  TipCard,
  MathPanel,
} from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { useScenario } from "@/hooks/useScenario";
import {
  DEFAULT_PROBABILITY_INDEPENDENCE_PARAMS,
  PROBABILITY_INDEPENDENCE_SCENARIOS,
  PROBABILITY_INDEPENDENCE_PARAM_META,
  type ProbabilityIndependenceParams,
  type ProbabilityIndependenceScenarioKey,
} from "@/data/registries/probabilityIndependence";
import { buildMathQuantities } from "@/data/mathQuantities";
import { ProbabilityIndependenceScene } from "./components/ProbabilityIndependenceScene";
import { SceneLegend } from "@/components/Math";
import {
  calculateDiscreteDiceEvents,
  calculateIndependenceMeasure,
  type DiscreteDiceEventKey,
} from "@/math/probabilityIndependence";
import { formatMathNumber } from "@/utils/mathFormat";

const MODE_TABS = [
  { key: "venn", label: "连续概率测度" },
  { key: "discrete", label: "离散骰子模型" },
];

const VENN_SCENARIO_OPTIONS = [
  { key: "independent_model", label: "独立不互斥" },
  { key: "exclusive_model", label: "互斥不独立" },
  { key: "conditional_test", label: "条件等价判据" },
  { key: "free_explore", label: "连续自由探索" },
];

const DISCRETE_SCENARIO_OPTIONS = [
  { key: "dice_independent", label: "骰子独立模型" },
  { key: "dice_exclusive", label: "骰子互斥模型" },
  { key: "dice_correlated", label: "骰子相交相关" },
  { key: "dice_free", label: "骰子自由探究" },
];

const DICE_OPTIONS_A = [
  { key: "even", label: "偶数点" },
  { key: "prime", label: "质数点" },
  { key: "div3", label: "三的倍数" },
];

const DICE_OPTIONS_B = [
  { key: "le4", label: "点数不大于四" },
  { key: "gt4", label: "点数大于四" },
  { key: "odd", label: "奇数点" },
];

export const ProbabilityIndependenceAnimation: React.FC = () => {
  const [activePreset, setActivePreset] =
    useState<ProbabilityIndependenceScenarioKey>("independent_model");
  const [params, setParams] = useState<ProbabilityIndependenceParams>(
    DEFAULT_PROBABILITY_INDEPENDENCE_PARAMS,
  );

  // useScenario 驱动情景联动与参数锁定
  const { tipProps, selectScenario, isParamLocked } = useScenario<
    ProbabilityIndependenceScenarioKey,
    ProbabilityIndependenceParams
  >({
    scenarios: PROBABILITY_INDEPENDENCE_SCENARIOS,
    activeKey: activePreset,
    params,
    onParamsChange: setParams,
  });

  // 自由探究及骰子自由模式下按实时参数/事件 A, B 特化 TipCard 题设导引
  const activeTipProps = useMemo(() => {
    if (!tipProps) return undefined;
    if (activePreset === "free_explore") {
      const vennRes = calculateIndependenceMeasure(
        params.pA,
        params.pB,
        params.overlapRatio,
      );
      const statusText = vennRes.isIndependent
        ? "满足 $P(AB) = P(A)P(B)$（两事件相互独立）"
        : vennRes.isMutuallyExclusive
          ? "交集为 $0$，处于互斥但不独立状态"
          : "处于相交但非独立（概率相关）状态";
      return {
        ...tipProps,
        condition: `自由测度设定：$P(A) = ${formatMathNumber(vennRes.pA)}$，$P(B) = ${formatMathNumber(vennRes.pB)}$，当前积事件概率 $P(AB) = ${formatMathNumber(vennRes.pAB)}$，乘积基准 $P(A)P(B) = ${formatMathNumber(vennRes.pA * vennRes.pB)}$（${statusText}）。`,
        question: `(1) 调节滑块使 $P(AB)$ 对齐独立乘积基准；(2) 对比条件概率 $P(B|A) = ${vennRes.pConditionalBGivenA !== null ? formatMathNumber(vennRes.pConditionalBGivenA) : "\\text{未定义}"}$ 与 $P(B) = ${formatMathNumber(vennRes.pB)}$，验证两柱齐平等价性。`,
      };
    }
    if (activePreset !== "dice_free") return tipProps;

    const diceRes = calculateDiscreteDiceEvents(
      params.dicePresetA,
      params.dicePresetB,
    );
    return {
      ...tipProps,
      condition: `抛掷均匀骰子 $\\Omega = \\{1,2,3,4,5,6\\}$：当前设定事件 $A$ 为「${diceRes.eventA.name}」$\\{${diceRes.outcomesA.join(",")}\\}$ ($P(A)=${formatMathNumber(diceRes.pA)}$)，事件 $B$ 为「${diceRes.eventB.name}」$\\{${diceRes.outcomesB.join(",")}\\}$ ($P(B)=${formatMathNumber(diceRes.pB)}$)。`,
      question: `交集 $A \\cap B = \\{${diceRes.intersectionOutcomes.length > 0 ? diceRes.intersectionOutcomes.join(",") : "\\varnothing"}\\}$，比较 $P(AB) = ${diceRes.intersectionOutcomes.length}/6$ 与 $P(A)P(B) = ${diceRes.outcomesA.length * diceRes.outcomesB.length}/36$，判定 $A$ 与 $B$ 是互斥、相关还是相互独立？`,
    };
  }, [
    tipProps,
    activePreset,
    params.pA,
    params.pB,
    params.overlapRatio,
    params.dicePresetA,
    params.dicePresetB,
  ]);

  // 视口与缩放解构 (840×650 full preset)
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 参数更新句柄
  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    setActivePreset("free_explore");
  }, []);

  // 情景切换
  const handleScenarioChange = useCallback(
    (key: string) => {
      const nextKey = key as ProbabilityIndependenceScenarioKey;
      setActivePreset(nextKey);
      selectScenario(nextKey);
    },
    [selectScenario],
  );

  // 模式切换（联动对应模式的默认预设）
  const handleModeChange = useCallback(
    (modeKey: string) => {
      const nextMode = modeKey as "venn" | "discrete";
      const targetPreset =
        nextMode === "discrete" ? "dice_independent" : "independent_model";
      setActivePreset(targetPreset);
      selectScenario(targetPreset);
    },
    [selectScenario],
  );

  // 离散事件 A 切换
  const handleDiceAChange = useCallback((key: string) => {
    setParams((prev) => ({
      ...prev,
      dicePresetA: key as DiscreteDiceEventKey,
    }));
    setActivePreset("dice_free");
  }, []);

  // 离散事件 B 切换
  const handleDiceBChange = useCallback((key: string) => {
    setParams((prev) => ({
      ...prev,
      dicePresetB: key as DiscreteDiceEventKey,
    }));
    setActivePreset("dice_free");
  }, []);

  // 右屏数据实时组装
  const mathPanelData = useMemo(() => {
    return buildMathQuantities(
      "anim-probability-independence",
      params as unknown as Record<string, number>,
      { scenarioKey: activePreset },
    );
  }, [params, activePreset]);

  // 中屏图例
  const legendItems = useMemo(
    () => [
      { label: "事件 A (先验测度)", color: MATH_COLORS.paramPrimary },
      { label: "事件 B (先验测度)", color: MATH_COLORS.paramSecondary },
      { label: "交集 AB (独立/互斥指示)", color: MATH_COLORS.paramTertiary },
    ],
    [],
  );

  // 参数控制配置项
  const paramConfigs = useMemo(
    () => [
      {
        key: "pA",
        label: PROBABILITY_INDEPENDENCE_PARAM_META.pA.label,
        labelFormula: PROBABILITY_INDEPENDENCE_PARAM_META.pA.labelFormula,
        value: params.pA,
        min: PROBABILITY_INDEPENDENCE_PARAM_META.pA.min,
        max: PROBABILITY_INDEPENDENCE_PARAM_META.pA.max,
        step: PROBABILITY_INDEPENDENCE_PARAM_META.pA.step,
        disabled: isParamLocked("pA"),
      },
      {
        key: "pB",
        label: PROBABILITY_INDEPENDENCE_PARAM_META.pB.label,
        labelFormula: PROBABILITY_INDEPENDENCE_PARAM_META.pB.labelFormula,
        value: params.pB,
        min: PROBABILITY_INDEPENDENCE_PARAM_META.pB.min,
        max: PROBABILITY_INDEPENDENCE_PARAM_META.pB.max,
        step: PROBABILITY_INDEPENDENCE_PARAM_META.pB.step,
        disabled: isParamLocked("pB"),
      },
      {
        key: "overlapRatio",
        label: PROBABILITY_INDEPENDENCE_PARAM_META.overlapRatio.label,
        labelFormula:
          PROBABILITY_INDEPENDENCE_PARAM_META.overlapRatio.labelFormula,
        value: params.overlapRatio,
        min: PROBABILITY_INDEPENDENCE_PARAM_META.overlapRatio.min,
        max: PROBABILITY_INDEPENDENCE_PARAM_META.overlapRatio.max,
        step: PROBABILITY_INDEPENDENCE_PARAM_META.overlapRatio.step,
        disabled: isParamLocked("overlapRatio"),
      },
    ],
    [params.pA, params.pB, params.overlapRatio, isParamLocked],
  );

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 研究模式切换 */}
          <LeftPanelSection title="研究模式">
            <TabSwitcher
              tabs={MODE_TABS}
              value={params.activeMode}
              onChange={handleModeChange}
            />
          </LeftPanelSection>

          {/* 典型情景预设 */}
          <LeftPanelSection title="辨析情境选择">
            <SelectGrid
              items={
                params.activeMode === "venn"
                  ? VENN_SCENARIO_OPTIONS
                  : DISCRETE_SCENARIO_OPTIONS
              }
              value={activePreset}
              onChange={handleScenarioChange}
            />
          </LeftPanelSection>

          {/* 连续测度模式下的参数滑块 */}
          {params.activeMode === "venn" && (
            <LeftPanelSection title="测度参数调节">
              <ParamControl
                params={paramConfigs}
                onParamChange={handleParamChange}
                disabled={
                  isParamLocked("pA") ||
                  isParamLocked("pB") ||
                  isParamLocked("overlapRatio")
                }
              />
            </LeftPanelSection>
          )}

          {/* 离散骰子模式下的事件预设选择 */}
          {params.activeMode === "discrete" && (
            <>
              <LeftPanelSection title="事件 A 设定">
                <SelectGrid
                  items={DICE_OPTIONS_A}
                  value={params.dicePresetA}
                  onChange={handleDiceAChange}
                />
              </LeftPanelSection>
              <LeftPanelSection title="事件 B 设定">
                <SelectGrid
                  items={DICE_OPTIONS_B}
                  value={params.dicePresetB}
                  onChange={handleDiceBChange}
                />
              </LeftPanelSection>
            </>
          )}

          {/* 题设导引卡片 */}
          {activeTipProps && <TipCard {...activeTipProps} />}
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative">
          <SceneLegend
            items={legendItems}
            title={
              params.activeMode === "venn"
                ? "概率测度空间"
                : "等可能基本事件空间"
            }
            position="top-right"
          />
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ProbabilityIndependenceScene
              activeMode={params.activeMode}
              pA={params.pA}
              pB={params.pB}
              overlapRatio={params.overlapRatio}
              dicePresetA={params.dicePresetA}
              dicePresetB={params.dicePresetB}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={
        <MathPanel
          quantities={mathPanelData.quantities}
          reasoningSteps={mathPanelData.reasoningSteps}
          theorems={mathPanelData.theorems}
          gaokaoPoints={mathPanelData.gaokaoPoints}
          warnings={mathPanelData.warnings}
          examAnchor={mathPanelData.examAnchor}
          mnemonic={mathPanelData.mnemonic}
        />
      }
    />
  );
};

export default ProbabilityIndependenceAnimation;
