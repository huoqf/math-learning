import { describe, it, expect } from "vitest";
import { calculateLineCircle, calculateBaseLineCircle } from "./lineCircle";

describe("lineCircle - 直线与圆的位置关系及相交弦长", () => {
  it("直线与圆相交：计算圆心距与几何弦长 2*sqrt(r^2 - d^2)", () => {
    // 圆 (x-0)^2 + (y-0)^2 = 25 (r=5)
    // 接口参数 k=斜率, m=y截距 => 直线方程为 y = kx + m
    // k=0, m=-3 => 直线 y = -3，圆心 (0,0) 到直线距离 d = |-3| = 3
    // 弦长 |AB| = 2 * sqrt(r^2 - d^2) = 2 * sqrt(25 - 9) = 8
    const res = calculateLineCircle({
      a: 0,
      b: 0,
      r: 5,
      k: 0,
      m: -3, // y截距 = -3，即直线 y = -3
    });

    expect(res.validity).toBe("valid");
    expect(res.relation).toBe("intersect");
    expect(res.distance).toBeCloseTo(3, 4);
    expect(res.chordLengthGeom).toBeCloseTo(8, 4);
    expect(res.intersections).toHaveLength(2);
    // 两交点为 (-4, -3) 和 (4, -3)
    expect(Math.abs(res.intersections[0].x)).toBeCloseTo(4, 4);
    expect(Math.abs(res.intersections[1].x)).toBeCloseTo(4, 4);
  });

  it("直线与圆相切：d = r，切点唯一且判别式 Delta = 0", () => {
    // 圆心 (0,0), r=5. m=-5 => 直线 y = -5，圆心到直线距离 d = 5 = r
    // 切点为垂足 H = (0, -5)
    const res = calculateLineCircle({
      a: 0,
      b: 0,
      r: 5,
      k: 0,
      m: -5,
    });

    expect(res.relation).toBe("tangent");
    expect(res.distance).toBeCloseTo(5, 4);
    expect(res.intersections).toHaveLength(1);
    expect(res.foot.y).toBeCloseTo(-5, 4);
  });

  it("直线与圆相离：d > r，无交点", () => {
    // m=-8 => 直线 y = -8，圆心到直线距离 d = 8 > r=5
    const res = calculateLineCircle({
      a: 0,
      b: 0,
      r: 5,
      k: 0,
      m: -8, // y = -8，距离 d = 8 > 5
    });

    expect(res.relation).toBe("disjoint");
    expect(res.intersections).toHaveLength(0);
    expect(res.chordLengthGeom).toBe(0);
  });

  it("圆外点 P 切线长与切点弦计算", () => {
    // 圆 (0,0), r=3. 点 P(5, 0)
    // 切线长 L = sqrt(OP^2 - r^2) = sqrt(25 - 9) = 4
    const res = calculateLineCircle({
      a: 0,
      b: 0,
      r: 3,
      k: 0,
      m: 0,
      px: 5,
      py: 0,
    });

    expect(res.tangentLength).toBeCloseTo(4, 4);
    expect(res.tangentPoints).toHaveLength(2);
  });

  it("半径非正退化保护", () => {
    const res = calculateBaseLineCircle(0, 0, -2, 1, 1, 0);
    expect(res.validity).toBe("invalid");
  });
});
