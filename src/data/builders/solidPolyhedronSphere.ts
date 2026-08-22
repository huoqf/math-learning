import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  calculateCornerModel,
  calculateCylinderModel,
  calculateComplementModel,
  calculateVerticalEdgeModel,
  calculateInSphereModel,
} from "@/math3d/polyhedronSphere";

// ── know-solid-ball-models: 多面体外接球三大模型（墙角/柱体/补形） ──

export function buildPolyhedronSpherePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const modelType = (config?.modelType as string) ?? "corner";
  const a = params.a ?? 3;
  const b = params.b ?? 4;
  const c = params.c ?? 5;
  const h = params.h ?? 4;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  if (modelType === "corner") {
    // 墙角模型
    const res = calculateCornerModel(a, b, c);
    quantities.push(
      {
        label: "墙角侧棱长 PA, PB, PC",
        symbol: "a, b, c",
        value: `${a}, ${b}, ${c}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "长方体体对角线 d",
        symbol: "d",
        value: Number((2 * res.radius).toFixed(4)),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "外接球球心坐标 O",
        symbol: "O",
        value: `(${res.center.x.toFixed(2)}, ${res.center.y.toFixed(2)}, ${res.center.z.toFixed(2)})`,
        color: MATH_COLORS.highlight,
      },
      {
        label: "外接球半径 R",
        symbol: "R",
        value: Number(res.radius.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "外接球表面积 S",
        symbol: "S_{球}",
        value: `${(res.surfaceArea / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "外接球体积 V",
        symbol: "V_{球}",
        value: `${(res.volume / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.accent,
      },
    );

    theorems.push(
      {
        name: "墙角模型结论（三棱锥侧棱两两垂直）",
        latex:
          "2R = \\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{c}^2} \\implies R = \\frac{1}{2}\\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{c}^2}",
        level: "important",
        note: "从同顶点出发的三条侧棱两两垂直时，可补全为以 a, b, c 为长宽高的高考标准长方体，长方体外接球与三棱锥外接球重合",
      },
      {
        name: "墙角模型表面积与体积速记",
        latex:
          "S_{\\text{球}} = \\pi(\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{c}^2), \\quad V_{\\text{球}} = \\frac{\\pi}{6}(\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{c}^2)^{\\frac{3}{2}}",
        level: "important",
        note: "在高考选择填空题中可直接套用公式极速秒杀",
      },
    );

    gaokaoPoints.push(
      {
        text: "【墙角模型特征】：顶点 P 处三条侧棱 PA ⊥ PB, PB ⊥ PC, PC ⊥ PA。核心解法：补形长方体。长方体体对角线长等于球直径 2R。",
        importance: "gaokao",
      },
      {
        text: "【秒杀杀招】：见垂直补长方体，长宽高即为垂直棱长 a, b, c。外接球半径 R = ½ √(a² + b² + c²)。",
        importance: "hard",
      },
    );
  } else if (modelType === "cylinder") {
    // 柱体模型
    const res = calculateCylinderModel(a, b, h);
    quantities.push(
      {
        label: "底面直角边 a, b 与斜边 c_base",
        symbol: "a, b, c_{\\text{base}}",
        value: `${a}, ${b}, ${Math.sqrt(a * a + b * b).toFixed(2)}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "底面外接圆半径 r_base",
        symbol: "r_{\\text{底}}",
        value: Number(res.rBase.toFixed(4)),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "柱体高度 h (球心距 h/2)",
        symbol: "h, \\frac{h}{2}",
        value: `${h}, ${(h / 2).toFixed(2)}`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "外接球半径 R",
        symbol: "R",
        value: Number(res.radius.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "外接球表面积 S",
        symbol: "S_{球}",
        value: `${(res.surfaceArea / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "外接球体积 V",
        symbol: "V_{球}",
        value: `${(res.volume / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.accent,
      },
    );

    theorems.push(
      {
        name: "柱体模型（套柱勾股定理）",
        latex:
          "R^2 = r_{\\text{底}}^2 + \\left(\\frac{\\color{#059669}{h}}{2}\\right)^2 \\implies R = \\sqrt{r_{\\text{底}}^2 + \\frac{\\color{#059669}{h}^2}{4}} = \\frac{1}{2}\\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{h}^2}",
        level: "important",
        note: "直棱柱/侧棱垂直底面多面体，球心投影在底面外接圆圆心，球心到底面距离为 h/2，勾股直角三角形 O-O₁-A 成立",
      },
      {
        name: "底面外接圆半径 r_底 定理",
        latex:
          "r_{\\text{底}} = \\frac{\\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2}}{2}",
        level: "important",
        note: "底面为直角三角形时，斜边中点即为外接圆心，r_底 = 斜边 / 2",
      },
    );

    gaokaoPoints.push(
      {
        text: "【柱体模型特征】：直棱柱或一条侧棱垂直于底面。核心解法：套柱勾股法。求出底面外接圆半径 r_底 与柱高 h，用勾股关系求 R。",
        importance: "gaokao",
      },
      {
        text: "【新高考通法】：寻找轴中心线线段 O₁O₂（连接上下底外接圆心），中点即为球心 O，高 half 为 h/2。",
        importance: "hard",
      },
    );
  } else if (modelType === "complement") {
    // 补形模型 (对棱相等四面体)
    const res = calculateComplementModel(a, b, c);
    quantities.push(
      {
        label: "四面体对棱长对 (a, b, c)",
        symbol: "a, b, c",
        value: `${a}, ${b}, ${c}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "补形长方体三边 (x, y, z)",
        symbol: "x, y, z",
        value: res.isValid
          ? `(${res.boxDimensions.x.toFixed(2)}, ${res.boxDimensions.y.toFixed(2)}, ${res.boxDimensions.z.toFixed(2)})`
          : "无法构成实长方体",
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "外接球半径 R",
        symbol: "R",
        value: Number(res.radius.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "外接球表面积 S",
        symbol: "S_{球}",
        value: `${(res.surfaceArea / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "外接球体积 V",
        symbol: "V_{球}",
        value: `${(res.volume / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.accent,
      },
    );

    theorems.push(
      {
        name: "对棱相等四面体补形定理（汉堡模型）",
        latex:
          "R = \\frac{1}{2}\\sqrt{x^2 + y^2 + z^2} = \\frac{1}{2}\\sqrt{\\frac{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{c}^2}{2}}",
        level: "important",
        note: "若四面体对棱两两相等为 a, b, c，可将其 4 个顶点嵌入长宽高为 x, y, z 的长方体对角线上，长方体外接球与四面体外接球完全重合",
      },
      {
        name: "长方体边长与对棱关系组",
        latex:
          "\\begin{cases} x^2 + y^2 = \\color{#EF4444}{a}^2 \\\\ y^2 + z^2 = \\color{#D97706}{b}^2 \\\\ z^2 + x^2 = \\color{#059669}{c}^2 \\end{cases} \\implies x^2 + y^2 + z^2 = \\frac{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{c}^2}{2}",
        level: "important",
        note: "通过联立方程组可直接解出长方体长宽高 x, y, z",
      },
    );

    gaokaoPoints.push(
      {
        text: "【补形模型特征】：四面体 6 条棱中，对棱两两相等。核心解法：割补法还原长方体，四面体 4 个顶点即为长方体交错顶点。",
        importance: "gaokao",
      },
      {
        text: "【解题公式】：外接球半径 R = ½ √((a² + b² + c²)/2) = ¼ √(2(a² + b² + c²))。",
        importance: "hard",
      },
    );

    if (!res.isValid) {
      warnings.push({
        text: "当前对棱长 (a, b, c) 不满足三角形三边平方和条件 (如 a²+b² ≤ c²)，无法构成实数补形长方体！请调整参数使任意两边平方和大于第三边平方和。",
        level: "danger",
      });
    }
  } else if (modelType === "verticalEdge") {
    // 侧棱垂直底面模型 (汉堡模型 / 垂直底面侧棱三棱锥)
    const res = calculateVerticalEdgeModel(a, b, h);
    quantities.push(
      {
        label: "底面直角边 a, b",
        symbol: "a, b",
        value: `${a}, ${b}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "底面外接圆半径 r_底",
        symbol: "r_{\\text{底}}",
        value: Number(res.rBase.toFixed(4)),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "垂直侧棱长 h (高差距 h/2)",
        symbol: "h, \\frac{h}{2}",
        value: `${h}, ${(h / 2).toFixed(2)}`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "外接球半径 R (汉堡模型)",
        symbol: "R",
        value: Number(res.radius.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "外接球表面积 S",
        symbol: "S_{球}",
        value: `${(res.surfaceArea / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "外接球体积 V",
        symbol: "V_{球}",
        value: `${(res.volume / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.accent,
      },
    );

    theorems.push(
      {
        name: "侧棱垂直底面模型（汉堡套柱半径公式）",
        latex:
          "R = \\sqrt{r_{\\text{底}}^2 + \\left(\\frac{\\color{#059669}{h}}{2}\\right)^2} = \\frac{1}{2}\\sqrt{\\color{#EF4444}{a}^2 + \\color{#D97706}{b}^2 + \\color{#059669}{h}^2}",
        level: "important",
        note: "当侧棱 PA ⊥ 底面 ABC 时，球心 O 垂直投影到底面为底面外接圆心 O₁，球心到底面距离等于侧棱高 h 的一半",
      },
      {
        name: "底面外接圆半径 r_底 定理",
        latex:
          "r_{\\text{底}} = \\frac{\\sqrt{\\color{#EF4444}{a}^2+\\color{#D97706}{b}^2}}{2}",
        level: "important",
        note: "直角三角形底面斜边中点即为外接圆心 O₁",
      },
    );

    gaokaoPoints.push(
      {
        text: "【汉堡模型/侧棱垂直底面】：一条侧棱 PA ⊥ 底面 ABC，球心 O 到底面距离必为 h/2。关键先求底面外接圆半径 r_底，再套用勾股公式 R² = r_底² + (h/2)²。",
        importance: "gaokao",
      },
      {
        text: "【高考解题秒杀】：若底面为直角三角形，r_底 = 斜边/2，则 R = ½ √(a² + b² + h²)。",
        importance: "hard",
      },
    );
  } else if (modelType === "inSphere") {
    // 内切球模型 (等体积法)
    const res = calculateInSphereModel(a, b, c);
    quantities.push(
      {
        label: "三棱锥三条直角棱 a, b, c",
        symbol: "a, b, c",
        value: `${a}, ${b}, ${c}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "三棱锥总体积 V",
        symbol: "V_{\\text{总}}",
        value: Number(res.totalVolume.toFixed(4)),
        color: MATH_COLORS.accent,
      },
      {
        label: "三棱锥总表面积 S_总",
        symbol: "S_{\\text{总}}",
        value: Number(res.totalArea.toFixed(4)),
        color: MATH_COLORS.secondary,
      },
      {
        label: "内切球半径 r_in (等体积法)",
        symbol: "r_{\\text{in}}",
        value: Number(res.inRadius.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
      },
    );

    theorems.push(
      {
        name: "多面体内切球半径公式（等体积法剖分）",
        latex:
          "\\begin{aligned} V_{\\text{总}} &= \\frac{1}{3} S_{\\text{总}} r_{\\text{in}} \\\\ &= \\frac{1}{3}(S_1 + S_2 + S_3 + S_4) r_{\\text{in}} \\\\ \\implies r_{\\text{in}} &= \\frac{3 V_{\\text{总}}}{S_{\\text{总}}} \\end{aligned}",
        level: "important",
        note: "以内切球球心 O_in 为共同顶点，向 4 个面画半径垂线段 r_in，将多面体剖分为 4 个以各面为底面的小三棱锥",
      },
      {
        name: "直角三棱锥各面面积计算",
        latex:
          "\\begin{aligned} S_{\\text{总}} &= S_{\\text{直角面}} + S_{\\text{斜面}} \\\\ &= \\frac{1}{2}(\\color{#EF4444}{a}\\color{#D97706}{b} + \\color{#EF4444}{a}\\color{#059669}{c} + \\color{#D97706}{b}\\color{#059669}{c}) \\\\ &\\quad + \\frac{1}{2}\\sqrt{\\color{#EF4444}{a}^2\\color{#D97706}{b}^2 + \\color{#EF4444}{a}^2\\color{#059669}{c}^2 + \\color{#D97706}{b}^2\\color{#059669}{c}^2} \\end{aligned}",
        level: "important",
      },
    );

    gaokaoPoints.push({
      text: "【内切球高考通法——等体积法】：任何有内切球的多面体，其内切球半径 r_in 均满足 r_in = 3V / S_总。求出几何体总体积 V 与总表面积 S_总 即可求出 r_in。",
      importance: "gaokao",
    });
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}
