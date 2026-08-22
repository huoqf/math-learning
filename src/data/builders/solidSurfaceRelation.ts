import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  calculateParallelJudgeState,
  calculateParallelIntersectionLines,
  calculatePerpJudgeFamily,
  calculatePerpPropState,
  calculatePyramidPerpModel,
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
        latex: `d(\\alpha, \\beta) = \\frac{|\\vec{AB} \\cdot \\vec{n}|}{|\\vec{n}|} = \\frac{|D_1 - D_2|}{\\sqrt{A^2 + B^2 + C^2}}`,
        level: "important",
        note: "A, B 分别为两平面上任意一点，n 为平面的法向量",
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
        name: "面面垂直性质定理 2 (双垂直交线定理)",
        latex: `\\begin{cases} \\alpha \\perp \\gamma \\\\ \\beta \\perp \\gamma \\\\ \\alpha \\cap \\beta = l \\end{cases} \\;\\Rightarrow\\; l \\perp \\gamma`,
        level: "important",
        condition: "两个相交平面都垂直于第三个平面，它们的交线垂直于第三个平面",
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
  } else {
    // 高考综合模型 (gaokaoModel)
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

  return { quantities, theorems, gaokaoPoints, warnings, mnemonic };
}
