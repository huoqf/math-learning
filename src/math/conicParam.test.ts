import { describe, it, expect } from "vitest";
import {
  calculateLineConicParam,
  calculateEllipseParam,
  calculateParabolaYParam,
  calculateLineYFormConic,
} from "./conicParam";

describe("calculateEllipseParam - 椭圆三角参数设点与辅助角最值", () => {
  it("参数角 θ = 0° 时，点 P 为右顶点 (a, 0)", () => {
    const res = calculateEllipseParam(4, 3, 0);
    expect(res.P.x).toBeCloseTo(4);
    expect(res.P.y).toBeCloseTo(0);
    expect(res.Paux.x).toBeCloseTo(4);
    expect(res.Paux.y).toBeCloseTo(0);
  });

  it("参数角 θ = 90° 时，点 P 为上顶点 (0, b)", () => {
    const res = calculateEllipseParam(4, 3, 90);
    expect(res.P.x).toBeCloseTo(0);
    expect(res.P.y).toBeCloseTo(3);
    expect(res.Paux.x).toBeCloseTo(0);
    expect(res.Paux.y).toBeCloseTo(4);
  });

  it("切线截距三角形面积极值：当 θ = 45° 时取得最小值 S_min = a * b", () => {
    const a = 4;
    const b = 3;
    const res45 = calculateEllipseParam(a, b, 45);
    expect(res45.triangleArea).toBeCloseTo(12, 4);

    const res30 = calculateEllipseParam(a, b, 30);
    expect(res30.triangleArea).toBeCloseTo(24 / Math.sqrt(3), 4);
    expect(res30.triangleArea).toBeGreaterThan(res45.triangleArea);
  });

  it("椭圆动点到目标直线 x - y - 6 = 0 的距离极值求解", () => {
    // a = 4, b = 3, 直线 x - y - 6 = 0
    // A=1, B=-1, C=-6
    // R = sqrt((1*4)^2 + (-1*3)^2) = sqrt(16+9) = 5
    // denom = sqrt(1^2 + (-1)^2) = sqrt(2)
    // maxDist = (6 + 5) / sqrt(2) = 11 / sqrt(2) ≈ 7.778
    // minDist = (6 - 5) / sqrt(2) = 1 / sqrt(2) ≈ 0.707
    const res = calculateEllipseParam(4, 3, 0, { A: 1, B: -1, C: -6 });
    expect(res.maxDist).toBeCloseTo(11 / Math.SQRT2, 3);
    expect(res.minDist).toBeCloseTo(1 / Math.SQRT2, 3);
  });
});

describe("calculateParabolaYParam - 抛物线纵坐标单参数设点模型", () => {
  it("标准抛物线 y^2 = 4x (p=2)，给定两点纵坐标 y1=2, y2=-2", () => {
    const p = 2;
    const res = calculateParabolaYParam(p, 2, -2);
    expect(res.valid).toBe(true);
    // A(1, 2), B(1, -2)
    expect(res.pointA.x).toBeCloseTo(1);
    expect(res.pointA.y).toBeCloseTo(2);
    expect(res.pointB.x).toBeCloseTo(1);
    expect(res.pointB.y).toBeCloseTo(-2);

    // 割线垂直于 x 轴：y1 + y2 = 0
    expect(res.slope).toBe(Infinity);
    // x 截距: - y1 y2 / (2p) = -(-4)/4 = 1 = p/2，过焦点！
    expect(res.xIntercept).toBeCloseTo(1);
    expect(res.isFocusChord).toBe(true);
    // 通径长度 = 2p = 4
    expect(res.chordLength).toBeCloseTo(4);
    expect(res.focusChordLength).toBeCloseTo(1 + 1 + 2); // x1 + x2 + p = 4
  });

  it("割线斜率满足 k = 2p / (y1 + y2)", () => {
    const p = 2;
    const y1 = 4; // x1 = 16/4 = 4
    const y2 = 2; // x2 = 4/4 = 1
    const res = calculateParabolaYParam(p, y1, y2);
    expect(res.valid).toBe(true);
    // k = 2*2 / (4+2) = 4/6 = 2/3
    expect(res.slope).toBeCloseTo(2 / 3);
    // 弦中点 M: xM = (4+1)/2 = 2.5, yM = 3
    expect(res.pointM.x).toBeCloseTo(2.5);
    expect(res.pointM.y).toBeCloseTo(3);
  });
});

describe("calculateLineYFormConic - 设线 x = my + n 与椭圆联立降维模型", () => {
  it("水平对称弦：m=0, n=0 过原点水平割线", () => {
    const a = 4;
    const b = 3;
    // x = 0*y + 0 => x = 0 (垂直割线沿 y 轴)
    const res = calculateLineYFormConic(a, b, 0, 0);
    expect(res.valid).toBe(true);
    // y 交点为 -b 和 b (-3, 3)
    expect(res.y1).toBeCloseTo(-3);
    expect(res.y2).toBeCloseTo(3);
    expect(res.chordLength).toBeCloseTo(6);
    expect(res.pointM.x).toBeCloseTo(0);
    expect(res.pointM.y).toBeCloseTo(0);
  });

  it("过定点割线与韦达定理和/积", () => {
    const a = 4;
    const b = 2;
    const m = 1;
    const n = 1; // x = y + 1
    const res = calculateLineYFormConic(a, b, m, n);
    expect(res.valid).toBe(true);
    // A = b^2 m^2 + a^2 = 4*1 + 16 = 20
    // B = 2 b^2 m n = 2*4*1*1 = 8
    // C = b^2 (n^2 - a^2) = 4 * (1 - 16) = -60
    expect(res.A).toBeCloseTo(20);
    expect(res.B).toBeCloseTo(8);
    expect(res.C).toBeCloseTo(-60);
    // y1 + y2 = -8/20 = -0.4
    expect(res.ySum).toBeCloseTo(-0.4);
    // y1 * y2 = -60/20 = -3
    expect(res.yProd).toBeCloseTo(-3);
    // 弦长公式 |AB| = sqrt(1+m^2) * |y1 - y2|
    const expectedDiff = Math.sqrt(-0.4 * -0.4 - 4 * -3); // sqrt(0.16 + 12) = sqrt(12.16)
    expect(res.yDiffAbs).toBeCloseTo(expectedDiff);
    expect(res.chordLength).toBeCloseTo(Math.SQRT2 * expectedDiff);
  });

  it("无交点状态判别式 Δ < 0 校验", () => {
    // x = 10 割线超出椭圆 a=3
    const res = calculateLineYFormConic(3, 2, 0, 10);
    expect(res.valid).toBe(false);
    expect(res.deltaY).toBeLessThan(0);
  });

  it("精确相切边界状态：a=4, b=3, m=1, n=5 时 Δ_y = 0", () => {
    const res = calculateLineYFormConic(4, 3, 1, 5);
    expect(res.valid).toBe(true);
    // n^2 = 25, b^2 m^2 + a^2 = 9*1 + 16 = 25 => deltaY = 0
    expect(res.deltaY).toBeCloseTo(0);
    // 重根 y1 = y2 = -B / (2A) = -2*9*1*5 / (2*25) = -90 / 50 = -1.8
    expect(res.y1).toBeCloseTo(-1.8);
    expect(res.y2).toBeCloseTo(-1.8);
    expect(res.chordLength).toBeCloseTo(0);
  });

  it("精确焦点弦预设验证：p=2, y1=4, y2=-1 时 y1*y2 = -4 = -p^2", () => {
    const res = calculateParabolaYParam(2, 4, -1);
    expect(res.valid).toBe(true);
    expect(res.isFocusChord).toBe(true);
    // 割线过焦点 F(1, 0)
    expect(res.xIntercept).toBeCloseTo(1);
    // 弦中点 M 坐标
    expect(res.pointM.x).toBeCloseTo((16 / 4 + 1 / 4) / 2); // 4.25 / 2 = 2.125
    expect(res.pointM.y).toBeCloseTo(1.5);
  });
});

describe("兼容测试：calculateLineConicParam", () => {
  it("水平直线经过椭圆中心 (0, 0)，交点参数为 -a 和 a", () => {
    const res = calculateLineConicParam(0, 0, 0, 1, 4, 3);
    expect(res.valid).toBe(true);
    expect(res.t1).toBeCloseTo(-4);
    expect(res.t2).toBeCloseTo(4);
    expect(res.chordLength).toBeCloseTo(8);
  });
});
