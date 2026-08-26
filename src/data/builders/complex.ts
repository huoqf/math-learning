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
          unit: "\\sqrt{a_1^2 + b_1^2}",
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
            "$z_1 = r_1 e^{i\\theta_1}, z_2 = r_2 e^{i\\theta_2}$",
          ],
          note: "模长相乘：$|z_1 z_2| = |z_1| \\cdot |z_2|$；辐角相加：$\\arg(z_1 z_2) = \\theta_1 + \\theta_2$。",
          level: "core",
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
      mnemonic:
        "乘法几何真神奇，模长相乘角相加；乘以虚数单位 i，逆转直角九十度。",
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
    mnemonic:
      "模长方程即画圆，连结圆心看定点；加半径得最大值，减半径得最小值。",
  };
}
