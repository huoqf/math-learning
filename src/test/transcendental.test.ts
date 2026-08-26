import { describe, it, expect } from "vitest";
import {
  solveExpTangent,
  solveLogTangent,
  solveParamExpAx1,
  solveParamExpAx,
} from "../math/transcendental";
import { buildTranscendentalPanel } from "../data/builders/transcendental";

describe("Transcendental Math Module Tests", () => {
  it("should calculate exp tangent correctly at x0 = 0", () => {
    const res = solveExpTangent(0);
    expect(res.isValid).toBe(true);
    expect(res.y0).toBeCloseTo(1.0);
    expect(res.slope).toBeCloseTo(1.0);
    expect(res.intercept).toBeCloseTo(1.0);
  });

  it("should calculate exp tangent correctly at x0 = 1", () => {
    const res = solveExpTangent(1);
    expect(res.isValid).toBe(true);
    expect(res.y0).toBeCloseTo(Math.E);
    expect(res.slope).toBeCloseTo(Math.E);
    expect(res.intercept).toBeCloseTo(0.0); // y = e*x + 0
  });

  it("should calculate log tangent correctly at x0 = 1", () => {
    const res = solveLogTangent(1);
    expect(res.isValid).toBe(true);
    expect(res.y0).toBeCloseTo(0.0);
    expect(res.slope).toBeCloseTo(1.0);
    expect(res.intercept).toBeCloseTo(-1.0); // y = x - 1
  });

  it("should return invalid for x0 <= 0 in log function", () => {
    const res = solveLogTangent(-1);
    expect(res.isValid).toBe(false);
  });

  it("should identify tangent critical state for e^x >= ax + 1", () => {
    const resTangent = solveParamExpAx1(1.0);
    expect(resTangent.status).toBe("tangent");
    expect(resTangent.intersections).toBe(1);

    const resIntersect = solveParamExpAx1(1.5);
    expect(resIntersect.status).toBe("intersect");
    expect(resIntersect.intersections).toBe(2);
  });

  it("should identify tangent critical state for e^x >= ax", () => {
    const resTangent = solveParamExpAx(Math.E);
    expect(resTangent.status).toBe("tangent");
    expect(resTangent.intersections).toBe(1);
  });

  it("should accurately trigger warnings in buildTranscendentalPanel for param modes", () => {
    // 1. e^x >= ax + 1 模型: a <= 1 无警告, a > 1 有警告
    const panelAx1Ok = buildTranscendentalPanel(
      { a: 1.0 },
      { mode: "param", subMode: "exp_ax_1" },
    );
    expect(panelAx1Ok.warnings.length).toBe(0);

    const panelAx1Warn = buildTranscendentalPanel(
      { a: 1.2 },
      { mode: "param", subMode: "exp_ax_1" },
    );
    expect(panelAx1Warn.warnings.length).toBe(1);

    // 2. e^x >= ax 过原点模型: a <= e (如 a = 2.0) 不应触发警告！
    const panelAxOk = buildTranscendentalPanel(
      { a: 2.0 },
      { mode: "param", subMode: "exp_ax" },
    );
    expect(panelAxOk.warnings.length).toBe(0);

    // a > e 触发警告
    const panelAxWarn = buildTranscendentalPanel(
      { a: 3.0 },
      { mode: "param", subMode: "exp_ax" },
    );
    expect(panelAxWarn.warnings.length).toBe(1);
  });

  it("should prioritize core theorem according to selected mode", () => {
    const expPanel = buildTranscendentalPanel({ x0: 0 }, { mode: "exp" });
    expect(expPanel.theorems[0].name).toContain("指数基准切线");
    expect(expPanel.theorems[0].level).toBe("core");

    const logPanel = buildTranscendentalPanel({ x0: 1 }, { mode: "log" });
    expect(logPanel.theorems[0].name).toContain("对数基准切线");
    expect(logPanel.theorems[0].level).toBe("core");

    const chainPanel = buildTranscendentalPanel({ x0: 1 }, { mode: "chain" });
    expect(chainPanel.theorems[0].name).toContain("双基准对偶");
    expect(chainPanel.theorems[0].level).toBe("core");
  });
});
