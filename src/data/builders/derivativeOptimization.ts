/**
 * 导数实际生活优化建模右屏数据组装器
 * 遵循系统公理 2：左问右解闭环，推导链三部曲
 */
import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  ReasoningStep,
} from "../types";
import {
  calculateOptimizationModel,
  OPTIMIZATION_CONSTANTS,
  type OptimizationModelType,
} from "@/math/derivativeOptimization";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber, formatSignedTerm } from "@/utils/mathFormat";

export function buildDerivativeOptimizationPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const modelType = ((config?.modelType as string) ||
    "box") as OptimizationModelType;

  let xVal = params.box_x ?? 10;
  if (modelType === "can") xVal = params.can_r ?? 4.5;
  if (modelType === "profit") xVal = params.profit_x ?? 30;

  const res = calculateOptimizationModel(modelType, xVal);

  const targetSymbol =
    modelType === "box" ? "V" : modelType === "can" ? "S" : "P";
  const targetName =
    modelType === "box" ? "容积" : modelType === "can" ? "表面积" : "利润";

  const quantities: MathQuantity[] = [
    {
      label: "目标函数解析式",
      value: `$${res.funcExpr}$`,
      color: MATH_COLORS.functionTransformed,
    },
    {
      label: "物理定义域",
      symbol: modelType === "can" ? "r" : "x",
      value: `$${formatMathNumber(res.domainMin)} < ${modelType === "can" ? "r" : "x"} < ${Number.isFinite(res.domainMax) ? formatMathNumber(res.domainMax) : "+\\infty"}$`,
      color: MATH_COLORS.axis,
    },
    {
      label: "当前自变量",
      symbol: modelType === "can" ? "r" : "x",
      // 量值必须带单位：否则 16000 到底读作 cm³ 还是 m³ 无从判断，高考解答题直接扣分
      value: `${formatMathNumber(res.xVal)} ${res.xUnit}`,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: `当前${targetName}`,
      symbol: targetSymbol,
      value: `${formatMathNumber(res.yVal)} ${res.yUnit}`,
      color: MATH_COLORS.function,
    },
    {
      label: "瞬时导数变化率",
      symbol:
        modelType === "box" ? "V'(x)" : modelType === "can" ? "S'(r)" : "P'(x)",
      value: `${formatMathNumber(res.primeVal)} ${res.yUnit}/${res.xUnit}`,
      color: MATH_COLORS.derivative,
    },
    {
      label: "理论最优解",
      // 符号必须随模型换字母：can 的自变量是底面半径 r，写死 x^* 会让右屏符号与题干脱节
      symbol: modelType === "can" ? "r^*" : "x^*",
      value: `${formatMathNumber(res.optimalX)} ${res.xUnit}（最值 ${formatMathNumber(res.optimalY)} ${res.yUnit}）`,
      color: MATH_COLORS.focusPoint,
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "函数极值与导数为零的点充要判别",
      latex: "f'(x^*) = 0 \\quad \\text{且左右导数变号}",
      note: "可导函数在开区间 $(a, b)$ 取得极值的必要条件是导数为零；当导数由正变负时取得极大值，由负变正时取得极小值。",
      condition: "目标函数在实际物理定义域内连续可导",
      level: "core",
    },
    {
      name: "实际问题单极值点即最值定理",
      latex: "\\text{开区间内唯一极大值点} \\implies \\text{全局最大值}",
      note: "在实际生活优化建模中，若目标函数在开区间内只有一个导数为零的点，且物理背景决定该最值存在，则该导数为零的点即为全局最优解。",
      condition: "连续函数在开区间内仅含唯一导数为零的点",
      level: "important",
    },
    {
      name: "端点趋势检验 · 最值定论的闭环依据",
      latex: res.endpointCheckLatex,
      note: "「开区间内唯一导数为零的点即最值」这一步不是想当然：必须补上两端趋势的比较（趋于 0、趋于无穷或取极限值），才能把局部极值升级为全局最值。漏写端点比较是高考解答题的常见扣分点。",
      condition: "目标函数在物理定义域两端存在有限极限或发散趋势",
      level: "important",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "高考建模大题必考：实际物理定义域的严格确立。绝不可照搬纯代数自然定义域，必须紧扣几何边长、材料非负与产量正定等客观约束列出不等式组。",
      importance: "gaokao",
    },
    {
      text: "极值点与最值判定的逻辑闭环。必须使用表格或叙述说明导数为零的点两侧导数符号的由正变负（或由负变正），并补上两端趋势比较，杜绝直接断言导数为零的点就是最值而失分。",
      importance: "core",
    },
  ];

  const C = OPTIMIZATION_CONSTANTS;

  let step1Title = "审题定法 · 建立物理几何目标函数";
  let step1Detail = "";
  let step1Latex = "";

  let step2Title = "建模联立 · 求导并解导数为零的方程";
  let step2Detail = "";
  let step2Latex = "";

  let step3Title = "求解反思 · 单调性检验与最值定解";
  let step3Detail = "";
  let step3Latex = "";

  if (modelType === "box") {
    const { L } = C.box;
    step1Title = "审题定法 · 边长约束与长方体容积建构";
    step1Detail = `边长为 $${formatMathNumber(L)}\\text{cm}$ 的正方形，四角剪去小正方形边长为 $x$。折成长方体底面边长为 $${formatMathNumber(L)} - 2x$，高为 $x$。列出物理定义域 $x \\in (0, ${formatMathNumber(res.domainMax)})$。`;
    step1Latex = `${res.funcExpr} \\quad (0 < x < ${formatMathNumber(res.domainMax)})`;

    step2Title = "建模联立 · 求导因式分解求极值点";
    step2Detail = `对容积函数求导并因式分解：$${res.primeExpr}$。令 $V'(x) = 0$ 解得符合物理意义的解。`;
    step2Latex = `V'(x) = 12(x - ${formatMathNumber(res.optimalX)})(x - ${formatMathNumber(res.domainMax)}) = 0 \\implies x_1 = ${formatMathNumber(res.optimalX)}, \\; x_2 = ${formatMathNumber(res.domainMax)}\\,(\\text{舍去})`;

    step3Title = "求解反思 · 列表讨论符号得出最大容积";
    step3Detail = `当 $x \\in (0, ${formatMathNumber(res.optimalX)})$ 时 $V'(x) > 0$，$V(x)$ 单调递增；当 $x \\in (${formatMathNumber(res.optimalX)}, ${formatMathNumber(res.domainMax)})$ 时 $V'(x) < 0$，$V(x)$ 单调递减。因此 $x = ${formatMathNumber(res.optimalX)}\\text{cm}$ 为唯一极大值点即最大值点。`;
    step3Latex = `x^* = ${formatMathNumber(res.optimalX)}\\text{cm} \\implies V_{\\max} = ${formatMathNumber(res.optimalX)} \\times ${formatMathNumber(L - 2 * res.optimalX)}^2 = ${formatMathNumber(res.optimalY)}\\text{cm}^3`;
  } else if (modelType === "can") {
    const { V } = C.can;
    const hDenom = 2 * V;
    step1Title = "审题定法 · 容积消元建立表面积函数";
    step1Detail = `设圆柱底面半径为 $r$，高为 $h$。容积 $V = \\pi r^2 h = ${formatMathNumber(V)}$ 消去 $h = \\frac{${formatMathNumber(V)}}{\\pi r^2}$。建立全表面积关于 $r$ 的目标函数，定义域 $r \\in (0, +\\infty)$。`;
    step1Latex = `S(r) = 2\\pi r^2 + 2\\pi rh = 2\\pi r^2 + \\frac{${formatMathNumber(hDenom)}}{r} \\quad (r > 0)`;

    step2Title = "建模联立 · 求导并求解";
    step2Detail = `对全表面积函数求导：$${res.primeExpr} = \\frac{4\\pi r^3 - ${formatMathNumber(hDenom)}}{r^2}$。令 $S'(r) = 0$ 解得极小值点。`;
    // 数字一律经 formatMathNumber（全页唯一格式化口径）；不得另用 toFixed(2) 造成同页两种精度
    step2Latex = `S'(r) = 0 \\implies r^3 = \\frac{${formatMathNumber(V / 2)}}{\\pi} \\implies r^* = \\sqrt[3]{\\frac{${formatMathNumber(V / 2)}}{\\pi}} \\approx ${formatMathNumber(res.optimalX)}\\text{cm}`;

    step3Title = "求解反思 · 高径比反思与材料最省准则";
    step3Detail = `验证当 $r < r^*$ 时 $S'(r) < 0$；当 $r > r^*$ 时 $S'(r) > 0$。唯一极小值点即为全表面积最小点。此时高 $h = \\frac{V}{\\pi r^2} = 2r$，即高与底面直径相等时最省材料。`;
    step3Latex = `h^* = 2r^* \\implies \\text{圆柱高与底面直径相等时材料最省}`;
  } else {
    const { a, c, priceBase, costFixed, costUnit, b } = C.profit;
    step1Title = "审题定法 · 收益与成本差额建构利润模型";
    step1Detail = `销售量为 $x$ 件，单价随销量变动，收益 $R(x) = ${formatMathNumber(priceBase)}x - ${formatMathNumber(a)}x^2$，固定与可变成本 $C(x) = ${formatMathNumber(costFixed)} + ${formatMathNumber(costUnit)}x$。利润为 $P(x) = R(x) - C(x)$。`;
    step1Latex = `${res.funcExpr} \\quad (x \\ge 0)`;

    step2Title = "建模联立 · 边际利润为零的一阶最优性条件";
    step2Detail = `对总利润函数求一阶导数（即边际利润）：$${res.primeExpr}$。令 $P'(x) = 0$。`;
    // 不得写 `P'(x) = ${res.primeExpr}` —— res.primeExpr 自带 `P'(x) =` 前缀，
    // 拼接后会印出 `P'(x) = P'(x) = -x + 40` 的重复符号。
    step2Latex = `${res.primeExpr} = 0 \\implies x^* = ${formatMathNumber(res.optimalX)}`;

    step3Title = "求解反思 · 最佳生产规模确定与最大利润";
    step3Detail = `当 $x < ${formatMathNumber(res.optimalX)}$ 时边际利润大于零，继续生产可增加利润；当 $x > ${formatMathNumber(res.optimalX)}$ 时边际利润小于零。最佳生产规模为 $x^* = ${formatMathNumber(res.optimalX)}$ 件。`;
    step3Latex = `x^* = ${formatMathNumber(res.optimalX)} \\implies P_{\\max} = ${formatSignedTerm(-a, `(${formatMathNumber(res.optimalX)})^2`, true)} ${formatSignedTerm(b, `(${formatMathNumber(res.optimalX)})`)} ${formatSignedTerm(-c, "")} = ${formatMathNumber(res.optimalY)}\\text{元}`;
  }

  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: step1Title,
      detail: step1Detail,
      latex: step1Latex,
      rubric: "准确设定自变量并列出目标函数与实际物理定义域得 4 分",
    },
    {
      step: 2,
      title: step2Title,
      detail: step2Detail,
      latex: step2Latex,
      rubric: "正确求导并规范求解导数为零的方程得 4 分",
    },
    {
      step: 3,
      title: step3Title,
      detail: step3Detail,
      latex: step3Latex,
      rubric: "完整给出单调性符号列表或说明，写出最值定论得 4 分",
    },
    {
      step: 4,
      title: "端点趋势检验 · 确认全局最值",
      detail:
        "把导数为零的点结论升级为全局最值，必须在物理定义域两端各取一次趋势比较：只有端点趋势与「唯一导数为零的点为极大（小）值」相容，才能断定它就是全局最大（小）值。这一步是高考解答题的标准收尾，漏写会直接扣分。",
      latex: res.endpointCheckLatex,
      rubric: "补出两端极限趋势并与导数为零的点结论对齐得 2 分",
    },
  ];

  const warnings: MathPanelData["warnings"] = [
    {
      text: "【定义域陷阱】目标函数的定义域必须由实际约束确定（边长非负、材料非负、产量为正），照搬代数自然定义域是首要失分点——列错定义域后续全部作废。",
      level: "warning",
    },
    {
      text: "【端点比较陷阱】求出导数为零的点后必须补上两端的趋势比较，才能把「局部极值」升级为「全局最值」；直接断言导数为零的点即最值属于逻辑跳跃，高考按步给分会被扣。",
      level: "warning",
    },
  ];
  if (res.warning) {
    warnings.push({ text: res.warning, level: "info" });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic:
      "审题设元定范围，列出函数求导数；令导为零找零点，端点比较定最值。",
  };
}
