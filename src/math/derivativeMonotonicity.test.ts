import { describe, it, expect } from "vitest";
import {
  solveMonotonicityModel,
  MONOTONICITY_MODELS,
  formatFloat,
  isTrueExtremum,
  type MonotonicityModelKey,
} from "./derivativeMonotonicity";

describe("derivativeMonotonicity math model", () => {
  it("should correctly solve cubic_param model for a > 0", () => {
    const res = solveMonotonicityModel("cubic_param", 1.0);
    expect(res.hasExtrema).toBe(true);
    expect(res.extrema.length).toBe(2);
    expect(res.extrema[0].type).toBe("maximum");
    expect(res.extrema[0].x).toBeCloseTo(-1.0);
    expect(res.extrema[1].type).toBe("minimum");
    expect(res.extrema[1].x).toBeCloseTo(1.0);
    expect(res.monotonicIntervals.length).toBe(3);
  });

  it("should handle cubic_param model critical case a = 0 (stationary point, non-extrema)", () => {
    const res = solveMonotonicityModel("cubic_param", 0.0);
    expect(res.hasExtrema).toBe(false);
    expect(res.extrema.length).toBe(1);
    expect(res.extrema[0].type).toBe("inflection_stationary");
    expect(res.extrema[0].x).toBe(0);
    expect(res.monotonicIntervals[0].type).toBe("increasing");
  });

  it("should handle cubic_param model monotonic case a < 0", () => {
    const res = solveMonotonicityModel("cubic_param", -1.0);
    expect(res.hasExtrema).toBe(false);
    expect(res.extrema.length).toBe(0);
    expect(res.monotonicIntervals[0].type).toBe("increasing");
  });

  it("should correctly solve exp_poly model (x - a)e^x", () => {
    const res = solveMonotonicityModel("exp_poly", 1.0);
    expect(res.hasExtrema).toBe(true);
    expect(res.extrema.length).toBe(1);
    expect(res.extrema[0].type).toBe("minimum");
    expect(res.extrema[0].x).toBeCloseTo(0.0); // a - 1 = 0
    expect(res.extrema[0].y).toBeCloseTo(-1.0);
  });

  it("should correctly solve ln_x_ratio model (ln x)/x", () => {
    const res = solveMonotonicityModel("ln_x_ratio", 0.0);
    expect(res.hasExtrema).toBe(true);
    expect(res.extrema.length).toBe(1);
    expect(res.extrema[0].type).toBe("maximum");
    expect(res.extrema[0].x).toBeCloseTo(Math.E, 2); // e ≈ 2.718
    expect(res.extrema[0].y).toBeCloseTo(1 / Math.E, 2);
  });

  it("should correctly solve x_ln_x_param model x ln x - ax", () => {
    const res = solveMonotonicityModel("x_ln_x_param", 1.0);
    expect(res.hasExtrema).toBe(true);
    expect(res.extrema.length).toBe(1);
    expect(res.extrema[0].type).toBe("minimum");
    expect(res.extrema[0].x).toBeCloseTo(1.0); // e^(1-1) = 1
    expect(res.extrema[0].y).toBeCloseTo(-1.0);
  });

  it("should correctly solve nike_rational model x + a/x", () => {
    const res = solveMonotonicityModel("nike_rational", 1.0);
    expect(res.hasExtrema).toBe(true);
    expect(res.extrema.length).toBe(2);
    expect(res.extrema[0].type).toBe("maximum");
    expect(res.extrema[0].x).toBeCloseTo(-1.0);
    expect(res.extrema[0].y).toBeCloseTo(-2.0);
    expect(res.extrema[1].type).toBe("minimum");
    expect(res.extrema[1].x).toBeCloseTo(1.0);
    expect(res.extrema[1].y).toBeCloseTo(2.0);
  });

  it("formats floats correctly", () => {
    expect(formatFloat(0)).toBe("0");
    expect(formatFloat(1.5)).toBe("1.5");
    expect(formatFloat(2.0)).toBe("2");
    expect(formatFloat(-0.0001)).toBe("0");
  });

  it("all models have complete definitions in MONOTONICITY_MODELS", () => {
    const keys = Object.keys(MONOTONICITY_MODELS);
    expect(keys.length).toBe(5);
  });

  it("should format simplified derivative LaTeX for ln_x_ratio when a=1 without '0 - ln x'", () => {
    const res = solveMonotonicityModel("ln_x_ratio", 1.0);
    expect(res.derivativeLatex).toBe("f'(x) = \\frac{-\\ln x}{x^2}");
    expect(res.extrema[0].x).toBeCloseTo(1.0); // e^(1-1) = 1
    expect(res.extrema[0].y).toBeCloseTo(1.0); // (0+1)/1 = 1
  });

  it("should have correct signTable and discussionSummary for cubic_param a > 0", () => {
    const res = solveMonotonicityModel("cubic_param", 1.0);
    expect(res.signTable.length).toBe(5);
    expect(res.signTable[0].fPrimeSign).toBe("+");
    expect(res.signTable[1].fPrimeSign).toBe("0");
    expect(res.signTable[2].fPrimeSign).toBe("-");
    expect(res.signTable[3].fPrimeSign).toBe("0");
    expect(res.signTable[4].fPrimeSign).toBe("+");
    expect(res.discussionSummaryLatex).toContain("有两相异根");
  });

  it("should correctly handle nike_rational with a <= 0", () => {
    const res = solveMonotonicityModel("nike_rational", 0.0);
    expect(res.hasExtrema).toBe(false);
    expect(res.extrema.length).toBe(0);
    expect(res.monotonicIntervals.length).toBe(2);
    expect(res.monotonicIntervals[0].type).toBe("increasing");
    expect(res.monotonicIntervals[1].type).toBe("increasing");
    expect(res.discussionSummaryLatex).toContain("无极值点");
  });

  it("should correctly verify left and right signs of extrema for exp_poly", () => {
    const res = solveMonotonicityModel("exp_poly", 2.0);
    expect(res.extrema[0].leftSign).toBe(-1); // 极小值左侧减(-)
    expect(res.extrema[0].rightSign).toBe(1); // 极小值右侧增(+)
    expect(res.extrema[0].x).toBeCloseTo(1.0); // a - 1 = 1
  });

  /**
   * signTable 是右屏「单调性与极值符号表」的唯一数据源，其单元格必须直接可作
   * KaTeX \begin{array} 的单元格使用。以下为「改造后契约」的机器守卫：
   *   ① 中文只能出现在 \text{...} 内（KaTeX 数学模式不接受裸 CJK）
   *   ② 不得出现 Unicode 箭头 ↗/↘（KaTeX 不支持该码位）
   *   ③ 不得出现列/行分隔符 & 与 \\（它们由组装方插入）
   * 覆盖 5 个模型 × a 的「正 / 零 / 负」三种参数区间，共 10 组解。
   */
  it("signTable 单元格必须为可直用的 LaTeX 片段（中文仅限 \\text{} 内、无箭头、无表格分隔符）", () => {
    const modelKeys: MonotonicityModelKey[] = [
      "cubic_param",
      "exp_poly",
      "ln_x_ratio",
      "x_ln_x_param",
      "nike_rational",
    ];
    const aValues = [-1, 0, 1];

    modelKeys.forEach((modelKey) => {
      aValues.forEach((a) => {
        const res = solveMonotonicityModel(modelKey, a);
        expect(
          res.signTable.length,
          `${modelKey}(a=${a}) 符号表不应为空`,
        ).toBeGreaterThan(0);

        res.signTable.forEach((row, rowIdx) => {
          const cells: Array<[string, string]> = [
            ["xDesc", row.xDesc],
            ["fPrimeSign", row.fPrimeSign],
            ["fxBehavior", row.fxBehavior],
          ];
          cells.forEach(([field, cell]) => {
            const ctx = `${modelKey}(a=${a}) signTable[${rowIdx}].${field} = "${cell}"`;
            // ① 剥离 \text{...} 后不得残留裸中文
            const stripped = cell.replace(/\\text\{[^}]*\}/g, "");
            expect(stripped, `${ctx} 含 \text{} 之外的裸中文`).not.toMatch(
              /[\u4e00-\u9fa5]/,
            );
            // ② 不得含 Unicode 箭头
            expect(cell, `${ctx} 含 KaTeX 不支持的 Unicode 箭头`).not.toMatch(
              /[↗↘]/,
            );
            // ③ 不得含表格分隔符（由组装方插入）
            expect(cell, `${ctx} 不得含列分隔符 &`).not.toContain("&");
            expect(cell, `${ctx} 不得含行分隔符 \\\\`).not.toMatch(/\\\\/);
          });
        });
      });
    });
  });

  /**
   * 真极值点判定是三屏共享口径（中屏特征线 + 图例 + 右屏符号表）。
   * 关键反例：f(x)=x³ 型的 inflection_stationary 导数为零的点切线水平但非极值，
   * 必须被排除，否则会把「导数为零的点」误画成极值。
   */
  it("isTrueExtremum 必须排除 inflection_stationary 导数为零的点、保留极大/极小值点", () => {
    const cubicExtrema = solveMonotonicityModel("cubic_param", 1.0).extrema;
    expect(cubicExtrema.filter(isTrueExtremum).length).toBe(2);

    const criticalCase = solveMonotonicityModel("cubic_param", 0.0).extrema;
    expect(criticalCase.length).toBe(1);
    expect(criticalCase[0].type).toBe("inflection_stationary");
    expect(criticalCase.filter(isTrueExtremum).length).toBe(0);

    // 对勾函数 a ≤ 0：无极值，全部类型都应是 none 或空集
    const nikeNoExtrema = solveMonotonicityModel("nike_rational", 0.0).extrema;
    expect(nikeNoExtrema.filter(isTrueExtremum).length).toBe(0);

    // 对勾函数 a > 0：一极大一极小，且极大值 < 极小值（反常识考点）
    // f(x) = x + 1/x，极大值点 (−1, −2)，极小值点 (1, 2)
    const nikeExtrema = solveMonotonicityModel("nike_rational", 1.0).extrema;
    const trueExtrema = nikeExtrema.filter(isTrueExtremum);
    expect(trueExtrema.length).toBe(2);
    const maxPoint = trueExtrema.find((e) => e.type === "maximum");
    const minPoint = trueExtrema.find((e) => e.type === "minimum");
    expect(maxPoint?.x).toBeCloseTo(-1.0);
    expect(maxPoint?.y).toBeCloseTo(-2.0);
    expect(minPoint?.x).toBeCloseTo(1.0);
    expect(minPoint?.y).toBeCloseTo(2.0);
    // 极大值 (−2) 反而小于极小值 (2)：极值是局部性质，二者不可跨点比较
    expect(maxPoint!.y).toBeLessThan(minPoint!.y);
  });
});
