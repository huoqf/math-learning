import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import {
  calculateTrigIdentity,
  calculateInduction,
  type FormulaType,
} from "@/features/trigIdentity/math/trigIdentity";

export function buildTrigIdentityPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const alphaDeg = params.alphaDeg ?? 30;
  const homoA = params.homoA ?? 1;
  const homoB = params.homoB ?? 1;

  const studyMode =
    (config?.studyMode as "identity" | "induction") ?? "identity";
  const formulaType = (config?.formulaType as FormulaType) ?? "pi_plus";

  const trig = calculateTrigIdentity(alphaDeg, homoA, homoB);
  const ind = calculateInduction(alphaDeg, formulaType);

  const radStr = `${(trig.alphaRad / Math.PI).toFixed(2)}\\pi`;
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
        value: `${alphaDeg}° (${radStr})`,
        color: "#EF4444",
      },
      {
        label: "正弦与余弦值",
        symbol: "\\sin\\alpha, \\cos\\alpha",
        value: `sin=${sinStr}, cos=${cosStr}`,
        color: "#EF4444",
      },
      {
        label: "正切值",
        symbol: "\\tan\\alpha = \\frac{\\sin\\alpha}{\\cos\\alpha}",
        value: tanStr,
        color: "#059669",
        highlight: !trig.isTanDefined ? "extreme" : undefined,
      },
      {
        label: "平方关系验证",
        symbol: "\\sin^2\\alpha + \\cos^2\\alpha",
        value: `${trig.sinSq.toFixed(3)} + ${trig.cosSq.toFixed(3)} = ${trig.sqSum.toFixed(3)}`,
        color: "#3B82F6",
      },
      {
        label: "知一求二和与积",
        symbol: "(\\sin\\alpha + \\cos\\alpha)^2",
        value: `S=${trig.sumSC.toFixed(3)}, P=${trig.prodSC.toFixed(3)} (S²=1+2P=${trig.sumSqVerif.toFixed(3)})`,
        color: "#D97706",
      },
      {
        label: "齐次式化切求值",
        symbol: trig.homoFormulaTex,
        value:
          trig.isHomoDefined && trig.homoVal !== undefined
            ? trig.homoVal.toFixed(3)
            : "分母为零无意义",
        color: "#059669",
        highlight: !trig.isHomoDefined ? "extreme" : undefined,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "同角平方关系 (单位圆勾股定理)",
        latex: "\\sin^2\\alpha + \\cos^2\\alpha = 1",
        condition: "$任意实数 \\alpha \\in \\mathbb{R}$",
        note: "直观几何解释：单位圆上动点 $P(\\cos\\alpha, \\sin\\alpha)$ 到原点距离 $OP^2 = x^2 + y^2 = 1$。",
        level: "core",
      },
      {
        name: "同角商数关系",
        latex: "\\tan\\alpha = \\frac{\\sin\\alpha}{\\cos\\alpha}",
        condition:
          "$\\alpha \\neq k\\pi + \\frac{\\pi}{2} \\quad (k \\in \\mathbb{Z})$",
        note: "直观几何解释：过点 $A(1,0)$ 作 $x$ 轴切线与终边交于 $T(1, \\tan\\alpha)$，由相似三角形得正切比值。",
        level: "core",
      },
      {
        name: "知一求二公式变形",
        latex:
          "(\\sin\\alpha \\pm \\cos\\alpha)^2 = 1 \\pm 2\\sin\\alpha\\cos\\alpha = 1 \\pm \\sin 2\\alpha",
        condition: "已知 sinα±cosα 或 sinα·cosα 相互转换",
        note: "注意：开方时必须结合象限符号决定正负 sign(sinα ± cosα)！",
        level: "important",
      },
      {
        name: "高考齐次式“化切”技巧",
        latex:
          "\\frac{A\\sin\\alpha + B\\cos\\alpha}{C\\sin\\alpha + D\\cos\\alpha} = \\frac{A\\tan\\alpha + B}{C\\tan\\alpha + D}",
        condition:
          "分子分母同除以 cosα (二次齐次式除以 cos²α，其中 1 = sin²α + cos²α)",
        note: "彻底消除弦函数，将已知 tanα 直接代入，属于高考选择填空秒杀题型。",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "高考考点1：给值求值 —— 已知 tanα，求齐次分式或 1/(sinα·cosα) 的值",
        importance: "gaokao",
      },
      {
        text: "高考考点2：知一求二 —— 已知 sinα+cosα=k，利用平方关系求 sinα·cosα 与 sinα-cosα",
        importance: "gaokao",
      },
      {
        text: "高考考点3：“1”的巧用 —— 在式子中将 1 替换为 sin²α + cos²α 创造齐次条件",
        importance: "hard",
      },
    ];

    const warnings: WarningItem[] = [];
    if (!trig.isTanDefined) {
      warnings.push({
        text: `正切函数退化警告：当前 α = ${alphaDeg}° (cos α = 0)，正切线与正切值 tan α 无意义！`,
        level: "warning",
      });
    }
    if (!trig.isHomoDefined) {
      warnings.push({
        text: "齐次分式分母为零警告：sin α + cos α = 0，齐次分式分母为零无意义！",
        level: "danger",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic:
        "同角关系牢记心：平方和为1，商数即正切。齐次同除cos，知一平方可求二！",
    };
  } else {
    // induction 模式
    const quantities: MathQuantity[] = [
      {
        label: "原角 α",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: "#EF4444",
      },
      {
        label: "变换角 β",
        symbol: ind.formulaTex,
        value: `${ind.betaDeg}°`,
        color: "#D97706",
      },
      {
        label: "几何对称关系",
        symbol: "P \\to P'",
        value: ind.symmetryName,
        color: "#3B82F6",
      },
      {
        label: "奇变偶不变判断",
        symbol: `k = ${ind.kValue}`,
        value: ind.nameChangeDesc,
        color: ind.isOdd ? "#EF4444" : "#059669",
      },
      {
        label: "符号看象限判断",
        symbol: "\\text{象限分析}",
        value: ind.signDesc,
        color: "#D97706",
      },
      {
        label: "正弦变换值",
        symbol: ind.sinFormulaTex,
        value: `sin β = ${ind.sinBeta.toFixed(3)}`,
        color: "#EF4444",
      },
      {
        label: "余弦变换值",
        symbol: ind.cosFormulaTex,
        value: `cos β = ${ind.cosBeta.toFixed(3)}`,
        color: "#D97706",
      },
    ];

    const theorems: Theorem[] = [
      {
        name: `诱导公式（${ind.formulaTitle}）`,
        latex: `${ind.sinFormulaTex}, \\quad ${ind.cosFormulaTex}`,
        condition: ind.symmetryName,
        note: `几何直观：终边 OP 与 OP' 呈现${ind.symmetryName}，对应直角三角形全等。`,
        level: "core",
      },
      {
        name: "诱导公式总法则",
        latex: "f\\left(k \\cdot \\frac{\\pi}{2} \\pm \\alpha\\right)",
        condition: "k 为整数",
        note: "奇变偶不变（k 为奇数时 sin↔cos，偶数时不变）；符号看象限（将 α 看作锐角，看原函数在对应象限的正负）。",
        level: "core",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "高考考点1：大角化小角，负角化正角，复杂角化锐角",
        importance: "gaokao",
      },
      {
        text: "高考考点2：互余/互补角关系应用 —— sin(π/2-α)=cosα, cos(π-α)=-cosα",
        importance: "gaokao",
      },
      {
        text: "高考考点3：结合周期性 (α+2kπ) 的三角化简求值",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (ind.tanBeta === undefined) {
      warnings.push({
        text: `变换角正切无意义：当前变换角 β = ${ind.betaDeg}°，cos β = 0，tan β 无意义！`,
        level: "warning",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic:
        "诱导公式口诀：奇变偶不变，符号看象限！（把 α 看做第一象限锐角判断原函数符号）",
    };
  }
}
