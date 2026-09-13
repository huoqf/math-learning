import { describe, it, expect } from "vitest";
import { buildVectorPolarizationApolloniusPanel } from "../vectorPolarizationApollonius";

describe("buildVectorPolarizationApolloniusPanel", () => {
  it("极化恒等式模式应包含三步推导链与母题标头", () => {
    const data = buildVectorPolarizationApolloniusPanel(
      { bcLength: 6, pointX: 2, pointY: 4 },
      { studyMode: "polarization" },
    );

    expect(data.examAnchor).toContain("向量极化恒等式");
    expect(data.reasoningSteps).toBeDefined();
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.reasoningSteps?.[0].title).toContain("审题定法");
    expect(data.reasoningSteps?.[1].title).toContain("建模联立");
    expect(data.reasoningSteps?.[2].title).toContain("代入求解");
    expect(data.theorems?.length).toBeGreaterThan(0);
    expect(data.quantities.length).toBeGreaterThan(0);
  });

  it("阿波罗尼斯圆模式应包含三步轨迹推演", () => {
    const data = buildVectorPolarizationApolloniusPanel(
      { bcLength: 6, lambda: 2, pointAngle: 45 },
      { studyMode: "apollonius" },
    );

    expect(data.examAnchor).toContain("阿波罗尼斯圆");
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.reasoningSteps?.[1].latex).toContain("x - 5");
  });

  it("综合最值模式应包含极化降维与几何区间推导", () => {
    const data = buildVectorPolarizationApolloniusPanel(
      { bcLength: 6, lambda: 2, pointAngle: 180 },
      { studyMode: "combined" },
    );

    expect(data.examAnchor).toContain("综合求最值");
    expect(data.reasoningSteps?.length).toBe(3);
    expect(data.reasoningSteps?.[0].latex).toContain(
      "\\vec{PA} \\cdot \\vec{PB}",
    );
    expect(data.reasoningSteps?.[2].latex).toContain("-8");
  });

  it("各模式定理应严格隔离，杜绝不相干跨模式堆砌", () => {
    // 模式一：只含极化恒等式，严禁出现阿波罗尼斯圆
    const polData = buildVectorPolarizationApolloniusPanel(
      { bcLength: 6, pointX: 2, pointY: 4 },
      { studyMode: "polarization" },
    );
    const polNames = polData.theorems?.map((t) => t.name).join(",") ?? "";
    expect(polNames).toContain("极化恒等式");
    expect(polNames).not.toContain("阿波罗尼斯圆");

    // 模式二：只含阿波罗尼斯圆与角平分线，严禁出现极化恒等式
    const apoData = buildVectorPolarizationApolloniusPanel(
      { bcLength: 6, lambda: 2, pointAngle: 45 },
      { studyMode: "apollonius" },
    );
    const apoNames = apoData.theorems?.map((t) => t.name).join(",") ?? "";
    expect(apoNames).toContain("阿波罗尼斯圆");
    expect(apoNames).not.toContain("极化恒等式");
  });
});
