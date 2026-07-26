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
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
  };
}
