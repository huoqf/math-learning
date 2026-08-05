import { describe, it, expect } from "vitest";
import {
  calcMeans,
  getSemicircleGeometry,
  getSquareProofGeometry,
  getNikeExtremaGeometry,
} from "../features/inequalityBasic/math/inequalityBasic";

describe("基本不等式 (Inequality Basic) 纯数学计算测试", () => {
  it("应该正确计算四大均值及其关系 (HM <= GM <= AM <= QM)", () => {
    const { am, gm, hm, qm, isEqual } = calcMeans(4, 2);

    expect(am).toBe(3); // (4+2)/2 = 3
    expect(gm).toBeCloseTo(Math.sqrt(8), 5); // ~2.8284
    expect(hm).toBeCloseTo(16 / 6, 5); // 2.6667
    expect(qm).toBeCloseTo(Math.sqrt(10), 5); // ~3.1622
    expect(isEqual).toBe(false);

    // 均值不等式链验证
    expect(hm).toBeLessThan(gm);
    expect(gm).toBeLessThan(am);
    expect(am).toBeLessThan(qm);
  });

  it("当 a = b 时，四大均值取等", () => {
    const { am, gm, hm, qm, isEqual, diffAmGm } = calcMeans(3, 3);

    expect(am).toBe(3);
    expect(gm).toBe(3);
    expect(hm).toBe(3);
    expect(qm).toBe(3);
    expect(isEqual).toBe(true);
    expect(diffAmGm).toBeCloseTo(0, 6);
  });

  it("半圆几何模型中射影定理与坐标算法导出 GM", () => {
    const geo = getSemicircleGeometry(4, 1);
    // 直径 5, 半径 R = 2.5
    expect(geo.radius).toBe(2.5);

    // 切分点 P: AP=4, PB=1 => px = -2.5 + 4 = 1.5
    expect(geo.pointP.x).toBe(1.5);

    // 垂线交点 C 的 y 坐标即为 GM = sqrt(4*1) = 2
    expect(geo.pointC.y).toBe(2);
  });

  it("赵爽弦图面积关系 (a+b)^2 = 4ab + (a-b)^2", () => {
    const sq = getSquareProofGeometry(4, 2);
    expect(sq.totalArea).toBe(36); // (4+2)^2 = 36
    expect(sq.fourRectsArea).toBe(32); // 4 * 4 * 2 = 32
    expect(sq.innerSquareArea).toBe(4); // (4-2)^2 = 4
    expect(sq.totalArea).toBe(sq.fourRectsArea + sq.innerSquareArea);
  });

  it("对勾函数在 x = sqrt(k) 处取得最小值 2*sqrt(k)", () => {
    const nike = getNikeExtremaGeometry(4, 2); // k = 4, x = 2
    expect(nike.minX).toBe(2);
    expect(nike.minY).toBe(4);
    expect(nike.isAtMin).toBe(true);
    expect(nike.currentSum).toBe(4);
  });
});
