/**
 * src/data/builders/lineEquation.ts
 * 直线方程与点到直线的距离 右屏 MathPanel 数据构造器
 */

import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  convertFormToGeneral,
  calcPointToLineDistance,
  calcTwoLinesRelation,
  getLineProperties,
} from "@/math/lineEquation";

export function buildLineEquationPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>
): MathPanelData {
  const studyMode = (config?.studyMode as string) || "forms";
  const form = (config?.form as any) || "general";

  const cPrimary = MATH_COLORS.paramPrimary; // #EF4444
  const cSecondary = MATH_COLORS.paramSecondary; // #D97706
  const cTertiary = MATH_COLORS.paramTertiary; // #059669

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  let mnemonic =
    "斜率存在点斜设，垂直坐标要特设；截距为零别遗漏，一般表达最通通用。点到直线垂线引，分子代值加绝对，分母勾股系数平方和。";

  // 先计算基础一般式
  let A = params.A ?? 1;
  let B = params.B ?? -1;
  let C = params.C ?? -1;

  if (studyMode === "forms" && form !== "general") {
    const gen = convertFormToGeneral(form, params);
    A = gen.A;
    B = gen.B;
    C = gen.C;
  }

  const lineProps = getLineProperties(A, B, C);

  // 1. 模式一：方程形式转换 (forms)
  if (studyMode === "forms") {
    quantities.push({
      label: "一般式方程",
      value: `${A.toFixed(1)}x ${B >= 0 ? "+" : ""} ${B.toFixed(1)}y ${C >= 0 ? "+" : ""} ${C.toFixed(1)} = 0`,
    });

    if (lineProps.slope !== null) {
      quantities.push({
        label: "斜率 k = -A/B",
        value: lineProps.slope.toFixed(2),
        color: cPrimary,
      });
      quantities.push({
        label: "倾斜角 α",
        value: `${lineProps.inclinationDeg.toFixed(1)}°`,
        color: cSecondary,
      });
    } else {
      quantities.push({
        label: "斜率 k",
        value: "不存在 (α = 90°)",
        color: cPrimary,
      });
      quantities.push({
        label: "倾斜角 α",
        value: "90.0°",
        color: cSecondary,
      });
    }

    quantities.push({
      label: "x 轴截距 a",
      value: lineProps.xIntercept !== null ? lineProps.xIntercept.toFixed(2) : "无 (平行x轴)",
    });

    quantities.push({
      label: "y 轴截距 b",
      value: lineProps.yIntercept !== null ? lineProps.yIntercept.toFixed(2) : "无 (平行y轴)",
      color: cTertiary,
    });

    theorems.push(
      {
        name: "点斜式方程",
        latex: "y - y_0 = k(x - x_0)",
        condition: "适用于斜率 k 存在 (直线不垂直于 x 轴) 的情况",
        level: "core",
      },
      {
        name: "斜截式方程",
        latex: "y = kx + b",
        condition: "已知斜率 k 与 y 轴截距 (0, b)",
        level: "core",
      },
      {
        name: "截距式方程",
        latex: "\\frac{x}{a} + \\frac{y}{b} = 1",
        condition: "a \\neq 0 \\text{ 且 } b \\neq 0 \\text{ (不过原点且不平行于坐标轴)}",
        level: "important",
      },
      {
        name: "一般式方程",
        latex: "Ax + By + C = 0",
        condition: "A, B \\text{ 不同时为 } 0 \\text{ (即 } A^2 + B^2 > 0 \\text{)}",
        level: "core",
      }
    );

    gaokaoPoints.push({
      text: "在设直线方程解题时，首选斜截式 $y = kx + b$ 或点斜式，但必须对斜率 $k$ 是否存在进行分类讨论；求与截距相关的最值问题时常设截距式 $\\frac{x}{a}+\\frac{y}{b}=1$，但也必须分类讨论截距为 0 的情况。",
      importance: "gaokao",
    });

    if (Math.abs(A) < 1e-9 && Math.abs(B) < 1e-9) {
      warnings.push({
        text: "退化警告：当 A 与 B 同时为 0 时，Ax + By + C = 0 不表示直线！",
        level: "danger",
      });
    }

    if (form === "intercept" && (Math.abs(params.a ?? 0) < 1e-9 || Math.abs(params.b ?? 0) < 1e-9)) {
      warnings.push({
        text: "截距式要求 a ≠ 0 且 b ≠ 0。过原点的直线不能用截距式表示！",
        level: "warning",
      });
    }
  }

  // 2. 模式二：点到直线的距离 (distance)
  else if (studyMode === "distance") {
    const x0 = params.x0 ?? 2;
    const y0 = params.y0 ?? 3;
    const p2l = calcPointToLineDistance(x0, y0, A, B, C);

    quantities.push(
      {
        label: "目标点 P(x₀, y₀)",
        value: `(${x0.toFixed(2)}, ${y0.toFixed(2)})`,
      },
      {
        label: "直线 L: Ax+By+C=0",
        value: `${A.toFixed(1)}x ${B >= 0 ? "+" : ""} ${B.toFixed(1)}y ${C >= 0 ? "+" : ""} ${C.toFixed(1)} = 0`,
      },
      {
        label: "点到直线距离 d",
        value: p2l.distance.toFixed(3),
        color: cPrimary,
      },
      {
        label: "垂足 Q(x_H, y_H)",
        value: `(${p2l.foot.x.toFixed(2)}, ${p2l.foot.y.toFixed(2)})`,
        color: cSecondary,
      }
    );

    theorems.push(
      {
        name: "点到直线的距离公式",
        latex: "d = \\frac{|A x_0 + B y_0 + C|}{\\sqrt{A^2 + B^2}}",
        condition: "点 P(x_0, y_0) 到直线 Ax + By + C = 0 的最短几何距离",
        level: "core",
      },
      {
        name: "垂足坐标公式",
        latex: "x_H = \\frac{B^2 x_0 - AB y_0 - AC}{A^2 + B^2}, \\quad y_H = \\frac{A^2 y_0 - AB x_0 - BC}{A^2 + B^2}",
        condition: "PQ \\perp L",
        level: "derived",
      }
    );

    gaokaoPoints.push(
      {
        text: "在求直线与圆相交的弦长及圆的切线方程时，点到直线的距离 $d$ 是联系圆心到直线的距离与弦长 ($2\\sqrt{R^2 - d^2}$) 的核心钥匙。",
        importance: "gaokao",
      },
      {
        text: "求点 $P$ 关于直线 $L$ 的对称点 $P'$，本质利用垂足 $Q$ 是 $PP'$ 的中点，且直线 $PP'$ 与 $L$ 垂直（斜率乘积为 -1）。",
        importance: "core",
      }
    );

    if (!p2l.isValid) {
      warnings.push({
        text: "直线系数 A 和 B 不能同时为 0，否则无法计算点到直线的距离！",
        level: "danger",
      });
    }
  }

  // 3. 模式三：两条直线的位置关系 (relation)
  else if (studyMode === "relation") {
    const A2 = params.A2 ?? 1;
    const B2 = params.B2 ?? 1;
    const C2 = params.C2 ?? -2;

    const rel = calcTwoLinesRelation(A, B, C, A2, B2, C2);

    const relTextMap = {
      intersect: rel.isPerpendicular ? "相交且垂直 (L₁ ⊥ L₂)" : "相交",
      parallel: "平行 (L₁ ∥ L₂)",
      coincident: "重合 (L₁ = L₂)",
    };

    quantities.push(
      {
        label: "直线 L₁ 方程",
        value: `${A.toFixed(1)}x ${B >= 0 ? "+" : ""} ${B.toFixed(1)}y ${C >= 0 ? "+" : ""} ${C.toFixed(1)} = 0`,
        color: cPrimary,
      },
      {
        label: "直线 L₂ 方程",
        value: `${A2.toFixed(1)}x ${B2 >= 0 ? "+" : ""} ${B2.toFixed(1)}y ${C2 >= 0 ? "+" : ""} ${C2.toFixed(1)} = 0`,
        color: cSecondary,
      },
      {
        label: "两条直线位置关系",
        value: relTextMap[rel.type],
        color: rel.isPerpendicular || rel.type === "parallel" ? MATH_COLORS.primary : MATH_COLORS.labelText,
      }
    );

    if (rel.type === "intersect" && rel.intersection) {
      quantities.push({
        label: "交点 P 坐标",
        value: `(${rel.intersection.x.toFixed(2)}, ${rel.intersection.y.toFixed(2)})`,
      });
      quantities.push({
        label: "两线夹角 θ",
        value: `${rel.angleDeg.toFixed(1)}°`,
        color: cTertiary,
      });
    } else if (rel.type === "parallel" && rel.distance !== null) {
      quantities.push({
        label: "平行线间距离 d",
        value: rel.distance.toFixed(3),
        color: cPrimary,
      });
    }

    theorems.push(
      {
        name: "两条直线垂直判定",
        latex: "L_1 \\perp L_2 \\iff A_1 A_2 + B_1 B_2 = 0 \\quad (k_1 k_2 = -1)",
        condition: "两直线的法向量点积为 0，或斜率乘积为 -1",
        level: "core",
      },
      {
        name: "两条直线平行判定",
        latex: "L_1 \\parallel L_2 \\iff A_1 B_2 - A_2 B_1 = 0 \\quad \\text{且} \\quad A_1 C_2 - A_2 C_1 \\neq 0",
        condition: "斜率相等但截距不相等",
        level: "core",
      },
      {
        name: "两条平行直线间的距离公式",
        latex: "d = \\frac{|C_1 - C_2|}{\\sqrt{A^2 + B^2}}",
        condition: "L_1 \\parallel L_2 \\text{ 且 } x, y \\text{ 系数必须完全化为一致}",
        level: "important",
      }
    );

    gaokaoPoints.push({
      text: "在直接代入平行线距离公式 $d = \\frac{|C_1 - C_2|}{\\sqrt{A^2 + B^2}}$ 之前，必须先将两直线的 $x$ 和 $y$ 系数化为完全相同（如 $2x - 3y + 1 = 0$ 与 $4x - 6y + 5 = 0$，需先将前者化为 $4x - 6y + 2 = 0$）。",
      importance: "gaokao",
    });

    if (rel.type === "coincident") {
      warnings.push({
        text: "两条直线重合，平行线距离为 0。使用平行线公式前请先排除重合！",
        level: "warning",
      });
    }
  }

  // 4. 模式四：直线系方程 (family)
  else if (studyMode === "family") {
    const lam = params.lambda ?? 1;
    const A2 = params.A2 ?? 1;
    const B2 = params.B2 ?? 1;
    const C2 = params.C2 ?? -2;

    const A_fam = A + lam * A2;
    const B_fam = B + lam * B2;
    const C_fam = C + lam * C2;

    quantities.push(
      {
        label: "基准直线 L₁",
        value: `${A.toFixed(1)}x ${B >= 0 ? "+" : ""} ${B.toFixed(1)}y ${C >= 0 ? "+" : ""} ${C.toFixed(1)} = 0`,
        color: cPrimary,
      },
      {
        label: "基准直线 L₂",
        value: `${A2.toFixed(1)}x ${B2 >= 0 ? "+" : ""} ${B2.toFixed(1)}y ${C2 >= 0 ? "+" : ""} ${C2.toFixed(1)} = 0`,
        color: cSecondary,
      },
      {
        label: "动直线系 L(λ)",
        value: `${A_fam.toFixed(1)}x ${B_fam >= 0 ? "+" : ""} ${B_fam.toFixed(1)}y ${C_fam >= 0 ? "+" : ""} ${C_fam.toFixed(1)} = 0`,
        color: cTertiary,
      }
    );

    theorems.push(
      {
        name: "过两直线交点的直线系",
        latex: "A_1 x + B_1 y + C_1 + \\lambda (A_2 x + B_2 y + C_2) = 0",
        condition: "表示经过 L₁ 与 L₂ 交点（若相交）的所有直线（不包含 L₂ 本身）",
        level: "derived",
      },
      {
        name: "平行/垂直直线系",
        latex: "\\text{平行系: } Ax + By + \\lambda = 0, \\quad \\text{垂直系: } Bx - Ay + \\lambda = 0",
        condition: "\\lambda \\in \\mathbb{R}",
        level: "important",
      }
    );

    gaokaoPoints.push({
      text: "对于形如 $(2\\lambda+1)x + (\\lambda-1)y + \\lambda - 4 = 0$ 的含参直线，按 $\\lambda$ 整理为 $(2x + y + 1)\\lambda + (x - y - 4) = 0$，解方程组 $2x + y + 1 = 0$ 与 $x - y - 4 = 0$ 即可求得恒过的定点坐标。",
      importance: "gaokao",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic,
  };
}
