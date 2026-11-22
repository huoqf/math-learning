import { describe, it, expect } from "vitest";
import {
  buildPolyhedronConstructionSteps,
  buildCuboidConstructionSteps,
  getControlEdgeEndpoints,
  intersectLines3D,
} from "../sectionConstruction";

describe("sectionConstruction 作图推演纯函数测试", () => {
  it("intersectLines3D: 能正确求出两条共面相交直线的空间/底面交点", () => {
    const p1 = { x: 0, y: 0, z: 0 };
    const p2 = { x: 2, y: 2, z: 0 };
    const q1 = { x: 0, y: 2, z: 0 };
    const q2 = { x: 2, y: 0, z: 0 };

    const res = intersectLines3D(p1, p2, q1, q2);
    expect(res.isValid).toBe(true);
    expect(res.point.x).toBeCloseTo(1);
    expect(res.point.y).toBeCloseTo(1);
    expect(res.point.z).toBeCloseTo(0);
  });

  it("buildCuboidConstructionSteps: 正确生成 4 个步骤并在 Step 3/4 完整保留 Step 2 的延长线与外点痕迹", () => {
    const a = 3;
    const b = 3;
    const c = 3;
    const posP = 0.3;
    const posQ = 0.6;
    const posR = 0.4;

    const step1 = buildCuboidConstructionSteps(a, b, c, posP, posQ, posR, 1);
    expect(step1.step).toBe(1);
    expect(step1.activeLines.length).toBeGreaterThanOrEqual(2);
    expect(step1.rationale).toMatch(/基本事实|公理/);

    const step2 = buildCuboidConstructionSteps(a, b, c, posP, posQ, posR, 2);
    expect(step2.step).toBe(2);
    expect(step2.title).toContain("交轨法");
    // 包含延长线
    const extLinesStep2 = step2.activeLines.filter(
      (l) => l.type === "extension",
    );
    expect(extLinesStep2.length).toBeGreaterThan(0);
    // 包含外点 K1 或 K2
    const extPtsStep2 = step2.activePoints.filter((p) => p.isExternal);
    expect(extPtsStep2.length).toBeGreaterThan(0);

    const step3 = buildCuboidConstructionSteps(a, b, c, posP, posQ, posR, 3);
    expect(step3.step).toBe(3);
    expect(step3.title).toContain("底面交线");
    // 【关键断言】：Step 3 必须持续保留 Step 2 的延长线与外点痕迹！
    const extLinesStep3 = step3.activeLines.filter(
      (l) => l.type === "extension",
    );
    expect(extLinesStep3.length).toBe(extLinesStep2.length);
    const extPtsStep3 = step3.activePoints.filter((p) => p.isExternal);
    expect(extPtsStep3.length).toBe(extPtsStep2.length);

    const step4 = buildCuboidConstructionSteps(a, b, c, posP, posQ, posR, 4);
    expect(step4.step).toBe(4);
    expect(step4.partialPolygon.length).toBeGreaterThanOrEqual(3);
  });

  it("buildPolyhedronConstructionSteps: 支持正四棱锥、正三棱柱、正四面体等多种多面体", () => {
    const pyramidSteps = buildPolyhedronConstructionSteps(
      "pyramid",
      3,
      3,
      3,
      0.4,
      0.6,
      0.5,
      3,
    );
    expect(pyramidSteps.step).toBe(3);
    expect(pyramidSteps.activeLines.length).toBeGreaterThanOrEqual(2);

    const prismSteps = buildPolyhedronConstructionSteps(
      "prism",
      3,
      3,
      3,
      0.4,
      0.7,
      0.3,
      4,
    );
    expect(prismSteps.step).toBe(4);
    expect(prismSteps.partialPolygon.length).toBeGreaterThanOrEqual(3);

    const tetraSteps = buildPolyhedronConstructionSteps(
      "tetrahedron",
      3,
      3,
      0, // 默认触发 h = √2 * r
      0.4,
      0.6,
      0.5,
      4,
    );
    // 正四面体直接连线闭合，总步数为 2 步
    expect(tetraSteps.method).toBe("direct");
    expect(tetraSteps.totalSteps).toBe(2);
    expect(tetraSteps.step).toBe(2);
    expect(tetraSteps.partialPolygon.length).toBeGreaterThanOrEqual(3);
  });

  it("buildPolyhedronConstructionSteps: 支持正六边形 / 等腰梯形 / 正三角形典型预设与平行第四边分支", () => {
    const hex4 = buildPolyhedronConstructionSteps(
      "cuboid",
      3,
      3,
      3,
      0.5,
      0.5,
      0.5,
      4,
      "cubeHexagon",
    );
    expect(hex4.method).toBe("intersection");
    expect(hex4.totalSteps).toBe(4);
    expect(hex4.partialPolygon.length).toBe(6);

    const trap2 = buildPolyhedronConstructionSteps(
      "cuboid",
      3,
      3,
      3,
      0.5,
      0.5,
      0.5,
      2,
      "cubeTrapezoid",
    );
    expect(trap2.activeLines.some((l) => l.label === "RS ∥ PQ")).toBe(true);

    const trap3 = buildPolyhedronConstructionSteps(
      "cuboid",
      3,
      3,
      3,
      0.5,
      0.5,
      0.5,
      3,
      "cubeTrapezoid",
    );
    expect(trap3.method).toBe("parallel");
    expect(trap3.totalSteps).toBe(3);
    expect(trap3.partialPolygon.length).toBe(4);

    const tri2 = buildPolyhedronConstructionSteps(
      "cuboid",
      3,
      3,
      3,
      0.6,
      0.6,
      0.6,
      2,
      "cubeTriangle",
    );
    expect(tri2.method).toBe("direct");
    expect(tri2.totalSteps).toBe(2);
    expect(tri2.partialPolygon.length).toBe(3);

    // 自由模式中 posP === posQ 触发面面平行第四边分支
    const parallelFree = buildCuboidConstructionSteps(
      3,
      3,
      3,
      0.4,
      0.4,
      0.5,
      3,
    );
    expect(parallelFree.method).toBe("parallel");
    expect(parallelFree.totalSteps).toBe(3);
    expect(parallelFree.partialPolygon.length).toBe(4);
  });

  it("getControlEdgeEndpoints: 五种多面体均返回三条非退化控制侧棱端点", () => {
    const kinds = [
      "cuboid",
      "pyramid",
      "tetrahedron",
      "prism",
      "frustum",
    ] as const;
    for (const kind of kinds) {
      const edges = getControlEdgeEndpoints(kind, 3, 3, 3);
      expect(edges.length).toBe(3);
      for (const edge of edges) {
        const len = Math.hypot(
          edge.end.x - edge.start.x,
          edge.end.y - edge.start.y,
          edge.end.z - edge.start.z,
        );
        expect(len).toBeGreaterThan(0.5);
      }
    }
  });
});
