import type { MathPanelData } from "../types";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  calcElimMethod,
  calcHomogMethod,
  calcOneSubstitution,
  calcSumProdMethod,
  type MultivarIneqMode,
} from "@/math/ineqMultivarExtrema";

export function buildIneqMultivarExtremaPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as MultivarIneqMode) || "oneSub";

  if (mode === "oneSub") {
    const res = calcOneSubstitution(
      params.coefP ?? 1,
      params.coefQ ?? 1,
      params.numM ?? 1,
      params.numN ?? 4,
      params.constC ?? 4,
      params.probeX ?? 1.2,
    );
    return {
      examAnchor: "必修一基本不等式 · 常数“1”的代换通法",
      mnemonic: "和为定值乘整体，展开交叉成倒数，一正二定三相等！",
      quantities: [
        {
          label: "目标表达式最小值",
          symbol: "T_{\\min}",
          value: formatMathNumber(res.minVal, 3),
          highlight: "positive",
          color: MATH_COLORS.inequality,
        },
        {
          label: "取等横坐标",
          symbol: "x^*",
          value: formatMathNumber(res.optX, 3),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "取等纵坐标",
          symbol: "y^*",
          value: formatMathNumber(res.optY, 3),
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "试探点当前目标值",
          symbol: "T(x_0, y_0)",
          value: formatMathNumber(res.probeVal, 3),
          color: MATH_COLORS.paramSecondary,
        },
      ],
      theorems: [
        {
          name: "常数“1”的代换乘积配凑定理",
          latex:
            "\\left(\\frac{m}{x}+\\frac{n}{y}\\right)\\cdot\\frac{px+qy}{c} \\ge \\frac{(\\sqrt{pm}+\\sqrt{qn})^2}{c}",
          condition:
            "适用前提：$x, y > 0$，且等号成立当且仅当 $\\frac{m q y}{x} = \\frac{n p x}{y}$ 并满足约束式 $px+qy=c$。",
          note: "交叉项 $\\frac{mqy}{x}$ 与 $\\frac{npx}{y}$ 的乘积恰好消去全部变量成为定值 $mnpq$。",
          level: "core",
        },
      ],
      warnings: [
        {
          text: "高频失分警告：绝对禁止分两次独立使用基本不等式（例如先放缩 $px+qy$ 再放缩分母），否则两次取等条件常常互相矛盾！",
          level: "danger",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 由约束线构造常数 1",
          detail:
            "将目标分式乘以恒等式 $\\frac{px+qy}{c} = 1$，展开生成倒数互消对。",
          latex: `T = \\frac{1}{${formatMathNumber(res.c, 1)}}(${formatMathNumber(res.p, 1)}x + ${formatMathNumber(res.q, 1)}y)\\left(\\frac{${formatMathNumber(res.m, 1)}}{x}+\\frac{${formatMathNumber(res.n, 1)}}{y}\\right)`,
        },
        {
          step: 2,
          title: "建模联立 · 展开交叉项套用基本不等式",
          detail: "保留常数项之和，对交叉倒数乘积应用 $A+B \\ge 2\\sqrt{AB}$。",
          latex: `T \\ge \\frac{(\\sqrt{pm}+\\sqrt{qn})^2}{c} = ${formatMathNumber(res.minVal, 3)}`,
        },
        {
          step: 3,
          title: "求解反思 · 检验取等条件与坐标",
          detail: "联立交叉项相等与约束方程，解出唯一正数取等坐标。",
          latex: `x^* = ${formatMathNumber(res.optX, 3)}, \\quad y^* = ${formatMathNumber(res.optY, 3)}`,
        },
      ],
      gaokaoPoints: [
        {
          text: "若约束方程右边不为 $1$（如 $2x+y=4$）或分母为 $x+1, y+2$，务必先进行整体配凑换元再乘以常数 $1$。",
          importance: "gaokao",
        },
      ],
    };
  }

  if (mode === "elim") {
    const res = calcElimMethod(
      params.elimA ?? 1,
      params.elimB ?? 1,
      params.constC ?? 4,
      params.probeX ?? 1.2,
    );
    return {
      examAnchor: "必修一基本不等式 · 凑因式消元降维法",
      mnemonic: "既有和又有积，添项凑成双括号，积定求和最小值！",
      quantities: [
        {
          label: "化归乘积定值",
          symbol: "(x+b)(y+a)",
          value: formatMathNumber(res.kVal, 2),
          color: MATH_COLORS.function,
        },
        {
          label: "x+y 理论最小值",
          symbol: "(x+y)_{\\min}",
          value: formatMathNumber(res.minSum, 3),
          highlight: "positive",
          color: MATH_COLORS.inequality,
        },
        {
          label: "取等横坐标",
          symbol: "x^*",
          value: formatMathNumber(res.optX, 3),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "试探点当前和",
          symbol: "x_0+y_0",
          value: formatMathNumber(res.probeSum, 3),
          color: MATH_COLORS.paramSecondary,
        },
      ],
      theorems: [
        {
          name: "双括号因式分解降维定理",
          latex: "xy + ax + by = c \\iff (x+b)(y+a) = c + ab",
          condition:
            "适用前提：$x, y > 0$ 且 $c + ab > 0$，保证 $x+b>0, y+a>0$。",
          note: "凑成两正因子积为定值后，直接使用 $(x+b)+(y+a) \\ge 2\\sqrt{c+ab}$ 即可一步求得 $(x+y)$ 的下界。",
          level: "core",
        },
      ],
      warnings:
        res.validity === "no_positive_opt"
          ? [
              {
                text: "正域边界提示：当前参数下取等点坐标落入非正区域，实际正实数域下界需另按边界单调性分析。",
                level: "warning",
              },
            ]
          : [
              {
                text: "注意检验 $x^* > 0$ 且 $y^* > 0$：若 $\\sqrt{c+ab} \\le \\max(a,b)$，则基本不等式取等点超出正实数可行域，不可盲目套用！",
                level: "warning",
              },
            ],
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 两边补项分解因式",
          detail: "在原混合方程两边同时加上 $ab$，拆出 $(x+b)(y+a)$ 结构。",
          latex: `(x + ${formatMathNumber(res.b, 1)})(y + ${formatMathNumber(res.a, 1)}) = ${formatMathNumber(res.kVal, 2)}`,
        },
        {
          step: 2,
          title: "建模联立 · 乘积定值求两因子和最小",
          detail: "把 $x+b$ 与 $y+a$ 整体视为两个正数套用基本不等式。",
          latex: `(x+b)+(y+a) \\ge 2\\sqrt{${formatMathNumber(res.kVal, 2)}}`,
        },
        {
          step: 3,
          title: "求解反思 · 减去偏移常数得 x+y 最小值",
          detail: "移项减去 $(a+b)$，并校核取等正数解。",
          latex: `x + y \\ge ${formatMathNumber(res.minSum, 3)} \\quad (x^*=${formatMathNumber(res.optX, 2)},\\; y^*=${formatMathNumber(res.optY, 2)})`,
        },
      ],
      gaokaoPoints: [
        {
          text: "除“因式分解法”外，亦可将 $y$ 直接反解为关于 $x$ 的分式函数 $y = \\frac{c-ax}{x+b}$，代入目标式化为平移对勾函数求解。",
          importance: "gaokao",
        },
      ],
    };
  }

  if (mode === "homog") {
    const res = calcHomogMethod(params.homogK ?? 4, params.ratioT ?? 1.5);
    return {
      examAnchor: "必修一基本不等式 · 齐次化比值换元法",
      mnemonic: "上下齐次除最高幂，二元瞬间变一元，对勾取等正根处！",
      quantities: [
        {
          label: "当前比值",
          symbol: "t = x/y",
          value: formatMathNumber(res.ratioT, 2),
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "目标函数当前值",
          symbol: "f(t)",
          value: formatMathNumber(res.currentVal, 3),
          color: MATH_COLORS.function,
        },
        {
          label: "齐次比最小值",
          symbol: "f_{\\min}",
          value: formatMathNumber(res.minVal, 3),
          highlight: "positive",
          color: MATH_COLORS.inequality,
        },
        {
          label: "最优比值",
          symbol: "t^*",
          value: formatMathNumber(res.optT, 3),
          color: MATH_COLORS.paramPrimary,
        },
      ],
      theorems: [
        {
          name: "二元齐次分式减元定理",
          latex:
            "\\frac{x^2 + k y^2}{xy} = \\frac{x}{y} + k \\frac{y}{x} = t + \\frac{k}{t} \\ge 2\\sqrt{k}",
          condition:
            "适用前提：$x, y > 0$ 且目标式分子分母各项总次数一致，令 $t = \\frac{x}{y} > 0$。",
          note: "若给定已知齐次条件如 $x^2+y^2=1$ 且所求式次数偏低，可乘以 $(x^2+y^2)$ 先统一齐次化后再除以 $y^2$ 换元。",
          level: "core",
        },
      ],
      warnings: [
        {
          text: "适用条件提醒：非齐次式切勿强行同除以 $y^2$！必须先用已知等式把常数或低次项升次齐次化。",
          level: "info",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 识别二元齐次结构并设比值元",
          detail:
            "分子分母同为二次齐次式，同除以 $xy$ 并设 $t = \\frac{x}{y} > 0$。",
          latex: `T = t + \\frac{${formatMathNumber(res.k, 1)}}{t}`,
        },
        {
          step: 2,
          title: "建模联立 · 应用基本不等式求解下界",
          detail: "因 $t > 0$，两项乘积消去 $t$ 为常数 $k$。",
          latex: `t + \\frac{${formatMathNumber(res.k, 1)}}{t} \\ge 2\\sqrt{${formatMathNumber(res.k, 1)}} = ${formatMathNumber(res.minVal, 3)}`,
        },
        {
          step: 3,
          title: "求解反思 · 验证取等比值位置",
          detail:
            "令两项相等解出取等比值 $t^* = \\sqrt{k}$ 并检验正实数可行域。",
          latex: `t^* = \\sqrt{${formatMathNumber(res.k, 1)}} = ${formatMathNumber(res.optT, 3)}`,
        },
      ],
      gaokaoPoints: [
        {
          text: "在椭圆或双曲线离心率、解三角形边角齐次最值中，设比值元 $t = a/b$ 是破题最快捷的通用手段之一。",
          importance: "gaokao",
        },
      ],
    };
  }

  // sumProd 模式
  const res = calcSumProdMethod(params.constC ?? 4, params.probeX ?? 1.2);
  return {
    examAnchor: "必修一基本不等式 · 和积互化消元法",
    mnemonic: "见和与积齐出现，积用和平方放缩，解二次不等式定界！",
    quantities: [
      {
        label: "约束右端常数",
        symbol: "c",
        value: formatMathNumber(res.c, 1),
        color: MATH_COLORS.function,
      },
      {
        label: "两数和的最小值",
        symbol: "(x+y)_{\\min}",
        value: formatMathNumber(res.minSum, 3),
        highlight: "positive",
        color: MATH_COLORS.inequality,
      },
      {
        label: "两数积的最大值",
        symbol: "(xy)_{\\max}",
        value: formatMathNumber(res.maxProd, 3),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "试探点当前和",
        symbol: "x_0+y_0",
        value: formatMathNumber(res.probeSum, 3),
        color: MATH_COLORS.paramSecondary,
      },
    ],
    theorems: [
      {
        name: "和积互化不等式链",
        latex:
          "xy \\le \\left(\\frac{x+y}{2}\\right)^2 \\iff x+y \\ge 2\\sqrt{xy}",
        condition: "适用前提：$x, y > 0$，且等号成立的充要条件均为 $x = y$。",
        note: "求 $x+y$ 范围时用 $\\left(\\frac{x+y}{2}\\right)^2$ 替掉 $xy$；求 $xy$ 范围时用 $2\\sqrt{xy}$ 替掉 $(x+y)$。",
        level: "core",
      },
    ],
    warnings: [
      {
        text: "放缩方向辨析：将 $xy$ 放大为 $\\frac{s^2}{4}$ 后必须保证不等号朝向一致，且解二次不等式后应舍去负根（因为 $s = x+y > 0$）。",
        level: "warning",
      },
    ],
    reasoningSteps: [
      {
        step: 1,
        title: "审题定法 · 确定保留主元与消去项",
        detail:
          "记 $s = x + y > 0$，利用均值不等式上界 $xy \\le \\frac{s^2}{4}$ 消去乘积项。",
        latex: `c = x+y+xy \\le s + \\frac{s^2}{4}`,
      },
      {
        step: 2,
        title: "建模联立 · 列出关于 s 的一元二次不等式",
        detail: `代入常数 $c = ${formatMathNumber(res.c, 1)}$ 整理为标准二次不等式。`,
        latex: `s^2 + 4s - 4(${formatMathNumber(res.c, 1)}) \\ge 0`,
      },
      {
        step: 3,
        title: "求解反思 · 结合 s > 0 得出正数下界",
        detail: "舍去负根得和的最小值，同时对对称形式立得积的上界。",
        latex: `(x+y)_{\\min} = ${formatMathNumber(res.minSum, 3)}, \\quad (xy)_{\\max} = ${formatMathNumber(res.maxProd, 3)}`,
      },
    ],
    gaokaoPoints: [
      {
        text: "注意“求 $x+y$ 最小值”与“求 $xy$ 最大值”虽在同一等式下，但方向恰相反——放缩方向选错会直接得到无界矛盾！",
        importance: "gaokao",
      },
    ],
  };
}
