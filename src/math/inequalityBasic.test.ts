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

  it("半圆几何模型中射影定理与坐标算法导出 GM 与 HM", () => {
    const geo = getSemicircleGeometry(4, 1);
    // 直径 5, 半径 R = 2.5 (即 AM)
    expect(geo.radius).toBe(2.5);
    expect(geo.segmentOCLen).toBe(2.5);

    // 切分点 P: AP=4, PB=1 => px = -2.5 + 4 = 1.5
    expect(geo.pointP.x).toBe(1.5);
    expect(geo.pointP.y).toBe(0);

    // 垂线交点 C 的 y 坐标即为 GM = sqrt(4*1) = 2
    expect(geo.pointC.x).toBe(1.5);
    expect(geo.pointC.y).toBe(2);
    expect(geo.segmentPCLen).toBe(2);

    // 垂足 D 落在 OC 上，CD 长度为调和平均数 HM = 2*4*1/(4+1) = 1.6
    expect(geo.segmentCDLen).toBeCloseTo(1.6, 5);

    // 验证点 D 坐标及 |C - D| 距离精确等于 HM
    const cdDist = Math.hypot(
      geo.pointC.x - geo.pointD.x,
      geo.pointC.y - geo.pointD.y,
    );
    expect(cdDist).toBeCloseTo(1.6, 5);
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

  it("高考高频：常数代换（乘1法）与积定和最小/和定积最大极值定理", () => {
    // 1. 和定积最大：已知 a + b = 6 (a,b > 0)，则 ab <= (6/2)^2 = 9，当且仅当 a = b = 3 取等
    const a1 = 3,
      b1 = 3;
    const { am: am1, gm: gm1 } = calcMeans(a1, b1);
    expect(am1).toBe(3);
    expect(gm1 * gm1).toBe(9);

    // 2. 积定和最小：已知 xy = 4 (x,y > 0)，则 x + y >= 2*sqrt(4) = 4，当且仅当 x = y = 2 取等
    const x1 = 2,
      y1 = 2;
    const { am: am2 } = calcMeans(x1, y1);
    expect(2 * am2).toBe(4);

    // 3. 常数代换法：已知 x + y = 1 (x,y > 0)，求 1/x + 4/y 的最小值
    // (x + y)(1/x + 4/y) = 1 + 4x/y + y/x + 4 >= 5 + 2*sqrt(4) = 9
    // 取等条件 4x/y = y/x => y = 2x => x = 1/3, y = 2/3
    const xMin = 1 / 3;
    const yMin = 2 / 3;
    expect(xMin + yMin).toBeCloseTo(1, 6);
    const sumVal = 1 / xMin + 4 / yMin;
    expect(sumVal).toBeCloseTo(9, 6);
  });
});
