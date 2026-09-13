/**
 * src/data/builders/vectorPolarizationApollonius.ts
 * 向量极化恒等式与阿波罗尼斯圆看板数据构建器
 * 严格遵循高中数学认知与新高考解答题推演规范
 */

import type { MathPanelData } from "../types";
import {
  calcPolarizationIdentity,
  calcApolloniusCircle,
  calcCombinedModel,
} from "@/math/vectorPolarizationApollonius";
import type {
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "@/components/UI";
import { formatMathNumber } from "@/utils/mathFormat";

export function buildVectorPolarizationApolloniusPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) || "polarization";
  const bcLength = params.bcLength ?? 6.0;
  const lambda = params.lambda ?? 2.0;
  const pointAngle = params.pointAngle ?? 45;
  const pointX = params.pointX ?? 2.0;
  const pointY = params.pointY ?? 4.0;

  const quantities: MathQuantity[] = [];
  const warnings: WarningItem[] = [];
  const reasoningSteps: ReasoningStep[] = [];
  let examAnchor = "";

  if (studyMode === "polarization") {
    examAnchor = "高考核心技巧 · 向量极化恒等式与中线降维秒杀";
    const res = calcPolarizationIdentity(pointX, pointY, bcLength);

    quantities.push(
      {
        label: "底边全长 |BC|",
        symbol: "|\\vec{BC}|",
        value: formatMathNumber(res.lenBC),
        isInvariant: true,
        invariantNote: "基底定长",
      },
      {
        label: "半底长 |BM|",
        symbol: "|\\vec{BM}|",
        value: formatMathNumber(res.lenBM),
        isInvariant: true,
        invariantNote: "M为中点，恒等于 |BC|/2",
      },
      {
        label: "中线长 |AM|",
        symbol: "|\\vec{AM}|",
        value: formatMathNumber(res.lenAM),
      },
      {
        label: "坐标点积 AB · AC",
        symbol: "\\vec{AB} \\cdot \\vec{AC}",
        value: formatMathNumber(res.dotProductCoord),
      },
      {
        label: "极化算值 |AM|² - |BM|²",
        symbol: "|\\vec{AM}|^2 - |\\vec{BM}|^2",
        value: formatMathNumber(res.dotProductPolar),
      },
    );

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 中线基底分解",
        detail:
          "遇到两定点 $B, C$ 与一动点 $A$，连结底边中点 $M$，将两向量分别以中线 $\\vec{AM}$ 与半底边 $\\vec{MB}$ 为基底分解。",
        latex:
          "\\vec{AB} = \\vec{AM} + \\vec{MB}, \\quad \\vec{AC} = \\vec{AM} + \\vec{MC} = \\vec{AM} - \\vec{MB}",
        rubric: "采分点：规范引入中线向量并线性分解（3分）",
      },
      {
        step: 2,
        title: "建模联立 · 平方差展开抵消",
        detail:
          "应用数量积的分配律，交叉项 $\\vec{AM}\\cdot\\vec{MB}$ 与 $-\\vec{AM}\\cdot\\vec{MB}$ 相互抵消，得到平方差简洁形式。",
        latex:
          "\\vec{AB} \\cdot \\vec{AC} = (\\vec{AM} + \\vec{MB}) \\cdot (\\vec{AM} - \\vec{MB}) = |\\vec{AM}|^2 - |\\vec{BM}|^2",
        rubric: "采分点：极化恒等式展开与代数消元（3分）",
      },
      {
        step: 3,
        title: "代入求解 · 实时数值演算",
        detail: `底边定长 $|BC| = ${formatMathNumber(res.lenBC)}$，半底边长 $|BM| = ${formatMathNumber(res.lenBM)}$ 为定值。动点数量积唯一由中线长 $|\\vec{AM}|$ 决定。`,
        latex: `\\vec{AB} \\cdot \\vec{AC} = (${formatMathNumber(res.lenAM)})^2 - (${formatMathNumber(res.lenBM)})^2 = ${formatMathNumber(res.dotProductPolar)}`,
        rubric: "采分点：代入参数求得数量积解（4分）",
      },
    );
  } else if (studyMode === "apollonius") {
    examAnchor = "解析几何母题 · 阿波罗尼斯圆轨迹方程与内外分点";
    const res = calcApolloniusCircle(bcLength, lambda, pointAngle);
    const halfD = bcLength / 2;

    quantities.push(
      {
        label: "定点跨度 d = |AB|",
        symbol: "d",
        value: formatMathNumber(bcLength),
        isInvariant: true,
        invariantNote: "两定点间固定距离",
      },
      {
        label: "距离比 λ",
        symbol: "\\lambda = \\frac{|PA|}{|PB|}",
        value: formatMathNumber(res.ratioP),
      },
      {
        label: "动点距离 |PA|",
        symbol: "|PA|",
        value: formatMathNumber(res.distPA),
      },
      {
        label: "动点距离 |PB|",
        symbol: "|PB|",
        value: formatMathNumber(res.distPB),
      },
    );

    if (!res.isDegenerate) {
      quantities.push(
        {
          label: "内分点 D 坐标",
          symbol: "D",
          value: `(${formatMathNumber(res.pointD.x)}, 0)`,
        },
        {
          label: "外分点 E 坐标",
          symbol: "E",
          value: `(${formatMathNumber(res.pointE.x)}, 0)`,
        },
        {
          label: "阿圆圆心 $O_A$ 坐标",
          symbol: "O_A",
          value: `(${formatMathNumber(res.centerO.x)}, 0)`,
        },
        {
          label: "阿圆半径 $R_A$",
          symbol: "R_A",
          value: formatMathNumber(res.radiusR),
        },
      );

      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 轨迹建系与距离方程",
          detail: `以线段 $AB$ 中点为原点建立直角坐标系，定点坐标为 $A(-${formatMathNumber(halfD)}, 0), B(${formatMathNumber(halfD)}, 0)$。由题设距离比为 $\\lambda = ${formatMathNumber(lambda)}$ 列出动点方程。`,
          latex: `\\frac{|PA|}{|PB|} = ${formatMathNumber(lambda)} \\iff \\frac{(x + ${formatMathNumber(halfD)})^2 + y^2}{(x - ${formatMathNumber(halfD)})^2 + y^2} = (${formatMathNumber(lambda)})^2`,
          rubric: "采分点：规范建系并确立动点模长方程（3分）",
        },
        {
          step: 2,
          title: "建模联立 · 两边平方配方化简",
          detail: `去分母展开整理：$(\\lambda^2-1)x^2 - 2c(\\lambda^2+1)x + (\\lambda^2-1)y^2 + c^2(\\lambda^2-1) = 0$。两边除以 $\\lambda^2-1$ 并配方。`,
          latex: `\\left(x - ${formatMathNumber(res.centerO.x)}\\right)^2 + y^2 = (${formatMathNumber(res.radiusR)})^2`,
          rubric: "采分点：准确配方整理为圆的标准方程（4分）",
        },
        {
          step: 3,
          title: "求解反思 · 直径端点几何性质",
          detail: `阿圆圆心 $O_A = (${formatMathNumber(res.centerO.x)}, 0)$，半径 $R_A = ${formatMathNumber(res.radiusR)}$。内分点 $D$ 与外分点 $E$ 为圆的直径端点，且 $\\angle DPE = 90^\\circ$ 恒成立。`,
          latex: `D\\left(${formatMathNumber(res.pointD.x)}, 0\\right), \\quad E\\left(${formatMathNumber(res.pointE.x)}, 0\\right), \\quad |DE| = 2R_A = ${formatMathNumber(2 * res.radiusR)}`,
          rubric: "采分点：得出圆心、半径及内外分点（3分）",
        },
      );
    } else {
      warnings.push({
        text: "退化警示：当 $\\lambda = 1.0$ 时，动点 $P$ 到 $A, B$ 距离相等，阿波罗尼斯圆退化为线段 $AB$ 的中垂线 (直线 $x = 0$)，半径趋近于无穷大！",
        level: "danger",
      });

      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 临界比值判定",
          detail:
            "当距离比 $\\lambda = 1$ 时，动点 $P$ 满足 $|PA| = |PB|$，动点到两定点距离相等。",
          latex: "\\frac{|PA|}{|PB|} = 1 \\iff |PA| = |PB|",
          rubric: "采分点：判定比值为 1 的特殊几何意义（3分）",
        },
        {
          step: 2,
          title: "建模联立 · 代数消元退化",
          detail: `两边平方展开：$(x+${formatMathNumber(halfD)})^2 + y^2 = (x-${formatMathNumber(halfD)})^2 + y^2$，二次项全数消去。`,
          latex: `4 \\times (${formatMathNumber(halfD)}) x = 0 \\iff x = 0`,
          rubric: "采分点：两边消去二次项得出线性方程（4分）",
        },
        {
          step: 3,
          title: "求解反思 · 几何退化结论",
          detail:
            "轨迹退化为直线 $x = 0$（线段 $AB$ 的垂直平分线），此时无法构成封闭阿波罗尼斯圆，半径无穷大。",
          latex: "\\text{轨迹为线段 } AB \\text{ 的垂直平分线 } x = 0",
          rubric: "采分点：指出退化为垂直平分线（3分）",
        },
      );
    }
  } else {
    // combined 模式
    examAnchor = "新高考压轴母题 · 极化恒等式 × 阿氏圆综合求最值";
    const res = calcCombinedModel(bcLength, lambda, pointAngle);

    quantities.push(
      {
        label: "中点 M 坐标",
        symbol: "M",
        value: "(0, 0)",
        isInvariant: true,
        invariantNote: "AB中点为原点",
      },
      {
        label: "定长 |MB|",
        symbol: "|\\vec{MB}|",
        value: formatMathNumber(res.lenMB),
        isInvariant: true,
        invariantNote: "线段半长为定值",
      },
      {
        label: "中线长 |PM|",
        symbol: "|\\vec{PM}|",
        value: formatMathNumber(res.lenPM),
      },
      {
        label: "数量积 PA · PB",
        symbol: "\\vec{PA} \\cdot \\vec{PB}",
        value: formatMathNumber(res.dotProductP),
      },
      {
        label: "极化算值 |PM|² - |MB|²",
        symbol: "|\\vec{PM}|^2 - |\\vec{MB}|^2",
        value: formatMathNumber(res.dotProductViaPolar),
      },
      {
        label: "数量积最小值",
        symbol: "(\\vec{PA} \\cdot \\vec{PB})_{\\text{min}}",
        value: formatMathNumber(res.minDotProduct),
        highlight: "extreme",
      },
      {
        label: "数量积最大值",
        symbol: "(\\vec{PA} \\cdot \\vec{PB})_{\\text{max}}",
        value: Number.isFinite(res.maxDotProduct)
          ? formatMathNumber(res.maxDotProduct)
          : "+∞",
        highlight: "extreme",
      },
    );

    if (res.isDegenerate) {
      warnings.push({
        text: "临界警示：$\\lambda = 1.0$ 时轨迹为中垂线，$|PM|$ 可无限延伸，数量积存在最小值但无最大值！",
        level: "warning",
      });
    }

    const distOM = Math.abs(res.centerO.x);
    const minDistPM = Math.abs(distOM - res.radiusR);
    const maxDistPM = distOM + res.radiusR;

    reasoningSteps.push(
      {
        step: 1,
        title: "审题定法 · 极化恒等式降维",
        detail:
          "求阿氏圆上动点 $P$ 与两定点 $A, B$ 的数量积 $\\vec{PA}\\cdot\\vec{PB}$。取 $AB$ 中点 $M(0,0)$，应用极化恒等式将双矢积转化为单中线长 $|PM|$。",
        latex: `\\vec{PA} \\cdot \\vec{PB} = |\\vec{PM}|^2 - |\\vec{MB}|^2 = |\\vec{PM}|^2 - (${formatMathNumber(res.lenMB)})^2`,
        rubric: "采分点：应用极化恒等式实现变量降维（3分）",
      },
      {
        step: 2,
        title: "建模联立 · 圆外点到圆周距离区间",
        detail: res.isDegenerate
          ? "动点在垂直平分线上，$|PM| \\ge 0$，距离无上限。"
          : `定点 $M(0,0)$ 在阿氏圆外部，圆心距 $d_{OM} = |x_O| = ${formatMathNumber(distOM)}$，半径 $R_A = ${formatMathNumber(res.radiusR)}$。当且仅当 $P, M, O_A$ 三点共线时取得距离极值。`,
        latex: res.isDegenerate
          ? "|PM| \\in [0, +\\infty)"
          : `|PM|_{\\min} = |d_{OM} - R_A| = ${formatMathNumber(minDistPM)}, \\quad |PM|_{\\max} = d_{OM} + R_A = ${formatMathNumber(maxDistPM)}`,
        rubric: "采分点：几何法确定中线 $|PM|$ 的取值范围（4分）",
      },
      {
        step: 3,
        title: "求解反思 · 数量积最值范围与取等条件",
        detail: res.isDegenerate
          ? `当 $P$ 为原点 $M(0,0)$ 时取最小值，最值为 $-${formatMathNumber(res.lenMB * res.lenMB)}$，无最大值。`
          : `将中线极值代入极化公式：动点 $P$ 位于内分点 $D$ 时取得最小值，位于外分点 $E$ 时取得最大值。`,
        latex: res.isDegenerate
          ? `(\\vec{PA} \\cdot \\vec{PB}) \\in \\left[-${formatMathNumber(res.lenMB * res.lenMB)}, +\\infty\\right)`
          : `(\\vec{PA} \\cdot \\vec{PB})_{\\min} = ${formatMathNumber(res.minDotProduct)}, \\quad (\\vec{PA} \\cdot \\vec{PB})_{\\max} = ${formatMathNumber(res.maxDotProduct)}`,
        rubric: "采分点：准确代入并规范书写最值结论（3分）",
      },
    );
  }

  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];

  if (studyMode === "polarization") {
    theorems.push(
      {
        name: "向量极化恒等式 (Polarization Identity)",
        latex:
          "\\vec{a} \\cdot \\vec{b} = \\frac{1}{4}\\left(|\\vec{a}+\\vec{b}|^2 - |\\vec{a}-\\vec{b}|^2\\right) = |\\vec{AM}|^2 - |\\vec{BM}|^2",
        prerequisites: [
          "$M$ 为线段 $BC$ 的中点，$AM$ 为三角形中线",
          "将双矢量数量积完全转化为单线段中线长 $|AM|$ 的最值问题",
        ],
        level: "core",
      },
      {
        name: "数量积正负号几何判据 (钝角/直角/锐角)",
        latex:
          "\\vec{AB} \\cdot \\vec{AC} > 0 \\iff |\\vec{AM}| > |\\vec{BM}|, \\quad \\vec{AB} \\cdot \\vec{AC} = 0 \\iff |\\vec{AM}| = |\\vec{BM}|",
        prerequisites: [
          "直角三角形时中线等于斜边一半，数量积为零",
          "中线长小于半底长对应钝角三角形，数量积为负",
        ],
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "极化恒等式核心通法：在解非坐标系下的向量数量积题目时，只要题设包含两定点一动点，立刻连结两定点中点 $M$！将 $\\vec{AB} \\cdot \\vec{AC}$ 化为 $|AM|^2 - |BM|^2$ 实现变量降维。",
        importance: "gaokao",
      },
      {
        text: "数形结合定最值：底边定长时 $|\vec{BM}|$ 恒为定值，数量积最值完全等价于中线长 $|\vec{AM}|$ 的几何极值，常与圆的切线、二次函数极值或抛物线轨迹联立考察。",
        importance: "core",
      },
    );
  } else if (studyMode === "apollonius") {
    theorems.push(
      {
        name: "阿波罗尼斯圆定理 (Circle of Apollonius)",
        latex:
          "\\frac{|PA|}{|PB|} = \\lambda \\quad (\\lambda > 0, \\lambda \\neq 1)",
        prerequisites: [
          "平面内到两定点 $A, B$ 的距离之比为常数 $\\lambda (\\lambda \\neq 1)$ 的动点 $P$ 的轨迹为圆",
          "圆心 $O_A = \\left(\\frac{c(\\lambda^2+1)}{\\lambda^2-1}, 0\\right)$，半径 $R_A = \\frac{2c\\lambda}{|\\lambda^2-1|}$",
        ],
        level: "core",
      },
      {
        name: "角平分线与直径正交定理 (初高中衔接)",
        latex: "\\angle DPE = 90^\\circ \\iff PD \\perp PE",
        prerequisites: [
          "内分点 $D$ 与外分点 $E$ 分别为 $\\angle APB$ 的内角与外角平分线端点",
          "互补两角的一半相加恒为直角，故 $DE$ 必为阿波罗尼斯圆的直径",
        ],
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "阿波罗尼斯圆速求通法：距离比 $\\lambda \\neq 1$ 轨迹必然是圆！圆心在两定点连线上，直径两端点即为内分点 $D$ 和外分点 $E$，由 $x_D = \\frac{c(\\lambda-1)}{\\lambda+1}, x_E = \\frac{c(\\lambda+1)}{\\lambda-1}$ 快速口算圆心与半径。",
        importance: "gaokao",
      },
      {
        text: "退化临界防坑防漏：当 $\\lambda = 1.0$ 时两定点距离相等，轨迹退化为线段 $AB$ 的垂直平分线，属于新高考多选题常见分类讨论临界陷阱。",
        importance: "hard",
      },
    );
  } else {
    theorems.push(
      {
        name: "向量极化恒等式 (中线转化模型)",
        latex: "\\vec{PA} \\cdot \\vec{PB} = |\\vec{PM}|^2 - |\\vec{MB}|^2",
        prerequisites: [
          "动点 $P$ 在阿波罗尼斯圆上运动，$M$ 为定线段 $AB$ 的中点",
          "双矢量数量积完全转化为单线段中线长 $|PM|$ 的取值范围问题",
        ],
        level: "core",
      },
      {
        name: "极化恒等式 × 阿圆最值定理 (新高考综合推论)",
        latex:
          "(\\vec{PA} \\cdot \\vec{PB})_{\\text{min}/\\text{max}} = |\\vec{PM}|_{\\text{min}/\\text{max}}^2 - |\\vec{MB}|^2",
        prerequisites: [
          "当 $P, M, O_A$ 三点共线时，中线长 $|PM|$ 取得最值",
          "最小值对应圆内侧交点（内分点 $D$），最大值对应圆外侧交点（外分点 $E$）",
        ],
        level: "core",
      },
    );

    gaokaoPoints.push(
      {
        text: "双剑合璧压轴秒杀：求阿圆上动点 $P$ 到两定点 $A, B$ 的数量积 $\\vec{PA} \\cdot \\vec{PB}$ 取值范围，先算圆心距 $d_{OM} = |x_O|$，则最大中线为 $d_{OM} + R$，最小中线为 $|d_{OM} - R|$，代入极化公式即可一步秒杀。",
        importance: "gaokao",
      },
      {
        text: "正交垂直取等特征：当 $\\vec{PA} \\cdot \\vec{PB} = 0$ 时，三角形 $PAB$ 为直角三角形，动点 $P$ 落在以 $AB$ 为直径的圆与阿氏圆的交点上（$|PM| = c$）。",
        importance: "core",
      },
    );
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    examAnchor,
    mnemonic:
      "中线一拉极化现，阿圆比例定圆心；内分外分切直径，最值共线一眼明！",
  };
}
