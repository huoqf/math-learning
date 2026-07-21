import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { colorize } from "../types";
import { solveQuadratic } from "@/math/quadratic";
import { quadraticChecker } from "@/math/degeneration";
import { ALGEBRA_COLORS, CALCULUS_COLORS } from "@/theme";

const PARAM_COLORS = {
  a: ALGEBRA_COLORS.sequence,
  b: ALGEBRA_COLORS.inequality,
  c: CALCULUS_COLORS.derivative,
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
  let mnemonic = "一柱擎天看a值，左同右异定轴线，常数c点过y轴。";

  if (studyMode === "function") {
    buildFunctionMode(
      quantities,
      theorems,
      gaokaoPoints,
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

  return { quantities, theorems, gaokaoPoints, warnings, mnemonic };
}

function buildFunctionMode(
  quantities: MathQuantity[],
  theorems: Theorem[],
  gaokaoPoints: GaokaoPoint[],
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
      color: ALGEBRA_COLORS.sequence,
    },
    {
      label: "一次项系数",
      symbol: "b",
      value: b,
      color: ALGEBRA_COLORS.inequality,
    },
    {
      label: "常数项",
      symbol: "c",
      value: c,
      color: CALCULUS_COLORS.derivative,
    },
    { label: "开口方向", value: res.direction },
    {
      label: "对称轴",
      symbol: "x",
      value: res.axisX !== null ? `x = ${res.axisX.toFixed(2)}` : "无",
    },
    {
      label: "顶点坐标",
      value:
        res.vertexX !== null && res.vertexY !== null
          ? `(${res.vertexX.toFixed(2)}, ${res.vertexY.toFixed(2)})`
          : "无",
    },
  );

  theorems.push(
    {
      name: "二次函数一般式",
      latex: `y = ${col("a", ca)}x^2 + ${col("b", cb)}x + ${col("c", cc)} \\quad (${col("a", ca)} \\neq 0)`,
      level: "core",
      prerequisites: ["a ≠ 0"],
    },
    {
      name: "对称轴与顶点坐标公式",
      latex: `x = -\\frac{${col("b", cb)}}{2${col("a", ca)}} \\quad \\text{顶点} \\left(-\\frac{${col("b", cb)}}{2${col("a", ca)}}, \\frac{4${col("a", ca)}${col("c", cc)}-${col("b", cb)}^2}{4${col("a", ca)}}\\right)`,
      level: "important",
      prerequisites: ["a ≠ 0"],
    },
  );

  gaokaoPoints.push(
    {
      text: "二次函数图象的开口方向（由 a 决定）、对称轴位置和顶点坐标是解决区间最值问题和不等式恒成立问题的核心基准。",
      importance: "gaokao",
    },
    {
      text: "二次函数单调性：在对称轴 x = -b/(2a) 处取得极值。若 a > 0，在 (-∞, -b/2a] 单调递减，在 [-b/2a, +∞) 单调递增；若 a < 0 则单调性相反。",
      importance: "core",
    },
  );
}

function buildEquationMode(
  quantities: MathQuantity[],
  theorems: Theorem[],
  gaokaoPoints: GaokaoPoint[],
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
      color: ALGEBRA_COLORS.sequence,
    },
    {
      label: "一次项系数",
      symbol: "b",
      value: b,
      color: ALGEBRA_COLORS.inequality,
    },
    {
      label: "常数项",
      symbol: "c",
      value: c,
      color: CALCULUS_COLORS.derivative,
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
          color: CALCULUS_COLORS.tangentLine,
        },
        {
          label: "实根 x₂",
          value: res.roots[1].toFixed(2),
          color: CALCULUS_COLORS.tangentLine,
        },
      );
    } else if (res.roots.length === 1) {
      quantities.push({
        label: "唯一实根 x₀",
        value: res.roots[0].toFixed(2),
        color: CALCULUS_COLORS.tangentLine,
      });
    } else {
      quantities.push({ label: "实根数值", value: "无实数根" });
    }
  } else {
    if (Math.abs(b) >= 1e-9) {
      quantities.push({
        label: "一次方程根 x₀",
        value: (-c / b).toFixed(2),
        color: CALCULUS_COLORS.tangentLine,
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
      prerequisites: ["a ≠ 0"],
    },
    {
      name: "求根公式 (韦达定理基础)",
      latex: `x = \\frac{-${col("b", cb)} \\pm \\sqrt{${col("b", cb)}^2 - 4${col("a", ca)}${col("c", cc)}}}{2${col("a", ca)}} \\quad (\\Delta \\ge 0)`,
      level: "important",
      prerequisites: ["a ≠ 0", "Δ ≥ 0"],
    },
    {
      name: "韦达定理 (根与系数关系)",
      latex: `x_1 + x_2 = -\\frac{${col("b", cb)}}{${col("a", ca)}}, \\quad x_1 x_2 = \\frac{${col("c", cc)}}{${col("a", ca)}}`,
      level: "important",
      prerequisites: ["a ≠ 0", "Δ ≥ 0"],
    },
  );

  gaokaoPoints.push(
    {
      text: "方程 ax² + bx + c = 0 的实数根即为二次函数 f(x) = ax² + bx + c 与 x 轴交点的横坐标。其个数由判别式 Δ 决定。",
      importance: "gaokao",
    },
    {
      text: "韦达定理是代数与解析几何联立的核心桥梁。在圆锥曲线交点弦长、对称中点等题目中是列式计算的绝对高频工具。",
      importance: "gaokao",
    },
    {
      text: "根的分布规律：例如若要求两实根均大于常数 k，等价于条件组：① Δ ≥ 0；② 对称轴 -b/(2a) > k；③ 若 a > 0，f(k) > 0（若 a < 0，f(k) < 0）。这是高考压轴题的第一步。",
      importance: "hard",
    },
  );

  if (a !== 0 && res.delta < 0) {
    warnings.push({
      text: "判别式 Δ < 0，方程在实数范围内无解，抛物线与 x 轴无交点！",
      level: "warning",
    });
  }

  return "判别式看根个数，求根公式记心头，韦达定理连几何。";
}

function buildInequalityMode(
  quantities: MathQuantity[],
  theorems: Theorem[],
  gaokaoPoints: GaokaoPoint[],
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
          solutionText = `x < ${x1.toFixed(2)} 或 x > ${x2.toFixed(2)}`;
        } else if (res.roots.length === 1) {
          solutionText = `x ≠ ${x1.toFixed(2)} (x ∈ ℝ 且 x ≠ x₀)`;
        } else {
          solutionText = "全体实数 ℝ";
        }
      } else {
        if (res.roots.length === 2) {
          solutionText = `${x1.toFixed(2)} < x < ${x2.toFixed(2)}`;
        } else {
          solutionText = "无解 (空集 ∅)";
        }
      }
    } else {
      if (a > 0) {
        if (res.roots.length === 2) {
          solutionText = `${x1.toFixed(2)} < x < ${x2.toFixed(2)}`;
        } else {
          solutionText = "无解 (空集 ∅)";
        }
      } else {
        if (res.roots.length === 2) {
          solutionText = `x < ${x1.toFixed(2)} 或 x > ${x2.toFixed(2)}`;
        } else if (res.roots.length === 1) {
          solutionText = `x ≠ ${x1.toFixed(2)} (x ∈ ℝ 且 x ≠ x₀)`;
        } else {
          solutionText = "全体实数 ℝ";
        }
      }
    }
  } else {
    const x0 = Math.abs(b) >= 1e-9 ? -c / b : 0;
    if (Math.abs(b) >= 1e-9) {
      if (ineqType === ">") {
        solutionText = b > 0 ? `x > ${x0.toFixed(2)}` : `x < ${x0.toFixed(2)}`;
      } else {
        solutionText = b > 0 ? `x < ${x0.toFixed(2)}` : `x > ${x0.toFixed(2)}`;
      }
    } else {
      if (ineqType === ">") {
        solutionText = c > 0 ? "全体实数 ℝ" : "无解 (空集 ∅)";
      } else {
        solutionText = c < 0 ? "全体实数 ℝ" : "无解 (空集 ∅)";
      }
    }
  }

  quantities.push(
    {
      label: "二次项系数",
      symbol: "a",
      value: a,
      color: ALGEBRA_COLORS.sequence,
    },
    {
      label: "一次项系数",
      symbol: "b",
      value: b,
      color: ALGEBRA_COLORS.inequality,
    },
    {
      label: "常数项",
      symbol: "c",
      value: c,
      color: CALCULUS_COLORS.derivative,
    },
    { label: "不等式类型", value: ineqType === ">" ? "f(x) > 0" : "f(x) < 0" },
    {
      label: "解集范围",
      value: solutionText,
      color: ALGEBRA_COLORS.inequality,
    },
  );

  theorems.push(
    {
      name: "一元二次不等式三位一体对应关系",
      latex:
        ineqType === ">"
          ? `${col("a", ca)}x^2 + ${col("b", cb)}x + ${col("c", cc)} > 0 \\quad \\text{的解集由 } f(x) > 0 \\text{ 的区域决定。}`
          : `${col("a", ca)}x^2 + ${col("b", cb)}x + ${col("c", cc)} < 0 \\quad \\text{的解集由 } f(x) < 0 \\text{ 的区域决定。}`,
      level: "core",
      prerequisites: ["由 a 符号与判别式 Δ 共同控制解集形式"],
    },
    {
      name: "不等式口诀",
      latex: `\\text{当 } ${col("a", ca)} > 0, \\Delta > 0 \\text{ 时：} \\\\ f(x) > 0 \\iff x < x_1 \\text{ 或 } x > x_2 \\quad (\\text{同号取两边}) \\\\ f(x) < 0 \\iff x_1 < x < x_2 \\quad (\\text{异号取中间})`,
      level: "important",
      prerequisites: ["a > 0", "Δ > 0", "x₁ < x₂"],
    },
  );

  gaokaoPoints.push(
    {
      text: "\u201C三个二次\u201D（二次函数、二次方程、二次不等式）是高中代数的基石。不等式 f(x) > 0 的解集即二次函数在 x 轴上方图象所对应的自变量 x 的集合。",
      importance: "gaokao",
    },
    {
      text: "二次不等式恒成立条件（常考压轴）：① 对任意实数恒有 f(x) > 0 成立 ⇔ a > 0 且 Δ < 0；② 恒有 f(x) < 0 成立 ⇔ a < 0 且 Δ < 0。务必同时讨论二次项系数为 0 的退化状态！",
      importance: "gaokao",
    },
  );

  if (a === 0) {
    warnings.push({
      text: "二次项系数为 0，不等式退化为一元一次不等式！高考中凡二次项系数含参，必须分 a = 0 与 a ≠ 0 分类讨论。",
      level: "danger",
    });
  } else if (solutionText === "全体实数 ℝ") {
    warnings.push({
      text: "此不等式在全体实数范围内恒成立 (解集为 ℝ)。",
      level: "warning",
    });
  } else if (solutionText === "无解 (空集 ∅)") {
    warnings.push({
      text: "此不等式在实数范围内无解 (解集为空集)。",
      level: "warning",
    });
  }

  return "同号取两边，异号取中间；系数为零先讨论，二次判别式莫忘记。";
}
