/**
 * src/math/derivativeMonotonicity.ts
 * 导数与单调性、极值纯数学计算层（纯函数，零副作用，禁止依赖 React/DOM）
 */

export type ExtremaType =
  "maximum" | "minimum" | "inflection_stationary" | "none";

export interface ExtremaPoint {
  /** 驻点横坐标 */
  x: number;
  /** 驻点纵坐标 f(x) */
  y: number;
  /** 极值类型 */
  type: ExtremaType;
  /** 说明标签，如 "极大值点", "极小值点", "驻点(非极值)" */
  label: string;
  /** 导数在驻点左侧符号 */
  leftSign: number;
  /** 导数在驻点右侧符号 */
  rightSign: number;
}

export interface MonotonicityInterval {
  /** 区间范围 [start, end] */
  range: [number, number];
  /** 区间类型 */
  type: "increasing" | "decreasing" | "constant";
  /** LaTeX 区间表示，如 `(-\infty, -\sqrt{a})` */
  latex: string;
}

export interface SignTableRow {
  /** x 取值或区间描述 */
  xDesc: string;
  /** f'(x) 的符号描述 (+, -, 0, 无定义) */
  fPrimeSign: string;
  /** f(x) 的单调性或极值行为 (↗ 单调递增, ↘ 单调递减, 极大值, 极小值) */
  fxBehavior: string;
}

export interface MonotonicityModelResult {
  /** 函数名 */
  name: string;
  /** 原函数 LaTeX */
  latex: string;
  /** 导函数 LaTeX */
  derivativeLatex: string;
  /** 原函数计算方法 */
  fn: (x: number) => number;
  /** 导函数计算方法 */
  derivativeFn: (x: number) => number;
  /** 定义域区间集合 */
  domainIntervals: Array<[number, number]>;
  /** 极值点与驻点集合 */
  extrema: ExtremaPoint[];
  /** 单调区间集合 */
  monotonicIntervals: MonotonicityInterval[];
  /** 高考讨论符号表格 */
  signTable: SignTableRow[];
  /** 分类讨论总结 LaTeX */
  discussionSummaryLatex: string;
  /** 是否存在极值 */
  hasExtrema: boolean;
  /** 判别式或临界参数描述 */
  criticalCondition: string;
}

export type MonotonicityModelKey =
  "cubic_param" | "exp_poly" | "ln_x_ratio" | "x_ln_x_param" | "nike_rational";

export interface ModelOption {
  key: MonotonicityModelKey;
  name: string;
  formula: string;
  description: string;
  defaultA: number;
  defaultX0: number;
  aRange: [number, number];
  aStep: number;
  xRange: [number, number];
  yRange: [number, number];
}

export const MONOTONICITY_MODELS: Record<MonotonicityModelKey, ModelOption> = {
  cubic_param: {
    key: "cubic_param",
    name: "三次含参模型",
    formula: "f(x) = \\frac{1}{3}x^3 - ax",
    description: "多项式导数变号与判别式讨论",
    defaultA: 1.0,
    defaultX0: 1.5,
    aRange: [-2.0, 3.0],
    aStep: 0.1,
    xRange: [-4, 4],
    yRange: [-3.5, 3.5],
  },
  exp_poly: {
    key: "exp_poly",
    name: "指数多项式模型",
    formula: "f(x) = (x - a)e^x",
    description: "指数函数乘积与单极值点",
    defaultA: 1.0,
    defaultX0: 0.0,
    aRange: [-2.0, 2.0],
    aStep: 0.1,
    xRange: [-4, 3],
    yRange: [-3, 4],
  },
  ln_x_ratio: {
    key: "ln_x_ratio",
    name: "对数分式模型",
    formula: "f(x) = \\frac{\\ln x + a}{x}",
    description: "高考高频比大小与单极大值模型",
    defaultA: 0.0,
    defaultX0: 2.72,
    aRange: [-1.0, 1.0],
    aStep: 0.1,
    xRange: [0.05, 7],
    yRange: [-1.5, 1.5],
  },
  x_ln_x_param: {
    key: "x_ln_x_param",
    name: "对数乘积模型",
    formula: "f(x) = x\\ln x - ax",
    description: "对数乘积求导与唯一极小值",
    defaultA: 1.0,
    defaultX0: 1.0,
    aRange: [-1.0, 2.5],
    aStep: 0.1,
    xRange: [0.05, 5],
    yRange: [-2.5, 3],
  },
  nike_rational: {
    key: "nike_rational",
    name: "对勾分式模型",
    formula: "f(x) = x + \\frac{a}{x}",
    description: "分式求导、奇函数与双极值/单调递增",
    defaultA: 1.0,
    defaultX0: 1.5,
    aRange: [-2.0, 3.0],
    aStep: 0.1,
    xRange: [-4.5, 4.5],
    yRange: [-4.5, 4.5],
  },
};

/**
 * 格式化纯净浮点数（去尾零）
 */
export function formatFloat(num: number, digits = 2): string {
  if (!Number.isFinite(num)) return "";
  const fixed = num.toFixed(digits);
  if (Math.abs(Number(fixed)) < 1e-9) return "0";
  return Number(fixed).toString();
}

/**
 * 计算导数与单调性/极值核心解析数据
 */
export function solveMonotonicityModel(
  modelKey: MonotonicityModelKey,
  a: number,
): MonotonicityModelResult {
  switch (modelKey) {
    case "cubic_param": {
      const aVal = Number(a.toFixed(2));
      const fn = (x: number) => (1 / 3) * x * x * x - aVal * x;
      const derivativeFn = (x: number) => x * x - aVal;
      const aStr = formatFloat(aVal);

      let latex = "";
      if (Math.abs(aVal) < 1e-6) {
        latex = "f(x) = \\frac{1}{3}x^3";
      } else if (aVal > 0) {
        latex =
          aVal === 1
            ? "f(x) = \\frac{1}{3}x^3 - x"
            : `f(x) = \\frac{1}{3}x^3 - ${aStr}x`;
      } else {
        const absA = formatFloat(Math.abs(aVal));
        latex =
          aVal === -1
            ? "f(x) = \\frac{1}{3}x^3 + x"
            : `f(x) = \\frac{1}{3}x^3 + ${absA}x`;
      }

      let derivativeLatex = "";
      if (Math.abs(aVal) < 1e-6) {
        derivativeLatex = "f'(x) = x^2";
      } else if (aVal > 0) {
        derivativeLatex =
          aVal === 1 ? "f'(x) = x^2 - 1" : `f'(x) = x^2 - ${aStr}`;
      } else {
        const absA = formatFloat(Math.abs(aVal));
        derivativeLatex =
          aVal === -1 ? "f'(x) = x^2 + 1" : `f'(x) = x^2 + ${absA}`;
      }

      if (aVal > 0) {
        const sqrtA = Math.sqrt(aVal);
        const x1 = -sqrtA;
        const y1 = fn(x1);
        const x2 = sqrtA;
        const y2 = fn(x2);

        const x1Str = formatFloat(x1);
        const x2Str = formatFloat(x2);

        const extrema: ExtremaPoint[] = [
          {
            x: x1,
            y: y1,
            type: "maximum",
            label: `极大值点 (${x1Str}, ${formatFloat(y1)})`,
            leftSign: 1,
            rightSign: -1,
          },
          {
            x: x2,
            y: y2,
            type: "minimum",
            label: `极小值点 (${x2Str}, ${formatFloat(y2)})`,
            leftSign: -1,
            rightSign: 1,
          },
        ];

        const monotonicIntervals: MonotonicityInterval[] = [
          {
            range: [-Infinity, x1],
            type: "increasing",
            latex: `(-\\infty, -\\sqrt{${aStr}})`,
          },
          {
            range: [x1, x2],
            type: "decreasing",
            latex: `(-\\sqrt{${aStr}}, \\sqrt{${aStr}})`,
          },
          {
            range: [x2, Infinity],
            type: "increasing",
            latex: `(\\sqrt{${aStr}}, +\\infty)`,
          },
        ];

        const signTable: SignTableRow[] = [
          {
            xDesc: `x < -\\sqrt{${aStr}}`,
            fPrimeSign: "+",
            fxBehavior: "↗ 严格单调递增",
          },
          {
            xDesc: `x = -\\sqrt{${aStr}}`,
            fPrimeSign: "0",
            fxBehavior: `极大值 ${formatFloat(y1)}`,
          },
          {
            xDesc: `-\\sqrt{${aStr}} < x < \\sqrt{${aStr}}`,
            fPrimeSign: "-",
            fxBehavior: "↘ 严格单调递减",
          },
          {
            xDesc: `x = \\sqrt{${aStr}}`,
            fPrimeSign: "0",
            fxBehavior: `极小值 ${formatFloat(y2)}`,
          },
          {
            xDesc: `x > \\sqrt{${aStr}}`,
            fPrimeSign: "+",
            fxBehavior: "↗ 严格单调递增",
          },
        ];

        return {
          name: "三次含参模型",
          latex,
          derivativeLatex,
          fn,
          derivativeFn,
          domainIntervals: [[-Infinity, Infinity]],
          extrema,
          monotonicIntervals,
          signTable,
          discussionSummaryLatex: `a > 0 \\implies f'(x)=0 \\text{ 有两相异根 } \\pm\\sqrt{a} \\text{，增区间 } (-\\infty, -\\sqrt{a}), (\\sqrt{a}, +\\infty) \\text{，减区间 } (-\\sqrt{a}, \\sqrt{a})`,
          hasExtrema: true,
          criticalCondition: "a > 0 \\iff \\Delta = 4a > 0",
        };
      } else if (Math.abs(aVal) < 1e-6) {
        const extrema: ExtremaPoint[] = [
          {
            x: 0,
            y: 0,
            type: "inflection_stationary",
            label: "驻点(非极值) (0, 0)",
            leftSign: 1,
            rightSign: 1,
          },
        ];

        const monotonicIntervals: MonotonicityInterval[] = [
          {
            range: [-Infinity, Infinity],
            type: "increasing",
            latex: "(-\\infty, +\\infty)",
          },
        ];

        const signTable: SignTableRow[] = [
          { xDesc: "x < 0", fPrimeSign: "+", fxBehavior: "↗ 严格单调递增" },
          {
            xDesc: "x = 0",
            fPrimeSign: "0",
            fxBehavior: "切线斜率0 (驻点非极值)",
          },
          { xDesc: "x > 0", fPrimeSign: "+", fxBehavior: "↗ 严格单调递增" },
        ];

        return {
          name: "三次含参模型",
          latex,
          derivativeLatex,
          fn,
          derivativeFn,
          domainIntervals: [[-Infinity, Infinity]],
          extrema,
          monotonicIntervals,
          signTable,
          discussionSummaryLatex: `a = 0 \\implies f'(x) = x^2 \\ge 0 \\text{ 恒成立，} f(x) \\text{ 在 } \\mathbb{R} \\text{ 上单调递增，无极值点}`,
          hasExtrema: false,
          criticalCondition: "a = 0 \\iff \\text{临界驻点，导数切于零点不变号}",
        };
      } else {
        const monotonicIntervals: MonotonicityInterval[] = [
          {
            range: [-Infinity, Infinity],
            type: "increasing",
            latex: "(-\\infty, +\\infty)",
          },
        ];

        const signTable: SignTableRow[] = [
          {
            xDesc: "x \\in \\mathbb{R}",
            fPrimeSign: "+",
            fxBehavior: "↗ 全域严格单调递增",
          },
        ];

        return {
          name: "三次含参模型",
          latex,
          derivativeLatex,
          fn,
          derivativeFn,
          domainIntervals: [[-Infinity, Infinity]],
          extrema: [],
          monotonicIntervals,
          signTable,
          discussionSummaryLatex: `a < 0 \\implies f'(x) = x^2 - a > 0 \\text{ 恒成立，} f(x) \\text{ 在 } \\mathbb{R} \\text{ 上单调递增，无极值点}`,
          hasExtrema: false,
          criticalCondition:
            "a < 0 \\iff \\Delta < 0 \\implies f'(x) > 0 \\text{ 恒成立}",
        };
      }
    }

    case "exp_poly": {
      const aVal = Number(a.toFixed(2));
      const fn = (x: number) => (x - aVal) * Math.exp(x);
      const derivativeFn = (x: number) => (x - aVal + 1) * Math.exp(x);
      const aStr = formatFloat(aVal);

      const latex =
        Math.abs(aVal) < 1e-6
          ? "f(x) = x e^x"
          : aVal > 0
            ? `f(x) = (x - ${aStr})e^x`
            : `f(x) = (x + ${formatFloat(Math.abs(aVal))})e^x`;

      const x0 = aVal - 1;
      const x0Str = formatFloat(x0);
      const y0 = fn(x0);
      const y0Str = formatFloat(y0);

      const derivativeLatex =
        Math.abs(x0) < 1e-6
          ? "f'(x) = x e^x"
          : x0 > 0
            ? `f'(x) = (x - ${x0Str})e^x`
            : `f'(x) = (x + ${formatFloat(Math.abs(x0))})e^x`;

      const extrema: ExtremaPoint[] = [
        {
          x: x0,
          y: y0,
          type: "minimum",
          label: `极小值点 (${x0Str}, ${y0Str})`,
          leftSign: -1,
          rightSign: 1,
        },
      ];

      const monotonicIntervals: MonotonicityInterval[] = [
        {
          range: [-Infinity, x0],
          type: "decreasing",
          latex: `(-\\infty, ${x0Str})`,
        },
        {
          range: [x0, Infinity],
          type: "increasing",
          latex: `(${x0Str}, +\\infty)`,
        },
      ];

      const signTable: SignTableRow[] = [
        {
          xDesc: `x < ${x0Str}`,
          fPrimeSign: "-",
          fxBehavior: "↘ 严格单调递减",
        },
        {
          xDesc: `x = ${x0Str}`,
          fPrimeSign: "0",
          fxBehavior: `极小值 ${y0Str} = -e^{${x0Str}}`,
        },
        {
          xDesc: `x > ${x0Str}`,
          fPrimeSign: "+",
          fxBehavior: "↗ 严格单调递增",
        },
      ];

      return {
        name: "指数多项式模型",
        latex,
        derivativeLatex,
        fn,
        derivativeFn,
        domainIntervals: [[-Infinity, Infinity]],
        extrema,
        monotonicIntervals,
        signTable,
        discussionSummaryLatex: `\\forall a \\in \\mathbb{R}, f'(x) = (x - a + 1)e^x \\text{，唯一变号零点 } x = a - 1 \\text{，在 } (-\\infty, a-1) \\text{ 递减，} (a-1, +\\infty) \\text{ 递增}`,
        hasExtrema: true,
        criticalCondition:
          "x = a - 1 \\text{ 为唯一极小值点，极小值 } -e^{a-1}",
      };
    }

    case "ln_x_ratio": {
      const aVal = Number(a.toFixed(2));
      const fn = (x: number) => (x > 0 ? (Math.log(x) + aVal) / x : NaN);
      const derivativeFn = (x: number) =>
        x > 0 ? (1 - aVal - Math.log(x)) / (x * x) : NaN;
      const aStr = formatFloat(aVal);

      const latex =
        Math.abs(aVal) < 1e-6
          ? "f(x) = \\frac{\\ln x}{x}"
          : aVal > 0
            ? `f(x) = \\frac{\\ln x + ${aStr}}{x}`
            : `f(x) = \\frac{\\ln x - ${formatFloat(Math.abs(aVal))}}{x}`;

      const derivativeLatex =
        Math.abs(aVal) < 1e-6
          ? "f'(x) = \\frac{1 - \\ln x}{x^2}"
          : `f'(x) = \\frac{${formatFloat(1 - aVal)} - \\ln x}{x^2}`;

      const x0 = Math.exp(1 - aVal);
      const x0Str = formatFloat(x0);
      const y0 = fn(x0);
      const y0Str = formatFloat(y0);

      const extrema: ExtremaPoint[] = [
        {
          x: x0,
          y: y0,
          type: "maximum",
          label: `极大值点 (${x0Str}, ${y0Str})`,
          leftSign: 1,
          rightSign: -1,
        },
      ];

      const monotonicIntervals: MonotonicityInterval[] = [
        { range: [0, x0], type: "increasing", latex: `(0, ${x0Str})` },
        {
          range: [x0, Infinity],
          type: "decreasing",
          latex: `(${x0Str}, +\\infty)`,
        },
      ];

      const signTable: SignTableRow[] = [
        {
          xDesc: `0 < x < ${x0Str}`,
          fPrimeSign: "+",
          fxBehavior: "↗ 严格单调递增",
        },
        {
          xDesc: `x = ${x0Str}`,
          fPrimeSign: "0",
          fxBehavior: `极大值 ${y0Str}`,
        },
        {
          xDesc: `x > ${x0Str}`,
          fPrimeSign: "-",
          fxBehavior: "↘ 严格单调递减",
        },
      ];

      return {
        name: "对数分式模型",
        latex,
        derivativeLatex,
        fn,
        derivativeFn,
        domainIntervals: [[0, Infinity]],
        extrema,
        monotonicIntervals,
        signTable,
        discussionSummaryLatex: `\\text{定义域 } (0, +\\infty) \\text{，令 } f'(x)=0 \\implies x = e^{1-a} \\text{。单调递增区间 } (0, e^{1-a}) \\text{，单调递减区间 } (e^{1-a}, +\\infty)`,
        hasExtrema: true,
        criticalCondition:
          "x = e^{1-a} \\text{ 为极大值点 (当 } a=0 \\text{ 时极大值点 } x=e)",
      };
    }

    case "x_ln_x_param": {
      const aVal = Number(a.toFixed(2));
      const fn = (x: number) => (x > 0 ? x * Math.log(x) - aVal * x : NaN);
      const derivativeFn = (x: number) =>
        x > 0 ? Math.log(x) + 1 - aVal : NaN;
      const aStr = formatFloat(aVal);

      const latex =
        Math.abs(aVal) < 1e-6
          ? "f(x) = x\\ln x"
          : aVal > 0
            ? aVal === 1
              ? "f(x) = x\\ln x - x"
              : `f(x) = x\\ln x - ${aStr}x`
            : `f(x) = x\\ln x + ${formatFloat(Math.abs(aVal))}x`;

      const derivativeLatex =
        Math.abs(aVal - 1) < 1e-6
          ? "f'(x) = \\ln x"
          : aVal < 1
            ? `f'(x) = \\ln x + ${formatFloat(1 - aVal)}`
            : `f'(x) = \\ln x - ${formatFloat(aVal - 1)}`;

      const x0 = Math.exp(aVal - 1);
      const x0Str = formatFloat(x0);
      const y0 = fn(x0);
      const y0Str = formatFloat(y0);

      const extrema: ExtremaPoint[] = [
        {
          x: x0,
          y: y0,
          type: "minimum",
          label: `极小值点 (${x0Str}, ${y0Str})`,
          leftSign: -1,
          rightSign: 1,
        },
      ];

      const monotonicIntervals: MonotonicityInterval[] = [
        { range: [0, x0], type: "decreasing", latex: `(0, ${x0Str})` },
        {
          range: [x0, Infinity],
          type: "increasing",
          latex: `(${x0Str}, +\\infty)`,
        },
      ];

      const signTable: SignTableRow[] = [
        {
          xDesc: `0 < x < ${x0Str}`,
          fPrimeSign: "-",
          fxBehavior: "↘ 严格单调递减",
        },
        {
          xDesc: `x = ${x0Str}`,
          fPrimeSign: "0",
          fxBehavior: `极小值 ${y0Str} = -e^{${formatFloat(aVal - 1)}}`,
        },
        {
          xDesc: `x > ${x0Str}`,
          fPrimeSign: "+",
          fxBehavior: "↗ 严格单调递增",
        },
      ];

      return {
        name: "对数乘积模型",
        latex,
        derivativeLatex,
        fn,
        derivativeFn,
        domainIntervals: [[0, Infinity]],
        extrema,
        monotonicIntervals,
        signTable,
        discussionSummaryLatex: `\\text{定义域 } (0, +\\infty) \\text{，} f'(x) = \\ln x + 1 - a = 0 \\implies x = e^{a-1} \\text{ 为唯一极小值点}`,
        hasExtrema: true,
        criticalCondition: "x = e^{a-1} \\text{ 为极小值点，极小值 } -e^{a-1}",
      };
    }

    case "nike_rational": {
      const aVal = Number(a.toFixed(2));
      const fn = (x: number) => (x !== 0 ? x + aVal / x : NaN);
      const derivativeFn = (x: number) => (x !== 0 ? 1 - aVal / (x * x) : NaN);
      const aStr = formatFloat(aVal);

      const latex =
        Math.abs(aVal) < 1e-6
          ? "f(x) = x \\; (x \\ne 0)"
          : aVal > 0
            ? aVal === 1
              ? "f(x) = x + \\frac{1}{x}"
              : `f(x) = x + \\frac{${aStr}}{x}`
            : `f(x) = x - \\frac{${formatFloat(Math.abs(aVal))}}{x}`;

      const derivativeLatex =
        Math.abs(aVal) < 1e-6
          ? "f'(x) = 1 \\; (x \\ne 0)"
          : aVal > 0
            ? aVal === 1
              ? "f'(x) = 1 - \\frac{1}{x^2}"
              : `f'(x) = 1 - \\frac{${aStr}}{x^2}`
            : `f'(x) = 1 + \\frac{${formatFloat(Math.abs(aVal))}}{x^2}`;

      if (aVal > 0) {
        const sqrtA = Math.sqrt(aVal);
        const x1 = -sqrtA;
        const y1 = fn(x1);
        const x2 = sqrtA;
        const y2 = fn(x2);

        const x1Str = formatFloat(x1);
        const x2Str = formatFloat(x2);

        const extrema: ExtremaPoint[] = [
          {
            x: x1,
            y: y1,
            type: "maximum",
            label: `极大值点 (${x1Str}, ${formatFloat(y1)})`,
            leftSign: 1,
            rightSign: -1,
          },
          {
            x: x2,
            y: y2,
            type: "minimum",
            label: `极小值点 (${x2Str}, ${formatFloat(y2)})`,
            leftSign: -1,
            rightSign: 1,
          },
        ];

        const monotonicIntervals: MonotonicityInterval[] = [
          {
            range: [-Infinity, x1],
            type: "increasing",
            latex: `(-\\infty, -\\sqrt{${aStr}})`,
          },
          {
            range: [x1, 0],
            type: "decreasing",
            latex: `(-\\sqrt{${aStr}}, 0)`,
          },
          { range: [0, x2], type: "decreasing", latex: `(0, \\sqrt{${aStr}})` },
          {
            range: [x2, Infinity],
            type: "increasing",
            latex: `(\\sqrt{${aStr}}, +\\infty)`,
          },
        ];

        const signTable: SignTableRow[] = [
          {
            xDesc: `x < -\\sqrt{${aStr}}`,
            fPrimeSign: "+",
            fxBehavior: "↗ 严格单调递增",
          },
          {
            xDesc: `x = -\\sqrt{${aStr}}`,
            fPrimeSign: "0",
            fxBehavior: `极大值 ${formatFloat(y1)} = -2\\sqrt{${aStr}}`,
          },
          {
            xDesc: `-\\sqrt{${aStr}} < x < 0`,
            fPrimeSign: "-",
            fxBehavior: "↘ 严格单调递减",
          },
          {
            xDesc: "x = 0",
            fPrimeSign: "无定义",
            fxBehavior: "奇点/渐近线 (无定义)",
          },
          {
            xDesc: `0 < x < \\sqrt{${aStr}}`,
            fPrimeSign: "-",
            fxBehavior: "↘ 严格单调递减",
          },
          {
            xDesc: `x = \\sqrt{${aStr}}`,
            fPrimeSign: "0",
            fxBehavior: `极小值 ${formatFloat(y2)} = 2\\sqrt{${aStr}}`,
          },
          {
            xDesc: `x > \\sqrt{${aStr}}`,
            fPrimeSign: "+",
            fxBehavior: "↗ 严格单调递增",
          },
        ];

        return {
          name: "对勾分式模型",
          latex,
          derivativeLatex,
          fn,
          derivativeFn,
          domainIntervals: [
            [-Infinity, 0],
            [0, Infinity],
          ],
          extrema,
          monotonicIntervals,
          signTable,
          discussionSummaryLatex: `a > 0 \\implies \\text{增区间 } (-\\infty, -\\sqrt{a}), (\\sqrt{a}, +\\infty) \\text{；减区间 } (-\\sqrt{a}, 0), (0, \\sqrt{a}) \\text{ (注意严禁写并集符号 } \\cup \\text{)}`,
          hasExtrema: true,
          criticalCondition:
            "a > 0 \\implies x = -\\sqrt{a} \\text{ 为极大值点，} x = \\sqrt{a} \\text{ 为极小值点}",
        };
      } else {
        const monotonicIntervals: MonotonicityInterval[] = [
          { range: [-Infinity, 0], type: "increasing", latex: "(-\\infty, 0)" },
          { range: [0, Infinity], type: "increasing", latex: "(0, +\\infty)" },
        ];

        const signTable: SignTableRow[] = [
          { xDesc: "x < 0", fPrimeSign: "+", fxBehavior: "↗ 严格单调递增" },
          {
            xDesc: "x = 0",
            fPrimeSign: "无定义",
            fxBehavior: "奇点/渐近线 (无定义)",
          },
          { xDesc: "x > 0", fPrimeSign: "+", fxBehavior: "↗ 严格单调递增" },
        ];

        return {
          name: "对勾分式模型",
          latex,
          derivativeLatex,
          fn,
          derivativeFn,
          domainIntervals: [
            [-Infinity, 0],
            [0, Infinity],
          ],
          extrema: [],
          monotonicIntervals,
          signTable,
          discussionSummaryLatex: `a \\le 0 \\implies f'(x) = 1 - \\frac{a}{x^2} > 0 \\text{ 恒成立，在 } (-\\infty, 0) \\text{ 与 } (0, +\\infty) \\text{ 均单调递增，无极值点}`,
          hasExtrema: false,
          criticalCondition:
            "a \\le 0 \\implies f'(x) > 0 \\text{ 恒成立 (无极值)}",
        };
      }
    }
  }
}
