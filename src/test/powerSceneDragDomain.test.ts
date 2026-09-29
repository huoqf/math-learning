import { describe, it, expect } from "vitest";
import { calculateSceneScale } from "@/hooks/useSceneScale";
import { paramDragRange, snapDragValue } from "@/utils/paramClamp";
import { paramMeta } from "@/data/registries/funcExpLog";
import { CANVAS_PRESETS } from "@/theme";

/**
 * 幂函数页（`/function-power` → `PowerPage` → `PowerScene`）的两个回归契约：
 *
 * ① 「拖拽域 = 左屏滑块域」必须由 paramClamp SSOT 表达，且与迁移前的手写 clamp 逐值等价
 *    （迁移前是 `Math.min(Math.max(paramMeta.x0.min, x), paramMeta.x0.max)` + `Math.round(x*10)/10`）。
 * ② 该页纵坐标溢出是真实且可达的 ⇒ 必须开启 `edgeClampProjection`，不能靠"不会有学生拖那么远"糊过去。
 *
 * 说明：本页与 `ExpLogScene.tsx`（服务 `/function-exponential` 与 `/function-logarithmic`）是
 * **两个不同的 Scene**，勿因文件名相似而只改一个。
 */

/** 与 PowerPage 完全同源的视口参数（`CANVAS_PRESETS.full` + `xRange[-6,6]` + `yRange[-4.5,4.5]`）。 */
function buildPowerScale() {
  return calculateSceneScale({
    designVisibleW: CANVAS_PRESETS.full.width,
    designVisibleH: CANVAS_PRESETS.full.height,
    designLeft: 0,
    designTop: 0,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });
}

describe("幂函数页 x₀ 拖拽域（paramClamp SSOT）", () => {
  it("preset 前置断言：full = 840×650，keepAspectRatio 由 x 轴锁定 scale = 70", () => {
    expect(CANVAS_PRESETS.full).toEqual({ width: 840, height: 650 });
    expect(buildPowerScale().scale).toBe(70);
  });

  it("paramDragRange 与迁移前手写 clamp 逐值等价（均为 paramMeta 的 [-4, 4]）", () => {
    const scale = buildPowerScale();
    const range = paramDragRange(paramMeta.x0, scale, "x");
    // 可见横域恰为 ±6（840/70/2），比 paramMeta 的 ±4 更宽 ⇒ 生效的是 paramMeta，非视口。
    expect(scale.xMin).toBeCloseTo(-6, 6);
    expect(scale.xMax).toBeCloseTo(6, 6);
    expect(range).toEqual([paramMeta.x0.min, paramMeta.x0.max]);
    expect(range).toEqual([-4, 4]);
  });

  it("步长取自 paramMeta.x0.step（0.1），与迁移前的 Math.round(x*10)/10 同粒度", () => {
    const scale = buildPowerScale();
    const range = paramDragRange(paramMeta.x0, scale, "x");
    const step = paramMeta.x0.step;
    expect(step).toBe(0.1);
    // 先取整再钳制：越界与未越界都覆盖
    expect(snapDragValue(2.34, step, range)).toBe(2.3);
    expect(snapDragValue(3.97, step, range)).toBe(4.0);
    expect(snapDragValue(-5, step, range)).toBe(-4);
    expect(snapDragValue(0.04, step, range)).toBe(0);
  });
});

describe("幂函数页纵坐标溢出的必要性守卫（锁定 edgeClampProjection）", () => {
  it("α 上界 3.0 × x₀ 上界 4.0 ⇒ y₀ 最大 64，远超可见纵域 ±4.6429", () => {
    const scale = buildPowerScale();
    // keepAspectRatio 把 y 域撑到 650/70/2 = 4.642857…，比传入的 [-4.5, 4.5] 略宽。
    expect(scale.yMax).toBeCloseTo(325 / 70, 6);
    expect(scale.yMin).toBeCloseTo(-325 / 70, 6);

    const worst = Math.pow(paramMeta.x0.max, paramMeta.powerAlpha.max);
    expect(worst).toBe(64);
    expect(worst).toBeGreaterThan(scale.yMax);
  });

  it("出框临界 x₀ = yMax^(1/α) 落在滑块可达区间内（三种指数逐一验证）", () => {
    const scale = buildPowerScale();
    const critical = (alpha: number) => Math.pow(scale.yMax, 1 / alpha);

    expect(critical(1)).toBeCloseTo(4.6429, 3); // 略超 x₀ 上界 4 ⇒ α=1 几乎不触发
    expect(critical(2)).toBeCloseTo(2.1547, 3);
    expect(critical(3)).toBeCloseTo(1.6683, 3);

    // α = 2 / 3 的临界值都严格小于 x₀ 上界 ⇒ 学生拖到滑块区间内就会飞出手柄
    for (const alpha of [2, 3]) {
      expect(critical(alpha)).toBeLessThan(paramMeta.x0.max);
      expect(critical(alpha)).toBeGreaterThan(paramMeta.x0.min);
    }
  });

  it("具体可达样例：α=2, x₀=2.2 出框；α=1, x₀=3.0 仍在框内（反向控制）", () => {
    const scale = buildPowerScale();
    const yAt = (alpha: number, x0: number) => Math.pow(x0, alpha);

    // 出框：2.2² = 4.84 > 4.6429，且 2.2 是 step=0.1 上的可达格点
    expect(yAt(2, 2.2)).toBeCloseTo(4.84, 6);
    expect(yAt(2, 2.2)).toBeGreaterThan(scale.yMax);
    // 反向控制：α=1 时 y = x，x₀=3 不出框（避免"一律开投影"的过度断言）
    expect(yAt(1, 3)).toBe(3);
    expect(yAt(1, 3)).toBeLessThan(scale.yMax);
  });
});
