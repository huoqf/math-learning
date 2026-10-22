import type { MathPanelData } from "../types";
import { computeVectorLinear } from "@/math/vectorLinear";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  VECTOR_PHYSICS_PRESETS,
  type VectorPhysicsContext,
} from "@/data/registries/vectorLinear";
import type {
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
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
    a: vecA,
    b: vecB,
    sumAB,
    sumVec,
    diffVec,
    normA,
    normB,
    normSum,
    dotProduct,
    angleDeg,
    isAngleDefined,
    unitA,
    unitB,
    isUnitADefined,
    isUnitBDefined,
    unitDotProduct,
    detAB,
    isCollinearAB,
    isCollinearRatioDefined,
    closingVec,
    pointC,
    coeffSum,
    isThreePointsCollinear,
    isOnSegmentAB,
    targetVecV,
    isBasisValid,
    lambda1,
    lambda2,
  } = mathRes;

  /**
   * 实际背景（必修二 6.4.2 向量在物理中的应用）。
   *
   * 由 Animation 从 presetKey 解出后**透传**进来，而不是在本层按 presetKey 反查——
   * 数据层只认语义化的 physicsContext，不认识左屏的预设 key（避免两侧键名各自漂移）。
   */
  const physicsContext = (config?.physicsContext as string) || "";
  const physics =
    physicsContext in VECTOR_PHYSICS_PRESETS
      ? VECTOR_PHYSICS_PRESETS[physicsContext as VectorPhysicsContext]
      : null;

  // 1. 动态数学量列表
  const quantities: MathQuantity[] = [];

  if (studyMode === "coordinate") {
    /**
     * 直角坐标运算（必修二 6.3）：把「几何动作」逐条翻译成「分量运算」。
     *
     * 五条读数按课堂推演顺序排列：先分别给出 a、b 的坐标（对象），
     * 再给出加减与数乘的结果（运算），最后用 x₁y₂−x₂y₁ 收口共线判据（判据）。
     */
    const lambda = params.lambda ?? 1;
    quantities.push(
      {
        label: "向量 a 的坐标",
        symbol: "\\vec{a}",
        value: `(${formatMathNumber(vecA.x)}, ${formatMathNumber(vecA.y)})`,
      },
      {
        label: "向量 b 的坐标",
        symbol: "\\vec{b}",
        value: `(${formatMathNumber(vecB.x)}, ${formatMathNumber(vecB.y)})`,
      },
      {
        label: "和向量 a + b 的坐标",
        symbol: "\\vec{a}+\\vec{b}",
        value: `(${formatMathNumber(sumAB.x)}, ${formatMathNumber(sumAB.y)})`,
      },
      {
        label: "差向量 a − b 的坐标",
        symbol: "\\vec{a}-\\vec{b}",
        value: `(${formatMathNumber(diffVec.x)}, ${formatMathNumber(diffVec.y)})`,
      },
      {
        label: `数乘向量 ${formatMathNumber(lambda)}a 的坐标`,
        symbol: "\\lambda\\vec{a}",
        value: `(${formatMathNumber(lambda * vecA.x)}, ${formatMathNumber(lambda * vecA.y)})`,
      },
      {
        label: "共线判据 x₁y₂ − x₂y₁",
        symbol: "x_ay_b-x_by_a",
        value: `${formatMathNumber(detAB)}（${isCollinearAB ? "共线" : "不共线"}）`,
      },
    );
  } else if (studyMode === "linearCombo" && physics) {
    const n = physics.naming;
    quantities.push(
      {
        label: `${n.first.name}的大小`,
        symbol: `|${n.first.vecLatex}|`,
        value: normA.toFixed(2),
      },
      {
        label: `${n.second.name}的大小`,
        symbol: `|${n.second.vecLatex}|`,
        value: normB.toFixed(2),
      },
      {
        label: `${n.resultant.name}的坐标`,
        symbol: n.resultant.vecLatex,
        value: `(${sumVec.x.toFixed(1)}, ${sumVec.y.toFixed(1)})`,
      },
      {
        label: `${n.resultant.name}的大小`,
        symbol: `|${n.resultant.vecLatex}|`,
        value: normSum.toFixed(2),
      },
      {
        label: n.third ? "两已知力的夹角" : "两已知向量的夹角",
        symbol: "\\theta",
        value: isAngleDefined
          ? `${angleDeg.toFixed(1)}°`
          : "无定义（存在零向量）",
      },
    );

    if (n.third) {
      // 平衡条件 F₁ + F₂ + F₃ = 0 ⇒ 第三力必与前两力的合力等大反向
      quantities.push({
        label: `${n.third.name}的大小`,
        symbol: `|${n.third.vecLatex}|`,
        value: normSum.toFixed(2),
      });
    }
  } else if (studyMode === "linearCombo") {
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
        // 单位向量：模长恒为 1 的方向载体（必修二 6.2.3 向量的单位化）
        label: "向量 a 的单位向量（模长恒为 1）",
        symbol: "\\vec{e}_a = \\frac{\\vec{a}}{|\\vec{a}|}",
        value: isUnitADefined
          ? `(${unitA.x.toFixed(2)}, ${unitA.y.toFixed(2)})`
          : "无定义（零向量）",
      },
      {
        label: "向量 b 的单位向量（模长恒为 1）",
        symbol: "\\vec{e}_b = \\frac{\\vec{b}}{|\\vec{b}|}",
        value: isUnitBDefined
          ? `(${unitB.x.toFixed(2)}, ${unitB.y.toFixed(2)})`
          : "无定义（零向量）",
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
        value: isAngleDefined
          ? `${angleDeg.toFixed(1)}°`
          : "无定义（存在零向量）",
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
        label: "不共线判据 D",
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
    {
      name: string;
      latex: string;
      /** 适用条件（可选，用于承载不方便写进 latex 的判据表述） */
      condition?: string;
      prerequisites: string[];
    }
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
    physicsVectorApplication: {
      name: "向量加法的物理意义：力的合成与三力平衡",
      latex: "\\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3 = \\vec{0}",
      condition: "三力平衡 $\\iff$ 三力首尾相接构成闭合三角形",
      prerequisites: [
        "力的合成：两个共点力可用平行四边形法则合成，合力 F = F₁ + F₂",
        "三力平衡的向量判据：三力平衡当且仅当三力向量之和为零，即三力首尾相接构成闭合三角形",
        "速度的合成：船的实际速度等于静水船速与水流速度的向量和（同为向量加法）",
      ],
    },
    unitVector: {
      name: "单位向量与向量单位化",
      latex:
        "\\vec{e}_a = \\frac{\\vec{a}}{|\\vec{a}|} \\qquad (\\vec{a} \\neq \\vec{0})",
      prerequisites: [
        "单位向量：模长恰为 1 的向量，其方向完全由原向量决定",
        "与 $\\vec{a}$ 同向的单位向量唯一，即 $\\vec{e}_a = \\dfrac{\\vec{a}}{|\\vec{a}|}$；与 $\\vec{a}$ 共线的单位向量共两个（$\\pm\\vec{e}_a$）",
        "单位化把长度与方向彻底分离：$|\\vec{a}|$ 只携带长度，$\\vec{e}_a$ 只携带方向，故 $\\vec{a} = |\\vec{a}|\\vec{e}_a$",
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
    coordinateOperation: {
      name: "平面向量运算的坐标表示",
      latex:
        "\\vec{a}\\pm\\vec{b} = (x_a\\pm x_b,\\; y_a\\pm y_b), \\quad \\lambda\\vec{a} = (\\lambda x_a,\\; \\lambda y_a)",
      prerequisites: [
        "坐标形式的前提：把向量起点平移到原点，终点坐标即向量坐标",
        "加减法只对同名分量运算（横加横、纵加纵），不得交叉",
        "数乘 $\\lambda\\vec{a}$ 使每个分量同乘 $\\lambda$：$|\\lambda\\vec{a}| = |\\lambda||\\vec{a}|$，$\\lambda<0$ 时方向反向",
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
  if (studyMode === "coordinate") {
    theorems.push({ ...allTheorems.coordinateOperation, level: "core" });
    theorems.push({ ...allTheorems.collinearCondition, level: "important" });
    theorems.push({ ...allTheorems.linearCombo, level: "supplementary" });
  } else if (studyMode === "linearCombo" && physics) {
    theorems.push({ ...allTheorems.physicsVectorApplication, level: "core" });
    theorems.push({ ...allTheorems.linearCombo, level: "important" });
    theorems.push({ ...allTheorems.unitVector, level: "supplementary" });
  } else if (studyMode === "linearCombo") {
    theorems.push({ ...allTheorems.linearCombo, level: "core" });
    theorems.push({ ...allTheorems.unitVector, level: "important" });
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
  if (studyMode === "coordinate") {
    gaokaoPoints.push(
      {
        text: "坐标运算的唯一正确姿势：先把起点平移到原点，终点坐标才是向量坐标。两条向量只要起点不同，就必须先平移再谈坐标——直接把两点坐标相减当成向量坐标，是选填题最常见的失分点。",
        importance: "gaokao",
      },
      {
        text: "共线判据的两种形态：$x_ay_b - x_by_a = 0$（交叉相乘相等）与 $\\vec{a} = \\lambda\\vec{b}$ 完全等价，前者避免了讨论斜率是否存在的分类；但使用前必须先排除零向量——$\\vec{0}$ 与任意向量共线，交叉相乘恒为 0，会把「零向量」误判成「方向确定」。",
        importance: "hard",
      },
      {
        text: "数乘与模长的联动：$|\\lambda\\vec{a}| = |\\lambda|\\,|\\vec{a}|$ 中绝对值不可省。$\\lambda < 0$ 时方向反转但模长仍按 $|\\lambda|$ 放大，这正是「同向共线」与「反向共线」在坐标上的唯一差别。",
        importance: "basic",
      },
    );
  } else if (studyMode === "linearCombo" && physics) {
    const n = physics.naming;
    // 情景专属考点（三种物理外衣各自的高考落点，互不串味）
    if (physicsContext === "force-balance") {
      gaokaoPoints.push(
        {
          text: "三力平衡的向量判据（力的三角形法）：三力平衡 $\\iff$ 三力首尾相接构成闭合三角形。解题时先用向量加法求出任意两力的合力，第三力必与该合力等大反向，从而把三个力的平衡问题化归为一个三角形的边角关系。",
          importance: "gaokao",
        },
        {
          text: "合力大小的取值范围：两共点力的合力大小介于「两力大小之差的绝对值」与「两力大小之和」之间——取最小值当且仅当两力反向共线，取最大值当且仅当两力同向共线。这与向量的三角形不等式是同一件事，可直接用于极值型选择题。",
          importance: "gaokao",
        },
      );
    } else if (physicsContext === "velocity-compose") {
      gaokaoPoints.push(
        {
          text: "速度的合成（船渡河模型）：船的实际速度等于静水船速与水流速度的向量和，遵循向量加法的平行四边形法则。船头方向表示静水船速的方向，实际航向由合速度决定，二者一般并不相同——答案里把船头方向当成实际航向是本题最常见的失分点。",
          importance: "gaokao",
        },
        {
          text: "「分解」与「合成」互逆：要让船实际沿某一指定方向航行，需先确定合速度方向，再反解船头应指向何方，本质上是解一个向量加法方程。",
          importance: "gaokao",
        },
      );
    } else {
      gaokaoPoints.push(
        {
          text: "合力大小的取值范围：两共点力的合力大小介于「两力大小之差的绝对值」与「两力大小之和」之间——取最小值当且仅当两力反向共线，取最大值当且仅当两力同向共线；合力方向由平行四边形法则给出。",
          importance: "gaokao",
        },
        {
          text: "三角形法则与平行四边形法则的选用：求两个力的合力用平行四边形法则最直观；多个力首尾相接时改用三角形（或多边形）法则、把首尾相接的力逐个平移，能一眼看出合力是否为零。",
          importance: "gaokao",
        },
      );
    }
    // 三个情景共用的收口考点：向量和的平方展开（符号随情景替换，数值随左屏参数实时联动）
    gaokaoPoints.push({
      text: `向量和的平方是通用工具：$|${n.resultant.vecLatex}|^2 = |${n.first.vecLatex}|^2 + 2${n.first.vecLatex}\\cdot${n.second.vecLatex} + |${n.second.vecLatex}|^2$；两者互相垂直时交叉项为 $0$，退化为勾股关系。本页当前 $|${n.resultant.vecLatex}| = ${normSum.toFixed(2)}$。`,
      importance: "gaokao",
    });
  } else if (studyMode === "linearCombo") {
    gaokaoPoints.push(
      {
        text: "向量三角形不等式：||a| - |b|| ≤ |a ± b| ≤ |a| + |b|，当且仅当 a, b 同向共线或反向共线时取等号。",
        importance: "gaokao",
      },
      {
        text: "差向量几何意义：向量 a - b 是从 b 的终点指向 a 的终点的向量，常用于转化距离与解析模长。",
        importance: "gaokao",
      },
      {
        text: "单位向量是「方向」的标准载体：任何非零向量都可唯一写成 $\\vec{a} = |\\vec{a}|\\vec{e}_a$。已知 $\\vec{a} = (3, 4)$ 时 $\\vec{e}_a = \\left(\\dfrac{3}{5}, \\dfrac{4}{5}\\right)$；与 $\\vec{a}$ 同向、长度为 $t$ 的向量即 $t\\vec{e}_a$，这是处理方向类问题的通用入口。",
        importance: "gaokao",
      },
    );
  } else if (studyMode === "collinear") {
    gaokaoPoints.push(
      {
        text: "三点共线分点与面积比（拓展 · 超出课标）：若 $\\vec{OC} = x\\vec{OA} + y\\vec{OB}$ 且 $x+y=1$，则 $\\triangle OAC$ 与 $\\triangle OBC$ 的面积比满足 $\\frac{S_{\\triangle OBC}}{S_{\\triangle OAC}} = \\frac{x}{y}$。",
        importance: "extend",
      },
      {
        text: "斜率与坐标秒杀：若两向量平行，则坐标交叉相乘 $x_a y_b - x_b y_a = 0$（横纵交乘相等），避免讨论斜率不存在的繁琐分类。",
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
      text: "零向量退化警告：零向量的模长为 0、方向任意，因此既不可单位化（不存在单位向量），又与任意向量共线，且与任意向量的夹角都无定义；凡把零向量当普通向量代入公式，结论一律不可信！",
      level: "danger",
    });
  }

  if (!isCollinearRatioDefined) {
    /**
     * 共线判据与共线比例是两件事：课标「零向量与任意向量共线」是约定，
     * 此时交叉相乘恒为 0 会判出「共线」，但根本不存在使 b = λa 的实数 λ。
     * 若不把这条讲清楚，学生就会在解答题里写出「λ 不存在故不共线」的错话。
     */
    warnings.push({
      text: "共线比例未定义提示：当前存在零向量，交叉相乘判据恒为 0，按课标约定零向量与任意向量共线；但此时不存在实数 $\\lambda$ 使 $\\vec{b} = \\lambda\\vec{a}$，故「共线比例」不可写。解答题若要用比例式，必须先说明两向量均非零。",
      level: "info",
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

  // 推导链（P1-18）：① 符号表达式 → ② 代入解析式 → ③ 结果
  const reasoningSteps: ReasoningStep[] = [];

  if (studyMode === "coordinate") {
    const lambda = params.lambda ?? 1;
    const lambdaStr = formatMathNumber(lambda);
    reasoningSteps.push(
      {
        step: 1,
        title: "符号表达式 · 写出两向量的坐标形式",
        detail: `把两向量的起点都平移到原点 $O$，则终点坐标就是向量坐标：$\\vec{a} = (${formatMathNumber(vecA.x)}, ${formatMathNumber(vecA.y)})$、$\\vec{b} = (${formatMathNumber(vecB.x)}, ${formatMathNumber(vecB.y)})$。$|\\vec{a}| = ${normA.toFixed(2)}$、$|\\vec{b}| = ${normB.toFixed(2)}$。`,
        latex: `\\vec{a} = (x_a, y_a), \\quad \\vec{b} = (x_b, y_b)`,
        rubric: "【高考采分点】写出两向量的坐标形式（2分）",
      },
      {
        step: 2,
        title: "代入坐标 · 同名分量分别运算",
        detail: `加减法只对同名分量运算：$\\vec{a}+\\vec{b} = (${formatMathNumber(vecA.x)} + ${formatMathNumber(vecB.x)},\\ ${formatMathNumber(vecA.y)} + ${formatMathNumber(vecB.y)}) = (${formatMathNumber(sumAB.x)}, ${formatMathNumber(sumAB.y)})$；$\\vec{a}-\\vec{b} = (${formatMathNumber(diffVec.x)}, ${formatMathNumber(diffVec.y)})$；数乘 $\\lambda\\vec{a} = (${lambdaStr} \\times ${formatMathNumber(vecA.x)},\\ ${lambdaStr} \\times ${formatMathNumber(vecA.y)}) = (${formatMathNumber(lambda * vecA.x)}, ${formatMathNumber(lambda * vecA.y)})$，且 $|\\lambda\\vec{a}| = |\\lambda|\\,|\\vec{a}| = ${(Math.abs(lambda) * normA).toFixed(2)}$。`,
        latex: `\\vec{a}+\\vec{b} = (${formatMathNumber(sumAB.x)}, ${formatMathNumber(sumAB.y)}), \\quad \\vec{a}-\\vec{b} = (${formatMathNumber(diffVec.x)}, ${formatMathNumber(diffVec.y)})`,
        rubric: "【高考采分点】按分量运算求出加减与数乘的坐标（3分）",
      },
      {
        step: 3,
        title: "判据收口 · 交叉相乘判定共线",
        detail: isCollinearAB
          ? `$x_ay_b - x_by_a = ${formatMathNumber(vecA.x)}\\times${formatMathNumber(vecB.y)} - ${formatMathNumber(vecB.x)}\\times${formatMathNumber(vecA.y)} = ${formatMathNumber(detAB)}$，判据取零，故 $\\vec{a} \\parallel \\vec{b}$——存在实数 $\\lambda$ 使 $\\vec{b} = \\lambda\\vec{a}$。此时不能再用夹角公式求两向量夹角：夹角为 $0^\\circ$（同向）或 $180^\\circ$（反向）。`
          : `$x_ay_b - x_by_a = ${formatMathNumber(vecA.x)}\\times${formatMathNumber(vecB.y)} - ${formatMathNumber(vecB.x)}\\times${formatMathNumber(vecA.y)} = ${formatMathNumber(detAB)} \\neq 0$，判据不成立，故 $\\vec{a}$ 与 $\\vec{b}$ 不共线，它们可充当平面的一组基底，任一向量在该基底下的分解系数存在且唯一。`,
        latex: `x_ay_b - x_by_a = ${formatMathNumber(detAB)} \\;${isCollinearAB ? "=" : "\\neq"}\\; 0`,
        rubric: "【高考采分点】用交叉相乘判据判定共线并说明理由（2分）",
      },
    );
  } else if (studyMode === "linearCombo" && physics) {
    const n = physics.naming;
    /**
     * 夹角文案只在「有定义」时才给数值。
     *
     * 物理情景里 λ = μ = 1 是情景内定死的（预设写入，且左屏不为物理情景开放 λ/μ 滑块），
     * 所以这里的合成结果就是纯粹的向量加法，可以放心用 physics.equation 这条符号式收口。
     */
    const angleText = isAngleDefined
      ? `${angleDeg.toFixed(1)}^\\circ`
      : "无定义（存在零向量）";

    reasoningSteps.push(
      {
        step: 1,
        title: `物理建模 · ${physics.label}`,
        detail: `${physics.model}本例中 $|${n.first.vecLatex}| = ${normA.toFixed(2)}$、$|${n.second.vecLatex}| = ${normB.toFixed(2)}$，两向量的夹角 $\theta = ${angleText}$。`,
        latex: physics.equation,
        rubric: "【高考采分点】把实际量抽象为向量并写出向量加法模型（2分）",
      },
      {
        step: 2,
        title: "平行四边形法则 · 求合成结果",
        detail: `由平行四边形法则（等价地，把两向量首尾相接即三角形法则）得${n.resultant.name} $${n.resultant.vecLatex} = (${sumVec.x.toFixed(1)}, ${sumVec.y.toFixed(1)})$，大小 $|${n.resultant.vecLatex}| = ${normSum.toFixed(2)}$——合成结果只由两向量的大小与夹角决定。`,
        latex: `|${n.resultant.vecLatex}| = \\sqrt{|${n.first.vecLatex}|^2 + 2${n.first.vecLatex} \\cdot ${n.second.vecLatex} + |${n.second.vecLatex}|^2}`,
        rubric: "【高考采分点】用向量加法法则合成并求出合成结果的大小（3分）",
      },
      n.third
        ? {
            step: 3,
            title: "平衡条件 · 第三力与合力等大反向",
            detail: isCollinearAB
              ? `两已知向量共线时三力首尾相接退化为一维线段（闭合三角形压扁成一条直线），但平衡条件不变：${n.third.name}仍与${n.resultant.name}等大反向，$|${n.third.vecLatex}| = |${n.resultant.vecLatex}| = ${normSum.toFixed(2)}$。`
              : `三力平衡的向量判据是合力为零，即 $${n.first.vecLatex} + ${n.second.vecLatex} + ${n.third.vecLatex} = \\vec{0}$：${n.third.name}必与${n.resultant.name}等大反向，故 $|${n.third.vecLatex}| = |${n.resultant.vecLatex}| = ${normSum.toFixed(2)}$，方向由 $${n.third.vecLatex} = (${closingVec.x.toFixed(1)}, ${closingVec.y.toFixed(1)})$ 给出——三力首尾相接正好绕回起点。`,
            latex: `${n.first.vecLatex} + ${n.second.vecLatex} + ${n.third.vecLatex} = \\vec{0}`,
            rubric: "【高考采分点】由合力为零判定平衡并求出第三个力（2分）",
          }
        : {
            step: 3,
            title: "合成结果收口 · 向量和的平方公式",
            detail: `向量和的平方公式 $|${n.first.vecLatex} + ${n.second.vecLatex}|^2 = |${n.first.vecLatex}|^2 + 2${n.first.vecLatex} \\cdot ${n.second.vecLatex} + |${n.second.vecLatex}|^2$ 是通用工具：两向量的大小与夹角一旦确定，合成结果的大小随之确定，不必再画图量长度。本例 $|${n.resultant.vecLatex}| = ${normSum.toFixed(2)}$。`,
            latex: `${n.first.vecLatex} + ${n.second.vecLatex} = ${n.resultant.vecLatex}`,
            rubric: "【高考采分点】用向量和的平方公式求合成结果的大小（2分）",
          },
    );
  } else if (studyMode === "linearCombo") {
    reasoningSteps.push(
      {
        step: 1,
        title: "线性运算法则 · 设合成式",
        detail:
          "由向量的数乘与加法法则，平面内任一向量都可写成两个已知向量的线性组合。",
        latex:
          "\\vec{s} = \\lambda \\vec{a} + \\mu \\vec{b} = (\\lambda x_a + \\mu x_b,\\; \\lambda y_a + \\mu y_b)",
        rubric: "【高考采分点】写出线性组合式（2分）",
      },
      {
        step: 2,
        title: "代入坐标 · 实虚分量合成",
        detail: `按分量相加得合成向量 $\\vec{s} = (${sumVec.x.toFixed(1)}, ${sumVec.y.toFixed(1)})$，其模长为 $|\\vec{s}| = ${normSum.toFixed(2)}$；$|\\vec{a}| = ${normA.toFixed(2)}$、$|\\vec{b}| = ${normB.toFixed(2)}$。`,
        latex: `\\vec{s} = \\lambda\\vec{a} + \\mu\\vec{b} = (${sumVec.x.toFixed(1)}, ${sumVec.y.toFixed(1)})`,
        rubric: "【高考采分点】按分量合成求合成向量（2分）",
      },
      {
        step: 3,
        title: "模长与夹角 · 数量积收口",
        detail: isAngleDefined
          ? `数量积 $\\vec{a}\\cdot\\vec{b} = ${dotProduct.toFixed(2)}$，夹角 $\\theta = ${angleDeg.toFixed(1)}^\\circ$；由 $|\\vec{a}-\\vec{b}|^2 = |\\vec{a}|^2 - 2\\vec{a}\\cdot\\vec{b} + |\\vec{b}|^2$ 可解出差向量模长。`
          : `数量积 $\\vec{a}\\cdot\\vec{b} = ${dotProduct.toFixed(2)}$；因其中一个向量为零向量，夹角无定义，此时不得代入 $\\cos\\theta = \\dfrac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}$ 求角。`,
        latex: `\\vec{a}\\cdot\\vec{b} = ${dotProduct.toFixed(2)}, \\quad \\cos\\theta = \\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}`,
        rubric: "【高考采分点】用数量积求夹角与模长（3分）",
      },
      {
        step: 4,
        title: "单位化收口 · 夹角余弦即单位向量内积",
        detail:
          isUnitADefined && isUnitBDefined
            ? `把 $\\vec{a}$、$\\vec{b}$ 各自单位化：$\\vec{e}_a = (${unitA.x.toFixed(2)}, ${unitA.y.toFixed(2)})$、$\\vec{e}_b = (${unitB.x.toFixed(2)}, ${unitB.y.toFixed(2)})$，则 $\\vec{e}_a \\cdot \\vec{e}_b = ${unitDotProduct.toFixed(4)} = \\cos\\theta$——夹角只由两个单位向量决定，与 $|\\vec{a}|$、$|\\vec{b}|$ 的大小无关。`
            : "当前存在零向量，$\\vec{e}_a$ 或 $\\vec{e}_b$ 无定义（零向量方向任意、不可单位化），故不能用两单位向量的内积求夹角。",
        latex: `\\vec{e}_a \\cdot \\vec{e}_b = \\cos\\theta`,
        rubric: "【高考采分点】把夹角余弦转化为两单位向量的数量积（2分）",
      },
    );
  } else if (studyMode === "collinear") {
    reasoningSteps.push(
      {
        step: 1,
        title: "三点共线定理 · 分解式",
        detail:
          "取基准点 $O$，把点 $C$ 的位置向量用 $\\vec{OA}, \\vec{OB}$ 分解。",
        latex: "\\vec{OC} = x\\vec{OA} + y\\vec{OB}",
        rubric: "【高考采分点】写出基底分解式（1分）",
      },
      {
        step: 2,
        title: "代入系数 · 求系数和",
        detail: `得 $C(${pointC.x.toFixed(1)}, ${pointC.y.toFixed(1)})$，两系数之和 $x + y = ${coeffSum.toFixed(2)}$。`,
        latex: `x + y = ${coeffSum.toFixed(2)}`,
        rubric: "【高考采分点】计算两系数之和（2分）",
      },
      {
        step: 3,
        title: "共线判定 · 系数和定成败",
        detail: isThreePointsCollinear
          ? `$x + y = 1$，故 $A, B, C$ 三点共线，$C$ ${isOnSegmentAB ? "落在线段 $AB$ 内部（内分点）" : "落在直线 $AB$ 的延长线上（外分点）"}。`
          : `$x + y = ${coeffSum.toFixed(2)} \\neq 1$，$C$ 偏离直线 $AB$，三点不共线。`,
        latex: `x + y = ${coeffSum.toFixed(2)} \\;\\Rightarrow\\; A, B, C \\text{ 何时共线：} x+y=1`,
        rubric: "【高考采分点】由系数和判定三点共线（3分）",
      },
    );
  } else {
    reasoningSteps.push(
      {
        step: 1,
        title: "平面向量基本定理 · 设分解系数",
        detail:
          "若 $\\vec{e}_1, \\vec{e}_2$ 不共线，则平面内任一向量 $\\vec{v}$ 可唯一表示为其线性组合。",
        latex: "\\vec{v} = \\lambda_1 \\vec{e}_1 + \\lambda_2 \\vec{e}_2",
        rubric: "【高考采分点】写出基底下唯一分解式（2分）",
      },
      {
        step: 2,
        title: "待定系数 · 解二元方程组",
        detail: isBasisValid
          ? `代入坐标解方程组，得 $\\lambda_1 = ${lambda1.toFixed(2)}$、$\\lambda_2 = ${lambda2.toFixed(2)}$；目标向量 $\\vec{v} = (${targetVecV.x}, ${targetVecV.y})$。`
          : `判据 $D = ${detAB.toFixed(2)} = 0$，基底共线退化，方程组无唯一解。`,
        latex: `\\lambda_1 = ${isBasisValid ? lambda1.toFixed(2) : "\\text{无解}"}, \\quad \\lambda_2 = ${isBasisValid ? lambda2.toFixed(2) : "\\text{无解}"}`,
        rubric: "【高考采分点】解方程组求分解系数（3分）",
      },
      {
        step: 3,
        title: "唯一性判据 · 交叉相乘非零",
        detail: `分解唯一当且仅当两基底不共线，即交叉相乘 $D = x_1 y_2 - x_2 y_1 = ${detAB.toFixed(2)} \\neq 0$。`,
        latex: `D = x_1 y_2 - x_2 y_1 = ${detAB.toFixed(2)}`,
        rubric: "【高考采分点】说明基底不共线是唯一分解的前提（2分）",
      },
    );
  }

  /**
   * 口诀随情景换口径。
   *
   * 物理情景的主题是「合成与平衡」，三点共线、基底分解与它无关；
   * 若沿用数学口诀，会在学生刚建立物理直觉时又把他拉回坐标系语境。
   * 三力平衡再单独分叉：它的落点是「合力为零」与「第三力等大反向」，
   * 与「合成结果的大小看夹角」不是同一个记忆锚点。
   */
  const mnemonic =
    studyMode === "coordinate"
      ? "起点平移到原点，终点坐标即向量；横加横来纵加纵，交叉相乘零共线！"
      : studyMode === "linearCombo" && physics
        ? physics.naming.third
          ? "共点力首尾接成环，合力为零即平衡；平行四边形求合力，第三力等大反向！"
          : "首尾相接即合成，同起点作平行四边形；结果大小介于差与和，夹角越大值越小！"
        : "首尾相接三角形，同起点平行四边形；三点共线和为一，基底不共线唯一分解！";

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic,
  };
}
