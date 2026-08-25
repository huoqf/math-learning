import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
} from "../types";
import {
  solveTriangleFromSAS,
  solveSSA,
  solveBisectorAndMedian,
} from "@/math/triangleSolve";
import { MATH_COLORS } from "@/theme";

export function buildTriangleSolvePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) || "sine";

  const angleA = params.angleA ?? 60;
  const b = params.b ?? 5;
  const c = params.c ?? 6;
  const a = params.a ?? 4.5;

  const sasResult = solveTriangleFromSAS(b, c, angleA);
  const ssaResult = solveSSA(a, b, angleA);

  if (studyMode === "bisector") {
    const bm = solveBisectorAndMedian(b, c, angleA);
    const {
      base,
      bisectorLength,
      medianLength,
      sideBD,
      sideDC,
      areaABD,
      areaACD,
      vectorWeights,
    } = bm;
    const { anglesDeg, area } = base;

    const quantities: MathQuantity[] = [
      {
        label: "角平分线长 tₐ (AD)",
        symbol: "t_a = AD",
        value: bisectorLength.toFixed(2),
        color: MATH_COLORS.tangentLine,
        highlight: "positive",
      },
      {
        label: "中线长 mₐ (AM)",
        symbol: "m_a = AM",
        value: medianLength.toFixed(2),
        color: MATH_COLORS.complexNum,
      },
      {
        label: "分底边段 BD 与 DC",
        symbol: "BD, \\; DC",
        value: `BD = ${sideBD.toFixed(2)}, DC = ${sideDC.toFixed(2)} (比值 c:b = ${(c / b).toFixed(2)})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "分面积 S_ABD 与 S_ACD",
        symbol: "S_{\\triangle ABD}, \\; S_{\\triangle ACD}",
        value: `S₁ = ${areaABD.toFixed(2)}, S₂ = ${areaACD.toFixed(2)} (总 S = ${area.toFixed(2)})`,
        color: MATH_COLORS.sequenceHighlight,
      },
      {
        label: "向量基底分解系数",
        symbol: "\\vec{AD} = \\lambda\\vec{AB} + \\mu\\vec{AC}",
        value: `λ = ${vectorWeights.lambda.toFixed(2)}, μ = ${vectorWeights.mu.toFixed(2)} (λ+μ=1)`,
        color: MATH_COLORS.function,
      },
      {
        label: "夹角 A 与边 b, c",
        symbol: "A, \\; b, \\; c",
        value: `A = ${anglesDeg.A.toFixed(1)}°, b = ${b.toFixed(1)}, c = ${c.toFixed(1)}`,
        color: MATH_COLORS.paramSecondary,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "角平分线长公式 (等面积法推导)",
        latex: "t_a = \\frac{2bc\\cos\\frac{A}{2}}{b+c}",
        condition:
          "由 $S_{\\triangle ABC} = S_{\\triangle ABD} + S_{\\triangle ACD} \\iff \\frac{1}{2}bc\\sin A = \\frac{1}{2}(b+c)t_a\\sin\\frac{A}{2}$ 导出",
        note: "高考求角平分线长的最快解析通法，完全避开求底边交点坐标或繁琐几何作图。",
        level: "core",
      },
      {
        name: "角平分线向量基底定理与分角定理",
        latex:
          "\\vec{AD} = \\frac{b}{b+c}\\vec{AB} + \\frac{c}{b+c}\\vec{AC}, \\quad \\frac{BD}{DC} = \\frac{c}{b}",
        condition: "$D$ 为 $\\triangle ABC$ 内角 $A$ 的平分线与 $BC$ 的交点",
        note: "高考向量基底题型母题：角平分线向量必然表示为两侧邻边单位向量和的方向向量。",
        level: "core",
      },
      {
        name: "中线长定理 (极化恒等式与余弦法)",
        latex:
          "m_a^2 = \\frac{2b^2 + 2c^2 - a^2}{4} \\iff \\vec{AB} \\cdot \\vec{AC} = |\\vec{AM}|^2 - |\\vec{BM}|^2",
        condition: "$M$ 为 $BC$ 边的中点",
        note: "结合极化恒等式可秒杀中线与向量数量积的综合压轴题。",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "高考大题第 (2) 问母题：'遇角平分线，首选等面积法求线段长' —— $S_{\\text{总}} = S_{\\text{左}} + S_{\\text{右}}$。",
        importance: "gaokao",
      },
      {
        text: "向量数量积转化法则：若已知 $AD$ 是角平分线，由基底表示可直接展开求 $|AD|^2$ 或数量积乘积。",
        importance: "hard",
      },
      {
        text: "中线模型最值与范围：中线 $AM$ 常结合基本不等式 $2b^2 + 2c^2 \\ge (b+c)^2$ 或极化恒等式考查最值。",
        importance: "gaokao",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings: [],
      mnemonic:
        "角分平分面积和，分段比值邻边夺；中线极化平方差，高考压轴全拿下！",
    };
  }

  if (studyMode === "ssa") {
    const { solutionCount, h, details } = ssaResult;
    const sol1 = details[0];

    const quantities: MathQuantity[] = [
      {
        label: "已知对角 A",
        symbol: "A",
        value: `${angleA.toFixed(1)}°`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "已知邻边 b",
        symbol: "b",
        value: b.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "已知对边 a",
        symbol: "a",
        value: a.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "临界垂线高 h (b·sinA)",
        symbol: "h = b\\sin A",
        value: h.toFixed(2),
        color: MATH_COLORS.tangentLine,
      },
      {
        label: "解的个数 (N_sol)",
        symbol: "N_{\\text{sol}}",
        value: `${solutionCount} 个解 (${a < h - 1e-4 ? "a < h 无解" : Math.abs(a - h) <= 1e-4 ? "a = h 单解(直角)" : a < b ? "h < a < b 双解" : "a ≥ b 单解"})`,
        color:
          solutionCount === 2
            ? MATH_COLORS.sequenceHighlight
            : solutionCount === 0
              ? MATH_COLORS.paramPrimary
              : MATH_COLORS.paramTertiary,
        highlight:
          solutionCount === 2
            ? "positive"
            : solutionCount === 0
              ? "negative"
              : undefined,
      },
    ];

    if (solutionCount > 0 && sol1) {
      quantities.push(
        {
          label: "解1: 边 c1",
          symbol: "c_1",
          value: sol1.c.toFixed(2),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "解1: 角 B1 与 C1",
          symbol: "B_1, \\; C_1",
          value: `B₁ = ${((sol1.angleB * 180) / Math.PI).toFixed(1)}°, C₁ = ${((sol1.angleC * 180) / Math.PI).toFixed(1)}°`,
          color: MATH_COLORS.paramSecondary,
        },
      );
    }
    if (solutionCount === 2 && details[1]) {
      const sol2 = details[1];
      quantities.push(
        {
          label: "解2: 边 c2",
          symbol: "c_2",
          value: sol2.c.toFixed(2),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "解2: 角 B2 与 C2 (钝角解)",
          symbol: "B_2, \\; C_2",
          value: `B₂ = ${((sol2.angleB * 180) / Math.PI).toFixed(1)}°, C₂ = ${((sol2.angleC * 180) / Math.PI).toFixed(1)}°`,
          color: MATH_COLORS.paramSecondary,
        },
      );
    }

    return {
      quantities,
      theorems: [
        {
          name: "SSA 条件判定定理",
          latex:
            "A < 90^\\circ \\implies \\begin{cases} a < b\\sin A & \\text{0解} \\\\ a = b\\sin A & \\text{1解(直角)} \\\\ b\\sin A < a < b & \\text{2解(双解)} \\\\ a \\ge b & \\text{1解} \\end{cases}",
          condition: "已知两边及其中一边的对角 $A, b, a$",
          level: "core",
          mode: "block",
        },
      ],
      gaokaoPoints: [
        {
          text: "高考必考：SSA 伪全等与双解判断。已知 $a, b, A$，若 $a < b$ 且 $a > b\\sin A$，则存在两个三角形（一个锐角三角形，一个钝角三角形），正弦定理求角时切记不可漏掉钝角解！",
          importance: "gaokao",
        },
      ],
      warnings:
        solutionCount === 0
          ? [
              {
                text: "无解警示：当前对边 a < h (b·sinA)，圆弧与射线无交点！",
                level: "danger",
              },
            ]
          : solutionCount === 2
            ? [
                {
                  text: "双解警示：当前 h < a < b，圆弧存在两个交点 B1, B2，对应两个合法三角形！",
                  level: "warning",
                },
              ]
            : [],
    };
  }

  // 正弦定理专属模式 (sine)
  if (studyMode === "sine") {
    const { sides, anglesDeg, sineRatios, circumcircle } = sasResult;
    const quantities: MathQuantity[] = [
      {
        label: "边 a 与对角 A",
        symbol: "a, \\; A",
        value: `a = ${sides.a.toFixed(2)}, A = ${anglesDeg.A.toFixed(1)}°`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "正弦比 a / sinA",
        symbol: "\\frac{a}{\\sin A}",
        value: sineRatios.ratioA.toFixed(2),
        color: MATH_COLORS.function,
        highlight: "positive",
      },
      {
        label: "外接圆直径 2R 与半径 R",
        symbol: "2R, \\; R",
        value: `2R = ${(circumcircle.radius * 2).toFixed(2)}, R = ${circumcircle.radius.toFixed(2)}`,
        color: MATH_COLORS.circle,
        highlight: "positive",
      },
      {
        label: "边 b 与正弦比 b / sinB",
        symbol: "b, \\; \\frac{b}{\\sin B}",
        value: `b = ${sides.b.toFixed(2)}, 比值 = ${sineRatios.ratioB.toFixed(2)}`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "边 c 与正弦比 c / sinC",
        symbol: "c, \\; \\frac{c}{\\sin C}",
        value: `c = ${sides.c.toFixed(2)}, 比值 = ${sineRatios.ratioC.toFixed(2)}`,
        color: MATH_COLORS.paramTertiary,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "正弦定理与外接圆直径本质",
        latex:
          "\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R",
        condition:
          "任意 $\\triangle ABC$，$R$ 为外接圆半径。构造直径 $CC'$ 形成 $\\text{Rt}\\triangle BCC'$，同弧圆周角 $\\angle C' = \\angle A \\implies \\sin A = \\frac{a}{2R}$",
        note: "高考大题第 (1) 问边化角与角化边的绝对主力工具。",
        level: "core",
      },
      {
        name: "正弦定理边角互化三大形式",
        latex:
          "a = 2R\\sin A, \\quad \\sin A = \\frac{a}{2R}, \\quad a:b:c = \\sin A : \\sin B : \\sin C",
        condition: "遇到齐次一次式首选边化角；遇到乘积比例式首选齐次替换。",
        note: "齐次式中 $2R$ 可直接约去，极大简化三角化简运算量。",
        level: "core",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "高考边角互化决策树 1：若已知条件是一次齐次式（如 $a\\sin B = b\\cos A$），优先'边化角'，利用两角和差公式化为 $\\sin(A+B)=\\sin C$ 进行消元降元。",
        importance: "gaokao",
      },
      {
        text: "大边对大角与外接圆：$a > b \\iff A > B \\iff \\sin A > \\sin B$（在三角形内成立），用于排除三角形解的钝角增解/伪解。",
        importance: "core",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings: [],
      mnemonic:
        "正弦比值等直径，边化角来两角并；大边大角正弦定，高考通法第一步！",
    };
  }

  // 余弦定理与射影定理专属模式 (cosine)
  if (studyMode === "cosine") {
    const { sides, anglesDeg, projections } = sasResult;
    const radA = (anglesDeg.A * Math.PI) / 180;
    const cosAVal = Math.cos(radA);

    const quantities: MathQuantity[] = [
      {
        label: "对边平方 a² 与 a",
        symbol: "a^2, \\; a",
        value: `a² = ${(sides.a ** 2).toFixed(2)}, a = ${sides.a.toFixed(2)}`,
        color: MATH_COLORS.paramPrimary,
        highlight: "positive",
      },
      {
        label: "余弦值 cos A",
        symbol: "\\cos A",
        value: `${cosAVal.toFixed(3)} (${cosAVal > 0 ? "锐角" : cosAVal === 0 ? "直角" : "钝角"})`,
        color:
          cosAVal < 0 ? MATH_COLORS.paramPrimary : MATH_COLORS.paramSecondary,
      },
      {
        label: "两邻边平方和 b² + c²",
        symbol: "b^2 + c^2",
        value: `${(sides.b ** 2 + sides.c ** 2).toFixed(2)} (b=${sides.b.toFixed(1)}, c=${sides.c.toFixed(1)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "余弦修正项 2bc cos A",
        symbol: "2bc\\cos A",
        value: `${(2 * sides.b * sides.c * cosAVal).toFixed(2)}`,
        color: MATH_COLORS.tangentLine,
      },
      {
        label: "射影定理分段 c·cos B 与 b·cos C",
        symbol: "c\\cos B + b\\cos C",
        value: `${projections.cCosB.toFixed(2)} + ${projections.bCosC.toFixed(2)} = ${sides.a.toFixed(2)} = a`,
        color: MATH_COLORS.complexNum,
        highlight: "positive",
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "余弦定理 (向量数量积与勾股推广)",
        latex:
          "a^2 = b^2 + c^2 - 2bc\\cos A \\iff \\cos A = \\frac{b^2 + c^2 - a^2}{2bc}",
        condition:
          "$\\vec{a} = \\vec{c} - \\vec{b} \\implies |\\vec{a}|^2 = |\\vec{c}|^2 + |\\vec{b}|^2 - 2\\vec{b}\\cdot\\vec{c}$，向量点乘几何本质",
        note: "高考求角、求边长、判定锐角/钝角三角形的核心定理。",
        level: "core",
      },
      {
        name: "射影定理（第一余弦定理）",
        latex:
          "a = c\\cos B + b\\cos C, \\quad b = a\\cos C + c\\cos A, \\quad c = a\\cos B + b\\cos A",
        condition:
          "自顶点 $A$ 向底边 $BC$ 引高线划分底边所得的两直角三角形水平投影之和",
        note: "高考大题中出现 $a\\cos B + b\\cos A$ 型结构时，可直接用射影定理秒杀转化为边长 $c$！",
        level: "core",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "高考边角互化决策树 2：若已知式为二次齐次式（如 $a^2+b^2-c^2 = ab$），必须优先'角化边'，利用 $\\cos C = \\frac{a^2+b^2-c^2}{2ab} = \\frac{1}{2}$ 直接求出 $C = \\frac{\\pi}{3}$。",
        importance: "gaokao",
      },
      {
        text: "余弦定理结合基本不等式求最值：$a^2 = b^2+c^2-2bc\\cos A \\ge 2bc(1-\\cos A) \\implies bc \\le \\frac{a^2}{2(1-\\cos A)}$，当且仅当 $b=c$ 时面积取得最大值！",
        importance: "hard",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings:
        anglesDeg.A >= 90
          ? [
              {
                text: "钝角/直角警示：当前 A 为钝角 (cosA < 0)，余弦修正项 -2bc·cosA 变为正数，导致 a² > b² + c²！",
                level: "warning",
              },
            ]
          : [],
      mnemonic:
        "余弦点积平方差，射影底边两段夹；二次齐次速求角，均值求极顶呱呱！",
    };
  }

  // 面积与内切外接圆模式 (area)
  const { sides, area, circumcircle, incircle, altitudeA } = sasResult;
  const pVal = (sides.a + sides.b + sides.c) / 2;

  const quantities: MathQuantity[] = [
    {
      label: "三角形面积 S",
      symbol: "S_{\\triangle ABC}",
      value: area.toFixed(2),
      color: MATH_COLORS.sequenceHighlight,
      highlight: "positive",
    },
    {
      label: "内切圆半径 r (S / p)",
      symbol: "r = \\frac{S}{p}",
      value: incircle.radius.toFixed(2),
      color: MATH_COLORS.complexNum,
    },
    {
      label: "外接圆半径 R (abc / 4S)",
      symbol: "R = \\frac{abc}{4S}",
      value: circumcircle.radius.toFixed(2),
      color: MATH_COLORS.circle,
    },
    {
      label: "顶点 A 高线 ha (2S / a)",
      symbol: "h_a",
      value: altitudeA.length.toFixed(2),
      color: MATH_COLORS.tangentLine,
    },
    {
      label: "半周长 p = (a+b+c)/2",
      symbol: "p",
      value: pVal.toFixed(2),
      color: MATH_COLORS.paramSecondary,
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "解三角形面积全公式集锦",
      latex:
        "S = \\frac{1}{2}ab\\sin C = \\frac{1}{2}bc\\sin A = \\frac{1}{2}ac\\sin B = \\frac{abc}{4R} = r\\cdot p",
      condition:
        "$p = \\frac{a+b+c}{2}$ 为半周长，$r$ 为内切圆半径，$R$ 为外接圆半径",
      note: "高考中求内切圆半径 $r$ 首选面积等体积转化法 $r = \\frac{2S}{a+b+c}$。",
      level: "core",
    },
    {
      name: "海伦公式 (Heron's Formula)",
      latex: "S = \\sqrt{p(p-a)(p-b)(p-c)}",
      condition: "已知三边长 $a, b, c$",
      note: "无需计算内角，直接从三边求面积的极速工具。",
      level: "important",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "高考面积题型常考方向：已知两边之和 $b+c$ 与面积 $S$，结合 $S = \\frac{1}{2}bc\\sin A$ 与余弦定理 $a^2 = (b+c)^2 - 2bc(1+\\cos A)$ 联立消元求解。",
      importance: "gaokao",
    },
    {
      text: "内切圆切线长性质：从各顶点引出的切线长分别为 $p-a, p-b, p-c$，常用于解三角形与解析几何圆的切线综合题。",
      importance: "core",
    },
  ];

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings: [],
    mnemonic: "半周切圆积为先，四R分母积三边；夹角正弦乘两肋，面积转化题题宣！",
  };
}
