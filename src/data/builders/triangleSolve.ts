import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  ReasoningStep,
} from "../types";
import {
  solveTriangleFromSAS,
  solveSSA,
  solveBisectorAndMedian,
} from "@/math/triangleSolve";
import type { SSACaseKind } from "@/math/triangleSolve";
import { MATH_COLORS } from "@/theme";

/**
 * SSA 解个数判据分支 → 右屏说明文案。
 * 说明文案必须由 math 层返回的 caseKind 渲染，绝不在右屏重新推导判据，
 * 否则 A ≥ 90° 时会输出「0 个解 (h < a < b 双解)」这类数值与说明打架的内容。
 */
const SSA_CASE_LABEL: Record<SSACaseKind, string> = {
  acute_no_solution: "a < h 无解",
  acute_right_single: "a = h 单解 (直角)",
  acute_double: "h < a < b 双解",
  acute_single: "a ≥ b 单解",
  nonacute_single: "A ≥ 90°, a > b 单解",
  nonacute_no_solution: "A ≥ 90°, a ≤ b 无解",
};

export function buildTriangleSolvePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode =
    (config?.studyMode as string) || (config?.mode as string) || "sine";

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
        label: "分面积 $S_{\\triangle ABD}$ 与 $S_{\\triangle ACD}$",
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

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法 · 等面积拆解半角",
        detail:
          "遇内角平分线 $AD$，记 $\\angle BAD = \\angle CAD = \\frac{A}{2}$。以 $A$ 为公共顶点把总面积拆成左右两块，两块都含 $AD$ 与半角。",
        latex:
          "S_{\\triangle ABC} = \\frac{1}{2}bc\\sin A = S_{\\triangle ABD} + S_{\\triangle ACD} = \\frac{1}{2}(b+c)\\cdot AD\\sin\\frac{A}{2}",
        rubric: "采分点：正确拆解面积并识别两段半角（3分）",
      },
      {
        step: 2,
        title: "建模联立 · 约去半角正弦",
        detail:
          "把 $\\sin A$ 展成 $2\\sin\\frac{A}{2}\\cos\\frac{A}{2}$；因 $0<A<180^\\circ$ 时 $\\sin\\frac{A}{2}\\neq 0$，两边约去后解出 $AD$。",
        latex:
          "\\frac{1}{2}bc\\cdot 2\\sin\\frac{A}{2}\\cos\\frac{A}{2} = \\frac{1}{2}(b+c)AD\\sin\\frac{A}{2} \\implies AD = \\frac{2bc\\cos\\frac{A}{2}}{b+c}",
        rubric: "采分点：二倍角化简并解出角平分线长公式（4分）",
      },
      {
        step: 3,
        title: "代入求解 · 数值与分底边",
        detail: `代入 $b = ${b.toFixed(1)}$、$c = ${c.toFixed(1)}$、$A = ${anglesDeg.A.toFixed(1)}^\\circ$ 求出 $AD$；再由分角定理 $BD:DC = c:b$ 得到两段底边 $BD = ${sideBD.toFixed(2)}$、$DC = ${sideDC.toFixed(2)}$。`,
        latex: `AD = \\frac{2\\times ${b.toFixed(1)}\\times ${c.toFixed(1)}\\times \\cos ${(angleA / 2).toFixed(1)}^\\circ}{${b.toFixed(1)} + ${c.toFixed(1)}} = ${bisectorLength.toFixed(2)}`,
        rubric: "采分点：代入数值求出角平分线长与分底边段（3分）",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      reasoningSteps,
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
        label: "解的个数 ($N_{\\text{sol}}$)",
        symbol: "N_{\\text{sol}}",
        value: `${solutionCount} 个解 (${SSA_CASE_LABEL[ssaResult.caseKind]})`,
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

    // 推导链必须落到「符号式 → 代入解析式 → 结果」三步：
    // 先给临界高 h，再给判据比较，最后回代检验增解，避免直接抛「0/1/2 个解」的孤立结论。
    const sinBVal = (b * Math.sin((angleA * Math.PI) / 180)) / a;
    const toDeg1 = (rad: number) => ((rad * 180) / Math.PI).toFixed(1);
    const sol2 = details[1];

    let solveDetail: string;
    let solveLatex: string;
    if (solutionCount === 0) {
      if (ssaResult.caseKind === "nonacute_no_solution") {
        solveDetail = `内角 $A = ${angleA.toFixed(1)}^\\circ \\ge 90^\\circ$ 为直角或钝角，大角对大边要求对边 $a$ 必须严格大于邻边 $b$。当前 $a = ${a.toFixed(2)} \\le b = ${b.toFixed(2)}$，无法构成三角形，直接作答无解。`;
        solveLatex = `A \\ge 90^\\circ,\\quad a = ${a.toFixed(2)} \\le b = ${b.toFixed(2)} \\implies \\varnothing`;
      } else {
        solveDetail = `底边 $a = ${a.toFixed(2)}$ 比临界高 $h = ${h.toFixed(2)}$ 还短，圆弧与射线不相交，三角形不存在，直接作答无解。`;
        solveLatex = `a = ${a.toFixed(2)} < h = ${h.toFixed(2)} \\implies \\varnothing`;
      }
    } else if (solutionCount === 2 && sol1 && sol2) {
      solveDetail = `$\\sin B = ${sinBVal.toFixed(3)}$ 同时对应锐角解 $B_1 = ${toDeg1(sol1.angleB)}^\\circ$ 与钝角解 $B_2 = ${toDeg1(sol2.angleB)}^\\circ$，两解内角和均小于 $180^\\circ$，故有两个三角形，必须都写出。`;
      solveLatex = `c_1 = \\frac{a\\sin C_1}{\\sin A} = ${sol1.c.toFixed(2)},\\quad c_2 = \\frac{a\\sin C_2}{\\sin A} = ${sol2.c.toFixed(2)}`;
    } else if (sol1) {
      solveDetail = `$\\sin B = ${sinBVal.toFixed(3)}$ 解出 $B_1 = ${toDeg1(sol1.angleB)}^\\circ$；其补角会使 $A + B > 180^\\circ$，须舍去。再由内角和得 $C_1 = ${toDeg1(sol1.angleC)}^\\circ$。`;
      solveLatex = `c_1 = \\frac{a\\sin C_1}{\\sin A} = ${sol1.c.toFixed(2)}`;
    } else {
      solveDetail = "当前参数下无合法解。";
      solveLatex = "\\varnothing";
    }

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法 · 先求临界高",
        detail:
          "已知两边 $a, b$ 与其中一边的对角 $A$（SSA 不是全等条件）。过顶点 $C$ 向射线 $AB$ 作垂线，得到临界高 $h$，它把 $a$ 的取值范围切成若干判定区间。",
        latex: `h = b\\sin A = ${b.toFixed(2)}\\times \\sin ${angleA.toFixed(1)}^\\circ = ${h.toFixed(2)}`,
        rubric: "采分点：先算出临界高 h = b·sinA（3分）",
      },
      {
        step: 2,
        title: "建模联立 · 比较定解数",
        detail: `把 $a$ 与 $h$、$b$ 作比较：$A<90^\\circ$ 时 $a<h$ 无解、$a=h$ 一解（直角）、$h<a<b$ 两解、$a\\ge b$ 一解；$A\\ge 90^\\circ$ 时 $a>b$ 一解、$a\\le b$ 无解。当前落入「${SSA_CASE_LABEL[ssaResult.caseKind]}」。`,
        latex: `a = ${a.toFixed(2)},\\quad h = ${h.toFixed(2)},\\quad b = ${b.toFixed(2)} \\implies N_{\\text{sol}} = ${solutionCount}`,
        rubric: "采分点：套用判据给出解的个数（4分）",
      },
      {
        step: 3,
        title: "代入求解 · 回代检验内角和",
        detail: solveDetail,
        latex: solveLatex,
        rubric: "采分点：求出边角并完成增解检验（4分）",
      },
    ];

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
      reasoningSteps,
      warnings:
        solutionCount === 0
          ? [
              {
                text:
                  ssaResult.caseKind === "nonacute_no_solution"
                    ? "无解警示：内角 A ≥ 90° 且对边 a ≤ b，大角对大边不成立，无交点！"
                    : "无解警示：当前对边 a < h (b·sinA)，圆弧与射线无交点！",
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
          "任意 $\\triangle ABC$，$R$ 为外接圆半径。构造直径 $CC'$ 形成 $\\text{Rt}\\triangle BCC'$，同弧 $BC$ 所对圆周角 $\\angle C'$ 与 $\\angle A$ 相等或互补 $\\implies \\sin A = \\sin\\angle C' = \\frac{a}{2R}$",
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

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法 · 锁定公共比值",
        detail:
          "正弦定理把三边与各自对角的正弦绑成同一个比值，且该比值恰为外接圆直径 $2R$。先写出符号形式。",
        latex:
          "\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R",
        rubric: "采分点：写出正弦定理的连比形式（3分）",
      },
      {
        step: 2,
        title: "建模联立 · 代入已知边角",
        detail:
          "把已知的边 $a$ 与其对角 $A$ 代入求出公共比值，再用同一个比值回代其余边角，实现边角互化。",
        latex: `\\frac{a}{\\sin A} = \\frac{${sides.a.toFixed(2)}}{\\sin ${anglesDeg.A.toFixed(1)}^\\circ} = ${sineRatios.ratioA.toFixed(2)} = 2R`,
        rubric: "采分点：代入求比并指出该比值即 2R（4分）",
      },
      {
        step: 3,
        title: "代入求解 · 边角与半径齐出",
        detail: `由比例式得 $b = \\frac{a\\sin B}{\\sin A}$、$c = \\frac{a\\sin C}{\\sin A}$；公共比值即外接圆直径，故半径为其一半。`,
        latex: `b = ${sides.b.toFixed(2)},\\quad c = ${sides.c.toFixed(2)},\\quad R = \\frac{${sineRatios.ratioA.toFixed(2)}}{2} = ${circumcircle.radius.toFixed(2)}`,
        rubric: "采分点：求出全部边角与外接圆半径（3分）",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      reasoningSteps,
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
        value: `${cosAVal.toFixed(3)} (${Math.abs(cosAVal) < 1e-9 ? "直角" : cosAVal > 0 ? "锐角" : "钝角"})`,
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

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法 · 两边夹角定第三边",
        detail:
          "已知两边 $b, c$ 及其夹角 $A$（SAS 全等型），直接用余弦定理求对边，不必先求其余两角。",
        latex: "a^2 = b^2 + c^2 - 2bc\\cos A",
        rubric: "采分点：写出余弦定理并说明属于 SAS 型（3分）",
      },
      {
        step: 2,
        title: "建模联立 · 逐项代入展开",
        detail:
          "把 $b, c$ 与 $\\cos A$ 逐项代入：先算两邻边平方和，再算修正项 $2bc\\cos A$。注意 $A$ 为钝角时 $\\cos A < 0$，修正项整体为负，等价于加上其绝对值。",
        latex: `a^2 = ${(sides.b ** 2).toFixed(2)} + ${(sides.c ** 2).toFixed(2)} - 2\\times ${sides.b.toFixed(2)}\\times ${sides.c.toFixed(2)}\\times \\cos ${anglesDeg.A.toFixed(1)}^\\circ`,
        rubric: "采分点：代入数值写出 a² 的解析式（4分）",
      },
      {
        step: 3,
        title: "代入求解 · 结果与射影校验",
        detail: `得 $a = ${sides.a.toFixed(2)}$。再用射影定理 $a = c\\cos B + b\\cos C$ 作独立校验：两段有向投影之和应恒等于底边。`,
        latex: `a = ${sides.a.toFixed(2)},\\quad c\\cos B + b\\cos C = ${projections.cCosB.toFixed(2)} + ${projections.bCosC.toFixed(2)} = ${sides.a.toFixed(2)}`,
        rubric: "采分点：求出 a 并用射影定理回代校验（3分）",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      reasoningSteps,
      warnings:
        Math.abs(cosAVal) < 1e-9
          ? [
              {
                text: "直角情形：当前 A = 90° (cosA = 0)，余弦修正项 -2bc·cosA = 0，余弦定理退化为勾股定理 a² = b² + c²。",
                level: "warning",
              },
            ]
          : cosAVal < 0
            ? [
                {
                  text: "钝角警示：当前 A 为钝角 (cosA < 0)，余弦修正项 -2bc·cosA 变为正数，导致 a² > b² + c²！",
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
      note: "无需计算内角，直接从三边求面积的工具。注：海伦公式不在人教A版课标正文范围内，课标内求解面积应先用余弦定理求角、再用 $S=\\frac{1}{2}ab\\sin C$。",
      level: "supplementary",
      // 拓展属性改用**条目级**结构化标注（isExtension + extensionBadge），
      // 与 probabilityDistribution / sequence 等页保持一致；
      // 旧写法把「（拓展 · 超出课标）」塞进 name，既污染定理名，也无法被审计工具按条目识别。
      isExtension: true,
      extensionBadge: "拓展 · 超出课标",
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

  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: "审题定法 · 面积公式族的主线",
      detail:
        "已知两边 $b, c$ 与夹角 $A$，先由两边夹角公式定出面积；内切圆半径 $r$、高线 $h_a$ 都可由面积反解，外接圆半径由三边与面积联系。",
      latex:
        "S = \\frac{1}{2}bc\\sin A = \\frac{abc}{4R} = r\\cdot p, \\quad p = \\frac{a+b+c}{2}",
      rubric: "采分点：写出面积公式族并明确以 S 为中心（3分）",
    },
    {
      step: 2,
      title: "建模联立 · 代入求面积与半周长",
      detail:
        "代入 $b, c$ 与夹角 $A$ 求出面积 $S$；再由三边和求半周长 $p$，为反解内切圆半径做准备。",
      latex: `S = \\frac{1}{2}\\times ${sides.b.toFixed(2)}\\times ${sides.c.toFixed(2)}\\times \\sin ${angleA.toFixed(1)}^\\circ = ${area.toFixed(2)},\\quad p = ${pVal.toFixed(2)}`,
      rubric: "采分点：代入求出面积 S 与半周长 p（4分）",
    },
    {
      step: 3,
      title: "代入求解 · 反解内切圆与外接圆",
      detail: `由等面积法 $S = rp$ 反解 $r = \\frac{S}{p}$；由 $S = \\frac{abc}{4R}$ 反解 $R = \\frac{abc}{4S}$。高线则由 $S = \\frac{1}{2}ah_a$ 得 $h_a = ${altitudeA.length.toFixed(2)}$。`,
      latex: `r = \\frac{${area.toFixed(2)}}{${pVal.toFixed(2)}} = ${incircle.radius.toFixed(2)},\\quad R = \\frac{abc}{4S} = ${circumcircle.radius.toFixed(2)}`,
      rubric: "采分点：由面积反解 $r$、$R$ 与 $h_a$（3分）",
    },
  ];

  return {
    quantities,
    theorems,
    gaokaoPoints,
    reasoningSteps,
    warnings: [],
    mnemonic: "半周切圆积为先，四R分母积三边；夹角正弦乘两肋，面积转化题题宣！",
  };
}
