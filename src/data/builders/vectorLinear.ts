import type { MathPanelData } from "../types";
import { computeVectorLinear } from "@/math/vectorLinear";
import type {
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "@/components/UI";

export function buildVectorLinearPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) || "linearCombo";
  const lockCollinear = Boolean(config?.lockCollinear ?? true);

  const mathRes = computeVectorLinear({
    ...params,
    lockCollinear,
  });

  const {
    sumVec,
    diffVec,
    normA,
    normB,
    normSum,
    dotProduct,
    angleDeg,
    detAB,
    isCollinearAB,
    pointC,
    coeffSum,
    isThreePointsCollinear,
    isOnSegmentAB,
    targetVecV,
    isBasisValid,
    lambda1,
    lambda2,
  } = mathRes;

  // 1. 动态数学量列表
  const quantities: MathQuantity[] = [];

  if (studyMode === "linearCombo") {
    quantities.push(
      {
        label: "向量 a 的模长",
        symbol: "|\\vec{a}|",
        value: normA.toFixed(2),
      },
      {
        label: "向量 b 的模长",
        symbol: "|\\vec{b}|",
        value: normB.toFixed(2),
      },
      {
        label: "合成向量 s = λa + μb",
        symbol: "\\vec{s}",
        value: `(${sumVec.x.toFixed(1)}, ${sumVec.y.toFixed(1)})`,
      },
      {
        label: "合成向量模长",
        symbol: "|\\vec{s}|",
        value: normSum.toFixed(2),
      },
      {
        label: "差向量 d = a - b",
        symbol: "\\vec{d}",
        value: `(${diffVec.x.toFixed(1)}, ${diffVec.y.toFixed(1)})`,
      },
      {
        label: "向量数量积 a·b",
        symbol: "\\vec{a} \\cdot \\vec{b}",
        value: dotProduct.toFixed(2),
      },
      {
        label: "向量 a 与 b 的夹角",
        symbol: "\\theta",
        value: `${angleDeg.toFixed(1)}°`,
      },
    );
  } else if (studyMode === "collinear") {
    quantities.push(
      {
        label: "共线交叉相乘值 (det)",
        symbol: "x_a y_b - x_b y_a",
        value: detAB.toFixed(2),
      },
      {
        label: "向量 a 与 b 共线状态",
        value: isCollinearAB ? "平行共线 (a // b)" : "不平行",
      },
      {
        label: "点 C 坐标 (x*OA + y*OB)",
        symbol: "\\vec{OC}",
        value: `(${pointC.x.toFixed(1)}, ${pointC.y.toFixed(1)})`,
      },
      {
        label: "系数和 x + y",
        symbol: "x + y",
        value: coeffSum.toFixed(2),
      },
      {
        label: "A, B, C 三点共线判定",
        value: isThreePointsCollinear ? "三点共线 (落在直线 AB 上)" : "不共线",
      },
      {
        label: "位置关系",
        value: isOnSegmentAB
          ? "在线段 AB 内部"
          : isThreePointsCollinear
            ? "在直线 AB 延长线上"
            : "偏离直线 AB",
      },
    );
  } else {
    quantities.push(
      {
        label: "基底行列式 D",
        symbol: "D = x_1 y_2 - x_2 y_1",
        value: detAB.toFixed(2),
      },
      {
        label: "基底有效性",
        value: isBasisValid ? "有效基底 (不共线)" : "无效基底 (共线退化)",
      },
      {
        label: "目标向量 v 坐标",
        symbol: "\\vec{v}",
        value: `(${targetVecV.x}, ${targetVecV.y})`,
      },
      {
        label: "基底 e1 的分解系数",
        symbol: "\\lambda_1",
        value: isBasisValid ? lambda1.toFixed(2) : "无解",
      },
      {
        label: "基底 e2 的分解系数",
        symbol: "\\lambda_2",
        value: isBasisValid ? lambda2.toFixed(2) : "无解",
      },
    );
  }

  // 2. 定理列表
  const theorems: Theorem[] = [
    {
      name: "向量共线充要条件",
      latex:
        "\\vec{b} = \\lambda\\vec{a} \\iff x_1 y_2 - x_2 y_1 = 0 \\quad (\\vec{a} \\neq \\vec{0})",
      prerequisites: ["a 为非零向量", "坐标交叉相乘为 0"],
    },
    {
      name: "三点共线定理 (高考核心考点)",
      latex: "\\vec{OC} = x\\vec{OA} + y\\vec{OB} \\quad (x + y = 1)",
      prerequisites: [
        "始点 O 为平面内任意点",
        "系数和 x + y = 1 时 C 落在直线 AB 上",
      ],
    },
    {
      name: "平面向量基本定理",
      latex: "\\vec{v} = \\lambda_1\\vec{e}_1 + \\lambda_2\\vec{e}_2",
      prerequisites: [
        "e1, e2 为同一平面内不共线的基底向量",
        "分解系数 λ1, λ2 存在且唯一",
      ],
    },
  ];

  // 3. 高考考点
  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "高考热点：三点共线系数和定理 (OC = x*OA + y*OB 且 x + y = 1)。若 0 <= x, y <= 1，则 C 落在线段 AB 上；中点时 x = y = 0.5。",
      importance: "gaokao",
    },
    {
      text: "坐标法与基底法：利用向量线性分解，将复杂的几何线段比例、交点及平行垂直问题转化为联立方程组求解。",
      importance: "gaokao",
    },
  ];

  // 4. 退化与异常警示
  const warnings: WarningItem[] = [];
  if (normA < 1e-4 || normB < 1e-4) {
    warnings.push({
      text: "零向量退化警告：零向量的模长为 0，方向是任意的，零向量与任意向量均平行/共线！",
      level: "danger",
    });
  }

  if (studyMode === "collinear" && !isThreePointsCollinear) {
    warnings.push({
      text: `三点不共线警告：当前系数和 x + y = ${coeffSum.toFixed(2)} ≠ 1，因此点 C 偏离了直线 AB。`,
      level: "warning",
    });
  }

  if (studyMode === "basis" && !isBasisValid) {
    warnings.push({
      text: "基底失效警告：基底向量 e1 与 e2 共线（交叉相乘值为 0），无法张成二维向量空间，不能唯一分解目标向量！",
      level: "danger",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "首尾相接三角形，同起点平行四边形；三点共线和为一，基底不共线唯一分解！",
  };
}
