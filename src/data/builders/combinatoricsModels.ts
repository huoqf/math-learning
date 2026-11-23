import type { MathPanelData } from "../types";
import { MATH_COLORS } from "@/theme";
import {
  calcBundleModel,
  calcGapModel,
  calcGroupingModel,
  calcStarsBarsModel,
  type CombinatoricsModelMode,
} from "@/math/combinatoricsModels";
import { GROUPING_PRESET_SIZES } from "@/data/registries/combinatoricsModels";

export function buildCombinatoricsModelsPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as CombinatoricsModelMode) || "bundle";
  const allowZero = Boolean(config?.allowZero);
  const distinctTargets = Boolean(config?.distinctTargets);
  const groupingPreset = (config?.groupingPreset as string) || "equal3";

  if (mode === "bundle") {
    const res = calcBundleModel(params.n ?? 5, params.k ?? 2);
    return {
      examAnchor: "选择性必修三第 6 章 · 排列组合相邻捆绑法",
      mnemonic: "相邻先把内部捆，视作整体再全排，内外相乘莫遗漏！",
      quantities: [
        {
          label: "元素总数",
          symbol: "n",
          value: res.n,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "捆绑元素数",
          symbol: "k",
          value: res.k,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "捆绑后整体个数",
          symbol: "n - k + 1",
          value: res.superCount,
          color: MATH_COLORS.function,
        },
        {
          label: "内部全排列",
          symbol: `A_{${res.k}}^{${res.k}}`,
          value: res.innerPerms,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "外部大元素全排",
          symbol: `A_{${res.superCount}}^{${res.superCount}}`,
          value: res.outerPerms,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "合法排列总数",
          symbol: "N_{\\text{总}}",
          value: res.total,
          highlight: "positive",
          color: MATH_COLORS.inequality,
        },
      ],
      theorems: [
        {
          name: "相邻元素捆绑法乘法原理",
          latex: "N = A_k^k \\cdot A_{n-k+1}^{n-k+1}",
          condition:
            "适用前提：$k$ 个指定元素必须连续相邻且无附加顺序冻结（$1 \\le k \\le n$）。",
          note: "先把 $k$ 个相邻元素内部全排列得到 $A_k^k$ 种内部构造，再把捆绑体看作 $1$ 个新整体与其余 $n-k$ 个元素共计 $n-k+1$ 个单位作外部全排列。",
          level: "core",
        },
      ],
      warnings:
        res.validity === "clamped"
          ? [
              {
                text: "注意约束条件 $1 \\le k \\le n$：当前已将 $k$ 自动限制在总元素数 $n$ 以内。",
                level: "warning",
              },
            ]
          : [
              {
                text: "高频易错：切忌只算外部排列 $A_{n-k+1}^{n-k+1}$ 而漏乘内部小排列 $A_k^k$（除非捆绑体内部元素完全相同或次序已定）。",
                level: "info",
              },
            ],
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 内部捆绑成单",
          detail:
            "将要求相邻的 $k$ 个元素捆为一个超级整体，先解决内部相对次序。",
          latex: `N_{\\text{内}} = A_{k}^{k} = A_{${res.k}}^{${res.k}} = ${res.innerPerms}`,
        },
        {
          step: 2,
          title: "建模联立 · 外部大元素全排",
          detail: "捆绑整体与其余 $n-k$ 个自由元素共构成 $n-k+1$ 个排列单位。",
          latex: `N_{\\text{外}} = A_{n-k+1}^{n-k+1} = A_{${res.superCount}}^{${res.superCount}} = ${res.outerPerms}`,
        },
        {
          step: 3,
          title: "求解反思 · 分步乘法汇总",
          detail: "依据分步乘法计数原理，由内部排列乘外部排列得总方案数。",
          latex: `N_{\\text{总}} = A_{${res.k}}^{${res.k}} \\cdot A_{${res.superCount}}^{${res.superCount}} = ${res.innerPerms} \\times ${res.outerPerms} = ${res.total}`,
        },
      ],
      gaokaoPoints: [
        {
          text: "若题干附加“甲在乙左侧”的定序约束，内部捆绑排列数须由 $A_k^k$ 缩减为消序后的结果（如两人定序仅 $1$ 种）。",
          importance: "gaokao",
        },
      ],
    };
  }

  if (mode === "gap") {
    const res = calcGapModel(params.m ?? 4, params.k ?? 2);
    return {
      examAnchor: "选择性必修三第 6 章 · 不相邻插空法",
      mnemonic: "先排其余造空档，两端之中共 m+1，选位排入互不邻！",
      quantities: [
        {
          label: "底座元素数",
          symbol: "m",
          value: res.m,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "可用空位数",
          symbol: "m + 1",
          value: res.slots,
          color: MATH_COLORS.function,
        },
        {
          label: "待插元素数",
          symbol: "k",
          value: res.k,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "底座全排列",
          symbol: `A_{${res.m}}^{${res.m}}`,
          value: res.basePerms,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "插空排列数",
          symbol: res.validity === "ok" ? `A_{${res.slots}}^{${res.k}}` : "0",
          value: res.insertPerms,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "合法排法总数",
          symbol: "N_{\\text{总}}",
          value: res.total,
          highlight: res.validity === "ok" ? "positive" : "negative",
          color:
            res.validity === "ok"
              ? MATH_COLORS.inequality
              : MATH_COLORS.degeneracy,
        },
      ],
      theorems: [
        {
          name: "不相邻元素插空法公式",
          latex: "N = A_m^m \\cdot A_{m+1}^k",
          condition:
            "适用前提：$m$ 个底座元素排定后两端与间隔共产生 $m+1$ 个空位，且 $1 \\le k \\le m+1$。",
          note: "每个空位至多放 $1$ 个元素，从而以位置隔离保证 $k$ 个插空元素任意两者绝不相邻。",
          level: "core",
        },
      ],
      warnings:
        res.validity === "impossible"
          ? [
              {
                text: `空位不足警告：当前 $m=${res.m}$ 仅提供 $m+1=${res.slots}$ 个空位，无法容纳 $k=${res.k}$ 个互不相邻元素（方案数为 $0$）。`,
                level: "danger",
              },
            ]
          : [
              {
                text: "高频误区：不可直接用总数减相邻数！“三个元素互不相邻”不等于总数减去“三者捆绑”，必须先排无约束元素再插空。",
                level: "warning",
              },
            ],
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 优先排列无限制元素",
          detail: "先将无不相邻约束的 $m$ 个底座元素进行全排列。",
          latex: `N_{\\text{底}} = A_m^m = A_{${res.m}}^{${res.m}} = ${res.basePerms}`,
        },
        {
          step: 2,
          title: "建模联立 · 统计间隙与两端空位",
          detail:
            "$m$ 个元素之间产生 $m-1$ 个内部空隙，加上首尾两端共有 $m+1$ 个互异空位供选择。",
          latex:
            res.validity === "ok"
              ? `N_{\\text{插}} = A_{m+1}^{k} = A_{${res.slots}}^{${res.k}} = ${res.insertPerms}`
              : `k = ${res.k} > m + 1 = ${res.slots} \\implies N_{\\text{插}} = 0`,
        },
        {
          step: 3,
          title: "求解反思 · 分步相乘求总方案",
          detail: "两步相乘得到互不相邻排列总数。",
          latex: `N_{\\text{总}} = ${res.basePerms} \\times ${res.insertPerms} = ${res.total}`,
        },
      ],
      gaokaoPoints: [
        {
          text: "若是圆桌或环形排座，$m$ 个底座元素只形成 $m$ 个空位（首尾相连合并），而非 $m+1$ 个空位。",
          importance: "gaokao",
        },
      ],
    };
  }

  if (mode === "starsBars") {
    const res = calcStarsBarsModel(params.n ?? 5, params.r ?? 3, allowZero);
    const barCount = res.barsCount;
    return {
      examAnchor: "选择性必修三第 6 章 · 相同元素分配隔板法",
      mnemonic: "元素相同盒不同，每盒至少一个时，n-1 空插 r-1 板！",
      quantities: [
        {
          label: "相同元素数",
          symbol: "n",
          value: res.n,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "不同接收组数",
          symbol: "r",
          value: res.r,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "转化后等效元素数",
          symbol: allowZero ? "n + r" : "n",
          value: res.effectiveN,
          color: MATH_COLORS.function,
        },
        {
          label: "所需隔板数",
          symbol: "r - 1",
          value: barCount,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "组合分配总数",
          symbol:
            res.validity === "ok"
              ? `C_{${res.effectiveN - 1}}^{${barCount}}`
              : "0",
          value: res.total,
          highlight: res.validity === "ok" ? "positive" : "negative",
          color:
            res.validity === "ok"
              ? MATH_COLORS.inequality
              : MATH_COLORS.degeneracy,
        },
      ],
      theorems: [
        {
          name: "隔板法同素非空分配定理",
          latex: allowZero ? "N = C_{n+r-1}^{r-1}" : "N = C_{n-1}^{r-1}",
          condition: allowZero
            ? "允许空组 ($x_i \\ge 0$)：先向每组借 $1$ 个同质元素化为 $y_i = x_i + 1 \\ge 1$，转化后共 $n+r$ 个元素。"
            : "每组至少 $1$ 个 ($x_i \\ge 1$)：元素完全相同、组别互异，且需满足 $n \\ge r$。",
          note: "在成排的相同元素内部的 $n-1$ 个间隙中选出 $r-1$ 个插入隔板，恰好把元素切成 $r$ 个非空段。",
          level: "core",
        },
      ],
      warnings:
        res.validity === "impossible"
          ? [
              {
                text: `非空分配不可行：当每组至少分 $1$ 个时，元素数 $n=${res.n}$ 不能小于组数 $r=${res.r}$。`,
                level: "danger",
              },
            ]
          : [
              {
                text: "本质辨析：隔板法仅适用于“元素完全相同、位置/盒子互异”；若元素互不相同，则应改用“分组分配”而非隔板法！",
                level: "warning",
              },
            ],
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 确认同素与下界转换",
          detail: allowZero
            ? "题目允许空组，令 $y_i = x_i + 1 \\ge 1$，等效总名额变为 $n + r$。"
            : "元素无差别且要求每组非空，直接对 $n$ 个元素内部的间隙插入隔板。",
          latex: allowZero
            ? `x_1 + \\dots + x_{${res.r}} = ${res.n} \\iff y_1 + \\dots + y_{${res.r}} = ${res.n} + ${res.r} = ${res.effectiveN}`
            : `x_1 + \\dots + x_{${res.r}} = ${res.n} \\quad (x_i \\ge 1)`,
        },
        {
          step: 2,
          title: "建模联立 · 计算内部间隙与板数",
          detail: "在等效元素的 $n'-1$ 个内部空档中选择 $r-1$ 处放板。",
          latex: `\\text{间隙数} = ${res.effectiveN} - 1 = ${res.effectiveN - 1}, \\quad \\text{隔板数} = ${res.r} - 1 = ${barCount}`,
        },
        {
          step: 3,
          title: "求解反思 · 组合公式算出方案",
          detail: "隔板同质无顺序，使用组合数得分配总方法数。",
          latex:
            res.validity === "ok"
              ? `N = C_{${res.effectiveN - 1}}^{${barCount}} = ${res.total}`
              : "N = 0",
        },
      ],
      gaokaoPoints: [
        {
          text: "若题目限定第 $1$ 组至少 $2$ 个（$x_1 \\ge 2$），只需先固定放入 $1$ 个到第 $1$ 组，把剩余 $n-1$ 个按每组至少 $1$ 个用隔板法即可。",
          importance: "gaokao",
        },
      ],
    };
  }

  // grouping 模式
  const sizes = GROUPING_PRESET_SIZES[groupingPreset] ?? [2, 2, 2];
  const res = calcGroupingModel(sizes, distinctTargets);
  const sizeDesc = res.sizes.join("-");
  const combChainLatex = (() => {
    let rem = res.totalElements;
    const parts: string[] = [];
    for (const s of res.sizes) {
      parts.push(`C_{${rem}}^{${s}}`);
      rem -= s;
    }
    return parts.join(" \\cdot ");
  })();
  const elimDenominatorLatex =
    res.sizeMultiplicities
      .filter((m) => m.count > 1)
      .map((m) => `A_{${m.count}}^{${m.count}}`)
      .join(" \\cdot ") || "1";

  return {
    examAnchor: "选择性必修三第 6 章 · 异素分组与定向分配（重难点）",
    mnemonic: "先分堆来后分配，几堆同大除阶乘，局部均分只除同！",
    quantities: [
      {
        label: "分组规模结构",
        symbol: "S",
        value: sizeDesc,
        color: MATH_COLORS.function,
      },
      {
        label: "连乘组合积",
        symbol: "\\prod C",
        value: res.rawCombinationProduct,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "均分重复消序因子",
        symbol: "D_{\\text{重}}",
        value: res.duplicateFactor,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "无序分堆总数",
        symbol: "N_{\\text{堆}}",
        value: res.unorderedGroups,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: distinctTargets ? "定向分配总数" : "最终结果（不定向分堆）",
        symbol: "N_{\\text{总}}",
        value: res.total,
        highlight: "positive",
        color: MATH_COLORS.inequality,
      },
    ],
    theorems: [
      {
        name: "异素分组消序与分配公式",
        latex: distinctTargets
          ? `N = \\frac{${combChainLatex}}{${elimDenominatorLatex}} \\cdot A_{${res.groupCount}}^{${res.groupCount}}`
          : `N = \\frac{${combChainLatex}}{${elimDenominatorLatex}}`,
        condition:
          "适用前提：待分元素互不相同，规模为相同人数的有 $c$ 组则必须在连乘后除以 $A_c^c$ 消除组间默认先后序。",
        note: "分步依次取组合隐含了“第一堆、第二堆”的抽签顺序，因此任何规模相同的两堆都会产生对称重复。",
        level: "core",
      },
    ],
    warnings: [
      {
        text: "头号高频陷阱：把 $6$ 人按 $2,2,2$ 分给 $3$ 个不同社区，既不能漏除 $A_3^3$（先分堆），也不能忘了最后再乘 $A_3^3$（再定向分配）；若是 $2,2,1$ 局部均分，只除以 $A_2^2$ 而非 $A_3^3$！",
        level: "danger",
      },
    ],
    reasoningSteps: [
      {
        step: 1,
        title: "审题定法 · 分步选取各组规模",
        detail: `依次从剩余元素中抽取规模为 ${sizeDesc} 的小组，得到带隐藏抽取次序的乘积。`,
        latex: `N_{\\text{粗}} = ${combChainLatex} = ${res.rawCombinationProduct}`,
      },
      {
        step: 2,
        title: "建模联立 · 均分结构消除冗余",
        detail:
          res.duplicateFactor > 1
            ? `由于存在相同规模组别，消除重复排列因子 $${elimDenominatorLatex} = ${res.duplicateFactor}$ 得无序分堆数。`
            : "各组规模互不相同，抽取顺序不会产生对称重复，无需消序。",
        latex: `N_{\\text{堆}} = \\frac{${res.rawCombinationProduct}}{${res.duplicateFactor}} = ${res.unorderedGroups}`,
      },
      {
        step: 3,
        title: "求解反思 · 判定是否定向分配",
        detail: distinctTargets
          ? `分派给 $${res.groupCount}$ 个不同目标对象，再乘以排列数 $A_{${res.groupCount}}^{${res.groupCount}}$。`
          : "题干仅要求分成无区别的若干堆，直接保留无序分堆数。",
        latex: distinctTargets
          ? `N_{\\text{总}} = ${res.unorderedGroups} \\times A_{${res.groupCount}}^{${res.groupCount}} = ${res.total}`
          : `N_{\\text{总}} = ${res.unorderedGroups}`,
      },
    ],
    gaokaoPoints: [
      {
        text: "若直接把 $n$ 个不同元素放入 $r$ 个不同盒子且允许空盒，每个元素有 $r$ 种独立去向，总数为 $r^n$，可与“先分组再分配”互相校验。",
        importance: "gaokao",
      },
    ],
  };
}
