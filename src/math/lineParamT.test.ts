import { describe, it, expect } from "vitest";
import {
  getLinePoint,
  getNonStandardLinePoint,
  getConicFocus,
  calcLineConicIntersection,
  getEllipseBMax,
  normalizeEllipseAxes,
} from "./lineParamT";

describe("直线参数方程 t 的几何意义与圆锥曲线割线定理 (lineParamT)", () => {
  it("getLinePoint: 准确计算标准参数方程下动点坐标", () => {
    // P0(1, 2), alpha = 60°, t = 4
    // x = 1 + 4 * cos(60°) = 1 + 2 = 3
    // y = 2 + 4 * sin(60°) = 2 + 2*sqrt(3) ≈ 5.4641
    const pt = getLinePoint(1, 2, 60, 4);
    expect(pt.x).toBeCloseTo(3, 4);
    expect(pt.y).toBeCloseTo(2 + 2 * Math.sqrt(3), 4);
  });

  it("getNonStandardLinePoint: 准确计算非标准参数方程动点坐标", () => {
    const pt = getNonStandardLinePoint(1, 1, 45, 2, Math.SQRT2);
    // x = 1 + sqrt(2) * 2 * cos(45°) = 1 + 2 = 3
    expect(pt.x).toBeCloseTo(3, 4);
    expect(pt.y).toBeCloseTo(3, 4);
  });

  it("直线与圆: 割线定理 / 圆的方幂 |PA|*|PB| = |t1*t2| = d^2 - R^2", () => {
    // 圆 x^2 + y^2 = 9 (R=3), 定点 P(5, 0), 沿 x 轴方向 alpha = 180° (指向圆心)
    // 直线: x = 5 - t, y = 0
    // (5 - t)^2 = 9 => 5 - t = 3 or -3 => t1 = 2, t2 = 8
    const res = calcLineConicIntersection(5, 0, 180, "circle", { R: 3 });
    expect(res.hasIntersection).toBe(true);
    expect(res.t1).toBeCloseTo(2, 4);
    expect(res.t2).toBeCloseTo(8, 4);
    expect(res.chordLength).toBeCloseTo(6, 4); // 2R = 6
    expect(res.segmentProduct).toBeCloseTo(16, 4); // d^2 - R^2 = 25 - 9 = 16
    expect(res.tM).toBeCloseTo(5, 4);
    expect(res.pointM?.x).toBeCloseTo(0, 4); // 弦中点即圆心 (0, 0)
    expect(res.pointM?.y).toBeCloseTo(0, 4);
  });

  it("直线与椭圆: 韦达定理与中点参数 tM = (t1 + t2)/2", () => {
    // 椭圆 x^2/16 + y^2/4 = 1 (a=4, b=2), 定点 P(0, 0), alpha = 0° (x 轴)
    // t1 = -4, t2 = 4
    const res = calcLineConicIntersection(0, 0, 0, "ellipse", { a: 4, b: 2 });
    expect(res.hasIntersection).toBe(true);
    expect(res.t1).toBeCloseTo(-4, 4);
    expect(res.t2).toBeCloseTo(4, 4);
    expect(res.chordLength).toBeCloseTo(8, 4);
    expect(res.tSum).toBeCloseTo(0, 4);
    expect(res.tM).toBeCloseTo(0, 4);
    expect(res.pointA?.x).toBeCloseTo(-4, 4);
    expect(res.pointB?.x).toBeCloseTo(4, 4);
  });

  it("直线与双曲线: 渐近线方向退化为一元一次方程", () => {
    // 双曲线 x^2/4 - y^2/4 = 1 (等轴双曲线 a=2, b=2, 渐近线斜率 k = 1 => alpha = 45°)
    // 穿过定点 P(0, 0) 且平行于渐近线
    const res = calcLineConicIntersection(0, 0, 45, "hyperbola", {
      a: 2,
      b: 2,
    });
    // A = cos^2(45)/4 - sin^2(45)/4 = 0 => isDegenerateLine = true
    expect(res.isDegenerateLine).toBe(true);
    expect(res.hasIntersection).toBe(false);
  });

  it("直线与抛物线: 焦点弦倒数和性质 1/|t1| + 1/|t2| = 2/p", () => {
    // 抛物线 y^2 = 2px (p=2 => y^2 = 4x, 焦点 F(1, 0))
    // 直线过焦点 F(1, 0), 倾斜角 alpha = 60°
    // 直线参数方程: x = 1 + t cos(60°) = 1 + t/2, y = t sin(60°) = t * sqrt(3)/2
    // 代入抛物线: 3/4 t^2 = 4 (1 + t/2) = 4 + 2t => 3/4 t^2 - 2t - 4 = 0
    // 3t^2 - 8t - 16 = 0 => (3t + 4)(t - 4) = 0 => t1 = -4/3, t2 = 4
    const res = calcLineConicIntersection(1, 0, 60, "parabola", { p: 2 });
    expect(res.hasIntersection).toBe(true);
    expect(res.t1).toBeCloseTo(-4 / 3, 3);
    expect(res.t2).toBeCloseTo(4, 3);
    expect(res.chordLength).toBeCloseTo(4 - -4 / 3, 3); // 16/3
    // 高考抛物线焦点弦倒数和定值 1/|AF| + 1/|BF| = 1/|t1| + 1/|t2| = 3/4 + 1/4 = 1.0 = 2/p
    expect(res.reciprocalSum).toBeCloseTo(2 / 2, 3);
  });

  it("getConicFocus: 三类圆锥曲线的焦点坐标须与各页预设的定点 P₀ 一致", () => {
    // 抛物线 y² = 2px，p = 2 → F(1, 0)：与"线段倒数和"模型抛物线预设 x0 = 1.0 对齐
    expect(getConicFocus("parabola", { p: 2 })).toEqual({ x: 1, y: 0 });

    // 椭圆 a=3, b=2 → c = √5 ≈ 2.236：与预设 x0 = 2.24 对齐（误差 0.004 < 0.05 容差）
    const ellipseF = getConicFocus("ellipse", { a: 3, b: 2 });
    expect(ellipseF?.x).toBeCloseTo(Math.sqrt(5), 6);
    expect(ellipseF?.y).toBe(0);

    // 双曲线 a=2, b=1.5 → c = √(4+2.25) = 2.5：与预设 x0 = 2.5 严格对齐
    expect(getConicFocus("hyperbola", { a: 2, b: 1.5 })).toEqual({
      x: 2.5,
      y: 0,
    });

    // 圆无焦点
    expect(getConicFocus("circle", { R: 3 })).toBeNull();

    // 非法参数不得造出假焦点（椭圆须 a > b > 0；p ≤ 0 无实焦点）
    expect(getConicFocus("ellipse", { a: 2, b: 2 })).toBeNull();
    expect(getConicFocus("ellipse", { a: 0, b: 1 })).toBeNull();
    expect(getConicFocus("parabola", { p: 0 })).toBeNull();
  });

  it("椭圆半轴契约：合法输入原样返回，越界输入收缩 b 且保持 a > b > 0", () => {
    // 合法态必须零改动（对现有页面零影响）
    expect(normalizeEllipseAxes(3, 2)).toEqual({ a: 3, b: 2 });
    expect(normalizeEllipseAxes(3.5, 2)).toEqual({ a: 3.5, b: 2 });

    // 越界态：b ≥ a 时保 a、把 b 收缩到 a − ε
    const r = normalizeEllipseAxes(1.5, 3.49);
    expect(r.a).toBeCloseTo(1.5, 6);
    expect(r.b).toBeCloseTo(1.49, 6);
    expect(r.a).toBeGreaterThan(r.b);
    expect(r.b).toBeGreaterThan(0);

    // 恰好 b = a（退化）也要被拆开
    const degen = normalizeEllipseAxes(2, 2);
    expect(degen.a).toBeCloseTo(2, 6);
    expect(degen.b).toBeCloseTo(1.99, 6);
    expect(degen.a).toBeGreaterThan(degen.b);
  });

  it("椭圆半轴契约：幂等，且能兜住非正 / 非有限的 a 与 b", () => {
    // 幂等：归一化结果再归一化必须不变（保证数学层与场景层重复调用不会互相漂移）
    const once = normalizeEllipseAxes(1.5, 3.49);
    expect(normalizeEllipseAxes(once.a, once.b)).toEqual(once);

    // a ≤ 0 / NaN：抬到 2ε，保证 rx > 0（SVG 中 rx ≤ 0 会让 <ellipse> 静默不渲染）
    for (const badA of [0, -3, Number.NaN]) {
      const r = normalizeEllipseAxes(badA, 5);
      expect(r.a).toBeCloseTo(0.02, 6);
      expect(r.a).toBeGreaterThan(0);
      expect(r.a).toBeGreaterThan(r.b);
      expect(r.b).toBeGreaterThan(0);
    }

    // b ≤ 0 / NaN：抬到 ε
    expect(normalizeEllipseAxes(3, 0).b).toBeCloseTo(0.01, 6);
    expect(normalizeEllipseAxes(3, -2).b).toBeCloseTo(0.01, 6);
    expect(normalizeEllipseAxes(3, Number.NaN).b).toBeCloseTo(2.99, 6);
  });

  it("椭圆半轴契约：getEllipseBMax 是钳制上限的单一事实来源（含滑块 floor）", () => {
    // 默认 floor = ε：数学层用它保证 b > 0
    expect(getEllipseBMax(3)).toBeCloseTo(2.99, 6);
    expect(getEllipseBMax(1.5)).toBeCloseTo(1.49, 6);
    expect(getEllipseBMax(0.005)).toBeCloseTo(0.01, 6);
    // 滑块的 floor = 控件最小值，避免出现 min > max 的非法区间
    expect(getEllipseBMax(1.5, 1.0)).toBeCloseTo(1.49, 6);
    expect(getEllipseBMax(0.5, 1.0)).toBeCloseTo(1.0, 6);
  });

  it("椭圆半轴契约：数学层确实按归一化后的半轴计算（a、b 分别经 x / y 截距验证）", () => {
    // alpha = 0° 沿 x 轴：t2 = a；alpha = 90° 沿 y 轴：t2 = b
    const outOfRange = { a: 1.5, b: 3.49 };
    const { a: sa, b: sb } = normalizeEllipseAxes(outOfRange.a, outOfRange.b);

    const alongX = calcLineConicIntersection(0, 0, 0, "ellipse", outOfRange);
    const alongY = calcLineConicIntersection(0, 0, 90, "ellipse", outOfRange);

    // a 未被改动，故 x 截距仍为 1.5
    expect(alongX.t2).toBeCloseTo(sa, 6);
    // b 被收缩到 1.49，故 y 截距为 1.49 而非越界的 3.49
    expect(alongY.t2).toBeCloseTo(sb, 6);
    expect(alongY.t2).toBeLessThan(outOfRange.b);

    // 合法态下不得有任何改动（零回归）
    const legal = calcLineConicIntersection(0, 0, 90, "ellipse", {
      a: 3,
      b: 2,
    });
    expect(legal.t2).toBeCloseTo(2, 6);
  });
});
