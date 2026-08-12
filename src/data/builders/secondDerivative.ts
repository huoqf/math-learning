/**
 * src/data/builders/secondDerivative.ts
 * 构建二阶导数、拐点与凹凸性看板数据
 * 深度同步左屏模式 (studyMode) 与函数模型 (fnKey)
 */

import type {
  MathPanelData,
  Theorem,
  GaokaoPoint,
  WarningItem,
  MathQuantity,
} from "../types";
import {
  evalFunction,
  findInflectionPoints,
  findExtremaPoints,
  evalJensen,
  type SecondDerivativeParams,
  type FnKey,
} from "@/math/secondDerivative";

export function buildSecondDerivativePanel(
  params: Record<string, number>,
  config?: { studyMode?: "concavity" | "inflection" | "jensen"; fnKey?: FnKey },
): MathPanelData {
  const p: SecondDerivativeParams = {
    a: params.a ?? 0.5,
    b: params.b ?? 0,
    c: params.c ?? -1.5,
    d: params.d ?? 0,
    x0: params.x0 ?? 1.0,
    x1: params.x1 ?? -1.5,
    x2: params.x2 ?? 1.5,
  };

  const fnKey = config?.fnKey ?? "cubic";
  const studyMode = config?.studyMode ?? "concavity";

  const res0 = evalFunction(fnKey, p, p.x0);
  const inflections = findInflectionPoints(fnKey, p);
  const extrema = findExtremaPoints(fnKey, p);
  const jensen = evalJensen(fnKey, p, p.x1, p.x2);

  // 1. 动态生成 MathQuantity 面板数据
  const quantities: MathQuantity[] = [];

  if (studyMode === "concavity") {
    quantities.push(
      { label: "探针自变量 x0", symbol: "x_0", value: `${p.x0.toFixed(2)}` },
      {
        label: "函数值 f(x0)",
        symbol: "f(x_0)",
        value: `${res0.y.toFixed(3)}`,
      },
      {
        label: "一阶导数 f'(x0) [切线斜率]",
        symbol: "f'(x_0)",
        value: `${res0.dy.toFixed(3)}`,
      },
      {
        label: "二阶导数 f''(x0) [凹凸性]",
        symbol: "f''(x_0)",
        value: `${res0.ddy.toFixed(3)}`,
      },
    );

    if (res0.concavity === "concaveUp") {
      quantities.push({
        label: "当前曲线凹凸性",
        symbol: "\\text{凹凸性}",
        value: "下凸 (凹函数 / 切线在下方)",
        color: "#2563EB",
      });
    } else if (res0.concavity === "concaveDown") {
      quantities.push({
        label: "当前曲线凹凸性",
        symbol: "\\text{凹凸性}",
        value: "上凸 (凸函数 / 切线在上方)",
        color: "#EF4444",
      });
    } else {
      quantities.push({
        label: "当前曲线凹凸性",
        symbol: "\\text{凹凸性}",
        value: "二阶导为0 (拐点界线)",
        color: "#EC4899",
      });
    }
  } else if (studyMode === "inflection") {
    if (inflections.length > 0) {
      quantities.push({
        label: "拐点坐标",
        symbol: "(x_{\\text{inf}}, y_{\\text{inf}})",
        value: inflections.map((ip) => `${ip.label}`).join("; "),
        color: "#EC4899",
      });
    } else {
      quantities.push({
        label: "拐点坐标",
        symbol: "(x_{\\text{inf}}, y_{\\text{inf}})",
        value: "无拐点 (二阶导未变号)",
      });
    }

    if (extrema.length > 0) {
      quantities.push({
        label: "极值点坐标",
        symbol: "(x_{\\text{ext}}, y_{\\text{ext}})",
        value: extrema.map((e) => `${e.label}`).join("; "),
        color: "#8B5CF6",
      });

      if (inflections.length > 0 && inflections[0].isTrueInflection) {
        const dx = Math.abs(inflections[0].x - extrema[0].x);
        quantities.push({
          label: "拐点与极值点横坐标距离",
          symbol: "|x_{\\text{inf}} - x_{\\text{ext}}|",
          value: `${dx.toFixed(3)}`,
        });
      }
    } else {
      quantities.push({
        label: "极值点",
        symbol: "f'(x)=0",
        value: "全域无极值点 (单调递增/递减)",
      });
    }

    if (fnKey === "cubic" && Math.abs(p.a) > 1e-6) {
      const xCenter = -p.b / (3 * p.a);
      const yCenter = evalFunction("cubic", p, xCenter).y;
      quantities.push({
        label: "三次函数中心对称点",
        symbol: "(\\frac{-b}{3a}, f(\\frac{-b}{3a}))",
        value: `(${xCenter.toFixed(2)}, ${yCenter.toFixed(2)})`,
        color: "#EC4899",
      });
    }
  } else {
    // jensen 模式
    quantities.push(
      { label: "割线端点 1", symbol: "x_1", value: `${jensen.x1.toFixed(2)}` },
      { label: "割线端点 2", symbol: "x_2", value: `${jensen.x2.toFixed(2)}` },
      {
        label: "割线中点 y 坐标 (弦)",
        symbol: "\\frac{f(x_1)+f(x_2)}{2}",
        value: `${jensen.yChordMid.toFixed(3)}`,
      },
      {
        label: "曲线上中点 y 坐标 (弧)",
        symbol: "f\\left(\\frac{x_1+x_2}{2}\\right)",
        value: `${jensen.yCurveMid.toFixed(3)}`,
      },
      {
        label: "琴生差值 Δy (弦-弧)",
        symbol: "\\Delta y",
        value: `${jensen.diff.toFixed(3)} (${jensen.isConvexUp ? "弦在弧上方" : "弧在弦上方"})`,
        color: jensen.isConvexUp ? "#10B981" : "#EF4444",
      },
    );
  }

  // 2. 动态生成 Theorems 定理列表
  const theorems: Theorem[] = [];

  if (studyMode === "concavity") {
    theorems.push(
      {
        name: "二阶导数与凹凸性判定定理",
        latex:
          "f''(x) > 0 \\implies \\text{下凸 (凹函数)}, \\quad f''(x) < 0 \\implies \\text{上凸 (凸函数)}",
        condition:
          "f(x) 在区间内二阶可导。下凸函数切线恒在下方，上凸函数切线恒在上方。",
      },
      {
        name: "切线放缩基本不等式",
        latex: "f(x) \\ge f'(x_0)(x - x_0) + f(x_0) \\quad (f''(x) \\ge 0)",
        condition: "适用于下凸函数在任意点 x_0 处的切线放缩",
      },
    );
  } else if (studyMode === "inflection") {
    theorems.push(
      {
        name: "拐点判定定理 (Inflection Point)",
        latex: "f''(x_0) = 0 \\text{ 且在其左右两侧 } f''(x) \\text{ 异号}",
        condition:
          "拐点是凹凸性改变的点，切线在此穿越曲线；若二阶导不变号则非拐点",
      },
      {
        name: "二阶导数极值判定法",
        latex:
          "f'(x_0) = 0, \\, f''(x_0) > 0 \\implies \\text{极小值}; \\, f''(x_0) < 0 \\implies \\text{极大值}",
        condition:
          "若 f''(x_0)=0，则判别法失效，需进一步检测更高阶导数或一阶导变号",
      },
    );
  } else {
    theorems.push(
      {
        name: "琴生不等式 (Jensen's Inequality)",
        latex:
          "f\\left(\\frac{x_1+x_2}{2}\\right) \\le \\frac{f(x_1)+f(x_2)}{2} \\quad (f''(x) \\ge 0)",
        condition: "下凸（凹函数）的割线段中点纵坐标恒大于等于弧上中点纵坐标",
      },
      {
        name: "琴生不等式加权形式",
        latex:
          "f(\\lambda x_1 + (1-\\lambda)x_2) \\le \\lambda f(x_1) + (1-\\lambda)f(x_2) \\quad (0 \\le \\lambda \\le 1)",
        condition: "凸/凹函数代数抽象定义的基石",
      },
    );
  }

  // 3. 动态生成 高考考点 GaokaoPoints
  const gaokaoPoints: GaokaoPoint[] = [];

  if (fnKey === "cubic") {
    gaokaoPoints.push({
      text: "三次函数的对称中心：三次函数 f(x)=ax^3+bx^2+cx+d 的拐点 x_0 = -b/(3a) 即为其中心对称中心！割线与三次曲线相交三点横坐标满足 x_1 + x_2 + x_3 = -b/a = 3x_0。",
      importance: "gaokao",
    });
  } else if (fnKey === "mixed") {
    gaokaoPoints.push({
      text: "导数压轴题切线放缩：f(x)=xe^x 中，极小值点在 x=-1，拐点在 x=-2。利用凹凸性导出 e^x ≥ x+1 与 ln x ≤ x-1 经典放缩模型。",
      importance: "hard",
    });
  } else {
    gaokaoPoints.push({
      text: "二阶导为0并非拐点的充要条件：对于 f(x)=x^4，在 x=0 处 f''(0)=0，但两侧 f''(x)=12x^2 均大于0，x=0 是极小值点而非拐点，新高考常以此考查逻辑严密性。",
      importance: "hard",
    });
  }

  if (studyMode === "jensen") {
    gaokaoPoints.push({
      text: "琴生不等式在高考导数与不等式证明中的应用：利用 f((x_1+x_2)/2) 与 (f(x_1)+f(x_2))/2 的大小判断函数凹凸性，破解双变量中点放缩题型。",
      importance: "gaokao",
    });
  }

  // 4. 动态 Warnings
  const warnings: WarningItem[] = [];

  if (fnKey === "cubic" && Math.abs(p.a) < 1e-6) {
    warnings.push({
      text: "三次项系数 a = 0 (退化警示)：此时函数退化为二次/一次函数，二阶导数恒为常数，不再存在拐点！",
      level: "warning",
    });
  }

  if (fnKey === "quartic" && Math.abs(p.b) < 1e-6) {
    warnings.push({
      text: "f''(x0) = 0 的非充分性 (反例警示)：对于 f(x) = x^4，在 x=0 处 f''(0)=0，但左右两侧 f''(x) 均为正，x=0 为极小值点而非拐点！",
      level: "info",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "二阶导，定凹凸；穿曲线，为拐点；弦在弧上为下凸，极值拐点需分清。",
  };
}
