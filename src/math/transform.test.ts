import { describe, it, expect } from "vitest";
import {
  evalBaseFunction,
  calculateTransform,
  buildTransformLatex,
} from "./transform";

describe("transform math library", () => {
  it("evaluates base functions correctly", () => {
    expect(evalBaseFunction("quadratic", 2)).toBe(4);
    expect(evalBaseFunction("sine", Math.PI / 2)).toBeCloseTo(1);
    expect(evalBaseFunction("cubic", 2)).toBe(8);
    expect(evalBaseFunction("exp", 3)).toBe(8);
  });

  it("handles translation and scaling correctly", () => {
    // y = 2 * (x - 1)^2 + 3
    const params = { h: 1, k: 3, A: 2, omega: 1, foldMode: "none" as const };
    const res = calculateTransform("quadratic", params);

    expect(res.transformedFn(1)).toBe(3); // 顶点移至 (1, 3)
    expect(res.transformedFn(2)).toBe(5); // 2*(1)^2 + 3 = 5
    expect(res.symmetryInfo.axisX).toBe(1);
    expect(res.isDegenerate).toBe(false);
  });

  it("handles global fold |f(x)| correctly", () => {
    // y = |x^2 - 4|
    const params = { h: 0, k: -4, A: 1, omega: 1, foldMode: "global" as const };
    const res = calculateTransform("quadratic", params);

    expect(res.transformedFn(0)).toBe(4); // 原为 -4，翻折后为 4
    expect(res.transformedFn(2)).toBe(0);
    expect(res.transformedFn(-2)).toBe(0);
  });

  it("handles input fold f(|x|) correctly", () => {
    // y = 2^|x| - 1
    const params = { h: 0, k: -1, A: 1, omega: 1, foldMode: "input" as const };
    const res = calculateTransform("exp", params);

    expect(res.transformedFn(1)).toBe(1); // 2^1 - 1 = 1
    expect(res.transformedFn(-1)).toBe(1); // 2^|-1| - 1 = 1 (偶函数)
    expect(res.symmetryInfo.type).toBe("even");
  });

  it("builds clean and standard LaTeX formulas without redundant symbols", () => {
    // 默认基准母函数 y = x^2 (h=0, k=0, A=1, omega=1)
    const baseQuadratic = buildTransformLatex("quadratic", {
      h: 0,
      k: 0,
      A: 1,
      omega: 1,
      foldMode: "none",
    });
    expect(baseQuadratic).toBe("y = x^2");

    // 平移伸缩 y = 2 \cdot (2(x - 1))^2 + 3
    const transQuadratic = buildTransformLatex("quadratic", {
      h: 1,
      k: 3,
      A: 2,
      omega: 2,
      foldMode: "none",
    });
    expect(transQuadratic).toBe("y = 2 \\cdot (2(x - 1))^2 + 3");

    // 负数消元与负号处理 y = -2 \cdot \sin(x + 1) - 0.5
    const sineNegative = buildTransformLatex("sine", {
      h: -1,
      k: -0.5,
      A: -2,
      omega: 1,
      foldMode: "none",
    });
    expect(sineNegative).toBe("y = -2 \\cdot \\sin(x + 1) - 0.5");

    // 全局绝对值 y = \left| x^2 - 4 \right|
    const globalFold = buildTransformLatex("quadratic", {
      h: 0,
      k: -4,
      A: 1,
      omega: 1,
      foldMode: "global",
    });
    expect(globalFold).toBe("y = \\left| x^2 - 4 \\right|");
  });

  it("detects degenerate parameters", () => {
    const resA0 = calculateTransform("quadratic", {
      h: 0,
      k: 2,
      A: 0,
      omega: 1,
      foldMode: "none",
    });
    expect(resA0.isDegenerate).toBe(true);

    const resOmega0 = calculateTransform("quadratic", {
      h: 0,
      k: 2,
      A: 1,
      omega: 0,
      foldMode: "none",
    });
    expect(resOmega0.isDegenerate).toBe(true);
  });

  it("generates correct Gaokao dual transform routes (shift-first vs scale-first)", () => {
    // y = sin(2(x - 1)) = sin(2x - 2)
    const params = { h: 1, k: 0, A: 1, omega: 2, foldMode: "none" as const };
    const res = calculateTransform("sine", params);

    expect(res.routes.shiftFirst).toContain("右移");
    expect(res.routes.shiftFirst).toContain("x - 1.00");
    expect(res.routes.scaleFirst).toContain("2.0x");
    expect(res.routes.scaleFirst).toContain("2.00");
  });

  it("handles vertical flip when A < 0", () => {
    // y = -2 * x^2 + 1
    const params = { h: 0, k: 1, A: -2, omega: 1, foldMode: "none" as const };
    const res = calculateTransform("quadratic", params);

    expect(res.transformedFn(0)).toBe(1);
    expect(res.transformedFn(1)).toBe(-1); // -2(1)^2 + 1 = -1
    expect(res.description).toContain("x轴翻转");
    expect(res.description).toContain("2.0倍");
  });
});
