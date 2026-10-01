import { describe, it, expect } from "vitest";
import { formatMathRational, formatPiFraction } from "./mathFormat";

describe("mathFormat - π 分数倍格式化", () => {
  it("高中常用角一律输出分数 π 形式，杜绝 0.17π 这类形式漏解", () => {
    expect(formatPiFraction(0)).toBe("0");
    expect(formatPiFraction(Math.PI / 6)).toBe("π/6");
    expect(formatPiFraction(Math.PI / 4)).toBe("π/4");
    expect(formatPiFraction(Math.PI / 3)).toBe("π/3");
    expect(formatPiFraction(Math.PI / 2)).toBe("π/2");
    expect(formatPiFraction(Math.PI)).toBe("π");
    expect(formatPiFraction((2 * Math.PI) / 3)).toBe("2π/3");
    expect(formatPiFraction((5 * Math.PI) / 6)).toBe("5π/6");
    expect(formatPiFraction((3 * Math.PI) / 2)).toBe("3π/2");
    expect(formatPiFraction(2 * Math.PI)).toBe("2π");
  });

  it("负角与超出主干区间的精确角同样正确", () => {
    expect(formatPiFraction(-Math.PI / 6)).toBe("-π/6");
    expect(formatPiFraction(-(3 * Math.PI) / 2)).toBe("-3π/2");
    // 精确表示不丢分：π/6 + 6π = 37π/6（通解集写成「π/6 + 2kπ」由调用方自行拆分主值）
    expect(formatPiFraction(Math.PI / 6 + 6 * Math.PI)).toBe("37π/6");
  });

  it("非 π 分数倍返回 null，不强行套用", () => {
    expect(formatPiFraction(0.5)).toBeNull();
    expect(formatPiFraction(1.234)).toBeNull();
    expect(formatPiFraction(Number.NaN)).toBeNull();
    expect(formatPiFraction(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("分母上限可放宽", () => {
    expect(formatPiFraction(Math.PI / 18)).toBeNull(); // 10° 不在默认 12 分母内
    expect(formatPiFraction(Math.PI / 18, 36)).toBe("π/18");
  });
});

describe("mathFormat - 有理数最简分数格式化", () => {
  it("整数与 0 直接输出十进制，不凭空加 \\frac（对既有整数参数零副作用）", () => {
    expect(formatMathRational(0)).toBe("0");
    expect(formatMathRational(3)).toBe("3");
    expect(formatMathRational(-4)).toBe("-4");
    expect(formatMathRational(16)).toBe("16");
    expect(formatMathRational(-0)).toBe("0");
  });

  it("真分数输出最简分数 LaTeX，负号写在第 1 层（与卷面一致）", () => {
    expect(formatMathRational(2 / 3)).toBe("\\frac{2}{3}");
    expect(formatMathRational(-1 / 3)).toBe("-\\frac{1}{3}");
    expect(formatMathRational(-4 / 9)).toBe("-\\frac{4}{9}");
    expect(formatMathRational(16 / 9)).toBe("\\frac{16}{9}");
  });

  it("自动约分：0.25 → 1/4，不输出 4/16 这类未化简写法", () => {
    expect(formatMathRational(0.25)).toBe("\\frac{1}{4}");
    expect(formatMathRational(1.5)).toBe("\\frac{3}{2}");
    expect(formatMathRational(0.5)).toBe("\\frac{1}{2}");
  });

  it("经浮点运算得到的分数（如配方半径 √(16/9)/2）仍能识别", () => {
    const deltaC = (2 / 3) ** 2 + (-4 / 3) ** 2 - 4 * (1 / 9); // = 16/9
    expect(formatMathRational(deltaC)).toBe("\\frac{16}{9}");
    const radius = Math.sqrt(deltaC) / 2; // = 2/3
    expect(formatMathRational(radius)).toBe("\\frac{2}{3}");
    expect(formatMathRational(radius * radius)).toBe("\\frac{4}{9}");
  });

  it("无理数与非法值返回 null，绝不强行套分数", () => {
    expect(formatMathRational(Math.PI)).toBeNull();
    expect(formatMathRational(Math.SQRT2)).toBeNull();
    expect(formatMathRational(Math.sqrt(7) / 2)).toBeNull();
    expect(formatMathRational(Number.NaN)).toBeNull();
    expect(formatMathRational(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("分母上限可收紧，避免把 1.2345 之类误判成分数", () => {
    expect(formatMathRational(1 / 97)).toBe("\\frac{1}{97}");
    expect(formatMathRational(1 / 97, 50)).toBeNull();
    expect(formatMathRational(0.6667)).toBeNull(); // 滑块值 0.6667 ≠ 2/3，不得当作 2/3
  });
});
