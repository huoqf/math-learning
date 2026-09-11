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
        groundTruth: {
          极值点: 1.0,
        },
        perturbation: {
          params: { k: 0.2 },
          dynamicQuantityLabels: ["割线左根", "割线右根", "极值点加法偏移"],
        },
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
    // 先验患病率 2.00%, 真阳性率 95.0%, 假阳性率 5.0%
    // 总体阳性率 = 0.02 * 0.95 + 0.98 * 0.05 = 6.80%
    // 后验患病率 = 0.019 / 0.068 ≈ 27.94%
    verifyTopicSyncContract([
      {
        name: "贝叶斯诊断假阳性模型",
        animId: "anim-probability-bayes",
        modeOptions: { activeMode: "bayes" },
        params: { pPriorD: 0.02, pSensitivity: 0.95, pFalsePositive: 0.05 },
        lessonType: "concept",
        groundTruth: {
          先验患病率: 2.0,
          真阳性率: 95.0,
          假阳性误报率: 5.0,
          总体阳性检出率: 6.8,
          阳性后验患病率: 27.94,
        },
        perturbation: {
          params: { pPriorD: 0.1, pSensitivity: 0.95, pFalsePositive: 0.05 },
          dynamicQuantityLabels: ["总体阳性检出率", "阳性后验患病率"],
        },
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
        groundTruth: {
          "前 $N$ 项和": 17.0,
          混合通项: 12.0,
        },
        perturbation: {
          params: { a1: 1, d: 1, q: 2, N: 4 },
          dynamicQuantityLabels: ["前 $N$ 项和"],
        },
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
        groundTruth: {
          "焦参数 p": 2.0,
        },
        perturbation: {
          params: { p: 4, tP: 1 },
          dynamicQuantityLabels: ["焦参数 p"],
        },
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

  it("数列专题：等差数列通项公式与前 n 项和二次函数模型契约验证", () => {
    // a1 = 3, d = -1, N = 8 => an = 3 - 7 = -4, Sn = 8 * (3 - 4) / 2 = -4
    verifyTopicSyncContract([
      {
        name: "等差数列通项与求和模型",
        animId: "anim-sequence",
        modeOptions: { activeMode: "arithmetic", arithmeticSubMode: "linear" },
        params: { a1: 3, d: -1, N: 8 },
        lessonType: "concept",
        groundTruth: {
          "末项 a_{8}": -4.0,
          "前 8 项和 S_{8}": -4.0,
          "变号零点 x_0": 4.0,
        },
        perturbation: {
          params: { a1: 3, d: 1, N: 8 },
          dynamicQuantityLabels: ["末项 a_{8}", "前 8 项和 S_{8}"],
        },
        expectedQuantityLabels: [
          "末项 a_{8}",
          "前 8 项和 S_{8}",
          "变号零点 x_0",
        ],
      },
    ]);
  });

  it("数列专题：等比数列通项公式与公比分类讨论契约验证", () => {
    // a1 = 2, q = 3, N = 4 => a4 = 54, S4 = 2 * (1 - 81) / (1 - 3) = 80
    verifyTopicSyncContract([
      {
        name: "等比数列通项与求和模型",
        animId: "anim-sequence",
        modeOptions: { activeMode: "geometric" },
        params: { a1: 2, q: 3, N: 4 },
        lessonType: "concept",
        groundTruth: {
          "末项 a_{4}": 54.0,
          "前 4 项和 S_{4}": 80.0,
        },
        perturbation: {
          params: { a1: 2, q: 2, N: 4 },
          dynamicQuantityLabels: ["末项 a_{4}", "前 4 项和 S_{4}"],
        },
        expectedQuantityLabels: ["末项 a_{4}", "前 4 项和 S_{4}"],
      },
    ]);
  });

  it("平面向量：向量数量积几何投影与坐标运算契约验证", () => {
    // |a| = 3, |b| = 4, theta = 60 deg => a·b = 3 * 4 * 0.5 = 6
    verifyTopicSyncContract([
      {
        name: "向量数量积几何投影模型",
        animId: "anim-vector-dot-product",
        modeOptions: { studyMode: "defProj" },
        params: { normA: 3, normB: 4, thetaDeg: 60, usePolarGeom: 1 },
        lessonType: "concept",
        groundTruth: {
          "向量 a 的模长": 3.0,
          "向量 b 的模长": 4.0,
          "数量积 (a · b)": 6.0,
        },
        perturbation: {
          params: { normA: 4, normB: 4, thetaDeg: 60, usePolarGeom: 1 },
          dynamicQuantityLabels: ["数量积 (a · b)"],
        },
        expectedQuantityLabels: [
          "向量 a 的模长",
          "向量 b 的模长",
          "数量积 (a · b)",
        ],
      },
    ]);
  });

  it("平面向量：极化恒等式与中线定理大题推演契约验证", () => {
    verifyTopicSyncContract([
      {
        name: "极化恒等式模型",
        animId: "anim-vector-polarization-apollonius",
        modeOptions: { studyMode: "polarization" },
        params: { bcLength: 6, pointX: 2, pointY: 4 },
        lessonType: "concept",
        groundTruth: {
          "底边全长 |BC|": 6.0,
          "中线长 |AM|": 4.47,
          极化算值: 11.0,
        },
        perturbation: {
          params: { bcLength: 8, pointX: 2, pointY: 4 },
          dynamicQuantityLabels: ["底边全长 |BC|", "极化算值"],
        },
        expectedQuantityLabels: ["底边全长 |BC|", "中线长 |AM|", "极化算值"],
      },
    ]);
  });

  it("三角函数：三角函数线在单位圆上的几何与代数对应契约验证", () => {
    verifyTopicSyncContract([
      {
        name: "三角函数线单位圆模型",
        animId: "anim-trig-lines",
        modeOptions: { studyMode: "lines" },
        params: { alphaDeg: 45 },
        lessonType: "concept",
        groundTruth: {
          "正弦线 MP": 0.707,
          "余弦线 OM": 0.707,
          "正切线 AT": 1.0,
        },
        perturbation: {
          params: { alphaDeg: 30 },
          dynamicQuantityLabels: ["正弦线 MP", "正切线 AT"],
        },
        expectedQuantityLabels: ["正弦线 MP", "余弦线 OM", "正切线 AT"],
      },
    ]);
  });

  it("三角函数：正弦型函数 y=Asin(ωx+φ)+k 图像变换与周期最值契约验证", () => {
    verifyTopicSyncContract([
      {
        name: "三角函数图像变换模型",
        animId: "anim-trig-transform",
        modeOptions: { studyMode: "transformPath" },
        params: { A: 2, omega: 2, phi: 0, k: 1 },
        lessonType: "concept",
        groundTruth: {
          纵向振幅伸缩比: 2.0,
        },
        perturbation: {
          params: { A: 3, omega: 2, phi: 0, k: 1 },
          dynamicQuantityLabels: ["纵向振幅伸缩比"],
        },
        expectedQuantityLabels: [
          "变换路线",
          "相位平移量",
          "横向周期伸缩比",
          "纵向振幅伸缩比",
        ],
      },
    ]);
  });

  it("解析几何：直线与椭圆相交联立模型应当满足代数判别式与弦长公式契约", () => {
    // 椭圆 x^2/9 + y^2/4 = 1, 直线 y = 0.5x + 0.5
    // 联立: 4x^2 + 9(0.25x^2 + 0.5x + 0.25) = 36 => 6.25x^2 + 4.5x - 33.75 = 0
    // Delta = 4.5^2 - 4 * 6.25 * (-33.75) = 20.25 + 843.75 = 864
    // 弦长 L = sqrt(1 + k^2) * sqrt(Delta) / |A| = sqrt(1.25) * sqrt(864) / 6.25 ≈ 5.257
    const a = 3;
    const b = 2;
    const k = 0.5;
    const m = 0.5;
    const A = b * b + a * a * k * k; // 4 + 9 * 0.25 = 6.25
    const B = 2 * a * a * k * m; // 2 * 9 * 0.5 * 0.5 = 4.5
    const C = a * a * (m * m - b * b); // 9 * (0.25 - 4) = -33.75
    const delta = B * B - 4 * A * C; // 864
    const chord = (Math.sqrt(1 + k * k) * Math.sqrt(delta)) / A;

    verifyTopicSyncContract([
      {
        name: "直线与椭圆相交弦长模型",
        animId: "anim-conic-line",
        modeOptions: { conicType: "ellipse", studyMode: "general" },
        params: { a, b, k, m, conicTypeIdx: 0, studyModeIdx: 0 },
        lessonType: "concept",
        groundTruth: {
          "判别式 Δ": delta,
          相交弦长: chord,
        },
        perturbation: {
          params: { a, b, k: 1.0, m: 0.5, conicTypeIdx: 0, studyModeIdx: 0 },
          dynamicQuantityLabels: ["判别式 Δ", "相交弦长"],
        },
        expectedQuantityLabels: ["位置关系", "判别式 Δ", "相交弦长"],
      },
    ]);
  });

  it("数列专题：等差数列前 n 项和二次函数模型与最值项契约验证", () => {
    // a1 = 7, d = -2, N = 8
    // 对称轴 x_sym = 0.5 - a1/d = 0.5 - 7/(-2) = 4.00
    // 首项 7, 公差 -2 => an = 7 + (n-1)*(-2) = 9 - 2n
    // a3 = 3 > 0, a4 = 1 > 0, a5 = -1 < 0 => n=4 时 S_4 = 4*(7+1)/2 = 16 达到最大
    verifyTopicSyncContract([
      {
        name: "等差数列二次函数最值模型",
        animId: "anim-sequence",
        modeOptions: {
          activeMode: "arithmetic",
          arithmeticSubMode: "quadratic",
        },
        params: { a1: 7, d: -2, N: 8 },
        lessonType: "concept",
        groundTruth: {
          "末项 a_{8}": -7.0,
          "前 8 项和 S_{8}": 0.0,
        },
        perturbation: {
          params: { a1: 7, d: -1, N: 8 },
          dynamicQuantityLabels: ["末项 a_{8}", "前 8 项和 S_{8}"],
        },
        expectedQuantityLabels: [
          "末项 a_{8}",
          "前 8 项和 S_{8}",
          "抛物线对称轴 x_sym",
          "S_n 最大值项",
        ],
      },
    ]);
  });
});
