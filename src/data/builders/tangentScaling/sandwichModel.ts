import type { MathPanelData } from "@/data/types";
import { MATH_COLORS } from "@/theme";
import type {
  TangentScalingParams,
  SandwichSubModel,
} from "@/data/registries/tangentScaling";

export function buildSandwichModel(
  params: TangentScalingParams,
  sandwichSub: SandwichSubModel,
): MathPanelData {
  const x = params.evalX;
  const isParallel = sandwichSub === "parallel_bands";
  const isOrigin = sandwichSub === "origin_sandwich";

  let upperVal = Math.exp(x - 1);
  let lowerVal = Math.log(x) + 1;
  let midVal = x;

  if (isParallel) {
    upperVal = Math.exp(x);
    lowerVal = Math.log(x);
    midVal = x;
  } else if (isOrigin) {
    upperVal = Math.exp(x) - 1;
    lowerVal = Math.log(x + 1);
    midVal = x;
  }

  if (isParallel) {
    return {
      examAnchor: "新高考解答题 18 题 · 平行切线缓冲带与最值秒杀",
      mnemonic: "平行双切若夹紧，上下差值定乾坤",
      quantities: [
        {
          label: "观察点横坐标",
          symbol: "x",
          value: x.toFixed(2),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "指数函数值",
          symbol: "e^x",
          value: upperVal.toFixed(3),
          color: MATH_COLORS.primary,
        },
        {
          label: "对数函数值",
          symbol: "\\ln x",
          value: Number.isFinite(lowerVal) ? lowerVal.toFixed(3) : "—",
          color: MATH_COLORS.secondary,
        },
        {
          label: "函数垂直差",
          symbol: "\\Delta y",
          value: (upperVal - lowerVal).toFixed(3),
          color: MATH_COLORS.accent,
          highlight: "positive",
        },
      ],
      theorems: [
        {
          name: "高考经典平行切线缓冲带不等式",
          latex:
            "e^x - \\ln x \\ge (x + 1) - (x - 1) = 2 \\quad (\\forall x > 0)",
          condition: "x > 0",
          level: "core",
          note: "$e^x$ 在 $(0,1)$ 处的切线为 $y=x+1$；$\\ln x$ 在 $(1,0)$ 处的切线为 $y=x-1$。两切线平行且纵向缓冲差恒等于 2！",
        },
      ],
      warnings: [
        {
          text: "由于 $e^x$ 在 $x=0$ 处取等，$\\ln x$ 在 $x=1$ 处取等，两者无法同时取等，因此严格不等式 $e^x - \\ln x > 2$ 恒成立！",
          level: "info",
        },
      ],
      gaokaoPoints: [
        {
          text: "【秒杀经典】高考证明 $e^x - \\ln x > 2$ 时，直接利用平行双切线相减放缩，无需二阶求导即可获满分",
          importance: "gaokao",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "分别列出两曲线的平行切线放缩式",
          detail:
            "由基准放缩：对于 $x > 0$，恒有 $e^x \\ge x + 1$ (当且仅当 $x=0$ 时取等)；同理由 $\\ln x \\le x - 1$ 可得 $-\\ln x \\ge -(x - 1) = 1 - x$ (当且仅当 $x=1$ 时取等)。",
          latex: "e^x \\ge x + 1, \\quad -\\ln x \\ge 1 - x",
          rubric: "采分点：分别写出切线放缩式（4分）",
        },
        {
          step: 2,
          title: "利用同向同号不等式相加求差",
          detail:
            "将两同向不等式相加得：$e^x + (-\\ln x) \\ge (x + 1) + (1 - x) = 2$。",
          latex: "e^x - \\ln x \\ge (x + 1) + (1 - x) = 2",
          rubric: "采分点：同向同号相加做差（4分）",
        },
        {
          step: 3,
          title: "等号不同步判定严格大于",
          detail:
            "由于取等条件 $x=0$ 与 $x=1$ 无法同时满足，等号不可兼得，故对一切 $x > 0$ 严格恒有 $e^x - \\ln x > 2$。",
          rubric: "采分点：等号不同步论证严格不等（3分）",
        },
      ],
    };
  }

  return {
    examAnchor: "新高考解答题 18 题压轴 · 公切线中轴卡位",
    mnemonic: "中间公切若卡牢，上下放缩无需导",
    quantities: [
      {
        label: "观察点横坐标",
        symbol: "x",
        value: x.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "上界函数值",
        symbol: isOrigin ? "e^x - 1" : "e^{x-1}",
        value: upperVal.toFixed(3),
        color: MATH_COLORS.primary,
      },
      {
        label: "中介公切线值",
        symbol: "y",
        value: midVal.toFixed(3),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "下界函数值",
        symbol: isOrigin ? "\\ln(x+1)" : "\\ln x + 1",
        value: Number.isFinite(lowerVal) ? lowerVal.toFixed(3) : "—",
        color: MATH_COLORS.secondary,
      },
    ],
    theorems: [
      {
        name: "公切线中介放缩卡位原理",
        latex: isOrigin
          ? "e^x - 1 \\ge x \\ge \\ln(x + 1) \\quad (x > -1)"
          : "e^{x-1} \\ge x \\ge \\ln x + 1 \\quad (x > 0)",
        condition: isOrigin
          ? "$x > -1$，当且仅当 $x = 0$ 时等号成立"
          : "$x > 0$，当且仅当 $x = 1$ 时等号成立",
        level: "core",
        note: "两曲线在公切点处切线重合为 $y = x$，直接构造天然中介，避开复杂的差函数高阶求导！",
      },
    ],
    warnings: [
      {
        text: "公切线卡位必须保证两曲线在相切点同斜率同函数值，且两侧曲线均不穿透该公切线！",
        level: "danger",
      },
    ],
    gaokaoPoints: [
      {
        text: "【拆分思想】面对证明 $f(x) \\ge g(x)$，通过引入一次中介直线拆解为两个独立的基准不等式证明",
        importance: "gaokao",
      },
    ],
    reasoningSteps: [
      {
        step: 1,
        title: "确立公切线方程",
        detail: isOrigin
          ? "考察 $f(x)=e^x-1$ 与 $g(x)=\\ln(x+1)$，在 $x=0$ 处 $f(0)=g(0)=0$，$f'(0)=g'(0)=1$，故公切线为 $y = x$。"
          : "考察 $f(x)=e^{x-1}$ 与 $g(x)=\\ln x + 1$，在 $x=1$ 处 $f(1)=g(1)=1$，$f'(1)=g'(1)=1$，故公切线为 $y = x$。",
        rubric: "采分点：公切线方程求解（3分）",
      },
      {
        step: 2,
        title: "双向分别证明不等式",
        detail: isOrigin
          ? "由基准放缩 $e^t \\ge t+1$ 知 $e^x-1 \\ge x$；由 $\\ln(1+t) \\le t$ 知 $\\ln(x+1) \\le x$。"
          : "由 $e^t \\ge t+1$ 令 $t=x-1$ 得 $e^{x-1} \\ge x$；由 $\\ln x \\le x-1$ 加 1 得 $\\ln x + 1 \\le x$。",
        rubric: "采分点：双向子命题论证（5分）",
      },
      {
        step: 3,
        title: "三式合并完成卡位",
        detail: "两侧放缩综合，传递得出不等式成立，等号在公共切点处同步取得。",
        rubric: "采分点：等号同步条件与结论（3分）",
      },
    ],
  };
}
