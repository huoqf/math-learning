import type { MathPanelData } from "../types";
import {
  comb,
  perm,
  factorial,
  getBinomialTerm,
} from "../../math/probabilityCounting";
import { MATH_COLORS } from "../../theme";

export function buildProbabilityCountingPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.activeMode as string) || "binomial";

  const n = Math.floor(params.n ?? 5);
  const k = Math.min(Math.floor(params.k ?? 2), n);
  const a = params.a ?? 1;
  const b = params.b ?? 1;
  const m1 = Math.floor(params.m1 ?? 3);
  const m2 = Math.floor(params.m2 ?? 2);
  const m3 = Math.floor(params.m3 ?? 2);

  // 1. 二项式定理模式
  if (mode === "binomial") {
    const termInfo = getBinomialTerm(n, k, a, b);

    const coeffSum = Math.pow(a + b, n);
    const binomCoeffSum = Math.pow(2, n);

    return {
      quantities: [
        {
          label: "二项式指数 n",
          symbol: "n",
          value: n,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "当前选中项 index (k)",
          symbol: "k",
          value: `第 ${k + 1} 项 (T_${k + 1})`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "二项式系数 C_n^k",
          symbol: `C_{${n}}^{${k}}`,
          value: termInfo.binomialCoeff,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: `实际项系数 (x^{${termInfo.powerA}} 的系数)`,
          symbol: `A_{${k}}`,
          value: termInfo.termCoeff,
          color: MATH_COLORS.functionTransformed,
        },
        {
          label: "二项式系数和 2^n",
          symbol: `\\sum_{k=0}^{${n}} C_{${n}}^k`,
          value: binomCoeffSum,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "赋值法各项系数和 (x=1)",
          symbol: `(${a} + ${b})^{${n}}`,
          value: coeffSum,
          color: MATH_COLORS.derivative,
        },
      ],
      theorems: [
        {
          name: "二项式定理 (Binomial Theorem)",
          latex: `(a + b)^n = \\sum_{k=0}^n C_n^k a^{n-k} b^k`,
          condition: "n \\in \\mathbb{N}^*",
          note: `展开式共 ${n + 1} 项，各项二项式系数对称分布。`,
          level: "core",
        },
        {
          name: "通项公式 (第 k+1 项)",
          latex: `T_{k+1} = C_n^k a^{n-k} b^k`,
          condition: `0 \\le k \\le n`,
          note: `当前高亮项 T_{${k + 1}} = ${termInfo.latexTerm}`,
          level: "important",
        },
        {
          name: "二项式系数性质与递推",
          latex: `C_n^k = C_{n-1}^{k-1} + C_{n-1}^k, \\quad C_n^k = C_n^{n-k}`,
          note: "杨辉三角第 n 行两数相加等于下一行正中间的数。",
          level: "derived",
        },
      ],
      gaokaoPoints: [
        {
          text: `区分“二项式系数”与“项的系数”：二项式系数恒为 C_n^k > 0；项的系数包含 a^{n-k}b^k。`,
          importance: "gaokao",
        },
        {
          text: "常数项与有理项求解：令通项中 x 的指数等于 0 解 k（常数项）；指数为整数解有理项。",
          importance: "hard",
        },
        {
          text: "赋值法特殊值技巧：令 x=1 得各项系数和 (a+b)^n；令 x=-1 得奇偶项交错和。",
          importance: "core",
        },
      ],
      warnings: [
        ...(a === 0
          ? [
              {
                level: "warning" as const,
                text: "退化提醒：当 a = 0 时，多项式退化为常数 b^n，含 x 项均为 0。",
              },
            ]
          : []),
        ...(b === 0
          ? [
              {
                level: "warning" as const,
                text: "退化提醒：当 b = 0 时，多项式退化为单项式 (ax)^n。",
              },
            ]
          : []),
        ...(b < 0
          ? [
              {
                level: "info" as const,
                text: `符号提醒：常数项 b = ${b} < 0，展开式各项系数正负交替，切记带上 (-1)^k！`,
              },
            ]
          : []),
      ],
      mnemonic:
        "二项展开共 n+1 项，通项看准 k 加 1；二项系数对称大，赋值求和特殊 x。",
    };
  }

  // 2. 排列与组合模式
  if (mode === "perm_comb") {
    const P = perm(n, k);
    const C = comb(n, k);
    const KFact = factorial(k);

    return {
      quantities: [
        {
          label: "元素总数 n",
          symbol: "n",
          value: n,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "选取元素数 m (或 k)",
          symbol: "m",
          value: k,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "排列数 A_n^m (与顺序有关)",
          symbol: `A_{${n}}^{${k}}`,
          value: P,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "组合数 C_n^m (与顺序无关)",
          symbol: `C_{${n}}^{${k}}`,
          value: C,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "选出 m 个元素的全排列 m!",
          symbol: `${k}!`,
          value: KFact,
          color: MATH_COLORS.functionTransformed,
        },
      ],
      theorems: [
        {
          name: "排列数公式 (Permutations)",
          latex: `A_n^m = \\frac{n!}{(n-m)!} = n(n-1)\\cdots(n-m+1)`,
          condition: `0 \\le m \\le n`,
          note: "从 n 个不同元素中取出 m 个排成一列，关注顺序。",
          level: "core",
        },
        {
          name: "组合数公式 (Combinations)",
          latex: `C_n^m = \\frac{A_n^m}{m!} = \\frac{n!}{m!(n-m)!}`,
          condition: `0 \\le m \\le n`,
          note: "从 n 个不同元素中取出 m 个合成一组，无关顺序。",
          level: "core",
        },
        {
          name: "组合数补集对称性",
          latex: `C_n^m = C_n^{n-m}`,
          note: `选出 ${k} 个元素等价于留下 ${n - k} 个元素。`,
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "“顺序”核心判定法则：交换选出的两个元素，若结果改变则是排列，不变则是组合。",
          importance: "gaokao",
        },
        {
          text: "相邻问题捆绑法：要求相邻的元素视作一个整体参与排列，内部再全排列。",
          importance: "core",
        },
        {
          text: "不相邻问题插空法：先排无限制元素，再将限制相邻的元素插入已形成的空隙中。",
          importance: "hard",
        },
      ],
      warnings: [
        ...(k > n
          ? [
              {
                level: "danger" as const,
                text: "非法参数：选取元素数 m 不能大于总元素数 n，组合数与排列数均无意义！",
              },
            ]
          : []),
      ],
      mnemonic:
        "区分顺序列阵排，消去顺序组合算；捆绑相邻做整体，插空留隙解间隔。",
    };
  }

  // 3. 分类加法与分步乘法原理
  const multTotal = m1 * m2 * (m3 > 0 ? m3 : 1);
  const addTotal = m1 + m2;

  return {
    quantities: [
      {
        label: "步骤/类别 1 方法数 m1",
        symbol: "m_1",
        value: m1,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "步骤/类别 2 方法数 m2",
        symbol: "m_2",
        value: m2,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "步骤 3 方法数 m3",
        symbol: "m_3",
        value: m3,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "分步乘法原理总数 N_乘",
        symbol: "N_\\text{乘}",
        value: multTotal,
        color: MATH_COLORS.function,
      },
      {
        label: "分类加法原理总数 N_加",
        symbol: "N_\\text{加}",
        value: addTotal,
        color: MATH_COLORS.derivative,
      },
    ],
    theorems: [
      {
        name: "分类加法计数原理",
        latex: `N = m_1 + m_2 + \\dots + m_k`,
        note: "完成一件事有 k 类办法，各类办法相互独立（互斥），用加法。",
        level: "core",
      },
      {
        name: "分步乘法计数原理",
        latex: `N = m_1 \\times m_2 \\times \\dots \\times m_k`,
        note: "完成一件事需要分 k 个步骤，各个步骤依次进行（相依），用乘法。",
        level: "core",
      },
    ],
    gaokaoPoints: [
      {
        text: "加法 vs 乘法的区分关键：看单一步骤/类别能否独立完成整件事（能用加法，不能用乘法）。",
        importance: "basic",
      },
    ],
    warnings: [],
    mnemonic:
      "分类独立用加法，一步到位各算各；分步相依用乘法，环环相扣才完成。",
  };
}
