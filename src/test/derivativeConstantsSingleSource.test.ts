/**
 * src/test/derivativeConstantsSingleSource.test.ts
 * 导数专题收尾批次的**三条口径契约**（P2-4 数字格式 / P2-5 NaN 泄漏 / P2-6 + 7.1.3 常量单一来源）
 *
 * 三条缺陷同根：**同一个事实在同一个页面上被写了两遍**。
 *   ① 数字格式：一处置 `toFixed(2)`、另一处置 `formatMathNumber` ⇒ 同页两种精度；
 *   ② 缺失态：数量侧渲染「无定义」、正文侧却把 `NaN` 直接印进题干；
 *   ③ 常量与区间：`b = 40` 与 `priceBase − costUnit = 50 − 10` 各写一份；
 *      math 层的截断域与注册表的滑块域各写一份（拖拽能跑到滑块读数之外）。
 *
 * 因此本文件一律**同时**做两件事，缺一不可：
 *   · 运行时不变量（数值事实真的相等 / 文本里真的没有 NaN）；
 *   · 源码层守卫（防止日后有人把第二条写回来 —— 运行时不变量只能证明"现在对"）。
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  calculateOptimizationModel,
  OPTIMIZATION_CONSTANTS,
  type OptimizationModelType,
} from "@/math/derivativeOptimization";
import { optimizationParamMeta } from "@/data/registries/derivativeOptimization";
import { buildDerivativeOptimizationPanel } from "@/data/builders/derivativeOptimization";
import { buildDerivativeOperationsPanel } from "@/data/builders/derivativeOperations";
import { buildDerivativeChainPanel } from "@/data/builders/derivativeChain";
import type { MathPanelData } from "@/data/types";

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), "utf8");
}

/**
 * 读源码并**剔除注释**后再做源码层守卫。
 *
 * 为什么必须剔除：本批次恰恰要在注释里写明"旧实现曾写 `b: 40`"、"不得另用 `toFixed(2)`"，
 * 这些反面样例正是防回退的知识载体，不能因为守卫正则而被迫删掉；反过来，
 * 守卫若扫注释，就会把注释本身判成违规 —— 两边都错。故统一在此处剥离。
 */
function readCode(relPath: string): string {
  return read(relPath)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

/** 递归收集面板数据里所有面向学生的文本字段，供「不得出现 NaN」一类断言批量扫描 */
function collectText(data: MathPanelData): string[] {
  const out: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string") out.push(v);
  };

  for (const q of data.quantities) {
    push(q.label);
    push(q.symbol);
    push(q.value);
    push(q.unit);
  }
  for (const st of data.reasoningSteps ?? []) {
    push(st.title);
    push(st.detail);
    push(st.latex);
    push(st.rubric);
  }
  for (const t of data.theorems ?? []) {
    push(t.name);
    push(t.latex);
    push(t.condition);
    push(t.note);
  }
  for (const g of data.gaokaoPoints ?? []) push(g.text);
  for (const w of data.warnings ?? []) push(w.text);
  push(data.mnemonic);
  return out;
}

const OPTIMIZATION_MATRIX: Array<[OptimizationModelType, number]> = [
  ["box", 10],
  ["box", 1000], // 越界 ⇒ 走截断分支
  ["box", -50],
  ["can", 4.5],
  ["can", 1000],
  ["profit", 30],
  ["profit", -1000],
];

/* ================================================================== *
 * A. 7.1.3 —— 利润模型常量的单一来源（b / c 必须由独立变量推导）
 * ================================================================== */

describe("7.1.3 利润常量单一来源", () => {
  it("b 必须等于 priceBase − costUnit，c 必须等于 costFixed（不得各写一份）", () => {
    const { a, b, c, priceBase, costUnit, costFixed } =
      OPTIMIZATION_CONSTANTS.profit;

    expect(b, "b 与 priceBase − costUnit 脱节：改一个忘一个即静默错位").toBe(
      priceBase - costUnit,
    );
    expect(b).toBe(40);
    expect(c, "c 与 costFixed 脱节：同一笔固定成本被写了两次").toBe(costFixed);
    expect(c).toBe(200);

    // 目标函数与最优产量都必须由这组等式推出，而不是各自记一个数
    const res = calculateOptimizationModel("profit", 30);
    expect(res.optimalX).toBeCloseTo(b / (2 * a), 9);
    expect(res.optimalX).toBeCloseTo(40, 9);
    expect(res.optimalY).toBeCloseTo(600, 9);
    // 最优点处边际利润（一阶导）必为零
    expect(
      calculateOptimizationModel("profit", res.optimalX).primeVal,
    ).toBeCloseTo(0, 9);
  });

  it("一次项系数必须由 a 推导：`-2a x` 而非写死的 `-x`", () => {
    const { a, b } = OPTIMIZATION_CONSTANTS.profit;
    const res = calculateOptimizationModel("profit", 30);

    // 解析式与导函数都必须与 a 自洽
    expect(res.funcExpr).toContain(`-${a}x^2`);
    expect(res.funcExpr).toContain(`+ ${b}x`);
    expect(res.primeExpr).toBe(`P'(x) = -${2 * a === 1 ? "" : 2 * a}x + ${b}`);
    expect(res.primeExpr).toBe("P'(x) = -x + 40");
  });

  it("源码层守卫：常量表不得再出现 `b: 40` / `c: 200` 这类字面量", () => {
    const code = readCode("src/math/derivativeOptimization.ts");
    expect(
      /b:\s*40\b/.test(code),
      "常量表又写回了字面量 b: 40 —— 必须写成 priceBase − costUnit 的推导式",
    ).toBe(false);
    expect(
      /c:\s*200\b/.test(code),
      "常量表又写回了字面量 c: 200 —— 必须写成 costFixed 的推导式",
    ).toBe(false);
    expect(
      /b:\s*PROFIT_BASE\.priceBase\s*-\s*PROFIT_BASE\.costUnit/.test(code),
    ).toBe(true);
    expect(/c:\s*PROFIT_BASE\.costFixed/.test(code)).toBe(true);
  });
});

/* ================================================================== *
 * B. P2-6 —— 自变量区间的单一来源（滑块域 = 拖拽域 = 截断域）
 * ================================================================== */

describe("P2-6 自变量区间单一来源", () => {
  const SLIDER_KEY: Record<
    OptimizationModelType,
    keyof typeof optimizationParamMeta
  > = { box: "box_x", can: "can_r", profit: "profit_x" };

  it("注册表滑块域必须等于常量表 slider（不得各写一套）", () => {
    expect(optimizationParamMeta.box_x.min).toBe(
      OPTIMIZATION_CONSTANTS.box.slider[0],
    );
    expect(optimizationParamMeta.box_x.max).toBe(
      OPTIMIZATION_CONSTANTS.box.slider[1],
    );
    expect(optimizationParamMeta.can_r.min).toBe(
      OPTIMIZATION_CONSTANTS.can.slider[0],
    );
    expect(optimizationParamMeta.can_r.max).toBe(
      OPTIMIZATION_CONSTANTS.can.slider[1],
    );
    expect(optimizationParamMeta.profit_x.min).toBe(
      OPTIMIZATION_CONSTANTS.profit.slider[0],
    );
    expect(optimizationParamMeta.profit_x.max).toBe(
      OPTIMIZATION_CONSTANTS.profit.slider[1],
    );
  });

  it("math 层截断域必须等于常量表 slider（不得另写 [0.5, 29.5] 之类的第二套）", () => {
    for (const [model] of OPTIMIZATION_MATRIX) {
      const res = calculateOptimizationModel(model, 0);
      const slider = OPTIMIZATION_CONSTANTS[model].slider;
      const meta = optimizationParamMeta[SLIDER_KEY[model]];

      expect(res.dragMin).toBe(slider[0]);
      expect(res.dragMax).toBe(slider[1]);
      // 三处同源：math 截断域 == 常量表 slider == 左屏滑块声明域
      expect(res.dragMin).toBe(meta.min);
      expect(res.dragMax).toBe(meta.max);
    }
  });

  it("区间必须严格落在物理定义域内（box 两端、can/profit 只保下界）", () => {
    const box = calculateOptimizationModel("box", 10);
    expect(box.dragMin).toBeGreaterThan(box.domainMin);
    expect(box.dragMax).toBeLessThan(box.domainMax);

    for (const model of ["can", "profit"] as const) {
      const res = calculateOptimizationModel(model, 10);
      expect(res.domainMax).toBe(Infinity);
      expect(res.dragMin).toBeGreaterThan(res.domainMin);
      expect(Number.isFinite(res.dragMax)).toBe(true);
    }
  });

  it("`can` 的容积 V 是题设常量：不得在页面层再手写一次", () => {
    // 裁定：600cm³ 是题目给定的条件（题设），不是学生可调的参数。
    // 因此把它留作常量、只保留「自变量」一个滑块；但**字面量只能出现在常量表里**。
    expect(OPTIMIZATION_CONSTANTS.can.V).toBe(600);

    const scene = readCode(
      "src/features/derivativeOptimization/components/DerivativeOptimizationScene.tsx",
    );
    expect(
      /V = 600/.test(scene),
      "Scene 又把手写的 `V = 600` 写回画面 —— 必须读 OPTIMIZATION_CONSTANTS.can.V",
    ).toBe(false);
    expect(/OPTIMIZATION_CONSTANTS\.can\.V/.test(scene)).toBe(true);

    const page = readCode(
      "src/features/derivativeOptimization/DerivativeOptimizationAnimation.tsx",
    );
    expect(/600cm³/.test(page), "页面文案又写回了 `600cm³`").toBe(false);
    expect(/边长 60cm/.test(page), "页面文案又写回了 `边长 60cm`").toBe(false);
    expect(/OPTIMIZATION_CONSTANTS\.(can\.V|box\.L)/.test(page)).toBe(true);
  });

  it("源码层守卫：math 与注册表都必须从常量表取区间", () => {
    const math = readCode("src/math/derivativeOptimization.ts");
    // 三个模型一律解构 slider，不得再手写 const dragMin = <数字>
    expect(
      (math.match(/const \[dragMin, dragMax\] = slider;/g) ?? []).length,
      "三个模型都必须以 `const [dragMin, dragMax] = slider;` 取区间",
    ).toBe(3);
    expect(/const dragMin = [\d.]/.test(math)).toBe(false);
    expect(/const dragMax = [\d.]/.test(math)).toBe(false);

    const reg = readCode("src/data/registries/derivativeOptimization.ts");
    expect(
      (reg.match(/min: OPTIMIZATION_CONSTANTS\.\w+\.slider\[0\]/g) ?? [])
        .length,
      "注册表的三个 min 都必须取自常量表",
    ).toBe(3);
    expect(
      (reg.match(/max: OPTIMIZATION_CONSTANTS\.\w+\.slider\[1\]/g) ?? [])
        .length,
      "注册表的三个 max 都必须取自常量表",
    ).toBe(3);
    expect(/min: [\d.]+,/.test(reg)).toBe(false);
    expect(/max: [\d.]+,/.test(reg)).toBe(false);
  });
});

/* ================================================================== *
 * C. P2-4 —— 数字格式的唯一口径
 * ================================================================== */

describe("P2-4 数字格式唯一口径", () => {
  it("源码层：四个相关文件里不得再有 toFixed（唯一格式化为 formatMathNumber）", () => {
    for (const file of [
      "src/data/builders/derivativeOperations.ts",
      "src/data/builders/derivativeChain.ts",
      "src/data/builders/derivativeOptimization.ts",
      "src/math/derivativeOptimization.ts",
    ]) {
      const code = readCode(file);
      expect(
        (code.match(/toFixed\(/g) ?? []).length,
        `${file} 又出现了 toFixed —— 同页会同时存在两种数字精度（R2 两位小数 vs R3 精简式）`,
      ).toBe(0);
    }
  });

  it("运行时：右屏全部文本不得出现浮点尾巴或非规范两位小数", () => {
    const panels: MathPanelData[] = [
      ...OPTIMIZATION_MATRIX.map(([m, x]) =>
        buildDerivativeOptimizationPanel(
          { box_x: x, can_r: x, profit_x: x },
          { modelType: m },
        ),
      ),
      buildDerivativeOperationsPanel(
        { x0: 1.2, deltaX: 0.3 },
        { opType: "multiply", modelPair: "poly_trig" },
      ),
      buildDerivativeOperationsPanel(
        { x0: 1.2, deltaX: 0.3 },
        { opType: "divide", modelPair: "trig_poly" },
      ),
    ];

    for (const panel of panels) {
      for (const text of collectText(panel)) {
        // 三位以上小数 = 未经 formatMathNumber 的浮点尾巴（如 16.666666666666668）
        const tail = text.match(/\d+\.\d{3,}/g);
        expect(tail, `浮点尾巴泄漏到正文：${tail} ——「${text}」`).toBeNull();
        // 结尾为 0 的两位小数 = toFixed(2) 残留（如 4.50 / 2.00）
        const trailing = text.match(/\d+\.\d0(?!\d)/g);
        expect(
          trailing,
          `非规范两位小数泄漏到正文：${trailing} ——「${text}」`,
        ).toBeNull();
      }
    }
  });
});

/* ================================================================== *
 * D. P2-5 —— NaN 绝不泄漏到面向学生的文本
 * ================================================================== */

describe("P2-5 NaN 绝不泄漏到正文", () => {
  it("四则运算：全部法则 × 全部模型对 × 含退化点，正文不得出现 NaN", () => {
    const opTypes = ["add", "subtract", "multiply", "divide"] as const;
    const pairs = ["poly_trig", "poly_exp", "trig_poly"] as const;
    const xs = [0, -1, 1.2, 2.5]; // x0 = 0 使 g(x)=x 与 g(x)=sin x 同时取零 ⇒ 商法则退化

    let hit = 0;
    for (const opType of opTypes) {
      for (const modelPair of pairs) {
        for (const x0 of xs) {
          const panel = buildDerivativeOperationsPanel(
            { x0, deltaX: 0.3 },
            { opType, modelPair },
          );
          for (const text of collectText(panel)) {
            expect(
              /NaN|undefined/.test(text),
              `${opType}/${modelPair}/x0=${x0} 正文泄漏 NaN 或 undefined：「${text}」`,
            ).toBe(false);
          }
          hit += 1;
        }
      }
    }
    expect(hit).toBe(48); // 防整段用例空转
  });

  it("链式法则：ln 越界与 a = 0 退化下正文不得出现 NaN", () => {
    const outers = ["exp", "sin", "ln", "power"] as const;
    const cases: Array<[number, number, number]> = [
      [2, 1, -1], // ln(2x+1) 在 x0=-1 处 u0=-1 ⇒ 越界
      [1, -5, 0], // ln(x-5) 在 x0=0 处 u0=-5 ⇒ 越界
      [0, 1, 2], // a=0 退化
      [2, 1, 0.5],
      [-3, 2, -0.5],
    ];

    let hit = 0;
    for (const outerType of outers) {
      for (const [a, b, x0] of cases) {
        const panel = buildDerivativeChainPanel({ a, b, x0 }, { outerType });
        for (const text of collectText(panel)) {
          expect(
            /NaN|undefined/.test(text),
            `chain ${outerType}/a=${a}/b=${b}/x0=${x0} 正文泄漏 NaN 或 undefined：「${text}」`,
          ).toBe(false);
        }
        hit += 1;
      }
    }
    expect(hit).toBe(20);
  });

  it("优化建模：越界取值一律走「已截断」提示，正文不得出现 NaN", () => {
    for (const [model, x] of OPTIMIZATION_MATRIX) {
      const panel = buildDerivativeOptimizationPanel(
        { box_x: x, can_r: x, profit_x: x },
        { modelType: model },
      );
      for (const text of collectText(panel)) {
        expect(text, `optimization ${model}/${x} 泄漏 NaN`).not.toContain(
          "NaN",
        );
        expect(text, `optimization ${model}/${x} 泄漏 undefined`).not.toContain(
          "undefined",
        );
      }
    }
  });

  it("源码层守卫：缺失态分支与符号前缀都必须显式正确", () => {
    // 仅靠「当前没有 NaN」不足以防回退：缺失态分支必须真的存在且真的渲染替代文案
    const ops = read("src/data/builders/derivativeOperations.ts");
    expect(ops).toContain(
      'res.isValid ? formatMathNumber(res.combinedY) : "无定义"',
    );
    expect(ops).toContain(
      'res.isValid ? formatMathNumber(res.combinedSlope) : "无定义"',
    );

    const chain = read("src/data/builders/derivativeChain.ts");
    expect(chain).toContain('"未定义"');

    // `res.primeExpr` 自带 `P'(x) =` 前缀 ⇒ 拼接时不得再加一次
    // （否则印出 `P'(x) = P'(x) = -x + 40`，同一符号在 LaTeX 里出现两遍）
    const opt = readCode("src/data/builders/derivativeOptimization.ts");
    expect(opt).not.toContain("P'(x) = ${res.primeExpr}");
    expect(opt).toContain("${res.primeExpr} = 0");
  });
});
