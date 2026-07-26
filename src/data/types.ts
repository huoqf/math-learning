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
