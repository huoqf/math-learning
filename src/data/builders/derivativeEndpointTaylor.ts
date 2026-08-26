/**
 * src/data/builders/derivativeEndpointTaylor.ts
 * 构建端点效应与洛必达/泰勒拟合放缩的 MathPanel 看板数据 (完美 KaTeX 渲染与左右屏同步)
 */

import type { MathPanelData } from "../types";
import {
  calcEndpointEffect,
  calcLHopital,
  calcTaylorPolynomial,
  type EndpointFuncType,
  type TaylorBaseType,
} from "@/math/derivativeEndpointTaylor";

export function buildDerivativeEndpointTaylorPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const activeMode = (config?.activeMode as string) || "endpoint";

  if (activeMode === "endpoint") {
    const endpointType = (config?.endpointType as EndpointFuncType) || "exp";
    const a = params.a ?? 1.2;
    const res = calcEndpointEffect(endpointType, a);

    const funcLatexName =
      endpointType === "exp"
        ? "f(x) = e^x - a x - 1"
        : endpointType === "ln"
          ? "f(x) = \\ln(x+1) - a x"
          : "f(x) = x\\ln x - a(x-1)";

    return {
      quantities: [
        {
          label: "当前研究函数 $f(x)$",
          value: funcLatexName,
        },
        {
          label: "端点位置 $x_0$",
          value: `x_0 = ${res.x0.toFixed(2)}`,
        },
        {
          label: "端点一阶导 $f'(x_0)$",
          value: `f'(${res.x0}) = ${res.df0.toFixed(3)}`,
          color: res.isNecessaryValid ? "#059669" : "#EF4444",
        },
        {
          label: "端点二阶导 $f''(x_0)$",
          value: `f''(${res.x0}) = ${res.d2f0.toFixed(2)}`,
        },
        {
          label: "参数 $a$ 与临界界限",
          value: `a = ${a.toFixed(2)} \\quad \\text{(临界 } a = 1.00\\text{)}`,
          color: res.isSufficientValid ? "#059669" : "#EF4444",
        },
      ],
      theorems: [
        {
          name: `${endpointType === "exp" ? "指数" : endpointType === "ln" ? "对数" : "超越混合"}模型端点效应`,
          latex:
            endpointType === "exp"
              ? "e^x - ax - 1 \\ge 0 \\implies f'(0) = 1 - a \\ge 0 \\implies a \\le 1"
              : endpointType === "ln"
                ? "\\ln(x+1) - ax \\le 0 \\implies f'(0) = 1 - a \\le 0 \\implies a \\ge 1"
                : "x\\ln x - a(x-1) \\ge 0 \\implies f'(1) = 1 - a \\ge 0 \\implies a \\le 1",
          note: `当前选择${endpointType === "exp" ? "指数切线模型" : endpointType === "ln" ? "对数切线模型" : "超越混合模型"}，端点一阶导数 $f'(x_0)$ 决定恒成立必要条件。`,
        },
        {
          name: "端点高阶导数判断法",
          latex:
            "f'(x_0) = 0, \\, f''(x_0) > 0 \\implies x_0 \\text{ 为局部极小值点}",
          note: "当一阶导数为零临界时，考察二阶导数 $f''(x_0)$ 符号验证局部凹凸性与恒成立充分性。",
        },
      ],
      gaokaoPoints: [
        {
          text: "新高考导数压轴端点效应三步破题法：①取端点 $x_0$ 求必要条件 $f'(x_0) \\ge 0$ 范围；②考察临界值二阶导；③代回检验充分性。",
          importance: "gaokao",
        },
        {
          text: "含参超越函数分类讨论：端点效应能将全域不等式讨论简化为端点极值分析，大幅节省考试计算量。",
          importance: "hard",
        },
      ],
      warnings: res.isSufficientValid
        ? []
        : [
            {
              text: `必要条件失效警告：当前 $a = ${a.toFixed(2)} > 1.0$，端点一阶导数 $f'(${res.x0}) = ${res.df0.toFixed(3)} < 0$，切线向右下方倾斜，在 $x>${res.x0}$ 邻域内 $f(x) < 0$，恒成立被破坏！`,
              level: "danger",
            },
          ],
      mnemonic:
        "端点必要先探究，斜率小于零必毁；临界二阶显神威，代回检验保安全。",
    };
  } else if (activeMode === "lhopital") {
    const xCurr = params.xCurr ?? 0.5;
    const res = calcLHopital(xCurr);

    return {
      quantities: [
        {
          label: "目标 $\\frac{0}{0}$ 未定式",
          value: "\\lim_{x \\to 0} \\frac{e^x - 1 - x}{x^2}",
        },
        {
          label: "动点坐标 $x$",
          value: `x = ${res.xCurr.toFixed(3)}`,
        },
        {
          label: "分子 $N(x)$ / 分母 $D(x)$",
          value: `\\frac{N(x)}{D(x)} = \\frac{${res.numVal.toFixed(3)}}{${res.denVal.toFixed(3)}} = ${res.ratioVal.toFixed(4)}`,
        },
        {
          label: "一阶导数比 $N'(x)/D'(x)$",
          value: `\\frac{e^x - 1}{2x} = ${res.ratioDerivVal.toFixed(4)}`,
        },
        {
          label: "洛必达极限值 $L$",
          value: `L = \\lim_{x \\to 0} \\frac{N'(x)}{D'(x)} = \\frac{1}{2}`,
          color: "#2563EB",
        },
      ],
      theorems: [
        {
          name: "洛必达法则 (L'Hôpital's Rule)",
          latex:
            "\\lim_{x \\to x_0} \\frac{N(x)}{D(x)} = \\lim_{x \\to x_0} \\frac{N'(x)}{D'(x)} = \\frac{N''(x_0)}{D''(x_0)}",
          note: "若 $N(x_0) = D(x_0) = 0$ 且导数比极限存在，则原商的极限等于分子分母分别求导后的极限。",
        },
        {
          name: "高考答题规范：导数定义法替换",
          latex: "\\lim_{x \\to 0} \\frac{e^x - 1}{x} = (e^x)'\\Big|_{x=0} = 1",
          note: "【阅卷避坑】大题书写避免直接写‘由洛必达法则’，宜用导数定义式或构造辅助差函数放缩得分。",
        },
      ],
      gaokaoPoints: [
        {
          text: "草稿秒算与卷面避坑：分离参数遇 $\\frac{0}{0}$ 未定式时，草稿纸用洛必达快速锁定参数临界；卷面作答使用导数定义或差函数充分性证明。",
          importance: "gaokao",
        },
        {
          text: "隐零点与极限逼近：当导数零点 $x_0$ 无法显式求解且 $x_0 \\to 0$ 时，洛必达法则可快速给出代数式的极限渐近界。",
          importance: "hard",
        },
      ],
      warnings:
        Math.abs(xCurr) < 0.05
          ? [
              {
                text: "无限逼近未定点：当前 $x$ 极度接近 0，分子分母均趋近于 0，直观呈现 $\\frac{0}{0}$ 转化为导数比 $1/2$ 的过程！",
                level: "warning",
              },
            ]
          : [],
      mnemonic:
        "零比零型莫慌张，上下求导看极限；草稿洛氏秒临界，卷面导数保满分。",
    };
  } else {
    // taylor 拟合模式
    const taylorBase = (config?.taylorBase as TaylorBaseType) || "exp";
    const taylorOrder = (config?.taylorOrder as number) || 2;
    const x0 = params.x0 ?? 0;
    const res = calcTaylorPolynomial(taylorBase, taylorOrder, x0);

    const baseName =
      taylorBase === "exp"
        ? "f(x) = e^x"
        : taylorBase === "ln"
          ? "f(x) = \\ln(1+x)"
          : taylorBase === "sin"
            ? "f(x) = \\sin x"
            : "f(x) = \\cos x";

    return {
      quantities: [
        {
          label: "拟合超越基底 $f(x)$",
          value: baseName,
        },
        {
          label: "展开点 $x_0$ 与阶数 $n$",
          value: `x_0 = ${res.x0.toFixed(1)}, \\, n = ${res.order}`,
        },
        {
          label: "泰勒多项式 $P_n(x)$",
          value: res.latexFormula,
        },
        {
          label: "常用放缩不等式",
          value: res.scalingInequality,
          color: "#059669",
        },
      ],
      theorems: [
        {
          name: `${taylorBase === "exp" ? "指数" : taylorBase === "ln" ? "对数" : taylorBase === "sin" ? "正弦" : "余弦"}函数 ${taylorOrder} 阶泰勒展开`,
          latex: res.latexFormula,
          note: `当前选用 ${res.order} 阶泰勒多项式在展开点 $x_0 = ${res.x0.toFixed(1)}$ 附近对 $f(x)$ 进行局部拟合。`,
        },
        {
          name: "四大超越函数放缩核源头",
          latex:
            "e^x \\ge 1+x+\\frac{1}{2}x^2, \\quad \\ln(1+x) \\le x-\\frac{1}{2}x^2+\\frac{1}{3}x^3, \\quad \\sin x \\ge x-\\frac{1}{6}x^3",
          note: "高考压轴放缩题中切线放缩（1阶）与抛物线放缩（2阶）的统一数学来源。",
        },
      ],
      gaokaoPoints: [
        {
          text: "泰勒拟合与多项式放缩：新高考大题常考用 $e^x \\ge 1+x$ 或 $e^x \\ge 1+x+\\frac{1}{2}x^2$ 放缩证明数列和不等式，掌握泰勒展开可秒懂放缩式来源。",
          importance: "gaokao",
        },
        {
          text: "高考大题证明规范：卷面上若使用高阶放缩（如 $e^x \\ge 1+x+\\frac{1}{2}x^2$），需单设辅助函数 $g(x) = e^x - (1+x+\\frac{1}{2}x^2)$，通过两次求导证明 $g(x) \\ge 0$。",
          importance: "gaokao",
        },
      ],
      warnings: [],
      mnemonic:
        "超越拟合看泰勒，切线抛物层层递；残差包络夹逼紧，放缩不等秒破题。",
    };
  }
}
