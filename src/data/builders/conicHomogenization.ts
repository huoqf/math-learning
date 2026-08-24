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
      ...(studyMode === "asymmetric"
        ? [
            {
              label: "加权斜率和实测值",
              value:
                result.asymmetricWeightedSum !== null
                  ? `${lambda}k₁ + ${mu}k₂ = ${result.asymmetricWeightedSum.toFixed(4)}`
                  : "无实割点",
              symbol: `\\lambda k_1 + \\mu k_2`,
            },
          ]
        : []),
    ],

    theorems: [
      {
        name: "对称平移齐次化核心原理 (高中通法变体)",
        latex:
          "\\begin{cases} X = x - x_0, \\ Y = y - y_0 \\\\ mX + nY = 1 \\\\ A' X^2 + B' XY + C' Y^2 = 0 \\end{cases} \\implies C' k^2 + B' k + A' = 0",
        note: "以定点 P(x₀,y₀) 为基准建立平移坐标系，用割线方程 1 = mX + nY 对曲线的一次项与常数项齐次升次，两边同除以 X² 转化为关于斜率 k 的一元二次方程。",
        prerequisites: [
          "割线 l 与圆锥曲线有两个不同交点 A, B (判别式 Δ > 0)",
          "定点 P 不在割线 l 上 (即 m·0 + n·0 ≠ 1)",
          "割线非铅垂线且 C' ≠ 0 (确保斜率 k 存在且方程为二次)",
        ],
      },
      {
        name: "韦达定理斜率和与斜率积公式",
        latex: "k_1 + k_2 = -\\frac{B'}{C'}, \\quad k_1 k_2 = \\frac{A'}{C'}",
        note: "直接将交点坐标的非线性联立转化为关于割线斜率的对称代数式，跳过传统的两点坐标通分。",
      },
      {
        name: "非对称斜率关系的高考代数本质",
        latex:
          "\\begin{cases} k_1 + \\lambda k_2 = 0 \\\\ k_1 + k_2 = S \\\\ k_1 k_2 = P \\end{cases} \\implies S^2 + \\frac{(1-\\lambda)^2}{\\lambda} P = 0",
        note: "非对称条件与韦达对称式联立消元后，参数 m, n 满足非线性二次型方程，几何上对应双定点直线系或包络相切，解答题中严禁跳步直接写公式结论。",
      },
    ],

    gaokaoPoints: [
      {
        text: "新高考答题规范：解答题中严禁直接写'由齐次化公式可得'。必须完整写出坐标平移 X=x-x₀, Y=y-y₀、联立升次方程、同除 X² 及韦达定理全过程方可得满分。",
        importance: "gaokao",
      },
      {
        text: "必查扣分雷区 1（分类讨论）：必须单独讨论割线斜率不存在（铅垂线）或 C'=0 的退化情况，否则扣 2~4 分。",
        importance: "gaokao",
      },
      {
        text: "必查扣分雷区 2（判别式 Δ > 0）：必须写出联立方程判别式 Δ > 0 保证交点存在，此为新高考必设采分点。",
        importance: "hard",
      },
      {
        text: "非对称斜率消元避坑：非对称关系消元平方时需注意等价性检验，防止引入伪解与增解。",
        importance: "hard",
      },
    ],

    warnings: [
      ...(!result.isValidIntersections
        ? [
            {
              text: "相交判别式警示: 当前割线与圆锥曲线判别式 Δ ≤ 0，割线与曲线无交点或相切，齐次化割线斜率不存在！",
              level: "warning" as const,
            },
          ]
        : []),
      ...(Math.abs(result.homoC) < 1e-4
        ? [
            {
              text: "二次项退化警示: 齐次二次方程二次项系数 C' ≈ 0，方程退化为一元一次方程，必有直线与 y 轴平行！",
              level: "danger" as const,
            },
          ]
        : []),
      ...(studyMode === "asymmetric" && Math.abs(lambda - mu) > 1e-3
        ? [
            {
              text: "非对称消元注意: λ ≠ μ 时斜率关系不对称，消参后为 (m,n) 的二次型方程，切忌机械套用单一定点公式！",
              level: "info" as const,
            },
          ]
        : []),
    ],

    mnemonic:
      "平移定点立新系，割线化一升二次；除以X方出斜率，韦达消参步步晰；判别分类莫遗漏，满分答卷严逻辑！",
  };
}
