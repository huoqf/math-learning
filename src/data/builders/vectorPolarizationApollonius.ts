/**
 * src/data/builders/vectorPolarizationApollonius.ts
 * 向量极化恒等式与阿波罗尼斯圆看板数据构建器
 */

import type { MathPanelData } from "../types";
import {
  calcPolarizationIdentity,
  calcApolloniusCircle,
  calcCombinedModel,
} from "@/math/vectorPolarizationApollonius";
import type {
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "@/components/UI";

export function buildVectorPolarizationApolloniusPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) || "polarization";
  const bcLength = params.bcLength ?? 6.0;
  const lambda = params.lambda ?? 2.0;
  const pointAngle = params.pointAngle ?? 45;
  const pointX = params.pointX ?? 2.0;
  const pointY = params.pointY ?? 4.0;

  const quantities: MathQuantity[] = [];
  const warnings: WarningItem[] = [];

  if (studyMode === "polarization") {
    const res = calcPolarizationIdentity(pointX, pointY, bcLength);
    quantities.push(
      {
        label: "底边全长 |BC|",
        symbol: "|\\vec{BC}|",
        value: res.lenBC.toFixed(2),
      },
      {
        label: "半底长 |BM|",
        symbol: "|\\vec{BM}|",
        value: res.lenBM.toFixed(2),
      },
      {
        label: "中线长 |AM|",
        symbol: "|\\vec{AM}|",
        value: res.lenAM.toFixed(2),
      },
      {
        label: "坐标点积 AB · AC",
        symbol: "\\vec{AB} \\cdot \\vec{AC}",
        value: res.dotProductCoord.toFixed(2),
      },
      {
        label: "极化算值 |AM|² - |BM|²",
        symbol: "|\\vec{AM}|^2 - |\\vec{BM}|^2",
        value: res.dotProductPolar.toFixed(2),
      },
    );
  } else if (studyMode === "apollonius") {
    const res = calcApolloniusCircle(bcLength, lambda, pointAngle);
    quantities.push(
      {
        label: "定点跨度 d = |AB|",
        symbol: "d",
        value: bcLength.toFixed(2),
      },
      {
        label: "距离比 λ",
        symbol: "\\lambda = \\frac{|PA|}{|PB|}",
        value: res.ratioP.toFixed(3),
      },
      {
        label: "动点距离 |PA|",
        symbol: "|PA|",
        value: res.distPA.toFixed(2),
      },
      {
        label: "动点距离 |PB|",
        symbol: "|PB|",
        value: res.distPB.toFixed(2),
      },
    );

    if (!res.isDegenerate) {
      quantities.push(
        {
          label: "内分点 D 坐标",
          symbol: "D",
          value: `(${res.pointD.x.toFixed(2)}, 0)`,
        },
        {
          label: "外分点 E 坐标",
          symbol: "E",
          value: `(${res.pointE.x.toFixed(2)}, 0)`,
        },
        {
          label: "阿圆圆心 O_A 坐标",
          symbol: "O_A",
          value: `(${res.centerO.x.toFixed(2)}, 0)`,
        },
        {
          label: "阿圆半径 R_A",
          symbol: "R_A",
          value: res.radiusR.toFixed(2),
        },
      );
    } else {
      warnings.push({
        text: "退化警示：当 $\\lambda = 1.0$ 时，动点 $P$ 到 $A, B$ 距离相等，阿波罗尼斯圆退化为线段 $AB$ 的中垂线 (直线 $x = 0$)，半径趋近于无穷大！",
        level: "danger",
      });
    }
  } else {
    // combined 模式
    const res = calcCombinedModel(bcLength, lambda, pointAngle);
    quantities.push(
      {
        label: "中点 M 坐标",
        symbol: "M",
        value: "(0.00, 0.00)",
      },
      {
        label: "定长 |MB|",
        symbol: "|\\vec{MB}|",
        value: res.lenMB.toFixed(2),
      },
      {
        label: "中线长 |PM|",
        symbol: "|\\vec{PM}|",
        value: res.lenPM.toFixed(2),
      },
      {
        label: "数量积 PA · PB",
        symbol: "\\vec{PA} \\cdot \\vec{PB}",
        value: res.dotProductP.toFixed(2),
      },
      {
        label: "极化算值 |PM|² - |MB|²",
        symbol: "|\\vec{PM}|^2 - |\\vec{MB}|^2",
        value: res.dotProductViaPolar.toFixed(2),
      },
      {
        label: "数量积最小值",
        symbol: "(\\vec{PA} \\cdot \\vec{PB})_{\\text{min}}",
        value: res.minDotProduct.toFixed(2),
      },
      {
        label: "数量积最大值",
        symbol: "(\\vec{PA} \\cdot \\vec{PB})_{\\text{max}}",
        value: Number.isFinite(res.maxDotProduct)
          ? res.maxDotProduct.toFixed(2)
          : "+∞",
      },
    );

    if (res.isDegenerate) {
      warnings.push({
        text: "临界警示：$\\lambda = 1.0$ 时轨迹为中垂线，$|PM|$ 可无限延伸，数量积存在最小值但无最大值！",
        level: "warning",
      });
    }
  }

  const theorems: Theorem[] = [
    {
      name: "向量极化恒等式 (Polarization Identity)",
      latex:
        "\\vec{a} \\cdot \\vec{b} = \\frac{1}{4}\\left(|\\vec{a}+\\vec{b}|^2 - |\\vec{a}-\\vec{b}|^2\\right) = |\\vec{AM}|^2 - |\\vec{BM}|^2",
      prerequisites: [
        "$M$ 为线段 $BC$ 的中点，$AM$ 为三角形中线",
        "将双矢量数量积完全转化为单线段中线长 $|AM|$ 的最值问题",
      ],
    },
    {
      name: "阿波罗尼斯圆定理 (Circle of Apollonius)",
      latex:
        "\\frac{|PA|}{|PB|} = \\lambda \\quad (\\lambda > 0, \\lambda \\neq 1)",
      prerequisites: [
        "平面内到两定点 $A, B$ 的距离之比为常数 $\\lambda (\\lambda \\neq 1)$ 的动点 $P$ 的轨迹为圆",
        "内分点 $D$ 与外分点 $E$ 为该圆直径的两端点",
        "圆心 $O_A = \\left(\\frac{c(\\lambda^2+1)}{\\lambda^2-1}, 0\\right)$，半径 $R_A = \\frac{2c\\lambda}{|\\lambda^2-1|}$",
      ],
    },
    {
      name: "极化恒等式 × 阿圆最值 (新高考综合推论)",
      latex:
        "(\\vec{PA} \\cdot \\vec{PB})_{\\text{min}/\\text{max}} = |\\vec{PM}|_{\\text{min}/\\text{max}}^2 - |\\vec{MB}|^2",
      prerequisites: [
        "动点 $P$ 在阿波罗尼斯圆上运动，$M$ 为定线段 $AB$ 的中点",
        "当 $P, M, O_A$ 三点共线时，距离 $|PM|$ 取得最值，对应阿圆与 $MO_A$ 连线的两个交点 $D$ 和 $E$",
      ],
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "高考压轴必备——极化恒等式：在解非坐标系下的向量数量积题目时，只要遇到两定点一动点，立刻连结两定点中点 $M$！将 $\\vec{PA} \\cdot \\vec{PB}$ 化为 $|PM|^2 - |MA|^2$。",
      importance: "gaokao",
    },
    {
      text: "阿波罗尼斯圆速记：距离比 $\\lambda \\neq 1$ 轨迹必然是圆！圆心在两定点连线上，直径两端点即为内分点 $D$ 和外分点 $E$，快速求得圆心与半径。",
      importance: "gaokao",
    },
    {
      text: "双剑合璧综合题：求阿波罗尼斯圆上动点 $P$ 到两定点 $A, B$ 的数量积 $\\vec{PA} \\cdot \\vec{PB}$ 的取值范围，直接求 $M(0,0)$ 到圆心 $O_A$ 的距离 $d_{OM}$，最大中线为 $d_{OM} + R$，最小中线为 $|d_{OM} - R|$。",
      importance: "gaokao",
    },
  ];

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "中线一拉极化现，阿圆比例定圆心；内分外分切直径，最值共线一眼明！",
  };
}
