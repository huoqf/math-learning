/**
 * 成对数据统计分析与独立性检验纯数学求解引擎
 */

export interface Point2D {
  id: string;
  x: number;
  y: number;
}

export interface LinearRegressionResult {
  n: number;
  sumX: number;
  sumY: number;
  sumXX: number;
  sumYY: number;
  sumXY: number;
  meanX: number;
  meanY: number;
  lxx: number; // \sum (x_i - \bar{x})^2
  lyy: number; // \sum (y_i - \bar{y})^2
  lxy: number; // \sum (x_i - \bar{x})(y_i - \bar{y})
  b: number; // 斜率 b_hat
  a: number; // 截距 a_hat
  r: number; // 样本相关系数 r
  rSquare: number; // 决定系数 R^2
  residuals: number[]; // 各点残差 e_i = y_i - y_hat_i
  sse: number; // 残差平方和 SSE
  sst: number; // 总偏差平方和 SST
  isValid: boolean;
  message?: string;
}

export type RegressionModelType =
  "linear" | "exponential" | "power" | "logarithmic" | "inverse";

export interface ModelFitComparison {
  type: RegressionModelType;
  name: string;
  variableSubstitution: string;
  transformedFormula: string;
  originalFormula: string;
  rSquare: number;
  sse: number;
  isBest: boolean;
  isValid: boolean;
  predict: (x: number) => number;
  params: Record<string, number>;
}

export interface IndependenceTestResult {
  a: number; // A and B
  b: number; // A and not B
  c: number; // not A and B
  d: number; // not A and not B
  n: number;
  row1: number;
  row2: number;
  col1: number;
  col2: number;
  expected: {
    eA: number;
    eB: number;
    eC: number;
    eD: number;
  };
  contributions: {
    dA: number;
    dB: number;
    dC: number;
    dD: number;
  };
  adMinusBc: number;
  chiSquare: number; // 卡方/K^2 观测值
  chiSquareYates: number; // Yates 连续性修正卡方
  p90: boolean; // >= 2.706 (90% 把握)
  p95: boolean; // >= 3.841 (95% 把握)
  p99: boolean; // >= 6.635 (99% 把握)
  p999: boolean; // >= 10.828 (99.9% 把握)
  isSampleLargeEnough: boolean; // n >= 40
  isExpectedEnough: boolean; // 各期望频数 >= 5
  confidenceText: string;
  isValid: boolean;
}

/**
 * 求解一元线性回归模型及高考常用统计中间量
 */
export function calculateLinearRegression(
  points: Point2D[],
): LinearRegressionResult {
  const n = points.length;
  if (n < 2) {
    return {
      n,
      sumX: 0,
      sumY: 0,
      sumXX: 0,
      sumYY: 0,
      sumXY: 0,
      meanX: 0,
      meanY: 0,
      lxx: 0,
      lyy: 0,
      lxy: 0,
      b: 0,
      a: 0,
      r: 0,
      rSquare: 0,
      residuals: [],
      sse: 0,
      sst: 0,
      isValid: false,
      message: "样本点数量至少需要2个",
    };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumYY = 0;
  let sumXY = 0;

  for (let i = 0; i < n; i++) {
    const x = points[i].x;
    const y = points[i].y;
    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumYY += y * y;
    sumXY += x * y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let lxx = 0;
  let lyy = 0;
  let lxy = 0;
  for (let i = 0; i < n; i++) {
    const dx = points[i].x - meanX;
    const dy = points[i].y - meanY;
    lxx += dx * dx;
    lyy += dy * dy;
    lxy += dx * dy;
  }

  // 退化情况处理：x 全部相同
  if (Math.abs(lxx) < 1e-9) {
    return {
      n,
      sumX,
      sumY,
      sumXX,
      sumYY,
      sumXY,
      meanX,
      meanY,
      lxx: 0,
      lyy,
      lxy: 0,
      b: 0,
      a: meanY,
      r: 0,
      rSquare: 0,
      residuals: points.map((p) => p.y - meanY),
      sse: lyy,
      sst: lyy,
      isValid: false,
      message: "样本点 x 取值全部相同，无法拟合斜率",
    };
  }

  const b = lxy / lxx;
  const a = meanY - b * meanX;

  // 计算样本相关系数 r
  let r = 0;
  if (lyy > 1e-9) {
    r = lxy / Math.sqrt(lxx * lyy);
    r = Math.max(-1, Math.min(1, r)); // 钳制在 [-1, 1]
  }

  // 计算残差 e_i 与 SSE/SST
  const residuals: number[] = [];
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const yHat = b * points[i].x + a;
    const e = points[i].y - yHat;
    residuals.push(e);
    sse += e * e;
  }

  let rSquare = 0;
  if (lyy > 1e-9) {
    rSquare = Math.max(0, Math.min(1, 1 - sse / lyy));
  }

  return {
    n,
    sumX,
    sumY,
    sumXX,
    sumYY,
    sumXY,
    meanX,
    meanY,
    lxx,
    lyy,
    lxy,
    b,
    a,
    r,
    rSquare,
    residuals,
    sse,
    sst: lyy,
    isValid: true,
  };
}

/**
 * 求解非线性回归模型的线性化拟合与全模型优度比较
 */
export function fitAllRegressionModels(
  points: Point2D[],
): ModelFitComparison[] {
  const n = points.length;
  if (n < 2) return [];

  // 计算原空间 SST
  let sumY = 0;
  for (let i = 0; i < n; i++) sumY += points[i].y;
  const meanY = sumY / n;
  let sstOriginal = 0;
  for (let i = 0; i < n; i++) {
    const dy = points[i].y - meanY;
    sstOriginal += dy * dy;
  }

  const results: ModelFitComparison[] = [];

  // 1. 线性模型 y = bx + a
  const linearRes = calculateLinearRegression(points);
  if (linearRes.isValid) {
    const bStr = linearRes.b.toFixed(3);
    const aSign = linearRes.a >= 0 ? "+" : "-";
    const aAbs = Math.abs(linearRes.a).toFixed(3);
    results.push({
      type: "linear",
      name: "一元线性模型",
      variableSubstitution: "直接拟合 y = bx + a",
      transformedFormula: `\\hat{y} = ${bStr}x ${aSign} ${aAbs}`,
      originalFormula: `\\hat{y} = ${bStr}x ${aSign} ${aAbs}`,
      rSquare: linearRes.rSquare,
      sse: linearRes.sse,
      isBest: false,
      isValid: true,
      predict: (x: number) => linearRes.b * x + linearRes.a,
      params: { b: linearRes.b, a: linearRes.a },
    });
  }

  // 2. 指数模型 y = c * e^(kx) => ln y = kx + ln c, 令 z = ln y, z = kx + a0
  const allYPositive = points.every((p) => p.y > 0.001);
  if (allYPositive) {
    const expPoints = points.map((p) => ({
      id: p.id,
      x: p.x,
      y: Math.log(p.y),
    }));
    const expLin = calculateLinearRegression(expPoints);
    if (expLin.isValid) {
      const k = expLin.b;
      const c = Math.exp(expLin.a);
      const predictFn = (x: number) => c * Math.exp(k * x);

      let sse = 0;
      for (let i = 0; i < n; i++) {
        const err = points[i].y - predictFn(points[i].x);
        sse += err * err;
      }
      const rSquare =
        sstOriginal > 1e-9
          ? Math.max(0, Math.min(1, 1 - sse / sstOriginal))
          : 0;
      const kStr = k.toFixed(3);
      const cStr = c.toFixed(3);

      results.push({
        type: "exponential",
        name: "指数模型",
        variableSubstitution: "令 z = \\ln y \\implies z = kx + \\ln c",
        transformedFormula: `\\hat{z} = ${kStr}x + ${Math.log(c).toFixed(3)}`,
        originalFormula: `\\hat{y} = ${cStr} \\cdot e^{${kStr}x}`,
        rSquare,
        sse,
        isBest: false,
        isValid: true,
        predict: predictFn,
        params: { k, c },
      });
    }
  }

  // 3. 对数模型 y = a + b * ln x => 令 u = ln x, y = bu + a
  const allXPositive = points.every((p) => p.x > 0.001);
  if (allXPositive) {
    const logPoints = points.map((p) => ({
      id: p.id,
      x: Math.log(p.x),
      y: p.y,
    }));
    const logLin = calculateLinearRegression(logPoints);
    if (logLin.isValid) {
      const b = logLin.b;
      const a = logLin.a;
      const predictFn = (x: number) => (x > 0 ? a + b * Math.log(x) : 0);

      let sse = 0;
      for (let i = 0; i < n; i++) {
        const err = points[i].y - predictFn(points[i].x);
        sse += err * err;
      }
      const rSquare =
        sstOriginal > 1e-9
          ? Math.max(0, Math.min(1, 1 - sse / sstOriginal))
          : 0;
      const bStr = b.toFixed(3);
      const aSign = a >= 0 ? "+" : "-";
      const aAbs = Math.abs(a).toFixed(3);

      results.push({
        type: "logarithmic",
        name: "对数模型",
        variableSubstitution: "令 u = \\ln x \\implies y = bu + a",
        transformedFormula: `\\hat{y} = ${bStr}u ${aSign} ${aAbs}`,
        originalFormula: `\\hat{y} = ${bStr}\\ln x ${aSign} ${aAbs}`,
        rSquare,
        sse,
        isBest: false,
        isValid: true,
        predict: predictFn,
        params: { b, a },
      });
    }
  }

  // 4. 幂函数模型 y = c * x^k => ln y = k * ln x + ln c => 令 z = ln y, u = ln x => z = ku + a0
  if (allXPositive && allYPositive) {
    const powerPoints = points.map((p) => ({
      id: p.id,
      x: Math.log(p.x),
      y: Math.log(p.y),
    }));
    const powLin = calculateLinearRegression(powerPoints);
    if (powLin.isValid) {
      const k = powLin.b;
      const c = Math.exp(powLin.a);
      const predictFn = (x: number) => (x > 0 ? c * Math.pow(x, k) : 0);

      let sse = 0;
      for (let i = 0; i < n; i++) {
        const err = points[i].y - predictFn(points[i].x);
        sse += err * err;
      }
      const rSquare =
        sstOriginal > 1e-9
          ? Math.max(0, Math.min(1, 1 - sse / sstOriginal))
          : 0;
      const kStr = k.toFixed(3);
      const cStr = c.toFixed(3);

      results.push({
        type: "power",
        name: "幂函数模型",
        variableSubstitution:
          "令 z = \\ln y, u = \\ln x \\implies z = ku + \\ln c",
        transformedFormula: `\\hat{z} = ${kStr}u + ${Math.log(c).toFixed(3)}`,
        originalFormula: `\\hat{y} = ${cStr} \\cdot x^{${kStr}}`,
        rSquare,
        sse,
        isBest: false,
        isValid: true,
        predict: predictFn,
        params: { k, c },
      });
    }
  }

  // 5. 双曲线/逆函数模型 y = a + b / x => 令 u = 1/x => y = bu + a
  const allXNonZero = points.every((p) => Math.abs(p.x) > 0.001);
  if (allXNonZero) {
    const invPoints = points.map((p) => ({
      id: p.id,
      x: 1 / p.x,
      y: p.y,
    }));
    const invLin = calculateLinearRegression(invPoints);
    if (invLin.isValid) {
      const b = invLin.b;
      const a = invLin.a;
      const predictFn = (x: number) => (Math.abs(x) > 1e-5 ? a + b / x : 0);

      let sse = 0;
      for (let i = 0; i < n; i++) {
        const err = points[i].y - predictFn(points[i].x);
        sse += err * err;
      }
      const rSquare =
        sstOriginal > 1e-9
          ? Math.max(0, Math.min(1, 1 - sse / sstOriginal))
          : 0;
      const bStr = b.toFixed(3);
      const aSign = a >= 0 ? "+" : "-";
      const aAbs = Math.abs(a).toFixed(3);

      results.push({
        type: "inverse",
        name: "双曲线逆函数模型",
        variableSubstitution: "令 u = \\frac{1}{x} \\implies y = bu + a",
        transformedFormula: `\\hat{y} = ${bStr}u ${aSign} ${aAbs}`,
        originalFormula: `\\hat{y} = \\frac{${bStr}}{x} ${aSign} ${aAbs}`,
        rSquare,
        sse,
        isBest: false,
        isValid: true,
        predict: predictFn,
        params: { b, a },
      });
    }
  }

  // 标出最优模型 (R^2 最高)
  if (results.length > 0) {
    let bestIdx = 0;
    let maxR2 = -1;
    for (let i = 0; i < results.length; i++) {
      if (results[i].rSquare > maxR2) {
        maxR2 = results[i].rSquare;
        bestIdx = i;
      }
    }
    results[bestIdx].isBest = true;
  }

  return results;
}

/**
 * 求解 2x2 列联表的卡方检验 (独立性检验)
 */
export function calculateIndependenceTest(
  a: number,
  b: number,
  c: number,
  d: number,
): IndependenceTestResult {
  const n = a + b + c + d;
  const row1 = a + b;
  const row2 = c + d;
  const col1 = a + c;
  const col2 = b + d;

  const defaultEmptyExpected = { eA: 0, eB: 0, eC: 0, eD: 0 };
  const defaultEmptyContrib = { dA: 0, dB: 0, dC: 0, dD: 0 };

  if (
    !Number.isFinite(n) ||
    a < 0 ||
    b < 0 ||
    c < 0 ||
    d < 0 ||
    n === 0 ||
    row1 === 0 ||
    row2 === 0 ||
    col1 === 0 ||
    col2 === 0
  ) {
    return {
      a,
      b,
      c,
      d,
      n,
      row1,
      row2,
      col1,
      col2,
      expected: defaultEmptyExpected,
      contributions: defaultEmptyContrib,
      adMinusBc: 0,
      chiSquare: 0,
      chiSquareYates: 0,
      p90: false,
      p95: false,
      p99: false,
      p999: false,
      isSampleLargeEnough: false,
      isExpectedEnough: false,
      confidenceText: "无有效数据或边际分布为0",
      isValid: false,
    };
  }

  // 1. 计算零假设 H0（独立）下的理论期望频数 E_ij
  const eA = (row1 * col1) / n;
  const eB = (row1 * col2) / n;
  const eC = (row2 * col1) / n;
  const eD = (row2 * col2) / n;

  // 2. 计算各格的偏离度贡献 (O - E)^2 / E
  const dA = eA > 0 ? Math.pow(a - eA, 2) / eA : 0;
  const dB = eB > 0 ? Math.pow(b - eB, 2) / eB : 0;
  const dC = eC > 0 ? Math.pow(c - eC, 2) / eC : 0;
  const dD = eD > 0 ? Math.pow(d - eD, 2) / eD : 0;

  // 3. 计算常规 Pearson 卡方观测值
  const adMinusBc = a * d - b * c;
  const numerator = n * Math.pow(adMinusBc, 2);
  const denominator = row1 * row2 * col1 * col2;
  const chiSquare = denominator > 0 ? numerator / denominator : 0;

  // 4. 计算 Yates 连续性修正卡方: n(|ad - bc| - n/2)^2 / [(a+b)(c+d)(a+c)(b+d)]
  const absDiff = Math.abs(adMinusBc);
  const yatesNumerator = n * Math.pow(Math.max(0, absDiff - n / 2), 2);
  const chiSquareYates = denominator > 0 ? yatesNumerator / denominator : 0;

  const p90 = chiSquare >= 2.706;
  const p95 = chiSquare >= 3.841;
  const p99 = chiSquare >= 6.635;
  const p999 = chiSquare >= 10.828;

  const isSampleLargeEnough = n >= 40;
  const isExpectedEnough = eA >= 5 && eB >= 5 && eC >= 5 && eD >= 5;

  let confidenceText =
    "没有充分理由推翻零假设（接受无关联原假设，不能认为两变量有关联）";
  if (p999) {
    confidenceText = "有 99.9% 以上的把握认为两个分类变量有关联 (α = 0.001)";
  } else if (p99) {
    confidenceText = "有 99% 以上的把握认为两个分类变量有关联 (α = 0.01)";
  } else if (p95) {
    confidenceText = "有 95% 以上的把握认为两个分类变量有关联 (α = 0.05)";
  } else if (p90) {
    confidenceText = "有 90% 以上的把握认为两个分类变量有关联 (α = 0.10)";
  }

  return {
    a,
    b,
    c,
    d,
    n,
    row1,
    row2,
    col1,
    col2,
    expected: { eA, eB, eC, eD },
    contributions: { dA, dB, dC, dD },
    adMinusBc,
    chiSquare,
    chiSquareYates,
    p90,
    p95,
    p99,
    p999,
    isSampleLargeEnough,
    isExpectedEnough,
    confidenceText,
    isValid: true,
  };
}

/**
 * 单自由度卡方分布 Chi-Square(df=1) 的概率密度函数 PDF:
 * f(x) = (1 / sqrt(2*pi)) * x^(-1/2) * e^(-x/2)  (x > 0)
 */
export function getChiSquare1Pdf(x: number): number {
  if (x <= 0.01) return 2.5; // 避免 x->0 时的无穷大溢出，做平滑截断便于绘图
  const val =
    (1 / Math.sqrt(2 * Math.PI)) * Math.pow(x, -0.5) * Math.exp(-x / 2);
  return Math.min(2.5, val);
}

/**
 * 从全模型拟合列表中选取"当前选中的模型"对应的拟合结果。
 * 找不到匹配模型时回退到列表中的第一个（原组件内 modelFits.find ?? modelFits[0] 逻辑）。
 */
export function selectCurrentFit(
  models: ModelFitComparison[],
  model: RegressionModelType,
): ModelFitComparison | undefined {
  return models.find((m) => m.type === model) ?? models[0];
}

/**
 * 平滑拟合曲线的单个数学空间采样点（未做设计坐标系投影）。
 */
export interface CurveSamplePoint {
  x: number;
  y: number;
}

/**
 * 按给定拟合模型在 [xMin, xMax] 上生成用于绘制拟合曲线的数学采样点数组。
 * 仅执行纯数学处理：针对对数/幂/逆函数模型的不连续点剔除，以及 predict 结果的 NaN/Infinity 过滤。
 * 视口上下界裁剪、设计坐标投影与 SVG path 组装由组件层负责。
 * @param fit 当前拟合模型（含 predict 函数）
 * @param model 模型类型，决定不连续点的剔除策略
 * @param xMin 采样区间左端点（数学坐标）
 * @param xMax 采样区间右端点（数学坐标）
 * @param count 采样段数（采样点个数为 count + 1）
 */
export function sampleRegressionCurvePoints(
  fit: ModelFitComparison,
  model: RegressionModelType,
  xMin: number,
  xMax: number,
  count: number,
): CurveSamplePoint[] {
  const points: CurveSamplePoint[] = [];
  const startX =
    model === "logarithmic" || model === "power" ? Math.max(0.02, xMin) : xMin;
  const endX = xMax;
  const stepX = (endX - startX) / count;

  for (let i = 0; i <= count; i++) {
    const mx = startX + i * stepX;
    if (model === "logarithmic" || model === "power") {
      if (mx <= 0.01) continue;
    }
    if (model === "inverse" && Math.abs(mx) < 0.05) continue;

    const my = fit.predict(mx);
    if (isNaN(my) || !isFinite(my)) continue;

    points.push({ x: mx, y: my });
  }
  return points;
}

/**
 * 卡方分布密度曲线的单个数学采样点（未做设计坐标投影）。
 */
export interface ChiCurvePoint {
  chi: number;
  pdf: number;
}

/**
 * 在 [startChi, maxChi] 区间上均匀采样单自由度卡方概率密度曲线 (df=1) 的数学点数组。
 * 用于构造卡方密度曲线与拒绝域阴影的采样源；像素映射由组件层负责。
 * @param startChi 采样起点卡方值（密度曲线用 0.08，拒绝域用 3.841）
 * @param maxChi 采样终点卡方值（坐标轴最大刻度）
 * @param samples 采样段数（采样点个数为 samples + 1）
 */
export function sampleChiSquareCurvePoints(
  startChi: number,
  maxChi: number,
  samples: number,
): ChiCurvePoint[] {
  const points: ChiCurvePoint[] = [];
  for (let i = 0; i <= samples; i++) {
    const chiVal = startChi + (i / samples) * (maxChi - startChi);
    points.push({ chi: chiVal, pdf: getChiSquare1Pdf(chiVal) });
  }
  return points;
}

/**
 * 将卡方数值映射到数轴像素横坐标（纯线性映射，含 [0, maxChi] 钳制）。
 * @param val 卡方观测值
 * @param maxChi 坐标轴最大刻度卡方值
 * @param startPixel 数轴左端像素横坐标
 * @param plotWidth 数轴像素宽度
 */
export function mapChiValueToPixel(
  val: number,
  maxChi: number,
  startPixel: number,
  plotWidth: number,
): number {
  const clamped = Math.min(maxChi, Math.max(0, val));
  return startPixel + (clamped / maxChi) * plotWidth;
}

/**
 * 高考典型预设数据集（覆盖高考题型情境）
 */
export const REGRESSION_PRESETS = [
  {
    id: "ad_sales",
    name: "广告支出与销售额 (高考经典线性正相关)",
    points: [
      { id: "p1", x: 2, y: 3 },
      { id: "p2", x: 4, y: 5 },
      { id: "p3", x: 5, y: 6.5 },
      { id: "p4", x: 6, y: 7.5 },
      { id: "p5", x: 8, y: 9.5 },
    ],
    xName: "广告支出 x (万元)",
    yName: "销售额 y (万元)",
    xRange: [0, 10] as [number, number],
    yRange: [0, 12] as [number, number],
    recommendedModel: "linear" as RegressionModelType,
  },
  {
    id: "temp_power",
    name: "气温与用电量 (高考线性负相关)",
    points: [
      { id: "p1", x: 10, y: 22 },
      { id: "p2", x: 15, y: 18 },
      { id: "p3", x: 20, y: 15 },
      { id: "p4", x: 25, y: 12 },
      { id: "p5", x: 30, y: 9 },
    ],
    xName: "气温 x (°C)",
    yName: "用电量 y (度)",
    xRange: [5, 35] as [number, number],
    yRange: [5, 25] as [number, number],
    recommendedModel: "linear" as RegressionModelType,
  },
  {
    id: "ev_growth",
    name: "新能源汽车销量增长 (高考指数模型)",
    points: [
      { id: "p1", x: 1, y: 2.1 },
      { id: "p2", x: 2, y: 3.4 },
      { id: "p3", x: 3, y: 5.8 },
      { id: "p4", x: 4, y: 9.6 },
      { id: "p5", x: 5, y: 16.2 },
    ],
    xName: "年份序号 t",
    yName: "保有量 y (万辆)",
    xRange: [0, 6] as [number, number],
    yRange: [0, 20] as [number, number],
    recommendedModel: "exponential" as RegressionModelType,
  },
  {
    id: "chip_rnd",
    name: "研发投入与技术产出 (高考对数饱和模型)",
    points: [
      { id: "p1", x: 1, y: 1.2 },
      { id: "p2", x: 2, y: 3.1 },
      { id: "p3", x: 4, y: 4.8 },
      { id: "p4", x: 6, y: 5.7 },
      { id: "p5", x: 8, y: 6.3 },
    ],
    xName: "研发投入 x (亿元)",
    yName: "产出指数 y",
    xRange: [0, 10] as [number, number],
    yRange: [0, 8] as [number, number],
    recommendedModel: "logarithmic" as RegressionModelType,
  },
  {
    id: "inverse_current",
    name: "电阻与电流强度 (高考双曲线逆模型)",
    points: [
      { id: "p1", x: 1, y: 10.2 },
      { id: "p2", x: 2, y: 5.3 },
      { id: "p3", x: 3, y: 3.5 },
      { id: "p4", x: 5, y: 2.2 },
      { id: "p5", x: 8, y: 1.4 },
    ],
    xName: "电阻 R (Ω)",
    yName: "电流 I (A)",
    xRange: [0, 10] as [number, number],
    yRange: [0, 12] as [number, number],
    recommendedModel: "inverse" as RegressionModelType,
  },
  {
    id: "outlier",
    name: "含异常干扰点的数据集 (离群点杠杆效应)",
    points: [
      { id: "p1", x: 1, y: 2 },
      { id: "p2", x: 2, y: 3.5 },
      { id: "p3", x: 3, y: 5 },
      { id: "p4", x: 4, y: 6.5 },
      { id: "p5", x: 6, y: 1.5 }, // 异常干扰点
    ],
    xName: "自变量 x",
    yName: "因变量 y",
    xRange: [0, 8] as [number, number],
    yRange: [0, 10] as [number, number],
    recommendedModel: "linear" as RegressionModelType,
  },
];

export const INDEPENDENCE_PRESETS = [
  {
    id: "medicine",
    name: "医药研发：新药与常规疗法临床对照",
    shortName: "医药临床试验",
    a: 85,
    b: 15,
    c: 40,
    d: 60,
    labelA: "试验新药组",
    labelNotA: "常规疗法组",
    labelB: "显著显效",
    labelNotB: "无明显改善",
    conditionDesc:
      "新药临床双盲试验：新药组 $100$ 人中显效 $85$ 人（显效率 $85\\%$），常规组 $100$ 人中显效 $40$ 人（显效率 $40\\%$），总样本量 $n=200$。",
    questionDesc:
      "检验用药方案（试验新药 vs 常规疗法）与临床疗效是否显著相关。",
  },
  {
    id: "teaching",
    name: "教学实验：分层走班新教学法达标率",
    shortName: "教学达标实验",
    a: 48,
    b: 12,
    c: 32,
    d: 28,
    labelA: "新课改走班班",
    labelNotA: "传统教学班",
    labelB: "测试优秀",
    labelNotB: "测试一般",
    conditionDesc:
      "分层走班教学实验：走班实验班 $60$ 人中优秀 $48$ 人（优秀率 $80\\%$），传统教学班 $60$ 人中优秀 $32$ 人（优秀率 $53.3\\%$），总样本量 $n=120$。",
    questionDesc:
      "检验教学模式（分层走班 vs 传统模式）与数学成绩优秀率是否显著相关。",
  },
  {
    id: "evCar",
    name: "产业调查：新能源汽车选购意愿与年龄",
    shortName: "新能源购车意向",
    a: 70,
    b: 30,
    c: 35,
    d: 65,
    labelA: "青年群体 (≤35岁)",
    labelNotA: "中老年群体 (>35岁)",
    labelB: "倾向新能源",
    labelNotB: "倾向燃油车",
    conditionDesc:
      "汽车消费意向调查：青年群体 $100$ 人中倾向新能源 $70$ 人（偏好率 $70\\%$），中老年群体 $100$ 人中倾向新能源 $35$ 人（偏好率 $35\\%$），总样本量 $n=200$。",
    questionDesc:
      "检验消费者年龄段（青年 vs 中老年）与新能源汽车选购倾向是否显著相关。",
  },
  {
    id: "quality",
    name: "工业生产：智能机械与流水线良品率",
    shortName: "智能制造良品率",
    a: 190,
    b: 10,
    c: 150,
    d: 50,
    labelA: "智能机器人线",
    labelNotA: "人工组装线",
    labelB: "一级良品",
    labelNotB: "瑕疵返工品",
    conditionDesc:
      "高端制造产线质检：机器人线抽检 $200$ 件有一级良品 $190$ 件（良品率 $95\\%$），人工线抽检 $200$ 件有一级良品 $150$ 件（良品率 $75\\%$），总样本量 $n=400$。",
    questionDesc:
      "检验流水线生产模式（机器人自动化 vs 传统人工）与产品良品率是否显著相关。",
  },
  {
    id: "independent",
    name: "理论对照：完全独立均匀样本模型",
    shortName: "完全独立基准",
    a: 50,
    b: 50,
    c: 50,
    d: 50,
    labelA: "分类组 A",
    labelNotA: "分类组 非A",
    labelB: "属性 B",
    labelNotB: "属性 非B",
    conditionDesc:
      "完全独立理论样本：两分类组各 $100$ 个样本，对应特征发生频数完全对称相等（各 $50$ 个，频率均为 $50\\%$），交叉积差 $ad - bc = 0$，总样本量 $n=200$。",
    questionDesc:
      "验证当两分类变量完全独立时，条件频率落差 $\\Delta p = 0$，卡方统计量 $\\chi^2 = 0$，接受零假设 $H_0$。",
  },
];
