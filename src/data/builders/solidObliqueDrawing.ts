import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  buildPresetPolygon,
  type PolygonPresetKey,
} from "@/math/obliqueDrawing";

export function buildObliqueDrawingPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const polygonType = (config?.polygonType as PolygonPresetKey) ?? "square";

  const a = params.a ?? 4;
  const b = params.b ?? 4;
  const h = params.h ?? 4;
  const alphaDeg = params.alphaDeg ?? 45;
  const ratioY = params.ratioY ?? 0.5;

  const poly = buildPresetPolygon(polygonType, { a, b, h }, alphaDeg, ratioY);

  const quantities: MathQuantity[] = [
    {
      label: "横向尺寸 a",
      symbol: "a",
      value: a.toFixed(1),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "纵向尺寸 b",
      symbol: "b",
      value: b.toFixed(1),
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "斜轴夹角 α",
      symbol: "\\alpha",
      value: `${alphaDeg}°`,
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "y 轴收缩比例 k",
      symbol: "k",
      value: ratioY.toFixed(2),
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "原平面图形面积",
      symbol: "S_{\\text{原}}",
      value: poly.originalArea.toFixed(2),
      color: MATH_COLORS.primary,
    },
    {
      label: "直观图面积",
      symbol: "S_{\\text{直观}}",
      value: poly.obliqueArea.toFixed(2),
      color: MATH_COLORS.secondary,
    },
    {
      label: "实际面积缩放比",
      symbol: "S_{\\text{直观}} / S_{\\text{原}}",
      value: poly.areaRatio.toFixed(4),
      color:
        Math.abs(poly.areaRatio - Math.SQRT2 / 4) < 1e-3
          ? MATH_COLORS.paramTertiary
          : MATH_COLORS.paramSecondary,
    },
    {
      label: "标准理论比值 √2 / 4",
      symbol: "\\frac{\\sqrt{2}}{4}",
      value: (Math.SQRT2 / 4).toFixed(4),
      color: MATH_COLORS.textMuted,
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "斜二测画法基本规则（必修二 8.2）",
      latex: `\\begin{cases} x' \\text{ 轴与 } y' \\text{ 轴夹角为 } 45^\\circ \\text{ 或 } 135^\\circ \\\\ \\text{平行于 } x \\text{ 轴的线段长度保持不变} \\\\ \\text{平行于 } y \\text{ 轴的线段长度折半: } l' = \\frac{1}{2} l \\\\ \\text{空间立体的 } z' \\text{ 轴垂直于 } x'O'y' \\text{ 面且长度不变} \\end{cases}`,
      level: "core",
      condition: "适用于绘制水平放置的平面多边形与空间几何体的直观图",
    },
    {
      name: "直观图与原图面积变换恒等式",
      latex: `S_{\\text{直观}} = \\frac{\\sqrt{2}}{4} S_{\\text{原}} \\iff S_{\\text{原}} = 2\\sqrt{2} S_{\\text{直观}}`,
      level: "core",
      note: "由直观图高度压缩系数 $h' = h \\cdot \\frac{1}{2}\\sin 45^\\circ = \\frac{\\sqrt{2}}{4} h$ 推导而得",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "【高考选择题常考题型】已知直观图为特殊图形（如等腰梯形、直角三角形），求原图形面积或周长。切记：原图面积恒等于直观图面积的 $2\\sqrt{2}$ 倍（约 2.828 倍），不可误算为 2 倍！",
      importance: "gaokao",
    },
    {
      text: "【平行性与垂直性辨析】原平面图形中平行的直线，在直观图中仍然平行；但原图形中互相垂直的直线，在直观图中一般不再垂直（夹角变为 $45^\\circ$ 或 $135^\\circ$）。",
      importance: "gaokao",
    },
  ];

  const warnings: WarningItem[] = [];
  if (Math.abs(alphaDeg - 45) > 1e-2 || Math.abs(ratioY - 0.5) > 1e-2) {
    warnings.push({
      level: "warning",
      text: `当前参数（$\\alpha=${alphaDeg}^\\circ$, $k=${ratioY}$）偏离了高中数学新课标标准斜二测参数（$\\alpha=45^\\circ, k=0.5$），面积比不再为 $\\frac{\\sqrt{2}}{4}$。`,
    });
  }

  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: "建立坐标系与尺寸提取",
      latex: `\\text{原图形顶点在直角坐标系 } xOy \\text{ 中坐标已知，基底向量平行于坐标轴。}`,
    },
    {
      step: 2,
      title: "执行斜二测代数变换",
      latex: `\\begin{pmatrix} x' \\\\ y' \\end{pmatrix} = \\begin{pmatrix} x + y \\cdot \\cos(${alphaDeg}^\\circ) \\cdot ${ratioY.toFixed(2)} \\\\ y \\cdot \\sin(${alphaDeg}^\\circ) \\cdot ${ratioY.toFixed(2)} \\end{pmatrix}`,
    },
    {
      step: 3,
      title: "面积压缩与验证闭环",
      latex: `S_{\\text{直观}} = ${poly.obliqueArea.toFixed(2)}, \\; S_{\\text{原}} = ${poly.originalArea.toFixed(2)} \\implies \\frac{S_{\\text{直观}}}{S_{\\text{原}}} = ${poly.areaRatio.toFixed(4)} \\approx \\frac{\\sqrt{2}}{4}`,
    },
  ];

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
  };
}
