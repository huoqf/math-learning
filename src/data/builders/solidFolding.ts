import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
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

    quantities.push(
      {
        label: "翻折二面角 α",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 D' 空间坐标",
        symbol: "D'",
        value: `(${D_prime.x.toFixed(2)}, ${D_prime.y.toFixed(2)}, ${D_prime.z.toFixed(2)})`,
        color: MATH_COLORS.paramSecondary,
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
        name: "二面角的平面角定义定理",
        latex: "\\angle D'EA \\text{ 为二面角 } D'-EC-A \\text{ 的平面角}",
        level: "core",
        condition: "折痕为 EC，在两半平面内分别作 ED' ⊥ EC, EA ⊥ EC",
      },
      {
        name: "动点 D' 空间坐标参数化公式",
        latex: `D' = (\\color{#D97706}{b} + (\\color{#EF4444}{a}-\\color{#D97706}{b})\\cos\\color{#EF4444}{\\alpha},\\; 0,\\; (\\color{#EF4444}{a}-\\color{#D97706}{b})\\sin\\color{#EF4444}{\\alpha})`,
        level: "important",
        note: "以 A 为原点，AD 为 x 轴，AB 为 y 轴建立空间直角坐标系",
      },
      {
        name: "变动线段 D'A 长度公式",
        latex: `|D'A|^2 = (\\color{#D97706}{b} + (\\color{#EF4444}{a}-\\color{#D97706}{b})\\cos\\color{#EF4444}{\\alpha})^2 + ((\\color{#EF4444}{a}-\\color{#D97706}{b})\\sin\\color{#EF4444}{\\alpha})^2`,
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
        label: "三棱锥 A'-BCD 外接球半径 R",
        symbol: "R",
        value: Number(res.circumSphereRadius?.toFixed(3)),
        color: MATH_COLORS.secondary,
      },
      {
        label: "三棱锥 A'-BCD 体积 V",
        symbol: "V_{A'-BCD}",
        value: Number(res.pyramidVolume.toFixed(3)),
        color: MATH_COLORS.accent,
      },
    );

    theorems.push(
      {
        name: "外接球半径不变量定理（新高考必考）",
        latex: `R = \\frac{BD}{2} = \\frac{\\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2}}{2}`,
        level: "core",
        note: "△A'BD 和 △CBD 均为 Rt△ 且共斜边 BD，球心始终为 BD 中点，半径恒定不变！",
      },
      {
        name: "异面直线 A'D ⊥ BC 临界角公式",
        latex: `\\cos\\color{#EF4444}{\\alpha_\\perp} = \\frac{\\color{#D97706}{b}^2}{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2}`,
        level: "important",
        note: res.criticalPerpAlphaDeg
          ? `当 α = ${res.criticalPerpAlphaDeg}° 时，异面直线 A'D 与 BC 严格垂直`
          : "根据空间向量数量积点乘为零求出",
      },
      {
        name: "三棱锥体积最大值定理",
        latex: `V_{\\max} = \\frac{\\color{#EF4444}{a}^2 \\color{#D97706}{b}^2}{6\\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2}} \\quad (\\color{#EF4444}{\\alpha} = 90^\\circ \\text{ 时取得})`,
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "【矩形对角线翻折外接球破题口诀】：共斜边双直角，斜边中点定球心；不论二面角如何翻折，外接球半径 R 恒等于斜边的一半！",
        importance: "gaokao",
      },
      {
        text: "【异面直线垂直探究】：通过向量点乘 \\vec{DA'} · \\vec{BC} = 0，可精确解出异面垂直时的二面角 \\alpha_\\perp。",
        importance: "gaokao",
      },
    );
  } else if (model === "triangleAltitude") {
    const res = calculateTriangleAltitudeFolding(a, h, alphaDeg);
    const C_prime = res.points["C'"];

    quantities.push(
      {
        label: "翻折二面角 α",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 C' 空间坐标",
        symbol: "C'",
        value: `(${C_prime.x.toFixed(2)}, ${C_prime.y.toFixed(2)}, ${C_prime.z.toFixed(2)})`,
        color: MATH_COLORS.paramSecondary,
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
        latex: `|BC'| = \\color{#EF4444}{a} \\cos \\left(\\frac{\\color{#EF4444}{\\alpha}}{2}\\right)`,
        level: "core",
        note: "折痕 AD ⊥ DB 且 AD ⊥ DC'，∠BDC' = π − α（B 与 C' 分在折痕两侧），由余弦定理 |BC'|² = 2(a/2)²(1+cosα) = a²cos²(α/2)",
      },
      {
        name: "α = 90° 墙角模型外接球定理",
        latex: `R = \\frac{\\sqrt{\\color{#059669}{h}^2 + 2 \\cdot (\\color{#EF4444}{a}/2)^2}}{2} = \\frac{\\sqrt{\\color{#059669}{h}^2 + \\frac{\\color{#EF4444}{a}^2}{2}}}{2}`,
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

    quantities.push(
      {
        label: "菱形边长 a",
        symbol: "a",
        value: a,
        color: MATH_COLORS.paramPrimary,
      },
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
        latex: `|A'C|^2 = \\frac{3}{2} \\color{#EF4444}{a}^2 (1 - \\cos\\color{#EF4444}{\\alpha})`,
        level: "important",
      },
    );

    gaokaoPoints.push({
      text: "【菱形折叠重要结论】：由于对角线 BD 垂直于中线 A'O 和 CO，故 BD 垂直于平面 A'OC，因此异面直线 BD ⊥ A'C 在任意翻折角度下恒成立！",
      importance: "gaokao",
    });
  }

  if (alphaDeg === 0 || alphaDeg === 180) {
    warnings.push({
      text: `翻折二面角 α = ${alphaDeg}°，图形退化为平面图形！`,
      level: "warning",
    });
  } else if (alphaDeg === 90) {
    warnings.push({
      text: "翻折二面角 α = 90°，两半平面垂直！高线达到最大值，四面体体积取得极大值。",
      level: "info",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "折前折后辨不变，面内几何度量同；二面求角两垂线，向量建系通法全。",
  };
}
