import { describe, it, expect } from "vitest";
import {
  getParabolaBaseInfo,
  getPointOnParabola,
  getFocalRadiusInfo,
  getFocalChordInfo,
  getDirectrixMongeInfo,
} from "../parabola";

describe("parabola math library", () => {
  it("should calculate correct base info for y^2 = 2px (p=2)", () => {
    const base = getParabolaBaseInfo(2, "right");
    expect(base.p).toBe(2);
    expect(base.focus).toEqual({ x: 1, y: 0 });
    expect(base.directrixIsVertical).toBe(true);
    expect(base.directrixConstant).toBe(-1);
    expect(base.latusRectum).toBe(4);
  });

  it("should verify first principle |PF| == d(P, l)", () => {
    const P = getPointOnParabola(4, 2, "right"); // y=4 => x=4^2/4 = 4. P(4,4)
    const radiusInfo = getFocalRadiusInfo(P, 2, "right");
    // F(1,0), P(4,4) => |PF| = sqrt((4-1)^2 + 4^2) = sqrt(9+16) = 5
    // 准线 x = -1 => d(P,l) = 4 - (-1) = 5
    expect(radiusInfo.focalRadius).toBeCloseTo(5);
    expect(radiusInfo.directrixDistance).toBeCloseTo(5);
    expect(radiusInfo.isEqual).toBe(true);
  });

  it("should verify focal chord harmonic sum 1/AF + 1/BF == 2/p", () => {
    const p = 2; // 2/p = 1
    const chordInfo = getFocalChordInfo(60, p, "right"); // 60 deg
    expect(chordInfo.harmonicSum).toBeCloseTo(2 / p, 4);
    expect(chordInfo.midCircle.isTangentToDirectrix).toBe(true);
  });

  it("should verify directrix monge property: QA perp QB & chord AB passes focus F", () => {
    const p = 2;
    const qParam = 3.0; // Q(-1, 3.0)
    const mongeInfo = getDirectrixMongeInfo(qParam, p, "right");
    expect(mongeInfo.isPerpendicular).toBe(true);
    expect(mongeInfo.chordPassesFocus).toBe(true);
  });
});
