/**
 * src/data/builders/conicHomogenization.ts
 * 齐次化与非对称斜率关系看板数据组装
 */

import type { MathPanelData } from "../types";
import { computeConicHomogenization } from "@/math/conicHomogenization";
import type { CurveType, StudyMode } from "@/math/conicHomogenization";

export function buildConicHomogenizationPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const curveType = ((config?.curveType as string) ?? "ellipse") as CurveType;
  const studyMode = ((config?.studyMode as string) ?? "shift") as StudyMode;

  const a = params.a ?? 2.5;
  const b = params.b ?? 1.5;
  const lineA = params.lineA ?? 0.3;
  const lineB = params.lineB ?? 0.4;
  const px = params.px ?? -2.5;
  const py = params.py ?? 0;
  const lambda = params.lambda ?? 1;
  const mu = params.mu ?? 1;

  const result = computeConicHomogenization({
    curveType,
    studyMode,
    a,
    b,
    P: { x: px, y: py },
    lineA,
    lineB,
    lambda,
    mu,
  });

  const isShift = studyMode !== "origin";
  const isPerpChord =
    studyMode === "shift" &&
    result.fixedPointQ &&
    result.theoreticalProduct !== null &&
    Math.abs(result.theoreticalProduct - -1) < 0.05;

  // 高考标准答题链：换元 → 割线化为 1 → 齐次升次 → 同除 X² 出斜率 → 韦达消元
  const reasoningSteps = [
    {
      step: 1,
      title: isShift
        ? "审题定法 · 平移坐标系并构造割线方程"
        : "审题定法 · 把割线方程化为 1 的形式",
      detail: isShift
        ? `以定点 $P(${result.P.x.toFixed(2)}, ${result.P.y.toFixed(2)})$ 为新原点作平移 $X = x - x_0,\\ Y = y - y_0$，并把割线改写成 $mX + nY = 1$（右端常数 $1$ 是后续升次的桥梁）：`
        : `割线不过原点，可把其方程整理为 $mx + ny = 1$ 的形式（右端常数 $1$ 是后续升次的桥梁）：`,
      latex: isShift
        ? `\\begin{cases} X = x - x_0,\\ Y = y - y_0 \\\\ m X + n Y = 1 \\end{cases} \\quad (${result.lineEqLatex})`
        : `m x + n y = 1 \\quad (${result.lineEqLatex})`,
      rubric: isShift
        ? "建立平移坐标系并写出割线的 $mX+nY=1$ 形式（2分）"
        : "把割线方程化为 $mx+ny=1$（2分）",
    },
    {
      step: 2,
      title: "建模展开 · 用 $1^2$ 升次构造齐次方程",
      detail: `把圆锥曲线方程中的一次项与常数项按 $1^2 = (mX + nY)^2$ 整体替换，使方程各项都成为二次齐次项，整理得关于 $X,\\ Y$ 的二次齐次方程（系数 $A' = ${result.homoA.toFixed(3)},\\ B' = ${result.homoB.toFixed(3)},\\ C' = ${result.homoC.toFixed(3)}$）：`,
      latex: `${result.homoEqLatex} \\\\ \\implies A' X^2 + B' XY + C' Y^2 = 0`,
      rubric: "完成齐次升次并写出二次齐次方程（3分）",
    },
    {
      step: 3,
      title: "求解反思 · 同除 $X^2$ 得斜率方程并用韦达定理",
      detail: `两边同除以 $X^2$（$X \\ne 0$）得关于 $k = \\frac{Y}{X}$ 的一元二次方程 $C' k^2 + B' k + A' = 0$，由韦达定理直接读出两根之和与积；若 $C' = 0$ 或割线铅垂，须单独讨论斜率不存在的情形。代入当前参数：`,
      latex: `k_1 + k_2 = -\\frac{B'}{C'} = ${result.theoreticalSum !== null ? result.theoreticalSum.toFixed(4) : "\\text{斜率不存在}"},\\quad k_1 k_2 = \\frac{A'}{C'} = ${result.theoreticalProduct !== null ? result.theoreticalProduct.toFixed(4) : "\\text{斜率不存在}"}`,
      rubric: "同除 $X^2$ 并写出韦达定理斜率关系（3分）",
    },
    ...(studyMode === "asymmetric"
      ? [
          {
            step: 4,
            title: "求解反思 · 非对称条件的消元闭环",
            detail: `遇到 $\\lambda k_1 + \\mu k_2 = 0$ 这类非对称条件时，严禁直接套用记忆结论，须联立 $k_1 + k_2 = S$、$k_1 k_2 = P$ 解出两根再代入，消元后得割线参数的二次型方程：`,
            latex: `\\begin{cases} \\lambda k_1 + \\mu k_2 = 0 \\\\ k_1 + k_2 = S \\\\ k_1 k_2 = P \\end{cases} \\implies \\lambda \\mu S^2 + (\\lambda - \\mu)^2 P = 0`,
            rubric:
              "按解方程组顺序消元，导出割线参数约束并检验 $\\Delta > 0$（3分）",
          },
        ]
      : []),
  ];

  return {
    quantities: [
      {
        label: "圆锥曲线方程",
        value: `a=${a.toFixed(1)}, b=${b.toFixed(1)}`,
        symbol: `\\frac{x^2}{${(a * a).toFixed(1)}} ${curveType === "ellipse" ? "+" : "-"} \\frac{y^2}{${(b * b).toFixed(1)}} = 1`,
      },
      {
        label: "平移定点 / 割线基准点 P",
        value: `(${result.P.x.toFixed(2)}, ${result.P.y.toFixed(2)})`,
        symbol: isShift
          ? `P(x_0, y_0) = (${result.P.x.toFixed(2)}, ${result.P.y.toFixed(2)})`
          : `O(0,0)`,
      },
      {
        label: "割线方程 l",
        value: result.lineEqLatex,
        symbol: isShift ? `m(x-x_0) + n(y-y_0) = 1` : `mx + ny = 1`,
      },
      {
        label: "齐次化二次方程",
        value: result.homoEqLatex,
        symbol: `C' k^2 + B' k + A' = 0 \\quad (k = \\frac{Y}{X})`,
      },
      {
        label: "理论斜率和 (k₁ + k₂)",
        value:
          result.theoreticalSum !== null
            ? result.theoreticalSum.toFixed(4)
            : "斜率不存在/C'=0",
        symbol: `k_1 + k_2 = -\\frac{B'}{C'} = -\\frac{${result.homoB.toFixed(2)}}{${result.homoC.toFixed(2)}}`,
      },
      {
        label: "理论斜率积 (k₁ · k₂)",
        value:
          result.theoreticalProduct !== null
            ? result.theoreticalProduct.toFixed(4)
            : "斜率不存在/C'=0",
        symbol: `k_1 k_2 = \\frac{A'}{C'} = \\frac{${result.homoA.toFixed(2)}}{${result.homoC.toFixed(2)}}`,
      },
      {
        label: "实测交点 A, B 与斜率校验",
        value:
          result.measuredK1 !== null && result.measuredK2 !== null
            ? `k₁=${result.measuredK1.toFixed(3)}, k₂=${result.measuredK2.toFixed(3)}`
            : "未形成 2 个实割点",
        symbol:
          result.measuredSum !== null
            ? `k_1 + k_2 = ${result.measuredSum.toFixed(4)}, \\; k_1 k_2 = ${result.measuredProduct?.toFixed(4)}`
            : "\\Delta \\le 0",
      },
      ...(isPerpChord && result.fixedPointQ
        ? [
            {
              label: "割线恒过定点 Q 理论坐标",
              value: `Q(${result.fixedPointQ.x.toFixed(3)}, 0)`,
              symbol: `x_Q = \\frac{a(b^2 - a^2)}{a^2 + b^2} = ${result.fixedPointQ.x.toFixed(3)}`,
            },
          ]
        : []),
      ...(studyMode === "asymmetric"
        ? [
            {
              label: "非对称斜率实测与消元",
              value:
                result.asymmetricWeightedSum !== null
                  ? `${lambda} k₁ + ${mu} k₂ = ${result.asymmetricWeightedSum.toFixed(3)}`
                  : "无实割点",
              symbol:
                result.asymmetricEliminationResidual !== null
                  ? `\\lambda \\mu S^2 + (\\lambda - \\mu)^2 P = ${result.asymmetricEliminationResidual.toFixed(3)}`
                  : `\\lambda k_1 + \\mu k_2 = 0`,
            },
          ]
        : []),
    ],

    theorems: [
      ...(studyMode === "origin"
        ? [
            {
              name: "原点齐次化升次通法",
              latex:
                "\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = (mx + ny)^2 \\implies \\left(\\frac{1}{b^2} - n^2\\right)k^2 - 2mn k + \\left(\\frac{1}{a^2} - m^2\\right) = 0",
              note: "将割线方程构造为 $1 = mx + ny$ 代入二次曲线方程，将常数项升次为二次齐次多项式，两边同除以 $x^2$ 转化为关于斜率 $k$ 的一元二次方程。",
              prerequisites: [
                "割线 $l$ 不经过原点 $O$ (即 $m \\cdot 0 + n \\cdot 0 \\neq 1$)",
                "割线与圆锥曲线有两个不同交点 $A, B$ (判别式 $\\Delta > 0$)",
                "割线非铅垂线且 $\\frac{1}{b^2} - n^2 \\neq 0$",
              ],
            },
            {
              name: "原点动弦对称斜率定理",
              latex:
                "k_1 + k_2 = \\frac{2mn}{\\frac{1}{b^2} - n^2}, \\quad k_1 k_2 = \\frac{\\frac{1}{a^2} - m^2}{\\frac{1}{b^2} - n^2}",
              note: "当动割线平行于坐标轴（$m=0$ 或 $n=0$）时，一次项系数必为 0，两动弦斜率互为相反数 ($k_1 + k_2 = 0$)。",
            },
          ]
        : []),

      ...(studyMode === "shift"
        ? [
            {
              name: "顶点/定点平移齐次化核心通法",
              latex:
                "\\begin{cases} X = x - x_0, \\ Y = y - y_0 \\\\ mX + nY = 1 \\\\ A' X^2 + B' XY + C' Y^2 = 0 \\end{cases} \\implies C' k^2 + B' k + A' = 0",
              note: "以定点 $P(x_0, y_0)$ 为新原点建立平移坐标系，用割线方程 $1 = mX + nY$ 对一次项与常数项齐次升次，两边同除以 $X^2$ 导出动弦斜率方程。",
              prerequisites: [
                "割线 $l$ 与圆锥曲线有两个不同交点 $A, B$ (判别式 $\\Delta > 0$)",
                "定点 $P$ 不在割线 $l$ 上 (保证升次代换等价性)",
              ],
            },
            ...(isPerpChord
              ? [
                  {
                    name: "左顶点直角弦恒过定点定理 (新高考压轴母题)",
                    latex:
                      "PA \\perp PB \\iff k_1 k_2 = -1 \\implies m = \\frac{a^2+b^2}{2ab^2} \\implies Q\\left(\\frac{a(b^2-a^2)}{a^2+b^2}, 0\\right)",
                    note: "由 $k_1 k_2 = \\frac{\\frac{1}{a^2} - \\frac{2m}{a}}{\\frac{1}{b^2}} = -1$ 可解得割线参数 $m$ 为仅与曲线相关的定值，代入割线方程即证得动直线 $AB$ 恒过 $x$ 轴定点 $Q$！",
                  },
                ]
              : [
                  {
                    name: "平移韦达定理斜率和积公式",
                    latex:
                      "k_1 + k_2 = -\\frac{B'}{C'}, \\quad k_1 k_2 = \\frac{A'}{C'}",
                    note: "由二次方程根与系数关系直接求得两弦斜率的对称和与积，跳过传统联立两点坐标通分。",
                  },
                ]),
          ]
        : []),

      ...(studyMode === "asymmetric"
        ? [
            {
              name: "平移齐次化与韦达对称式",
              latex:
                "C' k^2 + B' k + A' = 0 \\implies k_1 + k_2 = S = -\\frac{B'}{C'}, \\quad k_1 k_2 = P = \\frac{A'}{C'}",
              note: "齐次化升次方程的两根必是对称的韦达和积，此为代数通法底模。",
            },
            {
              name: "非对称斜率约束的高考消元充要条件",
              latex:
                "\\begin{cases} \\lambda k_1 + \\mu k_2 = 0 \\\\ k_1 + k_2 = S \\\\ k_1 k_2 = P \\end{cases} \\implies \\lambda \\mu S^2 + (\\lambda - \\mu)^2 P = 0",
              note: "将非对称斜率约束作为已知条件，与齐次化韦达对称式联立消去 $k_1, k_2$，导出割线参数 $(m, n)$ 的二次型方程。",
            },
          ]
        : []),
    ],

    gaokaoPoints: [
      ...(studyMode === "origin"
        ? [
            {
              text: "原点齐次化秒杀题型：中心对称曲线中弦对原点张直角（$k_1 k_2 = -1$）或斜率互为相反数（$k_1 + k_2 = 0$），可直接由齐次二次方程常数项或一次项系数为 0 瞬间破题。",
              importance: "gaokao" as const,
            },
            {
              text: "扣分雷区：解答题中必须写出分类讨论（割线斜率不存在或二次项系数为 0 的情况），未讨论直接扣 2~3 分。",
              importance: "gaokao" as const,
            },
          ]
        : []),

      ...(studyMode === "shift"
        ? [
            {
              text: "新高考答题规范：证明直线过定点时，必须完整写出平移坐标换元 $X=x-x_0, Y=y-y_0$、割线代入升次、同除 $X^2$、韦达定理与求定点坐标全过程方可得满分。",
              importance: "gaokao" as const,
            },
            {
              text: "直角弦必设采分点：联立方程判别式 $\\Delta > 0$ 与直角充要条件 $k_1 k_2 = -1$ 必须并列列出，缺一不可。",
              importance: "hard" as const,
            },
          ]
        : []),

      ...(studyMode === "asymmetric"
        ? [
            {
              text: "非对称关系消元规范：非对称关系消参时严禁死记硬背结论，必须按解线性方程组求出 $k_1, k_2$ 代入乘积式的标准步骤书写。",
              importance: "gaokao" as const,
            },
            {
              text: "等价性与增解防坑：非对称关系消去根后需结合判别式 $\\Delta > 0$ 检验割线斜率的存在范围，防止伪解。",
              importance: "hard" as const,
            },
          ]
        : []),
    ],

    warnings: [
      ...(!result.isValidIntersections
        ? [
            {
              text: "相交判别式警示: 当前割线与圆锥曲线判别式 $\\Delta \\le 0$，割线与曲线无交点或相切，齐次化割线斜率不存在！",
              level: "warning" as const,
            },
          ]
        : []),
      ...(Math.abs(result.homoC) < 1e-4
        ? [
            {
              text: "二次项退化警示: 齐次二次方程二次项系数 $C' \\approx 0$，方程退化为一元一次方程，必有直线与 $y$ 轴平行！",
              level: "danger" as const,
            },
          ]
        : []),
      ...(studyMode === "asymmetric" && Math.abs(lambda - mu) > 1e-3
        ? [
            {
              text: "非对称消元注意: $\\lambda \\neq \\mu$ 时斜率关系非对称，需联立韦达式消去斜率导出 $(m,n)$ 二次型方程！",
              level: "info" as const,
            },
          ]
        : []),
    ],

    reasoningSteps,
    examAnchor:
      "拓展专题 · 齐次化联立与斜率消元（新高考压轴提速法）：解答题须完整写出换元 → 割线化为 1 → 齐次升次 → 同除 $X^2$ → 韦达消元全过程方可得满分；【规范答题提示】直接引用斜率结论属跳步，会被扣推导分。",

    mnemonic:
      "平移定点立新系，割线化一升二次；除以X方出斜率，韦达消参步步晰；判别分类莫遗漏，满分答卷严逻辑！",
  };
}
