import type { MathPanelData } from "../types";
import { computeVectorBasis } from "@/math/vectorBasis";
import type {
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
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
    det,
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
        label: "基底外积 / 行列式 D",
        symbol: "D = e_{1x}e_{2y} - e_{1y}e_{2x}",
        value: det.toFixed(2),
      },
      {
        label: "基底夹角",
        symbol: "\\angle(\\vec{e}_1, \\vec{e}_2)",
        value: `${angleDeg.toFixed(1)}°`,
      },
      {
        label: "分解系数 λ (e1 权重)",
        symbol: "\\color{#EF4444}{\\lambda}",
        value: isCollinear ? "无唯一解" : lambda.toFixed(3),
      },
      {
        label: "分解系数 μ (e2 权重)",
        symbol: "\\color{#D97706}{\\mu}",
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
        symbol: "\\color{#EF4444}{x}",
        value: (params.xCoeff ?? 0.4).toFixed(2),
      },
      {
        label: "基底权重 y (针对 e2)",
        symbol: "\\color{#D97706}{y}",
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

  // 2. 定理列表
  const theorems: Theorem[] = [
    {
      name: "平面向量基本定理",
      latex:
        "\\vec{a} = \\lambda \\vec{e}_1 + \\mu \\vec{e}_2 \\quad (\\vec{e}_1 \\nparallel \\vec{e}_2)",
      condition: "基底 {e1, e2} 为同一平面内不共线的两个非零向量",
      note: "对平面内任意向量 a，有且仅有一对实数 λ, μ 使得 a 可由 e1, e2 线性组合唯一表示。",
      level: "core",
    },
    {
      name: "三点共线与等系数线定理",
      latex:
        "\\vec{OP} = x\\vec{OA} + y\\vec{OB} \\iff x + y = 1 \\quad (A,B,P \\text{ 共线})",
      condition: "O 为平面内任意基准点，A, B, P 为平面上的点",
      note: "当 x+y=1 时 P 在直线 AB 上；当 x+y=k 时，P 点轨迹构成平行于 AB 的等系数直线族。",
      level: "important",
    },
  ];

  // 3. 高考必考点
  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "建系法与斜坐标系转换：设基底 → 写出目标向量与已知向量的分解式 → 求解 λ, μ。",
      importance: "gaokao",
    },
    {
      text: "等系数线法速解向量综合题：已知 OP = x OA + y OB 且 x+y=k 时，平移等系数线确定极值范围。",
      importance: "gaokao",
    },
    {
      text: "三角形四心向量表达：重心 G: (1/3)a + (1/3)b；中点 M: (1/2)a + (1/2)b。",
      importance: "core",
    },
  ];

  // 4. 退化 Warning
  const warnings: WarningItem[] = [];

  if (isCollinear) {
    warnings.push({
      text: "基底向量 e1 与 e2 共线（行列式 D = 0），无法构成平面的一组基底！无法唯一分解任意向量。",
      level: "danger",
    });
  }

  if (modE1 < 1e-4 || modE2 < 1e-4) {
    warnings.push({
      text: "基底向量中存在零向量，无法作为平面向量基底。",
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "基底不共线，分解唯一确定；等和定直线，正交最简捷。",
  };
}
