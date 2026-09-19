import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import { MATH_COLORS } from "@/theme";
import { formatPiFractionLatex } from "@/utils/mathFormat";
import {
  calculateTrigIdentity,
  calculateInduction,
  calculateUniversalInduction,
  calculateComplementaryModel,
  type FormulaType,
  type IdentitySubMode,
  type InductionSubMode,
} from "@/features/trigIdentity/math/trigIdentity";

export function buildTrigIdentityPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const alphaDeg = params.alphaDeg ?? 30;
  const homoA = params.homoA ?? 1;
  const homoB = params.homoB ?? 1;
  const homoC = params.homoC ?? 1;
  const homoD = params.homoD ?? 1;
  const quadA = params.quadA ?? 2;
  const quadB = params.quadB ?? 3;
  const quadC = params.quadC ?? -1;
  const universalK = params.universalK ?? 1;
  const universalSign = (params.universalSign ?? 1) as 1 | -1;
  const thetaDeg = params.thetaDeg ?? 30;

  const studyMode =
    (config?.studyMode as "identity" | "induction") ?? "identity";
  const identitySubMode =
    (config?.identitySubMode as IdentitySubMode) ?? "geometry";
  const inductionSubMode =
    (config?.inductionSubMode as InductionSubMode) ?? "standard6";
  const formulaType = (config?.formulaType as FormulaType) ?? "pi_plus";

  const trig = calculateTrigIdentity(
    alphaDeg,
    homoA,
    homoB,
    homoC,
    homoD,
    quadA,
    quadB,
    quadC,
  );
  const ind = calculateInduction(alphaDeg, formulaType);
  const univInd = calculateUniversalInduction(
    alphaDeg,
    universalK,
    universalSign,
  );
  const comp = calculateComplementaryModel(alphaDeg, thetaDeg);

  const radStr = formatPiFractionLatex(trig.alphaRad);
  const sinStr = trig.sinVal.toFixed(3);
  const cosStr = trig.cosVal.toFixed(3);
  const tanStr =
    trig.isTanDefined && trig.tanVal !== undefined
      ? trig.tanVal.toFixed(3)
      : "无意义";

  if (studyMode === "identity") {
    const quantities: MathQuantity[] = [
      {
        label: "角 α 角度/弧度",
        symbol: "\\alpha",
        value: `${alphaDeg}° ($${radStr}$)`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 P 坐标 (cosα, sinα)",
        symbol: "P(x, y)",
        value: `(${cosStr}, ${sinStr})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "正切值 (斜率/切线)",
        symbol: "\\tan\\alpha",
        value: tanStr,
        color: MATH_COLORS.paramTertiary,
        highlight: !trig.isTanDefined ? "extreme" : undefined,
      },
      {
        label: "平方关系验证",
        symbol: "\\sin^2\\alpha + \\cos^2\\alpha",
        value: `${trig.sinSq.toFixed(3)} + ${trig.cosSq.toFixed(3)} = ${trig.sqSum.toFixed(3)}`,
        color: MATH_COLORS.primary,
      },
    ];

    if (identitySubMode === "known_one") {
      quantities.push(
        {
          label: "和值 S = sinα + cosα",
          symbol: "S",
          value: `${trig.sumSC.toFixed(3)} (S²=${trig.sumSqVerif.toFixed(3)})`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "积值 P = sinα · cosα",
          symbol: "P = \\frac{S^2-1}{2}",
          value: `${trig.prodSC.toFixed(3)}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "差值 D = sinα - cosα",
          symbol: "D = \\pm\\sqrt{2-S^2}",
          value: `${trig.diffSC.toFixed(3)} (D²=${trig.diffSqVerif.toFixed(3)})`,
          color: MATH_COLORS.paramTertiary,
        },
      );
    } else if (identitySubMode === "homogeneous") {
      quantities.push(
        {
          label: "一次齐次分式化切",
          symbol: trig.homoFormulaTex,
          value:
            trig.isHomoDefined && trig.homoVal !== undefined
              ? `${trig.homoVal.toFixed(3)} (= ${trig.homoStepTex})`
              : "分母为零无意义",
          color: MATH_COLORS.paramSecondary,
          highlight: !trig.isHomoDefined ? "extreme" : undefined,
        },
        {
          label: "二次齐次式化切求值",
          symbol: trig.quadFormulaTex,
          value:
            trig.isQuadDefined && trig.quadVal !== undefined
              ? `${trig.quadVal.toFixed(3)} (= ${trig.quadStepTex})`
              : "正切无意义",
          color: MATH_COLORS.paramTertiary,
        },
      );
    }

    const theorems: Theorem[] = [
      {
        name: "同角平方关系 (单位圆勾股定理)",
        latex: "\\sin^2\\alpha + \\cos^2\\alpha = 1",
        condition: "$\\alpha \\in \\mathbb{R}$",
        note: "直观几何解释：单位圆上动点 P(cosα, sinα) 到原点距离 OP² = x² + y² = 1。",
        level: "core",
      },
      {
        name: "同角商数关系",
        latex: "\\tan\\alpha = \\frac{\\sin\\alpha}{\\cos\\alpha}",
        condition:
          "\\alpha \\neq k\\pi + \\frac{\\pi}{2} \\quad (k \\in \\mathbb{Z})",
        note: "直观几何解释：过点 A(1,0) 作 x 轴垂切线与终边交于 T(1, tanα)，由相似三角形得正切比值。",
        level: "core",
      },
      {
        name: "高考知一求二核心转换链",
        latex:
          "(\\sin\\alpha \\pm \\cos\\alpha)^2 = 1 \\pm 2\\sin\\alpha\\cos\\alpha = 1 \\pm \\sin 2\\alpha",
        condition:
          "已知 sinα+cosα、sinα-cosα、sinα·cosα 中任意一个可求另外两个",
        note: `开方决策警示：当前角度决策为：${trig.diffSignReason}。`,
        level: identitySubMode === "known_one" ? "core" : "important",
      },
      {
        name: "新高考齐次式“弦化切”秒杀法则",
        latex:
          "a\\sin^2\\alpha + b\\sin\\alpha\\cos\\alpha + c\\cos^2\\alpha = \\frac{a\\tan^2\\alpha + b\\tan\\alpha + c}{\\tan^2\\alpha + 1}",
        condition: "构造分母 1 = sin²α + cos²α，分子分母同除以 cos²α",
        note: "彻底消去正余弦，将已知 tanα 直接代入，10秒内速解高考选择填空题。",
        level: identitySubMode === "homogeneous" ? "core" : "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "高考考点1：给值求值 —— 已知 tanα，求一次/二次齐次分式或 1/(sinα·cosα) 的值",
        importance: "gaokao",
      },
      {
        text: "高考考点2：知一求二与范围 —— 已知 sinα+cosα=t，利用 t∈[-√2, √2] 与象限正负定解",
        importance: "gaokao",
      },
      {
        text: "高考考点3：“1”的代换 —— 在常数项乘 (sin²α+cos²α) 或给分母补 1 创造齐次条件",
        importance: "hard",
      },
    ];

    const warnings: WarningItem[] = [];
    if (!trig.isTanDefined) {
      warnings.push({
        text: `正切函数退化警告：当前 α = ${alphaDeg}° (cos α = 0)，正切线不存在，tan α 无意义！`,
        level: "warning",
      });
    }
    if (!trig.isHomoDefined && identitySubMode === "homogeneous") {
      warnings.push({
        text: "齐次分式分母为零警告：C sin α + D cos α = 0，分式分母为零无意义！",
        level: "danger",
      });
    }

    const reasoningSteps: ReasoningStep[] = [];

    if (identitySubMode === "homogeneous") {
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 齐次分式弦化切",
          detail:
            "分子分母各项均为正弦与余弦的一次齐次式，只要 $\\cos\\alpha \\neq 0$，即可分子分母同除以 $\\cos\\alpha$ 转化为 $\\tan\\alpha$ 的单变量有理分式。",
          latex: `\\frac{A\\sin\\alpha + B\\cos\\alpha}{C\\sin\\alpha + D\\cos\\alpha} = \\frac{A\\tan\\alpha + B}{C\\tan\\alpha + D}`,
          rubric: "采分点：写出分子分母同除以 cosα 弦化切通法（3分）",
        },
        {
          step: 2,
          title: "代入化简 · 转化为正切分式",
          detail: `代入当前参数 $A=${homoA}, B=${homoB}, C=${homoC}, D=${homoD}$，得到含 $\\tan\\alpha$ 的化简式。`,
          latex: `${trig.homoFormulaTex} = ${trig.homoStepTex}`,
          rubric: "采分点：代入参数求出正切代数式（3分）",
        },
        {
          step: 3,
          title: "代值收口 · 求出分式最终值",
          detail: trig.isHomoDefined
            ? `代入 $\\tan(${alphaDeg}^\\circ) = ${tanStr}$，计算得出分式的值为 $${trig.homoVal?.toFixed(3)}$。`
            : "当前分母为 0，分式无意义。",
          latex: trig.isHomoDefined
            ? `${trig.homoFormulaTex} = ${trig.homoVal?.toFixed(3)}`
            : "\\text{无意义 (分母为0)}",
          rubric: "采分点：代入正切值算出数值结果（4分）",
        },
      );
    } else if (identitySubMode === "known_one") {
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 平方联系和差与积",
          detail:
            "已知 $\\sin\\alpha + \\cos\\alpha = S$ 时，两边平方利用 $\\sin^2\\alpha + \\cos^2\\alpha = 1$ 与二倍角公式，即可求出积 $P = \\sin\\alpha\\cos\\alpha$。",
          latex:
            "(\\sin\\alpha + \\cos\\alpha)^2 = 1 + 2\\sin\\alpha\\cos\\alpha = 1 + \\sin 2\\alpha",
          rubric: "采分点：写出和的平方展开式（3分）",
        },
        {
          step: 2,
          title: "代入求解 · 计算乘积 P",
          detail: `当前 $S = \\sin(${alphaDeg}^\\circ) + \\cos(${alphaDeg}^\\circ) = ${trig.sumSC.toFixed(3)}$，代入平方公式求积。`,
          latex: `P = \\sin\\alpha\\cos\\alpha = \\frac{S^2 - 1}{2} = \\frac{(${trig.sumSC.toFixed(3)})^2 - 1}{2} = ${trig.prodSC.toFixed(3)}`,
          rubric: "采分点：代值求出乘积 P（3分）",
        },
        {
          step: 3,
          title: "符号取舍 · 差值开方定符号",
          detail: `由 $(\\sin\\alpha - \\cos\\alpha)^2 = 1 - 2P = 2 - S^2$，当前角 $\\alpha = ${alphaDeg}^\\circ$ 处于第 ${trig.quadrant} 象限，${trig.diffSignReason}。`,
          latex: `D = \\sin\\alpha - \\cos\\alpha = ${trig.diffSC >= 0 ? "" : "-"}\\sqrt{2 - S^2} = ${trig.diffSC.toFixed(3)}`,
          rubric: "采分点：结合象限角判定差值正负号（4分）",
        },
      );
    } else {
      // geometry / pythagorean 基础模式
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 同角三角函数基本关系",
          detail:
            "终边在单位圆上的任意动点坐标满足 $P(\\cos\\alpha, \\sin\\alpha)$，由单位圆方程直接导出同角基本关系。",
          latex:
            "\\sin^2\\alpha + \\cos^2\\alpha = 1, \\quad \\tan\\alpha = \\frac{\\sin\\alpha}{\\cos\\alpha} \\quad (\\cos\\alpha \\neq 0)",
          rubric: "采分点：写出同角基本关系式（3分）",
        },
        {
          step: 2,
          title: "代入数据 · 终边坐标代换",
          detail: `当前角 $\\alpha = ${alphaDeg}^\\circ$ ($${radStr}$)，计算正弦、余弦与正切数值。`,
          latex: `\\sin\\alpha = ${sinStr}, \\quad \\cos\\alpha = ${cosStr}, \\quad \\tan\\alpha = ${tanStr}`,
          rubric: "采分点：代入求出各三角函数值（3分）",
        },
        {
          step: 3,
          title: "求解反思 · 平方和与商数互证",
          detail: `代入验证平方和：$(${sinStr})^2 + (${cosStr})^2 = ${(trig.sinSq + trig.cosSq).toFixed(3)} = 1$；商数 $\\frac{${sinStr}}{${cosStr}} = ${tanStr}$。`,
          latex: `\\sin^2\\alpha + \\cos^2\\alpha = (${sinStr})^2 + (${cosStr})^2 = 1.000`,
          rubric: "采分点：代入验证平方和为1（4分）",
        },
      );
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      reasoningSteps,
      mnemonic:
        "同角关系口诀：平方和为1，商数即正切；知一求二看象限，齐次化切妙用“1”！",
    };
  } else {
    // induction 模式
    let quantities: MathQuantity[] = [];
    let theorems: Theorem[] = [];
    let gaokaoPoints: GaokaoPoint[] = [];
    const warnings: WarningItem[] = [];

    if (inductionSubMode === "standard6") {
      quantities = [
        {
          label: "原角 α",
          symbol: "\\alpha",
          value: `${alphaDeg}°`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "变换角 β",
          symbol: ind.formulaTex,
          value: `${ind.betaDeg}°`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "几何变换关系",
          symbol: "P \\to P'",
          value: ind.symmetryName,
          color: MATH_COLORS.primary,
        },
        {
          label: "奇偶性与名变换",
          symbol: `k = ${ind.kValue}`,
          value: ind.nameChangeDesc,
          color: ind.isOdd
            ? MATH_COLORS.paramPrimary
            : MATH_COLORS.paramTertiary,
        },
        {
          label: "象限符号分析",
          symbol: "\\text{符号判定}",
          value: ind.signDesc,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "正弦变换值",
          symbol: ind.sinFormulaTex,
          value: `sin β = ${ind.sinBeta.toFixed(3)}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "余弦变换值",
          symbol: ind.cosFormulaTex,
          value: `cos β = ${ind.cosBeta.toFixed(3)}`,
          color: MATH_COLORS.paramSecondary,
        },
      ];

      theorems = [
        {
          name: `诱导公式（${ind.formulaTitle}）`,
          latex: `${ind.sinFormulaTex}, \\quad ${ind.cosFormulaTex}`,
          condition: ind.symmetryName,
          note: `几何本质：终边 OP' 与 OP 的关系为「${ind.symmetryName}」，对应直角三角形全等。`,
          level: "core",
        },
        {
          name: "推导三步法",
          latex: "f(k\\cdot\\frac{\\pi}{2} \\pm \\alpha)",
          condition: "标准思维链",
          note: `${ind.step1Name} ➔ ${ind.step2Sign} ➔ ${ind.step3Verify}`,
          level: "important",
        },
      ];
    } else if (inductionSubMode === "universal_k") {
      quantities = [
        {
          label: "参数设置",
          symbol: "k, \\pm",
          value: `k=${univInd.kValue}, 符号=${universalSign > 0 ? "+α" : "-α"}`,
          color: MATH_COLORS.primary,
        },
        {
          label: "变换角 β",
          symbol: univInd.formulaTex,
          value: `${univInd.betaDeg}°`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "第一步：看名 (奇偶)",
          symbol: univInd.isOdd ? "\\text{奇数 (变)}" : "\\text{偶数 (不变)}",
          value: univInd.step1Name,
          color: univInd.isOdd
            ? MATH_COLORS.paramPrimary
            : MATH_COLORS.paramTertiary,
        },
        {
          label: "第二步：看号 (象限)",
          symbol: "\\text{锐角假定}",
          value: univInd.step2Sign,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "第三步：化简恒等式",
          symbol: univInd.sinFormulaTex,
          value: `sin β = ${univInd.sinBeta.toFixed(3)}`,
          color: MATH_COLORS.paramPrimary,
        },
      ];

      theorems = [
        {
          name: "万能诱导法则口诀解析",
          latex:
            "f\\left(k\\cdot\\frac{\\pi}{2} \\pm \\alpha\\right) = \\pm g(\\alpha)",
          condition: "$k \\in \\mathbb{Z}$",
          note: "奇变偶不变（k 为奇数时正余弦互换，偶数时函数名保持不变）；符号看象限（把 α 视作锐角，观察变换角落在第几象限，取原函数在该象限的正负符号）。",
          level: "core",
        },
      ];
    } else {
      // complementary
      quantities = [
        {
          label: "动角 α 与基准偏移 θ",
          symbol: "\\alpha, \\theta",
          value: `α = ${alphaDeg}°, θ = ${thetaDeg}°`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "配对角 1：α + θ",
          symbol: "\\angle 1",
          value: `${comp.angle1Deg}°`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "配对角 2：π/2 - (α+θ)",
          symbol: "\\angle 2",
          value: `${comp.angle2Deg}°`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "两角和关系",
          symbol: "\\angle 1 + \\angle 2",
          value: `${comp.angle1Deg + comp.angle2Deg}° = 90° (互余)`,
          color: MATH_COLORS.primary,
        },
      ];

      theorems = [
        {
          name: "新高考互余配角模型",
          latex: comp.formulaLatex,
          condition:
            "(\\alpha + \\theta) + [\\frac{\\pi}{2} - (\\alpha + \\theta)] = \\frac{\\pi}{2}",
          note: comp.explanation,
          level: "core",
        },
        {
          name: "高考配角思维要诀",
          latex:
            "\\alpha = (\\alpha + \\beta) - \\beta, \\quad 2\\alpha = (\\alpha + \\beta) + (\\alpha - \\beta)",
          condition: "拆角、拼角、配凑角",
          note: "面对复杂角时，先找已知角与所求角的和、差、互余、互补关系，切忌盲目展开！",
          level: "important",
        },
      ];
    }

    gaokaoPoints = [
      {
        text: "高考考点1：大角化小角、负角化正角、任意角化锐角",
        importance: "gaokao",
      },
      {
        text: "高考考点2：互余/互补配角秒杀 —— sin(π/2-θ)=cosθ, cos(π-θ)=-cosθ",
        importance: "gaokao",
      },
      {
        text: "高考考点3：诱导公式与周期性 (2kπ) 及对称性的综合应用",
        importance: "gaokao",
      },
    ];

    if (ind.tanBeta === undefined && inductionSubMode === "standard6") {
      warnings.push({
        text: `变换角正切无意义：当前变换角 β = ${ind.betaDeg}°，cos β = 0，tan β 无意义！`,
        level: "warning",
      });
    }

    const reasoningSteps: ReasoningStep[] = [];

    if (inductionSubMode === "standard6") {
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 奇变偶不变",
          detail: `当前变换式为 ${ind.formulaTitle}。角可表示为 $k\\cdot\\frac{\\pi}{2} \\pm \\alpha$，其中 $k = ${ind.kValue}$ 为${ind.isOdd ? "奇数" : "偶数"}，${ind.nameChangeDesc}。`,
          latex: `k = ${ind.kValue} \\implies ${ind.isOdd ? "\\text{奇变 (正余互换)}" : "\\text{偶不变 (函数名保持)}"}`,
          rubric: "采分点：判定 k 的奇偶并确定函数名是否互换（3分）",
        },
        {
          step: 2,
          title: "符号判定 · 符号看象限",
          detail: ind.step2Sign,
          latex: `\\alpha \\in \\left(0, \\frac{\\pi}{2}\\right) \\implies \\beta = ${ind.formulaTex} \\in \\text{${ind.assumedQuadrant.includes("Ⅱ") ? "第Ⅱ象限" : ind.assumedQuadrant.includes("Ⅲ") ? "第Ⅲ象限" : ind.assumedQuadrant.includes("Ⅳ") ? "第Ⅳ象限" : "第Ⅰ象限"}}`,
          rubric: "采分点：视 α 为锐角判定原函数所在象限的正负号（3分）",
        },
        {
          step: 3,
          title: "几何验算 · 动点坐标变换",
          detail: ind.step3Verify,
          latex: `${ind.sinFormulaTex}, \\quad ${ind.cosFormulaTex}`,
          rubric: "采分点：写出诱导公式并与单位圆动点变换对应（4分）",
        },
      );
    } else if (inductionSubMode === "complementary") {
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 观察配角关系",
          detail: `两角和 $(\\alpha + \\theta) + [\\frac{\\pi}{2} - (\\alpha + \\theta)] = \\frac{\\pi}{2}$，构成经典的互余配角结构。`,
          latex: `(\\alpha + \\theta) + \\left[\\frac{\\pi}{2} - (\\alpha + \\theta)\\right] = \\frac{\\pi}{2}`,
          rubric: "采分点：写出两角互余恒等式（3分）",
        },
        {
          step: 2,
          title: "建模转化 · 互余函数正余对调",
          detail:
            "利用诱导公式一，互余两角中一个角的余弦恒等于另一个角的正弦。",
          latex: `\\cos\\left[\\frac{\\pi}{2} - (\\alpha + \\theta)\\right] = \\sin(\\alpha + \\theta)`,
          rubric: "采分点：应用互余公式正余对调（3分）",
        },
        {
          step: 3,
          title: "代值收口 · 具体角度数值验证",
          detail: `当前 $\\alpha = ${alphaDeg}^\\circ, \\theta = ${thetaDeg}^\\circ$，两角分别为 ${comp.angle1Deg}^\\circ$ 与 ${comp.angle2Deg}^\\circ$。`,
          latex: `\\cos(${comp.angle2Deg}^\\circ) = \\sin(${comp.angle1Deg}^\\circ) = ${Math.sin((comp.angle1Deg * Math.PI) / 180).toFixed(3)}`,
          rubric: "采分点：代入数值验证等式成立（4分）",
        },
      );
    } else {
      // universal
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 万能诱导参数化",
          detail: `考察 $k\\cdot\\frac{\\pi}{2} ${universalSign === 1 ? "+" : "-"} \\alpha$，当前 $k = ${universalK}$。`,
          latex: univInd.formulaTex,
          rubric: "采分点：写出 k·π/2 ± α 标准形式（3分）",
        },
        {
          step: 2,
          title: "定名定号 · 奇变偶不变与看象限",
          detail: `${univInd.nameChangeDesc}；${univInd.assumedQuadrant}。`,
          latex: `${univInd.isOdd ? "\\sin \\leftrightarrow \\cos" : "\\text{函数名不变}"}, \\quad \\text{符号根据原函数象限确定}`,
          rubric: "采分点：判断奇偶换名与象限符号（3分）",
        },
        {
          step: 3,
          title: "化简结论 · 写出全部对应式",
          detail: "由上述规则化简得出正弦、余弦与正切的诱导公式。",
          latex: `${univInd.sinFormulaTex}, \\quad ${univInd.cosFormulaTex}`,
          rubric: "采分点：得出化简结论（4分）",
        },
      );
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      reasoningSteps,
      mnemonic:
        "诱导公式总口诀：奇变偶不变，符号看象限！（把 α 看作第一象限锐角判断原函数符号）",
    };
  }
}
