import type {
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "@/components/UI";

export type { MathQuantity, Theorem, GaokaoPoint, WarningItem, ReasoningStep };

export interface MathPanelData {
  quantities: MathQuantity[];
  theorems: Theorem[];
  gaokaoPoints: GaokaoPoint[];
  warnings: WarningItem[];
  reasoningSteps?: ReasoningStep[];
  examAnchor?: string;
  mnemonic?: string;
}

/** 包裹 KaTeX 颜色 */
export function colorize(text: string, color: string): string {
  return `\\color{${color}}{${text}}`;
}

// ── Original types.ts exports ──

/**
 * 空间距离面板的模型词表（页面 config.mode 与 builder 分支判定的唯一事实源）。
 * 页面严禁再使用 "distance" 之类的自有别名，否则会落入 builder 的末位分支而错显内容。
 */
export type SpatialDistanceMode =
  "skewDistance" | "pointPlaneDistance" | "volumeExtrema";

export type GaokaoTopicKey =
  | "func_derivative"
  | "conic_geometry"
  | "solid_geometry"
  | "probability_statistics"
  | "sequence_series"
  | "vector_triangle"
  | "algebra_basics";

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

  /**
   * 课标定位（SSOT）：显式声明该知识点所属教材分册与学段状态。
   * - book：教材分册，如 "必修一" | "必修二" | "选择性必修一/二/三"
   * - status："正文"（课标必学）|"选学"（课标选学）|"拓展"（超出课标）|"竞赛"
   * 约定：status !== "正文" 时，importance 必须为 "extend"，
   *       且页面必须显示「拓展 · 超出课标」或「选学」徽标。
   */
  syllabus?: {
    book: string;
    status: "正文" | "选学" | "拓展" | "竞赛";
  };
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
