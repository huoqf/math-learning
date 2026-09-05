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
  cuboidCircumRadius,
  regularPyramidCircumRadius,
  coneCircumRadius,
  sphereVolume,
  sphereSurfaceArea,
} from "@/math3d/solidGeometry";

// ── know-solid-ball: 外接球与内切球 ──

export function buildCircumSpherePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  if (!config) {
    console.warn(
      "[buildCircumSpherePanel] config 未传入，右屏公式默认为长方体外接球",
    );
  }
  const sphereType = (config?.sphereType as string) ?? "circum";
  const shape = (config?.shape as string) ?? "cuboid";
  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const c = params.c ?? 2;

  let radius = 0;
  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  const reasoningSteps: ReasoningStep[] = [];
  let examAnchor: string | undefined = undefined;
  let mnemonic: string | undefined = undefined;

  if (sphereType === "circum") {
    // ── 外接球模式 ──
    if (shape === "cuboid") {
      radius = cuboidCircumRadius(a, b, c);
      examAnchor = "高考立体几何基础母题 · 墙角与长方体外接球模型";
      mnemonic = "体对角线即直径，(2R)² = a² + b² + c²，球心体对角线取中点。";

      quantities.push(
        {
          label: "长方体长 a",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "长方体宽 b",
          symbol: "b",
          value: b,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "长方体高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "体对角线长 d",
          symbol: "d",
          value: (2 * radius).toFixed(3),
          color: MATH_COLORS.primary,
        },
        {
          label: "外接球半径 R",
          symbol: "R",
          value: Number(radius.toFixed(4)),
          color: MATH_COLORS.highlight,
        },
      );

      theorems.push(
        {
          name: "长方体外接球黄金公式",
          latex: `R = \\frac{\\sqrt{\\color{${MATH_COLORS.paramPrimary}}{a}^2 + \\color{${MATH_COLORS.paramSecondary}}{b}^2 + \\color{${MATH_COLORS.paramTertiary}}{c}^2}}{2}`,
          level: "core",
          note: "体对角线长等于外接球直径 ($d = 2R = \\sqrt{a^2+b^2+c^2}$)",
        },
        {
          name: "球心位置几何表达",
          latex: `O = \\frac{1}{2} (A + C_1)`,
          level: "important",
          note: "外接球球心即为长方体体对角线的中点",
        },
      );

      gaokaoPoints.push(
        {
          text: "【新高考通法·多面体外接球 4 步法】①判断三维几何体类型（墙角模型 / 柱体模型 / 正棱锥模型）；②确定底面外接圆半径 r_底；③应用黄金定理 R² = r_底² + d² 求解球半径；④计算球表面积 S = 4πR² 或体积 V = 4/3 πR³。",
          importance: "gaokao",
        },
        {
          text: "高考经典补体法（墙角模型）：凡具有三条两两垂直棱的三棱锥（如 P-ABC 满足 PA ⊥ PB ⊥ PC），均可补形为长方体求外接球半径 R = √(a²+b²+c²) / 2。",
          importance: "gaokao",
        },
      );

      reasoningSteps.push(
        {
          step: 1,
          title: "三维正交棱长求体对角线",
          detail: `由长方体长宽高 a=${a}, b=${b}, c=${c}，空间直角坐标勾股计算体对角线长 d。`,
          latex: `d = \\sqrt{a^2 + b^2 + c^2} = \\sqrt{${a}^2 + ${b}^2 + ${c}^2} = ${(2 * radius).toFixed(3)}`,
          rubric: "[高考采分点] 正确写出三维体对角线公式 (+2分)",
        },
        {
          step: 2,
          title: "外接性质确立球直径关系",
          detail: `长方体 8 个顶点均在外接球面上，体对角线中点即外接球心 O，直径等于体对角线。`,
          latex: `2R = d \\implies R = \\frac{1}{2}\\sqrt{a^2 + b^2 + c^2} = ${radius.toFixed(3)}`,
          rubric: "[高考采分点] 准确指出 2R = d 关系及球心位置 (+2分)",
        },
        {
          step: 3,
          title: "代入求表面积与体积",
          detail: `根据球表面积与体积公式代入球半径 R，得出精准度量。`,
          latex: `S = 4\\pi R^2 = ${(4 * Math.PI * radius * radius).toFixed(2)}, \\quad V = \\frac{4}{3}\\pi R^3 = ${((4 / 3) * Math.PI * radius ** 3).toFixed(2)}`,
          rubric: "[高考采分点] 准确计算外接球表面积或体积 (+2分)",
        },
      );
    } else if (shape === "regularPyramid") {
      // 正四棱锥 (底边长 a, 高 c)
      const rBase = a / Math.sqrt(2);
      radius = regularPyramidCircumRadius(rBase, c);
      examAnchor = "新高考高频常考题 · 正棱锥轴截面勾股法";
      mnemonic = "球心落在高线上，轴截面内列勾股，R² = r_底² + (h - R)²。";

      quantities.push(
        {
          label: "底面边长 a",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "底面外接圆半径 r_底",
          symbol: "r_{底}",
          value: rBase.toFixed(3),
          color: MATH_COLORS.primary,
        },
        {
          label: "棱锥高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "外接球半径 R",
          symbol: "R",
          value: Number(radius.toFixed(4)),
          color: MATH_COLORS.highlight,
        },
      );

      theorems.push(
        {
          name: "正棱锥外接球公式 (截面勾股法)",
          latex: `R = \\frac{r_{底}^2 + \\color{${MATH_COLORS.paramTertiary}}{h}^2}{2\\color{${MATH_COLORS.paramTertiary}}{h}} = \\frac{\\frac{\\color{${MATH_COLORS.paramPrimary}}{a}^2}{2} + \\color{${MATH_COLORS.paramTertiary}}{h}^2}{2\\color{${MATH_COLORS.paramTertiary}}{h}}`,
          level: "core",
          condition: "外接球球心位于过底面外心且垂直于底面的中心高线上",
        },
        {
          name: "中心高线勾股方程",
          latex: `R^2 = r_{底}^2 + (\\color{${MATH_COLORS.paramTertiary}}{h} - R)^2`,
          level: "important",
        },
      );

      gaokaoPoints.push({
        text: "正棱锥外接球球心求法：球心在中心高线上，在包含高的轴截面直角三角形中利用勾股定理 R² = r_底² + (h-R)² 即可解出 R = (r_底² + h²) / (2h)。",
        importance: "gaokao",
      });

      reasoningSteps.push(
        {
          step: 1,
          title: "求解底面正方形外接圆半径",
          detail: `底面正方形边长为 a=${a}，对角线长等于 √2 a，外接圆半径为对角线一半。`,
          latex: `r_{底} = \\frac{\\sqrt{2}}{2}a = \\frac{${a}}{\\sqrt{2}} \\approx ${rBase.toFixed(3)}`,
          rubric: "[高考采分点] 准确计算底面多边形外接圆半径 (+2分)",
        },
        {
          step: 2,
          title: "中心高线上建立勾股方程",
          detail: `正四棱锥球心位于高线上，设球心到顶点距离为 R，在轴截面直角三角形中列勾股方程。`,
          latex: `R^2 = r_{底}^2 + (h - R)^2 \\implies R^2 = ${rBase.toFixed(3)}^2 + (${c} - R)^2`,
          rubric: "[高考采分点] 正确建立轴截面勾股方程 (+2分)",
        },
        {
          step: 3,
          title: "解一元方程求解外接半径",
          detail: `展开消去二次项 R²，解得外接球半径 R。`,
          latex: `R = \\frac{r_{底}^2 + h^2}{2h} = \\frac{${(rBase * rBase).toFixed(2)} + ${(c * c).toFixed(2)}}{${2 * c}} = ${radius.toFixed(3)}`,
          rubric: "[高考采分点] 正确解出外接球半径 (+2分)",
        },
      );
    } else if (shape === "triangularPrism") {
      // 直三棱柱 (底面直角边 a, b, 高 c)
      const rBase = Math.sqrt(a * a + b * b) / 2;
      radius = Math.sqrt(rBase * rBase + (c / 2) ** 2);
      examAnchor = "高考柱体切接黄金模型 · 直棱柱双外心垂直平分线法";
      mnemonic =
        "底面外心定水平，高线一半定竖直，黄金公式 R² = r_底² + (h/2)²。";

      quantities.push(
        {
          label: "直角边 a",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "直角边 b",
          symbol: "b",
          value: b,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "底面外接圆半径 r_底",
          symbol: "r_{底}",
          value: rBase.toFixed(3),
          color: MATH_COLORS.primary,
        },
        {
          label: "柱体高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "外接球半径 R",
          symbol: "R",
          value: Number(radius.toFixed(4)),
          color: MATH_COLORS.highlight,
        },
      );

      theorems.push({
        name: "直棱柱外接球通用公式",
        latex: `R = \\sqrt{r_{底}^2 + \\left(\\frac{\\color{${MATH_COLORS.paramTertiary}}{h}}{2}\\right)^2}`,
        level: "core",
        note: "r_底 为底面多边形外接圆半径，h 为直棱柱高",
      });

      gaokaoPoints.push({
        text: "直棱柱外接球黄金法则：R² = r_底² + (h/2)²。若底面为直角三角形，斜边中点即为底面外心，r_底 = 斜边/2。",
        importance: "gaokao",
      });

      reasoningSteps.push(
        {
          step: 1,
          title: "求解底面直角三角形外接圆半径",
          detail: `直角三角形斜边中点为外心，底面外接圆半径等于斜边一半。`,
          latex: `c_{斜} = \\sqrt{a^2 + b^2} = ${(2 * rBase).toFixed(3)} \\implies r_{底} = \\frac{c_{斜}}{2} = ${rBase.toFixed(3)}`,
          rubric: "[高考采分点] 明确直角三角形外心在斜边中点 (+2分)",
        },
        {
          step: 2,
          title: "确定球心空间垂直高度",
          detail: `球心落在上下底面外心 O₁, O₂ 连线中点，球心距上下底面距离均为 h/2。`,
          latex: `d_{球心} = \\frac{h}{2} = \\frac{${c}}{2} = ${(c / 2).toFixed(2)}`,
          rubric: "[高考采分点] 指出球心在上下底外心连线中点 (+2分)",
        },
        {
          step: 3,
          title: "空间勾股求解外接球半径",
          detail: `应用直棱柱外接球勾股公式 R² = r_底² + (h/2)² 计算半径。`,
          latex: `R = \\sqrt{r_{底}^2 + \\left(\\frac{h}{2}\\right)^2} = \\sqrt{${(rBase * rBase).toFixed(2)} + ${((c / 2) ** 2).toFixed(2)}} = ${radius.toFixed(3)}`,
          rubric: "[高考采分点] 正确得出柱体外接球半径 (+2分)",
        },
      );
    } else if (shape === "cone") {
      // 圆锥 (底半径 a, 高 c)
      radius = coneCircumRadius(a, c);
      const l = Math.sqrt(a * a + c * c);
      examAnchor = "高考旋转体切接母题 · 轴截面降维法";
      mnemonic = "过轴截面降为三角形，等腰三角形外接圆，R = l²/(2h)。";

      quantities.push(
        {
          label: "底面半径 r",
          symbol: "r",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "圆锥高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "母线长 l",
          symbol: "l",
          value: l.toFixed(3),
          color: MATH_COLORS.secondary,
        },
        {
          label: "外接球半径 R",
          symbol: "R",
          value: Number(radius.toFixed(4)),
          color: MATH_COLORS.highlight,
        },
      );

      theorems.push(
        {
          name: "圆锥外接球公式 (轴截面法)",
          latex: `R = \\frac{\\color{${MATH_COLORS.paramPrimary}}{r}^2 + \\color{${MATH_COLORS.paramTertiary}}{h}^2}{2\\color{${MATH_COLORS.paramTertiary}}{h}} = \\frac{l^2}{2\\color{${MATH_COLORS.paramTertiary}}{h}}`,
          level: "core",
          note: "轴截面为底长 2r、腰长 l 的等腰三角形，其外接圆半径即为圆锥外接球半径",
        },
        {
          name: "圆锥母线与半径高勾股关系",
          latex: `l = \\sqrt{\\color{${MATH_COLORS.paramPrimary}}{r}^2 + \\color{${MATH_COLORS.paramTertiary}}{h}^2}`,
          level: "important",
        },
      );

      gaokaoPoints.push({
        text: "旋转体切接问题降维法：过旋转轴作轴截面，圆锥外接球问题降维转化为轴截面三角形的外接圆问题，R = l² / (2h)。",
        importance: "gaokao",
      });

      reasoningSteps.push(
        {
          step: 1,
          title: "轴截面降维构建等腰三角形",
          detail: `过圆锥旋转轴作轴截面，截面为底边 2r、腰长 l、高 h 的等腰三角形。`,
          latex: `2r = ${2 * a}, \\quad h = ${c}, \\quad l = \\sqrt{r^2 + h^2} = ${l.toFixed(3)}`,
          rubric: "[高考采分点] 准确指出轴截面三角形特征及母线长 (+2分)",
        },
        {
          step: 2,
          title: "轴截面外接圆即球的大圆截面",
          detail: `外接球球心在轴截面等腰三角形高线上，利用勾股定理 R² = r² + (h - R)²。`,
          latex: `R^2 = r^2 + (h - R)^2 \\implies 2hR = r^2 + h^2 = l^2`,
          rubric: "[高考采分点] 建立轴截面等腰三角形外接圆方程 (+2分)",
        },
        {
          step: 3,
          title: "求得圆锥外接球半径",
          detail: `由射影/勾股得出结论 R = l² / (2h)。`,
          latex: `R = \\frac{l^2}{2h} = \\frac{${(l * l).toFixed(2)}}{${2 * c}} = ${radius.toFixed(3)}`,
          rubric: "[高考采分点] 熟练应用公式解出球半径 (+2分)",
        },
      );
    } else {
      // 圆柱 (底半径 a, 高 c)
      radius = Math.sqrt(a * a + (c / 2) ** 2);
      examAnchor = "高考旋转体切接经典模型 · 轴截面矩形对角线法";
      mnemonic = "轴截面矩形对角线即球直径，(2R)² = (2r)² + h²。";

      quantities.push(
        {
          label: "底面半径 r",
          symbol: "r",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "圆柱高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "外接球半径 R",
          symbol: "R",
          value: Number(radius.toFixed(4)),
          color: MATH_COLORS.highlight,
        },
      );

      theorems.push({
        name: "圆柱外接球公式",
        latex: `R = \\sqrt{\\color{${MATH_COLORS.paramPrimary}}{r}^2 + \\left(\\frac{\\color{${MATH_COLORS.paramTertiary}}{h}}{2}\\right)^2}`,
        level: "core",
        note: "圆柱轴截面为宽 2r、高 h 的矩形，矩形对角线长的一半即为外接球半径",
      });

      gaokaoPoints.push({
        text: "圆柱外接球球心位于旋转轴的中点，轴截面矩形对角线半径 R = √(r² + (h/2)²)。",
        importance: "gaokao",
      });

      reasoningSteps.push(
        {
          step: 1,
          title: "轴截面降维构建对角矩形",
          detail: `轴截面为宽 2r、高 h 的对称矩形，矩形 4 个顶点均落在球大圆截面上。`,
          latex: `\\text{轴截面矩形边长为 } 2r=${2 * a}, \\; h=${c}`,
          rubric: "[高考采分点] 作轴截面并识别出矩形四顶点共圆 (+2分)",
        },
        {
          step: 2,
          title: "矩形对角线即外接球直径",
          detail: `矩形对角线交点即旋转轴中点（球心 O），外接球直径等于矩形对角线。`,
          latex: `(2R)^2 = (2r)^2 + h^2 = ${4 * a * a} + ${c * c} = ${(4 * radius * radius).toFixed(2)}`,
          rubric: "[高考采分点] 正确给出 (2R)² = (2r)² + h² (+2分)",
        },
        {
          step: 3,
          title: "求解外接球半径",
          detail: `两边开方除以 2 解得外接球半径 R。`,
          latex: `R = \\sqrt{r^2 + \\left(\\frac{h}{2}\\right)^2} = \\sqrt{${(a * a).toFixed(2)} + ${((c / 2) ** 2).toFixed(2)}} = ${radius.toFixed(3)}`,
          rubric: "[高考采分点] 正确得出圆柱外接球半径 (+2分)",
        },
      );
    }

    const V = sphereVolume(radius);
    const S = sphereSurfaceArea(radius);
    quantities.push(
      {
        label: "外接球体积 V",
        symbol: "V_{球}",
        value: V.toFixed(3),
        color: MATH_COLORS.secondary,
      },
      {
        label: "外接球表面积 S",
        symbol: "S_{球}",
        value: S.toFixed(3),
        color: MATH_COLORS.accent,
      },
    );
  } else {
    // ── 内切球模式 ──
    if (shape === "cuboid") {
      radius = Math.min(a, b, c) / 2;
      const isCube = a === b && b === c;
      examAnchor = "高考特殊构型检验 · 正方体内切球";
      mnemonic = "正方体内切球直径等于棱长：2r = a。";

      quantities.push(
        {
          label: "长 a",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "宽 b",
          symbol: "b",
          value: b,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "内切/容纳球半径",
          symbol: "r_{in}",
          value: Number(radius.toFixed(4)),
          color: MATH_COLORS.highlight,
        },
      );

      theorems.push({
        name: "正方体内切球公式",
        latex: `r_{in} = \\frac{\\color{${MATH_COLORS.paramPrimary}}{a}}{2} \\quad (\\color{${MATH_COLORS.paramPrimary}}{a} = \\color{${MATH_COLORS.paramSecondary}}{b} = \\color{${MATH_COLORS.paramTertiary}}{h} \\text{ 时成立})`,
        level: "core",
        note: "一般长方体 (a ≠ b 或 b ≠ h) 不存在同时切 6 个面的内切球",
      });

      if (!isCube) {
        warnings.push({
          text: "当前长方体长宽高不相等 (a ≠ b ≠ h)，不存在同时与 6 个面相切的内切球！图中展示为最大内部相切球。",
          level: "warning",
        });
      }

      reasoningSteps.push(
        {
          step: 1,
          title: "多面体内切球存在性判定",
          detail: isCube
            ? `正方体六个面全等且对称，必存在同时切 6 个正方形面的内切球。`
            : `长方体 a=${a}, b=${b}, h=${c} 互不相等，无法同时切 6 面，展示最大内部切球。`,
          latex: isCube
            ? `a = b = h = ${a} \\implies \\text{存在内切球}`
            : `a \\neq b \\neq h \\implies \\text{退化为局部切球}`,
          rubric: "[高考采分点] 判断多面体是否存在内切球 (+2分)",
        },
        {
          step: 2,
          title: "对称中心到各面的切线距离",
          detail: `正方体内切球球心与体中心重合，球心到 6 个面的垂直距离均等于半棱长。`,
          latex: `d(I, \\text{各面}) = r_{in} = \\frac{a}{2}`,
          rubric: "[高考采分点] 指出切点在各面中心且 2r = a (+2分)",
        },
        {
          step: 3,
          title: "求解内切球半径及度量",
          detail: `求得内切球半径为 ${radius.toFixed(3)}。`,
          latex: `r_{in} = \\frac{${Math.min(a, b, c)}}{2} = ${radius.toFixed(3)}`,
          rubric: "[高考采分点] 准确计算内切球半径 (+2分)",
        },
      );
    } else if (shape === "regularPyramid") {
      // 正四棱锥 (底边长 a, 高 c)
      const hs = Math.sqrt(c * c + (a / 2) ** 2); // 斜高
      const vSolid = (1 / 3) * a * a * c;
      const sTotal = a * a + 2 * a * hs;
      radius = (3 * vSolid) / sTotal;
      examAnchor = "新高考内切球通用杀手锏 · 空间等体积剖分法";
      mnemonic = "以球心为顶点向各面剖分，总体积等于各分锥之和：r = 3V/S_全。";

      quantities.push(
        {
          label: "底面边长 a",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "棱锥高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "侧面斜高 hs",
          symbol: "h_s",
          value: hs.toFixed(3),
          color: MATH_COLORS.primary,
        },
        {
          label: "棱锥体积 V",
          symbol: "V_{棱锥}",
          value: vSolid.toFixed(3),
          color: MATH_COLORS.secondary,
        },
        {
          label: "全面积 S",
          symbol: "S_{全}",
          value: sTotal.toFixed(3),
          color: MATH_COLORS.accent,
        },
        {
          label: "内切球半径 r",
          symbol: "r_{in}",
          value: Number(radius.toFixed(4)),
          color: MATH_COLORS.highlight,
        },
      );

      theorems.push({
        name: "等体积法求内切球公式",
        latex: `r_{in} = \\frac{3V_{\\text{几何体}}}{S_{\\text{全面积}}} = \\frac{\\color{${MATH_COLORS.paramPrimary}}{a} \\color{${MATH_COLORS.paramTertiary}}{h}}{\\color{${MATH_COLORS.paramPrimary}}{a} + 2\\sqrt{\\color{${MATH_COLORS.paramTertiary}}{h}^2 + \\frac{\\color{${MATH_COLORS.paramPrimary}}{a}^2}{4}}}`,
        level: "core",
        condition: "将多面体拆分为以各面为底、球心为顶点的锥体分割",
      });

      gaokaoPoints.push({
        text: "高考通用内切球神器：等体积法 r_in = 3V / S_全！适用于任意存在内切球的凸多面体和旋转体。",
        importance: "gaokao",
      });

      reasoningSteps.push(
        {
          step: 1,
          title: "求解棱锥体积与侧面斜高全面积",
          detail: `底面积 S_底 = a²，体积 V = ⅓ a² h；斜高 h_s = √(h² + a²/4)，侧面全面积 S_全 = a² + 2a h_s。`,
          latex: `V = \\frac{1}{3}a^2 h = ${vSolid.toFixed(3)}, \\quad S_{全} = a^2 + 2a h_s = ${sTotal.toFixed(3)}`,
          rubric: "[高考采分点] 正确计算棱锥体积与全面积 (+2分)",
        },
        {
          step: 2,
          title: "空间等体积剖分方程",
          detail: `以球心 I 为顶点剖分为 5 个小棱锥，高均为 r_in，总体积等于各分锥体积之和。`,
          latex: `V = \\frac{1}{3} S_{底} r_{in} + \\sum_{i=1}^4 \\frac{1}{3} S_{侧i} r_{in} = \\frac{1}{3} S_{全} r_{in}`,
          rubric: "[高考采分点] 写出等体积剖分核心方程 (+2分)",
        },
        {
          step: 3,
          title: "等体积法解得内切球半径",
          detail: `由等体积方程解得 r_in = 3V / S_全。`,
          latex: `r_{in} = \\frac{3V}{S_{全}} = \\frac{3 \\times ${vSolid.toFixed(3)}}{${sTotal.toFixed(3)}} = ${radius.toFixed(3)}`,
          rubric: "[高考采分点] 正确计算内切球半径 (+2分)",
        },
      );
    } else if (shape === "triangularPrism") {
      // 直三棱柱 (底面直角边 a, b, 高 c)
      const cHyp = Math.sqrt(a * a + b * b);
      const rBaseIn = (a + b - cHyp) / 2;
      radius = Math.min(rBaseIn, c / 2);
      examAnchor = "高考棱柱内切存在充要条件分析";
      mnemonic =
        "柱体存在内切球充要条件：柱高必须等于底面内切圆直径 h = 2r_底。";

      quantities.push(
        {
          label: "直角边 a",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "直角边 b",
          symbol: "b",
          value: b,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "底面内切圆半径",
          symbol: "r_{底}",
          value: rBaseIn.toFixed(3),
          color: MATH_COLORS.primary,
        },
        {
          label: "柱体高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "切球半径",
          symbol: "r_{in}",
          value: Number(radius.toFixed(4)),
          color: MATH_COLORS.highlight,
        },
      );

      theorems.push({
        name: "直三棱柱内切球存在条件",
        latex: `\\color{${MATH_COLORS.paramTertiary}}{h} = 2 r_{底in} = \\color{${MATH_COLORS.paramPrimary}}{a} + \\color{${MATH_COLORS.paramSecondary}}{b} - \\sqrt{\\color{${MATH_COLORS.paramPrimary}}{a}^2+\\color{${MATH_COLORS.paramSecondary}}{b}^2}`,
        level: "core",
        note: "只有当柱体高度等于底面内切圆直径时才存在与 5 个面均相切的内切球",
      });

      if (Math.abs(c - 2 * rBaseIn) > 0.1) {
        warnings.push({
          text: `当前高 h=${c} 不等于底面内切圆直径 2r=${(2 * rBaseIn).toFixed(2)}，三棱柱无法同时切上下底面与侧面！`,
          level: "warning",
        });
      }

      reasoningSteps.push(
        {
          step: 1,
          title: "求解底面直角三角形内切圆半径",
          detail: `直角三角形内切圆半径等于两直角边之和减斜边除以 2。`,
          latex: `r_{底} = \\frac{a + b - \\sqrt{a^2+b^2}}{2} = \\frac{${a} + ${b} - ${cHyp.toFixed(2)}}{2} = ${rBaseIn.toFixed(3)}`,
          rubric: "[高考采分点] 正确求出底面三角形内切圆半径 (+2分)",
        },
        {
          step: 2,
          title: "柱体切球充要几何约束",
          detail: `球体同时切上下底面要求 2r = h；同时切侧面要求 r = r_底。`,
          latex: `\\text{充要条件：} h = 2r_{底} = ${(2 * rBaseIn).toFixed(2)}`,
          rubric: "[高考采分点] 明确指出柱体存在内切球充要条件 (+2分)",
        },
        {
          step: 3,
          title: "确定实际最大容纳切球半径",
          detail: `在水平与垂直两约束中取最小值。`,
          latex: `r = \\min\\left(r_{底}, \\frac{h}{2}\\right) = \\min(${rBaseIn.toFixed(3)}, ${(c / 2).toFixed(3)}) = ${radius.toFixed(3)}`,
          rubric: "[高考采分点] 准确给出内切球半径 (+2分)",
        },
      );
    } else if (shape === "cone") {
      // 圆锥 (底半径 a, 高 c)
      const l = Math.sqrt(a * a + c * c);
      radius = (a * c) / (a + l);
      examAnchor = "高考旋转体内切降维 · 轴截面等腰三角形内切圆";
      mnemonic = "轴截面等腰三角形内切圆即球内切圆，r = rh / (r + l)。";

      quantities.push(
        {
          label: "底面半径 r",
          symbol: "r",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "母线长 l",
          symbol: "l",
          value: l.toFixed(3),
          color: MATH_COLORS.secondary,
        },
        {
          label: "内切球半径 r",
          symbol: "r_{in}",
          value: Number(radius.toFixed(4)),
          color: MATH_COLORS.highlight,
        },
      );

      theorems.push({
        name: "圆锥内切球公式 (轴截面法)",
        latex: `r_{in} = \\frac{\\color{${MATH_COLORS.paramPrimary}}{r} \\cdot \\color{${MATH_COLORS.paramTertiary}}{h}}{\\color{${MATH_COLORS.paramPrimary}}{r} + l} = \\frac{\\color{${MATH_COLORS.paramPrimary}}{r} \\cdot \\color{${MATH_COLORS.paramTertiary}}{h}}{\\color{${MATH_COLORS.paramPrimary}}{r} + \\sqrt{\\color{${MATH_COLORS.paramPrimary}}{r}^2+\\color{${MATH_COLORS.paramTertiary}}{h}^2}}`,
        level: "core",
        note: "在轴截面等腰三角形中，内切圆半径即为圆锥内切球半径",
      });

      gaokaoPoints.push({
        text: "圆锥内切球降维求解：轴截面为等腰三角形（底 2r，高 h，腰 l），内切圆半径 r_in = rh / (r+l)。",
        importance: "gaokao",
      });

      reasoningSteps.push(
        {
          step: 1,
          title: "过轴截面降维构建等腰三角形",
          detail: `轴截面等腰三角形底边为 2r，高为 h，腰长母线 l。`,
          latex: `2r = ${2 * a}, \\quad h = ${c}, \\quad l = \\sqrt{r^2 + h^2} = ${l.toFixed(3)}`,
          rubric: "[高考采分点] 作轴截面等腰三角形并求出周长面积 (+2分)",
        },
        {
          step: 2,
          title: "等面积法求解三角形内切圆",
          detail: `等腰三角形面积 S = rh，半周长 p = r + l，由 S = p r_in 建立方程。`,
          latex: `S = \\frac{1}{2}(2r)h = rh = ${(a * c).toFixed(2)}, \\quad p = r + l = ${(a + l).toFixed(3)}`,
          rubric: "[高考采分点] 应用等面积法 S = p r (+2分)",
        },
        {
          step: 3,
          title: "公式解出内切球半径",
          detail: `解得内切球半径 r_in = rh / (r + l)。`,
          latex: `r_{in} = \\frac{rh}{r + l} = \\frac{${(a * c).toFixed(2)}}{${(a + l).toFixed(3)}} = ${radius.toFixed(3)}`,
          rubric: "[高考采分点] 正确解出内切球半径 (+2分)",
        },
      );
    } else {
      // 圆柱 (底半径 a, 高 c)
      radius = Math.min(a, c / 2);
      examAnchor = "高考圆柱内切球充要条件 · 等高圆柱";
      mnemonic = "等高圆柱 (h=2r) 轴截面为正方形，内切球半径等于底面半径 r。";

      quantities.push(
        {
          label: "底面半径 r",
          symbol: "r",
          value: a,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "内切/容纳半径",
          symbol: "r_{in}",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight,
        },
      );

      theorems.push({
        name: "圆柱内切球存在条件",
        latex: `\\color{${MATH_COLORS.paramTertiary}}{h} = 2\\color{${MATH_COLORS.paramPrimary}}{r}`,
        level: "core",
        note: "当且仅当圆柱的高等于底面直径 (h = 2r) 时，才存在与上下底面和侧面均相切的内切球",
      });

      if (Math.abs(c - 2 * a) > 0.1) {
        warnings.push({
          text: `当前圆柱高 h=${c} 不等于底面直径 2r=${2 * a}，圆柱无法同时与上下底面和侧面相切！`,
          level: "warning",
        });
      }

      reasoningSteps.push(
        {
          step: 1,
          title: "轴截面对称性与切点几何分析",
          detail: `圆柱轴截面为 2r × h 的矩形，内切球在轴截面上的投影必须切矩形四边。`,
          latex: `\\text{轴截面矩形规格为 } 2r = ${2 * a}, \\; h = ${c}`,
          rubric: "[高考采分点] 分析轴截面矩形切球性质 (+2分)",
        },
        {
          step: 2,
          title: "充要条件判定（等高圆柱）",
          detail: `矩形内切圆存在充要条件为矩形是正方形，即 h = 2r。`,
          latex: `h = 2r \\iff \\text{圆柱存在内切球}`,
          rubric: "[高考采分点] 指出圆柱内切球充要条件 h = 2r (+2分)",
        },
        {
          step: 3,
          title: "确定内切球半径与度量",
          detail: `满足条件时内切球半径为底面半径 r。`,
          latex: `r_{in} = \\min\\left(r, \\frac{h}{2}\\right) = ${radius.toFixed(3)}`,
          rubric: "[高考采分点] 准确计算内切球半径与度量 (+2分)",
        },
      );
    }

    const V = sphereVolume(radius);
    const S = sphereSurfaceArea(radius);
    quantities.push(
      {
        label: "切球体积 V",
        symbol: "V_{球}",
        value: V.toFixed(3),
        color: MATH_COLORS.secondary,
      },
      {
        label: "切球表面积 S",
        symbol: "S_{球}",
        value: S.toFixed(3),
        color: MATH_COLORS.accent,
      },
    );
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
