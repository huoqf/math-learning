import { describe, it, expect } from "vitest";
import { isPointInCircle, calculateSetMathState } from "./set";

describe("set - 集合与常用逻辑纯数学计算", () => {
  it("点与集合包含关系判断", () => {
    const circleA = { x: 0, y: 0, r: 2 };
    expect(isPointInCircle({ x: 1, y: 1 }, circleA)).toBe(true);
    expect(isPointInCircle({ x: 2, y: 0 }, circleA)).toBe(true); // 边界
    expect(isPointInCircle({ x: 2.1, y: 0 }, circleA)).toBe(false);
  });

  it("集合子集与充要条件逻辑判断", () => {
    // 1. A 包含于 B (A ⊂ B) => p 是 q 的充分不必要条件
    const setA = { x: 0, y: 0, r: 1 };
    const setB = { x: 0, y: 0, r: 3 };
    const stateAInB = calculateSetMathState(setA, setB, { x: 0.5, y: 0 });

    expect(stateAInB.relation).toBe("contained_A_in_B");
    expect(stateAInB.logicType).toBe("sufficient_not_necessary");
    expect(stateAInB.isPointInA).toBe(true);
    expect(stateAInB.isPointInB).toBe(true);

    // 2. A 与 B 相等 (A = B) => p 是 q 的充要条件
    const stateEqual = calculateSetMathState(setA, setA, { x: 0, y: 0 });
    expect(stateEqual.relation).toBe("equal");
    expect(stateEqual.logicType).toBe("sufficient_and_necessary");

    // 3. A 与 B 相交但不包含 => 既不充分也不必要条件
    const setC = { x: 2, y: 0, r: 2 }; // d = 2 < 1 + 2 = 3
    const stateIntersect = calculateSetMathState(setA, setC, { x: 0, y: 0 });
    expect(stateIntersect.relation).toBe("intersect");
    expect(stateIntersect.logicType).toBe("neither");

    // 4. A 为空集 (r=0) => 充分不必要条件 (空集是任何集合的子集)
    const setEmpty = { x: 0, y: 0, r: 0 };
    const stateEmpty = calculateSetMathState(setEmpty, setB, { x: 0, y: 0 });
    expect(stateEmpty.relation).toBe("empty_A");
    expect(stateEmpty.logicType).toBe("sufficient_not_necessary");
    expect(stateEmpty.warningMessage).toContain("空集");
  });
});
