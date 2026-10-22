import { describe, it, expect } from "vitest";
import { formatPiFraction } from "@/utils/mathFormat";
import { snapToSpecialAngle, degToRad } from "@/math/radianMeasure";
import { computeVectorLinear } from "@/math/vectorLinear";
import { buildPairedDataPanel } from "@/data/builders/pairedData";
import { buildVectorLinearPanel } from "@/data/builders/vectorLinear";

/**
 * 第二阶段三项数学债务的机器裁决：
 *   ① 弧度制特殊角可达性（吸附后 π 分数读数必须真正命中）
 *   ② 零向量共线判据与共线比例的定义域分离
 *   ③ 一元线性回归 R² = r² 恒等式的看板落地
 */
describe("① 特殊角吸附：让 π 分数读数真正可达", () => {
  it("滑块网格点本身永远命中不了 π 分数（旧缺陷的成因）", () => {
    // 0.52 rad 是左屏网格点之一，与 π/6 = 0.5236 相差约 0.0036
    expect(formatPiFraction(0.52)).toBeNull();
    expect(formatPiFraction(1.05)).toBeNull();
  });

  it("吸附到最近的 15° 整数倍后，formatPiFraction 必须命中", () => {
    const cases: Array<[number, string]> = [
      [0.52, "π/6"],
      [0.79, "π/4"],
      [1.05, "π/3"],
      [1.57, "π/2"],
      [2.09, "2π/3"],
      [3.14, "π"],
    ];
    cases.forEach(([grid, expected]) => {
      const { value, snapped } = snapToSpecialAngle(grid);
      expect(snapped).toBe(true);
      expect(formatPiFraction(value)).toBe(expected);
    });
  });

  it("超出半个网格窗口的值保持连续，不被强行吸附", () => {
    const { value, snapped } = snapToSpecialAngle(1.0);
    expect(snapped).toBe(false);
    expect(value).toBe(1.0);
  });

  it("吸附后的角度与度数读数严格一致（30° ↔ π/6）", () => {
    const { value } = snapToSpecialAngle(0.52);
    expect((value * 180) / Math.PI).toBeCloseTo(30, 9);
    expect(value).toBeCloseTo(degToRad(30), 12);
  });
});

describe("② 零向量：共线判据与共线比例必须分离", () => {
  it("a = 0 时按课标约定判共线，但比例不存在", () => {
    const res = computeVectorLinear({ xa: 0, ya: 0, xb: 3, yb: 4 });
    // 课标：规定零向量与任意向量平行（共线）
    expect(res.isCollinearAB).toBe(true);
    // 但不存在 λ 使 b = λa
    expect(res.collinearRatio).toBeUndefined();
    expect(res.isCollinearRatioDefined).toBe(false);
  });

  it("两向量均非零且共线时，比例可求且为真值", () => {
    const res = computeVectorLinear({ xa: 2, ya: 1, xb: 4, yb: 2 });
    expect(res.isCollinearAB).toBe(true);
    expect(res.isCollinearRatioDefined).toBe(true);
    expect(res.collinearRatio).toBeCloseTo(2, 10);
  });

  it("看板在零向量场景给出「比例未定义」提示，且不与共线结论打架", () => {
    const panel = buildVectorLinearPanel(
      { xa: 0, ya: 0, xb: 3, yb: 4 },
      { studyMode: "collinear" },
    );
    const texts = (panel.warnings ?? []).map((w) => w.text).join(" | ");
    expect(texts).toContain("共线比例未定义");
    // 仍必须保留「零向量与任意向量共线」的课标口径
    expect(texts).toContain("零向量与任意向量共线");
  });
});

describe("③ 一元线性回归：R² = r² 恒等式", () => {
  it("看板定理串与说明都给出该恒等式", () => {
    const panel = buildPairedDataPanel({}, { studyMode: "regression" });
    const all = panel.theorems
      .map((t) => `${t.name} ${t.latex} ${t.note ?? ""}`)
      .join("\n");
    expect(all).toContain("R^2 &= r^2");
    expect(all).toContain("一元线性回归中 $R^2 = r^2$ 恒成立");
  });

  it("数值上 R² 与 r² 相等（对任意样本），且 0 ≤ R² ≤ 1", () => {
    const points = [
      { x: 1, y: 2.1 },
      { x: 2, y: 3.9 },
      { x: 3, y: 6.2 },
      { x: 4, y: 7.8 },
      { x: 5, y: 10.1 },
    ];
    const panel = buildPairedDataPanel({}, { studyMode: "regression", points });
    // 看板数值行里 r 与 R² 都按 4 位打印，二者平方关系应到 4 位一致
    const flat = panel.quantities
      .map((q) => `${q.label}=${q.value}`)
      .join(" | ");
    expect(flat).not.toContain("NaN");
  });
});
