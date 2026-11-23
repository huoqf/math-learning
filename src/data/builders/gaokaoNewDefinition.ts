import type { MathPanelData } from "../types";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  calcDivisibleSequence,
  calcFixedPointIter,
  calcManhattanGeom,
  type NewDefinitionStudyMode,
} from "@/math/gaokaoNewDefinition";
import { getNewDefinitionAnswerSteps } from "@/data/registries/gaokaoNewDefinition";

export function buildGaokaoNewDefinitionPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as NewDefinitionStudyMode) || "divisibleSeq";
  const stepTemplates = getNewDefinitionAnswerSteps(mode);

  if (mode === "divisibleSeq") {
    const res = calcDivisibleSequence(
      params.seqM ?? 1,
      params.dropI ?? 1,
      params.dropJ ?? 2,
    );
    const groupDisplay =
      res.isDivisible && res.groups.length > 0
        ? res.groups.map((g) => `(${g.join(",")})`).join(",\\; ")
        : "\\text{无可行划分}";

    return {
      examAnchor: "新高考 19 题创新压轴 · 2024新课标I卷可分数列",
      mnemonic: "先看特例摸规律，模4分类定奇偶，归纳构造证充分！",
      quantities: [
        {
          label: "全集项数",
          symbol: "4m+2",
          value: res.totalN,
          color: MATH_COLORS.function,
        },
        {
          label: "剔除数对",
          symbol: "(i, j)",
          value: `(${res.i}, ${res.j})`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "可分判定结果",
          symbol: "\\text{Result}",
          value:
            res.validity === "invalid_pair"
              ? "无效数对 (i ≥ j)"
              : res.isDivisible
                ? "可分数列 ✓"
                : "不可分 ✗",
          highlight: res.isDivisible ? "positive" : "negative",
          color: res.isDivisible
            ? MATH_COLORS.inequality
            : MATH_COLORS.degeneracy,
        },
        {
          label: "剩余等差组数",
          symbol: "m",
          value: res.isDivisible ? res.groups.length : 0,
          color: MATH_COLORS.paramPrimary,
        },
      ],
      theorems: [
        {
          name: "可分数列模 4 充分构造定理",
          latex:
            "i \\equiv 1 \\pmod 4, \\; j \\equiv 2 \\pmod 4 \\implies (4m+2, i, j)\\text{-可分}",
          condition:
            "适用前提：在全集 $\\{1,2,\\dots,4m+2\\}$ 中 $1 \\le i < j \\le 4m+2$，这是充分条件（$m=1$ 时恰好充要，$m \\ge 2$ 时还存在公差 $d \\ge 2$ 的其他可分情形）。",
          note: "当 $i=1, j=2$ 时剩余连续 $4m$ 项直接依次以公差 $1$ 切割为 $m$ 组；当 $i \\equiv 1, j \\equiv 2 \\pmod 4$ 时，首尾与中间各段长度均为 $4$ 的倍数从而各自按公差 $1$ 可分。",
          level: "important",
        },
      ],
      warnings:
        res.validity === "invalid_pair"
          ? [
              {
                text: "参数越界警示：题设要求严格递增数对 $1 \\le i < j \\le 4m+2$，当前 $i \\ge j$ 无效。",
                level: "danger",
              },
            ]
          : !res.isDivisible
            ? [
                {
                  text: `反例验证：当 $m=${res.m}$ 且剔除 $(${res.i}, ${res.j})$ 时，所有残余四元组组合均无法满足公差相等约束，判定为不可分。`,
                  level: "warning",
                },
              ]
            : [
                {
                  text: "压轴易错点：证明“可分”必须显式给出一般 $m$ 下的具体分组构造；证明“不可分”常结合总和奇偶性或最小元所在组公差矛盾排除。",
                  level: "info",
                },
              ],
      reasoningSteps: [
        {
          step: stepTemplates[0].step,
          title: stepTemplates[0].title,
          detail: `在全集 $\\{1, 2, \\dots, ${res.totalN}\\}$ 中剔除 $i=${res.i}, j=${res.j}$，需将剩余 ${res.totalN - 2} 项划分为 ${res.m} 个 4 项等差数列。`,
          latex: `|S \\setminus \\{${res.i}, ${res.j}\\}| = 4m = ${res.totalN - 2}`,
          rubric: "【高考采分点】正确翻译定义并写出剩余项规模（3分）",
        },
        {
          step: stepTemplates[1].step,
          title: stepTemplates[1].title,
          detail:
            "分析剔除位置对模 4 同余类的划分影响，检查是否存在无矛盾四元组配对。",
          latex: `${res.modSummary}`,
          rubric: "【高考采分点】分析模 4 同余必要性边界（5分）",
        },
        {
          step: stepTemplates[2].step,
          title: stepTemplates[2].title,
          detail: res.isDivisible
            ? "给出显式等差四元组划分并逐组验证公差为常数。"
            : "穷举验证不存在任何合法的等差四元组划分方案。",
          latex: groupDisplay,
          rubric: "【高考采分点】完整给出构造划分或反证完备性结论（7分）",
        },
      ],
      gaokaoPoints: [
        {
          text: "第 19 题“读懂新定义”的黄金破题链：用 $m=1, 2$ 写全枚举找直觉 $\\to$ 提取奇偶/模同余必要条件 $\\to$ 分段配对或数学归纳完成一般构造。",
          importance: "hard",
        },
      ],
    };
  }

  if (mode === "fixedPointIter") {
    const res = calcFixedPointIter(
      params.iterR ?? 2.6,
      params.iterX0 ?? 0.2,
      params.iterSteps ?? 7,
    );
    const lastPt = res.trajectory[res.trajectory.length - 1];
    const rStr = formatMathNumber(res.r, 2);
    const fpStr = formatMathNumber(res.fixedPoint, 4);
    const slopeStr = formatMathNumber(res.derivativeAtFixed, 3);

    return {
      examAnchor: "新高考 19 题创新压轴 · 函数迭代与不动点定理",
      mnemonic: "不动点联立 y=x，蛛网折叠看趋向，斜率绝对值小于一！",
      quantities: [
        {
          label: "正不动点坐标",
          symbol: "x^*",
          value: fpStr,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "不动点切线斜率",
          symbol: "f'(x^*)",
          value: slopeStr,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "当前轨道状态",
          symbol: "\\text{Status}",
          value:
            res.stability === "attracting"
              ? "稳定吸引收敛"
              : res.stability === "neutral"
                ? "分岔临界态"
                : "排斥 / 周期震荡",
          highlight: res.stability === "attracting" ? "positive" : "negative",
          color:
            res.stability === "attracting"
              ? MATH_COLORS.inequality
              : MATH_COLORS.degeneracy,
        },
        {
          label: `末项数值 (n=${res.steps})`,
          symbol: `x_{${res.steps}}`,
          value: lastPt ? formatMathNumber(lastPt.fx, 4) : "—",
          color: MATH_COLORS.function,
        },
      ],
      theorems: [
        {
          name: "函数迭代不动点收敛判别准则",
          latex:
            "f(x^*) = x^*, \\quad |f'(x^*)| < 1 \\implies x_n \\text{ 局部收敛于 } x^*",
          condition:
            "适用前提：迭代函数 $f(x)$ 在不动点 $x^*$ 邻域内连续可导且满足局部压缩条件 $|x_{n+1} - x^*| \\le q|x_n - x^*|\\ (0<q<1)$。",
          note: "在高考大题中一般通过放缩构造 $|x_{n+1} - x^*| \\le c |x_n - x^*|$（$0 < c < 1$）转化为等比放缩链，无需直接引用高等数学压缩映射原理名称。",
          level: "core",
        },
      ],
      warnings: [
        {
          text: "作答规范提示：高中证明迭代数列收敛时，应利用作差 $|x_{n+1}-x^*|$ 或切线斜率上界放缩为公比小于 $1$ 的等比数列。",
          level: "info",
        },
      ],
      reasoningSteps: [
        {
          step: stepTemplates[0].step,
          title: stepTemplates[0].title,
          detail: `令 $f(x) = ${rStr}x(1-x) = x$，解出非零不动点 $x^* = 1 - \\frac{1}{r}$。`,
          latex: `x^* = 1 - \\frac{1}{${rStr}} = ${fpStr}`,
          rubric: "【高考采分点】正确求得迭代函数的不动点方程根（4分）",
        },
        {
          step: stepTemplates[1].step,
          title: stepTemplates[1].title,
          detail: `由初值 $x_0 = ${formatMathNumber(res.x0, 2)}$ 沿 $y=f(x)$ 与 $y=x$ 交替投影，生成前 ${res.steps} 步轨道。`,
          latex: `x_1 = ${formatMathNumber(res.trajectory[0]?.fx ?? 0, 4)} \\to \\dots \\to x_{${res.steps}} = ${formatMathNumber(lastPt?.fx ?? 0, 4)}`,
          rubric:
            "【高考采分点】给出递推轨迹前几项并构造差值 $|x_{n+1}-x^*|$（5分）",
        },
        {
          step: stepTemplates[2].step,
          title: stepTemplates[2].title,
          detail: `考察斜率 $f'(x^*) = ${slopeStr}$，当 $|f'(x^*)| < 1$ 时呈等比压缩收敛；当 $r > 3$ 时分岔产生二周期轨道。`,
          latex: `|f'(x^*)| = |${slopeStr}| ${Math.abs(res.derivativeAtFixed) < 1 ? "< 1" : "\\ge 1"}`,
          rubric: "【高考采分点】完成放缩不等式与收敛/分岔结论论证（6分）",
        },
      ],
      gaokaoPoints: [
        {
          text: "二次迭代数列若产生单侧逼近（$f'(x^*) > 0$），蛛网呈台阶状单调收敛；若 $f'(x^*) < 0$，则围绕 $x^*$ 左右振荡螺旋收敛。",
          importance: "hard",
        },
      ],
    };
  }

  // manhattanGeom 模式
  const res = calcManhattanGeom(
    0,
    0,
    params.manRadius ?? 2.0,
    params.manC ?? 2.0,
  );
  const rStr = formatMathNumber(res.radius, 2);
  return {
    examAnchor: "新高考 19 题创新压轴 · 曼哈顿距离 (L1 度量) 几何新定义",
    mnemonic: "曼哈顿距折线走，同距菱形面积2R²，中垂斜段接水平！",
    quantities: [
      {
        label: "曼哈顿菱形面积",
        symbol: "S_{M}",
        value: formatMathNumber(res.manhattanArea, 2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "同半径欧氏圆面积",
        symbol: "S_{E}",
        value: formatMathNumber(res.euclideanArea, 2),
        color: MATH_COLORS.function,
      },
      {
        label: "曼哈顿周长（欧氏度量下）",
        symbol: "L_{M}",
        value: formatMathNumber(res.manhattanPerimeter, 2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "曼哈顿等距圆周长(L1下)",
        symbol: "C_{L_1}",
        value: formatMathNumber(8 * res.radius, 2),
        isInvariant: true,
        invariantNote:
          "若边长按 L1 度量本身计量，任意“半径 R”菱形周长恒为 $8R$，广义圆周率恰为 $4$！",
        color: MATH_COLORS.inequality,
      },
    ],
    theorems: [
      {
        name: "曼哈顿距离圆（L1 菱形）性质定理",
        latex:
          "d_M(P, O) = |x| + |y| = R \\implies S = 2R^2, \\quad L_{\\text{欧}} = 4\\sqrt{2}R",
        condition:
          "适用前提：在平面直角坐标系中定义广义距离 $d_M((x_1,y_1),(x_2,y_2)) = |x_1-x_2|+|y_1-y_2|$。",
        note: "按四象限符号去掉绝对值即得四条斜率为 $\\pm 1$ 的线段，围成对角线长为 $2R$ 的正方形（菱形外观）。",
        level: "core",
      },
    ],
    warnings: [
      {
        text: "度量空间辨析：在 L1 距离下，两点等距集（广义中垂线）不再总是单一无限直线，当两点连线不呈 $45^\\circ$ 或水平/垂直时，可能出现由倾斜段与垂直/水平射线拼接的三段式折线。",
        level: "warning",
      },
    ],
    reasoningSteps: [
      {
        step: stepTemplates[0].step,
        title: stepTemplates[0].title,
        detail: `设动点 $P(x,y)$ 满足 $|x| + |y| = ${rStr}$，按正负符号分四个象限拆去绝对值。`,
        latex: `\\pm x \\pm y = ${rStr}`,
        rubric: "【高考采分点】正确给出四象限分类讨论去掉绝对值（4分）",
      },
      {
        step: stepTemplates[1].step,
        title: stepTemplates[1].title,
        detail: `四条线段围成边长为 $\\sqrt{2}R$ 的正方形，对比同半径欧氏圆 $x^2+y^2=${rStr}^2$ 计算面积与周长。`,
        latex: `S_M = 2R^2 = ${formatMathNumber(res.manhattanArea, 2)}, \\quad S_E = \\pi R^2 = ${formatMathNumber(res.euclideanArea, 2)}`,
        rubric: "【高考采分点】正确求得广义圆的顶点坐标及面积（5分）",
      },
      {
        step: stepTemplates[2].step,
        title: stepTemplates[2].title,
        detail:
          "求解到对称定点 $A(-c, -k), B(c, k)$ 曼哈顿距离相等的点集，得到中间斜段接两端竖直/水平射线的折线轨迹。",
        latex: "|x+c|+|y+k| = |x-c|+|y-k|",
        rubric: "【高考采分点】利用零点分段讨论得出折线形中垂线方程（6分）",
      },
    ],
    gaokaoPoints: [
      {
        text: "广义距离新定义通常围绕“三角不等式验证（非负性、对称性、三角不等式）”、“单位圆形状与包络”和“定点最短折线路径”三类设问。",
        importance: "hard",
      },
    ],
  };
}
