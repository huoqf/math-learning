import type { MathPanelData } from "../types";
import { computeVectorBasis } from "@/math/vectorBasis";
import { MATH_COLORS } from "@/theme";
import type {
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "@/components/UI";

export function buildVectorBasisPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) || "basisDecomp";

  const mathRes = computeVectorBasis({
    e1x: params.e1x ?? 2.5,
    e1y: params.e1y ?? 0.5,
    e2x: params.e2x ?? 0.5,
    e2y: params.e2y ?? 2.0,
    ax: params.ax ?? 3.5,
    ay: params.ay ?? 3.0,
    thetaDeg: params.thetaDeg ?? 30,
    xCoeff: params.xCoeff ?? 0.4,
    yCoeff: params.yCoeff ?? 0.6,
    ratioT: params.ratioT ?? 0.5,
  });

  const {
    e1,
    e2,
    target,
    isCollinear,
    lambda,
    mu,
    modE1,
    modE2,
    modTarget,
    angleDeg,
    orthoE1,
    orthoE2,
    orthoLambda,
    orthoMu,
    sumCoeff,
    isSumOne,
    collinearPoint,
    midpoint,
    centroid,
    divisionPoint,
  } = mathRes;

  // 1. 动态数学量
  const quantities: MathQuantity[] = [];

  if (studyMode === "basisDecomp") {
    quantities.push(
      {
        label: "基底 e1 坐标",
        symbol: "\\vec{e}_1",
        value: `(${e1.x.toFixed(1)}, ${e1.y.toFixed(1)})`,
      },
      {
        label: "基底 e2 坐标",
        symbol: "\\vec{e}_2",
        value: `(${e2.x.toFixed(1)}, ${e2.y.toFixed(1)})`,
      },
      {
        label: "目标向量 a 坐标",
        symbol: "\\vec{a}",
        value: `(${target.x.toFixed(1)}, ${target.y.toFixed(1)})`,
      },
      {
        label: "目标向量模长",
        symbol: "|\\vec{a}|",
        value: modTarget.toFixed(2),
      },
      {
        label: "基底向量关系",
        symbol: isCollinear
          ? "\\vec{e}_1 \\parallel \\vec{e}_2"
          : "\\vec{e}_1 \\nparallel \\vec{e}_2",
        value: isCollinear ? "共线 (无法构成基底)" : "不共线 (构成基底)",
        color: isCollinear
          ? MATH_COLORS.paramPrimary
          : MATH_COLORS.paramTertiary,
      },
      {
        label: "基底夹角",
        symbol: "\\angle(\\vec{e}_1, \\vec{e}_2)",
        value: `${angleDeg.toFixed(1)}°`,
      },
      {
        label: "分解系数 λ (e1 权重)",
        symbol: `\\color{${MATH_COLORS.paramPrimary}}{\\lambda}`,
        value: isCollinear ? "无唯一解" : lambda.toFixed(3),
      },
      {
        label: "分解系数 μ (e2 权重)",
        symbol: `\\color{${MATH_COLORS.paramSecondary}}{\\mu}`,
        value: isCollinear ? "无唯一解" : mu.toFixed(3),
      },
    );
  } else if (studyMode === "orthogonal") {
    quantities.push(
      {
        label: "正交基底 e1'",
        symbol: "\\vec{e}_1'",
        value: `(${orthoE1.x.toFixed(2)}, ${orthoE1.y.toFixed(2)})`,
      },
      {
        label: "正交基底 e2'",
        symbol: "\\vec{e}_2'",
        value: `(${orthoE2.x.toFixed(2)}, ${orthoE2.y.toFixed(2)})`,
      },
      {
        label: "目标向量 a",
        symbol: "\\vec{a}",
        value: `(${target.x.toFixed(1)}, ${target.y.toFixed(1)})`,
      },
      {
        label: "正交投影系数 x'",
        symbol: "\\vec{a} \\cdot \\vec{e}_1'",
        value: orthoLambda.toFixed(3),
      },
      {
        label: "正交投影系数 y'",
        symbol: "\\vec{a} \\cdot \\vec{e}_2'",
        value: orthoMu.toFixed(3),
      },
      {
        label: "模长平方 (|a|²)",
        symbol: "x'^2 + y'^2",
        value: (orthoLambda ** 2 + orthoMu ** 2).toFixed(2),
      },
    );
  } else if (studyMode === "collinear") {
    quantities.push(
      {
        label: "基底权重 x (针对 e1)",
        symbol: `\\color{${MATH_COLORS.paramPrimary}}{x}`,
        value: (params.xCoeff ?? 0.4).toFixed(2),
      },
      {
        label: "基底权重 y (针对 e2)",
        symbol: `\\color{${MATH_COLORS.paramSecondary}}{y}`,
        value: (params.yCoeff ?? 0.6).toFixed(2),
      },
      {
        label: "权重之和 (x + y)",
        symbol: "x + y",
        value: sumCoeff.toFixed(2),
      },
      {
        label: "三点共线判定",
        value: isSumOne
          ? "满足 x+y=1 (三点共线)"
          : `x+y = ${sumCoeff} (偏离直线)`,
      },
      {
        label: "合成点 P 坐标",
        symbol: "\\vec{OP}",
        value: `(${collinearPoint.x.toFixed(1)}, ${collinearPoint.y.toFixed(1)})`,
      },
    );
  } else if (studyMode === "triangleGeom") {
    quantities.push(
      {
        label: "顶点 A (向量 e1)",
        symbol: "\\vec{OA}",
        value: `(${e1.x.toFixed(1)}, ${e1.y.toFixed(1)})`,
      },
      {
        label: "顶点 B (向量 e2)",
        symbol: "\\vec{OB}",
        value: `(${e2.x.toFixed(1)}, ${e2.y.toFixed(1)})`,
      },
      {
        label: "AB 中点 M",
        symbol: "\\vec{OM} = \\frac{1}{2}\\vec{a} + \\frac{1}{2}\\vec{b}",
        value: `(${midpoint.x.toFixed(1)}, ${midpoint.y.toFixed(1)})`,
      },
      {
        label: "△OAB 重心 G",
        symbol: "\\vec{OG} = \\frac{1}{3}\\vec{a} + \\frac{1}{3}\\vec{b}",
        value: `(${centroid.x.toFixed(1)}, ${centroid.y.toFixed(1)})`,
      },
      {
        label: "内分点 P 坐标",
        symbol: "\\vec{OP}",
        value: `(${divisionPoint.x.toFixed(1)}, ${divisionPoint.y.toFixed(1)})`,
      },
    );
  }

  // 2. 定理列表（根据当前模式动态置顶核心定理）
  const allTheorems: Record<string, Theorem> = {
    basisTheorem: {
      name: "平面向量基本定理",
      latex:
        "\\vec{a} = \\lambda \\vec{e}_1 + \\mu \\vec{e}_2 \\quad (\\vec{e}_1 \\nparallel \\vec{e}_2)",
      condition: "基底 {e1, e2} 为同一平面内不共线的两个非零向量",
      note: "对平面内任意向量 a，有且仅有一对实数 λ, μ 使得 a 可由 e1, e2 线性组合唯一表示。",
      level: studyMode === "basisDecomp" ? "core" : "important",
    },
    orthogonalTheorem: {
      name: "正交分解与投影定理",
      latex:
        "\\vec{a} = (\\vec{a}\\cdot\\vec{e}_1')\\vec{e}_1' + (\\vec{a}\\cdot\\vec{e}_2')\\vec{e}_2'",
      condition: "{e1', e2'} 为互相垂直的单位基底 (|e1'|=|e2'|=1, e1' ⊥ e2')",
      note: "正交基底下分解系数即向量在坐标轴上的正交投影长度，模长满足勾股定理。",
      level: studyMode === "orthogonal" ? "core" : "important",
    },
    collinearTheorem: {
      name: "三点共线与等系数线定理",
      latex:
        "\\vec{OP} = x\\vec{OA} + y\\vec{OB} \\iff x + y = 1 \\quad (A,B,P \\text{ 共线})",
      condition: "O 为平面内任意基准点，A, B, P 为平面上的点",
      note: "当 x+y=1 时 P 在直线 AB 上；当 x+y=k 时，P 点轨迹构成平行于 AB 的等系数直线族。",
      level: studyMode === "collinear" ? "core" : "important",
    },
    triangleTheorem: {
      name: "爪子模型与重心向量定理",
      latex:
        "\\vec{OP} = (1-t)\\vec{OA} + t\\vec{OB}, \\quad \\vec{OG} = \\frac{1}{3}(\\vec{OA} + \\vec{OB})",
      condition: "P 为线段 AB 上分点 (AP/AB = t)，G 为 △OAB 的重心",
      note: "一维线段上的内分点在基底下的系数和恒为 1，体现凸组合几何本质。",
      level: studyMode === "triangleGeom" ? "core" : "important",
    },
  };

  const modeTheoremKeys: Record<string, string[]> = {
    basisDecomp: ["basisTheorem", "orthogonalTheorem", "collinearTheorem"],
    orthogonal: ["orthogonalTheorem", "basisTheorem", "collinearTheorem"],
    collinear: ["collinearTheorem", "triangleTheorem", "basisTheorem"],
    triangleGeom: ["triangleTheorem", "collinearTheorem", "basisTheorem"],
  };

  const selectedKeys = modeTheoremKeys[studyMode] ?? [
    "basisTheorem",
    "collinearTheorem",
  ];
  const theorems: Theorem[] = selectedKeys.map((k) => allTheorems[k]);

  // 3. 高考必考点（随模式提供实战大招）
  const gaokaoPoints: GaokaoPoint[] = [];

  if (studyMode === "basisDecomp") {
    gaokaoPoints.push(
      {
        text: "斜基底建系与度量化：选取夹角与模长已知的两共起点向量作为基底，将未知向量与数量积全部转化为基底表示。",
        importance: "gaokao",
      },
      {
        text: "待定系数法求分解：设 $\\vec{OE} = \\lambda\\vec{e}_1 + \\mu\\vec{e}_2$，由坐标相等建立二元一次方程组；方程组有唯一解当且仅当两基底向量不共线（$\\vec{e}_1 \\nparallel \\vec{e}_2$）。",
        importance: "core",
      },
    );
  } else if (studyMode === "orthogonal") {
    gaokaoPoints.push(
      {
        text: "正交建系秒杀解析几何：遇互相垂直线段（如直角三角形、矩形）首选建立直角坐标系，将几何问题代数化。",
        importance: "gaokao",
      },
      {
        text: "旋转正交系分解：当图形具有特定倾斜对称轴时，旋转坐标系可大幅简化投影计算。",
        importance: "core",
      },
    );
  } else if (studyMode === "collinear") {
    gaokaoPoints.push(
      {
        text: "等系数线法速解最值：已知 OP = x OA + y OB 且 x+y=k 时，平移等系数线确定向量模长或点积极值范围。",
        importance: "gaokao",
      },
      {
        text: "交点分点比模型：利用两条共线直线对应的系数和条件（x+y=1 与 m+n=1）联立求解交点向量坐标。",
        importance: "gaokao",
      },
    );
  } else {
    gaokaoPoints.push(
      {
        text: "爪子模型与分点定比：P 在 AB 上且 AP:PB = λ:μ 时，OP = (μ/(λ+μ))OA + (λ/(λ+μ))OB，两系数和必为 1。",
        importance: "gaokao",
      },
      {
        text: "三角形四心的向量表示（拓展 · 超出课标）：重心满足 GA + GB + GC = 0；内心、外心、垂心可由边长比或向量等式给出。",
        importance: "extend",
      },
    );
  }

  // 4. 退化 Warning
  const warnings: WarningItem[] = [];

  if (isCollinear) {
    warnings.push({
      text: "基底向量 $\\vec{e}_1$ 与 $\\vec{e}_2$ 共线（$\\vec{e}_1 \\parallel \\vec{e}_2$），无法构成平面的一组基底！无法唯一分解任意向量。",
      level: "danger",
    });
  }

  if (modE1 < 1e-4 || modE2 < 1e-4) {
    warnings.push({
      text: "基底向量中存在零向量，无法作为平面向量基底。",
      level: "warning",
    });
  }

  // 推导链（P1-18）：① 符号表达式 → ② 代入解析式 → ③ 结果，逐模式给出
  const reasoningSteps: ReasoningStep[] = [];

  if (studyMode === "basisDecomp") {
    reasoningSteps.push(
      {
        step: 1,
        title: "定理建模 · 设待定分解系数",
        detail:
          "由平面向量基本定理，平面内任意向量 $\\vec{a}$ 在基底 $\\{\\vec{e}_1, \\vec{e}_2\\}$ 下分解唯一，设待定系数 $\\lambda, \\mu$。",
        latex: "\\vec{a} = \\lambda \\vec{e}_1 + \\mu \\vec{e}_2",
        rubric: "[高考采分点] 设出待定分解式 (+1分)",
      },
      {
        step: 2,
        title: "坐标对应 · 转二元一次方程组",
        detail: `比较横纵坐标，得到关于 $\\lambda, \\mu$ 的二元一次方程组；因基底向量不共线，方程组必有唯一确定的解。`,
        latex: `\\begin{cases} ${e1.x.toFixed(1)}\\lambda + ${e2.x.toFixed(1)}\\mu = ${target.x.toFixed(1)} \\\\ ${e1.y.toFixed(1)}\\lambda + ${e2.y.toFixed(1)}\\mu = ${target.y.toFixed(1)} \\end{cases}`,
        rubric: "[高考采分点] 坐标对应建立方程组 (+2分)",
      },
      {
        step: 3,
        title: "回代验证 · 唯一性判据",
        detail: isCollinear
          ? "基底两向量共线，分解系数不唯一，方程组无解或有无穷多解，向量无法唯一分解。"
          : `解得 $\\lambda = ${lambda.toFixed(3)}$、$\\mu = ${mu.toFixed(3)}$；因基底向量不共线，分解唯一。回代得 $(${lambda.toFixed(3)})\\vec{e}_1 + (${mu.toFixed(3)})\\vec{e}_2 = (${target.x.toFixed(1)}, ${target.y.toFixed(1)})$。`,
        latex: `\\vec{a} = ${lambda.toFixed(3)}\\vec{e}_1 + ${mu.toFixed(3)}\\vec{e}_2`,
        rubric: "[高考采分点] 解方程组并回代验证 (+3分)",
      },
    );
  } else if (studyMode === "orthogonal") {
    reasoningSteps.push(
      {
        step: 1,
        title: "正交基底 · 投影系数即坐标",
        detail:
          "在标准正交基底 $\\{\\vec{e}_1', \\vec{e}_2'\\}$ 下，分解系数等于向量在两条轴上的正交投影。",
        latex:
          "\\vec{a} = (\\vec{a}\\cdot\\vec{e}_1')\\vec{e}_1' + (\\vec{a}\\cdot\\vec{e}_2')\\vec{e}_2'",
        rubric: "[高考采分点] 写出正交分解式 (+2分)",
      },
      {
        step: 2,
        title: "代入求投影系数",
        detail: `投影系数 $x' = ${orthoLambda.toFixed(3)}$、$y' = ${orthoMu.toFixed(3)}$。`,
        latex: `\\vec{a} = ${orthoLambda.toFixed(3)}\\vec{e}_1' + ${orthoMu.toFixed(3)}\\vec{e}_2'`,
        rubric: "[高考采分点] 代值求正交投影系数 (+2分)",
      },
      {
        step: 3,
        title: "勾股验证 · 模长平方守恒",
        detail: `正交基底下模长满足勾股定理：$x'^2 + y'^2 = ${(orthoLambda ** 2 + orthoMu ** 2).toFixed(2)}$，与直接计算 $|\\vec{a}|^2 = ${(modTarget ** 2).toFixed(2)}$ 一致。`,
        latex: `x'^2 + y'^2 = (${orthoLambda.toFixed(3)})^2 + (${orthoMu.toFixed(3)})^2 = ${(orthoLambda ** 2 + orthoMu ** 2).toFixed(2)}`,
        rubric: "[高考采分点] 勾股定理回代校验 (+2分)",
      },
    );
  } else if (studyMode === "collinear") {
    reasoningSteps.push(
      {
        step: 1,
        title: "等系数线 · 基底分解式",
        detail:
          "取基准点 $O$，把动点向量 $\\vec{OP}$ 用两条定向量 $\\vec{OA}, \\vec{OB}$ 分解。",
        latex: "\\vec{OP} = x\\vec{OA} + y\\vec{OB}",
        rubric: "[高考采分点] 写出基底分解式 (+1分)",
      },
      {
        step: 2,
        title: "计算两系数之和",
        detail: `代入权重 $x = ${(params.xCoeff ?? 0.4).toFixed(2)}$、$y = ${(params.yCoeff ?? 0.6).toFixed(2)}$，得 $x + y = ${sumCoeff.toFixed(2)}$。`,
        latex: `x + y = ${(params.xCoeff ?? 0.4).toFixed(2)} + ${(params.yCoeff ?? 0.6).toFixed(2)} = ${sumCoeff.toFixed(2)}`,
        rubric: "[高考采分点] 计算两系数之和 (+2分)",
      },
      {
        step: 3,
        title: "共线判定 · 系数和定成败",
        detail: isSumOne
          ? `$x + y = 1$，故 $A, B, P$ 三点共线，$\\vec{OP}$ 的终点落在直线 $AB$ 上。`
          : `$x + y = ${sumCoeff.toFixed(2)} \\neq 1$，$P$ 落在平行于 $AB$ 的等系数直线上，不与 $A, B$ 共线。`,
        latex: `A, B, P \\text{ 共线} \\iff x + y = 1; \\quad x + y = ${sumCoeff.toFixed(2)} ${isSumOne ? "= 1" : "\\neq 1"} \\implies A, B, P ${isSumOne ? "\\text{共线}" : "\\text{不共线}"}`,
        rubric: "[高考采分点] 由系数和判定三点共线 (+3分)",
      },
    );
  } else {
    reasoningSteps.push(
      {
        step: 1,
        title: "爪子模型 · 分点向量分解",
        detail:
          "点 $P$ 在线段 $AB$ 上，由定比分点公式把 $\\vec{OP}$ 表示为两端点向量的凸组合。",
        latex: "\\vec{OP} = (1-t)\\vec{OA} + t\\vec{OB}",
        rubric: "[高考采分点] 写出分点向量公式 (+2分)",
      },
      {
        step: 2,
        title: "代入数值 · 中点与重心",
        detail: `取 $t = ${(params.ratioT ?? 0.5).toFixed(2)}$，得内分点 $P(${divisionPoint.x.toFixed(1)}, ${divisionPoint.y.toFixed(1)})$；中点 $M = \\dfrac{1}{2}\\vec{OA} + \\dfrac{1}{2}\\vec{OB}$、重心 $G = \\dfrac{1}{3}\\vec{OA} + \\dfrac{1}{3}\\vec{OB}$ 均为 $t$ 的特殊取值。`,
        latex: `\\vec{OP} = ${(1 - (params.ratioT ?? 0.5)).toFixed(2)}\\vec{OA} + ${(params.ratioT ?? 0.5).toFixed(2)}\\vec{OB}`,
        rubric: "[高考采分点] 代值求分点坐标 (+2分)",
      },
      {
        step: 3,
        title: "系数和恒为 1 · 凸组合本质",
        detail: `任意分点两系数和恒等于 $1$：$(1-t) + t = 1$，这正是「三点共线 ⟺ 系数和为 1」的根源。此处 $\\vec{OP} = ${(1 - (params.ratioT ?? 0.5)).toFixed(2)}\\vec{OA} + ${(params.ratioT ?? 0.5).toFixed(2)}\\vec{OB}$。`,
        latex: `(1-t) + t = 1 \\;\\Rightarrow\\; \\vec{OM} = \\tfrac{1}{2}\\vec{OA} + \\tfrac{1}{2}\\vec{OB}`,
        rubric: "[高考采分点] 说明系数和恒为 1 的几何意义 (+3分)",
      },
    );
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic: "基底不共线，分解唯一确定；等和定直线，正交最简捷。",
  };
}
