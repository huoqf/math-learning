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
  calcAbsSumSequence,
  calcRadicalTelescoping,
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
    const subMode = (config?.arithmeticSubMode as string) ?? "linear";
    const kSegment = params.kSegment ?? 3;
    const res = calcArithmeticSequence(a1, d, N, kSegment);
    const aN = res.terms[N - 1]?.an ?? 0;
    const SN = res.terms[N - 1]?.Sn ?? 0;
    const TN = res.terms[N - 1]?.Tn ?? 0;

    const constTerm = a1 - d;
    const constSign =
      constTerm >= 0 ? `+ ${constTerm}` : `- ${Math.abs(constTerm)}`;
    const anLatex =
      Math.abs(d) < 1e-9
        ? `${a1}`
        : `\\color{${MATH_COLORS.paramSecondary}}{${d}}n ${constSign}`;

    // 通用数学量
    quantities.push({
      label: `末项 a_{${N}} (a_n = ${anLatex})`,
      value: `a_{${N}} = ${aN.toFixed(2)}`,
      color: MATH_COLORS.sequence,
    });

    quantities.push({
      label: `前 ${N} 项和 S_{${N}}`,
      value: `S_{${N}} = ${SN.toFixed(2)}`,
      color: MATH_COLORS.sequenceSum,
    });

    if (subMode === "linear") {
      if (res.zeroPointExact !== null) {
        quantities.push({
          label: "变号零点 x_0 (a_n = 0 处)",
          value: `x_0 = ${res.zeroPointExact.toFixed(2)}`,
          color: MATH_COLORS.paramTertiary,
        });
      }

      theorems.push({
        name: "等差数列通项与一次函数形式",
        latex: `a_n = \\color{${MATH_COLORS.paramPrimary}}{a_1} + (n-1)\\color{${MATH_COLORS.paramSecondary}}{d} = \\color{${MATH_COLORS.paramSecondary}}{d}n + (\\color{${MATH_COLORS.paramPrimary}}{a_1} - \\color{${MATH_COLORS.paramSecondary}}{d})`,
        condition: "定义在正整数集 N* 上的离散一次函数，斜率为公差 d",
      });

      theorems.push({
        name: "等差中项与下标性质",
        latex: `m+n = p+q \\implies a_m + a_n = a_p + a_q = 2a_{\\frac{m+n}{2}}`,
        condition: "等距项对称和相等",
      });

      gaokaoPoints.push({
        text: "数形结合：等差数列 a_n 散点均落在直线 y = dx + (a_1-d) 上。公差 d > 0 时单调递增，d < 0 时单调递减。公差 d 即直线的斜率。",
        importance: "basic",
      });
    } else if (subMode === "gauss") {
      quantities.push({
        label: `首尾和 (a_1 + a_{${N}})`,
        value: `${(a1 + aN).toFixed(2)}`,
        color: MATH_COLORS.sequenceHighlight,
      });

      theorems.push({
        name: "高斯倒序相加原理 (几何拼图面积)",
        latex: `2S_n = (a_1 + a_n) + (a_2 + a_{n-1}) + \\dots + (a_n + a_1) = n(a_1 + a_n)`,
        condition:
          "正序阶梯与倒序阶梯上下扣合，拼成宽为 n、高为 a1+an 的大矩形",
      });

      theorems.push({
        name: "前 n 项和标准形式",
        latex: `S_n = \\frac{n(\\color{${MATH_COLORS.paramPrimary}}{a_1} + a_n)}{2} = n\\color{${MATH_COLORS.paramPrimary}}{a_1} + \\frac{n(n-1)\\color{${MATH_COLORS.paramSecondary}}{d}}{2}`,
        condition: "知三求二核心公式",
      });

      gaokaoPoints.push({
        text: "无字证明思想：高斯倒序相加通过几何旋转 180° 将两个全等阶梯柱拼成规整矩形，是新高考考查算法与数学证明直观的重要载体。",
        importance: "gaokao",
      });
    } else if (subMode === "quadratic") {
      if (res.continuousAxis !== null) {
        quantities.push({
          label: "抛物线对称轴 x_sym",
          value: `x = ${res.continuousAxis.toFixed(2)}`,
          color: MATH_COLORS.sequenceHighlight,
        });
      }

      if (res.maxSnInfo) {
        const isMax = d < 0;
        quantities.push({
          label: isMax
            ? `S_n 最大值项 ${res.maxSnInfo.isDual ? "(双最值)" : ""}`
            : "S_n 最小值项",
          value: res.maxSnInfo.isDual
            ? `n = ${res.maxSnInfo.nMax}, ${res.maxSnInfo.dualN}, S = ${res.maxSnInfo.maxSn.toFixed(2)}`
            : `n = ${res.maxSnInfo.nMax}, S = ${res.maxSnInfo.maxSn.toFixed(2)}`,
          color: MATH_COLORS.sequenceHighlight,
        });
      }

      theorems.push({
        name: "前 n 项和与二次函数模型",
        latex: `S_n = \\frac{\\color{${MATH_COLORS.paramSecondary}}{d}}{2}n^2 + \\left(\\color{${MATH_COLORS.paramPrimary}}{a_1} - \\frac{\\color{${MATH_COLORS.paramSecondary}}{d}}{2}\\right)n = An^2 + Bn \\quad (A = \\frac{d}{2}, B = a_1 - \\frac{d}{2})`,
        condition: "常数项为 0 的二次函数（图象必过坐标原点）",
      });

      theorems.push({
        name: "数列法求最值判定准则",
        latex: `\\begin{cases} a_n \\ge 0 \\\\ a_{n+1} \\le 0 \\end{cases} \\iff S_n \\text{ 取得最大值} \\quad (d < 0)`,
        condition: "离散极值与连续顶点对称轴邻近取整",
      });

      gaokaoPoints.push({
        text: "高考易错点：抛物线对称轴 x_sym = 0.5 - a1/d 通常非整数，实际最值项取与对称轴距离最近的整数点；若对称轴恰为半整数（如 3.5），则有两个相等的最大值 S_3 = S_4。",
        importance: "hard",
      });
    } else if (subMode === "segment") {
      if (res.segmentedSums) {
        quantities.push({
          label: `片段公差 Δ = k²·d (k=${kSegment})`,
          value: `Δ = ${res.segmentedSums.diff.toFixed(2)}`,
          color: MATH_COLORS.sequenceHighlight,
        });

        res.segmentedSums.segments.forEach((seg) => {
          quantities.push({
            label: `第 ${seg.segmentIndex} 段和 (n=${seg.startN}..${seg.endN})`,
            value: `${seg.sumValue.toFixed(2)}`,
            color: MATH_COLORS.paramTertiary,
          });
        });
      }

      theorems.push({
        name: "等长片段和等差性质定理",
        latex: `A_1 = S_k, \\ A_2 = S_{2k}-S_k, \\ A_3 = S_{3k}-S_{2k} \\implies \\{A_m\\} \\text{ 成等差数列，公差 } D = k^2 d`,
        condition: "分段等长求和性质，适用于解答题快速求 S_{3n}",
      });

      gaokaoPoints.push({
        text: "高考小题秒杀技：已知 S_n 和 S_{2n}，直接利用 S_n, S_{2n}-S_n, S_{3n}-S_{2n} 成等差数列可一步口算出 S_{3n}，无需反解 a1 和 d。",
        importance: "gaokao",
      });
    } else if (subMode === "absSum") {
      quantities.push({
        label: `绝对值总和 T_{${N}} = \\sum |a_k|`,
        value: `T_{${N}} = ${TN.toFixed(2)}`,
        color: MATH_COLORS.sequenceHighlight,
      });

      if (res.lastPositiveN !== null && d < 0 && a1 > 0) {
        quantities.push({
          label: `正项分界项数 m (a_m ≥ 0)`,
          value: `m = ${res.lastPositiveN}`,
          color: MATH_COLORS.sequence,
        });
      }

      theorems.push({
        name: "绝对值数列求和分段原理",
        latex: `T_n = \\sum_{k=1}^n |a_k| = \\begin{cases} S_n, & n \\le m \\\\ 2S_m - S_n, & n > m \\end{cases} \\quad (a_1 > 0, d < 0, a_m \\ge 0 > a_{m+1})`,
        condition: "利用变号零点分段转化为原数列前 n 项和之差",
      });

      gaokaoPoints.push({
        text: "新高考大题压轴热点：绝对值求和必须先令 a_n ≥ 0 求出变号分界点 m。当 n > m 时，T_n = S_m - (S_n - S_m) = 2S_m - S_n，转化后直接代入二次求和公式。",
        importance: "hard",
      });
    }

    if (Math.abs(d) < 1e-9) {
      warnings.push({
        text: "d = 0 (退化常数列)：公差 d 为 0 时，通项 a_n = a_1 为常数，前 n 项和 S_n = n · a_1 呈线性增长，非二次函数。",
        level: "warning",
      });
    }
  } else if (activeMode === "geometric") {
    const subMode =
      (config?.geometricSubMode as string) ??
      (config?.geometricViewType === "tessellation"
        ? "tessellation"
        : "exponential");
    const kSegment = params.kSegment ?? 3;
    const res = calcGeometricSequence(a1, q, N, kSegment);
    const aN = res.terms[N - 1]?.an ?? 0;
    const SN = res.terms[N - 1]?.Sn ?? 0;
    const PN = res.terms[N - 1]?.Pn ?? 0;

    const a1Colored = `\\color{${MATH_COLORS.paramPrimary}}{${a1}}`;
    const qColored = `\\color{${MATH_COLORS.paramSecondary}}{${q}}`;

    // 基础通量
    quantities.push({
      label: `末项 a_{${N}} (a_n = ${a1Colored} \\cdot (${qColored})^{n-1})`,
      value: `a_{${N}} = ${aN.toFixed(4)}`,
      color: MATH_COLORS.sequence,
    });

    quantities.push({
      label: `前 ${N} 项和 S_{${N}}`,
      value: `S_{${N}} = ${SN.toFixed(4)}`,
      color: MATH_COLORS.sequenceSum,
    });

    if (subMode === "exponential") {
      const typeDesc: Record<string, string> = {
        growth: "指数爆炸递增 (q > 1)",
        decay: "指数衰减收敛 (0 < q < 1)",
        constant: "退化常数列 (q = 1)",
        "oscillate-decay": "衰减交替震荡 (-1 < q < 0)",
        "oscillate-period": "周期交替摆动 (q = -1)",
        "oscillate-diverge": "发散交替震荡 (q < -1)",
      };

      quantities.push({
        label: "公比形态特征",
        value: typeDesc[res.qType] ?? "一般形态",
        color: MATH_COLORS.paramSecondary,
      });

      theorems.push({
        name: "等比数列通项与指数模型",
        latex: `a_n = \\color{${MATH_COLORS.paramPrimary}}{a_1} \\cdot \\color{${MATH_COLORS.paramSecondary}}{q}^{n-1} = \\frac{\\color{${MATH_COLORS.paramPrimary}}{a_1}}{\\color{${MATH_COLORS.paramSecondary}}{q}} \\cdot \\color{${MATH_COLORS.paramSecondary}}{q}^n`,
        condition: "定义在正整数集 N* 上的离散指数函数 (a1 ≠ 0, q ≠ 0)",
      });

      theorems.push({
        name: "等比中项与对数化等差性质",
        latex: `a_m \\cdot a_n = a_p \\cdot a_q \\quad (m+n = p+q), \\quad \\ln |a_n| = \\ln |a_1| + (n-1)\\ln |q|`,
        condition: "取绝对值对数后对应公差为 ln|q| 的等差数列",
      });

      gaokaoPoints.push({
        text: "公比分类讨论：新高考大题常考 q 的 6 态分类（特别注意 q=1 常数、0<q<1 衰减与 q<0 震荡）。两边取对数化等差数列是第一问通项求解的核心化归思想。",
        importance: "basic",
      });
    } else if (subMode === "staggerSum") {
      quantities.push({
        label: `错位项 q · S_{${N}}`,
        value: `q S_{${N}} = ${(q * SN).toFixed(4)}`,
        color: MATH_COLORS.sequenceSecondary,
      });

      quantities.push({
        label: `两式差 (1 - q) S_{${N}}`,
        value: `(1-q)S_{${N}} = ${(SN - q * SN).toFixed(4)}`,
        color: MATH_COLORS.sequenceHighlight,
      });

      theorems.push({
        name: "错位相减法推导原理",
        latex: `S_n - \\color{${MATH_COLORS.paramSecondary}}{q}S_n = \\color{${MATH_COLORS.paramPrimary}}{a_1} - \\color{${MATH_COLORS.paramPrimary}}{a_1}\\color{${MATH_COLORS.paramSecondary}}{q}^n \\implies (1-\\color{${MATH_COLORS.paramSecondary}}{q})S_n = \\color{${MATH_COLORS.paramPrimary}}{a_1}(1-\\color{${MATH_COLORS.paramSecondary}}{q}^n)`,
        condition: "上下两式向右错开 1 格对齐，相减后中间 n-1 项全部对消",
      });

      theorems.push({
        name: "等比数列求和标准分段形式",
        latex: `S_n = \\begin{cases} \\frac{\\color{${MATH_COLORS.paramPrimary}}{a_1}(1 - \\color{${MATH_COLORS.paramSecondary}}{q}^n)}{1 - \\color{${MATH_COLORS.paramSecondary}}{q}}, & \\color{${MATH_COLORS.paramSecondary}}{q} \\neq 1 \\\\ n \\color{${MATH_COLORS.paramPrimary}}{a_1}, & \\color{${MATH_COLORS.paramSecondary}}{q} = 1 \\end{cases}`,
        condition: "高考解答题求和必写分类讨论",
      });

      gaokaoPoints.push({
        text: "大题标准答题规范：错位相减法推导是解答题‘差比数列’求和的母体。必须完整呈现：① 写出 Sn；② 错位写出 qSn；③ 两式相减中间项对消；④ 检验 q=1 并化简。",
        importance: "gaokao",
      });
    } else if (subMode === "segment") {
      if (res.segmentedSums) {
        quantities.push({
          label: `片段公比 q^k (k=${res.segmentedSums.k})`,
          value: `q^${res.segmentedSums.k} = ${res.segmentedSums.ratio.toFixed(4)}`,
          color: MATH_COLORS.sequenceHighlight,
        });

        res.segmentedSums.segments.forEach((seg) => {
          quantities.push({
            label: `片段 ${seg.segmentIndex} 和 (a_{${seg.startN}}..a_{${seg.endN}})`,
            value: `${seg.sumValue.toFixed(4)}`,
            color: MATH_COLORS.sequence,
          });
        });
      }

      theorems.push({
        name: "等长片段和成等比性质",
        latex: `\\frac{S_{2k} - S_k}{S_k} = \\frac{S_{3k} - S_{2k}}{S_{2k} - S_k} = \\color{${MATH_COLORS.paramSecondary}}{q}^k \\quad (q^k \\neq -1, S_k \\neq 0)`,
        condition: "连续等长片段累加和构成公比为 q^k 的新等比数列",
      });

      theorems.push({
        name: "片段知二求一速算公式",
        latex: `(S_{2k} - S_k)^2 = S_k \\cdot (S_{3k} - S_{2k})`,
        condition: "等比中项在片段和中的直接应用",
      });

      gaokaoPoints.push({
        text: "小题秒杀神器：新高考选择填空中已知 S_3 与 S_6 求 S_9 时，直接利用 S_3, S_6-S_3, S_9-S_6 成等比，无需联立繁琐高次方程解 a1 与 q。",
        importance: "gaokao",
      });
    } else if (subMode === "productMax") {
      quantities.push({
        label: `前 ${N} 项积 P_{${N}}`,
        value: `P_{${N}} = ${PN.toFixed(4)}`,
        color: MATH_COLORS.sequenceHighlight,
      });

      if (res.maxPnInfo) {
        quantities.push({
          label: res.maxPnInfo.isMax
            ? `P_n 最大值项 ${res.maxPnInfo.isDual ? "(双最值)" : ""}`
            : "P_n 最小值项",
          value: res.maxPnInfo.isDual
            ? `n = ${res.maxPnInfo.nMax}, ${res.maxPnInfo.dualN}, P = ${res.maxPnInfo.maxPn.toFixed(4)}`
            : `n = ${res.maxPnInfo.nMax}, P = ${res.maxPnInfo.maxPn.toFixed(4)}`,
          color: MATH_COLORS.sequenceHighlight,
        });
      }

      theorems.push({
        name: "前 n 项积与对数二次函数模型",
        latex: `P_n = \\color{${MATH_COLORS.paramPrimary}}{a_1}^n \\color{${MATH_COLORS.paramSecondary}}{q}^{\\frac{n(n-1)}{2}} \\iff \\ln P_n = \\frac{\\ln \\color{${MATH_COLORS.paramSecondary}}{q}}{2} n^2 + \\left(\\ln \\color{${MATH_COLORS.paramPrimary}}{a_1} - \\frac{\\ln \\color{${MATH_COLORS.paramSecondary}}{q}}{2}\\right) n`,
        condition: "正项等比数列前 n 项积取对数后转化为等差数列二次求和模型",
      });

      theorems.push({
        name: "前 n 项积最值判定准则 (以 1 为分界)",
        latex: `\\begin{cases} a_n \\ge 1 \\\\ a_{n+1} \\le 1 \\end{cases} \\iff P_n \\text{ 取得最大值} \\quad (a_1 > 1, 0 < q < 1)`,
        condition: "乘数由大于 1 变为小于 1 时乘积达到峰值",
      });

      gaokaoPoints.push({
        text: "新高考创新压轴点：类比等差求和以 0 为变号分界，等比求积极值以 1 为乘除分界点；取对数 ln(Pn) 后完全等价于等差数列 Sn 的二次函数求最值。",
        importance: "hard",
      });
    } else if (subMode === "tessellation") {
      if (res.limitSum !== null) {
        quantities.push({
          label: "无穷递缩和 S_∞",
          value: `S_∞ = ${res.limitSum.toFixed(4)}`,
          color: MATH_COLORS.sequenceHighlight,
        });
      }

      theorems.push({
        name: "无穷递缩等比数列求和定理",
        latex: `S_\\infty = \\lim_{n \\to \\infty} S_n = \\frac{\\color{${MATH_COLORS.paramPrimary}}{a_1}}{1 - \\color{${MATH_COLORS.paramSecondary}}{q}} \\quad (|\\color{${MATH_COLORS.paramSecondary}}{q}| < 1)`,
        condition: "公比绝对值严格小于 1 时，q^n 趋近于 0，和收敛于有限面积",
      });

      gaokaoPoints.push({
        text: "极限与无字证明：正方形自相似细分面积展示了代数无穷累加向几何有限面积的收敛，是新高考考查直观想象与极限思想的重要模型。",
        importance: "gaokao",
      });
    }

    // 警示与前提
    if (Math.abs(q - 1) < 1e-9) {
      warnings.push({
        text: "⚠️ 临界退化 (q = 1)：分母 1 - q = 0，此时公式退化为 Sn = n·a1。高考大题若漏掉对 q = 1 的分类讨论将被重扣 2~4 分！",
        level: "warning",
      });
    } else if (Math.abs(q) < 1e-9) {
      warnings.push({
        text: "q = 0 (退化常数列)：等比数列定义要求公比 q ≠ 0 且首项 a1 ≠ 0。",
        level: "danger",
      });
    } else if (Math.abs(a1) < 1e-9) {
      warnings.push({
        text: "a1 = 0 (所有项均为 0)：首项为 0 时失去等比意义。",
        level: "danger",
      });
    }
  } else if (activeMode === "models") {
    const subModel = (config?.subModel as string) ?? "arith-geo";
    const teleGap = params.teleGap ?? 1;

    if (subModel === "arith-geo") {
      const res = calcArithGeoSplit(a1, d, q, N);
      const TN = res.terms[N - 1]?.Tn ?? 0;
      const isCriticalQ1 = Math.abs(q - 1) < 1e-6;

      quantities.push({
        label: "混合通项 $c_n = a_n \\cdot b_n$",
        value: `c_{${N}} = ${(res.terms[N - 1]?.cn ?? 0).toFixed(4)}`,
        color: MATH_COLORS.sequence,
      });

      quantities.push({
        label: `前 $N$ 项和 $T_{${N}}$`,
        value: `T_{${N}} = ${TN.toFixed(4)}`,
        color: MATH_COLORS.sequenceSum,
      });

      quantities.push({
        label: "公比 $q$ 状态",
        value: isCriticalQ1 ? "$q = 1$ (临界退化)" : `$q = ${q}$`,
        color: isCriticalQ1
          ? MATH_COLORS.paramPrimary
          : MATH_COLORS.paramSecondary,
      });

      theorems.push({
        name: "错位相减法通式原理",
        latex: `(1-q)T_n = a_1 b_1 + d \\sum_{k=2}^n q^{k-1} - a_n q^n`,
        condition:
          "适用于等差数列 $\\{a_n\\}$ 与等比数列 $\\{b_n\\}$ 对应项相乘构成的差比混合数列 ($q \\neq 1$)",
      });

      gaokaoPoints.push({
        text: "新高考易错防坑点 1：公比 $q=1$ 遗漏讨论。当公比含字母参数时，必须先讨论 $q=1$（退化为等差求和或二次多项式求和），再讨论 $q \\neq 1$ 错位相减，否则解答题扣 2-4 分。",
        importance: "hard",
      });

      gaokaoPoints.push({
        text: "新高考易错防坑点 2：中间等比段项数统计。乘以公比右移相减后，中间等比数列共有 $(n-1)$ 项，首项为 $d \\cdot q$，公比为 $q$，切忌将项数误算为 $n$ 项。",
        importance: "gaokao",
      });

      gaokaoPoints.push({
        text: "新高考易错防坑点 3：尾项符号与指数。两式相减后，原第 $n$ 项乘公比得到 $-a_n \\cdot q^n$，必带负号且指数为 $n$，常因粗心漏掉负号或写错指数。",
        importance: "hard",
      });

      if (isCriticalQ1) {
        warnings.push({
          text: "公比 q = 1 错位相减法失效：(1-q)=0 不能作分母除过去。此时 c_n = a_n 为纯等差数列，前 n 项和应直接使用等差求和公式 T_n = n a_1 + n(n-1)d/2。",
          level: "danger",
        });
      }
    } else if (subModel === "telescoping") {
      if (teleGap === 3) {
        // 根式有理化型
        const res = calcRadicalTelescoping(N);
        quantities.push({
          label: "根式通项 $c_n$",
          value: "\\frac{1}{\\sqrt{n}+\\sqrt{n+1}} = \\sqrt{n+1} - \\sqrt{n}",
          color: MATH_COLORS.sequence,
        });
        quantities.push({
          label: `前 $N$ 项和 $T_{${N}}$`,
          value: `T_{${N}} = ${res.finalTn.toFixed(4)}`,
          color: MATH_COLORS.sequenceSum,
        });
        theorems.push({
          name: "根式有理化裂项原理",
          latex: `\\sum_{k=1}^n \\frac{1}{\\sqrt{k}+\\sqrt{k+1}} = \\sum_{k=1}^n (\\sqrt{k+1} - \\sqrt{k}) = \\sqrt{n+1} - 1`,
          condition: "分母为相邻根式和时，分子分母同乘共轭根式有理化",
        });
        gaokaoPoints.push({
          text: "高考根式裂项：分子分母同乘以 $(\\sqrt{k+1} - \\sqrt{k})$，分母化简为 $(k+1)-k=1$，直接转化为前后伸缩抵消，仅剩首项 $-1$ 与尾项 $+\\sqrt{n+1}$。",
          importance: "gaokao",
        });
      } else if (teleGap === 2) {
        // 跨项差 2 型
        const res = calcCrossTelescoping(N);
        const TN = res.terms[N - 1]?.Tn ?? 0;

        quantities.push({
          label: "跨项裂项通项 $c_n = \\frac{1}{n(n+2)}$",
          value: `c_{${N}} = ${(res.terms[N - 1]?.cn ?? 0).toFixed(4)}`,
          color: MATH_COLORS.sequence,
        });
        quantities.push({
          label: `前 $N$ 项和 $T_{${N}}$`,
          value: `T_{${N}} = ${TN.toFixed(4)}`,
          color: MATH_COLORS.sequenceSum,
        });
        quantities.push({
          label: "极限值 $\\lim T_N$",
          value: "0.7500",
          color: MATH_COLORS.sequenceHighlight,
        });
        theorems.push({
          name: "跨项裂项相消原理 (分母差为 2)",
          latex: `\\sum_{k=1}^n \\frac{1}{k(k+2)} = \\frac{1}{2}\\left( 1 + \\frac{1}{2} - \\frac{1}{n+1} - \\frac{1}{n+2} \\right)`,
          condition:
            "分母两因式差为 $2$ 时，相消后首部保留 $2$ 项，尾部保留 $2$ 项",
        });
        gaokaoPoints.push({
          text: "高考防错陷阱：分母差为 2 时必须先提取系数 $\\frac{1}{2}$！且抵消时对称保留首部前 2 正项 $(1 + \\frac{1}{2})$ 与尾部后 2 负项 $(-\\frac{1}{n+1} - \\frac{1}{n+2})$。",
          importance: "hard",
        });
      } else {
        // 标准差 1 型
        const res = calcTelescoping(N);
        const TN = res.terms[N - 1]?.Tn ?? 0;

        quantities.push({
          label: "裂项通项 $c_n = \\frac{1}{n(n+1)}$",
          value: `c_{${N}} = ${(res.terms[N - 1]?.cn ?? 0).toFixed(4)}`,
          color: MATH_COLORS.sequence,
        });
        quantities.push({
          label: `前 $N$ 项和 $T_{${N}}$`,
          value: `T_{${N}} = ${TN.toFixed(4)}`,
          color: MATH_COLORS.sequenceSum,
        });
        quantities.push({
          label: "极限收敛值 $\\lim T_N$",
          value: "1.0000",
          color: MATH_COLORS.sequenceHighlight,
        });
        theorems.push({
          name: "标准裂项相消原理 (分母差为 1)",
          latex: `\\sum_{k=1}^n \\left( \\frac{1}{k} - \\frac{1}{k+1} \\right) = 1 - \\frac{1}{n+1}`,
          condition: "通项拆分为前后紧邻的两项之差，两两对消",
        });
        gaokaoPoints.push({
          text: "高考基础必拿分：标准裂项相消首尾对销。中间项 $(+\\frac{1}{2} - \\frac{1}{2} + \\frac{1}{3} - \\frac{1}{3} \\dots)$ 全部对消，仅保留首项 $1$ 与尾项 $-\\frac{1}{n+1}$，常用于证明不等式 $T_n < 1$。",
          importance: "gaokao",
        });
      }
    } else if (subModel === "abs-sum") {
      const res = calcAbsSumSequence(a1, d, N);
      const TN = res.terms[N - 1]?.Tn ?? 0;

      quantities.push({
        label: `前 $N$ 项绝对值和 $T_{${N}}$`,
        value: `T_{${N}} = ${TN.toFixed(2)}`,
        color: MATH_COLORS.sequenceSum,
      });

      if (res.zeroPoint !== null) {
        quantities.push({
          label: "变号零点 $n_0$",
          value: `n_0 = ${res.zeroPoint.toFixed(2)}`,
          color: MATH_COLORS.paramPrimary,
        });
      }

      quantities.push({
        label: "变号类型",
        value:
          res.signChangeType === "posToNeg"
            ? "前正后负 (递减变号)"
            : res.signChangeType === "negToPos"
              ? "前负后正 (递增变号)"
              : "同号无变号",
        color: MATH_COLORS.sequenceHighlight,
      });

      theorems.push({
        name: "绝对值数列分段求和原理",
        latex: res.sumFormula,
        mode: "block",
        condition:
          "等差数列发生正负变号时，以变号零点 $n_0$ 为分界线分段去绝对值求和",
      });

      gaokaoPoints.push({
        text: "新高考解答题压轴高频：绝对值数列求和 $T_n = \\sum_{k=1}^n |a_k|$。核心步骤：① 令 $a_n = 0$ 解出变号点 $n_0$；② 分 $n \\le n_0$ 与 $n > n_0$ 两种情况；③ 利用 $T_n = 2S_{n_0} - S_n$ 快速化简计算，避免繁琐分段累加。",
        importance: "hard",
      });
    } else if (subModel === "grouped") {
      const res = calcGroupedSequence(a1, d, q, N);
      const TN = res.terms[N - 1]?.Tn ?? 0;

      quantities.push({
        label: "复合通项 $c_n = a_n + b_n$",
        value: `c_{${N}} = ${(res.terms[N - 1]?.cn ?? 0).toFixed(2)}`,
        color: MATH_COLORS.sequence,
      });

      quantities.push({
        label: `前 $N$ 项和 $T_{${N}}$`,
        value: `T_{${N}} = ${TN.toFixed(2)}`,
        color: MATH_COLORS.sequenceSum,
      });

      theorems.push({
        name: "分组转化求和法原理",
        latex: `T_n = \\sum (a_k + b_k) = \\sum a_k + \\sum b_k = S_n^{(a)} + S_n^{(b)}`,
        condition: "通项可拆解为两个已知常见求和数列之和",
      });

      gaokaoPoints.push({
        text: "高考基础必备：拆项分组。将复合通项拆分为等差数列与等比数列，分别套用各自的求和公式相加，注意等比部分公比 $q=1$ 的讨论。",
        importance: "basic",
      });
    } else if (subModel === "odd-even") {
      const res = calcOddEvenSequence(N);
      const TN = res.terms[N - 1]?.Tn ?? 0;

      quantities.push({
        label: "交替通项 $c_n = (-1)^n \\cdot n$",
        value: `c_{${N}} = ${res.terms[N - 1]?.cn ?? 0}`,
        color: MATH_COLORS.sequence,
      });

      quantities.push({
        label: `前 $N$ 项和 $T_{${N}}$`,
        value: `T_{${N}} = ${TN}`,
        color: MATH_COLORS.sequenceSum,
      });

      theorems.push({
        name: "奇偶并项求和原理",
        latex: `T_n = \\begin{cases} k, & n = 2k \\\\ -k, & n = 2k-1 \\end{cases}`,
        mode: "block",
        condition: "正负交替或分段数列，相邻奇偶两项合并为常数",
      });

      gaokaoPoints.push({
        text: "高考高频思想：奇偶并项与分类讨论。当数列呈现摆动周期性时，必须分别对项数 $n$ 为偶数 ($n=2k$) 与 $n$ 为奇数 ($n=2k-1$) 分类求解，再综合写出分段或统一表达式。",
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
