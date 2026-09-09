/**
 * src/math/secondDerivative.ts
 * 二阶导数、拐点与凹凸性纯数学计算库
 * 零 React/DOM/Store 依赖，完全纯函数
 */

export type FnKey = "cubic" | "mixed" | "quartic";

export interface SecondDerivativeParams {
  a: number;
  b: number;
  c: number;
  d: number;
  x0: number;
  x1: number;
  x2: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface InflectionPointInfo {
  x: number;
  y: number;
  label: string;
  isTrueInflection: boolean;
  reason?: string;
}

export interface ExtremaPointInfo {
  x: number;
  y: number;
  type: "min" | "max";
  label: string;
}

export interface EvalResult {
  y: number;
  dy: number;
  ddy: number;
  /** 'concaveUp' 表示下凸（凹函数 f''>0）, 'concaveDown' 表示上凸（凸函数 f''<0）, 'flat' 表示二阶导为 0 */
  concavity: "concaveUp" | "concaveDown" | "flat";
}

export interface JensenResult {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  xMid: number;
  yCurveMid: number;
  yChordMid: number;
  diff: number; // yChordMid - yCurveMid
  isConvexUp: boolean; // 是否满足弦中点 >= 弧中点（下凸/凹函数）
}

/**
 * 计算给定 x 处原函数值、一阶导数值、二阶导数值
 */
export function evalFunction(
  fnKey: FnKey,
  params: SecondDerivativeParams,
  x: number,
): EvalResult {
  const { a, b, c, d } = params;
  let y = 0;
  let dy = 0;
  let ddy = 0;

  if (fnKey === "cubic") {
    // f(x) = a x^3 + b x^2 + c x + d
    y = a * Math.pow(x, 3) + b * Math.pow(x, 2) + c * x + d;
    dy = 3 * a * Math.pow(x, 2) + 2 * b * x + c;
    ddy = 6 * a * x + 2 * b;
  } else if (fnKey === "mixed") {
    // f(x) = a * x * e^x + b * x + c
    const expX = Math.exp(x);
    y = a * x * expX + b * x + c;
    dy = a * (x + 1) * expX + b;
    ddy = a * (x + 2) * expX;
  } else {
    // quartic: f(x) = a * x^4 + b * x^2 + c * x + d
    y = a * Math.pow(x, 4) + b * Math.pow(x, 2) + c * x + d;
    dy = 4 * a * Math.pow(x, 3) + 2 * b * x + c;
    ddy = 12 * a * Math.pow(x, 2) + 2 * b;
  }

  let concavity: "concaveUp" | "concaveDown" | "flat" = "flat";
  if (ddy > 1e-6) {
    concavity = "concaveUp";
  } else if (ddy < -1e-6) {
    concavity = "concaveDown";
  }

  return { y, dy, ddy, concavity };
}

/**
 * 求解拐点（及反例点）
 */
export function findInflectionPoints(
  fnKey: FnKey,
  params: SecondDerivativeParams,
): InflectionPointInfo[] {
  const { a, b } = params;
  const points: InflectionPointInfo[] = [];

  if (fnKey === "cubic") {
    if (Math.abs(a) > 1e-6) {
      // f''(x) = 6ax + 2b = 0 => x = -b / (3a)
      const xInf = -b / (3 * a);
      const res = evalFunction(fnKey, params, xInf);
      points.push({
        x: xInf,
        y: res.y,
        label: `拐点/对称中心 (${xInf.toFixed(2)}, ${res.y.toFixed(2)})`,
        isTrueInflection: true,
      });
    }
  } else if (fnKey === "mixed") {
    if (Math.abs(a) > 1e-6) {
      // f''(x) = a(x+2)e^x = 0 => x = -2
      const xInf = -2;
      const res = evalFunction(fnKey, params, xInf);
      points.push({
        x: xInf,
        y: res.y,
        label: `拐点 (-2, ${res.y.toFixed(2)})`,
        isTrueInflection: true,
      });
    }
  } else {
    // quartic: f''(x) = 12ax^2 + 2b = 0
    if (Math.abs(a) > 1e-6) {
      const val = -b / (6 * a);
      if (val > 1e-6) {
        const x1 = Math.sqrt(val);
        const x2 = -x1;
        const res1 = evalFunction(fnKey, params, x1);
        const res2 = evalFunction(fnKey, params, x2);
        points.push({
          x: x1,
          y: res1.y,
          label: `拐点 (${x1.toFixed(2)}, ${res1.y.toFixed(2)})`,
          isTrueInflection: true,
        });
        points.push({
          x: x2,
          y: res2.y,
          label: `拐点 (${x2.toFixed(2)}, ${res2.y.toFixed(2)})`,
          isTrueInflection: true,
        });
      } else if (Math.abs(val) <= 1e-6) {
        // b = 0, f''(0) = 0
        const res0 = evalFunction(fnKey, params, 0);
        points.push({
          x: 0,
          y: res0.y,
          label: `f''(0)=0 (非拐点反例)`,
          isTrueInflection: false,
          reason: `两侧 f''(x)=12ax^2 均为正，符号未改变`,
        });
      }
    }
  }

  return points;
}

/**
 * 求解极值点（支持三次、四次与混合函数，精准跟踪）
 */
export function findExtremaPoints(
  fnKey: FnKey,
  params: SecondDerivativeParams,
): ExtremaPointInfo[] {
  const { a, b, c } = params;
  const extrema: ExtremaPointInfo[] = [];

  // 通用单变量方程在区间 [xMin, xMax] 内的数值求根（网格扫描 + 二分法）
  const findRoots = (
    evalDeriv: (x: number) => number,
    xMin: number,
    xMax: number,
    steps = 120,
  ): number[] => {
    const roots: number[] = [];
    const dx = (xMax - xMin) / steps;
    let prevX = xMin;
    let prevVal = evalDeriv(prevX);

    for (let i = 1; i <= steps; i++) {
      const curX = xMin + i * dx;
      const curVal = evalDeriv(curX);

      if (Math.abs(curVal) < 1e-7) {
        roots.push(curX);
        prevX = curX;
        prevVal = curVal;
        continue;
      }

      if (prevVal * curVal < 0) {
        // 存在变号零点，二分法精化
        let left = prevX;
        let right = curX;
        for (let it = 0; it < 24; it++) {
          const mid = (left + right) / 2;
          const midVal = evalDeriv(mid);
          if (Math.abs(midVal) < 1e-8) {
            left = mid;
            break;
          }
          if (prevVal * midVal < 0) {
            right = mid;
          } else {
            left = mid;
            prevVal = midVal;
          }
        }
        const root = (left + right) / 2;
        // 避免邻近重复点
        if (!roots.some((r) => Math.abs(r - root) < 0.05)) {
          roots.push(root);
        }
      }
      prevX = curX;
      prevVal = curVal;
    }
    return roots;
  };

  if (fnKey === "cubic") {
    // f'(x) = 3ax^2 + 2bx + c = 0
    if (Math.abs(a) > 1e-6) {
      const delta = 4 * b * b - 12 * a * c;
      if (delta > 1e-6) {
        const x1 = (-2 * b + Math.sqrt(delta)) / (6 * a);
        const x2 = (-2 * b - Math.sqrt(delta)) / (6 * a);
        const roots = [x1, x2].sort((p, q) => p - q);

        roots.forEach((rx) => {
          const res = evalFunction(fnKey, params, rx);
          const type = res.ddy < 0 ? "max" : "min";
          extrema.push({
            x: rx,
            y: res.y,
            type,
            label: `${type === "max" ? "极大值点" : "极小值点"} (${rx.toFixed(2)}, ${res.y.toFixed(2)})`,
          });
        });
      }
    } else if (Math.abs(b) > 1e-6) {
      // 退化为二次函数：f'(x) = 2bx + c = 0 => x = -c / (2b)
      const xExt = -c / (2 * b);
      const res = evalFunction(fnKey, params, xExt);
      const type = res.ddy < 0 ? "max" : "min";
      extrema.push({
        x: xExt,
        y: res.y,
        type,
        label: `${type === "max" ? "极大值点" : "极小值点"} (${xExt.toFixed(2)}, ${res.y.toFixed(2)})`,
      });
    }
  } else if (fnKey === "mixed") {
    // f'(x) = a(x+1)e^x + b = 0
    if (Math.abs(a) > 1e-6) {
      const deriv = (x: number) => a * (x + 1) * Math.exp(x) + b;
      const roots = findRoots(deriv, -5.5, 4.5);
      roots.forEach((rx) => {
        const res = evalFunction(fnKey, params, rx);
        // 若二阶导大于0为极小值，小于0为极大值
        const type = res.ddy < 0 ? "max" : "min";
        extrema.push({
          x: rx,
          y: res.y,
          type,
          label: `${type === "max" ? "极大值点" : "极小值点"} (${rx.toFixed(2)}, ${res.y.toFixed(2)})`,
        });
      });
    }
  } else {
    // quartic: f'(x) = 4ax^3 + 2bx + c = 0
    if (Math.abs(a) > 1e-6 || Math.abs(b) > 1e-6) {
      const deriv = (x: number) => 4 * a * Math.pow(x, 3) + 2 * b * x + c;
      const roots = findRoots(deriv, -5.5, 5.5);
      roots.forEach((rx) => {
        const res = evalFunction(fnKey, params, rx);
        let type: "min" | "max" = "min";
        if (res.ddy > 1e-5) {
          type = "min";
        } else if (res.ddy < -1e-5) {
          type = "max";
        } else {
          // 二阶导接近 0，检测一阶导变号
          const dLeft = deriv(rx - 0.05);
          const dRight = deriv(rx + 0.05);
          type = dLeft > 0 && dRight < 0 ? "max" : "min";
        }
        extrema.push({
          x: rx,
          y: res.y,
          type,
          label: `${type === "max" ? "极大值点" : "极小值点"} (${rx.toFixed(2)}, ${res.y.toFixed(2)})`,
        });
      });
    }
  }

  return extrema;
}

/**
 * 琴生不等式割线中点与弧中点对比
 */
export function evalJensen(
  fnKey: FnKey,
  params: SecondDerivativeParams,
  x1: number,
  x2: number,
): JensenResult {
  const p1 = evalFunction(fnKey, params, x1);
  const p2 = evalFunction(fnKey, params, x2);

  const xMid = (x1 + x2) / 2;
  const pMid = evalFunction(fnKey, params, xMid);

  const yChordMid = (p1.y + p2.y) / 2;
  const yCurveMid = pMid.y;
  const diff = yChordMid - yCurveMid;

  return {
    x1,
    y1: p1.y,
    x2,
    y2: p2.y,
    xMid,
    yCurveMid,
    yChordMid,
    diff,
    isConvexUp: diff >= 0,
  };
}
