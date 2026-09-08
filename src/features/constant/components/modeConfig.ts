/**
 * ConstantAnimation 声明式配置与纯逻辑封装
 *
 * 职责：
 *  - 统一单/双变量实验室的类型声明
 *  - 集中参数配置组装、中屏悬浮公式、左屏教学导引
 * 使 Animation 聚焦状态管理与 JSX 编排，业务配置全部下沉到此模块。
 */
import type { ParamConfig } from "@/components/UI";
import { MATH_COLORS } from "@/theme";
import { paramMeta } from "@/data/registries/constant";
import type { TransModelKey } from "@/math/constant";

/** 二级实验室 Tab */
export type ConstantTab = "single" | "double";
/** 单变量函数模型 */
export type FunModel = "transcendent" | "quadratic";
/** 单变量探索模式（参变分离 / 直接最值讨论） */
export type SingleSubMode = "sep" | "direct";
/** 单变量量词目标（恒成立 / 存在性） */
export type SingleLogic = "always" | "exist";
/** 双变量博弈量词关系 */
export type SelectedLogic =
  "all_all" | "all_exist" | "exist_all" | "exist_exist" | "same_var";

/** 左屏教学导引配置 */
export interface ConstantTipConfig {
  variant: "primary" | "info" | "warning";
  badge: string;
  condition: string;
  question: string;
}

/** buildParamConfigs 依赖上下文 */
export interface ParamConfigCtx {
  activeTab: ConstantTab;
  subMode: SingleSubMode;
  funModel: FunModel;
  params: Record<string, number>;
}

/**
 * 组装 ParamControl 参数配置
 * 单变量：按探索模式/函数模型动态调整值域与描述；双变量：顶点坐标分组
 */
export function buildParamConfigs({
  activeTab,
  subMode,
  funModel,
  params,
}: ParamConfigCtx): ParamConfig[] {
  const keys =
    activeTab === "single"
      ? subMode === "sep"
        ? ["a", "m", "n"]
        : ["a_axis", "m", "n"]
      : ["yf", "xf", "yg", "xg"];

  return keys.map((key) => {
    const meta = paramMeta[key];
    let min = meta.min;
    let max = meta.max;
    let step = meta.step ?? 0.05;
    let description = meta.description;
    let descriptionFormula = meta.descriptionFormula;
    let marks = meta.marks;

    let group = "";
    if (activeTab === "single") {
      group =
        key === "a" || key === "a_axis" ? "目标特征参数 a" : "研究区间 [m, n]";

      if (funModel === "transcendent") {
        if (key === "m") {
          min = 0.1;
          max = 3.0;
          description = "超越函数定义域 x > 0，左边界需大等于 0.1";
          descriptionFormula = "超越函数定义域 $x > 0$，左边界需大等于 0.1";
        } else if (key === "n") {
          min = 0.5;
          max = 5.0;
          description = "超越函数研究区间的右端点";
        } else if (key === "a") {
          min = -0.5;
          max = 2.0;
          step = 0.02;
          description = "【主参数-红】目标水平直线 y = a 的位置";
          descriptionFormula = "【主参数-红】目标水平直线 $y = a$ 的位置";
        } else if (key === "a_axis") {
          min = 0.1;
          max = 5.0;
          description = "【主参数-红】超越函数讨论参数 a";
          descriptionFormula = "【主参数-红】超越函数讨论参数 $a$";
        }
      } else {
        if (key === "a") {
          description = "【主参数-红】代表水平直线 y = a";
        } else if (key === "a_axis") {
          description = "【主参数-红】抛物线对称轴 x = a";
          marks = [
            {
              value: params.m,
              variant: "critical",
              label: `m=${params.m.toFixed(1)}`,
            },
            {
              value: params.n,
              variant: "critical",
              label: `n=${params.n.toFixed(1)}`,
            },
          ];
        }
      }
    } else {
      group =
        key === "xf" || key === "yf"
          ? "抛物线 f(x) 顶点与对称轴"
          : "抛物线 g(x) 顶点与对称轴";

      if (key === "yf") {
        description = "【主参数-红】控制抛物线 f(x) 顶点的 y_f 坐标";
      } else if (key === "yg") {
        description = "【次参数-橙】控制抛物线 g(x) 顶点的 y_g 坐标";
      }
    }

    return {
      key,
      label: meta.label,
      labelFormula: meta.labelFormula,
      value: params[key] ?? meta.defaultValue ?? 0,
      min,
      max,
      step,
      group,
      description,
      descriptionFormula,
      importance: meta.importance,
      marks,
    };
  });
}

/** buildFormulasLatex 依赖上下文 */
export interface FormulaCtx {
  activeTab: ConstantTab;
  subMode: SingleSubMode;
  funModel: FunModel;
  transModel: TransModelKey;
  selectedLogic: SelectedLogic;
  params: Record<string, number>;
}

/** 中屏悬浮 KaTeX 公式（行 1 主函数 / 行 2 区间或目标） */
export function buildFormulasLatex({
  activeTab,
  subMode,
  funModel,
  transModel,
  selectedLogic,
  params,
}: FormulaCtx): { line1: string; line2: string } {
  if (activeTab === "single") {
    if (subMode === "sep") {
      if (funModel === "transcendent") {
        let polyStr = "";
        if (transModel === "ln_x_over_x") polyStr = `f(x) = \\frac{\\ln x}{x}`;
        else if (transModel === "exp_minus_ax")
          polyStr = `f(x) = \\frac{e^x}{x}`;
        else if (transModel === "a_ln_x_minus_x")
          polyStr = `f(x) = \\ln x - x + 1`;
        else if (transModel === "exp_minus_a_x_plus_1")
          polyStr = `f(x) = \\frac{e^x}{x+1}`;
        const rangeStr = `x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
        const lineStr = `y = \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2)}}`;
        return { line1: `${polyStr} \\quad ${rangeStr}`, line2: lineStr };
      } else {
        const polyStr = `f(x) = x^2 - 2x + 2 \\quad x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
        const lineStr = `y = \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2)}}`;
        return { line1: polyStr, line2: lineStr };
      }
    } else {
      if (funModel === "transcendent") {
        let line1 = "";
        if (transModel === "ln_x_over_x" || transModel === "exp_minus_ax") {
          line1 = `f(x) = e^x - \\color{${MATH_COLORS.paramPrimary}}{${params.a_axis.toFixed(2)}}x`;
        } else if (transModel === "a_ln_x_minus_x") {
          line1 = `f(x) = \\color{${MATH_COLORS.paramPrimary}}{${params.a_axis.toFixed(2)}}\\ln x - x + 1`;
        } else if (transModel === "exp_minus_a_x_plus_1") {
          line1 = `f(x) = e^x - \\color{${MATH_COLORS.paramPrimary}}{${params.a_axis.toFixed(2)}}(x+1)`;
        }
        const line2 = `x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
        return { line1, line2 };
      } else {
        const line1 = `f(x) = x^2 - 2\\color{${MATH_COLORS.paramPrimary}}{(${params.a_axis.toFixed(2)})}x + 2`;
        const line2 = `x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
        return { line1, line2 };
      }
    }
  } else {
    if (selectedLogic === "same_var") {
      const fStr = `f(x) = (x - ${params.xf.toFixed(2)})^2 + \\color{${MATH_COLORS.paramPrimary}}{${params.yf.toFixed(2)}}, \\; g(x) = -(x - ${params.xg.toFixed(2)})^2 + \\color{${MATH_COLORS.paramSecondary}}{${params.yg.toFixed(2)}}`;
      const goalStr = `\\text{目标：对 } \\forall x \\in I_1 \\cap I_2 = [1.50, 2.00], \\; f(x) \\ge g(x)`;
      return { line1: fStr, line2: goalStr };
    } else {
      const fStr = `f(x) = (x - ${params.xf.toFixed(2)})^2 + \\color{${MATH_COLORS.paramPrimary}}{${params.yf.toFixed(2)}} \\quad x \\in [0.5, 2.0]`;
      const gStr = `g(x) = -(x - ${params.xg.toFixed(2)})^2 + \\color{${MATH_COLORS.paramSecondary}}{${params.yg.toFixed(2)}} \\quad x \\in [1.5, 3.0]`;
      return { line1: fStr, line2: gStr };
    }
  }
}

/** buildTipConfig 依赖上下文 */
export interface TipCtx {
  activeTab: ConstantTab;
  funModel: FunModel;
  transModel: TransModelKey;
  logic: SingleLogic;
  selectedLogic: SelectedLogic;
  m: number;
  n: number;
}

/** 左屏教学导引与题设背景 */
export function buildTipConfig({
  activeTab,
  funModel,
  transModel,
  logic,
  selectedLogic,
  m,
  n,
}: TipCtx): ConstantTipConfig {
  if (activeTab === "single") {
    const isAlways = logic === "always";
    const rangeText = `区间 [${m.toFixed(2)}, ${n.toFixed(2)}]`;

    if (funModel === "transcendent") {
      let modelName = "(ln x)/x";
      if (transModel === "exp_minus_ax") modelName = "eˣ - ax";
      else if (transModel === "a_ln_x_minus_x") modelName = "a ln x - x + 1";
      else if (transModel === "exp_minus_a_x_plus_1") modelName = "eˣ - a(x+1)";

      return {
        variant: isAlways ? "primary" : "warning",
        badge: isAlways
          ? `高考压轴 · 单变量 ${modelName} 恒成立`
          : `高考压轴 · 单变量 ${modelName} 存在性`,
        condition: `给定超越函数与参数 a，自变量限定在研究${rangeText}内。`,
        question: isAlways
          ? "求实数参数 a 的取值范围，使得不等式在给定区间内对任意 x 均恒成立。"
          : "求实数参数 a 的取值范围，使得不等式在给定区间内存在实数解（能成立）。",
      };
    } else {
      return {
        variant: isAlways ? "primary" : "warning",
        badge: isAlways
          ? "高考经典 · 二次函数含参恒成立 (轴动区间定)"
          : "高考经典 · 二次函数含参存在性 (能成立)",
        condition: `二次函数含参对称轴 x = a，自变量限定在研究${rangeText}内。`,
        question: isAlways
          ? "求实数参数 a 的取值范围，使得二次不等式在给定区间上恒成立。"
          : "求实数参数 a 的取值范围，使得二次不等式在给定区间上存在解。",
      };
    }
  } else {
    switch (selectedLogic) {
      case "all_all":
        return {
          variant: "primary",
          badge: "高考压轴 · 双变量任意对任意 (极值隔离)",
          condition:
            "给定函数 f(x) 与 g(x)，自变量区间分别为 [0.5, 2.0] 与 [1.5, 3.0]。",
          question:
            "求参数范围，使得对任意 x₁ 与任意 x₂，恒有 f(x₁) ≥ g(x₂) 成立。",
        };
      case "all_exist":
        return {
          variant: "info",
          badge: "高考压轴 · 任意对存在 (值域包含)",
          condition:
            "给定函数 f(x) 与 g(x)，自变量区间分别为 [0.5, 2.0] 与 [1.5, 3.0]。",
          question:
            "求参数范围，使得对任意 x₁，总存在 x₂ 满足 f(x₁) = g(x₂)（或 f(x₁) ≤ g(x₂)）。",
        };
      case "exist_all":
        return {
          variant: "warning",
          badge: "高考压轴 · 存在对任意 (最值压制)",
          condition:
            "给定函数 f(x) 与 g(x)，自变量区间分别为 [0.5, 2.0] 与 [1.5, 3.0]。",
          question:
            "求参数范围，使得存在 x₁，对任意 x₂ 均有 f(x₁) ≥ g(x₂) 成立。",
        };
      case "exist_exist":
        return {
          variant: "warning",
          badge: "高考压轴 · 存在对存在 (值域相交)",
          condition:
            "给定函数 f(x) 与 g(x)，自变量区间分别为 [0.5, 2.0] 与 [1.5, 3.0]。",
          question:
            "求参数范围，使得存在 x₁ 与 x₂ 满足 f(x₁) = g(x₂)（两函数图象有重合值域）。",
        };
      case "same_var":
        return {
          variant: "primary",
          badge: "高考压轴 · 同自变量对垒 (差函数)",
          condition: "在公共区间 x ∈ [1.5, 2.0] 上考察双函数 f(x) 与 g(x)。",
          question:
            "求参数范围，使得在公共区间内对任意相同自变量 x 均有 f(x) ≥ g(x)。",
        };
      default:
        return {
          variant: "primary",
          badge: "高考压轴 · 双变量博弈问题",
          condition: "考察两函数 f(x) 与 g(x) 在不同量词约束下的数值关系。",
          question: "求满足特定全称与存在量词不等式关系的参数取值范围。",
        };
    }
  }
}
