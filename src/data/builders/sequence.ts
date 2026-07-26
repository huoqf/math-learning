/**
 * src/data/builders/sequence.ts
 * 构建数列实验室右屏 MathPanel 看板数据 (含 5 大高考模型全量扩展)
 */
import type { MathPanelData } from "../types";
import {
  calcArithmeticSequence,
  calcGeometricSequence,
  calcArithGeoSplit,
  calcTelescoping,
  calcGroupedSequence,
  calcCrossTelescoping,
  calcOddEvenSequence,
  calcLinearRecurrence,
  calcAccumulationRecurrence,
  calcMultiplicationRecurrence,
  calcReciprocalRecurrence,
  calcSecondOrderRecurrence,
} from "@/math/sequence";
import { MATH_COLORS } from "@/theme";

export function buildSequencePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const activeMode = (config?.activeMode as string) ?? "arithmetic";
  const a1 = params.a1 ?? 3;
  const d = params.d ?? -1;
  const q = params.q ?? 0.5;
  const N = Math.round(params.N ?? 8);
  const p_rec = params.p_rec ?? 2;
  const q_rec = params.q_rec ?? 1;
  const a2 = params.a2 ?? 2;
  const coefA = params.coefA ?? 2;
  const coefB = params.coefB ?? 1;
  const coefC = params.coefC ?? 1;

  const quantities: MathPanelData["quantities"] = [];
  const theorems: MathPanelData["theorems"] = [];
  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [];
  const warnings: MathPanelData["warnings"] = [];

  if (activeMode === "arithmetic") {
    const res = calcArithmeticSequence(a1, d, N);
    const aN = res.terms[N - 1]?.an ?? 0;
    const SN = res.terms[N - 1]?.Sn ?? 0;

    const constTerm = a1 - d;
    const constSign =
      constTerm >= 0 ? `+ ${constTerm}` : `- ${Math.abs(constTerm)}`;
    const anLatex =
      Math.abs(d) < 1e-9
        ? `${a1}`
        : `\\color{${MATH_COLORS.paramSecondary}}{${d}}n ${constSign}`;

    quantities.push({
      label: `通项 a_${N} (a_n = ${anLatex})`,
      value: `a_${N} = ${aN.toFixed(2)}`,
      color: MATH_COLORS.sequence,
    });

    quantities.push({
      label: `前 ${N} 项和 S_${N}`,
      value: `S_${N} = ${SN.toFixed(2)}`,
      color: MATH_COLORS.sequenceSum,
    });

    if (res.maxSnInfo) {
      quantities.push({
        label: d < 0 ? "S_n 最大值项" : "S_n 极值项",
        value: `n = ${res.maxSnInfo.nMax}, S_max = ${res.maxSnInfo.maxSn.toFixed(2)}`,
        color: MATH_COLORS.sequenceHighlight,
      });
    }

    theorems.push({
      name: "等差数列通项与求和定理",
      latex: `a_n = a_1 + (n-1)d, \\quad S_n = \\frac{d}{2}n^2 + \\left(a_1 - \\frac{d}{2}\\right)n`,
      condition: "d 为常数，n ∈ N*",
    });

    theorems.push({
      name: "等差中项与下标性质",
      latex: `若 \\ m+n = p+q \\implies a_m + a_n = a_p + a_q = 2a_{\\frac{m+n}{2}}`,
      condition: "在对称中点处函数值具有算术平均性质",
    });

    gaokaoPoints.push({
      text: "数形结合：等差数列 a_n 对应直线 y=dx+(a1-d)，S_n 对应二次函数抛物线。当 d<0 且 a1>0 时，S_n 存在最大值，极值在 a_n 由正转负临界点处取得。",
      importance: "gaokao",
    });

    if (Math.abs(d) < 1e-9) {
      warnings.push({
        text: "d = 0 (退化常数列)：公差 d 为 0 时，通项 a_n = a_1 为常数，前 n 项和 S_n = n · a_1 呈线性增长。",
        level: "warning",
      });
    }
  } else if (activeMode === "geometric") {
    const res = calcGeometricSequence(a1, q, N);
    const aN = res.terms[N - 1]?.an ?? 0;
    const SN = res.terms[N - 1]?.Sn ?? 0;

    quantities.push({
      label: `通项 a_${N} (a_n = a_1 · q^{n-1})`,
      value: `a_${N} = ${aN.toFixed(4)}`,
      color: MATH_COLORS.sequence,
    });

    quantities.push({
      label: `前 ${N} 项和 S_${N}`,
      value: `S_${N} = ${SN.toFixed(4)}`,
      color: MATH_COLORS.sequenceSum,
    });

    if (res.limitSum !== null) {
      quantities.push({
        label: "无穷递缩和 S_∞",
        value: `S_∞ = ${res.limitSum.toFixed(4)}`,
        color: MATH_COLORS.sequenceHighlight,
      });
    }

    theorems.push({
      name: "等比数列通项与求和定理",
      latex: `a_n = a_1 q^{n-1}, \\quad S_n = \\begin{cases} \\frac{a_1(1-q^n)}{1-q}, & q \\neq 1 \\\\ n a_1, & q = 1 \\end{cases}`,
      condition: "a_1 ≠ 0, q ≠ 0",
    });

    theorems.push({
      name: "等比中项性质",
      latex: `a_n^2 = a_{n-1} \\cdot a_{n+1} \\quad (n \\ge 2)`,
      condition: "同号连续三项的几何平均值",
    });

    gaokaoPoints.push({
      text: "公比 q 的分类讨论：当 q>1 时呈指数爆发增长；0<q<1 时指数衰减收敛；q<0 时正负交替震荡。高考常考 q=1 与 q≠1 的分类讨论。",
      importance: "gaokao",
    });

    if (Math.abs(q - 1) < 1e-9) {
      warnings.push({
        text: "q = 1 (公式退化)：公比 q=1 时不能使用 S_n = a1(1-q^n)/(1-q)，此时 S_n = n · a_1。",
        level: "warning",
      });
    } else if (Math.abs(q) < 1e-9) {
      warnings.push({
        text: "q = 0 (非等比数列)：等比数列定义要求公比 q ≠ 0 且首项 a1 ≠ 0。",
        level: "danger",
      });
    }
  } else if (activeMode === "models") {
    const subModel = (config?.subModel as string) ?? "arith-geo";

    if (subModel === "arith-geo") {
      const res = calcArithGeoSplit(a1, d, q, N);
      const TN = res.terms[N - 1]?.Tn ?? 0;

      quantities.push({
        label: "混合通项 c_n = a_n · b_n",
        value: `c_${N} = ${(res.terms[N - 1]?.cn ?? 0).toFixed(4)}`,
        color: MATH_COLORS.sequence,
      });

      quantities.push({
        label: `前 ${N} 项和 T_${N}`,
        value: `T_${N} = ${TN.toFixed(4)}`,
        color: MATH_COLORS.sequenceSum,
      });

      theorems.push({
        name: "错位相减法原理",
        latex: `(1-q)T_n = a_1 + d \\sum_{k=2}^n q^{k-1} - a_n q^n`,
        condition: "适用于等差与等比相乘构成的数列",
      });

      gaokaoPoints.push({
        text: "高考压轴题必考：错位相减对齐与消去。将 T_n 乘以公比 q 后整体右移一位，中间 n-1 项转化为纯等比求和，注意末项 - a_n · q^n 的符号与系数。",
        importance: "hard",
      });
    } else if (subModel === "telescoping") {
      const res = calcTelescoping(N);
      const TN = res.terms[N - 1]?.Tn ?? 0;

      quantities.push({
        label: "裂项通项 c_n = 1/(n(n+1))",
        value: `c_${N} = ${(res.terms[N - 1]?.cn ?? 0).toFixed(4)}`,
        color: MATH_COLORS.sequence,
      });

      quantities.push({
        label: `前 ${N} 项和 T_${N}`,
        value: `T_${N} = ${TN.toFixed(4)}`,
        color: MATH_COLORS.sequenceSum,
      });

      quantities.push({
        label: "极限值 lim T_N",
        value: "1.0000",
        color: MATH_COLORS.sequenceHighlight,
      });

      theorems.push({
        name: "裂项相消法原理",
        latex: `\\sum_{k=1}^n \\left( \\frac{1}{k} - \\frac{1}{k+1} \\right) = 1 - \\frac{1}{n+1}`,
        condition: "通项拆分为前后相消的两项之差",
      });

      gaokaoPoints.push({
        text: "高考常考：裂项相消首尾对销。中间项 (+1/2 - 1/2 + 1/3 - 1/3 ...) 两两对消，最终仅保留首项 1 与尾项 -1/(N+1)。",
        importance: "gaokao",
      });
    } else if (subModel === "cross-telescoping") {
      const res = calcCrossTelescoping(N);
      const TN = res.terms[N - 1]?.Tn ?? 0;

      quantities.push({
        label: "跨项裂项通项 c_n",
        value: `c_${N} = ${(res.terms[N - 1]?.cn ?? 0).toFixed(4)}`,
        color: MATH_COLORS.sequence,
      });

      quantities.push({
        label: `前 ${N} 项和 T_${N}`,
        value: `T_${N} = ${TN.toFixed(4)}`,
        color: MATH_COLORS.sequenceSum,
      });

      quantities.push({
        label: "极限值 lim T_N",
        value: "0.7500",
        color: MATH_COLORS.sequenceHighlight,
      });

      theorems.push({
        name: "跨项裂项相消原理",
        latex: `\\sum_{k=1}^n \\frac{1}{k(k+2)} = \\frac{1}{2}\\left( 1 + \\frac{1}{2} - \\frac{1}{n+1} - \\frac{1}{n+2} \\right)`,
        condition: "分母差为 2 时，相消后保留首部 2 项与尾部 2 项",
      });

      gaokaoPoints.push({
        text: "高考防错陷阱：分母差为 k 时，系数须乘以 1/k，且首尾各保留 k 项不被消去。",
        importance: "hard",
      });
    } else if (subModel === "grouped") {
      const res = calcGroupedSequence(a1, d, q, N);
      const TN = res.terms[N - 1]?.Tn ?? 0;

      quantities.push({
        label: "复合通项 c_n = a_n + b_n",
        value: `c_${N} = ${(res.terms[N - 1]?.cn ?? 0).toFixed(2)}`,
        color: MATH_COLORS.sequence,
      });

      quantities.push({
        label: `前 ${N} 项和 T_${N}`,
        value: `T_${N} = ${TN.toFixed(2)}`,
        color: MATH_COLORS.sequenceSum,
      });

      theorems.push({
        name: "分组求和法原理",
        latex: `T_n = \\sum (a_k + b_k) = \\sum a_k + \\sum b_k = S_n^{(a)} + S_n^{(b)}`,
        condition: "通项可拆解为两个已知常见求和数列之和",
      });

      gaokaoPoints.push({
        text: "高考基础必备：拆项分组。将复合通项拆分为等差数列与等比数列，分别套用各自的求和公式相加。",
        importance: "basic",
      });
    } else if (subModel === "odd-even") {
      const res = calcOddEvenSequence(N);
      const TN = res.terms[N - 1]?.Tn ?? 0;

      quantities.push({
        label: "交替通项 c_n = (-1)^n · n",
        value: `c_${N} = ${res.terms[N - 1]?.cn ?? 0}`,
        color: MATH_COLORS.sequence,
      });

      quantities.push({
        label: `前 ${N} 项和 T_${N}`,
        value: `T_${N} = ${TN}`,
        color: MATH_COLORS.sequenceSum,
      });

      theorems.push({
        name: "奇偶并项求和原理",
        latex: `c_{2k-1} + c_{2k} = -(2k-1) + 2k = 1`,
        condition: "正负交替或分段数列，相邻奇偶两项合并为常数",
      });

      gaokaoPoints.push({
        text: "高考高频思想：奇偶并项。相邻奇数项与偶数项两两组合，每对合并为常数 1，将 n 项求和转化为 n/2 组常数累加。",
        importance: "gaokao",
      });
    }
  } else if (activeMode === "recurrence") {
    const subModel = (config?.subModel as string) ?? "linear-pan";

    if (subModel === "linear-pan") {
      const res = calcLinearRecurrence(a1, p_rec, q_rec, N);
      const aN = res.terms[N - 1]?.an ?? 0;
      const bN = res.terms[N - 1]?.bn ?? 0;

      quantities.push({
        label: `原数列第 ${N} 项 a_${N}`,
        value: `a_${N} = ${aN.toFixed(2)}`,
        color: MATH_COLORS.sequence,
      });

      if (res.fixedPoint !== null) {
        quantities.push({
          label: "不动点 c = q / (1 - p)",
          value: `c = ${res.fixedPoint.toFixed(2)}`,
          color: MATH_COLORS.sequenceHighlight,
        });

        quantities.push({
          label: `平移等比数列 b_${N} (b_n = a_n - c)`,
          value: `b_${N} = ${bN.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary,
        });

        theorems.push({
          name: "待定系数法 (一阶线性递推构造)",
          latex: `a_{n+1} - c = p(a_n - c) \\implies c = \\frac{q}{1-p} \\quad (p \\neq 1)`,
          condition: "两边减去不动点 c，转化为公比为 p 的等比数列",
        });

        theorems.push({
          name: "通项公式推导",
          latex: `a_n = (a_1 - c) p^{n-1} + c`,
          condition: `a_1=${a1}, p=${p_rec}, c=${res.fixedPoint.toFixed(2)}`,
        });
      } else {
        theorems.push({
          name: "退化等差数列 (p = 1)",
          latex: `a_{n+1} = a_n + q \\implies a_n = a_1 + (n-1)q`,
          condition: "p = 1 时递推关系化为标准等差数列",
        });

        warnings.push({
          text: "p = 1 (公式退化)：此时不动点 c 不存在，递推关系退化为公差为 q 的等差数列。",
          level: "warning",
        });
      }

      gaokaoPoints.push({
        text: "高考第一大题常考：待定系数法求通项。令 a_{n+1}+x = p(a_n+x)，展开对比系数得 x = q/(1-p)，构造等比数列 {a_n + x}。图形上表现为蛛网图向不动点 (c,c) 迭代收敛或发散。",
        importance: "gaokao",
      });
    } else if (subModel === "accumulation") {
      const res = calcAccumulationRecurrence(a1, "linear", d, N);
      const aN = res.terms[N - 1]?.an ?? 0;

      quantities.push({
        label: `通项 a_${N} (a_n = a_1 + \\sum f(k))`,
        value: `a_${N} = ${aN.toFixed(2)}`,
        color: MATH_COLORS.sequence,
      });

      quantities.push({
        label: `末阶增量 \\Delta a_{${N - 1}}`,
        value: `\\Delta a = ${(res.terms[N - 1]?.deltaK ?? 0).toFixed(2)}`,
        color: MATH_COLORS.sequenceHighlight,
      });

      theorems.push({
        name: "累加法原理",
        latex: `a_n = a_1 + \\sum_{k=1}^{n-1} (a_{k+1} - a_k) = a_1 + \\sum_{k=1}^{n-1} f(k)`,
        condition: "已知递推关系 a_{n+1} - a_n = f(n) 且 f(n) 可求和",
      });

      gaokaoPoints.push({
        text: "高考解答题高频：累加法。写出 n-1 个递推式纵向相加，左侧中间项全消，右侧套用 f(n) 的求和公式（如等差、等比或二次式）。",
        importance: "gaokao",
      });
    } else if (subModel === "multiplication") {
      const res = calcMultiplicationRecurrence(a1, "n_over_n1", N);
      const aN = res.terms[N - 1]?.an ?? 0;

      quantities.push({
        label: `通项 a_${N} (a_n = a_1 \\prod f(k))`,
        value: `a_${N} = ${aN.toFixed(4)}`,
        color: MATH_COLORS.sequence,
      });

      theorems.push({
        name: "累乘法原理",
        latex: `a_n = a_1 \\cdot \\frac{a_2}{a_1} \\cdot \\frac{a_3}{a_2} \\cdots \\frac{a_n}{a_{n-1}} = a_1 \\prod_{k=1}^{n-1} f(k)`,
        condition: "已知递推关系 a_{n+1} / a_n = f(n) 且 f(n) 可相消或连乘",
      });

      gaokaoPoints.push({
        text: "高考技巧：累乘法。写出 n-1 个比值式纵向相乘，两两对销只余 a_n / a_1，右侧化简为多项式或阶乘形式。",
        importance: "gaokao",
      });
    } else if (subModel === "reciprocal") {
      const res = calcReciprocalRecurrence(a1, coefA, coefB, coefC, N);
      const aN = res.terms[N - 1]?.an ?? 0;
      const bN = res.terms[N - 1]?.bn ?? 0;

      quantities.push({
        label: `原通项 a_${N}`,
        value: Number.isNaN(aN) ? "发散/无定义" : `a_${N} = ${aN.toFixed(4)}`,
        color: MATH_COLORS.sequence,
      });

      quantities.push({
        label: `倒数构造项 b_${N} (b_n = 1/a_n)`,
        value: Number.isNaN(bN) ? "无定义" : `b_${N} = ${bN.toFixed(4)}`,
        color: MATH_COLORS.paramSecondary,
      });

      theorems.push({
        name: "倒数构造法 (分式递推)",
        latex: `a_{n+1} = \\frac{A a_n}{B a_n + C} \\implies \\frac{1}{a_{n+1}} = \\frac{C}{A} \\cdot \\frac{1}{a_n} + \\frac{B}{A}`,
        condition: "分式递推取倒数，转化为一阶线性递推 b_{n+1} = p b_n + q",
      });

      gaokaoPoints.push({
        text: "高考难题突破：取倒数构造。当递推式分子为单项 a_n、分母为一次式时，取倒数令 b_n = 1/a_n，转化为构造等差/等比数列求出 b_n，再倒数回 a_n。",
        importance: "hard",
      });

      if (Math.abs(coefB) < 1e-9) {
        warnings.push({
          text: "B = 0 (退化为纯比例)：分母二次项为 0 时，无需取倒数，原式即为标准等比数列。",
          level: "info",
        });
      }
    } else if (subModel === "second-order") {
      const res = calcSecondOrderRecurrence(a1, a2, p_rec, q_rec, N);
      const aN = res.terms[N - 1]?.an ?? 0;

      quantities.push({
        label: `二阶递推通项 a_${N}`,
        value: `a_${N} = ${aN.toFixed(2)}`,
        color: MATH_COLORS.sequence,
      });

      quantities.push({
        label: "特征根 r₁, r₂",
        value: `r₁ = ${res.r1.toFixed(2)}, r₂ = ${res.r2.toFixed(2)}`,
        color: MATH_COLORS.sequenceHighlight,
      });

      theorems.push({
        name: "特征方程法 (二阶常系数线性递推)",
        latex: `x^2 - p x - q = 0 \\implies a_n = C_1 r_1^n + C_2 r_2^n \\quad (r_1 \\neq r_2)`,
        condition: "特征方程求得两不相等实根时通项的线性组合",
      });

      gaokaoPoints.push({
        text: "高考压轴题应用：二阶递推与特征方程。通过构造 a_{n+2} - r_1 a_{n+1} = r_2 (a_{n+1} - r_1 a_n)，将二阶递推转化为一阶等比递推。",
        importance: "hard",
      });
    }
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
  };
}
