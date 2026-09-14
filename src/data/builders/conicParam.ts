import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import {
  calculateEllipseParam,
  calculateParabolaYParam,
  calculateLineYFormConic,
} from "@/math/conicParam";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber, formatSignedTerm } from "@/utils/mathFormat";

export function buildConicParamPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  let rawMode = (config?.studyMode as string) || "ellipseTrig";
  // 兼容旧模式 key
  if (rawMode === "ellipseParam") rawMode = "ellipseTrig";
  if (rawMode === "lineParam") rawMode = "parabolaYParam";
  if (rawMode === "tSimplify") rawMode = "lineYForm";

  const studyMode = rawMode;

  const a = params.a ?? 4;
  const b = params.b ?? 3;
  const theta = params.theta ?? 45;
  const p = params.p ?? 2;
  const y1 = params.y1 ?? 3;
  const y2 = params.y2 ?? -1.5;
  const m = params.m ?? 0.8;
  const n = params.n ?? 1;

  // --------------------------------------------------------------------------
  // 模式 1: 椭圆三角参数设点与辅助角最值化简 (ellipseTrig)
  // --------------------------------------------------------------------------
  if (studyMode === "ellipseTrig") {
    const targetLine = { A: 1, B: -1, C: -6 };
    const res = calculateEllipseParam(a, b, theta, targetLine);

    const quantities: MathQuantity[] = [
      {
        label: "椭圆半轴 $a, b$",
        symbol: "a, b",
        value: `a = ${formatMathNumber(a)}, b = ${formatMathNumber(b)}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "参数角 $\\theta$",
        symbol: "\\theta",
        value: `${theta}^\\circ`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "椭圆动点 $P$ 坐标",
        symbol: "P(a\\cos\\theta, b\\sin\\theta)",
        value: `(${formatMathNumber(res.P.x)}, ${formatMathNumber(res.P.y)})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "辅助离心圆点 $P'$",
        symbol: "P'(a\\cos\\theta, a\\sin\\theta)",
        value: `(${formatMathNumber(res.Paux.x)}, ${formatMathNumber(res.Paux.y)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "切线截距三角形面积 $S$",
        symbol: "S = \\frac{ab}{|\\sin 2\\theta|}",
        value: isFinite(res.triangleArea)
          ? `${formatMathNumber(res.triangleArea)} (最小值 ${formatMathNumber(a * b)})`
          : "\\infty",
        color: MATH_COLORS.accent,
      },
      {
        label: "到直线 $x - y - 6 = 0$ 的当前距离",
        symbol: "d_P",
        value: formatMathNumber(res.distToTargetLine),
        color: MATH_COLORS.paramTertiary,
      },
    ];

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "第一步：审题定法 · 椭圆单参数三角设点",
        latex: `P(a\\cos\\theta, b\\sin\\theta) = (${formatMathNumber(a)}\\cos\\theta, ${formatMathNumber(b)}\\sin\\theta)`,
        detail:
          "利用 $\\cos^2\\theta + \\sin^2\\theta = 1$ 的三角有界性，将椭圆上二维坐标降维为单自变量 $\\theta \\in [0, 2\\pi)$，免去无理根号与双变量约束。",
        rubric: "正确设出动点三角参数坐标 (3分)",
      },
      {
        step: 2,
        title: "第二步：建模联立 · 点线距离的辅助角化简",
        latex: `d(\\theta) = \\frac{|${formatMathNumber(a)}\\cos\\theta - ${formatMathNumber(b)}\\sin\\theta - 6|}{\\sqrt{1^2 + (-1)^2}} = \\frac{|5\\sin(\\theta + \\varphi) - 6|}{\\sqrt{2}}`,
        detail: `代入直线方程得分子 $(Aa)\\cos\\theta + (Bb)\\sin\\theta + C$。由辅助角公式 $(Aa)\\cos\\theta + (Bb)\\sin\\theta = \\sqrt{(Aa)^2 + (Bb)^2}\\sin(\\theta+\\varphi)$，计算振幅 $R = \\sqrt{(1\\times ${formatMathNumber(a)})^2 + (-1\\times ${formatMathNumber(b)})^2} = 5$。`,
        rubric: "运用辅助角公式化为单角函数式 (4分)",
      },
      {
        step: 3,
        title: "第三步：求解反思 · 三角函数有界性求最值",
        latex: `d_{\\min} = \\frac{|-6 + 5|}{\\sqrt{2}} = \\frac{\\sqrt{2}}{2} \\approx ${formatMathNumber(res.minDist)}, \\quad d_{\\max} = \\frac{|-6 - 5|}{\\sqrt{2}} = \\frac{11\\sqrt{2}}{2} \\approx ${formatMathNumber(res.maxDist)}`,
        detail:
          "当 $\\sin(\\theta+\\varphi) = 1$ 时取到最小值，当 $\\sin(\\theta+\\varphi) = -1$ 时取到最大值。全程无需联立二次方程求判别式 $\\Delta = 0$。",
        rubric: "准确得出距离最值解集与反思 (3分)",
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "椭圆标准参数三角设点定理",
        latex:
          "\\begin{cases} x = a\\cos\\theta \\\\ y = b\\sin\\theta \\end{cases} \\quad (\\theta \\in [0, 2\\pi))",
        condition:
          "适用于椭圆上动点到直线距离、三角形面积或多项式最值；把二次型代数问题转化为一次三角函数辅助角最值问题。",
      },
      {
        name: "椭圆切线方程与截距三角形面积",
        latex:
          "\\frac{x\\cos\\theta}{a} + \\frac{y\\sin\\theta}{b} = 1 \\implies S = \\frac{ab}{|\\sin 2\\theta|} \\ge ab",
        condition:
          "在第一象限，当离心角 $\\theta = 45^\\circ$ 时，$\\sin 2\\theta = 1$，切线与坐标轴围成的三角形面积取得最小值 $ab$。",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "【新高考标内合规】三角换元是课标正文明确认可的代数降维方法。在解析几何解答题中，凡求解椭圆动点最值（如距离最值、内积最值），设 $P(a\\cos\\theta, b\\sin\\theta)$ 可直接运用三角有界性 $[-1, 1]$ 秒杀，避开切线联立的复杂消元。",
        importance: "core",
      },
      {
        text: "辅助离心圆几何投影：椭圆可视为半径为 $a$ 的离心辅助圆沿纵轴方向按比例 $\\frac{b}{a}$ 压缩而得，参数角 $\\theta$ 具有直观的中心角几何意义。",
        importance: "hard",
      },
    ];

    const warnings: WarningItem[] = [];
    if (a <= b) {
      warnings.push({
        text: "几何退化警示：焦点在 $x$ 轴上的椭圆必须满足 $a > b > 0$，当前参数 $a \\le b$。",
        level: "warning",
      });
    }

    return {
      quantities,
      reasoningSteps,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic:
        "椭圆动点三角设，消去根号最值捷；辅助角化单自变，有界区间答案现。",
    };
  }

  // --------------------------------------------------------------------------
  // 模式 2: 抛物线纵坐标单参数设点与免联立模型 (parabolaYParam)
  // --------------------------------------------------------------------------
  if (studyMode === "parabolaYParam") {
    const res = calculateParabolaYParam(p, y1, y2);
    const ySum = y1 + y2;
    const yProd = y1 * y2;

    const quantities: MathQuantity[] = [
      {
        label: "抛物线焦准距 $p$",
        symbol: "p",
        value: `p = ${formatMathNumber(p)}, \\text{ 焦点 } F(${formatMathNumber(p / 2)}, 0)`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 $A, B$ 单参数纵坐标",
        symbol: "y_1, y_2",
        value: `y_1 = ${formatMathNumber(y1)}, y_2 = ${formatMathNumber(y2)}`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "动点 $A, B$ 完整坐标",
        symbol: "A, B",
        value: `A(${formatMathNumber(res.pointA.x)}, ${formatMathNumber(y1)}), B(${formatMathNumber(res.pointB.x)}, ${formatMathNumber(y2)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "割线 $AB$ 斜率 $k$",
        symbol: "k = \\frac{2p}{y_1 + y_2}",
        value: isFinite(res.slope) ? formatMathNumber(res.slope) : "\\infty",
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "割线 $x$ 轴截距 $x_0$",
        symbol: "x_0 = -\\frac{y_1 y_2}{2p}",
        value: `${formatMathNumber(res.xIntercept)} ${res.isFocusChord ? "(过焦点 $F$)" : ""}`,
        color: res.isFocusChord ? MATH_COLORS.accent : MATH_COLORS.paramPrimary,
      },
      {
        label: "弦中点 $M$ 坐标",
        symbol: "M\\left(\\frac{y_1^2+y_2^2}{4p}, \\frac{y_1+y_2}{2}\\right)",
        value: `(${formatMathNumber(res.pointM.x)}, ${formatMathNumber(res.pointM.y)})`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "相交弦长 $|AB|$",
        symbol: "|AB|",
        value: formatMathNumber(res.chordLength),
        color: MATH_COLORS.accent,
      },
    ];

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "第一步：审题设元 · 单参数设纵坐标消元",
        latex: `A\\left(\\frac{y_1^2}{2p}, y_1\\right), \\quad B\\left(\\frac{y_2^2}{2p}, y_2\\right)`,
        detail:
          "针对抛物线 $y^2 = 2px$，以纵坐标 $y$ 为单一自由自变量设点，横坐标由 $x = \\frac{y^2}{2p}$ 直接由二次式给出，彻底摆脱根号。",
        rubric: "设出纵坐标单参数并表示端点坐标 (3分)",
      },
      {
        step: 2,
        title: "第二步：建模联立 · 两点式直接推导割线方程",
        latex: `k_{AB} = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{2p}{y_1 + y_2} \\implies (y_1 + y_2)y = 2px + y_1 y_2`,
        detail:
          "新高考答题神技：两点割线方程无需列一元二次方程与韦达定理，直接由平方差因式分解写出，形式极其对称！",
        rubric: "化简求出割线对称方程与斜率 (4分)",
      },
      {
        step: 3,
        title: "第三步：求解反思 · 定值结论与弦长代入",
        latex: res.isFocusChord
          ? `y_1 y_2 = -p^2 = -${formatMathNumber(p * p)} \\implies x_0 = \\frac{p}{2} = ${formatMathNumber(p / 2)}`
          : `y_1 + y_2 = ${formatMathNumber(ySum)}, \\; y_1 y_2 = ${formatMathNumber(yProd)} \\implies x_0 = ${formatMathNumber(res.xIntercept)}`,
        detail: res.isFocusChord
          ? "割线过焦点 $F(p/2, 0)$ 的充要条件是纵坐标乘积为定值 $y_1 y_2 = -p^2$；此时弦长等于焦半径之和 $|AB| = x_1 + x_2 + p$。"
          : "割线与 $x$ 轴交点横坐标 $x_0 = -\\frac{y_1 y_2}{2p}$；点差法斜率公式 $k_{AB} = \\frac{p}{y_M}$ 一步得出弦中点约束。",
        rubric: "完成几何结论代换与反思验证 (3分)",
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "抛物线两点割线与切线统一方程",
        latex:
          "(y_1 + y_2)y = 2px + y_1 y_2 \\quad (y_1 = y_2 \\text{ 时为切线 } y_1 y = p(x + x_1))",
        condition:
          "适用于抛物线上两动点割线问题；过定点时直接代入定点坐标，瞬间得到 $y_1 y_2$ 与 $y_1 + y_2$ 的线性关系。",
      },
      {
        name: "抛物线焦点弦纵坐标定值定理",
        latex:
          "AB \\text{ 过焦点 } F\\left(\\frac{p}{2}, 0\\right) \\iff y_1 y_2 = -p^2",
        condition:
          "高考小题秒杀法则：过焦点的割线两端点纵坐标之积恒为常数 $-p^2$，弦长等于焦点弦公式 $|AB| = x_1 + x_2 + p$。",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "【新高考降维首选】解答题设点优先于设线：传统设直线 $y=kx+b$ 与抛物线联立，需要讨论 $k$ 是否存在，还要算判别式 $\\Delta$ 和韦达定理，代数运算量极大；而设两点纵坐标 $y_1, y_2$，直接写出割线方程 $(y_1+y_2)y=2px+y_1y_2$，免联立直接降维，是全国卷压轴大题的最佳答题路线。",
        importance: "core",
      },
      {
        text: "点差法与中点弦公式：割线斜率 $k_{AB} = \\frac{2p}{y_1+y_2} = \\frac{p}{y_M}$，表明抛物线平行弦的中点轨迹是一条平行于对称轴的射线。",
        importance: "hard",
      },
    ];

    const warnings: WarningItem[] = [];
    if (Math.abs(y1 - y2) < 0.1) {
      warnings.push({
        text: "临界状态：$y_1 \\approx y_2$，动点 $A, B$ 重合，割线逼近切线状态。",
        level: "info",
      });
    }

    return {
      quantities,
      reasoningSteps,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic:
        "抛物设点纵坐标，平方除以两倍 $p$；两点割线免联立，乘积为负定值齐。",
    };
  }

  // --------------------------------------------------------------------------
  // 模式 3: 设线降维 x = my + n 与对称韦达消元模型 (lineYForm)
  // --------------------------------------------------------------------------
  const res = calculateLineYFormConic(a, b, m, n);

  const quantities: MathQuantity[] = [
    {
      label: "椭圆方程",
      symbol: "\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1",
      value: `\\frac{x^2}{${formatMathNumber(a * a)}} + \\frac{y^2}{${formatMathNumber(b * b)}} = 1`,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "割线方程 (以 $y$ 为主元)",
      symbol: "x = my + n",
      value: `x = ${formatMathNumber(m)}y ${formatSignedTerm(n, "")}`,
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "联立后关于 $y$ 的方程",
      symbol: "Ay^2 + By + C = 0",
      value: res.valid
        ? `${formatMathNumber(res.A)}y^2 ${formatSignedTerm(res.B, "y")} ${formatSignedTerm(res.C, "")} = 0`
        : "无实根",
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "判别式 $\\Delta_y$",
      symbol: "\\Delta_y = 4a^2b^2(b^2m^2+a^2-n^2)",
      value: `${formatMathNumber(res.deltaY)} ${res.deltaY > 0 ? "(两相交点)" : res.deltaY === 0 ? "(相切)" : "(无交点)"}`,
      color: res.valid ? MATH_COLORS.paramTertiary : MATH_COLORS.accent,
    },
  ];

  if (res.valid) {
    quantities.push(
      {
        label: "纵坐标和与积 (韦达定理)",
        symbol: "y_1+y_2, \\; y_1 y_2",
        value: `y_1+y_2 = ${formatMathNumber(res.ySum)}, \\; y_1 y_2 = ${formatMathNumber(res.yProd)}`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "相交弦长 $|AB|$",
        symbol: "|AB| = \\sqrt{1+m^2}|y_1-y_2|",
        value: formatMathNumber(res.chordLength),
        color: MATH_COLORS.accent,
      },
      {
        label: "原点三角形面积 $S_{\\triangle OAB}$",
        symbol: "S = \\frac{1}{2}|n||y_1-y_2|",
        value: formatMathNumber(res.triangleAreaOAB),
        color: MATH_COLORS.accent,
      },
    );
  }

  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: "第一步：审题定法 · 为何设割线为 $x = my + n$？",
      latex: `x = my + n \\quad (m = \\cot\\alpha)`,
      detail:
        "新高考第一命题避坑法则：设 $y=kx+b$ 必须严密分类讨论斜率不存在；设 $x=my+n$ 天然涵盖所有与 $y$ 轴不平行的直线（当 $m=0$ 时为垂直于 $x$ 轴的铅垂割线 $x=n$），无死角且自洽。",
      rubric: "合理设定以 y 为主元的割线方程 (3分)",
    },
    {
      step: 2,
      title: "第二步：建模联立 · 代入椭圆展开关于 y 的二次方程",
      latex: `(${formatMathNumber(res.A)})y^2 ${formatSignedTerm(res.B, "y")} ${formatSignedTerm(res.C, "")} = 0`,
      detail:
        "消去 $x$ 得到关于纵坐标 $y$ 的整系数二次方程，无高次分母通分，直接由韦达定理写出 $y_1+y_2$ 与 $y_1 y_2$。",
      rubric: "联立化简并由韦达定理表达对称项 (4分)",
    },
    {
      step: 3,
      title: "第三步：求解反思 · 面积与弦长代数降维消元",
      latex: res.valid
        ? `S_{\\triangle OAB} = \\frac{1}{2}|n|\\sqrt{(y_1+y_2)^2 - 4y_1y_2} = ${formatMathNumber(res.triangleAreaOAB)}`
        : `\\Delta_y < 0 \\text{ (直线与椭圆无交点)}`,
      detail:
        "三角形面积 $S_{\\triangle OAB} = \\frac{1}{2}|x_0||y_1-y_2|$，底边直接取为割线在 $x$ 轴截距 $|n|$，高为纵坐标差 $|y_1-y_2|$，计算步骤精简 60% 以上。",
      rubric: "准确计算目标面积并给出几何结论 (3分)",
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "截距式割线方程与韦达降维定理",
      latex:
        "x = my + n \\implies (b^2 m^2 + a^2)y^2 + 2b^2 mn y + b^2(n^2 - a^2) = 0",
      condition:
        "判别式前提 $\\Delta_y = 4a^2 b^2(b^2 m^2 + a^2 - n^2) > 0$；无需讨论斜率是否存在，弦长为 $|AB| = \\sqrt{1+m^2}|y_1-y_2|$。",
    },
    {
      name: "原点弦三角形面积紧凑公式",
      latex: "S_{\\triangle OAB} = \\frac{1}{2}|n||y_1 - y_2|",
      condition:
        "割线与 $x$ 轴交点为 $(n, 0)$，将三角形沿 $x$ 轴拆分为上下两部分，底为 $|n|$，高之和为 $|y_1-y_2|$。",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "【规范答题安全】设 $x=my+n$ 是新高考阅卷采分点最高的标准设线形式。若直线不过原点，利用截距 $n$ 将面积转化为 $\\frac{1}{2}|n|\\sqrt{(y_1+y_2)^2-4y_1y_2}$，是全国新高考 I 卷与全国甲卷压轴题官方标答推崇的化简通路。",
      importance: "core",
    },
    {
      text: "垂直直线自洽性：当 $m=0$ 时，割线为 $x=n$（平行于 $y$ 轴），判别式退化为 $4a^2b^2(a^2-n^2) > 0 \\iff |n| < a$，交点为 $(n, \\pm b\\sqrt{1-n^2/a^2})$，全过程数学逻辑完全闭合。",
      importance: "hard",
    },
  ];

  const warnings: WarningItem[] = [];
  if (!res.valid) {
    warnings.push({
      text: "无交点警示：当前割线与椭圆判别式 $\\Delta_y < 0$，割线与椭圆无实数交点。",
      level: "danger",
    });
  } else if (res.deltaY === 0) {
    warnings.push({
      text: "临界状态：判别式 $\\Delta_y = 0$，割线与椭圆相切，两交点重合。",
      level: "info",
    });
  }

  return {
    quantities,
    reasoningSteps,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "设线常设 $x=my+n$，免去斜率不存在；纵标联立韦达巧，弦长面积秒解完。",
  };
}
