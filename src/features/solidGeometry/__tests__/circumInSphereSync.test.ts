import { describe, it } from "vitest";
import { verifyTopicSyncContract } from "@/test/verifySyncContract";
import {
  calculateCuboidSphere,
  calculatePyramidSphere,
  calculatePrismSphere,
  calculateConeSphere,
  calculateCylinderSphere,
} from "@/math3d/circumInSphere";

describe("多面体与旋转体外接球、内切球：通用三屏契约同步测试", () => {
  it("验证五大几何体在切接球模式下的特征量与高考解答题三步推演链严格一致", () => {
    verifyTopicSyncContract([
      // 1. 长方体外接球
      {
        name: "长方体外接球",
        animId: "anim-solid-ball",
        modeOptions: { sphereType: "circum", shape: "cuboid" },
        params: { a: 3, b: 4, c: 12 },
        groundTruth: {
          外接球半径: calculateCuboidSphere(3, 4, 12, "circum").radius,
        },
        expectedExamAnchor: "墙角与长方体",
        expectedMnemonic: "体对角线即直径",
        expectedReasoningSymbols: ["2R = d", "d = \\sqrt"],
      },
      // 2. 正四棱锥外接球
      {
        name: "正四棱锥外接球",
        animId: "anim-solid-ball",
        modeOptions: { sphereType: "circum", shape: "regularPyramid" },
        params: { a: 4, c: 3 },
        groundTruth: {
          外接球半径: calculatePyramidSphere(4, 3, "circum").radius,
        },
        expectedExamAnchor: "正棱锥轴截面勾股",
        expectedMnemonic: "轴截面内列勾股",
        expectedReasoningSymbols: ["R^2", "(h - R)^2", "2h"],
      },
      // 3. 直三棱柱外接球
      {
        name: "直三棱柱外接球",
        animId: "anim-solid-ball",
        modeOptions: { sphereType: "circum", shape: "triangularPrism" },
        params: { a: 3, b: 4, c: 12 },
        groundTruth: {
          外接球半径: calculatePrismSphere(3, 4, 12, "circum").radius,
        },
        expectedExamAnchor: "直棱柱双外心",
        expectedMnemonic: "底面外心定水平",
        expectedReasoningSymbols: ["h/2", "r_{底}^2"],
      },
      // 4. 圆锥外接球
      {
        name: "圆锥外接球",
        animId: "anim-solid-ball",
        modeOptions: { sphereType: "circum", shape: "cone" },
        params: { a: 3, c: 4 },
        groundTruth: {
          外接球半径: calculateConeSphere(3, 4, "circum").radius,
        },
        expectedExamAnchor: "轴截面降维",
        expectedMnemonic: "过轴截面降为三角形",
        expectedReasoningSymbols: ["l^2", "2h"],
      },
      // 5. 圆柱外接球
      {
        name: "圆柱外接球",
        animId: "anim-solid-ball",
        modeOptions: { sphereType: "circum", shape: "cylinder" },
        params: { a: 3, c: 8 },
        groundTruth: {
          外接球半径: calculateCylinderSphere(3, 8, "circum").radius,
        },
        expectedExamAnchor: "轴截面矩形对角线",
        expectedMnemonic: "轴截面矩形对角线即球直径",
        expectedReasoningSymbols: ["(2R)^2", "\\frac{h}{2}"],
      },
      // 6. 正四棱锥等体积法内切球
      {
        name: "正四棱锥内切球等体积法",
        animId: "anim-solid-ball",
        modeOptions: { sphereType: "inscribed", shape: "regularPyramid" },
        params: { a: 4, c: 3 },
        groundTruth: {
          内切球半径: calculatePyramidSphere(4, 3, "inscribed").radius,
        },
        expectedExamAnchor: "等体积剖分",
        expectedMnemonic: "总体积等于各分锥之和",
        expectedReasoningSymbols: ["3V", "S_{全}"],
      },
    ]);
  });
});
