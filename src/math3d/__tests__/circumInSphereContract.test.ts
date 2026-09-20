import { describe, it, expect } from "vitest";
import {
  calculateCuboidSphere,
  calculatePyramidSphere,
  calculatePrismSphere,
  calculateCylinderSphere,
  calculateConeSphere,
} from "../circumInSphere";
import { distance } from "../vector3";

describe("切接球切点与半径自洽性契约测试 (P0-4 守护门禁)", () => {
  describe("1. 长方体内切球/最大内含球契约", () => {
    it("默认长方体 (a=3, b=2, c=2) 仅切于 4 个面，切点到球心距离严格等于 r=1.0", () => {
      const res = calculateCuboidSphere(3, 2, 2, "inscribed");
      expect(res.radius).toBe(1.0);
      expect(res.center).toEqual({ x: 1.5, y: 1.0, z: 1.0 });

      // 必须不存在 tFront 与 tBack（因为前后两面距离为 1.5 > r=1.0）
      expect(res.keyPoints.tFront).toBeUndefined();
      expect(res.keyPoints.tBack).toBeUndefined();
      expect(res.keyPoints.tBottom).toBeDefined();
      expect(res.keyPoints.tTop).toBeDefined();
      expect(res.keyPoints.tRight).toBeDefined();
      expect(res.keyPoints.tLeft).toBeDefined();

      // 所有导出的切点到球心欧氏距离必须等于半径
      const tangentPoints = Object.entries(res.keyPoints).filter(([k]) =>
        k.startsWith("t"),
      );
      expect(tangentPoints.length).toBe(4);
      for (const [, pt] of tangentPoints) {
        const d = distance(res.center, pt);
        expect(d).toBeCloseTo(res.radius, 4);
      }

      // 所有标为 "r" 的辅助线段长度必须等于半径（杜绝戳破球面）
      for (const seg of res.auxSegments) {
        if (seg.label === "r") {
          const segLen = distance(seg.from, seg.to);
          expect(segLen).toBeCloseTo(res.radius, 4);
        }
      }
    });

    it("正方体 (a=4, b=4, c=4) 拥有全部 6 个切点，且到球心距离全为 r=2.0", () => {
      const res = calculateCuboidSphere(4, 4, 4, "inscribed");
      expect(res.radius).toBe(2.0);
      const tangentPoints = Object.entries(res.keyPoints).filter(([k]) =>
        k.startsWith("t"),
      );
      expect(tangentPoints.length).toBe(6);
      for (const [, pt] of tangentPoints) {
        expect(distance(res.center, pt)).toBeCloseTo(2.0, 4);
      }
    });
  });

  describe("2. 直三棱柱内切球契约", () => {
    it("三棱柱切点到球心距离必须恒等于半径", () => {
      const res = calculatePrismSphere(3, 4, 10, "inscribed");
      // rBaseIn = (3+4-5)/2 = 1, h/2 = 5 => r = 1
      expect(res.radius).toBe(1);
      // h/2 = 5 > 1，因此不与上下底相切，不应输出 tBottom 与 tTop
      expect(res.keyPoints.tBottom).toBeUndefined();
      expect(res.keyPoints.tTop).toBeUndefined();

      const tangentPoints = Object.entries(res.keyPoints).filter(([k]) =>
        k.startsWith("t"),
      );
      for (const [, pt] of tangentPoints) {
        expect(distance(res.center, pt)).toBeCloseTo(res.radius, 4);
      }
      for (const seg of res.auxSegments) {
        if (seg.label === "r") {
          expect(distance(seg.from, seg.to)).toBeCloseTo(res.radius, 4);
        }
      }
    });
  });

  describe("3. 圆柱内切球契约", () => {
    it("圆柱非等高模型 (r=3, h=4) 仅切于上下底面，侧面不相切", () => {
      const res = calculateCylinderSphere(3, 4, "inscribed");
      // r = min(3, 2) = 2.0
      expect(res.radius).toBe(2.0);
      expect(res.keyPoints.tSide).toBeUndefined(); // 3 > 2，侧面不相切
      expect(res.keyPoints.tBottom).toBeDefined();
      expect(res.keyPoints.tTop).toBeDefined();

      for (const seg of res.auxSegments) {
        if (seg.label === "r") {
          expect(distance(seg.from, seg.to)).toBeCloseTo(res.radius, 4);
        }
      }
    });
  });

  describe("4. 正四棱锥与圆锥内切球契约", () => {
    it("正四棱锥切点到球心距离等于半径", () => {
      const res = calculatePyramidSphere(4, 3, "inscribed");
      const hs = Math.sqrt(3 * 3 + 2 * 2);
      const expectedR = (4 * 3) / (4 + 2 * hs);
      expect(res.radius).toBeCloseTo(expectedR, 4);

      if (res.keyPoints.tSide) {
        expect(distance(res.center, res.keyPoints.tSide)).toBeCloseTo(
          res.radius,
          4,
        );
      }
    });
  });

  describe("5. 外接球 circum 分支契约测试", () => {
    it("长方体外接球：各顶点到球心距离严格等于半径 R", () => {
      const a = 3;
      const b = 4;
      const c = 5;
      const res = calculateCuboidSphere(a, b, c, "circum");
      const expectedR = Math.sqrt(a * a + b * b + c * c) / 2;
      expect(res.radius).toBeCloseTo(expectedR, 4);

      const vertices = [
        { x: 0, y: 0, z: 0 },
        { x: a, y: 0, z: 0 },
        { x: a, y: b, z: 0 },
        { x: 0, y: b, z: 0 },
        { x: 0, y: 0, z: c },
        { x: a, y: 0, z: c },
        { x: a, y: b, z: c },
        { x: 0, y: b, z: c },
      ];
      for (const v of vertices) {
        expect(distance(res.center, v)).toBeCloseTo(res.radius, 4);
      }
    });

    it("正四棱锥外接球：顶点与底面各顶点到球心距离严格等于半径 R", () => {
      const a = 4;
      const h = 3;
      const res = calculatePyramidSphere(a, h, "circum");
      const rBase = (a * Math.SQRT2) / 2;
      const expectedR = (rBase * rBase + h * h) / (2 * h);
      expect(res.radius).toBeCloseTo(expectedR, 4);

      const S = { x: 0, y: 0, z: h };
      const baseVertices = [
        { x: -a / 2, y: -a / 2, z: 0 },
        { x: a / 2, y: -a / 2, z: 0 },
        { x: a / 2, y: a / 2, z: 0 },
        { x: -a / 2, y: a / 2, z: 0 },
      ];
      expect(distance(res.center, S)).toBeCloseTo(res.radius, 4);
      for (const v of baseVertices) {
        expect(distance(res.center, v)).toBeCloseTo(res.radius, 4);
      }
    });

    it("直三棱柱外接球：上下底面各顶点到球心距离严格等于半径 R", () => {
      const a = 3;
      const b = 4;
      const h = 6;
      const res = calculatePrismSphere(a, b, h, "circum");
      const cHyp = Math.sqrt(a * a + b * b);
      const rBaseCircum = cHyp / 2;
      const expectedR = Math.sqrt(rBaseCircum * rBaseCircum + (h / 2) ** 2);
      expect(res.radius).toBeCloseTo(expectedR, 4);

      const prismVertices = [
        { x: 0, y: 0, z: 0 },
        { x: a, y: 0, z: 0 },
        { x: 0, y: b, z: 0 },
        { x: 0, y: 0, z: h },
        { x: a, y: 0, z: h },
        { x: 0, y: b, z: h },
      ];
      for (const v of prismVertices) {
        expect(distance(res.center, v)).toBeCloseTo(res.radius, 4);
      }
    });

    it("圆柱外接球：上下底圆周特征点到球心距离严格等于半径 R", () => {
      const r = 3;
      const h = 4;
      const res = calculateCylinderSphere(r, h, "circum");
      const expectedR = Math.sqrt(r * r + (h / 2) ** 2);
      expect(res.radius).toBeCloseTo(expectedR, 4);

      const boundaryPoints = [
        { x: r, y: 0, z: 0 },
        { x: -r, y: 0, z: 0 },
        { x: 0, y: r, z: 0 },
        { x: 0, y: -r, z: 0 },
        { x: r, y: 0, z: h },
        { x: -r, y: 0, z: h },
        { x: 0, y: r, z: h },
        { x: 0, y: -r, z: h },
      ];
      for (const p of boundaryPoints) {
        expect(distance(res.center, p)).toBeCloseTo(res.radius, 4);
      }
    });

    it("圆锥外接球：顶点与底面圆周特征点到球心距离严格等于半径 R", () => {
      const r = 3;
      const h = 4;
      const res = calculateConeSphere(r, h, "circum");
      const expectedR = (r * r + h * h) / (2 * h);
      expect(res.radius).toBeCloseTo(expectedR, 4);

      const S = { x: 0, y: 0, z: h };
      expect(distance(res.center, S)).toBeCloseTo(res.radius, 4);

      const baseCirclePoints = [
        { x: r, y: 0, z: 0 },
        { x: -r, y: 0, z: 0 },
        { x: 0, y: r, z: 0 },
        { x: 0, y: -r, z: 0 },
      ];
      for (const p of baseCirclePoints) {
        expect(distance(res.center, p)).toBeCloseTo(res.radius, 4);
      }
    });
  });
});
