import { useMemo, useCallback } from "react";
import type { ScenarioSpec, ScenarioTipProps } from "@/types/scenario";

interface UseScenarioOptions<
  TKey extends string,
  TParams extends Record<string, unknown>,
> {
  /** 场景规格列表 */
  scenarios: Record<TKey, ScenarioSpec<TParams>> | ScenarioSpec<TParams>[];
  /** 当前激活场景 key */
  activeKey: TKey;
  /** 当前参数状态 */
  params: TParams;
  /** 参数更新派发函数 */
  onParamsChange?: (next: TParams) => void;
}

/**
 * 数学情景统一驱动 Hook
 * - 单一事实源管理左屏 TipCard、参数锁定与降维
 * - 杜绝多级切换时题设与设问不联动
 */
export function useScenario<
  TKey extends string,
  TParams extends Record<string, unknown>,
>({
  scenarios,
  activeKey,
  params,
  onParamsChange,
}: UseScenarioOptions<TKey, TParams>) {
  // 统一转为 Map 访问
  const scenarioMap = useMemo(() => {
    if (Array.isArray(scenarios)) {
      const map = new Map<string, ScenarioSpec<TParams>>();
      scenarios.forEach((s) => map.set(s.id, s));
      return map;
    }
    return new Map<string, ScenarioSpec<TParams>>(Object.entries(scenarios));
  }, [scenarios]);

  // 当前场景
  const currentScenario = useMemo(() => {
    return scenarioMap.get(activeKey);
  }, [scenarioMap, activeKey]);

  // 输出给 TipCard 的结构化 Props
  const tipProps = useMemo<ScenarioTipProps | null>(() => {
    if (!currentScenario) return null;
    return {
      badge: currentScenario.badge,
      condition: currentScenario.condition,
      question: currentScenario.question,
      variant: currentScenario.variant ?? "primary",
    };
  }, [currentScenario]);

  // 场景切换回调，自动应用 presetParams
  const selectScenario = useCallback(
    (key: TKey) => {
      const target = scenarioMap.get(key);
      if (target && target.presetParams && onParamsChange) {
        onParamsChange({
          ...params,
          ...target.presetParams,
        });
      }
    },
    [scenarioMap, params, onParamsChange],
  );

  // 判定某个参数是否在当前场景被锁定（参数降维）
  const isParamLocked = useCallback(
    (paramKey: keyof TParams) => {
      return currentScenario?.lockedParamKeys?.includes(paramKey) ?? false;
    },
    [currentScenario],
  );

  return {
    currentScenario,
    tipProps,
    selectScenario,
    isParamLocked,
  };
}
