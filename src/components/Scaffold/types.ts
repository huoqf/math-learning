import type React from "react";
import type { ParamMeta, MathPanelData } from "@/data/types";
import type { ScenarioSpec } from "@/types/scenario";
import type { useAnimationViewport, useSceneScale } from "@/hooks";

export type ViewportInfoType = ReturnType<typeof useAnimationViewport>["vp"];
export type SceneScaleType = ReturnType<typeof useSceneScale>;

/**
 * 顶层模式切换项定义
 */
export interface TopicModeSpec<TMode extends string = string> {
  id: TMode;
  label: string;
  description?: string;
}

/**
 * 图层辅助开关项定义
 */
export interface LayerToggleSpec<TToggle extends string = string> {
  id: TToggle;
  label: string;
  defaultValue?: boolean;
}

/**
 * 全学科统一数学页面领域 DSL 定义契约 (TopicDefinition)
 * 物理杜绝页面散装拼装胶水代码导致的动线倒挂或上下文漏传
 */
export interface TopicDefinition<
  TParams extends Record<string, number> = Record<string, number>,
  TMode extends string = string,
  TToggle extends string = string,
> {
  /** 动画专题唯一标识 (与 routeEntries / buildMathQuantities 对应) */
  id: string;
  /** 专题学术中文标题 */
  title: string;
  /** 顶层探索模式列表 (可选，>=2 项时自动渲染 TabSwitcher) */
  modes?: TopicModeSpec<TMode>[];
  /** 默认选中的顶层模式 */
  defaultMode?: TMode;
  /** 典型模型场景列表 (必须包含首项 free 自由探索) */
  scenarios: Record<string, ScenarioSpec<TParams>> | ScenarioSpec<TParams>[];
  /** 默认选中的场景 key */
  defaultScenarioId?: string;
  /** 默认参数对象 */
  defaultParams: TParams;
  /** 参数元数据映射 */
  paramMeta: Record<keyof TParams, ParamMeta>;
  /** 图层与辅助开关列表 (可选，自动收敛至图层 Section 并单列/双列展示) */
  layerToggles?: LayerToggleSpec<TToggle>[];
  /** 右屏统一数据构建函数 */
  builder: (params: TParams, config?: Record<string, unknown>) => MathPanelData;
  /** 中屏主体渲染函数 (接收当前参数状态快照与动点拖拽反向解算回调) */
  renderCenter: (props: {
    params: TParams;
    mode: TMode;
    layerStates: Record<TToggle, boolean>;
    scenarioId: string;
    scale: SceneScaleType;
    fontScale: (base: number) => number;
    vp: ViewportInfoType;
    /** 动点拖拽反向解算回调 (自动将场景切回 free 并更新参数) */
    onDragParamChange: (paramKey: keyof TParams, value: number) => void;
    /** 批量更新参数回调 */
    onBatchParamsChange: (updates: Partial<TParams>) => void;
  }) => React.ReactNode;
  /** 视口 Preset (默认 full: 840x650) */
  viewportPreset?: "full" | "square" | "splitV" | "splitH";
  /** 2D 数学坐标系视口范围 [xMin, xMax], [yMin, yMax] */
  coordinateRange?: {
    xRange: [number, number];
    yRange: [number, number];
  };
}
