import { describe, it, expect } from "vitest";
import {
  calcFivePoints,
  calcTrigProperties,
  getTransformPathSteps,
  formatPiValue,
} from "./trigTransform";

describe("trigTransform math utils", () => {
  it("formats pi values correctly", () => {
    expect(formatPiValue(Math.PI / 2)).toBe("\\frac{\\pi}{2}");
    expect(formatPiValue(-Math.PI / 3)).toBe("-\\frac{\\pi}{3}");
    expect(formatPiValue(0)).toBe("0");
  });

  it("calculates five points correctly for A=1, omega=1, phi=0, k=0", () => {
    const pts = calcFivePoints(1, 1, 0, 0);
    expect(pts).toHaveLength(5);
    expect(pts[0].x).toBeCloseTo(0);
    expect(pts[0].y).toBeCloseTo(0);
    expect(pts[1].x).toBeCloseTo(Math.PI / 2);
    expect(pts[1].y).toBeCloseTo(1);
    expect(pts[2].x).toBeCloseTo(Math.PI);
    expect(pts[2].y).toBeCloseTo(0);
    expect(pts[3].x).toBeCloseTo((3 * Math.PI) / 2);
    expect(pts[3].y).toBeCloseTo(-1);
    expect(pts[4].x).toBeCloseTo(2 * Math.PI);
    expect(pts[4].y).toBeCloseTo(0);
  });

  it("calculates trig properties correctly", () => {
    const props = calcTrigProperties(2, 2, Math.PI / 4, 1);
    expect(props.amplitude).toBe(2);
    expect(props.period).toBeCloseTo(Math.PI);
    expect(props.yMax).toBe(3);
    expect(props.yMin).toBe(-1);
  });

  it("generates transform path steps for both pathways", () => {
    const path1 = getTransformPathSteps(2, 2, Math.PI / 3, 0, "shift-first");
    const path2 = getTransformPathSteps(2, 2, Math.PI / 3, 0, "stretch-first");

    expect(path1).toHaveLength(5);
    expect(path2).toHaveLength(5);
    // 步骤 4 的最终函数在两个路径下结果应该完全一致
    const xTest = 0.5;
    expect(path1[4].fn(xTest)).toBeCloseTo(path2[4].fn(xTest));
  });
});
