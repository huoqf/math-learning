import type { MathPanelData } from "../types";
import { computeConicHomogenization } from "@/math/conicHomogenization";

export function buildConicHomogenizationPanel(
  params: Record<string, number>,
  config?: Record<string, any>,
): MathPanelData {
  const curveType = config?.curveType ?? "ellipse";
  const studyMode = config?.studyMode ?? "shift";

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
        label: "曲线半轴 a, b",
        value: `a=${a.toFixed(1)}, b=${b.toFixed(1)}`,
        symbol: `\\frac{x^2}{${(a * a).toFixed(1)}} ${curveType === "ellipse" ? "+" : "-"} \\frac{y^2}{${(b * b).toFixed(1)}} = 1`,
      },
      {
        label: "齐次化定点 P",
        value: `(${result.P.x.toFixed(2)}, ${result.P.y.toFixed(2)})`,
        symbol: isShift
          ? `P(x_0, y_0) = (${result.P.x.toFixed(2)}, ${result.P.y.toFixed(2)})`
          : `O(0,0)`,
      },
      {
        label: "割线方程 l",
        value: result.lineEqLatex,
        symbol: isShift ? `m(x-x_0) + n(y-y_0) = 1` : `Ax + By = 1`,
      },
      {
        label: "齐次二次方程",
        value: result.homoEqLatex,
        symbol: `${result.homoC.toFixed(2)} k^2 + ${result.homoB.toFixed(2)} k + ${result.homoA.toFixed(2)} = 0`,
      },
      {
        label: "理论斜率和 (k₁ + k₂)",
        value:
          result.theoreticalSum !== null
            ? result.theoreticalSum.toFixed(4)
            : "斜率不存在/退化",
        symbol: `k_1 + k_2 = -\\frac{B'}{C'}`,
      },
      {
        label: "理论斜率积 (k₁ · k₂)",
        value:
          result.theoreticalProduct !== null
            ? result.theoreticalProduct.toFixed(4)
            : "斜率不存在/退化",
        symbol: `k_1 k_2 = \\frac{A'}{C'}`,
      },
      {
        label: "实测交点 A, B 斜率",
        value:
          result.measuredK1 !== null && result.measuredK2 !== null
            ? `k₁=${result.measuredK1.toFixed(3)}, k₂=${result.measuredK2.toFixed(3)}`
            : "未形成 2 个实割点",
        symbol:
          result.measuredSum !== null
            ? `k_1 + k_2 = ${result.measuredSum.toFixed(4)}, k_1 k_2 = ${result.measuredProduct?.toFixed(4)}`
            : "\\Delta \\le 0",
      },
      ...(studyMode === "asymmetric"
        ? [
            {
              label: "加权斜率和",
              value: `λk₁ + μk₂ = ${result.asymmetricWeightedSum?.toFixed(4) ?? "N/A"}`,
              symbol: `\\lambda k_1 + \\mu k_2`,
            },
            {
              label: "割线必过定点 Q",
              value:
                result.fixedPointQ !== null
                  ? `(${result.fixedPointQ.x.toFixed(2)}, ${result.fixedPointQ.y.toFixed(2)})`
                  : "无定点",
              symbol:
                result.fixedPointQ !== null
                  ? `Q = (${result.fixedPointQ.x.toFixed(2)}, ${result.fixedPointQ.y.toFixed(2)})`
                  : "\\text{无}",
            },
          ]
        : []),
    ],

    theorems: [
      {
        name: "非对称齐次化联立核心定理",
        latex:
          "\\begin{cases} X = x - x_0, \\ Y = y - y_0 \\\\ mX + nY = 1 \\\\ A' X^2 + B' XY + C' Y^2 = 0 \\end{cases} \\implies C' k^2 + B' k + A' = 0",
        note: "平移坐标原点至定点 P(x₀,y₀)，将割线方程变形为 1 的形式代入二次曲线完成齐次化，除以 X² 转化为斜率二次方程。",
        prerequisites: [
          "割线 l 与圆锥曲线交于两点 A, B",
          "定点 P 不在割线 l 上 (即 m·0 + n·0 ≠ 1)",
          "齐次方程二次项系数 C' ≠ 0 (割线非竖直线)",
        ],
      },
      {
        name: "韦达定理求解斜率和与积",
        latex: "k_1 + k_2 = -\\frac{B'}{C'}, \\quad k_1 k_2 = \\frac{A'}{C'}",
        note: "避免解二元二次方程组和繁琐代入，一步得到 k_PA + k_PB 与 k_PA · k_PB。",
      },
    ],

    gaokaoPoints: [
      {
        text: "新高考圆锥曲线压轴：齐次化方法消去联立解韦达定理的繁琐步骤，秒杀斜率和/斜率积定值定点。",
        importance: "gaokao",
      },
      {
        text: "平移齐次化技巧：当定点 P(-a,0) 为椭圆顶点时，坐标平移后可快速求定点或角平分线。",
        importance: "hard",
      },
    ],

    warnings: [
      ...(!result.isValidIntersections
        ? [
            {
              text: "相交判别式 Warning: 当前割线与圆锥曲线判别式 Δ ≤ 0，直线与曲线无交点或相切！",
              level: "warning" as const,
            },
          ]
        : []),
      ...(Math.abs(result.homoC) < 1e-5
        ? [
            {
              text: "二次项系数退化 Warning: 齐次二次方程二次项系数 C' ≈ 0，割线斜率趋近无穷大！",
              level: "danger" as const,
            },
          ]
        : []),
    ],

    mnemonic:
      "平移定点为原点，割线化为一值式；代入二次齐次化，韦达定理斜率出！",
  };
}
