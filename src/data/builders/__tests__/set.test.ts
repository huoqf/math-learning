import { describe, it, expect } from "vitest";
import { buildSetPanel } from "../set";

describe("buildSetPanel 数据看板构建器测试", () => {
  it("常规相交两集合数据看板生成", () => {
    const params = {
      xA: -1.2,
      yA: 0.0,
      rA: 2.2,
      xB: 1.2,
      yB: 0.0,
      rB: 2.2,
      xP: 0.0,
      yP: 0.0,
    };

    const panelData = buildSetPanel(params);
    expect(panelData.quantities.length).toBeGreaterThanOrEqual(6);
    expect(panelData.theorems.length).toBe(3);
    expect(panelData.gaokaoPoints.length).toBe(3);
    expect(panelData.mnemonic).toContain("小范围推大范围");

    const logicQ = panelData.quantities.find((q) => q.label === "充要逻辑判定");
    expect(logicQ).toBeDefined();
    expect(logicQ?.value).toBe("既不充分也不必要");
  });

  it("集合 A 为子集时充要逻辑正确映射为充分不必要条件", () => {
    const params = {
      xA: 0,
      yA: 0,
      rA: 1,
      xB: 0,
      yB: 0,
      rB: 3,
      xP: 0,
      yP: 0,
    };

    const panelData = buildSetPanel(params);
    const logicQ = panelData.quantities.find((q) => q.label === "充要逻辑判定");
    expect(logicQ?.value).toBe("充分不必要条件");
  });

  it("空集退化时触发警告提示", () => {
    const params = {
      xA: 0,
      yA: 0,
      rA: 0,
      xB: 0,
      yB: 0,
      rB: 2,
      xP: 0,
      yP: 0,
    };

    const panelData = buildSetPanel(params);
    expect(panelData.warnings?.length).toBeGreaterThan(0);
    expect(panelData.warnings?.[0].text).toContain("空集");
  });
});
