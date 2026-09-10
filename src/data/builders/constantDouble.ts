import type { MathPanelData, ReasoningStep } from "../types";
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

  // 1. f(x) 闭区间代数最值表达式构建 (开口向上，对称轴 x = xf)
  let fMinLatex = "";
  let fMaxLatex = "";
  if (xf >= mf && xf <= nf) {
    fMinLatex = `f_{\\min} &= f(x_f) = y_f = ${res.fMin.toFixed(2)}`;
    const distM = Math.abs(mf - xf);
    const distN = Math.abs(nf - xf);
    const farX = distM >= distN ? mf : nf;
    fMaxLatex = `f_{\\max} &= f(${farX.toFixed(1)}) = (${farX.toFixed(1)} - x_f)^2 + y_f = ${res.fMax.toFixed(2)}`;
  } else if (xf < mf) {
    fMinLatex = `f_{\\min} &= f(${mf.toFixed(1)}) = (${mf.toFixed(1)} - x_f)^2 + y_f = ${res.fMin.toFixed(2)}`;
    fMaxLatex = `f_{\\max} &= f(${nf.toFixed(1)}) = (${nf.toFixed(1)} - x_f)^2 + y_f = ${res.fMax.toFixed(2)}`;
  } else {
    fMinLatex = `f_{\\min} &= f(${nf.toFixed(1)}) = (${nf.toFixed(1)} - x_f)^2 + y_f = ${res.fMin.toFixed(2)}`;
    fMaxLatex = `f_{\\max} &= f(${mf.toFixed(1)}) = (${mf.toFixed(1)} - x_f)^2 + y_f = ${res.fMax.toFixed(2)}`;
  }

  // 2. g(x) 闭区间代数最值表达式构建 (开口向下，对称轴 x = xg)
  let gMaxLatex = "";
  let gMinLatex = "";
  if (xg >= mg && xg <= ng) {
    gMaxLatex = `g_{\\max} &= g(x_g) = y_g = ${res.gMax.toFixed(2)}`;
    const distM = Math.abs(mg - xg);
    const distN = Math.abs(ng - xg);
    const farX = distM >= distN ? mg : ng;
    gMinLatex = `g_{\\min} &= g(${farX.toFixed(1)}) = -(${farX.toFixed(1)} - x_g)^2 + y_g = ${res.gMin.toFixed(2)}`;
  } else if (xg < mg) {
    gMaxLatex = `g_{\\max} &= g(${mg.toFixed(1)}) = -(${mg.toFixed(1)} - x_g)^2 + y_g = ${res.gMax.toFixed(2)}`;
    gMinLatex = `g_{\\min} &= g(${ng.toFixed(1)}) = -(${ng.toFixed(1)} - x_g)^2 + y_g = ${res.gMin.toFixed(2)}`;
  } else {
    gMaxLatex = `g_{\\max} &= g(${ng.toFixed(1)}) = -(${ng.toFixed(1)} - x_g)^2 + y_g = ${res.gMax.toFixed(2)}`;
    gMinLatex = `g_{\\min} &= g(${mg.toFixed(1)}) = -(${mg.toFixed(1)} - x_g)^2 + y_g = ${res.gMin.toFixed(2)}`;
  }

  // 3. 详细中文推演说明（供 detail 流式解析，所有数学公式与变量严格用 $...$ 包裹）
  const fMinDetail =
    xf >= mf && xf <= nf
      ? `$f(x)$ 开口向上，对称轴 $x_f = ${xf.toFixed(2)} \\in [${mf.toFixed(1)}, ${nf.toFixed(1)}]$ 位于区间内，在顶点处取得极小值 $f_{\\min} = f(x_f) = y_f = ${res.fMin.toFixed(2)}$。`
      : xf < mf
        ? `$f(x)$ 对称轴 $x_f = ${xf.toFixed(2)} < ${mf.toFixed(1)}$ 位于区间左侧，$f(x)$ 在 $[${mf.toFixed(1)}, ${nf.toFixed(1)}]$ 单调递增，在左端点取得极小值 $f_{\\min} = f(${mf.toFixed(1)}) = ${res.fMin.toFixed(2)}$。`
        : `$f(x)$ 对称轴 $x_f = ${xf.toFixed(2)} > ${nf.toFixed(1)}$ 位于区间右侧，$f(x)$ 在 $[${mf.toFixed(1)}, ${nf.toFixed(1)}]$ 单调递减，在右端点取得极小值 $f_{\\min} = f(${nf.toFixed(1)}) = ${res.fMin.toFixed(2)}$。`;

  const fMaxDetail =
    xf >= mf && xf <= nf
      ? `极大值在离对称轴较远的端点 $x = ${res.xFMax.toFixed(1)}$ 处取得，$f_{\\max} = f(${res.xFMax.toFixed(1)}) = ${res.fMax.toFixed(2)}$。`
      : xf < mf
        ? `单调递增在右端点取得极大值 $f_{\\max} = f(${nf.toFixed(1)}) = ${res.fMax.toFixed(2)}$。`
        : `单调递减在左端点取得极大值 $f_{\\max} = f(${mf.toFixed(1)}) = ${res.fMax.toFixed(2)}$。`;

  const gMaxDetail =
    xg >= mg && xg <= ng
      ? `$g(x)$ 开口向下，对称轴 $x_g = ${xg.toFixed(2)} \\in [${mg.toFixed(1)}, ${ng.toFixed(1)}]$ 位于区间内，在顶点处取得极大值 $g_{\\max} = g(x_g) = y_g = ${res.gMax.toFixed(2)}$。`
      : xg < mg
        ? `$g(x)$ 对称轴 $x_g = ${xg.toFixed(2)} < ${mg.toFixed(1)}$ 位于区间左侧，$g(x)$ 在 $[${mg.toFixed(1)}, ${ng.toFixed(1)}]$ 单调递减，在左端点取得极大值 $g_{\\max} = g(${mg.toFixed(1)}) = ${res.gMax.toFixed(2)}$。`
        : `$g(x)$ 对称轴 $x_g = ${xg.toFixed(2)} > ${ng.toFixed(1)}$ 位于区间右侧，$g(x)$ 在 $[${mg.toFixed(1)}, ${ng.toFixed(1)}]$ 单调递增，在右端点取得极大值 $g_{\\max} = g(${ng.toFixed(1)}) = ${res.gMax.toFixed(2)}$。`;

  const gMinDetail =
    xg >= mg && xg <= ng
      ? `极小值在离对称轴较远的端点 $x = ${res.xGMin.toFixed(1)}$ 处取得，$g_{\\min} = g(${res.xGMin.toFixed(1)}) = ${res.gMin.toFixed(2)}。`
      : xg < mg
        ? `单调递减在右端点取得极小值 $g_{\\min} = g(${ng.toFixed(1)}) = ${res.gMin.toFixed(2)}。`
        : `单调递增在左端点取得极小值 $g_{\\min} = g(${mg.toFixed(1)}) = ${res.gMin.toFixed(2)}。`;

  // 计算当前模式下主参数 y_f 的充要临界下限 yf_crit
  let yfCrit = 0;
  let targetCriterionStr = "";
  if (selectedLogic === "all_all") {
    yfCrit = yf - (res.fMin - res.gMax);
    targetCriterionStr = "f_{\\min} \\ge g_{\\max}";
  } else if (selectedLogic === "all_exist") {
    yfCrit = yf - (res.fMin - res.gMin);
    targetCriterionStr = "f_{\\min} \\ge g_{\\min}";
  } else if (selectedLogic === "exist_all") {
    yfCrit = yf - (res.fMax - res.gMax);
    targetCriterionStr = "f_{\\max} \\ge g_{\\max}";
  } else if (selectedLogic === "exist_exist") {
    yfCrit = yf - (res.fMax - res.gMin);
    targetCriterionStr = "f_{\\max} \\ge g_{\\min}";
  } else if (selectedLogic === "same_var") {
    yfCrit = yf - (res.sameVarMinDiff ?? 0);
    targetCriterionStr = "h(x)_{\\min} \\ge 0";
  }

  const quantities: MathPanelData["quantities"] =
    selectedLogic === "same_var"
      ? [
          {
            label: "同变量成立状态",
            value: res.isSameVarTrue ? "满足 (h ≥ 0)" : "违背 (存在 h < 0)",
            highlight: res.isSameVarTrue ? "extreme" : "negative",
          },
          {
            label: "参数充要解集",
            symbol: "y_f",
            value: `[${yfCrit.toFixed(2)}, +\\infty)`,
            color: MATH_COLORS.paramPrimary,
          },
          {
            label: "差函数最小差值",
            symbol: "h_{\\min}",
            value: res.sameVarMinDiff ?? 0,
            color: MATH_COLORS.inequality,
          },
          {
            label: "最危险极小位置",
            symbol: "x_{\\min}",
            value: `x = ${(res.sameVarXMin ?? 0).toFixed(2)}`,
          },
          {
            label: "作用域公共交集",
            symbol: "I_1 \\cap I_2",
            value: "[1.50, 2.00]",
          },
        ]
      : [
          {
            label: "博弈成立状态",
            value: res.isCurrentLogicTrue
              ? "满足 (博弈成功)"
              : "违背 (博弈失败)",
            highlight: res.isCurrentLogicTrue ? "extreme" : "negative",
          },
          {
            label: "参数充要解集",
            symbol: "y_f",
            value: `[${yfCrit.toFixed(2)}, +\\infty)`,
            color: MATH_COLORS.paramPrimary,
          },
          {
            label: "博弈判定准则",
            symbol: "\\text{准则}",
            value: targetCriterionStr,
            color: MATH_COLORS.inequality,
          },
          {
            label: "比较高度差",
            symbol: "\\Delta y",
            value: (res.battlePointF.y - res.battlePointG.y).toFixed(2),
            highlight:
              res.battlePointF.y >= res.battlePointG.y ? "extreme" : "negative",
          },
          {
            label: "f(x) 最小值",
            symbol: "f_{\\min}",
            value: `${res.fMin.toFixed(2)} (x=${res.xFMin.toFixed(2)})`,
            color: MATH_COLORS.function,
          },
          {
            label: "g(x) 最大值",
            symbol: "g_{\\max}",
            value: `${res.gMax.toFixed(2)} (x=${res.xGMax.toFixed(2)})`,
            color: MATH_COLORS.functionSecondary,
          },
        ];

  // 动态根据所选逻辑置顶核心定理
  let coreTheorem = {
    name: "高考双动点不等式 · 极值完全隔离",
    latex: `\\forall x_1 \\in I_1, \\forall x_2 \\in I_2, \\; f(x_1) \\ge g(x_2) \\iff f_{\\min} \\ge g_{\\max}`,
    level: "core" as const,
    prerequisites: [
      "$x_1$ 与 $x_2$ 分别在各自区间内独立自由滑动，无任何绑定约束",
    ],
  };

  if (selectedLogic === "all_exist") {
    coreTheorem = {
      name: "高考双动点不等式 · 极小保底支撑",
      latex: `\\forall x_1 \\in I_1, \\exists x_2 \\in I_2, \\; f(x_1) \\ge g(x_2) \\iff f_{\\min} \\ge g_{\\min}`,
      level: "core",
      prerequisites: [
        "对每一个 $f(x_1)$，只需能找到一个不大于它的 $g(x_2)$，故仅需 $f_{\\min} \\ge g_{\\min}$",
      ],
    };
  } else if (selectedLogic === "exist_all") {
    coreTheorem = {
      name: "高考双动点不等式 · 极大顶峰压制",
      latex: `\\exists x_1 \\in I_1, \\forall x_2 \\in I_2, \\; f(x_1) \\ge g(x_2) \\iff f_{\\max} \\ge g_{\\max}`,
      level: "core",
      prerequisites: [
        "只需存在一个 $f(x_1)$ 能压住所有 $g(x_2)$，故仅需 $f_{\\max} \\ge g_{\\max}$",
      ],
    };
  } else if (selectedLogic === "exist_exist") {
    coreTheorem = {
      name: "高考双动点不等式 · 门槛局部超越",
      latex: `\\exists x_1 \\in I_1, \\exists x_2 \\in I_2, \\; f(x_1) \\ge g(x_2) \\iff f_{\\max} \\ge g_{\\min}`,
      level: "core",
      prerequisites: [
        "只要 $f(x)$ 的峰顶高于 $g(x)$ 的谷底，即可找到满足条件的一组 $(x_1, x_2)$",
      ],
    };
  } else if (selectedLogic === "same_var") {
    coreTheorem = {
      name: "同自变量恒成立 · 差函数法",
      latex: `\\forall x \\in I_1 \\cap I_2, \\; f(x) \\ge g(x) \\iff h(x)_{\\min} \\ge 0`,
      level: "core",
      prerequisites: [
        "自变量 $x$ 为同一动点，仅在两定义域公共交集 $I_1 \\cap I_2$ 上考察",
      ],
    };
  }

  const constantTerm = (xf * xf + xg * xg - yg).toFixed(2);
  const symAxis = (xf + xg) / 2;

  const theorems: MathPanelData["theorems"] =
    selectedLogic === "same_var"
      ? [
          coreTheorem,
          {
            name: "差函数 h(x) 的解析式与极值位置",
            latex: `h(x) = 2x^2 - 2(x_f + x_g)x + (x_f^2 + x_g^2 - y_g + y_f)`,
            level: "important",
            prerequisites: [
              "由 $f(x) - g(x)$ 展开整理得标准二次函数，开口向上",
            ],
          },
        ]
      : [
          coreTheorem,
          {
            name: "双动点不等式四大博弈全景矩阵",
            latex: `\\begin{aligned} 
              \\forall x_1, \\forall x_2 &\\iff f_{\\min} \\ge g_{\\max} \\\\ 
              \\forall x_1, \\exists x_2 &\\iff f_{\\min} \\ge g_{\\min} \\\\ 
              \\exists x_1, \\forall x_2 &\\iff f_{\\max} \\ge g_{\\max} \\\\ 
              \\exists x_1, \\exists x_2 &\\iff f_{\\max} \\ge g_{\\min} 
            \\end{aligned}`,
            level: "important",
            prerequisites: [
              "牢记：'任意'关注最弱项（求最值），'存在'关注最强项",
            ],
          },
        ];

  // 高考破题三步推演链（遵循高考解答题认知：审题定法 -> 建模联立(求最值) -> 求解反思(解参数范围)）
  let reasoningSteps: ReasoningStep[] = [];

  if (selectedLogic === "all_all") {
    const diff = res.fMin - res.gMax;
    reasoningSteps = [
      {
        step: 1,
        title: "审题定法 · 双动点独立性转化",
        detail:
          "自变量 $x_1 \\in [0.5, 2.0]$ 与 $x_2 \\in [1.5, 3.0]$ 各自独立滑动无绑定约束。要使得不等式全域恒成立，充要条件为 $f(x)$ 的全域最小值不低于 $g(x)$ 的全域最大值。",
        latex: `\\forall x_1 \\in I_1, \\; \\forall x_2 \\in I_2, \\; f(x_1) \\ge g(x_2) \\iff f_{\\min} \\ge g_{\\max}`,
        rubric:
          "采分点：识别双动点独立自由滑动，准确确立极值完全隔离充要模型（2分）",
      },
      {
        step: 2,
        title: "建模联立 · 闭区间二次最值代数推导",
        detail: `${fMinDetail} ${gMaxDetail}`,
        latex: `\\begin{aligned} 
          ${fMinLatex} \\\\ 
          ${gMaxLatex} 
        \\end{aligned}`,
        rubric:
          "采分点：判定对称轴位置与单调区间，列出解析式代入并解出极值（4分）",
      },
      {
        step: 3,
        title: "求解反思 · 建立参数不等式求解集",
        detail:
          diff >= 0
            ? `由充要条件 $f_{\\min} \\ge g_{\\max}$ 列不等式，解得参数范围为 $y_f \\ge ${yfCrit.toFixed(2)}$，即 $y_f \\in [${yfCrit.toFixed(2)}, +\\infty)$。当前 $y_f = ${yf.toFixed(2)}$，高度差 $\\Delta y = ${diff.toFixed(2)} \\ge 0$，全域博弈成立。`
            : `由充要条件 $f_{\\min} \\ge g_{\\max}$ 列不等式，要求 $y_f \\ge ${yfCrit.toFixed(2)}$。当前 $y_f = ${yf.toFixed(2)} < ${yfCrit.toFixed(2)}$，高度差 $\\Delta y = ${diff.toFixed(2)} < 0$，两函数值域重叠，博弈被违背。`,
        latex: `\\begin{aligned} 
          f_{\\min} \\ge g_{\\max} &\\iff y_f \\ge g_{\\max} - (f_{\\min} - y_f) \\\\ 
          &\\iff y_f \\ge ${yfCrit.toFixed(2)} \\quad (\\Delta y = ${diff.toFixed(2)}) 
        \\end{aligned}`,
        rubric:
          "采分点：建立参数不等式并解出充要区间，完成高度差与临界相切反思（4分）",
      },
    ];
  } else if (selectedLogic === "all_exist") {
    const diff = res.fMin - res.gMin;
    reasoningSteps = [
      {
        step: 1,
        title: "审题定法 · 全称对存在量词降维",
        detail:
          "对于每一个给定的 $x_1 \\in I_1$，要求总能在 $I_2$ 中找到动点 $x_2$ 使得 $f(x_1) \\ge g(x_2)$。即每个函数值 $f(x_1)$ 都不低于 $g(x)$ 的全域最低点，等价于 $f(x)$ 的最小值不低于 $g(x)$ 的最小值。",
        latex: `\\forall x_1 \\in I_1, \\; \\exists x_2 \\in I_2, \\; f(x_1) \\ge g(x_2) \\iff f_{\\min} \\ge g_{\\min}`,
        rubric: "采分点：正确转化量词覆盖关系，锁定保底极小值比较模型（2分）",
      },
      {
        step: 2,
        title: "建模联立 · 闭区间极小值与端点下界解算",
        detail: `${fMinDetail} ${gMinDetail}`,
        latex: `\\begin{aligned} 
          ${fMinLatex} \\\\ 
          ${gMinLatex} 
        \\end{aligned}`,
        rubric:
          "采分点：结合对称轴与远端点比较，准确解算两函数闭区间最小值（4分）",
      },
      {
        step: 3,
        title: "求解反思 · 保底参数解集与值域交叉验证",
        detail:
          diff >= 0
            ? `建立不等式 $f_{\\min} \\ge g_{\\min}$，解得参数充要范围 $y_f \\ge ${yfCrit.toFixed(2)}$，即 $y_f \\in [${yfCrit.toFixed(2)}, +\\infty)$。当前 $y_f = ${yf.toFixed(2)}$，$\\Delta y = ${diff.toFixed(2)} \\ge 0$，即使两函数图象大幅相交，全称对存在依然稳固成立。`
            : `建立不等式 $f_{\\min} \\ge g_{\\min}$，要求 $y_f \\ge ${yfCrit.toFixed(2)}$。当前 $y_f = ${yf.toFixed(2)}$，保底差 $\\Delta y = ${diff.toFixed(2)} < 0$，$f(x)$ 跌破了 $g(x)$ 的全域底线，命题失效。`,
        latex: `\\begin{aligned} 
          f_{\\min} \\ge g_{\\min} &\\iff y_f \\ge g_{\\min} - (f_{\\min} - y_f) \\\\ 
          &\\iff y_f \\ge ${yfCrit.toFixed(2)} \\quad (\\Delta y = ${diff.toFixed(2)}) 
        \\end{aligned}`,
        rubric:
          "采分点：完成参数不等式求解，反思图象相交但保底依然成立的数学内涵（4分）",
      },
    ];
  } else if (selectedLogic === "exist_all") {
    const diff = res.fMax - res.gMax;
    reasoningSteps = [
      {
        step: 1,
        title: "审题定法 · 存在对全称顶峰压制建模",
        detail:
          "只需在 $I_1$ 内存在至少一个动点 $x_1$，使得 $f(x_1)$ 能够压制 $g(x)$ 在 $I_2$ 上的所有取值。由于只要选出 $f(x)$ 的最高峰顶即可产生最大压制力，故等价于 $f(x)$ 的最大值不低于 $g(x)$ 的最大值。",
        latex: `\\exists x_1 \\in I_1, \\; \\forall x_2 \\in I_2, \\; f(x_1) \\ge g(x_2) \\iff f_{\\max} \\ge g_{\\max}`,
        rubric: "采分点：识别存在量词最大优势特征，提炼顶峰压制充要条件（2分）",
      },
      {
        step: 2,
        title: "建模联立 · 优势峰顶与顶点极大值展开",
        detail: `${fMaxDetail} ${gMaxDetail}`,
        latex: `\\begin{aligned} 
          ${fMaxLatex} \\\\ 
          ${gMaxLatex} 
        \\end{aligned}`,
        rubric:
          "采分点：正确比较区间端点与顶点函数值，得出两函数最大值代数式（4分）",
      },
      {
        step: 3,
        title: "求解反思 · 顶峰跨越不等式与参数解集",
        detail:
          diff >= 0
            ? `建立不等式 $f_{\\max} \\ge g_{\\max}$，解得参数范围 $y_f \\ge ${yfCrit.toFixed(2)}$，即 $y_f \\in [${yfCrit.toFixed(2)}, +\\infty)$。当前 $y_f = ${yf.toFixed(2)}$，高度差 $\\Delta y = ${diff.toFixed(2)} \\ge 0$，峰顶成功实现压制。`
            : `建立不等式 $f_{\\max} \\ge g_{\\max}$，要求 $y_f \\ge ${yfCrit.toFixed(2)}$。当前 $y_f = ${yf.toFixed(2)}$，顶峰差 $\\Delta y = ${diff.toFixed(2)} < 0$，$f(x)$ 的最高点受制于 $g(x)$ 的最高峰，压制失败。`,
        latex: `\\begin{aligned} 
          f_{\\max} \\ge g_{\\max} &\\iff y_f \\ge g_{\\max} - (f_{\\max} - y_f) \\\\ 
          &\\iff y_f \\ge ${yfCrit.toFixed(2)} \\quad (\\Delta y = ${diff.toFixed(2)}) 
        \\end{aligned}`,
        rubric:
          "采分点：求解参数不等式，反思峰顶持平相切时的唯一最优动点位置（4分）",
      },
    ];
  } else if (selectedLogic === "exist_exist") {
    const diff = res.fMax - res.gMin;
    reasoningSteps = [
      {
        step: 1,
        title: "审题定法 · 双存在量词门槛超越识别",
        detail:
          "只需在各自区间内能挑出一组动点对 $(x_1, x_2)$ 满足不等式即可。这代表最宽松的准入门槛，只要 $f(x)$ 的最高峰顶不低于 $g(x)$ 的最低谷底，两函数在对应高度上必有点对满足关系。",
        latex: `\\exists x_1 \\in I_1, \\; \\exists x_2 \\in I_2, \\; f(x_1) \\ge g(x_2) \\iff f_{\\max} \\ge g_{\\min}`,
        rubric: "采分点：识别双存在量词等价于峰顶与谷底的最宽松门槛跨越（2分）",
      },
      {
        step: 2,
        title: "建模联立 · 优势峰顶与最低谷底解算",
        detail: `${fMaxDetail} ${gMinDetail}`,
        latex: `\\begin{aligned} 
          ${fMaxLatex} \\\\ 
          ${gMinLatex} 
        \\end{aligned}`,
        rubric:
          "采分点：分别求解闭区间上 $f(x)$ 的最大值与 $g(x)$ 的最小值代数式（4分）",
      },
      {
        step: 3,
        title: "求解反思 · 准入门槛不等式与解集非空判定",
        detail:
          diff >= 0
            ? `建立不等式 $f_{\\max} \\ge g_{\\min}$，解得参数范围 $y_f \\ge ${yfCrit.toFixed(2)}$，即 $y_f \\in [${yfCrit.toFixed(2)}, +\\infty)$。当前 $y_f = ${yf.toFixed(2)}$，门槛差 $\\Delta y = ${diff.toFixed(2)} \\ge 0$，解对非空。`
            : `建立不等式 $f_{\\max} \\ge g_{\\min}$，要求 $y_f \\ge ${yfCrit.toFixed(2)}$。当前 $y_f = ${yf.toFixed(2)}$，门槛差 $\\Delta y = ${diff.toFixed(2)} < 0$，$f(x)$ 的最高点亦无法触及 $g(x)$ 的最低点，解集为空集。`,
        latex: `\\begin{aligned} 
          f_{\\max} \\ge g_{\\min} &\\iff y_f \\ge g_{\\min} - (f_{\\max} - y_f) \\\\ 
          &\\iff y_f \\ge ${yfCrit.toFixed(2)} \\quad (\\Delta y = ${diff.toFixed(2)}) 
        \\end{aligned}`,
        rubric:
          "采分点：完成最宽松参数解集求解，反思解集由非空退化为空集的几何本质（4分）",
      },
    ];
  } else if (selectedLogic === "same_var") {
    const xMin = res.sameVarXMin ?? 1.5;
    const minDiff = res.sameVarMinDiff ?? 0;
    reasoningSteps = [
      {
        step: 1,
        title: "审题定法 · 同自变量识别与差函数构造",
        detail:
          "题设要求对同一动点 $x \\in [1.50, 2.00]$ 恒成立。严禁拆分为独立最值，必须在公共交集 $I_1 \\cap I_2$ 上构造差函数 $h(x) = f(x) - g(x)$，转化为差函数恒成立问题。",
        latex: `h(x) = f(x) - g(x) \\ge 0, \\quad x \\in I_1 \\cap I_2 \\iff h(x)_{\\min} \\ge 0`,
        rubric:
          "采分点：识别同自变量特征，规范声明差函数与公共交集定义域（2分）",
      },
      {
        step: 2,
        title: "建模联立 · 差函数二次化简与对称轴区间定位",
        detail: `展开并整理得二次函数开口向上。对称轴 $x_{\\text{sym}} = ${symAxis.toFixed(2)}$，${symAxis < 1.5 ? "位于区间 $[1.5, 2.0]$ 左侧，$h(x)$ 单调递增，在左端点 $x = 1.5$ 处取得极小值。" : symAxis > 2.0 ? "位于区间 $[1.5, 2.0]$ 右侧，$h(x)$ 单调递减，在右端点 $x = 2.0$ 处取得极小值。" : `位于区间内部，在顶点 $x = ${symAxis.toFixed(2)}$ 处取得极小值。`}`,
        latex: `\\begin{aligned} 
          h(x) &= 2x^2 - ${(2 * (xf + xg)).toFixed(2)}x + (${constantTerm} + y_f) \\\\ 
          x_{\\text{sym}} &= \\frac{x_f + x_g}{2} = ${symAxis.toFixed(2)} 
        \\end{aligned}`,
        rubric: "采分点：正确展开二次多项式并求得对称轴，判定区间单调性（4分）",
      },
      {
        step: 3,
        title: "求解反思 · 极小值求解与参数充要解集",
        detail:
          minDiff >= 0
            ? `在最危险点 $x = ${xMin.toFixed(2)}$ 处，求得 $h(x)_{\\min} = ${minDiff.toFixed(2)} \\ge 0$。令 $h_{\\min} \\ge 0$ 解得参数充要解集 $y_f \\ge ${yfCrit.toFixed(2)}$，即 $y_f \\in [${yfCrit.toFixed(2)}, +\\infty)$。两曲线即使在极值上交错，同变量依然全域恒成立。`
            : `在最危险点 $x = ${xMin.toFixed(2)}$ 处，$h(x)_{\\min} = ${minDiff.toFixed(2)} < 0$。要求 $y_f \\ge ${yfCrit.toFixed(2)}$，当前 $y_f = ${yf.toFixed(2)}$ 产生违背区间。`,
        latex: `\\begin{aligned} 
          h(x)_{\\min} \\ge 0 &\\iff h(${xMin.toFixed(2)}) \\ge 0 \\\\ 
          &\\iff y_f \\ge ${yfCrit.toFixed(2)} \\quad (h_{\\min} = ${minDiff.toFixed(2)}) 
        \\end{aligned}`,
        rubric: "采分点：由对称轴位置精确定位极小值点，解出参数充要解集（4分）",
      },
    ];
  }

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
        text: `同变量恒成立不满足！在最危险位置 x = ${res.sameVarXMin?.toFixed(2)} 处，差值 h(x) = ${res.sameVarMinDiff?.toFixed(2)} (< 0)，要求 y_f ≥ ${yfCrit.toFixed(2)}。`,
        level: "warning",
      });
    }
  } else {
    if (!res.isCurrentLogicTrue) {
      warnings.push({
        text: `当前博弈条件不满足！对比点高度差 Δy = ${(res.battlePointF.y - res.battlePointG.y).toFixed(2)} (< 0)，要求参数满足 y_f ≥ ${yfCrit.toFixed(2)}。`,
        level: "warning",
      });
    }
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    examAnchor: "新高考解答题 · 双变量量词博弈与存在性问题",
    mnemonic:
      selectedLogic === "same_var"
        ? "同变量差函数，作差求最值；双动点各为政，量词定极值。"
        : "任意任意隔绝开 (min≥max)，任意存在保底线 (min≥min)，存在任意冲顶峰 (max≥max)，存在存在越门槛 (max≥min)。",
  };
}
