import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PARAM_K_PROBE_X_RANGE,
  PARAM_K_SLOPE_RANGE,
  SECANT_INTERVAL_BOUNDS,
  clampSecantEndpoint,
  getSecantIntervalBounds,
} from "@/math/tangentScaling";
import {
  defaultParams,
  getTangentScalingParamConfigs,
  paramKSubModels,
  secantSubModels,
} from "@/data/registries/tangentScaling";
import type {
  ParamKSubModel,
  SecantSubModel,
  TangentScalingMode,
} from "@/math/tangentScaling";

/**
 * 拖拽钳制常量单源门禁（报告 §14.5 挂账项「拖拽钳制常量」）。
 *
 * ── 改前的撕裂 ──
 * `param_k` 页中屏写 `Math.max(0.1, Math.min(3.5, y/effX))` 与 `xRange={[0.2, 3.0]}`，
 * 右屏滑块写 `min: 0.1, max: 3.5` 与 `min: 0.2, max: 3.0`——四个数字各出现两次，
 * 且不在同一文件。`secant` 页同理：`0.2/0.1/4.5/3.5/1.5/1.6/0.4` 七个数字在中屏
 * 与 registry 各写一份。
 *
 * 后果不是「不好看」，是**同一参数在两处定义域不同**：改了一处，滑块拖到底而中屏
 * 还在动（或反之），学生看到两个互相矛盾的边界，而这恰好是「区间端点」这一课的
 * 全部教学内容。
 *
 * ── 定案 ──
 * 边界进 `src/math/tangentScaling.ts`（`PARAM_K_SLOPE_RANGE` /
 * `PARAM_K_PROBE_X_RANGE` / `SECANT_INTERVAL_BOUNDS`），钳制逻辑抽成纯函数
 * `clampSecantEndpoint`；registry 与场景都只读取，不再各写一份。
 *
 * 三层断言：① 常量与滑块一致；② 钳制结果满足不变量；③ 场景源码里不再出现边界字面量。
 */

const SCENE_DIR = resolve(
  process.cwd(),
  "src/features/derivativeTangentScaling/components/tangentScaling",
);

function sliderOf(
  mode: TangentScalingMode,
  key: string,
  options: {
    paramKSubModel?: ParamKSubModel;
    secantSubModel?: SecantSubModel;
  },
) {
  const configs = getTangentScalingParamConfigs(mode, defaultParams, options);
  const found = configs.find((c) => c.key === key);
  if (!found) throw new Error(`${mode} 未返回滑块 ${key}`);
  return found;
}

describe("拖拽钳制常量单源 · 常量层", () => {
  it("区间边界自身必须自洽（滑块两段不交叠、间距为正）", () => {
    for (const bounds of Object.values(SECANT_INTERVAL_BOUNDS)) {
      expect(bounds.aMin).toBeLessThan(bounds.aMax);
      expect(bounds.bMin).toBeLessThan(bounds.bMax);
      // a 的上界不得越过 b 的下界，否则「左端点比右端点还右」在滑块上就能拖出来
      expect(bounds.aMax).toBeLessThanOrEqual(bounds.bMin);
      expect(bounds.minGap).toBeGreaterThan(0);
      // 间距必须放得下：否则 a 永远追不上 b - minGap，钳制会卡死在 aMin
      expect(bounds.aMax).toBeLessThanOrEqual(bounds.bMin - bounds.minGap);
    }
  });

  it("param_k 的两个区间都是升序二元组", () => {
    expect(PARAM_K_SLOPE_RANGE[0]).toBeLessThan(PARAM_K_SLOPE_RANGE[1]);
    expect(PARAM_K_PROBE_X_RANGE[0]).toBeLessThan(PARAM_K_PROBE_X_RANGE[1]);
  });

  it("getSecantIntervalBounds 对对数支返回对数边界，其余回落到指数支", () => {
    expect(getSecantIntervalBounds("log_secant_tangent")).toBe(
      SECANT_INTERVAL_BOUNDS.log_secant_tangent,
    );
    expect(getSecantIntervalBounds("exp_secant_tangent")).toBe(
      SECANT_INTERVAL_BOUNDS.exp_secant_tangent,
    );
    // taylor_quadratic 不渲染区间滑块，回落只为免去调用方分支
    expect(getSecantIntervalBounds("taylor_quadratic")).toBe(
      SECANT_INTERVAL_BOUNDS.exp_secant_tangent,
    );
  });
});

describe("拖拽钳制常量单源 · 接线层：registry 滑块读数必须等于常量", () => {
  it("param_k 的 k 滑块 min/max 来自 PARAM_K_SLOPE_RANGE", () => {
    for (const item of paramKSubModels) {
      const k = sliderOf("param_k", "k", { paramKSubModel: item.id });
      expect(k.min, `${item.id} 的 k 下界`).toBe(PARAM_K_SLOPE_RANGE[0]);
      expect(k.max, `${item.id} 的 k 上界`).toBe(PARAM_K_SLOPE_RANGE[1]);
    }
  });

  it("param_k 的检验点滑块 min/max 来自 PARAM_K_PROBE_X_RANGE", () => {
    for (const item of paramKSubModels) {
      const x = sliderOf("param_k", "evalX", { paramKSubModel: item.id });
      expect(x.min, `${item.id} 的检验点下界`).toBe(PARAM_K_PROBE_X_RANGE[0]);
      expect(x.max, `${item.id} 的检验点上界`).toBe(PARAM_K_PROBE_X_RANGE[1]);
    }
  });

  it("secant 的 a、b 滑块 min/max 来自 SECANT_INTERVAL_BOUNDS", () => {
    const intervalSubs = secantSubModels.filter(
      (s) => s.id !== "taylor_quadratic",
    );
    expect(intervalSubs.length).toBeGreaterThan(0);
    for (const item of intervalSubs) {
      const sub = item.id as SecantSubModel;
      const bounds = getSecantIntervalBounds(sub);
      const a = sliderOf("secant", "intervalA", { secantSubModel: sub });
      const b = sliderOf("secant", "intervalB", { secantSubModel: sub });
      expect(a.min, `${sub} 的 a 下界`).toBe(bounds.aMin);
      expect(a.max, `${sub} 的 a 上界`).toBe(bounds.aMax);
      expect(b.min, `${sub} 的 b 下界`).toBe(bounds.bMin);
      expect(b.max, `${sub} 的 b 上界`).toBe(bounds.bMax);
    }
  });
});

describe("拖拽钳制常量单源 · 行为层：钳制结果永不越界", () => {
  const subs: SecantSubModel[] = ["exp_secant_tangent", "log_secant_tangent"];

  it("无论鼠标给到多远，a 都落在 [aMin, aMax] 且不越过 b - minGap", () => {
    for (const sub of subs) {
      const bounds = getSecantIntervalBounds(sub);
      const b = bounds.bMax;
      for (const raw of [-99, bounds.aMin - 5, 0, 1, bounds.aMax + 5, 99]) {
        const a = clampSecantEndpoint(sub, "a", raw, { a: bounds.aMin, b });
        expect(a, `${sub} a=${a} raw=${raw}`).toBeGreaterThanOrEqual(
          bounds.aMin,
        );
        expect(a).toBeLessThanOrEqual(bounds.aMax);
        expect(a).toBeLessThanOrEqual(b - bounds.minGap);
      }
    }
  });

  it("无论鼠标给到多远，b 都落在 [bMin, bMax] 且不越过 a + minGap", () => {
    for (const sub of subs) {
      const bounds = getSecantIntervalBounds(sub);
      const a = bounds.aMin;
      for (const raw of [-99, bounds.bMin - 5, 1, 2, bounds.bMax + 5, 99]) {
        const b = clampSecantEndpoint(sub, "b", raw, { a, b: bounds.bMin });
        expect(b, `${sub} b=${b} raw=${raw}`).toBeGreaterThanOrEqual(
          bounds.bMin,
        );
        expect(b).toBeLessThanOrEqual(bounds.bMax);
        expect(b).toBeGreaterThanOrEqual(a + bounds.minGap);
      }
    }
  });

  it("拖到两端极值后 a、b 仍严格分离（不会退化成切线）", () => {
    for (const sub of subs) {
      const bounds = getSecantIntervalBounds(sub);
      // 先把 a 拖到最右、再把 b 拖到最左，逼出最紧的一组
      const a = clampSecantEndpoint(sub, "a", bounds.aMax + 10, {
        a: bounds.aMin,
        b: bounds.bMax,
      });
      const b = clampSecantEndpoint(sub, "b", bounds.bMin - 10, {
        a,
        b: bounds.bMax,
      });
      expect(b - a).toBeGreaterThanOrEqual(bounds.minGap - 1e-9);
    }
  });
});

describe("拖拽钳制常量单源 · 源码层：场景不得再出现边界字面量", () => {
  it("TangentParamKScene 不再写死 k 与检验点区间", () => {
    const src = readFileSync(
      resolve(SCENE_DIR, "TangentParamKScene.tsx"),
      "utf-8",
    );
    expect(src, "中屏仍用数组字面量写 xRange").not.toMatch(/xRange=\{\[/);
    expect(src).toContain("PARAM_K_PROBE_X_RANGE");
    expect(src).toContain("PARAM_K_SLOPE_RANGE");
  });

  it("TangentSecantScene 不再写死 a、b 边界与间距，改为调用纯函数", () => {
    const src = readFileSync(
      resolve(SCENE_DIR, "TangentSecantScene.tsx"),
      "utf-8",
    );
    expect(src, "中屏仍按 isLog 三元写死边界").not.toMatch(/isLog\s*\?\s*4\.5/);
    expect(src, "中屏仍写死 b 的下界 1.6").not.toMatch(/Math\.min\(1\.6/);
    expect(src, "中屏仍写死 a 的上界 1.5").not.toMatch(/Math\.min\(1\.5,/);
    expect(src).toContain("clampSecantEndpoint");
  });
});
