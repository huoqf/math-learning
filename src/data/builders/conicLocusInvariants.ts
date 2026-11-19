import type {
  MathPanelData,
  Theorem,
  GaokaoPoint,
  ReasoningStep,
} from "../types";
import {
  calcLocusTransfer,
  calcThirdDefinition,
  calcFixedPointModel,
  type LocusStudyMode,
  type ThirdDefCurveType,
} from "@/math/conicLocusInvariants";
import { getConicLocusAnswerSteps } from "@/data/registries/conicLocusInvariants";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";

export function buildConicLocusInvariantsPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as LocusStudyMode) ?? "locusTransfer";
  const curveType = (config?.curveType as ThirdDefCurveType) ?? "ellipse";

  const a = params.a ?? 3.5;
  const b = params.b ?? 2.0;
  const thetaDeg = params.thetaDeg ?? 50;
  const slopeInvM = params.slopeInvM ?? 0.45;

  const answerSteps = getConicLocusAnswerSteps(studyMode);
  const stepTitle = (idx: number) => answerSteps[idx - 1]?.title ?? "";

  if (studyMode === "locusTransfer") {
    const res = calcLocusTransfer(a, b, thetaDeg);
    const aStr = formatMathNumber(res.a);
    const bStr = formatMathNumber(res.b);
    const ratioStr = formatMathNumber(res.ratio);

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: stepTitle(1),
        detail: `设所求椭圆轨迹上动点 $P(x, y)$，对应基准圆 $x_0^2 + y_0^2 = ${aStr}^2$ 上相关点 $P_0(x_0, y_0)$。由纵向压缩变换得：`,
        latex: `\\begin{cases} x = x_0 \\\\ y = \\frac{b}{a} y_0 = ${ratioStr} y_0 \\end{cases}`,
        rubric: "【高考采分点】正确设出目标点与相关点并建立坐标映射（3分）",
      },
      {
        step: 2,
        title: stepTitle(2),
        detail: `将相关点坐标 $(x_0, y_0)$ 用目标坐标 $(x, y)$ 反向表示出来（即所谓“代入法反解”）：`,
        latex: `\\begin{cases} x_0 = x \\\\ y_0 = \\frac{a}{b} y = \\frac{${aStr}}{${bStr}} y \\end{cases}`,
        rubric: "【高考采分点】完成坐标反解准备代回已知轨迹（2分）",
      },
      {
        step: 3,
        title: stepTitle(3),
        detail: `把反解式代入圆方程 $x_0^2 + y_0^2 = a^2$，两边同除 $a^2$ 即得标准椭圆方程（当前代回残差为 $${formatMathNumber(Math.abs(res.ellipseResidual))}$）：`,
        latex: `x^2 + \\left(\\frac{a}{b}y\\right)^2 = a^2 \\implies \\frac{x^2}{${aStr}^2} + \\frac{y^2}{${bStr}^2} = 1`,
        rubric: "【高考采分点】代入已知方程并化简得最终轨迹标准式（3分）",
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "相关点转移法（代入法）通法",
        latex:
          "\\begin{cases} x_0 = g(x, y) \\\\ y_0 = h(x, y) \\end{cases} \\xrightarrow{\\text{代入 } F(x_0, y_0)=0} F\\bigl(g(x,y), h(x,y)\\bigr) = 0",
        note: "当动点随另一已知曲线上的动点按给定几何变换（压缩、中点、对称、比例）运动时，优先选用相关点转移法。",
        prerequisites: ["目标点与原动点坐标可逆一一对应"],
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "人教A版选必一第 3.1.1 节例 2 原型：圆沿垂直于直径方向均匀压缩即生成椭圆；解答题求中点轨迹或伸缩轨迹必考此法。",
        importance: "gaokao",
      },
      {
        text: "易错防坑：若题目给出轨迹满足特定几何约束（如不能在 $x$ 轴上），结尾必须抠去边界点 $y \\neq 0$！",
        importance: "core",
      },
    ];

    return {
      quantities: [
        {
          label: "圆上原动点 $P_0$",
          symbol: "P_0(x_0, y_0)",
          value: `(${formatMathNumber(res.P0.x)}, ${formatMathNumber(res.P0.y)})`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "转移目标点 $P$",
          symbol: "P(x, y)",
          value: `(${formatMathNumber(res.P.x)}, ${formatMathNumber(res.P.y)})`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "纵向压缩比 $b/a$",
          symbol: "\\frac{y}{y_0} = \\frac{b}{a}",
          value: ratioStr,
          color: MATH_COLORS.paramSecondary,
          isInvariant: true,
        },
      ],
      theorems,
      gaokaoPoints,
      warnings: [],
      reasoningSteps,
      examAnchor: "教材母题与新高考轨迹第(1)问 · 相关点转移法",
      mnemonic: "设求逆代原曲线，抠点验证不丢分",
    };
  }

  if (studyMode === "thirdDefinition") {
    const res = calcThirdDefinition(curveType, a, b, thetaDeg);
    const isEllipse = curveType === "ellipse";
    const aStr = formatMathNumber(res.a);
    const bStr = formatMathNumber(res.b);
    const theoStr = formatMathNumber(res.theoreticalProduct);
    const measStr =
      res.measuredProduct !== null
        ? formatMathNumber(res.measuredProduct)
        : "斜率不存在";

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: stepTitle(1),
        detail: `设${isEllipse ? "椭圆" : "双曲线"}顶点 $A(-${aStr}, 0), B(${aStr}, 0)$，动点 $P(x_0, y_0)$ 位于曲线上且 $x_0 \\neq \\pm ${aStr}$：`,
        latex: isEllipse
          ? `\\frac{x_0^2}{${aStr}^2} + \\frac{y_0^2}{${bStr}^2} = 1 \\implies y_0^2 = ${bStr}^2\\left(1 - \\frac{x_0^2}{${aStr}^2}\\right)`
          : `\\frac{x_0^2}{${aStr}^2} - \\frac{y_0^2}{${bStr}^2} = 1 \\implies y_0^2 = ${bStr}^2\\left(\\frac{x_0^2}{${aStr}^2} - 1\\right)`,
        rubric:
          "【高考采分点】利用曲线方程建立动点纵坐标平方与横坐标关系（3分）",
      },
      {
        step: 2,
        title: stepTitle(2),
        detail: `直接写出直线 $PA$ 与 $PB$ 斜率之积并利用平方差公式整理：`,
        latex: `k_{PA} \\cdot k_{PB} = \\frac{y_0}{x_0 + a} \\cdot \\frac{y_0}{x_0 - a} = \\frac{y_0^2}{x_0^2 - a^2}`,
        rubric: "【高考采分点】写出斜率积表达式并完成分母通分合并（2分）",
      },
      {
        step: 3,
        title: stepTitle(3),
        detail: `代入 $y_0^2$ 消去 $x_0, y_0$，可得斜率积与动点位置完全无关，恒为只与离心率相关的定值（当前实测值 $${measStr}$）：`,
        latex: isEllipse
          ? `k_{PA} \\cdot k_{PB} = -\\frac{b^2}{a^2} = e^2 - 1 = ${theoStr}`
          : `k_{PA} \\cdot k_{PB} = \\frac{b^2}{a^2} = e^2 - 1 = ${theoStr}`,
        rubric: "【高考采分点】消去参量证得定值并建立与离心率的直接关联（3分）",
      },
    ];

    return {
      quantities: [
        {
          label: "斜率 $k_{PA}$",
          symbol: "k_{PA}",
          value: res.kPA !== null ? formatMathNumber(res.kPA) : "不存在",
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "斜率 $k_{PB}$",
          symbol: "k_{PB}",
          value: res.kPB !== null ? formatMathNumber(res.kPB) : "不存在",
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "斜率乘积不变量",
          symbol: "k_{PA} \\cdot k_{PB}",
          value: `${measStr} (定值 ${theoStr})`,
          color: MATH_COLORS.paramTertiary,
          isInvariant: true,
        },
        {
          label: "对应离心率平方关系",
          symbol: "e^2 - 1",
          value: formatMathNumber(res.e * res.e - 1),
          color: MATH_COLORS.primary,
          isInvariant: true,
        },
      ],
      theorems: [
        {
          name: isEllipse
            ? "椭圆第三定义（中心对称弦定值）"
            : "双曲线第三定义（中心对称弦定值）",
          latex: isEllipse
            ? "k_{PA} \\cdot k_{PB} = -\\frac{b^2}{a^2} = e^2 - 1"
            : "k_{PA} \\cdot k_{PB} = \\frac{b^2}{a^2} = e^2 - 1",
          note: "不仅适用于长/实轴顶点，对任意过中心 $O$ 的弦两端点 $A, B$ 均成立；是新高考小题求离心率与大题设点的利器。",
          prerequisites: ["点 $A, B$ 关于原点对称且 $P$ 不与 $A, B$ 重合"],
        },
      ],
      gaokaoPoints: [
        {
          text: "新高考第(1)问轨迹高频考法：若动点 $P$ 到两定点 $A(-a,0), B(a,0)$ 斜率之积为定值 $\\lambda$（$\\lambda < 0$ 且 $\\lambda \\neq -1$ 为椭圆，$\\lambda > 0$ 为双曲线），可快速定位轨迹并挖去 $x = \\pm a$。",
          importance: "gaokao",
        },
      ],
      warnings: [],
      reasoningSteps,
      examAnchor: "新高考小题与第(1)问必考 · 第三定义斜率积与离心率",
      mnemonic: "中心对称两顶点，斜率乘积 e 方减 1",
    };
  }

  // 模式 3：标内普通联立过定点与垂直定值
  const res = calcFixedPointModel(a, b, slopeInvM);
  const aStr = formatMathNumber(res.a);
  const bStr = formatMathNumber(res.b);
  const qxStr = formatMathNumber(res.Q.x);
  const mStr = formatMathNumber(slopeInvM);

  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: stepTitle(1),
      detail: `由椭圆上下对称性（先猜后证）：取垂直于 $x$ 轴的特殊对称弦确定猜测定点位于 $x$ 轴上，设非水平动割线方程为 $x = my + n$：`,
      latex: `x = ${mStr} y + n \\quad (\\text{含 } k \\text{ 不存在情形})`,
      rubric: "【高考采分点】合理设置反斜截式直线覆盖铅垂情况并先猜定点（3分）",
    },
    {
      step: 2,
      title: stepTitle(2),
      detail: `普通联立 $x = my + n$ 与椭圆方程 $\\frac{x^2}{${aStr}^2} + \\frac{y^2}{${bStr}^2} = 1$ 消去 $x$，列出韦达定理得两根和与积：`,
      latex: `(b^2 m^2 + a^2) y^2 + 2b^2 m n y + b^2(n^2 - a^2) = 0`,
      rubric: "【高考采分点】标准联立消元并准确写出韦达定理表达式（3分）",
    },
    {
      step: 3,
      title: stepTitle(3),
      detail: `将直角条件 $\\overrightarrow{A_0 A}\\cdot\\overrightarrow{A_0 B}=0$ 转化为 $(x_1+a)(x_2+a)+y_1y_2=0$，代入 $x_i = my_i + n$ 与韦达式解得 $n$（当前定点 $Q(${qxStr}, 0)$）：`,
      latex: `(a^2+b^2)n^2 + 2a b^2 n + a^2(b^2 - a^2) = 0 \\implies n = \\frac{a(b^2-a^2)}{a^2+b^2} = ${qxStr}`,
      rubric: "【高考采分点】化简求解定点坐标并排除过顶点 $n=-a$ 增根（4分）",
    },
  ];

  return {
    quantities: [
      {
        label: "左顶点 $A_0$",
        symbol: "A_0(-a, 0)",
        value: `(-${aStr}, 0)`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "恒过定点 $Q$",
        symbol: "Q\\left(\\frac{a(b^2-a^2)}{a^2+b^2}, 0\\right)",
        value: `(${qxStr}, 0)`,
        color: MATH_COLORS.paramSecondary,
        isInvariant: true,
      },
      {
        label: "单支斜率 $k_{A_0A}, k_{A_0B}$",
        symbol: "k_1, k_2",
        value:
          res.kA0A !== null && res.kA0B !== null
            ? `${formatMathNumber(res.kA0A)},\\; ${formatMathNumber(res.kA0B)}`
            : "斜率不存在",
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "实测垂直斜率积",
        symbol: "k_{A_0A} \\cdot k_{A_0B}",
        value:
          res.slopeProduct !== null
            ? `${formatMathNumber(res.slopeProduct)} (恒为 -1)`
            : "退化",
        color: MATH_COLORS.paramTertiary,
        isInvariant: true,
      },
    ],
    theorems: [
      {
        name: "标内普通联立“先猜后证”定点通法",
        latex:
          "\\overrightarrow{A_0A} \\cdot \\overrightarrow{A_0B} = 0 \\implies (m^2+1)y_1y_2 + m(n+a)(y_1+y_2) + (n+a)^2 = 0",
        note: "相比拓展技巧，新高考标准阅卷采分点明确要求展示设线、常规韦达代换与排除增根（$n=-a$）的完整逻辑链。",
        prerequisites: [
          "设直线 $x = my + n$ 时验证 $\\Delta > 0$ 且舍去过左顶点情形",
        ],
      },
    ],
    gaokaoPoints: [
      {
        text: "新高考第 18 题压轴第一原则：遇到直角或斜率积定值证明恒过定点，若无齐次化思路，反设 $x = my + n$ 套用常规韦达定理解法最稳妥且满分采分点清晰。",
        importance: "gaokao",
      },
    ],
    warnings: [],
    reasoningSteps,
    examAnchor: "新高考第 18 题标准满分通法 · 反设直线与常规韦达定点证明",
    mnemonic: "先猜对称定轴线，反设消元排增根",
  };
}
