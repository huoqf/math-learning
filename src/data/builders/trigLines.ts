import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import {
  calculateTrigLines,
  calculateComparisonAreas,
  solveTrigInequality,
  type TrigInequalityKind,
} from "@/features/trigLines/math/trigLines";
import { MATH_COLORS } from "@/theme";

export function buildTrigLinesPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) || "lines";
  const alphaDeg = params.alphaDeg ?? 45;
  const compAlphaDeg = params.compAlphaDeg ?? 40;
  const ineqThreshold = params.ineqThreshold ?? 0.5;
  const ineqKind = (config?.ineqKind as TrigInequalityKind) || "sin_gt";

  const trig = calculateTrigLines(alphaDeg);
  const radStr = `${(trig.alphaRad / Math.PI).toFixed(2)}\\pi`;
  const sinStr = trig.sinVal.toFixed(3);
  const cosStr = trig.cosVal.toFixed(3);
  const tanStr =
    trig.isTanDefined && trig.tanVal !== null
      ? trig.tanVal.toFixed(3)
      : "无意义";

  // 1. 模式：三角函数线定义模式 (lines)
  if (studyMode === "lines") {
    const quantities: MathQuantity[] = [
      {
        label: "动角 α",
        symbol: `\\alpha = ${alphaDeg}^\\circ`,
        value: `${alphaDeg}° (${radStr})`,
      },
      {
        label: "单位圆交点 P",
        symbol: "P(\\cos\\alpha, \\sin\\alpha)",
        value: `(${cosStr}, ${sinStr})`,
      },
      {
        label: "正弦线 MP (有向数量)",
        symbol: "MP = \\sin\\alpha",
        value: sinStr,
        color: MATH_COLORS.paramPrimary,
        highlight:
          trig.sinVal > 0 ? "positive" : trig.sinVal < 0 ? "negative" : "zero",
      },
      {
        label: "余弦线 OM (有向数量)",
        symbol: "OM = \\cos\\alpha",
        value: cosStr,
        color: MATH_COLORS.paramSecondary,
        highlight:
          trig.cosVal > 0 ? "positive" : trig.cosVal < 0 ? "negative" : "zero",
      },
      {
        label: "正切线 AT (有向数量)",
        symbol: "AT = \\tan\\alpha",
        value: tanStr,
        color: MATH_COLORS.paramTertiary,
        highlight: !trig.isTanDefined
          ? "extreme"
          : (trig.tanVal ?? 0) > 0
            ? "positive"
            : (trig.tanVal ?? 0) < 0
              ? "negative"
              : "zero",
      },
      {
        label: "勾股恒等式",
        symbol: "\\sin^2\\alpha + \\cos^2\\alpha",
        value: "1.000",
        color: MATH_COLORS.function,
      },
    ];

    const qMap: Record<string, string> = {
      1: "第一象限 (sin>0, cos>0, tan>0)",
      2: "第二象限 (sin>0, cos<0, tan<0)",
      3: "第三象限 (sin<0, cos<0, tan>0)",
      4: "第四象限 (sin<0, cos>0, tan<0)",
      "axis-x-pos": "x 轴正半轴 (0°, 360°)",
      "axis-x-neg": "x 轴负半轴 (180°)",
      "axis-y-pos": "y 轴正半轴 (90°)",
      "axis-y-neg": "y 轴负半轴 (270°)",
    };

    const quadrantText = qMap[String(trig.quadrant)] || "轴线上";

    const theorems: Theorem[] = [
      {
        name: "三角函数线的几何定义",
        latex:
          "\\overrightarrow{MP} = \\sin\\alpha, \\quad \\overrightarrow{OM} = \\cos\\alpha, \\quad \\overrightarrow{AT} = \\tan\\alpha",
        condition:
          "单位圆 r = 1，P(cosα, sinα)，M 为 P 在 x 轴投影，A(1,0) 为右侧切点",
        note: "有向线段的方向顺坐标轴方向为正，逆方向为负。",
        level: "core",
      },
      {
        name: "三角函数线退化性质",
        latex:
          "\\alpha = k\\pi \\implies MP=0, AT=0; \\quad \\alpha = k\\pi + \\frac{\\pi}{2} \\implies OM=0, AT \\text{ 不存在}",
        condition: "当终边落在坐标轴上时",
        note: "正切线在终边与切线 x=1 平行时无定义。",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "考点1：利用三角函数线判断符号（一全正、二正弦、三正切、四余弦）",
        importance: "gaokao",
      },
      {
        text: "考点2：有向线段的起点与终点顺序（如 MP 从 x 轴出发，AT 从 A(1,0) 出发）",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (!trig.isTanDefined) {
      warnings.push({
        text: `退化警示：当前动角 α = ${alphaDeg}°，终边与切线 x=1 平行，正切线 AT 不存在 (tan α 无定义)！`,
        level: "danger",
      });
    }
    if (trig.hasDegenerateSine) {
      warnings.push({
        text: `临界状态：当前动角 α = ${alphaDeg}°，终边落在 x 轴上，正弦线 MP 与正切线 AT 缩为单点 (0)。`,
        level: "warning",
      });
    }

    const mnemonic = `当前位置：${quadrantText}。正弦看竖线(MP)，余弦看横线(OM)，正切看右切线(AT)。顺坐标轴方向为正，逆方向为负！`;

    // 推导链：① 单位圆上定位 → ② 三条有向线段 → ③ 读出数值
    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法 · 单位圆上定位",
        detail:
          "把角 $\\alpha$ 的终边与单位圆 $x^2 + y^2 = 1$ 的交点记为 $P$。因为半径是 1，$P$ 的横、纵坐标就分别等于余弦与正弦，这是所有三角函数线的共同起点。",
        latex: "P(\\cos\\alpha, \\sin\\alpha), \\quad |OP| = r = 1",
        rubric: "采分点：写出单位圆交点坐标并说明 r = 1（3分）",
      },
      {
        step: 2,
        title: "建模联立 · 三条有向线段",
        detail:
          "过 $P$ 作 $x$ 轴垂线得垂足 $M$；再过切点 $A(1,0)$ 作单位圆的切线交终边（或其延长线）于 $T$。三条有向线段各自对应一个三角函数值，方向与坐标轴同向记正、反向记负。",
        latex:
          "\\overrightarrow{MP} = \\sin\\alpha, \\quad \\overrightarrow{OM} = \\cos\\alpha, \\quad \\overrightarrow{AT} = \\tan\\alpha",
        rubric: "采分点：写出三条线的起点终点与有向性（4分）",
      },
      {
        step: 3,
        title: "代入求解 · 读出三个函数值",
        detail: `代入 $\\alpha = ${alphaDeg}^\\circ$（即 $${radStr}$）：交点 $P = (${cosStr}, ${sinStr})$，当前位于${quadrantText}。${
          trig.isTanDefined
            ? "三条线的有向长度即为所求。"
            : "注意此时终边与切线 $x = 1$ 平行，交点 $T$ 不存在，故 $\\tan\\alpha$ 无定义。"
        }`,
        latex: `\\sin\\alpha = ${sinStr},\\quad \\cos\\alpha = ${cosStr},\\quad \\tan\\alpha = ${
          trig.isTanDefined && trig.tanVal !== null
            ? trig.tanVal.toFixed(3)
            : "\\text{不存在}"
        }`,
        rubric: "采分点：由线段长度读出三个函数值并判断符号（3分）",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      reasoningSteps,
      mnemonic,
    };
  }

  // 2. 模式：几何面积逼近与不等式放缩模式 (comparison)
  if (studyMode === "comparison") {
    const areas = calculateComparisonAreas(compAlphaDeg);
    const xVal = areas.xRad.toFixed(4);
    const sinVal = areas.sinX.toFixed(4);
    const tanVal = areas.tanX.toFixed(4);
    // 四阶面积必须与中屏柱状图标签逐一对应（S₁ △OMP / S₂ △OAP / S₃ 扇形 / S₄ △OAT），
    // 否则右屏少画一层、编号整体错位，与定理区的四阶包含链互相打架。
    const sOMP = areas.triangleOMP.toFixed(4);
    const sOAP = areas.triangleOAP.toFixed(4);
    const sSector = areas.sectorOAP.toFixed(4);
    const sOAT = areas.triangleOAT.toFixed(4);

    const quantities: MathQuantity[] = [
      {
        label: "探究锐角 x",
        symbol: "x",
        value: `${compAlphaDeg}° (${xVal} rad)`,
        color: MATH_COLORS.function,
      },
      {
        label: "小三角形面积 S₁ (△OMP)",
        symbol: "S_1 = \\frac{1}{2}\\sin x \\cos x",
        value: sOMP,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "中三角形面积 S₂ (△OAP)",
        symbol: "S_2 = \\frac{1}{2}\\sin x",
        value: sOAP,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "扇形面积 S₃ (扇形OAP)",
        symbol: "S_3 = \\frac{1}{2}x",
        value: sSector,
        color: MATH_COLORS.function,
      },
      {
        label: "大三角形面积 S₄ (△OAT)",
        symbol: "S_4 = \\frac{1}{2}\\tan x",
        value: sOAT,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "三阶函数值比较",
        symbol: "\\sin x < x < \\tan x",
        value: `${sinVal} < ${xVal} < ${tanVal}`,
        color: MATH_COLORS.paramPrimary,
        highlight: "positive",
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "第一象限四阶面积包含不等式",
        latex:
          "S_{\\triangle OMP} < S_{\\triangle OAP} < S_{\\text{扇形}OAP} < S_{\\triangle OAT}",
        condition: "$x \\in \\left(0, \\frac{\\pi}{2}\\right)$",
        note: "四块图形依次嵌套（共顶点 O、共半径 OA）：△OMP ⊂ △OAP ⊂ 扇形OAP ⊂ △OAT。面积分别为 (1/2)sin x·cos x、(1/2)sin x、(1/2)x、(1/2)tan x，同除以 (1/2) 即得 sin x·cos x < sin x < x < tan x。",
        level: "core",
      },
      {
        name: "第一象限三角函数放缩链",
        latex:
          "\\text{由 } S_{\\triangle OAP} < S_{\\text{扇形}OAP} < S_{\\triangle OAT} \\implies \\sin x < x < \\tan x \\quad \\left(x \\in \\left(0, \\frac{\\pi}{2}\\right)\\right)",
        condition: "$x \\in \\left(0, \\frac{\\pi}{2}\\right)$",
        note: "取中间三块图形 △OAP ⊂ 扇形OAP ⊂ △OAT，面积依次为 (1/2)sin x、(1/2)x、(1/2)tan x，三边同除以 (1/2) 即得 sin x < x < tan x，是三角函数与导数交汇题的常用放缩依据。",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "考点1：高考导数压轴题三大基准放缩：$sin x < x$ ($x > 0$), $e^x ≥ x + 1$, $ln(x+1) ≤ x$",
        importance: "hard",
      },
      {
        text: "考点2：利用 S_△ < S_扇 < S_△ 构造不等式解决三角估值综合题",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (compAlphaDeg < 10) {
      warnings.push({
        text: `当 x 越来越接近 0 时，sin x、x、tan x 三者彼此极度贴近（直观记忆放缩链 sin x < x < tan x）！`,
        level: "info",
      });
    }

    const mnemonic =
      "面积包含直观见：△OMP ⊂ △OAP ⊂ 扇形OAP ⊂ △OAT（共顶点 O、共半径 OA），同除以 (1/2) 即得 sin x·cos x < sin x < x < tan x，取后三阶即 sin x < x < tan x！";

    // 推导链：① 四阶面积包含（符号） → ② 面积表达式展开 → ③ 数值验证放缩链
    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法 · 同一扇形里嵌四块",
        detail:
          "在单位圆中取锐角 $x$，四块图形共顶点 $O$、共半径 $OA$，由内到外层层包含，所以面积必然依次递增。",
        latex:
          "S_{\\triangle OMP} < S_{\\triangle OAP} < S_{\\text{扇形}OAP} < S_{\\triangle OAT}",
        rubric: "采分点：写出四阶面积包含关系（3分）",
      },
      {
        step: 2,
        title: "建模联立 · 用面积公式展开",
        detail:
          "两块三角形用「底乘高除以二」，扇形用 $S = \\frac{1}{2}r^2\\theta$（$r = 1$）；四式同除以 $\\frac{1}{2}$ 消去系数，即得三阶放缩链。",
        latex:
          "\\frac{1}{2}\\sin x\\cos x < \\frac{1}{2}\\sin x < \\frac{1}{2}x < \\frac{1}{2}\\tan x \\implies \\sin x\\cos x < \\sin x < x < \\tan x",
        rubric: "采分点：写出四块面积表达式并同除系数（4分）",
      },
      {
        step: 3,
        title: "代入求解 · 数值验证放缩链",
        detail: `代入 $x = ${compAlphaDeg}^\\circ$（即 $${xVal}$ rad），可得 $S_1 = ${sOMP}$、$S_2 = ${sOAP}$、$S_3 = ${sSector}$、$S_4 = ${sOAT}$，严格递增，放缩链方向得到验证。`,
        latex: `\\sin x = ${sinVal} < x = ${xVal} < \\tan x = ${tanVal}`,
        rubric: "采分点：代入数值验证 sin x < x < tan x（3分）",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      reasoningSteps,
      mnemonic,
    };
  }

  // 3. 模式：单位圆解三角不等式模式 (inequality)
  const ineq = solveTrigInequality(ineqKind, ineqThreshold, alphaDeg);

  const kindLabels: Record<TrigInequalityKind, string> = {
    sin_gt: `\\sin x > ${ineqThreshold.toFixed(2)}`,
    sin_lt: `\\sin x < ${ineqThreshold.toFixed(2)}`,
    cos_gt: `\\cos x > ${ineqThreshold.toFixed(2)}`,
    cos_lt: `\\cos x < ${ineqThreshold.toFixed(2)}`,
    tan_gt: `\\tan x > ${ineqThreshold.toFixed(2)}`,
    tan_lt: `\\tan x < ${ineqThreshold.toFixed(2)}`,
  };

  const quantities: MathQuantity[] = [
    {
      label: "目标不等式",
      symbol: kindLabels[ineqKind],
      value: "动态求解中",
      color: MATH_COLORS.function,
    },
    {
      label: "当前测试角 α",
      symbol: `\\alpha = ${alphaDeg}^\\circ`,
      value: `${alphaDeg}° (${radStr})`,
    },
    {
      label: "当前函数值",
      symbol: ineqKind.startsWith("sin")
        ? "\\sin\\alpha"
        : ineqKind.startsWith("cos")
          ? "\\cos\\alpha"
          : "\\tan\\alpha",
      value: ineqKind.startsWith("sin")
        ? sinStr
        : ineqKind.startsWith("cos")
          ? cosStr
          : tanStr,
      color: ineq.isSatisfied
        ? MATH_COLORS.paramTertiary
        : MATH_COLORS.paramPrimary,
      highlight: ineq.isSatisfied ? "positive" : "negative",
    },
    {
      label: "解集包含状态",
      symbol: "\\alpha \\in \\text{解集}",
      value: ineq.isSatisfied
        ? "✓ 满足不等式 (在区间内)"
        : "✗ 不满足 (在区间外)",
      color: ineq.isSatisfied
        ? MATH_COLORS.paramTertiary
        : MATH_COLORS.paramPrimary,
      highlight: ineq.isSatisfied ? "positive" : "extreme",
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "单位圆三角函数线法解题通法",
      latex:
        "\\text{作基准线} \\to \\text{求交点界值} \\to \\text{按有向线段扫定弧区} \\to \\text{加周期 } 2k\\pi",
      condition: "正弦画水平线 y=c，余弦画坚直线 x=c，正切在 x=1 找截距",
      note: "逆时针书写区间：起点弧度 < 终点弧度，保证区间合法性。",
      level: "core",
    },
    {
      name: "当前不等式通解集",
      latex: ineq.latexSolution || "\\text{正在计算}",
      condition: "$k \\in \\mathbb{Z}$",
      note: "高考解答题务必书写 k ∈ Z，否则扣分。",
      level: "important",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "考点1：单位圆上快速确定三角不等式解集（避免画正弦波繁琐找交点）",
      importance: "gaokao",
    },
    {
      text: "考点2：区间端点的开闭判断与逆时针区间范围书写规范",
      importance: "gaokao",
    },
  ];

  const warnings: WarningItem[] = [];
  if (
    Math.abs(ineqThreshold) >= 1 &&
    (ineqKind.startsWith("sin") || ineqKind.startsWith("cos"))
  ) {
    warnings.push({
      text: `临界警示：阈值达到 |c| ≥ 1 边界，不等式可能恒成立或无解！`,
      level: "warning",
    });
  }

  const mnemonic =
    "解三角不等式口诀：正弦画横线(y=c)，余弦画竖线(x=c)，正切切线连原点。找准交点扫圆弧，逆时针写区间加 2kπ！";

  // 推导链：① 界值方程（符号） → ② 单位圆分弧测试 → ③ 补周期得通解集
  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: "审题定法 · 画基准线求界值",
      detail:
        "先把不等号换成等号解出界值：正弦画水平线 $y = c$，余弦画竖直线 $x = c$，正切则把切点 $A(1,0)$ 与直线 $x = c$ 上的截距相连。",
      latex: `${kindLabels[ineqKind]} \\implies c = ${ineqThreshold.toFixed(2)}`,
      rubric: "采分点：写出界值方程并说明基准线画法（3分）",
    },
    {
      step: 2,
      title: "建模联立 · 单位圆上分弧测试",
      detail:
        "界值点把单位圆切成若干段圆弧；在每段上任取一个测试点，用相应有向线段的正负判断该弧段是否属于解集，最后按逆时针方向书写区间。",
      latex:
        "\\text{界值点} \\to \\text{分段圆弧} \\to \\text{取测试点定符号} \\to \\text{逆时针写区间}",
      rubric: "采分点：给出分弧测试与区间方向的判断流程（4分）",
    },
    {
      step: 3,
      title: "代入求解 · 补周期得通解集",
      detail: `当前测试角 $\\alpha = ${alphaDeg}^\\circ$ ${ineq.isSatisfied ? "落在解集内（✓）" : "落在解集外（✗）"}，可与分弧测试的结论互相印证。通解集必须在每个区间后补上周期（正弦、余弦为 $2k\\pi$，正切为 $k\\pi$）并写明 $k \\in \\mathbb{Z}$。`,
      latex: ineq.latexSolution || "\\text{正在计算}",
      rubric: "采分点：写出含 $k \\in \\mathbb{Z}$ 的完整通解集（3分）",
    },
  ];

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic,
  };
}
