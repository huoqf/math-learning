import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import {
  calculateTrigLines,
  calculateComparisonAreas,
  solveTrigInequality,
  type TrigInequalityKind,
} from "@/features/trigLines/math/trigLines";

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
        color: "#EF4444",
        highlight:
          trig.sinVal > 0 ? "positive" : trig.sinVal < 0 ? "negative" : "zero",
      },
      {
        label: "余弦线 OM (有向数量)",
        symbol: "OM = \\cos\\alpha",
        value: cosStr,
        color: "#D97706",
        highlight:
          trig.cosVal > 0 ? "positive" : trig.cosVal < 0 ? "negative" : "zero",
      },
      {
        label: "正切线 AT (有向数量)",
        symbol: "AT = \\tan\\alpha",
        value: tanStr,
        color: "#059669",
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
        color: "#3B82F6",
      },
    ];

    const qMap: Record<string, string> = {
      1: "第一象限 (sin>0, cos>0, tan>0)",
      2: "第二象限 (sin>0, cos<0, tan<0)",
      3: "第三象限 (sin<0, cos<0, tan>0)",
      4: "第四象限 (sin<0, cos<0, tan<0)",
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

    return { quantities, theorems, gaokaoPoints, warnings, mnemonic };
  }

  // 2. 模式：几何面积逼近与不等式放缩模式 (comparison)
  if (studyMode === "comparison") {
    const areas = calculateComparisonAreas(compAlphaDeg);
    const xVal = areas.xRad.toFixed(4);
    const sinVal = areas.sinX.toFixed(4);
    const tanVal = areas.tanX.toFixed(4);
    const s1 = areas.triangleOMP.toFixed(4);
    const s2 = areas.sectorOAP.toFixed(4);
    const s3 = areas.triangleOAT.toFixed(4);

    const quantities: MathQuantity[] = [
      {
        label: "探究锐角 x",
        symbol: "x",
        value: `${compAlphaDeg}° (${xVal} rad)`,
        color: "#3B82F6",
      },
      {
        label: "小三角形面积 S_△OMP",
        symbol: "S_1 = \\frac{1}{2}\\sin x \\cos x",
        value: s1,
        color: "#6366F1",
      },
      {
        label: "扇形面积 S_扇形OAP",
        symbol: "S_2 = \\frac{1}{2}x",
        value: s2,
        color: "#3B82F6",
      },
      {
        label: "大三角形面积 S_△OAT",
        symbol: "S_3 = \\frac{1}{2}\\tan x",
        value: s3,
        color: "#059669",
      },
      {
        label: "三阶函数值比较",
        symbol: "\\sin x < x < \\tan x",
        value: `${sinVal} < ${xVal} < ${tanVal}`,
        color: "#EF4444",
        highlight: "positive",
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "第一象限经典面积放缩不等式",
        latex:
          "S_{\\triangle OMP} < S_{\\text{扇形}OAP} < S_{\\triangle OAT} \\implies \\sin x \\cos x < x < \\tan x",
        condition: "x \\in \\left(0, \\frac{\\pi}{2}\\right)",
        note: "同除以 (1/2) 并在两端分别处理，可导出高中极为重要的放缩链条：sin x < x < tan x。",
        level: "core",
      },
      {
        name: "重要极限与导数几何基石",
        latex:
          "\\lim_{x \\to 0^+} \\cos x < \\lim_{x \\to 0^+} \\frac{\\sin x}{x} < 1 \\implies \\lim_{x \\to 0} \\frac{\\sin x}{x} = 1",
        condition: "夹逼准则 (Squeeze Theorem)",
        note: "正弦函数导数 (sin x)' = cos x 证明的第一原初几何依据。",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "考点1：高考导数压轴题三大基准放缩：sin x < x (x > 0), e^x ≥ x + 1, ln(x+1) ≤ x",
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
        text: `当 x → 0 时，sin x, x, tan x 彼此极度贴近，呈现等价无穷小特性！`,
        level: "info",
      });
    }

    const mnemonic =
      "面积包含直观见：小直角三角形 ⊂ 扇形 ⊂ 大直角三角形，两端除以 (1/2) 即得 sin x < x < tan x！";

    return { quantities, theorems, gaokaoPoints, warnings, mnemonic };
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
      color: "#3B82F6",
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
      color: ineq.isSatisfied ? "#059669" : "#EF4444",
      highlight: ineq.isSatisfied ? "positive" : "negative",
    },
    {
      label: "解集包含状态",
      symbol: "\\alpha \\in \\text{解集}",
      value: ineq.isSatisfied
        ? "✓ 满足不等式 (在区间内)"
        : "✗ 不满足 (在区间外)",
      color: ineq.isSatisfied ? "#059669" : "#EF4444",
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
      condition: "k \\in \\mathbb{Z}",
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

  return { quantities, theorems, gaokaoPoints, warnings, mnemonic };
}
