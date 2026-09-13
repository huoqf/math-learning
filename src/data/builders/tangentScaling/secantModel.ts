import type { MathPanelData } from "@/data/types";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";
import type {
  TangentScalingParams,
  SecantSubModel,
} from "@/data/registries/tangentScaling";

export function buildSecantModel(
  params: TangentScalingParams,
  secantSub: SecantSubModel,
): MathPanelData {
  if (secantSub === "taylor_quadratic") {
    const x = params.evalX;
    const lower = x - 0.5 * x * x;
    const main = x > -0.99 ? Math.log(1 + x) : 0;
    const upper = x;

    return {
      examAnchor: "新高考解答题 18 题 · 二阶多项式精细卡位",
      mnemonic: "一阶切线给上限，二阶多项卡下界",
      quantities: [
        {
          label: "观察点横坐标",
          symbol: "x",
          value: x.toFixed(2),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "二阶下界多项式值",
          symbol: "P_2(x)",
          value: lower.toFixed(4),
          color: MATH_COLORS.accent,
        },
        {
          label: "精确函数值",
          symbol: "\\ln(1+x)",
          value: main.toFixed(4),
          color: MATH_COLORS.primary,
        },
        {
          label: "一阶切线上界值",
          symbol: "P_1(x)",
          value: upper.toFixed(4),
          color: MATH_COLORS.paramTertiary,
        },
      ],
      theorems: [
        {
          name: "对数二阶多项式卡位不等式",
          latex: "x - \\frac{1}{2}x^2 \\le \\ln(1+x) \\le x \\quad (x \\ge 0)",
          condition: "$x \\ge 0$，当且仅当 $x = 0$ 时等号成立",
          level: "core",
          note: "在高考数列与导数压轴题中，一阶放缩 $\\ln(1+x) \\le x$ 往往过松，需二阶项精细定界！",
        },
      ],
      warnings: [
        {
          text: "二阶下界仅在 $x \\ge 0$ 时成立；若 $x \\in (-1, 0)$，不等号方向将改变，切勿盲目套用！",
          level: "warning",
        },
      ],
      gaokaoPoints: [
        {
          text: "【数列求和卡位】常用于证明形如 $\\sum \\ln(1 + 1/n^2)$ 的取值范围与精确上下界估计",
          importance: "gaokao",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "构造下界差函数",
          detail:
            "令 $h(x) = \\ln(1+x) - (x - 0.5x^2)$，求导得 $h'(x) = \\frac{1}{1+x} - (1-x) = \\frac{x^2}{1+x}$。",
          latex: "h'(x) = \\frac{1}{1+x} - (1-x) = \\frac{x^2}{1+x}",
          rubric: "采分点：求导与通分化简（4分）",
        },
        {
          step: 2,
          title: "符号判定与单调性",
          detail:
            "当 $x \\ge 0$ 时，$\\frac{x^2}{1+x} \\ge 0$，故 $h(x)$ 在 $[0, +\\infty)$ 上单调递增。",
          rubric: "采分点：导数符号与单调性（4分）",
        },
        {
          step: 3,
          title: "代入初值确立下界",
          detail:
            "因 $h(0) = 0$，由单调递增得 $h(x) \\ge h(0) = 0$，结合一阶放缩即证结论。",
          rubric: "采分点：初值比较与结论（3分）",
        },
      ],
    };
  }

  if (secantSub === "log_secant_tangent") {
    const a = params.intervalA;
    const b = params.intervalB;
    const midX = (a + b) / 2;
    const fa = Math.log(a);
    const fb = Math.log(b);
    const secSlope = (fb - fa) / (b - a);

    return {
      examAnchor: "新高考解答题 18 题 · 对数曲线弦切放缩",
      mnemonic: "对数曲线弦在下，区间切线恒在上",
      quantities: [
        {
          label: "区间左端点",
          symbol: "a",
          value: a.toFixed(2),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "区间右端点",
          symbol: "b",
          value: b.toFixed(2),
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "割线斜率",
          symbol: "m_{AB}",
          value: secSlope.toFixed(3),
          color: MATH_COLORS.accent,
        },
        {
          label: "中点切线斜率",
          symbol: "f'(x_m)",
          value: (1 / midX).toFixed(3),
          color: MATH_COLORS.paramPrimary,
        },
      ],
      theorems: [
        {
          name: "对数函数有限区间割切包围定理",
          latex:
            "\\frac{\\ln b - \\ln a}{b - a}(x - a) + \\ln a \\le \\ln x \\le \\frac{1}{x_0}(x - x_0) + \\ln x_0",
          condition: "$x \\in [a, b], \\; x_0 \\in [a, b]$",
          level: "core",
          note: "在区间内部，对数曲线严格位于割线（弦）的上方、切线的下方！",
        },
      ],
      warnings: [
        {
          text: "对数曲线在区间内位于割线上方（割线提供下界）、切线下方（切线提供上界）！",
          level: "info",
        },
      ],
      gaokaoPoints: [
        {
          text: "【弦弧中点与弦切】高考压轴题考点：利用割切不等式证明 $\\ln((a+b)/2) > (\\ln a + \\ln b)/2$",
          importance: "gaokao",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "求解端点割线斜率与中点切线",
          detail: `连接端点 $A(${formatMathNumber(a)}, \\ln ${formatMathNumber(a)})$ 与 $B(${formatMathNumber(b)}, \\ln ${formatMathNumber(b)})$，割线斜率 $m_{AB} = \\frac{\\ln b - \\ln a}{b - a} \\approx ${secSlope.toFixed(3)}$；中点 $x_m = ${formatMathNumber(midX)}$ 处切线斜率 $k_{\\text{tan}} = \\frac{1}{x_m} \\approx ${(1 / midX).toFixed(3)}$。`,
          latex: `m_{AB} = \\frac{\\ln ${formatMathNumber(b)} - \\ln ${formatMathNumber(a)}}{${formatMathNumber(b - a)}} \\approx ${secSlope.toFixed(3)}`,
          rubric: "采分点：割线与切线解析式求解（3分）",
        },
        {
          step: 2,
          title: "构造差函数研究单调性证明割线下界",
          detail:
            "令辅助函数 $g(x) = \\ln x - [m_{AB}(x - a) + \\ln a]$ ($x \\in [a, b]$)，求导得 $g'(x) = \\frac{1}{x} - m_{AB}$。易知 $g'(x)$ 在 $[a, b]$ 上单调递减，且 $g(a)=g(b)=0$。由零点存在性定理知存在唯一极值点 $x_0 \\in (a, b)$，使 $g(x)$ 在 $[a, x_0]$ 单调递增、在 $[x_0, b]$ 单调递减，故区间内恒有 $g(x) > 0$，割线在下方提供下界。",
          rubric: "采分点：构造差函数单调性证明割线下界（5分）",
        },
        {
          step: 3,
          title: "结合切线上界得出双向放缩",
          detail:
            "由于切线恒位于曲线的上方，综合切线上界与割线下界，得闭区间内对数曲线被双向线性锁定。",
          latex: `m_{AB}(x - ${formatMathNumber(a)}) + \\ln ${formatMathNumber(a)} \\le \\ln x \\le \\frac{1}{x_m}(x - x_m) + \\ln x_m`,
          rubric: "采分点：双向定界综合结论（3分）",
        },
      ],
    };
  }

  // 默认指数割切 exp_secant_tangent
  const a = params.intervalA;
  const b = params.intervalB;
  const midX = (a + b) / 2;
  const fa = Math.exp(a);
  const fb = Math.exp(b);
  const secSlope = (fb - fa) / (b - a);

  return {
    examAnchor: "新高考解答题 18 题 · 指数函数弦切放缩",
    mnemonic: "指数切线在下方，端点割线卡在上",
    quantities: [
      {
        label: "区间左端点",
        symbol: "a",
        value: a.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "区间右端点",
        symbol: "b",
        value: b.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "割线斜率",
        symbol: "m_{AB}",
        value: secSlope.toFixed(3),
        color: MATH_COLORS.accent,
      },
      {
        label: "中点切线斜率",
        symbol: "f'(x_m)",
        value: Math.exp(midX).toFixed(3),
        color: MATH_COLORS.paramPrimary,
      },
    ],
    theorems: [
      {
        name: "指数函数有限区间割切包围定理",
        latex:
          "e^{x_0}(x - x_0) + e^{x_0} \\le e^x \\le \\frac{e^b - e^a}{b - a}(x - a) + e^a",
        condition: "$x \\in [a, b], \\; x_0 \\in [a, b]$",
        level: "core",
        note: "指数函数在任意闭区间内部，曲线被下方的切线与上方的割线严格包围！",
      },
    ],
    warnings: [
      {
        text: "割线只在区间 $[a,b]$ 内部提供上界，一旦超出端点范围，指数曲线将反超割线！",
        level: "warning",
      },
    ],
    gaokaoPoints: [
      {
        text: "【数列放缩衔接】导数压轴题与数列求和证明结合时，常利用割线切线放缩对和式进行面积包围估计",
        importance: "hard",
      },
    ],
    reasoningSteps: [
      {
        step: 1,
        title: "求解端点割线斜率与中点切线",
        detail: `连接端点 $A(${formatMathNumber(a)}, e^{${formatMathNumber(a)}})$ 与 $B(${formatMathNumber(b)}, e^{${formatMathNumber(b)}})$，割线斜率 $m_{AB} = \\frac{e^b - e^a}{b - a} \\approx ${secSlope.toFixed(3)}$；在区间中点 $x_m = ${formatMathNumber(midX)}$ 处切线斜率 $k_{\\text{tan}} = e^{x_m} \\approx ${Math.exp(midX).toFixed(3)}$。`,
        latex: `m_{AB} = \\frac{e^{${formatMathNumber(b)}} - e^{${formatMathNumber(a)}}}{${formatMathNumber(b - a)}} \\approx ${secSlope.toFixed(3)}`,
        rubric: "采分点：割线与切线解析式求解（3分）",
      },
      {
        step: 2,
        title: "构造差函数研究单调性证明割线上界",
        detail:
          "令辅助函数 $g(x) = e^x - [m_{AB}(x - a) + e^a]$ ($x \\in [a, b]$)，求导得 $g'(x) = e^x - m_{AB}$。易知 $g'(x)$ 在 $[a, b]$ 上单调递增，且 $g(a)=g(b)=0$。由零点存在性定理知存在唯一极值点 $x_0 \\in (a, b)$，使 $g(x)$ 在 $[a, x_0]$ 单调递减、在 $[x_0, b]$ 单调递增，故区间内恒有 $g(x) < 0$，割线在上方提供上界。",
        rubric: "采分点：构造差函数单调性证明割线上界（5分）",
      },
      {
        step: 3,
        title: "结合切线下界得出双向放缩",
        detail:
          "由于切线恒位于曲线下方，综合切线下界与割线上界，得闭区间内曲线被双向线性锁定。",
        latex: `e^{x_m}(x - x_m) + e^{x_m} \\le e^x \\le m_{AB}(x - ${formatMathNumber(a)}) + e^{${formatMathNumber(a)}}`,
        rubric: "采分点：双向定界综合结论（3分）",
      },
    ],
  };
}
