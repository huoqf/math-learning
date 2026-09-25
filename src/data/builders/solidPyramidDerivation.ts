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
  calculatePrismTripartition,
  calculateYangmaBienao,
} from "@/math3d/pyramidDerivation";

// ── know-solid-pyramid-derivation: 锥体体积公式推导与刘徽割体术 ──

export function buildPyramidDerivationPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode =
    ((params as Record<string, unknown>).mode as string) ??
    (config?.mode as string) ??
    "tripartition"; // "tripartition" | "yangma"

  const a = params.a ?? 2.5;
  const b = params.b ?? 2.0;
  const h = params.h ?? 3.0;
  const explode = params.explode ?? 0.3; // 0 ~ 1 爆炸拆解进度

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  const reasoningSteps: ReasoningStep[] = [];

  if (mode === "tripartition") {
    const data = calculatePrismTripartition(a, b, h);

    quantities.push(
      {
        label: "底面直角边 a",
        symbol: "a",
        value: data.a.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "底面直角边 b",
        symbol: "b",
        value: data.b.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "三棱柱高 h",
        symbol: "h",
        value: data.h.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "底面积 S_底",
        symbol: "S_{\\text{底}}",
        value: data.baseArea.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "三棱柱总体积",
        symbol: "V_{\\text{柱}}",
        value: data.prismVolume.toFixed(2),
        color: MATH_COLORS.secondary,
      },
      {
        label: "单个三棱锥体积",
        symbol: "V_{\\text{锥}}",
        value: data.pyramidVolume.toFixed(2),
        color: MATH_COLORS.highlight,
      },
      {
        label: "各锥体积占比",
        symbol: "\\frac{V_{\\text{锥}}}{V_{\\text{柱}}}",
        value: "1/3 (严格恒等)",
        color: MATH_COLORS.accent,
      },
      {
        label: "空间爆炸进度",
        symbol: "k_{\\text{拆解}}",
        value: `${Math.round(explode * 100)}%`,
        color: MATH_COLORS.complexNum,
      },
    );

    theorems.push(
      {
        name: "等底同高三棱锥体积等价定理",
        latex: `S_1 = S_2 \\;\\land\\; h_1 = h_2 \\implies V_1 = V_2`,
        level: "core",
        note: "若两个三棱锥的底面积相等、高也相等，则它们的体积必相等（欧几里得《几何原本》卷十二命题5）。",
      },
      {
        name: "三棱柱三等分体积定理",
        latex: `V_{A_1-ABC} = V_{A_1-BCC_1} = V_{C_1-A_1B_1B} = \\frac{1}{3} S_{\\text{底}} \\color{${MATH_COLORS.paramTertiary}}{h}`,
        level: "core",
        note: "直三棱柱可剖分为 3 个三棱锥：P₂ 与 P₃ 同顶 A₁ 且底面为侧面矩形平分的直角三角形，故 V₂=V₃；P₁ 与 P₃ 换底观察同理 V₁=V₃。因此三者体积严格等分三棱柱。",
      },
      {
        name: "祖暅原理推广至任意锥体通式",
        latex: `V_{\\text{锥体}} = \\frac{1}{3} S_{\\text{底}} \\color{${MATH_COLORS.paramTertiary}}{h}`,
        level: "core",
        condition:
          "由截面性质 S(x)/S = x²/h²，结合祖暅原理，任意多棱锥与圆锥的体积公式均为 V = (1/3)Sh",
      },
    );

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 沿对角面剖分三棱柱",
        detail:
          "设直三棱柱 $ABC-A_1B_1C_1$，底面直角边为 $a, b$，高为 $h$。作截面 $A_1BC$ 与 $A_1BC_1$，将三棱柱严格剖分为三个三棱锥：$P_1 = A_1-ABC$，$P_2 = A_1-BCC_1$，$P_3 = C_1-A_1B_1B$（即 $A_1-BB_1C_1$）。",
        latex: `V_{\\text{柱}} = S_{\\text{底}} \\cdot h = \\left(\\frac{1}{2}ab\\right) h`,
        rubric:
          "[高考规范采分] 明确构造剖分截面并列出母体三棱柱体积表达式 (+3分)",
      },
      {
        step: 2,
        title: "建模联立 · 换底对账证明两两等体积",
        detail:
          "① 对 $P_2$ 与 $P_3$：均以 $A_1$ 为顶点，底面 $\\triangle BCC_1$ 与 $\\triangle B_1C_1B$ 是矩形 $BCC_1B_1$ 被对角线平分的两个三角形，面积相等且高同为 $A_1$ 到侧面的距离 $\\implies V_2 = V_3$；② 对 $P_1$ 与 $P_3$：$P_1$ 视顶点为 $C$、底为 $\\triangle A_1AB$；$P_3$ 视顶点为 $C_1$、底为 $\\triangle A_1B_1B$。侧面矩形中 $\\triangle A_1AB$ 与 $\\triangle A_1B_1B$ 面积相等，且 $CC_1 \\parallel$ 侧面 $\\implies$ 顶点到侧面距离相等 $\\implies V_1 = V_3$。",
        latex: `V_1 = V_3 = V_2 \\implies V_{\\text{锥}} = \\frac{1}{3} V_{\\text{柱}}`,
        rubric:
          "[高考规范采分] 逻辑严密阐述等底同高关系并证明三体积等价 (+5分)",
      },
      {
        step: 3,
        title: "求解反思 · 导出锥体体积通式",
        detail:
          "三个三棱锥体积全等且无缝充满整个三棱柱，故每个三棱锥体积为三棱柱的 $\\frac{1}{3}$。结合多面体任意截面相似比 $S(x)/S = (x/h)^2$ 与祖暅原理，推广至所有锥体：",
        latex: `V_{\\text{锥}} = \\frac{1}{3} S_{\\text{底}} h = \\frac{1}{3} \\cdot \\left(\\frac{1}{2} \\color{${MATH_COLORS.paramPrimary}}{a} \\color{${MATH_COLORS.paramSecondary}}{b}\\right) \\color{${MATH_COLORS.paramTertiary}}{h} = \\frac{1}{6} \\color{${MATH_COLORS.paramPrimary}}{a} \\color{${MATH_COLORS.paramSecondary}}{b} \\color{${MATH_COLORS.paramTertiary}}{h}`,
        rubric: "[高考规范采分] 准确写出通式并给出规范结论代数表达式 (+4分)",
      },
    );

    gaokaoPoints.push({
      importance: "gaokao",
      text: "【高考考向分析】立体几何解答题常通过三棱柱分割考查点面距离与等体积法。把握三棱柱中各三棱锥体积的 1/3 等分性，是快速反求高线与法向量射影的关键捷径。",
    });

    warnings.push({
      level: "info",
      text: "【避免孤立视点】证明三棱锥体积相等时，不要局限于固定顶点；通过灵活转换顶点与底面（换底法），能将复杂空间关系转化为侧面平面几何图形的面积对账。",
    });
  } else {
    // 模式二：刘徽割体术（阳马与鳖臑）
    const data = calculateYangmaBienao(a, b, h);

    quantities.push(
      {
        label: "长方体长 a",
        symbol: "a",
        value: data.a.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "长方体宽 b",
        symbol: "b",
        value: data.b.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "长方体高 c",
        symbol: "c",
        value: data.c.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "母体堑堵体积",
        symbol: "V_{\\text{堑堵}}",
        value: data.qianduVolume.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "阳马体积",
        symbol: "V_{\\text{阳马}}",
        value: data.yangmaVolume.toFixed(2),
        color: MATH_COLORS.secondary,
      },
      {
        label: "鳖臑体积",
        symbol: "V_{\\text{鳖臑}}",
        value: data.bienaoVolume.toFixed(2),
        color: MATH_COLORS.highlight,
      },
      {
        label: "刘徽不易之率",
        symbol: "\\frac{V_{\\text{阳马}}}{V_{\\text{鳖臑}}}",
        value: "2 : 1 (严格恒等)",
        color: MATH_COLORS.accent,
      },
      {
        label: "空间爆炸进度",
        symbol: "k_{\\text{拆解}}",
        value: `${Math.round(explode * 100)}%`,
        color: MATH_COLORS.complexNum,
      },
    );

    theorems.push(
      {
        name: "刘徽堑堵割体定理",
        latex: `V_{\\text{堑堵}} = V_{\\text{阳马}} + V_{\\text{鳖臑}} = \\frac{1}{2} \\color{${MATH_COLORS.paramPrimary}}{a} \\color{${MATH_COLORS.paramSecondary}}{b} \\color{${MATH_COLORS.paramTertiary}}{c}`,
        level: "core",
        note: "直角三棱柱（堑堵）沿截面可严密剖分为一个阳马和一个鳖臑，两者无隙充盈整个堑堵。",
      },
      {
        name: "刘徽“阳马居二，鳖臑居一”定理",
        latex: `V_{\\text{阳马}} = \\frac{2}{3} V_{\\text{堑堵}} = \\frac{1}{3} \\color{${MATH_COLORS.paramPrimary}}{a} \\color{${MATH_COLORS.paramSecondary}}{b} \\color{${MATH_COLORS.paramTertiary}}{c},\\quad V_{\\text{鳖臑}} = \\frac{1}{3} V_{\\text{堑堵}} = \\frac{1}{6} \\color{${MATH_COLORS.paramPrimary}}{a} \\color{${MATH_COLORS.paramSecondary}}{b} \\color{${MATH_COLORS.paramTertiary}}{c}`,
        level: "core",
        note: "《九章算术注》核心命题：通过空间割体无限细分逼近证明阳马与鳖臑体积比恒为 2 : 1，确立了锥体 1/3 体积系数的中国数学史奠基性论证。",
      },
      {
        name: "鳖臑四直角面性质定理",
        latex: `\\triangle OAB, \\; \\triangle OAA_1, \\; \\triangle ABA_1, \\; \\triangle OBA_1 \\text{ 均为直角三角形}`,
        level: "important",
        note: "高考立体几何高频模型：利用侧棱垂直与三垂线定理证明鳖臑的四个面全为直角三角形。",
      },
    );

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 构造刘徽堑堵与剖分截面",
        detail:
          "取底面为直角边 $a, b$、高为 $c$ 的直三棱柱（堑堵）。沿顶点 $A_1$ 与对角线 $OB$ 作截面 $A_1OB$，将堑堵分解为四棱锥 $A_1-OBB_1O_1$（阳马）与三棱锥 $A_1-OAB$（鳖臑）。",
        latex: `V_{\\text{堑堵}} = \\frac{1}{2}abc`,
        rubric: "[高考规范采分] 明确写出母体几何体名称及剖分截面位置 (+3分)",
      },
      {
        step: 2,
        title: "建模联立 · 刘徽割体细分与体积比对账",
        detail:
          "刘徽将阳马与鳖臑各高截半，各自得到一个小长方体、两个小堑堵、以及更小的阳马与鳖臑。在有限分割步中，已明确体积部分阳马恒为鳖臑的 2 倍；余下微小部分通过“割之弥细，所失弥少，割之又割，以至于不可割”逼近，得出极限意义下阳马与鳖臑体积比恒为 $2:1$：",
        latex: `V_{\\text{阳马}} : V_{\\text{鳖臑}} = 2 : 1 \\implies V_{\\text{阳马}} = \\frac{2}{3} V_{\\text{堑堵}} = \\frac{1}{3}abc`,
        rubric: "[高考规范采分] 清晰阐述阳马居二鳖臑居一的比例证明思想 (+5分)",
      },
      {
        step: 3,
        title: "求解反思 · 导出阳马与鳖臑精确体积",
        detail:
          "代入参数值，求出各几何体体积，并验证两者之和严格充盈母体堑堵，同时验证阳马作为四棱锥其体积严格满足 $\\frac{1}{3} S_{\\text{底}} h$：",
        latex: `V_{\\text{阳马}} = \\frac{1}{3} \\cdot (${data.a.toFixed(2)} \\times ${data.b.toFixed(2)} \\times ${data.c.toFixed(2)}) = ${data.yangmaVolume.toFixed(2)}, \\quad V_{\\text{鳖臑}} = \\frac{1}{6} abc = ${data.bienaoVolume.toFixed(2)}`,
        rubric: "[高考规范采分] 准确计算具体数值并代入公式验证闭环 (+4分)",
      },
    );

    gaokaoPoints.push({
      importance: "gaokao",
      text: "【《九章算术》真题考向】新高考常以《九章算术》中‘阳马’或‘鳖臑’为背景命制立体几何大题，考查线面垂直证明（三垂线定理）及几何体体积和外接球计算。",
    });

    warnings.push({
      level: "info",
      text: "【概念辨析】鳖臑读音为 biē nào（鳖的四肢）。阳马必须有一条侧棱垂直于矩形底面，若侧棱倾斜则仅为一般四棱锥而非阳马。",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
  };
}
