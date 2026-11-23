import type { MathPanelData } from "../types";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  calcCompareTriplet,
  calcLogOperations,
  type ExpLogCompareMode,
} from "@/math/expLogCompare";

export function buildExpLogComparePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as ExpLogCompareMode) || "logOps";
  const scenario = (config?.activeScenario as string) || "free";

  if (mode === "logOps") {
    const a = params.baseA ?? 2.0;
    const m = params.valM ?? 2.0;
    const n = params.valN ?? 3.0;
    const c = params.newBaseC ?? 3.0;
    const res = calcLogOperations(a, m, n, c);
    const aStr = formatMathNumber(a, 1);
    const mStr = formatMathNumber(m, 1);
    const nStr = formatMathNumber(n, 1);
    const cStr = formatMathNumber(c, 1);

    if (res.validity === "degenerate_base") {
      return {
        examAnchor: "必修一第 4 章 · 对数运算律与换底公式",
        mnemonic: "同底相加真数乘，相减真数来相除，异底必用换底桥！",
        quantities: [
          {
            label: "底数校验状态",
            symbol: "a, c",
            value: "退化 (底数等于 1)",
            highlight: "negative",
            color: MATH_COLORS.degeneracy,
          },
        ],
        theorems: [
          {
            name: "对数运算底数合法性条件",
            latex: "a > 0 \\text{ 且 } a \\ne 1, \\quad M > 0, \\; N > 0",
            condition:
              "底数 $a=1$ 或 $c=1$ 时，$a^x=1$ 不满足一一对应，对数无定义。",
            level: "core",
          },
        ],
        warnings: [
          {
            text: "底数不可取 $1$：当前存在底数 $a=1$ 或换底底数 $c=1$，请调离临界值 $1$ 后继续计算。",
            level: "danger",
          },
        ],
        reasoningSteps: [],
        gaokaoPoints: [],
      };
    }

    return {
      examAnchor: "必修一第 4 章 · 对数运算律与换底公式",
      mnemonic: "同底相加真数乘，相减真数来相除，异底必用换底桥！",
      quantities: [
        {
          label: "单对数值一",
          symbol: `\\log_{${aStr}} ${mStr}`,
          value: formatMathNumber(res.logAM, 3),
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "单对数值二",
          symbol: `\\log_{${aStr}} ${nStr}`,
          value: formatMathNumber(res.logAN, 3),
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "乘积的对数",
          symbol: `\\log_{${aStr}}(${mStr} \\cdot ${nStr})`,
          value: formatMathNumber(res.logAMN, 3),
          color: MATH_COLORS.function,
        },
        {
          label: "商的对数",
          symbol: `\\log_{${aStr}} \\frac{${mStr}}{${nStr}}`,
          value: formatMathNumber(res.logADiv, 3),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "换底公式验算",
          symbol: `\\frac{\\log_{${cStr}} ${mStr}}{\\log_{${cStr}} ${aStr}}`,
          value: formatMathNumber(res.changeBaseCheck, 3),
          isInvariant: true,
          invariantNote:
            "不论换底中介 $c$ 取任何大于 $0$ 且不为 $1$ 的数，商值严格等于 $\\log_a M$。",
          color: MATH_COLORS.inequality,
        },
      ],
      theorems: [
        {
          name: "对数四则运算律与换底公式",
          latex:
            "\\log_a(MN) = \\log_a M + \\log_a N, \\quad \\log_a M = \\frac{\\log_c M}{\\log_c a}",
          condition: "适用前提：$a, c > 0$ 且均不等于 $1$，$M, N > 0$。",
          note: "常用推论：$\\log_{a^m} b^n = \\frac{n}{m}\\log_a b$，且互为倒数关系 $\\log_a b \\cdot \\log_b a = 1$。",
          level: "core",
        },
      ],
      warnings: [
        {
          text: "经典错误警报：$\\log_a(M+N) \\ne \\log_a M + \\log_a N$，真数相加不能拆开；同样 $\\log_a M \\cdot \\log_a N$ 也不能合并真数！",
          level: "danger",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 确认底数与真数定义域",
          detail: `确认底数 $a = ${aStr} > 0, a \\ne 1$ 且真数 $M = ${mStr} > 0, N = ${nStr} > 0$。`,
          latex: `\\log_{${aStr}} ${mStr} = ${formatMathNumber(res.logAM, 3)}, \\quad \\log_{${aStr}} ${nStr} = ${formatMathNumber(res.logAN, 3)}`,
        },
        {
          step: 2,
          title: "建模联立 · 代入乘积法则与换底公式",
          detail: "利用同底加法合真数与中间底数 $c$ 转换验证等式。",
          latex: `\\log_{${aStr}}(${mStr} \\cdot ${nStr}) = ${formatMathNumber(res.logAM, 3)} + ${formatMathNumber(res.logAN, 3)} = ${formatMathNumber(res.logAMN, 3)}`,
        },
        {
          step: 3,
          title: "求解反思 · 核对换底不变性",
          detail: `无论中间底数 $c = ${cStr}$ 如何变动，商值始终等于原对数。`,
          latex: `\\frac{\\log_{${cStr}} ${mStr}}{\\log_{${cStr}} ${aStr}} = ${formatMathNumber(res.changeBaseCheck, 3)} = \\log_{${aStr}} ${mStr}`,
        },
      ],
      gaokaoPoints: [
        {
          text: "遇到多个异底对数连乘或指数对数混合求值（如 $2^x=3^y=6$），先设共同常数或全部换为常用对数 $\\lg$ 化简。",
          importance: "gaokao",
        },
      ],
    };
  }

  // medianBridge 或 monotoneCompare 模式
  const tripletKey =
    mode === "monotoneCompare"
      ? scenario === "monotoneCross"
        ? "monotoneCross"
        : "free"
      : scenario === "bridge01" || scenario === "bridgeHalf"
        ? scenario
        : "free";
  const a = params.baseA ?? 2.0;
  const x = params.xSample ?? 0.6;
  const res = calcCompareTriplet(tripletKey, a, x);

  if (res.validity === "degenerate") {
    return {
      examAnchor: "必修一第 4 章 · 指对幂大小比较通法",
      mnemonic: "同底看单调，异底搭桥梁，0和1先站岗！",
      quantities: [
        {
          label: "底数状态",
          symbol: "a",
          value: "底数等于 1 退化",
          highlight: "negative",
          color: MATH_COLORS.degeneracy,
        },
      ],
      theorems: [
        {
          name: "指对函数单调性底数前提",
          latex: "a > 0 \\text{ 且 } a \\ne 1",
          condition: "底数 $a=1$ 时 $y=1^x$ 退化为常值函数且对数无意义。",
          level: "core",
        },
      ],
      warnings: [
        {
          text: "请调节底数 $a$ 避开 $1$，即可对比指数与对数单调方向。",
          level: "danger",
        },
      ],
      reasoningSteps: [],
      gaokaoPoints: [],
    };
  }

  const orderStr = res.sortedAsc.map((item) => item.symbol).join(" < ");
  return {
    examAnchor: "必修一第 4 章 · 指对幂比大小（新高考高频选填）",
    mnemonic: "先看正负与0比，再靠1来划高低，同间插入1/2！",
    quantities: [
      ...res.items.map((item, idx) => ({
        label: `目标数 ${item.symbol}`,
        symbol: item.exprLatex,
        value: formatMathNumber(item.value, 4),
        color:
          idx === 0
            ? MATH_COLORS.paramPrimary
            : idx === 1
              ? MATH_COLORS.paramSecondary
              : MATH_COLORS.paramTertiary,
      })),
      {
        label: "严格大小排序",
        symbol: "\\text{Order}",
        value: `$${orderStr}$`,
        highlight: "positive",
        color: MATH_COLORS.inequality,
      },
    ],
    theorems: [
      {
        name: "指对幂函数单调性与定点基准定理",
        latex:
          "a > 1 \\implies a^x \\uparrow, \\; \\log_a x \\uparrow; \\quad 0 < a < 1 \\implies a^x \\downarrow, \\; \\log_a x \\downarrow",
        condition:
          "指数函数恒过定点 $(0, 1)$，对数函数恒过定点 $(1, 0)$，幂函数在第一象限当 $\\alpha > 0$ 时递增。",
        note: "利用定点 $(0,1)$ 与 $(1,0)$ 可以迅速将异底数指对表达式隔离到 $(-\\infty, 0), (0, 1), (1, +\\infty)$ 三个独立区间内。",
        level: "core",
      },
    ],
    warnings: [
      {
        text: "易错点提示：比较 $0 < a < 1$ 的对数或指数时，单调性为递减而非递增，切勿忘记不等号反向！",
        level: "warning",
      },
    ],
    reasoningSteps: res.items.map((item, idx) => ({
      step: idx + 1,
      title: `定界归类 · 界定 $${item.symbol}$ 所在区间`,
      detail: item.reason,
      latex: `${item.symbol} = ${item.exprLatex} \\approx ${formatMathNumber(item.value, 4)}`,
    })),
    gaokaoPoints: [
      {
        text: "若三个待比较数均在 $(0,1)$ 内且不便直接估算，可引入 $\\frac{1}{2}$、$e^{-1}$ 等分界基准点或构造共底指数/幂函数作单调链。",
        importance: "gaokao",
      },
    ],
  };
}
