import { describe, it, expect } from "vitest";
import { getSolutionIntervals } from "./inequalityIntervals";

describe("getSolutionIntervals", () => {
  it("two roots, a>0, >: outside roots", () => {
    const res = getSolutionIntervals(1, 0, -4, ">", -10, 10, [-2, 2]);
    expect(res).toHaveLength(2);
    expect(res[0].x2).toBeCloseTo(-2);
    expect(res[0].isLeftInfinity).toBe(true);
    expect(res[1].x1).toBeCloseTo(2);
    expect(res[1].isRightInfinity).toBe(true);
  });

  it("two roots, a>0, <: between roots", () => {
    const res = getSolutionIntervals(1, 0, -4, "<", -10, 10, [-2, 2]);
    expect(res).toHaveLength(1);
    expect(res[0].x1).toBeCloseTo(-2);
    expect(res[0].x2).toBeCloseTo(2);
  });

  it("two roots, a<0, >: between roots", () => {
    const res = getSolutionIntervals(-1, 0, 4, ">", -10, 10, [-2, 2]);
    expect(res).toHaveLength(1);
    expect(res[0].x1).toBeCloseTo(-2);
    expect(res[0].x2).toBeCloseTo(2);
  });

  it("two roots, a<0, <: outside roots", () => {
    const res = getSolutionIntervals(-1, 0, 4, "<", -10, 10, [-2, 2]);
    expect(res).toHaveLength(2);
  });

  it("one root, a>0, >: two rays", () => {
    const res = getSolutionIntervals(1, -2, 1, ">", -10, 10, [1]);
    expect(res).toHaveLength(2);
    expect(res[0].x2).toBeCloseTo(1);
    expect(res[0].isLeftInfinity).toBe(true);
    expect(res[1].x1).toBeCloseTo(1);
    expect(res[1].isRightInfinity).toBe(true);
  });

  it("zero roots, a>0, >: entire line", () => {
    const res = getSolutionIntervals(1, 0, 1, ">", -10, 10, []);
    expect(res).toHaveLength(1);
    expect(res[0].isLeftInfinity).toBe(true);
    expect(res[0].isRightInfinity).toBe(true);
  });

  it("a=0, b>0, >: right ray", () => {
    const res = getSolutionIntervals(0, 2, -4, ">", -10, 10, [2]);
    expect(res).toHaveLength(1);
    expect(res[0].x1).toBeCloseTo(2);
    expect(res[0].isRightInfinity).toBe(true);
  });

  it("a=0, b=0, c>0, >: entire line", () => {
    const res = getSolutionIntervals(0, 0, 1, ">", -10, 10, []);
    expect(res).toHaveLength(1);
    expect(res[0].isLeftInfinity).toBe(true);
    expect(res[0].isRightInfinity).toBe(true);
  });

  it("a=0, b=0, c<0, <: entire line", () => {
    const res = getSolutionIntervals(0, 0, -1, "<", -10, 10, []);
    expect(res).toHaveLength(1);
    expect(res[0].isLeftInfinity).toBe(true);
    expect(res[0].isRightInfinity).toBe(true);
  });
});
