import { describe, it, expect } from "vitest";
import { buildPyramidDerivationPanel } from "../solidPyramidDerivation";

describe("buildPyramidDerivationPanel 单元测试", () => {
  describe("1. 三棱柱三分法模式 (tripartition)", () => {
    it("默认参数下能构建完整的右屏看板数据", () => {
      const data = buildPyramidDerivationPanel(
        { a: 3, b: 4, h: 6, explode: 0.3 },
        { mode: "tripartition" },
      );

      expect(data.quantities.length).toBeGreaterThanOrEqual(6);
      expect(data.theorems.length).toBeGreaterThanOrEqual(3);
      expect(data.gaokaoPoints.length).toBeGreaterThanOrEqual(1);
      expect(data.reasoningSteps?.length).toBe(3);

      // 验证数量自洽
      const vPrism = Number(
        data.quantities.find((q) => q.symbol === "V_{\\text{柱}}")?.value,
      );
      const vPyramid = Number(
        data.quantities.find((q) => q.symbol === "V_{\\text{锥}}")?.value,
      );

      expect(vPrism).toBeCloseTo(0.5 * 3 * 4 * 6, 2);
      expect(vPyramid).toBeCloseTo(vPrism / 3, 2);
    });

    it("推导链遵循审题定法、建模联立、求解反思三部曲", () => {
      const data = buildPyramidDerivationPanel(
        { a: 2, b: 3, h: 4 },
        { mode: "tripartition" },
      );
      const steps = data.reasoningSteps!;
      expect(steps[0].title).toContain("审题定法");
      expect(steps[1].title).toContain("建模联立");
      expect(steps[2].title).toContain("求解反思");
    });
  });

  describe("2. 刘徽阳马与鳖臑模式 (yangma)", () => {
    it("正确计算阳马与鳖臑体积且比值严格为 2:1", () => {
      const a = 2;
      const b = 3;
      const c = 4;
      const data = buildPyramidDerivationPanel(
        { a, b, c, explode: 0.4 },
        { mode: "yangma" },
      );

      const vYangma = Number(
        data.quantities.find((q) => q.symbol === "V_{\\text{阳马}}")?.value,
      );
      const vBienao = Number(
        data.quantities.find((q) => q.symbol === "V_{\\text{鳖臑}}")?.value,
      );
      const vQiandu = Number(
        data.quantities.find((q) => q.symbol === "V_{\\text{堑堵}}")?.value,
      );

      expect(vQiandu).toBeCloseTo(0.5 * a * b * c, 2);
      expect(vYangma).toBeCloseTo((1 / 3) * a * b * c, 2);
      expect(vBienao).toBeCloseTo((1 / 6) * a * b * c, 2);
      expect(vYangma / vBienao).toBeCloseTo(2, 4);
      expect(vYangma + vBienao).toBeCloseTo(vQiandu, 2);
    });

    it("右屏以 c 为唯一高度来源，与左中屏同源（不受三棱柱高 h 影响）", () => {
      const readQ = (
        d: ReturnType<typeof buildPyramidDerivationPanel>,
        symbol: string,
      ) => Number(d.quantities.find((q) => q.symbol === symbol)?.value);

      const normal = buildPyramidDerivationPanel(
        { a: 2, b: 3, c: 4, h: 5 },
        { mode: "yangma" },
      );
      const hChanged = buildPyramidDerivationPanel(
        { a: 2, b: 3, c: 4, h: 9 },
        { mode: "yangma" },
      );

      // 三棱柱高 h 的变化不得影响模式二看板读数
      for (const sym of [
        "c",
        "V_{\\text{堑堵}}",
        "V_{\\text{阳马}}",
        "V_{\\text{鳖臑}}",
      ]) {
        expect(readQ(hChanged, sym)).toBeCloseTo(readQ(normal, sym), 4);
      }

      // 数值须与中屏同源：V_堑堵 = 1/2·a·b·c
      expect(readQ(normal, "c")).toBeCloseTo(4, 4);
      expect(readQ(normal, "V_{\\text{堑堵}}")).toBeCloseTo(0.5 * 2 * 3 * 4, 4);
      expect(readQ(normal, "V_{\\text{阳马}}")).toBeCloseTo(
        (1 / 3) * 2 * 3 * 4,
        4,
      );
      expect(readQ(normal, "V_{\\text{鳖臑}}")).toBeCloseTo(
        (1 / 6) * 2 * 3 * 4,
        4,
      );
    });
  });
});
