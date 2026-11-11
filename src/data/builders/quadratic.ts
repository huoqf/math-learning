import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import { colorize } from "../types";
import { solveQuadratic } from "@/math/quadratic";
import { quadraticChecker } from "@/math/degeneration";
import { MATH_COLORS } from "@/theme";
import {
  formatMathNumber,
  formatCoefTerm,
  formatLinearExpr,
  formatShiftParen,
} from "@/utils/mathFormat";
import { buildQuadraticLatex } from "@/utils/polyBuilder";

const PARAM_COLORS = {
  a: MATH_COLORS.paramPrimary,
  b: MATH_COLORS.paramSecondary,
  c: MATH_COLORS.paramTertiary,
};

export function buildQuadraticPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const a = params.a ?? 1;
  const b = params.b ?? 0;
  const c = params.c ?? 0;
  const studyMode =
    (config?.studyMode as "function" | "equation" | "inequality") || "function";
  const ineqType = (config?.ineqType as ">" | "<") || ">";

  const res = solveQuadratic(a, b, c);
  const { a: ca, b: cb, c: cc } = PARAM_COLORS;
  const col = colorize;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  const reasoningSteps: ReasoningStep[] = [];
  let mnemonic = "一柱擎天看a值，左同右异定轴线，常数c点过y轴。";

  if (studyMode === "function") {
    buildFunctionMode(
      quantities,
      theorems,
      gaokaoPoints,
      reasoningSteps,
      a,
      b,
      c,
      res,
      col,
      ca,
      cb,
      cc,
    );
  } else if (studyMode === "equation") {
    mnemonic = buildEquationMode(
      quantities,
      theorems,
      gaokaoPoints,
      reasoningSteps,
      warnings,
      a,
      b,
      c,
      res,
      col,
      ca,
      cb,
      cc,
    );
  } else {
    mnemonic = buildInequalityMode(
      quantities,
      theorems,
      gaokaoPoints,
      reasoningSteps,
      warnings,
      a,
      b,
      c,
      ineqType,
      res,
      col,
      ca,
      cb,
      cc,
    );
  }

  const degCheck = quadraticChecker.check({ a, b, c });
  degCheck.reports.forEach((r) => {
    if (studyMode === "inequality" && r.message.includes("二次项系数 a 为 0"))
      return;
    warnings.push({
      text: r.hint ? `${r.message}。${r.hint}。` : r.message,
      level: r.level as "danger" | "warning",
    });
  });

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic,
  };
}

function buildFunctionMode(
  quantities: MathQuantity[],
  theorems: Theorem[],
  gaokaoPoints: GaokaoPoint[],
  reasoningSteps: ReasoningStep[],
  a: number,
  b: number,
  c: number,
  res: ReturnType<typeof solveQuadratic>,
  col: typeof colorize,
  ca: string,
  cb: string,
  cc: string,
) {
  quantities.push(
    {
      label: "二次项系数",
      symbol: "a",
      value: a,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "一次项系数",
      symbol: "b",
      value: b,
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "常数项",
      symbol: "c",
      value: c,
      color: MATH_COLORS.paramTertiary,
    },
    { label: "开口方向", value: res.direction },
    {
      label: "对称轴",
      symbol: "x",
      value: res.axisX !== null ? `x = ${formatMathNumber(res.axisX)}` : "无",
    },
    {
      label: "顶点坐标",
      value:
        res.vertexX !== null && res.vertexY !== null
          ? `(${formatMathNumber(res.vertexX)}, ${formatMathNumber(res.vertexY)})`
          : "无",
    },
  );

  theorems.push(
    {
      name: "二次函数一般式",
      latex: `y = ${col("a", ca)}x^2 + ${col("b", cb)}x + ${col("c", cc)} \\quad (${col("a", ca)} \\neq 0)`,
      level: "core",
      prerequisites: ["$a \\neq 0$"],
    },
    {
      name: "对称轴与顶点坐标公式",
      latex: `x = -\\frac{${col("b", cb)}}{2${col("a", ca)}}, \\quad \\left(-\\frac{${col("b", cb)}}{2${col("a", ca)}}, \\frac{4${col("a", ca)}${col("c", cc)}-${col("b", cb)}^2}{4${col("a", ca)}}\\right)`,
      level: "important",
      prerequisites: ["$a \\neq 0$"],
    },
  );

  gaokaoPoints.push(
    {
      text: "二次函数图象的开口方向（由 $a$ 决定）、对称轴位置和顶点坐标是解决区间最值问题和不等式恒成立问题的核心基准。",
      importance: "gaokao",
    },
    {
      text: "二次函数单调性：在对称轴 $x = -\\frac{b}{2a}$ 处取得最值。若 $a > 0$，在 $(-\\infty, -\\frac{b}{2a}]$ 单调递减，在 $[-\\frac{b}{2a}, +\\infty)$ 单调递增；若 $a < 0$ 则单调性相反。",
      importance: "core",
    },
    {
      text: "高考轴动区间定模型：对称轴 $x = -\\frac{b}{2a}$ 与闭区间 $[m, n]$ 的位置关系分为三类：对称轴在区间左侧、内部与右侧，最值分布完全由此分类讨论决定。",
      importance: "hard",
    },
  );

  // 构建推导链：审题定模 -> 配方求顶点 -> 对称轴与最值反思
  if (Math.abs(a) >= 1e-9 && res.axisX !== null && res.vertexY !== null) {
    const h = res.axisX;
    const k = res.vertexY;
    const aStr = formatMathNumber(a);
    const bStr = formatMathNumber(b);
    const cTail =
      Math.abs(c) < 1e-9
        ? ""
        : c > 0
          ? ` + ${formatMathNumber(c)}`
          : ` - ${formatMathNumber(Math.abs(c))}`;
    const innerTerm =
      Math.abs(b) < 1e-9
        ? "x^2"
        : b / a > 0
          ? `x^2 + \\frac{${formatMathNumber(b)}}{${aStr}} x`
          : `x^2 - \\frac{${formatMathNumber(Math.abs(b))}}{${aStr}} x`;
    const factoredStep1 =
      Math.abs(a - 1) < 1e-9
        ? `\\left( ${innerTerm} \\right)`
        : Math.abs(a + 1) < 1e-9
          ? `-\\left( ${innerTerm} \\right)`
          : `${aStr} \\left( ${innerTerm} \\right)`;
    const vertexParen = formatShiftParen(h);
    const vertexLead = formatCoefTerm(
      a,
      vertexParen === "x" ? "x^2" : `${vertexParen}^2`,
    );
    const kTail =
      Math.abs(k) < 1e-9
        ? ""
        : k > 0
          ? ` + ${formatMathNumber(k)}`
          : ` - ${formatMathNumber(Math.abs(k))}`;
    const hStr = formatMathNumber(h);
    const kStr = formatMathNumber(k);

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定模 · 提公因式与配方准备",
        latex: `f(x) = ${factoredStep1}${cTail}`,
        detail: `提取二次项系数 $a = ${aStr}$（当前 $b = ${bStr}$），括号内加上并减去一次项系数一半的平方 $(\\frac{b}{2a})^2$。`,
        rubric:
          "【高考采分点】提出二次项系数后，在括号内加上再减去 $\\left(\\frac{b}{2a}\\right)^2$ 完成配方，得 3 分。",
      },
      {
        step: 2,
        title: "代数配方 · 化一般式为顶点式",
        latex: `f(x) = ${vertexLead}${kTail}`,
        detail: `配方完成，得到顶点式 $f(x) = a(x - h)^2 + k$，其中 $h = -\\frac{b}{2a} = ${hStr}$，$k = \\frac{4ac-b^2}{4a} = ${kStr}$。`,
        rubric:
          "【高考采分点】配成 $f(x) = a(x - h)^2 + k$，写出 $h = -\\frac{b}{2a}$ 与 $k = \\frac{4ac - b^2}{4a}$，得 4 分。",
      },
      {
        step: 3,
        title: "求解反思 · 对称轴与最值结论",
        latex: `\\text{对称轴: } x = ${hStr}, \\quad f(x)_{${a > 0 ? "\\min" : "\\max"}} = ${kStr}`,
        detail: `因为 $a ${a > 0 ? "> 0" : "< 0"}$，抛物线开口${a > 0 ? "向上" : "向下"}，故当 $x = ${hStr}$ 时取得全局${a > 0 ? "最小值" : "最大值"} ${kStr}。`,
        rubric:
          "【高考采分点】由 $a$ 的符号判断开口方向，再结合对称轴写出最大值或最小值，得 5 分。",
      },
    );
  } else {
    reasoningSteps.push({
      step: 1,
      title: "退化分析 · 二次项系数为零",
      latex: `f(x) = ${formatLinearExpr(b, c)}`,
      detail:
        "当 $a = 0$ 时，二次函数退化为一次函数（直线），无对称轴与顶点，在实数集上为单调函数或常数函数。",
      rubric:
        "【高考采分点】指出 $a = 0$ 时退化为一次函数或常函数，既无对称轴也无顶点，得 2 分。",
    });
  }
}

function buildEquationMode(
  quantities: MathQuantity[],
  theorems: Theorem[],
  gaokaoPoints: GaokaoPoint[],
  reasoningSteps: ReasoningStep[],
  warnings: WarningItem[],
  a: number,
  b: number,
  c: number,
  res: ReturnType<typeof solveQuadratic>,
  col: typeof colorize,
  ca: string,
  cb: string,
  cc: string,
): string {
  quantities.push(
    {
      label: "二次项系数",
      symbol: "a",
      value: a,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "一次项系数",
      symbol: "b",
      value: b,
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "常数项",
      symbol: "c",
      value: c,
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "判别式",
      symbol: "Δ",
      value: res.delta.toFixed(2),
      highlight:
        res.delta > 1e-9
          ? "positive"
          : Math.abs(res.delta) <= 1e-9
            ? "zero"
            : "negative",
    },
    {
      label: "实根个数",
      value: res.isDegenerate
        ? Math.abs(b) >= 1e-9
          ? "1个 (退化)"
          : Math.abs(c) < 1e-9
            ? "无数个 (重合)"
            : "0个"
        : res.roots.length.toString(),
    },
  );

  if (!res.isDegenerate) {
    if (res.roots.length === 2) {
      quantities.push(
        {
          label: "实根 x₁",
          value: res.roots[0].toFixed(2),
          color: MATH_COLORS.focusPoint,
        },
        {
          label: "实根 x₂",
          value: res.roots[1].toFixed(2),
          color: MATH_COLORS.focusPoint,
        },
      );
    } else if (res.roots.length === 1) {
      quantities.push({
        label: "唯一实根 x₀",
        value: res.roots[0].toFixed(2),
        color: MATH_COLORS.focusPoint,
      });
    } else {
      quantities.push({ label: "实根数值", value: "无实数根" });
    }
  } else {
    if (Math.abs(b) >= 1e-9) {
      quantities.push({
        label: "一次方程根 x₀",
        value: (-c / b).toFixed(2),
        color: MATH_COLORS.focusPoint,
      });
    } else {
      quantities.push({
        label: "方程状态",
        value:
          Math.abs(c) < 1e-9 ? "0 = 0 (恒等)" : `${c.toFixed(2)} = 0 (无解)`,
      });
    }
  }

  theorems.push(
    {
      name: "一元二次方程一般形式",
      latex: `${col("a", ca)}x^2 + ${col("b", cb)}x + ${col("c", cc)} = 0 \\quad (${col("a", ca)} \\neq 0)`,
      level: "core",
      prerequisites: ["$a \\neq 0$"],
    },
    {
      name: "求根公式 (韦达定理基础)",
      latex: `x = \\frac{-${col("b", cb)} \\pm \\sqrt{${col("b", cb)}^2 - 4${col("a", ca)}${col("c", cc)}}}{2${col("a", ca)}} \\quad (\\Delta \\ge 0)`,
      level: "important",
      prerequisites: ["$a \\neq 0$", "$\\Delta \\ge 0$"],
    },
    {
      name: "韦达定理 (根与系数关系)",
      latex: `x_1 + x_2 = -\\frac{${col("b", cb)}}{${col("a", ca)}}, \\quad x_1 x_2 = \\frac{${col("c", cc)}}{${col("a", ca)}}`,
      level: "important",
      prerequisites: ["$a \\neq 0$", "$\\Delta \\ge 0$"],
    },
  );

  gaokaoPoints.push(
    {
      text: "方程 $ax^2 + bx + c = 0$ 的实数根即为二次函数 $f(x) = ax^2 + bx + c$ 与 $x$ 轴交点的横坐标。其实根个数由判别式 $\\Delta = b^2 - 4ac$ 唯一判定。",
      importance: "gaokao",
    },
    {
      text: "韦达定理是代数与平面解析几何联立的核心桥梁。在圆锥曲线交点弦长、对称中点等题目中是消元转化的首要工具。",
      importance: "gaokao",
    },
    {
      text: "高考根的分布定理：要求两实根落在特定区间，等价于联立判别式 $\\Delta$、对称轴位置与区间端点函数值符号（三合一充要条件组）。",
      importance: "hard",
    },
  );

  // 构建推导链：判别式定性 -> 求根公式 -> 韦达定理反思
  if (Math.abs(a) >= 1e-9) {
    const aTex = a < 0 ? `(${formatMathNumber(a)})` : formatMathNumber(a);
    const bTex = b < 0 ? `(${formatMathNumber(b)})` : formatMathNumber(b);
    const cTex = c < 0 ? `(${formatMathNumber(c)})` : formatMathNumber(c);
    const deltaStr = formatMathNumber(res.delta);
    reasoningSteps.push(
      {
        step: 1,
        title: "判别式定性 · 确定实根个数",
        latex: `\\Delta = b^2 - 4ac = ${bTex}^2 - 4 \\times ${aTex} \\times ${cTex} = ${deltaStr}`,
        detail: `计算判别式 $\\Delta = ${deltaStr}$。因为 $\\Delta ${res.delta > 1e-9 ? "> 0" : Math.abs(res.delta) <= 1e-9 ? "= 0" : "< 0"}$，方程在实数范围内有 ${res.delta > 1e-9 ? "两个相异实根" : Math.abs(res.delta) <= 1e-9 ? "两个相等实根" : "零个实根（在实数范围无解）"}。`,
        rubric:
          "【高考采分点】算出 $\\Delta = b^2 - 4ac$ 的数值，并按其符号判定实根个数，得 4 分。",
      },
      {
        step: 2,
        title: "公式代入 · 求根公式展开",
        latex:
          res.delta >= 0
            ? `x = \\frac{-${bTex} \\pm \\sqrt{${deltaStr}}}{2 \\times ${aTex}}`
            : `\\Delta = ${deltaStr} < 0 \\implies x \\notin \\mathbb{R}`,
        detail:
          res.roots.length === 2
            ? `代入求根公式解得：$x_1 = ${formatMathNumber(res.roots[0])}$, $x_2 = ${formatMathNumber(res.roots[1])}$。`
            : res.roots.length === 1
              ? `代入求根公式解得：$x_0 = ${formatMathNumber(res.roots[0])}$。`
              : "由于判别式小于零，抛物线悬空，与 $x$ 轴无交点，方程无实数解。",
        rubric:
          "【高考采分点】把 $a$、$b$、$\\Delta$ 代入 $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$ 完整列式并算出根，得 4 分。",
      },
    );

    if (res.roots.length > 0) {
      reasoningSteps.push({
        step: 3,
        title: "求解反思 · 韦达定理验证",
        latex: `x_1 + x_2 = -\\frac{b}{a} = ${formatMathNumber(-b / a)}, \\quad x_1 x_2 = \\frac{c}{a} = ${formatMathNumber(c / a)}`,
        detail: `两根之和等于 $-\\frac{b}{a} = ${formatMathNumber(-b / a)}$，两根之积等于 $\\frac{c}{a} = ${formatMathNumber(c / a)}$，完美吻合韦达定理根与系数关系。`,
        rubric:
          "【高考采分点】用 $x_1 + x_2 = -\\frac{b}{a}$ 与 $x_1 x_2 = \\frac{c}{a}$ 回验所求两根，得 2 分。",
      });
    }
  }

  if (a !== 0 && res.delta < 0) {
    warnings.push({
      text: "判别式 $\\Delta < 0$，方程在实数范围内无解，抛物线与 $x$ 轴无交点！",
      level: "warning",
    });
  }

  return "判别式看根个数，求根公式记心头，韦达定理连几何。";
}

function buildInequalityMode(
  quantities: MathQuantity[],
  theorems: Theorem[],
  gaokaoPoints: GaokaoPoint[],
  reasoningSteps: ReasoningStep[],
  warnings: WarningItem[],
  a: number,
  b: number,
  c: number,
  ineqType: ">" | "<",
  res: ReturnType<typeof solveQuadratic>,
  col: typeof colorize,
  ca: string,
  cb: string,
  cc: string,
): string {
  let solutionText = "";
  if (a !== 0) {
    const x1 = res.roots[0];
    const x2 = res.roots[1];
    if (ineqType === ">") {
      if (a > 0) {
        if (res.roots.length === 2) {
          solutionText = `(-\\infty, ${x1.toFixed(2)}) \\cup (${x2.toFixed(2)}, +\\infty)`;
        } else if (res.roots.length === 1) {
          solutionText = `\\{x \\mid x \\neq ${x1.toFixed(2)}\\}`;
        } else {
          solutionText = "\\mathbb{R}";
        }
      } else {
        if (res.roots.length === 2) {
          solutionText = `(${x1.toFixed(2)}, ${x2.toFixed(2)})`;
        } else {
          solutionText = "\\varnothing";
        }
      }
    } else {
      if (a > 0) {
        if (res.roots.length === 2) {
          solutionText = `(${x1.toFixed(2)}, ${x2.toFixed(2)})`;
        } else {
          solutionText = "\\varnothing";
        }
      } else {
        if (res.roots.length === 2) {
          solutionText = `(-\\infty, ${x1.toFixed(2)}) \\cup (${x2.toFixed(2)}, +\\infty)`;
        } else if (res.roots.length === 1) {
          solutionText = `\\{x \\mid x \\neq ${x1.toFixed(2)}\\}`;
        } else {
          solutionText = "\\mathbb{R}";
        }
      }
    }
  } else {
    const x0 = Math.abs(b) >= 1e-9 ? -c / b : 0;
    if (Math.abs(b) >= 1e-9) {
      if (ineqType === ">") {
        solutionText =
          b > 0
            ? `(${x0.toFixed(2)}, +\\infty)`
            : `(-\\infty, ${x0.toFixed(2)})`;
      } else {
        solutionText =
          b > 0
            ? `(-\\infty, ${x0.toFixed(2)})`
            : `(${x0.toFixed(2)}, +\\infty)`;
      }
    } else {
      if (ineqType === ">") {
        solutionText = c > 0 ? "\\mathbb{R}" : "\\varnothing";
      } else {
        solutionText = c < 0 ? "\\mathbb{R}" : "\\varnothing";
      }
    }
  }

  quantities.push(
    {
      label: "二次项系数",
      symbol: "a",
      value: a,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "一次项系数",
      symbol: "b",
      value: b,
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "常数项",
      symbol: "c",
      value: c,
      color: MATH_COLORS.paramTertiary,
    },
    { label: "不等式类型", value: ineqType === ">" ? "f(x) > 0" : "f(x) < 0" },
    {
      label: "解集范围",
      value: solutionText,
      color: MATH_COLORS.inequality,
    },
  );

  theorems.push(
    {
      name: "一元二次不等式三位一体对应关系",
      latex:
        ineqType === ">"
          ? `${col("a", ca)}x^2 + ${col("b", cb)}x + ${col("c", cc)} > 0 \\iff f(x) > 0 \\text{ 对应 } x \\text{ 轴上方区间}`
          : `${col("a", ca)}x^2 + ${col("b", cb)}x + ${col("c", cc)} < 0 \\iff f(x) < 0 \\text{ 对应 } x \\text{ 轴下方区间}`,
      level: "core",
      prerequisites: ["由 $a$ 的符号与判别式 $\\Delta$ 共同控制解集结构"],
    },
    {
      name: "不等式求解口诀",
      latex: `\\text{当 } ${col("a", ca)} > 0, \\Delta > 0 \\text{ 时：} \\\\ f(x) > 0 \\iff x < x_1 \\text{ 或 } x > x_2 \\quad (\\text{同号取两边}) \\\\ f(x) < 0 \\iff x_1 < x < x_2 \\quad (\\text{异号取中间})`,
      level: "important",
      prerequisites: ["$a > 0$", "$\\Delta > 0$", "$x_1 < x_2$"],
    },
  );

  gaokaoPoints.push(
    {
      text: "“三个二次”（二次函数、二次方程、二次不等式）是高中代数的基石。不等式 $f(x) > 0$ 的解集即二次函数在 $x$ 轴上方图象所对应的自变量 $x$ 的取值集合。",
      importance: "gaokao",
    },
    {
      text: "二次不等式恒成立条件（高考大题压轴高频）：① 对任意实数恒有 $f(x) > 0$ 成立 $\\iff a > 0$ 且 $\\Delta < 0$；② 恒有 $f(x) < 0$ 成立 $\\iff a < 0$ 且 $\\Delta < 0$。若二次项系数含参，必须首先讨论 $a = 0$ 的退化直线！",
      importance: "gaokao",
    },
  );

  // 推导链：审题联立方程 -> 开口方向数形分析 -> 确定解集
  const ineqPolyLatex = buildQuadraticLatex(a, b, c).replace(/^y\s*=\s*/, "");
  if (Math.abs(a) >= 1e-9) {
    const aStr = formatMathNumber(a);
    const deltaStr = formatMathNumber(res.delta);
    reasoningSteps.push(
      {
        step: 1,
        title: "方程定根 · 计算对应二次方程零点",
        latex: `\\Delta = b^2 - 4ac = ${deltaStr}`,
        detail:
          res.roots.length === 2
            ? `方程有两个相异实根：$x_1 = ${formatMathNumber(res.roots[0])}$, $x_2 = ${formatMathNumber(res.roots[1])}$，将数轴划分为三个开区间。`
            : res.roots.length === 1
              ? `方程有唯一重根：$x_0 = ${formatMathNumber(res.roots[0])}$，抛物线与 $x$ 轴相切。`
              : "方程在实数范围无实根，抛物线全在 $x$ 轴同侧，与 $x$ 轴无交点。",
        rubric:
          "【高考采分点】解对应二次方程求出零点，并以零点把数轴划分成若干区间，得 3 分。",
      },
      {
        step: 2,
        title: "数形结合 · 开口方向与符号法则",
        latex: `a = ${aStr} ${a > 0 ? "> 0" : "< 0"} \\implies \\text{抛物线开口}${a > 0 ? "向上" : "向下"}`,
        detail: `结合几何图象：当 $a ${a > 0 ? "> 0" : "< 0"}$ 时，不等式 $f(x) ${ineqType} 0$ 对应图象位于 $x$ 轴${ineqType === ">" ? "上方" : "下方"}的区域。`,
        rubric:
          "【高考采分点】由开口方向与不等号方向定出图象位于 $x$ 轴上方或下方的区间，得 4 分。",
      },
      {
        step: 3,
        title: "求解反思 · 规范不等式解集",
        latex: `\\text{解集: } ${solutionText}`,
        detail: `经过区间检验，不等式 $${ineqPolyLatex} ${ineqType} 0$ 的完整解集为 $${solutionText}$。`,
        rubric: "【高考采分点】把取值区间写成规范的集合或区间形式，得 5 分。",
      },
    );
  } else {
    reasoningSteps.push(
      {
        step: 1,
        title: "分类讨论 · 二次项系数退化为零",
        latex: `a = 0 \\implies ${formatLinearExpr(b, c)} ${ineqType} 0`,
        detail:
          "含参不等式分类讨论的首要步骤：当 $a = 0$ 时，原不等式退化为一元一次不等式或常数不等式。",
        rubric:
          "【高考采分点】指出二次项系数含参时必须先讨论 $a = 0$ 的退化情形，得 2 分。",
      },
      {
        step: 2,
        title: "一次求解 · 一元一次不等式解集",
        latex: `\\text{解集: } ${solutionText}`,
        detail: `解一次不等式得到解集为 $${solutionText}$。`,
        rubric:
          "【高考采分点】按一次项系数的正负解一元一次不等式，写出规范解集，得 3 分。",
      },
    );
  }

  if (a === 0) {
    warnings.push({
      text: "二次项系数为 $0$，不等式退化为一元一次不等式！高考中凡二次项系数含参，必须分 $a = 0$ 与 $a \\neq 0$ 分类讨论。",
      level: "danger",
    });
  } else if (solutionText === "\\mathbb{R}") {
    warnings.push({
      text: "此不等式在全体实数范围内恒成立（解集为 $\\mathbb{R}$）。",
      level: "warning",
    });
  } else if (solutionText === "\\varnothing") {
    warnings.push({
      text: "此不等式在实数范围内无解（解集为 $\\varnothing$）。",
      level: "warning",
    });
  }

  return "同号取两边，异号取中间；系数为零先讨论，二次判别式莫忘记。";
}
