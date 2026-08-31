import { describe, it, expect } from "vitest";
import {
  add,
  sub,
  scale,
  dot,
  cross,
  norm,
  normalize,
  angleBetween,
  distance,
} from "../vector3";

describe("vector3 基础向量代数纯函数", () => {
  it("add adds two vectors", () => {
    expect(add({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 })).toEqual({
      x: 5,
      y: 7,
      z: 9,
    });
  });

  it("sub subtracts two vectors", () => {
    expect(sub({ x: 4, y: 5, z: 6 }, { x: 1, y: 2, z: 3 })).toEqual({
      x: 3,
      y: 3,
      z: 3,
    });
  });

  it("scale multiplies by scalar", () => {
    expect(scale({ x: 1, y: 2, z: 3 }, 2)).toEqual({ x: 2, y: 4, z: 6 });
  });

  it("dot computes dot product", () => {
    expect(dot({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toBe(0);
    expect(dot({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 })).toBe(32);
  });

  it("cross computes cross product", () => {
    expect(cross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toEqual({
      x: 0,
      y: 0,
      z: 1,
    });
  });

  it("norm computes magnitude", () => {
    expect(norm({ x: 3, y: 4, z: 0 })).toBe(5);
  });

  it("normalize produces unit vector", () => {
    const n = normalize({ x: 3, y: 4, z: 0 });
    expect(norm(n)).toBeCloseTo(1, 5);
    expect(n.x).toBeCloseTo(0.6, 5);
    expect(n.y).toBeCloseTo(0.8, 5);
  });

  it("normalize returns zero for zero vector", () => {
    expect(normalize({ x: 0, y: 0, z: 0 })).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("angleBetween computes angle between vectors", () => {
    expect(
      angleBetween({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }),
    ).toBeCloseTo(Math.PI / 2, 5);
    expect(
      angleBetween({ x: 1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }),
    ).toBeCloseTo(0, 5);
    // 钝角测试
    expect(
      angleBetween({ x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }),
    ).toBeCloseTo(Math.PI, 5);
  });

  it("distance computes Euclidean distance", () => {
    expect(distance({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 })).toBe(1);
    expect(distance({ x: 0, y: 0, z: 0 }, { x: 0, y: 3, z: 4 })).toBe(5);
  });
});
