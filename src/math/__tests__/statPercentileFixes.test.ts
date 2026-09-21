import { describe, it, expect } from "vitest";
import {
  evaluateSkewness,
  calculateStratifiedSampling,
  generateHistogramBins,
  calculateHistogramStats,
} from "../statPercentile";

describe("统计百分位数与偏态分布核心修复测试", () => {
  it("偏态判定：正偏态（右偏长尾）满足众数 < 中位数 < 均值", () => {
    // 众数 40，中位数 50，均值 60
    const evalResult = evaluateSkewness(40, 50, 60);
    expect(evalResult.type).toBe("right_skewed");
    expect(evalResult.title).toContain("正偏态");
    expect(evalResult.relationText).toBe("众数 < 中位数 < 均值");
  });

  it("偏态判定：负偏态（左偏长尾）满足均值 < 中位数 < 众数", () => {
    // 众数 60，中位数 50，均值 40
    const evalResult = evaluateSkewness(60, 50, 40);
    expect(evalResult.type).toBe("left_skewed");
    expect(evalResult.title).toContain("负偏态");
    expect(evalResult.relationText).toBe("均值 < 中位数 < 众数");
  });

  it("偏态判定：完全对称输入（三量恒等）判定为对称", () => {
    const evalResult = evaluateSkewness(50, 50, 50);
    expect(evalResult.type).toBe("symmetric");
    expect(evalResult.title).toBe("对称钟形分布");
    expect(evalResult.relationText).toContain("≈");
  });

  it("全域自洽：所有可达 (组数 × shift) 下方向、教材链条与推导链记号三者一致", () => {
    // 参数域：groupCount ∈ {5,6,7,8}（step=1）；shift ∈ [-1, 1]（step=0.1）。
    // 这是学生拖动滑块能够到达的全部组合，必须逐一无矛盾——旧实现 84 组中有 18 组方向相反。
    for (const binCount of [5, 6, 7, 8]) {
      for (let si = -10; si <= 10; si++) {
        const shift = si / 10;
        const bins = generateHistogramBins(shift, binCount);
        expect(bins).toHaveLength(binCount);
        const stats = calculateHistogramStats(bins);
        const res = evaluateSkewness(stats.mode, stats.median, stats.mean);

        if (shift === 0) {
          expect(stats.mode).toBeCloseTo(stats.mean, 6);
          expect(stats.median).toBeCloseTo(stats.mean, 6);
          expect(res.type).toBe("symmetric");
          continue;
        }

        if (shift > 0) {
          expect(res.type).toBe("right_skewed");
          expect(stats.mode).toBeLessThan(stats.median);
          expect(stats.median).toBeLessThan(stats.mean);
          expect(res.relationLatex).toBe("M_o < M_e < \\bar{x}");
        } else {
          expect(res.type).toBe("left_skewed");
          expect(stats.mean).toBeLessThan(stats.median);
          expect(stats.median).toBeLessThan(stats.mode);
          expect(res.relationLatex).toBe("\\bar{x} < M_e < M_o");
        }
      }
    }
  });

  it("组数滑块 7 档可达且必须真实渲染 7 组（不得静默回落为 6 组）", () => {
    const bins = generateHistogramBins(0, 7);
    expect(bins).toHaveLength(7);
    expect(bins[0].xMin).toBe(35);
    expect(bins[6].xMax).toBe(105);
    const sumFreq = bins.reduce((acc, b) => acc + b.frequency, 0);
    expect(sumFreq).toBeCloseTo(1, 6);
    // 7 组同样满足对称基形契约
    const stats = calculateHistogramStats(bins);
    expect(stats.mode).toBeCloseTo(stats.mean, 6);
  });

  it("偏态生成引擎：shift > 0 时众数偏左，长尾在右，均值大于众数", () => {
    const bins = generateHistogramBins(0.5, 6);
    const stats = calculateHistogramStats(bins);
    expect(stats.mean).toBeGreaterThan(stats.mode);
  });

  it("回归：默认 6 组对称基形必须判定为对称，众数不得被钉向低分侧", () => {
    // 断言必须从生成器出，不得手挑输入——防并列顶峰被严格取首峰而误判右偏
    const bins = generateHistogramBins(0, 6);
    const stats = calculateHistogramStats(bins);
    // 对称分布：众数取并列顶峰组中值均值，应等于均值
    expect(stats.mode).toBeCloseTo(stats.mean, 6);
    const res = evaluateSkewness(stats.mode, stats.median, stats.mean);
    expect(res.type).toBe("symmetric");
    expect(res.title).toBe("对称钟形分布");
  });

  it("分层抽样修复：当下属层人口数为0时，样本数不被强行赋值为1，总样本量精确守恒", () => {
    const totalSample = 80;
    // N1 = 1200, N2 = 800, N3 = 0
    const res = calculateStratifiedSampling(
      totalSample,
      1200,
      800,
      0,
      72,
      75,
      0,
      10,
      9,
      0,
    );

    const sumSample =
      res.strataSampleN[0] + res.strataSampleN[1] + res.strataSampleN[2];
    expect(sumSample).toBe(totalSample);
    expect(res.strataSampleN[2]).toBe(0);
  });
});
