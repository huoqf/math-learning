import { describe, it, expect } from "vitest";
import { fitViewRange, isPointInsideRange } from "@/math/viewRange";

/**
 * `fitViewRange` 单测。覆盖四条契约：
 * ① 关键点必落框内（含 padding 后仍在内侧，不贴边）；
 * ② Floor Clamp —— 参数正常时绝不反向收缩（这是最容易写错的一条）；
 * ③ 非数/无穷防御 —— 剔除而不污染，全剔除时回退默认；
 * ④ 结果数值稳定（无 NaN / 无 -0 / 保留位数）。
 */
describe("fitViewRange 基本拟合", () => {
  it("点全在默认范围内时原样返回基准视口，不收缩", () => {
    const r = fitViewRange([{ x: 1, y: 1 }]);
    expect(r.xRange).toEqual([-6, 6]);
    expect(r.yRange).toEqual([-4.5, 4.5]);
    expect(r.expanded).toBe(false);
  });

  it("点靠近原点也不会把视口缩成 [−0.3, 0.3]（Floor Clamp 的核心）", () => {
    const r = fitViewRange([
      { x: 0, y: 0 },
      { x: 0.1, y: -0.1 },
    ]);
    expect(r.xRange).toEqual([-6, 6]);
    expect(r.yRange).toEqual([-4.5, 4.5]);
  });

  it("点超出基准范围时扩张到「数据 + padding」", () => {
    // /quadratic 报告用例：a=2,b=4,c=−4 ⇒ 顶点 (−1,−6)
    const r = fitViewRange([{ x: -1, y: -6 }]);
    expect(r.expanded).toBe(true);
    expect(r.xRange).toEqual([-6, 6]); // x 方向仍在基准内
    // y 下界必须低于 −6，且至少再留 minPadding
    expect(r.yRange[0]).toBeLessThan(-6);
    expect(r.yRange[1]).toBe(4.5);
  });

  it("关键点必定落在返回的 range 内，且与边界保留安全距离", () => {
    const pts = [
      { x: 25, y: 5 }, // /conic-parabola: p=0.5, tP=5 ⇒ P=(25,5)
      { x: -3, y: -10 },
    ];
    const r = fitViewRange(pts);
    pts.forEach((p) => {
      expect(isPointInsideRange(p, r), `点 (${p.x},${p.y}) 出框`).toBe(true);
    });
    // 不允许紧贴：上下界都应比数据外扩
    expect(r.xRange[1]).toBeGreaterThan(25);
    expect(r.yRange[0]).toBeLessThan(-10);
  });

  it("单点输入仍留有 minPadding，不会退化成零跨度", () => {
    const r = fitViewRange([{ x: 100, y: 100 }]);
    expect(r.xRange[1] - r.xRange[0]).toBeGreaterThan(0);
    expect(r.yRange[1] - r.yRange[0]).toBeGreaterThan(0);
  });

  it("自定义基准视口生效（各页可传自己的默认范围）", () => {
    const r = fitViewRange([{ x: 0, y: 0 }], {
      defaultXRange: [-8, 8],
      defaultYRange: [-3.5, 3.5],
    });
    expect(r.xRange).toEqual([-8, 8]);
    expect(r.yRange).toEqual([-3.5, 3.5]);
  });
});

describe("非数与非有限值防御", () => {
  it("Infinity / -Infinity / NaN 一律剔除，不污染视口", () => {
    const r = fitViewRange([
      { x: 2, y: 3 },
      { x: Infinity, y: 0 }, // 对勾函数 a→0 时的渐近线
      { x: -Infinity, y: 0 },
      { x: 0, y: NaN },
      { x: NaN, y: 0 },
    ]);
    expect(r.droppedCount).toBe(4);
    expect(Number.isFinite(r.xRange[0])).toBe(true);
    expect(Number.isFinite(r.xRange[1])).toBe(true);
    expect(Number.isFinite(r.yRange[0])).toBe(true);
    expect(Number.isFinite(r.yRange[1])).toBe(true);
    // 只剩 (2,3)，仍在基准范围内
    expect(r.xRange).toEqual([-6, 6]);
    expect(r.yRange).toEqual([-4.5, 4.5]);
  });

  it("点集全为无效值时平滑回退默认范围，不抛错", () => {
    const r = fitViewRange([
      { x: Infinity, y: NaN },
      { x: NaN, y: -Infinity },
    ]);
    expect(r.droppedCount).toBe(2);
    expect(r.xRange).toEqual([-6, 6]);
    expect(r.yRange).toEqual([-4.5, 4.5]);
    expect(r.expanded).toBe(false);
  });

  it("空点集回退默认范围", () => {
    const r = fitViewRange([]);
    expect(r.xRange).toEqual([-6, 6]);
    expect(r.yRange).toEqual([-4.5, 4.5]);
    expect(r.droppedCount).toBe(0);
  });
});

describe("数值稳定性", () => {
  it("结果保留指定小数位，且不出现 -0", () => {
    const r = fitViewRange([{ x: 0.04, y: -0.02 }], { precision: 1 });
    [...r.xRange, ...r.yRange].forEach((v) => {
      expect(Number.isFinite(v)).toBe(true);
      expect(Object.is(v, -0), "出现 -0 会让坐标轴标签显示成「-0」").toBe(
        false,
      );
    });
    expect(r.xRange).toEqual([-6, 6]);
  });

  it("极大值组合不会产生 NaN（视口可以很大，但不能坏掉）", () => {
    const r = fitViewRange([
      { x: 1e6, y: -1e6 },
      { x: -1e6, y: 1e6 },
    ]);
    expect(Number.isFinite(r.xRange[0])).toBe(true);
    expect(r.xRange[0]).toBeLessThan(-1e6);
    expect(r.xRange[1]).toBeGreaterThan(1e6);
  });

  it("paddingRatio 可调；无跨度时由 minPadding 兜底", () => {
    // 有跨度：比例生效
    const pair = [
      { x: 20, y: 0 },
      { x: 0, y: 0 },
    ];
    const tight = fitViewRange(pair, { paddingRatio: 0.01 });
    const loose = fitViewRange(pair, { paddingRatio: 0.5 });
    expect(tight.xRange[1]).toBeCloseTo(20.5, 5); // 20×0.01=0.2 < minPadding，被兜住
    expect(loose.xRange[1]).toBeCloseTo(30, 5); // 20×0.5 = 10
    expect(loose.xRange[1]).toBeGreaterThan(tight.xRange[1]);

    // 单点（跨度 0）：比例无作用对象，仍保 minPadding
    const single = fitViewRange([{ x: 20, y: 0 }], { paddingRatio: 0.5 });
    expect(single.xRange[1]).toBeCloseTo(20.5, 5);
  });
});
