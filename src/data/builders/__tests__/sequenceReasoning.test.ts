import { describe, it, expect } from "vitest";
import { buildSequencePanel } from "@/data/builders/sequence";

/**
 * 第四阶段债务 #3：数列全部子模式的推导链覆盖门禁。
 * 背景：右屏「推导链」长期只有一阶线性与 snToAn 两个模式产出，
 * 其余子模式点进去是空的——学生看到的是「会做题但没有过程」。
 * 这里用一张覆盖面清单把每个子模式都点名跑一遍，缺一步就红。
 */

const BASE_PARAMS: Record<string, number> = {
  a1: 3,
  d: -1,
  q: 0.5,
  N: 8,
  kSegment: 3,
  teleGap: 1,
  p_rec: 2,
  q_rec: 1,
  r_rec: 3,
  coefA: 2,
  coefB: 1,
  coefC: 1,
  a2: 5,
  stepParam: 2,
};

interface Case {
  name: string;
  config: Record<string, unknown>;
  params?: Record<string, number>;
}

const CASES: Case[] = [
  // ── 等差数列 6 个 ──
  {
    name: "等差 · 通项",
    config: { activeMode: "arithmetic", arithmeticSubMode: "linear" },
  },
  {
    name: "等差 · 倒序相加",
    config: { activeMode: "arithmetic", arithmeticSubMode: "gauss" },
  },
  {
    name: "等差 · 二次最值",
    config: { activeMode: "arithmetic", arithmeticSubMode: "quadratic" },
  },
  {
    name: "等差 · 等长片段",
    config: { activeMode: "arithmetic", arithmeticSubMode: "segment" },
  },
  {
    name: "等差 · 绝对值求和",
    config: { activeMode: "arithmetic", arithmeticSubMode: "absSum" },
  },
  {
    name: "等差 · Sn 求 an",
    config: { activeMode: "arithmetic", arithmeticSubMode: "snToAn" },
  },

  // ── 等比数列 5 个 ──
  {
    name: "等比 · 指数型",
    config: { activeMode: "geometric", geometricSubMode: "exponential" },
  },
  {
    name: "等比 · 错位相减",
    config: { activeMode: "geometric", geometricSubMode: "staggerSum" },
  },
  {
    name: "等比 · 等长片段",
    config: { activeMode: "geometric", geometricSubMode: "segment" },
  },
  {
    name: "等比 · 乘积最值",
    config: { activeMode: "geometric", geometricSubMode: "productMax" },
  },
  {
    name: "等比 · 无穷递缩",
    config: { activeMode: "geometric", geometricSubMode: "tessellation" },
  },

  // ── 综合模型 7 个（裂项按 teleGap 三分档）──
  {
    name: "模型 · 差比数列",
    config: { activeMode: "models", subModel: "arith-geo" },
  },
  {
    name: "模型 · 裂项(等差)",
    config: { activeMode: "models", subModel: "telescoping", teleGap: 1 },
  },
  {
    name: "模型 · 裂项(平方)",
    config: { activeMode: "models", subModel: "telescoping", teleGap: 2 },
  },
  {
    name: "模型 · 裂项(根式)",
    config: { activeMode: "models", subModel: "telescoping", teleGap: 3 },
  },
  {
    name: "模型 · 绝对值",
    config: { activeMode: "models", subModel: "abs-sum" },
  },
  {
    name: "模型 · 分组",
    config: { activeMode: "models", subModel: "grouped" },
  },
  {
    name: "模型 · 奇偶并项",
    config: { activeMode: "models", subModel: "odd-even" },
  },

  // ── 递推构造 7 个 ──
  {
    name: "递推 · 一阶线性",
    config: { activeMode: "recurrence", subModel: "linear-pan" },
  },
  {
    name: "递推 · 累加",
    config: { activeMode: "recurrence", subModel: "accumulation" },
  },
  {
    name: "递推 · 累乘",
    config: { activeMode: "recurrence", subModel: "multiplication" },
  },
  {
    name: "递推 · 指数非齐次",
    config: { activeMode: "recurrence", subModel: "non-homogeneous" },
  },
  {
    name: "递推 · 倒数构造",
    config: { activeMode: "recurrence", subModel: "reciprocal" },
  },
  {
    name: "递推 · 二阶特征根",
    config: { activeMode: "recurrence", subModel: "second-order" },
  },
  {
    name: "递推 · 数学归纳法",
    config: { activeMode: "recurrence", subModel: "induction" },
  },
];

describe("数列 25 个子模式的推导链全覆盖", () => {
  it.each(CASES.map((c) => [c.name, c] as const))(
    "%s 至少给出 3 步推导链，且每步都有可读的 latex 与说明",
    (_name, c) => {
      const panel = buildSequencePanel(
        { ...BASE_PARAMS, ...(c.params ?? {}) },
        c.config,
      );
      const steps = panel.reasoningSteps ?? [];
      expect(steps.length).toBeGreaterThanOrEqual(3);
      steps.forEach((s, i) => {
        expect(s.step).toBe(i + 1);
        expect(String(s.title ?? "").length).toBeGreaterThan(0);
        expect(String(s.latex ?? "").length).toBeGreaterThan(0);
        expect(String(s.detail ?? "").length).toBeGreaterThan(0);
      });
    },
  );

  it("推导链里不出现 NaN / undefined 之类的占位文本", () => {
    const dump = CASES.map((c) => {
      const panel = buildSequencePanel(
        { ...BASE_PARAMS, ...(c.params ?? {}) },
        c.config,
      );
      return JSON.stringify(panel.reasoningSteps ?? []);
    }).join("\n");
    expect(dump).not.toContain("NaN");
    expect(dump).not.toContain("undefined");
  });

  it("覆盖清单与 builder 的分支数一致：25 个子模式一个不漏", () => {
    expect(CASES).toHaveLength(25);
  });
});
