/**
 * src/data/builders/inequalityAbsolute.ts
 * 绝对值不等式看板数据组装器
 * 严格遵照 right-panel-spec.md 规范与推导链三部曲（审题定法 -> 建模联立 -> 求解反思）
 */

import type { MathPanelData, ReasoningStep } from "../types";
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
    const r1 = a - c;
    const r2 = a + c;
    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "① 审题定法 · 几何距离转化",
        detail:
          "将绝对值不等式 $|x - a| \\le c$ 转化为数轴几何模型：表示动点 $P(x)$ 到基准定点 $A(a)$ 的距离不大于阈值半径 $c$。",
        latex: `d(P, A) = |x - (${a.toFixed(1)})| ${ineqType === "<=" ? "\\le" : "\\ge"} ${c.toFixed(1)}`,
        rubric: "审题得分点：识别单绝对值本质为数轴单定点距离模型",
      },
      {
        step: 2,
        title: "② 代数演绎 · 边界对称求根",
        detail:
          "求解临界边界方程 $|x - a| = c$，由绝对值代数性质脱去绝对值符号，得到关于中心点 $a$ 对称的两个临界实根。",
        latex: `x - (${a.toFixed(1)}) = \\pm ${c.toFixed(1)} \\implies x_1 = ${r1.toFixed(2)}, \\; x_2 = ${r2.toFixed(2)}`,
        rubric: "联立得分点：解出区间对称端点值",
      },
      {
        step: 3,
        title: "③ 求解反思 · 解集区间锁定",
        detail:
          ineqType === "<="
            ? `根据“小于取中间”的几何性质，距离不超过 $c$ 的点集构成闭区间 $[a - c, a + c]$。`
            : `根据“大于取两端”的几何性质，距离不小于 $c$ 的点集构成外侧无限区间。`,
        latex:
          ineqType === "<="
            ? c >= 0
              ? `x \\in [${r1.toFixed(2)}, ${r2.toFixed(2)}]`
              : "\\varnothing"
            : c >= 0
              ? `x \\in (-\\infty, ${r1.toFixed(2)}] \\cup [${r2.toFixed(2)}, +\\infty)`
              : "x \\in \\mathbb{R}",
        rubric: "求解得分点：根据不等号方向写出正确解集",
      },
    ];

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
            "|x - a| 表示数轴上动点 $x$ 到定点 $a$ 的几何距离，不大于 $c$ 即为以 $a$ 为中心、$c$ 为半径的闭区间",
        },
      ],
      reasoningSteps,
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
    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "① 审题定法 · 两点距离之和",
        detail:
          "构造函数 $f(x) = |x - a| + |x - b|$，几何本质为数轴上动点 $P(x)$ 到两定点 $A(a), B(b)$ 的距离之和 $|PA| + |PB|$。",
        latex: `f(x) = |x - (${a.toFixed(1)})| + |x - (${b.toFixed(1)})|`,
        rubric: "审题得分点：确立两点距离之和的平底杯几何模型",
      },
      {
        step: 2,
        title: "② 代数演绎 · 三角放缩与杯底极值",
        detail:
          "由绝对值三角不等式放缩：$|x - a| + |x - b| = |x - a| + |b - x| \\ge |(x - a) + (b - x)| = |a - b|$，当且仅当动点 $P$ 在线段 $AB$ 上时取最小值。",
        latex: `f(x)_{\\min} = |a - b| = |${a.toFixed(1)} - (${b.toFixed(1)})| = ${distAB.toFixed(2)}`,
        rubric: "建模得分点：求出平底杯最小值与杯底区间",
      },
      {
        step: 3,
        title: "③ 求解反思 · 水平线交点与解集判定",
        detail:
          res.intervals.length === 0
            ? `当前目标常数 $m = ${m.toFixed(1)} < |a - b| = ${distAB.toFixed(1)}$，水平线位于杯底下方，不等式 $f(x) \\le m$ 无实数解。`
            : `联立方程 $f(x) = m$，解得平底杯两侧斜率为 $\\pm 2$ 的射线交点，进而求得当前解集。`,
        latex:
          res.intersectionRoots.length === 2
            ? `x_1 = \\frac{a+b-m}{2} = ${res.intersectionRoots[0].toFixed(2)}, \\; x_2 = \\frac{a+b+m}{2} = ${res.intersectionRoots[1].toFixed(2)}`
            : res.intervals.length === 0
              ? "\\varnothing"
              : `x \\in [${minA.toFixed(1)}, ${maxA.toFixed(1)}]`,
        rubric: "结论得分点：结合 $m$ 与 $|a - b|$ 大小关系规范写出解集",
      },
    ];

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
          condition: `当且仅当 $x$ 位于 $a, b$ 之间 (即 $x \\in [${minA.toFixed(1)}, ${maxA.toFixed(1)}]$) 时取最小值 $|a - b|$`,
        },
      ],
      reasoningSteps,
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
    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "① 审题定法 · 两点距离之差",
        detail:
          "构造阶梯函数 $g(x) = |x - a| - |x - b|$，几何上表示动点 $P(x)$ 到两定点 $A(a), B(b)$ 的距离之差 $|PA| - |PB|$。",
        latex: `g(x) = |x - (${a.toFixed(1)})| - |x - (${b.toFixed(1)})|`,
        rubric: "审题得分点：明确双绝对值差的几何本质与阶梯模型",
      },
      {
        step: 2,
        title: "② 代数演绎 · 阶梯值域与平台界限",
        detail:
          "由三角形两边之差性质与有向线段投影，距离之差的值域限定在闭区间 $[-|a - b|, |a - b|]$ 之间。动点位于两定点外侧时达到极值平台。",
        latex: `-|a - b| \\le g(x) \\le |a - b| \\implies g(x) \\in [${(-distAB).toFixed(2)}, ${distAB.toFixed(2)}]`,
        rubric: "建模得分点：导出最大值与最小值平台常数",
      },
      {
        step: 3,
        title: "③ 求解反思 · 倾斜段交点与解集",
        detail:
          Math.abs(m) > distAB
            ? `当前水平线高度 $|m| > |a - b|$ 超出函数值域，不等式解集表现为空集或全集。`
            : `当常数 $m$ 处于平台之间时，与过渡倾斜线段相交于唯一实根，解集为射线区间。`,
        latex:
          res.intersectionRoots.length === 1
            ? `x_0 = ${res.intersectionRoots[0].toFixed(2)}`
            : res.intervals.length === 0
              ? "\\varnothing"
              : "x \\in \\mathbb{R}",
        rubric: "求解得分点：根据单调过渡斜率精准求解集",
      },
    ];

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
          condition: "当 $x$ 位于两点外侧时取得最大值或最小值平台",
        },
      ],
      reasoningSteps,
      gaokaoPoints: [
        {
          text: "阶梯 S 型函数：$g(x) = |x - a| - |x - b|$ 的值域限定在 $[-|a - b|, |a - b|]$ 之间。两侧为平行于 $x$ 轴的射线平台。",
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
  const modSum = Math.abs(a) + Math.abs(b);
  const modDiff = Math.abs(Math.abs(a) - Math.abs(b));
  const sumMod = Math.abs(a + b);
  const isSameSign = a * b >= 0;

  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: "① 审题定法 · 向量有向线段映射",
      detail:
        "将实数 $a, b$ 映射为数轴上有向线段或向量 $\\overrightarrow{OA} = a, \\overrightarrow{AB} = b$，其合成和向量为 $\\overrightarrow{OB} = a + b$。",
      latex:
        "\\overrightarrow{OB} = \\overrightarrow{OA} + \\overrightarrow{AB}",
      rubric: "审题得分点：将绝对值代数转化为数轴向量模长叠加",
    },
    {
      step: 2,
      title: "② 代数演绎 · 三角不等式双向夹逼",
      detail:
        "利用三角形两边之和大于第三边、两边之差小于第三边，推导实数模长的双向夹逼不等式关系。",
      latex: `||a| - |b|| \\le |a + b| \\le |a| + |b| \\implies ${modDiff.toFixed(2)} \\le ${sumMod.toFixed(2)} \\le ${modSum.toFixed(2)}`,
      rubric: "推导得分点：代入当前参数完成双向模长夹逼计算",
    },
    {
      step: 3,
      title: "③ 求解反思 · 取等条件与高考秒杀",
      detail: isSameSign
        ? `当前参数 $a = ${a.toFixed(1)}, b = ${b.toFixed(1)}$ 同号（$ab \\ge 0$），向量同向顺接，取到最大值等号 $|a + b| = |a| + |b|$。`
        : `当前参数 $a = ${a.toFixed(1)}, b = ${b.toFixed(1)}$ 异号（$ab \\le 0$），向量反向相消，取到最小值等号 $|a + b| = ||a| - |b||$。`,
      latex: isSameSign
        ? `|a + b| = |a| + |b| = ${modSum.toFixed(2)} \\quad (ab \\ge 0)`
        : `|a + b| = ||a| - |b|| = ${modDiff.toFixed(2)} \\quad (ab \\le 0)`,
      rubric: "考点得分点：根据 $ab$ 符号判定取等充要条件",
    },
  ];

  return {
    quantities: [
      {
        label: "|a| + |b|",
        symbol: "|a|+|b|",
        value: modSum.toFixed(2),
        highlight: isSameSign ? "extreme" : "positive",
      },
      {
        label: "|a + b|",
        symbol: "|a+b|",
        value: sumMod.toFixed(2),
        highlight: "positive",
      },
      {
        label: "|a - b|",
        symbol: "|a-b|",
        value: Math.abs(a - b).toFixed(2),
      },
      {
        label: "||a| - |b||",
        symbol: "||a|-|b||",
        value: modDiff.toFixed(2),
        highlight: !isSameSign ? "extreme" : undefined,
      },
    ],
    theorems: [
      {
        name: "绝对值三角不等式全表",
        latex: "||a| - |b|| \\le |a \\pm b| \\le |a| + |b|",
        prerequisites: ["a, b \\in \\mathbb{R}"],
        condition:
          "$|a+b| = |a|+|b|$ 当且仅当 $ab \\ge 0$ (同号)；$|a-b| = |a|+|b|$ 当且仅当 $ab \\le 0$ (异号)",
      },
    ],
    reasoningSteps,
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
    mnemonic:
      "同号顺接和最大，异号相消差最小；代数放缩秒杀题，取等充要验乘积！",
  };
}
