import { describe, it, expect } from "vitest";
import { computeVectorBasis } from "./vectorBasis";

describe("computeVectorBasis 纯数学计算层测试", () => {
  it("应准确解算标准基底下的目标向量分解", () => {
    const res = computeVectorBasis({
      e1x: 1,
      e1y: 0,
      e2x: 0,
      e2y: 1,
      ax: 3,
      ay: 4,
    });

    expect(res.isCollinear).toBe(false);
    expect(res.det).toBe(1);
    expect(res.lambda).toBe(3);
    expect(res.mu).toBe(4);
    expect(res.p1).toEqual({ x: 3, y: 0 });
    expect(res.p2).toEqual({ x: 0, y: 4 });
  });

  it("应准确解算斜坐标系下的分解", () => {
    // e1 = (2, 0), e2 = (1, 2), a = (4, 4)
    // 4 = 2*lambda + 1*mu
    // 4 = 0*lambda + 2*mu => mu = 2, lambda = 1
    const res = computeVectorBasis({
      e1x: 2,
      e1y: 0,
      e2x: 1,
      e2y: 2,
      ax: 4,
      ay: 4,
    });

    expect(res.isCollinear).toBe(false);
    expect(res.det).toBe(4);
    expect(res.lambda).toBe(1);
    expect(res.mu).toBe(2);
  });

  it("应正确检测基底共线退化 (D = 0)", () => {
    const res = computeVectorBasis({
      e1x: 2,
      e1y: 4,
      e2x: 1,
      e2y: 2,
      ax: 3,
      ay: 6,
    });

    expect(res.isCollinear).toBe(true);
    expect(res.det).toBe(0);
  });

  it("应正确计算三点共线与权重之和", () => {
    const res = computeVectorBasis({
      e1x: 2,
      e1y: 0,
      e2x: 0,
      e2y: 2,
      ax: 1,
      ay: 1,
      xCoeff: 0.3,
      yCoeff: 0.7,
    });

    expect(res.sumCoeff).toBe(1);
    expect(res.isSumOne).toBe(true);
    expect(res.collinearPoint).toEqual({ x: 0.6, y: 1.4 });
  });

  it("应正确计算三角形重心与中点", () => {
    const res = computeVectorBasis({
      e1x: 3,
      e1y: 0,
      e2x: 0,
      e2y: 3,
      ax: 1,
      ay: 1,
    });

    expect(res.midpoint).toEqual({ x: 1.5, y: 1.5 });
    expect(res.centroid).toEqual({ x: 1, y: 1 });
  });
});
