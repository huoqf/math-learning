/**
 * src/data/builders/sequence.ts
 * 构建数列实验室右屏 MathPanel 看板数据 (含 5 大高考模型全量扩展)
 */
import type { MathPanelData } from "../types";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  calcArithmeticSequence,
  calcGeometricSequence,
  calcArithGeoSplit,
  calcTelescoping,
  calcGroupedSequence,
  calcCrossTelescoping,
  calcOddEvenSequence,
  calcAbsSumSequence,
  calcSnToAn,
  calcRadicalTelescoping,
  calcLinearRecurrence,
  calcAccumulationRecurrence,
  calcMultiplicationRecurrence,
  calcNonHomogeneousExpRecurrence,
  calcReciprocalRecurrence,
  calcSecondOrderRecurrence,
  calcInductionVerification,
  type InductionClaimId,
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
  const reasoningSteps: NonNullable<MathPanelData["reasoningSteps"]> = [];
  let mnemonic: string | undefined = undefined;

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
    // 数学片段统一用 $...$ 包裹（全工程 label 的既定约定，见 katexSyntaxValidation 测试）
    quantities.push({
      label: `末项 $a_{${N}}$ ($a_n = ${anLatex}$)`,
      value: `a_{${N}} = ${formatMathNumber(aN)}`,
      color: MATH_COLORS.sequence,
    });

    quantities.push({
      label: `前 ${N} 项和 $S_{${N}}$`,
      value: `S_{${N}} = ${formatMathNumber(SN)}`,
      color: MATH_COLORS.sequenceSum,
    });

    if (subMode === "linear") {
      if (res.zeroPointExact !== null) {
        quantities.push({
          label: "变号零点 $x_0$ ($a_n = 0$ 处)",
          value: `x_0 = ${formatMathNumber(res.zeroPointExact)}`,
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
        text: "数形结合：等差数列 $a_n$ 散点均落在直线 $y = dx + (a_1-d)$ 上。公差 $d > 0$ 时单调递增，$d < 0$ 时单调递减。公差 $d$ 即直线的斜率。",
        importance: "basic",
      });
      reasoningSteps.push(
        {
          step: 1,
          title: "设出首项与公差，确认这是一次型通项",
          detail: `首项 $a_1 = ${a1}$，公差 $d = ${d}$：等差数列的通项是定义在正整数集上的离散一次函数，斜率就是公差`,
          latex: `a_1 = ${a1},\\quad d = ${d}`,
        },
        {
          step: 2,
          title: "代入通项公式求出指定项",
          detail: `把首项与公差代入 $a_n = a_1 + (n-1)d$，取 $n = ${N}$ 得 $a_{${N}} = ${formatMathNumber(aN)}$`,
          latex: `a_n = ${a1} + (n-1)\\cdot ${d} = ${anLatex} \\implies a_{${N}} = ${formatMathNumber(aN)}`,
          rubric: "[高考采分点] 写出通项并代入具体项 (+2分)",
        },
        {
          step: 3,
          title: "用首项与公差求前 $n$ 项和",
          detail: `代入 $S_n = na_1 + \\frac{n(n-1)}{2}d$，取 $n = ${N}$ 得 $S_{${N}} = ${formatMathNumber(SN)}$`,
          latex: `S_{${N}} = ${N}\\cdot ${a1} + \\frac{${N}\\times ${N - 1}}{2}\\cdot ${d} = ${formatMathNumber(SN)}`,
          rubric: "[高考采分点] 求和公式代入并算出数值 (+3分)",
        },
      );
    } else if (subMode === "gauss") {
      quantities.push({
        label: `首尾和 $(a_1 + a_{${N}})$`,
        value: `${formatMathNumber(a1 + aN)}`,
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
      reasoningSteps.push(
        {
          step: 1,
          title: "首末两项配对，先算它们的和",
          detail: `首项 $a_1 = ${a1}$，末项 $a_{${N}} = ${formatMathNumber(aN)}$，首末和为 ${formatMathNumber(a1 + aN)}`,
          latex: `a_1 + a_{${N}} = ${a1} + ${formatMathNumber(aN)} = ${formatMathNumber(a1 + aN)}`,
        },
        {
          step: 2,
          title: "倒序相加：正序与倒序逐项配对",
          detail: `把正序和与倒序和相加，每一对的和都等于首末和，共 ${N} 对，故 $2S = ${N} \\times ${formatMathNumber(a1 + aN)}$`,
          latex: `2S_n = (a_1 + a_n) + (a_2 + a_{n-1}) + \\cdots + (a_n + a_1) = n(a_1 + a_n)`,
          rubric: "[高考采分点] 写清倒序相加的配对过程 (+3分)",
        },
        {
          step: 3,
          title: "两边除以 2 得求和结果",
          detail: `$S_{${N}} = \\frac{${N}\\left(${a1} + ${formatMathNumber(aN)}\\right)}{2} = ${formatMathNumber(SN)}$`,
          latex: `S_{${N}} = \\frac{${N}\\left(${a1} + ${formatMathNumber(aN)}\\right)}{2} = ${formatMathNumber(SN)}`,
        },
      );
    } else if (subMode === "quadratic") {
      if (res.continuousAxis !== null) {
        quantities.push({
          label: "抛物线对称轴 $x_0$",
          value: `x = ${formatMathNumber(res.continuousAxis)}`,
          color: MATH_COLORS.sequenceHighlight,
        });
      }

      if (res.maxSnInfo) {
        const isMax = res.maxSnInfo.isMax ?? d < 0;
        quantities.push({
          label: isMax
            ? `$S_n$ 最大值项 ${res.maxSnInfo.isDual ? "(双最值)" : ""}`
            : `$S_n$ 最小值项 ${res.maxSnInfo.isDual ? "(双最值)" : ""}`,
          value: res.maxSnInfo.isDual
            ? `n = ${res.maxSnInfo.nMax}, ${res.maxSnInfo.dualN}, S = ${formatMathNumber(res.maxSnInfo.maxSn)}`
            : `n = ${res.maxSnInfo.nMax}, S = ${formatMathNumber(res.maxSnInfo.maxSn)}`,
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

      if (Math.abs(d) > 1e-9) {
        const extremaWord = d > 0 ? "最小值" : "最大值";
        gaokaoPoints.push({
          text: `高考易错点：抛物线对称轴 $x_0 = \\frac{1}{2} - \\frac{a_1}{d}$ 通常非整数，实际最值项取与对称轴距离最近的整数点；若对称轴恰为半整数（如 3.5），则有两个相等的${extremaWord} $S_3 = S_4$。`,
          importance: "hard",
        });
      }

      reasoningSteps.push(
        {
          step: 1,
          title: "把前 $n$ 项和写成二次函数",
          detail: `$S_n = \\frac{d}{2}n^2 + \\left(a_1 - \\frac{d}{2}\\right)n$，常数项必为 0，图象过原点`,
          latex: `S_n = \\frac{${d}}{2}n^2 + \\left(${a1} - \\frac{${d}}{2}\\right)n`,
        },
        {
          step: 2,
          title: "求对称轴，离散最值向它靠拢",
          detail:
            res.continuousAxis !== null
              ? `对称轴 $x_0 = \\frac{1}{2} - \\frac{a_1}{d} = ${formatMathNumber(res.continuousAxis)}$，最值项取对称轴两侧最近的整数`
              : "公差为 0 时退化为常数列，$S_n$ 随 $n$ 线性增长，不存在唯一的极值项",
          latex:
            res.continuousAxis !== null
              ? `x_0 = \\frac{1}{2} - \\frac{${a1}}{${d}} = ${formatMathNumber(res.continuousAxis)}`
              : `d = 0 \\implies S_n = ${a1}n`,
          rubric: "[高考采分点] 用对称轴定位最值项 (+3分)",
        },
        {
          step: 3,
          title: "读出最值并核对临界项符号",
          detail: res.maxSnInfo
            ? `最值项 $n = ${res.maxSnInfo.nMax}${res.maxSnInfo.isDual ? `$，与 $n = ${res.maxSnInfo.dualN}$ 并列` : ""}，对应 $S = ${formatMathNumber(res.maxSnInfo.maxSn)}$`
            : "当前参数下没有可报告的最值项",
          latex: res.maxSnInfo
            ? `S_{${res.maxSnInfo.nMax}} = ${formatMathNumber(res.maxSnInfo.maxSn)}`
            : `S_n \\text{ 无最值}`,
        },
      );
    } else if (subMode === "segment") {
      if (res.segmentedSums) {
        quantities.push({
          label: `片段公差 Δ = k²·d (k=${kSegment})`,
          value: `Δ = ${formatMathNumber(res.segmentedSums.diff)}`,
          color: MATH_COLORS.sequenceHighlight,
        });

        res.segmentedSums.segments.forEach((seg) => {
          quantities.push({
            label: `第 ${seg.segmentIndex} 段和 (n=${seg.startN}..${seg.endN})`,
            value: `${formatMathNumber(seg.sumValue)}`,
            color: MATH_COLORS.paramTertiary,
          });
        });
      } else {
        warnings.push({
          text: `当前项数 $N=${N}$ 不足两组等长片段（$k=${kSegment}$，需 $N \\ge 2k$）。请在左屏增大项数或减小 $k$ 以观察等差片段性质。`,
          level: "info",
        });
      }

      theorems.push({
        name: "等长片段和等差性质定理",
        latex: `A_1 = S_k, \\ A_2 = S_{2k}-S_k, \\ A_3 = S_{3k}-S_{2k} \\implies \\{A_m\\} \\text{ 成等差数列，公差 } D = k^2 d`,
        condition: "分段等长求和性质，适用于解答题快速求 S_{3n}",
      });

      gaokaoPoints.push({
        text: "高考小题秒杀技：已知 $S_n$ 和 $S_{2n}$，直接利用 $S_n, S_{2n}-S_n, S_{3n}-S_{2n}$ 成等差数列可一步口算出 $S_{3n}$，无需反解 $a1$ 和 $d$。",
        importance: "gaokao",
      });
      if (res.segmentedSums) {
        const segList = res.segmentedSums.segments;
        const segA = segList[0];
        const segB = segList[1];
        reasoningSteps.push(
          {
            step: 1,
            title: `按每 ${kSegment} 项切一段，先算第一段和`,
            detail: `第一段从 $n = ${segA.startN}$ 到 $n = ${segA.endN}$，累加得 ${formatMathNumber(segA.sumValue)}`,
            latex: `A_1 = S_{${segA.endN}} = ${formatMathNumber(segA.sumValue)}`,
          },
          {
            step: 2,
            title: "第二段用两个前缀和相减，避免重新累加",
            detail: segB
              ? `$A_2 = S_{${segB.endN}} - S_{${segB.startN - 1}} = ${formatMathNumber(segB.sumValue)}$`
              : `当前 $N = ${N}$ 不足 $2k = ${2 * kSegment}$ 项，第二段尚未出现，增大项数后才能观察片段性质`,
            latex: segB
              ? `A_2 = S_{${segB.endN}} - S_{${segB.startN - 1}} = ${formatMathNumber(segB.sumValue)}`
              : `N = ${N} < 2k = ${2 * kSegment}`,
            rubric: "[高考采分点] 用 $S_{2k} - S_k$ 表示第二段和 (+3分)",
          },
          {
            step: 3,
            title: "相邻片段和作差，公差只含 $k^2 d$",
            detail: `片段和之间构成等差数列，公差 $D = k^2 d = ${kSegment}^2 \\times ${d} = ${formatMathNumber(res.segmentedSums.diff)}$，与具体项数 $n$ 无关`,
            latex: `D = ${kSegment}^2 \\cdot ${d} = ${formatMathNumber(res.segmentedSums.diff)}`,
          },
        );
      } else {
        reasoningSteps.push(
          {
            step: 1,
            title: "先确认片段长度与实际项数是否匹配",
            detail: `片段长度 $k = ${kSegment}$，当前只有 $N = ${N}$ 项，不足两段，无法比较相邻片段和`,
            latex: `N = ${N} < 2k = ${2 * kSegment}`,
          },
          {
            step: 2,
            title: "片段和成等差的前提是至少出现两段",
            detail:
              "至少要凑出 $A_1 = S_k$ 与 $A_2 = S_{2k} - S_k$ 两个量，才谈得上公差 $D = k^2 d$",
            latex: `A_1, A_2, A_3 \\text{ 才能构成等差数列}`,
          },
          {
            step: 3,
            title: "调大项数后重看这一步",
            detail: `在左屏把 $N$ 增大到不小于 ${2 * kSegment}，或把 $k$ 减小，即可观察到片段和等差`,
            latex: `N \\ge ${2 * kSegment}`,
          },
        );
      }
    } else if (subMode === "absSum") {
      quantities.push({
        label: `绝对值总和 $T_{${N}} = \\sum |a_k|$`,
        value: `T_{${N}} = ${formatMathNumber(TN)}`,
        color: MATH_COLORS.sequenceHighlight,
      });

      if (res.lastPositiveN !== null && d < 0 && a1 > 0) {
        quantities.push({
          label: `正项分界项数 $m$ ($a_m ≥ 0$)`,
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
        text: "新高考大题压轴热点：绝对值求和必须先令 $a_n ≥ 0$ 求出变号分界点 $m$。当 $n > m$ 时，$T_n = S_m - (S_n - S_m) = 2S_m - S_n$，转化后直接代入二次求和公式。",
        importance: "hard",
      });
      reasoningSteps.push(
        {
          step: 1,
          title: "先令 $a_n = 0$，求出变号分界项",
          detail:
            res.lastPositiveN !== null && d < 0 && a1 > 0
              ? `$a_n = ${a1} + (n-1)\\cdot(${d}) = 0 \\implies n = ${formatMathNumber((a1 - d) / -d)}$，故 $a_m \\ge 0$ 的最后一项为 $m = ${res.lastPositiveN}$`
              : "当前首项与公差同号，数列全程不变号，去掉绝对值等同于原数列直接求和",
          latex:
            res.lastPositiveN !== null && d < 0 && a1 > 0
              ? `a_m \\ge 0 > a_{m+1} \\implies m = ${res.lastPositiveN}`
              : `${a1} \\text{ 与 } ${d} \\text{ 同号} \\implies a_n \\text{ 不变号}`,
          rubric: "[高考采分点] 由 $a_n = 0$ 解出变号分界 (+3分)",
        },
        {
          step: 2,
          title: "按分界把绝对值拆成同号两段",
          detail:
            "分界之前各项非负，绝对值直接去掉；分界之后各项为负，取相反数，于是一段原和、一段差的组合",
          latex: `T_n = \\begin{cases} S_n, & n \\le m \\\\ 2S_m - S_n, & n > m \\end{cases}`,
          rubric: "[高考采分点] 写出分段表达式 $T_n = 2S_m - S_n$ (+3分)",
        },
        {
          step: 3,
          title: "代入具体项数算出绝对值总和",
          detail: `取 $n = ${N}$，得 $T_{${N}} = ${formatMathNumber(TN)}$；再用 $S_{${N}} = ${formatMathNumber(SN)}$ 交叉核对数量级是否合理`,
          latex: `T_{${N}} = ${formatMathNumber(TN)},\\quad S_{${N}} = ${formatMathNumber(SN)}`,
        },
      );
    } else if (subMode === "snToAn") {
      /**
       * 已知 S_n 求通项（选择性必修二 4.1）。
       *
       * 三段式：① 给出题设的 S_n（含常数项 C）；② 用 a_n = S_n − S_{n−1} 作差；
       * ③ 用 a_1 = S_1 单独验证并给出可否合并的结论。
       * ③ 是本模式的全部价值所在 —— 常数项 C ≠ 0 时，不验证就直接合并是高考最常见的扣分点。
       */
      const C = params.snConst ?? 0;
      const snRes = calcSnToAn(a1, d, N, C);
      const A = d / 2;
      const B = a1 - d / 2;
      const anFormula =
        d === 0
          ? `${formatMathNumber(a1)}`
          : `${formatMathNumber(d)}n ${B - A >= 0 ? "+" : "-"} ${formatMathNumber(Math.abs(B - A))}`;

      quantities.push(
        {
          label: "题给前 $n$ 项和 $S_n$",
          value: `S_n = ${formatMathNumber(A)}n^2 ${B >= 0 ? "+" : "-"} ${formatMathNumber(Math.abs(B))}n${C === 0 ? "" : ` ${C > 0 ? "+" : "-"} ${formatMathNumber(Math.abs(C))}`}`,
          color: MATH_COLORS.sequenceSum,
        },
        {
          label: "作差所得 $a_n$（$n \\ge 2$）",
          value: `a_n = ${anFormula}`,
          color: MATH_COLORS.sequence,
        },
        {
          label: "由 $S_1$ 求出的首项 $a_1$",
          value: `a_1 = S_1 = ${formatMathNumber(snRes.a1FromSn)}`,
          color: MATH_COLORS.sequenceHighlight,
        },
        {
          label: "反推式在 n = 1 的取值",
          value: `${formatMathNumber(snRes.a1FromFormula)}`,
          color: MATH_COLORS.paramTertiary,
        },
      );

      theorems.push({
        name: "由 $S_n$ 求 $a_n$ 的分段定理",
        latex: `a_n = \\begin{cases} S_1, & n = 1 \\ S_n - S_{n-1}, & n \\ge 2 \\end{cases}`,
        condition:
          "两段结果若能统一成一个解析式，才可合并；否则必须写成分段形式",
      });

      gaokaoPoints.push({
        text: snRes.isFirstTermConsistent
          ? "本题 $S_n$ 的常数项为 $0$，作差所得式子恰好在 $n = 1$ 处也成立，因此可以合并成一个通项公式——但要写出「$n = 1$ 时 $a_1 = S_1$ 也满足该式」这句话，验算步骤本身是采分点。"
          : `本题 S_n 的常数项为 ${formatMathNumber(C)} ≠ 0：作差所得的 a_n = ${anFormula} 只在 n ≥ 2 成立，而 a_1 = S_1 = ${formatMathNumber(snRes.a1FromSn)} 与它在 n = 1 处的取值 ${formatMathNumber(snRes.a1FromFormula)} 不相等。直接合并写成一个式子会丢掉首项，必须写成分段形式。`,
        importance: "hard",
      });

      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 写出题给 $S_n$ 的解析式",
          detail: `题目给出 $S_n = ${formatMathNumber(A)}n^2 ${B >= 0 ? "+" : "-"} ${formatMathNumber(Math.abs(B))}n${C === 0 ? "" : ` ${C > 0 ? "+" : "-"} ${formatMathNumber(Math.abs(C))}`}$。由 $a_n = S_n - S_{n-1}$ 可知，只要对 $n \\ge 2$ 作差即可消去二次项以下的常数干扰。`,
          latex: `S_n = ${formatMathNumber(A)}n^2 ${B >= 0 ? "+" : "-"} ${formatMathNumber(Math.abs(B))}n${C === 0 ? "" : ` ${C > 0 ? "+" : "-"} ${formatMathNumber(Math.abs(C))}`}`,
          rubric: "采分点：写出题给 $S_n$ 并指明作差法的适用条件（2分）",
        },
        {
          step: 2,
          title: "代入求解 · 作差求 n ≥ 2 的通项",
          detail: `$a_n = S_n - S_{n-1} = ${formatMathNumber(d)}n ${a1 - d >= 0 ? "+" : "-"} ${formatMathNumber(Math.abs(a1 - d))}$（$n \\ge 2$）。作差时二次项与常数项同时抵消，结果为一次式，说明该数列在 $n \\ge 2$ 时构成等差数列，公差为 $${formatMathNumber(d)}$。`,
          latex: `a_n = S_n - S_{n-1} = ${anFormula} \\quad (n \\ge 2)`,
          rubric: "采分点：由 $S_n - S_{n-1}$ 求出 $n \\ge 2$ 时的通项（3分）",
        },
        {
          step: 3,
          title: "结果检验 · 用 a₁ = S₁ 验证首项",
          detail: snRes.isFirstTermConsistent
            ? `$a_1 = S_1 = ${formatMathNumber(snRes.a1FromSn)}$，与作差式在 $n = 1$ 处的取值 $${formatMathNumber(snRes.a1FromFormula)}$ 相等，故两段可合并为 $a_n = ${anFormula}$。${
                C === 0 ? "常数项为 0 正是可合并的充要原因。" : ""
              }`
            : `$a_1 = S_1 = ${formatMathNumber(snRes.a1FromSn)}$，而作差式在 $n = 1$ 处给出 $${formatMathNumber(snRes.a1FromFormula)}$，两者相差 $${formatMathNumber(snRes.a1FromSn - snRes.a1FromFormula)}$，说明首项不服从该式（常数项 $C = ${formatMathNumber(C)} \\ne 0$ 所致）。因此通项必须分段书写。`,
          latex: snRes.isFirstTermConsistent
            ? `a_1 = S_1 = ${formatMathNumber(snRes.a1FromSn)} = ${anFormula.replace(/n/, "1")}`
            : `a_n = \\begin{cases} ${formatMathNumber(snRes.a1FromSn)}, & n = 1 \\ ${anFormula}, & n \\ge 2 \\end{cases}`,
          rubric: "采分点：用 a₁ = S₁ 检验首项并给出合并或分段的结论（3分）",
        },
      );

      if (!snRes.isFirstTermConsistent) {
        warnings.push({
          text: `常数项不为零警告：$S_n$ 的常数项 $C = ${formatMathNumber(C)}$，此时 $a_1 = S_1 = ${formatMathNumber(snRes.a1FromSn)}$ 与作差式的 n = 1 取值不相等，通项必须分段书写，切勿直接合并。`,
          level: "warning",
        });
      }
    }

    if (Math.abs(d) < 1e-9) {
      warnings.push({
        text: "$d = 0$ (退化常数列)：公差 $d$ 为 0 时，通项 $a_n = a_1$ 为常数，前 $n$ 项和 $S_n = n \\cdot a_1$ 呈线性单调变化，非二次函数。",
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
      label: `末项 $a_{${N}}$ ($a_n = ${a1Colored} \\cdot (${qColored})^{n-1}$)`,
      value: `a_{${N}} = ${aN.toFixed(4)}`,
      color: MATH_COLORS.sequence,
    });

    quantities.push({
      label: `前 ${N} 项和 $S_{${N}}$`,
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
      reasoningSteps.push(
        {
          step: 1,
          title: "设出首项与公比，先确认公比不为零",
          detail: `首项 $a_1 = ${a1}$，公比 $q = ${q}$；等比数列要求每一项都不为零，且 $q \\ne 0$`,
          latex: `a_1 = ${a1},\\quad q = ${q} \\;(q \\ne 0)`,
        },
        {
          step: 2,
          title: "代入通项公式，看清它是指数型",
          detail: `$a_n = a_1 q^{n-1}$ 关于 $n$ 是指数型；取 $n = ${N}$ 得 $a_{${N}} = ${aN.toFixed(4)}$，公比形态为「${typeDesc[res.qType] ?? "一般形态"}」`,
          latex: `a_n = ${a1}\\cdot ${q}^{\\,n-1} \\implies a_{${N}} = ${aN.toFixed(4)}`,
          rubric: "[高考采分点] 写出通项并判断增减形态 (+2分)",
        },
        {
          step: 3,
          title: "分 $q = 1$ 与 $q \\ne 1$ 两类求和",
          detail:
            Math.abs(q - 1) < 1e-9
              ? `$q = 1$ 时为常数列，$S_n = n a_1$，取 $n = ${N}$ 得 $S_{${N}} = ${SN.toFixed(4)}$`
              : `代入 $S_n = \\frac{a_1(1-q^n)}{1-q}$，取 $n = ${N}$ 得 $S_{${N}} = ${SN.toFixed(4)}$`,
          latex:
            Math.abs(q - 1) < 1e-9
              ? `S_{${N}} = ${N} \\cdot ${a1} = ${SN.toFixed(4)}`
              : `S_{${N}} = \\frac{${a1}\\left(1 - ${q}^{${N}}\\right)}{1 - ${q}} = ${SN.toFixed(4)}`,
          rubric: "[高考采分点] 公比是否为 1 必须分类讨论 (+3分)",
        },
      );
    } else if (subMode === "staggerSum") {
      quantities.push({
        label: `错位项 $q \\cdot S_{${N}}$`,
        value: `q S_{${N}} = ${(q * SN).toFixed(4)}`,
        color: MATH_COLORS.sequenceSecondary,
      });

      quantities.push({
        label: `两式差 $(1 - q) S_{${N}}$`,
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

      reasoningSteps.push(
        {
          step: 1,
          title: "先写出和式，再整体乘公比 $q$",
          detail: `$S_{${N}} = ${SN.toFixed(4)}$，两边同乘 $q = ${q}$ 得 $qS_{${N}} = ${(q * SN).toFixed(4)}$`,
          latex: `S_{${N}} = ${SN.toFixed(4)},\\quad qS_{${N}} = ${(q * SN).toFixed(4)}`,
        },
        {
          step: 2,
          title: "两式错开一格相减，中间项成对消去",
          detail: `上下两式相减，中间的等比项全部对消，只剩首尾两项，得 $(1-q)S_{${N}} = ${(SN - q * SN).toFixed(4)}$`,
          latex: `S_n - qS_n = a_1 - a_1 q^n \\implies (1-q)S_n = a_1(1-q^n)`,
          rubric: "[高考采分点] 写清错位相减的对消过程 (+3分)",
        },
        {
          step: 3,
          title: "除回去时必须声明 $q \\ne 1$",
          detail:
            Math.abs(q - 1) < 1e-9
              ? `本题 $q = 1$，两式相减得 $0 = 0$，说明错位法失效，回到常数列求和 $S_{${N}} = ${SN.toFixed(4)}$`
              : `本题 $q = ${q} \\ne 1$，可除以 $1-q$，得 $S_{${N}} = ${formatMathNumber(SN)}$`,
          latex:
            Math.abs(q - 1) < 1e-9
              ? `q = 1 \\implies S_{${N}} = ${N}\\cdot ${a1} = ${SN.toFixed(4)}`
              : `S_{${N}} = \\frac{${(SN - q * SN).toFixed(4)}}{1-${q}} = ${SN.toFixed(4)}`,
          rubric: "[高考采分点] 声明 $q \\neq 1$ 后再除，漏写扣分 (+2分)",
        },
      );
    } else if (subMode === "segment") {
      if (res.segmentedSums) {
        const geoSegList = res.segmentedSums.segments;
        const geoA = geoSegList[0];
        const geoB = geoSegList[1];
        reasoningSteps.push(
          {
            step: 1,
            title: `每 ${res.segmentedSums.k} 项切一段，先算第一段和`,
            detail: `第一段从 $n = ${geoA.startN}$ 到 $n = ${geoA.endN}$，和为 ${geoA.sumValue.toFixed(4)}`,
            latex: `A_1 = S_{${geoA.endN}} = ${geoA.sumValue.toFixed(4)}`,
          },
          {
            step: 2,
            title: `相邻片段和之比恒为 $q^k = ${res.segmentedSums.ratio.toFixed(4)}$`,
            detail: geoB
              ? `$A_2 = S_{${geoB.endN}} - S_{${geoB.startN - 1}} = ${geoB.sumValue.toFixed(4)}$，与 $A_1$ 的比为 ${(geoB.sumValue / (geoA.sumValue || 1)).toFixed(4)}，正是 $q^k$`
              : `当前 $N = ${N}$ 不足两段，先增大项数才能比较片段和之比`,
            latex: geoB
              ? `\\frac{A_2}{A_1} = ${(geoB.sumValue / (geoA.sumValue || 1)).toFixed(4)} = q^{${res.segmentedSums.k}}`
              : `N = ${N} \\text{ 不足 } 2k`,
            rubric: "[高考采分点] 指出片段和仍成等比、公比为 $q^k$ (+3分)",
          },
          {
            step: 3,
            title: "把求 $S_{3n}$ 化归为三个片段和相加",
            detail: "三段和成等比，直接套等比求和公式即可，不必反解首项与公比",
            latex: `S_{3k} = A_1 \\cdot \\frac{1 - \\left(q^k\\right)^3}{1 - q^k}`,
          },
        );
        quantities.push({
          label: `片段公比 $q^k$ ($k=${res.segmentedSums.k}$)`,
          value: `q^${res.segmentedSums.k} = ${res.segmentedSums.ratio.toFixed(4)}`,
          color: MATH_COLORS.sequenceHighlight,
        });

        res.segmentedSums.segments.forEach((seg) => {
          quantities.push({
            label: `片段 ${seg.segmentIndex} 和 ($a_{${seg.startN}}..a_{${seg.endN}}$)`,
            value: `${seg.sumValue.toFixed(4)}`,
            color: MATH_COLORS.sequence,
          });
        });
      } else {
        warnings.push({
          text: `当前项数 $N=${N}$ 不足两组等长片段（$k=${kSegment}$，需 $N \\ge 2k$）。请在左侧调整项数或减小 $k$ 以观察等比片段性质。`,
          level: "info",
        });

        reasoningSteps.push(
          {
            step: 1,
            title: "先确认片段长度与实际项数是否匹配",
            detail: `片段长度 $k = ${kSegment}$，当前 $N = ${N}$ 项不足两段，无法比较相邻片段和`,
            latex: `N = ${N} < 2k = ${2 * kSegment}`,
          },
          {
            step: 2,
            title: "片段和成等比的前提是至少出现两段",
            detail:
              "要凑出 $A_1 = S_k$ 与 $A_2 = S_{2k} - S_k$ 两个量，才能验证其比恒为 $q^k$",
            latex: `A_1, A_2, A_3 \\text{ 才能构成等比数列}`,
          },
          {
            step: 3,
            title: "调大项数后重看这一步",
            detail: `在左屏把 $N$ 增大到不小于 ${2 * kSegment}，即可观察到片段和的等比性质`,
            latex: `N \\ge ${2 * kSegment}`,
          },
        );
      }

      theorems.push({
        name: "等长片段和成等比性质",
        latex: `\\frac{S_{2k} - S_k}{S_k} = \\frac{S_{3k} - S_{2k}}{S_{2k} - S_k} = \\color{${MATH_COLORS.paramSecondary}}{q}^k \\quad (S_k \\neq 0)`,
        condition: "连续等长片段累加和构成公比为 $q^k$ 的新等比数列",
      });

      theorems.push({
        name: "片段知二求一速算公式",
        latex: `(S_{2k} - S_k)^2 = S_k \\cdot (S_{3k} - S_{2k})`,
        condition: "等比中项在片段和中的直接应用",
      });

      gaokaoPoints.push({
        text: "小题秒杀神器：新高考选择填空中已知 $S_3$ 与 $S_6$ 求 $S_9$ 时，直接利用 $S_3, S_6-S_3, S_9-S_6$ 成等比，无需联立繁琐高次方程解 $a1$ 与 $q$。",
        importance: "gaokao",
      });
    } else if (subMode === "productMax") {
      quantities.push({
        label: `前 ${N} 项积 $P_{${N}}$`,
        value: `P_{${N}} = ${PN.toFixed(4)}`,
        color: MATH_COLORS.sequenceHighlight,
      });

      if (res.maxPnInfo) {
        quantities.push({
          label: res.maxPnInfo.isMax
            ? `$P_n$ 最大值项 ${res.maxPnInfo.isDual ? "(双最值)" : ""}`
            : `$P_n$ 最小值项 ${res.maxPnInfo.isDual ? "(双最值)" : ""}`,
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
      reasoningSteps.push(
        {
          step: 1,
          title: "先把乘积拆成指数形式",
          detail: `$P_n = a_1^n \\cdot q^{\\frac{n(n-1)}{2}}$，取对数后是关于 $n$ 的二次型，最值由对称轴决定`,
          latex: `P_n = \\prod_{k=1}^{n} a_k = a_1^{\\,n} q^{\\frac{n(n-1)}{2}}`,
        },
        {
          step: 2,
          title: "用相邻两项的比判断增减转折",
          detail: `$\\frac{a_{n+1}}{a_n} = q$，$q$ 与 $1$ 的大小关系决定 $P_n$ 何时由增转减；取 $n = ${N}$ 得 $P_{${N}} = ${PN.toFixed(4)}$`,
          latex: `P_{${N}} = ${a1}^{${N}} \\cdot ${q}^{\\frac{${N}\\times ${N - 1}}{2}} = ${PN.toFixed(4)}`,
          rubric: "[高考采分点] 用相邻项比值定位乘积的增减转折 (+3分)",
        },
        {
          step: 3,
          title: "读出最值项并核对是否并列",
          detail: res.maxPnInfo
            ? `最值项 $n = ${res.maxPnInfo.nMax}${res.maxPnInfo.isDual ? `$，与 $n = ${res.maxPnInfo.dualN}$ 并列` : ""}，对应 $P = ${res.maxPnInfo.maxPn.toFixed(4)}$`
            : "当前公比下乘积单调，没有内部极值项",
          latex: res.maxPnInfo
            ? `P_{${res.maxPnInfo.nMax}} = ${res.maxPnInfo.maxPn.toFixed(4)}`
            : `P_n \\text{ 单调，无极值项}`,
        },
      );
    } else if (subMode === "tessellation") {
      if (res.limitSum !== null) {
        quantities.push({
          label: "无穷递缩和 $S_\\infty$（拓展）",
          value: `S_\\infty = ${res.limitSum.toFixed(4)}`,
          color: MATH_COLORS.sequenceHighlight,
        });
      }

      theorems.push({
        name: "无穷递缩等比数列的极限和（拓展 · 超出课标）",
        latex: `S_\\infty = \\lim_{n \\to \\infty} S_n = \\frac{\\color{${MATH_COLORS.paramPrimary}}{a_1}}{1 - \\color{${MATH_COLORS.paramSecondary}}{q}} \\quad (|\\color{${MATH_COLORS.paramSecondary}}{q}| < 1)`,
        condition:
          "公比绝对值严格小于 1 时，$q^n$ 趋近于 0，和无界累加却收敛于有限面积",
      });

      gaokaoPoints.push({
        text: "拓展 · 超出课标：教材正文只要求有限项求和 $S_n$，无穷递缩求和属选学延伸。正方形自相似细分给出了代数无穷累加向几何有限面积的直观印证，可作直观想象素养的载体，但不作为高考必考结论。",
        importance: "extend",
      });
      reasoningSteps.push(
        {
          step: 1,
          title: "先确认收敛条件：公比必须落在 $(-1, 1)$ 内",
          detail:
            Math.abs(q) < 1
              ? `本题 $|q| = ${Math.abs(q)}$ 小于 1，无穷递缩和收敛，前 ${N} 项和 $S_{${N}} = ${SN.toFixed(4)}$ 已接近极限`
              : `本题 $|q| = ${Math.abs(q)}$ 不小于 1，无穷递缩和发散，不存在有限的和`,
          latex: `|q| = ${Math.abs(q)} ${Math.abs(q) < 1 ? "<" : "\\ge"} 1`,
          rubric: "[高考采分点] 先判断 $|q|<1$ 再谈极限 (+2分)",
        },
        {
          step: 2,
          title: "套用无穷递缩等比求和公式",
          detail:
            res.limitSum !== null
              ? `$S = \\frac{a_1}{1-q} = \\frac{${a1}}{1-${q}} = ${res.limitSum.toFixed(4)}$`
              : "公比不满足收敛条件，无穷递缩和没有确定值",
          latex:
            res.limitSum !== null
              ? `S_\\infty = \\frac{${a1}}{1-${q}} = ${res.limitSum.toFixed(4)}`
              : `S_\\infty \\text{ 不存在}`,
          rubric: "[高考采分点] 写出 $\\frac{a_1}{1-q}$ 并代入 (+3分)",
        },
        {
          step: 3,
          title: "用有限和逼近极限，验证两者一致",
          detail:
            res.limitSum !== null
              ? `前 ${N} 项和 $S_{${N}} = ${SN.toFixed(4)}$，与极限的差为 ${Math.abs(SN - res.limitSum).toFixed(4)}，随 $n$ 增大趋于 0`
              : `前 ${N} 项和 $S_{${N}} = ${SN.toFixed(4)}$ 随 $n$ 持续增大，不收敛`,
          latex:
            res.limitSum !== null
              ? `S_{${N}} - S_\\infty = ${Math.abs(SN - res.limitSum).toFixed(4)} \\to 0`
              : `S_n \\text{ 无上界}`,
        },
      );
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
          text: "公比 $q = 1$ 错位相减法失效：$(1-q)=0$ 不能作分母除过去。此时 $c_n = a_n$ 为纯等差数列，前 $n$ 项和应直接使用等差求和公式 $T_n = n a_1 + n(n-1)d/2$。",
          level: "danger",
        });
      }
      reasoningSteps.push(
        {
          step: 1,
          title: "把通项写成等差因子乘等比因子",
          detail: `$c_n = a_n b_n$ 中 $a_n$ 成等差、$b_n$ 成等比，属于差比数列，求和只能用错位相减法`,
          latex: `c_n = a_n b_n = \\left(${a1} + (n-1)\\cdot ${d}\\right)\\cdot ${q}^{\\,n-1}`,
        },
        {
          step: 2,
          title: "写出 $T_n$ 与 $qT_n$ 并相减",
          detail:
            Math.abs(q - 1) < 1e-6
              ? `本题 $q = 1$，差比数列退化为纯等差型，直接套等差求和即可，错位相减会两边相等而失效`
              : `两式错开一格相减，中间的等比部分合并成一个标准等比和对消`,
          latex:
            Math.abs(q - 1) < 1e-6
              ? `q = 1 \\implies c_n = a_n = ${a1} + (n-1)\\cdot ${d}`
              : `T_n - qT_n = a_1 b_1 + \\sum_{k=2}^{n} (a_k - a_{k-1})b_k - a_n b_{n+1}`,
          rubric: "[高考采分点] 错位相减后把剩余部分整理成等比求和 (+3分)",
        },
        {
          step: 3,
          title: "代入项数算出结果",
          detail: `取 $n = ${N}$，得 $T_{${N}} = ${TN.toFixed(4)}$`,
          latex: `T_{${N}} = ${TN.toFixed(4)}`,
        },
      );
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
          label: "无限逼近值 $T_\\infty$（拓展）",
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
          label: "无限逼近值 $T_\\infty$（拓展）",
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
      reasoningSteps.push(
        {
          step: 1,
          title:
            teleGap === 3
              ? "先把根式分母有理化"
              : teleGap === 2
                ? "先把通项拆成两个相邻分式之差"
                : "先确认通项可裂成相邻两项之差",
          detail:
            teleGap === 3
              ? "把 $\\frac{1}{\\sqrt{n}+\\sqrt{n+1}}$ 分子有理化，化成 $\\sqrt{n+1}-\\sqrt{n}$，求和时前后相消"
              : "裂项的关键是找到 $f(n) - f(n+1)$ 的形式，让求和时中间项两两抵消，只剩首尾",
          latex:
            teleGap === 3
              ? `\\frac{1}{\\sqrt{n}+\\sqrt{n+1}} = \\sqrt{n+1} - \\sqrt{n}`
              : `c_n = f(n) - f(n+1)`,
        },
        {
          step: 2,
          title: "纵向相加，中间项成对消去",
          detail: `把 $n = 1$ 到 $n = ${N}$ 的式子全部写出相加，中间项两两抵消，只剩首尾两项`,
          latex: `T_n = \\sum_{k=1}^{n} c_k = f(1) - f(n+1)`,
          rubric: "[高考采分点] 写清相消后只剩首尾两项 (+3分)",
        },
        {
          step: 3,
          title: "代入项数并化简",
          detail: `取 $n = ${N}$ 得求和结果；务必把 $N$ 代回检验一次，避免边界项写错`,
          latex: `T_n = f(1) - f(n+1) \\big|_{n = ${N}}`,
        },
      );
    } else if (subModel === "abs-sum") {
      const res = calcAbsSumSequence(a1, d, N);
      const TN = res.terms[N - 1]?.Tn ?? 0;

      quantities.push({
        label: `前 $N$ 项绝对值和 $T_{${N}}$`,
        value: `T_{${N}} = ${formatMathNumber(TN)}`,
        color: MATH_COLORS.sequenceSum,
      });

      if (res.zeroPoint !== null) {
        quantities.push({
          label: "变号零点 $n_0$",
          value: `n_0 = ${formatMathNumber(res.zeroPoint)}`,
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
      reasoningSteps.push(
        {
          step: 1,
          title: "先令 $a_n = 0$ 求变号点",
          detail:
            res.zeroPoint !== null
              ? `$a_n = ${a1} + (n-1)\\cdot(${d}) = 0 \\implies n_0 = ${formatMathNumber(res.zeroPoint)}$，变号类型为「${res.signChangeType === "posToNeg" ? "前正后负" : res.signChangeType === "negToPos" ? "前负后正" : "同号无变号"}」`
              : "当前公差为 0，数列恒为同一符号，去绝对值不改变求和结果",
          latex:
            res.zeroPoint !== null
              ? `a_n = 0 \\implies n_0 = ${formatMathNumber(res.zeroPoint)}`
              : `d = 0 \\implies a_n \\text{ 不变号}`,
          rubric: "[高考采分点] 解 $a_n = 0$ 定位变号分界 (+3分)",
        },
        {
          step: 2,
          title: "按分界写出分段求和式",
          detail:
            "分界之前各项同号，直接去掉绝对值；分界之后取相反数，两段合成 $2S_{n_0} - S_n$",
          latex: res.sumFormula,
          rubric: "[高考采分点] 写出绝对值求和的分段表达式 (+3分)",
        },
        {
          step: 3,
          title: "代入项数算出总和",
          detail: `取 $n = ${N}$，得 $T_{${N}} = ${formatMathNumber(TN)}$`,
          latex: `T_{${N}} = ${formatMathNumber(TN)}`,
        },
      );
    } else if (subModel === "grouped") {
      const res = calcGroupedSequence(a1, d, q, N);
      const TN = res.terms[N - 1]?.Tn ?? 0;

      quantities.push({
        label: "复合通项 $c_n = a_n + b_n$",
        value: `c_{${N}} = ${formatMathNumber(res.terms[N - 1]?.cn ?? 0)}`,
        color: MATH_COLORS.sequence,
      });

      quantities.push({
        label: `前 $N$ 项和 $T_{${N}}$`,
        value: `T_{${N}} = ${formatMathNumber(TN)}`,
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
      reasoningSteps.push(
        {
          step: 1,
          title: "把通项拆成等差部分与等比部分",
          detail: `$c_n = a_n + b_n$ 中前者成等差（首项 ${a1}，公差 ${d}），后者成等比（公比 ${q}），两部分各自可求和`,
          latex: `c_n = \\left(${a1} + (n-1)\\cdot ${d}\\right) + ${q}^{\\,n}`,
        },
        {
          step: 2,
          title: "分别求和再相加",
          detail: `等差部分用 $na_1 + \\frac{n(n-1)}{2}d$，等比部分用等比求和公式，两者相加即为 $T_n$`,
          latex: `T_n = \\left[na_1 + \\frac{n(n-1)}{2}d\\right] + \\frac{q(1-q^n)}{1-q}`,
          rubric: "[高考采分点] 拆分后分别求和再合并 (+3分)",
        },
        {
          step: 3,
          title: "代入项数得到结果",
          detail: `取 $n = ${N}$，得 $T_{${N}} = ${formatMathNumber(TN)}$`,
          latex: `T_{${N}} = ${formatMathNumber(TN)}`,
        },
      );
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

      reasoningSteps.push(
        {
          step: 1,
          title: "先看相邻两项之和是否为常数",
          detail:
            "$c_n = (-1)^n n$ 的相邻两项 $-(2k-1) + 2k = 1$ 恒为常数，因此可以两两并项，不必逐项相加",
          latex: `c_{2k-1} + c_{2k} = -(2k-1) + 2k = 1`,
          rubric: "[高考采分点] 指出相邻奇偶两项并项为常数 (+3分)",
        },
        {
          step: 2,
          title: "按 $n$ 的奇偶分类写出结果",
          detail:
            "项数为偶数 $n = 2k$ 时恰有 $k$ 对，和为 $k$；项数为奇数 $n = 2k-1$ 时前面 $k-1$ 对相加，再补上最后一项",
          latex: `T_n = \\begin{cases} k, & n = 2k \\\\ -k, & n = 2k-1 \\end{cases}`,
          rubric: "[高考采分点] 分奇偶讨论并写出分段结果 (+3分)",
        },
        {
          step: 3,
          title: "代入项数核对",
          detail: `取 $n = ${N}$（${N % 2 === 0 ? "偶数" : "奇数"}），得 $T_{${N}} = ${TN}$`,
          latex: `T_{${N}} = ${TN}`,
        },
      );
    }
  } else if (activeMode === "recurrence") {
    const subModel = (config?.subModel as string) ?? "linear-pan";
    const r_rec = params.r_rec ?? 3;
    const stepParam = params.stepParam ?? 2;
    const accumFnType =
      (config?.accumFnType as "arithmetic" | "geometric" | "telescoping") ??
      "arithmetic";
    const multType =
      (config?.multType as "n_over_n1" | "n1_over_n" | "pow_two") ??
      "n_over_n1";

    if (subModel === "linear-pan") {
      const res = calcLinearRecurrence(a1, p_rec, q_rec, N);
      const aN = res.terms[N - 1]?.an ?? 0;
      const bN = res.terms[N - 1]?.bn ?? 0;

      quantities.push({
        label: `原数列第 ${N} 项 $a_{${N}}$`,
        value: `a_{${N}} = ${formatMathNumber(aN)}`,
        color: MATH_COLORS.sequence,
      });

      if (res.fixedPoint !== null) {
        quantities.push({
          label: `不动点 $c = \\frac{q}{1-p}$`,
          value: `c = ${formatMathNumber(res.fixedPoint)}`,
          color: MATH_COLORS.paramTertiary,
        });

        quantities.push({
          label: `平移等比数列 $b_{${N}}$ ($b_n = a_n - c$)`,
          value: `b_{${N}} = ${formatMathNumber(bN)}`,
          color: MATH_COLORS.paramSecondary,
        });

        theorems.push({
          name: "待定系数法 (一阶线性递推构造)",
          latex: `a_{n+1} - c = \\color{${MATH_COLORS.paramPrimary}}{p}(a_n - c) \\implies c = \\frac{\\color{${MATH_COLORS.paramSecondary}}{q}}{1-\\color{${MATH_COLORS.paramPrimary}}{p}} \\quad (p \\neq 1)`,
          condition: `两端同时减去不动点 $c$，构造公比为 $p$ 的等比数列 $\\{a_n - c\\}$`,
        });

        theorems.push({
          name: "通项公式推导",
          latex: `a_n = (a_1 - c) \\cdot \\color{${MATH_COLORS.paramPrimary}}{p}^{n-1} + c`,
          condition: `$a_1=${a1}, p=${p_rec}, c=${formatMathNumber(res.fixedPoint)}$`,
        });

        // 极限性质（拓展 · 超出课标）
        if (Math.abs(p_rec) < 1) {
          quantities.push({
            label: "极限稳态 $a_\\infty$（拓展 · 超出课标）",
            value: `$a_\\infty = ${formatMathNumber(res.fixedPoint)}$ (收敛)`,
            color: MATH_COLORS.paramTertiary,
          });
        }
      } else {
        theorems.push({
          name: "退化等差数列 (p = 1)",
          latex: `a_{n+1} = a_n + \\color{${MATH_COLORS.paramSecondary}}{q} \\implies a_n = a_1 + (n-1)q`,
          condition: `$p = 1$ 时递推关系化为标准等差数列，公差 $d = q$`,
        });

        warnings.push({
          text: "$p = 1$ (公式退化)：此时不动点 $c$ 分母为 0，递推式退化为公差为 $q$ 的标准等差数列。",
          level: "warning",
        });
      }

      gaokaoPoints.push({
        text: "【新高考 4 步解答采分点】① 设待定方程 $a_{n+1}-c = p(a_n-c)$，展开得 $c = \\frac{q}{1-p}$；② 证明 $\\{a_n-c\\}$ 是以 $a_1-c$ 为首项、$p$ 为公比的等比数列；③ 写出 $a_n-c = (a_1-c)p^{n-1}$；④ 移项得 $a_n$ 通项公式并检验 $n=1$。",
        importance: "gaokao",
      });

      if (res.fixedPoint !== null) {
        const cVal = res.fixedPoint;
        const b1Val = a1 - cVal;
        reasoningSteps.push(
          {
            step: 1,
            title: "待定系数设不动点方程",
            latex: `a_{n+1} - c = \\color{${MATH_COLORS.paramPrimary}}{p}(a_n - c) \\implies c = \\frac{\\color{${MATH_COLORS.paramSecondary}}{q}}{1-\\color{${MATH_COLORS.paramPrimary}}{p}}`,
            detail: `设常数 $c$ 满足 $c = ${p_rec}c + ${q_rec}$，移项解得平移不动点 $c = \\frac{${q_rec}}{1 - (${p_rec})} = ${formatMathNumber(cVal)}$。`,
            rubric:
              "【审题定法 · 2分】设立方程 $c = pc + q$ 并正确求出常数 $c$",
          },
          {
            step: 2,
            title: "构造平移等比数列",
            latex: `a_{n+1} - (${formatMathNumber(cVal)}) = ${p_rec} \\left[ a_n - (${formatMathNumber(cVal)}) \\right]`,
            detail: `令 $b_n = a_n - (${formatMathNumber(cVal)})$，则 $\\frac{b_{n+1}}{b_n} = ${p_rec}$ (常数)，故 $\\{b_n\\}$ 是以公比 $p = ${p_rec}$ 的等比数列。`,
            rubric:
              "【同减构造 · 3分】两端同减 $c$，严密写出比值为常数 $p$ 的等比证明",
          },
          {
            step: 3,
            title: "求出辅助数列通项",
            latex: `b_n = b_1 \\cdot p^{n-1} = (a_1 - c) p^{n-1} = ${formatMathNumber(b1Val)} \\cdot (${p_rec})^{n-1}`,
            detail: `计算首项 $b_1 = a_1 - c = ${a1} - (${formatMathNumber(cVal)}) = ${formatMathNumber(b1Val)}$，套用通项公式得 $b_n = ${formatMathNumber(b1Val)} \\cdot (${p_rec})^{n-1}$。`,
            rubric:
              "【辅助通项 · 3分】正确求出首项 $b_1 = a_1 - c$ 并写出 $b_n$ 通项表达式",
          },
          {
            step: 4,
            title: "还原主通项并检验首项",
            latex: `a_n = b_n + c = ${formatMathNumber(b1Val)} \\cdot (${p_rec})^{n-1} + (${formatMathNumber(cVal)})`,
            detail: `由 $a_n = b_n + c$ 移项还原；当 $n = 1$ 时，$a_1 = ${formatMathNumber(b1Val)} \\times 1 + (${formatMathNumber(cVal)}) = ${a1}$，检验首项完全吻合。`,
            rubric:
              "【反思还原 · 2分】还原 $a_n$，且答题卷必须显式写出『检验 $n=1$ 吻合』防扣分",
          },
        );
      } else {
        reasoningSteps.push(
          {
            step: 1,
            title: "待定系数设不动点方程",
            latex: `p = 1 \\implies a_{n+1} - a_n = \\color{${MATH_COLORS.paramSecondary}}{q}`,
            detail: `因 $p = 1$，待定系数分母 $1-p=0$ 无解，递推式退化为相邻项差为常数的等差模型。`,
            rubric: "【审题识别 · 2分】识别 $p=1$ 临界退化为标准等差数列",
          },
          {
            step: 2,
            title: "构造平移等比数列",
            latex: `a_{n+1} - a_n = ${q_rec} = d`,
            detail: `直接识别公差 $d = ${q_rec}$，无需再平移构造等比数列。`,
            rubric: "【确定公差 · 3分】写出公差 $d = q$",
          },
          {
            step: 3,
            title: "求出辅助数列通项",
            latex: `a_n = a_1 + (n-1)d = ${a1} + (n-1)(${q_rec})`,
            detail: `套用等差数列通项公式 $a_n = a_1 + (n-1)d$。`,
            rubric: "【代数计算 · 3分】套用等差数列通项公式计算",
          },
          {
            step: 4,
            title: "还原主通项并检验首项",
            latex: `a_n = ${q_rec}n + (${a1 - q_rec})`,
            detail: `化简通项；当 $n=1$ 时，$a_1 = ${a1}$，检验吻合。`,
            rubric: "【化简检验 · 2分】写出最简式并检验 $n=1$ 成立",
          },
        );
      }

      mnemonic =
        "常数一阶找不动，平移同减成等比；公比绝对值小于一，蛛网收敛稳态期。";
    } else if (subModel === "accumulation") {
      const res = calcAccumulationRecurrence(a1, accumFnType, stepParam, N);
      const aN = res.terms[N - 1]?.an ?? 0;
      const deltaLast = res.terms[N - 1]?.deltaK ?? 0;

      quantities.push({
        label: `通项 $a_{${N}}$`,
        value: `a_{${N}} = ${formatMathNumber(aN)}`,
        color: MATH_COLORS.sequence,
      });

      quantities.push({
        label: `末阶增量 $\\Delta a_{${N - 1}}$`,
        value: `\\Delta a = ${formatMathNumber(deltaLast)}`,
        color: MATH_COLORS.paramSecondary,
      });

      theorems.push({
        name: "累加法原理 (差分求和)",
        latex: `a_n = a_1 + \\sum_{k=1}^{n-1} (a_{k+1} - a_k) = a_1 + \\sum_{k=1}^{n-1} f(k)`,
        condition: `已知 $a_{n+1} - a_n = f(n)$ 且 $f(n)$ 可求和 (适用 $n \\ge 2$)`,
      });

      theorems.push({
        name: "本模型通项公式",
        latex: res.formulaLatex,
        condition: `首项 $a_1 = ${a1}$，增量参数 $\\Delta = ${stepParam}$`,
      });

      gaokaoPoints.push({
        text: "【高考累加法必背】写出 $n-1$ 个递推式纵向排列相加，左侧相邻项两两相消仅余 $a_n - a_1$，右侧套用等差/等比或裂项求和公式，最后务必验证 $n=1$ 是否成立！",
        importance: "gaokao",
      });

      mnemonic =
        "差值为式用累加，纵向相加中间消；等差等比或裂项，求和之后验首项。";
      reasoningSteps.push(
        {
          step: 1,
          title: "把递推式整理成相邻两项之差",
          detail: `题给 $a_{n+1} - a_n = f(n)$，这是累加法的标准入口：只要差分能求和，通项就能累加出来`,
          latex: `a_{n+1} - a_n = f(n)`,
        },
        {
          step: 2,
          title: "从 $n=1$ 到 $n-1$ 纵向相加，中间项相消",
          detail: `写出 $n-1$ 个差分式相加，左侧相邻项两两抵消只剩 $a_n - a_1$，右侧变成 $\\sum f(k)$`,
          latex: `a_n - a_1 = \\sum_{k=1}^{n-1} f(k) \\implies a_n = ${a1} + \\sum_{k=1}^{n-1} f(k)`,
          rubric: "[高考采分点] 写清累加后左侧只剩 $a_n - a_1$ (+3分)",
        },
        {
          step: 3,
          title: "求和并代入项数，末项必须回验",
          detail: `取 $n = ${N}$ 得 $a_{${N}} = ${formatMathNumber(aN)}$；累加法只保证 $n \\ge 2$ 时成立，必须单独核对 $n = 1$ 是否也满足该式`,
          latex: `a_{${N}} = ${formatMathNumber(aN)}`,
          rubric: "[高考采分点] 回验 $n=1$ 是否满足通项 (+1分)",
        },
      );
    } else if (subModel === "multiplication") {
      const res = calcMultiplicationRecurrence(a1, multType, N);
      const aN = res.terms[N - 1]?.an ?? 0;

      quantities.push({
        label: `通项 $a_{${N}}$`,
        value: `a_{${N}} = ${aN.toFixed(4)}`,
        color: MATH_COLORS.sequence,
      });

      theorems.push({
        name: "累乘法原理",
        latex: `a_n = a_1 \\cdot \\frac{a_2}{a_1} \\cdot \\frac{a_3}{a_2} \\cdots \\frac{a_n}{a_{n-1}} = a_1 \\prod_{k=1}^{n-1} f(k)`,
        condition: `已知 $\\frac{a_{n+1}}{a_n} = f(n)$ 且各项非零、$f(n)$ 可连乘相消 (适用 $n \\ge 2$)`,
      });

      theorems.push({
        name: "通项结果",
        latex: res.formulaLatex,
        condition: `首项 $a_1 = ${a1}$`,
      });

      gaokaoPoints.push({
        text: "【高考累乘法关键】写出 $n-1$ 个比值式纵向相乘，分子分母交叉对消只余 $\\frac{a_n}{a_1}$。注意先说明 $a_n \\neq 0$，最后检验 $n=1$。",
        importance: "gaokao",
      });

      mnemonic =
        "商值为式用累乘，纵向相乘分子消；首尾相连余一项，化简通项验第一。";
      reasoningSteps.push(
        {
          step: 1,
          title: "把递推式整理成相邻两项之比",
          detail: `题给 $\\frac{a_{n+1}}{a_n} = f(n)$，先用 $a_1 \\ne 0$ 说明各项均不为零，比值才合法`,
          latex: `\\frac{a_{n+1}}{a_n} = f(n) \\quad (a_n \\ne 0)`,
          rubric: "[高考采分点] 先声明各项非零 (+1分)",
        },
        {
          step: 2,
          title: "从 $n=1$ 到 $n-1$ 纵向相乘，分子分母交叉相消",
          detail:
            "相邻比值连乘，前一个的分子与后一个的分母交叉约掉，只剩首尾两项之比",
          latex: `\\frac{a_n}{a_1} = \\prod_{k=1}^{n-1} f(k) \\implies a_n = ${a1}\\prod_{k=1}^{n-1} f(k)`,
          rubric: "[高考采分点] 写清连乘相消只剩 $\\frac{a_n}{a_1}$ (+3分)",
        },
        {
          step: 3,
          title: "化简并代入项数，末项必须回验",
          detail: `取 $n = ${N}$ 得 $a_{${N}} = ${formatMathNumber(aN)}$；累乘法同样只保证 $n \\ge 2$，要回代检查 $n=1$`,
          latex: `a_{${N}} = ${formatMathNumber(aN)}`,
        },
      );
    } else if (subModel === "non-homogeneous") {
      const res = calcNonHomogeneousExpRecurrence(a1, p_rec, q_rec, r_rec, N);
      const aN = res.terms[N - 1]?.an ?? 0;
      const bN = res.terms[N - 1]?.bn ?? 0;

      quantities.push({
        label: `通项 $a_{${N}}$`,
        value: `a_{${N}} = ${formatMathNumber(aN)}`,
        color: MATH_COLORS.sequence,
      });

      quantities.push({
        label: `构造项 $b_{${N}}$ ($b_n = \\frac{a_n}{${r_rec}^n}$)`,
        value: `b_{${N}} = ${bN.toFixed(3)}`,
        color: MATH_COLORS.paramSecondary,
      });

      if (res.isResonant) {
        theorems.push({
          name: "同除构造法 (共振临界 p = r)",
          latex: `\\frac{a_{n+1}}{\\color{${MATH_COLORS.paramTertiary}}{r}^{n+1}} = \\frac{a_n}{\\color{${MATH_COLORS.paramTertiary}}{r}^n} + \\frac{\\color{${MATH_COLORS.paramSecondary}}{q}}{\\color{${MATH_COLORS.paramTertiary}}{r}} \\implies b_{n+1} = b_n + d`,
          condition: `当 $p = r = ${p_rec}$ 时，同除 $r^{n+1}$ 直接化为公差 $d = \\frac{q}{r}$ 的等差数列`,
        });

        warnings.push({
          text: "共振临界 ($p = r$)：两边同除 $r^{n+1}$ 后，辅助数列 $\\{b_n\\}$ 退化为公差为 $\\frac{q}{r}$ 的等差数列！",
          level: "info",
        });
      } else {
        theorems.push({
          name: "同除构造法 (一阶非齐次指数型)",
          latex: `\\frac{a_{n+1}}{\\color{${MATH_COLORS.paramTertiary}}{r}^{n+1}} = \\frac{\\color{${MATH_COLORS.paramPrimary}}{p}}{\\color{${MATH_COLORS.paramTertiary}}{r}} \\cdot \\frac{a_n}{\\color{${MATH_COLORS.paramTertiary}}{r}^n} + \\frac{\\color{${MATH_COLORS.paramSecondary}}{q}}{\\color{${MATH_COLORS.paramTertiary}}{r}}`,
          condition: `两边同除 $r^{n+1}$，令 $b_n = \\frac{a_n}{r^n}$，化为一阶线性递推 $b_{n+1} = \\frac{p}{r}b_n + \\frac{q}{r}$`,
        });
      }

      theorems.push({
        name: "通项公式推导结果",
        latex: res.formulaLatex,
        condition: `$a_1=${a1}, p=${p_rec}, q=${q_rec}, r=${r_rec}$`,
      });

      gaokaoPoints.push({
        text: "【新高考超高频压轴技巧】$a_{n+1} = pa_n + q \\cdot r^n$ 型两边同除 $r^{n+1}$ 构造 $b_n = \\frac{a_n}{r^n}$。若 $p=r$ 则 $\\{b_n\\}$ 为等差数列；若 $p \\neq r$ 则 $\\{b_n\\}$ 为一阶线性递推，可用待定系数法再构造等比。",
        importance: "gaokao",
      });

      mnemonic =
        "指数非齐同除幂，两边除以 r 次方；化归一阶或等差，求出辅助还原本。";
      reasoningSteps.push(
        {
          step: 1,
          title: "两边同除 $r^{n+1}$，把指数项压平",
          detail: `递推式 $a_{n+1} = ${p_rec}a_n + ${q_rec}\\cdot ${r_rec}^n$ 两边同除 $${r_rec}^{n+1}$，令 $b_n = \\frac{a_n}{r^n}$ 即化为一阶线性递推`,
          latex: `\\frac{a_{n+1}}{${r_rec}^{n+1}} = \\frac{${p_rec}}{${r_rec}}\\cdot \\frac{a_n}{${r_rec}^{n}} + \\frac{${q_rec}}{${r_rec}}`,
          rubric: "[高考采分点] 指出同除 $r^{n+1}$ 的依据 (+2分)",
        },
        {
          step: 2,
          title: "对新数列用待定系数法求通项",
          detail: res.isResonant
            ? `本题 $p = r = ${p_rec}$，同除后一次项系数恰好为 1，$\\{b_n\\}$ 退化为等差数列，公差 $d = \\frac{q}{r} = ${(q_rec / r_rec).toFixed(4)}$`
            : `本题 $\\frac{p}{r} = ${(p_rec / r_rec).toFixed(4)} \\ne 1$，用不动点法把 $b_n$ 平移成等比数列`,
          latex: res.isResonant
            ? `p = r \\implies b_{n+1} = b_n + \\frac{${q_rec}}{${r_rec}}`
            : `b_{n+1} = \\frac{${p_rec}}{${r_rec}}b_n + \\frac{${q_rec}}{${r_rec}}`,
          rubric: "[高考采分点] 分类讨论 $p=r$ 与 $p\\ne r$ (+3分)",
        },
        {
          step: 3,
          title: "乘回 $r^n$ 还原原数列",
          detail: `由 $a_n = r^n b_n$ 还原，取 $n = ${N}$ 得 $a_{${N}} = ${formatMathNumber(aN)}$，构造项 $b_{${N}} = ${bN.toFixed(4)}$`,
          latex: `a_n = ${r_rec}^{\\,n}\\cdot b_n \\implies a_{${N}} = ${formatMathNumber(aN)}`,
        },
      );
    } else if (subModel === "reciprocal") {
      const res = calcReciprocalRecurrence(a1, coefA, coefB, coefC, N);
      const aN = res.terms[N - 1]?.an ?? 0;
      const bN = res.terms[N - 1]?.bn ?? 0;

      quantities.push({
        label: `原通项 $a_{${N}}$`,
        value: Number.isNaN(aN) ? "发散/无定义" : `a_{${N}} = ${aN.toFixed(4)}`,
        color: MATH_COLORS.sequence,
      });

      quantities.push({
        label: `倒数构造项 $b_{${N}}$ ($b_n = \\frac{1}{a_n}$)`,
        value: Number.isNaN(bN) ? "无定义" : `b_{${N}} = ${bN.toFixed(4)}`,
        color: MATH_COLORS.paramSecondary,
      });

      if (res.isReciprocalLinear) {
        theorems.push({
          name: "倒数构造等差数列 (A = C 特例)",
          latex: `\\frac{1}{a_{n+1}} = \\frac{1}{a_n} + \\frac{\\color{${MATH_COLORS.paramSecondary}}{B}}{\\color{${MATH_COLORS.paramPrimary}}{A}} \\implies b_{n+1} = b_n + d`,
          condition: `$A = C = ${coefA}$ 时，倒数数列 $\\{\\frac{1}{a_n}\\}$ 为公差 $d = \\frac{B}{A} = ${formatMathNumber(coefB / coefA)}$ 的等差数列`,
        });
      } else {
        theorems.push({
          name: "倒数构造一阶线性 (分式递推)",
          latex: `\\frac{1}{a_{n+1}} = \\frac{\\color{${MATH_COLORS.paramTertiary}}{C}}{\\color{${MATH_COLORS.paramPrimary}}{A}} \\cdot \\frac{1}{a_n} + \\frac{\\color{${MATH_COLORS.paramSecondary}}{B}}{\\color{${MATH_COLORS.paramPrimary}}{A}}`,
          condition: `两边取倒数，令 $b_n = \\frac{1}{a_n}$，转化为一阶线性递推 $b_{n+1} = \\frac{C}{A}b_n + \\frac{B}{A}$`,
        });
      }

      gaokaoPoints.push({
        text: "【高考分式求通项】当分子仅有 $a_n$ 一次项、分母为一次式时，两边取倒数构造 $b_n = \\frac{1}{a_n}$。特别注意先说明 $a_n \\neq 0$ 并检验分母非零。",
        importance: "hard",
      });

      if (Math.abs(coefB) < 1e-9) {
        warnings.push({
          text: "$B = 0$ (退化为纯比例)：分母二次项为 0 时，无需取倒数，原递推式直接等价于公比为 $\\frac{A}{C}$ 的等比数列。",
          level: "info",
        });
      }

      mnemonic =
        "分式递推分子单，两边取倒现乾坤；化归等差或一阶，算得倒数再翻转。";
      reasoningSteps.push(
        {
          step: 1,
          title: "先确认两边可以取倒数",
          detail: `分式递推 $a_{n+1} = \\frac{${coefA}a_n}{${coefB}a_n + ${coefC}}$ 要求 $a_n \\ne 0$ 且分母不为零，然后两边取倒数`,
          latex: `\\frac{1}{a_{n+1}} = \\frac{${coefC}}{${coefA}}\\cdot\\frac{1}{a_n} + \\frac{${coefB}}{${coefA}}`,
          rubric: "[高考采分点] 声明 $a_n \\ne 0$ 后取倒数 (+2分)",
        },
        {
          step: 2,
          title: "把 $b_n = \\frac{1}{a_n}$ 化成一阶线性递推",
          detail: res.isReciprocalLinear
            ? `本题系数满足可线性化条件，$\\{b_n\\}$ 是首项 $\\frac{1}{${a1}}$、公比 $\\frac{${coefC}}{${coefA}} = ${(coefC / coefA).toFixed(4)}$ 的等比数列`
            : `本题 $\\frac{C}{A} = ${(coefC / coefA).toFixed(4)} \\ne 1$，需再用待定系数法平移成等比数列`,
          latex: res.isReciprocalLinear
            ? `b_n = \\frac{1}{${a1}}\\cdot\\left(\\frac{${coefC}}{${coefA}}\\right)^{n-1}`
            : `b_{n+1} = \\frac{${coefC}}{${coefA}}b_n + \\frac{${coefB}}{${coefA}}`,
          rubric: "[高考采分点] 求出辅助数列 $b_n$ 的通项 (+3分)",
        },
        {
          step: 3,
          title: "取倒数还原，并回验首项",
          detail: `$a_n = \\frac{1}{b_n}$，取 $n = ${N}$ 得 $a_{${N}} = ${formatMathNumber(aN)}$（$b_{${N}} = ${bN.toFixed(4)}$）；取倒数会引入 $a_n \\ne 0$ 的前提，必须回验`,
          latex: `a_n = \\frac{1}{b_n} \\implies a_{${N}} = ${formatMathNumber(aN)}`,
        },
      );
    } else if (subModel === "second-order") {
      const res = calcSecondOrderRecurrence(a1, a2, p_rec, q_rec, N);
      const aN = res.terms[N - 1]?.an ?? 0;
      const bN = res.terms[N - 1]?.bn ?? 0;

      quantities.push({
        label: `二阶递推通项 $a_{${N}}$`,
        value: `a_{${N}} = ${formatMathNumber(aN)}`,
        color: MATH_COLORS.sequence,
      });

      if (res.delta >= 0) {
        quantities.push({
          label: `特征根 $r_1, r_2$`,
          value: `r_1 = ${formatMathNumber(res.r1)}, r_2 = ${formatMathNumber(res.r2)}`,
          color: MATH_COLORS.paramSecondary,
        });

        quantities.push({
          label: `降阶等比项 $b_{${N}}$ ($b_n = a_{n+1} - r_1 a_n$)`,
          value: `b_{${N}} = ${formatMathNumber(bN)}`,
          color: MATH_COLORS.paramSecondary,
        });

        if (Math.abs(res.r1 - res.r2) < 1e-9) {
          theorems.push({
            name: "重特征根型 (Δ = 0)",
            latex: `(x - r)^2 = 0 \\implies a_n = (C_1 + C_2 n) r^{n-1} \\quad (r = ${formatMathNumber(res.r1)})`,
            condition: `对应二次方程有二重实根 $r_1 = r_2 = ${formatMathNumber(res.r1)}$`,
            // 条目级课标边界标注：解对应二次方程求根本身超出教材正文（教材只要求等差、等比与数学归纳法）
            isExtension: true,
            extensionBadge: "拓展 · 超出课标",
          });
        } else {
          theorems.push({
            name: "特征根法 (二阶线性递推)",
            latex: `x^2 - \\color{${MATH_COLORS.paramPrimary}}{p} x - \\color{${MATH_COLORS.paramSecondary}}{q} = 0 \\implies a_n = C_1 r_1^n + C_2 r_2^n \\quad (r_1 \\neq r_2)`,
            condition: `判别式 $\\Delta = p^2 + 4q = ${formatMathNumber(res.delta)} > 0$，对应二次方程的两实根为 $r_1=${formatMathNumber(res.r1)}, r_2=${formatMathNumber(res.r2)}$`,
            // 条目级课标边界标注：正文陈述统一用课标内表述（「对应二次方程」），方法名只出现在
            // 定理名 / 左屏标签 / 拓展徽标等命名载体上；「拓展」字样一律不进定理名（AGENTS.md 条目级声明约定）
            isExtension: true,
            extensionBadge: "拓展 · 超出课标",
          });
        }

        theorems.push({
          name: "构造降阶等比数列",
          latex: `a_{n+2} - r_1 a_{n+1} = r_2 (a_{n+1} - r_1 a_n)`,
          condition: `令 $b_n = a_{n+1} - r_1 a_n$，则 $\\{b_n\\}$ 为公比为 $r_2 = ${formatMathNumber(res.r2)}$ 的等比数列`,
        });
      } else {
        warnings.push({
          text: `对应二次方程判别式 $\\Delta = p^2 + 4q = ${formatMathNumber(res.delta)} < 0$，无实根（拓展模型仅考查 $\\Delta \\ge 0$ 的实根情形）。`,
          level: "danger",
          isExtension: true,
        });
      }

      gaokaoPoints.push({
        text: "拓展 · 超出课标：二阶线性递推不在教材正文范围（教材只要求等差、等比与数学归纳法）。求对应二次方程 $x^2 - px - q = 0$ 的两根 $r_1, r_2$，构造等比数列 $b_n = a_{n+1} - r_1 a_n = (a_2 - r_1 a_1) r_2^{n-1}$，再用累加法或待定系数求解 $a_n$，可作强基与竞赛延伸。",
        importance: "extend",
      });

      mnemonic =
        "二阶递推特征根，方程求出 r₁ r₂；构造等比公比定，降阶求通势如破。";
      reasoningSteps.push(
        {
          step: 1,
          title: "写出对应的二次方程并求根",
          detail:
            res.delta >= 0
              ? `对应二次方程的两实根为 $r_1 = ${formatMathNumber(res.r1)}$，$r_2 = ${formatMathNumber(res.r2)}$（$\\Delta = ${formatMathNumber(res.delta)}$）`
              : `判别式 $\\Delta = ${formatMathNumber(res.delta)} < 0$，二次方程无实根，降阶等比构造在实数范围内不适用`,
          latex: `x^2 - ${p_rec}x - ${q_rec} = 0 \\implies x = \\frac{${p_rec} \\pm \\sqrt{${formatMathNumber(res.delta)}}}{2}`,
          rubric: "[高考采分点] 写出对应二次方程并求根 (+2分)",
        },
        {
          step: 2,
          title: "构造降阶等比数列",
          detail:
            res.delta >= 0
              ? `令 $b_n = a_{n+1} - r_1 a_n$，则 $\\{b_n\\}$ 是公比为 $r_2 = ${formatMathNumber(res.r2)}$ 的等比数列，首项由 $a_1, a_2$ 定出`
              : "无实根时无法完成降阶，属超出本页考查范围的情形",
          latex: `b_n = a_{n+1} - ${formatMathNumber(res.r1)}a_n \\implies b_{n+1} = ${formatMathNumber(res.r2)}b_n`,
          rubric: "[高考采分点] 说明降阶后是等比数列 (+3分)",
        },
        {
          step: 3,
          title: "再累加一次得到原通项",
          detail: `由 $a_{n+1} = r_1 a_n + b_n$ 用累加法求 $a_n$，取 $n = ${N}$ 得 $a_{${N}} = ${formatMathNumber(aN)}$（$b_{${N}} = ${formatMathNumber(bN)}$）`,
          latex: `a_n = r_1^{\\,n-1}a_1 + \\sum_{k=1}^{n-1} r_1^{\\,n-1-k}b_k`,
        },
      );
    } else if (subModel === "induction") {
      const claimId = (config?.inductionClaim as InductionClaimId) ?? "sum_odd";
      const res = calcInductionVerification(claimId, { a1, d: stepParam, N });
      const passCount = res.rows.filter((r) => r.holds).length;
      const stepCount = res.stepChecks.filter((s) => s.ok).length;

      quantities.push(
        {
          label: "归纳命题 $P(n)$",
          value: res.claimLatex.replace(/^P\(n\):\\quad /, ""),
          color: MATH_COLORS.sequence,
          isInvariant: true,
        },
        {
          label: "奠基 $P(1)$ 是否成立",
          value: res.baseCaseHolds
            ? "成立（第一块骨牌已倒）"
            : "不成立（前提作废）",
          color: res.baseCaseHolds
            ? MATH_COLORS.paramPrimary
            : MATH_COLORS.degeneracy,
          highlight: res.baseCaseHolds ? "positive" : "negative",
        },
        {
          label: `逐项核对 $n=1$ 至 $n=${N}$`,
          value: `${passCount} / ${N} 项成立`,
          color:
            passCount === N
              ? MATH_COLORS.paramSecondary
              : MATH_COLORS.degeneracy,
        },
        {
          label: `递推增量恒等式（$k=1$ 至 $k=${N - 1}$）`,
          value:
            stepCount === res.stepChecks.length
              ? `${stepCount} / ${stepCount} 组增量严格相等`
              : `${stepCount} / ${res.stepChecks.length} 组相等`,
          color:
            stepCount === res.stepChecks.length
              ? MATH_COLORS.paramPrimary
              : MATH_COLORS.degeneracy,
          highlight:
            stepCount === res.stepChecks.length ? "extreme" : "negative",
        },
      );

      if (res.primeCounterexample) {
        const ce = res.primeCounterexample;
        quantities.push({
          label: "只奠基不递推的反例 $n^2+n+41$",
          value: `$n=1$ 至 $n=${ce.n - 1}$ 全为质数，$n=${ce.n}$ 时等于 $${ce.value} = ${ce.factor}^2$，不再是质数`,
          color: MATH_COLORS.limitPoint,
        });
      }

      theorems.push(
        {
          name: "数学归纳法（两步框架）",
          latex:
            "\\begin{cases} \\text{① 奠基：} P(1) \\text{ 成立} \\\\ \\text{② 递推：} P(k) \\text{ 成立} \\implies P(k+1) \\text{ 成立} \\end{cases} \\implies P(n) \\text{ 对一切正整数 } n \\text{ 成立}",
          level: "important",
          condition:
            "两步缺一不可：只奠基等于「验算了有限项」，只递推等于「骨牌全连着却没人推第一块」",
          isExtension: true,
          extensionBadge: "拓展 · 选学",
        },
        claimId === "linear_term"
          ? {
              name: "本题的归纳步骤（由递推推公式）",
              latex: `a_{k+1} = a_k + ${stepParam} \\;\\overset{\\text{归纳假设}}{=}\\; \\big(${a1} + (k-1)\\cdot ${stepParam}\\big) + ${stepParam} = ${a1} + k \\cdot ${stepParam} \\quad\\text{（即 } n = k+1 \\text{ 时的公式）}`,
              level: "core",
            }
          : {
              name: "本题的归纳步骤（由 $k$ 的结论推 $k+1$）",
              latex:
                claimId === "sum_odd"
                  ? "S_{k+1} = S_k + (2k+1) \\;\\overset{\\text{归纳假设}}{=}\\; k^2 + 2k + 1 = (k+1)^2"
                  : "S_{k+1} = S_k + 2^{k} \\;\\overset{\\text{归纳假设}}{=}\\; (2^k - 1) + 2^k = 2^{k+1} - 1",
              level: "core",
              note: "归纳假设必须在这一步被用上：拿 $k$ 的结论算出 $k+1$ 的结论才叫递推；把 $n=k+1$ 直接代进去算，是循环论证",
            },
      );

      gaokaoPoints.push(
        {
          text: "数学归纳法采分三步：① 奠基，验证 $n=1$（或题给的最小正整数）时命题成立；② 假设 $n=k$（$k \\ge 1$）时成立，并把这个结论用进 $n=k+1$ 的推导；③ 结论，写出「由①②知对一切正整数 $n$ 成立」。第②步只写不用，只给一半分。",
          importance: "gaokao",
        },
        {
          text: "反例警示：$n^2+n+41$ 在 $n=1$ 到 $n=39$ 时全是质数，$n=40$ 时等于 $41^2$。验算有限项永远代替不了证明，这正是必须补上第②步的原因。",
          importance: "core",
        },
      );

      if (!res.allRowsHold || !res.stepIdentityHolds) {
        warnings.push({
          text: "逐项核对或递推增量出现不等：当前参数下该命题不成立，归纳法不能使用。",
          level: "danger",
        });
      }

      reasoningSteps.push(
        {
          step: 1,
          title: "奠基：把 $P(1)$ 的真假算清楚",
          detail:
            claimId === "linear_term"
              ? `$n=1$ 时公式给出 $a_1 = ${a1} + 0 = ${a1}$，与题给首项一致，奠基成立`
              : `$n=1$ 时左边算出 ${formatMathNumber(res.rows[0]?.leftValue ?? 0)}，右边算出 ${formatMathNumber(res.rows[0]?.rightValue ?? 0)}，两边相等，奠基成立`,
          latex:
            claimId === "linear_term"
              ? `a_1 = ${a1} + (1-1)\\cdot ${stepParam} = ${a1} \\;\\checkmark`
              : `n = 1:\\quad \\text{左} = ${formatMathNumber(res.rows[0]?.leftValue ?? 0)},\\; \\text{右} = ${formatMathNumber(res.rows[0]?.rightValue ?? 0)} \\;\\checkmark`,
          rubric: "[高考采分点] 显式写出 $n=1$ 的验算 (+2分)",
        },
        {
          step: 2,
          title: "归纳假设：假定 $n=k$ 时命题成立",
          detail:
            "设 $n=k$（$k$ 为不小于 $1$ 的正整数）时命题成立，把这个等式当作已知条件，下一步要真的把它用出来",
          latex:
            claimId === "sum_odd"
              ? "S_k = k^2 \\quad (k \\ge 1)"
              : claimId === "geo_sum"
                ? "S_k = 2^k - 1 \\quad (k \\ge 1)"
                : `a_k = ${a1} + (k-1)\\cdot ${stepParam} \\quad (k \\ge 1)`,
          rubric: "[高考采分点] 明确写出归纳假设 (+3分)",
        },
        {
          step: 3,
          title: "递推：用归纳假设推出 $n=k+1$",
          detail: `增量比对给出左边增量 ${formatMathNumber(res.stepChecks[0]?.lhsIncrement ?? 0)} = 右边增量 ${formatMathNumber(res.stepChecks[0]?.rhsIncrement ?? 0)}，对每个 $k$ 都成立，递推一步通过`,
          latex:
            claimId === "sum_odd"
              ? "S_{k+1} = S_k + (2k+1) = k^2 + 2k + 1 = (k+1)^2 \\implies P(k+1) \\text{ 成立}"
              : claimId === "geo_sum"
                ? "S_{k+1} = S_k + 2^k = (2^k - 1) + 2^k = 2^{k+1} - 1 \\implies P(k+1) \\text{ 成立}"
                : `a_{k+1} = a_k + ${stepParam} = \\big(${a1} + (k-1)\\cdot ${stepParam}\\big) + ${stepParam} = ${a1} + k\\cdot ${stepParam} \\implies P(k+1) \\text{ 成立}`,
          rubric: "[高考采分点] 用上归纳假设完成 $k \\to k+1$ (+4分)",
        },
      );

      mnemonic = "先推第一块，再证块块相连；只验前几项，不算证明完。";
    }
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps: reasoningSteps.length > 0 ? reasoningSteps : undefined,
    mnemonic,
  };
}
