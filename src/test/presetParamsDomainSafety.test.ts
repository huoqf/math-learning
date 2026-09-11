import { describe, it, expect } from "vitest";
import { buildMathQuantities } from "@/data/mathQuantities";

interface TestCase {
  animId: string;
  params: Record<string, number>;
  config?: Record<string, unknown>;
  description?: string;
}

describe("全库预设参数与定义域数值安全性自动化巡检 (Domain & Numerical Safety)", () => {
  const safetyCases: TestCase[] = [
    // 1. 函数与导数系列
    { animId: "anim-quadratic", params: { a: 1, b: -2, c: -3 } },
    { animId: "anim-derivative-tangent", params: { x0: 1, a: 1, b: 0 } },
    {
      animId: "anim-derivative-monotonicity",
      params: { a: 1 },
      config: { activeMode: "cubic" },
    },
    {
      animId: "anim-derivative-inflection",
      params: { a: 1, b: -3, c: 0, d: 2 },
    },
    {
      animId: "anim-derivative-shift",
      params: { a: 2 },
      config: { activeMode: "implicit_zero", subModel: "x_ln_x" },
    },
    {
      animId: "anim-derivative-transcendental",
      params: { a: 1, x0: 0 },
      config: { mode: "exp" },
    },
    {
      animId: "anim-derivative-tangent-scaling",
      params: { k: 1, x0: 0, a: 1 },
      config: { mode: "tangent_exp" },
    },
    {
      animId: "anim-derivative-endpoint-taylor",
      params: { a: 1, order: 2 },
    },
    { animId: "anim-constant-single", params: { a: 1, m: 1, n: 2 } },
    { animId: "anim-constant-double", params: { yf: 1, yg: -1 } },
    { animId: "anim-nike", params: { a: 1, b: 4 } },
    { animId: "anim-func-properties", params: { a: 1, b: 0 } },
    {
      animId: "anim-func-explog",
      params: { baseA: 2 },
      config: { funcType: "exp" },
    },
    {
      animId: "anim-func-zero",
      params: { intervalM: -2, intervalN: 2 },
      config: { modelKey: "cubic" },
    },
    { animId: "anim-func-transform", params: { A: 1, omega: 1, phi: 0, k: 0 } },
    {
      animId: "anim-func-composite",
      params: { a: 1, b: 0 },
      config: { outerType: "exp" },
    },

    // 2. 集合与逻辑
    { animId: "anim-set-venn", params: { a: 1, b: 2 } },
    {
      animId: "anim-logic-quantifiers",
      params: { a: 1 },
      config: { statementType: "universal" },
    },

    // 3. 三角与向量
    { animId: "anim-trig-lines", params: { alphaDeg: 45 } },
    { animId: "anim-trig-identity", params: { alphaDeg: 30 } },
    { animId: "anim-trig-tangent", params: { omega: 1, phi: 0 } },
    { animId: "anim-trig-formulas", params: { alphaDeg: 30, betaDeg: 45 } },
    { animId: "anim-trig-transform", params: { A: 2, omega: 2, phi: 0, k: 1 } },
    { animId: "anim-triangle-solve", params: { a: 3, b: 4, c: 5 } },
    { animId: "anim-triangle-extrema", params: { b: 3, c: 4, A_deg: 60 } },
    { animId: "anim-vector-linear", params: { lambda: 2, mu: 1 } },
    {
      animId: "anim-vector-dot-product",
      params: { magA: 3, magB: 4, thetaDeg: 60 },
    },
    { animId: "anim-vector-basis", params: { lambda: 1, mu: 1 } },
    {
      animId: "anim-vector-polarization-apollonius",
      params: { bcLength: 6, amLength: 5 },
    },
    {
      animId: "anim-vector3d-basis",
      params: { x: 1, y: 2, z: 3 },
      config: { mode: "decomp" },
    },

    // 4. 解析几何系列
    { animId: "anim-line-equation", params: { k: 1, b: 0 } },
    { animId: "anim-line-circle", params: { r: 2, d: 1 } },
    { animId: "anim-circle-circle", params: { r1: 3, r2: 2, d: 4 } },
    {
      animId: "anim-conic-definition",
      params: { a: 4, b: 3 },
      config: { conicType: "ellipse" },
    },
    {
      animId: "anim-conic-properties",
      params: { a: 4, b: 3 },
      config: { conicType: "ellipse" },
    },
    { animId: "anim-conic-parabola", params: { p: 2, tP: 1 } },
    { animId: "anim-parabola-archimedes", params: { p: 2, y1: -2, y2: 4 } },
    {
      animId: "anim-conic-line",
      params: { a: 3, b: 2, k: 0.5, m: 0 },
      config: { conicType: "ellipse" },
    },
    { animId: "anim-conic-param", params: { a: 3, b: 2, thetaDeg: 45 } },
    {
      animId: "anim-conic-param-t",
      params: { x0: 0, y0: 0, alphaDeg: 45, t: 2 },
    },
    {
      animId: "anim-conic-homogenization",
      params: { a: 3, b: 2, k: 0.5, m: 1 },
      config: { curveType: "ellipse" },
    },

    // 5. 数列系列
    {
      animId: "anim-sequence",
      params: { a1: 1, d: 2, N: 5 },
      config: { activeMode: "arithmetic" },
    },
    {
      animId: "anim-sequence",
      params: { a1: 1, q: 2, N: 4 },
      config: { activeMode: "geometric" },
    },
    {
      animId: "anim-sequence",
      params: { a1: 1, d: 1, q: 2, N: 3 },
      config: { activeMode: "models", subModel: "arith-geo" },
    },

    // 6. 立体几何系列
    {
      animId: "anim-solid-angle",
      params: { thetaDeg: 45 },
      config: { mode: "linePlane" },
    },
    {
      animId: "anim-solid-distance",
      params: { a: 3, b: 3, c: 3, lambda: 0.5, mu: 0.5 },
      config: { mode: "skewDistance", preset: "cube" },
    },
    { animId: "anim-solid-position", params: { t: 0.5 } },
    { animId: "anim-solid-surface-relation", params: { alphaDeg: 60 } },
    {
      animId: "anim-solid-section",
      params: { pPos: 0.5, qPos: 0.5, rPos: 0.5 },
      config: { solidType: "cube" },
    },
    { animId: "anim-solid-ball", params: { a: 2, b: 2, c: 2 } },
    {
      animId: "anim-solid-ball-models",
      params: { a: 3, b: 4, c: 5 },
      config: { modelType: "corner" },
    },
    {
      animId: "anim-solid-advanced-sphere",
      params: { r: 3, h: 2 },
      config: { modelType: "cylinder_in_sphere" },
    },
    { animId: "anim-solid-rotation-body", params: { r: 2, h: 3 } },
    { animId: "anim-solid-folding", params: { foldAngleDeg: 60 } },
    { animId: "anim-solid-parametric", params: { lambda: 0.5 } },

    // 7. 概率与统计
    { animId: "anim-probability-counting", params: { n: 5, m: 3 } },
    {
      animId: "anim-probability-bayes",
      params: { pPriorD: 0.02, pSensitivity: 0.95, pFalsePositive: 0.05 },
      config: { activeMode: "bayes" },
    },
    {
      animId: "anim-probability-distribution",
      params: { n: 10, p: 0.5 },
      config: { distType: "binomial" },
    },
    { animId: "anim-probability-normal", params: { mu: 0, sigma: 1 } },
    { animId: "anim-paired-data", params: { r: 0.85 } },
    { animId: "anim-stat-percentile", params: { p: 75 } },

    // 8. 复数与不等式
    {
      animId: "anim-complex-geometry",
      params: { a1: 1, b1: 1, a2: 2, b2: -1 },
    },
    {
      animId: "anim-complex-geometric",
      params: { a1: 1, b1: 1, a2: 2, b2: -1 },
    },
    { animId: "anim-ineq-basic", params: { a: 2, b: 3 } },
    { animId: "anim-inequality-basic", params: { a: 2, b: 3 } },
    { animId: "anim-ineq-absolute", params: { a: 1, b: 2, c: 3 } },

    // 9. 扩展专题补全 (函数性质、数列衍生、概率马尔可夫、几何动点)
    { animId: "anim-func-domain", params: { a: 1, b: 0 } },
    { animId: "anim-func-parity", params: { a: 1, b: 0 } },
    { animId: "anim-func-symmetry", params: { a: 1, b: 0 } },
    {
      animId: "anim-func-exponential",
      params: { baseA: 2 },
      config: { funcType: "exp" },
    },
    {
      animId: "anim-func-logarithmic",
      params: { baseA: 2 },
      config: { funcType: "log" },
    },
    {
      animId: "anim-func-power",
      params: { baseA: 2, alpha: 2 },
      config: { funcType: "power" },
    },
    {
      animId: "anim-derivative-compare",
      params: { a: 1 },
      config: { activeMode: "cubic" },
    },
    { animId: "anim-derivative-endpoint", params: { a: 1, order: 2 } },
    {
      animId: "anim-logic-conditions",
      params: { setA_left: 1, setA_right: 3, setB_left: 0, setB_right: 4 },
    },
    { animId: "anim-nike-standard", params: { a: 1, b: 4 } },
    { animId: "anim-nike-amgm", params: { a: 1, b: 4 } },
    { animId: "anim-nike-shifted", params: { a: 1, b: 4, h: 1, k: 0 } },
    { animId: "anim-paired-data-independence", params: { r: 0.85 } },
    { animId: "anim-paired-data-regression", params: { r: 0.85 } },
    { animId: "anim-parametric-point", params: { t: 0.5 } },
    { animId: "anim-solid-parametric-point", params: { lambda: 0.5, mu: 0.5 } },
    { animId: "anim-probability-markov", params: { pA: 0.5, pB: 0.5 } },
    { animId: "anim-sequence-geom", params: { a1: 2, q: 2, N: 4 } },
    {
      animId: "anim-sequence-recurrence",
      params: { a1: 1, p_rec: 2, q_rec: 1, N: 4 },
    },
    { animId: "anim-sequence-sum", params: { a1: 1, d: 2, N: 4 } },
    { animId: "anim-trig-unit-circle", params: { thetaDeg: 45 } },
  ];

  safetyCases.forEach(({ animId, params, config }) => {
    it(`[${animId}] 面板数据与推导公式无 NaN/Infinity，满足定义域安全`, () => {
      const data = buildMathQuantities(animId, params, config);

      expect(
        data,
        `[${animId}] buildMathQuantities 应当返回有效数据结构`,
      ).toBeDefined();

      // 1. 验证特征量 quantities
      data.quantities.forEach((q) => {
        if (typeof q.value === "number") {
          expect(
            Number.isNaN(q.value),
            `[${animId}] 特征量 [${q.label}] 产生了 NaN 异常值`,
          ).toBe(false);
          expect(
            Number.isFinite(q.value),
            `[${animId}] 特征量 [${q.label}] 产生了 Infinity 溢出`,
          ).toBe(true);

          // 高中数学学科值域与定义域守卫断言 (Domain Guardians)
          assertHighSchoolMathDomain(animId, q.label, q.value);
        } else if (typeof q.value === "string") {
          expect(
            q.value.includes("NaN") || q.value.includes("undefined"),
            `[${animId}] 特征量 [${q.label}] 字符串包含未解析的 NaN/undefined: "${q.value}"`,
          ).toBe(false);

          const parsedNum = parseFloat(q.value);
          if (!Number.isNaN(parsedNum)) {
            assertHighSchoolMathDomain(animId, q.label, parsedNum);
          }
        }
      });

      // 2. 验证核心定理 theorems
      data.theorems.forEach((t) => {
        if (t.latex) {
          expect(
            t.latex.includes("NaN") || t.latex.includes("undefined"),
            `[${animId}] 定理 [${t.name}] latex 包含异常字符串: "${t.latex}"`,
          ).toBe(false);
        }
      });

      // 3. 验证破题推演链 reasoningSteps
      if (data.reasoningSteps) {
        data.reasoningSteps.forEach((step, idx) => {
          if (step.latex) {
            expect(
              step.latex.includes("NaN") || step.latex.includes("undefined"),
              `[${animId}] 推导链第 ${idx + 1} 步 latex 包含异常字符串: "${step.latex}"`,
            ).toBe(false);
          }
          if (step.detail) {
            expect(
              step.detail.includes("NaN") || step.detail.includes("undefined"),
              `[${animId}] 推导链第 ${idx + 1} 步 detail 包含异常字符串: "${step.detail}"`,
            ).toBe(false);
          }
        });
      }
    });
  });

  describe("核心专题数学临界退化点与极端边界参数安全性巡检 (Critical & Degenerate Boundary Safety)", () => {
    const criticalCases: TestCase[] = [
      // 1. 二次函数：二次项接近退化 a=0.01、判别式等于零 Delta=0
      {
        animId: "anim-quadratic",
        params: { a: 0.01, b: 2, c: 1 },
        description: "二次项近退化微小系数",
      },
      {
        animId: "anim-quadratic",
        params: { a: 1, b: 2, c: 1 },
        description: "重根判别式零临界 Delta=0",
      },
      // 2. 解析几何：大斜率近铅垂直线与切线临界
      {
        animId: "anim-conic-line",
        params: { a: 3, b: 2, k: 10, m: 0.5 },
        description: "解析几何大斜率近铅垂线",
      },
      // 3. 数列：公差为零常数列退化 d=0、等比公比 q=1
      {
        animId: "anim-sequence",
        params: { a1: 5, d: 0, N: 10 },
        config: { activeMode: "arithmetic" },
        description: "等差数列常数列退化 d=0",
      },
      {
        animId: "anim-sequence",
        params: { a1: 2, q: 1, N: 10 },
        config: { activeMode: "geometric" },
        description: "等比数列公比为1退化 q=1",
      },
      // 4. 导数：原点切点与极值临界
      {
        animId: "anim-derivative-tangent",
        params: { x0: 0, a: 1, b: 0 },
        description: "导数切点位于原点 x0=0",
      },
      // 5. 立体几何：三边相等正方体外接球退化
      {
        animId: "anim-solid-ball-models",
        params: { a: 2, b: 2, c: 2 },
        config: { modelType: "corner" },
        description: "外接球正方体墙角退化 a=b=c",
      },
    ];

    criticalCases.forEach(({ animId, params, config, description }) => {
      it(`[${animId}] 临界退化参数巡检 (${description})：面板数据稳健且无 NaN 崩溃`, () => {
        const data = buildMathQuantities(animId, params, config);
        expect(data, `[${animId}] 临界参数应当能正常返回数据`).toBeDefined();

        data.quantities.forEach((q) => {
          if (typeof q.value === "number") {
            expect(
              Number.isNaN(q.value),
              `[${animId}] (${description}) 特征量 [${q.label}] 产生 NaN`,
            ).toBe(false);
          } else if (typeof q.value === "string") {
            expect(
              q.value.includes("NaN"),
              `[${animId}] (${description}) 特征量 [${q.label}] 包含 NaN: "${q.value}"`,
            ).toBe(false);
          }
        });
      });
    });
  });
});

/**
 * 高中数学学科值域与定义域守卫断言
 */
function assertHighSchoolMathDomain(
  animId: string,
  label: string,
  val: number,
) {
  // 1. 概率值域守卫：0 <= P <= 1 (或百分比 0 <= P% <= 100)
  if (
    label.includes("概率") ||
    label.includes("后验") ||
    label.startsWith("P(")
  ) {
    if (label.includes("%") || val > 1) {
      expect(
        val >= -1e-6 && val <= 100.0001,
        `[${animId}] 概率百分比特征量 [${label}] 数值 ${val} 超出高中数学 [0, 100]% 合法区间！`,
      ).toBe(true);
    } else {
      expect(
        val >= -1e-6 && val <= 1.0001,
        `[${animId}] 概率特征量 [${label}] 数值 ${val} 超出高中数学 [0, 1] 合法概率值域！`,
      ).toBe(true);
    }
  }

  // 2. 几何半径与线段距离非负守卫
  if (
    label.includes("外接球半径") ||
    label.includes("内切球半径") ||
    label.includes("底面半径") ||
    label.includes("圆半径") ||
    label.includes("距离") ||
    label.includes("全长") ||
    label.includes("长 |")
  ) {
    expect(
      val >= -1e-5,
      `[${animId}] 几何长度/半径特征量 [${label}] 出现负数 ${val}，严重违反几何公理！`,
    ).toBe(true);
  }

  // 3. 圆锥曲线离心率定义域守卫
  if (label.includes("离心率")) {
    if (label.includes("椭圆") || animId.includes("ellipse")) {
      expect(
        val > 0 && val < 1.0001,
        `[${animId}] 椭圆离心率 [${label}] 数值 ${val} 违反高中数学椭圆定义 (0 < e < 1)！`,
      ).toBe(true);
    } else if (label.includes("双曲线") || animId.includes("hyperbola")) {
      expect(
        val >= 0.9999,
        `[${animId}] 双曲线离心率 [${label}] 数值 ${val} 违反高中数学双曲线定义 (e > 1)！`,
      ).toBe(true);
    }
  }
}
