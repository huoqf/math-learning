import type { ParamMeta } from "../types";

export interface ConicParams {
  a: number;
  c: number;
  e: number;
  p: number;
  theta: number;
}

export const defaultParams: ConicParams = {
  a: 3.0,
  c: 2.0,
  e: 0.66,
  p: 2.0,
  theta: 0.8,
};

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "长半轴 / 实半轴 a",
    labelFormula: "a",
    min: 1.0,
    max: 5.0,
    step: 0.1,
    defaultValue: 3.0,
    importance: "core",
    description: "决定椭圆长半轴或双曲线实半轴长度 (2a 为常数和/差)",
    marks: [
      {
        value: 2.0,
        variant: "critical",
        label: "临界相等 (a=c)",
        labelFormula: "a = c",
      },
    ],
  },
  c: {
    key: "c",
    label: "半焦距 c",
    labelFormula: "c",
    min: 0.5,
    max: 4.5,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    description: "焦点坐标为 (±c, 0)，焦距为 2c",
    marks: [
      {
        value: 3.0,
        variant: "critical",
        label: "临界相等 (c=a)",
        labelFormula: "c = a",
      },
    ],
  },
  e: {
    key: "e",
    label: "离心率 e (d_F / d_l)",
    labelFormula: "e",
    min: 0.1,
    max: 2.5,
    step: 0.05,
    defaultValue: 0.66,
    importance: "core",
    description: "e < 1 为椭圆，e = 1 为抛物线，e > 1 为双曲线",
    marks: [
      {
        value: 1.0,
        variant: "critical",
        label: "抛物线 (e=1)",
        labelFormula: "e = 1",
      },
    ],
  },
  p: {
    key: "p",
    label: "焦准距 p",
    labelFormula: "p",
    min: 0.5,
    max: 4.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    description: "焦点到准线的距离 (p > 0)，焦点 (p/2, 0)，准线 x = -p/2",
  },
  theta: {
    key: "theta",
    label: "动点参数 θ / t",
    labelFormula: "\\theta",
    min: 0,
    max: 6.28,
    step: 0.02,
    defaultValue: 0.8,
    importance: "core",
    description: "控制动点 P 沿着圆锥曲线轨迹连续滑动",
  },
};

export interface ConicPresetItem {
  key: string;
  label: string;
  formula?: string;
  description: string;
  params: Partial<typeof defaultParams>;
  conicType?: "ellipse" | "hyperbola" | "parabola";
}

export const firstDefPresetsByType: Record<string, ConicPresetItem[]> = {
  ellipse: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放",
      params: { a: 3.0, c: 2.0 },
    },
    {
      key: "standard_ellipse",
      label: "经典椭圆",
      formula: "a=3, c=2",
      description: "e ≈ 0.67",
      params: { a: 3.0, c: 2.0, theta: 0.8 },
    },
    {
      key: "flat_ellipse",
      label: "扁平椭圆",
      formula: "e = 0.89",
      description: "长轴远大于短轴",
      params: { a: 3.5, c: 3.1, theta: 0.8 },
    },
    {
      key: "critical_degenerate",
      label: "临界退化",
      formula: "a = c",
      description: "退化为线段",
      params: { a: 2.5, c: 2.5, theta: 0.8 },
    },
  ],
  hyperbola: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放",
      params: { a: 2.0, c: 3.0 },
    },
    {
      key: "equilateral_hyperbola",
      label: "等轴双曲",
      formula: "e = \\sqrt{2}",
      description: "渐近线互相垂直",
      params: { a: 2.0, c: 2.83, theta: 0.8 },
    },
    {
      key: "wide_hyperbola",
      label: "大开角双曲",
      formula: "e = 2.0",
      description: "渐近线夹角120°",
      params: { a: 1.6, c: 3.2, theta: 0.8 },
    },
    {
      key: "hyperbola_degenerate",
      label: "临界退化",
      formula: "c = a",
      description: "退化为两条射线",
      params: { a: 2.5, c: 2.5, theta: 0.8 },
    },
  ],
  parabola: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放",
      params: { p: 2.0 },
    },
    {
      key: "standard_parabola",
      label: "标准抛物",
      formula: "p = 2.0",
      description: "焦点 (1, 0)",
      params: { p: 2.0, theta: 3.14 },
    },
    {
      key: "flat_parabola",
      label: "宽开度抛物",
      formula: "p = 3.6",
      description: "焦点距准线更远",
      params: { p: 3.6, theta: 3.14 },
    },
    {
      key: "narrow_parabola",
      label: "窄开度抛物",
      formula: "p = 1.0",
      description: "曲线更陡峭",
      params: { p: 1.0, theta: 3.14 },
    },
  ],
};

export const conicPresetsByMode: Record<string, ConicPresetItem[]> = {
  unifiedDef: [
    {
      key: "free",
      label: "自由探究",
      description: "全参数开放",
      params: { e: 0.66, p: 2.0 },
    },
    {
      key: "ellipse_e",
      label: "椭圆形态",
      formula: "e = 0.60",
      description: "0 < e < 1",
      params: { e: 0.6, p: 2.0, theta: 0.8 },
    },
    {
      key: "parabola_e",
      label: "抛物线",
      formula: "e = 1.00",
      description: "e = 1",
      params: { e: 1.0, p: 2.0, theta: 0.8 },
    },
    {
      key: "hyperbola_e",
      label: "双曲线",
      formula: "e = 1.60",
      description: "e > 1",
      params: { e: 1.6, p: 2.0, theta: 0.8 },
    },
  ],
};
