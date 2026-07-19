export interface KnowledgeNode {
  id: string;
  title: string;
  chapter: string;
  module: string;
  importance: "basic" | "core" | "gaokao" | "hard" | "extend";
  animationIds: string[];
  prerequisites: string[];
  parentId?: string;
  animationParams?: Record<string, number>;
}

export type ParamImportance = "core" | "advanced" | "display";

export type ParamMarkVariant = "zero" | "critical" | "recommended";

export interface ParamMark {
  value: number;
  label?: string;
  variant?: ParamMarkVariant;
}

export interface ParamMeta {
  key: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  defaultValue?: number;
  group?: string;
  description?: string;
  marks?: ParamMark[];
  importance?: ParamImportance;
  resetOnChange?: boolean;
}
