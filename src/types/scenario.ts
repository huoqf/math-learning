import type { TipCardVariant } from "@/components/UI/TipCard";

/**
 * 全学科统一数学情景声明契约 (SSOT)
 * 适用于：函数导数特定模型、解析几何经典构型、立体几何截面/翻折、概率统计实验分布等
 */
export interface ScenarioSpec<TParams = Record<string, number>> {
  /** 场景唯一标识，对应 SelectGrid 或 TabSwitcher 的 key */
  id: string;
  /** 左屏选择器显示的纯中文名称（严禁包含公式） */
  name: string;
  /** 场景徽章，例如 "高考真题 · 极值点偏移" */
  badge: string;
  /** 初始条件 / 题设已知（支持混合 LaTeX 渲染） */
  condition: string;
  /** 核心设问 / 探究目标（直击数学本质，与右屏推导构成闭环） */
  question: string;
  /** 该场景锁定的初始或基准参数 */
  presetParams?: Partial<TParams>;
  /** 该情景锁定的参数键名列表（用于参数降维，锁定的参数自动隐藏或置灰） */
  lockedParamKeys?: (keyof TParams)[];
  /** 导向的右屏定理/方法标识 */
  theorems?: string[];
  /** 提示卡片视觉色彩变体 */
  variant?: TipCardVariant;
  /** 3D 几何范式：'synthetic'(综合法，禁坐标轴/向量) | 'vector'(空间向量坐标法，必须含建系或向量) */
  paradigm?: "synthetic" | "vector";
  /** 场景必标核心几何/学科特征线（如双垂直、射影垂足、渐近线） */
  requiredFeatures?: string[];
}

/**
 * 结构化教学提示输出对象
 */
export interface ScenarioTipProps {
  badge: string;
  condition: string;
  question: string;
  variant: TipCardVariant;
}
