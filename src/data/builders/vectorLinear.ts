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

  // 2. 定理列表（根据当前探究模式动态置顶）
  const allTheorems: Record<
    string,
    { name: string; latex: string; prerequisites: string[] }
  > = {
    linearCombo: {
      name: "向量加减与数乘线性运算法则",
      latex:
        "\\vec{s} = \\lambda\\vec{a} + \\mu\\vec{b} = (\\lambda x_a + \\mu x_b, \\lambda y_a + \\mu y_b)",
      prerequisites: [
        "三角形法则 (首尾顺次相接)",
        "平行四边形法则 (共起点作对角线)",
        "数乘几何意义 (λ>0同向, λ<0反向, λ=0零向量)",
      ],
    },
    collinear: {
      name: "三点共线定理 (高考核心大招)",
      latex: "\\vec{OC} = x\\vec{OA} + y\\vec{OB} \\iff x + y = 1",
      prerequisites: [
        "始点 O 为平面内任意基准定点",
        "A, B, C 三点共线充要条件为系数和 x + y = 1",
        "0 ≤ x, y ≤ 1 对应线段 AB 内分点；x=y=0.5 对应中点",
      ],
    },
    collinearCondition: {
      name: "向量平行/共线充要条件",
      latex:
        "\\vec{a} \\parallel \\vec{b} \\iff x_a y_b - x_b y_a = 0 \\quad (\\vec{a} \\neq \\vec{0})",
      prerequisites: [
        "向量共线等价于存在唯一实数 λ 使得 b = λa",
        "坐标交叉相乘之差为 0",
      ],
    },
    basis: {
      name: "平面向量基本定理",
      latex: "\\vec{v} = \\lambda_1\\vec{e}_1 + \\lambda_2\\vec{e}_2",
      prerequisites: [
        "e₁, e₂ 为同一平面内不共线的基底向量 (det ≠ 0)",
        "平面内任一向量 v 存在且唯一确定一对实数 λ₁, λ₂",
      ],
    },
  };

  const theorems: Theorem[] = [];
  if (studyMode === "linearCombo") {
    theorems.push({ ...allTheorems.linearCombo, level: "core" });
    theorems.push({ ...allTheorems.collinearCondition, level: "important" });
    theorems.push({ ...allTheorems.basis, level: "supplementary" });
  } else if (studyMode === "collinear") {
    theorems.push({ ...allTheorems.collinear, level: "core" });
    theorems.push({ ...allTheorems.collinearCondition, level: "core" });
    theorems.push({ ...allTheorems.basis, level: "supplementary" });
  } else {
    theorems.push({ ...allTheorems.basis, level: "core" });
    theorems.push({ ...allTheorems.collinearCondition, level: "important" });
    theorems.push({ ...allTheorems.linearCombo, level: "supplementary" });
  }

  // 3. 高考考点（按模式动态适配）
  const gaokaoPoints: GaokaoPoint[] = [];
  if (studyMode === "linearCombo") {
    gaokaoPoints.push(
      {
        text: "向量三角形不等式：||a| - |b|| ≤ |a ± b| ≤ |a| + |b|，当且仅当 a, b 同向共线或反向共线时取等号。",
        importance: "gaokao",
      },
      {
        text: "差向量几何意义：向量 a - b 是从 b 的终点指向 a 的终点的向量，常用于转化距离与解析模长。",
        importance: "gaokao",
      },
    );
  } else if (studyMode === "collinear") {
    gaokaoPoints.push(
      {
        text: "三点共线分点与面积比（奔驰定理）：若 OC = x·OA + y·OB 且 x+y=1，则 △OAC 与 △OBC 的面积比满足 S_△OBC / S_△OAC = x / y。",
        importance: "gaokao",
      },
      {
        text: "斜率与坐标秒杀：若两向量平行，则坐标交叉相乘 xa*yb - xb*ya = 0（横纵交乘相等），避免讨论斜率不存在的繁琐分类。",
        importance: "gaokao",
      },
    );
  } else {
    gaokaoPoints.push(
      {
        text: "基底法与建系法双向转化：选择互相垂直的单位向量即为平面直角坐标系；在非正交图形（菱形、平行四边形、斜三角形）中，以相邻两边为斜基底可秒杀动点线性表征。",
        importance: "gaokao",
      },
      {
        text: "待定系数法求分解系数：通过向量数量积或列二元一次方程组，求出目标向量在两不共线基底上的唯一投影与分解系数。",
        importance: "gaokao",
      },
    );
  }

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
      text: "基底失效警告：基底向量 e₁ 与 e₂ 共线（交叉相乘值为 0），无法张成二维向量空间，不能唯一分解目标向量！",
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
