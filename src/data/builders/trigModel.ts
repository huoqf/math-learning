import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  ReasoningStep,
  WarningItem,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  formatMathNumber,
  formatPiFraction,
  formatPiFractionLatex,
} from "@/utils/mathFormat";
import {
  TRIG_SCENARIOS,
  buildHarmonicModel,
  getScenario,
  harmonicPhase,
  harmonicValue,
  solveModelFromGraph,
} from "@/math/trigModel";

/**
 * 「三角函数模型应用」右屏看板（人教A版必修一 5.7）。
 *
 * 三种探究模式与左屏一致：
 *   harmonic  —— 简谐运动模型：$h = A\sin(\omega t + \varphi) + k$ 的四个量各有什么几何含义
 *   fromGraph —— 由图象求解析式：最值定 $A,k$ → 周期定 $\omega$ → 波峰定 $\varphi$
 *   modeling  —— 实际情境应用：把「最高最低 / 一次变化用时 / 初始状态」翻译成四个量并作预测
 *
 * 考纲边界：本页只涉及 5.7 的应用（简谐运动、周期现象的刻画与预测），
 * 不引入图象变换的作图细节（归 5.6 页），也不涉及导数、极值、单调性等后续内容。
 * 数学量一律走 `formatMathNumber` / `formatPiFraction` 两个 SSOT，杜绝浮点尾零与近似退化。
 */

/** 初相读数：能写成 $k\pi/n$ 就用分数形式，否则退回精简小数（均为纯文本） */
function phiReading(phi: number): string {
  const frac = formatPiFraction(phi);
  return frac !== null ? frac : formatMathNumber(phi);
}

/** 初相的 LaTeX 读数（供公式串使用） */
function phiLatexAbs(phi: number): string {
  const frac = formatPiFraction(phi);
  if (frac !== null) {
    // formatPiFractionLatex 对可分数化的角不会退化到 \approx
    return formatPiFractionLatex(phi).replace(/^-/, "");
  }
  return formatMathNumber(Math.abs(phi));
}

/**
 * 相位项 $\omega t + \varphi$ 的高中规范书写。
 *
 * 反例：$\varphi = 0$ 时写「$t + 0$」、$\varphi < 0$ 时写「$t + -1.57$」（双符号相连）。
 * 正例：$\varphi = 0$ → 「$t$」；$\varphi = -\frac{\pi}{2}$ → 「$t - \frac{\pi}{2}$」。
 */
function phaseTerm(periodStr: string, phi: number): string {
  const head = `\\dfrac{2\\pi t}{${periodStr}}`;
  if (Math.abs(phi) < 1e-9) return head;
  const sign = phi < 0 ? "-" : "+";
  return `${head} ${sign} ${phiLatexAbs(phi)}`;
}

export function buildTrigModelPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) ?? "harmonic";
  const scenarioKey = (config?.scenarioKey as string) ?? TRIG_SCENARIOS[0].key;

  const A = params.A ?? 2;
  const period = params.period ?? 2;
  const phi = params.phi ?? Math.PI / 2;
  const k = params.k ?? 0;
  const tRatio = params.tRatio ?? 0.75;

  const model = buildHarmonicModel(A, period, phi, k);
  const tProbe = tRatio * period;
  const hProbe = harmonicValue(model, tProbe);
  const phaseProbe = harmonicPhase(model, tProbe);

  const aStr = formatMathNumber(model.amplitude);
  const tStr = formatMathNumber(model.period);
  const wStr = formatMathNumber(model.omega);
  const kStr = formatMathNumber(model.balance);
  const phiStr = phiReading(model.phi);
  const tProbeStr = formatMathNumber(tProbe);
  const hProbeStr = formatMathNumber(hProbe);

  const warnings: WarningItem[] = [];
  if (model.amplitude < 1e-9) {
    warnings.push({
      text: "振幅 A = 0 时图象退化为水平直线 h = k，不存在振动，此时无法由图象反解出振幅。",
      level: "warning",
    });
  }

  // ── modeling：实际情境应用 ──
  if (studyMode === "modeling") {
    const scenario = getScenario(scenarioKey) ?? TRIG_SCENARIOS[0];
    const probeStr = formatMathNumber(scenario.probeTime);

    const quantities: MathQuantity[] = [
      {
        label: "建模对象",
        value: `${scenario.name}（${scenario.quantity}）`,
        color: MATH_COLORS.function,
      },
      {
        label: "振幅 A",
        symbol: "A",
        value: aStr,
        color: MATH_COLORS.paramPrimary,
        highlight: "positive",
      },
      {
        label: "周期 T",
        symbol: "T",
        value: tStr,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "角频率 ω = 2π / T",
        symbol: "\\omega = \\dfrac{2\\pi}{T}",
        value: wStr,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "初相 φ",
        symbol: "\\varphi",
        value: phiStr,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "平衡位置 k",
        symbol: "k",
        value: kStr,
        color: MATH_COLORS.functionSecondary,
      },
      {
        label: "取值范围",
        symbol: "k - A \\le h \\le k + A",
        value: `[${formatMathNumber(model.minValue)}, ${formatMathNumber(model.maxValue)}]`,
        color: MATH_COLORS.function,
      },
      {
        label: `预测值（当前观测点 t = ${tProbeStr}）`,
        symbol: "h(t)",
        value: hProbeStr,
        color: MATH_COLORS.paramPrimary,
        highlight: "positive",
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "三角函数建模的三步法",
        latex:
          "\\text{读条件} \\to \\text{定四量} \\to \\text{写解析式} \\to \\text{作预测}",
        condition: "面对周期现象，按固定顺序把文字条件翻译成四个量",
        note: "「最高/最低」折半给出 $A$ 与 $k$；「一次完整变化用时」直接给出 $T$；「$t = 0$ 时的状态」给出 $\\varphi$。四量齐备后即可写出 $h = A\\sin(\\omega t + \\varphi) + k$ 并预测任意时刻。",
        level: "core",
      },
      {
        name: "本情境的解析式",
        latex: `h = ${aStr}\\sin\\!\\left(${phaseTerm(tStr, model.phi)}\\right) + ${kStr}`,
        condition: `${scenario.background}`,
        note: "把该式与图象对照：波峰高度应为 $k + A$，波谷高度应为 $k - A$，相邻两个波峰的水平距离应为 $T$。三处都对得上，说明建模无误。",
        level: "core",
      },
      {
        name: "值域与最值",
        latex: `k - A = ${formatMathNumber(model.minValue)}, \\quad k + A = ${formatMathNumber(model.maxValue)}, \\quad \\omega = \\dfrac{2\\pi}{T} = ${wStr}`,
        condition: "由四个量派生出的判别指标",
        note: "预测某时刻的取值，只需把该时刻代入解析式；反过来问「何时达到某个取值」则要解三角方程 $\\omega t + \\varphi = \\theta + 2n\\pi$，必须按题设区间写出全部解，漏解是主要失分点。",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "实际情境题的建模套路是固定的：先从文字中找出「最高值 / 最低值」定 $A$ 与 $k$，再找出「一次完整变化所用的时间（周期）」定 $\\omega$，最后用「初始状态」定 $\\varphi$。",
        importance: "gaokao",
      },
      {
        text: "预测类设问只要把时刻代入解析式求函数值；而「何时达到某值」要解三角方程，必须按题设区间写出全部解，漏解是主要失分点。",
        importance: "core",
      },
    ];

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法 · 读出文字里的三个条件",
        detail: `${scenario.background} 本情境的设问时刻为 $t = ${probeStr}$。由此得：$t = 0$ 的状态定 $\\varphi$，最高最低之差定 $A$，一次完整变化用时定 $T$。`,
        rubric: "要点：把文字条件逐条对应到 A、T、φ、k",
      },
      {
        step: 2,
        title: "建模联立 · 定四量并写出解析式",
        detail: `当前四量为 $A = ${aStr}$、$T = ${tStr}$、$\\varphi = ${phiStr}$、$k = ${kStr}$，故 $\\omega = \\dfrac{2\\pi}{${tStr}} = ${wStr}$，解析式为 $h = ${aStr}\\sin\\!\\left(${phaseTerm(tStr, model.phi)}\\right) + ${kStr}$。`,
        latex: `\\omega = \\dfrac{2\\pi}{${tStr}} = ${wStr}, \\quad \\varphi = ${phiStr}`,
        rubric: "要点：由周期派生 ω，再代入标准形式",
      },
      {
        step: 3,
        title: "代入求解 · 回答情境设问",
        detail: `${scenario.probeQuestion} 把观测点对准设问时刻即得 $t = ${tProbeStr}$，此时相位 $\\omega t + \\varphi = ${formatMathNumber(phaseProbe)}$，函数值 $h = ${hProbeStr}$。`,
        latex: `h(${tProbeStr}) = ${aStr}\\sin\\!\\left(${phaseTerm(tStr, model.phi)}\\right)\\Big|_{t = ${tProbeStr}} + ${kStr} = ${hProbeStr}`,
        rubric: "要点：代入并核对结果是否落在 [k − A, k + A] 内",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      reasoningSteps,
      mnemonic:
        "最值折半定幅心，一次全振得周期；起点状态定初相，四量齐备模型成。",
    };
  }

  // ── fromGraph：由图象求解析式 ──
  if (studyMode === "fromGraph") {
    const solved = solveModelFromGraph({
      maxValue: model.maxValue,
      minValue: model.minValue,
      maxTime: model.maxTime,
      period: model.period,
    });
    if (!solved.isValid && solved.warning) {
      warnings.push({ text: solved.warning, level: "warning" });
    }

    const live = (v: string, fallback: string) =>
      solved.isValid ? v : fallback;

    const quantities: MathQuantity[] = [
      {
        label: "最高点横坐标",
        symbol: "t_{max}",
        value: formatMathNumber(model.maxTime),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "最高点纵坐标",
        symbol: "h_{max}",
        value: formatMathNumber(model.maxValue),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "最低点纵坐标",
        symbol: "h_{min}",
        value: formatMathNumber(model.minValue),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "周期（横向读数）",
        symbol: "T",
        value: tStr,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "反解 振幅 A",
        symbol: "A = \\dfrac{h_{max} - h_{min}}{2}",
        value: live(formatMathNumber(solved.amplitude), "无法反解"),
        color: MATH_COLORS.paramPrimary,
        highlight: "positive",
      },
      {
        label: "反解 平衡位置 k",
        symbol: "k = \\dfrac{h_{max} + h_{min}}{2}",
        value: live(formatMathNumber(solved.balance), "无法反解"),
        color: MATH_COLORS.functionSecondary,
      },
      {
        label: "反解 角频率 ω",
        symbol: "\\omega = \\dfrac{2\\pi}{T}",
        value: live(formatMathNumber(solved.omega), "无法反解"),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "反解 初相 φ",
        symbol: "\\varphi = \\dfrac{\\pi}{2} - \\dfrac{2\\pi}{T}t_{max}",
        value: solved.isValid ? phiReading(solved.phi) : "无法反解",
        color: MATH_COLORS.paramTertiary,
        highlight: "positive",
      },
    ];

    const hMaxStr = formatMathNumber(model.maxValue);
    const hMinStr = formatMathNumber(model.minValue);
    const tMaxStr = formatMathNumber(model.maxTime);
    const residualStr = solved.isValid
      ? formatMathNumber(solved.residual)
      : "—";

    const theorems: Theorem[] = [
      {
        name: "由图象求解析式的读数顺序",
        latex:
          "h_{max}, h_{min} \\to A,\\ k; \\quad T \\to \\omega; \\quad t_{max} \\to \\varphi",
        condition: "图象题的固定读数流程，顺序不可颠倒",
        note: "先由最值定 $A$ 与 $k$，再由周期定 $\\omega$，最后用**一个已知点的坐标**定 $\\varphi$ —— 因为 $\\varphi$ 只影响图象的左右位置，必须借助具体点的坐标才能锁定。",
        level: "core",
      },
      {
        name: "由最值反解振幅与平衡位置",
        latex:
          "A = \\dfrac{h_{max} - h_{min}}{2}, \\quad k = \\dfrac{h_{max} + h_{min}}{2}",
        condition:
          "$h_{max}$、$h_{min}$ 为图象一个周期内的最高、最低点的纵坐标",
        note: "两条式的记忆锚点：$A$ 管「半幅」，$k$ 管「中线」。$A$ 恒为正，$k$ 可正可负。",
        level: "core",
      },
      {
        name: "由波峰反解初相",
        latex:
          "\\omega t_{max} + \\varphi = \\dfrac{\\pi}{2} + 2k\\pi \\implies \\varphi = \\dfrac{\\pi}{2} - \\dfrac{2\\pi}{T}t_{max}",
        condition: "$t_{max}$ 为所取波峰（最高点）的横坐标",
        note: "求出 $\\varphi$ 后必须折算到题设区间（常为 $(-\\pi, \\pi]$）：加上或减去 $2\\pi$ 的整数倍不改变图象，但会影响答案判定。",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "由图求解析式是三角函数最基础也最高频的题型，标准动作是「最值 → 周期 → 特殊点」，三步各自锁定一个量，缺一不可。",
        importance: "gaokao",
      },
      {
        text: "最常见的失分点：把 $h_{max}$ 直接当成 $A$（漏了 $k$ 的平移）、以及 $\\varphi$ 未折算到题设区间。",
        importance: "gaokao",
      },
    ];

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法 · 由最值定 A 与 k",
        detail: `图象最高点纵坐标 $h_{max} = ${hMaxStr}$、最低点纵坐标 $h_{min} = ${hMinStr}$，故振幅与平衡位置分别为 $A = \\dfrac{${hMaxStr} - ${hMinStr}}{2} = ${aStr}$，$k = \\dfrac{${hMaxStr} + ${hMinStr}}{2} = ${kStr}$。`,
        latex: `A = \\dfrac{${hMaxStr} - ${hMinStr}}{2} = ${aStr}, \\quad k = \\dfrac{${hMaxStr} + ${hMinStr}}{2} = ${kStr}`,
        rubric: "要点：先折半求振幅，再取平均求平衡位置",
      },
      {
        step: 2,
        title: "建模联立 · 由周期定 ω、由波峰定 φ",
        detail: `图象上一个完整周期的横向读数为 $T = ${tStr}$，故 $\\omega = \\dfrac{2\\pi}{${tStr}} = ${wStr}$；再令所取波峰处的相位等于 $\\dfrac{\\pi}{2}$，得 $\\varphi = \\dfrac{\\pi}{2} - \\dfrac{2\\pi}{${tStr}}\\times ${tMaxStr} = ${phiStr}$。`,
        latex: `\\omega = \\dfrac{2\\pi}{${tStr}} = ${wStr}, \\quad \\varphi = \\dfrac{\\pi}{2} - \\dfrac{2\\pi}{${tStr}}\\times ${tMaxStr} = ${phiStr}`,
        rubric: "要点：ω 由 T 唯一确定，φ 必须借助具体点",
      },
      {
        step: 3,
        title: "代入求解 · 代回校验并写出解析式",
        detail: `把反解结果代回波峰横坐标 $t = ${tMaxStr}$，应恰好取到最高点，残差 $|h(t_{max}) - h_{max}| = ${residualStr}$；解析式为 $h = ${aStr}\\sin\\!\\left(${phaseTerm(tStr, model.phi)}\\right) + ${kStr}$。`,
        latex: `h = ${aStr}\\sin\\!\\left(${phaseTerm(tStr, model.phi)}\\right) + ${kStr}`,
        rubric: "要点：代回校验，确保反解与图象自洽",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      reasoningSteps,
      mnemonic: "最高最低折半幅，最高最低取中平；周期倒数定角频，波峰相位π/2。",
    };
  }

  // ── harmonic：简谐运动模型 ──
  const quantities: MathQuantity[] = [
    {
      label: "振幅 A",
      symbol: "A",
      value: aStr,
      color: MATH_COLORS.paramPrimary,
      highlight: "positive",
    },
    {
      label: "周期 T",
      symbol: "T",
      value: tStr,
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "角频率 ω = 2π / T",
      symbol: "\\omega = \\dfrac{2\\pi}{T}",
      value: wStr,
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "频率 f = 1 / T",
      symbol: "f = \\dfrac{1}{T}",
      value: formatMathNumber(model.frequency),
      color: MATH_COLORS.function,
    },
    {
      label: "初相 φ",
      symbol: "\\varphi",
      value: phiStr,
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "平衡位置 k",
      symbol: "k",
      value: kStr,
      color: MATH_COLORS.functionSecondary,
    },
    {
      label: "值域 [k − A, k + A]",
      symbol: "k - A \\le h \\le k + A",
      value: `[${formatMathNumber(model.minValue)}, ${formatMathNumber(model.maxValue)}]`,
      color: MATH_COLORS.function,
    },
    {
      label: `观测点位移 h(t)（t = ${tProbeStr}）`,
      symbol: "h(t)",
      value: hProbeStr,
      color: MATH_COLORS.paramPrimary,
      highlight: "positive",
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "简谐运动的标准形式",
      latex: "h = A\\sin(\\omega t + \\varphi) + k",
      condition:
        "$A > 0$ 为振幅，$\\omega > 0$ 为角频率，$\\varphi$ 为初相，$k$ 为平衡位置",
      note: "四个量各有分工：$A$ 决定纵向摆幅，$\\omega$ 决定横向疏密（周期），$\\varphi$ 决定起始时刻处于什么位置，$k$ 决定整条曲线的高低。",
      level: "core",
    },
    {
      name: "周期、频率与角频率的关系",
      latex:
        "T = \\dfrac{2\\pi}{\\omega}, \\quad f = \\dfrac{1}{T} = \\dfrac{\\omega}{2\\pi}",
      condition: "$T$ 为完成一次完整振动所需的自变量增量",
      note: "实际情境题给出的时间条件几乎都是周期，故先由 $T$ 定 $\\omega = \\dfrac{2\\pi}{T}$，再由 $\\omega$ 写解析式，比直接给 $\\omega$ 更贴近题意。",
      level: "core",
    },
    {
      name: "三个关键相位与对应位置",
      latex:
        "\\omega t + \\varphi = 0 \\Rightarrow h = k, \\quad = \\dfrac{\\pi}{2} \\Rightarrow h = k + A, \\quad = -\\dfrac{\\pi}{2} \\Rightarrow h = k - A",
      condition: "相位取特殊值时函数取到平衡位置、最高点与最低点",
      note: "相位为 $0$ 时位于平衡位置且正在上升；为 $\\dfrac{\\pi}{2}$ 时位于波峰；为 $-\\dfrac{\\pi}{2}$ 时位于波谷。由 $t = 0$ 的位置即可反推初相。",
      level: "important",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "三角函数应用题的第一步永远是「读条件 → 定四量」：把文字里的最高/最低、一次完整振动的时间、起始位置分别翻译成 $A$ 与 $k$、$T$、$\\varphi$。",
      importance: "gaokao",
    },
    {
      text: "最常见的两个初相：$t = 0$ 在最高点取 $\\varphi = \\dfrac{\\pi}{2}$，$t = 0$ 在平衡位置且上升取 $\\varphi = 0$。初相写错是本题型最主要的失分点。",
      importance: "gaokao",
    },
  ];

  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: "审题定法 · 把文字条件翻译成四个量",
      detail:
        "「最高与最低」折半给出振幅 $A$ 与平衡位置 $k$；「完成一次完整振动所用时间」直接给出周期 $T$；「$t = 0$ 时的状态」作为定初相 $\\varphi$ 的特殊点。",
      rubric: "要点：四条文字条件分别对应四个量，不可交叉使用",
    },
    {
      step: 2,
      title: "建模联立 · 写出解析式",
      detail: `由周期派生角频率 $\\omega = \\dfrac{2\\pi}{T} = \\dfrac{2\\pi}{${tStr}} = ${wStr}$，四量齐备后代入标准形式得 $h = ${aStr}\\sin\\!\\left(${phaseTerm(tStr, model.phi)}\\right) + ${kStr}$。`,
      latex: `h = ${aStr}\\sin\\!\\left(${phaseTerm(tStr, model.phi)}\\right) + ${kStr}`,
      rubric: "要点：先由 T 派生 ω，再整体代入标准形式",
    },
    {
      step: 3,
      title: "代入求解 · 预测指定时刻的位移",
      detail: `把观测时刻 $t = ${tProbeStr}$ 代入解析式，相位 $\\omega t + \\varphi = ${formatMathNumber(phaseProbe)}$，位移 $h = ${hProbeStr}$；该值必落在值域 $[${formatMathNumber(model.minValue)}, ${formatMathNumber(model.maxValue)}]$ 内。`,
      latex: `h(${tProbeStr}) = ${aStr}\\sin\\!\\left(${phaseTerm(tStr, model.phi)}\\right)\\Big|_{t = ${tProbeStr}} + ${kStr} = ${hProbeStr}`,
      rubric: "要点：代入求值并用值域复核结果",
    },
  ];

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic:
      "振幅管摆幅，周期管疏密；初相定起点，平衡线定高低；四量齐备，解析式立成。",
  };
}
