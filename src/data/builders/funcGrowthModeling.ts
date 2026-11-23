import type { MathPanelData } from "../types";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  calcGrowthRace,
  calcPiecewiseBilling,
  calcScatterFitting,
  type FuncGrowthMode,
} from "@/math/funcGrowthModeling";

export function buildFuncGrowthModelingPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as FuncGrowthMode) || "growthRace";
  const fitModel =
    (config?.fitModel as "linear" | "quadratic" | "exponential") ||
    "exponential";

  if (mode === "growthRace") {
    const res = calcGrowthRace(
      params.baseA ?? 1.8,
      params.powerN ?? 2,
      params.linearK ?? 3.0,
      params.xProbe ?? 4.5,
    );
    const aStr = formatMathNumber(res.a, 1);
    const kStr = formatMathNumber(res.linearK, 1);
    const xStr = formatMathNumber(res.xProbe, 1);

    return {
      examAnchor: "必修一第 4.5 节 · 不同函数增长的差异",
      mnemonic: "指数爆炸最终王，对数平缓步子小，充分大后分高低！",
      quantities: [
        {
          label: "指数函数取值",
          symbol: `${aStr}^{${xStr}}`,
          value: formatMathNumber(res.yExp, 2),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "幂函数取值",
          symbol: `${xStr}^{${res.powerN}}`,
          value: formatMathNumber(res.yPower, 2),
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "一次函数取值",
          symbol: `${kStr} \\cdot ${xStr}`,
          value: formatMathNumber(res.yLinear, 2),
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "对数函数取值",
          symbol: `\\log_{${aStr}} ${xStr}`,
          value: formatMathNumber(res.yLog, 2),
          color: MATH_COLORS.function,
        },
        {
          label: "当前领先模型",
          symbol: "\\text{Top}",
          value: res.leaderName,
          highlight: "positive",
          color: MATH_COLORS.inequality,
        },
      ],
      theorems: [
        {
          name: "三类初等函数增长阶梯规律",
          latex:
            "\\log_a x < kx < x^n < a^x \\quad (a > 1, \\; n > 0, \\; x \\text{ 充分大时})",
          condition:
            "适用前提：$a > 1$、$k > 0$、$n > 0$ 且自变量 $x$ 取值充分大。",
          note: "在区间初期，直线 $y=kx$ 或幂函数可能暂时高于指数函数，但随着 $x$ 不断增大，指数函数呈倍数级跃升并最终严格反超。",
          level: "core",
        },
      ],
      warnings: [
        {
          text: "区间错觉警示：不可仅凭 $x \\in (0, 2)$ 的局部图象断言幂函数一定增长快于指数函数，必须考察充分大区间趋势！",
          level: "warning",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 明确四类函数解析模型",
          detail: "固定底数 $a$、幂次 $n$ 与斜率 $k$，代入当前探测坐标 $x_0$。",
          latex: `y_1 = ${aStr}^x, \\quad y_2 = x^{${res.powerN}}, \\quad y_3 = ${kStr}x, \\quad y_4 = \\log_{${aStr}} x`,
        },
        {
          step: 2,
          title: "建模联立 · 比较区间交点与增速变化",
          detail: "定量算出当前 $x_0$ 处的纵坐标，并与前阶段增速比较。",
          latex: `x_0 = ${xStr} \\implies y_1 = ${formatMathNumber(res.yExp, 2)}, \\; y_2 = ${formatMathNumber(res.yPower, 2)}, \\; y_3 = ${formatMathNumber(res.yLinear, 2)}`,
        },
        {
          step: 3,
          title: "求解反思 · 判定当前与长期领先模型",
          detail: `在当前横坐标处领先模型为 ${res.leaderName}；当 $x$ 继续增大时指数函数增速最快。`,
          latex: `\\max(y_1, y_2, y_3, y_4) = ${formatMathNumber(Math.max(res.yExp, res.yPower, res.yLinear, res.yLog), 2)}`,
        },
      ],
      gaokaoPoints: [
        {
          text: "遇到“三种方案长期收益哪个更大”实际建模题时，指数型（复利增长）通常在若干周期后反超线性定额增长。",
          importance: "gaokao",
        },
      ],
    };
  }

  if (mode === "piecewiseBilling") {
    const res = calcPiecewiseBilling(
      params.usage ?? 6.5,
      params.rate1 ?? 2.0,
      params.rate2 ?? 3.5,
      params.rate3 ?? 5.0,
    );
    const r1 = formatMathNumber(res.rate1, 1);
    const r2 = formatMathNumber(res.rate2, 1);
    const r3 = formatMathNumber(res.rate3, 1);
    const tier1Max = formatMathNumber(res.rate1 * res.tier1Limit, 2);
    const tier2Max = formatMathNumber(
      res.rate1 * res.tier1Limit +
        res.rate2 * (res.tier2Limit - res.tier1Limit),
      2,
    );

    return {
      examAnchor: "必修一第 3.4 节 · 分段函数实际应用建模",
      mnemonic: "分界分段列解析，超额部分按新价，端点衔接必连续！",
      quantities: [
        {
          label: "当前用量",
          symbol: "x",
          value: formatMathNumber(res.usage, 1),
          color: MATH_COLORS.function,
        },
        {
          label: "所处计费档位",
          symbol: "\\text{Tier}",
          value: `第 ${res.activeTier} 档`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "应付总费用",
          symbol: "C(x)",
          value: formatMathNumber(res.totalCost, 2),
          highlight: "positive",
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "平均单价",
          symbol: "\\frac{C(x)}{x}",
          value: formatMathNumber(res.avgCost, 2),
          color: MATH_COLORS.paramTertiary,
        },
      ],
      theorems: [
        {
          name: "超额累进分段函数模型",
          latex: `C(x)=\\begin{cases}${r1}x, & 0 \\le x \\le 4\\\\ ${tier1Max}+${r2}(x-4), & 4 < x \\le 8\\\\ ${tier2Max}+${r3}(x-8), & x > 8\\end{cases}`,
          condition:
            "适用前提：每档单价仅作用于超出前一档阈值的增量部分，各段在分界点衔接。",
          note: "在 $x=4$ 与 $x=8$ 处左右两段表达式取值相等，确保消费总费用不发生无理跳跃。",
          level: "core",
        },
      ],
      warnings: [
        {
          text: "常见计算陷阱：第二档不是直接计算 $r_2 x$，而是前 $4$ 个单位按 $r_1$ 计费，超出的 $(x-4)$ 个单位才按 $r_2$ 计费！",
          level: "danger",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 确定自变量所在分段区间",
          detail: `当前用量 $x = ${formatMathNumber(res.usage, 1)}$ 落入第 ${res.activeTier} 档计费区间。`,
          latex:
            res.activeTier === 1
              ? "0 \\le x \\le 4"
              : res.activeTier === 2
                ? "4 < x \\le 8"
                : "x > 8",
        },
        {
          step: 2,
          title: "建模联立 · 代入对应区间累进解析式",
          detail: "保留前序满额档位基础费，再叠加本档增量费用。",
          latex:
            res.activeTier === 1
              ? `C(${formatMathNumber(res.usage, 1)}) = ${r1} \\times ${formatMathNumber(res.usage, 1)}`
              : res.activeTier === 2
                ? `C(${formatMathNumber(res.usage, 1)}) = ${tier1Max} + ${r2}(${formatMathNumber(res.usage, 1)} - 4)`
                : `C(${formatMathNumber(res.usage, 1)}) = ${tier2Max} + ${r3}(${formatMathNumber(res.usage, 1)} - 8)`,
        },
        {
          step: 3,
          title: "求解反思 · 算出总费用与平均单价",
          detail: "核对总费用结果及单调递增的折线斜率特征。",
          latex: `C(x) = ${formatMathNumber(res.totalCost, 2)}, \\quad \\bar{c} = ${formatMathNumber(res.avgCost, 2)}`,
        },
      ],
      gaokaoPoints: [
        {
          text: "反求题型（已知总费用求用量）需先算出各档分界点的费用总额作为判别门槛，再逆解相应一次方程。",
          importance: "core",
        },
      ],
    };
  }

  // scatterFitting 模式
  const gain = params.gainScale ?? 1.0;
  const res = calcScatterFitting(fitModel, gain);
  const sseLin = calcScatterFitting("linear", gain).sse;
  const sseQuad = calcScatterFitting("quadratic", gain).sse;
  const sseExp = calcScatterFitting("exponential", gain).sse;

  return {
    examAnchor: "必修一第 4.5 节 · 散点数据函数拟合与预测",
    mnemonic: "画散点看趋势，算残差选最优，外推预测控范围！",
    quantities: [
      {
        label: "当前模型公式",
        symbol: "f(x)",
        value: res.formulaLatex,
        color: MATH_COLORS.function,
      },
      {
        label: "当前误差平方和",
        symbol: "SSE",
        value: formatMathNumber(res.sse, 3),
        highlight: res.sse < 1.0 ? "positive" : "negative",
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "线性模型参考SSE",
        symbol: "SSE_{\\text{线}}",
        value: formatMathNumber(sseLin, 3),
        color: MATH_COLORS.secantLine,
      },
      {
        label: "二次模型参考SSE",
        symbol: "SSE_{\\text{二}}",
        value: formatMathNumber(sseQuad, 3),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "指数模型参考SSE",
        symbol: "SSE_{\\text{指}}",
        value: formatMathNumber(sseExp, 3),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: `外推预测 (x=${res.nextX})`,
        symbol: `f(${res.nextX})`,
        value: formatMathNumber(res.nextPred, 2),
        color: MATH_COLORS.inequality,
      },
    ],
    theorems: [
      {
        name: "最小残差平方和模型优选准则",
        latex: "SSE = \\sum_{i=1}^n \\big(y_i - f(x_i)\\big)^2",
        condition: "适用前提：各备选函数模型在同一组实验散点上比较拟合优度。",
        note: "残差平方和 $SSE$ 越小，说明拟合曲线越贴近实验采集数据，对近邻未来点的外推可信度越高。",
        level: "core",
      },
    ],
    warnings: [
      {
        text: "模型外推提醒：函数拟合预测一般仅在观测区间邻近处可靠，远离已知样本的长期预测必须结合背景约束。",
        level: "info",
      },
    ],
    reasoningSteps: [
      {
        step: 1,
        title: "审题定法 · 识别散点增速形态",
        detail:
          "实验散点一阶差逐项递增，呈现明显加速上扬形态，优先排除纯线性假定。",
        latex: `\\Delta y: 1.1 \\to 1.8 \\to 3.2 \\to 4.7`,
      },
      {
        step: 2,
        title: "建模联立 · 量化各模型残差平方和",
        detail: "代入 $5$ 个采样点横坐标计算拟合偏差平方和 $SSE$。",
        latex: `SSE_{\\text{当前}} = ${formatMathNumber(res.sse, 3)}`,
      },
      {
        step: 3,
        title: "求解反思 · 选定优模型执行外推预测",
        detail: `代入 $x = ${res.nextX}$ 计算目标输出预测值。`,
        latex: `f(${res.nextX}) = ${formatMathNumber(res.nextPred, 2)}`,
      },
    ],
    gaokaoPoints: [
      {
        text: "课标函数建模五步闭环：审清题意 $\\to$ 设元定模型 $\\to$ 待定系数求解 $\\to$ 计算残差检验 $\\to$ 回归实际作答。",
        importance: "core",
      },
    ],
  };
}
