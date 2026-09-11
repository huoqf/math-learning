/**
 * src/data/builders/derivativeMonotonicity.ts
 * 导数与单调性及极值看板数据组装器
 * 实现与左屏探究维度(mode)、高考模型(modelKey)、参数(a, x0)的100%动态同步与严格去噪
 */

import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import {
  solveMonotonicityModel,
  formatFloat,
  type MonotonicityModelKey,
} from "@/math/derivativeMonotonicity";
import { MATH_COLORS } from "@/theme";

export function buildDerivativeMonotonicityQuantities(
  params: Record<string, number>,
  config?: { modelKey?: MonotonicityModelKey; mode?: string },
): MathPanelData {
  const modelKey: MonotonicityModelKey = config?.modelKey || "cubic_param";
  const mode = config?.mode || "monotonicity_point";
  const a = params.a ?? 1.0;
  const x0 = params.x0 ?? 1.0;

  const result = solveMonotonicityModel(modelKey, a);
  const fx0 = result.fn(x0);
  const fpx0 = result.derivativeFn(x0);

  const fx0Str = Number.isFinite(fx0) ? formatFloat(fx0) : "无定义";
  const fpx0Str = Number.isFinite(fpx0) ? formatFloat(fpx0) : "无定义";

  let slopeStatus = "无定义";
  let slopeHighlight: MathQuantity["highlight"] = undefined;
  if (Number.isFinite(fpx0)) {
    if (Math.abs(fpx0) < 1e-5) {
      slopeStatus = "切线水平 (驻点 f'(x₀) = 0)";
      slopeHighlight = "zero";
    } else if (fpx0 > 0) {
      slopeStatus = "单调递增 (f'(x₀) > 0, 切线斜率 k > 0)";
      slopeHighlight = "positive";
    } else {
      slopeStatus = "单调递减 (f'(x₀) < 0, 切线斜率 k < 0)";
      slopeHighlight = "negative";
    }
  }

  // 整理定义域 LaTeX
  const domainLatex =
    modelKey === "ln_x_ratio" || modelKey === "x_ln_x_param"
      ? "(0, +\\infty)"
      : modelKey === "nike_rational"
        ? "(-\\infty, 0) \\cup (0, +\\infty)"
        : "\\mathbb{R}";

  // 整理单调区间 LaTeX
  const incIntervals = result.monotonicIntervals
    .filter((it) => it.type === "increasing")
    .map((it) => it.latex)
    .join(", ");
  const decIntervals = result.monotonicIntervals
    .filter((it) => it.type === "decreasing")
    .map((it) => it.latex)
    .join(", ");

  // ── 1. 实时数学量 (按当前维度精准组装) ──
  const quantities: MathQuantity[] = [
    {
      label: "函数定义域 (优先原则)",
      value: `x \\in ${domainLatex}`,
      color: MATH_COLORS.secondary,
    },
    {
      label: "当前函数解析式",
      value: result.latex,
    },
    {
      label: "导函数解析式 f'(x)",
      value: result.derivativeLatex,
      color: MATH_COLORS.derivative,
    },
  ];

  // 模式 1：动点切线状态为核心探索量
  if (mode === "monotonicity_point") {
    quantities.push({
      label: "动点切线状态",
      value: `x_0 = ${formatFloat(x0)}, \\; f(x_0) = ${fx0Str}, \\; f'(x_0) = ${fpx0Str} \\; (${slopeStatus})`,
      color: MATH_COLORS.tangentLine,
      highlight: slopeHighlight,
    });
  }

  // 单调区间（全模式同步）
  quantities.push(
    {
      label: "单调递增区间 (f'(x) > 0)",
      value: incIntervals || "无",
      color: MATH_COLORS.vectorSecondary,
    },
    {
      label: "单调递减区间 (f'(x) < 0)",
      value: decIntervals || "无",
      color: MATH_COLORS.paramPrimary,
    },
  );

  // 极值点与驻点：模式 2（极值分析）和模式 3（含参讨论）的核心量
  if (mode === "extrema_analysis" || mode === "parametric_discuss") {
    if (result.extrema.length > 0) {
      const extremaStr = result.extrema
        .map(
          (e) =>
            `x = ${formatFloat(e.x)} (${e.type === "maximum" ? "极大值 " : e.type === "minimum" ? "极小值 " : "驻点 "}${formatFloat(e.y)})`,
        )
        .join("；");

      quantities.push({
        label: "极值点与驻点列表",
        value: extremaStr,
        color: MATH_COLORS.focusPoint,
        highlight: "extreme",
      });
    } else {
      quantities.push({
        label: "极值点判定",
        value: "无极值点 (导函数在定义域内不穿零变号)",
      });
    }
  }

  // 模式 3（含参讨论）增加分类讨论综合结论
  if (mode === "parametric_discuss") {
    quantities.push({
      label: "分类讨论综合结论",
      value: result.discussionSummaryLatex,
      color: MATH_COLORS.paramPrimary,
    });
  }

  // ── 2. 高考解答题破题推演链 (三步法闭环，严格对应当前维度与模型) ──
  const reasoningSteps: ReasoningStep[] = [];
  let examAnchor = "";

  if (mode === "monotonicity_point") {
    examAnchor = "新高考解答题 · 导数的几何意义与切线单调性 (4~6分母题)";
    const tangentSlopeStr = Number.isFinite(fpx0) ? formatFloat(fpx0) : "k";
    const tangentLineLatex =
      Number.isFinite(fpx0) && Number.isFinite(fx0)
        ? `y - (${fx0Str}) = ${tangentSlopeStr}(x - ${formatFloat(x0)})`
        : "y - f(x_0) = f'(x_0)(x - x_0)";

    reasoningSteps.push(
      {
        step: 1,
        title: "确定定义域并规范求导",
        detail: `函数定义域为 $x \\in ${domainLatex}$。对函数求导得导函数表达式：`,
        latex: `${result.derivativeLatex}`,
        rubric: "求导正确得 2 分",
      },
      {
        step: 2,
        title: "代入切点计算导数值与切线方程",
        detail: `代入切点横坐标 $x_0 = ${formatFloat(x0)}$，得切线斜率 $k = f'(${formatFloat(x0)}) = ${fpx0Str}$，点斜式切线方程为：`,
        latex: tangentLineLatex,
        rubric: "斜率与切线方程正确得 2 分",
      },
      {
        step: 3,
        title: "导数符号判定局部单调增减性",
        detail: Number.isFinite(fpx0)
          ? fpx0 > 0
            ? `因 $f'(${formatFloat(x0)}) = ${fpx0Str} > 0$，切线倾斜角为锐角，函数在 $x_0$ 的邻域内严格单调递增。`
            : fpx0 < 0
              ? `因 $f'(${formatFloat(x0)}) = ${fpx0Str} < 0$，切线倾斜角为钝角，函数在 $x_0$ 的邻域内严格单调递减。`
              : `因 $f'(${formatFloat(x0)}) = 0$，切线处于水平状态，为函数的临界驻点。`
          : "切点超出函数定义域。",
        latex: `f'(x_0) ${fpx0 > 0 ? "> 0 \\implies \\text{局部递增}" : fpx0 < 0 ? "< 0 \\implies \\text{局部递减}" : "= 0 \\implies \\text{水平驻点}"}`,
        rubric: "单调性结论完整得 2 分",
      },
    );
  } else if (mode === "extrema_analysis") {
    examAnchor = "新高考压轴题 · 第一充分条件穿零变号与极值判定 (4~8分母题)";
    const extremaDetail =
      result.extrema.length > 0
        ? result.extrema
            .map(
              (e) =>
                `在驻点 $x = ${formatFloat(e.x)}$ 处：左侧 $f'(x) ${e.leftSign > 0 ? "> 0" : "< 0"}$，右侧 $f'(x) ${e.rightSign > 0 ? "> 0" : "< 0"}$，符号${e.leftSign * e.rightSign < 0 ? "穿零变号" : "不变号"}，故为${e.label}。`,
            )
            .join(" ")
        : "导函数在定义域内恒同号或无驻点，未发生穿零变号，全域单调，无极值点。";

    reasoningSteps.push(
      {
        step: 1,
        title: "求解导函数零点 (必要条件)",
        detail: `在定义域 $x \\in ${domainLatex}$ 内，令导函数 $f'(x) = 0$：`,
        latex: `${result.derivativeLatex} = 0`,
        rubric: "求出所有驻点得 2 分",
      },
      {
        step: 2,
        title: "第一充分条件符号穿零检验",
        detail: extremaDetail,
        latex:
          result.extrema.length > 0
            ? "\\text{左正右负} \\implies \\text{极大值}；\\quad \\text{左负右正} \\implies \\text{极小值}"
            : "f'(x) \\text{ 不变号} \\implies \\text{无极值点}",
        rubric: "符号检验与单调性分析得 3 分",
      },
      {
        step: 3,
        title: "代入原函数规范下结论",
        detail:
          result.extrema.length > 0
            ? `代入驻点求出对应的极值：${result.extrema.map((e) => `f(${formatFloat(e.x)}) = ${formatFloat(e.y)}`).join("，")}。`
            : "函数在整个定义域内保持单调，无极大值亦无极小值。",
        latex:
          result.extrema.length > 0
            ? result.extrema
                .map(
                  (e) =>
                    `x = ${formatFloat(e.x)} \\implies ${e.type === "maximum" ? "f_{\\max}" : "f_{\\min}"} = ${formatFloat(e.y)}`,
                )
                .join("，\\; ")
            : "f(x) \\text{ 无极值}",
        rubric: "极值结论规范明确得 2 分",
      },
    );
  } else {
    examAnchor =
      "高考导数大题第一问必考 · 含参单调性分类讨论标准五步法 (满分采分点)";
    reasoningSteps.push(
      {
        step: 1,
        title: "确定定义域与导数因式分解",
        detail: `明确定位函数定义域为 $x \\in ${domainLatex}$，求导并因式分解确定分子分母符号：`,
        latex: `${result.derivativeLatex}`,
        rubric: "定义域与求导得 2 分",
      },
      {
        step: 2,
        title: "分类讨论分水岭划分依据",
        detail: `核心分界依据：${result.criticalCondition}。针对参数 $a = ${formatFloat(a)}$ 处于不同区间时讨论导数符号分布。`,
        latex: result.criticalCondition,
        rubric: "分类讨论标准分段得 2 分",
      },
      {
        step: 3,
        title: "列表汇总与单调区间规范书写",
        detail: `根据当前参数 $a = ${formatFloat(a)}$ 讨论所得单调性与极值结论：${result.discussionSummaryLatex}。注意：区间断开处切忌使用并集符号 $\\cup$。`,
        latex: result.discussionSummaryLatex,
        rubric: "单调区间规范书写得 2 分",
      },
    );
  }

  // ── 3. 定理清单 (随探究模式 100% 动态特化，杜绝无关定理堆砌) ──
  const theorems: Theorem[] = [];

  if (mode === "monotonicity_point") {
    theorems.push(
      {
        name: "导数的几何意义与切线方程定理",
        latex: "k = f'(x_0), \\quad y - f(x_0) = f'(x_0)(x - x_0)",
        condition: "函数 f(x) 在点 x_0 处可导",
        prerequisites: [
          "导数值 f'(x_0) 即为函数曲线在点 P(x_0, f(x_0)) 处切线的斜率 k",
          "当 f'(x_0) > 0 时切线倾斜角为锐角；当 f'(x_0) < 0 时为钝角；当 f'(x_0) = 0 时切线水平",
        ],
        note: "导数通过切线斜率定量刻画了函数在点 x_0 处的瞬时变化率与升降走向。",
        level: "core",
        mode: "block",
      },
      {
        name: "导数与单调性判定定理",
        latex:
          "\\begin{cases} f'(x) > 0 \\implies f(x) \\text{ 严格单调递增} \\\\ f'(x) < 0 \\implies f(x) \\text{ 严格单调递减} \\end{cases}",
        condition: "函数 f(x) 在开区间 (a, b) 内可导",
        prerequisites: [
          "若在区间内 f'(x) > 0 (除有限个点外)，则 f(x) 在该区间内单调递增",
          "若在区间内 f'(x) < 0 (除有限个点外)，则 f(x) 在该区间内单调递减",
        ],
        note: "开区间内导数的正负符号直接决定了原函数的单调增减方向。",
        level: "core",
        mode: "block",
      },
    );
  } else if (mode === "extrema_analysis") {
    theorems.push(
      {
        name: "极值点第一充分条件 (变号零点法则)",
        latex:
          "\\begin{aligned} &\\text{左正右负 } (+\\to 0 \\to -) \\implies \\text{极大值点} \\\\ &\\text{左负右正 } (-\\to 0 \\to +) \\implies \\text{极小值点} \\\\ &\\text{两侧同号 } (+\\to 0 \\to +) \\implies \\text{驻点非极值} \\end{aligned}",
        condition: "设 f(x) 在 x_0 处连续且在左右邻域内可导，f'(x_0) = 0",
        prerequisites: [
          "极值是局部的几何性质，反映点附近的小范围峰谷形态",
          "极大值不一定大于极小值；区间端点绝不能取作极值点",
        ],
        note: "可导函数在极值点处切线必定水平 (f'(x_0)=0)，但切线水平的点必须穿零变号才是极值点。",
        level: "core",
        mode: "block",
      },
      {
        name: "费马定理 (可导函数极值必要条件)",
        latex:
          "f(x) \\text{ 在 } x_0 \\text{ 处取极值且可导} \\implies f'(x_0) = 0",
        condition: "函数 f(x) 在极值点 x_0 处可导",
        prerequisites: [
          "切线水平 (驻点 f'(x_0)=0) 是极值的必要不充分条件",
          "不可导点也可能是极值点（如 f(x)=|x| 在 x=0 处取极小值但不可导）",
        ],
        note: "利用必要条件解题求出候选驻点后，必须结合第一充分条件进行符号穿零检验。",
        level: "core",
        mode: "block",
      },
    );
  } else {
    theorems.push(
      {
        name: "含参单调性分类讨论标准五步法",
        latex:
          "\\text{求定义域} \\to \\text{准确求导} \\to \\text{求导数零点} \\to \\text{依参数分类讨论} \\to \\text{规范下结论}",
        condition: "含参可导函数 f(x) 在其定义域内",
        prerequisites: [
          "分类讨论核心分界依据：判别式 Δ=0、导数零点是否进入定义域、两零点大小排序",
          "分类讨论必须做到不重不漏，最终分别书写单调递增区间与递减区间",
        ],
        note: "高考大题阅卷严格按步骤给分，定义域、因式分解与分段界限均为关键采分点。",
        level: "core",
        mode: "block",
      },
      {
        name: "单调性充要判定定理",
        latex:
          "f(x) \\text{ 在 } I \\text{ 上递增} \\iff f'(x) \\ge 0 \\text{ 恒成立且在任意子区间不恒为 } 0",
        condition: "函数 f(x) 在区间 I 上可导",
        prerequisites: [
          "f'(x) > 0 是 f(x) 在区间内递增的充分不必要条件",
          "已知单调性求参数范围时，导数不等式必须带等号 (f'(x) ≥ 0)",
        ],
        note: "逆向求参数范围时不可漏掉导数等于零的临界情况。",
        level: "core",
        mode: "block",
      },
    );
  }

  // ── 4. 高考考点 (结合当前模式与当前模型的针对性考法) ──
  const gaokaoPoints: GaokaoPoint[] = [];

  if (mode === "monotonicity_point") {
    gaokaoPoints.push({
      text: "高考客观题必考：利用导数求切线方程（点斜式展开）及切线斜率的正负与函数增减的对应判定",
      importance: "gaokao",
    });
    gaokaoPoints.push({
      text: "审题命题陷阱：严格区分‘在点 P 处的切线’（P 必为切点）与‘过点 P 的切线’（P 不一定是切点，需设切点联立）",
      importance: "core",
    });
    if (modelKey === "ln_x_ratio") {
      gaokaoPoints.push({
        text: "高考经典母题：对数分式 f(x)=(ln x)/x 在 x=e 处切线水平取得最大值 1/e，常用于指数对数比大小（如 e^π 与 π^e）",
        importance: "hard",
      });
    } else if (modelKey === "nike_rational") {
      gaokaoPoints.push({
        text: "对勾函数渐近线考法：x=0 为垂直渐近线，y=x 为斜渐近线，切线斜率随动点远离原点逐渐趋近于 1",
        importance: "core",
      });
    }
  } else if (mode === "extrema_analysis") {
    gaokaoPoints.push({
      text: "极值穿零变号法则：导函数穿过 x 轴变号才是极值点；仅切于 x 轴不变号为非极值驻点（如三次函数在 a=0 时）",
      importance: "gaokao",
    });
    gaokaoPoints.push({
      text: "极值与最值的本质区别：极值反映局部邻域性质，最值反映全域性质；开区间内唯一极值点必定直接升格为全域最值",
      importance: "core",
    });
    if (modelKey === "cubic_param") {
      gaokaoPoints.push({
        text: "多项式极值判别式法：三次函数导数为二次方程，判别式 Δ > 0 (即 a > 0) 有双极值点，Δ ≤ 0 (a ≤ 0) 全域单调无极值",
        importance: "hard",
      });
    } else if (modelKey === "exp_poly" || modelKey === "x_ln_x_param") {
      gaokaoPoints.push({
        text: "单极值点最值模型：导函数仅有唯一变号零点，极小值直接即为函数在定义域内的全域最小值，常用于不等式恒成立卡位",
        importance: "hard",
      });
    }
  } else {
    gaokaoPoints.push({
      text: "高考大题第一问（4~6分）：含参单调性分类讨论标准规范，求定义域 → 准确求导 → 因式分解 → 依根讨论 → 列表下结论",
      importance: "gaokao",
    });
    gaokaoPoints.push({
      text: "分类讨论三大分水岭：①依二次导数判别式 Δ 讨论；②依导数零点是否落在定义域内讨论；③依两零点大小排序讨论",
      importance: "hard",
    });
    if (modelKey === "ln_x_ratio" || modelKey === "x_ln_x_param") {
      gaokaoPoints.push({
        text: "对数定义域优先红线：研究 (ln x+a)/x 或 x ln x-ax 单调性前必须严格锁死定义域 x > 0，严禁零点讨论溢出定义域",
        importance: "core",
      });
    }
  }

  // ── 5. 退化与易错警示 (仅在与当前模型、当前参数、当前模式真正相关时触发) ──
  const warnings: WarningItem[] = [];

  // (1) 对勾函数定义域断裂与严禁并集符号 ∪ 警示
  if (modelKey === "nike_rational") {
    warnings.push({
      text: "规范警示：对勾函数定义域断裂 (x ≠ 0)，单调区间切忌使用并集符号 ∪ 连接！减区间必须写作 (-√a, 0) 和 (0, √a)。",
      level: "warning",
    });
  }

  // (2) 对数模型定义域优先铁律警示
  if (modelKey === "ln_x_ratio" || modelKey === "x_ln_x_param") {
    warnings.push({
      text: "定义域优先警示：研究对数模型单调性前必须首先确定定义域 x > 0！解导数零点时严禁将负数或 0 纳入单调区间讨论。",
      level: "danger",
    });
  }

  // (3) 对勾函数 a > 0 时极大值小于极小值反常识警示
  if (modelKey === "nike_rational" && a > 0) {
    warnings.push({
      text: "认知警示：极大值不一定大于极小值！当前对勾函数极大值 f(-√a) = -2√a < 极小值 f(√a) = 2√a，印证了极值的局部邻域性质。",
      level: "info",
    });
  }

  // (4) 三次模型 a=0 临界驻点非极值警示
  if (modelKey === "cubic_param" && Math.abs(a) < 1e-5) {
    warnings.push({
      text: "典型反例警示：当前 a = 0 时 f'(x) = x² ≥ 0，x = 0 处切线水平但两侧导数均为正，函数穿过该点单调递增，故 x = 0 是驻点但非极值点！",
      level: "danger",
    });
  }

  // (5) 模式 2 极值点与极值概念区分警示
  if (mode === "extrema_analysis") {
    warnings.push({
      text: "答题规范警示：‘极值点’是自变量取值 (横坐标 x)，‘极值’是函数值 (纵坐标 y)！高考答题切忌混淆两者。",
      level: "warning",
    });
  }

  // (6) 开区间唯一极值升格全域最值提示
  if (
    (modelKey === "exp_poly" ||
      modelKey === "x_ln_x_param" ||
      modelKey === "ln_x_ratio") &&
    (mode === "extrema_analysis" || mode === "parametric_discuss")
  ) {
    warnings.push({
      text: "解题妙招：当前模型在开区间内仅有唯一极值点，该极值点必定直接升格为全域最值点，常用于不等式恒成立卡位求参。",
      level: "info",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    examAnchor,
    mnemonic:
      "求导因式先看域，穿零变号极值立；左正右负极大顶，左负右正极小底；区间断裂莫并集，含参讨论依根析！",
  };
}
