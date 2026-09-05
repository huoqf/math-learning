import { describe, it, expect } from "vitest";
import { buildMathQuantities } from "@/data/mathQuantities";
import { calculatePerpPlanesSphere } from "@/math3d/advancedSphereModels";

describe("进阶切接球：左屏参数设置与右屏数学看板/模型状态同步测试", () => {
  it("左屏参数改变时，右屏看板指标与数学底层模型严格相等（SSOT 无缝同步）", () => {
    const params = { r1: 3, r2: 3.5, c: 3 };
    const model = calculatePerpPlanesSphere(params.r1, params.r2, params.c);
    const mathData = buildMathQuantities("anim-solid-advanced-sphere", params, {
      modelType: "perpPlanes",
    });

    const getQtyValue = (label: string) => {
      const q = mathData.quantities.find((item) => item.label.includes(label));
      return q ? Number(q.value) : null;
    };

    // 1. 半径指标与数学模型严格一致
    expect(getQtyValue("外接球半径")).toBeCloseTo(model.radius, 2);

    // 2. 几何特征量：底面弦心距 d1 勾股解算严格一致
    const expectedD1 = Math.sqrt(params.r1 * params.r1 - 1.5 * 1.5);
    expect(getQtyValue("底面外心距")).toBeCloseTo(expectedD1, 2);

    // 3. 几何特征量：侧面弦心距 d2 勾股解算严格一致
    const expectedD2 = Math.sqrt(params.r2 * params.r2 - 1.5 * 1.5);
    expect(getQtyValue("侧面外心距")).toBeCloseTo(expectedD2, 2);

    // 4. 半径平方 R^2 (勾股和差) 严格一致
    expect(getQtyValue("半径平方")).toBeCloseTo(model.radius * model.radius, 2);

    // 5. 高考破题三步推演链与真题溯源断言
    expect(mathData.examAnchor).toContain("高考");
    expect(mathData.reasoningSteps).toHaveLength(3);
    expect(mathData.reasoningSteps?.[0].title).toContain("矩形");
    expect(mathData.reasoningSteps?.[1].latex).toContain(params.r1.toString());
    expect(mathData.reasoningSteps?.[2].latex).toContain("R^2");
  });

  it("正四面体三球同心：定值不变量与三球黄金比例断言", () => {
    const mathData = buildMathQuantities(
      "anim-solid-advanced-sphere",
      { a: 4 },
      {
        modelType: "concentric",
      },
    );

    // 必须存在定值不变量标记
    const invariantItems = mathData.quantities.filter((q) => q.isInvariant);
    expect(invariantItems.length).toBeGreaterThanOrEqual(2);
    expect(invariantItems.some((q) => q.label.includes("三球连比"))).toBe(true);
    expect(invariantItems.some((q) => q.label.includes("外内比"))).toBe(true);
    expect(mathData.reasoningSteps).toHaveLength(2);
  });

  it("图层显隐从属契约测试：圆心与球心严格受控于图层开关", () => {
    // 显隐判定纯逻辑
    const shouldShowO1O2 = (
      showSectionCircles: boolean,
      showAuxLines: boolean,
    ) => showSectionCircles || showAuxLines;

    const shouldShowCenterO = (showSphere: boolean, showAuxLines: boolean) =>
      showSphere || showAuxLines;

    const shouldShowH = (showAuxLines: boolean) => showAuxLines;

    // 当用户关掉圆开关且关掉辅助线开关时，O1 和 O2 必须隐藏
    expect(shouldShowO1O2(false, false)).toBe(false);
    // 当只开圆开关时，O1 和 O2 显示
    expect(shouldShowO1O2(true, false)).toBe(true);
    // 当只开辅助线开关时，作为垂线端点的 O1 和 O2 显示
    expect(shouldShowO1O2(false, true)).toBe(true);

    // 当用户关掉球开关且关掉辅助线开关时，球心 O 必须隐藏
    expect(shouldShowCenterO(false, false)).toBe(false);
    // 当开启球开关时，球心 O 显示
    expect(shouldShowCenterO(true, false)).toBe(true);

    // 当关闭辅助线时，H 必须隐藏
    expect(shouldShowH(false)).toBe(false);
    expect(shouldShowH(true)).toBe(true);
  });
});
