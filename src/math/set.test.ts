import { describe, it, expect } from "vitest";
import {
  isPointInCircle,
  getCircleDistance,
  calculateSetMathState,
} from "./set";

describe("set - 集合与常用逻辑纯数学计算", () => {
  describe("isPointInCircle 与 getCircleDistance 基础几何函数", () => {
    it("点与圆边界及内外部判断", () => {
      const circle = { x: 0, y: 0, r: 2 };
      expect(isPointInCircle({ x: 1, y: 1 }, circle)).toBe(true); // 内部
      expect(isPointInCircle({ x: 2, y: 0 }, circle)).toBe(true); // 边界
      expect(isPointInCircle({ x: 0, y: -2 }, circle)).toBe(true); // 边界
      expect(isPointInCircle({ x: 2.01, y: 0 }, circle)).toBe(false); // 外部
    });

    it("零半径与负半径圆退化测试", () => {
      expect(isPointInCircle({ x: 0, y: 0 }, { x: 0, y: 0, r: 0 })).toBe(false);
      expect(isPointInCircle({ x: 0, y: 0 }, { x: 0, y: 0, r: -1 })).toBe(
        false,
      );
    });

    it("计算两圆圆心距", () => {
      const c1 = { x: 0, y: 0, r: 2 };
      const c2 = { x: 3, y: 4, r: 1 };
      expect(getCircleDistance(c1, c2)).toBeCloseTo(5, 5);
      expect(getCircleDistance(c1, c1)).toBe(0);
    });
  });

  describe("集合位置关系与充分必要条件逻辑判定", () => {
    it("1. A ⊊ B: p 是 q 的充分不必要条件", () => {
      const setA = { x: 0, y: 0, r: 1 };
      const setB = { x: 0, y: 0, r: 3 };
      const state = calculateSetMathState(setA, setB, { x: 0.5, y: 0 });

      expect(state.relation).toBe("contained_A_in_B");
      expect(state.logicType).toBe("sufficient_not_necessary");
      expect(state.logicRelationLatex).toContain("A \\subsetneq B");
      expect(state.logicDescription).toContain("充分不必要条件");
      expect(state.isPointInA).toBe(true);
      expect(state.isPointInB).toBe(true);
    });

    it("2. B ⊊ A: p 是 q 的必要不充分条件", () => {
      const setA = { x: 0, y: 0, r: 4 };
      const setB = { x: 1, y: 0, r: 1 };
      const state = calculateSetMathState(setA, setB, { x: 3, y: 0 });

      expect(state.relation).toBe("contained_B_in_A");
      expect(state.logicType).toBe("necessary_not_sufficient");
      expect(state.logicRelationLatex).toContain("B \\subsetneq A");
      expect(state.logicDescription).toContain("必要不充分条件");
      expect(state.isPointInA).toBe(true);
      expect(state.isPointInB).toBe(false);
    });

    it("3. A = B: p 是 q 的充要条件（非空同心同径）", () => {
      const setA = { x: 1, y: 2, r: 2.5 };
      const setB = { x: 1, y: 2, r: 2.5 };
      const state = calculateSetMathState(setA, setB, { x: 1, y: 2 });

      expect(state.relation).toBe("equal");
      expect(state.logicType).toBe("sufficient_and_necessary");
      expect(state.logicRelationLatex).toContain("A = B");
      expect(state.logicDescription).toContain("充要条件");
    });

    it("4. A = ∅ 且 B = ∅: 双空集相等，p 是 q 的充要条件", () => {
      const setA = { x: 0, y: 0, r: 0 };
      const setB = { x: 3, y: 3, r: 0 };
      const state = calculateSetMathState(setA, setB, { x: 0, y: 0 });

      expect(state.relation).toBe("equal");
      expect(state.logicType).toBe("sufficient_and_necessary");
      expect(state.warningMessage).toContain("均为空集");
    });

    it("5. A 为空集且 B 非空 (A = ∅ ⊊ B): 充分不必要条件", () => {
      const setEmptyA = { x: 0, y: 0, r: 0 };
      const setB = { x: 0, y: 0, r: 2 };
      const state = calculateSetMathState(setEmptyA, setB, { x: 0, y: 0 });

      expect(state.relation).toBe("empty_A");
      expect(state.logicType).toBe("sufficient_not_necessary");
      expect(state.warningMessage).toContain("集合 A 为空集");
    });

    it("6. B 为空集且 A 非空 (B = ∅ ⊊ A): 必要不充分条件", () => {
      const setA = { x: 0, y: 0, r: 2 };
      const setEmptyB = { x: 0, y: 0, r: 0 };
      const state = calculateSetMathState(setA, setEmptyB, { x: 0, y: 0 });

      expect(state.relation).toBe("empty_B");
      expect(state.logicType).toBe("necessary_not_sufficient");
      expect(state.warningMessage).toContain("集合 B 为空集");
    });

    it("7. A 与 B 相交但不包含: 既不充分也不必要条件", () => {
      const setA = { x: 0, y: 0, r: 2 };
      const setB = { x: 2.5, y: 0, r: 2 }; // d = 2.5, rA + rB = 4
      const state = calculateSetMathState(setA, setB, { x: 0, y: 0 });

      expect(state.relation).toBe("intersect");
      expect(state.logicType).toBe("neither");
      expect(state.logicRelationLatex).toContain(
        "A \\cap B \\neq \\varnothing",
      );
    });

    it("8. A 与 B 相离: 既不充分也不必要条件", () => {
      const setA = { x: -3, y: 0, r: 1 };
      const setB = { x: 3, y: 0, r: 1 }; // d = 6 > 1 + 1 = 2
      const state = calculateSetMathState(setA, setB, { x: 0, y: 0 });

      expect(state.relation).toBe("separate");
      expect(state.logicType).toBe("neither");
      expect(state.logicRelationLatex).toContain("A \\cap B = \\varnothing");
    });
  });
});
