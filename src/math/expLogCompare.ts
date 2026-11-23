/**
 * src/math/expLogCompare.ts
 * 必修一第 4 章：指对数运算律、换底公式与指对幂比大小（Zero Side-effects）
 */
import { formatMathNumber } from "@/utils/mathFormat";

export type ExpLogCompareMode = "logOps" | "medianBridge" | "monotoneCompare";

export interface LogOpsResult {
  a: number;
  m: number;
  n: number;
  c: number;
  logAM: number;
  logAN: number;
  logAMN: number;
  logADiv: number;
  changeBaseCheck: number;
  validity: "ok" | "degenerate_base";
}

export interface CompareTripletItem {
  symbol: string;
  exprLatex: string;
  value: number;
  curveType: "exp" | "log" | "power";
  base: number;
  xCoord: number;
  reason: string;
}

export interface CompareTripletResult {
  items: CompareTripletItem[];
  sortedAsc: CompareTripletItem[];
  bridgeLines: number[];
  validity: "ok" | "degenerate";
}

/** 安全的任意底对数（底数 <=0 或 =1 返回 NaN） */
export function safeLogBase(base: number, x: number): number {
  if (!(base > 0) || Math.abs(base - 1) < 1e-6 || !(x > 0)) {
    return NaN;
  }
  return Math.log(x) / Math.log(base);
}

/** 对数运算法则与换底公式校验 */
export function calcLogOperations(
  a: number,
  m: number,
  n: number,
  c: number,
): LogOpsResult {
  const invalidA = !(a > 0) || Math.abs(a - 1) < 1e-4;
  const invalidC = !(c > 0) || Math.abs(c - 1) < 1e-4;
  const safeM = Math.max(0.1, m);
  const safeN = Math.max(0.1, n);
  if (invalidA || invalidC) {
    return {
      a,
      m: safeM,
      n: safeN,
      c,
      logAM: NaN,
      logAN: NaN,
      logAMN: NaN,
      logADiv: NaN,
      changeBaseCheck: NaN,
      validity: "degenerate_base",
    };
  }
  const logAM = Math.log(safeM) / Math.log(a);
  const logAN = Math.log(safeN) / Math.log(a);
  const logAMN = Math.log(safeM * safeN) / Math.log(a);
  const logADiv = Math.log(safeM / safeN) / Math.log(a);
  const changeBaseCheck =
    Math.log(safeM) / Math.log(c) / (Math.log(a) / Math.log(c));
  return {
    a,
    m: safeM,
    n: safeN,
    c,
    logAM,
    logAN,
    logAMN,
    logADiv,
    changeBaseCheck,
    validity: "ok",
  };
}

/** 指对幂中间值搭桥与单调性比大小 */
export function calcCompareTriplet(
  scenario: string,
  baseA: number,
  xVal: number,
): CompareTripletResult {
  if (scenario === "bridge01") {
    const items: CompareTripletItem[] = [
      {
        symbol: "A",
        exprLatex: "2^{0.3}",
        value: Math.pow(2, 0.3),
        curveType: "exp",
        base: 2,
        xCoord: 0.3,
        reason: "$2^{0.3} > 2^0 = 1$",
      },
      {
        symbol: "B",
        exprLatex: "0.3^2",
        value: Math.pow(0.3, 2),
        curveType: "power",
        base: 2,
        xCoord: 0.3,
        reason: "$0 < 0.3^2 < 0.3^0 = 1$",
      },
      {
        symbol: "C",
        exprLatex: "\\log_2 0.3",
        value: safeLogBase(2, 0.3),
        curveType: "log",
        base: 2,
        xCoord: 0.3,
        reason: "$\\log_2 0.3 < \\log_2 1 = 0$",
      },
    ];
    return {
      items,
      sortedAsc: [...items].sort((p, q) => p.value - q.value),
      bridgeLines: [0, 1],
      validity: "ok",
    };
  }

  if (scenario === "bridgeHalf") {
    const items: CompareTripletItem[] = [
      {
        symbol: "A",
        exprLatex: "\\log_3 2",
        value: safeLogBase(3, 2),
        curveType: "log",
        base: 3,
        xCoord: 2,
        reason:
          "$\\log_3 \\sqrt{3} < \\log_3 2 < \\log_3 3 \\implies \\frac{1}{2} < A < 1$",
      },
      {
        symbol: "B",
        exprLatex: "\\log_5 2",
        value: safeLogBase(5, 2),
        curveType: "log",
        base: 5,
        xCoord: 2,
        reason: "$0 < \\log_5 2 < \\log_5 \\sqrt{5} = \\frac{1}{2}$",
      },
      {
        symbol: "C",
        exprLatex: "2^{0.2}",
        value: Math.pow(2, 0.2),
        curveType: "exp",
        base: 2,
        xCoord: 0.2,
        reason: "$2^{0.2} > 2^0 = 1$",
      },
    ];
    return {
      items,
      sortedAsc: [...items].sort((p, q) => p.value - q.value),
      bridgeLines: [0, 0.5, 1],
      validity: "ok",
    };
  }

  if (scenario === "monotoneCross") {
    const items: CompareTripletItem[] = [
      {
        symbol: "A",
        exprLatex: "0.4^{0.5}",
        value: Math.pow(0.4, 0.5),
        curveType: "exp",
        base: 0.4,
        xCoord: 0.5,
        reason: "同底 $y=0.4^x$ 单调递减，$0.4^{0.5} < 0.4^{0.4}$",
      },
      {
        symbol: "B",
        exprLatex: "0.4^{0.4}",
        value: Math.pow(0.4, 0.4),
        curveType: "exp",
        base: 0.4,
        xCoord: 0.4,
        reason: "以 $0.4^{0.4}$ 作桥梁衔接底数与指数变化",
      },
      {
        symbol: "C",
        exprLatex: "0.5^{0.4}",
        value: Math.pow(0.5, 0.4),
        curveType: "power",
        base: 0.4,
        xCoord: 0.5,
        reason:
          "幂函数 $y=x^{0.4}$ 在 $(0,+\\infty)$ 单调递增，$0.4^{0.4} < 0.5^{0.4}$",
      },
    ];
    return {
      items,
      sortedAsc: [...items].sort((p, q) => p.value - q.value),
      bridgeLines: [0, 1],
      validity: "ok",
    };
  }

  // free 动态探究模式
  const safeA = baseA;
  const safeX = Math.max(0.15, xVal);
  if (!(safeA > 0) || Math.abs(safeA - 1) < 1e-4) {
    return {
      items: [],
      sortedAsc: [],
      bridgeLines: [0, 1],
      validity: "degenerate",
    };
  }
  const aStr = formatMathNumber(safeA, 2);
  const xStr = formatMathNumber(safeX, 2);
  const items: CompareTripletItem[] = [
    {
      symbol: "A",
      exprLatex: `${aStr}^{${xStr}}`,
      value: Math.pow(safeA, safeX),
      curveType: "exp",
      base: safeA,
      xCoord: safeX,
      reason: `指数函数取值 $${aStr}^{${xStr}}$`,
    },
    {
      symbol: "B",
      exprLatex: `\\log_{${aStr}} ${xStr}`,
      value: safeLogBase(safeA, safeX),
      curveType: "log",
      base: safeA,
      xCoord: safeX,
      reason: `对数函数取值 $\\log_{${aStr}} ${xStr}$`,
    },
    {
      symbol: "C",
      exprLatex: `${xStr}^{0.5}`,
      value: Math.sqrt(safeX),
      curveType: "power",
      base: 0.5,
      xCoord: safeX,
      reason: `幂函数取值 $${xStr}^{0.5}$`,
    },
  ];
  return {
    items,
    sortedAsc: [...items].sort((p, q) => p.value - q.value),
    bridgeLines: [0, 1],
    validity: "ok",
  };
}
