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
  /** 刻度标签的 KaTeX 公式（优先于 label 纯文本） */
  labelFormula?: string;
  variant?: ParamMarkVariant;
}

export interface ParamMeta {
  key: string;
  label: string;
  /** 参数标签的 KaTeX 公式（优先于 label 纯文本） */
  labelFormula?: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  defaultValue?: number;
  group?: string;
  description?: string;
  /** 参数描述的 KaTeX 公式（优先于 description 纯文本） */
  descriptionFormula?: string;
  marks?: ParamMark[];
  importance?: ParamImportance;
  resetOnChange?: boolean;
}
