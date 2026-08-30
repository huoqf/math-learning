import { describe, it, expect } from "vitest";
import {
  convertFormToGeneral,
  calcPointToLineDistance,
  calcTwoLinesRelation,
  getLineSegmentInBounds,
  getLineProperties,
} from "./lineEquation";

describe("lineEquation - 直线方程与位置关系计算", () => {
  it("五种形式转换为一般式", () => {
    // 1. 点斜式: y - 2 = 3(x - 1) => 3x - y - 1 = 0
    const ptSlope = convertFormToGeneral("pointSlope", { k: 3, x0: 1, y0: 2 });
    expect(ptSlope.isValid).toBe(true);
    expect(ptSlope.A).toBeCloseTo(3);
    expect(ptSlope.B).toBeCloseTo(-1);
    expect(ptSlope.C).toBeCloseTo(-1);

    // 2. 斜截式: y = 2x + 5 => 2x - y + 5 = 0
    const slopeInt = convertFormToGeneral("slopeIntercept", { k: 2, b: 5 });
    expect(slopeInt.isValid).toBe(true);
    expect(slopeInt.A).toBeCloseTo(2);
    expect(slopeInt.B).toBeCloseTo(-1);
    expect(slopeInt.C).toBeCloseTo(5);

    // 3. 两点式: (-1, 0) 与 (1, 2) => 2x - 2y + 2 = 0
    const twoPt = convertFormToGeneral("twoPoint", {
      x1: -1,
      y1: 0,
      x2: 1,
      y2: 2,
    });
    expect(twoPt.isValid).toBe(true);
    // 满足两点代入方程为 0
    expect(twoPt.A * -1 + twoPt.B * 0 + twoPt.C).toBeCloseTo(0);
    expect(twoPt.A * 1 + twoPt.B * 2 + twoPt.C).toBeCloseTo(0);

    // 4. 截距式: x/3 + y/2 = 1 => 2x + 3y - 6 = 0
    const intercept = convertFormToGeneral("intercept", { a: 3, b: 2 });
    expect(intercept.isValid).toBe(true);
    expect(intercept.A).toBeCloseTo(2);
    expect(intercept.B).toBeCloseTo(3);
    expect(intercept.C).toBeCloseTo(-6);

    // 截距式退化: a = 0 时为无效
    const interceptDeg = convertFormToGeneral("intercept", { a: 0, b: 2 });
    expect(interceptDeg.isValid).toBe(false);
  });

  it("点到直线距离与垂足公式", () => {
    // 点 P(1, 2), 直线 3x + 4y - 1 = 0
    // d = |3*1 + 4*2 - 1| / sqrt(9+16) = 10 / 5 = 2
    const res = calcPointToLineDistance(1, 2, 3, 4, -1);
    expect(res.isValid).toBe(true);
    expect(res.distance).toBeCloseTo(2.0, 4);

    // 垂足 Q 代入直线方程必须为 0
    const { foot } = res;
    expect(3 * foot.x + 4 * foot.y - 1).toBeCloseTo(0, 4);
    // PQ 连线与直线方向垂直: (yQ - yP) / (xQ - xP) 应等于 4/3
    const slopePQ = (foot.y - 2) / (foot.x - 1);
    expect(slopePQ).toBeCloseTo(4 / 3, 4);
  });

  it("两直线位置关系：平行、重合、垂直与交点", () => {
    // 1. 平行: L1: 2x - y + 1 = 0, L2: 4x - 2y - 6 = 0
    // L2 化简为标准形 2x - y - 3 = 0
    // 平行线间距：d = |C1/sqrt(A^2+B^2) - C2'/sqrt(A^2+B^2)|
    //   = |1 - (-3)| / sqrt(4+1) = 4/sqrt(5) ≈ 1.78885
    const par = calcTwoLinesRelation(2, -1, 1, 4, -2, -6);
    expect(par.isValid).toBe(true);
    expect(par.type).toBe("parallel");
    expect(par.distance).toBeCloseTo(4 / Math.sqrt(5), 4);
    expect(par.intersection).toBeNull();

    // 2. 垂直: L1: x - 2y = 0, L2: 2x + y - 5 = 0
    const perp = calcTwoLinesRelation(1, -2, 0, 2, 1, -5);
    expect(perp.isValid).toBe(true);
    expect(perp.type).toBe("intersect");
    expect(perp.isPerpendicular).toBe(true);
    expect(perp.angleDeg).toBeCloseTo(90, 4);
    // 交点: x=2, y=1
    expect(perp.intersection?.x).toBeCloseTo(2, 4);
    expect(perp.intersection?.y).toBeCloseTo(1, 4);

    // 3. 重合: L1: x + y - 1 = 0, L2: 2x + 2y - 2 = 0
    const coin = calcTwoLinesRelation(1, 1, -1, 2, 2, -2);
    expect(coin.type).toBe("coincident");
  });

  it("视口边界直线剪裁端点", () => {
    // y = x (即 x - y = 0), 视口 [-5, 5] x [-5, 5]
    const seg = getLineSegmentInBounds(1, -1, 0, {
      xMin: -5,
      xMax: 5,
      yMin: -5,
      yMax: 5,
    });
    expect(seg).not.toBeNull();
    expect(Math.abs(seg!.p1.x - seg!.p1.y)).toBeCloseTo(0, 4);
    expect(Math.abs(seg!.p2.x - seg!.p2.y)).toBeCloseTo(0, 4);
  });

  it("直线属性解析：斜率、倾斜角 (0°, 90°, 钝角) 与截距", () => {
    // 1. 锐角倾斜角：x - y + 1 = 0 => k = 1, alpha = 45°, x截距 = -1, y截距 = 1
    const prop45 = getLineProperties(1, -1, 1);
    expect(prop45.slope).toBeCloseTo(1, 4);
    expect(prop45.inclinationDeg).toBeCloseTo(45, 4);
    expect(prop45.xIntercept).toBeCloseTo(-1, 4);
    expect(prop45.yIntercept).toBeCloseTo(1, 4);

    // 2. 钝角倾斜角：sqrt(3)x + y - 2 = 0 => k = -sqrt(3), alpha = 120°
    const prop120 = getLineProperties(Math.sqrt(3), 1, -2);
    expect(prop120.slope).toBeCloseTo(-Math.sqrt(3), 4);
    expect(prop120.inclinationDeg).toBeCloseTo(120, 4);

    // 3. 垂直线：x = 3 => x - 3 = 0, 斜率不存在, alpha = 90°, y截距不存在
    const prop90 = getLineProperties(1, 0, -3);
    expect(prop90.slope).toBeNull();
    expect(prop90.inclinationDeg).toBeCloseTo(90, 4);
    expect(prop90.xIntercept).toBeCloseTo(3, 4);
    expect(prop90.yIntercept).toBeNull();
  });
});
