import { describe, it, expect } from "vitest";
import { VISIBLE_X_LIMIT } from "@/data/registries/vectorPolarizationApollonius";
import { calcApolloniusCircle } from "@/math/vectorPolarizationApollonius";

/**
 * 官方预设必须"看得见"。
 *
 * 预设是本页的主推入口：学生往往直接点预设看结论，
 * 一旦预设对应的阿氏圆或内/外分点被裁出画布，第一眼看到的就是残缺图形
 * —— 这正是本轮审查发现的问题（λ = 0.5 预设的外分点 E(−9, 0) 曾落在 xRange [−8, 12] 之外）。
 *
 * 本用例把「预设 ↔ 视口」的一致性固化成断言：
 * 视口半宽取自 `VISIBLE_X_LIMIT`（与 `useSceneScale({ xRange })` 共用同一常量），
 * 以后无论改预设参数还是改视口，只要两者再次脱节就会立刻红灯。
 */
describe("预设与中屏视口一致性守卫 (Preset × Viewport Visibility)", () => {
  const D = 6.0; // 本页全部阿氏圆预设使用的基底定长

  function assertCircleVisible(lambda: number) {
    const r = calcApolloniusCircle(D, lambda, 45);
    expect(r.isDegenerate).toBe(false);
    // 阿氏圆在 x 方向恰好张成 [xD, xE]，故只需检查这两端
    const spanMin = Math.min(r.pointD.x, r.pointE.x);
    const spanMax = Math.max(r.pointD.x, r.pointE.x);
    expect(spanMin).toBeGreaterThanOrEqual(-VISIBLE_X_LIMIT);
    expect(spanMax).toBeLessThanOrEqual(VISIBLE_X_LIMIT);
    // 圆心 ± 半径 也必须落在同一区间（防止"端点在内、圆弧在外"）
    expect(r.centerO.x - r.radiusR).toBeGreaterThanOrEqual(-VISIBLE_X_LIMIT);
    expect(r.centerO.x + r.radiusR).toBeLessThanOrEqual(VISIBLE_X_LIMIT);
  }

  it("λ = 0.5「半倍比阿圆」预设：E(−9, 0) 与整圆均落在可见横轴内", () => {
    const r = calcApolloniusCircle(D, 0.5, 45);
    expect(r.pointE.x).toBeCloseTo(-9, 6);
    expect(r.pointD.x).toBeCloseTo(-1, 6);
    assertCircleVisible(0.5);
  });

  it("λ = 2「二倍比阿圆」预设（即默认参数）：E(9, 0) 与整圆均落在可见横轴内", () => {
    const r = calcApolloniusCircle(D, 2, 45);
    expect(r.pointE.x).toBeCloseTo(9, 6);
    expect(r.pointD.x).toBeCloseTo(1, 6);
    assertCircleVisible(2);
  });
});
