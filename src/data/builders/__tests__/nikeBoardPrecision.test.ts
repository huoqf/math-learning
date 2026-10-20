/**
 * 均值不等式 / 对勾函数看板派生量精度回归（P1）
 *
 * ## 缺陷背景
 * `ab` 与斜渐近线截距 `c − a·h` 都是由「1 位小数的滑杆参数相乘/相减」得到的派生量，
 * 结果可达 **2 位小数**。旧实现用 `toFixed(1)` 打印，于是同一块看板上出现自相矛盾：
 *
 *   a = 0.3, b = 1.5
 *     step1 → 「两正数项乘积为定值 ab = 0.5」   ← 截断，真值 0.45
 *     step2 → 「f(x) ≥ 2√(0.3 × 1.5) = 1.34」  ← 用真值算
 *   学生按印出的 ab = 0.5 复算 2√0.5 = 1.41，与看板的 1.34 对不上。
 *
 * 同理 h = 0.5, a = 1.5, c = 0.2 时截距真值 −0.55，旧实现印成「y = 1.5x − 0.6」。
 *
 * ## 修复口径
 * 原始滑杆参数（a / b / h / c / x0，步长 0.1 或 0.5）保持 `toFixed(1)` —— 1 位小数即精确；
 * 只有**派生量**（`ab`、`c − a·h`）改走 `formatMathNumber`（全库 SSOT 格式化，保留 2 位并去尾零），
 * 从而与同样按 2 位打印的 `y_min`、`c ± 2√(ab)` 对齐。
 */

import { describe, it, expect } from "vitest";
import { buildNikePanel } from "../nike";
import { formatMathNumber } from "@/utils/mathFormat";

/** 从成对括号或等号后抽取最后一个数字（看板 latex 尾部即结果值） */
function tailNumber(latex: string): number {
  const m = latex.match(/(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) throw new Error(`无法从 latex 尾部解析数值: ${latex}`);
  return Number(m[1]);
}

describe("均值不等式看板：乘积定值 ab 必须按真值打印", () => {
  it("a=0.3, b=1.5 时定值应印 0.45，且与学生用印出 ab 复算的 y_min 完全自洽", () => {
    const data = buildNikePanel(
      { a: 0.3, b: 1.5, x0: 1, h: 0, c: 0 },
      { activeMode: "amgm" },
    );

    const step1 = data.reasoningSteps?.[0];
    const step2 = data.reasoningSteps?.[1];
    expect(step1).toBeDefined();
    expect(step2).toBeDefined();

    const latex1 = step1?.latex ?? "";
    const latex2 = step2?.latex ?? "";

    // 旧实现印的是 "ab = 0.5"，学生复算必然对不上
    expect(latex1).toContain("ab = 0.45");
    expect(latex1).not.toContain("ab = 0.5");
    // detail 里的代数式求值同样不得截断
    expect(step1?.detail).toContain("= 0.45");

    // 学生视角复算：用看板印出的 ab 再算一遍 2√ab，必须等于看板印出的 y_min
    const ab = tailNumber(latex1);
    const yMin = tailNumber(latex2);
    expect(Number((2 * Math.sqrt(ab)).toFixed(2))).toBe(yMin);
  });

  it("全部可达参数组合（a 0.2~3.0 步长 0.1 × b 0.5~9.0 步长 0.5）均满足『印出 ab → 复算 y_min』自洽", () => {
    const mismatches: string[] = [];

    for (let ai = 2; ai <= 30; ai++) {
      const a = Number((ai / 10).toFixed(1));
      for (let bi = 1; bi <= 18; bi++) {
        const b = Number((bi * 0.5).toFixed(1));
        const data = buildNikePanel(
          { a, b, x0: 1, h: 0, c: 0 },
          { activeMode: "amgm" },
        );
        const step1 = data.reasoningSteps?.[0]?.latex;
        const step2 = data.reasoningSteps?.[1]?.latex;
        if (!step1 || !step2) continue;

        const ab = tailNumber(step1);
        const yMin = tailNumber(step2);
        const recomputed = Number((2 * Math.sqrt(ab)).toFixed(2));

        if (ab !== Number(formatMathNumber(a * b))) {
          mismatches.push(`a=${a},b=${b}: 印出 ab=${ab}，真值 ${a * b}`);
        } else if (recomputed !== yMin) {
          mismatches.push(
            `a=${a},b=${b}: 印出 ab=${ab} 复算 ${recomputed} ≠ 看板 y_min ${yMin}`,
          );
        }
      }
    }

    expect(mismatches).toEqual([]);
  });
});

describe("主公式记号：系数 1 必须省略（不得出现 1x / 1.0x）", () => {
  it("a=1, b=4 的均值不等式推导链写作 f(x) = x + 4/x", () => {
    const data = buildNikePanel(
      { a: 1, b: 4, x0: 2, h: 0, c: 0 },
      { activeMode: "amgm" },
    );
    const latex = data.reasoningSteps?.[1]?.latex ?? "";

    expect(latex).toContain("f(x) = x + ");
    // 旧实现：f(x) = 1.0x + \frac{4.0}{x}
    expect(latex).not.toContain("1x");
    expect(latex).not.toContain("1.0");
    expect(latex).not.toContain("\\frac{4.0}");
    // 末尾的最小值仍按 2 位小数给出（= 4.00），属正常数值呈现
    expect(latex).toContain("= 4.00");
  });

  it("a=1 时渐近线方程写作 y = x − 1，而非 y = 1.0x − 1.0", () => {
    const data = buildNikePanel(
      { a: 1, b: 2, x0: 2, h: 2, c: 1 },
      { activeMode: "shifted" },
    );
    const asym = data.quantities.find((q) => q.label === "渐近线方程");
    expect(asym).toBeDefined();
    // 截距 = 1 − 1×2 = −1
    expect(asym!.value).toContain("y = x - 1");
    expect(asym!.value).not.toContain("1.0x");
  });
});

describe("平移对勾型：斜渐近线截距 c − a·h 不得截断", () => {
  it("h=0.5, a=1.5, c=0.2 时截距应为 −0.55，不得印成 −0.6", () => {
    const data = buildNikePanel(
      { a: 1.5, b: 2, x0: 2, h: 0.5, c: 0.2 },
      { activeMode: "shifted" },
    );

    const asym = data.quantities.find((q) => q.label === "渐近线方程");
    expect(asym).toBeDefined();
    // 真值 0.2 − 1.5×0.5 = −0.55；旧实现 toFixed(1) 印成 −0.6
    expect(asym!.value).toContain("- 0.55");
    expect(asym!.value).not.toContain("- 0.6 ");
  });

  it("截距为正时同样保留 2 位（h=0.5, a=1.5, c=1.0 → + 0.25）", () => {
    const data = buildNikePanel(
      { a: 1.5, b: 2, x0: 2, h: 0.5, c: 1.0 },
      { activeMode: "shifted" },
    );

    const asym = data.quantities.find((q) => q.label === "渐近线方程");
    // 真值 1.0 − 0.75 = 0.25；旧实现 toFixed(1) 印成 0.3
    expect(asym!.value).toContain("+ 0.25");
  });
});

describe("平移对勾型：负平移量不得印成双负号 (x - -2)", () => {
  it("h = -2, a = 1.5, c = 1 时斜渐近线写作 y = 1.5(x + 2) + 1", () => {
    const data = buildNikePanel(
      { a: 1.5, b: 2, x0: 2, h: -2, c: 1 },
      { activeMode: "shifted" },
    );

    const notes = (data.theorems ?? [])
      .map((t) => t.note ?? "")
      .filter((n) => n.includes("斜渐近线"));
    expect(notes.length).toBeGreaterThan(0);
    expect(notes[0]).toContain("(x + 2)");
    // 旧实现直接拼 `(x - ${h})`，h = -2 时印成 (x - -2)
    expect(notes[0]).not.toContain("- -2");
  });
});
