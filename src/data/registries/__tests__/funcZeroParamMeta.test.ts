/**
 * funcZero「有效参数域」SSOT 契约测试。
 *
 * 历史缺陷：左屏滑块覆盖了模型盒的四个边界（minM/maxM/minN/maxN），
 * 中屏拖拽却只覆盖了 minM 与 maxN ——
 *   ① `intervalM` 可被拖到 3.5(>maxM) 之上、`intervalN` 可被拖到 minN 之下；
 *   ② 拖出的值滑块表达不出，「拖得到、滑不到」双向错位。
 * 本文件把「两侧必须消费同一份定义」钉死为回归门禁。
 */
import { describe, expect, it } from "vitest";
import { calculateSceneScale } from "@/hooks/useSceneScale";
import { paramDragRange } from "@/utils/paramClamp";
import { FUNC_ZERO_MODELS, getDynamicParamMeta, paramMeta } from "../funcZero";

const MODEL_KEYS = Object.keys(FUNC_ZERO_MODELS);

/** 与 FuncZeroAnimation 完全一致的视口（x∈[-5,6]、y∈[-4.5,4.5]） */
const scale = calculateSceneScale({
  designVisibleW: 840,
  designVisibleH: 649,
  designLeft: 0,
  designTop: 0,
  xRange: [-5, 6],
  yRange: [-4.5, 4.5],
});

describe("funcZero 有效参数域（模型盒覆盖注册表默认域）", () => {
  it("两个端点的四个边界都必须取自模型盒，其余字段原样透传", () => {
    for (const key of MODEL_KEYS) {
      const model = FUNC_ZERO_MODELS[key];
      const meta = getDynamicParamMeta(key);

      expect(meta.intervalM.min).toBe(model.minM);
      expect(meta.intervalM.max).toBe(model.maxM);
      expect(meta.intervalN.min).toBe(model.minN);
      expect(meta.intervalN.max).toBe(model.maxN);

      // 标签 / 步长 / 默认值等不得在覆盖过程中丢失
      expect(meta.intervalM.step).toBe(paramMeta.intervalM.step);
      expect(meta.intervalN.step).toBe(paramMeta.intervalN.step);
      expect(meta.bisectionSteps).toEqual(paramMeta.bisectionSteps);

      // 模型盒本身必须是合法闭区间，否则 paramDragRange 会退化成「不钳制」
      expect(meta.intervalM.min).toBeLessThan(meta.intervalM.max);
      expect(meta.intervalN.min).toBeLessThan(meta.intervalN.max);
    }
  });

  it("未知模型回落到 cubic，绝不返回 undefined 边界", () => {
    const meta = getDynamicParamMeta("no-such-model");
    expect(meta.intervalM.min).toBe(FUNC_ZERO_MODELS.cubic.minM);
    expect(meta.intervalM.max).toBe(FUNC_ZERO_MODELS.cubic.maxM);
    expect(Number.isFinite(meta.intervalM.min)).toBe(true);
    expect(Number.isFinite(meta.intervalM.max)).toBe(true);
  });

  it("与可见视口求交后仍不越出模型盒：手柄不可能被拖出参数域", () => {
    // logMixed 的模型盒是 [0.2, 3.5]：下界必须挡住 ln 的负真数区，
    // 上界必须早于注册表默认域的 3.0 之后（历史上拖拽完全不受此约束）。
    const logMeta = getDynamicParamMeta("logMixed");
    expect(paramDragRange(logMeta.intervalM, scale, "x")).toEqual([0.2, 3.5]);

    // counterExample 的模型盒 [minN, maxN] = [-1, 5]，此前拖拽只约束了 maxN，
    // 端点 b 可以被拖到 m + 0.2 而低于 minN；现在下界由模型盒统一守住。
    const ceMeta = getDynamicParamMeta("counterExample");
    expect(paramDragRange(ceMeta.intervalN, scale, "x")).toEqual([-1, 5]);
  });

  it("视口一旦比模型盒更窄，交集以视口为准（视口约束优先收紧）", () => {
    // 关键语义：paramDragRange 求交的是「由设计视口反推的可见数学域」scale.xMin/xMax，
    // 而不是构造 useSceneScale 时传入的 xRange。keepAspectRatio=true 时可见域恒**包含**
    // 传入的 xRange（甚至明显更宽），所以常态下真正生效的约束是 paramMeta 本身；
    // 只有当设计区相对参数域「又高又窄」时，可见域才会成为更紧的那一侧。
    // 这里取 200×400 的设计区 + xRange[0,2]/yRange[-3,3]，即刻意制造后者。
    const narrow = calculateSceneScale({
      designVisibleW: 200,
      designVisibleH: 400,
      designLeft: 0,
      designTop: 0,
      xRange: [0, 2],
      yRange: [-3, 3],
    });
    const meta = getDynamicParamMeta("logMixed");
    const range = paramDragRange(meta.intervalM, narrow, "x");

    expect(range).toBeDefined();
    expect(range![0]).toBeCloseTo(0.2, 6); // 下界仍由模型盒守住
    expect(range![1]).toBeCloseTo(2.5, 6); // 上界被可见域收紧到 2.5 < 模型盒上界 3.5
    expect(range![1]).toBeLessThan(meta.intervalM.max);
  });
});
