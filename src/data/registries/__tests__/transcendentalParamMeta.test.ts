/**
 * transcendental「按模式拆分」参数域 SSOT 契约测试。
 *
 * 历史缺陷：左屏滑块把四套参数域写死在渲染函数里，注册表只留一份从未被引用的
 * 死数据（x₀ ∈ [-2.0, 3.0]），中屏拖拽又各写一套 Math.round / Math.max 兜底：
 *   · 拖拽下界 0.05 比滑块自己的下界（log 0.1 / chain 0.2）还低；
 *   · 拖拽完全没有上界，指数模式可把切点拖到视口边缘 x = 4，滑块却停在 2.0。
 * 本文件把「两种入口必须消费同一份定义」固化成断言。
 */
import { describe, expect, it } from "vitest";
import { calculateSceneScale } from "@/hooks/useSceneScale";
import { paramDragRange } from "@/utils/paramClamp";
import type { TranscendentalMode } from "@/math/transcendental";
import { transcendentalParamMeta } from "../transcendental";

const MODES: TranscendentalMode[] = ["exp", "log", "chain", "param"];

/** 与 TranscendentalAnimation 同构：xRange [-4,4]、yRange [-3,5]、840×650 */
const scale = calculateSceneScale({
  designVisibleW: 840,
  designVisibleH: 650,
  designLeft: 0,
  designTop: 0,
  xRange: [-4, 4],
  yRange: [-3, 5],
});

/** 取该模式唯一的可拖拽参数名 */
function soleParamKey(mode: TranscendentalMode): string {
  const keys = Object.keys(transcendentalParamMeta[mode]);
  expect(keys).toHaveLength(1);
  return keys[0];
}

describe("transcendental 按模式参数域 SSOT", () => {
  it("四套参数域与历史滑块区间逐一对应（防静默漂移）", () => {
    expect(transcendentalParamMeta.exp.x0.min).toBe(-2.5);
    expect(transcendentalParamMeta.exp.x0.max).toBe(2.0);
    expect(transcendentalParamMeta.log.x0.min).toBe(0.1);
    expect(transcendentalParamMeta.log.x0.max).toBe(3.5);
    expect(transcendentalParamMeta.chain.x0.min).toBe(0.2);
    expect(transcendentalParamMeta.chain.x0.max).toBe(3.0);
    expect(transcendentalParamMeta.param.a.min).toBe(-1.0);
    expect(transcendentalParamMeta.param.a.max).toBe(4.0);
  });

  it("每个模式恰好一个可拖拽参数，且声明域 / 步长 / 默认值自洽", () => {
    for (const mode of MODES) {
      const meta = transcendentalParamMeta[mode][soleParamKey(mode)];
      expect(meta.min).toBeLessThan(meta.max);
      expect(meta.step).toBeGreaterThan(0);
      expect(meta.defaultValue).toBeGreaterThanOrEqual(meta.min);
      expect(meta.defaultValue).toBeLessThanOrEqual(meta.max);
    }
    // param 模式的可拖拽对象是直线斜率 a，该模式没有 x₀ 手柄 ——
    // Scene 里的 x0Meta 必须能安全取到 undefined 而不是伪造一个域
    expect(transcendentalParamMeta.param.x0).toBeUndefined();
  });

  it("对数 / 双基准模式的下界天然排开 ln 的负真数区", () => {
    for (const mode of ["log", "chain"] as TranscendentalMode[]) {
      expect(transcendentalParamMeta[mode].x0.min).toBeGreaterThan(0);
    }
  });

  it("与可见视口求交后仍落在声明域内：拖拽永远拖不到滑块表达不出的值", () => {
    for (const mode of MODES) {
      const meta = transcendentalParamMeta[mode][soleParamKey(mode)];
      const range = paramDragRange(meta, scale, "x");
      expect(range).toBeDefined();
      expect(range![0]).toBeGreaterThanOrEqual(meta.min);
      expect(range![1]).toBeLessThanOrEqual(meta.max);
      // 该模式的可见横轴足够宽，故交集应恰为声明域本身
      expect(range).toEqual([meta.min, meta.max]);
    }
  });

  it("只有 exp 模式的切点会飞出可见纵域 —— 这正是唯一开启边缘投影手柄的原因", () => {
    const yLo = scale.yMin;
    const yHi = scale.yMax;

    // exp：P = (x₀, e^{x₀})，x₀ 上界 2.0 → e² ≈ 7.39 ＞ 5，且出框临界 ln 5 ≈ 1.609
    // 落在滑块可达区间内部，属于必然发生的真实场景而非边界巧合
    expect(Math.exp(transcendentalParamMeta.exp.x0.max)).toBeGreaterThan(yHi);
    expect(Math.log(yHi)).toBeLessThan(transcendentalParamMeta.exp.x0.max);

    // log：P = (x₀, ln x₀)，ln 0.1 ≈ -2.30 ＞ -3，天然在框内
    expect(Math.log(transcendentalParamMeta.log.x0.min)).toBeGreaterThan(yLo);

    // chain：P = (x₀, x₀)，[0.2, 3.0] ⊂ [-3, 5]，天然在框内
    expect(transcendentalParamMeta.chain.x0.min).toBeGreaterThan(yLo);
    expect(transcendentalParamMeta.chain.x0.max).toBeLessThan(yHi);
  });
});
