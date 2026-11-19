import { describe, it, expect } from "vitest";
import { buildConicLineMathQuantities } from "../conicLine";
import { defaultParams as conicLineDefaults } from "@/data/registries/conicLine";
import { buildLineParamTPanel } from "../lineParamT";
import { defaultParams as lineParamTDefaults } from "@/data/registries/lineParamT";
import { buildConicHomogenizationPanel } from "../conicHomogenization";
import { defaultParams as homoDefaults } from "@/data/registries/conicHomogenization";
import { buildConicDefinitionPanel } from "../conicDefinition";
import { defaultParams as defDefaults } from "@/data/registries/conicDefinition";

describe("圆锥曲线 Builder 核心修复回归", () => {
  it("conicLine: 抛物线 k=0 水平线走一元一次分支，绝不出现除零 \\frac{1}{0}", () => {
    const panel = buildConicLineMathQuantities(
      { ...conicLineDefaults, k: 0, m: 2, p: 2 },
      { conicType: "parabola", studyMode: "general" },
    );
    const allText = JSON.stringify(panel);
    expect(allText).not.toContain("\\frac{1}{0}");
    expect(allText).not.toContain("NaN");
    expect(panel.reasoningSteps?.[0].detail).toContain("平行于抛物线对称轴");
  });

  it("conicLine: 双曲线平行渐近线 (A=0) 走一元一次直解，不输出二次方程判别式", () => {
    const panel = buildConicLineMathQuantities(
      { ...conicLineDefaults, a: 2, b: 3, k: 1.5, m: 1 },
      { conicType: "hyperbola", studyMode: "general" },
    );
    expect(panel.reasoningSteps?.[0].detail).toContain("与双曲线渐近线平行");
    expect(panel.reasoningSteps?.[1].detail).toContain("一元一次方程");
  });

  it("conicLine: 焦点弦倾角以角度值 thetaDeg 拼接 ^\\circ，不误拼弧度", () => {
    const panel = buildConicLineMathQuantities(
      { ...conicLineDefaults, k: 1, m: 0, p: 2 },
      { conicType: "parabola", studyMode: "focus" },
    );
    const step2 = panel.reasoningSteps?.[1];
    expect(step2?.detail).toContain("45^\\circ");
    expect(step2?.detail).not.toContain("0.79^\\circ");
  });

  it("lineParamT: midpoint / product / reciprocal 对应独立推演链且不含 k_norm", () => {
    const midpoint = buildLineParamTPanel(
      { ...lineParamTDefaults },
      { mode: "gaokao", conicType: "ellipse", gaokaoModel: "midpoint" },
    );
    const product = buildLineParamTPanel(
      { ...lineParamTDefaults },
      { mode: "gaokao", conicType: "ellipse", gaokaoModel: "product" },
    );
    const reciprocal = buildLineParamTPanel(
      { ...lineParamTDefaults },
      { mode: "gaokao", conicType: "ellipse", gaokaoModel: "reciprocal" },
    );

    expect(midpoint.reasoningSteps?.[1].latex).toContain("t_1 + t_2");
    expect(midpoint.reasoningSteps?.[1].latex).toContain("B = 0");
    expect(product.reasoningSteps?.[1].latex).toContain("t_1 t_2");
    expect(reciprocal.reasoningSteps?.[1].latex).toContain(
      "\\frac{1}{|P_0A|} + \\frac{1}{|P_0B|}",
    );
    expect(JSON.stringify(midpoint)).not.toContain("k_norm");
    expect(JSON.stringify(product)).not.toContain("k_norm");
  });

  it("conicHomogenization: 双曲线模式公式采用减号且 b 使用钳制后几何半轴", () => {
    const hyperbola = buildConicHomogenizationPanel(
      { ...homoDefaults, a: 2, b: 5 },
      { curveType: "hyperbola", studyMode: "shift" },
    );
    const ellipse = buildConicHomogenizationPanel(
      { ...homoDefaults, a: 2, b: 5 },
      { curveType: "ellipse", studyMode: "shift" },
    );
    expect(JSON.stringify(hyperbola)).not.toContain("NaN");
    expect(
      ellipse.quantities.some((q) => String(q.value).includes("NaN")),
    ).toBe(false);
    // 椭圆模式下 b 应受限于 a（< a），不应在主公式中出现未钳制的 5^2 > 2^2
    const ellipseHomoText = ellipse.reasoningSteps?.[1].latex ?? "";
    expect(ellipseHomoText).not.toContain("25");
  });

  it("conicDefinition: 统一定义 e 贴近 1 时无 NaN 且 gaokaoPoints 不手写拓展前缀", () => {
    const panel = buildConicDefinitionPanel(
      { ...defDefaults, e: 1.0, a: 3, c: 3 },
      { studyMode: "unifiedDef" },
    );
    expect(JSON.stringify(panel)).not.toContain("NaN");
    for (const gp of panel.gaokaoPoints) {
      expect(gp.text).not.toContain("拓展 · 超出课标");
    }
  });
});
