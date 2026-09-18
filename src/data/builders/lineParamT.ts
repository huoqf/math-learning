import type {
  MathPanelData,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { MATH_COLORS } from "@/theme";
import { calcLineConicIntersection, type ConicType } from "@/math/lineParamT";

export function buildLineParamTPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const x0 = params.x0 ?? 0.5;
  const y0 = params.y0 ?? 0.8;
  const alpha = params.alpha ?? 45;
  const t = params.t ?? 2.5;
  const kNorm = params.kNorm ?? 1.5;
  const R = params.R ?? 3.0;
  const a = params.a ?? 3.5;
  const b = params.b ?? 2.0;
  const p = params.p ?? 1.5;

  const mode = (config?.mode as string) ?? "definition"; // 'definition' | 'secant' | 'gaokao'
  const conicType = (config?.conicType as ConicType) ?? "circle";
  const gaokaoModel = (config?.gaokaoModel as string) ?? "midpoint"; // 'midpoint' | 'product' | 'reciprocal'

  // 计算二次曲线相交与割线定理几何量
  const intersect = calcLineConicIntersection(x0, y0, alpha, conicType, {
    R,
    a,
    b,
    p,
  });

  const quantities = [];

  if (mode === "definition") {
    quantities.push(
      {
        label: "定点 P0 坐标",
        labelFormula: `\\text{定点坐标 }\\color{${MATH_COLORS.paramPrimary}}{P_0(x_0, y_0)}`,
        value: `(${x0.toFixed(2)}, ${y0.toFixed(2)})`,
      },
      {
        label: "倾斜角与方向向量",
        labelFormula: `\\text{方向向量 }\\color{${MATH_COLORS.paramPrimary}}{(\\cos\\alpha, \\sin\\alpha)}`,
        value: `α = ${alpha}°, e = (${Math.cos((alpha * Math.PI) / 180).toFixed(
          2,
        )}, ${Math.sin((alpha * Math.PI) / 180).toFixed(2)})`,
      },
      {
        label: "标准动点 P 参数与距离",
        labelFormula: `\\text{参数距离 }\\color{${MATH_COLORS.paramPrimary}}{|P_0P| = |t|}`,
        value: `t = ${t.toFixed(2)}, 距离 |P_0P| = ${Math.abs(t).toFixed(2)}`,
        status: "normal" as const,
      },
      {
        label: "非标准点 P' 参数与位移",
        labelFormula: `\\text{修正位移 }\\color{${MATH_COLORS.paramPrimary}}{|P_0P'| = k_{\\text{norm}}|m|}`,
        value: `m = ${t.toFixed(2)}, k_norm = ${kNorm.toFixed(
          2,
        )}, 实际距离 = ${(Math.abs(t) * kNorm).toFixed(2)}`,
        status:
          Math.abs(kNorm - 1.0) < 1e-3
            ? ("normal" as const)
            : ("warning" as const),
      },
    );
  } else if (mode === "secant") {
    quantities.push(
      {
        label: "定点 P0 坐标",
        labelFormula: `\\text{定点坐标 }\\color{${MATH_COLORS.paramPrimary}}{P_0(x_0, y_0)}`,
        value: `(${x0.toFixed(2)}, ${y0.toFixed(2)})`,
      },
      {
        label: "二次方程系数 A, B, C",
        labelFormula: `\\text{二次方程系数 }\\color{${MATH_COLORS.paramPrimary}}{A t^2 + B t + C = 0}`,
        value: `A=${intersect.A.toFixed(3)}, B=${intersect.B.toFixed(
          3,
        )}, C=${intersect.C.toFixed(3)}`,
      },
      {
        label: "判别式 Δ",
        labelFormula: `\\text{判别式 }\\color{${MATH_COLORS.paramPrimary}}{\\Delta = B^2 - 4AC}`,
        value: intersect.delta.toFixed(3),
        status: intersect.hasIntersection
          ? ("normal" as const)
          : ("warning" as const),
      },
    );

    if (intersect.hasIntersection) {
      quantities.push(
        {
          label: "交点 A, B 的参数 t1, t2",
          labelFormula: `\\text{交点参数 }\\color{${MATH_COLORS.paramPrimary}}{t_1, t_2}`,
          value: `t1 = ${intersect.t1.toFixed(2)}, t2 = ${intersect.t2.toFixed(
            2,
          )}`,
        },
        {
          label: "韦达定理和与积",
          labelFormula: `\\text{韦达和与积 }\\color{${MATH_COLORS.paramPrimary}}{t_1+t_2, \\quad t_1 t_2}`,
          value: `t1+t2 = ${intersect.tSum.toFixed(2)}, t1·t2 = ${intersect.tProd.toFixed(
            2,
          )}`,
        },
        {
          label: "弦长 |AB|",
          labelFormula: "|AB| = |t_1 - t_2| = \\frac{\\sqrt{\\Delta}}{|A|}",
          value: intersect.chordLength.toFixed(3),
          status: "normal" as const,
        },
        {
          label:
            conicType === "circle"
              ? "割线定理线段乘积 (圆幂)"
              : "二次曲线割线线段乘积",
          labelFormula: `\\text{线段乘积 }\\color{${MATH_COLORS.paramPrimary}}{|P_0A| \\cdot |P_0B| = |t_1 t_2|}`,
          value:
            conicType === "circle"
              ? `${intersect.segmentProduct.toFixed(3)} (定值, 与α无关)`
              : `${intersect.segmentProduct.toFixed(3)} (随α变化)`,
          status: "normal" as const,
        },
        {
          label: "弦中点 M 参数与坐标",
          labelFormula: "t_M = \\frac{t_1+t_2}{2}",
          value: `tM = ${intersect.tM.toFixed(2)}, M(${intersect.pointM?.x.toFixed(
            2,
          )}, ${intersect.pointM?.y.toFixed(2)})`,
        },
      );
    }
  } else {
    // Mode: gaokao (高考三大模型)
    if (gaokaoModel === "midpoint") {
      const isMidpoint =
        intersect.hasIntersection && Math.abs(intersect.tSum) < 1e-2;
      quantities.push(
        {
          label: "中点弦参数条件",
          labelFormula: "t_1 + t_2 = -\\frac{B}{A}",
          value: `t1+t2 = ${intersect.tSum.toFixed(3)} ${isMidpoint ? "(已平分弦)" : ""}`,
          status: isMidpoint ? ("normal" as const) : ("warning" as const),
        },
        {
          label: "二次方程一次项系数 B",
          labelFormula: `\\text{中点弦条件 }\\color{${MATH_COLORS.paramSecondary}}{B = 0} \\iff P_0 \\text{ 为弦中点}`,
          value: `B = ${intersect.B.toFixed(3)}`,
        },
        {
          label: "弦中点 M 坐标",
          labelFormula:
            "M\\left(x_0 + t_M \\cos\\alpha, y_0 + t_M \\sin\\alpha\\right)",
          value: intersect.hasIntersection
            ? `M(${intersect.pointM?.x.toFixed(2)}, ${intersect.pointM?.y.toFixed(2)})`
            : "无交点",
        },
      );
    } else if (gaokaoModel === "product") {
      quantities.push(
        {
          label: "定点 P0 线段乘积",
          labelFormula:
            "|P_0A| \\cdot |P_0B| = |t_1 t_2| = \\left|\\frac{C}{A}\\right|",
          value: intersect.hasIntersection
            ? intersect.segmentProduct.toFixed(3)
            : "无交点",
          status: "normal" as const,
        },
        {
          label: "二次曲线幂/常数项 C",
          labelFormula: `\\text{常数项 }\\color{${MATH_COLORS.paramTertiary}}{C = f(x_0, y_0)}`,
          value: `C = ${intersect.C.toFixed(3)}`,
        },
        {
          label: "转动角度 α 下方幂不变性",
          labelFormula: `\\text{圆中与倾斜角 }\\color{${MATH_COLORS.paramPrimary}}{\\alpha} \\text{ 无关}`,
          value: conicType === "circle" ? "为定值 (与α无关)" : "随倾斜角α改变",
        },
      );
    } else {
      // reciprocal (倒数和)
      const isInternal = intersect.hasIntersection && intersect.tProd < 0;
      quantities.push(
        {
          label: "几何线段倒数和",
          labelFormula: isInternal
            ? "\\frac{1}{|P_0A|} + \\frac{1}{|P_0B|} = \\frac{\\sqrt{\\Delta}}{|C|}"
            : "\\frac{1}{|P_0A|} + \\frac{1}{|P_0B|} = \\left|\\frac{B}{C}\\right|",
          value:
            intersect.reciprocalSum !== undefined
              ? `${intersect.reciprocalSum.toFixed(3)} (${isInternal ? "内分弦 t₁t₂<0" : "外分点 t₁t₂>0"})`
              : "无意义(过P0)",
          status: "normal" as const,
        },
        {
          label: "倒数乘积 1/|t1 t2|",
          labelFormula: "\\frac{1}{|t_1 t_2|} = \\left|\\frac{A}{C}\\right|",
          value:
            intersect.hasIntersection && Math.abs(intersect.tProd) > 1e-6
              ? (1 / intersect.segmentProduct).toFixed(3)
              : "未计算",
        },
      );
    }
  }

  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];

  if (mode === "definition") {
    theorems.push(
      {
        name: "直线标准参数方程的几何意义",
        latex:
          "\\begin{cases} x = x_0 + t \\cos\\alpha \\\\ y = y_0 + t \\sin\\alpha \\end{cases}",
        note: "当直线的方向向量为单位向量 $(\\cos\\alpha, \\sin\\alpha)$ 时，参数 $|t|$ 严格表示动点 $P(x, y)$ 到定点 $P_0(x_0, y_0)$ 的实际几何距离；$t$ 的符号表示在单位方向向量上的相对指向。",
        prerequisites: [
          "直线倾斜角 $\\alpha \\in [0, \\pi)$",
          "方向向量 $(\\cos\\alpha, \\sin\\alpha)$ 必须为单位向量",
        ],
        level: "supplementary",
      },
      {
        name: "非标准参数方程的距离修正",
        latex: "|P_0P'| = \\sqrt{a^2 + b^2} \\cdot |m|",
        note: "当直线方程设为 $x=x_0+am, y=y_0+bm$ 且 $a^2+b^2 \\ne 1$ 时，参数 $m$ 不等于实际距离，必须乘以归一化模长系数 $\\sqrt{a^2+b^2}$ 进行距离还原。",
        prerequisites: ["$a^2+b^2 > 0$"],
        level: "supplementary",
      },
    );
    gaokaoPoints.push(
      {
        text: "非标准参数方程扣分陷阱（归一化）：当参数方程未归一化（$a^2+b^2 \\ne 1$）时，$m$ 不等于实际几何距离！高考中若直接令 $|AB|=|m_1-m_2|$ 将导致整题推导演绎失分。",
        importance: "extend",
      },
      {
        text: "参数正负的方向性意义：$t > 0$ 表示动点 $P$ 在 $P_0$ 沿单位方向向量的正向一侧，$t < 0$ 表示在反方向，常用于高考射线交点与定比分点位置判定。",
        importance: "extend",
      },
    );
  } else if (mode === "secant") {
    theorems.push(
      {
        name:
          conicType === "circle"
            ? "圆的割线定理与圆幂定值"
            : "二次曲线割线方幂与线段乘积",
        latex:
          conicType === "circle"
            ? "|P_0A| \\cdot |P_0B| = |t_1 t_2| = |x_0^2 + y_0^2 - R^2| \\quad (\\text{恒为定值，与 } \\alpha \\text{ 无关})"
            : "|P_0A| \\cdot |P_0B| = |t_1 t_2| = \\left| \\frac{C}{A(\\alpha)} \\right| \\quad (A(\\alpha) \\text{ 随 } \\alpha \\text{ 改变})",
        note:
          conicType === "circle"
            ? "直线标准参数方程代入圆方程后二次项系数 $A=1$，常数项比值 $C/A$ 仅由定点坐标决定，代数严格证明了初中平面几何的割线定理、切割线定理与相交弦定理。"
            : "椭圆、双曲线、抛物线代入后二次项系数 $A$ 依赖于直线倾斜角 $\\alpha$，线段乘积 $|P_0A| \\cdot |P_0B|$ 随割线方向连续改变，反映了二次曲线割线方幂与圆幂的学科本质差异。",
        prerequisites: [
          "判别式 $\\Delta = B^2 - 4AC \\ge 0$",
          "$A \\ne 0$（直线不平行于二次曲线的渐近线或对称轴）",
        ],
        level: "supplementary",
      },
      {
        name: "参数方程弦长公式",
        latex: "|AB| = |t_1 - t_2| = \\frac{\\sqrt{\\Delta}}{|A|}",
        note: "无需分别求出交点坐标，通过参数二次方程的判别式 $\\Delta$ 与二次项系数 $A$ 直接求解弦长，省去直角坐标系的 $\\sqrt{1+k^2}$ 且无斜率奇点。",
        prerequisites: ["$\\Delta \\ge 0$", "$A \\ne 0$"],
        level: "supplementary",
      },
    );
    gaokaoPoints.push(
      {
        text: "新高考求线段积与弦长免斜率讨论：传统斜率方程 $y=k(x-x_0)+y_0$ 遇垂直直线必须分类讨论。而使用直线参数方程统一用 $t_1, t_2$ 求解，彻底规避漏解漏洞。",
        importance: "extend",
      },
      {
        text: "圆幂定理的统一推广：圆中 $|P_0A| \\cdot |P_0B|$ 恒与倾斜角 $\\alpha$ 无关（割线定理/相交弦定理）；在椭圆/双曲线中随 $\\alpha$ 规律变化，常用于定值与最值证明。",
        importance: "extend",
      },
    );
  } else {
    // 高考专题模型 (中点弦 / 倒数和)
    if (gaokaoModel === "midpoint") {
      theorems.push(
        {
          name: "中点弦判定定理",
          latex:
            "P_0 \\text{ 为弦 } AB \\text{ 中点} \\iff t_1 + t_2 = 0 \\iff B = 0",
          note: "当定点 $P_0$ 恰好是弦 $AB$ 的中点时，对应参数 $t_1$ 与 $t_2$ 互为相反数，二次方程一次项系数 $B$ 恒为 $0$。",
          prerequisites: ["$\\Delta > 0$", "$A \\ne 0$"],
          level: "supplementary",
        },
        {
          name: "中点参数与坐标公式",
          latex: "t_M = \\frac{t_1 + t_2}{2} = -\\frac{B}{2A}",
          note: "弦中点 $M$ 的坐标为 $(x_0 + t_M \\cos\\alpha, y_0 + t_M \\sin\\alpha)$。",
          prerequisites: ["$\\Delta \\ge 0$"],
          level: "supplementary",
        },
      );
      gaokaoPoints.push(
        {
          text: "秒求中点弦直线斜率：令一次项系数 $B = 0$ 即可直接建立定点 $(x_0, y_0)$ 与倾斜角 $\\alpha$（或斜率 $k$）的代数关系，计算量远小于点差法与联立方程。",
          importance: "extend",
        },
        {
          text: "中点弦的存在性前提：解出 $\\alpha$（或斜率 $k$）后，必须代回检验判别式 $\\Delta = B^2 - 4AC > 0$，确保直线与曲线真实相交（圆锥曲线内部点必有解，外部点无中点弦）。",
          importance: "extend",
        },
      );
    } else {
      // 倒数和模型根据当前曲线类型高度特化，杜绝跨曲线文本污染
      let reciprocalName = "线段倒数和与同异号分类定理";
      let reciprocalFormula =
        "\\frac{1}{|P_0A|} + \\frac{1}{|P_0B|} = \\begin{cases} \\frac{\\sqrt{\\Delta}}{|C|} & (t_1 t_2 < 0,\\ P_0 \\text{在内部}) \\\\ \\left|\\frac{B}{C}\\right| & (t_1 t_2 > 0,\\ P_0 \\text{在外部}) \\end{cases}";
      let reciprocalNote =
        "高考避坑要害：绝对几何距离倒数和 $\\frac{1}{|t_1|} + \\frac{1}{|t_2|}$ 仅在同号时等于 $\\left|\\frac{B}{C}\\right|$；在异号（如点在曲线内部/焦点弦）时分子为 $|t_1-t_2|=\\frac{\\sqrt{\\Delta}}{|A|}$，倒数和严格等于 $\\frac{\\sqrt{\\Delta}}{|C|}$！";
      const conicGaokaoPoints: GaokaoPoint[] = [];

      if (conicType === "parabola") {
        reciprocalName = "抛物线焦点弦倒数和定值定理";
        reciprocalFormula =
          "P_0 = F\\left(\\frac{p}{2}, 0\\right) \\implies \\frac{1}{|AF|} + \\frac{1}{|BF|} = \\frac{2}{p} \\quad (\\text{恒为定值})";
        reciprocalNote =
          "直线过抛物线 $y^2=2px$ 的焦点 $F$ 时，联立后 $A=\\sin^2\\alpha, B=-2p\\cos\\alpha, C=-p^2$。因焦点在抛物线内部必有 $t_1 t_2 < 0$，判别式 $\\sqrt{\\Delta}=2p$，故倒数和 $\\frac{\\sqrt{\\Delta}}{|C|} = \\frac{2p}{p^2} = \\frac{2}{p}$，与倾斜角 $\\alpha$ 严格无关。";
        conicGaokaoPoints.push(
          {
            text: "抛物线焦点弦定值秒杀：若割线过焦点 $F$，倒数和恒为 $\\frac{1}{|AF|} + \\frac{1}{|BF|} = \\frac{2}{p}$；若弦长为通径（$\\alpha=90^\\circ$），弦长最小为 $2p$。",
            importance: "extend",
          },
          {
            text: "高考防错雷区：因焦点在内部 $t_1 t_2 < 0$，严禁盲目套用同号公式 $\\left|\\frac{B}{C}\\right|$，必须使用异号公式 $\\frac{\\sqrt{\\Delta}}{|C|}$。",
            importance: "extend",
          },
        );
      } else if (conicType === "ellipse") {
        reciprocalName = "椭圆焦点弦通径倒数和定理";
        reciprocalFormula =
          "P_0 = F_1(c, 0) \\implies \\frac{1}{|AF_1|} + \\frac{1}{|BF_1|} = \\frac{2a}{b^2} \\quad (\\text{半通径倒数的 2 倍})";
        reciprocalNote =
          "直线过椭圆 $\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1$ 的焦点 $F_1(c, 0)$ 时，内部弦满足 $t_1 t_2 < 0$。代入标准方程可推导得出焦点弦倒数和恒为 $\\frac{2a}{b^2}$（定值），即通径长度 $\\frac{2b^2}{a}$ 的倒数乘以 4。";
        conicGaokaoPoints.push(
          {
            text: "椭圆焦点弦定值规律：过焦点的相交弦倒数和恒为 $\\frac{2a}{b^2}$，与倾斜角 $\\alpha$ 无关，常用于圆锥曲线定值选择填空题秒解。",
            importance: "extend",
          },
          {
            text: "非焦点定点极值判定：当定点 $P_0$ 偏离焦点时，倒数和随 $\\alpha$ 连续变化；中点弦与垂直弦构成极值边界。",
            importance: "extend",
          },
        );
      } else if (conicType === "hyperbola") {
        reciprocalName = "双曲线焦点弦倒数同异支模型";
        reciprocalFormula =
          "\\begin{cases} t_1 t_2 < 0 & (\\text{割线交于双曲线两支，倒数和为 } \\frac{\\sqrt{\\Delta}}{|C|}) \\\\ t_1 t_2 > 0 & (\\text{割线交于双曲线同支，倒数差为 } \\left|\\frac{B}{C}\\right|) \\end{cases}";
        reciprocalNote =
          "双曲线中割线交于异支时定点在两支之间（$t_1 t_2 < 0$），倒数和套用异号公式；割线交于同支时 $t_1 t_2 > 0$，两交点在定点同侧，倒数之差满足同号代数特征。";
        conicGaokaoPoints.push(
          {
            text: "双曲线渐近线退化边界：当割线倾斜角 $\\alpha$ 趋近渐近线方向时，二次项系数 $A \\to 0$，割线退化为单分支单个交点，韦达定理失效。",
            importance: "extend",
          },
          {
            text: "同支与异支符号判定：通过韦达定理常数项 $t_1 t_2 = \\frac{C}{A}$ 的正负号快速判定割线是穿过双曲线两支还是交于同支。",
            importance: "extend",
          },
        );
      } else {
        reciprocalName = "圆内相交弦与圆外割线倒数和模型";
        reciprocalFormula =
          "\\frac{1}{|P_0A|} + \\frac{1}{|P_0B|} = \\begin{cases} \\frac{\\sqrt{\\Delta}}{|x_0^2+y_0^2-R^2|} & (x_0^2+y_0^2 < R^2,\\ P_0 \\text{在圆内}) \\\\ \\frac{|2(x_0\\cos\\alpha+y_0\\sin\\alpha)|}{|x_0^2+y_0^2-R^2|} & (x_0^2+y_0^2 > R^2,\\ P_0 \\text{在圆外}) \\end{cases}";
        reciprocalNote =
          "圆中常数项 $C=x_0^2+y_0^2-R^2$ 仅取决于定点到圆心的距离。圆内过定点 $P_0$ 的所有弦满足 $|t_1 t_2| = R^2 - d^2$（与倾斜角无关的定值），故倒数和与弦长成正比：割线过圆心（直径，弦长 $2R$ 最大）时倒数和取得极大值，割线垂直于 $OP_0$（弦长最短）时倒数和取得极小值。";
        conicGaokaoPoints.push(
          {
            text: "圆内倒数和极值规律：因 $|t_1 t_2| = R^2 - d^2$ 与倾斜角 $\\alpha$ 无关，故 $\\frac{1}{|P_0A|} + \\frac{1}{|P_0B|} = \\frac{|AB|}{R^2 - d^2}$ 与弦长同向变化——弦长越大，倒数和越大。过圆心的直径弦长最大（$2R$），倒数和取最大值 $\\frac{2R}{R^2-d^2}$；垂直于 $OP_0$ 的弦长最小，倒数和取最小值 $\\frac{2}{\\sqrt{R^2-d^2}}$。",
            importance: "extend",
          },
          {
            text: "与圆幂结合：分母 $|C| = |d^2 - R^2|$ 为圆的方幂，分子随割线倾斜角 $\\alpha$ 呈现三角函数周期极值。",
            importance: "extend",
          },
        );
      }

      theorems.push({
        name: reciprocalName,
        latex: reciprocalFormula,
        note: reciprocalNote,
        prerequisites: [
          "$t_1 \\ne 0$ 且 $t_2 \\ne 0$ ($P_0$ 不在曲线上)",
          "$\\Delta > 0$",
        ],
        level: "supplementary",
      });
      gaokaoPoints.push(...conicGaokaoPoints);
    }
  }

  const warnings: WarningItem[] = [];

  if (Math.abs(kNorm - 1.0) > 1e-3) {
    warnings.push({
      text: `非标准参数警示：当前归一化比例 k_norm = ${kNorm.toFixed(2)} ≠ 1。此时参数 m 不直接等于实际距离，必须乘上系数 k_norm 换算为真距离！`,
      level: "warning",
    });
  }

  if (mode !== "definition" && !intersect.hasIntersection) {
    if (intersect.isDegenerateLine) {
      warnings.push({
        text: "方程退化警示：当前直线倾斜角 α 使得二次项系数 A ≈ 0（如平行于双曲线渐近线或抛物线对称轴），二次方程退化为一元一次方程，仅有单个交点。",
        level: "danger",
      });
    } else {
      warnings.push({
        text: `无交点退化：判别式 Δ = ${intersect.delta.toFixed(2)} < 0，当前直线与${conicType === "circle" ? "圆" : conicType === "ellipse" ? "椭圆" : conicType === "parabola" ? "抛物线" : "双曲线"}无交点，弦长及割线线段乘积无实数解。`,
        level: "warning",
      });
    }
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
  };
}
