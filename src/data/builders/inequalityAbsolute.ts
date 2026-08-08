/**
 * src/data/builders/inequalityAbsolute.ts
 * 绝对值不等式看板数据组装器
 */

import type { MathPanelData } from "../types";
import {
  solveAbsoluteInequality,
  type InequalityMode,
  type InequalityType,
} from "@/math/inequalityAbsolute";

export function buildInequalityAbsolutePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const a = params.a ?? 1.0;
  const b = params.b ?? 4.0;
  const c = params.c ?? 2.5;
  const m = params.m ?? 5.0;
  const x = params.x ?? 2.5;

  const studyMode = (config?.studyMode as InequalityMode) ?? "sum";
  const ineqType = (config?.ineqType as InequalityType) ?? "<=";

  const res = solveAbsoluteInequality(a, b, c, m, x, studyMode, ineqType);

  const minA = Math.min(a, b);
  const maxA = Math.max(a, b);
  const distAB = Math.abs(a - b);

  if (studyMode === "single") {
    return {
      quantities: [
        {
          label: "几何距离 |x - a|",
          symbol: "d(x, a)",
          value: res.distA.toFixed(2),
          highlight: "positive",
        },
        {
          label: "中心定点 A",
          symbol: "a",
          value: a.toFixed(1),
        },
        {
          label: "半径阈值 c",
          symbol: "c",
          value: c.toFixed(1),
          highlight: c === 0 ? "zero" : undefined,
        },
        {
          label: "解集实根",
          symbol: "x_{1,2}",
          value:
            res.intersectionRoots.length > 0
              ? res.intersectionRoots.map((r) => r.toFixed(2)).join(", ")
              : "无实根/特殊",
        },
      ],
      theorems: [
        {
          name: "单绝对值几何意义与解集",
          latex:
            "|x - a| \\le c \\iff a - c \\le x \\le a + c \\quad (c \\ge 0)",
          prerequisites: ["c \\ge 0"],
          condition:
            "|x - a| 表示数轴上点 x 到点 a 的距离，不大于 c 即为以 a 为中心、c 为半径的闭区间",
        },
      ],
      gaokaoPoints: [
        {
          text: "几何距离翻译法：高考中遇到 $|x - a| \\le c$，直接翻译为“数轴上点 $x$ 到点 $a$ 的距离不超过 $c$”，即刻锁定区间 $[a-c, a+c]$。",
          importance: "gaokao",
        },
        {
          text: "边界碰撞法：通过求方程 $|x - a| = c$ 的两个临界实根 $x = a \\pm c$，结合图形确定大于或小于取两端还是中间。",
          importance: "core",
        },
      ],
      warnings: res.isDegenerate
        ? [
            {
              text: `退化警告：${res.degenerateReason}`,
              level: "danger",
            },
          ]
        : [],
      mnemonic: "小于取中间，大于取两端；绝对值即距离，中心加减半径！",
    };
  }

  if (studyMode === "sum") {
    const isAtMin = Math.abs(res.yVal - distAB) < 1e-4;
    return {
      quantities: [
        {
          label: "距离之和 f(x)",
          symbol: "|x-a|+|x-b|",
          value: res.yVal.toFixed(2),
          highlight: isAtMin ? "extreme" : "positive",
        },
        {
          label: "最小值 min f(x)",
          symbol: "|a - b|",
          value: distAB.toFixed(2),
          highlight: "extreme",
        },
        {
          label: "目标水平线 m",
          symbol: "m",
          value: m.toFixed(1),
        },
        {
          label: "交点边界 x",
          symbol: "Roots",
          value:
            res.intersectionRoots.length > 0
              ? res.intersectionRoots.map((r) => r.toFixed(2)).join(", ")
              : "无交点",
        },
      ],
      theorems: [
        {
          name: "双绝对值和 (平底杯函数) 极值定理",
          latex: "|x - a| + |x - b| \\ge |a - b|",
          prerequisites: ["a, b \\in \\mathbb{R}"],
          condition: `当且仅当 x 位于 a, b 之间 (即 x \\in [${minA.toFixed(1)}, ${maxA.toFixed(1)}]) 时取最小值 |a - b|`,
        },
      ],
      gaokaoPoints: [
        {
          text: "平底杯函数特征：$f(x) = |x - a| + |x - b|$ 图像呈“平底杯”状。底部平坦区为 $[\\min(a,b), \\max(a,b)]$，最小值为线段 $AB$ 的长度 $|a - b|$。",
          importance: "gaokao",
        },
        {
          text: "恒成立问题转化：若 $|x - a| + |x - b| \\ge m$ 对任意 $x$ 恒成立 $\\iff m \\le f(x)_{\\min} = |a - b|$。",
          importance: "gaokao",
        },
      ],
      warnings: res.isDegenerate
        ? [
            {
              text: `退化/无解警告：${res.degenerateReason}`,
              level: "danger",
            },
          ]
        : [],
      mnemonic: "两点之间线段最短！中间任一点，距离和恒定为两点间距！",
    };
  }

  if (studyMode === "diff") {
    return {
      quantities: [
        {
          label: "距离之差 f(x)",
          symbol: "|x-a|-|x-b|",
          value: res.yVal.toFixed(2),
          highlight: "positive",
        },
        {
          label: "理论最小值",
          symbol: "-|a - b|",
          value: (-distAB).toFixed(2),
          highlight: "extreme",
        },
        {
          label: "理论最大值",
          symbol: "|a - b|",
          value: distAB.toFixed(2),
          highlight: "extreme",
        },
        {
          label: "目标水平线 m",
          symbol: "m",
          value: m.toFixed(1),
        },
      ],
      theorems: [
        {
          name: "双绝对值差 (阶梯函数) 取值范围",
          latex: "-|a - b| \\le |x - a| - |x - b| \\le |a - b|",
          prerequisites: ["a, b \\in \\mathbb{R}"],
          condition: "当 x 位于两点外侧时取得最大值或最小值",
        },
      ],
      gaokaoPoints: [
        {
          text: "阶梯 S 型函数：$g(x) = |x - a| - |x - b|$ 的值域限定在 $[-|a - b|, |a - b|]$ 之间。两侧为平行于 x 轴的射线平台。",
          importance: "gaokao",
        },
        {
          text: "存在性与恒成立：$g(x) \\ge m$ 有解 $\\iff m \\le g(x)_{\\max} = |a - b|$。",
          importance: "core",
        },
      ],
      warnings: res.isDegenerate
        ? [
            {
              text: `界限警示：${res.degenerateReason}`,
              level: "warning",
            },
          ]
        : [],
      mnemonic: "同侧相减值最大，异侧相减值最小！阶梯曲线夹两端！",
    };
  }

  // triangle 模式
  return {
    quantities: [
      {
        label: "|a| + |b|",
        symbol: "|a|+|b|",
        value: (Math.abs(a) + Math.abs(b)).toFixed(2),
        highlight: "positive",
      },
      {
        label: "|a + b|",
        symbol: "|a+b|",
        value: Math.abs(a + b).toFixed(2),
      },
      {
        label: "|a - b|",
        symbol: "|a-b|",
        value: Math.abs(a - b).toFixed(2),
      },
      {
        label: "||a| - |b||",
        symbol: "||a|-|b||",
        value: Math.abs(Math.abs(a) - Math.abs(b)).toFixed(2),
      },
    ],
    theorems: [
      {
        name: "绝对值三角不等式全表",
        latex: "||a| - |b|| \\le |a \\pm b| \\le |a| + |b|",
        prerequisites: ["a, b \\in \\mathbb{R}"],
        condition:
          "|a+b| = |a|+|b| 当且仅当 ab \\ge 0 (同号)；|a-b| = |a|+|b| 当且仅当 ab \\le 0 (异号)",
      },
    ],
    gaokaoPoints: [
      {
        text: "高考选考/压轴必考：绝对值三角不等式是代数证明与最值求解的核心武器，常用于柯西不等式与函数最值结合分析。",
        importance: "gaokao",
      },
      {
        text: "取等条件判断：做题时必须验证 $ab \\ge 0$ 或 $ab \\le 0$ 是否在参数定义域内成立。",
        importance: "core",
      },
    ],
    warnings: [],
    mnemonic: "同号相加模最大，异号相加模变小；两边之和大于第三边！",
  };
}
