import { describe, it, expect } from "vitest";
import { buildFuncPropertiesPanel } from "../funcProperties";

describe("buildFuncPropertiesPanel 构建器测试", () => {
  it("奇偶性模式 (parity): 正确构建偶函数定理与指标", () => {
    const data = buildFuncPropertiesPanel(
      { x0: 2 },
      { mode: "parity", fnType: "quadratic" },
    );
    expect(data.quantities.length).toBeGreaterThan(0);
    expect(data.theorems.length).toBeGreaterThan(0);
    expect(data.theorems[0].name).toContain("奇偶性");
    expect(
      data.theorems[0].prerequisites?.some((p) => p.includes("坐标原点对称")),
    ).toBe(true);
    expect(
      data.quantities.some((q) => String(q.value).includes("偶函数")),
    ).toBe(true);
  });

  it("奇偶性模式 (parity): 正确构建三次函数奇函数指标", () => {
    const data = buildFuncPropertiesPanel(
      { x0: 2 },
      { mode: "parity", fnType: "cubic" },
    );
    expect(data.theorems[0].name).toContain("奇偶性");
    expect(
      data.quantities.some((q) => String(q.value).includes("奇函数")),
    ).toBe(true);
  });

  it("对称性模式 (symmetry - axis): 正确验证双对称轴推导周期性 T = 2|a - b|", () => {
    const data = buildFuncPropertiesPanel(
      { axisA: 1, axisB: 3 },
      { mode: "symmetry", subMode: "period-dual-axis" },
    );
    expect(data.theorems[0].name).toContain("双轴对称");
    expect(data.theorems[0].latex).toContain("2|a - b|");
  });

  it("对称性模式 (symmetry - center): 正确验证双中心对称推导周期性 T = 2|x1 - x2|", () => {
    const data = buildFuncPropertiesPanel(
      { centerX: 0, centerY: 0, x1: 1, x2: 3 },
      { mode: "symmetry", subMode: "period-dual-center" },
    );
    expect(data.theorems[0].name).toContain("双中心对称");
  });

  it("定义域模式 (domain): 正确提示反比例函数在 x=0 处的无定义", () => {
    const data = buildFuncPropertiesPanel(
      { x0: 0 },
      { mode: "domain", fnType: "reciprocal" },
    );
    expect(data.warnings.length).toBeGreaterThan(0);
    expect(data.warnings[0].text).toContain("分母为零");
  });
});
