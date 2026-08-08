/**
 * src/math/inequalityAbsolute.ts
 * 绝对值不等式几何意义纯数学计算层
 * 零副作用，禁止引入 React / DOM / window / Store
 */

export type InequalityMode = "single" | "sum" | "diff" | "triangle";
export type InequalityType = "<=" | ">=";

export interface SolutionInterval {
  x1: number;
  x2: number;
  isLeftInfinity?: boolean;
  isRightInfinity?: boolean;
}

export interface AbsoluteInequalityResult {
  /** 当前点 x 处的函数值 f(x) */
  yVal: number;
  /** 动点 P 到 A(a) 的距离 |x - a| */
  distA: number;
  /** 动点 P 到 B(b) 的距离 |x - b| */
  distB: number;
  /** 关键转折点（零点） */
  turningPoints: { x: number; y: number; label: string }[];
  /** 与水平线 y = threshold (m 或 c) 的交点 x 坐标列表 */
  intersectionRoots: number[];
  /** 不等号方向下的解集区间列表 */
  intervals: SolutionInterval[];
  /** 最小值/最大值等特征信息 */
  extremaInfo: {
    minVal: number | null;
    maxVal: number | null;
    minConditionFormula: string;
  };
  /** 是否处于无解/全集等退化临界状态 */
  isDegenerate: boolean;
  degenerateReason?: string;
}

/**
 * 求绝对值函数 y = f(x)
 * @param x 自变量 x
 * @param a 参数 a (点 A)
 * @param b 参数 b (点 B)
 * @param c 参数 c (单绝对值半径阈值)
 * @param mode 模式
 */
export function evalAbsoluteFunc(
  x: number,
  a: number,
  b: number,
  mode: InequalityMode,
): number {
  switch (mode) {
    case "single":
      return Math.abs(x - a);
    case "sum":
      return Math.abs(x - a) + Math.abs(x - b);
    case "diff":
      return Math.abs(x - a) - Math.abs(x - b);
    case "triangle":
      return Math.abs(x - a) + Math.abs(x - b);
    default:
      return Math.abs(x - a);
  }
}

/**
 * 完整解算绝对值不等式与几何特征
 */
export function solveAbsoluteInequality(
  a: number,
  b: number,
  c: number,
  m: number,
  x: number,
  mode: InequalityMode,
  ineqType: InequalityType,
): AbsoluteInequalityResult {
  const distA = Math.abs(x - a);
  const distB = Math.abs(x - b);
  const yVal = evalAbsoluteFunc(x, a, b, mode);

  const minA = Math.min(a, b);
  const maxA = Math.max(a, b);
  const distAB = Math.abs(a - b);

  let turningPoints: { x: number; y: number; label: string }[] = [];
  let intersectionRoots: number[] = [];
  let intervals: SolutionInterval[] = [];
  let minVal: number | null = null;
  let maxVal: number | null = null;
  let minConditionFormula = "";
  let isDegenerate = false;
  let degenerateReason = "";

  if (mode === "single") {
    turningPoints = [{ x: a, y: 0, label: `A(${a.toFixed(1)}, 0)` }];
    if (c < 0) {
      isDegenerate = true;
      degenerateReason = "半径 c < 0，绝对值不能为负";
      if (ineqType === "<=") {
        intervals = [];
      } else {
        intervals = [
          {
            x1: -Infinity,
            x2: Infinity,
            isLeftInfinity: true,
            isRightInfinity: true,
          },
        ];
      }
    } else if (c === 0) {
      intersectionRoots = [a];
      if (ineqType === "<=") {
        intervals = [{ x1: a, x2: a }];
      } else {
        intervals = [
          { x1: -Infinity, x2: a, isLeftInfinity: true },
          { x1: a, x2: Infinity, isRightInfinity: true },
        ];
      }
    } else {
      const r1 = a - c;
      const r2 = a + c;
      intersectionRoots = [r1, r2];
      if (ineqType === "<=") {
        intervals = [{ x1: r1, x2: r2 }];
      } else {
        intervals = [
          { x1: -Infinity, x2: r1, isLeftInfinity: true },
          { x1: r2, x2: Infinity, isRightInfinity: true },
        ];
      }
    }
    minVal = 0;
    minConditionFormula = `x = a = ${a.toFixed(1)}`;
  } else if (mode === "sum" || mode === "triangle") {
    const yAtMin = evalAbsoluteFunc(minA, a, b, "sum");
    const yAtMax = evalAbsoluteFunc(maxA, a, b, "sum");
    turningPoints = [
      {
        x: minA,
        y: yAtMin,
        label: `(${minA.toFixed(1)}, ${yAtMin.toFixed(1)})`,
      },
      {
        x: maxA,
        y: yAtMax,
        label: `(${maxA.toFixed(1)}, ${yAtMax.toFixed(1)})`,
      },
    ];
    minVal = distAB;
    minConditionFormula = `x \\in [${minA.toFixed(1)}, ${maxA.toFixed(1)}]`;

    if (m < distAB) {
      if (ineqType === "<=") {
        isDegenerate = true;
        degenerateReason = `m = ${m.toFixed(1)} < |a-b| = ${distAB.toFixed(1)}，解集为空集`;
        intervals = [];
      } else {
        intervals = [
          {
            x1: -Infinity,
            x2: Infinity,
            isLeftInfinity: true,
            isRightInfinity: true,
          },
        ];
      }
    } else if (Math.abs(m - distAB) < 1e-7) {
      intersectionRoots = [minA, maxA];
      if (ineqType === "<=") {
        intervals = [{ x1: minA, x2: maxA }];
      } else {
        intervals = [
          {
            x1: -Infinity,
            x2: Infinity,
            isLeftInfinity: true,
            isRightInfinity: true,
          },
        ];
      }
    } else {
      // m > distAB
      // 左侧 x < minA: -(x-a) - (x-b) = m => -2x + a + b = m => x = (a + b - m) / 2
      // 右侧 x > maxA: (x-a) + (x-b) = m => 2x - a - b = m => x = (a + b + m) / 2
      const r1 = (a + b - m) / 2;
      const r2 = (a + b + m) / 2;
      intersectionRoots = [r1, r2];

      if (ineqType === "<=") {
        intervals = [{ x1: r1, x2: r2 }];
      } else {
        intervals = [
          { x1: -Infinity, x2: r1, isLeftInfinity: true },
          { x1: r2, x2: Infinity, isRightInfinity: true },
        ];
      }
    }
  } else if (mode === "diff") {
    const yAtMin = evalAbsoluteFunc(minA, a, b, "diff");
    const yAtMax = evalAbsoluteFunc(maxA, a, b, "diff");
    turningPoints = [
      {
        x: minA,
        y: yAtMin,
        label: `(${minA.toFixed(1)}, ${yAtMin.toFixed(1)})`,
      },
      {
        x: maxA,
        y: yAtMax,
        label: `(${maxA.toFixed(1)}, ${yAtMax.toFixed(1)})`,
      },
    ];
    minVal = -distAB;
    maxVal = distAB;
    minConditionFormula = `x \\le ${minA.toFixed(1)} \\text{ 或 } x \\ge ${maxA.toFixed(1)}`;

    // |x-a| - |x-b| 的值域为 [-|a-b|, |a-b|]
    const lowerB = -distAB;
    const upperB = distAB;

    if (m < lowerB) {
      if (ineqType === "<=") {
        isDegenerate = true;
        degenerateReason = `m = ${m.toFixed(1)} < -|a-b|，解集为空集`;
        intervals = [];
      } else {
        intervals = [
          {
            x1: -Infinity,
            x2: Infinity,
            isLeftInfinity: true,
            isRightInfinity: true,
          },
        ];
      }
    } else if (m > upperB) {
      if (ineqType === "<=") {
        intervals = [
          {
            x1: -Infinity,
            x2: Infinity,
            isLeftInfinity: true,
            isRightInfinity: true,
          },
        ];
      } else {
        isDegenerate = true;
        degenerateReason = `m = ${m.toFixed(1)} > |a-b|，解集为空集`;
        intervals = [];
      }
    } else {
      // m 在 [-distAB, distAB] 之间
      // 分析 a 与 b 的大小顺序
      // 当 a < b 时，f(x) 是从 -distAB (x<=a) 递增到 +distAB (x>=b)，中间 x in (a,b): (x-a) - (b-x) = 2x - a - b
      // 2x - a - b = m => x = (a + b + m) / 2
      // 当 a > b 时，f(x) 是从 +distAB (x<=b) 递减到 -distAB (x>=a)，中间 x in (b,a): (a-x) - (x-b) = a + b - 2x
      // a + b - 2x = m => x = (a + b - m) / 2
      let root: number;
      if (a < b) {
        root = (a + b + m) / 2;
        intersectionRoots = [root];
        if (ineqType === "<=") {
          intervals = [{ x1: -Infinity, x2: root, isLeftInfinity: true }];
        } else {
          intervals = [{ x1: root, x2: Infinity, isRightInfinity: true }];
        }
      } else if (a > b) {
        root = (a + b - m) / 2;
        intersectionRoots = [root];
        if (ineqType === "<=") {
          intervals = [{ x1: root, x2: Infinity, isRightInfinity: true }];
        } else {
          intervals = [{ x1: -Infinity, x2: root, isLeftInfinity: true }];
        }
      } else {
        // a === b 时，f(x) === 0
        if (m === 0) {
          intervals = [
            {
              x1: -Infinity,
              x2: Infinity,
              isLeftInfinity: true,
              isRightInfinity: true,
            },
          ];
        } else if (m > 0) {
          intervals =
            ineqType === "<="
              ? [
                  {
                    x1: -Infinity,
                    x2: Infinity,
                    isLeftInfinity: true,
                    isRightInfinity: true,
                  },
                ]
              : [];
        } else {
          intervals =
            ineqType === ">="
              ? [
                  {
                    x1: -Infinity,
                    x2: Infinity,
                    isLeftInfinity: true,
                    isRightInfinity: true,
                  },
                ]
              : [];
        }
      }
    }
  }

  return {
    yVal,
    distA,
    distB,
    turningPoints,
    intersectionRoots,
    intervals,
    extremaInfo: {
      minVal,
      maxVal,
      minConditionFormula,
    },
    isDegenerate,
    degenerateReason,
  };
}
