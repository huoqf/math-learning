import type { MathPanelData } from "../types";
import { calculateSetMathState } from "@/math/set";
import { MATH_COLORS } from "@/theme";

export function buildSetPanel(params: Record<string, number>): MathPanelData {
  const xA = params.xA ?? -1.2;
  const yA = params.yA ?? 0.0;
  const rA = params.rA ?? 2.2;
  const xB = params.xB ?? 1.2;
  const yB = params.yB ?? 0.0;
  const rB = params.rB ?? 2.2;
  const xP = params.xP ?? 0.0;
  const yP = params.yP ?? 0.0;

  const setRes = calculateSetMathState(
    { x: xA, y: yA, r: rA },
    { x: xB, y: yB, r: rB },
    { x: xP, y: yP },
  );

  const quantities: MathPanelData["quantities"] = [
    {
      label: "圆心距 d(O₠, O₢)",
      symbol: "d",
      value: setRes.distance.toFixed(2),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "集合 A 半径",
      symbol: "rA",
      value: rA.toFixed(2),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "集合 B 半径",
      symbol: "rB",
      value: rB.toFixed(2),
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "测试点 P 归属 A",
      value: setRes.isPointInA ? "P ∈ A" : "P ∉ A",
      color: setRes.isPointInA
        ? MATH_COLORS.paramPrimary
        : MATH_COLORS.labelText,
    },
    {
      label: "测试点 P 归属 B",
      value: setRes.isPointInB ? "P ∈ B" : "P ∉ B",
      color: setRes.isPointInB
        ? MATH_COLORS.paramSecondary
        : MATH_COLORS.labelText,
    },
    {
      label: "充要逻辑判定",
      value:
        setRes.logicType === "sufficient_not_necessary"
          ? "充分不必要条件"
          : setRes.logicType === "necessary_not_sufficient"
            ? "必要不充分条件"
            : setRes.logicType === "sufficient_and_necessary"
              ? "充要条件"
              : "既不充分也不必要",
      highlight:
        setRes.logicType === "sufficient_and_necessary"
          ? "extreme"
          : "positive",
    },
  ];

  const theorems: MathPanelData["theorems"] = [
    {
      name: "集合的基本运算与 Venn 图",
      latex:
        "A \\cap B = \\{x \\mid x \\in A \\land x \\in B\\}, \\quad A \\cup B = \\{x \\mid x \\in A \\lor x \\in B\\}",
      level: "core",
      prerequisites: ["全集 U 存在"],
    },
    {
      name: "充分必要条件与包含关系",
      latex:
        "p: x \\in A, \\quad q: x \\in B, \\quad p \\implies q \\iff A \\subseteq B",
      level: "important",
      prerequisites: ["A 与 B 为非空集合"],
    },
    {
      name: "摩根定律 (De Morgan's Laws)",
      latex:
        "\\complement_U (A \\cup B) = \\complement_U A \\cap \\complement_U B, \\quad \\complement_U (A \\cap B) = \\complement_U A \\cup \\complement_U B",
      level: "important",
      prerequisites: ["全集 U 正确限定"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "高考一轮基础：集合元素的确定性、互异性、无序性。做题时谨防互异性检验与空集 ∅ 扣分陷阱。",
      importance: "gaokao",
    },
    {
      text: "充分条件与必要条件四步判定法：① 明确条件 p 与结论 q；② 建立集合 A={x|p} 与 B={x|q}；③ 观察 Venn 图包含关系 (A ⊆ B 还是 B ⊆ A)；④ 写出充要判定结论。",
      importance: "gaokao",
    },
    {
      text: "全称量词与存在量词否定：否定全称命题\u201C∀x∈A, p(x)\u201D变为存在命题\u201C∃x∈A, ¬p(x)\u201D，改量词变结论，限定集合 A 不改变！",
      importance: "core",
    },
  ];

  const warnings: MathPanelData["warnings"] = [];
  if (setRes.warningMessage) {
    warnings.push({
      text: setRes.warningMessage,
      level: "danger",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "小范围推大范围（A ⊂ B 推出 p 充分）；全称改存在，否定在末尾；空集是子集，互异莫忘记。",
  };
}
