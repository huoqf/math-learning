import { describe, it, expect } from "vitest";
import {
  calculateOptimizationModel,
  OPTIMIZATION_CONSTANTS,
} from "@/math/derivativeOptimization";
import { buildDerivativeOptimizationPanel } from "@/data/builders/derivativeOptimization";

describe("导数生活优化建模数学层与组装层契约", () => {
  it("折叠长方体盒模型在导数为零的点 x=10 处导数为零且达到最大容积 16000", () => {
    const res = calculateOptimizationModel("box", 10);

    expect(res.isValid).toBe(true);
    expect(res.optimalX).toBeCloseTo(10, 5);
    expect(res.optimalY).toBeCloseTo(16000, 5);
    expect(res.primeVal).toBeCloseTo(0, 5);
    expect(res.yVal).toBeCloseTo(16000, 5);
  });

  it("易拉罐最省用料模型在导数为零的点处一阶导数为零且满足高径比关系", () => {
    const res = calculateOptimizationModel("can", 4.57078);

    expect(res.isValid).toBe(true);
    expect(res.optimalX).toBeCloseTo(Math.cbrt(300 / Math.PI), 3);
    // 在最优导数为零的点处导数必须为 0
    expect(res.primeVal).toBeCloseTo(0, 1);
  });

  it("企业利润二次模型在 x=40 处取得最大利润 600", () => {
    const res = calculateOptimizationModel("profit", 40);

    expect(res.isValid).toBe(true);
    expect(res.optimalX).toBeCloseTo(40, 5);
    expect(res.optimalY).toBeCloseTo(600, 5);
    expect(res.primeVal).toBeCloseTo(0, 5);
  });

  it("物理定义域与数值安全拖拽边界必须分离：can/profit 上界为无穷而拖拽上界有限", () => {
    const box = calculateOptimizationModel("box", 10);
    // box 的两端都是有限实数：物理定义域 (0, L/2)
    expect(box.domainMin).toBeCloseTo(0, 9);
    expect(box.domainMax).toBeCloseTo(30, 9);
    // 拖拽边界内缩，避开 x → 0 的导出式退化
    expect(box.dragMin).toBeGreaterThan(box.domainMin);
    expect(box.dragMax).toBeLessThan(box.domainMax);

    const can = calculateOptimizationModel("can", 4.57078);
    expect(can.domainMin).toBeCloseTo(0, 9);
    // 物理定义域无上界，但拖拽必须有限，否则滑块与视口无法承载
    expect(can.domainMax).toBe(Infinity);
    expect(Number.isFinite(can.dragMax)).toBe(true);

    const profit = calculateOptimizationModel("profit", 40);
    expect(profit.domainMax).toBe(Infinity);
    expect(Number.isFinite(profit.dragMax)).toBe(true);
  });

  it("越出物理定义域的取值须截断到边界并给出提示", () => {
    const res = calculateOptimizationModel("box", 1000);
    // 截断到数值安全上界而非放任到物理定义域之外
    expect(res.xVal).toBeCloseTo(res.dragMax, 9);
    expect(res.xVal).toBeLessThan(res.domainMax);
    expect(res.warning).toBeTruthy();
  });

  it("量值必须携带量纲单位（cm / cm³ / cm² / 件 / 元）", () => {
    const box = calculateOptimizationModel("box", 10);
    expect(box.xUnit).toBe("cm");
    expect(box.yUnit).toBe("cm³");

    const can = calculateOptimizationModel("can", 4.57078);
    expect(can.xUnit).toBe("cm");
    expect(can.yUnit).toBe("cm²");

    const profit = calculateOptimizationModel("profit", 40);
    expect(profit.xUnit).toBe("件");
    expect(profit.yUnit).toBe("元");
  });

  it("三套模型都必须给出端点趋势比较结论（最值定论的闭环依据）", () => {
    for (const [model, x] of [
      ["box", 10],
      ["can", 4.57078],
      ["profit", 40],
    ] as const) {
      const res = calculateOptimizationModel(model, x);
      expect(res.endpointCheckLatex.length).toBeGreaterThan(0);
      // 必须是含端点趋势取值的实质结论，而非占位串
      expect(res.endpointCheckLatex).toMatch(/V\(|S\(|P\(/);
      // 端点趋势一律用教材式描述性语言，不书写超前的高数极限记号
      expect(res.endpointCheckLatex).not.toMatch(/\\lim/);
      // 该字段是「整串 LaTeX」（final定理 latex），严禁夹带 $ 行内定界符
      expect(res.endpointCheckLatex).not.toMatch(/\$/);
    }
  });

  it("右屏推导链严格遵守代数三部曲与题设规范", () => {
    const result = buildDerivativeOptimizationPanel(
      { box_x: 10 },
      { modelType: "box" },
    );

    expect(result.quantities.length).toBeGreaterThan(0);
    expect(result.theorems?.length).toBeGreaterThan(0);
    expect(result.reasoningSteps?.length).toBeGreaterThan(0);

    const steps = result.reasoningSteps!;
    expect(steps[0].title).toContain("审题定法");
    expect(steps[1].title).toContain("建模联立");
    expect(steps[2].title).toContain("求解反思");
    // 第 4 步：端点趋势检验，把局部极值升级为全局最值的闭环依据
    expect(steps[3].title).toContain("端点趋势");

    for (const step of steps) {
      if (step.detail && step.detail.includes("x")) {
        expect(step.detail).toMatch(/\$.*?\$/);
      }
    }
  });

  it("右屏量值必须带单位，且硬编码不变量与数学层常量同源", () => {
    const result = buildDerivativeOptimizationPanel(
      { box_x: 10 },
      { modelType: "box" },
    );

    const byLabel = new Map(result.quantities.map((q) => [q.label, q.value]));
    // 当前自变量 / 当前容积必须带量纲，否则 16000 无从判断是 cm³ 还是 m³
    expect(byLabel.get("当前自变量")).toContain("cm");
    expect(byLabel.get("当前容积")).toContain("cm³");
    // 瞬时导数变化率的量纲是 yUnit/xUnit
    expect(byLabel.get("瞬时导数变化率")).toContain("cm³/cm");

    // 定义域量值来自 math 层常量 L=60，避免文案里再手写一套口径
    const L = OPTIMIZATION_CONSTANTS.box.L;
    expect(byLabel.get("物理定义域")).toContain(String(L / 2));
  });

  it("右屏必须常驻呈现定义域陷阱与端点比较陷阱两条警示", () => {
    const result = buildDerivativeOptimizationPanel(
      { box_x: 10 },
      { modelType: "box" },
    );
    const warnings = result.warnings ?? [];

    expect(warnings.some((w) => w.text.includes("定义域陷阱"))).toBe(true);
    expect(warnings.some((w) => w.text.includes("端点比较陷阱"))).toBe(true);
    expect(
      warnings.every((w) => w.level === "warning" || w.level === "info"),
    ).toBe(true);
  });
});
