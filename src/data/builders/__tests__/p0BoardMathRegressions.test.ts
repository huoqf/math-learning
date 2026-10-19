import { describe, it, expect } from "vitest";
import { buildFuncTransformPanel } from "../funcTransform";
import { buildNikePanel } from "../nike";
import { buildQuantifiersPanel } from "../quantifiersBuilder";
import { buildInequalityAbsolutePanel } from "../inequalityAbsolute";

/**
 * P0 回归防线（来源：《知识树完整性与全站动画核查报告-10-19》§3）
 *
 * 这 5 条的共同特征：**都只在"参数取到边界"时暴露**，而边界正是高考设陷阱的地方。
 * 静态门禁（audit / tsc）对它们完全无感——它们不是风格问题，是数学问题，
 * 所以必须用「给定参数 → 断言右屏结论」的形式把正确取值钉死。
 *
 * 一律同时断言「修正支」与「未受影响的对照支」，防止后续为了修边界把主支改坏。
 */

describe("P0-1 /transform：对数 + 自变量翻折的定义域", () => {
  /**
   * 实际解析式为 y = log₂|ω(x − h)|，真数 |x − h| > 0 只在 x = h 处失效，
   * 因此定义域是「去心直线」，不是 (−∞,−|h|)∪(|h|,+∞)。
   * 旧口径把 |x − h| 误当 |x| − h，默认 h = 1 时就把 x = 0（log₂1 = 0，明明有定义）判成无定义。
   */
  it("foldMode=input 时定义域为 x ≠ h", () => {
    const panel = buildFuncTransformPanel(
      { h: 1, k: 0, A: 1, omega: 1 },
      { fnType: "log", foldMode: "input" },
    );
    const latex = panel.reasoningSteps?.[0]?.latex ?? "";
    expect(latex).toContain("x \\neq 1.0");
    expect(latex).not.toContain("\\cup");
  });

  it("对照支：foldMode=none 时定义域仍为 x > h", () => {
    const panel = buildFuncTransformPanel(
      { h: 1, k: 0, A: 1, omega: 1 },
      { fnType: "log", foldMode: "none" },
    );
    expect(panel.reasoningSteps?.[0]?.latex ?? "").toContain("x > 1.0");
  });
});

describe("P0-2 /nike-standard：倒对勾（a<0, b<0）的定理方向", () => {
  /**
   * a<0, b<0 时 x>0 分支上 ax 与 b/x 同为负，基本不等式给出的是
   * (−a)x + (−b)/x ≥ 2√(ab) ⇒ f(x) ≤ −2√(ab)，不是 f(x) ≥ 2√(ab)。
   * 旧实现无条件写 ≥，a=−1,b=−4,x=1 时会得出 −5 ≥ 4 的假命题。
   */
  it("a<0, b<0 时定理写 ≤ −2√ab", () => {
    const panel = buildNikePanel(
      { a: -1, b: -4, h: 0, c: 0, x0: 1 },
      { activeMode: "standard" },
    );
    const latex = panel.theorems?.[0]?.latex ?? "";
    expect(latex).toContain("\\le -2\\sqrt");
    expect(latex).not.toContain("\\ge 2\\sqrt");
  });

  it("对照支：a>0, b>0 时定理仍写 ≥ 2√ab", () => {
    const panel = buildNikePanel(
      { a: 1, b: 4, h: 0, c: 0, x0: 1 },
      { activeMode: "standard" },
    );
    const latex = panel.theorems?.[0]?.latex ?? "";
    expect(latex).toContain("\\ge 2\\sqrt");
  });
});

describe("P0-3 /nike-shifted：a<0 时把最大值点写成 y_min", () => {
  /**
   * f(x) = c + a·u + b/u（u = x − h）。a<0,b<0 时 u>0 分支取到**最大值** c − 2√(ab)：
   * a=−1,b=−4,h=1,c=2 ⇒ u=2、x=3、f(3)=−2，而旧面板写 y_min = 2 + 4 = 6。
   */
  it("a<0 时第 2 步给 y_max = c − 2√ab，且标题随动为求最大值", () => {
    const panel = buildNikePanel(
      { a: -1, b: -4, h: 1, c: 2, x0: 3 },
      { activeMode: "shifted" },
    );
    const step2 = panel.reasoningSteps?.[1];
    expect(step2?.title).toBe("建模联立 · 基本不等式求最大值");
    expect(step2?.latex).toContain("y_{\\max}");
    expect(step2?.latex).toContain("-2.00");
    expect(step2?.latex).not.toContain("y_{\\min}");
  });

  it("a<0 时第 3 步把左支写成极小值点 (−1.00, 6.00)，且使用规范「值域」记号", () => {
    const panel = buildNikePanel(
      { a: -1, b: -4, h: 1, c: 2, x0: 3 },
      { activeMode: "shifted" },
    );
    const step3 = panel.reasoningSteps?.[2];
    expect(step3?.detail).toContain("左支最小值点");
    expect(step3?.detail).toContain("6.00");
    expect(step3?.latex).toContain("\\text{值域：}");
    expect(step3?.latex).not.toContain("最值集合");
  });

  it("定理前提正确声明 a · b > 0 而非狭隘的 b > 0", () => {
    const panel = buildNikePanel(
      { a: -1, b: -4, h: 1, c: 2, x0: 3 },
      { activeMode: "shifted" },
    );
    const th = panel.theorems?.[0];
    expect(th?.prerequisites).toContain("a · b > 0");
    expect(th?.prerequisites).not.toContain("分子系数 b > 0");
  });

  it("对照支：a>0 时仍给 y_min、左支最大值点与求最小值标题，并给出完整数值运算结果", () => {
    const panel = buildNikePanel(
      { a: 1, b: 4, h: 1, c: 2, x0: 3 },
      { activeMode: "shifted" },
    );
    const step2 = panel.reasoningSteps?.[1];
    expect(step2?.title).toBe("建模联立 · 基本不等式求最小值");
    expect(step2?.latex).toContain("y_{\\min}");
    expect(step2?.latex).toContain("= 6.00");
    expect(panel.reasoningSteps?.[2]?.detail ?? "").toContain("左支最大值点");
  });
});

describe("P0-4 /set-quantifiers：探针越界时读数与标签必须同源", () => {
  /**
   * 探针滑杆取值域 [−5,5] 可完全越出目标区间 [a,b]，数学层按端点钳制后计算 probeVal。
   * 旧实现把标签写成 f(probeX)、数值用 probeVal ⇒ 出现 f(-5.0)=5.00（真值 26）的假等式。
   */
  const params = {
    k: 1,
    h: 0,
    v: 1,
    intMin: -2,
    intMax: 2,
    threshold: 2,
    probeX: -5,
  };

  it("标签取钳制后的横坐标，且给出越界提示", () => {
    const panel = buildQuantifiersPanel(params, { activeTab: "universal" });
    const probe = panel.quantities.find((q) => q.label === "动点探针值");
    expect(probe?.symbol).toBe("f(-2.0)");
    expect(panel.warnings?.some((w) => w.text.includes("已越出目标区间"))).toBe(
      true,
    );
  });

  it("对照支：探针在区间内时不产生越界提示", () => {
    const panel = buildQuantifiersPanel(
      { ...params, probeX: 1 },
      { activeTab: "universal" },
    );
    expect(panel.quantities.find((q) => q.label === "动点探针值")?.symbol).toBe(
      "f(1.0)",
    );
    expect(panel.warnings?.some((w) => w.text.includes("已越出目标区间"))).toBe(
      false,
    );
  });

  it("多重退化：k = 0 且探针越界时，退化常数预警与越界提示共存不被遮蔽", () => {
    const panel = buildQuantifiersPanel(
      { ...params, k: 0 },
      { activeTab: "universal" },
    );
    expect(
      panel.warnings?.some((w) => w.text.includes("函数退化为常数函数")),
    ).toBe(true);
    expect(panel.warnings?.some((w) => w.text.includes("已越出目标区间"))).toBe(
      true,
    );
  });
});

describe("P0-5 /inequality-absolute：解集必须由 intervals 渲染", () => {
  /**
   * 平台临界 m = ±|a − b| 时数学层只填 intervals（半直线）、不填 intersectionRoots。
   * 旧实现用「根数」反推解集，落进 else 分支一律输出 `x ∈ ℝ` —— 结论本身错了。
   */
  const build = (m: number, ineqType: "<=" | ">=", studyMode: "diff" | "sum") =>
    buildInequalityAbsolutePanel(
      { a: 1, b: 4, c: 2.5, m, x: 2.5 },
      { studyMode, ineqType },
    );

  it("距离差：m = −|a−b| 且 ≤，解集为 (−∞, 1.00] 而不是 ℝ", () => {
    const latex = build(-3, "<=", "diff").reasoningSteps?.[2]?.latex ?? "";
    expect(latex).toContain("(-\\infty, 1.00]");
    expect(latex).not.toContain("\\mathbb{R}");
  });

  it("距离差：m = +|a−b| 且 ≥，解集为 [4.00, +∞)", () => {
    const latex = build(3, ">=", "diff").reasoningSteps?.[2]?.latex ?? "";
    expect(latex).toContain("[4.00, +\\infty)");
    expect(latex).not.toContain("\\mathbb{R}");
  });

  it("距离差：倾斜段常规情形仍给唯一交点与射线解集", () => {
    const latex = build(0, ">=", "diff").reasoningSteps?.[2]?.latex ?? "";
    expect(latex).toContain("x_0 = 2.50");
    expect(latex).toContain("[2.50, +\\infty)");
  });

  it("距离和：m = |a−b| 且 ≥，解集确为 ℝ（对照支，防止过度修正）", () => {
    expect(build(3, ">=", "sum").reasoningSteps?.[2]?.latex ?? "").toContain(
      "\\mathbb{R}",
    );
  });

  it("距离和：m < |a−b| 且 ≥ 时，不仅解集为 ℝ，且 detail 说明严格指出恒成立，不提联立交点", () => {
    const step3 = build(1, ">=", "sum").reasoningSteps?.[2];
    expect(step3?.latex).toContain("\\mathbb{R}");
    expect(step3?.detail).toContain("对任意实数恒成立");
    expect(step3?.detail).not.toContain("联立方程");
  });

  it("超出值域：m > |a−b| 且 ≥，解集为空集", () => {
    // g(x) ∈ [−3,3]，取 m = 5 时 g(x) ≥ 5 无解；对称地 g(x) ≤ 5 恒成立（解集 ℝ，见上一条对照）。
    expect(build(5, ">=", "diff").reasoningSteps?.[2]?.latex ?? "").toContain(
      "\\varnothing",
    );
  });

  it("超出值域：m > |a−b| 且 ≤，解集为全集 ℝ", () => {
    expect(build(5, "<=", "diff").reasoningSteps?.[2]?.latex ?? "").toContain(
      "\\mathbb{R}",
    );
  });
});
