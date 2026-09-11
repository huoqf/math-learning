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
    expect(dataSingleNeg.reasoningSteps?.[0].title).toContain("符号求导");
    expect(dataSingleNeg.reasoningSteps?.[1].title).toContain("代入探究");
    expect(dataSingleNeg.reasoningSteps?.[2].title).toContain("几何反思");
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

  it("对数模式 (logarithmic): 单曲线性质三步推导链与切线放缩", () => {
    const dataSingle = buildFuncExpLogPanel(
      { baseA: 2.0, x0: 2.0 },
      { subExpLog: "logarithmic", explogMode: "single" },
    );
    expect(dataSingle.reasoningSteps).toBeDefined();
    expect(dataSingle.reasoningSteps?.length).toBe(3);
    expect(dataSingle.reasoningSteps?.[0].title).toContain("基准模型");
    expect(dataSingle.reasoningSteps?.[1].title).toContain("导数切线");
    expect(dataSingle.reasoningSteps?.[2].title).toContain("高考放缩");
    expect(
      dataSingle.quantities.some((q) => q.label.includes("动点切线斜率")),
    ).toBe(true);
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
    expect(dataInverse.reasoningSteps?.[2].title).toContain("相切与交点临界");

    // 验证对称中点 M 与垂直判定量
    expect(dataInverse.quantities.some((q) => q.label.includes("中点 M"))).toBe(
      true,
    );
    expect(
      dataInverse.quantities.some((q) => q.label.includes("垂直对称轴判定")),
    ).toBe(true);
    expect(
      dataInverse.quantities.some((q) => q.label.includes("相切临界底数")),
    ).toBe(true);
  });

  it("指对反函数对称与公切线定理", () => {
    const data = buildFuncExpLogPanel(
      { baseA: 2.0, x0: 2.0 },
      { subExpLog: "exponential", explogMode: "inverse" },
    );
    expect(
      data.theorems.some(
        (t) => t.name.includes("公切线") || t.name.includes("反函数"),
      ),
    ).toBe(true);
    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);
  });
});
