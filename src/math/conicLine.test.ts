import { describe, it, expect } from "vitest";
import {
  solveConicLineIntersection,
  type ConicType,
  type StudyMode,
  type ConicLineParams,
} from "./conicLine";

describe("solveConicLineIntersection", () => {
  it("应当正确计算直线与椭圆相交、相切、相离", () => {
    // 椭圆 x^2/9 + y^2/4 = 1 (a=3, b=2)
    // 直线 y = 0 => 与椭圆相交于 (3,0) 和 (-3,0), 弦长 6
    const resSecant = solveConicLineIntersection({
      conicType: "ellipse",
      studyMode: "general",
      a: 3,
      b: 2,
      p: 2,
      k: 0,
      m: 0,
    });
    expect(resSecant.status).toBe("secant");
    expect(resSecant.intersectionCount).toBe(2);
    expect(resSecant.chordLength).toBeCloseTo(6, 4);

    // 直线 y = 2 => 与椭圆相切于 (0, 2)
    const resTangent = solveConicLineIntersection({
      conicType: "ellipse",
      studyMode: "general",
      a: 3,
      b: 2,
      p: 2,
      k: 0,
      m: 2,
    });
    expect(resTangent.status).toBe("tangent");
    expect(resTangent.intersectionCount).toBe(1);
    expect(resTangent.intersections[0].x).toBeCloseTo(0, 4);
    expect(resTangent.intersections[0].y).toBeCloseTo(2, 4);

    // 直线 y = 3 => 与椭圆相离
    const resDisjoint = solveConicLineIntersection({
      conicType: "ellipse",
      studyMode: "general",
      a: 3,
      b: 2,
      p: 2,
      k: 0,
      m: 3,
    });
    expect(resDisjoint.status).toBe("disjoint");
    expect(resDisjoint.intersectionCount).toBe(0);
  });

  it("应当检测双曲线平行于渐近线的退化情况", () => {
    // 双曲线 x^2/9 - y^2/4 = 1 (a=3, b=2), 渐近线斜率 b/a = 2/3 ≈ 0.66667
    const resParallel = solveConicLineIntersection({
      conicType: "hyperbola",
      studyMode: "general",
      a: 3,
      b: 2,
      p: 2,
      k: 2 / 3,
      m: 1,
    });
    expect(resParallel.status).toBe("degenerated_parallel");
    expect(resParallel.intersectionCount).toBe(1);
  });

  it("应当正确计算抛物线焦点弦长与通径", () => {
    // 抛物线标准方程 y^2 = 2px (取焦准距 p=2 => y^2 = 4x), 焦点坐标 (p/2, 0) = (1, 0)
    // 垂直于对称轴的焦点弦（即通径）：theta = PI/2 => 通径长度 |AB| = 2p = 4
    const resFocus = solveConicLineIntersection({
      conicType: "parabola",
      studyMode: "focus",
      a: 3,
      b: 2,
      p: 2,
      k: 0,
      m: 0,
      theta: Math.PI / 2,
    });
    expect(resFocus.isFocusChord).toBe(true);
    expect(resFocus.chordLength).toBeCloseTo(4, 3);
  });

  it("应当正确计算椭圆点差法斜率积", () => {
    // 椭圆 x^2/9 + y^2/4 = 1 (a=3, b=2)
    // -b^2/a^2 = -4/9 ≈ -0.4444
    const resMid = solveConicLineIntersection({
      conicType: "ellipse",
      studyMode: "midpoint",
      a: 3,
      b: 2,
      p: 2,
      k: 1,
      m: 0,
      midpointX: 1,
      midpointY: 1,
    });
    expect(resMid.pointDiffSlopeProduct).toBeCloseTo(-4 / 9, 3);
  });

  it("应当正确计算双曲线与抛物线点差法", () => {
    // 双曲线 x^2/9 - y^2/4 = 1 (a=3, b=2)
    // 中点 M(1, 2) (满足 x0^2/a^2 - y0^2/b^2 < 0 保证中点弦存在)
    // k_AB * k_OM = b^2/a^2 = 4/9 ≈ 0.4444
    const resHyp = solveConicLineIntersection({
      conicType: "hyperbola",
      studyMode: "midpoint",
      a: 3,
      b: 2,
      p: 2,
      k: 1,
      m: 0,
      midpointX: 1,
      midpointY: 2,
    });
    expect(resHyp.status).toBe("secant");
    expect(resHyp.pointDiffSlopeProduct).toBeCloseTo(4 / 9, 3);

    // 抛物线 y^2 = 2px (p=2) => k_AB * y0 = p => k_AB = p / y0
    // 取中点 M(1, 2) => k_AB = 2 / 2 = 1
    const resPara = solveConicLineIntersection({
      conicType: "parabola",
      studyMode: "midpoint",
      a: 3,
      b: 2,
      p: 2,
      k: 0,
      m: 0,
      midpointX: 1,
      midpointY: 2,
    });
    expect(resPara.slopeAB).toBeCloseTo(1, 4);
    expect(resPara.midpoint?.y).toBeCloseTo(2, 4);
  });

  it("应当正确计算极点极线/切点弦模式 (polePolar)", () => {
    // 椭圆 x^2/16 + y^2/9 = 1 (a=4, b=3)
    // 外部极点 P(4, 3) 引切点弦: (4x)/16 + (3y)/9 = 1 => x/4 + y/3 = 1 => y = -3/4 x + 3
    const resPolar = solveConicLineIntersection({
      conicType: "ellipse",
      studyMode: "polePolar",
      a: 4,
      b: 3,
      p: 2,
      k: 0,
      m: 0,
      poleX: 4,
      poleY: 3,
    });
    // k = -3/4 = -0.75, m = 3
    expect(resPolar.slopeAB).toBeCloseTo(-0.75, 4);
    expect(resPolar.status).toBe("secant");
    expect(resPolar.intersectionCount).toBe(2);
    // 两切点分别为 (4, 0) 和 (0, 3)
    const pts = resPolar.intersections;
    expect(
      pts.some((pt) => Math.abs(pt.x - 4) < 1e-3 && Math.abs(pt.y) < 1e-3),
    ).toBe(true);
    expect(
      pts.some((pt) => Math.abs(pt.x) < 1e-3 && Math.abs(pt.y - 3) < 1e-3),
    ).toBe(true);
  });

  it("应当正确计算椭圆通径铅垂线解析解与焦半径倒数和", () => {
    // 椭圆 a=3, b=2 => 通径 2b^2/a = 8/3 ≈ 2.6667, 理论倒数和 2a/b^2 = 6/4 = 1.5
    const res = solveConicLineIntersection({
      conicType: "ellipse",
      studyMode: "focus",
      a: 3,
      b: 2,
      p: 2,
      k: 0,
      m: 0,
      theta: Math.PI / 2,
    });
    expect(res.isVertical).toBe(true);
    expect(res.status).toBe("secant");
    expect(res.chordLength).toBeCloseTo(8 / 3, 4);
    expect(res.harmonicSum).toBeCloseTo(1.5, 4);
    expect(res.theoreticalHarmonicSum).toBeCloseTo(1.5, 4);
  });

  it("应当正确验证抛物线焦半径倒数和与倾斜角无关（定值 2/p）", () => {
    // 抛物线 p=2 => 焦半径倒数和 2/p = 1
    const resTheta1 = solveConicLineIntersection({
      conicType: "parabola",
      studyMode: "focus",
      a: 3,
      b: 2,
      p: 2,
      k: 0,
      m: 0,
      theta: Math.PI / 4,
    });
    expect(resTheta1.harmonicSum).toBeCloseTo(1, 4);

    const resTheta2 = solveConicLineIntersection({
      conicType: "parabola",
      studyMode: "focus",
      a: 3,
      b: 2,
      p: 2,
      k: 0,
      m: 0,
      theta: Math.PI / 3,
    });
    expect(resTheta2.harmonicSum).toBeCloseTo(1, 4);
  });

  it("应当正确识别点差法中点落在曲线外部的越界相离情形", () => {
    // 椭圆 a=3, b=2, 点 M(3, 2) 在外部 (9/9 + 4/4 = 2 > 1)
    const res = solveConicLineIntersection({
      conicType: "ellipse",
      studyMode: "midpoint",
      a: 3,
      b: 2,
      p: 2,
      k: 0,
      m: 0,
      midpointX: 3,
      midpointY: 2,
    });
    expect(res.isMidpointValid).toBe(false);
    expect(res.status).toBe("disjoint");
  });

  it("应当针对不同圆锥曲线返回深度特化的典型预设", async () => {
    const { getConicLinePresets } = await import("@/data/registries/conicLine");
    const ellipseGeneral = getConicLinePresets("ellipse", "general");
    const hyperbolaGeneral = getConicLinePresets("hyperbola", "general");
    const parabolaGeneral = getConicLinePresets("parabola", "general");

    expect(ellipseGeneral.some((p) => p.key === "tangent")).toBe(true);
    expect(hyperbolaGeneral.some((p) => p.key === "asymptote_parallel")).toBe(
      true,
    );
    expect(parabolaGeneral.some((p) => p.key === "axis_parallel")).toBe(true);
  });

  it("应当在右屏数据中实现严格的模式隔离并遵循代数三部曲", async () => {
    const { buildConicLineMathQuantities } =
      await import("@/data/builders/conicLine");

    // general 模式
    const generalData = buildConicLineMathQuantities(
      { a: 3, b: 2, p: 2, k: 0.5, m: 0.5 },
      { conicType: "ellipse", studyMode: "general" },
    );
    // 不应含有中点弦或极点极线的定理
    expect(generalData.theorems.some((t) => t.name.includes("点差法"))).toBe(
      false,
    );
    expect(
      generalData.theorems.some((t) => t.name.includes("极点与极线")),
    ).toBe(false);
    expect(generalData.theorems.length).toBe(1);

    // 推导链必须遵循规范的三步推演链结构（审题建模 -> 判别式韦达 -> 弦长求解）
    expect(generalData.reasoningSteps?.length).toBe(3);
    const step1 = generalData.reasoningSteps?.[0];
    expect(step1?.title).toContain("联立");
    expect(step1?.latex).toContain("\\implies");
    const step2 = generalData.reasoningSteps?.[1];
    expect(step2?.title).toContain("判别式");
    expect(step2?.latex).toContain("\\Delta");
    const step3 = generalData.reasoningSteps?.[2];
    expect(step3?.title).toContain("弦长");
    expect(step3?.latex).toContain("|AB|");

    // midpoint 模式
    const midpointData = buildConicLineMathQuantities(
      { a: 3, b: 2, p: 2, midpointX: 1, midpointY: 1 },
      { conicType: "ellipse", studyMode: "midpoint" },
    );
    expect(midpointData.theorems.length).toBe(1);
    expect(midpointData.theorems[0].name).toContain("点差法");
    expect(
      midpointData.gaokaoPoints.every((p) => p.text.includes("点差")),
    ).toBe(true);
  });

  it("应当保证全部12组自由探究预设的基准参数数学合规且几何健康", async () => {
    const { presetsByConicAndMode } =
      await import("@/data/registries/conicLine");
    const curves: ConicType[] = ["ellipse", "hyperbola", "parabola"];
    const modes: StudyMode[] = ["general", "focus", "midpoint", "polePolar"];

    for (const c of curves) {
      for (const m of modes) {
        const presets = presetsByConicAndMode[c]?.[m];
        const free = presets?.find((p) => p.key === "free");
        expect(free, `自由探究必须存在于 ${c}-${m}`).toBeDefined();
        expect(
          Object.keys(free!.params).length,
          `自由探究必须包含健康基准参数: ${c}-${m}`,
        ).toBeGreaterThan(0);

        const res = solveConicLineIntersection({
          conicType: c,
          studyMode: m,
          ...free!.params,
        } as ConicLineParams);

        // 自由探究默认构型下，中点弦中点必须有效，且必须存在相交割线或实切线
        if (m === "midpoint") {
          expect(res.isMidpointValid, `${c}-${m} 自由探究中点必须有效`).toBe(
            true,
          );
          expect(
            res.intersections.length,
            `${c}-${m} 自由探究必须有实弦交点`,
          ).toBe(2);
        } else if (m === "polePolar") {
          expect(
            res.intersections.length,
            `${c}-${m} 自由探究极点必须能引出2条切线`,
          ).toBe(2);
        } else {
          expect(res.status, `${c}-${m} 自由探究不得为相离`).not.toBe(
            "disjoint",
          );
          expect(
            res.intersections.length,
            `${c}-${m} 自由探究必须有至少1个交点`,
          ).toBeGreaterThan(0);
        }

        // 交点必须落在可观测视口 [-6.5, 6.5] 范围内
        res.intersections.forEach((pt) => {
          expect(Math.abs(pt.x), `${c}-${m} 交点 x 必须在视口内`).toBeLessThan(
            6.5,
          );
          expect(Math.abs(pt.y), `${c}-${m} 交点 y 必须在视口内`).toBeLessThan(
            6.5,
          );
        });
      }
    }
  });
});
