import type { MathPanelData } from "../types";
import { computeVectorDotProduct } from "@/math/vectorDotProduct";
import type {
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "@/components/UI";
import { MATH_COLORS } from "@/theme";

export function buildVectorDotProductPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) || "defProj";

  const mathRes = computeVectorDotProduct(params);

  const {
    normA,
    normB,
    normA2,
    normB2,
    dotProduct,
    cosTheta,
    angleDeg,
    angleType,
    scalarProjBtoA,
    projVecBtoA,
    footH,
    scalarProjAtoB,
    projVecAtoB,
    normSum,
    normDiff,
    normSum2,
    normDiff2,
    isPerpendicular,
    polarizationVal,
    midpointM,
    normOM,
    normMB,
    polarizationMidVal,
  } = mathRes;

  const quantities: MathQuantity[] = [];

  if (studyMode === "defProj") {
    const angleTextMap: Record<string, string> = {
      zero: "0° (同向共线)",
      acute: "锐角",
      right: "90° (垂直)",
      obtuse: "钝角",
      pi: "180° (反向共线)",
    };

    quantities.push(
      {
        label: "向量 a 的模长",
        symbol: "|\\vec{a}|",
        value: normA.toFixed(2),
      },
      {
        label: "向量 b 的模长",
        symbol: "|\\vec{b}|",
        value: normB.toFixed(2),
      },
      {
        label: "向量 a 与 b 的夹角",
        symbol: "\\theta",
        value: `${angleDeg.toFixed(1)}° (${angleTextMap[angleType] ?? ""})`,
      },
      {
        label: "夹角余弦值",
        symbol: "\\cos\\theta",
        value: cosTheta.toFixed(3),
      },
      {
        label: "数量积 (a · b)",
        symbol: "\\vec{a} \\cdot \\vec{b}",
        value: dotProduct.toFixed(2),
      },
      {
        label: "b 在 a 方向上的投影数量",
        symbol: "|\\vec{b}|\\cos\\theta",
        value: scalarProjBtoA.toFixed(2),
      },
      {
        label: "b 在 a 方向上的投影向量",
        symbol: "\\vec{p}_{\\vec{a}}(\\vec{b})",
        value: `(${projVecBtoA.x.toFixed(2)}, ${projVecBtoA.y.toFixed(2)})`,
      },
      {
        label: "垂足 H 坐标",
        symbol: "H",
        value: `(${footH.x.toFixed(2)}, ${footH.y.toFixed(2)})`,
      },
      {
        label: "a 在 b 方向上的投影数量",
        symbol: "|\\vec{a}|\\cos\\theta",
        value: scalarProjAtoB.toFixed(2),
      },
      {
        label: "a 在 b 方向上的投影向量",
        symbol: "\\vec{p}_{\\vec{b}}(\\vec{a})",
        value: `(${projVecAtoB.x.toFixed(2)}, ${projVecAtoB.y.toFixed(2)})`,
      },
    );
  } else if (studyMode === "properties") {
    quantities.push(
      {
        label: "数量积 (坐标计算 x1x2 + y1y2)",
        symbol: "\\vec{a} \\cdot \\vec{b}",
        value: dotProduct.toFixed(2),
      },
      {
        label: "模长平方 |a|²",
        symbol: "|\\vec{a}|^2",
        value: normA2.toFixed(2),
      },
      {
        label: "模长平方 |b|²",
        symbol: "|\\vec{b}|^2",
        value: normB2.toFixed(2),
      },
      {
        label: "和向量 a + b 模长",
        symbol: "|\\vec{a} + \\vec{b}|",
        value: normSum.toFixed(2),
      },
      {
        label: "差向量 a - b 模长",
        symbol: "|\\vec{a} - \\vec{b}|",
        value: normDiff.toFixed(2),
      },
      {
        label: "垂直状态判定",
        value: isPerpendicular ? "垂直 (a ⊥ b, a·b = 0)" : "不垂直 (a·b ≠ 0)",
      },
    );
  } else {
    // polarization 模式
    quantities.push(
      {
        label: "数量积 (左式)",
        symbol: "\\vec{a} \\cdot \\vec{b}",
        value: dotProduct.toFixed(2),
      },
      {
        label: "和向量模长平方",
        symbol: "|\\vec{a} + \\vec{b}|^2",
        value: normSum2.toFixed(2),
      },
      {
        label: "差向量模长平方",
        symbol: "|\\vec{a} - \\vec{b}|^2",
        value: normDiff2.toFixed(2),
      },
      {
        label: "极化恒等式 (平行四边形展开)",
        symbol: "\\frac{1}{4}(|\\vec{a}+\\vec{b}|^2 - |\\vec{a}-\\vec{b}|^2)",
        value: polarizationVal.toFixed(2),
      },
      {
        label: "线段 AB 中点 M 坐标",
        symbol: "M",
        value: `(${midpointM.x.toFixed(2)}, ${midpointM.y.toFixed(2)})`,
      },
      {
        label: "中线长 |OM|",
        symbol: "|\\vec{OM}|",
        value: normOM.toFixed(2),
      },
      {
        label: "半边长 |MA| = |MB|",
        symbol: "|\\vec{MB}|",
        value: normMB.toFixed(2),
      },
      {
        label: "中点极化值 (|OM|² - |MB|²)",
        symbol: "|\\vec{OM}|^2 - |\\vec{MB}|^2",
        value: polarizationMidVal.toFixed(2),
      },
    );
  }

  const primaryCol = MATH_COLORS.paramPrimary;
  const secondaryCol = MATH_COLORS.paramSecondary;
  const tertiaryCol = MATH_COLORS.paramTertiary;

  const theorems: Theorem[] = [
    {
      name: "数量积几何定义与坐标公式",
      latex: `\\color{${primaryCol}}{\\vec{a}} \\cdot \\color{${secondaryCol}}{\\vec{b}} = |\\color{${primaryCol}}{\\vec{a}}||\\color{${secondaryCol}}{\\vec{b}}|\\cos\\theta = x_1 x_2 + y_1 y_2`,
      prerequisites: [
        "θ 为向量 a 与 b 的夹角 (θ ∈ [0, π])",
        "零向量与任意向量的数量积均为 0",
      ],
      level: studyMode === "defProj" ? "core" : "important",
    },
    {
      name: "人教A版向量投影（投影数量与投影向量）",
      latex: `\\text{投影数量} = |\\color{${secondaryCol}}{\\vec{b}}|\\cos\\theta = \\frac{\\color{${primaryCol}}{\\vec{a}}\\cdot\\color{${secondaryCol}}{\\vec{b}}}{|\\color{${primaryCol}}{\\vec{a}}|}, \\quad \\color{${tertiaryCol}}{\\vec{p}} = \\frac{\\color{${primaryCol}}{\\vec{a}}\\cdot\\color{${secondaryCol}}{\\vec{b}}}{|\\color{${primaryCol}}{\\vec{a}}|^2}\\color{${primaryCol}}{\\vec{a}}`,
      prerequisites: [
        "投影数量为带正负的实数 (锐角为正，钝角为负，垂直为0)",
        "投影向量为与向量 a 共线的矢量",
      ],
      level: studyMode === "defProj" ? "core" : "important",
    },
    {
      name: "模长二次展开与垂直条件",
      latex: `|\\color{${primaryCol}}{\\vec{a}} \\pm \\color{${secondaryCol}}{\\vec{b}}|^2 = |\\color{${primaryCol}}{\\vec{a}}|^2 \\pm 2\\color{${primaryCol}}{\\vec{a}}\\cdot\\color{${secondaryCol}}{\\vec{b}} + |\\color{${secondaryCol}}{\\vec{b}}|^2, \\quad \\color{${primaryCol}}{\\vec{a}} \\perp \\color{${secondaryCol}}{\\vec{b}} \\iff x_1 x_2 + y_1 y_2 = 0`,
      prerequisites: [
        "a, b 为非零向量时，a ⊥ b 充要条件为 a · b = 0",
        "注意区分垂直条件 x1x2+y1y2=0 与共线条件 x1y2-x2y1=0",
      ],
      level: studyMode === "properties" ? "core" : "important",
    },
    {
      name: "极化恒等式 (高考压轴秒杀模型)",
      latex: `\\color{${primaryCol}}{\\vec{OA}} \\cdot \\color{${secondaryCol}}{\\vec{OB}} = \\frac{1}{4}\\left(|\\vec{OA}+\\vec{OB}|^2 - |\\vec{OA}-\\vec{OB}|^2\\right) = |\\color{${tertiaryCol}}{\\vec{OM}}|^2 - |\\vec{MB}|^2`,
      prerequisites: [
        "M 为定线段 AB 的中点",
        "将双变量数量积 OA·OB 转化为单动点中线长 |OM|² 的最值求解",
      ],
      level: studyMode === "polarization" ? "core" : "important",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "新课标核心：投影数量与投影向量的严格辨析。投影数量是标量 (|b|cosθ)，锐角时 >0，钝角时 <0，直角时为 0；投影向量是矢量，与向量 a 同向或反向。",
      importance: "gaokao",
    },
    {
      text: "易错点辨析：a·b = 0 是 a ⊥ b 的充分不必要条件 (需排除零向量)。a ⊥ b 充要条件为 x1x2 + y1y2 = 0；而 a // b 充要条件为 x1y2 - x2y1 = 0，严禁记混！",
      importance: "gaokao",
    },
    {
      text: "高考压轴秒杀技巧——极化恒等式：求数量积 OA·OB 的最值或范围时，取 AB 中点 M，立刻写出 OA·OB = |OM|² - |MB|²。当 AB 为定长时 |MB| 为常数，数量积最值完全转化为求动点到定点 M 的距离最值！",
      importance: "gaokao",
    },
  ];

  const warnings: WarningItem[] = [];
  if (normA < 1e-4 || normB < 1e-4) {
    warnings.push({
      text: "零向量警示：零向量与任意向量的数量积均为 0，且零向量方向不定，不能定义投影向量与夹角！",
      level: "danger",
    });
  }

  if (studyMode === "defProj" && angleType === "right") {
    warnings.push({
      text: "垂直状态提示：当前两向量垂直 (a ⊥ b)，数量积为 0，投影数量为 0，垂足 H 重合于原点 O。",
      level: "warning",
    });
  }

  if (studyMode === "defProj" && angleType === "obtuse") {
    warnings.push({
      text: "钝角投影提示：夹角 θ 为钝角 (cosθ < 0)，投影数量为负值，垂足 H 落在向量 a 的反向延长线上！",
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "数量乘模余弦角，坐标相乘加起来；投影数量带正负，极化恒等中点秒！",
  };
}
