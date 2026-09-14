import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import {
  calculateLineConicParam,
  calculateEllipseParam,
} from "@/math/conicParam";
import { MATH_COLORS } from "@/theme";

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

  // 模式 2: 椭圆参数方程与三角设点化简
  if (studyMode === "ellipseParam") {
    const quantities = [
      {
        label: "椭圆半轴 a, b",
        symbol: "a, b",
        value: `a=${a}, b=${b}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "离心参数角 θ",
        symbol: "\\theta",
        value: `${theta}°`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "椭圆动点 P 坐标",
        symbol: "P(a\\cos\\theta, b\\sin\\theta)",
        value: `(${ellipseRes.P.x.toFixed(2)}, ${ellipseRes.P.y.toFixed(2)})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "辅助离心圆对应点 P'",
        symbol: "P'(a\\cos\\theta, a\\sin\\theta)",
        value: `(${ellipseRes.Paux.x.toFixed(2)}, ${ellipseRes.Paux.y.toFixed(2)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "切线截距三角形面积 S",
        symbol: "S = \\frac{ab}{|\\sin 2\\theta|}",
        value: isFinite(ellipseRes.triangleArea)
          ? `${ellipseRes.triangleArea.toFixed(2)} (最小值为 ${a * b})`
          : "∞",
        color: MATH_COLORS.accent,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "椭圆标准参数方程",
        latex:
          "\\begin{cases} x = a\\cos\\theta \\\\ y = b\\sin\\theta \\end{cases} \\quad (\\theta \\in [0, 2\\pi))",
        condition:
          "适用于椭圆上动点的坐标设点，可消除二次根号，将解析几何距离/最值化为辅助角三角函数最值问题。",
      },
      {
        name: "椭圆切线参数方程与面积最值",
        latex:
          "\\frac{x\\cos\\theta}{a} + \\frac{y\\sin\\theta}{b} = 1 \\implies S_{\\triangle} = \\frac{ab}{|\\sin 2\\theta|} \\ge ab",
        condition:
          "由参数设点直接写出切线方程，两轴截距三角形面积在离心角为 45°、135°、225°、315° 时取得最小值 ab。",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "【新高考标内通法】三角代换求最值：椭圆上动点 $P(a\\cos\\theta, b\\sin\\theta)$ 属于标内合法换元。求解到定直线距离或面积最值时，代入直接转化为辅助角公式 $A\\cos\\theta + B\\sin\\theta$，避免二次联立的高次方程，2025/2026 模拟卷高频考查。",
        importance: "core",
      },
      {
        text: "辅助离心圆几何含义：椭圆是外接离心圆 $x^2+y^2=a^2$ 在 $y$ 轴方向按比例 $\\frac{b}{a}$ 压缩得到的图形，参数角 $\\theta$ 为对应离心圆半径与 $x$ 轴正向夹角。",
        importance: "hard",
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

  // 模式 1: 直线参数方程与动点 t 几何意义
  if (studyMode === "lineParam") {
    const rad = lineRes.alphaRad;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const quantities: MathQuantity[] = [
      {
        label: "定点 P₀ 坐标",
        symbol: "P_0(x_0, y_0)",
        value: `(${x0.toFixed(1)}, ${y0.toFixed(1)})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "倾斜角与单位方向向量",
        symbol: "\\vec{e} = (\\cos\\alpha, \\sin\\alpha)",
        value: `α = ${alpha}°, e = (${cosA.toFixed(2)}, ${sinA.toFixed(2)})`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "动点 P(t) 坐标",
        symbol: "P(x_0 + t\\cos\\alpha, y_0 + t\\sin\\alpha)",
        value: `(${lineRes.Pt.x.toFixed(2)}, ${lineRes.Pt.y.toFixed(2)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "参数 t 与有向距离",
        symbol: "|P_0P| = |t|",
        value: `t = ${t.toFixed(2)}, 距离 |P_0P| = ${Math.abs(t).toFixed(2)}`,
        color: MATH_COLORS.paramSecondary,
      },
    ];

    if (lineRes.valid) {
      quantities.push(
        {
          label: "交点 A, B 参数 t₁, t₂",
          symbol: "t_1, t_2",
          value: `t1 = ${lineRes.t1.toFixed(2)}, t2 = ${lineRes.t2.toFixed(2)}`,
          color: MATH_COLORS.accent,
        },
        {
          label: "相交弦长 |AB|",
          symbol: "|AB| = |t_1 - t_2|",
          value: lineRes.chordLength.toFixed(2),
          color: MATH_COLORS.accent,
        },
      );
    } else {
      quantities.push({
        label: "相交状态",
        symbol: "\\Delta < 0",
        value: "直线与椭圆无交点",
        color: MATH_COLORS.textMuted,
      });
    }

    const theorems: Theorem[] = [
      {
        name: "标准直线参数方程与 t 的几何意义",
        latex:
          "\\begin{cases} x = x_0 + t\\cos\\alpha \\\\ y = y_0 + t\\sin\\alpha \\end{cases} \\implies \\vec{P_0P} = t\\vec{e}",
        condition:
          "前提：方向向量必须为单位向量 (cosα, sinα)，此时 |t| 严格表示动点 P 到基准定点 P0 的实际几何距离，符号表示方向正负。",
      },
      {
        name: "直线参数方程弦长公式",
        latex: "|AB| = |t_1 - t_2| = \\sqrt{(t_1+t_2)^2 - 4t_1t_2}",
        condition:
          "相比直角坐标系省去 √(1+k²) 系数，且在倾斜角 α=90°（斜率不存在）时完全自洽无奇点。",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "方向向量单位化：使用 |t| 表示实际几何距离的充要前提是参数方程已归一化，即 cos²α + sin²α = 1。非标准形式必须乘系数修正。",
        importance: "extend",
      },
      {
        text: "参数正负号指向性：t > 0 表示点 P 位于 P0 沿单位方向向量正向的一侧，t < 0 表示位于反向，常用于射线与有向定比分点判断。",
        importance: "extend",
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
        text: "垂直直线自洽：倾斜角 α = 90° 时传统斜率 k 不存在，但参数方程 x = x0, y = y0 + t 仍完全有效，避免了分类讨论漏洞。",
        level: "info",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic:
        "直线参数表有向，单位向量 t 为距离；全倾角通用无奇点，弦长差模直接求。",
    };
  }

  // 模式 3: 高考设点化简与根代换 (tSimplify)
  const isInternal = lineRes.valid && lineRes.t1 * lineRes.t2 < 0;
  const isMidpoint = lineRes.valid && Math.abs(lineRes.t1 + lineRes.t2) < 0.05;

  const quantities: MathQuantity[] = [
    {
      label: "二次方程系数 A, B, C",
      symbol: "At^2 + Bt + C = 0",
      value: lineRes.valid
        ? `A=${lineRes.A.toFixed(1)}, B=${lineRes.B.toFixed(1)}, C=${lineRes.C.toFixed(1)}`
        : "退化",
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "判别式 Δ 与相交状态",
      symbol: "\\Delta = B^2 - 4AC",
      value: lineRes.valid
        ? `Δ = ${lineRes.discriminant.toFixed(1)} ${lineRes.discriminant > 0 ? "(两不同交点)" : "(相切重根)"}`
        : `Δ = ${lineRes.discriminant.toFixed(1)} (无交点)`,
      color: lineRes.valid ? MATH_COLORS.paramTertiary : MATH_COLORS.accent,
    },
  ];

  if (lineRes.valid) {
    quantities.push(
      {
        label: "韦达定理和 (中点指标)",
        symbol: "t_1 + t_2 = -\\frac{B}{A}",
        value: `${(lineRes.t1 + lineRes.t2).toFixed(2)} ${isMidpoint ? "(已平分弦 B≈0)" : ""}`,
        color: isMidpoint ? MATH_COLORS.accent : MATH_COLORS.paramSecondary,
      },
      {
        label: "韦达定理积 (割线方幂)",
        symbol: "t_1 t_2 = \\frac{C}{A}",
        value: `${(lineRes.t1 * lineRes.t2).toFixed(2)} (${isInternal ? "定点在内部 t₁t₂<0" : "定点在外部 t₁t₂>0"})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "相交弦长 |AB|",
        symbol: "|AB| = \\frac{\\sqrt{\\Delta}}{|A|}",
        value: lineRes.chordLength.toFixed(2),
        color: MATH_COLORS.accent,
      },
      {
        label: "线段乘积 |P₀A|·|P₀B|",
        symbol: "|t_1 t_2| = \\left|\\frac{C}{A}\\right|",
        value: lineRes.productPA_PB.toFixed(2),
        color: MATH_COLORS.accent,
      },
      {
        label: "几何线段倒数和",
        symbol: isInternal
          ? "\\frac{1}{|P_0A|} + \\frac{1}{|P_0B|} = \\frac{\\sqrt{\\Delta}}{|C|}"
          : "\\frac{1}{|P_0A|} + \\frac{1}{|P_0B|} = \\left|\\frac{B}{C}\\right|",
        value:
          lineRes.invSumPA_PB > 0
            ? `${lineRes.invSumPA_PB.toFixed(2)} (${isInternal ? "内分弦" : "外分点"})`
            : "无意义",
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "弦中点 M 坐标与参数 tM",
        symbol: "t_M = -\\frac{B}{2A}",
        value: `tM = ${lineRes.tM.toFixed(2)}, M(${lineRes.pointM.x.toFixed(2)}, ${lineRes.pointM.y.toFixed(2)})`,
        color: MATH_COLORS.paramSecondary,
      },
    );
  }

  const theorems: Theorem[] = [
    {
      name: "参数代换一元二次方程与韦达定理",
      latex:
        "At^2 + Bt + C = 0 \\implies t_1 + t_2 = -\\frac{B}{A}, \\quad t_1 t_2 = \\frac{C}{A}",
      condition:
        "直线标准方程代入椭圆一般方程后导出。利用韦达定理可直接化简弦长、方幂与几何倒数和，彻底避免分别解交点坐标。",
    },
    {
      name: "中点弦充要条件定理",
      latex:
        "P_0 \\text{ 为弦 } AB \\text{ 中点} \\iff t_1 + t_2 = 0 \\iff B = 0",
      condition:
        "一次项系数 B = 2(b² x₀ cosα + a² y₀ sinα) = 0 直接建立中点与割线倾斜角的代数约束关系。",
    },
    {
      name: "高考线段倒数和同异号分类法则",
      latex:
        "\\frac{1}{|P_0A|} + \\frac{1}{|P_0B|} = \\begin{cases} \\frac{\\sqrt{\\Delta}}{|C|} & (t_1 t_2 < 0,\\ P_0 \\text{在内部/焦点弦}) \\\\ \\left|\\frac{B}{C}\\right| & (t_1 t_2 > 0,\\ P_0 \\text{在外部}) \\end{cases}",
      condition:
        "高考解析几何丢分雷区：绝对线段长度倒数和 1/|t1| + 1/|t2| 仅在同号时等于 |B/C|；若定点在内部（如过焦点弦），分子为 |t1-t2|=√Δ/|A|，倒数和为 √Δ/|C|。",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "【2025/2026 命题趋势】设点降维与反套路运算：新高考压轴题重在考查多想少算的化简能力。直线与圆锥曲线相交时，通过单参数设点（如抛物线设纵坐标 $y_1, y_2$ 或向量参数 $\\vec{OP}=(1-\\lambda)\\vec{OA}+\\lambda\\vec{OB}$）可直接消除高次通分，是替代盲目设 $y=kx+b$ 硬联立的标准方案。",
      importance: "core",
    },
    {
      text: "中点弦与割线方幂答题安全：选择填空中可直接利用参数方程 $B=0$ 和 $t_1 t_2 = \\frac{C}{A}$ 秒解；在解答题中建议以「向量中点坐标公式」或「点差法」规范书写步骤，且必须检验判别式 $\\Delta > 0$。",
      importance: "hard",
    },
  ];

  const warnings: WarningItem[] = [];
  if (!lineRes.valid) {
    warnings.push({
      text: "无交点警示：当前直线与椭圆判别式 Δ < 0，无实数相交弦。",
      level: "danger",
    });
  } else if (lineRes.discriminant === 0) {
    warnings.push({
      text: "相切极限状态：当前判别式 Δ = 0，t1 = t2 为实数重根，割线退化为切线。",
      level: "info",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "代入曲线得二次，韦达定理代换灵；B 为零时中点立，内分外分辨分明。",
  };
}
