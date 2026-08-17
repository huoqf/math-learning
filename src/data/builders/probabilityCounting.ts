import type { MathPanelData } from "../types";
import {
  comb,
  perm,
  factorial,
  getBinomialTerm,
  evaluateAssignments,
  calculateGroupingAllocation,
} from "../../math/probabilityCounting";
import { MATH_COLORS } from "../../theme";

export function buildProbabilityCountingPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.activeMode as string) || "binomial";
  const subMode = Number(config?.subMode ?? 0);

  const n = Math.floor(params.n ?? 5);
  const k = Math.min(Math.floor(params.k ?? 2), n);
  const a = params.a ?? 1;
  const b = params.b ?? 1;
  const m1 = Math.floor(params.m1 ?? 3);
  const m2 = Math.floor(params.m2 ?? 2);
  const m3 = Math.floor(params.m3 ?? 2);
  const gridM = Math.floor(params.gridM ?? 4);
  const gridN = Math.floor(params.gridN ?? 3);
  const groupTotal = Math.floor(params.groupTotal ?? 6);
  const groupCount = Math.floor(params.groupCount ?? 3);
  const assignmentType = Math.floor(params.assignmentType ?? 0);

  // 1. 二项式定理模式
  if (mode === "binomial") {
    const termInfo = getBinomialTerm(n, k, a, b);
    const assignments = evaluateAssignments(n, a, b);
    const assignKeys = [
      "sum_all",
      "sum_alt",
      "sum_even",
      "sum_odd",
      "derivative",
      "constant",
    ];
    const curAssignKey = assignKeys[assignmentType] || "sum_all";
    const curAssign = assignments[curAssignKey] || assignments.sum_all;

    const binomCoeffSum = Math.pow(2, n);

    if (subMode === 1) {
      // 赋值法沙盘模式
      return {
        quantities: [
          {
            label: "二项式指数 n",
            symbol: "n",
            value: n,
            color: MATH_COLORS.paramPrimary,
          },
          {
            label: "当前赋值方案",
            symbol: "Type",
            value: curAssign.name,
            color: MATH_COLORS.paramSecondary,
          },
          {
            label: "赋值计算结果",
            symbol: "Value",
            value: Number.isInteger(curAssign.evaluatedValue)
              ? curAssign.evaluatedValue
              : curAssign.evaluatedValue.toFixed(2),
            color: MATH_COLORS.functionTransformed,
          },
          {
            label: "全部二项式系数和 2^n",
            symbol: `2^{${n}}`,
            value: binomCoeffSum,
            color: MATH_COLORS.paramTertiary,
          },
        ],
        theorems: [
          {
            name: "赋值法求系数和原理",
            latex: `f(x) = (ax + b)^n = a_n x^n + a_{n-1} x^{n-1} + \\dots + a_0`,
            condition: "$x \\in \\mathbb{R}$",
            note: "展开式为恒等式，对任意自变量 $x$ 取值均恒成立。",
            level: "core",
          },
          {
            name: "特殊赋值：全部系数和",
            latex: `x = 1 \\implies \\sum_{i=0}^n a_i = (a + b)^n`,
            condition: "$x = 1$",
            note: "各项展开项系数之和代入 $x=1$ 即得。",
            level: "core",
          },
          {
            name: "特殊赋值：正负交错和",
            latex: `x = -1 \\implies \\sum_{i=0}^n (-1)^i a_i = (-a + b)^n`,
            condition: "$x = -1$",
            note: "奇偶项交替抵消，加减半即可求奇数项和与偶数项和。",
            level: "important",
          },
          {
            name: "导数赋值法求带权和",
            latex: `\\sum_{k=1}^n k a_k = f'(1) = n a (a+b)^{n-1}`,
            condition: "$x = 1$",
            note: "两边对 $x$ 求导后再赋 $x=1$，可求得带项数下标权重的系数和。",
            level: "derived",
          },
        ],
        gaokaoPoints: [
          {
            text: "多项式赋值法口诀：求全部系数和令 $x=1$，求常数项令 $x=0$，求正负交错和令 $x=-1$。",
            importance: "gaokao",
          },
          {
            text: "三项式变式求解：如 $(1-x+2x^2)^5$ 求各项系数和，同样直接令 $x=1$ 得 $(1-1+2)^5 = 32$。",
            importance: "core",
          },
        ],
        warnings: [
          ...(a === 0
            ? [
                {
                  level: "warning" as const,
                  text: "退化提醒：当 $a = 0$ 时多项式退化为常数单项式 $b^n$。",
                },
              ]
            : []),
        ],
        mnemonic:
          "恒等赋值看需求，求和代一常数零；奇偶加减除以二，导数降幂带权求。",
      };
    }

    if (subMode === 2) {
      // 双轨对比模式
      return {
        quantities: [
          {
            label: "二项式指数 n",
            symbol: "n",
            value: n,
            color: MATH_COLORS.paramPrimary,
          },
          {
            label: "当前选中项序号",
            symbol: "k",
            value: `第 ${k + 1} 项 ($T_{${k + 1}}$)`,
            color: MATH_COLORS.paramSecondary,
          },
          {
            label: "二项式系数 C_n^k (恒正对称)",
            symbol: `C_{${n}}^{${k}}`,
            value: termInfo.binomialCoeff,
            color: MATH_COLORS.paramPrimary,
          },
          {
            label: `展开项实际系数 ($x^{${termInfo.powerA}}$ 前系数)`,
            symbol: `A_{${k}}`,
            value: termInfo.termCoeff,
            color: MATH_COLORS.functionTransformed,
          },
          {
            label: "各项系数和 (x=1)",
            symbol: `(${a}+${b})^{${n}}`,
            value: Math.pow(a + b, n),
            color: MATH_COLORS.derivative,
          },
        ],
        theorems: [
          {
            name: "二项式系数与项的系数辨析",
            latex: `T_{k+1} = \\underbrace{C_n^k}_{\\text{二项式系数}} \\cdot \\underbrace{a^{n-k}b^k}_{\\text{参数贡献}} \\cdot x^{n-k} = \\underbrace{A_k}_{\\text{项的系数}} x^{n-k}`,
            condition: "$0 \\le k \\le n$",
            note: "二项式系数仅由组合数 $C_n^k$ 决定且恒正；项的系数由参数 $a, b$ 调控正负与量级。",
            level: "core",
          },
          {
            name: "二项式系数单峰对称性",
            latex: `C_n^k = C_n^{n-k}, \\quad C_n^0 < C_n^1 < \\dots < C_n^{\\lfloor n/2 \\rfloor}`,
            note: "中间项二项式系数最大，向两端逐渐递减并严格对称。",
            level: "important",
          },
        ],
        gaokaoPoints: [
          {
            text: "审题核心陷阱：“求二项式系数最大项”只需找中间项；“求项的系数最大项”需解不等式组 $A_k \\ge A_{k-1}$ 且 $A_k \\ge A_{k+1}$。",
            importance: "gaokao",
          },
        ],
        warnings: [
          ...(b < 0
            ? [
                {
                  level: "info" as const,
                  text: `符号提示：常数项 $b = ${b} < 0$，展开项系数正负交替！`,
                },
              ]
            : []),
        ],
        mnemonic:
          "二项系数恒为正，中间最大两边平；项之系数看正负，大小求导列不等。",
      };
    }

    // 默认杨辉三角模式 (subMode === 0)
    return {
      quantities: [
        {
          label: "二项式指数 n",
          symbol: "n",
          value: n,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "当前选中项序号",
          symbol: "k",
          value: `第 ${k + 1} 项 ($T_{${k + 1}}$)`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "二项式系数 C_n^k",
          symbol: `C_{${n}}^{${k}}`,
          value: termInfo.binomialCoeff,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: `展开项系数 ($x^{${termInfo.powerA}}$ 前系数)`,
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
          label: "展开式各项系数和 (x=1)",
          symbol: `(${a} + ${b})^{${n}}`,
          value: Math.pow(a + b, n),
          color: MATH_COLORS.derivative,
        },
      ],
      theorems: [
        {
          name: "二项式定理 (Binomial Theorem)",
          latex: `(a + b)^n = \\sum_{k=0}^n C_n^k a^{n-k} b^k`,
          condition: "$n \\in \\mathbb{N}^*$",
          note: `展开式共 $n + 1 = ${n + 1}$ 项，各项二项式系数对称分布。`,
          level: "core",
        },
        {
          name: "通项公式 (第 k+1 项)",
          latex: `T_{k+1} = C_n^k a^{n-k} b^k x^{n-k}`,
          condition: "$0 \\le k \\le n$",
          note: `当前高亮项 $T_{${k + 1}} = ${termInfo.latexTerm}$`,
          level: "important",
        },
        {
          name: "杨辉三角递推性质",
          latex: `C_n^k = C_{n-1}^{k-1} + C_{n-1}^k`,
          condition: "$1 \\le k \\le n-1$",
          note: "两肩相加等于正下方数值，对应组合选取分类讨论思想。",
          level: "derived",
        },
        {
          name: "曲棍球棒恒等式 (朱世杰恒等式)",
          latex: `\\sum_{i=r}^n C_i^r = C_{n+1}^{r+1}`,
          condition: "$n \\ge r \\ge 0$",
          note: "沿杨辉三角某斜列从顶点连续求和，等于下一行拐角处的组合数。",
          level: "derived",
        },
      ],
      gaokaoPoints: [
        {
          text: "概念辨析核心：二项式系数恒为正数 $C_n^k > 0$；展开项系数包含 $a^{n-k}b^k$（正负受参数符号调制）。",
          importance: "gaokao",
        },
        {
          text: "常数项与有理项求解：写出通项化简，令 $x$ 的指数等于 $0$ 解 $k$（求常数项）；令指数为整数解有理项。",
          importance: "hard",
        },
        {
          text: "最大二项式系数位置：当 $n$ 为偶数时，中间第 $n/2+1$ 项最大；当 $n$ 为奇数时，中间两项相等且最大。",
          importance: "core",
        },
      ],
      warnings: [
        ...(a === 0
          ? [
              {
                level: "warning" as const,
                text: "退化提醒：当 $a = 0$ 时，多项式退化为常数 $b^n$，含 $x$ 的项均为 $0$。",
              },
            ]
          : []),
        ...(b === 0
          ? [
              {
                level: "warning" as const,
                text: "退化提醒：当 $b = 0$ 时，多项式退化为单项式 $(ax)^n$。",
              },
            ]
          : []),
        ...(b < 0
          ? [
              {
                level: "info" as const,
                text: `符号提醒：常数项 $b = ${b} < 0$，展开式各项系数正负交替，切记带上 $(-1)^k$！`,
              },
            ]
          : []),
      ],
      mnemonic:
        "二项展开共 $n+1$ 项，通项看准 $k$ 加 $1$；二项系数对称大，赋值求和特殊 $x$。",
    };
  }

  // 2. 排列与组合模式
  if (mode === "perm_comb") {
    if (subMode === 1) {
      // 均匀分组与分配消序模式
      const groupInfo = calculateGroupingAllocation(groupTotal, groupCount);
      return {
        quantities: [
          {
            label: "总元素数 N",
            symbol: "N",
            value: groupInfo.totalItems,
            color: MATH_COLORS.paramPrimary,
          },
          {
            label: "均分组数 k",
            symbol: "k",
            value: groupInfo.groupCount,
            color: MATH_COLORS.paramSecondary,
          },
          {
            label: "每组元素数",
            symbol: "m",
            value: groupInfo.itemsPerGroup,
            color: MATH_COLORS.paramTertiary,
          },
          {
            label: "逐步组合总数 (含虚假顺序)",
            symbol: "\\prod C",
            value: groupInfo.directCombinationWays,
            color: MATH_COLORS.function,
          },
          {
            label: "均匀分组总数 (除以 k! 消序)",
            symbol: "\\frac{\\prod C}{k!}",
            value: groupInfo.groupedWays,
            color: MATH_COLORS.derivative,
          },
        ],
        theorems: [
          {
            name: "均匀分组消序定理",
            latex: `N_{\\text{均分}} = \\frac{C_N^m C_{N-m}^m \\cdots C_m^m}{k!}`,
            condition: "$N = k \\times m$",
            note: "若有 $k$ 组元素个数相同且无组名标签，由于各堆无序，必须除以 $k!$ 消去人为先后顺序。",
            level: "core",
          },
          {
            name: "分组后再分配模型",
            latex: `N_{\\text{分配}} = N_{\\text{均分}} \\times A_k^k = \\frac{\\prod C}{k!} \\times k! = \\prod C`,
            condition: "$N = k \\times m$",
            note: "若将均分后的 $k$ 堆再分配给 $k$ 个不同对象，需乘回 $A_k^k = k!$，等价于逐步选定分配。",
            level: "important",
          },
        ],
        gaokaoPoints: [
          {
            text: "分组分配三大考向：① 全均分除以 $k!$；② 部分均分（如两堆相同）除以 $2!$；③ 均分后再定向分配乘回 $k!$。",
            importance: "gaokao",
          },
          {
            text: "消序思想本质：当无名堆被逐步选取时实质产生了先后顺序，除以全排列数 $k!$ 即可还原无序状态。",
            importance: "core",
          },
        ],
        warnings: [],
        mnemonic:
          "均分无名除阶乘，消去先后重复算；分配有名乘阶乘，各就各位排座次。",
      };
    }

    if (subMode === 2) {
      // 捆绑法与插空法模型
      const nTotal = n;
      const bindCount = 2; // 相邻 2 人
      const bindWays = factorial(nTotal - bindCount + 1) * factorial(bindCount);
      const insertWays =
        factorial(nTotal - bindCount) * perm(nTotal - bindCount + 1, bindCount);

      return {
        quantities: [
          {
            label: "总排队元素数 n",
            symbol: "n",
            value: nTotal,
            color: MATH_COLORS.paramPrimary,
          },
          {
            label: "捆绑相邻元素数",
            symbol: "m",
            value: bindCount,
            color: MATH_COLORS.paramSecondary,
          },
          {
            label: "捆绑相邻总走法 N_捆绑",
            symbol: "N_\\text{捆绑}",
            value: bindWays,
            color: MATH_COLORS.functionTransformed,
          },
          {
            label: "插空不相邻总走法 N_插空",
            symbol: "N_\\text{插空}",
            value: insertWays,
            color: MATH_COLORS.derivative,
          },
        ],
        theorems: [
          {
            name: "相邻问题捆绑法原理",
            latex: `N_{\\text{捆绑}} = A_{n-m+1}^{n-m+1} \\times A_m^m`,
            condition: "$n \\ge m \\ge 2$",
            note: "将要求相邻的 $m$ 个元素视作 1 个整体与其余元素全排，内部再全排列。",
            level: "core",
          },
          {
            name: "不相邻问题插空法原理",
            latex: `N_{\\text{插空}} = A_{n-m}^{n-m} \\times A_{n-m+1}^m`,
            condition: "$n - m + 1 \\ge m$",
            note: "先排无限制的 $n-m$ 个元素形成空档，再将限制元素插入空隙中。",
            level: "core",
          },
        ],
        gaokaoPoints: [
          {
            text: "排队经典双雄：相邻必“先捆后排”；不相邻必“先排后插”。",
            importance: "gaokao",
          },
          {
            text: "复杂限制条件：若既有相邻又有不相邻，先捆绑相邻元素为大元素，再与其他元素一起插空。",
            importance: "hard",
          },
        ],
        warnings: [
          ...(nTotal < 4
            ? [
                {
                  level: "info" as const,
                  text: "提示：元素数 $n \\ge 4$ 时更利于观察插空空档分布。",
                },
              ]
            : []),
        ],
        mnemonic:
          "捆绑相邻做整体，内部全排莫忘记；插空留隙后选位，先排无约后插空。",
      };
    }

    // 默认排列组合对比模式 (subMode === 0)
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
          condition: "$0 \\le m \\le n$",
          note: "从 $n$ 个不同元素中取出 $m$ 个排成一列，关注先后顺序。",
          level: "core",
        },
        {
          name: "组合数公式 (Combinations)",
          latex: `C_n^m = \\frac{A_n^m}{m!} = \\frac{n!}{m!(n-m)!}`,
          condition: "$0 \\le m \\le n$",
          note: "从 $n$ 个不同元素中取出 $m$ 个合成一组，无关先后顺序。",
          level: "core",
        },
        {
          name: "组合数补集对称性",
          latex: `C_n^m = C_n^{n-m}`,
          condition: "$0 \\le m \\le n$",
          note: `选出 $${k}$ 个元素等价于留下 $${n - k}$ 个未选元素。`,
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "“顺序”判定黄金法则：交换选出的任意两个元素，若事件结果改变则是排列，不变则是组合。",
          importance: "gaokao",
        },
        {
          text: "相邻问题捆绑法：要求相邻的元素视作一个整体参与排列，内部再全排列（先捆后排）。",
          importance: "core",
        },
        {
          text: "不相邻问题插空法：先排无限制元素形成空档，再将限制元素插入已形成的空隙中（先排后插）。",
          importance: "hard",
        },
      ],
      warnings: [
        ...(k > n
          ? [
              {
                level: "danger" as const,
                text: "非法参数：选取元素数 $m$ 不能大于总元素数 $n$，组合数与排列数均无意义！",
              },
            ]
          : []),
      ],
      mnemonic:
        "区分顺序列阵排，消去顺序组合算；捆绑相邻做整体，插空留隙解间隔。",
    };
  }

  // 3. 计数原理模式
  if (subMode === 2) {
    // 网格路径与标数法模式
    const totalSteps = gridM + gridN;
    const totalWays = comb(totalSteps, gridM);

    return {
      quantities: [
        {
          label: "横向步数 (向右)",
          symbol: "m",
          value: gridM,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "纵向步数 (向上)",
          symbol: "n",
          value: gridN,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "总步数 m + n",
          symbol: "m+n",
          value: totalSteps,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "最短路径总数 C_{m+n}^m",
          symbol: `C_{${totalSteps}}^{${gridM}}`,
          value: totalWays,
          color: MATH_COLORS.functionTransformed,
        },
      ],
      theorems: [
        {
          name: "网格最短路径计数定理",
          latex: `N = C_{m+n}^m = C_{m+n}^n = \\frac{(m+n)!}{m!n!}`,
          condition: "$m, n \\in \\mathbb{N}$",
          note: "从 $(0,0)$ 到 $(m,n)$ 共需走 $m+n$ 步，只需决定哪 $m$ 步向右即可。",
          level: "core",
        },
        {
          name: "加法原理与标数法递推",
          latex: `f(x, y) = f(x-1, y) + f(x, y-1)`,
          note: "任意格点走法等于其左侧格点与下方格点走法之和，与杨辉三角加法递推完全同构。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "标数法解决受限路径：遇障碍点、必过点或禁止转向时，在网格各交点处逐点相加标数最为高效。",
          importance: "gaokao",
        },
        {
          text: "组合模型等价转化：网格路径走法等价于二元序列组合，即从 $m+n$ 个位置中选 $m$ 个放向右指令。",
          importance: "core",
        },
      ],
      warnings: [],
      mnemonic:
        "网格漫步步步加，杨辉倒转映格花；总步选向定乾坤，遇障标数最无暇。",
    };
  }

  if (subMode === 1) {
    // 分类加法模式
    const addTotal = m1 + m2;
    return {
      quantities: [
        {
          label: "类别 1 方案数 m1",
          symbol: "m_1",
          value: m1,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "类别 2 方案数 m2",
          symbol: "m_2",
          value: m2,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "分类加法总方法数 N_加",
          symbol: "N_\\text{加}",
          value: addTotal,
          color: MATH_COLORS.derivative,
        },
      ],
      theorems: [
        {
          name: "分类加法计数原理 (加法原理)",
          latex: `N = m_1 + m_2 + \\dots + m_k`,
          note: "完成一件事有 $k$ 类不同方案，各类方案相互独立互斥，任意一类办法中的任一种方法都能独立完成这件事情。",
          level: "core",
        },
      ],
      gaokaoPoints: [
        {
          text: "分类原则“不重不漏”：各类办法之间必须互相排斥（不重复），且所有类别必须覆盖全部可能性（不遗漏）。",
          importance: "core",
        },
      ],
      warnings: [],
      mnemonic:
        "分类独立互排斥，一步到位各算各；不重不漏求总和，互斥方案用加法。",
    };
  }

  // 分步乘法模式 (subMode === 0)
  const multTotal = m1 * m2 * (m3 > 0 ? m3 : 1);
  return {
    quantities: [
      {
        label: "步骤 1 方法数 m1",
        symbol: "m_1",
        value: m1,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "步骤 2 方法数 m2",
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
        label: "分步乘法总方法数 N_乘",
        symbol: "N_\\text{乘}",
        value: multTotal,
        color: MATH_COLORS.function,
      },
    ],
    theorems: [
      {
        name: "分步乘法计数原理 (乘法原理)",
        latex: `N = m_1 \\times m_2 \\times \\dots \\times m_k`,
        note: "完成一件事需要分成 $k$ 个依次进行的步骤，缺少任何一步都不能完成该事件（步步相依）。",
        level: "core",
      },
    ],
    gaokaoPoints: [
      {
        text: "分步原则“步步相依”：各个步骤依次相继完成，连续乘积代表树状分支的指数扩张路径。",
        importance: "core",
      },
      {
        text: "加乘结合综合题：先分类（按主要特征划分方案），每一类内部再分步（逐步有序操作），即“先加后乘”。",
        importance: "gaokao",
      },
    ],
    warnings: [],
    mnemonic:
      "分步相依环环扣，缺一步骤事未成；树状展开连乘积，相依相随用乘法。",
  };
}
