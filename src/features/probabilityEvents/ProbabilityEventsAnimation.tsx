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
  DEFAULT_PROBABILITY_EVENTS_PARAMS,
  PROBABILITY_EVENTS_SCENARIOS,
  type ProbabilityEventsParams,
  type ProbabilityEventsScenarioKey,
} from "@/data/registries/probabilityEvents";
import { buildProbabilityEventsPanel } from "@/data/builders/probabilityEvents";
import { ProbabilityEventsScene } from "./components/ProbabilityEventsScene";
import { SceneLegend } from "@/components/Math";
import {
  calculateVennProbabilities,
  filterDiceEvents,
  type DiceEventPreset,
} from "@/math/probabilityEvents";

export const ProbabilityEventsAnimation: React.FC = () => {
  // 模式控制：连续文氏图测度 vs 离散点阵骰子
  const [activeMode, setActiveMode] = useState<"venn" | "discrete">("venn");
  const [activePreset, setActivePreset] =
    useState<ProbabilityEventsScenarioKey>("free");
  const [params, setParams] = useState<ProbabilityEventsParams>(
    DEFAULT_PROBABILITY_EVENTS_PARAMS,
  );

  // useScenario 驱动情景切换与参数锁定
  const { tipProps, selectScenario, isParamLocked } = useScenario<
    ProbabilityEventsScenarioKey,
    ProbabilityEventsParams
  >({
    scenarios: PROBABILITY_EVENTS_SCENARIOS,
    activeKey: activePreset,
    params,
    onParamsChange: setParams,
  });

  // 视口与缩放解构 (840×650 full preset)
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 离散事件集合判定
  const isDiscreteScenario = (k: ProbabilityEventsScenarioKey) =>
    k === "dice_parity_sum" ||
    k === "dice_opposite" ||
    k === "dice_inclusion" ||
    k === "dice_intersection";

  // 参数更新句柄
  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    if (key === "overlapRatio" || key === "pA" || key === "pB") {
      setActivePreset("free");
    }
  }, []);

  // 离散规则更新句柄 (自动切到离散自由定制)
  const handleDicePresetChange = useCallback(
    (key: "dicePresetA" | "dicePresetB", val: DiceEventPreset) => {
      setParams((prev) => ({ ...prev, [key]: val }));
      setActivePreset("dice_parity_sum");
    },
    [],
  );

  const handleScenarioChange = useCallback(
    (key: string) => {
      const nextKey = key as ProbabilityEventsScenarioKey;
      setActivePreset(nextKey);
      selectScenario(nextKey);
      const spec = PROBABILITY_EVENTS_SCENARIOS[nextKey];
      if (spec?.presetParams?.activeMode) {
        setActiveMode(spec.presetParams.activeMode);
      }
    },
    [selectScenario],
  );

  // 模式切换（双向自适应同步对应模式专属预设，彻底杜绝音画不同步）
  const handleModeChange = useCallback(
    (mode: "venn" | "discrete") => {
      setActiveMode(mode);
      if (mode === "discrete" && !isDiscreteScenario(activePreset)) {
        setActivePreset("dice_parity_sum");
        selectScenario("dice_parity_sum");
      } else if (mode === "venn" && isDiscreteScenario(activePreset)) {
        setActivePreset("free");
        selectScenario("free");
      }
    },
    [activePreset, selectScenario],
  );

  // 离散事件计算与特化题设 (AGENTS.md 公理 2：情景多级联动与真实背景交代)
  const discreteDiceRes = useMemo(
    () => filterDiceEvents(params.dicePresetA, params.dicePresetB),
    [params.dicePresetA, params.dicePresetB],
  );

  const effectiveTipProps = useMemo(() => {
    if (activeMode === "discrete") {
      const presetNameMap: Record<DiceEventPreset, string> = {
        sum_even: "点数之和为偶数",
        sum_odd: "点数之和为奇数",
        sum_ge_8: "点数之和不小于8",
        has_six: "至少有一枚点数为6",
        same_points: "两枚骰子点数相同",
        diff_le_1: "两点数差的绝对值不超过1",
        both_odd: "两枚骰子点数全为奇数",
        both_even: "两枚骰子点数全为偶数",
      };

      const nameA = presetNameMap[params.dicePresetA];
      const nameB = presetNameMap[params.dicePresetB];

      let relStr = "相交事件";
      if (discreteDiceRes.isOpposite) {
        relStr = "对立事件";
      } else if (discreteDiceRes.isMutuallyExclusive) {
        relStr = "互斥事件";
      } else if (
        discreteDiceRes.countIntersection === discreteDiceRes.countA ||
        discreteDiceRes.countIntersection === discreteDiceRes.countB
      ) {
        relStr = "包含关系";
      }

      const spec = PROBABILITY_EVENTS_SCENARIOS[activePreset];

      return {
        title: spec?.name
          ? `古典概型 · ${spec.name}`
          : "古典概型与离散事件探索",
        badge: spec?.badge ?? "高考真题 · 样本点阵列举",
        background:
          spec?.background ??
          "同时掷两枚质地均匀的骰子，试验的样本空间包含 $n(\\Omega) = 6 \\times 6 = 36$ 个等可能基本事件。",
        condition: `事件 $A$ 为“${nameA}”（包含 ${discreteDiceRes.countA} 个样本点），事件 $B$ 为“${nameB}”（包含 ${discreteDiceRes.countB} 个样本点）。`,
        question: `(1) 观察点阵分析两事件公共样本点数（$n(A \\cap B) = ${discreteDiceRes.countIntersection}$）；(2) 判定两事件关系属于【${relStr}】，并运用概率公式计算并事件概率 $P(A \\cup B)$。`,
        variant: (spec?.variant as "primary" | "info" | "accent") ?? "primary",
      };
    }
    return tipProps;
  }, [
    activeMode,
    tipProps,
    activePreset,
    params.dicePresetA,
    params.dicePresetB,
    discreteDiceRes,
  ]);

  // 滑块配置 (三位一体色彩映射)
  const paramConfigs = useMemo(() => {
    if (activeMode === "venn") {
      return [
        {
          key: "pA",
          label: "事件 A 概率",
          labelFormula: `\\text{概率 } \\color{${MATH_COLORS.paramPrimary}}{P(A)}`,
          value: params.pA,
          min: 0.05,
          max: 0.95,
          step: 0.05,
          group: "事件概率设定",
          disabled: isParamLocked("pA"),
        },
        {
          key: "pB",
          label: "事件 B 概率",
          labelFormula: `\\text{概率 } \\color{${MATH_COLORS.paramSecondary}}{P(B)}`,
          value: params.pB,
          min: 0.05,
          max: 0.95,
          step: 0.05,
          group: "事件概率设定",
          disabled: isParamLocked("pB"),
        },
        {
          key: "overlapRatio",
          label: "重叠度因子",
          labelFormula: `\\text{重叠 } \\color{${MATH_COLORS.paramTertiary}}{d}`,
          value: params.overlapRatio,
          min: 0.0,
          max: 1.0,
          step: 0.02,
          marks: [
            { value: 0.0, label: "互斥", variant: "critical" as const },
            { value: 1.0, label: "内含", variant: "critical" as const },
          ],
          group: "集合相交程度",
          disabled: isParamLocked("overlapRatio"),
        },
      ];
    }

    return [
      {
        key: "overlapRatio",
        label: "重叠因子",
        labelFormula: `\\text{重叠 } \\color{${MATH_COLORS.paramTertiary}}{d}`,
        value: params.overlapRatio,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        group: "离散分布参数",
        disabled: isParamLocked("overlapRatio"),
      },
    ];
  }, [activeMode, params.pA, params.pB, params.overlapRatio, isParamLocked]);

  // 情景预设选择器选项 (纯中文标题，公理 3.3，随当前模式自适应切换对应 4 项场景)
  const scenarioItems = useMemo(() => {
    if (activeMode === "discrete") {
      return [
        { key: "dice_parity_sum", label: "自由定制" },
        { key: "dice_opposite", label: "奇偶对立" },
        { key: "dice_inclusion", label: "奇偶包含" },
        { key: "dice_intersection", label: "相交加法" },
      ];
    }
    return [
      { key: "free", label: "自由探索" },
      { key: "disjoint_additive", label: "互斥加法" },
      { key: "opposite_events", label: "对立事件" },
      { key: "inclusion_relation", label: "包含关系" },
    ];
  }, [activeMode]);

  // 离散事件 A/B 下拉配置 (8 项规整 2 列布局)
  const dicePresetItems = useMemo(
    () => [
      { key: "sum_even", label: "和为偶数" },
      { key: "sum_odd", label: "和为奇数" },
      { key: "sum_ge_8", label: "和不小于八" },
      { key: "has_six", label: "含有点数六" },
      { key: "same_points", label: "两数相同" },
      { key: "diff_le_1", label: "差值不超一" },
      { key: "both_odd", label: "两数全为奇" },
      { key: "both_even", label: "两数全为偶" },
    ],
    [],
  );

  // 集合与事件运算高亮选项 (纯中文规范，两模式通用)
  const highlightItems = useMemo(
    () => [
      { key: "none", label: "全景全显" },
      { key: "union", label: "并事件" },
      { key: "intersection", label: "交事件" },
      { key: "onlyA", label: "差事件甲" },
      { key: "onlyB", label: "差事件乙" },
      { key: "notA", label: "对立事件甲" },
    ],
    [],
  );

  // 右屏看板数据 (联动 highlightOp 驱动数值高亮)
  const mathPanelData = useMemo(
    () =>
      buildProbabilityEventsPanel(
        {
          pA: params.pA,
          pB: params.pB,
          overlapRatio: params.overlapRatio,
          dicePresetA: params.dicePresetA,
          dicePresetB: params.dicePresetB,
          highlightOp: params.highlightOp,
        },
        { activeMode, animId: "anim-probability-events" },
      ),
    [
      params.pA,
      params.pB,
      params.overlapRatio,
      params.dicePresetA,
      params.dicePresetB,
      params.highlightOp,
      activeMode,
    ],
  );

  // 连续测度计算（图例与看板同频）
  const vennRes = useMemo(
    () => calculateVennProbabilities(params.pA, params.pB, params.overlapRatio),
    [params.pA, params.pB, params.overlapRatio],
  );

  // 中屏右上角图例项目 (统一 HTML 浮层定位)
  const legendItems = useMemo(() => {
    if (activeMode === "venn") {
      return [
        {
          label: `\\text{事件 } A: P(A) = ${vennRes.pA.toFixed(2)}`,
          color: MATH_COLORS.paramPrimary,
          style: "line" as const,
        },
        {
          label: `\\text{事件 } B: P(B) = ${vennRes.pB.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary,
          style: "line" as const,
        },
        {
          label: `\\text{交事件 } A \\cap B: P(A \\cap B) = ${vennRes.pIntersection.toFixed(2)}`,
          color: MATH_COLORS.paramTertiary,
          style: "line" as const,
        },
        {
          label: `\\text{并事件 } A \\cup B: P(A \\cup B) = ${vennRes.pUnion.toFixed(2)}`,
          color: MATH_COLORS.primary,
          style: "line" as const,
        },
      ];
    }
    return [
      {
        label: `\\text{事件 } A \\text{ 样本点}: n(A) = ${discreteDiceRes.countA}`,
        color: MATH_COLORS.paramPrimary,
        style: "point" as const,
      },
      {
        label: `\\text{事件 } B \\text{ 样本点}: n(B) = ${discreteDiceRes.countB}`,
        color: MATH_COLORS.paramSecondary,
        style: "point" as const,
      },
      {
        label: `\\text{交集 } A \\cap B: n(AB) = ${discreteDiceRes.countIntersection}`,
        color: MATH_COLORS.paramTertiary,
        style: "point" as const,
      },
    ];
  }, [activeMode, vennRes, discreteDiceRes]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式切换 */}
          <LeftPanelSection title="认知模式">
            <TabSwitcher
              tabs={[
                { key: "venn", label: "连续测度" },
                { key: "discrete", label: "掷骰点阵" },
              ]}
              value={activeMode}
              onChange={(v) => handleModeChange(v as "venn" | "discrete")}
              layout="horizontal"
            />
          </LeftPanelSection>

          {/* 情境选择 */}
          <LeftPanelSection title="典型教学情境">
            <SelectGrid
              items={scenarioItems}
              value={activePreset}
              onChange={handleScenarioChange}
              columns={2}
            />
          </LeftPanelSection>

          {/* 模式专属参数配置 */}
          {activeMode === "discrete" ? (
            <LeftPanelSection title="离散事件规则设定">
              <div className="space-y-2">
                <div className="text-xs text-slate-500 font-medium">
                  事件 A 规则定义：
                </div>
                <SelectGrid
                  items={dicePresetItems}
                  value={params.dicePresetA}
                  onChange={(v) =>
                    handleDicePresetChange("dicePresetA", v as DiceEventPreset)
                  }
                  columns={2}
                />
                <div className="text-xs text-slate-500 font-medium pt-1">
                  事件 B 规则定义：
                </div>
                <SelectGrid
                  items={dicePresetItems}
                  value={params.dicePresetB}
                  onChange={(v) =>
                    handleDicePresetChange("dicePresetB", v as DiceEventPreset)
                  }
                  columns={2}
                />
              </div>
            </LeftPanelSection>
          ) : (
            <LeftPanelSection title="核心概率参数">
              <ParamControl
                params={paramConfigs}
                onParamChange={handleParamChange}
              />
            </LeftPanelSection>
          )}

          {/* 事件运算聚焦（连续与离散双模式通用，3 列规整对称） */}
          <LeftPanelSection title="事件运算聚焦">
            <SelectGrid
              items={highlightItems}
              value={params.highlightOp}
              onChange={(v) =>
                setParams((p) => ({
                  ...p,
                  highlightOp: v as ProbabilityEventsParams["highlightOp"],
                }))
              }
              columns={3}
            />
          </LeftPanelSection>

          {/* 题设导引卡片 (题设三要素闭环与离散动态特化) */}
          <TipCard {...effectiveTipProps} />
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative">
          <SceneLegend
            items={legendItems}
            title={
              activeMode === "venn" ? "概率测度分布" : "36 个等可能基本事件"
            }
            position="top-right"
          />
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ProbabilityEventsScene
              activeMode={activeMode}
              pA={params.pA}
              pB={params.pB}
              overlapRatio={params.overlapRatio}
              dicePresetA={params.dicePresetA}
              dicePresetB={params.dicePresetB}
              highlightOp={params.highlightOp}
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
          quantities={mathPanelData.quantities}
          reasoningSteps={mathPanelData.reasoningSteps}
          theorems={mathPanelData.theorems}
          gaokaoPoints={mathPanelData.gaokaoPoints}
          warnings={mathPanelData.warnings}
          mnemonic={mathPanelData.mnemonic}
        />
      }
    />
  );
};
