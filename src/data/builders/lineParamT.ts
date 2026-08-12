import type {
  MathPanelData,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
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
        labelFormula: "P_0(x_0, y_0)",
        value: `(${x0.toFixed(2)}, ${y0.toFixed(2)})`,
      },
      {
        label: "倾斜角与方向向量",
        labelFormula: "(\\cos\\alpha, \\sin\\alpha)",
        value: `α = ${alpha}°, e = (${Math.cos((alpha * Math.PI) / 180).toFixed(
          2,
        )}, ${Math.sin((alpha * Math.PI) / 180).toFixed(2)})`,
      },
      {
        label: "标准动点 P 参数与距离",
        labelFormula: "|P_0P| = |t|",
        value: `t = ${t.toFixed(2)}, 距离 |P_0P| = ${Math.abs(t).toFixed(2)}`,
        status: "normal" as const,
      },
      {
        label: "非标准点 P' 参数与位移",
        labelFormula: "|P_0P'| = k_{\\text{norm}}|m|",
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
        labelFormula: "P_0(x_0, y_0)",
        value: `(${x0.toFixed(2)}, ${y0.toFixed(2)})`,
      },
      {
        label: "二次方程系数 A, B, C",
        labelFormula: "A t^2 + B t + C = 0",
        value: `A=${intersect.A.toFixed(3)}, B=${intersect.B.toFixed(
          3,
        )}, C=${intersect.C.toFixed(3)}`,
      },
      {
        label: "判别式 Δ",
        labelFormula: "\\Delta = B^2 - 4AC",
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
          labelFormula: "t_1, t_2",
          value: `t1 = ${intersect.t1.toFixed(2)}, t2 = ${intersect.t2.toFixed(
            2,
          )}`,
        },
        {
          label: "韦达定理和与积",
          labelFormula: "t_1+t_2, \\quad t_1 t_2",
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
          label: "割线/切割线线段乘积",
          labelFormula: "|PA| \\cdot |PB| = |t_1 t_2|",
          value: intersect.segmentProduct.toFixed(3),
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
          labelFormula: "B = 0 \\iff P_0 \\text{ 为弦中点}",
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
          labelFormula: "C = f(x_0, y_0)",
          value: `C = ${intersect.C.toFixed(3)}`,
        },
        {
          label: "转动角度 α 下方幂不变性",
          labelFormula: "\\text{圆中与倾斜角 } \\alpha \\text{ 无关}",
          value: conicType === "circle" ? "为定值 (与α无关)" : "随倾斜角α改变",
        },
      );
    } else {
      // reciprocal (倒数和)
      quantities.push(
        {
          label: "线段倒数和",
          labelFormula:
            "\\left|\\frac{1}{t_1} + \\frac{1}{t_2}\\right| = \\left|\\frac{B}{C}\\right|",
          value:
            intersect.reciprocalSum !== undefined
              ? intersect.reciprocalSum.toFixed(3)
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

  const theorems: Theorem[] = [
    {
      name: "直线标准参数方程的几何意义",
      latex:
        "\\begin{cases} x = x_0 + t \\cos\\alpha \\\\ y = y_0 + t \\sin\\alpha \\end{cases}",
      note: "当直线的方向向量为单位向量 (cosα, sinα) 时，参数 |t| 表示动点 P(x, y) 到定点 P0(x0, y0) 的绝对距离；t 的符号表示在向量方向上的相对指向。",
      prerequisites: [
        "直线倾斜角 α ∈ [0, π)",
        "向量 (cosα, sinα) 必须为单位向量",
      ],
      level: "core",
    },
    {
      name: "割线定理与二次曲线幂的统一",
      latex: "|P_0A| \\cdot |P_0B| = |t_1 t_2| = \\left| \\frac{C}{A} \\right|",
      note: "将直线标准参数方程代入二次曲线方程得 A t² + B t + C = 0。若交点为 A(t₁), B(t₂)，则有向线段积 |P₀A|·|P₀B| 等于 |t₁ t₂|，极大地简化了几何距离乘积的求解。",
      prerequisites: [
        "判别式 Δ = B² - 4AC ≥ 0",
        "A ≠ 0（直线不平行于二次曲线的渐近线或轴）",
      ],
      level: "important",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "新高考求线段积与弦长免斜率讨论：传统斜率 y=k(x-x0)+y0 方法遇到 '垂直于 x 轴 (斜率不存在)' 时需要分类讨论。而使用直线参数方程只需要设 α 倾斜角，统一用 t1, t2 求解弦长与线段积，消除了分类讨论的冗余。",
      importance: "gaokao",
    },
    {
      text: "非标准参数方程扣分陷阱（归一化）：当参数方程写为 x=x0+am, y=y0+bm 且 a²+b² ≠ 1 时，m 不等于实际几何距离！此时真正的距离是 √(a²+b²)·|m|。高考中若直接令 |AB|=|m1-m2| 将直接导致整步扣分。",
      importance: "hard",
    },
    {
      text: "弦中点与中点弦条件：定点 P0 为弦 AB 的中点 ⇔ t1 + t2 = 0 ⇔ 二次方程一次项系数 B = 0。在求过定点平分弦的直线斜率时非常高效。",
      importance: "core",
    },
  ];

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
        text: `无交点退化：判别式 Δ = ${intersect.delta.toFixed(2)} < 0，当前直线与${conicType === "circle" ? "圆" : conicType === "ellipse" ? "椭圆" : conicType === "parabola" ? "抛物线" : "双曲线"}无交点，弦长及割线定理无实数解。`,
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
