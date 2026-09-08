/**
 * src/data/builders/derivativeEndpointTaylor.ts
 * 构建端点效应与洛必达/泰勒拟合放缩的 MathPanel 看板数据 (完美 KaTeX 渲染与左右屏同步)
 */

import type { MathPanelData } from "../types";
import { MATH_COLORS } from "@/theme";
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
        ? `f(x) = e^x - \\color{${MATH_COLORS.paramPrimary}}{a} x - 1 \\ge 0 \\quad (x \\ge 0)`
        : endpointType === "ln"
          ? `f(x) = \\ln(x+1) - \\color{${MATH_COLORS.paramPrimary}}{a} x \\le 0 \\quad (x \\ge 0)`
          : `f(x) = x\\ln x - \\color{${MATH_COLORS.paramPrimary}}{a}(x-1) \\ge 0 \\quad (x \\ge 1)`;

    return {
      quantities: [
        {
          label: "研究函数与题设条件",
          value: funcLatexName,
        },
        {
          label: "端点位置 $x_0$",
          value: `x_0 = ${res.x0.toFixed(2)}`,
        },
        {
          label: "端点一阶导 $f'(x_0)$",
          value: `f'(${res.x0}) = ${res.df0.toFixed(3)}`,
          color: res.isNecessaryValid
            ? MATH_COLORS.focusPoint
            : MATH_COLORS.vectorResult,
        },
        {
          label: "端点二阶导 $f''(x_0)$",
          value: `f''(${res.x0}) = ${res.d2f0.toFixed(2)}`,
        },
        {
          label: "斜率参数 $a$ 与临界判定",
          value: `a = ${a.toFixed(2)} \\quad (\\text{临界 } a = 1.00)`,
          color: res.isSufficientValid
            ? MATH_COLORS.focusPoint
            : MATH_COLORS.vectorResult,
        },
      ],
      theorems: [
        {
          name: "新高考压轴两步答题法：必要探路 + 充分证明",
          latex:
            endpointType === "exp"
              ? "\\text{① 必要性：} f'(0)=1-a \\ge 0 \\implies a \\le 1; \\quad \\text{② 充分性：当 } a \\le 1 \\text{ 时证明 } f(x) \\ge 0"
              : endpointType === "ln"
                ? "\\text{① 必要性：} f'(0)=1-a \\le 0 \\implies a \\ge 1; \\quad \\text{② 充分性：当 } a \\ge 1 \\text{ 时证明 } f(x) \\le 0"
                : "\\text{① 必要性：} f'(1)=1-a \\ge 0 \\implies a \\le 1; \\quad \\text{② 充分性：当 } a \\le 1 \\text{ 时证明 } f(x) \\ge 0",
          note: "【高考阅卷采分点】卷面必须完成充分性证明，严禁求得必要范围后直接下结论（否则扣 4~6 分）。",
        },
        {
          name: "二阶导数凹凸性与充分性验证链",
          latex:
            endpointType === "exp"
              ? "f''(x) = e^x > 0 \\implies f'(x) \\text{ 单调递增} \\implies f'(x) \\ge f'(0) = 1-a \\ge 0 \\implies f(x) \\ge f(0) = 0"
              : endpointType === "ln"
                ? "f''(x) = -\\frac{1}{(x+1)^2} < 0 \\implies f'(x) \\le f'(0) = 1-a \\le 0 \\implies f(x) \\le f(0) = 0"
                : "f''(x) = \\frac{1}{x} > 0 \\implies f'(x) \\ge f'(1) = 1-a \\ge 0 \\implies f(x) \\ge f(1) = 0",
          note: "充分性证明标准写法：利用二阶导数符号判定导函数单调性，一气呵成证明不等式在全域恒成立。",
        },
      ],
      gaokaoPoints: [
        {
          text: "新高考导数压轴端点效应标准化流程：①取端点求必要条件锁定参数边界；②大题分步验证充分性（临界值与非临界值）；③二阶导判凹凸。",
          importance: "gaokao",
        },
        {
          text: "阅卷防扣分警示：在解答题中仅写必要条件得出的参数范围只能拿到步骤分，必须补全单调性证明闭环才能拿满分。",
          importance: "hard",
        },
      ],
      warnings: res.isSufficientValid
        ? []
        : [
            {
              text: `必要条件失效警告：当前 a = ${a.toFixed(2)}，端点一阶导数 f'(${res.x0}) = ${res.df0.toFixed(3)} 不满足单调导数要求，切线穿越函数，在端点右侧邻域内题设恒成立被破坏！`,
              level: "danger",
            },
          ],
      mnemonic:
        "端点必要先探路，斜率穿透必失效；充分证明不能少，二阶单调保满分。",
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
          label: "逼近动点坐标 $x$",
          value: `x = ${res.xCurr.toFixed(3)}`,
        },
        {
          label: "比值 $\\frac{N(x)}{D(x)}$",
          value: `\\frac{e^x - 1 - x}{x^2} = ${res.ratioVal.toFixed(4)}`,
        },
        {
          label: "一阶导数商 $\\frac{N'(x)}{D'(x)}$",
          value: `\\frac{e^x - 1}{2x} = ${res.ratioDerivVal.toFixed(4)}`,
        },
        {
          label: "洛必达极限值 $L$",
          value: `L = \\lim_{x \\to 0} \\frac{e^x - 1}{2x} = \\frac{1}{2}`,
          color: MATH_COLORS.function,
        },
      ],
      theorems: [
        {
          name: "草稿纸探路神器：洛必达法则 (L'Hôpital's Rule)",
          latex:
            "\\lim_{x \\to 0} \\frac{e^x - 1 - x}{x^2} = \\lim_{x \\to 0} \\frac{e^x - 1}{2x} = \\lim_{x \\to 0} \\frac{e^x}{2} = \\frac{1}{2}",
          note: "若 $N(0)=D(0)=0$ 且导数商极限存在，上下分别求导可瞬间秒算参数临界界限。",
        },
        {
          name: "高考卷面答题规范：导数定义法替换",
          latex:
            "\\lim_{x \\to 0} \\frac{e^x - 1}{2x} = \\frac{1}{2} \\lim_{x \\to 0} \\frac{e^x - e^0}{x - 0} = \\frac{1}{2}(e^x)'\\Big|_{x=0} = \\frac{1}{2}",
          note: "【卷面避坑】高考大题严禁裸写‘由洛必达法则’；规范写法是化为导数定义式或单设辅助差函数直接求导验证充分性。",
        },
      ],
      gaokaoPoints: [
        {
          text: "草稿秒算与卷面合规双轨法：草稿纸用洛必达法则在30秒内锁定分离参数临界值；答题卷上用导数定义或差函数充分性证明。",
          importance: "gaokao",
        },
        {
          text: "参数分离未定式：当求参数范围遇 $a \\le \\frac{f(x)}{g(x)}$ 且 $x \\to 0$ 时，洛必达极限值即为参数 $a$ 的最值临界点。",
          importance: "hard",
        },
      ],
      warnings:
        Math.abs(xCurr) < 0.05
          ? [
              {
                text: "极度接近未定点：当前 x 逼近 0，直观呈现 0/0 转化为导数比极限 1/2 的全过程！",
                level: "warning",
              },
            ]
          : [],
      mnemonic:
        "零比零型莫慌张，上下求导看极限；草稿洛氏秒临界，卷面导数保满分。",
    };
  } else {
    // 麦克劳林级数拟合模式
    const taylorBase = (config?.taylorBase as TaylorBaseType) || "exp";
    const taylorOrder = (config?.taylorOrder as number) || 2;
    const xTest = params.xTest ?? 1.0;
    const res = calcTaylorPolynomial(taylorBase, taylorOrder, xTest);

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
          label: "研究超越基底 $f(x)$",
          value: baseName,
        },
        {
          label: "麦克劳林多项式 $P_n(x)$",
          value: res.latexFormula,
        },
        {
          label: `测试动点 $x = ${res.xCurr.toFixed(2)}$ 处取值`,
          value: `f(${res.xCurr.toFixed(2)}) = ${res.fxVal.toFixed(3)}, \\; P_${res.order}(${res.xCurr.toFixed(2)}) = ${res.pxVal.toFixed(3)}`,
        },
        {
          label: "局部拟合绝对残差 $|R_n(x)|$",
          value: `|f(x) - P_${res.order}(x)| = ${res.residualVal.toFixed(4)}`,
          color:
            res.residualVal < 0.1
              ? MATH_COLORS.focusPoint
              : MATH_COLORS.paramPrimary,
        },
        {
          label: "高考压轴核心放缩不等式",
          value: res.scalingInequality,
          color: MATH_COLORS.focusPoint,
        },
      ],
      theorems: [
        {
          name: "新高考放缩不等式母体源头",
          latex: res.scalingInequality,
          note: `当前 ${res.order} 阶麦克劳林拟合在原点附近局部展开，阶数越高拟合精度越高，残差收敛越快。`,
        },
        {
          name: "高考大题规范证明差函数模板",
          latex: res.gaokaoProof,
          note: "高考大题证明规范：卷面严禁写‘由泰勒展开得’，必须构造差函数 $g(x) = f(x) - P_n(x)$，通过一阶或高阶求导证明 $g(x) \\ge 0$。",
        },
      ],
      gaokaoPoints: [
        {
          text: "放缩不等式的命题渊源：新高考大题常考用 $e^x \\ge 1+x$（切线放缩）或 $e^x \\ge 1+x+\\frac{1}{2}x^2$（抛物线放缩），掌握泰勒展开可秒懂命题人意图。",
          importance: "gaokao",
        },
        {
          text: "差函数证明通法：任何高阶泰勒放缩，在高考卷面上均通过“逐阶求导 + 符号回代”的方法严格论证，属于高考必备大题基本功。",
          importance: "gaokao",
        },
      ],
      warnings: [],
      mnemonic:
        "超越拟合看泰勒，切线抛物层层递；残差包络夹逼紧，差函数法秒破题。",
    };
  }
}
