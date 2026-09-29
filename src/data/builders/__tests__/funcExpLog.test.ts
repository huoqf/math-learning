import { describe, it, expect } from "vitest";
import { buildFuncExpLogPanel } from "../funcExpLog";

describe("buildFuncExpLogPanel 构建器测试", () => {
  it("幂函数模式 (power): 正确构建基准方程、定理、推导链与易错警示", () => {
    // 1. 对比模式
    const dataCompare = buildFuncExpLogPanel(
      { powerAlpha: 2.0, x0: 1.5 },
      { subExpLog: "power", powerMode: "compare" },
    );
    expect(dataCompare.quantities.length).toBeGreaterThan(0);
    expect(dataCompare.theorems.length).toBeGreaterThan(0);
    expect(dataCompare.theorems[0].name).toContain("图象分界与大小反转定理");
    expect(dataCompare.reasoningSteps).toBeDefined();
    expect(dataCompare.reasoningSteps?.length).toBe(3);
    expect(dataCompare.reasoningSteps?.[0].title).toContain("审题转化");
    expect(dataCompare.reasoningSteps?.[1].title).toContain("枢纽分界");
    expect(dataCompare.reasoningSteps?.[2].title).toContain("定法总结");

    // 2. 自由单函数模式 (α = -1)
    const dataSingleNeg = buildFuncExpLogPanel(
      { powerAlpha: -1.0, x0: 2.0 },
      { subExpLog: "power", powerMode: "single" },
    );
    expect(dataSingleNeg.reasoningSteps).toBeDefined();
    expect(dataSingleNeg.reasoningSteps?.length).toBe(3);
    expect(dataSingleNeg.reasoningSteps?.[0].title).toContain("作基准线");
    expect(dataSingleNeg.reasoningSteps?.[1].title).toContain("取点比较");
    expect(dataSingleNeg.reasoningSteps?.[2].title).toContain("归纳形态");
    // 幂函数位于必修一：正文与推导链一律不得出现导数记号（f'、f''）与切线方程
    const singleNegText = JSON.stringify(dataSingleNeg);
    expect(singleNegText).not.toContain("f'");
    expect(singleNegText).not.toContain("切线");
    // 验证高考易错警示 (分别单调递减，不可写成并集)
    expect(
      dataSingleNeg.warnings.some((w) => w.text.includes("分别单调递减")),
    ).toBe(true);
  });

  it("指数模式 (exponential): 严格判定底数 a > 1 增函数与 0 < a < 1 减函数", () => {
    const dataInc = buildFuncExpLogPanel(
      { baseA: 2.0, x0: 1.0 },
      { subExpLog: "exponential" },
    );
    expect(
      dataInc.quantities.some((q) => String(q.value).includes("严格单调递增")),
    ).toBe(true);

    const dataDec = buildFuncExpLogPanel(
      { baseA: 0.5, x0: 1.0 },
      { subExpLog: "exponential" },
    );
    expect(
      dataDec.quantities.some((q) => String(q.value).includes("严格单调递减")),
    ).toBe(true);
  });

  it("对数模式 (logarithmic): 严格判定真数非正警告", () => {
    const dataWarn = buildFuncExpLogPanel(
      { baseA: 2.0, x0: -1.0 },
      { subExpLog: "logarithmic" },
    );
    expect(dataWarn.warnings.length).toBeGreaterThan(0);
    expect(dataWarn.warnings[0].text).toContain("真数必须大于 0");
  });

  it("对数模式 (logarithmic): 单曲线性质三步推导链与定点特征", () => {
    const dataSingle = buildFuncExpLogPanel(
      { baseA: 2.0, x0: 2.0 },
      { subExpLog: "logarithmic", explogMode: "single" },
    );
    expect(dataSingle.reasoningSteps).toBeDefined();
    expect(dataSingle.reasoningSteps?.length).toBe(3);
    expect(dataSingle.reasoningSteps?.[0].title).toContain("基准模型");
    expect(dataSingle.reasoningSteps?.[1].title).toContain("单调判号");
    expect(dataSingle.reasoningSteps?.[2].title).toContain("图象走势");
    expect(
      dataSingle.quantities.some((q) => q.label.includes("恒过定点检验")),
    ).toBe(true);
    // 必修一红线：正文与推导链一律不得出现导数切线与放缩
    const singleText = JSON.stringify(dataSingle);
    expect(singleText).not.toContain("f'(");
    expect(singleText).not.toContain("导数切线");
  });

  it("对数模式 (logarithmic): 反函数对称模式三步推导链、中点M与垂直判定", () => {
    const dataInverse = buildFuncExpLogPanel(
      { baseA: 2.0, x0: 2.0 },
      { subExpLog: "logarithmic", explogMode: "inverse" },
    );
    expect(dataInverse.reasoningSteps).toBeDefined();
    expect(dataInverse.reasoningSteps?.length).toBe(3);
    expect(dataInverse.reasoningSteps?.[0].title).toContain("反解变元");
    expect(dataInverse.reasoningSteps?.[1].title).toContain("垂直平分");
    expect(dataInverse.reasoningSteps?.[2].title).toContain("性质对偶");

    // 验证对称中点 M 与垂直判定量
    expect(dataInverse.quantities.some((q) => q.label.includes("中点 M"))).toBe(
      true,
    );
    expect(
      dataInverse.quantities.some((q) => q.label.includes("垂直对称轴判定")),
    ).toBe(true);
  });

  it("指对反函数对称三要素（必修一：只讲几何对称，公切线临界已移入选必二页）", () => {
    const data = buildFuncExpLogPanel(
      { baseA: 2.0, x0: 2.0 },
      { subExpLog: "exponential", explogMode: "inverse" },
    );
    expect(data.theorems.some((t) => t.name.includes("反函数"))).toBe(true);
    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);

    // 反函数三要素：对称点位 + 中点 M + 垂直平分判定 + 互逆验证
    expect(data.quantities.some((q) => q.label.includes("反函数对称点"))).toBe(
      true,
    );
    expect(data.quantities.some((q) => q.label.includes("中点 M"))).toBe(true);
    expect(
      data.quantities.some((q) => q.label.includes("垂直对称轴判定")),
    ).toBe(true);
    expect(
      data.quantities.some((q) => q.label.includes("反函数对数验证")),
    ).toBe(true);

    // 必修一红线：公切线 / 相切临界底数 a_c = e^{1/e} 与两曲线交点分类属选必二通法，
    // 已按规划迁到 /derivative-transcendental，本页严禁两处并存。
    const text = JSON.stringify(data);
    expect(text).not.toContain("相切临界");
    expect(text).not.toContain("公切线");
    expect(text).not.toContain("e^{1/e}");
    expect(text).not.toContain("两曲线交点");
    expect(text).not.toContain("f'(");
    expect(text).not.toContain("切线");
  });

  it("指数页 (exponential) 正文与推导链不得出现导数记号与切线方程", () => {
    for (const explogMode of ["single", "inverse"] as const) {
      for (const baseA of [0.5, 2.0, 2.7]) {
        const data = buildFuncExpLogPanel(
          { baseA, x0: 1.5 },
          { subExpLog: "exponential", explogMode },
        );
        const text = JSON.stringify(data);
        expect(text).not.toContain("f'");
        expect(text).not.toContain("切线");
        expect(text).not.toContain("相切临界");
      }
    }
  });

  it("对数页 (logarithmic) 正文与推导链不得出现导数记号与切线方程", () => {
    for (const explogMode of ["single", "inverse"] as const) {
      for (const baseA of [0.5, 2.0, 2.7]) {
        const data = buildFuncExpLogPanel(
          { baseA, x0: 2.0 },
          { subExpLog: "logarithmic", explogMode },
        );
        const text = JSON.stringify(data);
        expect(text).not.toContain("f'");
        expect(text).not.toContain("切线");
        expect(text).not.toContain("相切临界");
      }
    }
  });
});
