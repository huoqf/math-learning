import type { MathPanelData } from "../types";
import { solveConstantDouble } from "@/math/constant";
import { MATH_COLORS } from "@/theme";

export function buildConstantDoublePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const selectedLogic =
    (config?.selectedLogic as
      "all_all" | "all_exist" | "exist_all" | "exist_exist" | "same_var") ||
    "all_all";
  const yf = params.yf ?? 2.5;
  const xf = params.xf ?? 1.25;
  const yg = params.yg ?? 1.5;
  const xg = params.xg ?? 2.25;
  const mf = 0.5,
    nf = 2.0;
  const mg = 1.5,
    ng = 3.0;
  const res = solveConstantDouble(
    yf,
    xf,
    mf,
    nf,
    yg,
    xg,
    mg,
    ng,
    selectedLogic,
  );

  const quantities: MathPanelData["quantities"] =
    selectedLogic === "same_var"
      ? [
          {
            label: "同自变量恒成立状态",
            value: res.isSameVarTrue
              ? "满足 (h(x) ≥ 0)"
              : "违背 (存在 h(x) < 0)",
            highlight: res.isSameVarTrue ? "extreme" : "negative",
          },
          { label: "作用域公共交集", value: "x ∈ [1.50, 2.00]" },
          {
            label: "差函数最小差值",
            symbol: "h_min",
            value: res.sameVarMinDiff ?? 0,
            color: MATH_COLORS.inequality,
          },
          {
            label: "最危险临界位置",
            symbol: "x_min",
            value: res.sameVarXMin ?? 0,
          },
        ]
      : [
          {
            label: "所选博弈成立状态",
            value: res.isCurrentLogicTrue
              ? "满足 (博弈成功)"
              : "违背 (博弈失败)",
            highlight: res.isCurrentLogicTrue ? "extreme" : "negative",
          },
          {
            label: "f(x) 最小值",
            symbol: "f_min",
            value: res.fMin,
            color: MATH_COLORS.function,
          },
          {
            label: "f(x) 最大值",
            symbol: "f_max",
            value: res.fMax,
            color: MATH_COLORS.function,
          },
          {
            label: "g(x) 最大值",
            symbol: "g_max",
            value: res.gMax,
            color: MATH_COLORS.functionSecondary,
          },
          {
            label: "g(x) 最小值",
            symbol: "g_min",
            value: res.gMin,
            color: MATH_COLORS.functionSecondary,
          },
        ];

  // 动态根据所选逻辑置顶核心定理
  let coreTheorem = {
    name: "高考双动点不等式 · 极值完全隔离",
    latex: `\\forall x_1 \\in I_1, \\forall x_2 \\in I_2, \\; f(x_1) \\ge g(x_2) \\iff f(x)_{\\min} \\ge g(x)_{\\max}`,
    level: "core" as const,
    prerequisites: ["x₁ 与 x₂ 分别在各自区间内独立自由滑动，无任何绑定约束"],
  };

  if (selectedLogic === "all_exist") {
    coreTheorem = {
      name: "高考双动点不等式 · 极小保底支撑",
      latex: `\\forall x_1 \\in I_1, \\exists x_2 \\in I_2, \\; f(x_1) \\ge g(x_2) \\iff f(x)_{\\min} \\ge g(x)_{\\min}`,
      level: "core",
      prerequisites: [
        "对每一个 f(x₁)，只需能找到一个比它小的 g(x₂)，故仅需 f 最小值高于 g 最小值",
      ],
    };
  } else if (selectedLogic === "exist_all") {
    coreTheorem = {
      name: "高考双动点不等式 · 极大顶峰压制",
      latex: `\\exists x_1 \\in I_1, \\forall x_2 \\in I_2, \\; f(x_1) \\ge g(x_2) \\iff f(x)_{\\max} \\ge g(x)_{\\max}`,
      level: "core",
      prerequisites: [
        "只需存在一个 f(x₁) 能压住所有 g(x₂)，故仅需 f 最大值高于 g 最大值",
      ],
    };
  } else if (selectedLogic === "exist_exist") {
    coreTheorem = {
      name: "高考双动点不等式 · 门槛局部超越",
      latex: `\\exists x_1 \\in I_1, \\exists x_2 \\in I_2, \\; f(x_1) \\ge g(x_2) \\iff f(x)_{\\max} \\ge g(x)_{\\min}`,
      level: "core",
      prerequisites: [
        "只要 f 的峰顶高于 g 的谷底，即可找到满足条件的一组 (x₁, x₂)",
      ],
    };
  } else if (selectedLogic === "same_var") {
    coreTheorem = {
      name: "同自变量恒成立 · 差函数法",
      latex: `\\forall x \\in I_1 \\cap I_2, \\; f(x) \\ge g(x) \\iff h(x) = f(x) - g(x) \\ge 0 \\iff h(x)_{\\min} \\ge 0`,
      level: "core",
      prerequisites: [
        "自变量 x 为同一动点，仅在两定义域公共交集 I₁ ∩ I₂ 上考察",
      ],
    };
  }

  const theorems: MathPanelData["theorems"] =
    selectedLogic === "same_var"
      ? [
          coreTheorem,
          {
            name: "差函数 h(x) 的解析式与极值位置",
            latex: `h(x) = 2x^2 - 2(x_f + x_g)x + (x_f^2 + y_f + x_g^2 - y_g), \\quad x_{\\text{sym}} = \\frac{x_f + x_g}{2}`,
            level: "important",
            prerequisites: ["根据对称轴与区间 [1.5, 2.0] 位置关系求最值"],
          },
        ]
      : [
          coreTheorem,
          {
            name: "双动点不等式四大博弈全景矩阵",
            latex: `\\begin{aligned} 
              \\forall x_1, \\forall x_2: \\; & f(x_1) \\ge g(x_2) \\iff f_{\\min} \\ge g_{\\max} \\\\ 
              \\forall x_1, \\exists x_2: \\; & f(x_1) \\ge g(x_2) \\iff f_{\\min} \\ge g_{\\min} \\\\ 
              \\exists x_1, \\forall x_2: \\; & f(x_1) \\ge g(x_2) \\iff f_{\\max} \\ge g_{\\max} \\\\ 
              \\exists x_1, \\exists x_2: \\; & f(x_1) \\ge g(x_2) \\iff f_{\\max} \\ge g_{\\min} 
            \\end{aligned}`,
            level: "important",
            prerequisites: [
              "牢记：'任意'关注最弱项（求最值），'存在'关注最强项",
            ],
          },
          {
            name: "高考拓展 · 双动点等式值域模型",
            latex: `\\begin{aligned}
              \\forall x_1, \\exists x_2, f(x_1) = g(x_2) &\\iff \\text{Range}(f) \\subseteq \\text{Range}(g) \\\\
              \\exists x_1, \\exists x_2, f(x_1) = g(x_2) &\\iff \\text{Range}(f) \\cap \\text{Range}(g) \\neq \\emptyset
            \\end{aligned}`,
            level: "supplementary",
            prerequisites: [
              "此为值域包含/相交问题，与不等式博弈有明确数学区分",
            ],
          },
        ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] =
    selectedLogic === "same_var"
      ? [
          {
            text: "同自变量恒成立必用【差函数法】：当自变量 x 限制在重合区间且为同一个动点时，严禁拆成 f_min ≥ g_max，只需构造 h(x) = f(x) - g(x) 并求 h(x)_min ≥ 0。",
            importance: "gaokao",
          },
          {
            text: "易错点辨析：同自变量成立并不需要 f(x) 的最低点高于 g(x) 的最高点，两曲线可以有高低重叠，只需在相同 x 处 f 图象始终在 g 图象上方即可。",
            importance: "core",
          },
        ]
      : [
          {
            text: "双自变量极值隔离法则：当 x₁ 与 x₂ 分别在独立区间内自由变动时，不等式转化为两函数各自最值的比较。∀x₁, ∀x₂ 要求 f 的最小值必须压制 g 的最大值。",
            importance: "gaokao",
          },
          {
            text: "量词转化口诀：'任意对任意'看极限隔绝 (min ≥ max)；'任意对存在'看保底支撑 (min ≥ min)；'存在对任意'看顶峰突围 (max ≥ max)；'存在对存在'看门槛跨越 (max ≥ min)。",
            importance: "core",
          },
          {
            text: "题型辨析防混淆：不等式问题比较最值大小；等式问题（如 f(x₁) = g(x₂)）转化为值域包含（子集）或值域交集非空。",
            importance: "gaokao",
          },
        ];

  const warnings: MathPanelData["warnings"] = [];
  if (selectedLogic === "same_var") {
    if (!res.isSameVarTrue) {
      warnings.push({
        text: `同变量恒成立不满足！在最危险位置 x = ${res.sameVarXMin?.toFixed(2)} 处，差值 h(x) = ${res.sameVarMinDiff?.toFixed(2)} (< 0)。`,
        level: "warning",
      });
    }
  } else {
    if (!res.isCurrentLogicTrue) {
      warnings.push({
        text: `当前博弈条件不满足！对比点高度 ${res.battlePointF.y.toFixed(2)} 未能满足 ≥ ${res.battlePointG.y.toFixed(2)}。`,
        level: "warning",
      });
    }
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      selectedLogic === "same_var"
        ? "同变量差函数，作差求最值；双动点各为政，量词定极值。"
        : "任意任意隔绝开 (min≥max)，任意存在保底线 (min≥min)，存在任意冲顶峰 (max≥max)，存在存在越门槛 (max≥min)。",
  };
}
