import type {
  MathPanelData,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import {
  calculateLineConicParam,
  calculateEllipseParam,
} from "@/math/conicParam";

export function buildConicParamPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) || "lineParam";
  const a = params.a ?? 4;
  const b = params.b ?? 3;
  const x0 = params.x0 ?? 1;
  const y0 = params.y0 ?? 0.5;
  const alpha = params.alpha ?? 45;
  const theta = params.theta ?? 45;
  const t = params.t ?? 2;

  const lineRes = calculateLineConicParam(x0, y0, alpha, t, a, b);
  const ellipseRes = calculateEllipseParam(a, b, theta);

  if (studyMode === "ellipseParam") {
    const quantities = [
      {
        label: "椭圆半轴 a, b",
        value: `a=${a}, b=${b}`,
        color: "#059669",
      },
      {
        label: "参数角 θ",
        value: `${theta}°`,
        color: "#EF4444",
      },
      {
        label: "椭圆点 P(x, y)",
        value: `(${ellipseRes.P.x.toFixed(2)}, ${ellipseRes.P.y.toFixed(2)})`,
        color: "#EF4444",
      },
      {
        label: "离心圆对应点 P_aux",
        value: `(${ellipseRes.Paux.x.toFixed(2)}, ${ellipseRes.Paux.y.toFixed(2)})`,
        color: "#D97706",
      },
      {
        label: "切线截距三角形面积 S",
        value: isFinite(ellipseRes.triangleArea)
          ? ellipseRes.triangleArea.toFixed(2)
          : "∞",
        color: "#2563EB",
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "椭圆参数方程",
        latex:
          "\\begin{cases} x = a\\cos\\theta \\\\ y = b\\sin\\theta \\end{cases} \\quad (\\theta \\in [0, 2\\pi))",
        condition:
          "适用于椭圆上动点的坐标设点，可消除开方根号，化解析几何最值为三角函数最值问题。",
      },
      {
        name: "椭圆切线参数方程",
        latex: "\\frac{x\\cos\\theta}{a} + \\frac{y\\sin\\theta}{b} = 1",
        condition:
          "利用参数设点化简导数与切线，截距面积 S = \\frac{ab}{|\\sin 2\\theta|} \\ge ab。",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "三角代换求最值：对于椭圆上动点与定点距离/线性目标函数 ax+by，代入 x=a cosθ, y=b sinθ 转化为 A cosθ + B sinθ 形式求解。",
        importance: "gaokao",
      },
      {
        text: "辅助离心圆几何含义：椭圆是外接离心圆 x²+y²=a² 在 y 轴方向按比例 b/a 压缩得到的图形，参数角 θ 为离心圆半径与 x 轴正向夹角。",
        importance: "core",
      },
    ];

    const warnings: WarningItem[] = [];
    if (a <= b) {
      warnings.push({
        text: "退化警示：长半轴 a 应大于短半轴 b，当前 a <= b。",
        level: "warning",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic:
        "椭圆参数三角代，消去根号最值快；离心辅助圆压缩，几何意义记心怀。",
    };
  }

  // lineParam or tSimplify
  const quantities = [
    {
      label: "定点 P0 坐标",
      value: `(${x0}, ${y0})`,
      color: "#059669",
    },
    {
      label: "倾斜角 α",
      value: `${alpha}°`,
      color: "#EF4444",
    },
    {
      label: "交点参数 t1, t2",
      value: lineRes.valid
        ? `t1=${lineRes.t1.toFixed(2)}, t2=${lineRes.t2.toFixed(2)}`
        : "无实根 (Δ<0)",
      color: "#D97706",
    },
    {
      label: "弦长 |AB| = |t1 - t2|",
      value: lineRes.valid ? lineRes.chordLength.toFixed(2) : "0",
      color: "#2563EB",
    },
    {
      label: "线段积 |PA| · |PB| = |t1 t2|",
      value: lineRes.valid ? lineRes.productPA_PB.toFixed(2) : "0",
      color: "#9333EA",
    },
    {
      label: "中点 M 对应参数 tM",
      value: lineRes.valid ? lineRes.tM.toFixed(2) : "0",
      color: "#059669",
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "标准直线参数方程与 t 的几何意义",
      latex:
        "\\begin{cases} x = x_0 + t\\cos\\alpha \\\\ y = y_0 + t\\sin\\alpha \\end{cases} \\implies \\vec{P_0P} = t\\vec{e}",
      condition:
        "前提：方向向量必须为单位向量 (cosα, sinα)，此时 |t| 表示点 P 到定点 P0 的实际几何距离。",
    },
    {
      name: "参数代换韦达定理",
      latex:
        "At^2 + Bt + C = 0 \\implies t_1 + t_2 = -\\frac{B}{A}, \\quad t_1 t_2 = \\frac{C}{A}",
      condition:
        "将直线参数方程代入圆锥曲线后得到关于 t 的一元二次方程，用根与系数关系直接求解线段积与弦长。",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "高考设点化简：已知定点 P0 引割线求 |PA|·|PB|、1/|PA|+1/|PB| 等与距离倒数/乘积相关的解析几何大题，优先用直线参数方程，直接利用 |t1 t2| 和 (t1+t2)/(t1 t2) 避免复杂的 1+k² 根号开方与双变量解方程。",
      importance: "gaokao",
    },
    {
      text: "单位方向向量铁律：在使用 |t| = |P0P| 时，直线的参数方程形式必须满足 (cosα, sinα) 前系数为 1。若写成 x=x0+m t', y=y0+n t'，则实际距离 |P0P| = √(m²+n²) |t'|。",
      importance: "core",
    },
  ];

  const warnings: WarningItem[] = [];
  if (!lineRes.valid) {
    warnings.push({
      text: "无交点警示：当前直线与椭圆判别式 Δ < 0，无相交弦。",
      level: "danger",
    });
  }
  if (alpha % 180 === 90) {
    warnings.push({
      text: "垂直直线警示：倾斜角 α = 90°，直线斜率 k 不存在，但参数方程 x = x0, y = y0 + t 仍完全有效！这是参数方程对比斜率截距式 y=kx+b 的极大优势。",
      level: "info",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "直线参数表有向，单位向量 t 为距离；代入曲线得二次，韦达定理求弦长。",
  };
}
