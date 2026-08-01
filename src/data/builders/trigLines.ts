import type { MathPanelData, MathQuantity, Theorem, GaokaoPoint, WarningItem } from "../types";
import { calculateTrigLines } from "@/features/trigLines/math/trigLines";

export function buildTrigLinesPanel(
  params: Record<string, number>,
  _config?: Record<string, unknown>
): MathPanelData {
  const alphaDeg = params.alphaDeg ?? 45;
  const trig = calculateTrigLines(alphaDeg);

  const radStr = `${(trig.alphaRad / Math.PI).toFixed(2)}\\pi`;
  const sinStr = trig.sinVal.toFixed(3);
  const cosStr = trig.cosVal.toFixed(3);
  const tanStr = trig.isTanDefined && trig.tanVal !== null ? trig.tanVal.toFixed(3) : "无意义";

  // 数学量列表
  const quantities: MathQuantity[] = [
    {
      label: "动角 α",
      symbol: `\\alpha = ${alphaDeg}^\\circ`,
      value: `${alphaDeg}° (${radStr})`,
    },
    {
      label: "交点 P 坐标",
      symbol: "P(\\cos\\alpha, \\sin\\alpha)",
      value: `(${cosStr}, ${sinStr})`,
    },
    {
      label: "正弦线 MP (数量)",
      symbol: "MP = \\sin\\alpha",
      value: sinStr,
      color: "#EF4444",
      highlight: trig.sinVal > 0 ? "positive" : trig.sinVal < 0 ? "negative" : "zero",
    },
    {
      label: "余弦线 OM (数量)",
      symbol: "OM = \\cos\\alpha",
      value: cosStr,
      color: "#D97706",
      highlight: trig.cosVal > 0 ? "positive" : trig.cosVal < 0 ? "negative" : "zero",
    },
    {
      label: "正切线 AT (数量)",
      symbol: "AT = \\tan\\alpha",
      value: tanStr,
      color: "#059669",
      highlight: !trig.isTanDefined ? "extreme" : (trig.tanVal ?? 0) > 0 ? "positive" : (trig.tanVal ?? 0) < 0 ? "negative" : "zero",
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

  // 定理公式
  const theorems: Theorem[] = [
    {
      name: "三角函数线的几何定义",
      latex: "\\overrightarrow{MP} = \\sin\\alpha, \\quad \\overrightarrow{OM} = \\cos\\alpha, \\quad \\overrightarrow{AT} = \\tan\\alpha",
      condition: "单位圆 r = 1，P(cosα, sinα)，M 为 P 在 x 轴投影，A(1,0) 为切点",
      note: "有向线段的方向顺坐标轴方向为正，逆方向为负。",
      level: "core",
    },
    {
      name: "第一象限几何比较不等式",
      latex: "\\sin\\alpha < \\alpha < \\tan\\alpha \\quad (0 < \\alpha < \\frac{\\pi}{2})",
      condition: "仅在第一象限锐角区间 (0, π/2) 成立",
      note: "由 S_△OMP < S_扇形OAP < S_△OAT 面积逼近直接导出，高考放缩基础。",
      level: "important",
    },
  ];

  // 高考考点
  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "考点1：三角函数值的符号判断（一全正、二正弦、三正切、四余弦）",
      importance: "gaokao",
    },
    {
      text: "考点2：解三角不等式（在单位圆上结合三角函数线扫描弧区解集）",
      importance: "gaokao",
    },
    {
      text: "考点3：极限逼近与切线放缩（sin x < x < tan x 的几何证明）",
      importance: "hard",
    },
  ];

  // 退化警示
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

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic,
  };
}
