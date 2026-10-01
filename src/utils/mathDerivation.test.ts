import { describe, it, expect } from "vitest";
import { deriveMidpointPerpendicularSlope } from "./mathDerivation";

describe("deriveMidpointPerpendicularSlope - 垂径中点斜率乘积推导链", () => {
  it("常规：k_CH ≠ 0 时按负倒数求 k_AB，且等号链满足公式→代入→结果三部曲", () => {
    const latex = deriveMidpointPerpendicularSlope(
      { x: 1, y: 1 },
      { x: 0, y: 0 },
      1,
      -1,
    );

    expect(latex).toContain("k_{CH}");
    expect(latex).toContain("-\\frac{1}{1}");
    expect(latex).toContain("= -1");
    expect((latex.match(/=/g) || []).length).toBeGreaterThanOrEqual(3);
  });

  it("连心线铅垂 (k_CH 不存在) ⇒ 割线水平，k_AB = 0", () => {
    const latex = deriveMidpointPerpendicularSlope(
      { x: 0, y: 2 },
      { x: 0, y: 0 },
      null,
      0,
    );

    expect(latex).toContain("不存在");
    expect(latex).toContain("水平弦");
  });

  it("连心线水平 (k_CH = 0) ⇒ 割线铅垂，k_AB 不存在；严禁输出 -1/0 或渲染哨兵", () => {
    // 修复前：走通用分支会输出 "k_{AB} = -1/0 = 1000000"，
    // 是学生可当场代入验证的假等式（-1/0 无意义，1000000 是渲染哨兵）。
    const latex = deriveMidpointPerpendicularSlope(
      { x: 3, y: 0 },
      { x: 0, y: 0 },
      0,
      1e6,
    );

    expect(latex).toContain("不存在");
    expect(latex).toContain("铅垂");
    expect(latex).not.toContain("1000000");
    expect(latex).not.toContain("-\\frac{1}{0}");
  });

  it("浮点误差下的 k_CH ≈ 0 同样按铅垂处理（容差 1e-4）", () => {
    const latex = deriveMidpointPerpendicularSlope(
      { x: 3, y: 0 },
      { x: 0, y: 0 },
      -3e-6,
      1e6,
    );

    expect(latex).toContain("不存在");
    expect(latex).not.toContain("1000000");
  });
});
