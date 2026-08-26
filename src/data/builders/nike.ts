import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { colorize } from "../types";
import { solveNike, evalNikeAt } from "@/math/nike";
import { MATH_COLORS } from "@/theme";

const PARAM_COLORS = {
  a: MATH_COLORS.paramPrimary, // #EF4444
  b: MATH_COLORS.paramSecondary, // #D97706
  t: MATH_COLORS.paramTertiary, // #059669
};

export function buildNikePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const a = params.a ?? 1.0;
  const b = params.b ?? 4.0;
  const x0 = params.x0 ?? 3.0;
  const h = params.h ?? 0.0;
  const c = params.c ?? 0.0;

  const activeMode = (config?.activeMode as string) || "standard";

  const res = solveNike(a, b, h, c);
  const evalPt = evalNikeAt(a, b, h, c, x0);
  const col = colorize;

  const ca = PARAM_COLORS.a;
  const cb = PARAM_COLORS.b;
  const ct = PARAM_COLORS.t;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  let mnemonic =
    "对勾函数看系数，ab同号出对勾，极值根号b比a，均值不等双项相等。";

  // 1. 基本量组装
  let funcFormulaStr = "";
  if (h === 0 && c === 0) {
    const aPart = `${col(a.toFixed(1), ca)}x`;
    const bPart =
      b >= 0
        ? `+ \\frac{${col(b.toFixed(1), cb)}}{x}`
        : `- \\frac{${col(Math.abs(b).toFixed(1), cb)}}{x}`;
    funcFormulaStr = `y = ${col("a", ca)}x + \\frac{${col("b", cb)}}{x} = ${aPart} ${bPart}`;
  } else {
    const hPart =
      h >= 0
        ? `(x - ${col(h.toFixed(1), ct)})`
        : `(x + ${col(Math.abs(h).toFixed(1), ct)})`;
    const cPart =
      c >= 0
        ? `+ ${col(c.toFixed(1), ct)}`
        : `- ${col(Math.abs(c).toFixed(1), ct)}`;
    const bPart =
      b >= 0
        ? `+ \\frac{${col(b.toFixed(1), cb)}}{${hPart}}`
        : `- \\frac{${col(Math.abs(b).toFixed(1), cb)}}{${hPart}}`;
    funcFormulaStr = `y = ${col(a.toFixed(1), ca)}${hPart} ${cPart} ${bPart}`;
  }

  quantities.push({
    label: "函数解析式",
    value: funcFormulaStr,
  });

  quantities.push({
    label: "图像形态分类",
    value:
      res.curveType === "nike"
        ? "经典对勾型 (ab > 0)"
        : res.curveType === "streamer"
          ? "双曲飘带型 (ab < 0)"
          : res.curveType === "inverse_prop"
            ? "反比例退化型 (a = 0)"
            : res.curveType === "proportional"
              ? "正比例退化型 (b = 0)"
              : "常数退化型",
  });

  quantities.push({
    label: "渐近线方程",
    value: `x = ${h.toFixed(1)}, y = ${a.toFixed(1)}x ${c - a * h >= 0 ? "+" : "-"} ${Math.abs(c - a * h).toFixed(1)}`,
  });

  quantities.push({
    label: "奇偶性与对称中心",
    value: `${res.parityDescription}`,
  });

  quantities.push({
    label: "单调区间分布",
    value: `${res.monotonicityDescription}`,
  });

  if (evalPt.isValid) {
    quantities.push({
      label: `探针动点 P(${x0.toFixed(1)}, f(${x0.toFixed(1)}))`,
      value: `P(${col(x0.toFixed(2), ct)}, \\; ${col(evalPt.y.toFixed(2), ct)})`,
    });
    quantities.push({
      label: "点 P 处切线斜率 k",
      value: `k = f'(${x0.toFixed(1)}) = ${evalPt.derivative.toFixed(2)}`,
    });
  }

  // 2. 定理与高考考点组装
  if (activeMode === "amgm") {
    mnemonic = "一正二定三相等，均值不等拆项巧，ax等于b比x，和值极小勾底现。";
    theorems.push({
      name: "基本不等式（均值不等式）",
      latex: `\\text{若 } ${col("a", ca)}>0, ${col("b", cb)}>0, x>0, \\text{ 则 } ${col("a", ca)}x + \\frac{${col("b", cb)}}{x} \\ge 2\\sqrt{${col("a", ca)}${col("b", cb)}}`,
      prerequisites: ["a > 0", "b > 0", "x > 0"],
      note: "当且仅当 $ax = \\frac{b}{x}$ (即 $x = \\sqrt{\\frac{b}{a}}$) 时等号成立",
    });

    if (a > 0 && b > 0) {
      const minX = Math.sqrt(b / a);
      const minY = 2 * Math.sqrt(a * b);
      quantities.push({
        label: "均值不等式最小值",
        value: `y_{\\min} = 2\\sqrt{${a.toFixed(1)} \\times ${b.toFixed(1)}} = ${minY.toFixed(2)} \\quad (x = ${minX.toFixed(2)})`,
      });
    }

    gaokaoPoints.push({
      text: "高考高频：均值不等式求最值与配凑法。将分式变形为 $y = ax + \\frac{b}{x-h} + c$ 形式，利用均值不等式求解最值，严格检验等号成立条件。",
      importance: "gaokao",
    });
  } else if (activeMode === "shifted") {
    mnemonic = "渐近交点为中心，平移h与平移c，双曲性质全保留，图象变换看对应。";
    if (Math.abs(a) < 1e-4) {
      // 线性分式平移型
      theorems.push({
        name: "分式线性函数（反比例平移）定理",
        latex: `f(x) = \\frac{Ax + B}{Cx + D} = \\frac{A}{C} + \\frac{B - \\frac{AD}{C}}{C\\left(x + \\frac{D}{C}\\right)} = k_0 + \\frac{k_1}{x - h}`,
        prerequisites: ["C ≠ 0", "AD - BC ≠ 0"],
        note: `中心对称点为 $(h, k_0) = (${h.toFixed(1)}, ${c.toFixed(1)})$，两条渐近线为 $x = ${h.toFixed(1)}$ 与 $y = ${c.toFixed(1)}$`,
      });

      gaokaoPoints.push({
        text: "高考考点：分式线性函数 $y = \\frac{Ax+B}{Cx+D}$ 的图象与对称性。通过分离常数法化为 $y = k_0 + \\frac{k_1}{x-h}$，快速求出对称中心 $(-\\frac{D}{C}, \\frac{A}{C})$ 与单调区间。",
        importance: "gaokao",
      });
    } else if (a * b > 0) {
      // 二次分式对勾型
      theorems.push({
        name: "二次分式分离常数化对勾模型定理",
        latex: `f(x) = \\frac{x^2 + px + q}{x - h} = (x - h) + (p + 2h) + \\frac{h^2 + ph + q}{x - h}`,
        prerequisites: ["x ≠ h", "分子系数 b > 0"],
        note: `转化为平移对勾函数，对称中心为 $(${h.toFixed(1)}, ${c.toFixed(1)})$，斜渐近线为 $y = ${a.toFixed(1)}(x - ${h.toFixed(1)}) + ${c.toFixed(1)}$`,
      });

      gaokaoPoints.push({
        text: "高考考点：二次分式 $y = \\frac{x^2+px+q}{x-h}$ 的值域与最值。通过分离常数法化为平移对勾模型，利用换元法 $u = x - h$ 结合基本不等式或导数求解最值与单调性。",
        importance: "gaokao",
      });
    } else {
      // 二次分式飘带型
      theorems.push({
        name: "二次分式分离常数化飘带双曲定理",
        latex: `f(x) = \\frac{x^2 + px + q}{x - h} = (x - h) + (p + 2h) - \\frac{|b|}{x - h}`,
        prerequisites: ["x ≠ h", "分子系数 b < 0"],
        note: `转化为平移双曲飘带型，在 $(-\\infty, ${h.toFixed(1)})$ 和 $(${h.toFixed(1)}, +\\infty)$ 上严格单调递增，全域无极值点`,
      });

      gaokaoPoints.push({
        text: "高考考点：双曲飘带分式函数 $y = \\frac{x^2+px+q}{x-h}$ 的单调性应用。由于导数在定义域内恒大于 0，函数全域无极值，常考方程根的存在性与参数范围求解。",
        importance: "gaokao",
      });
    }
  } else {
    // standard
    if (a * b > 0) {
      theorems.push({
        name: "对勾函数极值与单调性定理",
        latex: `f(x) = ${col("a", ca)}x + \\frac{${col("b", cb)}}{x} \\implies f'(x) = ${col("a", ca)} - \\frac{${col("b", cb)}}{x^2} = 0`,
        prerequisites: ["a · b > 0", "x ≠ 0"],
        note: `在 $x = \\pm\\sqrt{\\frac{b}{a}}$ 处分别取得极值，第一象限驻点 $x = ${Math.sqrt(b / a).toFixed(2)}$`,
      });
    } else if (a * b < 0) {
      theorems.push({
        name: "双曲飘带型函数单调性定理",
        latex: `f(x) = ${col("a", ca)}x + \\frac{${col("b", cb)}}{x} \\implies f'(x) = ${col("a", ca)} - \\frac{${col("b", cb)}}{x^2} ${a > 0 ? "> 0" : "< 0"}`,
        prerequisites: ["a · b < 0", "x ≠ 0"],
        note: `导数恒${a > 0 ? "正" : "负"}，函数在 $(-\\infty, 0)$ 和 $(0, +\\infty)$ 上均为单调${a > 0 ? "递增" : "递减"}，全域无极值点`,
      });
    } else {
      theorems.push({
        name: "退化函数性质定理",
        latex:
          a === 0
            ? `f(x) = \\frac{${col("b", cb)}}{x}`
            : `f(x) = ${col("a", ca)}x`,
        prerequisites: [
          a === 0 ? "a = 0 (退化为反比例)" : "b = 0 (退化为正比例)",
        ],
        note: "退化为初等基础函数形态",
      });
    }

    gaokaoPoints.push({
      text: "高考考点：对勾与双曲型函数的单调性与闭区间最值。结合导数正负与极值点位置，在有限闭区间 $[m, n]$ 上进行分类讨论求参数范围。",
      importance: "gaokao",
    });
  }

  // 3. 退化警示
  if (res.isDegenerate) {
    if (res.degenerationType === "a_zero") {
      warnings.push({
        text: "警告：斜率 a = 0，斜渐近线降维，对勾函数退化为反比例函数 y = b/x。",
        level: "warning",
      });
    } else if (res.degenerationType === "b_zero") {
      warnings.push({
        text: "警告：分子 b = 0，反比例项消失，对勾函数退化为正比例一次函数 y = ax。",
        level: "warning",
      });
    } else {
      warnings.push({
        text: "危险：a = 0 且 b = 0，函数退化为常数零函数。",
        level: "danger",
      });
    }
  }

  if (Math.abs(x0 - h) < 1e-3) {
    warnings.push({
      text: `危险：探针动点处于渐近线 x = ${h} 无意义位置，函数在该点无定义！`,
      level: "danger",
    });
  }

  return { quantities, theorems, gaokaoPoints, warnings, mnemonic };
}
