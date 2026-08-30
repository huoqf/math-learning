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

  it("应正确检测基底共线与零向量退化 (D = 0 或模长过小)", () => {
    // 1. 两基向量共线
    const res1 = computeVectorBasis({
      e1x: 2,
      e1y: 4,
      e2x: 1,
      e2y: 2,
      ax: 3,
      ay: 6,
    });
    expect(res1.isCollinear).toBe(true);
    expect(res1.det).toBe(0);

    // 2. 基向量为零向量
    const resZero = computeVectorBasis({
      e1x: 0,
      e1y: 0,
      e2x: 1,
      e2y: 2,
      ax: 3,
      ay: 6,
    });
    expect(resZero.isCollinear).toBe(true);
  });

  it("应正确计算正交基底模式 (thetaDeg 旋转与投影)", () => {
    // a = (3, 4), theta = 90° => orthoE1 = (0, 1), orthoE2 = (-1, 0)
    const res = computeVectorBasis({
      e1x: 1,
      e1y: 0,
      e2x: 0,
      e2y: 1,
      ax: 3,
      ay: 4,
      thetaDeg: 90,
    });

    expect(res.orthoE1.x).toBeCloseTo(0);
    expect(res.orthoE1.y).toBeCloseTo(1);
    expect(res.orthoE2.x).toBeCloseTo(-1);
    expect(res.orthoE2.y).toBeCloseTo(0);
    // a · orthoE1 = (3)(0) + (4)(1) = 4
    expect(res.orthoLambda).toBeCloseTo(4);
    // a · orthoE2 = (3)(-1) + (4)(0) = -3
    expect(res.orthoMu).toBeCloseTo(-3);
  });

  it("应正确计算三点共线与等系数线", () => {
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
    expect(res.eqLineStart).toBeDefined();
    expect(res.eqLineEnd).toBeDefined();
  });

  it("应正确计算三角形重心、中点及定比分点", () => {
    const res = computeVectorBasis({
      e1x: 4,
      e1y: 0,
      e2x: 0,
      e2y: 4,
      ax: 1,
      ay: 1,
      ratioT: 0.25,
    });

    // 中点 M = (2, 2)
    expect(res.midpoint).toEqual({ x: 2, y: 2 });
    // 重心 G = (4/3, 4/3)
    expect(res.centroid.x).toBeCloseTo(4 / 3);
    expect(res.centroid.y).toBeCloseTo(4 / 3);
    // 定比分点 P = 0.75*(4,0) + 0.25*(0,4) = (3, 1)
    expect(res.divisionPoint).toEqual({ x: 3, y: 1 });
  });
});
