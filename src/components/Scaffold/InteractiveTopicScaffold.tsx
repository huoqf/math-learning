import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
  ParamControl,
  TipCard,
  Toggle,
  MathPanel,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale, useScenario } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import type { TopicDefinition } from "./types";

/**
 * 全学科统一声明式高阶数学页面脚手架 (InteractiveTopicScaffold)
 *
 * 核心架构使命：
 * 1. 物理固化左屏五级动线：模式 -> 情景 -> 参数 -> 开关 -> TipCard，剥夺乱序与倒挂机会；
 * 2. 内置反向解耦闭环：动点拖拽回调自动触发参数反算，并自动将场景脱轨切回 'free'；
 * 3. 统一三屏状态源 (SSOT)：中屏图形与右屏 MathPanel 纯函数消费同一份状态快照；
 * 4. 自动参数降维：根据当前 scenario 自动锁定并裁剪隐藏非必要参数。
 */
export function InteractiveTopicScaffold<
  TParams extends Record<string, number> = Record<string, number>,
  TMode extends string = string,
  TToggle extends string = string,
>({ topic }: { topic: TopicDefinition<TParams, TMode, TToggle> }) {
  const {
    modes = [],
    defaultMode,
    scenarios,
    defaultScenarioId = "free",
    defaultParams,
    paramMeta,
    layerToggles = [],
    builder,
    renderCenter,
    viewportPreset = "full",
    coordinateRange = { xRange: [-6, 6], yRange: [-4.5, 4.5] },
  } = topic;

  // 1. 顶层状态管理
  const [mode, setMode] = useState<TMode>(
    () => defaultMode ?? (modes[0]?.id as TMode) ?? ("default" as TMode),
  );
  const [scenarioId, setScenarioId] = useState<string>(defaultScenarioId);
  const [params, setParams] = useState<TParams>(() => ({ ...defaultParams }));
  const [layerStates, setLayerStates] = useState<Record<TToggle, boolean>>(
    () => {
      const initial = {} as Record<TToggle, boolean>;
      layerToggles.forEach((t) => {
        initial[t.id] = t.defaultValue ?? true;
      });
      return initial;
    },
  );

  // 2. 场景驱动器与参数降维 (useScenario)
  const { tipProps, selectScenario, isParamLocked } = useScenario<
    string,
    TParams
  >({
    scenarios,
    activeKey: scenarioId,
    params,
    onParamsChange: setParams,
  });

  // 3. 视口测量与自适应比例
  const presetConfig =
    viewportPreset === "square"
      ? CANVAS_PRESETS.square
      : viewportPreset === "splitV"
        ? CANVAS_PRESETS.splitV
        : viewportPreset === "splitH"
          ? CANVAS_PRESETS.splitH
          : CANVAS_PRESETS.full;

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: presetConfig,
  });

  const scale = useSceneScale({
    vp,
    xRange: coordinateRange.xRange,
    yRange: coordinateRange.yRange,
  });

  // 4. 动点拖拽反算回调 (自动脱轨切回 free)
  const handleDragParamChange = useCallback(
    (paramKey: keyof TParams, value: number) => {
      setParams((prev) => ({ ...prev, [paramKey]: value }));
      setScenarioId((prev) => (prev !== "free" ? "free" : prev));
    },
    [],
  );

  const handleBatchParamsChange = useCallback((updates: Partial<TParams>) => {
    setParams((prev) => ({ ...prev, ...updates }));
    setScenarioId((prev) => (prev !== "free" ? "free" : prev));
  }, []);

  // 5. 参数滑块元数据动态装配 (带降维过滤与 group 透传)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return (Object.keys(paramMeta) as (keyof TParams)[])
      .filter((key) => !isParamLocked(key))
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key: String(key),
          label: meta.label,
          labelFormula: meta.labelFormula,
          min: meta.min,
          max: meta.max,
          step: meta.step,
          value: params[key] ?? meta.defaultValue,
          group: meta.group,
          importance: meta.importance,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          marks: meta.marks,
          disabled: isParamLocked(key),
        };
      });
  }, [paramMeta, params, isParamLocked]);

  // 6. 右屏看板数据纯函数组装 (透传全部模式与图层上下文)
  const mathPanelData = useMemo(() => {
    return builder(params, {
      scenarioId,
      mode,
      activeMode: mode,
      studyMode: mode,
      ...layerStates,
    });
  }, [builder, params, scenarioId, mode, layerStates]);

  // 7. 场景选项列表解析为 SelectGrid 结构
  const scenarioItems = useMemo(() => {
    const list = Array.isArray(scenarios)
      ? scenarios
      : Object.values(scenarios);
    return list.map((s) => ({
      key: s.id,
      label: s.name,
      description: s.badge,
    }));
  }, [scenarios]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Level 1: 探究维度 / 大类模式 (若有多模式) */}
          {modes.length >= 2 && (
            <LeftPanelSection title="研究模式">
              <TabSwitcher
                tabs={modes.map((m) => ({ key: m.id, label: m.label }))}
                value={mode}
                onChange={(k) => setMode(k as TMode)}
                layout="horizontal"
              />
            </LeftPanelSection>
          )}

          {/* Level 2: 典型模型预设 (SelectGrid 双列对称) */}
          {scenarioItems.length >= 2 && (
            <LeftPanelSection title="典型情境母题">
              <SelectGrid
                items={scenarioItems}
                value={scenarioId}
                onChange={(k) => {
                  setScenarioId(k);
                  selectScenario(k);
                }}
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* Level 3: 核心参数调节 (ParamControl embedded 模式) */}
          {paramConfigs.length > 0 && (
            <LeftPanelSection title="参数调节">
              <ParamControl
                params={paramConfigs}
                onParamChange={(key: string, val: number) => {
                  setParams((prev) => ({ ...prev, [key]: val }));
                  setScenarioId((prev) => (prev !== "free" ? "free" : prev));
                }}
                variant="embedded"
              />
            </LeftPanelSection>
          )}

          {/* Level 4: 辅助开关与图层标注控制 (若有开关) */}
          {layerToggles.length > 0 && (
            <LeftPanelSection title="图层与标注控制" compact>
              <div className="space-y-1.5">
                {layerToggles.map((t) => (
                  <Toggle
                    key={t.id}
                    label={t.label}
                    checked={layerStates[t.id] ?? true}
                    onChange={(checked) =>
                      setLayerStates((prev) => ({ ...prev, [t.id]: checked }))
                    }
                    size="compact"
                  />
                ))}
              </div>
            </LeftPanelSection>
          )}

          {/* Level 5: 教学导引与核心设问 (TipCard 永远置于最底端) */}
          {tipProps && (
            <LeftPanelSection title="教学导引" compact>
              <TipCard
                variant={tipProps.variant}
                badge={tipProps.badge}
                condition={tipProps.condition}
                question={tipProps.question}
              />
            </LeftPanelSection>
          )}
        </LeftPanel>
      }
      center={
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center"
        >
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            {renderCenter({
              params,
              mode,
              layerStates,
              scenarioId,
              scale,
              fontScale: canvasSize.font,
              vp,
              onDragParamChange: handleDragParamChange,
              onBatchParamsChange: handleBatchParamsChange,
            })}
          </AnimationSvgCanvas>
        </div>
      }
      right={
        <MathPanel
          quantities={mathPanelData.quantities}
          theorems={mathPanelData.theorems}
          warnings={mathPanelData.warnings}
          reasoningSteps={mathPanelData.reasoningSteps}
          gaokaoPoints={mathPanelData.gaokaoPoints}
          examAnchor={mathPanelData.examAnchor}
          mnemonic={mathPanelData.mnemonic}
        />
      }
    />
  );
}
