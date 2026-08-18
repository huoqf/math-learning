import { describe, it, expect } from "vitest";
import {
  judgeLinePlane,
  getLineDirection,
  calcLinePlaneAngle,
  judgeLineParallel,
  judgePlaneParallel,
  calcPyramidModel,
  projectPointToPlane,
} from "../lineRelation";

describe("lineRelation 3D 数学纯函数测试", () => {
  const horizontalPlane = {
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 0, z: 1 },
  };

  it("正确判断平行与面内", () => {
    const dirHorizontal = { x: 1, y: 1, z: 0 };
    expect(
      judgeLinePlane(dirHorizontal, horizontalPlane, { x: 0, y: 0, z: 2 }),
    ).toBe("parallel");
    expect(
      judgeLinePlane(dirHorizontal, horizontalPlane, { x: 0, y: 0, z: 0 }),
    ).toBe("inPlane");
  });

  it("正确判断垂直与相交", () => {
    const dirVertical = { x: 0, y: 0, z: 1 };
    expect(
      judgeLinePlane(dirVertical, horizontalPlane, { x: 1, y: 1, z: 1 }),
    ).toBe("perpendicular");

    const dirSlanted = { x: 1, y: 0, z: 1 };
    expect(
      judgeLinePlane(dirSlanted, horizontalPlane, { x: 0, y: 0, z: 1 }),
    ).toBe("intersect");
  });

  it("正确计算线面角与正弦值", () => {
    const dir30 = getLineDirection(30, 0); // 仰角 30°
    const angle = calcLinePlaneAngle(dir30, horizontalPlane.normal);
    expect(angle.thetaDeg).toBeCloseTo(30, 1);
    expect(angle.sinTheta).toBeCloseTo(0.5, 2);
  });

  it("四棱锥母题动点平行判定", () => {
    // 当 lambdaE == lambdaF = 0.5 时，EF 为中位线，EF ∥ BC ∥ 面 ABCD
    const res = calcPyramidModel(4, 3, 3.5, 0.5, 0.5);
    expect(res.isEFParallelBase).toBe(true);
    expect(res.isEFParallelPlanePAD).toBe(true);

    // 当比例不相等时，EF 与底面不平行
    const resDiff = calcPyramidModel(4, 3, 3.5, 0.3, 0.7);
    expect(resDiff.isEFParallelBase).toBe(false);
  });

  it("正确计算点到平面垂足", () => {
    const foot = projectPointToPlane({ x: 2, y: 3, z: 5 }, horizontalPlane);
    expect(foot).toEqual({ x: 2, y: 3, z: 0 });
  });

  it("正确判断两线平行与两面平行", () => {
    expect(judgeLineParallel({ x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 })).toBe(
      true,
    );
    expect(judgeLineParallel({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toBe(
      false,
    );

    expect(judgePlaneParallel({ x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 2 })).toBe(
      true,
    );
    expect(judgePlaneParallel({ x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 0 })).toBe(
      false,
    );
  });
});
