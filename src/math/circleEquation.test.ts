import { describe, it, expect } from "vitest";
import {
  solveStandardCircle,
  solveGeneralCircle,
  solveThreePointsCircle,
} from "./circleEquation";

describe("圆的方程纯数学层测试 (circleEquation)", () => {
  it("标准方程与点圆位置关系：正确判定圆外、圆上与圆内", () => {
    // 圆心 (1, 2), 半径 3: (x-1)^2 + (y-2)^2 = 9
    // P1(4, 2) => 距离 3 => 在圆上
    const resOn = solveStandardCircle(1, 2, 3, 4, 2);
    expect(resOn.validity).toBe("valid");
    expect(resOn.positionRelation).toBe("on");
    expect(resOn.generalD).toBe(-2);
    expect(resOn.generalE).toBe(-4);
    expect(resOn.generalF).toBe(1 + 4 - 9); // -4

    // P2(2, 2) => 距离 1 => 在圆内
    const resIn = solveStandardCircle(1, 2, 3, 2, 2);
    expect(resIn.positionRelation).toBe("inside");

    // P3(5, 5) => 距离 5 => 在圆外
    const resOut = solveStandardCircle(1, 2, 3, 5, 5);
    expect(resOut.positionRelation).toBe("outside");
  });

  it("一般方程配方互化：区分实圆、退化点与无实数轨迹", () => {
    // x^2 + y^2 - 4x + 6y - 3 = 0
    // D=-4, E=6, F=-3 => D^2 + E^2 - 4F = 16 + 36 + 12 = 64 > 0 => r = 4, 圆心 (2, -3)
    const resCircle = solveGeneralCircle(-4, 6, -3);
    expect(resCircle.validity).toBe("valid");
    expect(resCircle.center.x).toBeCloseTo(2);
    expect(resCircle.center.y).toBeCloseTo(-3);
    expect(resCircle.radius).toBeCloseTo(4);

    // D=0, E=0, F=0 => 退化点 (0, 0)
    const resPoint = solveGeneralCircle(0, 0, 0);
    expect(resPoint.validity).toBe("degenerate_point");
    expect(resPoint.radius).toBe(0);

    // D=0, E=0, F=4 => 无轨迹 (x^2+y^2=-4)
    const resNoGraph = solveGeneralCircle(0, 0, 4);
    expect(resNoGraph.validity).toBe("no_graph");
  });

  it("分数系数配方：系数与配方结果按分数输出，不落成 0.67 这类机器小数", () => {
    // x² + y² + (2/3)x − (4/3)y + 1/9 = 0 ⇒ Δ_c = 16/9，圆心 (−1/3, 2/3)，r = 2/3
    const res = solveGeneralCircle(2 / 3, -4 / 3, 1 / 9);
    expect(res.validity).toBe("valid");
    expect(res.deltaC).toBeCloseTo(16 / 9);
    expect(res.center.x).toBeCloseTo(-1 / 3);
    expect(res.center.y).toBeCloseTo(2 / 3);
    expect(res.radius).toBeCloseTo(2 / 3);
    expect(res.generalEquationLatex).toBe(
      "x^2 + y^2 + \\frac{2}{3}x - \\frac{4}{3}y + \\frac{1}{9} = 0",
    );
    expect(res.standardEquationLatex).toBe(
      "(x + \\frac{1}{3})^2 + (y - \\frac{2}{3})^2 = \\frac{4}{9}",
    );
  });

  it("整数系数不得出现 toFixed(2) 浮点尾零（回归守卫）", () => {
    // 回归：修复前印出 (x - 2.00)^2 + (y + 3.00)^2 = 16.00
    const res = solveGeneralCircle(-4, 6, -3);
    expect(res.standardEquationLatex).toBe("(x - 2)^2 + (y + 3)^2 = 16");
    expect(res.generalEquationLatex).toBe("x^2 + y^2 - 4x + 6y - 3 = 0");

    // 退化单点分支同步回归：修复前印出 (x - (-2.00))^2 + (y - (3.00))^2 = 0
    const degen = solveGeneralCircle(4, -6, 13);
    expect(degen.validity).toBe("degenerate_point");
    expect(degen.standardEquationLatex).toBe("(x + 2)^2 + (y - 3)^2 = 0");

    // 圆心在坐标轴上时退化为 x^2 / y^2，不写 (x - 0)^2
    const origin = solveGeneralCircle(0, 0, 0);
    expect(origin.standardEquationLatex).toBe("x^2 + y^2 = 0");
  });

  it("待定系数法求圆的方程：准确由三点确定外接圆，并能捕获三点共线退化", () => {
    // 取单位圆上的三点：(1, 0), (0, 1), (-1, 0) => 圆心 (0, 0), 半径 1
    const res = solveThreePointsCircle(
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    );
    expect(res.validity).toBe("valid");
    expect(res.center!.x).toBeCloseTo(0);
    expect(res.center!.y).toBeCloseTo(0);
    expect(res.radius!).toBeCloseTo(1);
    expect(res.D!).toBeCloseTo(0);
    expect(res.E!).toBeCloseTo(0);
    expect(res.F!).toBeCloseTo(-1);

    // 三点共线退化：(0, 0), (1, 1), (2, 2)
    const resCollinear = solveThreePointsCircle(
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    );
    expect(resCollinear.validity).toBe("collinear");
    expect(resCollinear.isCollinear).toBe(true);
  });

  it("标准式与三点式一律不得出现 toFixed(2) 浮点尾零（回归守卫）", () => {
    // standard 模式默认预设 a=0,b=0,r=3：修复前印出 `x^2 + y^2 - 9.00 = 0`
    const std = solveStandardCircle(0, 0, 3, 3, 0);
    expect(std.generalEquationLatex).toBe("x^2 + y^2 - 9 = 0");
    expect(std.standardEquationLatex).toBe("x^2 + y^2 = 9");

    // 半整数参数保留小数，不强行转分数（标准模式的 a,b,r 是滑块选定的几何量）
    const half = solveStandardCircle(2.5, -1.5, 0.5, 2.5, -1);
    expect(half.generalEquationLatex).toBe("x^2 + y^2 - 5x + 3y + 8.25 = 0");
    expect(half.standardEquationLatex).toBe("(x - 2.5)^2 + (y + 1.5)^2 = 0.25");

    // threePoints 模式：修复前 D,E,F 被 toFixed(2) 污染成 `- 8.00x - 2.00y + 12.00`
    const tri = solveThreePointsCircle(
      { x: 2, y: 2 },
      { x: 5, y: 3 },
      { x: 3, y: -1 },
    );
    expect(tri.standardEquationLatex).toBe("(x - 4)^2 + (y - 1)^2 = 5");
    expect(tri.generalEquationLatex).toBe("x^2 + y^2 - 8x - 2y + 12 = 0");
  });

  it("三点式的分数解按分数输出（待定系数法的真实形态）", () => {
    // A(1,0), B(2,1), C(0,2) ⇒ D = -5/3, E = -7/3, F = 2/3；外心 (5/6, 7/6)，R² = 25/18
    const res = solveThreePointsCircle(
      { x: 1, y: 0 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
    );
    expect(res.validity).toBe("valid");
    expect(res.D!).toBeCloseTo(-5 / 3);
    expect(res.E!).toBeCloseTo(-7 / 3);
    expect(res.F!).toBeCloseTo(2 / 3);
    expect(res.center!.x).toBeCloseTo(5 / 6);
    expect(res.center!.y).toBeCloseTo(7 / 6);
    expect(res.generalEquationLatex).toBe(
      "x^2 + y^2 - \\frac{5}{3}x - \\frac{7}{3}y + \\frac{2}{3} = 0",
    );
    expect(res.standardEquationLatex).toBe(
      "(x - \\frac{5}{6})^2 + (y - \\frac{7}{6})^2 = \\frac{25}{18}",
    );
  });
});
