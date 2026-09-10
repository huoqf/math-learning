import type { MathPanelData, ReasoningStep } from "../types";
import { colorize } from "../types";
import {
  solveConstantSingleSep,
  solveConstantSingleDirect,
  solveConstantSingleSepTrans,
  solveConstantSingleDirectTrans,
  type TransModelKey,
} from "@/math/constant";
import { MATH_COLORS } from "@/theme";

export function buildConstantSinglePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const subMode = (config?.subMode as "sep" | "direct") || "sep";
  const logic = (config?.logic as "always" | "exist") || "always";
  const funModel =
    (config?.funModel as "quadratic" | "transcendent") || "quadratic";
  const transModel = (config?.transModel as TransModelKey) || "ln_x_over_x";
  const m = params.m ?? 0.5;
  const n = params.n ?? 2.5;
  const col = colorize;
  const isTranscendent = funModel === "transcendent";

  if (subMode === "sep") {
    return buildSepBranch(params, m, n, logic, isTranscendent, transModel, col);
  } else {
    return buildDirectBranch(params, m, n, isTranscendent, transModel, col);
  }
}

function buildSepBranch(
  params: Record<string, number>,
  m: number,
  n: number,
  logic: "always" | "exist",
  isTranscendent: boolean,
  transModel: TransModelKey,
  col: typeof colorize,
): MathPanelData {
  const a = params.a ?? 1.2;
  const res = isTranscendent
    ? solveConstantSingleSepTrans(a, m, n)
    : solveConstantSingleSep(a, m, n);

  const quantities: MathPanelData["quantities"] = [
    {
      label: "区间内最小值",
      symbol: "f(x)_{min}",
      value: res.fMin,
      color: MATH_COLORS.function,
    },
    {
      label: "最小值横坐标",
      symbol: "x_{min}",
      value: res.xFMin,
      color: MATH_COLORS.function,
    },
    {
      label: "区间内最大值",
      symbol: "f(x)_{max}",
      value: res.fMax,
      color: MATH_COLORS.derivative,
    },
    {
      label: "最大值横坐标",
      symbol: "x_{max}",
      value: res.xFMax,
      color: MATH_COLORS.derivative,
    },
    {
      label:
        logic === "always" ? "恒成立状态 (f(x) ≥ a)" : "存在性状态 (f(x) ≥ a)",
      value: (logic === "always" ? res.isAlwaysTrue : res.isExistTrue)
        ? "满足条件"
        : "违背条件",
      highlight: (logic === "always" ? res.isAlwaysTrue : res.isExistTrue)
        ? "extreme"
        : "negative",
    },
  ];

  // 注入定值不变量 (Invariants)
  if (isTranscendent) {
    if (transModel === "ln_x_over_x") {
      quantities.push({
        label: "驻点理论极值",
        symbol: "f(e) = \\frac{1}{e}",
        value: 0.368,
        color: MATH_COLORS.tangentLine,
        isInvariant: true,
        invariantNote: "驻点 x=e 处理论峰值，为恒成立关键分水岭",
      });
    } else if (transModel === "a_ln_x_minus_x") {
      quantities.push({
        label: "切线公切定点",
        symbol: "(x_0, y_0)",
        value: "(1, 0)",
        color: MATH_COLORS.tangentLine,
        isInvariant: true,
        invariantNote: "切线 ln x ≤ x - 1 在 x = 1 处等号恒成立",
      });
    } else if (transModel === "exp_minus_a_x_plus_1") {
      quantities.push({
        label: "指数下界定点",
        symbol: "(x_0, y_0)",
        value: "(0, 1)",
        color: MATH_COLORS.tangentLine,
        isInvariant: true,
        invariantNote: "切线 e^x ≥ x + 1 在 x = 0 处等号恒成立",
      });
    }
  } else {
    quantities.push({
      label: "抛物线顶点定点",
      symbol: "(x_v, y_v)",
      value: "(1, 1)",
      color: MATH_COLORS.tangentLine,
      isInvariant: true,
      invariantNote: "二次函数标准顶点坐标 (1, 1)，全域最小值为 1",
    });
  }

  const isAlways = logic === "always";
  const targetVal = isAlways ? res.fMin : res.fMax;
  const targetSymbol = isAlways ? "f(x)_{\\min}" : "f(x)_{\\max}";
  const boundSign = "\\le";

  // 第三步：计算符号推导与代入解析式（严禁孤立数字，严格按符号 -> 解析式代入 -> 结果演绎）
  let step3Latex = "";
  let step3Detail = "";
  if (!isTranscendent) {
    if (isAlways) {
      if (1.0 >= m && 1.0 <= n) {
        step3Latex = `f(x)_{\\min} = f(1) = 1^2 - 2(1) + 2 = 1.00 \\implies ${col("a", MATH_COLORS.paramPrimary)} \\le 1.00`;
        step3Detail = `对称轴 $x = 1$ 落在区间 $[${m.toFixed(2)}, ${n.toFixed(2)}]$ 内部，故在顶点处取得最小值 $f(1) = 1.00$。由充要条件 $a \\le f(x)_{\\min}$，解得 $a \\in (-\\infty, 1.00]$。当前设定 $a = ${a.toFixed(2)}$，${res.isAlwaysTrue ? "满足恒成立条件。" : "已超出上界，产生违背区间。"}`;
      } else if (1.0 < m) {
        const fVal = (m * m - 2 * m + 2).toFixed(2);
        step3Latex = `f(x)_{\\min} = f(m) = (${m.toFixed(2)})^2 - 2(${m.toFixed(2)}) + 2 = ${fVal} \\implies ${col("a", MATH_COLORS.paramPrimary)} \\le ${fVal}`;
        step3Detail = `对称轴 $x = 1 < m$，函数在 $[${m.toFixed(2)}, ${n.toFixed(2)}]$ 上单调递增，最小值在左端点取得：$f(m) = ${fVal}$。由充要条件 $a \\le f(x)_{\\min}$，解得 $a \\in (-\\infty, ${fVal}]$。当前设定 $a = ${a.toFixed(2)}$，${res.isAlwaysTrue ? "满足恒成立条件。" : "已超出上界，产生违背区间。"}`;
      } else {
        const fVal = (n * n - 2 * n + 2).toFixed(2);
        step3Latex = `f(x)_{\\min} = f(n) = (${n.toFixed(2)})^2 - 2(${n.toFixed(2)}) + 2 = ${fVal} \\implies ${col("a", MATH_COLORS.paramPrimary)} \\le ${fVal}`;
        step3Detail = `对称轴 $x = 1 > n$，函数在 $[${m.toFixed(2)}, ${n.toFixed(2)}]$ 上单调递减，最小值在右端点取得：$f(n) = ${fVal}$。由充要条件 $a \\le f(x)_{\\min}$，解得 $a \\in (-\\infty, ${fVal}]$。当前设定 $a = ${a.toFixed(2)}$，${res.isAlwaysTrue ? "满足恒成立条件。" : "已超出上界，产生违背区间。"}`;
      }
    } else {
      const xMaxName = res.xFMax === m ? "m" : "n";
      const xMaxVal = res.xFMax;
      const fVal = res.fMax.toFixed(2);
      step3Latex = `f(x)_{\\max} = f(${xMaxName}) = (${xMaxVal.toFixed(2)})^2 - 2(${xMaxVal.toFixed(2)}) + 2 = ${fVal} \\implies ${col("a", MATH_COLORS.paramPrimary)} \\le ${fVal}`;
      step3Detail = `在给定闭区间 $[${m.toFixed(2)}, ${n.toFixed(2)}]$ 上，二次函数最大值必在离对称轴较远的端点取得（当前在 $x = ${xMaxName} = ${xMaxVal.toFixed(2)}$ 处取最大值 $f(${xMaxName}) = ${fVal}$）。充要条件为 $a \\le f(x)_{\\max}$，解得 $a \\in (-\\infty, ${fVal}]$。当前设定 $a = ${a.toFixed(2)}$，${res.isExistTrue ? "满足存在性条件。" : "超过最大值，无解。"}`;
    }
  } else {
    if (transModel === "ln_x_over_x") {
      const e = Math.E;
      if (!isAlways) {
        if (m <= e && e <= n) {
          step3Latex = `f(x)_{\\max} = f(e) = \\frac{\\ln e}{e} = \\frac{1}{e} \\approx 0.37 \\implies ${col("a", MATH_COLORS.paramPrimary)} \\le \\frac{1}{e}`;
          step3Detail = `驻点 $x = e \\approx 2.72$ 落在区间 $[${m.toFixed(2)}, ${n.toFixed(2)}]$ 内，故极大值即为最大值 $f(e) = 1/e \\approx 0.37$。存在性充要条件为 $a \\le f(x)_{\\max}$，解得 $a \\le 1/e$。当前设定 $a = ${a.toFixed(2)}$，${res.isExistTrue ? "满足存在性条件。" : "已超出全域峰值，无解。"}`;
        } else {
          const xMaxName = res.xFMax === m ? "m" : "n";
          const xMaxVal = res.xFMax;
          const fVal = res.fMax.toFixed(2);
          step3Latex = `f(x)_{\\max} = f(${xMaxName}) = \\frac{\\ln ${xMaxVal.toFixed(2)}}{${xMaxVal.toFixed(2)}} = ${fVal} \\implies ${col("a", MATH_COLORS.paramPrimary)} \\le ${fVal}`;
          step3Detail = `极值点 $x = e$ 不在当前区间内，函数在区间上单调，最大值在端点 $x = ${xMaxName}$ 取得。充要条件为 $a \\le f(x)_{\\max}$，解得 $a \\le ${fVal}$。`;
        }
      } else {
        const xMinName = res.xFMin === m ? "m" : "n";
        const xMinVal = res.xFMin;
        const fVal = res.fMin.toFixed(2);
        step3Latex = `f(x)_{\\min} = f(${xMinName}) = \\frac{\\ln ${xMinVal.toFixed(2)}}{${xMinVal.toFixed(2)}} = ${fVal} \\implies ${col("a", MATH_COLORS.paramPrimary)} \\le ${fVal}`;
        step3Detail = `函数在区间端点 $x = ${xMinName} = ${xMinVal.toFixed(2)}$ 处取得最小值 $f(${xMinName}) = ${fVal}$。恒成立充要条件为 $a \\le f(x)_{\\min}$，解得 $a \\in (-\\infty, ${fVal}]$。当前设定 $a = ${a.toFixed(2)}$，${res.isAlwaysTrue ? "满足恒成立条件。" : "已超出底线，产生违背区间。"}`;
      }
    } else {
      const xVal = isAlways ? res.xFMin : res.xFMax;
      const targetValStr = targetVal.toFixed(2);
      step3Latex = `${targetSymbol} = f(${xVal.toFixed(2)}) = ${targetValStr} \\implies ${col("a", MATH_COLORS.paramPrimary)} ${boundSign} ${targetValStr}`;
      step3Detail = `函数在研究区间内的关键特征点 $x = ${xVal.toFixed(2)}$ 处取得极值 $${targetSymbol} = ${targetValStr}$。由等价转化条件，参数 $a$ 必须满足充要不等式 $a ${boundSign} ${targetValStr}$。`;
    }
  }

  // 高考解答题破题推导链（代数三部曲：审题定法 -> 建模联立 -> 求解反思）
  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: isAlways
        ? "第一步：审题定法 · 恒成立命题等价转化"
        : "第一步：审题定法 · 存在性命题等价转化",
      latex: isAlways
        ? `\\forall x \\in [${col(m.toFixed(2), MATH_COLORS.paramSecondary)}, ${col(n.toFixed(2), MATH_COLORS.paramTertiary)}], \\, f(x) \\ge ${col("a", MATH_COLORS.paramPrimary)} \\iff ${col("a", MATH_COLORS.paramPrimary)} \\le f(x)_{\\min}`
        : `\\exists x \\in [${col(m.toFixed(2), MATH_COLORS.paramSecondary)}, ${col(n.toFixed(2), MATH_COLORS.paramTertiary)}], \\, f(x) \\ge ${col("a", MATH_COLORS.paramPrimary)} \\iff ${col("a", MATH_COLORS.paramPrimary)} \\le f(x)_{\\max}`,
      detail: isAlways
        ? `恒成立问题采用【参变分离法】，将含参不等式转化为函数在区间 $[${m.toFixed(2)}, ${n.toFixed(2)}]$ 上的最小值问题。参数 $a$ 必须守住全域底线。`
        : `存在性问题采用【参变分离法】，不等式在区间 $[${m.toFixed(2)}, ${n.toFixed(2)}]$ 上有解，只需参数 $a$ 不超过函数的最大值，即寻求突破口。`,
      rubric: isAlways
        ? "建立恒成立充要转化方程 (3分)"
        : "建立存在性充要转化方程 (3分)",
    },
    {
      step: 2,
      title: "第二步：建模联立 · 求导单调性与极值分析",
      latex: isTranscendent
        ? transModel === "ln_x_over_x"
          ? `f'(x) = \\frac{1-\\ln x}{x^2}, \\quad f'(x) = 0 \\iff x = e \\approx 2.72`
          : transModel === "exp_minus_ax"
            ? `f'(x) = \\frac{e^x(x-1)}{x^2}, \\quad f'(x) = 0 \\iff x = 1`
            : transModel === "a_ln_x_minus_x"
              ? `f'(x) = \\frac{1}{x} - 1, \\quad f'(1) = 0`
              : `f'(x) = \\frac{x e^x}{(x+1)^2}, \\quad f'(0) = 0`
        : `f'(x) = 2x - 2, \\quad f'(x) = 0 \\iff x = 1`,
      detail: isTranscendent
        ? transModel === "ln_x_over_x"
          ? `当 $x \\in (0, e)$ 时 $f'(x) > 0$，$f(x)$ 单调递增；当 $x \\in (e, +\\infty)$ 时 $f'(x) < 0$，$f(x)$ 单调递减。在当前区间 $[${m.toFixed(2)}, ${n.toFixed(2)}]$ 上，最值由驻点 $x = e$ 与端点共同决定。`
          : `分析导函数的零点与正负符号，确定函数在区间 $[${m.toFixed(2)}, ${n.toFixed(2)}]$ 上的单调性变化。`
        : `导函数 $f'(x) = 2(x-1)$，在 $(-\\infty, 1)$ 单调递减，在 $(1, +\\infty)$ 单调递增，顶点驻点为 $x = 1$。`,
      rubric: "求导并确定函数在研究区间上的单调性 (5分)",
    },
    {
      step: 3,
      title: "第三步：求解反思 · 代数求界与充要判定",
      latex: step3Latex,
      detail: step3Detail,
      rubric: "代入数值并给出参数 a 的充要范围与反思判定 (4分)",
    },
  ];

  const theorems: MathPanelData["theorems"] = [
    {
      name: "恒成立等价转化",
      latex: `\\forall x \\in [m, n], \\, f(x) \\ge ${col("a", MATH_COLORS.paramPrimary)} \\iff f(x)_{\\min} \\ge ${col("a", MATH_COLORS.paramPrimary)}`,
      level: "core",
      prerequisites: ["区间范围 [m, n] 合理", "函数在闭区间连续且最值可达"],
    },
    {
      name: "存在性等价转化",
      latex: `\\exists x \\in [m, n], \\, f(x) \\ge ${col("a", MATH_COLORS.paramPrimary)} \\iff f(x)_{\\max} \\ge ${col("a", MATH_COLORS.paramPrimary)}`,
      level: "core",
      prerequisites: ["区间范围 [m, n] 合理", "函数在闭区间连续且最值可达"],
    },
  ];

  if (isTranscendent) {
    if (transModel === "ln_x_over_x") {
      theorems.push({
        name: "高考核心结构 f(x) = ln x / x",
        latex: `f'(x) = \\frac{1-\\ln x}{x^2} \\Rightarrow \\text{极大值点 } x=e, \\, f(e) = \\frac{1}{e} \\approx 0.368`,
        level: "important",
        prerequisites: ["定义域 x > 0", "单调性：(0, e) 增，(e, +∞) 减"],
      });
    } else if (transModel === "a_ln_x_minus_x") {
      theorems.push({
        name: "切线放缩与端点效应",
        latex: `\\ln x \\le x - 1 \\quad (x = 1 \\text{ 处等号成立})`,
        level: "important",
        prerequisites: ["用于放缩超越部分，确定必要条件 a = 1"],
      });
    } else if (transModel === "exp_minus_a_x_plus_1") {
      theorems.push({
        name: "指数放缩与切线下界",
        latex: `e^x \\ge x + 1 \\quad (x = 0 \\text{ 处等号成立})`,
        level: "important",
        prerequisites: ["切线 y = x+1 为 e^x 的下放缩界"],
      });
    }
  }

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = isTranscendent
    ? [
        {
          text: "参变分离法首选：将未知参数 $a$ 完全孤立于不等式一侧，转化为研究另一侧函数在给定区间 $[m, n]$ 上的最值。",
          importance: "gaokao",
        },
        {
          text: "临界点判定：对 $\\forall x$ 恒成立看最小值（底线），对 $\\exists x$ 存在性成立看最大值（突破口）。",
          importance: "core",
        },
        {
          text: "切线放缩秒杀：高考中极常用 $e^x \\ge x+1$ 与 $\\ln x \\le x-1$ 快速寻找临界边界 $a$。",
          importance: "gaokao",
        },
      ]
    : [
        {
          text: "参变分离法核心：二次函数参变分离后转化为水平线 $y = a$ 与抛物线 $f(x)$ 的高低对比。",
          importance: "gaokao",
        },
        {
          text: "恒成立看最小值，存在性看最大值。",
          importance: "core",
        },
      ];

  const warnings: MathPanelData["warnings"] = [];
  if (res.isDegenerate) {
    warnings.push({
      text: "区间发生退化 (m ≥ n 或超出定义域)，请调整区间滑块！",
      level: "danger",
    });
  }
  if (logic === "always" && !res.isAlwaysTrue) {
    warnings.push({
      text: `参数 a (${a.toFixed(2)}) 超出了函数最小值 ${res.fMin.toFixed(2)}，高亮违背区间内的 x 无法满足恒成立要求。`,
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic: isTranscendent
      ? "参变分离最直观，恒成求小存在大；切线放缩求临界，隐零代换解压轴。"
      : "参变分离超好用，恒成求小存在大；端点顶点两相较，高低立判定乾坤。",
  };
}

function buildDirectBranch(
  params: Record<string, number>,
  m: number,
  n: number,
  isTranscendent: boolean,
  _transModel: TransModelKey,
  col: typeof colorize,
): MathPanelData {
  const aAxis = params.a_axis ?? 1.0;
  const res = isTranscendent
    ? solveConstantSingleDirectTrans(aAxis, m, n)
    : solveConstantSingleDirect(aAxis, m, n);

  const quantities: MathPanelData["quantities"] = [
    {
      label: "研究区间内最小值",
      symbol: "f(x)_{min}",
      value: res.fMin,
      color: MATH_COLORS.function,
    },
    {
      label: "极值/驻点横坐标",
      symbol: "x_{min}",
      value: res.xFMin,
      color: MATH_COLORS.function,
    },
    {
      label: "驻点相对位置",
      value:
        res.discussionType === "left"
          ? "区间左侧 (a < m)"
          : res.discussionType === "right"
            ? "区间右侧 (a > n)"
            : "区间内部 (m ≤ a ≤ n)",
    },
    {
      label: "恒成立状态 (f(x) ≥ 0)",
      value: res.isAlwaysTrue ? "恒成立满足" : "存在违背区",
      highlight: res.isAlwaysTrue ? "extreme" : "negative",
    },
  ];

  // 注入分类讨论特征不变量
  if (!isTranscendent) {
    quantities.push({
      label: "判别式不变量",
      symbol: "\\Delta = 4a^2 - 8",
      value: (4 * aAxis * aAxis - 8).toFixed(2),
      color: MATH_COLORS.tangentLine,
      isInvariant: true,
      invariantNote: "当 a=±√2 时 Δ=0，为全域恒成立临界判据",
    });
  }

  // 第三步：代入当前分支的解析式与参数充要判定（严禁孤立数字）
  let directStep3Latex = "";
  let directStep3Detail = "";
  if (!isTranscendent) {
    if (res.discussionType === "left") {
      const boundA = ((m * m + 2) / (2 * m)).toFixed(2);
      directStep3Latex = `f(x)_{\\min} = f(m) = (${m.toFixed(2)})^2 - 2(${m.toFixed(2)})a + 2 \\ge 0 \\iff a \\le \\frac{m^2+2}{2m} = ${boundA}`;
      directStep3Detail = `当前处于轴在区间左侧（$a < m = ${m.toFixed(2)}$），单增。最小值在左端点取得：$f(m) \\ge 0 \\iff a \\le ${boundA}$。结合前提 $a < ${m.toFixed(2)}$，由于 $m < ${boundA}$，此时 $a < ${m.toFixed(2)}$ 全部满足。当前设定 $a = ${aAxis.toFixed(2)}$，${res.isAlwaysTrue ? "满足恒成立要求。" : "不满足恒成立。"}`;
    } else if (res.discussionType === "inside") {
      directStep3Latex = `f(x)_{\\min} = f(a) = 2 - a^2 \\ge 0 \\iff a^2 \\le 2 \\iff -\\sqrt{2} \\le a \\le \\sqrt{2} \\approx 1.41`;
      directStep3Detail = `当前处于轴在区间内部（$m \\le a \\le n$），顶点即最小值：$f(a) = 2 - a^2 \\ge 0 \\iff -\\sqrt{2} \\le a \\le \\sqrt{2}$。当前设定 $a = ${aAxis.toFixed(2)}$，${res.isAlwaysTrue ? "顶点高度 ≥ 0，满足恒成立要求。" : "顶点高度跌破 0，产生违背区。"}`;
    } else {
      const boundA = ((n * n + 2) / (2 * n)).toFixed(2);
      directStep3Latex = `f(x)_{\\min} = f(n) = (${n.toFixed(2)})^2 - 2(${n.toFixed(2)})a + 2 \\ge 0 \\iff a \\le \\frac{n^2+2}{2n} = ${boundA}`;
      directStep3Detail = `当前处于轴在区间右侧（$a > n = ${n.toFixed(2)}$），单减。最小值在右端点取得：$f(n) \\ge 0 \\iff a \\le ${boundA}$。结合前提 $a > ${n.toFixed(2)}$，充要范围为 $n < a \\le ${boundA}$。当前设定 $a = ${aAxis.toFixed(2)}$，${res.isAlwaysTrue ? "满足恒成立要求。" : "不满足恒成立。"}`;
    }
  } else {
    if (res.discussionType === "left") {
      const boundA = (Math.exp(m) / m).toFixed(2);
      directStep3Latex = `f(x)_{\\min} = f(m) = e^{${m.toFixed(2)}} - ${m.toFixed(2)}a \\ge 0 \\iff a \\le \\frac{e^m}{m} = ${boundA}`;
      directStep3Detail = `当前处于驻点在区间左侧（$\\ln a < m$ 即 $a < e^m$），单增。最小值在左端点取得：$f(m) = e^m - am \\ge 0 \\iff a \\le ${boundA}$。当前设定 $a = ${aAxis.toFixed(2)}$，${res.isAlwaysTrue ? "满足恒成立要求。" : "不满足恒成立。"}`;
    } else if (res.discussionType === "inside") {
      directStep3Latex = `f(x)_{\\min} = f(\\ln a) = a(1 - \\ln a) \\ge 0 \\iff \\ln a \\le 1 \\iff a \\le e \\approx 2.72`;
      directStep3Detail = `当前处于驻点在区间内部（$m \\le \\ln a \\le n$），极小值即最小值：$f(\\ln a) = a(1 - \\ln a) \\ge 0$。充要条件为 $a \\le e$。当前设定 $a = ${aAxis.toFixed(2)}$，${res.isAlwaysTrue ? "极小值 ≥ 0，满足恒成立要求。" : "极小值跌破 0，产生违背区。"}`;
    } else {
      const boundA = (Math.exp(n) / n).toFixed(2);
      directStep3Latex = `f(x)_{\\min} = f(n) = e^{${n.toFixed(2)}} - ${n.toFixed(2)}a \\ge 0 \\iff a \\le \\frac{e^n}{n} = ${boundA}`;
      directStep3Detail = `当前处于驻点在区间右侧（$\\ln a > n$ 即 $a > e^n$），单减。最小值在右端点取得：$f(n) = e^n - an \\ge 0 \\iff a \\le ${boundA}$。当前设定 $a = ${aAxis.toFixed(2)}$，${res.isAlwaysTrue ? "满足恒成立要求。" : "不满足恒成立。"}`;
    }
  }

  // 高考破题推导链：分类讨论三部曲
  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: "第一步：审题定法 · 求导与含参驻点确定",
      latex: isTranscendent
        ? `f'(x) = e^x - ${col("a", MATH_COLORS.paramPrimary)}, \\quad f'(x) = 0 \\iff x = \\ln ${col("a", MATH_COLORS.paramPrimary)} \\quad (a > 0)`
        : `f'(x) = 2x - 2${col("a", MATH_COLORS.paramPrimary)}, \\quad f'(x) = 0 \\iff x = ${col("a", MATH_COLORS.paramPrimary)}`,
      detail: isTranscendent
        ? `对含参超越函数求导，当 $a > 0$ 时导数存在唯一零点 $x_0 = \\ln a$。极小值点随参数 $a$ 动态变化，需就驻点与研究区间 $[${m.toFixed(2)}, ${n.toFixed(2)}]$ 的相对位置分类讨论。`
        : `二次函数对称轴与极小值点为 $x = a$。对称轴随参数 $a$ 平移（轴动区间定），必须根据对称轴落在区间左侧、内部或右侧分类讨论。`,
      rubric: "求导确定含参驻点与分类依据 (3分)",
    },
    {
      step: 2,
      title: "第二步：建模联立 · 轴动区间定三类分类推演",
      latex: !isTranscendent
        ? `f(x)_{\\min} = \\begin{cases} f(m) = m^2 - 2am + 2, & a < m \\\\[2pt] f(a) = 2 - a^2, & m \\le a \\le n \\\\[2pt] f(n) = n^2 - 2an + 2, & a > n \\end{cases}`
        : `f(x)_{\\min} = \\begin{cases} f(m), & \\ln a < m \\\\[2pt] f(\\ln a) = a(1 - \\ln a), & m \\le \\ln a \\le n \\\\[2pt] f(n), & \\ln a > n \\end{cases}`,
      detail:
        res.discussionType === "left"
          ? `当前参数处于【第一类：轴在区间左侧 ($a < m$)】：函数在 $[${m.toFixed(2)}, ${n.toFixed(2)}]$ 上严格单调递增，最小值在左端点取得，即 $f_{\\min} = f(m)$。`
          : res.discussionType === "inside"
            ? `当前参数处于【第二类：轴在区间内部 ($m \\le a \\le n$)】：极小值点落在区间内，函数先减后增，最小值在顶点处取得，即 $f_{\\min} = f(a)$。`
            : `当前参数处于【第三类：轴在区间右侧 ($a > n$)】：函数在 $[${m.toFixed(2)}, ${n.toFixed(2)}]$ 上严格单调递减，最小值在右端点取得，即 $f_{\\min} = f(n)$。`,
      rubric: "全面列出三段分类单调性与最小值表达式 (5分)",
    },
    {
      step: 3,
      title: "第三步：求解反思 · 代入分支求解与充要判定",
      latex: directStep3Latex,
      detail: directStep3Detail,
      rubric: "代入数值并给出对应分支不等式与综合解集 (4分)",
    },
  ];

  const theorems: MathPanelData["theorems"] = isTranscendent
    ? [
        {
          name: "分类讨论法（含参超越函数）",
          latex: `f(x) \\ge 0 \\iff f(x)_{\\min} \\ge 0`,
          level: "core",
          prerequisites: ["基于导函数 f'(x) 的零点讨论单调性区段"],
        },
        {
          name: "隐零点设而不求法",
          latex: `f'(x_0) = 0 \\Rightarrow \\text{用 } x_0 \\text{ 表达参数并在 } f(x_0) \\text{ 中消元}`,
          level: "important",
          prerequisites: ["适用于导数零点无法显式表示的压轴题"],
        },
      ]
    : [
        {
          name: "分类讨论法（轴动区间定）",
          latex: `f(x) = x^2 - 2${col("a", MATH_COLORS.paramPrimary)}x + 2 \\ge 0 \\iff f(x)_{\\min} \\ge 0`,
          level: "core",
          prerequisites: ["对称轴 x = a 相对区间 [m, n] 的位置"],
        },
        {
          name: "三段分类临界",
          latex: `f(x)_{\\min} = \\begin{cases} f(m), & a < m \\\\ f(a), & m \\le a \\le n \\\\ f(n), & a > n \\end{cases}`,
          level: "important",
          prerequisites: ["临界讨论点为 a = m 与 a = n"],
        },
      ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = isTranscendent
    ? [
        {
          text: "高考压轴必备：当参变分离导致函数极度复杂时，直接讨论法是唯一突破路径。",
          importance: "gaokao",
        },
        {
          text: "隐零点设而不求技巧：设 $f'(x_0) = 0$，利用关系式代换消去指数/对数，将最值转化为关于 $x_0$ 的单变量问题。",
          importance: "gaokao",
        },
        {
          text: "端点效应：若 $f(x_0) = 0$，可先求 $f'(x_0) \\ge 0$ 获得参数 $a$ 的必要条件，再证明充分性。",
          importance: "core",
        },
      ]
    : [
        {
          text: "直接最值讨论法：对称轴 $x = a$ 与区间 $[m, n]$ 分为“轴在左、轴在中、轴在右”三类。",
          importance: "gaokao",
        },
        {
          text: "临界点恰好是对称轴与端点重合时（$a = m$ 或 $a = n$）。",
          importance: "core",
        },
      ];

  const warnings: MathPanelData["warnings"] = [];
  if (res.isDegenerate) {
    warnings.push({
      text: "区间发生退化，请重新调整区间滑块！",
      level: "danger",
    });
  }
  if (!res.isAlwaysTrue) {
    warnings.push({
      text: `函数最小值跌破 0 (${res.fMin.toFixed(2)})，高亮违背区间内的 x 不满足恒成立要求。`,
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic: isTranscendent
      ? "求导先找极小点，无法显示设 x₀；消去指对求最值，端点效应先必要。"
      : "轴动定区间讨论，端点顶点定分界；分类求导算最值，三段讨论解乾坤。",
  };
}
