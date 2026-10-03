import { describe, it, expect } from "vitest";
import {
  TAU,
  DEG_PER_RAD,
  degToRad,
  radToDeg,
  arcLength,
  sectorArea,
  sectorPerimeter,
  radianMeasure,
  SPECIAL_ANGLES,
} from "./radianMeasure";
import { formatPiFraction, formatPiFractionLatex } from "../utils/mathFormat";

describe("radianMeasure - 弧度制、弧长与扇形面积", () => {
  it("角度与弧度互化：π rad = 180°，1 rad ≈ 57.2958°", () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 10);
    expect(radToDeg(Math.PI)).toBeCloseTo(180, 10);
    expect(DEG_PER_RAD).toBeCloseTo(57.29577951, 6);

    // 特殊角双向一致
    expect(degToRad(30)).toBeCloseTo(Math.PI / 6, 10);
    expect(degToRad(45)).toBeCloseTo(Math.PI / 4, 10);
    expect(degToRad(60)).toBeCloseTo(Math.PI / 3, 10);
    expect(degToRad(360)).toBeCloseTo(TAU, 10);

    // 互化往返恒等
    for (const deg of [0, 17, 90, 123.5, 359]) {
      expect(radToDeg(degToRad(deg))).toBeCloseTo(deg, 9);
    }
  });

  it("弧度的定义：弧长等于半径时圆心角恰为 1 rad", () => {
    // 取 r = 2，则 l = 2 时 α 必须恰为 1
    expect(radianMeasure(2, 2)).toBeCloseTo(1, 12);
    // α = 1 rad ⇒ 弧长 = 半径
    expect(arcLength(1, 3.7)).toBeCloseTo(3.7, 12);
    // r ≤ 0 的退化输入必须安全返回 0，不得产生 Infinity / NaN
    expect(radianMeasure(5, 0)).toBe(0);
    expect(radianMeasure(5, -2)).toBe(0);
  });

  it("弧长公式 l = |α| r 与扇形面积 S = ½|α| r² = ½ l r", () => {
    // 单位圆上 α = π/2 ⇒ 弧长 = π/2
    expect(arcLength(Math.PI / 2, 1)).toBeCloseTo(Math.PI / 2, 12);

    // r = 2, α = π/3 ⇒ l = 2π/3，S = ½ · (π/3) · 4 = 2π/3
    const l = arcLength(Math.PI / 3, 2);
    const s = sectorArea(Math.PI / 3, 2);
    expect(l).toBeCloseTo((2 * Math.PI) / 3, 12);
    expect(s).toBeCloseTo((2 * Math.PI) / 3, 12);

    // S = ½ l r 与 S = ½|α| r² 必须恒等（扇形面积的两条常用公式）
    for (const [alpha, r] of [
      [Math.PI / 6, 1.5],
      [Math.PI, 0.5],
      [TAU, 3],
      [0.3, 2.4],
    ] as const) {
      expect(sectorArea(alpha, r)).toBeCloseTo(
        0.5 * arcLength(alpha, r) * r,
        12,
      );
    }

    // 负角取绝对值（弧长与面积为非负量）
    expect(arcLength(-Math.PI / 4, 2)).toBeCloseTo(
      arcLength(Math.PI / 4, 2),
      12,
    );
    expect(sectorArea(-Math.PI / 4, 2)).toBeCloseTo(
      sectorArea(Math.PI / 4, 2),
      12,
    );
  });

  it("扇形周长 = 2r + l，且整圆情形退化为圆周长 2πr", () => {
    expect(sectorPerimeter(Math.PI / 2, 2)).toBeCloseTo(4 + Math.PI, 10);
    // α = 2π 时扇形即整圆：周长 = 两条半径 + 整圆弧长 2πr（扇形含两条半径边，故不是圆周长）
    expect(sectorPerimeter(TAU, 3)).toBeCloseTo(2 * 3 + TAU * 3, 10);
  });

  it("π 的倍数读数：能写成 kπ/n 时用分数形式，否则交由调用方按小数显示", () => {
    expect(formatPiFraction(Math.PI / 3)).toBe("π/3");
    expect(formatPiFraction(Math.PI / 2)).toBe("π/2");
    expect(formatPiFraction(Math.PI)).toBe("π");
    expect(formatPiFraction((3 * Math.PI) / 2)).toBe("3π/2");
    expect(formatPiFraction(TAU)).toBe("2π");
    expect(formatPiFraction(-Math.PI / 4)).toBe("-π/4");
    // 非 π 的有理倍（如 1.0）在 12 分母内无法表达 ⇒ 返回 null，交由调用方按小数显示
    expect(formatPiFraction(1.0)).toBeNull();
  });

  it("SPECIAL_ANGLES 对照表的度值与弧度字面量必须自洽", () => {
    for (const item of SPECIAL_ANGLES) {
      const rad = degToRad(item.deg);
      // 表中每个角都必须能被 SSOT 读数函数还原（否则字面量与度值不符）
      const text = formatPiFraction(rad);
      const latex = formatPiFractionLatex(rad);
      expect(text).not.toBeNull();
      // 纯文本读数槽（右屏 value）绝不接受反斜杠 LaTeX，也不允许退化成 \approx 近似声明
      expect(text).not.toContain("\\");
      expect(latex).not.toContain("\\approx");
      if (item.deg === 0) {
        expect(text).toBe("0");
        expect(latex).toBe("0");
      }
    }
    // 表格必须覆盖 0° → 360° 的常用特殊角
    const degs = SPECIAL_ANGLES.map((a) => a.deg);
    expect(degs).toContain(0);
    expect(degs).toContain(90);
    expect(degs).toContain(180);
    expect(degs).toContain(360);
  });

  it("优角与扇形面积单调性：α 从 0 增至 2π 面积严格单调递增，周长与弧长无截断", () => {
    const r = 2;
    let prevArea = 0;
    for (let deg = 30; deg <= 360; deg += 30) {
      const rad = degToRad(deg);
      const s = sectorArea(rad, r);
      expect(s).toBeGreaterThan(prevArea);
      prevArea = s;
    }
  });
});
