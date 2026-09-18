import { describe, it, expect } from "vitest";
import { formatPiFraction } from "./mathFormat";

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
