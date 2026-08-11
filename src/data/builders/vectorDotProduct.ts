import type { MathPanelData } from "../types";
import { computeVectorDotProduct } from "@/math/vectorDotProduct";
import type {
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "@/components/UI";

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
        symbol: "W_{\\vec{a}}(\\vec{b})",
        value: scalarProjBtoA.toFixed(2),
      },
      {
        label: "b 在 a 方向上的投影向量",
        symbol: "\\mathbf{proj}_{\\vec{a}}\\vec{b}",
        value: `(${projVecBtoA.x.toFixed(2)}, ${projVecBtoA.y.toFixed(2)})`,
      },
      {
        label: "垂足 H 坐标",
        symbol: "H",
        value: `(${footH.x.toFixed(2)}, ${footH.y.toFixed(2)})`,
      },
      {
        label: "a 在 b 方向上的投影数量",
        symbol: "W_{\\vec{b}}(\\vec{a})",
        value: scalarProjAtoB.toFixed(2),
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
        label: "和向量 s = a + b 模长",
        symbol: "|\\vec{a} + \\vec{b}|",
        value: normSum.toFixed(2),
      },
      {
        label: "差向量 d = a - b 模长",
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
        label: "极化右式 1/4(|a+b|² - |a-b|²)",
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

  const theorems: Theorem[] = [
    {
      name: "数量积几何定义与坐标公式",
      latex:
        "\\vec{a} \\cdot \\vec{b} = |\\vec{a}||\\vec{b}|\\cos\\theta = x_1 x_2 + y_1 y_2",
      prerequisites: [
        "θ 为向量 a 与 b 的夹角 (θ ∈ [0, π])",
        "零向量与任意向量的数量积均为 0",
      ],
    },
    {
      name: "向量投影（数量投影与投影向量）",
      latex:
        "W_{\\vec{a}}(\\vec{b}) = |\\vec{b}|\\cos\\theta = \\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}|}, \\quad \\mathbf{proj}_{\\vec{a}}\\vec{b} = \\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}|^2}\\vec{a}",
      prerequisites: [
        "投影数量为实数（锐角为正，钝角为负）",
        "投影向量与 a 共线（同向或反向）",
      ],
    },
    {
      name: "模长展开与垂直条件",
      latex:
        "|\\vec{a} \\pm \\vec{b}|^2 = |\\vec{a}|^2 \\pm 2\\vec{a}\\cdot\\vec{b} + |\\vec{b}|^2, \\quad \\vec{a} \\perp \\vec{b} \\iff \\vec{a}\\cdot\\vec{b} = 0",
      prerequisites: ["a, b 为非零向量时，a ⊥ b 充要条件为 x1x2 + y1y2 = 0"],
    },
    {
      name: "极化恒等式 (高考秒杀神器)",
      latex:
        "\\vec{a} \\cdot \\vec{b} = \\frac{1}{4}\\left(|\\vec{a}+\\vec{b}|^2 - |\\vec{a}-\\vec{b}|^2\\right) = |\\vec{OM}|^2 - |\\vec{MB}|^2",
      prerequisites: [
        "M 为线段 AB 的中点",
        "将双变量数量积转化为了中点距离平方差单变量问题",
      ],
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "高考必考：数量积的物理与几何意义。W = |b|cosθ 表示向量 b 在 a 方向上的投影数量。当 θ 为锐角时投影数量 > 0；当 θ 为钝角时投影数量 < 0；垂直时为 0。",
      importance: "gaokao",
    },
    {
      text: "易错点防范：a·b > 0 是 θ 为锐角或 0° 的充要条件。若题目要求夹角为锐角，必须剔除 a // b (同向) 即 θ = 0° 的情况！",
      importance: "gaokao",
    },
    {
      text: "高考秒杀技巧——极化恒等式：求矢量数量积 PA·PB 的最值时，找到固定线段 AB 的中点 M，直接写出 PA·PB = |PM|² - |MA|²，取 PM 的最大或最小值即可瞬间破题！",
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
      text: "钝角投影提示：夹角 θ 为钝角 (cosθ < 0)，投影数量 W_a(b) 为负值，垂足 H 落在向量 a 的反向延长线上！",
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
