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
  const reasoningSteps: ReasoningStep[] = [];
  let examAnchor: string | undefined = undefined;
  let mnemonic: string | undefined = undefined;

  if (modelType === "corner") {
    // 墙角模型
    const res = calculateCornerModel(a, b, c);
    examAnchor = "高考客观题/解答题压轴母题 · 墙角割补";
    mnemonic =
      "三垂直棱补长方，体对角线是直径，(2R)² = a² + b² + c²，球心对角取中点。";

    quantities.push(
      {
        label: "垂直侧棱长 PA, PB, PC",
        symbol: "a, b, c",
        value: `${a}, ${b}, ${c}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "补形体对角线 PP'",
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
        latex: `2R = \\sqrt{\\color{${MATH_COLORS.paramPrimary}}{a}^2 + \\color{${MATH_COLORS.paramSecondary}}{b}^2 + \\color{${MATH_COLORS.paramTertiary}}{c}^2} \\implies R = \\frac{1}{2}\\sqrt{\\color{${MATH_COLORS.paramPrimary}}{a}^2 + \\color{${MATH_COLORS.paramSecondary}}{b}^2 + \\color{${MATH_COLORS.paramTertiary}}{c}^2}`,
        level: "important",
        note: "从同顶点出发的三条侧棱两两垂直时，可补全为以 a, b, c 为长宽高的高考标准长方体，长方体外接球与三棱锥外接球重合",
      },
      {
        name: "墙角模型表面积与体积速记",
        latex: `S_{\\text{球}} = \\pi(\\color{${MATH_COLORS.paramPrimary}}{a}^2 + \\color{${MATH_COLORS.paramSecondary}}{b}^2 + \\color{${MATH_COLORS.paramTertiary}}{c}^2), \\quad V_{\\text{球}} = \\frac{\\pi}{6}(\\color{${MATH_COLORS.paramPrimary}}{a}^2 + \\color{${MATH_COLORS.paramSecondary}}{b}^2 + \\color{${MATH_COLORS.paramTertiary}}{c}^2)^{\\frac{3}{2}}`,
        level: "important",
        note: "在高考选择填空题中可直接套用公式极速秒杀",
      },
    );

    const sumSq = Number((a * a + b * b + c * c).toFixed(2));
    reasoningSteps.push(
      {
        step: 1,
        title: "构造补形长方体",
        detail: `由三棱锥 P 处三条侧棱两两垂直 (PA ⊥ PB, PB ⊥ PC, PC ⊥ PA)，侧棱长分别为 a=${a}, b=${b}, c=${c}，将其补全为长宽高为 ${a}, ${b}, ${c} 的长方体。`,
        latex: `PA \\perp PB, \\; PB \\perp PC, \\; PC \\perp PA \\implies \\text{三棱锥 } P-ABC \\text{ 补全为长方体}`,
        rubric:
          "[高考采分点] 准确指出四面体 4 顶点为长方体同一顶角相邻 4 顶点 (+2分)",
      },
      {
        step: 2,
        title: "确立外接球直径与球心",
        detail: `长方体外接球球心 O 为体对角线 PP' 中点，球直径 2R 等于长方体体对角线长 d。`,
        latex: `(2R)^2 = d^2 = a^2 + b^2 + c^2 = ${a}^2 + ${b}^2 + ${c}^2 = ${sumSq}`,
        rubric:
          "[高考采分点] 正确写出长方体体对角线与外接球直径等量关系 (+2分)",
      },
      {
        step: 3,
        title: "求解外接球半径与几何量",
        detail: `解得外接球半径 R = ${res.radius.toFixed(3)}，进而得出球表面积 S = ${(res.surfaceArea / Math.PI).toFixed(2)}π。`,
        latex: `R = \\frac{1}{2}\\sqrt{a^2 + b^2 + c^2} = \\frac{\\sqrt{${sumSq}}}{2} \\approx ${res.radius.toFixed(3)}, \\quad S_{\\text{球}} = ${(res.surfaceArea / Math.PI).toFixed(2)}\\pi`,
        rubric: "[高考采分点] 正确计算外接球半径与表面积 (+2分)",
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
    examAnchor = "高考柱体模型 · 直三棱柱外接球";
    mnemonic =
      "直棱柱外接球，上下底圆心中点为球心，球心距半高，勾股半径 R² = r_底² + (h/2)²。";

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
        latex: `R^2 = r_{\\text{底}}^2 + \\left(\\frac{\\color{${MATH_COLORS.paramTertiary}}{h}}{2}\\right)^2 \\implies R = \\sqrt{r_{\\text{底}}^2 + \\frac{\\color{${MATH_COLORS.paramTertiary}}{h}^2}{4}} = \\frac{1}{2}\\sqrt{\\color{${MATH_COLORS.paramPrimary}}{a}^2 + \\color{${MATH_COLORS.paramSecondary}}{b}^2 + \\color{${MATH_COLORS.paramTertiary}}{h}^2}`,
        level: "important",
        note: "直棱柱/侧棱垂直底面多面体，球心投影在底面外接圆圆心，球心到底面距离为 h/2，勾股直角三角形 O-O₁-A 成立",
      },
      {
        name: "底面外接圆半径 r_底 定理",
        latex: `r_{\\text{底}} = \\frac{\\sqrt{\\color{${MATH_COLORS.paramPrimary}}{a}^2 + \\color{${MATH_COLORS.paramSecondary}}{b}^2}}{2}`,
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
    examAnchor = "新高考压轴大招 · 等面四面体对棱长方体";
    mnemonic =
      "对棱相等长方体，面对角线定三面，联立方差解三棱，八倍球径平方和 8R² = a² + b² + c²。";

    quantities.push(
      {
        label: "对棱长组 (AB=CD, AC=BD, AD=BC)",
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
        latex: `R = \\frac{1}{2}\\sqrt{x^2 + y^2 + z^2} = \\frac{1}{2}\\sqrt{\\frac{\\color{${MATH_COLORS.paramPrimary}}{a}^2 + \\color{${MATH_COLORS.paramSecondary}}{b}^2 + \\color{${MATH_COLORS.paramTertiary}}{c}^2}{2}}`,
        level: "important",
        note: "若四面体对棱两两相等为 a, b, c，可将其 4 个顶点嵌入长宽高为 x, y, z 的长方体对角线上，长方体外接球与四面体外接球完全重合",
      },
      {
        name: "长方体边长与对棱关系组",
        latex: `\\begin{cases} x^2 + y^2 = \\color{${MATH_COLORS.paramPrimary}}{a}^2 \\\\ y^2 + z^2 = \\color{${MATH_COLORS.paramSecondary}}{b}^2 \\\\ z^2 + x^2 = \\color{${MATH_COLORS.paramTertiary}}{c}^2 \\end{cases} \\implies x^2 + y^2 + z^2 = \\frac{\\color{${MATH_COLORS.paramPrimary}}{a}^2 + \\color{${MATH_COLORS.paramSecondary}}{b}^2 + \\color{${MATH_COLORS.paramTertiary}}{c}^2}{2}`,
        level: "important",
        note: "通过联立方程组可直接解出长方体长宽高 x, y, z",
      },
    );

    const sumSq = Number((a * a + b * b + c * c).toFixed(2));
    const halfSumSq = Number(((a * a + b * b + c * c) / 2).toFixed(2));
    reasoningSteps.push(
      {
        step: 1,
        title: "构造补形长方体方程组",
        detail: `四面体三组对棱分别相等 a=${a}, b=${b}, c=${c}。将其 4 顶点嵌入长宽高为 x, y, z 的长方体交错顶点，对棱对应长方体各面的面对角线。`,
        latex: `\\begin{cases} x^2 + y^2 = a^2 = ${a}^2 \\\\ y^2 + z^2 = b^2 = ${b}^2 \\\\ z^2 + x^2 = c^2 = ${c}^2 \\end{cases}`,
        rubric: "[高考采分点] 准确写出对棱与长方体面对角线方程组 (+2分)",
      },
      {
        step: 2,
        title: "三式相加解长方体体对角线",
        detail: `三方程相加得 2(x² + y² + z²) = a² + b² + c² = ${sumSq}，长方体体对角线长等于外接球直径 2R。`,
        latex: `(2R)^2 = x^2 + y^2 + z^2 = \\frac{a^2 + b^2 + c^2}{2} = \\frac{${sumSq}}{2} = ${halfSumSq}`,
        rubric: "[高考采分点] 准确推导出体对角线与三对棱平方和关系 (+2分)",
      },
      {
        step: 3,
        title: "求解外接球半径 R",
        detail: `两边开方解出外接球半径 R = ${res.radius.toFixed(3)}。`,
        latex: `R = \\frac{\\sqrt{2(a^2 + b^2 + c^2)}}{4} = \\frac{\\sqrt{2 \\times ${sumSq}}}{4} \\approx ${res.radius.toFixed(3)}`,
        rubric: "[高考采分点] 正确解出外接球半径与表面积 (+2分)",
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
    examAnchor = "新高考解答题核心母题 · 柱体外心勾股轴线";
    mnemonic =
      "一求底面外心径，二取垂直侧棱半，直角三角连球心，勾股定理定乾坤 R² = r_底² + (h/2)²。";

    quantities.push(
      {
        label: "底面直角边 CA, CB",
        symbol: "a, b",
        value: `${a}, ${b}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "底面外接圆半径 r_底 (斜边 AB/2)",
        symbol: "r_{\\text{底}}",
        value: Number(res.rBase.toFixed(4)),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "垂直侧棱高 PA (球心距 h/2)",
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
        latex: `R = \\sqrt{r_{\\text{底}}^2 + \\left(\\frac{\\color{${MATH_COLORS.paramTertiary}}{h}}{2}\\right)^2} = \\frac{1}{2}\\sqrt{\\color{${MATH_COLORS.paramPrimary}}{a}^2 + \\color{${MATH_COLORS.paramSecondary}}{b}^2 + \\color{${MATH_COLORS.paramTertiary}}{h}^2}`,
        level: "important",
        note: "当侧棱 PA ⊥ 底面 ABC 时，球心 O 垂直投影到底面为底面外接圆心 O₁，球心到底面距离等于侧棱高 h 的一半",
      },
      {
        name: "底面外接圆半径 r_底 定理",
        latex: `r_{\\text{底}} = \\frac{\\sqrt{\\color{${MATH_COLORS.paramPrimary}}{a}^2+\\color{${MATH_COLORS.paramSecondary}}{b}^2}}{2}`,
        level: "important",
        note: "直角三角形底面斜边中点即为外接圆心 O₁",
      },
    );

    const cBase = Math.sqrt(a * a + b * b);
    const rBaseVal = res.rBase;
    const halfH = h / 2;
    const rSq = Number((res.radius * res.radius).toFixed(2));
    reasoningSteps.push(
      {
        step: 1,
        title: "求底面外接圆半径 r_底 与外心 O₁",
        detail: `底面 △ABC 为直角三角形（直角边 CA=${a}, CB=${b}），斜边为 AB = ${cBase.toFixed(2)}，斜边中点即为底面外心 O₁。`,
        latex: `r_{\\text{底}} = \\frac{\\sqrt{a^2 + b^2}}{2} = \\frac{\\sqrt{${a}^2 + ${b}^2}}{2} = ${rBaseVal.toFixed(3)}`,
        rubric: "[高考采分点] 正确指出底面外接圆心位置及半径 (+2分)",
      },
      {
        step: 2,
        title: "过外心立垂线确立球心 O",
        detail: `侧棱 PA ⊥ 底面 ABC，高 PA=${h}。外接球球心 O 在过外心 O₁ 垂直于底面的轴线上，球心到底面距离为高的一半 |O O₁| = h/2 = ${halfH.toFixed(2)}。`,
        latex: `O O_1 \\perp \\text{底面 } ABC, \\quad |O O_1| = \\frac{h}{2} = ${halfH.toFixed(2)}`,
        rubric: "[高考采分点] 证明球心在底面外心垂直轴线上且距底面 h/2 (+2分)",
      },
      {
        step: 3,
        title: "Rt△O-O₁-B 中勾股求解 R",
        detail: `连接 OB 即为外接球半径 R，在 Rt△O-O₁-B 中应用勾股定理：`,
        latex: `R^2 = r_{\\text{底}}^2 + \\left(\\frac{h}{2}\\right)^2 = ${rBaseVal.toFixed(2)}^2 + ${halfH.toFixed(2)}^2 = ${rSq} \\implies R \\approx ${res.radius.toFixed(3)}`,
        rubric: "[高考采分点] 列出并解出外接球半径勾股方程 (+2分)",
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
    examAnchor = "高考立体几何通法 · 多面体内切球等体积剖分";
    mnemonic =
      "多面体内切求半径，等体积法核心轴，四面剖分同顶点，三倍体积除总面积 r = 3V / S_表。";

    const inSurfaceArea = 4 * Math.PI * res.inRadius * res.inRadius;
    const inVolume = (4 / 3) * Math.PI * Math.pow(res.inRadius, 3);

    quantities.push(
      {
        label: "直角侧棱长 CA, CB, CP",
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
      {
        label: "内切球表面积 S_球",
        symbol: "S_{\\text{内球}}",
        value: `${(inSurfaceArea / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "内切球体积 V_球",
        symbol: "V_{\\text{内球}}",
        value: `${(inVolume / Math.PI).toFixed(2)}π`,
        color: MATH_COLORS.accent,
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
        latex: `\\begin{aligned} S_{\\text{总}} &= S_{\\text{直角面}} + S_{\\text{斜面}} \\\\ &= \\frac{1}{2}(\\color{${MATH_COLORS.paramPrimary}}{a}\\color{${MATH_COLORS.paramSecondary}}{b} + \\color{${MATH_COLORS.paramPrimary}}{a}\\color{${MATH_COLORS.paramTertiary}}{c} + \\color{${MATH_COLORS.paramSecondary}}{b}\\color{${MATH_COLORS.paramTertiary}}{c}) \\\\ &\\quad + \\frac{1}{2}\\sqrt{\\color{${MATH_COLORS.paramPrimary}}{a}^2\\color{${MATH_COLORS.paramSecondary}}{b}^2 + \\color{${MATH_COLORS.paramPrimary}}{a}^2\\color{${MATH_COLORS.paramTertiary}}{c}^2 + \\color{${MATH_COLORS.paramSecondary}}{b}^2\\color{${MATH_COLORS.paramTertiary}}{c}^2} \\end{aligned}`,
        level: "important",
      },
    );

    reasoningSteps.push(
      {
        step: 1,
        title: "空间分割与等体积法原理",
        detail: `设内切球球心为 I，半径为 r。连接 I 与四面体 4 个顶点，将四面体分割为 4 个以各面为底面、高均为 r 的小棱锥。`,
        latex: `V_{\\text{总}} = \\frac{1}{3}S_1 r + \\frac{1}{3}S_2 r + \\frac{1}{3}S_3 r + \\frac{1}{3}S_4 r = \\frac{1}{3}S_{\\text{总}} r`,
        rubric: "[高考采分点] 写明利用等体积剖分原理构建方程 (+2分)",
      },
      {
        step: 2,
        title: "分别求解总体积 V 与总表面积 S_总",
        detail: `代入当前参数 a=${a}, b=${b}, c=${c}：总体积 V = (1/6)abc = ${res.totalVolume.toFixed(2)}；4 个面表面积之和 S_总 = ${res.totalArea.toFixed(2)}。`,
        latex: `V = \\frac{1}{6} \\times ${a} \\times ${b} \\times ${c} = ${res.totalVolume.toFixed(2)}, \\quad S_{\\text{总}} \\approx ${res.totalArea.toFixed(2)}`,
        rubric: "[高考采分点] 正确求得四面体体积与各表面积之和 (+2分)",
      },
      {
        step: 3,
        title: "公式化简求解内切球半径",
        detail: `由等体积公式求得内切球半径 r = ${res.inRadius.toFixed(3)}。`,
        latex: `r_{\\text{in}} = \\frac{3 V_{\\text{总}}}{S_{\\text{总}}} = \\frac{3 \\times ${res.totalVolume.toFixed(2)}}{${res.totalArea.toFixed(2)}} \\approx ${res.inRadius.toFixed(3)}`,
        rubric: "[高考采分点] 正确解得内切球半径 (+2分)",
      },
    );

    gaokaoPoints.push({
      text: "【内切球高考通法——等体积法】：任何有内切球的多面体，其内切球半径 r_in 均满足 r_in = 3V / S_总。求出几何体总体积 V 与总表面积 S_总 即可求出 r_in。",
      importance: "gaokao",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    examAnchor,
    mnemonic,
  };
}
