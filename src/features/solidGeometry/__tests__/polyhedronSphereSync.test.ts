import { describe, it } from "vitest";
import { verifyTopicSyncContract } from "@/test/verifySyncContract";
import {
  calculateCornerModel,
  calculateVerticalEdgeModel,
  calculateComplementModel,
  calculateInSphereModel,
} from "@/math3d/polyhedronSphere";

describe("多面体外接球与内切球四大模型：通用三屏契约同步测试", () => {
  it("验证四大模型三屏参数、真实特征量与高考解答题三步推演链严格一致", () => {
    verifyTopicSyncContract([
      // 1. 墙角模型
      {
        name: "墙角模型",
        animId: "anim-solid-ball-models",
        modeOptions: { modelType: "corner" },
        params: { a: 3, b: 4, c: 5 },
        groundTruth: {
          外接球半径: calculateCornerModel(3, 4, 5).radius,
        },
        expectedExamAnchor: "墙角割补",
        expectedMnemonic: "三垂直棱补长方",
        expectedReasoningSymbols: ["d^2", "R"],
      },
      // 2. 侧棱垂直模型
      {
        name: "侧棱垂直模型",
        animId: "anim-solid-ball-models",
        modeOptions: { modelType: "verticalEdge" },
        params: { a: 3, b: 4, h: 4 },
        groundTruth: {
          外接球半径: calculateVerticalEdgeModel(3, 4, 4).radius,
          底面外接圆半径: calculateVerticalEdgeModel(3, 4, 4).rBase,
        },
        expectedExamAnchor: "柱体外心勾股轴线",
        expectedMnemonic: "勾股定理定乾坤",
        expectedReasoningSymbols: ["h/2", "R^2"],
      },
      // 3. 补形模型
      {
        name: "补形模型",
        animId: "anim-solid-ball-models",
        modeOptions: { modelType: "complement" },
        params: { a: 4, b: 5, c: 6 },
        groundTruth: {
          外接球半径: calculateComplementModel(4, 5, 6).radius,
        },
        expectedExamAnchor: "等面四面体",
        expectedMnemonic: "八倍球径平方和",
        expectedReasoningSymbols: ["x^2 + y^2", "(2R)^2"],
      },
      // 4. 内切球模型
      {
        name: "内切球模型",
        animId: "anim-solid-ball-models",
        modeOptions: { modelType: "inSphere" },
        params: { a: 3, b: 4, c: 5 },
        groundTruth: {
          总体积: calculateInSphereModel(3, 4, 5).totalVolume,
          内切球半径: calculateInSphereModel(3, 4, 5).inRadius,
        },
        expectedExamAnchor: "等体积剖分",
        expectedMnemonic: "等体积法核心轴",
        expectedQuantityLabels: ["内切球表面积", "内切球体积"],
      },
    ]);
  });
});
