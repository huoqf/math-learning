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
  calculateConePyramidEquivalence,
} from "@/math3d/pyramidDerivation";

// ── know-solid-pyramid-derivation: 锥体体积公式推导与刘徽割体术 ──

export function buildPyramidDerivationPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode =
    ((params as Record<string, unknown>).mode as string) ??
    (config?.mode as string) ??
    "tripartition"; // "tripartition" | "yangma" | "coneEquivalence"

  const a = params.a ?? 2.5;
  const b = params.b ?? 2.0;
  const h = params.h ?? 3.0;
  // 模式二堑堵的高度 c 与三棱柱高 h 解耦：左屏滑块 key 为 c、中屏 Scene 亦取 params.c，
  // 右屏必须同源读取 c，否则出现「中屏变、右屏不变」的不同源缺陷。默认值与 Animation 一致。
  const c = params.c ?? 3.2;
  const r = params.r ?? 1.8;
  const heightCut = params.heightCut ?? 1.2;
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
  } else if (mode === "yangma") {
    // 模式二：刘徽割体术（阳马与鳖臑）
    const data = calculateYangmaBienao(a, b, c);

    quantities.push(
      {
        label: "堑堵底面直角边 a",
        symbol: "a",
        value: data.a.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "堑堵底面直角边 b",
        symbol: "b",
        value: data.b.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "堑堵高 c",
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
        note: "高考立体几何高频模型：由 $AA_1 \\perp$ 底面得 $AA_1 \\perp OB$，又 $OB \\perp OA$，故 $OB \\perp$ 平面 $OAA_1$，从而 $OB \\perp OA_1$——四个面均为直角三角形，全程只用线面垂直的判定与性质定理。",
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
          "刘徽平分堑堵的长、宽、高（取各棱中点）作割补：阳马被分成 $1$ 个小长方体、$2$ 个小堑堵与 $2$ 个更小的阳马；鳖臑被分成 $2$ 个小堑堵与 $2$ 个更小的鳖臑。其中“已知”部分（小长方体与 $4$ 个小堑堵）体积恰为鳖臑“已知”部分的 $2$ 倍，且共占原堑堵的 $\\frac{3}{4}$；剩余部分照此反复细分，“半之弥少，其余弥细；至细曰微，微则无形”，逐轮逼近后阳马与鳖臑体积比恒为 $2:1$：",
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
      text: "【《九章算术》真题考向】新高考常以《九章算术》中‘阳马’或‘鳖臑’为背景命制立体几何大题，考查线面垂直的判定与性质（或用空间向量建系求角）及几何体体积、外接球计算。",
    });

    warnings.push({
      level: "info",
      text: "【概念辨析】鳖臑读音为 biē nào（鳖的四肢）。阳马必须有一条侧棱垂直于矩形底面，若侧棱倾斜则仅为一般四棱锥而非阳马。",
    });
  } else {
    // 模式三：祖暅原理圆锥与正四棱锥等积
    const data = calculateConePyramidEquivalence(r, h, heightCut);

    quantities.push(
      {
        label: "圆锥底面半径 r",
        symbol: "r",
        value: data.radius.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "锥体共同高 h",
        symbol: "h",
        value: data.height.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "截面距底面高度 z",
        symbol: "z",
        value: data.heightCut.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "共同底面积 S_底",
        symbol: "S_{\\text{底}}",
        value: data.baseArea.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "伴随正棱锥底边长 a",
        symbol: "a = \\sqrt{S}",
        value: data.pyramidSide.toFixed(2),
        color: MATH_COLORS.secondary,
      },
      {
        label: "圆锥截面圆面积 S₁",
        symbol: "S_{\\text{圆}}(z)",
        value: data.coneCutArea.toFixed(2),
        color: MATH_COLORS.primary,
      },
      {
        label: "四棱锥截面面积 S₂",
        symbol: "S_{\\text{棱}}(z)",
        value: data.pyramidCutArea.toFixed(2),
        color: MATH_COLORS.secondary,
      },
      {
        label: "截面积差值 |S₁ - S₂|",
        symbol: "|S_1 - S_2|",
        value: data.isAreaEqual
          ? "0.00 (严格恒等)"
          : data.areaDifference.toFixed(4),
        color: MATH_COLORS.highlight,
      },
      {
        label: "截面相似比 (h-z)/h",
        symbol: "\\lambda",
        value: data.ratioFromApex.toFixed(3),
        color: MATH_COLORS.accent,
      },
      {
        label: "共同锥体体积",
        symbol: "V_{\\text{锥}}",
        value: data.volume.toFixed(2),
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "锥体等高平行截面面积比定理",
        latex: `\\frac{S(z)}{S_{\\text{底}}} = \\left(\\frac{\\color{${MATH_COLORS.paramTertiary}}{h} - \\color{${MATH_COLORS.paramSecondary}}{z}}{\\color{${MATH_COLORS.paramTertiary}}{h}}\\right)^2`,
        level: "core",
        note: "平行于锥体底面的截面多边形（或截面圆）与底面相似，截面面积之比等于顶点到截面距离与高的比值的平方。",
      },
      {
        name: "祖暅原理（卡瓦列里原理）",
        latex: `S_1(z) \\equiv S_2(z) \\implies V_{\\text{圆锥}} = V_{\\text{正棱锥}}`,
        level: "core",
        note: "夹在两个平行平面间的两个几何体，被平行于这两个平面的任意平面所截，如果截得的截面面积总相等，那么这两个几何体的体积相等。",
      },
      {
        name: "圆锥体积统一通式",
        latex: `V_{\\text{圆锥}} = \\frac{1}{3} S_{\\text{底}} \\color{${MATH_COLORS.paramTertiary}}{h} = \\frac{1}{3}\\pi \\color{${MATH_COLORS.paramPrimary}}{r}^2 \\color{${MATH_COLORS.paramTertiary}}{h}`,
        level: "core",
        condition:
          "正四棱锥由两个三棱锥拼合，体积已知为 (1/3)Sh；由祖暅原理，圆锥体积严格等于 (1/3)πr²h",
      },
    );

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 构造等底等高伴随棱锥",
        detail:
          "设圆锥底面半径为 $r$，高为 $h$，底面积为 $S = \\pi r^2$。在同基准面上并排放置一个同底等高的正四棱锥，其底面正方形边长为 $a = \\sqrt{\\pi} r$，高同样为 $h$。正四棱锥可沿对角面剖分为两个底面积各为 $\\frac{1}{2}S$ 的三棱锥，体积已知为 $V_{\\text{棱锥}} = \\frac{1}{3} S h$。",
        latex: `S_{\\text{圆}} = \\pi r^2, \\quad S_{\\text{棱}} = a^2 = (\\sqrt{\\pi}r)^2 = \\pi r^2 \\implies S_{\\text{圆}} = S_{\\text{棱}}`,
        rubric:
          "[高考规范采分] 明确构造等底等高伴随正四棱锥并列出底面积恒等式 (+3分)",
      },
      {
        step: 2,
        title: "建模联立 · 代入等高切片截面面积解析式",
        detail:
          "在任意高度 $z$（$0 \\le z \\le h$）处作平行于底面的水平截面。截面到顶点的距离为 $h - z$。由相似三角形性质，圆锥截面圆半径为 $r(z) = r \\cdot \\frac{h-z}{h}$；正四棱锥截面正方形边长为 $a(z) = a \\cdot \\frac{h-z}{h}$。代入面积公式对账：",
        latex: `S_1(z) = \\pi [r(z)]^2 = \\pi r^2 \\left(\\frac{h-z}{h}\\right)^2, \\quad S_2(z) = [a(z)]^2 = a^2 \\left(\\frac{h-z}{h}\\right)^2 \\implies S_1(z) \\equiv S_2(z)`,
        rubric:
          "[高考规范采分] 准确运用相似比写出截面积解析式并严格证明恒等 (+5分)",
      },
      {
        step: 3,
        title: "求解反思 · 祖暅公理导出圆锥体积通式",
        detail:
          "由于对任意高度 $z \\in [0, h]$，截面面积总相等 $S_1(z) \\equiv S_2(z)$，由祖暅原理得圆锥体积等于伴随正四棱锥体积，从而完成从多面体到旋转体锥体体积的严格演绎闭环：",
        latex: `V_{\\text{圆锥}} = V_{\\text{正棱锥}} = \\frac{1}{3} S_{\\text{底}} h = \\frac{1}{3}\\pi \\color{${MATH_COLORS.paramPrimary}}{r}^2 \\color{${MATH_COLORS.paramTertiary}}{h} = \\frac{1}{3} \\cdot \\pi \\times (${data.radius.toFixed(2)})^2 \\times ${data.height.toFixed(2)} = ${data.volume.toFixed(2)}`,
        rubric:
          "[高考规范采分] 准确引用祖暅原理给出最终体积代数式与计算值 (+4分)",
      },
    );

    gaokaoPoints.push({
      importance: "gaokao",
      text: "【旋转体等积转化大招】利用祖暅原理将曲面旋转体（圆锥、球体）转化为易于建系或容易计算的多面体，是破解高考多面体与旋转体交汇综合题的降维核心。",
    });

    warnings.push({
      level: "info",
      text: "【定义域与临界条件】截面高度 z 必须满足 0 ≤ z ≤ h。当 z = h 时，截面收缩退化为单一点（顶点），面积退化为 0。",
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
