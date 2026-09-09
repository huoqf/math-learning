import { describe, it, expect } from "vitest";
import { verifyTopicSyncContract } from "./verifySyncContract";
import { buildTranscendentalPanel } from "@/data/builders/transcendental";
import { buildSpatialDistancePanel } from "@/data/builders/solidSpatialDistance";

describe("高中数学核心专题三屏数据一致性与高考推演链契约测试", () => {
  it("立体几何：多面体外接球墙角模型应当满足三屏数值一致性与高考三步推演链", () => {
    // 墙角模型：侧棱 a=3, b=4, c=5 两两垂直
    // 体对角线 d = sqrt(3^2 + 4^2 + 5^2) = sqrt(50) = 5*sqrt(2) ≈ 7.0711
    // 外接球半径 R = d / 2 = 2.5 * sqrt(2) ≈ 3.5355
    const dVal = Math.sqrt(9 + 16 + 25);
    const rVal = dVal / 2;

    verifyTopicSyncContract([
      {
        name: "墙角外接球割补模型",
        animId: "anim-solid-ball-models",
        modeOptions: { modelType: "corner" },
        params: { a: 3, b: 4, c: 5 },
        lessonType: "gaokao_topic",
        groundTruth: {
          补形体对角线: dVal,
          外接球半径: rVal,
        },
        expectedExamAnchor: "墙角割补",
        expectedMnemonic: "三垂直棱补长方",
        expectedReasoningSymbols: ["2R", "d^2", "a^2 + b^2 + c^2"],
        expectedQuantityLabels: ["补形体对角线", "外接球半径", "外接球表面积"],
        forbiddenTheoremKeywords: ["柱体", "汉堡"],
        expectedTheoremsKeywords: ["墙角模型"],
      },
    ]);
  });

  it("立体几何：直三棱柱外接球圆柱体模型应当满足直径公式与采分点规范", () => {
    // 柱体模型：底面为直角边 a=3, b=4 的直角三角形，斜边长 c_base = 5，底面外接圆半径 r_base = 2.5
    // 柱体高 h=4
    // 球直径 2R = sqrt((2r_base)^2 + h^2) = sqrt(5^2 + 4^2) = sqrt(41) ≈ 6.4031
    // 球半径 R = sqrt(41) / 2 ≈ 3.2016
    const a = 3;
    const b = 4;
    const h = 4;
    const cBase = Math.sqrt(a * a + b * b);
    const rVal = Math.sqrt(cBase * cBase + h * h) / 2;

    verifyTopicSyncContract([
      {
        name: "直棱柱/圆柱外接球模型",
        animId: "anim-solid-ball-models",
        modeOptions: { modelType: "cylinder" },
        params: { a, b, h },
        lessonType: "gaokao_topic",
        groundTruth: {
          外接球半径: rVal,
        },
        expectedExamAnchor: "柱体模型",
        expectedMnemonic: "直棱柱外接球",
        expectedReasoningSymbols: ["2R", "h^2"],
        expectedQuantityLabels: [
          "底面外接圆半径",
          "外接球半径",
          "外接球表面积",
        ],
        forbiddenTheoremKeywords: ["长方体", "墙角"],
        expectedTheoremsKeywords: ["柱体模型"],
      },
    ]);
  });

  it("导数大题：隐零点定理代换消元模型数值必须严格同步", () => {
    // f(x) = x ln x + 0.5x^2 - a x, a = 2.0
    // f'(x0) = 0 => x0 = 1, y0 = -1.5, 轨迹 h(1) = -1.5
    verifyTopicSyncContract([
      {
        name: "隐零点消元模型 (x ln x)",
        animId: "anim-derivative-shift",
        modeOptions: { activeMode: "implicit_zero", subModel: "x_ln_x" },
        params: { a: 2.0 },
        lessonType: "concept",
        groundTruth: {
          隐零点横坐标: 1.0,
          "极值 (原函数)": -1.5,
          代换消元下沉: -1.5,
        },
        expectedQuantityLabels: ["隐零点横坐标", "极值 (代换消元下沉)"],
      },
    ]);
  });

  it("导数大题：经典极值点偏移右偏模型数值与结论一致性", () => {
    // f(x) = x e^(-x), 极大值点 x0 = 1, y0 = 1/e ≈ 0.367879
    // 割线高度 k = 0.25
    verifyTopicSyncContract([
      {
        name: "极值点偏移右偏模型 (xe^-x)",
        animId: "anim-derivative-shift",
        modeOptions: { activeMode: "shift_symmetric", subModel: "xe_neg_x" },
        params: { k: 0.25 },
        lessonType: "concept",
        groundTruth: {},
        expectedQuantityLabels: [
          "极值点",
          "割线左根",
          "割线右根",
          "极值点加法偏移",
        ],
      },
    ]);
  });

  it("条件概率与贝叶斯：罕见病筛查假阳性反直觉诊断模型一致性", () => {
    verifyTopicSyncContract([
      {
        name: "贝叶斯诊断假阳性模型",
        animId: "anim-probability-bayes",
        modeOptions: { activeMode: "bayes" },
        params: { pPriorD: 0.02, pSensitivity: 0.95, pFalsePositive: 0.05 },
        lessonType: "concept",
        groundTruth: {},
        expectedQuantityLabels: [
          "先验患病率",
          "真阳性率",
          "假阳性误报率",
          "总体阳性检出率",
          "阳性后验患病率",
        ],
      },
    ]);
  });

  it("超越函数切线放缩：看板构建、跨模式隔离与临界预警契约验证", () => {
    // 1. e^x >= ax + 1 模型: a <= 1 无警告, a > 1 有警告
    const panelAx1Ok = buildTranscendentalPanel(
      { a: 1.0 },
      { mode: "param", subMode: "exp_ax_1" },
    );
    expect(panelAx1Ok.warnings.length).toBe(0);

    const panelAx1Warn = buildTranscendentalPanel(
      { a: 1.2 },
      { mode: "param", subMode: "exp_ax_1" },
    );
    expect(panelAx1Warn.warnings.length).toBe(1);

    // 2. e^x >= ax 过原点模型: a <= e (如 a = 2.0) 不应触发警告
    const panelAxOk = buildTranscendentalPanel(
      { a: 2.0 },
      { mode: "param", subMode: "exp_ax" },
    );
    expect(panelAxOk.warnings.length).toBe(0);

    // a > e 触发警告
    const panelAxWarn = buildTranscendentalPanel(
      { a: 3.0 },
      { mode: "param", subMode: "exp_ax" },
    );
    expect(panelAxWarn.warnings.length).toBe(1);

    // 3. 跨模式定理与考点隔离核验 (严禁显示不相干内容)
    const expPanel = buildTranscendentalPanel({ x0: 0 }, { mode: "exp" });
    expect(expPanel.theorems[0].name).toContain("指数基准切线");
    expect(expPanel.theorems[0].level).toBe("core");
    // 严格断言：指数模式下绝不能出现对数定理或夹逼定理
    expect(
      expPanel.theorems.some(
        (t) => t.name.includes("对数") || t.name.includes("夹逼"),
      ),
    ).toBe(false);
    expect(
      expPanel.gaokaoPoints.some(
        (gp) => gp.text.includes("对数") || gp.text.includes("夹逼"),
      ),
    ).toBe(false);

    // 次级切点 x0=1 下，切线为 y = ex，相切处差值必须为 0.000
    const expTangent1Panel = buildTranscendentalPanel(
      { x0: 1.0 },
      { mode: "exp", subMode: "tangent_1" },
    );
    const diffQty = expTangent1Panel.quantities.find((q) =>
      q.label.includes("放缩差值"),
    );
    expect(diffQty).toBeDefined();
    expect(Number(diffQty?.value)).toBeCloseTo(0.0, 3);

    const logPanel = buildTranscendentalPanel({ x0: 1 }, { mode: "log" });
    expect(logPanel.theorems[0].name).toContain("对数基准切线");
    expect(logPanel.theorems[0].level).toBe("core");
    expect(
      logPanel.theorems.some(
        (t) => t.name.includes("指数基准") || t.name.includes("夹逼"),
      ),
    ).toBe(false);

    const chainPanel = buildTranscendentalPanel({}, { mode: "chain" });
    expect(chainPanel.theorems.some((t) => t.name.includes("夹逼"))).toBe(true);
    expect(chainPanel.theorems.some((t) => t.name.includes("求参"))).toBe(
      false,
    );
  });

  it("立体几何：异面直线公垂线与空间距离极值应当满足三步推演与极值双直角契约", () => {
    const a = 3;
    const b = 3;
    const c = 3;
    const minDist = Math.sqrt(3);
    const panel = buildSpatialDistancePanel(
      { a, b, c, lambda: 2 / 3, mu: 1 / 3 },
      { mode: "skewDistance", preset: "cube" },
    );

    const distQty = panel.quantities.find((q) =>
      q.label.includes("公垂线最短距离"),
    );
    expect(distQty).toBeDefined();
    expect(Number(distQty?.value)).toBeCloseTo(minDist, 4);
    expect(panel.reasoningSteps?.length).toBe(3);
    expect(panel.theorems.some((t) => t.name.includes("公垂线唯一定理"))).toBe(
      true,
    );
    expect(panel.warnings.some((w) => w.text.includes("极值命中"))).toBe(true);
  });

  it("数列专题：错位相减模型混合通项与前 n 项和数值应当严格同步且包含防坑考点", () => {
    // a1 = 1, d = 1, q = 2, N = 3: c1=1, c2=4, c3=12, T3 = 17
    verifyTopicSyncContract([
      {
        name: "差比数列错位相减模型",
        animId: "anim-sequence",
        modeOptions: { activeMode: "models", subModel: "arith-geo" },
        params: { a1: 1, d: 1, q: 2, N: 3 },
        lessonType: "concept",
        groundTruth: {},
        expectedQuantityLabels: ["混合通项", "前 $N$ 项和", "公比 $q$ 状态"],
      },
    ]);
  });

  it("解析几何：抛物线第一定义焦半径与准线距离应当严格恒等", () => {
    // p = 2, 向右开口, 焦点 F(1, 0), 准线 x = -1
    verifyTopicSyncContract([
      {
        name: "抛物线第一定义焦半径模型",
        animId: "anim-conic-parabola",
        modeOptions: { studyMode: "definition", direction: "right" },
        params: { p: 2, tP: 1 },
        lessonType: "concept",
        groundTruth: {},
        expectedQuantityLabels: [
          "焦参数 p",
          "焦点 F",
          "准线方程",
          "焦半径 |PF|",
          "准线距离 d(P, l)",
        ],
      },
    ]);
  });
});
