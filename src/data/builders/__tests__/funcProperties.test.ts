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
    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);
  });

  it("奇偶性模式 (parity): 正弦函数正确定为奇函数且生成完整推导链", () => {
    const data = buildFuncPropertiesPanel(
      { x0: 1.5, x1: 0.5, x2: 1.2 },
      { mode: "parity", fnType: "sin" },
    );
    expect(
      data.quantities.some((q) => String(q.value).includes("奇函数")),
    ).toBe(true);
    expect(data.reasoningSteps?.[0].latex).toContain("\\sin(-x)");
  });

  it("单调性模式 (parity): 反比例函数跨支 (x1 < 0 < x2) 触发高考易错警示与伪增防坑提示", () => {
    const data = buildFuncPropertiesPanel(
      { x0: 1.5, x1: -1.0, x2: 1.0 },
      { mode: "parity", fnType: "reciprocal" },
    );
    expect(
      data.warnings?.some(
        (w) => w.text.includes("高考易错警示") && w.text.includes("严禁用并集"),
      ),
    ).toBe(true);
    expect(
      data.quantities.some(
        (q) => q.label.includes("固有") && String(q.value).includes("不可并集"),
      ),
    ).toBe(true);
  });

  it("单调性模式 (parity): 二次函数跨对称轴 (x1 < 0 < x2) 触发概念辨析警示，拒绝盲目断定单调", () => {
    const data = buildFuncPropertiesPanel(
      { x0: 1.5, x1: -1.0, x2: 2.0 },
      { mode: "parity", fnType: "quadratic" },
    );
    expect(
      data.warnings?.some(
        (w) => w.text.includes("跨越对称轴") && w.text.includes("并不单调"),
      ),
    ).toBe(true);
    expect(
      data.quantities.some(
        (q) =>
          q.label.includes("固有") && String(q.value).includes("整体不单调"),
      ),
    ).toBe(true);
  });

  it("对称性模式 (symmetry - axis): 正确验证双对称轴推导周期性 T = 2|a - b| 及推导链", () => {
    const data = buildFuncPropertiesPanel(
      { axisA: 1, axisB: 3 },
      { mode: "symmetry", subMode: "period-dual-axis" },
    );
    expect(data.theorems[0].name).toContain("双轴对称");
    expect(data.theorems[0].latex).toContain("2|a - b|");
    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.reasoningSteps?.[0].title).toContain("审题定法");
    expect(data.reasoningSteps?.[1].title).toContain("建模联立");
    expect(data.reasoningSteps?.[2].title).toContain("代入求解");
    expect(data.reasoningSteps?.[2].latex).toContain("T = 2|a - b|");
  });

  it("对称性模式 (symmetry - center): 正确验证双中心对称推导周期性 T = 2|a - b| 及推导链", () => {
    const data = buildFuncPropertiesPanel(
      { axisA: 1, axisB: 3 },
      { mode: "symmetry", subMode: "period-dual-center" },
    );
    expect(data.theorems[0].name).toContain("双中心对称");
    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.reasoningSteps?.[2].latex).toContain("T = 2|a - b|");
  });

  it("对称性模式 (symmetry - axis-center): 正确验证一轴一中心推导周期性 T = 4|a - b| 及推导链", () => {
    const data = buildFuncPropertiesPanel(
      { axisA: 0, axisB: 2 },
      { mode: "symmetry", subMode: "period-axis-center" },
    );
    expect(data.theorems[0].name).toContain("一轴一中心");
    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.reasoningSteps?.[1].detail).toContain("半周期反号");
    expect(data.reasoningSteps?.[2].latex).toContain("T = 4|a - b| = 8");
  });

  it("单轴对称模式 (axis): 具备完整三步几何转化与代数验证推导链", () => {
    const data = buildFuncPropertiesPanel(
      { axisA: 2, x0: 3 },
      { mode: "symmetry", subMode: "axis" },
    );
    expect(data.quantities.some((q) => q.label.includes("对称轴位置"))).toBe(
      true,
    );
    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.reasoningSteps?.[0].title).toContain("中垂线转化");
  });

  it("中心对称模式 (center): 具备完整三步中点公式与求和恒等式推导链", () => {
    const data = buildFuncPropertiesPanel(
      { centerX: 1, centerY: 2, x0: 2 },
      { mode: "symmetry", subMode: "center" },
    );
    expect(data.quantities.some((q) => q.label.includes("对称中心"))).toBe(
      true,
    );
    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.reasoningSteps?.[0].title).toContain("中点公式转化");
  });

  it("定义域模式 (domain): 正确提示反比例函数在 x=0 处的无定义与推导链", () => {
    const data = buildFuncPropertiesPanel(
      { x0: 0 },
      { mode: "domain", fnType: "reciprocal" },
    );
    expect(data.warnings.length).toBeGreaterThan(0);
    expect(data.warnings[0].text).toContain("分母为零");
    expect(
      data.quantities.some(
        (q) =>
          q.label.includes("垂线检验") && String(q.value).includes("无交点"),
      ),
    ).toBe(true);
    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.reasoningSteps?.[0].title).toContain("分式分母非零");
  });

  it("定义域模式 (domain): 根式函数正确识别 [0, +∞) 定义域与值域及越界告警", () => {
    const validData = buildFuncPropertiesPanel(
      { x0: 4 },
      { mode: "domain", fnType: "root" },
    );
    expect(
      validData.quantities.some(
        (q) => q.label === "定义域 D" && String(q.value).includes("[0, +∞)"),
      ),
    ).toBe(true);
    expect(
      validData.quantities.some(
        (q) => q.label === "值域 R" && String(q.value).includes("[0, +∞)"),
      ),
    ).toBe(true);
    expect(
      validData.quantities.some(
        (q) =>
          q.label.includes("垂线检验") && String(q.value).includes("唯一交点"),
      ),
    ).toBe(true);
    expect(validData.reasoningSteps?.length).toBe(3);
    expect(validData.reasoningSteps?.[0].title).toContain("偶次根式");

    const outData = buildFuncPropertiesPanel(
      { x0: -2 },
      { mode: "domain", fnType: "root" },
    );
    expect(
      outData.warnings.some((w) => w.text.includes("偶次根式在实数域无意义")),
    ).toBe(true);
    expect(
      outData.quantities.some(
        (q) =>
          q.label.includes("垂线检验") && String(q.value).includes("无交点"),
      ),
    ).toBe(true);
  });

  it("定义域模式 (domain): 二次函数正确构建单侧有界值域及三步破题推演", () => {
    const data = buildFuncPropertiesPanel(
      { x0: 2 },
      { mode: "domain", fnType: "quadratic" },
    );
    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.reasoningSteps?.[0].title).toContain("多项式定义域");
    expect(data.reasoningSteps?.[1].title).toContain("平方非负性");
    expect(data.reasoningSteps?.[2].latex).toContain("R = [0, +\\infty)");
  });
});
