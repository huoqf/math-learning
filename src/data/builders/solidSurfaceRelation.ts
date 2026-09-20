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
  calculateParallelJudgeState,
  calculateParallelIntersectionLines,
  calculatePerpJudgeFamily,
  calculatePerpPropState,
  calculatePyramidPerpModel,
  calculateCubeDiagonalModel,
} from "@/math3d/surfaceRelation";

// ── know-solid-surface-relation: 面面平行与垂直判定及性质定理 ──

export function buildSurfaceRelationPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as string) ?? "parallelJudge";
  const subType = (config?.subType as string) ?? "standard"; // "standard" | "counterExample" | "intersectProp" | "dualPerp"
  const zHeight = params.zHeight ?? 2.2;
  const tiltDeg = params.tiltDeg ?? 0;
  const azimuthDeg = params.azimuthDeg ?? 30;
  const planeRotDeg = params.planeRotDeg ?? 45;
  const lineThetaDeg = params.lineThetaDeg ?? 90;
  const posO = params.posO ?? 0.5;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  let mnemonic = "";

  if (mode === "parallelJudge") {
    const isIntersect = subType !== "counterExample";
    const judgeState = calculateParallelJudgeState(
      isIntersect,
      tiltDeg,
      zHeight,
    );

    quantities.push(
      {
        label: "平面 α 法向量 n₁",
        symbol: "\\vec{n_1}",
        value: `(${judgeState.alphaNormal.x.toFixed(2)}, ${judgeState.alphaNormal.y.toFixed(2)}, ${judgeState.alphaNormal.z.toFixed(2)})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "平面 β 法向量 n₂",
        symbol: "\\vec{n_2}",
        value: "(0.00, 0.00, 1.00)",
        color: MATH_COLORS.secondary,
      },
      {
        label: "面内两线位置关系",
        value: isIntersect
          ? "两条直线 a, b 相交于点 P"
          : "两条直线 a, b 互相平行",
        color: isIntersect ? MATH_COLORS.highlight : MATH_COLORS.paramSecondary,
      },
      {
        label: "两平面判定结论",
        value: judgeState.isAlphaParallelToBeta
          ? "面面平行 (α ∥ β)"
          : "两面相交 (反例成立)",
        color: judgeState.isAlphaParallelToBeta
          ? MATH_COLORS.highlight
          : MATH_COLORS.textMuted,
      },
    );

    theorems.push(
      {
        name: "面面平行判定定理 (几何法)",
        latex: `\\begin{cases} a \\subset \\alpha, \\; b \\subset \\alpha \\\\ a \\cap b = P \\\\ a \\parallel \\beta, \\; b \\parallel \\beta \\end{cases} \\;\\Rightarrow\\; \\alpha \\parallel \\beta`,
        level: "core",
        condition: "一个平面内的两条【相交】直线分别平行于另一个平面",
      },
      {
        name: "面面平行向量法判定 (法向量共线)",
        latex: `\\vec{n_1} \\parallel \\vec{n_2} \\;\\Leftrightarrow\\; \\vec{n_1} = k\\vec{n_2} \\; (k \\neq 0) \\;\\Rightarrow\\; \\alpha \\parallel \\beta`,
        level: "core",
        condition: "两个平面的法向量互相平行 (成比例)",
      },
    );

    gaokaoPoints.push(
      {
        text: "【高考命题必考反例】若一个平面内的两条【平行】直线分别平行于另一个平面，则两平面可能平行，也可能相交（如三棱柱的两个侧面与底面，交线平行于底面）。证明时遗漏 a ∩ b = P 扣 2 分！",
        importance: "gaokao",
      },
      {
        text: "【转化思维链】证明面面平行标准链：线线平行 (中位线/平行四边形) ➔ 线面平行 (面外面内声明) ➔ 面面平行 (两条相交线)。",
        importance: "gaokao",
      },
    );

    if (!judgeState.isAlphaParallelToBeta) {
      warnings.push({
        text: `🚨【反例警示】当前 a ∥ b (两条平行线)，当平面 α 绕直线 a 倾斜 θ = ${tiltDeg}° 时，α 与 β 产生交线，面面平行不再成立！`,
        level: "danger",
      });
    }

    mnemonic =
      "相交两线定平行，平行两线出相交；转化层层步步严，法向成比算得快。";
  } else if (mode === "parallelProp") {
    const lines = calculateParallelIntersectionLines(zHeight, 45, azimuthDeg);

    quantities.push(
      {
        label: "平行平面间距 d",
        symbol: "d(\\alpha, \\beta)",
        value: zHeight.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "交线 a 方向向量 (面β)",
        symbol: "\\vec{u_a}",
        value: `(${lines.lineDir.x.toFixed(2)}, ${lines.lineDir.y.toFixed(2)}, 0.00)`,
        color: MATH_COLORS.primary,
      },
      {
        label: "交线 b 方向向量 (面α)",
        symbol: "\\vec{u_b}",
        value: `(${lines.lineDir.x.toFixed(2)}, ${lines.lineDir.y.toFixed(2)}, 0.00)`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "交线位置关系",
        value: "a ∥ b (截线恒平行)",
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "面面平行性质定理 1 (截线平行)",
        latex: `\\begin{cases} \\alpha \\parallel \\beta \\\\ \\gamma \\cap \\alpha = a \\\\ \\gamma \\cap \\beta = b \\end{cases} \\;\\Rightarrow\\; a \\parallel b`,
        level: "core",
        condition: "两个平行平面同时与第三个平面相交，它们的交线平行",
      },
      {
        name: "面面平行性质定理 2 (垂线共性)",
        latex: `\\alpha \\parallel \\beta, \\; l \\perp \\alpha \\;\\Rightarrow\\; l \\perp \\beta`,
        level: "core",
        condition: "一条直线垂直于两个平行平面中的一个，必垂直于另一个",
      },
      {
        name: "平行平面间的距离公式",
        latex: `d(\\alpha, \\beta) = \\frac{|\\vec{AB} \\cdot \\vec{n}|}{|\\vec{n}|}`,
        level: "important",
        note: "点 $A \\in \\alpha$, $B \\in \\beta$，$\\vec{n}$ 为平面 $\\alpha$ 的法向量（由 $\\vec{n} \\cdot \\vec{PQ} = 0$ 与 $\\vec{n} \\cdot \\vec{PR} = 0$ 联立求得）",
      },
    );

    gaokaoPoints.push(
      {
        text: "【高考截面作图神器】在正方体/多面体截面大题中，若截面穿过两个平行面，则在两个面上的截线必相互平行。利用此性质可直接连线定出截面多边形顶点！",
        importance: "gaokao",
      },
      {
        text: "【面面平行距离解题】公垂线段在两平面间任意平移长度不变；求两平行面距离可转化为求其中一个面内任一点到另一面的点面距离。",
        importance: "gaokao",
      },
    );

    mnemonic =
      "平行双面截第三，交线平行立可推；垂线一穿两面过，距离处处皆均等。";
  } else if (mode === "perpJudge") {
    const fam = calculatePerpJudgeFamily(planeRotDeg);

    quantities.push(
      {
        label: "平面 α 法向量 n₁",
        symbol: "\\vec{n_1}",
        value: "(0.00, 0.00, 1.00)",
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "平面 β 法向量 n₂",
        symbol: "\\vec{n_2}",
        value: `(${fam.betaNormal.x.toFixed(2)}, ${fam.betaNormal.y.toFixed(2)}, 0.00)`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "法向量数量积 n₁ · n₂",
        symbol: "\\vec{n_1} \\cdot \\vec{n_2}",
        value: "0.00",
        color: MATH_COLORS.highlight,
      },
      {
        label: "二面角平面角",
        symbol: "\\theta_{\\text{二面角}}",
        value: "90.00°",
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "面面垂直判定定理 (线面垂直推面面垂直)",
        latex: `l \\perp \\alpha, \\; l \\subset \\beta \\;\\Rightarrow\\; \\beta \\perp \\alpha`,
        level: "core",
        condition: "一个平面经过另一个平面的一条垂线，则这两个平面互相垂直",
      },
      {
        name: "面面垂直向量法判定 (法向量内积为0)",
        latex: `\\vec{n_1} \\perp \\vec{n_2} \\;\\Leftrightarrow\\; \\vec{n_1} \\cdot \\vec{n_2} = 0 \\;\\Rightarrow\\; \\alpha \\perp \\beta`,
        level: "core",
        condition: "两平面的法向量互相垂直",
      },
    );

    gaokaoPoints.push(
      {
        text: "【证明面面垂直首选通法】立体几何第(1)问证明面面垂直，95% 的题型都是先证“线面垂直”：在其中一个面内找到一条直线垂直于另一个平面，直接使用判定定理下结论！",
        importance: "gaokao",
      },
      {
        text: "【垂面族直观理解】只要固定底面垂线 l，绕着 l 旋转的任意一个半透明平面 β，与底面构成的二面角始终为 90°。",
        importance: "gaokao",
      },
    );

    mnemonic =
      "线面垂直生垂面，过垂线面任旋转；法向相乘积为零，二面直角定理显。";
  } else if (mode === "perpProp") {
    const isDualPerp = subType === "dualPerp";
    const propState = calculatePerpPropState(lineThetaDeg);

    quantities.push(
      {
        label: "直线 a 与交线夹角 θ",
        symbol: "\\theta = \\angle(a, l)",
        value: `${lineThetaDeg.toFixed(1)}°`,
        color: propState.isPerpToAlpha
          ? MATH_COLORS.highlight
          : MATH_COLORS.paramSecondary,
      },
      {
        label: "直线 a 与底面线面角",
        symbol: "\\angle(a, \\alpha)",
        value: `${propState.linePlaneAngleDeg.toFixed(1)}°`,
        color: propState.isPerpToAlpha
          ? MATH_COLORS.highlight
          : MATH_COLORS.textMuted,
      },
      {
        label: "线面垂直判定结论",
        value: propState.isPerpToAlpha
          ? "a ⊥ 平面 α (成立)"
          : "a ⊥ α 不成立 (斜交)",
        color: propState.isPerpToAlpha
          ? MATH_COLORS.highlight
          : MATH_COLORS.paramPrimary,
      },
    );

    theorems.push(
      {
        name: "面面垂直性质定理 1 (高考必背)",
        latex: `\\begin{cases} \\alpha \\perp \\beta \\\\ \\alpha \\cap \\beta = l \\\\ a \\subset \\alpha \\\\ a \\perp l \\end{cases} \\;\\Rightarrow\\; a \\perp \\beta`,
        level: "core",
        condition:
          "两平面垂直，在其中一个面内【垂直于交线】的直线必垂直于另一个平面",
      },
      {
        name: "面面垂直性质拓展 (双垂直交线定理)",
        latex: `\\begin{cases} \\alpha \\perp \\gamma \\\\ \\beta \\perp \\gamma \\\\ \\alpha \\cap \\beta = l \\end{cases} \\;\\Rightarrow\\; l \\perp \\gamma`,
        level: "important",
        condition:
          "两个相交平面都垂直于第三个平面，它们的交线垂直于第三个平面 (高考常用二级结论)",
      },
    );

    gaokaoPoints.push(
      {
        text: "【高考失分重灾区·4步得分律】使用面面垂直性质定理作高线时，必须严格写全4步：① 面面垂直；② 交线 l；③ 直线 a 在面内；④ a ⊥ l。四步缺一不可！",
        importance: "gaokao",
      },
      {
        text: "【求高求点面距通法】题目给出“侧面 ⊥ 底面”时，第一反应是在侧面内过顶点向底边交线作垂线，此垂线即为几何体的高！",
        importance: "gaokao",
      },
    );

    if (!propState.isPerpToAlpha && !isDualPerp) {
      warnings.push({
        text: `🚨【高考极高频扣分反例】当前直线 a 与交线夹角 θ = ${lineThetaDeg}° (≠ 90°)。只有当 a 垂直于交线时，a 才能垂直于底面 α！`,
        level: "danger",
      });
    }

    mnemonic =
      "面面垂直找交线，面内垂交垂直面；若非交线垂直线，断难推出线垂直。";
  } else if (mode === "gaokaoModel" && subType === "cube") {
    const cube = calculateCubeDiagonalModel(3);

    quantities.push(
      {
        label: "正方体棱长 a",
        symbol: "a",
        value: cube.s.toFixed(2),
        color: MATH_COLORS.secondary,
      },
      {
        label: "体对角线长 BD₁",
        symbol: "|BD_1| = \\sqrt{3}a",
        value: cube.diagonalLength.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "平行截面间距 d",
        symbol: "d = \\frac{\\sqrt{3}}{3}a",
        value: cube.planeDistance.toFixed(2),
        color: MATH_COLORS.highlight,
      },
      {
        label: "三等分段长 BM=MN=ND₁",
        symbol: "\\frac{1}{3}|BD_1|",
        value: cube.segmentLength.toFixed(2),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "截面与体对角线位置",
        value: "两截面平行且均垂直于 BD₁",
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "正方体对角截面平行与垂直定理",
        latex: `\\begin{cases} \\text{面 } A_1C_1D \\parallel \\text{面 } AB_1C \\\\ BD_1 \\perp \\text{面 } A_1C_1D \\\\ BD_1 \\perp \\text{面 } AB_1C \\end{cases}`,
        level: "core",
        condition:
          "正方体中过互为面对角线的两组三顶点截面平行，且公法线为正方体体对角线",
      },
      {
        name: "体对角线三等分性质",
        latex: `|BM| = |MN| = |ND_1| = \\frac{1}{3}|BD_1| = \\frac{\\sqrt{3}}{3}a`,
        level: "core",
        condition: "交点 M, N 分别为正三角形 △AB₁C 与 △A₁C₁D 的中心",
      },
      {
        name: "平行截面距离公式",
        latex: `d(\\text{面 } A_1C_1D, \\text{面 } AB_1C) = |MN| = \\frac{\\sqrt{3}}{3}a`,
        level: "important",
        note: "两平行平面的距离转化为公垂线段 MN 的长度",
      },
    );

    gaokaoPoints.push(
      {
        text: "【高考经典母题·秒杀考点】正方体 ABCD-A₁B₁C₁D₁ 中，截面 A₁C₁D ∥ 面 AB₁C，体对角线 BD₁ 垂直于两截面并被其三等分。两平行平面间距离 d = (√3/3)a，顶点 B 到截面 A₁C₁D 的距离等于 (2√3/3)a。",
        importance: "gaokao",
      },
      {
        text: "【线面垂直两步证明法】在面 AB₁C 中，由于 AC ⊥ BD 且 AC ⊥ DD₁，故 AC ⊥ 面 BDD₁B₁，从而 AC ⊥ BD₁；同理 AB₁ ⊥ BD₁，因 AC 与 AB₁ 相交，故 BD₁ ⊥ 面 AB₁C。",
        importance: "gaokao",
      },
    );

    mnemonic =
      "对角三顶截平行，体轴垂直穿中行；两面截出三等分，点面距离公式灵。";
  } else if (mode === "gaokaoModel") {
    // 高考综合模型：四棱锥 (pyramid)
    const pyr = calculatePyramidPerpModel(
      params.pyramidA ?? 3.6,
      params.pyramidB ?? 2.8,
      params.pyramidH ?? 3.2,
      posO,
    );

    quantities.push(
      {
        label: "四棱锥高 PO",
        symbol: "h = |PO|",
        value: pyr.height.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "垂足 O 分点比例",
        symbol: "\\lambda_O = AO/AD",
        value: posO.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "侧面 PAD 与底面位置",
        value: "平面 PAD ⊥ 平面 ABCD",
        color: MATH_COLORS.highlight,
      },
      {
        label: "高线 PO 与底面位置",
        value: "PO ⊥ 底面 ABCD",
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "四棱锥侧面垂直底面作高法则",
        latex: `\\begin{cases} \\text{面}PAD \\perp \\text{面}ABCD \\\\ \\text{面}PAD \\cap \\text{面}ABCD = AD \\\\ PO \\subset \\text{面}PAD, \\; PO \\perp AD \\end{cases} \\;\\Rightarrow\\; PO \\perp \\text{面}ABCD`,
        level: "core",
        condition: "四棱锥高 PO 的严密证明格式",
      },
      {
        name: "空间直角坐标系建系规范",
        latex: `O(0,0,0) \\text{ 为原点},\\; \\vec{OD}\\text{ 为 } y \\text{ 轴},\\; \\vec{OP}\\text{ 为 } z \\text{ 轴},\\; \\text{作 } Ox \\perp AD \\text{ 为 } x \\text{ 轴}`,
        level: "core",
        condition: "利用垂直性质定理确立互相垂直的三条射线建系",
      },
    );

    gaokaoPoints.push(
      {
        text: "【高考大题两问全流程】第(1)问：利用面面垂直性质定理证明 PO ⊥ 底面 ABCD；第(2)问：以垂足 O 为原点建立空间直角坐标系，求各点坐标及面 PBC 的法向量，用向量法求二面角或线面角余弦值。",
        importance: "gaokao",
      },
      {
        text: "【正方体面面平行对角面】正方体 ABCD-A₁B₁C₁D₁ 中，面 A₁C₁D ∥ 面 AB₁C，两平面将体对角线 BD₁ 三等分，是高考截面与距离的高频背景。",
        importance: "gaokao",
      },
    );

    mnemonic =
      "四棱锥中垂面立，垂足作高是正理；以垂为原建坐标，向量求角步步明。";
  }

  let reasoningSteps: ReasoningStep[];

  if (mode === "parallelJudge" || mode === "parallelProp") {
    reasoningSteps = [
      {
        step: 1,
        title: "审题定法 · 提炼面内两相交直线",
        detail:
          "证明面面平行需紧扣判定定理核心：必须在一个平面内找到两条相交直线，分别平行于另一个平面：",
        latex: `a \\subset \\alpha, \\quad b \\subset \\alpha, \\quad a \\cap b = P`,
        rubric: "[高考采分点] 明确列出面内两相交直线关键要件 (+4分)",
      },
      {
        step: 2,
        title: "建模联立 · 转化线面平行并应用判定定理",
        detail:
          "分别证明两条相交直线平行于目标平面，或利用性质定理转化交线平行关系：",
        latex: `a \\parallel \\beta, \\quad b \\parallel \\beta \\implies \\text{平面 } \\alpha \\parallel \\text{平面 } \\beta`,
        rubric: "[高考采分点] 严密完成线面平行到面面平行的逻辑推导 (+5分)",
      },
      {
        step: 3,
        title: "求解反思 · 检验相交要件与交线平行性质",
        detail:
          "由面面平行性质定理，若第三个平面与两平行平面相交，则所得交线必平行；严防两条线平行的伪证明漏洞：",
        latex: `\\alpha \\parallel \\beta, \\quad \\gamma \\cap \\alpha = a, \\quad \\gamma \\cap \\beta = b \\implies a \\parallel b`,
        rubric: "[高考采分点] 完整得出面面平行或交线平行性质结论 (+4分)",
      },
    ];
  } else if (mode === "perpJudge" || mode === "perpProp") {
    reasoningSteps = [
      {
        step: 1,
        title: "审题定法 · 提炼交线与面内垂直线",
        detail:
          "分析两平面垂直关系。对于面面垂直性质定理，必须严格核验四要素：两面垂直、相交交线、面内直线、垂直于交线：",
        latex: `\\alpha \\perp \\beta, \\quad \\alpha \\cap \\beta = l, \\quad a \\subset \\alpha, \\quad a \\perp l`,
        rubric: "[高考采分点] 准确写出面面垂直性质定理四要件前提 (+4分)",
      },
      {
        step: 2,
        title: "建模联立 · 导出线面垂直与建立直角坐标系",
        detail:
          "由性质定理导出直线垂直于另一平面 (a ⊥ β)。以垂足为坐标原点，建立空间直角坐标系：",
        latex: `a \\perp \\beta \\implies \\text{以垂足为原点建立空间直角坐标系 } O-xyz`,
        rubric: "[高考采分点] 严密推导线面垂直并确立建系垂直三轴 (+5分)",
      },
      {
        step: 3,
        title: "求解反思 · 判定定理充要验证与格式规范",
        detail:
          "面面垂直判定定理：平面内有一条直线垂直于另一平面，则两平面垂直；书写必须符合高考阅卷得分规范：",
        latex: `a \\subset \\alpha, \\quad a \\perp \\beta \\implies \\alpha \\perp \\beta`,
        rubric: "[高考采分点] 完整书写面面垂直标准判定与性质结论 (+4分)",
      },
    ];
  } else {
    // gaokaoModel / 综合模式
    reasoningSteps = [
      {
        step: 1,
        title: "审题定法 · 识别四棱锥垂面模型",
        detail:
          "在高考经典四棱锥或折展模型中，侧面垂直于底面是解题核心突破口。提炼交线与顶点在底面的正投影：",
        latex: `\\text{面 } PAB \\perp \\text{面 } ABCD, \\quad \\text{面 } PAB \\cap \\text{面 } ABCD = AB, \\quad PO \\perp AB \\implies PO \\perp \\text{底面 } ABCD`,
        rubric: "[高考采分点] 准确判定棱锥高线与垂足位置 (+4分)",
      },
      {
        step: 2,
        title: "建模联立 · 以垂足为原点建立空间直角坐标系",
        detail:
          "以高线垂足 O 为坐标原点，高线 PO 为 z 轴，底面垂线及平行线为 x, y 轴建立空间直角坐标系：",
        latex: `O(0,0,0), \\quad P(0,0,h), \\quad \\vec{n}_{\\text{底}} = (0, 0, 1)`,
        rubric: "[高考采分点] 正确建立空间直角坐标系并列出各点坐标向量 (+5分)",
      },
      {
        step: 3,
        title: "求解反思 · 代数法求二面角与规范作答",
        detail:
          "求出斜侧面法向量，应用向量夹角公式计算二面角余弦值，并根据钝二面角或锐二面角特征确定符号：",
        latex: `\\cos\\theta = \\frac{|\\vec{n}_1 \\cdot \\vec{n}_2|}{|\\vec{n}_1||\\vec{n}_2|}`,
        rubric: "[高考采分点] 规范得出二面角余弦值并完成作答 (+4分)",
      },
    ];
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic,
  };
}
