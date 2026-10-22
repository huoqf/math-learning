import { describe, it, expect } from "vitest";
import {
  analyzeSubsetHierarchy,
  calculateSetMathState,
  type SetCircle,
} from "@/math/set";
import { buildSetPanel } from "@/data/builders/set";

const circle = (x: number, y: number, r: number): SetCircle => ({ x, y, r });

/**
 * 第三阶段 G6：集合的包含 / 真子集层级。
 * 除了层级判定本身，这里还锁死一条被修掉的错误结论：
 * 两集合外切时 A ∩ B 恰含一个切点，是**非空**的，不能判成 ∅。
 */
describe("集合包含层级（⊆ 与 ⊊ 的分界）", () => {
  it("A ⊊ B：子集成立，真子集也成立，B 不是 A 的子集", () => {
    const res = analyzeSubsetHierarchy(circle(0, 0, 1), circle(0, 0, 3));
    expect(res.relationKind).toBe("a_proper_subset_b");
    expect(res.aSubsetB).toBe(true);
    expect(res.aProperSubsetB).toBe(true);
    expect(res.bSubsetA).toBe(false);
    expect(res.bProperSubsetA).toBe(false);
    expect(res.equalityHolds).toBe(false);
    expect(res.isIntersectionEmpty).toBe(false);
    expect(res.relationLatex).toContain("\\subsetneq");
  });

  it("内切是包含的边界情形：仍然构成真子集（等号只在 ⊆ 上成立）", () => {
    // d + rA = 1 + 2 = 3 = rB，两圆内切
    const res = analyzeSubsetHierarchy(circle(0, 0, 1), circle(3, 0, 4));
    expect(res.aSubsetB).toBe(true);
    expect(res.aProperSubsetB).toBe(true);
    expect(res.equalityHolds).toBe(false);
  });

  it("A = B：互相包含，但都不是真子集", () => {
    const res = analyzeSubsetHierarchy(circle(0, 0, 2), circle(0, 0, 2));
    expect(res.relationKind).toBe("equal");
    expect(res.aSubsetB).toBe(true);
    expect(res.bSubsetA).toBe(true);
    expect(res.aProperSubsetB).toBe(false);
    expect(res.bProperSubsetA).toBe(false);
    expect(res.equalityHolds).toBe(true);
  });

  it("两集合均为空集：A = B = ∅，互相包含且相等，不构成真包含", () => {
    const res = analyzeSubsetHierarchy(circle(0, 0, 0), circle(1, 1, 0));
    expect(res.relationKind).toBe("equal");
    expect(res.equalityHolds).toBe(true);
    expect(res.aProperSubsetB).toBe(false);
    expect(res.isIntersectionEmpty).toBe(true);
  });

  it("单侧为空集：空集是非空集合的真子集", () => {
    const res = analyzeSubsetHierarchy(circle(0, 0, 0), circle(0, 0, 2));
    expect(res.aSubsetB).toBe(true);
    expect(res.aProperSubsetB).toBe(true);
    expect(res.bSubsetA).toBe(false);
    expect(res.isIntersectionEmpty).toBe(true);
  });

  it("相交但互不包含：两个方向都不是子集", () => {
    const res = analyzeSubsetHierarchy(circle(-1, 0, 2), circle(1, 0, 2));
    expect(res.relationKind).toBe("overlap");
    expect(res.aSubsetB).toBe(false);
    expect(res.bSubsetA).toBe(false);
    expect(res.isIntersectionEmpty).toBe(false);
  });

  it("相离：两个方向都不是子集，且交集为空集", () => {
    const res = analyzeSubsetHierarchy(circle(-5, 0, 1), circle(5, 0, 1));
    expect(res.relationKind).toBe("disjoint");
    expect(res.isIntersectionEmpty).toBe(true);
    expect(res.relationLatex).toContain("\\varnothing");
  });
});

describe("外切：交集是单点，绝不能判成空集（旧实现缺陷）", () => {
  it("d = rA + rB 时关系被判为外切，交集非空", () => {
    const state = calculateSetMathState(circle(-1, 0, 1), circle(1, 0, 1), {
      x: 0,
      y: 0,
    });
    expect(state.distance).toBeCloseTo(2, 10);
    expect(state.relation).toBe("tangent_external");
    // 切点 (0,0) 同时属于 A 与 B，是交集唯一的元素
    expect(state.isPointInA).toBe(true);
    expect(state.isPointInB).toBe(true);
    expect(state.logicRelationLatex).toContain("\\{M\\}");
    expect(state.logicRelationLatex).not.toContain("A \\cap B = \\varnothing");

    const sub = analyzeSubsetHierarchy(circle(-1, 0, 1), circle(1, 0, 1));
    expect(sub.relationKind).toBe("tangent_external");
    expect(sub.isIntersectionEmpty).toBe(false);
    expect(sub.aSubsetB).toBe(false);
    expect(sub.bSubsetA).toBe(false);
  });

  it("相离仍判空集：修复不能把「不相交」一起改掉", () => {
    const state = calculateSetMathState(circle(-4, 0, 1), circle(4, 0, 1), {
      x: 0,
      y: 0,
    });
    expect(state.relation).toBe("separate");
    expect(state.logicRelationLatex).toContain("\\varnothing");
  });
});

describe("子集层级看板（anim-set-subset）", () => {
  const panel = (params: Record<string, number>) =>
    buildSetPanel(params, { animId: "anim-set-subset" });
  const pick = (data: ReturnType<typeof panel>, needle: string) => {
    const hit = data.quantities.find((q) => q.label.includes(needle));
    expect(hit, `未找到包含「${needle}」的看板行`).toBeTruthy();
    return String(hit!.value);
  };

  it("真子集场景：看板给出 ⊆ 成立、⊊ 成立、B ⊆ A 不成立", () => {
    const data = panel({ xA: 0, yA: 0, rA: 1, xB: 0, yB: 0, rB: 3 });
    expect(pick(data, "A \\subseteq B")).toBe("成立");
    expect(pick(data, "A \\subsetneq B")).toBe("成立");
    expect(pick(data, "B \\subseteq A")).toBe("不成立 / 不成立");
    expect(pick(data, "层级定位")).toBe("A ⊊ B（A 是 B 的真子集）");
  });

  it("相等场景：看板必须说明「不是真子集」", () => {
    const data = panel({ xA: 0, yA: 0, rA: 2, xB: 0, yB: 0, rB: 2 });
    expect(pick(data, "A \\subsetneq B")).toBe("不成立");
    expect(pick(data, "层级定位")).toBe("A = B（互相包含）");
  });

  it("外切场景给出「交集非空」警示，避免写成 ∅", () => {
    const data = panel({ xA: -1, yA: 0, rA: 1, xB: 1, yB: 0, rB: 1 });
    const warnText = (data.warnings ?? []).map((w) => w.text).join(" | ");
    expect(warnText).toContain("交集非空");
    expect(warnText).toContain("\\{M\\}");
  });

  it("推导链三步齐全，最后一步必须落在「再加一个不等于」上", () => {
    const data = panel({ xA: 0, yA: 0, rA: 1, xB: 0, yB: 0, rB: 3 });
    const steps = data.reasoningSteps ?? [];
    expect(steps).toHaveLength(3);
    expect(steps[0].detail).toContain("r_A + r_B");
    expect(steps[1].latex).toContain("d + r_A");
    expect(steps[2].latex).toContain("A \\subsetneq B");
  });

  it("有限集计数公式必须标明只对有限集成立，不得误导到无限集", () => {
    const data = panel({ xA: 0, yA: 0, rA: 1, xB: 0, yB: 0, rB: 3 });
    const counting = data.theorems.find((t) => t.name.includes("有限集"))!;
    expect(counting.latex).toContain("2^n - 1");
    expect(counting.latex).toContain("2^n - 2");
    expect(counting.note).toContain("只对有限集成立");
  });
});
