import type { MathPanelData } from "../types";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  calcAsymVieta,
  calcHiddenCircle,
  calcSymmetryShortest,
  type ConicAsymStudyMode,
  type HiddenCircleType,
} from "@/math/conicAsymmetricVieta";
import { getConicAsymAnswerSteps } from "@/data/registries/conicAsymmetricVieta";

export function buildConicAsymmetricVietaPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as ConicAsymStudyMode) || "asymVieta";
  const circleType = (config?.circleType as HiddenCircleType) || "diameter";
  const stepTemplates = getConicAsymAnswerSteps();

  if (mode === "asymVieta") {
    const res = calcAsymVieta(
      params.a ?? 3.0,
      params.b ?? 2.0,
      params.x0 ?? 2.0,
      params.m ?? 0.6,
    );
    const ratioStr = formatMathNumber(res.vietaRatioConst, 3);
    const fixedXStr = formatMathNumber(res.fixedLineX, 3);

    return {
      examAnchor: "选择性必修一解析几何 · 非对称韦达和积互化破题",
      mnemonic: "非对称式莫硬算，先找和积线性比，m乘两根积换两根和！",
      quantities: [
        {
          label: "两根之和",
          symbol: "y_1 + y_2",
          value: formatMathNumber(res.ySum, 3),
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "两根之积",
          symbol: "y_1 y_2",
          value: formatMathNumber(res.yProd, 3),
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "交点 T 纵坐标",
          symbol: "y_T",
          value: formatMathNumber(res.ptT.y, 3),
          color: MATH_COLORS.function,
        },
        {
          label: "交点 T 横坐标（定值）",
          symbol: "x_T = a^2 / x_0",
          value: fixedXStr,
          isInvariant: true,
          invariantNote:
            "利用和积比例关系消去 $y_1, y_2$ 后，交点横坐标恒为定值 $\\frac{a^2}{x_0}$。",
          color: MATH_COLORS.inequality,
        },
      ],
      theorems: [
        {
          name: "非对称韦达和积比例转换法",
          latex: "m y_1 y_2 = \\frac{a^2 - x_0^2}{2 x_0}(y_1 + y_2)",
          condition:
            "适用前提：联立二次方程常数项与一次项均同比例依赖直线参数 $m$，使得 $\\frac{y_1 y_2}{y_1 + y_2}$ 与参数 $m$ 无关或呈简单线性。",
          note: "代换后分子分母中的非对称交叉结构 $\\frac{a-x_0}{2x_0}y_1 + \\frac{a+x_0}{2x_0}y_2$ 完全约分，一步得出定值定直线。",
          level: "core",
        },
      ],
      warnings: [
        {
          text: "运算防错提示：在反设直线 $x = m y + x_0$ 时，已天然包含斜率不存在的竖直直线（$m=0$），但不能表示水平线 $y=0$（该处 $A, B$ 退化为左右顶点）。",
          level: "info",
        },
      ],
      reasoningSteps: [
        {
          step: stepTemplates[0].step,
          title: stepTemplates[0].title,
          detail:
            "过定点 $(x_0, 0)$ 反设动直线 $x = my + x_0$ 与椭圆联立写出韦达定理。",
          latex: `y_1+y_2 = ${formatMathNumber(res.ySum, 3)}, \\quad y_1 y_2 = ${formatMathNumber(res.yProd, 3)}`,
          rubric: "【高考采分点】正确联立方程并写出标准韦达式（4分）",
        },
        {
          step: stepTemplates[1].step,
          title: stepTemplates[1].title,
          detail:
            "作商得出和积换元等式，将其代入交点比例式消去积项 $m y_1 y_2$。",
          latex: `m y_1 y_2 = ${ratioStr}(y_1 + y_2)`,
          rubric: "【高考采分点】构造和积线性代换消除非对称结构（5分）",
        },
        {
          step: stepTemplates[2].step,
          title: stepTemplates[2].title,
          detail:
            "提取公因式并约去 $(a-x_0)y_1 + (a+x_0)y_2$，证得 $x_T$ 为常数。",
          latex: `\\frac{x_T+a}{x_T-a} = \\frac{a+x_0}{a-x_0} \\implies x_T = \\frac{a^2}{x_0} = ${fixedXStr}`,
          rubric: "【高考采分点】严格完成因式约分并给出定直线结论（6分）",
        },
      ],
      gaokaoPoints: [
        {
          text: "除“和积互化代换”外，亦可采用“整体配凑一半 $(y_1+y_2) \\pm \\frac{1}{2}(y_1-y_2)$”或“将其中一根用韦达主元单侧表示”破解非对称结构。",
          importance: "hard",
        },
      ],
    };
  }

  if (mode === "hiddenCircle") {
    const res = calcHiddenCircle(
      circleType,
      params.halfSpan ?? 2.0,
      circleType === "fixedAngle"
        ? (params.thetaDeg ?? 60)
        : (params.sqSumK ?? 16),
      params.angleDeg ?? 55,
    );
    const titleSuffix =
      circleType === "diameter"
        ? "直径圆 (数量积为零)"
        : circleType === "fixedAngle"
          ? "定弦定角圆"
          : "距离平方和定圆";

    return {
      examAnchor: `选择性必修一解析几何 · 隐圆模型（${titleSuffix}）`,
      mnemonic: "数量积零直径圆，定弦定角正弦定，平方和定用中线！",
      quantities: [
        {
          label: "隐圆圆心坐标",
          symbol: "O_{\\text{圆}}",
          value: `(${formatMathNumber(res.center.x, 2)}, ${formatMathNumber(res.center.y, 2)})`,
          color: MATH_COLORS.circle,
        },
        {
          label: "隐圆半径",
          symbol: "R",
          value: formatMathNumber(res.radius, 3),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label:
            circleType === "diameter"
              ? "向量数量积 PA·PB"
              : circleType === "fixedAngle"
                ? "当前圆周张角"
                : "当前平方和 PA²+PB²",
          symbol:
            circleType === "diameter"
              ? "\\overrightarrow{PA}\\cdot\\overrightarrow{PB}"
              : circleType === "fixedAngle"
                ? "\\angle APB"
                : "PA^2+PB^2",
          value: formatMathNumber(res.measureValue, 3),
          unit: circleType === "fixedAngle" ? "°" : undefined,
          isInvariant: true,
          invariantNote:
            "在隐圆周（或对应同侧圆弧）上拖动动点 $P$，该几何特征量严格保持不变。",
          color: MATH_COLORS.inequality,
        },
      ],
      theorems: [
        {
          name:
            circleType === "diameter"
              ? "向量垂直直径圆定理"
              : circleType === "fixedAngle"
                ? "定弦定角圆轨迹定理"
                : "中线长定圆轨迹定理",
          latex:
            circleType === "diameter"
              ? "\\overrightarrow{PA}\\cdot\\overrightarrow{PB} = 0 \\iff x^2 + y^2 = c^2"
              : circleType === "fixedAngle"
                ? "2R = \\frac{AB}{\\sin\\theta}, \\quad y_{\\text{心}} = c\\cot\\theta"
                : "PA^2+PB^2 = 2PO^2 + 2c^2 = k \\implies PO = \\sqrt{\\frac{k}{2}-c^2}",
          condition:
            circleType === "diameter"
              ? "向量数量积 $\\overrightarrow{PA}\\cdot\\overrightarrow{PB}=0$ 严格包含端点 $A, B$（因零向量与任一向量数量积为 $0$）；若题设为几何垂直 $PA\\perp PB$ 或 $\\angle APB = 90^\\circ$，才须挖去 $A, B$（即 $y \\ne 0$）。"
              : "适用前提：动点 $P$ 位于弦 $AB$（$A(-c,0), B(c,0)$）的对应同侧合法圆弧上。",
          note: "识别出隐圆圆心与半径后，即可把“点到直线距离最值”“斜率范围”瞬间转化为圆心距加减半径。",
          level: "core",
        },
      ],
      warnings: [
        {
          text: "高频挖点辨析：$\\overrightarrow{PA}\\cdot\\overrightarrow{PB}=0$ 对应完整圆周（含 $A, B$ 端点）；唯有 $\\angle APB = 90^\\circ$ 或 $PA \\perp PB$ 时才需扣除端点（$y \\ne 0$）；定张角 $\\theta$ 须严格区分弦同侧对应圆弧与异侧补角弧（$180^\\circ - \\theta$）。",
          level: "warning",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 识别隐含几何不变量",
          detail:
            "从向量垂直、恒定视角或距离平方和结构翻译出动点几何轨迹方程。",
          latex: `\\text{定点 } A(${formatMathNumber(res.ptA.x, 2)}, 0),\\; B(${formatMathNumber(res.ptB.x, 2)}, 0)`,
        },
        {
          step: 2,
          title: "建模联立 · 计算隐圆圆心与半径",
          detail: "化简轨迹为标准圆 $(x-x_0)^2 + (y-y_0)^2 = R^2$。",
          latex: `O(${formatMathNumber(res.center.x, 2)}, ${formatMathNumber(res.center.y, 2)}), \\quad R = ${formatMathNumber(res.radius, 3)}`,
        },
        {
          step: 3,
          title: "求解反思 · 验证轨迹上不变量成立",
          detail: "在隐圆周拖动动点测算特征量，确认轨迹不变量恒定。",
          latex: `\\text{特征测度} = ${formatMathNumber(res.measureValue, 3)}`,
        },
      ],
      gaokaoPoints: [
        {
          text: "新高考第四大隐圆为“阿波罗尼斯圆”（$PA/PB = \\lambda \\ne 1$），可与本页三大模型构成完整的平面隐圆工具箱。",
          importance: "gaokao",
        },
      ],
    };
  }

  // symmetryShortest 模式
  const res = calcSymmetryShortest(
    params.lineK ?? 0.2,
    params.lineB ?? -0.6,
    params.probePx ?? 0.5,
  );
  return {
    examAnchor: "选择性必修一解析几何 · 点线对称与将军饮马最值",
    mnemonic: res.isSameSide
      ? "同侧两段折线和，作一镜像化异侧，两点直连取最小！"
      : "两点分居轴两侧，无须镜像直接连，直连交点取最小！",
    quantities: [
      {
        label: res.isSameSide ? "镜像对称点 A'" : "两点位置判定",
        symbol: res.isSameSide ? "A'" : "\\text{异侧}",
        value: res.isSameSide
          ? `(${formatMathNumber(res.ptAPrime.x, 2)}, ${formatMathNumber(res.ptAPrime.y, 2)})`
          : "分居直线两侧",
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "最优落点 P*",
        symbol: "P^*",
        value: `(${formatMathNumber(res.ptOptP.x, 2)}, ${formatMathNumber(res.ptOptP.y, 2)})`,
        color: MATH_COLORS.inequality,
      },
      {
        label: "当前折线长 PA+PB",
        symbol: "L_{\\text{当前}}",
        value: formatMathNumber(res.currentSum, 3),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: res.isSameSide ? "最短路径下界 |A'B|" : "异侧直连下界 |AB|",
        symbol: "L_{\\min}",
        value: formatMathNumber(res.minSum, 3),
        highlight: "positive",
        color: MATH_COLORS.inequality,
      },
    ],
    theorems: [
      {
        name: "点关于一般直线的对称点求解双条件",
        latex:
          "\\begin{cases} \\frac{y' - y_0}{x' - x_0} \\cdot k = -1 \\\\ k \\cdot \\frac{x' + x_0}{2} - \\frac{y' + y_0}{2} + b = 0 \\end{cases}",
        condition:
          "适用前提：$A, B$ 同侧时作对称化异侧（$AA'$ 被轴垂直平分）；$A, B$ 异侧时直连线段 $AB$ 与轴的交点即最优解。",
        note: res.isSameSide
          ? "求得对称点 $A'$ 后，对任意轴上动点 $P$ 恒有 $|PA| = |PA'|$，故 $|PA|+|PB| = |PA'|+|PB| \\ge |A'B|$。"
          : "当前 $A, B$ 已分居直线两侧，直接应用三角形两边之和大于第三边得 $|PA|+|PB| \\ge |AB|$，等号在 $P$ 落于线段 $AB$ 与直线交点时取到。",
        level: "core",
      },
    ],
    warnings: [
      res.isSameSide
        ? {
            text: "变式辨析：若所求为 $|PA| - |PB|$ 的最大值，则不必作对称，只需确保 $A, B$ 位于同侧直接利用三角形两边差 $|PA|-|PB| \\le |AB|$（若异侧则先镜像转化为同侧）！",
            level: "warning",
          }
        : {
            text: "异侧构型提醒：当前直线恰好分隔了定点 $A$ 与 $B$，此时无需镜像翻折，线段 $AB$ 直接与对称轴相交，最小值 $|AB|$ 严格小于任何同侧镜像折算长度！",
            level: "info",
          },
    ],
    reasoningSteps: res.isSameSide
      ? [
          {
            step: 1,
            title: "审题定法 · 判别同侧并求镜像点 A'",
            detail:
              "先验证 $A, B$ 位于直线同侧，再利用垂直平分条件算出点 $A$ 的对称点 $A'$。",
            latex: `A' = (${formatMathNumber(res.ptAPrime.x, 2)}, ${formatMathNumber(res.ptAPrime.y, 2)})`,
          },
          {
            step: 2,
            title: "建模联立 · 折线化直并求交点 P*",
            detail: "连结 $A'B$ 交对称轴于唯一最优动点 $P^*$。",
            latex: `P^* = (${formatMathNumber(res.ptOptP.x, 2)}, ${formatMathNumber(res.ptOptP.y, 2)})`,
          },
          {
            step: 3,
            title: "求解反思 · 验证三角形两边之和不等式",
            detail: "拖动动点 $P$ 对比实时折线总长与直连下界 $|A'B|$。",
            latex: `|PA|+|PB| = ${formatMathNumber(res.currentSum, 3)} \\ge |A'B| = ${formatMathNumber(res.minSum, 3)}`,
          },
        ]
      : [
          {
            step: 1,
            title: "审题定法 · 判别两点已分居直线异侧",
            detail:
              "代入直线表达式检验符号异号，确认 $A, B$ 分处直线两侧，可直接由两点间线段最短求下界。",
            latex: `\\text{直线 } y = ${formatMathNumber(res.lineK, 2)}x ${res.lineB >= 0 ? "+" : "-"} ${formatMathNumber(Math.abs(res.lineB), 2)} \\text{ 分隔 } A, B`,
          },
          {
            step: 2,
            title: "建模联立 · 求直连线段 AB 与轴的交点 P*",
            detail: "联立直线 $AB$ 方程与轴方程求得交点坐标 $P^*$。",
            latex: `P^* = (${formatMathNumber(res.ptOptP.x, 2)}, ${formatMathNumber(res.ptOptP.y, 2)})`,
          },
          {
            step: 3,
            title: "求解反思 · 验证三角形两边之和大于第三边",
            detail: "拖动动点 $P$ 验证折线长恒满足 $|PA|+|PB| \\ge |AB|$。",
            latex: `|PA|+|PB| = ${formatMathNumber(res.currentSum, 3)} \\ge |AB| = ${formatMathNumber(res.minSum, 3)}`,
          },
        ],
    gaokaoPoints: [
      {
        text: "斜率 $k = \\pm 1$ 时的速算口诀：遇 $y = x + c$ 对称，直接把横纵坐标互相反代即 $x' = y - c,\\; y' = x + c$。",
        importance: "gaokao",
      },
    ],
  };
}
