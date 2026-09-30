import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export const defaultParams = {
  xa: 3,
  ya: 1,
  xb: 1,
  yb: 3,
  lambda: 1,
  mu: 1,

  // 模式二：三点共线
  xCoeff: 0.4,
  yCoeff: 0.6,

  // 模式三：基底分解
  xv: 4,
  yv: 3.5,
};

/**
 * 「单位向量化」典型预设的固定参数（3-4-5 直角三角形）。
 *
 * 为什么放在 registry 而不是组件内：
 *   ① 本库约定「预设参数属于数据层 SSOT」（对照 registries/vectorBasis.ts 的 presetsByMode）；
 *   ② 单测需要直接消费这组数值，才能把「预设 × 可见视口」的一致性固化成机器裁决项
 *      （见 src/test/vectorUnitVectorContract.test.tsx），组件内联的字面量无法被导入。
 *
 * 取值的教学理由：a = (3, 4) 时 |a| = 5、e_a = (0.6, 0.8)，单位化结果一眼可辨；
 * 和向量 λa + μb = (3, 0) 稳落在中屏可见横轴内（视口 x ∈ [−6, 6]）。
 */
export const unitVectorPresetParams = {
  xa: 3,
  ya: 4,
  xb: 0,
  yb: -4,
  lambda: 1,
  mu: 1,
};

/* ============================================================================
 * 实际背景（必修二 6.4.2 向量在物理中的应用举例）
 *
 * 三个情景共用「加减与数乘」模式的中屏画布与 math 层的同一套数值口径
 * （a、b、s = λa + μb），只是把两件数学外衣换成三件物理外衣：
 *   · 力的合成 —— 两个共点力求合力（平行四边形法则）；
 *   · 三力平衡 —— 已知两力求第三个平衡力，三力首尾相接必成闭合三角形；
 *   · 速度的合成 —— 船渡河：实际速度 = 静水船速 + 水流速度。
 * 因此**不新开页面、不新开模式**，只作为「加减与数乘」的一组典型预设，
 * 由 presetKey 派生出 physicsContext 供中屏 / 右屏同步特化。
 * ========================================================================== */

export type VectorPhysicsContext =
  "force-resultant" | "force-balance" | "velocity-compose";

export const VECTOR_PHYSICS_PRESET_KEYS: VectorPhysicsContext[] = [
  "force-resultant",
  "force-balance",
  "velocity-compose",
];

/**
 * 单个物理向量的命名。三处用途：中屏短标签 / 右屏看板用途名 / KaTeX 向量符号。
 *
 * 看板的「大小」行标签与「坐标」行标签由 `name` 派生（`${name}的大小` 等），
 * 模长符号由 `vecLatex` 派生（`|符号|`），避免同一件事在三个字段里各写一遍。
 */
export interface VectorPhysicsVectorNaming {
  /** 中屏画布上的短标签（SVG 纯文本，不经 KaTeX） */
  canvas: string;
  /**
   * 右屏看板里的用途名（如 "第一力"、"实际速度"）——**不含符号**。
   *
   * 看板的「大小」「坐标」行标签由 `name` 派生（`${name}的大小`），
   * 而符号另有 `vecLatex` 由 `|符号|` 派生填进 symbol 列。
   * 若把符号也塞进 name，标签就会变成「第一力 F₁的大小」这类中英夹生的写法。
   */
  name: string;
  /** KaTeX 向量符号（仅公式本身，**不含** $ 定界符） */
  vecLatex: string;
}

export interface VectorPhysicsNaming {
  first: VectorPhysicsVectorNaming;
  second: VectorPhysicsVectorNaming;
  /** 两已知向量的合成结果：合力（力的情景）或实际速度（速度情景） */
  resultant: VectorPhysicsVectorNaming;
  /**
   * 平衡力 F₃ = −(F₁ + F₂)（**仅三力平衡情景存在**）。
   * 有它 ⇒ 中屏必须补画「首尾相接的第三边」把三角形闭合，并隐藏与它必然重合的合力箭头。
   */
  third?: VectorPhysicsVectorNaming;
}

/**
 * 三个情景的预设参数与命名。
 *
 * 数值一律取 3-4-5 型直角三角形（两两垂直），理由是：
 *   ① 合力 / 实际速度大小恰为整数 5，学生一眼能验算 √(3² + 4²)；
 *   ② 三力平衡时闭合三角形正好是 3-4-5 直角三角形（5、3、4 三边），边角关系一目了然；
 *   ③ 全部关键点（最远 (4, 3)）都稳落在中屏可见视口 x∈[−6, 6]、y∈[−4.64, 4.64] 内，
 *      由 src/test/vectorUnitVectorContract.test.tsx 固化。
 */
export const VECTOR_PHYSICS_PRESETS: Record<
  VectorPhysicsContext,
  {
    label: string;
    description: string;
    /** 预设加载后写入左屏参数的完整增量（与 defaultParams 同键名） */
    params: Record<string, number>;
    /** 顶层悬浮公式的符号部分（不含 $；合成结果的坐标由组件追加） */
    equation: string;
    /** 右屏推导链第 1 步「物理建模」的场景化陈述（数据层 SSOT，builder 只负责组装） */
    model: string;
    naming: VectorPhysicsNaming;
  }
> = {
  "force-resultant": {
    label: "力的合成",
    description: "两互相垂直的力求合力",
    params: { xa: 4, ya: 0, xb: 0, yb: 3, lambda: 1, mu: 1 },
    equation: "\\vec{F} = \\vec{F}_1 + \\vec{F}_2",
    model:
      "两个力的作用点相同（共起点），把两力首尾相接后由起点指向终点的有向线段就是合力——先合成哪一个都不影响结果。",
    naming: {
      first: { canvas: "F₁", name: "第一力", vecLatex: "\\vec{F}_1" },
      second: { canvas: "F₂", name: "第二力", vecLatex: "\\vec{F}_2" },
      resultant: { canvas: "F", name: "合力", vecLatex: "\\vec{F}" },
    },
  },
  "force-balance": {
    label: "三力平衡",
    description: "三力首尾相接闭合三角形",
    params: { xa: 4, ya: 3, xb: 0, yb: -3, lambda: 1, mu: 1 },
    equation: "\\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3 = \\vec{0}",
    model:
      "物体在三个力共同作用下保持平衡，则三力首尾相接恰好构成一个闭合三角形，合力为零。",
    naming: {
      first: { canvas: "F₁", name: "第一力", vecLatex: "\\vec{F}_1" },
      second: { canvas: "F₂", name: "第二力", vecLatex: "\\vec{F}_2" },
      resultant: {
        canvas: "F₁+F₂",
        name: "两力合力",
        vecLatex: "\\vec{F}_1 + \\vec{F}_2",
      },
      third: { canvas: "F₃", name: "平衡力", vecLatex: "\\vec{F}_3" },
    },
  },
  "velocity-compose": {
    label: "速度的合成",
    description: "船渡河：船速与水流合成",
    params: { xa: 3, ya: 0, xb: 0, yb: 4, lambda: 1, mu: 1 },
    equation: "\\vec{v} = \\vec{v}_{\\text{水}} + \\vec{v}_{\\text{船}}",
    model:
      "小船渡河时同时参与两种运动：相对静水的划行与随水流的漂移，船的实际速度是这两个速度的向量和。",
    naming: {
      first: {
        canvas: "v水",
        name: "水流速度",
        vecLatex: "\\vec{v}_{\\text{水}}",
      },
      second: {
        canvas: "v船",
        name: "静水船速",
        vecLatex: "\\vec{v}_{\\text{船}}",
      },
      resultant: { canvas: "v", name: "实际速度", vecLatex: "\\vec{v}" },
    },
  },
};

/**
 * 纯 key 判定：该预设 key 是否属于物理三情景。
 *
 * 与 `resolveVectorPhysicsContext` 的分工：本函数**不看模式**，
 * 供「预设加载」「拖拽保留预设高亮」这类只关心 key 的场合使用；
 * 需要同时约束模式的场合用后者。有了类型守卫，调用方不必再写 `as` 断言，
 * 也就不会出现「断言写错、编译期无声通过」的漏洞。
 */
export function isVectorPhysicsContext(
  key: string,
): key is VectorPhysicsContext {
  return VECTOR_PHYSICS_PRESET_KEYS.includes(key as VectorPhysicsContext);
}

/**
 * 由「探究模式 + 典型预设 key」解出物理情景（非物理预设返回 null）。
 *
 * 该解析只认「加减与数乘」模式：三点共线模式里的 a、b 是 OA、OB，
 * 基本定理模式里的 a、b 是基底 e₁、e₂，都不是力或速度，硬套物理命名会造成概念污染。
 */
export function resolveVectorPhysicsContext(
  studyMode: string,
  presetKey: string,
): VectorPhysicsContext | null {
  if (studyMode !== "linearCombo") return null;
  return isVectorPhysicsContext(presetKey) ? presetKey : null;
}

export const paramMeta: Record<string, ParamMeta> = {
  xa: {
    key: "xa",
    label: "向量 a 横坐标",
    labelFormula: `\\text{向量 }\\color{${MATH_COLORS.paramPrimary}}{a_x}`,
    defaultValue: 3,
    min: -5,
    max: 5,
    step: 0.5,
    description: "向量 a 的水平分量",
    importance: "advanced",
    group: "基准向量 $a$ ($a_x, a_y$) 底模",
  },
  ya: {
    key: "ya",
    label: "向量 a 纵坐标",
    labelFormula: `\\text{向量 }\\color{${MATH_COLORS.paramPrimary}}{a_y}`,
    defaultValue: 1,
    min: -4.5,
    max: 4.5,
    step: 0.5,
    description: "向量 a 的竖直分量",
    importance: "advanced",
    group: "基准向量 $a$ ($a_x, a_y$) 底模",
  },
  xb: {
    key: "xb",
    label: "向量 b 横坐标",
    labelFormula: `\\text{向量 }\\color{${MATH_COLORS.paramSecondary}}{b_x}`,
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "向量 b 的水平分量",
    importance: "advanced",
    group: "基准向量 $b$ ($b_x, b_y$) 底模",
  },
  yb: {
    key: "yb",
    label: "向量 b 纵坐标",
    labelFormula: `\\text{向量 }\\color{${MATH_COLORS.paramSecondary}}{b_y}`,
    defaultValue: 3,
    min: -4.5,
    max: 4.5,
    step: 0.5,
    description: "向量 b 的竖直分量",
    importance: "advanced",
    group: "基准向量 $b$ ($b_x, b_y$) 底模",
  },
  lambda: {
    key: "lambda",
    label: "数乘系数 λ",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{\\lambda}`,
    defaultValue: 1,
    min: -3,
    max: 3,
    step: 0.1,
    description: "控制向量 a 的伸缩与反向",
    importance: "core",
    group: "数乘线性组合系数",
    marks: [
      { value: -1, label: "-1 (反向)" },
      { value: 0, label: "0 (零向量)", variant: "critical" },
      { value: 1, label: "1 (恒等)" },
    ],
  },
  mu: {
    key: "mu",
    label: "数乘系数 μ",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{\\mu}`,
    defaultValue: 1,
    min: -3,
    max: 3,
    step: 0.1,
    description: "控制向量 b 的伸缩与反向",
    importance: "core",
    group: "数乘线性组合系数",
    marks: [
      { value: -1, label: "-1 (反向)" },
      { value: 0, label: "0 (零向量)", variant: "critical" },
      { value: 1, label: "1 (恒等)" },
    ],
  },
  xCoeff: {
    key: "xCoeff",
    label: "共线系数 x",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x}`,
    defaultValue: 0.4,
    min: -1,
    max: 2,
    step: 0.05,
    description: "OC = x*OA + y*OB 中向量 OA 的权重",
    importance: "core",
    group: "三点共线分点权重 (OC = x·OA + y·OB)",
    marks: [
      { value: 0, label: "x=0 (C=B)", variant: "critical" },
      { value: 0.5, label: "x=0.5 (中点)" },
      { value: 1, label: "x=1 (C=A)", variant: "critical" },
    ],
  },
  yCoeff: {
    key: "yCoeff",
    label: "共线系数 y",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{y}`,
    defaultValue: 0.6,
    min: -1,
    max: 2,
    step: 0.05,
    description: "OC = x*OA + y*OB 中向量 OB 的权重",
    importance: "core",
    group: "三点共线分点权重 (OC = x·OA + y·OB)",
    marks: [
      { value: 0, label: "y=0", variant: "critical" },
      { value: 0.5, label: "y=0.5 (中点)" },
      { value: 1, label: "y=1", variant: "critical" },
    ],
  },
  xv: {
    key: "xv",
    label: "目标向量 v 横坐标",
    labelFormula: `\\text{目标向量 }\\color{${MATH_COLORS.paramPrimary}}{v_x}`,
    defaultValue: 4,
    min: -5,
    max: 5,
    step: 0.5,
    description: "待分解向量 v 的横坐标",
    importance: "core",
    group: "待分解目标向量 $v$ ($v_x, v_y$)",
  },
  yv: {
    key: "yv",
    label: "目标向量 v 纵坐标",
    labelFormula: `\\text{目标向量 }\\color{${MATH_COLORS.paramPrimary}}{v_y}`,
    defaultValue: 3.5,
    min: -4.5,
    max: 4.5,
    step: 0.5,
    description: "待分解向量 v 的纵坐标",
    importance: "core",
    group: "待分解目标向量 $v$ ($v_x, v_y$)",
  },
};
