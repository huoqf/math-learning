import { describe, it, expect } from "vitest";
import {
  computeClassicalProbability,
  formatFractionLatex,
  formatReducedFractionLatex,
} from "../probabilityClassical";

describe("古典概型纯数学计算层 (computeClassicalProbability)", () => {
  it("约分函数输出正确 LaTeX", () => {
    expect(formatFractionLatex(6, 36)).toBe("\\frac{6}{36}");
    expect(formatReducedFractionLatex(6, 36)).toBe(
      "\\frac{6}{36} = \\frac{1}{6}",
    );
    expect(formatReducedFractionLatex(7, 10)).toBe("\\frac{7}{10}");
    expect(formatReducedFractionLatex(10, 10)).toBe("1");
    expect(formatReducedFractionLatex(0, 10)).toBe("0");
  });

  it("两枚均匀骰子：和为 7 的等可能样本点为 6 个，概率为 1/6", () => {
    const res = computeClassicalProbability({
      modelType: "dice_two",
      targetEvent: "sum_k",
      targetSum: 7,
    });
    expect(res.totalCount).toBe(36);
    expect(res.eventCount).toBe(6);
    expect(res.probability).toBeCloseTo(6 / 36);
    expect(res.reducedFractionLatex).toContain("\\frac{1}{6}");
    expect(res.isEquiprobable).toBe(true);
    expect(res.complementCount).toBe(30);
    expect(res.probability + res.complementProbability).toBeCloseTo(1.0);
  });

  it("两枚均匀骰子：点数相同为 6 个，概率为 1/6", () => {
    const res = computeClassicalProbability({
      modelType: "dice_two",
      targetEvent: "same",
    });
    expect(res.eventCount).toBe(6);
    expect(res.reducedFractionLatex).toContain("\\frac{1}{6}");
  });

  it("摸球抽样：2 红 3 白无放回摸 2 球，至少 1 红事件的概率为 7/10", () => {
    const res = computeClassicalProbability({
      modelType: "ball_draw",
      targetEvent: "at_least_one_red",
      drawMode: "without_replacement",
      redBalls: 2,
      whiteBalls: 3,
    });
    // 无放回有序对总数 5*4 = 20
    expect(res.totalCount).toBe(20);
    // 全白有序对 3*2 = 6，故至少一红有 20 - 6 = 14
    expect(res.eventCount).toBe(14);
    expect(res.probability).toBeCloseTo(0.7);
    expect(res.reducedFractionLatex).toBe("\\frac{14}{20} = \\frac{7}{10}");
  });

  it("抛掷 3 次硬币：树状图 8 个样本点，恰好 2 正为 3 个，概率 3/8", () => {
    const res = computeClassicalProbability({
      modelType: "coin_toss",
      targetEvent: "two_heads",
    });
    expect(res.totalCount).toBe(8);
    expect(res.eventCount).toBe(3);
    expect(res.probability).toBeCloseTo(3 / 8);
    expect(res.treeNodes?.length).toBe(1 + 2 + 4 + 8); // 15 个树节点
  });

  it("高考选人模型：3 男 2 女选 2 人，至少 1 名女生的概率为 7/10", () => {
    const res = computeClassicalProbability({
      modelType: "gaokao_volunteer",
      targetEvent: "at_least_one_girl",
    });
    expect(res.totalCount).toBe(10);
    // 全男为 C_3^2 = 3，至少一女为 10 - 3 = 7
    expect(res.eventCount).toBe(7);
    expect(res.probability).toBeCloseTo(0.7);
    expect(res.reducedFractionLatex).toBe("\\frac{7}{10}");
  });
});
