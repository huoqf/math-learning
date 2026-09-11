/**
 * src/data/builders/lineEquation.ts
 * 直线方程与点到直线的距离 右屏 MathPanel 数据构造器
 * 严格遵循高中数学课标、高考解答题推导链（审题定法 -> 建模联立 -> 求解反思）与 SSOT 契约
 */

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
  convertFormToGeneral,
  calcPointToLineDistance,
  calcTwoLinesRelation,
  getLineProperties,
  formatMathNumber,
  formatSlopeInterceptEquationLatex,
  formatGeneralEquationLatex,
} from "@/math/lineEquation";
import { formatSignedTerm } from "@/utils/mathFormat";

function formatLinearPoly(a: number, b: number, c: number): string {
  const parts: string[] = [];
  const termA = formatSignedTerm(a, "x", true);
  if (termA) parts.push(termA);
  const termB = formatSignedTerm(b, "y", parts.length === 0);
  if (termB) parts.push(termB);
  const termC = formatSignedTerm(c, "", parts.length === 0);
  if (termC) parts.push(termC);
  return parts.length > 0 ? parts.join(" ") : "0";
}

export function buildLineEquationPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) || "forms";
  const form =
    (config?.form as
      "general" | "intercept" | "pointSlope" | "slopeIntercept" | "twoPoint") ||
    "general";

  const cPrimary = MATH_COLORS.paramPrimary; // #EF4444
  const cSecondary = MATH_COLORS.paramSecondary; // #D97706
  const cTertiary = MATH_COLORS.paramTertiary; // #059669

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  const reasoningSteps: ReasoningStep[] = [];
  let examAnchor = "";
  let mnemonic =
    "斜率存在点斜设，垂直坐标要特设；截距为零别遗漏，一般表达最通通用。点到直线垂线引，分子代值加绝对，分母勾股系数平方和。";

  // 先计算基础一般式系数
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

  // ─────────────────────────────────────────────────────────────
  // 1. 模式一：方程形式转换 (forms)
  // ─────────────────────────────────────────────────────────────
  if (studyMode === "forms") {
    examAnchor = "高中解析几何基石 · 直线方程的五种形式与互化";

    if (form === "pointSlope") {
      const k = params.k ?? 1;
      const x0 = params.x0 ?? 0;
      const y0 = params.y0 ?? 1;

      quantities.push(
        {
          label: "点斜式方程",
          value: `y - (${formatMathNumber(y0)}) = ${formatMathNumber(k)}(x - (${formatMathNumber(x0)}))`,
          color: cPrimary,
        },
        {
          label: "已知定点 P₀",
          value: `(${formatMathNumber(x0)}, ${formatMathNumber(y0)})`,
          color: cSecondary,
        },
        {
          label: "直线斜率 k",
          value: formatMathNumber(k),
          color: cPrimary,
        },
        {
          label: "对应一般式方程",
          value: formatGeneralEquationLatex(A, B, C),
        },
      );

      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 提取已知定点与斜率",
          detail: `已知直线过定点 $P_0(x_0, y_0) = (${formatMathNumber(x0)}, ${formatMathNumber(y0)})$，且直线的倾斜角 $\\alpha \\neq 90^\\circ$，斜率 $k = ${formatMathNumber(k)}$ 存在。`,
          latex: `P_0(${formatMathNumber(x0)}, ${formatMathNumber(y0)}), \\quad k = ${formatMathNumber(k)}`,
          rubric: "采分点：明确已知点与斜率存在前提（2分）",
        },
        {
          step: 2,
          title: "代数展开 · 构建点斜式方程",
          detail: `根据直线上任意动点 $P(x, y)$ 与定点 $P_0$ 满足的斜率定义式 $\\frac{y - y_0}{x - x_0} = k$，去分母代入参数构建点斜式：`,
          latex: `y - y_0 = k(x - x_0) \\implies y - (${formatMathNumber(y0)}) = ${formatMathNumber(k)}(x - (${formatMathNumber(x0)}))`,
          rubric: "采分点：规范写出点斜式方程（4分）",
        },
        {
          step: 3,
          title: "求解反思 · 整理为标准一般式与防漏讨论",
          detail: `移项整理得标准一般式 $Ax + By + C = 0$。注意：解答题中若设点斜式，必须提前说明斜率不存在（即垂直于 $x$ 轴）的特殊情形以防失分。`,
          latex: `y - (${formatMathNumber(y0)}) = ${formatMathNumber(k)}(x - (${formatMathNumber(x0)})) \\implies ${formatGeneralEquationLatex(A, B, C)}`,
          rubric: "采分点：化为一般式并注意斜率不存在讨论（2分）",
        },
      );
    } else if (form === "slopeIntercept") {
      const k = params.k ?? 1;
      const b = params.b ?? 1;

      quantities.push(
        {
          label: "斜截式方程",
          value: formatSlopeInterceptEquationLatex(k, b),
          color: cPrimary,
        },
        {
          label: "直线斜率 k",
          value: formatMathNumber(k),
          color: cPrimary,
        },
        {
          label: "y 轴截距 b",
          value: formatMathNumber(b),
          color: cSecondary,
        },
        {
          label: "对应一般式方程",
          value: formatGeneralEquationLatex(A, B, C),
        },
      );

      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 提取斜率与截距",
          detail: `直线斜率 $k = ${formatMathNumber(k)}$，在 $y$ 轴上的截距 $b = ${formatMathNumber(b)}$（即直线与 $y$ 轴交于定点 $P(0, ${formatMathNumber(b)})$）。`,
          latex: `k = ${formatMathNumber(k)}, \\quad b = ${formatMathNumber(b)} \\implies \\text{直线过点 } P(0, ${formatMathNumber(b)})`,
          rubric: "采分点：明确斜率与截距的几何意义（2分）",
        },
        {
          step: 2,
          title: "代数建模 · 代入斜截式模型",
          detail: `由斜截式标准型 $y = kx + b$，将已知参数代入解析式并展开：`,
          latex: `y = kx + b \\implies y = ${formatMathNumber(k)} \\cdot x ${b >= 0 ? "+" : "-"} ${formatMathNumber(Math.abs(b))} \\implies ${formatSlopeInterceptEquationLatex(k, b)}`,
          rubric: "采分点：规范写出斜截式方程（4分）",
        },
        {
          step: 3,
          title: "化简转化 · 移项化为标准一般式",
          detail: `将方程各项移至等号同一侧，得到平面解析几何标准一般式方程 $Ax + By + C = 0$：`,
          latex: `${formatSlopeInterceptEquationLatex(k, b)} \\implies ${formatGeneralEquationLatex(A, B, C)}`,
          rubric: "采分点：规范化为标准一般式（2分）",
        },
      );
    } else if (form === "twoPoint") {
      const x1 = params.x1 ?? -2;
      const y1 = params.y1 ?? -1;
      const x2 = params.x2 ?? 2;
      const y2 = params.y2 ?? 3;
      const isVert = Math.abs(x1 - x2) < 1e-9;
      const isHoriz = Math.abs(y1 - y2) < 1e-9;

      quantities.push(
        {
          label: "两点式方程",
          value:
            !isVert && !isHoriz
              ? `\\frac{y - (${formatMathNumber(y1)})}{${formatMathNumber(y2 - y1)}} = \\frac{x - (${formatMathNumber(x1)})}{${formatMathNumber(x2 - x1)}}`
              : "分母为 0 (退化)",
          color: cPrimary,
        },
        {
          label: "已知点 P₁",
          value: `(${formatMathNumber(x1)}, ${formatMathNumber(y1)})`,
          color: cSecondary,
        },
        {
          label: "已知点 P₂",
          value: `(${formatMathNumber(x2)}, ${formatMathNumber(y2)})`,
          color: cTertiary,
        },
        {
          label: "对应一般式方程",
          value: formatGeneralEquationLatex(A, B, C),
        },
      );

      if (isVert) {
        reasoningSteps.push(
          {
            step: 1,
            title: "审题定法 · 检测坐标关系",
            detail: `两定点横坐标相同：$x_1 = x_2 = ${formatMathNumber(x1)}$，两点连线垂直于 $x$ 轴（平行于 $y$ 轴）。`,
            latex: `x_1 = x_2 = ${formatMathNumber(x1)}, \\quad y_1 \\neq y_2`,
            rubric: "采分点：发现垂直于坐标轴特殊位置（3分）",
          },
          {
            step: 2,
            title: "退化分析 · 两点式分母为零失效",
            detail: `两点式方程分母中包含 $x_2 - x_1 = 0$，故不可直接套用两点式分式形态。`,
            latex: `x_2 - x_1 = 0 \\implies \\text{两点式分式无意义}`,
            rubric: "采分点：说明分式无意义原因（2分）",
          },
          {
            step: 3,
            title: "特化求解 · 给出特殊直线方程",
            detail: `直线上所有点的横坐标恒为 $${formatMathNumber(x1)}$，故方程特化为铅垂线方程：`,
            latex: `x = ${formatMathNumber(x1)} \\implies x - ${formatMathNumber(x1)} = 0`,
            rubric: "采分点：准确写出铅垂线方程（3分）",
          },
        );
      } else if (isHoriz) {
        reasoningSteps.push(
          {
            step: 1,
            title: "审题定法 · 检测坐标关系",
            detail: `两定点纵坐标相同：$y_1 = y_2 = ${formatMathNumber(y1)}$，两点连线平行于 $x$ 轴（斜率 $k = 0$）。`,
            latex: `y_1 = y_2 = ${formatMathNumber(y1)}, \\quad x_1 \\neq x_2`,
            rubric: "采分点：判定为水平直线（3分）",
          },
          {
            step: 2,
            title: "退化分析 · 两点式分母为零失效",
            detail: `两点式方程纵坐标差分母 $y_2 - y_1 = 0$，不可套用两点式分式形式。`,
            latex: `y_2 - y_1 = 0 \\implies \\text{两点式分式无意义}`,
            rubric: "采分点：说明分母为零（2分）",
          },
          {
            step: 3,
            title: "特化求解 · 给出水平直线方程",
            detail: `直线上所有点的纵坐标恒为 $${formatMathNumber(y1)}$，故方程为水平线方程：`,
            latex: `y = ${formatMathNumber(y1)} \\implies y - ${formatMathNumber(y1)} = 0`,
            rubric: "采分点：准确写出水平线方程（3分）",
          },
        );
      } else {
        const dx = x2 - x1;
        const dy = y2 - y1;
        reasoningSteps.push(
          {
            step: 1,
            title: "审题定法 · 验证两点不平行于坐标轴",
            detail: `点 $P_1(${formatMathNumber(x1)}, ${formatMathNumber(y1)})$ 与 $P_2(${formatMathNumber(x2)}, ${formatMathNumber(y2)})$ 满足 $x_1 \\neq x_2$ 且 $y_1 \\neq y_2$。`,
            latex: `x_2 - x_1 = ${formatMathNumber(dx)} \\neq 0, \\quad y_2 - y_1 = ${formatMathNumber(dy)} \\neq 0`,
            rubric: "采分点：检验两点式适用前提（2分）",
          },
          {
            step: 2,
            title: "建模代入 · 套用两点式标准方程",
            detail: `将两点坐标代入两点式方程 $\\frac{y - y_1}{y_2 - y_1} = \\frac{x - x_1}{x_2 - x_1}$：`,
            latex: `\\frac{y - (${formatMathNumber(y1)})}{${formatMathNumber(dy)}} = \\frac{x - (${formatMathNumber(x1)})}{${formatMathNumber(dx)}}`,
            rubric: "采分点：规范代入两点式（3分）",
          },
          {
            step: 3,
            title: "交叉消元 · 整理化为一般式",
            detail: `交叉相乘去分母并移项合并同类项：`,
            latex: `${formatMathNumber(dy)}(x - (${formatMathNumber(x1)})) - ${formatMathNumber(dx)}(y - (${formatMathNumber(y1)})) = 0 \\implies ${formatGeneralEquationLatex(A, B, C)}`,
            rubric: "采分点：化简为标准一般式（3分）",
          },
        );
      }
    } else if (form === "intercept") {
      const a = params.a ?? 3;
      const b = params.b ?? 2;
      const isValidInt = Math.abs(a) > 1e-9 && Math.abs(b) > 1e-9;

      quantities.push(
        {
          label: "截距式方程",
          value: isValidInt
            ? `\\frac{x}{${formatMathNumber(a)}} + \\frac{y}{${formatMathNumber(b)}} = 1`
            : "截距为 0 (无效)",
          color: cPrimary,
        },
        {
          label: "x 轴截距 a",
          value: formatMathNumber(a),
          color: cSecondary,
        },
        {
          label: "y 轴截距 b",
          value: formatMathNumber(b),
          color: cTertiary,
        },
        {
          label: "对应一般式方程",
          value: formatGeneralEquationLatex(A, B, C),
        },
      );

      if (!isValidInt) {
        reasoningSteps.push(
          {
            step: 1,
            title: "审题定法 · 截距为零警示",
            detail: `直线过坐标原点 $(0, 0)$ 或平行于坐标轴，截距 $a$ 或 $b$ 为 $0$。`,
            latex: `a = ${formatMathNumber(a)}, \\quad b = ${formatMathNumber(b)} \\implies ab = 0`,
            rubric: "采分点：说明截距为零不可用截距式（3分）",
          },
          {
            step: 2,
            title: "易错反思 · 截距式的定义域限制",
            detail: `截距式方程 $\\frac{x}{a} + \\frac{y}{b} = 1$ 的分母必须非零，过原点的直线不能用截距式表示，必须设点斜式 $y = kx$ 或一般式。`,
            latex: `\\text{截距式前提：} a \\neq 0 \\text{ 且 } b \\neq 0`,
            rubric: "采分点：明确定义域前提条件（3分）",
          },
          {
            step: 3,
            title: "补救求解 · 设点斜式或一般式求解",
            detail: `改设一般式 $Ax + By = 0$ 表达过原点的直线。`,
            latex: `${formatGeneralEquationLatex(A, B, 0)}`,
            rubric: "采分点：正确给出替代方程（2分）",
          },
        );
      } else {
        const area = 0.5 * Math.abs(a * b);
        reasoningSteps.push(
          {
            step: 1,
            title: "审题定法 · 提取坐标轴截距",
            detail: `直线在 $x$ 轴上的截距为 $a = ${formatMathNumber(a)}$（交点 $A(${formatMathNumber(a)}, 0)$），在 $y$ 轴上的截距为 $b = ${formatMathNumber(b)}$（交点 $B(0, ${formatMathNumber(b)})$）。`,
            latex: `A(${formatMathNumber(a)}, 0), \\quad B(0, ${formatMathNumber(b)})`,
            rubric: "采分点：准确理解截距概念（非距离，带正负）（2分）",
          },
          {
            step: 2,
            title: "建模代入 · 列截距式方程",
            detail: `将截距代入标准截距式方程 $\\frac{x}{a} + \\frac{y}{b} = 1$：`,
            latex: `\\frac{x}{a} + \\frac{y}{b} = 1 \\implies \\frac{x}{${formatMathNumber(a)}} + \\frac{y}{${formatMathNumber(b)}} = 1`,
            rubric: "采分点：规范写出截距式方程（3分）",
          },
          {
            step: 3,
            title: "几何应用 · 围成三角形面积与一般式转化",
            detail: `两边同乘以 $ab$ 化为一般式，且直线与坐标轴围成直角三角形面积 $S = \\frac{1}{2}|ab|$：`,
            latex: `${formatGeneralEquationLatex(A, B, C)}, \\quad S_{\\triangle AOB} = \\frac{1}{2}|ab| = ${formatMathNumber(area)}`,
            rubric: "采分点：转化为一般式并求解围成面积（3分）",
          },
        );
      }
    } else {
      // 一般式 (general)
      quantities.push(
        {
          label: "一般式方程",
          value: formatGeneralEquationLatex(A, B, C),
          color: cPrimary,
        },
        {
          label: "斜率 k",
          value:
            lineProps.slope !== null
              ? formatMathNumber(lineProps.slope)
              : "不存在 (垂直 x 轴)",
          color: cSecondary,
        },
        {
          label: "倾斜角 α",
          value: `${formatMathNumber(lineProps.inclinationDeg)}°`,
          color: cTertiary,
        },
        {
          label: "x 轴截距 a",
          value:
            lineProps.xIntercept !== null
              ? formatMathNumber(lineProps.xIntercept)
              : "无 (平行 x 轴)",
        },
        {
          label: "y 轴截距 b",
          value:
            lineProps.yIntercept !== null
              ? formatMathNumber(lineProps.yIntercept)
              : "无 (平行 y 轴)",
        },
      );

      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 提取一般式系数与法向量",
          detail: `方程 $Ax + By + C = 0$ 中，$A = ${formatMathNumber(A)}, B = ${formatMathNumber(B)}, C = ${formatMathNumber(C)}$。直线的法向量为 $\\vec{n} = (A, B) = (${formatMathNumber(A)}, ${formatMathNumber(B)})$，方向向量为 $\\vec{v} = (-B, A) = (${formatMathNumber(-B)}, ${formatMathNumber(A)})$。`,
          latex: `\\vec{n} = (${formatMathNumber(A)}, ${formatMathNumber(B)}), \\quad \\vec{v} = (${formatMathNumber(-B)}, ${formatMathNumber(A)})`,
          rubric: "采分点：写出一般式系数与特征几何向量（2分）",
        },
        {
          step: 2,
          title: "代数消元 · 求解斜率与倾斜角",
          detail:
            Math.abs(B) > 1e-9
              ? `因 $B \\neq 0$，两边同除以 $B$ 得斜率 $k = -\\frac{A}{B} = ${formatMathNumber(lineProps.slope ?? 0)}$，倾斜角 $\\alpha = ${formatMathNumber(lineProps.inclinationDeg)}^\\circ$。`
              : `因 $B = 0$，直线垂直于 $x$ 轴，斜率不存在，倾斜角 $\\alpha = 90^\\circ$。`,
          latex:
            Math.abs(B) > 1e-9
              ? `k = -\\frac{A}{B} = -\\frac{${formatMathNumber(A)}}{${formatMathNumber(B)}} = ${formatMathNumber(lineProps.slope ?? 0)}, \\quad \\alpha = ${formatMathNumber(lineProps.inclinationDeg)}^\\circ`
              : `B = 0 \\implies k \\text{ 不存在}, \\quad \\alpha = 90^\\circ`,
          rubric: "采分点：由一般式准确求解斜率与倾斜角（3分）",
        },
        {
          step: 3,
          title: "求解反思 · 求解两轴截距与几何图象",
          detail: `令 $y = 0$ 解得 $x$ 轴截距 $a = -\\frac{C}{A}$；令 $x = 0$ 解得 $y$ 轴截距 $b = -\\frac{C}{B}$：`,
          latex: `a = ${lineProps.xIntercept !== null ? formatMathNumber(lineProps.xIntercept) : "\\text{不存在}"}, \\quad b = ${lineProps.yIntercept !== null ? formatMathNumber(lineProps.yIntercept) : "\\text{不存在}"}`,
          rubric: "采分点：正确求解坐标轴截距（3分）",
        },
      );
    }

    if (form === "pointSlope") {
      theorems.push(
        {
          name: "点斜式方程",
          latex: "y - y_0 = k(x - x_0)",
          condition: "适用于斜率 $k$ 存在（直线不垂直于 $x$ 轴）的情况",
          level: "core",
        },
        {
          name: "一般式方程（化简对应）",
          latex: "kx - y + (y_0 - k x_0) = 0",
          condition: "点斜式去括号移项整理得到的标准一般式",
          level: "derived",
        },
      );
      gaokaoPoints.push({
        text: "【防漏斜率不存在】在解析几何大题中设直线方程为点斜式 $y - y_0 = k(x - x_0)$ 时，必须优先对斜率 $k$ 是否存在进行分类讨论，防止漏掉垂直于 $x$ 轴的切线或边界解。",
        importance: "gaokao",
      });
    } else if (form === "slopeIntercept") {
      theorems.push(
        {
          name: "斜截式方程",
          latex: "y = kx + b",
          condition: "已知斜率 $k$ 与 $y$ 轴截距 $(0, b)$，直线不垂直于 $x$ 轴",
          level: "core",
        },
        {
          name: "斜率与倾斜角关系",
          latex: "k = \\tan \\alpha",
          condition:
            "\\alpha \\in [0, \\pi) \\text{ 且 } \\alpha \\neq \\frac{\\pi}{2}",
          level: "important",
        },
      );
      gaokaoPoints.push({
        text: "【截距非距离】斜截式中的 $b$ 是直线在 $y$ 轴上的截距（交点纵坐标），带正负号，绝不等同于点到原点的距离 $|b|$。",
        importance: "core",
      });
    } else if (form === "twoPoint") {
      theorems.push(
        {
          name: "两点式方程",
          latex: "\\frac{y - y_1}{y_2 - y_1} = \\frac{x - x_1}{x_2 - x_1}",
          condition:
            "x_1 \\neq x_2 \\text{ 且 } y_1 \\neq y_2 \\text{（直线不平行于坐标轴）}",
          level: "core",
        },
        {
          name: "两点斜率公式",
          latex: "k = \\frac{y_2 - y_1}{x_2 - x_1}",
          condition: "x_1 \\neq x_2",
          level: "important",
        },
      );
      gaokaoPoints.push({
        text: "【整式化避免讨论】两点式在两点横坐标或纵坐标相等时分母为 $0$ 失效。高考常将其化为整式方程 $(y_2 - y_1)(x - x_1) - (x_2 - x_1)(y - y_1) = 0$ 免去分类讨论。",
        importance: "gaokao",
      });
    } else if (form === "intercept") {
      theorems.push(
        {
          name: "截距式方程",
          latex: "\\frac{x}{a} + \\frac{y}{b} = 1",
          condition:
            "a \\neq 0 \\text{ 且 } b \\neq 0 \\text{（不过原点且不平行于坐标轴）}",
          level: "core",
        },
        {
          name: "两轴围成三角形面积",
          latex: "S_{\\triangle AOB} = \\frac{1}{2} |a \\cdot b|",
          condition: "直线与坐标轴垂直相交围成的直角三角形",
          level: "important",
        },
      );
      gaokaoPoints.push({
        text: "【不过原点警示】截距式 $\\frac{x}{a} + \\frac{y}{b} = 1$ 的前提是截距 $a \\neq 0$ 且 $b \\neq 0$。求过定点且在两轴截距相等的直线方程时，务必分类讨论截距为 $0$（直线过原点）的特解。",
        importance: "gaokao",
      });
    } else {
      theorems.push(
        {
          name: "一般式方程",
          latex: "Ax + By + C = 0",
          condition:
            "A, B \\text{ 不同时为 } 0 \\text{（即 } A^2 + B^2 > 0 \\text{）}",
          level: "core",
        },
        {
          name: "法向量与方向向量",
          latex: "\\vec{n} = (A, B), \\quad \\vec{v} = (-B, A)",
          condition: "\\vec{n} \\perp L, \\quad \\vec{v} \\parallel L",
          level: "derived",
        },
      );
      gaokaoPoints.push({
        text: "【通用性最强】一般式 $Ax + By + C = 0$ 能表示平面内的任意直线（包含斜率不存在的铅垂线）。法向量 $\\vec{n}=(A, B)$ 是向量法求解两线夹角与距离的核心几何工具。",
        importance: "core",
      });
    }

    if (Math.abs(A) < 1e-9 && Math.abs(B) < 1e-9) {
      warnings.push({
        text: "退化警告：当 $A$ 与 $B$ 同时为 $0$ 时，$Ax + By + C = 0$ 不表示直线！",
        level: "danger",
      });
    }

    if (form === "twoPoint") {
      const x1 = params.x1 ?? -2;
      const y1 = params.y1 ?? -1;
      const x2 = params.x2 ?? 2;
      const y2 = params.y2 ?? 3;
      if (Math.abs(x1 - x2) < 1e-9 && Math.abs(y1 - y2) < 1e-9) {
        warnings.push({
          text: "两点重合（$P_1 = P_2$），无法确定唯一直线！",
          level: "danger",
        });
      } else if (Math.abs(x1 - x2) < 1e-9) {
        warnings.push({
          text: "两点横坐标相同（$x_1 = x_2$），直线垂直于 $x$ 轴，两点式分母为 $0$ 失效，应表示为 $x = x_1$！",
          level: "warning",
        });
      } else if (Math.abs(y1 - y2) < 1e-9) {
        warnings.push({
          text: "两点纵坐标相同（$y_1 = y_2$），直线平行于 $x$ 轴，两点式分母为 $0$ 失效，应表示为 $y = y_1$！",
          level: "warning",
        });
      }
    }

    if (
      form === "intercept" &&
      (Math.abs(params.a ?? 0) < 1e-9 || Math.abs(params.b ?? 0) < 1e-9)
    ) {
      warnings.push({
        text: "截距式要求 $a \\neq 0$ 且 $b \\neq 0$。过原点或平行于坐标轴的直线不能用截距式表示！",
        level: "warning",
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. 模式二：点到直线的距离 (distance)
  // ─────────────────────────────────────────────────────────────
  else if (studyMode === "distance") {
    examAnchor = "新高考核心考点 · 点到直线的距离与垂足求解";

    const x0 = params.x0 ?? 2;
    const y0 = params.y0 ?? 3;
    const p2l = calcPointToLineDistance(x0, y0, A, B, C);

    quantities.push(
      {
        label: "待测点 P₀",
        value: `(${formatMathNumber(x0)}, ${formatMathNumber(y0)})`,
        color: cSecondary,
      },
      {
        label: "目标直线 L",
        value: formatGeneralEquationLatex(A, B, C),
        color: cPrimary,
      },
      {
        label: "点线距离 d",
        value: formatMathNumber(p2l.distance),
        color: cPrimary,
      },
      {
        label: "垂足 Q 坐标",
        value: `(${formatMathNumber(p2l.foot.x)}, ${formatMathNumber(p2l.foot.y)})`,
        color: cTertiary,
      },
    );

    const numeratorVal = Math.abs(A * x0 + B * y0 + C);
    const denomVal = Math.hypot(A, B);

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 提炼已知量与法向量",
        detail: `给定平面待测点 $P_0(x_0, y_0) = (${formatMathNumber(x0)}, ${formatMathNumber(y0)})$，目标直线一般式方程为 $Ax + By + C = 0$，其中系数 $A = ${formatMathNumber(A)}, B = ${formatMathNumber(B)}, C = ${formatMathNumber(C)}$。直线的法向量为 $\\vec{n} = (${formatMathNumber(A)}, ${formatMathNumber(B)})$。`,
        latex: `P_0(${formatMathNumber(x0)}, ${formatMathNumber(y0)}), \\quad L: ${formatGeneralEquationLatex(A, B, C)}`,
        rubric: "采分点：明确已知量与直线方程（2分）",
      },
      {
        step: 2,
        title: "建模展开 · 代入距离公式",
        detail: `套用高中核心公式 $d = \\frac{|Ax_0 + By_0 + C|}{\\sqrt{A^2 + B^2}}$，将点坐标代入分子绝对值项，将系数代入分母模长项：`,
        latex: `d = \\frac{|${formatMathNumber(A)} \\cdot (${formatMathNumber(x0)}) + (${formatMathNumber(B)}) \\cdot (${formatMathNumber(y0)}) + (${formatMathNumber(C)})|}{\\sqrt{(${formatMathNumber(A)})^2 + (${formatMathNumber(B)})^2}} = \\frac{${formatMathNumber(numeratorVal)}}{${formatMathNumber(denomVal)}}`,
        rubric: "采分点：规范代入展开距离公式（4分）",
      },
      {
        step: 3,
        title: "求解反思 · 求距离与垂足",
        detail:
          p2l.distance < 1e-4
            ? "计算得距离 $d = 0$。说明代入分子为零，点 $P_0$ 恰好位于目标直线 $L$ 上，垂足 $Q$ 与点 $P_0$ 重合。"
            : `计算得最短垂直距离 $d = ${formatMathNumber(p2l.distance)}$。过点 $P_0$ 作直线的垂线 $P_0 Q \\perp L$，求得垂足 $Q(x_H, y_H) = (${formatMathNumber(p2l.foot.x)}, ${formatMathNumber(p2l.foot.y)})$。`,
        latex: `d = \\mathbf{${formatMathNumber(p2l.distance)}}, \\quad Q(${formatMathNumber(p2l.foot.x)}, ${formatMathNumber(p2l.foot.y)})`,
        rubric: "采分点：准确求出解与垂足坐标（2分）",
      },
    );

    theorems.push(
      {
        name: "点到直线的距离公式",
        latex: "d = \\frac{|A x_0 + B y_0 + C|}{\\sqrt{A^2 + B^2}}",
        condition: "点 $P(x_0, y_0)$ 到直线 $Ax + By + C = 0$ 的最短几何距离",
        level: "core",
      },
      {
        name: "垂足坐标公式",
        latex:
          "\\begin{cases} x_H = \\dfrac{B^2 x_0 - AB y_0 - AC}{A^2 + B^2} \\\\[0.5em] y_H = \\dfrac{A^2 y_0 - AB x_0 - BC}{A^2 + B^2} \\end{cases}",
        condition: "PQ \\perp L",
        level: "derived",
      },
    );

    gaokaoPoints.push(
      {
        text: "在求直线与圆相交的弦长及圆的切线方程时，点到直线的距离 $d$ 是联系圆心到直线的距离与弦长（$2\\sqrt{R^2 - d^2}$）的核心钥匙。",
        importance: "gaokao",
      },
      {
        text: "求点 $P$ 关于直线 $L$ 的对称点 $P'$，本质利用垂足 $Q$ 是 $PP'$ 的中点，且直线 $PP'$ 与 $L$ 垂直（斜率乘积为 $-1$）。",
        importance: "core",
      },
    );

    if (!p2l.isValid) {
      warnings.push({
        text: "直线系数 $A$ 和 $B$ 不能同时为 $0$，否则无法计算点到直线的距离！",
        level: "danger",
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. 模式三：两条直线的位置关系 (relation)
  // ─────────────────────────────────────────────────────────────
  else if (studyMode === "relation") {
    examAnchor = "高中解析几何核心 · 两直线平行、垂直与交点判定";

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
        label: "位置关系判定",
        value: relTextMap[rel.type],
        color:
          rel.isPerpendicular || rel.type === "parallel"
            ? MATH_COLORS.primary
            : MATH_COLORS.labelText,
      },
    );

    const dotProd = A * A2 + B * B2;
    const crossProd = A * B2 - A2 * B;

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 提取两直线系数与方向法向量",
        detail:
          "两直线的一般式系数分别为 $L_1(" +
          A.toFixed(1) +
          ", " +
          B.toFixed(1) +
          ", " +
          C.toFixed(1) +
          ")$ 与 $L_2(" +
          A2.toFixed(1) +
          ", " +
          B2.toFixed(1) +
          ", " +
          C2.toFixed(1) +
          ")$。其对应法向量分别为 $\\vec{n}_1 = (" +
          A.toFixed(1) +
          ", " +
          B.toFixed(1) +
          ")$，$\\vec{n}_2 = (" +
          A2.toFixed(1) +
          ", " +
          B2.toFixed(1) +
          ")$。",
        latex: `\\vec{n}_1 = (${A.toFixed(1)}, ${B.toFixed(1)}), \\quad \\vec{n}_2 = (${A2.toFixed(1)}, ${B2.toFixed(1)})`,
        rubric: "采分点：提取两直线系数与法向量（2分）",
      },
      {
        step: 2,
        title: "充要代数判定 · 计算数量积与交叉乘积",
        detail:
          "计算法向量数量积 $\\vec{n}_1 \\cdot \\vec{n}_2 = A_1 A_2 + B_1 B_2 = " +
          dotProd.toFixed(2) +
          "$；交叉积 $A_1 B_2 - A_2 B_1 = " +
          crossProd.toFixed(2) +
          "$：",
        latex: `A_1 A_2 + B_1 B_2 = ${dotProd.toFixed(2)}, \\quad A_1 B_2 - A_2 B_1 = ${crossProd.toFixed(2)}`,
        rubric: "采分点：列出平行与垂直的代数充要判据（3分）",
      },
      {
        step: 3,
        title: "求解反思 · 得出位置结论与几何特征量",
        detail: rel.isPerpendicular
          ? "因 $A_1 A_2 + B_1 B_2 = 0$，两直线互相垂直（$L_1 \\perp L_2$）。联立方程求得交点坐标为 $P(" +
            (rel.intersection?.x.toFixed(2) ?? "0") +
            ", " +
            (rel.intersection?.y.toFixed(2) ?? "0") +
            ")$。"
          : rel.type === "parallel"
            ? "因 $A_1 B_2 - A_2 B_1 = 0$ 且常数项不成比例，两直线互相平行（$L_1 \\parallel L_2$）。平行线间的垂直间距为 $d = " +
              (rel.distance?.toFixed(3) ?? "0") +
              "$。"
            : rel.type === "coincident"
              ? "因系数与常数项完全成比例，两条直线重合（表示平面内的同一直线）。"
              : "两直线相交，夹角 $\\theta = " +
                rel.angleDeg.toFixed(1) +
                "^\\circ$，联立解得唯一交点 $P(" +
                (rel.intersection?.x.toFixed(2) ?? "0") +
                ", " +
                (rel.intersection?.y.toFixed(2) ?? "0") +
                ")$。",
        latex:
          rel.type === "parallel"
            ? `L_1 \\parallel L_2, \\quad d = \\mathbf{${rel.distance?.toFixed(3) ?? "0"}}`
            : rel.type === "coincident"
              ? `L_1 = L_2 \\quad (\\text{重合})`
              : `P(${rel.intersection?.x.toFixed(2) ?? "0"}, ${rel.intersection?.y.toFixed(2) ?? "0"}), \\quad \\theta = ${rel.angleDeg.toFixed(1)}^\\circ`,
        rubric: "采分点：准确判定位置并给出交点或距离（3分）",
      },
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
        name: "两直线垂直判定",
        latex:
          "L_1 \\perp L_2 \\iff A_1 A_2 + B_1 B_2 = 0 \\quad (k_1 k_2 = -1)",
        condition: "两直线的法向量数量积为 $0$（或斜率乘积 $k_1 k_2 = -1$）",
        level: "core",
      },
      {
        name: "两直线平行判定",
        latex:
          "L_1 \\parallel L_2 \\iff A_1 B_2 - A_2 B_1 = 0 \\quad \\text{且} \\quad A_1 C_2 - A_2 C_1 \\neq 0",
        condition: "斜率相等但截距不相等（$k_1 = k_2$ 且 $b_1 \\neq b_2$）",
        level: "core",
      },
      {
        name: "两平行直线间的距离公式",
        latex: "d = \\frac{|C_1 - C_2|}{\\sqrt{A^2 + B^2}}",
        condition:
          "L_1 \\parallel L_2 \\text{ 且 } x, y \\text{ 系数必须完全化为一致}",
        level: "important",
      },
    );

    gaokaoPoints.push({
      text: "在直接代入平行线距离公式 $d = \\frac{|C_1 - C_2|}{\\sqrt{A^2 + B^2}}$ 之前，必须先将两直线的 $x$ 和 $y$ 系数化为完全相同（如 $2x - 3y + 1 = 0$ 与 $4x - 6y + 5 = 0$，需先将前者化为 $4x - 6y + 2 = 0$）。",
      importance: "gaokao",
    });

    if (rel.type === "coincident") {
      warnings.push({
        text: "两条直线重合，平行线距离为 $0$。使用平行线公式前请先排除重合！",
        level: "warning",
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. 模式四：直线系方程 (family)
  // ─────────────────────────────────────────────────────────────
  else if (studyMode === "family") {
    examAnchor = "新高考压轴技巧 · 相交直线系与分离参数法求定点";

    const lam = params.lambda ?? 1;
    const A2 = params.A2 ?? 1;
    const B2 = params.B2 ?? 1;
    const C2 = params.C2 ?? -2;

    const A_fam = A + lam * A2;
    const B_fam = B + lam * B2;
    const C_fam = C + lam * C2;

    const rel = calcTwoLinesRelation(A, B, C, A2, B2, C2);

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
      },
    );

    if (rel.type === "intersect" && rel.intersection) {
      quantities.push({
        label: "直线系恒过定点 P₀",
        value: `(${rel.intersection.x.toFixed(2)}, ${rel.intersection.y.toFixed(2)})`,
        color: MATH_COLORS.primary,
        isInvariant: true,
        invariantNote: "无论变参数 λ 取何值，动直线均恒过两基准直线交点",
      });

      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 列出相交直线系方程",
          detail: `给定两相交基准直线 $L_1$ 与 $L_2$，引入变参数 $\\lambda = ${formatMathNumber(lam)}$ 构造直线系：$L_1 + \\lambda L_2 = 0$。`,
          latex: `(${formatLinearPoly(A, B, C)}) + \\lambda (${formatLinearPoly(A2, B2, C2)}) = 0`,
          rubric: "采分点：写出相交直线系标准组合型（2分）",
        },
        {
          step: 2,
          title: "分离参数 · 构建恒成立方程组",
          detail:
            "要使方程对任意实数 $\\lambda \\in \\mathbb{R}$ 恒成立，根据多项式恒等定理，必须使 $\\lambda$ 的系数与常数项分别同时为 $0$：",
          latex: `\\begin{cases} ${formatLinearPoly(A, B, C)} = 0 \\\\ ${formatLinearPoly(A2, B2, C2)} = 0 \\end{cases}`,
          rubric: "采分点：运用分离参数法列出联立方程组（3分）",
        },
        {
          step: 3,
          title: "求解反思 · 联立解出公共定点坐标",
          detail: `解该二元一次方程组，求得直线系恒过的定点坐标为 $P_0(${formatMathNumber(rel.intersection.x)}, ${formatMathNumber(rel.intersection.y)})$。注意：该直线系包含了过 $P_0$ 的除 $L_2$ 本身之外的所有直线。`,
          latex: `P_0(${formatMathNumber(rel.intersection.x)}, ${formatMathNumber(rel.intersection.y)}) \\quad (\\text{恒定不变})`,
          rubric: "采分点：准确求出定点坐标并指出不含 L₂（3分）",
        },
      );
    }

    theorems.push(
      {
        name: "过两直线交点的直线系",
        latex: "A_1 x + B_1 y + C_1 + \\lambda (A_2 x + B_2 y + C_2) = 0",
        condition:
          "表示经过 $L_1$ 与 $L_2$ 交点（若相交）的所有直线（不包含 $L_2$ 本身）",
        level: "core",
      },
      {
        name: "平行/垂直直线系",
        latex:
          "\\text{平行系: } Ax + By + \\lambda = 0, \\quad \\text{垂直系: } Bx - Ay + \\lambda = 0",
        condition: "\\lambda \\in \\mathbb{R}",
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "【分离参数法求定点】对于形如 $(2\\lambda+1)x + (\\lambda-1)y + \\lambda - 4 = 0$ 的含参直线，按 $\\lambda$ 整理为 $(2x + y + 1)\\lambda + (x - y - 4) = 0$，解方程组 $2x + y + 1 = 0$ 与 $x - y - 4 = 0$ 即可求得恒过的定点坐标。",
        importance: "gaokao",
      },
      {
        text: "【直线系设线技巧】求经过两已知直线交点的直线方程时，优先设为 $L_1 + \\lambda L_2 = 0$，再代入已知条件（如过某点或垂直）解出 $\\lambda$，避免求交点联立方程组的繁琐计算。",
        importance: "gaokao",
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
