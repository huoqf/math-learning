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
  calculateZuxuanSection,
  calculateSphereMicroPyramids,
} from "@/math3d/sphereDerivation";

// ── know-solid-sphere-derivation: 祖暅原理与球的体积、表面积公式推导 ──

export function buildSphereDerivationPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode =
    ((params as Record<string, unknown>).mode as string) ??
    (config?.mode as string) ??
    "zuxuan"; // "zuxuan" | "micropyramid"

  const R = params.radius ?? 2.0;
  const h = params.heightCut ?? 1.0;
  const subdivisions = params.subdivisions ?? 16;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  const reasoningSteps: ReasoningStep[] = [];

  if (mode === "zuxuan") {
    const zuxuan = calculateZuxuanSection(R, h);

    quantities.push(
      {
        label: "球与柱体半径 R",
        symbol: "R",
        value: R.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "切割面高度 h",
        symbol: "h",
        value: h.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "半球截面半径 r_半",
        symbol: "r_{\\text{半}}",
        value: zuxuan.hemisphereCutRadius.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "挖锥柱体内截面半径 r_内",
        symbol: "r_{\\text{内}}",
        value: zuxuan.coneInnerRadius.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "半球截面圆面积 S₁",
        symbol: "S_1(h)",
        value: zuxuan.hemisphereCutArea.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "挖锥柱体截面圆环面积 S₂",
        symbol: "S_2(h)",
        value: zuxuan.cylinderCutArea.toFixed(2),
        color: MATH_COLORS.secondary,
      },
      {
        label: "截面积差值 |S₁ - S₂|",
        symbol: "|S_1 - S_2|",
        value:
          zuxuan.areaDifference < 1e-4
            ? "0.00 (严格恒等)"
            : zuxuan.areaDifference.toFixed(4),
        color: MATH_COLORS.highlight,
      },
      {
        label: "推导半球体积 V_半球",
        symbol: "V_{\\text{半球}}",
        value: zuxuan.hemisphereVolume.toFixed(2),
        color: MATH_COLORS.accent,
      },
      {
        label: "完整球体体积 V_球",
        symbol: "V_{\\text{球}}",
        value: zuxuan.sphereVolume.toFixed(2),
        color: MATH_COLORS.primary,
      },
    );

    theorems.push(
      {
        name: "祖暅原理（卡瓦列里原理）",
        latex: `\\text{“幂势既同，则积不容异”} \\implies \\text{若两等高立体在任意等高截面面积均恒等：} S_1(h) = S_2(h), \\; \\text{则} V_1 = V_2`,
        level: "core",
        note: "中国南北朝数学家祖暅提出。夹在两个平行平面间的两个几何体，被平行于这两个平面的任意平面所截，如果截得的两个截面的面积总相等，那么这两个几何体的体积相等。",
      },
      {
        name: "等高截面面积恒等性定理",
        latex: `S_1(h) = \\pi (\\color{${MATH_COLORS.paramPrimary}}{R}^2 - \\color{${MATH_COLORS.paramSecondary}}{h}^2) = \\pi \\color{${MATH_COLORS.paramPrimary}}{R}^2 - \\pi \\color{${MATH_COLORS.paramSecondary}}{h}^2 = S_2(h)`,
        level: "core",
        condition: "高度 h 满足 0 ≤ h ≤ R",
      },
      {
        name: "球体体积公式推导结论",
        latex: `V_{\\text{半球}} = V_{\\text{圆柱}} - V_{\\text{倒圆锥}} = \\pi \\color{${MATH_COLORS.paramPrimary}}{R}^3 - \\frac{1}{3}\\pi \\color{${MATH_COLORS.paramPrimary}}{R}^3 = \\frac{2}{3}\\pi \\color{${MATH_COLORS.paramPrimary}}{R}^3 \\implies V_{\\text{球}} = \\frac{4}{3}\\pi \\color{${MATH_COLORS.paramPrimary}}{R}^3`,
        level: "core",
      },
    );

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 构造等高伴随对比体",
        detail:
          "选取底面半径为 $R$、高为 $R$ 的半球，置于水平基准面上。在同基准面上并排放置一个同底等高的圆柱（底半径 $R$、高 $R$），并在圆柱内挖去一个顶点在底面圆心、底面与圆柱上底重合的倒圆锥。",
        latex: `V_{\\text{柱}} = \\pi R^2 \\cdot R = \\pi R^3, \\quad V_{\\text{锥}} = \\frac{1}{3}\\pi R^2 \\cdot R = \\frac{1}{3}\\pi R^3`,
        rubric:
          "[高考规范采分] 明确构造等高伴随几何体并写出柱、锥体积表达式 (+4分)",
      },
      {
        step: 2,
        title: "建模联立 · 代入等高切片截面面积解析式",
        detail:
          "在任意高度 $h$（$0 \\le h \\le R$）处作平行于底面的水平截面。对半球，由勾股定理截面圆半径为 $\\sqrt{R^2 - h^2}$；对挖锥柱体，倒圆锥在该高度处的横截面半径由截面三角形相似比得 $r_{\\text{内}} = h$：",
        latex: `S_1(h) = \\pi (\\sqrt{R^2 - h^2})^2 = \\pi(R^2 - h^2), \\quad S_2(h) = \\pi R^2 - \\pi h^2 = \\pi(R^2 - h^2) \\implies S_1(h) \\equiv S_2(h)`,
        rubric:
          "[高考规范采分] 准确列出截面圆与截面圆环面积表达式并严格证明等价 (+5分)",
      },
      {
        step: 3,
        title: "求解反思 · 祖暅公理导出球体积通式",
        detail:
          "因为对任意高度 $h \\in [0, R]$，截面面积恒等 $S_1(h) = S_2(h)$，由祖暅原理得半球体积等于挖锥柱体体积：",
        latex: `V_{\\text{半球}} = \\pi R^3 - \\frac{1}{3}\\pi R^3 = \\frac{2}{3}\\pi R^3 \\implies V_{\\text{球}} = 2 V_{\\text{半球}} = \\frac{4}{3}\\pi R^3`,
        rubric:
          "[高考规范采分] 依据祖暅原理给出严密推导结论并倍乘得出整球体积 (+4分)",
      },
    );

    if (h >= R - 1e-3) {
      warnings.push({
        text: "截面已到达几何体顶部 (h = R)，截面圆退化为切点 (r = 0)，挖锥圆柱内外半径重合！",
        level: "warning",
      });
    } else if (h <= 1e-3) {
      warnings.push({
        text: "截面处于基底平面 (h = 0)，半球截面达到最大大圆面积，挖锥圆柱内部锥尖退化为单点！",
        level: "info",
      });
    }
  } else {
    // micropyramid 模式
    const micro = calculateSphereMicroPyramids(R, subdivisions);

    quantities.push(
      {
        label: "球半径 R",
        symbol: "R",
        value: R.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "球面分割小棱锥总数",
        symbol: "N",
        value: `${micro.totalMicroPyramids} 块`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "采样微锥高 h_锥",
        symbol: "h_{\\text{锥}}",
        value: micro.samplePyramid.height.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "采样微锥底面积 ΔS",
        symbol: "\\Delta S",
        value: micro.samplePyramid.baseArea.toFixed(4),
        color: MATH_COLORS.secondary,
      },
      {
        label: "采样微锥体积 ΔV",
        symbol: "\\Delta V",
        value: micro.samplePyramid.pyramidVolume.toFixed(4),
        color: MATH_COLORS.highlight,
      },
      {
        label: "近似求和表面积 ∑ΔS",
        symbol: "\\sum \\Delta S",
        value: micro.approximateSurfaceArea.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "理论球表面积 4πR²",
        symbol: "S_{\\text{理论}}",
        value: micro.exactSurfaceArea.toFixed(2),
        color: MATH_COLORS.accent,
      },
      {
        label: "近似求和体积 ∑ΔV",
        symbol: "\\sum \\Delta V",
        value: micro.approximateVolume.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "理论球体积 4/3 πR³",
        symbol: "V_{\\text{理论}}",
        value: micro.exactVolume.toFixed(2),
        color: MATH_COLORS.accent,
      },
    );

    theorems.push(
      {
        name: "以锥积球与分割近似求和原理",
        latex: `\\Delta V_i \\approx \\frac{1}{3} \\color{${MATH_COLORS.paramPrimary}}{R} \\cdot \\Delta S_i \\implies V_{\\text{球}} = \\sum_{i=1}^N \\Delta V_i \\approx \\frac{1}{3} \\color{${MATH_COLORS.paramPrimary}}{R} \\sum_{i=1}^N \\Delta S_i = \\frac{1}{3} \\color{${MATH_COLORS.paramPrimary}}{R} S_{\\text{表}}`,
        level: "core",
        note: "人教A版课标思想：将球面细分为无数微小平面多边形，球心为顶点，构成微小棱锥；细分无限加深时微锥体高趋于半径 R。",
      },
      {
        name: "球表面积公式代数转化",
        latex: `S_{\\text{表}} = \\frac{3 V_{\\text{球}}}{\\color{${MATH_COLORS.paramPrimary}}{R}} = \\frac{3 \\times \\frac{4}{3}\\pi \\color{${MATH_COLORS.paramPrimary}}{R}^3}{\\color{${MATH_COLORS.paramPrimary}}{R}} = 4\\pi \\color{${MATH_COLORS.paramPrimary}}{R}^2`,
        level: "core",
      },
      {
        name: "大圆面积与球表面积关系",
        latex: `S_{\\text{球}} = 4 \\times S_{\\text{大圆}} = 4\\pi \\color{${MATH_COLORS.paramPrimary}}{R}^2`,
        level: "important",
        note: "球的表面积恰好等于其最大大圆截面面积的 4 倍（阿基米德著名发现）。",
      },
    );

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 球面网格化微锥分割",
        detail:
          "将半径为 $R$ 的球面分割成 $N$ 个微小网格，每个微小网格面积记为 $\\Delta S_i$。连接球心与各网格的顶点，整个球体被近似分割为 $N$ 个以球心为顶点的小棱锥。",
        latex: `\\text{微锥体高} \\; h_i \\approx R, \\quad \\Delta V_i \\approx \\frac{1}{3} h_i \\Delta S_i = \\frac{1}{3} R \\Delta S_i`,
        rubric:
          "[高考规范采分] 准确建立微锥体体积与微小底面积的线性正比例模型 (+4分)",
      },
      {
        step: 2,
        title: "建模联立 · 总体积累加求和关系",
        detail:
          "把所有小棱锥的体积累加起来，总和近似等于球的体积；同时所有小网格面积之和近似等于球的表面积：",
        latex: `V = \\sum_{i=1}^N \\Delta V_i \\approx \\frac{1}{3} R \\sum_{i=1}^N \\Delta S_i = \\frac{1}{3} R S`,
        rubric:
          "[高考规范采分] 提出以平代曲思想并正确提公因式写出求和式 (+5分)",
      },
      {
        step: 3,
        title: "求解反思 · 代入球体积求出球表面积",
        detail:
          "当网格划分越来越密时，近似等式趋于精确相等。将已知球体积公式 $V = \\frac{4}{3}\\pi R^3$ 代入反解表面积：",
        latex: `S = \\frac{3V}{R} = \\frac{3 \\cdot \\left(\\frac{4}{3}\\pi R^3\\right)}{R} = 4\\pi R^2`,
        rubric:
          "[高考规范采分] 准确反解求得 $S = 4\\pi R^2$ 结论并说明几何意义 (+4分)",
      },
    );

    if (subdivisions <= 8) {
      warnings.push({
        text: "当前分割网格数较少，多边形微锥拼合存在较大曲面误差，加大细分值可观察逼近效果！",
        level: "info",
      });
    }
  }

  gaokaoPoints.push(
    {
      text: "祖暅原理与传统数学文化：新高考极为推崇将中国古代数学典籍（《九章算术》、《算经十书》中祖暅、刘徽、赵爽的思想）融入立体几何试题。考题常以“牟合方盖”、等高截面面积比、旋转体积等为情景设问。",
      importance: "gaokao",
    },
    {
      text: "等高截面积判定通法：求解不规则几何体体积或证明体积相等时，优先考虑建立水平截面面积函数 S(h)。若 S₁(h) ≡ S₂(h)，则无需积分即可由祖暅原理直接得出 V₁ = V₂。",
      importance: "core",
    },
    {
      text: "球体积与表面积数形关联：当半径由 R 增至 R + ΔR 时，薄球壳体积近似为 ΔV ≈ S(R) · ΔR，以锥积球正是将该三维立体体积向二维表面积解构的标准几何思想。",
      importance: "gaokao",
    },
    {
      text: "球体四大倍数关系：大圆周长 C = 2πR，大圆面积 S_大 = πR²，球表面积 S_球 = 4 S_大 = 4πR²，圆柱容球体积比 V_柱 : V_球 : V_锥 = 3 : 2 : 1（阿基米德墓碑铭文图形）。",
      importance: "core",
    },
  );

  return { quantities, theorems, gaokaoPoints, warnings, reasoningSteps };
}
