import type { MathPanelData } from "../types";
import { MATH_COLORS } from "@/theme";
import {
  createComplex,
  modulus,
  argument,
  conjugate,
  addComplex,
  subComplex,
  mulComplex,
  fromPolar,
  formatComplexLatex,
  calcCircleLocusExtrema,
  calcPerpBisectorLocus,
  calcModulusTriangleInequality,
  expandComplexMultiply,
  rationalizeComplexDivision,
  powerOfI,
} from "@/math/complex";

export function buildComplexPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as string) || "plane-operations";

  if (mode === "plane-operations") {
    const a1 = params.a1 ?? 3;
    const b1 = params.b1 ?? 2;
    const a2 = params.a2 ?? 1;
    const b2 = params.b2 ?? 3;

    const z1 = createComplex(a1, b1);
    const z2 = createComplex(a2, b2);
    const zSum = addComplex(z1, z2);
    const zDiff = subComplex(z1, z2);
    const z1Conj = conjugate(z1);

    const mod1 = modulus(z1);
    const dist = modulus(zDiff);

    const warnings: MathPanelData["warnings"] = [];
    if (Math.abs(b1) < 1e-9) {
      warnings.push({
        text: "当虚部 $b_1 = 0$ 时，$z_1$ 退化为实数，在复平面上落在实轴（$x$ 轴）上。",
        level: "info",
      });
    }
    if (Math.abs(a1) < 1e-9 && Math.abs(b1) > 1e-9) {
      warnings.push({
        text: "当实部 $a_1 = 0$ 且虚部 $b_1 \\neq 0$ 时，$z_1$ 为纯虚数，落在虚轴（$y$ 轴）上。",
        level: "warning",
      });
    }

    return {
      quantities: [
        {
          label: "复数 $z_1$",
          symbol: "z_1",
          value: formatComplexLatex(z1),
          unit: "代数形式",
        },
        {
          label: "复数 $z_2$",
          symbol: "z_2",
          value: formatComplexLatex(z2),
          unit: "代数形式",
        },
        {
          label: "和 $z_1 + z_2$",
          symbol: "z_1 + z_2",
          value: formatComplexLatex(zSum),
          unit: "向量加法",
        },
        {
          label: "两点距离 $|z_1 - z_2|$",
          symbol: "|z_1 - z_2|",
          value: dist.toFixed(2),
          unit: "减法模长",
        },
        {
          label: "模长 $|z_1|$",
          symbol: "|z_1|",
          value: mod1.toFixed(2),
          unit: "$\\sqrt{a_1^2 + b_1^2}$",
        },
        {
          label: "共轭 $\\bar{z}_1$",
          symbol: "\\bar{z}_1",
          value: formatComplexLatex(z1Conj),
          unit: "关于实轴对称",
        },
      ],
      theorems: [
        {
          name: "复数的几何意义与向量对应",
          latex: `\\color{${MATH_COLORS.paramPrimary}}{z} = \\color{${MATH_COLORS.paramPrimary}}{a} + \\color{${MATH_COLORS.paramSecondary}}{b}i \\leftrightarrow Z(\\color{${MATH_COLORS.paramPrimary}}{a}, \\color{${MATH_COLORS.paramSecondary}}{b}) \\leftrightarrow \\vec{OZ} = (\\color{${MATH_COLORS.paramPrimary}}{a}, \\color{${MATH_COLORS.paramSecondary}}{b})`,
          prerequisites: ["$a, b \\in \\mathbb{R}$"],
          note: "复平面 $x$ 轴为实轴，$y$ 轴为虚轴。模长 $|z_1 - z_2|$ 代表两点 $Z_1, Z_2$ 欧氏距离。",
          level: "core",
        },
        {
          name: "共轭复数基本性质",
          latex: `z \\cdot \\bar{z} = |z|^2 = \\color{${MATH_COLORS.paramPrimary}}{a}^2 + \\color{${MATH_COLORS.paramSecondary}}{b}^2`,
          note: "$z + \\bar{z} = 2a \\in \\mathbb{R}$，且 $z - \\bar{z} = 2bi$",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【新高考通法·复数几何求解 3 步法】①设复数代数形式 z = a + bi (a, b ∈ ℝ)；②将 |z - z₀| = R 转化为复平面上以 Z₀ 为圆心、R 为半径的动点圆轨迹；③利用圆心距加减半径求解最值 |z - w|min = ||z₀ - w| - R|。",
          importance: "gaokao",
        },
        {
          text: "复数相等与分类：z₁ = z₂ ⇔ a₁ = a₂ 且 b₁ = b₂。复数不能比较大小，只能比较模 |z| 的大小。",
          importance: "gaokao",
        },
        {
          text: "距离模长模型：|z - z₁| 代表动点 z 到定点 z₁ 的欧氏距离。",
          importance: "core",
        },
      ],
      warnings,
      reasoningSteps: [
        {
          step: 1,
          title: "代数表示 · 复数写成 a + bi",
          detail: `由复数的代数形式，$z_1 = ${formatComplexLatex(z1)}$、$z_2 = ${formatComplexLatex(z2)}$，对应复平面上的点 $Z_1(${a1}, ${b1})$、$Z_2(${a2}, ${b2})$。`,
          latex: `z_1 = ${a1} + ${b1}i, \\quad z_2 = ${a2} + ${b2}i`,
          rubric: "采分点：写出两复数的代数形式（1分）",
        },
        {
          step: 2,
          title: "加减运算 · 实虚部分别合并",
          detail: `实部与实部、虚部与虚部分别相加：$z_1 + z_2 = (${a1} + ${a2}) + (${b1} + ${b2})i = ${formatComplexLatex(zSum)}$；相减同理。`,
          latex: `z_1 + z_2 = (${a1} + ${a2}) + (${b1} + ${b2})i = ${formatComplexLatex(zSum)}`,
          rubric: "采分点：按实虚部合并求复数加法（2分）",
        },
        {
          step: 3,
          title: "几何意义 · 差模长即两点距离",
          detail: `$z_1 - z_2$ 对应向量 $\\vec{Z_2 Z_1}$，其模长为两点欧氏距离 $|z_1 - z_2| = ${dist.toFixed(2)}$；由勾股关系，$|z_1| = ${mod1.toFixed(2)}$。`,
          latex: `|z_1 - z_2| = \\sqrt{(${a1 - a2})^2 + (${b1 - b2})^2} = ${dist.toFixed(2)}`,
          rubric: "采分点：用模长公式求两点距离（3分）",
        },
      ],
      mnemonic: "实部对实部，虚部对虚部；减法求距离，平行四边形。",
    };
  }

  if (mode === "multiplication-rotation") {
    const r1 = params.r1 ?? 2.0;
    const deg1 = params.deg1 ?? 30;
    const r2 = params.r2 ?? 1.5;
    const deg2 = params.deg2 ?? 60;

    const rad1 = (deg1 * Math.PI) / 180;
    const rad2 = (deg2 * Math.PI) / 180;

    const z1 = fromPolar(r1, rad1);
    const z2 = fromPolar(r2, rad2);
    const zProd = mulComplex(z1, z2);

    const prodMod = modulus(zProd);
    const prodArgDeg = (argument(zProd) * 180) / Math.PI;

    const warnings: MathPanelData["warnings"] = [];
    if (Math.abs(r2 - 1.0) < 1e-6) {
      warnings.push({
        text: "当 $r_2 = 1$ 时，$|z_2| = 1$，乘以 $z_2$ 保持模长不变，实现纯粹的平面刚体旋转变换！",
        level: "info",
      });
    }

    return {
      quantities: [
        {
          label: "被乘数 $z_1$",
          symbol: "z_1",
          value: `r_1=${r1.toFixed(1)}, \\theta_1=${deg1}^\\circ`,
          unit: "模长 $r_1$, 辐角 $\\theta_1$",
        },
        {
          label: "旋转算子 $z_2$",
          symbol: "z_2",
          value: `r_2=${r2.toFixed(1)}, \\theta_2=${deg2}^\\circ`,
          unit: "伸缩 $r_2$, 旋转 $\\theta_2$",
        },
        {
          label: "乘积模长 $|z_1 z_2|$",
          symbol: "|z_1 z_2|",
          value: prodMod.toFixed(2),
          unit: "模长相乘 $r_1 r_2$",
        },
        {
          label: "乘积辐角 $\\arg(z_1 z_2)$",
          symbol: "\\arg(z_1 z_2)",
          value: `${prodArgDeg.toFixed(1)}^\\circ`,
          unit: "辐角相加 $\\theta_1+\\theta_2$",
        },
        {
          label: "乘积代数形式 $z_1 z_2$",
          symbol: "z_1 z_2",
          value: formatComplexLatex(zProd),
        },
      ],
      theorems: [
        {
          name: "复数乘法的几何意义（旋转与伸缩）",
          latex:
            "z_1 z_2 = (r_1 r_2) [\\cos(\\theta_1 + \\theta_2) + i \\sin(\\theta_1 + \\theta_2)]",
          prerequisites: [
            "$z_1 = r_1(\\cos\\theta_1 + i\\sin\\theta_1), z_2 = r_2(\\cos\\theta_2 + i\\sin\\theta_2)$（复数的三角表示）",
          ],
          note: "模长相乘：$|z_1 z_2| = |z_1| \\cdot |z_2|$；辐角相加：$\\arg(z_1 z_2) = \\theta_1 + \\theta_2$（主辐角意义下允许相差 $2k\\pi$，$k \\in \\mathbb{Z}$）。",
          level: "supplementary",
          isExtension: true,
          extensionBadge: "拓展 · 选学",
        },
        {
          name: "复数除法的几何意义（逆向旋转）",
          latex:
            "\\frac{z_1}{z_2} = \\left(\\frac{r_1}{r_2}\\right) [\\cos(\\theta_1 - \\theta_2) + i \\sin(\\theta_1 - \\theta_2)]",
          prerequisites: ["$z_2 \\neq 0$"],
          note: "模长相除：$|z_1 / z_2| = r_1 / r_2$；辐角相减：$\\arg(z_1 / z_2) = \\theta_1 - \\theta_2$。",
          level: "important",
        },
        {
          name: "常见旋转算子特例",
          latex:
            "z \\cdot i \\text{ (逆时针 } 90^\\circ \\text{)}, \\quad z \\cdot (-1) \\text{ (逆时针 } 180^\\circ \\text{)}",
          note: "乘以 $i$ 逆时针旋转 $90^\\circ$；乘以 $-i$ 顺时针旋转 $90^\\circ$；乘以 $-1$ 中心对称旋转 $180^\\circ$。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "乘除法几何变换：乘以 $i$ 表示逆时针旋转 $90^\\circ$，除以 $i$ 表示顺时针旋转 $90^\\circ$。",
          importance: "gaokao",
        },
        {
          text: "棣莫弗定理启蒙：$z^n = r^n (\\cos n\\theta + i \\sin n\\theta)$，表示多次旋转与模长 $n$ 次幂。",
          importance: "extend",
        },
      ],
      warnings,
      reasoningSteps: [
        {
          step: 1,
          title: "化为三角形式",
          detail: `把两复数写成模长与辐角形式：$z_1$ 的模 $r_1 = ${r1.toFixed(1)}$、辐角 $\\theta_1 = ${deg1}^\\circ$；$z_2$ 的模 $r_2 = ${r2.toFixed(1)}$、辐角 $\\theta_2 = ${deg2}^\\circ$。`,
          latex: `z_1 = ${r1.toFixed(1)}\\left(\\cos ${deg1}^\\circ + i\\sin ${deg1}^\\circ\\right), \\quad z_2 = ${r2.toFixed(1)}\\left(\\cos ${deg2}^\\circ + i\\sin ${deg2}^\\circ\\right)`,
          rubric: "采分点：写出两复数的三角形式（2分）",
        },
        {
          step: 2,
          title: "乘法法则 · 模长相乘角相加",
          detail: `模长相乘、辐角相加：$|z_1 z_2| = r_1 r_2 = ${r1.toFixed(1)} \\times ${r2.toFixed(1)} = ${prodMod.toFixed(2)}$，$\\arg(z_1 z_2) = \\theta_1 + \\theta_2 = ${deg1}^\\circ + ${deg2}^\\circ = ${deg1 + deg2}^\\circ$。`,
          latex: `z_1 z_2 = ${r1.toFixed(1)} \\times ${r2.toFixed(1)}\\left[\\cos(${deg1}^\\circ + ${deg2}^\\circ) + i\\sin(${deg1}^\\circ + ${deg2}^\\circ)\\right]`,
          rubric: "采分点：用乘法法则求模长与辐角（3分）",
        },
        {
          step: 3,
          title: "几何解释 · 一次旋转伸缩",
          detail: `乘 $z_2$ 相当于把 $z_1$ 绕原点逆时针旋转 $${deg2}^\\circ$、模长伸缩为原来的 $${r2.toFixed(1)}$ 倍，得 $z_1 z_2 = ${formatComplexLatex(zProd)}$。图中显示的主辐角 $${prodArgDeg.toFixed(1)}^\\circ$ 与 $${deg1 + deg2}^\\circ$ 相差 $2k\\pi$，二者表征同一终边。`,
          latex: `|z_1 z_2| = ${prodMod.toFixed(2)}, \\quad \\arg(z_1 z_2) = ${deg1 + deg2}^\\circ + 2k\\pi`,
          rubric: "采分点：说明乘法的旋转伸缩几何意义（2分）",
        },
      ],
      mnemonic:
        "乘法几何真神奇，模长相乘角相加；乘以虚数单位 i，逆转直角九十度。",
    };
  }

  if (mode === "algebraic-operations") {
    const algebraicSub = (config?.subModel as string) || "multiply-divide";

    // ── 子情景 3：i^n 周期幂 ──
    if (algebraicSub === "power-cycle") {
      const powerN = params.powerN ?? 1;
      const cur = powerOfI(powerN);
      const next1 = powerOfI(powerN + 1);
      const next2 = powerOfI(powerN + 2);
      const next3 = powerOfI(powerN + 3);

      // 连续四项是 {i, -1, -i, 1} 的一个排列，其和恒为 0（高考分组求和的依据）
      const cycleSum = {
        re: cur.value.re + next1.value.re + next2.value.re + next3.value.re,
        im: cur.value.im + next1.value.im + next2.value.im + next3.value.im,
      };

      const warnings: MathPanelData["warnings"] = [];
      if (powerN < 0) {
        warnings.push({
          text: "指数取负整数时仍按同一周期理解：$i^{-1} = \\dfrac{1}{i} = -i$，对应余数 $3$，与 $i^3$ 完全一致。",
          level: "info",
        });
      }
      if (cur.residue === 0) {
        warnings.push({
          text: `当前 $n = ${powerN}$ 是 $4$ 的倍数，故 $i^{${powerN}} = 1$；练习时先算 $n \\bmod 4$ 再查表，比逐次相乘更快且不易错。`,
          level: "info",
        });
      }

      return {
        quantities: [
          {
            label: "幂指数 $n$",
            symbol: "n",
            value: `${powerN}`,
            unit: "整数（可为负）",
          },
          {
            label: "余数 $n \\bmod 4$",
            symbol: "n \\bmod 4",
            value: `${cur.residue}`,
            unit: "决定取哪一张「牌」",
          },
          {
            label: "当前幂 $i^n$",
            symbol: "i^n",
            value: cur.latex,
            unit: "查表所得",
          },
          {
            label: "下一项 $i^{n+1}$",
            symbol: "i^{n+1}",
            value: next1.latex,
          },
          {
            label: "再下一项 $i^{n+2}$",
            symbol: "i^{n+2}",
            value: next2.latex,
          },
          {
            label: "再下一项 $i^{n+3}$",
            symbol: "i^{n+3}",
            value: next3.latex,
          },
          {
            label: "连续四项之和",
            symbol: "\\sum_{k=0}^{3} i^{n+k}",
            value: `${cycleSum.re} + ${cycleSum.im}i`,
            unit: "$i-1-i+1 = 0$",
          },
        ],
        theorems: [
          {
            name: "虚数单位 i 的幂周期定理",
            latex:
              "i^{4k} = 1, \\quad i^{4k+1} = i, \\quad i^{4k+2} = -1, \\quad i^{4k+3} = -i \\quad (k \\in \\mathbb{Z})",
            prerequisites: ["$i^2 = -1$"],
            note: "$i$ 的幂以 $4$ 为周期循环：$i, -1, -i, 1$。求 $i^n$ 只需看 $n$ 除以 $4$ 的余数，不必逐次相乘。",
            level: "core",
          },
          {
            name: "连续四项之和为零",
            latex:
              "i^{n} + i^{n+1} + i^{n+2} + i^{n+3} = i + (-1) + (-i) + 1 = 0",
            note: "任意连续四项幂之和恒为 $0$，这是 $i + i^2 + \\cdots + i^{4m}$ 型分组求和的依据。",
            level: "important",
          },
        ],
        gaokaoPoints: [
          {
            text: "【新高考·i 的幂周期秒杀】求 $i^n$ 一律先算 $n \\bmod 4$ 的余数，再查「$0 \\to 1$、$1 \\to i$、$2 \\to -1$、$3 \\to -i$」表，避免逐次相乘链式出错。",
            importance: "gaokao",
          },
          {
            text: "【高频·周期分组求和】利用连续四项之和为 $0$ 的性质，$i + i^2 + \\cdots + i^{4m} = 0$，余下不足四项的项单独相加即可。",
            importance: "gaokao",
          },
          {
            text: "常用结论备忘录：$(1+i)^2 = 2i$，$(1-i)^2 = -2i$，$\\dfrac{1+i}{1-i} = i$，$\\dfrac{1}{i} = -i$，代入化简可大幅提速。",
            importance: "core",
          },
        ],
        warnings,
        reasoningSteps: [
          {
            step: 1,
            title: "周期观察 · 列出前四次幂找循环",
            detail:
              "由 $i^1 = i$、$i^2 = -1$、$i^3 = i^2 \\cdot i = -i$、$i^4 = i^2 \\cdot i^2 = 1$，可见四次幂之后回到 $i$。故 $i$ 的幂以 $4$ 为周期循环，取值只能是 $i, -1, -i, 1$ 四个之一。",
            latex: "i^1 = i, \\quad i^2 = -1, \\quad i^3 = -i, \\quad i^4 = 1",
            rubric: "采分点：写出前四次幂并指出周期为 4（2分）",
          },
          {
            step: 2,
            title: "化为带余形式 · 写成 4k + r",
            detail: `把指数写成 $n = 4k + r$（$k \\in \\mathbb{Z}$，$0 \\le r < 4$）。本组参数 $n = ${powerN}$，取整除法得 $r = ${cur.residue}$，即 $${powerN} = 4 \\times ${Math.floor(powerN / 4)} + ${cur.residue}$（负数按最小非负余数归一）。`,
            latex: `n = ${powerN} = 4k + r, \\quad r = ${cur.residue}`,
            rubric: "采分点：把指数化为 4k + r 并求出余数（3分）",
          },
          {
            step: 3,
            title: "查表定位 · 由余数写出结果",
            detail: `余数 $r = ${cur.residue}$ 对应 $i^{${powerN}} = ${cur.latex}$；其后三项依次为 $${next1.latex}$、$${next2.latex}$、$${next3.latex}$，四项之和为 $${cycleSum.re} + ${cycleSum.im}i = 0$，正是周期分组的落点。`,
            latex: `i^{${powerN}} = ${cur.latex}, \\quad i^{${powerN}} + i^{${powerN + 1}} + i^{${powerN + 2}} + i^{${powerN + 3}} = 0`,
            rubric: "采分点：由余数查表写出结果并说明四项和为零（2分）",
          },
        ],
        mnemonic:
          "虚数单位周期四，i、−1、−i、1 轮流转；求幂先算余数，余几就是第几张牌。",
      };
    }

    const a1 = params.a1 ?? 3;
    const b1 = params.b1 ?? 2;
    const a2 = params.a2 ?? 1;
    const b2 = params.b2 ?? 3;

    const z1 = createComplex(a1, b1);
    const z2 = createComplex(a2, b2);
    const expand = expandComplexMultiply(z1, z2);
    const zProd = createComplex(expand.re, expand.im);
    const divRes = rationalizeComplexDivision(z1, z2);

    // ── 子情景 2：共轭分母实数化（除法专项） ──
    if (algebraicSub === "conjugate-rationalize") {
      const z2Conj = conjugate(z2);

      const warnings: MathPanelData["warnings"] = [];
      if (!divRes.valid) {
        warnings.push({
          text: "除数 $z_2 = 0$，分母实数化得到 $c^2 + d^2 = 0$。$0$ 没有倒数，$z_1 \\div z_2$ 在复数范围内无意义。",
          level: "warning",
        });
      }
      if (Math.abs(a2) < 1e-9 && Math.abs(b2) > 1e-9) {
        warnings.push({
          text: "除数 $z_2$ 为纯虚数（$c = 0$），分母实数化后退化为 $d^2$；此时 $\\dfrac{1}{bi} = -\\dfrac{1}{b}i$，可直接记忆该特例。",
          level: "info",
        });
      }

      return {
        quantities: [
          {
            label: "分子 $z_1$",
            symbol: "z_1",
            value: formatComplexLatex(z1),
            unit: "代数形式",
          },
          {
            label: "分母 $z_2$",
            symbol: "z_2",
            value: formatComplexLatex(z2),
            unit: "代数形式",
          },
          {
            label: "分母的共轭 $\\bar{z_2}$",
            symbol: "\\bar{z_2}",
            value: formatComplexLatex(z2Conj),
            unit: "虚部取相反数",
          },
          {
            label: "分母实数化 $c^2 + d^2$",
            symbol: "c^2 + d^2",
            value: divRes.valid
              ? `${divRes.c2.toFixed(2)} + ${divRes.d2.toFixed(2)} = ${divRes.denominator.toFixed(2)}`
              : "0（退化）",
            unit: "等于 $|z_2|^2$，恒为非负实数",
          },
          {
            label: "分子乘共轭后实部 $ac + bd$",
            symbol: "ac + bd",
            value: divRes.numeratorRe.toFixed(2),
          },
          {
            label: "分子乘共轭后虚部 $bc - ad$",
            symbol: "bc - ad",
            value: divRes.numeratorIm.toFixed(2),
          },
          {
            label: "商 $z_1 / z_2$",
            symbol: "z_1 / z_2",
            value: divRes.valid
              ? formatComplexLatex(divRes.result)
              : "无意义（$z_2 = 0$）",
            unit: "实虚部分别除以分母",
          },
        ],
        theorems: [
          {
            name: "共轭乘法公式（分母实数化）",
            latex: "(c + di)(c - di) = c^2 + d^2 = |z_2|^2",
            prerequisites: ["$c, d \\in \\mathbb{R}$"],
            note: "复数与其共轭相乘，虚部项 $cdi - cdi$ 恰好抵消，结果为实数 $c^2 + d^2$，即模长平方 $|z_2|^2$。这是「除法变乘法」的关键一步。",
            level: "core",
          },
          {
            name: "复数除法法则",
            latex:
              "\\frac{z_1}{z_2} = \\frac{z_1 \\bar{z_2}}{|z_2|^2} = \\frac{(ac + bd) + (bc - ad)i}{c^2 + d^2} \\quad (z_2 \\neq 0)",
            prerequisites: ["$z_2 \\neq 0$"],
            note: "分子分母同乘分母的共轭 $\\bar{z_2}$，分母化为正实数 $|z_2|^2$，再把实部、虚部分别除以该实数。",
            level: "core",
          },
          {
            name: "常用特例",
            latex:
              "\\frac{1}{i} = -i, \\quad \\frac{1}{1+i} = \\frac{1-i}{2}, \\quad \\frac{1+i}{1-i} = i",
            note: "这几个结论在化简中反复出现，记住可直接跳过分母实数化步骤，是提速的关键。",
            level: "important",
          },
        ],
        gaokaoPoints: [
          {
            text: "【新高考必考·分母实数化三步走】①分子分母同乘分母的共轭 $\\bar{z_2}$；②分母化为实数 $c^2 + d^2 = |z_2|^2$；③分子展开后将实部、虚部分别除以该分母。",
            importance: "gaokao",
          },
          {
            text: "易错点提醒：分母是 $c^2 + d^2$（两项之**和**），不是 $(c+d)^2$；分子展开时虚部为 $bc - ad$，符号极易写反。",
            importance: "gaokao",
          },
          {
            text: "结果规范化：最终必须整理成 $a + bi$（$a, b \\in \\mathbb{R}$）形式，不能保留分母、未合并的 $i^2$ 或复数分母。",
            importance: "core",
          },
        ],
        warnings,
        reasoningSteps: [
          {
            step: 1,
            title: "同乘共轭 · 把分母变成实数",
            detail: `分子分母同时乘分母的共轭 $\\bar{z_2} = ${formatComplexLatex(z2Conj)}$（虚部取相反数），分式的值不变，但分母由复数变为实数。`,
            latex: `\\frac{z_1}{z_2} = \\frac{z_1}{z_2} \\cdot \\frac{\\bar{z_2}}{\\bar{z_2}} = \\frac{z_1 \\bar{z_2}}{z_2 \\bar{z_2}}`,
            rubric: "采分点：正确写出分母的共轭并同乘（2分）",
          },
          {
            step: 2,
            title: "分母实数化 · 用共轭乘法公式",
            detail: `由 $(c+di)(c-di) = c^2 + d^2$，本组参数 $c = ${a2}$、$d = ${b2}$，分母化为 $${divRes.c2.toFixed(2)} + ${divRes.d2.toFixed(2)} = ${divRes.denominator.toFixed(2)}$，恰等于 $|z_2|^2$，是一个非负实数。`,
            latex: `z_2 \\bar{z_2} = ${a2}^2 + ${b2}^2 = ${divRes.denominator.toFixed(2)} = |z_2|^2`,
            rubric: "采分点：用共轭乘法公式把分母化为实数（3分）",
          },
          {
            step: 3,
            title: "分子展开 · 实虚部分别相除",
            detail: divRes.valid
              ? `分子展开为 $ac + bd = ${divRes.numeratorRe.toFixed(2)}$（实部）与 $bc - ad = ${divRes.numeratorIm.toFixed(2)}$（虚部），分别除以分母 $${divRes.denominator.toFixed(2)}$，得 $z_1 \\div z_2 = ${formatComplexLatex(divRes.result)}$。`
              : "分母实数化结果为 $0$（除数 $z_2 = 0$），除法无意义，运算终止。",
            latex: divRes.valid
              ? `\\frac{z_1}{z_2} = \\frac{${divRes.numeratorRe.toFixed(2)} + ${divRes.numeratorIm.toFixed(2)}i}{${divRes.denominator.toFixed(2)}} = ${formatComplexLatex(divRes.result)}`
              : "\\frac{z_1}{0} \\text{ 无意义}",
            rubric: "采分点：展开分子并实虚部分别除以分母（3分）",
          },
        ],
        mnemonic:
          "分母共轭乘上下，c²+d² 变实数；分子展开再分除，结果写成 a+bi。",
      };
    }

    // ── 子情景 1（默认）：复数代数乘除展开 ──
    const warnings: MathPanelData["warnings"] = [];
    if (Math.abs(b1) < 1e-9) {
      warnings.push({
        text: "被乘数 $z_1$ 的虚部为 $0$，$z_1$ 退化为实数；此时乘积的纯虚项只剩 $ad\\,i$ 一项，但仍须按 $(a+bi)(c+di)$ 完整展开再合并。",
        level: "info",
      });
    }
    if (Math.abs(b2) < 1e-9) {
      warnings.push({
        text: "乘数（除数）$z_2$ 的虚部为 $0$，$z_2$ 退化为实数；除法分母实数化为 $c^2$，虚部平方项 $bd\\,i^2$ 也随之消失。",
        level: "info",
      });
    }
    if (!divRes.valid) {
      warnings.push({
        text: "除数 $z_2 = 0$，$z_1 \\div z_2$ 在复数范围内无意义（$0$ 没有倒数）。",
        level: "warning",
      });
    }

    return {
      quantities: [
        {
          label: "被乘数 $z_1$",
          symbol: "z_1",
          value: formatComplexLatex(z1),
          unit: "代数形式",
        },
        {
          label: "乘数 / 除数 $z_2$",
          symbol: "z_2",
          value: formatComplexLatex(z2),
          unit: "代数形式",
        },
        {
          label: "乘积实部 $ac - bd$",
          symbol: "ac - bd",
          value: `${expand.ac.toFixed(2)} - (${expand.bd.toFixed(2)}) = ${expand.re.toFixed(2)}`,
          unit: "虚部平方项 $bd\\,i^2 = -bd$ 并入实部",
        },
        {
          label: "乘积虚部 $ad + bc$",
          symbol: "ad + bc",
          value: `${expand.ad.toFixed(2)} + (${expand.bc.toFixed(2)}) = ${expand.im.toFixed(2)}`,
          unit: "交叉项保留在虚部",
        },
        {
          label: "乘积 $z_1 z_2$",
          symbol: "z_1 z_2",
          value: formatComplexLatex(zProd),
          unit: "$(ac - bd) + (ad + bc)i$",
        },
        {
          label: "分母实数化 $|z_2|^2$",
          symbol: "|z_2|^2",
          value: divRes.valid
            ? `${divRes.c2.toFixed(2)} + ${divRes.d2.toFixed(2)} = ${divRes.denominator.toFixed(2)}`
            : "0（退化）",
          unit: "共轭相乘消去虚部",
        },
        {
          label: "商 $z_1 / z_2$",
          symbol: "z_1 / z_2",
          value: divRes.valid
            ? formatComplexLatex(divRes.result)
            : "无意义（$z_2 = 0$）",
          unit: "$\\dfrac{z_1 \\bar{z_2}}{|z_2|^2}$",
        },
      ],
      theorems: [
        {
          name: "复数乘法法则（代数展开式）",
          latex: "(a + bi)(c + di) = (ac - bd) + (ad + bc)i",
          prerequisites: ["$i^2 = -1$", "$a, b, c, d \\in \\mathbb{R}$"],
          note: "先按多项式乘法把四项全部展开为 $ac + ad\\,i + bc\\,i + bd\\,i^2$，再把 $i^2$ 换成 $-1$、合并同类项。其中 $bd\\,i^2 = -bd$ 是唯一「跳到实数」的项，也是最容易漏算的一步。",
          level: "core",
        },
        {
          name: "复数除法法则（共轭分母实数化）",
          latex:
            "\\frac{z_1}{z_2} = \\frac{z_1 \\bar{z_2}}{z_2 \\bar{z_2}} = \\frac{z_1 \\bar{z_2}}{|z_2|^2} \\quad (z_2 \\neq 0)",
          prerequisites: ["$z_2 \\neq 0$", "$\\bar{z_2} = c - di$"],
          note: "分子分母同乘分母的共轭，分母化为实数 $|z_2|^2 = c^2 + d^2$，从而把除法转化为乘法：$\\dfrac{z_1}{z_2} = \\dfrac{(ac + bd) + (bc - ad)i}{c^2 + d^2}$。",
          level: "core",
        },
      ],
      gaokaoPoints: [
        {
          text: "【新高考必考·复数代数运算】加减法按实虚部对应合并；乘法按 $(a+bi)(c+di) = (ac - bd) + (ad + bc)i$ 展开；除法一律走「分子分母同乘分母共轭」的实数化路线。",
          importance: "gaokao",
        },
        {
          text: "最易失分点：$(a+bi)(c+di)$ 展开时 $bd\\,i^2$ 必须写成 $-bd$ 并入实部；除法分母是 $c^2 + d^2$ 而非 $(c+d)^2$。",
          importance: "gaokao",
        },
        {
          text: "结果规范化：复数运算最终必须写成 $a + bi$（$a, b \\in \\mathbb{R}$）的标准形式，不得保留分母或未化简的 $i^2$。",
          importance: "core",
        },
      ],
      warnings,
      reasoningSteps: [
        {
          step: 1,
          title: "代数设定 · 写出实虚部",
          detail: `设 $z_1 = ${a1} + ${b1}i$（实部 $a = ${a1}$、虚部 $b = ${b1}$），$z_2 = ${a2} + ${b2}i$（实部 $c = ${a2}$、虚部 $d = ${b2}$）。一切代数运算都建立在这四个实数之上。`,
          latex: `z_1 = ${a1} + ${b1}i, \\quad z_2 = ${a2} + ${b2}i`,
          rubric: "采分点：写出两复数的代数形式并标出实虚部（1分）",
        },
        {
          step: 2,
          title: "乘法展开 · 逐项相乘再合并同类项",
          detail: `按多项式乘法逐项展开：$ac = ${expand.ac.toFixed(2)}$、$ad = ${expand.ad.toFixed(2)}$、$bc = ${expand.bc.toFixed(2)}$、$bd = ${expand.bd.toFixed(2)}$；把 $bd\\,i^2$ 换成 $-bd = ${expand.iSquaredTerm.toFixed(2)}$ 并入实部，得 $z_1 z_2 = ${formatComplexLatex(zProd)}$。`,
          latex: `(a+bi)(c+di) = \\bigl(${expand.ac.toFixed(2)} - (${expand.bd.toFixed(2)})\\bigr) + \\bigl(${expand.ad.toFixed(2)} + (${expand.bc.toFixed(2)})\\bigr)i = ${formatComplexLatex(zProd)}`,
          rubric: "采分点：逐项展开并把 i² 化为 −1 后合并（3分）",
        },
        {
          step: 3,
          title: "除法实数化 · 分子分母同乘分母共轭",
          detail: divRes.valid
            ? `分母乘其共轭得实数 $c^2 + d^2 = ${divRes.c2.toFixed(2)} + ${divRes.d2.toFixed(2)} = ${divRes.denominator.toFixed(2)}$；分子同步展开为 $${divRes.numeratorRe.toFixed(2)} + ${divRes.numeratorIm.toFixed(2)}i$，两者实虚部分别相除即得 $z_1 \\div z_2 = ${formatComplexLatex(divRes.result)}$。`
            : "除数 $z_2 = 0$，分母实数化结果为 $0$，除法在复数范围内无意义，运算终止。",
          latex: divRes.valid
            ? `\\frac{z_1}{z_2} = \\frac{${divRes.numeratorRe.toFixed(2)} + ${divRes.numeratorIm.toFixed(2)}i}{${divRes.denominator.toFixed(2)}} = ${formatComplexLatex(divRes.result)}`
            : "\\frac{z_1}{0} \\text{ 无意义}",
          rubric: "采分点：同乘共轭把分母化为实数后分别相除（3分）",
        },
      ],
      mnemonic:
        "乘法四项乘开，i² 记得换成 −1；除法同乘共轭，分母变成 c²+d² 再相除。",
    };
  }

  // 模式 3: locus-extrema
  const subModel = (config?.subModel as string) || "circle";

  if (subModel === "perp-bisector") {
    const a1 = params.a1 ?? 3;
    const b1 = params.b1 ?? 1;
    const a2 = params.a2 ?? -1;
    const b2 = params.b2 ?? 3;

    const z1 = createComplex(a1, b1);
    const z2 = createComplex(a2, b2);
    const bisector = calcPerpBisectorLocus(z1, z2);

    return {
      quantities: [
        {
          label: "定点 $z_1$",
          symbol: "z_1",
          value: formatComplexLatex(z1),
          unit: "第一定点",
        },
        {
          label: "定点 $z_2$",
          symbol: "z_2",
          value: formatComplexLatex(z2),
          unit: "第二定点",
        },
        {
          label: "线段中点 $M$",
          symbol: "\\frac{z_1+z_2}{2}",
          value: formatComplexLatex(bisector.midPoint),
          unit: "垂足点",
        },
        {
          label: "两定点距离 $|z_1 - z_2|$",
          symbol: "|z_1 - z_2|",
          value: bisector.dist.toFixed(2),
          unit: "线段长度",
        },
      ],
      theorems: [
        {
          name: "垂直平分线轨迹方程",
          latex:
            "|z - z_1| = |z - z_2| \\quad \\Longleftrightarrow \\quad z \\text{ 落在 } z_1, z_2 \\text{ 连线的垂直平分线上}",
          note: "几何意义：到两定点距离相等的动点轨迹是连接两定点线段的中垂线。",
          level: "core",
        },
      ],
      gaokaoPoints: [
        {
          text: "【新高考经典轨迹】方程 |z - z₁| = |z - z₂| 表示两定点连线段的垂直平分线，常用斜率垂直 k₁k₂ = -1 与中点坐标直接写出直线方程。",
          importance: "gaokao",
        },
      ],
      warnings: !bisector.valid
        ? [
            {
              text: "两定点重合 ($z_1 = z_2$)，轨迹退化为全平面任意复数。",
              level: "warning",
            },
          ]
        : [],
      reasoningSteps: [
        {
          step: 1,
          title: "条件翻译 · 等距方程",
          detail: `$|z - z_1| = |z - z_2|$ 表示动点 $z$ 到两定点 $z_1 = ${formatComplexLatex(z1)}$、$z_2 = ${formatComplexLatex(z2)}$ 的距离相等。`,
          latex: "|z - z_1| = |z - z_2|",
          rubric: "采分点：把复数等式翻译为等距条件（2分）",
        },
        {
          step: 2,
          title: "几何定位 · 求中点",
          detail: `到两定点距离相等的点集是线段 $Z_1 Z_2$ 的垂直平分线，垂足即中点 $M = \\dfrac{z_1 + z_2}{2} = ${formatComplexLatex(bisector.midPoint)}$，两点距离 $|z_1 - z_2| = ${bisector.dist.toFixed(2)}$。`,
          latex: `M = \\frac{z_1 + z_2}{2} = ${formatComplexLatex(bisector.midPoint)}`,
          rubric: "采分点：求中点坐标（2分）",
        },
        {
          step: 3,
          title: "写出轨迹 · 垂线方程",
          detail: bisector.valid
            ? `直线 $Z_1 Z_2$ 的斜率 $k = \\dfrac{${b2} - ${b1}}{${a2} - ${a1}}$，垂直平分线斜率满足 $k' \\cdot k = -1$，过中点 $M$ 即得轨迹方程。`
            : "两定点重合（$z_1 = z_2$），等距条件退化为全平面，不存在唯一直线轨迹。",
          latex: `k_{Z_1 Z_2} = \\frac{${b2} - ${b1}}{${a2} - ${a1}}, \\quad k_{\\perp} \\cdot k_{Z_1 Z_2} = -1`,
          rubric: "采分点：由垂直关系写出轨迹直线方程（3分）",
        },
      ],
      mnemonic: "等距方程中垂线，找准中点定法向。",
    };
  }

  if (subModel === "triangle-ineq") {
    const a1 = params.a1 ?? 3;
    const b1 = params.b1 ?? 2;
    const a2 = params.a2 ?? 1;
    const b2 = params.b2 ?? 3;

    const z1 = createComplex(a1, b1);
    const z2 = createComplex(a2, b2);
    const ineq = calcModulusTriangleInequality(z1, z2);

    return {
      quantities: [
        {
          label: "模长 $|z_1|$",
          symbol: "|z_1|",
          value: ineq.mod1.toFixed(2),
        },
        {
          label: "模长 $|z_2|$",
          symbol: "|z_2|",
          value: ineq.mod2.toFixed(2),
        },
        {
          label: "和的模长 $|z_1 + z_2|$",
          symbol: "|z_1 + z_2|",
          value: ineq.modSum.toFixed(2),
          unit: "实际对角线长",
        },
        {
          label: "理论下界 $||z_1| - |z_2||$",
          symbol: "||z_1| - |z_2||",
          value: ineq.lowerBound.toFixed(2),
          unit: "反向共线时取等",
        },
        {
          label: "理论上界 $|z_1| + |z_2|$",
          symbol: "|z_1| + |z_2|",
          value: ineq.upperBound.toFixed(2),
          unit: "同向共线时取等",
        },
      ],
      theorems: [
        {
          name: "复数模的三角不等式",
          latex: "||z_1| - |z_2|| \\le |z_1 \\pm z_2| \\le |z_1| + |z_2|",
          note: "同向共线时取右侧等号；反向共线时取左侧等号。",
          level: "core",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考模长极值秒杀】利用三角不等式可以直接对 |z₁ + z₂| 或 |z₁ - z₂| 放缩求解最大/最小值，无需建系消元。",
          importance: "gaokao",
        },
      ],
      warnings: [],
      reasoningSteps: [
        {
          step: 1,
          title: "共起点化 · 把三个模长放进同一个三角形",
          detail: `$|z_1|$、$|z_2|$、$|z_1 + z_2|$ 分别对应复平面上向量 $\\vec{OZ_1}$、$\\vec{OZ_2}$、$\\vec{OZ_1} + \\vec{OZ_2}$ 的模；后者的终点是平行四边形 $OZ_1ZZ_2$ 的第四个顶点 $Z$。本组参数下 $|z_1| = ${ineq.mod1.toFixed(2)}$、$|z_2| = ${ineq.mod2.toFixed(2)}$、$|z_1 + z_2| = ${ineq.modSum.toFixed(2)}$。`,
          latex: `|z_1| = ${ineq.mod1.toFixed(2)}, \\quad |z_2| = ${ineq.mod2.toFixed(2)}, \\quad |z_1 + z_2| = ${ineq.modSum.toFixed(2)}`,
          rubric: "采分点：写出三个模长并说明其几何对应（2分）",
        },
        {
          step: 2,
          title: "三角形放缩 · 两边之和差夹住第三边",
          detail: `在 $\\triangle OZ_1Z$ 中，$|OZ_1| = |z_1|$、$|Z_1Z| = |z_2|$、$|OZ| = |z_1 + z_2|$，由两边之和大于第三边、两边之差小于第三边得 $${ineq.lowerBound.toFixed(2)} \\le |z_1 + z_2| \\le ${ineq.upperBound.toFixed(2)}$；实测 $|z_1 + z_2| = ${ineq.modSum.toFixed(2)}$ 恰好落在该区间内。`,
          latex: `\\bigl||z_1| - |z_2|\\bigr| = ${ineq.lowerBound.toFixed(2)} \\le |z_1 + z_2| \\le ${ineq.upperBound.toFixed(2)} = |z_1| + |z_2|`,
          rubric: "采分点：用三角不等式给出上下界并验证实际值（3分）",
        },
        {
          step: 3,
          title: "取等条件 · 同向与反向共线",
          detail: `两端等号都只在共线时成立：$z_1$ 与 $z_2$ 同向（辐角相等）时 $|z_1 + z_2| = |z_1| + |z_2| = ${ineq.upperBound.toFixed(2)}$；反向（辐角相差 $180^\\circ$）时 $|z_1 + z_2| = \\bigl||z_1| - |z_2|\\bigr| = ${ineq.lowerBound.toFixed(2)}$。这两个共线构型就是模长最值题里的"取等检验点"。`,
          latex: `\\arg z_1 = \\arg z_2 \\;\\Rightarrow\\; |z_1 + z_2| = |z_1| + |z_2|, \\quad \\arg z_1 - \\arg z_2 = \\pi \\;\\Rightarrow\\; |z_1 + z_2| = \\bigl||z_1| - |z_2|\\bigr|`,
          rubric: "采分点：说明两端取等条件（2分）",
        },
      ],
      mnemonic: "两边之差小于第三边，两边之和大于第三边。",
    };
  }

  // 默认 circle
  const z0x = params.z0x ?? 3.0;
  const z0y = params.z0y ?? 4.0;
  const radius = params.radius ?? 2.0;
  const wx = params.wx ?? 0.0;
  const wy = params.wy ?? 0.0;

  const center = createComplex(z0x, z0y);
  const target = createComplex(wx, wy);
  const locusRes = calcCircleLocusExtrema(center, radius, target);

  const warnings: MathPanelData["warnings"] = [];
  if (locusRes.centerDist < 1e-9) {
    warnings.push({
      text: "当定点 $w$ 恰好为轨迹圆心 $z_0$ 时，圆上所有点到 $w$ 的距离恒等于半径 $R$。",
      level: "info",
    });
  } else if (locusRes.centerDist < radius) {
    warnings.push({
      text: "定点 $w$ 位于轨迹圆内部，最近距离为 $R - |z_0 - w|$，最远距离为 $R + |z_0 - w|$。",
      level: "info",
    });
  }

  return {
    quantities: [
      {
        label: "轨迹圆心 $z_0$",
        symbol: "z_0",
        value: formatComplexLatex(center),
      },
      {
        label: "轨迹圆半径 $R$",
        symbol: "R",
        value: radius.toFixed(1),
      },
      {
        label: "目标定点 $w$",
        symbol: "w",
        value: formatComplexLatex(target),
      },
      {
        label: "圆心距 $d = |z_0 - w|$",
        symbol: "d",
        value: locusRes.centerDist.toFixed(2),
        unit: "圆心到定点距离",
      },
      {
        label: "最小值 $|z - w|_{\\min}$",
        symbol: "|z - w|_{\\min}",
        value: locusRes.minDist.toFixed(2),
        unit: "$||z_0 - w| - R|$",
      },
      {
        label: "最大值 $|z - w|_{\\max}$",
        symbol: "|z - w|_{\\max}",
        value: locusRes.maxDist.toFixed(2),
        unit: "$|z_0 - w| + R$",
      },
    ],
    theorems: [
      {
        name: "复数圆轨迹与极值模型",
        latex:
          "|z - z_0| = R \\quad \\Longrightarrow \\quad \\text{圆心 } z_0, \\text{半径 } R",
        note: "最小值 $|z - w|_{\\min} = ||z_0 - w| - R|$，最大值 $|z - w|_{\\max} = |z_0 - w| + R$。",
        level: "core",
      },
    ],
    gaokaoPoints: [
      {
        text: "高考最值压轴题：把抽象的复数模长条件 $|z - z_0| = R$ 转化为平面几何问题（圆心距与半径加减）。",
        importance: "hard",
      },
      {
        text: "动点三点共线极值定理：当且仅当动点 $z$、圆心 $z_0$ 与定点 $w$ 三点共线时取得最大与最小距离。",
        importance: "gaokao",
      },
    ],
    warnings,
    reasoningSteps: [
      {
        step: 1,
        title: "条件翻译 · 模长方程即圆",
        detail: `$|z - z_0| = R$ 表示动点 $Z$ 到定点 $Z_0$ 的距离恒为 $R$，故轨迹是以 $Z_0(${z0x}, ${z0y})$ 为圆心、以 $R = ${radius.toFixed(1)}$ 为半径的圆。这正是"复数模长条件 ↔ 平面几何轨迹"互译的第一步。`,
        latex: `|z - z_0| = R \\iff Z_0(${z0x}, ${z0y}), \\quad R = ${radius.toFixed(1)}`,
        rubric: "采分点：把模长条件翻译为圆的方程（2分）",
      },
      {
        step: 2,
        title: "转化为圆心距 · 加减半径即得最值",
        detail: `圆上动点到定点 $w(${wx}, ${wy})$ 的距离最值，不必设点消元，只需先算圆心距 $d = |z_0 - w| = ${locusRes.centerDist.toFixed(2)}$，再对半径整体做加减：$|z - w|_{\\min} = |d - R| = ${locusRes.minDist.toFixed(2)}$，$|z - w|_{\\max} = d + R = ${locusRes.maxDist.toFixed(2)}$。`,
        latex: `d = |z_0 - w| = ${locusRes.centerDist.toFixed(2)}, \\quad |z - w|_{\\min} = \\bigl|${locusRes.centerDist.toFixed(2)} - ${radius.toFixed(1)}\\bigr| = ${locusRes.minDist.toFixed(2)}, \\quad |z - w|_{\\max} = ${locusRes.maxDist.toFixed(2)}`,
        rubric: "采分点：用圆心距加减半径求最值（3分）",
      },
      {
        step: 3,
        title: "取等条件 · 三点共线定位最值点",
        detail:
          locusRes.centerDist < 1e-9
            ? `本组参数下 $w$ 恰好与圆心 $Z_0$ 重合，圆上每一点到 $w$ 的距离都等于半径 $R = ${radius.toFixed(1)}$，最大最小值退化为同一个数，不再由三点共线决定。`
            : `当且仅当动点 $Z$、圆心 $Z_0$、定点 $w$ 三点共线时取到最值：最近点 $Z_{\\min}(${locusRes.minPoint.re.toFixed(2)}, ${locusRes.minPoint.im.toFixed(2)})$ 落在圆心指向 $w$ 的一侧，最远点 $Z_{\\max}(${locusRes.maxPoint.re.toFixed(2)}, ${locusRes.maxPoint.im.toFixed(2)})$ 落在反向一侧。`,
        latex: `Z_{\\min} = z_0 + R \\cdot \\frac{w - z_0}{|w - z_0|}, \\quad Z_{\\max} = z_0 - R \\cdot \\frac{w - z_0}{|w - z_0|}`,
        rubric: "采分点：说明取等条件并写出最值点坐标（2分）",
      },
    ],
    mnemonic:
      "模长方程即画圆，连结圆心看定点；加半径得最大值，减半径得最小值。",
  };
}
