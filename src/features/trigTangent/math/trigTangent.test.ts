import { describe, it, expect } from "vitest";
import {
  calculateTangentValue,
  calculateUnitCircleTangent,
  getTangentAsymptotes,
  getTangentSymmetryCenters,
  generateTangentSegments,
  checkIntervalAsymptoteFree,
} from "./trigTangent";

describe("trigTangent - 正切函数性质与图象纯数学测试", () => {
  it("calculateTangentValue: 准确计算正切值及渐近线未定义判定", () => {
    // tan(0) = 0
    const val0 = calculateTangentValue(0, 1, 1, 0, 0);
    expect(val0.isValid).toBe(true);
    expect(val0.y).toBeCloseTo(0, 5);

    // tan(pi/4) = 1
    const val45 = calculateTangentValue(Math.PI / 4, 2, 1, 0, 1);
    expect(val45.isValid).toBe(true);
    expect(val45.y).toBeCloseTo(2 * 1 + 1, 5);

    // 渐近线 x = pi/2 附近
    const valAsymp = calculateTangentValue(Math.PI / 2, 1, 1, 0, 0);
    expect(valAsymp.isValid).toBe(false);
    expect(Number.isNaN(valAsymp.y)).toBe(true);

    // omega = 0 退化处理
    const valZeroOmega = calculateTangentValue(1, 1, 0, 0, 3);
    expect(valZeroOmega.isValid).toBe(false);
    expect(valZeroOmega.y).toBe(3);
  });

  it("calculateUnitCircleTangent: 单位圆正切线几何与终边反向延长线", () => {
    const center = { x: 0, y: 0 };
    const r = 1;

    // 1. 第一象限 theta = 45°
    const res45 = calculateUnitCircleTangent(Math.PI / 4, center, r);
    expect(res45.isValid).toBe(true);
    expect(res45.isBackward).toBe(false);
    expect(res45.tX).toBeCloseTo(1, 4);
    expect(res45.tY).toBeCloseTo(1, 4);
    expect(res45.tanValue).toBeCloseTo(1, 4);

    // 2. 第二象限 theta = 135° (cos < 0, 需终边反向延长线交于 x=1)
    const res135 = calculateUnitCircleTangent((3 * Math.PI) / 4, center, r);
    expect(res135.isValid).toBe(true);
    expect(res135.isBackward).toBe(true);
    expect(res135.tX).toBeCloseTo(1, 4);
    expect(res135.tY).toBeCloseTo(-1, 4);
    expect(res135.tanValue).toBeCloseTo(-1, 4);

    // 3. 第三象限 theta = 225° (cos < 0, 反向延长线交于 x=1, y=1)
    const res225 = calculateUnitCircleTangent((5 * Math.PI) / 4, center, r);
    expect(res225.isValid).toBe(true);
    expect(res225.isBackward).toBe(true);
    expect(res225.tanValue).toBeCloseTo(1, 4);

    // 4. 界限角 theta = 90° (垂直渐近线无交点)
    const res90 = calculateUnitCircleTangent(Math.PI / 2, center, r);
    expect(res90.isValid).toBe(false);
    expect(res90.tY).toBe(Infinity);
  });

  it("getTangentAsymptotes: 准确求解视口内所有垂直渐近线", () => {
    // y = tan(2x) 在 [-pi, pi] 内的渐近线：2x = k*pi + pi/2 => x = k*pi/2 + pi/4
    // 在 [-pi, pi] 内应有 -3pi/4, -pi/4, pi/4, 3pi/4 (共 4 条)
    const asymps = getTangentAsymptotes(-Math.PI, Math.PI, 2, 0);
    expect(asymps.length).toBe(4);
    expect(asymps[0].x).toBeCloseTo((-3 * Math.PI) / 4, 4);
    expect(asymps[1].x).toBeCloseTo(-Math.PI / 4, 4);
    expect(asymps[2].x).toBeCloseTo(Math.PI / 4, 4);
    expect(asymps[3].x).toBeCloseTo((3 * Math.PI) / 4, 4);
  });

  it("getTangentSymmetryCenters: 区分零点型与渐近线交点型对称中心", () => {
    // y = tan(x) + 2 在 [-pi, pi]
    // 对称中心 x = k * pi / 2
    // k 偶数: (k*pi, 2) 为零点型对称中心
    // k 奇数: (k*pi + pi/2, 2) 为渐近线交点型对称中心
    const centers = getTangentSymmetryCenters(-Math.PI, Math.PI, 1, 0, 2);
    expect(centers.length).toBeGreaterThanOrEqual(5);

    const zeroCenter = centers.find((c) => Math.abs(c.x) < 1e-4);
    expect(zeroCenter).toBeDefined();
    expect(zeroCenter?.type).toBe("zero");
    expect(zeroCenter?.y).toBe(2);

    const asympCenter = centers.find((c) => Math.abs(c.x - Math.PI / 2) < 1e-4);
    expect(asympCenter).toBeDefined();
    expect(asympCenter?.type).toBe("asymptoteIntersection");
  });

  it("generateTangentSegments: 避免跨渐近线连线，保证每段都在开区间内", () => {
    const segments = generateTangentSegments(-4, 4, 1, 1, 0, 0);
    expect(segments.length).toBeGreaterThan(1);
    for (const seg of segments) {
      expect(seg.length).toBeGreaterThan(1);
      // 验证每段内部 x 递增
      for (let i = 1; i < seg.length; i++) {
        expect(seg[i].x).toBeGreaterThan(seg[i - 1].x);
      }
    }
  });

  it("checkIntervalAsymptoteFree: 高考单调性区间与 omega 上界探究", () => {
    // f(x) = tan(omega * x) 在 [0, pi/3] 单调递增
    // 要求区间无渐近线，即第一条正渐近线 x = pi / (2 * omega) > pi/3 => omega < 1.5
    const resSafe = checkIntervalAsymptoteFree(0, Math.PI / 3, 1.2, 0);
    expect(resSafe.hasAsymptote).toBe(false);
    expect(resSafe.maxAllowedOmega).toBeCloseTo(1.5, 4);

    const resUnsafe = checkIntervalAsymptoteFree(0, Math.PI / 3, 2.0, 0);
    expect(resUnsafe.hasAsymptote).toBe(true);
    expect(resUnsafe.firstAsymptote).toBeCloseTo(Math.PI / 4, 4);
  });
});
