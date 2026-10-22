import type { MathPanelData } from "../types";
import { analyzeSubsetHierarchy, calculateSetMathState } from "@/math/set";
import { MATH_COLORS } from "@/theme";

export function buildSetPanel(
  params: Record<string, number>,
  config?: { animId?: string },
): MathPanelData {
  const isSubset = config?.animId === "anim-set-subset";
  const isLogicConditions = !isSubset && config?.animId !== "anim-set-venn";
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

  if (isSubset) {
    return buildSubsetPanel(xA, yA, rA, xB, yB, rB);
  }

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

  const theorems: MathPanelData["theorems"] = isLogicConditions
    ? [
        {
          name: "充分条件与必要条件包含判定定理",
          latex:
            "p: x \\in A, \\quad q: x \\in B, \\quad p \\implies q \\iff A \\subseteq B",
          level: "core",
          prerequisites: ["$A$ 与 $B$ 为命题对应的解集或真值集"],
        },
        {
          name: "充要条件与集合相等定理",
          latex:
            "p \\iff q \\iff A = B \\quad (A \\subseteq B \\text{ 且 } B \\subseteq A)",
          level: "core",
          prerequisites: ["两条件互为充要条件等价于两解集恒等"],
        },
        {
          name: "逆否命题等价判定原理",
          latex: "p \\implies q \\iff \\neg q \\implies \\neg p",
          level: "important",
          prerequisites: ["正难则反：原命题与逆否命题同真同假"],
        },
      ]
    : [
        {
          name: "集合的基本运算与 Venn 图",
          latex:
            "A \\cap B = \\{x \\mid x \\in A \\land x \\in B\\}, \\quad A \\cup B = \\{x \\mid x \\in A \\lor x \\in B\\}",
          level: "core",
          prerequisites: ["全集 U 存在"],
        },
        {
          name: "集合容斥原理 (Inclusion-Exclusion)",
          latex: "|A \\cup B| = |A| + |B| - |A \\cap B|",
          level: "important",
          prerequisites: ["有限集或连续测度测算"],
        },
        {
          name: "摩根定律 (De Morgan's Laws)",
          latex:
            "\\complement_U (A \\cup B) = \\complement_U A \\cap \\complement_U B, \\quad \\complement_U (A \\cap B) = \\complement_U A \\cup \\complement_U B",
          level: "important",
          prerequisites: ["全集 U 正确限定"],
        },
      ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = isLogicConditions
    ? [
        {
          text: "充分条件与必要条件四步判定法：① 明确条件 p 与结论 q；② 建立集合 A={x|p} 与 B={x|q}；③ 观察 Venn 图包含关系 (A ⊆ B 还是 B ⊆ A)；④ 写出充要判定结论。",
          importance: "gaokao",
        },
        {
          text: "小范围推大范围核心通则：若 A ⫋ B，则 p 是 q 的充分不必要条件；若 B ⫋ A，则 p 是 q 的必要不充分条件。",
          importance: "gaokao",
        },
        {
          text: "空集端点陷阱：空集 ∅ 是一切集合的子集。当含参条件方程无解（解集为 ∅）时，包含关系仍恒成立，切勿漏解！",
          importance: "core",
        },
      ]
    : [
        {
          text: "高考一轮基础：集合元素的确定性、互异性、无序性。做题时谨防互异性检验与空集 ∅ 扣分陷阱。",
          importance: "gaokao",
        },
        {
          text: "交集、并集与补集运算：数轴交并补适用于不等式连续区间；Venn 图适用于有限集离散元素或抽象集合关系。",
          importance: "gaokao",
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
    mnemonic: isLogicConditions
      ? "小范围推大范围，包含即充分；两集合相等，充要无争议；逆否同真假，否命莫混淆。"
      : "交集找公共，并集全并拢；补集全集扣，空集处处有；互异莫忘记，端点细核准。",
  };
}

/* ────────────────────────────────────────────────────────────────
 * 子集与真子集层级（anim-set-subset）
 * 落点是「⊆ 与 ⊊ 只差一个等号」这一层，以及两个高频陷阱：
 *   ① 空集是任何集合的子集，也是任何非空集合的真子集；
 *   ② 外切时交集是单点而非空集，不能与相离混为一谈。
 * ──────────────────────────────────────────────────────────────── */
function buildSubsetPanel(
  xA: number,
  yA: number,
  rA: number,
  xB: number,
  yB: number,
  rB: number,
): MathPanelData {
  const sub = analyzeSubsetHierarchy(
    { x: xA, y: yA, r: rA },
    { x: xB, y: yB, r: rB },
  );
  const sumR = rA + rB;
  const diffR = Math.abs(rA - rB);

  const relationName =
    sub.relationKind === "equal"
      ? "A = B（互相包含）"
      : sub.relationKind === "a_proper_subset_b"
        ? "A ⊊ B（A 是 B 的真子集）"
        : sub.relationKind === "b_proper_subset_a"
          ? "B ⊊ A（B 是 A 的真子集）"
          : sub.relationKind === "tangent_external"
            ? "外切（交集为单点，互不包含）"
            : sub.relationKind === "overlap"
              ? "相交（互不包含）"
              : "相离（交集为空集）";

  const quantities: MathPanelData["quantities"] = [
    {
      label: "圆心距 $d$",
      symbol: "d",
      value: sub.distance.toFixed(2),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "包含判据阈值 $r_A + r_B$ 与 $|r_A - r_B|$",
      symbol: "r_A+r_B,\\;|r_A-r_B|",
      value: `${sumR.toFixed(2)} 与 ${diffR.toFixed(2)}`,
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "$A \\subseteq B$ 是否成立",
      symbol: "\\subseteq",
      value: sub.aSubsetB ? "成立" : "不成立",
      color: sub.aSubsetB ? MATH_COLORS.paramPrimary : MATH_COLORS.labelText,
      highlight: sub.aSubsetB ? "positive" : "negative",
    },
    {
      label: "$A \\subsetneq B$（真子集）是否成立",
      symbol: "\\subsetneq",
      value: sub.aProperSubsetB ? "成立" : "不成立",
      color: sub.aProperSubsetB
        ? MATH_COLORS.paramPrimary
        : MATH_COLORS.labelText,
    },
    {
      label: "$B \\subseteq A$ 与 $B \\subsetneq A$",
      symbol: "B \\subseteq A",
      value: `${sub.bSubsetA ? "成立" : "不成立"} / ${sub.bProperSubsetA ? "成立" : "不成立"}`,
      color: sub.bSubsetA ? MATH_COLORS.paramSecondary : MATH_COLORS.labelText,
    },
    {
      label: "$A \\cap B$ 是否为空集",
      symbol: "A \\cap B",
      value: sub.isIntersectionEmpty
        ? "是，交集为 ∅"
        : sub.relationKind === "tangent_external"
          ? "否，交集恰为单点"
          : "否，交集非空",
      color: sub.isIntersectionEmpty
        ? MATH_COLORS.labelText
        : MATH_COLORS.accent,
    },
    {
      label: "层级定位",
      value: relationName,
      color: MATH_COLORS.highlight,
      highlight: "extreme",
    },
  ];

  const theorems: MathPanelData["theorems"] = [
    {
      name: "子集的定义与证明格式",
      latex:
        "\\forall x\\,\\big(x \\in A \\implies x \\in B\\big) \\quad\\Longrightarrow\\quad A \\subseteq B",
      level: "core",
      note: "定义：A 中每个元素都属于 B 时称 A 是 B 的子集。证明时正是从「任取 x ∈ A」出发推「x ∈ B」，单向推完即可，不需要反向",
    },
    {
      name: "真子集的定义（⊆ 再加一个「不等于」）",
      latex: "A \\subsetneq B \\;:\\quad A \\subseteq B \\;\\land\\; A \\ne B",
      level: "core",
      note: "等价说法：A ⊆ B，并且 B 中至少存在一个不属于 A 的元素。这一步是证真子集时必须补的第二问，漏了就只能得子集",
    },
    {
      name: "空集的包含地位",
      latex:
        "\\varnothing \\subseteq A \\;\\text{（对任意集合 } A \\text{）}, \\qquad \\varnothing \\subsetneq A \\;\\text{（当 } A \\ne \\varnothing \\text{）}",
      level: "core",
      note: "含参问题解集为 ∅ 时，包含关系仍然成立，漏掉空集是最高频扣分点",
    },
    {
      name: "有限集的子集计数",
      latex:
        "|A| = n \\implies \\text{子集 } 2^n \\text{ 个},\\; \\text{真子集 } 2^n - 1 \\text{ 个},\\; \\text{非空真子集 } 2^n - 2 \\text{ 个}",
      level: "important",
      note: "该公式只对有限集成立；本页的圆盘是无限集，不能用 $2^n$ 数个数",
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "端点等号取舍：$A \\subseteq B$ 的几何判据是 $d + r_A \\le r_B$，等号对应内切，此时 $A \\subsetneq B$ 仍然成立；而 $d = r_A + r_B$ 是外切，交集为单点，非空。",
      importance: "gaokao",
    },
    {
      text: "空集陷阱：任何含参集合问题，先单独讨论「解集为 $\\varnothing$」的情形。$\\varnothing \\subseteq A$ 恒成立，也恒为任何非空集合的真子集。",
      importance: "gaokao",
    },
    {
      text: "证真子集的标准两步：① 任取 $x \\in A$ 证 $x \\in B$（得 $A \\subseteq B$）；② 举出一个 $y \\in B$ 而 $y \\notin A$（得 $A \\ne B$）。缺第②步只能得子集，不能得真子集。",
      importance: "gaokao",
    },
  ];

  const warnings: MathPanelData["warnings"] = [];
  if (sub.relationKind === "tangent_external") {
    warnings.push({
      text: "两集合外切：$A \\cap B = \\{M\\}$ 恰含一个切点，交集非空，切勿写成 $A \\cap B = \\varnothing$。",
      level: "warning",
    });
  }
  if (rA === 0 || rB === 0) {
    warnings.push({
      text:
        rA === 0 && rB === 0
          ? "两集合均为空集：$A = B = \\varnothing$，互相包含且相等，不构成真包含。"
          : "有一个集合半径已退化为 0，即为空集 $\\varnothing$：它对任何集合都是子集，对非空集合还是真子集。",
      level: "info",
    });
  }

  const reasoningSteps: MathPanelData["reasoningSteps"] = [
    {
      step: 1,
      title: "先用圆心距把两集合的位置关系定下来",
      detail: `$d = ${sub.distance.toFixed(2)}$，$r_A + r_B = ${sumR.toFixed(2)}$，$|r_A - r_B| = ${diffR.toFixed(2)}$：后者是判断「谁包含谁」的分界，前者是判断「是否相离 / 外切」的分界`,
      latex: `d = ${sub.distance.toFixed(2)},\\quad r_A + r_B = ${sumR.toFixed(2)},\\quad |r_A - r_B| = ${diffR.toFixed(2)}`,
    },
    {
      step: 2,
      title: "判 $A \\subseteq B$：A 里不能有 B 之外的点",
      detail: sub.aSubsetB
        ? `$d + r_A = ${(sub.distance + rA).toFixed(2)} \\le r_B = ${rB.toFixed(2)}$，A 整体落在 B 内部，故 $A \\subseteq B$`
        : `$d + r_A = ${(sub.distance + rA).toFixed(2)} > r_B = ${rB.toFixed(2)}$，A 中有点跑到 B 外面，故 $A \\not\\subseteq B$`,
      latex: sub.aSubsetB
        ? `d + r_A \\le r_B \\iff ${(sub.distance + rA).toFixed(2)} \\le ${rB.toFixed(2)} \\implies A \\subseteq B`
        : `d + r_A > r_B \\iff ${(sub.distance + rA).toFixed(2)} > ${rB.toFixed(2)} \\implies A \\not\\subseteq B`,
    },
    {
      step: 3,
      title: "在 ⊆ 之上再判等号，决定 ⊆ 还是 ⊊",
      detail: sub.equalityHolds
        ? "两集合完全重合，等号成立，因此只有 $A \\subseteq B$ 与 $B \\subseteq A$，不存在真子集"
        : sub.aProperSubsetB || sub.bProperSubsetA
          ? "包含关系成立但两集合不相等（小圆的边界到不了大圆外沿），等号不成立，故为真子集 $\\subsetneq$"
          : "包含关系本身不成立，等号无从谈起，两个方向都不是子集",
      latex: sub.equalityHolds
        ? `A = B \\implies A \\subseteq B \\land B \\subseteq A \\;\\text{（不是真子集）}`
        : sub.aProperSubsetB
          ? `A \\subseteq B \\land A \\ne B \\implies A \\subsetneq B`
          : sub.bProperSubsetA
            ? `B \\subseteq A \\land B \\ne A \\implies B \\subsetneq A`
            : `A \\not\\subseteq B \\land B \\not\\subseteq A`,
      rubric:
        "【高考采分点】写出 $A \\subseteq B$ 后再补「存在 $x \\in B, x \\notin A$」才能落真子集",
    },
  ];

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic:
      "先证包含再挑刺，两集合相等，包含不叫真；空集最谦卑，处处可安身。",
  };
}
