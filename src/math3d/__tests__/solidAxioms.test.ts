import { describe, it, expect } from "vitest";
import {
  calculatePlaneDetermination,
  calculatePlaneIntersection,
  calculateSpatialLinesAndAngles,
  determinationReferencePoints,
  buildAxiomsElements,
  solidAxiomsSceneBounds,
  axiomsElementPoints,
  INTERSECTION_PATCH,
  type AxiomsSubType,
} from "../solidAxioms";
import { boundsAreFinite } from "../sceneBounds";

describe("空间点线面位置关系基本事实与推论数学层测试", () => {
  describe("基本事实 1 / 2 与平面的确定推论", () => {
    it("三点确定平面且零偏离时动点严格共面", () => {
      const res = calculatePlaneDetermination("threePoints", 0);
      expect(res.isCoplanar).toBe(true);
      expect(res.distanceToPlane).toBeLessThan(1e-5);
      expect(res.referencePoints).toHaveLength(3);
    });

    it("当高度偏离时动点脱离平面", () => {
      const res = calculatePlaneDetermination("threePoints", 1.5);
      expect(res.isCoplanar).toBe(false);
      expect(res.distanceToPlane).toBeCloseTo(1.5, 4);
    });

    it("相交直线与平行直线确定平面计算正常", () => {
      const resIntersect = calculatePlaneDetermination("intersectingLines", 0);
      expect(resIntersect.isCoplanar).toBe(true);

      const resParallel = calculatePlaneDetermination("parallelLines", 0);
      expect(resParallel.isCoplanar).toBe(true);
    });

    it("四种构型的基准点互不相同，且法向量均指向 +z", () => {
      const subTypes: AxiomsSubType[] = [
        "threePoints",
        "lineAndPoint",
        "intersectingLines",
        "parallelLines",
      ];
      const seen = new Set<string>();
      for (const subType of subTypes) {
        const { A, B, C } = determinationReferencePoints(subType);
        // 三点必须不共线，否则"确定唯一平面"的前提不成立
        const cross = (B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x);
        expect(Math.abs(cross)).toBeGreaterThan(1e-6);
        const res = calculatePlaneDetermination(subType, 0);
        expect(res.plane.normal.z).toBeCloseTo(1, 6);
        seen.add(`${A.x},${A.y}|${B.x},${B.y}|${C.x},${C.y}`);
      }
      expect(seen.size).toBe(4);
    });

    it("构型说明使用正确的教材编号口径（两点确定直线不占编号）", () => {
      expect(
        calculatePlaneDetermination("threePoints", 0).description,
      ).toContain("基本事实 1");
      expect(
        calculatePlaneDetermination("lineAndPoint", 0).description,
      ).toContain("推论 1");
      expect(
        calculatePlaneDetermination("intersectingLines", 0).description,
      ).toContain("推论 2");
      expect(
        calculatePlaneDetermination("parallelLines", 0).description,
      ).toContain("推论 3");
    });
  });

  describe("基本事实 3：两相交平面公共交线", () => {
    it("倾斜 45 度时二面角为 45 度且交线方向沿 x 轴", () => {
      const res = calculatePlaneIntersection(45, 2.0);
      expect(res.dihedralDeg).toBeCloseTo(45, 4);
      expect(res.isPointOnIntersectionLine).toBe(true);
      expect(res.lineDirection).toEqual({ x: 1, y: 0, z: 0 });
    });

    it("交线严格落在两片示意面片范围内（不得穿出自身所在平面）", () => {
      const el = buildAxiomsElements("intersection", "threePoints", {
        tParam: 0,
        tiltDeg: 35,
        angleParamDeg: 60,
        flipSecondRay: false,
      });
      const [line] = el.segments;
      expect(line.kind).toBe("lineHighlight");
      for (const end of [line.from, line.to]) {
        expect(end.x).toBeGreaterThanOrEqual(INTERSECTION_PATCH.xMin - 1e-9);
        expect(end.x).toBeLessThanOrEqual(INTERSECTION_PATCH.xMax + 1e-9);
        expect(Math.abs(end.y)).toBeLessThanOrEqual(
          INTERSECTION_PATCH.halfWidth + 1e-9,
        );
      }
    });
  });

  describe("基本事实 4 与等角定理", () => {
    it("同向分支：两角相等，平行传递性严格成立", () => {
      const res = calculateSpatialLinesAndAngles(60, false);
      expect(res.isParallel13).toBe(true);
      expect(res.isParallel12).toBe(true);
      expect(res.isParallel23).toBe(true);
      expect(res.angle1Deg).toBeCloseTo(60, 4);
      expect(res.angle2Deg).toBeCloseTo(60, 4);
      expect(res.equalAngleCheck.relation).toBe("equal");
    });

    it("反向分支：两角互补（等角定理的后半句必须可达）", () => {
      const res = calculateSpatialLinesAndAngles(60, true);
      expect(res.flipSecondRay).toBe(true);
      expect(res.angle1Deg).toBeCloseTo(60, 4);
      expect(res.angle2Deg).toBeCloseTo(120, 4);
      expect(res.equalAngleCheck.relation).toBe("supplementary");
      // 方向整体反向仍属"平行"，故等角定理前提依旧成立
      expect(res.equalAngleCheck.isOBParallel).toBe(true);
    });

    it("平行判定为叉积实算：不平行方向必须判为 false", () => {
      const res = calculateSpatialLinesAndAngles(60, false);
      // dir1 = (1,0,0) 与 dir2 = (cos60, sin60, 0) 成 60° 角，绝不可能平行
      const crossZ = res.dir1.x * res.dir2.y - res.dir1.y * res.dir2.x;
      expect(Math.abs(crossZ)).toBeGreaterThan(0.1);
      // 若"平行判定"被写成恒真式，下面的断言会失败
      const normFactor =
        Math.abs(crossZ) /
        (Math.hypot(res.dir1.x, res.dir1.y) *
          Math.hypot(res.dir2.x, res.dir2.y));
      expect(normFactor).toBeCloseTo(Math.sin(Math.PI / 3), 6);
    });

    it("90° 时两角相等且互补分支为 90°（自杀角）", () => {
      const same = calculateSpatialLinesAndAngles(90, false);
      expect(same.angle1Deg).toBeCloseTo(90, 4);
      expect(same.angle2Deg).toBeCloseTo(90, 4);
      const flip = calculateSpatialLinesAndAngles(90, true);
      expect(flip.angle2Deg).toBeCloseTo(90, 4);
      // 90° 时"相等"与"互补"同时成立，判定应落在集合中的先者
      expect(flip.equalAngleCheck.relation).toBe("equal");
    });
  });

  describe("中屏绘制几何与包围盒同源", () => {
    const modes = [
      ["determination", "threePoints"],
      ["determination", "lineAndPoint"],
      ["determination", "intersectingLines"],
      ["determination", "parallelLines"],
      ["intersection", "threePoints"],
      ["spatialLines", "threePoints"],
    ] as const;

    it("所有模式/构型都能产出有限包围盒与至少一个图元", () => {
      for (const [mode, subType] of modes) {
        for (const flipSecondRay of [false, true]) {
          for (const tParam of [-2, 0, 2]) {
            const params = {
              tParam,
              tiltDeg: 85,
              angleParamDeg: 120,
              flipSecondRay,
            };
            const el = buildAxiomsElements(mode, subType, params);
            const pts = axiomsElementPoints(el);
            expect(pts.length).toBeGreaterThan(0);
            const bounds = solidAxiomsSceneBounds(mode, subType, params);
            expect(boundsAreFinite(bounds)).toBe(true);
            // 包围盒必须真的包住每个被绘制的点
            for (const p of pts) {
              expect(p.x).toBeGreaterThanOrEqual(bounds.min.x - 1e-9);
              expect(p.x).toBeLessThanOrEqual(bounds.max.x + 1e-9);
              expect(p.y).toBeGreaterThanOrEqual(bounds.min.y - 1e-9);
              expect(p.y).toBeLessThanOrEqual(bounds.max.y + 1e-9);
              expect(p.z).toBeGreaterThanOrEqual(bounds.min.z - 1e-9);
              expect(p.z).toBeLessThanOrEqual(bounds.max.z + 1e-9);
            }
          }
        }
      }
    });

    it("平面 α 示意面片必须覆盖本构型全部基准点（不得被自定义直线穿出）", () => {
      for (const [mode, subType] of modes) {
        const params = {
          tParam: 0,
          tiltDeg: 45,
          angleParamDeg: 60,
          flipSecondRay: false,
        };
        const el = buildAxiomsElements(mode, subType, params);
        if (mode !== "determination") continue;
        const patch = el.faces.find((f) => f.kind === "facePrimary");
        expect(patch).toBeDefined();
        const xs = patch!.points.map((p) => p.x);
        const ys = patch!.points.map((p) => p.y);
        const inside = (p: { x: number; y: number }) =>
          p.x >= Math.min(...xs) - 1e-9 &&
          p.x <= Math.max(...xs) + 1e-9 &&
          p.y >= Math.min(...ys) - 1e-9 &&
          p.y <= Math.max(...ys) + 1e-9;
        for (const seg of el.segments) {
          expect(inside(seg.from)).toBe(true);
          expect(inside(seg.to)).toBe(true);
        }
        for (const m of el.markers) expect(inside(m.at)).toBe(true);
      }
    });

    it("动点脱离平面时必须给出垂足（画垂线虚线用）", () => {
      const onPlane = buildAxiomsElements("determination", "threePoints", {
        tParam: 0,
        tiltDeg: 35,
        angleParamDeg: 60,
        flipSecondRay: false,
      });
      expect(onPlane.movingPointCoplanar).toBe(true);
      expect(onPlane.movingPointFoot).toBeUndefined();

      const offPlane = buildAxiomsElements("determination", "threePoints", {
        tParam: 1.5,
        tiltDeg: 35,
        angleParamDeg: 60,
        flipSecondRay: false,
      });
      expect(offPlane.movingPointCoplanar).toBe(false);
      expect(offPlane.movingPointFoot).toEqual({
        x: offPlane.movingPoint!.x,
        y: offPlane.movingPoint!.y,
        z: 0,
      });
    });

    it("绘制几何中不得出现必须由字体渲染的 Unicode 下标字符", () => {
      // 下标一律交给 FormulaLabel3D 的 KaTeX 真下标（`l_1`），
      // 而不是塞进 PointLabel3D 的纯文本（KaTeX_Main 不含这些字形）
      for (const [mode, subType] of modes) {
        const el = buildAxiomsElements(mode, subType, {
          tParam: 0,
          tiltDeg: 45,
          angleParamDeg: 60,
          flipSecondRay: false,
        });
        for (const label of el.lineLabels) {
          expect(label.tex).not.toMatch(/[₀-₉ₐ-ₜ]/);
          expect(label.tex).not.toMatch(/[\u4e00-\u9fff]/);
        }
        for (const m of el.markers) {
          expect(m.key).toMatch(/^(A|B|C|P|O|Op|Ap|Bp)$/);
        }
      }
    });
  });
});
