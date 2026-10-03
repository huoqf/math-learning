import { describe, it, expect } from "vitest";
import {
  MODEL_TAU,
  TRIG_SCENARIOS,
  buildHarmonicModel,
  harmonicPhase,
  harmonicValue,
  normalizeAngle,
  solveModelFromGraph,
} from "./trigModel";
import { paramMeta } from "../data/registries/trigModel";

describe("三角函数模型应用 · 纯数学层", () => {
  it("buildHarmonicModel：由 A / T / φ / k 派生出 ω、f、最值与波峰波谷横坐标", () => {
    const m = buildHarmonicModel(2, 2, Math.PI / 2, 0);
    expect(m.amplitude).toBeCloseTo(2, 12);
    expect(m.period).toBeCloseTo(2, 12);
    expect(m.omega).toBeCloseTo(Math.PI, 12);
    expect(m.frequency).toBeCloseTo(0.5, 12);
    expect(m.maxValue).toBeCloseTo(2, 12);
    expect(m.minValue).toBeCloseTo(-2, 12);
    // φ = π/2 时 t = 0 恰为波峰
    expect(m.maxTime).toBeCloseTo(0, 12);
    // 波谷出现在前推半个周期处
    expect(m.minTime).toBeCloseTo(1, 12);
  });

  it("harmonicValue：在波峰、波谷与平衡位置取值与模型读数一致", () => {
    const m = buildHarmonicModel(1.5, 12, -Math.PI / 2, 2.5);
    expect(harmonicValue(m, 0)).toBeCloseTo(m.minValue, 12);
    expect(harmonicValue(m, m.maxTime)).toBeCloseTo(m.maxValue, 12);
    // 波峰与波谷的横坐标相差半个周期
    expect(m.maxTime - m.minTime).toBeCloseTo(m.period / 2, 12);
    // 相位定义自洽
    expect(harmonicPhase(m, 0)).toBeCloseTo(-Math.PI / 2, 12);
  });

  it("buildHarmonicModel：A 取负与周期非法时同样给出可用模型（不泄漏 NaN / Infinity）", () => {
    const m = buildHarmonicModel(-2, 0, 0, 0);
    expect(m.amplitude).toBeCloseTo(2, 12);
    expect(m.period).toBeCloseTo(1, 12); // 兜底为 1，绝不产生 ω = Infinity
    expect(Number.isFinite(m.omega)).toBe(true);
    expect(Number.isFinite(m.maxTime)).toBe(true);
    expect(Number.isFinite(m.minTime)).toBe(true);
  });

  it("normalizeAngle：全部折算到 (-π, π]", () => {
    expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI, 12);
    expect(normalizeAngle(-Math.PI)).toBeCloseTo(Math.PI, 12);
    expect(normalizeAngle((7 * Math.PI) / 2)).toBeCloseTo(-Math.PI / 2, 12);
    expect(normalizeAngle((-3 * Math.PI) / 2)).toBeCloseTo(Math.PI / 2, 12);
    expect(normalizeAngle(MODEL_TAU)).toBeCloseTo(0, 12);
    expect(normalizeAngle(Number.NaN)).toBe(0);
    // 等价类不变：折算前后表示同一条曲线
    const base = buildHarmonicModel(1, 4, 0.3, 1);
    const shifted = buildHarmonicModel(1, 4, 0.3 + MODEL_TAU * 3, 1);
    expect(shifted.phi).toBeCloseTo(base.phi, 12);
    expect(harmonicValue(shifted, 2.7)).toBeCloseTo(
      harmonicValue(base, 2.7),
      12,
    );
  });

  it("solveModelFromGraph：最值定 A 与 k、周期定 ω、最高点定 φ，且代回残差为 0", () => {
    const solved = solveModelFromGraph({
      maxValue: 4,
      minValue: 1,
      maxTime: 3,
      period: 12,
    });
    expect(solved.isValid).toBe(true);
    expect(solved.amplitude).toBeCloseTo(1.5, 12);
    expect(solved.balance).toBeCloseTo(2.5, 12);
    expect(solved.omega).toBeCloseTo(MODEL_TAU / 12, 12);
    expect(solved.phi).toBeCloseTo(0, 12);
    expect(solved.residual).toBeCloseTo(0, 10);
  });

  it("solveModelFromGraph：与正向构造互为逆运算（多组参数往返自洽）", () => {
    const cases: Array<[number, number, number, number]> = [
      [1, 1, 0, 0],
      [2, 2, Math.PI / 2, 0],
      [1.5, 12, -Math.PI / 2, 2.5],
      [1.2, 12.5, 0, 2.5],
      [3, 5, (2 * Math.PI) / 3, -1],
      [0.8, 7.5, -2, 4],
    ];
    for (const [A, period, phi, k] of cases) {
      const forward = buildHarmonicModel(A, period, phi, k);
      const solved = solveModelFromGraph({
        maxValue: forward.maxValue,
        minValue: forward.minValue,
        maxTime: forward.maxTime,
        period: forward.period,
      });
      expect(solved.isValid).toBe(true);
      expect(solved.amplitude).toBeCloseTo(A, 10);
      expect(solved.balance).toBeCloseTo(k, 10);
      expect(solved.omega).toBeCloseTo((2 * Math.PI) / period, 10);
      // φ 落在 (-π, π] 内，且与正向模型表示同一条曲线
      expect(solved.phi).toBeGreaterThan(-Math.PI - 1e-9);
      expect(solved.phi).toBeLessThanOrEqual(Math.PI + 1e-9);
      const rebuilt = buildHarmonicModel(
        solved.amplitude,
        period,
        solved.phi,
        solved.balance,
      );
      for (const t of [0, 0.37, 1.4, 3.3, 6.2]) {
        expect(harmonicValue(rebuilt, t)).toBeCloseTo(
          harmonicValue(forward, t),
          9,
        );
      }
      expect(solved.residual).toBeLessThan(1e-9);
    }
  });

  it("solveModelFromGraph：题面自相矛盾时判定非法并给出原因，不泄漏 NaN", () => {
    const reversed = solveModelFromGraph({
      maxValue: 1,
      minValue: 4,
      maxTime: 0,
      period: 4,
    });
    expect(reversed.isValid).toBe(false);
    expect(reversed.warning).toBeTruthy();

    const badPeriod = solveModelFromGraph({
      maxValue: 4,
      minValue: 1,
      maxTime: 0,
      period: 0,
    });
    expect(badPeriod.isValid).toBe(false);
    expect(badPeriod.warning).toContain("周期");

    const peakOutside = solveModelFromGraph({
      maxValue: 4,
      minValue: 1,
      maxTime: 5,
      period: 4,
    });
    expect(peakOutside.isValid).toBe(false);
    expect(peakOutside.warning).toContain("[0, 4.00]");

    const notFinite = solveModelFromGraph({
      maxValue: Number.NaN,
      minValue: 1,
      maxTime: 0,
      period: 4,
    });
    expect(notFinite.isValid).toBe(false);
    expect(Number.isNaN(notFinite.residual)).toBe(true);
  });

  it("三个实际情境的参数都落在左屏滑块的声明域内且恰在 step 网格上", () => {
    expect(TRIG_SCENARIOS.length).toBe(3);
    for (const s of TRIG_SCENARIOS) {
      for (const [key, value] of Object.entries(s.params)) {
        const meta = paramMeta[key];
        expect(
          meta,
          `情境 ${s.key} 的参数 ${key} 未在注册表中声明`,
        ).toBeDefined();
        expect(
          value >= meta.min && value <= meta.max,
          `情境 ${s.key} 的 ${key} = ${value} 越出声明域 [${meta.min}, ${meta.max}]`,
        ).toBe(true);
        const step = meta.step ?? 1;
        expect(
          Math.abs(Math.round(value / step) * step - value),
          `情境 ${s.key} 的 ${key} = ${value} 不在步长 ${step} 的网格上`,
        ).toBeLessThan(1e-9);
      }
      // 每个情境的预测时刻必须落在左屏「观测时刻」滑块的声明域 [0, T] 内
      // （中屏横向视口固定为 [−0.7, 13.7]，越界即观测点飞出画布）
      expect(s.probeTime).toBeGreaterThanOrEqual(0);
      expect(s.probeTime).toBeLessThanOrEqual(s.params.period);
      // 且换算成的 tRatio 必须**恰在滑块的 step 网格上**：
      // 否则「选中情境 → 观测点落在 t = probeTime」与滑块显示的比例值会差半个步长，
      // 出现本仓最忌讳的「读数与画面脱节」（0.32 被浏览器吸附成 0.3，点却仍画在 t = 4 处）。
      const ratio = s.probeTime / s.params.period;
      const ratioMeta = paramMeta.tRatio;
      const ratioStep = ratioMeta.step ?? 1;
      expect(
        Math.abs(Math.round(ratio / ratioStep) * ratioStep - ratio),
        `情境 ${s.key} 的观测比例 ${ratio} 不在 tRatio 步长 ${ratioStep} 的网格上`,
      ).toBeLessThan(1e-9);
    }
  });
});
