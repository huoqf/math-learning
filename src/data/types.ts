import type {
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "@/components/UI";

export type { MathQuantity, Theorem, GaokaoPoint, WarningItem };

export interface MathPanelData {
  quantities: MathQuantity[];
  theorems: Theorem[];
  gaokaoPoints: GaokaoPoint[];
  warnings: WarningItem[];
  mnemonic?: string;
}

/** 包裹 KaTeX 颜色 */
export function colorize(text: string, color: string): string {
  return `\\color{${color}}{${text}}`;
}

// ── Original types.ts exports ──

export type GaokaoTopicKey =
  | "func_derivative"
  | "conic_geometry"
  | "solid_geometry"
  | "probability_statistics"
  | "sequence_series"
  | "vector_triangle";

export type QuestionCategory =
  "foundation" | "multi_select_hard" | "solution_first" | "solution_final";

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
  /** 实验室页面标题（与 title 的知识点名称不同，用于 Header 面包屑） */
  labTitle?: string;
  /** 对应的路由路径（缺失则该节点显示为锁定） */
  route?: string;

  /** 新高考六大专题归属 */
  gaokaoTopic?: GaokaoTopicKey;
  /** 题型定位（客观基础 / 多选填空压轴 / 解答第1问 / 解答压轴） */
  questionCategory?: QuestionCategory;
  /** 高考核心通法与秒杀大招模型 */
  examMethod?: string;
  /** 高考考查权重星级 (1-5) */
  examWeight?: 1 | 2 | 3 | 4 | 5;
  /** 跨模块交汇主题 */
  crossThemes?: string[];
}

export type ParamImportance = "core" | "advanced" | "display";

export type ParamMarkVariant = "zero" | "critical" | "recommended";

export interface ParamMark {
  value: number;
  label?: string;
  labelFormula?: string;
  variant?: ParamMarkVariant;
}

export interface ParamMeta {
  key: string;
  label: string;
  labelFormula?: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  defaultValue?: number;
  group?: string;
  description?: string;
  descriptionFormula?: string;
  marks?: ParamMark[];
  importance?: ParamImportance;
  resetOnChange?: boolean;
}
