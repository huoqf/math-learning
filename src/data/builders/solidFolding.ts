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
  calculateRightTrapezoidFolding,
  calculateRectangleDiagonalFolding,
  calculateTriangleAltitudeFolding,
  calculateRhombusFolding,
} from "@/math3d/folding";

// ── know-solid-folding: 平面图形折叠与翻折二面角 ──

export function buildSolidFoldingPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const model = (config?.model as string) ?? "trapezoid";
  const a = params.a ?? 4;
  const b = params.b ?? 3;
  const h = params.h ?? 3;
  const alphaDeg = params.alphaDeg ?? 90;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  if (model === "trapezoid") {
    const res = calculateRightTrapezoidFolding(a, b, h, alphaDeg);
    const D_prime = res.points["D'"];
    const safeA = res.safeParams?.a ?? a;
    const safeB = res.safeParams?.b ?? b;

    if (res.safeParams?.isClamped) {
      warnings.push({
        text: `直角梯形参数已自动适配为安全几何边界 (b < a)，确保折展结构自洽有效。`,
        level: "info",
      });
    }

    const dihedralBeta = 180 - alphaDeg;

    quantities.push(
      {
        label: "底边边长 a",
        symbol: "a",
        value: safeA,
        color: MATH_COLORS.primary,
      },
      {
        label: "折痕参数 b",
        symbol: "b",
        value: safeB,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "翻折旋转角 α",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "空间二面角 β",
        symbol: "\\beta(D'-EC-A)",
        value: `${dihedralBeta}°`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "动点 D' 空间坐标",
        symbol: "D'",
        value: `(${D_prime.x.toFixed(2)}, ${D_prime.y.toFixed(2)}, ${D_prime.z.toFixed(2)})`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "变动线段 D'A 长度",
        symbol: "|D'A|",
        value: Number(res.movingSegmentLength.toFixed(3)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "翻折四棱锥 D'-ABCE 体积",
        symbol: "V_{D'-ABCE}",
        value: Number(res.pyramidVolume.toFixed(3)),
        color: MATH_COLORS.accent,
      },
      {
        label: "面面法向量夹角",
        symbol: "\\langle\\vec{n}_1, \\vec{n}_2\\rangle",
        value: `${alphaDeg}°`,
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "二面角平面角与翻折角关系",
        latex: `\\beta = 180^\\circ - \\alpha \\quad (\\angle D'EA \\text{ 为二面角 } D'-EC-A \\text{ 的平面角})`,
        level: "core",
        condition: "折痕为 EC，在两半平面内分别作 ED' ⊥ EC, EA ⊥ EC",
        note: "翻折前 A 与 D 分居 EC 两侧成平角；翻折角 α 为旋转偏角，两半平面二面角 β = 180° - α",
      },
      {
        name: "动点 D' 空间坐标参数化公式",
        latex: `D' = (\\color{${MATH_COLORS.paramSecondary}}{b} + (\\color{${MATH_COLORS.paramPrimary}}{a}-\\color{${MATH_COLORS.paramSecondary}}{b})\\cos\\color{${MATH_COLORS.paramPrimary}}{\\alpha},\\; 0,\\; (\\color{${MATH_COLORS.paramPrimary}}{a}-\\color{${MATH_COLORS.paramSecondary}}{b})\\sin\\color{${MATH_COLORS.paramPrimary}}{\\alpha})`,
        level: "important",
        note: "以 A 为原点，AD 为 x 轴，AB 为 y 轴建立空间直角坐标系",
      },
      {
        name: "变动线段 D'A 长度公式",
        latex: `|D'A|^2 = (\\color{${MATH_COLORS.paramSecondary}}{b} + (\\color{${MATH_COLORS.paramPrimary}}{a}-\\color{${MATH_COLORS.paramSecondary}}{b})\\cos\\color{${MATH_COLORS.paramPrimary}}{\\alpha})^2 + ((\\color{${MATH_COLORS.paramPrimary}}{a}-\\color{${MATH_COLORS.paramSecondary}}{b})\\sin\\color{${MATH_COLORS.paramPrimary}}{\\alpha})^2`,
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "【高考折叠第(1)问几何证明】：翻折前后 EC ⊥ BC 且 EC ⊥ ED'，故 EC ⊥ 平面 D'EA 恒成立。若 α = 90°，则平面 CDE ⊥ 底面 ABCE。",
        importance: "gaokao",
      },
      {
        text: "【高考折叠第(2)问向量建系】：以 A 为原点，射线 AB 为 y 轴，AD 为 x 轴，过 A 作底面垂线为 z 轴，带入动点 D' 坐标求线面角/二面角。",
        importance: "gaokao",
      },
      {
        text: "【二面角钝角防扣分铁律】：用法向量求二面角时，公式 |cos〈n1, n2〉| 给出的是锐角或直角；若直观图中二面角为钝角，余弦值必须添负号！",
        importance: "gaokao",
      },
    );
  } else if (model === "rectangleDiagonal") {
    const res = calculateRectangleDiagonalFolding(a, b, alphaDeg);
    const A_prime = res.points["A'"];

    quantities.push(
      {
        label: "翻折二面角 α",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 A' 空间坐标",
        symbol: "A'",
        value: `(${A_prime.x.toFixed(2)}, ${A_prime.y.toFixed(2)}, ${A_prime.z.toFixed(2)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "变动线段 A'C 长度",
        symbol: "|A'C|",
        value: Number(res.movingSegmentLength.toFixed(3)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "异面直线 A'D 与 BC 夹角",
        symbol: "\\theta(A'D, BC)",
        value: `${res.skewLinesAngleDeg?.toFixed(2)}°`,
        color: MATH_COLORS.highlight,
      },
      {
        label: "三棱锥 A'-BCD 体积 V",
        symbol: "V_{A'-BCD}",
        value: Number(res.pyramidVolume.toFixed(3)),
        color: MATH_COLORS.accent,
      },
    );

    if (res.circumSphereRadius != null) {
      quantities.push({
        label: "三棱锥 A'-BCD 外接球半径 R",
        symbol: "R",
        value: Number(res.circumSphereRadius.toFixed(3)),
        color: MATH_COLORS.secondary,
      });
    }

    theorems.push(
      {
        name: "外接球半径不变量定理（新高考必考）",
        latex: `R = \\frac{BD}{2} = \\frac{\\sqrt{\\color{${MATH_COLORS.paramPrimary}}{a}^2 + \\color{${MATH_COLORS.paramSecondary}}{b}^2}}{2}`,
        level: "core",
        note: "△A'BD 和 △CBD 均为 Rt△ 且共斜边 BD，球心始终为 BD 中点，半径恒定不变！",
      },
      {
        name: "异面直线 A'D ⊥ BC 临界角公式",
        latex: `\\cos\\color{${MATH_COLORS.paramPrimary}}{\\alpha_\\perp} = -\\frac{\\color{${MATH_COLORS.paramSecondary}}{b}^2}{\\color{${MATH_COLORS.paramPrimary}}{a}^2} \\quad (\\color{${MATH_COLORS.paramPrimary}}{a} \\ge \\color{${MATH_COLORS.paramSecondary}}{b})`,
        level: "important",
        note: res.criticalPerpAlphaDeg
          ? `当 a ≥ b 时存在钝角二面角 α = ${res.criticalPerpAlphaDeg}°，使异面直线 A'D 与 BC 严格垂直`
          : "若 a < b 则不存在二面角使 A'D ⊥ BC",
      },
      {
        name: "三棱锥体积最大值定理",
        latex: `V_{\\max} = \\frac{\\color{${MATH_COLORS.paramPrimary}}{a}^2 \\color{${MATH_COLORS.paramSecondary}}{b}^2}{6\\sqrt{\\color{${MATH_COLORS.paramPrimary}}{a}^2 + \\color{${MATH_COLORS.paramSecondary}}{b}^2}} \\quad (\\color{${MATH_COLORS.paramPrimary}}{\\alpha} = 90^\\circ \\text{ 时取得})`,
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "【矩形对角线翻折外接球破题口诀】：共斜边双直角，斜边中点定球心；不论二面角如何翻折，外接球半径 R 恒等于斜边的一半！",
        importance: "gaokao",
      },
      {
        text: "【异面直线垂直探究】：通过向量点乘 $\\vec{DA'} · \\vec{BC} = 0$，可精确解出异面垂直时的二面角 $\\alpha_\\perp$。",
        importance: "gaokao",
      },
    );
  } else if (model === "triangleAltitude") {
    const res = calculateTriangleAltitudeFolding(a, h, alphaDeg);
    const C_prime = res.points["C'"];
    const dihedralBeta = 180 - alphaDeg;

    quantities.push(
      {
        label: "翻折旋转角 α",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "空间二面角 β",
        symbol: "\\beta(B-AD-C')",
        value: `${dihedralBeta}°`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "动点 C' 空间坐标",
        symbol: "C'",
        value: `(${C_prime.x.toFixed(2)}, ${C_prime.y.toFixed(2)}, ${C_prime.z.toFixed(2)})`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "变动底边 BC' 长度",
        symbol: "|BC'|",
        value: Number(res.movingSegmentLength.toFixed(3)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "三棱锥 A-BC'D 体积 V",
        symbol: "V_{A-BC'D}",
        value: Number(res.pyramidVolume.toFixed(3)),
        color: MATH_COLORS.accent,
      },
    );

    theorems.push(
      {
        name: "等腰三角形高折叠变动底边公式",
        latex: `|BC'| = \\color{${MATH_COLORS.paramPrimary}}{a} \\cos \\left(\\frac{\\color{${MATH_COLORS.paramPrimary}}{\\alpha}}{2}\\right)`,
        level: "core",
        note: "折痕 AD ⊥ DB 且 AD ⊥ DC'，∠BDC' = π − α（B 与 C' 分在折痕两侧），由余弦定理 |BC'|² = 2(a/2)²(1+cosα) = a²cos²(α/2)",
      },
      {
        name: "α = 90° 墙角模型外接球定理",
        latex: `R = \\frac{\\sqrt{\\color{${MATH_COLORS.paramTertiary}}{h}^2 + 2 \\cdot (\\color{${MATH_COLORS.paramPrimary}}{a}/2)^2}}{2} = \\frac{\\sqrt{\\color{${MATH_COLORS.paramTertiary}}{h}^2 + \\frac{\\color{${MATH_COLORS.paramPrimary}}{a}^2}{2}}}{2}`,
        level: "important",
        condition: "当 α = 90° 时，DA, DB, DC' 两两垂直组成墙角模型",
      },
    );

    gaokaoPoints.push({
      text: "【等腰三角形折叠与墙角模型】：沿高 AD 折叠至 α = 90° 时，三条侧棱 DA ⊥ DB, DA ⊥ DC', DB ⊥ DC' 两两垂直，可直接补形为长方体求外接球与体积。",
      importance: "gaokao",
    });
  } else {
    // rhombus
    const res = calculateRhombusFolding(a, alphaDeg);
    const A_prime = res.points["A'"];
    const dihedralBeta = 180 - alphaDeg;

    quantities.push(
      {
        label: "菱形边长 a",
        symbol: "a",
        value: a,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "翻折旋转角 α",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "空间二面角 β",
        symbol: "\\beta(A'-BD-C)",
        value: `${dihedralBeta}°`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "动点 A' 空间坐标",
        symbol: "A'",
        value: `(${A_prime.x.toFixed(2)}, ${A_prime.y.toFixed(2)}, ${A_prime.z.toFixed(2)})`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "对角顶点距离 |A'C|",
        symbol: "|A'C|",
        value: Number(res.movingSegmentLength.toFixed(3)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "异面直线 A'C 与 BD 夹角",
        symbol: "\\theta",
        value: "90.00° (恒垂直)",
        color: MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "菱形折叠异面直线恒垂直定理",
        latex: `BD \\perp A'O, BD \\perp CO \\Rightarrow BD \\perp \\text{面 } A'OC \\Rightarrow BD \\perp A'C`,
        level: "core",
        note: "无论翻折二面角 α 如何改变，异面直线 A'C 与折痕 BD 永远垂直",
      },
      {
        name: "对角顶点距离余弦定理",
        latex: `|A'C|^2 = \\frac{3}{2} \\color{${MATH_COLORS.paramPrimary}}{a}^2 (1 + \\cos\\color{${MATH_COLORS.paramPrimary}}{\\alpha}) = 3\\color{${MATH_COLORS.paramPrimary}}{a}^2 \\cos^2\\left(\\frac{\\color{${MATH_COLORS.paramPrimary}}{\\alpha}}{2}\\right)`,
        level: "important",
        note: "折痕两半平面夹角 ∠A'OC = π − α，由余弦定理 |A'C|² = 2(√3a/2)²(1+cosα)",
      },
    );

    gaokaoPoints.push({
      text: "【菱形折叠重要结论】：由于对角线 BD 垂直于中线 A'O 和 CO，故 BD 垂直于平面 A'OC，因此异面直线 BD ⊥ A'C 在任意翻折角度下恒成立！",
      importance: "gaokao",
    });
  }

  if (alphaDeg <= 2 || alphaDeg >= 178) {
    warnings.push({
      text: `翻折二面角 α = ${alphaDeg}° 接近展开或贴合临界，图形退化为平面极限状态！`,
      level: "warning",
    });
  } else if (Math.abs(alphaDeg - 90) < 1e-4) {
    warnings.push({
      text: "翻折二面角 α = 90°，两半平面垂直！高线达到最大值，几何体体积取得极大值。",
      level: "info",
    });
  }

  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: "审题定法 · 区分翻折不变量与变动量",
      detail:
        "平面图形折叠问题关键在于抓住“不变量”：折痕两侧半平面内部的边长、线段长度与平面角在折叠过程中完全不变：",
      latex: `\\text{折痕长度不变, 各半平面内线段长度恒定}`,
      rubric: "[高考采分点] 明确指出翻折过程中的长度与角度不变量 (+4分)",
    },
    {
      step: 2,
      title: "建模联立 · 构造空间高线函数与体积模型",
      detail:
        "过变动顶点向折痕作垂线，垂足为垂底。二面角为 α 时，空间几何体的高等于面内垂线长乘以 sinα：",
      latex: `h(\\alpha) = d \\cdot \\sin\\alpha \\implies V(\\alpha) = \\frac{1}{3} S_{\\text{底}} \\cdot d \\cdot \\sin\\alpha`,
      rubric:
        "[高考采分点] 准确建立关于二面角 α 的射影高线与体积函数关系式 (+5分)",
    },
    {
      step: 3,
      title: "求解反思 · 求导或极值分析确定最优角",
      detail:
        "由于 α ∈ (0°, 180°)，正弦函数在 α = 90° 处取得最大值 1。两半平面垂直时，多面体的高与体积同时达到极大值：",
      latex: `\\sin\\alpha \\le 1 \\implies \\max V = V(90^\\circ) = \\frac{1}{3} S_{\\text{底}} \\cdot d`,
      rubric:
        "[高考采分点] 正确得出体积最大值及对应的充要二面角 α = 90° (+4分)",
    },
  ];

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic:
      "折前折后辨不变，面内几何度量同；二面求角两垂线，向量建系通法全。",
  };
}
