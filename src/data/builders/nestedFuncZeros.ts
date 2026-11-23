import type { MathPanelData } from "../types";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  solveNestedEquation,
  type NestedFuncMode,
} from "@/math/nestedFuncZeros";

export function buildNestedFuncZerosPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as NestedFuncMode) || "quadraticNested";
  const a = params.targetA ?? 0.6;
  const b = params.paramB ?? 2.0;
  const c = params.shiftC ?? 0.0;
  const res = solveNestedEquation(mode, a, b, c);

  const aStr = formatMathNumber(a, 2);
  const bStr = formatMathNumber(b, 1);
  const cStr = formatMathNumber(c, 2);

  const outerSummary =
    res.outerRoots.length > 0
      ? res.outerRoots.map((t) => formatMathNumber(t, 2)).join(",\\; ")
      : "\\varnothing";

  const branchSumExpr =
    res.branches.length > 0
      ? res.branches.map((br) => `${br.innerRoots.length}`).join(" + ") +
        ` = ${res.totalCount}`
      : "0";

  const isPiecewise = mode === "piecewiseNested";

  return {
    examAnchor: "必修一函数压轴 · 嵌套复合方程 f(f(x)) = a 实根计数",
    mnemonic: "由外向内剥洋葱，先求 t 根画横线，逐条统计再相加！",
    quantities: [
      {
        label: "外层方程根个数",
        symbol: "|\\{t : f(t)=a\\}|",
        value: res.outerRoots.length,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "外层根取值列表",
        symbol: "t_k",
        value: outerSummary,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "内层互异实根总数",
        symbol: "N_{\\text{根}}",
        value: res.totalCount,
        highlight: res.totalCount > 0 ? "positive" : "zero",
        color: MATH_COLORS.inequality,
      },
      {
        label: "翻折峰高参考",
        symbol: "H_{\\text{峰}}",
        value: isPiecewise
          ? formatMathNumber(2 + c, 2)
          : formatMathNumber((b * b) / 4 + c, 2),
        color: MATH_COLORS.function,
      },
    ],
    theorems: [
      {
        name: "复合嵌套方程两层换元等价原理",
        latex:
          "f(f(x)) = a \\iff \\begin{cases} t = f(x) \\\\ f(t) = a \\end{cases}",
        condition:
          "适用前提：在复合定义域内作中间换元 $t = f(x)$，外层解出互异根 $t_1, t_2, \\dots, t_k$ 后，各分支方程 $f(x)=t_m$ 之间值域互异，故实根天然不会重复。",
        note: "总实根数严格等于各水平线 $y = t_m$ 与函数 $y = f(x)$ 图象交点个数的代数和。",
        level: "core",
      },
    ],
    warnings: [
      {
        text: "必考防错提醒：各分界点（如翻折谷底、波峰顶点、分段衔接处）既要检查左、右两侧临界高度是否等高，也要核对横线本身是否恰好与峰值相切而导致根数合并！",
        level: "warning",
      },
    ],
    reasoningSteps: [
      {
        step: 1,
        title: "审题定法 · 换元求解外层方程 f(t)=a",
        detail: isPiecewise
          ? `作水平线 $y = ${aStr}$ 截分段翻折函数图象，得出外层实根 $t$。`
          : `作水平线 $y = ${aStr}$ 截 $f(x) = |x^2 - ${bStr}x| ${c >= 0 ? "+" : ""} ${cStr}$，得出外层实根 $t$。`,
        latex: `f(t) = ${aStr} \\implies t \\in \\{${outerSummary}\\}`,
      },
      {
        step: 2,
        title: "建模联立 · 逐条展开内层方程 $f(x)=t_k$",
        detail:
          "将每一个外层根 $t_k$ 作为新水平高度线，分别读取各支水平线交点数。",
        latex:
          res.branches.length > 0
            ? res.branches
                .map(
                  (br, idx) =>
                    `t_${idx + 1}=${formatMathNumber(br.tValue, 2)} \\to ${br.innerRoots.length}\\text{根}`,
                )
                .join(", \\quad ")
            : "\\text{外层无实根，内层交点数为 } 0",
      },
      {
        step: 3,
        title: "求解反思 · 合并全部互异零点",
        detail:
          "因不同 $t_k$ 对应互不相交的函数值水平线，直接求和得复合方程总根数。",
        latex: `N_{\\text{总}} = ${branchSumExpr}`,
      },
    ],
    gaokaoPoints: [
      {
        text: "反求参数范围题型：由总根数反推各 $t_k$ 必须落入哪个高度区间，再由 $f(t_k)=a$ 的单调性逆解参数 $a$ 的上下界。",
        importance: "hard",
      },
    ],
  };
}
