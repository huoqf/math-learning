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
  meanX: number;
  meanY: number;
  lxx: number;
  lyy: number;
  lxy: number;
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

export interface IndependenceTestResult {
  a: number; // A and B
  b: number; // A and not B
  c: number; // not A and B
  d: number; // not A and not B
  n: number;
  adMinusBc: number;
  chiSquare: number; // 卡方/K^2 观测值
  p90: boolean; // >= 2.706 (90% 把握)
  p95: boolean; // >= 3.841 (95% 把握)
  p99: boolean; // >= 6.635 (99% 把握)
  p999: boolean; // >= 10.828 (99.9% 把握)
  confidenceText: string;
  isValid: boolean;
}

/**
 * 求解一元线性回归模型
 */
export function calculateLinearRegression(
  points: Point2D[],
): LinearRegressionResult {
  const n = points.length;
  if (n < 2) {
    return {
      n,
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
  for (let i = 0; i < n; i++) {
    sumX += points[i].x;
    sumY += points[i].y;
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
      message: "样本点x取值全部相同，无法拟合斜率",
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
    rSquare = Math.max(0, 1 - sse / lyy);
  }

  return {
    n,
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

  if (n === 0 || row1 === 0 || row2 === 0 || col1 === 0 || col2 === 0) {
    return {
      a,
      b,
      c,
      d,
      n,
      adMinusBc: 0,
      chiSquare: 0,
      p90: false,
      p95: false,
      p99: false,
      p999: false,
      confidenceText: "无有效数据或边际分布为0",
      isValid: false,
    };
  }

  const adMinusBc = a * d - b * c;
  const numerator = n * Math.pow(adMinusBc, 2);
  const denominator = row1 * row2 * col1 * col2;

  const chiSquare = denominator > 0 ? numerator / denominator : 0;

  const p90 = chiSquare >= 2.706;
  const p95 = chiSquare >= 3.841;
  const p99 = chiSquare >= 6.635;
  const p999 = chiSquare >= 10.828;

  let confidenceText = "没有充分理由认为变量间有关联 (接受无关联原假设)";
  if (p999) {
    confidenceText = "有 99.9% 以上的把握认为两个变量有关联";
  } else if (p99) {
    confidenceText = "有 99% 以上的把握认为两个变量有关联";
  } else if (p95) {
    confidenceText = "有 95% 以上的把握认为两个变量有关联";
  } else if (p90) {
    confidenceText = "有 90% 以上的把握认为两个变量有关联";
  }

  return {
    a,
    b,
    c,
    d,
    n,
    adMinusBc,
    chiSquare,
    p90,
    p95,
    p99,
    p999,
    confidenceText,
    isValid: true,
  };
}

/**
 * 高考典型预设数据集
 */
export const REGRESSION_PRESETS = [
  {
    id: "ad_sales",
    name: "广告支出与销售额 (高考经典正相关)",
    points: [
      { id: "p1", x: 2, y: 3 },
      { id: "p2", x: 4, y: 5 },
      { id: "p3", x: 5, y: 6.5 },
      { id: "p4", x: 6, y: 7.5 },
      { id: "p5", x: 8, y: 9.5 },
    ],
    xName: "广告支出 (万元)",
    yName: "销售额 (万元)",
    xRange: [0, 10] as [number, number],
    yRange: [0, 12] as [number, number],
  },
  {
    id: "temp_power",
    name: "气温与用电量 (高考负相关)",
    points: [
      { id: "p1", x: 10, y: 22 },
      { id: "p2", x: 15, y: 18 },
      { id: "p3", x: 20, y: 15 },
      { id: "p4", x: 25, y: 12 },
      { id: "p5", x: 30, y: 9 },
    ],
    xName: "气温 (°C)",
    yName: "用电量 (度)",
    xRange: [5, 35] as [number, number],
    yRange: [5, 25] as [number, number],
  },
  {
    id: "height_weight",
    name: "身高与体重 (强线性)",
    points: [
      { id: "p1", x: -4, y: -3.2 },
      { id: "p2", x: -2, y: -1.5 },
      { id: "p3", x: 0, y: 0.2 },
      { id: "p4", x: 2, y: 1.8 },
      { id: "p5", x: 4, y: 3.5 },
    ],
    xName: "x (离均值)",
    yName: "y (离均值)",
    xRange: [-6, 6] as [number, number],
    yRange: [-5, 5] as [number, number],
  },
  {
    id: "outlier",
    name: "含异常值的散点分布",
    points: [
      { id: "p1", x: -4, y: -3 },
      { id: "p2", x: -2, y: -1.5 },
      { id: "p3", x: 0, y: 0.5 },
      { id: "p4", x: 2, y: 2 },
      { id: "p5", x: 4, y: -3.5 }, // 异常点
    ],
    xName: "x",
    yName: "y",
    xRange: [-6, 6] as [number, number],
    yRange: [-5, 5] as [number, number],
  },
];

export const INDEPENDENCE_PRESETS = [
  {
    id: "medicine",
    name: "新药疗效对比 (强显著关联)",
    a: 85,
    b: 15,
    c: 40,
    d: 60,
    labelA: "新药组",
    labelNotA: "对照组",
    labelB: "有效",
    labelNotB: "无效",
  },
  {
    id: "gender_subject",
    name: "性别与学科偏好 (中等关联)",
    a: 40,
    b: 20,
    c: 25,
    d: 35,
    labelA: "男生",
    labelNotA: "女生",
    labelB: "喜欢理科",
    labelNotB: "喜欢文科",
  },
  {
    id: "no_relation",
    name: "完全无关联独立样本",
    a: 50,
    b: 50,
    c: 50,
    d: 50,
    labelA: "A类",
    labelNotA: "非A类",
    labelB: "B类",
    labelNotB: "非B类",
  },
];
