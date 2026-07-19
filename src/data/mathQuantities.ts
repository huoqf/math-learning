import type {
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "@/components/UI";
import { solveQuadratic } from "@/math/quadratic";
import {
  solveDerivative,
  PRESET_FUNCTIONS,
  type PresetFunctionKey,
} from "@/math/derivative";
import { quadraticChecker } from "@/math/degeneration";
import {
  solveConstantSingleSep,
  solveConstantSingleDirect,
  solveConstantDouble,
  solveConstantSingleSepTrans,
  solveConstantSingleDirectTrans,
} from "@/math/constant";
import { ALGEBRA_COLORS, CALCULUS_COLORS, MATH_COLORS } from "@/theme";

/** 参数颜色映射（与中屏公式保持一致） */
const PARAM_COLORS = {
  a: ALGEBRA_COLORS.sequence,
  b: ALGEBRA_COLORS.inequality,
  c: CALCULUS_COLORS.derivative,
};

/** 包裹 KaTeX 颜色 */
function colorize(text: string, color: string): string {
  return `\\color{${color}}{${text}}`;
}

export interface MathPanelData {
  quantities: MathQuantity[];
  theorems: Theorem[];
  gaokaoPoints: GaokaoPoint[];
  warnings: WarningItem[];
  mnemonic?: string;
}

export function buildMathQuantities(
  animId: string,
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  if (animId === "anim-quadratic") {
    const a = params.a ?? 1;
    const b = params.b ?? 0;
    const c = params.c ?? 0;
    const studyMode =
      (config?.studyMode as "function" | "equation" | "inequality") ||
      "function";
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
    } else if (studyMode === "equation") {
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
          quantities.push({
            label: "实根 x₁",
            value: res.roots[0].toFixed(2),
            color: CALCULUS_COLORS.tangentLine,
          });
          quantities.push({
            label: "实根 x₂",
            value: res.roots[1].toFixed(2),
            color: CALCULUS_COLORS.tangentLine,
          });
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
        // 退化情况
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
              Math.abs(c) < 1e-9
                ? "0 = 0 (恒等)"
                : `${c.toFixed(2)} = 0 (无解)`,
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

      mnemonic = "判别式看根个数，求根公式记心头，韦达定理连几何。";
    } else {
      // 计算解集文本描述
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
          // ineqType === '<'
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
        // a = 0 退化为 bx + c > 0 或 < 0
        const x0 = Math.abs(b) >= 1e-9 ? -c / b : 0;
        if (Math.abs(b) >= 1e-9) {
          if (ineqType === ">") {
            solutionText =
              b > 0 ? `x > ${x0.toFixed(2)}` : `x < ${x0.toFixed(2)}`;
          } else {
            solutionText =
              b > 0 ? `x < ${x0.toFixed(2)}` : `x > ${x0.toFixed(2)}`;
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
        {
          label: "不等式类型",
          value: ineqType === ">" ? "f(x) > 0" : "f(x) < 0",
        },
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
          text: "“三个二次”（二次函数、二次方程、二次不等式）是高中代数的基石。不等式 f(x) > 0 的解集即二次函数在 x 轴上方图象所对应的自变量 x 的集合。",
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

      mnemonic = "同号取两边，异号取中间；系数为零先讨论，二次判别式莫忘记。";
    }

    // 易错警示（使用统一退化检查器）
    const degCheck = quadraticChecker.check({ a, b, c });
    degCheck.reports.forEach((r) => {
      // 避免重复推送 a=0 的危险警告（因为不等式里面已经定制了更显眼的）
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
      mnemonic,
    };
  }

  if (animId === "anim-derivative-tangent") {
    const x0 = params.x0 ?? 1;
    const dx = params.dx ?? 1;
    const fnKey = ((config?.fnKey as string) || "cubic") as PresetFunctionKey;
    const preset = PRESET_FUNCTIONS[fnKey] || PRESET_FUNCTIONS.cubic;
    const res = solveDerivative(preset.fn, x0);

    // 计算割线第二点的数学坐标值及割线斜率
    const x2 = x0 + dx;
    let fy2 = NaN;
    try {
      fy2 = preset.fn(x2);
    } catch {
      fy2 = NaN;
    }
    const kSecant =
      Number.isFinite(fy2) && Number.isFinite(res.fx)
        ? (fy2 - res.fx) / dx
        : NaN;

    const quantities: MathQuantity[] = [
      {
        label: "切点横坐标",
        symbol: "x₀",
        value: x0.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "函数值",
        symbol: "f(x₀)",
        value: Number.isFinite(res.fx) ? res.fx.toFixed(3) : "无定义",
        color: MATH_COLORS.labelText,
      },
      {
        label: "割线步长",
        symbol: "Δx",
        value: dx.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "割线斜率",
        symbol: "k_割",
        value: Number.isFinite(kSecant) ? kSecant.toFixed(3) : "不存在",
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "切线斜率 (导数)",
        symbol: "f'(x₀)",
        value: Number.isFinite(res.fpx) ? res.fpx.toFixed(3) : "不存在",
        color: MATH_COLORS.tangentLine,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "割线斜率 (平均变化率)",
        latex: `k_{\\text{割}} = \\frac{f(x_0 + \\Delta x) - f(x_0)}{\\Delta x}`,
        level: "important",
        prerequisites: ["x₀ 与 x₀ + Δx 在函数定义域内"],
      },
      {
        name: "导数的几何意义",
        latex:
          "f'(x_0) = \\lim_{\\Delta x \\to 0} \\frac{f(x_0 + \\Delta x) - f(x_0)}{\\Delta x}",
        level: "core",
        prerequisites: ["f(x) 在 x₀ 的某邻域内有定义", "极限存在"],
      },
      {
        name: "切线方程",
        latex: res.isValid
          ? `y - ${res.fx.toFixed(2)} = ${res.slope.toFixed(2)}(x - ${x0.toFixed(2)})`
          : "y - f(x_0) = f'(x_0)(x - x_0)",
        level: "important",
        prerequisites: ["f'(x₀) 存在"],
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "几何意义：函数 y=f(x) 在 x₀ 处的导数 f'(x₀) 就是曲线在该点切线的斜率 k。",
        importance: "gaokao",
      },
      {
        text: "割线斜率的极限：割线斜率随着 Δx 趋于 0 的极限即为切线斜率，体现了“以直代曲”的微积分核心思想。",
        importance: "core",
      },
      {
        text: "高考易错点：注意“在点 P 处的切线”与“过点 P 的切线”的区别，前者 P 必为切点，后者 P 不一定是切点。",
        importance: "gaokao",
      },
      {
        text: "压轴模型：高考常利用 xlnx, (lnx)/x, xex 等高频模型的导数来研究函数的单调性与极值。",
        importance: "core",
      },
    ];

    const warnings: WarningItem[] = [];
    if (!res.isValid) {
      warnings.push({
        text:
          res.degenerateType === "undefined"
            ? `函数在 x₀ = ${x0} 处无定义，无法求导。`
            : `函数在 x₀ = ${x0} 处不可导（可能存在尖点、间断点或切线垂直）。`,
        level: "danger",
      });
    } else if (!Number.isFinite(fy2)) {
      warnings.push({
        text: `割线终点 x₀ + Δx = ${x2.toFixed(2)} 超出函数定义域，割线无法绘制。`,
        level: "warning",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "导数即斜率，切线看斜率；割线逼近切，极限是关键。",
    };
  }

  if (animId === "anim-constant-single") {
    const subMode = (config?.subMode as "sep" | "direct") || "sep";
    const logic = (config?.logic as "always" | "exist") || "always";
    const funModel =
      (config?.funModel as "quadratic" | "transcendent") || "quadratic";
    const m = params.m ?? 0.5;
    const n = params.n ?? 2.5;
    const col = colorize;

    const isTranscendent = funModel === "transcendent";

    if (subMode === "sep") {
      const a = params.a ?? 1.2;
      const res = isTranscendent
        ? solveConstantSingleSepTrans(a, m, n)
        : solveConstantSingleSep(a, m, n);

      const quantities: MathQuantity[] = [
        {
          label: "水平线高度",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        { label: "区间左边界", symbol: "m", value: m },
        { label: "区间右边界", symbol: "n", value: n },
        {
          label: "区间内最小值",
          symbol: "f(x)min",
          value: res.fMin,
          color: MATH_COLORS.function,
        },
        { label: "最小值横坐标", symbol: "xmin", value: res.xFMin },
        {
          label: "区间内最大值",
          symbol: "f(x)max",
          value: res.fMax,
          color: MATH_COLORS.derivative,
        },
        { label: "最大值横坐标", symbol: "xmax", value: res.xFMax },
        {
          label:
            logic === "always"
              ? "恒成立状态 (f(x) ≥ a)"
              : "存在性状态 (f(x) ≥ a)",
          value: (logic === "always" ? res.isAlwaysTrue : res.isExistTrue)
            ? "成立"
            : "不成立",
          highlight: (logic === "always" ? res.isAlwaysTrue : res.isExistTrue)
            ? "extreme"
            : "negative",
        },
      ];

      const theorems: Theorem[] = [
        {
          name: "恒成立等价关系",
          latex: `\\forall x \\in [m, n], \\, f(x) \\ge ${col("a", MATH_COLORS.paramPrimary)} \\iff f(x)_{\\min} \\ge ${col("a", MATH_COLORS.paramPrimary)}`,
          level: "core",
          prerequisites: ["区间范围存在 [m, n]", "函数最值可达"],
        },
        {
          name: "存在性等价关系",
          latex: `\\exists x \\in [m, n], \\, f(x) \\ge ${col("a", MATH_COLORS.paramPrimary)} \\iff f(x)_{\\max} \\ge ${col("a", MATH_COLORS.paramPrimary)}`,
          level: "core",
          prerequisites: ["区间范围存在 [m, n]", "函数最值可达"],
        },
      ];

      if (isTranscendent) {
        theorems.push({
          name: "目标超越函数导数",
          latex: `f(x) = \\frac{\\ln x}{x} \\Rightarrow f'(x) = \\frac{1-\\ln x}{x^2}`,
          level: "important",
          prerequisites: ["x > 0", "在 x = e 取得最大值 1/e ≈ 0.368"],
        });
      }

      const gaokaoPoints: GaokaoPoint[] = isTranscendent
        ? [
            {
              text: "高考核心“ln x / x”模型：其单调性与最值是高考导数大题中出现频率极高的经典结构。通过求导容易得出它在 (0, e) 单调递增，在 (e, +∞) 单调递减，在 x = e 处取得全局最大值 1/e。",
              importance: "gaokao",
            },
            {
              text: "参变分离法：在超越不等式中，若要求 f(x) ≥ a 恒成立，转化为求其在区间上的最小值 ≥ a；若要求存在性成立，转化为求最大值 ≥ a。",
              importance: "gaokao",
            },
          ]
        : [
            {
              text: "参变分离法核心：将不等式一侧完全分离出参数，直接探究另一侧函数在给定区间上的最值。",
              importance: "gaokao",
            },
            {
              text: "恒成立问题看“最底端（最小值）”，存在性问题看“最顶端（最大值）”。",
              importance: "core",
            },
          ];

      const warnings: WarningItem[] = [];
      if (res.isDegenerate) {
        warnings.push({
          text: "区间发生退化 (左端点 m ≥ 右端点 n) 或不在定义域内 (m <= 0)，请重新调整区间滑块！",
          level: "danger",
        });
      }
      if (logic === "always" && !res.isAlwaysTrue) {
        warnings.push({
          text: `参数 a 超过了最小值 ${res.fMin.toFixed(2)}，红色区间内的 x 均无法满足不等式。`,
          level: "warning",
        });
      }

      return {
        quantities,
        theorems,
        gaokaoPoints,
        warnings,
        mnemonic: isTranscendent
          ? "ln x 比 x 极值在 e，恒成求小存在大。"
          : "参变分离超好用，恒成求小存在大。",
      };
    } else {
      const aAxis = params.a_axis ?? 1.0;
      const res = isTranscendent
        ? solveConstantSingleDirectTrans(aAxis, m, n)
        : solveConstantSingleDirect(aAxis, m, n);

      const quantities: MathQuantity[] = [
        {
          label: isTranscendent ? "参数 a" : "函数对称轴",
          symbol: "a",
          value: aAxis,
          color: MATH_COLORS.paramPrimary,
        },
        { label: "区间左边界", symbol: "m", value: m },
        { label: "区间右边界", symbol: "n", value: n },
        {
          label: "研究区间内最小值",
          symbol: "f(x)min",
          value: res.fMin,
          color: MATH_COLORS.function,
        },
        {
          label: "最值所处位置",
          value:
            res.discussionType === "left"
              ? "区间左端点 m"
              : res.discussionType === "right"
                ? "区间右端点 n"
                : isTranscendent
                  ? "极小值点 ln a"
                  : "区间内部顶点 a",
        },
        {
          label: "恒成立状态 (f(x) ≥ 0)",
          value: res.isAlwaysTrue ? "成立" : "不成立",
          highlight: res.isAlwaysTrue ? "extreme" : "negative",
        },
      ];

      const theorems: Theorem[] = isTranscendent
        ? [
            {
              name: "直接讨论法（含参超越函数）",
              latex: `f(x) = e^x - ${col("a", MATH_COLORS.paramPrimary)}x \\ge 0 \\iff f(x)_{\\min} \\ge 0`,
              level: "core",
              prerequisites: ["讨论参数 a 对函数单调性的影响"],
            },
            {
              name: "超越函数求导与极值讨论",
              latex: `f'(x) = e^x - ${col("a", MATH_COLORS.paramPrimary)} \\Rightarrow \\text{极小值点为 } x = \\ln ${col("a", MATH_COLORS.paramPrimary)} \\; (${col("a", MATH_COLORS.paramPrimary)} > 0)`,
              level: "important",
              prerequisites: ["a ≤ 0 时 f(x) 严格单调递增，无极小值点"],
            },
          ]
        : [
            {
              name: "直接最值讨论法（区间轴动）",
              latex: `f(x) = x^2 - 2${col("a", MATH_COLORS.paramPrimary)}x + 2 \\ge 0 \\iff f(x)_{\\min} \\ge 0`,
              level: "core",
              prerequisites: ["区间 [m, n] 固定且合理"],
            },
            {
              name: "最小值分类讨论临界",
              latex: `f(x)_{\\min} = \\begin{cases} f(m), & ${col("a", MATH_COLORS.paramPrimary)} < m \\\\ f(${col("a", MATH_COLORS.paramPrimary)}), & m \\le ${col("a", MATH_COLORS.paramPrimary)} \\le n \\\\ f(n), & ${col("a", MATH_COLORS.paramPrimary)} > n \\end{cases}`,
              level: "important",
              prerequisites: ["对称轴 x = a 左右滑动"],
            },
          ];

      const gaokaoPoints: GaokaoPoint[] = isTranscendent
        ? [
            {
              text: "超越函数“e^x - ax”分类讨论模型：这是高考压轴题中求单调区间、极值和证明恒成立的最经典母题。讨论的界限基于极小值点 ln a 与区间端点 m, n 的大小关系。",
              importance: "gaokao",
            },
            {
              text: "直接讨论分类界限：a ≤ 0 (单调递增)；a < e^m (极小值在区间左侧)；e^m ≤ a ≤ e^n (极小值在区间内)；a > e^n (极小值在区间右侧)。",
              importance: "gaokao",
            },
          ]
        : [
            {
              text: "直接最值讨论法核心：不分离参数，而是通过分类讨论对称轴与固定区间的相对位置关系来确定最值。",
              importance: "gaokao",
            },
            {
              text: "“轴动区间定”问题中，临界讨论点恰好是轴与区间端点重合的时刻 (a = m 或 a = n)。",
              importance: "core",
            },
          ];

      const warnings: WarningItem[] = [];
      if (res.isDegenerate) {
        warnings.push({
          text: "区间发生退化 (左端点 m ≥ 右端点 n)，请重新调整区间滑块！",
          level: "danger",
        });
      }
      if (!res.isAlwaysTrue) {
        warnings.push({
          text: `函数最小值跌破 0 (最小值为 ${res.fMin.toFixed(2)})，红色遮罩内的 x 均无法满足恒成立要求。`,
          level: "warning",
        });
      }

      return {
        quantities,
        theorems,
        gaokaoPoints,
        warnings,
        mnemonic: isTranscendent
          ? "指数减 ax 先求导，极小值在 ln a 找。"
          : "轴动定区间讨论，端点顶点定分界。",
      };
    }
  }

  if (animId === "anim-constant-double") {
    const selectedLogic =
      (config?.selectedLogic as
        "all_all" | "all_exist" | "exist_all" | "exist_exist" | "same_var") ||
      "all_all";
    const yf = params.yf ?? 2.5;
    const xf = params.xf ?? 1.25;
    const yg = params.yg ?? 1.5;
    const xg = params.xg ?? 2.25;
    const mf = 0.5,
      nf = 2.0;
    const mg = 1.5,
      ng = 3.0;
    const res = solveConstantDouble(
      yf,
      xf,
      mf,
      nf,
      yg,
      xg,
      mg,
      ng,
      selectedLogic,
    );

    const quantities: MathQuantity[] =
      selectedLogic === "same_var"
        ? [
            { label: "作用域交集", value: "x ∈ [1.50, 2.00]" },
            {
              label: "最小差值 f(x) - g(x)",
              symbol: "h_min",
              value: res.sameVarMinDiff ?? 0,
              color: CALCULUS_COLORS.function,
            },
            {
              label: "最危险位置",
              symbol: "x_min",
              value: res.sameVarXMin ?? 0,
            },
            {
              label: "同自变量恒成立状态",
              value: res.isSameVarTrue ? "满足" : "不满足",
              highlight: res.isSameVarTrue ? "extreme" : "negative",
            },
          ]
        : [
            {
              label: "f(x)最小值",
              symbol: "f_min",
              value: res.fMin,
              color: CALCULUS_COLORS.function,
            },
            {
              label: "f(x)最大值",
              symbol: "f_max",
              value: res.fMax,
              color: CALCULUS_COLORS.function,
            },
            {
              label: "g(x)最大值",
              symbol: "g_max",
              value: res.gMax,
              color: CALCULUS_COLORS.derivative,
            },
            {
              label: "g(x)最小值",
              symbol: "g_min",
              value: res.gMin,
              color: CALCULUS_COLORS.derivative,
            },
            {
              label: "所选博弈状态",
              value: res.isCurrentLogicTrue ? "满足" : "不满足",
              highlight: res.isCurrentLogicTrue ? "extreme" : "negative",
            },
          ];

    const theorems: Theorem[] =
      selectedLogic === "same_var"
        ? [
            {
              name: "同自变量差函数法",
              latex: `\\forall x \\in I_1 \\cap I_2, \\; f(x) \\ge g(x) \\iff h(x) = f(x) - g(x) \\ge 0 \\iff h(x)_{\\min} \\ge 0`,
              level: "core",
              prerequisites: ["自变量 x 为同一变量，作用在两区间交集上"],
            },
            {
              name: "差函数最值计算",
              latex: `h(x) = 2x^2 - 2(x_f + x_g)x + (x_f^2 + y_f + x_g^2 - y_g)`,
              level: "important",
              prerequisites: ["对称轴为 x_{sym} = \\frac{x_f + x_g}{2}"],
            },
          ]
        : [
            {
              name: "高考双动点不等式四大法宝",
              latex: `\\forall x_1, x_2, f(x_1) \\ge g(x_2) \\iff f_{\\min} \\ge g_{\\max}`,
              level: "core",
              prerequisites: ["x₁ 与 x₂ 分别在独立区间内自由变动"],
            },
            {
              name: "其他对应关系参考",
              latex: `\\begin{aligned} \\forall x_1, \\exists x_2, f(x_1) \\ge g(x_2) &\\iff f_{\\min} \\ge g_{\\min} \\\\ \\exists x_1, \\forall x_2, f(x_1) \\ge g(x_2) &\\iff f_{\\max} \\ge g_{\\max} \\\\ \\exists x_1, \\exists x_2, f(x_1) \\ge g(x_2) &\\iff f_{\\max} \\ge g_{\\min} \\end{aligned}`,
              level: "important",
              prerequisites: ["注意主词“任意”与“存在”的组合"],
            },
          ];

    const gaokaoPoints: GaokaoPoint[] =
      selectedLogic === "same_var"
        ? [
            {
              text: "同自变量恒成立使用“差函数法”：当自变量 x 限制在重合区间内且为同一个动点时，只需两函数在该区间上的差值大于等于 0 即可。",
              importance: "gaokao",
            },
            {
              text: "易错辨析：同自变量成立并不需要 f(x) 的最小值高于 g(x) 的最大值，只需在每个点上 f 都在 g 的上方（即差函数图象在 x 轴上方）。",
              importance: "core",
            },
          ]
        : [
            {
              text: "双自变量恒成立：“对任意自变量不等式成立”要求两函数各自极值完全分离。其中 ∀x₁, ∀x₂ 要求 f 的最小值必须压过 g 的最大值。",
              importance: "gaokao",
            },
            {
              text: "区分双动点恒成立（各行其是）与同变量恒成立（f(x) ≥ g(x) 构造差函数）。",
              importance: "core",
            },
          ];

    const warnings: WarningItem[] = [];
    if (selectedLogic === "same_var") {
      if (!res.isSameVarTrue) {
        warnings.push({
          text: `同变量恒成立不满足！在最危险位置 x = ${res.sameVarXMin?.toFixed(2)} 处，差值只有 ${res.sameVarMinDiff?.toFixed(2)} (< 0)。`,
          level: "warning",
        });
      }
    } else {
      if (!res.isCurrentLogicTrue) {
        warnings.push({
          text: `当前条件不满足！博弈对垒中 ${res.battlePointF.y.toFixed(2)} 未能压过 ${res.battlePointG.y.toFixed(2)}。`,
          level: "warning",
        });
      }
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic:
        selectedLogic === "same_var"
          ? "同变量差函数，作差求最值。"
          : "双动点别慌张，任意任意比极值，最小值压最大值。",
    };
  }

  return {
    quantities: [],
    theorems: [],
    gaokaoPoints: [],
    warnings: [],
  };
}
