import { describe, it, expect } from "vitest";
import { projectPolyhedron } from "../orthographicProjection";
import {
  buildCuboidPolyhedron,
  buildRegularPyramidPolyhedron,
} from "../sectionIntersection";

describe("projectPolyhedron", () => {
  it("长方体正视图：4 条实线矩形，无虚线残留（前后棱重合已去重）", () => {
    const poly = buildCuboidPolyhedron(2, 3, 4);
    const { solid, dashed } = projectPolyhedron(poly, "front");
    expect(dashed.length).toBe(0);
    expect(solid.length).toBe(4);
    const us = solid.flatMap((s) => [s[0].u, s[1].u]);
    const vs = solid.flatMap((s) => [s[0].v, s[1].v]);
    expect(Math.max(...us) - Math.min(...us)).toBeCloseTo(2, 5);
    expect(Math.max(...vs) - Math.min(...vs)).toBeCloseTo(4, 5);
  });

  it("长方体侧视图：4 条实线矩形，宽度 = depth", () => {
    const poly = buildCuboidPolyhedron(2, 3, 4);
    const { solid, dashed } = projectPolyhedron(poly, "side");
    expect(dashed.length).toBe(0);
    expect(solid.length).toBe(4);
    const us = solid.flatMap((s) => [s[0].u, s[1].u]);
    const vs = solid.flatMap((s) => [s[0].v, s[1].v]);
    expect(Math.max(...us) - Math.min(...us)).toBeCloseTo(3, 5);
    expect(Math.max(...vs) - Math.min(...vs)).toBeCloseTo(4, 5);
  });

  it("长方体俯视图：4 条实线矩形，宽=depth, 高=width", () => {
    const poly = buildCuboidPolyhedron(2, 3, 4);
    const { solid, dashed } = projectPolyhedron(poly, "top");
    expect(dashed.length).toBe(0);
    expect(solid.length).toBe(4);
    const us = solid.flatMap((s) => [s[0].u, s[1].u]);
    const vs = solid.flatMap((s) => [s[0].v, s[1].v]);
    expect(Math.max(...us) - Math.min(...us)).toBeCloseTo(2, 5);
    expect(Math.max(...vs) - Math.min(...vs)).toBeCloseTo(3, 5);
  });

  it("长方体：俯视图 v 范围 = 侧视图 u 范围（宽相等，两者均对应 y/深度）", () => {
    const poly = buildCuboidPolyhedron(2, 3, 4);
    const top = projectPolyhedron(poly, "top");
    const side = projectPolyhedron(poly, "side");
    // 俯视图 u=x=width, v=-y=-depth；侧视图 u=-y=-depth, v=z=height
    // "宽相等"指俯视图的 v 范围 = 侧视图的 u 范围，均对应 depth=3
    const range = (d: typeof top, axis: "u" | "v") => {
      const vals = d.solid.flatMap((s) => [s[0][axis], s[1][axis]]);
      return Math.max(...vals) - Math.min(...vals);
    };
    expect(range(top, "v")).toBeCloseTo(range(side, "u"), 5);
    expect(range(top, "v")).toBeCloseTo(3, 5);
  });

  it("正四棱锥俯视图：4 条底边 + 4 条到顶点的棱线，全部可见无虚线", () => {
    const poly = buildRegularPyramidPolyhedron(4, 2, 4);
    const { solid, dashed } = projectPolyhedron(poly, "top");
    expect(dashed.length).toBe(0);
    expect(solid.length).toBe(8);
  });

  it("正四棱锥正视图：所有棱均可见，前后重合棱去重后为 5 条实线", () => {
    const poly = buildRegularPyramidPolyhedron(4, 2, 4);
    const { solid, dashed } = projectPolyhedron(poly, "front");
    // 8 条棱中：左右底棱投影退化为点（跳过），前后底棱重合（去重），
    // 前后侧棱重合（去重），最终 5 条可见实线，0 条虚线
    expect(solid.length).toBe(5);
    expect(dashed.length).toBe(0);
  });
});
