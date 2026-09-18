import { describe, it, expect } from "vitest";
import {
  paramDragRange,
  paramDomainRange,
  snapDragValue,
  type BoundMeta,
} from "@/utils/paramClamp";
import type { SceneScale } from "@/hooks/useSceneScale";

/** 构造一个只关心可见范围的最小 SceneScale 桩 */
function mockScale(
  xMin: number,
  xMax: number,
  yMin = -10,
  yMax = 10,
): SceneScale {
  return {
    scaleX: 10,
    scaleY: 10,
    scale: 10,
    originX: 100,
    originY: 100,
    xMin,
    xMax,
    yMin,
    yMax,
  };
}

describe("paramDragRange：参数声明域 ∩ 可见视口", () => {
  const meta: BoundMeta = { min: -6, max: 6 };

  it("视口比声明域宽时，区间收敛到声明域本身", () => {
    expect(paramDragRange(meta, mockScale(-20, 20), "x")).toEqual([-6, 6]);
  });

  it("视口比声明域窄时，区间收敛到可见视口", () => {
    // 可见 x 为 [−8, 12]：左侧视口更早到界、右侧声明域更早到界
    expect(paramDragRange(meta, mockScale(-8, 12), "x")).toEqual([-6, 6]);
    // 可见 x 为 [−4, 3]：两侧都被视口收紧
    expect(paramDragRange(meta, mockScale(-4, 3), "x")).toEqual([-4, 3]);
  });

  it("纵轴同样按轴取值，不会误用横轴边界", () => {
    const scale = mockScale(-8, 12, -4.64, 4.64);
    expect(paramDragRange(meta, scale, "y")).toEqual([-4.64, 4.64]);
    expect(paramDragRange(meta, scale, "x")).toEqual([-6, 6]);
  });

  it("声明域与视口无交集时返回 undefined（退化为不钳制，而非钉死成非法区间）", () => {
    expect(paramDragRange(meta, mockScale(20, 30), "x")).toBeUndefined();
  });

  it("meta 缺失时返回 undefined", () => {
    expect(paramDragRange(undefined, mockScale(-8, 12), "x")).toBeUndefined();
  });
});

describe("paramDomainRange：派生系数只守声明域", () => {
  it("直接返回声明域，不与视口求交", () => {
    const coeff: BoundMeta = { min: -1.5, max: 2.5 };
    // 视口比声明域宽也不放宽
    expect(paramDomainRange(coeff)).toEqual([-1.5, 2.5]);
    // 视口比声明域窄也不收紧（系数与屏幕坐标不同轴，无从求交）
    expect(paramDomainRange(coeff)).toEqual([-1.5, 2.5]);
  });

  it("meta 缺失时返回 undefined", () => {
    expect(paramDomainRange(undefined)).toBeUndefined();
  });
});

describe("snapDragValue：先取整后钳制", () => {
  it("按步长取整到滑块刻度", () => {
    expect(snapDragValue(1.24, 0.5)).toBe(1);
    expect(snapDragValue(1.26, 0.5)).toBe(1.5);
    expect(snapDragValue(4.330127, 0.01)).toBe(4.33);
  });

  it("钳制越界值", () => {
    expect(snapDragValue(99, 0.5, [-6, 6])).toBe(6);
    expect(snapDragValue(-99, 0.5, [-6, 6])).toBe(-6);
  });

  it("取整后仍在区间内（顺序正确时不会出现'取整溢出'）", () => {
    // 视口上限 5.6、步长 0.5：若先钳制后取整，5.6 会取整成 6.0 越界
    const range: [number, number] = [-5.6, 5.6];
    expect(snapDragValue(5.55, 0.5, range)).toBe(5.5);
    expect(snapDragValue(5.6, 0.5, range)).toBe(5.5);
    expect(snapDragValue(-5.6, 0.5, range)).toBe(-5.5);
  });

  it("step ≤ 0 表示不取整，仅钳制", () => {
    expect(snapDragValue(2.71828, 0, [-1, 1])).toBe(1);
    expect(snapDragValue(0.71828, 0, [-1, 1])).toBe(0.71828);
  });
});
