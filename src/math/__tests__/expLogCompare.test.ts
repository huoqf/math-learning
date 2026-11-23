import { describe, expect, it } from "vitest";
import {
  calcCompareTriplet,
  calcLogOperations,
  safeLogBase,
} from "../expLogCompare";

describe("expLogCompare 纯数学计算", () => {
  it("对数运算律与换底公式精确成立", () => {
    const res = calcLogOperations(2, 3, 5, 3);
    expect(res.validity).toBe("ok");
    expect(res.logAM + res.logAN).toBeCloseTo(res.logAMN, 8);
    expect(res.logAM - res.logAN).toBeCloseTo(res.logADiv, 8);
    expect(res.changeBaseCheck).toBeCloseTo(res.logAM, 8);
  });

  it("底数为 1 退化保护", () => {
    expect(safeLogBase(1, 5)).toBeNaN();
    const res = calcLogOperations(1, 2, 3, 2);
    expect(res.validity).toBe("degenerate_base");
  });

  it("0 与 1 搭桥及 1/2 搭桥大小排序正确", () => {
    const bridge01 = calcCompareTriplet("bridge01", 2, 0.3);
    expect(bridge01.sortedAsc.map((i) => i.symbol)).toEqual(["C", "B", "A"]);

    const bridgeHalf = calcCompareTriplet("bridgeHalf", 2, 0.5);
    expect(bridgeHalf.sortedAsc.map((i) => i.symbol)).toEqual(["B", "A", "C"]);

    const mono = calcCompareTriplet("monotoneCross", 2, 0.4);
    expect(mono.sortedAsc.map((i) => i.symbol)).toEqual(["A", "B", "C"]);
  });

  it("自由模式下整数底数与采样点格式不带浮点尾零", () => {
    const freeInt = calcCompareTriplet("free", 2.0, 1.0);
    expect(freeInt.validity).toBe("ok");
    expect(freeInt.items[0].exprLatex).toBe("2^{1}");
    expect(freeInt.items[1].exprLatex).toBe("\\log_{2} 1");
    expect(freeInt.items[2].exprLatex).toBe("1^{0.5}");
  });
});
