import { describe, it, expect } from "vitest";
import { buildFuncExpLogPanel } from "../funcExpLog";

describe("buildFuncExpLogPanel 构建器测试", () => {
  it("幂函数模式 (power): 正确构建基准方程与定理", () => {
    const data = buildFuncExpLogPanel(
      { powerAlpha: 2.0, x0: 1.5 },
      { subExpLog: "power", powerMode: "compare" },
    );
    expect(data.quantities.length).toBeGreaterThan(0);
    expect(data.theorems.length).toBeGreaterThan(0);
    expect(data.theorems[0].name).toContain("图象分界与大小反转定理");
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

  it("指对反函数对称与公切线定理", () => {
    const data = buildFuncExpLogPanel(
      { baseA: 2.0, x0: 2.0 },
      { subExpLog: "exponential" },
    );
    expect(
      data.theorems.some(
        (t) => t.name.includes("公切线") || t.name.includes("反函数"),
      ),
    ).toBe(true);
  });
});
