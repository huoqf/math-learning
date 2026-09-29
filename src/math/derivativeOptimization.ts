/**
 * 导数实际生活优化建模纯数学层
 * 遵循系统公理 1：纯函数、零副作用、无 DOM/React 依赖
 * 涵盖高考三大经典优化建模：
 * 1. box: 正方形铁皮剪角折叠无盖长方体容积最大化 V(x) = x(L - 2x)^2
 * 2. can: 给定容积圆柱体易拉罐用料最省表面积最小化 S(r) = 2πr^2 + 2V/r
 * 3. profit: 企业生产销售总利润最大化 P(x) = (p0 - a x)x - (c0 + c1 x)
 */

import { formatMathNumber, formatSignedTerm } from "@/utils/mathFormat";

export type OptimizationModelType = "box" | "can" | "profit";

/**
 * 利润模型的**独立变量**（题设给定的四个市场/成本参数）。
 *
 * 为什么单独抽出来：目标函数 `P(x) = -a x² + (p₀ - c₁)x - c₀` 的三个系数里，
 * `b` 与 `c` 并不是"题设给的新数字"，而是这四个量的代数组合。旧实现把
 * `b: 40` 与 `priceBase - costUnit = 50 - 10` 同时写进常量表 —— 改 `priceBase` 却
 * 忘了改 `b`，目标函数与解析式就会静默错位（同一页两套口径）。`c: 200` 与
 * `costFixed: 200` 是同一笔固定成本的两次书写，同理。故先声明独立变量，
 * 再由它们**推导**出 `b` / `c`（见下表），等式关系只有一处。
 */
const PROFIT_BASE = {
  /** 需求价格弹性系数：单价随产量线性折让 `p(x) = p₀ - a x` 的斜率 */
  a: 0.5,
  /** 基准单价 p₀（元/件） */
  priceBase: 50,
  /** 单位可变成本 c₁（元/件） */
  costUnit: 10,
  /** 固定成本 c₀（元） */
  costFixed: 200,
} as const;

/** 每套模型的自变量**教学可调区间**（左屏滑块域 = 图形侧拖拽域 = 数值安全边界） */
export type OptimizationSliderRange = readonly [number, number];

/**
 * 三套模型的**数值常量与自变量区间唯一事实源**。
 *
 * 为什么必须集中：这些数字同时出现在目标函数解析式、定义域不等式、导数为零的方程与最值结论里，
 * 一旦在 math 层算一套、在 builder 文案里再手写一套（如 60 / 600 / 1200 / 40），
 * 改一个就必须记得改另一个，是典型的"两套口径"隐雷。builder 与注册表都直接读本表。
 *
 * `slider` 一列同时被三处消费，任何一处单独改动都会立刻自相矛盾，故只能有一个来源：
 *   · `calculateOptimizationModel` 的数值截断边界（`dragMin` / `dragMax`）；
 *   · `registries/derivativeOptimization.ts` 的左屏滑块 `min` / `max`；
 *   · `DerivativeOptimizationScene` 的 `paramDragRange` 拖拽域（由注册表传入）。
 * 旧实现里 math 层另有 [0.5, 29.5] / [1.0, 10.0] / [5, 70] 三个手写边界，
 * 与滑块域 [1, 28] / [1.5, 9] / [10, 65] 各写一套 —— 拖拽可跑到滑块读数之外，读数与图形脱节。
 */
export const OPTIMIZATION_CONSTANTS = {
  box: {
    /** 正方形铁皮边长 L（cm） */
    L: 60,
    /** 自变量 x（剪角边长）的可调区间：两端内缩于物理定义域 (0, L/2)，避开退化端点 */
    slider: [1, 28] as OptimizationSliderRange,
  },
  can: {
    /** 圆柱易拉罐的规定容积 V（cm³）—— 高考题中的**题设常量**，非可调参数 */
    V: 600,
    /** 自变量 r（底面半径）的可调区间：避开 r → 0⁺ 的奇异端点 */
    slider: [1.5, 9] as OptimizationSliderRange,
  },
  profit: {
    ...PROFIT_BASE,
    /**
     * 边际贡献 `b = p₀ − c₁`（元/件）：**由独立变量推导**，严禁再手写 40 ——
     * 否则改动 `priceBase` 或 `costUnit` 时 b 会静默失配，目标函数与最优产量同时错。
     */
    b: PROFIT_BASE.priceBase - PROFIT_BASE.costUnit,
    /** 目标函数常数项 `c = c₀`：同一笔固定成本只写一次（旧实现另有 `c: 200` 与 `costFixed: 200` 两份） */
    c: PROFIT_BASE.costFixed,
    /** 自变量 x（产量）的可调区间 */
    slider: [10, 65] as OptimizationSliderRange,
  },
} as const;

export interface OptimizationResult {
  modelType: OptimizationModelType;
  xVal: number; // 当前自变量取值（已按数值安全边界截断）
  yVal: number; // 当前目标函数值
  primeVal: number; // 当前瞬时导数值
  optimalX: number; // 理论最优点 x*
  optimalY: number; // 理论最优值 y*
  /** 物理定义域下界（教学口径，含端点讨论） */
  domainMin: number;
  /** 物理定义域上界（无上界时为 Infinity） */
  domainMax: number;
  /** 数值安全拖拽边界（比物理定义域内缩，避开 r → 0⁺ 之类奇异端点） */
  dragMin: number;
  dragMax: number;
  /** 自变量量纲单位（右屏量值必须带单位，否则 16000 无法判断是 cm³ 还是 m³） */
  xUnit: string;
  /** 目标函数量纲单位 */
  yUnit: string;
  /** 端点趋势比较结论（高考大题"必须比较端点"的规范落点） */
  endpointCheckLatex: string;
  funcExpr: string;
  primeExpr: string;
  optimalConditionLatex: string;
  isValid: boolean;
  warning?: string;
}

export function calculateOptimizationModel(
  modelType: OptimizationModelType,
  xVal: number,
): OptimizationResult {
  switch (modelType) {
    case "box": {
      // L 为正方形铁皮边长，x 为剪去角的小正方形边长
      const { L, slider } = OPTIMIZATION_CONSTANTS.box;
      const domainMin = 0;
      const domainMax = L / 2;
      // 截断边界与左屏滑块的声明域同源（见 OPTIMIZATION_CONSTANTS.box.slider）
      const [dragMin, dragMax] = slider;
      const optimalX = L / 6;
      const optimalY = optimalX * Math.pow(L - 2 * optimalX, 2);

      const clampedX = Math.max(dragMin, Math.min(dragMax, xVal));
      const yVal = clampedX * Math.pow(L - 2 * clampedX, 2);
      // V'(x) = 12x^2 - 8Lx + L^2 = (2x - L)(6x - L)
      const primeVal = 12 * clampedX * clampedX - 8 * L * clampedX + L * L;

      return {
        modelType,
        xVal: clampedX,
        yVal,
        primeVal,
        optimalX,
        optimalY,
        domainMin,
        domainMax,
        dragMin,
        dragMax,
        xUnit: "cm",
        yUnit: "cm³",
        // 本字段是「整串 LaTeX」字段（不得含 $ 定界符），且不得使用高中的极限记号：
        // 一律用教材式描述性语言（无限接近 / 无限增大）表达端点趋势。
        // 全部数值落点统一走 formatMathNumber：`optimalX = L/6` 在 L 非 6 的倍数时是有理非整数，
        // 直接模板插值会印出 16.666666666666668 这类浮点尾巴（同页两种数字格式即由此而来）。
        endpointCheckLatex: `\\text{当 } x \\text{ 无限接近 } 0 \\text{ 时 } V(x) \\text{ 也无限接近 } 0,\\quad \\text{当 } x \\text{ 无限接近 } ${formatMathNumber(domainMax)} \\text{ 时 } V(x) \\text{ 也无限接近 } 0,\\quad \\text{两端均低于 } V(x^*),\\quad \\text{故 } x^* = ${formatMathNumber(optimalX)} \\text{ 处取得全局最大值}`,
        funcExpr: `V(x) = x(${formatMathNumber(L)} - 2x)^2 = 4x^3 - ${formatMathNumber(4 * L)}x^2 + ${formatMathNumber(L * L)}x`,
        primeExpr: `V'(x) = 12x^2 - ${formatMathNumber(8 * L)}x + ${formatMathNumber(L * L)} = (6x - ${formatMathNumber(L)})(2x - ${formatMathNumber(L)})`,
        optimalConditionLatex: `V'(x) = 0 \\implies x^* = \\frac{L}{6} = ${formatMathNumber(optimalX)}`,
        isValid: true,
        warning:
          Math.abs(clampedX - xVal) > 1e-9
            ? "自变量已越出实际物理定义域，已截断到边界值"
            : undefined,
      };
    }

    case "can": {
      // 给定容积 V，底面半径 r，S(r) = 2πr^2 + 2V/r
      const { V, slider } = OPTIMIZATION_CONSTANTS.can;
      const domainMin = 0;
      const domainMax = Infinity;
      const [dragMin, dragMax] = slider;
      // S'(r) = 4πr - 2V/r^2 = 0 => 4π r^3 = 2V => r^3 = V / (2π)
      const optimalX = Math.cbrt(V / (2 * Math.PI));
      const optimalY = 2 * Math.PI * optimalX * optimalX + (2 * V) / optimalX;

      const clampedX = Math.max(dragMin, Math.min(dragMax, xVal));
      const yVal = 2 * Math.PI * clampedX * clampedX + (2 * V) / clampedX;
      const primeVal = 4 * Math.PI * clampedX - (2 * V) / (clampedX * clampedX);

      return {
        modelType,
        xVal: clampedX,
        yVal,
        primeVal,
        optimalX,
        optimalY,
        domainMin,
        domainMax,
        dragMin,
        dragMax,
        xUnit: "cm",
        yUnit: "cm²",
        endpointCheckLatex: `\\text{当 } r \\text{ 无限接近 } 0 \\text{ 时 } S(r) \\text{ 无限增大},\\quad \\text{当 } r \\text{ 无限增大时 } S(r) \\text{ 也无限增大},\\quad \\text{两端均高于 } S(r^*),\\quad \\text{故 } r^* \\approx ${formatMathNumber(optimalX)} \\text{ 处取得全局最小值}`,
        funcExpr: `S(r) = 2\\pi r^2 + \\frac{${formatMathNumber(2 * V)}}{r}`,
        primeExpr: `S'(r) = 4\\pi r - \\frac{${formatMathNumber(2 * V)}}{r^2}`,
        optimalConditionLatex: `S'(r) = 0 \\implies r^* = \\sqrt[3]{\\frac{V}{2\\pi}} \\approx ${formatMathNumber(optimalX)} \\implies h = 2r`,
        isValid: true,
        warning:
          Math.abs(clampedX - xVal) > 1e-9
            ? "自变量已越出实际物理定义域，已截断到边界值"
            : undefined,
      };
    }

    case "profit": {
      // 利润 P(x) = -a x^2 + b x - c，其中 b = p₀ − c₁、c = c₀ 均由 PROFIT_BASE 推导
      const { a, b, c, slider } = OPTIMIZATION_CONSTANTS.profit;
      const domainMin = 0;
      const domainMax = Infinity;
      // 截断边界与左屏滑块的声明域同源（见 OPTIMIZATION_CONSTANTS.profit.slider）
      const [dragMin, dragMax] = slider;
      // P'(x) = -2a x + b = 0 => x* = b / (2a)
      const optimalX = b / (2 * a);
      const optimalY = -a * optimalX * optimalX + b * optimalX - c;

      const clampedX = Math.max(dragMin, Math.min(dragMax, xVal));
      const yVal = -a * clampedX * clampedX + b * clampedX - c;
      const primeVal = -2 * a * clampedX + b;

      return {
        modelType,
        xVal: clampedX,
        yVal,
        primeVal,
        optimalX,
        optimalY,
        domainMin,
        domainMax,
        dragMin,
        dragMax,
        xUnit: "件",
        yUnit: "元",
        endpointCheckLatex: `P(0) = ${formatMathNumber(-c)} < ${formatMathNumber(optimalY)},\\quad \\text{当 } x \\text{ 无限增大时 } P(x) \\text{ 无限减小},\\quad \\text{两端均低于 } P(x^*),\\quad \\text{故 } x^* = ${formatMathNumber(optimalX)} \\text{ 处取得全局最大值}`,
        // 三项一律经 formatSignedTerm 拼接：a / b / c 任一改号都不会印出 `+ -` 或 `- -`
        funcExpr: `P(x) = ${formatSignedTerm(-a, "x^2", true)} ${formatSignedTerm(b, "x")} ${formatSignedTerm(-c, "")}`,
        // 一次项系数由 a 推导（-2a x）：写死 `-x` 会在 a 改动时静默失配
        primeExpr: `P'(x) = ${formatSignedTerm(-2 * a, "x", true)} ${formatSignedTerm(b, "")}`,
        optimalConditionLatex: `P'(x) = 0 \\implies x^* = ${formatMathNumber(optimalX)}`,
        isValid: true,
        warning:
          Math.abs(clampedX - xVal) > 1e-9
            ? "自变量已越出实际物理定义域，已截断到边界值"
            : undefined,
      };
    }
  }
}
